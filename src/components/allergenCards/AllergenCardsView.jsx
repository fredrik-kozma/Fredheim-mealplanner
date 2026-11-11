import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import PageHeader from '../common/PageHeader'
import AllergenGlyph from './AllergenGlyph'
import { ALLERGEN_CARD_CSS } from '../../utils/allergenCardCss.js'
import {
  pagesOf,
  printablePages,
  fillSlots,
  setSlot,
  removeSlot,
  PER_PAGE,
  CARD_TYPE,
} from '../../utils/allergenCardModel.js'
import {
  CEREAL_CODES,
  NUT_CODES,
  SIMPLE_BEFORE_NUTS,
  SIMPLE_AFTER_NUTS,
  cardStatements,
  sanitizeHits,
} from '../../data/euAllergens.js'
import { detectRecipeAllergens, applyAllergenOverride } from '../../data/allergenCardMap.js'
import { deliverAllergenCards } from '../../utils/printAllergenCards.js'
import { isNativePlatform } from '../../utils/nativePlatform.js'

const CARD_LANGS = [
  { code: 'no', label: 'Norsk' },
  { code: 'sv', label: 'Svenska' },
  { code: 'en', label: 'English' },
]

function appLang(code) {
  const lang = String(code || 'no').slice(0, 2)
  return lang === 'en' || lang === 'sv' ? lang : 'no'
}

function titleOf(recipe, lang) {
  return recipe?.translations?.[lang]?.title || recipe?.title || ''
}

function buildLabels(t) {
  return {
    cereal: t('allergenCards.cereal'),
    nuts: t('allergenCards.nuts'),
    cereals: Object.fromEntries(CEREAL_CODES.map((id) => [id, t(`allergenCards.cereals.${id}`)])),
    nutNames: Object.fromEntries(NUT_CODES.map((id) => [id, t(`allergenCards.nutNames.${id}`)])),
    crustaceans: t('allergenCards.items.crustaceans'),
    eggs: t('allergenCards.items.eggs'),
    fish: t('allergenCards.items.fish'),
    peanuts: t('allergenCards.items.peanuts'),
    soy: t('allergenCards.items.soy'),
    milk: t('allergenCards.items.milk'),
    celery: t('allergenCards.items.celery'),
    mustard: t('allergenCards.items.mustard'),
    sesame: t('allergenCards.items.sesame'),
    sulphites: t('allergenCards.items.sulphites'),
    lupin: t('allergenCards.items.lupin'),
    molluscs: t('allergenCards.items.molluscs'),
    none: t('allergenCards.none'),
    review: (key, name) => t(`allergenCards.review.${key}`, { name }),
  }
}

function sameHits(a, b) {
  return sanitizeHits(a).join('|') === sanitizeHits(b).join('|')
}

/**
 * Largest name size that still fits on two lines, then the largest allergen
 * size that fills the space underneath. Inline sizes travel with the DOM
 * into the print window, so the sheet and the printout match.
 */
function fitCardFace(root) {
  const nameEl = root.querySelector('.allergen-name')
  const linesEl = root.querySelector('.allergen-lines')
  if (!nameEl || !linesEl || linesEl.clientHeight < 8) return

  nameEl.style.display = 'block'
  nameEl.style.webkitLineClamp = 'unset'
  nameEl.style.overflow = 'visible'
  let namePt = CARD_TYPE.nameMaxPt
  while (namePt > CARD_TYPE.nameMinPt) {
    nameEl.style.fontSize = `${namePt}pt`
    const lineHeight = parseFloat(getComputedStyle(nameEl).lineHeight) || namePt * 1.35
    if (nameEl.scrollHeight <= lineHeight * 2.08 + 1) break
    namePt -= 0.5
  }
  nameEl.style.fontSize = `${namePt}pt`
  nameEl.style.display = '-webkit-box'
  nameEl.style.webkitBoxOrient = 'vertical'
  nameEl.style.webkitLineClamp = '2'
  nameEl.style.overflow = 'hidden'

  let allergenPt = CARD_TYPE.allergenMaxPt
  while (allergenPt > CARD_TYPE.allergenMinPt) {
    linesEl.style.fontSize = `${allergenPt}pt`
    if (linesEl.scrollHeight <= linesEl.clientHeight + 1) break
    allergenPt -= 0.4
  }
  linesEl.style.fontSize = `${Math.max(allergenPt, CARD_TYPE.allergenMinPt)}pt`
}

function CardFace({ title, imageUrl, lines, notes, none, noneText }) {
  const faceRef = useRef(null)
  const lineKey = lines.map((line) => line.text).join('\n')
  const noteKey = notes.join('\n')

  useLayoutEffect(() => {
    const root = faceRef.current
    if (!root) return undefined
    let cancelled = false
    const run = () => {
      if (!cancelled && faceRef.current) fitCardFace(faceRef.current)
    }
    run()
    const ready = document.fonts?.ready
    if (ready) ready.then(run)
    return () => { cancelled = true }
  }, [title, lineKey, noteKey, none, noneText])

  return (
    <span className="allergen-face" ref={faceRef}>
      {imageUrl
        ? <img className="allergen-bg" src={imageUrl} alt="" />
        : <span className="allergen-bg-empty" aria-hidden="true" />}
      <span className="allergen-veil" aria-hidden="true" />
      <img className="allergen-logo" src="/fredheim-logo.png" alt="" />
      <span className="allergen-copy">
        <span className="allergen-name">{title}</span>
        <span className="allergen-lines">
          {none && (
            <span className="allergen-none">
              <AllergenGlyph name="check" className="allergen-ico" />
              <span>{noneText}</span>
            </span>
          )}
          {lines.map((line) => (
            <span className="allergen-line" key={line.text}>
              <AllergenGlyph name={line.icon} className="allergen-ico" />
              <span>{line.text}</span>
            </span>
          ))}
          {notes.map((note) => (
            <span className="allergen-line allergen-review" key={note}>
              <AllergenGlyph name="alert" className="allergen-ico" />
              <span>{note}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}

function SheetFrame({ pages, children }) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const measure = () => {
      const pagePx = (210 * 96) / 25.4
      const next = Math.min(1, Math.max(0.35, (el.clientWidth - 4) / pagePx))
      setScale(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pagePx = (210 * 96) / 25.4
  const pageH = (297 * 96) / 25.4
  const natural = pages * pageH + Math.max(0, pages - 1) * 16
  return (
    <div ref={wrapRef} className="overflow-x-hidden pb-8">
      <div style={{ width: pagePx * scale, height: natural * scale, margin: '0 auto' }}>
        <div style={{ width: pagePx, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function PickerDialog({ mode, recipes, cardLang, labels, onSheet, onClose, onChoose, onAddMany }) {
  const { t } = useTranslation()
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState([])
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((recipe) => {
      if (!q) return true
      const hay = [recipe.title, recipe.translations?.no?.title, recipe.translations?.sv?.title]
        .filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [recipes, query])

  const sheetSet = useMemo(() => new Set(onSheet), [onSheet])

  function toggle(id) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((item) => item !== id) : [...cur, id]))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center allergen-no-print">
      <div className="absolute inset-0 scrim" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative z-10 sheet sm:max-w-lg w-full flex flex-col sheet-max-h">
        <div className="px-4 pt-4 pb-2">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {mode === 'multi' ? t('allergenCards.multiTitle') : t('allergenCards.pickTitle')}
          </h2>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('allergenCards.search')}
            className="mt-3 w-full min-h-[44px] rounded-control border border-slate-200 px-3 text-sm"
          />
          {mode === 'multi' && (
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setPicked(filtered.map((recipe) => recipe.id))}>
                {t('allergenCards.selectAll')}
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setPicked([])}>
                {t('allergenCards.clear')}
              </button>
            </div>
          )}
        </div>
        <ul className="overflow-y-auto px-2 pb-2 flex-1">
          {filtered.length === 0 && (
            <li className="px-2 py-6 text-sm text-slate-500 text-center">{t('allergenCards.emptyPicker')}</li>
          )}
          {filtered.map((recipe) => {
            const detected = detectRecipeAllergens(recipe)
            const statement = cardStatements(detected, labels, cardLang)
            const summary = statement.none
              ? labels.none
              : [...statement.lines.map((line) => line.text), ...statement.notes].join(' · ')
            const title = titleOf(recipe, cardLang)
            return (
              <li key={recipe.id}>
                {mode === 'multi' ? (
                  <label className="flex items-center gap-3 px-2 py-2 rounded-control hover:bg-slate-50 cursor-pointer min-h-[52px]">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-[#1B7A3A]"
                      checked={picked.includes(recipe.id)}
                      onChange={() => toggle(recipe.id)}
                    />
                    <RecipeRow recipe={recipe} title={title} summary={summary} onSheet={sheetSet.has(recipe.id)} />
                  </label>
                ) : (
                  <button type="button" className="w-full flex items-center gap-3 px-2 py-2 rounded-control hover:bg-slate-50 text-left min-h-[52px]" onClick={() => onChoose(recipe.id)}>
                    <RecipeRow recipe={recipe} title={title} summary={summary} onSheet={sheetSet.has(recipe.id)} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        {mode === 'multi' && (
          <div className="p-3 border-t border-slate-100">
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!picked.length}
              onClick={() => onAddMany(picked)}
            >
              {t('allergenCards.addSelected', { count: picked.length })}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RecipeRow({ recipe, title, summary, onSheet }) {
  const { t } = useTranslation()
  return (
    <>
      {recipe.imageUrl
        ? <img src={recipe.imageUrl} alt="" className="w-12 h-12 rounded-small object-cover flex-shrink-0" />
        : <span className="w-12 h-12 rounded-small bg-emerald-50 text-emerald-800 flex items-center justify-center font-semibold flex-shrink-0">{title.slice(0, 1)}</span>}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900 truncate">{title}</span>
        <span className="block text-xs text-slate-500 truncate">{summary}</span>
        {onSheet && <span className="block text-2xs text-emerald-700">{t('allergenCards.already')}</span>}
      </span>
    </>
  )
}

function EditorDialog({ recipe, detected, activeHits, cardLang, labels, onToggle, onReset, onRemove, onSwap, onClose }) {
  const { t } = useTranslation()
  const titleId = useId()
  const statement = cardStatements(
    { hits: activeHits, reviews: [], unmapped: [] },
    labels,
    cardLang,
  )
  const overridden = !sameHits(activeHits, detected.hits)
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const groups = [
    {
      title: t('allergenCards.cerealGroup'),
      items: CEREAL_CODES.map((id) => ({ code: `cereal:${id}`, label: labels.cereals[id] })),
    },
    {
      title: t('allergenCards.otherGroup'),
      items: [...SIMPLE_BEFORE_NUTS, ...SIMPLE_AFTER_NUTS].map((code) => ({ code, label: labels[code] })),
    },
    {
      title: t('allergenCards.nutsGroup'),
      items: NUT_CODES.map((id) => ({ code: `nut:${id}`, label: labels.nutNames[id] })),
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 scrim" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative z-10 sheet sm:max-w-lg w-full flex flex-col sheet-max-h">
        <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 truncate">
              {recipe ? titleOf(recipe, cardLang) : t('allergenCards.missing')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {overridden ? t('allergenCards.corrected') : t('allergenCards.suggestion')}
              {statement.none ? ` · ${labels.none}` : ''}
            </p>
          </div>
          <button type="button" className="btn-ghost btn-sm" onClick={onClose}>{t('allergenCards.close')}</button>
        </div>
        <div className="overflow-y-auto px-4 pb-3">
          {recipe && (
            <>
              <p className="text-xs text-slate-500 mb-2">{t('allergenCards.groupsHelp')}</p>
              {groups.map((group) => (
                <fieldset key={group.title} className="mb-3">
                  <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{group.title}</legend>
                  <div className="grid grid-cols-2 gap-x-3">
                    {group.items.map((item) => (
                      <label key={item.code} className="flex items-center gap-2 min-h-[44px] text-sm text-slate-800">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-[#1B7A3A]"
                          checked={activeHits.includes(item.code)}
                          onChange={() => onToggle(item.code)}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              {(detected.reviews.length > 0 || detected.unmapped.length > 0) && (
                <div className="rounded-control bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-950">
                  <p className="font-semibold mb-1">{t('allergenCards.reviewHeading')}</p>
                  <ul className="space-y-1">
                    {cardStatements(detected, labels, cardLang).notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-3 border-t border-slate-100 flex flex-wrap gap-2">
          {recipe && (
            <button type="button" className="btn-secondary btn-sm" onClick={onSwap}>{t('allergenCards.swap')}</button>
          )}
          {overridden && (
            <button type="button" className="btn-secondary btn-sm" onClick={onReset}>{t('allergenCards.reset')}</button>
          )}
          <button type="button" className="btn-danger btn-sm ml-auto" onClick={onRemove}>{t('allergenCards.remove')}</button>
        </div>
      </div>
    </div>
  )
}

export default function AllergenCardsView() {
  const { t, i18n } = useTranslation()
  const recipes = useStore((s) => s.recipes)
  const slots = useStore((s) => s.allergenCardSlots)
  const setSlots = useStore((s) => s.setAllergenCardSlots)
  const overrides = useStore((s) => s.allergenCardOverrides) || {}
  const setOverride = useStore((s) => s.setAllergenCardOverride)
  const clearOverride = useStore((s) => s.clearAllergenCardOverride)
  const printRef = useRef(null)
  const [cardLangChoice, setCardLangChoice] = useState(null)
  const [picker, setPicker] = useState(null)
  const [editorIndex, setEditorIndex] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const cardLang = cardLangChoice || appLang(i18n.language)
  const labels = useMemo(() => buildLabels(i18n.getFixedT(cardLang)), [i18n, cardLang])
  const pages = pagesOf(slots)
  const byId = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes])
  const flat = pages.flat()
  const onSheet = flat.filter(Boolean)

  function cardFor(recipeId) {
    const recipe = byId.get(recipeId)
    if (!recipe) {
      return {
        title: t('allergenCards.missing'),
        imageUrl: '',
        lines: [],
        notes: [],
        none: false,
        noneText: labels.none,
        missing: true,
      }
    }
    const detected = detectRecipeAllergens(recipe)
    const effective = applyAllergenOverride(detected, overrides[recipe.id])
    const statement = cardStatements(effective, labels, cardLang)
    return {
      title: titleOf(recipe, cardLang),
      imageUrl: recipe.imageUrl || '',
      lines: statement.lines,
      notes: statement.notes,
      none: statement.none,
      noneText: labels.none,
      missing: false,
    }
  }

  async function print() {
    const printed = printablePages(slots)
    if (!printed.length || busy) return
    setBusy(true)
    setMessage(null)
    try {
      const modelPages = printed.map((page) => page.map((id) => (id ? cardFor(id) : null)))
      const result = await deliverAllergenCards({
        native: isNativePlatform(),
        rootEl: printRef.current,
        title: t('allergenCards.sheetTitle'),
        filename: `allergenkort-${cardLang}.pdf`,
        pages: modelPages,
        meta: {
          headerLeft: `Fredheim · ${t('allergenCards.sheetTitle', { lng: cardLang })}`,
          headerRight: new Date().toLocaleDateString(cardLang === 'en' ? 'en-GB' : cardLang === 'sv' ? 'sv-SE' : 'nb-NO'),
          disclaimer: t('allergenCards.disclaimer', { lng: cardLang }),
        },
      })
      if (result === 'failed') setMessage(t('allergenCards.printFailed'))
    } catch (err) {
      console.error(err)
      setMessage(t('allergenCards.printFailed'))
    } finally {
      setBusy(false)
    }
  }

  const editorId = editorIndex != null ? flat[editorIndex] : null
  const editorRecipe = editorId ? byId.get(editorId) : null
  const editorDetected = editorRecipe ? detectRecipeAllergens(editorRecipe) : { hits: [], reviews: [], unmapped: [] }
  const editorHits = editorRecipe
    ? (overrides[editorRecipe.id]?.hits ? sanitizeHits(overrides[editorRecipe.id].hits) : editorDetected.hits)
    : []

  const dateLabel = new Date().toLocaleDateString(cardLang === 'en' ? 'en-GB' : cardLang === 'sv' ? 'sv-SE' : 'nb-NO')

  return (
    <div className="max-w-5xl mx-auto pb-nav lg:pb-8">
      <style>{ALLERGEN_CARD_CSS}</style>
      <div className="allergen-no-print">
        <PageHeader
          title={t('allergenCards.title')}
          subtitle={t('allergenCards.subtitle')}
          actions={(
            <button
              type="button"
              className="btn-primary"
              data-testid="allergen-print"
              disabled={busy || onSheet.length === 0}
              onClick={print}
            >
              {isNativePlatform() ? t('allergenCards.printShare') : t('allergenCards.print')}
            </button>
          )}
        />
        <div className="px-4 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">{t('allergenCards.language')}</p>
            <div className="flex gap-2" role="group" aria-label={t('allergenCards.language')}>
              {CARD_LANGS.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  aria-pressed={cardLang === lang.code}
                  onClick={() => setCardLangChoice(lang.code)}
                  className={`tap-target px-3 py-1.5 rounded-full border text-sm font-medium ${
                    cardLang === lang.code
                      ? 'border-[#1B7A3A] bg-[#e7f6ec] text-[#14532d]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            data-testid="allergen-add-multiple"
            onClick={() => setPicker({ mode: 'multi' })}
          >
            {t('allergenCards.addMultiple')}
          </button>
        </div>
        {message && <p className="px-4 pb-2 text-sm text-red-700">{message}</p>}
        <p className="px-4 pb-3 text-xs text-slate-500">{t('allergenCards.printHint')}</p>
      </div>

      <SheetFrame pages={pages.length}>
        <div ref={printRef} className="allergen-print-area" data-testid="allergen-sheet">
          {pages.map((page, pageIndex) => {
            const blank = page.every((id) => !id)
            const filledTotal = pages.filter((item) => item.some(Boolean)).length
            const filledNumber = pages.slice(0, pageIndex + 1).filter((item) => item.some(Boolean)).length
            return (
              <section key={pageIndex} className={`allergen-page${blank ? ' allergen-page-blank' : ''}`}>
                <header className="allergen-page-head">
                  <span>
                    <img src="/fredheim-logo.png" alt="" />
                    Fredheim · {t('allergenCards.sheetTitle', { lng: cardLang })}
                  </span>
                  <span>
                    {!blank && filledTotal > 1
                      ? `${t('allergenCards.pageOf', { n: filledNumber, total: filledTotal, lng: cardLang })} · `
                      : ''}
                    {dateLabel}
                  </span>
                </header>
                <div className="allergen-grid">
                  {page.map((recipeId, slotIndex) => {
                    const index = pageIndex * PER_PAGE + slotIndex
                    if (!recipeId) {
                      return (
                        <div className="allergen-slot" key={slotIndex}>
                          <button
                            type="button"
                            className="allergen-empty"
                            data-testid="allergen-slot-empty"
                            aria-label={t('allergenCards.emptySlot')}
                            onClick={() => setPicker({ mode: 'single', index })}
                          >
                            <span className="allergen-plus" aria-hidden="true">+</span>
                          </button>
                        </div>
                      )
                    }
                    const face = cardFor(recipeId)
                    return (
                      <div className="allergen-slot" key={slotIndex}>
                        <button
                          type="button"
                          className="allergen-card"
                          data-testid="allergen-slot-filled"
                          aria-label={t('allergenCards.filledSlot', { name: face.title })}
                          onClick={() => setEditorIndex(index)}
                        >
                          <CardFace {...face} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <p className="allergen-disclaimer">{t('allergenCards.disclaimer', { lng: cardLang })}</p>
              </section>
            )
          })}
        </div>
      </SheetFrame>

      {picker && (
        <PickerDialog
          mode={picker.mode}
          recipes={[...recipes].sort((a, b) => titleOf(a, cardLang).localeCompare(titleOf(b, cardLang), cardLang))}
          cardLang={cardLang}
          labels={labels}
          onSheet={onSheet}
          onClose={() => setPicker(null)}
          onChoose={(recipeId) => {
            setSlots(setSlot(slots, picker.index, recipeId))
            setPicker(null)
          }}
          onAddMany={(ids) => {
            setSlots(fillSlots(slots, ids))
            setPicker(null)
          }}
        />
      )}

      {editorIndex != null && (
        <EditorDialog
          recipe={editorRecipe}
          detected={editorDetected}
          activeHits={editorHits}
          cardLang={cardLang}
          labels={labels}
          onClose={() => setEditorIndex(null)}
          onRemove={() => {
            setSlots(removeSlot(slots, editorIndex))
            setEditorIndex(null)
          }}
          onSwap={() => {
            const index = editorIndex
            setEditorIndex(null)
            setPicker({ mode: 'single', index })
          }}
          onReset={() => editorRecipe && clearOverride(editorRecipe.id)}
          onToggle={(code) => {
            if (!editorRecipe) return
            const next = editorHits.includes(code)
              ? editorHits.filter((hit) => hit !== code)
              : [...editorHits, code]
            if (sameHits(next, editorDetected.hits)) clearOverride(editorRecipe.id)
            else setOverride(editorRecipe.id, next)
          }}
        />
      )}
    </div>
  )
}

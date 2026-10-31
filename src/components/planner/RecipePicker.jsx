import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { BUILT_IN_PACKS } from '../../data/installedPacks'
import { CONDITION_TAGS } from '../../data/conditionTags'
import { isFmdRecipe } from '../../utils/recipeFlags'
import { recipeHasAvoidedAllergen } from '../../data/allergens'
import { buildSearchEntry, matchSearchEntry } from '../../utils/recipeSearch'

// Scrim left above the sheet on a phone: enough to see it's a sheet and tap out.
const PHONE_TOP_GAP = 32

/*
 * The part of the screen the keyboard leaves free. dvh ignores the keyboard
 * on Android and iOS, so without this the end of the list sits behind it.
 */
function useVisibleViewport() {
  const read = () => {
    const vv = window.visualViewport
    return { height: vv ? vv.height : window.innerHeight, offsetTop: vv ? vv.offsetTop : 0 }
  }
  const [size, setSize] = useState(read)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setSize(read())
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return size
}

/*
 * `onSelectMany` enables picking several recipes in one visit. Filling a
 * Monday breakfast with three things otherwise meant opening this sheet
 * three times, re-applying filters each round.
 *
 * Two ways in, because neither alone covers both input styles: a
 * "Select several" button (visible, so desktop users can find it) and a
 * long-press on any recipe (the gesture people expect on a phone, and it
 * selects the recipe you were holding). Single tap is untouched — it
 * still adds one recipe and closes — so the common case costs nothing.
 *
 * Callers without `onSelectMany` keep single-select only.
 */
export default function RecipePicker({ onSelect, onSelectMany, onAddCustom, onClose, title }) {
  const { t, i18n } = useTranslation()
  const recipes = useStore(s => s.recipes)
  const recipeCategories = useStore(s => s.recipeCategories)
  const installedPacks = useStore(s => s.installedPacks)
  const avoidedAllergens = useStore(s => s.avoidedAllergens) || []
  const favoriteRecipes = useStore(s => s.favoriteRecipes)
  const allergenFilterPaused = useStore(s => s.allergenFilterPaused)
  const allergenActive = avoidedAllergens.length > 0 && !allergenFilterPaused
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [activePack, setActivePack] = useState('All')
  // Conditions AND-combined; empty = no filter.
  const [activeConditions, setActiveConditions] = useState([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const favSet = useMemo(() => new Set(favoriteRecipes || []), [favoriteRecipes])
  const toggleCondition = (id) => setActiveConditions(prev =>
    prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  // Phone only: the chip rows fold behind one button so the keyboard leaves
  // room for results. Going back to the search box folds them again.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const viewport = useVisibleViewport()
  const toggleFilters = () => {
    searchRef.current?.blur()
    setFiltersOpen(v => !v)
  }

  // New results start at the top, right under the search box.
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0
  }, [search])

  // Same search as the recipes page: titles and ingredients in every
  // language. The index is rebuilt with the recipes, not on each keystroke.
  const searchIndex = useMemo(() => {
    const idx = new Map()
    for (const r of recipes) idx.set(r.id, buildSearchEntry(r, currentLang))
    return idx
  }, [recipes, currentLang])
  const searchMatches = useMemo(() => {
    const out = new Map()
    if (!search.trim()) return out
    for (const r of recipes) {
      const m = matchSearchEntry(searchIndex.get(r.id), search)
      if (m) out.set(r.id, m)
    }
    return out
  }, [recipes, searchIndex, search])

  // ── multi-select ────────────────────────────────────────────────────────
  const canMulti = typeof onSelectMany === 'function'
  const [multi, setMulti] = useState(false)
  const [selected, setSelected] = useState([])
  // A long-press fires on pointerup as a click too. This flag swallows that
  // one click so holding a recipe doesn't also add-and-close it.
  const longPressFired = useRef(false)
  const pressTimer = useRef(null)

  const toggleSelected = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const exitMulti = () => { setMulti(false); setSelected([]) }

  const startPress = (id) => {
    if (!canMulti || multi) return
    longPressFired.current = false
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true
      setMulti(true)
      setSelected([id])
    }, 450)
  }
  const cancelPress = () => clearTimeout(pressTimer.current)
  useEffect(() => () => clearTimeout(pressTimer.current), [])

  const handleRowClick = (id) => {
    if (longPressFired.current) { longPressFired.current = false; return }
    if (multi) { toggleSelected(id); return }
    onSelect(id)
    onClose()
  }

  const confirmMany = () => {
    if (selected.length === 0) return
    onSelectMany(selected)
    onClose()
  }

  // ── your own item ───────────────────────────────────────────────────────
  // Offered off the search box rather than as a separate screen: by the
  // time you've typed "Pizza" and found nothing, you've already said what
  // you want. The amount is a second, optional field so it can flow to the
  // shopping list the way "Legg til vare" does.
  const canAddCustom = typeof onAddCustom === 'function'
  const [customAmount, setCustomAmount] = useState('')
  const submitCustom = () => {
    const name = search.trim()
    if (!name) return
    onAddCustom(name, customAmount.trim())
    onClose()
  }

  // Build the pack options once per render — only show packs that actually
  // have installed recipes, plus a "My recipes" bucket for non-pack ones.
  const packOptions = useMemo(() => {
    const counts = {}
    let userRecipeCount = 0
    for (const r of recipes) {
      if (r.sourcePackId) counts[r.sourcePackId] = (counts[r.sourcePackId] || 0) + 1
      else userRecipeCount++
    }
    const opts = []
    for (const [packId, info] of Object.entries(installedPacks || {})) {
      if (!counts[packId]) continue
      const pack = BUILT_IN_PACKS[packId] || info
      const localized = pack?.translations?.[currentLang]?.name
      opts.push({ id: packId, label: localized || pack?.name || packId, count: counts[packId] })
    }
    opts.sort((a, b) => a.label.localeCompare(b.label))
    if (userRecipeCount > 0) {
      opts.push({ id: '__user__', label: t('recipes.myRecipes', { defaultValue: 'My recipes' }), count: userRecipeCount })
    }
    return opts
  }, [recipes, installedPacks, currentLang, t])

  const pickerTitle = title || t('recipePicker.title')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = recipes
    .filter(r => !favoritesOnly || favSet.has(r.id))
    .filter(r => activeCategory === 'All' || r.category === activeCategory)
    .filter(r => activeConditions.every(c => (r.tags || []).includes(c)))
    // Allergen profile applies here too — you shouldn't be able to plan a
    // meal containing something the household avoids.
    .filter(r => !allergenActive || !recipeHasAvoidedAllergen(r, avoidedAllergens))
    .filter(r => {
      if (activePack === 'All') return true
      if (activePack === '__user__') return !r.sourcePackId
      return r.sourcePackId === activePack
    })
    .filter(r => !search.trim() || searchMatches.has(r.id))

  // A dish called "Brokkolisuppe" goes above one that merely contains broccoli.
  if (search.trim()) {
    const titleRank = r => (searchMatches.get(r.id)?.inTitle ? 0 : 1)
    filtered.sort((a, b) => titleRank(a) - titleRank(b))
  }

  const categories = ['All', ...recipeCategories.filter(c => recipes.some(r => r.category === c))]

  // What's on while the rows are folded, each with its own way to turn off.
  const activeFilters = [
    ...(activePack !== 'All'
      ? [{ key: 'pack', label: packOptions.find(o => o.id === activePack)?.label || activePack, clear: () => setActivePack('All') }]
      : []),
    ...activeConditions.map(c => ({
      key: `condition-${c}`,
      label: t(`conditions.${c}`, { defaultValue: c }),
      clear: () => toggleCondition(c),
    })),
    ...(activeCategory !== 'All'
      ? [{ key: 'category', label: t(`categories.${activeCategory}`, { defaultValue: activeCategory }), clear: () => setActiveCategory('All') }]
      : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 scrim" onClick={onClose} />

      {/* Sheet. On a phone its height comes from the screen, never from the
          results, so it stays put as a search narrows them: top edge fixed,
          bottom edge on the keyboard. */}
      <div
        className="relative z-10 sheet sm:max-w-md sheet-max-h pb-[env(safe-area-inset-bottom)] flex flex-col max-sm:mt-[var(--picker-top)] max-sm:h-[var(--picker-height)] max-sm:max-h-none"
        style={{
          '--picker-top': `${viewport.offsetTop + PHONE_TOP_GAP}px`,
          '--picker-height': `${viewport.height - PHONE_TOP_GAP}px`,
        }}
      >
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 gap-2">
          <h2 className="section-title min-w-0 truncate">{pickerTitle}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canMulti && (
              <button
                onClick={() => (multi ? exitMulti() : setMulti(true))}
                className="btn-secondary btn-sm"
                aria-pressed={multi}
              >
                {multi
                  ? t('common.cancel', { defaultValue: 'Cancel' })
                  : t('recipePicker.selectSeveral', { defaultValue: 'Select several' })}
              </button>
            )}
            <button onClick={onClose} className="btn-ghost btn-icon -mr-1.5 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search + favourites */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2 sm:pb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={searchRef}
                type="search"
                placeholder={t('recipePicker.searchPlaceholder')}
                value={search}
                onChange={e => { setSearch(e.target.value); setFiltersOpen(false) }}
                onFocus={() => setFiltersOpen(false)}
                className="input pl-9"
                autoFocus
              />
            </div>
            {/* Same heart as the recipes page, in the same place relative
                to the search box — building a week from the dishes you
                already like is the common case, and it was the one filter
                this screen didn't offer. Local state, like every other
                filter here: the picker is a modal you open, use and close,
                not a view you come back to. */}
            <button
              onClick={() => setFavoritesOnly(v => !v)}
              className={`tap-target flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-control border transition-colors ${
                favoritesOnly
                  ? 'bg-rose-50 border-rose-300 text-rose-500'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-rose-400 hover:border-rose-200'
              }`}
              title={favoritesOnly
                ? t('favorites.showAll', { defaultValue: 'Show all recipes' })
                : t('favorites.showOnly', { defaultValue: 'Show favorites only' })}
              aria-pressed={favoritesOnly}
            >
              {favoritesOnly ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Phone: the button that unfolds the chip rows, and pills for what
            is on while they're folded. */}
        <div
          className="sm:hidden flex flex-shrink-0 items-center gap-2 overflow-x-auto px-4 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            onClick={toggleFilters}
            aria-expanded={filtersOpen}
            className={filtersOpen ? 'chip-active' : 'chip'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M7 12h10M10.5 19h3" />
            </svg>
            {t('recipePicker.filters', { defaultValue: 'Filters' })}
            {activeFilters.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-primary-600 text-white text-2xs font-semibold tabular-nums">
                {activeFilters.length}
              </span>
            )}
          </button>
          {!filtersOpen && activeFilters.map(f => (
            <button
              key={f.key}
              onClick={f.clear}
              aria-label={t('recipePicker.removeFilter', { label: f.label, defaultValue: 'Remove filter: {{label}}' })}
              className="chip-active"
            >
              {f.label}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>

        <div className={`flex-shrink-0 ${filtersOpen ? '' : 'max-sm:hidden'}`}>
        {/* Pack chips — only shown when more than one bucket exists.
            The chip looks pixel-identical in every state, with no
            auto-scroll: only the colour changes when selected. */}
        {packOptions.length > 1 && (
          <div
            className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pt-1 pb-2"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => setActivePack('All')}
              className={activePack === 'All' ? 'chip-active' : 'chip'}
            >
              {t('recipes.allPacks', { defaultValue: 'All packs' })}
            </button>
            {packOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setActivePack(opt.id)}
                className={activePack === opt.id ? 'chip-active' : 'chip'}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Condition chips — filter by health condition, same set as the
            main recipes page so a guest can build their week filtered. */}
        <div
          className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pt-2 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          <button
            onClick={() => setActiveConditions([])}
            className={activeConditions.length === 0 ? 'chip-active' : 'chip'}
          >
            {t('conditions.all', { defaultValue: 'All conditions' })}
          </button>
          {CONDITION_TAGS.map(c => {
            const on = activeConditions.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => toggleCondition(c.id)}
                aria-pressed={on}
                className={on ? 'chip-active' : 'chip'}
              >
                <span aria-hidden>{on ? '✓' : c.icon}</span>
                {t(`conditions.${c.id}`, { defaultValue: c.id })}
              </button>
            )
          })}
        </div>

        {/* Category chips */}
        <div
          className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pt-2 pb-5"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'chip-active' : 'chip'}
            >
              {cat === 'All' ? t('recipes.allCategories') : t(`categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>
        </div>

        {/* Recipe list — scrollbar-gutter: stable reserves the scrollbar's
            width even when the list doesn't overflow, so the chip strips
            above don't visually "shift" when the user changes filters and
            the result count crosses the overflow threshold. */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 pt-2 sm:pt-4 pb-4"
          style={{ scrollbarGutter: 'stable' }}
        >
          {filtered.length === 0 ? (
            <div className="empty-state max-sm:py-4"><p className="empty-state-body mt-0">{t('recipePicker.noResults')}</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(recipe => {
                const isSelected = multi && selected.includes(recipe.id)
                return (
                <button
                  key={recipe.id}
                  onClick={() => handleRowClick(recipe.id)}
                  onPointerDown={() => startPress(recipe.id)}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  onPointerCancel={cancelPress}
                  // Holding a row must not start a text selection or fire the
                  // OS text-selection callout on touch.
                  onContextMenu={e => { if (canMulti) e.preventDefault() }}
                  style={canMulti ? { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } : undefined}
                  aria-pressed={multi ? isSelected : undefined}
                  className={`tap-target w-full text-left card p-3 transition-all duration-150 flex items-center gap-3 ${
                    isSelected
                      ? 'border-primary-400 ring-2 ring-primary-200 shadow-raised'
                      : 'hover:border-primary-200 hover:shadow-raised'
                  }`}
                >
                  {multi && (
                    <span
                      className={`w-5 h-5 rounded-small border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'
                      }`}
                      aria-hidden
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                  )}
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt="" className="w-12 h-12 rounded-control object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-control bg-primary-50 flex items-center justify-center flex-shrink-0 text-xl">
                      🍽
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{titleOf(recipe)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t(`categories.${recipe.category}`, { defaultValue: recipe.category })} · {t('recipeDetail.servings', { count: recipe.servings })}
                    </p>
                    {/* Flag restricted fasting-diet meals so a day isn't built
                        on them by mistake. */}
                    {isFmdRecipe(recipe) && (
                      <span className="mt-1 inline-flex items-center gap-1 badge bg-warning-100 text-warning-800 text-2xs font-semibold">
                        <span aria-hidden>⏳</span>
                        {t('recipes.fmdBadge', { defaultValue: 'Fasting day' })}
                      </span>
                    )}
                    {/* Why a dish without the word in its name is listed. */}
                    {searchMatches.get(recipe.id)?.inTitle === false && searchMatches.get(recipe.id)?.ingredient && (
                      <p className="text-xs text-primary-700 mt-0.5 truncate">{searchMatches.get(recipe.id).ingredient}</p>
                    )}
                  </div>
                  {!multi && (
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </button>
                )
              })}
            </div>
          )}

          {/* Add what you typed as your own meal. Offered even when recipes
              match, because a search for "salat" may still mean the improvised
              one, but below them: the results are what the search is for.
              Hidden while multi-selecting — that mode is about picking
              existing recipes. */}
          {canAddCustom && !multi && search.trim() && (
            <div className="mt-3 rounded-control border border-primary-200 bg-primary-50/60 p-3">
              <p className="text-xs text-slate-600 mb-2">
                {t('recipePicker.addOwnHint', {
                  defaultValue: 'Not in your recipes? Add it as your own meal — it goes on the shopping list too.',
                })}
              </p>
              <div className="flex gap-2">
                <span className="flex-1 min-w-0 inline-flex items-center px-3 h-9 rounded-small bg-white border border-slate-200 text-sm font-medium text-slate-800 truncate">
                  {search.trim()}
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitCustom() }}
                  placeholder={t('recipePicker.amountPlaceholder', { defaultValue: 'Amount (optional)' })}
                  className="input w-32 h-9 text-sm"
                />
                <button onClick={submitCustom} className="btn-secondary whitespace-nowrap">
                  {t('recipePicker.addOwn', { defaultValue: 'Add' })}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm bar — only while selecting, so it never takes space from
            the list in the ordinary single-tap flow. */}
        {multi && (
          <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 bg-white sm:rounded-b-card">
            <button
              onClick={confirmMany}
              disabled={selected.length === 0}
              className="btn-primary w-full"
            >
              {selected.length === 0
                ? t('recipePicker.selectPrompt', { defaultValue: 'Select recipes to add' })
                : t('recipePicker.addCount', {
                  count: selected.length,
                  defaultValue: 'Add {{count}} recipes',
                })}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

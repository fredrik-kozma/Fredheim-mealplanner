import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { compressImage } from '../../utils/imageCompressor'
import UnitSelect from './UnitSelect'

function IngredientRow({ ing, onChange, onRemove, t }) {
  return (
    <div className="flex gap-2 items-center">
      <input
        className="input w-20 flex-shrink-0"
        placeholder={t('recipeForm.ingredientQty')}
        value={ing.quantity || ''}
        onChange={e => onChange({ ...ing, quantity: parseFloat(e.target.value) || 0 })}
        type="number"
        min="0"
        step="any"
      />
      <UnitSelect
        value={ing.unit || ''}
        onChange={u => onChange({ ...ing, unit: u })}
      />
      <input
        className="input flex-1"
        placeholder={t('recipeForm.ingredientName')}
        value={ing.name || ''}
        onChange={e => onChange({ ...ing, name: e.target.value })}
      />
      <button type="button" onClick={onRemove} className="btn-ghost p-2 text-slate-400 hover:text-red-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const EMPTY_FORM = {
  title: '',
  category: 'Dinner',
  servings: 4,
  prepTime: '',
  cookTime: '',
  ingredients: [],
  steps: [],
  imageUrl: null,
}

const LANG_META = {
  en: { label: 'English', flag: '🇬🇧' },
  no: { label: 'Norsk', flag: '🇳🇴' },
  sv: { label: 'Svenska', flag: '🇸🇪' },
}

export default function RecipeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const addRecipe = useStore(s => s.addRecipe)
  const updateRecipe = useStore(s => s.updateRecipe)
  const existing = useStore(s => s.recipes.find(r => r.id === id))
  const recipeCategories = useStore(s => s.recipeCategories)

  const isEdit = Boolean(id && existing)

  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const ALL_LANGS = ['en', 'no', 'sv']

  // Which language are the base fields (title / ingredient names / steps in
  // the main section) actually written in? For a brand-new recipe it's the
  // language the user is creating in. For an existing recipe:
  //
  //   1. If the recipe carries an explicit `baseLang` (every recipe we save
  //      from now on does), trust it. This is the reliable path.
  //   2. Otherwise fall back to a heuristic for older / bundled recipes:
  //      bundled pack recipes keep the English original in the base fields
  //      and store no/sv only in `translations`, so the base language is the
  //      one that does NOT have its own translations entry.
  //
  // Two bugs lived here before:
  //   - "I'm in Norwegian but the form shows English and there's no Norwegian
  //     tab" — fixed by detecting the base from `translations`.
  //   - "I write a recipe in Norwegian, save it, reopen it and it's English"
  //     — a single-language recipe has an EMPTY `translations`, so the old
  //     heuristic fell through to its English convention. Fixed by (a)
  //     storing baseLang explicitly on save, and (b) when there are no
  //     translations at all, assuming the base is the current UI language
  //     instead of English.
  function inferBaseLang() {
    if (!isEdit) return currentLang
    if (existing?.baseLang && ALL_LANGS.includes(existing.baseLang)) return existing.baseLang
    const trans = existing?.translations || {}
    const present = ALL_LANGS.filter(l => trans[l]?.title)
    const missing = ALL_LANGS.filter(l => !trans[l]?.title)
    if (present.length === 0) return currentLang        // single-language recipe → assume UI lang
    if (missing.length === 1) return missing[0]
    if (missing.includes('en')) return 'en'              // ambiguous → English convention
    if (missing.includes(currentLang)) return currentLang
    return missing[0] || 'en'
  }
  const baseLang = inferBaseLang()
  const baseMeta = LANG_META[baseLang] || { label: baseLang, flag: '' }
  const otherLangs = ALL_LANGS.filter(l => l !== baseLang) // exactly 2

  // Default the active translation tab to the current UI language when it's
  // one of the translation languages — so a Norwegian user editing an
  // English-base recipe lands straight on the Norwegian fields.
  const defaultTransLang = otherLangs.includes(currentLang) ? currentLang : otherLangs[0]

  const [form, setForm] = useState(isEdit ? { ...existing } : EMPTY_FORM)
  const [newStep, setNewStep] = useState('')
  const [errors, setErrors] = useState({})
  const fileRef = useRef()

  // Translation editor: a collapsible panel with one tab per other
  // language. Each language keeps its own { title, description, ingNames,
  // steps } record. Ingredient-name and step arrays are kept the same
  // length as the base form so each row lines up by index.
  // Auto-expanded when the base language differs from the UI language
  // (so the user immediately sees where to edit their own language) or
  // when any translation already exists.
  const [showTranslation, setShowTranslation] = useState(
    () => isEdit && (baseLang !== currentLang || otherLangs.some(l => existing?.translations?.[l]?.title))
  )
  const [activeTransLang, setActiveTransLang] = useState(defaultTransLang)
  const [transByLang, setTransByLang] = useState(() => {
    const baseIngs = (isEdit && existing?.ingredients) || []
    const baseSteps = (isEdit && existing?.steps) || []
    const init = {}
    for (const l of otherLangs) {
      const ex = (isEdit && existing?.translations?.[l]) || {}
      init[l] = {
        title: ex.title || '',
        description: ex.description || '',
        ingNames: baseIngs.map((_, i) => ex.ingredients?.[i]?.name || ''),
        steps: baseSteps.map((_, i) => ex.steps?.[i] || ''),
      }
    }
    return init
  })

  // Update one field of the currently-active translation language.
  function setTrans(field, value) {
    setTransByLang(prev => ({
      ...prev,
      [activeTransLang]: { ...prev[activeTransLang], [field]: value },
    }))
  }
  // Convenience accessor for the active language's record.
  const activeTrans = transByLang[activeTransLang] || { title: '', description: '', ingNames: [], steps: [] }
  const activeMeta = LANG_META[activeTransLang] || { label: activeTransLang, flag: '' }

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  async function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    // Compress & resize before storing. localStorage is ~5 MB total, and
    // a raw phone photo as a base64 data URL is easily 4 MB on its own,
    // so we always pass it through the canvas compressor.
    try {
      const dataUrl = await compressImage(file, { maxSide: 1024, quality: 0.75 })
      set('imageUrl', dataUrl)
    } catch (err) {
      console.error('Image compression failed', err)
      alert(t('recipeForm.imageError', { defaultValue: 'Could not process that image. Try a smaller file.' }))
    } finally {
      // Reset the input so the user can re-pick the same file if needed.
      if (e.target) e.target.value = ''
    }
  }

  // Keep every language's per-ingredient / per-step arrays the same
  // length as the base form so rows line up by index.
  function syncTransArrays(mutate) {
    setTransByLang(prev => {
      const next = {}
      for (const l of otherLangs) next[l] = mutate(prev[l] || { title: '', description: '', ingNames: [], steps: [] })
      return next
    })
  }

  function addIngredient() {
    set('ingredients', [...form.ingredients, { quantity: 0, unit: '', name: '' }])
    syncTransArrays(rec => ({ ...rec, ingNames: [...rec.ingNames, ''] }))
  }

  function updateIngredient(i, val) {
    const updated = [...form.ingredients]
    updated[i] = val
    set('ingredients', updated)
  }

  function removeIngredient(i) {
    set('ingredients', form.ingredients.filter((_, idx) => idx !== i))
    syncTransArrays(rec => ({ ...rec, ingNames: rec.ingNames.filter((_, idx) => idx !== i) }))
  }

  function addStep() {
    if (!newStep.trim()) return
    set('steps', [...form.steps, newStep.trim()])
    setNewStep('')
    syncTransArrays(rec => ({ ...rec, steps: [...rec.steps, ''] }))
  }

  function removeStep(i) {
    set('steps', form.steps.filter((_, idx) => idx !== i))
    syncTransArrays(rec => ({ ...rec, steps: rec.steps.filter((_, idx) => idx !== i) }))
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = t('recipeForm.titleError')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    if (!validate()) return

    // Build translations object, preserving any existing translations.
    // Write a translation for each OTHER language whose title was filled
    // in — so a single recipe can now carry EN + NO + SV at once.
    const existingTranslations = isEdit ? (existing?.translations || {}) : {}
    const translations = { ...existingTranslations }

    for (const l of otherLangs) {
      const tr = transByLang[l]
      if (!tr) continue
      if (tr.title.trim()) {
        translations[l] = {
          title: tr.title.trim(),
          ...(tr.description.trim() ? { description: tr.description.trim() } : {}),
          ingredients: form.ingredients.map((ing, i) => ({
            ...ing,
            name: tr.ingNames[i]?.trim() || ing.name,
          })),
          // Index-matched to base steps; fall back to the base step text
          // for any step the user left blank in this language.
          steps: form.steps.map((s, i) => tr.steps[i]?.trim() || s),
        }
      } else {
        // Title cleared → drop any previously-saved translation for it.
        delete translations[l]
      }
    }

    const data = {
      ...form,
      servings: Number(form.servings) || 4,
      prepTime: form.prepTime ? Number(form.prepTime) : null,
      cookTime: form.cookTime ? Number(form.cookTime) : null,
      // Record which language the base fields are written in, so reopening
      // the recipe to edit never has to guess. For a new recipe that's the
      // language the user is creating in; for an edit it's the language we
      // resolved above (preserving an explicit baseLang when present).
      baseLang,
      translations,
    }

    try {
      if (isEdit) {
        updateRecipe(id, data)
        navigate(`/recipes/${id}`)
      } else {
        addRecipe(data)
        navigate('/')
      }
    } catch (err) {
      // Almost always localStorage overflow — tell the user instead of
      // silently failing. The store's middleware surfaces a
      // QuotaExceededError synchronously on the set() call.
      const quota = err && (err.name === 'QuotaExceededError' || /quota/i.test(err.message || ''))
      console.error('Save failed', err)
      alert(
        quota
          ? t('recipeForm.quotaError', {
              defaultValue:
                'Storage is full — your device ran out of space for recipes. Try using a smaller photo, removing the photo from this recipe, or deleting some old recipes before saving.',
            })
          : t('recipeForm.saveError', { defaultValue: 'Could not save the recipe. Please try again.' })
      )
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(isEdit ? `/recipes/${id}` : '/')} className="btn-ghost px-2 -ml-2 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {t('recipeForm.back')}
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEdit ? t('recipeForm.editRecipe') : t('recipeForm.addRecipe')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image upload */}
          <div>
            {form.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden h-44 mb-1">
                <img src={form.imageUrl} alt="Recipe" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('imageUrl', null)}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <span className="text-sm">{t('recipeForm.addPhoto')}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Base-language notice — shown when the recipe's original text
              is in a different language than the UI. Tells the user the
              main fields below are the original, and their own language
              is editable in the translations panel further down. */}
          {isEdit && baseLang !== currentLang && (
            <div className="flex items-start gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
              <span className="text-base leading-none mt-0.5">{baseMeta.flag}</span>
              <p className="text-xs text-indigo-900 leading-relaxed">
                {t('recipeForm.baseLangNotice', {
                  lang: baseMeta.label,
                  defaultValue: `The fields below are the original ${baseMeta.label} version. To edit another language, use “Add translations” at the bottom.`,
                })}
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label flex items-center gap-1.5">
              {t('recipeForm.titleRequired')}
              {isEdit && baseLang !== currentLang && <span className="text-sm">{baseMeta.flag}</span>}
            </label>
            <input
              className={`input ${errors.title ? 'ring-2 ring-red-400 border-red-300' : ''}`}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('recipeForm.titlePlaceholder')}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Category + Servings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('recipeForm.category')}</label>
              <select className="input bg-white" value={form.category} onChange={e => set('category', e.target.value)}>
                {recipeCategories.map(c => <option key={c} value={c}>{t(`categories.${c}`, { defaultValue: c })}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('recipeForm.servings')}</label>
              <input className="input" type="number" min="1" value={form.servings} onChange={e => set('servings', e.target.value)} />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('recipeForm.prepTime')}</label>
              <input className="input" type="number" min="0" value={form.prepTime || ''} onChange={e => set('prepTime', e.target.value)} placeholder={t('recipeForm.prepTimePlaceholder')} />
            </div>
            <div>
              <label className="label">{t('recipeForm.cookTime')}</label>
              <input className="input" type="number" min="0" value={form.cookTime || ''} onChange={e => set('cookTime', e.target.value)} placeholder={t('recipeForm.cookTimePlaceholder')} />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t('recipeForm.ingredients')}</label>
              <button type="button" onClick={addIngredient} className="btn-ghost text-xs py-1 px-2 text-indigo-600 hover:bg-indigo-50">
                {t('recipeForm.addIngredient')}
              </button>
            </div>
            <div className="space-y-2">
              {form.ingredients.length === 0 && (
                <p className="text-sm text-slate-400 py-2">{t('recipeForm.noIngredientsYet')}</p>
              )}
              {form.ingredients.map((ing, i) => (
                <IngredientRow
                  key={i}
                  ing={ing}
                  onChange={val => updateIngredient(i, val)}
                  onRemove={() => removeIngredient(i)}
                  t={t}
                />
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <label className="label">{t('recipeForm.instructions')}</label>
            <div className="space-y-2 mb-2">
              {form.steps.length === 0 && (
                <p className="text-sm text-slate-400 py-1">{t('recipeForm.noStepsYet')}</p>
              )}
              {form.steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-2">
                    {i + 1}
                  </span>
                  <textarea
                    className="input flex-1 min-h-[60px] resize-none text-sm"
                    value={step}
                    onChange={e => {
                      const updated = [...form.steps]
                      updated[i] = e.target.value
                      set('steps', updated)
                    }}
                  />
                  <button type="button" onClick={() => removeStep(i)} className="btn-ghost p-2 text-slate-400 hover:text-red-500 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder={t('recipeForm.addStepPlaceholder')}
                value={newStep}
                onChange={e => setNewStep(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStep())}
              />
              <button type="button" onClick={addStep} className="btn-secondary">{t('recipeForm.addStep')}</button>
            </div>
          </div>

          {/* ── Optional Translation Section ─────────────────────────── */}
          <div className="border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setShowTranslation(v => !v)}
              className="flex items-center gap-2.5 w-full text-left group"
            >
              <span className="text-lg">🌐</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                  {t('recipeForm.addTranslations', { defaultValue: 'Add translations (optional)' })}
                </p>
                <p className="text-xs text-slate-400">
                  {t('recipeForm.addTranslationDesc', { defaultValue: 'Fill in the same recipe in other languages so everyone sees it in their own language.' })}
                </p>
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${showTranslation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showTranslation && (
              <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                {/* Language tabs — one per OTHER language. A green dot marks
                    languages that already have a title filled in. */}
                <div className="flex gap-2 mb-4">
                  {otherLangs.map(l => {
                    const meta = LANG_META[l] || { label: l, flag: '' }
                    const filled = Boolean(transByLang[l]?.title?.trim())
                    const isActive = l === activeTransLang
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setActiveTransLang(l)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          isActive
                            ? 'bg-white border-indigo-300 text-indigo-700 shadow-sm'
                            : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <span>{meta.flag}</span>
                        {meta.label}
                        {filled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-4">
                  {/* Translated title */}
                  <div>
                    <label className="label">{t('recipeForm.translatedTitle', { lang: activeMeta.label, defaultValue: `Title in ${activeMeta.label}` })}</label>
                    <input
                      className="input"
                      value={activeTrans.title}
                      onChange={e => setTrans('title', e.target.value)}
                      placeholder={t('recipeForm.translatedTitlePlaceholder', { defaultValue: 'Recipe title…' })}
                    />
                  </div>

                  {/* Translated description */}
                  <div>
                    <label className="label">{t('recipeForm.translatedDescription', { lang: activeMeta.label, defaultValue: `Description in ${activeMeta.label} (optional)` })}</label>
                    <textarea
                      className="input min-h-[80px] resize-y text-sm"
                      value={activeTrans.description}
                      onChange={e => setTrans('description', e.target.value)}
                      placeholder={t('recipeForm.translatedDescPlaceholder', { defaultValue: 'Short description…' })}
                    />
                  </div>

                  {/* Translated ingredient names */}
                  {form.ingredients.length > 0 && (
                    <div>
                      <label className="label">{t('recipeForm.translatedIngredients', { lang: activeMeta.label, defaultValue: `Ingredient names in ${activeMeta.label}` })}</label>
                      <div className="space-y-2">
                        {form.ingredients.map((ing, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="text-xs text-slate-400 w-24 flex-shrink-0 truncate">{ing.name || `#${i + 1}`}</span>
                            <svg className="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                            <input
                              className="input flex-1 text-sm"
                              placeholder={ing.name}
                              value={activeTrans.ingNames[i] || ''}
                              onChange={e => {
                                const updated = [...activeTrans.ingNames]
                                updated[i] = e.target.value
                                setTrans('ingNames', updated)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Translated steps — index-matched to base steps */}
                  {form.steps.length > 0 && (
                    <div>
                      <label className="label">{t('recipeForm.translatedSteps', { lang: activeMeta.label, defaultValue: `Steps in ${activeMeta.label}` })}</label>
                      <div className="space-y-2">
                        {form.steps.map((_, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-2">
                              {i + 1}
                            </span>
                            <textarea
                              className="input flex-1 min-h-[60px] resize-none text-sm"
                              placeholder={form.steps[i]}
                              value={activeTrans.steps[i] || ''}
                              onChange={e => {
                                const updated = [...activeTrans.steps]
                                updated[i] = e.target.value
                                setTrans('steps', updated)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t('recipeForm.translationHint', { defaultValue: 'Any field you leave blank falls back to the original recipe text for that language.' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(isEdit ? `/recipes/${id}` : '/')} className="btn-secondary flex-1">{t('recipeForm.cancel')}</button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? t('recipeForm.saveChanges') : t('recipeForm.addRecipe')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

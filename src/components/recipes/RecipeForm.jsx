import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { parseRecipe } from '../../utils/recipeParser'
import { compressImage } from '../../utils/imageCompressor'
import { NUTRITION_GROUPS } from '../../utils/nutritionData'
import UnitSelect from './UnitSelect'

// ── Nutrition form section ────────────────────────────────────────────────────
function NutritionFormSection({ nutrition, onChange }) {
  const [open, setOpen] = useState(Boolean(
    nutrition && Object.values(nutrition).some(v => v !== null && v !== undefined)
  ))

  function handleField(key, raw) {
    const val = raw === '' ? null : parseFloat(raw)
    onChange({ ...nutrition, [key]: isNaN(val) ? null : val })
  }

  return (
    <div className="border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 w-full text-left group"
      >
        <span className="text-lg">📊</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
            Nutritional Information (per serving)
          </p>
          <p className="text-xs text-slate-400">
            Calories, macros, minerals and vitamins. Use AI to calculate these from your ingredients.
          </p>
        </div>
        <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {NUTRITION_GROUPS.map(group => (
            <div key={group.key}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {group.fields.map(field => (
                  <div key={field.key} className={`flex items-center gap-1.5 ${field.indent ? 'pl-3' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-slate-500 truncate mb-0.5">{field.label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="input py-1.5 text-sm w-full"
                          placeholder="—"
                          value={nutrition?.[field.key] ?? ''}
                          onChange={e => handleField(field.key, e.target.value)}
                        />
                        <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 w-10">{field.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-1">
            💡 Tip: Ask an AI (e.g. ChatGPT or Claude) to calculate the nutrition for this recipe and paste the values above.
          </p>
        </div>
      )}
    </div>
  )
}

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

  // Current UI language and the "other" language for the optional translation section
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const otherLang = currentLang === 'no' ? 'en' : currentLang === 'en' ? 'no' : 'en'
  const otherMeta = LANG_META[otherLang] || { label: otherLang, flag: '' }

  const [form, setForm] = useState(isEdit ? { ...existing } : EMPTY_FORM)
  const [nutrition, setNutrition] = useState(isEdit ? (existing?.nutrition || {}) : {})
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [newStep, setNewStep] = useState('')
  const [errors, setErrors] = useState({})
  const fileRef = useRef()

  // Optional translation state — pre-filled if editing a recipe that already has a translation
  const existingTrans = isEdit ? (existing?.translations?.[otherLang] || {}) : {}
  const [showTranslation, setShowTranslation] = useState(isEdit && Boolean(existingTrans.title))
  const [transTitle, setTransTitle] = useState(existingTrans.title || '')
  const [transDescription, setTransDescription] = useState(existingTrans.description || '')
  // Per-ingredient translated names — kept in sync with main form ingredient count
  const [transIngNames, setTransIngNames] = useState(
    () => (isEdit && existingTrans.ingredients?.length)
      ? existingTrans.ingredients.map(i => i.name || '')
      : (existing?.ingredients || []).map(() => '')
  )
  const [transSteps, setTransSteps] = useState(existingTrans.steps || [])
  const [newTransStep, setNewTransStep] = useState('')

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function handleParse() {
    const parsed = parseRecipe(pasteText)
    if (!parsed) return
    setForm(f => ({
      ...f,
      title: parsed.title || f.title,
      servings: parsed.servings || f.servings,
      prepTime: parsed.prepTime || f.prepTime,
      cookTime: parsed.cookTime || f.cookTime,
      ingredients: parsed.ingredients?.length ? parsed.ingredients : f.ingredients,
      steps: parsed.steps?.length ? parsed.steps : f.steps,
      category: parsed.category || f.category,
    }))
    // Sync transIngNames length to new ingredient count
    if (parsed.ingredients?.length) {
      setTransIngNames(prev => {
        const next = [...prev]
        while (next.length < parsed.ingredients.length) next.push('')
        return next.slice(0, parsed.ingredients.length)
      })
    }
    setPasteText('')
    setShowPaste(false)
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

  function addIngredient() {
    set('ingredients', [...form.ingredients, { quantity: 0, unit: '', name: '' }])
    setTransIngNames(prev => [...prev, ''])
  }

  function updateIngredient(i, val) {
    const updated = [...form.ingredients]
    updated[i] = val
    set('ingredients', updated)
  }

  function removeIngredient(i) {
    set('ingredients', form.ingredients.filter((_, idx) => idx !== i))
    setTransIngNames(prev => prev.filter((_, idx) => idx !== i))
  }

  function addStep() {
    if (!newStep.trim()) return
    set('steps', [...form.steps, newStep.trim()])
    setNewStep('')
    // Add a blank translation step to keep counts in sync
    setTransSteps(prev => [...prev, ''])
  }

  function removeStep(i) {
    set('steps', form.steps.filter((_, idx) => idx !== i))
    setTransSteps(prev => prev.filter((_, idx) => idx !== i))
  }

  function addTransStep() {
    if (!newTransStep.trim()) return
    setTransSteps(prev => [...prev, newTransStep.trim()])
    setNewTransStep('')
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

    // Build translations object, preserving any existing translations
    const existingTranslations = isEdit ? (existing?.translations || {}) : {}
    const translations = { ...existingTranslations }

    if (showTranslation && transTitle.trim()) {
      translations[otherLang] = {
        title: transTitle.trim(),
        ...(transDescription.trim() ? { description: transDescription.trim() } : {}),
        ingredients: form.ingredients.map((ing, i) => ({
          ...ing,
          name: transIngNames[i]?.trim() || ing.name,
        })),
        steps: transSteps.filter(s => s.trim()),
      }
    }

    // Only save nutrition if at least one field has been filled in
    const hasNutrition = Object.values(nutrition).some(v => v !== null && v !== undefined)

    const data = {
      ...form,
      servings: Number(form.servings) || 4,
      prepTime: form.prepTime ? Number(form.prepTime) : null,
      cookTime: form.cookTime ? Number(form.cookTime) : null,
      translations,
      nutrition: hasNutrition ? nutrition : null,
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

        {/* Smart Paste */}
        <div className="card p-4 mb-6 border-dashed border-indigo-200 bg-indigo-50/50">
          <button
            type="button"
            className="flex items-center gap-2 w-full text-left"
            onClick={() => setShowPaste(!showPaste)}
          >
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-800">{t('recipeForm.smartPaste')}</p>
              <p className="text-xs text-indigo-600">{t('recipeForm.smartPasteDesc')}</p>
            </div>
            <svg className={`w-5 h-5 text-indigo-500 transition-transform ${showPaste ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showPaste && (
            <div className="mt-3 space-y-2">
              <textarea
                className="input min-h-[140px] resize-y text-sm font-mono"
                placeholder={t('recipeForm.pastePlaceholder')}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
              />
              <button
                type="button"
                onClick={handleParse}
                disabled={!pasteText.trim()}
                className="btn-primary w-full"
              >
                {t('recipeForm.parseRecipe')}
              </button>
            </div>
          )}
        </div>

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

          {/* Title */}
          <div>
            <label className="label">{t('recipeForm.titleRequired')}</label>
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

          {/* ── Nutrition Section ────────────────────────────────────── */}
          <NutritionFormSection
            nutrition={nutrition}
            onChange={setNutrition}
          />

          {/* ── Optional Translation Section ─────────────────────────── */}
          <div className="border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setShowTranslation(v => !v)}
              className="flex items-center gap-2.5 w-full text-left group"
            >
              <span className="text-lg">{otherMeta.flag}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                  {t('recipeForm.addTranslation', { lang: otherMeta.label, defaultValue: `Add ${otherMeta.label} version (optional)` })}
                </p>
                <p className="text-xs text-slate-400">
                  {t('recipeForm.addTranslationDesc', { defaultValue: 'Fill in the same recipe in the other language. You can also do this later via the Translate button.' })}
                </p>
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${showTranslation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showTranslation && (
              <div className="mt-4 space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                {/* Translated title */}
                <div>
                  <label className="label">{t('recipeForm.translatedTitle', { lang: otherMeta.label, defaultValue: `Title in ${otherMeta.label}` })}</label>
                  <input
                    className="input"
                    value={transTitle}
                    onChange={e => setTransTitle(e.target.value)}
                    placeholder={t('recipeForm.translatedTitlePlaceholder', { defaultValue: 'Recipe title…' })}
                  />
                </div>

                {/* Translated description */}
                <div>
                  <label className="label">{t('recipeForm.translatedDescription', { lang: otherMeta.label, defaultValue: `Description in ${otherMeta.label} (optional)` })}</label>
                  <textarea
                    className="input min-h-[80px] resize-y text-sm"
                    value={transDescription}
                    onChange={e => setTransDescription(e.target.value)}
                    placeholder={t('recipeForm.translatedDescPlaceholder', { defaultValue: 'Short description…' })}
                  />
                </div>

                {/* Translated ingredient names */}
                {form.ingredients.length > 0 && (
                  <div>
                    <label className="label">{t('recipeForm.translatedIngredients', { lang: otherMeta.label, defaultValue: `Ingredient names in ${otherMeta.label}` })}</label>
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
                            value={transIngNames[i] || ''}
                            onChange={e => {
                              const updated = [...transIngNames]
                              updated[i] = e.target.value
                              setTransIngNames(updated)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Translated steps */}
                {form.steps.length > 0 && (
                  <div>
                    <label className="label">{t('recipeForm.translatedSteps', { lang: otherMeta.label, defaultValue: `Steps in ${otherMeta.label}` })}</label>
                    <div className="space-y-2 mb-2">
                      {form.steps.map((_, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-2">
                            {i + 1}
                          </span>
                          <textarea
                            className="input flex-1 min-h-[60px] resize-none text-sm"
                            placeholder={form.steps[i]}
                            value={transSteps[i] || ''}
                            onChange={e => {
                              const updated = [...transSteps]
                              updated[i] = e.target.value
                              setTransSteps(updated)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra translated steps (if translation has more than main form) */}
                {transSteps.length > form.steps.length && (
                  <div className="space-y-2">
                    {transSteps.slice(form.steps.length).map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-2">
                          {form.steps.length + i + 1}
                        </span>
                        <textarea
                          className="input flex-1 min-h-[60px] resize-none text-sm"
                          value={step}
                          onChange={e => {
                            const updated = [...transSteps]
                            updated[form.steps.length + i] = e.target.value
                            setTransSteps(updated)
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setTransSteps(prev => prev.filter((_, idx) => idx !== form.steps.length + i))}
                          className="btn-ghost p-2 text-slate-400 hover:text-red-500 mt-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.steps.length === 0 && (
                  <div>
                    <label className="label">{t('recipeForm.translatedSteps', { lang: otherMeta.label, defaultValue: `Steps in ${otherMeta.label}` })}</label>
                    <div className="space-y-2 mb-2">
                      {transSteps.map((step, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-2">
                            {i + 1}
                          </span>
                          <textarea
                            className="input flex-1 min-h-[60px] resize-none text-sm"
                            value={step}
                            onChange={e => {
                              const updated = [...transSteps]
                              updated[i] = e.target.value
                              setTransSteps(updated)
                            }}
                          />
                          <button type="button" onClick={() => setTransSteps(prev => prev.filter((_, idx) => idx !== i))} className="btn-ghost p-2 text-slate-400 hover:text-red-500 mt-1">
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
                        value={newTransStep}
                        onChange={e => setNewTransStep(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTransStep())}
                      />
                      <button type="button" onClick={addTransStep} className="btn-secondary">{t('recipeForm.addStep')}</button>
                    </div>
                  </div>
                )}
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

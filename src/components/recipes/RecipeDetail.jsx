import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { formatQuantity } from '../../utils/shoppingListGenerator'
import { translateRecipe } from '../../utils/translator'
import { convertToSystem, displayUnit, normalizeUnit, CANONICAL_UNITS } from '../../utils/unitNormalizer'
import { printRecipe } from '../../utils/printRecipe'
import { NUTRITION_GROUPS, fmtNutrient, dvColour } from '../../utils/nutritionData'

// ── Nutrition display panel ───────────────────────────────────────────────────
function NutritionPanel({ nutrition, servingScale }) {
  const [open, setOpen] = useState(false)

  // Check if there is any data at all
  const hasAnyData = nutrition && Object.values(nutrition).some(v => v !== null && v !== undefined)
  if (!hasAnyData) return null

  function scaled(val) {
    if (val === null || val === undefined) return null
    return val * servingScale
  }

  function dvPct(val, dv) {
    if (val === null || val === undefined || !dv) return null
    return Math.round((val / dv) * 100)
  }

  const cal = fmtNutrient(scaled(nutrition.calories))

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 card px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📊</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800">Nutrition Information</p>
            {cal !== null && (
              <p className="text-xs text-slate-500">{cal} kcal per serving</p>
            )}
          </div>
        </div>
        <svg className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="card mt-1 overflow-hidden">
          {/* Calories hero row */}
          {cal !== null && (
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-800">Calories</span>
              <span className="text-2xl font-bold text-indigo-600">{cal} <span className="text-sm font-normal text-slate-500">kcal</span></span>
            </div>
          )}

          {NUTRITION_GROUPS.map((group, gi) => {
            // Only render group if it has at least one value
            const groupFields = group.fields.filter(f => f.key !== 'calories')
            const hasGroupData = groupFields.some(f => scaled(nutrition[f.key]) !== null)
            if (!hasGroupData) return null

            return (
              <div key={group.key}>
                {gi > 0 && <div className="border-t border-slate-100" />}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{group.label}</p>
                  <div className="space-y-1.5">
                    {groupFields.map(field => {
                      const raw = scaled(nutrition[field.key])
                      if (raw === null) return null
                      const display = fmtNutrient(raw)
                      const pct = dvPct(raw, field.dv)
                      const colour = pct !== null ? dvColour(pct) : null

                      return (
                        <div key={field.key} className={`flex items-center gap-2 py-1 ${field.indent ? 'pl-4' : ''}`}>
                          {/* Name */}
                          <span className={`flex-1 text-sm ${field.indent ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                            {field.indent && <span className="text-slate-300 mr-1">↳</span>}
                            {field.label}
                          </span>
                          {/* Amount */}
                          <span className="text-sm text-slate-700 text-right whitespace-nowrap">
                            {display} <span className="text-slate-400 text-xs">{field.unit}</span>
                          </span>
                          {/* % DV */}
                          {pct !== null ? (
                            <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${colour}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 w-20 text-right flex-shrink-0">—</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="pb-2" />
              </div>
            )
          })}

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400">* % Daily Values based on a 2,000 kcal diet (FDA 2020). Values shown per serving scaled to current serving count.</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const recipe = useStore(s => s.recipes.find(r => r.id === id))
  const deleteRecipe = useStore(s => s.deleteRecipe)
  const setLastOpenedRecipeId = useStore(s => s.setLastOpenedRecipeId)

  // Remember this recipe so the nav can return to it
  useEffect(() => {
    if (id) setLastOpenedRecipeId(id)
  }, [id, setLastOpenedRecipeId])
  const updateRecipeTranslation = useStore(s => s.updateRecipeTranslation)
  const familySize = useStore(s => s.familySize)
  const language = useStore(s => s.language)

  const unitSystem = useStore(s => s.units)
  // Normalize legacy 'imperial' value to 'us'.
  const preferredSystem = unitSystem === 'imperial' ? 'us' : (unitSystem || 'metric')

  const [showTranslateMenu, setShowTranslateMenu] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translateToast, setTranslateToast] = useState(null)
  const [displayServings, setDisplayServings] = useState(recipe?.servings || 4)
  // View override: null = follow the user's Settings preference. When the user
  // taps the metric/US toggle on this recipe we switch to that value.
  const [viewSystem, setViewSystem] = useState(null)

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <p className="text-slate-500">{t('recipes.notFound')}</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>{t('recipes.backToRecipes')}</button>
      </div>
    )
  }

  const scale = familySize / (recipe.servings || 4)

  // Use translated content if current language has a translation
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const translation = recipe.translations?.[currentLang]
  const displayTitle = translation?.title || recipe.title
  const displayDescription = translation?.description || recipe.description
  const displayIngredients = translation?.ingredients || recipe.ingredients
  const displaySteps = translation?.steps || recipe.steps

  function handleDelete() {
    if (confirm(t('recipeDetail.deleteConfirm', { title: recipe.title }))) {
      deleteRecipe(id)
      navigate('/')
    }
  }

  // Intelligently round quantities to common cooking fractions
  function smartRound(num) {
    if (num === null || num === undefined || num === 0) return 0

    // Common fractions and their decimal values
    const fractions = [
      { val: 0.25, display: '0.25' },
      { val: 0.33, display: '0.33' },
      { val: 0.5, display: '0.5' },
      { val: 0.67, display: '0.67' },
      { val: 0.75, display: '0.75' },
    ]

    // For values < 1, try to match common fractions
    if (num < 1) {
      let closest = fractions[0]
      let minDiff = Math.abs(num - closest.val)
      for (const frac of fractions) {
        const diff = Math.abs(num - frac.val)
        if (diff < minDiff) {
          minDiff = diff
          closest = frac
        }
      }
      if (minDiff < 0.1) return parseFloat(closest.display)
    }

    // For whole numbers, keep them whole
    if (Math.abs(num - Math.round(num)) < 0.05) {
      return Math.round(num)
    }

    // For .5 endings, keep them
    const decimal = num % 1
    if (Math.abs(decimal - 0.5) < 0.05) {
      return Math.floor(num) + 0.5
    }

    // Otherwise round to 2 decimal places
    return Math.round(num * 100) / 100
  }

  // Active view system: user override (tap toggle) → Settings preference.
  const activeSystem = viewSystem || preferredSystem

  function formatScaledQuantity(quantity, unit) {
    if (quantity === null || quantity === undefined || quantity === 0) return unit || ''

    const scaled = quantity * (displayServings / (recipe.servings || 4))

    // Convert into the active system if the unit is convertible.
    const normalized = normalizeUnit(unit)
    const meta = CANONICAL_UNITS[normalized]
    let finalQty = scaled
    let finalUnitKey = normalized || unit

    if (meta && meta.system !== 'both') {
      const converted = convertToSystem(scaled, normalized, activeSystem)
      finalQty = converted.quantity
      finalUnitKey = converted.unit
    }

    const rounded = smartRound(finalQty)
    if (rounded === 0) return displayUnitLabel(finalUnitKey) || ''
    const formatted = rounded.toString()
    const unitLabel = displayUnitLabel(finalUnitKey)
    return unitLabel ? `${formatted} ${unitLabel}` : formatted
  }

  // Prefer a translated canonical label; fall back to the raw string for
  // custom or unknown units.
  function displayUnitLabel(unitKey) {
    if (!unitKey) return ''
    if (CANONICAL_UNITS[unitKey]) return displayUnit(unitKey, currentLang)
    return unitKey
  }

  // Does this recipe contain any unit that could be converted between
  // metric and US? If not, hide the toggle.
  const hasConvertibleUnit = (displayIngredients || []).some(ing => {
    const n = normalizeUnit(ing.unit)
    const m = CANONICAL_UNITS[n]
    return m && m.system !== 'both'
  })

  const LANG_OPTIONS = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'no', label: 'Norsk', flag: '🇳🇴' },
    { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  ]

  const availableLangs = LANG_OPTIONS.filter(l => l.code !== currentLang)

  function handlePrint() {
    const translatedCategory = t(`categories.${recipe.category}`, {
      defaultValue: recipe.category,
    })
    const printIngredients = (displayIngredients || []).map(ing => ({
      name: ing.name,
      quantityLabel: formatScaledQuantity(ing.quantity, ing.unit),
    }))
    printRecipe({
      title: displayTitle,
      description: displayDescription || '',
      imageUrl: recipe.imageUrl || '',
      category: translatedCategory,
      prepTime: recipe.prepTime ?? null,
      cookTime: recipe.cookTime ?? null,
      servings: displayServings,
      ingredients: printIngredients,
      steps: displaySteps || [],
      labels: {
        ingredients: t('recipeDetail.ingredients'),
        instructions: t('recipeDetail.instructions'),
        servings: t('recipeDetail.servingsLabel', { defaultValue: 'Servings' }),
        prep: t('recipeDetail.prepLabel', { defaultValue: 'Prep' }),
        cook: t('recipeDetail.cookLabel', { defaultValue: 'Cook' }),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
      },
    })
  }

  async function handleTranslate(toLang) {
    setShowTranslateMenu(false)
    setTranslating(true)
    try {
      const fromLang = recipe.translations?.sourceLang || 'en'
      const translated = await translateRecipe(recipe, fromLang, toLang)
      updateRecipeTranslation(id, toLang, translated)
      setTranslateToast(t('recipeDetail.translationSaved'))
      setTimeout(() => setTranslateToast(null), 3000)
    } catch (err) {
      console.error('Translation failed', err)
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
      {/* Back button */}
      <div className="px-4 pt-4">
        <button onClick={() => navigate('/')} className="btn-ghost px-2 -ml-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {t('recipeDetail.back')}
        </button>
      </div>

      {/* Hero image */}
      {recipe.imageUrl && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden h-52">
          <img src={recipe.imageUrl} alt={displayTitle} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 mt-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{displayTitle}</h1>
          <div className="flex gap-2 flex-shrink-0">
            {/* Translate button */}
            <div className="relative">
              <button
                onClick={() => setShowTranslateMenu(v => !v)}
                disabled={translating}
                className="btn-secondary px-3 py-2"
                title={t('recipeDetail.translate')}
              >
                {translating ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                  </svg>
                )}
              </button>
              {showTranslateMenu && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 min-w-[160px]">
                  <p className="text-xs text-slate-500 px-3 pt-1 pb-1.5 font-medium">{t('recipeDetail.translateTo')}</p>
                  {availableLangs.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleTranslate(lang.code)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                      {recipe.translations?.[lang.code] && (
                        <svg className="w-3.5 h-3.5 text-green-500 ml-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handlePrint}
              className="btn-secondary px-3 py-2"
              title={t('recipeDetail.print', { defaultValue: 'Print' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
            </button>
            <button
              onClick={() => navigate(`/recipes/${id}/edit`)}
              className="btn-secondary px-3 py-2"
              title={t('recipeDetail.edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button onClick={handleDelete} className="btn-danger px-3 py-2" title={t('recipeDetail.delete')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2 mt-3 mb-5">
          <span className="badge bg-indigo-50 text-indigo-700">{t(`categories.${recipe.category}`, { defaultValue: recipe.category })}</span>
          {recipe.prepTime && (
            <span className="badge bg-slate-100 text-slate-600">⏱ {t('recipeDetail.prep', { time: recipe.prepTime })}</span>
          )}
          {recipe.cookTime && (
            <span className="badge bg-slate-100 text-slate-600">🔥 {t('recipeDetail.cook', { time: recipe.cookTime })}</span>
          )}
          {translation && (
            <span className="badge bg-green-50 text-green-700">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
              </svg>
              {currentLang.toUpperCase()}
            </span>
          )}
        </div>

        {/* Servings Scaler Control */}
        {recipe.servings && (
          <div className="card px-4 py-3 mb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('recipeDetail.originalServings')}</p>
                <p className="text-sm text-slate-700 font-medium">
                  {t('recipeDetail.servings', { count: recipe.servings })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDisplayServings(Math.max(1, displayServings - 1))}
                  className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center transition-colors"
                  title={t('recipeDetail.decreaseServings')}
                >
                  −
                </button>
                <div className="text-center min-w-[60px]">
                  <input
                    type="number"
                    min="1"
                    value={displayServings}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1)
                      setDisplayServings(val)
                    }}
                    className="w-full text-center font-semibold text-slate-900 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-0.5">{t('recipeDetail.servings', { count: displayServings })}</p>
                </div>
                <button
                  onClick={() => setDisplayServings(displayServings + 1)}
                  className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center transition-colors"
                  title={t('recipeDetail.increaseServings')}
                >
                  +
                </button>
              </div>
              {displayServings !== recipe.servings && (
                <button
                  onClick={() => setDisplayServings(recipe.servings)}
                  className="btn-ghost px-3 py-1.5 text-xs font-medium"
                  title={t('recipeDetail.resetServings')}
                >
                  {t('recipeDetail.reset')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">{displayDescription}</p>
        )}

        {/* Missing-translation banner — only when viewing in a language
            that has no stored translation for this recipe. */}
        {!translation && currentLang !== 'en' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-900 font-medium">{t('recipeDetail.translationMissingTitle', { defaultValue: 'This recipe is only in English.' })}</p>
              <p className="text-xs text-amber-700 mt-0.5">{t('recipeDetail.translationMissingDesc', { defaultValue: 'Translate it now to see the title, ingredients and steps in your language.' })}</p>
              <button
                onClick={() => handleTranslate(currentLang)}
                disabled={translating}
                className="mt-2 btn-primary py-1.5 px-3 text-xs"
              >
                {translating ? t('recipeDetail.translating', { defaultValue: 'Translating…' }) : t('recipeDetail.translateNow', { defaultValue: 'Translate now' })}
              </button>
            </div>
          </div>
        )}

        {/* Scale note */}
        {familySize !== recipe.servings && (
          <div className="bg-indigo-50 rounded-xl px-4 py-2.5 mb-5 text-sm text-indigo-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {t('recipeDetail.scaledFor', { count: familySize, original: recipe.servings })}
          </div>
        )}

        {/* Ingredients */}
        {displayIngredients?.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">{t('recipeDetail.ingredients')}</h2>
              {hasConvertibleUnit && (
                <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setViewSystem('metric')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      activeSystem === 'metric' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t('recipeDetail.metric', { defaultValue: 'Metric' })}
                  </button>
                  <button
                    onClick={() => setViewSystem('us')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      activeSystem === 'us' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t('recipeDetail.us', { defaultValue: 'US' })}
                  </button>
                </div>
              )}
            </div>
            <div className="card divide-y divide-slate-50">
              {displayIngredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-slate-700">{ing.name}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {formatScaledQuantity(ing.quantity, ing.unit)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        {displaySteps?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-3">{t('recipeDetail.instructions')}</h2>
            <ol className="space-y-4">
              {displaySteps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Nutrition panel */}
        <NutritionPanel
          nutrition={recipe.nutrition}
          servingScale={displayServings / (recipe.servings || 4)}
        />
      </div>

      {/* Translation toast */}
      {translateToast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {translateToast}
        </div>
      )}

      {/* Clicking outside translate menu closes it */}
      {showTranslateMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowTranslateMenu(false)} />
      )}
    </div>
  )
}

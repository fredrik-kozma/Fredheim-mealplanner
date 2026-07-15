import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { formatQuantity } from '../../utils/shoppingListGenerator'
import { convertToSystem, displayUnit, normalizeUnit, CANONICAL_UNITS } from '../../utils/unitNormalizer'
import { printRecipe } from '../../utils/printRecipe'
import { useAccess } from '../../hooks/useAccess'
import LockedOverlay from '../subscription/LockedOverlay'
import NutritionPanel from './NutritionPanel'
import EditableNumber from '../common/EditableNumber'
import FavoriteStar from './FavoriteStar'
import { recipeConditions, CONDITION_BADGE } from '../../data/conditionTags'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  // If the recipe was opened from the Planner (MealSlot sets state.from
  // to '/planner' when navigating here), the Back button returns to the
  // Planner. For every other entry point — Recipes list, deep link,
  // shopping list, etc. — Back still goes to the Recipes list so the
  // user's saved filter / sort state is restored from the store. This
  // preserves all earlier back-button behaviour.
  const backTarget = location.state?.from === '/planner' ? '/planner' : '/'
  const recipe = useStore(s => s.recipes.find(r => r.id === id))
  const deleteRecipe = useStore(s => s.deleteRecipe)
  const setLastOpenedRecipeId = useStore(s => s.setLastOpenedRecipeId)

  // Paywall: locked users can't see the full recipe unless it's a
  // designated free-preview recipe.
  const { isLocked, isPreviewRecipe } = useAccess()
  const showPaywall = isLocked && !isPreviewRecipe(id)

  // Remember this recipe so the nav can return to it
  useEffect(() => {
    if (id) setLastOpenedRecipeId(id)
  }, [id, setLastOpenedRecipeId])
  const familySize = useStore(s => s.familySize)
  const language = useStore(s => s.language)

  const unitSystem = useStore(s => s.units)
  // Normalize legacy 'imperial' value to 'us'.
  const preferredSystem = unitSystem === 'imperial' ? 'us' : (unitSystem || 'metric')

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
  const displayNotes = translation?.notes || recipe.notes

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

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-8 w-full min-w-0 overflow-x-hidden">
      {/* Back button — usually returns to the Recipes list (with filters
          restored from the persisted store). When the user opened this
          recipe from a meal slot in the Planner, navigation state carries
          { from: '/planner' } and we go back to the Planner instead. */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate(backTarget)}
          className="btn-ghost px-2 -ml-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {t('recipeDetail.back')}
        </button>
      </div>

      {/* Hero image — never blurred; the food picture is the strongest hook
          to draw visitors into starting their trial. */}
      {recipe.imageUrl && (
        <div className="mx-4 mt-3 rounded-2xl overflow-hidden h-52 relative">
          <img src={recipe.imageUrl} alt={displayTitle} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 mt-4">
        {/* Title row — title gets min-w-0 so long single words can wrap
            instead of pushing the icon buttons off the right edge on
            narrow / zoomed screens. */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight min-w-0 break-words flex-1">
            {displayTitle}
          </h1>
          {/* Print / Edit / Delete are subscriber-only — hidden when the
              user is locked out (anonymous or expired). They can still see
              and tap the recipe to view the paywall, but cannot mutate or
              export the content. */}
          {!showPaywall && (
            <div className="flex gap-2 flex-shrink-0 items-center">
              {/* Favorite star — always available even on locked
                  previews, so visitors can build a wishlist while
                  browsing. */}
              <FavoriteStar recipeId={id} size="lg" />
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
          )}
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
          {/* Condition badges — which health conditions this recipe suits */}
          {recipeConditions(recipe).map(c => (
            <span key={c.id} className={`badge ${CONDITION_BADGE[c.color]}`}>
              {c.icon} {t(`conditions.${c.id}`, { defaultValue: c.id })}
            </span>
          ))}
        </div>

        {/* Servings Scaler Control — fully responsive. On narrow / zoomed
            screens (e.g. an Android phone with text-scale increased) the
            "Original servings" block stacks above the counter, and the
            Reset button wraps to its own row so the counter never pushes
            content off the right edge. The number input uses a fixed
            width with tabular-nums so going from "1" to "20" doesn't
            change the widget's geometry. */}
        {recipe.servings && (
          <div className="card px-3 sm:px-4 py-3 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-1">{t('recipeDetail.originalServings')}</p>
                <p className="text-sm text-slate-700 font-medium">
                  {t('recipeDetail.servings', { count: recipe.servings })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => setDisplayServings(Math.max(1, displayServings - 1))}
                  className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center transition-colors"
                  title={t('recipeDetail.decreaseServings')}
                >
                  −
                </button>
                <div className="text-center flex-shrink-0 w-16">
                  {/* Editable: tap to clear and type a fresh value. */}
                  <EditableNumber
                    value={displayServings}
                    onChange={setDisplayServings}
                    min={1}
                    max={999}
                    className="w-full text-center font-semibold text-slate-900 bg-indigo-50 border border-indigo-200 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {t('recipeDetail.servings', { count: displayServings })}
                  </p>
                </div>
                <button
                  onClick={() => setDisplayServings(displayServings + 1)}
                  className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center transition-colors"
                  title={t('recipeDetail.increaseServings')}
                >
                  +
                </button>
                {displayServings !== recipe.servings && (
                  <button
                    onClick={() => setDisplayServings(recipe.servings)}
                    className="btn-ghost px-2.5 py-1.5 text-xs font-medium flex-shrink-0"
                    title={t('recipeDetail.resetServings')}
                  >
                    {t('recipeDetail.reset')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {displayDescription && (
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">{displayDescription}</p>
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

        {/* Paywall wrapper around ingredients + steps ---------------------- */}
        <div className={showPaywall ? 'relative min-h-[400px]' : ''}>
          {showPaywall && (
            <LockedOverlay
              icon="🔒"
              title={t('preview.recipeLockedTitle')}
              description={t('preview.recipeLockedDesc')}
            />
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
                <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="text-sm text-slate-700 min-w-0 break-words flex-1">{ing.name}</span>
                  <span className="text-sm font-medium text-slate-900 flex-shrink-0 tabular-nums whitespace-nowrap">
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

        {/* Chef's notes — tips, substitutions, storage. Kept verbatim from
            the recipe source. Preserves paragraph breaks. */}
        {displayNotes && displayNotes.trim() && (
          <section className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <h2 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
              <span aria-hidden>👩‍🍳</span>{t('recipeDetail.notes', { defaultValue: "Chef's notes" })}
            </h2>
            <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-line">{displayNotes}</p>
          </section>
        )}

        {/* Nutrition panel — only renders when recipe has nutrition data */}
        <NutritionPanel recipe={recipe} displayServings={displayServings} />
        </div>
        {/* end paywall wrapper */}

      </div>
    </div>
  )
}

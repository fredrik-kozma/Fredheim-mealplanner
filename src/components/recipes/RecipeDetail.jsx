import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
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
import { isFmdRecipe } from '../../utils/recipeFlags'
import { renderStepText } from '../../utils/scaleStepText'
import { formatDuration } from '../../utils/formatDuration'

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
  const allRecipes = useStore(s => s.recipes)
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
  const checkedIngredients = useStore(s => s.checkedIngredients)
  const toggleIngredientChecked = useStore(s => s.toggleIngredientChecked)
  const clearCheckedIngredients = useStore(s => s.clearCheckedIngredients)

  const unitSystem = useStore(s => s.units)
  // Normalize legacy 'imperial' value to 'us'.
  const preferredSystem = unitSystem === 'imperial' ? 'us' : (unitSystem || 'metric')

  // Opening a recipe from a planned meal slot carries the portion count that
  // slot is set to (state.servings, set by MealSlot) — the detail page opens
  // already scaled to it instead of the recipe's own default, so batch/family
  // sizing planned in the week doesn't have to be re-entered by hand here.
  const [displayServings, setDisplayServings] = useState(
    location.state?.servings || recipe?.servings || 4
  )
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

  // Cross-links to other recipes (e.g. a bread recipe pointing at a
  // separate "how to build a starter" reference). Stored as an array of
  // ids on the recipe; resolved here against the live recipe list so the
  // linked title always follows the current language and stays correct
  // even if the target recipe is later edited. Ids that don't resolve
  // (a pack installed without its companion recipe) are silently skipped
  // rather than showing a dead link.
  const relatedRecipes = (recipe.relatedRecipes || [])
    .map(relId => allRecipes.find(r => r.id === relId))
    .filter(Boolean)

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

  /*
   * `scalesLinearly: false` on an ingredient holds its amount at the
   * recipe's own figure however the servings are changed. Some things
   * genuinely don't scale with batch size — a yogurt starter is an
   * inoculum, not an ingredient: it seeds the batch and the culture then
   * grows on its own, so final density is set by time and temperature,
   * not by how much went in. Doubling it doesn't double the result, it
   * crowds the ferment and turns the set thin and grainy.
   *
   * Holding the base amount is the safe direction to be wrong in —
   * under-seeding just ferments slower — and the row is marked in the UI
   * so it's clear the number needs a human decision rather than looking
   * like an oversight.
   */
  function formatScaledQuantity(quantity, unit, scalesLinearly = true) {
    if (quantity === null || quantity === undefined || quantity === 0) return unit || ''

    const scaled = scalesLinearly
      ? quantity * (displayServings / (recipe.servings || 4))
      : quantity

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
      // A non-scaling ingredient prints its held amount and says so, since
      // a printout can't show the on-screen marker.
      name: ing.scalesLinearly === false && displayServings !== recipe.servings
        ? `${ing.name} — ${t('recipeDetail.doesNotScale', { defaultValue: 'adjust manually' })}`
        : ing.name,
      quantityLabel: formatScaledQuantity(ing.quantity, ing.unit, ing.scalesLinearly !== false),
    }))
    printRecipe({
      title: displayTitle,
      description: displayDescription || '',
      imageUrl: recipe.imageUrl || '',
      category: translatedCategory,
      prepTime: recipe.prepTime ?? null,
      cookTime: recipe.cookTime ?? null,
      servings: displayServings,
      conditions: recipeConditions(recipe).map(c => ({
        icon: c.icon,
        label: t(`conditions.${c.id}`, { defaultValue: c.id }),
      })),
      ingredients: printIngredients,
      steps: displaySteps || [],
      // Date follows the app's language, not the browser's.
      locale: i18n.language || undefined,
      labels: {
        ingredients: t('recipeDetail.ingredients'),
        instructions: t('recipeDetail.instructions'),
        servings: t('recipeDetail.servingsLabel', { defaultValue: 'Servings' }),
        prep: t('recipeDetail.prepLabel', { defaultValue: 'Prep' }),
        cook: t('recipeDetail.cookLabel', { defaultValue: 'Cook' }),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
        goodFor: t('recipeDetail.goodFor', { defaultValue: 'Good for' }),
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
          {/* `> 0`, not truthiness: a no-cook recipe stores cookTime 0, and
              `{0 && …}` evaluates to 0 — which React happily renders as a
              stray "0" chip next to the prep time. */}
          {recipe.prepTime > 0 && (
            <span className="badge bg-slate-100 text-slate-600">⏱ {t('recipeDetail.prep', { time: formatDuration(recipe.prepTime) })}</span>
          )}
          {recipe.cookTime > 0 && (
            <span className="badge bg-slate-100 text-slate-600">🔥 {t('recipeDetail.cook', { time: formatDuration(recipe.cookTime) })}</span>
          )}
          {/* Condition badges — which health conditions this recipe suits */}
          {recipeConditions(recipe).map(c => (
            <span key={c.id} className={`badge ${CONDITION_BADGE[c.color]}`}>
              {c.icon} {t(`conditions.${c.id}`, { defaultValue: c.id })}
            </span>
          ))}
        </div>

        {/* Fasting-diet notice — makes clear this is a restricted protocol
            meal, not a complete standalone one, before anyone plans around it. */}
        {isFmdRecipe(recipe) && (
          <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3">
            <span className="text-lg flex-shrink-0" aria-hidden>⏳</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {t('recipeDetail.fmdNoticeTitle', { defaultValue: 'Part of the 5-Day Fasting Mimicking Diet' })}
              </p>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                {t('recipeDetail.fmdNoticeBody', {
                  defaultValue: 'These meals are intentionally low-calorie and are not complete standalone meals. Follow the full FMD plan for it to work as intended.',
                })}
              </p>
            </div>
          </div>
        )}

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

        {/* Scale note — reflects what's actually shown below (displayServings),
            not the household default. Using familySize here was misleading: it
            could claim "scaled for 4" on a fresh page load where nothing was
            scaled yet, and stay silent when a recipe opened from the planner
            really was pre-scaled (whenever that override happened to equal the
            household size). */}
        {displayServings !== recipe.servings && (
          <div className="bg-indigo-50 rounded-xl px-4 py-2.5 mb-5 text-sm text-indigo-700 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {t('recipeDetail.scaledFor', { count: displayServings, original: recipe.servings })}
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

        {/* Ingredients — tap a row to tick it off while you shop or cook */}
        {displayIngredients?.length > 0 && (() => {
          const checkedForRecipe = checkedIngredients[recipe.id] || {}
          const checkedCount = displayIngredients.reduce((n, _ing, i) => n + (checkedForRecipe[i] ? 1 : 0), 0)
          const allChecked = checkedCount === displayIngredients.length
          return (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 min-w-0">
                {t('recipeDetail.ingredients')}
                {checkedCount > 0 && (
                  <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${allChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {checkedCount}/{displayIngredients.length}
                  </span>
                )}
                {checkedCount > 0 && (
                  <button
                    onClick={() => clearCheckedIngredients(recipe.id)}
                    className="text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors whitespace-nowrap"
                  >
                    {t('recipeDetail.resetChecklist', { defaultValue: 'Reset' })}
                  </button>
                )}
              </h2>
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
              {displayIngredients.map((ing, i) => {
                const isChecked = Boolean(checkedForRecipe[i])
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleIngredientChecked(recipe.id, i)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50/80 transition-colors"
                    aria-pressed={isChecked}
                  >
                    {/* Checkbox */}
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                    }`}>
                      {isChecked && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm min-w-0 break-words flex-1 transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {ing.name}
                      {/* Only worth saying once the servings have actually
                          been changed — at the recipe's own size the
                          amount shown is simply correct. */}
                      {ing.scalesLinearly === false && displayServings !== recipe.servings && (
                        <span className="ml-1.5 inline-flex items-center gap-1 badge bg-amber-100 text-amber-800 text-[11px] font-semibold align-middle">
                          <span aria-hidden>⚖️</span>
                          {t('recipeDetail.doesNotScale', { defaultValue: 'adjust manually' })}
                        </span>
                      )}
                    </span>
                    <span className={`text-sm font-medium flex-shrink-0 tabular-nums whitespace-nowrap transition-colors ${isChecked ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                      {formatScaledQuantity(ing.quantity, ing.unit, ing.scalesLinearly !== false)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
          )
        })()}

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
                  {/* Amounts marked {{…}} in the step text scale with the
                      serving count, using the same formatter as the
                      ingredient list so the two always agree. */}
                  <p className="text-sm text-slate-700 leading-relaxed pt-1">
                    {renderStepText(step, formatScaledQuantity)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Related recipes — e.g. a bread recipe pointing at a separate
            "how to build the starter" guide. Placed before Chef's notes so
            it's visible before someone starts cooking, not buried after. */}
        {relatedRecipes.length > 0 && (
          <section className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
            <h2 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-1.5">
              <span aria-hidden>🔗</span>{t('recipeDetail.relatedRecipes', { defaultValue: 'See also' })}
            </h2>
            <div className="flex flex-col gap-1.5">
              {relatedRecipes.map(rel => {
                const relTitle = rel.translations?.[currentLang]?.title || rel.title
                return (
                  <Link
                    key={rel.id}
                    to={`/recipes/${rel.id}`}
                    className="text-sm font-medium text-indigo-700 hover:text-indigo-900 hover:underline inline-flex items-center gap-1"
                  >
                    {relTitle}
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                    </svg>
                  </Link>
                )
              })}
            </div>
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

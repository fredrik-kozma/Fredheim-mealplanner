import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { normalizeUnit, CANONICAL_UNITS } from '../../utils/unitNormalizer'
import { formatScaledQuantity as scaleAndFormat, formatScaledIngredient as scaleIngredientRow } from '../../utils/scaleIngredient'
import { printRecipe } from '../../utils/printRecipe'
import { spoonHint, needsSpoonHint } from '../../utils/spoonHint'
import { useAccess } from '../../hooks/useAccess'
import LockedOverlay from '../subscription/LockedOverlay'
import NutritionPanel from './NutritionPanel'
import CollapsibleSection from '../common/CollapsibleSection'
import EditableNumber from '../common/EditableNumber'
import FavoriteStar from './FavoriteStar'
import { recipeConditions, recipeMealTypes, CONDITION_BADGE, CONDITION_TAGS } from '../../data/conditionTags'
import { isFmdRecipe } from '../../utils/recipeFlags'
import { renderStepText } from '../../utils/scaleStepText'
import ShareModal from '../share/ShareModal'
import { buildRecipePayload } from '../../utils/sharePayload'
import { recipeAsText } from '../../utils/shareText'
import { formatDuration } from '../../utils/formatDuration'
import { ingredientsAtLevel, recipeAtLevel, hasStandardSalt, hasStandardAmount, sodiumAtLevel, lowSaltOnlyLabels, saltLevelForRecipe } from '../../utils/saltLevel'
import { fmtNutrient } from '../../utils/nutritionData'
import { omegaRatio, formatOmegaRatio } from '../../utils/omegaBalance'
import { useCookingTicks } from '../../hooks/useCookingTicks'

const ICON_BUTTON = 'btn-ghost btn-icon !rounded-full text-slate-500'

// A section heading with how much of its checklist is ticked, and a Reset link
// once anything is. Whatever else belongs on the row comes in as children.
function ChecklistHeading({ title, done, total, resetLabel, onReset, children }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between mb-3 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {done > 0 && (
          <>
            <span
              aria-label={t('recipeDetail.ticksDone', { done, total })}
              className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${done === total ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {done}/{total}
            </span>
            <button
              type="button"
              onClick={onReset}
              aria-label={resetLabel}
              className="tap-target text-xs font-medium text-slate-500 hover:text-primary-600 transition-colors whitespace-nowrap"
            >
              {t('recipeDetail.resetChecklist', { defaultValue: 'Reset' })}
            </button>
          </>
        )}
      </div>
      {children}
    </div>
  )
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  // If the recipe was opened from the Planner or Today (they set state.from
  // to '/planner' or '/' when navigating here), the Back button returns
  // there. For every other entry point — Recipes list, deep link,
  // shopping list, etc. — Back still goes to the Recipes list so the
  // user's saved filter / sort state is restored from the store. This
  // preserves all earlier back-button behaviour.
  const backTarget = ['/planner', '/'].includes(location.state?.from) ? location.state.from : '/recipes'
  const recipe = useStore(s => s.recipes.find(r => r.id === id))
  const allRecipes = useStore(s => s.recipes)
  const deleteRecipe = useStore(s => s.deleteRecipe)
  const setLastOpenedRecipeId = useStore(s => s.setLastOpenedRecipeId)

  // Paywall: locked users can't see the full recipe unless it's a
  // designated free-preview recipe.
  const { isLocked, isPreviewRecipe } = useAccess()
  const showPaywall = isLocked && !isPreviewRecipe(id)

  // Remember this recipe so the nav can return to it. Only a recipe that
  // exists — a dead id would send the nav back to "Recipe not found".
  const recipeExists = !!recipe
  useEffect(() => {
    if (id && recipeExists) setLastOpenedRecipeId(id)
  }, [id, recipeExists, setLastOpenedRecipeId])
  const familySize = useStore(s => s.familySize)
  const language = useStore(s => s.language)
  // The global salt level, unless this recipe has its own (the toggle by
  // the ingredients). Picking the global value there clears the override.
  const defaultSaltLevel = useStore(s => s.saltLevel)
  const recipeSaltOverride = useStore(s => s.recipeSaltLevels?.[id])
  const saltLevel = saltLevelForRecipe(id, defaultSaltLevel, { [id]: recipeSaltOverride })
  const setRecipeSaltLevel = useStore(s => s.setRecipeSaltLevel)
  const clearRecipeSaltLevel = useStore(s => s.clearRecipeSaltLevel)
  const isDisliked = useStore(s => (s.dislikedRecipes || []).includes(id))
  const toggleDisliked = useStore(s => s.toggleDisliked)
  const { ticks, toggle: toggleTick, reset: resetTicks } = useCookingTicks(id)

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
  const [sharing, setSharing] = useState(null)

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <p className="text-slate-500">{t('recipes.notFound')}</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/recipes')}>{t('recipes.backToRecipes')}</button>
      </div>
    )
  }

  const scale = familySize / (recipe.servings || 4)

  // Use translated content if current language has a translation
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const translation = recipe.translations?.[currentLang]
  const displayTitle = translation?.title || recipe.title
  const displayDescription = translation?.description || recipe.description
  // As written (low salt), and at the chosen salt level: on Standard a
  // salt row shows its standard amount, with the low-salt one beside it.
  const writtenIngredients = translation?.ingredients || recipe.ingredients
  const displayIngredients = ingredientsAtLevel(writtenIngredients, saltLevel)
  const standardSalt = saltLevel === 'standard' && hasStandardSalt(recipe)
  const recipeAtSalt = recipeAtLevel(recipe, saltLevel)
  const displaySteps = translation?.steps || recipe.steps
  const displayNotes = translation?.notes || recipe.notes
  // What one serving is, for batch recipes ("2 slices (~92 g)", "30 g").
  const displayPortion = translation?.portion || recipe.portion

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
      navigate('/recipes')
    }
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
    return scaleAndFormat({
      quantity,
      unit,
      fromServings: recipe.servings,
      toServings: displayServings,
      system: activeSystem,
      lang: currentLang,
      scalesLinearly,
    })
  }

  // A whole row: name in the singular for "½ Sitron", and the amount,
  // kept in spoons for a spice.
  function scaledRow(ing) {
    return scaleIngredientRow(ing, {
      fromServings: recipe.servings,
      toServings: displayServings,
      system: activeSystem,
      lang: currentLang,
      scalesLinearly: ing.scalesLinearly !== false,
    })
  }

  // Does this recipe contain any unit that could be converted between
  // metric and US? If not, hide the toggle.
  const hasConvertibleUnit = (displayIngredients || []).some(ing => {
    const n = normalizeUnit(ing.unit)
    const m = CANONICAL_UNITS[n]
    return m && m.system !== 'both'
  })

  /**
   * What the share sheet needs for this recipe.
   *
   * The text is written at the recipe's own serving count rather than
   * whatever the slider is set to. A scaled copy is for cooking from
   * tonight; a shared one is the recipe itself, and 2.67 eggs in a
   * message helps nobody.
   *
   * The file branch only appears when a link genuinely can't do the job:
   * a recipe this person wrote, carrying a photo too big for a URL. Pack
   * recipes share as a pointer and the recipient already has the photo.
   */
  function buildShare() {
    const isOwn = !recipe.sourcePackId || recipe.userEdited
    const needsFile = isOwn && Boolean(recipe.imageUrl)
    return {
      payload: buildRecipePayload(recipe),
      title: displayTitle,
      text: recipeAsText({
        recipe,
        lang: currentLang,
        labels: {
          // Plain nouns, not the on-screen strings: recipeDetail.servings
          // is "{{count}} servings" and would print its own placeholder
          // when used as a heading.
          servings: t('share.servingsLabel', { defaultValue: 'Servings' }),
          ingredients: t('recipeDetail.ingredients', { defaultValue: 'Ingredients' }),
          steps: t('recipeDetail.instructions', { defaultValue: 'Instructions' }),
          notes: t('recipeDetail.notes', { defaultValue: "Chef's notes" }),
        },
        url: null,
      }),
      fileBuilder: needsFile
        ? () => {
          // A one-recipe pack, so the recipient opens it with the
          // importer that already exists under Packs.
          const pack = {
            id: `shared-${recipe.id}`,
            name: displayTitle,
            description: '',
            author: '',
            version: '1.0.0',
            tags: [],
            recipes: [recipe],
          }
          const json = JSON.stringify(pack, null, 2)
          return {
            file: new File([json], 'recipe.json', { type: 'application/json' }),
            filename: `${(displayTitle || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.json`,
          }
        }
        : null,
    }
  }

  function handlePrint() {
    const translatedCategory = t(`categories.${recipe.category}`, {
      defaultValue: recipe.category,
    })
    const printIngredients = (displayIngredients || []).map(ing => {
      // A non-scaling ingredient prints its held amount and says so, since
      // a printout can't show the on-screen marker. The remark goes at the
      // very end, after the note when there is one.
      const held = ing.scalesLinearly === false && displayServings !== recipe.servings
        ? ` — ${t('recipeDetail.doesNotScale', { defaultValue: 'adjust manually' })}`
        : ''
      const { name, quantityLabel, spoonHint: gramHint } = scaledRow(ing)
      return {
        name: ing.note ? name : name + held,
        note: ing.note ? ing.note + held : '',
        quantityLabel,
        spoonHint: gramHint || '',
      }
    })
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
      // Same rule as on screen — only where there is a spoon or a
      // millilitre to explain.
      spoonHint: needsSpoonHint(displayIngredients) ? spoonHint(currentLang) : '',
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

  const ingredientsDone = (displayIngredients || []).filter((_ing, i) => ticks.ingredients.includes(i)).length
  const stepsDone = (displaySteps || []).filter((_step, i) => ticks.steps.includes(i)).length

  const totalMinutes = (recipe.prepTime > 0 ? recipe.prepTime : 0) + (recipe.cookTime > 0 ? recipe.cookTime : 0)

  // The closed nutrition section's one line, per serving at this salt level.
  const perServing = recipeAtSalt.nutrition?.perServing
  const omega = perServing && omegaRatio(perServing.omega6, perServing.omega3)
  const nutritionSummary = perServing && [
    perServing.calories != null && `${Math.round(perServing.calories)} kcal`,
    perServing.protein != null && t('recipeDetail.summaryProtein', { amount: fmtNutrient(perServing.protein) }),
    omega && t('nutrition.omega63Short', { ratio: formatOmegaRatio(omega.ratio) }),
  ].filter(Boolean).join(' · ')

  const categoryLabel = t(`categories.${recipe.category}`, { defaultValue: recipe.category })
  // Meal types this recipe suits — skip one that just repeats the category.
  const mealTypeLabels = recipeMealTypes(recipe)
    .map(m => t(`mealTypes.${m}`, { defaultValue: m }))
    .filter(label => label !== categoryLabel)
  const conditions = recipeConditions(recipe)
  const aboutSummary = [
    categoryLabel,
    ...mealTypeLabels,
    ...conditions.map(c => t(`conditions.${c.id}`, { defaultValue: c.id })),
  ].join(' · ')

  return (
    <div className="max-w-2xl xl:max-w-5xl mx-auto pb-nav lg:pb-8 w-full min-w-0 overflow-x-hidden">
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
        <div className="mx-4 mt-3 rounded-card overflow-hidden h-64 sm:h-80 xl:h-96 relative">
          <img src={recipe.imageUrl} alt={displayTitle} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="px-4 mt-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight break-words">
          {displayTitle}
        </h1>

        {/* Description */}
        {displayDescription && (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{displayDescription}</p>
        )}

        {/* Total time, with its parts. `> 0`, not truthiness: a no-cook
            recipe stores cookTime 0. */}
        {totalMinutes > 0 && (
          <p className="mt-3 text-sm text-slate-600 flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-slate-800">⏱ {t('recipeDetail.totalTime', { time: formatDuration(totalMinutes) })}</span>
            {recipe.prepTime > 0 && recipe.cookTime > 0 && (
              <span className="text-xs text-slate-500">
                {t('recipeDetail.prep', { time: formatDuration(recipe.prepTime) })} · {t('recipeDetail.cook', { time: formatDuration(recipe.cookTime) })}
              </span>
            )}
          </p>
        )}

        {/* Print / Edit / Delete are subscriber-only — hidden when the
            user is locked out (anonymous or expired). They can still see
            and tap the recipe to view the paywall, but cannot mutate or
            export the content. */}
        {!showPaywall && (
          <div className="flex flex-wrap items-center gap-1 mt-3 -ml-2">
            <FavoriteStar recipeId={id} size="lg" />
            {/* "Not for me": Make my week never picks it. */}
            <button
              onClick={() => toggleDisliked(id)}
              aria-pressed={isDisliked}
              className={`tap-target ${ICON_BUTTON} ${isDisliked ? 'bg-slate-700 text-white hover:bg-slate-800 hover:text-white' : ''}`}
              title={isDisliked ? t('dislike.remove') : `${t('dislike.add')}: ${t('dislike.hint')}`}
              aria-label={isDisliked ? t('dislike.remove') : t('dislike.add')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
            <button
              onClick={() => setSharing(buildShare())}
              className={ICON_BUTTON}
              title={t('recipeDetail.share', { defaultValue: 'Share' })}
              aria-label={t('recipeDetail.share', { defaultValue: 'Share' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
              </svg>
            </button>
            <button
              onClick={handlePrint}
              className={ICON_BUTTON}
              title={t('recipeDetail.print', { defaultValue: 'Print' })}
              aria-label={t('recipeDetail.print', { defaultValue: 'Print' })}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
            </button>
            <button
              onClick={() => navigate(`/recipes/${id}/edit`)}
              className={ICON_BUTTON}
              title={t('recipeDetail.edit')}
              aria-label={t('recipeDetail.edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className={`tap-target ${ICON_BUTTON} hover:bg-danger-50 hover:text-danger-600`}
              title={t('recipeDetail.delete')}
              aria-label={t('recipeDetail.delete')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        )}

        {isDisliked && (
          <p className="mt-2 text-xs text-slate-500">
            🚫 {t('dislike.add')}: {t('dislike.hint')}
          </p>
        )}

        {/* Fasting-diet notice — makes clear this is a restricted protocol
            meal, not a complete standalone one, before anyone plans around it. */}
        {isFmdRecipe(recipe) && (
          <div className="mt-4 rounded-control bg-warning-50 border border-warning-200 px-4 py-3 flex gap-3">
            <span className="text-lg flex-shrink-0" aria-hidden>⏳</span>
            <div>
              <p className="text-sm font-semibold text-warning-900">
                {t('recipeDetail.fmdNoticeTitle', { defaultValue: 'Part of the 5-Day Fasting Mimicking Diet' })}
              </p>
              <p className="text-xs text-warning-800 leading-relaxed mt-0.5">
                {t('recipeDetail.fmdNoticeBody', {
                  defaultValue: 'These meals are intentionally low-calorie and are not complete standalone meals. Follow the full FMD plan for it to work as intended.',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Servings. The counter keeps a fixed width with tabular-nums, so
            going from "1" to "20" doesn't change the widget's geometry, and
            Reset wraps to its own row on a narrow or zoomed screen. */}
        {recipe.servings && (
          <div className="card px-4 py-3 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{t('recipeDetail.servingsLabel', { defaultValue: 'Servings' })}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('recipeDetail.originalServings')}: {t('recipeDetail.servings', { count: recipe.servings })}
                </p>
                {displayPortion && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('recipeDetail.portion', { portion: displayPortion, defaultValue: '1 serving: {{portion}}' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {displayServings !== recipe.servings && (
                  <button
                    onClick={() => setDisplayServings(recipe.servings)}
                    className="btn-ghost btn-sm flex-shrink-0"
                    title={t('recipeDetail.resetServings')}
                  >
                    {t('recipeDetail.reset')}
                  </button>
                )}
                <button
                  onClick={() => setDisplayServings(Math.max(1, displayServings - 1))}
                  className="tap-target flex-shrink-0 w-10 h-10 rounded-control bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center transition-colors"
                  title={t('recipeDetail.decreaseServings')}
                  aria-label={t('recipeDetail.decreaseServings')}
                >
                  −
                </button>
                <div className="flex-shrink-0 w-14">
                  {/* Editable: tap to clear and type a fresh value. */}
                  <EditableNumber
                    value={displayServings}
                    onChange={setDisplayServings}
                    min={1}
                    max={999}
                    className="w-full text-center font-semibold text-slate-900 bg-primary-50 border border-primary-200 rounded-control px-1 py-2 text-sm tabular-nums"
                  />
                </div>
                <button
                  onClick={() => setDisplayServings(displayServings + 1)}
                  className="tap-target flex-shrink-0 w-10 h-10 rounded-control bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center justify-center transition-colors"
                  title={t('recipeDetail.increaseServings')}
                  aria-label={t('recipeDetail.increaseServings')}
                >
                  +
                </button>
              </div>
            </div>
            {/* Reflects what's actually shown below (displayServings), not
                the household default: a recipe opened from the planner can
                be pre-scaled, and a fresh page load is not. */}
            {displayServings !== recipe.servings && (
              <p className="mt-2 text-xs text-primary-700">
                {t('recipeDetail.scaledFor', { count: displayServings, original: recipe.servings })}
              </p>
            )}
          </div>
        )}

        {/* Paywall wrapper around ingredients + steps ---------------------- */}
        <div className={`mt-6 ${showPaywall ? 'relative min-h-[400px]' : ''}`}>
          {showPaywall && (
            <LockedOverlay
              icon="🔒"
              title={t('preview.recipeLockedTitle')}
              description={t('preview.recipeLockedDesc')}
            />
          )}

        {/* The two things you cook from: one column on a phone, side by side
            once there is room for both. */}
        <div className="space-y-6 xl:space-y-0 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:gap-8 xl:items-start">

        {/* Ingredients — tap a row to tick it off while you shop or cook */}
        {displayIngredients?.length > 0 && (
          <section>
            <ChecklistHeading
              title={t('recipeDetail.ingredients')}
              done={ingredientsDone}
              total={displayIngredients.length}
              resetLabel={t('recipeDetail.resetIngredients')}
              onReset={() => resetTicks('ingredients')}
            >
              {hasConvertibleUnit && (
                <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setViewSystem('metric')}
                    className={`tap-target px-3 py-1 rounded-full transition-colors ${
                      activeSystem === 'metric' ? 'bg-white text-primary-700 shadow-card' : 'text-slate-500'
                    }`}
                  >
                    {t('recipeDetail.metric', { defaultValue: 'Metric' })}
                  </button>
                  <button
                    onClick={() => setViewSystem('us')}
                    className={`tap-target px-3 py-1 rounded-full transition-colors ${
                      activeSystem === 'us' ? 'bg-white text-primary-700 shadow-card' : 'text-slate-500'
                    }`}
                  >
                    {t('recipeDetail.us', { defaultValue: 'US' })}
                  </button>
                </div>
              )}
            </ChecklistHeading>
            {/* Salt level for this recipe only, when it has a standard
                amount. Starts at the global setting; the shopping list
                follows the choice. */}
            {hasStandardSalt(recipe) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3">
                <div
                  role="group"
                  aria-label={t('salt.recipeToggle')}
                  className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium"
                >
                  {['low', 'standard'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRecipeSaltLevel(id, level)}
                      aria-pressed={saltLevel === level}
                      aria-label={t(`salt.${level}`)}
                      className={`tap-target px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                        saltLevel === level ? 'bg-white text-primary-700 shadow-card' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t(`salt.short.${level}`)}
                    </button>
                  ))}
                </div>
                {recipeSaltOverride && (
                  <button
                    type="button"
                    onClick={() => clearRecipeSaltLevel(id)}
                    className="tap-target text-xs font-medium text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    {t('salt.resetToDefault', { level: t(`salt.short.${defaultSaltLevel}`) })}
                  </button>
                )}
              </div>
            )}
            <div className="card divide-y divide-slate-50">
              {displayIngredients.map((ing, i) => {
                const isChecked = ticks.ingredients.includes(i)
                const row = scaledRow(ing)
                // On Standard, the amount as written: "Low salt: ½ tsp".
                const written = writtenIngredients[i]
                const lowSaltHint = standardSalt && hasStandardAmount(written)
                  ? t('salt.lowHint', {
                    amount: written.quantity == null
                      ? t('salt.toTaste')
                      : scaledRow(written).quantityLabel,
                  })
                  : null
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleTick('ingredients', i)}
                    className="tap-target w-full min-h-[2.75rem] flex items-start gap-3 px-4 py-2.5 text-left first:rounded-t-card last:rounded-b-card hover:bg-slate-50/80 transition-colors focus-visible:-outline-offset-2"
                    aria-pressed={isChecked}
                  >
                    {/* Checkbox */}
                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-small border flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-success-500 border-success-500' : 'bg-white border-slate-300'
                    }`}>
                      {isChecked && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm min-w-0 break-words flex-1 transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {row.name}
                      {ing.note && (
                        <span className={`text-xs ${isChecked ? 'text-slate-300' : 'text-slate-400'}`}>, {ing.note}</span>
                      )}
                      {/* Only worth saying once the servings have actually
                          been changed — at the recipe's own size the
                          amount shown is simply correct. */}
                      {ing.scalesLinearly === false && displayServings !== recipe.servings && (
                        <span className="ml-1.5 inline-flex items-center gap-1 badge bg-warning-100 text-warning-800 text-2xs font-semibold align-middle">
                          <span aria-hidden>⚖️</span>
                          {t('recipeDetail.doesNotScale', { defaultValue: 'adjust manually' })}
                        </span>
                      )}
                      {lowSaltHint && (
                        <span className={`block text-2xs ${isChecked ? 'text-slate-300' : 'text-slate-400'}`}>💗 {lowSaltHint}</span>
                      )}
                    </span>
                    <span className={`text-sm font-medium text-right flex-shrink-0 tabular-nums whitespace-nowrap transition-colors ${isChecked ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
                      {row.quantityLabel}
                      {row.spoonHint && (
                        <span className={`block sm:inline text-xs font-normal ${isChecked ? 'text-slate-300' : 'text-slate-400'}`}>{' '}{row.spoonHint}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Spoon reminder, directly under the amounts it explains.
                Scaling turns "0.25 tsp" into "1.7 ml", and nobody can
                picture a millilitre of salt — this gets them back to a
                spoon they own. Only on recipes that actually measure by
                spoon or millilitre. */}
            {needsSpoonHint(displayIngredients) && (
              <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                <span aria-hidden>🥄</span>
                {spoonHint(currentLang)}
              </p>
            )}
          </section>
        )}

        {/* Steps — tap one to mark it done */}
        {displaySteps?.length > 0 && (
          <section>
            <ChecklistHeading
              title={t('recipeDetail.instructions')}
              done={stepsDone}
              total={displaySteps.length}
              resetLabel={t('recipeDetail.resetSteps')}
              onReset={() => resetTicks('steps')}
            />
            <ol className="card divide-y divide-slate-50">
              {displaySteps.map((step, i) => {
                const isDone = ticks.steps.includes(i)
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => toggleTick('steps', i)}
                      aria-pressed={isDone}
                      className="tap-target w-full min-h-[2.75rem] flex items-start gap-3 px-4 py-3 text-left rounded-card hover:bg-slate-50/80 transition-colors focus-visible:-outline-offset-2"
                    >
                      <span
                        aria-hidden
                        className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                          isDone ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {isDone ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : i + 1}
                      </span>
                      {/* Amounts marked {{…}} in the step text scale with the
                          serving count, using the same formatter as the
                          ingredient list so the two always agree. */}
                      <span className={`text-base leading-relaxed min-w-0 break-words transition-colors ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {renderStepText(step, formatScaledQuantity)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        </div>

        {/* Everything else, closed until asked for. */}
        <div className="mt-6 space-y-3">
        {/* Nutrition panel — only renders when recipe has nutrition data.
            Sodium follows the salt level; the labels never do. */}
        {perServing && (
          <CollapsibleSection
            icon="🥗"
            title={`${t('nutrition.title', { defaultValue: 'Nutrition' })} · ${t('nutrition.perServing', { defaultValue: 'Per serving' }).toLowerCase()}`}
            summary={nutritionSummary}
          >
            <NutritionPanel recipe={recipeAtSalt} displayServings={displayServings} bare />
            {standardSalt && sodiumAtLevel(recipe, 'low') != null && (
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                🧂 {t('salt.sodiumLine', {
                  standard: Math.round(sodiumAtLevel(recipe, 'standard')),
                  low: Math.round(sodiumAtLevel(recipe, 'low')),
                })}
              </p>
            )}
          </CollapsibleSection>
        )}

        {/* Chef's notes — tips, substitutions, storage. Kept verbatim from
            the recipe source. Preserves paragraph breaks. */}
        {displayNotes && displayNotes.trim() && (
          <CollapsibleSection
            icon="👩‍🍳"
            title={t('recipeDetail.notes', { defaultValue: "Chef's notes" })}
            summary={displayNotes.trim().split('\n')[0]}
          >
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{displayNotes}</p>
          </CollapsibleSection>
        )}

        {/* Related recipes — e.g. a bread recipe pointing at a separate
            "how to build the starter" guide. The summary names them, so
            they're noticed before someone starts cooking. */}
        {relatedRecipes.length > 0 && (
          <CollapsibleSection
            icon="🔗"
            title={t('recipeDetail.relatedRecipes', { defaultValue: 'See also' })}
            summary={relatedRecipes.map(rel => rel.translations?.[currentLang]?.title || rel.title).join(' · ')}
          >
            <div className="flex flex-col gap-1.5">
              {relatedRecipes.map(rel => {
                const relTitle = rel.translations?.[currentLang]?.title || rel.title
                return (
                  <Link
                    key={rel.id}
                    to={`/recipes/${rel.id}`}
                    className="tap-target text-sm font-medium text-primary-700 hover:text-primary-900 hover:underline inline-flex items-center gap-1"
                  >
                    {relTitle}
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </CollapsibleSection>
        )}
        </div>
        </div>
        {/* end paywall wrapper */}

        {/* Category, meal types and health labels, outside the paywall as
            they always were. The labels are judged on the recipe as written
            (low salt): say so for each sodium-based label the standard
            sodium is over. */}
        <div className="mt-3">
          <CollapsibleSection icon="🏷️" title={t('recipeDetail.about')} summary={aboutSummary}>
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-primary-50 text-primary-700">{categoryLabel}</span>
              {mealTypeLabels.map(label => (
                <span key={label} className="badge bg-slate-100 text-slate-600">{label}</span>
              ))}
              {conditions.map(c => (
                <span key={c.id} className={`badge ${CONDITION_BADGE[c.color]}`}>
                  {c.icon} {t(`conditions.${c.id}`, { defaultValue: c.id })}
                </span>
              ))}
            </div>
            {lowSaltOnlyLabels(recipe, saltLevel).map(label => (
              <p key={label} className="mt-2 text-xs text-slate-500">
                {CONDITION_TAGS.find(c => c.id === label)?.icon} {t('salt.labelNote', { label: t(`conditions.${label}`) })}
              </p>
            ))}
          </CollapsibleSection>
        </div>

      </div>

      {sharing && (
        <ShareModal
          kind="recipe"
          payload={sharing.payload}
          text={sharing.text}
          title={sharing.title}
          fileBuilder={sharing.fileBuilder}
          onClose={() => setSharing(null)}
        />
      )}
    </div>
  )
}

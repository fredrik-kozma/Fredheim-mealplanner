import { DAYS, normalizeSlotItem } from '../store/useStore'
import { dayOmega, planDayMeals } from './omegaBalance'

/**
 * What the Today screen shows, from the week plan. The planner is a repeating
 * Mon–Sun week, so the bridge from a real date is its weekday.
 */

/** The plan's day key for a date ('monday'…), Monday-first like the planner. */
export function weekdayKey(date) {
  return DAYS[(date.getDay() + 6) % 7]
}

/** The day after a date, across month ends and clock changes. */
export function nextDay(date) {
  const out = new Date(date)
  out.setDate(out.getDate() + 1)
  return out
}

// Slots are free-form (Settings can add them), so go by the name.
const SNACK_SLOT = /snack|mellom|mellanm/i

/**
 * A day's meals in slot order, leaving out snacks: [{ slot, item, recipe }],
 * with `recipe` null for a typed-in meal. An id whose recipe is gone (a pack
 * removed since it was planned) is skipped, as it is on the planner.
 */
export function dayMeals(weekPlan, day, mealSlots, getRecipe) {
  const slots = weekPlan?.[day] || {}
  const meals = []
  for (const slot of mealSlots || []) {
    if (SNACK_SLOT.test(slot)) continue
    for (const raw of slots[slot] || []) {
      const item = normalizeSlotItem(raw)
      if (!item) continue
      if (item.kind === 'custom') { meals.push({ slot, item, recipe: null }); continue }
      const recipe = getRecipe(item.recipeId)
      if (recipe) meals.push({ slot, item, recipe })
    }
  }
  return meals
}

// The day as planDayMeals wants it: no snacks, no recipes that are gone.
function countedItems(weekPlan, day, getRecipe) {
  const known = {}
  for (const [slot, items] of Object.entries(weekPlan?.[day] || {})) {
    if (SNACK_SLOT.test(slot)) continue
    known[slot] = (items || [])
      .map(normalizeSlotItem)
      .filter(item => item && (item.kind === 'custom' || getRecipe(item.recipeId)))
  }
  return known
}

/**
 * What one person eats of a planned day, for the food log: the same meals and
 * portions as daySummary, as [{ recipeId, portions }]. A typed-in meal has no
 * recipe to log, so it's left out.
 */
export function plannedPortions(weekPlan, day, getRecipe, people) {
  return planDayMeals(countedItems(weekPlan, day, getRecipe), getRecipe, people || 1)
    .filter(meal => meal.recipe)
    .map(meal => ({ recipeId: meal.recipe.id, portions: meal.portions }))
}

/**
 * Energy and omega balance for a day's meals, per person, leaving out snacks
 * as the cards do: { kcal, kcalComplete, omega } with omega from dayOmega, or
 * null for a day with nothing on it. `kcalComplete` is false when a typed-in
 * meal or a recipe without nutrition means the figure is only a lower bound.
 */
export function daySummary(weekPlan, day, getRecipe, people) {
  const meals = planDayMeals(countedItems(weekPlan, day, getRecipe), getRecipe, people || 1)
  if (!meals.length) return null

  let kcal = 0
  let kcalComplete = true
  for (const { recipe, portions } of meals) {
    const perServing = recipe?.nutrition?.perServing?.calories ?? recipe?.kcal
    if (perServing == null) kcalComplete = false
    else kcal += perServing * portions
  }
  return { kcal: Math.round(kcal), kcalComplete, omega: dayOmega(meals) }
}

/**
 * Omega-6 : omega-3 balance of a recipe, a day or a week. A ratio is only
 * given when every meal counted carries both values: a day with one meal
 * unknown is incomplete, not a better-looking ratio. A week adds up its
 * complete days and says how many of the planned or logged days that is.
 */

// At or below ~4:1 is widely considered favourable.
const GOOD_RATIO = 4

/** { ratio, favourable } from grams of each, or null without any omega-3 to divide by. */
export function omegaRatio(omega6, omega3) {
  if (omega6 == null || omega3 == null || !(omega3 > 0)) return null
  const ratio = omega6 / omega3
  return { ratio, favourable: ratio <= GOOD_RATIO }
}

/** "3.2 : 1", as the recipe panel writes it. */
export function formatOmegaRatio(ratio) {
  return `${ratio < 1 ? ratio.toFixed(2) : ratio < 10 ? ratio.toFixed(1) : Math.round(ratio)} : 1`
}

/**
 * One day from [{ recipe, portions }]. A missing recipe counts as a meal with
 * no values. Returns { complete, empty, omega6, omega3, ratio, favourable }.
 */
export function dayOmega(meals) {
  const list = meals || []
  let omega6 = 0
  let omega3 = 0
  let complete = list.length > 0
  for (const { recipe, portions } of list) {
    const per = recipe?.nutrition?.perServing
    if (per?.omega3 == null || per?.omega6 == null) { complete = false; continue }
    omega6 += per.omega6 * portions
    omega3 += per.omega3 * portions
  }
  const result = complete ? omegaRatio(omega6, omega3) : null
  return { complete: complete && result != null, empty: list.length === 0, omega6, omega3, ...result }
}

/**
 * A week from its days (dayOmega results): the sum of the complete days.
 * Days with nothing on them don't count. Returns
 * { days, complete, ratio, favourable } or null when no day can be counted.
 */
export function weekOmega(days) {
  const eaten = (days || []).filter(d => !d.empty)
  const counted = eaten.filter(d => d.complete)
  if (!counted.length) return null
  const result = omegaRatio(
    counted.reduce((n, d) => n + d.omega6, 0),
    counted.reduce((n, d) => n + d.omega3, 0))
  return result && { days: eaten.length, complete: counted.length, ...result }
}

/** The food log's entries for one date as meals for dayOmega. */
export function logMeals(entries, recipeMap) {
  return (entries || []).map(e => ({ recipe: recipeMap[e.recipeId], portions: e.portions || 0 }))
}

/**
 * A planned day (plan[day] = { slot: [{ recipeId, servings }] }) as meals for
 * dayOmega, per person: servings is for the household, null = one each.
 */
export function planDayMeals(slots, getRecipe, people) {
  return Object.values(slots || {}).flat().map(it => ({
    recipe: getRecipe(it.recipeId),
    portions: it.servings == null ? 1 : it.servings / people,
  }))
}

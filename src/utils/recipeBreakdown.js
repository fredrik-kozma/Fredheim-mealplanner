/**
 * "Where did this amount come from?" — one ingredient's total split back
 * out per recipe.
 *
 * Shared by the live shopping list's ⓘ popover and the saved-list
 * viewer. They showed the same thing with separately written code and
 * drifted apart the moment one of them was corrected, which is the whole
 * reason this file exists.
 *
 * The rounding is the subtle part. formatQuantity rounds countable
 * things up, and is right to: a 2.4-clove total means buying 3 cloves,
 * because shops do not sell 0.4 of one. But applying that to each
 * contribution turns 0.67 + 0.4 + 1.33 into 1 + 1 + 2 sitting under a
 * total of 3, and a breakdown whose parts add up to more than the total
 * above them reads as a bug — the reasonable conclusion being that the
 * total is wrong, when it is the only number that was right.
 *
 * So a breakdown explains where the total goes; it does not say what to
 * buy. Parts keep a decimal, the total keeps its rounding-up, and the
 * two reconcile.
 */

import { formatQuantity } from './shoppingListGenerator'
import { combineQuantities } from './ingredientMatcher'
import { COUNTABLE_UNITS } from './unitNormalizer'

/** One recipe's share of an amount, rounded to explain rather than to buy. */
export function breakdownQuantity(quantity, unit) {
  if (typeof quantity !== 'number' || !isFinite(quantity)) return formatQuantity(quantity, unit)
  if (!COUNTABLE_UNITS.has(unit)) return formatQuantity(quantity, unit)
  const rounded = Math.round(quantity * 10) / 10
  return unit ? `${rounded} ${unit}` : String(rounded)
}

/**
 * @param sources [{ recipe, quantity, unit }] — one entry per ingredient
 *                line, so a recipe can appear more than once
 * @returns [{ recipe, label }] summed per recipe, source order preserved
 */
export function buildRecipeBreakdown(sources) {
  const byRecipe = {}
  for (const s of sources || []) {
    (byRecipe[s.recipe] = byRecipe[s.recipe] || []).push(s)
  }
  return Object.entries(byRecipe).map(([recipe, arr]) => {
    // Summed here rather than by combineQuantities, which for a countable
    // unit rounds each part up and returns a finished string — the very
    // rounding this avoids, already baked in and no longer a number.
    // Mixed units within one recipe still go through it, since that is
    // the case it exists for.
    const units = new Set(arr.map(s => s.unit || ''))
    if (units.size === 1) {
      const total = arr.reduce((n, s) => n + (s.quantity || 0), 0)
      return { recipe, label: breakdownQuantity(total, arr[0].unit || '') }
    }
    const sum = combineQuantities(arr)
    return { recipe, label: formatQuantity(sum.quantity, sum.unit) }
  })
}

/**
 * "Where did this amount come from?" — one ingredient's total split back
 * out per recipe.
 *
 * Shared by the live shopping list's ⓘ popover and the saved-list
 * viewer. They showed the same thing with separately written code and
 * drifted apart the moment one of them was corrected, which is the whole
 * reason this file exists.
 *
 * Each recipe's share is summed raw and formatted once, so "⅔ fedd" under
 * a recipe means the same thing it means on that recipe's own page.
 *
 * Deliberately without the shopping list's roundUpWhole: rounding each
 * share up turns ⅔ + ⅓ + 1⅓ into 1 + 1 + 2 under a total of 3, and a
 * breakdown whose parts add up to more than the total reads as a bug. The
 * total says what to buy; the parts explain where it goes.
 */

import { formatQuantity } from './formatQuantity.js'
import { combineQuantities } from './ingredientMatcher.js'

/**
 * @param sources [{ recipe, quantity, unit, note? }] — one entry per
 *                ingredient line, so a recipe can appear more than once
 * @param lang    for unit labels and decimal commas
 * @returns [{ recipe, label, note }] summed per recipe, source order
 *          preserved. `note` is what the recipe does with it ("diced"),
 *          distinct notes joined; '' when there is none (and always for
 *          lists saved before notes existed).
 */
export function buildRecipeBreakdown(sources, lang = 'en') {
  const byRecipe = {}
  for (const s of sources || []) {
    (byRecipe[s.recipe] = byRecipe[s.recipe] || []).push(s)
  }
  return Object.entries(byRecipe).map(([recipe, arr]) => {
    const note = [...new Set(arr.map(s => s.note).filter(Boolean))].join('; ')
    // Summed directly when the recipe uses one unit, so the share stays in
    // the unit the recipe wrote; mixed units within one recipe go through
    // combineQuantities, since that is the case it exists for.
    const units = new Set(arr.map(s => s.unit || ''))
    if (units.size === 1) {
      const total = arr.reduce((n, s) => n + (s.quantity || 0), 0)
      return { recipe, label: formatQuantity(total, arr[0].unit || '', lang), note }
    }
    const sum = combineQuantities(arr)
    return { recipe, label: formatQuantity(sum.quantity, sum.unit, lang), note }
  })
}

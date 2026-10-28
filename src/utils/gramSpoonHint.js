/**
 * The "(≈ 2 tsp)" next to a small amount in grams.
 *
 * Seeds, powders, pastes and herbs are stored in grams so the shopping
 * list can add them up, but nobody weighs 4 g of agar — they reach for a
 * spoon. Where the dictionary knows what a teaspoon of the ingredient
 * weighs (entry.spoonGrams.gPerTsp; a tablespoon is three of those), the
 * recipe view shows the spoon measure beside the grams.
 *
 * Only when the conversion comes out clean: a hint that says "≈ 1 ⅓ tsp"
 * for something that is really 1.1 tsp would be worse than none. Large
 * amounts get nothing either — 50 g of seeds is weighed, not spooned.
 *
 * The shopping list never shows this; it is about cooking, not buying.
 *
 * Imports carry the .js extension so the node test can load this file.
 */

import { normalizeUnit } from './unitNormalizer.js'
import { displayedAmount, formatQuantity } from './formatQuantity.js'
import { dictionaryEntry } from './ingredientDictionary.js'

const MAX_GRAMS = 30
const MIN_TSP = 1 / 8
// From about one tablespoon up, say tablespoons.
const TBSP_FROM_TSP = 2.85
const MAX_TSP = 8
const MAX_TBSP = 4
// How far the snapped spoon amount may sit from the real one.
const MAX_RELATIVE_ERROR = 0.22

/**
 * @param {object} p
 * @param {number} p.quantity      grams, already scaled to the servings shown
 * @param {string} p.unit
 * @param {string} p.ingredientId  dictionary id
 * @param {string} [p.lang='en']
 * @returns {string|null} e.g. "(≈ 2 tsp)", "(≈ 1 ss)", or null
 */
export function formatGramSpoonHint({ quantity, unit, ingredientId, lang = 'en' }) {
  if (normalizeUnit(unit) !== 'g') return null
  const gPerTsp = dictionaryEntry(ingredientId)?.spoonGrams?.gPerTsp
  if (!(gPerTsp > 0)) return null
  // The real scaled amount, not the rounded one on screen: 14 g of flax
  // shows as "15 g" but is still 2 tbsp.
  if (typeof quantity !== 'number' || !(quantity > 0) || quantity >= MAX_GRAMS + 0.5) return null

  const tspRaw = quantity / gPerTsp
  if (tspRaw < MIN_TSP) return null
  const spoon = tspRaw >= TBSP_FROM_TSP ? 'tbsp' : 'tsp'
  const raw = spoon === 'tbsp' ? tspRaw / 3 : tspRaw
  // formatQuantity's own snap (whole + ¼ ⅓ ½ ⅔ ¾), so the label shows
  // exactly the amount checked here.
  const rounded = displayedAmount(raw, spoon)
  if (!rounded || rounded < 0.25) return null
  if (Math.abs(rounded - raw) / raw > MAX_RELATIVE_ERROR) return null
  if (rounded > (spoon === 'tbsp' ? MAX_TBSP : MAX_TSP)) return null

  return `(≈ ${formatQuantity(rounded, spoon, lang)})`
}

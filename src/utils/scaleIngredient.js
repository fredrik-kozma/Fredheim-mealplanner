import { normalizeUnit, CANONICAL_UNITS, convertToSystem } from './unitNormalizer.js'
import { formatQuantity } from './formatQuantity.js'
import { dictionaryEntry, nameForAmount, prefersSpoons } from './ingredientDictionary.js'
import { formatGramSpoonHint } from './gramSpoonHint.js'
import { formatLiquidSpoonHint } from './liquidSpoonHint.js'

/**
 * Scales one ingredient amount and renders it as a display string.
 *
 * Shared by the recipe view, its print, the step text and the menu book,
 * which prints each recipe at the servings chosen for that day. Scaling
 * and unit conversion happen here; the rounding is formatQuantity's, the
 * same as the shopping list's.
 */

/**
 * @param {object} opts
 * @param {number|null} opts.quantity
 * @param {string} opts.unit
 * @param {number} opts.fromServings   The recipe's own serving count
 * @param {number} opts.toServings     What it's being scaled to
 * @param {'metric'|'us'} [opts.system='metric']
 * @param {string} [opts.lang='en']    For the unit label
 * @param {boolean} [opts.scalesLinearly=true]  False holds the amount — see
 *   RecipeDetail: a yogurt starter is an inoculum, not an ingredient.
 * @param {string} [opts.ingredient]  Dictionary id; a spice stays in spoons.
 * @returns {string} e.g. "300 g", "1 ½ ts", or just the unit when there's
 *   no measurable amount (the "to taste" convention).
 */
export function formatScaledQuantity(opts) {
  const { quantity, unit } = scaleQuantity(opts)
  return formatMeasuredQuantity(quantity, unit, opts.lang || 'en', opts)
}

/**
 * Same as formatQuantity, plus an opted-in weighed amount.
 * `weighGrams` is the physical weight of this scaled amount. When the
 * spoon label would not match it (a 0.5 g salt row stored as 1/12 tsp
 * otherwise reads as ¼ tsp), the weight is what the cook sees.
 */
export function formatMeasuredQuantity(quantity, unit, lang = 'en', { ingredientId, weighGrams, roundUpWhole } = {}) {
  return formatQuantity(quantity, unit, lang, {
    roundUpWhole,
    weighGrams,
    gramsPerTsp: dictionaryEntry(ingredientId)?.spoonGrams?.gPerTsp,
  })
}

/**
 * One recipe row, scaled: its name — singular when the amount shown is
 * one or less of a counted thing ("½ Sitron") — its amount label, and
 * the "(≈ 2 tsp)" for a small amount in grams or "(45 ml, about 45 g)" for
 * a liquid in spoons (null when there is none; the caller decides whether
 * to show it).
 * `opts` as formatScaledQuantity, minus quantity/unit/ingredient.
 */
export function formatScaledIngredient(row, opts) {
  const lang = opts.lang || 'en'
  const scaled = scaleQuantity({ ...opts, quantity: row.quantity, unit: row.unit, ingredient: row.ingredient })
  const factor = opts.scalesLinearly === false ? 1 : (opts.toServings / (opts.fromServings || 4))
  const weighGrams = row.weighGrams > 0 ? row.weighGrams * factor : undefined
  return {
    name: nameForAmount(row, lang, scaled.quantity, scaled.unit),
    quantityLabel: formatMeasuredQuantity(scaled.quantity, scaled.unit, lang, {
      ingredientId: row.ingredient,
      weighGrams,
    }),
    spoonHint: formatGramSpoonHint({ ...scaled, ingredientId: row.ingredient, lang })
      || formatLiquidSpoonHint({ ...scaled, row, lang }),
  }
}

// The amount and unit to show, unrounded; null quantity for "to taste".
function scaleQuantity({
  quantity,
  unit,
  fromServings,
  toServings,
  system = 'metric',
  scalesLinearly = true,
  ingredient = null,
}) {
  if (quantity === null || quantity === undefined || quantity === 0) {
    return { quantity: null, unit }
  }

  const scaled = scalesLinearly
    ? quantity * (toServings / (fromServings || 4))
    : quantity

  const normalized = normalizeUnit(unit)
  const meta = CANONICAL_UNITS[normalized]

  if (meta && meta.system !== 'both') {
    return convertToSystem(scaled, normalized, system, { preferSpoons: prefersSpoons(ingredient) })
  }
  return { quantity: scaled, unit: normalized || unit }
}

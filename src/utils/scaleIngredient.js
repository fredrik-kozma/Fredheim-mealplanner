import { normalizeUnit, CANONICAL_UNITS, convertToSystem } from './unitNormalizer.js'
import { formatQuantity } from './formatQuantity.js'
import { nameForAmount, prefersSpoons } from './ingredientDictionary.js'
import { formatGramSpoonHint } from './gramSpoonHint.js'

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
  return formatQuantity(quantity, unit, opts.lang || 'en')
}

/**
 * One recipe row, scaled: its name — singular when the amount shown is
 * one or less of a counted thing ("½ Sitron") — its amount label, and
 * the "(≈ 2 tsp)" for a small amount in grams (null when there is none;
 * the caller decides whether to show it).
 * `opts` as formatScaledQuantity, minus quantity/unit/ingredient.
 */
export function formatScaledIngredient(row, opts) {
  const lang = opts.lang || 'en'
  const scaled = scaleQuantity({ ...opts, quantity: row.quantity, unit: row.unit, ingredient: row.ingredient })
  return {
    name: nameForAmount(row, lang, scaled.quantity, scaled.unit),
    quantityLabel: formatQuantity(scaled.quantity, scaled.unit, lang),
    spoonHint: formatGramSpoonHint({ ...scaled, ingredientId: row.ingredient, lang }),
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

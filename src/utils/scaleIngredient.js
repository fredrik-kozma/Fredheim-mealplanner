import { normalizeUnit, displayUnit, CANONICAL_UNITS, convertToSystem } from './unitNormalizer'

/**
 * Scales one ingredient amount and renders it as a display string.
 *
 * Lifted out of RecipeDetail so the printed sheets can produce exactly the
 * same numbers as the screen. The menu book prints each recipe at the
 * servings chosen for that day, which needs this logic well outside any
 * component — and a second copy of the rounding rules would eventually
 * disagree with the first, which is the kind of difference nobody notices
 * until the shopping list and the recipe card say different things.
 */

/**
 * Rounds to amounts a cook can actually measure: common fractions below 1,
 * whole numbers when close enough, halves, and two decimals otherwise.
 */
export function smartRound(num) {
  if (num === null || num === undefined || num === 0) return 0

  const fractions = [0.25, 0.33, 0.5, 0.67, 0.75]

  if (num < 1) {
    let closest = fractions[0]
    let minDiff = Math.abs(num - closest)
    for (const frac of fractions) {
      const diff = Math.abs(num - frac)
      if (diff < minDiff) {
        minDiff = diff
        closest = frac
      }
    }
    if (minDiff < 0.1) return closest
  }

  if (Math.abs(num - Math.round(num)) < 0.05) return Math.round(num)

  const decimal = num % 1
  if (Math.abs(decimal - 0.5) < 0.05) return Math.floor(num) + 0.5

  return Math.round(num * 100) / 100
}

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
 * @returns {string} e.g. "300 g", "1.5 ts", or just the unit when there's
 *   no measurable amount (the "to taste" convention).
 */
export function formatScaledQuantity({
  quantity,
  unit,
  fromServings,
  toServings,
  system = 'metric',
  lang = 'en',
  scalesLinearly = true,
}) {
  const unitLabelFor = (unitKey) => {
    if (!unitKey) return ''
    if (CANONICAL_UNITS[unitKey]) return displayUnit(unitKey, lang)
    return unitKey
  }

  if (quantity === null || quantity === undefined || quantity === 0) {
    return unit || ''
  }

  const scaled = scalesLinearly
    ? quantity * (toServings / (fromServings || 4))
    : quantity

  const normalized = normalizeUnit(unit)
  const meta = CANONICAL_UNITS[normalized]
  let finalQty = scaled
  let finalUnitKey = normalized || unit

  if (meta && meta.system !== 'both') {
    const converted = convertToSystem(scaled, normalized, system)
    finalQty = converted.quantity
    finalUnitKey = converted.unit
  }

  const rounded = smartRound(finalQty)
  if (rounded === 0) return unitLabelFor(finalUnitKey) || ''
  const label = unitLabelFor(finalUnitKey)
  return label ? `${rounded} ${label}` : String(rounded)
}

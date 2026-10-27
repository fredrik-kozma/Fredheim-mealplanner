/**
 * The one place an ingredient amount becomes text.
 *
 * There used to be four: the recipe view, the printed menu book, the
 * shopping list and the per-recipe breakdown each rounded on their own,
 * so the same scaled amount read "0.67 clove" on the recipe and "1 clove"
 * on the list, or "66.7 ml" against "65 ml". Every screen, print and share
 * now comes through here, and the numbers underneath stay unrounded until
 * this point — the shopping list sums raw amounts and formats the total
 * once.
 *
 * Two kinds of unit, two rules:
 *
 *   Metric weight and volume (g, ml, kg, l) are read off a scale or a jug,
 *   so they get a sensible step for their size and no fractions:
 *   "65 ml", "340 g", "1,2 kg".
 *
 *   Everything else — spoons, cups, decilitres, pieces, cloves, eggs,
 *   unitless — is counted or measured with a spoon, so it gets a whole
 *   number and a kitchen fraction: "⅔ fedd", "1 ½ ss", "2 ¼ cups".
 *
 *   Under 5 ml is the exception to the first rule: it is shown in
 *   teaspoons ("¼ ts"), because that is what it gets measured with.
 *
 * Imports carry the .js extension so the node test can load this file
 * without a bundler.
 */

import { normalizeUnit, displayUnit, CANONICAL_UNITS, TO_BASE } from './unitNormalizer.js'

const METRIC_UNITS = new Set(['g', 'ml', 'kg', 'l'])
const LARGE_METRIC_UNITS = new Set(['kg', 'l'])

// Measures rather than things: a spoon or a jug can hold ½ of itself, so
// these keep their fractions even on the shopping list. Everything else
// that is not metric — pieces, cloves, cans, bunches, eggs with no unit,
// a typed "pk" — is bought whole.
const MEASURE_UNITS = new Set(['tsp', 'tbsp', 'cup', 'dl', 'fl_oz', 'oz', 'lb'])

// Sums of scaled amounts land a hair over a whole number (3 × ⅓ is
// 1.0000000000000002), which must not round up to 2.
const WHOLE_EPSILON = 1e-6

// Ascending, so a tie snaps to the smaller fraction.
const FRACTIONS = [
  { value: 0, glyph: '' },
  { value: 1 / 4, glyph: '¼' },
  { value: 1 / 3, glyph: '⅓' },
  { value: 1 / 2, glyph: '½' },
  { value: 2 / 3, glyph: '⅔' },
  { value: 3 / 4, glyph: '¾' },
  { value: 1, glyph: '' },
]

// Norwegian and Swedish write decimals with a comma.
const COMMA_DECIMAL_LANGS = new Set(['no', 'sv'])

function decimalString(n, lang) {
  // toFixed then Number strips trailing zeros: 1.20 -> "1.2", 2.0 -> "2".
  const s = String(Number(n.toFixed(2)))
  return COMMA_DECIMAL_LANGS.has(lang) ? s.replace('.', ',') : s
}

function roundToStep(n, step) {
  return Math.round(n / step) * step
}

function metricValue(quantity, unitKey) {
  if (LARGE_METRIC_UNITS.has(unitKey)) return Math.max(0.1, Math.round(quantity * 10) / 10)
  if (quantity < 5) return Math.max(0.5, roundToStep(quantity, 0.5))
  if (quantity < 10) return Math.round(quantity)
  if (quantity < 100) return roundToStep(quantity, 5)
  return roundToStep(quantity, 10)
}

// The whole number and kitchen fraction a quantity snaps to.
function fractionParts(quantity) {
  let whole = Math.floor(quantity)
  const rest = quantity - whole
  let best = FRACTIONS[0]
  for (const f of FRACTIONS) {
    if (Math.abs(rest - f.value) < Math.abs(rest - best.value)) best = f
  }
  if (best.value === 1) {
    whole += 1
    best = FRACTIONS[0]
  }
  // Never round a real amount away: a pinch of something is still ¼.
  if (whole === 0 && !best.glyph) best = FRACTIONS[1]
  return { whole, glyph: best.glyph, value: whole + best.value }
}

function fractionAmount(quantity) {
  const { whole, glyph } = fractionParts(quantity)
  if (whole === 0) return glyph
  return glyph ? `${whole} ${glyph}` : String(whole)
}

/*
 * Less than a teaspoon of anything is measured with a teaspoon, not read
 * off a jug: "1,5 ml" of turmeric becomes "¼ ts". Snapped to the quarter
 * spoons that exist on a measuring set (¼, ½, ¾, 1), never below ¼.
 */
const TINY_ML = TO_BASE.tsp

function tinyVolumeAsSpoon(quantity, unitKey) {
  if (unitKey !== 'ml' || !(quantity > 0) || quantity >= TINY_ML) return null
  return { quantity: Math.max(0.25, Math.round((quantity / TO_BASE.tsp) * 4) / 4), unit: 'tsp' }
}

/**
 * The number a reader sees, as a number: 0.5 for "½", 2 for a ⅔ clove
 * rounded up on the shopping list. Decides singular or plural for both the
 * unit ("1 klyfta", "3 klyftor") and the ingredient name ("½ Sitron").
 * Null when there is no single amount to show.
 */
export function displayedAmount(quantity, unit, { roundUpWhole = false } = {}) {
  if (typeof quantity !== 'number' || !isFinite(quantity) || quantity <= 0) return null
  const key = normalizeUnit(unit)
  const tiny = tinyVolumeAsSpoon(quantity, key)
  if (tiny) return tiny.quantity
  if (METRIC_UNITS.has(key)) return metricValue(quantity, key)
  if (roundUpWhole && !MEASURE_UNITS.has(key)) return Math.max(1, Math.ceil(quantity - WHOLE_EPSILON))
  return fractionParts(quantity).value
}

/**
 * The number part alone: "⅔", "1 ½", "65", "1,2".
 *
 * `roundUpWhole` is for the shopping list: things bought whole round up to
 * the next whole one, because a shop does not sell ⅔ of a clove and coming
 * home short is worse than coming home over. Recipes leave it off — "⅔
 * clove" is the honest amount to cook with.
 */
export function formatAmount(quantity, unit, lang = 'en', { roundUpWhole = false } = {}) {
  if (typeof quantity !== 'number' || !isFinite(quantity) || quantity <= 0) return ''
  const key = normalizeUnit(unit)
  if (METRIC_UNITS.has(key)) return decimalString(metricValue(quantity, key), lang)
  if (roundUpWhole && !MEASURE_UNITS.has(key)) {
    return String(Math.max(1, Math.ceil(quantity - WHOLE_EPSILON)))
  }
  return fractionAmount(quantity)
}

/**
 * The unit as the reader's language writes it, or the raw text for custom
 * units. `plural` picks "klyftor" over "klyfta" for units that change.
 */
export function unitLabel(unit, lang = 'en', { plural = false } = {}) {
  if (!unit) return ''
  const key = normalizeUnit(unit)
  if (CANONICAL_UNITS[key]) return displayUnit(key, lang, { plural })
  return String(unit)
}

/**
 * @param quantity  a number; an array of { quantity, unit } parts for a
 *                  total that spans units ("3 fedd + 1 ts"); or a string,
 *                  which is already text (a typed amount, an old saved list)
 *                  and is passed through.
 * @param unit      any unit spelling — normalised here
 * @param lang      'en' | 'no' | 'sv'
 * @param options   { roundUpWhole } — shopping list only, see formatAmount
 * @returns e.g. "⅔ fedd", "65 ml", or just the unit when there is no amount
 *   to show (the "to taste" convention).
 */
export function formatQuantity(quantity, unit, lang = 'en', options = {}) {
  if (Array.isArray(quantity)) {
    return quantity
      .map(p => formatQuantity(p.quantity, p.unit, lang, options))
      .filter(Boolean)
      .join(' + ')
  }
  if (typeof quantity === 'string') return quantity
  const tiny = tinyVolumeAsSpoon(quantity, normalizeUnit(unit))
  if (tiny) return formatQuantity(tiny.quantity, tiny.unit, lang, options)
  const label = unitLabel(unit, lang, { plural: displayedAmount(quantity, unit, options) > 1 })
  const amount = formatAmount(quantity, unit, lang, options)
  if (!amount) return label
  return label ? `${amount} ${label}` : amount
}

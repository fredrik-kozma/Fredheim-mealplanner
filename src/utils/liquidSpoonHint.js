/**
 * The "(45 ml, about 45 g)" next to a liquid measured in spoons.
 *
 * gramSpoonHint the other way round: lemon juice and oil are written in
 * spoons, but a cook standing at the scale wants to pour, not fill a spoon
 * three and a quarter times. Where the dictionary knows the liquid's density
 * (entry.liquid.gPerMl, the same figure as the composition table's `density`;
 * a test keeps them equal), the recipe view shows the amount both ways.
 *
 * Display only. The stored amount stays in spoons, and the shopping list
 * never shows this; it is about cooking, not buying.
 *
 * Imports carry the .js extension so the node test can load this file.
 */

import { normalizeUnit, TO_BASE } from './unitNormalizer.js'
import { dictionaryEntry, resolveIngredientId } from './ingredientDictionary.js'

// Under a teaspoon the spoon is the easier tool; "1 ml" on a kitchen scale
// is not a reading anyone can trust.
const MIN_ML = TO_BASE.tsp
// A hair under, for sums like 3 × ⅓ tsp.
const EPSILON = 1e-6

const ABOUT = { en: 'about', no: 'ca.', sv: 'ca' }

// A vinegar the dictionary has no entry for, like a user's "sherry vinegar".
// Only looked at for rows no entry claims: "Reddik" also ends in "eddik".
const VINEGAR = /(vinegar|eddik|vinäger|ättika)$/i
const VINEGAR_G_PER_ML = 1

function gPerMl(row) {
  const id = resolveIngredientId(row)
  if (id) return dictionaryEntry(id).liquid?.gPerMl ?? null
  const name = String(row?.name ?? '').split(',')[0].trim()
  return VINEGAR.test(name) ? VINEGAR_G_PER_ML : null
}

/**
 * @param {object} p
 * @param {number} p.quantity  spoons, already scaled to the servings shown
 * @param {string} p.unit
 * @param {object} p.row       the recipe row ({ ingredient, name })
 * @param {string} [p.lang='en']
 * @returns {string|null} e.g. "(45 ml, about 45 g)", or null
 */
export function formatLiquidSpoonHint({ quantity, unit, row, lang = 'en' }) {
  const key = normalizeUnit(unit)
  if (key !== 'tsp' && key !== 'tbsp') return null
  if (typeof quantity !== 'number' || !(quantity > 0)) return null
  const density = gPerMl(row)
  if (!density) return null
  // The real scaled amount, not the kitchen fraction on screen, as in
  // gramSpoonHint: the scale can be more exact than the spoon.
  const ml = quantity * TO_BASE[key]
  if (ml < MIN_ML - EPSILON) return null
  return `(${Math.round(ml)} ml, ${ABOUT[lang] || ABOUT.en} ${Math.round(ml * density)} g)`
}

/**
 * Which units the live engine can convert for a dictionary ingredient.
 */

const ALWAYS = new Set(['g', 'kg'])

/**
 * @param {object|null} dictEntry  ingredientDictionary entry
 * @param {object|null} food       nutritionDb.foods[id]
 * @returns {string[]} canonical unit keys
 */
export function allowedUnitsFor(dictEntry, food) {
  const units = new Set(ALWAYS)
  if (food?.d != null || food?.g?.ml != null || food?.g?.dl != null) {
    units.add('ml'); units.add('dl'); units.add('l'); units.add('cup')
  }
  if (food?.g?.tsp != null || food?.g?.tbsp != null || food?.d != null) {
    units.add('tsp'); units.add('tbsp')
  }
  // Spoon-preferred spices often only have spoonGrams on the dictionary
  if (dictEntry?.spoonGrams?.gPerTsp != null) {
    units.add('tsp'); units.add('tbsp')
  }
  if (food?.g?.pcs != null || food?.g?.pcsZest != null) units.add('pcs')
  if (food?.g?.clove != null || dictEntry?.preferredUnit === 'clove') units.add('clove')

  // Liquids without density yet: still offer volume (engine will warn if missing)
  if (dictEntry?.liquid || ['ml', 'dl', 'l'].includes(dictEntry?.preferredUnit)) {
    units.add('ml'); units.add('dl'); units.add('l')
  }
  if (['tsp', 'tbsp'].includes(dictEntry?.preferredUnit)) {
    units.add('tsp'); units.add('tbsp')
  }
  if (dictEntry?.preferredUnit === 'pcs') units.add('pcs')

  // Preferred unit always allowed so the form can suggest it
  if (dictEntry?.preferredUnit) units.add(dictEntry.preferredUnit)

  const order = ['g', 'kg', 'ml', 'dl', 'l', 'cup', 'tsp', 'tbsp', 'pcs', 'clove']
  return order.filter((u) => units.has(u))
}

export function suggestUnit(dictEntry, food) {
  const allowed = allowedUnitsFor(dictEntry, food)
  const pref = dictEntry?.preferredUnit
  if (pref && allowed.includes(pref)) return pref
  return allowed[0] || 'g'
}

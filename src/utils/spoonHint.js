import { TO_BASE, displayUnit, normalizeUnit } from './unitNormalizer'

/**
 * The "1 tsp = 5 ml" reminder.
 *
 * Scaling a recipe turns tidy spoon measures into things like "1.7 ml" of
 * salt, and a millilitre of salt is not something anyone can picture. The
 * fix isn't to stop converting — the number is right, and at some serving
 * counts ml is the only honest way to say it — but to remind people what a
 * spoon holds so they can get back to a measure they own.
 *
 * Both the numbers and the unit names come from unitNormalizer rather than
 * being written out here, so the hint can never claim a conversion the app
 * doesn't actually use, and it speaks each language's own abbreviations
 * ("ts"/"ss" in Norwegian, "tsk"/"msk" in Swedish).
 */
export function spoonHint(lang = 'en') {
  const tsp = `1 ${displayUnit('tsp', lang)} = ${TO_BASE.tsp} ${displayUnit('ml', lang)}`
  const tbsp = `1 ${displayUnit('tbsp', lang)} = ${TO_BASE.tbsp} ${displayUnit('ml', lang)}`
  return `${tsp} · ${tbsp}`
}

/**
 * Whether a set of ingredients is one where the reminder earns its place.
 *
 * True when the recipe measures anything by spoon, or when its amounts are
 * small enough to be *displayed* in millilitres — those are exactly the
 * rows where "1.7 ml" shows up. A recipe weighed entirely in grams gets
 * nothing, because there is nothing to be confused about.
 *
 * @param {Array<{unit?: string}>} ingredients
 */
export function needsSpoonHint(ingredients) {
  return (ingredients || []).some(ing => {
    const u = normalizeUnit(ing?.unit)
    return u === 'tsp' || u === 'tbsp' || u === 'ml'
  })
}

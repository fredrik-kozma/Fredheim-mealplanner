/**
 * Strained / reduced recipes: the ingredient sum overstates what is eaten
 * (pulp discarded for oat/almond milk; vegetables strained out of broth).
 *
 * Pack nutrition is curated for the edible liquid. The live engine multiplies
 * ingredient totals by `nutrition.yieldFactor` when present.
 *
 * Yield factor ≈ curated_pack_kcal / full_ingredient_kcal, stored on the recipe
 * so user-facing live calc matches the pack. Sodium often still differs: salt
 * and miso dissolve fully into the liquid, while veg sodium is only partly
 * extracted — salt-like rows stay at full strength (see nutritionEngine).
 */
export const STRAINED_RECIPE_IDS = new Set([
  'orn-8',
  'orn-12',
  'orn-23',
  'orn-43',
  'fmd-broth',
])

/** Rows whose sodium goes fully into the strained liquid. */
export const FULLY_SOLUBLE_IDS = new Set([
  'salt', 'herb-salt', 'black-salt', 'miso-paste', 'soy-sauce',
  'low-sodium-soy-sauce', 'tamari', 'vegetable-bouillon', 'lemon-juice',
  'maple-syrup', 'vanilla-extract', 'vanilla-powder', 'sukrin',
])

export function getYieldFactor(recipe) {
  const f = recipe?.nutrition?.yieldFactor
  if (f != null && Number.isFinite(f) && f > 0 && f <= 1.0001) return f
  return null
}

export function isStrainedRecipe(recipe) {
  return Boolean(getYieldFactor(recipe) || STRAINED_RECIPE_IDS.has(recipe?.id))
}

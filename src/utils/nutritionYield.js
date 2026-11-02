/**
 * Strained / reduced recipes: the ingredient sum overstates what is eaten
 * (pulp discarded for oat/almond/coconut milk; vegetables strained out of broth).
 *
 * Two mechanisms (prefer strain when present):
 * 1) nutrition.strain — per-ingredient, per-nutrient-class retention (preferred)
 * 2) nutrition.yieldFactor — uniform scale (legacy; salt-like sodium kept full)
 *
 * Yield factor ≈ curated_pack_kcal / full_ingredient_kcal when no strain spec.
 */

export const STRAINED_RECIPE_IDS = new Set([
  'orn-8',
  'orn-12',
  'orn-23',
  'orn-43',
  'fmd-broth',
  'fr-212',
])

/** Rows whose sodium (and typically other solubles) go fully into the strained liquid. */
export const FULLY_SOLUBLE_IDS = new Set([
  'salt', 'herb-salt', 'black-salt', 'miso-paste', 'soy-sauce',
  'low-sodium-soy-sauce', 'tamari', 'vegetable-bouillon', 'lemon-juice',
  'maple-syrup', 'vanilla-extract', 'vanilla-powder', 'sukrin',
])

/**
 * Engine nutrient → retention class.
 * - fat: lipids + fat-soluble vitamins
 * - protein
 * - fiber: mostly retained in pulp
 * - soluble: sugars, sodium, potassium, minerals, water-soluble vitamins
 * - starch: other carbs (carbs − sugars − fiber), handled specially
 * - energy: recomputed after macros (kcal)
 */
export const NUTRIENT_CLASS = {
  fat: 'fat',
  satFat: 'fat',
  monounsaturatedFat: 'fat',
  polyunsaturatedFat: 'fat',
  omega3: 'fat',
  omega6: 'fat',
  vitaminA: 'fat',
  vitaminD: 'fat',
  vitaminE: 'fat',
  vitaminK: 'fat',
  cholesterol: 'fat',
  protein: 'protein',
  fiber: 'fiber',
  sugars: 'soluble',
  added: 'soluble',
  sodium: 'soluble',
  potassium: 'soluble',
  calcium: 'soluble',
  iron: 'soluble',
  magnesium: 'soluble',
  phosphorus: 'soluble',
  zinc: 'soluble',
  copper: 'soluble',
  manganese: 'soluble',
  selenium: 'soluble',
  vitaminC: 'soluble',
  thiamin: 'soluble',
  riboflavin: 'soluble',
  niacin: 'soluble',
  vitaminB6: 'soluble',
  folate: 'soluble',
  vitaminB12: 'soluble',
  choline: 'soluble',
  // carbs + kcal handled specially
}

export const CLASS_KEYS = ['fat', 'protein', 'fiber', 'soluble', 'starch']

/** Clamp a retention factor to [0, 1]. */
export function clampRetention(x, fallback = 1) {
  const n = Number(x)
  if (!Number.isFinite(n)) return fallback
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

/**
 * Resolve per-class retention for one ingredient id from recipe.nutrition.strain.
 * Shape:
 *   strain: {
 *     default?: { fat, protein, fiber, soluble, starch },
 *     byIngredient?: { [id]: { fat?, protein?, fiber?, soluble?, starch? } }
 *   }
 * Missing classes default to 1 (full retention). FULLY_SOLUBLE_IDS force soluble=1
 * unless the ingredient entry explicitly sets soluble.
 */
export function retentionForIngredient(recipe, ingredientId) {
  const strain = recipe?.nutrition?.strain
  if (!strain || typeof strain !== 'object') return null

  const defaults = strain.default && typeof strain.default === 'object' ? strain.default : {}
  const specific = strain.byIngredient?.[ingredientId] && typeof strain.byIngredient[ingredientId] === 'object'
    ? strain.byIngredient[ingredientId]
    : {}

  const out = {}
  for (const k of CLASS_KEYS) {
    const raw = specific[k] != null ? specific[k] : defaults[k]
    out[k] = clampRetention(raw, 1)
  }

  // Salt-like rows dissolve fully into the liquid unless explicitly overridden.
  if (FULLY_SOLUBLE_IDS.has(ingredientId) && specific.soluble == null) {
    out.soluble = 1
  }

  return out
}

export function hasStrainSpec(recipe) {
  const s = recipe?.nutrition?.strain
  return Boolean(s && typeof s === 'object' && (s.byIngredient || s.default))
}

export function getYieldFactor(recipe) {
  // Prefer class retention when present — callers should check hasStrainSpec first.
  const f = recipe?.nutrition?.yieldFactor
  if (f != null && Number.isFinite(f) && f > 0 && f <= 1.0001) return f
  return null
}

export function isStrainedRecipe(recipe) {
  return Boolean(
    hasStrainSpec(recipe) ||
    getYieldFactor(recipe) ||
    STRAINED_RECIPE_IDS.has(recipe?.id),
  )
}

/**
 * Apply class retention to one ingredient's nutrient vector (engine keys).
 * Mutates a copy; returns { nutrients, retention }.
 */
export function applyRetentionToNutrients(nutrients, retention) {
  if (!retention) return { nutrients: { ...nutrients }, retention: null }

  const out = { ...nutrients }
  const sug0 = out.sugars || 0
  const fib0 = out.fiber || 0
  const carbs0 = out.carbs || 0
  const starch0 = Math.max(0, carbs0 - sug0 - fib0)

  for (const [key, cls] of Object.entries(NUTRIENT_CLASS)) {
    if (!(key in out)) continue
    if (key === 'fiber') continue // set below
    if (key === 'sugars' || key === 'added') continue
    out[key] = (out[key] || 0) * retention[cls]
  }

  out.sugars = sug0 * retention.soluble
  out.added = (out.added || 0) * retention.soluble
  out.fiber = fib0 * retention.fiber
  const starch = starch0 * retention.starch
  out.carbs = out.sugars + out.fiber + starch

  // Recompute energy from retained macros (Atwater).
  out.kcal = (out.protein || 0) * 4 + (out.carbs || 0) * 4 + (out.fat || 0) * 9

  return { nutrients: out, retention }
}

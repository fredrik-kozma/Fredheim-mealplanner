/**
 * Lazy-load the compact nutrition DB so it stays out of the main bundle.
 * Vite will code-split `nutritionDb.json` into its own chunk.
 *
 * Usage:
 *   const db = await loadNutritionDb()
 */
let cache = null
let pending = null

export async function loadNutritionDb() {
  if (cache) return cache
  if (pending) return pending
  pending = import('../data/nutritionDb.json').then((m) => {
    cache = m.default || m
    pending = null
    return cache
  })
  return pending
}

/** Test/SSR helper: inject a DB without dynamic import. */
export function setNutritionDbForTests(db) {
  cache = db
  pending = null
}

export function clearNutritionDbCache() {
  cache = null
  pending = null
}

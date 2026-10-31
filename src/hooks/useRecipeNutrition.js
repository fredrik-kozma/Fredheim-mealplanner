/**
 * Optional React hook — not wired into UI yet (phase c/d).
 * Returns live perServing for a recipe once the nutrition DB has loaded.
 *
 * @param {object|null} recipe
 * @param {{ saltLevel?: 'low'|'standard', recipeById?: object }} [options]
 */
import { useEffect, useMemo, useState } from 'react'
import { estimateRecipeNutrition } from '../utils/nutritionEngine.js'
import { loadNutritionDb } from '../utils/loadNutritionDb.js'

export function useRecipeNutrition(recipe, options = {}) {
  const [db, setDb] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    loadNutritionDb()
      .then((d) => { if (alive) setDb(d) })
      .catch((e) => { if (alive) setError(e) })
    return () => { alive = false }
  }, [])

  const result = useMemo(() => {
    if (!recipe || !db) return null
    return estimateRecipeNutrition(recipe, db, options)
  }, [recipe, db, options.saltLevel, options.recipeById])

  return {
    loading: !db && !error,
    error,
    db,
    ...(result || {
      perServing: null,
      total: null,
      warnings: [],
      omegaRatio: null,
    }),
  }
}

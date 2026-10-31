/**
 * Live nutrition for the recipe form. Lazy-loads nutritionDb and recomputes
 * when ingredients / servings / salt level change.
 */
import { useEffect, useMemo, useState } from 'react'
import { estimateRecipeNutrition } from '../utils/nutritionEngine.js'
import { loadNutritionDb } from '../utils/loadNutritionDb.js'

export function useFormNutrition({ ingredients, servings, saltLevel = 'low', recipeById = null }) {
  const [db, setDb] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    loadNutritionDb()
      .then((d) => { if (alive) setDb(d) })
      .catch((e) => { if (alive) setError(e) })
    return () => { alive = false }
  }, [])

  const recipe = useMemo(
    () => ({ ingredients: ingredients || [], servings: servings || 1 }),
    [ingredients, servings],
  )

  const result = useMemo(() => {
    if (!db) return null
    return estimateRecipeNutrition(recipe, db, { saltLevel, recipeById })
  }, [db, recipe, saltLevel, recipeById])

  return {
    loading: !db && !error,
    error,
    db,
    perServing: result?.perServing || null,
    warnings: result?.warnings || [],
    omegaRatio: result?.omegaRatio ?? null,
    matchedRows: result?.matchedRows || 0,
  }
}

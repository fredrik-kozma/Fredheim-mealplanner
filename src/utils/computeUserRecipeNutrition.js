/**
 * Attach live nutrition to a user recipe payload before addRecipe/updateRecipe.
 */
import { estimateRecipeNutrition } from './nutritionEngine.js'

const SALT_IDS = new Set([
  'salt', 'black-salt', 'herb-salt',
  'soy-sauce', 'tamari', 'low-sodium-soy-sauce',
  'miso-paste', 'vegetable-bouillon',
])

export function recipeHasSaltSwitch(ingredients = []) {
  return ingredients.some(
    (r) => SALT_IDS.has(r.ingredient) || (r.standardAmount != null && SALT_IDS.has(r.ingredient)),
  )
}

/**
 * @returns recipe data with nutrition.perServing (and sodiumStandard when salt switch applies)
 */
export function withComputedNutrition(recipeData, db, { saltLevel = 'low', recipeById = null } = {}) {
  if (!db) return { ...recipeData, nutritionWarnings: ['nutrition DB not loaded'] }
  const result = estimateRecipeNutrition(recipeData, db, { saltLevel, recipeById })
  const nutrition = {
    ...(recipeData.nutrition || {}),
    perServing: result.perServing,
  }
  if (recipeHasSaltSwitch(recipeData.ingredients)) {
    const std = estimateRecipeNutrition(recipeData, db, { saltLevel: 'standard', recipeById })
    nutrition.sodiumStandard = Math.round(std.perServing.sodium || 0)
  }
  return {
    ...recipeData,
    nutrition,
    nutritionEstimated: true,
    nutritionWarnings: result.warnings,
    omegaRatio: result.omegaRatio,
  }
}

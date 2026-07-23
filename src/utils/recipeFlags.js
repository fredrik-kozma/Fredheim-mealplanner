// Recipe-level advisory flags that affect how a recipe should be presented.

/**
 * True for Fasting Mimicking Diet recipes. These are pieces of a restricted
 * 5-day protocol — intentionally low-calorie and NOT complete standalone
 * meals — so the UI flags them so nobody picks one thinking it's a full meal.
 *
 * Detected by the stable `fmd` tag every FMD recipe carries (not the pack id,
 * so it keeps working regardless of packaging).
 */
export function isFmdRecipe(recipe) {
  return (recipe?.tags || []).includes('fmd')
}

/**
 * The user's salt level, applied to a recipe.
 *
 *   'low'       the recipe as written (blood pressure, heart or kidney
 *               disease). The default, so nothing changes for anyone who
 *               never picks a level.
 *   'standard'  healthy adults (WHO: under 5 g salt a day). A salt row with
 *               `standardAmount` uses that amount instead (in its own unit,
 *               or `standardUnit` on a "to taste" row), and the sodium per
 *               serving is `nutrition.sodiumStandard`.
 *
 * The amounts are set by scripts/build_salt_levels.mjs. Health labels are
 * judged on the low-salt recipe and never change with the level.
 */

export const SALT_LEVELS = ['standard', 'low']
export const DEFAULT_SALT_LEVEL = 'low'

// Make my week answers that mean low salt without asking.
export const LOW_SALT_GOALS = ['bloodPressure', 'heart', 'diabetes']

export const normalizeSaltLevel = level => (SALT_LEVELS.includes(level) ? level : DEFAULT_SALT_LEVEL)

/**
 * The level one recipe is cooked at: the user's choice on that recipe's
 * page (`recipeSaltLevels[id]`, set only when it differs from the global
 * setting), otherwise the global setting.
 */
export function saltLevelForRecipe(recipeId, globalLevel, recipeSaltLevels) {
  const own = recipeSaltLevels?.[recipeId]
  return SALT_LEVELS.includes(own) ? own : normalizeSaltLevel(globalLevel)
}

// A "to taste" note says nothing once the row has a measured amount.
const TO_TASTE_RE = /^(to taste|etter smak|efter smak)$/i

export const hasStandardAmount = row => row?.standardAmount != null && Number(row.standardAmount) > 0

/** Does this recipe read differently at the standard level? */
export function hasStandardSalt(recipe) {
  return (recipe?.ingredients || []).some(hasStandardAmount)
}

/** One ingredient row at the given level. Same object when nothing changes. */
export function rowAtLevel(row, level) {
  if (level !== 'standard' || !hasStandardAmount(row)) return row
  const out = { ...row, quantity: Number(row.standardAmount), unit: row.standardUnit || row.unit }
  if (row.quantity == null && TO_TASTE_RE.test(String(row.note || '').trim())) delete out.note
  return out
}

export function ingredientsAtLevel(list, level) {
  if (level !== 'standard' || !Array.isArray(list)) return list
  return list.map(row => rowAtLevel(row, level))
}

/** Sodium per serving (mg) at the level, or null when the recipe has none. */
export function sodiumAtLevel(recipe, level) {
  const n = recipe?.nutrition
  const low = n?.perServing?.sodium
  if (level === 'standard' && typeof n?.sodiumStandard === 'number' && hasStandardSalt(recipe)) return n.sodiumStandard
  return typeof low === 'number' ? low : null
}

// The sodium limits of the sodium-based good-for labels, as in the criteria
// (scripts/lib/recipeLabels.mjs). Labels are judged on the low-salt recipe;
// these say whether a label still holds at another level's sodium.
const isMeal = recipe => (recipe?.mealTypes || []).some(m => m === 'breakfast' || m === 'lunch' || m === 'dinner')
export const SODIUM_LABEL_LIMITS = {
  // ≥ 100 g: ≤ 600 mg and ≤ 140 mg/100 g; smaller: ≤ 140 mg and ≤ 140 mg/50 g. Potassium ≥ sodium.
  'blood-pressure-friendly': (recipe, sodium) => {
    const sw = Number(recipe?.servingWeightGrams) || null
    const potassium = recipe?.nutrition?.perServing?.potassium
    if (typeof potassium === 'number' && sodium > potassium) return false
    if (sw && sw >= 100) return sodium <= 600 && sodium / sw * 100 <= 140
    return sodium <= 140 && (!sw || sodium / sw * 50 <= 140)
  },
  // ≤ 600 mg for a meal, ≤ 360 mg otherwise.
  'heart-healthy': (recipe, sodium) => sodium <= (isMeal(recipe) ? 600 : 360),
}
export const SODIUM_LABELS = Object.keys(SODIUM_LABEL_LIMITS)

/**
 * The recipe's sodium-based labels that hold only for the low-salt version:
 * at 'standard', those whose limit the standard sodium exceeds. Empty at
 * 'low' or when the recipe reads the same at both levels.
 */
export function lowSaltOnlyLabels(recipe, level) {
  if (level !== 'standard' || !hasStandardSalt(recipe)) return []
  const sodium = sodiumAtLevel(recipe, 'standard')
  if (sodium == null) return []
  const tags = recipe?.tags || []
  return SODIUM_LABELS.filter(l => tags.includes(l) && !SODIUM_LABEL_LIMITS[l](recipe, sodium))
}

/**
 * The recipe as cooked at the level: ingredient rows in every language and
 * the per-serving sodium. Tags (the good-for labels) are left alone. Same
 * object at 'low' or when the recipe has no standard amount.
 */
export function recipeAtLevel(recipe, level) {
  if (level !== 'standard' || !hasStandardSalt(recipe)) return recipe
  const translations = {}
  for (const [lang, tr] of Object.entries(recipe.translations || {})) {
    translations[lang] = tr?.ingredients ? { ...tr, ingredients: ingredientsAtLevel(tr.ingredients, level) } : tr
  }
  const n = recipe.nutrition
  const sodium = sodiumAtLevel(recipe, level)
  return {
    ...recipe,
    ingredients: ingredientsAtLevel(recipe.ingredients, level),
    translations,
    ...(n?.perServing && sodium != null ? { nutrition: { ...n, perServing: { ...n.perServing, sodium } } } : {}),
  }
}

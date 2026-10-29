/**
 * Good-for tags — the filter labels a recipe can carry in `tags`.
 *
 * Assigned to the built-in packs by scripts/build_recipe_proposals.mjs
 * (criteria in scripts/data/recipe-completion-proposals.md) and written by
 * scripts/apply_recipe_proposals.mjs:
 *   diabetes-friendly        carbs/sugars capped, fibre-rich, low sat fat,
 *                            no added sugar or oil, no refined starch base
 *   blood-pressure-friendly  DASH (low sodium, potassium ≥ sodium, low sat fat)
 *   heart-healthy            Ornish/Esselstyn (no oil, minimal sat fat,
 *                            zero cholesterol, fiber-rich) — covers both
 *                            heart disease and cholesterol-lowering
 *   weight-loss              Low energy density (Rolls/Lisle)
 *   gluten-free, nut-free, soy-free, oil-free, no-added-sugar
 *                            by ingredient (and method text for oil)
 *   quick                    ≤ 20 min, no waiting step
 *   batch-friendly           ≥ 4 servings and keeps or freezes
 *   kid-friendly             familiar, mild format (judgement)
 *
 * Labels are i18n keys under `conditions.*`; `color` styles the chip/badge.
 * Health conditions first, then diet, then practical.
 */
export const CONDITION_TAGS = [
  { id: 'diabetes-friendly',        icon: '🩸', color: 'emerald' },
  { id: 'blood-pressure-friendly',  icon: '💗', color: 'sky' },
  { id: 'heart-healthy',            icon: '❤️', color: 'rose' },
  { id: 'weight-loss',              icon: '⚖️', color: 'amber' },
  { id: 'gluten-free',              icon: '🌾', color: 'yellow' },
  { id: 'nut-free',                 icon: '🥜', color: 'orange' },
  { id: 'soy-free',                 icon: '🫘', color: 'lime' },
  { id: 'oil-free',                 icon: '🫒', color: 'teal' },
  { id: 'no-added-sugar',           icon: '🍬', color: 'fuchsia' },
  { id: 'quick',                    icon: '⚡', color: 'violet' },
  { id: 'batch-friendly',           icon: '🍲', color: 'cyan' },
  { id: 'kid-friendly',             icon: '🧒', color: 'pink' },
]

export const CONDITION_TAG_IDS = CONDITION_TAGS.map(c => c.id)

// Static class maps so Tailwind's scanner sees every class we use.
export const CONDITION_CHIP_ACTIVE = {
  emerald: 'bg-emerald-600 text-white',
  sky: 'bg-sky-600 text-white',
  rose: 'bg-rose-600 text-white',
  amber: 'bg-amber-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  orange: 'bg-orange-500 text-white',
  lime: 'bg-lime-600 text-white',
  teal: 'bg-teal-600 text-white',
  fuchsia: 'bg-fuchsia-600 text-white',
  violet: 'bg-violet-600 text-white',
  cyan: 'bg-cyan-600 text-white',
  pink: 'bg-pink-500 text-white',
}
export const CONDITION_BADGE = {
  emerald: 'bg-emerald-50 text-emerald-700',
  sky: 'bg-sky-50 text-sky-700',
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  orange: 'bg-orange-50 text-orange-700',
  lime: 'bg-lime-50 text-lime-700',
  teal: 'bg-teal-50 text-teal-700',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700',
  violet: 'bg-violet-50 text-violet-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  pink: 'bg-pink-50 text-pink-700',
}

export function recipeConditions(recipe) {
  const tags = recipe?.tags || []
  return CONDITION_TAGS.filter(c => tags.includes(c.id))
}

// Meal types a recipe suits (`mealTypes` on built-in recipes). Labels are
// i18n keys under `mealTypes.*`.
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'side', 'dessert', 'component']

export function recipeMealTypes(recipe) {
  const mt = Array.isArray(recipe?.mealTypes) ? recipe.mealTypes : []
  return MEAL_TYPES.filter(m => mt.includes(m))
}

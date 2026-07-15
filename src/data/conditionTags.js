/**
 * Condition tags — clinical filter tags a recipe can carry in `tags`.
 *
 * Assigned by scripts/audit_condition_tags.cjs against WFPB criteria:
 *   diabetes-friendly        PCRM/Barnard (low sat fat, no added sugar/oil,
 *                            no refined flour, fiber-rich)
 *   blood-pressure-friendly  DASH (low sodium, potassium-rich, low sat fat)
 *   heart-healthy            Ornish/Esselstyn (no oil, minimal sat fat,
 *                            zero cholesterol, fiber-rich) — covers both
 *                            heart disease and cholesterol-lowering
 *   weight-loss              Low energy density (Rolls/Lisle)
 *
 * Labels are i18n keys under `conditions.*`; `color` styles the chip/badge.
 */
export const CONDITION_TAGS = [
  { id: 'diabetes-friendly',        icon: '🩸', color: 'emerald' },
  { id: 'blood-pressure-friendly',  icon: '💗', color: 'sky' },
  { id: 'heart-healthy',            icon: '❤️', color: 'rose' },
  { id: 'weight-loss',              icon: '⚖️', color: 'amber' },
]

export const CONDITION_TAG_IDS = CONDITION_TAGS.map(c => c.id)

// Static class maps so Tailwind's scanner sees every class we use.
export const CONDITION_CHIP_ACTIVE = {
  emerald: 'bg-emerald-600 text-white',
  sky: 'bg-sky-600 text-white',
  rose: 'bg-rose-600 text-white',
  amber: 'bg-amber-500 text-white',
}
export const CONDITION_BADGE = {
  emerald: 'bg-emerald-50 text-emerald-700',
  sky: 'bg-sky-50 text-sky-700',
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
}

export function recipeConditions(recipe) {
  const tags = recipe?.tags || []
  return CONDITION_TAGS.filter(c => tags.includes(c.id))
}

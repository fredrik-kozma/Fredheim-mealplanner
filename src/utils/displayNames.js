/**
 * Display-name helpers for meal slots and recipe categories.
 *
 * Meal slots and categories are stored in the Zustand store as stable English
 * keys (e.g. "Breakfast", "Dinner", "Sauce"). Their user-visible label is
 * resolved through i18n at render time so switching language in Settings
 * re-labels the whole app without touching stored data.
 *
 * Unknown/custom keys fall through to the key itself — user-added categories
 * and slots render as-is in every language.
 */

export function mealSlotLabel(t, slotKey) {
  if (!slotKey) return ''
  // i18n path planner.mealSlots.<Key> — existing keys are
  // Breakfast / Lunch / Dinner / Supper / Snack.
  const translated = t(`planner.mealSlots.${slotKey}`, { defaultValue: slotKey })
  return translated
}

export function categoryLabel(t, categoryKey) {
  if (!categoryKey) return ''
  const translated = t(`categories.${categoryKey}`, { defaultValue: categoryKey })
  return translated
}

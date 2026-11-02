/**
 * Planned-day / planned-week nutrient totals from weekPlan.
 * Uses pack perServing (already strain-aware where recipes store strain/yield).
 */
import { ALL_NUTRITION_KEYS, sumNutrition } from './nutritionData.js'
import { plannedPortions, weekdayKey } from './todayPlan.js'
import { DAY_KEYS } from './makeMyWeek.js'

/**
 * Per-person portions for one planner day key (monday…sunday).
 * Same rules as Today: no snacks, typed-in meals skipped.
 */
export function plannedDayEntries(weekPlan, dayKey, getRecipe, people) {
  return plannedPortions(weekPlan, dayKey, getRecipe, people)
}

/** Totals for one planned day (absolute amounts for `people` as stored in portions). */
export function plannedDayTotals(weekPlan, dayKey, recipeMap, people) {
  const getRecipe = id => recipeMap[id] || recipeMap.get?.(id)
  const entries = plannedDayEntries(weekPlan, dayKey, getRecipe, people).map(e => ({
    recipeId: e.recipeId,
    portions: e.portions,
  }))
  return sumNutrition(entries, recipeMap instanceof Map
    ? Object.fromEntries(recipeMap)
    : recipeMap)
}

/**
 * Per-person totals for a planned day (divide by people when portions are household).
 * plannedPortions already returns per-person portions — sumNutrition is per-person.
 */
export function plannedDayTotalsPerPerson(weekPlan, dayKey, recipeMap, people) {
  return plannedDayTotals(weekPlan, dayKey, recipeMap, people)
}

/** Daily-average over the seven planner days (per person). */
export function plannedWeekDailyAverage(weekPlan, recipeMap, people) {
  const totals = {}
  let known = 0
  for (const day of DAY_KEYS) {
    const dayTot = plannedDayTotals(weekPlan, day, recipeMap, people)
    if (!Object.keys(dayTot).length) continue
    known++
    for (const k of ALL_NUTRITION_KEYS) {
      if (dayTot[k] == null) continue
      totals[k] = (totals[k] || 0) + dayTot[k]
    }
  }
  const days = Math.max(1, known)
  const avg = {}
  for (const [k, v] of Object.entries(totals)) avg[k] = v / days
  return { avg, days: known }
}

/**
 * Recipe contribution shares for one nutrient on a planned day.
 * @returns {{ total, parts: Array<{ recipeId, title, amount, pct }> }}
 */
export function plannedNutrientContributors(weekPlan, dayKey, nutrientKey, {
  recipeMap,
  people,
  lang = 'en',
  topN = 8,
} = {}) {
  const getRecipe = id => (recipeMap instanceof Map ? recipeMap.get(id) : recipeMap[id])
  const entries = plannedDayEntries(weekPlan, dayKey, getRecipe, people)
  const parts = []
  let total = 0
  for (const e of entries) {
    const r = getRecipe(e.recipeId)
    const amount = (Number(r?.nutrition?.perServing?.[nutrientKey]) || 0) * (e.portions || 0)
    if (amount <= 0) continue
    total += amount
    const title = r?.translations?.[lang]?.title || r?.title || e.recipeId
    parts.push({ recipeId: e.recipeId, title, amount, recipe: r })
  }
  parts.sort((a, b) => b.amount - a.amount)
  const top = parts.slice(0, topN).map(p => ({
    ...p,
    pct: total > 0 ? Math.round((p.amount / total) * 100) : 0,
  }))
  // Fix rounding so pct sum ≤ 100
  return { total, parts: top, all: parts }
}

/** Calendar date → planner day key helper (re-export). */
export { weekdayKey }

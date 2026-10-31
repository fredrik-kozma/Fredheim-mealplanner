/**
 * Nutrient-focus helpers for "Make my week".
 * Soft scoring bonus + result summary (% of daily targets, contributor chips).
 * Omega-3 uses a 2 g/day ALA guide (no FDA DV in the app).
 */
import { NUTRITION_GROUPS } from './nutritionData.js'

export const MMW_FOCUS_NUTRIENTS = [
  'iron', 'calcium', 'omega3', 'fiber', 'protein', 'zinc',
  'magnesium', 'potassium', 'folate', 'vitaminC', 'vitaminE', 'selenium',
]

export const FOCUS_MAX = 3
/** Soft weight in recipe score(); kcal/variety terms remain dominant via attempt penalty. */
export const FOCUS_WEIGHT = 1.4

/** Daily targets for focus % bars. FDA DV where the app has one; omega-3 = 2 g ALA guide. */
export const FOCUS_DAILY_TARGET = Object.fromEntries(
  MMW_FOCUS_NUTRIENTS.map(key => {
    if (key === 'omega3') return [key, 2]
    for (const g of NUTRITION_GROUPS) {
      const f = g.fields.find(x => x.key === key)
      if (f?.dv != null) return [key, f.dv]
    }
    return [key, null]
  }).filter(([, v]) => v != null),
)

export const FOCUS_ABBR = {
  iron: 'Fe',
  calcium: 'Ca',
  omega3: 'ω3',
  fiber: 'Fibre',
  protein: 'Pro',
  zinc: 'Zn',
  magnesium: 'Mg',
  potassium: 'K',
  folate: 'Fol',
  vitaminC: 'C',
  vitaminE: 'E',
  selenium: 'Se',
}

const FOCUS_SET = new Set(MMW_FOCUS_NUTRIENTS)

/** Keep 0–FOCUS_MAX known ids, order preserved, duplicates dropped. */
export function normalizeFocusNutrients(value) {
  if (!Array.isArray(value)) return []
  const out = []
  for (const raw of value) {
    const key = String(raw || '')
    if (!FOCUS_SET.has(key) || out.includes(key)) continue
    out.push(key)
    if (out.length >= FOCUS_MAX) break
  }
  return out
}

/**
 * Mean capped % of daily-target per 100 kcal across focus nutrients.
 * Returns 0–~2.5 so FOCUS_WEIGHT * density stays a soft nudge.
 */
export function focusDensity(perServing, focus) {
  if (!focus?.length || !perServing) return 0
  const kcal = Math.max(40, Number(perServing.calories) || 40)
  let sum = 0
  let n = 0
  for (const key of focus) {
    const target = FOCUS_DAILY_TARGET[key]
    if (!target) continue
    const amt = Number(perServing[key]) || 0
    const pctPer100 = (amt / target) * 100 * (100 / kcal)
    sum += Math.min(2.5, pctPer100 / 8)
    n++
  }
  return n ? sum / n : 0
}

export function focusScoreBonus(perServing, focus) {
  return FOCUS_WEIGHT * focusDensity(perServing, focus)
}

/**
 * Daily-average amounts and % of target for focus nutrients from a finished week.
 * Portions: servings null → 1 each → / people; fruit ignored (no micros).
 */
export function focusWeekAverages(week, { people = 1, recipeById } = {}) {
  const focus = normalizeFocusNutrients(week?.focusNutrients || week?.answers?.focusNutrients)
  const keys = focus.length ? focus : MMW_FOCUS_NUTRIENTS
  const dayKeys = Object.keys(week?.plan || {})
  if (!dayKeys.length) {
    return { avg: Object.fromEntries(keys.map(k => [k, 0])), pct: Object.fromEntries(keys.map(k => [k, 0])), days: 0 }
  }
  const totals = Object.fromEntries(keys.map(k => [k, 0]))
  let knownDays = 0
  for (const day of dayKeys) {
    let dayHas = false
    for (const list of Object.values(week.plan[day] || {})) {
      for (const it of list || []) {
        const r = recipeById?.get?.(it.recipeId) || recipeById?.[it.recipeId]
        const n = r?.nutrition?.perServing
        if (!n) continue
        dayHas = true
        const portions = (it.servings == null ? people : it.servings) / people
        for (const key of keys) {
          totals[key] += (Number(n[key]) || 0) * portions
        }
      }
    }
    if (dayHas) knownDays++
  }
  const days = Math.max(1, knownDays)
  const avg = Object.fromEntries(keys.map(k => [k, totals[k] / days]))
  const pct = Object.fromEntries(keys.map(k => {
    const t = FOCUS_DAILY_TARGET[k]
    return [k, t ? Math.round((avg[k] / t) * 100) : 0]
  }))
  return { avg, pct, days: knownDays }
}

/**
 * For each planned recipe id, which focus nutrients it is a notable contributor for
 * (density in the top ~40% among distinct recipes in the week, min one).
 */
export function focusContributorChips(week, { people = 1, recipeById, focus }) {
  const keys = normalizeFocusNutrients(focus)
  if (!keys.length || !week?.plan) return {}
  const dens = Object.fromEntries(keys.map(k => [k, new Map()]))
  for (const slots of Object.values(week.plan)) {
    for (const list of Object.values(slots || {})) {
      for (const it of list || []) {
        const r = recipeById?.get?.(it.recipeId) || recipeById?.[it.recipeId]
        const n = r?.nutrition?.perServing
        if (!n) continue
        const kcal = Math.max(40, Number(n.calories) || 40)
        for (const key of keys) {
          const target = FOCUS_DAILY_TARGET[key]
          if (!target) continue
          const d = ((Number(n[key]) || 0) / target) * 100 * (100 / kcal)
          const prev = dens[key].get(it.recipeId) || 0
          if (d > prev) dens[key].set(it.recipeId, d)
        }
      }
    }
  }
  const chips = {} // recipeId -> [abbr, ...]
  for (const key of keys) {
    const entries = [...dens[key].entries()].sort((a, b) => b[1] - a[1])
    if (!entries.length) continue
    const cutoffIdx = Math.max(0, Math.ceil(entries.length * 0.4) - 1)
    const cutoff = entries[cutoffIdx][1]
    const abbr = FOCUS_ABBR[key] || key
    for (const [id, d] of entries) {
      if (d < cutoff || d <= 0) continue
      if (!chips[id]) chips[id] = []
      if (!chips[id].includes(abbr)) chips[id].push(abbr)
    }
  }
  return chips
}

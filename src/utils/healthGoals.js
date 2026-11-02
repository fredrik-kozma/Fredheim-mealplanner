/**
 * Health goals, NNR 2023 reference intakes, and Goal-fit scoring for Make my week
 * and planned day/week nutrient views.
 *
 * Reference intakes (adult general) follow Nordic Nutrition Recommendations 2023
 * where cited below. Caps for sodium / sat fat / added sugar follow WHO and the
 * goal-specific choices Fredrik approved (BP Na green < 1500 mg AHA, amber–red band to WHO 2000 mg; general day/week cap 2000 mg WHO; heart sat fat < 7%E).
 *
 * Status colours: green / amber / red for goal limits. B12, vitamin D and omega-3
 * use a calm "supplement" note on plant-based weeks — never red for being low.
 *
 * Disclaimer (shown in UI): general guidance, not personal medical advice.
 */

import { NUTRITION_GROUPS } from './nutritionData.js'

/** Display unit for coverage rows — same as nutrition DB / NUTRITION_GROUPS. */
const UNIT_BY_KEY = Object.fromEntries(
  NUTRITION_GROUPS.flatMap(g => g.fields.map(f => [f.key, compactNutrientUnit(f.unit)])),
)

/** Compact unit for coverage bars (mg / µg / g / kcal). */
export function compactNutrientUnit(unit) {
  const u = String(unit || 'g')
  if (u === 'kcal') return 'kcal'
  // nutritionData uses Greek mu (μ) in µg; also accept micro sign (µ).
  if (/^[uμµ]g/i.test(u)) return 'µg'
  if (u === 'mg' || u.startsWith('mg')) return 'mg'
  if (u === 'g' || u.startsWith('g ')) return 'g'
  if (u === 'g') return 'g'
  return u
}

export function nutrientUnit(key) {
  if (key === 'calories') return 'kcal'
  return UNIT_BY_KEY[key] || 'g'
}

/** Adult general NNR 2023-oriented daily references (display + % bars). */
export const NNR_ADULT = {
  // Energy reference used only for "% of energy" caps when no user kcal target.
  // NNR sets energy by PAL/sex/age; 2000 kcal is a conventional adult display base.
  calories: 2000,
  // NNR RI ≈ 0.83 g/kg; ~60 g for a ~70 kg adult (general display).
  protein: 60,
  // NNR recommends 25–35 g/d; app steers toward 30.
  fiber: 30,
  // WHO < 2000 mg sodium/day; NNR emphasises salt reduction (same ballpark).
  sodium: 2000,
  // NNR RI 3500 mg/d.
  potassium: 3500,
  // NNR RI 950 mg/d (adults 25–70).
  calcium: 950,
  // NNR: men 9 mg, women of reproductive age 15 mg — show 9 with UI note for women.
  iron: 9,
  // NNR RI men 350 mg / women 280 mg — use 350 as general adult.
  magnesium: 350,
  // NNR RI men ~11 mg / women ~7 mg — use 9 as blended general.
  zinc: 9,
  // NNR RI ~75 µg men / 60 µg women — use 70.
  selenium: 70,
  phosphorus: 580, // NNR RI
  copper: 0.9, // NNR RI
  // NNR RI ~700–800 µg RE — use 700.
  vitaminA: 700,
  vitaminB6: 1.5, // NNR
  // NNR RI 4 µg (higher than FDA 2.4).
  vitaminB12: 4,
  vitaminC: 100, // NNR ~95–110
  // NNR RI 10 µg (FDA DV is 20).
  vitaminD: 10,
  vitaminE: 10, // NNR α-TE order of magnitude
  folate: 300, // NNR RI
  thiamin: 1.1,
  riboflavin: 1.6,
  niacin: 16,
  // Guide only (no single NNR "DV"); same 2 g ALA used in mmwFocus.
  omega3: 2,
  // Soft display targets (not hard NNR RIs):
  totalFat: 70,
  totalCarbs: 260,
  // Caps expressed as absolute grams at 2000 kcal for sat fat 10%E / added sugar 10%E:
  // 10%E of 2000 = 200 kcal → ~22 g sat fat; sugar ~50 g. Heart uses 7%E → ~16 g.
  saturatedFat: 22,
  addedSugar: 50,
}

/** Nutrients that are "caps" (lower is better) in coverage UI. */
export const CAP_NUTRIENTS = new Set(['sodium', 'saturatedFat', 'addedSugar', 'cholesterol'])

/** Low on these → calm supplement note, never red (plant weeks). */
export const SUPPLEMENT_NOTE_NUTRIENTS = new Set(['vitaminB12', 'vitaminD', 'omega3'])

/** Iodine skipped until the nutrition DB has it. */
export const HIDDEN_RI_NUTRIENTS = new Set(['iodine'])

/**
 * Goal → recipe tag used for soft tilt scoring (null = no tag; score by nutrients).
 * Gut health has no pack tag yet — fibre density steers picks.
 */
export const GOAL_LABEL_TAG = {
  weight: 'weight-loss',
  bloodPressure: 'blood-pressure-friendly',
  diabetes: 'diabetes-friendly',
  heart: 'heart-healthy',
  gut: null,
}

export const HEALTH_GOAL_IDS = ['weight', 'bloodPressure', 'diabetes', 'heart', 'gut']

/**
 * Per-goal daily evaluation rules.
 * @typedef {'min'|'max'|'pctEnergy'|'fiberDensity'} RuleKind
 */
export function goalTargetRules(goal, { kcalTarget = null } = {}) {
  const kcal = Number(kcalTarget) > 0 ? Number(kcalTarget) : NNR_ADULT.calories
  const sat10 = (0.10 * kcal) / 9
  const sat7 = (0.07 * kcal) / 9
  const sugar10 = (0.10 * kcal) / 4
  const sugar5 = (0.05 * kcal) / 4

  switch (goal) {
    case 'bloodPressure':
      // AHA ideal < 1500 mg; WHO upper 2000 mg. Green < 1500, amber 1500–2000, red > 2000.
      return [
        { key: 'sodium', kind: 'maxBand', target: 1500, amberMax: 2000, unit: 'mg', tipKey: 'sodiumBp' },
        { key: 'potassium', kind: 'min', target: 3500, unit: 'mg', tipKey: 'potassium' },
        { key: 'saturatedFat', kind: 'max', target: sat10, unit: 'g', tipKey: 'satFat' },
      ]
    case 'diabetes':
      return [
        { key: 'addedSugar', kind: 'max', target: sugar10, ideal: sugar5, unit: 'g', tipKey: 'addedSugar' },
        { key: 'fiberDensity', kind: 'fiberDensity', target: 14, unit: 'g/1000 kcal', tipKey: 'fiberDensity' },
        { key: 'saturatedFat', kind: 'max', target: sat10, unit: 'g', tipKey: 'satFat' },
        { key: 'fiber', kind: 'min', target: 25, unit: 'g', tipKey: 'fiber' },
      ]
    case 'heart':
      return [
        { key: 'saturatedFat', kind: 'max', target: sat7, unit: 'g', tipKey: 'satFatHeart' },
        { key: 'sodium', kind: 'max', target: 2000, unit: 'mg', tipKey: 'sodium' },
        { key: 'fiber', kind: 'min', target: 30, unit: 'g', tipKey: 'fiber' },
      ]
    case 'weight':
      return [
        ...(kcalTarget
          ? [{ key: 'calories', kind: 'band', target: kcalTarget, tol: 0.12, unit: 'kcal', tipKey: 'kcal' }]
          : [{ key: 'calories', kind: 'max', target: 1800, unit: 'kcal', tipKey: 'kcal' }]),
        { key: 'fiber', kind: 'min', target: 30, unit: 'g', tipKey: 'fiber' },
        { key: 'saturatedFat', kind: 'max', target: sat10, unit: 'g', tipKey: 'satFat' },
      ]
    case 'gut':
      return [
        { key: 'fiber', kind: 'min', target: 30, unit: 'g', tipKey: 'fiberGut' },
      ]
    default:
      return []
  }
}

function clampStatus(value, rule) {
  if (rule.kind === 'min') {
    if (value >= rule.target) return 'green'
    if (value >= rule.target * 0.75) return 'amber'
    return 'red'
  }
  if (rule.kind === 'max') {
    if (value <= rule.target) return 'green'
    if (rule.ideal != null && value <= rule.ideal) return 'green'
    if (value <= rule.target * 1.15) return 'amber'
    return 'red'
  }
  // Green below target, amber up to amberMax, red above (e.g. BP sodium 1500 / 2000).
  if (rule.kind === 'maxBand') {
    if (value < rule.target) return 'green'
    if (value <= (rule.amberMax ?? rule.target)) return 'amber'
    return 'red'
  }
  if (rule.kind === 'band') {
    const lo = rule.target * (1 - (rule.tol || 0.1))
    const hi = rule.target * (1 + (rule.tol || 0.1))
    if (value >= lo && value <= hi) return 'green'
    if (value >= lo * 0.9 && value <= hi * 1.1) return 'amber'
    return 'red'
  }
  if (rule.kind === 'fiberDensity') {
    if (value >= rule.target) return 'green'
    if (value >= rule.target * 0.75) return 'amber'
    return 'red'
  }
  return 'amber'
}

/**
 * Evaluate one nutrient amount against a rule.
 * @returns {{ key, status, value, target, unit, tipKey }}
 */
export function evaluateRule(rule, dailyAvg) {
  let value = Number(dailyAvg[rule.key]) || 0
  if (rule.kind === 'fiberDensity') {
    const kcal = Math.max(1, Number(dailyAvg.calories) || 0)
    const fiber = Number(dailyAvg.fiber) || 0
    value = (fiber / kcal) * 1000
  }
  return {
    key: rule.key,
    status: clampStatus(value, rule),
    value,
    target: rule.target,
    ideal: rule.ideal,
    unit: rule.unit,
    tipKey: rule.tipKey,
    kind: rule.kind,
  }
}

/**
 * Goal-fit for a week's daily-average nutrient object.
 * @param {string[]} goals
 * @param {object} dailyAvg - per-person daily average nutrients
 * @param {{ kcalTarget?: number|null }} [opts]
 */
export function goalFit(goals, dailyAvg, opts = {}) {
  const list = (goals || []).filter(g => HEALTH_GOAL_IDS.includes(g))
  return list.map(goal => {
    const rules = goalTargetRules(goal, opts)
    const checks = rules.map(r => evaluateRule(r, dailyAvg || {}))
    const worst = checks.some(c => c.status === 'red')
      ? 'red'
      : checks.some(c => c.status === 'amber')
        ? 'amber'
        : checks.length
          ? 'green'
          : 'green'
    return { goal, status: worst, checks }
  })
}

/**
 * Soft-tilt score bonus: how many selected goal labels the recipe carries (0–1),
 * plus fibre density when gut is selected.
 */
export function goalTiltBonus(recipe, goals) {
  const g = (goals || []).filter(x => HEALTH_GOAL_IDS.includes(x))
  if (!g.length) return 0
  const tags = new Set(recipe?.tags || [])
  let matched = 0
  let tagged = 0
  for (const goal of g) {
    const tag = GOAL_LABEL_TAG[goal]
    if (!tag) continue
    tagged++
    if (tags.has(tag)) matched++
  }
  let bonus = tagged ? (matched / tagged) * 1.2 : 0
  if (g.includes('gut')) {
    const n = recipe?.nutrition?.perServing
    const fiber = Number(n?.fiber) || 0
    const kcal = Math.max(40, Number(n?.calories) || 40)
    // Reward ~3 g fibre / 100 kcal and up.
    bonus += 0.8 * Math.min(1.5, (fiber / kcal) * 100 / 3)
  }
  if (g.includes('bloodPressure')) {
    // Stronger tilt toward AHA-ideal sodium (~1500 mg/day): punish salty servings harder.
    const na = Number(recipe?.nutrition?.perServing?.sodium) || 0
    bonus -= 0.85 * Math.min(1.5, na / 450)
    const k = Number(recipe?.nutrition?.perServing?.potassium) || 0
    bonus += 0.35 * Math.min(1, k / 400)
  }
  if (g.includes('heart') || g.includes('diabetes')) {
    const sat = Number(recipe?.nutrition?.perServing?.saturatedFat) || 0
    bonus -= 0.45 * Math.min(1.2, sat / 5)
  }
  if (g.includes('diabetes')) {
    const sug = Number(recipe?.nutrition?.perServing?.addedSugar) || 0
    bonus -= 0.35 * Math.min(1, sug / 8)
    const fiber = Number(recipe?.nutrition?.perServing?.fiber) || 0
    bonus += 0.35 * Math.min(1, fiber / 5)
  }
  return bonus
}

/**
 * Coverage row model for Nutrition UI vs NNR (and caps).
 * @returns {{ key, value, target, pct, mode: 'fill'|'cap'|'supplement', status, unit }}
 */
export function coverageRows(totals, { kcalTarget = null } = {}) {
  const kcal = Number(totals?.calories) || 0
  const energy = Number(kcalTarget) > 0 ? Number(kcalTarget) : NNR_ADULT.calories
  const satCap = (0.10 * energy) / 9
  const sugarCap = (0.10 * energy) / 4

  const targets = {
    ...NNR_ADULT,
    saturatedFat: satCap,
    addedSugar: sugarCap,
    sodium: 2000,
  }

  const keys = [
    'calories', 'protein', 'fiber', 'totalFat', 'saturatedFat', 'addedSugar',
    'sodium', 'potassium', 'calcium', 'iron', 'magnesium', 'zinc',
    'vitaminB12', 'vitaminD', 'vitaminC', 'folate', 'omega3',
  ]

  return keys.filter(k => !HIDDEN_RI_NUTRIENTS.has(k)).map(key => {
    const value = Number(totals?.[key]) || 0
    const target = targets[key]
    if (target == null) return null
    const isCap = CAP_NUTRIENTS.has(key)
    const isSupp = SUPPLEMENT_NOTE_NUTRIENTS.has(key)
    let pct
    let status
    if (isCap) {
      pct = target > 0 ? Math.round((value / target) * 100) : 0
      status = value <= target ? 'green' : value <= target * 1.15 ? 'amber' : 'red'
    } else if (isSupp) {
      pct = target > 0 ? Math.round((value / target) * 100) : 0
      // Never red — calm note when under 75%.
      status = value >= target * 0.75 ? 'green' : 'supplement'
    } else {
      pct = target > 0 ? Math.round((value / target) * 100) : 0
      status = pct >= 75 ? 'green' : pct >= 40 ? 'amber' : 'red'
    }
    return {
      key,
      value,
      target,
      pct,
      mode: isCap ? 'cap' : isSupp ? 'supplement' : 'fill',
      status,
      unit: nutrientUnit(key),
    }
  }).filter(Boolean)
}

/** Daily average from a plan-shaped week { monday: { Breakfast: [{recipeId,servings}] } }. */
export function weekDailyAverageFromPlan(plan, { people = 1, recipeById, fruitByDay = {} } = {}) {
  const dayKeys = Object.keys(plan || {})
  if (!dayKeys.length) return { avg: {}, days: 0 }
  const totals = {}
  let known = 0
  for (const day of dayKeys) {
    let dayHas = false
    for (const list of Object.values(plan[day] || {})) {
      for (const it of list || []) {
        const r = recipeById?.get?.(it.recipeId) || recipeById?.[it.recipeId]
        const n = r?.nutrition?.perServing
        if (!n) continue
        dayHas = true
        const portions = (it.servings == null ? people : it.servings) / Math.max(1, people)
        for (const [k, v] of Object.entries(n)) {
          if (typeof v !== 'number') continue
          totals[k] = (totals[k] || 0) + v * portions
        }
      }
    }
    const fruit = Number(fruitByDay[day]) || 0
    if (fruit) {
      dayHas = true
      totals.calories = (totals.calories || 0) + fruit * 80
      totals.fiber = (totals.fiber || 0) + fruit * 3.5
    }
    if (dayHas) known++
  }
  const days = Math.max(1, known)
  const avg = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / days]))
  return { avg, days: known }
}

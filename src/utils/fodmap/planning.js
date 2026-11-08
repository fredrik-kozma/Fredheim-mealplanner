/**
 * Make my week bridge.
 *
 * The production list is empty, so low-FODMAP mode cannot fill a week.
 * A dataset is used only when it is structurally valid and the caller set
 * trustedByApp after that check. A file cannot set the flag itself.
 * Personal tolerance notes are not an argument here.
 */

import { PRODUCTION_DATASET } from './productionDataset.js'
import { validateDatasetStructure } from './dataset.js'
import { reviewedServingPerPerson } from './assessment.js'

export function datasetUsableForPlanning(dataset) {
  if (!dataset || dataset.trustedByApp !== true) return null
  const { trustedByApp, ...rest } = dataset
  const checked = validateDatasetStructure(rest)
  if (!checked.ok) return null
  return checked.dataset
}

export function productionPlanningDataset() {
  return datasetUsableForPlanning(PRODUCTION_DATASET)
}

export function applyFodmapPool(recipes, dataset, blocked = null) {
  if (!dataset?.records) return []
  return (recipes || []).filter(r => reviewedServingPerPerson(r, dataset.records, blocked) === 1)
}

/** recipe id → exact portions per person (always 1 when present). */
export function portionCapMap(recipes, dataset, blocked = null) {
  const map = new Map()
  if (!dataset?.records) return map
  for (const recipe of recipes || []) {
    const per = reviewedServingPerPerson(recipe, dataset.records, blocked)
    if (per === 1) map.set(recipe.id, 1)
  }
  return map
}

export function householdServingsCap(portionsPerPerson, people) {
  const per = Number(portionsPerPerson)
  const n = Number(people)
  if (!Number.isFinite(per) || !Number.isFinite(n) || n <= 0 || per <= 0) return 0
  return Math.max(0, Math.floor(per * n + 1e-9))
}

export function emptyFodmapWeek(answers, reason) {
  const people = Math.min(8, Math.max(1, Number(answers?.people) || 2))
  const plan = {}
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
    plan[day] = {}
  }
  return {
    kind: 'week',
    plan,
    batchCook: [],
    portions: people,
    notices: [{ key: reason }],
    stats: null,
    saltLevel: answers?.saltLevel || 'low',
    goals: answers?.goals || [],
    goalFit: [],
    focusNutrients: [],
    focus: null,
    uniqueIngredients: 0,
    extras: [],
    fruit: {},
    poolSize: 0,
    fodmap: { applied: false, reason },
  }
}

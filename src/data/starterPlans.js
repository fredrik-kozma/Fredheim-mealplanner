import { recipeHasAvoidedAllergen } from './allergens.js'
/**
 * Starter meal plans — ready-made weeks users can load with one tap.
 *
 * Currently ships only the Fasting Mimicking Plan (FMD). Other curated
 * "sample weeks" (Easy Start, diabetes, …) were removed once Make my week
 * covered everyday planning; FMD stays because its protocol is fixed and
 * Make my week reuses this same entry.
 *
 * To author a new shipped plan:
 *   1. Build the week in the Planner.
 *   2. Planner → Load week → "Download as starter plan JSON".
 *   3. Drop the `plan` object into STARTER_PLANS below and bump `version`.
 *
 * Schema: see git history of this file, or the download JSON shape.
 */

import { FMD_PACK_ID } from './installedPacks'

// The FMD sample week maps Day 1–5 of the protocol onto Monday–Friday;
// Saturday/Sunday are intentionally left empty (the protocol is 5 days,
// with Day 6 being an unstructured refeeding day the user manages
// themselves). The daily broth is dropped into every day's Breakfast
// slot as the first item — it is "prepared each morning" and then sipped
// freely throughout the day, so breakfast is its natural anchor in the
// grid. `servings: null` means "use the recipe's own default servings".
const fmdDay = (n) => ({
  Breakfast: [
    { recipeId: 'fmd-broth', servings: null },
    { recipeId: `fmd-d${n}-breakfast`, servings: null },
  ],
  Lunch: [{ recipeId: `fmd-d${n}-lunch`, servings: null }],
  Dinner: [{ recipeId: `fmd-d${n}-dinner`, servings: null }],
})

export const STARTER_PLANS = [
  {
    id: 'fmd-5day-week-1',
    name: 'Fasting Mimicking Plan — 5-Day Plan',
    description: 'The full 5-day FMD protocol (Longo) mapped to Monday–Friday: three small plant-based, oil-free meals a day plus a vegetable broth sipped freely throughout. ⚠️ Not suitable in pregnancy, type 1/insulin-dependent diabetes, BMI under 18.5, eating-disorder history, or under-18s.',
    condition: 'fmd',
    author: 'Fredheim Livsstilssenter',
    version: '1.1.0',
    translations: {
      no: {
        name: 'Faste-imiterende plan — 5-dagers plan',
        description: 'Hele den 5-dagers FMD-protokollen (Longo) lagt på mandag–fredag: tre små plantebaserte, oljefrie måltider om dagen pluss en grønnsaksbuljong som drikkes fritt gjennom dagen. ⚠️ Ikke egnet ved graviditet, diabetes type 1 / insulinavhengig diabetes, BMI under 18,5, historikk med spiseforstyrrelse, eller under 18 år.',
      },
      sv: {
        name: 'Fastehärmande plan — 5-dagarsplan',
        description: 'Hela den 5-dagars FMD-protokollen (Longo) lagd på måndag–fredag: tre små växtbaserade, oljefria måltider per dag plus en grönsaksbuljong som dricks fritt under dagen. ⚠️ Inte lämplig vid graviditet, typ 1- / insulinberoende diabetes, BMI under 18,5, historik av ätstörning, eller under 18 år.',
      },
    },
    requiredPackIds: [FMD_PACK_ID],
    plan: {
      monday: fmdDay(1),
      tuesday: fmdDay(2),
      wednesday: fmdDay(3),
      thursday: fmdDay(4),
      friday: fmdDay(5),
    },
  },
]

/** Look up a shipped starter plan by id, or null if it was removed / unknown. */
export function getStarterPlan(id) {
  if (!id) return null
  return STARTER_PLANS.find((p) => p.id === id) || null
}

/**
 * If `activeStarterPlanId` points at a plan that no longer ships, clear it.
 * Leaves weekPlan / weekNotes / batchCook untouched — those already hold the
 * user's copy of the meals and tips.
 * Returns { activeStarterPlanId } suitable for merging into persisted state
 * or a zustand set() patch.
 */
export function sanitizeActiveStarterPlanId(activeStarterPlanId) {
  if (!activeStarterPlanId) return { activeStarterPlanId: null }
  if (getStarterPlan(activeStarterPlanId)) return { activeStarterPlanId }
  return { activeStarterPlanId: null }
}

/**
 * Returns true if the plan has actual recipe content (i.e. it has been
 * authored). Empty plans get an "Coming soon" treatment in the UI.
 */
export function planHasContent(plan) {
  if (!plan?.plan) return false
  for (const day of Object.values(plan.plan)) {
    for (const slot of Object.values(day || {})) {
      if (Array.isArray(slot) && slot.length > 0) return true
    }
  }
  return false
}

/**
 * Counts the total recipes referenced by a starter plan, for the
 * "X meals · 7 days" line on the card.
 */
export function countPlanMeals(plan) {
  if (!plan?.plan) return 0
  let n = 0
  for (const day of Object.values(plan.plan)) {
    for (const slot of Object.values(day || {})) {
      if (Array.isArray(slot)) n += slot.length
    }
  }
  return n
}

/**
 * Drop meals whose recipe is blocked. Returns { plan, removed }.
 */
export function filterStarterPlanAgainstBlocks(plan, recipesById, blocked) {
  if (!plan || !blocked) return { plan, removed: 0 }
  let removed = 0
  const next = { ...plan }
  for (const day of Object.keys(plan)) {
    if (typeof plan[day] !== 'object' || !plan[day]) continue
    const daySlots = { ...plan[day] }
    for (const slot of Object.keys(daySlots)) {
      const items = (daySlots[slot] || []).filter((raw) => {
        const id = typeof raw === 'string' ? raw : raw?.recipeId
        if (!id) return true
        const recipe = recipesById?.[id] || recipesById?.get?.(id)
        if (!recipe) return true
        if (recipeHasAvoidedAllergen(recipe, blocked)) { removed++; return false }
        return true
      })
      daySlots[slot] = items
    }
    next[day] = daySlots
  }
  return { plan: next, removed }
}

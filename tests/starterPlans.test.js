// Run with: npm test  (Node's built-in runner, no dependencies)
// The shipped ready-made week (FMD) in src/data/starterPlans.js: every recipe
// it names is in its required pack, Make my week can still find it, and a
// stale activeStarterPlanId from a removed sample week is cleared safely.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  STARTER_PLANS,
  getStarterPlan,
  sanitizeActiveStarterPlanId,
  planHasContent,
  countPlanMeals,
} from '../src/data/starterPlans.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'
import { FMD_STARTER_ID } from '../src/utils/makeMyWeek.js'

const packById = new Map(Object.entries(BUILT_IN_PACKS))
const items = (plan) => Object.entries(plan.plan || {}).flatMap(([day, slots]) =>
  Object.entries(slots).flatMap(([slot, list]) => list.map((item) => ({ day, slot, ...item }))))

test('only the FMD ready-made week ships', () => {
  assert.equal(STARTER_PLANS.length, 1)
  assert.equal(STARTER_PLANS[0].id, FMD_STARTER_ID)
  assert.ok(planHasContent(STARTER_PLANS[0]))
  assert.ok(countPlanMeals(STARTER_PLANS[0]) >= 15) // 5 days × (broth+breakfast+lunch+dinner)
})

test('removed sample weeks are gone', () => {
  for (const id of [
    'easy-start-week-1',
    'diabetes-week-1',
    'diabetes-if-week-1',
    'hypertension-week-1',
    'autoimmune-week-1',
  ]) {
    assert.equal(getStarterPlan(id), null)
  }
})

test('every FMD starter-plan recipe is in the FMD pack', () => {
  const plan = getStarterPlan(FMD_STARTER_ID)
  assert.ok(plan)
  const recipes = new Map(plan.requiredPackIds.flatMap((id) => {
    assert.ok(packById.has(id), `unknown required pack ${id}`)
    return packById.get(id).recipes.map((r) => [r.id, r])
  }))
  for (const { recipeId } of [...items(plan), ...(plan.batchCook || [])]) {
    assert.ok(recipes.has(recipeId), `${recipeId} is not in ${plan.requiredPackIds.join(', ')}`)
  }
})

test('sanitizeActiveStarterPlanId clears removed ids and keeps FMD', () => {
  assert.deepEqual(sanitizeActiveStarterPlanId(null), { activeStarterPlanId: null })
  assert.deepEqual(sanitizeActiveStarterPlanId(undefined), { activeStarterPlanId: null })
  assert.deepEqual(sanitizeActiveStarterPlanId('diabetes-week-1'), { activeStarterPlanId: null })
  assert.deepEqual(sanitizeActiveStarterPlanId('easy-start-week-1'), { activeStarterPlanId: null })
  assert.deepEqual(sanitizeActiveStarterPlanId(FMD_STARTER_ID), { activeStarterPlanId: FMD_STARTER_ID })
})

test('installStarterPlan loads the FMD week', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  const { createJSONStorage } = await import('zustand/middleware')
  const memory = new Map()
  useStore.persist.setOptions({
    storage: createJSONStorage(() => ({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
    })),
  })
  const plan = getStarterPlan(FMD_STARTER_ID)
  useStore.getState().installStarterPlan(plan, 'en')
  const s = useStore.getState()
  assert.equal(s.activeStarterPlanId, plan.id)
  for (const [day, slots] of Object.entries(plan.plan)) {
    for (const [slot, list] of Object.entries(slots)) {
      assert.deepEqual(s.weekPlan[day][slot], list, `${day} ${slot}`)
    }
  }
})

test('setLanguage clears a stale activeStarterPlanId without touching the week', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  const { createJSONStorage } = await import('zustand/middleware')
  const memory = new Map()
  useStore.persist.setOptions({
    storage: createJSONStorage(() => ({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
    })),
  })
  // Simulate a user who loaded the old diabetes sample week before the upgrade:
  // meals stay in weekPlan, but the catalog id is gone.
  useStore.setState({
    activeStarterPlanId: 'diabetes-week-1',
    weekNotes: { week: 'my custom tip', days: {} },
    weekPlan: {
      monday: { Breakfast: [{ recipeId: 'orn-1', servings: 1 }], Lunch: [], Dinner: [] },
      tuesday: { Breakfast: [], Lunch: [], Dinner: [] },
      wednesday: { Breakfast: [], Lunch: [], Dinner: [] },
      thursday: { Breakfast: [], Lunch: [], Dinner: [] },
      friday: { Breakfast: [], Lunch: [], Dinner: [] },
      saturday: { Breakfast: [], Lunch: [], Dinner: [] },
      sunday: { Breakfast: [], Lunch: [], Dinner: [] },
    },
  })
  useStore.getState().setLanguage('sv')
  const s = useStore.getState()
  assert.equal(s.activeStarterPlanId, null)
  assert.equal(s.language, 'sv')
  assert.equal(s.weekNotes.week, 'my custom tip')
  assert.equal(s.weekPlan.monday.Breakfast[0].recipeId, 'orn-1')
})

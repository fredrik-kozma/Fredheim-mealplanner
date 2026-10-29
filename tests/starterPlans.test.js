// Run with: npm test  (Node's built-in runner, no dependencies)
// The shipped sample weeks (src/data/starterPlans.js): every recipe they name
// is in a pack they require, the Type 2 Diabetes week keeps the promise in its
// description, and installStarterPlan loads it.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STARTER_PLANS } from '../src/data/starterPlans.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'

const packById = new Map(Object.entries(BUILT_IN_PACKS))
const items = plan => Object.entries(plan.plan || {}).flatMap(([day, slots]) =>
  Object.entries(slots).flatMap(([slot, list]) => list.map(item => ({ day, slot, ...item }))))
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

test('every starter-plan recipe is in one of the plan\'s required packs', () => {
  for (const plan of STARTER_PLANS) {
    const recipes = new Map(plan.requiredPackIds.flatMap(id => {
      assert.ok(packById.has(id), `${plan.id}: unknown required pack ${id}`)
      return packById.get(id).recipes.map(r => [r.id, r])
    }))
    for (const { recipeId } of [...items(plan), ...(plan.batchCook || [])]) {
      assert.ok(recipes.has(recipeId), `${plan.id}: ${recipeId} is not in ${plan.requiredPackIds.join(', ')}`)
    }
  }
})

test('the Type 2 Diabetes week is all diabetes-friendly, varied, with its bread batch-cooked', () => {
  const plan = STARTER_PLANS.find(p => p.id === 'diabetes-week-1')
  const recipes = new Map(plan.requiredPackIds.flatMap(id => packById.get(id).recipes.map(r => [r.id, r])))
  const all = items(plan)
  for (const { recipeId, day, slot } of [...all, ...plan.batchCook]) {
    assert.ok(recipes.get(recipeId).tags.includes('diabetes-friendly'), `${day ?? 'batch'} ${slot ?? ''}: ${recipeId} is not diabetes-friendly`)
  }
  // Batch-cooked items are eaten through the week by design; everything else
  // at most twice, and never on consecutive days.
  const batched = new Set(plan.batchCook.map(b => b.recipeId))
  const days = new Map()
  for (const { recipeId, day, excludeFromShopping } of all) {
    if (batched.has(recipeId)) { assert.ok(excludeFromShopping, `${day}: ${recipeId} is batch-cooked, use mb()`); continue }
    days.set(recipeId, [...(days.get(recipeId) || []), DAY_ORDER.indexOf(day)])
  }
  for (const [id, list] of days) {
    assert.ok(list.length <= 2, `${id}: ${list.length} times a week`)
    const sorted = [...list].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i] - sorted[i - 1] > 1, `${id}: on consecutive days`)
  }
  // Dinners are a filling Main or soup/stew; a salad or side only next to one.
  for (const [day, slots] of Object.entries(plan.plan)) {
    const cats = slots.Dinner.map(x => recipes.get(x.recipeId).category)
    assert.ok(cats.some(c => c === 'Main' || c === 'Soup'), `${day} dinner has no Main or Soup (${cats.join(', ')})`)
  }
  for (const b of plan.batchCook) {
    const eaten = all.filter(x => x.recipeId === b.recipeId).reduce((n, x) => n + x.servings, 0)
    assert.ok(eaten <= b.servings, `${b.recipeId}: ${eaten} eaten, batch makes ${b.servings}`)
  }
  for (const lang of ['no', 'sv']) {
    assert.ok(plan.translations[lang].description && plan.translations[lang].notes.week, `${lang}: description/notes`)
  }
})

test('installStarterPlan loads the Type 2 Diabetes week', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  // No IndexedDB in Node: persist to a throwaway in-memory store instead.
  const { createJSONStorage } = await import('zustand/middleware')
  const memory = new Map()
  useStore.persist.setOptions({ storage: createJSONStorage(() => ({ getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) })) })
  const plan = STARTER_PLANS.find(p => p.id === 'diabetes-week-1')
  for (const lang of ['en', 'no', 'sv']) {
    useStore.getState().installStarterPlan(plan, lang)
    const s = useStore.getState()
    assert.equal(s.activeStarterPlanId, plan.id)
    assert.equal(s.familySize, plan.portions)
    assert.deepEqual(s.batchCook.map(b => b.recipeId), ['orn-39'])
    assert.equal(s.weekNotes.week, (plan.translations[lang]?.notes || plan.notes).week)
    for (const [day, slots] of Object.entries(plan.plan)) {
      for (const [slot, list] of Object.entries(slots)) assert.deepEqual(s.weekPlan[day][slot], list, `${lang} ${day} ${slot}`)
    }
  }
})

// Run with: npm test  (Node's built-in runner, no dependencies)
// Ticks for a cooking session (src/utils/cookingTicks.js): kept per recipe,
// forgotten after 12 hours, and cleared by the Reset link.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COOKING_TICKS_KEY, TICKS_TTL_MS, loadTicks, saveTicks, toggleTick, resetTicks } from '../src/utils/cookingTicks.js'

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: key => data.delete(key),
    has: key => data.has(key),
  }
}

const NONE = { ingredients: [], steps: [] }
const T0 = 1_000_000

test('ticks are remembered, ingredients and steps apart', () => {
  const storage = fakeStorage()
  let ticks = toggleTick(NONE, 'ingredients', 2)
  ticks = toggleTick(ticks, 'steps', 0)
  saveTicks('soup', ticks, { storage, now: T0 })
  assert.deepEqual(loadTicks('soup', { storage, now: T0 + 1000 }), { ingredients: [2], steps: [0] })
})

test('a second tap takes the tick off', () => {
  const ticked = toggleTick(NONE, 'steps', 1)
  assert.deepEqual(toggleTick(ticked, 'steps', 1), NONE)
})

test('each recipe keeps its own ticks', () => {
  const storage = fakeStorage()
  saveTicks('soup', { ingredients: [1], steps: [] }, { storage, now: T0 })
  saveTicks('bread', { ingredients: [], steps: [3] }, { storage, now: T0 })
  assert.deepEqual(loadTicks('soup', { storage, now: T0 }), { ingredients: [1], steps: [] })
  assert.deepEqual(loadTicks('bread', { storage, now: T0 }), { ingredients: [], steps: [3] })
  assert.deepEqual(loadTicks('stew', { storage, now: T0 }), NONE)
})

test('ticks last just under 12 hours and are gone at 12', () => {
  const storage = fakeStorage()
  const ticks = { ingredients: [1], steps: [2] }
  saveTicks('soup', ticks, { storage, now: T0 })
  assert.deepEqual(loadTicks('soup', { storage, now: T0 + TICKS_TTL_MS - 1 }), ticks)
  assert.deepEqual(loadTicks('soup', { storage, now: T0 + TICKS_TTL_MS }), NONE)
  assert.equal(TICKS_TTL_MS, 12 * 60 * 60 * 1000)
})

test('the 12 hours count from the last tick', () => {
  const storage = fakeStorage()
  saveTicks('soup', { ingredients: [1], steps: [] }, { storage, now: T0 })
  saveTicks('soup', { ingredients: [1, 2], steps: [] }, { storage, now: T0 + TICKS_TTL_MS - 1 })
  assert.deepEqual(loadTicks('soup', { storage, now: T0 + TICKS_TTL_MS + 1 }).ingredients, [1, 2])
})

test('saving clears out other recipes that have expired', () => {
  const storage = fakeStorage()
  saveTicks('old', { ingredients: [1], steps: [] }, { storage, now: T0 })
  saveTicks('new', { ingredients: [2], steps: [] }, { storage, now: T0 + TICKS_TTL_MS })
  assert.deepEqual(Object.keys(JSON.parse(storage.getItem(COOKING_TICKS_KEY))), ['new'])
})

test('reset clears one kind and leaves the other', () => {
  const ticks = { ingredients: [1, 2], steps: [3] }
  assert.deepEqual(resetTicks(ticks, 'steps'), { ingredients: [1, 2], steps: [] })
  assert.deepEqual(resetTicks(ticks, 'ingredients'), { ingredients: [], steps: [3] })
})

test('with nothing ticked the recipe is forgotten, and other recipes stay', () => {
  const storage = fakeStorage()
  saveTicks('soup', { ingredients: [1], steps: [] }, { storage, now: T0 })
  saveTicks('bread', { ingredients: [2], steps: [] }, { storage, now: T0 })
  saveTicks('soup', NONE, { storage, now: T0 })
  assert.deepEqual(loadTicks('soup', { storage, now: T0 }), NONE)
  assert.deepEqual(loadTicks('bread', { storage, now: T0 }).ingredients, [2])
  saveTicks('bread', NONE, { storage, now: T0 })
  assert.equal(storage.has(COOKING_TICKS_KEY), false)
})

test('broken or missing storage never throws', () => {
  for (const raw of ['not json', '[1,2]', 'null', '{"soup":{"steps":"x","updatedAt":"y"}}']) {
    const storage = fakeStorage({ [COOKING_TICKS_KEY]: raw })
    assert.deepEqual(loadTicks('soup', { storage, now: T0 }), NONE)
  }
  const bad = { steps: 'x', ingredients: [1, 'two', null], updatedAt: T0 }
  const storage = fakeStorage({ [COOKING_TICKS_KEY]: JSON.stringify({ soup: bad }) })
  assert.deepEqual(loadTicks('soup', { storage, now: T0 }), { ingredients: [1], steps: [] })

  const full = { getItem: () => null, setItem: () => { throw new Error('quota') }, removeItem: () => {} }
  assert.doesNotThrow(() => saveTicks('soup', { ingredients: [1], steps: [] }, { storage: full, now: T0 }))
  assert.doesNotThrow(() => saveTicks('soup', NONE, { storage: null, now: T0 }))
  assert.deepEqual(loadTicks('soup', { storage: null, now: T0 }), NONE)
})

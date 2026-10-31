import test from 'node:test'
import assert from 'node:assert/strict'
import { ALL_NUTRITION_KEYS, VISIBLE_NUTRITION_GROUPS, sumNutrition } from '../src/utils/nutritionData.js'

test('hidden nutrients are left out of what the UI maps over', () => {
  const shown = VISIBLE_NUTRITION_GROUPS.flatMap(g => g.fields.map(f => f.key))
  assert.ok(!shown.includes('choline'))
  assert.ok(shown.includes('niacin'))
  assert.ok(VISIBLE_NUTRITION_GROUPS.every(g => g.fields.length > 0))
})

test('hidden nutrients stay in the data and the totals', () => {
  assert.ok(ALL_NUTRITION_KEYS.includes('choline'))
  const totals = sumNutrition([{ recipeId: 'a', portions: 2 }], { a: { nutrition: { perServing: { choline: 10 } } } })
  assert.equal(totals.choline, 20)
})

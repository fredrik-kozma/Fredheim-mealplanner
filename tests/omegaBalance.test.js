// Run with: npm test  (Node's built-in runner, no dependencies)
// Omega-6 : omega-3 per day and week (src/utils/omegaBalance.js), and the
// packs carrying the pair it needs.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { omegaRatio, formatOmegaRatio, dayOmega, weekOmega, logMeals, planDayMeals } from '../src/utils/omegaBalance.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'

const recipe = (omega6, omega3) => ({ nutrition: { perServing: { omega6, omega3 } } })

test('the ratio: green at or under 4 : 1, none without omega-3', () => {
  assert.deepEqual(omegaRatio(4, 1), { ratio: 4, favourable: true })
  assert.equal(omegaRatio(4.1, 1).favourable, false)
  assert.equal(omegaRatio(1, 0), null)
  assert.equal(omegaRatio(1, null), null)
  assert.equal(omegaRatio(null, 1), null)
  assert.equal(formatOmegaRatio(0.5), '0.50 : 1')
  assert.equal(formatOmegaRatio(3.21), '3.2 : 1')
  assert.equal(formatOmegaRatio(12.4), '12 : 1')
})

test('a day adds up portions, and one meal without values makes it incomplete', () => {
  const day = dayOmega([{ recipe: recipe(2, 1), portions: 1 }, { recipe: recipe(1, 0.5), portions: 2 }])
  assert.equal(day.complete, true)
  assert.equal(day.ratio, 2)
  for (const missing of [recipe(1, null), recipe(null, 1), {}, undefined]) {
    const d = dayOmega([{ recipe: recipe(2, 1), portions: 1 }, { recipe: missing, portions: 1 }])
    assert.equal(d.complete, false)
    assert.equal(d.ratio, undefined)
  }
  const none = dayOmega([])
  assert.equal(none.empty, true)
  assert.equal(none.complete, false)
})

test('a week sums its complete days and says how many that is', () => {
  const good = dayOmega([{ recipe: recipe(6, 1), portions: 1 }])
  const better = dayOmega([{ recipe: recipe(2, 3), portions: 1 }])
  const broken = dayOmega([{ recipe: recipe(1, null), portions: 1 }])
  const empty = dayOmega([])
  const week = weekOmega([good, better, broken, empty])
  assert.equal(week.ratio, 2)
  assert.equal(week.favourable, true)
  assert.equal(week.complete, 2)
  assert.equal(week.days, 3)
  assert.equal(weekOmega([broken, empty]), null)
  assert.equal(weekOmega([empty]), null)
})

test('log entries and plan items become meals', () => {
  const map = { a: recipe(1, 1) }
  assert.deepEqual(logMeals([{ recipeId: 'a', portions: 1.5 }, { recipeId: 'gone', portions: 1 }], map),
    [{ recipe: map.a, portions: 1.5 }, { recipe: undefined, portions: 1 }])
  // Servings are for the household; null is one each.
  const meals = planDayMeals({ Lunch: [{ recipeId: 'a', servings: 3 }], Dinner: [{ recipeId: 'a', servings: null }] }, id => map[id], 2)
  assert.deepEqual(meals.map(m => m.portions), [1.5, 1])
})

test('every recipe with nutrition in the Fredheim packs has both omega values', () => {
  for (const pack of Object.values(BUILT_IN_PACKS)) {
    if (!/^fredheim/.test(pack.id)) continue
    for (const r of pack.recipes) {
      const per = r.nutrition?.perServing
      if (!per) continue
      assert.ok(per.omega3 != null && per.omega6 != null, `${r.id}: omega3 ${per.omega3}, omega6 ${per.omega6}`)
    }
  }
})

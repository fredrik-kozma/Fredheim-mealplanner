import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  plannedDayTotals, plannedWeekDailyAverage, plannedNutrientContributors,
} from '../src/utils/plannedNutrition.js'
import { DAY_KEYS } from '../src/utils/makeMyWeek.js'

const recipes = {
  a: { id: 'a', title: 'A', nutrition: { perServing: { calories: 100, fiber: 5, sodium: 200, protein: 3 } } },
  b: { id: 'b', title: 'B', nutrition: { perServing: { calories: 200, fiber: 10, sodium: 100, protein: 8 } } },
}
const plan = {
  monday: { Breakfast: [{ recipeId: 'a', servings: null }], Lunch: [{ recipeId: 'b', servings: 2 }] },
  tuesday: { Dinner: [{ recipeId: 'a', servings: null }] },
  wednesday: {},
  thursday: {},
  friday: {},
  saturday: {},
  sunday: {},
}

test('plannedDayTotals uses per-person portions (null servings = 1 each)', () => {
  // people=2: breakfast a → 1 portion/person; lunch b servings 2 → 1 portion/person
  const tot = plannedDayTotals(plan, 'monday', recipes, 2)
  assert.equal(tot.calories, 300)
  assert.equal(tot.fiber, 15)
})

test('plannedWeekDailyAverage averages known days only', () => {
  const { avg, days } = plannedWeekDailyAverage(plan, recipes, 2)
  assert.equal(days, 2)
  // mon 300 + tue 100 (a with null → 1) = 400 / 2 = 200
  assert.equal(avg.calories, 200)
})

test('plannedNutrientContributors pct roughly sum to 100', () => {
  const { total, parts } = plannedNutrientContributors(plan, 'monday', 'fiber', {
    recipeMap: recipes, people: 2,
  })
  assert.equal(total, 15)
  const sumPct = parts.reduce((s, p) => s + p.pct, 0)
  assert.ok(sumPct >= 99 && sumPct <= 101)
  assert.ok(DAY_KEYS.includes('monday'))
})

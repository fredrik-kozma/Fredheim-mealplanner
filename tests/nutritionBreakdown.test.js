import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'path'
import {
  estimateRecipeNutrition,
  estimateRecipeNutritionBreakdown,
  viewNutrientBreakdown,
  largestRemainderPercents,
  roundNutrient,
  ENGINE_FROM_PACK,
} from '../src/utils/nutritionEngine.js'
import { hasStrainSpec, applyRetentionToNutrients } from '../src/utils/nutritionYield.js'
import { VISIBLE_NUTRITION_GROUPS } from '../src/utils/nutritionData.js'
import { applyBlockedSubstitutions } from '../src/data/ingredientBlocker.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const db = JSON.parse(readFileSync(path.join(ROOT, 'src/data/nutritionDb.json'), 'utf8'))

const packs = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day'].map((f) =>
  JSON.parse(readFileSync(path.join(ROOT, 'recipe-packs-template/packs', `${f}.json`), 'utf8')),
)
const allRecipes = packs.flatMap((p) => p.recipes)
const recipeById = Object.fromEntries(allRecipes.map((r) => [r.id, r]))
const visibleKeys = VISIBLE_NUTRITION_GROUPS.flatMap((g) => g.fields.map((f) => f.key))

test('largestRemainderPercents sums to 100', () => {
  const pct = largestRemainderPercents([21.3, 15, 1.21, 0.81, 0.44, 0.16])
  assert.equal(pct.reduce((s, p) => s + p, 0), 100)
})

test('classic-hummus calcium breakdown ranks tahini then chickpeas', () => {
  const r = recipeById['classic-hummus']
  const br = estimateRecipeNutritionBreakdown(r, db, { recipeById, saltLevel: 'low' })
  const view = viewNutrientBreakdown(br, 'calcium', { topN: 5 })
  assert.equal(view.parts[0].name.toLowerCase().includes('tahini'), true)
  assert.ok(view.parts[0].pct >= 50)
  assert.equal(
    view.parts.reduce((s, p) => s + p.pct, 0) + (view.others?.pct || 0),
    100,
  )
})

test('orn-8 oat milk uses strain retention and breakdown agrees', () => {
  const r = recipeById['orn-8']
  assert.ok(hasStrainSpec(r), 'orn-8 has strain spec')
  const est = estimateRecipeNutrition(r, db, { recipeById })
  const br = estimateRecipeNutritionBreakdown(r, db, { recipeById })
  assert.ok(est.warnings.some((w) => /class retention/i.test(w)))
  assert.equal(roundNutrient(br.contributions.reduce((s, c) => s + (c.nutrients.kcal || 0), 0)), est.total.kcal)
  const view = viewNutrientBreakdown(br, 'calories')
  assert.ok(view.parts[0].pct >= 40)
})

test('fr-212 coconut milk class retention lands near verified targets', () => {
  const r = recipeById['fr-212']
  assert.ok(hasStrainSpec(r))
  const live = estimateRecipeNutrition(r, db, { recipeById })
  const p = live.perServing
  assert.ok(Math.abs(p.calories - 84) <= 3, `kcal ${p.calories}`)
  assert.ok(Math.abs(p.totalFat - 5.2) <= 0.4, `fat ${p.totalFat}`)
  assert.ok(Math.abs(p.saturatedFat - 4.6) <= 0.4, `sat ${p.saturatedFat}`)
  assert.ok(Math.abs(p.totalSugars - 8.2) <= 1.0, `sugars ${p.totalSugars}`)
  assert.ok(p.fiber <= 1.0, `fiber ${p.fiber} should stay low (pulp discarded)`)
  assert.ok(Math.abs(p.sodium - 43) <= 8, `sodium ${p.sodium}`)
  const br = estimateRecipeNutritionBreakdown(r, db, { recipeById })
  for (const k of Object.keys(live.total)) {
    const sum = br.contributions.reduce((s, c) => s + (c.nutrients[k] || 0), 0)
    assert.equal(roundNutrient(sum), live.total[k], k)
  }
})

test('applyRetentionToNutrients rebuilds carbs and kcal', () => {
  const raw = { kcal: 100, protein: 2, fat: 10, satFat: 9, carbs: 20, sugars: 8, fiber: 5, added: 0, sodium: 10, potassium: 50 }
  // starch = 20-8-5 = 7; after: sug 7.2, fib 0.5, starch 1.4 ? carbs 9.1; kcal = 2*4 + 9.1*4 + 4*9 = 8+36.4+36 = 80.4
  const { nutrients } = applyRetentionToNutrients(raw, { fat: 0.4, protein: 1, fiber: 0.1, soluble: 0.9, starch: 0.2 })
  assert.ok(Math.abs(nutrients.sugars - 7.2) < 1e-9)
  assert.ok(Math.abs(nutrients.fiber - 0.5) < 1e-9)
  assert.ok(Math.abs(nutrients.carbs - 9.1) < 1e-9)
  assert.ok(Math.abs(nutrients.fat - 4) < 1e-9)
  assert.ok(Math.abs(nutrients.kcal - 80.4) < 1e-6)
})

test('legacy yieldFactor still works when strain is absent', () => {
  const r = structuredClone(recipeById['orn-8'])
  delete r.nutrition.strain
  r.nutrition.yieldFactor = 0.5
  const live = estimateRecipeNutrition(r, db, { recipeById })
  // Full ingredient kcal roughly doubled vs 0.5 factor path — just assert warning + finite
  assert.ok(live.warnings.some((w) => /yield/i.test(w)))
  assert.ok(live.perServing.calories > 0)
})

test('choline is not in visible keys (stays hidden)', () => {
  assert.equal(visibleKeys.includes('choline'), false)
})

test('sum of contributions equals estimateRecipeNutrition totals for all pack recipes and every engine nutrient', () => {
  assert.equal(allRecipes.length, 309)
  const failures = []
  for (const r of allRecipes) {
    const est = estimateRecipeNutrition(r, db, { recipeById, saltLevel: 'low' })
    const br = estimateRecipeNutritionBreakdown(r, db, { recipeById, saltLevel: 'low' })
    for (const [engKey, val] of Object.entries(est.total)) {
      const sum = br.contributions.reduce((s, c) => s + (c.nutrients[engKey] || 0), 0)
      if (roundNutrient(sum) !== val) {
        failures.push(`${r.id}:${engKey} sum=${sum} total=${val}`)
      }
    }
    for (const pk of visibleKeys) {
      assert.ok(ENGINE_FROM_PACK[pk], `missing ENGINE_FROM_PACK for ${pk}`)
    }
  }
  assert.equal(failures.length, 0, failures.slice(0, 10).join('\n'))
})

test('blocked soy-sauce ? tamari attributes nutrition to tamari (food actually eaten)', () => {
  const r = allRecipes.find((x) => (x.ingredients || []).some((i) => i.ingredient === 'soy-sauce'))
  assert.ok(r, 'need a soy-sauce recipe')
  const blocked = { groups: ['gluten'], ids: [] }
  const swapped = applyBlockedSubstitutions(r, blocked, 'en')
  const hasTamari = (swapped.ingredients || []).some((i) => i.ingredient === 'tamari')
  assert.equal(hasTamari, true)
  const br = estimateRecipeNutritionBreakdown(swapped, db, { recipeById, saltLevel: 'low' })
  const sodiumView = viewNutrientBreakdown(br, 'sodium')
  const ids = sodiumView.parts.map((p) => p.ingredientId)
  if (ids.length) {
    assert.equal(ids.includes('soy-sauce'), false)
  }
})

test('unlinked ingredient appears under not counted', () => {
  const recipe = {
    id: 'user-test',
    title: 'User bowl',
    servings: 2,
    ingredients: [
      { ingredient: 'chickpeas-canned', name: 'Chickpeas', quantity: 200, unit: 'g' },
      { name: 'Mystery sprinkle', quantity: 1, unit: 'tbsp' },
    ],
  }
  const br = estimateRecipeNutritionBreakdown(recipe, db, { saltLevel: 'low' })
  assert.ok(br.uncounted.some((u) => /mystery/i.test(u.name)))
  const protein = viewNutrientBreakdown(br, 'protein')
  assert.ok(protein.parts.length >= 1)
})

test('standard salt level changes sodium contribution grams', () => {
  const r = allRecipes.find((x) =>
    (x.ingredients || []).some((i) => i.ingredient === 'salt' && i.standardAmount != null),
  )
  assert.ok(r, 'need salt-switch recipe')
  const low = estimateRecipeNutritionBreakdown(r, db, { recipeById, saltLevel: 'low' })
  const std = estimateRecipeNutritionBreakdown(r, db, { recipeById, saltLevel: 'standard' })
  assert.ok(std.total.sodium >= low.total.sodium)
})

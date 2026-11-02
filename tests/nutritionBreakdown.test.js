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

test('orn-8 oat milk applies yield factor to contributions', () => {
  const r = recipeById['orn-8']
  assert.ok(r?.nutrition?.yieldFactor < 1)
  const br = estimateRecipeNutritionBreakdown(r, db, { recipeById })
  assert.ok(Math.abs(br.yieldFactor - r.nutrition.yieldFactor) < 1e-6)
  const view = viewNutrientBreakdown(br, 'calories')
  assert.ok(view.parts[0].pct >= 50)
})

test('choline is not in visible keys (stays hidden)', () => {
  assert.equal(visibleKeys.includes('choline'), false)
})

test('sum of contributions equals estimateRecipeNutrition totals for all pack recipes and every engine nutrient', () => {
  assert.equal(allRecipes.length, 297)
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
    // Every visible pack key must be present in ENGINE_FROM_PACK
    for (const pk of visibleKeys) {
      assert.ok(ENGINE_FROM_PACK[pk], `missing ENGINE_FROM_PACK for ${pk}`)
    }
  }
  assert.equal(failures.length, 0, failures.slice(0, 10).join('\n'))
})

test('blocked soy-sauce â†’ tamari attributes nutrition to tamari (food actually eaten)', () => {
  // Find a recipe that uses soy-sauce
  const r = allRecipes.find((x) => (x.ingredients || []).some((i) => i.ingredient === 'soy-sauce'))
  assert.ok(r, 'need a soy-sauce recipe')
  const blocked = { groups: ['gluten'], ids: [] }
  const swapped = applyBlockedSubstitutions(r, blocked, 'en')
  const hasTamari = (swapped.ingredients || []).some((i) => i.ingredient === 'tamari')
  assert.equal(hasTamari, true)
  const br = estimateRecipeNutritionBreakdown(swapped, db, { recipeById, saltLevel: 'low' })
  const sodiumView = viewNutrientBreakdown(br, 'sodium')
  const ids = sodiumView.parts.map((p) => p.ingredientId)
  // Should credit tamari, not soy-sauce, when swap applied
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
      { name: 'Mystery sprinkle', quantity: 1, unit: 'tbsp' }, // no id
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


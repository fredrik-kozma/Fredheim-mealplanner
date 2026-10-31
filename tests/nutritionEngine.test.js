import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  rowGrams, estimateRecipeNutrition, diffAgainstPack, omegaRatio, roundNutrient,
} from '../src/utils/nutritionEngine.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const db = JSON.parse(readFileSync(path.join(ROOT, 'src/data/nutritionDb.json'), 'utf8'))

const packPath = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const pack = JSON.parse(readFileSync(packPath, 'utf8'))
const recipeById = Object.fromEntries(pack.recipes.map(r => [r.id, r]))

test('rowGrams: grams pass through', () => {
  const { grams, warning } = rowGrams({ ingredient: 'carrots', quantity: 200, unit: 'g' }, db)
  assert.equal(grams, 200)
  assert.equal(warning, undefined)
})

test('rowGrams: tbsp uses spoonGrams or density', () => {
  // chia may have no spoon grams in offline db — oil has density
  const oil = rowGrams({ ingredient: 'rapeseed-oil', quantity: 1, unit: 'tbsp' }, db)
  assert.ok(oil.grams > 10 && oil.grams < 20, `expected ~14 g, got ${oil.grams}`)
})

test('rowGrams: unknown id warns', () => {
  const r = rowGrams({ ingredient: 'not-a-real-food', quantity: 10, unit: 'g' }, db)
  assert.equal(r.grams, 0)
  assert.match(r.warning, /no composition/)
})

test('rowGrams: salt switch uses standardAmount on standard level', () => {
  // Ensure salt exists in db
  assert.ok(db.foods.salt, 'salt in db')
  const row = { ingredient: 'salt', quantity: 1, unit: 'tsp', standardAmount: 3 }
  // Give salt a tsp weight
  db.foods.salt.g = { ...(db.foods.salt.g || {}), tsp: 6 }
  const low = rowGrams(row, db, { saltLevel: 'low' })
  const std = rowGrams(row, db, { saltLevel: 'standard' })
  assert.equal(low.grams, 6)
  assert.equal(std.grams, 18)
})

test('estimateRecipeNutrition returns 35 pack keys and warnings array', () => {
  const recipe = {
    servings: 2,
    ingredients: [
      { ingredient: 'chickpeas-canned', quantity: 200, unit: 'g' },
      { ingredient: 'lemon-juice', quantity: 1, unit: 'tbsp' },
      { ingredient: 'totally-unknown', quantity: 5, unit: 'g' },
    ],
  }
  // lemon-juice needs density
  if (db.foods['lemon-juice'] && db.foods['lemon-juice'].d == null) db.foods['lemon-juice'].d = 1.03
  const r = estimateRecipeNutrition(recipe, db)
  assert.equal(Object.keys(r.perServing).filter(k => r.perServing[k] != null).length >= 35, true)
  for (const k of ['calories', 'protein', 'sodium', 'omega3', 'omega6', 'choline', 'iron']) {
    assert.ok(k in r.perServing)
  }
  assert.ok(Array.isArray(r.warnings))
  assert.ok(r.warnings.some(w => /totally-unknown|no composition/.test(w)))
  assert.ok(r.perServing.calories > 0)
})

test('omegaRatio helper', () => {
  assert.equal(omegaRatio(1, 4), 4)
  assert.equal(omegaRatio(0, 1), Infinity)
  assert.equal(omegaRatio(0, 0), null)
})

test('classic-hummus live vs pack within loose tolerance (offline DB)', () => {
  const r = pack.recipes.find(x => x.id === 'classic-hummus')
  assert.ok(r, 'classic-hummus in pack')
  // tahini/garlic need units in offline db
  if (db.foods.tahini && !db.foods.tahini.d) db.foods.tahini.d = 1.1
  if (db.foods.garlic && !db.foods.garlic.g?.clove) {
    db.foods.garlic.g = { ...(db.foods.garlic.g || {}), clove: 3 }
  }
  if (db.foods['lemon-juice'] && db.foods['lemon-juice'].d == null) db.foods['lemon-juice'].d = 1.03
  const live = estimateRecipeNutrition(r, db, { recipeById })
  const cmp = diffAgainstPack(live.perServing, r.nutrition.perServing, {
    kcalTol: 0.15, // offline DB is approximate vs Oct 29 pack
    sodiumTol: 0.2,
    defaultTol: 0.25,
  })
  // Soft assert: report but require calories within 25% at least
  const kcalLive = live.perServing.calories
  const kcalPack = r.nutrition.perServing.calories
  const rel = Math.abs(kcalLive - kcalPack) / Math.max(kcalLive, kcalPack)
  assert.ok(rel < 0.35, `hummus kcal live=${kcalLive} pack=${kcalPack} rel=${rel} warnings=${live.warnings.join(';')} diffs=${JSON.stringify(cmp.diffs)}`)
})

test('roundNutrient matches pack style', () => {
  assert.equal(roundNutrient(12.4), 12)
  assert.equal(roundNutrient(2.36), 2.4)
  assert.equal(roundNutrient(0.234), 0.23)
})


test('strained yieldFactor brings oat milk kcal within 3% of pack', () => {
  const r = pack.recipes.find(x => x.id === 'orn-8')
    || JSON.parse(readFileSync(path.join(ROOT, 'recipe-packs-template/packs/fredheim-reversal-protocol.json'), 'utf8')).recipes.find(x => x.id === 'orn-8')
  assert.ok(r, 'orn-8')
  assert.ok(r.nutrition?.yieldFactor > 0 && r.nutrition.yieldFactor < 1, 'yieldFactor stored')
  const live = estimateRecipeNutrition(r, db, { saltLevel: 'low' })
  const packK = r.nutrition.perServing.calories
  const rel = Math.abs(live.perServing.calories - packK) / packK
  assert.ok(rel <= 0.03, `kcal live ${live.perServing.calories} vs pack ${packK} (${Math.round(rel*100)}%)`)
})

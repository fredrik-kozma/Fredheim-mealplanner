import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { withComputedNutrition, recipeHasSaltSwitch } from '../src/utils/computeUserRecipeNutrition.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const db = JSON.parse(readFileSync(path.join(HERE, '../src/data/nutritionDb.json'), 'utf8'))

test('withComputedNutrition stores pack-shaped perServing', () => {
  if (db.foods.carrots && !db.foods.carrots.g) db.foods.carrots.g = { pcs: 61 }
  const data = withComputedNutrition({
    title: 'Test',
    servings: 2,
    ingredients: [
      { ingredient: 'carrots', name: 'Carrots', quantity: 200, unit: 'g' },
      { name: 'unknown dust', quantity: 5, unit: 'g', notInDb: true },
    ],
  }, db)
  assert.ok(data.nutrition?.perServing?.calories > 0)
  assert.ok('omega3' in data.nutrition.perServing)
  assert.ok('choline' in data.nutrition.perServing)
  assert.equal(data.nutritionEstimated, true)
  assert.ok(data.nutritionWarnings.some((w) => /unknown|no composition/i.test(w)))
})

test('salt switch changes sodium when standardAmount set', () => {
  db.foods.salt = db.foods.salt || { m: [0,0,0,0,0,0,0,0,38758,0], u: Array(24).fill(0) }
  db.foods.salt.g = { tsp: 6 }
  db.foods.salt.m[8] = 38758
  const recipe = {
    servings: 1,
    ingredients: [
      { ingredient: 'carrots', quantity: 100, unit: 'g', name: 'Carrots' },
      { ingredient: 'salt', quantity: 0.25, unit: 'tsp', standardAmount: 1, name: 'Salt' },
    ],
  }
  assert.equal(recipeHasSaltSwitch(recipe.ingredients), true)
  const low = withComputedNutrition(recipe, db, { saltLevel: 'low' })
  const std = withComputedNutrition(recipe, db, { saltLevel: 'standard' })
  assert.ok(std.nutrition.perServing.sodium > low.nutrition.perServing.sodium)
  assert.ok(low.nutrition.sodiumStandard > 0)
})

// fr-215 Sunflower & Date Spread: four ingredients, translation parity,
// sweet flavour with no standard salt increase, and live nutrition.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { estimateRecipeNutrition, diffAgainstPack, rowGrams } from '../src/utils/nutritionEngine.js'
import { classifyFlavour, applySaltLevel, saltClass } from '../scripts/lib/saltLevels.mjs'
import { analyzeRecipe, LABELS } from '../scripts/lib/recipeLabels.mjs'
import { normalizeUnit } from '../src/utils/unitNormalizer.js'
import { VINEGAR_RE } from '../scripts/check-recipes.mjs'

const pack = JSON.parse(readFileSync('recipe-packs-template/packs/fredheim-recipes-with-pictures.json', 'utf8'))
const db = JSON.parse(readFileSync('src/data/nutritionDb.json', 'utf8'))
const dict = JSON.parse(readFileSync('src/data/ingredientDictionary.json', 'utf8'))
const dictById = new Map(dict.entries.map((e) => [e.id, e]))
const recipe = pack.recipes.find((r) => r.id === 'fr-215')

const IDS = ['sunflower-seeds', 'dates-dried', 'water', 'salt']

function jpegSize(file) {
  const data = readFileSync(file)
  let i = 2
  while (i < data.length - 8) {
    if (data[i] !== 0xff) { i += 1; continue }
    const marker = data[i + 1]
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: data.readUInt16BE(i + 5), width: data.readUInt16BE(i + 7) }
    }
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue }
    i += 2 + data.readUInt16BE(i + 2)
  }
  throw new Error('no JPEG size')
}

function stringsOf(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) stringsOf(v, out)
  }
  return out
}

test('fr-215 is a four-ingredient sunflower and date spread', () => {
  assert.ok(recipe, 'fr-215 missing')
  assert.equal(recipe.title, 'Sunflower & Date Spread')
  assert.equal(recipe.translations.no.title, 'Solsikke- og daddelpålegg')
  assert.equal(recipe.translations.sv.title, 'Solros- och dadelpålägg')
  assert.equal(recipe.category, 'Spreads')
  assert.deepEqual(recipe.mealTypes, ['component'])
  assert.equal(recipe.servings, 15)
  assert.equal(recipe.servingWeightGrams, 20)
  assert.equal(recipe.portion, '20 g')
  assert.equal(recipe.prepTime, 15)
  assert.equal(recipe.cookTime, 30)
  assert.deepEqual(recipe.ingredients.map((row) => row.ingredient), IDS)
  assert.equal(recipe.ingredients[0].quantity, 120)
  assert.equal(recipe.ingredients[0].unit, 'g')
  assert.equal(recipe.ingredients[1].quantity, 100)
  assert.equal(recipe.ingredients[2].quantity, 80)
  assert.equal(recipe.ingredients[2].unit, 'ml')
  assert.equal(rowGrams(recipe.ingredients[3], db).grams, 0.5)
  assert.equal(recipe.ingredients.filter((row) => row.ingredient === 'water').length, 1)
  const banned = /carob|cocoa|coffee|hazelnut|almond|barley|dairy|vinegar|oil\b/i
  for (const row of recipe.ingredients) assert.equal(banned.test(row.ingredient), false)
})

test('en, no and sv rows and text stay in parity', () => {
  for (const lang of ['no', 'sv']) {
    const tr = recipe.translations[lang]
    assert.equal(tr.ingredients.length, recipe.ingredients.length)
    assert.equal(tr.steps.length, recipe.steps.length)
    assert.ok(tr.title && tr.description && tr.notes && tr.portion)
    assert.equal(tr.portion, '20 g')
    tr.ingredients.forEach((row, i) => {
      const en = recipe.ingredients[i]
      assert.equal(row.ingredient, en.ingredient)
      assert.equal(row.quantity, en.quantity)
      assert.equal(normalizeUnit(row.unit), normalizeUnit(en.unit))
      assert.equal(row.name, dictById.get(row.ingredient).names[lang])
      assert.equal(row.standardAmount, undefined)
    })
  }
  for (const text of stringsOf(recipe)) assert.equal(VINEGAR_RE.test(text), false, text)
})

test('sweet spread does not get a standard salt increase', () => {
  assert.equal(recipe.flavourProfile, 'sweet')
  assert.equal(classifyFlavour(recipe).profile, 'sweet')
  assert.deepEqual(saltClass(recipe), { skip: 'sweet' })
  assert.equal(recipe.nutrition.sodiumStandard, undefined)
  const copy = structuredClone(recipe)
  const res = applySaltLevel(copy, dictById)
  assert.equal(res.skipped, 'sweet')
  for (const list of [copy.ingredients, copy.translations.no.ingredients, copy.translations.sv.ingredients]) {
    assert.ok(list.every((row) => row.standardAmount == null && row.standardUnit == null))
  }
  assert.equal(copy.nutrition.sodiumStandard, undefined)
})

test('stored nutrition matches the live engine and the computed labels', () => {
  const live = estimateRecipeNutrition(recipe, db, { saltLevel: 'low' })
  assert.deepEqual(diffAgainstPack(live.perServing, recipe.nutrition.perServing), { ok: true, diffs: [] })
  assert.equal(recipe.kcal, Math.round(recipe.nutrition.perServing.calories))
  assert.equal(recipe.nutrition.perServing.addedSugar, 0)
  const analysis = analyzeRecipe(recipe, new Map(), { storedMealTypes: true })
  const computed = ['fredheim', ...LABELS.filter((label) => analysis.labels[label].pass)]
  assert.deepEqual(recipe.tags, computed)
})

test('the approved photo is a sized JPEG, not embedded base64', () => {
  assert.equal(recipe.imageUrl, '/pack-images/fr-215.jpg')
  assert.equal(recipe.imageUrl.includes('base64'), false)
  const file = 'public/pack-images/fr-215.jpg'
  assert.equal(existsSync(file), true)
  const size = jpegSize(file)
  assert.equal(size.width, 750)
  assert.equal(size.height, 560)
  const bytes = readFileSync(file)
  assert.equal(bytes[0], 0xff)
  assert.equal(bytes[1], 0xd8)
})

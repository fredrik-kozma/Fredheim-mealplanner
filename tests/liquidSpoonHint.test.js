// Run with: npm test  (Node's built-in runner, no dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { formatLiquidSpoonHint } from '../src/utils/liquidSpoonHint.js'
import { formatScaledIngredient } from '../src/utils/scaleIngredient.js'
import { recipeAsText } from '../src/utils/shareText.js'
import { rowAtLevel } from '../src/utils/saltLevel.js'
import { resolveIngredientId } from '../src/utils/ingredientDictionary.js'
import { SALTY, SOY, GLUTEN } from '../scripts/lib/recipeLabels.mjs'
import { STANDARD_AMOUNT_IDS } from '../scripts/lib/saltLevels.mjs'

const readJson = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'))

const hint = (quantity, ingredient, lang = 'en', unit = 'tbsp') =>
  formatLiquidSpoonHint({ quantity, unit, row: { ingredient }, lang })

const scaled = (row, toServings, extra = {}) =>
  formatScaledIngredient(row, { fromServings: 4, toServings, system: 'metric', lang: 'en', ...extra })

test('a liquid in spoons shows ml and grams in each language', () => {
  assert.equal(hint(3, 'lemon-juice'), '(45 ml, about 45 g)')
  assert.equal(hint(3, 'lemon-juice', 'no'), '(45 ml, ca. 45 g)')
  assert.equal(hint(3, 'lemon-juice', 'sv'), '(45 ml, ca 45 g)')
})

test('a fraction of a spoon is rounded to whole ml and grams', () => {
  assert.equal(hint(3.25, 'lemon-juice'), '(49 ml, about 49 g)')
  assert.equal(hint(2, 'lemon-juice', 'en', 'tsp'), '(10 ml, about 10 g)')
})

test('grams follow the density of the liquid', () => {
  assert.equal(hint(2, 'maple-syrup'), '(30 ml, about 40 g)')
  assert.equal(hint(1, 'honey'), '(15 ml, about 21 g)')
  assert.equal(hint(2, 'olive-oil'), '(30 ml, about 27 g)')
  assert.equal(hint(1, 'soy-sauce'), '(15 ml, about 17 g)')
})

test('Norwegian and Swedish spoon words work the same as the English', () => {
  for (const unit of ['ss', 'msk', 'tablespoons']) assert.equal(hint(1, 'water', 'en', unit), '(15 ml, about 15 g)')
  for (const unit of ['ts', 'tsk', 'teaspoon']) assert.equal(hint(1, 'water', 'en', unit), '(5 ml, about 5 g)')
})

test('nothing under a teaspoon', () => {
  assert.equal(hint(0.25, 'vanilla-extract', 'en', 'tsp'), null)
  assert.equal(hint(0.5, 'lemon-juice', 'en', 'tsp'), null)
  assert.equal(hint(1, 'vanilla-extract', 'en', 'tsp'), '(5 ml, about 4 g)')
  assert.equal(hint(1 / 3, 'lemon-juice'), '(5 ml, about 5 g)', 'a third of a tablespoon is a teaspoon')
})

test('no hint on dry ingredients, other units or missing amounts', () => {
  for (const id of ['salt', 'cinnamon-ground', 'nutritional-yeast', 'vegetable-bouillon', 'cornstarch', 'sukrin', 'ketchup']) {
    assert.equal(hint(2, id), null, id)
  }
  assert.equal(hint(30, 'lemon-juice', 'en', 'ml'), null, 'already in ml')
  assert.equal(hint(30, 'tahini', 'en', 'g'), null)
  assert.equal(hint(null, 'lemon-juice'), null)
  assert.equal(hint(0, 'lemon-juice'), null)
  assert.equal(hint(2, 'no-such-ingredient'), null)
})

test('rows without an id go by name, in any language', () => {
  const byName = (name) => formatLiquidSpoonHint({ quantity: 1, unit: 'tbsp', row: { name }, lang: 'en' })
  assert.equal(byName('lemon juice'), '(15 ml, about 15 g)')
  assert.equal(byName('Sitronsaft'), '(15 ml, about 15 g)')
  assert.equal(byName('rice vinegar'), '(15 ml, about 15 g)')
  assert.equal(byName('Hvitvinseddik'), '(15 ml, about 15 g)')
  assert.equal(byName('Risvinäger, mild'), '(15 ml, about 15 g)')
  assert.equal(byName('sherry vinegar'), '(15 ml, about 15 g)', 'a vinegar with no entry')
  assert.equal(byName('Reddik'), null, 'a radish, not a vinegar')
  assert.equal(byName('flour'), null)
})

test('vinegars and low-sodium soy sauce have entries, in each language', () => {
  assert.equal(hint(2, 'balsamic-vinegar'), '(30 ml, about 33 g)')
  assert.equal(hint(3, 'white-wine-vinegar'), '(45 ml, about 45 g)')
  assert.equal(hint(3, 'soy-sauce-low-sodium'), '(45 ml, about 50 g)')
  for (const [name, id] of [
    ['Hvitvinseddik', 'white-wine-vinegar'], ['Vitvinsvinäger', 'white-wine-vinegar'],
    ['Riseddik', 'rice-vinegar'], ['Risvinäger', 'rice-vinegar'],
    ['Eplecidereddik', 'apple-cider-vinegar'], ['Äppelcidervinäger', 'apple-cider-vinegar'],
    ['Balsamicoeddik', 'balsamic-vinegar'], ['Balsamvinäger', 'balsamic-vinegar'],
    ['Lettsaltet soyasaus', 'soy-sauce-low-sodium'], ['Saltreducerad sojasås', 'soy-sauce-low-sodium'],
  ]) assert.equal(resolveIngredientId({ name }), id, name)
})

test('no liquid in spoons in a built-in pack is left without a hint', () => {
  // Anything measured in spoons with no hint is a dry goods row (butter,
  // flour, chia); a liquid among them would miss its hint.
  const LIQUID = /oil|olje|vinegar|eddik|sauce|saus|honey|honning|water|vann|juice|saft|milk|melk|syrup/i
  for (const pack of ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']) {
    for (const r of readJson(`../recipe-packs-template/packs/${pack}.json`).recipes) {
      for (const row of r.ingredients) {
        if (row.unit !== 'tbsp' && row.unit !== 'tsp') continue
        if (!LIQUID.test(row.name)) continue
        assert.ok(formatLiquidSpoonHint({ quantity: 1, unit: 'tbsp', row, lang: 'en' }), `${r.id}: ${row.name}`)
      }
    }
  }
})

test('low-sodium soy sauce counts as soy sauce for labels, with less sodium', () => {
  for (const set of [SALTY, SOY, GLUTEN, STANDARD_AMOUNT_IDS]) assert.ok(set.has('soy-sauce-low-sodium'))
  const foods = readJson('../scripts/data/food-composition-core.json').foods
  assert.ok(foods['soy-sauce-low-sodium'].v[8] < foods['soy-sauce'].v[8] * 0.7)
})

test('the hint follows the servings and the stored row stays as it was', () => {
  const row = { quantity: 3, unit: 'tbsp', ingredient: 'lemon-juice', name: 'Lemon juice' }
  const before = { ...row }
  assert.deepEqual(scaled(row, 4), { name: 'Lemon juice', quantityLabel: '3 tbsp', spoonHint: '(45 ml, about 45 g)' })
  assert.equal(scaled(row, 2).spoonHint, '(23 ml, about 23 g)')
  assert.equal(scaled(row, 2).quantityLabel, '1 ½ tbsp')
  assert.deepEqual(row, before)
})

test('no hint once the scaled amount is shown in ml or dl, or falls under a teaspoon', () => {
  const row = { quantity: 3, unit: 'tbsp', ingredient: 'lemon-juice', name: 'Lemon juice' }
  assert.match(scaled(row, 12).quantityLabel, / dl$/)
  assert.equal(scaled(row, 12).spoonHint, null)
  assert.equal(scaled({ ...row, quantity: 1 }, 1).spoonHint, null, '¼ tbsp is under a teaspoon')
})

test('a row stored in ml that displays in spoons gets the hint', () => {
  const row = { quantity: 15, unit: 'ml', ingredient: 'lemon-juice', name: 'Lemon juice' }
  const view = scaled(row, 4)
  assert.equal(view.quantityLabel, '1 tbsp')
  assert.equal(view.spoonHint, '(15 ml, about 15 g)')
})

test('the salt switch moves the hint with the amount', () => {
  const row = { quantity: 1, unit: 'tbsp', standardAmount: 2, ingredient: 'soy-sauce', name: 'Soy sauce' }
  assert.equal(scaled(row, 4).spoonHint, '(15 ml, about 17 g)')
  assert.equal(scaled(rowAtLevel(row, 'standard'), 4).spoonHint, '(30 ml, about 33 g)')
})

test('a gram row keeps its own spoon hint', () => {
  const row = { quantity: 4, unit: 'g', ingredient: 'agar-agar', name: 'Agar-agar' }
  assert.equal(scaled(row, 4).spoonHint, '(≈ 2 tsp)')
})

test('shared recipe text carries the hint', () => {
  const row = { quantity: 3.25, unit: 'tbsp', ingredient: 'lemon-juice', name: 'Lemon juice' }
  const text = recipeAsText({
    recipe: { title: 'Dressing', ingredients: [row] },
    lang: 'en',
    labels: { servings: 'Servings', ingredients: 'Ingredients', steps: 'Steps', notes: 'Notes' },
    url: null,
  })
  assert.match(text, /· 3 ¼ tbsp \(49 ml, about 49 g\) Lemon juice/)
})

test('every liquid density in the dictionary is the composition table density', () => {
  const dict = readJson('../src/data/ingredientDictionary.json')
  const foods = readJson('../scripts/data/food-composition-core.json').foods
  const liquids = dict.entries.filter(e => e.liquid)
  assert.ok(liquids.length > 0)
  for (const e of liquids) assert.equal(e.liquid.gPerMl, foods[e.id]?.density, e.id)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildIngredientIndex, searchIngredients, fold } from '../src/utils/ingredientSearch.js'
import { autoLinkIngredientRows, autoLinkRow } from '../src/utils/autoLinkIngredients.js'
import { allowedUnitsFor, suggestUnit } from '../src/utils/allowedUnits.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const dict = JSON.parse(readFileSync(path.join(HERE, '../src/data/ingredientDictionary.json'), 'utf8'))
const nutritionDb = JSON.parse(readFileSync(path.join(HERE, '../src/data/nutritionDb.json'), 'utf8'))
const index = buildIngredientIndex(dict)

test('fold strips accents', () => {
  assert.equal(fold('Gulrøtter'), 'gulrotter')
  assert.equal(fold('Morötter'), 'morotter')
})

test('NO gulrot finds carrots, ranked first in NO', () => {
  const hits = searchIngredients(index, 'gulrot', 'no', 5)
  assert.ok(hits.length, 'expected hits')
  assert.equal(hits[0].id, 'carrots')
})

test('SV morot finds carrots', () => {
  const hits = searchIngredients(index, 'morot', 'sv', 5)
  assert.equal(hits[0].id, 'carrots')
})

test('EN carrot finds carrots', () => {
  const hits = searchIngredients(index, 'carrot', 'en', 5)
  assert.equal(hits[0].id, 'carrots')
})

test('typo gulrott still finds carrots', () => {
  const hits = searchIngredients(index, 'gulrott', 'no', 8)
  assert.ok(hits.some((h) => h.id === 'carrots'), JSON.stringify(hits.map((h) => h.id)))
})

test('allowedUnits includes spoons for spices with spoonGrams', () => {
  const e = dict.entries.find((x) => x.id === 'cumin-ground') || dict.entries.find((x) => x.preferredUnit === 'tsp')
  assert.ok(e, 'need a tsp spice')
  const food = nutritionDb.foods[e.id]
  const units = allowedUnitsFor(e, food)
  assert.ok(units.includes('tsp') || units.includes('tbsp'), units.join(','))
  assert.ok(units.includes('g'))
})

test('suggestUnit prefers dictionary preferredUnit', () => {
  const e = dict.entries.find((x) => x.id === 'water') || dict.entries.find((x) => x.preferredUnit === 'ml')
  const u = suggestUnit(e, nutritionDb.foods[e.id])
  assert.equal(u, e.preferredUnit)
})

test('autoLink exact NO name', () => {
  const { linked, id } = autoLinkRow({ name: 'Gulrøtter', quantity: 200, unit: 'g' }, dict)
  assert.equal(linked, true)
  assert.equal(id, 'carrots')
})

test('autoLink Name, note splits note', () => {
  const { linked, id, row } = autoLinkRow({ name: 'Carrots, diced', quantity: 1, unit: 'pcs' }, dict)
  assert.equal(linked, true)
  assert.equal(id, 'carrots')
  assert.equal(row.note, 'diced')
})

test('autoLink leaves unknown free text', () => {
  const { linked, id } = autoLinkRow({ name: 'xyzzy-unknown-food', quantity: 1, unit: 'g' }, dict)
  assert.equal(linked, false)
  assert.equal(id, null)
})

test('autoLinkIngredientRows links a list', () => {
  const rows = autoLinkIngredientRows([
    { name: 'Carrots', quantity: 100, unit: 'g' },
    { name: 'mystery spice', quantity: 1, unit: 'tsp' },
  ], dict)
  assert.equal(rows[0].ingredient, 'carrots')
  assert.equal(rows[1].ingredient, undefined)
})

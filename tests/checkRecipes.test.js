// Run with: npm test  (Node's built-in runner, no dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { checkPacks, applyBaseline } from '../scripts/check-recipes.mjs'

const DICT = JSON.parse(readFileSync('src/data/ingredientDictionary.json', 'utf8'))

// One row in all three languages, with the dictionary's standard names.
function row(id, quantity, unit, notes = {}) {
  const e = DICT.entries.find((x) => x.id === id)
  const units = { tsp: { no: 'ts', sv: 'tsk' }, tbsp: { no: 'ss', sv: 'msk' }, clove: { no: 'fedd', sv: 'klyfta' } }
  return Object.fromEntries(['en', 'no', 'sv'].map((l) => {
    const r = { quantity, unit: l === 'en' ? unit : (units[unit]?.[l] ?? unit), ingredient: id, name: e.names[l] }
    if (notes[l]) r.note = notes[l]
    return [l, r]
  }))
}

function recipe(id, rows) {
  return {
    id,
    title: 'Test soup',
    steps: ['Cook.'],
    ingredients: rows.map((r) => r.en),
    translations: {
      no: { title: 'Testsuppe', steps: ['Kok.'], ingredients: rows.map((r) => r.no) },
      sv: { title: 'Testsoppa', steps: ['Koka.'], ingredients: rows.map((r) => r.sv) },
    },
  }
}

const check = (r) => checkPacks([{ id: 'test-pack', recipes: [r] }], DICT)
const codes = (issues) => [...new Set(issues.map((i) => i.code))].sort()

const good = () => recipe('good', [
  row('carrots', 200, 'g', { en: 'diced', no: 'i terninger', sv: 'tärnade' }),
  row('garlic', 2, 'clove', { en: 'pressed', no: 'presset', sv: 'pressad' }),
  row('lemons', 1, 'pcs'),
  row('lemon-juice', 2, 'tbsp'),
  row('salt', 1, 'tsp'),
  row('salt', null, '', { en: 'to taste', no: 'etter smak', sv: 'efter smak' }),
  row('water', 5, 'dl'),
])

test('a standard recipe in en/no/sv passes', () => {
  assert.deepEqual(check(good()), [])
})

test('a descriptive word in the name is a non-standard name', () => {
  const r = good()
  r.ingredients[0].name = 'Organic carrots'
  r.translations.no.ingredients[0].name = 'Gulrøtter, økologiske'
  const issues = check(r)
  assert.deepEqual(codes(issues), ['non-standard-name'])
  assert.deepEqual(issues.map((i) => i.lang), ['en', 'no'])
})

test('a row without an ingredient id fails', () => {
  const r = good()
  for (const list of [r.ingredients, r.translations.no.ingredients, r.translations.sv.ingredients]) delete list[1].ingredient
  assert.deepEqual(codes(check(r)), ['missing-id'])
})

test('an id that is not in the dictionary fails', () => {
  const r = good()
  for (const list of [r.ingredients, r.translations.no.ingredients, r.translations.sv.ingredients]) list[0].ingredient = 'carrots-organic'
  assert.deepEqual(codes(check(r)), ['unknown-id'])
})

test('a unit in the wrong family fails: spoons of carrots, grams of salt, grams of garlic', () => {
  for (const [id, q, u] of [['carrots', 2, 'tbsp'], ['salt', 6, 'g'], ['garlic', 6, 'g'], ['lemons', 2, 'tbsp']]) {
    const issues = check(recipe('bad', [row(id, q, u)]))
    assert.deepEqual(codes(issues), ['bad-unit'], `${id} in ${u}`)
    assert.equal(issues.length, 3) // once per language
  }
})

test('units in the same family are fine (dl vs ml, tbsp vs tsp, kg vs g, a pinch of a spice)', () => {
  const r = recipe('ok', [row('water', 250, 'ml'), row('salt', 1, 'tbsp'), row('carrots', 1, 'kg'), row('salt', 1, 'pinch')])
  assert.deepEqual(check(r), [])
})

test('quantity 0, a number without a unit, and an unknown unit fail', () => {
  assert.deepEqual(codes(check(recipe('z', [row('salt', 0, 'tsp')]))), ['zero-quantity'])
  assert.deepEqual(codes(check(recipe('n', [row('carrots', 2, '')]))), ['quantity-without-unit'])
  assert.deepEqual(codes(check(recipe('u', [row('carrots', 2, 'bowls')]))), ['unknown-unit'])
})

test('missing translations fail: title, ingredient list, steps', () => {
  const r = good()
  delete r.translations.sv.title
  delete r.translations.no.ingredients
  r.translations.sv.steps = []
  const issues = check(r)
  assert.deepEqual(codes(issues), ['missing-translation'])
  assert.deepEqual(issues.map((i) => i.message).sort(), ['no no ingredient list', 'no sv steps', 'no sv title'])
})

test('no/sv rows must line up with English: same length, id, quantity and unit', () => {
  const r = good()
  r.translations.no.ingredients[0].quantity = 300
  r.translations.sv.ingredients.pop()
  const issues = check(r)
  assert.deepEqual(codes(issues), ['misaligned'])
  assert.deepEqual(issues.map((i) => i.lang).sort(), ['no', 'sv'])
})

test('baseline: known leftovers are warnings, a new one of the same kind is an error', () => {
  const r = recipe('old', [row('carrots', 2, 'tbsp')])
  const known = check(r).map((i) => i.key)
  assert.deepEqual(applyBaseline(check(r), known).errors, [])
  // the same problem added a second time in the same recipe is new
  const r2 = recipe('old', [row('carrots', 2, 'tbsp'), row('carrots', 1, 'tbsp')])
  const { errors, warnings } = applyBaseline(check(r2), known)
  assert.equal(warnings.length, 3)
  assert.equal(errors.length, 3)
  // and the same problem in a different recipe is never covered
  assert.equal(applyBaseline(check(recipe('new', [row('carrots', 2, 'tbsp')])), known).errors.length, 3)
})

test('the checker passes on the current packs (only baselined leftovers)', () => {
  const out = execFileSync(process.execPath, ['scripts/check-recipes.mjs'], { encoding: 'utf8' })
  assert.match(out, /OK: no new problems/)
})

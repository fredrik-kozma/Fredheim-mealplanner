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

test('a few grams of a spoon-measured kind needs spoon weights in the dictionary', () => {
  const dict = structuredClone(DICT)
  delete dict.entries.find((e) => e.id === 'chia-seeds').spoonGrams
  const checkWith = (r) => checkPacks([{ id: 'test-pack', recipes: [r] }], dict)
  const issues = checkWith(recipe('chia', [row('chia-seeds', 10, 'g')]))
  assert.deepEqual(codes(issues), ['missing-spoon-grams'])
  assert.equal(issues.length, 1) // a dictionary gap, reported once, not per language
  assert.equal(issues[0].soft, true)
  // a warning normally, an error under --strict
  assert.deepEqual(applyBaseline(issues, []).errors, [])
  assert.equal(applyBaseline(issues, [], { strict: true }).errors.length, 1)
  // not for large amounts, entries that have spoon weights, or things that are weighed
  assert.deepEqual(checkWith(recipe('lots', [row('chia-seeds', 50, 'g')])), [])
  assert.deepEqual(check(recipe('ok', [row('chia-seeds', 10, 'g')])), [])
  assert.deepEqual(check(recipe('nuts', [row('walnuts', 20, 'g'), row('rolled-oats', 20, 'g')])), [])
})

test('spoon kinds: seeds, powders, pastes, spices, herbs — not oils, nuts or vegetables', async () => {
  const { spoonKind } = await import('../scripts/check-recipes.mjs')
  const kind = (id) => spoonKind(DICT.entries.find((e) => e.id === id))
  assert.equal(kind('chia-seeds'), 'seed')
  assert.equal(kind('curry-powder'), 'powder')
  assert.equal(kind('miso-paste'), 'paste')
  assert.equal(kind('dry-yeast'), 'baking')
  assert.equal(kind('herbs-fresh-mixed'), 'herb')
  assert.equal(kind('rapeseed-oil'), null)
  assert.equal(kind('walnuts'), null)
  assert.equal(kind('carrots'), null)
})

test('the checker passes on the current packs (only baselined leftovers)', () => {
  const out = execFileSync(process.execPath, ['scripts/check-recipes.mjs'], { encoding: 'utf8' })
  assert.match(out, /OK: no new problems/)
})

// ── Recipe rules: servings, portion, nutrition, time, meal types, labels ──

const FREDHEIM = 'fredheim-recepies-with-pictures'
const fredheimPacks = () => ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
  .map((f) => JSON.parse(readFileSync(`recipe-packs-template/packs/${f}.json`, 'utf8')))

// A complete new recipe: the rye loaf, stamped after the rules came in.
async function completeNewRecipe() {
  const { META_RULES_AFTER } = await import('../scripts/check-recipes.mjs')
  const rye = fredheimPacks().flatMap((p) => p.recipes).find((r) => r.id === 'orn-39')
  return { ...structuredClone(rye), id: 'new-rye', createdAt: META_RULES_AFTER + 1 }
}
const metaCodes = async (r) => {
  const { checkRecipeMeta } = await import('../scripts/check-recipes.mjs')
  const packs = fredheimPacks()
  packs[0].recipes.push(r)
  return codes(checkRecipeMeta(packs, { only: (x) => x.id === r.id }))
}

test('recipe rules: a complete new recipe passes', async () => {
  assert.deepEqual(await metaCodes(await completeNewRecipe()), [])
})

test('recipe rules: each missing field is flagged on a new recipe', async () => {
  const base = await completeNewRecipe()
  const without = (patch) => ({ ...structuredClone(base), ...patch })
  // (2.5 servings also moves the per-serving estimate, so more is flagged.)
  assert.ok((await metaCodes(without({ servings: 2.5 }))).includes('missing-servings'))
  assert.deepEqual(await metaCodes(without({ servingWeightGrams: null })), ['missing-servings'])
  assert.deepEqual(await metaCodes(without({ portion: '' })), ['missing-portion'])
  assert.deepEqual(await metaCodes(without({ mealTypes: [] })), ['missing-meal-types'])
  assert.deepEqual(await metaCodes(without({ prepTime: null })), ['missing-time'])
  assert.deepEqual(await metaCodes(without({ nutrition: {} })), ['missing-nutrition'])
  // Hand-guessed labels: one added, one dropped.
  assert.deepEqual(await metaCodes(without({ tags: [...base.tags.filter((t) => t !== 'heart-healthy'), 'weight-loss'] })), ['labels-not-computed'])
})

test('recipe rules: implausible kcal, and nutrition that disagrees with the ingredients', async () => {
  const base = await completeNewRecipe()
  const per = base.nutrition.perServing
  const withKcal = (calories) => ({ ...structuredClone(base), kcal: calories, nutrition: { ...base.nutrition, perServing: { ...per, calories } } })
  const high = await metaCodes(withKcal(1800))
  assert.ok(high.includes('implausible-kcal') && high.includes('nutrition-mismatch'), String(high))
  // A tiny "meal" is flagged; the same energy on a condiment is not.
  const low = { ...withKcal(40) }
  assert.ok((await metaCodes(low)).includes('implausible-kcal'))
  const { recipeMetaProblems, analyzeRecipe } = await import('../scripts/lib/recipeLabels.mjs')
  const condiment = { ...low, mealTypes: ['component'] }
  assert.ok(!recipeMetaProblems(condiment, analyzeRecipe(condiment, new Map(), { storedMealTypes: true })).some((p) => p.code === 'implausible-kcal' && p.detail === 'low'))
  // `kcal` out of step with the panel.
  assert.deepEqual(await metaCodes({ ...structuredClone(base), kcal: per.calories + 40 }), ['implausible-kcal'])
})

test('recipe rules: built-in recipes meet them all', async () => {
  const { checkRecipeMeta } = await import('../scripts/check-recipes.mjs')
  const issues = checkRecipeMeta(fredheimPacks())
  assert.deepEqual(issues.map((i) => i.key), [])
})

test('recipe rules: a missing portion text on a recipe from before the rules is only a warning', async () => {
  const { checkRecipeMeta, applyBaseline: split } = await import('../scripts/check-recipes.mjs')
  const packs = fredheimPacks()
  const legacy = packs[0].recipes.find((r) => r.id === 'oat-burger')
  delete legacy.portion
  for (const lang of ['no', 'sv']) delete legacy.translations[lang].portion
  const issues = checkRecipeMeta(packs)
  assert.ok(issues.length > 0)
  assert.ok(issues.every((i) => i.code === 'missing-portion' && i.legacy), issues.filter((i) => !i.legacy).map((i) => i.key).join('\n'))
  assert.deepEqual(split(issues, []).errors, [])
  assert.equal(split(issues, [], { strict: true }).errors.length, issues.length, '--strict makes them errors')
  assert.ok(issues.some((i) => i.pack === FREDHEIM))
})

test('label-recipes: --write puts the computed labels on a recipe and nothing else', async () => {
  const { analyzeRecipe, withLabels, LABELS } = await import('../scripts/lib/recipeLabels.mjs')
  const r = await completeNewRecipe()
  const guessed = { ...r, tags: ['vegan', 'weight-loss', 'kid-friendly'] }
  const a = analyzeRecipe(guessed, new Map(), { storedMealTypes: true })
  const tags = withLabels(guessed.tags, a.proposed)
  assert.equal(tags[0], 'vegan', 'other tags kept first')
  assert.deepEqual(tags.filter((t) => LABELS.includes(t)), LABELS.filter((l) => r.tags.includes(l)))
  const out = execFileSync(process.execPath, ['scripts/label-recipes.mjs', '--recipe', 'orn-39'], { encoding: 'utf8' })
  assert.match(out, /diabetes-friendly/)
  assert.match(out, /complete: check-recipes has nothing to add/)
})

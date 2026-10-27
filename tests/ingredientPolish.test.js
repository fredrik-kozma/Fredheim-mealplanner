// Run with: npm test  (Node's built-in runner, no dependencies)
// Follow-ups from the browser test of the ingredient standardisation:
// unit kinds per id, singular/plural, tiny volumes, notes left in names.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generateShoppingList } from '../src/utils/shoppingListGenerator.js'
import { combineQuantities } from '../src/utils/ingredientMatcher.js'
import { formatQuantity } from '../src/utils/formatQuantity.js'
import { formatScaledQuantity, formatScaledIngredient } from '../src/utils/scaleIngredient.js'
import { normalizeUnit, BASE_UNIT_TYPE } from '../src/utils/unitNormalizer.js'
import { nameForAmount, resolveIngredientId, standardName, prefersSpoons } from '../src/utils/ingredientDictionary.js'

const PACKS = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
const loadPack = (id) => JSON.parse(readFileSync(`recipe-packs-template/packs/${id}.json`, 'utf8'))
const ALL = PACKS.flatMap(id => loadPack(id).recipes)
const SHOP = { roundUpWhole: true }

function listFor(recipes, lang = 'en') {
  const weekPlan = { mon: { dinner: recipes.map(r => ({ recipeId: r.id, servings: r.servings || 4 })) } }
  return generateShoppingList(weekPlan, recipes, 4, lang)
}
const allItems = (groups) => groups.flatMap(g => g.items)
const rowsIn = (r, lang) => (lang === 'en' ? r.ingredients : r.translations?.[lang]?.ingredients) || []
const row = (ingredient, quantity, unit, lang = 'en', extra = {}) => ({
  quantity, unit, ingredient, name: standardName(ingredient, lang), ...extra,
})
// Same rows in every language, so a list can be built in any of them.
const recipe = (id, rows) => ({
  id, title: id, servings: 4,
  ingredients: rows.map(([i, q, u, x]) => row(i, q, u, 'en', x)),
  translations: Object.fromEntries(['no', 'sv'].map(l => [l, { title: id, ingredients: rows.map(([i, q, u, x]) => row(i, q, u, l, x)) }])),
})
const kind = (r) => {
  const b = BASE_UNIT_TYPE[normalizeUnit(r.unit)]
  return b === 'g' ? 'weight' : b === 'ml' ? 'volume' : 'count:' + (normalizeUnit(r.unit) || 'pcs')
}

// ---------------------------------------------------------------- 1. unit kinds

test('lemon juice and nutritional yeast use one unit kind in every pack row', () => {
  for (const r of ALL) for (const lang of ['en', 'no', 'sv']) for (const x of rowsIn(r, lang)) {
    if (!x.quantity) continue
    if (x.ingredient === 'lemon-juice' || x.ingredient === 'lime-juice') assert.equal(kind(x), 'volume', `${r.id} ${lang}`)
    if (x.ingredient === 'nutritional-yeast') assert.equal(kind(x), 'volume', `${r.id} ${lang}`)
  }
  // The converted rows, at the documented factors (45 ml a lemon, 5 g a tbsp).
  const at = (id, i) => ALL.find(r => r.id === id).ingredients[i]
  assert.deepEqual([at('fr-172', 10).quantity, at('fr-172', 10).unit], [1.5, 'tbsp'])
  assert.deepEqual([at('orn-14', 6).quantity, at('orn-14', 6).unit], [3, 'tbsp'])
  assert.deepEqual([at('orn-40', 7).quantity, at('orn-40', 7).unit], [1.5, 'tbsp'])
})

test('ids still split across unit kinds are only the known, listed ones', () => {
  // No documented factor (or the row needs a human decision) — see the
  // migration report. A new id showing up here means a new mixed-unit row.
  const KNOWN = new Set([
    'salt', 'onions', 'thyme', 'basil', 'onion-powder', 'agar-agar', 'cinnamon-ground', 'coriander-fresh',
    'garlic-powder', 'dry-yeast', 'psyllium-husk', 'lemons', 'nori', 'carob-powder', 'rosemary', 'miso-paste',
  ])
  const kinds = new Map()
  for (const r of ALL) for (const x of r.ingredients) {
    if (!x.quantity) continue
    if (!kinds.has(x.ingredient)) kinds.set(x.ingredient, new Set())
    kinds.get(x.ingredient).add(kind(x))
  }
  const mixed = [...kinds].filter(([, k]) => k.size > 1).map(([id]) => id)
  assert.deepEqual(mixed.filter(id => !KNOWN.has(id)), [])
})

test('the shopping list merges lemon juice rows from pieces, spoons and ml into one line', () => {
  const stew = ALL.find(r => r.id === 'creamy-red-lentil-stew') // was ½ pcs
  const dressing = ALL.find(r => r.id === 'lemon-and-olive-oil-dressing') // 30 ml
  for (const lang of ['en', 'no', 'sv']) {
    const juice = allItems(listFor([stew, dressing], lang)).filter(i => i.ingredientId === 'lemon-juice')
    assert.equal(juice.length, 1, lang)
  }
})

test('volume units merge with volume, weight with weight, for the same id', () => {
  const r = recipe('r', [
    ['oat-milk', 2, 'dl'], ['oat-milk', 50, 'ml'], ['oat-milk', 1, 'l'], ['oat-milk', 2, 'tbsp'], ['oat-milk', 1, 'tsp'],
    ['carrots', 1, 'kg'], ['carrots', 250, 'g'],
  ])
  const items = allItems(listFor([r]))
  const milk = items.filter(i => i.ingredientId === 'oat-milk')
  const carrots = items.filter(i => i.ingredientId === 'carrots')
  assert.equal(milk.length, 1)
  assert.equal(carrots.length, 1)
  assert.equal(formatQuantity(milk[0].quantity, milk[0].unit, 'en', SHOP), '1.3 l') // 1285 ml
  assert.equal(formatQuantity(carrots[0].quantity, carrots[0].unit, 'no', SHOP), '1,3 kg')
})

// ---------------------------------------------------------------- 2. singular / plural

test('a counted ingredient reads singular at one or less, plural above, in every language', () => {
  const lemons = (lang) => ({ ingredient: 'lemons', name: standardName('lemons', lang) })
  assert.equal(nameForAmount(lemons('no'), 'no', 0.5, 'pcs'), 'Sitron')
  assert.equal(nameForAmount(lemons('sv'), 'sv', 1, 'st'), 'Citron')
  assert.equal(nameForAmount(lemons('en'), 'en', 0.5, ''), 'Lemon')
  assert.equal(nameForAmount(lemons('no'), 'no', 2, 'pcs'), 'Sitroner')
  // Shopping rounds ½ up to 1, so still one; 1.2 rounds to 2.
  assert.equal(nameForAmount(lemons('sv'), 'sv', 0.5, 'pcs', SHOP), 'Citron')
  assert.equal(nameForAmount(lemons('sv'), 'sv', 1.2, 'pcs', SHOP), 'Citroner')
  // A shopping total of pieces arrives as a one-part array.
  assert.equal(nameForAmount({ ingredientId: 'carrots', name: 'Gulrøtter' }, 'no', [{ quantity: 1, unit: 'pcs' }], ''), 'Gulrot')

  // Weighed, measured, or "to taste": the name stays as it is.
  assert.equal(nameForAmount({ ingredient: 'carrots', name: 'Gulrøtter' }, 'no', 200, 'g'), 'Gulrøtter')
  assert.equal(nameForAmount({ ingredient: 'carrots', name: 'Gulrøtter' }, 'no', null, ''), 'Gulrøtter')
  // A name the user typed is never rewritten.
  assert.equal(nameForAmount({ ingredient: 'carrots', name: 'Mine gulrøtter' }, 'no', 1, 'pcs'), 'Mine gulrøtter')
  // A row without an id still finds its entry by its standard name.
  assert.equal(nameForAmount({ name: 'Morötter' }, 'sv', 1, 'st'), 'Morot')
})

test('recipe view and shopping list both say "½ Sitron"', () => {
  const r = recipe('r', [['lemons', 0.5, 'pcs'], ['carrots', 3, 'pcs']])
  const view = formatScaledIngredient(r.translations.no.ingredients[0], { fromServings: 4, toServings: 4, lang: 'no' })
  assert.deepEqual(view, { name: 'Sitron', quantityLabel: '½ stk' })
  const doubled = formatScaledIngredient(r.translations.no.ingredients[0], { fromServings: 4, toServings: 8, lang: 'no' })
  assert.deepEqual(doubled, { name: 'Sitron', quantityLabel: '1 stk' })
  const four = formatScaledIngredient(r.translations.no.ingredients[0], { fromServings: 4, toServings: 16, lang: 'no' })
  assert.equal(four.name, 'Sitroner')

  const items = allItems(listFor([r], 'no'))
  const lemon = items.find(i => i.ingredientId === 'lemons')
  assert.equal(nameForAmount(lemon, 'no', lemon.quantity, lemon.unit, SHOP), 'Sitron')
  assert.equal(formatQuantity(lemon.quantity, lemon.unit, 'no', SHOP), '1 stk')
  const carrots = items.find(i => i.ingredientId === 'carrots')
  assert.equal(nameForAmount(carrots, 'no', carrots.quantity, carrots.unit, SHOP), 'Gulrøtter')
})

test('unit words agree with the amount', () => {
  assert.equal(formatQuantity(3, 'klyfta', 'sv'), '3 klyftor')
  assert.equal(formatQuantity(1, 'klyfta', 'sv'), '1 klyfta')
  assert.equal(formatQuantity(0.67, 'clove', 'sv'), '⅔ klyfta')
  assert.equal(formatQuantity(1.5, 'clove', 'sv'), '1 ½ klyftor')
  assert.equal(formatQuantity(2, 'clove', 'en'), '2 cloves')
  assert.equal(formatQuantity(1, 'clove', 'en'), '1 clove')
  assert.equal(formatQuantity(3, 'fedd', 'no'), '3 fedd')
  assert.equal(formatQuantity(2, 'pinch', 'en'), '2 pinches')
  assert.equal(formatQuantity(2, 'nypa', 'sv'), '2 nypor')
  assert.equal(formatQuantity(2, 'kopp', 'no'), '2 kopper')
  assert.equal(formatQuantity(3, 'pcs', 'no'), '3 stk')
  assert.equal(formatQuantity(3, 'st', 'sv'), '3 st')
  // Shopping round-up decides too: ⅔ clove is bought as 1.
  assert.equal(formatQuantity(0.67, 'clove', 'sv', SHOP), '1 klyfta')
  assert.equal(formatQuantity(2.2, 'clove', 'sv', SHOP), '3 klyftor')
  // The plural spellings read back as the same unit.
  for (const u of ['klyftor', 'cloves', 'pinches', 'nypor', 'klyper', 'kopper', 'koppar', 'handfuls']) {
    assert.ok(['clove', 'pinch', 'cup', 'handful'].includes(normalizeUnit(u)), u)
  }
})

// ---------------------------------------------------------------- 3. tiny volumes

test('under 5 ml shows as quarter teaspoons', () => {
  assert.equal(formatQuantity(1.25, 'ml', 'no'), '¼ ts')
  assert.equal(formatQuantity(1.5, 'ml', 'no'), '¼ ts')
  assert.equal(formatQuantity(1, 'ml', 'sv'), '¼ tsk')
  assert.equal(formatQuantity(2.5, 'ml', 'en'), '½ tsp')
  assert.equal(formatQuantity(3.75, 'ml', 'en'), '¾ tsp')
  assert.equal(formatQuantity(4.9, 'ml', 'en'), '1 tsp')
  assert.equal(formatQuantity(0.2, 'ml', 'en'), '¼ tsp')
  assert.equal(formatQuantity(10, 'ml', 'en'), '10 ml')
  // Through the recipe scaler: 5 ml is a teaspoon, 15 ml a tablespoon.
  const at = (quantity, unit, extra = {}) => formatScaledQuantity({ quantity, unit, fromServings: 1, toServings: 1, lang: 'no', ...extra })
  assert.equal(at(5, 'ml'), '1 ts')
  assert.equal(at(15, 'ml'), '1 ss')
  assert.equal(at(2, 'ml'), '½ ts')
  // ¼ tsp turmeric for 5, cooked for 6 = 1.5 ml: "Gurkemeie ¼ ts", not "1,5 ml".
  assert.equal(formatScaledQuantity({ quantity: 0.25, unit: 'tsp', fromServings: 5, toServings: 6, lang: 'no', ingredient: 'turmeric-ground' }), '¼ ts')
  assert.equal(formatScaledQuantity({ quantity: 0.25, unit: 'tsp', fromServings: 5, toServings: 6, lang: 'no' }), '¼ ts')
})

test('spices stay in spoons on the shopping list and in the recipe view; liquids do not', () => {
  assert.equal(prefersSpoons('cumin-ground'), true)
  assert.equal(prefersSpoons('oat-milk'), false)
  // 1 tsp + 1 tsp + 2.5 ml = 12.5 ml of cumin.
  const r = recipe('r', [['cumin-ground', 1, 'tsp'], ['cumin-ground', 1, 'tsp'], ['cumin-ground', 2.5, 'ml'], ['oat-milk', 7, 'ml']])
  const items = allItems(listFor([r], 'no'))
  const cumin = items.find(i => i.ingredientId === 'cumin-ground')
  assert.equal(formatQuantity(cumin.quantity, cumin.unit, 'no', SHOP), '2 ½ ts')
  const milk = items.find(i => i.ingredientId === 'oat-milk')
  assert.equal(formatQuantity(milk.quantity, milk.unit, 'no', SHOP), '7 ml')
  // A tablespoon and a bit stays a spoon amount for a spice ...
  const big = combineQuantities([{ quantity: 25, unit: 'ml' }], { preferSpoons: true })
  assert.equal(formatQuantity(big.quantity, big.unit, 'no', SHOP), '1 ⅔ ss')
  assert.equal(formatQuantity(25, 'ml', 'no', SHOP), '25 ml')
  // ... and the recipe view agrees.
  assert.equal(formatScaledQuantity({ quantity: 7, unit: 'ml', fromServings: 1, toServings: 1, lang: 'no', ingredient: 'cumin-ground' }), '1 ⅓ ts')
  assert.equal(formatScaledQuantity({ quantity: 7, unit: 'ml', fromServings: 1, toServings: 1, lang: 'no' }), '7 ml')
})

// ---------------------------------------------------------------- 4. notes left in names

test('no pack row keeps a note in its name or lacks an id', () => {
  let rows = 0
  for (const r of ALL) for (const lang of ['en', 'no', 'sv']) for (const x of rowsIn(r, lang)) {
    rows++
    assert.ok(x.ingredient, `${r.id} ${lang} ${x.name}`)
    assert.equal(x.name, standardName(x.ingredient, lang), `${r.id} ${lang}`)
  }
  assert.ok(rows > 6000)
})

test('"Vitlök, finhackad" joins the plain Vitlök line', () => {
  // Pack rows: the finely chopped garlic now carries the id and a note.
  const chopped = ALL.find(r => r.id === 'orn-30')
  const g = chopped.translations.sv.ingredients.find(x => x.ingredient === 'garlic')
  assert.deepEqual([g.name, g.note, g.quantity, normalizeUnit(g.unit)], ['Vitlök', 'finhackad', 3, 'clove'])
  const plain = ALL.find(r => r.translations?.sv?.ingredients?.some(x => x.ingredient === 'garlic' && !x.note && normalizeUnit(x.unit) === 'clove'))
  const garlic = allItems(listFor([chopped, plain], 'sv')).filter(i => i.ingredientId === 'garlic')
  assert.equal(garlic.length, 1)
  assert.equal(garlic[0].name, 'Vitlök')

  // An old saved copy of the recipe (no id, note still in the name) joins too.
  assert.equal(resolveIngredientId({ name: 'Vitlök, finhackad' }), 'garlic')
  assert.equal(resolveIngredientId({ name: 'Vitlöksklyfta' }), 'garlic')
  assert.equal(resolveIngredientId({ name: 'Gulrot' }), 'carrots')
  const legacy = { id: 'old', title: 'old', servings: 4, ingredients: [{ quantity: 3, unit: 'klyfta', name: 'Vitlök, finhackad' }] }
  const both = allItems(listFor([legacy, plain], 'sv')).filter(i => i.name === 'Vitlök')
  assert.equal(both.length, 1)
})

// Run with: npm test  (Node's built-in runner, no dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { generateShoppingList } from '../src/utils/shoppingListGenerator.js'
import { ingredientSimilarity } from '../src/utils/ingredientMatcher.js'
import { categoriseIngredient } from '../src/utils/ingredientCategorizer.js'
import { buildRecipeBreakdown } from '../src/utils/recipeBreakdown.js'
import { recipeAsText } from '../src/utils/shareText.js'
import { buildSearchEntry, matchSearchEntry } from '../src/utils/recipeSearch.js'
import { recipeAllergens } from '../src/data/allergens.js'
import { validateBackup, buildBackup, BACKUP_APP, BACKUP_VERSION } from '../src/utils/dataBackup.js'
import {
  ingredientLabel, resolveIngredientId, standardName, dictionaryAisle, dictionaryEntry,
} from '../src/utils/ingredientDictionary.js'

const PACKS = [
  'fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day',
  'healthy-basics', 'mediterranean', 'nordic-classics',
]
const packPath = (id) => `recipe-packs-template/packs/${id}.json`
const loadPack = (id) => JSON.parse(readFileSync(packPath(id), 'utf8'))

// One recipe per call, all planned on Monday dinner for 4 (no scaling).
function listFor(recipes, lang = 'en') {
  const weekPlan = { mon: { dinner: recipes.map(r => ({ recipeId: r.id, servings: 4 })) } }
  return generateShoppingList(weekPlan, recipes, 4, lang)
}
const allItems = (groups) => groups.flatMap(g => g.items.map(i => ({ ...i, category: g.category })))
const row = (ingredient, quantity, unit, extra = {}) => ({
  quantity, unit, ingredient, name: standardName(ingredient, 'en'), ...extra,
})
const recipe = (id, ingredients, translations = {}) => ({ id, title: id, servings: 4, ingredients, translations })

test('rows with the same id merge into one line, named in the user\'s language', () => {
  const a = recipe('a', [row('carrots', 200, 'g', { note: 'diced' })], {
    no: { title: 'A', ingredients: [{ quantity: 200, unit: 'g', ingredient: 'carrots', name: 'Gulrøtter', note: 'i terninger' }] },
  })
  const b = recipe('b', [row('carrots', 300, 'g', { note: 'grated' })], {
    no: { title: 'B', ingredients: [{ quantity: 300, unit: 'g', ingredient: 'carrots', name: 'Gulrøtter', note: 'revet' }] },
  })
  const en = allItems(listFor([a, b], 'en'))
  assert.equal(en.length, 1)
  assert.equal(en[0].name, 'Carrots')
  assert.equal(en[0].quantity, 500)
  assert.equal(en[0].unit, 'g')
  assert.deepEqual(en[0].sources.map(s => s.note), ['diced', 'grated'])

  const no = allItems(listFor([a, b], 'no'))
  assert.equal(no.length, 1)
  assert.equal(no[0].name, 'Gulrøtter')
  assert.equal(no[0].category, 'Produce')
  assert.equal(listFor([a, b], 'sv').flatMap(g => g.items)[0].name, 'Morötter')
})

test('the same id in incompatible units stays on separate lines; "to taste" rows join', () => {
  const r = recipe('r', [
    row('onions', 200, 'g'),
    row('onions', 2, 'pcs'),
    row('salt', 1, 'tsp'),
    row('salt', 0, '', { note: 'to taste' }),
  ])
  const items = allItems(listFor([r]))
  const onions = items.filter(i => i.name === 'Onions')
  assert.equal(onions.length, 2)
  assert.equal(new Set(onions.map(i => i.id)).size, 2, 'ids must differ so ticks stay separate')
  const salt = items.filter(i => i.name === 'Salt')
  assert.equal(salt.length, 1)
  assert.equal(salt[0].quantity, 1)
})

test('never-merge pairs stay apart: by id, and by plain name', () => {
  const pairs = [
    ['kale', 'salt'],
    ['potatoes', 'tomatoes'],
    ['dates-dried', 'small-oats'],
    ['coconut-oil', 'coconut-milk'],
    ['baking-soda', 'lemons'], // natron / sitron in Norwegian
  ]
  for (const [x, y] of pairs) {
    for (const lang of ['en', 'no', 'sv']) {
      const r = recipe('r', [row(x, 100, 'g'), row(y, 100, 'g')], {
        no: { title: 'r', ingredients: [x, y].map(id => ({ quantity: 100, unit: 'g', ingredient: id, name: standardName(id, 'no') })) },
        sv: { title: 'r', ingredients: [x, y].map(id => ({ quantity: 100, unit: 'g', ingredient: id, name: standardName(id, 'sv') })) },
      })
      assert.equal(allItems(listFor([r], lang)).length, 2, `${x} + ${y} (${lang})`)
    }
  }
  assert.equal(standardName('baking-soda', 'no'), 'Natron')
  assert.equal(standardName('lemons', 'no').startsWith('Sitron'), true)

  // A user's own recipe has no ids: the name matcher must not merge them either.
  const names = [
    ['kale', 'salt'], ['potatoes', 'tomatoes'], ['dates', 'small oats'], ['dadler', 'små havregryn'],
    ['coconut oil', 'coconut milk'], ['kokosolje', 'kokosmelk'], ['natron', 'sitron'],
  ]
  for (const [x, y] of names) assert.ok(ingredientSimilarity(x, y) < 0.8, `${x} ~ ${y}`)
  const own = recipe('own', [
    { quantity: 1, unit: 'pcs', name: 'kale stalk' }, { quantity: 1, unit: 'pcs', name: 'salt stalk' },
  ])
  assert.equal(allItems(listFor([own])).length, 2)

  // ...while real typos and plurals still merge.
  assert.ok(ingredientSimilarity('tomato', 'tomatos') >= 0.8)
  assert.ok(ingredientSimilarity('garlic', 'garlic clove') >= 0.8)
})

test('aisle comes from the dictionary when a row has an id, else from the keyword matcher', () => {
  // Tofu: the keyword matcher says Dairy too, but Gulrøtter it misses; the
  // dictionary gets both right regardless of the name's wording.
  const r = recipe('r', [row('carrots', 100, 'g'), row('tofu', 200, 'g')], {
    no: { title: 'r', ingredients: [
      { quantity: 100, unit: 'g', ingredient: 'carrots', name: 'Gulrøtter' },
      { quantity: 200, unit: 'g', ingredient: 'tofu', name: standardName('tofu', 'no') },
    ] },
  })
  const no = allItems(listFor([r], 'no'))
  assert.equal(no.find(i => i.name === 'Gulrøtter').category, dictionaryAisle('carrots'))
  assert.equal(no.find(i => i.name === standardName('tofu', 'no')).category, dictionaryAisle('tofu'))

  // A name the dictionary doesn't know keeps using categoriseIngredient.
  const own = recipe('own', [{ quantity: 1, unit: 'pcs', name: 'Frozen mystery dumplings' }])
  const item = allItems(listFor([own]))[0]
  assert.equal(item.category, categoriseIngredient('Frozen mystery dumplings'))
  assert.equal(item.name, 'Frozen mystery dumplings')

  // Every dictionary aisle is an existing aisle key, so saved lists translate.
  const AISLE_KEYS = ['Produce', 'Meat & Fish', 'Dairy', 'Bakery & Grains', 'Canned & Dried', 'Oils & Condiments', 'Frozen', 'Beverages', 'Other']
  const dict = JSON.parse(readFileSync('src/data/ingredientDictionary.json', 'utf8'))
  for (const e of dict.entries) assert.ok(AISLE_KEYS.includes(e.aisle), e.id)
})

test('a user row named exactly like a dictionary entry joins the pack line', () => {
  assert.equal(resolveIngredientId({ name: 'Carrots, grated' }), 'carrots')
  assert.equal(resolveIngredientId({ name: 'gulrot' }), 'carrots')
  assert.equal(resolveIngredientId({ name: 'Some carrots I had' }), null)
  const pack = recipe('pack', [row('carrots', 200, 'g')])
  const own = recipe('own', [{ quantity: 100, unit: 'g', name: 'Carrots' }])
  const items = allItems(listFor([pack, own]))
  assert.equal(items.length, 1)
  assert.equal(items[0].quantity, 300)
})

test('water rows stay off the list, with or without an id', () => {
  const r = recipe('r', [row('water', 500, 'ml', { note: 'boiling' }), { quantity: 1, unit: 'dl', name: 'Cold water' }])
  assert.equal(allItems(listFor([r])).length, 0)
})

test('notes: label helper, share text, breakdown', () => {
  assert.equal(ingredientLabel({ name: 'Carrots', note: 'diced' }), 'Carrots, diced')
  assert.equal(ingredientLabel({ name: 'Carrots' }), 'Carrots')
  assert.equal(ingredientLabel(null), '')

  const r = recipe('r', [row('carrots', 200, 'g', { note: 'diced' }), { quantity: 1, unit: 'pcs', name: 'Leek' }])
  const text = recipeAsText({ recipe: r, lang: 'en', labels: { servings: 'S', ingredients: 'I', steps: 'St', notes: 'N' }, url: null })
  assert.match(text, /· 200 g Carrots, diced/)
  assert.match(text, /· 1 pcs Leek/)

  const bd = buildRecipeBreakdown([
    { recipe: 'Soup', quantity: 100, unit: 'g', note: 'diced' },
    { recipe: 'Soup', quantity: 50, unit: 'g', note: 'grated' },
    { recipe: 'Salad', quantity: 50, unit: 'g' },
  ])
  assert.deepEqual(bd.map(b => [b.recipe, b.note]), [['Soup', 'diced; grated'], ['Salad', '']])
})

test('search finds recipes by name, note and current-language synonyms', () => {
  const recipes = PACKS.slice(0, 3).flatMap(id => loadPack(id).recipes)
  const withCarrots = recipes.filter(r => r.ingredients.some(i => i.ingredient === 'carrots'))
  assert.ok(withCarrots.length > 10)
  const hits = (lang, q) => recipes.filter(r => matchSearchEntry(buildSearchEntry(r, lang), q)?.ingredient).map(r => r.id)

  const gulrot = hits('no', 'gulrot')
  const morot = hits('sv', 'morot')
  for (const r of withCarrots) {
    assert.ok(gulrot.includes(r.id), `gulrot -> ${r.id}`)
    assert.ok(morot.includes(r.id), `morot -> ${r.id}`)
  }
  // The chip still shows the recipe's own wording in that language.
  const m = matchSearchEntry(buildSearchEntry(withCarrots[0], 'no'), 'gulrot')
  assert.equal(m.ingredient, 'Gulrøtter')

  // Notes are searched too.
  const r = recipe('r', [row('kale', 50, 'g', { note: "or lamb's lettuce" })], {
    no: { title: 'r', ingredients: [{ quantity: 50, unit: 'g', ingredient: 'kale', name: 'Grønnkål', note: 'eller savoykål' }] },
  })
  assert.ok(matchSearchEntry(buildSearchEntry(r, 'en'), "lamb's lettuce"))
  assert.ok(matchSearchEntry(buildSearchEntry(r, 'en'), 'savoykål'))
})

// Deliberate recipe changes (scripts/apply_recipe_adaptations.mjs): coconut
// milk → soy drink, tamari left out. Once committed, HEAD has them too.
const INTENDED_ALLERGENS = {
  'fredheim-recipes-with-pictures/red-lentil-soup': ['soy'],
  'fredheim-reversal-protocol/orn-20': ['tree-nuts'],
}

test('allergen flags for every built-in recipe are identical to the original packs (git HEAD)', () => {
  let compared = 0
  for (const id of PACKS) {
    const before = JSON.parse(execFileSync('git', ['show', `HEAD:${packPath(id)}`], { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' }))
    const after = loadPack(id)
    const old = new Map(before.recipes.map(r => [r.id, recipeAllergens(r)]))
    const now = new Set(after.recipes.map(r => r.id))
    for (const r of before.recipes) assert.ok(now.has(r.id), `${id} / ${r.id} is gone`)
    // Recipes added since HEAD have nothing to compare with.
    for (const r of after.recipes.filter(x => old.has(x.id))) {
      const expected = INTENDED_ALLERGENS[`${id}/${r.id}`] || old.get(r.id)
      assert.deepEqual(recipeAllergens(r), expected, `${id} / ${r.id}`)
      compared++
    }
  }
  assert.ok(compared > 260)
})

test('migrated pack rows are well-formed', () => {
  for (const id of PACKS.slice(0, 3)) {
    for (const r of loadPack(id).recipes) {
      for (const lang of ['en', 'no', 'sv']) {
        const rows = lang === 'en' ? r.ingredients : r.translations?.[lang]?.ingredients
        assert.ok(rows, `${r.id} has ${lang}`)
        rows.forEach((x, i) => {
          assert.ok(dictionaryEntry(x.ingredient), `${r.id} ${lang} #${i}`)
          assert.equal(x.name, standardName(x.ingredient, lang))
          assert.equal(x.ingredient, r.ingredients[i].ingredient)
        })
      }
    }
  }
})

test('backups and saved lists accept old rows (no id/note) and new rows', () => {
  const oldRecipe = { id: 'u1', title: 'Mine', ingredients: [{ quantity: 2, unit: 'pcs', name: 'Carrots' }] }
  const newRecipe = { id: 'p1', title: 'Edited pack', sourcePackId: 'x', userEdited: true, ingredients: [row('carrots', 200, 'g', { note: 'diced' })] }
  const savedOld = { id: 's1', name: 'Old', portions: 4, items: [{ category: 'Produce', items: [{ name: 'carrots', quantity: 300, unit: 'g', sources: [{ recipe: 'Soup', quantity: 300, unit: 'g' }] }] }] }
  const backup = buildBackup({ recipes: [oldRecipe, newRecipe], savedShoppingLists: [savedOld] })
  const parsed = JSON.parse(JSON.stringify(backup))
  assert.equal(parsed.app, BACKUP_APP)
  assert.equal(parsed.version, BACKUP_VERSION)
  const v = validateBackup(parsed)
  assert.equal(v.ok, true)
  assert.deepEqual(v.dropped, [])
  assert.deepEqual(v.data.recipes, [oldRecipe, newRecipe])
  assert.equal(v.data.recipes[1].ingredients[0].note, 'diced')

  // An old saved list's breakdown still renders (no note).
  const bd = buildRecipeBreakdown(v.data.savedShoppingLists[0].items[0].items[0].sources)
  assert.equal(bd[0].note, '')

  // Both shapes still produce a shopping list.
  assert.equal(allItems(listFor([oldRecipe, newRecipe].map(r => ({ ...r, servings: 4 })))).length, 2)
})


// Appended tests for MMW specific blocked ingredient ids — applied by patch script
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'
import { buildPool, defaultAnswers, makeMyWeek } from '../src/utils/makeMyWeek.js'
import {
  recipeIsBlocked,
  textMatchesBlockedId,
  termsForBlockedId,
} from '../src/data/ingredientBlocker.js'
import { buildIngredientIndex, searchIngredients } from '../src/utils/ingredientSearch.js'
import dictionary from '../src/data/ingredientDictionary.json'

const ALL = Object.values(BUILT_IN_PACKS).flatMap(p => p.recipes.map(r => ({ ...r, sourcePackId: p.id })))
const BASE = { goal: 'general', people: 2, avoid: [], blockedIds: [], noHoney: false, time: 'medium', batch: false, meals: 3 }

test('defaultAnswers seeds blockedIds from blockedIngredients', () => {
  const a = defaultAnswers({
    familySize: 2,
    blockedIngredients: { groups: ['gluten'], ids: ['mushrooms', 'tofu'] },
  })
  assert.deepEqual(a.avoid, ['gluten'])
  assert.deepEqual(a.blockedIds, ['mushrooms', 'tofu'])
})

test('search finds mushrooms via champignon / shiitake / sopp synonyms', () => {
  const index = buildIngredientIndex(dictionary)
  assert.ok(searchIngredients(index, 'champignon', 'en', 5).some(r => r.id === 'mushrooms'))
  assert.ok(searchIngredients(index, 'shiitake', 'en', 5).some(r => r.id === 'mushrooms'))
  assert.ok(searchIngredients(index, 'sopp', 'no', 5).some(r => r.id === 'mushrooms'))
  assert.ok(termsForBlockedId('mushrooms').some(t => t.includes('shiitake') || t.includes('champignon')))
  assert.ok(textMatchesBlockedId('fresh shiitake mushrooms', 'mushrooms'))
  assert.ok(textMatchesBlockedId('Champignon', 'mushrooms'))
})

test('blocking mushrooms id hides mushroom recipes in the MMW pool', () => {
  const withMush = ALL.filter(r => (r.ingredients || []).some(i => (i.ingredient || i.id) === 'mushrooms'))
  assert.ok(withMush.length >= 3, 'expected pack recipes with mushrooms')
  for (const r of withMush) {
    assert.equal(recipeIsBlocked(r, { groups: [], ids: ['mushrooms'] }), true, r.id)
  }
  const pool = buildPool(ALL, { ...BASE, blockedIds: ['mushrooms'] })
  for (const r of pool) {
    assert.ok(!(r.ingredients || []).some(i => (i.ingredient || i.id) === 'mushrooms'), r.id)
  }
})

test('blocking tofu id respects soy-sauce / tamari gluten swap (tofu still hard-blocks)', () => {
  const tofuRecipe = ALL.find(r => (r.ingredients || []).some(i => (i.ingredient || i.id) === 'tofu'))
  assert.ok(tofuRecipe, 'need a tofu recipe')
  assert.equal(recipeIsBlocked(tofuRecipe, { groups: [], ids: ['tofu'] }), true)
  // Gluten + soy sauce still substitutes rather than hiding solely for soy sauce
  const soySauceOnly = {
    id: 'test-soy',
    ingredients: [{ ingredient: 'soy-sauce', name: 'Soy sauce', quantity: 1, unit: 'tbsp' }],
  }
  assert.equal(recipeIsBlocked(soySauceOnly, { groups: ['gluten'], ids: [] }), false)
})

test('makeMyWeek with blockedIds mushrooms never plans mushroom recipes', () => {
  const week = makeMyWeek({
    recipes: ALL,
    answers: { ...BASE, goals: ['bloodPressure'], blockedIds: ['mushrooms', 'tofu'], batch: true },
    seed: 11,
    installedPackIds: Object.keys(BUILT_IN_PACKS),
  })
  assert.equal(week.kind, 'week')
  for (const slots of Object.values(week.plan)) {
    for (const list of Object.values(slots || {})) {
      for (const it of list || []) {
        const r = ALL.find(x => x.id === it.recipeId)
        assert.ok(r, it.recipeId)
        assert.equal(recipeIsBlocked(r, { groups: [], ids: ['mushrooms', 'tofu'] }), false, r.id)
      }
    }
  }
})

// Run with: npm test  (Node's built-in runner, no dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AISLES, categoriseIngredient } from '../src/utils/ingredientCategorizer.js'

const expectAisle = (cases, aisle) => {
  for (const name of cases) assert.equal(categoriseIngredient(name), aisle, name)
}

test('words hidden inside other words no longer decide the aisle', () => {
  expectAisle(['watermelon', 'Watermelon, raw', 'arugula', 'Arugula'], 'Produce')
  expectAisle(['vannmelon', 'Vannmelon, rå', 'ruccola', 'vattenmelon'], 'Produce')
})

test('the head noun wins: coconut oil is an oil, soy milk is a milk', () => {
  expectAisle(['coconut oil', 'Coconut oil, melted', 'kokosolje', 'kokosolja'], 'Oils & Condiments')
  expectAisle(['soy milk', 'Soy milk', 'soyamelk', 'sojamjölk', 'oat milk', 'havremelk', 'havredryck'], 'Dairy')
})

test('water is a beverage, but not when it is olive brine', () => {
  expectAisle(['water', 'Water', 'vann', 'vatten', 'cold water'], 'Beverages')
  expectAisle(['Olive water', 'Olivenvann (saltlake)', 'kokevann fra kikerter'], 'Canned & Dried')
})

test('longest keyword and compound heads', () => {
  assert.equal(categoriseIngredient('coconut milk'), 'Canned & Dried')
  assert.equal(categoriseIngredient('gresskarkjerner'), 'Canned & Dried')
  assert.equal(categoriseIngredient('gresskar'), 'Produce')
  assert.equal(categoriseIngredient('laurbærblad, tørket'), 'Oils & Condiments')
  assert.equal(categoriseIngredient('hvitløksfedd, knust'), 'Produce')
  assert.equal(categoriseIngredient('garlic cloves, minced'), 'Produce')
  assert.equal(categoriseIngredient('Ground cloves'), 'Oils & Condiments')
  assert.equal(categoriseIngredient('tomater'), 'Produce')
  assert.equal(categoriseIngredient('selleristilker'), 'Produce')
})

test('modifiers move produce and fish to the right aisle', () => {
  assert.equal(categoriseIngredient('frozen blueberries'), 'Frozen')
  assert.equal(categoriseIngredient('Fresh or frozen berries'), 'Produce')
  assert.equal(categoriseIngredient('Crushed tomatoes'), 'Canned & Dried')
  assert.equal(categoriseIngredient('hermetiske tomater'), 'Canned & Dried')
  assert.equal(categoriseIngredient('Thyme, dried'), 'Oils & Condiments')
  assert.equal(categoriseIngredient('Apricots, dried'), 'Canned & Dried')
  assert.equal(categoriseIngredient('tunfisk i olje'), 'Canned & Dried')
  assert.equal(categoriseIngredient('laksefilet'), 'Meat & Fish')
})

test('unknown names fall back to Other, and every result is a known aisle', () => {
  assert.equal(categoriseIngredient(''), 'Other')
  assert.equal(categoriseIngredient('xyzzy'), 'Other')
  for (const name of ['water', 'kokosolje', 'vattenmelon', 'something odd']) {
    assert.ok(AISLES.includes(categoriseIngredient(name)))
  }
})

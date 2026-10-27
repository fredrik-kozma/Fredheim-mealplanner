// Run with: npm test  (Node's built-in runner, no dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatQuantity, formatAmount } from '../src/utils/formatQuantity.js'
import { formatScaledQuantity } from '../src/utils/scaleIngredient.js'
import { combineQuantities } from '../src/utils/ingredientMatcher.js'

test('countable and spoon units snap to kitchen fractions', () => {
  assert.equal(formatQuantity(0.67, 'clove'), '⅔ clove')
  assert.equal(formatQuantity(1.5, 'tbsp'), '1 ½ tbsp')
  assert.equal(formatQuantity(2.25, 'cup'), '2 ¼ cups')
  assert.equal(formatQuantity(0.33, 'tsp'), '⅓ tsp')
  assert.equal(formatQuantity(0.75, 'dl'), '¾ dl')
  assert.equal(formatQuantity(3, 'pcs'), '3 pcs')
  assert.equal(formatQuantity(2.96, 'pcs'), '3 pcs')
  assert.equal(formatQuantity(1.9, ''), '2')
  assert.equal(formatQuantity(2.6, ''), '2 ⅔')
})

test('a real amount never shows as 0', () => {
  assert.equal(formatQuantity(0.05, 'tsp'), '¼ tsp')
  assert.equal(formatQuantity(0.1, 'clove'), '¼ clove')
  assert.equal(formatQuantity(0.01, 'g'), '0.5 g')
  assert.equal(formatQuantity(0.01, 'kg'), '0.1 kg')
})

test('Norwegian and Swedish unit spellings and labels', () => {
  assert.equal(formatQuantity(0.67, 'fedd', 'no'), '⅔ fedd')
  assert.equal(formatQuantity(1.5, 'ss', 'no'), '1 ½ ss')
  assert.equal(formatQuantity(0.5, 'ts', 'no'), '½ ts')
  assert.equal(formatQuantity(2, 'stk', 'no'), '2 stk')
  assert.equal(formatQuantity(1.5, 'msk', 'sv'), '1 ½ msk')
  assert.equal(formatQuantity(0.25, 'tsk', 'sv'), '¼ tsk')
  assert.equal(formatQuantity(0.67, 'clove', 'sv'), '⅔ klyfta')
})

test('metric weight and volume round by size, no fractions', () => {
  assert.equal(formatQuantity(66.7, 'ml'), '65 ml')
  assert.equal(formatQuantity(533.3, 'g'), '530 g')
  assert.equal(formatQuantity(7.4, 'g'), '7 g')
  assert.equal(formatQuantity(3.3, 'g'), '3.5 g')
  assert.equal(formatQuantity(12, 'g'), '10 g')
  assert.equal(formatQuantity(1.25, 'kg'), '1.3 kg')
  assert.equal(formatQuantity(2, 'l'), '2 l')
  assert.equal(formatQuantity(1.04, 'l'), '1 l')
})

test('decimal comma in no/sv', () => {
  assert.equal(formatQuantity(1.25, 'kg', 'no'), '1,3 kg')
  assert.equal(formatQuantity(3.3, 'g', 'sv'), '3,5 g')
})

test('no amount shows just the unit; strings pass through', () => {
  assert.equal(formatQuantity(0, 'pinch', 'no'), 'klype')
  assert.equal(formatQuantity(null, ''), '')
  assert.equal(formatQuantity('2 pk', ''), '2 pk')
  assert.equal(formatAmount(0, 'g'), '')
})

test('mixed-unit totals format each part', () => {
  const parts = [{ quantity: 2.67, unit: 'clove' }, { quantity: 1, unit: 'tsp' }]
  assert.equal(formatQuantity(parts, '', 'no'), '2 ⅔ fedd + 1 ts')
})

const SHOP = { roundUpWhole: true }

test('shopping list rounds whole items up; recipes keep fractions', () => {
  assert.equal(formatScaledQuantity({ quantity: 0.67, unit: 'clove', fromServings: 1, toServings: 1 }), '⅔ clove')
  assert.equal(formatQuantity(0.67, 'clove', 'en', SHOP), '1 clove')

  // Eggs are unitless.
  assert.equal(formatScaledQuantity({ quantity: 1.5, unit: '', fromServings: 1, toServings: 1 }), '1 ½')
  assert.equal(formatQuantity(1.5, '', 'en', SHOP), '2')

  assert.equal(formatScaledQuantity({ quantity: 1.5, unit: 'tbsp', fromServings: 1, toServings: 1 }), '1 ½ tbsp')
  assert.equal(formatQuantity(1.5, 'tbsp', 'en', SHOP), '1 ½ tbsp')
})

test('shopping round-up covers counts in every language, not measures or metric', () => {
  assert.equal(formatQuantity(0.67, 'fedd', 'no', SHOP), '1 fedd')
  assert.equal(formatQuantity(0.67, 'klyfta', 'sv', SHOP), '1 klyfta')
  assert.equal(formatQuantity(1.2, 'boks', 'no', SHOP), '2 stk')
  assert.equal(formatQuantity(1.2, 'burk', 'sv', SHOP), '2 st')
  assert.equal(formatQuantity(1.2, 'pk', 'no', SHOP), '2 pk')
  assert.equal(formatQuantity(0.4, 'bunch', 'en', SHOP), '1 pcs')
  assert.equal(formatQuantity(0.5, 'ts', 'no', SHOP), '½ ts')
  assert.equal(formatQuantity(0.67, 'dl', 'no', SHOP), '⅔ dl')
  assert.equal(formatQuantity(0.75, 'cup', 'en', SHOP), '¾ cup')
  assert.equal(formatQuantity(66.7, 'ml', 'en', SHOP), '65 ml')
  assert.equal(formatQuantity(1.25, 'kg', 'no', SHOP), '1,3 kg')
})

test('shopping round-up never shows 0 and does not over-count exact sums', () => {
  assert.equal(formatQuantity(0.01, 'pcs', 'en', SHOP), '1 pcs')
  assert.equal(formatQuantity(1 / 3 + 1 / 3 + 1 / 3, 'clove', 'en', SHOP), '1 clove')
  assert.equal(formatQuantity(2, 'pcs', 'en', SHOP), '2 pcs')
  const mixed = [{ quantity: 2.2, unit: 'clove' }, { quantity: 1.5, unit: 'tsp' }]
  assert.equal(formatQuantity(mixed, '', 'no', SHOP), '3 fedd + 1 ½ ts')
})

test('recipe view and shopping list format the same scaled amount', () => {
  // Garlic: 1 clove in a 3-serving recipe, cooked for 2.
  const recipeView = formatScaledQuantity({ quantity: 1, unit: 'clove', fromServings: 3, toServings: 2 })
  const shop = combineQuantities([{ quantity: 1 * 2 / 3, unit: 'clove' }])
  assert.equal(recipeView, '⅔ clove')
  assert.equal(formatQuantity(shop.quantity, shop.unit, 'en', SHOP), '1 clove')

  // Soy milk: 100 ml for 3, cooked for 2 = 66.7 ml — identical in both.
  const soyRecipe = formatScaledQuantity({ quantity: 100, unit: 'ml', fromServings: 3, toServings: 2 })
  const soyShop = combineQuantities([{ quantity: 100 * 2 / 3, unit: 'ml' }])
  assert.equal(soyRecipe, '65 ml')
  assert.equal(formatQuantity(soyShop.quantity, soyShop.unit, 'en', SHOP), '65 ml')
})

// Run with: npm test  (Node's built-in runner, no dependencies)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatGramSpoonHint } from '../src/utils/gramSpoonHint.js'
import { formatScaledIngredient } from '../src/utils/scaleIngredient.js'
import { recipeAsText } from '../src/utils/shareText.js'

const hint = (quantity, ingredientId, lang = 'en', unit = 'g') =>
  formatGramSpoonHint({ quantity, unit, ingredientId, lang })

test('small gram amounts get a spoon hint in each language', () => {
  assert.equal(hint(4, 'agar-agar'), '(≈ 2 tsp)')
  assert.equal(hint(4, 'agar-agar', 'no'), '(≈ 2 ts)')
  assert.equal(hint(4, 'agar-agar', 'sv'), '(≈ 2 tsk)')
})

test('about a tablespoon and up says tablespoons', () => {
  assert.equal(hint(6, 'agar-agar'), '(≈ 1 tbsp)')
  assert.equal(hint(6, 'agar-agar', 'no'), '(≈ 1 ss)')
  assert.equal(hint(14, 'flaxseed-ground'), '(≈ 2 tbsp)')
  assert.equal(hint(17, 'miso-paste'), '(≈ 1 tbsp)')
})

test('the spoon amount snaps to a kitchen fraction', () => {
  assert.equal(hint(7, 'agar-agar'), '(≈ 1 ¼ tbsp)')
})

test('fresh herbs use chopped weights and stop at about 4 tbsp', () => {
  assert.equal(hint(5, 'parsley'), '(≈ 1 ¼ tbsp)')
  assert.equal(hint(3, 'dill'), '(≈ 3 tbsp)')
  assert.equal(hint(5, 'herbs-fresh-mixed'), '(≈ 1 ⅔ tbsp)')
  assert.equal(hint(7, 'dill'), null, 'over 4 tbsp')
})

test('no hint where it does not help', () => {
  assert.equal(hint(50, 'agar-agar'), null, 'too much to spoon')
  assert.equal(hint(0.2, 'agar-agar'), null, 'too little to spoon')
  assert.equal(hint(2, 'agar-agar', 'en', 'tsp'), null, 'already in spoons')
  assert.equal(hint(4, 'no-such-ingredient'), null, 'unknown id')
  assert.equal(hint(4, 'rolled-oats'), null, 'no spoon weight in the dictionary')
  assert.equal(hint(null, 'agar-agar'), null)
  assert.equal(hint(0, 'agar-agar'), null)
})

test('the hint follows the scaled amount', () => {
  const row = { quantity: 4, unit: 'g', ingredient: 'agar-agar', name: 'Agar-agar' }
  const opts = { fromServings: 4, system: 'metric', lang: 'en' }
  assert.equal(formatScaledIngredient(row, { ...opts, toServings: 4 }).spoonHint, '(≈ 2 tsp)')
  assert.equal(formatScaledIngredient(row, { ...opts, toServings: 2 }).spoonHint, '(≈ 1 tsp)')
  assert.equal(formatScaledIngredient(row, { ...opts, toServings: 40 }).spoonHint, null)
})

test('shared recipe text carries the hint', () => {
  const text = recipeAsText({
    recipe: { title: 'Cheese', ingredients: [{ quantity: 4, unit: 'g', ingredient: 'agar-agar', name: 'Agar-agar' }] },
    lang: 'en',
    labels: { servings: 'Servings', ingredients: 'Ingredients', steps: 'Steps', notes: 'Notes' },
    url: null,
  })
  assert.match(text, /· 4 g \(≈ 2 tsp\) Agar-agar/)
})

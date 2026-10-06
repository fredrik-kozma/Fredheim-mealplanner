/* Removes the "salt and pepper, to taste" row from the Za'atar plate.
 *
 * It was the one ingredient with no amount — it rendered as a blank
 * quantity, could not be counted in the nutrition, and told the shopping
 * list to buy something nobody runs out of. Sumac stays: it has a real
 * teaspoon behind it and only sat outside the nutrition because the
 * reference data is thin.
 *
 * Step 4 still says to season to taste. That is ordinary recipe prose
 * and does not need a listed ingredient behind it — the row was the
 * problem, not the seasoning.
 *
 * Nutrition and serving weight are untouched by design: the row carried
 * no amount, so it contributed nothing to either.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'zaatar-hummus-salad')
if (!r) throw new Error('recipe not found')

const idx = r.ingredients.findIndex(i => /salt (and|og|och) pepp/i.test(i.name))
if (idx === -1) throw new Error('salt and pepper row not found — already removed?')
if (r.ingredients[idx].quantity != null) {
  throw new Error(`expected a quantity-less row, found ${r.ingredients[idx].quantity}`)
}

const before = r.ingredients.length
const lists = { en: r.ingredients, no: r.translations.no.ingredients, sv: r.translations.sv.ingredients }
for (const [lang, list] of Object.entries(lists)) {
  if (!/salt (and|og|och) pepp/i.test(list[idx]?.name || '')) {
    throw new Error(`${lang}[${idx}] is not the salt and pepper row: ${list[idx]?.name}`)
  }
  list.splice(idx, 1)
}

// Index alignment is the contract these lists live by.
for (const [lang, list] of Object.entries(lists)) {
  if (list.length !== r.ingredients.length) throw new Error(`${lang} length drifted`)
  list.forEach((ing, i) => {
    if (ing.quantity !== r.ingredients[i].quantity) throw new Error(`${lang}[${i}] quantity mismatch after splice`)
  })
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`ingredients ${before} -> ${r.ingredients.length} in all three languages`)
console.log(`sumac kept: ${r.ingredients.some(i => /sumac|sumak/i.test(i.name))}`)
console.log(`nutrition unchanged (${r.nutrition.perServing.calories} kcal), serving weight unchanged (${r.servingWeightGrams} g)`)
console.log(`Pack -> ${pack.version}`)

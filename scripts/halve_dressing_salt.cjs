/* "Lemon and Olive Oil Dressing": halve the salt, author's request —
 * it works well at half.
 *
 * 0.5 tsp -> 0.25 tsp across 3 servings. Sodium is scaled by the same
 * factor rather than recomputed from scratch, because in this recipe it
 * is essentially all salt: olive oil, lemon juice and a clove of garlic
 * together contribute on the order of 2 mg to the whole batch, well
 * inside the rounding on a 388 mg figure. Same reasoning as the oat milk
 * salt change. An estimate, like the rest of this pack's nutrition.
 *
 * Note for whoever reads the result: this recipe's nutrition sits in the
 * legacy flat shape, which NutritionPanel does not render, so the number
 * corrected here is not currently visible in the app. It is corrected
 * anyway — a stale figure left in the data is worse than a hidden one,
 * because the next person to migrate this recipe would carry it forward.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const ID = 'lemon-and-olive-oil-dressing'
const OLD_TSP = 0.5
const NEW_TSP = 0.25

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === ID)
if (!r) throw new Error(`${ID} not found`)

const idx = r.ingredients.findIndex(i => /salt/i.test(i.name))
if (idx === -1) throw new Error('salt ingredient not found')
if (r.ingredients[idx].quantity !== OLD_TSP) {
  throw new Error(`expected ${OLD_TSP} tsp salt, found ${r.ingredients[idx].quantity} — already halved?`)
}

// Index-matched across every language this recipe carries.
//
// The unit is compared as a teaspoon, not as the literal string "tsp":
// translated ingredient lists store the language's own spelling — "ts" in
// Norwegian, "tsk" in Swedish — all of which unitNormalizer maps back to
// tsp. Only the quantity is being changed here, so the spelling is left
// exactly as each language had it.
const TEASPOON = new Set(['tsp', 'ts', 'tsk', 'teskje', 'teaspoon', 'teaspoons'])
const lists = [r.ingredients, ...Object.values(r.translations || {}).map(t => t.ingredients).filter(Boolean)]
for (const list of lists) {
  const line = list[idx]
  if (line?.quantity !== OLD_TSP || !TEASPOON.has(String(line?.unit || '').toLowerCase())) {
    throw new Error(`salt line out of sync at index ${idx}: ${JSON.stringify(line)}`)
  }
  line.quantity = NEW_TSP
}

const ratio = NEW_TSP / OLD_TSP
const panels = [r.nutrition, r.nutritionPer100g].filter(Boolean)
const before = []
for (const p of panels) {
  if (typeof p.sodium !== 'number') continue
  before.push(p.sodium)
  p.sodium = Math.round(p.sodium * ratio)
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`${r.title}: salt ${OLD_TSP} tsp -> ${NEW_TSP} tsp (${lists.length} language lists)`)
console.log(`sodium ${before.join(' / ')} -> ${panels.map(p => p.sodium).join(' / ')} mg`)
console.log(`Pack -> ${pack.version}`)

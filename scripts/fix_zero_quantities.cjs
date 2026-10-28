/* Give the "quantity: 0" ingredient rows real amounts, approved by Fredrik.
 *
 * Every row is changed index-matched in en, no and sv. Only quantity (and,
 * for the olive oil, the unit) changes; names and notes stay as they are.
 *
 * Nutrition is updated for the two recipes where the new amount matters:
 *   - seasoned-baked-potatoes: 2 tbsp extra virgin olive oil = 27 g
 *     (USDA FDC 171413, per 100 g: 884 kcal, fat 100, sat 13.8, mono 73.0,
 *     poly 10.5, vit E 14.35 mg, vit K 60.2 µg)
 *   - potato-and-spinach-soup: 100 g raw spinach (USDA FDC 168462)
 * The added amounts go into the per-serving panel, totalWeight and
 * servingWeight grow by the added grams, and nutritionPer100g is
 * recomputed as (old batch amount + addition) / new batch weight. Fields that were 0 only
 * because the source didn't track them (omega-3, riboflavin, niacin,
 * choline, and the soup's vitamin E) are left at 0 — adding just one
 * ingredient's share would make them look complete when they aren't.
 * The salt, cinnamon, vanilla and garlic amounts are too small to matter.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')

// [recipe id, ingredient id, which occurrence of that id (0-based), new quantity, new units per language or null]
const CHANGES = [
  ['fr-70', 'salt', 1, 0.5, null],
  ['happy-beans-salad', 'garlic', 0, 1, null],
  ['pineapple-cream', 'vanilla-powder', 0, 0.5, null],
  ['potato-and-spinach-soup', 'spinach', 0, 100, null],
  ['rice-porridge', 'salt', 0, 0.25, null],
  ['rice-porridge', 'cinnamon-ground', 0, 0.5, null],
  ['rice-porridge', 'vanilla-powder', 0, 0.5, null],
  ['seasoned-baked-potatoes', 'olive-oil', 0, 2, { en: 'tbsp', no: 'ss', sv: 'tbsp' }],
]

// Whole-batch additions, per nutrient.
const ADDED = {
  'seasoned-baked-potatoes': {
    grams: 27,
    n: { calories: 238.7, totalFat: 27, saturatedFat: 3.73, monounsaturatedFat: 19.7, polyunsaturatedFat: 2.84, vitaminE: 3.87, vitaminK: 16.25 },
  },
  'potato-and-spinach-soup': {
    grams: 100,
    n: {
      calories: 23, protein: 2.86, totalFat: 0.39, saturatedFat: 0.063, polyunsaturatedFat: 0.165, monounsaturatedFat: 0.01,
      totalCarbs: 3.63, totalSugars: 0.42, fiber: 2.2, calcium: 99, potassium: 558, copper: 0.13, iron: 2.71,
      magnesium: 79, manganese: 0.897, selenium: 1, phosphorus: 49, zinc: 0.53, sodium: 79, vitaminA: 469,
      vitaminB6: 0.195, vitaminC: 28.1, vitaminK: 482.9, folate: 194, thiamin: 0.078,
    },
  },
}

// Same precision the panels already use: whole numbers from 10 up, one
// decimal from 1, two below.
const round = v => (v >= 10 ? Math.round(v) : v >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100)

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const find = id => {
  const r = pack.recipes.find(x => x.id === id)
  if (!r) throw new Error(`${id} not found`)
  return r
}

for (const [id, ing, nth, qty, units] of CHANGES) {
  const r = find(id)
  const lists = { en: r.ingredients, no: r.translations?.no?.ingredients, sv: r.translations?.sv?.ingredients }
  for (const [lang, list] of Object.entries(lists)) {
    if (!list) throw new Error(`${id}: no ${lang} ingredients`)
    const line = list.filter(x => x.ingredient === ing)[nth]
    if (!line || line.quantity !== 0) throw new Error(`${id}/${lang}: expected ${ing} #${nth} at 0, got ${JSON.stringify(line)}`)
    const old = `${line.quantity} ${line.unit}`
    line.quantity = qty
    if (units) line.unit = units[lang]
    console.log(`${id} [${lang}] ${line.name}: ${old} -> ${line.quantity} ${line.unit}`)
  }
}

for (const [id, add] of Object.entries(ADDED)) {
  const r = find(id)
  const before = JSON.stringify(r.nutrition)
  for (const [k, total] of Object.entries(add.n)) {
    if (typeof r.nutrition[k] !== 'number') throw new Error(`${id}: no nutrition.${k}`)
    r.nutrition[k] = round(r.nutrition[k] + total / r.servings)
  }
  const oldWeight = r.totalWeight
  r.totalWeight += add.grams
  r.servingWeight = Math.round(r.totalWeight / r.servings)
  // Old batch amount plus the addition, over the new batch weight — so the
  // nutrients that didn't change are diluted by the extra grams too.
  for (const [k, v] of Object.entries(r.nutritionPer100g)) {
    if (v === 0 && !add.n[k]) continue
    r.nutritionPer100g[k] = round(((v * oldWeight) / 100 + (add.n[k] || 0)) * 100 / r.totalWeight)
  }
  console.log(`\n${id}: totalWeight ${r.totalWeight} g, servingWeight ${r.servingWeight} g`)
  console.log(`  before ${before}`)
  console.log(`  after  ${JSON.stringify(r.nutrition)}`)
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log(`\nPack -> ${pack.version}`)

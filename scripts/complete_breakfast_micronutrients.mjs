// One-off: completes the nutrition of the eight savoury breakfasts added by
// scripts/add_savoury_breakfasts.cjs. That script calculated only the ten
// fields in scripts/data/food-composition-core.json; the rest of the
// collection also carries the fat split, omega-3/6, cholesterol, minerals
// and vitamins. This adds those, from the same ingredient rows and gram
// weights (rowGrams), with the per-100 g values below.
//
// Only missing fields are added: calories, macros, sugars, sodium and
// potassium stay as calculated (check-recipes and the labels use them).
//
// Usage: node scripts/complete_breakfast_micronutrients.mjs [--dry-run]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rowGrams } from './lib/recipeNutritionEstimate.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const DRY = process.argv.includes('--dry-run')

const IDS = [
  'savoury-oat-porridge', 'tofu-egg-salad-rye', 'smashed-beans-avocado-rye', 'nordic-baked-beans',
  'oven-pyttipanna-tofu', 'smorbrod-hummus', 'tofu-shakshuka', 'savoury-buckwheat-porridge',
]

// Field order as in the rest of the pack.
const ORDER = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat', 'omega3', 'omega6',
  'cholesterol', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber',
  'calcium', 'potassium', 'copper', 'iron', 'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc', 'sodium',
  'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'folate', 'thiamin', 'riboflavin', 'niacin', 'choline',
]

// Per 100 g, in the units of src/utils/nutritionData.js. Columns:
// mono, poly, omega3 (ALA), omega6 (LA) g · calcium, iron, magnesium,
// phosphorus, zinc, copper, manganese mg · selenium µg · vitamin A µg RAE ·
// C mg · D µg · E mg · K µg · thiamin, riboflavin, niacin, B6 mg ·
// folate µg DFE · B12 µg · choline mg. Cholesterol is 0 throughout (all
// plant foods). USDA FoodData Central (SR Legacy) unless noted.
const COLS = ['monounsaturatedFat', 'polyunsaturatedFat', 'omega3', 'omega6',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'zinc', 'copper', 'manganese', 'selenium',
  'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'thiamin', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'choline']
const MICRO = {
  'rolled-oats':        [2.18, 2.54, 0.11, 2.42, 54, 4.72, 177, 523, 3.97, 0.63, 4.92, 28.9, 0, 0, 0, 0.42, 2, 0.76, 0.14, 0.96, 0.12, 56, 0, 40],
  'mushrooms':          [0, 0.16, 0, 0.16, 3, 0.5, 9, 86, 0.52, 0.32, 0.05, 9.3, 0, 2.1, 0.2, 0.01, 0, 0.08, 0.4, 3.61, 0.1, 17, 0.04, 17],
  'spinach':            [0.01, 0.17, 0.14, 0.03, 99, 2.71, 79, 49, 0.53, 0.13, 0.9, 1, 469, 28.1, 0, 2.03, 483, 0.08, 0.19, 0.72, 0.2, 194, 0, 19],
  'onions':             [0.01, 0.02, 0, 0.01, 23, 0.21, 10, 29, 0.17, 0.04, 0.13, 0.5, 0, 7.4, 0, 0.02, 0.4, 0.05, 0.03, 0.12, 0.12, 19, 0, 6],
  'red-onions':         [0.01, 0.02, 0, 0.01, 23, 0.21, 10, 29, 0.17, 0.04, 0.13, 0.5, 0, 7.4, 0, 0.02, 0.4, 0.05, 0.03, 0.12, 0.12, 19, 0, 6],
  'garlic':             [0.01, 0.25, 0.02, 0.23, 181, 1.7, 25, 153, 1.16, 0.3, 1.67, 14.2, 0, 31.2, 0, 0.08, 1.7, 0.2, 0.11, 0.7, 1.24, 3, 0, 23],
  // Unfortified flakes (the composition table's basis): no B12.
  // Lallemand Engevita-type label values, rounded.
  'nutritional-yeast':  [0.5, 1.5, 0, 1.5, 30, 3, 140, 1000, 6, 0.4, 0.4, 20, 0, 0, 0, 0, 0, 8, 4, 35, 2.5, 1000, 0, 60],
  'black-pepper':       [0.74, 1, 0.15, 0.85, 443, 9.71, 171, 158, 1.19, 1.33, 12.75, 4.9, 27, 0, 0, 1.04, 164, 0.11, 0.18, 1.14, 0.29, 17, 0, 11],
  'chives':             [0.1, 0.27, 0.1, 0.17, 92, 1.6, 42, 58, 0.56, 0.16, 0.37, 0.9, 218, 58.1, 0, 0.21, 213, 0.08, 0.12, 0.65, 0.14, 105, 0, 5],
  'sunflower-seeds':    [18.53, 23.14, 0.06, 23.05, 78, 5.25, 325, 660, 5, 1.8, 1.95, 53, 3, 1.4, 0, 35.17, 0, 1.48, 0.36, 8.34, 1.35, 227, 0, 55],
  // Firm tofu, scaled to the table's 7 g fat; calcium as in
  // scripts/nutrition/ingredients.mjs (calcium-set).
  'tofu':               [1.5, 4, 0.45, 3.5, 350, 2.5, 60, 180, 1.4, 0.3, 1, 15, 0, 0, 0, 0.1, 2.4, 0.1, 0.08, 0.3, 0.08, 25, 0, 28],
  // Soy yoghurt, plain, fortified (Alpro natural label: Ca, D, B2, B12).
  'plant-yogurt':       [0.5, 1.3, 0.2, 1.1, 120, 0.4, 18, 60, 0.3, 0.1, 0.15, 1, 0, 0, 0.75, 0.3, 2, 0.04, 0.21, 0.2, 0.03, 10, 0.38, 10],
  'turmeric-ground':    [0.45, 0.76, 0.07, 0.69, 168, 55, 208, 299, 4.5, 1.3, 19.8, 6.2, 0, 0.7, 0, 4.43, 13.4, 0.06, 0.15, 1.35, 0.11, 20, 0, 49],
  'dill':               [0.8, 0.1, 0.01, 0.09, 208, 6.59, 55, 66, 0.91, 0.15, 1.26, 0, 386, 85, 0, 0, 0, 0.06, 0.3, 1.57, 0.19, 150, 0, 0],
  'lemon-juice':        [0.01, 0.02, 0, 0.01, 6, 0.08, 6, 8, 0.05, 0.02, 0.01, 0.1, 1, 38.7, 0, 0.15, 0, 0.02, 0.02, 0.09, 0.05, 20, 0, 5],
  // Nordic wholemeal/rye bread (grovbrød), Matvaretabellen-type values.
  'bread':              [0.6, 1.1, 0.1, 1, 40, 2.2, 60, 170, 1.5, 0.25, 1.5, 5, 0, 0, 0, 0.8, 2, 0.25, 0.1, 2, 0.15, 40, 0, 15],
  'cucumber':           [0.01, 0.03, 0.01, 0.03, 16, 0.28, 13, 24, 0.2, 0.04, 0.08, 0.3, 5, 2.8, 0, 0.03, 16.4, 0.03, 0.03, 0.1, 0.04, 7, 0, 6],
  'white-beans-canned': [0.05, 0.12, 0.07, 0.05, 73, 2.99, 51, 91, 1.17, 0.24, 0.4, 1.1, 0, 0, 0, 0.6, 2.5, 0.1, 0.04, 0.12, 0.1, 70, 0, 33],
  'avocados':           [9.8, 1.82, 0.11, 1.67, 12, 0.55, 29, 52, 0.64, 0.19, 0.14, 0.4, 7, 10, 0, 2.07, 21, 0.07, 0.13, 1.74, 0.26, 81, 0, 14],
  'tomatoes':           [0.03, 0.08, 0, 0.08, 10, 0.27, 11, 24, 0.17, 0.06, 0.11, 0, 42, 13.7, 0, 0.54, 7.9, 0.04, 0.02, 0.59, 0.08, 15, 0, 7],
  'chili-flakes':       [2.75, 8.37, 0.65, 7.7, 148, 7.8, 152, 293, 2.48, 0.37, 2, 8.8, 2081, 76.4, 0, 29.8, 80, 0.33, 0.92, 8.7, 2.45, 106, 0, 51],
  'parsley':            [0.3, 0.12, 0.01, 0.12, 138, 6.2, 50, 58, 1.07, 0.15, 0.16, 0.1, 421, 133, 0, 0.75, 1640, 0.09, 0.1, 1.31, 0.09, 152, 0, 13],
  'canned-tomatoes':    [0.04, 0.11, 0.01, 0.1, 33, 0.96, 11, 19, 0.14, 0.13, 0.11, 0.7, 20, 9, 0, 1.25, 2.6, 0.05, 0.05, 0.73, 0.11, 8, 0, 8],
  'tomato-puree':       [0.07, 0.2, 0.01, 0.18, 36, 2.98, 42, 83, 0.63, 0.37, 0.3, 5.3, 76, 21.9, 0, 4.3, 11.4, 0.06, 0.15, 3.08, 0.22, 12, 0, 39],
  'smoked-paprika':     [1.7, 7.77, 0.4, 7.3, 229, 21.14, 178, 314, 4.33, 0.71, 1.59, 6.3, 2463, 0.9, 0, 29.1, 80, 0.33, 1.23, 10.06, 2.14, 49, 0, 51],
  'paprika-powder':     [1.7, 7.77, 0.4, 7.3, 229, 21.14, 178, 314, 4.33, 0.71, 1.59, 6.3, 2463, 0.9, 0, 29.1, 80, 0.33, 1.23, 10.06, 2.14, 49, 0, 51],
  'thyme-dried':        [0.47, 1.19, 0.6, 0.5, 1890, 123.6, 220, 201, 6.18, 0.86, 7.87, 4.6, 190, 50, 0, 7.48, 1715, 0.51, 0.4, 4.94, 0.55, 274, 0, 44],
  'medjool-dates':      [0.04, 0.02, 0, 0.02, 64, 0.9, 54, 62, 0.44, 0.36, 0.3, 0, 7, 0, 0, 0.05, 2.7, 0.05, 0.06, 1.61, 0.25, 15, 0, 10],
  'potatoes':           [0, 0.04, 0.01, 0.03, 12, 0.81, 23, 57, 0.3, 0.11, 0.15, 0.4, 0, 19.7, 0, 0.01, 2, 0.08, 0.03, 1.06, 0.3, 15, 0, 12],
  'carrots':            [0.01, 0.12, 0, 0.12, 33, 0.3, 12, 35, 0.24, 0.05, 0.14, 0.1, 835, 5.9, 0, 0.66, 13.2, 0.07, 0.06, 0.98, 0.14, 19, 0, 9],
  // Cooked beetroot.
  'beetroot':           [0.04, 0.06, 0.01, 0.06, 16, 0.79, 23, 38, 0.35, 0.07, 0.33, 0.7, 2, 3.6, 0, 0.04, 0.2, 0.03, 0.04, 0.33, 0.07, 80, 0, 6],
  'radishes':           [0.02, 0.05, 0.03, 0.02, 25, 0.34, 10, 20, 0.28, 0.05, 0.07, 0.6, 0, 14.8, 0, 0, 1.3, 0.01, 0.04, 0.25, 0.07, 25, 0, 7],
  'bell-peppers':       [0, 0.07, 0.03, 0.04, 7, 0.43, 12, 26, 0.25, 0.02, 0.11, 0.1, 157, 127.7, 0, 1.58, 4.9, 0.05, 0.09, 0.98, 0.29, 46, 0, 6],
  'cumin-ground':       [14.04, 3.28, 0.18, 3.1, 931, 66.36, 366, 499, 4.8, 0.87, 3.33, 5.2, 64, 7.7, 0, 3.33, 5.4, 0.63, 0.33, 4.58, 0.44, 10, 0, 25],
  'buckwheat-groats':   [1.04, 1.04, 0.08, 0.96, 17, 2.47, 221, 319, 2.42, 0.63, 1.63, 8.3, 0, 0, 0, 0.32, 1.9, 0.22, 0.27, 5.14, 0.35, 42, 0, 54],
  // Frozen peas.
  'green-peas':         [0.04, 0.19, 0.02, 0.16, 24, 1.52, 22, 77, 0.7, 0.13, 0.33, 1, 104, 18, 0, 0.03, 24, 0.25, 0.1, 2.1, 0.13, 53, 0, 27],
  'leeks':              [0, 0.17, 0.1, 0.07, 59, 2.1, 28, 35, 0.12, 0.12, 0.48, 1, 83, 12, 0, 0.92, 47, 0.06, 0.03, 0.4, 0.23, 64, 0, 10],
  'pumpkin-seeds':      [16.24, 20.98, 0.12, 20.7, 46, 8.82, 592, 1233, 7.81, 1.34, 4.54, 9.4, 1, 1.9, 0, 2.18, 7.3, 0.27, 0.15, 4.99, 0.14, 58, 0, 63],
  'salt': null, 'black-salt': null, 'water': null,
}

function per100(id, pack) {
  if (id === 'classic-hummus') {
    // The pack's own Classic Hummus, per 100 g from its per-serving values.
    const h = pack.recipes.find(r => r.id === 'classic-hummus')
    const f = 100 / h.servingWeightGrams
    return Object.fromEntries(COLS.map(k => [k, (h.nutrition.perServing[k] || 0) * f]))
  }
  if (!(id in MICRO)) throw new Error(`no micronutrient values for ${id}`)
  const v = MICRO[id]
  return Object.fromEntries(COLS.map((k, i) => [k, v ? v[i] : 0]))
}

// As scripts/nutrition/calculate.mjs: whole numbers from 10, one decimal
// from 1, two below.
function round(x) {
  if (!x) return 0
  if (Math.abs(x) >= 10) return Math.round(x)
  if (Math.abs(x) >= 1) return Math.round(x * 10) / 10
  return Math.round(x * 100) / 100
}

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
let changed = 0
for (const id of IDS) {
  const r = pack.recipes.find(x => x.id === id)
  if (!r) throw new Error(`${id} not found`)
  const ps = r.nutrition.perServing
  const totals = Object.fromEntries(COLS.map(k => [k, 0]))
  for (const row of r.ingredients) {
    const { grams } = rowGrams(row)
    if (!grams) continue
    const v = per100(row.ingredient, pack)
    for (const k of COLS) totals[k] += v[k] * grams / 100
  }
  const add = { cholesterol: 0 }
  for (const k of COLS) add[k] = totals[k] / r.servings

  // The fat split comes from other tables than totalFat: keep it inside it.
  const room = Math.max(0, ps.totalFat - ps.saturatedFat)
  const split = add.monounsaturatedFat + add.polyunsaturatedFat
  if (split > room) {
    const f = room / split
    for (const k of ['monounsaturatedFat', 'polyunsaturatedFat', 'omega3', 'omega6']) add[k] *= f
  }

  const next = {}
  for (const k of ORDER) {
    if (ps[k] != null) next[k] = ps[k]
    else if (k in add) next[k] = round(add[k])
    else throw new Error(`${id}: nothing for ${k}`)
  }
  for (const k of Object.keys(ps)) if (!(k in next)) next[k] = ps[k]
  const added = Object.keys(next).filter(k => ps[k] == null)
  if (!added.length) continue
  r.nutrition.perServing = next
  changed++
  console.log(`${id}: +${added.length} fields · Ca ${next.calcium} mg · Fe ${next.iron} mg · Mg ${next.magnesium} mg · Zn ${next.zinc} mg · A ${next.vitaminA} µg · C ${next.vitaminC} mg · K ${next.vitaminK} µg · folate ${next.folate} µg · B12 ${next.vitaminB12} µg · mono/poly ${next.monounsaturatedFat}/${next.polyunsaturatedFat} g`)
}

if (!changed) {
  console.log('Nothing to add.')
} else if (DRY) {
  console.log('[dry-run] not written')
} else {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`${changed} recipes completed. Pack -> ${pack.version}`)
}

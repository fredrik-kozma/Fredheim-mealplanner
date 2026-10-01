/* Recalculates the carob & black bean mousse from its ingredients.
 *
 * The author's table did not reconcile with what is in the bowl. Its
 * headline figures were close on calories but wrong in composition: 24.6 g
 * of total fat for the batch, of which 13.4 g monounsaturated, in a recipe
 * whose only fat sources are black beans (0.5%), carob flour (0.65%) and
 * 130 ml of plant milk. Those three cannot produce more than about 4 g
 * between them. The same table put carbohydrate at 122 g when the dates,
 * carob and syrup alone come to 120 g before the beans are counted.
 *
 * Everything below is summed from USDA per-100g reference values against
 * the actual amounts, then divided by 4. Written out in full rather than
 * hidden behind a lookup so the arithmetic can be checked line by line.
 *
 * Assumptions worth naming, because they move the answer:
 *  - Plant milk is taken as unsweetened, unfortified oat milk. The recipe
 *    says "oat or cashew"; oat is the leaner reading, and unfortified
 *    keeps calcium and B12 honest rather than borrowing a brand's
 *    additions. A fortified milk would add roughly 150 mg calcium.
 *  - A pinch of salt is 0.4 g.
 *  - Maple syrup at 1.32 g/ml, so 45 ml is 59.4 g.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const SERVINGS = 4

// USDA per-100 g (or per-100 ml for the milk). Zeros are real zeros.
const REF = {
  blackBeans: { // cooked, boiled, no salt
    calories: 132, protein: 8.86, totalFat: 0.54, saturatedFat: 0.139,
    polyunsaturatedFat: 0.231, monounsaturatedFat: 0.047, omega3: 0.071, omega6: 0.160,
    cholesterol: 0, totalCarbs: 23.71, totalSugars: 0.32, fiber: 8.7,
    calcium: 27, potassium: 355, copper: 0.209, iron: 2.10, magnesium: 70,
    manganese: 0.444, selenium: 1.2, phosphorus: 140, zinc: 1.12, sodium: 1,
    vitaminA: 0, vitaminB6: 0.069, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0.87, vitaminK: 3.3, folate: 149, thiamin: 0.244, riboflavin: 0.059,
    niacin: 0.505, choline: 32.7,
  },
  dates: { // Deglet Noor, pitted
    calories: 282, protein: 2.45, totalFat: 0.39, saturatedFat: 0.032,
    polyunsaturatedFat: 0.019, monounsaturatedFat: 0.036, omega3: 0.002, omega6: 0.017,
    cholesterol: 0, totalCarbs: 75.03, totalSugars: 63.35, fiber: 8.0,
    calcium: 39, potassium: 656, copper: 0.206, iron: 1.02, magnesium: 43,
    manganese: 0.262, selenium: 3.0, phosphorus: 62, zinc: 0.29, sodium: 2,
    vitaminA: 0.5, vitaminB6: 0.165, vitaminB12: 0, vitaminC: 0.4, vitaminD: 0,
    vitaminE: 0.05, vitaminK: 2.7, folate: 19, thiamin: 0.052, riboflavin: 0.066,
    niacin: 1.274, choline: 6.3,
  },
  carob: { // carob flour
    calories: 222, protein: 4.62, totalFat: 0.65, saturatedFat: 0.053,
    polyunsaturatedFat: 0.264, monounsaturatedFat: 0.228, omega3: 0.024, omega6: 0.240,
    cholesterol: 0, totalCarbs: 88.88, totalSugars: 49.08, fiber: 39.8,
    calcium: 348, potassium: 827, copper: 0.572, iron: 2.94, magnesium: 54,
    manganese: 0.509, selenium: 5.3, phosphorus: 79, zinc: 0.92, sodium: 35,
    vitaminA: 1, vitaminB6: 0.366, vitaminB12: 0, vitaminC: 0.2, vitaminD: 0,
    vitaminE: 0.63, vitaminK: 0, folate: 29, thiamin: 0.053, riboflavin: 0.461,
    niacin: 1.897, choline: 11.9,
  },
  oatMilk: { // unsweetened, unfortified, per 100 ml
    calories: 45, protein: 1.0, totalFat: 1.5, saturatedFat: 0.2,
    polyunsaturatedFat: 0.55, monounsaturatedFat: 0.65, omega3: 0.04, omega6: 0.50,
    cholesterol: 0, totalCarbs: 6.6, totalSugars: 2.5, fiber: 0.8,
    calcium: 12, potassium: 40, copper: 0.03, iron: 0.2, magnesium: 6,
    manganese: 0.3, selenium: 1.0, phosphorus: 30, zinc: 0.2, sodium: 40,
    vitaminA: 0, vitaminB6: 0.01, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0.1, vitaminK: 0.3, folate: 3, thiamin: 0.03, riboflavin: 0.02,
    niacin: 0.2, choline: 5,
  },
  mapleSyrup: {
    calories: 260, protein: 0.04, totalFat: 0.06, saturatedFat: 0.007,
    polyunsaturatedFat: 0.01, monounsaturatedFat: 0.02, omega3: 0, omega6: 0.01,
    cholesterol: 0, totalCarbs: 67.04, totalSugars: 60.46, fiber: 0,
    calcium: 102, potassium: 212, copper: 0.019, iron: 0.11, magnesium: 21,
    manganese: 2.908, selenium: 0.6, phosphorus: 2, zinc: 1.47, sodium: 12,
    vitaminA: 0, vitaminB6: 0.002, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0, vitaminK: 0, folate: 0, thiamin: 0.006, riboflavin: 1.27,
    niacin: 0.081, choline: 1.6,
  },
  vanillaExtract: {
    calories: 288, protein: 0.06, totalFat: 0.06, saturatedFat: 0.01,
    polyunsaturatedFat: 0, monounsaturatedFat: 0.01, omega3: 0, omega6: 0,
    cholesterol: 0, totalCarbs: 12.65, totalSugars: 12.65, fiber: 0,
    calcium: 11, potassium: 148, copper: 0.072, iron: 0.12, magnesium: 12,
    manganese: 0.23, selenium: 0.2, phosphorus: 6, zinc: 0.11, sodium: 9,
    vitaminA: 0, vitaminB6: 0.026, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0, vitaminK: 0, folate: 0, thiamin: 0.011, riboflavin: 0.095,
    niacin: 0.425, choline: 0,
  },
}

// amount in g (or ml for the milk), as the recipe lists them
const BATCH = [
  ['blackBeans', 250],
  ['dates', 60],
  ['carob', 40],
  ['oatMilk', 130],
  ['mapleSyrup', 45 * 1.32],
  ['vanillaExtract', 1 * 4.2],
]
const SALT_G = 0.4
const SODIUM_PER_G_SALT = 393

const FIELDS = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat',
  'monounsaturatedFat', 'omega3', 'omega6', 'cholesterol', 'totalCarbs',
  'totalSugars', 'addedSugar', 'fiber', 'calcium', 'potassium', 'copper',
  'iron', 'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc',
  'sodium', 'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD',
  'vitaminE', 'vitaminK', 'folate', 'thiamin', 'riboflavin', 'niacin', 'choline',
]

const batchTotals = Object.fromEntries(FIELDS.map(f => [f, 0]))
let batchWeight = 0
for (const [key, grams] of BATCH) {
  batchWeight += grams
  const ref = REF[key]
  for (const f of FIELDS) {
    if (f === 'addedSugar') continue
    batchTotals[f] += (ref[f] || 0) * grams / 100
  }
}
batchWeight += SALT_G
batchTotals.sodium += SALT_G * SODIUM_PER_G_SALT
// Added sugar is the syrup's sugar only. Dates are whole fruit blended
// into the dish, which is not added sugar — the same call every other
// date-sweetened recipe in these packs already makes.
batchTotals.addedSugar = REF.mapleSyrup.totalSugars * (45 * 1.32) / 100

// Sensible precision: 2 decimals under 1, 1 decimal under 10, whole above.
function tidy(v) {
  const a = Math.abs(v)
  if (a === 0) return 0
  if (a < 1) return Math.round(v * 100) / 100
  if (a < 10) return Math.round(v * 10) / 10
  return Math.round(v)
}

const perServing = {}
for (const f of FIELDS) perServing[f] = tidy(batchTotals[f] / SERVINGS)

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'carob-black-bean-mousse')
if (!r) throw new Error('recipe not found')

const before = r.nutrition.perServing
const servingWeight = Math.round(batchWeight / SERVINGS)

console.log(`batch weight ${Math.round(batchWeight)} g -> ${servingWeight} g a serving`)
console.log('field            author   recalculated')
for (const f of ['calories', 'protein', 'totalFat', 'monounsaturatedFat', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber', 'sodium', 'potassium', 'calcium', 'iron']) {
  console.log('  ' + f.padEnd(20) + String(before[f]).padStart(7) + String(perServing[f]).padStart(14))
}

r.nutrition = { perServing }
r.kcal = Math.round(perServing.calories)
r.servingWeightGrams = servingWeight

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log(`Pack -> ${pack.version}`)

/* Hirseknekkebrød (millet crispbread) — three fixes.
 *
 *  1. Drop the coconut milk (author's request).
 *  2. Rewrite step 1 so the "900 g cooked porridge" shortcut scales. It was
 *     a hardcoded number followed by "multiply the amount with how many
 *     times you do the recipe" — the app does that itself now, so the value
 *     is marked {{900 g}} and scaleStepText keeps it in step with the
 *     serving count.
 *  3. Compute nutrition properly and store it as nutrition.perServing, the
 *     only shape NutritionPanel reads. The recipe carried a legacy flat
 *     `nutrition` block plus nutritionPer100g/totalWeight/servingWeight,
 *     none of which any code reads — so the app showed nothing for it.
 *
 * Serving model follows the pack's own convention for baked goods (orn-17
 * Bread Rolls: servings = 8 = the rolls it makes): servings = the pieces
 * this makes, with nutrition given per piece.
 *
 * Yield corrected from the "1/11 of the dough" the steps used to say. At
 * the stated 0.5-1 cm thickness this batch of dough covers ~1970 cm2 —
 * about two full baking trays, not eleven. Eleven would mean a 13x14 cm
 * patch per tray and 2.3 g crackers; two trays give 18 squares each, 36
 * pieces at ~13 g, which is a normal crispbread. Confirmed with the author.
 *
 * Values are per 100 g edible portion, USDA SR Legacy / FoodData Central.
 */
const fs = require('fs')
const path = require('path')

// [key]: { per100g nutrients }
const FOOD = {
  millet: { // 20031 millet, raw
    calories: 378, protein: 11.02, totalFat: 4.22, saturatedFat: 0.723,
    polyunsaturatedFat: 2.134, monounsaturatedFat: 0.773, omega3: 0.119, omega6: 2.015,
    cholesterol: 0, totalCarbs: 72.85, totalSugars: 0, addedSugar: 0, fiber: 8.5,
    calcium: 8, potassium: 195, copper: 0.75, iron: 3.01, magnesium: 114,
    manganese: 1.632, selenium: 2.7, phosphorus: 285, zinc: 1.68, sodium: 5,
    vitaminA: 0, vitaminB6: 0.384, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0.05, vitaminK: 0.9, folate: 85, thiamin: 0.421, riboflavin: 0.29,
    niacin: 4.72, choline: 24.6, moisture: 8.67,
  },
  almonds: { // 12061 almonds, raw
    calories: 579, protein: 21.15, totalFat: 49.93, saturatedFat: 3.802,
    polyunsaturatedFat: 12.322, monounsaturatedFat: 31.551, omega3: 0.003, omega6: 12.32,
    cholesterol: 0, totalCarbs: 21.55, totalSugars: 4.35, addedSugar: 0, fiber: 12.5,
    calcium: 269, potassium: 733, copper: 1.031, iron: 3.71, magnesium: 270,
    manganese: 2.179, selenium: 4.1, phosphorus: 481, zinc: 3.12, sodium: 1,
    vitaminA: 0, vitaminB6: 0.137, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 25.63, vitaminK: 0, folate: 44, thiamin: 0.205, riboflavin: 1.138,
    niacin: 3.618, choline: 52.1, moisture: 4.41,
  },
  sesame: { // 12023 sesame seeds, whole, dried
    calories: 573, protein: 17.73, totalFat: 49.67, saturatedFat: 6.957,
    polyunsaturatedFat: 21.773, monounsaturatedFat: 18.759, omega3: 0.376, omega6: 21.375,
    cholesterol: 0, totalCarbs: 23.45, totalSugars: 0.3, addedSugar: 0, fiber: 11.8,
    calcium: 975, potassium: 468, copper: 4.082, iron: 14.55, magnesium: 351,
    manganese: 2.46, selenium: 34.4, phosphorus: 629, zinc: 7.75, sodium: 11,
    vitaminA: 0.5, vitaminB6: 0.79, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0.25, vitaminK: 0, folate: 97, thiamin: 0.791, riboflavin: 0.247,
    niacin: 4.515, choline: 25.6, moisture: 4.69,
  },
  sunflower: { // 12036 sunflower seed kernels, dried
    calories: 584, protein: 20.78, totalFat: 51.46, saturatedFat: 4.455,
    polyunsaturatedFat: 23.137, monounsaturatedFat: 18.528, omega3: 0.074, omega6: 23.05,
    cholesterol: 0, totalCarbs: 20, totalSugars: 2.62, addedSugar: 0, fiber: 8.6,
    calcium: 78, potassium: 645, copper: 1.8, iron: 5.25, magnesium: 325,
    manganese: 1.95, selenium: 53, phosphorus: 660, zinc: 5, sodium: 9,
    vitaminA: 3, vitaminB6: 1.345, vitaminB12: 0, vitaminC: 1.4, vitaminD: 0,
    vitaminE: 35.17, vitaminK: 0, folate: 227, thiamin: 1.48, riboflavin: 0.355,
    niacin: 8.335, choline: 55.1, moisture: 4.73,
  },
  pumpkin: { // 12016 pumpkin/squash seed kernels, raw
    calories: 559, protein: 30.23, totalFat: 49.05, saturatedFat: 8.674,
    polyunsaturatedFat: 20.976, monounsaturatedFat: 16.242, omega3: 0.12, omega6: 20.7,
    cholesterol: 0, totalCarbs: 10.71, totalSugars: 1.4, addedSugar: 0, fiber: 6,
    calcium: 46, potassium: 809, copper: 1.343, iron: 8.82, magnesium: 592,
    manganese: 4.543, selenium: 9.4, phosphorus: 1233, zinc: 7.81, sodium: 7,
    vitaminA: 1, vitaminB6: 0.143, vitaminB12: 0, vitaminC: 1.9, vitaminD: 0,
    vitaminE: 2.18, vitaminK: 7.3, folate: 58, thiamin: 0.273, riboflavin: 0.153,
    niacin: 4.987, choline: 63, moisture: 5.23,
  },
  garlicPowder: { // 02020 garlic powder
    calories: 331, protein: 16.55, totalFat: 0.73, saturatedFat: 0.249,
    polyunsaturatedFat: 0.376, monounsaturatedFat: 0.111, omega3: 0.02, omega6: 0.356,
    cholesterol: 0, totalCarbs: 72.73, totalSugars: 2.43, addedSugar: 0, fiber: 9,
    calcium: 79, potassium: 1193, copper: 0.53, iron: 5.65, magnesium: 77,
    manganese: 0.86, selenium: 23.9, phosphorus: 414, zinc: 2.99, sodium: 60,
    vitaminA: 0, vitaminB6: 1.235, vitaminB12: 0, vitaminC: 1.2, vitaminD: 0,
    vitaminE: 0.73, vitaminK: 0.4, folate: 47, thiamin: 0.435, riboflavin: 0.141,
    niacin: 0.796, choline: 67.5, moisture: 6.45,
  },
  psyllium: { // psyllium husk — almost entirely insoluble fibre
    calories: 200, protein: 1.5, totalFat: 0.5, saturatedFat: 0.1,
    polyunsaturatedFat: 0.2, monounsaturatedFat: 0.1, omega3: 0, omega6: 0.2,
    cholesterol: 0, totalCarbs: 88, totalSugars: 0, addedSugar: 0, fiber: 80,
    calcium: 100, potassium: 200, copper: 0.05, iron: 1.5, magnesium: 15,
    manganese: 0.3, selenium: 0, phosphorus: 20, zinc: 0.5, sodium: 35,
    vitaminA: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0, vitaminK: 0, folate: 0, thiamin: 0, riboflavin: 0,
    niacin: 0, choline: 0, moisture: 5,
  },
  seaSalt: { // NaCl — 39.34% sodium by mass
    calories: 0, protein: 0, totalFat: 0, saturatedFat: 0,
    polyunsaturatedFat: 0, monounsaturatedFat: 0, omega3: 0, omega6: 0,
    cholesterol: 0, totalCarbs: 0, totalSugars: 0, addedSugar: 0, fiber: 0,
    calcium: 24, potassium: 8, copper: 0, iron: 0.33, magnesium: 1,
    manganese: 0, selenium: 0, phosphorus: 0, zinc: 0.1, sodium: 38758,
    vitaminA: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0, vitaminK: 0, folate: 0, thiamin: 0, riboflavin: 0,
    niacin: 0, choline: 0, moisture: 0,
  },
  thyme: { // 02049 thyme, dried
    calories: 276, protein: 9.11, totalFat: 7.43, saturatedFat: 2.73,
    polyunsaturatedFat: 1.19, monounsaturatedFat: 0.47, omega3: 0.4, omega6: 0.79,
    cholesterol: 0, totalCarbs: 63.94, totalSugars: 1.71, addedSugar: 0, fiber: 37,
    calcium: 1890, potassium: 814, copper: 0.86, iron: 123.6, magnesium: 220,
    manganese: 7.867, selenium: 4.6, phosphorus: 201, zinc: 6.18, sodium: 55,
    vitaminA: 190, vitaminB6: 0.55, vitaminB12: 0, vitaminC: 50, vitaminD: 0,
    vitaminE: 7.48, vitaminK: 1714.5, folate: 274, thiamin: 0.513, riboflavin: 0.399,
    niacin: 4.94, choline: 43.6, moisture: 7.79,
  },
}

// Grams in the batch. Volume conversions: 3 dl whole almonds ~ 175 g
// (1 dl ~ 58 g); 1 tbsp garlic powder ~ 8.5 g; 1 tsp psyllium husk ~ 3 g;
// 1 tsp fine sea salt ~ 6 g; 1 tsp dried thyme ~ 1 g.
const BATCH = {
  millet: 175,
  almonds: 175,
  sesame: 33,
  sunflower: 33,
  pumpkin: 33,
  garlicPowder: 17,
  psyllium: 3,
  seaSalt: 4.5,
  thyme: 1,
}
// 1 L water carries no nutrients and all but a trace bakes off.
const ADDED_WATER = 1000
const TRAYS = 2
const PER_TRAY = 18         // step 7: 2 cuts short side x 5 long = 3 x 6
const PIECES = TRAYS * PER_TRAY
const FINAL_MOISTURE = 0.04 // baked "dry and cooked all the way through"

const KEYS = Object.keys(FOOD.millet).filter(k => k !== 'moisture')

const total = {}
for (const k of KEYS) total[k] = 0
let solids = 0
for (const [food, grams] of Object.entries(BATCH)) {
  const f = FOOD[food]
  for (const k of KEYS) total[k] += (f[k] || 0) * grams / 100
  solids += grams * (1 - (f.moisture || 0) / 100)
}
const bakedWeight = solids / (1 - FINAL_MOISTURE)
const perPiece = {}
for (const k of KEYS) {
  const v = total[k] / PIECES
  // Keep a sensible number of decimals: whole numbers for mg/µg-scale
  // minerals and vitamins, two decimals for the gram-scale macros.
  perPiece[k] = v >= 10 ? Math.round(v) : Math.round(v * 100) / 100
}
const pieceWeight = Math.round((bakedWeight / PIECES) * 10) / 10

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'millet-crackers-hirseknekk')
if (!r) throw new Error('recipe not found')

// ── 1. drop the coconut milk, both languages ──────────────────────────────
const isCoconut = (i) => /coconut milk|kokosmelk/i.test(i.name || '')
const beforeEn = r.ingredients.length
r.ingredients = r.ingredients.filter(i => !isCoconut(i))
const beforeNo = r.translations.no.ingredients.length
r.translations.no.ingredients = r.translations.no.ingredients.filter(i => !isCoconut(i))

// ── 2. make the porridge shortcut scale ───────────────────────────────────
r.steps[0] = 'Cook the millet with 3/4 of the water into a thick porridge — at least forty minutes, until cooked all the way through. (If you already have cooked millet porridge on hand, use {{900 g}} of it instead and go straight to the next step.)'
r.translations.no.steps[0] = 'Kok hirsen med 3/4 av vannet til en tykk grøt — minst førti minutter, til den er gjennomkokt. (Har du ferdigkokt hirsegrøt fra før, bruk {{900 g}} av den i stedet og gå rett videre til neste trinn.)'

// Step 6 said "1/11 part of the dough" — see the yield note at the top.
r.steps[5] = 'Line the baking trays with baking paper. Spread half the dough onto each of two trays: put a sheet of plastic wrap over the dough and use a rolling pin to roll it out between the baking paper and the wrap, to an even layer about 0.5–1 cm thick. Peel the wrap off (the same sheet does both trays).'
r.translations.no.steps[5] = 'Kle stekebrettene med bakepapir. Fordel halve deigen på hvert av to brett: legg plastfolie oppå deigen og bruk en kjevle til å kjevle den ut mellom bakepapiret og folien, til et jevnt lag på ca. 0,5–1 cm. Dra av folien (den samme folien holder til begge brettene).'

// Step 7 counts squares per tray — spell that out now that the tray count
// is explicit, so 18 doesn't read as the whole batch.
r.steps[6] = 'Cut the dough with a pizza wheel (or a large knife): twice across the short side and five times along the long side, giving 18 equal squares per tray — 36 crackers in all.'
r.translations.no.steps[6] = 'Skjær deigen med pizzakutter (eller stor kniv): to ganger på kortsiden og fem ganger på langsiden, slik at du får 18 like store ruter per brett — 36 knekkebrød til sammen.'

// ── 3. nutrition in the shape the app actually reads ──────────────────────
r.servings = PIECES
r.kcal = Math.round(perPiece.calories)
r.servingWeightGrams = pieceWeight
r.nutrition = { perServing: perPiece }
delete r.nutritionPer100g
delete r.totalWeight
delete r.servingWeight

// Times were both null, which also kept it out of the new "quickest first"
// sort. Step 1 says at least 40 min for the porridge, step 8 at least 3 h
// in the oven; the rest is hands-on blending, mixing, rolling and cutting.
r.prepTime = 30
r.cookTime = 220

pack.version = '1.13.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log('coconut milk removed — EN ingredients', beforeEn, '->', r.ingredients.length,
  '| NO', beforeNo, '->', r.translations.no.ingredients.length)
console.log('batch raw weight (incl. water):', Math.round(Object.values(BATCH).reduce((a, b) => a + b, 0) + ADDED_WATER), 'g')
console.log('dry solids:', Math.round(solids), 'g   -> baked weight:', Math.round(bakedWeight), 'g')
console.log('pieces:', PIECES, '  per piece:', pieceWeight, 'g,', r.kcal, 'kcal')
console.log('per 100 g baked:', Math.round(total.calories / bakedWeight * 100), 'kcal,',
  (total.protein / bakedWeight * 100).toFixed(1), 'g protein,',
  (total.fiber / bakedWeight * 100).toFixed(1), 'g fibre,',
  Math.round(total.sodium / bakedWeight * 100), 'mg sodium')
console.log('whole batch:', Math.round(total.calories), 'kcal,', Math.round(total.protein), 'g protein,',
  Math.round(total.fiber), 'g fibre,', Math.round(total.calcium), 'mg calcium,', Math.round(total.iron), 'mg iron')
console.log('pack ->', pack.version)

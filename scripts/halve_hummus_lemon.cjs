/* Lemony Chickpea Hummus: halve the lemon juice — it was too sour.
 *
 * 100 ml -> 50 ml. The nutrition was the author's own table, computed
 * with the full 100 ml, so the removed half has to come back out of it
 * rather than being left to overstate the vitamin C and potassium.
 * 50 ml of lemon juice at 1.03 g/ml is 51.5 g off a four-serving batch,
 * or 12.9 g a serving, and every field moves by that much of the USDA
 * per-100g figures. The serving weight drops with it.
 *
 * The description called it "very lemony", which at half the juice it no
 * longer is. Softened in all three languages — it is still a lemon-
 * forward hummus (50 ml on 400 g of chickpeas is well above the 30 ml
 * the red pepper version uses), just no longer sharp enough to wince at.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const SERVINGS = 4
const OLD_ML = 100
const NEW_ML = 50
const DENSITY = 1.03

// USDA, lemon juice raw, per 100 g.
const LEMON = {
  calories: 22, protein: 0.35, totalFat: 0.24, saturatedFat: 0.04,
  polyunsaturatedFat: 0.07, monounsaturatedFat: 0.01, omega3: 0.01, omega6: 0.06,
  totalCarbs: 6.9, totalSugars: 2.52, fiber: 0.3, calcium: 6, potassium: 124,
  copper: 0.016, iron: 0.08, magnesium: 6, manganese: 0.012, selenium: 0.1,
  phosphorus: 8, zinc: 0.05, sodium: 1, vitaminA: 0, vitaminB6: 0.046,
  vitaminC: 38.7, vitaminE: 0.15, vitaminK: 0, folate: 20, thiamin: 0.024,
  riboflavin: 0.015, niacin: 0.091, choline: 5.1,
}

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'lemony-chickpea-hummus')
if (!r) throw new Error('recipe not found')

const idx = r.ingredients.findIndex(i => /lemon juice|sitronsaft|citronjuice/i.test(i.name))
if (idx === -1) throw new Error('lemon juice line not found')
if (r.ingredients[idx].quantity !== OLD_ML) {
  throw new Error(`expected ${OLD_ML} ml, found ${r.ingredients[idx].quantity} — already halved?`)
}

const lists = { en: r.ingredients, no: r.translations.no.ingredients, sv: r.translations.sv.ingredients }
for (const [lang, list] of Object.entries(lists)) {
  if (list[idx].quantity !== OLD_ML) throw new Error(`${lang} lemon line out of sync`)
  list[idx].quantity = NEW_ML
}

// Take the removed juice back out of the per-serving figures.
const removedPerServing = (OLD_ML - NEW_ML) * DENSITY / SERVINGS   // grams
const per = r.nutrition.perServing
const before = { calories: per.calories, vitaminC: per.vitaminC, potassium: per.potassium, totalCarbs: per.totalCarbs }
function tidy(v) {
  const a = Math.abs(v)
  if (a === 0) return 0
  if (a < 1) return Math.round(v * 100) / 100
  if (a < 10) return Math.round(v * 10) / 10
  return Math.round(v)
}
for (const [field, per100] of Object.entries(LEMON)) {
  if (per[field] === undefined) continue
  const next = per[field] - per100 * removedPerServing / 100
  per[field] = tidy(Math.max(0, next))
}
r.kcal = Math.round(per.calories)
r.servingWeightGrams = Math.round(r.servingWeightGrams - removedPerServing)

// "very lemony" is no longer true at half the juice.
const DESC = {
  en: 'Creamy, bright and lemon-forward. No tahini, nuts, sesame, soy, gluten or dairy.',
  no: 'Kremet, frisk og med tydelig sitronsmak. Uten tahini, nøtter, sesam, soya, gluten eller melk.',
  sv: 'Krämig, fräsch och med tydlig citronsmak. Utan tahini, nötter, sesam, soja, gluten eller mjölk.',
}
r.description = DESC.en
r.translations.no.description = DESC.no
r.translations.sv.description = DESC.sv

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`lemon juice ${OLD_ML} ml -> ${NEW_ML} ml (all three languages)`)
console.log(`per serving: ${before.calories} -> ${per.calories} kcal | vit C ${before.vitaminC} -> ${per.vitaminC} mg | potassium ${before.potassium} -> ${per.potassium} mg | carbs ${before.totalCarbs} -> ${per.totalCarbs} g`)
console.log(`serving weight -> ${r.servingWeightGrams} g`)
console.log(`Pack -> ${pack.version}`)

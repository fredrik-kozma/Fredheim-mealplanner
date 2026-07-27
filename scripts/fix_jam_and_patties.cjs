/* Two user-requested recipe corrections:

   1. fr-60 "Dried Fruit Jam" — dried fruit measured by volume (dl/l) is
      imprecise and awkward, so ingredients are re-expressed in grams using
      standard dried-fruit densities. Also fixes "Apricot, raw" → dried
      (the recipe is a dried-fruit jam; raw was simply wrong).
      Water stays in litres: it is a liquid, where volume is the natural
      measure, and 1 l = 1000 g anyway.

   2. orn-20 "Walnut Patties" — drop the panko breadcrumbs (not needed; the
      flax egg and mashed cannellini beans already bind). Nutrition is
      recalculated by subtracting panko's contribution, and the step text
      that referenced it is rewritten in EN/NO/SV.
*/
const fs = require('fs')
const path = require('path')

// ── 1. Dried Fruit Jam ────────────────────────────────────────────────────
// g per dl, from standard cup weights (1 cup = 2.366 dl):
//   dates chopped 147 g/cup → 62 · apricot halves 130 → 55 · raisins 155 → 65
//   figs chopped 149 → 63   · prunes pitted 174 → 74
const JAM_INGREDIENTS = {
  en: [
    { quantity: 150, unit: 'g', name: 'Dates, dried' },
    { quantity: 140, unit: 'g', name: 'Apricots, dried' },
    { quantity: 650, unit: 'g', name: 'Raisins' },
    { quantity: 300, unit: 'g', name: 'Figs, dried' },
    { quantity: 350, unit: 'g', name: 'Prunes' },
    { quantity: 2, unit: 'l', name: 'Water, drinking water' },
  ],
  no: [
    { quantity: 150, unit: 'g', name: 'Dadler, tørkede' },
    { quantity: 140, unit: 'g', name: 'Aprikoser, tørkede' },
    { quantity: 650, unit: 'g', name: 'Rosiner' },
    { quantity: 300, unit: 'g', name: 'Fikener, tørkede' },
    { quantity: 350, unit: 'g', name: 'Svisker' },
    { quantity: 2, unit: 'l', name: 'Vann, drikkevann' },
  ],
}

const PICS = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pics = JSON.parse(fs.readFileSync(PICS, 'utf8'))
const jam = pics.recipes.find(r => r.id === 'fr-60')
if (!jam) throw new Error('fr-60 not found')

jam.ingredients = JAM_INGREDIENTS.en
if (jam.translations?.no) jam.translations.no.ingredients = JAM_INGREDIENTS.no
// Total weight of the finished jam: dried fruit + water.
const driedFruitG = JAM_INGREDIENTS.en
  .filter(i => i.unit === 'g')
  .reduce((sum, i) => sum + i.quantity, 0)
jam.totalWeight = driedFruitG + 2000
pics.version = '1.10.1'
fs.writeFileSync(PICS, JSON.stringify(pics, null, 2) + '\n', 'utf8')
console.log('fr-60 Dried Fruit Jam → grams; dried fruit', driedFruitG, 'g + 2 l water =', jam.totalWeight, 'g total')
console.log('  apricots now:', jam.ingredients[1].name, '/', jam.translations.no.ingredients[1].name)

// ── 2. Walnut Patties — remove panko ──────────────────────────────────────
// Plain panko per 100 g (typical composition; brands vary slightly).
const PANKO_PER_100G = {
  calories: 366, protein: 12.0, totalFat: 2.5, saturatedFat: 0.5,
  polyunsaturatedFat: 1.0, monounsaturatedFat: 0.4, omega3: 0.02, omega6: 0.95,
  cholesterol: 0, totalCarbs: 72.0, totalSugars: 3.0, addedSugar: 0, fiber: 4.0,
  calcium: 40, potassium: 150, copper: 0.15, iron: 3.0, magnesium: 30,
  manganese: 0.6, selenium: 20, phosphorus: 110, zinc: 0.9, sodium: 500,
  vitaminA: 0, vitaminB6: 0.1, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
  vitaminE: 0.3, vitaminK: 1, folate: 90, thiamin: 0.5, riboflavin: 0.3,
  niacin: 4.5, choline: 12,
}
const PANKO_TOTAL_G = 60
const SERVINGS = 4
const perServingG = PANKO_TOTAL_G / SERVINGS   // 15 g

const REV = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const rev = JSON.parse(fs.readFileSync(REV, 'utf8'))
const pat = rev.recipes.find(r => r.id === 'orn-20')
if (!pat) throw new Error('orn-20 not found')

const isPanko = (n) => /panko/i.test(n)
pat.ingredients = pat.ingredients.filter(i => !isPanko(i.name))
for (const lang of ['no', 'sv']) {
  if (pat.translations?.[lang]) {
    pat.translations[lang].ingredients = pat.translations[lang].ingredients.filter(i => !isPanko(i.name))
  }
}

// Rewrite the one step that named panko (it also described panko hydrating).
const STEP6 = {
  en: 'Combine the toasted walnuts, mashed beans, onion-carrot-garlic, flax egg, tamari, smoked paprika, thyme, salt and parsley. Mix well and rest 10 minutes so the flax hydrates and the mix firms up.',
  no: 'Bland de ristede valnøttene, de mosede bønnene, løk-gulrot-hvitløk, linfrø-egget, tamari, røkt paprika, timian, salt og persille. Bland godt og la hvile i 10 minutter så linfrøet trekker til seg fukt og massen stivner.',
  sv: 'Blanda de rostade valnötterna, de mosade bönorna, lök-morot-vitlök, linfrö-ägget, tamari, rökt paprika, timjan, salt och persilja. Blanda väl och låt vila 10 minuter så linfröet suger åt sig fukt och smeten stelnar.',
}
pat.steps[6] = STEP6.en
if (pat.translations?.no) pat.translations.no.steps[6] = STEP6.no
if (pat.translations?.sv) pat.translations.sv.steps[6] = STEP6.sv

// Subtract panko from the per-serving nutrition.
const ns = pat.nutrition.perServing
const before = { calories: ns.calories, protein: ns.protein, totalCarbs: ns.totalCarbs, fiber: ns.fiber, sodium: ns.sodium }
for (const [k, per100] of Object.entries(PANKO_PER_100G)) {
  if (ns[k] == null) continue
  const contribution = (perServingG / 100) * per100
  const next = ns[k] - contribution
  ns[k] = Math.max(0, next >= 100 ? Math.round(next) : next >= 10 ? Math.round(next * 10) / 10 : Math.round(next * 100) / 100)
}
pat.kcal = Math.round(ns.calories)
pat.servingWeightGrams = (pat.servingWeightGrams || 170) - perServingG

rev.version = '1.11.2'
fs.writeFileSync(REV, JSON.stringify(rev, null, 2) + '\n', 'utf8')
console.log('\norn-20 Walnut Patties → panko removed (', pat.ingredients.length, 'ingredients left )')
console.log('  per serving: kcal', before.calories, '→', ns.calories,
  '| protein', before.protein, '→', ns.protein,
  '| carbs', before.totalCarbs, '→', ns.totalCarbs,
  '| fiber', before.fiber, '→', ns.fiber,
  '| sodium', before.sodium, '→', ns.sodium)
console.log('  servingWeightGrams →', pat.servingWeightGrams)

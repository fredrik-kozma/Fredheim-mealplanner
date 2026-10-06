/* Za'atar Hummus & Veggie Salad.
 *
 * The source says "Makes 1 Serving — 1 extra large". Entered as 2
 * servings with the author's amounts untouched, which is the requested
 * halving of the portion without turning every line into an awkward
 * number: 240 g of hummus and 2 slices of bread stay whole and feed two,
 * rather than becoming 120 g and one slice.
 *
 * The 240 g of hummus is the Classic Hummus from this same pack, and the
 * recipe links to it so you can find out how to make it. Its nutrition
 * is read out of that recipe at build time and scaled by weight, rather
 * than looked up from a generic shop-bought hummus — so the two agree,
 * and if the hummus is ever recalculated this dish can be rebuilt to
 * match.
 *
 * Not counted in the nutrition, and said so here rather than quietly:
 * the optional sumac (reliable reference data for it is thin) and the
 * salt and pepper to taste (the amount is by definition unknown). Both
 * are still listed as ingredients. Everything else, down to the half
 * teaspoons of dried herbs, is counted.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-recipes-with-pictures.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/zaatar_b64.txt'
const SERVINGS = 2
const HUMMUS_ID = 'classic-hummus'

const FIELDS = ['calories','protein','totalFat','saturatedFat','polyunsaturatedFat','monounsaturatedFat','omega3','omega6','cholesterol','totalCarbs','totalSugars','addedSugar','fiber','calcium','potassium','copper','iron','magnesium','manganese','selenium','phosphorus','zinc','sodium','vitaminA','vitaminB6','vitaminB12','vitaminC','vitaminD','vitaminE','vitaminK','folate','thiamin','riboflavin','niacin','choline']

const REF = {
  tomato:     { calories:18, protein:0.88, totalFat:0.2, saturatedFat:0.028, polyunsaturatedFat:0.083, monounsaturatedFat:0.031, omega3:0.003, omega6:0.08, totalCarbs:3.89, totalSugars:2.63, fiber:1.2, calcium:10, potassium:237, copper:0.059, iron:0.27, magnesium:11, manganese:0.114, selenium:0, phosphorus:24, zinc:0.17, sodium:5, vitaminA:42, vitaminB6:0.08, vitaminC:13.7, vitaminE:0.54, vitaminK:7.9, folate:15, thiamin:0.037, riboflavin:0.019, niacin:0.594, choline:6.7 },
  parsley:    { calories:36, protein:2.97, totalFat:0.79, saturatedFat:0.132, polyunsaturatedFat:0.124, monounsaturatedFat:0.295, omega3:0.007, omega6:0.115, totalCarbs:6.33, totalSugars:0.85, fiber:3.3, calcium:138, potassium:554, copper:0.149, iron:6.2, magnesium:50, manganese:0.16, selenium:0.1, phosphorus:58, zinc:1.07, sodium:56, vitaminA:421, vitaminB6:0.09, vitaminC:133, vitaminE:0.75, vitaminK:1640, folate:152, thiamin:0.086, riboflavin:0.098, niacin:1.313, choline:12.8 },
  redPepper:  { calories:31, protein:0.99, totalFat:0.3, saturatedFat:0.058, polyunsaturatedFat:0.07, monounsaturatedFat:0.016, omega3:0.025, omega6:0.045, totalCarbs:6.03, totalSugars:4.2, fiber:2.1, calcium:7, potassium:211, copper:0.017, iron:0.43, magnesium:12, manganese:0.112, selenium:0.1, phosphorus:26, zinc:0.25, sodium:4, vitaminA:157, vitaminB6:0.291, vitaminC:127.7, vitaminE:1.58, vitaminK:4.9, folate:46, thiamin:0.054, riboflavin:0.085, niacin:0.979, choline:5.6 },
  garlic:     { calories:149, protein:6.36, totalFat:0.5, saturatedFat:0.089, polyunsaturatedFat:0.249, monounsaturatedFat:0.011, omega3:0.02, omega6:0.229, totalCarbs:33.06, totalSugars:1.0, fiber:2.1, calcium:181, potassium:401, copper:0.299, iron:1.7, magnesium:25, manganese:1.672, selenium:14.2, phosphorus:153, zinc:1.16, sodium:17, vitaminA:0, vitaminB6:1.235, vitaminC:31.2, vitaminE:0.08, vitaminK:1.7, folate:3, thiamin:0.2, riboflavin:0.11, niacin:0.7, choline:23.2 },
  redOnion:   { calories:40, protein:1.1, totalFat:0.1, saturatedFat:0.042, polyunsaturatedFat:0.017, monounsaturatedFat:0.013, omega3:0.004, omega6:0.013, totalCarbs:9.34, totalSugars:4.24, fiber:1.7, calcium:23, potassium:146, copper:0.039, iron:0.21, magnesium:10, manganese:0.129, selenium:0.5, phosphorus:29, zinc:0.17, sodium:4, vitaminA:0, vitaminB6:0.12, vitaminC:7.4, vitaminE:0.02, vitaminK:0.4, folate:19, thiamin:0.046, riboflavin:0.027, niacin:0.116, choline:6.1 },
  olives:     { calories:115, protein:0.84, totalFat:10.68, saturatedFat:1.415, polyunsaturatedFat:0.911, monounsaturatedFat:7.888, omega3:0.063, omega6:0.848, totalCarbs:6.26, totalSugars:0, fiber:3.2, calcium:88, potassium:8, copper:0.251, iron:3.3, magnesium:4, manganese:0.02, selenium:0.9, phosphorus:3, zinc:0.22, sodium:735, vitaminA:20, vitaminB6:0.009, vitaminC:0.9, vitaminE:1.65, vitaminK:1.4, folate:0, thiamin:0.003, riboflavin:0, niacin:0.037, choline:10.4 },
  bread:      { calories:252, protein:12.3, totalFat:3.55, saturatedFat:0.78, polyunsaturatedFat:1.4, monounsaturatedFat:0.8, omega3:0.14, omega6:1.26, totalCarbs:42.7, totalSugars:4.4, fiber:6.0, calcium:163, potassium:254, copper:0.26, iron:2.5, magnesium:76, manganese:2.2, selenium:29, phosphorus:212, zinc:1.76, sodium:450, vitaminA:0, vitaminB6:0.2, vitaminC:0, vitaminE:0.5, vitaminK:1.9, folate:42, thiamin:0.39, riboflavin:0.19, niacin:4.4, choline:20 },
  capers:     { calories:23, protein:2.36, totalFat:0.86, saturatedFat:0.233, polyunsaturatedFat:0.344, monounsaturatedFat:0.059, omega3:0.08, omega6:0.26, totalCarbs:4.89, totalSugars:0.41, fiber:3.2, calcium:40, potassium:40, copper:0.374, iron:1.67, magnesium:33, manganese:0.238, selenium:1.2, phosphorus:10, zinc:0.32, sodium:2964, vitaminA:7, vitaminB6:0.023, vitaminC:4.3, vitaminE:0.88, vitaminK:24.6, folate:23, thiamin:0.018, riboflavin:0.139, niacin:0.652, choline:6.5 },
  sesame:     { calories:573, protein:17.73, totalFat:49.67, saturatedFat:6.957, polyunsaturatedFat:21.773, monounsaturatedFat:18.759, omega3:0.376, omega6:21.375, totalCarbs:23.45, totalSugars:0.3, fiber:11.8, calcium:975, potassium:468, copper:4.082, iron:14.55, magnesium:351, manganese:2.46, selenium:34.4, phosphorus:629, zinc:7.75, sodium:11, vitaminA:0.5, vitaminB6:0.79, vitaminC:0, vitaminE:0.25, vitaminK:0, folate:97, thiamin:0.791, riboflavin:0.247, niacin:4.515, choline:25.6 },
  oliveOil:   { calories:884, protein:0, totalFat:100, saturatedFat:13.808, polyunsaturatedFat:10.523, monounsaturatedFat:72.961, omega3:0.761, omega6:9.762, totalCarbs:0, totalSugars:0, fiber:0, calcium:1, potassium:1, copper:0, iron:0.56, magnesium:0, manganese:0, selenium:0, phosphorus:0, zinc:0, sodium:2, vitaminA:0, vitaminB6:0, vitaminC:0, vitaminE:14.35, vitaminK:60.2, folate:0, thiamin:0, riboflavin:0, niacin:0, choline:0.3 },
  thyme:      { calories:276, protein:9.11, totalFat:7.43, saturatedFat:2.73, polyunsaturatedFat:1.19, monounsaturatedFat:0.47, omega3:0.47, omega6:0.72, totalCarbs:63.94, totalSugars:1.71, fiber:37, calcium:1890, potassium:814, copper:0.86, iron:123.6, magnesium:220, manganese:7.87, selenium:4.6, phosphorus:201, zinc:6.18, sodium:55, vitaminA:190, vitaminB6:0.55, vitaminC:50, vitaminE:7.48, vitaminK:1714.5, folate:274, thiamin:0.51, riboflavin:0.4, niacin:4.94, choline:43.6 },
  oregano:    { calories:265, protein:9.0, totalFat:4.28, saturatedFat:1.551, polyunsaturatedFat:1.369, monounsaturatedFat:0.716, omega3:0.62, omega6:0.75, totalCarbs:68.92, totalSugars:4.09, fiber:42.5, calcium:1597, potassium:1260, copper:0.943, iron:36.8, magnesium:270, manganese:4.99, selenium:4.5, phosphorus:148, zinc:2.69, sodium:25, vitaminA:85, vitaminB6:1.21, vitaminC:2.3, vitaminE:18.26, vitaminK:621.7, folate:237, thiamin:0.177, riboflavin:0.528, niacin:4.64, choline:32.3 },
  basil:      { calories:233, protein:22.98, totalFat:4.07, saturatedFat:2.157, polyunsaturatedFat:0.79, monounsaturatedFat:1.238, omega3:0.32, omega6:0.47, totalCarbs:47.75, totalSugars:1.71, fiber:37.7, calcium:2240, potassium:2630, copper:1.367, iron:89.8, magnesium:711, manganese:9.8, selenium:3.0, phosphorus:274, zinc:7.1, sodium:76, vitaminA:744, vitaminB6:1.34, vitaminC:0.8, vitaminE:10.7, vitaminK:1714.5, folate:310, thiamin:0.08, riboflavin:1.2, niacin:4.9, choline:54.9 },
}

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
if (pack.recipes.find(r => r.id === 'zaatar-hummus-salad')) throw new Error('already exists')

// Hummus per 100 g, taken from the recipe this one links to.
const hummus = pack.recipes.find(r => r.id === HUMMUS_ID)
if (!hummus?.nutrition?.perServing || !hummus.servingWeightGrams) {
  throw new Error(`${HUMMUS_ID} has no usable nutrition to borrow`)
}
REF.hummus = {}
for (const f of FIELDS) {
  REF.hummus[f] = (hummus.nutrition.perServing[f] || 0) / hummus.servingWeightGrams * 100
}

// [ref, grams]. Volumes converted: olive oil 0.92 g/ml.
const BATCH = [
  ['tomato', 220], ['parsley', 30], ['redPepper', 120], ['garlic', 3],
  ['redOnion', 55], ['olives', 34], ['bread', 60], ['hummus', 240],
  ['capers', 17], ['sesame', 6], ['oliveOil', 20 * 0.92],
  ['thyme', 0.5], ['oregano', 0.5], ['basil', 0.5],
]

const totals = Object.fromEntries(FIELDS.map(f => [f, 0]))
let weight = 0
for (const [key, g] of BATCH) {
  if (!REF[key]) throw new Error(`no reference for ${key}`)
  weight += g
  for (const f of FIELDS) totals[f] += (REF[key][f] || 0) * g / 100
}

function tidy(v) {
  const a = Math.abs(v)
  if (a === 0) return 0
  if (a < 1) return Math.round(v * 100) / 100
  if (a < 10) return Math.round(v * 10) / 10
  return Math.round(v)
}
const perServing = {}
for (const f of FIELDS) perServing[f] = tidy(totals[f] / SERVINGS)

let globalMax = 0
for (const f of PACKS) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
  for (const r of j.recipes) globalMax = Math.max(globalMax, r.createdAt || 0)
}

const recipe = {
  id: 'zaatar-hummus-salad',
  title: "Za'atar Hummus Plate with Tomato Salad",
  category: 'Lunch',
  servings: SERVINGS,
  prepTime: 15,
  cookTime: 0,
  imageUrl: fs.readFileSync(IMG, 'utf8').trim(),
  description: 'Hummus spread wide on the plate, half the herbs and garlic stirred through it, the rest tossed with tomato, pepper, olives and capers and piled on top. Toasted bread on the side.',
  tags: ['fredheim', 'lunch', 'salad', 'vegan', 'no-added-sugar', 'high-fiber'],
  kcal: Math.round(perServing.calories),
  servingWeightGrams: Math.round(weight / SERVINGS),
  nutrition: { perServing },
  // The hummus is a recipe in its own right in this pack.
  relatedRecipes: [HUMMUS_ID],
  ingredients: [
    { quantity: 240, unit: 'g', name: 'hummus' },
    { quantity: 220, unit: 'g', name: 'tomato' },
    { quantity: 120, unit: 'g', name: 'red bell pepper' },
    { quantity: 55, unit: 'g', name: 'red onion' },
    { quantity: 34, unit: 'g', name: 'Kalamata olives' },
    { quantity: 30, unit: 'g', name: 'parsley, fresh' },
    { quantity: 60, unit: 'g', name: 'bread, toasted' },
    { quantity: 17, unit: 'g', name: 'capers' },
    { quantity: 6, unit: 'g', name: 'sesame seeds' },
    { quantity: 1, unit: 'clove', name: 'garlic' },
    { quantity: 20, unit: 'ml', name: 'olive oil' },
    { quantity: 0.5, unit: 'tsp', name: 'dried thyme' },
    { quantity: 0.5, unit: 'tsp', name: 'dried oregano' },
    { quantity: 0.5, unit: 'tsp', name: 'dried basil' },
    { quantity: 1, unit: 'tsp', name: 'sumac, optional' },
    { quantity: null, unit: '', name: 'salt and pepper, to taste' },
  ],
  steps: [
    'Rinse the vegetables. Dice the tomato, chop the pepper after removing stem and seeds, dice the onion, chop the olives and mince the parsley and garlic.',
    'Toast the bread and cut it into small pieces.',
    'Spread the hummus across a wide plate. Stir half the parsley, dried herbs, onion and garlic through it, and set it aside.',
    'In a bowl, mix the tomato, pepper, capers, olives, sesame seeds and the remaining herbs, parsley, onion and garlic. Season with salt and pepper.',
    'Pile the vegetables over the hummus, drizzle the olive oil on top and serve with the bread alongside.',
  ],
  notes: 'The hummus is the Classic Hummus in this collection — 240 g is most of a batch. Shop-bought works, but the nutrition here is calculated on ours. Za\'atar is thyme, oregano, sesame and sumac; if you have a ready-made blend, about 1 tbsp replaces the dried herbs and seeds. The bread can be whole-grain or gluten-free. Sumac adds a sour, almost lemony note and is worth finding, but the plate works without it.',
  translations: {
    no: {
      title: 'Za\'atar-hummustallerken med tomatsalat',
      description: 'Hummus bredt utover tallerkenen, med halvparten av urtene og hvitløken rørt inn, resten vendt med tomat, paprika, oliven og kapers og lagt oppå. Ristet brød ved siden av.',
      ingredients: [
        { quantity: 240, unit: 'g', name: 'hummus' },
        { quantity: 220, unit: 'g', name: 'tomat' },
        { quantity: 120, unit: 'g', name: 'rød paprika' },
        { quantity: 55, unit: 'g', name: 'rødløk' },
        { quantity: 34, unit: 'g', name: 'kalamata-oliven' },
        { quantity: 30, unit: 'g', name: 'persille, fersk' },
        { quantity: 60, unit: 'g', name: 'brød, ristet' },
        { quantity: 17, unit: 'g', name: 'kapers' },
        { quantity: 6, unit: 'g', name: 'sesamfrø' },
        { quantity: 1, unit: 'clove', name: 'hvitløk' },
        { quantity: 20, unit: 'ml', name: 'olivenolje' },
        { quantity: 0.5, unit: 'ts', name: 'tørket timian' },
        { quantity: 0.5, unit: 'ts', name: 'tørket oregano' },
        { quantity: 0.5, unit: 'ts', name: 'tørket basilikum' },
        { quantity: 1, unit: 'ts', name: 'sumak, valgfritt' },
        { quantity: null, unit: '', name: 'salt og pepper, etter smak' },
      ],
      steps: [
        'Skyll grønnsakene. Skjær tomaten i terninger, rens og hakk paprikaen, skjær løken i terninger, hakk olivenene og finhakk persillen og hvitløken.',
        'Rist brødet og skjær det i små biter.',
        'Bre hummusen utover en stor tallerken. Rør inn halvparten av persillen, de tørkede urtene, løken og hvitløken, og sett den til side.',
        'Bland tomat, paprika, kapers, oliven, sesamfrø og resten av urtene, persillen, løken og hvitløken i en bolle. Smak til med salt og pepper.',
        'Legg grønnsakene over hummusen, ringle olivenoljen over og server brødet ved siden av.',
      ],
      notes: 'Hummusen er Klassisk hummus i denne samlingen — 240 g er det meste av en sats. Kjøpt hummus fungerer fint, men næringsinnholdet her er regnet ut på vår. Za\'atar er timian, oregano, sesam og sumak; har du en ferdig blanding, erstatter omtrent 1 ss de tørkede urtene og frøene. Brødet kan være grovt eller glutenfritt. Sumak gir en syrlig, nesten sitronaktig tone og er verdt å lete opp, men tallerkenen fungerer uten.',
    },
    sv: {
      title: 'Za\'atar-hummustallrik med tomatsallad',
      description: 'Hummus utbredd på tallriken, med hälften av örterna och vitlöken nedrörd, resten vänd med tomat, paprika, oliver och kapris och lagd ovanpå. Rostat bröd vid sidan av.',
      ingredients: [
        { quantity: 240, unit: 'g', name: 'hummus' },
        { quantity: 220, unit: 'g', name: 'tomat' },
        { quantity: 120, unit: 'g', name: 'röd paprika' },
        { quantity: 55, unit: 'g', name: 'rödlök' },
        { quantity: 34, unit: 'g', name: 'kalamataoliver' },
        { quantity: 30, unit: 'g', name: 'persilja, färsk' },
        { quantity: 60, unit: 'g', name: 'bröd, rostat' },
        { quantity: 17, unit: 'g', name: 'kapris' },
        { quantity: 6, unit: 'g', name: 'sesamfrön' },
        { quantity: 1, unit: 'clove', name: 'vitlök' },
        { quantity: 20, unit: 'ml', name: 'olivolja' },
        { quantity: 0.5, unit: 'tsk', name: 'torkad timjan' },
        { quantity: 0.5, unit: 'tsk', name: 'torkad oregano' },
        { quantity: 0.5, unit: 'tsk', name: 'torkad basilika' },
        { quantity: 1, unit: 'tsk', name: 'sumak, valfritt' },
        { quantity: null, unit: '', name: 'salt och peppar, efter smak' },
      ],
      steps: [
        'Skölj grönsakerna. Tärna tomaten, kärna ur och hacka paprikan, tärna löken, hacka oliverna och finhacka persiljan och vitlöken.',
        'Rosta brödet och skär det i små bitar.',
        'Bred ut hummusen på en stor tallrik. Rör ner hälften av persiljan, de torkade örterna, löken och vitlöken, och ställ den åt sidan.',
        'Blanda tomat, paprika, kapris, oliver, sesamfrön och resten av örterna, persiljan, löken och vitlöken i en skål. Smaka av med salt och peppar.',
        'Lägg grönsakerna över hummusen, ringla olivoljan över och servera brödet vid sidan av.',
      ],
      notes: 'Hummusen är Klassisk hummus i den här samlingen — 240 g är det mesta av en sats. Köpt hummus fungerar bra, men näringsvärdet här är beräknat på vår. Za\'atar är timjan, oregano, sesam och sumak; har du en färdig blandning ersätter ungefär 1 msk de torkade örterna och fröna. Brödet kan vara fullkorn eller glutenfritt. Sumak ger en syrlig, nästan citronaktig ton och är värd att leta upp, men tallriken fungerar utan.',
    },
  },
  createdAt: globalMax + 3600000,
}

for (const [lang, tr] of Object.entries(recipe.translations)) {
  if (tr.ingredients.length !== recipe.ingredients.length) throw new Error(`${lang} ingredient count mismatch`)
  if (tr.steps.length !== recipe.steps.length) throw new Error(`${lang} step count mismatch`)
  tr.ingredients.forEach((ing, i) => {
    if (ing.quantity !== recipe.ingredients[i].quantity) throw new Error(`${lang}[${i}] quantity mismatch`)
  })
}

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`batch ${Math.round(weight)} g over ${SERVINGS} servings -> ${recipe.servingWeightGrams} g a plate`)
console.log(`per serving: ${perServing.calories} kcal | protein ${perServing.protein} g | fat ${perServing.totalFat} g | fibre ${perServing.fiber} g | sodium ${perServing.sodium} mg | vit C ${perServing.vitaminC} mg | vit K ${perServing.vitaminK} ug`)
console.log(`hummus nutrition borrowed from ${HUMMUS_ID} (${hummus.servingWeightGrams} g serving)`)
console.log(`links to: ${recipe.relatedRecipes.join(', ')}`)
console.log(`Pack -> ${pack.version}`)

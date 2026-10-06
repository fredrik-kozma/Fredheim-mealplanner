/* Classic Hummus — the roasted red pepper hummus with the peppers taken
 * out, as requested.
 *
 * Everything else is kept from the parent: the same chickpea/tahini/
 * lemon/garlic base, the same technique of blending that base first and
 * streaming water in, the same finish of olive oil folded through at the
 * end. The pepper-roasting step goes, and so does the pepper-specific
 * line in the tasting step.
 *
 * Two consequences of removing 200 g of pepper that had to be handled
 * rather than ignored:
 *
 *  - The peppers were a third of the batch and most of its moisture.
 *    60 ml of water on 400 g of chickpeas and 60 g of tahini would give
 *    a paste you could stand a spoon in. Raised to 100 ml, which is in
 *    the normal range for a hummus this size, and it was already an
 *    adjust-to-feel ingredient.
 *
 *  - Nutrition cannot be inherited. The parent's table was computed with
 *    the peppers in it, and they carried most of its vitamin C and a
 *    good share of its vitamin A. Recomputed here from USDA per-100g
 *    values against the actual amounts.
 *
 * Smoked paprika is deliberately kept, because the instruction was to
 * remove the pepper and nothing else. It is worth knowing that it is
 * what carries the roasted note now that the peppers are gone — this is
 * a smoky hummus rather than a plain one, and dropping it is a one-line
 * change if that is not wanted.
 *
 * The photo is borrowed from the lemony hummus, as asked.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-recipes-with-pictures.json')
const SERVINGS = 6

const REF = {
  chickpeas:  { calories:164, protein:8.86, totalFat:2.59, saturatedFat:0.269, polyunsaturatedFat:1.156, monounsaturatedFat:0.583, omega3:0.043, omega6:1.113, totalCarbs:27.42, totalSugars:4.8, fiber:7.6, calcium:49, potassium:291, copper:0.352, iron:2.89, magnesium:48, manganese:1.03, selenium:3.7, phosphorus:168, zinc:1.53, sodium:7, vitaminA:1, vitaminB6:0.139, vitaminC:1.3, vitaminE:0.35, vitaminK:4, folate:172, thiamin:0.116, riboflavin:0.063, niacin:0.526, choline:42.8 },
  tahini:     { calories:595, protein:17.0, totalFat:53.76, saturatedFat:7.528, polyunsaturatedFat:23.564, monounsaturatedFat:20.285, omega3:0.4, omega6:23.2, totalCarbs:21.19, totalSugars:0.49, fiber:9.3, calcium:426, potassium:414, copper:1.5, iron:8.95, magnesium:95, manganese:1.46, selenium:34.4, phosphorus:732, zinc:4.62, sodium:115, vitaminA:0, vitaminB6:0.15, vitaminC:0, vitaminE:0.25, vitaminK:0, folate:98, thiamin:1.22, riboflavin:0.47, niacin:5.45, choline:25.8 },
  garlic:     { calories:149, protein:6.36, totalFat:0.5, saturatedFat:0.089, polyunsaturatedFat:0.249, monounsaturatedFat:0.011, omega3:0.02, omega6:0.229, totalCarbs:33.06, totalSugars:1.0, fiber:2.1, calcium:181, potassium:401, copper:0.299, iron:1.7, magnesium:25, manganese:1.672, selenium:14.2, phosphorus:153, zinc:1.16, sodium:17, vitaminA:0, vitaminB6:1.235, vitaminC:31.2, vitaminE:0.08, vitaminK:1.7, folate:3, thiamin:0.2, riboflavin:0.11, niacin:0.7, choline:23.2 },
  lemonJuice: { calories:22, protein:0.35, totalFat:0.24, saturatedFat:0.04, polyunsaturatedFat:0.07, monounsaturatedFat:0.01, omega3:0.01, omega6:0.06, totalCarbs:6.9, totalSugars:2.52, fiber:0.3, calcium:6, potassium:124, copper:0.016, iron:0.08, magnesium:6, manganese:0.012, selenium:0.1, phosphorus:8, zinc:0.05, sodium:1, vitaminA:0, vitaminB6:0.046, vitaminC:38.7, vitaminE:0.15, vitaminK:0, folate:20, thiamin:0.024, riboflavin:0.015, niacin:0.091, choline:5.1 },
  oliveOil:   { calories:884, protein:0, totalFat:100, saturatedFat:13.808, polyunsaturatedFat:10.523, monounsaturatedFat:72.961, omega3:0.761, omega6:9.762, totalCarbs:0, totalSugars:0, fiber:0, calcium:1, potassium:1, copper:0, iron:0.56, magnesium:0, manganese:0, selenium:0, phosphorus:0, zinc:0, sodium:2, vitaminA:0, vitaminB6:0, vitaminC:0, vitaminE:14.35, vitaminK:60.2, folate:0, thiamin:0, riboflavin:0, niacin:0, choline:0.3 },
  paprika:    { calories:282, protein:14.14, totalFat:12.89, saturatedFat:2.14, polyunsaturatedFat:7.77, monounsaturatedFat:1.695, omega3:0.45, omega6:7.32, totalCarbs:53.99, totalSugars:10.34, fiber:34.9, calcium:229, potassium:2280, copper:0.713, iron:21.14, magnesium:178, manganese:1.59, selenium:6.3, phosphorus:314, zinc:4.33, sodium:68, vitaminA:2463, vitaminB6:2.141, vitaminC:0.9, vitaminE:29.1, vitaminK:80.3, folate:49, thiamin:0.33, riboflavin:1.743, niacin:10.06, choline:51.5 },
  cumin:      { calories:375, protein:17.81, totalFat:22.27, saturatedFat:1.535, polyunsaturatedFat:3.279, monounsaturatedFat:14.04, omega3:0.19, omega6:3.09, totalCarbs:44.24, totalSugars:2.25, fiber:10.5, calcium:931, potassium:1788, copper:0.867, iron:66.36, magnesium:366, manganese:3.333, selenium:5.2, phosphorus:499, zinc:4.8, sodium:168, vitaminA:64, vitaminB6:0.435, vitaminC:7.7, vitaminE:3.33, vitaminK:5.4, folate:10, thiamin:0.628, riboflavin:0.327, niacin:4.579, choline:24.7 },
}

// [ref, grams] — volumes converted: lemon 1.03, olive oil 0.92.
const BATCH = [
  ['chickpeas', 400], ['tahini', 60], ['garlic', 6],
  ['lemonJuice', 30 * 1.03], ['oliveOil', 15 * 0.92],
  ['paprika', 2.3], ['cumin', 1.05],
]
const SALT_G = 3            // ½ tsp fine sea salt
const SODIUM_PER_G_SALT = 393
const WATER_ML = 100        // raised from the parent's 60, see header

const FIELDS = ['calories','protein','totalFat','saturatedFat','polyunsaturatedFat','monounsaturatedFat','omega3','omega6','cholesterol','totalCarbs','totalSugars','addedSugar','fiber','calcium','potassium','copper','iron','magnesium','manganese','selenium','phosphorus','zinc','sodium','vitaminA','vitaminB6','vitaminB12','vitaminC','vitaminD','vitaminE','vitaminK','folate','thiamin','riboflavin','niacin','choline']

const totals = Object.fromEntries(FIELDS.map(f => [f, 0]))
let weight = SALT_G + WATER_ML
for (const [key, g] of BATCH) {
  weight += g
  for (const f of FIELDS) totals[f] += (REF[key][f] || 0) * g / 100
}
totals.sodium += SALT_G * SODIUM_PER_G_SALT

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

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
if (pack.recipes.find(r => r.id === 'classic-hummus')) throw new Error('already exists')
const photoSource = pack.recipes.find(r => r.id === 'lemony-chickpea-hummus')
if (!photoSource?.imageUrl) throw new Error('lemony hummus photo not found to borrow')

const recipe = {
  id: 'classic-hummus',
  title: 'Classic Hummus',
  category: 'Spreads',
  servings: SERVINGS,
  prepTime: 15,
  cookTime: 0,
  imageUrl: photoSource.imageUrl,
  description: 'Chickpeas, tahini, lemon and garlic, blended long enough to turn pale and fluffy. The plain one, with nothing in the way.',
  tags: ['fredheim', 'spread', 'vegan', 'no-added-sugar', 'high-fiber'],
  kcal: Math.round(perServing.calories),
  servingWeightGrams: Math.round(weight / SERVINGS),
  nutrition: { perServing },
  ingredients: [
    { quantity: 400, unit: 'g', name: 'chickpeas, cooked' },
    { quantity: 60, unit: 'g', name: 'tahini' },
    { quantity: 2, unit: 'clove', name: 'garlic' },
    { quantity: 30, unit: 'ml', name: 'lemon juice' },
    { quantity: 15, unit: 'ml', name: 'extra virgin olive oil' },
    { quantity: 1, unit: 'tsp', name: 'smoked paprika' },
    { quantity: 0.5, unit: 'tsp', name: 'ground cumin' },
    { quantity: 0.5, unit: 'tsp', name: 'fine sea salt' },
    { quantity: 100, unit: 'ml', name: 'cold water' },
  ],
  steps: [
    'Blend the base: in a food processor, combine the chickpeas, tahini, lemon juice and garlic. Blend for 1-2 minutes until a thick, slightly grainy paste forms — this step matters more than people think; it is what lets the tahini emulsify smooth later.',
    'Add the smoked paprika, cumin and salt. Blend again until fully combined.',
    'With the processor running, stream in the cold water a little at a time until the hummus turns pale, fluffy and completely smooth — this can take 2-3 minutes of continuous blending, so do not rush it.',
    'Drizzle in the olive oil and pulse just a few times to fold it through without fully blending it in, keeping small pockets of richness.',
    'Taste for salt and lemon. Chill for at least 30 minutes before serving; the flavour rounds out significantly as it sits. Keeps refrigerated for 5 days.',
  ],
  notes: 'This is the roasted red pepper hummus without the peppers. They were a third of that batch and most of its moisture, so the water is up from 60 ml to 100 ml — add it slowly and stop when it falls softly off the spoon. The smoked paprika is what carries the roasted note now the peppers are gone; leave it out for a plainer, more traditional hummus. Warm chickpeas blend smoother than cold ones.',
  translations: {
    no: {
      title: 'Klassisk hummus',
      description: 'Kikerter, tahini, sitron og hvitløk, kjørt lenge nok til å bli lys og luftig. Den enkle varianten, uten noe i veien.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'kikerter, kokte' },
        { quantity: 60, unit: 'g', name: 'tahini' },
        { quantity: 2, unit: 'clove', name: 'hvitløk' },
        { quantity: 30, unit: 'ml', name: 'sitronsaft' },
        { quantity: 15, unit: 'ml', name: 'extra virgin olivenolje' },
        { quantity: 1, unit: 'ts', name: 'røkt paprika' },
        { quantity: 0.5, unit: 'ts', name: 'malt spisskummen' },
        { quantity: 0.5, unit: 'ts', name: 'fint havsalt' },
        { quantity: 100, unit: 'ml', name: 'kaldt vann' },
      ],
      steps: [
        'Kjør basen: ha kikerter, tahini, sitronsaft og hvitløk i en foodprosessor. Kjør i 1-2 minutter til en tykk, lett kornete masse — dette trinnet betyr mer enn folk tror; det er det som får tahinien til å emulgere glatt senere.',
        'Tilsett røkt paprika, spisskummen og salt. Kjør igjen til alt er godt blandet.',
        'Med prosessoren i gang: hell i det kalde vannet litt etter litt til hummusen blir lys, luftig og helt glatt — det kan ta 2-3 minutter med kontinuerlig kjøring, så ikke stress.',
        'Ringle i olivenoljen og puls bare noen få ganger så den foldes inn uten å blandes helt — da beholder du små lommer av fylde.',
        'Smak til med salt og sitron. Avkjøl i minst 30 minutter før servering; smaken rundes tydelig av mens den står. Holder seg i kjøleskap i 5 dager.',
      ],
      notes: 'Dette er hummusen med ovnsbakt paprika, uten paprikaen. Den utgjorde en tredjedel av satsen og det meste av væsken, så vannet er økt fra 60 ml til 100 ml — spe sakte og stopp når den faller mykt av skjeen. Den røkte paprikaen er det som gir den ristede tonen nå som paprikaen er borte; sløyf den for en enklere, mer tradisjonell hummus. Varme kikerter blir glattere enn kalde.',
    },
    sv: {
      title: 'Klassisk hummus',
      description: 'Kikärtor, tahini, citron och vitlök, mixade tillräckligt länge för att bli ljusa och luftiga. Den enkla varianten, utan något i vägen.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'kikärtor, kokta' },
        { quantity: 60, unit: 'g', name: 'tahini' },
        { quantity: 2, unit: 'clove', name: 'vitlök' },
        { quantity: 30, unit: 'ml', name: 'citronjuice' },
        { quantity: 15, unit: 'ml', name: 'extra virgin olivolja' },
        { quantity: 1, unit: 'tsk', name: 'rökt paprika' },
        { quantity: 0.5, unit: 'tsk', name: 'malen spiskummin' },
        { quantity: 0.5, unit: 'tsk', name: 'fint havssalt' },
        { quantity: 100, unit: 'ml', name: 'kallt vatten' },
      ],
      steps: [
        'Mixa basen: lägg kikärtor, tahini, citronjuice och vitlök i en matberedare. Kör i 1-2 minuter tills en tjock, lätt grynig massa bildas — det här steget betyder mer än man tror; det är det som får tahinin att emulgera slät senare.',
        'Tillsätt rökt paprika, spiskummin och salt. Mixa igen tills allt är väl blandat.',
        'Med matberedaren igång: häll i det kalla vattnet lite i taget tills hummusen blir ljus, luftig och helt slät — det kan ta 2-3 minuter av kontinuerlig mixning, så ha tålamod.',
        'Ringla i olivoljan och pulsa bara några gånger så att den vänds ner utan att blandas helt — då behåller du små fickor av fyllighet.',
        'Smaka av med salt och citron. Kyl i minst 30 minuter före servering; smaken rundas tydligt av när den står. Håller sig i kylen i 5 dagar.',
      ],
      notes: 'Det här är hummusen med rostad paprika, utan paprikan. Den utgjorde en tredjedel av satsen och det mesta av vätskan, så vattnet är höjt från 60 ml till 100 ml — spä långsamt och sluta när den faller mjukt av skeden. Den rökta paprikan är det som ger den rostade tonen nu när paprikan är borta; hoppa över den för en enklare, mer traditionell hummus. Varma kikärtor blir slätare än kalla.',
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

console.log(`batch ${Math.round(weight)} g over ${SERVINGS} -> ${recipe.servingWeightGrams} g a serving`)
console.log(`per serving: ${perServing.calories} kcal | protein ${perServing.protein} g | fat ${perServing.totalFat} g | fibre ${perServing.fiber} g | sodium ${perServing.sodium} mg | vit C ${perServing.vitaminC} mg`)
console.log(`photo borrowed from lemony-chickpea-hummus (${recipe.imageUrl.length} chars)`)
console.log(`Pack -> ${pack.version}`)

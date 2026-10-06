/* Adds "Lime-ostekake" (raw lime cheesecake) to the Fredheim pack, in
 * English, Norwegian and Swedish, with nutrition computed from the
 * ingredients.
 *
 * Source was a Norwegian PDF. Four things in it needed a decision rather
 * than a transcription, all recorded here because they move the numbers:
 *
 *  - It gives no serving count. A 22–24 cm raw cheesecake of this weight
 *    (~1.65 kg) is a 12-slice cake, and 12 is what the nutrition is
 *    divided by. It is also very rich, so a slice is a slice.
 *
 *  - "2 never spinat" — two handfuls. Taken as 60 g of fresh spinach,
 *    30 g a handful. Present for colour more than flavour, which is why
 *    the step says to blend until no specks remain.
 *
 *  - "1 dl honning, agave- eller lønnesirup". Listed as maple syrup,
 *    since the rest of this pack is plant-based and honey is not; the
 *    other two are named in the notes as the equal swaps the author
 *    intended. 1 dl at 1.32 g/ml is 132 g.
 *
 *  - "Revet skall av 1 lime" and "ca 4-5 lime" are counts that go stale
 *    the moment the cake is scaled, so the zest is 1 tsp (what one lime
 *    yields) and the juice is the 2 dl the recipe already states.
 *
 * Two ingredients appear twice, in the base and in the filling. They
 * carry a ", for the base" / ", for the filling" qualifier, the same way
 * orn-64 distinguishes its crust and filling dates — a disambiguating
 * qualifier, not a stale equivalent.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-recipes-with-pictures.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/cheesecake_b64.txt'
const SERVINGS = 12

// USDA per 100 g. Omissions are genuine zeros for this purpose.
const REF = {
  almonds:     { calories:579, protein:21.15, totalFat:49.93, saturatedFat:3.802, polyunsaturatedFat:12.329, monounsaturatedFat:31.551, omega3:0.003, omega6:12.32, totalCarbs:21.55, totalSugars:4.35, fiber:12.5, calcium:269, potassium:733, copper:1.031, iron:3.71, magnesium:270, manganese:2.179, selenium:4.1, phosphorus:481, zinc:3.12, sodium:1, vitaminA:0, vitaminB6:0.137, vitaminC:0, vitaminE:25.63, vitaminK:0, folate:44, thiamin:0.205, riboflavin:1.138, niacin:3.618, choline:52.1 },
  dates:       { calories:282, protein:2.45, totalFat:0.39, saturatedFat:0.032, polyunsaturatedFat:0.019, monounsaturatedFat:0.036, omega3:0.002, omega6:0.017, totalCarbs:75.03, totalSugars:63.35, fiber:8.0, calcium:39, potassium:656, copper:0.206, iron:1.02, magnesium:43, manganese:0.262, selenium:3.0, phosphorus:62, zinc:0.29, sodium:2, vitaminA:0.5, vitaminB6:0.165, vitaminC:0.4, vitaminE:0.05, vitaminK:2.7, folate:19, thiamin:0.052, riboflavin:0.066, niacin:1.274, choline:6.3 },
  coconutDry:  { calories:660, protein:6.88, totalFat:64.53, saturatedFat:57.22, polyunsaturatedFat:0.706, monounsaturatedFat:2.745, omega3:0, omega6:0.706, totalCarbs:23.65, totalSugars:7.35, fiber:16.3, calcium:26, potassium:543, copper:0.8, iron:3.32, magnesium:90, manganese:2.74, selenium:18.5, phosphorus:206, zinc:2.01, sodium:37, vitaminA:0, vitaminB6:0.3, vitaminC:1.5, vitaminE:0.44, vitaminK:0, folate:9, thiamin:0.06, riboflavin:0.1, niacin:0.603, choline:0 },
  coconutOil:  { calories:862, protein:0, totalFat:99.06, saturatedFat:82.475, polyunsaturatedFat:1.702, monounsaturatedFat:6.332, omega3:0, omega6:1.702, totalCarbs:0, totalSugars:0, fiber:0, calcium:1, potassium:0, copper:0, iron:0.05, magnesium:0, manganese:0, selenium:0, phosphorus:0, zinc:0.02, sodium:0, vitaminA:0, vitaminB6:0, vitaminC:0, vitaminE:0.09, vitaminK:0.6, folate:0, thiamin:0, riboflavin:0, niacin:0, choline:0 },
  tahini:      { calories:595, protein:17.0, totalFat:53.76, saturatedFat:7.528, polyunsaturatedFat:23.564, monounsaturatedFat:20.285, omega3:0.4, omega6:23.2, totalCarbs:21.19, totalSugars:0.49, fiber:9.3, calcium:426, potassium:414, copper:1.5, iron:8.95, magnesium:95, manganese:1.46, selenium:34.4, phosphorus:732, zinc:4.62, sodium:115, vitaminA:0, vitaminB6:0.15, vitaminC:0, vitaminE:0.25, vitaminK:0, folate:98, thiamin:1.22, riboflavin:0.47, niacin:5.45, choline:25.8 },
  cashews:     { calories:553, protein:18.22, totalFat:43.85, saturatedFat:7.783, polyunsaturatedFat:7.845, monounsaturatedFat:23.797, omega3:0.062, omega6:7.782, totalCarbs:30.19, totalSugars:5.91, fiber:3.3, calcium:37, potassium:660, copper:2.195, iron:6.68, magnesium:292, manganese:1.655, selenium:19.9, phosphorus:593, zinc:5.78, sodium:12, vitaminA:0, vitaminB6:0.417, vitaminC:0.5, vitaminE:0.9, vitaminK:34.1, folate:25, thiamin:0.423, riboflavin:0.058, niacin:1.062, choline:61 },
  coconutCream:{ calories:330, protein:3.63, totalFat:35.0, saturatedFat:31.05, polyunsaturatedFat:0.383, monounsaturatedFat:1.49, omega3:0, omega6:0.383, totalCarbs:6.65, totalSugars:4.0, fiber:2.2, calcium:10, potassium:325, copper:0.3, iron:3.19, magnesium:46, manganese:1.0, selenium:6.2, phosphorus:109, zinc:0.86, sodium:12, vitaminA:0, vitaminB6:0.05, vitaminC:1.0, vitaminE:0.15, vitaminK:0, folate:10, thiamin:0.02, riboflavin:0, niacin:0.76, choline:0 },
  limeJuice:   { calories:25, protein:0.42, totalFat:0.07, saturatedFat:0.008, polyunsaturatedFat:0.021, monounsaturatedFat:0.007, omega3:0.012, omega6:0.009, totalCarbs:8.42, totalSugars:1.69, fiber:0.4, calcium:14, potassium:117, copper:0.016, iron:0.09, magnesium:8, manganese:0.008, selenium:0.1, phosphorus:14, zinc:0.08, sodium:2, vitaminA:0, vitaminB6:0.046, vitaminC:30, vitaminE:0.22, vitaminK:0.6, folate:10, thiamin:0.025, riboflavin:0.015, niacin:0.1, choline:5.1 },
  limeZest:    { calories:47, protein:1.5, totalFat:0.3, saturatedFat:0.04, polyunsaturatedFat:0.06, monounsaturatedFat:0.05, omega3:0, omega6:0.06, totalCarbs:16, totalSugars:4.2, fiber:10.6, calcium:134, potassium:160, copper:0.09, iron:0.8, magnesium:15, manganese:0.36, selenium:0.7, phosphorus:12, zinc:0.25, sodium:6, vitaminA:0, vitaminB6:0.17, vitaminC:129, vitaminE:0.25, vitaminK:0, folate:30, thiamin:0.09, riboflavin:0.08, niacin:0.4, choline:8.4 },
  spinach:     { calories:23, protein:2.86, totalFat:0.39, saturatedFat:0.063, polyunsaturatedFat:0.165, monounsaturatedFat:0.01, omega3:0.138, omega6:0.026, totalCarbs:3.63, totalSugars:0.42, fiber:2.2, calcium:99, potassium:558, copper:0.13, iron:2.71, magnesium:79, manganese:0.897, selenium:1.0, phosphorus:49, zinc:0.53, sodium:79, vitaminA:469, vitaminB6:0.195, vitaminC:28.1, vitaminE:2.03, vitaminK:482.9, folate:194, thiamin:0.078, riboflavin:0.189, niacin:0.724, choline:19.3 },
  mapleSyrup:  { calories:260, protein:0.04, totalFat:0.06, saturatedFat:0.007, polyunsaturatedFat:0.01, monounsaturatedFat:0.02, omega3:0, omega6:0.01, totalCarbs:67.04, totalSugars:60.46, fiber:0, calcium:102, potassium:212, copper:0.019, iron:0.11, magnesium:21, manganese:2.908, selenium:0.6, phosphorus:2, zinc:1.47, sodium:12, vitaminA:0, vitaminB6:0.002, vitaminC:0, vitaminE:0, vitaminK:0, folate:0, thiamin:0.006, riboflavin:1.27, niacin:0.081, choline:1.6 },
  pistachios:  { calories:560, protein:20.16, totalFat:45.32, saturatedFat:5.907, polyunsaturatedFat:13.744, monounsaturatedFat:23.82, omega3:0.254, omega6:13.49, totalCarbs:27.17, totalSugars:7.66, fiber:10.6, calcium:105, potassium:1025, copper:1.3, iron:3.92, magnesium:121, manganese:1.2, selenium:7, phosphorus:490, zinc:2.2, sodium:1, vitaminA:26, vitaminB6:1.7, vitaminC:5.6, vitaminE:2.86, vitaminK:13.2, folate:51, thiamin:0.87, riboflavin:0.16, niacin:1.3, choline:71.4 },
  cinnamon:    { calories:247, protein:3.99, totalFat:1.24, saturatedFat:0.345, polyunsaturatedFat:0.068, monounsaturatedFat:0.246, omega3:0.011, omega6:0.057, totalCarbs:80.59, totalSugars:2.17, fiber:53.1, calcium:1002, potassium:431, copper:0.339, iron:8.32, magnesium:60, manganese:17.466, selenium:3.1, phosphorus:64, zinc:1.83, sodium:10, vitaminA:15, vitaminB6:0.158, vitaminC:3.8, vitaminE:2.32, vitaminK:31.2, folate:6, thiamin:0.022, riboflavin:0.041, niacin:1.332, choline:11 },
}

// [refKey, grams]. Volumes already converted: coconut oil 0.92 g/ml,
// tahini 1.06, lime juice 1.03, maple syrup 1.32.
const BATCH = [
  ['almonds', 200], ['dates', 200], ['coconutDry', 20], ['limeZest', 2],
  ['coconutOil', 15 * 0.92], ['cinnamon', 2.6], ['tahini', 25 * 1.06],
  ['cashews', 500], ['coconutOil', 60 * 0.92], ['coconutCream', 200],
  ['limeJuice', 200 * 1.03], ['limeZest', 2], ['spinach', 60],
  ['mapleSyrup', 100 * 1.32], ['pistachios', 30],
]
const VANILLA_G = 2 // vanilla powder, nutritionally negligible but real weight

const FIELDS = ['calories','protein','totalFat','saturatedFat','polyunsaturatedFat','monounsaturatedFat','omega3','omega6','cholesterol','totalCarbs','totalSugars','addedSugar','fiber','calcium','potassium','copper','iron','magnesium','manganese','selenium','phosphorus','zinc','sodium','vitaminA','vitaminB6','vitaminB12','vitaminC','vitaminD','vitaminE','vitaminK','folate','thiamin','riboflavin','niacin','choline']

const totals = Object.fromEntries(FIELDS.map(f => [f, 0]))
let weight = VANILLA_G
for (const [key, g] of BATCH) {
  const ref = REF[key]
  if (!ref) throw new Error(`no reference for ${key}`)
  weight += g
  for (const f of FIELDS) totals[f] += (ref[f] || 0) * g / 100
}
// Added sugar is the syrup only — dates are whole fruit, the same call
// made for the carob mousse and every other date-sweetened recipe here.
totals.addedSugar = REF.mapleSyrup.totalSugars * (100 * 1.32) / 100

function tidy(v) {
  const a = Math.abs(v)
  if (a === 0) return 0
  if (a < 1) return Math.round(v * 100) / 100
  if (a < 10) return Math.round(v * 10) / 10
  return Math.round(v)
}
const perServing = {}
for (const f of FIELDS) perServing[f] = tidy(totals[f] / SERVINGS)

// createdAt must beat every pack, not just this one, or the recipe lands
// mid-list under "Newest".
let globalMax = 0
for (const f of PACKS) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
  for (const r of j.recipes) globalMax = Math.max(globalMax, r.createdAt || 0)
}

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
if (pack.recipes.find(r => r.id === 'lime-cheesecake')) throw new Error('already exists')

const recipe = {
  id: 'lime-cheesecake',
  title: 'Lime Cheesecake (Raw)',
  category: 'Dessert',
  servings: SERVINGS,
  prepTime: 30,
  cookTime: 720, // the 12-hour set in the fridge; the 12-hour soak is step 1
  imageUrl: fs.readFileSync(IMG, 'utf8').trim(),
  description: 'A no-bake cheesecake on a date and almond base, set with soaked cashews and sharpened with lime. Green from spinach, not colouring.',
  tags: ['fredheim', 'dessert', 'vegan', 'gluten-free', 'raw'],
  kcal: Math.round(perServing.calories),
  servingWeightGrams: Math.round(weight / SERVINGS),
  nutrition: { perServing },
  ingredients: [
    { quantity: 200, unit: 'g', name: 'almonds' },
    { quantity: 200, unit: 'g', name: 'dates, pitted' },
    { quantity: 20, unit: 'g', name: 'desiccated coconut' },
    { quantity: 1, unit: 'tsp', name: 'lime zest, grated, for the base' },
    { quantity: 15, unit: 'ml', name: 'coconut oil, for the base' },
    { quantity: 1, unit: 'tsp', name: 'vanilla powder' },
    { quantity: 1, unit: 'tsp', name: 'ground cinnamon' },
    { quantity: 25, unit: 'ml', name: 'tahini' },
    { quantity: 500, unit: 'g', name: 'cashews, soaked 12 hours' },
    { quantity: 60, unit: 'ml', name: 'coconut oil, melted, for the filling' },
    { quantity: 200, unit: 'g', name: 'coconut cream' },
    { quantity: 200, unit: 'ml', name: 'lime juice' },
    { quantity: 1, unit: 'tsp', name: 'lime zest, grated, for the filling' },
    { quantity: 60, unit: 'g', name: 'spinach' },
    { quantity: 100, unit: 'ml', name: 'maple syrup' },
    { quantity: 30, unit: 'g', name: 'pistachios, crushed, to decorate' },
  ],
  steps: [
    'Soak the cashews in water the evening before and leave them 12 hours.',
    'Line the base of a 22-24 cm springform tin with baking paper.',
    'Blend all the base ingredients in a food processor to a crumbly texture. Press the mixture out across the bottom of the tin and put it in the fridge.',
    'Drain the cashews. Blend all the filling ingredients until completely smooth, so the spinach leaves no visible specks.',
    'Pour the filling over the base and leave the cake in the fridge for 12 hours.',
    'Decorate with lime slices, grated lime zest and crushed pistachios.',
  ],
  notes: 'Easier to move: freeze the cake and let it thaw in the fridge on the serving plate — it lifts off the tin base cleanly that way. Sweetener: the original gives honey, agave or maple syrup as equal choices; maple is listed here because the rest of these recipes are plant-based. The spinach is there for colour rather than flavour, so blend until no green specks remain. Both soaking and setting take 12 hours, so start the day before.',
  translations: {
    no: {
      title: 'Lime-ostekake (rå)',
      description: 'Ostekake uten steking, på bunn av dadler og mandler, satt med bløtlagte cashewnøtter og frisk av lime. Grønnfargen kommer fra spinat, ikke farge.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'mandler' },
        { quantity: 200, unit: 'g', name: 'dadler, uten stein' },
        { quantity: 20, unit: 'g', name: 'kokos, revet' },
        { quantity: 1, unit: 'ts', name: 'limeskall, revet, til bunnen' },
        { quantity: 15, unit: 'ml', name: 'kokosolje, til bunnen' },
        { quantity: 1, unit: 'ts', name: 'vaniljepulver' },
        { quantity: 1, unit: 'ts', name: 'kanel, malt' },
        { quantity: 25, unit: 'ml', name: 'tahin' },
        { quantity: 500, unit: 'g', name: 'cashewnøtter, bløtlagt i 12 timer' },
        { quantity: 60, unit: 'ml', name: 'kokosolje, smeltet, til kremen' },
        { quantity: 200, unit: 'g', name: 'kokosfløte' },
        { quantity: 200, unit: 'ml', name: 'limejuice' },
        { quantity: 1, unit: 'ts', name: 'limeskall, revet, til kremen' },
        { quantity: 60, unit: 'g', name: 'spinat' },
        { quantity: 100, unit: 'ml', name: 'lønnesirup' },
        { quantity: 30, unit: 'g', name: 'pistasjnøtter, knuste, til pynt' },
      ],
      steps: [
        'Legg cashewnøttene i vann kvelden før og la dem stå i 12 timer.',
        'Kle bunnen av en springform på 22-24 cm med bakepapir.',
        'Kjør alle ingrediensene til bunnen i en kjøkkenmaskin til en smulete konsistens. Trykk massen utover i bunnen av formen og sett den i kjøleskapet.',
        'Hell av vannet fra cashewnøttene. Kjør alle ingrediensene til kremen til den er helt glatt, slik at spinaten ikke synes som biter.',
        'Hell kremen over bunnen og la kaken stå i kjøleskapet i 12 timer.',
        'Pynt med limeskiver, revet limeskall og knuste pistasjnøtter.',
      ],
      notes: 'Lettere å flytte: frys kaken og la den tine i kjøleskapet på serveringsfatet — da slipper den formbunnen pent. Søtning: originalen gir honning, agave- eller lønnesirup som likeverdige valg; lønnesirup står oppført her fordi resten av disse oppskriftene er plantebaserte. Spinaten er der for fargen, ikke smaken, så kjør til det ikke er grønne biter igjen. Både bløtlegging og setting tar 12 timer, så start dagen før.',
    },
    sv: {
      title: 'Limecheesecake (rå)',
      description: 'Cheesecake utan gräddning, på botten av dadlar och mandlar, som stelnar med blötlagda cashewnötter och piggas upp av lime. Det gröna kommer från spenat, inte färg.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'mandlar' },
        { quantity: 200, unit: 'g', name: 'dadlar, urkärnade' },
        { quantity: 20, unit: 'g', name: 'kokos, riven' },
        { quantity: 1, unit: 'tsk', name: 'limeskal, rivet, till botten' },
        { quantity: 15, unit: 'ml', name: 'kokosolja, till botten' },
        { quantity: 1, unit: 'tsk', name: 'vaniljpulver' },
        { quantity: 1, unit: 'tsk', name: 'kanel, malen' },
        { quantity: 25, unit: 'ml', name: 'tahini' },
        { quantity: 500, unit: 'g', name: 'cashewnötter, blötlagda i 12 timmar' },
        { quantity: 60, unit: 'ml', name: 'kokosolja, smält, till krämen' },
        { quantity: 200, unit: 'g', name: 'kokosgrädde' },
        { quantity: 200, unit: 'ml', name: 'limejuice' },
        { quantity: 1, unit: 'tsk', name: 'limeskal, rivet, till krämen' },
        { quantity: 60, unit: 'g', name: 'spenat' },
        { quantity: 100, unit: 'ml', name: 'lönnsirap' },
        { quantity: 30, unit: 'g', name: 'pistaschnötter, krossade, till garnering' },
      ],
      steps: [
        'Lägg cashewnötterna i vatten kvällen innan och låt dem stå i 12 timmar.',
        'Klä botten på en springform på 22-24 cm med bakplåtspapper.',
        'Kör alla ingredienser till botten i en matberedare till en smulig konsistens. Tryck ut massan i botten av formen och ställ den i kylen.',
        'Häll av vattnet från cashewnötterna. Mixa alla ingredienser till krämen tills den är helt slät, så att spenaten inte syns som bitar.',
        'Häll krämen över botten och låt kakan stå i kylen i 12 timmar.',
        'Garnera med limeskivor, rivet limeskal och krossade pistaschnötter.',
      ],
      notes: 'Lättare att flytta: frys kakan och låt den tina i kylen på serveringsfatet — då släpper den formbotten snyggt. Sötning: originalet anger honung, agave- eller lönnsirap som likvärdiga val; lönnsirap står här eftersom resten av de här recepten är växtbaserade. Spenaten finns där för färgen, inte smaken, så mixa tills inga gröna bitar syns. Både blötläggning och stelning tar 12 timmar, så börja dagen innan.',
    },
  },
  createdAt: globalMax + 3600000,
}

// Index alignment across languages is the contract these lists live by.
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

console.log(`batch ${Math.round(weight)} g over ${SERVINGS} servings -> ${recipe.servingWeightGrams} g a slice`)
console.log(`per serving: ${perServing.calories} kcal | fat ${perServing.totalFat} g (sat ${perServing.saturatedFat}) | carbs ${perServing.totalCarbs} g | sugars ${perServing.totalSugars} g (added ${perServing.addedSugar}) | fibre ${perServing.fiber} g | protein ${perServing.protein} g | sodium ${perServing.sodium} mg`)
console.log(`createdAt ${new Date(recipe.createdAt).toISOString().slice(0,16)} (global max was ${new Date(globalMax).toISOString().slice(0,16)})`)
console.log(`Pack -> ${pack.version}`)

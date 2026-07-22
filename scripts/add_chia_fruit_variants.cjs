/* Adds fruit variants of the Almond-Milk Chia Pudding (orn-13, mango) to the
   Fredheim Reversal Protocol pack:
     orn-24 pineapple · orn-25 forest berries · orn-26 blueberries
     orn-27 raspberries · orn-28 strawberries
   Only the 165 g frozen fruit changes between variants, so nutrition is
   computed exactly: BASE = orn-13 (per serving) minus mango's contribution,
   then each variant = BASE + that fruit's contribution. Fruit is 165 g over
   2 servings = 82.5 g/serving. Images are left null — photos arrive later;
   re-running preserves any imageUrl already added. */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const mango = pack.recipes.find(r => r.id === 'orn-13')
if (!mango) throw new Error('orn-13 (mango pudding) not found')

const KEYS = ['calories','protein','totalFat','saturatedFat','polyunsaturatedFat','monounsaturatedFat','omega3','omega6','cholesterol','totalCarbs','totalSugars','addedSugar','fiber','calcium','potassium','copper','iron','magnesium','manganese','selenium','phosphorus','zinc','sodium','vitaminA','vitaminB6','vitaminB12','vitaminC','vitaminD','vitaminE','vitaminK','folate','thiamin','riboflavin','niacin','choline']

// Per-100 g (raw ≈ frozen unsweetened), USDA. Missing → 0.
const F = {
  mango:      { calories:60, protein:0.82, totalFat:0.38, saturatedFat:0.092, polyunsaturatedFat:0.071, monounsaturatedFat:0.14, omega3:0.051, omega6:0.019, cholesterol:0, totalCarbs:14.98, totalSugars:13.66, addedSugar:0, fiber:1.6, calcium:11, potassium:168, copper:0.111, iron:0.16, magnesium:10, manganese:0.063, selenium:0.6, phosphorus:14, zinc:0.09, sodium:1, vitaminA:54, vitaminB6:0.119, vitaminB12:0, vitaminC:36.4, vitaminD:0, vitaminE:0.9, vitaminK:4.2, folate:43, thiamin:0.028, riboflavin:0.038, niacin:0.669, choline:7.6 },
  pineapple:  { calories:50, protein:0.54, totalFat:0.12, saturatedFat:0.009, polyunsaturatedFat:0.04, monounsaturatedFat:0.013, omega3:0.017, omega6:0.023, cholesterol:0, totalCarbs:13.12, totalSugars:9.85, addedSugar:0, fiber:1.4, calcium:13, potassium:109, copper:0.11, iron:0.29, magnesium:12, manganese:0.927, selenium:0.1, phosphorus:8, zinc:0.12, sodium:1, vitaminA:3, vitaminB6:0.112, vitaminB12:0, vitaminC:47.8, vitaminD:0, vitaminE:0.02, vitaminK:0.7, folate:18, thiamin:0.079, riboflavin:0.032, niacin:0.5, choline:5.5 },
  blueberry:  { calories:57, protein:0.74, totalFat:0.33, saturatedFat:0.028, polyunsaturatedFat:0.146, monounsaturatedFat:0.047, omega3:0.058, omega6:0.088, cholesterol:0, totalCarbs:14.49, totalSugars:9.96, addedSugar:0, fiber:2.4, calcium:6, potassium:77, copper:0.057, iron:0.28, magnesium:6, manganese:0.336, selenium:0.1, phosphorus:12, zinc:0.16, sodium:1, vitaminA:3, vitaminB6:0.052, vitaminB12:0, vitaminC:9.7, vitaminD:0, vitaminE:0.57, vitaminK:19.3, folate:6, thiamin:0.037, riboflavin:0.041, niacin:0.418, choline:6 },
  raspberry:  { calories:52, protein:1.2, totalFat:0.65, saturatedFat:0.019, polyunsaturatedFat:0.375, monounsaturatedFat:0.064, omega3:0.126, omega6:0.249, cholesterol:0, totalCarbs:11.94, totalSugars:4.42, addedSugar:0, fiber:6.5, calcium:25, potassium:151, copper:0.09, iron:0.69, magnesium:22, manganese:0.67, selenium:0.2, phosphorus:29, zinc:0.42, sodium:1, vitaminA:2, vitaminB6:0.055, vitaminB12:0, vitaminC:26.2, vitaminD:0, vitaminE:0.87, vitaminK:7.8, folate:21, thiamin:0.032, riboflavin:0.038, niacin:0.598, choline:12.3 },
  strawberry: { calories:32, protein:0.67, totalFat:0.3, saturatedFat:0.015, polyunsaturatedFat:0.155, monounsaturatedFat:0.043, omega3:0.065, omega6:0.09, cholesterol:0, totalCarbs:7.68, totalSugars:4.89, addedSugar:0, fiber:2, calcium:16, potassium:153, copper:0.048, iron:0.41, magnesium:13, manganese:0.386, selenium:0.4, phosphorus:24, zinc:0.14, sodium:1, vitaminA:1, vitaminB6:0.047, vitaminB12:0, vitaminC:58.8, vitaminD:0, vitaminE:0.29, vitaminK:2.2, folate:24, thiamin:0.024, riboflavin:0.022, niacin:0.386, choline:5.7 },
  blackberry: { calories:43, protein:1.39, totalFat:0.49, saturatedFat:0.014, polyunsaturatedFat:0.28, monounsaturatedFat:0.047, omega3:0.094, omega6:0.186, cholesterol:0, totalCarbs:9.61, totalSugars:4.88, addedSugar:0, fiber:5.3, calcium:29, potassium:162, copper:0.165, iron:0.62, magnesium:20, manganese:0.646, selenium:0.4, phosphorus:22, zinc:0.53, sodium:1, vitaminA:11, vitaminB6:0.03, vitaminB12:0, vitaminC:21, vitaminD:0, vitaminE:1.17, vitaminK:19.8, folate:25, thiamin:0.02, riboflavin:0.026, niacin:0.646, choline:8.5 },
}
// "Forest berries" = an even mix of blueberry, raspberry, strawberry, blackberry.
F.forest = {}
for (const k of KEYS) F.forest[k] = (F.blueberry[k] + F.raspberry[k] + F.strawberry[k] + F.blackberry[k]) / 4

const FRUIT_G = 82.5 // 165 g ÷ 2 servings

// BASE per serving = mango pudding minus the mango's 82.5 g contribution.
const base = {}
for (const k of KEYS) {
  const v = mango.nutrition.perServing[k]
  base[k] = (v == null ? 0 : v) - (F.mango[k] || 0) * (FRUIT_G / 100)
}

function round(v) {
  v = Math.max(0, v)
  if (v >= 100) return Math.round(v)
  if (v >= 10) return Math.round(v * 10) / 10
  if (v >= 1) return Math.round(v * 100) / 100
  return Math.round(v * 1000) / 1000
}
function nutritionFor(fruitKey) {
  const out = {}
  for (const k of KEYS) out[k] = round(base[k] + (F[fruitKey][k] || 0) * (FRUIT_G / 100))
  return out
}

// EN/NO/SV fruit words + the frozen-fruit ingredient line per language.
const VARIANTS = [
  { id: 'orn-24', key: 'pineapple',  en: 'Pineapple',     no: 'ananas',    sv: 'ananas',
    ingEn: 'Frozen pineapple, for blending',    ingNo: 'frossen ananas, til blending',   ingSv: 'fryst ananas, till mixning' },
  { id: 'orn-25', key: 'forest',     en: 'Forest Berries', no: 'skogsbær',  sv: 'skogsbär',
    ingEn: 'Frozen forest berries, for blending', ingNo: 'frosne skogsbær, til blending', ingSv: 'frysta skogsbär, till mixning' },
  { id: 'orn-26', key: 'blueberry',  en: 'Blueberries',   no: 'blåbær',    sv: 'blåbär',
    ingEn: 'Frozen blueberries, for blending',  ingNo: 'frosne blåbær, til blending',    ingSv: 'frysta blåbär, till mixning' },
  { id: 'orn-27', key: 'raspberry',  en: 'Raspberries',   no: 'bringebær', sv: 'hallon',
    ingEn: 'Frozen raspberries, for blending',  ingNo: 'frosne bringebær, til blending', ingSv: 'frysta hallon, till mixning' },
  { id: 'orn-28', key: 'strawberry', en: 'Strawberries',  no: 'jordbær',   sv: 'jordgubbar',
    ingEn: 'Frozen strawberries, for blending', ingNo: 'frosne jordbær, til blending',   ingSv: 'frysta jordgubbar, till mixning' },
]

// Step 2 as a template — the fruit is inserted in its indefinite frozen form
// (e.g. "frossen ananas", "frosne blåbær"), which the ingredient line already
// encodes correctly. This sidesteps per-fruit definite-article inflection that
// a naive mango→fruit swap gets wrong in Norwegian/Swedish.
const STEP2 = {
  en: (fz) => `Add the pitted dates and ${fz} to the almond milk and blend again until completely smooth — this replaces any added syrup.`,
  no: (fz) => `Tilsett de utstenede dadlene og ${fz} i mandelmelken, og kjør igjen til det er helt glatt — dette erstatter all tilsatt sirup.`,
  sv: (fz) => `Tillsätt de urkärnade dadlarna och ${fz} i mandelmjölken, och mixa igen tills det är helt slätt — detta ersätter all tillsatt sirap.`,
}
// Fruit-agnostic step 3 (avoids awkward "blueberries-almond milk").
const STEP3 = {
  en: 'Pour the blended mixture into a bowl or two jars, add the chia seeds, and stir well until fully combined with no dry pockets.',
  no: 'Hell blandingen i en bolle eller to glass, tilsett chiafrøene og rør godt sammen til alt er blandet, uten tørre klumper.',
  sv: 'Häll blandningen i en skål eller två burkar, tillsätt chiafröna och rör om ordentligt tills allt är blandat, utan torra fickor.',
}
// Indefinite frozen-fruit phrase per language (the ingredient line minus its
// trailing "for blending" / "til blending" / "till mixning").
function frozenPhrase(lang, v) {
  if (lang === 'en') return 'frozen ' + v.en.toLowerCase()
  if (lang === 'no') return v.ingNo.replace(/, til blending$/, '')
  return v.ingSv.replace(/, till mixning$/, '')
}

function mkIngredients(lang, v) {
  const src = lang === 'en' ? mango.ingredients : mango.translations[lang].ingredients
  return src.map((ing, i) => i === 4
    ? { quantity: 165, unit: 'g', name: v['ing' + lang[0].toUpperCase() + lang[1]] }
    : { quantity: ing.quantity, unit: ing.unit, name: ing.name })
}
// Fruit word for mid-sentence body text — always lower-case (EN titles are
// title-cased, but "blended with pineapple" must not be).
function bodyWord(lang, v) {
  return (lang === 'en' ? v.en.toLowerCase() : v[lang])
}
function mkSteps(lang, v) {
  const src = lang === 'en' ? mango.steps : mango.translations[lang].steps
  return src.map((s, i) => {
    if (i === 1) return STEP2[lang](frozenPhrase(lang, v))
    if (i === 2) return STEP3[lang]
    return s
  })
}
function mkDesc(lang, v) {
  const src = lang === 'en' ? mango.description : mango.translations[lang].description
  return src.replace(/mango/gi, bodyWord(lang, v))
}
function mkTitle(lang, v) {
  if (lang === 'en') return 'Sweet Almond Milk Chia Pudding with ' + v.en
  const base = lang === 'no' ? 'Chiapudding med søt mandelmelk og ' : 'Chiapudding med söt mandelmjölk och '
  return base + v[lang]
}

const CONDITION_TAGS = ['diabetes-friendly', 'blood-pressure-friendly', 'heart-healthy', 'weight-loss']
const prev = Object.fromEntries(pack.recipes.map(r => [r.id, r]))

const built = VARIANTS.map(v => {
  const nutrition = nutritionFor(v.key)
  const old = prev[v.id]
  return {
    id: v.id,
    title: mkTitle('en', v),
    category: 'Breakfast',
    servings: 2,
    prepTime: 10,
    cookTime: null,
    imageUrl: old?.imageUrl || null,
    description: mkDesc('en', v),
    tags: [
      'ornish-orange', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber',
      ...((old?.tags || []).filter(t => CONDITION_TAGS.includes(t))),
    ],
    kcal: Math.round(nutrition.calories),
    servingWeightGrams: 338,
    nutrition: { perServing: nutrition },
    ingredients: mkIngredients('en', v),
    steps: mkSteps('en', v),
    translations: {
      no: { title: mkTitle('no', v), description: mkDesc('no', v), ingredients: mkIngredients('no', v), steps: mkSteps('no', v) },
      sv: { title: mkTitle('sv', v), description: mkDesc('sv', v), ingredients: mkIngredients('sv', v), steps: mkSteps('sv', v) },
    },
  }
})

const builtIds = new Set(built.map(r => r.id))
pack.recipes = [...pack.recipes.filter(r => !builtIds.has(r.id)), ...built]
pack.version = '1.10.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log('Reversal pack ->', pack.version, '| recipes:', pack.recipes.length)
for (const r of built) {
  const n = r.nutrition.perServing
  console.log(`  ${r.id}  ${r.title.padEnd(48)} kcal ${n.calories}  sugar ${n.totalSugars}  fiber ${n.fiber}  vitC ${n.vitaminC}`)
}

/**
 * Add fr-214 Simple Garden Vegetable Soup to Fredheim Kitchen.
 * Oil-free water sauté, as written. 1000 ml low-sodium vegetable stock is
 * vegetable-broth (the liquid), note "low-sodium" — not bouillon powder.
 * 10 ml lemon juice is 2 tsp. Dried thyme is thyme-dried, 1 tsp.
 * Servings are chosen so a bowl lands near 350 g.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipeNutrition } from '../src/utils/nutritionEngine.js'
import { estimateRecipe, FIELDS, PACK_KEY, round } from './lib/recipeNutritionEstimate.mjs'
import { applySaltLevel } from './lib/saltLevels.mjs'

function perServingFromTotals(totals, servings) {
  const out = {}
  for (const f of FIELDS) out[PACK_KEY[f]] = round(totals[f] / servings, f)
  return out
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const PACKS = path.join(ROOT, 'recipe-packs-template/packs')
const ID = 'fr-214'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.some((r) => r.id === ID)) {
  console.log(`${ID} already present; pack ${pack.version}`)
  process.exit(0)
}

const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/ingredientDictionary.json'), 'utf8'))
const dictById = new Map(dict.entries.map((e) => [e.id, e]))
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/nutritionDb.json'), 'utf8'))

const ingredientsEn = [
  { quantity: 150, unit: 'g', ingredient: 'onions', name: 'Onions', note: 'diced' },
  { quantity: 250, unit: 'g', ingredient: 'mushrooms', name: 'Mushrooms', note: 'small, halved or sliced' },
  { quantity: 200, unit: 'g', ingredient: 'carrots', name: 'Carrots', note: 'finely chopped' },
  { quantity: 200, unit: 'g', ingredient: 'bell-peppers', name: 'Bell peppers', note: 'red, diced' },
  { quantity: 2, unit: 'clove', ingredient: 'garlic', name: 'Garlic', note: 'minced' },
  { quantity: 1, unit: 'tsp', ingredient: 'thyme-dried', name: 'Thyme, dried' },
  { quantity: 1, unit: 'l', ingredient: 'vegetable-broth', name: 'Vegetable broth', note: 'low-sodium' },
  { quantity: 200, unit: 'g', ingredient: 'green-peas', name: 'Green peas', note: 'frozen' },
  { quantity: 20, unit: 'g', ingredient: 'parsley', name: 'Parsley', note: 'fresh, chopped' },
  { quantity: 2, unit: 'tsp', ingredient: 'lemon-juice', name: 'Lemon juice' },
  { quantity: 0.25, unit: 'tsp', ingredient: 'salt', name: 'Salt' },
]

const ingredientsNo = [
  { quantity: 150, unit: 'g', ingredient: 'onions', name: 'Løk', note: 'i terninger' },
  { quantity: 250, unit: 'g', ingredient: 'mushrooms', name: 'Sopp', note: 'små, delt i to eller skivet' },
  { quantity: 200, unit: 'g', ingredient: 'carrots', name: 'Gulrøtter', note: 'finhakket' },
  { quantity: 200, unit: 'g', ingredient: 'bell-peppers', name: 'Paprika', note: 'rød, i terninger' },
  { quantity: 2, unit: 'fedd', ingredient: 'garlic', name: 'Hvitløk', note: 'finhakket' },
  { quantity: 1, unit: 'ts', ingredient: 'thyme-dried', name: 'Timian, tørket' },
  { quantity: 1, unit: 'l', ingredient: 'vegetable-broth', name: 'Grønnsakskraft', note: 'natriumredusert' },
  { quantity: 200, unit: 'g', ingredient: 'green-peas', name: 'Grønne erter', note: 'frosne' },
  { quantity: 20, unit: 'g', ingredient: 'parsley', name: 'Persille', note: 'fersk, hakket' },
  { quantity: 2, unit: 'ts', ingredient: 'lemon-juice', name: 'Sitronsaft' },
  { quantity: 0.25, unit: 'ts', ingredient: 'salt', name: 'Salt' },
]

const ingredientsSv = [
  { quantity: 150, unit: 'g', ingredient: 'onions', name: 'Lök', note: 'tärnad' },
  { quantity: 250, unit: 'g', ingredient: 'mushrooms', name: 'Svamp', note: 'små, halverade eller skivade' },
  { quantity: 200, unit: 'g', ingredient: 'carrots', name: 'Morötter', note: 'finhackade' },
  { quantity: 200, unit: 'g', ingredient: 'bell-peppers', name: 'Paprika', note: 'röd, tärnad' },
  { quantity: 2, unit: 'klyfta', ingredient: 'garlic', name: 'Vitlök', note: 'finhackad' },
  { quantity: 1, unit: 'tsk', ingredient: 'thyme-dried', name: 'Timjan, torkad' },
  { quantity: 1, unit: 'l', ingredient: 'vegetable-broth', name: 'Grönsakskraft', note: 'natriumreducerad' },
  { quantity: 200, unit: 'g', ingredient: 'green-peas', name: 'Gröna ärtor', note: 'frysta' },
  { quantity: 20, unit: 'g', ingredient: 'parsley', name: 'Persilja', note: 'färsk, hackad' },
  { quantity: 2, unit: 'tsk', ingredient: 'lemon-juice', name: 'Citronsaft' },
  { quantity: 0.25, unit: 'tsk', ingredient: 'salt', name: 'Salt' },
]

for (const [lang, list] of [['en', ingredientsEn], ['no', ingredientsNo], ['sv', ingredientsSv]]) {
  for (const row of list) {
    const entry = dictById.get(row.ingredient)
    if (!entry) throw new Error(`missing dictionary id ${row.ingredient}`)
    if (row.name !== entry.names[lang]) {
      throw new Error(`${row.ingredient} ${lang} name "${row.name}" ≠ "${entry.names[lang]}"`)
    }
  }
}

const stepsEn = [
  'Heat a large dry pot over medium-high heat. Add the onion with a splash of water and cook until soft and lightly golden, adding a little more water if it sticks. (5 min)',
  'Add the mushrooms and cook until they release their liquid and start to brown. (5 min)',
  'Add the carrots, bell pepper, garlic and thyme. Stir and cook briefly until fragrant. (2 min)',
  'Pour in the vegetable broth. Bring to a boil, then simmer until the carrots are tender. (12 min)',
  'Add the frozen peas and simmer until bright green and heated through. (3 min)',
  'Take off the heat. Stir in the parsley, lemon juice and salt. Taste and adjust.',
]

const stepsNo = [
  'Varm en stor, tørr gryte på middels sterk varme. Ha i løken med en skvett vann og la den bli myk og lett gyllen. Ha i litt mer vann hvis den setter seg. (5 min)',
  'Ha i soppen og stek til den slipper væske og begynner å ta farge. (5 min)',
  'Ha i gulrøtter, paprika, hvitløk og timian. Rør og la det steke kort til det dufter. (2 min)',
  'Hell i grønnsakskraften. Kok opp, og la suppen småkoke til gulrøttene er møre. (12 min)',
  'Ha i de frosne ertene og la det småkoke til de er klart grønne og gjennomvarme. (3 min)',
  'Ta gryten av platen. Rør inn persille, sitronsaft og salt. Smak til.',
]

const stepsSv = [
  'Hetta upp en stor torr gryta på medelhög värme. Lägg i löken med en skvätt vatten och låt den bli mjuk och lätt gyllene. Häll i lite mer vatten om den fastnar. (5 min)',
  'Lägg i svampen och stek tills den släpper vätska och börjar få färg. (5 min)',
  'Lägg i morötter, paprika, vitlök och timjan. Rör om och stek kort tills det doftar. (2 min)',
  'Häll i grönsakskraften. Koka upp och låt sjuda tills morötterna är mjuka. (12 min)',
  'Lägg i de frysta ärtorna och låt sjuda tills de är klart gröna och genomvarma. (3 min)',
  'Ta grytan av värmen. Rör ner persilja, citronsaft och salt. Smaka av.',
]

const notesEn =
  'Allergens: none of the top five. Check the stock label for celery (an EU allergen) and for hidden sugar. Keeps 4 days in the fridge. Freezes well without the parsley.'
const notesNo =
  'Allergener: ingen av de fem vanligste. Sjekk kraften for selleri (et EU-allergen) og for skjult sukker. Holder 4 dager i kjøleskapet. Fryser godt uten persillen.'
const notesSv =
  'Allergener: inga av de fem vanligaste. Kolla kraften för selleri (ett EU-allergen) och för dolt socker. Håller 4 dagar i kylen. Fryser bra utan persiljan.'

let maxCreated = 0
for (const file of fs.readdirSync(PACKS).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(fs.readFileSync(path.join(PACKS, file), 'utf8'))
  for (const r of p.recipes || []) {
    const t = typeof r.createdAt === 'number' ? r.createdAt : Date.parse(r.createdAt) || 0
    if (t > maxCreated) maxCreated = t
  }
}

const recipe = {
  id: ID,
  title: 'Simple Garden Vegetable Soup',
  category: 'Soup',
  servings: 4,
  portion: '1 bowl',
  prepTime: 15,
  cookTime: 27,
  imageUrl: '/pack-images/fr-214.jpg',
  description:
    'Light, golden vegetable soup with mushrooms and peas, finished with parsley and a touch of lemon.',
  tags: ['fredheim'],
  mealTypes: ['lunch', 'dinner'],
  kcal: 0,
  servingWeightGrams: 0,
  ingredients: ingredientsEn,
  steps: stepsEn,
  notes: notesEn,
  translations: {
    no: {
      title: 'Enkel hagesuppe',
      description:
        'Lett, gyllen suppe med sopp og erter, avsluttet med persille og en skvett sitron.',
      ingredients: ingredientsNo,
      steps: stepsNo,
      notes: notesNo,
      portion: '1 bolle',
    },
    sv: {
      title: 'Enkel grönsakssoppa',
      description:
        'Lätt, gyllene soppa med svamp och ärtor, avslutad med persilja och en skvätt citron.',
      ingredients: ingredientsSv,
      steps: stepsSv,
      notes: notesSv,
      portion: '1 skål',
    },
  },
  nutrition: { perServing: {} },
  createdAt: Math.max(Date.now(), maxCreated + 1),
}

const est = estimateRecipe(recipe)
if (est.problems.length) {
  console.error(est.problems)
  process.exit(1)
}

let bestN = 4
let bestDiff = Infinity
for (let n = 4; n <= 8; n++) {
  const diff = Math.abs(est.weight / n - 350)
  if (diff < bestDiff) {
    bestDiff = diff
    bestN = n
  }
}
recipe.servings = bestN
const servingW = Math.round(est.weight / recipe.servings)
recipe.servingWeightGrams = servingW
recipe.portion = `1 bowl (~${servingW} g)`
recipe.translations.no.portion = `1 bolle (~${servingW} g)`
recipe.translations.sv.portion = `1 skål (~${servingW} g)`

const per = perServingFromTotals(est.totals, recipe.servings)
const recipeById = Object.fromEntries(pack.recipes.map((r) => [r.id, r]))
const live = estimateRecipeNutrition(recipe, db, { saltLevel: 'low', recipeById })
recipe.nutrition.perServing = { ...live.perServing, ...per }
recipe.kcal = Math.round(per.calories)

const salt = applySaltLevel(recipe, dictById)

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
const from = pack.version
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
pack.updatedAt = new Date().toISOString()
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(JSON.stringify({
  id: ID,
  titles: {
    en: recipe.title,
    no: recipe.translations.no.title,
    sv: recipe.translations.sv.title,
  },
  servings: recipe.servings,
  batchGrams: Math.round(est.weight),
  portion: recipe.portion,
  prepTime: recipe.prepTime,
  cookTime: recipe.cookTime,
  perServing: per,
  sodiumStandard: recipe.nutrition.sodiumStandard,
  salt,
  liveCalories: live.perServing.calories,
  liveSodium: live.perServing.sodium,
  liveWarnings: live.warnings?.slice(0, 8),
  pack: `${from} -> ${pack.version}`,
  createdAt: recipe.createdAt,
  maxCreatedBefore: maxCreated,
}, null, 2))

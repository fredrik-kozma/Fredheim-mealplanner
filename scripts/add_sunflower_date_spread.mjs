/**
 * Add fr-215 Sunflower & Date Spread to Fredheim Kitchen.
 * Four ingredients only: hulled sunflower seeds, pitted soft dates, water, salt.
 * Oven toast at 175 °C. Proposed formulation, not kitchen-tested.
 * Salt is 0.5 g exactly (dictionary unit tsp at 6 g/tsp).
 * weighGrams is the amount the recipe and shopping list show, because
 * 1/12 tsp would otherwise be drawn as ¼ tsp.
 * Base yield uses 80 ml water (~300.5 g → 15 × 20 g). Extra water up to
 * 110 ml total is a note, not a second row.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipeNutrition, diffAgainstPack, rowGrams as liveRowGrams } from '../src/utils/nutritionEngine.js'
import { estimateRecipe, rowGrams } from './lib/recipeNutritionEstimate.mjs'
import { analyzeRecipe, withLabels } from './lib/recipeLabels.mjs'
import { applySaltLevel, classifyFlavour, needsFlavour } from './lib/saltLevels.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const PACKS = path.join(ROOT, 'recipe-packs-template/packs')
const ID = 'fr-215'
const SALT_TSP = 0.5 / 6

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.some((r) => r.id === ID)) {
  console.log(`${ID} already present; pack ${pack.version}`)
  process.exit(0)
}

const dict = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/ingredientDictionary.json'), 'utf8'))
const dictById = new Map(dict.entries.map((e) => [e.id, e]))
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/nutritionDb.json'), 'utf8'))

const ingredientsEn = [
  { quantity: 120, unit: 'g', ingredient: 'sunflower-seeds', name: 'Sunflower seeds', note: 'raw, hulled, unsalted' },
  { quantity: 100, unit: 'g', ingredient: 'dates-dried', name: 'Dried dates', note: 'soft, weighed after the pits are removed' },
  { quantity: 80, unit: 'ml', ingredient: 'water', name: 'Water', note: 'start with this; up to 110 ml in total only if needed for a spreadable texture' },
  { quantity: SALT_TSP, unit: 'tsp', ingredient: 'salt', name: 'Salt', weighGrams: 0.5 },
]

const ingredientsNo = [
  { quantity: 120, unit: 'g', ingredient: 'sunflower-seeds', name: 'Solsikkefrø', note: 'rå, avskallede, usaltede' },
  { quantity: 100, unit: 'g', ingredient: 'dates-dried', name: 'Tørkede dadler', note: 'myke, veid etter at steinene er tatt ut' },
  { quantity: 80, unit: 'ml', ingredient: 'water', name: 'Vann', note: 'start med dette; opptil 110 ml totalt bare hvis det trengs for smørbar konsistens' },
  { quantity: SALT_TSP, unit: 'ts', ingredient: 'salt', name: 'Salt', weighGrams: 0.5 },
]

const ingredientsSv = [
  { quantity: 120, unit: 'g', ingredient: 'sunflower-seeds', name: 'Solrosfrön', note: 'råa, skalade, osaltade' },
  { quantity: 100, unit: 'g', ingredient: 'dates-dried', name: 'Torkade dadlar', note: 'mjuka, vägda efter att kärnorna tagits ur' },
  { quantity: 80, unit: 'ml', ingredient: 'water', name: 'Vatten', note: 'börja med detta; upp till 110 ml totalt bara om det behövs för bredbar konsistens' },
  { quantity: SALT_TSP, unit: 'tsk', ingredient: 'salt', name: 'Salt', weighGrams: 0.5 },
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

const saltGrams = rowGrams(ingredientsEn[3]).grams
const saltGramsLive = liveRowGrams(ingredientsEn[3], db).grams
if (Math.abs(saltGrams - 0.5) > 1e-9 || Math.abs(saltGramsLive - 0.5) > 1e-9) {
  throw new Error(`salt must stay 0.5 g, got estimate ${saltGrams} live ${saltGramsLive}`)
}

const stepsEn = [
  'Heat the oven to 175 °C before the seeds go in. Spread the sunflower seeds in a single layer on a dry tray. No oil.',
  'Toast for about 10 minutes, stirring halfway through. They should be lightly golden and smell fragrant, and not dark. (10 min)',
  'Tip the seeds onto a cool plate, or leave them on the tray, until they are completely cool. Do not grind them warm: they turn greasy, and a warm load can overheat the machine. (20 min)',
  'If the dates are firm, soak them in hot water for 10–15 minutes, then drain well and let them cool. Soft dates need no soak. Do not use the soaking water in the spread.',
  'Grind the cooled seeds in a small food processor until they are very fine and just beginning to clump. Pause and scrape the bowl down if the machine gets warm.',
  'Add the dates, the salt and 80 ml fresh water. Blend until creamy, scraping down as needed. If the spread is still too stiff, add more water a teaspoon at a time, and stop at 110 ml of water in total. Chill it before you judge the texture. It thickens as it cools.',
  'Spoon it into a clean jar and refrigerate at once. Keeps 3–4 days if you use a clean spoon each time. Freeze portions for up to 2 months and thaw them in the fridge. Not shelf stable.',
]

const stepsNo = [
  'Varm ovnen til 175 °C før frøene settes inn. Fordel solsikkefrøene i ett lag på et tørt brett. Uten olje.',
  'Rist i omtrent 10 minutter, og rør halvveis. De skal være lett gylne og dufte, ikke mørke. (10 min)',
  'Hell frøene over på en kald tallerken, eller la dem ligge på brettet, til de er helt avkjølt. Ikke kjør dem varme: de blir fete, og en varm porsjon kan overopphete maskinen. (20 min)',
  'Hvis dadlene er faste, bløtlegg dem i varmt vann i 10–15 minutter, hell godt av og la dem avkjøles. Myke dadler trenger ikke bløtlegging. Ikke bruk bløtevannet i pålegget.',
  'Kjør de avkjølte frøene i en liten foodprosessor til de er svært fine og så vidt begynner å klumpe seg. Stans og skrap ned bollen hvis maskinen blir varm.',
  'Ha i dadlene, saltet og 80 ml friskt vann. Kjør til det er kremet, og skrap ned etter behov. Hvis pålegget fortsatt er for stivt, tilsett mer vann en teskje om gangen, og stopp ved 110 ml vann totalt. Avkjøl det før du vurderer konsistensen. Det stivner når det blir kaldt.',
  'Ha det i et rent glass og sett det kaldt med en gang. Holder 3–4 dager når du bruker en ren skje hver gang. Frys porsjoner i opptil 2 måneder og tin i kjøleskapet. Ikke holdbart i romtemperatur.',
]

const stepsSv = [
  'Värm ugnen till 175 °C innan fröna ställs in. Fördela solrosfröna i ett lager på en torr plåt. Utan olja.',
  'Rosta i ungefär 10 minuter och rör om halvvägs. De ska vara ljust gyllene och dofta, inte mörka. (10 min)',
  'Häll över fröna på ett kallt fat, eller låt dem ligga kvar på plåten, tills de är helt svala. Mixa dem inte varma: de blir feta, och en varm sats kan överhetta maskinen. (20 min)',
  'Om dadlarna är fasta, blötlägg dem i hett vatten i 10–15 minuter, häll av väl och låt dem svalna. Mjuka dadlar behöver inte blötläggas. Använd inte blötläggningsvattnet i pålägget.',
  'Mixa de svala fröna i en liten matberedare tills de är mycket fina och precis börjar klumpa ihop sig. Stanna och skrapa ner skålen om maskinen blir varm.',
  'Tillsätt dadlarna, saltet och 80 ml färskt vatten. Mixa tills det är krämigt och skrapa ner vid behov. Om pålägget fortfarande är för styvt, tillsätt mer vatten en tesked i taget och stanna vid 110 ml vatten totalt. Kyl det innan du bedömer konsistensen. Det tjocknar när det kallnar.',
  'Lägg det i en ren burk och ställ kallt genast. Håller 3–4 dagar om du använder en ren sked varje gång. Frys portioner i upp till 2 månader och tina i kylen. Inte hållbar i rumstemperatur.',
]

const notesEn =
  'Proposed formulation, not kitchen-tested. With the 80 ml of water in the recipe the batch is about 300 g, 15 portions of 20 g. Up to 110 ml of water in total, only if the spread needs it to become spreadable, brings the yield toward about 330 g. That extra water is not a second ingredient line. Firm dates need an extra 10–15 minutes to soak, which is not included in the time above; soft dates do not. Allergens: none of the usual main ones (no gluten, nuts, soy, dairy or sesame). Sunflower seeds can still bother someone with a seed allergy. Spread it on bread or crispbread, or eat it with porridge. Do not add other ingredients. Refrigerate promptly in an airtight jar and use a clean spoon; eat within 3–4 days. Not shelf stable. Freeze portions for up to 2 months and thaw them in the fridge.'
const notesNo =
  'Foreslått oppskrift, ikke prøvd på kjøkkenet. Med de 80 ml vannet i oppskriften blir porsjonen omtrent 300 g, 15 porsjoner à 20 g. Opptil 110 ml vann totalt, bare hvis pålegget trenger det for å bli smørbart, gir nærmere omtrent 330 g. Det ekstra vannet er ikke en egen ingredienslinje. Faste dadler trenger 10–15 minutter ekstra bløtlegging, som ikke er med i tiden over; myke dadler trenger det ikke. Allergener: ingen av de vanlige viktigste (ikke gluten, nøtter, soya, melk eller sesam). Solsikkefrø kan likevel plage noen med frøallergi. Brukes som pålegg på brød eller knekkebrød, eller til grøt. Ikke tilsett andre ingredienser. Sett kaldt med en gang i et tett glass og bruk en ren skje; spis innen 3–4 dager. Ikke holdbart i romtemperatur. Frys porsjoner i opptil 2 måneder og tin i kjøleskapet.'
const notesSv =
  'Föreslaget recept, inte provlagat. Med de 80 ml vatten som står i receptet blir satsen ungefär 300 g, 15 portioner à 20 g. Upp till 110 ml vatten totalt, bara om pålägget behöver det för att bli bredbart, ger närmare ungefär 330 g. Det extra vattnet är inte en egen ingrediensrad. Fasta dadlar behöver 10–15 minuter extra blötläggning, som inte ingår i tiden ovan; mjuka dadlar behöver det inte. Allergener: inga av de vanliga viktigaste (inte gluten, nötter, soja, mjölk eller sesam). Solrosfrön kan ändå besvära någon med fröallergi. Används som pålägg på bröd eller knäckebröd, eller till gröt. Tillsätt inga andra ingredienser. Ställ kallt genast i en tät burk och använd en ren sked; ät inom 3–4 dagar. Inte hållbar i rumstemperatur. Frys portioner i upp till 2 månader och tina i kylen.'

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
  title: 'Sunflower & Date Spread',
  category: 'Spreads',
  servings: 15,
  portion: '20 g',
  prepTime: 15,
  cookTime: 30,
  imageUrl: '/pack-images/fr-215.jpg',
  description:
    'A naturally sweet, creamy spread of lightly toasted sunflower seeds and soft dates. Four ingredients, for bread or porridge. A proposed formulation, not kitchen-tested.',
  tags: ['fredheim'],
  mealTypes: ['component'],
  kcal: 0,
  servingWeightGrams: 20,
  ingredients: ingredientsEn,
  steps: stepsEn,
  notes: notesEn,
  translations: {
    no: {
      title: 'Solsikke- og daddelpålegg',
      description:
        'Et naturlig søtt, kremet pålegg av lett ristede solsikkefrø og myke dadler. Fire ingredienser, til brød eller grøt. Foreslått oppskrift, ikke prøvd på kjøkkenet.',
      ingredients: ingredientsNo,
      steps: stepsNo,
      notes: notesNo,
      portion: '20 g',
    },
    sv: {
      title: 'Solros- och dadelpålägg',
      description:
        'Ett naturligt sött, krämigt pålägg av lätt rostade solrosfrön och mjuka dadlar. Fyra ingredienser, till bröd eller gröt. Föreslaget recept, inte provlagat.',
      ingredients: ingredientsSv,
      steps: stepsSv,
      notes: notesSv,
      portion: '20 g',
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

const recipeById = Object.fromEntries(pack.recipes.map((r) => [r.id, r]))
const live = estimateRecipeNutrition(recipe, db, { saltLevel: 'low', recipeById })
if (live.warnings?.length) {
  console.error(live.warnings)
  process.exit(1)
}
recipe.nutrition.perServing = live.perServing
recipe.kcal = Math.round(live.perServing.calories)

const cmp = diffAgainstPack(live.perServing, recipe.nutrition.perServing)
if (!cmp.ok) {
  console.error(cmp.diffs)
  process.exit(1)
}

if (!needsFlavour(recipe)) throw new Error('a spread must take a flavour profile')
const flavour = classifyFlavour(recipe)
if (flavour.profile !== 'sweet') {
  throw new Error(`expected sweet, classifyFlavour said ${flavour.profile} (${flavour.why})`)
}
recipe.flavourProfile = flavour.profile

const salt = applySaltLevel(recipe, dictById)
if (!salt.skipped) {
  throw new Error(`sweet spread must not get a standard salt increase: ${JSON.stringify(salt)}`)
}
for (const list of [recipe.ingredients, recipe.translations.no.ingredients, recipe.translations.sv.ingredients]) {
  for (const row of list) {
    if (row.standardAmount != null || row.standardUnit != null) {
      throw new Error('standard salt amount was written onto a sweet spread')
    }
  }
}
if (recipe.nutrition.sodiumStandard != null) throw new Error('sodiumStandard set on a sweet spread')

const analysis = analyzeRecipe(recipe, new Map(Object.entries(recipeById)), { storedMealTypes: true })
recipe.tags = withLabels(recipe.tags, analysis.proposed)

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
const from = pack.version
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
pack.updatedAt = new Date().toISOString()
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(JSON.stringify({
  id: ID,
  titles: { en: recipe.title, no: recipe.translations.no.title, sv: recipe.translations.sv.title },
  servings: recipe.servings,
  servingWeightGrams: recipe.servingWeightGrams,
  portion: recipe.portion,
  batchGrams: Math.round(est.weight * 10) / 10,
  liveGrams: live.gramsTotal,
  prepTime: recipe.prepTime,
  cookTime: recipe.cookTime,
  saltGrams,
  saltTsp: SALT_TSP,
  flavour,
  salt,
  perServing: recipe.nutrition.perServing,
  tags: recipe.tags,
  labelWhy: Object.fromEntries(Object.entries(analysis.labels).map(([k, v]) => [k, v.why])),
  pack: `${from} -> ${pack.version}`,
  createdAt: recipe.createdAt,
  maxCreatedBefore: maxCreated,
}, null, 2))

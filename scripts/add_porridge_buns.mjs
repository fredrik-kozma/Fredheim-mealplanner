/**
 * Add fr-213 Gluten-Free Porridge Buns.
 * Base batch: 8 buns / 8 servings (Fredrik's text was ~6.5× a ~3.7-bun unit;
 * 2× that unit → 8 buns, one tray, same hydration).
 * Psyllium in grams (4 tbsp × 8.1 g). Salt low 1 tsp / standard 1.5.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipeNutrition } from '../src/utils/nutritionEngine.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const ID = 'fr-213'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.some((r) => r.id === ID)) {
  console.log(`${ID} already present; pack ${pack.version}`)
  process.exit(0)
}

const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/nutritionDb.json'), 'utf8'))

const ingredientsEn = [
  { quantity: 650, unit: 'g', ingredient: 'oat-porridge-cooked', name: 'Oat porridge, cooked', note: 'leftover, cooked in water, unsalted' },
  { quantity: 350, unit: 'g', ingredient: 'rolled-oats', name: 'Rolled oats', note: 'certified gluten-free if needed; blend to flour' },
  { quantity: 32, unit: 'g', ingredient: 'psyllium-husk', name: 'Psyllium husk', note: 'powder; ~4 tbsp' },
  { quantity: 2, unit: 'tsp', ingredient: 'dry-yeast', name: 'Dry yeast', note: 'instant' },
  { quantity: 30, unit: 'g', ingredient: 'pumpkin-seeds', name: 'Pumpkin seeds', note: 'reserve some for topping' },
  { quantity: 1, unit: 'tsp', ingredient: 'salt', name: 'Salt', standardAmount: 1.5 },
]

const ingredientsNo = [
  { quantity: 650, unit: 'g', ingredient: 'oat-porridge-cooked', name: 'Havregrøt, kokt', note: 'rest, kokt i vann, usaltet' },
  { quantity: 350, unit: 'g', ingredient: 'rolled-oats', name: 'Havregryn', note: 'sertifisert glutenfri ved behov; males til mel' },
  { quantity: 32, unit: 'g', ingredient: 'psyllium-husk', name: 'Psylliumfrøskall', note: 'pulver; ca. 4 ss' },
  { quantity: 2, unit: 'ts', ingredient: 'dry-yeast', name: 'Tørrgjær', note: 'instant' },
  { quantity: 30, unit: 'g', ingredient: 'pumpkin-seeds', name: 'Gresskarkjerner', note: 'sett noen til side til topping' },
  { quantity: 1, unit: 'ts', ingredient: 'salt', name: 'Salt', standardAmount: 1.5 },
]

const ingredientsSv = [
  { quantity: 650, unit: 'g', ingredient: 'oat-porridge-cooked', name: 'Havregröt, kokt', note: 'överbliven, kokt i vatten, osaltad' },
  { quantity: 350, unit: 'g', ingredient: 'rolled-oats', name: 'Havregryn', note: 'certifierat glutenfritt vid behov; mixas till mjöl' },
  { quantity: 32, unit: 'g', ingredient: 'psyllium-husk', name: 'Psylliumfröskal', note: 'pulver; ca. 4 msk' },
  { quantity: 2, unit: 'tsk', ingredient: 'dry-yeast', name: 'Torrjäst', note: 'instant' },
  { quantity: 30, unit: 'g', ingredient: 'pumpkin-seeds', name: 'Pumpakärnor', note: 'spara en del till topping' },
  { quantity: 1, unit: 'tsk', ingredient: 'salt', name: 'Salt', standardAmount: 1.5 },
]

const stepsEn = [
  'Blend the rolled oats in a blender until fine flour.',
  'Warm the leftover oat porridge gently until just lukewarm (about body temperature) and stir until smooth. Too hot will kill the yeast. (3 min)',
  'In a large bowl, stir the yeast and salt into the porridge. Add the oat flour, psyllium husk powder and most of the pumpkin seeds, keeping some seeds for the top. Mix with a spoon, then your hands, until it forms one soft, sticky dough.',
  'Leave the dough to rest so the psyllium can firm it up. (10 min)',
  'Line one baking tray with parchment. With wet hands, roll the dough into 8 round buns and place them on the tray. Press the reserved pumpkin seeds on top.',
  'Cover with a tea towel and let rise while the oven heats to 210 °C (fan 200 °C). The buns will puff a little, not double. (45 min)',
  'Bake until golden and they sound hollow when tapped underneath. (30 min)',
  'Cool on a wire rack before eating. Psyllium buns are gummy when warm and set as they cool. (30 min)',
]

const stepsNo = [
  'Kjør havregrynene i en blender til fint mel.',
  'Varm restene av havregrøten forsiktig til den er lunken (omtrent kroppstemperatur) og rør til den er glatt. For varm grøt dreper gjæren. (3 min)',
  'Rør gjær og salt inn i grøten i en stor bolle. Tilsett havremelet, psylliumfrøskallpulveret og det meste av gresskarkjernene; sett noen til side til topping. Bland med skje og deretter hendene til en myk, klebrig deig.',
  'La deigen hvile så psylliumet kan stramme den. (10 min)',
  'Bekled ett stekebrett med bakepapir. Med våte hender, form 8 runde boller og legg dem på brettet. Trykk de avsatte gresskarkjernene på toppen.',
  'Dekk med et kjøkkenhåndkle og la heve mens ovnen varmes til 210 °C (varmluft 200 °C). Bollene hever litt, de dobler seg ikke. (45 min)',
  'Stek til de er gyldne og høres hule ut når du banker under. (30 min)',
  'Avkjøl på rist før du spiser. Psylliumboller er gummiaktige varme og setter seg når de avkjøles. (30 min)',
]

const stepsSv = [
  'Mixa havregrynen i en blender till fint mjöl.',
  'Värm den överblivna havregröten försiktigt tills den är ljummen (ungefär kroppstemperatur) och rör tills den är slät. För varm gröt dödar jästen. (3 min)',
  'Rör ner jäst och salt i gröten i en stor skål. Tillsätt havremjölet, psylliumfröskalspulvret och merparten av pumpakärnorna; spara en del till topping. Blanda med sked och sedan händerna till en mjuk, klibbig deg.',
  'Låt degen vila så att psylliumet kan strama åt den. (10 min)',
  'Klä en plåt med bakplåtspapper. Forma 8 runda bullar med blöta händer och lägg dem på plåten. Tryck ner de sparade pumpakärnorna på toppen.',
  'Täck med en handduk och låt jäsa medan ugnen värms till 210 °C (varmluft 200 °C). Bullarna jäser lite, de fördubblas inte. (45 min)',
  'Grädda tills de är gyllene och låter ihåliga när du knackar under. (30 min)',
  'Svalna på galler innan du äter. Psylliumbullar är gummiaktiga varma och sätter sig när de svalnar. (30 min)',
]

const notesEn =
  'Allergens: none of the top five. Gluten-free only if the oats are certified gluten-free. If your porridge was cooked with salt, halve the salt in this recipe. If the dough feels too stiff to shape, add a splash of water; if too sticky, add a little more oat flour. Oil-free, nut-free, sesame-free.'
const notesNo =
  'Allergener: ingen av de fem vanligste. Glutenfri bare hvis havren er sertifisert glutenfri. Hvis grøten din var kokt med salt, halvér saltet i denne oppskriften. Hvis deigen føles for stiv å forme, tilsett en skvett vann; hvis den er for klebrig, tilsett litt mer havremel. Oljefri, nøttefri, sesamfri.'
const notesSv =
  'Allergener: inga av de fem vanligaste. Glutenfri bara om havren är certifierat glutenfri. Om gröten kokades med salt, halvera saltet i det här receptet. Om degen känns för styv att forma, tillsätt en skvätt vatten; om den är för klibbig, tillsätt lite mer havremjöl. Oljefri, nötfri, sesamfri.'

const recipe = {
  id: ID,
  title: 'Gluten-Free Porridge Buns',
  category: 'Bread',
  servings: 8,
  portion: '1 bun',
  prepTime: 80,
  cookTime: 30,
  imageUrl: '/pack-images/fr-213.jpg',
  description:
    'Soft, seeded gluten-free buns from leftover oat porridge, oat flour and psyllium. One rise, oil-free, nut-free, sesame-free.',
  tags: ['fredheim', 'oil-free', 'nut-free', 'sesame-free', 'batch-friendly'],
  mealTypes: ['breakfast', 'lunch', 'side'],
  kcal: 0,
  servingWeightGrams: 0,
  ingredients: ingredientsEn,
  steps: stepsEn,
  notes: notesEn,
  translations: {
    no: {
      title: 'Glutenfrie grøtboller',
      description:
        'Myke, frøede glutenfrie boller av rest havregrøt, havremel og psyllium. Én heving, oljefrie, nøttefrie, sesamfrie.',
      ingredients: ingredientsNo,
      steps: stepsNo,
      notes: notesNo,
      portion: '1 bolle',
    },
    sv: {
      title: 'Glutenfria grötbullar',
      description:
        'Mjuka, fröade glutenfria bullar av överbliven havregröt, havremjöl och psyllium. En jäsning, oljefria, nötfria, sesamfria.',
      ingredients: ingredientsSv,
      steps: stepsSv,
      notes: notesSv,
      portion: '1 bulle',
    },
  },
  nutrition: { perServing: {} },
  createdAt: Date.now(),
  flavourProfile: 'savoury',
}

const recipeById = Object.fromEntries(pack.recipes.map((r) => [r.id, r]))
const live = estimateRecipeNutrition(recipe, db, { saltLevel: 'low', recipeById })
if (live.warnings?.length) console.log('warnings', live.warnings.slice(0, 8))
const per = live.perServing
recipe.nutrition.perServing = per
recipe.kcal = Math.round(per.calories || 0)

// Batch weight from engine if available
const batchG = live.totalGrams || live.batchGrams || live.weightGrams
let servingW
if (batchG) servingW = Math.round(batchG / recipe.servings)
else {
  // fallback: sum ingredient grams roughly
  servingW = Math.round((650 + 350 + 32 + 6 + 30 + 6) / 8)
}
recipe.servingWeightGrams = servingW
recipe.portion = `1 bun (~${servingW} g)`
recipe.translations.no.portion = `1 bolle (~${servingW} g)`
recipe.translations.sv.portion = `1 bulle (~${servingW} g)`

// sodiumStandard at standard salt
const liveStd = estimateRecipeNutrition(recipe, db, { saltLevel: 'standard', recipeById })
recipe.nutrition.sodiumStandard = Math.round(liveStd.perServing.sodium || 0)

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
const from = pack.version
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
pack.updatedAt = new Date().toISOString()
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(JSON.stringify({
  id: ID,
  title: recipe.title,
  no: recipe.translations.no.title,
  sv: recipe.translations.sv.title,
  servings: recipe.servings,
  buns: 8,
  portion: recipe.portion,
  ingredients: ingredientsEn,
  perServing: {
    calories: per.calories,
    protein: per.protein,
    fiber: per.fiber,
    sodium: per.sodium,
  },
  sodiumStandard: recipe.nutrition.sodiumStandard,
  pack: `${from} -> ${pack.version}`,
  warnings: live.warnings?.slice(0, 5),
  totalKeys: Object.keys(live),
}, null, 2))

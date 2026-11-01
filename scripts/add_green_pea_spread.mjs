#!/usr/bin/env node
/**
 * Add fr-4 Green pea spread with toasted sunflower seeds to Fredheim Kitchen.
 * Oil-free. Then: npm run label-recipes -- --recipe fr-4 --write
 *           node scripts/build_salt_levels.mjs --write
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipe } from './lib/recipeNutritionEstimate.mjs'
import { perServingFromTotals } from './lib/recipeLabels.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const ID = 'fr-4'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.some((r) => r.id === ID)) {
  console.log(`${ID} already present; nothing to do (pack ${pack.version})`)
  process.exit(0)
}

const ingredientsEn = [
  { quantity: 400, unit: 'g', ingredient: 'green-peas', name: 'Green peas', note: 'frozen' },
  { quantity: 70, unit: 'g', ingredient: 'sunflower-seeds', name: 'Sunflower seeds', note: 'toasted; set 1â€“2 tbsp aside for topping' },
  { quantity: 1, unit: 'clove', ingredient: 'garlic', name: 'Garlic', note: 'small' },
  { quantity: 1, unit: 'pcs', ingredient: 'lemons', name: 'Lemons', note: 'zest' },
  { quantity: 2, unit: 'tbsp', ingredient: 'lemon-juice', name: 'Lemon juice' },
  { quantity: 10, unit: 'g', ingredient: 'mint', name: 'Mint', note: 'fresh (or basil)' },
  { quantity: 4, unit: 'tbsp', ingredient: 'water', name: 'Water', note: 'ice-cold, as needed' },
  { quantity: 0.25, unit: 'tsp', ingredient: 'salt', name: 'Salt' },
  { quantity: null, unit: '', ingredient: 'black-pepper', name: 'Black pepper', note: 'to taste' },
]

const ingredientsNo = [
  { quantity: 400, unit: 'g', ingredient: 'green-peas', name: 'GrÃ¸nne erter', note: 'frosne' },
  { quantity: 70, unit: 'g', ingredient: 'sunflower-seeds', name: 'SolsikkefrÃ¸', note: 'ristet; sett til side 1â€“2 ss til topping' },
  { quantity: 1, unit: 'clove', ingredient: 'garlic', name: 'HvitlÃ¸k', note: 'liten fedd' },
  { quantity: 1, unit: 'pcs', ingredient: 'lemons', name: 'Sitroner', note: 'skall (zest)' },
  { quantity: 2, unit: 'ss', ingredient: 'lemon-juice', name: 'Sitronsaft' },
  { quantity: 10, unit: 'g', ingredient: 'mint', name: 'Mynte', note: 'fersk (eller basilikum)' },
  { quantity: 4, unit: 'ss', ingredient: 'water', name: 'Vann', note: 'iskaldt, etter behov' },
  { quantity: 0.25, unit: 'ts', ingredient: 'salt', name: 'Salt' },
  { quantity: null, unit: '', ingredient: 'black-pepper', name: 'Svart pepper', note: 'etter smak' },
]

const ingredientsSv = [
  { quantity: 400, unit: 'g', ingredient: 'green-peas', name: 'GrÃ¶na Ã¤rtor', note: 'frysta' },
  { quantity: 70, unit: 'g', ingredient: 'sunflower-seeds', name: 'SolrosfrÃ¶n', note: 'rostade; spara 1â€“2 msk till topping' },
  { quantity: 1, unit: 'clove', ingredient: 'garlic', name: 'VitlÃ¶k', note: 'liten klyfta' },
  { quantity: 1, unit: 'pcs', ingredient: 'lemons', name: 'Citroner', note: 'skal (zest)' },
  { quantity: 2, unit: 'tbsp', ingredient: 'lemon-juice', name: 'Citronsaft' },
  { quantity: 10, unit: 'g', ingredient: 'mint', name: 'Mynta', note: 'fÃ¤rsk (eller basilika)' },
  { quantity: 4, unit: 'tbsp', ingredient: 'water', name: 'Vatten', note: 'iskallt, efter behov' },
  { quantity: 0.25, unit: 'tsp', ingredient: 'salt', name: 'Salt' },
  { quantity: null, unit: '', ingredient: 'black-pepper', name: 'Svartpeppar', note: 'efter smak' },
]

const stepsEn = [
  'Toast the sunflower seeds in a dry pan over medium heat for 4â€“5 minutes until golden. Set 1â€“2 tbsp aside for topping.',
  'Pour boiling water over the frozen peas, leave for 1 minute, then drain and cool immediately in ice-cold water so they stay bright green and sweet.',
  'Let the garlic sit in the lemon juice for about 5 minutes to mellow it.',
  'Blend the remaining seeds until fine first, then add the peas, garlic with lemon juice, lemon zest, mint and salt. Pulse, adding ice-cold water a little at a time, and keep some texture.',
  'Taste and adjust salt and lemon. Serve topped with the reserved seeds and a little lemon zest.',
]

const stepsNo = [
  'Rist solsikkefrÃ¸ene i en tÃ¸rr panne pÃ¥ middels varme i 4â€“5 minutter til de er gyldne. Sett til side 1â€“2 ss til topping.',
  'Hell kokende vann over de frosne ertene, la dem stÃ¥ 1 minutt, hell av og avkjÃ¸l straks i iskaldt vann sÃ¥ de holder den klare grÃ¸nne fargen og sÃ¸theten.',
  'La hvitlÃ¸ken ligge i sitronsaften i ca. 5 minutter sÃ¥ den blir mildere.',
  'KjÃ¸r fÃ¸rst de resterende frÃ¸ene fint i blenderen, tilsett deretter erter, hvitlÃ¸k med sitronsaft, sitronskall, mynte og salt. PulsÃ©r og tilsett iskaldt vann litt etter litt; behold litt tekstur.',
  'Smak til med salt og sitron. Server med de avsatte frÃ¸ene og litt sitronskall pÃ¥ toppen.',
]

const stepsSv = [
  'Rosta solrosfrÃ¶na i en torr panna pÃ¥ medelvÃ¤rme i 4â€“5 minuter tills de Ã¤r gyllene. Spara 1â€“2 msk till topping.',
  'HÃ¤ll kokande vatten Ã¶ver de frysta Ã¤rtorna, lÃ¥t stÃ¥ 1 minut, hÃ¤ll av och kyl omedelbart i iskallt vatten sÃ¥ de behÃ¥ller den klara grÃ¶na fÃ¤rgen och sÃ¶tman.',
  'LÃ¥t vitlÃ¶ken ligga i citronsaften i cirka 5 minuter sÃ¥ den mildras.',
  'Mixa fÃ¶rst de Ã¥terstÃ¥ende frÃ¶na fint, tillsÃ¤tt sedan Ã¤rtor, vitlÃ¶k med citronsaft, citronskal, mynta och salt. Pulsera och tillsÃ¤tt iskallt vatten lite i taget; behÃ¥ll lite textur.',
  'Smaka av med salt och citron. Servera toppad med de sparade frÃ¶na och lite citronskal.',
]

const notesEn =
  'Lemon zest gives freshness without extra sourness. Do not overcook the peas. Best the same day; press wrap onto the surface â€” keeps 2 days in the fridge. Great on crispbread or in a wrap with radishes.'
const notesNo =
  'Sitronskal gir friskhet uten ekstra syrlighet. Ikke overkok ertene. Best samme dag; press plastfolie mot overflaten â€” holder 2 dager i kjÃ¸leskapet. God pÃ¥ knekkebrÃ¸d eller i wrap med reddiker.'
const notesSv =
  'Citronskal ger friskhet utan extra syrlighet. Ã–verkoka inte Ã¤rtorna. BÃ¤st samma dag; tryck plastfolie mot ytan â€” hÃ¥ller 2 dagar i kylen. Gott pÃ¥ knÃ¤ckebrÃ¶d eller i wrap med rÃ¤disor.'

const recipe = {
  id: ID,
  title: 'Green pea spread with toasted sunflower seeds',
  category: 'Spreads',
  servings: 6,
  portion: '~96 g (2â€“3 tbsp)',
  prepTime: 15,
  cookTime: 5,
  imageUrl: '/pack-images/fr-4.jpg',
  description: 'Bright green oil-free spread of peas, toasted sunflower seeds, lemon and mint.',
  tags: ['fredheim'],
  mealTypes: ['component'],
  kcal: 0,
  servingWeightGrams: 96,
  ingredients: ingredientsEn,
  steps: stepsEn,
  notes: notesEn,
  translations: {
    no: {
      title: 'GrÃ¸nn ertepostei med ristede solsikkefrÃ¸',
      description: 'KlargrÃ¸nn oljefri postei av erter, ristede solsikkefrÃ¸, sitron og mynte.',
      ingredients: ingredientsNo,
      steps: stepsNo,
      notes: notesNo,
      portion: '~96 g (2â€“3 ss)',
    },
    sv: {
      title: 'GrÃ¶n Ã¤rtrÃ¶ra med rostade solrosfrÃ¶n',
      description: 'KlargrÃ¶n oljefri rÃ¶ra av Ã¤rtor, rostade solrosfrÃ¶n, citron och mynta.',
      ingredients: ingredientsSv,
      steps: stepsSv,
      notes: notesSv,
      portion: '~96 g (2â€“3 msk)',
    },
  },
  nutrition: { perServing: {} },
  createdAt: Date.now(),
  flavourProfile: 'savoury',
}

const est = estimateRecipe(recipe)
if (est.problems.length) {
  console.error('estimate incomplete:', est.problems)
  process.exit(1)
}
const per = perServingFromTotals(est.totals, recipe.servings)
recipe.nutrition.perServing = per
recipe.kcal = Math.round(per.calories)
const serving = Math.round(est.weight / recipe.servings)
recipe.servingWeightGrams = serving
recipe.portion = `~${serving} g (2â€“3 tbsp)`
recipe.translations.no.portion = `~${serving} g (2â€“3 ss)`
recipe.translations.sv.portion = `~${serving} g (2â€“3 msk)`

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
const from = pack.version
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${ID} "${recipe.title}"`)
console.log(`  servings ${recipe.servings}, servingWeightGrams ${recipe.servingWeightGrams}, kcal ${recipe.kcal}`)
console.log(`  protein ${per.protein} g, fiber ${per.fiber} g, sodium ${per.sodium} mg`)
console.log(`  pack ${from} -> ${pack.version}`)
console.log(`  batch weight ${est.weight} g`)


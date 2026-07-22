/* Splits "Carob Spread" into two labelled variants in the Fredheim
   recipes-with-pictures pack:
     - carob-spread          → "Carob spread (hazelnut)"  (the existing one)
     - carob-spread-almond   → "Carob spread (almond)"    (new, hazelnut-free)
   The almond twin reuses the hazelnut photo. Both get a complete, modern
   nutrition.perServing profile (the original stored a legacy flat schema
   that the app's nutrition panel/tracker couldn't read). Per-serving values
   are from scripts/../scratchpad calc — validated against the recipe's own
   published macros. Norwegian/Swedish names use "Carob spread" rather than
   the literal "Johannesbrødpålegg".
*/
const fs = require('fs')
const path = require('path')

const NUT_HAZELNUT = {"calories":103,"protein":1.94,"totalFat":6.67,"saturatedFat":0.49,"polyunsaturatedFat":0.87,"monounsaturatedFat":4.98,"omega3":0.01,"omega6":0.86,"cholesterol":0,"totalCarbs":11,"totalSugars":8.1,"addedSugar":0,"fiber":2.2,"calcium":18.4,"potassium":155,"copper":0.22,"iron":0.64,"magnesium":23.1,"manganese":0.71,"selenium":0.64,"phosphorus":39.2,"zinc":0.31,"sodium":19.8,"vitaminA":0.1,"vitaminB6":0.08,"vitaminB12":0,"vitaminC":0.74,"vitaminD":0,"vitaminE":1.65,"vitaminK":1.87,"folate":14.7,"thiamin":0.08,"riboflavin":0.02,"niacin":0.35,"choline":5.76}
const NUT_ALMOND   = {"calories":101,"protein":2.74,"totalFat":5.79,"saturatedFat":0.44,"polyunsaturatedFat":1.42,"monounsaturatedFat":3.63,"omega3":0,"omega6":1.42,"cholesterol":0,"totalCarbs":11.7,"totalSugars":8.2,"addedSugar":0,"fiber":2.5,"calcium":36.9,"potassium":165,"copper":0.15,"iron":0.56,"magnesium":36.3,"manganese":0.28,"selenium":0.85,"phosphorus":62.9,"zinc":0.4,"sodium":19.9,"vitaminA":0,"vitaminB6":0.04,"vitaminB12":0,"vitaminC":0.05,"vitaminD":0,"vitaminE":2.96,"vitaminK":0.32,"folate":7.4,"thiamin":0.03,"riboflavin":0.14,"niacin":0.57,"choline":6.78}

// Shared, nut-agnostic parts of the recipe.
const DESC = {
  en: 'A naturally sweet, dairy-free chocolate-style spread — carob and dates blended with roasted nuts until it turns silky. No added sugar, no oil.',
  no: 'Et naturlig søtt, melkefritt sjokoladeaktig pålegg — carob og dadler kjørt med ristede nøtter til det blir silkemykt. Uten tilsatt sukker, uten olje.',
  sv: 'Ett naturligt sött, mjölkfritt chokladliknande pålägg — carob och dadlar mixat med rostade nötter tills det blir silkeslent. Utan tillsatt socker, utan olja.',
}

function ing(qty, unit, en, no, sv) { return { qty, unit, en, no, sv } }

// Nut-specific ingredient (position 0) + the shared rest.
function ingredients(nut) {
  const NUT = {
    hazelnut: ing(5, 'dl', 'Hazelnuts', 'Hasselnøtter', 'Hasselnötter'),
    almond: ing(5, 'dl', 'Almonds', 'Mandler', 'Mandlar'),
  }[nut]
  return [
    NUT,
    ing(3.5, 'dl', 'Dates, dried', 'Dadler, tørkede', 'Dadlar, torkade'),
    ing(3, 'dl', 'Water', 'Vann', 'Vatten'),
    ing(2, 'tbsp', 'Carob powder', 'Carobpulver', 'Carobpulver'),
    ing(1, 'tbsp', 'Barley coffee', 'Byggkaffe', 'Kornkaffe'),
    ing(0.25, 'tsp', 'Sea salt', 'Havsalt', 'Havssalt'),
  ]
}

function steps(nut) {
  const enNut = nut === 'almond' ? 'almonds' : 'hazelnuts'
  const noNut = nut === 'almond' ? 'mandlene' : 'hasselnøttene'
  const svNut = nut === 'almond' ? 'mandlarna' : 'hasselnötterna'
  return {
    en: [
      `In a preheated oven, roast the ${enNut} at 170°C for 15 minutes.`,
      'Soak the dates in hot water for 15 minutes until they are soft.',
      `Blend the ${enNut} for 2–3 minutes in a food processor until smooth. It is important to blend the nuts until they release their oil and turn into butter.`,
      'Add the remaining ingredients and blend for 2 minutes.',
    ],
    no: [
      `Rist ${noNut} i forvarmet ovn på 170 °C i 15 minutter.`,
      'Bløtlegg dadlene i varmt vann i 15 minutter til de er myke.',
      `Kjør ${noNut} i foodprosessor i 2–3 minutter til de er glatte. Det er viktig at nøttene kjøres helt til de slipper oljen og blir til smør.`,
      'Tilsett resten av ingrediensene og kjør i 2 minutter.',
    ],
    sv: [
      `Rosta ${svNut} i förvärmd ugn på 170 °C i 15 minuter.`,
      'Blötlägg dadlarna i varmt vatten i 15 minuter tills de är mjuka.',
      `Mixa ${svNut} i matberedare i 2–3 minuter tills de är släta. Det är viktigt att nötterna körs tills de släpper oljan och blir till smör.`,
      'Tillsätt resten av ingredienserna och mixa i 2 minuter.',
    ],
  }
}

function buildRecipe({ id, nut, title, nutrition, imageUrl }) {
  const ings = ingredients(nut)
  const st = steps(nut)
  const localizedIngredients = (lang) => ings.map(i => ({ quantity: i.qty, unit: i.unit, name: i[lang] }))
  return {
    id,
    title,
    category: 'Spreads',
    servings: 30,
    prepTime: 20,
    cookTime: 15,
    imageUrl,
    description: DESC.en,
    tags: ['fredheim', 'vegan', 'oil-free', 'no-added-sugar'],
    kcal: Math.round(nutrition.calories),
    servingWeightGrams: 33,
    nutrition: { perServing: nutrition },
    ingredients: localizedIngredients('en'),
    steps: st.en,
    translations: {
      no: { title, description: DESC.no, ingredients: localizedIngredients('no'), steps: st.no },
      sv: { title, description: DESC.sv, ingredients: localizedIngredients('sv'), steps: st.sv },
    },
  }
}

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const existing = pack.recipes.find(r => r.id === 'carob-spread')
if (!existing) throw new Error('carob-spread not found')
const image = existing.imageUrl // reused by both variants

const hazelnut = buildRecipe({ id: 'carob-spread', nut: 'hazelnut', title: 'Carob spread (hazelnut)', nutrition: NUT_HAZELNUT, imageUrl: image })
const almond = buildRecipe({ id: 'carob-spread-almond', nut: 'almond', title: 'Carob spread (almond)', nutrition: NUT_ALMOND, imageUrl: image })

// Preserve any condition tags already assigned to the existing recipe.
const CONDITION_TAGS = ['diabetes-friendly', 'blood-pressure-friendly', 'heart-healthy', 'weight-loss']
hazelnut.tags = [...hazelnut.tags, ...(existing.tags || []).filter(t => CONDITION_TAGS.includes(t))]

// Replace the existing recipe in place; add the almond twin right after it.
const idx = pack.recipes.findIndex(r => r.id === 'carob-spread')
pack.recipes.splice(idx, 1, hazelnut, almond)

pack.version = '1.10.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('fredheim-recipes-with-pictures.json ->', pack.version, '| recipes:', pack.recipes.length)
console.log('  carob-spread          -> "Carob spread (hazelnut)" (nutrition migrated, complete)')
console.log('  carob-spread-almond   -> "Carob spread (almond)"   (new, same photo, kcal ' + almond.kcal + ')')

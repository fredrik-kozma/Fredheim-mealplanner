/* Adds "Lemony Chickpea Hummus" to the Fredheim recipes-with-pictures
 * pack — explicitly not the Ornish reversal-protocol pack.
 *
 * Nutrition is the author's own table, carried verbatim, including the
 * 145 g serving weight it was calculated against. The one figure in that
 * table with nowhere to go is the omega-6:omega-3 ratio (1.5:1), which the
 * 35-field schema has no slot for — it is derivable from the two values
 * that are stored, so nothing is lost.
 *
 * Step text is de-quantified. The source restated every amount inline
 * ("Stir 15 grams Ground flaxseed into 50 milliliters..."), which reads
 * fine at four servings and lies at any other count once the ingredient
 * list scales and the prose does not.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/hummus_b64.txt'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.find(r => r.id === 'lemony-chickpea-hummus')) throw new Error('already exists')

const imageUrl = fs.readFileSync(IMG, 'utf8').trim()

const recipe = {
  id: 'lemony-chickpea-hummus',
  title: 'Lemony Chickpea Hummus',
  category: 'Spreads',
  servings: 4,
  prepTime: 15,
  cookTime: 0,
  imageUrl,
  description: 'Creamy, sharp and very lemony. No tahini, nuts, sesame, soy, gluten or dairy.',
  tags: ['fredheim', 'spread', 'vegan', 'oil-free', 'no-added-sugar', 'gluten-free'],
  kcal: 195,
  servingWeightGrams: 145,
  nutrition: {
    perServing: {
      calories: 195, protein: 9.9, totalFat: 4.4, saturatedFat: 0.4,
      polyunsaturatedFat: 2.3, monounsaturatedFat: 0.9, omega3: 0.9, omega6: 1.4,
      cholesterol: 0, totalCarbs: 31, totalSugars: 5.6, addedSugar: 0, fiber: 9.0,
      calcium: 69, potassium: 365, copper: 0.41, iron: 3.5, magnesium: 66,
      manganese: 1.15, selenium: 9.4, phosphorus: 199, zinc: 1.75, sodium: 590,
      vitaminA: 1, vitaminB6: 0.19, vitaminB12: 0, vitaminC: 13, vitaminD: 0,
      vitaminE: 0.5, vitaminK: 4.5, folate: 180, thiamin: 0.19, riboflavin: 0.08,
      niacin: 0.7, choline: 45,
    },
  },
  ingredients: [
    { quantity: 400, unit: 'g', name: 'chickpeas, home-cooked, warm, drained (keep the liquid)' },
    { quantity: 100, unit: 'ml', name: 'lemon juice, freshly squeezed (about 2 lemons)' },
    { quantity: 2, unit: 'clove', name: 'garlic' },
    { quantity: 15, unit: 'g', name: 'ground flaxseed' },
    { quantity: 50, unit: 'ml', name: 'chickpea cooking liquid or water' },
    { quantity: 1, unit: 'tsp', name: 'ground cumin' },
    { quantity: 1, unit: 'tsp', name: 'sea salt' },
  ],
  steps: [
    'Make the flax gel: stir the ground flaxseed into the cooking liquid and leave until it thickens into a gel. This replaces tahini for richness.',
    'Mellow the garlic: crush the garlic, mix it with the lemon juice and let it sit while the flax thickens. The lemon softens the raw garlic bite.',
    'Blend: add the chickpeas, the flax gel, the garlic-lemon mixture, the cumin and the salt to a food processor. Blend 3-4 minutes, scraping down the sides, until completely smooth.',
    'Taste and adjust: add more salt or lemon juice if needed. Loosen with a splash of cooking liquid. Rest 20 minutes if you can — the flavours round out.',
  ],
  notes: 'Blend the chickpeas while still warm for the smoothest texture. Cooking them with a pinch of baking soda makes them extra soft. Simple is better here: home-cooked chickpeas and their cooking liquid do most of the work. Salt is set to about 1 tsp per batch, so add it gradually and taste. Substitutions: ground chia instead of flaxseed; white beans instead of chickpeas for a milder result.',
  translations: {
    no: {
      title: 'Sitronhummus med kikerter',
      description: 'Kremet, syrlig og skikkelig sitronaktig. Uten tahini, nøtter, sesam, soya, gluten eller melk.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'kikerter, hjemmekokte, varme, avrent (ta vare på kokevannet)' },
        { quantity: 100, unit: 'ml', name: 'sitronsaft, nypresset (ca. 2 sitroner)' },
        { quantity: 2, unit: 'clove', name: 'hvitløk' },
        { quantity: 15, unit: 'g', name: 'malt linfrø' },
        { quantity: 50, unit: 'ml', name: 'kokevann fra kikertene, eller vann' },
        { quantity: 1, unit: 'ts', name: 'malt spisskummen' },
        { quantity: 1, unit: 'ts', name: 'havsalt' },
      ],
      steps: [
        'Lag linfrøgelé: rør det malte linfrøet ut i kokevannet og la det stå til det tykner til en gelé. Dette erstatter tahini og gir fylde.',
        'Mildne hvitløken: knus hvitløken, bland den med sitronsaften og la den stå mens linfrøet tykner. Sitronen demper den rå hvitløkssmaken.',
        'Kjør glatt: ha kikertene, linfrøgeléen, hvitløk- og sitronblandingen, spisskummen og saltet i en foodprosessor. Kjør i 3-4 minutter, skrap ned sidene underveis, til det er helt glatt.',
        'Smak til: tilsett mer salt eller sitronsaft ved behov. Spe med litt kokevann om den er for tykk. La den hvile 20 minutter hvis du har tid — smakene runder seg av.',
      ],
      notes: 'Kjør kikertene mens de fortsatt er varme for den glatteste konsistensen. Koker du dem med en klype natron, blir de ekstra myke. Enkelt er best her: hjemmekokte kikerter og kokevannet deres gjør mesteparten av jobben. Saltet er satt til omtrent 1 ts per porsjon sats, så tilsett litt om gangen og smak underveis. Bytter: malt chia i stedet for linfrø; hvite bønner i stedet for kikerter gir et mildere resultat.',
    },
    sv: {
      title: 'Citronhummus med kikärtor',
      description: 'Krämig, syrlig och rejält citronig. Utan tahini, nötter, sesam, soja, gluten eller mjölk.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'kikärtor, hemkokta, varma, avrunna (spara kokvattnet)' },
        { quantity: 100, unit: 'ml', name: 'citronjuice, nypressad (ca 2 citroner)' },
        { quantity: 2, unit: 'clove', name: 'vitlök' },
        { quantity: 15, unit: 'g', name: 'malda linfrön' },
        { quantity: 50, unit: 'ml', name: 'kokvatten från kikärtorna, eller vatten' },
        { quantity: 1, unit: 'tsk', name: 'malen spiskummin' },
        { quantity: 1, unit: 'tsk', name: 'havssalt' },
      ],
      steps: [
        'Gör linfrögelén: rör ut de malda linfröna i kokvattnet och låt stå tills det tjocknar till en gelé. Det här ersätter tahini och ger fyllighet.',
        'Mildra vitlöken: krossa vitlöken, blanda den med citronjuicen och låt stå medan linfröna tjocknar. Citronen dämpar den råa vitlökssmaken.',
        'Mixa slätt: lägg kikärtorna, linfrögelén, vitlöks- och citronblandningen, spiskumminen och saltet i en matberedare. Kör i 3-4 minuter och skrapa ner kanterna, tills det är helt slätt.',
        'Smaka av: tillsätt mer salt eller citronjuice vid behov. Spä med lite kokvatten om den är för tjock. Låt vila 20 minuter om du hinner — smakerna rundas av.',
      ],
      notes: 'Mixa kikärtorna medan de fortfarande är varma för den slätaste konsistensen. Kokar du dem med en nypa bikarbonat blir de extra mjuka. Enkelt är bäst här: hemkokta kikärtor och deras kokvatten gör det mesta av jobbet. Saltet är satt till ungefär 1 tsk per sats, så tillsätt lite i taget och smaka av. Byten: malen chia i stället för linfrön; vita bönor i stället för kikärtor ger ett mildare resultat.',
    },
  },
  createdAt: 1785394800000,
}

pack.recipes.push(recipe)

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${recipe.id} — ${pack.recipes.length} recipes, pack -> ${pack.version}`)

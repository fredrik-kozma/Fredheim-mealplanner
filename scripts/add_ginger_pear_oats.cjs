/* Adds "Ginger Pear Overnight Oats with Cashew Milk" to the Fredheim
   recipes-with-pictures pack, with EN/NO/SV, nutrition and photo.

   Source: Swedish recipe PDF "Ingefära Päron Müsli med Krämig Rå cashew
   'Mjölk'" (Dream week, Vecka 1, Frukost Dag 3). Nutrition panel is for
   "1 extra stor portion" (one extra-large portion) — kept as servings: 1.
*/
const fs = require('fs')
const path = require('path')

const IMG = 'C:/Users/fredr/Downloads/104c0487-14a8-4124-897a-d414cecd4c84.jpg'
const imageUrl = 'data:image/jpeg;base64,' + fs.readFileSync(IMG).toString('base64')

const RECIPE = {
  id: 'ginger-pear-overnight-oats',
  title: 'Ginger Pear Overnight Oats with Cashew Milk',
  category: 'Breakfast',
  servings: 1,
  prepTime: 10,
  cookTime: null,
  imageUrl,
  description:
    'A generous overnight-oats bowl soaked in homemade raw cashew milk, warmed with ginger and cinnamon and sweetened only with Medjool dates, pear and raisins. The blender yields extra creamy "milk" to save for smoothies or porridge.',
  tags: ['fredheim', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 1117,
  servingWeightGrams: 950,
  nutrition: {
    perServing: {
      calories: 1117,
      protein: 24.5,
      totalFat: 38.8,
      saturatedFat: 7.4,
      polyunsaturatedFat: 8.4,
      monounsaturatedFat: 20.7,
      omega3: 0.81,
      omega6: 7.5,
      cholesterol: 0,
      totalCarbs: 185.2,
      totalSugars: 81.9,
      addedSugar: 0,
      fiber: 27.1,
      calcium: 179,
      potassium: 1596,
      copper: 2.4,
      iron: 9.5,
      magnesium: 360,
      manganese: 4.49,
      selenium: 34.3,
      phosphorus: 790,
      zinc: 7.6,
      sodium: 313,
      vitaminA: 8,
      vitaminB6: 0.52,
      vitaminB12: 0,
      vitaminC: 15.9,
      vitaminD: 0,
      vitaminE: 1.46,
      vitaminK: 43.2,
      folate: 108,
      thiamin: 0.62,
      riboflavin: 0.42,
      niacin: 3.77,
      choline: 100,
    },
  },
  notes:
    'The cashew milk makes more than one bowl needs — reserve the extra in the fridge for smoothies or porridge over the next couple of days. For a nut-free version, swap the cashews for soaked sunflower seeds. Use ripe, fragrant pears: half is grated into the oats and the rest sliced on top.',
  ingredients: [
    { quantity: 69, unit: 'g', name: 'Raw unsalted cashews' },
    { quantity: 2, unit: 'pinch', name: 'Salt' },
    { quantity: 0.5, unit: 'tsp', name: 'Vanilla extract' },
    { quantity: 2, unit: 'pcs', name: 'Medjool dates, pitted' },
    { quantity: 360, unit: 'ml', name: 'Water (for the cashew milk)' },
    { quantity: 2, unit: 'pcs', name: 'Pears' },
    { quantity: 90, unit: 'g', name: 'Rolled oats' },
    { quantity: 1, unit: 'tsp', name: 'Chia seeds' },
    { quantity: 0.5, unit: 'tsp', name: 'Ground cinnamon' },
    { quantity: 0.5, unit: 'tsp', name: 'Ground ginger' },
    { quantity: 2, unit: 'tbsp', name: 'Raisins' },
  ],
  steps: [
    'For the "milk", blend the raw cashews, vanilla extract, pitted Medjool dates, salt and water in a powerful blender until completely smooth. Set the milk aside — it makes more than you need, so reserve the rest for smoothies, porridge, etc.',
    'Rinse and finely chop or grate half of one pear.',
    'To build the oats, mix the rolled oats, chia seeds, cinnamon, ground ginger, grated pear and raisins in a bowl. Add enough of the cashew milk to moisten and stir to combine.',
    'Cover and leave overnight in the fridge.',
    'In the morning, pour a little extra cashew milk over the oats and garnish with the remaining pear, sliced, and a dusting of cinnamon if desired.',
  ],
  translations: {
    no: {
      title: 'Ingefær- og pæreovernight oats med cashewmelk',
      description:
        'En raus bolle overnight oats bløtlagt i hjemmelaget rå cashewmelk, varmet med ingefær og kanel og søtet kun med medjooldadler, pære og rosiner. Blenderen gir ekstra kremet «melk» til overs som du kan spare til smoothies eller grøt.',
      ingredients: [
        { quantity: 69, unit: 'g', name: 'rå usaltede cashewnøtter' },
        { quantity: 2, unit: 'pinch', name: 'salt' },
        { quantity: 0.5, unit: 'tsp', name: 'vaniljeekstrakt' },
        { quantity: 2, unit: 'pcs', name: 'medjooldadler, uten stein' },
        { quantity: 360, unit: 'ml', name: 'vann (til cashewmelken)' },
        { quantity: 2, unit: 'pcs', name: 'pærer' },
        { quantity: 90, unit: 'g', name: 'havregryn' },
        { quantity: 1, unit: 'tsp', name: 'chiafrø' },
        { quantity: 0.5, unit: 'tsp', name: 'malt kanel' },
        { quantity: 0.5, unit: 'tsp', name: 'malt ingefær' },
        { quantity: 2, unit: 'tbsp', name: 'rosiner' },
      ],
      steps: [
        'Til «melken»: kjør de rå cashewnøttene, vaniljeekstraktet, de utstenede medjooldadlene, saltet og vannet i en kraftig blender til det er helt glatt. Sett melken til side — den blir mer enn du trenger, så spar resten til smoothies, grøt osv.',
        'Skyll og finhakk eller riv halvparten av den ene pæren.',
        'Til havregrynsblandingen: bland havregryn, chiafrø, kanel, malt ingefær, revet pære og rosiner i en bolle. Tilsett nok cashewmelk til å fukte, og rør sammen.',
        'Dekk til og la stå over natten i kjøleskapet.',
        'Om morgenen: hell litt ekstra cashewmelk over havregrynene og pynt med resten av pæren i skiver, og et dryss kanel om ønskelig.',
      ],
    },
    sv: {
      title: "Ingefära päron overnight oats med cashewmjölk",
      description:
        'En generös skål overnight oats blötlagd i hemgjord rå cashewmjölk, värmd med ingefära och kanel och sötad enbart med medjooldadlar, päron och russin. Mixern ger extra krämig "mjölk" över att spara till smoothies eller gröt.',
      ingredients: [
        { quantity: 69, unit: 'g', name: 'råa osaltade cashewnötter' },
        { quantity: 2, unit: 'pinch', name: 'salt' },
        { quantity: 0.5, unit: 'tsp', name: 'vaniljextrakt' },
        { quantity: 2, unit: 'pcs', name: 'medjooldadlar, urkärnade' },
        { quantity: 360, unit: 'ml', name: 'vatten (till cashewmjölken)' },
        { quantity: 2, unit: 'pcs', name: 'päron' },
        { quantity: 90, unit: 'g', name: 'havregryn' },
        { quantity: 1, unit: 'tsp', name: 'chiafrön' },
        { quantity: 0.5, unit: 'tsp', name: 'malen kanel' },
        { quantity: 0.5, unit: 'tsp', name: 'malen ingefära' },
        { quantity: 2, unit: 'tbsp', name: 'russin' },
      ],
      steps: [
        'För "mjölken", mixa de osaltade cashewnötterna, vaniljextraktet, medjooldadlarna (se till att de är utan kärnor), saltet och vattnet i en kraftfull mixer tills det är helt slätt. Ställ "mjölken" åt sidan — du får extra och kan spara resten till smoothies, gröt, etc.',
        'Skölj och finhacka eller riv hälften av päronet.',
        'För att förbereda müslin, blanda havregrynen, chiafrön, kanel, malen ingefära, päron och russin i en blandningsskål. Tillsätt lite av "mjölken" och rör om för att kombinera.',
        'Täck över och låt stå över natten i kylskåpet.',
        'På morgonen, häll lite extra "mjölk" över müslin och garnera med extra päronskivor om så önskas.',
      ],
    },
  },
}

function addRecipe(file, recipe, newVersion) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', file)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (pack.recipes.some(r => r.id === recipe.id)) {
    console.log(file, '- already has', recipe.id, '(replacing in place)')
    pack.recipes = pack.recipes.map(r => (r.id === recipe.id ? recipe : r))
  } else {
    pack.recipes.push(recipe)
  }
  pack.version = newVersion
  fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(file, '->', newVersion, '| recipes:', pack.recipes.length, '| added:', recipe.id, '| img KB:', Math.round(imageUrl.length / 1024))
}

addRecipe('fredheim-recipes-with-pictures.json', RECIPE, '1.9.1')

/* Adds "Quick Lemon-Pickled Onions" to the recipes-with-pictures pack.
 *
 * Nutrition was requested but not supplied, so it's calculated here from
 * standard USDA FoodData Central per-100g reference values for raw red
 * onion and raw lemon juice, scaled to the recipe's actual amounts
 * (150 g onion, 60 ml/g lemon juice), plus salt's sodium contribution
 * (0.5 tsp ≈ 2300 mg sodium/tsp, the standard nutrition-label figure —
 * salt contributes nothing else, same treatment as the oat milk salt
 * fix). This is a calculated estimate from reference data, not a lab
 * value, like the rest of this pack's nutrition panels.
 *
 * Step text is de-quantified (no amounts restated inline) so portion
 * scaling doesn't strand a number that no longer matches.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/pickled_onions_b64.txt'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.find(r => r.id === 'quick-lemon-pickled-onions')) throw new Error('already exists')

const imageUrl = fs.readFileSync(IMG, 'utf8').trim()

const recipe = {
  id: 'quick-lemon-pickled-onions',
  title: 'Quick Lemon-Pickled Onions',
  category: 'Side',
  servings: 4,
  prepTime: 20,
  cookTime: 0,
  imageUrl,
  description: 'A fast, no-cook pickle using just onion, lemon juice, and salt — ready in about 20 minutes.',
  tags: ['fredheim', 'side', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 18,
  servingWeightGrams: 53,
  nutrition: {
    perServing: {
      calories: 18, protein: 0.5, totalFat: 0.1, saturatedFat: 0.01,
      polyunsaturatedFat: 0.02, monounsaturatedFat: 0.01, omega3: 0, omega6: 0.02,
      cholesterol: 0, totalCarbs: 4.5, totalSugars: 2, addedSugar: 0, fiber: 0.7,
      calcium: 9.5, potassium: 73, copper: 0.02, iron: 0.09, magnesium: 4.7,
      manganese: 0.05, selenium: 0.2, phosphorus: 12, zinc: 0.07, sodium: 289,
      vitaminA: 1, vitaminB6: 0.05, vitaminB12: 0, vitaminC: 8.6, vitaminD: 0,
      vitaminE: 0.02, vitaminK: 0.2, folate: 10, thiamin: 0.02, riboflavin: 0.01,
      niacin: 0.06, choline: 3.1,
    },
  },
  ingredients: [
    { quantity: 150, unit: 'g', name: 'red onion, thinly sliced' },
    { quantity: 60, unit: 'ml', name: 'fresh lemon juice' },
    { quantity: 0.5, unit: 'tsp', name: 'salt' },
  ],
  steps: [
    "Slice the onion: peel and thinly slice the red onion into half-moons — the thinner the slices, the faster and more evenly they'll pickle.",
    'Combine: put the sliced onion in a bowl or jar. Add the lemon juice and salt, then stir or toss so all the onion is coated.',
    'Let it sit: let the onions rest at room temperature, stirring once or twice, until they turn bright pink and soften slightly.',
    "Store: transfer to an airtight container (or keep in the jar) and refrigerate. They're ready to eat immediately and keep well for later use.",
  ],
  notes: '150 g is roughly one medium red onion — a good base portion for topping tacos, salads, or sandwiches for about 4 servings. Scale up or down with the servings control. A pinch of sugar balances the acidity if you want it less sharp, and white or red wine vinegar can sub in for lemon juice for a more classic pickled flavor. They\'ll keep in the fridge for about a week.',
  translations: {
    no: {
      title: 'Sitronsyltet rødløk',
      description: 'En rask sylteoppskrift uten koking — bare løk, sitronsaft og salt — klar på rundt 20 minutter.',
      ingredients: [
        { quantity: 150, unit: 'g', name: 'rødløk, tynt skivet' },
        { quantity: 60, unit: 'ml', name: 'fersk sitronsaft' },
        { quantity: 0.5, unit: 'tsp', name: 'salt' },
      ],
      steps: [
        'Skiv løken: skrell og skjær rødløken i tynne halvmåner — jo tynnere skiver, jo raskere og jevnere syltes de.',
        'Kombiner: ha den skivede løken i en bolle eller et glass. Tilsett sitronsaften og saltet, rør eller vend så all løken blir dekket.',
        'La den stå: la løken stå i romtemperatur, og rør om en eller to ganger, til den blir klart rosa og mykner litt.',
        'Oppbevar: overfør til en lufttett beholder (eller behold den i glasset) og sett kaldt. Den er klar til å spises med en gang og holder seg godt til senere bruk.',
      ],
      notes: '150 g tilsvarer omtrent én middels rødløk — en god grunnporsjon som topping til tacos, salater eller smørbrød til rundt 4 porsjoner. Skaler opp eller ned med porsjonskontrollen. En klype sukker balanserer syren hvis du vil ha den mildere, og hvit- eller rødvinseddik kan erstatte sitronsaft for en mer klassisk syltesmak. Holder seg i kjøleskapet i omtrent en uke.',
    },
    sv: {
      title: 'Citronsyrade röda lökar',
      description: 'En snabb picklingsmetod utan tillagning — bara lök, citronjuice och salt — klar på cirka 20 minuter.',
      ingredients: [
        { quantity: 150, unit: 'g', name: 'rödlök, tunt skivad' },
        { quantity: 60, unit: 'ml', name: 'färsk citronjuice' },
        { quantity: 0.5, unit: 'tsp', name: 'salt' },
      ],
      steps: [
        'Skiva löken: skala och skiva rödlöken tunt i halvmånar — ju tunnare skivor, desto snabbare och jämnare syras de.',
        'Kombinera: lägg den skivade löken i en skål eller burk. Tillsätt citronjuicen och saltet, rör eller vänd så att all lök täcks.',
        'Låt stå: låt löken stå i rumstemperatur, och rör om en eller två gånger, tills den blir klart rosa och mjuknar något.',
        'Förvara: överför till en lufttät behållare (eller behåll den i burken) och kyl. Den är klar att äta direkt och håller sig bra för senare bruk.',
      ],
      notes: '150 g motsvarar ungefär en medelstor rödlök — en bra basportion som topping till tacos, sallader eller smörgåsar för cirka 4 portioner. Skala upp eller ner med portionskontrollen. En nypa socker balanserar syran om du vill ha den mildare, och vit- eller rödvinsvinäger kan ersätta citronjuice för en mer klassisk syrad smak. Håller sig i kylen i cirka en vecka.',
    },
  },
  createdAt: 1785391200000,
}

pack.recipes.push(recipe)

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${recipe.id} — pack -> ${pack.version}, ${pack.recipes.length} recipes total`)

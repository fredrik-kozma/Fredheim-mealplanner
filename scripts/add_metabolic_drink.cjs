/* Adds "Metabolic Support Drink" (orn-29) to the Fredheim Reversal Protocol
   pack — a cold-blended spice tonic (ginger, Ceylon cinnamon, cumin, garlic
   powder, nigella sativa, amla) submitted by the user with a full nutrition
   panel and photo. Values are used as given; servingWeightGrams (5.9 g)
   matches the source panel's "Per Serving" basis (the dry spice mix — the
   diluting water contributes ~0 to every field). */
const fs = require('fs')
const path = require('path')

const IMG = 'C:/Users/fredr/Downloads/watermarked_img_14242902480581562605.jpg'
const imageUrl = 'data:image/jpeg;base64,' + fs.readFileSync(IMG).toString('base64')

const NUTRITION = {
  calories: 18.4, protein: 0.6, totalFat: 0.47, saturatedFat: 0.05,
  polyunsaturatedFat: 0.13, monounsaturatedFat: 0.22, omega3: 0, omega6: 0.13,
  cholesterol: 0, totalCarbs: 3.7, totalSugars: 0.3, addedSugar: 0, fiber: 1.4,
  calcium: 29.0, potassium: 63.3, copper: 0.03, iron: 1.10, magnesium: 8.8,
  manganese: 0.47, selenium: 0.4, phosphorus: 13.9, zinc: 0.17, sodium: 3.2,
  vitaminA: 0.9, vitaminB6: 0.03, vitaminB12: 0, vitaminC: 5.8, vitaminD: 0,
  vitaminE: 0.08, vitaminK: 0.48, folate: 0.43, thiamin: 0.01, riboflavin: 0.015,
  niacin: 0.19, choline: 0.74,
}

const NOTES_EN =
  "Ornish score: GREEN — 100% plant-based, no oil, no added sugar, no refined carbs; fiber sits below the 6 g meal threshold, which is expected for a condiment-sized drink. Traditionally used to support weight, blood sugar and cholesterol: cinnamon is the best-studied of this group for modest improvements in insulin sensitivity; ginger and cumin are often cited for digestion and metabolic rate; black seed (nigella sativa) has some research interest around body weight and lipid metabolism; garlic, black seed and cinnamon each have some evidence linking them to modest improvements in lipid profiles. These are small, whole-spice doses — supportive habits rather than a treatment, and worth mentioning to your care team given the program's clinical context. Iron and manganese stand out from this small dose, mostly from cumin and cinnamon; vitamin C comes largely from the amla. Sourcing note: nigella sativa and amla powder aren't in standard nutrient databases, so those two entries are estimated from published sources rather than lab-verified data."
const NOTES_NO =
  'Ornish-poengsum: GRØNN — 100 % plantebasert, uten olje, uten tilsatt sukker, uten raffinerte karbohydrater; fiberinnholdet ligger under 6 g-grensen for måltider, som forventet for en drikke i "krydder"-størrelse. Tradisjonelt brukt som støtte for vekt, blodsukker og kolesterol: kanel er best dokumentert i denne gruppen for en beskjeden bedring av insulinfølsomhet; ingefær og spisskummen trekkes ofte frem for fordøyelse og stoffskifte; svartkarve (nigella sativa) har noe forskningsinteresse knyttet til kroppsvekt og fettstoffskifte; hvitløk, svartkarve og kanel har hver for seg noe dokumentasjon på beskjedne forbedringer i lipidprofilen. Dette er små doser med hele krydder — støttende vaner, ikke en behandling, og verdt å nevne til behandlerteamet gitt programmets kliniske kontekst. Jern og mangan skiller seg ut fra denne lille dosen, hovedsakelig fra spisskummen og kanel; vitamin C kommer i stor grad fra amla. Kildenotat: svartkarve og amlapulver finnes ikke i standard næringsstoffdatabaser, så disse to oppføringene er anslått ut fra publiserte kilder og ikke laboratorieverifisert.'
const NOTES_SV =
  'Ornish-poäng: GRÖN — 100 % växtbaserad, utan olja, utan tillsatt socker, utan raffinerade kolhydrater; fiberinnehållet ligger under 6 g-gränsen för måltider, vilket är väntat för en dryck i "kryddstorlek". Traditionellt använd som stöd för vikt, blodsocker och kolesterol: kanel är bäst studerad i denna grupp för en måttlig förbättring av insulinkänsligheten; ingefära och spiskummin nämns ofta för matsmältning och ämnesomsättning; svartkummin (nigella sativa) har visst forskningsintresse kring kroppsvikt och fettmetabolism; vitlök, svartkummin och kanel har var för sig visst stöd för måttliga förbättringar av lipidprofilen. Detta är små doser av hela kryddor — stödjande vanor, inte en behandling, och värt att nämna för din vårdteam med tanke på programmets kliniska sammanhang. Järn och mangan sticker ut från denna lilla dos, mestadels från spiskummin och kanel; vitamin C kommer till stor del från amlan. Källanmärkning: svartkummin och amlapulver finns inte i standardnäringsdatabaser, så dessa två poster är uppskattade utifrån publicerade källor snarare än labbverifierade.'

const RECIPE = {
  id: 'orn-29',
  title: 'Metabolic Support Drink',
  category: 'Drink',
  servings: 1,
  prepTime: 2,
  cookTime: null,
  imageUrl,
  description: 'A cold-blended spice tonic for cholesterol, blood sugar and metabolism support — ready in 2 minutes.',
  tags: ['ornish-green', 'drink', 'vegan', 'oil-free', 'no-added-sugar', 'caffeine-free'],
  kcal: Math.round(NUTRITION.calories),
  servingWeightGrams: 5.9,
  nutrition: { perServing: NUTRITION },
  notes: NOTES_EN,
  ingredients: [
    { quantity: 0.5, unit: 'tsp', name: 'Ground ginger' },
    { quantity: 0.5, unit: 'tsp', name: 'Ceylon cinnamon, ground' },
    { quantity: 0.5, unit: 'tsp', name: 'Ground cumin' },
    { quantity: 0.25, unit: 'tsp', name: 'Garlic powder' },
    { quantity: 0.25, unit: 'tsp', name: 'Nigella sativa (black seed)' },
    { quantity: 0.5, unit: 'tsp', name: 'Amla powder' },
    { quantity: 220, unit: 'ml', name: 'Cold water (approx. 200–250 ml, one glass)' },
  ],
  steps: [
    'Add all the spice powders and the nigella sativa seeds to a blender.',
    'Pour in the cold water.',
    'Blend on high for 20–30 seconds, until the nigella sativa is fully broken down and everything is well combined.',
    'Pour and drink immediately.',
  ],
  translations: {
    no: {
      title: 'Metabolisme-drikk',
      description: 'En kald krydderdrikk for kolesterol, blodsukker og stoffskifte — klar på 2 minutter.',
      notes: NOTES_NO,
      ingredients: [
        { quantity: 0.5, unit: 'tsp', name: 'malt ingefær' },
        { quantity: 0.5, unit: 'tsp', name: 'Ceylon-kanel, malt' },
        { quantity: 0.5, unit: 'tsp', name: 'malt spisskummen' },
        { quantity: 0.25, unit: 'tsp', name: 'hvitløkspulver' },
        { quantity: 0.25, unit: 'tsp', name: 'svartkarve (nigella sativa)' },
        { quantity: 0.5, unit: 'tsp', name: 'amlapulver' },
        { quantity: 220, unit: 'ml', name: 'kaldt vann (ca. 200–250 ml, ett glass)' },
      ],
      steps: [
        'Ha alle krydderpulverne og svartkarvefrøene i en blender.',
        'Hell i det kalde vannet.',
        'Kjør på høy hastighet i 20–30 sekunder, til svartkarven er helt findelt og alt er godt blandet.',
        'Hell opp og drikk med en gang.',
      ],
    },
    sv: {
      title: 'Metabolism-dryck',
      description: 'En kall kryddrink för kolesterol, blodsocker och ämnesomsättning — klar på 2 minuter.',
      notes: NOTES_SV,
      ingredients: [
        { quantity: 0.5, unit: 'tsp', name: 'malen ingefära' },
        { quantity: 0.5, unit: 'tsp', name: 'Ceylonkanel, malen' },
        { quantity: 0.5, unit: 'tsp', name: 'malen spiskummin' },
        { quantity: 0.25, unit: 'tsp', name: 'vitlökspulver' },
        { quantity: 0.25, unit: 'tsp', name: 'svartkummin (nigella sativa)' },
        { quantity: 0.5, unit: 'tsp', name: 'amlapulver' },
        { quantity: 220, unit: 'ml', name: 'kallt vatten (ca 200–250 ml, ett glas)' },
      ],
      steps: [
        'Lägg alla kryddpulver och svartkumminfröna i en mixer.',
        'Häll i det kalla vattnet.',
        'Mixa på hög hastighet i 20–30 sekunder, tills svartkumminen är helt findelad och allt är väl blandat.',
        'Häll upp och drick direkt.',
      ],
    },
  },
}

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

if (pack.recipes.some(r => r.id === RECIPE.id)) {
  console.log('already has', RECIPE.id, '- replacing in place')
  pack.recipes = pack.recipes.map(r => (r.id === RECIPE.id ? RECIPE : r))
} else {
  pack.recipes.push(RECIPE)
}
pack.version = '1.11.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('fredheim-reversal-protocol.json ->', pack.version, '| recipes:', pack.recipes.length, '| added:', RECIPE.id, '| img KB:', Math.round(imageUrl.length / 1024))

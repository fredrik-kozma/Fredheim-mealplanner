/* Adds "Squash-kake" (courgette cake) to the Fredheim recipes pack.

   Authored in Norwegian by the user; EN/SV translated here. An indulgent
   guest-favourite bake rather than a protocol recipe — it carries added
   sugar and oil, so the condition audit will (correctly) give it no health
   tags.

   Nutrition computed from ingredient food-composition data over the whole
   batch, divided by 12 slices. Raw batter ≈ 1575 g; baked ≈ 1340 g after
   moisture loss, so a slice is ~110 g.
*/
const fs = require('fs')
const path = require('path')

const IMG = 'C:/Users/fredr/Downloads/0c7fcad3-42da-477b-8cb0-1ba4b3d840d2.jpg'

// Per-serving = whole batch ÷ 12.
const NUTRITION = {
  calories: 343, protein: 5.3, totalFat: 15.1, saturatedFat: 1.3,
  polyunsaturatedFat: 5.6, monounsaturatedFat: 7.7, omega3: 1.44, omega6: 4.06,
  cholesterol: 0, totalCarbs: 51.4, totalSugars: 26.5, addedSugar: 20.3, fiber: 5.1,
  calcium: 76, potassium: 303, copper: 0.22, iron: 1.58, magnesium: 58,
  manganese: 1.43, selenium: 18.1, phosphorus: 143, zinc: 1.04, sodium: 386,
  vitaminA: 4.2, vitaminB6: 0.22, vitaminB12: 0, vitaminC: 7.7, vitaminD: 0,
  vitaminE: 2.07, vitaminK: 10.1, folate: 27.3, thiamin: 0.18, riboflavin: 0.12,
  niacin: 1.7, choline: 15.3,
}

const NOTES = {
  en: 'Swaps and lightening: the wheat flour can be replaced with a gluten-free flour such as Jyttemel. The sugar can be reduced, or replaced with Sukrin or something naturally sweet — dates, ripe banana or similar. Press the grated courgette down into the measuring jug rather than letting it sit loose and airy, or use a larger amount; too little courgette makes the cake dry. Baking time varies with tin depth, so start checking at 40 minutes and take it out when a skewer comes out clean.',
  no: 'Bytter og lettere versjon: hvetemelet kan erstattes med et glutenfritt mel, f.eks. jyttemel. Sukkeret kan minskes eller erstattes med sukrin eller noe naturlig søtt — dadler, moden banan e.l. Press den revne squashen ned i målebegeret i stedet for å la den ligge løst og luftig, eller ta en større mengde; for lite squash gjør kaken tørr. Steketiden varierer med formens dybde, så begynn å sjekke etter 40 minutter og ta den ut når en kakepinne kommer ren ut.',
  sv: 'Byten och lättare version: vetemjölet kan ersättas med ett glutenfritt mjöl, t.ex. jyttemjöl. Sockret kan minskas eller ersättas med sukrin eller något naturligt sött — dadlar, mogen banan eller liknande. Pressa ner den rivna squashen i måttet i stället för att låta den ligga löst och luftig, eller ta en större mängd; för lite squash gör kakan torr. Gräddningstiden varierar med formens djup, så börja kolla efter 40 minuter och ta ut den när en provsticka kommer ut ren.',
}

// [quantity, unit, en, no, sv]
const INGREDIENTS = [
  [1.5, 'dl', 'Rapeseed (canola) oil', 'Rapsolje', 'Rapsolja'],
  [250, 'g', 'Raw cane sugar (see notes for lighter swaps)', 'Rørsukker (se tips for lettere bytter)', 'Råsocker (se tips för lättare byten)'],
  [1.5, 'tbsp', 'Psyllium husk', 'Psyllium husk', 'Psylliumfröskal'],
  [500, 'ml', 'Grated courgette, pressed down (not loose and airy)', 'Revet squash, presset ned (ikke løs og luftig)', 'Riven squash, nedpressad (inte lös och luftig)'],
  [1, 'pinch', 'Vanilla powder', 'Vaniljepulver', 'Vaniljpulver'],
  [350, 'g', 'Whole wheat flour, wholemeal', 'Sammalt hvetemel', 'Fullkornsvetemjöl'],
  [1, 'tsp', 'Baking soda', 'Natron', 'Bikarbonat'],
  [2, 'tsp', 'Baking powder', 'Bakepulver', 'Bakpulver'],
  [1, 'tsp', 'Sea salt', 'Havsalt', 'Havssalt'],
  [2, 'tsp', 'Ceylon cinnamon, ground', 'Ceylon kanel', 'Ceylonkanel'],
  [50, 'g', 'Walnuts', 'Valnøtter', 'Valnötter'],
  [100, 'g', 'Raisins', 'Rosiner', 'Russin'],
  [1.5, 'dl', 'Water', 'Vann', 'Vatten'],
]

const STEPS = {
  en: [
    'Mix the dry ingredients together.',
    'Put the walnuts and raisins in a food processor, or chop them into smaller pieces with a knife — how far you take it decides how much texture the cake keeps.',
    'Add the oil, courgette, water and the walnuts and raisins. Stir into an even batter.',
    'Transfer to a tin, either lined with baking paper or greased with oil, and bake 40–60 minutes at 180°C.',
  ],
  no: [
    'Bland det tørre sammen.',
    'Ha valnøttene og rosinene i food processor eller hakk i mindre biter med kniv, etter hvor mye tekstur du ønsker.',
    'Tilsett olje, squash, vann og valnøttene og rosinene. Rør til jevn røre.',
    'Ha i form, enten med bakepapir eller smurt med olje, og bak 40–60 min. på 180 °C.',
  ],
  sv: [
    'Blanda det torra tillsammans.',
    'Lägg valnötterna och russinen i matberedare eller hacka i mindre bitar med kniv, beroende på hur mycket textur du vill ha.',
    'Tillsätt olja, squash, vatten och valnötterna och russinen. Rör till en jämn smet.',
    'Häll i form, antingen med bakplåtspapper eller smord med olja, och grädda 40–60 min i 180 °C.',
  ],
}

const DESC = {
  en: 'A moist, spiced courgette cake with walnuts and raisins — a long-standing favourite with guests. Not a protocol recipe: it carries added sugar and oil, both of which can be dialled down (see notes).',
  no: 'En saftig, krydret squash-kake med valnøtter og rosiner — en gjenganger blant gjestene. Ikke en protokolloppskrift: den inneholder tilsatt sukker og olje, som begge kan reduseres (se tips).',
  sv: 'En saftig, kryddig squashkaka med valnötter och russin — en långvarig favorit bland gästerna. Inte ett protokollrecept: den innehåller tillsatt socker och olja, som båda kan minskas (se tips).',
}

const ings = (idx) => INGREDIENTS.map(([q, u, ...names]) => ({ quantity: q, unit: u, name: names[idx] }))

const RECIPE = {
  id: 'squash-cake',
  title: 'Squash Cake (Courgette & Walnut)',
  category: 'Dessert',
  servings: 12,
  prepTime: 20,
  cookTime: 50,
  imageUrl: 'data:image/jpeg;base64,' + fs.readFileSync(IMG).toString('base64'),
  description: DESC.en,
  tags: ['fredheim', 'dessert', 'vegan', 'baking'],
  kcal: Math.round(NUTRITION.calories),
  servingWeightGrams: 110,
  nutrition: { perServing: NUTRITION },
  notes: NOTES.en,
  ingredients: ings(0),
  steps: STEPS.en,
  translations: {
    no: { title: 'Squash-kake', description: DESC.no, notes: NOTES.no, ingredients: ings(1), steps: STEPS.no },
    sv: { title: 'Squashkaka', description: DESC.sv, notes: NOTES.sv, ingredients: ings(2), steps: STEPS.sv },
  },
}

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const existing = pack.recipes.find(r => r.id === RECIPE.id)
if (existing) {
  // Keep a photo added in-app since, but never clobber one set here.
  RECIPE.imageUrl = RECIPE.imageUrl || existing.imageUrl || null
  pack.recipes = pack.recipes.map(r => (r.id === RECIPE.id ? RECIPE : r))
  console.log('replaced existing', RECIPE.id)
} else {
  pack.recipes.push(RECIPE)
}
pack.version = '1.12.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log(`fredheim-recipes-with-pictures.json -> ${pack.version} | recipes: ${pack.recipes.length} | added: ${RECIPE.id} (${RECIPE.kcal} kcal/slice)`)

/* Adds the carob & black bean mousse to the Fredheim recipes pack.
 *
 * Three things about the author's nutrition table that needed handling
 * rather than copying:
 *
 * 1. It is stated for the WHOLE recipe ("hele oppskriften"), not per
 *    serving, so every figure is divided by 4. Carrying it across as-is
 *    would have quadrupled the recipe in the nutrition tracker.
 *
 * 2. Omega-6 is absent from the table. Left at zero it would read as a
 *    fat this recipe doesn't contain, while 5.7 g of polyunsaturated fat
 *    sits right above it. Taken as PUFA minus omega-3 — arithmetic on the
 *    author's own two numbers, not a new claim.
 *
 * 3. Vitamins A and D are given in IU, which the schema stores as µg.
 *    Vitamin D is zero either way. Vitamin A is converted at the
 *    provitamin-A carotenoid rate (1 IU = 0.05 µg RAE), correct for a
 *    recipe with no animal ingredients; 120 IU becomes 6 µg for the
 *    batch, 1.5 µg a serving.
 *
 * Left exactly as the author wrote it, and flagged in the report rather
 * than silently corrected: addedSugar = 0 alongside 45 ml of maple syrup.
 * The author's table is the author's to change. It costs no wrong badge —
 * audit_condition_tags reads the syrup in the ingredient list and
 * disqualifies the sugar-sensitive tags on that basis regardless.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/mousse_b64.txt'
const SERVINGS = 4

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.recipes.find(r => r.id === 'carob-black-bean-mousse')) throw new Error('already exists')
const imageUrl = fs.readFileSync(IMG, 'utf8').trim()

// The author's table, for the whole recipe.
const whole = {
  calories: 838, protein: 28, totalFat: 24.6, saturatedFat: 3.8,
  polyunsaturatedFat: 5.7, monounsaturatedFat: 13.4, omega3: 0.30,
  cholesterol: 0, totalCarbs: 122, totalSugars: 60, addedSugar: 0, fiber: 26,
  calcium: 160, potassium: 1450, copper: 2.1, iron: 8.6, magnesium: 300,
  manganese: 3.8, selenium: 30, phosphorus: 700, zinc: 6.9, sodium: 280,
  vitaminB6: 0.45, vitaminB12: 0, vitaminC: 10, vitaminD: 0, vitaminE: 1.3,
  vitaminK: 40, folate: 100, thiamin: 0.55, riboflavin: 0.35, niacin: 3.4,
  choline: 90,
}

const round = (n) => Math.round(n * 100) / 100
const perServing = {}
for (const [k, v] of Object.entries(whole)) perServing[k] = round(v / SERVINGS)
perServing.omega6 = round((whole.polyunsaturatedFat - whole.omega3) / SERVINGS)
perServing.vitaminA = round(120 * 0.05 / SERVINGS)

// Field order matching the rest of the pack.
const ORDER = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat',
  'monounsaturatedFat', 'omega3', 'omega6', 'cholesterol', 'totalCarbs',
  'totalSugars', 'addedSugar', 'fiber', 'calcium', 'potassium', 'copper',
  'iron', 'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc',
  'sodium', 'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD',
  'vitaminE', 'vitaminK', 'folate', 'thiamin', 'riboflavin', 'niacin', 'choline',
]
const ordered = {}
for (const k of ORDER) {
  if (perServing[k] === undefined) throw new Error(`nutrition field missing: ${k}`)
  ordered[k] = perServing[k]
}

const recipe = {
  id: 'carob-black-bean-mousse',
  title: 'Carob & Black Bean Mousse',
  category: 'Dessert',
  servings: SERVINGS,
  prepTime: 15,
  cookTime: 60, // the chill, which is what makes it set
  imageUrl,
  description: 'Naturally sweet, creamy and rich — no oil and no refined sugar.',
  tags: ['fredheim', 'dessert', 'vegan', 'oil-free', 'gluten-free'],
  kcal: Math.round(ordered.calories),
  // 250 g beans + ~120 g dates + 40 g carob + 130 ml milk + ~60 g syrup
  // + vanilla and salt ≈ 605 g, a little over 150 g a glass.
  servingWeightGrams: 151,
  nutrition: { perServing: ordered },
  ingredients: [
    { quantity: 250, unit: 'g', name: 'black beans, cooked' },
    { quantity: 5, unit: 'pcs', name: 'dates, pitted' },
    { quantity: 40, unit: 'g', name: 'carob powder' },
    { quantity: 130, unit: 'ml', name: 'plant milk' },
    { quantity: 45, unit: 'ml', name: 'maple syrup' },
    { quantity: 1, unit: 'tsp', name: 'vanilla extract' },
    { quantity: 1, unit: 'pinch', name: 'salt' },
  ],
  steps: [
    'Rinse the beans thoroughly, until the water runs completely clear. This is what keeps any bean taste out of the finished mousse.',
    'If the dates are dry rather than soft, soak them in warm water for 10 minutes and drain.',
    'Put everything into a powerful blender and blend until completely smooth and creamy, scraping down the sides as you go.',
    'Add a little more plant milk, a tablespoon at a time, if the mousse is too thick to fall slowly off the spoon.',
    'Taste, and add a little more maple syrup or an extra date if you want it sweeter.',
    'Chill for at least 1 hour before serving. The mousse firms up and turns silkier as it cools.',
  ],
  notes: 'Serving: top with fresh berries, sliced banana or grated sugar-free dark chocolate, and drizzle over a little extra maple syrup or carob sauce. For something more festive, layer the mousse with crushed raspberries in small glasses. Oat or cashew milk both work well; a thicker milk gives a richer result. Rinsing the beans properly is the step that decides whether this tastes like dessert or like beans, so do not rush it.',
  translations: {
    no: {
      title: 'Karobmousse med svarte bønner',
      description: 'Naturlig søt, kremet og rik — uten olje og uten raffinert sukker.',
      ingredients: [
        { quantity: 250, unit: 'g', name: 'svarte bønner, kokte' },
        { quantity: 5, unit: 'stk', name: 'dadler, uten stein' },
        { quantity: 40, unit: 'g', name: 'karobpulver' },
        { quantity: 130, unit: 'ml', name: 'plantemelk' },
        { quantity: 45, unit: 'ml', name: 'lønnesirup' },
        { quantity: 1, unit: 'ts', name: 'vaniljeekstrakt' },
        { quantity: 1, unit: 'klype', name: 'salt' },
      ],
      steps: [
        'Skyll bønnene grundig, til skyllevannet er helt klart. Det er dette som holder bønnesmaken borte fra den ferdige moussen.',
        'Er dadlene tørre og ikke myke, bløtlegg dem i varmt vann i 10 minutter og hell av vannet.',
        'Ha alt i en kraftig blender og kjør til det er helt glatt og kremet — skrap ned sidene underveis.',
        'Tilsett litt mer plantemelk, en spiseskje om gangen, hvis moussen er for tykk til å gli sakte av skjeen.',
        'Smak til, og ha i litt mer lønnesirup eller en ekstra daddel hvis du vil ha den søtere.',
        'Sett den i kjøleskapet i minst 1 time før servering. Moussen blir fastere og enda mer silkemyk når den kjøles ned.',
      ],
      notes: 'Servering: topp med friske bær, bananskiver eller revet mørk sjokolade uten sukker, og drypp gjerne litt ekstra lønnesirup eller karobsaus over. For en luksusvariant: legg moussen lagvis med most bringebær i små glass. Både havre- og cashewmelk fungerer fint; en tykkere melk gir et fyldigere resultat. Det å skylle bønnene ordentlig er trinnet som avgjør om dette smaker dessert eller bønner, så ikke stress med det.',
    },
    sv: {
      title: 'Carobmousse med svarta bönor',
      description: 'Naturligt söt, krämig och rik — utan olja och utan raffinerat socker.',
      ingredients: [
        { quantity: 250, unit: 'g', name: 'svarta bönor, kokta' },
        { quantity: 5, unit: 'st', name: 'dadlar, urkärnade' },
        { quantity: 40, unit: 'g', name: 'carobpulver' },
        { quantity: 130, unit: 'ml', name: 'växtmjölk' },
        { quantity: 45, unit: 'ml', name: 'lönnsirap' },
        { quantity: 1, unit: 'tsk', name: 'vaniljextrakt' },
        { quantity: 1, unit: 'nypa', name: 'salt' },
      ],
      steps: [
        'Skölj bönorna noga, tills sköljvattnet är helt klart. Det är det som håller bönsmaken borta från den färdiga moussen.',
        'Är dadlarna torra snarare än mjuka, blötlägg dem i varmt vatten i 10 minuter och häll av vattnet.',
        'Lägg allt i en kraftig mixer och kör tills det är helt slätt och krämigt — skrapa ner kanterna under tiden.',
        'Tillsätt lite mer växtmjölk, en matsked i taget, om moussen är för tjock för att långsamt glida av skeden.',
        'Smaka av, och tillsätt lite mer lönnsirap eller en extra dadel om du vill ha den sötare.',
        'Ställ den i kylen i minst 1 timme före servering. Moussen stelnar och blir ännu silkeslenare när den kyls.',
      ],
      notes: 'Servering: toppa med färska bär, bananskivor eller riven mörk choklad utan socker, och ringla gärna över lite extra lönnsirap eller carobsås. För en lyxvariant: varva moussen med mosade hallon i små glas. Både havre- och cashewmjölk fungerar bra; en tjockare mjölk ger ett fylligare resultat. Att skölja bönorna ordentligt är steget som avgör om det här smakar dessert eller bönor, så stressa inte med det.',
    },
  },
  createdAt: 1785398400000,
}

pack.recipes.push(recipe)

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${recipe.id} — ${pack.recipes.length} recipes, pack -> ${pack.version}`)
console.log(`per serving: ${ordered.calories} kcal, ${ordered.protein} g protein, ${ordered.fiber} g fibre, ${ordered.sodium} mg sodium`)
console.log(`derived: omega6 ${ordered.omega6} g (PUFA − omega-3), vitaminA ${ordered.vitaminA} µg (from 120 IU)`)
console.log('NOTE: author lists addedSugar 0 alongside 45 ml maple syrup — carried verbatim, worth confirming')

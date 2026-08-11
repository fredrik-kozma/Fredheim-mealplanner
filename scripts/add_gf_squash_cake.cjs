/* Adds orn-48, the gluten-free variant of the Zucchini & Walnut Cake
 * (orn-42): oat + buckwheat flour in place of whole wheat, psyllium
 * raised for binding, plus a batter-rest step and a cool-completely
 * instruction the wheat version doesn't need.
 *
 * Same conventions as the rest of this pack: EN canonical + NO + SV,
 * step text names ingredients without restating scaled amounts, and
 * nutrition comes from the author's own computed panel.
 *
 * The photo is deliberately copied from orn-42 at run time rather than
 * hardcoded — the author asked for the two cakes to share one image, and
 * copying keeps them identical without duplicating a ~150 KB base64
 * blob in this script. If orn-42 has no image yet the script says so and
 * leaves orn-48's null rather than guessing.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

if (pack.recipes.some(r => r.id === 'orn-48')) throw new Error('orn-48 already exists')

const wheatCake = pack.recipes.find(r => r.id === 'orn-42')
if (!wheatCake) throw new Error('orn-42 (wheat version) not found — cannot source the shared photo')

const recipe = {
  id: 'orn-48',
  title: 'Zucchini & Walnut Cake, Gluten-Free (GREEN)',
  category: 'Dessert',
  servings: 4,
  prepTime: 35,
  cookTime: 45,
  description: 'Gluten-free GREEN version — oat and buckwheat flour blend in place of whole wheat, psyllium bumped slightly for binding.',
  tags: ['ornish-green', 'dessert', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber', 'gluten-free'],
  kcal: 291,
  servingWeightGrams: 128,
  imageUrl: wheatCake.imageUrl || null,
  ingredients: [
    { quantity: 90, unit: 'g', name: 'oat flour (gluten-free)' },
    { quantity: 30, unit: 'g', name: 'buckwheat flour' },
    { quantity: 150, unit: 'g', name: 'zucchini, grated and squeezed' },
    { quantity: 100, unit: 'g', name: 'ripe banana, mashed' },
    { quantity: 100, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 20, unit: 'g', name: 'walnuts, chopped' },
    { quantity: 35, unit: 'g', name: 'raisins' },
    { quantity: 2, unit: 'tsp', name: 'psyllium husk' },
    { quantity: 0.3, unit: 'tsp', name: 'baking soda' },
    { quantity: 0.5, unit: 'tsp', name: 'baking powder' },
    { quantity: 0.1, unit: 'tsp', name: 'sea salt' },
    { quantity: 0.8, unit: 'tsp', name: 'Ceylon cinnamon' },
    { quantity: 0.3, unit: 'tsp', name: 'vanilla powder' },
    { quantity: 40, unit: 'ml', name: 'boiling water, for the date paste' },
    { quantity: 4, unit: 'tsp', name: 'ground flaxseed, for finishing' },
  ],
  steps: [
    'Make the date paste: Blend the pitted dates with the boiling water in a blender until smooth and thick.',
    'Mix the dry ingredients: Whisk together the oat flour, buckwheat flour, psyllium husk, baking soda, baking powder, sea salt, cinnamon and vanilla powder in a bowl.',
    'Mix the wet ingredients: Stir the date paste, mashed banana and squeezed grated zucchini together in a separate bowl.',
    'Combine: Fold the wet mixture into the dry. Fold in the chopped walnuts and raisins.',
    'Rest the batter: Let the batter stand for 10–15 minutes before baking so the psyllium can bind properly — gluten-free batter needs this to develop structure.',
    'Bake: Spread the batter into a loaf tin lined with baking paper. Bake at 180°C for about 40–45 minutes, until a skewer comes out clean.',
    'Serve: Let the cake cool completely in the tin before slicing — a gluten-free crumb is more fragile and needs to set. Slice, then sprinkle the ground flaxseed over each slice just before serving.',
  ],
  notes: "Chef's note: check the oat flour is labeled certified gluten-free if you're baking for anyone with celiac disease — regular oats are often cross-contaminated with wheat. Substitution: for even more fat and fiber margin, swap to a 60/60 oat-buckwheat split (earthier flavor, more headroom); for the smoothest crumb closest to wheat you could go 100% oat flour, but that sits right at the fat ceiling.",
  nutrition: { perServing: {
    calories: 291, protein: 7.1, totalFat: 7.1, saturatedFat: 0.9, polyunsaturatedFat: 3.5, monounsaturatedFat: 1.4,
    omega3: 1.18, omega6: 2.93, cholesterol: 0, totalCarbs: 55.0, totalSugars: 26.4, addedSugar: 0, fiber: 7.8,
    calcium: 59, potassium: 584, copper: 0.38, iron: 2.1, magnesium: 101, manganese: 1.76, selenium: 9.3,
    phosphorus: 209, zinc: 1.45, sodium: 220, vitaminA: 4.6, vitaminB6: 0.32, vitaminB12: 0, vitaminC: 9.2,
    vitaminD: 0, vitaminE: 0.30, vitaminK: 3.6, folate: 35.2, thiamin: 0.26, riboflavin: 0.14, niacin: 1.48, choline: 26.0,
  } },
  translations: {
    no: {
      title: 'Squash- & valnøttkake, glutenfri (GREEN)',
      description: 'Glutenfri GREEN-versjon — blanding av havremel og bokhvetemel i stedet for sammalt hvete, psyllium økt litt for binding.',
      ingredients: [
        { quantity: 90, unit: 'g', name: 'havremel (glutenfritt)' },
        { quantity: 30, unit: 'g', name: 'bokhvetemel' },
        { quantity: 150, unit: 'g', name: 'squash (zucchini), revet og presset' },
        { quantity: 100, unit: 'g', name: 'moden banan, most' },
        { quantity: 100, unit: 'g', name: 'Medjool-dadler, uten stein' },
        { quantity: 20, unit: 'g', name: 'valnøtter, hakket' },
        { quantity: 35, unit: 'g', name: 'rosiner' },
        { quantity: 2, unit: 'tsp', name: 'psylliumfrøskall' },
        { quantity: 0.3, unit: 'tsp', name: 'natron' },
        { quantity: 0.5, unit: 'tsp', name: 'bakepulver' },
        { quantity: 0.1, unit: 'tsp', name: 'havsalt' },
        { quantity: 0.8, unit: 'tsp', name: 'Ceylon kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljepulver' },
        { quantity: 40, unit: 'ml', name: 'kokende vann, til daddelpastaen' },
        { quantity: 4, unit: 'tsp', name: 'malt linfrø, til pynt' },
      ],
      steps: [
        'Lag daddelpasta: Bland de urkjernede daddlene med det kokende vannet i en blender til en jevn, tykk pasta.',
        'Bland det tørre: Bland havremel, bokhvetemel, psylliumfrøskall, natron, bakepulver, havsalt, Ceylon kanel og vaniljepulver i en bolle.',
        'Bland det våte: Rør sammen daddelpastaen, moden mostet banan og revet, presset squash i en egen bolle.',
        'Sett sammen røren: Vend den våte blandingen inn i den tørre. Vend inn hakkede valnøtter og rosiner.',
        'La røren hvile: La røren stå i 10–15 minutter før steking, slik at psylliumet får bundet skikkelig — glutenfri røre trenger dette for å få struktur.',
        'Stek: Ha røren i en avlang form kledd med bakepapir. Stek på 180°C i cirka 40–45 minutter, til en tannpirker kommer ren ut.',
        'Server: La kaken avkjøles helt i formen før du skjærer — glutenfri krumme er mer skjør og trenger å sette seg. Skjær i skiver, dryss deretter malt linfrø over hver skive rett før servering.',
      ],
      notes: 'Kokketips: sjekk at havremelet er merket sertifisert glutenfritt hvis du baker til noen med cøliaki — vanlig havre er ofte krysskontaminert med hvete. Erstatning: for enda bedre margin på fett og fiber, bytt til en 60/60-fordeling havre-bokhvete (jordaktig smak, mer slingringsmonn); for den glatteste krummen nærmest hvete kan du gå 100 % havremel, men da ligger du helt på fettgrensen.',
    },
    sv: {
      title: 'Squash- & valnötskaka, glutenfri (GREEN)',
      description: 'Glutenfri GREEN-version — blandning av havremjöl och bovetemjöl i stället för fullkornsvete, psyllium något höjt för bindning.',
      ingredients: [
        { quantity: 90, unit: 'g', name: 'havremjöl (glutenfritt)' },
        { quantity: 30, unit: 'g', name: 'bovetemjöl' },
        { quantity: 150, unit: 'g', name: 'squash (zucchini), riven och pressad' },
        { quantity: 100, unit: 'g', name: 'mogen banan, mosad' },
        { quantity: 100, unit: 'g', name: 'Medjooldadlar, urkärnade' },
        { quantity: 20, unit: 'g', name: 'valnötter, hackade' },
        { quantity: 35, unit: 'g', name: 'russin' },
        { quantity: 2, unit: 'tsp', name: 'psylliumfröskal' },
        { quantity: 0.3, unit: 'tsp', name: 'bikarbonat' },
        { quantity: 0.5, unit: 'tsp', name: 'bakpulver' },
        { quantity: 0.1, unit: 'tsp', name: 'havssalt' },
        { quantity: 0.8, unit: 'tsp', name: 'Ceylonkanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljpulver' },
        { quantity: 40, unit: 'ml', name: 'kokande vatten, till dadelpastan' },
        { quantity: 4, unit: 'tsp', name: 'malda linfrön, till garnering' },
      ],
      steps: [
        'Gör dadelpastan: Mixa de urkärnade dadlarna med det kokande vattnet i en mixer till en jämn, tjock pasta.',
        'Blanda det torra: Blanda havremjöl, bovetemjöl, psylliumfröskal, bikarbonat, bakpulver, havssalt, Ceylonkanel och vaniljpulver i en skål.',
        'Blanda det blöta: Rör ihop dadelpastan, mogen mosad banan och riven, pressad squash i en separat skål.',
        'Sätt ihop smeten: Vänd ner den blöta blandningen i den torra. Vänd ner hackade valnötter och russin.',
        'Låt smeten vila: Låt smeten stå i 10–15 minuter före gräddning så att psylliumet hinner binda ordentligt — glutenfri smet behöver detta för att få struktur.',
        'Grädda: Häll smeten i en avlång form klädd med bakplåtspapper. Grädda i 180°C i cirka 40–45 minuter, tills en sticka kommer ren ut.',
        'Servera: Låt kakan svalna helt i formen innan du skär — en glutenfri inkråm är skörare och behöver sätta sig. Skär i skivor, strö sedan malda linfrön över varje skiva precis före servering.',
      ],
      notes: 'Kockens tips: kontrollera att havremjölet är märkt certifierat glutenfritt om du bakar till någon med celiaki — vanlig havre är ofta korskontaminerad med vete. Ersättning: för ännu bättre marginal på fett och fiber, byt till en 60/60-fördelning havre-bovete (jordigare smak, mer utrymme); för den slätaste inkråmen närmast vete kan du köra 100 % havremjöl, men då ligger du precis på fettaket.',
    },
  },
}

pack.recipes.push(recipe)

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added orn-48. Pack -> ${pack.version}. Total: ${pack.recipes.length}`)
console.log(
  wheatCake.imageUrl
    ? `Photo copied from orn-42 (${Math.round(wheatCake.imageUrl.length / 1024)} KB)`
    : 'NOTE: orn-42 has no photo yet, so orn-48 was left with imageUrl: null. Re-run once orn-42 has its image.'
)

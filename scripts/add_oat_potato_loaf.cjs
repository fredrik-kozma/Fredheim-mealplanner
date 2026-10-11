/* Adds the loaf version of the gluten-free oat & potato bread (orn-17's
 * rolls) to the reversal-protocol pack, and links the two as siblings.
 *
 * It belongs in this pack rather than the Fredheim one because it is an
 * Ornish GREEN recipe and the sibling it is derived from lives here.
 *
 * The author's nutrition panel is carried verbatim. It checks out against
 * the rolls, which is a useful corroboration: both are 107 g a serving and
 * 191 kcal, and the loaf is the roll batch at 1.5x over 12 servings
 * instead of 8. The one figure with nowhere to go is the omega-6:omega-3
 * ratio (1.1:1), which the 35-field schema has no slot for and which is
 * derivable from the two values that are stored.
 *
 * Two things in the source needed resolving rather than transcribing:
 *
 * 1. The oat flour contradicted itself — step 2 takes 40 g of the 300 g
 *    for the porridge, step 3 then calls for "the remaining 300 g". Split
 *    into 260 g + 40 g for the porridge, which is how orn-17 already
 *    handles the same problem and keeps the total at 300 g.
 *
 * 2. The bake read "65 minutes at 220°C, then 180°C for a further 45–55"
 *    — about 115 minutes, with the high-heat phase 6.5x the rolls' 10
 *    minutes of the identical dough. Confirmed with the author as a typo
 *    for 15 minutes, so the profile is 15 at 220°C then 45–55 at 180°C,
 *    and the "start checking at 100 minutes" that followed from it moves
 *    to 60.
 *
 * Step text is de-quantified as usual, so the amounts live in the
 * ingredient list where scaling keeps them true.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-reversal-protocol.json')
const IMG = 'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/loaf_b64.txt'
const ID = 'orn-66'
const SIBLING = 'orn-17'

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
if (pack.recipes.find(r => r.id === ID)) throw new Error(`${ID} already exists`)
const rolls = pack.recipes.find(r => r.id === SIBLING)
if (!rolls) throw new Error(`${SIBLING} not found to link to`)

let globalMax = 0
for (const f of PACKS) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
  for (const r of j.recipes) globalMax = Math.max(globalMax, r.createdAt || 0)
}

const recipe = {
  id: ID,
  title: 'Gluten-Free Oat & Potato Loaf',
  category: 'Bread',
  servings: 12,
  prepTime: 30,
  cookTime: 65,
  imageUrl: fs.readFileSync(IMG, 'utf8').trim(),
  description: 'The oat and potato rolls baked as a loaf instead — soft, fluffy and gluten-free, with no oil and no sugar. Twelve slices from a 25x11 cm tin.',
  tags: ['ornish-green', 'bread', 'vegan', 'oil-free', 'no-added-sugar', 'gluten-free'],
  kcal: 191,
  servingWeightGrams: 107,
  nutrition: {
    perServing: {
      calories: 191, protein: 5.4, totalFat: 3.2, saturatedFat: 0.5,
      polyunsaturatedFat: 1.5, monounsaturatedFat: 0.8, omega3: 0.65, omega6: 0.72,
      cholesterol: 0, totalCarbs: 36.5, totalSugars: 0.7, addedSugar: 0, fiber: 6.2,
      calcium: 20, potassium: 310, copper: 0.16, iron: 1.9, magnesium: 50,
      manganese: 1.1, selenium: 6.4, phosphorus: 142, zinc: 1.0, sodium: 185,
      vitaminA: 0, vitaminB6: 0.24, vitaminB12: 0, vitaminC: 5.2, vitaminD: 0,
      vitaminE: 0.3, vitaminK: 2.1, folate: 24, thiamin: 0.24, riboflavin: 0.07,
      niacin: 2.3, choline: 16,
    },
  },
  // Index-aligned with orn-17 and using its exact ingredient wording, so
  // the pair reads as one recipe in two shapes.
  ingredients: [
    { quantity: 260, unit: 'g', name: 'Gluten-free oat flour' },
    { quantity: 40, unit: 'g', name: 'Gluten-free oat flour for the porridge' },
    { quantity: 180, unit: 'g', name: 'Brown rice flour' },
    { quantity: 150, unit: 'g', name: 'Plain cooked mashed potato (no additions)' },
    { quantity: 18, unit: 'g', name: 'Psyllium husk powder' },
    { quantity: 12, unit: 'g', name: 'Ground flaxseed' },
    { quantity: 10, unit: 'g', name: 'Dry yeast' },
    { quantity: 4, unit: 'g', name: 'Salt' },
    { quantity: 225, unit: 'ml', name: 'Water (for the oat porridge)' },
    { quantity: 20, unit: 'ml', name: 'Fresh lemon juice' },
    { quantity: 450, unit: 'ml', name: 'Lukewarm water (38–40°C)' },
  ],
  steps: [
    'Boil a large potato until fully soft, drain and mash completely smooth — no lumps. Set aside to cool to room temperature.',
    'Make an oat porridge: cook the oat flour for the porridge together with the porridge water over medium heat, stirring constantly, until thickened (2–3 minutes). Cool to room temperature.',
    'Whisk together the oat flour, brown rice flour, psyllium husk powder, ground flaxseed, dry yeast and salt in a large bowl.',
    'In a separate bowl combine the cooled oat porridge, mashed potato, lemon juice and lukewarm water. Mix until smooth.',
    'Pour the wet ingredients into the dry and mix vigorously for 4–5 minutes until the dough is thick, sticky and holds its shape. It should not run. Add 1–2 tbsp water if it is too stiff.',
    'Line a 25x11 cm loaf tin with baking paper. Scoop all the dough in and smooth the top with a wet spatula or a wet hand.',
    'Cover loosely with plastic wrap or a damp cloth and let rise at room temperature for 45–50 minutes, until the dough has risen close to the rim of the tin.',
    'Bake at 220°C for 15 minutes, then reduce to 180°C and bake a further 45–55 minutes. If the top browns too quickly, tent loosely with foil 25–30 minutes into the lower heat and remove it for the last 5 minutes.',
    'Tap the base — it should sound hollow, and the centre should reach 96–98°C. Start checking from 60 minutes of total baking. Cool on a rack for at least 1.5–2 hours before slicing.',
  ],
  notes: 'Tin: a 25x11 cm loaf tin, 1.2–1.5 litres. Line it with baking paper — no greasing needed, which is what keeps the loaf oil-free. Dough: this is a thick, sticky batter rather than a kneadable wheat dough, so smooth the top with a wet spatula instead of trying to shape it; it does not need to be perfectly even. Cooling is not optional: the crumb keeps setting as it cools, and slicing a warm loaf gives a gummy texture. Keeps 3–4 days airtight, or slice before freezing and it keeps a month.',
  relatedRecipes: [SIBLING],
  translations: {
    no: {
      title: 'Glutenfritt havre- og potetbrød (form)',
      description: 'Havre- og potetrundstykkene stekt som brød i form i stedet — mykt, luftig og glutenfritt, uten olje og uten sukker. Tolv skiver fra en form på 25x11 cm.',
      ingredients: [
        { quantity: 260, unit: 'g', name: 'Glutenfritt havremel' },
        { quantity: 40, unit: 'g', name: 'Glutenfritt havremel til grøten' },
        { quantity: 180, unit: 'g', name: 'Brunt rismel' },
        { quantity: 150, unit: 'g', name: 'Kokt potet, most (uten tilsetninger)' },
        { quantity: 18, unit: 'g', name: 'Psylliumfrøskall, pulver' },
        { quantity: 12, unit: 'g', name: 'Malt linfrø' },
        { quantity: 10, unit: 'g', name: 'Tørrgjær' },
        { quantity: 4, unit: 'g', name: 'Salt' },
        { quantity: 225, unit: 'ml', name: 'Vann (til havregrøten)' },
        { quantity: 20, unit: 'ml', name: 'Fersk sitronsaft' },
        { quantity: 450, unit: 'ml', name: 'Lunkent vann (38–40°C)' },
      ],
      steps: [
        'Kok en stor potet til den er helt myk, hell av vannet og mos den helt glatt — ingen klumper. Sett den til side og la den bli romtemperert.',
        'Lag en havregrøt: kok havremelet til grøten sammen med vannet til grøten over middels varme, rør hele tiden, til det tykner (2–3 minutter). Avkjøl til romtemperatur.',
        'Visp sammen havremelet, rismelet, psylliumfrøskallet, det malte linfrøet, tørrgjæren og saltet i en stor bolle.',
        'Bland den avkjølte havregrøten, potetmosen, sitronsaften og det lunkne vannet i en annen bolle. Rør til det er glatt.',
        'Hell de våte ingrediensene i de tørre og bland kraftig i 4–5 minutter til deigen er tykk, klebrig og holder formen. Den skal ikke renne. Tilsett 1–2 ss vann hvis den er for stiv.',
        'Kle en brødform på 25x11 cm med bakepapir. Ha hele deigen i formen og glatt toppen med en våt slikkepott eller våt hånd.',
        'Dekk løst med plastfolie eller et fuktig klede og la heve i romtemperatur i 45–50 minutter, til deigen har hevet seg nesten opp til kanten av formen.',
        'Stek ved 220°C i 15 minutter, reduser så til 180°C og stek videre i 45–55 minutter. Blir toppen for mørk, legg et løst stykke folie over etter 25–30 minutter på lav varme, og ta det av de siste 5 minuttene.',
        'Bank på undersiden — det skal høres hult ut, og kjernetemperaturen skal være 96–98°C. Begynn å sjekke etter 60 minutters samlet steketid. Avkjøl på rist i minst 1,5–2 timer før du skjærer i brødet.',
      ],
      notes: 'Form: en brødform på 25x11 cm, 1,2–1,5 liter. Kle den med bakepapir — den trenger ikke smøres, og det er nettopp det som holder brødet oljefritt. Deig: dette er en tykk, klebrig røre, ikke en eltbar hvetedeig, så glatt toppen med en våt slikkepott i stedet for å prøve å forme den; den trenger ikke bli helt jevn. Avkjølingen er ikke valgfri: krummen fortsetter å sette seg mens brødet kjøles, og skjærer du i et varmt brød blir det klissete. Holder seg 3–4 dager i lufttett boks, eller skjær det opp før frysing, så holder det en måned.',
    },
    sv: {
      title: 'Glutenfritt havre- och potatisbröd (form)',
      description: 'Havre- och potatisfrallorna bakade som ett formbröd i stället — mjukt, luftigt och glutenfritt, utan olja och utan socker. Tolv skivor från en form på 25x11 cm.',
      ingredients: [
        { quantity: 260, unit: 'g', name: 'Glutenfritt havremjöl' },
        { quantity: 40, unit: 'g', name: 'Glutenfritt havremjöl till gröten' },
        { quantity: 180, unit: 'g', name: 'Brunt rismjöl' },
        { quantity: 150, unit: 'g', name: 'Kokt potatis, mosad (utan tillsatser)' },
        { quantity: 18, unit: 'g', name: 'Psylliumfröskal, pulver' },
        { quantity: 12, unit: 'g', name: 'Malda linfrön' },
        { quantity: 10, unit: 'g', name: 'Torrjäst' },
        { quantity: 4, unit: 'g', name: 'Salt' },
        { quantity: 225, unit: 'ml', name: 'Vatten (till havregröten)' },
        { quantity: 20, unit: 'ml', name: 'Färsk citronjuice' },
        { quantity: 450, unit: 'ml', name: 'Ljummet vatten (38–40°C)' },
      ],
      steps: [
        'Koka en stor potatis tills den är helt mjuk, häll av vattnet och mosa den helt slät — inga klumpar. Ställ den åt sidan och låt den bli rumstempererad.',
        'Gör en havregröt: koka havremjölet till gröten tillsammans med vattnet till gröten på medelvärme under ständig omrörning tills det tjocknar (2–3 minuter). Låt svalna till rumstemperatur.',
        'Vispa ihop havremjölet, rismjölet, psylliumfröskalet, de malda linfröna, torrjästen och saltet i en stor skål.',
        'Blanda den svalnade havregröten, potatismoset, citronjuicen och det ljumma vattnet i en annan skål. Rör tills det är slätt.',
        'Häll de våta ingredienserna över de torra och blanda kraftigt i 4–5 minuter tills degen är tjock, kladdig och håller formen. Den ska inte rinna. Tillsätt 1–2 msk vatten om den är för stel.',
        'Klä en brödform på 25x11 cm med bakplåtspapper. Lägg i hela degen och jämna till ytan med en blöt slickepott eller blöt hand.',
        'Täck löst med plastfolie eller en fuktig handduk och låt jäsa i rumstemperatur i 45–50 minuter, tills degen har jäst nästan upp till formens kant.',
        'Grädda i 220°C i 15 minuter, sänk sedan till 180°C och grädda vidare i 45–55 minuter. Blir ytan för mörk, lägg en bit folie löst över efter 25–30 minuter på den lägre värmen och ta bort den de sista 5 minuterna.',
        'Knacka på undersidan — det ska låta ihåligt, och innertemperaturen ska vara 96–98°C. Börja kontrollera efter 60 minuters sammanlagd gräddning. Låt svalna på galler i minst 1,5–2 timmar innan du skär i brödet.',
      ],
      notes: 'Form: en brödform på 25x11 cm, 1,2–1,5 liter. Klä den med bakplåtspapper — den behöver inte smörjas, och det är just det som håller brödet oljefritt. Deg: det här är en tjock, kladdig smet, inte en knådbar vetedeg, så jämna till ytan med en blöt slickepott i stället för att försöka forma den; den behöver inte bli helt jämn. Avsvalningen är inte valfri: inkråmet fortsätter att sätta sig medan brödet svalnar, och skär du i ett varmt bröd blir det kladdigt. Håller sig 3–4 dagar i lufttät burk, eller skiva det före frysning så håller det en månad.',
    },
  },
  createdAt: globalMax + 3600000,
}

// Sibling pair, so the link runs both ways — the same convention the
// pressure-cooker and stovetop porridges use. A component link (bread ->
// starter) is the one-way case; these two are alternatives to each other.
rolls.relatedRecipes = [...new Set([...(rolls.relatedRecipes || []), ID])]

for (const [lang, tr] of Object.entries(recipe.translations)) {
  if (tr.ingredients.length !== recipe.ingredients.length) throw new Error(`${lang} ingredient count mismatch`)
  if (tr.steps.length !== recipe.steps.length) throw new Error(`${lang} step count mismatch`)
  tr.ingredients.forEach((ing, i) => {
    if (ing.quantity !== recipe.ingredients[i].quantity) throw new Error(`${lang}[${i}] quantity mismatch`)
  })
}
// The two oat flour lines must still add up to the 300 g the source gives.
const oat = recipe.ingredients.filter(i => /oat flour/i.test(i.name)).reduce((s, i) => s + i.quantity, 0)
if (oat !== 300) throw new Error(`oat flour totals ${oat} g, expected 300`)

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${ID} — ${recipe.title}`)
console.log(`oat flour split 260 + 40 = ${oat} g`)
console.log(`bake: 15 min @220°C then 45–55 @180°C (cookTime ${recipe.cookTime})`)
console.log(`linked both ways with ${SIBLING}: ${rolls.title} -> ${JSON.stringify(rolls.relatedRecipes)}`)
console.log(`Pack -> ${pack.version}`)

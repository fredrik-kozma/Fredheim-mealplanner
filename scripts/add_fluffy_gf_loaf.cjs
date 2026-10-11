/* The Fluffy Gluten-Free Bread, baked as a loaf instead of rolls.
 *
 * Second of the two loaf recipes. This one uses the fluffy bread's dough
 * exactly — potato starch, no flaxseed, no mashed potato — where orn-66
 * uses the oat & potato dough. They share the photo and nothing else.
 *
 * It goes in the Fredheim pack rather than the reversal protocol, next to
 * the rolls it comes from. That is not arbitrary: this dough is not an
 * Ornish GREEN recipe. At 2.4 g of fibre a slice it falls under the 3 g
 * floor the audit applies, which is also why it carries no heart-healthy
 * tag. Filing it beside the GREEN breads would imply something about it
 * that is not true.
 *
 * Nutrition is copied straight from the rolls rather than recomputed,
 * which is correct rather than lazy: it is the same dough, the same
 * batch and the same twelve portions, just a different shape. Copying
 * also means the two can never drift apart — recompute one and the other
 * is visibly stale.
 *
 * The one genuinely derived number is the bake. The rolls take 8-10
 * minutes at 220°C then 18 at 190°C; the oat & potato loaf, 1.3 kg of
 * dough, takes 15 at 220°C then 45-55 at 180°C. This loaf is 907 g of
 * dough, between the two, so 15 at 220°C then 35-45 at 180°C. Times are
 * a guide — the 96-98°C in the middle is the test that actually decides
 * it, and the steps say so.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-recipes-with-pictures.json')
const ID = 'fluffy-gluten-free-loaf'
const SIBLING = 'ultimate-fluffy-vegan-gluten-free-bread'
const PHOTO_FROM = 'orn-66'   // the loaf photo, in the reversal pack

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
if (pack.recipes.find(r => r.id === ID)) throw new Error(`${ID} already exists`)
const rolls = pack.recipes.find(r => r.id === SIBLING)
if (!rolls) throw new Error(`${SIBLING} not found`)

const reversal = JSON.parse(fs.readFileSync(path.join(DIR, 'fredheim-reversal-protocol.json'), 'utf8'))
const photoSource = reversal.recipes.find(r => r.id === PHOTO_FROM)
if (!photoSource?.imageUrl) throw new Error(`no photo on ${PHOTO_FROM} to reuse`)

// Same dough, same batch, same twelve portions — so the rolls' figures
// are this loaf's figures. Deep-copied so a later edit to one is a
// deliberate act rather than an accident of a shared reference.
const perServing = JSON.parse(JSON.stringify(rolls.nutrition.perServing))
const copyIngredients = (list) => list.map(i => ({ ...i }))

let globalMax = 0
for (const f of PACKS) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
  for (const r of j.recipes) globalMax = Math.max(globalMax, r.createdAt || 0)
}

const recipe = {
  id: ID,
  title: 'Fluffy Gluten-Free Loaf',
  category: 'Bread',
  servings: rolls.servings,
  prepTime: 50,
  cookTime: 55,
  imageUrl: photoSource.imageUrl,
  description: 'The fluffy gluten-free bread baked in a tin instead of shaped into rolls. Same dough — potato starch for lightness, psyllium for structure — in twelve slices.',
  tags: [...rolls.tags],
  kcal: rolls.kcal,
  servingWeightGrams: rolls.servingWeightGrams,
  nutrition: { perServing },
  relatedRecipes: [SIBLING],
  ingredients: copyIngredients(rolls.ingredients),
  steps: [
    'Make the porridge: cook the oat flour for the porridge together with the porridge water in a small pan over medium heat, stirring constantly, until it thickens — about 2-3 minutes. Cool to room temperature.',
    'Whisk the dry ingredients together in a large bowl: the oat flour, rice flour, potato starch, psyllium husk powder, dry yeast and salt.',
    'In another bowl, combine the cooled porridge, the lemon juice and the warm water (38-40°C).',
    'Pour the wet ingredients into the dry and mix vigorously for 4-5 minutes, until the dough is sticky but holds its shape. It should relax slowly when pushed, not spread flat.',
    'Line a 20x10 cm loaf tin with baking paper. Scoop all the dough in and smooth the top with a wet spatula or a wet hand.',
    'Cover loosely with plastic wrap or a damp cloth and let rise at room temperature for 45-60 minutes, until the dough has risen close to the rim of the tin.',
    'Bake at 220°C for 15 minutes, then reduce to 180°C and bake a further 35-45 minutes, until the top is light golden.',
    'The loaf is done when the base sounds hollow and the centre reaches 96-98°C. Go by the temperature rather than the clock — a tin, an oven and a dough all vary.',
    'Cool on a rack for at least 1.5 hours before slicing. The crumb keeps setting as it cools, and a warm loaf cuts gummy.',
    'Store airtight; it stays soft for 3-4 days, or slice before freezing and it keeps a month.',
  ],
  notes: 'Tin: a 20x10 cm tin, about 1 litre, suits this batch. In a larger 25x11 cm tin the loaf comes out flatter — make one and a half times the dough if you want it to fill that one. Line the tin with baking paper rather than greasing it, which is what keeps the bread oil-free. The dough is a thick, sticky batter, not a kneadable wheat dough, so smooth the top instead of trying to shape it. Cooling is not optional: slicing warm gives a gummy crumb however well it baked.',
  translations: {
    no: {
      title: 'Luftig glutenfritt brød (form)',
      description: 'Det luftige glutenfrie brødet stekt i form i stedet for formet til rundstykker. Samme deig — potetstivelse for luftighet, psyllium for struktur — i tolv skiver.',
      ingredients: copyIngredients(rolls.translations.no.ingredients),
      steps: [
        'Lag grøten: kok havremelet til grøten sammen med vannet til grøten i en liten kjele over middels varme, rør hele tiden, til det tykner — omtrent 2-3 minutter. Avkjøl til romtemperatur.',
        'Visp sammen de tørre ingrediensene i en stor bolle: havremelet, rismelet, potetstivelsen, psylliumpulveret, tørrgjæren og saltet.',
        'Bland den avkjølte grøten, sitronsaften og det lunkne vannet (38-40°C) i en annen bolle.',
        'Hell de våte ingrediensene i de tørre og bland kraftig i 4-5 minutter, til deigen er klebrig, men holder formen. Den skal slappe sakte av når du trykker på den, ikke renne utover.',
        'Kle en brødform på 20x10 cm med bakepapir. Ha hele deigen i formen og glatt toppen med en våt slikkepott eller våt hånd.',
        'Dekk løst med plastfolie eller et fuktig klede og la heve i romtemperatur i 45-60 minutter, til deigen har hevet seg nesten opp til kanten av formen.',
        'Stek ved 220°C i 15 minutter, reduser så til 180°C og stek videre i 35-45 minutter, til toppen er lyst gyllen.',
        'Brødet er ferdig når undersiden høres hul ut og kjernetemperaturen er 96-98°C. Gå etter temperaturen framfor klokka — form, ovn og deig varierer.',
        'Avkjøl på rist i minst 1,5 time før du skjærer i det. Krummen fortsetter å sette seg mens brødet kjøles, og et varmt brød blir klissete å skjære i.',
        'Oppbevares lufttett; det holder seg mykt i 3-4 dager, eller skjær det opp før frysing, så holder det en måned.',
      ],
      notes: 'Form: en form på 20x10 cm, omtrent 1 liter, passer denne satsen. I en større form på 25x11 cm blir brødet flatere — lag halvannen gang deigen hvis du vil fylle den. Kle formen med bakepapir i stedet for å smøre den; det er det som holder brødet oljefritt. Deigen er en tykk, klebrig røre, ikke en eltbar hvetedeig, så glatt toppen i stedet for å prøve å forme den. Avkjølingen er ikke valgfri: skjærer du i brødet mens det er varmt, blir krummen klissete uansett hvor godt det er stekt.',
    },
    sv: {
      title: 'Luftigt glutenfritt bröd (form)',
      description: 'Det luftiga glutenfria brödet gräddat i form i stället för format till frallor. Samma deg — potatisstärkelse för luftighet, psyllium för struktur — i tolv skivor.',
      ingredients: copyIngredients(rolls.translations.sv.ingredients),
      steps: [
        'Gör gröten: koka havremjölet till gröten tillsammans med vattnet till gröten i en liten kastrull på medelvärme under ständig omrörning tills det tjocknar — ungefär 2-3 minuter. Låt svalna till rumstemperatur.',
        'Vispa ihop de torra ingredienserna i en stor skål: havremjölet, rismjölet, potatisstärkelsen, psylliumpulvret, torrjästen och saltet.',
        'Blanda den svalnade gröten, citronjuicen och det ljumma vattnet (38-40°C) i en annan skål.',
        'Häll de våta ingredienserna över de torra och blanda kraftigt i 4-5 minuter, tills degen är kladdig men håller formen. Den ska slappna av långsamt när du trycker på den, inte rinna ut.',
        'Klä en brödform på 20x10 cm med bakplåtspapper. Lägg i hela degen och jämna till ytan med en blöt slickepott eller blöt hand.',
        'Täck löst med plastfolie eller en fuktig handduk och låt jäsa i rumstemperatur i 45-60 minuter, tills degen har jäst nästan upp till formens kant.',
        'Grädda i 220°C i 15 minuter, sänk sedan till 180°C och grädda vidare i 35-45 minuter, tills ytan är ljust gyllene.',
        'Brödet är klart när undersidan låter ihålig och innertemperaturen är 96-98°C. Gå efter temperaturen snarare än klockan — form, ugn och deg varierar.',
        'Låt svalna på galler i minst 1,5 timme innan du skär i det. Inkråmet fortsätter att sätta sig medan brödet svalnar, och ett varmt bröd blir kladdigt att skära i.',
        'Förvaras lufttätt; det håller sig mjukt i 3-4 dagar, eller skiva det före frysning så håller det en månad.',
      ],
      notes: 'Form: en form på 20x10 cm, ungefär 1 liter, passar den här satsen. I en större form på 25x11 cm blir brödet plattare — gör en och en halv gång degen om du vill fylla den. Klä formen med bakplåtspapper i stället för att smörja den; det är det som håller brödet oljefritt. Degen är en tjock, kladdig smet, inte en knådbar vetedeg, så jämna till ytan i stället för att försöka forma den. Avsvalningen är inte valfri: skär du i brödet medan det är varmt blir inkråmet kladdigt hur väl det än är gräddat.',
    },
  },
  createdAt: globalMax + 3600000,
}

// Sibling pair — rolls and loaf of one dough, each an alternative to the
// other, so the link runs both ways.
rolls.relatedRecipes = [...new Set([...(rolls.relatedRecipes || []), ID])]

for (const [lang, tr] of Object.entries(recipe.translations)) {
  if (tr.ingredients.length !== recipe.ingredients.length) throw new Error(`${lang} ingredient count mismatch`)
  if (tr.steps.length !== recipe.steps.length) throw new Error(`${lang} step count mismatch`)
  tr.ingredients.forEach((ing, i) => {
    if (ing.quantity !== recipe.ingredients[i].quantity) throw new Error(`${lang}[${i}] quantity mismatch`)
  })
}
// What the author actually asked for: this dough, not the other loaf's.
if (!recipe.ingredients.some(i => /potato starch/i.test(i.name))) throw new Error('potato starch missing')
if (recipe.ingredients.some(i => /flax/i.test(i.name))) throw new Error('flaxseed should not be here')
if (recipe.ingredients.some(i => /mashed potato/i.test(i.name))) throw new Error('mashed potato belongs to orn-66, not this one')

pack.recipes.push(recipe)
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${ID} — ${recipe.title}`)
console.log(`dough: ${recipe.ingredients.map(i => `${i.quantity}${i.unit}`).join(' + ')}`)
console.log(`potato starch: yes · flaxseed: no · mashed potato: no`)
console.log(`nutrition copied from ${SIBLING}: ${perServing.calories} kcal / ${recipe.servingWeightGrams} g a slice`)
console.log(`photo reused from ${PHOTO_FROM}`)
console.log(`linked both ways with ${SIBLING} -> ${JSON.stringify(rolls.relatedRecipes)}`)
console.log(`Pack -> ${pack.version}`)

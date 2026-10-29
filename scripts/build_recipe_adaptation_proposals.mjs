// Adaptation proposals: hearty mains, stews, burgers and bean/lentil dishes
// changed just enough to qualify as diabetes-friendly, heart-healthy and
// blood-pressure-friendly under the existing criteria
// (scripts/lib/recipeLabels.mjs, the same as the label report).
//
// PROPOSE ONLY: reads the packs, applies each adaptation to a copy in
// memory, recalculates per-serving nutrition from the ingredient rows
// (scripts/data/food-composition-core.json) and the labels, and writes
//   scripts/data/recipe-adaptation-proposals.json
//   scripts/data/recipe-adaptation-proposals.md
// for the doctor to approve per recipe. Never touches a pack.
//
// Doctor's decision: canned beans and broth stay exactly as the recipe has
// them (no switch to no-salt-added or unsalted products). Sodium comes down
// by cutting added salt, soy sauce/tamari and bouillon, with more vegetables,
// herbs, spices or lemon for flavour. assertProductsUnchanged() enforces it.
//
// Usage: node scripts/build_recipe_adaptation_proposals.mjs [--out-dir <dir>]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyzeRecipe, LABELS, HEALTH, r1 } from './lib/recipeLabels.mjs'
import { estimateRecipe, FIELDS, PACK_KEY, round } from './lib/recipeNutritionEstimate.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outArg = process.argv.indexOf('--out-dir')
const OUT_DIR = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : path.join(ROOT, 'scripts/data')
const PACK_FILES = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json']
const DICT = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/ingredientDictionary.json'), 'utf8'))
const DICT_BY_ID = new Map(DICT.entries.map(e => [e.id, e]))
const TARGET = ['diabetes-friendly', 'heart-healthy', 'blood-pressure-friendly']
const LANGS = ['en', 'no', 'sv']
// Products the doctor keeps as they are: no row of these may be edited,
// replaced, removed or added by an adaptation.
const KEEP_AS_IS = new Set(['black-beans-canned', 'chickpeas-canned', 'kidney-beans-canned', 'white-beans-canned', 'vegetable-broth'])

// ── wording reused across recipes (en/no/sv) ───────────────────────────────
// The en notes are what the estimate reads ("reduced-sodium"), so they stay
// in those words.
const N = {
  reducedSoy: { en: 'reduced-sodium', no: 'natriumredusert', sv: 'natriumreducerad' },
  unsweetenedSoy: { en: 'unsweetened, no added sugar', no: 'usøtet, uten tilsatt sukker', sv: 'osötad, utan tillsatt socker' },
}

// ── the adaptations ────────────────────────────────────────────────────────
// rows: { op: 'remove' | 'edit' | 'replace' | 'add', ingredient, nth?, ... }
//   edit:    quantity/unit/note (note per language; null removes it)
//   replace: with { ingredient, quantity, unit, note }
//   add:     row { ingredient, quantity, unit, note }, after (ingredient id)
// steps: { index, en, no, sv } replaces that step's text in each language.
// servings: { to, portion: { en, no, sv } } when the stored portion is not
// a realistic one (the per-serving values are then for the new portion).
const ADAPTATIONS = [
  {
    id: 'black-bean-stew',
    summary: 'Water sauté instead of olive oil; bouillon left out (the canned beans carry the salt), 400 g zucchini added so the bowl is bigger and less salty per 100 g; lime 1 → 2 tbsp.',
    rows: [
      { op: 'remove', ingredient: 'olive-oil' },
      { op: 'add', after: 'carrots', row: { ingredient: 'zucchini', quantity: 400, unit: 'g', note: { en: 'diced', no: 'i terninger', sv: 'tärnad' } } },
      { op: 'remove', ingredient: 'vegetable-bouillon' },
      { op: 'edit', ingredient: 'lime-juice', quantity: 2 },
    ],
    steps: [
      {
        index: 0,
        en: 'Heat 3–4 tbsp water in a large pot over medium heat. Add the chopped onion and cook for about 3–5 minutes until softened, adding a splash more water if it sticks. Add the garlic, bell pepper, carrot and zucchini, and cook for another 5–7 minutes until the vegetables are tender.',
        no: 'Varm 3–4 ss vann i en stor gryte på middels varme. Tilsett hakket løk og surr i ca. 3–5 minutter til den er myk, med en skvett vann til om den setter seg fast. Tilsett hvitløk, paprika, gulrot og squash, og surr i 5–7 minutter til grønnsakene er myke.',
        sv: 'Värm 3–4 msk vatten i en stor gryta på medelvärme. Tillsätt hackad lök och fräs i cirka 3–5 minuter tills den är mjuk, med en skvätt vatten till om den fastnar. Tillsätt vitlök, paprika, morot och zucchini, och fräs i 5–7 minuter tills grönsakerna är mjuka.',
      },
      {
        index: 3,
        en: 'Taste the stew and adjust with cumin, smoked paprika or chilli as needed (no added salt needed: the beans are salted).',
        no: 'Smak til gryten og juster med spisskummen, røkt paprika eller chili etter behov (ikke behov for ekstra salt: bønnene er saltet).',
        sv: 'Smaka av grytan och justera med spiskummin, rökt paprika eller chili efter behov (inget extra salt behövs: bönorna är saltade).',
      },
    ],
  },
  {
    id: 'dal-stew',
    summary: 'Whole spices dry-toasted and onions water-sautéed instead of 4 tbsp olive oil; salt 1 tsp → ¼ tsp (lemon carries the flavour).',
    rows: [
      { op: 'remove', ingredient: 'olive-oil' },
      { op: 'edit', ingredient: 'salt', quantity: 0.25 },
    ],
    steps: [
      {
        index: 3,
        en: 'In a separate dry pot, toast the mustard seeds, bay leaves and fenugreek seeds over medium heat, shaking the pot.',
        no: 'Rist sennepsfrø, laurbærblad og bukkehornsfrø i en annen, tørr kjele på middels varme, og rist kjelen underveis.',
        sv: 'Rosta senapsfrön, lagerblad och bockhornsklöverfrön i en annan, torr kastrull på medelvärme, och skaka kastrullen under tiden.',
      },
    ],
  },
  {
    id: 'kidney-bean-stew',
    summary: 'Honey left out; salt (½ tbsp) left out and bouillon 2 tbsp → 1 tsp (the canned beans carry the salt); 2 tbsp lemon juice stirred in at the end for brightness.',
    rows: [
      { op: 'edit', ingredient: 'vegetable-bouillon', quantity: 1, unit: 'tsp' },
      { op: 'remove', ingredient: 'honey' },
      { op: 'remove', ingredient: 'salt' },
      { op: 'add', after: 'nutritional-yeast', row: { ingredient: 'lemon-juice', quantity: 2, unit: 'tbsp', note: null } },
    ],
    steps: [
      {
        index: 3,
        en: 'With a hand blender, blend the stew a bit until it is creamy, some beans need to still be whole. Stir in the lemon juice and taste (no added salt needed: the beans are salted).',
        no: 'Mos gryten litt med en stavmikser til den er kremet – noen av bønnene bør fremdeles være hele. Rør inn sitronsaften og smak til (ikke behov for ekstra salt: bønnene er saltet).',
        sv: 'Mosa grytan lite med en stavmixer tills den är krämig – några av bönorna bör fortfarande vara hela. Rör i citronsaften och smaka av (inget extra salt behövs: bönorna är saltade).',
      },
    ],
  },
  {
    id: 'lentil-lap-stew',
    summary: 'Lentils cooked without salt; bouillon 2 tbsp → 1 tbsp (same water); 2 tbsp lemon juice stirred in with the parsley.',
    rows: [
      { op: 'remove', ingredient: 'salt' },
      { op: 'edit', ingredient: 'vegetable-bouillon', quantity: 1 },
      { op: 'add', after: 'parsley', row: { ingredient: 'lemon-juice', quantity: 2, unit: 'tbsp', note: null } },
    ],
    steps: [
      {
        index: 0,
        en: 'Place the lentils, water and bay leaves in a pot (no salt) and boil for 25–30 min. Afterwards, drain the liquid (don’t worry if they are not done, they will cook a little longer later).',
        no: 'Ha linser, vann og laurbærblad i en kjele (uten salt) og kok i 25–30 minutter. Hell av væsken (ikke bekymre deg hvis de ikke er helt ferdige – de får lengre koketid senere).',
        sv: 'Lägg linser, vatten och lagerblad i en kastrull (utan salt) och koka i 25–30 minuter. Häll av vätskan (oroa dig inte om de inte är helt färdiga – de får längre koktid senare).',
      },
      {
        index: 6,
        en: 'Add the parsley and lemon juice, taste (no added salt needed), and serve.',
        no: 'Tilsett persille og sitronsaft, smak til (ikke behov for ekstra salt), og server.',
        sv: 'Tillsätt persilja och citronsaft, smaka av (inget extra salt behövs), och servera.',
      },
    ],
  },
  {
    id: 'creamy-red-lentil-stew',
    summary: 'Potatoes → cauliflower (fewer starchy carbs, more vegetables); salt (1½ tsp) left out, the broth stays as it is; 6 bowls instead of 4 (the stored 733 g, 535 kcal bowl is closer to two portions).',
    servings: { to: 6, portion: { en: '1 bowl (~490 g)', no: '1 bolle (~490 g)', sv: '1 skål (~490 g)' } },
    rows: [
      { op: 'replace', ingredient: 'potatoes', with: { ingredient: 'cauliflower', quantity: 300, unit: 'g', note: { en: 'small florets', no: 'små buketter', sv: 'små buketter' } } },
      { op: 'remove', ingredient: 'salt' },
    ],
    steps: [
      {
        index: 1,
        en: 'Add cumin, smoked paprika, turmeric, cinnamon and coriander, stirring 30 seconds until fragrant.',
        no: 'Tilsett spisskummen, røkt paprikapulver, gurkemeie, kanel og koriander, og rør i 30 sekunder til det dufter.',
        sv: 'Tillsätt spiskummin, rökt paprikapulver, gurkmeja, kanel och koriander, och rör i 30 sekunder tills det doftar.',
      },
      {
        index: 2,
        en: 'Stir in lentils, cauliflower, crushed tomatoes, broth and date paste. Bring to the boil.',
        no: 'Rør inn linser, blomkål, knuste tomater, kraft og dadelpasta. Kok opp.',
        sv: 'Rör i linser, blomkål, krossade tomater, buljong och dadelpasta. Koka upp.',
      },
      {
        index: 7,
        en: 'Taste and adjust lemon and spices as needed (no added salt needed: the broth is salted).',
        no: 'Smak til med sitron og krydder etter behov (ikke behov for ekstra salt: kraften er saltet).',
        sv: 'Smaka av med citron och kryddor efter behov (inget extra salt behövs: buljongen är saltad).',
      },
    ],
  },
  {
    id: 'red-lentil-soup',
    summary: 'Coconut milk → unsweetened soy drink; pineapple juice left out (2 dl more water and 2 tbsp lemon juice instead); salt left out and bouillon 3 tbsp → 2 tsp.',
    rows: [
      { op: 'replace', ingredient: 'coconut-milk', with: { ingredient: 'soy-milk', quantity: 3.5, unit: 'dl', note: N.unsweetenedSoy } },
      { op: 'replace', ingredient: 'pineapple-juice', with: { ingredient: 'lemon-juice', quantity: 2, unit: 'tbsp', note: null } },
      { op: 'edit', ingredient: 'water', quantity: 8 },
      { op: 'remove', ingredient: 'salt' },
      { op: 'edit', ingredient: 'vegetable-bouillon', quantity: 2, unit: 'tsp' },
    ],
    steps: [
      {
        index: 2,
        en: 'Add the lentils, tomatoes, water, soy drink and spring onions and cook until the lentils are soft. Stir in the lemon juice at the end (no added salt needed).',
        no: 'Tilsett linser, tomater, vann, soyadrikk og vårløk, og kok til linsene er myke. Rør inn sitronsaften til slutt (ikke behov for ekstra salt).',
        sv: 'Tillsätt linser, tomater, vatten, sojadryck och salladslök, och koka tills linserna är mjuka. Rör i citronsaften på slutet (inget extra salt behövs).',
      },
    ],
  },
  {
    id: 'fr-23',
    summary: 'Salt and herb salt left out, bouillon 2 tsp → 1 tsp (nutritional yeast, marjoram and parsley season it).',
    rows: [
      { op: 'remove', ingredient: 'salt' },
      { op: 'remove', ingredient: 'herb-salt' },
      { op: 'edit', ingredient: 'vegetable-bouillon', quantity: 1 },
    ],
    steps: [
      {
        index: 0,
        en: 'Bring the water to the boil in a kettle to speed things up, and pour it into a pot on the hot stove. Once the water boils, add the buckwheat. Let it boil again and cover with a lid wrapped in a clean kitchen towel. Turn the stove to the lowest heat and let it steam for 20 minutes.',
        no: 'Kok opp vann i en vannkoker for å spare tid, og ha vannet i en gryte på varm plate. Når vannet koker, tilsetter du bokhveten. La det koke opp igjen og dekk til med et lokk som er dekket av et rent kjøkkenhåndkle. Skru platen på laveste varme og la det dampe i 20 minutter.',
        sv: 'Koka upp vatten i en vattenkokare för att spara tid, och häll vattnet i en gryta på het platta. När vattnet kokar, tillsätter du bovetet. Låt det koka upp igen och täck över med ett lock som är täckt av en ren kökshandduk. Sänk plattan till lägsta värme och låt det ånga i 20 minuter.',
      },
    ],
  },
  {
    id: 'oat-burger',
    summary: 'Soy sauce 1.25 dl → 0.4 dl (the usual kind); bouillon left out; 2 tsp smoked paprika added and garlic powder 2 → 3 tsp for flavour.',
    rows: [
      { op: 'edit', ingredient: 'soy-sauce', quantity: 0.4 },
      { op: 'edit', ingredient: 'garlic-powder', quantity: 3 },
      { op: 'add', after: 'garlic-powder', row: { ingredient: 'smoked-paprika', quantity: 2, unit: 'tsp', note: null } },
      { op: 'remove', ingredient: 'vegetable-bouillon' },
    ],
    steps: [],
  },
  {
    id: 'red-beet-burger',
    summary: 'Olive oil, salt and bouillon left out (onion water-sautéed); soy sauce 2 → 1 tbsp; the chickpeas stay as they are; 10 servings of 2 burgers instead of 5 of ~4–5 (624 kcal and 83 g carbs a serving).',
    servings: { to: 10, portion: { en: '2 burgers (~230 g raw mix)', no: '2 burgere (~230 g rå farse)', sv: '2 burgare (~230 g rå smet)' } },
    rows: [
      { op: 'remove', ingredient: 'salt' },
      { op: 'remove', ingredient: 'olive-oil' },
      { op: 'edit', ingredient: 'soy-sauce', quantity: 1 },
      { op: 'remove', ingredient: 'vegetable-bouillon' },
    ],
    steps: [
      {
        index: 0,
        en: 'Blend the chickpeas and cayenne in the food processor.',
        no: 'Kjør kikerter og kajennepepper i foodprosessoren.',
        sv: 'Mixa kikärtor och cayennepeppar i matberedaren.',
      },
      {
        index: 1,
        en: 'Sauté the onion in a splash of water until soft.',
        no: 'Surr løken i en skvett vann til den er myk.',
        sv: 'Fräs löken i en skvätt vatten tills den är mjuk.',
      },
    ],
  },
  {
    id: 'orn-20',
    summary: 'Olive oil left out (onion water-sautéed, patties baked on parchment without brushing); salt and tamari left out (the canned beans carry the salt); smoked paprika 1½ → 2 tsp and 1 tbsp lemon juice for flavour.',
    rows: [
      { op: 'remove', ingredient: 'tamari' },
      { op: 'edit', ingredient: 'smoked-paprika', quantity: 2 },
      { op: 'remove', ingredient: 'salt' },
      { op: 'remove', ingredient: 'olive-oil' },
      { op: 'add', after: 'parsley', row: { ingredient: 'lemon-juice', quantity: 1, unit: 'tbsp', note: null } },
    ],
    steps: [
      {
        index: 3,
        en: 'In 2–3 tbsp water, cook the onion over medium heat until soft and lightly golden, adding a splash more as it dries, then add the garlic for the final minute only.',
        no: 'Surr løken i 2–3 ss vann på middels varme til den er myk og lett gyllen, med en skvett vann til når det tørker inn, og tilsett hvitløken kun det siste minuttet.',
        sv: 'Fräs löken i 2–3 msk vatten på medelvärme tills den är mjuk och lätt gyllene, med en skvätt vatten till när det torkar in, och tillsätt vitlöken bara den sista minuten.',
      },
      {
        index: 6,
        en: 'Combine the toasted walnuts, mashed beans, onion-carrot-garlic, flax egg, smoked paprika, thyme, parsley and lemon juice. Mix well and rest 10 minutes so the flax hydrates and the mix firms up (no added salt needed: the beans are salted).',
        no: 'Bland de ristede valnøttene, de mosede bønnene, løk-gulrot-hvitløk, linfrø-egget, røkt paprika, timian, persille og sitronsaft. Bland godt og la hvile i 10 minutter så linfrøet trekker til seg fukt og massen stivner (ikke behov for ekstra salt: bønnene er saltet).',
        sv: 'Blanda de rostade valnötterna, de mosade bönorna, lök-morot-vitlök, linfrö-ägget, rökt paprika, timjan, persilja och citronsaft. Blanda väl och låt vila 10 minuter så linfröet suger åt sig fukt och smeten stelnar (inget extra salt behövs: bönorna är saltade).',
      },
      {
        index: 7,
        en: 'Form 8 patties about 1.5 cm thick on the lined tray. No oil needed: the toasted walnuts brown them in the hot oven.',
        no: 'Form 8 biffer ca. 1,5 cm tykke på brettet med bakepapir. Ingen olje trengs: de ristede valnøttene gir dem farge i den varme ovnen.',
        sv: 'Forma 8 biffar ca 1,5 cm tjocka på plåten med bakplåtspapper. Ingen olja behövs: de rostade valnötterna ger dem färg i den heta ugnen.',
      },
    ],
  },
  {
    id: 'sweet-yellow-pea-soup',
    summary: 'Salt (2 tsp) left out and bouillon 4½ → 2 tbsp; 3 tbsp lemon juice stirred in at the end (garlic and onion powder carry the rest of the flavour).',
    rows: [
      { op: 'remove', ingredient: 'salt' },
      { op: 'edit', ingredient: 'vegetable-bouillon', quantity: 2 },
      { op: 'add', after: 'parsley', row: { ingredient: 'lemon-juice', quantity: 3, unit: 'tbsp', note: null } },
    ],
    steps: [
      {
        index: 2,
        en: 'Add the carrot and continue to sauté until the carrots are tender.',
        no: 'Tilsett gulrot, og fortsett å surre til gulrøttene er møre.',
        sv: 'Tillsätt morot, och fortsätt att fräsa tills morötterna är mjuka.',
      },
      {
        index: 5,
        en: 'Stir in the lemon juice, taste (no added salt needed) and garnish with chopped parsley on top.',
        no: 'Rør inn sitronsaften, smak til (ikke behov for ekstra salt) og pynt med hakket persille på toppen.',
        sv: 'Rör i citronsaften, smaka av (inget extra salt behövs) och garnera med hackad persilja på ytan.',
      },
    ],
  },
  {
    id: 'stuffed-paprika-with-tofu',
    summary: 'Oil left out (water sauté); soy sauce 4 → 2 tbsp reduced-sodium; salt 2 tsp → ½ tsp.',
    rows: [
      { op: 'remove', ingredient: 'olive-oil' },
      { op: 'edit', ingredient: 'soy-sauce', quantity: 2, note: N.reducedSoy },
      { op: 'edit', ingredient: 'salt', quantity: 0.5 },
    ],
    steps: [
      {
        index: 0,
        en: 'Sauté onion, garlic, leek (sliced in rings) and carrots (grated) with {{4 tbsp}} water and the soy sauce. Cook until soft.',
        no: 'Surr løk, hvitløk, purre (skåret i ringer) og gulrøtter (revet) med {{4 ss}} vann og soyasausen. Stek til det er mykt.',
        sv: 'Fräs lök, vitlök, purjolök (skuren i ringar) och morötter (rivna) med {{4 msk}} vatten och sojasåsen. Stek tills det är mjukt.',
      },
      {
        index: 1,
        en: 'Don’t add more water for larger amounts.',
        no: 'Ikke tilsett mer vann ved større mengder.',
        sv: 'Tillsätt inte mer vatten vid större mängder.',
      },
    ],
  },
  {
    id: 'tofu-form',
    summary: 'Olive oil left out of the marinade; soy sauce 1 dl → 0.5 dl reduced-sodium.',
    rows: [
      { op: 'edit', ingredient: 'soy-sauce', quantity: 0.5, note: N.reducedSoy },
      { op: 'remove', ingredient: 'olive-oil' },
    ],
    steps: [
      {
        index: 0,
        en: 'Cut the tofu in thin slices (approx. 5 mm) and marinate in a container with the {{0,5 L}} soy milk, soy sauce and garlic powder for at least 1 hour.',
        no: 'Skjær tofuen i tynne skiver (ca. 5 mm) og marinér i en beholder med 0,5 liter soyamelk, soyasaus og hvitløkspulver i minst 1 time.',
        sv: 'Skär tofun i tunna skivor (cirka 5 mm) och marinera i en behållare med 0,5 liter sojamjölk, sojasås och vitlökspulver i minst 1 timme.',
      },
    ],
  },
  {
    id: 'orn-30',
    summary: 'Dried beans 300 → 240 g and 150 g kale stirred in at the end: carbohydrate under 60 g a bowl, more greens.',
    rows: [
      { op: 'edit', ingredient: 'borlotti-beans-dry', quantity: 240 },
      { op: 'add', after: 'lemon-juice', row: { ingredient: 'kale', quantity: 150, unit: 'g', note: { en: 'stems removed, chopped', no: 'uten stilker, hakket', sv: 'utan stjälkar, hackad' } } },
    ],
    steps: [
      {
        match: /lemon juice and parsley/i,
        en: 'Remove the bay leaves. Stir in the kale and simmer 3–4 minutes until just tender, then stir in the lemon juice and parsley. Taste and adjust seasoning if needed.',
        no: 'Fjern laurbærbladene. Rør inn grønnkålen og la det småkoke i 3–4 minutter til den så vidt er mør, og rør så inn sitronsaft og persille. Smak til og juster kryddersmaken om nødvendig.',
        sv: 'Ta bort lagerbladen. Rör i grönkålen och låt sjuda 3–4 minuter tills den precis är mjuk, och rör sedan i citronsaften och persiljan. Smaka av och justera kryddningen vid behov.',
      },
    ],
  },
]
// The Instant Pot version has the same ingredients: same change.
ADAPTATIONS.push({ ...ADAPTATIONS.find(a => a.id === 'orn-30'), id: 'orn-31', summary: 'Same change as the stovetop version: dried beans 300 → 240 g and 150 g kale stirred in at the end.' })

// ── applying one ──────────────────────────────────────────────────────────
const UNIT_TEXT = { tsp: { no: 'ts', sv: 'tsk' }, tbsp: { no: 'ss', sv: 'msk' }, clove: { no: 'fedd', sv: 'klyfta' } }
const unitIn = (lang, unit) => (lang === 'en' ? unit : UNIT_TEXT[unit]?.[lang] ?? unit)
const listOf = (r, lang) => (lang === 'en' ? r.ingredients : r.translations[lang].ingredients)
const stepTextOf = s => (typeof s === 'string' ? s : s?.text || '')
const setStep = (s, text) => (typeof s === 'string' ? text : { ...s, text })

function rowFor(lang, { ingredient, quantity, unit, note }) {
  const e = DICT_BY_ID.get(ingredient)
  if (!e) throw new Error(`not in the dictionary: ${ingredient}`)
  const row = { quantity, unit: unitIn(lang, unit), ingredient, name: e.names[lang] }
  if (note?.[lang]) row.note = note[lang]
  return row
}

function findIndex(r, id, nth = 0) {
  const hits = r.ingredients.map((x, i) => (x.ingredient === id ? i : -1)).filter(i => i >= 0)
  if (hits[nth] == null) throw new Error(`${r.id}: no ${id} row #${nth}`)
  return hits[nth]
}

// The doctor's rule: canned beans and broth rows come out exactly as they
// went in, in every language (same rows, quantities, units and notes).
function assertProductsUnchanged(original, adapted) {
  for (const lang of LANGS) {
    const pick = r => JSON.stringify(listOf(r, lang).filter(x => KEEP_AS_IS.has(x.ingredient)))
    if (pick(original) !== pick(adapted)) {
      throw new Error(`${original.id}: canned beans and broth must stay as they are (no no-salt-added/unsalted switch); cut salt, soy sauce or bouillon instead`)
    }
  }
}

function adapt(original, def) {
  const r = structuredClone(original)
  const changes = []
  // Indexes are looked up before any row moves, then applied from the end.
  // On the same index the row there is changed first, then the new row is
  // inserted before it (otherwise a remove would take out the added row).
  const ops = def.rows.map(op => ({ ...op, index: op.op === 'add' ? findIndex(r, op.after) + 1 : findIndex(r, op.ingredient, op.nth || 0) }))
  for (const op of [...ops].sort((a, b) => b.index - a.index || (a.op === 'add') - (b.op === 'add'))) {
    const before = op.op === 'add' ? null : structuredClone(LANGS.map(l => listOf(r, l)[op.index]))
    for (const lang of LANGS) {
      const list = listOf(r, lang)
      if (op.op === 'remove') list.splice(op.index, 1)
      else if (op.op === 'add') list.splice(op.index, 0, rowFor(lang, op.row))
      else if (op.op === 'replace') list[op.index] = rowFor(lang, op.with)
      else if (op.op === 'edit') {
        const row = list[op.index]
        if (op.quantity !== undefined) row.quantity = op.quantity
        if (op.unit !== undefined) row.unit = unitIn(lang, op.unit)
        if (op.note !== undefined) { if (op.note?.[lang]) row.note = op.note[lang]; else delete row.note }
      }
    }
    const after = op.op === 'remove' ? null : LANGS.map(l => listOf(r, l)[op.op === 'add' ? op.index : op.index])
    changes.unshift({ op: op.op, before, after })
  }
  const stepChanges = []
  for (const s of def.steps || []) {
    const index = s.index ?? r.steps.findIndex(x => s.match.test(stepTextOf(x)))
    if (index < 0 || !r.steps[index]) throw new Error(`${r.id}: no step ${s.index ?? s.match}`)
    const before = Object.fromEntries(LANGS.map(l => [l, stepTextOf((l === 'en' ? r.steps : r.translations[l].steps)[index])]))
    r.steps[index] = setStep(r.steps[index], s.en)
    for (const l of ['no', 'sv']) r.translations[l].steps[index] = setStep(r.translations[l].steps[index], s[l])
    stepChanges.push({ index, before, after: { en: s.en, no: s.no, sv: s.sv } })
  }
  assertProductsUnchanged(original, r)

  // Per-serving nutrition, recalculated from the adapted rows.
  const servings = def.servings?.to ?? original.servings
  const est = estimateRecipe(r)
  if (est.problems.length) throw new Error(`${r.id}: ${est.problems.join('; ')}`)
  const per = {}
  for (const f of FIELDS) per[PACK_KEY[f]] = round(est.totals[f] / servings, f)
  // The eaten portion keeps the same cooked-to-raw ratio as the stored one.
  const rawBefore = estimateRecipe(original).weight / original.servings
  const servingWeightGrams = Math.round(original.servingWeightGrams * (est.weight / servings) / rawBefore)
  r.servings = servings
  r.servingWeightGrams = servingWeightGrams
  if (def.servings?.portion) {
    r.portion = def.servings.portion.en
    for (const l of ['no', 'sv']) r.translations[l].portion = def.servings.portion[l]
  }
  r.nutrition = { ...(r.nutrition || {}), perServing: { ...(r.nutrition?.perServing || {}), ...per } }
  r.kcal = Math.round(per.calories)
  return { recipe: r, changes, stepChanges, perServing: per, servingWeightGrams }
}

// ── run ─────────────────────────────────────────────────────────────────────
const packs = PACK_FILES.map(f => JSON.parse(fs.readFileSync(path.join(ROOT, 'recipe-packs-template/packs', f), 'utf8')))
const byId = new Map(packs.flatMap(p => p.recipes.map(r => [r.id, { r, pack: p }])))
const recipesById = new Map([...byId].map(([id, x]) => [id, x.r]))
const core = n => Object.fromEntries(FIELDS.map(f => [PACK_KEY[f], n?.[PACK_KEY[f]] ?? null]))

const results = []
for (const def of ADAPTATIONS) {
  const { r: original, pack } = byId.get(def.id) || {}
  if (!original) throw new Error(`no recipe ${def.id}`)
  const before = analyzeRecipe(original, recipesById, { storedMealTypes: true })
  const a = adapt(original, def)
  const after = analyzeRecipe(a.recipe, recipesById, { storedMealTypes: true })
  const now = LABELS.filter(l => (original.tags || []).includes(l))
  results.push({
    id: def.id,
    pack: pack.id,
    packVersion: pack.version,
    title: { en: original.title, no: original.translations?.no?.title, sv: original.translations?.sv?.title },
    summary: def.summary,
    current: {
      labels: now,
      failing: Object.fromEntries(TARGET.filter(l => !before.labels[l].pass).map(l => [l, before.labels[l].why])),
      perServing: core(original.nutrition?.perServing),
      perServingFromIngredients: before.nut.estimate,
      servings: original.servings,
      servingWeightGrams: original.servingWeightGrams,
    },
    proposed: {
      servings: a.recipe.servings,
      servingWeightGrams: a.servingWeightGrams,
      portion: def.servings?.portion || null,
      perServing: a.perServing,
      labels: after.proposed,
      reasons: Object.fromEntries(TARGET.map(l => [l, after.labels[l].why])),
      ingredientChanges: a.changes,
      stepChanges: a.stepChanges,
      ingredients: { en: a.recipe.ingredients, no: a.recipe.translations.no.ingredients, sv: a.recipe.translations.sv.ingredients },
    },
    gained: after.proposed.filter(l => !now.includes(l)),
    lost: now.filter(l => !after.proposed.includes(l)),
    stillFailing: Object.fromEntries(TARGET.filter(l => !after.labels[l].pass).map(l => [l, after.labels[l].why])),
  })
}

const json = {
  generated: new Date().toISOString().slice(0, 10),
  generator: 'scripts/build_recipe_adaptation_proposals.mjs',
  status: 'PROPOSAL - nothing applied. Approve per recipe; an approved recipe is applied with its own add/fix script, a pack version bump and npm run label-recipes -- --recipe <id> --write.',
  criteria: 'scripts/lib/recipeLabels.mjs (CRITERIA), unchanged',
  rule: "Doctor's decision: canned beans and broth stay exactly as they are (no no-salt-added/unsalted switch). Sodium is reduced by cutting added salt, soy sauce and bouillon, with more vegetables, herbs, spices or lemon for flavour.",
  nutrition: 'Per serving, recalculated from the adapted ingredient rows with scripts/data/food-composition-core.json. "Now" shows the stored panel and the same calculation on the current rows, so the change is like for like.',
  packVersions: Object.fromEntries(packs.map(p => [p.id, p.version])),
  recipes: results,
}
fs.writeFileSync(path.join(OUT_DIR, 'recipe-adaptation-proposals.json'), JSON.stringify(json, null, 2) + '\n', 'utf8')

// ── markdown ────────────────────────────────────────────────────────────────
const short = { 'weight-loss': 'WL', 'blood-pressure-friendly': 'BP', 'diabetes-friendly': 'DIA', 'heart-healthy': 'HRT', 'gluten-free': 'GF', 'nut-free': 'NUT0', 'soy-free': 'SOY0', 'oil-free': 'OIL0', 'no-added-sugar': 'NAS', 'quick': 'Q', 'batch-friendly': 'BATCH', 'kid-friendly': 'KID' }
const codes = list => (list.length ? list.map(l => short[l]).join(' ') : '—')
const esc = s => String(s ?? '').replace(/\|/g, '\\|')
const rowText = row => (row ? `${row.quantity ?? ''} ${row.unit || ''} ${row.name}${row.note ? ` (${row.note})` : ''}`.replace(/\s+/g, ' ').trim() : '—')
const kc = v => (v == null ? '—' : Math.round(v))
const panelRow = (label, n) => `| ${label} | ${kc(n.calories)} | ${r1(n.protein)} | ${r1(n.totalFat)} | ${r1(n.saturatedFat)} | ${r1(n.totalCarbs)} | ${r1(n.fiber)} | ${r1(n.totalSugars)} | ${r1(n.addedSugar)} | ${kc(n.sodium)} | ${kc(n.potassium)} |`

const L = []
L.push('# Recipe adaptation proposals: hearty mains for diabetes, heart and blood pressure', '')
L.push(`Generated ${json.generated} by \`${json.generator}\` from ${Object.entries(json.packVersions).map(([k, v]) => `${k} ${v}`).join(', ')}. **Proposal only: nothing has been changed in the packs.** Machine-readable copy with the full adapted ingredient lists (en/no/sv): \`recipe-adaptation-proposals.json\`.`, '')
L.push('Labels are judged by the existing criteria (`scripts/lib/recipeLabels.mjs`, the same as the label report and check-recipes), unchanged. Per-serving nutrition after the change is recalculated from the adapted ingredient rows (`scripts/data/food-composition-core.json`); "now" shows both the stored panel and the same calculation on today\'s rows, so the change can be compared like for like. Sodium follows the settled decision: canned beans and broth count as ordinary salted products. **Doctor\'s decision: canned beans and broth stay exactly as they are** (no switch to no-salt-added or unsalted products; the generator refuses one), so sodium comes down by cutting added salt, soy sauce and bouillon, with more vegetables, herbs, spices or lemon for flavour.', '')
L.push('## Summary', '')
L.push('| # | Recipe | Key changes | Health labels now → proposed | Gained | Lost |', '|---|---|---|---|---|---|')
results.forEach((x, i) => {
  const h = list => codes(list.filter(l => HEALTH.includes(l)))
  L.push(`| ${i + 1} | ${esc(x.title.en)} (\`${x.id}\`) | ${esc(x.summary)} | ${h(x.current.labels)} → ${h(x.proposed.labels)} | ${codes(x.gained)} | ${codes(x.lost)} |`)
})
const full = results.filter(x => !Object.keys(x.stillFailing).length).length
L.push('', `${full} of ${results.length} reach all three (diabetes-friendly, heart-healthy, blood-pressure-friendly). Codes: ${Object.entries(short).map(([k, v]) => `${v} = ${k}`).join(', ')}.`, '')
L.push('To approve, tick the box under each recipe (or list the ids). Approved recipes are applied with a one-off script that writes the en/no/sv rows and steps from the JSON, bumps the pack version and runs `npm run label-recipes -- --recipe <id> --write`.', '')

results.forEach((x, i) => {
  L.push(`## ${i + 1}. ${x.title.en} (\`${x.id}\`)`, '')
  L.push(`${x.pack}, ${x.title.no} / ${x.title.sv}. ${x.summary}`, '')
  L.push(`**Fails now:**`, '')
  for (const [l, why] of Object.entries(x.current.failing)) L.push(`- ${l}: ${why}`)
  L.push('', '**Ingredient changes** (en / no / sv):', '')
  L.push('| Change | Now | Proposed (en) | no | sv |', '|---|---|---|---|---|')
  for (const c of x.proposed.ingredientChanges) {
    L.push(`| ${c.op} | ${esc(rowText(c.before?.[0]))} | ${esc(rowText(c.after?.[0]))} | ${esc(rowText(c.after?.[1]))} | ${esc(rowText(c.after?.[2]))} |`)
  }
  if (x.proposed.portion) {
    L.push(`| servings | ${x.current.servings} × ${x.current.servingWeightGrams} g | ${x.proposed.servings} × ${x.proposed.servingWeightGrams} g, "${esc(x.proposed.portion.en)}" | ${esc(x.proposed.portion.no)} | ${esc(x.proposed.portion.sv)} |`)
  }
  if (x.proposed.stepChanges.length) {
    L.push('', '**Method changes:**', '')
    for (const s of x.proposed.stepChanges) {
      L.push(`- Step ${s.index + 1}, now: "${s.before.en}"`)
      L.push(`  - en: ${s.after.en}`, `  - no: ${s.after.no}`, `  - sv: ${s.after.sv}`)
    }
  }
  L.push('', '**Per serving:**', '')
  L.push('| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |', '|---|---|---|---|---|---|---|---|---|---|---|')
  L.push(panelRow('now (stored)', x.current.perServing))
  L.push(panelRow('now (from ingredients)', x.current.perServingFromIngredients))
  L.push(panelRow(`proposed${x.proposed.portion ? ` (${x.proposed.servings} servings)` : ''}`, x.proposed.perServing))
  L.push('', `**Labels:** now ${codes(x.current.labels)} → proposed ${codes(x.proposed.labels)}. Gained: ${codes(x.gained)}. Lost: ${codes(x.lost)}.`, '')
  for (const l of TARGET) L.push(`- ${x.stillFailing[l] ? '✗' : '✓'} ${l}: ${x.proposed.reasons[l]}`)
  L.push('', `- [ ] Approve \`${x.id}\``, '')
})
fs.writeFileSync(path.join(OUT_DIR, 'recipe-adaptation-proposals.md'), L.join('\n') + '\n', 'utf8')

for (const x of results) {
  console.log(`${x.id.padEnd(26)} ${codes(x.current.labels.filter(l => HEALTH.includes(l))).padEnd(12)} → ${codes(x.proposed.labels.filter(l => HEALTH.includes(l))).padEnd(14)} lost: ${codes(x.lost).padEnd(8)} ${Object.entries(x.stillFailing).map(([l, w]) => `${short[l]}: ${w}`).join(' | ')}`)
}

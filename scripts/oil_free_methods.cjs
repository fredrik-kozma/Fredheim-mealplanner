/* Oil-free methods for the Fredheim Kitchen pack (doctor's decision,
 * 2026-10-28).
 *
 * Thirteen recipes used oil in the method that was never in the ingredient
 * list (so never in the nutrition), or fried with no fat named. Their steps
 * now water-sauté instead ("2–3 tbsp water, a splash more as needed"), bake
 * on baking paper, or dry-toast in a non-stick pan, in en/no/sv. Ingredients
 * and nutrition are untouched.
 *
 * Label tags: the method text was the only thing these recipes failed on for
 * the labels below, so they are added here. The list is the difference
 * between scripts/build_recipe_proposals.mjs run before and after the step
 * change (same criteria), checked against the reasons in
 * scripts/data/recipe-completion-proposals.json ("method uses oil" was the
 * only failure).
 *
 * Bumps the pack's minor version so installed copies update, and records the
 * added labels in scripts/data/recipe-completion-proposals.json (+ a note in
 * the .md). Each part is skipped if it has already been done.
 *
 * Usage: node scripts/oil_free_methods.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const FROM_VERSION = '1.61.0'
const dry = process.argv.includes('--dry')

// Shared wording, per language.
const SPLASH = {
  en: s => `adding a splash more as needed so ${s} stick`,
  no: s => `Tilsett en skvett vann til ved behov, så ${s} ikke setter seg fast.`,
  sv: s => `Tillsätt en skvätt vatten till vid behov så att ${s} inte fastnar.`,
}
const onionGarlicSoft = {
  en: `Sauté the onion and garlic in 2–3 tbsp water until soft, ${SPLASH.en("they don't")}.`,
  no: `Surr løk og hvitløk i 2–3 ss vann til de er myke. ${SPLASH.no('det')}`,
  sv: `Fräs lök och vitlök i 2–3 msk vatten tills de är mjuka. ${SPLASH.sv('det')}`,
}

// id -> step index -> { expect: what the old en step must match, en, no, sv }
const CHANGES = {
  'cauliflower-soup': {
    1: {
      expect: /olive oil/,
      en: `Sauté the onions in 2–3 tbsp water until almost clear (not browned), ${SPLASH.en("they don't")}.`,
      no: `Surr løken i 2–3 ss vann til den er nesten klar (ikke brunet). ${SPLASH.no('den')}`,
      sv: `Fräs löken i 2–3 msk vatten tills den är nästan klar (inte brynt). ${SPLASH.sv('den')}`,
    },
  },
  'kidney-bean-stew': { 0: { expect: /olive oil/, ...onionGarlicSoft } },
  'fr-94': { 0: { expect: /olive oil/, ...onionGarlicSoft } },
  'fr-101': {
    1: {
      expect: /olive oil/,
      en: `Sauté the onion in 2–3 tbsp water until translucent, ${SPLASH.en("it doesn't")}, then add the garlic and sauté 1 minute more.`,
      no: `Surr løken i 2–3 ss vann til den er blank. ${SPLASH.no('den')} Tilsett deretter hvitløk og surr i ett minutt til.`,
      sv: `Fräs löken i 2–3 msk vatten tills den är blank. ${SPLASH.sv('den')} Tillsätt därefter vitlök och fräs i en minut till.`,
    },
    6: {
      expect: /baking tray and steam/,
      en: 'Place the balls on a baking tray lined with baking paper and steam in the oven for 25 minutes or until the balls start to brown.',
      no: 'Legg kulene på et stekebrett med bakepapir og damp dem i ovnen i 25 minutter, eller til kulene begynner å bli brune.',
      sv: 'Lägg bollarna på en plåt med bakplåtspapper och ånga dem i ugnen i 25 minuter, eller tills bollarna börjar bli bruna.',
    },
  },
  'potato-and-spinach-soup': { 1: { expect: /olive oil/, ...onionGarlicSoft } },
  'red-lentil-soup': { 0: { expect: /olive oil/, ...onionGarlicSoft } },
  'fr-172': {
    0: {
      expect: /Bake afterwards for 20 minutes/,
      en: 'Dice tofu and marinade 1 - 2 hours with some soy sauce, onion and garlic powder. Bake afterwards on a baking tray lined with baking paper for 20 minutes at 170 °C.',
      no: 'Skjær tofuen i terninger og marinér i 1–2 timer i litt soyasaus, løkpulver og hvitløkspulver. Stek deretter i ovnen på et stekebrett med bakepapir i 20 minutter på 170 °C.',
      sv: 'Skär tofun i tärningar och marinera i 1–2 timmar i lite sojasås, lökpulver och vitlökspulver. Rosta därefter i ugnen på en plåt med bakplåtspapper i 20 minuter i 170 °C.',
    },
    1: {
      expect: /olive oil or water/,
      en: `Sauté the onions and leek in 2–3 tbsp water until translucent, ${SPLASH.en("they don't")}.`,
      no: `Surr løk og purre i 2–3 ss vann til de er blanke. ${SPLASH.no('det')}`,
      sv: `Fräs lök och purjolök i 2–3 msk vatten tills de är blanka. ${SPLASH.sv('det')}`,
    },
  },
  'fr-184': {
    0: {
      expect: /olive oil/,
      en: `Start by sautéing the grated beetroot in a large pot in 2–3 tbsp water for 10 minutes, ${SPLASH.en("it doesn't")}.`,
      no: `Start med å surre revet rødbete i en stor kjele i 2–3 ss vann i 10 minutter. ${SPLASH.no('den')}`,
      sv: `Börja med att fräsa riven rödbeta i en stor kastrull i 2–3 msk vatten i 10 minuter. ${SPLASH.sv('den')}`,
    },
    3: {
      expect: /1 tsp of oil/,
      en: `While the broth is cooking, prepare the mirepoix: sauté the onion and celery stick in a stainless steel pan in 2–3 tbsp water for 7–8 minutes until soft and lightly golden, ${SPLASH.en("they don't")}.`,
      no: `Mens kraften koker, lager du mirepoixen: surr løk og stangselleri i en stålpanne i 2–3 ss vann i 7–8 minutter til de er myke og lett gylne. ${SPLASH.no('det')}`,
      sv: `Medan kraften kokar gör du mirepoixen: fräs lök och stjälkselleri i en stålpanna i 2–3 msk vatten i 7–8 minuter tills de är mjuka och lätt gyllene. ${SPLASH.sv('det')}`,
    },
    4: {
      expect: /stir fry/,
      en: 'Add the sukrin, stir for 30 seconds and add to the broth.',
      no: 'Tilsett sukrin, rør i 30 sekunder og ha det over i kraften.',
      sv: 'Tillsätt sukrin, rör i 30 sekunder och häll över det i kraften.',
    },
  },
  'bean-pate': { 0: { expect: /little oil if desired/, ...onionGarlicSoft } },
  'fr-99': {
    0: {
      expect: /in some oil/,
      en: `Dice the onions and sauté them in 2–3 tbsp water until soft, ${SPLASH.en("they don't")}.`,
      no: `Hakk løken og surr den i 2–3 ss vann til den er myk. ${SPLASH.no('den')}`,
      sv: `Hacka löken och fräs den i 2–3 msk vatten tills den är mjuk. ${SPLASH.sv('den')}`,
    },
  },
  'mediterranean-soup': {
    0: {
      expect: /Dizzle with oil/,
      en: 'Wash the eggplant and cut it into medium dice. Spread it on a baking tray lined with baking paper and sprinkle with a little salt. Roast for 10 minutes at 170 °C in a preheated oven.',
      no: 'Vask auberginen og skjær den i mellomstore terninger. Fordel terningene på et stekebrett med bakepapir og dryss over litt salt. Stek i 10 minutter på 170 °C i forvarmet ovn.',
      sv: 'Tvätta auberginen och skär den i medelstora tärningar. Fördela tärningarna på en plåt med bakplåtspapper och strö över lite salt. Rosta i 10 minuter i 170 °C i förvärmd ugn.',
    },
    1: {
      expect: /olive oil/,
      en: `Sauté the onion, garlic, leek, bell pepper and zucchini in 2–3 tbsp water with a lid on, ${SPLASH.en("they don't")}.`,
      no: `Surr løk, hvitløk, purre, paprika og squash i 2–3 ss vann under lokk. ${SPLASH.no('det')}`,
      sv: `Fräs lök, vitlök, purjolök, paprika och squash i 2–3 msk vatten under lock. ${SPLASH.sv('det')}`,
    },
  },
  'fr-136': {
    1: {
      expect: /in oil/,
      en: 'Soak the dry-packed sun-dried tomatoes for 5 minutes, then drain.',
      no: 'Bløtlegg de tørre soltørkede tomatene i 5 minutter og sil av.',
      sv: 'Blötlägg de torra soltorkade tomaterna i 5 minuter och häll av vattnet.',
    },
  },
  'kale-avocado': {
    0: {
      expect: /fry pan/,
      en: 'To toast the seeds, heat a dry non-stick pan over medium–high heat. Add the sunflower and sesame seeds.',
      no: 'For å riste frøene: varm en tørr panne med slipp-belegg på middels høy varme. Tilsett solsikke- og sesamfrøene.',
      sv: 'För att rosta fröna: hetta upp en torr non-stick-panna på medelhög värme. Tillsätt solros- och sesamfröna.',
    },
  },
}

// Labels the recipes now pass (see header). Appended in the pack's label order.
const LABEL_ORDER = ['weight-loss', 'blood-pressure-friendly', 'diabetes-friendly', 'heart-healthy', 'gluten-free',
  'nut-free', 'soy-free', 'oil-free', 'no-added-sugar', 'quick', 'batch-friendly', 'kid-friendly']
// Bean Pâté also passes the health labels on a re-run, but they were held back
// for low-confidence nutrition (brand-dependent sun-dried tomatoes and
// bouillon), not for oil, so only oil-free is added. Kale Avocado already had
// every label it qualifies for.
const ADD_LABELS = {
  'cauliflower-soup': ['diabetes-friendly', 'oil-free'],
  'kidney-bean-stew': ['oil-free'],
  'fr-94': ['oil-free'],
  'fr-101': ['oil-free'],
  'potato-and-spinach-soup': ['diabetes-friendly', 'oil-free'],
  'red-lentil-soup': ['oil-free'],
  'fr-172': ['oil-free'],
  'fr-184': ['diabetes-friendly', 'oil-free'],
  'bean-pate': ['oil-free'],
  'fr-99': ['oil-free'],
  'mediterranean-soup': ['diabetes-friendly', 'heart-healthy', 'oil-free'],
  'fr-136': ['heart-healthy', 'oil-free'],
}

// Reasons recorded in the proposals JSON for the labels added here, as the
// builder words them on a re-run after the step change.
const WHY = {
  'oil-free': 'no oil in ingredients or method',
  'cauliflower-soup': { 'diabetes-friendly': 'carbs 21 g, sugars 5.4 g, fibre 3.8 g, no oil' },
  'potato-and-spinach-soup': { 'diabetes-friendly': 'carbs 37 g, sugars 4.5 g, fibre 5.6 g, no oil' },
  'fr-184': { 'diabetes-friendly': 'carbs 25 g, sugars 6.6 g, fibre 5.1 g, no oil' },
  'mediterranean-soup': {
    'diabetes-friendly': 'carbs 37.3 g, sugars 10.1 g, fibre 8 g, no oil',
    'heart-healthy': 'sat. fat 0.3 g, sodium 431 mg, fibre 8 g, no oil',
  },
  'fr-136': { 'heart-healthy': 'sat. fat 0.8 g, sodium 107 mg, fibre 1.8 g, no oil' },
}

// ── pack ──
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const [maj, min] = FROM_VERSION.split('.').map(Number)
const TO_VERSION = `${maj}.${min + 1}.0`
if (pack.version === TO_VERSION) {
  console.log(`pack already at ${TO_VERSION}, steps and tags left as they are`)
} else {
  if (pack.version !== FROM_VERSION) throw new Error(`pack is at ${pack.version}, expected ${FROM_VERSION}`)
  let steps = 0
  for (const [id, byIndex] of Object.entries(CHANGES)) {
    const r = pack.recipes.find(x => x.id === id)
    if (!r) throw new Error(`${id}: not in pack`)
    for (const [i, c] of Object.entries(byIndex)) {
      if (!c.expect.test(r.steps[i])) throw new Error(`${id} step ${i}: unexpected text "${r.steps[i]}"`)
      for (const lang of ['no', 'sv']) {
        if (r.translations[lang].steps.length !== r.steps.length) throw new Error(`${id}: ${lang} step count differs`)
      }
      r.steps[i] = c.en
      r.translations.no.steps[i] = c.no
      r.translations.sv.steps[i] = c.sv
      steps++
    }
  }
  let labels = 0
  for (const [id, add] of Object.entries(ADD_LABELS)) {
    const r = pack.recipes.find(x => x.id === id)
    const have = new Set(r.tags.filter(t => LABEL_ORDER.includes(t)))
    for (const l of add) { if (have.has(l)) throw new Error(`${id}: already has ${l}`); have.add(l); labels++ }
    r.tags = [...r.tags.filter(t => !LABEL_ORDER.includes(t)), ...LABEL_ORDER.filter(l => have.has(l))]
  }
  pack.version = TO_VERSION
  if (!dry) fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`${Object.keys(CHANGES).length} recipes, ${steps} steps rewritten, ${labels} labels added; ${FROM_VERSION} -> ${TO_VERSION}${dry ? ' (dry run)' : ''}`)
}

// ── proposals record ──
// tests/recipeLabels.test.js holds the packs to the labels in the proposals
// JSON, so the added labels are recorded there too (with their reasons), and
// the report gets a note. Not a rebuild: a rebuild now would also pick up
// unrelated differences that were never reviewed.
const PROPOSALS = path.join(__dirname, 'data', 'recipe-completion-proposals.json')
const REPORT = path.join(__dirname, 'data', 'recipe-completion-proposals.md')
const AMENDMENT = 'scripts/oil_free_methods.cjs'
const proposals = JSON.parse(fs.readFileSync(PROPOSALS, 'utf8'))
if ((proposals.amendments || []).some(a => a.by === AMENDMENT)) {
  console.log('proposals already amended')
} else {
  for (const [id, add] of Object.entries(ADD_LABELS)) {
    const lb = proposals.recipes.find(x => x.id === id).labels
    for (const l of add) {
      const why = l === 'oil-free' ? WHY['oil-free'] : WHY[id]?.[l]
      if (!why) throw new Error(`${id}: no reason for ${l}`)
      if (lb.reasons[l].why !== 'method uses oil') throw new Error(`${id}: ${l} failed for "${lb.reasons[l].why}", not just the method oil`)
      lb.reasons[l] = { pass: true, why }
    }
    lb.proposed = LABEL_ORDER.filter(l => lb.proposed.includes(l) || add.includes(l))
    lb.added = lb.proposed.filter(l => !lb.existing.includes(l))
    lb.removed = lb.existing.filter(l => !lb.proposed.includes(l))
  }
  proposals.summary.oilInMethodNotListed = { statedAmount: [], unquantified: [] }
  proposals.summary.fryingOilNotListed = []
  const note = 'Methods of the 13 recipes that used oil not in their ingredients (or fried with no fat named) now water-saute / bake on baking paper / dry-toast. Labels added where the method oil was the only failure: ' +
    Object.entries(ADD_LABELS).map(([id, add]) => `${id} +${add.join(' +')}`).join('; ') + '.'
  proposals.amendments = [...(proposals.amendments || []), { date: '2026-10-28', by: AMENDMENT, packVersion: `fredheim-recepies-with-pictures ${TO_VERSION}`, note }]
  if (!dry) {
    fs.writeFileSync(PROPOSALS, JSON.stringify(proposals, null, 2) + '\n', 'utf8')
    fs.appendFileSync(REPORT, `\n## Amendment 2026-10-28 (\`${AMENDMENT}\`, pack ${TO_VERSION})\n\n${note} The "Oil in the method but not in the ingredients" list in section 0 is now empty; the label lines for these recipes in section 5 predate this change.\n`, 'utf8')
  }
  console.log(`proposals amended${dry ? ' (dry run)' : ''}`)
}

/* Adds the four Fredheim base porridges (Grøtgrunn) as orn-49..orn-56 —
 * each grain in a stovetop and an Instant Pot version, EN + NO + SV.
 *
 * Two recipes per grain rather than one with a variant note, because the
 * methods genuinely differ: the pressure version uses less water (no
 * evaporation from a sealed pot) and a completely different time.
 *
 * Nutrition is identical between the two methods of a grain — same grain,
 * same salt, and water carries no nutrients — but servingWeightGrams is
 * not. The source document's serving weights correspond to the stovetop
 * water; the pressure figures are computed as (dry + water) / servings
 * with no evaporation loss, which is why they come out lighter. Same
 * treatment as the Ciorbă pair (orn-30/orn-31).
 *
 * Kept as PLAIN bases (author's call). The source is explicit that plain
 * grain scores ORANGE — quinoa and millet are short on fibre and all four
 * run 3–5x over the 4:1 omega ratio — and that a tablespoon of ground
 * flaxseed per bowl fixes all of it. That guidance lives in the notes
 * rather than the ingredient list, so every nutrition figure here is the
 * author's own rather than a part-estimated flax-inclusive recalculation.
 * Consequently these deliberately do NOT carry an `ornish-green` tag;
 * audit_condition_tags.cjs computes the rest from the real numbers.
 *
 * Steps name ingredients without restating scaled amounts, per house
 * style; times, temperatures and the pressure settings stay since those
 * don't change with batch size.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const SERVINGS = 4
const DRY_G = 240
const SALT_TSP = 0.25

const GRAINS = [
  {
    key: 'oat',
    ids: { stove: 'orn-49', pot: 'orn-50' },
    title: { en: 'Oat Porridge', no: 'Havregrøt', sv: 'Havregröt' },
    grain: { en: 'rolled oats', no: 'havregryn', sv: 'havregryn' },
    water: { stove: 600, pot: 480 },
    stoveTime: { en: '8–10 minutes', no: '8–10 minutter', sv: '8–10 minuter' },
    potMinutes: 3,
    cook: { stove: 15, pot: 20 },
    prep: 2,
    rinse: false,
    servingW: { stove: 200, pot: 180 },
    fibreWithFlax: '8.6',
    ratio: '21.8:1',
    headroom: '0.5',
    nutrition: {
      calories: 233, protein: 10.1, totalFat: 4.1, saturatedFat: 0.73, polyunsaturatedFat: 1.52,
      monounsaturatedFat: 1.31, omega3: 0.07, omega6: 1.45, cholesterol: 0, totalCarbs: 39.8,
      totalSugars: 0.6, addedSugar: 0, fiber: 6.4, calcium: 32, potassium: 257, copper: 0.38,
      iron: 2.8, magnesium: 106, manganese: 2.95, selenium: 20.6, phosphorus: 314, zinc: 2.4,
      sodium: 147, vitaminA: 0, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
      vitaminE: 0.25, vitaminK: 1.2, folate: 34, thiamin: 0.46, riboflavin: 0.08, niacin: 0.58, choline: 24,
    },
  },
  {
    key: 'buckwheat',
    ids: { stove: 'orn-51', pot: 'orn-52' },
    title: { en: 'Buckwheat Porridge', no: 'Bokhvetegrøt', sv: 'Bovetegröt' },
    grain: { en: 'buckwheat groats', no: 'bokhvetegryn', sv: 'bovetegryn' },
    water: { stove: 600, pot: 480 },
    stoveTime: { en: '12–15 minutes', no: '12–15 minutter', sv: '12–15 minuter' },
    potMinutes: 2,
    cook: { stove: 20, pot: 20 },
    prep: 5,
    rinse: true,
    servingW: { stove: 200, pot: 180 },
    fibreWithFlax: '8.2',
    ratio: '12.3:1',
    headroom: '2.6',
    nutrition: {
      calories: 206, protein: 8.0, totalFat: 2.0, saturatedFat: 0.44, polyunsaturatedFat: 0.62,
      monounsaturatedFat: 0.62, omega3: 0.05, omega6: 0.58, cholesterol: 0, totalCarbs: 42.9,
      totalSugars: 0, addedSugar: 0, fiber: 6.0, calcium: 11, potassium: 276, copper: 0.66,
      iron: 1.3, magnesium: 139, manganese: 0.78, selenium: 5.0, phosphorus: 208, zinc: 1.4,
      sodium: 146, vitaminA: 0, vitaminB6: 0.13, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
      vitaminE: 0.19, vitaminK: 4.2, folate: 18, thiamin: 0.06, riboflavin: 0.26, niacin: 4.21, choline: 33,
    },
  },
  {
    key: 'quinoa',
    ids: { stove: 'orn-53', pot: 'orn-54' },
    title: { en: 'Quinoa Porridge', no: 'Quinoagrøt', sv: 'Quinoagröt' },
    grain: { en: 'quinoa', no: 'quinoa', sv: 'quinoa' },
    water: { stove: 720, pot: 600 },
    stoveTime: { en: '15–18 minutes', no: '15–18 minutter', sv: '15–18 minuter' },
    potMinutes: 2,
    cook: { stove: 23, pot: 20 },
    prep: 5,
    rinse: true,
    servingW: { stove: 230, pot: 210 },
    fibreWithFlax: '6.4',
    ratio: '11.4:1',
    headroom: '1.0',
    nutrition: {
      calories: 221, protein: 8.5, totalFat: 3.6, saturatedFat: 0.42, polyunsaturatedFat: 1.98,
      monounsaturatedFat: 0.97, omega3: 0.16, omega6: 1.79, cholesterol: 0, totalCarbs: 38.5,
      totalSugars: 0, addedSugar: 0, fiber: 4.2, calcium: 28, potassium: 338, copper: 0.35,
      iron: 2.7, magnesium: 118, manganese: 1.22, selenium: 5.1, phosphorus: 274, zinc: 1.9,
      sodium: 148, vitaminA: 1, vitaminB6: 0.29, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
      vitaminE: 1.46, vitaminK: 0, folate: 110, thiamin: 0.22, riboflavin: 0.19, niacin: 0.91, choline: 42,
    },
  },
  {
    key: 'millet',
    ids: { stove: 'orn-55', pot: 'orn-56' },
    title: { en: 'Millet Porridge', no: 'Hirsegrøt', sv: 'Hirsgröt' },
    grain: { en: 'millet', no: 'hirse', sv: 'hirs' },
    water: { stove: 840, pot: 720 },
    stoveTime: { en: '20–25 minutes', no: '20–25 minutter', sv: '20–25 minuter' },
    potMinutes: 10,
    cook: { stove: 30, pot: 27 },
    prep: 5,
    rinse: true,
    servingW: { stove: 255, pot: 240 },
    fibreWithFlax: '7.3',
    ratio: '16.9:1',
    headroom: '2.1',
    nutrition: {
      calories: 227, protein: 6.6, totalFat: 2.5, saturatedFat: 0.43, polyunsaturatedFat: 1.28,
      monounsaturatedFat: 0.46, omega3: 0.07, omega6: 1.21, cholesterol: 0, totalCarbs: 43.7,
      totalSugars: 0, addedSugar: 0, fiber: 5.1, calcium: 5, potassium: 117, copper: 0.45,
      iron: 1.8, magnesium: 68, manganese: 0.98, selenium: 1.6, phosphorus: 171, zinc: 1.0,
      sodium: 148, vitaminA: 0, vitaminB6: 0.23, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
      vitaminE: 0.03, vitaminK: 0.5, folate: 51, thiamin: 0.25, riboflavin: 0.17, niacin: 2.83, choline: 15,
    },
  },
]

const METHOD_LABEL = {
  stove: { en: 'Stovetop', no: 'kjele', sv: 'kastrull' },
  pot: { en: 'Instant Pot', no: 'trykkoker', sv: 'tryckkokare' },
}

// ── per-grain technique clauses ───────────────────────────────────────────
const RINSE_STEP = {
  oat: {
    en: 'No rinsing needed for oats — measure the oats, cold water and salt straight into the pan.',
    no: 'Havregryn trenger ikke skylles — mål opp havregryn, kaldt vann og salt rett i kjelen.',
    sv: 'Havregryn behöver inte sköljas — mät upp havregryn, kallt vatten och salt direkt i kastrullen.',
  },
  buckwheat: {
    en: 'Rinse the buckwheat groats under running water and drain.',
    no: 'Skyll bokhvetegrynene under rennende vann og la dem renne av.',
    sv: 'Skölj bovetegrynen under rinnande vatten och låt rinna av.',
  },
  quinoa: {
    en: 'Rinse the quinoa properly — a full 60 seconds of rubbing under running water. Saponins taste soapy and cooking will not remove them.',
    no: 'Skyll quinoaen skikkelig — hele 60 sekunder med gnukking under rennende vann. Saponiner smaker såpe, og koking fjerner dem ikke.',
    sv: 'Skölj quinoan ordentligt — hela 60 sekunder med gnuggning under rinnande vatten. Saponiner smakar tvål, och kokning tar inte bort dem.',
  },
  millet: {
    en: 'Rinse the millet under running water and drain.',
    no: 'Skyll hirsen under rennende vann og la den renne av.',
    sv: 'Skölj hirsen under rinnande vatten och låt rinna av.',
  },
}

const STIR_CLAUSE = {
  oat: {
    en: ' Stir often — oat starch needs agitation to turn creamy.',
    no: ' Rør ofte — havrestivelsen trenger bevegelse for å bli kremet.',
    sv: ' Rör ofta — havrestärkelsen behöver rörelse för att bli krämig.',
  },
  other: {
    en: ' Leave it alone while it cooks — this is an absorption grain, and stirring mid-cook breaks the grain down into paste.',
    no: ' La den være i fred mens den koker — dette er et absorpsjonskorn, og røring underveis bryter kornet ned til grøtmasse.',
    sv: ' Låt den vara i fred medan den kokar — det här är ett absorptionskorn, och omrörning under tiden bryter ner kornet till gröt.',
  },
}

const MILLET_BEAT = {
  en: ' Once the water is gone and it has rested, beat it hard for 30 seconds — that is where millet gets its creaminess.',
  no: ' Når vannet er borte og den har hvilt, pisk den kraftig i 30 sekunder — det er der hirsegrøten får kremetheten sin.',
  sv: ' När vattnet är borta och den har vilat, vispa den kraftigt i 30 sekunder — det är där hirsgröten får sin krämighet.',
}

function steps(g, method, lang) {
  const stir = g.key === 'oat' ? STIR_CLAUSE.oat[lang] : STIR_CLAUSE.other[lang]
  const beat = g.key === 'millet' ? MILLET_BEAT[lang] : ''
  if (method === 'stove') {
    const T = g.stoveTime[lang]
    return {
      en: [
        RINSE_STEP[g.key].en,
        'Add the grain, cold water and salt to the pot and bring to a boil. Start cold — pouring boiling water onto grain sets the outside and leaves you with grains floating in liquid instead of porridge.',
        `Reduce to the lowest simmer that still moves the surface. Lid on, and cook for ${T}.${stir}`,
        `Take off the heat, lid on, and rest 5 minutes before serving.${beat}`,
      ],
      no: [
        RINSE_STEP[g.key].no,
        'Ha kornet, det kalde vannet og saltet i kjelen og kok opp. Start kaldt — å helle kokende vann over kornet setter utsiden og gir deg korn som flyter i væske i stedet for grøt.',
        `Skru ned til det laveste småkoket som fortsatt beveger overflaten. Lokk på, og kok i ${T}.${stir}`,
        `Ta kjelen av varmen, la lokket ligge på, og la den hvile i 5 minutter før servering.${beat}`,
      ],
      sv: [
        RINSE_STEP[g.key].sv,
        'Lägg kornet, det kalla vattnet och saltet i kastrullen och koka upp. Börja kallt — att hälla kokande vatten över kornet sätter utsidan och ger dig korn som flyter i vätska i stället för gröt.',
        `Sänk till den lägsta sjudning som fortfarande rör ytan. Lock på, och koka i ${T}.${stir}`,
        `Ta kastrullen från värmen, låt locket ligga kvar, och låt vila i 5 minuter före servering.${beat}`,
      ],
    }[lang]
  }
  const m = g.potMinutes
  return {
    en: [
      RINSE_STEP[g.key].en,
      'Add the grain, cold water and salt to the pot and stir once.',
      `Lid on and set to sealing. Pressure cook ${m} minutes on HIGH.`,
      'Let it release naturally for 10 minutes, then vent the rest. Never quick-release porridge — starch foam sprays through the valve and the texture collapses.',
      `Stir well. It looks thin when you open it and thickens as it stands.${beat}`,
    ],
    no: [
      RINSE_STEP[g.key].no,
      'Ha kornet, det kalde vannet og saltet i gryta og rør én gang.',
      `Lokk på og sett ventilen på forsegling. Trykkok i ${m} minutter på HIGH.`,
      'La trykket falle naturlig i 10 minutter, og slipp så ut resten. Aldri hurtigutløs grøt — stivelsesskum spruter gjennom ventilen og teksturen kollapser.',
      `Rør godt. Den ser tynn ut når du åpner, og tykner mens den står.${beat}`,
    ],
    sv: [
      RINSE_STEP[g.key].sv,
      'Lägg kornet, det kalla vattnet och saltet i grytan och rör om en gång.',
      `Lock på och ställ ventilen på förslutning. Tryckkoka ${m} minuter på HIGH.`,
      'Låt trycket sjunka naturligt i 10 minuter, släpp sedan ut resten. Snabbutsläpp aldrig gröt — stärkelseskum sprutar genom ventilen och konsistensen kollapsar.',
      `Rör om ordentligt. Den ser tunn ut när du öppnar, och tjocknar medan den står.${beat}`,
    ],
  }[lang]
}

// Norwegian and Swedish use a decimal comma. The fixed figures in the note
// text are written with commas already; the per-grain values interpolated
// into it have to be converted, or one sentence ends up carrying both
// separators ("2,2 g fiber ... 7.3 g").
function num(value, lang) {
  return lang === 'en' ? value : String(value).replace(/\./g, ',')
}

function notes(g, lang) {
  const fibre = num(g.fibreWithFlax, lang)
  const ratio = num(g.ratio, lang)
  const headroom = num(g.headroom, lang)
  const calcium = g.key === 'millet'
    ? {
      en: ' Calcium is the weak point in millet especially — swapping 200 ml of the cooking water for fortified plant milk closes both the calcium and the B12 gap for under 1 g of added fat.',
      no: ' Kalsium er det svake punktet i hirse spesielt — bytt ut 200 ml av kokevannet med beriket plantemelk, så tetter du både kalsium- og B12-hullet for under 1 g ekstra fett.',
      sv: ' Kalcium är den svaga punkten i hirs särskilt — byt ut 200 ml av kokvattnet mot berikad växtmjölk, så täpper du till både kalcium- och B12-luckan för under 1 g extra fett.',
    }[lang]
    : ''
  return {
    en: `Finish with flaxseed. A tablespoon (8 g) of ground flaxseed stirred into each bowl off the heat — never cooked in — adds 2.2 g fibre and 1.82 g ALA. That takes the fibre to ${fibre} g and pulls the omega-6:3 ratio down from ${ratio} to roughly 1:1. Plain, this porridge sits at ORANGE on the Ornish scale; with the flax on top it is GREEN. Fat headroom for other toppings once the flax is counted is about ${headroom} g — for reference, 10 g of walnuts is 6.5 g of fat. Salt goes in with the cold water rather than at the end: added at the start it penetrates the grain and does more with less. If it tastes flat you have room to go to ⅓ tsp for the batch, but not ½ — that puts you near 300 mg of sodium before anything else is on the plate. B12 and vitamin D are absent, as in all unfortified plant food, so supplementation is assumed.${calcium}`,
    no: `Avslutt med linfrø. En spiseskje (8 g) malt linfrø rørt inn i hver skål utenom varmen — aldri kokt inn — gir 2,2 g fiber og 1,82 g ALA. Det løfter fiberen til ${fibre} g og drar omega-6:3-forholdet ned fra ${ratio} til omtrent 1:1. Ren scorer denne grøten ORANGE på Ornish-skalaen; med linfrøet på toppen er den GREEN. Fettmarginen til andre topping når linfrøet er regnet med, er cirka ${headroom} g — til sammenligning er 10 g valnøtter 6,5 g fett. Saltet skal i sammen med det kalde vannet, ikke på slutten: tilsatt fra start trenger det inn i kornet og gjør mer med mindre. Smaker den flatt, har du rom til å gå til ⅓ ts for hele porsjonen, men ikke ½ — da nærmer du deg 300 mg natrium før noe annet er på tallerkenen. B12 og vitamin D mangler, som i all uberiket plantekost, så tilskudd forutsettes.${calcium}`,
    sv: `Avsluta med linfrö. En matsked (8 g) malda linfrön nedrörda i varje skål utanför värmen — aldrig nedkokta — ger 2,2 g fiber och 1,82 g ALA. Det lyfter fibern till ${fibre} g och drar ner omega-6:3-förhållandet från ${ratio} till ungefär 1:1. Ren hamnar den här gröten på ORANGE på Ornish-skalan; med linfröet på toppen är den GREEN. Fettmarginalen för annan topping när linfröet är inräknat är cirka ${headroom} g — som jämförelse är 10 g valnötter 6,5 g fett. Saltet ska i tillsammans med det kalla vattnet, inte på slutet: tillsatt från början tränger det in i kornet och gör mer med mindre. Smakar den platt har du utrymme att gå till ⅓ tsk för hela satsen, men inte ½ — då närmar du dig 300 mg natrium innan något annat är på tallriken. B12 och D-vitamin saknas, som i all oberikad växtkost, så tillskott förutsätts.${calcium}`,
  }[lang]
}

function description(g, method, lang) {
  // Use the dish name ("havregrøt"), not grain + porridge ("havregryngrøt").
  const dish = g.title[lang].toLowerCase()
  const via = {
    stove: { en: 'on the stovetop', no: 'i kjele', sv: 'i kastrull' },
    pot: { en: 'in the Instant Pot', no: 'i trykkoker', sv: 'i tryckkokare' },
  }[method][lang]
  return {
    en: `Plain, unsweetened ${dish} cooked ${via} — just grain, water and salt, done properly. A base to build on rather than a finished dish.`,
    no: `Ren, usøtet ${dish} kokt ${via} — bare korn, vann og salt, gjort riktig. En grunn å bygge videre på, ikke en ferdig rett.`,
    sv: `Ren, osötad ${dish} kokad ${via} — bara korn, vatten och salt, gjort ordentligt. En grund att bygga vidare på, inte en färdig rätt.`,
  }[lang]
}

function ingredients(g, method, lang) {
  const waterName = { en: 'water', no: 'vann', sv: 'vatten' }[lang]
  const saltName = { en: 'fine sea salt', no: 'fint havsalt', sv: 'fint havssalt' }[lang]
  return [
    { quantity: DRY_G, unit: 'g', name: g.grain[lang] },
    { quantity: g.water[method], unit: 'ml', name: waterName },
    { quantity: SALT_TSP, unit: 'tsp', name: saltName },
  ]
}

const created = []
for (const g of GRAINS) {
  for (const method of ['stove', 'pot']) {
    const id = g.ids[method]
    const pairId = g.ids[method === 'stove' ? 'pot' : 'stove']
    if (pack.recipes.some(r => r.id === id)) throw new Error(`id collision: ${id}`)

    const build = lang => ({
      title: `${g.title[lang]} (${METHOD_LABEL[method][lang]})`,
      description: description(g, method, lang),
      ingredients: ingredients(g, method, lang),
      steps: steps(g, method, lang),
      notes: notes(g, lang),
    })

    const en = build('en')
    const recipe = {
      id,
      title: en.title,
      category: 'Breakfast',
      servings: SERVINGS,
      prepTime: g.prep,
      cookTime: g.cook[method],
      imageUrl: null,
      description: en.description,
      // No `ornish-green` here on purpose — the source scores the plain
      // grain ORANGE. Condition tags come from audit_condition_tags.cjs.
      tags: ['breakfast', 'porridge', 'vegan', 'oil-free', 'no-added-sugar', 'whole-grain'],
      kcal: g.nutrition.calories,
      servingWeightGrams: g.servingW[method],
      ingredients: en.ingredients,
      steps: en.steps,
      notes: en.notes,
      relatedRecipes: [pairId],
      nutrition: { perServing: { ...g.nutrition } },
      translations: {
        no: build('no'),
        sv: build('sv'),
      },
    }
    // The translation blocks carry title/description/ingredients/steps/notes only.
    for (const lang of ['no', 'sv']) delete recipe.translations[lang].id

    pack.recipes.push(recipe)
    created.push(`${id}  ${String(g.servingW[method]).padStart(3)} g/serv  ${recipe.cookTime} min  ${recipe.title}`)
  }
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${created.length} recipes. Pack -> ${pack.version}. Total: ${pack.recipes.length}`)
created.forEach(c => console.log('  ' + c))

/* Ten plant-based mains into the Fredheim Kitchen pack, from the reviewed
 * drafts (%TEMP%\cc-newsix-drafts.json) and their prepared 750 px photos
 * (%TEMP%\cc-newsix-images\<id>.dataurl).
 *
 * The drafts are kept as written apart from the FIX table below: amounts that
 * brought a main over 600 mg sodium, ratatouille and gazpacho made filling
 * enough for dinner (beans, and avocado on the gazpacho), cook times matched
 * to the method, and notes without dictionary or recipe ids. Labels, standard
 * salt and micronutrients are written afterwards by label-recipes,
 * build_salt_levels and complete_recipe_micronutrients.
 *
 * Usage: node scripts/add_ten_mains.cjs [--dry-run]
 */
const fs = require('fs')
const path = require('path')

const DRY = process.argv.includes('--dry-run')
const TEMP = process.env.TEMP
const DRAFTS = path.join(TEMP, 'cc-newsix-drafts.json')
const IMG_DIR = path.join(TEMP, 'cc-newsix-images')
const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(DIR, 'fredheim-recipes-with-pictures.json')
const DICT = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'ingredientDictionary.json'), 'utf8'))
const BY_ID = new Map(DICT.entries.map(e => [e.id, e]))
const LANGS = ['en', 'no', 'sv']
const NO_UNIT = { tsp: 'ts', tbsp: 'ss', clove: 'fedd', pcs: 'stk' }

const RINSED = { en: 'drained and rinsed', no: 'avrent og skylt', sv: 'avrunnen och sköljd' }

// Per recipe: rows changed (set), added (add: [afterId, row]) or dropped
// (drop), and text replaced. Text entries are { en, no, sv }; steps replace
// the whole list for that recipe.
const FIX = {
  'chili-sin-carne': {
    set: { 'carob-powder': { note: { en: 'for depth', no: 'for dybde', sv: 'för djup' } } },
  },
  'chana-masala': {
    // 800 g drained is not 2 cans: a 400 g can drains to about 240 g.
    set: { 'chickpeas-canned': { quantity: 720, note: { en: 'drained and rinsed (3 cans)', no: 'avrent og skylt (3 bokser)', sv: 'avrunnen och sköljd (3 burkar)' } } },
  },
  mujadara: {
    // 589 g and 87 g carbohydrate a plate at 4: the same pot serves 6.
    servings: 6,
    related: ['fr-57'],
    notes: {
      en: 'Cucumber Raita from this collection is good in place of the salad.',
      no: 'Agurk-raita fra denne samlingen passer godt i stedet for salaten.',
      sv: 'Gurkraita från den här samlingen passar bra i stället för salladen.',
    },
    replaceStep: { sv: [['Servera linse-riset med generöst med karamelliserad lök och salladen vid sidan.', 'Servera linsriset med rikligt med karamelliserad lök och salladen vid sidan.']] },
  },
  'moroccan-chickpea-tagine': {
    // 618 mg as drafted: part of the broth becomes water.
    set: { 'vegetable-broth': { quantity: 150 } },
    add: [['vegetable-broth', { quantity: 150, unit: 'ml', ingredient: 'water' }]],
    replaceStep: {
      en: [['tomatoes and broth.', 'tomatoes, broth and water.']],
      no: [['tomater og kraft.', 'tomater, kraft og vann.']],
      sv: [['tomater och buljong.', 'tomater, buljong och vatten.']],
    },
  },
  'mushroom-stroganoff': {
    related: ['fr-33'],
    set: { salt: { quantity: 0.25 }, tamari: { quantity: 2, unit: 'tsp', note: null } },
    notes: {
      en: 'Make the Cashew Sour Cream from this collection first; the nutrition is calculated on it.',
      no: 'Lag Cashew-rømmen fra denne samlingen først; næringsinnholdet er beregnet ut fra den.',
      sv: 'Gör cashewgräddfilen från den här samlingen först; näringsinnehållet är beräknat på den.',
    },
  },
  'lentil-shepherds-pie': {
    related: ['fr-104'],
    cookTime: 60,
    // 655 mg as drafted: the tamari goes, the lentils have plenty of savour.
    drop: ['tamari'],
    set: { 'vegetable-bouillon': { quantity: 0.75, unit: 'tsp' } },
    notes: {
      en: 'The topping follows the Mashed Potatoes in this collection, scaled to this pie.',
      no: 'Toppingen følger Potetmos fra denne samlingen, tilpasset denne paien.',
      sv: 'Toppingen följer Potatismos från den här samlingen, anpassad till den här pajen.',
    },
    replaceStep: {
      en: [['Add lentils, crushed tomatoes, broth and tamari.', 'Add lentils, crushed tomatoes and broth.']],
      no: [['Tilsett linser, knuste tomater, kraft og tamari.', 'Tilsett linser, knuste tomater og kraft.'], ['kokkevann', 'kokevann']],
      sv: [['Tillsätt linser, krossade tomater, buljong och tamari.', 'Tillsätt linser, krossade tomater och buljong.']],
    },
  },
  'thai-red-curry': {
    // 9.9 g saturated fat a serving as drafted: a little coconut milk for its
    // aroma, water for the rest of the liquid.
    set: { 'coconut-milk': { quantity: 50, note: { en: 'shaken well', no: 'ristet godt', sv: 'väl skakad' } } },
    add: [['coconut-milk', { quantity: 150, unit: 'ml', ingredient: 'water' }]],
    replaceStep: {
      en: [['broth and coconut milk.', 'broth, water and coconut milk.']],
      no: [['kraft og kokosmelk.', 'kraft, vann og kokosmelk.']],
      sv: [['buljong och kokosmjölk.', 'buljong, vatten och kokosmjölk.']],
    },
    notes: {
      en: 'Curry powder, chili, ginger, garlic and lime stand in for red curry paste, so the curry stays oil-free. Add more chili if you like it hotter.',
      no: 'Karri, chili, ingefær, hvitløk og lime erstatter rød currypasta, så curryen holder seg oljefri. Tilsett mer chili om du vil ha den sterkere.',
      sv: 'Curry, chili, ingefära, vitlök och lime ersätter röd currypasta, så att curryn håller sig oljefri. Tillsätt mer chili om du vill ha den starkare.',
    },
  },
  ratatouille: {
    // 111 kcal as drafted, too little for a dinner: two cans of white beans.
    cookTime: 60,
    add: [['canned-tomatoes', { quantity: 480, unit: 'g', ingredient: 'white-beans-canned', note: { en: 'drained and rinsed (2 cans)', no: 'avrent og skylt (2 bokser)', sv: 'avrunnen och sköljd (2 burkar)' } }]],
    description: {
      en: 'Summer vegetables and white beans slow-baked with tomato, thyme, rosemary and basil. Completely oil-free.',
      no: 'Sommergrønnsaker og hvite bønner langtidsbakt med tomat, timian, rosmarin og basilikum. Helt oljefri.',
      sv: 'Sommargrönsaker och vita bönor långbakade med tomat, timjan, rosmarin och basilika. Helt oljefri.',
    },
    replaceStep: {
      en: [['Toss eggplant, zucchini, bell pepper and fresh tomato with lemon juice;', 'Toss eggplant, zucchini, bell pepper, fresh tomato and white beans with lemon juice;']],
      no: [['Vend aubergine, squash, paprika og ferske tomater med sitronsaft;', 'Vend aubergine, squash, paprika, ferske tomater og hvite bønner med sitronsaft;'], ['server varm eller lunkent', 'server varm eller lunken']],
      sv: [['Blanda aubergine, squash, paprika och färska tomater med citronsaft;', 'Blanda aubergine, squash, paprika, färska tomater och vita bönor med citronsaft;']],
    },
  },
  gazpacho: {
    // 64 kcal as drafted, too little for a dinner: white beans blended in for
    // body (where the classic has bread) and avocado on top. Soup, not Main.
    category: 'Soup',
    cookTime: 30,
    add: [
      ['red-onions', { quantity: 400, unit: 'g', ingredient: 'white-beans-canned', note: RINSED }],
      ['water', { quantity: 200, unit: 'g', ingredient: 'avocados', note: { en: 'diced, to serve', no: 'i terninger, til servering', sv: 'tärnad, till servering' } }],
    ],
    description: {
      en: 'Cold no-cook tomato soup with cucumber, pepper and garlic, made filling with white beans and avocado and brightened with lemon juice.',
      no: 'Kald tomatsuppe uten koking, med agurk, paprika og hvitløk, gjort mettende med hvite bønner og avokado og friskt smakt til med sitronsaft.',
      sv: 'Kall tomatsoppa utan kokning, med gurka, paprika och vitlök, mättande med vita bönor och avokado och frisk av citronsaft.',
    },
    steps: {
      en: [
        'Put tomatoes, most of the cucumber and pepper, onion, white beans, garlic, lemon juice, salt and pepper in a blender.',
        'Blend until smooth. Add ice-cold water to reach a spoonable soup consistency.',
        'Taste and adjust lemon and salt. Chill at least 30 minutes (or up to a day).',
        'Serve cold topped with the avocado, the reserved diced cucumber and pepper, and basil.',
      ],
      no: [
        'Ha tomater, det meste av agurk og paprika, løk, hvite bønner, hvitløk, sitronsaft, salt og pepper i en blender.',
        'Kjør til det er glatt. Tilsett iskaldt vann til ønsket konsistens.',
        'Smak til med sitron og salt. Avkjøl minst 30 minutter (eller opptil en dag).',
        'Server kaldt med avokado, terninger av agurk og paprika, og basilikum.',
      ],
      sv: [
        'Lägg tomater, merparten av gurka och paprika, lök, vita bönor, vitlök, citronsaft, salt och peppar i en blender.',
        'Mixa slätt. Tillsätt iskallt vatten till önskad konsistens.',
        'Smaka av med citron och salt. Kyl minst 30 minuter (eller upp till en dag).',
        'Servera kallt med avokado, tärnad gurka och paprika samt basilika.',
      ],
    },
  },
  'vegetarian-lapskaus': {
    cookTime: 50,
    // 623 mg as drafted: broth and bouillon both; the broth alone will do.
    drop: ['vegetable-bouillon'],
    set: { parsnips: { note: { en: 'in chunks', no: 'i biter', sv: 'i bitar' } } },
    notes: {
      en: 'Parsnip stands in for the swede of the classic. Rye crispbread is good on the side.',
      no: 'Pastinakk erstatter kålroten i originalen. Knekkebrød passer godt ved siden av.',
      sv: 'Palsternacka ersätter kålroten i originalet. Knäckebröd passar bra vid sidan av.',
    },
    replaceStep: {
      en: [['celery, broth, bouillon, bay leaves', 'celery, broth, water, bay leaves']],
      no: [['selleri, kraft, buljong, laurbærblad', 'selleri, kraft, vann, laurbærblad']],
      sv: [['selleri, buljong, buljongpulver, lagerblad', 'selleri, buljong, vatten, lagerblad']],
    },
  },
}

// Tags the criteria compute are left to label-recipes.
const KEEP_TAGS = t => t !== 'plant-based' && !['weight-loss', 'blood-pressure-friendly', 'diabetes-friendly', 'heart-healthy', 'gluten-free', 'nut-free', 'soy-free', 'oil-free', 'no-added-sugar', 'quick', 'batch-friendly', 'kid-friendly'].includes(t)

// Whole dl and half dl read better than millilitres in the rows.
function toDl(row) {
  if (row.unit !== 'ml' || row.quantity % 50 !== 0) return row
  return { ...row, quantity: row.quantity / 100, unit: 'dl' }
}

function validateJpeg(dataUrl, id) {
  if (!dataUrl.startsWith('data:image/jpeg;base64,')) throw new Error(`not a JPEG data URL: ${id}`)
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) throw new Error(`not a JPEG: ${id}`)
  if (!(buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9)) throw new Error(`truncated JPEG (no EOI): ${id}`)
  return buf.length
}

function rowsOf(draft, lang) {
  return lang === 'en' ? draft.ingredients : draft.translations[lang].ingredients
}

// One language's rows, after the fixes: standard names, the unit spelled the
// way the drafts spell it in that language, and no standard amounts yet
// (build_salt_levels decides those).
function buildRows(draft, lang, fix) {
  const out = []
  const place = row => {
    const e = BY_ID.get(row.ingredient)
    if (!e) throw new Error(`${draft.id}: not in the dictionary: ${row.ingredient}`)
    const metric = toDl(row)
    const next = { quantity: metric.quantity, unit: lang === 'no' ? (NO_UNIT[metric.unit] || metric.unit) : metric.unit, ingredient: row.ingredient, name: e.names[lang] }
    const note = row.note && typeof row.note === 'object' ? row.note[lang] : row.note
    if (note) next.note = note
    return next
  }
  const en = draft.ingredients
  rowsOf(draft, lang).forEach((raw, k) => {
    const id = en[k].ingredient
    if (raw.ingredient !== id) throw new Error(`${draft.id}: ${lang} row ${k} is ${raw.ingredient}, en is ${id}`)
    if (raw.quantity !== en[k].quantity) throw new Error(`${draft.id}: ${lang} row ${k} quantity differs`)
    if (!(fix.drop || []).includes(id)) {
      const set = fix.set?.[id] || {}
      const merged = { quantity: en[k].quantity, unit: en[k].unit, ingredient: id, note: raw.note, ...set }
      out.push(place(merged))
    }
    for (const [after, row] of fix.add || []) if (after === id) out.push(place(row))
  })
  return out
}

function buildSteps(draft, lang, fix) {
  if (fix.steps) return fix.steps[lang]
  let steps = lang === 'en' ? draft.steps : draft.translations[lang].steps
  for (const [from, to] of fix.replaceStep?.[lang] || []) {
    if (!steps.some(s => s.includes(from))) throw new Error(`${draft.id} ${lang}: step text not found: ${from}`)
    steps = steps.map(s => s.split(from).join(to))
  }
  return steps
}

;(async () => {
  const { estimateRecipe, PACK_KEY, round } = await import('./lib/recipeNutritionEstimate.mjs')
  const drafts = JSON.parse(fs.readFileSync(DRAFTS, 'utf8'))
  const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))

  let globalMax = 0
  const allIds = new Set()
  for (const f of PACKS) {
    const j = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))
    for (const r of j.recipes) { globalMax = Math.max(globalMax, r.createdAt || 0); allIds.add(r.id) }
  }

  drafts.forEach((draft, k) => {
    if (allIds.has(draft.id)) throw new Error(`${draft.id} already exists`)
    const fix = FIX[draft.id] || {}
    const rows = Object.fromEntries(LANGS.map(l => [l, buildRows(draft, l, fix)]))
    const steps = Object.fromEntries(LANGS.map(l => [l, buildSteps(draft, l, fix)]))
    for (const l of ['no', 'sv']) {
      if (rows[l].length !== rows.en.length) throw new Error(`${draft.id} ${l}: row count`)
      if (steps[l].length !== steps.en.length) throw new Error(`${draft.id} ${l}: step count`)
    }

    const est = estimateRecipe({ ingredients: rows.en })
    if (est.problems.length) throw new Error(`${draft.id}: ${est.problems.join('; ')}`)
    const perServing = {}
    const servings = fix.servings ?? draft.servings
    for (const [field, key] of Object.entries(PACK_KEY)) perServing[key] = round(est.totals[field] / servings, field)
    const grams = Math.round(est.weight / servings)

    const imageUrl = fs.readFileSync(path.join(IMG_DIR, `${draft.id}.dataurl`), 'utf8').trim()
    const bytes = validateJpeg(imageUrl, draft.id)

    const portion = text => text.replace(/\(~\d+ g\)/, `(~${grams} g)`)
    const notes = l => fix.notes?.[l] ?? (l === 'en' ? draft.notes : draft.translations[l].notes)
    const description = l => fix.description?.[l] ?? (l === 'en' ? draft.description : draft.translations[l].description)
    const tr = l => ({
      title: draft.translations[l].title,
      description: description(l),
      ingredients: rows[l],
      steps: steps[l],
      ...(notes(l) ? { notes: notes(l) } : {}),
      portion: portion(draft.translations[l].portion),
    })
    const recipe = {
      id: draft.id,
      title: draft.title,
      category: fix.category || draft.category,
      servings,
      portion: portion(draft.portion),
      prepTime: draft.prepTime,
      cookTime: fix.cookTime ?? draft.cookTime,
      imageUrl,
      description: description('en'),
      tags: draft.tags.filter(KEEP_TAGS),
      mealTypes: draft.mealTypes,
      kcal: Math.round(perServing.calories),
      servingWeightGrams: grams,
      nutrition: { perServing },
      ...(fix.related ? { relatedRecipes: fix.related } : {}),
      ingredients: rows.en,
      steps: steps.en,
      ...(notes('en') ? { notes: notes('en') } : {}),
      translations: { no: tr('no'), sv: tr('sv') },
      createdAt: globalMax + 3600000 * (k + 1),
    }
    pack.recipes.push(recipe)
    const n = perServing
    console.log(`${draft.id}: ${grams} g/serving x${servings} ·${n.calories} kcal · protein ${n.protein} g · fibre ${n.fiber} g · sat ${n.saturatedFat} g · carbs ${n.totalCarbs} g · sodium ${n.sodium} mg · image ${Math.round(bytes / 1024)} KB`)
  })

  if (DRY) { console.log('[dry-run] not written'); return }
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`Pack -> ${pack.version}`)
})()

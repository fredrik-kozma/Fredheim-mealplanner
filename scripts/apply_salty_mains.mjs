#!/usr/bin/env node
/*
 * One-off (2026-10-29): Fredrik's approved proposals from
 * scripts/data/salty-mains-proposals.md (sections B and C), in the Fredheim
 * pack. Exactly the proposal amounts, en/no/sv alike, plus his extra
 * decisions:
 *
 *   - Broccoli Soup, Cabbage Soup: oil-free (water sauté).
 *   - Noodle Wok: oil-free (water stir-fry, tofu baked on baking paper) and
 *     1 tsp toasted sesame seeds a plate as an ingredient row.
 *   - Roasted Salad: oil-free (roasted on baking paper); maple syrup kept.
 *   - Lasagna: filling salt ½ tsp, and White Cashew Sauce (fr-191) salt
 *     2 tsp → 1 tsp. The sauce's composition row (the pack's own sauce, per
 *     100 g) follows.
 *   - Za'atar Hummus Plate: the hummus row is the pack's Classic Hummus, the
 *     same sub-recipe mechanism as Lasagna's White Cashew Sauce: a
 *     `homemade` dictionary entry + a composition row from the recipe's own
 *     panel (per serving ÷ serving weight). Olives and capers halved, oil
 *     kept. "Bouillon" stays bouillon powder (Fredrik confirmed).
 *
 * Nutrition: the change in the ingredient calculation
 * (scripts/data/food-composition-core.json) is applied to the stored panel,
 * field by field; sodium is the calculation itself (as the proposals give
 * it, and replacing stored where they said so); Broccoli Soup's panel,
 * already far off, takes the calculation outright. Mono/poly fats follow total
 * fat proportionally. kcal follows calories. sodiumStandard and the
 * Standard salt amounts are left to build_salt_levels.mjs; labels to
 * label-recipes. The pack version is bumped by build_salt_levels.mjs (one
 * bump for the whole change); this script does not.
 *
 * Throws if a row isn't what the proposal changed (already applied?).
 * Usage: node scripts/apply_salty_mains.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const DICT = path.join(ROOT, 'src/data/ingredientDictionary.json')
const COMP = path.join(ROOT, 'scripts/data/food-composition-core.json')
const ESTIMATOR = pathToFileURL(path.join(ROOT, 'scripts/lib/recipeNutritionEstimate.mjs')).href
const LANGS = ['en', 'no', 'sv']
const LOCAL = { no: { tsp: 'ts', tbsp: 'ss' }, sv: { tsp: 'tsk', tbsp: 'msk' } }

const SPLASH = {
  en: s => `adding a splash more as needed so ${s} stick`,
  no: s => `Tilsett en skvett vann til ved behov, så ${s} ikke setter seg fast.`,
  sv: s => `Tillsätt en skvätt vatten till vid behov så att ${s} inte fastnar.`,
}

// Row edits by index in the current list: [ingredient, from quantity, from unit] → to.
// { remove: true } drops the row (in all three lists).
const set = (q, unit) => ({ quantity: q, ...(unit ? { unit } : {}) })
export const EDITS = {
  'broccoli-soup': [
    [6, 'vegetable-bouillon', 4, 'tbsp', set(2, 'tsp')],
    [4, 'salt', 1, 'tsp', set(0.25)],
    [3, 'olive-oil', 4, 'tbsp', { remove: true }],
  ],
  'pumpkin-soup': [[7, 'salt', 2.5, 'tbsp', set(2.5, 'tsp')]],
  'fr-143': [
    [10, 'salt', 2, 'tbsp', set(0.75, 'tsp')],
    [15, 'vegetable-bouillon', 2, 'tbsp', set(2, 'tsp')],
  ],
  'fr-94': [[3, 'salt', 1, 'tbsp', set(0.5, 'tsp')]],
  'fr-191': [[5, 'salt', 2, 'tsp', set(1)]],
  'fr-27': [
    [3, 'vegetable-bouillon', 2, 'tbsp', set(1)],
    [7, 'salt', 1, 'tsp', set(0.25)],
    [8, 'olive-oil', 2, 'tbsp', { remove: true }],
  ],
  'cauliflower-soup': [
    [5, 'vegetable-bouillon', 2, 'tbsp', set(1)],
    [6, 'salt', 0.75, 'tsp', set(0.25)],
  ],
  'chinese-soup': [
    [6, 'salt', 2, 'tbsp', set(1, 'tsp')],
    [10, 'vegetable-bouillon', 4, 'tbsp', set(2)],
  ],
  'breaded-tofu-sticks': [
    [3, 'salt', 0.25, 'tsp', { remove: true }],
    [8, 'salt', 0.5, 'tsp', set(0.25)],
  ],
  'golden-soup': [[5, 'salt', 2.5, 'tsp', set(1.25)]],
  'kale-soup': [[4, 'herb-salt', 2, 'tbsp', set(1)]],
  'fr-101': [
    [4, 'soy-sauce', 4, 'tbsp', set(2)],
    [8, 'vegetable-bouillon', 5, 'tsp', set(2)],
  ],
  'noodle-wok': [
    [1, 'soy-sauce', 6, 'tbsp', set(5)],
    [2, 'sesame-oil', 6, 'tbsp', { remove: true }],
    [13, 'salt', 1, 'tbsp', { remove: true }],
  ],
  'roasted-salad': [
    [1, 'olive-oil', 3, 'tbsp', { remove: true }],
    [2, 'salt', 1.5, 'tsp', set(0.5)],
    [6, 'olive-oil', 3, 'tbsp', { remove: true }],
    [7, 'salt', 1.5, 'tsp', set(0.5)],
    [12, 'salt', 0.5, 'tsp', set(0.25)],
    [17, 'salt', 1.5, 'tsp', set(0.5)],
  ],
  'fr-172': [[11, 'salt', 5, 'tsp', set(2.5)]],
  'zaatar-hummus-salad': [
    [0, 'hummus', 240, 'g', {
      ingredient: 'classic-hummus',
      name: { en: 'Classic hummus', no: 'Klassisk hummus', sv: 'Klassisk hummus' },
      note: { en: 'homemade, see the Classic Hummus recipe', no: 'hjemmelaget, se oppskriften Klassisk hummus', sv: 'hemgjord, se receptet Klassisk hummus' },
    }],
    [4, 'olives', 34, 'g', set(17)],
    [7, 'capers', 17, 'g', { quantity: 8, note: { en: 'rinsed', no: 'skylt', sv: 'sköljda' } }],
  ],
  'potato-and-spinach-soup': [[8, 'salt', 2, 'tsp', set(0.75)]],
  'fr-184': [[7, 'vegetable-bouillon', 2, 'tbsp', set(1)]],
}
export const APPLIED_IDS = Object.keys(EDITS)
// Stored panel already well off the ingredients (salty-mains-proposals.md §A:
// ~37 % high); a delta on top of it leaves kcal ~35 % off, so the core
// fields are taken from the calculation outright.
const PANEL_FROM_INGREDIENTS = ['broccoli-soup']

// Rows added at the end of the list (12 plates × 1 tsp × 3 g).
const ADD = {
  'noodle-wok': [{
    quantity: 36, unit: 'g', ingredient: 'sesame-seeds',
    name: { en: 'Sesame seeds', no: 'Sesamfrø', sv: 'Sesamfrön' },
    note: { en: 'toasted', no: 'ristet', sv: 'rostade' },
  }],
}

// Method changes: step index → { expect (old en step), en, no, sv }.
const STEPS = {
  'broccoli-soup': {
    2: {
      expect: /add the oil, onions and garlic/,
      en: `In a pot, sauté the onions and garlic in 3–4 tbsp water with a pinch of salt until the onions are translucent, about 10 minutes, ${SPLASH.en("they don't")}. Add the broccoli stems and continue to sweat for a few minutes until softened.`,
      no: `Surr løk og hvitløk i 3–4 ss vann i en gryte sammen med en klype salt til løken er blank, ca. 10 minutter. ${SPLASH.no('det')} Tilsett brokkolistilkene og fortsett å surre i noen minutter til de er myke.`,
      sv: `Fräs lök och vitlök i 3–4 msk vatten i en gryta tillsammans med en nypa salt tills löken är blank, cirka 10 minuter. ${SPLASH.sv('det')} Tillsätt broccolistjälkarna och fortsätt att fräsa i några minuter tills de är mjuka.`,
    },
  },
  'fr-27': {
    1: {
      expect: /add the oil, onions, carrots/,
      en: `Heat a large, heavy-bottomed pot over medium heat. Once hot, add 2–3 tbsp water, the onions, carrots and a pinch of salt. Let the onion and carrot sweat until they soften (but do not brown), ${SPLASH.en("they don't")}. Add garlic and cook for about 1 minute.`,
      no: `Varm opp en stor, tykkbunnet gryte på middels varme. Når den er varm, tilsetter du 2–3 ss vann, løk, gulrøtter og en klype salt. La løk og gulrot svette til de er myke (men ikke brunes). ${SPLASH.no('det')} Tilsett hvitløk og la det surre i ca. 1 minutt.`,
      sv: `Värm upp en stor, tjockbottnad gryta på medelvärme. När den är het tillsätter du 2–3 msk vatten, lök, morötter och en nypa salt. Låt lök och morot fräsa tills de är mjuka (men inte brynta). ${SPLASH.sv('det')} Tillsätt vitlök och låt det fräsa i cirka 1 minut.`,
    },
  },
  'breaded-tofu-sticks': {
    0: {
      expect: /Mix flour, nutritional yeast, salt and powdered nori/,
      en: 'Prepare three deep containers for the breading: a) Mix flour, nutritional yeast and powdered nori seaweed (put seaweek papers in blender some seconds to make it powder).',
      no: 'Gjør klar tre dype beholdere til paneringen: a) Bland mel, næringsgjær og norialgepulver (kjør noritang i blender i noen sekunder til det blir pulver).',
      sv: 'gör klar tre djupa behållare till paneringen: a) Blanda mjöl, näringsjäst och norialgpulver (mixa nori i mixer i några sekunder tills det blir pulver).',
    },
  },
  'noodle-wok': {
    0: {
      expect: /soy sauce, sesame oil and red chili/,
      en: 'Marinate the tofu cubes in soy sauce and red chili.',
      no: 'Marinér tofuterningene i soyasaus og rød chili.',
      sv: 'Marinera tofutärningarna i sojasås och röd chili.',
    },
    1: {
      expect: /little salt and oil/,
      en: 'Bring a pot of water to a boil.',
      no: 'Kok opp en kjele med vann.',
      sv: 'Koka upp en kastrull med vatten.',
    },
    4: {
      expect: /Pan fry the small tofu cubes in oil/,
      en: 'Spread the tofu cubes on a baking tray lined with baking paper and bake at 200 °C for 15–20 minutes until golden.',
      no: 'Fordel tofuterningene på et stekebrett med bakepapir og stek dem på 200 °C i 15–20 minutter til de er gylne.',
      sv: 'Fördela tofutärningarna på en plåt med bakplåtspapper och rosta dem i 200 °C i 15–20 minuter tills de är gyllene.',
    },
    5: {
      expect: /Heat oil in a big pan/,
      en: `Heat 2–3 tbsp water in a big pan (or wok). Sauté onion, garlic and ginger until soft, ${SPLASH.en("they don't")}.`,
      no: `Varm 2–3 ss vann i en stor panne (eller wok). Surr løk, hvitløk og ingefær til det er mykt. ${SPLASH.no('det')}`,
      sv: `Värm 2–3 msk vatten i en stor panna (eller wok). Fräs lök, vitlök och ingefära tills det är mjukt. ${SPLASH.sv('det')}`,
    },
    6: {
      expect: /Stir-fry on high heat/,
      en: 'Add bell pepper, carrot and cabbage. Stir-fry on high heat for 3–4 minutes, adding a splash of water whenever the pan gets dry.',
      no: 'Tilsett paprika, gulrot og kål. Wokfres på høy varme i 3–4 minutter, og tilsett en skvett vann når pannen blir tørr.',
      sv: 'Tillsätt paprika, morot och kål. Woka på hög värme i 3–4 minuter och tillsätt en skvätt vatten när pannan blir torr.',
    },
    7: {
      expect: /sesame oil and chili\), ketchup, salt and pepper/,
      en: 'Add the marinade (soy sauce and chili), ketchup and pepper.',
      no: 'Tilsett marinaden (soyasaus og chili), ketchup og pepper.',
      sv: 'Tillsätt marinaden (sojasås och chili), ketchup och peppar.',
    },
    9: {
      expect: /Garnish with fresh spring onions/,
      en: 'Toast the sesame seeds in a dry pan until golden. Garnish each plate with fresh spring onions and 1 tsp of the toasted sesame seeds.',
      no: 'Rist sesamfrøene i en tørr panne til de er gylne. Pynt hver tallerken med fersk vårløk og 1 ts av de ristede sesamfrøene.',
      sv: 'Rosta sesamfröna i en torr panna tills de är gyllene. Garnera varje tallrik med färsk salladslök och 1 tsk av de rostade sesamfröna.',
    },
  },
  'roasted-salad': {
    0: {
      expect: /Put the beetroot, oil, salt/,
      en: 'Put the beetroot, salt, smoked paprika and cayenne on a tray lined with baking paper, sprinkle over 2–3 tbsp water and toss so the seasonings are spread evenly over the beetroot. Roast in the oven at 200°C for 25–30 minutes.',
      no: 'Legg rødbetene, salt, røkt paprikapulver og cayenne på et stekebrett med bakepapir, dryss over 2–3 ss vann og vend godt slik at krydderet fordeles jevnt på rødbetene. Stek dem i ovnen på 200 °C i 25–30 minutter.',
      sv: 'Lägg rödbetorna, salt, rökt paprikapulver och cayenne på en plåt med bakplåtspapper, stänk över 2–3 msk vatten och vänd så att kryddorna fördelas jämnt på rödbetorna. Rosta dem i ugnen i 200 °C i 25–30 minuter.',
    },
  },
}

// Classic Hummus as an ingredient (like white-cashew-sauce).
const HUMMUS_ENTRY = {
  id: 'classic-hummus',
  aisle: 'Dairy',
  preferredUnit: 'g',
  names: { en: 'Classic hummus', no: 'Klassisk hummus', sv: 'Klassisk hummus' },
  synonyms: { en: ['Homemade hummus'], no: ['Hjemmelaget hummus'], sv: ['Hemgjord hummus'] },
  homemade: true,
}

const listOf = (r, l) => (l === 'en' ? r.ingredients : r.translations[l].ingredients)
const stepsOf = (r, l) => (l === 'en' ? r.steps : r.translations[l].steps)
const roundField = (k, v) => (['calories', 'sodium', 'potassium'].includes(k) ? Math.round(v) : Math.abs(v) < 1 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10)
const FAT_PARTS = ['polyunsaturatedFat', 'monounsaturatedFat', 'omega3', 'omega6']

function localUnit(lang, oldUnit, unit) {
  if (lang === 'en' || !LOCAL[lang]) return unit
  const localised = Object.values(LOCAL[lang]).includes(oldUnit)
  return localised ? LOCAL[lang][unit] || unit : unit
}

function editRecipe(r) {
  for (const l of LANGS) if (listOf(r, l).length !== r.ingredients.length) throw new Error(`${r.id}: ${l} row count differs`)
  const drop = new Set()
  for (const [i, ing, q, unit, to] of EDITS[r.id]) {
    const en = r.ingredients[i]
    if (en?.ingredient !== ing || en.quantity !== q || en.unit !== unit) {
      throw new Error(`${r.id} row ${i}: expected ${q} ${unit} ${ing}, found ${en && `${en.quantity} ${en.unit} ${en.ingredient}`} (already applied?)`)
    }
    if (to.remove) { drop.add(i); continue }
    for (const l of LANGS) {
      const row = listOf(r, l)[i]
      if (row.ingredient !== ing || row.quantity !== q) throw new Error(`${r.id} row ${i} (${l}) differs from en`)
      if (to.ingredient) row.ingredient = to.ingredient
      if (to.name) row.name = to.name[l]
      if (to.note) row.note = to.note[l]
      row.quantity = to.quantity ?? row.quantity
      if (to.unit) row.unit = localUnit(l, row.unit, to.unit)
      if (row.standardAmount != null && to.unit) { delete row.standardAmount; delete row.standardUnit }
    }
  }
  for (const l of LANGS) {
    const kept = listOf(r, l).filter((_, i) => !drop.has(i))
    for (const add of ADD[r.id] || []) kept.push({ quantity: add.quantity, unit: add.unit, ingredient: add.ingredient, name: add.name[l], note: add.note[l] })
    if (l === 'en') r.ingredients = kept
    else r.translations[l].ingredients = kept
  }
  for (const [i, c] of Object.entries(STEPS[r.id] || {})) {
    if (!c.expect.test(r.steps[i])) throw new Error(`${r.id} step ${i}: unexpected text "${r.steps[i]}"`)
    for (const l of LANGS) {
      const steps = stepsOf(r, l)
      if (steps.length !== r.steps.length) throw new Error(`${r.id}: ${l} step count differs`)
      steps[i] = c[l]
    }
  }
}

function perServingCalc(E, r) {
  const est = E.estimateRecipe(r)
  if (est.problems.length) throw new Error(`${r.id}: ${est.problems.join('; ')}`)
  return Object.fromEntries(E.FIELDS.map(f => [E.PACK_KEY[f], est.totals[f] / r.servings]))
}

// Per-100 g composition from a recipe's own stored panel (the basis of the
// white-cashew-sauce row): per serving ÷ serving weight.
function ownComposition(r) {
  const n = r.nutrition.perServing
  const k = 100 / r.servingWeightGrams
  const keys = ['calories', 'protein', 'totalFat', 'saturatedFat', 'totalCarbs', 'fiber', 'totalSugars', 'addedSugar', 'sodium', 'potassium']
  return keys.map(key => {
    const v = (n[key] || 0) * k
    return ['calories', 'sodium', 'potassium'].includes(key) ? Math.round(v) : Math.round(v * 10) / 10
  })
}

async function main() {
  const dry = process.argv.includes('--dry')
  const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
  if (pack.id !== 'fredheim-recepies-with-pictures') throw new Error(`unexpected pack id ${pack.id}`)
  const byId = new Map(pack.recipes.map(r => [r.id, r]))
  const E1 = await import(ESTIMATOR) // old composition table

  const originals = new Map()
  const before = new Map()
  for (const id of APPLIED_IDS) {
    const r = byId.get(id)
    if (!r) throw new Error(`${id}: not in pack`)
    originals.set(id, structuredClone(r))
    before.set(id, perServingCalc(E1, r))
    editRecipe(r)
  }

  // ── White Cashew Sauce: sodium from the ingredients, then its composition row ──
  const sauce = byId.get('fr-191')
  sauce.nutrition.perServing.sodium = Math.round(perServingCalc(E1, sauce).sodium)
  const sauceRow = ownComposition(sauce)
  const hummusRow = ownComposition(byId.get('classic-hummus'))

  // ── composition table (kept in its hand-aligned format) ──
  let comp = fs.readFileSync(COMP, 'utf8')
  const lineOf = (id, v, extra) => `    ${`"${id}":`.padEnd(26)}{ "v": [${v.join(', ')}]${extra} },`
  const oldSauce = comp.match(/^ {4}"white-cashew-sauce":.*$/m)
  if (!oldSauce) throw new Error('no white-cashew-sauce composition row')
  comp = comp.replace(oldSauce[0], lineOf('white-cashew-sauce', sauceRow, ', "density": 1.0, "basis": "the pack\'s own White Cashew Sauce, per 100 g"'))
  if (/^ {4}"classic-hummus":/m.test(comp)) throw new Error('classic-hummus composition row already there (already applied?)')
  const lines = comp.split('\n')
  const at = lines.findIndex(l => { const m = l.match(/^ {4}"([^"]+)":/); return m && m[1] > 'classic-hummus' })
  lines.splice(at, 0, lineOf('classic-hummus', hummusRow, ', "basis": "the pack\'s own Classic Hummus (classic-hummus), per 100 g"'))
  comp = lines.join('\n')

  // ── dictionary ──
  const dict = JSON.parse(fs.readFileSync(DICT, 'utf8'))
  if (dict.entries.some(e => e.id === HUMMUS_ENTRY.id)) throw new Error('classic-hummus already in the dictionary')
  dict.entries.splice(dict.entries.findIndex(e => e.id === 'hummus') + 1, 0, HUMMUS_ENTRY)

  if (!dry) {
    fs.writeFileSync(COMP, comp, 'utf8')
    fs.writeFileSync(DICT, JSON.stringify(dict, null, 2) + '\n', 'utf8')
  }
  // Same module, fresh instance: reads the composition table just written.
  const E2 = dry ? E1 : await import(`${ESTIMATOR}?after`)

  // ── nutrition ──
  const log = []
  for (const id of APPLIED_IDS) {
    const r = byId.get(id)
    const per = r.nutrition.perServing
    const b = before.get(id)
    const a = perServingCalc(E2, r)
    const from = { kcal: r.kcal, sodium: originals.get(id).nutrition.perServing.sodium, fat: per.totalFat }
    for (const k of Object.keys(a)) {
      if (k === 'sodium') { per.sodium = Math.round(a.sodium); continue }
      if (typeof per[k] !== 'number') continue
      per[k] = PANEL_FROM_INGREDIENTS.includes(id) ? roundField(k, a[k]) : Math.max(0, roundField(k, per[k] + a[k] - b[k]))
    }
    if (from.fat > 0 && per.totalFat !== from.fat) {
      for (const k of FAT_PARTS) if (typeof per[k] === 'number') per[k] = roundField(k, per[k] * per.totalFat / from.fat)
    }
    r.kcal = Math.round(per.calories)
    log.push(`${id}: sodium ${from.sodium} → ${per.sodium} mg (calc before ${Math.round(b.sodium)}), kcal ${from.kcal} → ${r.kcal}, fat ${from.fat} → ${per.totalFat}`)
  }

  if (!dry) fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(log.join('\n'))
  console.log(`composition: white-cashew-sauce [${sauceRow.join(', ')}], classic-hummus [${hummusRow.join(', ')}]`)
  console.log(`${APPLIED_IDS.length} recipes${dry ? ' (dry run, nothing written)' : ' written'}; pack still ${pack.version} (build_salt_levels.mjs --write bumps it)`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()

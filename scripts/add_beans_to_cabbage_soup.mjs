#!/usr/bin/env node
/*
 * One-off: one can of white beans in the Cabbage Soup (fr-27).
 *
 * Oil-free, the soup came to 47 kcal a 420 g bowl: under the 50 kcal a
 * meal needs, and thin. A can of cannellini (400 g, ~240 g drained) adds
 * protein, fibre and body. The beans are ordinary canned ones, not
 * no-salt-added, as the rest of the packs use them.
 *
 *   - adds the bean row after the tomatoes in en/no/sv, and the beans to
 *     the step where the carrots finish cooking
 *   - recalculates nutrition.perServing from the ingredients
 *     (scripts/lib/recipeNutritionEstimate.mjs, as label-recipes does) and
 *     `kcal`; the serving weight and portion text follow the new batch
 *   - bumps the pack's minor version so installed copies update
 *
 * Labels and the standard salt figure are left to their own scripts:
 *   npm run label-recipes -- --recipe fr-27 --write
 *   node scripts/build_salt_levels.mjs --write
 * Re-running is harmless: a soup that already has the beans is left alone.
 */
import fs from 'node:fs'
import { estimateRecipe } from './lib/recipeNutritionEstimate.mjs'
import { perServingFromTotals } from './lib/recipeLabels.mjs'

const PACK = 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json'
const ID = 'fr-27'
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === ID)
if (!r) throw new Error(`${ID} not found`)
if (r.ingredients.some(i => i.ingredient === 'white-beans-canned')) {
  console.log(`${ID} already has the beans; nothing to do (pack ${pack.version})`)
  process.exit(0)
}

const ROWS = {
  en: { name: 'White beans (cannellini), canned', note: 'drained (1 can, 400 g)' },
  no: { name: 'Hvite bønner (cannellini), hermetiske', note: 'avrent (1 boks, 400 g)' },
  sv: { name: 'Vita bönor (cannellini) på burk', note: 'avrunna (1 burk, 400 g)' },
}
const STEP = {
  en: {
    from: 'Check the carrots and simmer for another 10 minutes or so until cooked through and tender.',
    to: 'Drain the beans and add them to the soup. Check the carrots and simmer for another 10 minutes or so, until the carrots are cooked through and tender and the beans are hot.',
  },
  no: {
    from: 'Sjekk gulrøttene og la det småkoke i 10 minutter til, eller til de er møre og gjennomkokte.',
    to: 'Hell av bønnene og ha dem i suppen. Sjekk gulrøttene og la det småkoke i 10 minutter til, eller til gulrøttene er møre og gjennomkokte og bønnene er varme.',
  },
  sv: {
    from: 'Kontrollera morötterna och låt det sjuda i 10 minuter till, eller tills de är mjuka och gjennomkokte.',
    to: 'Låt bönorna rinna av och lägg dem i soppan. Kontrollera morötterna och låt det sjuda i 10 minuter till, eller tills morötterna är mjuka och genomkokta och bönorna är varma.',
  },
}

const lists = { en: r.ingredients, no: r.translations.no.ingredients, sv: r.translations.sv.ingredients }
const stepLists = { en: r.steps, no: r.translations.no.steps, sv: r.translations.sv.steps }
const weightBefore = estimateRecipe(r).weight
for (const lang of ['en', 'no', 'sv']) {
  const rows = lists[lang]
  const at = rows.findIndex(i => i.ingredient === 'canned-tomatoes')
  if (at < 0) throw new Error(`${lang}: no canned tomatoes row to put the beans after`)
  rows.splice(at + 1, 0, { quantity: 240, unit: 'g', ingredient: 'white-beans-canned', ...ROWS[lang] })
  const steps = stepLists[lang]
  const s = steps.indexOf(STEP[lang].from)
  if (s < 0) throw new Error(`${lang}: the carrot step has changed; edit by hand`)
  steps[s] = STEP[lang].to
}

// Nutrition from the ingredients; cholesterol (none, plant-based) and the
// standard-salt figure stay where they are.
const before = { ...r.nutrition.perServing }
const est = estimateRecipe(r)
if (est.problems.length) throw new Error(`estimate incomplete: ${est.problems.join('; ')}`)
Object.assign(r.nutrition.perServing, perServingFromTotals(est.totals, r.servings))
r.kcal = Math.round(r.nutrition.perServing.calories)

// The bowl grows by the beans' share of the batch (to the nearest 10 g).
const serving = Math.round(r.servingWeightGrams * est.weight / weightBefore / 10) * 10
r.servingWeightGrams = serving
r.portion = `1 bowl (~${serving} g)`
r.translations.no.portion = `1 bolle (~${serving} g)`
r.translations.sv.portion = `1 skål (~${serving} g)`

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
const from = pack.version
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`${ID} "${r.title}": + 240 g white beans (canned, drained); serving ${serving} g`)
for (const [k, v] of Object.entries(r.nutrition.perServing)) console.log(`  ${k.padEnd(14)} ${String(before[k]).padStart(6)} -> ${v}`)
console.log(`pack ${from} -> ${pack.version}`)

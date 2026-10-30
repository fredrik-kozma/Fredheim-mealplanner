#!/usr/bin/env node
/*
 * One-off (2026-10-30), Fredrik's two requests:
 *
 * 1. Looser base porridges. The oat and quinoa porridges (stovetop and Instant
 *    Pot) get 25% more water; the last step says how to loosen them further.
 *    Water adds no nutrition, so the panels stay; serving weight and portion
 *    text follow, rounded to 10 g like the rest of the base porridges (the
 *    stovetop ones lose about 10 g a bowl to steam).
 *
 * 2. Lower salt in the three recipes over 900 mg sodium a serving, which were
 *    too salty to offer a Standard level. Mashed Potatoes also drops the
 *    uncounted "salted water" from its method. The crust's biggest sodium source is
 *    its baking soda (616 of 1019 mg), so salt alone could not bring it down:
 *    3 tsp → 1 tsp, still a full dose for 275 g of flour and oats.
 *    Sodium takes the ingredient calculation
 *    (scripts/data/food-composition-core.json); salt and soda carry nothing
 *    else, so the rest of the panel stays. Standard amounts come from
 *    build_salt_levels.mjs, labels from label-recipes.
 *
 * Bumps the reversal pack's version, which build_salt_levels.mjs won't (sweet
 * porridge has no salt level); that script bumps the Fredheim pack.
 *
 * Throws if a row isn't what this changes (already applied?).
 * Usage: node scripts/fix_porridge_liquid_and_salty_sides.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipe } from './lib/recipeNutritionEstimate.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKS = path.join(ROOT, 'recipe-packs-template/packs')
const FREDHEIM = path.join(PACKS, 'fredheim-recipes-with-pictures.json')
const REVERSAL = path.join(PACKS, 'fredheim-reversal-protocol.json')
const dry = process.argv.includes('--dry')

const rowsOf = (r, l) => (l === 'en' ? r.ingredients : r.translations[l].ingredients)
const stepsOf = (r, l) => (l === 'en' ? r.steps : r.translations[l].steps)
const LANGS = ['en', 'no', 'sv']

function setRow(r, id, from, to, unit) {
  for (const l of LANGS) {
    const row = rowsOf(r, l).find(x => x.ingredient === id)
    if (!row || row.quantity !== from) throw new Error(`${r.id} ${l}: ${id} is ${row?.quantity}, expected ${from}`)
    row.quantity = to
    if (unit) row.unit = unit
  }
}

function setPortionWeight(r, from, to) {
  if (r.servingWeightGrams !== from) throw new Error(`${r.id}: serving ${r.servingWeightGrams} g, expected ${from}`)
  r.servingWeightGrams = to
  for (const holder of [r, r.translations.no, r.translations.sv]) {
    if (!holder.portion.includes(`~${from} g`)) throw new Error(`${r.id}: portion "${holder.portion}"`)
    holder.portion = holder.portion.replace(`~${from} g`, `~${to} g`)
  }
}

// ── 1. porridge ─────────────────────────────────────────────────────────────
const STOVE = {
  en: ' It thickens as it stands: stir in a splash of hot water if you want it looser.',
  no: ' Den tykner mens den står: rør inn en skvett varmt vann hvis du vil ha den løsere.',
  sv: ' Den tjocknar medan den står: rör ner en skvätt varmt vatten om du vill ha den lösare.',
}
const POT = {
  en: ' Stir in a splash of hot water if you want it looser.',
  no: ' Rør inn en skvett varmt vann hvis du vil ha den løsere.',
  sv: ' Rör ner en skvätt varmt vatten om du vill ha den lösare.',
}
// id: [water ml from, to], [serving g from, to], last-step sentence
const PORRIDGE = {
  'orn-49': [[600, 750], [200, 240], STOVE],
  'orn-50': [[480, 600], [180, 210], POT],
  'orn-53': [[720, 900], [230, 280], STOVE],
  'orn-54': [[600, 750], [210, 250], POT],
}

const reversal = JSON.parse(fs.readFileSync(REVERSAL, 'utf8'))
for (const [id, [water, weight, sentence]] of Object.entries(PORRIDGE)) {
  const r = reversal.recipes.find(x => x.id === id)
  setRow(r, 'water', ...water)
  setPortionWeight(r, ...weight)
  for (const l of LANGS) {
    const steps = stepsOf(r, l)
    steps[steps.length - 1] += sentence[l]
  }
  console.log(id, r.title, `water ${water[0]} → ${water[1]} ml`, `${r.servingWeightGrams} g`, `"${r.portion}"`)
}
const [a, b] = reversal.version.split('.').map(Number)
reversal.version = `${a}.${b + 1}.0`

// ── 2. salt ─────────────────────────────────────────────────────────────────
// id: rows [ingredient, from, to, unit?]
const SALT = {
  'fr-104': [['herb-salt', 2, 0.25, 'tsp']],
  'fr-113': [['salt', 1, 0.25], ['baking-soda', 3, 1]],
  'seasoned-baked-potatoes': [['salt', 2, 0.25]],
}
const UNSALTED_WATER = {
  en: ['boil them in plenty of salted water', 'boil them in plenty of water'],
  no: ['i rikelig med saltet vann', 'i rikelig med vann'],
  sv: ['i rikligt med saltat vatten', 'i rikligt med vatten'],
}

const fredheim = JSON.parse(fs.readFileSync(FREDHEIM, 'utf8'))
for (const [id, edits] of Object.entries(SALT)) {
  const r = fredheim.recipes.find(x => x.id === id)
  const before = estimateRecipe(r)
  const oldNa = r.nutrition.perServing.sodium
  for (const [ing, from, to, unit] of edits) setRow(r, ing, from, to, unit)
  const after = estimateRecipe(r)
  if (after.problems.length) throw new Error(`${id}: ${after.problems.join('; ')}`)
  r.nutrition.perServing.sodium = Math.round(after.totals.sodium / r.servings)
  // The rows are the only change: serving weight moves by what came out.
  const weight = r.servingWeightGrams
  setPortionWeight(r, weight, Math.round(weight - (before.weight - after.weight) / r.servings))
  if (id === 'fr-104') {
    for (const l of LANGS) {
      const [from, to] = UNSALTED_WATER[l]
      const steps = stepsOf(r, l)
      if (!steps[0].includes(from)) throw new Error(`fr-104 ${l}: step 1 "${steps[0]}"`)
      steps[0] = steps[0].replace(from, to)
    }
  }
  console.log(id, r.title, `sodium ${oldNa} → ${r.nutrition.perServing.sodium} mg`, `${r.servingWeightGrams} g`, `"${r.portion}"`)
}

if (!dry) {
  fs.writeFileSync(REVERSAL, JSON.stringify(reversal, null, 2) + '\n', 'utf8')
  fs.writeFileSync(FREDHEIM, JSON.stringify(fredheim, null, 2) + '\n', 'utf8')
}

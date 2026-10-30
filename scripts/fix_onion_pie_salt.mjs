#!/usr/bin/env node
/*
 * One-off (2026-10-30), Fredrik's request: a full Onion Pie serving (crust +
 * filling + cheese sauce, one portion of each) came to 946 mg sodium on Low
 * salt. The crust was already brought down, so this takes the filling and the
 * sauce to about 580 mg in all. The cheese sauce is only used in this pie.
 *
 *   Filling: bouillon 1 tbsp → 1 tsp (2400 → 800 mg in the batch). Flavour
 *   back with nutritional yeast, and a row for the dried thyme its method
 *   always called for.
 *   Sauce: salt ½ → ¼ tsp. Its Standard amount comes from build_salt_levels.mjs.
 *
 * Every per-serving value moves by what the changed rows add or remove:
 * core fields from scripts/data/food-composition-core.json, the rest from
 * scripts/lib/micronutrients.mjs. Labels come from label-recipes.
 *
 * Throws if a row isn't what this changes (already applied?).
 * Usage: node scripts/fix_onion_pie_salt.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rowGrams, food, FIELDS, PACK_KEY } from './lib/recipeNutritionEstimate.mjs'
import { COLS, microPer100 } from './lib/micronutrients.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const DICT = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/ingredientDictionary.json'), 'utf8'))
const dry = process.argv.includes('--dry')
const LANGS = ['en', 'no', 'sv']
const rowsOf = (r, l) => (l === 'en' ? r.ingredients : r.translations[l].ingredients)
const stepsOf = (r, l) => (l === 'en' ? r.steps : r.translations[l].steps)
const nameOf = (id, l) => DICT.entries.find(e => e.id === id).names[l]

function round(x) {
  if (!x) return 0
  if (Math.abs(x) >= 10) return Math.round(x)
  if (Math.abs(x) >= 1) return Math.round(x * 10) / 10
  return Math.round(x * 100) / 100
}

// What `row` puts in a batch, by pack nutrition key.
function rowValues(row) {
  const { grams } = rowGrams(row)
  const out = {}
  const f = food(row.ingredient)
  FIELDS.forEach((k, i) => { out[PACK_KEY[k]] = f.v[i] * grams / 100 })
  const m = microPer100(row)
  for (const k of COLS) if (!(k in out)) out[k] = m[k] * grams / 100
  return out
}

function applyDelta(r, before, after) {
  const ps = r.nutrition.perServing
  const keys = new Set([...Object.keys(rowValues(before[0] || after[0]))])
  for (const k of keys) {
    if (ps[k] == null) continue
    let d = 0
    for (const row of after) d += rowValues(row)[k]
    for (const row of before) d -= rowValues(row)[k]
    const next = Math.max(0, ps[k] + d / r.servings)
    ps[k] = k === 'sodium' || k === 'potassium' ? Math.round(next) : round(next)
  }
  r.kcal = Math.round(ps.calories)
}

function setQuantity(r, id, from, to) {
  for (const l of LANGS) {
    const row = rowsOf(r, l).find(x => x.ingredient === id)
    if (!row || row.quantity !== from.quantity) throw new Error(`${r.id} ${l}: ${id} is ${row?.quantity}, expected ${from.quantity}`)
    row.quantity = to.quantity
    if (l === 'en') row.unit = to.unit
    else if (to.unit !== from.unit) row.unit = l === 'no' ? { tsp: 'ts', tbsp: 'ss' }[to.unit] : to.unit
  }
}

const pack = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const byId = id => pack.recipes.find(r => r.id === id)

// ── Filling ─────────────────────────────────────────────────────────────────
const filling = byId('fr-114')
const fillingNa = filling.nutrition.perServing.sodium
const oldBouillon = { ingredient: 'vegetable-bouillon', quantity: 1, unit: 'tbsp' }
const newBouillon = { ingredient: 'vegetable-bouillon', quantity: 1, unit: 'tsp' }
const thyme = { ingredient: 'thyme-dried', quantity: 1, unit: 'tsp' }
const yeast = { ingredient: 'nutritional-yeast', quantity: 2, unit: 'tbsp' }
setQuantity(filling, 'vegetable-bouillon', oldBouillon, newBouillon)
// New rows go with the seasoning, before the cashews.
const at = filling.ingredients.findIndex(x => x.ingredient === 'cashews')
for (const l of LANGS) {
  const unit = u => (l === 'no' ? { tsp: 'ts', tbsp: 'ss' }[u] : u)
  rowsOf(filling, l).splice(at, 0,
    { quantity: thyme.quantity, unit: unit(thyme.unit), ingredient: thyme.ingredient, name: nameOf(thyme.ingredient, l) },
    { quantity: yeast.quantity, unit: unit(yeast.unit), ingredient: yeast.ingredient, name: nameOf(yeast.ingredient, l) })
}
applyDelta(filling, [oldBouillon], [newBouillon, thyme, yeast])

const YEAST_STEP = {
  en: ['Add cashew cream and stir', 'Add cashew cream and the nutritional yeast and stir'],
  no: ['Tilsett cashewkremen og rør', 'Tilsett cashewkremen og næringsgjæren og rør'],
  sv: ['Tillsätt cashewkrämen och rör', 'Tillsätt cashewkrämen och näringsjästen och rör'],
}
for (const l of LANGS) {
  const [from, to] = YEAST_STEP[l]
  const steps = stepsOf(filling, l)
  const i = steps.findIndex(s => s.includes(from))
  if (i < 0) throw new Error(`fr-114 ${l}: no step "${from}"`)
  steps[i] = steps[i].replace(from, to)
}

// ── Cheese sauce ────────────────────────────────────────────────────────────
const sauce = byId('fr-38')
const sauceNa = sauce.nutrition.perServing.sodium
const oldSalt = { ingredient: 'salt', quantity: 0.5, unit: 'tsp' }
const newSalt = { ingredient: 'salt', quantity: 0.25, unit: 'tsp' }
setQuantity(sauce, 'salt', oldSalt, newSalt)
applyDelta(sauce, [oldSalt], [newSalt])

const crustNa = byId('fr-113').nutrition.perServing.sodium
const fNa = filling.nutrition.perServing.sodium
const sNa = sauce.nutrition.perServing.sodium
console.log(`filling ${fillingNa} → ${fNa} mg, sauce ${sauceNa} → ${sNa} mg, crust ${crustNa} mg`)
console.log(`full serving (low): ${crustNa + fillingNa + sauceNa} → ${crustNa + fNa + sNa} mg`)

// The pack version is bumped by build_salt_levels.mjs, which runs next.
if (!dry) fs.writeFileSync(FILE, JSON.stringify(pack, null, 2) + '\n', 'utf8')

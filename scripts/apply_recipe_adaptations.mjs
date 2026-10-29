// Apply the doctor-approved adaptations from
// scripts/data/recipe-adaptation-proposals.json (built by
// scripts/build_recipe_adaptation_proposals.mjs; canned beans and broth stay
// as written) to the two built-in packs. Decisions of 2026-10-29:
//   approved: the 13 ids in APPROVED below
//   dal-stew: salt 0.5 tsp instead of the proposed 0.25 tsp
//   skipped:  orn-30, orn-31 (Ciorba) - left exactly as they are
//
// Per recipe:
//   ingredients     - the proposal's en/no/sv rows (dictionary ids and names)
//   steps           - each proposed step change, after checking the current
//                     text is still the one the proposal replaced
//   servings, portion (en + translations.{no,sv}.portion) where proposed
//   servingWeightGrams - same cooked-to-raw ratio as the stored portion
//   nutrition       - recalculated from the new rows
//                     (scripts/data/food-composition-core.json): the 10 core
//                     fields + cholesterol 0; the old vitamins/minerals were
//                     for the old ingredients and are dropped. kcal = round.
// Labels are left to `npm run label-recipes -- --recipe <ids> --write`.
// Then bumps each pack's minor version so installed copies update.
//
// Usage: node scripts/apply_recipe_adaptations.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipe, FIELDS, PACK_KEY, round } from './lib/recipeNutritionEstimate.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROPOSALS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/recipe-adaptation-proposals.json'), 'utf8'))
const PACK_FILES = {
  'fredheim-recepies-with-pictures': 'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol': 'fredheim-reversal-protocol.json',
}
const APPROVED = ['dal-stew', 'stuffed-paprika-with-tofu', 'tofu-form', 'kidney-bean-stew', 'lentil-lap-stew',
  'sweet-yellow-pea-soup', 'fr-23', 'oat-burger', 'black-bean-stew', 'creamy-red-lentil-stew', 'red-lentil-soup',
  'red-beet-burger', 'orn-20']
// Doctor's change on top of a proposal: { id: { ingredient: quantity } }
const OVERRIDES = { 'dal-stew': { salt: 0.5 } }
const LANGS = ['en', 'no', 'sv']
const LOCAL = { tsp: { no: 'ts', sv: 'tsk' }, tbsp: { no: 'ss', sv: 'msk' }, clove: { no: 'fedd', sv: 'klyfta' } }
const CANON = { ts: 'tsp', tsk: 'tsp', ss: 'tbsp', msk: 'tbsp', fedd: 'clove', klyfta: 'clove' }
const dry = process.argv.includes('--dry')

const listOf = (r, lang) => (lang === 'en' ? r.ingredients : r.translations[lang].ingredients)
const stepsOf = (r, lang) => (lang === 'en' ? r.steps : r.translations[lang].steps)
// Insert `key` right after `after` (or at the end), keeping the rest in place.
function setAfter(r, key, value, after) {
  if (key in r) { r[key] = value; return r }
  const out = {}
  for (const [k, v] of Object.entries(r)) {
    out[k] = v
    if (k === after) out[key] = value
  }
  if (!(key in out)) out[key] = value
  return out
}
function perServing(r, servings) {
  const est = estimateRecipe(r)
  if (est.problems.length) throw new Error(`${r.id}: ${est.problems.join('; ')}`)
  const per = {}
  for (const f of FIELDS) per[PACK_KEY[f]] = round(est.totals[f] / servings, f)
  return { per, weight: est.weight }
}

const byPack = new Map()
for (const [id, file] of Object.entries(PACK_FILES)) {
  const full = path.join(ROOT, 'recipe-packs-template/packs', file)
  const pack = JSON.parse(fs.readFileSync(full, 'utf8'))
  if (pack.id !== id) throw new Error(`${file}: unexpected pack id ${pack.id}`)
  if (pack.version !== PROPOSALS.packVersions[id]) {
    throw new Error(`${id} is at ${pack.version}, proposals were built from ${PROPOSALS.packVersions[id]} (already applied?)`)
  }
  byPack.set(id, { file: full, pack })
}

const report = []
for (const id of APPROVED) {
  const p = PROPOSALS.recipes.find(x => x.id === id)
  if (!p) throw new Error(`${id}: no proposal`)
  const entry = byPack.get(p.pack)
  const idx = entry.pack.recipes.findIndex(r => r.id === id)
  if (idx < 0) throw new Error(`${p.pack}/${id}: not in pack`)
  const original = entry.pack.recipes[idx]
  let r = structuredClone(original)
  if (r.servings !== p.current.servings) throw new Error(`${id}: servings ${r.servings}, proposal expected ${p.current.servings}`)

  // ── ingredients ──
  for (const lang of LANGS) {
    const rows = structuredClone(p.proposed.ingredients[lang])
    // Spoon/clove units spelled the way this recipe's list already spells
    // them (the proposal writes added rows as ts/ss/fedd, tsk/msk/klyfta).
    if (lang !== 'en') {
      const used = new Set(listOf(original, lang).map(i => i.unit))
      for (const row of rows) {
        const canon = CANON[row.unit] || row.unit
        const local = LOCAL[canon]?.[lang]
        if (local) row.unit = used.has(local) && !used.has(canon) ? local : used.has(canon) || !used.has(local) ? canon : local
      }
    }
    for (const [ing, quantity] of Object.entries(OVERRIDES[id] || {})) {
      const row = rows.find(x => x.ingredient === ing)
      if (!row) throw new Error(`${id}: no ${ing} row to override`)
      row.quantity = quantity
    }
    if (lang === 'en') r.ingredients = rows
    else r.translations[lang].ingredients = rows
  }
  const sig = lang => JSON.stringify(listOf(r, lang).map(i => [i.ingredient, i.quantity, CANON[i.unit] || (i.unit === 'stk' || i.unit === 'st' ? 'pcs' : i.unit)]))
  if (sig('no') !== sig('en') || sig('sv') !== sig('en')) throw new Error(`${id}: en/no/sv rows differ`)

  // ── steps ──
  for (const s of p.proposed.stepChanges) {
    for (const lang of LANGS) {
      const steps = stepsOf(r, lang)
      if (steps[s.index] !== s.before[lang]) throw new Error(`${id}: step ${s.index} (${lang}) is not the text the proposal replaced`)
      steps[s.index] = s.after[lang]
    }
  }

  // ── servings + portion ──
  r.servings = p.proposed.servings
  if (p.proposed.portion) {
    r = setAfter(r, 'portion', p.proposed.portion.en, 'servings')
    for (const lang of ['no', 'sv']) r.translations[lang].portion = p.proposed.portion[lang]
  }

  // ── nutrition ──
  const { per, weight } = perServing(r, r.servings)
  const rawBefore = estimateRecipe(original).weight / original.servings
  const servingWeightGrams = Math.round(original.servingWeightGrams * (weight / r.servings) / rawBefore)
  if (!OVERRIDES[id]) {
    for (const [k, v] of Object.entries(p.proposed.perServing)) {
      if (per[k] !== v) throw new Error(`${id}: ${k} ${per[k]} ≠ proposal's ${v}`)
    }
    if (servingWeightGrams !== p.proposed.servingWeightGrams) throw new Error(`${id}: serving ${servingWeightGrams} g ≠ proposal's ${p.proposed.servingWeightGrams}`)
  }
  r.servingWeightGrams = servingWeightGrams
  r.nutrition = { ...r.nutrition, perServing: { ...per, cholesterol: 0 } }
  r.kcal = Math.round(per.calories)

  entry.pack.recipes[idx] = r
  report.push({ id, servings: r.servings, servingWeightGrams, kcal: r.kcal, sodium: per.sodium, potassium: per.potassium })
}

const versions = {}
for (const [id, entry] of byPack) {
  const [maj, min] = entry.pack.version.split('.').map(Number)
  const next = `${maj}.${min + 1}.0`
  versions[id] = `${entry.pack.version} -> ${next}`
  entry.pack.version = next
  if (!dry) fs.writeFileSync(entry.file, JSON.stringify(entry.pack, null, 2) + '\n', 'utf8')
}

console.table(report)
console.log(JSON.stringify({ applied: report.length, versions }, null, 1))
if (dry) console.log('(dry run, nothing written)')

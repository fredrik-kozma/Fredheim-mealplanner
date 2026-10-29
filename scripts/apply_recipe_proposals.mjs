// Apply scripts/data/recipe-completion-proposals.json (built by
// scripts/build_recipe_proposals.mjs, with the doctor's decisions of
// 2026-10-28) to the three built-in packs. Deterministic: the same proposals
// and packs always give the same output, and it refuses to run against packs
// at any other version than the proposals were built from.
//
// Per recipe:
//   ingredient fix  - drop a clearly duplicated row in en/no/sv (lasagna salt)
//   servings        - new count + `portion` (en) / translations.{no,sv}.portion;
//                     ingredient amounts are untouched, so a whole batch still
//                     buys the same food and the shopping list (portions /
//                     servings × amount) stays correct
//   servingWeightGrams
//   nutrition       - recalculated: the 10 recomputed core fields (+ cholesterol
//                     0, all plant-based); the old vitamins/minerals came from
//                     the same broken panel and are dropped.
//                     corrected / rescaled: core fields from the proposal, every
//                     other stored field scaled by old/new servings.
//                     kcal = round(calories)
//   prepTime/cookTime where missing, mealTypes, and the good-for label tags
//   (other tags such as "fredheim" kept, in their order)
// Then bumps each pack's minor version so installed copies update.
//
// Usage: node scripts/apply_recipe_proposals.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROPOSALS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/recipe-completion-proposals.json'), 'utf8'))
const PACK_FILES = {
  'fredheim-recepies-with-pictures': 'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol': 'fredheim-reversal-protocol.json',
  'fredheim-fmd-5day': 'fredheim-fmd-5day.json',
}
const LABELS = ['weight-loss', 'blood-pressure-friendly', 'diabetes-friendly', 'heart-healthy', 'gluten-free',
  'nut-free', 'soy-free', 'oil-free', 'no-added-sugar', 'quick', 'batch-friendly', 'kid-friendly']
const CORE = ['calories', 'protein', 'totalFat', 'saturatedFat', 'totalCarbs', 'fiber', 'totalSugars', 'addedSugar', 'sodium', 'potassium']
// Key order of the existing full panels, so rewritten panels read the same.
const PANEL_ORDER = ['calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat',
  'omega3', 'cholesterol', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber', 'calcium', 'potassium', 'copper', 'iron',
  'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc', 'sodium', 'vitaminA', 'vitaminB6', 'vitaminB12',
  'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'folate', 'thiamin', 'riboflavin', 'niacin', 'choline']
const dry = process.argv.includes('--dry')

const sig3 = v => {
  if (v === 0 || !Number.isFinite(v)) return v
  const p = 10 ** (2 - Math.floor(Math.log10(Math.abs(v))))
  return Math.round(v * p) / p
}
const ordered = obj => {
  const out = {}
  for (const k of PANEL_ORDER) if (k in obj) out[k] = obj[k]
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k]
  return out
}
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
const sameRow = (a, b) => a && b && a.ingredient === b.ingredient && a.quantity === b.quantity && a.unit === b.unit && !a.note && !b.note
const ingredientSignature = r => JSON.stringify((r.ingredients || []).map(i => [i.ingredient, i.quantity, i.unit]))

const counts = {
  ingredientFixes: 0, servings: 0, portions: 0, servingWeight: 0,
  nutrition: { recalculated: 0, corrected: 0, 'rescaled+corrected': 0, rescaled: 0 }, microsDropped: 0,
  time: 0, mealTypes: 0, labelsChanged: 0,
}
const byPack = new Map()
for (const [id, file] of Object.entries(PACK_FILES)) {
  const full = path.join(ROOT, 'recipe-packs-template/packs', file)
  const pack = JSON.parse(fs.readFileSync(full, 'utf8'))
  if (pack.id !== id) throw new Error(`${file}: unexpected pack id ${pack.id}`)
  if (pack.version !== PROPOSALS.packVersions[id]) {
    throw new Error(`${id} is at ${pack.version}, proposals were built from ${PROPOSALS.packVersions[id]} (already applied? rebuild the proposals first)`)
  }
  byPack.set(id, { file: full, pack, before: new Map(pack.recipes.map(r => [r.id, ingredientSignature(r)])) })
}

for (const p of PROPOSALS.recipes) {
  const entry = byPack.get(p.packId)
  const idx = entry.pack.recipes.findIndex(r => r.id === p.id)
  if (idx < 0) throw new Error(`${p.packId}/${p.id}: not in pack`)
  let r = entry.pack.recipes[idx]

  // ── ingredient fix ──
  if (p.ingredientFix) {
    const { removeIndex, duplicateOf } = p.ingredientFix
    const lists = [r.ingredients, r.translations?.no?.ingredients, r.translations?.sv?.ingredients]
    for (const list of lists) {
      if (!sameRow(list?.[removeIndex], list?.[duplicateOf])) throw new Error(`${p.id}: row ${removeIndex} is not a duplicate of ${duplicateOf}`)
    }
    for (const list of lists) list.splice(removeIndex, 1)
    counts.ingredientFixes++
  }

  // ── servings + portion ──
  const oldServings = r.servings
  if (p.servings) {
    if (p.servings.current !== oldServings) throw new Error(`${p.id}: servings ${oldServings}, proposal expected ${p.servings.current}`)
    if (p.servings.proposed !== oldServings) { r.servings = p.servings.proposed; counts.servings++ }
    r = setAfter(r, 'portion', p.servings.portion.en, 'servings')
    for (const lang of ['no', 'sv']) if (r.translations?.[lang]) r.translations[lang].portion = p.servings.portion[lang]
    counts.portions++
  }
  const newServings = r.servings

  // ── nutrition ──
  const n = p.nutrition
  if (n.servingWeightGrams.proposed != null && n.servingWeightGrams.proposed !== r.servingWeightGrams) {
    r = setAfter(r, 'servingWeightGrams', n.servingWeightGrams.proposed, 'kcal')
    counts.servingWeight++
  }
  if (n.proposed) {
    const stored = r.nutrition?.perServing || null
    if (n.current && stored && stored.calories !== n.current.calories) throw new Error(`${p.id}: stored kcal ${stored.calories} ≠ proposal's ${n.current.calories}`)
    let panel
    if (n.change === 'recalculated') {
      panel = {}
      for (const k of CORE) if (n.proposed[k] != null) panel[k] = n.proposed[k]
      panel.cholesterol = 0
      if (stored && Object.keys(stored).some(k => !CORE.includes(k) && k !== 'cholesterol')) counts.microsDropped++
    } else {
      if (!stored) throw new Error(`${p.id}: ${n.change} without a stored panel`)
      const ratio = oldServings / newServings
      panel = {}
      for (const [k, v] of Object.entries(stored)) {
        if (CORE.includes(k) && n.proposed[k] != null) panel[k] = n.proposed[k]
        else panel[k] = typeof v === 'number' ? sig3(v * ratio) : v
      }
    }
    r.nutrition = { ...(r.nutrition && r.nutrition.perServing ? r.nutrition : {}), perServing: ordered(panel) }
    r = setAfter(r, 'kcal', Math.round(panel.calories), 'tags')
    counts.nutrition[n.change]++
  }

  // ── time ──
  if (p.time.proposed) {
    r.prepTime = p.time.proposed.prepTime
    r.cookTime = p.time.proposed.cookTime
    counts.time++
  }

  // ── meal types + labels ──
  const existing = (r.tags || []).filter(t => LABELS.includes(t))
  if (JSON.stringify([...existing].sort()) !== JSON.stringify([...p.labels.existing].sort())) throw new Error(`${p.id}: label tags changed since the proposals were built`)
  const tags = [...(r.tags || []).filter(t => !LABELS.includes(t)), ...LABELS.filter(l => p.labels.proposed.includes(l))]
  if (JSON.stringify(tags) !== JSON.stringify(r.tags || [])) counts.labelsChanged++
  r.tags = tags
  r = setAfter(r, 'mealTypes', p.mealTypes.mealTypes, 'tags')
  counts.mealTypes++

  entry.pack.recipes[idx] = r
}

// Shopping-list safety: ingredient amounts per recipe must be unchanged,
// apart from the deliberate duplicate-row fix.
const fixed = new Set(PROPOSALS.recipes.filter(p => p.ingredientFix).map(p => p.id))
const versions = {}
for (const [id, entry] of byPack) {
  for (const r of entry.pack.recipes) {
    if (!fixed.has(r.id) && ingredientSignature(r) !== entry.before.get(r.id)) throw new Error(`${r.id}: ingredients changed`)
    if (!(r.servings >= 1)) throw new Error(`${r.id}: bad servings ${r.servings}`)
  }
  const [maj, min] = entry.pack.version.split('.').map(Number)
  const next = `${maj}.${min + 1}.0`
  versions[id] = `${entry.pack.version} -> ${next}`
  entry.pack.version = next
  if (!dry) fs.writeFileSync(entry.file, JSON.stringify(entry.pack, null, 2) + '\n', 'utf8')
}

console.log(JSON.stringify({ applied: PROPOSALS.recipes.length, counts, versions }, null, 1))
if (dry) console.log('(dry run, nothing written)')

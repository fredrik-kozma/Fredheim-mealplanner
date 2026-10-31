import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { estimateRecipe, PACK_KEY, round, rowGrams } from './lib/recipeNutritionEstimate.mjs'
import { COLS, microPer100 } from './lib/micronutrients.mjs'
import { analyzeRecipe, withLabels, LABELS } from './lib/recipeLabels.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_FILE = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK_FILE, 'utf8'))
const byId = new Map(pack.recipes.map(r => [r.id, r]))
const COMPOSITE = { 'white-cashew-sauce': 'fr-191', 'classic-hummus': 'classic-hummus', 'cashew-sour-cream': 'fr-33' }

function per100(row) {
  const cid = COMPOSITE[row.ingredient]
  if (cid) {
    const sub = byId.get(cid)
    if (!sub?.nutrition?.perServing || !sub.servingWeightGrams) throw new Error('bad composite ' + cid)
    const n = sub.nutrition.perServing
    const sw = sub.servingWeightGrams
    return Object.fromEntries(COLS.map(k => [k, (n[k] || 0) * 100 / sw]))
  }
  return microPer100(row)
}

function recompute(recipe) {
  const est = estimateRecipe({ ingredients: recipe.ingredients })
  if (est.problems.length) throw new Error(recipe.id + ': ' + est.problems.join('; '))
  const servings = recipe.servings
  const perServing = { ...(recipe.nutrition?.perServing || {}) }
  for (const [field, key] of Object.entries(PACK_KEY)) {
    perServing[key] = round(est.totals[field] / servings, field)
  }
  const totals = Object.fromEntries(COLS.map(k => [k, 0]))
  for (const row of recipe.ingredients) {
    const { grams } = rowGrams(row)
    if (!grams) continue
    const v = per100(row)
    for (const k of COLS) totals[k] += v[k] * grams / 100
  }
  for (const k of COLS) perServing[k] = round(totals[k] / servings, k)
  // macros from estimate win for the core panel (sodium/potassium too)
  for (const [field, key] of Object.entries(PACK_KEY)) {
    perServing[key] = round(est.totals[field] / servings, field)
  }
  const grams = Math.round(est.weight / servings)
  return { perServing, grams, kcal: Math.round(perServing.calories) }
}

for (const id of ['mushroom-stroganoff', 'moroccan-chickpea-tagine', 'chana-masala']) {
  const r = byId.get(id)
  const { perServing, grams, kcal } = recompute(r)
  r.nutrition = { ...(r.nutrition || {}), perServing }
  r.servingWeightGrams = grams
  r.kcal = kcal
  const fixPortion = (p) => (typeof p === 'string' ? p.replace(/~\d+\s*g/, `~${grams} g`) : p)
  r.portion = fixPortion(r.portion)
  if (r.translations?.no) r.translations.no.portion = fixPortion(r.translations.no.portion)
  if (r.translations?.sv) r.translations.sv.portion = fixPortion(r.translations.sv.portion)
  // refresh labels (heart-healthy etc. may shift slightly with fat)
  const a = analyzeRecipe(r, byId, { storedMealTypes: true })
  r.tags = withLabels(r.tags || [], a.proposed)
  const n = perServing
  console.log(`${id}: ${kcal} kcal, o3 ${n.omega3} o6 ${n.omega6} ratio ${(n.omega6 / n.omega3).toFixed(2)}:1, batch=${r.tags.includes('batch-friendly')}`)
}

// no version bump — already at 1.86.0
fs.writeFileSync(PACK_FILE, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('wrote pack', pack.version)

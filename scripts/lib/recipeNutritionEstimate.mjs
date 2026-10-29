// Independent per-recipe nutrition estimate from ingredient rows, using
// scripts/data/food-composition-core.json (per 100 g, keyed by dictionary id).
// Used by scripts/build_recipe_proposals.mjs. Read-only: never writes packs.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const TABLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/data/food-composition-core.json'), 'utf8'))
const DICT = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/ingredientDictionary.json'), 'utf8'))
const DICT_BY_ID = new Map(DICT.entries.map(e => [e.id, e]))

export const FIELDS = TABLE.fields
// Pack nutrition key for each table field.
export const PACK_KEY = {
  kcal: 'calories', protein: 'protein', fat: 'totalFat', satFat: 'saturatedFat', carbs: 'totalCarbs',
  fiber: 'fiber', sugars: 'totalSugars', added: 'addedSugar', sodium: 'sodium', potassium: 'potassium',
}
export function food(id) { return TABLE.foods[id] || null }

const ZEST = /zest|peel|skall|skal\b|skrell/i
const VOLUME_ML = { ml: 1, dl: 100, l: 1000, cup: 240 }

/** Grams for one ingredient row, or throws with a readable reason. */
export function rowGrams(row) {
  const q = row.quantity
  const unit = row.unit || ''
  if (q == null || unit === '') return { grams: 0, note: 'unquantified (to taste)' }
  const f = food(row.ingredient)
  if (!f) throw new Error(`no composition for ${row.ingredient}`)
  if (unit === 'g') return { grams: q }
  if (unit === 'kg') return { grams: q * 1000 }
  if (VOLUME_ML[unit]) {
    if (f.g?.[unit]) return { grams: q * f.g[unit] }
    const d = f.density ?? spoonDensity(row.ingredient)
    if (d == null) throw new Error(`no density for ${row.ingredient} in ${unit}`)
    return { grams: q * VOLUME_ML[unit] * d }
  }
  if (unit === 'tsp' || unit === 'tbsp') {
    const mult = unit === 'tbsp' ? 3 : 1
    if (f.g?.[unit]) return { grams: q * f.g[unit] }
    if (f.g?.tsp) return { grams: q * f.g.tsp * mult }
    const sg = DICT_BY_ID.get(row.ingredient)?.spoonGrams?.gPerTsp
    if (sg) return { grams: q * sg * mult }
    if (f.density) return { grams: q * 5 * mult * f.density }
    throw new Error(`no spoon weight for ${row.ingredient}`)
  }
  if (unit === 'pcs') {
    const zest = ZEST.test(row.note || '')
    const g = zest ? f.g?.pcsZest : f.g?.pcs
    if (g == null) throw new Error(`no piece weight for ${row.ingredient}`)
    return { grams: q * g, note: zest ? 'zest only' : undefined }
  }
  if (unit === 'clove') {
    if (!f.g?.clove) throw new Error(`no clove weight for ${row.ingredient}`)
    return { grams: q * f.g.clove }
  }
  throw new Error(`unit ${unit} not handled (${row.ingredient})`)
}

function spoonDensity(id) {
  const sg = DICT_BY_ID.get(id)?.spoonGrams?.gPerTsp
  return sg ? sg / 5 : null
}

// Sodium per 100 g depends on the product the row asks for. The note is the
// only place a recipe says "low-sodium broth" or "rinsed beans", so read it.
// mode 'regular' ignores the notes (a shopper grabbing the usual product).
const CANNED_LEGUMES = new Set(['black-beans-canned', 'chickpeas-canned', 'kidney-beans-canned', 'white-beans-canned'])
function sodiumPer100(row, f, mode) {
  const base = f.v[8]
  if (mode === 'regular') return base
  const note = (row.note || '').toLowerCase()
  if (CANNED_LEGUMES.has(row.ingredient)) {
    if (/no[- ]salt|unsalted|uten salt|osaltad|salt-free/.test(note)) return 10
    if (/rinse|skyll|skölj/.test(note)) return 150
    return base
  }
  if (row.ingredient === 'vegetable-broth') {
    if (/salt[- ]free|unsalted|or water|daily broth|homemade|hjemmelag|hemgjord/.test(note)) return 15
    if (/low[- ]sodium|reduced|lavnatrium|natriumfattig/.test(note)) return 100
    return base
  }
  if (/reduced[- ]sodium|low[- ]sodium/.test(note)) {
    if (row.ingredient === 'tamari' || row.ingredient === 'soy-sauce') return 3300
    if (row.ingredient === 'miso-paste') return 2500
  }
  return base
}

/** Whole-batch totals + raw batch weight for a recipe. */
export function estimateRecipe(recipe, { sodiumMode = 'asWritten' } = {}) {
  const totals = Object.fromEntries(FIELDS.map(k => [k, 0]))
  let weight = 0
  const rows = []
  const problems = []
  for (const row of recipe.ingredients || []) {
    let g
    try { g = rowGrams(row) } catch (e) { problems.push(e.message); continue }
    const f = food(row.ingredient)
    weight += g.grams
    if (f) {
      FIELDS.forEach((k, i) => {
        const per100 = k === 'sodium' ? sodiumPer100(row, f, sodiumMode) : f.v[i]
        totals[k] += per100 * g.grams / 100
      })
    }
    rows.push({ id: row.ingredient, grams: Math.round(g.grams * 10) / 10, kcal: f ? Math.round(f.v[0] * g.grams / 100) : 0 })
  }
  return { totals, weight, rows, problems }
}

export function round(v, field) {
  if (v == null) return null
  if (field === 'kcal' || field === 'sodium' || field === 'potassium') return Math.round(v)
  return Math.round(v * 10) / 10
}

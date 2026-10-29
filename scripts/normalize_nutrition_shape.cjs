/* Fredheim Kitchen: move the legacy flat nutrition into the shape the app reads.
 *
 * 171 recipes carried per-serving values as a flat `nutrition` object, plus
 * nutritionPer100g / totalWeight / servingWeight. NutritionPanel, the
 * nutrition tracker and the recipe-list nutrient sort only read
 * `nutrition.perServing` and `servingWeightGrams`, so none of those recipes
 * showed any nutrition. The 14 newer recipes and the Reversal and FMD packs
 * already use the right shape.
 *
 * Per recipe, without changing any number:
 *   nutrition          → nutrition.perServing (same object, same values)
 *   servingWeight      → servingWeightGrams
 *   kcal (0 in all 171) → Math.round(perServing.calories), like the others
 *   nutritionPer100g, totalWeight, servingWeight → removed, as
 *   fix_hirseknekk.cjs did. No app code reads them; the panel derives
 *   per 100 g from perServing / servingWeightGrams itself. The script
 *   refuses to drop nutritionPer100g if that derivation would disagree with
 *   the stored panel, so nothing is lost.
 *
 * Recipes already in the perServing shape are left exactly as they are, and
 * so is an all-zero placeholder panel (fr-53 Croutons).
 * Implausible values (whole batches stored as one serving, etc.) are NOT
 * corrected here; see scripts/data/recipe-completion-proposals.md.
 *
 * Usage: node scripts/normalize_nutrition_shape.cjs [--dry]
 */
const fs = require('fs')
const path = require('path')

const PACK = path.resolve(__dirname, '../recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const NEW_VERSION = '1.60.0'
const dry = process.argv.includes('--dry')

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
if (pack.id !== 'fredheim-recepies-with-pictures') throw new Error(`unexpected pack id ${pack.id}`)

// Is nutritionPer100g just perServing × 100 / servingWeight? Compare the
// energy and macro fields; allow for the 2–3 significant figures they were
// rounded to.
function per100gIsDerivable(r) {
  const p = r.nutritionPer100g
  if (!p) return true
  if (!(r.servingWeight > 0)) return false
  for (const k of ['calories', 'protein', 'totalFat', 'totalCarbs', 'fiber']) {
    const a = p[k]
    const b = r.nutrition[k]
    if (a == null || b == null) continue
    const derived = b * 100 / r.servingWeight
    if (Math.abs(derived - a) > Math.max(1, a * 0.05)) return { k, stored: a, derived: Math.round(derived * 10) / 10 }
  }
  return true
}

const fixed = []
const keptPer100g = []
const placeholders = []
let alreadyOk = 0
let none = 0

for (const r of pack.recipes) {
  const n = r.nutrition
  if (!n) { none++; continue }
  if (n.perServing) { alreadyOk++; continue }
  if (typeof n.calories !== 'number') throw new Error(`${r.id}: flat nutrition without calories`)
  // An all-zero panel is a placeholder, not data: moving it would make the
  // app show "0 kcal". Leave it for the proposals file to fill.
  if (Object.values(n).every(v => v === 0)) { placeholders.push(r.id); continue }
  if (r.servingWeightGrams != null) throw new Error(`${r.id}: already has servingWeightGrams`)

  const check = per100gIsDerivable(r)
  r.nutrition = { perServing: n }
  r.kcal = Math.round(n.calories)
  if (r.servingWeight > 0) r.servingWeightGrams = r.servingWeight

  if (check === true) {
    delete r.nutritionPer100g
  } else {
    keptPer100g.push({ id: r.id, ...check })
  }
  delete r.totalWeight
  delete r.servingWeight
  fixed.push(r.id)
}

if (keptPer100g.length) {
  console.log('nutritionPer100g kept (does not match perServing / servingWeightGrams):')
  for (const k of keptPer100g) console.log('  ', JSON.stringify(k))
}

// Same key order as the newer recipes: servingWeightGrams sits after kcal.
const ORDER = ['id', 'title', 'category', 'servings', 'prepTime', 'cookTime', 'imageUrl', 'description',
  'tags', 'kcal', 'servingWeightGrams', 'ingredients', 'steps', 'translations', 'nutrition']
for (let i = 0; i < pack.recipes.length; i++) {
  const r = pack.recipes[i]
  if (!fixed.includes(r.id)) continue
  const out = {}
  for (const k of ORDER) if (k in r) out[k] = r[k]
  for (const k of Object.keys(r)) if (!(k in out)) out[k] = r[k]
  pack.recipes[i] = out
}

const before = pack.version
pack.version = NEW_VERSION

console.log(`converted ${fixed.length}, already perServing ${alreadyOk}, no nutrition ${none}, all-zero placeholder left alone: ${placeholders.join(', ') || 'none'}`)
console.log(`pack ${before} -> ${pack.version}${dry ? ' (dry run, nothing written)' : ''}`)
if (!dry) fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

/**
 * Live recipe nutrition engine (browser-safe ESM).
 *
 * Port of scripts/lib/recipeNutritionEstimate.mjs + micronutrient merge, so the
 * app can compute perServing from ingredient rows (user recipes and packs).
 * Pure: no fs, no node APIs. Pass the nutrition DB (or let the lazy loader fetch it).
 *
 * One source of truth: scripts can later import this same module for estimates.
 */
import { getYieldFactor, FULLY_SOLUBLE_IDS } from './nutritionYield.js'

/** @typedef {'low'|'standard'} SaltLevel */

const VOLUME_ML = { ml: 1, dl: 100, l: 1000, cup: 240 }
const ZEST_RE = /zest|peel|skall|skal\b|skrell/i

export const MACRO_FIELDS = ['kcal', 'protein', 'fat', 'satFat', 'carbs', 'fiber', 'sugars', 'added', 'sodium', 'potassium']
export const MICRO_FIELDS = [
  'monounsaturatedFat', 'polyunsaturatedFat', 'omega3', 'omega6',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'zinc', 'copper', 'manganese', 'selenium',
  'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'thiamin', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'choline',
]
export const PACK_FROM_MACRO = {
  kcal: 'calories', protein: 'protein', fat: 'totalFat', satFat: 'saturatedFat',
  carbs: 'totalCarbs', fiber: 'fiber', sugars: 'totalSugars', added: 'addedSugar',
  sodium: 'sodium', potassium: 'potassium',
}

/** Pack perServing key order (35 keys used in Fredheim packs). */
export const PACK_NUTRITION_KEYS = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat',
  'omega3', 'omega6', 'cholesterol', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber',
  'calcium', 'potassium', 'copper', 'iron', 'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc', 'sodium',
  'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'folate', 'thiamin', 'riboflavin', 'niacin', 'choline',
]

export function roundNutrient(x) {
  if (x == null || !Number.isFinite(x) || x === 0) return 0
  const a = Math.abs(x)
  if (a >= 10) return Math.round(x)
  if (a >= 1) return Math.round(x * 10) / 10
  return Math.round(x * 100) / 100
}

/** ω6:ω3 ratio, or null when omega3 is 0. */
export function omegaRatio(omega3, omega6) {
  const a = Number(omega3) || 0
  const b = Number(omega6) || 0
  if (a <= 0) return b > 0 ? Infinity : null
  return Math.round((b / a) * 10) / 10
}

function foodOf(db, id) {
  return db?.foods?.[id] || null
}

/**
 * Grams for one ingredient row.
 * @returns {{ grams: number, note?: string, warning?: string }}
 */
export function rowGrams(row, db, opts = {}) {
  const id = row?.ingredient
  const q0 = row?.quantity
  const unit = row?.unit || ''
  if (q0 == null || unit === '') {
    return { grams: 0, note: 'unquantified (to taste)' }
  }

  // Salt switch: Standard uses standardAmount when present on salt-like rows
  let q = q0
  const saltIds = new Set(db?.saltSwitchIds || [])
  if (opts.saltLevel === 'standard' && saltIds.has(id) && row.standardAmount != null) {
    q = row.standardAmount
  }

  const f = foodOf(db, id)
  if (!f) {
    return { grams: 0, warning: `no composition for ${id || '(missing id)'}` }
  }

  if (unit === 'g') return { grams: q }
  if (unit === 'kg') return { grams: q * 1000 }

  if (VOLUME_ML[unit]) {
    if (f.g?.[unit] != null) return { grams: q * f.g[unit] }
    const d = f.d ?? null
    if (d == null) {
      return { grams: 0, warning: `no density for ${id} in ${unit}` }
    }
    return { grams: q * VOLUME_ML[unit] * d }
  }

  if (unit === 'tsp' || unit === 'tbsp') {
    const mult = unit === 'tbsp' ? 3 : 1
    if (f.g?.[unit] != null) return { grams: q * f.g[unit] }
    if (f.g?.tsp != null) return { grams: q * f.g.tsp * mult }
    if (f.d != null) return { grams: q * 5 * mult * f.d }
    return { grams: 0, warning: `no spoon weight for ${id}` }
  }

  if (unit === 'pcs') {
    const zest = ZEST_RE.test(row.note || '')
    const g = zest ? f.g?.pcsZest : f.g?.pcs
    if (g == null) return { grams: 0, warning: `no piece weight for ${id}` }
    return { grams: q * g, note: zest ? 'zest only' : undefined }
  }

  if (unit === 'clove') {
    if (f.g?.clove == null) return { grams: 0, warning: `no clove weight for ${id}` }
    return { grams: q * f.g.clove }
  }

  if (unit === 'pinch' || unit === 'dash') {
    // ~0.3 g / 0.6 g — match legacy units.mjs spirit
    return { grams: q * (unit === 'pinch' ? 0.3 : 0.6) }
  }

  return { grams: 0, warning: `unit ${unit} not handled (${id})` }
}

/** Sodium mg per 100 g, adjusted by note (rinsed beans, salt-free broth). */
export function sodiumPer100(row, f, mode = 'asWritten') {
  const base = f?.m?.[8] ?? 0
  if (mode === 'regular') return base
  const note = (row.note || '').toLowerCase()
  const id = row.ingredient
  const CANNED = new Set(['black-beans-canned', 'chickpeas-canned', 'kidney-beans-canned', 'white-beans-canned'])
  if (CANNED.has(id)) {
    if (/no[- ]salt|unsalted|uten salt|osaltad|salt-free/.test(note)) return 10
    if (/rinse|skyll|skölj|skolj/.test(note)) return 150
    return base
  }
  if (id === 'vegetable-broth') {
    if (/salt[- ]free|unsalted|or water|daily broth|homemade|hjemmelag|hemgjord/.test(note)) return 15
    return base
  }
  return base
}

/**
 * Per-100 g nutrient object for a row (macros+micros), with sodium note tweaks.
 * Composites: if `compositePer100[id]` is provided, use that instead of db.foods.
 */
export function nutrientsPer100(row, db, compositePer100 = null) {
  const id = row.ingredient
  if (compositePer100 && compositePer100[id]) return compositePer100[id]
  const f = foodOf(db, id)
  if (!f) return null
  const out = {}
  MACRO_FIELDS.forEach((k, i) => { out[k] = f.m?.[i] ?? 0 })
  MICRO_FIELDS.forEach((k, i) => { out[k] = f.u?.[i] ?? 0 })
  out.sodium = sodiumPer100(row, f, 'asWritten')
  out.cholesterol = 0
  return out
}

function emptyTotals() {
  const t = { cholesterol: 0 }
  for (const k of MACRO_FIELDS) t[k] = 0
  for (const k of MICRO_FIELDS) t[k] = 0
  return t
}

/**
 * Build per-100 g maps for composite (homemade) ingredients from finished recipes.
 * @param {Record<string, object>} recipeById  id → recipe with ingredients + servings + servingWeightGrams
 */
export function buildCompositePer100(recipeById, db, opts = {}) {
  const map = {}
  const comps = db.composites || {}
  for (const [ingId, recipeId] of Object.entries(comps)) {
    const r = recipeById?.[recipeId]
    if (!r?.servingWeightGrams || !r.servings) continue
    const { totals, warnings } = sumRecipeTotals(r, db, { ...opts, compositePer100: map })
    // If nested composite missing, skip for now
    if (warnings.some(w => w.startsWith('no composition for'))) continue
    const batchG = r.servings * r.servingWeightGrams
    if (!batchG) continue
    const per = emptyTotals()
    for (const k of Object.keys(totals)) per[k] = (totals[k] * 100) / batchG
    map[ingId] = per
  }
  return map
}

/**
 * Sum nutrient totals for a whole recipe (not yet per-serving).
 */
export function sumRecipeTotals(recipe, db, opts = {}) {
  const totals = emptyTotals()
  const warnings = []
  const compositePer100 = opts.compositePer100 || null

  for (const row of recipe.ingredients || []) {
    if (!row?.ingredient) {
      warnings.push(`row missing ingredient id (${row?.name || '?'})`)
      continue
    }
    const { grams, warning, note } = rowGrams(row, db, opts)
    if (warning) warnings.push(warning)
    if (!grams) continue
    const n = nutrientsPer100(row, db, compositePer100)
    if (!n) {
      warnings.push(`no nutrients for ${row.ingredient}`)
      continue
    }
    const factor = grams / 100
    for (const k of Object.keys(totals)) {
      if (typeof n[k] === 'number') totals[k] += n[k] * factor
    }
    if (note && opts.collectNotes) warnings.push(`${row.ingredient}: ${note}`)
  }
  return { totals, warnings }
}

/**
 * Convert engine totals → pack-shaped nutrition object (35 keys).
 */
export function totalsToPack(totals, servings) {
  const s = Math.max(1, servings || 1)
  const per = {}
  for (const [mk, pk] of Object.entries(PACK_FROM_MACRO)) {
    per[pk] = roundNutrient(totals[mk] / s)
  }
  for (const k of MICRO_FIELDS) {
    per[k] = roundNutrient(totals[k] / s)
  }
  per.cholesterol = 0
  // Ensure all pack keys exist
  for (const k of PACK_NUTRITION_KEYS) {
    if (per[k] == null) per[k] = 0
  }
  return per
}

/**
 * Main entry: compute nutrition for a recipe.
 *
 * @param {object} recipe  { ingredients, servings, servingWeightGrams? }
 * @param {object} db      nutritionDb.json
 * @param {object} [options]
 * @param {SaltLevel} [options.saltLevel='low']
 * @param {Record<string,object>} [options.recipeById]  for composites
 * @param {Record<string,object>} [options.compositePer100]  precomputed
 * @returns {{ perServing: object, total: object, warnings: string[], omegaRatio: number|null, matchedRows: number, gramsTotal: number }}
 */

/**
 * For strained recipes (oat/almond milk, broth): scale ingredient totals by
 * nutrition.yieldFactor so kcal matches the curated edible liquid. Salt-like
 * rows keep full sodium (they dissolve into the liquid); other sodium is scaled.
 */
function applyStrainYield(recipe, db, { totals, warnings }, { saltLevel }) {
  const factor = getYieldFactor(recipe)
  if (factor == null || Math.abs(factor - 1) < 1e-6) return { totals, warnings }
  const scaled = { ...totals }
  for (const k of Object.keys(scaled)) {
    if (k === 'sodium') continue
    scaled[k] = (scaled[k] || 0) * factor
  }
  let solubleNa = 0
  let otherNa = 0
  for (const row of recipe.ingredients || []) {
    const id = row.ingredient
    if (!id || !db.foods?.[id]) continue
    const { grams } = rowGrams(row, db, { saltLevel })
    if (!grams) continue
    const f = db.foods[id]
    const naPer100 = sodiumPer100(row, f)
    const contrib = naPer100 * grams / 100
    if (FULLY_SOLUBLE_IDS.has(id)) solubleNa += contrib
    else otherNa += contrib
  }
  scaled.sodium = solubleNa + otherNa * factor
  const nextWarnings = [...warnings, `strained yield ×${Math.round(factor * 1000) / 1000} (pulp/solids discarded)`]
  return { totals: scaled, warnings: nextWarnings }
}

export function estimateRecipeNutrition(recipe, db, options = {}) {
  if (!db?.foods) {
    return {
      perServing: totalsToPack(emptyTotals(), 1),
      total: emptyTotals(),
      warnings: ['nutrition DB not loaded'],
      omegaRatio: null,
      matchedRows: 0,
      gramsTotal: 0,
    }
  }

  const saltLevel = options.saltLevel || 'low'
  let compositePer100 = options.compositePer100 || null
  if (!compositePer100 && options.recipeById && db.composites) {
    compositePer100 = buildCompositePer100(options.recipeById, db, { saltLevel })
  }

  const summed = sumRecipeTotals(recipe, db, { saltLevel, compositePer100 })
  const { totals, warnings } = applyStrainYield(recipe, db, summed, { saltLevel })
  const servings = Math.max(1, recipe.servings || 1)
  const perServing = totalsToPack(totals, servings)

  // Clamp fat split into totalFat − satFat (same spirit as pack completion scripts)
  const sat = perServing.saturatedFat || 0
  const room = Math.max(0, (perServing.totalFat || 0) - sat)
  const split = (perServing.monounsaturatedFat || 0) + (perServing.polyunsaturatedFat || 0)
  if (split > room && split > 0) {
    const f = room / split
    perServing.monounsaturatedFat = roundNutrient(perServing.monounsaturatedFat * f)
    perServing.polyunsaturatedFat = roundNutrient(perServing.polyunsaturatedFat * f)
    perServing.omega3 = roundNutrient(perServing.omega3 * f)
    perServing.omega6 = roundNutrient(perServing.omega6 * f)
  }

  let matchedRows = 0
  let gramsTotal = 0
  for (const row of recipe.ingredients || []) {
    const { grams, warning } = rowGrams(row, db, { saltLevel })
    if (grams > 0 && !warning) { matchedRows++; gramsTotal += grams }
  }

  return {
    perServing,
    total: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, roundNutrient(v)])),
    warnings: [...new Set(warnings)],
    omegaRatio: omegaRatio(perServing.omega3, perServing.omega6),
    matchedRows,
    gramsTotal: roundNutrient(gramsTotal),
    saltLevel,
  }
}

/**
 * Compare live perServing to a pack's stored perServing.
 * @returns {{ ok: boolean, diffs: Array<{key, live, pack, rel}> }}
 */
export function diffAgainstPack(livePer, packPer, { kcalTol = 0.03, sodiumTol = 0.05, defaultTol = 0.1 } = {}) {
  const diffs = []
  const keys = ['calories', 'protein', 'totalFat', 'totalCarbs', 'fiber', 'sodium', 'omega3', 'omega6']
  for (const key of keys) {
    const live = Number(livePer?.[key]) || 0
    const pack = Number(packPer?.[key]) || 0
    const big = Math.max(Math.abs(live), Math.abs(pack))
    const floor = key === 'calories' ? 15 : key === 'sodium' ? 40 : key.startsWith('omega') ? 0.05 : 0.5
    if (big < floor) continue
    const rel = Math.abs(live - pack) / big
    const tol = key === 'calories' ? kcalTol : key === 'sodium' ? sodiumTol : defaultTol
    if (rel > tol) diffs.push({ key, live, pack, rel: Math.round(rel * 1000) / 1000 })
  }
  return { ok: diffs.length === 0, diffs }
}

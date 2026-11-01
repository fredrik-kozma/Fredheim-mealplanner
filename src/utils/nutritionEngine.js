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


/**
 * Reverse map: pack perServing key → engine totals key.
 */
export const ENGINE_FROM_PACK = Object.fromEntries([
  ...Object.entries(PACK_FROM_MACRO).map(([eng, pack]) => [pack, eng]),
  ...MICRO_FIELDS.map((k) => [k, k]),
  ['cholesterol', 'cholesterol'],
])

/**
 * Collect per-ingredient nutrient vectors (whole recipe, before yield).
 * Same math as sumRecipeTotals, but keeps each row's contribution.
 */
export function collectRecipeContributions(recipe, db, opts = {}) {
  const warnings = []
  const contributions = []
  const uncounted = []
  const compositePer100 = opts.compositePer100 || null
  const totals = emptyTotals()

  for (const row of recipe.ingredients || []) {
    const name = row?.name || row?.ingredient || '?'
    const quantity = row?.quantity
    const unit = row?.unit
    const note = row?.note || ''
    const id = row?.ingredient || null

    if (!id) {
      uncounted.push({ name, reason: 'unlinked' })
      warnings.push(`row missing ingredient id (${name})`)
      continue
    }

    const { grams, warning, note: gramNote } = rowGrams(row, db, opts)
    if (warning) warnings.push(warning)

    if (!grams) {
      const reason = warning
        ? (/no composition|no nutrients/.test(warning) ? 'unlinked' : 'no-amount')
        : (gramNote && /unquantified|to taste/i.test(gramNote) ? 'to-taste' : 'no-amount')
      uncounted.push({ name, ingredientId: id, reason, warning: warning || gramNote || null })
      continue
    }

    const n = nutrientsPer100(row, db, compositePer100)
    if (!n) {
      warnings.push(`no nutrients for ${id}`)
      uncounted.push({ name, ingredientId: id, reason: 'no-nutrients' })
      continue
    }

    const factor = grams / 100
    const nutrients = emptyTotals()
    for (const k of Object.keys(totals)) {
      if (typeof n[k] === 'number') {
        nutrients[k] = n[k] * factor
        totals[k] += nutrients[k]
      }
    }
    if (gramNote && opts.collectNotes) warnings.push(`${id}: ${gramNote}`)

    contributions.push({
      ingredientId: id,
      name,
      quantity,
      unit,
      note,
      grams,
      nutrients,
      row,
    })
  }

  return { contributions, uncounted, totals, warnings }
}

/**
 * Scale contributions to match applyStrainYield:
 * - every nutrient except sodium × yieldFactor
 * - sodium rebuilt like applyStrainYield (db.foods only; soluble kept full)
 */
function applyYieldToContributions(recipe, db, contributions, warnings, { saltLevel }) {
  const factor = getYieldFactor(recipe)
  const yieldFactor = (factor == null || Math.abs(factor - 1) < 1e-6) ? 1 : factor

  // No strain: keep contribution vectors as collected (incl. composite sodium).
  // Matches applyStrainYield early-return when factor is absent/1.
  if (yieldFactor === 1) {
    const totals = emptyTotals()
    const cleaned = contributions.map((c) => {
      const { row, ...rest } = c
      for (const k of Object.keys(totals)) totals[k] += rest.nutrients[k] || 0
      return rest
    })
    return { contributions: cleaned, totals, warnings, yieldFactor: 1 }
  }

  const scaled = contributions.map((c) => {
    const nutrients = { ...c.nutrients }
    for (const k of Object.keys(nutrients)) {
      if (k === 'sodium') continue
      nutrients[k] = (nutrients[k] || 0) * yieldFactor
    }

    // Sodium: mirror applyStrainYield (db.foods only; soluble kept full)
    const id = c.ingredientId
    const f = db.foods?.[id]
    if (!f) {
      nutrients.sodium = 0
    } else {
      const naPer100 = sodiumPer100(c.row, f)
      const contrib = naPer100 * c.grams / 100
      nutrients.sodium = FULLY_SOLUBLE_IDS.has(id) ? contrib : contrib * yieldFactor
    }

    const { row, ...rest } = c
    return { ...rest, nutrients }
  })

  const totals = emptyTotals()
  for (const c of scaled) {
    for (const k of Object.keys(totals)) totals[k] += c.nutrients[k] || 0
  }

  const nextWarnings = [...warnings, 'strained yield ×' + (Math.round(yieldFactor * 1000) / 1000) + ' (pulp/solids discarded)']
  return { contributions: scaled, totals, warnings: nextWarnings, yieldFactor }
}


export function estimateRecipeNutritionBreakdown(recipe, db, options = {}) {
  const base = estimateRecipeNutrition(recipe, db, options)
  if (!db?.foods) {
    return {
      ...base,
      contributions: [],
      uncounted: [],
      yieldFactor: 1,
      servings: Math.max(1, recipe?.servings || 1),
    }
  }

  const saltLevel = options.saltLevel || base.saltLevel || 'low'
  let compositePer100 = options.compositePer100 || null
  if (!compositePer100 && options.recipeById && db.composites) {
    compositePer100 = buildCompositePer100(options.recipeById, db, { saltLevel })
  }

  const collected = collectRecipeContributions(recipe, db, { saltLevel, compositePer100 })
  const yielded = applyYieldToContributions(
    recipe, db, collected.contributions, collected.warnings, { saltLevel },
  )

  return {
    ...base,
    // Prefer contribution-derived rounded totals only for verification helpers;
    // public total/perServing stay exactly what estimateRecipeNutrition returned.
    contributions: yielded.contributions,
    uncounted: collected.uncounted,
    yieldFactor: yielded.yieldFactor,
    servings: Math.max(1, recipe.servings || 1),
    _contributionTotals: yielded.totals,
  }
}

/**
 * Largest-remainder integer percents that sum to 100 (or 0 if empty).
 */
export function largestRemainderPercents(amounts) {
  const total = amounts.reduce((s, a) => s + a, 0)
  if (!(total > 0) || amounts.length === 0) return amounts.map(() => 0)
  const raw = amounts.map((a) => (a / total) * 100)
  const floored = raw.map((p) => Math.floor(p))
  let rem = 100 - floored.reduce((s, p) => s + p, 0)
  const order = raw
    .map((p, i) => ({ i, frac: p - Math.floor(p) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (rem <= 0) break
    floored[i] += 1
    rem -= 1
  }
  return floored
}

/**
 * UI-ready view for one pack nutrient key.
 */
export function viewNutrientBreakdown(breakdown, packKey, opts = {}) {
  const topN = opts.topN ?? 5
  const multiplier = opts.multiplier ?? 1
  const engKey = ENGINE_FROM_PACK[packKey] || packKey
  const servings = Math.max(1, breakdown.servings || 1)

  const parts = (breakdown.contributions || [])
    .map((c) => {
      const rawWhole = c.nutrients?.[engKey] || 0
      const amount = (rawWhole / servings) * multiplier
      return {
        ingredientId: c.ingredientId,
        name: c.name,
        note: c.note,
        quantity: c.quantity,
        unit: c.unit,
        grams: c.grams,
        gramsInView: (c.grams / servings) * multiplier,
        amount,
        rawWhole,
      }
    })
    .filter((p) => p.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  // Collapse long tails before rounding so "Others" keeps a visible share.
  let buckets
  if (parts.length > topN) {
    const head = parts.slice(0, topN)
    const tail = parts.slice(topN)
    buckets = [
      ...head,
      {
        ingredientId: null,
        name: '__others__',
        note: '',
        quantity: null,
        unit: null,
        grams: 0,
        gramsInView: 0,
        amount: tail.reduce((s, p) => s + p.amount, 0),
        rawWhole: tail.reduce((s, p) => s + p.rawWhole, 0),
        _otherNames: tail.map((p) => p.name),
      },
    ]
  } else {
    buckets = parts
  }

  const liveWhole = breakdown.total?.[engKey]
  const denom = (liveWhole != null && liveWhole > 0)
    ? (liveWhole / servings) * multiplier
    : buckets.reduce((s, p) => s + p.amount, 0)

  const pcts = largestRemainderPercents(buckets.map((p) => p.amount))
  const withPct = buckets.map((p, i) => ({
    ...p,
    amount: roundNutrient(p.amount),
    pct: pcts[i],
  }))

  const othersBucket = withPct.find((p) => p.name === '__others__')
  const top = withPct.filter((p) => p.name !== '__others__')
  let others = null
  if (othersBucket) {
    others = {
      names: othersBucket._otherNames || [],
      amount: othersBucket.amount,
      pct: othersBucket.pct,
    }
  }


  return {
    packKey,
    engineKey: engKey,
    totalAmount: roundNutrient(denom),
    parts: top,
    others,
    uncounted: breakdown.uncounted || [],
    yieldFactor: breakdown.yieldFactor ?? 1,
  }
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

// Salt levels and breakfast flavour: the rules shared by
// scripts/build_salt_levels.mjs (which writes them into the packs) and
// scripts/check-recipes.mjs (which validates them). See the build script
// for the medical decision behind the two levels. Read-only.
import { rowGrams, food } from './recipeNutritionEstimate.mjs'

// ── targets (mg sodium per serving at the standard level) ──────────────────
// A recipe below raiseBelow is brought to the target, within the cap. One at
// or above it still gets a noticeable step: at least minBump (a main: 0.2 g
// salt ≈ 80 mg, the others in proportion), up to its ceiling (standardCeiling).
// addRow: a recipe of this kind without a salt row gets a "to taste" one.
export const TARGETS = {
  main: { target: 675, cap: 750, raiseBelow: 600, minBump: 80, addRow: true },
  breakfast: { target: 375, cap: 400, raiseBelow: 300, minBump: 40, addRow: true },
  bread: { target: 375, cap: 400, raiseBelow: 300, minBump: 40, addRow: true },
  side: { target: 200, cap: 250, raiseBelow: 150, minBump: 40 },
  snack: { target: 150, cap: 200, raiseBelow: 110, minBump: 30 },
  component: { target: 0, cap: 0, raiseBelow: 0, minBump: 15 },
}
// Nothing is salted past this at standard. A recipe already over it (a very
// salty side as written) is left alone rather than pushed further.
export const MAIN_CEILING = 900
// The largest step on a "to taste" row before it goes to pinches.
const MAX_STEP = 150
// A rounded step may land this far under minBump ("about +80 mg").
const MIN_BUMP_SLACK = 0.9
// Rows that may carry a standard amount (check-recipes enforces the same).
export const STANDARD_AMOUNT_IDS = new Set(['salt', 'herb-salt', 'black-salt', 'soy-sauce', 'soy-sauce-low-sodium', 'tamari', 'miso-paste', 'vegetable-bouillon'])
// Rows this script raises, in order of preference: plain salt first.
const RAISE_IDS = ['salt', 'herb-salt', 'black-salt']
export const LANGS = ['en', 'no', 'sv']
export const TO_TASTE = { en: 'to taste', no: 'etter smak', sv: 'efter smak' }
export const TO_TASTE_RE = /^(to taste|etter smak|efter smak)$/i
// A row that seasons a sub-part ("for the pickled onions") is not the dish's salt.
const SUB_PART = /\bfor the\b/i

// ── flavour (breakfasts, spreads, jams) ─────────────────────────────────────
const SWEET_RE = /berr|cherr|mango|pineapple|banana|apple|pear|fig|prune|apricot|raisin|date|maple|honey|sugar|sukrin|carob|vanilla|cinnamon|cardamom/
const SAVOURY_RE = /garlic|onion|soy-sauce|tamari|miso|black-salt|herb-salt|^olives$|nutritional-yeast|tomato|bell-pepper|spinach|cumin|paprika|chili|cayenne|basil|parsley|dill|chive|oregano|thyme|marjoram|caraway|coriander|beetroot|chickpea|bean|tahini|avocado/

export const needsFlavour = r => ((r.mealTypes || []).includes('breakfast') && r.category !== 'Bread') ||
  ['Spreads', 'Jam'].includes(r.category)

/** { profile: 'sweet' | 'savoury', why } from sugars and ingredients. */
export function classifyFlavour(r) {
  const n = r.nutrition?.perServing || {}
  const share = n.calories > 0 ? (Number(n.totalSugars) || 0) * 4 / n.calories : 0
  const idsOf = [...new Set((r.ingredients || []).map(i => i.ingredient).filter(Boolean))]
  const sweet = idsOf.filter(id => SWEET_RE.test(id))
  const sav = idsOf.filter(id => SAVOURY_RE.test(id))
  const pct = `${Math.round(share * 100)}% of energy from sugars`
  if (share >= 0.2) return { profile: 'sweet', why: pct }
  if (sav.length >= 2 && sav.length >= sweet.length) return { profile: 'savoury', why: `savoury: ${sav.slice(0, 4).join(', ')}` }
  if (sweet.length) return { profile: 'sweet', why: `sweet: ${sweet.slice(0, 4).join(', ')}` }
  // Plain porridge and the like are eaten with fruit or a sweet sauce;
  // a plain spread (tofu feta, mozzarella) goes on savoury bread.
  return r.category === 'Spreads' ? { profile: 'savoury', why: 'plain spread' } : { profile: 'sweet', why: 'plain, served with fruit' }
}

// ── which recipes get a standard amount ─────────────────────────────────────
// The salt does a job here (a ferment, a salt-preserved concentrate): more of
// it is not seasoning.
const PRESERVED_IDS = new Set(['fermented-red-cabbage', 'fr-69'])
// Sweet dishes outside the Dessert/Drink/Jam categories (vanilla sauce,
// caramelized nuts, sweet tahini sauce), which have no flavourProfile.
const SWEET_DISH_RE = /vanilla|cinnamon|carob|maple|sukrin/
const SWEET_IDS = new Set(['orn-57']) // tahini reads savoury, but it goes on porridge

function isSweetDish(r) {
  if (SWEET_IDS.has(r.id)) return true
  const ids = [...new Set((r.ingredients || []).map(i => i.ingredient).filter(Boolean))]
  if (ids.some(id => SAVOURY_RE.test(id))) return false
  const n = r.nutrition?.perServing || {}
  const share = n.calories > 0 ? (Number(n.totalSugars) || 0) * 4 / n.calories : 0
  if (ids.some(id => SWEET_DISH_RE.test(id))) return true
  // A vegetable side can be high in sugars from its dates and still be savoury.
  return share >= 0.35 && !['Side', 'Salad'].includes(r.category)
}

/** 'main' | 'breakfast' | 'bread' | 'side' | 'snack' | 'component', or { skip: reason }. */
export function saltClass(r) {
  const mt = r.mealTypes || []
  const c = r.category
  if (!r.nutrition?.perServing || !Number.isFinite(Number(r.nutrition.perServing.sodium))) return { skip: 'no nutrition data' }
  if (r.flavourProfile === 'sweet') return { skip: 'sweet' }
  if (['Dessert', 'Drink', 'Jam'].includes(c)) return { skip: 'sweet' }
  if (PRESERVED_IDS.has(r.id)) return { skip: 'preserved' }
  if (mt.length && mt.every(m => m === 'component')) return isSweetDish(r) ? { skip: 'sweet' } : 'component'
  if (['Main', 'Soup', 'Lunch'].includes(c) && mt.some(m => m === 'lunch' || m === 'dinner')) return 'main'
  if (c === 'Bread' && mt.includes('breakfast')) return 'bread'
  if (c === 'Breakfast' || (mt.includes('breakfast') && r.flavourProfile === 'savoury')) return 'breakfast'
  if (isSweetDish(r)) return { skip: 'sweet' }
  if (['Sauce', 'Spreads', 'Other'].includes(c)) return 'component'
  if (c === 'Salad' || c === 'Side') return 'side'
  return 'snack'
}

export const SKIP_WHY = {
  sweet: 'Sweet dishes (desserts, drinks, jams, sweet breakfasts and porridge): no salt increase.',
  preserved: 'Ferments and salt-preserved concentrates: the salt does a job there, so more of it is not seasoning.',
  'no salt row': 'No salt row of their own (the salt, if any, comes from soy sauce, miso, bouillon or salted cooking water): no salt line added, nothing to raise.',
  'no nutrition data': 'No nutrition data to compute sodium from.',
  'over ceiling': 'Already over 900 mg sodium a serving as written: not salted further. Worth a look at the recipe itself.',
  'step too large': 'Even the smallest clean step would pass the ceiling.',
}

const naPerGram = id => food(id).v[8] / 100
// A pinch is the kitchen's 1/16 tsp. Only a "to taste" row is measured in it.
const PINCH_TSP = 1 / 16
const gramsPer = (id, unit) => unit === 'pinch'
  ? { grams: rowGrams({ ingredient: id, quantity: 1, unit: 'tsp' }).grams * PINCH_TSP }
  : rowGrams({ ingredient: id, quantity: 1, unit })

/**
 * The most sodium a serving may have at standard. A main: MAIN_CEILING. Others:
 * their cap, or for one already near it the low value plus a step (150 mg, or
 * ¼ tsp salt across a small batch), and never past MAIN_CEILING.
 */
export function standardCeiling(cls, r) {
  if (cls === 'main') return MAIN_CEILING
  const low = Number(r.nutrition?.perServing?.sodium) || 0
  const servings = r.servings || 1
  return Math.min(MAIN_CEILING, Math.max(TARGETS[cls].cap, low + Math.max(MAX_STEP, servings > 1 ? 590 / servings : 0)))
}

// Clean amounts above `from`: quarters of a teaspoon, halves of a tablespoon.
function candidates(from, unit) {
  const step = unit === 'tbsp' ? 0.5 : 0.25
  const out = []
  for (let k = 1; k <= 40; k++) {
    const v = Math.round((Math.floor((from + 1e-9) / step) + k) * step * 1000) / 1000
    if (v > from + 1e-9) out.push(v)
  }
  return out
}

/** The row this recipe's standard amount goes on: index, or -1 for a new row. */
export function saltRowIndex(r) {
  for (const id of RAISE_IDS) {
    const i = (r.ingredients || []).findIndex(row => row.ingredient === id && !SUB_PART.test(row.note || '') &&
      (row.quantity == null ? row.unit === '' : ['tsp', 'tbsp'].includes(row.unit)))
    if (i >= 0) return i
  }
  return -1
}

/**
 * Per-serving sodium of a recipe at the standard level, from its stored
 * (low) value plus what the standard amounts add.
 */
export function standardSodium(r) {
  const base = Number(r.nutrition?.perServing?.sodium) || 0
  let add = 0
  for (const row of r.ingredients || []) {
    if (row.standardAmount == null) continue
    const unit = row.standardUnit || row.unit
    const from = row.quantity == null ? 0 : row.quantity * gramsPer(row.ingredient, row.unit).grams
    const to = row.standardAmount * gramsPer(row.ingredient, unit).grams
    add += (to - from) * naPerGram(row.ingredient)
  }
  return Math.round(base + add / (r.servings || 1))
}

function stripStandard(r) {
  for (const l of LANGS) {
    const list = l === 'en' ? r.ingredients : r.translations?.[l]?.ingredients
    for (const row of list || []) { delete row.standardAmount; delete row.standardUnit }
  }
  if (r.nutrition) delete r.nutrition.sodiumStandard
}

/**
 * The smallest clean step that adds at least the class's minBump, within the
 * ceiling: { v, unit, toTsp? }. A "to taste" row falls back on pinches, a row
 * in tbsp on the same amount written in tsp (¼ tbsp can be far too big a step).
 */
function pickBump(r, row, cls, low) {
  const { minBump } = TARGETS[cls]
  const ceiling = standardCeiling(cls, r)
  const servings = r.servings || 1
  const tryUnit = (unit, from, list, limit = ceiling) => {
    const g = gramsPer(row.ingredient, unit).grams
    for (const v of list) {
      const add = (v - from) * g * naPerGram(row.ingredient) / servings
      if (add < minBump * MIN_BUMP_SLACK) continue
      return low + add <= limit ? v : null
    }
    return null
  }
  const unit = row.quantity == null ? 'tsp' : row.unit
  const from = row.quantity ?? 0
  const toTaste = row.quantity == null
  const v = tryUnit(unit, from, candidates(from, unit), toTaste ? Math.min(ceiling, low + MAX_STEP) : ceiling)
  if (v != null) return { v, unit }
  if (toTaste) {
    const pinches = tryUnit('pinch', 0, [1, 2])
    return pinches != null ? { v: pinches, unit: 'pinch' } : null
  }
  if (unit === 'tbsp') {
    const inTsp = tryUnit('tsp', from * 3, candidates(from * 3, 'tsp'))
    if (inTsp != null) return { v: inTsp, unit: 'tsp', toTsp: true }
  }
  return null
}

/** Decides and applies the standard amount on one recipe (mutates). */
export function applySaltLevel(r, dictById) {
  stripStandard(r)
  const cls = saltClass(r)
  if (typeof cls === 'object') return { skipped: cls.skip }
  const { target, cap, raiseBelow, addRow } = TARGETS[cls]
  const low = Number(r.nutrition.perServing.sodium)
  if (low >= MAIN_CEILING) return { skipped: 'over ceiling', cls, low }

  let idx = saltRowIndex(r)
  const added = idx < 0
  if (added && !(addRow && low < raiseBelow)) return { skipped: 'no salt row', cls, low }
  const row = added ? { quantity: null, unit: '', ingredient: 'salt' } : r.ingredients[idx]
  const unit = row.quantity == null ? 'tsp' : row.unit
  const perUnitNa = gramsPer(row.ingredient, unit).grams * naPerGram(row.ingredient) / (r.servings || 1)
  const from = row.quantity ?? 0
  // Below the target: closest to it, erring low (going over counts 1.5 times).
  const miss = na => (na > target ? 1.5 : 1) * Math.abs(na - target)
  let best = null
  if (low < raiseBelow) {
    for (const v of candidates(from, unit)) {
      const na = low + (v - from) * perUnitNa
      if (na > cap) break
      if (!best || miss(na) < miss(best.na)) best = { v, na, unit }
    }
    // A small batch seasoned to taste: pinches where ¼ tsp is too much.
    if (!best && row.quantity == null) {
      const perPinch = gramsPer(row.ingredient, 'pinch').grams * naPerGram(row.ingredient) / (r.servings || 1)
      for (const v of [1, 2]) {
        const na = low + v * perPinch
        if (na <= cap && (!best || miss(na) < miss(best.na))) best = { v, na, unit: 'pinch' }
      }
    }
  }
  // At the target already, or the clean steps overshoot: a small step.
  if (!best) best = pickBump(r, row, cls, low)
  if (!best) return { skipped: 'step too large', cls, low }

  if (added) {
    const e = dictById.get('salt')
    idx = r.ingredients.length
    for (const l of LANGS) {
      const list = l === 'en' ? r.ingredients : r.translations[l].ingredients
      list.push({ quantity: null, unit: '', ingredient: 'salt', name: e.names[l], note: TO_TASTE[l] })
    }
  }
  for (const l of LANGS) {
    const list = l === 'en' ? r.ingredients : r.translations[l].ingredients
    if (best.toTsp) { list[idx].quantity *= 3; list[idx].unit = 'tsp' }
    list[idx].standardAmount = best.v
    if (list[idx].quantity == null) list[idx].standardUnit = best.unit
  }
  r.nutrition.sodiumStandard = standardSodium(r)
  return { cls, low, standard: r.nutrition.sodiumStandard, row: r.ingredients[idx], added, rowIndex: idx }
}

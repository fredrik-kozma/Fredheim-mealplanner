// Salt levels and breakfast flavour: the rules shared by
// scripts/build_salt_levels.mjs (which writes them into the packs) and
// scripts/check-recipes.mjs (which validates them). See the build script
// for the medical decision behind the two levels. Read-only.
import { rowGrams, food } from './recipeNutritionEstimate.mjs'

// ── targets (mg sodium per serving at the standard level) ──────────────────
export const TARGETS = {
  main: { target: 675, cap: 750, raiseBelow: 600 },
  breakfast: { target: 375, cap: 400, raiseBelow: 300 },
  bread: { target: 375, cap: 400, raiseBelow: 300 },
}
// Rows that may carry a standard amount (check-recipes enforces the same).
export const STANDARD_AMOUNT_IDS = new Set(['salt', 'herb-salt', 'black-salt', 'soy-sauce', 'tamari', 'miso-paste', 'vegetable-bouillon'])
// Rows this script raises, in order of preference: plain salt first.
const RAISE_IDS = ['salt', 'herb-salt']
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
/** 'main' | 'breakfast' | 'bread', or { skip: reason }. */
export function saltClass(r) {
  const mt = r.mealTypes || []
  const c = r.category
  if (!r.nutrition?.perServing || !Number.isFinite(Number(r.nutrition.perServing.sodium))) return { skip: 'no nutrition data' }
  if (r.flavourProfile === 'sweet') return { skip: 'sweet' }
  if (['Dessert', 'Drink', 'Jam'].includes(c)) return { skip: 'sweet' }
  if (mt.length && mt.every(m => m === 'component')) return { skip: 'component' }
  if (['Main', 'Soup', 'Lunch'].includes(c) && mt.some(m => m === 'lunch' || m === 'dinner')) return 'main'
  if (c === 'Bread' && mt.includes('breakfast')) return 'bread'
  if (c === 'Breakfast' || (mt.includes('breakfast') && r.flavourProfile === 'savoury')) return 'breakfast'
  if (['Sauce', 'Spreads', 'Other'].includes(c)) return { skip: 'component' }
  if (c === 'Salad' || c === 'Side') return { skip: 'side' }
  return { skip: 'snack' }
}

export const SKIP_WHY = {
  sweet: 'Sweet dishes (desserts, drinks, jams, sweet breakfasts and porridge): no salt increase.',
  component: 'Sauces, spreads, dressings, broths and other components: eaten with a dish whose own standard amount already brings the plate to ~700 mg, so salting them as well would push a meal past 750 mg.',
  side: 'Salads and sides: served next to a main meal that carries the standard salt.',
  snack: 'Snacks and crackers: optional extras, left as written.',
  'no nutrition data': 'No nutrition data to compute sodium from.',
  'already at target': 'Already at or near the standard target at the low-salt amounts.',
  'step too large': 'Even the smallest clean step (¼ tsp) would pass the cap.',
}

const naPerGram = id => food(id).v[8] / 100
const gramsPer = (id, unit) => rowGrams({ ingredient: id, quantity: 1, unit })

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

/** Decides and applies the standard amount on one recipe (mutates). */
export function applySaltLevel(r, dictById) {
  stripStandard(r)
  const cls = saltClass(r)
  if (typeof cls === 'object') return { skipped: cls.skip }
  const { target, cap, raiseBelow } = TARGETS[cls]
  const low = Number(r.nutrition.perServing.sodium)
  if (low >= raiseBelow) return { skipped: 'already at target', cls, low }

  let idx = saltRowIndex(r)
  const added = idx < 0
  const row = added ? { quantity: null, unit: '', ingredient: 'salt' } : r.ingredients[idx]
  const unit = row.quantity == null ? 'tsp' : row.unit
  const perUnitNa = gramsPer(row.ingredient, unit).grams * naPerGram(row.ingredient) / (r.servings || 1)
  const from = row.quantity ?? 0
  // Closest to the target, erring low: going over counts 1.5 times.
  const miss = na => (na > target ? 1.5 : 1) * Math.abs(na - target)
  let best = null
  for (const v of candidates(from, unit)) {
    const na = low + (v - from) * perUnitNa
    if (na > cap) break
    if (!best || miss(na) < miss(best.na)) best = { v, na }
  }
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
    list[idx].standardAmount = best.v
    if (list[idx].quantity == null) list[idx].standardUnit = 'tsp'
  }
  r.nutrition.sodiumStandard = standardSodium(r)
  return { cls, low, standard: r.nutrition.sodiumStandard, row: r.ingredients[idx], added, rowIndex: idx }
}

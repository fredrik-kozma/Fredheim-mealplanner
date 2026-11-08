/**
 * Reviewed meals are whole recipes at one individual serving.
 *
 * A record names one recipe id and the ingredient lines of the batch that
 * was reviewed. Comparison is per serving (line amount ÷ batch servings).
 * Cooking a larger batch is the same meal when every line grows in proportion
 * and each person still eats one serving. A different amount on the plate,
 * a substituted ingredient, a preparation change, or an extra ingredient
 * is a different meal and is not suitable. Unknown is not suitable.
 * A person's own tolerance note never approves a dish.
 *
 * There is no food-composition table here. Pack nutrition and tags are ignored.
 * A future review is of the whole recipe at one individual serving. The app
 * does not demand a separate laboratory assay for every ingredient, and it
 * does not invent that review. Draft audit files are not records.
 */

import {
  planPlantMilkSubstitutions,
  planSoySauceSubstitutions,
  recipeHasAvoidedAllergen,
} from '../../data/ingredientBlocker.js'
import { normalizeUnit } from '../unitNormalizer.js'

export function normalizePreparation(value) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function perServingAmount(quantity, servings) {
  return Math.round((quantity / servings) * 1e6) / 1e6
}

function lineParts(row, servings) {
  const id = typeof row?.ingredient === 'string' ? row.ingredient.trim() : ''
  if (!id) return null
  // A row that does not scale with the batch has no stable per-person ratio.
  if (row.scalesLinearly === false) return null
  const quantity = Number(row.quantity)
  if (!Number.isFinite(quantity) || quantity <= 0) return null
  const unit = normalizeUnit(row.unit)
  if (!unit || unit === 'none') return null
  const preparation = normalizePreparation(row.preparation || '')
  const note = typeof row.note === 'string' ? row.note.trim().toLowerCase().replace(/\s+/g, ' ') : ''
  return [id, String(perServingAmount(quantity, servings)), unit, preparation, note].join('|')
}

/**
 * Per-serving description of a recipe. The batch size is not part of it:
 * twice the batch with twice every ingredient is the same individual serving.
 * Null when a line cannot be identified. Those recipes cannot match a review.
 */
export function recipeFingerprint(recipe) {
  const servings = Number(recipe?.servings)
  if (!Number.isFinite(servings) || servings <= 0) return null
  const rows = Array.isArray(recipe?.ingredients) ? recipe.ingredients : []
  if (!rows.length) return null
  const lines = []
  for (const row of rows) {
    const parts = lineParts(row, servings)
    if (!parts) return null
    lines.push(parts)
  }
  return lines.join('\n')
}

export function recordFingerprint(record) {
  if (!record) return null
  return recipeFingerprint({
    servings: record.batchServings,
    ingredients: record.lines,
  })
}

function reviewedRecords(records, recipeId) {
  return (records || []).filter(r =>
    r &&
    r.recipeId === recipeId &&
    r.status === 'assessed' &&
    r.clinicallyReviewed === true &&
    r.fixture !== true &&
    r.testOnly !== true &&
    r.origin !== 'fixture' &&
    r.origin !== 'user-observation' &&
    r.origin !== 'user-defined')
}

function isSubstituted(recipe, blocked) {
  if (!blocked) return false
  const milk = planPlantMilkSubstitutions(recipe, blocked)
  const soy = planSoySauceSubstitutions(recipe, blocked)
  return (milk.substitutions?.length || 0) + (soy.substitutions?.length || 0) > 0
}

function closed(verdict, reason) {
  return {
    verdict,
    reason,
    certifiesMeal: false,
    stacking: 'not-assessed',
    fromTolerance: false,
  }
}

/**
 * @param {object} recipe
 * @param {object} opts
 * @param {number} [opts.portionsPerPerson] how many of the recipe's own servings one person eats
 * @param {object[]} [opts.records] reviewed recipe records. Production passes none.
 * @param {object|string[]|null} [opts.blocked] allergen / ingredient blocks
 */
export function assessReviewedRecipe(recipe, { portionsPerPerson = 1, records = [], blocked = null } = {}) {
  if (blocked && recipeHasAvoidedAllergen(recipe, blocked)) {
    return closed('excluded', 'blocked')
  }
  if (isSubstituted(recipe, blocked)) return closed('not-suitable', 'substituted')

  const matches = reviewedRecords(records, recipe?.id)
  if (!matches.length) return closed('unknown', 'not-assessed')

  const live = recipeFingerprint(recipe)
  if (!live) return closed('unknown', 'not-assessed')

  const portions = Number(portionsPerPerson)
  if (!Number.isFinite(portions) || portions <= 0) return closed('unknown', 'servings-unknown')

  let sawUnknown = false
  let sawNotLow = false
  let sawScale = false
  for (const rec of matches) {
    if (recordFingerprint(rec) !== live) continue
    if (rec.suitability === 'unknown') {
      sawUnknown = true
      continue
    }
    if (rec.suitability !== 'low') {
      if (rec.suitability === 'moderate' || rec.suitability === 'high') sawNotLow = true
      continue
    }
    if (Number(rec.servingsPerPerson) !== portions) {
      sawScale = true
      continue
    }
    return {
      verdict: 'suitable',
      reason: 'reviewed-serving',
      recordId: rec.id,
      version: rec.version || null,
      certifiesMeal: false,
      stacking: 'not-assessed',
      fromTolerance: false,
    }
  }

  if (sawScale) return closed('not-suitable', 'serving-differs')
  if (sawNotLow) return closed('not-suitable', 'not-low')
  if (sawUnknown) return closed('unknown', 'suitability-unknown')
  return closed('unknown', 'recipe-differs')
}

/** True only for the reviewed one-person serving. Used by Make my week. */
export function reviewedServingPerPerson(recipe, records = [], blocked = null) {
  const result = assessReviewedRecipe(recipe, { portionsPerPerson: 1, records, blocked })
  return result.verdict === 'suitable' ? 1 : 0
}

const COUNT_COMPARE = new Set(['pcs', 'clove'])

function toBase(amount, unit) {
  const key = normalizeUnit(unit)
  if (!key || key === 'none') return null
  const factors = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592, ml: 1, dl: 100, l: 1000, tsp: 5, tbsp: 15, cup: 240, fl_oz: 29.5735 }
  if (factors[key]) return { family: key === 'g' || key === 'kg' || key === 'oz' || key === 'lb' ? 'g' : 'ml', amount: amount * factors[key] }
  if (COUNT_COMPARE.has(key)) return { family: key, amount }
  return null
}

/**
 * A personal note. Exact food, preparation, and amount. A group on the
 * note is ignored. This does not make a recipe suitable.
 */
export function matchTolerance(tolerances, use) {
  const none = { matched: false, certifies: false, generalizesGroup: false, approvesRecipe: false }
  const ingredientId = typeof use?.ingredientId === 'string' ? use.ingredientId : ''
  const prep = normalizePreparation(use?.preparation)
  if (!ingredientId || !prep) return none
  const eaten = toBase(Number(use?.amount), use?.unit)
  if (!eaten) return none
  let found = null
  for (const note of tolerances || []) {
    if (!note || note.ingredientId !== ingredientId) continue
    if (note.source !== 'user-observation') continue
    if (normalizePreparation(note.preparation) !== prep) continue
    if (note.outcome !== 'tolerated' && note.outcome !== 'unclear' && note.outcome !== 'limit') continue
    const cap = toBase(note.amount, note.unit)
    if (!cap || cap.family !== eaten.family) continue
    if (eaten.amount > cap.amount + 1e-6) continue
    found = note
    if (note.outcome === 'limit') break
  }
  if (!found) return none
  return {
    matched: true,
    outcome: found.outcome,
    recordId: found.id || null,
    certifies: false,
    generalizesGroup: false,
    approvesRecipe: false,
    source: 'user-observation',
  }
}

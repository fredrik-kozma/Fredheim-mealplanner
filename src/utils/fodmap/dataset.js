/**
 * Shape-check for a reviewed recipe-serving file.
 *
 * Each record names one recipe, the batch it was reviewed against, every
 * ingredient line, and one serving per person. A later batch that keeps
 * those per-serving amounts still matches. A different plate, swap, or
 * preparation does not.
 * A file that fails here is not a clinical list. A file that passes is
 * still not used to plan meals until it is compiled into the app
 * (productionDataset.js is empty). Users cannot mark a file trusted.
 */

import { normalizeUnit } from '../unitNormalizer.js'
import { normalizePreparation, recordFingerprint } from './assessment.js'

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const BANNED_ORIGINS = new Set([
  'fixture',
  'test',
  'test-fixture',
  'user-observation',
  'user-defined',
  'unreviewed',
  'nutrition-inference',
  'monash-calculator',
  'inferred',
])
const SUITABILITY = new Set(['low', 'moderate', 'high', 'unknown'])
const COUNT_UNITS = new Set(['pcs', 'clove'])
const MEASURED = new Set(['g', 'kg', 'oz', 'lb', 'ml', 'dl', 'l', 'tsp', 'tbsp', 'cup', 'fl_oz'])

function isHttps(url) {
  if (typeof url !== 'string' || url.length > 500) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.includes('.')
  } catch {
    return false
  }
}

function isCalculatorUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host === 'monashfodmapcalculator.com.au' || host.endsWith('.monashfodmapcalculator.com.au')
  } catch {
    return false
  }
}

function push(errors, path, message) {
  errors.push({ path, message })
}

export function validateDatasetStructure(input) {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: [{ path: '', message: 'Expected an object.' }] }
  }
  if (input.trustedByApp != null) {
    push(errors, 'trustedByApp', 'A file cannot mark itself as trusted by the app.')
  }
  if (input.testOnly === true || input.fixture === true) {
    push(errors, 'fixture', 'Fixtures are not a clinical list.')
  }
  if (input.schema !== 'fredheim-fodmap-recipe-assessments' || input.schemaVersion !== 1) {
    push(errors, 'schema', 'Unsupported dataset schema.')
  }
  if (input.status !== 'assessed') push(errors, 'status', 'Only status "assessed" is accepted.')
  if (input.clinicallyReviewed !== true) push(errors, 'clinicallyReviewed', 'The file is not marked clinically reviewed.')
  if (typeof input.reviewer !== 'string' || input.reviewer.trim().length < 2) {
    push(errors, 'reviewer', 'A reviewer name is required.')
  }
  if (!DATE_RE.test(input.reviewedAt || '')) push(errors, 'reviewedAt', 'reviewedAt must be YYYY-MM-DD.')
  if (typeof input.version !== 'string' || !input.version.trim()) push(errors, 'version', 'A version is required.')
  if (input.origin !== 'reviewed-dataset' || BANNED_ORIGINS.has(input.origin)) {
    push(errors, 'origin', 'Origin must be reviewed-dataset. Observations, fixtures, and inferences are rejected.')
  }

  const provenance = input.provenance
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    push(errors, 'provenance', 'Provenance is required.')
  } else {
    if (typeof provenance.title !== 'string' || provenance.title.trim().length < 2) {
      push(errors, 'provenance.title', 'A source title is required.')
    }
    if (!isHttps(provenance.url)) push(errors, 'provenance.url', 'Source URL must be https.')
    else if (isCalculatorUrl(provenance.url)) {
      push(errors, 'provenance.url', 'The Monash FODMAP Calculator terms do not allow this app to use extracted data.')
    }
    if (!DATE_RE.test(provenance.retrievedAt || '')) {
      push(errors, 'provenance.retrievedAt', 'retrievedAt must be YYYY-MM-DD.')
    }
    if (typeof provenance.license !== 'string' || provenance.license.trim().length < 2) {
      push(errors, 'provenance.license', 'A licence or redistribution note is required.')
    }
    if (provenance.kind && BANNED_ORIGINS.has(provenance.kind)) {
      push(errors, 'provenance.kind', 'This source kind cannot become a clinical list.')
    }
  }

  if (!Array.isArray(input.records) || input.records.length === 0) {
    push(errors, 'records', 'The file has no recipe records.')
  } else if (input.records.length > 500) {
    push(errors, 'records', 'Too many records.')
  } else {
    const seen = new Set()
    input.records.forEach((rec, i) => checkRecord(rec, i, seen, errors))
  }

  if (errors.length) return { ok: false, errors }
  return {
    ok: true,
    dataset: {
      schema: 'fredheim-fodmap-recipe-assessments',
      schemaVersion: 1,
      status: 'assessed',
      clinicallyReviewed: true,
      reviewer: input.reviewer.trim(),
      reviewedAt: input.reviewedAt,
      version: input.version.trim(),
      origin: 'reviewed-dataset',
      provenance: {
        title: input.provenance.title.trim(),
        url: input.provenance.url,
        retrievedAt: input.provenance.retrievedAt,
        license: input.provenance.license.trim(),
      },
      records: input.records.map(cleanRecord),
    },
  }
}

function cleanRecord(rec) {
  return {
    id: rec.id,
    recipeId: rec.recipeId,
    batchServings: rec.batchServings,
    servingsPerPerson: 1,
    suitability: rec.suitability,
    status: 'assessed',
    clinicallyReviewed: true,
    version: rec.version ? String(rec.version).trim() : undefined,
    lines: rec.lines.map(line => ({
      ingredient: line.ingredient,
      quantity: line.quantity,
      unit: normalizeUnit(line.unit),
      preparation: normalizePreparation(line.preparation || ''),
      note: typeof line.note === 'string' ? line.note.trim() : '',
    })),
  }
}

function checkRecord(rec, i, seen, errors) {
  const p = `records[${i}]`
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) {
    push(errors, p, 'Expected an object.')
    return
  }
  if (rec.trustedByApp != null || rec.testOnly === true || rec.fixture === true) {
    push(errors, p, 'A record cannot mark itself trusted or as a fixture.')
  }
  if (rec.origin && BANNED_ORIGINS.has(rec.origin)) {
    push(errors, `${p}.origin`, 'This record origin cannot become a clinical list.')
  }
  if (typeof rec.id !== 'string' || !rec.id.trim() || rec.id.length > 80) push(errors, `${p}.id`, 'Each record needs an id.')
  else if (seen.has(rec.id)) push(errors, `${p}.id`, 'Duplicate record id.')
  else seen.add(rec.id)
  if (typeof rec.recipeId !== 'string' || !rec.recipeId.trim()) push(errors, `${p}.recipeId`, 'recipeId is required.')
  if (typeof rec.batchServings !== 'number' || !Number.isInteger(rec.batchServings) || rec.batchServings <= 0) {
    push(errors, `${p}.batchServings`, 'batchServings must be a positive whole number.')
  }
  if (rec.servingsPerPerson !== 1) {
    push(errors, `${p}.servingsPerPerson`, 'Only one serving per person can be reviewed for the planner. Other amounts are not accepted.')
  }
  if (!SUITABILITY.has(rec.suitability)) push(errors, `${p}.suitability`, 'Suitability must be low, moderate, high, or unknown.')
  if (rec.status !== 'assessed' || rec.clinicallyReviewed !== true) {
    push(errors, `${p}.status`, 'Unreviewed records are rejected.')
  }
  if (!Array.isArray(rec.lines) || rec.lines.length === 0) {
    push(errors, `${p}.lines`, 'The reviewed ingredient lines are required.')
    return
  }
  rec.lines.forEach((line, n) => {
    const lp = `${p}.lines[${n}]`
    if (!line || typeof line !== 'object') {
      push(errors, lp, 'Expected an object.')
      return
    }
    if (typeof line.ingredient !== 'string' || !ID_RE.test(line.ingredient)) {
      push(errors, `${lp}.ingredient`, 'Each line needs a dictionary id. Free text and food groups are rejected.')
    }
    if (typeof line.quantity !== 'number' || !Number.isFinite(line.quantity) || line.quantity <= 0) {
      push(errors, `${lp}.quantity`, 'Quantity must be a number greater than 0.')
    }
    const unit = normalizeUnit(line.unit)
    if (!MEASURED.has(unit) && !COUNT_UNITS.has(unit)) {
      push(errors, `${lp}.unit`, 'Unit must be a weight, a volume, pcs, or clove.')
    }
    if (line.preparation != null && typeof line.preparation !== 'string') {
      push(errors, `${lp}.preparation`, 'Preparation must be text.')
    }
  })
  const ownError = errors.some(e => e.path === p || e.path.startsWith(`${p}.`))
  if (!ownError && !recordFingerprint(rec)) {
    push(errors, p, 'The lines do not describe a reviewable recipe.')
  }
}

/**
 * A well-formed file is still not a list this app will plan from.
 * No trusted source is configured.
 */
export function considerDatasetForPlanning(input) {
  const structural = validateDatasetStructure(input)
  if (!structural.ok) {
    return { acceptedForPlanning: false, structurallyValid: false, errors: structural.errors }
  }
  return {
    acceptedForPlanning: false,
    structurallyValid: true,
    reason: 'no-app-trusted-source',
    errors: [{
      path: '',
      message: 'The file is shaped correctly and is still not used. This app has no approved recipe list.',
    }],
  }
}

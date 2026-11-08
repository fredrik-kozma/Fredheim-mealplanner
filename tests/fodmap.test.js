// Optional low-FODMAP journal and the Make my week gate.
// Fixture numbers in this file are not measurements and are not installed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { makeMyWeek, buildPool, defaultAnswers, DAY_KEYS } from '../src/utils/makeMyWeek.js'
import { FREDHEIM_PACK_ID } from '../src/data/installedPacks.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'
import {
  assessReviewedRecipe, matchTolerance, recipeFingerprint, reviewedServingPerPerson,
} from '../src/utils/fodmap/assessment.js'
import { considerDatasetForPlanning, validateDatasetStructure } from '../src/utils/fodmap/dataset.js'
import { PRODUCTION_DATASET, } from '../src/utils/fodmap/productionDataset.js'
import { productionPlanningDataset } from '../src/utils/fodmap/planning.js'
import {
  addChallenge, addCheckIn, addTolerance, deleteTolerance, emptyJournal, enableJournal,
  localDateInZone, localDateOfInput, normalizeJournal, recordChallengeOutcome,
  resetJourney, setEligibility, startBaseline, startReintroduction, startTrial,
  submitReview, undoToleranceChange, updateTolerance,
} from '../src/utils/fodmap/journal.js'
import { FODMAP_IDB_KEY, clearJournal, loadJournal, saveJournal } from '../src/utils/fodmap/storage.js'
import { buildBackup } from '../src/utils/dataBackup.js'
import { clearLocalAccountData, IDB_STORE_KEY } from '../src/utils/clearLocalAccountData.js'
import draftPacket from '../docs/fodmap-draft-audit/candidates.json'

const ALL = Object.values(BUILT_IN_PACKS).flatMap(p => p.recipes.map(r => ({ ...r, sourcePackId: p.id })))

function line(ingredient, quantity, unit, preparation = 'cooked', note = '') {
  return { ingredient, quantity, unit, preparation, note }
}

function dish(id, lines, extra = {}) {
  return {
    id,
    title: id,
    sourcePackId: FREDHEIM_PACK_ID,
    servings: extra.servings || 2,
    servingWeightGrams: 300,
    category: extra.category || 'Main',
    mealTypes: extra.mealTypes || ['dinner'],
    prepTime: 10,
    cookTime: 10,
    tags: extra.tags || ['oil-free'],
    nutrition: { perServing: { calories: extra.kcal ?? 100, fiber: 4, totalSugars: 1, sodium: 80 } },
    ingredients: lines,
  }
}

function recordFor(recipe, overrides = {}) {
  return {
    id: `rec-${recipe.id}`,
    recipeId: recipe.id,
    batchServings: recipe.servings,
    servingsPerPerson: 1,
    suitability: 'low',
    status: 'assessed',
    clinicallyReviewed: true,
    lines: recipe.ingredients.map(row => ({
      ingredient: row.ingredient,
      quantity: row.quantity,
      unit: row.unit,
      preparation: row.preparation || '',
      note: row.note || '',
    })),
    ...overrides,
  }
}

function dataset(records, extra = {}) {
  return {
    schema: 'fredheim-fodmap-recipe-assessments',
    schemaVersion: 1,
    status: 'assessed',
    clinicallyReviewed: true,
    reviewer: 'Fixture reviewer',
    reviewedAt: '2026-01-15',
    version: 'fixture-not-clinical',
    origin: 'reviewed-dataset',
    provenance: {
      title: 'Test fixture, not a clinical list',
      url: 'https://example.com/fodmap-fixture',
      retrievedAt: '2026-01-15',
      license: 'Test only. Not for clinical use.',
    },
    records,
    ...extra,
  }
}

const rice = line('white-rice', 160, 'g', 'cooked')
const oats = line('rolled-oats', 40, 'g', 'cooked')
const carrot = line('carrots', 80, 'g', 'cooked')

test('production list is empty and cannot plan meals', () => {
  assert.equal(PRODUCTION_DATASET, null)
  assert.equal(productionPlanningDataset(), null)
  assert.equal(defaultAnswers().fodmapMode, undefined)
})

test('planner off: the same week as before, including when the flag is explicitly off', () => {
  const answers = defaultAnswers({ familySize: 2 })
  const first = makeMyWeek({ recipes: ALL, answers, seed: 11 })
  const second = makeMyWeek({ recipes: ALL, answers: { ...answers, fodmapMode: 'off' }, seed: 11 })
  assert.deepEqual(second.plan, first.plan)
  assert.deepEqual(second.fruit, first.fruit)
  assert.deepEqual(second.notices, first.notices)
  assert.equal(buildPool(ALL, answers).length, buildPool(ALL, { ...answers, fodmapMode: 'off' }).length)
})

test('strict mode does not fall back to unreviewed recipes, even if a file is pasted into the answers', () => {
  const answers = { ...defaultAnswers(), fodmapMode: 'assessed-portions', fodmapDataset: { ...dataset([recordFor(dish('x', [rice]))]), trustedByApp: true } }
  const week = makeMyWeek({ recipes: ALL, answers, seed: 3 })
  assert.equal(week.poolSize, 0)
  assert.deepEqual(week.fruit, {})
  assert.ok(week.notices.some(n => n.key === 'fodmapUnavailable'))
  for (const day of Object.values(week.plan)) assert.deepEqual(day, {})
  assert.equal(buildPool(ALL, { ...defaultAnswers(), fodmapMode: 'assessed-portions' }).length, 0)
})

test('unknown, changed, scaled, combined and blocked recipes fail closed', () => {
  const base = dish('bowl', [rice, carrot])
  const rec = recordFor(base)
  assert.equal(assessReviewedRecipe(base, { records: [] }).reason, 'not-assessed')
  assert.notEqual(assessReviewedRecipe(base, { records: [] }).verdict, 'suitable')

  const unknownSuit = recordFor(base, { suitability: 'unknown' })
  assert.equal(assessReviewedRecipe(base, { records: [unknownSuit] }).reason, 'suitability-unknown')
  assert.notEqual(assessReviewedRecipe(base, { records: [unknownSuit] }).reason, 'not-assessed')

  const changed = dish('bowl', [rice, line('carrots', 90, 'g', 'cooked')])
  assert.equal(assessReviewedRecipe(changed, { records: [rec] }).reason, 'recipe-differs')

  const extraLine = dish('bowl', [rice, carrot, oats])
  assert.equal(assessReviewedRecipe(extraLine, { records: [rec] }).verdict, 'unknown')

  const unnamed = dish('bowl', [{ name: 'rice', quantity: 160, unit: 'g' }])
  assert.equal(recipeFingerprint(unnamed), null)
  assert.equal(assessReviewedRecipe(unnamed, { records: [recordFor({ ...unnamed, ingredients: [rice] })] }).reason, 'not-assessed')

  assert.equal(assessReviewedRecipe(base, { portionsPerPerson: 2, records: [rec] }).reason, 'serving-differs')
  assert.equal(assessReviewedRecipe(base, { portionsPerPerson: 0.5, records: [rec] }).reason, 'serving-differs')
  assert.equal(assessReviewedRecipe(base, { portionsPerPerson: 1, records: [rec] }).verdict, 'suitable')
  // A larger batch with the same amount on each plate is still that serving.
  const doubled = dish('bowl', [
    line('white-rice', 320, 'g', 'cooked'),
    line('carrots', 160, 'g', 'cooked'),
  ], { servings: 4 })
  assert.equal(recipeFingerprint(doubled), recipeFingerprint(base))
  assert.equal(assessReviewedRecipe(doubled, { records: [rec] }).verdict, 'suitable')
  // The same pan, but twice as much on the plate, is a different portion.
  const heavier = dish('bowl', [
    line('white-rice', 320, 'g', 'cooked'),
    line('carrots', 160, 'g', 'cooked'),
  ])
  assert.equal(assessReviewedRecipe(heavier, { records: [rec] }).reason, 'recipe-differs')
  const otherPrep = dish('bowl', [line('white-rice', 160, 'g', 'raw'), carrot])
  assert.notEqual(assessReviewedRecipe(otherPrep, { records: [rec] }).verdict, 'suitable')
  assert.equal(assessReviewedRecipe(base, { records: [rec] }).certifiesMeal, false)
  assert.equal(assessReviewedRecipe(base, { records: [rec] }).stacking, 'not-assessed')

  const tagged = dish('bowl', [rice, carrot], { tags: ['oil-free', 'gluten-free'] })
  assert.equal(assessReviewedRecipe(tagged, { records: [] }).verdict, 'unknown')

  const blocked = assessReviewedRecipe(dish('tofu-bowl', [line('tofu', 100, 'g', 'cooked')]), {
    records: [recordFor(dish('tofu-bowl', [line('tofu', 100, 'g', 'cooked')]))],
    blocked: { groups: ['soy'], ids: [] },
  })
  assert.equal(blocked.verdict, 'excluded')
  assert.equal(blocked.reason, 'blocked')

  const swapped = dish('milk-bowl', [line('plant-milk', 200, 'ml', 'cold')])
  const swap = assessReviewedRecipe(swapped, {
    records: [recordFor(swapped)],
    blocked: { groups: ['soy'], ids: [] },
  })
  assert.equal(swap.verdict, 'not-suitable')
  assert.equal(swap.reason, 'substituted')
  assert.equal(reviewedServingPerPerson(swapped, [recordFor(swapped)], { groups: ['soy'], ids: [] }), 0)
})

test('a personal note does not approve a dish, a group, a larger amount, or another preparation', () => {
  const notes = [{
    id: 'n1', ingredientId: 'rolled-oats', preparation: 'cooked', amount: 40, unit: 'g',
    outcome: 'tolerated', source: 'user-observation', group: 'grains',
  }]
  const hit = matchTolerance(notes, { ingredientId: 'rolled-oats', preparation: 'cooked', amount: 40, unit: 'g' })
  assert.equal(hit.matched, true)
  assert.equal(hit.approvesRecipe, false)
  assert.equal(hit.certifies, false)
  assert.equal(hit.generalizesGroup, false)
  assert.equal(matchTolerance(notes, { ingredientId: 'rolled-oats', preparation: 'cooked', amount: 0.04, unit: 'kg' }).matched, true)
  assert.equal(matchTolerance(notes, { ingredientId: 'rolled-oats', preparation: 'cooked', amount: 80, unit: 'g' }).matched, false)
  assert.equal(matchTolerance(notes, { ingredientId: 'rolled-oats', preparation: 'raw', amount: 40, unit: 'g' }).matched, false)
  assert.equal(matchTolerance(notes, { ingredientId: 'oat-flour', preparation: 'cooked', amount: 40, unit: 'g' }).matched, false)
  const recipe = dish('oat-bowl', [oats, carrot])
  const verdict = assessReviewedRecipe(recipe, { records: [] })
  assert.equal(verdict.verdict, 'unknown')
  assert.equal(verdict.fromTolerance, false)
})

test('a reviewed serving can fill a week without scaling, and unreviewed dishes stay out', () => {
  const reviewed = []
  const recipes = []
  for (let i = 0; i < 4; i++) {
    const recipe = dish(`main-${i}`, [line('white-rice', 160 + i, 'g', 'cooked'), carrot], { kcal: 100 })
    recipes.push(recipe)
    reviewed.push(recordFor(recipe))
  }
  const stranger = dish('stranger', [line('white-rice', 300, 'g', 'cooked')])
  recipes.push(stranger)
  const changed = dish('main-0', [line('white-rice', 10, 'g', 'cooked'), carrot])
  changed.id = 'main-changed'
  recipes.push(changed)

  const file = dataset(reviewed)
  const trusted = { ...file, trustedByApp: true }
  const answers = { ...defaultAnswers({ familySize: 2 }), fodmapMode: 'assessed-portions', meals: 1, kcal: 4000, goals: [] }
  const week = makeMyWeek({ recipes, answers, seed: 2, assessmentDataset: trusted })
  assert.ok(week.poolSize >= 4)
  assert.ok(week.poolSize < recipes.length)
  assert.deepEqual(week.fruit, {})
  assert.equal(week.fodmap, undefined)
  const items = Object.values(week.plan).flatMap(day => Object.values(day).flat())
  assert.ok(items.length > 0)
  for (const item of items) {
    assert.equal(item.servings, null)
    assert.notEqual(item.recipeId, 'stranger')
    assert.notEqual(item.recipeId, 'main-changed')
  }
  assert.ok(week.notices.some(n => n.key === 'fodmapPortionFilter'))

  const open = makeMyWeek({ recipes, answers: { ...answers, fodmapMode: 'off', kcal: 4000, meals: 1 }, seed: 2 })
  const openItems = Object.values(open.plan).flatMap(day => Object.values(day).flat())
  assert.ok(openItems.some(item => item.servings != null && item.servings > 2))
})

test('fasting week is not relabelled as low FODMAP', () => {
  const week = makeMyWeek({
    recipes: ALL,
    answers: { ...defaultAnswers(), goal: 'fmd', fodmapMode: 'assessed-portions' },
    seed: 1,
  })
  assert.equal(week.kind, 'fmd')
  assert.ok(week.notices.some(n => n.key === 'fodmapNotAppliedToFmd'))
})

test('imports reject fixtures, observations, calculator extracts, and self-trust', () => {
  const recipe = dish('bowl', [rice])
  const good = dataset([recordFor(recipe)])
  const ok = validateDatasetStructure(good)
  assert.equal(ok.ok, true)
  assert.equal(considerDatasetForPlanning(good).acceptedForPlanning, false)
  assert.equal(considerDatasetForPlanning(good).structurallyValid, true)

  assert.equal(validateDatasetStructure({ ...good, trustedByApp: true }).ok, false)
  assert.equal(validateDatasetStructure({ ...good, origin: 'fixture', fixture: true }).ok, false)
  assert.equal(validateDatasetStructure({ ...good, origin: 'user-observation' }).ok, false)
  assert.equal(validateDatasetStructure({ ...good, origin: 'nutrition-inference' }).ok, false)
  assert.equal(validateDatasetStructure({
    ...good,
    provenance: { ...good.provenance, url: 'https://www.monashfodmapcalculator.com.au/terms' },
  }).ok, false)
  assert.equal(validateDatasetStructure({ ...good, records: [{ ...good.records[0], lines: [{ ingredient: 'White rice', quantity: 1, unit: 'g' }] }] }).ok, false)
  assert.equal(validateDatasetStructure({ ...good, records: [{ ...good.records[0], suitability: 'low', status: 'unreviewed', clinicallyReviewed: false }] }).ok, false)
  assert.equal(validateDatasetStructure({ ...good, records: [{ ...good.records[0], servingsPerPerson: 2 }] }).ok, false)
  assert.equal(validateDatasetStructure(null).ok, false)
  assert.equal(validateDatasetStructure({ ...good, records: [] }).ok, false)
})

test('journal: eligibility gate, day boundary, phase on the check-in, undo, and no stricter follow-up', () => {
  let state = enableJournal(emptyJournal(), '2026-03-01T08:00:00Z')
  assert.equal(startTrial(state, { startedOn: '2026-03-01', reviewOn: '2026-03-29', at: '2026-03-01T08:00:00Z' }).ok, false)

  state = setEligibility(state, {
    disclaimerAck: true,
    adultAssessedIbs: true,
    coeliacAck: true,
    noHomeAllergyChallenge: true,
    pregnant: true,
  })
  assert.equal(startTrial(state, { startedOn: '2026-03-01', reviewOn: '2026-03-29', at: '2026-03-01T08:00:00Z' }).reason, 'pregnancy')
  state = setEligibility(state, { pregnant: false, child: true })
  assert.equal(startTrial(state, { startedOn: '2026-03-01', reviewOn: '2026-03-29', at: '2026-03-01T08:00:00Z' }).reason, 'child')
  state = setEligibility(state, { child: false, redFlags: { bleeding: true } })
  assert.equal(startTrial(state, { startedOn: '2026-03-01', reviewOn: '2026-03-29', at: '2026-03-01T08:00:00Z' }).reason, 'red-flag')
  state = setEligibility(state, { redFlags: { bleeding: false } })

  const baseline = startBaseline(state, '2026-03-01T08:00:00Z')
  state = baseline.state
  const early = addCheckIn(state, { food: 'Oats', at: '2026-03-08T23:30', localDate: localDateOfInput('2026-03-08T23:30'), pain: 'mild' })
  assert.equal(early.ok, true)
  assert.equal(early.checkIn.localDate, '2026-03-08')
  assert.equal(early.checkIn.phase, 'baseline')
  state = early.state

  const midnight = localDateOfInput('2026-03-09T00:30')
  assert.equal(midnight, '2026-03-09')
  assert.equal(localDateInZone('2026-03-08T23:30:00Z', 'Europe/Oslo'), '2026-03-09')
  assert.equal(localDateInZone('2026-03-08T22:30:00Z', 'Europe/Oslo'), '2026-03-08')

  assert.equal(startTrial(state, { startedOn: '2026-03-01', reviewOn: '2026-03-10', at: '2026-03-01T09:00:00Z' }).reason, 'review-window')
  const trial = startTrial(state, { startedOn: '2026-03-01', reviewOn: '2026-03-29', at: '2026-03-01T09:00:00Z' })
  assert.equal(trial.ok, true)
  state = trial.state
  const during = addCheckIn(state, { food: 'Rice', at: '2026-03-09T00:30', amount: 150, unit: 'g' })
  assert.equal(during.checkIn.phase, 'trial')
  assert.equal(during.checkIn.localDate, '2026-03-09')
  state = during.state
  assert.equal(state.checkIns[0].phase, 'baseline')

  const later = submitReview(state, 'later', '2026-03-29T10:00:00Z')
  assert.equal(later.state.phase, 'trial')
  assert.equal(later.state.trial.reviewOn, '2026-03-29')
  assert.equal(later.state.trial.lastPrompt, 'no-response')
  const stopped = submitReview(state, 'not-improved', '2026-03-29T10:00:00Z')
  assert.equal(stopped.state.phase, 'off')
  assert.equal(stopped.state.trial.lastPrompt, 'reassess')
  assert.equal(stopped.state.trial.symptomChange, 'not-improved')
  assert.equal(stopped.state.tolerances.length, 0)

  const improved = submitReview(trial.state, 'improved', '2026-03-29T10:00:00Z')
  const reintro = startReintroduction(improved.state, '2026-03-30T10:00:00Z')
  assert.equal(reintro.ok, true)
  const challenge = addChallenge(reintro.state, {
    foodLabel: 'Rolled oats',
    preparation: 'cooked',
    doses: [{ day: 1, amountText: 'from my sheet', unit: '' }],
  })
  assert.equal(challenge.ok, true)
  assert.equal(challenge.state.challenges[0].guidanceSource, 'user-defined')
  assert.equal(challenge.state.challenges[0].unreviewed, true)
  assert.equal(challenge.state.challenges[0].protocolId, null)
  assert.equal(addChallenge(challenge.state, { foodLabel: 'Other', preparation: 'cooked' }).reason, 'one-at-a-time')
  const outcome = recordChallengeOutcome(challenge.state, challenge.state.challenges[0].id, 'limit')
  assert.equal(outcome.state.challenges[0].userOutcome, 'limit')
  assert.equal(outcome.state.tolerances.length, 0)

  const noted = addTolerance(outcome.state, {
    foodLabel: 'Rolled oats', ingredientId: 'rolled-oats', preparation: 'cooked', amount: 40, unit: 'g', outcome: 'tolerated',
  })
  const edited = updateTolerance(noted.state, noted.state.tolerances[0].id, { amount: 30 })
  const removed = deleteTolerance(edited.state, edited.state.tolerances[0].id)
  assert.equal(removed.state.tolerances.length, 0)
  const undone = undoToleranceChange(removed.state)
  assert.equal(undone.state.tolerances.length, 1)
  assert.equal(undone.state.tolerances[0].amount, 30)
  assert.equal(undone.state.tolerances[0].source, 'user-observation')

  const wiped = resetJourney(undone.state)
  assert.equal(wiped.enabled, true)
  assert.equal(wiped.checkIns.length, 0)
  assert.equal(wiped.tolerances.length, 0)
  assert.equal(wiped.eligibility.adultAssessedIbs, true)
})

test('the journal persists locally, reloads, and a bad blob cannot become a review', async () => {
  const memory = new Map()
  const adapter = {
    getItem: async key => memory.get(key) ?? null,
    setItem: async (key, value) => { memory.set(key, value) },
    removeItem: async key => { memory.delete(key) },
  }
  let state = enableJournal(emptyJournal(), '2026-04-01T00:00:00Z')
  const added = addCheckIn(state, { food: 'Rice', at: '2026-04-01T12:00', pain: 'none' })
  await saveJournal(added.state, adapter)
  const loaded = await loadJournal(adapter)
  assert.equal(loaded.checkIns[0].food, 'Rice')
  assert.equal(loaded.enabled, true)
  memory.set(FODMAP_IDB_KEY, JSON.stringify({
    enabled: true,
    phase: 'trial',
    checkIns: [{ id: 'x', food: 'Soup', localDate: '2026-04-02', phase: 'trial' }],
    dataset: dataset([recordFor(dish('bowl', [rice]))]),
    challenges: [{ id: 'c', foodLabel: 'Oats', preparation: 'cooked', protocolId: 'invented', clinicallyReviewed: true, guidanceSource: 'reviewed-protocol' }],
  }))
  const cleaned = await loadJournal(adapter)
  assert.equal(cleaned.dataset, undefined)
  assert.equal(cleaned.challenges[0].protocolId, null)
  assert.equal(cleaned.challenges[0].guidanceSource, 'user-defined')
  assert.equal(cleaned.challenges[0].unreviewed, true)
  await clearJournal(adapter)
  assert.equal(memory.has(FODMAP_IDB_KEY), false)
  assert.deepEqual(normalizeJournal({ phase: 'diagnosed' }).phase, 'off')
})

test('symptom notes are not in the backup, not cleared only from the meal store, and not sent', async () => {
  const backup = buildBackup({
    recipes: [],
    fodmap: { checkIns: [{ food: 'secret' }] },
    checkIns: [{ food: 'secret' }],
  })
  assert.equal(backup.data.fodmap, undefined)
  assert.equal(backup.data.checkIns, undefined)
  assert.equal(JSON.stringify(backup).includes('secret'), false)

  const removed = []
  await clearLocalAccountData({
    localStorage: { removeItem() {} },
    sessionStorage: { removeItem() {} },
    storage: { removeItem: async key => { removed.push(key) } },
  })
  assert.ok(removed.includes(IDB_STORE_KEY))
  assert.ok(removed.includes(FODMAP_IDB_KEY))

  const files = [
    ...readdirSync(new URL('../src/utils/fodmap/', import.meta.url)).map(name => `../src/utils/fodmap/${name}`),
    '../src/pages/FodmapPage.jsx',
  ]
  for (const rel of files) {
    const text = readFileSync(new URL(rel, import.meta.url), 'utf8')
    assert.equal(/\bfetch\s*\(/.test(text), false, rel)
    assert.equal(/supabase/i.test(text), false, rel)
    assert.equal(/sendBeacon/.test(text), false, rel)
    assert.equal(/console\./.test(text), false, rel)
    assert.equal(/gtag|analytics/i.test(text), false, rel)
  }
})

test('the draft audit packet is not a recipe pack and cannot plan a week', () => {
  assert.equal(draftPacket.recipes.length, 8)
  assert.equal(draftPacket.recipes.filter(r => r.meal_type === 'breakfast').length, 2)
  assert.equal(draftPacket.recipes.filter(r => r.meal_type === 'main').length, 6)
  const soy = []
  for (const recipe of draftPacket.recipes) {
    assert.equal(recipe.eligible_for_trial_menu, false)
    assert.equal(recipe.low_fodmap_status, null)
    assert.equal(recipe.meal_fodmap_assessment, null)
    assert.equal(recipe.nutrients_per_serving, null)
    assert.equal(recipe.clinical_review_status, 'not_reviewed')
    assert.equal(recipe.allergy_safety_verified, false)
    for (const row of recipe.ingredients) {
      assert.equal(row.fodmap_classification, null)
      assert.equal(row.fodmap_grams_per_serving, null)
      assert.equal(row.brand, null)
    }
    if ((recipe.allergens_present || []).includes('soy')) soy.push(recipe.id)
  }
  assert.deepEqual(soy, ['B02', 'M01', 'M02', 'M03', 'M05', 'M06'])
  // Missing stays null. A reported zero stays zero. Lentils are not padded with zeros.
  assert.equal(draftPacket.ingredient_evidence['rolled oats'].published_values_g_per_100g, null)
  assert.equal(draftPacket.ingredient_evidence.water.published_values_g_per_100g, null)
  assert.equal(draftPacket.ingredient_evidence['olive oil'].published_values_g_per_100g, null)
  assert.equal(draftPacket.ingredient_evidence.orange.published_values_g_per_100g.excess_fructose, 0)
  assert.equal(draftPacket.ingredient_evidence.orange.published_values_g_per_100g.fructan, 0.03)
  assert.deepEqual(Object.keys(draftPacket.ingredient_evidence['green lentils'].published_values_g_per_100g), ['GOS'])
  assert.equal(draftPacket.ingredient_evidence.water.clinical_status, 'unassessed')
  assert.equal(draftPacket.ingredient_evidence['olive oil'].clinical_status, 'unassessed')

  const considered = considerDatasetForPlanning(draftPacket)
  assert.equal(considered.acceptedForPlanning, false)
  assert.equal(considered.structurallyValid, false)
  const week = makeMyWeek({
    recipes: ALL,
    answers: { ...defaultAnswers(), fodmapMode: 'assessed-portions' },
    seed: 1,
    assessmentDataset: { ...draftPacket, trustedByApp: true },
  })
  assert.equal(week.poolSize, 0)
  assert.ok(week.notices.some(n => n.key === 'fodmapUnavailable'))
  const titles = new Set(ALL.map(r => r.title))
  for (const recipe of draftPacket.recipes) assert.equal(titles.has(recipe.title), false)
})

test('day keys stay a week when the low-FODMAP week is empty', () => {
  const week = makeMyWeek({
    recipes: [],
    answers: { ...defaultAnswers(), fodmapMode: 'assessed-portions' },
    seed: 1,
  })
  assert.deepEqual(Object.keys(week.plan), DAY_KEYS)
})

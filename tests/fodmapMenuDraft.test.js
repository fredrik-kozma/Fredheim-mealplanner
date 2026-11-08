// The cooked week is a draft. It must not become a low-FODMAP planning source.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import draft from '../docs/fodmap-draft-menu/menu.json'
import { considerDatasetForPlanning } from '../src/utils/fodmap/dataset.js'
import { productionPlanningDataset } from '../src/utils/fodmap/planning.js'
import { PRODUCTION_DATASET } from '../src/utils/fodmap/productionDataset.js'
import { makeMyWeek, defaultAnswers } from '../src/utils/makeMyWeek.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'

const ALL = Object.values(BUILT_IN_PACKS).flatMap(p => p.recipes.map(r => ({ ...r, sourcePackId: p.id })))
const BANNED = ['onions', 'red-onions', 'garlic', 'garlic-powder', 'onion-powder', 'chili-flakes', 'black-pepper']

test('the week draft stays ineligible and the ordinary planner is untouched', () => {
  assert.equal(PRODUCTION_DATASET, null)
  assert.equal(productionPlanningDataset(), null)
  assert.equal(draft.eligible_for_trial_menu, false)
  assert.equal(draft.low_fodmap_status, null)
  assert.equal(draft.clinical_review_status, 'not_reviewed')
  assert.equal(draft.recipes.length, 15)
  assert.equal(draft.recipes.filter(r => r.meal === 'breakfast').length, 4)
  assert.equal(draft.recipes.filter(r => r.meal === 'dinner').length, 7)
  assert.equal(draft.soyFreeWeek, 'not_provided')
  assert.equal(draft.week.length, 7)
  for (const day of draft.week) {
    assert.ok(day.drink && day.side && day.snack)
    assert.ok(day.fullLow.core.kcal >= 1900, day.day)
    assert.ok(day.fullLow.core.protein >= 60, day.day)
  }

  for (const recipe of draft.recipes) {
    assert.equal(recipe.eligible_for_trial_menu, false)
    assert.equal(recipe.eligible_for_make_my_week_fodmap_mode, false)
    assert.equal(recipe.low_fodmap_status, null)
    assert.equal(recipe.clinical_review_status, 'not_reviewed')
    assert.ok(recipe.nutrients_per_serving_low_salt.kcal > 0)
    for (const row of recipe.ingredients) assert.equal(BANNED.includes(row.ingredient), false)
  }

  const titles = new Set(ALL.map(r => r.title))
  for (const recipe of draft.recipes) assert.equal(titles.has(recipe.title), false)

  const considered = considerDatasetForPlanning({ ...draft, trustedByApp: true })
  assert.equal(considered.acceptedForPlanning, false)
  assert.equal(considered.structurallyValid, false)

  const blocked = makeMyWeek({
    recipes: ALL,
    answers: { ...defaultAnswers(), fodmapMode: 'assessed-portions' },
    seed: 4,
    assessmentDataset: { ...draft, trustedByApp: true },
  })
  assert.equal(blocked.poolSize, 0)
  assert.ok(blocked.notices.some(n => n.key === 'fodmapUnavailable'))

  const plain = makeMyWeek({ recipes: ALL, answers: defaultAnswers(), seed: 4 })
  const plainAgain = makeMyWeek({ recipes: ALL, answers: { ...defaultAnswers(), fodmapMode: 'off' }, seed: 4 })
  assert.deepEqual(plain.plan, plainAgain.plan)
  assert.ok(plain.poolSize > 0)
})

test('menu markdown matches the computed packet and is not a pack file', () => {
  const md = readFileSync(new URL('../docs/fodmap-draft-menu/MENU.md', import.meta.url), 'utf8')
  assert.match(md, /low-FODMAP Make my week mode/)
  assert.match(md, /Friday/)
  const monday = draft.week.find(d => d.day === 'Monday')
  assert.match(md, new RegExp(String(Math.round(monday.fullLow.core.kcal))))
  assert.match(md, /not provided/)
  assert.match(md, /Iodine is absent/)
  const packs = readFileSync(new URL('../recipe-packs-template/registry.json', import.meta.url), 'utf8')
  assert.equal(packs.includes('Lemon tofu and potato skillet'), false)
})

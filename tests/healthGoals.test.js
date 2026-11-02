import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  goalFit, evaluateRule, goalTargetRules, coverageRows, goalTiltBonus,
  NNR_ADULT, SUPPLEMENT_NOTE_NUTRIENTS,
} from '../src/utils/healthGoals.js'

test('BP goal: sodium green <1500, amber 1500-2000, red >2000', () => {
  const rules = goalTargetRules('bloodPressure', {})
  const na = rules.find(r => r.key === 'sodium')
  assert.equal(na.kind, 'maxBand')
  assert.equal(na.target, 1500)
  assert.equal(na.amberMax, 2000)
  assert.equal(evaluateRule(na, { sodium: 1400 }).status, 'green')
  assert.equal(evaluateRule(na, { sodium: 1500 }).status, 'amber')
  assert.equal(evaluateRule(na, { sodium: 1800 }).status, 'amber')
  assert.equal(evaluateRule(na, { sodium: 2000 }).status, 'amber')
  assert.equal(evaluateRule(na, { sodium: 2001 }).status, 'red')
})

test('general coverage sodium cap stays WHO 2000 mg', () => {
  const rows = coverageRows({ sodium: 1900, calories: 2000, fiber: 30 })
  const na = rows.find(r => r.key === 'sodium')
  assert.equal(na.target, 2000)
  assert.equal(na.status, 'green')
  const high = coverageRows({ sodium: 2400, calories: 2000, fiber: 30 }).find(r => r.key === 'sodium')
  assert.equal(high.status, 'red')
})

test('heart goal sat fat uses 7% of energy', () => {
  const rules = goalTargetRules('heart', { kcalTarget: 2000 })
  const sat = rules.find(r => r.key === 'saturatedFat')
  assert.ok(Math.abs(sat.target - (0.07 * 2000) / 9) < 0.01)
})

test('gut goal requires 30 g fibre', () => {
  const fit = goalFit(['gut'], { fiber: 32, calories: 2000 })
  assert.equal(fit[0].status, 'green')
  const low = goalFit(['gut'], { fiber: 10, calories: 2000 })
  assert.equal(low[0].status, 'red')
})

test('diabetes fibre density 14 g/1000 kcal', () => {
  const fit = goalFit(['diabetes'], { fiber: 28, calories: 2000, addedSugar: 10, saturatedFat: 10 })
  const dens = fit[0].checks.find(c => c.key === 'fiberDensity')
  assert.equal(dens.status, 'green')
})

test('coverageRows: caps and supplement never red for B12', () => {
  const rows = coverageRows({ sodium: 1500, vitaminB12: 0.2, fiber: 30, calories: 2000 })
  const na = rows.find(r => r.key === 'sodium')
  assert.equal(na.mode, 'cap')
  assert.equal(na.status, 'green')
  const b12 = rows.find(r => r.key === 'vitaminB12')
  assert.equal(b12.status, 'supplement')
  assert.ok(SUPPLEMENT_NOTE_NUTRIENTS.has('vitaminB12'))
  assert.ok(NNR_ADULT.vitaminB12 === 4)
  assert.ok(NNR_ADULT.vitaminD === 10)
})

test('goalTiltBonus prefers labelled + high-fibre for gut', () => {
  const labelled = goalTiltBonus({ tags: ['blood-pressure-friendly'], nutrition: { perServing: { fiber: 2, calories: 200, sodium: 100 } } }, ['bloodPressure'])
  const unlabelled = goalTiltBonus({ tags: [], nutrition: { perServing: { fiber: 2, calories: 200, sodium: 100 } } }, ['bloodPressure'])
  assert.ok(labelled > unlabelled)
  const fibrous = goalTiltBonus({ tags: [], nutrition: { perServing: { fiber: 12, calories: 200 } } }, ['gut'])
  const lowFib = goalTiltBonus({ tags: [], nutrition: { perServing: { fiber: 1, calories: 200 } } }, ['gut'])
  assert.ok(fibrous > lowFib)
})

test('coverage row units match nutrition DB (mg/µg/g)', () => {
  const rows = coverageRows({ vitaminC: 100, iron: 9, folate: 300, protein: 60, sodium: 1000, calories: 2000, fiber: 30 })
  const by = Object.fromEntries(rows.map(r => [r.key, r.unit]))
  assert.equal(by.vitaminC, 'mg')
  assert.equal(by.iron, 'mg')
  assert.equal(by.folate, 'µg')
  assert.equal(by.protein, 'g')
  assert.equal(by.sodium, 'mg')
  assert.equal(by.calories, 'kcal')
  assert.equal(by.fiber, 'g')
  assert.equal(by.omega3, 'g')
  assert.equal(by.vitaminB12, 'µg')
  assert.equal(by.vitaminD, 'µg')
})

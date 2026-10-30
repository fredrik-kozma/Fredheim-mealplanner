// Run with: npm test  (Node's built-in runner, no dependencies)
// Good-for labels, meal types, portions and per-serving nutrition in the
// three built-in packs (written by scripts/apply_recipe_proposals.mjs).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CONDITION_TAGS, CONDITION_CHIP_ACTIVE, CONDITION_BADGE, MEAL_TYPES } from '../src/data/conditionTags.js'
import { PORTIONS, SODIUM_FROM_INGREDIENTS } from '../scripts/fix_portions_and_sodium.mjs'
import { APPLIED_IDS as SALTY_MAINS } from '../scripts/apply_salty_mains.mjs'
import { analyzeRecipe } from '../scripts/lib/recipeLabels.mjs'
import { loadPacks } from '../scripts/check-recipes.mjs'

const PACKS = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
const recipes = PACKS.flatMap(id => JSON.parse(readFileSync(`recipe-packs-template/packs/${id}.json`, 'utf8')).recipes)
const locales = Object.fromEntries(['en', 'no', 'sv'].map(l => [l, JSON.parse(readFileSync(`src/i18n/locales/${l}.json`, 'utf8'))]))
const LABEL_IDS = new Set(CONDITION_TAGS.map(c => c.id))
// Applied by scripts/apply_recipe_adaptations.mjs (doctor-approved).
const ADAPTED = ['dal-stew', 'stuffed-paprika-with-tofu', 'tofu-form', 'kidney-bean-stew', 'lentil-lap-stew',
  'sweet-yellow-pea-soup', 'fr-23', 'oat-burger', 'black-bean-stew', 'creamy-red-lentil-stew', 'red-lentil-soup',
  'red-beet-burger', 'orn-20']
const ADAPTED_LABELS_LOST = { 'dal-stew': ['blood-pressure-friendly'] }
// Servings or sodium corrected by scripts/fix_portions_and_sodium.mjs, and the
// salt cuts / oil-free methods of scripts/apply_salty_mains.mjs and
// scripts/fix_porridge_liquid_and_salty_sides.mjs and
// scripts/fix_onion_pie_salt.mjs: labels re-derived.
const SALTY_SIDES = ['fr-104', 'fr-113', 'seasoned-baked-potatoes', 'fr-114', 'fr-38']
const REPORTIONED = new Set([...Object.keys(PORTIONS), ...SODIUM_FROM_INGREDIENTS, ...SALTY_MAINS, ...SALTY_SIDES])

test('every good-for label has a style and a name in en, no and sv', () => {
  for (const c of CONDITION_TAGS) {
    assert.ok(CONDITION_CHIP_ACTIVE[c.color] && CONDITION_BADGE[c.color], `${c.id}: no classes for ${c.color}`)
    for (const [lang, j] of Object.entries(locales)) assert.ok(j.conditions[c.id], `${lang}: conditions.${c.id}`)
  }
  for (const m of MEAL_TYPES) for (const [lang, j] of Object.entries(locales)) assert.ok(j.mealTypes?.[m], `${lang}: mealTypes.${m}`)
  for (const [lang, j] of Object.entries(locales)) assert.match(j.recipeDetail.portion, /\{\{portion\}\}/, lang)
})

test('built-in recipes carry known meal types and keep their other tags', () => {
  for (const r of recipes) {
    assert.ok(Array.isArray(r.mealTypes) && r.mealTypes.length, `${r.id}: mealTypes`)
    for (const m of r.mealTypes) assert.ok(MEAL_TYPES.includes(m), `${r.id}: unknown meal type ${m}`)
    assert.equal(new Set(r.tags).size, r.tags.length, `${r.id}: duplicate tag`)
  }
  // Tags that aren't good-for labels (fmd, ornish-…) are the ones the
  // proposals recorded before applying; good-for labels are the proposed set.
  // Recipes later adapted (scripts/apply_recipe_adaptations.mjs) carry the
  // adaptation's labels instead; dal-stew kept ½ tsp salt (doctor's
  // decision), which costs it blood-pressure-friendly.
  const adapted = new Map(JSON.parse(readFileSync('scripts/data/recipe-adaptation-proposals.json', 'utf8')).recipes
    .filter(p => ADAPTED.includes(p.id))
    .map(p => [p.id, p.proposed.labels.filter(l => !(ADAPTED_LABELS_LOST[p.id] || []).includes(l))]))
  const proposals = JSON.parse(readFileSync('scripts/data/recipe-completion-proposals.json', 'utf8')).recipes
  for (const p of proposals) {
    const r = recipes.find(x => x.id === p.id)
    assert.deepEqual(r.tags.filter(t => !LABEL_IDS.has(t) && t !== 'fredheim'), p.labels.otherTags, `${p.id}: other tags`)
    if (REPORTIONED.has(p.id)) continue // re-derived below
    assert.deepEqual(r.tags.filter(t => LABEL_IDS.has(t)).sort(), [...(adapted.get(p.id) || p.labels.proposed)].sort(), `${p.id}: labels`)
  }
  assert.equal(adapted.size, ADAPTED.length)
})

test('re-portioned recipes carry the labels the criteria compute for the new servings', () => {
  const byId = new Map(loadPacks().flatMap(p => p.recipes.map(r => [r.id, r])))
  for (const id of REPORTIONED) {
    const r = byId.get(id)
    assert.ok(r, id)
    const p = PORTIONS[id]
    if (p) assert.deepEqual([r.servings, r.servingWeightGrams, r.portion], [p.servings ?? r.servings, p.sw, p.portion.en], id)
    const labels = analyzeRecipe(r, byId, { storedMealTypes: true }).proposed
    assert.deepEqual(r.tags.filter(t => LABEL_IDS.has(t)), labels, `${id}: labels`)
  }
  // The dal's 165 g bowl left out its cooking water: at ~350 g its sodium
  // (88 mg/100 g) is blood-pressure-friendly after all.
  assert.ok(byId.get('dal-stew').tags.includes('blood-pressure-friendly'))
  // Baba ghanoush: 1 dl oil in ~720 g is not low energy density once the portion is real.
  assert.ok(!byId.get('baba-ghanoush---aubergine-dip').tags.includes('weight-loss'))
})

test('a portion description is given in all three languages', () => {
  for (const r of recipes.filter(r => r.portion)) {
    for (const lang of ['no', 'sv']) assert.ok(r.translations[lang]?.portion, `${r.id}: ${lang} portion`)
  }
  const bread = recipes.find(r => r.id === 'homemade-whole-wheat-bread')
  assert.equal(bread.portion, '2 slices (~92 g baked)')
  assert.equal(bread.servings, 88)
})

test('per-serving nutrition is a real serving, and kcal matches it', () => {
  for (const r of recipes) {
    const n = r.nutrition?.perServing
    if (!n) continue
    assert.equal(r.kcal, Math.round(n.calories), `${r.id}: kcal`)
    assert.ok(n.calories > 0 && n.calories < 1200, `${r.id}: ${n.calories} kcal a serving`)
    if (r.servingWeightGrams) assert.ok(n.calories / r.servingWeightGrams * 100 <= 900, `${r.id}: energy density`)
  }
  // The two recipes that had no usable panel now have one.
  for (const id of ['fr-53', 'vegan-tzatziki-sauce']) assert.ok(recipes.find(r => r.id === id).nutrition.perServing.calories > 0, id)
})

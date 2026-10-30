// Run with: npm test  (Node's built-in runner, no dependencies)
// Salt levels (src/utils/saltLevel.js, data from scripts/build_salt_levels.mjs):
// switching level, the shopping list, labels judged on low salt, and the
// check-recipes validation of standardAmount / sodiumStandard / flavourProfile.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  rowAtLevel, ingredientsAtLevel, recipeAtLevel, sodiumAtLevel, hasStandardSalt, normalizeSaltLevel,
  lowSaltOnlyLabels, SODIUM_LABELS, saltLevelForRecipe, hasStandardAmount as hasStandardSaltRow,
} from '../src/utils/saltLevel.js'
import { generateShoppingList } from '../src/utils/shoppingListGenerator.js'
import { buildBackup, validateBackup, BACKUP_APP, BACKUP_VERSION } from '../src/utils/dataBackup.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'
import { makeMyWeek, saltLevelFor } from '../src/utils/makeMyWeek.js'
import { checkSaltLevels, loadPacks } from '../scripts/check-recipes.mjs'
import { analyzeRecipe, LABELS } from '../scripts/lib/recipeLabels.mjs'
import { standardSodium, standardCeiling, saltClass, classifyFlavour, needsFlavour } from '../scripts/lib/saltLevels.mjs'

const ALL = Object.values(BUILT_IN_PACKS).flatMap(p => p.recipes.map(r => ({ ...r, sourcePackId: p.id })))
const byId = new Map(ALL.map(r => [r.id, r]))
const FALAFEL = byId.get('fr-64') // salt 1 tsp → 1 ½ tsp
const STEW = byId.get('black-bean-stew') // salt "to taste" → ½ tsp
const DICT = JSON.parse(readFileSync('src/data/ingredientDictionary.json', 'utf8'))

test('low salt is the recipe exactly as written', () => {
  assert.equal(recipeAtLevel(FALAFEL, 'low'), FALAFEL)
  assert.equal(ingredientsAtLevel(FALAFEL.ingredients, 'low'), FALAFEL.ingredients)
  assert.equal(sodiumAtLevel(FALAFEL, 'low'), FALAFEL.nutrition.perServing.sodium)
  // A recipe without a standard amount reads the same at either level.
  const plain = ALL.find(r => !hasStandardSalt(r) && r.nutrition?.perServing)
  assert.equal(recipeAtLevel(plain, 'standard'), plain)
  assert.equal(sodiumAtLevel(plain, 'standard'), plain.nutrition.perServing.sodium)
  assert.equal(normalizeSaltLevel('nonsense'), 'low')
  assert.equal(normalizeSaltLevel(undefined), 'low')
})

test('standard uses standardAmount in every language, and its sodium', () => {
  const std = recipeAtLevel(FALAFEL, 'standard')
  const i = FALAFEL.ingredients.findIndex(r => r.standardAmount != null)
  for (const list of [std.ingredients, std.translations.no.ingredients, std.translations.sv.ingredients]) {
    assert.equal(list[i].quantity, 1.5)
  }
  assert.equal(FALAFEL.ingredients[i].quantity, 1, 'the pack recipe itself is not touched')
  assert.equal(std.nutrition.perServing.sodium, FALAFEL.nutrition.sodiumStandard)
  assert.ok(std.nutrition.perServing.sodium > FALAFEL.nutrition.perServing.sodium)
  assert.deepEqual(std.tags, FALAFEL.tags, 'labels never change with the level')

  // A "to taste" row gets its unit and loses the now-empty note.
  const j = STEW.ingredients.findIndex(r => r.standardAmount != null)
  const row = rowAtLevel(STEW.translations.no.ingredients[j], 'standard')
  assert.deepEqual([row.quantity, row.unit, row.note], [0.5, 'tsp', undefined])
  assert.equal(rowAtLevel(STEW.ingredients[j], 'low').note, 'to taste')
})

test('standard amounts land in the doctor\'s ranges', () => {
  const withStd = ALL.filter(hasStandardSalt)
  assert.ok(withStd.length >= 30, `${withStd.length} recipes`)
  for (const r of withStd) {
    const low = r.nutrition.perServing.sodium
    const std = r.nutrition.sodiumStandard
    assert.ok(std > low, r.id)
    assert.ok(std <= 900, `${r.id}: ${std} mg`)
    assert.ok(std <= standardCeiling(saltClass(r), r) + 2, `${r.id}: ${std} mg from ${low} mg`)
    assert.equal(std, standardSodium(r), `${r.id}: stored sodiumStandard matches the rows`)
    assert.notEqual(r.flavourProfile, 'sweet', r.id)
    // Only salt, herb salt and black salt are raised; beans, broth, soy, miso stay.
    for (const row of r.ingredients) if (row.standardAmount != null) assert.ok(['salt', 'herb-salt', 'black-salt'].includes(row.ingredient), r.id)
  }
})

test('every savoury recipe with its own salt row offers the choice', () => {
  // The exceptions, each for a reason: see scripts/data/salt-level-proposals.md.
  const LEFT_OUT = new Set(['fermented-red-cabbage', 'fr-69'])
  for (const r of ALL) {
    if (!r.nutrition?.perServing || !(r.ingredients || []).some(row => ['salt', 'herb-salt', 'black-salt'].includes(row.ingredient))) continue
    const cls = saltClass(r)
    if (typeof cls === 'object' || LEFT_OUT.has(r.id)) { assert.ok(!hasStandardSalt(r), r.id); continue }
    assert.ok(hasStandardSalt(r), `${r.id} (${cls}) has no switch`)
  }
  // What was skipped before: a main already over the target still gets a step.
  const soup = byId.get('fr-27')
  assert.ok(soup.nutrition.sodiumStandard - soup.nutrition.perServing.sodium >= 72, 'cabbage soup: about +80 mg')
  // One portion seasoned to taste: a pinch, not ¼ tsp.
  const fmd = byId.get('fmd-d1-dinner')
  const row = fmd.ingredients.find(hasStandardSaltRow)
  assert.deepEqual([row.standardAmount, row.standardUnit], [1, 'pinch'])
  assert.ok(fmd.nutrition.sodiumStandard <= 900)
})

test('the shopping list buys the chosen level, everything else unchanged', () => {
  const plan = { monday: { Dinner: [{ recipeId: FALAFEL.id, servings: FALAFEL.servings }] } }
  const flat = groups => groups.flatMap(g => g.items)
  const low = flat(generateShoppingList(plan, ALL, 2, 'en', []))
  const std = flat(generateShoppingList(plan, ALL, 2, 'en', [], { saltLevel: 'standard' }))
  const salt = list => list.find(it => it.ingredientId === 'salt')
  assert.deepEqual([salt(low).quantity, salt(low).unit], [1, 'tsp'])
  assert.deepEqual([salt(std).quantity, salt(std).unit], [1.5, 'tsp'])
  const others = list => list.filter(it => it.ingredientId !== 'salt').map(({ id, quantity, unit, name }) => ({ id, quantity, unit, name }))
  assert.deepEqual(others(std), others(low))

  // Norwegian list too, and a "to taste" row gets a real amount at standard.
  const stewPlan = { monday: { Dinner: [{ recipeId: STEW.id, servings: STEW.servings }] } }
  const stdNo = flat(generateShoppingList(stewPlan, ALL, 2, 'no', [], { saltLevel: 'standard' }))
  assert.deepEqual([salt(stdNo).quantity, salt(stdNo).unit], [0.5, 'tsp'])
  const lowNo = flat(generateShoppingList(stewPlan, ALL, 2, 'no', []))
  assert.ok(!(salt(lowNo)?.quantity > 0), 'low salt buys no measured salt for a "to taste" row')
})

test('labels are judged on the low-salt recipe, whatever the level', () => {
  for (const r of ALL.filter(hasStandardSalt)) {
    const stored = (r.tags || []).filter(t => LABELS.includes(t))
    assert.deepEqual(analyzeRecipe(r, byId, { storedMealTypes: true }).proposed, stored, r.id)
  }
  // Falafel keeps heart-healthy (510 mg as written) although standard is 676 mg.
  assert.ok(FALAFEL.tags.includes('heart-healthy'))
  assert.ok(FALAFEL.nutrition.sodiumStandard > 600)
})

test('the low-salt label note: every sodium-based label the standard sodium is over', () => {
  // Falafel: heart-healthy as written (510 mg), 676 mg at standard > 600 for a meal.
  assert.ok(lowSaltOnlyLabels(FALAFEL, 'standard').includes('heart-healthy'))
  assert.deepEqual(lowSaltOnlyLabels(FALAFEL, 'low'), [], 'no note at low salt')
  const plain = ALL.find(r => !hasStandardSalt(r) && (r.tags || []).includes('heart-healthy'))
  assert.deepEqual(lowSaltOnlyLabels(plain, 'standard'), [], 'no note when the recipe reads the same at both levels')

  const recipe = (sodium, extra = {}) => ({
    mealTypes: ['lunch', 'dinner'], servingWeightGrams: 400, tags: ['blood-pressure-friendly', 'heart-healthy', 'gluten-free'],
    ingredients: [{ quantity: 0.5, unit: 'tsp', ingredient: 'salt', standardAmount: 1 }],
    nutrition: { perServing: { sodium: 400, potassium: 900 }, sodiumStandard: sodium }, ...extra,
  })
  assert.deepEqual(lowSaltOnlyLabels(recipe(550), 'standard'), [], 'within both limits at standard')
  assert.deepEqual(lowSaltOnlyLabels(recipe(580, { servingWeightGrams: 350 }), 'standard'), ['blood-pressure-friendly'], '166 mg/100 g > 140')
  assert.deepEqual(lowSaltOnlyLabels(recipe(680), 'standard'), ['blood-pressure-friendly', 'heart-healthy'])
  assert.deepEqual(lowSaltOnlyLabels(recipe(680, { tags: ['heart-healthy'] }), 'standard'), ['heart-healthy'], 'only labels the recipe has')
  // Not a meal: heart-healthy's limit is 360 mg.
  const bread = recipe(380, { mealTypes: ['side'], servingWeightGrams: 300, tags: ['heart-healthy'] })
  assert.deepEqual(lowSaltOnlyLabels(bread, 'standard'), ['heart-healthy'])
  assert.deepEqual(lowSaltOnlyLabels({ ...bread, nutrition: { ...bread.nutrition, sodiumStandard: 350 } }, 'standard'), [])

  // The note is localized, and every label it can name has a name in each language.
  for (const lang of ['en', 'no', 'sv']) {
    const t = JSON.parse(readFileSync(`src/i18n/locales/${lang}.json`, 'utf8'))
    assert.match(t.salt.labelNote, /\{\{label\}\}/, lang)
    for (const l of SODIUM_LABELS) assert.ok(t.conditions[l], `${lang}: conditions.${l}`)
  }
})

test('flavourProfile: every breakfast, spread and jam has one', () => {
  let sweet = 0
  let savoury = 0
  for (const r of ALL.filter(needsFlavour)) {
    assert.ok(['sweet', 'savoury'].includes(r.flavourProfile), r.id)
    assert.equal(r.flavourProfile, classifyFlavour(r).profile, `${r.id}: reproducible`)
    if (r.flavourProfile === 'sweet') sweet++; else savoury++
  }
  assert.ok(sweet > 0 && savoury > 0)
  assert.equal(byId.get('scrambled-tofu').flavourProfile, 'savoury')
  assert.equal(byId.get('classic-hummus').flavourProfile, 'savoury')
  assert.equal(byId.get('carob-spread').flavourProfile, 'sweet')
  assert.equal(byId.get('orn-49').flavourProfile, 'sweet', 'plain porridge is eaten with fruit')
})

// ── check-recipes ──
function saltRow(quantity, unit, extra = {}) {
  const e = DICT.entries.find(x => x.id === 'salt')
  return Object.fromEntries(['en', 'no', 'sv'].map(l => [l, { quantity, unit, ingredient: 'salt', name: e.names[l], ...extra }]))
}
function packOf(recipe, id = 'fredheim-recepies-with-pictures') {
  return [{ id, recipes: [recipe] }]
}
function soup(rows, extra = {}) {
  return {
    id: 't-soup', title: 'Test soup', category: 'Soup', mealTypes: ['lunch', 'dinner'], servings: 4,
    nutrition: { perServing: { calories: 300, sodium: 300 } },
    ingredients: rows.map(r => r.en),
    translations: { no: { ingredients: rows.map(r => r.no) }, sv: { ingredients: rows.map(r => r.sv) } },
    ...extra,
  }
}
const codes = issues => issues.map(i => `${i.code}:${i.key.split('|').pop()}`)

test('check-recipes: the built-in packs are clean', () => {
  const issues = checkSaltLevels(loadPacks())
  assert.deepEqual(issues.map(i => `${i.recipe} ${i.code}: ${i.message}`), [])
})

test('check-recipes: a valid standard amount passes', () => {
  const r = soup([saltRow(0.5, 'tsp', { standardAmount: 1 })])
  r.nutrition.sodiumStandard = standardSodium(r)
  assert.deepEqual(codes(checkSaltLevels(packOf(r))), [])
})

test('check-recipes: standardAmount only on salty rows, never below the amount', () => {
  const e = DICT.entries.find(x => x.id === 'garlic')
  const garlic = Object.fromEntries(['en', 'no', 'sv'].map(l => [l, { quantity: 1, unit: 'clove', ingredient: 'garlic', name: e.names[l], standardAmount: 2 }]))
  const below = saltRow(1, 'tsp', { standardAmount: 0.5 })
  const r = soup([garlic, below])
  r.nutrition.sodiumStandard = 1
  const found = codes(checkSaltLevels(packOf(r)))
  assert.ok(found.includes('bad-standard-amount:garlic:id'), found.join(' '))
  assert.ok(found.includes('bad-standard-amount:salt:below'), found.join(' '))
})

test('check-recipes: no unit, misaligned languages, wrong or missing sodiumStandard', () => {
  const noUnit = saltRow(null, '', { standardAmount: 0.5 }) // a "to taste" row needs standardUnit
  const r1 = soup([noUnit])
  r1.nutrition.sodiumStandard = 999
  assert.ok(codes(checkSaltLevels(packOf(r1))).includes('bad-standard-amount:salt:unit'))

  const row = saltRow(0.5, 'tsp', { standardAmount: 1 })
  row.sv = { ...row.sv, standardAmount: 0.75 }
  const r2 = soup([row])
  const found = codes(checkSaltLevels(packOf(r2)))
  assert.ok(found.includes('bad-standard-amount:salt:misaligned'), found.join(' '))
  assert.ok(found.includes('standard-sodium:missing'), found.join(' '))

  const r3 = soup([saltRow(0.5, 'tsp', { standardAmount: 1 })], { nutrition: { perServing: { calories: 300, sodium: 300 }, sodiumStandard: 10 } })
  assert.ok(codes(checkSaltLevels(packOf(r3))).includes('standard-sodium:mismatch'))

  const r4 = soup([saltRow(0.5, 'tsp')], { nutrition: { perServing: { calories: 300, sodium: 300 }, sodiumStandard: 500 } })
  assert.ok(codes(checkSaltLevels(packOf(r4))).includes('standard-sodium:orphan'))
})

test('check-recipes: over the cap, on a sweet recipe, flavour missing', () => {
  const r1 = soup([saltRow(0.5, 'tsp', { standardAmount: 3 })])
  r1.nutrition.sodiumStandard = standardSodium(r1)
  assert.ok(codes(checkSaltLevels(packOf(r1))).includes('standard-sodium:cap'))

  const r2 = soup([saltRow(0.25, 'tsp', { standardAmount: 0.5 })], { category: 'Breakfast', mealTypes: ['breakfast'], flavourProfile: 'sweet' })
  r2.nutrition.sodiumStandard = standardSodium(r2)
  assert.ok(codes(checkSaltLevels(packOf(r2))).includes('standard-sodium:sweet'))

  const r3 = soup([saltRow(0.25, 'tsp')], { category: 'Breakfast', mealTypes: ['breakfast'] })
  assert.ok(codes(checkSaltLevels(packOf(r3))).includes('missing-flavour:missing'))
  // Outside the Fredheim packs flavour and sodium aren't required, but the rows are still checked.
  assert.deepEqual(codes(checkSaltLevels(packOf(r3, 'healthy-basics'))), [])
})

// ── settings ──
test('salt level: low by default, persisted and in the backup', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  // No IndexedDB under node: keep persist's writes in memory.
  useStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
  assert.equal(useStore.getState().saltLevel, 'low')
  useStore.getState().setSaltLevel('standard')
  assert.equal(useStore.persist.getOptions().partialize(useStore.getState()).saltLevel, 'standard')
  const backup = buildBackup(useStore.getState())
  assert.equal(backup.data.saltLevel, 'standard')
  useStore.getState().setSaltLevel('extreme')
  assert.equal(useStore.getState().saltLevel, 'low', 'an unknown level is low')

  const file = { app: BACKUP_APP, version: BACKUP_VERSION, data: { saltLevel: 'standard', dislikedRecipes: ['fr-64'] } }
  assert.equal(validateBackup(file).data.saltLevel, 'standard')
  assert.deepEqual(validateBackup(file).data.dislikedRecipes, ['fr-64'])
  const bad = validateBackup({ ...file, data: { ...file.data, saltLevel: 'lots' } })
  assert.equal(bad.data.saltLevel, undefined)
  assert.ok(bad.dropped.includes('saltLevel'))
})

// ── per-recipe override (the toggle on the recipe page) ──
test('per-recipe salt level: override, picking the global value clears it, reset', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  useStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
  const s = () => useStore.getState()
  s().setSaltLevel('low')
  useStore.setState({ recipeSaltLevels: {} })

  assert.equal(saltLevelForRecipe(FALAFEL.id, s().saltLevel, s().recipeSaltLevels), 'low', 'follows the global setting')
  s().setRecipeSaltLevel(FALAFEL.id, 'standard')
  assert.deepEqual(s().recipeSaltLevels, { [FALAFEL.id]: 'standard' })
  assert.equal(saltLevelForRecipe(FALAFEL.id, s().saltLevel, s().recipeSaltLevels), 'standard')
  assert.equal(saltLevelForRecipe(STEW.id, s().saltLevel, s().recipeSaltLevels), 'low', 'other recipes untouched')

  // Choosing the global value again is the same as no override.
  s().setRecipeSaltLevel(FALAFEL.id, 'low')
  assert.deepEqual(s().recipeSaltLevels, {})

  // An override survives a global change, and reset drops it.
  s().setRecipeSaltLevel(FALAFEL.id, 'standard')
  s().setSaltLevel('standard')
  s().setSaltLevel('low')
  assert.equal(saltLevelForRecipe(FALAFEL.id, s().saltLevel, s().recipeSaltLevels), 'standard')
  s().clearRecipeSaltLevel(FALAFEL.id)
  assert.equal(saltLevelForRecipe(FALAFEL.id, s().saltLevel, s().recipeSaltLevels), 'low')

  // Unknown levels are ignored, both when set and when stored.
  s().setRecipeSaltLevel(FALAFEL.id, 'extreme')
  assert.deepEqual(s().recipeSaltLevels, {})
  assert.equal(saltLevelForRecipe('x', 'standard', { x: 'lots' }), 'standard')

  // Persisted and in the backup; a bad map is dropped on import.
  s().setRecipeSaltLevel(STEW.id, 'standard')
  assert.deepEqual(useStore.persist.getOptions().partialize(s()).recipeSaltLevels, { [STEW.id]: 'standard' })
  assert.deepEqual(buildBackup(s()).data.recipeSaltLevels, { [STEW.id]: 'standard' })
  const file = { app: BACKUP_APP, version: BACKUP_VERSION, data: { recipeSaltLevels: { 'fr-64': 'standard' } } }
  assert.deepEqual(validateBackup(file).data.recipeSaltLevels, { 'fr-64': 'standard' })
  const bad = validateBackup({ ...file, data: { saltLevel: 'low', recipeSaltLevels: { 'fr-64': 'lots' } } })
  assert.ok(bad.dropped.includes('recipeSaltLevels'))
  useStore.setState({ recipeSaltLevels: {} })
})

test('shopping list: a recipe\'s own salt level wins over the global one', () => {
  const plan = {
    monday: { Dinner: [{ recipeId: FALAFEL.id, servings: FALAFEL.servings }] },
    tuesday: { Dinner: [{ recipeId: STEW.id, servings: STEW.servings }] },
  }
  const saltRows = opts => generateShoppingList(plan, ALL, 2, 'en', [], opts)
    .flatMap(g => g.items).filter(it => it.ingredientId === 'salt')
  const tsp = opts => saltRows(opts).reduce((n, it) => n + (it.unit === 'tsp' ? it.quantity : 0), 0)
  // Falafel 1 → 1 ½ tsp; stew "to taste" → ½ tsp.
  assert.equal(tsp({ saltLevel: 'low' }), 1)
  assert.equal(tsp({ saltLevel: 'standard' }), 2)
  assert.equal(tsp({ saltLevel: 'low', recipeSaltLevels: { [FALAFEL.id]: 'standard' } }), 1.5)
  assert.equal(tsp({ saltLevel: 'standard', recipeSaltLevels: { [FALAFEL.id]: 'low' } }), 1.5, 'falafel 1 + stew ½')
  assert.equal(tsp({ saltLevel: 'low', recipeSaltLevels: { [STEW.id]: 'standard' } }), 1.5)
  assert.equal(tsp({ saltLevel: 'low', recipeSaltLevels: {} }), 1, 'no override: the global setting')
})

test('the recipe-page toggle strings exist in every language', () => {
  for (const lang of ['en', 'no', 'sv']) {
    const t = JSON.parse(readFileSync(`src/i18n/locales/${lang}.json`, 'utf8'))
    assert.ok(t.salt.short.low && t.salt.short.standard && t.salt.recipeToggle, lang)
    assert.match(t.salt.resetToDefault, /\{\{level\}\}/, lang)
  }
})

test('Make my week: low salt for blood pressure, heart and diabetes; otherwise as asked', () => {
  assert.equal(saltLevelFor({ goals: ['bloodPressure'], saltLevel: 'standard' }), 'low')
  assert.equal(saltLevelFor({ goals: ['weight', 'heart'], saltLevel: 'standard' }), 'low')
  assert.equal(saltLevelFor({ goal: 'diabetes', saltLevel: 'standard' }), 'low', 'an old single goal too')
  assert.equal(saltLevelFor({ goals: ['weight'], saltLevel: 'standard' }), 'standard')
  assert.equal(saltLevelFor({ goals: [] }), 'low')
  const base = { people: 2, avoid: [], time: 'medium', batch: false, meals: 3 }
  const std = makeMyWeek({ recipes: ALL, answers: { ...base, goals: [], saltLevel: 'standard' }, seed: 3 })
  assert.equal(std.saltLevel, 'standard')
  assert.ok(std.notices.some(n => n.key === 'saltLevel' && n.level === 'standard'))
  const bp = makeMyWeek({ recipes: ALL, answers: { ...base, goals: ['bloodPressure'], saltLevel: 'standard' }, seed: 3 })
  assert.equal(bp.saltLevel, 'low')
  assert.ok(bp.notices.some(n => n.key === 'saltLevel' && n.auto))
  // The level changes amounts, not choices.
  const low = makeMyWeek({ recipes: ALL, answers: { ...base, goals: [], saltLevel: 'low' }, seed: 3 })
  assert.deepEqual(low.plan, std.plan)
})

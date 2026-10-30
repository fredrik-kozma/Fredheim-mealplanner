// Run with: npm test  (Node's built-in runner, no dependencies)
// "Make my week" (src/utils/makeMyWeek.js): the generated week keeps every
// rule the questionnaire promises, and loads through installStarterPlan.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  makeMyWeek, buildPool, recipeHasHoney, resolveSlotNames, defaultAnswers, kcalTarget, GOAL_TAG, DAY_KEYS,
  FREDHEIM_PACK_ID, REVERSAL_PACK_ID, FMD_PACK_ID, FMD_STARTER_ID, FRUIT,
} from '../src/utils/makeMyWeek.js'
import { weekTipsData, renderWeekTips } from '../src/utils/weekTips.js'
import { generateShoppingList } from '../src/utils/shoppingListGenerator.js'
import { readFileSync } from 'node:fs'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'
import { recipeHasAvoidedAllergen } from '../src/data/allergens.js'

// What the store holds once every built-in pack is installed.
const ALL = Object.values(BUILT_IN_PACKS).flatMap(p => p.recipes.map(r => ({ ...r, sourcePackId: p.id })))
const byId = new Map(ALL.map(r => [r.id, r]))

const BASE = { goal: 'general', people: 2, avoid: [], noHoney: false, time: 'medium', batch: false, meals: 3 }
const items = week => Object.entries(week.plan).flatMap(([day, slots]) =>
  Object.entries(slots).flatMap(([slot, list]) => list.map(it => ({ day: DAY_KEYS.indexOf(day), slot, ...it }))))
const extraKeys = week => new Set((week.extras || []).map(x => `${DAY_KEYS.indexOf(x.day)}|${x.slot}|${x.recipeId}`))
const isExtra = (week, it) => extraKeys(week).has(`${it.day}|${it.slot}|${it.recipeId}`)
// The example the doctor checks: type 2 diabetes, 2 people, nut allergy,
// 45 minutes, batch cooking, three meals.
const EXAMPLE = { ...BASE, goal: 'diabetes', avoid: ['tree-nuts', 'peanuts'], time: 'medium', batch: true, meals: 3 }

// Per person kcal/fibre of each day, recomputed from the plan as the
// planner would cook it: servings (null = one each) ÷ people, plus fruit.
function dayTotals(week, people) {
  const out = {}
  for (const [day, slots] of Object.entries(week.plan)) {
    let kcal = 0
    let fibre = 0
    for (const list of Object.values(slots)) {
      for (const it of list) {
        const n = byId.get(it.recipeId).nutrition.perServing
        const portions = (it.servings ?? people) / people
        kcal += n.calories * portions
        fibre += n.fiber * portions
      }
    }
    kcal += (week.fruit?.[day] || 0) * FRUIT.kcal
    fibre += (week.fruit?.[day] || 0) * FRUIT.fibre
    out[day] = { kcal, fibre }
  }
  return out
}

// Every combination worth checking the hard rules on.
const SCENARIOS = []
for (const goal of ['general', 'weight', 'bloodPressure', 'diabetes', 'heart']) {
  for (const meals of [3, 2, 1]) {
    for (const batch of [false, true]) {
      SCENARIOS.push({ ...BASE, goal, meals, batch, time: batch ? 'quick' : 'medium' })
    }
  }
}

test('the pool: installed Fredheim + Reversal only, goal tag required, allergens and honey out', () => {
  const answers = { ...BASE, goal: 'diabetes', avoid: ['tree-nuts', 'soy'], noHoney: true }
  const pool = buildPool(ALL, answers)
  assert.ok(pool.length > 10)
  for (const r of pool) {
    assert.ok([FREDHEIM_PACK_ID, REVERSAL_PACK_ID].includes(r.sourcePackId), `${r.id}: from ${r.sourcePackId}`)
    assert.ok(r.tags.includes('diabetes-friendly'), `${r.id}: not diabetes-friendly`)
    assert.ok(!recipeHasAvoidedAllergen(r, answers.avoid), `${r.id}: has an avoided allergen`)
    assert.ok(!recipeHasHoney(r), `${r.id}: has honey`)
  }
  // General: no tag needed, still never FMD.
  const general = buildPool(ALL, BASE)
  assert.ok(general.every(r => r.sourcePackId !== FMD_PACK_ID))
  assert.ok(general.some(r => !(r.tags || []).includes('heart-healthy')))
})

test('honey: the ingredient counts, honeydew melon does not', () => {
  assert.ok(recipeHasHoney({ ingredients: [{ ingredient: 'honey', name: 'honey' }] }))
  assert.ok(recipeHasHoney({ ingredients: [{ name: 'x' }], translations: { no: { ingredients: [{ name: 'honning' }] } } }))
  assert.ok(!recipeHasHoney({ ingredients: [{ ingredient: 'melon', name: 'Melon', note: 'honeydew' }] }))
  assert.ok(ALL.some(recipeHasHoney), 'the packs do have honey recipes')
})

test('every scenario keeps the hard rules', () => {
  for (const answers of SCENARIOS) {
    const label = JSON.stringify(answers)
    const week = makeMyWeek({ recipes: ALL, answers, seed: 3 })
    const tag = GOAL_TAG[answers.goal]
    const all = items(week)
    assert.ok(all.length > 0, `${label}: empty week`)
    const batched = new Set(week.batchCook.map(b => b.recipeId))
    const days = new Map()
    const p = answers.people
    for (const it of all) {
      const r = byId.get(it.recipeId)
      assert.ok(r, `${label}: unknown ${it.recipeId}`)
      assert.notEqual(r.sourcePackId, FMD_PACK_ID, `${label}: FMD recipe ${r.id}`)
      if (tag) assert.ok(r.tags.includes(tag), `${label}: ${r.id} lacks ${tag}`)
      assert.equal(Boolean(it.excludeFromShopping), batched.has(it.recipeId), `${label}: ${r.id} batch flag`)
      // Servings: null (one portion each, follows the household) or a
      // whole number for the household. Extras (bread) may be half.
      if (it.servings !== null) assert.ok(Number.isInteger(it.servings) && it.servings >= 1, `${label}: ${r.id} servings ${it.servings}`)
      if (isExtra(week, it)) {
        assert.equal(r.category, 'Bread', `${label}: extra ${r.id} is not bread`)
        assert.ok(it.servings === null || it.servings < p, `${label}: extra bread ${it.servings}`)
        continue // a staple on the side: not a dish, so no repeat rules
      }
      // Sides, bread and spreads stay at one portion; dishes up to two. (A
      // salad can be either: the lunch dish, or a side at the main meal.)
      if (['Side', 'Bread', 'Spreads'].includes(r.category)) assert.equal(it.servings, null, `${label}: ${r.id} (${r.category}) scaled`)
      if (it.servings !== null) assert.ok(it.servings > p && it.servings <= 2 * p, `${label}: ${r.id} ${it.servings} servings for ${p}`)
      days.set(r.id, [...(days.get(r.id) || []), it.day])
    }
    // At most twice a week (three for batch items), never on consecutive
    // days or twice in one day.
    for (const [id, list] of days) {
      const cap = batched.has(id) ? 3 : 2
      assert.ok(list.length <= cap + (week.notices.some(n => n.key === 'relaxCap') ? 1 : 0), `${label}: ${id} ${list.length}×`)
      const sorted = [...list].sort((a, b) => a - b)
      for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i] - sorted[i - 1] >= 2, `${label}: ${id} on days ${sorted}`)
    }
    // Every main meal is filling: a Main or a soup/stew. A salad only as a side.
    const mainSlot = answers.meals === 2 ? 'Lunch' : 'Dinner'
    for (const day of DAY_KEYS) {
      const meal = week.plan[day][mainSlot]
      if (!meal) continue
      const cats = meal.map(it => byId.get(it.recipeId).category)
      assert.ok(cats.some(c => c === 'Main' || c === 'Soup'), `${label}: ${day} ${mainSlot} not filling (${cats})`)
    }
    // Meals-per-day answer respected.
    const slotsUsed = new Set(all.map(it => it.slot))
    if (answers.meals === 2) assert.ok(!slotsUsed.has('Dinner'), `${label}: dinner in a 2-meal week`)
    if (answers.meals === 1) assert.deepEqual([...slotsUsed], ['Dinner'], `${label}: dinner only`)
  }
})

test('allergens and honey are excluded from the generated week', () => {
  const answers = { ...BASE, avoid: ['tree-nuts', 'peanuts', 'gluten'], noHoney: true, batch: true }
  for (const seed of [1, 2, 3]) {
    const week = makeMyWeek({ recipes: ALL, answers, seed })
    for (const it of [...items(week), ...week.batchCook]) {
      const r = byId.get(it.recipeId)
      assert.ok(!recipeHasAvoidedAllergen(r, answers.avoid), `${r.id} has an avoided allergen`)
      assert.ok(!recipeHasHoney(r), `${r.id} has honey`)
    }
  }
})

test('weekday time limit holds unless the week says it had to bend', () => {
  const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, time: 'quick' }, seed: 5 })
  const relaxed = week.notices.some(n => n.key === 'relaxTime')
  for (const it of items(week)) {
    if (it.day >= 5 || it.excludeFromShopping) continue
    const r = byId.get(it.recipeId)
    const minutes = (r.prepTime || 0) + (r.cookTime || 0) || 30
    if (!relaxed) assert.ok(minutes <= 20, `${r.id}: ${minutes} min on a weekday`)
  }
})

test('batch cooking: soup, bread and spread are covered on the days they are eaten', () => {
  const answers = { ...BASE, goal: 'diabetes', people: 2, avoid: ['tree-nuts', 'peanuts'], batch: true }
  const week = makeMyWeek({ recipes: ALL, answers, seed: 1 })
  assert.ok(week.batchCook.length >= 2, 'a soup and a bread at least')
  const all = items(week)
  for (const b of week.batchCook) {
    const r = byId.get(b.recipeId)
    assert.ok(r.tags.includes('batch-friendly'), `${r.id} is not batch-friendly`)
    assert.ok(r.tags.includes('diabetes-friendly'), `${r.id} is not diabetes-friendly`)
    const eaten = all.filter(it => it.recipeId === b.recipeId)
    const planned = eaten.filter(it => !isExtra(week, it))
    assert.ok(planned.length >= 2 && planned.length <= 3, `${r.id}: eaten ${planned.length}×`)
    assert.ok(eaten.every(it => it.excludeFromShopping), `${r.id}: a day not marked as covered`)
    // Sized to every serving eaten, at its portions (extra bread included).
    assert.equal(b.servings, eaten.reduce((n, it) => n + (it.servings ?? answers.people), 0), `${r.id}: batch sized to use`)
  }
  assert.ok(week.notices.some(n => n.key === 'batchTip'))
  assert.equal(week.portions, 2)
})

test('a health goal never falls back to untagged recipes', () => {
  // Only a handful of tagged recipes left: the week runs short rather than
  // filling up with untagged ones.
  const few = ALL.filter(r => r.sourcePackId !== REVERSAL_PACK_ID)
  const week = makeMyWeek({ recipes: few, answers: { ...BASE, goal: 'bloodPressure', avoid: ['tree-nuts', 'soy', 'gluten'] }, seed: 1 })
  for (const it of items(week)) assert.ok(byId.get(it.recipeId).tags.includes('blood-pressure-friendly'), it.recipeId)
  assert.ok(week.notices.some(n => n.key === 'packMissing' && n.packId === REVERSAL_PACK_ID), 'tells about the missing pack')
})

test('same answers and seed give the same week; another seed shuffles', () => {
  const answers = { ...BASE, goal: 'heart', batch: true }
  const a = makeMyWeek({ recipes: ALL, answers, seed: 42 })
  const b = makeMyWeek({ recipes: ALL, answers, seed: 42 })
  assert.deepEqual(a, b)
  const others = [43, 44, 45].map(seed => makeMyWeek({ recipes: ALL, answers, seed }))
  assert.ok(others.some(o => JSON.stringify(o.plan) !== JSON.stringify(a.plan)), 'shuffle changes the week')
})

test('FMD loads the shipped FMD week instead of generating one', () => {
  const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, goal: 'fmd', avoid: ['tree-nuts'] }, seed: 1 })
  assert.equal(week.kind, 'fmd')
  assert.equal(week.starterPlan.id, FMD_STARTER_ID)
  const noFmd = makeMyWeek({ recipes: ALL.filter(r => r.sourcePackId !== FMD_PACK_ID), answers: { ...BASE, goal: 'fmd' }, seed: 1 })
  assert.ok(noFmd.notices.some(n => n.key === 'fmdPackAdded'))
})

test('slot names follow the planner rows', () => {
  assert.deepEqual(resolveSlotNames(['Breakfast', 'Lunch', 'Dinner', 'Snack']), { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' })
  assert.deepEqual(resolveSlotNames(['Frokost', 'Lunsj', 'Kveld']), { breakfast: 'Frokost', lunch: 'Lunsj', dinner: 'Kveld' })
  const two = resolveSlotNames(['A', 'B'])
  assert.equal(new Set(Object.values(two)).size, 3, 'no two meals share a row')
})

test('installStarterPlan loads a generated week as it is', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  const { createJSONStorage } = await import('zustand/middleware')
  const memory = new Map()
  useStore.persist.setOptions({ storage: createJSONStorage(() => ({ getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) })) })
  const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, people: 3, batch: true }, seed: 9 })
  useStore.getState().installStarterPlan({ name: 'My week', notes: { week: 'tip', days: {} }, plan: week.plan, batchCook: week.batchCook, portions: week.portions }, 'en')
  const s = useStore.getState()
  assert.equal(s.familySize, 3)
  assert.equal(s.activeWeekName, 'My week')
  assert.deepEqual(s.batchCook, week.batchCook)
  for (const [day, slots] of Object.entries(week.plan)) {
    for (const [slot, list] of Object.entries(slots)) assert.deepEqual(s.weekPlan[day][slot], list)
  }
})

// ── Portions: the week reaches its energy target ─────────────────────────

test('the example week lands within 10% of the kcal target every day', () => {
  const week = makeMyWeek({ recipes: ALL, answers: EXAMPLE, seed: 1 })
  const target = kcalTarget('diabetes', 3)
  for (const [day, { kcal }] of Object.entries(dayTotals(week, EXAMPLE.people))) {
    assert.ok(Math.abs(kcal - target) / target <= 0.1, `${day}: ${Math.round(kcal)} kcal vs ${target}`)
  }
  assert.ok(week.notices.some(n => n.key === 'portionsScaled'), 'says the portions were sized up')
  assert.ok(!week.notices.some(n => n.key === 'kcalLow'))
})

test('stats are the per person figures of the plan as cooked', () => {
  for (const answers of [EXAMPLE, { ...BASE, people: 3 }, { ...BASE, goal: 'weight', meals: 2, people: 1 }]) {
    const week = makeMyWeek({ recipes: ALL, answers, seed: 4 })
    const totals = dayTotals(week, answers.people)
    // Within rounding: the planner sums in another order, so a total right
    // on .5 (63.4999… here, 63.5 there) may round either way.
    const near = (stat, exact, what) => assert.ok(Math.abs(stat - exact) <= 0.5 + 1e-9, `${what}: ${stat} vs ${exact}`)
    for (const [day, s] of Object.entries(week.stats.perDay)) {
      near(s.kcal, totals[day].kcal, `${day} kcal`)
      near(s.fibre, totals[day].fibre, `${day} fibre`)
    }
    const avg = Object.values(totals).reduce((n, d) => n + d.kcal, 0) / 7
    assert.equal(week.stats.kcal, Math.round(avg))
  }
})

test('every goal and meal count averages within 10% of its target (2 people)', () => {
  for (const answers of SCENARIOS) {
    const week = makeMyWeek({ recipes: ALL, answers, seed: 3 })
    const target = week.stats.kcalTarget
    assert.equal(target, Math.round(kcalTarget(answers.goal, answers.meals) * { 3: 1, 2: 1, 1: 0.4 }[answers.meals]))
    assert.ok(Math.abs(week.stats.kcal - target) / target <= 0.1, `${JSON.stringify(answers)}: ${week.stats.kcal} vs ${target}`)
  }
})

test('extras: bread carries the goal label, fruit is a small count', () => {
  const week = makeMyWeek({ recipes: ALL, answers: EXAMPLE, seed: 1 })
  for (const x of week.extras) {
    const r = byId.get(x.recipeId)
    assert.equal(r.category, 'Bread')
    assert.ok(r.tags.includes('diabetes-friendly'), `${r.id}: extra bread without the goal label`)
  }
  for (const [day, n] of Object.entries(week.fruit)) assert.ok(DAY_KEYS.includes(day) && n >= 1 && n <= 3, `${day}: ${n} fruit`)
})

test('scaled servings work with the shopping list and with scaling the week', async () => {
  const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, batch: false }, seed: 2 })
  const scaled = items(week).find(it => it.servings != null)
  assert.ok(scaled, 'some dish is planned at more than one portion each')
  // The shopping list scales by servings ÷ recipe servings: 3 servings
  // for 2 people buys 1½ times what one portion each does.
  const r = byId.get(scaled.recipeId)
  // In ml/g, since a larger amount may be shown in a bigger unit (3.3 ml → 1.32 tsp).
  const TO_BASE = { ml: 1, tsp: 5, tbsp: 15, dl: 100, l: 1000, g: 1, kg: 1000 }
  const total = list => list.reduce((n, l) => n + (typeof l.quantity === 'number' ? l.quantity * (TO_BASE[l.unit] || 1) : 0), 0)
  const listFor = servings => generateShoppingList({ monday: { Dinner: [{ recipeId: r.id, servings }] } }, ALL, 2, 'en')
    .flatMap(g => g.items || [])
  const one = total(listFor(null))
  const more = total(listFor(scaled.servings))
  assert.ok(one > 0)
  assert.ok(Math.abs(more / one - scaled.servings / 2) < 0.01, `${more} vs ${one} × ${scaled.servings / 2}`)

  // Scaling the week (2 → 4 people) multiplies the fixed servings and
  // leaves one-portion dishes following the household.
  const { default: useStore } = await import('../src/store/useStore.js')
  useStore.getState().installStarterPlan({ name: 'w', notes: { week: '', days: {} }, plan: week.plan, batchCook: week.batchCook, portions: 2 }, 'en')
  useStore.getState().scaleWeek(4)
  const s = useStore.getState()
  for (const [day, slots] of Object.entries(week.plan)) {
    for (const [slot, list] of Object.entries(slots)) {
      list.forEach((it, i) => {
        const now = s.weekPlan[day][slot][i]
        assert.equal(now.servings, it.servings == null ? null : it.servings * 2, `${day} ${slot} ${it.recipeId}`)
      })
    }
  }
})

// ── Tips follow the language ────────────────────────────────────────────

const LOCALES = Object.fromEntries(['en', 'no', 'sv'].map(l => [l, JSON.parse(readFileSync(`src/i18n/locales/${l}.json`, 'utf8'))]))
// A small stand-in for i18next's t: nested keys, _one/_other, {{vars}}.
function tFor(lang) {
  return (key, vars = {}) => {
    const get = k => k.split('.').reduce((o, p) => o?.[p], LOCALES[lang])
    const s = vars.count != null ? get(`${key}_${vars.count === 1 ? 'one' : 'other'}`) ?? get(key) : get(key)
    if (typeof s !== 'string') return key
    return s.replace(/\{\{(\w+)\}\}/g, (_, v) => String(vars[v] ?? ''))
  }
}

test('generated tips are rendered from keys, in every language', () => {
  const week = makeMyWeek({ recipes: ALL, answers: EXAMPLE, seed: 1 })
  const data = weekTipsData({ goal: EXAMPLE.goal, notices: week.notices, stats: week.stats, fruit: week.fruit })
  const texts = {}
  for (const lang of ['en', 'no', 'sv']) {
    const titleOf = id => byId.get(id)?.translations?.[lang]?.title || byId.get(id)?.title
    texts[lang] = renderWeekTips(data, { t: tFor(lang), titleOf })
    assert.ok(!/makeMyWeek\.|conditions\./.test(texts[lang].week), `${lang}: a raw key in the tips`)
    assert.ok(!/\{\{/.test(texts[lang].week), `${lang}: an unfilled {{var}}`)
    assert.deepEqual(Object.keys(texts[lang].days).sort(), Object.keys(week.fruit).sort())
  }
  assert.notEqual(texts.en.week, texts.no.week)
  assert.notEqual(texts.no.week, texts.sv.week)
})

test('a language switch re-renders the tips, but not text the user edited', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  // The first example week with fruit notes on a few days (most days fill
  // up with dishes and bread alone).
  const seed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(s => Object.keys(makeMyWeek({ recipes: ALL, answers: EXAMPLE, seed: s }).fruit).length >= 2)
  const week = makeMyWeek({ recipes: ALL, answers: EXAMPLE, seed: seed ?? 1 })
  const data = weekTipsData({ goal: EXAMPLE.goal, notices: week.notices, stats: week.stats, fruit: week.fruit })
  const titleOf = id => byId.get(id)?.title
  const en = renderWeekTips(data, { t: tFor('en'), titleOf })
  const no = renderWeekTips(data, { t: tFor('no'), titleOf })
  useStore.getState().installStarterPlan({ name: 'w', notes: { ...en, tips: { data, rendered: en } }, plan: week.plan, batchCook: [], portions: 2 }, 'en')
  const days = Object.keys(en.days)
  assert.ok(days.length >= 2, 'the example has fruit notes on a few days')
  useStore.getState().setDayNote(days[0], 'My own note')
  useStore.getState().relocalizeWeekTips(no)
  const notes = useStore.getState().weekNotes
  assert.equal(notes.week, no.week, 'untouched tips follow the language')
  assert.equal(notes.days[days[0]], 'My own note', 'an edited day note stays')
  for (const day of days.slice(1)) assert.equal(notes.days[day], no.days[day])
  // Edited week text stays too.
  useStore.getState().setWeekNote('Mine')
  useStore.getState().relocalizeWeekTips(en)
  assert.equal(useStore.getState().weekNotes.week, 'Mine')
})

test('"No honey" is a persisted setting and the starting answer', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  assert.equal(defaultAnswers({ avoidHoney: true }).noHoney, true)
  assert.equal(defaultAnswers({}).noHoney, false)
  useStore.getState().setAvoidHoney(true)
  const persisted = useStore.persist.getOptions().partialize(useStore.getState())
  assert.equal(persisted.avoidHoney, true)
  useStore.getState().setAvoidHoney(false)
})

// ── Multiple goals, breakfast flavour, favourites, dislikes, fewer ingredients ──
const planIds = week => items(week).filter(it => !isExtra(week, it)).map(it => it.recipeId)
const breakfastIds = week => items(week).filter(it => it.slot === 'Breakfast' && !isExtra(week, it)).map(it => it.recipeId)

test('goals are multiple choice: every chosen label, or the least important relaxed and said', () => {
  const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, goals: ['bloodPressure', 'weight'] }, seed: 2 })
  const relaxed = week.notices.find(n => n.key === 'goalRelaxed')
  const kept = relaxed ? relaxed.kept : ['bloodPressure', 'weight']
  assert.deepEqual(week.goals, kept)
  for (const it of items(week)) {
    for (const g of kept) assert.ok(byId.get(it.recipeId).tags.includes(GOAL_TAG[g]), `${it.recipeId} lacks ${GOAL_TAG[g]}`)
  }
  // Too few main dishes carry both labels: weight loss (the least
  // important) is dropped, blood pressure kept, and the week says so.
  const both = r => ['blood-pressure-friendly', 'weight-loss'].every(tag => r.tags?.includes(tag))
  let keep = 2
  const scarce = ALL.map(r => {
    if (!both(r) || !['Main', 'Soup'].includes(r.category) || !(r.mealTypes || []).includes('dinner')) return r
    return keep-- > 0 ? r : { ...r, tags: r.tags.filter(tag => tag !== 'weight-loss') }
  })
  const many = makeMyWeek({ recipes: scarce, answers: { ...BASE, goals: ['weight', 'bloodPressure'] }, seed: 2 })
  const n = many.notices.find(x => x.key === 'goalRelaxed')
  assert.ok(n, 'relaxed with a notice')
  assert.deepEqual(n.goals, ['weight'], 'the least important goal goes')
  assert.deepEqual(many.goals, ['bloodPressure'])
  const scarceById = new Map(scarce.map(r => [r.id, r]))
  for (const it of items(many)) assert.ok(scarceById.get(it.recipeId).tags.includes('blood-pressure-friendly'), it.recipeId)
  // A single goal is never relaxed.
  const one = makeMyWeek({ recipes: ALL.filter(r => r.sourcePackId !== REVERSAL_PACK_ID), answers: { ...BASE, goals: ['bloodPressure'], avoid: ['tree-nuts', 'soy', 'gluten'] }, seed: 1 })
  assert.ok(!one.notices.some(x => x.key === 'goalRelaxed'))
})

test('an old single-goal answer works as a list of one', () => {
  const a = makeMyWeek({ recipes: ALL, answers: { ...BASE, goal: 'heart' }, seed: 9 })
  const b = makeMyWeek({ recipes: ALL, answers: { ...BASE, goal: undefined, goals: ['heart'] }, seed: 9 })
  assert.deepEqual(a.plan, b.plan)
  assert.deepEqual(a.goals, ['heart'])
  // Old saved tips (goal) and new ones (goals) render the label line alike.
  const t = (k, o) => `${k}${o ? JSON.stringify(o) : ''}`
  assert.equal(renderWeekTips({ goal: 'heart', notices: [] }, { t, titleOf: x => x }).week,
    renderWeekTips(weekTipsData({ goals: ['heart'] }), { t, titleOf: x => x }).week)
})

test('breakfast: savoury, sweet or a mix, as answered', () => {
  for (const kind of ['savoury', 'sweet']) {
    for (const seed of [1, 2, 3]) {
      const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, breakfast: kind }, seed })
      const bf = breakfastIds(week)
      assert.equal(bf.length, 7)
      for (const id of bf) assert.equal(byId.get(id).flavourProfile, kind, `${kind} seed ${seed}: ${id}`)
    }
  }
  const mixed = makeMyWeek({ recipes: ALL, answers: { ...BASE, breakfast: 'both' }, seed: 1 })
  const kinds = new Set(breakfastIds(mixed).map(id => byId.get(id).flavourProfile))
  assert.deepEqual([...kinds].sort(), ['savoury', 'sweet'])
  // Too few savoury breakfasts with a goal's label: the others fill in, and it is said.
  const few = makeMyWeek({ recipes: ALL, answers: { ...BASE, goals: ['weight'], breakfast: 'savoury' }, seed: 1 })
  const savoury = buildPool(ALL, { ...BASE, goals: ['weight'] }).filter(r => r.flavourProfile === 'savoury' && (r.mealTypes || []).includes('breakfast') && r.category !== 'Bread')
  if (savoury.length < 3) assert.ok(few.notices.some(n => n.key === 'breakfastRelaxed'))
})

test('a savoury-only week has variety, also with a health goal', () => {
  for (const goals of [['general'], ['weight'], ['diabetes'], ['heart'], ['bloodPressure']]) {
    for (const seed of [1, 2, 3]) {
      const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, goals, breakfast: 'savoury' }, seed })
      const bf = breakfastIds(week)
      const label = `${goals} seed ${seed}`
      assert.ok(!week.notices.some(n => n.key === 'breakfastRelaxed'), `${label}: fell back to sweet breakfasts`)
      for (const id of bf) assert.equal(byId.get(id).flavourProfile, 'savoury', `${label}: ${id}`)
      assert.ok(new Set(bf).size >= (goals[0] === 'bloodPressure' ? 4 : 6), `${label}: only ${new Set(bf).size} different breakfasts`)
    }
  }
})

test('the batch spread follows the breakfast answer', () => {
  for (const kind of ['sweet', 'savoury']) {
    const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, batch: true, breakfast: kind }, seed: 4 })
    const spread = week.batchCook.map(b => byId.get(b.recipeId)).find(r => r.category === 'Spreads')
    assert.ok(spread, `${kind}: a spread`)
    assert.equal(spread.flavourProfile, kind)
  }
})

test('"not for me" recipes are never picked', () => {
  const first = makeMyWeek({ recipes: ALL, answers: { ...BASE, batch: true }, seed: 5 })
  const disliked = [...new Set([...planIds(first), ...first.batchCook.map(b => b.recipeId)])]
  for (const seed of [5, 6, 7]) {
    const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, batch: true, disliked }, seed })
    for (const it of items(week)) assert.ok(!disliked.includes(it.recipeId), `seed ${seed}: ${it.recipeId}`)
  }
  assert.ok(!buildPool(ALL, { ...BASE, disliked }).some(r => disliked.includes(r.id)))
})

test('favourites are preferred, a few a week, when asked', () => {
  // Favourites the week would not pick by itself.
  const usual = new Set([1, 2, 3].flatMap(seed => planIds(makeMyWeek({ recipes: ALL, answers: BASE, seed }))))
  const pool = buildPool(ALL, BASE)
  const favourites = pool.filter(r => !usual.has(r.id) && ['Main', 'Soup'].includes(r.category) && (r.mealTypes || []).includes('dinner')).slice(0, 4).map(r => r.id)
  assert.equal(favourites.length, 4)
  let on = 0
  let off = 0
  for (const seed of [1, 2, 3]) {
    const yes = makeMyWeek({ recipes: ALL, answers: { ...BASE, favourites, preferFavourites: true }, seed })
    const no = makeMyWeek({ recipes: ALL, answers: { ...BASE, favourites, preferFavourites: false }, seed })
    const count = w => new Set(planIds(w).filter(id => favourites.includes(id))).size
    assert.ok(count(yes) >= 3, `seed ${seed}: ${count(yes)} favourites`)
    assert.ok(yes.notices.some(n => n.key === 'favouritesUsed' && n.count === count(yes)))
    on += count(yes)
    off += count(no)
  }
  assert.ok(on > off, `favourites ${on} with, ${off} without`)
})

test('fewer ingredients: recipes that share ingredients, fewer to buy', () => {
  let on = 0
  let off = 0
  for (const seed of [1, 2, 3, 4, 5]) {
    for (const answers of [BASE, { ...BASE, batch: true }, { ...BASE, goals: ['heart'] }]) {
      const yes = makeMyWeek({ recipes: ALL, answers: { ...answers, fewerIngredients: true }, seed })
      const no = makeMyWeek({ recipes: ALL, answers, seed })
      on += yes.uniqueIngredients
      off += no.uniqueIngredients
      // The count is what the planned recipes need, water left out.
      const ids = new Set(items(yes).flatMap(it => byId.get(it.recipeId).ingredients.map(i => i.ingredient)).filter(i => i && i !== 'water'))
      assert.equal(yes.uniqueIngredients, ids.size)
    }
  }
  assert.ok(on < off * 0.92, `unique ingredients: ${on} with the option, ${off} without`)
})

// ── Calorie target ───────────────────────────────────────────────────────

const servingsOf = (it, people) => it.servings ?? people
const within = (kcal, target, band = 0.1) => Math.abs(kcal - target) / target <= band

test('no calorie target: the week is exactly as before', () => {
  for (const answers of [BASE, EXAMPLE, { ...BASE, meals: 2, goal: 'weight' }]) {
    const before = makeMyWeek({ recipes: ALL, answers, seed: 5 })
    assert.deepEqual(makeMyWeek({ recipes: ALL, answers: { ...answers, kcal: null }, seed: 5 }), before)
    // Out of range or not a number is no target too.
    for (const kcal of [500, 9000, 'abc', '']) {
      assert.deepEqual(makeMyWeek({ recipes: ALL, answers: { ...answers, kcal }, seed: 5 }), before, `kcal ${kcal}`)
    }
    assert.ok(!before.stats.fitted)
  }
  assert.equal(kcalTarget('weight', 3), 1600)
  assert.equal(kcalTarget('weight', 3, null), 1600)
  assert.equal(kcalTarget('weight', 3, 2500), 2500)
})

test('1,500 and 2,500 kcal targets: every day within 10%', () => {
  for (const kcal of [1500, 1800, 2500]) {
    for (const goal of ['general', 'diabetes', 'heart']) {
      for (const batch of [false, true]) {
        const answers = { ...BASE, goal, batch, kcal }
        for (const seed of [1, 2]) {
          const week = makeMyWeek({ recipes: ALL, answers, seed })
          const label = `${kcal} ${goal} batch:${batch} seed ${seed}`
          assert.equal(week.stats.kcalTarget, kcal, label)
          assert.ok(week.stats.fitted, label)
          for (const [day, { kcal: total }] of Object.entries(dayTotals(week, answers.people))) {
            assert.ok(within(total, kcal), `${label}: ${day} ${Math.round(total)} kcal`)
          }
          assert.ok(!week.notices.some(n => n.key === 'kcalOffTarget'), label)
        }
      }
    }
  }
})

test('a calorie target moves the week: smaller portions at 1,500, larger at 2,500', () => {
  // Over many seeds, so no single random week decides it.
  const total = week => items(week).reduce((n, it) => n + servingsOf(it, 2), 0)
  const offBy = (week, kcal) => Object.values(week.stats.perDay).reduce((n, d) => n + Math.abs(d.kcal - kcal), 0) / 7
  for (let seed = 1; seed <= 20; seed++) {
    const none = makeMyWeek({ recipes: ALL, answers: BASE, seed })
    const low = makeMyWeek({ recipes: ALL, answers: { ...BASE, kcal: 1500 }, seed })
    const high = makeMyWeek({ recipes: ALL, answers: { ...BASE, kcal: 2500 }, seed })
    assert.ok(total(high) > total(low), `seed ${seed}: ${total(high)} servings at 2,500, ${total(low)} at 1,500`)
    assert.ok(low.notices.some(n => n.key === 'portionsFitted' && n.target === 1500), `seed ${seed}`)
    for (const [kcal, week] of [[1500, low], [2500, high]]) {
      const label = `seed ${seed}, ${kcal} kcal`
      // The days move to the target: much closer than the same week without one.
      assert.ok(offBy(week, kcal) < offBy(none, kcal) / 2,
        `${label}: days off by ${Math.round(offBy(week, kcal))} kcal, ${Math.round(offBy(none, kcal))} without a target`)
    }
  }
})

test('with a calorie target dinner is clearly the lightest meal: seeds 1–20', () => {
  for (const kcal of [1500, 1800, 2000, 2500]) {
    for (const goal of ['general', 'diabetes', 'heart']) {
      let total = { Breakfast: 0, Lunch: 0, Dinner: 0 }
      let count = 0
      for (let seed = 1; seed <= 20; seed++) {
        const answers = { ...BASE, goal, kcal }
        const week = makeMyWeek({ recipes: ALL, answers, seed })
        const label = `${kcal} kcal, ${goal}, seed ${seed}`
        for (const [day, { kcal: dayKcal }] of Object.entries(dayTotals(week, answers.people))) {
          // Diabetes-friendly dishes can't always fill 2,500 with dinner kept
          // light: that day lands under the target instead.
          const under = goal === 'diabetes' && kcal === 2500 ? 0.2 : 0.101
          assert.ok(dayKcal <= kcal * 1.101 && dayKcal >= kcal * (1 - under), `${label}: ${day} ${Math.round(dayKcal)} kcal`)
        }
        for (const m of Object.values(week.stats.perMeal)) {
          for (const slot of Object.keys(total)) total[slot] += m[slot] || 0
          count++
        }
      }
      const [b, l, d] = ['Breakfast', 'Lunch', 'Dinner'].map(slot => total[slot] / count)
      const label = `${kcal} kcal, ${goal}: ${Math.round(b)}/${Math.round(l)}/${Math.round(d)}`
      // Clearly lightest: at least a tenth under the smaller of the other two.
      assert.ok(d < 0.9 * Math.min(b, l), label)
      assert.ok(b >= 0.98 * l, label)
      const all = b + l + d
      assert.ok(d / all >= 0.2 && d / all <= 0.3, `${label}: dinner share`)
      assert.ok(b / all >= 0.35 && b / all <= 0.45, `${label}: breakfast share`)
      assert.ok(l / all >= 0.3 && l / all <= 0.4, `${label}: lunch share`)
    }
  }
})

test('with a calorie target dinner is never bigger than lunch or breakfast, on any day, and no day runs over', () => {
  for (const goal of ['general', 'weight', 'bloodPressure', 'diabetes', 'heart']) {
    for (const kcal of [1500, 1800, 2000, 2500]) {
      for (let seed = 1; seed <= 20; seed++) {
        const answers = { ...BASE, goal, kcal }
        const week = makeMyWeek({ recipes: ALL, answers, seed })
        const label = `${goal}, ${kcal} kcal, seed ${seed}`
        const totals = dayTotals(week, answers.people)
        for (const [day, slots] of Object.entries(week.plan)) {
          const meal = slot => slots[slot].reduce((n, it) =>
            n + byId.get(it.recipeId).nutrition.perServing.calories * servingsOf(it, answers.people) / answers.people, 0)
          assert.ok(meal('Dinner') <= meal('Lunch'), `${label}: ${day} dinner ${Math.round(meal('Dinner'))} > lunch ${Math.round(meal('Lunch'))}`)
          assert.ok(meal('Dinner') <= meal('Breakfast'), `${label}: ${day} dinner ${Math.round(meal('Dinner'))} > breakfast ${Math.round(meal('Breakfast'))}`)
          // Under the target is allowed; over it by more than 10% is not.
          assert.ok(totals[day].kcal <= kcal * 1.1, `${label}: ${day} ${Math.round(totals[day].kcal)} kcal`)
        }
      }
    }
  }
})

test('dinner stays the lightest for other household sizes and with batch cooking too', () => {
  for (const extra of [{ people: 1 }, { people: 3 }, { people: 4 }, { batch: true }, { people: 1, batch: true }]) {
    for (const goal of ['general', 'weight', 'bloodPressure']) {
      for (const kcal of [1500, 2500]) {
        for (let seed = 1; seed <= 5; seed++) {
          const answers = { ...BASE, ...extra, goal, kcal }
          const week = makeMyWeek({ recipes: ALL, answers, seed })
          for (const [day, slots] of Object.entries(week.plan)) {
            const meal = slot => slots[slot].reduce((n, it) =>
              n + byId.get(it.recipeId).nutrition.perServing.calories * servingsOf(it, answers.people) / answers.people, 0)
            const label = `${JSON.stringify(extra)} ${goal}, ${kcal} kcal, seed ${seed}, ${day}`
            assert.ok(meal('Dinner') <= Math.min(meal('Lunch'), meal('Breakfast')), `${label}: ${Math.round(meal('Breakfast'))}/${Math.round(meal('Lunch'))}/${Math.round(meal('Dinner'))}`)
          }
        }
      }
    }
  }
})

test('with a calorie target dinner stays a proper main, with no bread on the side', () => {
  for (const kcal of [1500, 1800, 2000, 2500]) {
    for (const batch of [false, true]) {
      for (let seed = 1; seed <= 20; seed++) {
        const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, kcal, batch }, seed })
        const label = `${kcal} kcal, batch:${batch}, seed ${seed}`
        for (const it of items(week).filter(x => x.slot === 'Dinner')) {
          assert.notEqual(byId.get(it.recipeId).category, 'Bread', `${label}: ${it.recipeId}`)
        }
        for (const day of DAY_KEYS) {
          const cats = week.plan[day].Dinner.map(it => byId.get(it.recipeId).category)
          assert.ok(cats.some(c => c === 'Main' || c === 'Soup'), `${label}: ${day} dinner is ${cats}`)
        }
        for (const x of week.extras) assert.notEqual(x.slot, 'Dinner', `${label}: bread top-up at dinner`)
      }
    }
  }
})

test('with a calorie target dinners lean lighter than the same week without one', () => {
  const avgDish = answers => {
    let kcal = 0
    let n = 0
    for (let seed = 1; seed <= 20; seed++) {
      for (const it of items(makeMyWeek({ recipes: ALL, answers, seed })).filter(x => x.slot === 'Dinner')) {
        const r = byId.get(it.recipeId)
        if (r.category === 'Main' || r.category === 'Soup') { kcal += r.nutrition.perServing.calories; n++ }
      }
    }
    return kcal / n
  }
  // Calories of one portion of the dish chosen, before any portion sizing.
  const light = avgDish({ ...BASE, kcal: 1500 })
  const plain = avgDish(BASE)
  assert.ok(light < plain, `${Math.round(light)} kcal a portion, ${Math.round(plain)} without a target`)
})

test('with a calorie target two meals keep their split too', () => {
  for (const kcal of [1500, 1800]) {
    let b = 0
    let l = 0
    for (let seed = 1; seed <= 20; seed++) {
      const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, meals: 2, kcal }, seed })
      for (const m of Object.values(week.stats.perMeal)) { b += m.Breakfast; l += m.Lunch }
    }
    assert.ok(b > l, `${kcal} kcal: breakfast ${b}, lunch ${l}`)
    assert.ok(b / (b + l) >= 0.5 && b / (b + l) <= 0.6, `${kcal} kcal: breakfast share ${b / (b + l)}`)
  }
})

test('calorie target portions: ½ to 2 each in half portions, bread whole servings', () => {
  for (const people of [2, 4, 3, 1]) {
    for (const kcal of [1500, 2500]) {
      for (const batch of [false, true]) {
        const answers = { ...BASE, people, kcal, batch }
        const week = makeMyWeek({ recipes: ALL, answers, seed: 2 })
        const label = `${people} people, ${kcal} kcal, batch:${batch}`
        for (const it of items(week)) {
          const r = byId.get(it.recipeId)
          const s = servingsOf(it, people)
          assert.ok(Number.isInteger(s) && s >= 1, `${label}: ${r.id} ${s}`)
          assert.ok(s <= 2 * people, `${label}: ${r.id} ${s} > 2 each`)
          if (r.category === 'Bread' || r.category === 'Spreads') assert.ok(s <= people, `${label}: ${r.id} more than one portion`)
          if (isExtra(week, it)) continue
          assert.ok(s >= Math.ceil(people / 2), `${label}: ${r.id} ${s} < ½ each`)
          // Half portions where that is a whole serving.
          if (people % 2 === 0 && r.category !== 'Bread') assert.equal(s % (people / 2), 0, `${label}: ${r.id} ${s} not in half portions`)
        }
      }
    }
  }
})

test('a smaller portion buys less: the shopping list follows the fitted servings', () => {
  // The packs' portions are modest, so even a low target mostly sizes up:
  // look for a week where a dish went down to ½ each.
  let small = null
  for (let seed = 1; seed <= 20 && !small; seed++) {
    const week = makeMyWeek({ recipes: ALL, answers: { ...BASE, kcal: 1000 }, seed })
    small = items(week).find(it => it.servings != null && it.servings < 2 && !it.excludeFromShopping)
  }
  assert.ok(small, 'a dish at less than one portion each')
  const TO_BASE = { ml: 1, tsp: 5, tbsp: 15, dl: 100, l: 1000, g: 1, kg: 1000 }
  const total = list => list.reduce((n, l) => n + (typeof l.quantity === 'number' ? l.quantity * (TO_BASE[l.unit] || 1) : 0), 0)
  const listFor = servings => generateShoppingList({ monday: { Dinner: [{ recipeId: small.recipeId, servings }] } }, ALL, 2, 'en')
    .flatMap(g => g.items || [])
  const one = total(listFor(null))
  assert.ok(Math.abs(total(listFor(small.servings)) / one - small.servings / 2) < 0.01)
  // The batch is sized to the servings planned, scaled ones included.
  const batched = makeMyWeek({ recipes: ALL, answers: { ...BASE, kcal: 1500, batch: true }, seed: 3 })
  for (const b of batched.batchCook) {
    const eaten = items(batched).filter(it => it.recipeId === b.recipeId && it.excludeFromShopping)
    assert.equal(b.servings, eaten.reduce((n, it) => n + servingsOf(it, 2), 0), b.recipeId)
  }
})

test('the calorie target does not apply to the FMD week', () => {
  const answers = { ...BASE, goal: 'fmd' }
  assert.deepEqual(
    makeMyWeek({ recipes: ALL, answers: { ...answers, kcal: 1500 }, seed: 1 }),
    makeMyWeek({ recipes: ALL, answers, seed: 1 }))
})

test('no snacks are ever planned, and an old saved snack answer means three meals', () => {
  for (const goal of ['general', 'weight', 'heart']) {
    for (const kcal of [null, 1500, 2500]) {
      for (let seed = 1; seed <= 20; seed++) {
        const answers = { ...BASE, goal, kcal }
        const week = makeMyWeek({ recipes: ALL, answers, seed })
        const label = `${goal} ${kcal} seed ${seed}`
        for (const it of items(week)) {
          assert.ok(['Breakfast', 'Lunch', 'Dinner'].includes(it.slot), `${label}: ${it.slot}`)
          assert.notEqual(byId.get(it.recipeId).category, 'Snack', `${label}: ${it.recipeId}`)
        }
        // A saved { meals: 3, snack: true } gives just the three-meal week.
        assert.deepEqual(makeMyWeek({ recipes: ALL, answers: { ...answers, snack: true }, seed }), week, label)
      }
    }
  }
  const answers = defaultAnswers({ kcal: 1800, meals: 3, snack: true })
  assert.equal(answers.meals, 3)
  assert.ok(!('snack' in answers))
})

test('old saved data with a snack migrates: store, backup and saved tips', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  const { validateBackup, BACKUP_APP } = await import('../src/utils/dataBackup.js')
  // The store's saved state.
  const { migrate, version } = useStore.persist.getOptions()
  assert.ok(version >= 11)
  const migrated = migrate({ planSnack: true, planMeals: 3, planKcalTarget: 1800 }, 10)
  assert.ok(!('planSnack' in migrated))
  assert.equal(migrated.planMeals, 3)
  assert.equal(migrated.planKcalTarget, 1800)
  // A backup: the field is ignored, not reported as a problem.
  const restored = validateBackup({ app: BACKUP_APP, version: 1, data: { planSnack: true, planMeals: 3 } })
  assert.ok(restored.ok)
  assert.deepEqual(restored.data, { planMeals: 3 })
  assert.deepEqual(restored.dropped, [])
  // Tips saved with the old notice still render, without a raw key or a snack.
  for (const lang of ['en', 'no', 'sv']) {
    const text = renderWeekTips({ goals: [], notices: [{ key: 'snackFruit' }], fruit: { monday: 1 } }, { t: tFor(lang), titleOf: id => id })
    assert.ok(!/makeMyWeek\.|snack|mellom|mellan/i.test(text.week), `${lang}: ${text.week}`)
    assert.ok(!/makeMyWeek\./.test(text.days.monday), `${lang}: ${text.days.monday}`)
  }
})

test('the snack wording is gone from Make my week, in every language', () => {
  for (const [lang, locale] of Object.entries(LOCALES)) {
    assert.equal(locale.makeMyWeek.meals['3s'], undefined, lang)
    assert.equal(locale.makeMyWeek.snackHint, undefined, lang)
    assert.equal(locale.makeMyWeek.notice.snackFruit, undefined, lang)
    assert.ok(!/snack|mellommål|mellanmål/i.test(JSON.stringify(locale.makeMyWeek)), lang)
  }
})

test('fruit with a calorie target goes with breakfast or lunch, in every language', () => {
  for (const lang of ['en', 'no', 'sv']) {
    const t = tFor(lang)
    const days = fitted => renderWeekTips({ goals: [], notices: [], stats: { kcal: 1500, fibre: 30, meals: 3, fitted, kcalTarget: 1500 }, fruit: { monday: 2 } }, { t, titleOf: id => id }).days.monday
    assert.ok(!/makeMyWeek\.|\{\{/.test(days(true)), `${lang}: ${days(true)}`)
    assert.ok(new RegExp(t('makeMyWeek.meals.2').split(' ')[0], 'i').test(days(true)), `${lang}: ${days(true)}`)
    assert.notEqual(days(true), days(false))
  }
})

test('calorie target tips render in every language', () => {
  const short = makeMyWeek({ recipes: ALL, answers: { ...BASE, goal: 'weight', meals: 2, kcal: 2500 }, seed: 1 })
  assert.ok(short.notices.some(n => n.key === 'kcalOffTarget'), 'light weight-loss dishes cannot reach 2,500 kcal in two meals')
  const fitted = makeMyWeek({ recipes: ALL, answers: { ...BASE, kcal: 1500 }, seed: 1 })
  for (const week of [short, fitted]) {
    const data = weekTipsData({ goals: week.goals, notices: week.notices, stats: week.stats, fruit: week.fruit })
    for (const lang of ['en', 'no', 'sv']) {
      const text = renderWeekTips(data, { t: tFor(lang), titleOf: id => byId.get(id)?.title }).week
      assert.ok(!/makeMyWeek\.|\{\{/.test(text), `${lang}: ${text}`)
      assert.ok(text.includes(String(week.stats.kcalTarget)), `${lang}: names the target`)
    }
  }
})

test('the calorie target and meals a day are saved settings, in the backup too', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  const { buildBackup, validateBackup } = await import('../src/utils/dataBackup.js')
  const saved = s => ({ planKcalTarget: s.planKcalTarget, planMeals: s.planMeals })
  useStore.getState().setPlanPreferences({ kcal: 1800, meals: 3 })
  assert.deepEqual(saved(useStore.getState()), { planKcalTarget: 1800, planMeals: 3 })
  const restored = validateBackup(buildBackup(useStore.getState()))
  assert.ok(restored.ok)
  assert.deepEqual(saved(restored.data), { planKcalTarget: 1800, planMeals: 3 })
  // Out of range is no target.
  useStore.getState().setPlanPreferences({ kcal: 99999, meals: 2 })
  assert.deepEqual(saved(useStore.getState()), { planKcalTarget: null, planMeals: 2 })
  // The wizard starts from them.
  assert.equal(defaultAnswers({ kcal: 1800, meals: 3 }).kcal, 1800)
})

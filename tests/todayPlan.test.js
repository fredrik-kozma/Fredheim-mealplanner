// Run with: npm test  (Node's built-in runner, no dependencies)
// The Today screen (src/utils/todayPlan.js, src/pages/TodayPage.jsx), and what
// the routes around it rely on now that '/' is no longer the recipe list.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dayMeals, daySummary, nextDay, plannedPortions, weekdayKey } from '../src/utils/todayPlan.js'
import { BUILT_IN_PACKS } from '../src/data/installedPacks.js'

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const RECIPES = {
  oats: { id: 'oats', title: 'Oats', nutrition: { perServing: { calories: 400, omega3: 2, omega6: 4 } } },
  soup: { id: 'soup', title: 'Soup', nutrition: { perServing: { calories: 300, omega3: 1, omega6: 3 } } },
  nut: { id: 'nut', title: 'Nuts', nutrition: { perServing: { calories: 200, omega3: 1, omega6: 1 } } },
  bare: { id: 'bare', title: 'No nutrition' },
}
const getRecipe = id => RECIPES[id]
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('weekdays map to the plan keys, and tomorrow crosses the week and the month', () => {
  assert.equal(weekdayKey(new Date(2026, 9, 26)), 'monday')
  assert.equal(weekdayKey(new Date(2026, 9, 30)), 'friday')
  assert.equal(weekdayKey(new Date(2026, 10, 1)), 'sunday')
  const sunday = new Date(2026, 10, 1)
  assert.equal(weekdayKey(nextDay(sunday)), 'monday')
  assert.equal(nextDay(new Date(2026, 9, 31)).getDate(), 1)
})

test('meals come in slot order, without snacks', () => {
  const plan = { friday: {
    Snack: [{ recipeId: 'nut' }],
    Dinner: [{ recipeId: 'soup', servings: 2 }],
    Breakfast: [{ recipeId: 'oats' }],
  } }
  const meals = dayMeals(plan, 'friday', SLOTS, getRecipe)
  assert.deepEqual(meals.map(m => [m.slot, m.recipe.id]), [['Breakfast', 'oats'], ['Dinner', 'soup']])
  assert.equal(meals[1].item.servings, 2)
})

test('a planned recipe that no longer exists is skipped, not a crash', () => {
  // What a saved plan looks like after one of the removed template packs.
  const plan = { friday: { Breakfast: [{ recipeId: 'hb-1' }], Lunch: ['med-2'], Dinner: [null, { recipeId: 'soup' }] } }
  assert.deepEqual(dayMeals(plan, 'friday', SLOTS, getRecipe).map(m => m.recipe.id), ['soup'])
  const summary = daySummary(plan, 'friday', getRecipe, 2)
  assert.equal(summary.kcal, 300)
  assert.equal(summary.kcalComplete, true)
  assert.equal(summary.omega.complete, true)

  const onlyGone = { friday: { Breakfast: [{ recipeId: 'hb-1' }] } }
  assert.deepEqual(dayMeals(onlyGone, 'friday', SLOTS, getRecipe), [])
  assert.equal(daySummary(onlyGone, 'friday', getRecipe, 2), null)
})

test('an empty or missing day has nothing to show', () => {
  assert.deepEqual(dayMeals({}, 'friday', SLOTS, getRecipe), [])
  assert.deepEqual(dayMeals(undefined, 'friday', SLOTS, getRecipe), [])
  assert.equal(daySummary({ friday: { Breakfast: [] } }, 'friday', getRecipe, 2), null)
})

test('a typed-in meal shows, and leaves the day totals marked as partial', () => {
  const plan = { friday: { Lunch: [{ kind: 'custom', id: 'c1', name: 'Leftovers' }], Dinner: [{ recipeId: 'soup' }] } }
  const meals = dayMeals(plan, 'friday', SLOTS, getRecipe)
  assert.equal(meals[0].recipe, null)
  assert.equal(meals[0].item.name, 'Leftovers')
  const summary = daySummary(plan, 'friday', getRecipe, 2)
  assert.equal(summary.kcal, 300)
  assert.equal(summary.kcalComplete, false)
  assert.equal(summary.omega.complete, false)
})

test('the day summary is per person and leaves out snacks, like the cards', () => {
  const plan = { friday: {
    Breakfast: [{ recipeId: 'oats', servings: null }], // one each
    Dinner: [{ recipeId: 'soup', servings: 4 }], // 4 portions for 2 people
    Snack: [{ recipeId: 'nut' }],
  } }
  const summary = daySummary(plan, 'friday', getRecipe, 2)
  assert.equal(summary.kcal, 400 + 600)
  assert.equal(summary.kcalComplete, true)
  // omega-6 4 + 6, omega-3 2 + 2
  assert.equal(summary.omega.ratio, 10 / 4)
  assert.equal(summary.omega.favourable, true)
})

test('a day with only a snack, or a snack in the local language, has no summary', () => {
  for (const slot of ['Snack', 'Mellommåltid', 'Mellanmål']) {
    const plan = { friday: { [slot]: [{ recipeId: 'nut' }] } }
    assert.equal(daySummary(plan, 'friday', getRecipe, 2), null, slot)
  }
})

test('the portions planned for the log are the ones the day summary counts', () => {
  const plan = { friday: {
    Breakfast: [{ recipeId: 'oats', servings: null }], // one each
    Dinner: [{ recipeId: 'soup', servings: 4 }], // 4 portions for 2 people
    Lunch: [{ kind: 'custom', id: 'c1', name: 'Leftovers' }, { recipeId: 'gone' }],
    Snack: [{ recipeId: 'nut', servings: 2 }],
    Mellommåltid: [{ recipeId: 'nut', servings: 2 }],
  } }
  const planned = plannedPortions(plan, 'friday', getRecipe, 2)
  assert.deepEqual(
    [...planned].sort((a, b) => a.recipeId.localeCompare(b.recipeId)),
    [{ recipeId: 'oats', portions: 1 }, { recipeId: 'soup', portions: 2 }],
  )
  const kcal = planned.reduce((n, p) => n + RECIPES[p.recipeId].nutrition.perServing.calories * p.portions, 0)
  assert.equal(kcal, daySummary(plan, 'friday', getRecipe, 2).kcal)
  assert.deepEqual(plannedPortions({}, 'friday', getRecipe, 2), [])
})

test('From the plan logs per-person portions, and leaves what is logged alone', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  useStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
  const date = '2026-11-06'
  const entries = () => useStore.getState().nutritionLog[date]
  const portionsOf = () => Object.fromEntries(entries().map(e => [e.recipeId, e.portions]))
  const importMeals = planned => useStore.getState().importPlannedMeals(date, planned)
  useStore.setState({ nutritionLog: { [date]: [{ id: 'mine', recipeId: 'soup', portions: 0.5 }] } })

  const plan = { friday: {
    Breakfast: [{ recipeId: 'oats', servings: null }],
    Lunch: [{ recipeId: 'nut', servings: 2 }],
    Dinner: [{ recipeId: 'soup', servings: 4 }, { recipeId: 'nut', servings: 1 }],
    Snack: [{ recipeId: 'bare', servings: 2 }],
  } }
  const planned = plannedPortions(plan, 'friday', getRecipe, 2)
  assert.equal(importMeals(planned), 2) // soup is logged already
  // nut 1 + 0.5 is one entry; the logged soup keeps its own 0.5, and its id.
  assert.deepEqual(portionsOf(), { soup: 0.5, oats: 1, nut: 1.5 })
  assert.equal(entries().find(e => e.recipeId === 'soup').id, 'mine')

  assert.equal(importMeals(planned), 0) // pressing again adds nothing
  assert.deepEqual(portionsOf(), { soup: 0.5, oats: 1, nut: 1.5 })

  // Half-serving steps, as on the stepper, and never below a half.
  useStore.setState({ nutritionLog: {} })
  assert.equal(importMeals([{ recipeId: 'a', portions: 4 / 3 }, { recipeId: 'b', portions: 0.1 }]), 2)
  assert.deepEqual(portionsOf(), { a: 1.5, b: 0.5 })
})

test('every tab has a short label for narrow phones, in en, no and sv', () => {
  for (const lang of ['en', 'no', 'sv']) {
    const locale = JSON.parse(read(`src/i18n/locales/${lang}.json`))
    for (const key of ['today', 'recipes', 'planner', 'nutrition', 'shopping', 'settings']) {
      const short = locale.navShort[key]
      assert.ok(short, `${lang}: navShort.${key}`)
      // A sixth of 320px holds about nine letters at the tab bar's 11px.
      assert.ok(short.length <= 9, `${lang}: navShort.${key} is too long: ${short}`)
    }
  }
})

test('a recipe without nutrition falls back to kcal, or marks the total partial', () => {
  const partial = daySummary({ friday: { Lunch: [{ recipeId: 'bare' }] } }, 'friday', getRecipe, 1)
  assert.equal(partial.kcal, 0)
  assert.equal(partial.kcalComplete, false)
  const flat = id => ({ id, kcal: 250 })
  assert.equal(daySummary({ friday: { Lunch: [{ recipeId: 'x' }] } }, 'friday', flat, 1).kcal, 250)
})

test('Today has its label and words in en, no and sv', () => {
  const labels = { en: 'Today', no: 'I dag', sv: 'Idag' }
  for (const [lang, label] of Object.entries(labels)) {
    const locale = JSON.parse(read(`src/i18n/locales/${lang}.json`))
    assert.equal(locale.nav.today, label)
    assert.equal(locale.today.title, label)
    for (const key of ['kcal', 'tomorrow', 'emptyTitle', 'emptyBody', 'weekLink']) {
      assert.ok(locale.today[key], `${lang}: today.${key}`)
    }
    assert.ok(locale.makeMyWeek.button, `${lang}: makeMyWeek.button`)
  }
})

test("'/' is Today with access and the recipe list without; recipe links go to /recipes", () => {
  assert.match(read('src/App.jsx'), /path="\/" element=\{canAccess \? <TodayPage \/> : <RecipesPage \/>\}/)
  assert.match(read('src/App.jsx'), /path="\/recipes" element=\{<RecipesPage \/>\}/)
  const nav = read('src/components/layout/Navigation.jsx')
  assert.ok(nav.indexOf("key: 'today'") < nav.indexOf("key: 'recipes'"), 'Today is the first tab')
  // These mean "the recipe list", which '/' no longer is for someone with access.
  for (const file of ['src/components/recipes/RecipeForm.jsx', 'src/components/recipes/RecipeDetail.jsx',
    'src/pages/NotFoundPage.jsx', 'src/pages/SharedImportPage.jsx']) {
    assert.doesNotMatch(read(file), /navigate\('\/'\)/, file)
  }
  // The tour's closing button and the empty state both open the wizard this way.
  assert.match(read('src/pages/TodayPage.jsx'), /navigate\('\/planner', \{ state: \{ openMakeMyWeek: true \} \}\)/)
  assert.match(read('src/App.jsx'), /navigate\('\/planner', \{ state: \{ openMakeMyWeek: true \} \}\)/)
})

test('the three template packs are gone and nothing built in refers to them', () => {
  for (const id of ['healthy-basics', 'mediterranean', 'nordic-classics']) {
    assert.ok(!existsSync(new URL(`../recipe-packs-template/packs/${id}.json`, import.meta.url)), id)
    assert.ok(!BUILT_IN_PACKS[id], id)
  }
  const ids = Object.values(BUILT_IN_PACKS).flatMap(p => p.recipes.map(r => r.id))
  assert.ok(!ids.some(id => /^(hb|med|nor)-\d/.test(id)))
})

test('the method text of the three recipes has no dairy left', () => {
  const pack = BUILT_IN_PACKS['fredheim-recepies-with-pictures']
  const steps = (id, lang) => {
    const r = pack.recipes.find(x => x.id === id)
    return (lang === 'en' ? r.steps : r.translations[lang].steps).join(' ')
  }
  const tofuFeta = pack.recipes.find(r => r.id === 'fr-173')
  assert.ok(steps('fr-49', 'en').includes(tofuFeta.title))
  assert.ok(steps('fr-49', 'no').includes(tofuFeta.translations.no.title))
  assert.ok(steps('fr-49', 'sv').includes(tofuFeta.translations.sv.title))
  const dairy = {
    en: /(?<!plant )\b(milk|butter)\b|feta cheese separately/i,
    no: /(?<!plante)melk|(?<!plante)smør/i,
    sv: /(?<!växt)mjölk|(?<!växtbaserat )smör|smjuk/i,
  }
  for (const [lang, pattern] of Object.entries(dairy)) {
    for (const id of ['burger-buns', 'fr-123']) assert.doesNotMatch(steps(id, lang), pattern, `${id} ${lang}`)
    assert.ok(steps('fr-123', lang).length && steps('burger-buns', lang).length)
  }
  // The honey stays: it's a separate ingredient, and not dairy.
  assert.match(steps('fr-123', 'en'), /plant butter and honey/)
})

// Retakes the intro tour's screenshots (public/tour/<lang>/<layout>/*.webp)
// and renders the finished slides for review.
//
//   npm run dev                                 (VITE_DEV_AUTOLOGIN=true in .env)
//   node scripts/capture-tour-screens.mjs --playwright=<folder it is installed in>
//     [shots] [slides] [--only=en-desktop] [--shots=11-nutrition,19-nutrition]
//     [--out=<folder>] [--measure=<file.json>]
//
// --shots still walks the whole flow, for the same week, but only writes those.
//
// Playwright isn't a dependency of the app, so it is installed elsewhere. Each
// run uses a fresh browser profile: the week lives in that throwaway IndexedDB
// and the fake dev login never reaches Supabase.
//
// The week is made by the real wizard, clicked through like a user would, with
// Math.random and the date pinned so all six runs get the same kind of week.
// Phone shots are 393 CSS px at 1.5x (the real phone layout, with the short nav
// labels), scaled to IMAGE_SIZE.mobile.
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = name => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1]
const require = createRequire(join(flag('playwright') || ROOT, 'package.json'))
const { chromium } = require('playwright')

const wants = what => args.includes(what) || !args.some(a => !a.startsWith('--'))
const BASE = 'http://localhost:5173'
const OUT_SLIDES = flag('out') || join(process.env.TEMP || '.', 'fredheim-tour-v2-previews')
const NOW = new Date('2026-11-04T12:00:00') // a Wednesday
const keepShots = flag('shots')?.split(',')

const LANGS = ['en', 'no', 'sv']
const LAYOUTS = {
  desktop: { viewport: { width: 1280, height: 715 }, deviceScaleFactor: 1, size: { w: 1280, h: 715 } },
  mobile: { viewport: { width: 393, height: 853 }, deviceScaleFactor: 1.5, size: { w: 590, h: 1279 }, hasTouch: true },
}
const PREVIEW = {
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 393, height: 853 }, deviceScaleFactor: 2, hasTouch: true },
}

const locale = lang => JSON.parse(readFileSync(join(ROOT, `src/i18n/locales/${lang}.json`), 'utf8'))
const lookup = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)

async function newPage(browser, options, lang) {
  const context = await browser.newContext({ ...options, serviceWorkers: 'block', reducedMotion: 'reduce' })
  await context.clock.setFixedTime(NOW)
  await context.addInitScript(([l]) => {
    localStorage.setItem('menuPlannerLang', l)
    localStorage.setItem('fredheim_install_banner_dismissed_v1', '1')
    let s = 20261104
    Math.random = () => { // mulberry32
      s = (s + 0x6D2B79F5) | 0
      let x = Math.imul(s ^ (s >>> 15), 1 | s)
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296
    }
  }, [lang])
  const page = await context.newPage()
  page.on('dialog', d => d.accept())
  page.on('pageerror', e => console.warn('  page error:', e.message))
  return { context, page }
}

// Past the language question and the tour, with the built-in packs loaded.
async function openApp(page, lang) {
  await page.goto(`${BASE}/settings`)
  await page.waitForFunction(() => import('/src/store/useStore.js').then(m => m.default.persist.hasHydrated()))
  await page.evaluate(async l => {
    const { default: useStore } = await import('/src/store/useStore.js')
    useStore.getState().setLanguage(l)
    useStore.setState({ hasChosenLanguage: true, hasSeenIntroTour: true })
  }, lang)
  await page.waitForFunction(async () => {
    const { default: useStore } = await import('/src/store/useStore.js')
    return useStore.getState().recipes.length > 50
  })
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.evaluate(async () => {
    await document.fonts.ready
    const visible = [...document.images].filter(i => {
      const r = i.getBoundingClientRect()
      return r.bottom > 0 && r.top < innerHeight
    })
    await Promise.all(visible.map(i => i.complete ? null : new Promise(res => { i.onload = i.onerror = res })))
  })
  await page.waitForTimeout(250)
}

// Client-side, so the store and any open state stay as they are.
async function route(page, path) {
  await page.evaluate(p => {
    history.pushState(null, '', p)
    dispatchEvent(new PopStateEvent('popstate'))
  }, path)
  await settle(page)
}

async function scrollTo(page, locator, block = 'start', offset = 0) {
  await locator.first().evaluate((el, { block, offset }) => {
    el.scrollIntoView({ block, behavior: 'instant' })
    // Clear the sticky header.
    if (offset) {
      let p = el.parentElement
      while (p && p !== document.documentElement) {
        if (p.scrollHeight > p.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(p).overflowY)) { p.scrollBy(0, offset); return }
        p = p.parentElement
      }
      window.scrollBy({ top: offset, behavior: 'instant' })
    }
  }, { block, offset })
  await settle(page)
}

async function takeShots(browser, lang, layout) {
  const opts = LAYOUTS[layout]
  const { context, page } = await newPage(browser, { viewport: opts.viewport, deviceScaleFactor: opts.deviceScaleFactor, hasTouch: opts.hasTouch }, lang)
  const dir = join(ROOT, 'public/tour', lang, layout)
  mkdirSync(dir, { recursive: true })
  const L = locale(lang)
  const t = key => {
    const v = lookup(L, key)
    if (typeof v !== 'string') throw new Error(`${lang}: no string ${key}`)
    return v
  }
  const isDesktop = layout === 'desktop'
  const shot = async (name, boxes = {}) => {
    await page.mouse.move(0, 0) // no hover highlight
    await settle(page)
    // Where things are, as percentages of the shot, for the marks in introTour.js.
    const found = {}
    const { width: vw, height: vh } = opts.viewport
    for (const [key, target] of Object.entries(boxes)) {
      const rects = []
      for (const loc of [target].flat()) {
        const n = await loc.count()
        for (let i = 0; i < n; i++) { const r = await loc.nth(i).boundingBox(); if (r) rects.push(r) }
      }
      if (!rects.length) { console.warn('  nothing to measure:', name, key); continue }
      const x0 = Math.max(0, Math.min(...rects.map(r => r.x)))
      const y0 = Math.max(0, Math.min(...rects.map(r => r.y)))
      const x1 = Math.min(vw, Math.max(...rects.map(r => r.x + r.width)))
      const y1 = Math.min(vh, Math.max(...rects.map(r => r.y + r.height)))
      const pct = v => Math.round(v * 10) / 10
      found[key] = [pct(x0 / vw * 100), pct(y0 / vh * 100), pct((x1 - x0) / vw * 100), pct((y1 - y0) / vh * 100)]
    }
    if (Object.keys(found).length) MEASURED[`${lang}-${layout}`] = { ...MEASURED[`${lang}-${layout}`], [name]: found }
    if (keepShots && !keepShots.includes(name)) return
    const png = await page.screenshot()
    const buf = await sharp(png).resize(opts.size.w, opts.size.h, { fit: 'fill' }).webp({ quality: 74, effort: 6 }).toBuffer()
    await sharp(buf).toFile(join(dir, `${name}.webp`))
    console.log(`  ${lang}/${layout}/${name}  ${Math.round(buf.length / 1024)} KB`)
  }
  const dialog = page.getByRole('dialog')
  const wizButton = (name, exact = false) => dialog.getByRole('button', { name, exact })

  await openApp(page, lang)

  // ── The empty planner, with Make my week on top ──
  await route(page, '/planner')
  const makeWeek = page.getByRole('button', { name: t('makeMyWeek.button') }).first()
  await makeWeek.waitFor()
  await shot(isDesktop ? '04-planner' : '05-planner-tips', { makeWeek })

  // ── The wizard ──
  await makeWeek.click()
  await dialog.waitFor()
  await shot(isDesktop ? '05-wiz-q1' : '08-wiz-q1', {
    plans: [wizButton(t('makeMyWeek.goals.heart')), wizButton(t('makeMyWeek.goals.fmd'))],
    goals: [wizButton(t('makeMyWeek.goals.general')), wizButton(t('makeMyWeek.goals.fmd'))],
  })
  await wizButton(t('makeMyWeek.next'), true).click()                 // goal
  if (!isDesktop) await shot('09-wiz-q2')
  await wizButton('2', true).click()                                  // people
  if (!isDesktop) await shot('10-wiz-q3')
  await wizButton(t('makeMyWeek.next'), true).click()                 // avoid
  if (!isDesktop) await shot('11-wiz-q4')
  await wizButton(t('makeMyWeek.times.medium')).click()               // time
  if (!isDesktop) await shot('12-wiz-q5')
  await wizButton(t('makeMyWeek.batchYes')).click()                   // batch
  if (!isDesktop) await shot('13-wiz-q6')
  await wizButton(t('makeMyWeek.meals.3')).click()                    // meals
  await shot(isDesktop ? '06-wiz-calories' : '14-wiz-q7', { picks: dialog.locator('button.tabular-nums') })
  await dialog.locator('button.tabular-nums').filter({ hasText: /1[ .,  ]?800/ }).first().click() // kcal
  await shot(isDesktop ? '07-wiz-prefs' : '15-wiz-q8', {
    breakfast: ['both', 'savoury', 'sweet'].map(v => wizButton(t(`makeMyWeek.breakfasts.${v}`))),
    fewer: dialog.getByRole('switch').nth(1),
  })
  await wizButton(t('makeMyWeek.next'), true).click()                 // prefs
  await wizButton(t('makeMyWeek.useWeek')).waitFor()
  const batchBox = dialog.locator('.border-cyan-200')
  const dayStats = dialog.locator('p.tabular-nums').first()
  if (!isDesktop) await shot('16-week-preview-top')
  await scrollTo(page, batchBox, 'start', -8)
  await shot(isDesktop ? '08-week-preview' : '17-week-preview-days', { batch: batchBox, stats: dayStats })
  await wizButton(t('makeMyWeek.useWeek')).click()
  await dialog.waitFor({ state: 'hidden' })

  // ── The filled week ──
  await page.waitForTimeout(600) // the persist write

  // "Today" is a day of this week with a good omega balance and the most
  // different pictures, so the home screen shows the plan at its best.
  const bestDay = await page.evaluate(async () => {
    const [{ default: useStore }, { daySummary, dayMeals }] = await Promise.all([
      import('/src/store/useStore.js'), import('/src/utils/todayPlan.js'),
    ])
    const s = useStore.getState()
    const byId = new Map(s.recipes.map(r => [r.id, r]))
    const get = id => byId.get(id)
    const rows = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day, dow) => {
      const summary = daySummary(s.weekPlan, day, get, s.familySize)
      const meals = dayMeals(s.weekPlan, day, s.mealSlots, get)
      const pictures = new Set(meals.map(m => m.recipe?.imageUrl).filter(Boolean)).size
      return { day, dow, pictures, kcal: summary?.kcal, good: !!(summary?.omega?.complete && summary.omega.favourable) }
    })
    return rows.sort((a, b) => (b.good - a.good) || (b.pictures - a.pictures))[0]
  })
  console.log('  today is', bestDay)
  // 2026-11-01 is a Sunday.
  await context.clock.setFixedTime(new Date(2026, 10, 1 + bestDay.dow, 12))
  if (isDesktop) {
    await page.getByRole('button', { name: t('planner.weekNotesTitle') }).first().click()
    await page.waitForTimeout(250)
  }
  await route(page, '/shopping')
  await route(page, '/planner') // remounted, so today's column is the highlighted one
  if (isDesktop) {
    await shot('09-planner-week', {
      batch: page.getByText(new RegExp(`${t('planner.batchCook')}$`)).first(),
      monday: page.getByText(t('planner.days.monday'), { exact: true }).first(),
    })
  } else {
    await page.evaluate(() => window.scrollTo(0, 0))
    await shot('06-planner-week')
    // Down to the grid, with the batch column and Monday in view.
    const { y } = await page.getByText(new RegExp(`${t('planner.batchCook')}$`)).first().boundingBox()
    await page.evaluate(top => window.scrollBy({ top, behavior: 'instant' }), y - 100)
    await shot('07-planner-more')
  }

  // ── Today ──
  await route(page, '/')
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('00-today', { cards: page.locator('main button.group'), summary: page.locator('main span.card') })

  // ── Recipes ──
  await route(page, '/recipes')
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('01-recipes', {
    labels: page.getByRole('button', { name: t('conditions.all'), exact: true }).locator('..'),
  })

  // One of this week's dinners with a picture and a salt switch.
  const recipeId = await page.evaluate(async () => {
    const { default: useStore } = await import('/src/store/useStore.js')
    const s = useStore.getState()
    const byId = new Map(s.recipes.map(r => [r.id, r]))
    const planned = Object.values(s.weekPlan).flatMap(day => Object.values(day || {}).flat())
      .map(i => byId.get(i?.recipeId)).filter(Boolean)
    const ok = r => r.imageUrl && r.ingredients?.some(i => i.standardAmount != null) && (r.steps?.length || 0) >= 3
    return (planned.find(r => ok(r) && r.mealTypes?.includes('dinner')) || planned.find(ok) || s.recipes.find(ok)).id
  })
  console.log(`  recipe: ${recipeId}`)
  await route(page, `/recipes/${recipeId}`)
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle(page)
  // A couple of ticked ingredients and the first step, so the shots show them.
  const ingredientRows = page.locator('button.w-full[aria-pressed]:not(li button)')
  await ingredientRows.nth(0).click()
  await ingredientRows.nth(1).click()
  await page.locator('li > button[aria-pressed]').first().click()
  await page.evaluate(() => window.scrollTo(0, 0))
  const servingsRow = page.getByText(t('recipeDetail.servingsLabel'), { exact: true }).first().locator('xpath=ancestor::div[.//button][1]')
  if (isDesktop) await scrollTo(page, servingsRow, 'end', 24) // all of the row in the short window
  await shot('02-recipe-top', { servings: servingsRow })
  const low = page.getByRole('group', { name: t('salt.recipeToggle') })
  await scrollTo(page, low, 'start', isDesktop ? -80 : -180)
  await shot(isDesktop ? '03-recipe-ticks' : '03-recipe-salt-switch', {
    salt: low,
    ticks: [ingredientRows.nth(0), ingredientRows.nth(1)],
  })
  const nutrition = page.locator('details > summary').filter({ hasText: t('nutrition.title') }).first()
  await nutrition.click()
  await scrollTo(page, nutrition, 'start', -90)
  await shot(isDesktop ? '03-recipe-nutrition' : '04-recipe-nutrition')

  // ── Shopping, nutrition, settings ──
  await route(page, '/shopping')
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(isDesktop ? '10-shopping' : '18-shopping')

  await route(page, '/nutrition')
  const fromPlan = page.getByRole('button', { name: new RegExp(t('nutritionTracker.importPlanned').split('(')[0].trim(), 'i') })
  if (await fromPlan.count()) {
    await fromPlan.first().click()
    await page.waitForTimeout(5000) // the toast fades
  }
  // The log should now say what the Today screen says.
  const logged = await page.evaluate(async now => {
    const [{ default: useStore }, { sumNutrition }] = await Promise.all([
      import('/src/store/useStore.js'), import('/src/utils/nutritionData.js'),
    ])
    const s = useStore.getState()
    const d = new Date(now)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const map = Object.fromEntries(s.recipes.map(r => [r.id, r]))
    return { kcal: Math.round(sumNutrition(s.nutritionLog[key], map).calories || 0), portions: s.nutritionLog[key]?.map(e => e.portions) }
  }, new Date(2026, 10, 1 + bestDay.dow, 12).getTime())
  console.log(`  today ${bestDay.kcal} kcal, nutrition ${logged.kcal} kcal, portions ${logged.portions}`)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(isDesktop ? '11-nutrition' : '19-nutrition', {
    eaten: page.getByText(t('nutritionTracker.mealsEaten'), { exact: true }).first().locator('xpath=ancestor::*[contains(@class,"card")][1]'),
  })

  await route(page, '/settings')
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(isDesktop ? '12-settings' : '20-settings')
  await scrollTo(page, page.getByText(t('salt.title'), { exact: true }), 'center')
  await shot(isDesktop ? '13-settings-salt' : '21-settings-salt', {
    salt: page.getByText(t('salt.title'), { exact: true }).first().locator('xpath=ancestor::*[contains(@class,"card")][1]'),
  })

  await context.close()
}

// The slides as the tour shows them, one file per slide.
async function renderSlides(browser, lang, layout) {
  const { context, page } = await newPage(browser, PREVIEW[layout], lang)
  mkdirSync(OUT_SLIDES, { recursive: true })
  const { TOUR_PATHS } = await import('../src/data/introTour.js')
  const L = locale(lang)
  await openApp(page, lang)
  await page.waitForTimeout(400)
  await page.evaluate(() => window.dispatchEvent(new Event('open-tutorial')))
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  const save = async id => {
    await settle(page)
    const png = await page.screenshot()
    await sharp(png).webp({ quality: 82 }).toFile(join(OUT_SLIDES, `${lang}-${layout}-${id}.webp`))
  }
  await save(TOUR_PATHS.full[0])
  await dialog.getByRole('button', { name: L.tour.full }).click()
  for (const id of TOUR_PATHS.full.slice(1)) {
    await page.waitForTimeout(150)
    await save(id)
    if (id !== 'done') await dialog.getByRole('button', { name: L.tour.next }).click()
  }
  console.log(`  rendered ${lang}-${layout}`)
  await context.close()
}

const MEASURED = {}
const only = flag('only')
const browser = await chromium.launch()
try {
  for (const lang of LANGS) {
    for (const layout of Object.keys(LAYOUTS)) {
      if (only && !only.split(',').includes(`${lang}-${layout}`)) continue
      if (wants('shots')) await takeShots(browser, lang, layout)
      if (wants('slides')) await renderSlides(browser, lang, layout)
    }
  }
} finally {
  await browser.close()
  if (flag('measure')) writeFileSync(flag('measure'), JSON.stringify(MEASURED, null, 1))
}

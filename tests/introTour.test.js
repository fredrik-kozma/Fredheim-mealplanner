// Run with: npm test  (Node's built-in runner, no dependencies)
// The intro tour (src/data/introTour.js, src/components/onboarding/IntroTour.jsx):
// it opens once, the seen flag is kept (and backed up), every slide has its
// words in all three languages, and every screenshot it points at exists.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import {
  TOUR_SLIDES, TOUR_PATHS, TOUR_LANGS, TOUR_LAYOUTS, IMAGE_SIZE,
  resolveShot, calloutKeys, tourLang, shouldAutoShowTour,
} from '../src/data/introTour.js'
import { buildBackup, validateBackup, BACKUP_APP, BACKUP_VERSION } from '../src/utils/dataBackup.js'

const LOCALES = Object.fromEntries(TOUR_LANGS.map(l => [
  l, JSON.parse(readFileSync(new URL(`../src/i18n/locales/${l}.json`, import.meta.url), 'utf8')),
]))
const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)
const publicFile = src => new URL(`../public${src}`, import.meta.url)

// Width and height of a WebP, from its header (lossy, lossless or extended).
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF')
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP')
  const chunk = buf.toString('ascii', 12, 16)
  if (chunk === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
  if (chunk === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
  if (chunk === 'VP8L') {
    const b = buf.readUInt32LE(21)
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
  }
  throw new Error(`unknown WebP chunk ${chunk}`)
}

test('the tour opens by itself once, after the language question, over nothing else', () => {
  assert.equal(shouldAutoShowTour({ hasChosenLanguage: false, hasSeenIntroTour: false }), false)
  assert.equal(shouldAutoShowTour({ hasChosenLanguage: true, hasSeenIntroTour: false }), true)
  assert.equal(shouldAutoShowTour({ hasChosenLanguage: true, hasSeenIntroTour: true }), false)
  assert.equal(shouldAutoShowTour({ hasChosenLanguage: true, hasSeenIntroTour: false, otherModalOpen: true }), false)
})

test('the seen flag is stored, migrated for existing users and kept in backups', async () => {
  const { default: useStore } = await import('../src/store/useStore.js')
  useStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
  const opts = useStore.persist.getOptions()

  assert.equal(useStore.getState().hasSeenIntroTour, false, 'a new user has not seen it')
  useStore.getState().setHasSeenIntroTour(true)
  assert.equal(opts.partialize(useStore.getState()).hasSeenIntroTour, true, 'persisted')

  // Someone already using the app (state from before v10) isn't greeted by it.
  assert.equal(opts.migrate({ hasChosenLanguage: true }, 9).hasSeenIntroTour, true)
  assert.equal(opts.migrate({ hasSeenIntroTour: false }, 9).hasSeenIntroTour, false)

  const backup = buildBackup(useStore.getState())
  assert.equal(backup.data.hasSeenIntroTour, true)
  const file = { app: BACKUP_APP, version: BACKUP_VERSION, data: { hasSeenIntroTour: true } }
  assert.equal(validateBackup(file).data.hasSeenIntroTour, true)
  useStore.getState().setHasSeenIntroTour(false)
})

test('both paths start on the welcome, end on done, and use known slides', () => {
  for (const [name, ids] of Object.entries(TOUR_PATHS)) {
    assert.equal(ids[0], 'welcome', name)
    assert.equal(ids.at(-1), 'done', name)
    assert.equal(new Set(ids).size, ids.length, `${name} repeats a slide`)
    for (const id of ids) assert.ok(TOUR_SLIDES[id], `${name}: unknown slide ${id}`)
  }
  assert.ok(TOUR_PATHS.quick.length <= 6)
  assert.ok(TOUR_PATHS.full.length >= 10)
})

test('every slide and button has its words in en, no and sv', () => {
  const shared = ['skip', 'close', 'back', 'next', 'progress', 'goTo', 'screenshotAlt', 'chooseTitle',
    'quick', 'quickTime', 'full', 'fullTime', 'ctaMakeWeek', 'ctaTrial', 'ctaExplore', 'disclaimer']
  for (const lang of TOUR_LANGS) {
    const tour = LOCALES[lang].tour
    for (const key of shared) assert.ok(tour?.[key], `${lang}: tour.${key}`)
    for (const id of Object.keys(TOUR_SLIDES)) {
      const keys = ['title', ...(id === 'done' ? ['body_makeWeek', 'body_trial', 'body_explore'] : ['body']),
        ...calloutKeys(id)]
      for (const key of keys) {
        const value = get(tour, `slides.${id}.${key}`)
        assert.ok(typeof value === 'string' && value.trim(), `${lang}: tour.slides.${id}.${key}`)
      }
    }
    for (const key of ['settings.tutorial', 'settings.tutorialDesc', 'settings.showTutorial', 'auth.trialNote']) {
      assert.ok(get(LOCALES[lang], key), `${lang}: ${key}`)
    }
  }
})

test('every screenshot the tour shows exists, at the size its positions assume', () => {
  const seen = new Set()
  for (const id of Object.keys(TOUR_SLIDES)) {
    for (const layout of TOUR_LAYOUTS) {
      for (const lang of TOUR_LANGS) {
        const shot = resolveShot(id, layout, lang)
        assert.ok(shot, `${id} has no ${layout} shot`)
        assert.ok(shot.src.startsWith(`/tour/${lang}/${layout}/`), shot.src)
        assert.ok(existsSync(publicFile(shot.src)), `missing ${shot.src}`)
        if (!seen.has(shot.src)) {
          seen.add(shot.src)
          assert.deepEqual(webpSize(readFileSync(publicFile(shot.src))), IMAGE_SIZE[layout], shot.src)
        }
        if (shot.crop) {
          const [top, bottom] = shot.crop
          assert.ok(top >= 0 && bottom <= 100 && bottom > top, `${id} ${layout} ${lang} crop`)
        }
        for (const m of shot.marks) {
          for (const rect of [m.box, m.mask].filter(Boolean)) {
            const [x, y, w, h] = rect
            assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 100.5 && y + h <= 100.5,
              `${id} ${layout} ${lang}: ${rect} is off the image`)
          }
          if (m.at) {
            const [lo, hi] = shot.crop || [0, 100]
            assert.ok(m.at[1] >= lo && m.at[1] <= hi, `${id} ${layout} ${lang}: label outside the crop`)
          }
        }
      }
    }
  }
})

test('the tour language falls back to English', () => {
  assert.equal(tourLang('nb-NO'), 'no')
  assert.equal(tourLang('de'), 'en')
  assert.equal(tourLang('no'), 'no')
  assert.equal(tourLang('sv-SE'), 'sv')
  assert.equal(tourLang(undefined), 'en')
})

// Free starter set (1.0.4): an explicit list opens in full for anyone
// without Premium. The Android first-launch sheet buys the same trial.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { FREE_RECIPE_IDS, isFreeRecipe, canOpenRecipe } from '../src/data/freeRecipes.js'
import {
  TRIAL_OFFER_SEEN_KEY,
  hasSeenTrialOffer,
  markTrialOfferSeen,
  shouldShowTrialOffer,
  isTrialOfferPending,
} from '../src/lib/trialOffer.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

function allRecipes() {
  const dir = join(ROOT, 'recipe-packs-template/packs')
  const out = []
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    const pack = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    for (const recipe of pack.recipes || []) out.push(recipe)
  }
  return out
}

describe('free starter set', () => {
  const byId = new Map(allRecipes().map((r) => [r.id, r]))

  it('is an explicit list of 15 recipes with photos, in the shape Fredrik asked for', () => {
    assert.equal(new Set(FREE_RECIPE_IDS).size, FREE_RECIPE_IDS.length)
    assert.equal(FREE_RECIPE_IDS.length, 15)
    const counts = {}
    for (const id of FREE_RECIPE_IDS) {
      const recipe = byId.get(id)
      assert.ok(recipe, `missing recipe ${id}`)
      assert.ok(recipe.imageUrl, `${id} has no photo`)
      const file = recipe.imageUrl.startsWith('/')
        ? join(ROOT, 'public', recipe.imageUrl)
        : null
      assert.ok(file && existsSync(file), `${id} photo missing on disk (${recipe.imageUrl})`)
      for (const lang of ['no', 'sv']) {
        assert.ok(recipe.translations?.[lang]?.title, `${id} missing ${lang} title`)
      }
      counts[recipe.category] = (counts[recipe.category] || 0) + 1
    }
    assert.equal(counts.Breakfast, 3, `breakfasts: ${JSON.stringify(counts)}`)
    assert.ok(counts.Main >= 5 && counts.Main <= 6, `mains: ${JSON.stringify(counts)}`)
    assert.equal(counts.Soup, 2)
    assert.equal((counts.Salad || 0) + (counts.Side || 0), 2)
    assert.equal((counts.Spreads || 0) + (counts.Sauce || 0), 2)
    const known = ['Breakfast', 'Main', 'Soup', 'Salad', 'Side', 'Spreads', 'Sauce']
    for (const key of Object.keys(counts)) assert.ok(known.includes(key), key)
  })

  it('includes Enkel hagesuppe and the Sunflower & Date Spread', () => {
    assert.ok(FREE_RECIPE_IDS.includes('fr-214'))
    assert.ok(FREE_RECIPE_IDS.includes('fr-215'))
    assert.equal(byId.get('fr-214').translations.no.title, 'Enkel hagesuppe')
    assert.equal(byId.get('fr-215').title, 'Sunflower & Date Spread')
  })

  it('opens the free set for a locked visitor and keeps every other recipe locked', () => {
    for (const id of FREE_RECIPE_IDS) {
      assert.equal(isFreeRecipe(id), true)
      assert.equal(canOpenRecipe(id, { locked: true }), true)
      assert.equal(canOpenRecipe(id, { locked: false }), true)
    }
    assert.equal(isFreeRecipe('fr-23'), false)
    assert.equal(canOpenRecipe('fr-23', { locked: true }), false)
    assert.equal(canOpenRecipe('fr-23', { locked: false }), true)
    assert.equal(canOpenRecipe(undefined, { locked: true }), false)
  })

  it('replaced the old first-breakfast-and-first-main picker', () => {
    const src = read('src/hooks/useAccess.js')
    assert.match(src, /isFreeRecipe/)
    assert.match(src, /FREE_RECIPE_IDS/)
    assert.doesNotMatch(src, /category === 'Breakfast'/)
    assert.doesNotMatch(src, /category === 'Dinner'/)
    const detail = read('src/components/recipes/RecipeDetail.jsx')
    assert.match(detail, /isLocked && !isPreviewRecipe\(id\)/)
  })

  it('badges free recipes and filters the list with a Gratis chip', () => {
    const card = read('src/components/recipes/RecipeCard.jsx')
    assert.match(card, /preview\.freeBadge/)
    assert.match(card, /showLock &&/)
    assert.doesNotMatch(card, /freePreview/)
    const list = read('src/components/recipes/RecipeList.jsx')
    assert.match(list, /freeOnly/)
    assert.match(list, /isFreeRecipe\(r\.id\)/)
    assert.match(list, /preview\.freeBadge/)
    for (const lang of ['en', 'no', 'sv']) {
      const preview = JSON.parse(read(`src/i18n/locales/${lang}.json`)).preview
      assert.ok(preview.freeBadge, `${lang} freeBadge`)
    }
    const badges = ['en', 'no', 'sv'].map((lang) => JSON.parse(read(`src/i18n/locales/${lang}.json`)).preview.freeBadge)
    assert.deepEqual(badges, ['Free', 'Gratis', 'Gratis'])
  })
})

describe('Android first-launch trial sheet', () => {
  const base = { native: true, seen: false, hasPremium: false, rcKnown: true, languageChosen: true, blocked: false }

  it('shows once on Android, never for Premium, and waits while Play is unknown', () => {
    assert.equal(shouldShowTrialOffer(base), true)
    assert.equal(isTrialOfferPending(base), false)
    assert.equal(shouldShowTrialOffer({ ...base, native: false }), false)
    assert.equal(shouldShowTrialOffer({ ...base, seen: true }), false)
    assert.equal(shouldShowTrialOffer({ ...base, hasPremium: true }), false)
    assert.equal(shouldShowTrialOffer({ ...base, languageChosen: false }), false)
    assert.equal(shouldShowTrialOffer({ ...base, blocked: true }), false)
    assert.equal(shouldShowTrialOffer({ ...base, rcKnown: false }), false)
    assert.equal(isTrialOfferPending({ ...base, rcKnown: false }), true)
    assert.equal(isTrialOfferPending({ ...base, native: false, rcKnown: false }), false)
  })

  it('remembers the dismissal in localStorage', () => {
    const storage = {
      m: new Map(),
      getItem(k) { return this.m.has(k) ? this.m.get(k) : null },
      setItem(k, v) { this.m.set(k, String(v)) },
    }
    assert.equal(hasSeenTrialOffer(storage), false)
    assert.equal(hasSeenTrialOffer(null), false)
    markTrialOfferSeen(storage)
    assert.equal(storage.getItem(TRIAL_OFFER_SEEN_KEY), '1')
    assert.equal(hasSeenTrialOffer(storage), true)
    markTrialOfferSeen(null)
  })

  it('buys the trial14 offer, respects safe areas, and opens the Gratis filter', () => {
    const sheet = read('src/components/subscription/FirstLaunchTrialSheet.jsx')
    assert.match(sheet, /rcPurchasePackage/)
    assert.doesNotMatch(sheet, /purchasePackage\(/)
    assert.doesNotMatch(sheet, /const Purchases = await loadPurchases\(\)/)
    assert.doesNotMatch(sheet, /function withTimeout/)
    assert.match(sheet, /withTimeout/)
    assert.match(sheet, /WATCHDOG_MS/)
    assert.match(sheet, /const waiting = !stalled &&/)
    assert.match(sheet, /safe-area-screen/)
    assert.match(sheet, /trialOffer\.offer/)
    assert.match(sheet, /trialOffer\.explore/)
    assert.match(sheet, /OFFER_TIMEOUT_MS/)
    assert.ok(!sheet.includes('!ready || !pkg'))
    const app = read('src/App.jsx')
    assert.match(app, /isNativeAndroid\(\)/)
    assert.match(app, /shouldShowTrialOffer/)
    assert.match(app, /freeOnly: true/)
    assert.match(app, /markTrialOfferSeen/)
    for (const lang of ['en', 'no', 'sv']) {
      const copy = JSON.parse(read(`src/i18n/locales/${lang}.json`)).trialOffer
      for (const key of ['offer', 'price', 'cancel', 'explore']) assert.ok(copy[key], `${lang} ${key}`)
    }
    const no = JSON.parse(read('src/i18n/locales/no.json')).trialOffer
    assert.equal(no.offer, 'Prøv gratis i 14 dager')
    assert.equal(no.price, '120 NOK/måned')
    assert.equal(no.explore, 'Utforsk gratis oppskrifter')
  })

  it('ships as Android 1.0.4 (versionCode 5)', () => {
    const gradle = read('android/app/build.gradle')
    assert.match(gradle, /versionCode 5/)
    assert.match(gradle, /versionName "1.0.4"/)
  })
})

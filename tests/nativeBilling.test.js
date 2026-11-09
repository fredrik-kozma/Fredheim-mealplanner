import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  RC_ENTITLEMENT_ID,
  PLAY_SUBSCRIPTIONS_URL,
  customerHasPremium,
  premiumDetails,
  pickMonthlyPackage,
  packageFreeTrialDays,
  isPurchaseCancelled,
} from '../src/lib/revenueCatHelpers.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const NOW = new Date('2026-11-09T12:00:00Z')
const info = (ent) => ({ entitlements: { active: ent ? { [RC_ENTITLEMENT_ID]: ent } : {} } })

describe('Google Play entitlement (RevenueCat)', () => {
  it('reads the premium entitlement only', () => {
    assert.equal(RC_ENTITLEMENT_ID, 'premium')
    assert.equal(customerHasPremium(null), false)
    assert.equal(customerHasPremium(info(null)), false)
    assert.equal(customerHasPremium({ entitlements: { active: { other: {} } } }), false)
    assert.equal(customerHasPremium(info({ periodType: 'NORMAL' })), true)
  })

  it('reports the free-trial phase and days left', () => {
    const d = premiumDetails(info({ periodType: 'TRIAL', expirationDate: '2026-11-23T12:00:00Z', willRenew: true }), NOW)
    assert.equal(d.active, true)
    assert.equal(d.isTrial, true)
    assert.equal(d.daysLeft, 14)
    const paid = premiumDetails(info({ periodType: 'NORMAL', expirationDate: '2026-12-09T12:00:00Z', willRenew: false }), NOW)
    assert.equal(paid.isTrial, false)
    assert.equal(paid.willRenew, false)
    assert.deepEqual(premiumDetails(null, NOW), { active: false, isTrial: false, expiresAt: null, willRenew: false, daysLeft: 0 })
  })

  it('picks the monthly package from the current offering', () => {
    const monthly = { identifier: '$rc_monthly' }
    const other = { identifier: 'custom' }
    assert.equal(pickMonthlyPackage({ current: { availablePackages: [other, monthly] } }), monthly)
    assert.equal(pickMonthlyPackage({ current: null, all: { default: { availablePackages: [other] } } }), other)
    assert.equal(pickMonthlyPackage({ current: null, all: {} }), null)
    assert.equal(pickMonthlyPackage(null), null)
  })

  it('finds the length of the Play free trial on the package', () => {
    const pkg = { product: { defaultOption: { freePhase: { billingPeriod: { unit: 'DAY', value: 14 } } } } }
    assert.equal(packageFreeTrialDays(pkg), 14)
    const week = { product: { subscriptionOptions: [{ freePhase: null }, { freePhase: { billingPeriod: { unit: 'WEEK', value: 2 } } }] } }
    assert.equal(packageFreeTrialDays(week), 14)
    assert.equal(packageFreeTrialDays({ product: { defaultOption: { freePhase: null } } }), null)
    assert.equal(packageFreeTrialDays(null), null)
  })

  it('treats a dismissed Play sheet as cancelled, not an error', () => {
    assert.equal(isPurchaseCancelled({ userCancelled: true }), true)
    assert.equal(isPurchaseCancelled({ code: '1', message: 'x' }), true)
    assert.equal(isPurchaseCancelled({ message: 'Purchase was cancelled.' }), true)
    assert.equal(isPurchaseCancelled({ message: 'Network error' }), false)
  })

  it('links to the Play subscriptions page for this app', () => {
    assert.match(PLAY_SUBSCRIPTIONS_URL, /package=no\.fredheim\.app$/)
  })
})

describe('Android app needs no account', () => {
  it('configures RevenueCat anonymously (no appUserID)', () => {
    const src = read('src/lib/revenueCat.js')
    assert.match(src, /Purchases\.configure\(\{ apiKey: API_KEY \}\)/)
    assert.doesNotMatch(src, /configure\(\{[^}]*appUserID/)
  })

  it('never logs RevenueCat out automatically (would drop an anonymous purchase)', () => {
    const ctx = read('src/contexts/RevenueCatContext.jsx')
    assert.doesNotMatch(ctx, /logOut/)
  })

  it('keeps the hard upgrade wall off in the app', () => {
    assert.match(read('src/App.jsx'), /!IS_NATIVE && !stillLoading && user && !isActive/)
  })

  it('has every new string in English, Norwegian and Swedish', () => {
    const langs = ['en', 'no', 'sv'].map((l) => JSON.parse(read(`src/i18n/locales/${l}.json`)))
    for (const group of ['subscription', 'auth']) {
      const keys = Object.keys(langs[0][group]).filter((k) => k.startsWith('native'))
      assert.ok(keys.length > 0)
      for (const l of langs) for (const k of keys) assert.ok(l[group][k], `${group}.${k}`)
    }
  })
})

// ── 1.0.3: trial offer selection, error reasons, safe-area ───────────────────
import { pickTrialOption, describeBillingError } from '../src/lib/revenueCatHelpers.js'

describe('Google Play trial offer and errors (1.0.3)', () => {
  const base = { id: 'monthly', isBasePlan: true, freePhase: null }
  const trial = { id: 'monthly:trial14', isBasePlan: false, freePhase: { billingPeriod: { unit: 'DAY', value: 14 } } }

  it('buys the trial14 offer explicitly when Google Play offers it', () => {
    assert.equal(pickTrialOption({ product: { subscriptionOptions: [base, trial] } }), trial)
    assert.equal(pickTrialOption({ product: { subscriptionOptions: [base] } }), null)
    assert.equal(pickTrialOption(null), null)
  })

  it('maps RevenueCat errors to a reason instead of failing silently', () => {
    assert.equal(describeBillingError({ code: 23, message: 'None of the products registered in the RevenueCat dashboard could be fetched' }).kind, 'storeProducts')
    assert.equal(describeBillingError({ code: '10', message: 'Error performing request' }).kind, 'network')
    assert.equal(describeBillingError({ code: '3', message: 'x' }).kind, 'notAllowed')
    assert.equal(describeBillingError(new Error('boom')).kind, 'unknown')
  })

  it('paywall never leaves a permanently disabled subscribe button', () => {
    const src = read('src/components/subscription/NativePaywall.jsx')
    assert.ok(!src.includes('!ready || !pkg'), 'button must not be disabled just because the package is missing')
    assert.ok(src.includes('nativeRetry'))
    assert.ok(src.includes('OFFER_TIMEOUT_MS'))
    for (const lang of ['en', 'no', 'sv']) {
      const sub = JSON.parse(read(`src/i18n/locales/${lang}.json`)).subscription
      for (const k of ['nativeLoading', 'nativeRetry']) assert.ok(sub[k], `${lang} ${k}`)
      for (const k of ['storeProducts', 'network', 'notAllowed', 'store', 'unknown']) assert.ok(sub.nativeError[k], `${lang} nativeError.${k}`)
    }
  })

  it('keeps the app below the Android status bar', () => {
    const html = read('index.html')
    assert.ok(html.includes("isNativePlatform()") && html.includes("'width=device-width, initial-scale=1.0'"))
    const cfg = JSON.parse(read('capacitor.config.json'))
    assert.equal(cfg.plugins.SystemBars.insetsHandling, 'css')
    assert.ok(read('src/App.jsx').includes('sticky top-0 z-30 safe-area-top'))
  })
})

// Android 1.0.5: in-app 14-day device trial. The website keeps account gating.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createHash } from 'node:crypto'

import {
  DEVICE_TRIAL_DAYS,
  ANDROID_APP_VERSION,
  earliestIso,
  resolveDeviceTrial,
  resolveAccess,
} from '../src/lib/deviceTrial.js'
import { DEVICE_ID_SALT, hashDeviceId, isDeviceHash } from '../src/lib/deviceId.js'
import { pickBasePlanOption } from '../src/lib/revenueCatHelpers.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const DAY = 24 * 60 * 60 * 1000

describe('device trial clock', () => {
  const start = '2026-11-01T00:00:00.000Z'

  it('is active for 14 days and expired after', () => {
    const during = resolveDeviceTrial({
      serverFirstSeen: start,
      now: new Date(Date.parse(start) + 13 * DAY + 1000),
    })
    assert.equal(during.grantsAccess, true)
    assert.equal(during.expired, false)
    assert.equal(during.daysLeft, 1)
    assert.equal(during.showBanner, true)
    const ended = resolveDeviceTrial({
      serverFirstSeen: start,
      now: new Date(Date.parse(start) + DEVICE_TRIAL_DAYS * DAY + 1),
    })
    assert.equal(ended.grantsAccess, false)
    assert.equal(ended.expired, true)
    assert.equal(ended.daysLeft, 0)
    assert.equal(ended.showBanner, false)
  })

  it('uses the earliest of the server and local clocks', () => {
    const earlier = '2026-10-01T00:00:00.000Z'
    const later = '2026-11-01T00:00:00.000Z'
    assert.equal(earliestIso(later, earlier), new Date(earlier).toISOString())
    assert.equal(earliestIso(earlier, null), new Date(earlier).toISOString())
    assert.equal(earliestIso(null, null), null)
    const now = new Date(Date.parse(later) + 10 * DAY)
    const fromServer = resolveDeviceTrial({ serverFirstSeen: later, localFirstSeen: earlier, now })
    assert.equal(fromServer.firstSeen, new Date(earlier).toISOString())
    assert.equal(fromServer.grantsAccess, false)
  })

  it('grants access on an offline first launch and does not when a clock exists', () => {
    const offline = resolveDeviceTrial({ serverUnreachable: true, now: new Date() })
    assert.equal(offline.grantsAccess, true)
    assert.equal(offline.pending, true)
    assert.equal(offline.daysLeft, DEVICE_TRIAL_DAYS)
    assert.equal(offline.showBanner, false)
    const waiting = resolveDeviceTrial({ serverUnreachable: false, now: new Date() })
    assert.equal(waiting.grantsAccess, false)
    assert.equal(waiting.pending, false)
  })

  it('shows the quiet banner only in the last 3 days', () => {
    const day12 = resolveDeviceTrial({
      serverFirstSeen: start,
      now: new Date(Date.parse(start) + 2 * DAY),
    })
    assert.equal(day12.daysLeft, 12)
    assert.equal(day12.showBanner, false)
    const day3 = resolveDeviceTrial({
      serverFirstSeen: start,
      now: new Date(Date.parse(start) + 11 * DAY),
    })
    assert.equal(day3.daysLeft, 3)
    assert.equal(day3.showBanner, true)
  })
})

describe('who is premium', () => {
  it('keeps the website on the account trial and ignores the device trial', () => {
    assert.deepEqual(
      resolveAccess({ platform: 'web', profileActive: true, rcPremium: false, deviceTrialGrants: false }),
      { active: true, reason: 'account' },
    )
    assert.deepEqual(
      resolveAccess({ platform: 'web', profileActive: false, rcPremium: false, deviceTrialGrants: true }),
      { active: false, reason: 'account' },
    )
    const access = read('src/hooks/useAccess.js')
    assert.match(access, /category === 'Breakfast'/)
    assert.doesNotMatch(read('src/App.jsx'), /FirstLaunchTrialSheet|freeRecipes|freeOnly/)
  })

  it('on Android, a Play entitlement overrides an expired device trial', () => {
    assert.deepEqual(
      resolveAccess({ platform: 'android', profileActive: false, rcPremium: true, deviceTrialGrants: false }),
      { active: true, reason: 'entitlement' },
    )
  })

  it('on Android, a new Fredheim account trial does not grant access', () => {
    assert.deepEqual(
      resolveAccess({ platform: 'android', profileActive: true, rcPremium: false, deviceTrialGrants: false }),
      { active: false, reason: 'locked' },
    )
    assert.deepEqual(
      resolveAccess({ platform: 'android', profileActive: true, rcPremium: false, deviceTrialGrants: true }),
      { active: true, reason: 'device-trial' },
    )
  })
})

describe('device id and base plan', () => {
  it('hashes ANDROID_ID with the app salt and never sends the raw id shape', async () => {
    const hash = await hashDeviceId('android-id-example')
    const expected = createHash('sha256').update(`${DEVICE_ID_SALT}:android-id-example`).digest('hex')
    assert.equal(hash, expected)
    assert.equal(isDeviceHash(hash), true)
    assert.equal(isDeviceHash('android-id-example'), false)
    assert.notEqual(await hashDeviceId('other'), hash)
    const src = read('src/lib/deviceId.js')
    assert.match(src, /Device\.getId\(\)/)
    assert.match(src, /@capacitor\/device/)
  })

  it('prefers the monthly base plan with no free phase and no offer id', () => {
    const base = { id: 'monthly', basePlanId: 'monthly', offerId: null, freePhase: null }
    const trial = { id: 'monthly:trial14', basePlanId: 'monthly', offerId: 'trial14', freePhase: { billingPeriod: { unit: 'DAY', value: 14 } } }
    const offerOnly = { id: 'monthly:trial14', basePlanId: 'monthly', offerId: 'trial14', freePhase: null }
    assert.equal(pickBasePlanOption({ product: { subscriptionOptions: [trial, base] } }), base)
    assert.equal(pickBasePlanOption({ product: { subscriptionOptions: [offerOnly] } }), null)
    assert.equal(pickBasePlanOption({ product: { defaultOption: base } }), base)
    const purchase = read('src/lib/revenueCat.js')
    assert.match(purchase, /pickBasePlanOption/)
    assert.match(purchase, /purchaseSubscriptionOption/)
    assert.match(purchase, /purchasePackage/)
  })

  it('ships as Android 1.0.5 (versionCode 6)', () => {
    const gradle = read('android/app/build.gradle')
    assert.match(gradle, /versionCode 6/)
    assert.match(gradle, /versionName "1\.0\.5"/)
    assert.equal(ANDROID_APP_VERSION, '1.0.5')
    assert.match(read('supabase/functions/device-trial/index.ts'), /device_hash/)
    assert.match(read('supabase/migrations/20261110120000_device_trials.sql'), /enable row level security/)
  })
})

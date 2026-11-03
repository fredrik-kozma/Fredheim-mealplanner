import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const logic = require(join(
  dirname(fileURLToPath(import.meta.url)),
  '../netlify/functions/lib/revenuecatWebhookLogic.cjs'
))

const {
  isAnonymousAppUserId,
  isValidUuidAppUserId,
  verifyWebhookAuth,
  msToIso,
  shouldApplyStripeProfileUpdate,
  shouldApplyPlayRevoke,
  planProfileUpdateFromRevenueCatEvent,
  isPlayEntitlementActive,
  isStripeEntitlementActive,
} = logic

const UID = '11111111-2222-4333-8444-555555555555'
const NOW = new Date('2026-11-02T12:00:00.000Z')

describe('revenuecat webhook auth + ids', () => {
  it('rejects missing auth', () => {
    assert.equal(verifyWebhookAuth('', 'secret'), false)
    assert.equal(verifyWebhookAuth(undefined, 'secret'), false)
    assert.equal(verifyWebhookAuth('secret', ''), false)
  })

  it('accepts raw or Bearer Authorization', () => {
    assert.equal(verifyWebhookAuth('sekrit', 'sekrit'), true)
    assert.equal(verifyWebhookAuth('Bearer sekrit', 'sekrit'), true)
    assert.equal(verifyWebhookAuth('Bearer nope', 'sekrit'), false)
  })

  it('detects anonymous RC ids', () => {
    assert.equal(isAnonymousAppUserId('$RCAnonymousID:abc'), true)
    assert.equal(isAnonymousAppUserId(UID), false)
    assert.equal(isAnonymousAppUserId(null), true)
  })

  it('rejects non-uuid app_user_id', () => {
    assert.equal(isValidUuidAppUserId('test'), false)
    assert.equal(isValidUuidAppUserId(UID), true)
    const plan = planProfileUpdateFromRevenueCatEvent(
      {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'test',
        product_id: 'fredheim_premium:monthly',
        period_type: 'NORMAL',
        expiration_at_ms: Date.parse('2026-12-01T00:00:00.000Z'),
      },
      null,
      NOW
    )
    assert.equal(plan.skip, true)
    assert.equal(plan.reason, 'invalid_user_id')
  })

  it('converts expiration_at_ms', () => {
    const ms = Date.parse('2026-11-02T12:00:00.000Z')
    assert.equal(msToIso(ms), '2026-11-02T12:00:00.000Z')
    assert.equal(msToIso(null), null)
  })
})

describe('cross-store guards', () => {
  const playActive = {
    subscription_source: 'google_play',
    subscription_status: 'active',
    rc_expires_at: '2026-12-01T00:00:00.000Z',
    current_period_end: '2026-12-01T00:00:00.000Z',
  }
  const stripeActive = {
    subscription_source: 'stripe',
    subscription_status: 'active',
    current_period_end: '2026-12-01T00:00:00.000Z',
    rc_expires_at: null,
  }

  it('Play entitlement active helper', () => {
    assert.equal(isPlayEntitlementActive(playActive, NOW), true)
    assert.equal(
      isPlayEntitlementActive(
        { ...playActive, rc_expires_at: '2026-10-01T00:00:00.000Z' },
        NOW
      ),
      false
    )
  })

  it('Stripe entitlement active helper', () => {
    assert.equal(isStripeEntitlementActive(stripeActive, NOW), true)
    assert.equal(isStripeEntitlementActive(playActive, NOW), false)
  })

  it('Stripe cancel must not clobber active Play', () => {
    assert.equal(
      shouldApplyStripeProfileUpdate(playActive, 'canceled', NOW),
      false
    )
    assert.equal(
      shouldApplyStripeProfileUpdate(playActive, 'active', NOW),
      true
    )
    assert.equal(
      shouldApplyStripeProfileUpdate(stripeActive, 'canceled', NOW),
      true
    )
  })

  it('Play EXPIRATION must not revoke active Stripe', () => {
    assert.equal(shouldApplyPlayRevoke(stripeActive, NOW), false)
    assert.equal(shouldApplyPlayRevoke(playActive, NOW), true)
  })
})

describe('planProfileUpdateFromRevenueCatEvent', () => {
  const baseEvent = {
    app_user_id: UID,
    product_id: 'fredheim_premium:monthly',
    period_type: 'NORMAL',
    expiration_at_ms: Date.parse('2026-12-01T00:00:00.000Z'),
  }

  it('skips anonymous', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, app_user_id: '$RCAnonymousID:x', type: 'INITIAL_PURCHASE' },
      null,
      NOW
    )
    assert.equal(plan.skip, true)
    assert.equal(plan.reason, 'anonymous_user')
  })

  it('INITIAL_PURCHASE grants google_play active', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'INITIAL_PURCHASE' },
      null,
      NOW
    )
    assert.equal(plan.mode, 'upsert')
    assert.equal(plan.update.subscription_source, 'google_play')
    assert.equal(plan.update.subscription_status, 'active')
    assert.equal(plan.update.subscription_id, 'fredheim_premium:monthly')
    assert.equal(plan.update.rc_expires_at, '2026-12-01T00:00:00.000Z')
  })

  it('TRIAL period maps to trialing', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'INITIAL_PURCHASE', period_type: 'TRIAL' },
      null,
      NOW
    )
    assert.equal(plan.update.subscription_status, 'trialing')
  })

  it('CANCELLATION keeps entitlement until expiration', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'CANCELLATION' },
      null,
      NOW
    )
    assert.equal(plan.mode, 'upsert')
    assert.equal(plan.update.subscription_status, 'active')
  })

  it('BILLING_ISSUE â†’ past_due', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'BILLING_ISSUE' },
      null,
      NOW
    )
    assert.equal(plan.update.subscription_status, 'past_due')
  })

  it('EXPIRATION revokes Play-only user', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'EXPIRATION' },
      {
        subscription_source: 'google_play',
        subscription_status: 'active',
        rc_expires_at: '2026-12-01T00:00:00.000Z',
      },
      NOW
    )
    assert.equal(plan.mode, 'revoke')
    assert.equal(plan.update.subscription_status, 'expired')
  })

  it('EXPIRATION does not revoke when Stripe is active', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'EXPIRATION' },
      {
        subscription_source: 'stripe',
        subscription_status: 'active',
        current_period_end: '2026-12-15T00:00:00.000Z',
      },
      NOW
    )
    assert.equal(plan.reason, 'stripe_active_blocks_play_revoke')
    assert.equal(plan.update.subscription_status, undefined)
    assert.ok(plan.update.rc_expires_at)
  })

  it('TRANSFER grants the new app_user_id', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'TRANSFER' },
      null,
      NOW
    )
    assert.equal(plan.appUserId, UID)
    assert.equal(plan.update.subscription_source, 'google_play')
  })

  it('unknown types are skipped', () => {
    const plan = planProfileUpdateFromRevenueCatEvent(
      { ...baseEvent, type: 'TEST' },
      null,
      NOW
    )
    assert.equal(plan.skip, true)
  })
})



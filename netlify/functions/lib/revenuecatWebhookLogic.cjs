/**
 * Pure helpers for the RevenueCat → Supabase profiles webhook.
 * CommonJS so Netlify functions and Node tests can require() it.
 */

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

function isAnonymousAppUserId(appUserId) {
  if (!appUserId || typeof appUserId !== 'string') return true
  return appUserId.startsWith('$RCAnonymousID')
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuidAppUserId(appUserId) {
  return typeof appUserId === 'string' && UUID_RE.test(appUserId)
}

/**
 * RevenueCat dashboard "Authorization header" value may be sent as-is or as Bearer.
 */
function verifyWebhookAuth(authorizationHeader, expectedSecret) {
  if (!expectedSecret) return false
  const got = (authorizationHeader || '').trim()
  if (!got) return false
  if (got === expectedSecret) return true
  if (got === `Bearer ${expectedSecret}`) return true
  // Some dashboards store the value already including "Bearer "
  if (expectedSecret.startsWith('Bearer ') && got === expectedSecret) return true
  return false
}

function msToIso(ms) {
  if (ms == null || ms === '') return null
  const n = typeof ms === 'number' ? ms : Number(ms)
  if (!Number.isFinite(n)) return null
  return new Date(n).toISOString()
}

function statusFromPeriodType(periodType) {
  return periodType === 'TRIAL' ? 'trialing' : 'active'
}

function isPlayEntitlementActive(profile, now = new Date()) {
  if (!profile) return false
  if (profile.subscription_source !== 'google_play') return false
  if (!ACTIVE_STATUSES.has(profile.subscription_status)) return false
  if (profile.rc_expires_at) {
    const exp = new Date(profile.rc_expires_at)
    if (Number.isFinite(exp.getTime()) && exp <= now) return false
  }
  return true
}

function isStripeEntitlementActive(profile, now = new Date()) {
  if (!profile) return false
  if (profile.subscription_source !== 'stripe') return false
  if (!ACTIVE_STATUSES.has(profile.subscription_status)) return false
  // Canceled-at-period-end still has current_period_end in the future with status canceled
  // — only treat trialing/active as unlocking here.
  if (profile.current_period_end) {
    const end = new Date(profile.current_period_end)
    if (Number.isFinite(end.getTime()) && end <= now && profile.subscription_status !== 'trialing') {
      // period ended
      return false
    }
  }
  return true
}

/**
 * Stripe webhook/sync: do not overwrite an active Play subscription with a
 * non-active Stripe status (and avoid flipping source away from Play while Play is live).
 */
function shouldApplyStripeProfileUpdate(profile, nextStatus, now = new Date()) {
  if (!isPlayEntitlementActive(profile, now)) return true
  if (ACTIVE_STATUSES.has(nextStatus)) return true // Stripe becoming active wins / coexists as stripe source
  return false
}

/**
 * Play EXPIRATION (and similar revoke): do not clear access if Stripe is the
 * active source / still entitled.
 */
function shouldApplyPlayRevoke(profile, now = new Date()) {
  if (isStripeEntitlementActive(profile, now)) return false
  if (profile?.subscription_source === 'stripe' && ACTIVE_STATUSES.has(profile.subscription_status)) {
    return false
  }
  return true
}

/**
 * Map a RevenueCat event object to a profiles patch plan.
 * @returns {{
 *   skip?: boolean,
 *   reason?: string,
 *   appUserId?: string,
 *   mode?: 'upsert' | 'revoke',
 *   update?: object
 * }}
 */
function planProfileUpdateFromRevenueCatEvent(event, profile = null, now = new Date()) {
  if (!event || typeof event !== 'object') {
    return { skip: true, reason: 'missing_event' }
  }

  const appUserId = event.app_user_id
  if (isAnonymousAppUserId(appUserId)) {
    return { skip: true, reason: 'anonymous_user' }
  }
  if (!isValidUuidAppUserId(appUserId)) {
    return { skip: true, reason: 'invalid_user_id' }
  }

  const type = event.type
  const expiresIso = msToIso(event.expiration_at_ms)
  const productId = event.product_id || null
  const baseGrant = {
    subscription_id: productId,
    subscription_source: 'google_play',
    current_period_end: expiresIso,
    rc_expires_at: expiresIso,
    updated_at: now.toISOString(),
  }

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION':
    case 'TRANSFER':
      return {
        appUserId,
        mode: 'upsert',
        update: {
          ...baseGrant,
          subscription_status: statusFromPeriodType(event.period_type),
        },
      }

    case 'CANCELLATION':
      // Still entitled until expiration — keep active/trialing, refresh dates.
      return {
        appUserId,
        mode: 'upsert',
        update: {
          ...baseGrant,
          subscription_status: statusFromPeriodType(event.period_type),
        },
      }

    case 'BILLING_ISSUE':
      return {
        appUserId,
        mode: 'upsert',
        update: {
          ...baseGrant,
          subscription_status: 'past_due',
        },
      }

    case 'SUBSCRIPTION_PAUSED':
      // Access continues until EXPIRATION with reason SUBSCRIPTION_PAUSED.
      // Record pause without revoking; keep period end.
      return {
        appUserId,
        mode: 'upsert',
        update: {
          ...baseGrant,
          subscription_status: statusFromPeriodType(event.period_type),
        },
      }

    case 'EXPIRATION': {
      if (!shouldApplyPlayRevoke(profile, now)) {
        return {
          skip: true,
          reason: 'stripe_active_blocks_play_revoke',
          appUserId,
          // Still record Play expiry timestamp without clearing Stripe access.
          mode: 'upsert',
          update: {
            rc_expires_at: expiresIso,
            updated_at: now.toISOString(),
          },
        }
      }
      return {
        appUserId,
        mode: 'revoke',
        update: {
          subscription_status: 'expired',
          subscription_source: 'google_play',
          current_period_end: expiresIso,
          rc_expires_at: expiresIso,
          updated_at: now.toISOString(),
        },
      }
    }

    default:
      return { skip: true, reason: 'unhandled_type', appUserId, type }
  }
}

module.exports = {
  ACTIVE_STATUSES,
  isAnonymousAppUserId,
  isValidUuidAppUserId,
  verifyWebhookAuth,
  msToIso,
  statusFromPeriodType,
  isPlayEntitlementActive,
  isStripeEntitlementActive,
  shouldApplyStripeProfileUpdate,
  shouldApplyPlayRevoke,
  planProfileUpdateFromRevenueCatEvent,
}

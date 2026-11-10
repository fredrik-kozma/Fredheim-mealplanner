/**
 * App-managed 14-day trial for the Android app. Pure date rules so tests
 * can cover them without Capacitor or Supabase.
 *
 * Trial start is the earliest of the server row and the on-device copy.
 * A reinstall cannot move that start later. When neither value exists and
 * the server cannot be reached, access is granted and the client retries.
 */

export const DEVICE_TRIAL_DAYS = 14
export const DEVICE_TRIAL_BANNER_DAYS = 3
export const ANDROID_APP_VERSION = '1.0.5'

export function earliestIso(serverFirstSeen, localFirstSeen) {
  const times = [serverFirstSeen, localFirstSeen]
    .map((value) => (value ? Date.parse(value) : NaN))
    .filter((n) => !Number.isNaN(n))
  if (times.length === 0) return null
  return new Date(Math.min(...times)).toISOString()
}

/**
 * @param {object} input
 * @param {string|null|undefined} input.serverFirstSeen
 * @param {string|null|undefined} input.localFirstSeen
 * @param {boolean} [input.serverUnreachable]
 * @param {Date|string|number} input.now
 */
export function resolveDeviceTrial({ serverFirstSeen, localFirstSeen, serverUnreachable = false, now }) {
  const firstSeen = earliestIso(serverFirstSeen, localFirstSeen)
  if (!firstSeen) {
    // No clock started yet. Offline (or the call has not returned): let
    // them in and retry. An online call that returns a row never lands here.
    return {
      grantsAccess: !!serverUnreachable,
      pending: !!serverUnreachable,
      expired: false,
      daysLeft: serverUnreachable ? DEVICE_TRIAL_DAYS : 0,
      firstSeen: null,
      endsAt: null,
      showBanner: false,
    }
  }
  const startMs = Date.parse(firstSeen)
  const endsAtMs = startMs + DEVICE_TRIAL_DAYS * 24 * 60 * 60 * 1000
  const nowMs = new Date(now).getTime()
  const remaining = endsAtMs - nowMs
  const active = remaining > 0
  const daysLeft = active ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0
  return {
    grantsAccess: active,
    pending: false,
    expired: !active,
    daysLeft,
    firstSeen: new Date(startMs).toISOString(),
    endsAt: new Date(endsAtMs).toISOString(),
    showBanner: active && daysLeft <= DEVICE_TRIAL_BANNER_DAYS,
  }
}

/**
 * Who has premium. The website ignores the device trial and keeps the
 * Supabase account trial/subscription. Android ignores a Fredheim account
 * trial: access is the Play entitlement, or the device trial while it lasts.
 */
export function resolveAccess({ platform, isAdmin, profileActive, rcPremium, deviceTrialGrants }) {
  if (isAdmin) return { active: true, reason: 'admin' }
  if (platform !== 'android') return { active: !!profileActive, reason: 'account' }
  if (rcPremium) return { active: true, reason: 'entitlement' }
  if (deviceTrialGrants) return { active: true, reason: 'device-trial' }
  return { active: false, reason: 'locked' }
}

// Pure checks for the delete-account function. No network, so tests can
// lock the confirmation and Stripe rules without a Supabase call.

const CONFIRM_PHRASE = 'DELETE'

// Stripe statuses that can still bill the customer. Already-ended
// subscriptions are left alone.
const CANCELABLE_SUBSCRIPTION_STATUSES = new Set([
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'paused',
  'incomplete',
])

function bearerToken(authorization) {
  if (typeof authorization !== 'string') return ''
  const match = authorization.match(/^Bearer\s+(\S+)\s*$/i)
  return match ? match[1] : ''
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

/**
 * Gate the request before any delete runs.
 * Returns { ok: true, token } or { ok: false, status, error }.
 */
function assessDeleteRequest({ method, authorization, body }) {
  if (method !== 'POST') {
    return { ok: false, status: 405, error: 'Method not allowed' }
  }

  let parsed = body
  if (typeof body === 'string') {
    try {
      parsed = body ? JSON.parse(body) : {}
    } catch {
      return { ok: false, status: 400, error: 'Invalid JSON' }
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, status: 400, error: 'Invalid JSON' }
  }
  if (parsed.confirm !== CONFIRM_PHRASE) {
    return { ok: false, status: 400, error: 'Type DELETE to confirm.' }
  }

  const token = bearerToken(authorization)
  if (!token) return { ok: false, status: 401, error: 'Sign in required.' }
  return { ok: true, token }
}

function subscriptionIdsToCancel(subscriptions) {
  if (!Array.isArray(subscriptions)) return []
  const ids = []
  for (const sub of subscriptions) {
    if (!sub || typeof sub.id !== 'string' || !sub.id) continue
    if (!CANCELABLE_SUBSCRIPTION_STATUSES.has(sub.status)) continue
    ids.push(sub.id)
  }
  return ids
}

module.exports = {
  CONFIRM_PHRASE,
  CANCELABLE_SUBSCRIPTION_STATUSES,
  bearerToken,
  json,
  assessDeleteRequest,
  subscriptionIdsToCancel,
}

// POST /.netlify/functions/revenuecat-webhook
// RevenueCat server notifications â†’ Supabase profiles (Play Billing / entitlement premium).

const { createClient } = require('@supabase/supabase-js')
const {
  verifyWebhookAuth,
  isAnonymousAppUserId,
  planProfileUpdateFromRevenueCatEvent,
  shouldApplyPlayRevoke,
} = require('./lib/revenuecatWebhookLogic.cjs')

exports.handler = async (event) => {
  console.log('revenuecat-webhook: invoked', event.httpMethod)

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const authSecret = process.env.REVENUECAT_WEBHOOK_AUTH
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!authSecret || !supabaseUrl || !serviceRoleKey) {
    console.error('revenuecat-webhook: missing environment variables')
    return { statusCode: 500, body: 'Missing environment variables' }
  }

  const authHeader =
    event.headers.authorization ||
    event.headers.Authorization ||
    ''

  if (!verifyWebhookAuth(authHeader, authSecret)) {
    console.warn('revenuecat-webhook: unauthorized')
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const rcEvent = payload.event || payload
  if (!rcEvent || !rcEvent.type) {
    return { statusCode: 400, body: 'Missing event' }
  }

  console.log('revenuecat-webhook: event', rcEvent.type, 'app_user_id', rcEvent.app_user_id)

  if (isAnonymousAppUserId(rcEvent.app_user_id)) {
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, skipped: 'anonymous_user' }),
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const uid = rcEvent.app_user_id
    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select(
        'id, subscription_status, subscription_id, subscription_source, current_period_end, rc_expires_at, trial_ends_at'
      )
      .eq('id', uid)
      .maybeSingle()

    if (readError) {
      console.error('revenuecat-webhook: profile read error', readError)
      return { statusCode: 500, body: 'Profile read failed' }
    }

    if (!profile) {
      console.warn('revenuecat-webhook: no profile for', uid)
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, skipped: 'no_profile' }),
      }
    }

    const plan = planProfileUpdateFromRevenueCatEvent(rcEvent, profile)

    // EXPIRATION with Stripe active: still write rc_expires_at only (plan includes that).
    if (plan.skip && plan.reason === 'stripe_active_blocks_play_revoke' && plan.update) {
      const { error } = await supabase.from('profiles').update(plan.update).eq('id', uid)
      if (error) {
        console.error('revenuecat-webhook: partial update error', error)
        return { statusCode: 500, body: 'Update failed' }
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, skipped: plan.reason }),
      }
    }

    if (plan.skip) {
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, skipped: plan.reason || true }),
      }
    }

    if (plan.mode === 'revoke' && !shouldApplyPlayRevoke(profile)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, skipped: 'stripe_active_blocks_play_revoke' }),
      }
    }

    console.log('revenuecat-webhook: updating profile', uid, plan.update)
    const { error: updateError } = await supabase
      .from('profiles')
      .update(plan.update)
      .eq('id', uid)

    if (updateError) {
      console.error('revenuecat-webhook: Supabase update error', updateError)
      return { statusCode: 500, body: 'Update failed' }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, type: rcEvent.type }),
    }
  } catch (err) {
    console.error('revenuecat-webhook: handler error', err.message, err.stack)
    return { statusCode: 500, body: 'Internal error' }
  }
}



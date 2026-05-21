// POST /api/sync-subscription
// Called from the frontend after checkout completes (?checkout=success).
// Looks up the Stripe subscription for this customer and syncs status to Supabase.
// This is a reliable fallback in case the webhook is delayed or missed.

const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { userId } = JSON.parse(event.body || '{}')
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) }
    }

    const stripe   = Stripe(process.env.STRIPE_SECRET_KEY)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Get the Stripe customer ID from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No Stripe customer found' }),
      }
    }

    // Get the latest active subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 1,
      status: 'all',
    })

    if (!subscriptions.data.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({ synced: false, reason: 'No subscriptions found' }),
      }
    }

    const sub = subscriptions.data[0]
    const statusMap = {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'past_due',
      incomplete: 'past_due',
      incomplete_expired: 'canceled',
      paused: 'past_due',
    }

    const update = {
      subscription_id:     sub.id,
      subscription_status: statusMap[sub.status] || sub.status,
      current_period_end:  sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', userId)

    if (updateError) {
      console.error('sync-subscription: Supabase update error:', updateError)
      return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ synced: true, status: update.subscription_status }),
    }
  } catch (err) {
    console.error('sync-subscription error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}

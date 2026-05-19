// POST /api/stripe-webhook
// Stripe calls this automatically after every subscription event.
// We verify the signature and update the user's profile in Supabase.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

// Service-role client bypasses RLS so we can update any profile row.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Map a Stripe subscription status to what we store in profiles.
function mapStatus(stripeStatus) {
  const map = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    paused: 'past_due',
  }
  return map[stripeStatus] || stripeStatus
}

async function upsertProfile(subscription) {
  const uid = subscription.metadata?.supabase_uid
  if (!uid) {
    console.warn('stripe-webhook: subscription missing supabase_uid metadata', subscription.id)
    return
  }

  const update = {
    subscription_id: subscription.id,
    subscription_status: mapStatus(subscription.status),
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', uid)

  if (error) {
    console.error('stripe-webhook: failed to update profile', uid, error)
  } else {
    console.log('stripe-webhook: updated profile', uid, update.subscription_status)
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // Verify Stripe signature — this proves the request is really from Stripe.
  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('stripe-webhook: signature verification failed', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await upsertProfile(stripeEvent.data.object)
        break

      case 'invoice.payment_succeeded': {
        // Keep current_period_end fresh after each renewal.
        const invoice = stripeEvent.data.object
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription)
          await upsertProfile(sub)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription)
          await upsertProfile(sub)
        }
        break
      }

      default:
        // Ignore unhandled event types.
        break
    }
  } catch (err) {
    console.error('stripe-webhook: handler error', err)
    return { statusCode: 500, body: 'Internal error' }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}

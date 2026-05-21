// POST /api/stripe-webhook
// Stripe calls this automatically after every subscription event.
// We verify the signature and update the user's profile in Supabase.

const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

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

exports.handler = async (event) => {
  console.log('stripe-webhook: invoked', event.httpMethod)

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // ── Initialise clients inside the handler so env vars are definitely loaded ─
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret   = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl     = process.env.VITE_SUPABASE_URL
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('stripe-webhook: env check', {
    hasStripeKey:    !!stripeSecretKey,
    hasWebhookSecret: !!webhookSecret,
    hasSupabaseUrl:  !!supabaseUrl,
    hasServiceKey:   !!serviceRoleKey,
  })

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error('stripe-webhook: missing environment variables')
    return { statusCode: 500, body: 'Missing environment variables' }
  }

  const stripe   = Stripe(stripeSecretKey)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // ── Verify Stripe signature ────────────────────────────────────────────────
  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      webhookSecret
    )
    console.log('stripe-webhook: signature OK, event type:', stripeEvent.type)
  } catch (err) {
    console.error('stripe-webhook: signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  // ── Handle events ──────────────────────────────────────────────────────────
  try {
    async function upsertProfile(subscription) {
      console.log('stripe-webhook: upsertProfile subscription.id:', subscription.id)
      console.log('stripe-webhook: subscription.metadata:', JSON.stringify(subscription.metadata))
      console.log('stripe-webhook: subscription.status:', subscription.status)

      const uid = subscription.metadata?.supabase_uid
      if (!uid) {
        console.warn('stripe-webhook: no supabase_uid in subscription metadata — skipping update')
        return
      }

      const update = {
        subscription_id:     subscription.id,
        subscription_status: mapStatus(subscription.status),
        current_period_end:  subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }

      console.log('stripe-webhook: updating profile', uid, update)

      const { data, error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', uid)
        .select()

      if (error) {
        console.error('stripe-webhook: Supabase update error:', JSON.stringify(error))
      } else {
        console.log('stripe-webhook: Supabase update success, rows affected:', data?.length)
      }
    }

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await upsertProfile(stripeEvent.data.object)
        break

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription)
          await upsertProfile(sub)
        }
        break
      }

      default:
        console.log('stripe-webhook: unhandled event type', stripeEvent.type)
        break
    }
  } catch (err) {
    console.error('stripe-webhook: handler error:', err.message, err.stack)
    return { statusCode: 500, body: 'Internal error' }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}

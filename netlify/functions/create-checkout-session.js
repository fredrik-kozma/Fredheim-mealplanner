// POST /api/create-checkout-session
// Body: { userId, userEmail, returnUrl }
// Returns: { url } — redirect the browser to this Stripe Checkout URL

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { userId, userEmail, returnUrl } = JSON.parse(event.body || '{}')

    if (!userId || !userEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId and userEmail are required' }) }
    }

    // Retrieve or create a Stripe customer so the customer is linked to the
    // Supabase user across multiple sessions / devices.
    let customerId
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_uid: userId },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Build the checkout session.
    const sessionParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancel`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_uid: userId },
      },
    }

    // ── Stripe Connect (payment splitting) ────────────────────────────────
    // When STRIPE_CONNECT_ACCOUNT_ID is set the platform automatically
    // forwards a share of each payment to the connected account.
    // Set STRIPE_PLATFORM_FEE_PERCENT to e.g. "50" for a 50 % platform fee
    // (meaning 50 % stays with fredr, 50 % goes to the connected account).
    // Leave both env vars unset to skip splitting entirely.
    if (process.env.STRIPE_CONNECT_ACCOUNT_ID && process.env.STRIPE_PLATFORM_FEE_PERCENT) {
      sessionParams.subscription_data.application_fee_percent =
        parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT)
      sessionParams.on_behalf_of = process.env.STRIPE_CONNECT_ACCOUNT_ID
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}

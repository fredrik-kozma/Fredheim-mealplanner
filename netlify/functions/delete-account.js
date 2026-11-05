// POST /.netlify/functions/delete-account
// Body: { confirm: "DELETE" }
// Header: Authorization: Bearer <supabase access token>
//
// Deletes the signed-in Supabase Auth user. public.profiles references
// auth.users ON DELETE CASCADE, and we also delete the profile row first
// so a missing cascade cannot leave the subscription record behind.
//
// Stripe subscriptions for that customer are cancelled when Stripe allows
// it. Google Play billing is not cancelled here — Play subscriptions are
// managed by Google, and the page tells the user to cancel them there.

const { createClient } = require('@supabase/supabase-js')
const {
  json,
  assessDeleteRequest,
  subscriptionIdsToCancel,
} = require('./lib/deleteAccountLogic.cjs')

exports.handler = async (event) => {
  const gate = assessDeleteRequest({
    method: event.httpMethod,
    authorization: event.headers?.authorization || event.headers?.Authorization,
    body: event.body,
  })
  if (!gate.ok) return json(gate.status, { error: gate.error })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('delete-account: missing Supabase env')
    return json(500, { error: 'Account deletion is not configured.' })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await admin.auth.getUser(gate.token)
  const user = userData?.user
  if (userError || !user) {
    return json(401, { error: 'Sign in required.' })
  }

  let profile = null
  let stripeCancel = 'none'
  const { data: profileRow, error: profileReadError } = await admin
    .from('profiles')
    .select('stripe_customer_id, subscription_id, subscription_source')
    .eq('id', user.id)
    .maybeSingle()

  if (profileReadError) {
    console.error('delete-account: profile read failed', user.id, profileReadError.message)
    stripeCancel = 'failed'
  } else {
    profile = profileRow
  }

  if (profile?.stripe_customer_id) {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      console.error('delete-account: Stripe customer present but STRIPE_SECRET_KEY is missing')
      stripeCancel = 'failed'
    } else {
      try {
        const stripe = require('stripe')(stripeKey)
        const list = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'all',
          limit: 100,
        })
        const ids = subscriptionIdsToCancel(list.data)
        let canceled = 0
        let failed = false
        for (const id of ids) {
          try {
            await stripe.subscriptions.cancel(id)
            canceled += 1
          } catch (err) {
            failed = true
            console.error('delete-account: stripe cancel failed', user.id, id, err.message)
          }
        }
        stripeCancel = failed ? 'failed' : (canceled ? 'canceled' : 'none')
      } catch (err) {
        console.error('delete-account: stripe cancel failed', user.id, err.message)
        stripeCancel = 'failed'
      }
    }
  }

  const { error: profileDeleteError } = await admin
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileDeleteError) {
    console.error('delete-account: profile delete failed', user.id, profileDeleteError.message)
    return json(500, {
      error: 'Could not delete the account profile. The login was not removed. Try again, or email viverahealth@gmail.com.',
    })
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('delete-account: auth delete failed', user.id, authError.message)
    return json(500, {
      error: 'Could not delete the login. Email viverahealth@gmail.com and we will remove it.',
    })
  }

  return json(200, {
    deleted: true,
    stripeCancel,
    playBilling: profile?.subscription_source === 'google_play',
  })
}

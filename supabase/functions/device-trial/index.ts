// First-seen clock for the Android device trial.
// Deploy with: supabase functions deploy device-trial
// The app calls it with the anon key (no user). verify_jwt stays on so a
// request without the anon key is rejected. The service role never leaves
// this function. Only the caller's own row is returned.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const HASH = /^[0-9a-f]{64}$/
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const length = Number(req.headers.get('content-length') || '0')
  if (length > 2000) return json({ error: 'invalid device_hash' }, 400)

  let body: { device_hash?: unknown; app_version?: unknown; platform?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid device_hash' }, 400)
  }

  const deviceHash = String(body.device_hash || '').toLowerCase()
  if (!HASH.test(deviceHash)) return json({ error: 'invalid device_hash' }, 400)

  const appVersion = String(body.app_version || '').slice(0, 32)
  const platform = 'android'

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ error: 'unavailable' }, 500)

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const inserted = await supabase
    .from('device_trials')
    .insert({ device_hash: deviceHash, app_version: appVersion, platform })
    .select('first_seen')
    .maybeSingle()

  if (!inserted.error && inserted.data?.first_seen) {
    return json({ first_seen: inserted.data.first_seen })
  }

  // 23505 unique_violation: the row already exists. Read that one row only.
  if (inserted.error && inserted.error.code !== '23505') {
    return json({ error: 'unavailable' }, 500)
  }

  const existing = await supabase
    .from('device_trials')
    .select('first_seen')
    .eq('device_hash', deviceHash)
    .maybeSingle()

  if (existing.error || !existing.data?.first_seen) return json({ error: 'unavailable' }, 500)
  return json({ first_seen: existing.data.first_seen })
})

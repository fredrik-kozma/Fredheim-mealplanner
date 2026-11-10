import { supabase } from './supabase'
import { ANDROID_APP_VERSION } from './deviceTrial.js'
import { isDeviceHash } from './deviceId.js'

/**
 * Ask the device-trial edge function for this install's first_seen.
 * Insert-on-conflict on the server: a second call cannot move the start.
 * Throws when the function is unreachable or rejects the hash.
 */
export async function fetchDeviceTrialStart(deviceHash) {
  if (!isDeviceHash(deviceHash)) {
    throw new Error('invalid device hash')
  }
  const { data, error } = await supabase.functions.invoke('device-trial', {
    body: {
      device_hash: deviceHash,
      app_version: ANDROID_APP_VERSION,
      platform: 'android',
    },
  })
  if (error) throw error
  const first = data?.first_seen
  if (!first || Number.isNaN(Date.parse(first))) throw new Error('device-trial returned no first_seen')
  return new Date(first).toISOString()
}

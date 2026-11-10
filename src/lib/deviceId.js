/**
 * Stable Android device id for the trial and for RevenueCat.
 *
 * @capacitor/device Device.getId() returns Settings.Secure.ANDROID_ID on
 * Android (stable per signing key + user + device since Android 8). The raw
 * id is hashed before it is sent to Supabase or used as a RevenueCat
 * appUserID.
 */

export const DEVICE_ID_SALT = 'fredheim-android-device-v1'

export function isDeviceHash(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
}

export async function hashDeviceId(androidId) {
  const data = new TextEncoder().encode(`${DEVICE_ID_SALT}:${String(androidId)}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** ANDROID_ID via @capacitor/device, then SHA-256 with DEVICE_ID_SALT. */
export async function getHashedAndroidId() {
  const { Device } = await import('@capacitor/device')
  const { identifier } = await Device.getId()
  if (!identifier) throw new Error('ANDROID_ID unavailable')
  return hashDeviceId(identifier)
}

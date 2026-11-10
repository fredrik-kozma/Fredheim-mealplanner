/** On-device copy of the trial start. Capacitor Preferences, included in Android Auto Backup. */
export const DEVICE_TRIAL_PREF_KEY = 'fredheim_device_trial_first_seen'

export async function readLocalFirstSeen(preferences) {
  const api = preferences || (await loadPreferences())
  const { value } = await api.get({ key: DEVICE_TRIAL_PREF_KEY })
  if (!value || Number.isNaN(Date.parse(value))) return null
  return new Date(value).toISOString()
}

export async function writeLocalFirstSeen(iso, preferences) {
  if (!iso || Number.isNaN(Date.parse(iso))) return
  const api = preferences || (await loadPreferences())
  await api.set({ key: DEVICE_TRIAL_PREF_KEY, value: new Date(iso).toISOString() })
}

async function loadPreferences() {
  const { Preferences } = await import('@capacitor/preferences')
  return Preferences
}

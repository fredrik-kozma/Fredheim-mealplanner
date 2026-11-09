import { Capacitor } from '@capacitor/core'

/**
 * True inside the Capacitor Android (or iOS) shell, false in any browser —
 * including the installed PWA. The website never takes a native branch.
 */
export function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

export function isNativeAndroid() {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

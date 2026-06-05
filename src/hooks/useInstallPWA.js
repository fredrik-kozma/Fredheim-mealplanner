import { useState, useEffect } from 'react'

/**
 * Cross-platform PWA install hook.
 *
 * Returns an object describing whether the app can be installed on the
 * current device, plus an `install()` function that triggers the right
 * flow:
 *   - Android / Desktop Chrome / Edge: fires the captured
 *     beforeinstallprompt event → native install dialog
 *   - iOS Safari: returns "ios" so the caller can show its own
 *     step-by-step modal (Apple does not expose an install API)
 *
 * Properties:
 *   - isStandalone      true if the page is already running as an
 *                       installed PWA (display-mode: standalone, or
 *                       navigator.standalone on iOS)
 *   - isIOSSafari       true on iOS Safari (the only iOS browser that
 *                       can Add-to-Home-Screen)
 *   - canPromptNatively true if we've captured a beforeinstallprompt
 *                       event and can call .prompt() on it
 *   - canInstall        true if either route is available
 *   - install()         async (). Returns:
 *                         "accepted"  - native prompt was accepted
 *                         "dismissed" - native prompt was dismissed
 *                         "ios"       - caller should show iOS modal
 *                         "unavailable" - nothing to do
 */
function isStandalone() {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true
    if (window.navigator.standalone === true) return true
  } catch { /* SSR safe */ }
  return false
}

function isIOS() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return false
}

function isIOSSafari() {
  if (!isIOS()) return false
  const ua = navigator.userAgent || ''
  return !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

export default function useInstallPWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [standalone, setStandalone] = useState(() => isStandalone())

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    function onInstalled() {
      setStandalone(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const iosSafari = isIOSSafari()
  const canPromptNatively = !!installPrompt
  const canInstall = !standalone && (canPromptNatively || iosSafari)

  async function install() {
    if (standalone) return 'unavailable'
    if (canPromptNatively) {
      installPrompt.prompt()
      try {
        const choice = await installPrompt.userChoice
        setInstallPrompt(null)
        return choice.outcome === 'accepted' ? 'accepted' : 'dismissed'
      } catch {
        setInstallPrompt(null)
        return 'dismissed'
      }
    }
    if (iosSafari) return 'ios'
    return 'unavailable'
  }

  return {
    isStandalone: standalone,
    isIOSSafari: iosSafari,
    canPromptNatively,
    canInstall,
    install,
  }
}

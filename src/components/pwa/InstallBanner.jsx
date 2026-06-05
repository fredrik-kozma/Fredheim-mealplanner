import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const DISMISS_KEY = 'fredheim_install_banner_dismissed_v1'

// Returns true if the page is already running as an installed PWA, in
// which case there's nothing to install. Detects both the standard
// display-mode media query (Android / Chrome / Edge) and the iOS-only
// navigator.standalone flag.
function isStandalone() {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true
    if (window.navigator.standalone === true) return true
  } catch { /* SSR safe */ }
  return false
}

// iPadOS 13+ user agents report as MacIntel; the touch-points heuristic
// is the reliable distinguishing factor.
function isIOS() {
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true
  return false
}

// Only Safari supports Add-to-Home-Screen on iOS — other browsers on iOS
// (Chrome, Firefox, Edge) reuse Safari's WebKit but block PWA install.
function isIOSSafari() {
  if (!isIOS()) return false
  const ua = navigator.userAgent || ''
  return !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

/**
 * Floating "Install app" banner. Appears at the bottom of the viewport
 * a few seconds after the app loads, on devices where installing is
 * actually possible (Android/Desktop with prompt API, or iOS Safari with
 * manual instructions). Hidden when already installed, when previously
 * dismissed, or when the install isn't supported (e.g. desktop Firefox).
 */
export default function InstallBanner() {
  const { t } = useTranslation()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    // Already installed → bail completely.
    if (isStandalone()) return

    // Previously dismissed by the user → respect that.
    if (localStorage.getItem(DISMISS_KEY) === '1') return

    // Capture the install event so we can fire it later from our own
    // button instead of the browser's default mini-infobar.
    function onBeforeInstall(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // If the user installs via the native browser menu instead of our
    // button, we still want to hide ourselves.
    function onInstalled() {
      setVisible(false)
      localStorage.setItem(DISMISS_KEY, '1')
    }
    window.addEventListener('appinstalled', onInstalled)

    // Show after a short delay so the banner doesn't pop up before the
    // user has even seen the page. Also, on iOS Safari we don't get the
    // beforeinstallprompt event — show after the same delay anyway.
    const showTimer = setTimeout(() => setVisible(true), 2500)

    return () => {
      clearTimeout(showTimer)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!visible) return null

  // We can either prompt natively (most non-iOS browsers) or show our
  // own iOS instructions modal. If neither is possible, no banner.
  const canPromptNatively = !!installPrompt
  const canShowIOSHelp = isIOSSafari()
  if (!canPromptNatively && !canShowIOSHelp) return null

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  async function handleInstall() {
    if (canPromptNatively) {
      installPrompt.prompt()
      try {
        const choice = await installPrompt.userChoice
        if (choice.outcome === 'accepted') {
          dismiss()
        }
      } catch { /* user cancelled */ }
      setInstallPrompt(null)
      return
    }
    // iOS Safari — show the step-by-step modal.
    setShowIOSHelp(true)
  }

  return (
    <>
      {/* Bottom-anchored card. On phones we clear the bottom nav
          (bottom-24), on desktops we float to the right (bottom-4). */}
      <div
        className="fixed bottom-24 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40
                   bg-white border border-slate-200 shadow-2xl rounded-2xl
                   p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4"
        role="dialog"
        aria-label={t('install.title', { defaultValue: 'Install app' })}
      >
        <img
          src="/fredheim-logo.svg"
          alt=""
          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {t('install.title', { defaultValue: 'Install Fredheim' })}
          </p>
          <p className="text-[11px] text-slate-500 leading-tight truncate">
            {t('install.subtitle', { defaultValue: 'Add it to your home screen' })}
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-lg py-1.5 px-3 text-xs flex-shrink-0 transition-colors"
        >
          {t('install.cta', { defaultValue: 'Install' })}
        </button>
        <button
          onClick={dismiss}
          aria-label={t('common.close', { defaultValue: 'Close' })}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* iOS Safari can't trigger an install programmatically. Show a
          tiny step-by-step modal that walks the user through the
          Share -> Add to Home Screen flow. */}
      {showIOSHelp && <IOSInstallInstructions onClose={() => setShowIOSHelp(false)} />}
    </>
  )
}

function IOSInstallInstructions({ onClose }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
        <button
          onClick={onClose}
          aria-label={t('common.close', { defaultValue: 'Close' })}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <img src="/fredheim-logo.svg" alt="" className="w-14 h-14 rounded-full mx-auto mb-3 object-cover" />
        <h2 className="text-lg font-bold text-slate-900 text-center mb-1">
          {t('install.iosTitle', { defaultValue: 'Add to Home Screen' })}
        </h2>
        <p className="text-sm text-slate-600 text-center mb-5">
          {t('install.iosIntro', { defaultValue: 'Install Fredheim Meal Planner on your iPhone or iPad in three steps:' })}
        </p>
        <ol className="space-y-3">
          {[1, 2, 3].map(n => (
            <li key={n} className="flex gap-3 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {n}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">
                {t(`install.iosStep${n}`)}
              </span>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
        >
          {t('install.iosDone', { defaultValue: 'Got it' })}
        </button>
      </div>
    </div>
  )
}

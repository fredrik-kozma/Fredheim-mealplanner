import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useInstallPWA from '../../hooks/useInstallPWA'
import IOSInstallInstructions from './IOSInstallInstructions'

const DISMISS_KEY = 'fredheim_install_banner_dismissed_v1'

/**
 * Floating "Install app" banner. Appears at the bottom of the viewport
 * a few seconds after the app loads, on devices where installing is
 * actually possible (Android/Desktop with prompt API, or iOS Safari with
 * manual instructions). Hidden when already installed, when previously
 * dismissed, or when the install isn't supported (e.g. desktop Firefox).
 *
 * A persistent install option is also available in Settings — this
 * banner is just the first-touch nudge.
 */
export default function InstallBanner() {
  const { t } = useTranslation()
  const { isStandalone, isIOSSafari, canInstall, install } = useInstallPWA()
  const [dismissed, setDismissed] = useState(true) // start hidden, reveal after delay
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    // Reveal after a short delay so the banner doesn't pop up before
    // the user has even seen the page.
    const showTimer = setTimeout(() => setDismissed(false), 2500)
    return () => clearTimeout(showTimer)
  }, [])

  if (isStandalone || dismissed || !canInstall) return null

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  async function handleInstall() {
    const result = await install()
    if (result === 'accepted') dismiss()
    else if (result === 'ios') setShowIOSHelp(true)
  }

  return (
    <>
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
            {isIOSSafari
              ? t('install.subtitleIOS', { defaultValue: 'Add to Home Screen — tap Install' })
              : t('install.subtitle', { defaultValue: 'Add it to your home screen' })}
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

      {showIOSHelp && <IOSInstallInstructions onClose={() => setShowIOSHelp(false)} />}
    </>
  )
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccess } from '../../hooks/useAccess'
import AuthModal from '../auth/AuthModal'

const DISMISS_KEY = 'fredheim_preview_banner_dismissed'

/**
 * Slim dismissible banner that appears on every page for anonymous visitors,
 * encouraging them to start a 14-day free trial. Dismissal is per-session
 * (cleared on browser close) so we don't nag forever but the user gets a
 * gentle reminder if they come back.
 */
export default function PreviewBanner() {
  const { t } = useTranslation()
  const { isAnonymous } = useAccess()
  const [dismissed, setDismissed] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  if (!isAnonymous || dismissed) return null

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm">
        <div className="flex items-center justify-center gap-3 px-3 py-2 max-w-5xl mx-auto">
          <span className="text-xs sm:text-sm font-medium flex-1 text-center">
            ✨ {t('preview.bannerText')}
          </span>
          <button
            onClick={() => setShowAuth(true)}
            className="text-xs sm:text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 rounded-full px-3 py-1 transition-colors flex-shrink-0"
          >
            {t('preview.startTrial')}
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white p-1 flex-shrink-0"
            aria-label={t('common.close')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showAuth && (
        <AuthModal initialTab="signup" onClose={() => setShowAuth(false)} />
      )}
    </>
  )
}

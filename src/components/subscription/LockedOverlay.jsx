import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from '../auth/AuthModal'

/**
 * Full-area overlay used to gate a page section (planner, shopping, locked
 * recipe). The parent should set position: relative; this component absolutely
 * fills it with a frosted blur and a centered CTA.
 *
 * Props:
 *   title       — main headline (i18n already applied by caller)
 *   description — sub-line, optional
 *   icon        — emoji or short string, optional (defaults to 🔒)
 */
export default function LockedOverlay({ title, description, icon = '🔒', compact = false }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('signup')

  async function handleSubscribe() {
    if (!user) {
      setAuthTab('signup')
      setShowAuth(true)
      return
    }
    // Signed in but expired → call create-checkout-session
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          returnUrl: window.location.origin,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-white/75 backdrop-blur-md">
        <div className={`text-center max-w-sm ${compact ? '' : ''}`}>
          <div className={`mx-auto rounded-card bg-primary-100 flex items-center justify-center ${
            compact ? 'w-12 h-12 text-2xl mb-3' : 'w-14 h-14 text-3xl mb-4'
          }`}>
            {icon}
          </div>
          <h2 className={`font-bold text-slate-900 mb-2 ${compact ? 'text-base' : 'text-lg'}`}>
            {title}
          </h2>
          {description && (
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              {description}
            </p>
          )}

          {/* Price chip */}
          <div className="inline-flex items-baseline gap-1 bg-primary-50 border border-primary-100 rounded-control px-3 py-1.5 mb-4">
            <span className="text-lg font-bold text-primary-700">120</span>
            <span className="text-xs text-primary-600 font-medium">NOK</span>
            <span className="text-2xs text-primary-400">
              / {t('subscription.perMonth')}
            </span>
            <span className="ml-1.5 text-2xs text-slate-400">
              · {t('preview.fourteenDayTrial')}
            </span>
          </div>

          <button
            onClick={handleSubscribe}
            className="btn-primary btn-lg w-full"
          >
            {user ? t('subscription.subscribeNow') : t('auth.startTrial')}
          </button>
          {!user && (
            <button
              onClick={() => { setAuthTab('signin'); setShowAuth(true) }}
              className="tap-target block w-full mt-2 text-xs text-slate-500 hover:text-slate-700"
            >
              {t('preview.alreadyHaveAccount')}
            </button>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal initialTab={authTab} onClose={() => setShowAuth(false)} />
      )}
    </>
  )
}

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
          <div className={`mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg ${
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
          <div className="inline-flex items-baseline gap-1 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 mb-4">
            <span className="text-lg font-bold text-indigo-700">120</span>
            <span className="text-xs text-indigo-600 font-medium">NOK</span>
            <span className="text-[10px] text-indigo-400">
              / {t('subscription.perMonth')}
            </span>
            <span className="ml-1.5 text-[10px] text-slate-400">
              · {t('preview.fourteenDayTrial')}
            </span>
          </div>

          <button
            onClick={handleSubscribe}
            className="btn-primary w-full py-3 font-semibold text-sm"
          >
            {user ? t('subscription.subscribeNow') : t('auth.startTrial')}
          </button>
          {!user && (
            <button
              onClick={() => { setAuthTab('signin'); setShowAuth(true) }}
              className="block w-full mt-2 text-xs text-slate-500 hover:text-slate-700"
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

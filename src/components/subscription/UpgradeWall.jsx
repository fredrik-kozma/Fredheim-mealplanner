import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'

// Calls the Netlify function and redirects to Stripe Checkout.
async function startCheckout(userId, userEmail) {
  const res = await fetch('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      userEmail,
      returnUrl: window.location.origin,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Checkout failed')
  window.location.href = data.url
}

// Calls the Netlify function and redirects to Stripe Customer Portal.
async function openPortal(userId) {
  const res = await fetch('/.netlify/functions/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, returnUrl: window.location.origin }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Portal failed')
  window.location.href = data.url
}

const STATUS_COPY = {
  expired: {
    titleKey: 'subscription.trialExpiredTitle',
    descKey: 'subscription.trialExpiredDesc',
    emoji: '⏰',
  },
  past_due: {
    titleKey: 'subscription.pastDueTitle',
    descKey: 'subscription.pastDueDesc',
    emoji: '💳',
  },
  canceled: {
    titleKey: 'subscription.canceledTitle',
    descKey: 'subscription.canceledDesc',
    emoji: '👋',
  },
}

export default function UpgradeWall() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { status } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const copy = STATUS_COPY[status] || STATUS_COPY.expired

  async function handleSubscribe() {
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      await startCheckout(user.id, user.email)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleManage() {
    if (!user) return
    setError(null)
    setLoading(true)
    try {
      await openPortal(user.id)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg">
          🍽
        </div>

        {/* Status emoji */}
        <div className="text-4xl mb-3">{copy.emoji}</div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          {t(copy.titleKey)}
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {t(copy.descKey)}
        </p>

        {/* Price badge */}
        <div className="inline-flex items-baseline gap-1 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 mb-6">
          <span className="text-2xl font-bold text-indigo-700">120</span>
          <span className="text-sm text-indigo-600 font-medium">NOK</span>
          <span className="text-xs text-indigo-400">
            / {t('subscription.perMonth')}
          </span>
        </div>

        {/* Features list */}
        <ul className="text-sm text-slate-600 text-left space-y-2 mb-7">
          {['subscription.feature1', 'subscription.feature2', 'subscription.feature3'].map((key) => (
            <li key={key} className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">✓</span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary w-full py-3.5 font-semibold text-base mb-3 disabled:opacity-60"
        >
          {loading ? '…' : t('subscription.subscribeNow')}
        </button>

        {/* Manage existing subscription (past_due) */}
        {status === 'past_due' && (
          <button
            onClick={handleManage}
            disabled={loading}
            className="btn-secondary w-full py-2.5 text-sm mb-3"
          >
            {t('subscription.updatePayment')}
          </button>
        )}

        <button
          onClick={signOut}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {t('auth.signOut')}
        </button>
      </div>
    </div>
  )
}

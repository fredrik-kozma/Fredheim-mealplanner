import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

// Supabase never times out on its own; a hung request left the button
// spinning forever.
const REQUEST_TIMEOUT_MS = 20000

function withTimeout(promise) {
  let id
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(Object.assign(new Error('timeout'), { name: 'Timeout' })), REQUEST_TIMEOUT_MS)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id))
}

/**
 * A sentence the user can act on, in their language. Server trouble, a
 * dropped connection and a timeout all read the same: try again shortly.
 * Supabase's own messages are English-only, so they are kept only for the
 * cases not recognised here.
 */
function authErrorMessage(err, t) {
  const status = Number(err?.status) || 0
  const code = err?.code || ''
  if (err?.name === 'Timeout' || err?.name === 'AuthRetryableFetchError' || status >= 500
      || err instanceof TypeError) {
    return t('auth.serviceError')
  }
  if (status === 429 || /rate_limit/.test(code)) return t('auth.tooManyAttempts')
  if (code === 'user_already_exists' || code === 'email_exists') return t('auth.emailInUse')
  if (code === 'weak_password') return t('auth.passwordTooShort')
  const msg = typeof err?.message === 'string' ? err.message.trim() : ''
  return msg && msg !== '{}' ? msg : t('auth.genericError')
}

export default function AuthModal({ onClose, initialTab = 'signin' }) {
  const { t } = useTranslation()
  const { signIn, signUp, resetPassword } = useAuth()

  // 'signin' | 'signup' | 'forgot'
  const [tab, setTab] = useState(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (tab === 'signup') {
        const data = await withTimeout(signUp(email.trim(), password))
        // An address that already has an account comes back looking like
        // a success, with no identities, and no email is ever sent.
        if (Array.isArray(data?.user?.identities) && data.user.identities.length === 0) {
          setError(t('auth.emailInUse'))
        } else {
          setSuccess(t('auth.signUpSuccess'))
        }
      } else if (tab === 'forgot') {
        await withTimeout(resetPassword(email.trim()))
        setSuccess(t('auth.resetEmailSent', {
          defaultValue: 'Check your inbox — we sent you a link to reset your password.',
        }))
      } else {
        await withTimeout(signIn(email.trim(), password))
        onClose()
      }
    } catch (err) {
      // Stay open: the form keeps what was typed, and the message says
      // what went wrong.
      console.warn('Auth request failed:', err)
      setError(authErrorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }

  // A stray tap outside must not throw away a request in flight (or the
  // message about why it failed).
  function handleBackdrop() {
    if (!loading) onClose()
  }

  function switchTab(next) {
    setTab(next)
    setError(null)
    setSuccess(null)
  }

  // Portalled to <body>: it is opened from the header and the preview
  // banner, which share a sticky z-30 wrapper. Left in place it would be
  // trapped in that stacking context, under the z-40 bottom nav.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdrop}
      />

      {/* Sheet */}
      <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* App icon + title */}
        <div className="flex flex-col items-center pt-5 pb-2 px-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl mb-3 shadow-md">
            🍽
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {t('app.name')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tab === 'signup'
              ? t('auth.trialTagline')
              : tab === 'forgot'
              ? t('auth.forgotPasswordTagline', { defaultValue: 'Reset your password' })
              : t('auth.welcomeBack')}
          </p>
        </div>

        {/* Tabs (hidden on the forgot-password view) */}
        {tab !== 'forgot' && (
          <div className="flex mx-6 mt-4 bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => switchTab('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => switchTab('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              className="input w-full"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password field — hidden on the forgot-password view */}
          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  {t('auth.password')}
                </label>
                {tab === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchTab('forgot')}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {t('auth.forgotPassword', { defaultValue: 'Forgot password?' })}
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                className="input w-full"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {tab === 'signup' && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {t('auth.passwordHint')}
                </p>
              )}
            </div>
          )}

          {tab === 'forgot' && (
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('auth.forgotPasswordHint', {
                defaultValue: 'Enter the email you signed up with and we\'ll send you a link to choose a new password.',
              })}
            </p>
          )}

          {error && (
            <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 font-semibold mt-1 disabled:opacity-60"
          >
            {loading
              ? '…'
              : tab === 'signup'
              ? t('auth.startTrial')
              : tab === 'forgot'
              ? t('auth.sendResetLink', { defaultValue: 'Send reset link' })
              : t('auth.signIn')}
          </button>

          {tab === 'signup' && (
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              {t('auth.trialNote')}
            </p>
          )}

          {tab === 'forgot' && (
            <button
              type="button"
              onClick={() => switchTab('signin')}
              className="w-full text-xs text-slate-500 hover:text-slate-700 mt-1"
            >
              ← {t('auth.backToSignIn', { defaultValue: 'Back to sign in' })}
            </button>
          )}
        </form>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label={t('common.close')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}

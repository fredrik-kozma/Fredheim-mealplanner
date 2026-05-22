import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

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
        await signUp(email.trim(), password)
        setSuccess(t('auth.signUpSuccess'))
      } else if (tab === 'forgot') {
        await resetPassword(email.trim())
        setSuccess(t('auth.resetEmailSent', {
          defaultValue: 'Check your inbox — we sent you a link to reset your password.',
        }))
      } else {
        await signIn(email.trim(), password)
        onClose()
      }
    } catch (err) {
      setError(err.message || t('auth.genericError'))
    } finally {
      setLoading(false)
    }
  }

  function switchTab(next) {
    setTab(next)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
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
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
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
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

/**
 * Landing page for the password-reset email link.
 *
 * Flow:
 *   1. User clicks the link in the reset email.
 *   2. Supabase exchanges the token for a temporary recovery session and
 *      fires a PASSWORD_RECOVERY auth event — supabase-js handles this
 *      automatically as long as detectSessionInUrl is true (the default).
 *   3. We land here. If a session is present, we render the new-password
 *      form. Otherwise we show a friendly "link expired" message.
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [hasSession, setHasSession] = useState(null) // null = loading
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  // Check that the recovery session is active. Supabase has already
  // exchanged the URL hash for a session by the time this component
  // mounts (detectSessionInUrl defaults to true).
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setHasSession(!!session)
    })
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError(t('auth.passwordTooShort', { defaultValue: 'Password must be at least 6 characters.' }))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwordsDontMatch', { defaultValue: 'Passwords don\'t match.' }))
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      // After 2.5s, send them to the home page (now signed in).
      setTimeout(() => navigate('/', { replace: true }), 2500)
    } catch (err) {
      setError(err.message || t('auth.genericError'))
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (hasSession === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-slate-50">
        <p className="text-sm text-slate-500">…</p>
      </div>
    )
  }

  // ── Link expired / invalid ────────────────────────────────────────────
  if (!hasSession) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-7 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mb-4">
            ⚠️
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">
            {t('auth.resetLinkExpiredTitle', { defaultValue: 'Reset link expired' })}
          </h1>
          <p className="text-sm text-slate-500 mb-5">
            {t('auth.resetLinkExpiredDesc', {
              defaultValue: 'This password reset link is no longer valid. Please request a new one from the sign-in screen.',
            })}
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="btn-primary w-full py-2.5 text-sm font-semibold"
          >
            {t('auth.backToApp', { defaultValue: 'Back to app' })}
          </button>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-7 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-green-100 flex items-center justify-center text-2xl mb-4">
            ✅
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">
            {t('auth.passwordUpdated', { defaultValue: 'Password updated!' })}
          </h1>
          <p className="text-sm text-slate-500">
            {t('auth.passwordUpdatedDesc', {
              defaultValue: 'You\'re signed in. Redirecting you to the app…',
            })}
          </p>
        </div>
      </div>
    )
  }

  // ── New password form ─────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-slate-50">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-7">
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl mb-3 shadow-md">
            🍽
          </div>
          <h1 className="text-lg font-bold text-slate-900">
            {t('auth.chooseNewPasswordTitle', { defaultValue: 'Choose a new password' })}
          </h1>
          <p className="text-xs text-slate-500 mt-1 text-center">
            {t('auth.chooseNewPasswordDesc', {
              defaultValue: 'Pick something you\'ll remember — at least 6 characters.',
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('auth.newPassword', { defaultValue: 'New password' })}
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="input w-full"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t('auth.confirmPassword', { defaultValue: 'Confirm new password' })}
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="input w-full"
              placeholder={t('auth.passwordPlaceholder')}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 font-semibold mt-1 disabled:opacity-60"
          >
            {loading ? '…' : t('auth.updatePassword', { defaultValue: 'Update password' })}
          </button>
        </form>
      </div>
    </div>
  )
}

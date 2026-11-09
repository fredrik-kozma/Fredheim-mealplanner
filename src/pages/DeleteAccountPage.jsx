import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import LegalShell, { linkify } from '../components/legal/LegalShell'
import AuthModal from '../components/auth/AuthModal'
import { useAuth, IS_DEV_AUTOLOGIN } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { clearLocalAccountData } from '../utils/clearLocalAccountData'
import { deletionCopy, initialLegalLang, legalText } from '../content/legalCopy'

const CONFIRM_PHRASE = 'DELETE'

export default function DeleteAccountPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, authLoading } = useAuth()
  const [lang, setLang] = useState(() => initialLegalLang(location.search, location.state?.lang))
  const [showAuth, setShowAuth] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const copy = legalText(deletionCopy, lang)
  const deleted = searchParams.get('deleted') === '1'
  const localCleared = searchParams.get('local') !== '0'
  const stripe = searchParams.get('stripe') || 'none'
  const ready = confirm.trim() === CONFIRM_PHRASE && !submitting

  async function handleDelete(e) {
    e.preventDefault()
    setError(null)
    if (confirm.trim() !== CONFIRM_PHRASE) return

    if (IS_DEV_AUTOLOGIN) {
      setError(copy.devBypass)
      return
    }

    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError(copy.sessionExpired)
        setShowAuth(true)
        return
      }

      const res = await fetch('/.netlify/functions/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.deleted) {
        setError(data.error || copy.genericError)
        return
      }

      let localOk = true
      try {
        await clearLocalAccountData()
      } catch (err) {
        console.warn('local account data was not cleared', err)
        localOk = false
      }
      try { await supabase.auth.signOut() } catch { /* the login is already gone */ }

      const params = new URLSearchParams({
        deleted: '1',
        local: localOk ? '1' : '0',
        stripe: data.stripeCancel || 'none',
        lang,
      })
      window.location.replace(`/delete-account?${params.toString()}`)
    } catch (err) {
      console.warn('account deletion failed', err)
      setError(copy.genericError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <LegalShell
      lang={lang}
      setLang={setLang}
      title={copy.title}
      footer={(
        <p>
          <Link to="/privacy" state={{ lang }} className="text-link">{copy.privacyLink}</Link>
        </p>
      )}
    >
      <h1 className="page-title">{copy.title}</h1>
      <p className="text-xs text-slate-400 mt-1">{copy.updated}</p>

      {deleted ? (
        <div className="card p-5 mt-5 space-y-3">
          <h2 className="section-title">{copy.successTitle}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{copy.successBody}</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {localCleared ? copy.successLocal : copy.successLocalFail}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {stripe === 'canceled' && copy.successStripe}
            {stripe === 'failed' && copy.successStripeFail}
            {stripe !== 'canceled' && stripe !== 'failed' && copy.successStripeNone}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed bg-warning-50 border border-warning-200 rounded-small px-3 py-2">
            {copy.successPlay}
          </p>
          <Link to="/" className="btn-secondary">{copy.back}</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{copy.intro}</p>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">{copy.noAccount}</p>

          <section className="mt-6">
            <h2 className="section-title">{copy.stepsTitle}</h2>
            <ol className="mt-2 space-y-2 list-decimal pl-5">
              {copy.steps.map(step => (
                <li key={step} className="text-sm text-slate-600 leading-relaxed">{linkify(step)}</li>
              ))}
            </ol>
          </section>

          <section className="mt-6">
            <h2 className="section-title">{copy.deletedTitle}</h2>
            <ul className="mt-2 space-y-2 list-disc pl-5">
              {copy.deleted.map(item => (
                <li key={item} className="text-sm text-slate-600 leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="section-title">{copy.keptTitle}</h2>
            <ul className="mt-2 space-y-2 list-disc pl-5">
              {copy.kept.map(item => (
                <li key={item} className="text-sm text-slate-600 leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="section-title">{copy.billingTitle}</h2>
            <p className="text-sm text-slate-700 leading-relaxed mt-2 bg-warning-50 border border-warning-200 rounded-small px-3 py-2">
              {linkify(copy.billing)}
            </p>
          </section>

          <p className="text-sm text-slate-600 leading-relaxed mt-4">{linkify(copy.emailFallback)}</p>

          <div className="card p-5 mt-6">
            {authLoading ? (
              <p className="text-sm text-slate-500">…</p>
            ) : user ? (
              <form onSubmit={handleDelete} className="space-y-3">
                <p className="text-sm text-slate-600">
                  {copy.signedInAs}{' '}
                  <span className="font-medium text-slate-800">{user.email}</span>
                </p>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{copy.confirmLabel}</span>
                  <input
                    className="input mt-1.5 w-full"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-describedby="delete-confirm-hint"
                  />
                </label>
                <p id="delete-confirm-hint" className="text-xs text-slate-500">{copy.confirmHint}</p>
                {error && (
                  <p className="text-xs text-danger-600 bg-danger-50 rounded-small px-3 py-2">{error}</p>
                )}
                <button type="submit" className="btn-danger w-full" disabled={!ready}>
                  {submitting ? copy.working : copy.button}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {error && (
                  <p className="text-xs text-danger-600 bg-danger-50 rounded-small px-3 py-2">{error}</p>
                )}
                <button type="button" className="btn-primary w-full" onClick={() => setShowAuth(true)}>
                  {copy.signIn}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showAuth && (
        <AuthModal initialTab="signin" onClose={() => setShowAuth(false)} />
      )}
    </LegalShell>
  )
}

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import AuthModal from '../auth/AuthModal'

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { isActive, isTrial, daysLeft, isAdmin } = useSubscription()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [authTab, setAuthTab] = useState('signin')

  const PAGE_TITLES = {
    '/': t('recipes.title'),
    '/planner': t('planner.title'),
    '/shopping': t('shopping.title'),
    '/settings': t('settings.title'),
    '/packs': t('packs.title'),
  }

  const title = PAGE_TITLES[location.pathname] || t('app.name')

  function openSignIn() {
    setAuthTab('signin')
    setShowAuthModal(true)
  }

  function openSignUp() {
    setAuthTab('signup')
    setShowAuthModal(true)
  }

  async function handleSignOut() {
    setShowUserMenu(false)
    try {
      await signOut()
    } catch {
      // ignore
    }
  }

  async function handleManageSubscription() {
    setShowUserMenu(false)
    if (!user) return
    try {
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, returnUrl: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Portal error:', err)
    }
  }

  async function handleCheckout() {
    setShowUserMenu(false)
    if (!user) return
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
      console.error('Checkout error:', err)
    }
  }

  // Avatar initials from email
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center gap-3 lg:hidden">
        {/* Logo + page title */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-75 transition-opacity flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base flex-shrink-0">
            🍽
          </div>
          <span className="font-semibold text-slate-800 text-base truncate">{title}</span>
        </button>

        {/* Trial badge */}
        {user && isTrial && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0">
            {t('subscription.trialDaysLeft', { count: daysLeft })}
          </span>
        )}

        {/* Auth area */}
        {user ? (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center hover:bg-indigo-200 transition-colors"
              aria-label={t('auth.account')}
            >
              {initials}
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-10 z-20 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
                  {/* Email */}
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {isAdmin ? (
                      <p className="text-[10px] font-semibold text-indigo-600 mt-0.5">
                        {t('subscription.adminAccess')}
                      </p>
                    ) : isActive ? (
                      <p className="text-[10px] font-semibold text-green-600 mt-0.5">
                        {isTrial
                          ? t('subscription.trialDaysLeft', { count: daysLeft })
                          : t('subscription.activeStatus')}
                      </p>
                    ) : null}
                  </div>

                  {/* Subscribe Now — trial users or expired/no-sub users */}
                  {!isAdmin && (isTrial || !isActive) && (
                    <button
                      onClick={handleCheckout}
                      className="w-full text-left px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      ✨ {t('subscription.subscribeNow')}
                    </button>
                  )}

                  {/* Manage subscription — active paid users only */}
                  {!isAdmin && isActive && !isTrial && (
                    <button
                      onClick={handleManageSubscription}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {t('subscription.manage')}
                    </button>
                  )}

                  {/* Trial users also get access to portal (cancel trial, etc.) */}
                  {!isAdmin && isTrial && (
                    <button
                      onClick={handleManageSubscription}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {t('subscription.manage')}
                    </button>
                  )}

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {t('auth.signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openSignIn}
              className="text-xs text-slate-600 hover:text-indigo-600 transition-colors font-medium"
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={openSignUp}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              {t('auth.signUp')}
            </button>
          </div>
        )}
      </header>

      {showAuthModal && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  )
}

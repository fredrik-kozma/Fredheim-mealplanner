import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { useAuth } from '../../contexts/AuthContext'
import { useSubscription } from '../../hooks/useSubscription'
import AuthModal from '../auth/AuthModal'
import TimerButton from '../timer/TimerButton'

const NAV_ITEMS = [
  {
    key: 'today',
    to: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  {
    key: 'recipes',
    to: '/recipes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    key: 'planner',
    to: '/planner',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    key: 'nutrition',
    to: '/nutrition',
    icon: (
      // Heart-with-pulse — "what you eat, tracked"
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 11.5h3l1.5-3 2 5 1.5-2h3" />
      </svg>
    ),
  },
  {
    key: 'shopping',
    to: '/shopping',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
  },
  // Packs deliberately has no tab. Installing one is a once-in-a-while
  // job, and a permanent tab for it was squeezing the five everyday
  // destinations — at 320px the labels were being truncated mid-word.
  // The page is still there, reached from Settings; choosing which pack
  // to see recipes from is a filter on the Recipes and planner screens,
  // which is where that belongs anyway.
  {
    key: 'settings',
    to: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const lastRecipesPath = useStore(s => s.lastRecipesPath)
  const setLastRecipesPath = useStore(s => s.setLastRecipesPath)
  const { user, signOut } = useAuth()
  const { isActive, isTrial, isAdmin, daysLeft } = useSubscription()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState('signin')

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '?'

  async function handleSignOut() {
    try { await signOut() } catch { /* ignore */ }
  }

  async function handlePortal() {
    if (!user) return
    try {
      const res = await fetch('/.netlify/functions/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, returnUrl: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) { console.error(err) }
  }

  async function handleCheckout() {
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
    } catch (err) { console.error(err) }
  }

  // Today is only for those with access; '/' is the recipe list for the rest.
  const navItems = isActive ? NAV_ITEMS : NAV_ITEMS.filter(item => item.key !== 'today')

  // The recipes tab is active when on the list or any recipe detail/edit page
  const recipesActive = location.pathname.startsWith('/recipes') ||
    (!isActive && location.pathname === '/')

  // Remember the last recipes sub-path so returning to the tab lands
  // exactly where the user was (list, detail, edit, or new).
  useEffect(() => {
    if (recipesActive) {
      setLastRecipesPath(location.pathname)
    }
  }, [location.pathname, recipesActive, setLastRecipesPath])

  function handleRecipesClick(e) {
    e.preventDefault()
    // A stored '/' is from when that was the recipe list.
    navigate(!lastRecipesPath || lastRecipesPath === '/' ? '/recipes' : lastRecipesPath)
  }

  return (
    <>
      {/* Bottom nav — mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/70 safe-area-bottom">
        <div className="flex items-stretch h-16">
          {navItems.map(({ key, to, icon }) => {
            // Six tabs share a 320px phone, about 53px each, which "Inställningar"
            // can't fit. Below 400px a tab shows its short label (navShort), and
            // keeps the full one as its accessible name.
            const name = t(`nav.${key}`)
            const tabClass = active => `flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-2xs transition-colors duration-150 ${
              active ? 'font-semibold text-primary-700' : 'font-medium text-slate-500 hover:text-slate-700'
            }`
            const tabBody = active => (
              <>
                <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors duration-150 ${active ? 'bg-primary-100' : ''}`}>
                  {icon}
                </span>
                <span className="whitespace-nowrap min-[400px]:hidden" aria-hidden>{t(`navShort.${key}`)}</span>
                <span className="whitespace-nowrap hidden min-[400px]:inline" aria-hidden>{name}</span>
              </>
            )
            if (key === 'recipes') {
              return (
                <button
                  key={to}
                  onClick={handleRecipesClick}
                  aria-label={name}
                  aria-current={recipesActive ? 'page' : undefined}
                  className={tabClass(recipesActive)}
                >
                  {tabBody(recipesActive)}
                </button>
              )
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                aria-label={name}
                className={({ isActive }) => tabClass(isActive)}
              >
                {({ isActive }) => tabBody(isActive)}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Side nav — desktop */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200/70 flex-col z-40">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200/70">
          <img
            src="/fredheim-logo.svg"
            alt=""
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
          <span className="section-title flex-1 min-w-0 truncate">{t('app.shortName')}</span>
          {/* The top bar is mobile-only, so desktop gets the timer here —
              same component, same running timers, just the other chrome. */}
          <TimerButton className="-mr-2" />
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {navItems.map(({ key, to, icon }) => {
            if (key === 'recipes') {
              return (
                <button
                  key={to}
                  onClick={handleRecipesClick}
                  aria-current={recipesActive ? 'page' : undefined}
                  className={`tap-target w-full flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium mb-0.5 transition-colors duration-150 ${
                    recipesActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {icon}
                  <span>{t(`nav.${key}`)}</span>
                </button>
              )
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `tap-target flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium mb-0.5 transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                {icon}
                <span>{t(`nav.${key}`)}</span>
              </NavLink>
            )
          })}
        </div>
        {/* Desktop auth / user area */}
        <div className="px-4 py-4 border-t border-slate-200/70">
          {user ? (
            <div className="space-y-2">
              {/* Email + status */}
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{user.email}</p>
                  {isAdmin ? (
                    <p className="text-2xs text-primary-500">{t('subscription.adminAccess')}</p>
                  ) : isTrial ? (
                    <p className="text-2xs text-warning-600">
                      {t('subscription.trialDaysLeft', { count: daysLeft })}
                    </p>
                  ) : isActive ? (
                    <p className="text-2xs text-success-600">{t('subscription.activeStatus')}</p>
                  ) : null}
                </div>
              </div>

              {/* Subscribe button for trial / expired users */}
              {!isAdmin && !isActive && (
                <button
                  onClick={handleCheckout}
                  className="tap-target w-full text-left px-3 py-1.5 rounded-small text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  ✨ {t('subscription.subscribeNow')}
                </button>
              )}

              {/* Manage subscription for active subscribers */}
              {!isAdmin && isActive && !isTrial && (
                <button
                  onClick={handlePortal}
                  className="tap-target w-full text-left px-3 py-1.5 rounded-small text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                >
                  {t('subscription.manage')}
                </button>
              )}

              {/* Trial users: show both subscribe and manage */}
              {!isAdmin && isTrial && (
                <button
                  onClick={handleCheckout}
                  className="tap-target w-full text-left px-3 py-1.5 rounded-small text-xs font-semibold text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  ✨ {t('subscription.subscribeNow')}
                </button>
              )}

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="tap-target w-full text-left px-3 py-1.5 rounded-small text-xs text-slate-500 hover:bg-slate-50 hover:text-danger-500 transition-colors"
              >
                {t('auth.signOut')}
              </button>

              {/* Support */}
              <a
                href="mailto:viverahealth@gmail.com"
                className="tap-target w-full text-left px-3 py-1.5 rounded-small text-xs text-slate-400 hover:bg-slate-50 hover:text-primary-600 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {t('settings.contactSupport', { defaultValue: 'Support' })}
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => { setAuthTab('signup'); setShowAuthModal(true) }}
                className="btn-primary w-full"
              >
                {t('auth.startTrial')}
              </button>
              <button
                onClick={() => { setAuthTab('signin'); setShowAuthModal(true) }}
                className="btn-secondary w-full"
              >
                {t('auth.signIn')}
              </button>
            </div>
          )}
        </div>
      </nav>

      {showAuthModal && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  )
}

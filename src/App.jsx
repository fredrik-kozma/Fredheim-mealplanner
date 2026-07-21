import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navigation from './components/layout/Navigation'
import Header from './components/layout/Header'
import RecipesPage from './pages/RecipesPage'
import PlannerPage from './pages/PlannerPage'
import ShoppingPage from './pages/ShoppingPage'
import SettingsPage from './pages/SettingsPage'
import PacksPage from './pages/PacksPage'
import NutritionPage from './pages/NutritionPage'
import RecipeForm from './components/recipes/RecipeForm'
import RecipeDetail from './components/recipes/RecipeDetail'
import ResetPasswordPage from './pages/ResetPasswordPage'
import useStore from './store/useStore'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { useSubscription } from './hooks/useSubscription'
import UpgradeWall from './components/subscription/UpgradeWall'
import PreviewBanner from './components/subscription/PreviewBanner'
import AutoInstallDefaultPack from './components/AutoInstallDefaultPack'
import TutorialModal from './components/onboarding/TutorialModal'
import InstallBanner from './components/pwa/InstallBanner'
import WhatsNewModal from './components/whatsnew/WhatsNewModal'

// Blocks rendering until the Zustand store has fully hydrated from IndexedDB.
// Without this guard, useEffect hooks in child components fire before hydration
// completes and can write stale empty state back to IndexedDB, wiping saved data.
function HydrationGate({ children }) {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated())

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true))
    return unsub
  }, [])

  if (!hydrated) return null
  return children
}

// Anonymous visitors and trial / active users see the full app (with a soft
// paywall — locked recipes, planner, shopping). Only users who are signed in
// AND whose trial / subscription is EXPIRED hit the hard UpgradeWall.
//
// A 3-second timeout ensures the app is never stuck blank if Supabase is
// slow or the device is offline — in that case we fall through to guest mode.
function SubscriptionGate({ children }) {
  const { user, authLoading } = useAuth()
  const { isActive, status, loading: subLoading } = useSubscription()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 3000)
    return () => clearTimeout(id)
  }, [])

  const stillLoading = authLoading || (user && subLoading)

  // While loading: show nothing (avoids layout flash).
  // But if it takes more than 3 s, give up and show the app anyway so
  // offline / slow-network users are not stuck on a blank screen.
  if (stillLoading && !timedOut) return null

  // Hard wall only for genuinely lapsed accounts (past_due, canceled, expired).
  // Anyone else — anonymous, trialing, active — sees the app with the soft
  // paywall (blurred recipes etc.).
  const hardWallStatuses = ['past_due', 'canceled', 'expired']
  if (!stillLoading && user && !isActive && hardWallStatuses.includes(status)) {
    return <UpgradeWall />
  }

  return children
}

function AppShell() {
  const location = useLocation()

  // Handle ?checkout=success — Stripe redirects here after payment.
  // We call sync-subscription directly (reliable fallback for slow webhooks),
  // then refetch the profile so the UpgradeWall disappears immediately.
  const { refetch } = useSubscription()
  const { user } = useAuth()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('checkout') !== 'success' || !user) return

    async function syncAndRefetch() {
      try {
        await fetch('/.netlify/functions/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      } catch (err) {
        console.warn('sync-subscription failed, relying on webhook:', err)
      }
      refetch()
    }

    // Small delay to let Stripe finish processing the checkout
    const t = setTimeout(syncAndRefetch, 1500)
    return () => clearTimeout(t)
  }, [location.search, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Onboarding tutorial ──
  // Auto-opens once for brand-new accounts (hasSeenTutorial=false from the
  // default state). Existing users were migrated to true in store v7 so
  // they don't get surprised. They can replay it any time from Settings,
  // which dispatches the 'open-tutorial' event listened to below.
  const hasSeenTutorial = useStore(s => s.hasSeenTutorial)
  const setHasSeenTutorial = useStore(s => s.setHasSeenTutorial)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (!hasSeenTutorial) setShowTutorial(true)
  }, [hasSeenTutorial])

  useEffect(() => {
    function handleOpen() { setShowTutorial(true) }
    window.addEventListener('open-tutorial', handleOpen)
    return () => window.removeEventListener('open-tutorial', handleOpen)
  }, [])

  function closeTutorial() {
    setShowTutorial(false)
    setHasSeenTutorial(true)
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-dvh">
      {/* One-time install of the built-in pack so first-time visitors have
          recipes to browse immediately. */}
      <AutoInstallDefaultPack />

      <Navigation />

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:ml-60 min-h-dvh">
        {/* Sticky CTA banner for anonymous visitors (auto-hidden if signed in) */}
        <PreviewBanner />
        <Header />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeForm />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/packs" element={<PacksPage />} />
          </Routes>
        </div>
      </main>

      {showTutorial && <TutorialModal onClose={closeTutorial} />}

      {/* What's-new announcements — small modal that pops up once per
          unseen entry in src/data/whatsNew.js, after the tutorial has
          been acknowledged so the two never stack on top of each other. */}
      <WhatsNewModal tutorialOpen={showTutorial} />

      {/* PWA install prompt — appears after a short delay on devices
          where installing is possible and the user hasn't already
          dismissed it. Hidden completely when running as an installed
          PWA, when previously dismissed, or on unsupported browsers. */}
      <InstallBanner />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Password reset lives OUTSIDE the SubscriptionGate so users with
            past-due / expired subscriptions can still recover their account. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={
          <SubscriptionProvider>
            <HydrationGate>
              <SubscriptionGate>
                <AppShell />
              </SubscriptionGate>
            </HydrationGate>
          </SubscriptionProvider>
        } />
      </Routes>
    </AuthProvider>
  )
}

import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navigation from './components/layout/Navigation'
import Header from './components/layout/Header'
import RecipesPage from './pages/RecipesPage'
import PlannerPage from './pages/PlannerPage'
import ShoppingPage from './pages/ShoppingPage'
import SettingsPage from './pages/SettingsPage'
import PacksPage from './pages/PacksPage'
import SharedImportPage from './pages/SharedImportPage'
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
import ScrollManager from './components/ScrollManager'
import TutorialModal from './components/onboarding/TutorialModal'
import LanguagePicker from './components/onboarding/LanguagePicker'
import InstallBanner from './components/pwa/InstallBanner'
import WhatsNewModal from './components/whatsnew/WhatsNewModal'
import TimerRunner from './components/timer/TimerRunner'
import TimerAlarm from './components/timer/TimerAlarm'

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

  // ── Ask the browser to keep our data ──
  //
  // Everything this app holds lives in one browser's IndexedDB with no
  // account behind it. Under the default "best effort" policy a browser
  // may reclaim that storage on its own — Safari clears it after a few
  // weeks without a visit — and the user loses their recipes and plans
  // with no warning and no way back. Marking the origin persistent asks
  // it not to.
  //
  // Asked once per load, after the first paint so it never delays one.
  // It may be granted silently, refused, or prompt, depending on the
  // browser and how "installed" the app looks; a refusal is not an error
  // and there is nothing useful to tell the user about it. Older
  // browsers have no storage manager at all, hence the guard.
  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        if (navigator.storage?.persist && navigator.storage?.persisted) {
          if (!(await navigator.storage.persisted())) await navigator.storage.persist()
        }
      } catch { /* not supported, or refused — neither is actionable */ }
    }, 2000)
    return () => clearTimeout(id)
  }, [])

  // ── First run ──
  //
  // A new visitor is asked which language they want, and nothing else. The
  // onboarding tour that used to open here had gone out of date, and a
  // tour of an app you haven't used — written in a language you may not
  // read — is worse than no tour at all. It still exists and can be
  // replayed from Settings; it just no longer greets anyone.
  const hasChosenLanguage = useStore(s => s.hasChosenLanguage)
  const setHasChosenLanguage = useStore(s => s.setHasChosenLanguage)
  const setStoreLanguage = useStore(s => s.setLanguage)
  const setHasSeenTutorial = useStore(s => s.setHasSeenTutorial)
  const [showTutorial, setShowTutorial] = useState(false)

  // Settings' "replay the tour" button still fires this.
  useEffect(() => {
    function handleOpen() { setShowTutorial(true) }
    window.addEventListener('open-tutorial', handleOpen)
    return () => window.removeEventListener('open-tutorial', handleOpen)
  }, [])

  function closeTutorial() {
    setShowTutorial(false)
    setHasSeenTutorial(true)
  }

  function handleChooseLanguage(code) {
    setStoreLanguage(code)
    setHasChosenLanguage(true)
    // Marks first run as over, which is what actually gates the
    // what's-new announcements — otherwise a brand-new user would never
    // pass that gate now that the tutorial doesn't open on its own.
    setHasSeenTutorial(true)
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-dvh">
      {/* One-time install of the built-in pack so first-time visitors have
          recipes to browse immediately. */}
      <AutoInstallDefaultPack />

      {/* Opens each page at the top; restores your place on long lists. */}
      <ScrollManager />

      {/* Watches kitchen timers and sounds the chime. Renders nothing, and
          lives here rather than in the header so a running bake keeps its
          alarm no matter which chrome is mounted. */}
      <TimerRunner />

      {/* The "time's up" banner — appears over any page the moment a timer
          finishes, so silencing it is one big button rather than a hunt
          through the header. */}
      <TimerAlarm />

      <Navigation />

      {/* Main content area */}
      {/* min-w-0 is load-bearing. As a flex item <main> defaults to
          min-width:auto, which refuses to shrink below its content — and
          its content includes the planner board, which is deliberately
          wider than the window. So main stretched to the board's width,
          every wrapper inside inherited it, and the whole page scrolled
          sideways instead of the board scrolling inside its own pane.
          Anything the toolbar pushed right with justify-between then sat
          beyond the edge of the screen: that is how the Share button
          ended up unreachable. */}
      <main className="flex-1 min-w-0 flex flex-col lg:ml-60 min-h-dvh">
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
            {/* A shared menu or recipe. The code is the content — see
                shareCodec.js — so this route needs no server of its own. */}
            <Route path="/s/:code" element={<SharedImportPage />} />
          </Routes>
        </div>
      </main>

      {/* First-run language question. Nothing else is shown over the app
          until it's answered. */}
      {!hasChosenLanguage && <LanguagePicker onChoose={handleChooseLanguage} />}

      {showTutorial && <TutorialModal onClose={closeTutorial} />}

      {/* What's-new announcements — small modal that pops up once per
          unseen entry in src/data/whatsNew.js, after the tutorial has
          been acknowledged so the two never stack on top of each other. */}
      {/* `tutorialOpen` means "another first-run modal is up" — the
          language question counts, or announcements would stack on top of
          it the instant a new user arrives. */}
      <WhatsNewModal tutorialOpen={showTutorial || !hasChosenLanguage} />

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

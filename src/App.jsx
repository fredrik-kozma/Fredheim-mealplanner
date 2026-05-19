import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navigation from './components/layout/Navigation'
import Header from './components/layout/Header'
import RecipesPage from './pages/RecipesPage'
import PlannerPage from './pages/PlannerPage'
import ShoppingPage from './pages/ShoppingPage'
import SettingsPage from './pages/SettingsPage'
import PacksPage from './pages/PacksPage'
import RecipeForm from './components/recipes/RecipeForm'
import RecipeDetail from './components/recipes/RecipeDetail'
import useStore from './store/useStore'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useSubscription } from './hooks/useSubscription'
import UpgradeWall from './components/subscription/UpgradeWall'

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

// Shows the UpgradeWall when a signed-in user's subscription is no longer
// active.  Anonymous visitors see the app normally (with a sign-up nudge in
// the header) — we only gate access for people who have an account but whose
// trial / subscription has lapsed.
//
// A 3-second timeout ensures the app is never stuck blank if Supabase is
// slow or the device is offline — in that case we fall through to guest mode.
function SubscriptionGate({ children }) {
  const { user, authLoading } = useAuth()
  const { isActive, loading: subLoading } = useSubscription()
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

  // Signed-in user with an expired / lapsed subscription.
  if (!stillLoading && user && !isActive) {
    return <UpgradeWall />
  }

  return children
}

function AppShell() {
  const location = useLocation()

  // Handle ?checkout=success query param — Stripe redirects here after payment.
  // Reload the subscription status so the wall disappears immediately.
  const { refetch } = useSubscription()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('checkout') === 'success') {
      // Give Stripe webhook a couple of seconds to update Supabase, then refetch.
      const t = setTimeout(refetch, 2500)
      return () => clearTimeout(t)
    }
  }, [location.search, refetch])

  return (
    <div className="flex flex-col lg:flex-row min-h-dvh">
      <Navigation />

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:ml-60 min-h-dvh">
        <Header />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<RecipesPage />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeForm />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/packs" element={<PacksPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HydrationGate>
        <SubscriptionGate>
          <AppShell />
        </SubscriptionGate>
      </HydrationGate>
    </AuthProvider>
  )
}

import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <HydrationGate>
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
    </HydrationGate>
  )
}

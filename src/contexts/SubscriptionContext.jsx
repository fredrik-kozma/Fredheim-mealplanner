import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth, IS_DEV_AUTOLOGIN } from './AuthContext'

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const SubscriptionContext = createContext(null)

// Optimistic cache key — remember the last known "isActive" value so a hard
// reload doesn't flash the locked UI for ~300ms while we re-fetch.
const CACHE_KEY = 'fredheim_sub_cache_v1'

function readCache(userId) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (obj.uid !== userId) return null
    return obj
  } catch {
    return null
  }
}

function writeCache(userId, profile) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ uid: userId, profile, ts: Date.now() })
    )
  } catch { /* ignore */ }
}

/**
 * Single source of truth for subscription state.
 * Fetches profile ONCE per user change, then shares the result with every
 * consumer via context — so navigating between pages doesn't trigger
 * re-fetches (which was causing a "locked → unlocked" flash on every tab
 * switch and recipe click).
 */
export function SubscriptionProvider({ children }) {
  const { user } = useAuth()

  // Optimistic initial state from sessionStorage so we don't flash on reload.
  const cached = user ? readCache(user.id) : null
  const [profile, setProfile] = useState(cached?.profile ?? null)
  const [loading, setLoading] = useState(!cached)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    // Dev autologin: skip Supabase fetch — the admin path below grants full
    // access without needing a profile row.
    if (IS_DEV_AUTOLOGIN) {
      setProfile(null)
      setLoading(false)
      return
    }
    // Only show loading state if we have no cache yet — otherwise refresh
    // silently in the background.
    if (!readCache(user.id)) setLoading(true)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data ?? null)
    setLoading(false)
    if (data) writeCache(user.id, data)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ── Derived subscription state ─────────────────────────────────────────
  // Dev autologin always grants admin access — convenient local testing.
  const isAdmin =
    IS_DEV_AUTOLOGIN ||
    ADMIN_EMAILS.includes((user?.email || '').toLowerCase())

  let status = 'none' // none | trialing | active | past_due | canceled | expired | admin
  let isActive = false
  let isTrial = false
  let trialEndsAt = null
  let daysLeft = 0
  let periodEndsAt = null

  if (isAdmin) {
    isActive = true
    status = 'admin'
  } else if (profile) {
    trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
    periodEndsAt = profile.current_period_end
      ? new Date(profile.current_period_end)
      : null

    const trialStillActive = trialEndsAt && trialEndsAt > new Date()

    if (profile.subscription_status === 'active') {
      isActive = true
      status = 'active'
    } else if (profile.subscription_status === 'trialing' && trialStillActive) {
      isActive = true
      isTrial = true
      status = 'trialing'
      daysLeft = Math.max(
        0,
        Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24))
      )
    } else if (profile.subscription_status === 'past_due') {
      status = 'past_due'
    } else if (profile.subscription_status === 'trialing' && !trialStillActive) {
      status = 'expired'
    } else {
      status = profile.subscription_status || 'expired'
    }
  }

  const value = {
    profile,
    loading,
    isActive,
    isTrial,
    isAdmin,
    status,
    trialEndsAt,
    periodEndsAt,
    daysLeft,
    refetch: fetchProfile,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription must be used inside <SubscriptionProvider>')
  }
  return ctx
}

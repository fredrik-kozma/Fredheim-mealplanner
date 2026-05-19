import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Comma-separated admin e-mail addresses set at build time.
// e.g. VITE_ADMIN_EMAILS=you@example.com,other@example.com
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function useSubscription() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data ?? null)
    setLoading(false)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ── Derived subscription state ─────────────────────────────────────────

  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase())

  let status = 'none' // none | trialing | active | past_due | canceled | expired
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
    } else if (
      profile.subscription_status === 'trialing' &&
      !trialStillActive
    ) {
      status = 'expired'
    } else {
      status = profile.subscription_status || 'expired'
    }
  }

  return {
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
}

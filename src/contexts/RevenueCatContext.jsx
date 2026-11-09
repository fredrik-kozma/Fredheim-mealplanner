import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  initRevenueCat,
  isRevenueCatAvailable,
  rcLogIn,
  rcGetCustomerInfo,
  rcAddCustomerInfoListener,
  customerHasPremium,
  premiumDetails,
} from '../lib/revenueCat'

const NO_RC = {
  available: false,
  ready: false,
  failed: false,
  hasPremium: false,
  premium: premiumDetails(null),
  refresh: async () => false,
  setPremiumFromInfo: () => {},
}

const RevenueCatContext = createContext(NO_RC)

/**
 * Google Play Premium via RevenueCat — Android app only.
 *
 * RevenueCat runs with an anonymous app user id, so Premium (and Google's
 * free trial) works with no Fredheim account. If the person chooses to sign
 * in, the device is linked to that account id so the purchase also shows
 * on the website; signing out does not unlink it (the Google account still
 * owns the purchase, and "Restore purchases" recovers it anywhere).
 */
export function RevenueCatProvider({ children }) {
  const { user } = useAuth()
  const available = isRevenueCatAvailable()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [info, setInfo] = useState(null)

  const applyInfo = useCallback((next) => {
    if (next) setInfo(next)
  }, [])

  const refresh = useCallback(async () => {
    if (!available || !ready) return false
    const next = await rcGetCustomerInfo()
    applyInfo(next)
    return customerHasPremium(next)
  }, [available, ready, applyInfo])

  // Configure once.
  useEffect(() => {
    if (!available) return undefined
    let cancelled = false
    ;(async () => {
      const ok = await initRevenueCat()
      if (!cancelled) { setReady(!!ok); setFailed(!ok) }
    })()
    return () => { cancelled = true }
  }, [available])

  // Live updates: trial converting, renewal, expiry, refunds.
  useEffect(() => {
    if (!available || !ready) return undefined
    let remove = null
    let cancelled = false
    ;(async () => {
      const r = await rcAddCustomerInfoListener((next) => { if (!cancelled) applyInfo(next) })
      if (cancelled) r?.()
      else remove = r
    })()
    return () => { cancelled = true; remove?.() }
  }, [available, ready, applyInfo])

  // Current entitlement; link to the Fredheim account only when signed in.
  useEffect(() => {
    if (!available || !ready) return undefined
    let cancelled = false
    ;(async () => {
      const next = user?.id ? (await rcLogIn(user.id)) || (await rcGetCustomerInfo()) : await rcGetCustomerInfo()
      if (!cancelled) applyInfo(next)
    })()
    return () => { cancelled = true }
  }, [available, ready, user?.id, applyInfo])

  // Re-check when the app comes back to the foreground (e.g. after the
  // person managed the subscription in Google Play).
  useEffect(() => {
    if (!available || !ready) return undefined
    function onVisible() {
      if (document.visibilityState === 'visible') refresh().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [available, ready, refresh])

  if (!available) {
    return <RevenueCatContext.Provider value={NO_RC}>{children}</RevenueCatContext.Provider>
  }

  return (
    <RevenueCatContext.Provider value={{
      available,
      ready,
      failed,
      hasPremium: customerHasPremium(info),
      premium: premiumDetails(info),
      refresh,
      setPremiumFromInfo: applyInfo,
    }}>
      {children}
    </RevenueCatContext.Provider>
  )
}

export function useRevenueCat() {
  return useContext(RevenueCatContext) || NO_RC
}

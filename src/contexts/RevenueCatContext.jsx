import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  initRevenueCat,
  isRevenueCatAvailable,
  rcLastInitError,
  rcGetCustomerInfo,
  rcAddCustomerInfoListener,
  customerHasPremium,
  premiumDetails,
} from '../lib/revenueCat'
import { getHashedAndroidId } from '../lib/deviceId'

const NO_RC = {
  available: false,
  ready: false,
  failed: false,
  initError: null,
  customerChecked: false,
  hasPremium: false,
  premium: premiumDetails(null),
  refresh: async () => false,
  retryInit: () => {},
  setPremiumFromInfo: () => {},
}

const RevenueCatContext = createContext(NO_RC)

/**
 * Google Play Premium via RevenueCat — Android app only.
 *
 * The app user id is the hashed ANDROID_ID, not a Fredheim account, so a
 * Play purchase survives reinstall. Signing in does not call logIn with the
 * Supabase user id: that would switch the customer off the device id.
 * "Restore purchases" still recovers a purchase tied to the Google account.
 */
export function RevenueCatProvider({ children }) {
  const available = isRevenueCatAvailable()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [initError, setInitError] = useState(null)
  const [customerChecked, setCustomerChecked] = useState(false)
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

  // Configure once (and again on demand if the first attempt failed).
  const [initAttempt, setInitAttempt] = useState(0)
  useEffect(() => {
    if (!available) return undefined
    let cancelled = false
    ;(async () => {
      let appUserID = null
      try { appUserID = await getHashedAndroidId() } catch (err) {
        console.warn('[revenueCat] device id unavailable', err)
      }
      const ok = await initRevenueCat(appUserID)
      if (!cancelled) {
        setReady(!!ok)
        setFailed(!ok)
        setInitError(ok ? null : (rcLastInitError() || new Error('RevenueCat configure failed')))
      }
    })()
    return () => { cancelled = true }
  }, [available, initAttempt])

  const retryInit = useCallback(() => {
    setFailed(false)
    setInitError(null)
    setInitAttempt((n) => n + 1)
  }, [])

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

  // Current entitlement. Not tied to the Fredheim account (see file comment).
  useEffect(() => {
    if (!available || !ready) return undefined
    let cancelled = false
    ;(async () => {
      const next = await rcGetCustomerInfo()
      if (!cancelled) {
        applyInfo(next)
        setCustomerChecked(true)
      }
    })()
    return () => { cancelled = true }
  }, [available, ready, applyInfo])

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
      initError,
      customerChecked,
      hasPremium: customerHasPremium(info),
      premium: premiumDetails(info),
      refresh,
      retryInit,
      setPremiumFromInfo: applyInfo,
    }}>
      {children}
    </RevenueCatContext.Provider>
  )
}

export function useRevenueCat() {
  return useContext(RevenueCatContext) || NO_RC
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useRevenueCat } from '../../contexts/RevenueCatContext'
import { pushAndroidBackHandler } from '../../hooks/useAndroidBackButton'
import {
  rcGetOfferings,
  pickMonthlyPackage,
  rcPurchasePackage,
  customerHasPremium,
  isPurchaseCancelled,
  describeBillingError,
  withTimeout,
} from '../../lib/revenueCat'

// Same ceilings as the paywall. Purchases go through rcGetOfferings /
// rcPurchasePackage, which load the RevenueCat module (not the Capacitor
// plugin proxy — awaiting that proxy hangs forever).
const OFFER_TIMEOUT_MS = 15000
const WATCHDOG_MS = OFFER_TIMEOUT_MS + 5000

/**
 * Android only. Once, on first launch: 14 days free, then 120 NOK/month,
 * cancel any time in Google Play. The primary button buys the trial14
 * offer through the same RevenueCat flow as the paywall. "Explore free
 * recipes" closes the sheet and opens the Gratis filter.
 *
 * Stays up if the parent `eligible` flag flickers while RevenueCat retries.
 * Closes for good on dismiss, explore, a completed purchase, or Premium.
 */
export default function FirstLaunchTrialSheet({ eligible, hidden, onDismiss, onExplore, onPurchased }) {
  const { t } = useTranslation()
  const { ready, failed, initError, hasPremium, setPremiumFromInfo, retryInit } = useRevenueCat()
  const [latched, setLatched] = useState(eligible)
  const [closed, setClosed] = useState(false)
  const [pkg, setPkg] = useState(null)
  const [loadingOffer, setLoadingOffer] = useState(false)
  const [offerError, setOfferError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [stalled, setStalled] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    if (eligible) setLatched(true)
  }, [eligible])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const visible = latched && !closed && !hidden

  const loadOffer = useCallback(async () => {
    setLoadingOffer(true)
    setOfferError(null)
    setStalled(false)
    try {
      const offerings = await withTimeout(rcGetOfferings(), OFFER_TIMEOUT_MS)
      const next = pickMonthlyPackage(offerings)
      if (!mounted.current) return
      setPkg(next)
      if (!next) setOfferError({ kind: 'storeProducts', detail: 'No package in the current offering' })
    } catch (err) {
      if (!mounted.current) return
      setPkg(null)
      setOfferError(describeBillingError(err))
    } finally {
      if (mounted.current) setLoadingOffer(false)
    }
  }, [])

  useEffect(() => {
    if (!visible || !ready) return
    loadOffer()
  }, [visible, ready, loadOffer])

  // Configure failed or timed out: show the reason, including its code.
  useEffect(() => {
    if (visible && failed && !pkg) {
      setOfferError((prev) => prev || (initError
        ? describeBillingError(initError)
        : { kind: 'unknown', detail: 'RevenueCat configure failed' }))
    }
  }, [visible, failed, initError, pkg])

  const pending = visible && !hasPremium && !pkg && ((!ready && !failed) || loadingOffer)

  // Same 20s backstop as the paywall: never stay on "Loading…" for good.
  useEffect(() => {
    if (!pending || stalled) return undefined
    const timer = setTimeout(() => {
      if (!mounted.current) return
      setStalled(true)
      setOfferError((prev) => prev || {
        kind: 'network',
        detail: `code 10: ${ready ? 'Google Play' : 'RevenueCat'} did not answer within ${Math.round(WATCHDOG_MS / 1000)} s`,
      })
    }, WATCHDOG_MS)
    return () => clearTimeout(timer)
  }, [pending, stalled, ready])

  function dismiss() {
    setClosed(true)
    onDismiss?.()
  }

  function explore() {
    setClosed(true)
    onExplore?.()
  }

  useEffect(() => {
    if (!visible) return undefined
    return pushAndroidBackHandler(() => dismiss())
    // dismiss closes over the latest onDismiss; re-bind when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, onDismiss])

  const starting = !ready && !failed
  const waiting = !stalled && (starting || (loadingOffer && !pkg))

  async function handleRetry() {
    setError(null)
    setStalled(false)
    if (!ready) {
      setOfferError(null)
      retryInit()
      return
    }
    await loadOffer()
  }

  async function handleSubscribe() {
    if (busy) return
    if (!pkg) {
      await handleRetry()
      return
    }
    setError(null)
    setBusy(true)
    try {
      const { customerInfo } = await rcPurchasePackage(pkg)
      setPremiumFromInfo(customerInfo)
      if (customerHasPremium(customerInfo)) {
        if (mounted.current) setClosed(true)
        onPurchased?.()
      }
    } catch (err) {
      if (!isPurchaseCancelled(err) && mounted.current) {
        const d = describeBillingError(err)
        setError(`${t(`subscription.nativeError.${d.kind}`)}${d.detail ? ` (${d.detail})` : ''}`)
      }
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  if (!visible) return null

  let mainLabel
  if (busy) mainLabel = '…'
  else if (waiting) mainLabel = t('subscription.nativeLoading')
  else if (!pkg) mainLabel = t('subscription.nativeRetry')
  else mainLabel = t('trialOffer.offer')

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-white flex flex-col safe-area-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-offer-title"
    >
      <div className="flex justify-end px-2 pt-2">
        <button
          type="button"
          onClick={dismiss}
          className="tap-target text-slate-400 hover:text-slate-600"
          aria-label={t('common.close')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 text-center">
        <img
          src="/fredheim-logo.svg"
          alt=""
          className="w-16 h-16 rounded-full object-cover mb-5"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
        <h1 id="trial-offer-title" className="text-2xl font-bold text-slate-900 leading-tight">
          {t('trialOffer.offer')}
        </h1>
        <p className="mt-3 text-xl font-semibold text-primary-700">{t('trialOffer.price')}</p>
        <p className="mt-2 text-sm text-slate-500 max-w-xs">{t('trialOffer.cancel')}</p>

        {error && (
          <p className="mt-4 text-xs text-danger-600 bg-danger-50 rounded-small px-3 py-2 w-full max-w-sm" role="alert">{error}</p>
        )}
        {!waiting && !pkg && offerError && (
          <div className="mt-4 text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-small px-3 py-2 w-full max-w-sm space-y-1 text-left" role="alert">
            <p>{t(`subscription.nativeError.${offerError.kind}`)}</p>
            {offerError.detail && (
              <p className="text-[11px] text-slate-400 break-words">{offerError.detail}</p>
            )}
          </div>
        )}

        <div className="w-full max-w-sm mt-8 space-y-3">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={busy || waiting}
            aria-busy={busy || waiting}
            className="btn-primary btn-lg w-full"
          >
            {mainLabel}
          </button>
          <button
            type="button"
            onClick={explore}
            className="btn-secondary w-full"
          >
            {t('trialOffer.explore')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

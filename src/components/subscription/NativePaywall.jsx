import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRevenueCat } from '../../contexts/RevenueCatContext'
import {
  PLAY_SUBSCRIPTIONS_URL,
  rcGetOfferings,
  pickMonthlyPackage,
  packageFreeTrialDays,
  rcPurchasePackage,
  rcRestorePurchases,
  customerHasPremium,
  isPurchaseCancelled,
  describeBillingError,
} from '../../lib/revenueCat'

// If Google Play has not answered by then, stop the spinner and offer a retry.
const OFFER_TIMEOUT_MS = 15000

function withTimeout(promise, ms) {
  let timer
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(Object.assign(new Error('Timed out waiting for Google Play'), { code: '10' })), ms)
    }),
  ])
}

/**
 * Google Play paywall (RevenueCat), Android app only. No Fredheim account
 * is needed: Google Play shows its own sheet with the 14-day free trial and
 * the price, charges nothing until the trial ends, and handles cancelling.
 * Renders nothing on the website.
 *
 * The main button is never left dead: while the subscription loads it shows
 * a spinner label, and if loading fails it explains why and turns into
 * "Try again".
 */
export default function NativePaywall({ compact = false, onAccessGranted }) {
  const { t } = useTranslation()
  const { available, ready, failed, hasPremium, setPremiumFromInfo, retryInit } = useRevenueCat()
  const [pkg, setPkg] = useState(null)
  const [loadingOffer, setLoadingOffer] = useState(false)
  const [offerError, setOfferError] = useState(null) // { kind, detail }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const loadOffer = useCallback(async () => {
    setLoadingOffer(true)
    setOfferError(null)
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
    if (!available || !ready) return
    loadOffer()
  }, [available, ready, loadOffer])

  // Configuration failed outright: show that as an offer error too.
  useEffect(() => {
    if (available && failed && !pkg) {
      setOfferError((prev) => prev || { kind: 'unknown', detail: 'RevenueCat configure failed' })
    }
  }, [available, failed, pkg])

  if (!available) return null

  const priceLabel = pkg?.product?.priceString || t('subscription.nativePriceFallback')
  const trialDays = packageFreeTrialDays(pkg)
  const starting = !ready && !failed
  const waiting = starting || (loadingOffer && !pkg)

  async function handleRetry() {
    setError(null)
    setNotice(null)
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
    setNotice(null)
    setBusy(true)
    try {
      const { customerInfo } = await rcPurchasePackage(pkg)
      setPremiumFromInfo(customerInfo)
      if (customerHasPremium(customerInfo)) onAccessGranted?.()
    } catch (err) {
      if (!isPurchaseCancelled(err)) {
        const d = describeBillingError(err)
        setError(`${t(`subscription.nativeError.${d.kind}`)}${d.detail ? ` (${d.detail})` : ''}`)
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleRestore() {
    if (busy) return
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const { customerInfo } = await rcRestorePurchases()
      setPremiumFromInfo(customerInfo)
      if (customerHasPremium(customerInfo)) onAccessGranted?.()
      else setNotice(t('subscription.nativeRestoreNone'))
    } catch (err) {
      const d = describeBillingError(err)
      setError(`${t(`subscription.nativeError.${d.kind}`)}${d.detail ? ` (${d.detail})` : ''}`)
    } finally {
      setBusy(false)
    }
  }

  let mainLabel
  if (busy) mainLabel = '…'
  else if (waiting) mainLabel = t('subscription.nativeLoading')
  else if (!pkg) mainLabel = t('subscription.nativeRetry')
  else mainLabel = trialDays ? t('subscription.nativeStartTrial') : t('subscription.nativeSubscribe')

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {!hasPremium && (
        <>
          <div className="inline-flex items-baseline gap-1 bg-primary-50 border border-primary-100 rounded-control px-3 py-1.5">
            <span className={`font-bold text-primary-700 ${compact ? 'text-lg' : 'text-2xl'}`}>
              {priceLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {trialDays
              ? t('subscription.nativeTrialNoteDays', { count: trialDays })
              : t('subscription.nativeTrialNote')}
          </p>
        </>
      )}

      {error && (
        <p className="text-xs text-danger-600 bg-danger-50 rounded-small px-3 py-2" role="alert">{error}</p>
      )}
      {notice && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-small px-3 py-2">{notice}</p>
      )}
      {!hasPremium && !waiting && !pkg && offerError && (
        <div className="text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-small px-3 py-2 space-y-1" role="alert">
          <p>{t(`subscription.nativeError.${offerError.kind}`)}</p>
          {offerError.detail && (
            <p className="text-[11px] text-slate-400 break-words">{offerError.detail}</p>
          )}
        </div>
      )}

      {!hasPremium && (
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={busy || waiting}
          aria-busy={busy || waiting}
          className="btn-primary btn-lg w-full"
        >
          {mainLabel}
        </button>
      )}

      {!hasPremium && (
        <button
          type="button"
          onClick={handleRestore}
          disabled={busy || !ready}
          className="btn-secondary w-full"
        >
          {t('subscription.nativeRestore')}
        </button>
      )}

      <a
        href={PLAY_SUBSCRIPTIONS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-target block w-full text-center text-xs text-slate-500 hover:text-slate-700"
      >
        {t('subscription.nativeManagePlay')}
      </a>
    </div>
  )
}

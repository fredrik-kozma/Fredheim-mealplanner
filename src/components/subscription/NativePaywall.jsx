import { useEffect, useState } from 'react'
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
} from '../../lib/revenueCat'

/**
 * Google Play paywall (RevenueCat), Android app only. No Fredheim account
 * is needed: Google Play shows its own sheet with the 14-day free trial and
 * the price, charges nothing until the trial ends, and handles cancelling.
 * Renders nothing on the website.
 */
export default function NativePaywall({ compact = false, onAccessGranted }) {
  const { t } = useTranslation()
  const { available, ready, failed, hasPremium, setPremiumFromInfo } = useRevenueCat()
  const [pkg, setPkg] = useState(null)
  const [loadingOffer, setLoadingOffer] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!available || !ready) return undefined
    let cancelled = false
    setLoadingOffer(true)
    ;(async () => {
      try {
        const offerings = await rcGetOfferings()
        if (!cancelled) setPkg(pickMonthlyPackage(offerings))
      } catch {
        if (!cancelled) setPkg(null)
      } finally {
        if (!cancelled) setLoadingOffer(false)
      }
    })()
    return () => { cancelled = true }
  }, [available, ready])

  if (!available) return null

  const priceLabel = pkg?.product?.priceString || t('subscription.nativePriceFallback')
  const trialDays = packageFreeTrialDays(pkg)

  async function handleSubscribe() {
    if (!pkg || busy) return
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const { customerInfo } = await rcPurchasePackage(pkg)
      setPremiumFromInfo(customerInfo)
      if (customerHasPremium(customerInfo)) onAccessGranted?.()
    } catch (err) {
      if (!isPurchaseCancelled(err)) setError(err?.message || String(err))
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
      setError(err?.message || String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {!hasPremium && (
        <>
          <div className="inline-flex items-baseline gap-1 bg-primary-50 border border-primary-100 rounded-control px-3 py-1.5">
            <span className={`font-bold text-primary-700 ${compact ? 'text-lg' : 'text-2xl'}`}>
              {loadingOffer && !pkg ? '…' : priceLabel}
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
        <p className="text-xs text-danger-600 bg-danger-50 rounded-small px-3 py-2">{error}</p>
      )}
      {notice && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-small px-3 py-2">{notice}</p>
      )}
      {!hasPremium && (failed || (ready && !loadingOffer && !pkg)) && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-small px-3 py-2">
          {t('subscription.nativeOfferUnavailable')}
        </p>
      )}

      {!hasPremium && (
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={busy || !ready || !pkg}
          className="btn-primary btn-lg w-full"
        >
          {busy ? '…' : (trialDays ? t('subscription.nativeStartTrial') : t('subscription.nativeSubscribe'))}
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

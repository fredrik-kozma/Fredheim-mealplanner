import { isNativeAndroid } from '../utils/nativePlatform'
import { pickBasePlanOption, withTimeout } from './revenueCatHelpers'

export {
  RC_ENTITLEMENT_ID,
  RC_OFFERING_ID,
  RC_MONTHLY_PACKAGE_ID,
  PLAY_SUBSCRIPTIONS_URL,
  customerHasPremium,
  premiumDetails,
  pickMonthlyPackage,
  packageFreeTrialDays,
  isPurchaseCancelled,
  pickBasePlanOption,
  describeBillingError,
  withTimeout,
} from './revenueCatHelpers'

// Public Android SDK key (goog_…). Safe to ship in the app; set it in
// .env.android.local — see .env.example.
const API_KEY = (import.meta.env.VITE_REVENUECAT_ANDROID_KEY || '').trim()

// How long configure() may take before the app gives up and shows an error.
export const RC_CONFIGURE_TIMEOUT_MS = 15000

let configured = false
let configuring = null
let lastInitError = null
let PurchasesModule = null

/**
 * Returns the plugin MODULE ({ Purchases }), never the Purchases object
 * itself. Purchases is a Capacitor plugin Proxy: every property, including
 * `then`, looks like a native method. Returning it from an async function
 * (or awaiting it) makes JavaScript call `Purchases.then()`, which Android
 * rejects as "not implemented" and the outer promise never settles. That
 * hang is what kept 1.0.0–1.0.3 on "Loading subscription…" for good.
 */
async function loadPurchases() {
  if (!PurchasesModule) PurchasesModule = await import('@revenuecat/purchases-capacitor')
  return PurchasesModule
}

/** True only on native Android with a non-empty public SDK key. */
export function isRevenueCatAvailable() {
  return isNativeAndroid() && !!API_KEY
}

/** Why the last configure attempt failed (for the paywall), or null. */
export function rcLastInitError() {
  return lastInitError
}

/**
 * Configure with the hashed ANDROID_ID as appUserID so the RevenueCat
 * customer (and a Play purchase) survives uninstall/reinstall.
 *
 * 1.0.x builds configured with no appUserID, so the SDK has a cached
 * anonymous id (`$RCAnonymousID:…`). configure() keeps that cached user and
 * ignores appUserID. logIn(hashedId) then aliases the anonymous customer
 * onto the device id and transfers an active entitlement (RevenueCat alias).
 * An already-identified customer is left as-is: logIn would switch users
 * rather than merge. Restore purchases still recovers a Play purchase.
 *
 * Always settles within RC_CONFIGURE_TIMEOUT_MS.
 */
export async function initRevenueCat(appUserID) {
  if (!isRevenueCatAvailable()) return false
  if (configured) return true
  if (configuring) return configuring
  configuring = (async () => {
    try {
      await withTimeout((async () => {
        const { Purchases } = await loadPurchases()
        const config = appUserID ? { apiKey: API_KEY, appUserID } : { apiKey: API_KEY }
        await Purchases.configure(config)
        if (appUserID && Purchases.getAppUserID) {
          const { appUserID: current } = await Purchases.getAppUserID()
          if (typeof current === 'string' && current.startsWith('$RCAnonymousID:')) {
            await Purchases.logIn({ appUserID })
          }
        }
      })(), RC_CONFIGURE_TIMEOUT_MS, 'RevenueCat to start')
      configured = true
      lastInitError = null
      return true
    } catch (err) {
      console.warn('[revenueCat] configure failed', err)
      configured = false
      lastInitError = err
      return false
    } finally {
      configuring = null
    }
  })()
  return configuring
}

export function isRevenueCatConfigured() {
  return configured
}

/** Optional: link this device's purchases to a signed-in Fredheim account. */
export async function rcLogIn(appUserID) {
  if (!configured || !appUserID) return null
  try {
    const { Purchases } = await loadPurchases()
    const { customerInfo } = await Purchases.logIn({ appUserID })
    return customerInfo
  } catch (err) {
    console.warn('[revenueCat] logIn failed', err)
    return null
  }
}

export async function rcGetCustomerInfo() {
  if (!configured) return null
  try {
    const { Purchases } = await loadPurchases()
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo
  } catch (err) {
    console.warn('[revenueCat] getCustomerInfo failed', err)
    return null
  }
}

export async function rcAddCustomerInfoListener(fn) {
  if (!configured) return null
  try {
    const { Purchases } = await loadPurchases()
    const id = await Purchases.addCustomerInfoUpdateListener((info) => fn(info))
    return async () => {
      try { await Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id }) } catch { /* ignore */ }
    }
  } catch (err) {
    console.warn('[revenueCat] listener failed', err)
    return null
  }
}

/**
 * Offerings from RevenueCat + Google Play. Throws (instead of returning
 * null) so the paywall can show why the subscription could not be loaded
 * and offer a retry, rather than leaving a dead button.
 */
export async function rcGetOfferings() {
  if (!configured) {
    const ok = await initRevenueCat()
    if (!ok) throw lastInitError || new Error('RevenueCat is not configured')
  }
  const { Purchases } = await loadPurchases()
  try {
    return await Purchases.getOfferings()
  } catch (err) {
    console.warn('[revenueCat] getOfferings failed', err)
    throw err
  }
}

/**
 * Buy the monthly base plan. The option with basePlanId `monthly` and no
 * offer id (no free phase) is purchased explicitly. The package purchase is
 * only the fallback when Play did not return that option.
 */
export async function rcPurchasePackage(aPackage) {
  const { Purchases } = await loadPurchases()
  const option = pickBasePlanOption(aPackage)
  if (option) {
    return Purchases.purchaseSubscriptionOption({ subscriptionOption: option })
  }
  return Purchases.purchasePackage({ aPackage })
}

export async function rcRestorePurchases() {
  const { Purchases } = await loadPurchases()
  return Purchases.restorePurchases()
}

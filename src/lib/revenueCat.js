import { isNativeAndroid } from '../utils/nativePlatform'

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
} from './revenueCatHelpers'

// Public Android SDK key (goog_…). Safe to ship in the app; set it in
// .env.android.local — see .env.example.
const API_KEY = (import.meta.env.VITE_REVENUECAT_ANDROID_KEY || '').trim()

let configured = false
let PurchasesMod = null

async function loadPurchases() {
  if (PurchasesMod) return PurchasesMod
  const mod = await import('@revenuecat/purchases-capacitor')
  PurchasesMod = mod.Purchases
  return PurchasesMod
}

/** True only on native Android with a non-empty public SDK key. */
export function isRevenueCatAvailable() {
  return isNativeAndroid() && !!API_KEY
}

/**
 * Configure WITHOUT an appUserID: RevenueCat makes an anonymous id that
 * lives on the device, and Google Play ties the purchase to the person's
 * Google account. No Fredheim account is needed to buy or restore.
 */
export async function initRevenueCat() {
  if (!isRevenueCatAvailable()) return false
  if (configured) return true
  try {
    const Purchases = await loadPurchases()
    await Purchases.configure({ apiKey: API_KEY })
    configured = true
    return true
  } catch (err) {
    console.warn('[revenueCat] configure failed', err)
    configured = false
    return false
  }
}

export function isRevenueCatConfigured() {
  return configured
}

/** Optional: link this device's purchases to a signed-in Fredheim account. */
export async function rcLogIn(appUserID) {
  if (!configured || !appUserID) return null
  try {
    const Purchases = await loadPurchases()
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
    const Purchases = await loadPurchases()
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
    const Purchases = await loadPurchases()
    const id = await Purchases.addCustomerInfoUpdateListener((info) => fn(info))
    return async () => {
      try { await Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id }) } catch { /* ignore */ }
    }
  } catch (err) {
    console.warn('[revenueCat] listener failed', err)
    return null
  }
}

export async function rcGetOfferings() {
  if (!configured) return null
  try {
    const Purchases = await loadPurchases()
    return await Purchases.getOfferings()
  } catch (err) {
    console.warn('[revenueCat] getOfferings failed', err)
    return null
  }
}

export async function rcPurchasePackage(aPackage) {
  const Purchases = await loadPurchases()
  return Purchases.purchasePackage({ aPackage })
}

export async function rcRestorePurchases() {
  const Purchases = await loadPurchases()
  return Purchases.restorePurchases()
}

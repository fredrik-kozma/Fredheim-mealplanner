// Pure helpers for RevenueCat data. No Capacitor import, so they run in
// node tests and cost nothing on the website.

export const RC_ENTITLEMENT_ID = 'premium'
export const RC_OFFERING_ID = 'default'
export const RC_MONTHLY_PACKAGE_ID = '$rc_monthly'
export const PLAY_PACKAGE_NAME = 'no.fredheim.app'
export const PLAY_SUBSCRIPTIONS_URL =
  `https://play.google.com/store/account/subscriptions?package=${PLAY_PACKAGE_NAME}`

export function premiumEntitlement(customerInfo) {
  try {
    return customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID] || null
  } catch {
    return null
  }
}

export function customerHasPremium(customerInfo) {
  return !!premiumEntitlement(customerInfo)
}

/**
 * What the app shows about Premium bought through Google Play.
 * `isTrial` is true while Google's free-trial phase runs; `expiresAt` is
 * the end of the current period (trial end, or next renewal).
 */
export function premiumDetails(customerInfo, now = new Date()) {
  const ent = premiumEntitlement(customerInfo)
  if (!ent) return { active: false, isTrial: false, expiresAt: null, willRenew: false, daysLeft: 0 }
  const expiresAt = ent.expirationDate ? new Date(ent.expirationDate) : null
  const isTrial = String(ent.periodType || '').toUpperCase() === 'TRIAL'
  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)))
    : 0
  return { active: true, isTrial, expiresAt, willRenew: ent.willRenew !== false, daysLeft }
}

/** Prefer the current offering (falls back to 'default') and its monthly package. */
export function pickMonthlyPackage(offerings) {
  if (!offerings) return null
  const offering = offerings.current || offerings.all?.[RC_OFFERING_ID] || null
  if (!offering) return null
  const packages = offering.availablePackages || []
  return (
    packages.find((p) => p.identifier === RC_MONTHLY_PACKAGE_ID) ||
    offering.monthly ||
    packages[0] ||
    null
  )
}

/** The free-trial phase Google Play will apply to this package, if any. */
export function packageFreeTrialDays(pkg) {
  try {
    const product = pkg?.product
    // Play subscription option with a free phase (Billing Library 5+).
    const phase =
      product?.defaultOption?.freePhase ||
      product?.subscriptionOptions?.find((o) => o?.freePhase)?.freePhase ||
      null
    const period = phase?.billingPeriod
    if (period?.unit && period?.value) {
      const unit = String(period.unit).toUpperCase()
      const mult = unit === 'DAY' ? 1 : unit === 'WEEK' ? 7 : unit === 'MONTH' ? 30 : unit === 'YEAR' ? 365 : 0
      return mult ? period.value * mult : null
    }
    // Older shape: introductory price with price 0.
    const intro = product?.introPrice
    if (intro && Number(intro.price) === 0 && intro.periodUnit && intro.periodNumberOfUnits) {
      const unit = String(intro.periodUnit).toUpperCase()
      const mult = unit === 'DAY' ? 1 : unit === 'WEEK' ? 7 : unit === 'MONTH' ? 30 : unit === 'YEAR' ? 365 : 0
      return mult ? intro.periodNumberOfUnits * Math.max(1, intro.cycles || 1) * mult : null
    }
  } catch { /* unknown shape */ }
  return null
}

export const PLAY_TRIAL_OFFER_ID = 'trial14'
export const PLAY_BASE_PLAN_ID = 'monthly'

/**
 * The paid monthly base plan (`fredheim_premium` base plan `monthly`) with
 * no Play offer and no free phase. The 14 days already happened in the app,
 * so the purchase must not select `trial14`.
 * Returns null when that option is missing; the caller then buys the package.
 */
export function pickBasePlanOption(pkg) {
  const product = pkg?.product
  if (!product) return null
  const options = Array.isArray(product.subscriptionOptions) ? product.subscriptionOptions : []
  const plainMonthly = (o) => {
    if (!o || o.freePhase) return false
    if (o.offerId) return false
    if (o.basePlanId === PLAY_BASE_PLAN_ID) return true
    if (o.id === PLAY_BASE_PLAN_ID) return true
    return false
  }
  const fromList = options.find(plainMonthly)
  if (fromList) return fromList
  return plainMonthly(product.defaultOption) ? product.defaultOption : null
}

/**
 * Turns a RevenueCat / Google Play error into a short reason code for the
 * paywall. The raw message is shown small underneath for support.
 */
export function describeBillingError(err) {
  if (!err) return { kind: 'unknown', detail: '' }
  const code = String(err.code ?? err.errorCode ?? '')
  const msg = String(err.message || err.underlyingErrorMessage || err || '')
  const detail = [code && `code ${code}`, msg].filter(Boolean).join(': ').slice(0, 300)
  // 23 CONFIGURATION_ERROR: products not returned by Google Play
  // (not a tester, product not yet propagated, or app not from Play).
  if (code === '23' || /could be fetched|configuration/i.test(msg)) return { kind: 'storeProducts', detail }
  // 10 NETWORK_ERROR, 2 STORE_PROBLEM, 3 PURCHASE_NOT_ALLOWED, 5 PRODUCT_NOT_AVAILABLE
  if (code === '10' || /network|internet|offline|timed? ?out/i.test(msg)) return { kind: 'network', detail }
  if (code === '3') return { kind: 'notAllowed', detail }
  if (code === '5' || code === '2') return { kind: 'store', detail }
  return { kind: 'unknown', detail }
}

export function isPurchaseCancelled(err) {
  if (!err) return false
  if (err.userCancelled === true) return true
  if (String(err.code) === '1') return true // PURCHASE_CANCELLED
  const msg = err.message || String(err)
  return /cancel/i.test(msg)
}

/**
 * Reject with a RevenueCat-style NETWORK_ERROR (code 10) if `promise` has
 * not settled within `ms`. Used around every native RevenueCat step so a
 * hung bridge call can never leave the paywall on "Loading…" forever.
 */
export function withTimeout(promise, ms, label = 'Google Play') {
  let timer
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error(`Timed out waiting for ${label}`), { code: '10' })),
        ms,
      )
    }),
  ])
}

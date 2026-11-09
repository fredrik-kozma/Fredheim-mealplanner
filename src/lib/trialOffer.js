/** localStorage flag: the Android first-launch trial sheet has been dismissed. */
export const TRIAL_OFFER_SEEN_KEY = 'fredheim_trial_offer_seen'

export function hasSeenTrialOffer(storage) {
  try {
    return !!storage && storage.getItem(TRIAL_OFFER_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markTrialOfferSeen(storage) {
  try {
    storage?.setItem(TRIAL_OFFER_SEEN_KEY, '1')
  } catch { /* private mode */ }
}

/**
 * Full-screen trial sheet: Android app only, once, after the language
 * question, and only once we know the person does not already have Premium.
 * `blocked` holds it back (a shared link they just opened) without counting
 * that as "seen".
 */
export function shouldShowTrialOffer({ native, seen, hasPremium, rcKnown, languageChosen, blocked }) {
  return Boolean(native && !seen && !hasPremium && rcKnown && languageChosen && !blocked)
}

/** True while we are still waiting to learn whether the sheet should open. */
export function isTrialOfferPending({ native, seen, hasPremium, rcKnown, languageChosen, blocked }) {
  return Boolean(native && !seen && !hasPremium && !rcKnown && languageChosen && !blocked)
}

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import { WHATS_NEW } from '../../data/whatsNew'

/**
 * Pops up a single short card per unseen announcement in
 * src/data/whatsNew.js. When the user dismisses one, it gets added to
 * the persisted `seenNewsIds` array on the store and never shows again.
 * If multiple items are unseen we present them one at a time with a
 * "Next" button so each one gets its own moment.
 *
 * Brand-new users have `seenNewsIds === null` (the uninitialised state)
 * — on their first load we seed it with every current news id so they
 * don't get bombarded with retroactive announcements. Only items added
 * after their first install will pop up.
 *
 * Deferred while the tutorial is open so the two modals don't fight.
 */
export default function WhatsNewModal({ tutorialOpen = false }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.slice(0, 2) || 'en'
  const seenNewsIds = useStore(s => s.seenNewsIds)
  const hasSeenTutorial = useStore(s => s.hasSeenTutorial)
  const markNewsSeen = useStore(s => s.markNewsSeen)

  // First-touch initialisation. seenNewsIds === null means this user
  // has never seen any news state before. Two distinct cases:
  //   - Brand-new user (hasSeenTutorial=false): seed with every current
  //     news id so they don't get bombarded with announcements right
  //     after their tutorial. Only items added LATER will pop up.
  //   - Existing user the migration just bumped onto this schema
  //     (hasSeenTutorial=true): set an empty array so every current
  //     announcement is treated as unseen and shown to them once.
  useEffect(() => {
    if (seenNewsIds !== null) return
    if (hasSeenTutorial) {
      markNewsSeen([])
    } else {
      markNewsSeen(WHATS_NEW.map(n => n.id))
    }
  }, [seenNewsIds, hasSeenTutorial, markNewsSeen])

  // Build the list of items the user has not yet seen, preserving the
  // order in WHATS_NEW (newest first). Stable per render.
  const unseen = useMemo(() => {
    if (!Array.isArray(seenNewsIds)) return []
    return WHATS_NEW.filter(n => !seenNewsIds.includes(n.id))
  }, [seenNewsIds])

  const [index, setIndex] = useState(0)

  // Reset the pointer if the unseen list changes underneath us.
  useEffect(() => {
    setIndex(0)
  }, [unseen.length])

  // Hide while the tutorial is up. We never want to stack modals on
  // top of the brand-new-user tutorial.
  if (tutorialOpen) return null
  // Wait for the tutorial to be acknowledged before announcing anything
  // (only relevant for genuinely new users; existing users were migrated
  // to hasSeenTutorial=true).
  if (!hasSeenTutorial) return null
  if (unseen.length === 0) return null

  const item = unseen[index]
  if (!item) return null

  const isLast = index >= unseen.length - 1
  const title = item.title?.[lang] || item.title?.en || ''
  const body = item.body?.[lang] || item.body?.en || ''

  function handleNext() {
    // Mark the current item as seen and either advance to the next
    // unseen item or close.
    markNewsSeen([item.id])
    if (isLast) {
      setIndex(0)
    } else {
      setIndex(i => i + 1)
    }
  }

  function handleDismissAll() {
    // Quick escape hatch: mark every unseen item as seen and close.
    markNewsSeen(unseen.map(n => n.id))
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismissAll} />
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
        <button
          onClick={handleDismissAll}
          aria-label={t('common.close', { defaultValue: 'Close' })}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <div className="text-5xl mb-4 select-none" aria-hidden>{item.icon}</div>
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest mb-2">
            {t('whatsNew.label', { defaultValue: "What's new" })}
          </p>
          <h2 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
        </div>

        {/* Dots for multiple items */}
        {unseen.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {unseen.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleNext}
          className="mt-6 w-full bg-emerald-600 text-white hover:bg-emerald-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
        >
          {isLast
            ? t('whatsNew.gotIt', { defaultValue: 'Got it' })
            : t('whatsNew.next', { defaultValue: 'Next' })}
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useStore, { normalizeSlotItem } from '../../store/useStore'
import EditableNumber from '../common/EditableNumber'

/**
 * "This week is for N people" — rescales the entire current week.
 *
 * Changing the number multiplies every tweaked serving (batch items and
 * meal slots alike) by the same ratio, so a week built for 2 becomes a
 * coherent week for 6 rather than a mix of old and new amounts.
 *
 * Tapping + four times must land on the same numbers as typing the final
 * value. Applying each press against the *current* servings would re-round
 * every time and compound the error (4→5→6→7→8 turned a 13-portion batch
 * into 25 instead of 26), so the control keeps the servings from before the
 * user started adjusting and always replays from those at an exact ratio.
 *
 * The anchor is released once the user has left the control alone, so later
 * adjustments start from wherever the week actually is. It records serving
 * values only, so editing the plan mid-adjustment doesn't get clobbered.
 */
const APPLY_DELAY_MS = 250
const ANCHOR_RELEASE_MS = 6000

// Snapshot every serving value in the week, keyed so it can be matched back
// up against the live plan when the scale is applied.
function captureAnchor() {
  const s = useStore.getState()
  const servings = {}
  for (const [day, slots] of Object.entries(s.weekPlan || {})) {
    for (const [slot, items] of Object.entries(slots || {})) {
      for (const it of items || []) {
        const n = normalizeSlotItem(it)
        if (n) servings[`${day}__${slot}__${n.recipeId}`] = n.servings
      }
    }
  }
  const batchServings = {}
  for (const b of s.batchCook || []) {
    if (b && b.kind === 'recipe') batchServings[b.id] = b.servings
  }
  return { servings, batchServings, portions: s.familySize || 4 }
}

export default function WeekScale() {
  const { t } = useTranslation()
  const familySize = useStore(s => s.familySize)
  const scaleWeekFromBase = useStore(s => s.scaleWeekFromBase)

  // What the user is aiming at; the store catches up shortly after. Mirrored
  // in a ref so that taps arriving faster than React re-renders still step
  // from the latest target instead of a stale render's value.
  const [pending, setPending] = useState(familySize || 4)
  const pendingRef = useRef(pending)
  // Serving values from before this adjustment began.
  const anchorRef = useRef(null)
  const applyTimer = useRef(null)
  const releaseTimer = useRef(null)

  // Follow the store when the week changes underneath us (loading a saved
  // week, clearing, …) — but not while the user is mid-adjustment.
  useEffect(() => {
    if (anchorRef.current) return
    pendingRef.current = familySize || 4
    setPending(familySize || 4)
  }, [familySize])

  function step(delta) {
    adjust(pendingRef.current + delta)
  }

  function adjust(next) {
    const target = Math.max(1, Math.floor(next))
    pendingRef.current = target
    // Capture the pre-adjustment servings the first time we're touched.
    if (!anchorRef.current) anchorRef.current = captureAnchor()
    setPending(target)

    clearTimeout(applyTimer.current)
    applyTimer.current = setTimeout(() => {
      const a = anchorRef.current
      if (a) scaleWeekFromBase(a.servings, a.batchServings, a.portions, target)
    }, APPLY_DELAY_MS)

    // Let go of the anchor once the user has settled, so the next
    // adjustment starts from the week's real current state.
    clearTimeout(releaseTimer.current)
    releaseTimer.current = setTimeout(() => {
      anchorRef.current = null
    }, ANCHOR_RELEASE_MS)
  }

  useEffect(() => () => {
    clearTimeout(applyTimer.current)
    clearTimeout(releaseTimer.current)
  }, [])

  const value = pending

  return (
    <div
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1"
      title={t('planner.scaleWeekHint', {
        defaultValue: 'Scale the whole week — adjusted portions scale with it',
      })}
    >
      <span className="text-sm" aria-hidden>👥</span>
      <button
        onClick={() => step(-1)}
        disabled={value <= 1}
        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
        aria-label={t('planner.scaleDown', { defaultValue: 'Fewer people' })}
      >
        −
      </button>
      <EditableNumber
        value={value}
        onChange={(n) => adjust(n)}
        min={1}
        className="w-9 text-center text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded py-0.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
        aria-label={t('planner.peopleCount', { defaultValue: 'People' })}
      />
      <button
        onClick={() => step(1)}
        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
        aria-label={t('planner.scaleUp', { defaultValue: 'More people' })}
      >
        +
      </button>
      <span className="text-xs text-slate-500 pr-0.5 hidden sm:inline">
        {t('planner.people', { defaultValue: 'people' })}
      </span>
    </div>
  )
}

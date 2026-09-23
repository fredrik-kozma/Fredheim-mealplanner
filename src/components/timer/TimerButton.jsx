import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import useTimerTick, { formatRemaining, remainingMs } from './useTimerTick'
import TimerPanel from './TimerPanel'

/**
 * The timer's handle in the app chrome — a clock icon that turns into a
 * live countdown while anything is running, and goes amber and pulses when
 * something is done.
 *
 * Shows the *soonest* deadline when several are going, since that's the
 * one about to need you; the rest are one tap away in the panel.
 */
export default function TimerButton({ className = '', showLabel = false }) {
  const { t } = useTranslation()
  const timers = useStore(s => s.timers)
  const [open, setOpen] = useState(false)

  const hasRunning = timers.some(tm => tm.endsAt != null)
  const now = useTimerTick(hasRunning)

  const ringing = timers.filter(tm => tm.ringing)
  const running = timers
    .filter(tm => tm.endsAt != null)
    .sort((a, b) => a.endsAt - b.endsAt)

  const isRinging = ringing.length > 0
  const soonest = running[0] || null

  // What the button reads: a finished count beats a countdown, because a
  // chiming timer is the thing you need to act on.
  let readout = null
  if (isRinging) readout = t('timer.done', { defaultValue: 'Done!' })
  else if (soonest) readout = formatRemaining(remainingMs(soonest, now))
  else if (showLabel) readout = t('timer.title', { defaultValue: 'Timer' })

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('timer.title', { defaultValue: 'Timer' })}
        className={`flex items-center gap-1.5 rounded-full transition-colors flex-shrink-0 ${
          isRinging
            ? 'bg-amber-100 text-amber-800 animate-pulse'
            : soonest
              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
        } ${readout ? 'px-2.5 py-1.5' : 'p-1.5'} ${className}`}
      >
        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        {readout && (
          <span className="text-xs font-semibold tabular-nums whitespace-nowrap">{readout}</span>
        )}
        {/* A second running timer is worth knowing about without opening
            the panel. */}
        {!isRinging && running.length > 1 && (
          <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 rounded-full px-1.5 leading-4">
            {running.length}
          </span>
        )}
      </button>

      {open && <TimerPanel onClose={() => setOpen(false)} />}
    </>
  )
}

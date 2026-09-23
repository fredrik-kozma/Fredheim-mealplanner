import { useEffect, useState } from 'react'

/**
 * Re-renders the caller roughly once a second so countdowns advance.
 *
 * Returns the current time rather than a counter, because every timer's
 * remaining time is derived as `endsAt - now`. Nothing is accumulated, so
 * a tick that arrives late (a throttled background tab) shows the right
 * number rather than a drifted one — the tick only decides *when* we
 * re-read the clock, never what the clock says.
 *
 * Idle when `active` is false, so a kitchen with no timers running isn't
 * waking React every second.
 */
export default function useTimerTick(active = true) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 500)
    // A tab coming back to the foreground should correct itself at once
    // rather than on the next tick.
    const onVisible = () => { if (!document.hidden) setNow(Date.now()) }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active])

  return now
}

/** ms → "12:05", or "1:02:30" once there's an hour on the clock. */
export function formatRemaining(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Remaining ms for a timer in any of its states. */
export function remainingMs(timer, now) {
  if (timer.ringing) return 0
  if (timer.endsAt == null) return timer.remainingMs ?? timer.durationMs
  return Math.max(0, timer.endsAt - now)
}

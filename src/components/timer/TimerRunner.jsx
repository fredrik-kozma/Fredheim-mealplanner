import { useEffect } from 'react'
import useStore from '../../store/useStore'
import useTimerTick from './useTimerTick'
import { startChime, stopChime } from '../../utils/timerChime'

/**
 * Mounted once, app-wide. Watches every running timer for its deadline and
 * drives the chime.
 *
 * Deliberately renders nothing: the button in the header and the panel are
 * separate, and either can be unmounted (the header is mobile-only) without
 * a running bake losing its alarm. Expiry and sound belong to the app, not
 * to whichever bit of chrome happens to be on screen.
 */
export default function TimerRunner() {
  const timers = useStore(s => s.timers)
  const markTimerRinging = useStore(s => s.markTimerRinging)
  const reconcileTimers = useStore(s => s.reconcileTimers)

  // Deadlines can have passed while the app was closed — settle that once,
  // before the first tick, so a reload mid-bake still rings.
  useEffect(() => { reconcileTimers() }, [reconcileTimers])

  const hasRunning = timers.some(t => t.endsAt != null)
  const now = useTimerTick(hasRunning)

  useEffect(() => {
    for (const t of timers) {
      if (t.endsAt != null && t.endsAt <= now) markTimerRinging(t.id)
    }
  }, [now, timers, markTimerRinging])

  const anyRinging = timers.some(t => t.ringing)
  useEffect(() => {
    if (anyRinging) startChime()
    else stopChime()
  }, [anyRinging])

  // A reload or navigation away shouldn't leave the oscillator looping.
  useEffect(() => () => stopChime(), [])

  return null
}

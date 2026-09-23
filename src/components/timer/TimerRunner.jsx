import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import useTimerTick from './useTimerTick'
import { startChime, stopChime } from '../../utils/timerChime'
import { notifyTimerDone, clearTimerNotifications } from '../../utils/timerNotify'

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
  const { t } = useTranslation()
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

  const ringing = timers.filter(tm => tm.ringing)
  const anyRinging = ringing.length > 0

  useEffect(() => {
    if (anyRinging) startChime()
    else {
      stopChime()
      // Nothing is ringing any more, so nothing should be left in the tray.
      clearTimerNotifications()
    }
  }, [anyRinging])

  // Post one notification per timer as it finishes — tracked by id so a
  // re-render, or a second timer going off, can't repost the first one.
  const notified = useRef(new Set())
  useEffect(() => {
    const live = new Set(timers.map(tm => tm.id))
    for (const id of notified.current) if (!live.has(id)) notified.current.delete(id)
    for (const tm of ringing) {
      if (notified.current.has(tm.id)) continue
      notified.current.add(tm.id)
      notifyTimerDone(
        t('timer.notificationTitle', { defaultValue: 'Timer done' }),
        tm.label || t('timer.notificationBody', { defaultValue: 'Your kitchen timer has finished.' })
      )
    }
  }, [ringing, timers, t])

  // A reload or navigation away shouldn't leave the oscillator looping.
  useEffect(() => () => stopChime(), [])

  return null
}

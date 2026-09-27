import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

/**
 * The banner that appears by itself the moment a timer finishes, over
 * whatever page you happen to be on.
 *
 * Exists because silencing the alarm used to mean finding the clock in the
 * header, opening the panel, and hitting a small ✕ on the right row —
 * three considered taps while a chime repeats and your hands are busy.
 * Stopping an alarm should be the easiest thing on screen, so it's a
 * full-width button that needs no aim.
 *
 * Portalled to <body> for the same reason the panel is: the app chrome
 * uses backdrop-blur, and a blurred ancestor captures fixed positioning.
 */
export default function TimerAlarm() {
  const { t } = useTranslation()
  const timers = useStore(s => s.timers)
  const removeTimer = useStore(s => s.removeTimer)
  const restartTimer = useStore(s => s.restartTimer)
  const clearFinishedTimers = useStore(s => s.clearFinishedTimers)

  const ringing = timers.filter(tm => tm.ringing)
  if (ringing.length === 0) return null

  return createPortal(
    // Cleared above the mobile tab bar (measured at 65px) rather than laid
    // over it — an alarm shouldn't cost you the ability to navigate while
    // it's up. Desktop has a side nav, so it only needs a normal margin.
    <div className="fixed inset-x-0 bottom-0 z-[70] pointer-events-none px-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-4">
      <div className="pointer-events-auto mx-auto w-full max-w-md rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-2xl overflow-hidden">
        {ringing.map((tm, i) => (
          <div key={tm.id} className={i > 0 ? 'border-t border-amber-200' : ''}>
            <div className="flex items-center gap-3 px-4 pt-3.5">
              <span className="text-2xl animate-pulse" aria-hidden>⏰</span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-amber-900 leading-tight">
                  {t('timer.done', { defaultValue: 'Done!' })}
                </p>
                {tm.label && (
                  <p className="text-sm text-amber-800 truncate">{tm.label}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 p-3">
              {/* The big one. Full width minus the secondary action, so it
                  can be hit without looking. */}
              <button
                onClick={() => removeTimer(tm.id)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-base rounded-xl py-3.5 transition-colors"
              >
                {t('timer.stopAlarm', { defaultValue: 'Stop' })}
              </button>
              <button
                onClick={() => restartTimer(tm.id)}
                className="px-4 rounded-xl border border-amber-300 text-amber-800 font-semibold text-sm hover:bg-amber-100 transition-colors"
              >
                {t('timer.again', { defaultValue: 'Again' })}
              </button>
            </div>
          </div>
        ))}

        {ringing.length > 1 && (
          <button
            onClick={clearFinishedTimers}
            className="w-full text-sm font-semibold text-amber-800 hover:bg-amber-100 py-2.5 border-t border-amber-200 transition-colors"
          >
            {t('timer.stopAll', { defaultValue: 'Stop all' })}
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import useTimerTick, { formatRemaining, remainingMs } from './useTimerTick'
import { unlockAudio } from '../../utils/timerChime'

// The lengths a kitchen actually reaches for. One tap, no typing — which
// is the whole point when your hands are in dough.
const PRESETS = [1, 3, 5, 10, 15, 20, 30, 45, 60]

export default function TimerPanel({ onClose }) {
  const { t } = useTranslation()
  const timers = useStore(s => s.timers)
  const addTimer = useStore(s => s.addTimer)
  const pauseTimer = useStore(s => s.pauseTimer)
  const resumeTimer = useStore(s => s.resumeTimer)
  const removeTimer = useStore(s => s.removeTimer)
  const restartTimer = useStore(s => s.restartTimer)

  const [minutes, setMinutes] = useState('')
  const [label, setLabel] = useState('')

  const hasRunning = timers.some(tm => tm.endsAt != null)
  const now = useTimerTick(hasRunning)

  function start(mins) {
    const m = Number(mins)
    if (!Number.isFinite(m) || m <= 0) return
    // Opens the audio device while this tap is still live. Silent on
    // purpose — see unlockAudio. Without it, iOS never lets the alarm
    // sound, because by expiry there is no gesture left to attach to.
    unlockAudio()
    addTimer(label, Math.round(m * 60 * 1000))
    setMinutes('')
    setLabel('')
  }

  // Finished first — they're what needs dealing with.
  const sorted = [...timers].sort((a, b) => {
    if (a.ringing !== b.ringing) return a.ringing ? -1 : 1
    const ra = remainingMs(a, now)
    const rb = remainingMs(b, now)
    return ra - rb
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800 inline-flex items-center gap-2">
            <span aria-hidden>⏱</span>
            {t('timer.title', { defaultValue: 'Timer' })}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-slate-500"
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Running / finished timers */}
        {sorted.length > 0 && (
          <div className="space-y-2 mb-5">
            {sorted.map(tm => {
              const left = remainingMs(tm, now)
              const paused = tm.endsAt == null && !tm.ringing
              return (
                <div
                  key={tm.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    tm.ringing
                      ? 'bg-amber-50 border-amber-200'
                      : paused
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-indigo-50/60 border-indigo-100'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-lg font-bold tabular-nums leading-tight ${
                      tm.ringing ? 'text-amber-800' : paused ? 'text-slate-500' : 'text-indigo-800'
                    }`}>
                      {tm.ringing ? t('timer.done', { defaultValue: 'Done!' }) : formatRemaining(left)}
                    </p>
                    {tm.label && (
                      <p className="text-xs text-slate-600 truncate mt-0.5">{tm.label}</p>
                    )}
                    {paused && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t('timer.paused', { defaultValue: 'Paused' })}
                      </p>
                    )}
                  </div>

                  {tm.ringing ? (
                    <button
                      onClick={() => restartTimer(tm.id)}
                      className="text-xs font-semibold text-amber-800 hover:bg-amber-100 rounded-lg px-2.5 py-1.5"
                    >
                      {t('timer.again', { defaultValue: 'Again' })}
                    </button>
                  ) : (
                    <button
                      onClick={() => paused ? resumeTimer(tm.id) : pauseTimer(tm.id)}
                      className="text-slate-400 hover:text-indigo-600 p-1"
                      aria-label={paused
                        ? t('timer.resume', { defaultValue: 'Resume' })
                        : t('timer.pause', { defaultValue: 'Pause' })}
                    >
                      {paused ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => removeTimer(tm.id)}
                    className="text-slate-300 hover:text-red-500 p-1"
                    aria-label={tm.ringing
                      ? t('timer.dismiss', { defaultValue: 'Dismiss' })
                      : t('common.remove')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* New timer */}
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {t('timer.newTimer', { defaultValue: 'New timer' })}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESETS.map(m => (
            <button
              key={m}
              onClick={() => start(m)}
              className="py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {t('timer.minutesShort', { n: m, defaultValue: `${m} min` })}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="input w-24"
            type="number"
            min="1"
            inputMode="numeric"
            placeholder={t('timer.minutesPlaceholder', { defaultValue: 'Min' })}
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && start(minutes)}
          />
          <input
            className="input flex-1"
            placeholder={t('timer.labelPlaceholder', { defaultValue: 'What for? (optional)' })}
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && start(minutes)}
          />
        </div>
        <button
          onClick={() => start(minutes)}
          disabled={!minutes || Number(minutes) <= 0}
          className="btn-primary w-full mt-2 text-sm py-2 disabled:opacity-40"
        >
          {t('timer.start', { defaultValue: 'Start' })}
        </button>

        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
          {t('timer.backgroundHint', {
            defaultValue: 'Keeps counting while you use the rest of the app. The chime needs the app open on screen — a locked phone may silence it.',
          })}
        </p>
      </div>
    </div>
  )
}

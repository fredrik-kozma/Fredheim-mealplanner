import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

/**
 * "Which days?" — shown before either planner printout.
 *
 * Shared by the week grid and the recipe book because the question is the
 * same one, but the *answers* differ: a day holding only a note belongs on
 * the grid and has no page in the book. The caller decides which days it
 * can actually print and passes only those, so nothing offered here can
 * come out empty.
 *
 * Everything starts selected, so the common case — print the lot — stays a
 * single extra tap rather than a form to fill in.
 */
export default function PrintDayPicker({ days, confirmLabel, onCancel, onConfirm }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(() => new Set(days.map(d => d.key)))

  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const allOn = selected.size === days.length
  const noneOn = selected.size === 0

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-semibold text-slate-800">
            {t('planner.printDaysTitle', { defaultValue: 'Which days?' })}
          </h2>
          <button
            onClick={() => setSelected(allOn ? new Set() : new Set(days.map(d => d.key)))}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            {allOn
              ? t('planner.printSelectNone', { defaultValue: 'Clear all' })
              : t('planner.printSelectAll', { defaultValue: 'Select all' })}
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {t('planner.printDaysHint', { defaultValue: 'Only the days you tick are printed.' })}
        </p>

        <div className="space-y-1.5 mb-4">
          {days.map(day => {
            const on = selected.has(day.key)
            return (
              <label
                key={day.key}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  on ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(day.key)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                <span className={`flex-1 text-sm font-medium ${on ? 'text-slate-800' : 'text-slate-500'}`}>
                  {day.label}
                </span>
                {/* What you actually get for that day, so an empty-looking
                    choice isn't a surprise at the printer. */}
                {/* Pluralised properly — a day with one meal reading
                    "1 måltider" is the kind of wrong that gets noticed. */}
                <span className="text-xs text-slate-400 tabular-nums">
                  {t('planner.printMealsCount', {
                    count: day.count,
                    defaultValue: `${day.count} meals`,
                  })}
                </span>
              </label>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onConfirm([...selected])}
            disabled={noneOn}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

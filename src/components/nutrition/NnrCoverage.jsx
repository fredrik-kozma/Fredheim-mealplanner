import { useTranslation } from 'react-i18next'
import { fmtNutrient } from '../../utils/nutritionData'
import { coverageRows } from '../../utils/healthGoals'

const BAR = {
  green: 'bg-success-500',
  amber: 'bg-amber-400',
  red: 'bg-rose-500',
  supplement: 'bg-sky-400',
}

/**
 * Day/week totals vs NNR 2023 adult general (+ WHO/AHA caps).
 * Caps: under limit = good. B12/D/omega-3: calm supplement status, never red.
 */
export default function NnrCoverage({ totals, kcalTarget, onSelectNutrient, emptyText }) {
  const { t } = useTranslation()
  const rows = coverageRows(totals || {}, { kcalTarget })
  const isEmpty = !totals || !Object.keys(totals).length

  if (isEmpty) {
    return (
      <div className="empty-state">
        <p className="empty-state-body mt-0">{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-2xs text-slate-500 leading-relaxed">{t('nutrition.nnrNote')}</p>
      <p className="text-2xs text-slate-500 leading-relaxed">{t('makeMyWeek.medicalDisclaimer')}</p>
      <div className="divide-y divide-slate-100">
        {rows.map(row => {
          const clickable = typeof onSelectNutrient === 'function'
          const Inner = (
            <>
              <span className="text-xs text-slate-700">
                {t(`nutrition.fields.${row.key}`, { defaultValue: row.key })}
                {row.mode === 'cap' && (
                  <span className="ml-1 text-2xs text-slate-400">({t('nutrition.capGood')})</span>
                )}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-800 tabular-nums">
                  {fmtNutrient(row.value)} {row.unit}
                </span>
                <span className="text-2xs text-slate-500 tabular-nums w-10 text-right">
                  {row.mode === 'cap' ? `${row.pct}%` : `${row.pct}%`}
                </span>
                <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR[row.status] || BAR.amber}`}
                    style={{ width: `${Math.min(100, row.mode === 'cap' ? Math.min(100, row.pct) : row.pct)}%` }}
                  />
                </div>
              </div>
            </>
          )
          return clickable ? (
            <button
              key={row.key}
              type="button"
              onClick={() => onSelectNutrient(row)}
              className="w-full flex items-center justify-between gap-3 py-1.5 text-left hover:bg-slate-50 rounded-small px-1 -mx-1"
            >
              {Inner}
            </button>
          ) : (
            <div key={row.key} className="flex items-center justify-between gap-3 py-1.5">
              {Inner}
            </div>
          )
        })}
      </div>
      {rows.some(r => r.status === 'supplement') && (
        <p className="text-2xs text-sky-800 bg-sky-50 border border-sky-100 rounded-small px-2.5 py-2 leading-relaxed">
          {t('nutrition.supplementNote')}
        </p>
      )}
    </div>
  )
}

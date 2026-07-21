import { useTranslation } from 'react-i18next'
import { NUTRITION_GROUPS, fmtNutrient, dvColour } from '../../utils/nutritionData'

/**
 * Renders a totals object (already summed across everything eaten) against
 * the daily reference targets, as labelled rows with a % coverage figure and
 * the same colour-coded bar used on recipe pages.
 *
 * Unlike the recipe NutritionPanel (which shows one recipe's amounts), this
 * is target-oriented: the emphasis is "how much of the day have I covered",
 * so every nutrient with an official Daily Value shows a % and a bar.
 *
 * Props:
 *   - totals: object keyed by nutrient (from sumNutrition)
 *   - label:  small caption shown above the groups (e.g. the date, or
 *             "daily average this week")
 */
export default function NutritionCoverage({ totals, label }) {
  const { t } = useTranslation()
  const isEmpty = !totals || Object.keys(totals).length === 0

  return (
    <div>
      {label && (
        <p className="text-[11px] text-slate-500 mb-3">{label}</p>
      )}

      {isEmpty ? (
        <div className="text-center py-8 text-sm text-slate-400">
          {t('nutritionTracker.emptyTotals', { defaultValue: 'Nothing logged yet — add a meal to see your coverage.' })}
        </div>
      ) : (
        <div className="space-y-5">
          {NUTRITION_GROUPS.map(group => {
            const anyValue = group.fields.some(f => {
              const v = totals[f.key]
              return v !== null && v !== undefined && v !== 0
            })
            if (!anyValue) return null

            return (
              <div key={group.key}>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t(`nutrition.groups.${group.key}`, { defaultValue: group.label })}
                </h3>
                <div className="divide-y divide-slate-100">
                  {group.fields.map(field => {
                    const value = totals[field.key]
                    if (value === null || value === undefined) return null
                    const pct = field.dv ? Math.round((value / field.dv) * 100) : null
                    return (
                      <div
                        key={field.key}
                        className={`flex items-center justify-between gap-3 py-1.5 ${field.indent ? 'pl-4' : ''}`}
                      >
                        <span className="text-xs text-slate-700">
                          {t(`nutrition.fields.${field.key}`, { defaultValue: field.label })}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-800 tabular-nums">
                            {fmtNutrient(value)} {field.unit}
                          </span>
                          {pct !== null ? (
                            <>
                              <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
                                {pct}%
                              </span>
                              <div className="w-14 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${dvColour(pct)}`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="w-10" />
                              <span className="w-14" />
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

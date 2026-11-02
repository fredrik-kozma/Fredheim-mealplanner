import { useTranslation } from 'react-i18next'

const STATUS_STYLES = {
  green: 'bg-success-50 border-success-200 text-success-800',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  red: 'bg-rose-50 border-rose-200 text-rose-900',
}
const DOT = {
  green: 'bg-success-600',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
}

/**
 * Make-my-week result: per-goal green/amber/red fit vs approved targets.
 */
export default function GoalFitCard({ goalFit, kcalTarget }) {
  const { t } = useTranslation()
  if (!Array.isArray(goalFit) || !goalFit.length) return null

  return (
    <div className="rounded-control border border-slate-200 bg-white px-3 py-2.5 space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
          {t('makeMyWeek.goalFit.title')}
        </p>
        <p className="text-2xs text-slate-500 leading-snug text-right max-w-[14rem]">
          {t('makeMyWeek.medicalDisclaimer')}
        </p>
      </div>
      <ul className="space-y-2">
        {goalFit.map(({ goal, status, checks }) => (
          <li key={goal} className={`rounded-small border px-2.5 py-2 ${STATUS_STYLES[status] || STATUS_STYLES.amber}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT[status] || DOT.amber}`} aria-hidden />
              <p className="text-sm font-semibold">
                {t(`makeMyWeek.goals.${goal}`)}
                <span className="ml-2 text-2xs font-medium opacity-80">
                  {t(`makeMyWeek.goalFit.${status}`)}
                </span>
              </p>
            </div>
            <ul className="space-y-1 pl-4">
              {checks.filter(c => c.status !== 'green').map(c => (
                <li key={`${goal}-${c.key}`} className="text-2xs leading-relaxed">
                  {t(`makeMyWeek.goalFitTips.${c.tipKey}`, {
                    defaultValue: c.tipKey,
                    value: Math.round(c.value * 10) / 10,
                    target: Math.round(c.target * 10) / 10,
                  })}
                </li>
              ))}
              {checks.every(c => c.status === 'green') && (
                <li className="text-2xs leading-relaxed opacity-80">
                  {t('makeMyWeek.goalFit.green')}
                </li>
              )}
            </ul>
          </li>
        ))}
      </ul>
      {kcalTarget ? (
        <p className="text-2xs text-slate-500 tabular-nums">
          {t('makeMyWeek.kcalPerDay', { defaultValue: '{{kcal}} kcal/day', kcal: kcalTarget })}
        </p>
      ) : null}
    </div>
  )
}

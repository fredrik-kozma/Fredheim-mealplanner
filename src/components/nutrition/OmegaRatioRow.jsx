import { useTranslation } from 'react-i18next'
import { formatOmegaRatio } from '../../utils/omegaBalance'

// The omega-6 : omega-3 row: green at or under 4 : 1, amber above. Pass the
// ratio, or nothing with `incomplete` when a meal has no values. `note` says
// what the figure covers ("5 of 7 days").
export default function OmegaRatioRow({ ratio, favourable, incomplete, note, className = '' }) {
  const { t } = useTranslation()
  if (ratio == null && !incomplete) return null
  return (
    <div className={`flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5 ${className}`}>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-slate-600">
          {t('nutrition.omega63Ratio', { defaultValue: 'Omega-6 : Omega-3 ratio' })}
        </span>
        <span className="block text-[10px] text-slate-400">
          {t('nutrition.omega63Hint', { defaultValue: 'Lower is better: under 4 : 1 is a good target.' })}
        </span>
        {note && <span className="block text-[10px] text-slate-400">{note}</span>}
      </span>
      {ratio == null ? (
        <span className="flex-shrink-0 text-[11px] font-medium text-slate-400 text-right">
          {t('nutrition.omega63Incomplete', { defaultValue: 'Incomplete: a meal has no omega values' })}
        </span>
      ) : (
        <span className={`flex-shrink-0 text-xs font-bold tabular-nums ${favourable ? 'text-emerald-700' : 'text-amber-600'}`}>
          {formatOmegaRatio(ratio)}
          {favourable ? ' ✓' : ''}
        </span>
      )}
    </div>
  )
}

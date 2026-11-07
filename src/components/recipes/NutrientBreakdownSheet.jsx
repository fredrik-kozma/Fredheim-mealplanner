import { useEffect, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { fmtNutrient } from '../../utils/nutritionData'
import { formatMeasuredQuantity } from '../../utils/scaleIngredient'

/**
 * Bottom sheet: which ingredients contribute to one nutrient.
 * Mirrors shopping-list "where this comes from" tone; layout from design mockups.
 */
export default function NutrientBreakdownSheet({
  open,
  onClose,
  nutrientKey,
  nutrientLabel,
  unit,
  view, // from viewNutrientBreakdown
  recipeTitle,
  modeLabel,
  dvPct,
  currentLang = 'en',
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const closeRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    previouslyFocused.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    // Focus close button after paint
    const tId = setTimeout(() => closeRef.current?.focus?.(), 0)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      clearTimeout(tId)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open || !view) return null

  const othersLabel = view.others?.names?.length
    ? t('nutrition.breakdownOthers', {
        names: view.others.names.slice(0, 4).join(', '),
        defaultValue: `Others (${view.others.names.slice(0, 4).join(', ')})`,
      })
    : null

  const yieldNote = view.yieldFactor != null && view.yieldFactor < 0.999
    ? t('nutrition.breakdownYieldNote', {
        factor: view.yieldFactor,
        defaultValue: `Strained recipe — totals scaled by yield factor ${view.yieldFactor} (pulp/solids discarded).`,
      })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 scrim" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 sheet sm:max-w-md flex flex-col max-h-[88dvh] sm:max-h-[90dvh] overflow-hidden"
      >
        <div className="flex justify-center pt-2 pb-1 sm:hidden" aria-hidden="true">
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-start justify-between gap-3 px-4 pt-2 pb-1">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-extrabold text-slate-900 truncate">
              {nutrientLabel}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {t('nutrition.breakdownSubtitle', {
                recipe: recipeTitle,
                mode: modeLabel,
                defaultValue: `Where this comes from · ${recipeTitle} · ${modeLabel}`,
              })}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="tap-target flex-shrink-0 w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-lg leading-none"
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            ×
          </button>
        </div>

        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-700 text-2xs font-bold px-2.5 py-1">
            {dvPct != null
              ? `Total ${fmtNutrient(view.totalAmount)} ${unit} · ${dvPct}% DV`
              : `Total ${fmtNutrient(view.totalAmount)} ${unit}`}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="divide-y divide-slate-100">
            {view.parts.map((p) => (
              <div key={p.ingredientId || p.name} className="py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                    <div className="text-2xs text-slate-500 mt-0.5">
                      {p.quantity != null && p.unit
                        ? formatMeasuredQuantity(p.quantity, p.unit, currentLang, {
                          ingredientId: p.ingredientId,
                          weighGrams: p.weighGrams,
                        })
                        : null}
                      {p.note ? <span className="text-slate-400"> · {p.note}</span> : null}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-extrabold tabular-nums text-slate-900">{p.pct}%</div>
                    <div className="text-2xs text-slate-500 tabular-nums">
                      {fmtNutrient(p.amount)} {unit}
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{ width: `${Math.min(100, Math.max(0, p.pct))}%` }}
                  />
                </div>
              </div>
            ))}

            {othersLabel && view.others && (
              <div className="py-2.5 flex items-center justify-between gap-3 text-xs text-slate-600">
                <span className="min-w-0">{othersLabel}</span>
                <span className="font-bold text-slate-900 tabular-nums whitespace-nowrap">
                  {view.others.pct}% · {fmtNutrient(view.others.amount)} {unit}
                </span>
              </div>
            )}
          </div>

          {view.uncounted?.length > 0 && (
            <div className="mt-3 text-2xs text-slate-500">
              <span className="font-semibold text-slate-600">
                {t('nutrition.breakdownNotCounted', { defaultValue: 'Not counted' })}:
              </span>{' '}
              {view.uncounted.map((u) => u.name).join(', ')}
            </div>
          )}

          <div className="mt-3 rounded-control border border-slate-200 bg-slate-50 p-3 text-2xs text-slate-500 leading-relaxed">
            <strong className="text-slate-600">
              {t('nutrition.breakdownHowTitle', { defaultValue: 'How it’s calculated.' })}
            </strong>{' '}
            {t('nutrition.breakdownHow', {
              defaultValue:
                'Each linked ingredient’s value (USDA-SR / Matvaretabellen per 100 g × amount used) is summed for this recipe, then shown for the current view. Percentages are rounded so they add to 100. Unlinked or unmeasured rows are listed as not counted.',
            })}
            {yieldNote ? <> {yieldNote}</> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

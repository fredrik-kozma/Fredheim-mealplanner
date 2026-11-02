import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fmtNutrient } from '../../utils/nutritionData'
import { viewNutrientBreakdown, estimateRecipeNutritionBreakdown } from '../../utils/nutritionEngine'
import NutrientBreakdownSheet from '../recipes/NutrientBreakdownSheet'
import { loadNutritionDb } from '../../utils/loadNutritionDb'

/**
 * Sheet: recipes contributing to one nutrient on a planned day,
 * with drill-down into the existing per-recipe ingredient breakdown.
 */
export default function PlannedContributorsSheet({
  open,
  onClose,
  nutrientKey,
  nutrientLabel,
  unit,
  contributors, // { total, parts: [{ recipeId, title, amount, pct, recipe }] }
  currentLang = 'en',
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const closeRef = useRef(null)
  const [drill, setDrill] = useState(null) // { recipe, view }
  const [db, setDb] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose?.() } }
    document.addEventListener('keydown', onKey)
    const tId = setTimeout(() => closeRef.current?.focus?.(), 0)
    loadNutritionDb?.().then?.(setDb).catch?.(() => {})
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      clearTimeout(tId)
    }
  }, [open, onClose])

  useEffect(() => { if (!open) setDrill(null) }, [open])

  if (!open) return null

  async function openIngredientBreakdown(part) {
    let nutritionDb = db
    if (!nutritionDb) {
      try {
        nutritionDb = await loadNutritionDb()
        setDb(nutritionDb)
      } catch {
        nutritionDb = null
      }
    }
    if (!nutritionDb || !part.recipe) return
    const br = estimateRecipeNutritionBreakdown(part.recipe, nutritionDb, { saltLevel: 'low' })
    const view = viewNutrientBreakdown(br, nutrientKey, { topN: 6 })
    setDrill({
      recipe: part.recipe,
      title: part.title,
      view,
    })
  }

  return (
    <>
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
                {t('nutrition.contributorsTitle', { nutrient: nutrientLabel })}
              </h2>
              <p className="text-2xs text-slate-500 tabular-nums mt-0.5">
                {fmtNutrient(contributors?.total || 0)} {unit}
              </p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="btn-secondary btn-icon flex-shrink-0" aria-label={t('common.close', { defaultValue: 'Close' })}>
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
            {(contributors?.parts || []).map(p => (
              <button
                key={p.recipeId}
                type="button"
                onClick={() => openIngredientBreakdown(p)}
                className="w-full flex items-center justify-between gap-3 py-2 border-b border-slate-100 text-left hover:bg-slate-50"
              >
                <span className="text-sm text-slate-800 truncate">{p.title}</span>
                <span className="text-xs font-semibold tabular-nums text-slate-700 flex-shrink-0">
                  {p.pct}% · {fmtNutrient(p.amount)} {unit}
                </span>
              </button>
            ))}
            {!contributors?.parts?.length && (
              <p className="text-sm text-slate-500 py-4">{t('nutritionTracker.plannedEmpty')}</p>
            )}
          </div>
        </div>
      </div>
      {drill && (
        <NutrientBreakdownSheet
          open={!!drill}
          onClose={() => setDrill(null)}
          nutrientKey={nutrientKey}
          nutrientLabel={nutrientLabel}
          unit={unit}
          view={drill.view}
          recipeTitle={drill.title}
          currentLang={currentLang}
        />
      )}
    </>
  )
}

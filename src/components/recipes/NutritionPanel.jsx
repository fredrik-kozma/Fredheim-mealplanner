import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VISIBLE_NUTRITION_GROUPS, fmtNutrient, dvColour } from '../../utils/nutritionData'
import { omegaRatio } from '../../utils/omegaBalance'
import OmegaRatioRow from '../nutrition/OmegaRatioRow'
import NutrientBreakdownSheet from './NutrientBreakdownSheet'
import { loadNutritionDb } from '../../utils/loadNutritionDb'
import {
  estimateRecipeNutritionBreakdown,
  viewNutrientBreakdown,
} from '../../utils/nutritionEngine'

function InfoIcon({ active }) {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

/**
 * NutritionPanel — per-serving nutrition with Per Serving / Per 100 g / Full recipe.
 * Optional ⓘ opens a bottom sheet breaking a nutrient down by ingredient.
 *
 * Props:
 *   - recipe: salt-adjusted recipe whose nutrition.perServing is shown
 *   - displayServings: scaled serving count for "full recipe"
 *   - bare: omit outer card chrome when nested in CollapsibleSection
 *   - breakdownRecipe: recipe used for live engine (swaps + salt applied)
 *   - recipeById: for composite / sub-recipe expansion
 *   - recipeTitle: shown in the sheet subtitle
 */
export default function NutritionPanel({
  recipe,
  displayServings,
  bare = false,
  breakdownRecipe = null,
  recipeById = null,
  recipeTitle = '',
  saltLevel = 'low',
}) {
  const { t, i18n } = useTranslation()
  const [mode, setMode] = useState('serving') // 'serving' | '100g' | 'full'
  const [openKey, setOpenKey] = useState(null)
  const [db, setDb] = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [breakdownError, setBreakdownError] = useState(null)

  const perServing = recipe?.nutrition?.perServing
  const currentLang = (i18n.language || 'en').slice(0, 2)

  const servingWeight = recipe.servingWeightGrams || null
  const totalServings = displayServings || recipe.servings || 1

  let multiplier = 1
  if (mode === '100g') {
    if (servingWeight && servingWeight > 0) multiplier = 100 / servingWeight
  } else if (mode === 'full') {
    multiplier = totalServings
  }

  let columnLabel = ''
  if (mode === 'serving') columnLabel = t('nutrition.perServing', { defaultValue: 'Per serving' })
  else if (mode === '100g') columnLabel = t('nutrition.per100g', { defaultValue: 'Per 100 g' })
  else columnLabel = t('nutrition.fullRecipeWithCount', { count: totalServings, defaultValue: `Full recipe (${totalServings} servings)` })

  const canShow100g = Boolean(servingWeight && servingWeight > 0)

  // Lazy: only load DB / compute when user opens a nutrient sheet
  useEffect(() => {
    if (!openKey) return undefined
    let alive = true
    setBreakdownError(null)
    loadNutritionDb()
      .then((loaded) => {
        if (!alive) return
        setDb(loaded)
        const source = breakdownRecipe || recipe
        if (!source) return
        const br = estimateRecipeNutritionBreakdown(source, loaded, {
          saltLevel: saltLevel || 'low',
          recipeById: recipeById || undefined,
        })
        setBreakdown(br)
      })
      .catch((e) => {
        if (alive) setBreakdownError(e)
      })
    return () => { alive = false }
  }, [openKey, breakdownRecipe, recipe, recipeById, saltLevel])

  // Recompute when salt-adjusted breakdown recipe identity changes while open
  const sheetView = useMemo(() => {
    if (!openKey || !breakdown) return null
    return viewNutrientBreakdown(breakdown, openKey, { topN: 5, multiplier })
  }, [openKey, breakdown, multiplier])

  const openField = useMemo(() => {
    if (!openKey) return null
    for (const g of VISIBLE_NUTRITION_GROUPS) {
      const f = g.fields.find((x) => x.key === openKey)
      if (f) return f
    }
    return null
  }, [openKey])

  const handleOpen = useCallback((key) => {
    setOpenKey((prev) => (prev === key ? null : key))
  }, [])

  const handleClose = useCallback(() => setOpenKey(null), [])

  if (!perServing) return null

  return (
    <section className={bare ? '' : 'card p-5 mt-6'}>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        {!bare && (
          <h2 className="section-title flex items-center gap-2">
            <span className="text-lg">🥗</span>
            {t('nutrition.title', { defaultValue: 'Nutrition' })}
          </h2>
        )}
        <div className="inline-flex bg-slate-100 rounded-small p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('serving')}
            className={`tap-target px-2.5 py-1 rounded-small font-medium transition-colors ${
              mode === 'serving' ? 'bg-white shadow-card text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('nutrition.perServingShort', { defaultValue: 'Per serving' })}
          </button>
          {canShow100g && (
            <button
              type="button"
              onClick={() => setMode('100g')}
              className={`tap-target px-2.5 py-1 rounded-small font-medium transition-colors ${
                mode === '100g' ? 'bg-white shadow-card text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('nutrition.per100gShort', { defaultValue: 'Per 100 g' })}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('full')}
            className={`tap-target px-2.5 py-1 rounded-small font-medium transition-colors ${
              mode === 'full' ? 'bg-white shadow-card text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('nutrition.fullRecipeShort', { defaultValue: 'Full recipe' })}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 text-2xs text-slate-500">
        <span>{columnLabel}</span>
        {mode === 'serving' && servingWeight && (
          <span className="text-slate-400">≈ {servingWeight} g</span>
        )}
        {mode === '100g' && !canShow100g && (
          <span className="text-warning-600">{t('nutrition.no100gAvail', { defaultValue: 'Serving weight not set' })}</span>
        )}
        {mode === 'full' && servingWeight && (
          <span className="text-slate-400">≈ {Math.round(servingWeight * totalServings)} g</span>
        )}
      </div>

      <div className="space-y-5">
        {VISIBLE_NUTRITION_GROUPS.map((group) => {
          const anyValue = group.fields.some((f) => {
            const v = perServing[f.key]
            return v !== null && v !== undefined && v !== 0
          })
          if (!anyValue) return null

          return (
            <div key={group.key}>
              <h3 className="eyebrow mb-2">
                {t(`nutrition.groups.${group.key}`, { defaultValue: group.label })}
              </h3>
              <div className="divide-y divide-slate-100">
                {group.fields.map((field) => {
                  const rawValue = perServing[field.key]
                  if (rawValue === null || rawValue === undefined) return null
                  const scaled = rawValue * multiplier
                  const display = fmtNutrient(scaled)
                  let pct = null
                  if (mode === 'serving' && field.dv) {
                    pct = Math.round((rawValue / field.dv) * 100)
                  } else if (mode === 'full' && field.dv) {
                    pct = Math.round((scaled / field.dv) * 100)
                  }
                  const canBreak = typeof rawValue === 'number' && rawValue !== 0
                  return (
                    <div
                      key={field.key}
                      className={`flex items-center justify-between gap-3 py-1.5 ${field.indent ? 'pl-4' : ''}`}
                    >
                      <span className="text-xs text-slate-700 flex items-center gap-1 min-w-0">
                        <span className="truncate">
                          {t(`nutrition.fields.${field.key}`, { defaultValue: field.label })}
                        </span>
                        {canBreak && (
                          <button
                            type="button"
                            onClick={() => handleOpen(field.key)}
                            className={`tap-target flex-shrink-0 transition-colors ${
                              openKey === field.key ? 'text-primary-500' : 'text-slate-300 hover:text-primary-500'
                            }`}
                            title={t('nutrition.breakdown', { defaultValue: 'Where this comes from' })}
                            aria-label={t('nutrition.breakdownFor', {
                              nutrient: t(`nutrition.fields.${field.key}`, { defaultValue: field.label }),
                              defaultValue: `Where ${field.label} comes from`,
                            })}
                            aria-expanded={openKey === field.key}
                          >
                            <InfoIcon active={openKey === field.key} />
                          </button>
                        )}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold text-slate-800 tabular-nums">
                          {display} {field.unit}
                        </span>
                        {pct !== null && (
                          <span className="text-2xs text-slate-500 tabular-nums w-10 text-right">
                            {pct}%
                          </span>
                        )}
                        {pct !== null && (
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${dvColour(pct)}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
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

      <OmegaRatioRow {...omegaRatio(perServing.omega6, perServing.omega3)} className="mt-4" />

      <p className="text-2xs text-slate-400 mt-4 leading-relaxed">
        {t('nutrition.footnote', {
          defaultValue: 'Values are estimates based on standard food composition data. % DV based on a 2000 kcal reference diet.',
        })}
      </p>

      <NutrientBreakdownSheet
        open={Boolean(openKey && sheetView)}
        onClose={handleClose}
        nutrientKey={openKey}
        nutrientLabel={openField
          ? t(`nutrition.fields.${openField.key}`, { defaultValue: openField.label })
          : openKey}
        unit={openField?.unit || ''}
        view={sheetView}
        recipeTitle={recipeTitle || recipe?.title || ''}
        modeLabel={columnLabel}
        dvPct={
          openField?.dv && sheetView
            ? Math.round((sheetView.totalAmount / openField.dv) * 100)
            : null
        }
        currentLang={currentLang}
      />
      {breakdownError && openKey && (
        <p className="text-2xs text-danger-600 mt-2">{String(breakdownError.message || breakdownError)}</p>
      )}
      {openKey && !sheetView && db && !breakdownError && (
        <span className="sr-only">{t('nutrition.breakdownLoading', { defaultValue: 'Loading breakdown…' })}</span>
      )}
    </section>
  )
}

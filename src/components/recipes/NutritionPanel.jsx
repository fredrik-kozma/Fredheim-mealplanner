import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NUTRITION_GROUPS, fmtNutrient, dvColour } from '../../utils/nutritionData'

/**
 * NutritionPanel — renders the recipe's per-serving nutrition with a toggle
 * to switch between Per Serving / Per 100 g / Full recipe (× displayServings).
 *
 * Props:
 *   - recipe:   { nutrition?: { perServing: {...} }, servings: number,
 *                 servingWeightGrams?: number }
 *   - displayServings: number  (the total servings the user has scaled to)
 *
 * Bails out (renders nothing) if the recipe has no nutrition data.
 */
export default function NutritionPanel({ recipe, displayServings }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState('serving') // 'serving' | '100g' | 'full'

  const perServing = recipe?.nutrition?.perServing
  if (!perServing) return null

  const servingWeight = recipe.servingWeightGrams || null
  // Total servings the user wants for this batch (scaled).
  const totalServings = displayServings || recipe.servings || 1

  // Compute multiplier per mode
  let multiplier = 1
  if (mode === '100g') {
    if (!servingWeight || servingWeight <= 0) {
      // Can't compute per-100g without a serving weight; fall back to serving.
      multiplier = 1
    } else {
      multiplier = 100 / servingWeight
    }
  } else if (mode === 'full') {
    multiplier = totalServings
  }

  // What unit label appears at the top of the right column
  let columnLabel = ''
  if (mode === 'serving') columnLabel = t('nutrition.perServing', { defaultValue: 'Per serving' })
  else if (mode === '100g') columnLabel = t('nutrition.per100g', { defaultValue: 'Per 100 g' })
  else columnLabel = t('nutrition.fullRecipeWithCount', { count: totalServings, defaultValue: `Full recipe (${totalServings} servings)` })

  const canShow100g = Boolean(servingWeight && servingWeight > 0)

  return (
    <section className="card p-5 mt-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <span className="text-lg">🥗</span>
          {t('nutrition.title', { defaultValue: 'Nutrition' })}
        </h2>
        <div className="inline-flex bg-slate-100 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setMode('serving')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mode === 'serving' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('nutrition.perServingShort', { defaultValue: 'Per serving' })}
          </button>
          {canShow100g && (
            <button
              onClick={() => setMode('100g')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                mode === '100g' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('nutrition.per100gShort', { defaultValue: 'Per 100 g' })}
            </button>
          )}
          <button
            onClick={() => setMode('full')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              mode === 'full' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('nutrition.fullRecipeShort', { defaultValue: 'Full recipe' })}
          </button>
        </div>
      </div>

      {/* Sub-label showing current view + reference weight */}
      <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500">
        <span>{columnLabel}</span>
        {mode === 'serving' && servingWeight && (
          <span className="text-slate-400">≈ {servingWeight} g</span>
        )}
        {mode === '100g' && !canShow100g && (
          <span className="text-amber-600">{t('nutrition.no100gAvail', { defaultValue: 'Serving weight not set' })}</span>
        )}
        {mode === 'full' && servingWeight && (
          <span className="text-slate-400">≈ {Math.round(servingWeight * totalServings)} g</span>
        )}
      </div>

      {/* Nutrient groups */}
      <div className="space-y-5">
        {NUTRITION_GROUPS.map(group => {
          // Skip groups where every value is null/0 (e.g. user-created recipes
          // with empty nutrition)
          const anyValue = group.fields.some(f => {
            const v = perServing[f.key]
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
                  const rawValue = perServing[field.key]
                  if (rawValue === null || rawValue === undefined) return null
                  const scaled = rawValue * multiplier
                  const display = fmtNutrient(scaled)
                  // Show %DV against per-serving reference (only meaningful per serving).
                  let pct = null
                  if (mode === 'serving' && field.dv) {
                    pct = Math.round((rawValue / field.dv) * 100)
                  } else if (mode === 'full' && field.dv) {
                    pct = Math.round((scaled / field.dv) * 100)
                  }
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
                          {display} {field.unit}
                        </span>
                        {pct !== null && (
                          <span className="text-[10px] text-slate-500 tabular-nums w-10 text-right">
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

      {/* Footnote */}
      <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
        {t('nutrition.footnote', {
          defaultValue: 'Values are estimates based on standard food composition data. % DV based on a 2000 kcal reference diet.',
        })}
      </p>
    </section>
  )
}

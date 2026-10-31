/**
 * Compact live nutrition strip for the recipe form.
 */
import { useTranslation } from 'react-i18next'

function cell(label, value, unit) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-800 tabular-nums">
        {value == null || Number.isNaN(value) ? '—' : value}
        {unit ? <span className="text-xs font-normal text-slate-500"> {unit}</span> : null}
      </div>
    </div>
  )
}

export default function FormNutritionPreview({
  loading,
  perServing,
  omegaRatio,
  warnings = [],
  saltLevel = 'low',
  onSaltLevelChange,
  showSaltSwitch = false,
}) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="card p-4 text-sm text-slate-500">
        {t('recipeForm.nutritionLoading')}
      </div>
    )
  }

  if (!perServing) return null

  const ratioLabel =
    omegaRatio == null
      ? '—'
      : omegaRatio === Infinity
        ? t('recipeForm.omegaRatioNone')
        : `${omegaRatio}:1`

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-800">
          {t('recipeForm.nutritionPreview')}
        </h3>
        {showSaltSwitch && (
          <div className="inline-flex bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium ${
                saltLevel === 'low' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
              onClick={() => onSaltLevelChange?.('low')}
            >
              {t('recipeForm.saltLow')}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium ${
                saltLevel === 'standard' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
              }`}
              onClick={() => onSaltLevelChange?.('standard')}
            >
              {t('recipeForm.saltStandard')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {cell(t('recipeForm.nutKcal'), Math.round(perServing.calories || 0), 'kcal')}
        {cell(t('recipeForm.nutProtein'), perServing.protein, 'g')}
        {cell(t('recipeForm.nutFiber'), perServing.fiber, 'g')}
        {cell(t('recipeForm.nutSodium'), Math.round(perServing.sodium || 0), 'mg')}
        {cell(t('recipeForm.nutOmegaRatio'), ratioLabel, '')}
      </div>

      <p className="text-[11px] text-slate-500">{t('recipeForm.nutritionPerServing')}</p>

      {warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-900">
          <div className="font-medium mb-1">{t('recipeForm.nutritionWarningsTitle')}</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {warnings.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
            {warnings.length > 8 && (
              <li>{t('recipeForm.nutritionWarningsMore', { count: warnings.length - 8 })}</li>
            )}
          </ul>
        </div>
      )}
    </section>
  )
}

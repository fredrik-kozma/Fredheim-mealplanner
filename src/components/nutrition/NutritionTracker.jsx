import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'
import RecipePicker from '../planner/RecipePicker'
import NutritionCoverage from './NutritionCoverage'
import { sumNutrition, scaleNutrition } from '../../utils/nutritionData'

// ── Local-date helpers ───────────────────────────────────────────────────
// Keys are 'YYYY-MM-DD' in the user's own timezone, so "today" matches the
// wall calendar rather than UTC.
function dateKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function addDays(d, n) {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}
// Monday as the first day, matching the planner's week.
function startOfWeek(d) {
  const out = new Date(d)
  const dow = (out.getDay() + 6) % 7 // 0 = Monday
  out.setDate(out.getDate() - dow)
  out.setHours(0, 0, 0, 0)
  return out
}

// A single logged meal: recipe title, portions stepper (half-serving steps),
// and remove.
function LogRow({ dateK, entry, recipe, currentLang }) {
  const { t } = useTranslation()
  const setNutritionPortions = useStore(s => s.setNutritionPortions)
  const removeNutritionEntry = useStore(s => s.removeNutritionEntry)
  const title = recipe.translations?.[currentLang]?.title || recipe.title
  const p = entry.portions
  // Some recipes (older packs, user-created) carry no nutrition. Logging one
  // is allowed, but flag it so an empty coverage panel doesn't read as a bug.
  const hasNutrition = Boolean(
    recipe.nutrition?.perServing && Object.keys(recipe.nutrition.perServing).length
  )

  return (
    <div className="flex items-center gap-2.5 py-2.5">
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">🍽</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-slate-400">
          {t('nutritionTracker.portionsEaten', { count: p, defaultValue: '{{count}} portion(s)' })}
          {!hasNutrition && (
            <span className="text-amber-500"> · {t('nutritionTracker.noNutritionData', { defaultValue: 'no nutrition data' })}</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setNutritionPortions(dateK, entry.id, p - 0.5)}
          disabled={p <= 0.5}
          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center justify-center"
          aria-label={t('nutritionTracker.less', { defaultValue: 'Less' })}
        >
          −
        </button>
        <span className="w-8 text-center text-xs font-semibold text-slate-700 tabular-nums">{p}</span>
        <button
          onClick={() => setNutritionPortions(dateK, entry.id, p + 0.5)}
          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center"
          aria-label={t('nutritionTracker.more', { defaultValue: 'More' })}
        >
          +
        </button>
        <button
          onClick={() => removeNutritionEntry(dateK, entry.id)}
          className="ml-1 text-slate-300 hover:text-red-500 transition-colors"
          aria-label={t('common.remove')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function NutritionTracker() {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const recipes = useStore(s => s.recipes)
  const nutritionLog = useStore(s => s.nutritionLog) || {}
  const addNutritionEntry = useStore(s => s.addNutritionEntry)

  const recipeMap = useMemo(() => Object.fromEntries(recipes.map(r => [r.id, r])), [recipes])

  const [selected, setSelected] = useState(() => new Date())
  const [view, setView] = useState('day') // 'day' | 'week'
  const [pickerOpen, setPickerOpen] = useState(false)

  const selKey = dateKey(selected)
  const todayKey = dateKey(new Date())
  const isToday = selKey === todayKey

  // Localized date label for the current selection.
  const dateLabel = useMemo(() => {
    const locale = { en: 'en-GB', no: 'nb-NO', sv: 'sv-SE' }[currentLang] || undefined
    return selected.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  }, [selected, currentLang])

  const dayEntries = nutritionLog[selKey] || []
  const dayTotals = useMemo(() => sumNutrition(dayEntries, recipeMap), [dayEntries, recipeMap])

  // Week (Mon–Sun) containing the selection.
  const weekDays = useMemo(() => {
    const mon = startOfWeek(selected)
    return Array.from({ length: 7 }, (_, i) => dateKey(addDays(mon, i)))
  }, [selected])

  // Weekly totals and the per-day daily-average (Σ week ÷ 7) — the average is
  // what we compare to daily targets, matching "balanced across the week".
  const weekAvgTotals = useMemo(() => {
    const allEntries = weekDays.flatMap(k => nutritionLog[k] || [])
    return scaleNutrition(sumNutrition(allEntries, recipeMap), 1 / 7)
  }, [weekDays, nutritionLog, recipeMap])

  // Per-day calorie strip for the week bar chart.
  const weekCalories = useMemo(() => weekDays.map(k => {
    const totals = sumNutrition(nutritionLog[k] || [], recipeMap)
    return { key: k, kcal: Math.round(totals.calories || 0) }
  }), [weekDays, nutritionLog, recipeMap])
  const maxKcal = Math.max(1, ...weekCalories.map(d => d.kcal))
  const dayShortLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 lg:pb-8 w-full">
      {/* Date navigation + Today */}
      <div className="flex items-center justify-between gap-2 pt-3 pb-3">
        <button
          onClick={() => setSelected(addDays(selected, -1))}
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"
          aria-label={t('nutritionTracker.prevDay', { defaultValue: 'Previous day' })}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-slate-800">{isToday ? t('nutritionTracker.today', { defaultValue: 'Today' }) : dateLabel}</p>
          {!isToday && (
            <button onClick={() => setSelected(new Date())} className="text-[11px] text-emerald-600 font-medium hover:underline">
              {t('nutritionTracker.jumpToday', { defaultValue: 'Jump to today' })}
            </button>
          )}
        </div>
        <button
          onClick={() => setSelected(addDays(selected, 1))}
          disabled={isToday}
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center text-slate-600"
          aria-label={t('nutritionTracker.nextDay', { defaultValue: 'Next day' })}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {/* Day / Week toggle */}
      <div className="inline-flex w-full bg-slate-100 rounded-xl p-0.5 text-sm mb-4">
        <button
          onClick={() => setView('day')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${view === 'day' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
          {t('nutritionTracker.dayView', { defaultValue: 'Day' })}
        </button>
        <button
          onClick={() => setView('week')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${view === 'week' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
        >
          {t('nutritionTracker.weekView', { defaultValue: 'Week' })}
        </button>
      </div>

      {view === 'day' ? (
        <>
          {/* Logged meals for the day */}
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-800">{t('nutritionTracker.mealsEaten', { defaultValue: 'What you ate' })}</h2>
              <button
                onClick={() => setPickerOpen(true)}
                className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {t('nutritionTracker.addFood', { defaultValue: 'Add food' })}
              </button>
            </div>
            {dayEntries.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                {t('nutritionTracker.noMeals', { defaultValue: 'No meals logged for this day yet.' })}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {dayEntries.map(entry => {
                  const recipe = recipeMap[entry.recipeId]
                  if (!recipe) return null
                  return <LogRow key={entry.id} dateK={selKey} entry={entry} recipe={recipe} currentLang={currentLang} />
                })}
              </div>
            )}
          </div>

          {/* Coverage */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <span className="text-lg">🥗</span>
              {t('nutritionTracker.dailyCoverage', { defaultValue: "Today's coverage" })}
            </h2>
            <NutritionCoverage totals={dayTotals} />
          </div>
        </>
      ) : (
        <>
          {/* Weekly calorie strip */}
          <div className="card p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">{t('nutritionTracker.weekCalories', { defaultValue: 'Calories across the week' })}</h2>
            <div className="flex items-end justify-between gap-2 h-28">
              {weekCalories.map((d, i) => {
                const isSel = d.key === selKey
                return (
                  <button
                    key={d.key}
                    onClick={() => setSelected(parseKey(d.key))}
                    className="flex-1 flex flex-col items-center gap-1 group"
                    title={`${d.kcal} kcal`}
                  >
                    <span className="text-[9px] text-slate-400 tabular-nums">{d.kcal || ''}</span>
                    <div className="w-full flex items-end justify-center h-16">
                      <div
                        className={`w-full max-w-[26px] rounded-t-md transition-all ${isSel ? 'bg-emerald-500' : 'bg-emerald-200 group-hover:bg-emerald-300'}`}
                        style={{ height: `${Math.max(4, (d.kcal / maxKcal) * 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isSel ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {t(`planner.daysShort.${dayShortLabels[i]}`, { defaultValue: dayShortLabels[i] })}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Weekly average coverage */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-1">
              <span className="text-lg">📊</span>
              {t('nutritionTracker.weeklyCoverage', { defaultValue: 'Weekly average' })}
            </h2>
            <NutritionCoverage
              totals={weekAvgTotals}
              label={t('nutritionTracker.weeklyAvgLabel', { defaultValue: 'Average per day across this week (Mon–Sun)' })}
            />
          </div>
        </>
      )}

      {/* Balanced-diet disclaimer — the whole point of the weekly view */}
      <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
        <p className="text-xs text-emerald-900 leading-relaxed">
          <span className="font-semibold">💚 {t('nutritionTracker.balanceTitle', { defaultValue: 'Aim for balance, not perfection.' })}</span>{' '}
          {t('nutritionTracker.balanceBody', {
            defaultValue: "You don't need to hit 100% of every nutrient every single day — some days run higher, others lower. What matters is that things even out across the week. These figures are estimates from standard food data, not medical advice.",
          })}
        </p>
      </div>

      {pickerOpen && (
        <RecipePicker
          title={t('nutritionTracker.pickTitle', { defaultValue: 'Log a food you ate' })}
          onSelect={(recipeId) => addNutritionEntry(selKey, recipeId, 1)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useStore, { DAYS } from '../../store/useStore'
import { ALLERGENS } from '../../data/allergens'
import { BUILT_IN_PACKS } from '../../data/installedPacks'
import {
  makeMyWeek, defaultAnswers, resolveSlotNames, answerGoals, saltLevelFor,
  MMW_GOALS, MMW_TIMES, MMW_MEALS, MMW_BREAKFASTS, EXCLUSIVE_GOALS,
  MMW_KCAL_PICKS, KCAL_MIN, KCAL_MAX,normalizeKcal,
} from '../../utils/makeMyWeek'
import { SALT_LEVELS, LOW_SALT_GOALS } from '../../utils/saltLevel'
import { noticeText as renderNotice, statsText as renderStats, weekTipsData, renderWeekTips } from '../../utils/weekTips'
import { formatAmount } from '../../utils/formatQuantity'
import { dayOmega, weekOmega, planDayMeals, formatOmegaRatio } from '../../utils/omegaBalance'
import OmegaRatioRow from '../nutrition/OmegaRatioRow'

const GOAL_ICONS = { general: '🥗', weight: '⚖️', bloodPressure: '💗', diabetes: '🩸', heart: '❤️', fmd: '🌙' }
const MEAL_ICONS = { 3: '🍳🥣🍲', 2: '🍳🥣', 1: '🍲' }
const TIME_ICONS = { quick: '⚡', medium: '⏱️', any: '🧑‍🍳' }
const BREAKFAST_ICONS = { both: '🍳🥣', savoury: '🍳', sweet: '🥣' }

// The answers from the last time the modal was used this session, so a
// Shuffle-and-tweak round doesn't start the questions from scratch. People,
// allergens, honey, favourites and dislikes are always read fresh from
// settings instead, and so are the calorie target and meals a day (saved
// when a week is used). A single `goal` (from before goals were multiple
// choice) is read as a list of one.
let lastAnswers = null
const REMEMBERED = ['time', 'batch', 'meals', 'kcal', 'breakfast', 'preferFavourites', 'fewerIngredients', 'saltLevel']
function remembered(last) {
  if (!last) return {}
  const out = { goals: answerGoals(last) }
  for (const k of REMEMBERED) if (last[k] !== undefined) out[k] = last[k]
  return out
}

// A switch row: label left, on/off right.
function Toggle({ on, onClick, icon, title, hint }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className="w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-left hover:border-indigo-300 transition-colors"
    >
      {icon && <span className="text-xl flex-shrink-0" aria-hidden>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
      </span>
      <span className={`flex-shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-300'}`} aria-hidden>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  )
}

// A row of chips with one chosen.
function Segmented({ value, options, onChange }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`min-h-[44px] px-2 py-2 rounded-xl border text-sm font-medium transition-colors ${
            value === o.value
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
              : 'border-slate-200 text-slate-600 hover:border-indigo-300'
          }`}
        >
          {o.icon && <span className="mr-1" aria-hidden>{o.icon}</span>}{o.label}
        </button>
      ))}
    </div>
  )
}

function Choice({ selected, onClick, icon, title, hint }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[48px] flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
        selected
          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
      }`}
    >
      {icon && <span className="text-xl flex-shrink-0" aria-hidden>{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
      </span>
    </button>
  )
}

export default function MakeMyWeekModal({ onClose }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.slice(0, 2) || 'en'
  const recipes = useStore(s => s.recipes)
  const installedPacks = useStore(s => s.installedPacks)
  const familySize = useStore(s => s.familySize)
  const avoidedAllergens = useStore(s => s.avoidedAllergens) || []
  const avoidHoney = useStore(s => s.avoidHoney)
  const mealSlots = useStore(s => s.mealSlots)
  const weekPlan = useStore(s => s.weekPlan)
  const batchCook = useStore(s => s.batchCook) || []
  const installStarterPlan = useStore(s => s.installStarterPlan)
  const installPack = useStore(s => s.installPack)
  const setFamilySize = useStore(s => s.setFamilySize)
  const toggleAvoidedAllergen = useStore(s => s.toggleAvoidedAllergen)
  const setAvoidHoney = useStore(s => s.setAvoidHoney)
  const saltLevel = useStore(s => s.saltLevel)
  const setSaltLevel = useStore(s => s.setSaltLevel)
  const favourites = useStore(s => s.favoriteRecipes) || []
  const disliked = useStore(s => s.dislikedRecipes) || []
  const planKcalTarget = useStore(s => s.planKcalTarget)
  const planMeals = useStore(s => s.planMeals)
  const setPlanPreferences = useStore(s => s.setPlanPreferences)

  const [answers, setAnswers] = useState(() => ({
    ...defaultAnswers({
      familySize, avoidedAllergens, avoidHoney, saltLevel, favourites, disliked,
      kcal: planKcalTarget, meals: planMeals,
    }),
    ...remembered(lastAnswers),
  }))
  // The typed calorie target, while it is being typed (a quick pick clears it).
  const [kcalText, setKcalText] = useState(() =>
    (answers.kcal && !MMW_KCAL_PICKS.includes(answers.kcal) ? String(answers.kcal) : ''))
  const kcalTextInvalid = kcalText.trim() !== '' && normalizeKcal(kcalText) == null
  const numberLocale = lang === 'no' ? 'nb-NO' : lang === 'sv' ? 'sv-SE' : 'en-GB'
  const fmtKcal = n => new Intl.NumberFormat(numberLocale).format(n)
  const goals = answerGoals(answers)
  const isFmd = goals.includes('fmd')
  // Blood pressure, heart and diabetes: low salt without asking.
  const saltAuto = goals.some(g => LOW_SALT_GOALS.includes(g))
  const [step, setStep] = useState(0)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // FMD is a fixed plan with its own fixed energy: time, batch, meals,
  // calorie target and preferences don't apply to it.
  const steps = isFmd
    ? ['goal', 'people', 'avoid']
    : ['goal', 'people', 'avoid', 'time', 'batch', 'meals', 'kcal', 'prefs']
  const showResult = step >= steps.length
  const slotNames = useMemo(() => resolveSlotNames(mealSlots), [mealSlots])

  const result = useMemo(() => (showResult
    ? makeMyWeek({ recipes, answers, seed, installedPackIds: Object.keys(installedPacks || {}), slotNames })
    : null), [showResult, recipes, answers, seed, installedPacks, slotNames])

  // Titles for the preview — from the store, or the bundled packs for an
  // FMD week whose pack isn't installed yet.
  const recipeById = useMemo(() => {
    const m = new Map()
    for (const p of Object.values(BUILT_IN_PACKS)) for (const r of p.recipes) m.set(r.id, r)
    for (const r of recipes) m.set(r.id, r)
    return m
  }, [recipes])
  const titleOf = id => {
    const r = recipeById.get(id)
    return r ? (r.translations?.[lang]?.title || r.title) : id
  }

  const set = (key, value) => setAnswers(a => ({ ...a, [key]: value }))
  const choose = (key, value) => { set(key, value); setStep(s => s + 1) }
  const goalLabel = g => t(`makeMyWeek.goals.${g}`)
  // Several health goals combine; "everyday" and FMD stand alone. None
  // chosen means everyday food.
  const goalSelected = g => (g === 'general' ? goals.length === 0 : goals.includes(g))
  function toggleGoal(g) {
    setAnswers(a => {
      const now = answerGoals(a)
      let next
      if (EXCLUSIVE_GOALS.includes(g)) next = g === 'general' ? [] : [g]
      else next = now.includes(g) ? now.filter(x => x !== g) : [...now.filter(x => !EXCLUSIVE_GOALS.includes(x)), g]
      const { goal: _legacy, ...rest } = a
      return { ...rest, goals: next }
    })
  }
  const weekGoalLabel = list => (list.length ? list.map(goalLabel).join(' + ') : goalLabel('general'))
  const packName = id => {
    const p = BUILT_IN_PACKS[id]
    return p?.translations?.[lang]?.name || p?.name || id
  }

  const helpers = { t, titleOf, packName }
  const noticeText = n => renderNotice(n, helpers, result?.stats)
  const statsText = renderStats(result?.stats, helpers)

  // Portions per person for a planned item, as a kitchen fraction: "1 ½".
  const portionsText = it => (it.servings == null ? null : formatAmount(it.servings / answers.people, ''))
  const extraKeys = new Set((result?.extras || []).map(x => `${x.day}|${x.slot}|${x.recipeId}`))

  function handleUse() {
    if (!result) return
    const hasWeek = batchCook.length > 0 || Object.values(weekPlan || {}).some(day =>
      Object.values(day || {}).some(items => items?.length))
    if (hasWeek && !confirm(t('makeMyWeek.replaceConfirm'))) return
    // The answers become settings: household size, allergies and honey.
    setFamilySize(answers.people)
    for (const a of ALLERGENS) {
      if (answers.avoid.includes(a.id) !== avoidedAllergens.includes(a.id)) toggleAvoidedAllergen(a.id)
    }
    setAvoidHoney(answers.noHoney)
    if (result.kind === 'week') {
      setSaltLevel(result.saltLevel)
      setPlanPreferences({ kcal: answers.kcal, meals: answers.meals })
    }
    if (result.kind === 'fmd') {
      for (const packId of result.starterPlan.requiredPackIds || []) {
        if (!installedPacks?.[packId] && BUILT_IN_PACKS[packId]) installPack(BUILT_IN_PACKS[packId])
      }
      installStarterPlan(result.starterPlan, lang)
    } else {
      // The Smart tips travel as text plus the data behind it, so they
      // follow a later language switch (LocalizedWeekTips).
      const data = weekTipsData({ goals: result.goals, notices: result.notices, stats: result.stats, fruit: result.fruit })
      const rendered = renderWeekTips(data, helpers)
      installStarterPlan({
        name: t('makeMyWeek.weekName', { goal: weekGoalLabel(result.goals) }),
        notes: { ...rendered, tips: { data, rendered } },
        plan: result.plan,
        batchCook: result.batchCook,
        portions: result.portions,
      }, lang)
    }
    lastAnswers = answers
    onClose()
  }

  // ── Preview of the week ──
  const previewPlan = result?.kind === 'fmd' ? result.starterPlan.plan : result?.plan
  const previewDays = previewPlan
    ? DAYS.filter(d => Object.values(previewPlan[d] || {}).some(list => list.length))
    : []
  // Omega-6 : omega-3 of each previewed day and of the week, per person.
  const previewOmega = Object.fromEntries(previewDays.map(day => [
    day,
    dayOmega(planDayMeals(previewPlan[day], id => recipeById.get(id), answers.people)),
  ]))
  const previewOmegaWeek = weekOmega(Object.values(previewOmega))

  const stepName = steps[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mmw-title"
        className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl sheet-max-h pb-[env(safe-area-inset-bottom)] flex flex-col shadow-2xl"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
          {step > 0 && (
            <button
              onClick={() => setStep(s => Math.max(0, Math.min(s, steps.length) - 1))}
              className="btn-ghost w-10 h-10 -ml-2 flex items-center justify-center text-slate-500"
              aria-label={t('makeMyWeek.back')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 id="mmw-title" className="text-base font-semibold text-slate-800">
              {showResult ? t('makeMyWeek.resultTitle') : t('makeMyWeek.title')}
            </h2>
            {!showResult && (
              <p className="text-xs text-slate-500">{t('makeMyWeek.stepOf', { n: step + 1, total: steps.length })}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn-ghost w-10 h-10 -mr-2 flex items-center justify-center text-slate-400"
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        {!showResult && (
          <div className="flex gap-1 px-5 pt-3" aria-hidden>
            {steps.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain p-5">
          {stepName === 'goal' && (
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-800">{t('makeMyWeek.q.goal')}</p>
              <p className="text-xs text-slate-500 mb-3">{t('makeMyWeek.goalsHint')}</p>
              {MMW_GOALS.map(g => (
                <Choice
                  key={g}
                  selected={goalSelected(g)}
                  onClick={() => toggleGoal(g)}
                  icon={GOAL_ICONS[g]}
                  title={goalLabel(g)}
                  hint={t(`makeMyWeek.goalHints.${g}`)}
                />
              ))}
            </div>
          )}

          {stepName === 'prefs' && (
            <div className="space-y-5">
              <p className="text-base font-semibold text-slate-800">{t('makeMyWeek.q.prefs')}</p>

              {(answers.meals !== 1 || answers.batch) && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">{t('makeMyWeek.q.breakfast')}</p>
                  <Segmented
                    value={answers.breakfast}
                    onChange={v => set('breakfast', v)}
                    options={MMW_BREAKFASTS.map(v => ({ value: v, icon: BREAKFAST_ICONS[v], label: t(`makeMyWeek.breakfasts.${v}`) }))}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">{t('makeMyWeek.breakfastHint')}</p>
                </div>
              )}

              <div className="space-y-2">
                <Toggle
                  on={answers.preferFavourites}
                  onClick={() => set('preferFavourites', !answers.preferFavourites)}
                  icon="♥"
                  title={t('makeMyWeek.preferFavourites')}
                  hint={favourites.length
                    ? t('makeMyWeek.preferFavouritesHint', { count: favourites.length })
                    : t('makeMyWeek.noFavouritesYet')}
                />
                <Toggle
                  on={answers.fewerIngredients}
                  onClick={() => set('fewerIngredients', !answers.fewerIngredients)}
                  icon="🛒"
                  title={t('makeMyWeek.fewerIngredients')}
                  hint={t('makeMyWeek.fewerIngredientsHint')}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">{t('makeMyWeek.q.salt')}</p>
                {saltAuto ? (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">💗 {t('makeMyWeek.saltAuto')}</p>
                ) : (
                  <div className="space-y-2">
                    {SALT_LEVELS.map(level => (
                      <Choice
                        key={level}
                        selected={saltLevelFor(answers) === level}
                        onClick={() => set('saltLevel', level)}
                        icon={level === 'standard' ? '🧂' : '💗'}
                        title={t(`salt.${level}`)}
                      />
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">💡 {t('salt.tip')}</p>
              </div>
            </div>
          )}

          {stepName === 'people' && (
            <div>
              <p className="text-base font-semibold text-slate-800">{t('makeMyWeek.q.people')}</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">{t('makeMyWeek.peopleHint')}</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <button
                    key={n}
                    onClick={() => choose('people', n)}
                    aria-pressed={answers.people === n}
                    className={`h-12 rounded-xl border text-base font-semibold tabular-nums transition-colors ${
                      answers.people === n
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                        : 'border-slate-200 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stepName === 'avoid' && (
            <div>
              <p className="text-base font-semibold text-slate-800">{t('makeMyWeek.q.avoid')}</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">{t('makeMyWeek.avoidHint')}</p>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map(a => {
                  const on = answers.avoid.includes(a.id)
                  return (
                    <button
                      key={a.id}
                      onClick={() => set('avoid', on ? answers.avoid.filter(x => x !== a.id) : [...answers.avoid, a.id])}
                      aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-medium border transition-colors ${
                        on ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                      }`}
                    >
                      <span aria-hidden>{on ? '✓' : a.icon}</span>
                      {t(`allergens.${a.id}`, { defaultValue: a.id })}
                    </button>
                  )
                })}
                <button
                  onClick={() => set('noHoney', !answers.noHoney)}
                  aria-pressed={answers.noHoney}
                  className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-medium border transition-colors ${
                    answers.noHoney ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                  }`}
                >
                  <span aria-hidden>{answers.noHoney ? '✓' : '🍯'}</span>
                  {t('makeMyWeek.noHoney')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                {t('settings.allergensWarning')}
              </p>
            </div>
          )}

          {stepName === 'time' && (
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-800">{t('makeMyWeek.q.time')}</p>
              <p className="text-xs text-slate-500 mb-3">{t('makeMyWeek.timeHint')}</p>
              {MMW_TIMES.map(v => (
                <Choice key={v} selected={answers.time === v} onClick={() => choose('time', v)} icon={TIME_ICONS[v]} title={t(`makeMyWeek.times.${v}`)} />
              ))}
            </div>
          )}

          {stepName === 'batch' && (
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-800 mb-3">{t('makeMyWeek.q.batch')}</p>
              <Choice selected={answers.batch} onClick={() => choose('batch', true)} icon="🍲" title={t('makeMyWeek.batchYes')} hint={t('makeMyWeek.batchYesHint')} />
              <Choice selected={!answers.batch} onClick={() => choose('batch', false)} icon="🍳" title={t('makeMyWeek.batchNo')} />
            </div>
          )}

          {stepName === 'meals' && (
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-800 mb-3">{t('makeMyWeek.q.meals')}</p>
              {MMW_MEALS.map(m => (
                <Choice
                  key={m}
                  selected={answers.meals === m}
                  onClick={() => choose('meals', m)}
                  icon={MEAL_ICONS[m]}
                  title={t(`makeMyWeek.meals.${m}`)}
                />
              ))}
            </div>
          )}

          {stepName === 'kcal' && (
            <div className="space-y-2">
              <p className="text-base font-semibold text-slate-800">{t('makeMyWeek.q.kcal')}</p>
              <p className="text-xs text-slate-500 mb-3">
                {t(answers.meals === 1 ? 'makeMyWeek.kcalHintDinner' : 'makeMyWeek.kcalHint')}
              </p>
              <Choice
                selected={answers.kcal == null && !kcalText}
                onClick={() => { setKcalText(''); choose('kcal', null) }}
                icon="🍽️"
                title={t('makeMyWeek.kcalNone')}
                hint={t('makeMyWeek.kcalNoneHint')}
              />
              <div className="grid grid-cols-2 gap-2">
                {MMW_KCAL_PICKS.map(v => (
                  <button
                    key={v}
                    onClick={() => { setKcalText(''); choose('kcal', v) }}
                    aria-pressed={answers.kcal === v && !kcalText}
                    className={`min-h-[48px] rounded-xl border text-sm font-semibold tabular-nums transition-colors ${
                      answers.kcal === v && !kcalText
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500'
                        : 'border-slate-200 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {t('makeMyWeek.kcalValue', { kcal: fmtKcal(v) })}
                  </button>
                ))}
              </div>
              <label className="block pt-2">
                <span className="block text-sm font-semibold text-slate-700 mb-1">{t('makeMyWeek.kcalCustom')}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={KCAL_MIN}
                    max={KCAL_MAX}
                    step={50}
                    value={kcalText}
                    onChange={e => {
                      const text = e.target.value
                      setKcalText(text)
                      const n = normalizeKcal(text)
                      if (n != null) set('kcal', n)
                      else if (text.trim() === '') set('kcal', null)
                    }}
                    placeholder="1700"
                    aria-invalid={kcalTextInvalid}
                    className={`input w-32 tabular-nums ${kcalTextInvalid ? 'border-red-400' : ''}`}
                  />
                  <span className="text-sm text-slate-500">{t('makeMyWeek.kcalPerDay')}</span>
                </span>
                {kcalTextInvalid && (
                  <span className="block text-xs text-red-600 mt-1">
                    {t('makeMyWeek.kcalRange', { min: fmtKcal(KCAL_MIN), max: fmtKcal(KCAL_MAX) })}
                  </span>
                )}
              </label>
            </div>
          )}

          {['goal', 'avoid', 'prefs', 'kcal'].includes(stepName) && (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={stepName === 'kcal' && kcalTextInvalid}
              className="btn-primary w-full min-h-[44px] mt-6"
            >
              {t('makeMyWeek.next')}
            </button>
          )}

          {showResult && result && (
            <div className="space-y-4">
              {result.kind === 'fmd' && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {result.starterPlan.translations?.[lang]?.description || result.starterPlan.description}
                </p>
              )}

              {(result.notices.length > 0 || statsText) && (
                <ul className="space-y-1.5">
                  {result.notices.map((n, i) => (
                    <li key={i} className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
                      {noticeText(n)}
                    </li>
                  ))}
                  {statsText && (
                    <li className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">📊 {statsText}</li>
                  )}
                  {result.kind === 'week' && result.uniqueIngredients > 0 && (
                    <li className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
                      🛒 {t('makeMyWeek.uniqueIngredients', { count: result.uniqueIngredients })}
                    </li>
                  )}
                </ul>
              )}

              {result.kind === 'week' && result.batchCook.length > 0 && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 px-3 py-2.5">
                  <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wide mb-1">
                    🍲 {t('makeMyWeek.batchTitle')}
                  </p>
                  <ul className="text-sm text-slate-700 space-y-0.5">
                    {result.batchCook.map(b => (
                      <li key={b.id}>
                        {titleOf(b.recipeId)}{' '}
                        <span className="text-xs text-slate-500">· {t('makeMyWeek.servings', { count: b.servings })}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {previewDays.length > 0 && (
                <OmegaRatioRow
                  ratio={previewOmegaWeek?.ratio}
                  favourable={previewOmegaWeek?.favourable}
                  incomplete={!previewOmegaWeek}
                  note={previewOmegaWeek && previewOmegaWeek.complete < previewOmegaWeek.days
                    ? t('nutrition.omega63Days', { n: previewOmegaWeek.complete, total: previewOmegaWeek.days })
                    : null}
                />
              )}

              <div className="space-y-2">
                {result.kind === 'week' && result.stats && (
                  <p className="text-[11px] text-slate-500 leading-relaxed">{t('makeMyWeek.estimateNote')}</p>
                )}
                {previewDays.map(day => (
                  <div key={day} className="rounded-xl border border-slate-100 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {t(`planner.days.${day}`)}
                      </p>
                      {result.stats?.perDay?.[day] && (
                        <p className="text-[11px] text-slate-400 tabular-nums">
                          {t('makeMyWeek.dayStats', result.stats.perDay[day])}
                          {previewOmega[day]?.complete && (
                            <span className={`ml-1.5 font-medium whitespace-nowrap ${previewOmega[day].favourable ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {t('nutrition.omega63Short', { ratio: formatOmegaRatio(previewOmega[day].ratio) })}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    {Object.entries(previewPlan[day]).filter(([, list]) => list.length).map(([slot, list]) => (
                      <p key={slot} className="text-sm text-slate-700 leading-snug py-0.5">
                        <span className="text-slate-400">{t(`planner.mealSlots.${slot}`, { defaultValue: slot })}: </span>
                        {list.map((it, i) => (
                          <span key={`${it.recipeId}-${i}`}>
                            {i > 0 && ' + '}
                            {titleOf(it.recipeId)}
                            {result.kind === 'week' && portionsText(it) && (
                              <span className="ml-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 rounded px-1 py-0.5 tabular-nums">
                                {t('makeMyWeek.portionsEach', { n: portionsText(it) })}
                              </span>
                            )}
                            {extraKeys.has(`${day}|${slot}|${it.recipeId}`) && (
                              <span className="ml-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded px-1 py-0.5">
                                + {t('makeMyWeek.extra')}
                              </span>
                            )}
                            {it.excludeFromShopping && (
                              <span className="ml-1 text-[10px] font-medium text-cyan-700 bg-cyan-50 rounded px-1 py-0.5">
                                🍲 {t('makeMyWeek.covered')}
                              </span>
                            )}
                          </span>
                        ))}
                        {result.kind === 'week' && result.stats?.perMeal?.[day]?.[slot] != null && (
                          <span className="ml-1.5 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                            {t('makeMyWeek.mealKcal', { kcal: result.stats.perMeal[day][slot] })}
                          </span>
                        )}
                      </p>
                    ))}
                    {result.kind === 'week' && result.fruit?.[day] > 0 && (
                      <p className="text-sm text-slate-700 leading-snug py-0.5">
                        🍎 {t(result.stats?.fitted && result.stats.meals !== 1 ? 'makeMyWeek.dayFruitMeals' : 'makeMyWeek.dayFruit', { count: result.fruit[day] })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showResult && result && (
          <div className="border-t border-slate-100 px-5 py-3 flex flex-wrap gap-2">
            <button onClick={() => setStep(0)} className="btn-ghost min-h-[44px] px-3 text-sm text-slate-500">
              {t('makeMyWeek.changeAnswers')}
            </button>
            <div className="flex-1" />
            {result.kind === 'week' && (
              <button onClick={() => setSeed(s => (s * 7 + 13) % 1e9 + 1)} className="btn-secondary min-h-[44px] px-4 inline-flex items-center gap-1.5">
                <span aria-hidden>🔀</span>
                {t('makeMyWeek.shuffle')}
              </button>
            )}
            <button
              onClick={handleUse}
              disabled={result.kind === 'week' && result.poolSize === 0}
              className="btn-primary min-h-[44px] px-4"
            >
              {t('makeMyWeek.useWeek')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

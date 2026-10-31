import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../store/useStore'
import { formatDuration } from '../utils/formatDuration'
import { formatOmegaRatio } from '../utils/omegaBalance'
import { dayMeals, daySummary, nextDay, weekdayKey } from '../utils/todayPlan'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'

const CLOCK_ICON = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
  </svg>
)

// Prep and cooking together: the one number that says when to start.
const totalTime = recipe => formatDuration((recipe.prepTime || 0) + (recipe.cookTime || 0))

function SlotLabel({ slot, className = '' }) {
  const { t } = useTranslation()
  return (
    <span className={`eyebrow ${className}`}>
      {t(`planner.mealSlots.${slot}`, { defaultValue: slot })}
    </span>
  )
}

function MealCard({ slot, item, recipe, lang, onOpen }) {
  // A meal the user typed in has no recipe to open and no picture.
  if (!recipe) {
    return (
      <div className="card p-4">
        <SlotLabel slot={slot} className="text-slate-500" />
        <p className="mt-1 section-title break-words">{item.name}</p>
        {item.amount && <p className="text-sm text-slate-500 mt-0.5">{item.amount}</p>}
      </div>
    )
  }
  const title = recipe.translations?.[lang]?.title || recipe.title
  const time = totalTime(recipe)
  return (
    <button
      onClick={() => onOpen(item)}
      className="group relative block w-full h-56 sm:h-64 rounded-card overflow-hidden shadow-card text-left bg-gradient-to-br from-primary-100 to-slate-200"
    >
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden>🍽</span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <SlotLabel slot={slot} className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 px-2.5 py-1 rounded-full" />
      <div className="absolute bottom-0 inset-x-0 p-4 text-white">
        <h2 className="text-xl font-bold leading-tight line-clamp-2">{title}</h2>
        {time && (
          <p className="mt-1 text-sm text-white/90 flex items-center gap-1">{CLOCK_ICON}{time}</p>
        )}
      </div>
    </button>
  )
}

function DaySummary({ summary }) {
  const { t, i18n } = useTranslation()
  if (!summary) return null
  const { kcal, kcalComplete, omega } = summary
  const number = kcal.toLocaleString(i18n.language)
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <span className="card !rounded-full px-3 py-1.5 font-semibold text-slate-700 tabular-nums">
        {t('today.kcal', { kcal: kcalComplete ? number : `${number}+` })}
      </span>
      {omega.complete ? (
        <span className={`card !rounded-full px-3 py-1.5 font-semibold tabular-nums ${omega.favourable ? 'text-success-700' : 'text-warning-700'}`}>
          {t('nutrition.omega63Short', { ratio: formatOmegaRatio(omega.ratio) })}
          {omega.favourable ? ' ✓' : ''}
        </span>
      ) : (
        <span
          className="card !rounded-full px-3 py-1.5 font-medium text-slate-500"
          title={t('nutrition.omega63Incomplete')}
        >
          {t('nutrition.omega63Short', { ratio: '–' })}
        </span>
      )}
    </div>
  )
}

function TomorrowPeek({ meals, lang, onOpen }) {
  const { t } = useTranslation()
  if (!meals.length) return null
  return (
    <section className="mt-8">
      <h2 className="eyebrow mb-2">{t('today.tomorrow')}</h2>
      <div className="card divide-y divide-slate-100 overflow-hidden">
        {meals.map(({ slot, item, recipe }, i) => {
          const body = (
            <>
              {recipe?.imageUrl ? (
                <img src={recipe.imageUrl} alt="" className="w-11 h-11 rounded-small object-cover flex-shrink-0" />
              ) : (
                <span className="w-11 h-11 rounded-small bg-slate-100 flex items-center justify-center flex-shrink-0" aria-hidden>
                  {recipe ? '🍽' : '📝'}
                </span>
              )}
              <span className="min-w-0">
                <SlotLabel slot={slot} className="block" />
                <span className="block text-sm font-medium text-slate-800 truncate">
                  {recipe ? recipe.translations?.[lang]?.title || recipe.title : item.name}
                </span>
              </span>
            </>
          )
          return recipe ? (
            <button key={i} onClick={() => onOpen(item)} className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-slate-50 transition-colors focus-visible:-outline-offset-2">
              {body}
            </button>
          ) : (
            <div key={i} className="flex items-center gap-3 p-2.5">{body}</div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * The home screen once you have access: what's for breakfast, lunch and dinner
 * today, from the week plan. Anyone without access gets the recipe list at
 * this address instead (see App.jsx), since the planner is locked for them.
 */
export default function TodayPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const weekPlan = useStore(s => s.weekPlan)
  const mealSlots = useStore(s => s.mealSlots)
  const recipes = useStore(s => s.recipes)
  const familySize = useStore(s => s.familySize)
  const lang = i18n.language?.slice(0, 2) || 'en'

  // An installed app can sit open overnight: look at the date again whenever
  // it comes back to the front, or "today" would still be yesterday.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    function onVisible() { if (!document.hidden) setNow(new Date()) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const recipeById = useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes])
  const getRecipe = id => recipeById.get(id)
  const today = weekdayKey(now)
  const meals = dayMeals(weekPlan, today, mealSlots, getRecipe)
  const tomorrow = dayMeals(weekPlan, weekdayKey(nextDay(now)), mealSlots, getRecipe)
  const summary = daySummary(weekPlan, today, getRecipe, familySize)

  const dateLabel = now.toLocaleDateString(
    { en: 'en-GB', no: 'nb-NO', sv: 'sv-SE' }[lang],
    { weekday: 'long', day: 'numeric', month: 'long' },
  )

  // Same as MealSlot: Back returns here, and the recipe opens scaled to the
  // portions this meal is planned for.
  function openMeal(item) {
    navigate(`/recipes/${item.recipeId}`, {
      state: { from: '/', servings: item.servings ?? familySize ?? 4 },
    })
  }

  return (
    <div className="max-w-2xl xl:max-w-5xl mx-auto w-full px-4 pb-nav lg:pb-8">
      <PageHeader title={t('today.title')} subtitle={dateLabel} className="!px-0" />

      {meals.length > 0 ? (
        <>
          <DaySummary summary={summary} />
          <div className="grid gap-3 mt-4 xl:grid-cols-3">
            {meals.map(({ slot, item, recipe }, i) => (
              <MealCard key={i} slot={slot} item={item} recipe={recipe} lang={lang} onOpen={openMeal} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          className="card mt-1"
          icon="🥗"
          title={t('today.emptyTitle')}
          body={t('today.emptyBody')}
        >
          {/* Opens the same wizard as the planner's button, on the planner,
              which is where the finished week lands. */}
          <button
            onClick={() => navigate('/planner', { state: { openMakeMyWeek: true } })}
            className="btn-primary btn-lg w-full sm:w-auto"
          >
            {t('makeMyWeek.button')}
          </button>
          <button onClick={() => navigate('/planner')} className="btn-ghost">
            {t('today.weekLink')}
          </button>
        </EmptyState>
      )}

      <TomorrowPeek meals={tomorrow} lang={lang} onOpen={openMeal} />

      {meals.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={() => navigate('/planner')} className="btn-ghost">
            {t('today.weekLink')}
          </button>
        </div>
      )}
    </div>
  )
}

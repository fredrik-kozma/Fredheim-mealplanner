import { useTranslation } from 'react-i18next'
import MealSlot from './MealSlot'
import useStore from '../../store/useStore'

export default function DayColumn({ day, onAddToSlot }) {
  const { t } = useTranslation()
  const mealSlots = useStore(s => s.mealSlots)
  const removePlannerDay = useStore(s => s.removePlannerDay)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const isExtra = day.startsWith('extra-')
  const isToday = !isExtra && today === day

  // For extra days, derive a "Day 8 / 9 / 10…" label.
  // Named days come from i18n.
  const extraNumber = isExtra ? Number(day.slice(6)) : null
  const extraLabel = isExtra
    ? t('planner.extraDayLabel', {
        n: 7 + extraNumber,
        defaultValue: `Day ${7 + extraNumber}`,
      })
    : null

  function handleRemove() {
    if (confirm(t('planner.removeDayConfirm', {
      label: extraLabel,
      defaultValue: `Remove ${extraLabel}?`,
    }))) {
      removePlannerDay(day)
    }
  }

  return (
    <div className="flex-shrink-0 w-44 sm:w-52 flex flex-col gap-2">
      {/* Day header */}
      <div className={`relative text-center py-2 rounded-xl font-semibold text-sm ${
        isToday
          ? 'bg-indigo-600 text-white shadow-sm'
          : isExtra
            ? 'bg-slate-100 text-slate-600'
            : 'text-slate-600'
      }`}>
        {isExtra ? (
          <span>{extraLabel}</span>
        ) : (
          <>
            <span className="lg:hidden">{t(`planner.daysShort.${day}`)}</span>
            <span className="hidden lg:inline">{t(`planner.days.${day}`)}</span>
          </>
        )}
        {isExtra && (
          <button
            onClick={handleRemove}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 transition-colors"
            title={t('planner.removeDay', { defaultValue: 'Remove this day' })}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Meal slots */}
      {mealSlots.map(slot => (
        <MealSlot
          key={slot}
          day={day}
          slot={slot}
          onAdd={() => onAddToSlot(day, slot)}
        />
      ))}
    </div>
  )
}

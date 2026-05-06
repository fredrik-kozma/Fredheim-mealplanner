import { useTranslation } from 'react-i18next'
import MealSlot from './MealSlot'
import useStore from '../../store/useStore'

export default function DayColumn({ day, onAddToSlot }) {
  const { t } = useTranslation()
  const mealSlots = useStore(s => s.mealSlots)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const isToday = today === day

  return (
    <div className="flex-shrink-0 w-44 sm:w-52 flex flex-col gap-2">
      {/* Day header */}
      <div className={`text-center py-2 rounded-xl font-semibold text-sm ${
        isToday
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600'
      }`}>
        <span className="lg:hidden">{t(`planner.daysShort.${day}`)}</span>
        <span className="hidden lg:inline">{t(`planner.days.${day}`)}</span>
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

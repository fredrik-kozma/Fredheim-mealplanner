import { useState, Fragment } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import useStore, { getPlanDayKeys } from '../../store/useStore'
import MealSlot from './MealSlot'
import RecipePicker from '../planner/RecipePicker'
import PlannerTemplates from './PlannerTemplates'

// Column width (in rem) for each day. Kept in a constant so the grid
// template and the "add day" column stay in sync.
const DAY_COL = '13rem'
const LABEL_COL = '5rem'

// One day's column header — weekday name (or "Day 8…" for extra days),
// today highlighted, with a remove button on extra days.
function DayHeader({ day }) {
  const { t } = useTranslation()
  const removePlannerDay = useStore(s => s.removePlannerDay)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const isExtra = day.startsWith('extra-')
  const isToday = !isExtra && today === day
  const extraNumber = isExtra ? Number(day.slice(6)) : null
  const extraLabel = isExtra
    ? t('planner.extraDayLabel', { n: 7 + extraNumber, defaultValue: `Day ${7 + extraNumber}` })
    : null

  function handleRemove() {
    if (confirm(t('planner.removeDayConfirm', { label: extraLabel, defaultValue: `Remove ${extraLabel}?` }))) {
      removePlannerDay(day)
    }
  }

  return (
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
  )
}

export default function WeeklyPlanner() {
  const { t } = useTranslation()
  const mealSlots = useStore(s => s.mealSlots)
  const weekPlan = useStore(s => s.weekPlan)
  const recipes = useStore(s => s.recipes)
  const addRecipeToSlot = useStore(s => s.addRecipeToSlot)
  const moveRecipeBetweenSlots = useStore(s => s.moveRecipeBetweenSlots)
  const clearWeekPlan = useStore(s => s.clearWeekPlan)
  const addPlannerDay = useStore(s => s.addPlannerDay)

  const dayKeys = getPlanDayKeys(weekPlan)

  const [picker, setPicker] = useState(null) // { day, slot }
  const [activeId, setActiveId] = useState(null)
  const [templatesMode, setTemplatesMode] = useState(null) // null | 'list' | 'save'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const overId = over.id
    if (!overId.includes('__')) return
    const [toDay, toSlot] = overId.split('__')

    if (active.data.current?.type === 'recipe') {
      const recipeId = active.data.current.recipeId
      addRecipeToSlot(toDay, toSlot, recipeId)
      return
    }

    if (active.data.current?.type === 'planslot') {
      const { day: fromDay, slot: fromSlot, recipeId } = active.data.current
      moveRecipeBetweenSlots(fromDay, fromSlot, toDay, toSlot, recipeId)
    }
  }

  const draggedRecipe = activeId
    ? recipes.find(r => `recipe-${r.id}` === activeId)
    : null

  // One CSS grid drives the whole board: a label column plus one column
  // per day. Because every meal-slot row shares a grid row across all
  // columns, the row's height is the tallest cell in it — so the
  // Breakfast / Lunch / Dinner labels always line up with their slots,
  // even when a slot grows as recipes are added.
  const gridStyle = {
    gridTemplateColumns: `${LABEL_COL} repeat(${dayKeys.length}, ${DAY_COL})`,
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Toolbar — two clear actions (load / save a week) plus clear. */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-end gap-2">
          <button
            onClick={() => setTemplatesMode('list')}
            className="btn-secondary py-2 px-3.5 inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t('planner.loadTemplate')}
          </button>
          <button
            onClick={() => setTemplatesMode('save')}
            className="btn-secondary py-2 px-3.5 inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            {t('planner.saveAsTemplate')}
          </button>
          <button
            onClick={() => { if (confirm(t('planner.clearWeekConfirm'))) clearWeekPlan() }}
            className="btn-ghost text-xs text-slate-400 hover:text-red-500 py-2 px-2"
          >
            {t('planner.clearWeek')}
          </button>
        </div>

        {/* Scrollable planner grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-4 pb-24 lg:pb-8">
          <div className="flex gap-3 min-w-max">
            {/* Aligned grid: label column + one column per day */}
            <div className="grid gap-3 gap-y-2" style={gridStyle}>
              {/* Header row: empty corner + day headers */}
              <div />
              {dayKeys.map(day => (
                <DayHeader key={day} day={day} />
              ))}

              {/* One row per meal slot — label cell then a slot per day */}
              {mealSlots.map(slot => (
                <Fragment key={slot}>
                  <div className="flex items-center justify-end text-xs font-semibold text-slate-500 uppercase tracking-wide pr-1">
                    {t(`planner.mealSlots.${slot}`, { defaultValue: slot })}
                  </div>
                  {dayKeys.map(day => (
                    <MealSlot
                      key={`${day}__${slot}`}
                      day={day}
                      slot={slot}
                      onAdd={() => setPicker({ day, slot })}
                    />
                  ))}
                </Fragment>
              ))}
            </div>

            {/* + Add day column */}
            <div className="flex-shrink-0 w-32 sm:w-40 flex flex-col gap-2">
              <div className="h-9" />
              <button
                onClick={addPlannerDay}
                className="flex-1 min-h-[120px] rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors flex flex-col items-center justify-center gap-1 px-2"
                title={t('planner.addDayTitle', { defaultValue: 'Add an extra day to this plan' })}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-xs font-medium">{t('planner.addDay', { defaultValue: 'Add day' })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedRecipe && (
          <div className="bg-white rounded-xl shadow-2xl px-3 py-2.5 border border-indigo-200 text-sm font-medium text-slate-800 flex items-center gap-2 max-w-[180px]">
            <span>🍽</span>
            <span className="truncate">{draggedRecipe.title}</span>
          </div>
        )}
      </DragOverlay>

      {/* Recipe picker modal */}
      {picker && (
        <RecipePicker
          title={`${t('common.addToPlan')} – ${t(`planner.mealSlots.${picker.slot}`, { defaultValue: picker.slot })} · ${t(`planner.days.${picker.day}`)}`}
          onSelect={(recipeId) => addRecipeToSlot(picker.day, picker.slot, recipeId)}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Templates modal — opened directly to load or save */}
      {templatesMode && (
        <PlannerTemplates initialMode={templatesMode} onClose={() => setTemplatesMode(null)} />
      )}
    </DndContext>
  )
}

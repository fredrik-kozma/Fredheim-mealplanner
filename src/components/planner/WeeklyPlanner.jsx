import { useState } from 'react'
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
import useStore from '../../store/useStore'
import DayColumn from './DayColumn'
import RecipePicker from '../planner/RecipePicker'
import PlannerTemplates from './PlannerTemplates'
import { DAYS } from '../../store/useStore'

export default function WeeklyPlanner() {
  const { t } = useTranslation()
  const mealSlots = useStore(s => s.mealSlots)
  const recipes = useStore(s => s.recipes)
  const addRecipeToSlot = useStore(s => s.addRecipeToSlot)
  const moveRecipeBetweenSlots = useStore(s => s.moveRecipeBetweenSlots)
  const clearWeekPlan = useStore(s => s.clearWeekPlan)

  const [picker, setPicker] = useState(null) // { day, slot }
  const [activeId, setActiveId] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm text-slate-500">{t('planner.dragHint')}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowTemplates(true)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">{t('planner.loadTemplate')}</span>
            </button>
            <button
              onClick={() => { if (confirm(t('planner.clearWeekConfirm'))) clearWeekPlan() }}
              className="btn-ghost text-xs text-slate-400 hover:text-red-500 py-1.5 px-2"
            >
              {t('planner.clearWeek')}
            </button>
          </div>
        </div>

        {/* Scrollable planner grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-4 pb-24 lg:pb-8">
          <div className="flex gap-3 min-w-max">
            {/* Meal slot label column */}
            <div className="flex-shrink-0 w-20 flex flex-col gap-2 pt-10">
              {mealSlots.map(slot => (
                <div
                  key={slot}
                  className="flex items-center justify-end min-h-[80px] text-xs font-semibold text-slate-500 uppercase tracking-wide pr-1"
                >
                  {t(`planner.mealSlots.${slot}`, { defaultValue: slot })}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map(day => (
              <DayColumn
                key={day}
                day={day}
                onAddToSlot={(d, s) => setPicker({ day: d, slot: s })}
              />
            ))}
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

      {/* Templates modal */}
      {showTemplates && <PlannerTemplates onClose={() => setShowTemplates(false)} />}
    </DndContext>
  )
}

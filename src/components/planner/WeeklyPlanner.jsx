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
import useStore, { getPlanDayKeys, normalizeSlotItem } from '../../store/useStore'
import { STARTER_PLANS } from '../../data/starterPlans'
import { printWeekPlan } from '../../utils/printWeekPlan'
import MealSlot from './MealSlot'
import RecipePicker from '../planner/RecipePicker'
import PlannerTemplates from './PlannerTemplates'
import WeekNotes from './WeekNotes'
import DayNote from './DayNote'
import BatchCookColumn from './BatchCookColumn'
import WeekScale from './WeekScale'

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
  const { t, i18n } = useTranslation()
  const mealSlots = useStore(s => s.mealSlots)
  const weekPlan = useStore(s => s.weekPlan)
  const recipes = useStore(s => s.recipes)
  const addRecipeToSlot = useStore(s => s.addRecipeToSlot)
  const moveRecipeBetweenSlots = useStore(s => s.moveRecipeBetweenSlots)
  const clearWeekPlan = useStore(s => s.clearWeekPlan)
  const addPlannerDay = useStore(s => s.addPlannerDay)
  const addBatchRecipe = useStore(s => s.addBatchRecipe)
  const familySize = useStore(s => s.familySize)
  const weekNotes = useStore(s => s.weekNotes)
  const batchCook = useStore(s => s.batchCook) || []
  const activeStarterPlanId = useStore(s => s.activeStarterPlanId)
  const activeWeekName = useStore(s => s.activeWeekName)

  const dayKeys = getPlanDayKeys(weekPlan)
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title

  const mealCount = Object.values(weekPlan).reduce(
    (sum, day) => sum + Object.values(day || {}).reduce((s2, items) => s2 + (items?.length || 0), 0),
    0
  )

  // Build the printable weekly menu from what's on screen. Days and slots
  // with nothing in them are dropped rather than printed empty — a week
  // that deliberately has no dinner (the intermittent-fasting plan) should
  // read as two meals a day, not as three with a blank.
  function handlePrintWeek() {
    const printDays = dayKeys
      .map(day => ({
        label: t(`planner.days.${day}`, { defaultValue: day }),
        slots: mealSlots
          .map(slot => ({
            label: t(`planner.mealSlots.${slot}`, { defaultValue: slot }),
            items: (weekPlan[day]?.[slot] || [])
              .map(it => {
                const norm = normalizeSlotItem(it)
                if (!norm) return null
                const recipe = recipes.find(r => r.id === norm.recipeId)
                if (!recipe) return null
                return {
                  title: titleOf(recipe),
                  servings: norm.servings,
                  // Flagged so the sheet shows at a glance which dishes are
                  // already covered by the batch prep listed further down.
                  batch: Boolean(norm.excludeFromShopping),
                }
              })
              .filter(Boolean),
          }))
          .filter(sl => sl.items.length > 0),
      }))
      .filter(d => d.slots.length > 0)

    const printBatch = batchCook
      .map(b => {
        if (!b) return null
        if (b.kind === 'text') return { title: b.text, servings: null, isText: true }
        const recipe = recipes.find(r => r.id === b.recipeId)
        return recipe ? { title: titleOf(recipe), servings: b.servings } : null
      })
      .filter(Boolean)

    // A name the user chose themselves wins: saving a sample week under your
    // own name leaves activeStarterPlanId set (the stock tips still follow
    // the language), so checking the starter plan first would print the
    // sample's name over the one you just typed. activeWeekName is only ever
    // set by an explicit save / load / upload, and stays null for a pristine
    // sample week — which then resolves its name live so the title follows
    // the UI language like the rest of its text.
    const starter = activeStarterPlanId
      ? STARTER_PLANS.find(p => p.id === activeStarterPlanId)
      : null
    const title =
      activeWeekName ||
      (starter && (starter.translations?.[currentLang]?.name || starter.name)) ||
      t('planner.weeklyMenu', { defaultValue: 'Weekly Menu' })

    printWeekPlan({
      title,
      familySize,
      days: printDays,
      batchCook: printBatch,
      notes: weekNotes?.week || '',
      // Date follows the app's language, not the browser's.
      locale: i18n.language || undefined,
      labels: {
        forPeople: t('shopping.printForPeople', { defaultValue: 'For' }),
        people: t('settings.people'),
        meals: t('planner.printMeals', { defaultValue: 'meals' }),
        batchCook: t('planner.batchCook', { defaultValue: 'Batch cooking' }),
        notesTitle: t('planner.weekNotesTitle', { defaultValue: 'Smart tips' }),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
        batchTag: t('planner.printBatchTag', { defaultValue: 'batch' }),
      },
    })
  }

  // { day, slot } for a meal slot, or { batch: true } for the batch column.
  const [picker, setPicker] = useState(null)
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
        {/* Toolbar — week scale on the left, then load / save / clear. */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
          <WeekScale />
          <div className="flex items-center gap-2">
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
            onClick={handlePrintWeek}
            disabled={mealCount === 0}
            className="btn-secondary py-2 px-3.5 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            {t('planner.printWeek', { defaultValue: 'Print menu' })}
          </button>
          <button
            onClick={() => { if (confirm(t('planner.clearWeekConfirm'))) clearWeekPlan() }}
            className="btn-ghost text-xs text-slate-400 hover:text-red-500 py-2 px-2"
          >
            {t('planner.clearWeek')}
          </button>
          </div>
        </div>

        {/* Week-level "smart tips" — batch-prep guidance for the whole week */}
        <WeekNotes />

        {/* Scrollable planner grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-4 pb-24 lg:pb-8">
          <div className="flex gap-3 min-w-max">
            {/* Batch cooking — what gets prepped once for the whole week */}
            <BatchCookColumn onAddRecipe={() => setPicker({ batch: true })} />

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

              {/* Notes row — one short reminder per day, aligned to the
                  day columns like any meal-slot row. */}
              <div className="flex items-start justify-end text-xs font-semibold text-slate-500 uppercase tracking-wide pr-1 pt-1.5">
                {t('planner.notesRow', { defaultValue: 'Notes' })}
              </div>
              {dayKeys.map(day => (
                <DayNote key={`${day}__note`} day={day} />
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

      {/* Recipe picker modal — targets either a meal slot or the batch column */}
      {picker && (
        <RecipePicker
          title={
            picker.batch
              ? `${t('common.addToPlan')} – ${t('planner.batchCook', { defaultValue: 'Batch cooking' })}`
              : `${t('common.addToPlan')} – ${t(`planner.mealSlots.${picker.slot}`, { defaultValue: picker.slot })} · ${t(`planner.days.${picker.day}`)}`
          }
          onSelect={(recipeId) => {
            if (picker.batch) addBatchRecipe(recipeId)
            else addRecipeToSlot(picker.day, picker.slot, recipeId)
          }}
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

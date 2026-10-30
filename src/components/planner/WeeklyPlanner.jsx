import { useState, useEffect, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'
import useStore, { getPlanDayKeys, normalizeSlotItem } from '../../store/useStore'
import { STARTER_PLANS } from '../../data/starterPlans'
import { printWeekPlan } from '../../utils/printWeekPlan'
import { printMenuBook } from '../../utils/printMenuBook'
import ShareModal from '../share/ShareModal'
import { buildWeekPayload } from '../../utils/sharePayload'
import { weekAsText } from '../../utils/shareText'
import { formatScaledIngredient } from '../../utils/scaleIngredient'
import { spoonHint, needsSpoonHint } from '../../utils/spoonHint'
import { recipeConditions } from '../../data/conditionTags'
import MealSlot from './MealSlot'
import RecipePicker from '../planner/RecipePicker'
import PlannerTemplates from './PlannerTemplates'
import MakeMyWeekModal from './MakeMyWeekModal'
import PrintDayPicker from './PrintDayPicker'
import WeekNotes from './WeekNotes'
import DayNote from './DayNote'
import BatchCookColumn from './BatchCookColumn'
import WeekScale from './WeekScale'

// Column width (in rem) for each day. Kept in a constant so the grid
// template and the "add day" column stay in sync.
const DAY_COL = '13rem'
// Narrower on phones so more of a day shows beside it. Set on the grid as
// --label-col (4.5rem below sm, 5rem from sm up); the board's
// scroll-padding uses the same 4.5rem so a snapped day starts just after it.
const LABEL_COL = 'var(--label-col)'

// The sticky label column: the corner cell above it and one label per row.
// Opaque page background, so days slide neatly underneath. The ::after
// fills the row gap below each cell, so the column reads as one unbroken
// strip instead of a stack of tiles with cards peeking between them. The
// right edge line is phones-only, where sideways swiping is the norm.
const STICKY_COL = "sticky left-0 z-10 bg-slate-50 max-sm:border-r border-slate-200 after:content-[''] after:absolute after:left-0 after:-right-px after:top-full after:h-2 after:bg-slate-50 max-sm:after:border-r after:border-slate-200"
// Toolbar icon paths (Heroicons outline), shared by the desktop buttons
// and the phone menu that stands in for them.
const PRINTER_ICON = 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z'
const BOOK_ICON = 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'
const SPARKLES_ICON = 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z'
const SHARE_ICON = 'M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z'

function ToolbarIcon({ d, className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const ROW_LABEL ='flex justify-end text-right text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide pr-1.5 sm:pr-1 break-words hyphens-auto min-w-0'

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
    <div className={`relative text-center py-2 rounded-xl font-semibold text-sm max-sm:snap-start ${
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
          className="tap-target absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 transition-colors"
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
  const addCustomToSlot = useStore(s => s.addCustomToSlot)
  const moveRecipeBetweenSlots = useStore(s => s.moveRecipeBetweenSlots)
  const moveCustomBetweenSlots = useStore(s => s.moveCustomBetweenSlots)
  const clearWeekPlan = useStore(s => s.clearWeekPlan)
  const addPlannerDay = useStore(s => s.addPlannerDay)
  const addBatchRecipe = useStore(s => s.addBatchRecipe)
  const familySize = useStore(s => s.familySize)
  const weekNotes = useStore(s => s.weekNotes)
  const batchCook = useStore(s => s.batchCook) || []
  const activeStarterPlanId = useStore(s => s.activeStarterPlanId)
  const activeWeekName = useStore(s => s.activeWeekName)
  // Printed amounts follow the same metric/US preference as the screen.
  const units = useStore(s => s.units)

  const dayKeys = getPlanDayKeys(weekPlan)
  const currentLang = i18n.language?.slice(0, 2) || 'en'
  const titleOf = (r) => r.translations?.[currentLang]?.title || r.title

  const mealCount = Object.values(weekPlan).reduce(
    (sum, day) => sum + Object.values(day || {}).reduce((s2, items) => s2 + (items?.length || 0), 0),
    0
  )

  // Which print is being set up: 'week' (the grid), 'book' (every recipe),
  // or null when the picker is closed.
  const [printMode, setPrintMode] = useState(null)
  const [sharing, setSharing] = useState(null)
  // The phone-only "⋯" toolbar menu.
  const [moreOpen, setMoreOpen] = useState(false)
  const [makeWeekOpen, setMakeWeekOpen] = useState(false)
  const weekIsEmpty = mealCount === 0 && batchCook.length === 0

  // The intro tour's "Make my week now" lands here with this flag. Open
  // the wizard once, then drop the flag so Back or a reload doesn't
  // reopen it.
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (!location.state?.openMakeMyWeek) return
    setMakeWeekOpen(true)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  /**
   * Everything the share sheet needs, built on demand rather than kept in
   * state: the payload that goes in the link, and the same week written
   * out as plain text for people who just want to read it in a message.
   */
  function buildShare() {
    const days = dayKeys.map(day => ({
      label: t(`planner.days.${day}`, { defaultValue: day }),
      note: (weekNotes?.days?.[day] || '').trim(),
      slots: mealSlots.map(slot => ({
        label: t(`planner.mealSlots.${slot}`, { defaultValue: slot }),
        items: (weekPlan[day]?.[slot] || [])
          .map(normalizeSlotItem)
          .filter(Boolean)
          .map(n => {
            if (n.kind === 'custom') return n.name
            const r = recipes.find(x => x.id === n.recipeId)
            return r ? titleOf(r) : null
          })
          .filter(Boolean),
      })),
    }))
    const heading = activeWeekName || t('planner.title', { defaultValue: 'Weekly Planner' })
    return {
      payload: buildWeekPayload({
        plan: weekPlan,
        notes: weekNotes,
        batchCook,
        portions: familySize,
        name: activeWeekName,
      }),
      text: weekAsText({ days, heading, url: null }),
      title: heading,
    }
  }

  /**
   * The days worth offering for a given printout, with what each would
   * contribute. The two printouts disagree on purpose: a day carrying only
   * a note belongs on the grid but has no page in the book, and a custom
   * typed-in meal appears on the grid while having no recipe to print.
   * Offering a day that would print nothing is how you get a blank page.
   */
  function printableDays(mode) {
    return dayKeys
      .map(day => {
        let count = 0
        for (const slot of mealSlots) {
          for (const it of weekPlan[day]?.[slot] || []) {
            const norm = normalizeSlotItem(it)
            if (!norm) continue
            if (mode === 'book') {
              if (norm.kind === 'custom') continue
              if (!recipes.find(r => r.id === norm.recipeId)) continue
            }
            count++
          }
        }
        const hasNote = Boolean((weekNotes?.days?.[day] || '').trim())
        return {
          key: day,
          label: t(`planner.days.${day}`, { defaultValue: day }),
          count,
          include: mode === 'book' ? count > 0 : (count > 0 || hasNote),
        }
      })
      .filter(d => d.include)
  }

  // Opening a printout asks which days first — unless there's nothing to
  // choose between, in which case the question is just an extra tap.
  function startPrint(mode) {
    const days = printableDays(mode)
    if (days.length <= 1) {
      const only = days.map(d => d.key)
      if (mode === 'week') handlePrintWeek(only.length ? only : null)
      else handlePrintMenuBook(only.length ? only : null)
      return
    }
    setPrintMode(mode)
  }

  // Build the printable weekly menu from what's on screen.
  //
  // The sheet is a grid mirroring the planner, so unlike the old card
  // layout it keeps empty cells: a column with a gap in it is what makes a
  // calendar readable. Slot rows that are empty across every single day
  // are still dropped — a week that deliberately has no dinner (the
  // intermittent-fasting plan) should read as two meals a day rather than
  // three with a blank row running the width of the page.
  function buildPrintDays(onlyDays = null) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const wanted = onlyDays ? new Set(onlyDays) : null
    const itemsFor = (day, slot) => (weekPlan[day]?.[slot] || [])
      .map(it => {
        const norm = normalizeSlotItem(it)
        if (!norm) return null
        // A meal the user typed themselves still belongs on the menu; it
        // just has no photo or servings behind it.
        if (norm.kind === 'custom') {
          return { title: norm.name, servings: null, imageUrl: null, batch: false }
        }
        const recipe = recipes.find(r => r.id === norm.recipeId)
        if (!recipe) return null
        return {
          recipeId: recipe.id,
          title: titleOf(recipe),
          // The effective count, not just an override — the slot chips on
          // screen show it on every dish, so the printed grid should too.
          servings: norm.servings ?? familySize ?? 4,
          imageUrl: recipe.imageUrl || null,
          // Flagged so the sheet shows at a glance which dishes are
          // already covered by the batch prep listed further down.
          batch: Boolean(norm.excludeFromShopping),
        }
      })
      .filter(Boolean)

    // Slot rows are decided by the days actually being printed: printing
    // Monday alone shouldn't leave an empty Supper row running the width
    // of the page just because Thursday has one.
    const printDayKeys = wanted ? dayKeys.filter(d => wanted.has(d)) : dayKeys
    const usedSlots = mealSlots.filter(slot => printDayKeys.some(day => itemsFor(day, slot).length > 0))
    const days = printDayKeys
      .map(day => {
        const slots = {}
        for (const slot of usedSlots) {
          slots[t(`planner.mealSlots.${slot}`, { defaultValue: slot })] = itemsFor(day, slot)
        }
        // The day's own note from the planner's Notes row. A note is a
        // reason to keep the day on the sheet in its own right — a Sunday
        // with no meals but "soak the beans tonight" written on it still
        // has to be printed, or the reminder is lost exactly when it
        // matters.
        const note = weekNotes?.days?.[day] || ''
        return {
          label: t(`planner.days.${day}`, { defaultValue: day }),
          isToday: day === today,
          note,
          slots,
          hasAny: usedSlots.some(slot => itemsFor(day, slot).length > 0) || Boolean(note.trim()),
        }
      })
      .filter(d => d.hasAny)

    return {
      days,
      slotLabels: usedSlots.map(slot => t(`planner.mealSlots.${slot}`, { defaultValue: slot })),
    }
  }

  function handlePrintWeek(onlyDays = null) {
    const { days: printDays, slotLabels } = buildPrintDays(onlyDays)

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
      slotLabels,
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
        // Row head for the per-day notes row — the same label the planner's
        // own Notes row uses on screen.
        notesRow: t('planner.notesRow', { defaultValue: 'Notes' }),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
        batchTag: t('planner.printBatchTag', { defaultValue: 'batch' }),
        // Grid cells are ~37mm wide, so the servings marker has to be a
        // suffix rather than a word.
        servingsShort: t('planner.printServingsShort', { defaultValue: 'p' }),
      },
    })
  }

  // The whole week as one document: a contents page, then every recipe in
  // cooking order, each scaled to the servings planned for that day.
  //
  // Walks days and slots in planner order rather than deduplicating, so a
  // dish cooked twice in a week prints twice — once per day, each with its
  // own amounts. One shared copy could only carry the right numbers for
  // one of the days.
  function handlePrintMenuBook(onlyDays = null) {
    const wanted = onlyDays ? new Set(onlyDays) : null
    const entries = []
    for (const day of (wanted ? dayKeys.filter(d => wanted.has(d)) : dayKeys)) {
      for (const slot of mealSlots) {
        for (const it of weekPlan[day]?.[slot] || []) {
          const norm = normalizeSlotItem(it)
          if (!norm) continue
          // Custom meals have no ingredients or method, so there is no page
          // to print for them. They still appear on the week grid.
          if (norm.kind === 'custom') continue
          const recipe = recipes.find(r => r.id === norm.recipeId)
          if (!recipe) continue
          const tr = recipe.translations?.[currentLang]
          // Same rule the slot chips and the shopping list use: a per-slot
          // override wins, otherwise the household size chosen for the
          // week. The recipe's own default must not come first — with a
          // household of 6 and a recipe written for 4, the printed
          // amounts would silently be for 4.
          const servings = norm.servings ?? familySize ?? 4
          const ingredients = (tr?.ingredients || recipe.ingredients || []).map(ing => ({
            ...formatScaledIngredient(ing, {
              fromServings: recipe.servings,
              toServings: servings,
              system: units || 'metric',
              lang: currentLang,
              scalesLinearly: ing.scalesLinearly !== false,
            }),
            note: ing.note || '',
          }))
          entries.push({
            dayLabel: t(`planner.days.${day}`, { defaultValue: day }),
            slotLabel: t(`planner.mealSlots.${slot}`, { defaultValue: slot }),
            servings,
            title: titleOf(recipe),
            description: tr?.description || recipe.description || '',
            imageUrl: recipe.imageUrl || null,
            // Same meta the standalone recipe sheet carries, so a page in
            // the booklet is the same object as one printed on its own.
            category: t(`categories.${recipe.category}`, { defaultValue: recipe.category }),
            prepTime: recipe.prepTime ?? null,
            cookTime: recipe.cookTime ?? null,
            conditions: recipeConditions(recipe).map(c => ({
              icon: c.icon,
              label: t(`conditions.${c.id}`, { defaultValue: c.id }),
            })),
            ingredients,
            // Per page, not per book: a recipe weighed entirely in grams
            // gets no reminder even when the one before it needed one.
            spoonHint: needsSpoonHint(tr?.ingredients || recipe.ingredients)
              ? spoonHint(currentLang)
              : '',
            steps: tr?.steps || recipe.steps || [],
          })
        }
      }
    }

    if (entries.length === 0) return

    const starter = activeStarterPlanId ? STARTER_PLANS.find(p => p.id === activeStarterPlanId) : null
    const bookTitle =
      activeWeekName ||
      (starter && (starter.translations?.[currentLang]?.name || starter.name)) ||
      t('planner.weeklyMenu', { defaultValue: 'Weekly Menu' })

    printMenuBook({
      title: bookTitle,
      familySize,
      entries,
      locale: i18n.language || undefined,
      labels: {
        contents: t('planner.menuBookContents', { defaultValue: 'Contents' }),
        ingredients: t('recipeDetail.ingredients'),
        instructions: t('recipeDetail.instructions'),
        servings: t('recipeDetail.servingsLabel', { defaultValue: 'Servings' }),
        prep: t('recipeDetail.prepLabel', { defaultValue: 'Prep' }),
        cook: t('recipeDetail.cookLabel', { defaultValue: 'Cook' }),
        goodFor: t('recipeDetail.goodFor', { defaultValue: 'Good for' }),
        printedOn: t('recipeDetail.printedOn', { defaultValue: 'Printed' }),
        recipesCount: t('planner.menuBookRecipes', { defaultValue: 'recipes' }),
      },
    })
  }

  // { day, slot } for a meal slot, or { batch: true } for the batch column.
  const [picker, setPicker] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [activeDragData, setActiveDragData] = useState(null)
  const [templatesMode, setTemplatesMode] = useState(null) // null | 'list' | 'save'

  // Mouse and touch get their own sensor on purpose. PointerSensor would
  // handle both, but a phone fires pointer events for touch too, so it
  // claimed the press after 8px of movement and the touch delay below
  // never got a chance to run — which is why a chip could be picked up and
  // moved by what the user meant as a tap or a scroll.
  //
  // So: a mouse drags after 8px, which is immediate enough to feel direct
  // and still survives the wobble of a click. A finger has to stay down for
  // 450ms without wandering more than 6px, which no tap or scroll does.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 450, tolerance: 6 } })
  )

  function handleDragStart({ active }) {
    setActiveId(active.id)
    // A short buzz the moment the hold registers. Without it a long press
    // is a half-second of nothing, and the natural response to nothing is
    // to press harder or give up. Android only — iOS Safari has no
    // vibrate — so the chip fading out stays the signal that must carry.
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12)
    // Kept so the overlay can describe a meal already on the board, which
    // isn't findable from the recipe list by id the way a dragged search
    // result is.
    setActiveDragData(active.data.current || null)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    setActiveDragData(null)
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
      return
    }

    if (active.data.current?.type === 'plancustom') {
      const { day: fromDay, slot: fromSlot, customId } = active.data.current
      moveCustomBetweenSlots(fromDay, fromSlot, toDay, toSlot, customId)
    }
  }

  // What the overlay shows while something is in the air. A result dragged
  // from the picker is found by its id; a meal already on the board is
  // described by the data it carries, since its draggable id is scoped by
  // day and slot and won't match a recipe id.
  const draggedRecipe = activeId
    ? recipes.find(r => `recipe-${r.id}` === activeId)
    : null
  const draggedLabel = draggedRecipe
    ? titleOf(draggedRecipe)
    : activeDragData?.type === 'planslot'
      ? (() => {
        const r = recipes.find(x => x.id === activeDragData.recipeId)
        return r ? titleOf(r) : null
      })()
      : activeDragData?.type === 'plancustom'
        ? (normalizeSlotItem(
          (weekPlan[activeDragData.day]?.[activeDragData.slot] || [])
            .find(it => normalizeSlotItem(it)?.id === activeDragData.customId)
        )?.name || null)
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
        {/* Toolbar — week scale on the left, then load / save / clear.
            The button group wraps on its own. The outer row wrapping is
            not enough: the group is a single flex item there, so without
            flex-wrap of its own it stays one unbreakable line and runs off
            the side of a phone — which is how the Share button ended up
            128px beyond the right edge, present but unreachable.
            Wrapping here means no label in any language can push a button
            out of sight; the toolbar grows downwards instead. */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
          <WeekScale />
          <div className="w-full sm:w-auto grid grid-cols-[1fr_1fr_auto] sm:flex sm:flex-wrap items-center sm:justify-end gap-2 min-w-0">
          {/* The planner's main feature, so it leads the toolbar in the
              primary colour; on a phone it gets a full-width row of its own
              above Load / Save. */}
          <button
            onClick={() => setMakeWeekOpen(true)}
            className="btn-primary border border-transparent py-2.5 sm:py-2 px-3.5 col-span-3 sm:col-auto inline-flex items-center justify-center gap-1.5"
          >
            <ToolbarIcon d={SPARKLES_ICON} />
            {t('makeMyWeek.button')}
          </button>
          <button
            onClick={() => setTemplatesMode('list')}
            className="btn-secondary py-2 px-3.5 inline-flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {t('planner.loadTemplate')}
          </button>
          <button
            onClick={() => setTemplatesMode('save')}
            className="btn-secondary py-2 px-3.5 inline-flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            {t('planner.saveAsTemplate')}
          </button>
          <button
            onClick={() => startPrint('week')}
            disabled={mealCount === 0}
            className="btn-secondary py-2 px-3.5 hidden sm:inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ToolbarIcon d={PRINTER_ICON} />
            {t('planner.printWeek', { defaultValue: 'Print menu' })}
          </button>
          <button
            onClick={() => startPrint('book')}
            disabled={mealCount === 0}
            className="btn-secondary py-2 px-3.5 hidden sm:inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title={t('planner.printMenuBookHint', { defaultValue: 'Every recipe for the week, in one document' })}
          >
            <ToolbarIcon d={BOOK_ICON} />
            {t('planner.printMenuBook', { defaultValue: 'Print all recipes' })}
          </button>
          <button
            onClick={() => setSharing(buildShare())}
            disabled={mealCount === 0}
            className="btn-secondary py-2 px-3.5 hidden sm:inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title={t('planner.shareWeekHint', { defaultValue: 'Send this menu to someone' })}
          >
            <ToolbarIcon d={SHARE_ICON} />
            {t('planner.shareWeek', { defaultValue: 'Share' })}
          </button>
          {/* Phones: Print, Print all and Share fold into this menu, so
              the toolbar is one row of Load / Save / ⋯ instead of three
              rows of half-width buttons with wrapping labels. */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setMoreOpen(v => !v)}
              className="btn-secondary py-2 px-3 h-full"
              aria-label={t('planner.printShare', { defaultValue: 'Print & share' })}
              title={t('planner.printShare', { defaultValue: 'Print & share' })}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              <ToolbarIcon d={PRINTER_ICON} />
            </button>
            {moreOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMoreOpen(false)} />
                <div role="menu" className="absolute right-0 top-full mt-1 z-30 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1">
                  {[
                    { icon: PRINTER_ICON, label: t('planner.printWeek', { defaultValue: 'Print menu' }), run: () => startPrint('week') },
                    { icon: BOOK_ICON, label: t('planner.printMenuBook', { defaultValue: 'Print all recipes' }), run: () => startPrint('book') },
                    { icon: SHARE_ICON, label: t('planner.shareWeek', { defaultValue: 'Share' }), run: () => setSharing(buildShare()) },
                  ].map(item => (
                    <button
                      key={item.label}
                      role="menuitem"
                      disabled={mealCount === 0}
                      onClick={() => { setMoreOpen(false); item.run() }}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2.5"
                    >
                      <ToolbarIcon d={item.icon} className="w-4 h-4 flex-shrink-0 text-slate-500" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => { if (confirm(t('planner.clearWeekConfirm'))) clearWeekPlan() }}
            className="btn-ghost text-xs text-slate-400 hover:text-red-500 py-2 px-2 col-span-3 sm:col-auto"
          >
            {t('planner.clearWeek')}
          </button>
          </div>
        </div>

        {/* An empty week gets a friendly nudge towards Make my week, the
            button in the toolbar right above. */}
        {weekIsEmpty && (
          <div className="mx-4 mb-3 card p-4 flex items-center gap-3 flex-wrap">
            <span className="text-2xl" aria-hidden>✨</span>
            <div className="flex-1 min-w-[12rem]">
              <p className="text-sm font-semibold text-slate-800">{t('makeMyWeek.emptyTitle')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('makeMyWeek.emptyText')}</p>
              <p className="text-xs font-medium text-indigo-600 mt-1">↑ {t('makeMyWeek.emptyHint')}</p>
            </div>
          </div>
        )}

        {/* Week-level "smart tips" — batch-prep guidance for the whole week */}
        <WeekNotes />

        {/* Scrollable planner grid. Nothing above it has a fixed height
            (the page grows with its content), so on desktop the board is
            capped at the window's height instead: it then scrolls on its
            own, and its sideways scrollbar sits at most one screen down
            rather than under the last row of a long week. Phones keep
            plain page scrolling — a nested vertical scroller fights the
            finger there, and sideways is a swipe anyway.
            The side padding sits on the inner row rather than here, so the
            sticky labels pin to the true left edge with no strip beside
            them for cards to show through. On phones a swipe snaps to the
            nearest day (proximity, so a drag near the edge isn't yanked
            around), with that day starting just right of the labels. */}
        <div className="flex-1 overflow-x-auto overflow-y-auto pb-24 lg:pb-8 lg:max-h-[calc(100vh-4rem)] max-sm:snap-x max-sm:snap-proximity max-sm:scroll-pl-[5.25rem]">
          <div className="flex gap-3 min-w-max px-4 max-sm:snap-start">
            {/* Batch cooking — what gets prepped once for the whole week */}
            <BatchCookColumn onAddRecipe={() => setPicker({ batch: true })} />

            {/* Aligned grid: label column + one column per day */}
            <div className="grid gap-3 gap-y-2 [--label-col:4.5rem] sm:[--label-col:5rem]" style={gridStyle}>
              {/* Header row: the corner is part of the sticky label column,
                  so day names pass under it rather than into the labels. */}
              <div className={`${STICKY_COL} z-20`} />
              {dayKeys.map(day => (
                <DayHeader key={day} day={day} />
              ))}

              {/* One row per meal slot — label cell then a slot per day */}
              {mealSlots.map(slot => (
                <Fragment key={slot}>
                  {/* Sticky so the row stays named while the days scroll past
                      under it; opaque and above the slots so nothing shows
                      through. Drops are unaffected: dnd-kit matches by the
                      slots' measured rects, not by what is on top. */}
                  <div lang={i18n.resolvedLanguage} className={`${STICKY_COL} ${ROW_LABEL} items-center`}>
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
              <div lang={i18n.resolvedLanguage} className={`${STICKY_COL} ${ROW_LABEL} items-start pt-1.5`}>
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
        {draggedLabel && (
          <div className="bg-white rounded-xl shadow-2xl px-3 py-2.5 border border-indigo-200 text-sm font-medium text-slate-800 flex items-center gap-2 max-w-[180px]">
            <span>{activeDragData?.type === 'plancustom' ? '📝' : '🍽'}</span>
            <span className="truncate">{draggedLabel}</span>
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
          // Both actions already ignore a recipe that's present, so adding a
          // selection that overlaps what's in the slot is safe.
          onSelectMany={(recipeIds) => {
            for (const recipeId of recipeIds) {
              if (picker.batch) addBatchRecipe(recipeId)
              else addRecipeToSlot(picker.day, picker.slot, recipeId)
            }
          }}
          // Only for meal slots. The batch column already has its own text
          // entry, and that one is a prep reminder rather than something to
          // buy, so the two shouldn't be merged.
          onAddCustom={picker.batch ? undefined : (name, amount) => {
            addCustomToSlot(picker.day, picker.slot, name, amount)
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Templates modal — opened directly to load or save */}
      {sharing && (
        <ShareModal
          kind="week"
          payload={sharing.payload}
          text={sharing.text}
          title={sharing.title}
          onClose={() => setSharing(null)}
        />
      )}

      {templatesMode && (
        <PlannerTemplates initialMode={templatesMode} onClose={() => setTemplatesMode(null)} />
      )}

      {makeWeekOpen && <MakeMyWeekModal onClose={() => setMakeWeekOpen(false)} />}

      {/* "Which days?" — shown before either printout when there is more
          than one day to choose between. */}
      {printMode && (
        <PrintDayPicker
          days={printableDays(printMode)}
          confirmLabel={printMode === 'week'
            ? t('planner.printWeek', { defaultValue: 'Print menu' })
            : t('planner.printMenuBook', { defaultValue: 'Print all recipes' })}
          onCancel={() => setPrintMode(null)}
          onConfirm={(days) => {
            const mode = printMode
            setPrintMode(null)
            if (mode === 'week') handlePrintWeek(days)
            else handlePrintMenuBook(days)
          }}
        />
      )}
    </DndContext>
  )
}

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage, migrateFromLocalStorage } from './idbStorage'
import { STARTER_PLANS } from '../data/starterPlans'
import { DEFAULT_SALT_LEVEL, SALT_LEVELS, normalizeSaltLevel } from '../utils/saltLevel'

// Fire-and-forget — copy any pre-IndexedDB localStorage blob over the
// first time the new app loads on an existing device, so users don't
// lose their recipes during the storage upgrade.
migrateFromLocalStorage()

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
// Meal slots and categories are stored as stable English keys.
// The UI renders them via i18n (settings.mealSlotNames / settings.categoryNames)
// so they switch language with the rest of the app.
const DEFAULT_MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner']

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Build the full ordered list of day keys for a plan: the seven named
// days plus any extra ones (extra-1, extra-2, …). The plan object itself
// is the source of truth for which extras exist.
export function getPlanDayKeys(plan) {
  if (!plan) return [...DAYS]
  const extras = Object.keys(plan)
    .filter(k => k.startsWith('extra-'))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
  return [...DAYS, ...extras]
}

// Items in a slot are stored as { recipeId, servings? }. `servings === null`
// (or missing) means "use the household default" set in Settings; a number
// overrides it for that specific slot. This helper accepts either the old
// string-only shape or the new object shape and normalizes it.
// A planned meal. `excludeFromShopping` marks a meal whose ingredients are
// already covered — typically something batch-cooked earlier in the week, or
// leftovers — so it still shows in the plan but buys nothing.
//
// Normalizing here (rather than at each call site) is what keeps the flag
// alive across servings edits and drag-and-drop, since those actions rebuild
// items from this function's output.
export function normalizeSlotItem(item) {
  if (typeof item === 'string') return { recipeId: item, servings: null, excludeFromShopping: false }
  // A slot can also hold something the user typed themselves — a meal with
  // no recipe behind it (leftovers, takeaway, a salad they improvise). It
  // still belongs on the menu and still needs buying, so it carries a name
  // and a free-text amount and flows into the shopping list the way an
  // item added with "Legg til vare" does.
  if (item && typeof item === 'object' && item.kind === 'custom' && item.name) {
    return {
      kind: 'custom',
      id: item.id,
      name: item.name,
      amount: item.amount || '',
      excludeFromShopping: Boolean(item.excludeFromShopping),
      recipeId: null,
      servings: null,
    }
  }
  if (item && typeof item === 'object' && item.recipeId) {
    return {
      kind: 'recipe',
      recipeId: item.recipeId,
      servings: item.servings ?? null,
      excludeFromShopping: Boolean(item.excludeFromShopping),
    }
  }
  return null
}

function emptyWeekPlan() {
  const plan = {}
  for (const day of DAYS) {
    plan[day] = {}
    for (const slot of DEFAULT_MEAL_SLOTS) {
      plan[day][slot] = []
    }
  }
  return plan
}

// Free-text notes that travel with the week: one "smart tips" note for the
// whole week (batch-prep guidance like "bake the bread Monday — it covers
// the week") plus an optional short note per day.
//
// Deliberately a sibling of weekPlan rather than a key inside it: weekPlan
// is walked as day → slot → items to derive the day columns and count
// meals, so any non-day key living in there would be read as a day.
function emptyWeekNotes() {
  return { week: '', days: {} }
}

// Accepts anything (a persisted value, an uploaded file's field, undefined)
// and returns a well-formed notes object. Keeps the rest of the app free of
// defensive checks.
function normalizeWeekNotes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyWeekNotes()
  const days = {}
  if (raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days)) {
    for (const [day, text] of Object.entries(raw.days)) {
      if (typeof text === 'string' && text.trim()) days[day] = text
    }
  }
  // A generated week's tips also carry the data they were rendered from
  // (src/utils/weekTips.js), so they can follow a language switch.
  const tips = raw.tips && typeof raw.tips === 'object' && !Array.isArray(raw.tips) &&
    raw.tips.data && typeof raw.tips.data === 'object'
    ? { tips: raw.tips }
    : {}
  return { week: typeof raw.week === 'string' ? raw.week : '', days, ...tips }
}

// True when a notes object carries anything worth saving/showing.
export function weekNotesHaveContent(notes) {
  const n = normalizeWeekNotes(notes)
  return Boolean(n.week.trim() || Object.keys(n.days).length)
}

// ── Scaling a whole week to a different number of people ──────────────────
//
// Items left at the default carry `servings: null` and already follow the
// household size, so they need no rewriting. Only the *tweaked* ones hold a
// fixed number, and those are what would otherwise be stranded when the week
// is cooked for a different crowd — so scaling multiplies exactly those.
function scaleServingsValue(value, ratio) {
  if (value == null) return null
  return Math.max(1, Math.round(value * ratio))
}

function scalePlanServings(plan, ratio) {
  const out = {}
  for (const [day, slots] of Object.entries(plan || {})) {
    out[day] = {}
    for (const [slot, items] of Object.entries(slots || {})) {
      out[day][slot] = (items || []).map(it => {
        const n = normalizeSlotItem(it)
        if (!n) return it
        return { ...n, servings: scaleServingsValue(n.servings, ratio) }
      })
    }
  }
  return out
}

function scaleBatchServings(batch, ratio) {
  return (batch || []).map(b =>
    b && b.kind === 'recipe' ? { ...b, servings: scaleServingsValue(b.servings, ratio) } : b
  )
}

const DEFAULT_WEEK_PLAN = emptyWeekPlan()

const useStore = create(
  persist(
    (set, get) => ({
      // ── Last opened recipe ──
      lastOpenedRecipeId: null,
      setLastOpenedRecipeId: (id) => set({ lastOpenedRecipeId: id }),

      // Remembers whichever recipes sub-page the user was last on.
      // Used by the "Recipes" nav button to return to that exact view.
      // Examples: '/recipes', '/recipes/123', '/recipes/123/edit', '/recipes/new'
      lastRecipesPath: '/recipes',
      setLastRecipesPath: (path) => set({ lastRecipesPath: path }),

      // ── Recipes ──
      recipes: [],

      addRecipe: (recipe) => set((s) => ({
        recipes: [...s.recipes, { ...recipe, id: makeId(), createdAt: Date.now(), translations: recipe.translations || {} }],
      })),

      // Editing a pack recipe stamps `userEdited` so the change survives a
      // reload. Pack recipes are otherwise not persisted at all (see
      // partialize) — they're rebuilt from the bundle each load — so
      // without this an edit lived only in memory and was silently lost,
      // which is exactly what happened to a batch of photos added in-app.
      // The flag is cleared when the pack itself updates: a version bump
      // means the new content supersedes the local edit.
      updateRecipe: (id, updates) => set((s) => ({
        recipes: s.recipes.map(r =>
          r.id === id
            ? { ...r, ...updates, ...(r.sourcePackId ? { userEdited: true } : {}) }
            : r
        ),
      })),

      deleteRecipe: (id) => set((s) => {
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          newPlan[day] = {}
          for (const [slot, ids] of Object.entries(slots)) {
            newPlan[day][slot] = ids.filter(rid => rid !== id)
          }
        }
        return {
          recipes: s.recipes.filter(r => r.id !== id),
          weekPlan: newPlan,
        }
      }),

      deleteAllRecipes: () => set(() => ({
        recipes: [],
        weekPlan: emptyWeekPlan(),
        installedPacks: {},
      })),

      updateRecipeTranslation: (recipeId, lang, translatedFields) => set((s) => ({
        recipes: s.recipes.map(r =>
          r.id === recipeId
            ? { ...r, translations: { ...(r.translations || {}), [lang]: translatedFields } }
            : r
        ),
      })),

      // ── Recipe Categories ──
      // Categories are stored as stable English keys. Their display name is
      // looked up through i18n (categories.<Key>) so they switch with the UI
      // language. Users can still add custom categories — those render as-is.
      recipeCategories: ['Breakfast', 'Lunch', 'Main', 'Side', 'Salad', 'Soup', 'Sauce', 'Spreads', 'Bread', 'Dessert', 'Snack', 'Drink', 'Jam', 'Other'],

      addRecipeCategory: (name) => set((s) => ({
        recipeCategories: s.recipeCategories.includes(name) ? s.recipeCategories : [...s.recipeCategories, name],
      })),

      removeRecipeCategory: (name) => set((s) => ({
        recipeCategories: s.recipeCategories.filter(c => c !== name),
      })),

      // ── Meal Slots ──
      mealSlots: DEFAULT_MEAL_SLOTS,

      addMealSlot: (name) => set((s) => {
        if (s.mealSlots.includes(name)) return {}
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          newPlan[day] = { ...slots, [name]: [] }
        }
        return { mealSlots: [...s.mealSlots, name], weekPlan: newPlan }
      }),

      removeMealSlot: (name) => set((s) => {
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          const { [name]: _removed, ...rest } = slots
          newPlan[day] = rest
        }
        return {
          mealSlots: s.mealSlots.filter(m => m !== name),
          weekPlan: newPlan,
        }
      }),

      renameMealSlot: (oldName, newName) => set((s) => {
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          newPlan[day] = {}
          for (const [slot, ids] of Object.entries(slots)) {
            newPlan[day][slot === oldName ? newName : slot] = ids
          }
        }
        return {
          mealSlots: s.mealSlots.map(m => m === oldName ? newName : m),
          weekPlan: newPlan,
        }
      }),

      // ── Week Plan ──
      weekPlan: DEFAULT_WEEK_PLAN,

      // ── Week notes ──
      // Saved, loaded and exported alongside weekPlan (see
      // savePlannerTemplate / loadPlannerTemplate / installStarterPlan).
      weekNotes: emptyWeekNotes(),

      // Id of the shipped STARTER_PLANS entry the current week notes were
      // last loaded from, or null. Lets setLanguage() re-fetch the notes
      // in the new language — but only while they still read exactly as
      // installed; the moment the user edits them (setWeekNote) they're
      // the user's own text and stop following the language switch.
      activeStarterPlanId: null,

      // Human-readable name of whatever week is currently loaded — a saved
      // week's name, or an uploaded file's. Purely a label (the printout's
      // title); nothing keys off it. Shipped sample weeks deliberately leave
      // this null and are resolved from activeStarterPlanId instead, so
      // their title follows the UI language like the rest of their text.
      activeWeekName: null,

      setWeekNote: (text) => set((s) => ({
        weekNotes: { ...normalizeWeekNotes(s.weekNotes), week: text },
        activeStarterPlanId: null,
      })),

      setDayNote: (day, text) => set((s) => {
        const notes = normalizeWeekNotes(s.weekNotes)
        const days = { ...notes.days }
        // An emptied note is removed rather than stored blank, so
        // weekNotesHaveContent stays accurate and exports stay tidy.
        if (text && text.trim()) days[day] = text
        else delete days[day]
        return { weekNotes: { ...notes, days } }
      }),

      clearWeekNotes: () => set({ weekNotes: emptyWeekNotes(), activeStarterPlanId: null }),

      // A generated week's tips, rendered again in another language
      // (`next` = { week, days }, see LocalizedWeekTips). Text the user has
      // edited no longer matches what was rendered, and is left alone.
      relocalizeWeekTips: (next) => set((s) => {
        const notes = normalizeWeekNotes(s.weekNotes)
        const rendered = notes.tips?.rendered
        if (!rendered) return {}
        const week = notes.week === (rendered.week || '') ? next.week : notes.week
        const days = { ...notes.days }
        const dayKeys = new Set([...Object.keys(rendered.days || {}), ...Object.keys(next.days || {})])
        for (const day of dayKeys) {
          if ((notes.days[day] || '') !== (rendered.days?.[day] || '')) continue
          if (next.days?.[day]) days[day] = next.days[day]
          else delete days[day]
        }
        return { weekNotes: { ...notes, week, days, tips: { ...notes.tips, rendered: next } } }
      }),

      // ── Kitchen timers ──
      //
      // Held as an absolute finish time (`endsAt`), never as a
      // "seconds remaining" that something has to decrement. A phone
      // throttles or suspends timers in a backgrounded tab, so a counter
      // ticked by setInterval quietly runs slow exactly when you've put
      // the phone down to knead — whereas a wall-clock deadline is still
      // correct after any amount of sleep, and survives a reload.
      //
      // A paused timer holds `remainingMs` instead and has no deadline
      // until it's resumed.
      timers: [],

      addTimer: (label, durationMs) => set((s) => ({
        timers: [
          ...s.timers,
          {
            id: makeId(),
            label: (label || '').trim(),
            durationMs,
            endsAt: Date.now() + durationMs,
            remainingMs: null,
            ringing: false,
          },
        ],
      })),

      pauseTimer: (id) => set((s) => ({
        timers: s.timers.map(tm => tm.id === id && tm.endsAt != null && !tm.ringing
          ? { ...tm, remainingMs: Math.max(0, tm.endsAt - Date.now()), endsAt: null }
          : tm),
      })),

      resumeTimer: (id) => set((s) => ({
        timers: s.timers.map(tm => tm.id === id && tm.endsAt == null
          ? { ...tm, endsAt: Date.now() + (tm.remainingMs ?? tm.durationMs), remainingMs: null }
          : tm),
      })),

      // Called by the runner when a deadline passes. Separate from
      // addTimer so the "is it finished" decision lives in one place.
      markTimerRinging: (id) => set((s) => ({
        timers: s.timers.map(tm => tm.id === id
          ? { ...tm, ringing: true, ringingSince: Date.now(), endsAt: null, remainingMs: 0 }
          : tm),
      })),

      removeTimer: (id) => set((s) => ({ timers: s.timers.filter(tm => tm.id !== id) })),

      // Add the same length again — the "one more minute" case, and the
      // reason a finished timer keeps its durationMs.
      restartTimer: (id) => set((s) => ({
        timers: s.timers.map(tm => tm.id === id
          ? { ...tm, endsAt: Date.now() + tm.durationMs, remainingMs: null, ringing: false, ringingSince: null }
          : tm),
      })),

      clearFinishedTimers: () => set((s) => ({ timers: s.timers.filter(tm => !tm.ringing) })),

      /**
       * Run once on startup. Timers are persisted, so the app can come back
       * hours or days later holding deadlines that passed while it was
       * closed. Anything that ran out within the last few minutes still
       * rings — you probably just reloaded mid-bake. Anything older is
       * dropped silently rather than greeting you with a chime for a loaf
       * you took out on Tuesday.
       *
       * The same cut-off applies to timers that were *already* ringing when
       * the app closed, which is also what covers pressing Stop on the
       * notification with no window open: the worker can't reach into this
       * store to clear the flag, so the age of the alarm settles it here
       * instead.
       */
      reconcileTimers: () => set((s) => {
        const now = Date.now()
        const GRACE_MS = 5 * 60 * 1000
        const cutoff = now - GRACE_MS
        return {
          timers: s.timers
            // Newly expired while we were away → ring, dated from when it
            // actually finished rather than from launch.
            .map(tm => (tm.endsAt != null && tm.endsAt <= now)
              ? { ...tm, ringing: true, ringingSince: tm.endsAt, endsAt: null, remainingMs: 0 }
              : tm)
            .filter(tm => {
              if (tm.ringing) return (tm.ringingSince ?? now) > cutoff
              return true
            }),
        }
      }),

      // ── Batch cooking ──
      // Things prepped once for the whole week (bouillon, bread, spreads).
      // Recipe entries feed the shopping list; text entries are plain
      // reminders that buy nothing. Like weekNotes, this is a sibling of
      // weekPlan rather than a key inside it.
      batchCook: [],

      addBatchRecipe: (recipeId, servings = null) => set((s) => {
        if (s.batchCook.some(b => b.kind === 'recipe' && b.recipeId === recipeId)) return {}
        return { batchCook: [...s.batchCook, { id: makeId(), kind: 'recipe', recipeId, servings }] }
      }),

      addBatchText: (text) => set((s) => {
        const clean = (text || '').trim()
        if (!clean) return {}
        return { batchCook: [...s.batchCook, { id: makeId(), kind: 'text', text: clean }] }
      }),

      updateBatchText: (id, text) => set((s) => ({
        batchCook: s.batchCook.map(b => (b.id === id ? { ...b, text: (text || '').trim() } : b)),
      })),

      setBatchServings: (id, servings) => set((s) => ({
        batchCook: s.batchCook.map(b =>
          b.id === id ? { ...b, servings: servings == null ? null : Math.max(1, Math.floor(servings)) } : b
        ),
      })),

      removeBatchItem: (id) => set((s) => ({ batchCook: s.batchCook.filter(b => b.id !== id) })),

      clearBatchCook: () => set({ batchCook: [] }),

      // ── Nutrition log ──
      // What the user actually ate, keyed by local date 'YYYY-MM-DD':
      //   { [date]: [ { id, recipeId, portions } ] }
      // Portions are servings of that recipe eaten (halves allowed), so a
      // day's total nutrition is Σ recipe.perServing × portions. Kept as its
      // own map, independent of the planner — logging what you ate is a
      // separate act from planning what you'll cook.
      nutritionLog: {},

      addNutritionEntry: (date, recipeId, portions = 1) => set((s) => {
        const day = s.nutritionLog[date] || []
        // If the same recipe is already logged that day, bump its portions
        // rather than adding a duplicate row.
        const existing = day.find(e => e.recipeId === recipeId)
        const nextDay = existing
          ? day.map(e => e.recipeId === recipeId
            ? { ...e, portions: Math.round((e.portions + portions) * 2) / 2 }
            : e)
          : [...day, { id: makeId(), recipeId, portions }]
        return { nutritionLog: { ...s.nutritionLog, [date]: nextDay } }
      }),

      /**
       * Pull a planned day across into the food log: "I ate what I planned."
       *
       * Deliberately NOT addNutritionEntry in a loop. That one bumps the
       * portions of a recipe already logged, which is right when you add
       * the same dish twice by hand and wrong here — pressing this a
       * second time would quietly turn one portion into two. Recipes
       * already logged for the date are left exactly as they are, tweaks
       * included, so the button is safe to press again.
       *
       * Portions are what one person eats by the plan (plannedPortions in
       * utils/todayPlan.js, the same as the Today screen), rounded to the
       * stepper's half servings. A recipe planned twice becomes one entry
       * with the two added up.
       *
       * @param {{ recipeId: string, portions: number }[]} planned
       * @returns {number} how many were actually added
       */
      importPlannedMeals: (date, planned) => {
        const existing = get().nutritionLog?.[date] || []
        const already = new Set(existing.map(e => e.recipeId))
        const toAdd = new Map()
        for (const { recipeId, portions } of planned) {
          if (!already.has(recipeId)) toAdd.set(recipeId, (toAdd.get(recipeId) || 0) + portions)
        }
        if (toAdd.size === 0) return 0
        set((s) => ({
          nutritionLog: {
            ...s.nutritionLog,
            [date]: [
              ...(s.nutritionLog[date] || []),
              ...[...toAdd].map(([recipeId, portions]) => ({
                id: makeId(),
                recipeId,
                portions: Math.max(0.5, Math.round(portions * 2) / 2),
              })),
            ],
          },
        }))
        return toAdd.size
      },

      setNutritionPortions: (date, entryId, portions) => set((s) => {
        const clean = Math.max(0.5, Math.round(portions * 2) / 2)
        return {
          nutritionLog: {
            ...s.nutritionLog,
            [date]: (s.nutritionLog[date] || []).map(e =>
              e.id === entryId ? { ...e, portions: clean } : e),
          },
        }
      }),

      removeNutritionEntry: (date, entryId) => set((s) => {
        const nextDay = (s.nutritionLog[date] || []).filter(e => e.id !== entryId)
        const next = { ...s.nutritionLog }
        // Drop the date key entirely once its last entry is gone, keeping the
        // map tidy (and "which days have data" a simple key check).
        if (nextDay.length) next[date] = nextDay
        else delete next[date]
        return { nutritionLog: next }
      }),

      clearNutritionDay: (date) => set((s) => {
        const next = { ...s.nutritionLog }
        delete next[date]
        return { nutritionLog: next }
      }),

      // ── Ingredient checklist ──
      // Cooking-progress ticks, keyed by recipe id → { [ingredientIndex]: true }.
      // Indexed by position so a tick survives language switches and serving
      // scaling (which change the text/amounts but not the order). Persisted so
      // progress isn't lost if you navigate away mid-cook; easily reset.
      checkedIngredients: {},

      toggleIngredientChecked: (recipeId, index) => set((s) => {
        const forRecipe = { ...(s.checkedIngredients[recipeId] || {}) }
        if (forRecipe[index]) delete forRecipe[index]
        else forRecipe[index] = true
        const next = { ...s.checkedIngredients }
        if (Object.keys(forRecipe).length) next[recipeId] = forRecipe
        else delete next[recipeId] // drop empty maps so "any checked?" stays a simple check
        return { checkedIngredients: next }
      }),

      clearCheckedIngredients: (recipeId) => set((s) => {
        if (!s.checkedIngredients[recipeId]) return {}
        const next = { ...s.checkedIngredients }
        delete next[recipeId]
        return { checkedIngredients: next }
      }),

      addRecipeToSlot: (day, slot, recipeId, servings = null) => set((s) => {
        const current = s.weekPlan[day]?.[slot] || []
        if (current.some(it => normalizeSlotItem(it)?.recipeId === recipeId)) return {}
        return {
          weekPlan: {
            ...s.weekPlan,
            [day]: {
              ...s.weekPlan[day],
              [slot]: [...current, { recipeId, servings }],
            },
          },
        }
      }),

      removeRecipeFromSlot: (day, slot, recipeId) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).filter(it => normalizeSlotItem(it)?.recipeId !== recipeId),
          },
        },
      })),

      // A meal the user typed themselves, with no recipe behind it. Not
      // deduplicated the way recipes are — "Restemat" on three different
      // days is three real meals, and even within one slot two custom
      // lines can be two different things to buy.
      addCustomToSlot: (day, slot, name, amount = '') => set((s) => {
        const trimmed = (name || '').trim()
        if (!trimmed) return {}
        return {
          weekPlan: {
            ...s.weekPlan,
            [day]: {
              ...s.weekPlan[day],
              [slot]: [
                ...(s.weekPlan[day]?.[slot] || []),
                { kind: 'custom', id: 'slot-' + makeId(), name: trimmed, amount: (amount || '').trim() },
              ],
            },
          },
        }
      }),

      // Matched on id rather than name, so two custom lines that happen to
      // read the same don't remove each other.
      /**
       * Move a typed-in meal to another day or slot.
       *
       * Separate from moveRecipeBetweenSlots because custom entries are
       * identified by their own `id`, not by a recipeId they don't have.
       * Without this, half the chips on the board would drag and the
       * other half wouldn't, which is a worse experience than neither.
       */
      moveCustomBetweenSlots: (fromDay, fromSlot, toDay, toSlot, customId) => set((s) => {
        if (fromDay === toDay && fromSlot === toSlot) return {}
        const fromList = s.weekPlan[fromDay]?.[fromSlot] || []
        const moved = fromList
          .map(normalizeSlotItem)
          .find(it => it?.kind === 'custom' && it.id === customId)
        if (!moved) return {}
        const fromAfter = fromList.filter(it => {
          const n = normalizeSlotItem(it)
          return !(n?.kind === 'custom' && n.id === customId)
        })
        const toList = s.weekPlan[toDay]?.[toSlot] || []
        return {
          weekPlan: {
            ...s.weekPlan,
            [fromDay]: { ...s.weekPlan[fromDay], [fromSlot]: fromAfter },
            [toDay]: { ...s.weekPlan[toDay], [toSlot]: [...toList, moved] },
          },
        }
      }),

      removeCustomFromSlot: (day, slot, id) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).filter(it => {
              const n = normalizeSlotItem(it)
              return !(n?.kind === 'custom' && n.id === id)
            }),
          },
        },
      })),

      moveRecipeBetweenSlots: (fromDay, fromSlot, toDay, toSlot, recipeId) => set((s) => {
        // Dropping a meal back where it started must do nothing. Without
        // this the "already in destination" branch below sees the item in
        // its own slot, removes it from the source and adds it nowhere —
        // the meal silently disappears. Harmless while nothing could drag
        // a placed meal; the moment one could, it would be the first thing
        // anyone hit by wobbling a chip and letting go.
        if (fromDay === toDay && fromSlot === toSlot) return {}

        const fromList = s.weekPlan[fromDay]?.[fromSlot] || []
        const moved = fromList
          .map(normalizeSlotItem)
          .find(it => it?.recipeId === recipeId)
        if (!moved) return {}
        const fromAfter = fromList.filter(it => normalizeSlotItem(it)?.recipeId !== recipeId)
        const toList = s.weekPlan[toDay]?.[toSlot] || []
        if (toList.some(it => normalizeSlotItem(it)?.recipeId === recipeId)) {
          // Already in destination — just remove from source
          return {
            weekPlan: {
              ...s.weekPlan,
              [fromDay]: { ...s.weekPlan[fromDay], [fromSlot]: fromAfter },
            },
          }
        }
        return {
          weekPlan: {
            ...s.weekPlan,
            [fromDay]: { ...s.weekPlan[fromDay], [fromSlot]: fromAfter },
            [toDay]: { ...s.weekPlan[toDay], [toSlot]: [...toList, moved] },
          },
        }
      }),

      // Set or clear the per-slot servings override for one recipe instance.
      // Pass `servings = null` to reset back to the household default.
      setSlotItemServings: (day, slot, recipeId, servings) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).map(it => {
              const n = normalizeSlotItem(it)
              if (!n || n.recipeId !== recipeId) return it
              return { ...n, servings: servings == null ? null : Math.max(1, Math.floor(servings)) }
            }),
          },
        },
      })),

      // Flip whether one planned meal contributes to the shopping list.
      // Used for meals covered by the week's batch cooking (or leftovers):
      // they stay visible in the plan but stop buying ingredients.
      toggleSlotItemShopping: (day, slot, recipeId) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).map(it => {
              const n = normalizeSlotItem(it)
              if (!n || n.recipeId !== recipeId) return it
              return { ...n, excludeFromShopping: !n.excludeFromShopping }
            }),
          },
        },
      })),

      // Append an empty extra day (extra-1, extra-2, …) to the plan.
      addPlannerDay: () => set((s) => {
        const existingExtras = Object.keys(s.weekPlan)
          .filter(k => k.startsWith('extra-'))
          .map(k => Number(k.slice(6)))
        const nextN = (existingExtras.length ? Math.max(...existingExtras) : 0) + 1
        const newDayKey = `extra-${nextN}`
        const slots = {}
        for (const slot of s.mealSlots) slots[slot] = []
        return {
          weekPlan: { ...s.weekPlan, [newDayKey]: slots },
        }
      }),

      // Remove an extra day (only `extra-*` keys can be removed; the seven
      // named days are permanent).
      removePlannerDay: (dayKey) => set((s) => {
        if (!dayKey?.startsWith('extra-')) return {}
        const { [dayKey]: _removed, ...rest } = s.weekPlan
        // Drop that day's note too — otherwise it would linger unseen and
        // reappear in exports for a day that no longer exists.
        const notes = normalizeWeekNotes(s.weekNotes)
        const { [dayKey]: _removedNote, ...restDays } = notes.days
        return { weekPlan: rest, weekNotes: { ...notes, days: restDays } }
      }),

      // Clearing the week clears its notes too — they describe that week's
      // prep, so leaving them behind on a fresh week would be misleading.
      clearWeekPlan: () => set((s) => ({
        weekPlan: emptyWeekPlan(),
        weekNotes: emptyWeekNotes(),
        batchCook: [],
        activeStarterPlanId: null,
        activeWeekName: null,
      })),

      // ── Settings ──
      // Default language is Norwegian, but the Settings page allows switching
      // to English or Swedish. All UI strings translate via i18n, and recipe
      // content falls back through `recipe.translations[lang]` when available.
      language: 'no',
      setLanguage: (lang) => set((s) => {
        const patch = { language: lang }
        // If the current week notes are still the untouched text a shipped
        // starter plan installed, follow the language switch — this is the
        // only place STARTER_PLANS text lives outside the planner grid, and
        // nothing else re-derives it. installStarterPlan picks its text
        // from i18n's language, not this store's `language` field, and the
        // two can disagree (they're set independently) — so rather than
        // assume which language the installed text is in, check the
        // current text against every language the plan ships. If it still
        // matches one of them untouched, it's stock and safe to swap; if
        // it matches none, the user has edited it and it's left alone.
        const plan = s.activeStarterPlanId
          ? STARTER_PLANS.find(p => p.id === s.activeStarterPlanId)
          : null
        if (plan) {
          const currentText = normalizeWeekNotes(s.weekNotes).week
          const stockVariants = [
            normalizeWeekNotes(plan.notes).week,
            ...Object.values(plan.translations || {}).map(t => normalizeWeekNotes(t?.notes).week),
          ]
          if (stockVariants.includes(currentText)) {
            const nextNotes = (lang && plan.translations?.[lang]?.notes) || plan.notes
            patch.weekNotes = normalizeWeekNotes(nextNotes)
          }
        }
        return patch
      }),

      familySize: 4,
      setFamilySize: (n) => set({ familySize: n }),

      // ── Allergens ──
      // Allergen ids the household avoids. Unlike the condition filter (a
      // browsing intent), an allergy is a persistent fact, so this lives in
      // settings and applies everywhere automatically — you can't forget to
      // re-apply it. Recipes containing any of these are hidden from the
      // recipe list and the planner's picker.
      avoidedAllergens: [],

      toggleAvoidedAllergen: (id) => set((s) => {
        const cur = s.avoidedAllergens || []
        return {
          avoidedAllergens: cur.includes(id) ? cur.filter(a => a !== id) : [...cur, id],
        }
      }),

      clearAvoidedAllergens: () => set({ avoidedAllergens: [] }),

      // "No honey (strict vegan)" from Make my week. Not an allergen, so it
      // doesn't hide recipes elsewhere; it is the answer Make my week starts
      // from next time (and the Settings toggle shows it).
      avoidHoney: false,
      setAvoidHoney: (v) => set({ avoidHoney: Boolean(v) }),

      // Make my week's calorie target (kcal a day per person, or null for
      // none) and meals a day (3, 2 or 1): the answers it starts from next
      // time. Out-of-range values are no target.
      planKcalTarget: null,
      planMeals: 3,
      setPlanPreferences: ({ kcal, meals }) => set(() => {
        const n = Math.round(Number(kcal))
        return {
          planKcalTarget: kcal != null && n >= 1000 && n <= 4000 ? n : null,
          planMeals: [1, 2, 3].includes(meals) ? meals : 3,
        }
      }),

      // Temporarily show everything (e.g. cooking for someone without the
      // allergy) without losing the saved profile. Not persisted — it resets
      // on reload so the safe default always comes back.
      allergenFilterPaused: false,
      setAllergenFilterPaused: (v) => set({ allergenFilterPaused: Boolean(v) }),

      /**
       * Rescale the whole current week to a different number of people.
       *
       * The household size doubles as the week's portion count, so it moves
       * to the target and every item left at the default follows it for
       * free. Tweaked items (a batch bouillon at 10, a dinner bumped to 3)
       * hold fixed numbers, so they get multiplied by the same ratio —
       * without that they'd stay stuck at the old crowd's amounts.
       *
       * Servings are whole numbers, so scaling rounds. Scaling out and back
       * (2 → 5 → 2) can therefore drift by a serving on odd ratios; the
       * numbers stay individually editable afterwards.
       */
      scaleWeek: (targetPortions) => set((s) => {
        const target = Math.max(1, Math.floor(targetPortions))
        const base = s.familySize || 4
        if (target === base) return {}
        const ratio = target / base
        return {
          weekPlan: scalePlanServings(s.weekPlan, ratio),
          batchCook: scaleBatchServings(s.batchCook, ratio),
          familySize: target,
        }
      }),

      /**
       * Scale using serving values captured before the user started
       * adjusting, rather than the week's current ones.
       *
       * Stepping 4 → 8 one press at a time would otherwise re-round on every
       * press and compound the error (a 13-portion batch drifted to 25
       * instead of 26). Replaying from the captured values keeps every
       * intermediate result an exact ratio of the original.
       *
       * Only the servings are replayed — the plan's structure is read live,
       * so a recipe added or removed mid-adjustment survives. Anything the
       * capture doesn't know about is left untouched rather than guessed at.
       *
       * `baseServings` is keyed `day__slot__recipeId`; `baseBatchServings` by
       * batch entry id. A null value means "was at the default", which stays
       * null and keeps following the household size.
       */
      scaleWeekFromBase: (baseServings, baseBatchServings, basePortions, targetPortions) => set((s) => {
        const target = Math.max(1, Math.floor(targetPortions))
        const base = basePortions || 4
        const ratio = target / base

        const plan = {}
        for (const [day, slots] of Object.entries(s.weekPlan || {})) {
          plan[day] = {}
          for (const [slot, items] of Object.entries(slots || {})) {
            plan[day][slot] = (items || []).map(it => {
              const n = normalizeSlotItem(it)
              if (!n) return it
              const key = `${day}__${slot}__${n.recipeId}`
              if (!(key in baseServings)) return it
              return { ...n, servings: scaleServingsValue(baseServings[key], ratio) }
            })
          }
        }

        const batch = (s.batchCook || []).map(b => {
          if (!b || b.kind !== 'recipe' || !(b.id in baseBatchServings)) return b
          return { ...b, servings: scaleServingsValue(baseBatchServings[b.id], ratio) }
        })

        return { weekPlan: plan, batchCook: batch, familySize: target }
      }),

      // 'metric' | 'us' — drives the preferred unit group in the recipe-form
      // dropdown and the metric ⇄ US conversion on the recipe view.
      units: 'metric',
      setUnits: (u) => set({ units: u }),

      // User-added unit labels. Plain strings (e.g. 'jar', 'sprig'). They
      // appear as extra options in the ingredient unit dropdown, stored as-is
      // (no conversion — just passthrough display).
      customUnits: [],
      addCustomUnit: (unit) => set((s) => {
        const clean = String(unit || '').trim()
        if (!clean) return {}
        if (s.customUnits.includes(clean)) return {}
        return { customUnits: [...s.customUnits, clean] }
      }),
      removeCustomUnit: (unit) => set((s) => ({
        customUnits: s.customUnits.filter(u => u !== unit),
      })),

      // ── Shopping List checked state ──
      checkedItems: {},
      toggleCheckedItem: (key) => set((s) => ({
        checkedItems: { ...s.checkedItems, [key]: !s.checkedItems[key] },
      })),
      clearCheckedItems: () => set({ checkedItems: {} }),

      // ── Custom (manually-added) shopping items ──
      // Items the user types in themselves, on top of what the meal plan
      // generates. Each carries a freeform `amount` string (e.g. "2 kg",
      // "a bunch") shown as-is. Checked/prune state reuses the same
      // checkedItems map, keyed by the item's id.
      customShoppingItems: [],
      addCustomShoppingItem: (name, amount) => set((s) => {
        const trimmed = (name || '').trim()
        if (!trimmed) return {}
        return {
          customShoppingItems: [
            ...s.customShoppingItems,
            { id: 'custom-' + makeId(), name: trimmed, amount: (amount || '').trim() },
          ],
        }
      }),
      removeCustomShoppingItem: (id) => set((s) => ({
        customShoppingItems: s.customShoppingItems.filter(i => i.id !== id),
      })),
      // Re-insert a previously-removed custom item verbatim (for undo).
      restoreCustomShoppingItem: (item) => set((s) => (
        !item || s.customShoppingItems.some(i => i.id === item.id)
          ? {}
          : { customShoppingItems: [...s.customShoppingItems, item] }
      )),

      // ── Dismissed (deleted) generated shopping items ──
      // Generated items the user removed from the current list, keyed by
      // item id. Pruned alongside checkedItems when the id leaves the list.
      dismissedShoppingItems: {},
      dismissShoppingItem: (id) => set((s) => ({
        dismissedShoppingItems: { ...s.dismissedShoppingItems, [id]: true },
      })),
      undismissShoppingItem: (id) => set((s) => {
        const next = { ...s.dismissedShoppingItems }
        delete next[id]
        return { dismissedShoppingItems: next }
      }),
      restoreDismissedShoppingItems: () => set({ dismissedShoppingItems: {} }),
      pruneDismissedShoppingItems: (validIds) => set((s) => {
        let changed = false
        const next = {}
        for (const id of Object.keys(s.dismissedShoppingItems)) {
          if (validIds.has(id)) next[id] = s.dismissedShoppingItems[id]
          else changed = true
        }
        return changed ? { dismissedShoppingItems: next } : {}
      }),

      // ── Dismissed single-recipe contributions ──
      // One recipe's contribution to an aggregated item removed, keyed
      // `${itemId}::${recipe}`. The item's total is recomputed from the
      // sources that remain.
      dismissedShoppingSources: {},
      dismissShoppingSource: (itemId, recipe) => set((s) => ({
        dismissedShoppingSources: { ...s.dismissedShoppingSources, [`${itemId}::${recipe}`]: true },
      })),
      undismissShoppingSource: (itemId, recipe) => set((s) => {
        const next = { ...s.dismissedShoppingSources }
        delete next[`${itemId}::${recipe}`]
        return { dismissedShoppingSources: next }
      }),
      restoreDismissedShoppingSources: () => set({ dismissedShoppingSources: {} }),
      pruneDismissedShoppingSources: (validKeys) => set((s) => {
        let changed = false
        const next = {}
        for (const k of Object.keys(s.dismissedShoppingSources)) {
          if (validKeys.has(k)) next[k] = s.dismissedShoppingSources[k]
          else changed = true
        }
        return changed ? { dismissedShoppingSources: next } : {}
      }),

      /**
       * Drop any checked-item entries whose ids are no longer present in
       * the active shopping list. Called whenever the user's weekplan or
       * family size changes — without this, old check marks accumulate
       * forever and inflate the "X of Y checked" counter past Y. Also
       * returns the current map untouched if nothing actually needs
       * pruning, so we don't write to IndexedDB on every render.
       */
      pruneCheckedItems: (validIds) => set((s) => {
        let changed = false
        const next = {}
        for (const id of Object.keys(s.checkedItems)) {
          if (validIds.has(id)) next[id] = s.checkedItems[id]
          else changed = true
        }
        return changed ? { checkedItems: next } : {}
      }),

      // ── Saved Shopping Lists ──
      savedShoppingLists: [],

      saveShoppingList: (name, items, portions = null) => set((s) => ({
        savedShoppingLists: [
          ...s.savedShoppingLists,
          {
            id: makeId(),
            name,
            savedAt: Date.now(),
            // Portions the list was generated for, so it can be re-scaled
            // when reused. Falls back to the household size.
            portions: portions ?? s.familySize ?? null,
            items,
            weekPlanSnapshot: s.weekPlan,
          },
        ],
      })),

      /**
       * Tick marks for saved lists, keyed by list id and then by item.
       *
       * Kept here rather than on the list itself so that re-scaling a
       * list to a different number of portions — which rebuilds every
       * item object — doesn't lose what has already been put in the
       * basket. The item key is `category::name`, which survives that
       * rebuild and is unique within one list.
       *
       * Separate from `checkedItems` on purpose: that map belongs to the
       * live generated list, and a saved list ticked in parallel with it
       * must not move its progress bar.
       */
      savedListChecks: {},
      toggleSavedListItem: (listId, key) => set((s) => {
        const forList = { ...(s.savedListChecks[listId] || {}) }
        if (forList[key]) delete forList[key]
        else forList[key] = true
        return { savedListChecks: { ...s.savedListChecks, [listId]: forList } }
      }),
      clearSavedListChecks: (listId) => set((s) => {
        const next = { ...s.savedListChecks }
        delete next[listId]
        return { savedListChecks: next }
      }),

      deleteSavedShoppingList: (id) => set((s) => {
        // Drop the tick marks with the list, or they sit in storage
        // forever keyed to a list that no longer exists.
        const checks = { ...s.savedListChecks }
        delete checks[id]
        return {
          savedShoppingLists: s.savedShoppingLists.filter(l => l.id !== id),
          savedListChecks: checks,
        }
      }),

      loadSavedShoppingList: (id) => {
        const s = get()
        return s.savedShoppingLists.find(l => l.id === id) || null
      },

      // ── Planner Templates ──
      plannerTemplates: [],

      savePlannerTemplate: (name) => set((s) => {
        // Count total meals in current plan
        let mealCount = 0
        for (const day of Object.values(s.weekPlan)) {
          for (const slotRecipes of Object.values(day)) {
            mealCount += slotRecipes.length
          }
        }
        return {
          plannerTemplates: [
            ...s.plannerTemplates,
            {
              id: makeId(),
              name,
              savedAt: Date.now(),
              plan: JSON.parse(JSON.stringify(s.weekPlan)),
              notes: normalizeWeekNotes(s.weekNotes),
              batchCook: JSON.parse(JSON.stringify(s.batchCook || [])),
              // How many people this week was built for, so it can be
              // reloaded at a different size later (same idea as the
              // portions stored on a saved shopping list).
              portions: s.familySize ?? null,
              mealCount,
            },
          ],
          // The week on screen is now "this saved week" — give it that title.
          activeWeekName: name,
        }
      }),

      /**
       * Overwrite an already-saved week with the current plan — same id and
       * name, fresh content and timestamp. The counterpart to
       * savePlannerTemplate for the "I tweaked a recipe I didn't like, now
       * update the saved week" flow, rather than always creating a new one.
       */
      updatePlannerTemplate: (id) => set((s) => {
        let mealCount = 0
        for (const day of Object.values(s.weekPlan)) {
          for (const slotRecipes of Object.values(day)) {
            mealCount += slotRecipes.length
          }
        }
        return {
          plannerTemplates: s.plannerTemplates.map((t) => t.id === id
            ? {
              ...t,
              savedAt: Date.now(),
              plan: JSON.parse(JSON.stringify(s.weekPlan)),
              notes: normalizeWeekNotes(s.weekNotes),
              batchCook: JSON.parse(JSON.stringify(s.batchCook || [])),
              portions: s.familySize ?? null,
              mealCount,
            }
            : t),
          // Updating in place doesn't rename anything, but the week on
          // screen is now unambiguously that saved week.
          activeWeekName: s.plannerTemplates.find(t => t.id === id)?.name ?? s.activeWeekName,
        }
      }),

      /**
       * Load a saved week. Pass `targetPortions` to cook it for a different
       * number of people than it was saved for — every tweaked serving is
       * scaled by the same ratio and the household size moves to the target.
       */
      loadPlannerTemplate: (id, targetPortions = null) => set((s) => {
        const template = s.plannerTemplates.find(t => t.id === id)
        if (!template) return {}
        // `notes` / `batchCook` / `portions` are absent on weeks saved before
        // those features — such weeks load with empty notes, no batch list,
        // and at their original (unscaled) servings.
        let plan = JSON.parse(JSON.stringify(template.plan))
        let batch = JSON.parse(JSON.stringify(template.batchCook || []))

        const base = template.portions ?? s.familySize ?? 4
        const target = targetPortions == null ? base : Math.max(1, Math.floor(targetPortions))
        if (target !== base && base > 0) {
          const ratio = target / base
          plan = scalePlanServings(plan, ratio)
          batch = scaleBatchServings(batch, ratio)
        }

        return {
          weekPlan: plan,
          weekNotes: normalizeWeekNotes(template.notes),
          batchCook: batch,
          familySize: target,
          // A saved personal template isn't a STARTER_PLANS entry, so its
          // notes have no other-language text to follow.
          activeStarterPlanId: null,
          activeWeekName: template.name || null,
        }
      }),

      /**
       * Installs a starter meal plan (one of the condition-focused sample
       * weeks shipped with the app). Replaces the current weekPlan with
       * a deep copy of the plan's week. The caller is responsible for
       * ensuring required recipe packs are installed first (the UI does
       * this in PacksPage before calling installStarterPlan).
       *
       * Also replaces the week's notes. A shipped plan may localize them
       * under translations[lang].notes (same convention as its name and
       * description); pass `lang` to pick that up, otherwise plan.notes is
       * used. This is the path both sample weeks and uploaded week JSON
       * files take, so tips travel with either.
       */
      installStarterPlan: (starterPlan, lang) => set((s) => {
        // Build a complete skeleton: every named day carries every meal
        // slot the user currently has, initialised to an empty array. Then
        // overlay the sample plan on top. This guarantees a structurally
        // complete weekPlan even when the sample only fills some of the
        // days (the FMD plan, for instance, only fills Mon–Fri) — leaving
        // a day undefined would otherwise crash the planner.
        const plan = {}
        for (const day of DAYS) {
          plan[day] = {}
          for (const slot of s.mealSlots) plan[day][slot] = []
        }
        const incoming = starterPlan.plan || {}
        for (const [day, slots] of Object.entries(incoming)) {
          if (!plan[day]) {
            plan[day] = {}
            for (const slot of s.mealSlots) plan[day][slot] = []
          }
          for (const [slot, items] of Object.entries(slots || {})) {
            plan[day][slot] = JSON.parse(JSON.stringify(items || []))
          }
        }
        const incomingNotes =
          (lang && starterPlan.translations?.[lang]?.notes) || starterPlan.notes
        // Batch entries may be localized the same way (their text lines are
        // free prose); fall back to the plan's canonical list.
        const incomingBatch =
          (lang && starterPlan.translations?.[lang]?.batchCook) || starterPlan.batchCook
        return {
          weekPlan: plan,
          weekNotes: normalizeWeekNotes(incomingNotes),
          batchCook: Array.isArray(incomingBatch) ? JSON.parse(JSON.stringify(incomingBatch)) : [],
          // Tracks provenance so setLanguage() can re-fetch these notes in
          // another language later. starterPlan.id is only set for the
          // shipped STARTER_PLANS entries (see PlannerTemplates.jsx) — an
          // uploaded week-plan file has no id, so this is null for those.
          activeStarterPlanId: starterPlan.id || null,
          // Shipped plans keep this null on purpose: their title is resolved
          // live from activeStarterPlanId so it follows the UI language.
          // Only an uploaded file — which has a name but no STARTER_PLANS
          // entry to look up — records its name here.
          activeWeekName: starterPlan.id ? null : (starterPlan.name || null),
          // Plans that carry fixed (non-null) servings were authored for a
          // specific household size — reset familySize to it so the people
          // control's next tap scales from that real baseline rather than
          // whatever size was left over from a previous week. Plans built
          // entirely from `servings: null` items don't declare `portions`
          // and leave familySize untouched, since those items already
          // follow it automatically with nothing to reset.
          ...(starterPlan.portions != null ? { familySize: starterPlan.portions } : {}),
        }
      }),

      deletePlannerTemplate: (id) => set((s) => ({
        plannerTemplates: s.plannerTemplates.filter(t => t.id !== id),
      })),

      // ── Recipe Packs ──
      installedPacks: {},

      /**
       * Installs OR updates a recipe pack. Replaces every recipe that
       * belongs to this pack (matched by recipe id) with the latest
       * version from `pack`, while leaving recipes from other packs and
       * user-created recipes completely untouched.
       *
       * Earlier this method only *appended* recipe ids that didn't
       * already exist, which meant tapping "Update" on the Packs page
       * silently bumped the version number but did NOT refresh the
       * recipe content — bug fixes in updated packs never reached users.
       */
      /*
       * `preserveUserEdits` is for the reload path only. Pack recipes
       * aren't persisted, so every load reinstalls them from the bundle —
       * but a recipe the user edited in-app (typically to attach a photo)
       * IS persisted, and rebuilding it from the bundle would throw that
       * edit away. On a genuine version change the flag is left false:
       * the newer pack content is meant to supersede local edits, which
       * is how an in-app photo gets retired once it's baked into the JSON.
       */
      installPack: (pack, { preserveUserEdits = false } = {}) => set((s) => {
        const packRecipeIds = new Set(pack.recipes.map(r => r.id))

        // Keep everything that isn't this pack's content:
        //  - user-created recipes (no sourcePackId)
        //  - recipes from other packs
        // Drop this pack's recipes — the ones still shipped are re-added
        // below from the fresh pack, and the ones it no longer ships are
        // pruned (a recipe removed in a new pack version should disappear,
        // not linger as an orphan). We match on sourcePackId rather than
        // just the new id set, since a removed id is absent from that set.
        const keptRecipes = s.recipes.filter(r =>
          !packRecipeIds.has(r.id) && r.sourcePackId !== pack.id
        )

        const userEditedRecipes = preserveUserEdits
          ? s.recipes.filter(r => r.sourcePackId === pack.id && r.userEdited && packRecipeIds.has(r.id))
          : []
        const userEditedIds = new Set(userEditedRecipes.map(r => r.id))

        const freshPackRecipes = pack.recipes
          .filter(r => !userEditedIds.has(r.id))
          .map(r => ({
            ...r,
            createdAt: r.createdAt || Date.now(),
            translations: r.translations || {},
            // Mark each recipe with the pack it came from so the UI can
            // filter "Show only Fredheim Reversal Protocol", etc.
            sourcePackId: pack.id,
          }))

        const allRecipeIds = pack.recipes.map(r => r.id)
        return {
          recipes: [...keptRecipes, ...userEditedRecipes, ...freshPackRecipes],
          installedPacks: {
            ...s.installedPacks,
            [pack.id]: {
              version: pack.version,
              name: pack.name,
              installedAt: Date.now(),
              recipeIds: allRecipeIds,
            },
          },
        }
      }),

      isPackInstalled: (packId) => {
        const s = get()
        return Boolean(s.installedPacks[packId])
      },

      getInstalledPackVersion: (packId) => {
        const s = get()
        return s.installedPacks[packId]?.version ?? null
      },

      // ── Onboarding tutorial ──
      // false  → tutorial will auto-open on next AppShell mount.
      // true   → already seen / dismissed; stays out of the way until the
      //          user manually replays it from Settings.
      // Despite the name, this is the "first run is over" flag: it gates
      // the what's-new announcements so a brand-new user isn't met by a
      // stack of modals. The tutorial no longer opens by itself (its
      // content had gone stale), so the language picker is what sets it.
      hasSeenTutorial: false,
      setHasSeenTutorial: (value) => set(() => ({ hasSeenTutorial: !!value })),

      // Whether the user has ever been asked which language they want.
      // Existing installs are migrated to true (v9) — they already chose,
      // or are happily running the default, and shouldn't be stopped by a
      // question on next launch.
      hasChosenLanguage: false,
      setHasChosenLanguage: (value) => set(() => ({ hasChosenLanguage: !!value })),

      // The intro tour ("Welcome to Fredheim") opens by itself once, right
      // after the language question. Existing installs are migrated to
      // true (v10): they know the app already. Replayable from Settings.
      hasSeenIntroTour: false,
      setHasSeenIntroTour: (value) => set(() => ({ hasSeenIntroTour: !!value })),

      // ── Recipe favorites ──
      // Array of recipe ids the user has starred. Toggling is idempotent
      // so the UI can call it without checking current state first.
      favoriteRecipes: [],
      toggleFavorite: (recipeId) => set((s) => {
        if (!recipeId) return {}
        const list = s.favoriteRecipes || []
        const exists = list.includes(recipeId)
        return {
          favoriteRecipes: exists
            ? list.filter(id => id !== recipeId)
            : [...list, recipeId],
          // A favourite is not also "not for me".
          ...(exists ? {} : { dislikedRecipes: (s.dislikedRecipes || []).filter(id => id !== recipeId) }),
        }
      }),

      // ── Recipes the user doesn't want ──
      // "Not for me": Make my week never picks these. The recipe stays in
      // the list and can still be planned by hand.
      dislikedRecipes: [],
      toggleDisliked: (recipeId) => set((s) => {
        if (!recipeId) return {}
        const list = s.dislikedRecipes || []
        const exists = list.includes(recipeId)
        return {
          dislikedRecipes: exists ? list.filter(id => id !== recipeId) : [...list, recipeId],
          ...(exists ? {} : { favoriteRecipes: (s.favoriteRecipes || []).filter(id => id !== recipeId) }),
        }
      }),

      // ── Salt level ──
      // 'low' (the recipes as written) or 'standard' (healthy adults, WHO
      // < 5 g salt a day). Low by default, so nobody's recipes change
      // without them choosing it. See src/utils/saltLevel.js.
      saltLevel: DEFAULT_SALT_LEVEL,
      setSaltLevel: (level) => set({ saltLevel: normalizeSaltLevel(level) }),
      // Per-recipe choice from the recipe page: { [recipeId]: level }. Only
      // a level different from the global one is stored, so picking the
      // global value (or resetting) clears the override.
      recipeSaltLevels: {},
      setRecipeSaltLevel: (recipeId, level) => set((s) => {
        if (!recipeId) return {}
        const { [recipeId]: _old, ...rest } = s.recipeSaltLevels || {}
        if (!SALT_LEVELS.includes(level) || level === normalizeSaltLevel(s.saltLevel)) return { recipeSaltLevels: rest }
        return { recipeSaltLevels: { ...rest, [recipeId]: level } }
      }),
      clearRecipeSaltLevel: (recipeId) => set((s) => {
        const { [recipeId]: _old, ...rest } = s.recipeSaltLevels || {}
        return { recipeSaltLevels: rest }
      }),

      // ── "What's new" tracker ──
      // Array of news ids the user has already dismissed. Anything in
      // src/data/whatsNew.js whose id is NOT in here will pop up next
      // time the AppShell mounts. We start with null to distinguish
      // "uninitialised" from "explicitly empty" — the WhatsNewModal
      // initialises this on first load so brand-new users don't get
      // bombarded with historical announcements.
      seenNewsIds: null,
      markNewsSeen: (ids) => set((s) => {
        const additions = Array.isArray(ids) ? ids : [ids]
        const existing = Array.isArray(s.seenNewsIds) ? s.seenNewsIds : []
        const merged = Array.from(new Set([...existing, ...additions]))
        return { seenNewsIds: merged }
      }),

      // ── Recipes list filter / search state ──
      // Persisted so that whenever the user comes back to the Recipes page
      // — from Settings, the Planner, the Shopping list, a recipe detail,
      // anywhere — the filters they applied are still there. This also
      // means the recipe Back button can safely navigate to "/" without
      // losing context.
      recipesView: {
        category: 'All',
        pack: 'All',
        // Health conditions to filter by, AND-combined: a recipe must match
        // every selected condition. Empty = no condition filter. (Replaces the
        // old single `condition` string so people with several conditions can
        // find food that suits all of them.)
        conditions: [],
        search: '',
        sortBy: 'newest',
        // Belongs here with the rest of the filters, not in component
        // state: it used to be local, so opening a favourite and pressing
        // Back dropped you out of your own favourites list — the one
        // filter that didn't survive the trip every other one did.
        favoritesOnly: false,
      },
      setRecipesView: (partial) => set((s) => ({
        recipesView: { ...s.recipesView, ...partial },
      })),
      resetRecipesView: () => set(() => ({
        recipesView: {
          category: 'All', pack: 'All', conditions: [], search: '',
          sortBy: 'newest', favoritesOnly: false,
        },
      })),
    }),
    {
      name: 'menu-planner-store',
      // IndexedDB-backed (via idb-keyval) instead of the default
      // localStorage. Gives us ~50% of free disk (GBs) instead of ~5 MB.
      storage: createJSONStorage(() => idbStorage),
      // Persist everything EXCEPT the temporary "show allergens anyway"
      // escape hatch. That one must reset on reload so the protective
      // filter is always back on by default — a paused allergen filter
      // silently surviving a restart is exactly the unsafe case.
      partialize: (state) => {
        const { allergenFilterPaused, ...persisted } = state
        return {
          ...persisted,
          // Pack recipes are deliberately NOT persisted. They carry ~34 MB of
          // base64 photos, and persist rewrites the whole blob on every state
          // change — so ticking one ingredient checkbox was serialising 34 MB
          // and blocking the main thread for ~300 ms; typing five characters
          // in the search box (filter state is persisted) cost ~1.9 s and
          // 172 MB of writes.
          //
          // Nothing is lost by dropping them: they're rebuilt from the bundle
          // on load by AutoInstallDefaultPack, and installPack already
          // replaces every pack recipe wholesale on each pack update — so a
          // persisted copy never outlives the next version bump anyway.
          //
          // User-created recipes (no sourcePackId) and pack recipes the
          // user has edited in-app ARE persisted — those are the only
          // recipe data that has to survive a reload. An edited pack
          // recipe carries its photo, so this stays small: the 34 MB is
          // the ~240 untouched ones, which never get written.
          recipes: (persisted.recipes || []).filter(r => !r.sourcePackId || r.userEdited),
        }
      },
      version: 11,
      migrate: (persistedState, version) => {
        // v11: Make my week no longer plans a snack. Someone who had "3 meals
        // + snack" keeps planMeals 3; a Snack row they already have stays.
        if (version < 11) delete persistedState.planSnack
        // v10: the intro tour opens once for new users. Anyone already
        // using the app has found their way around, so it stays closed
        // for them (they can still take it from Settings).
        if (version < 10) {
          if (typeof persistedState.hasSeenIntroTour !== 'boolean') {
            persistedState.hasSeenIntroTour = true
          }
        }
        // v8: the recipe-category filter/picker had "Middag" (Main) but no
        // "Lunsj" (Lunch) option — Lunch was simply missing from the default
        // list, not a translation bug. Backfill it for existing users so the
        // fix isn't only visible on brand-new installs; slotted right after
        // Breakfast to match the natural Breakfast → Lunch → Main ordering.
        if (version < 8) {
          if (Array.isArray(persistedState.recipeCategories) && !persistedState.recipeCategories.includes('Lunch')) {
            const i = persistedState.recipeCategories.indexOf('Breakfast')
            const at = i === -1 ? 0 : i + 1
            persistedState.recipeCategories = [
              ...persistedState.recipeCategories.slice(0, at),
              'Lunch',
              ...persistedState.recipeCategories.slice(at),
            ]
          }
        }
        if (version < 2) {
          if (persistedState.recipes) {
            persistedState.recipes = persistedState.recipes.map(r => ({
              ...r,
              translations: r.translations || {},
            }))
          }
          persistedState.language = persistedState.language || 'no'
          persistedState.savedShoppingLists = persistedState.savedShoppingLists || []
          persistedState.plannerTemplates = persistedState.plannerTemplates || []
        }
        // Versions 3 and 4 share a single migration that restores stable
        // English canonical keys for meal slots and categories. v3 wrote
        // Norwegian strings directly; v4 reverses that so the language
        // switcher can drive display-time translation.
        if (version < 4) {
          const SLOT_TO_EN = {
            Frokost: 'Breakfast',
            Lunsj: 'Lunch',
            Middag: 'Dinner',
            Kveldsmat: 'Supper',
            Mellommåltid: 'Snack',
          }
          const CAT_TO_EN = {
            Frokost: 'Breakfast',
            Lunsj: 'Lunch',
            Middag: 'Dinner',
            Kveldsmat: 'Supper',
            Brød: 'Bread',
            Grøt: 'Porridge',
            Pålegg: 'Spreads',
            Mellommåltid: 'Snack',
            Dessert: 'Dessert',
            Suppe: 'Soup',
            Salat: 'Salad',
            Saus: 'Sauce',
            Annet: 'Other',
            Main: 'Dinner',
          }
          persistedState.language = persistedState.language || 'no'
          if (Array.isArray(persistedState.mealSlots)) {
            persistedState.mealSlots = persistedState.mealSlots.map(s => SLOT_TO_EN[s] || s)
          }
          if (Array.isArray(persistedState.recipeCategories)) {
            persistedState.recipeCategories = persistedState.recipeCategories.map(c => CAT_TO_EN[c] || c)
          }
          if (Array.isArray(persistedState.recipes)) {
            persistedState.recipes = persistedState.recipes.map(r => ({
              ...r,
              category: CAT_TO_EN[r.category] || r.category,
            }))
          }
          if (persistedState.weekPlan) {
            const newPlan = {}
            for (const [day, slots] of Object.entries(persistedState.weekPlan)) {
              newPlan[day] = {}
              for (const [slot, ids] of Object.entries(slots || {})) {
                newPlan[day][SLOT_TO_EN[slot] || slot] = ids
              }
            }
            persistedState.weekPlan = newPlan
          }
        }
        // v9: anyone already using the app has a language — either picked
        // in Settings or the default they've been reading all along.
        // Asking them now would interrupt, not help, so the first-run
        // language question is marked answered for every existing install.
        if (version < 9) {
          if (typeof persistedState.hasChosenLanguage !== 'boolean') {
            persistedState.hasChosenLanguage = true
          }
        }
        // v7: existing users have already discovered the app — silently
        // mark the tutorial as seen so they aren't ambushed by an
        // onboarding pop-up on their next visit. Brand-new accounts start
        // with the default false and will see the tutorial automatically.
        if (version < 7) {
          if (typeof persistedState.hasSeenTutorial !== 'boolean') {
            persistedState.hasSeenTutorial = true
          }
        }
        // v6: backfill sourcePackId on recipes installed from packs before
        // we started tracking it. Uses installedPacks[packId].recipeIds to
        // know which recipe belongs to which pack.
        if (version < 6) {
          if (Array.isArray(persistedState.recipes) && persistedState.installedPacks) {
            const recipeIdToPackId = {}
            for (const [packId, info] of Object.entries(persistedState.installedPacks)) {
              for (const rid of info?.recipeIds || []) {
                recipeIdToPackId[rid] = packId
              }
            }
            persistedState.recipes = persistedState.recipes.map(r => ({
              ...r,
              sourcePackId: r.sourcePackId || recipeIdToPackId[r.id] || null,
            }))
          }
        }
        // v5: each slot used to hold an array of recipe-id strings; now it
        // holds { recipeId, servings } objects so portions can be overridden
        // per planner instance.
        if (version < 5) {
          function migrateSlots(plan) {
            if (!plan) return plan
            const out = {}
            for (const [day, slots] of Object.entries(plan)) {
              out[day] = {}
              for (const [slot, items] of Object.entries(slots || {})) {
                out[day][slot] = (items || []).map(it =>
                  typeof it === 'string' ? { recipeId: it, servings: null } : it
                )
              }
            }
            return out
          }
          if (persistedState.weekPlan) {
            persistedState.weekPlan = migrateSlots(persistedState.weekPlan)
          }
          if (Array.isArray(persistedState.plannerTemplates)) {
            persistedState.plannerTemplates = persistedState.plannerTemplates.map(t => ({
              ...t,
              plan: migrateSlots(t.plan),
            }))
          }
          if (Array.isArray(persistedState.savedShoppingLists)) {
            persistedState.savedShoppingLists = persistedState.savedShoppingLists.map(l => ({
              ...l,
              weekPlanSnapshot: migrateSlots(l.weekPlanSnapshot),
            }))
          }
        }
        return persistedState
      },
    }
  )
)

export default useStore
export { DAYS, DEFAULT_MEAL_SLOTS }
// (normalizeSlotItem and getPlanDayKeys are already exported above)

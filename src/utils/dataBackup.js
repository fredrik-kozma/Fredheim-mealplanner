/**
 * Export and import everything the user has made.
 *
 * All of this app's data lives in one browser's IndexedDB. There is no
 * account behind it, so "clear site data", a reinstall, or a browser
 * deciding to reclaim storage takes the lot — someone's recipes, their
 * year of planned weeks, their nutrition log. A file they can keep is
 * the only thing standing between that and starting over.
 *
 * What is NOT in a backup, deliberately:
 *
 *   - Pack recipes the user never touched. They are rebuilt from the
 *     bundle on every load and would add tens of megabytes of base64
 *     photos to a file whose job is to be small enough to email. A pack
 *     recipe the user HAS edited is included, because that edit is their
 *     work and nothing else would bring it back.
 *   - `installedPacks`. It records pack versions, and restoring it onto
 *     a fresh install would tell the auto-installer a pack is already
 *     present when its recipes are not there yet.
 *   - Running timers, and which screen was last open. Nobody restores a
 *     backup to get a half-finished timer back.
 *
 * An imported file is untrusted input: it arrives from a disk, a chat
 * app, or an email, and may be corrupt, truncated, or simply not ours.
 * validateBackup therefore whitelists known keys, type-checks every one,
 * and strips anything it cannot vouch for, rather than trusting the file
 * to be shaped the way we wrote it.
 */

import { SALT_LEVELS } from './saltLevel.js'

export const BACKUP_APP = 'fredheim-meal-planner'
export const BACKUP_VERSION = 1

/**
 * The fields a backup carries, and what each must look like.
 * Anything not named here is dropped on both export and import, which is
 * what makes unknown fields a non-event rather than a failure.
 */
const FIELDS = {
  // The user's work
  recipes: 'array',
  weekPlan: 'object',
  weekNotes: 'object',
  batchCook: 'array',
  activeStarterPlanId: 'stringOrNull',
  activeWeekName: 'stringOrNull',
  plannerTemplates: 'array',
  favoriteRecipes: 'array',
  dislikedRecipes: 'array',
  nutritionLog: 'object',
  savedShoppingLists: 'array',
  savedListChecks: 'object',
  // Shopping in progress — ticked items and the user's own added lines
  checkedItems: 'object',
  customShoppingItems: 'array',
  dismissedShoppingItems: 'object',
  dismissedShoppingSources: 'object',
  checkedIngredients: 'object',
  // Settings
  language: 'string',
  familySize: 'number',
  units: 'string',
  customUnits: 'array',
  mealSlots: 'array',
  recipeCategories: 'array',
  avoidedAllergens: 'array',
  avoidHoney: 'boolean',
  planKcalTarget: 'kcalTarget',
  planMeals: 'mealsPerDay',
  planSnack: 'boolean',
  saltLevel: 'saltLevel',
  recipeSaltLevels: 'saltLevelMap',
  hasSeenTutorial: 'boolean',
  hasChosenLanguage: 'boolean',
  hasSeenIntroTour: 'boolean',
}

const MAX_DEPTH = 12

/**
 * Keep only what survives a round trip through JSON, and nothing weird.
 *
 * Drops functions and undefined, refuses NaN and Infinity (which JSON
 * turns into null and would quietly corrupt a quantity), and rejects
 * anything that is not a plain array or object — a Date, a Map, a class
 * instance. Depth-capped so a maliciously or accidentally nested file
 * cannot blow the stack while being checked.
 *
 * Returns the cleaned value, or the `DROP` sentinel.
 */
const DROP = Symbol('drop')

function clean(value, depth = 0) {
  if (depth > MAX_DEPTH) return DROP
  if (value === null) return null
  const type = typeof value
  if (type === 'string') return value
  if (type === 'boolean') return value
  if (type === 'number') return Number.isFinite(value) ? value : DROP
  if (Array.isArray(value)) {
    const out = []
    for (const entry of value) {
      const c = clean(entry, depth + 1)
      if (c !== DROP) out.push(c)
    }
    return out
  }
  if (type === 'object') {
    // Plain objects only. Object.create(null) is fine; anything with a
    // custom prototype is not something we wrote.
    const proto = Object.getPrototypeOf(value)
    if (proto !== Object.prototype && proto !== null) return DROP
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (typeof k !== 'string') continue
      const c = clean(v, depth + 1)
      if (c !== DROP) out[k] = c
    }
    return out
  }
  return DROP
}

function matchesKind(value, kind) {
  switch (kind) {
    case 'array': return Array.isArray(value)
    case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value)
    case 'string': return typeof value === 'string'
    case 'stringOrNull': return value === null || typeof value === 'string'
    case 'number': return typeof value === 'number' && Number.isFinite(value)
    case 'boolean': return typeof value === 'boolean'
    // Only a level the app knows: an unknown one would silently mean low.
    case 'saltLevel': return SALT_LEVELS.includes(value)
    // { recipeId: level } from the recipe page, every level a known one.
    case 'saltLevelMap': return matchesKind(value, 'object') && Object.values(value).every(v => SALT_LEVELS.includes(v))
    // Make my week's calorie target: none, or a whole number in its range.
    case 'kcalTarget': return value === null || (Number.isInteger(value) && value >= 1000 && value <= 4000)
    case 'mealsPerDay': return [1, 2, 3].includes(value)
    default: return false
  }
}

/** A recipe is the user's own, or a pack recipe they have edited. */
export function isUsersOwnRecipe(recipe) {
  return Boolean(recipe) && (!recipe.sourcePackId || recipe.userEdited)
}

/**
 * Build the backup object from a persisted-state snapshot.
 * Takes plain state so it works both from the live store and from a raw
 * IndexedDB read — the error screen cannot assume the store still works.
 */
export function buildBackup(state, now = new Date()) {
  const data = {}
  for (const [key, kind] of Object.entries(FIELDS)) {
    const raw = key === 'recipes'
      ? (Array.isArray(state?.recipes) ? state.recipes.filter(isUsersOwnRecipe) : [])
      : state?.[key]
    if (raw === undefined) continue
    const cleaned = clean(raw)
    if (cleaned === DROP || !matchesKind(cleaned, kind)) continue
    data[key] = cleaned
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data,
  }
}

export function backupFilename(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `fredheim-backup-${stamp}.json`
}

/** Hand the file to the browser. Returns the filename used. */
export function downloadBackup(backup, now = new Date()) {
  const filename = backupFilename(now)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return filename
}

function countMeals(weekPlan) {
  let n = 0
  for (const day of Object.values(weekPlan || {})) {
    for (const items of Object.values(day || {})) {
      if (Array.isArray(items)) n += items.length
    }
  }
  return n
}

/**
 * Check a parsed file before anything is replaced.
 *
 * @returns { ok, reason?, data?, summary?, dropped? }
 *   `dropped` names fields that were present but malformed, so the
 *   confirm screen can say what will not come back rather than letting
 *   the user discover it afterwards.
 */
export function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, reason: 'notBackup' }
  }
  if (parsed.app !== BACKUP_APP) return { ok: false, reason: 'notBackup' }
  if (typeof parsed.version !== 'number' || !Number.isFinite(parsed.version)) {
    return { ok: false, reason: 'notBackup' }
  }
  // A file from a future version may carry shapes this build would
  // mishandle. Older ones are fine: unknown fields are already ignored.
  if (parsed.version > BACKUP_VERSION) return { ok: false, reason: 'newerVersion' }
  if (!parsed.data || typeof parsed.data !== 'object' || Array.isArray(parsed.data)) {
    return { ok: false, reason: 'notBackup' }
  }

  const data = {}
  const dropped = []
  for (const [key, kind] of Object.entries(FIELDS)) {
    if (!(key in parsed.data)) continue
    const cleaned = clean(parsed.data[key])
    if (cleaned === DROP || !matchesKind(cleaned, kind)) { dropped.push(key); continue }
    data[key] = cleaned
  }

  // Recipes get a second pass: each one must at least have an id and a
  // title, or it is a row the app cannot render.
  if (Array.isArray(data.recipes)) {
    const before = data.recipes.length
    data.recipes = data.recipes.filter(r => r && typeof r.id === 'string' && typeof r.title === 'string')
    if (data.recipes.length !== before && !dropped.includes('recipes')) dropped.push('recipes')
  }

  if (Object.keys(data).length === 0) return { ok: false, reason: 'empty' }

  return {
    ok: true,
    data,
    dropped,
    summary: {
      recipes: data.recipes?.length || 0,
      meals: countMeals(data.weekPlan),
      weekTemplates: data.plannerTemplates?.length || 0,
      favourites: data.favoriteRecipes?.length || 0,
      nutritionDays: Object.keys(data.nutritionLog || {}).length,
      shoppingLists: data.savedShoppingLists?.length || 0,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
    },
  }
}

/**
 * Merge an imported recipe list with the pack recipes already loaded.
 *
 * Pack recipes are not in the backup, so they have to be kept from what
 * is in memory — except where the backup holds an edited copy of the
 * same recipe, which supersedes the bundled one.
 */
export function mergeRecipes(currentRecipes, importedRecipes) {
  const imported = Array.isArray(importedRecipes) ? importedRecipes : []
  const importedIds = new Set(imported.map(r => r.id))
  const keptPackRecipes = (currentRecipes || []).filter(
    r => r.sourcePackId && !r.userEdited && !importedIds.has(r.id),
  )
  return [...keptPackRecipes, ...imported]
}

/**
 * Read the persisted state straight out of IndexedDB.
 *
 * For the crash screen, which must not depend on the store module — the
 * store may be exactly what is broken. Mirrors what zustand's persist
 * middleware writes through idb-keyval.
 */
export function readPersistedState(dbName = 'menu-planner-db', storeName = 'keyval', key = 'menu-planner-store') {
  return new Promise((resolve, reject) => {
    let open
    try {
      open = indexedDB.open(dbName)
    } catch (err) {
      reject(err); return
    }
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const db = open.result
      if (!db.objectStoreNames.contains(storeName)) { resolve(null); return }
      try {
        const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(key)
        req.onerror = () => reject(req.error)
        req.onsuccess = () => {
          const raw = req.result
          if (!raw) { resolve(null); return }
          // idb-keyval stores a structured clone, but a string is what
          // some persist configurations write — handle both.
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
          resolve(parsed?.state ?? null)
        }
      } catch (err) {
        reject(err)
      }
    }
  })
}

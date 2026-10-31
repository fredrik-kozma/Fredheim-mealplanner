/**
 * Ticks for one cooking session: which ingredients and steps of a recipe are
 * done. Kept in localStorage per recipe and dropped 12 hours after the last
 * tick, so a recipe cooked again another day starts clean. Indexed by position
 * so a tick survives a language switch or a change of servings.
 *
 * A browser that refuses storage (private mode, quota) still ticks: the caller
 * keeps the state, it just isn't remembered.
 */

export const COOKING_TICKS_KEY = 'fredheim-cooking-ticks'
export const TICKS_TTL_MS = 12 * 60 * 60 * 1000

const browserStorage = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

const emptyTicks = () => ({ ingredients: [], steps: [] })

const indexes = list => (Array.isArray(list) ? list.filter(Number.isInteger) : [])

const isExpired = (entry, now) => !(now - entry?.updatedAt < TICKS_TTL_MS)

function readAll(storage) {
  try {
    const all = JSON.parse(storage?.getItem(COOKING_TICKS_KEY))
    return all && typeof all === 'object' && !Array.isArray(all) ? all : {}
  } catch {
    return {}
  }
}

/** { ingredients: [index…], steps: [index…] } for a recipe, empty once expired. */
export function loadTicks(recipeId, { storage = browserStorage(), now = Date.now() } = {}) {
  const entry = readAll(storage)[recipeId]
  if (isExpired(entry, now)) return emptyTicks()
  return { ingredients: indexes(entry.ingredients), steps: indexes(entry.steps) }
}

/** Stores a recipe's ticks (none = forgets it) and clears out expired recipes. */
export function saveTicks(recipeId, ticks, { storage = browserStorage(), now = Date.now() } = {}) {
  if (!storage) return
  const kept = {}
  for (const [id, entry] of Object.entries(readAll(storage))) {
    if (id !== recipeId && !isExpired(entry, now)) kept[id] = entry
  }
  if (ticks.ingredients.length || ticks.steps.length) {
    kept[recipeId] = { ...ticks, updatedAt: now }
  }
  try {
    if (Object.keys(kept).length) storage.setItem(COOKING_TICKS_KEY, JSON.stringify(kept))
    else storage.removeItem(COOKING_TICKS_KEY)
  } catch { /* private mode or full: ticks last until the page closes */ }
}

/** The ticks with one row flipped. kind is 'ingredients' or 'steps'. */
export function toggleTick(ticks, kind, index) {
  const list = ticks[kind]
  return {
    ...ticks,
    [kind]: list.includes(index) ? list.filter(i => i !== index) : [...list, index],
  }
}

/** The ticks with one kind cleared. */
export function resetTicks(ticks, kind) {
  return { ...ticks, [kind]: [] }
}

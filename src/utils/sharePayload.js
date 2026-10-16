/**
 * What goes inside a share link, and how to read it back.
 *
 * Two kinds travel: a week plan and a recipe. A week is sent whole,
 * in the same shape installStarterPlan() already accepts, so importing a
 * shared week is the identical code path as opening a saved week file —
 * no second importer to keep in step with the first.
 *
 * A recipe is sent one of two ways, and the difference matters:
 *   - by id, when it came from a pack. Both people have the pack, so the
 *     link only needs to name the recipe. 25 characters.
 *   - whole, when the sender wrote it themselves. There is no pack to
 *     look it up in, so the link has to carry it. The photo is dropped;
 *     84 KB of base64 image cannot go in a URL, and silently sending a
 *     link that no chat app will accept is worse than sending the words.
 */

export const SHARE_WEEK = 'w'
export const SHARE_RECIPE = 'r'

/** Current payload version. Bump only on a breaking shape change. */
const V = 1

export function buildWeekPayload({ plan, notes, batchCook, portions, name }) {
  return {
    v: V,
    k: SHARE_WEEK,
    name: name || null,
    plan,
    notes,
    batchCook: batchCook || [],
    portions: portions ?? null,
  }
}

/**
 * A pack recipe shares as a pointer; anything else travels in full.
 * `sourcePackId` is what marks a recipe as having come from a pack — the
 * same field the store uses to decide what to refresh on pack update.
 */
export function buildRecipePayload(recipe) {
  if (recipe.sourcePackId && !recipe.userEdited) {
    return { v: V, k: SHARE_RECIPE, id: recipe.id, packId: recipe.sourcePackId, title: recipe.title }
  }
  const { imageUrl, ...rest } = recipe
  return { v: V, k: SHARE_RECIPE, recipe: { ...rest, id: undefined }, hadPhoto: Boolean(imageUrl) }
}

/**
 * Sanity-check a decoded payload before anything acts on it. A link is
 * untrusted input: it arrives from a chat app, may be truncated, and may
 * simply be someone else's URL. Returns a reason string on failure so the
 * import screen can say what is actually wrong instead of "invalid".
 */
export function validateSharePayload(p) {
  if (!p || typeof p !== 'object') return { ok: false, reason: 'unreadable' }
  if (p.v !== V) return { ok: false, reason: 'version' }
  if (p.k === SHARE_WEEK) {
    if (!p.plan || typeof p.plan !== 'object') return { ok: false, reason: 'unreadable' }
    return { ok: true, kind: SHARE_WEEK }
  }
  if (p.k === SHARE_RECIPE) {
    if (p.id && typeof p.id === 'string') return { ok: true, kind: SHARE_RECIPE, byId: true }
    if (p.recipe && typeof p.recipe === 'object' && Array.isArray(p.recipe.ingredients)) {
      return { ok: true, kind: SHARE_RECIPE, byId: false }
    }
    return { ok: false, reason: 'unreadable' }
  }
  return { ok: false, reason: 'unreadable' }
}

/** How many meals a shared week actually contains, for the preview. */
export function countPayloadMeals(plan) {
  let n = 0
  for (const slots of Object.values(plan || {})) {
    for (const items of Object.values(slots || {})) {
      if (Array.isArray(items)) n += items.length
    }
  }
  return n
}

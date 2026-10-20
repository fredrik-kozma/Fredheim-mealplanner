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
export const SHARE_SHOPPING = 's'

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
 * A shopping list travels in the same shape a saved list already uses,
 * minus two things.
 *
 * `sources` — the per-recipe breakdown behind each amount — travels,
 * because "where did 320 g of almonds come from" is most of what makes
 * a shared list usable rather than just a list of words. The titles are
 * the sender's, in the sender's language: the recipient may not have
 * those recipes at all, so there is nothing to look them up in.
 *
 * `weekPlanSnapshot` is dropped: it is the sender's week, not a
 * shopping list, and the breakdown already carries the part of it that
 * explains the amounts.
 *
 * Amounts stay as a number plus a unit rather than a formatted "400 g",
 * precisely so the recipient can view a list built for 4 at their own 6.
 *
 * A shared list is a snapshot. The sender can change their week
 * afterwards and this link will not follow — which is right for
 * shopping, where you buy what you were sent, but the import screen
 * says so rather than letting people assume otherwise.
 */
export function buildShoppingPayload({ name, portions, groups }) {
  // Recipe titles are pulled out into one table and referenced by index.
  // The same handful of titles repeats across most items — six recipes
  // behind forty-five ingredients — so writing each one once is the
  // difference between the breakdown being affordable in a link and not.
  const titles = []
  const indexOf = (title) => {
    const at = titles.indexOf(title)
    return at === -1 ? titles.push(title) - 1 : at
  }

  const payloadGroups = groups.map(g => ({
    c: g.category,
    i: g.items.map(it => {
      if (it.custom) return { n: it.name, q: it.quantity ?? '', x: 1 }
      const item = { n: it.name, q: it.quantity ?? null, u: it.unit || '' }
      // [recipeIndex, quantity, unit] — positional, because this is the
      // part that repeats most and every key name is paid for per entry.
      if (Array.isArray(it.sources) && it.sources.length > 0) {
        item.s = it.sources.map(src => [indexOf(src.recipe), src.quantity ?? 0, src.unit || ''])
      }
      return item
    }),
  }))

  return {
    v: V,
    k: SHARE_SHOPPING,
    name: name || null,
    portions: portions ?? null,
    r: titles,
    groups: payloadGroups,
  }
}

/**
 * Back to the saved-list item shape the viewer and store expect.
 *
 * Restoring `sources` does double duty: it is what the recipient reads
 * to see which recipe an amount came from, and it also puts re-scaling
 * on its exact branch — the viewer scales each recipe's contribution
 * and re-combines, instead of multiplying one already-summed number.
 */
export function shoppingPayloadToGroups(payload) {
  const titles = payload.r || []
  return (payload.groups || []).map(g => ({
    category: g.c,
    items: (g.i || []).map(it => {
      if (it.x) {
        return { id: 'shared-' + Math.random().toString(36).slice(2, 10), name: it.n, quantity: it.q, unit: '', custom: true }
      }
      const item = { name: it.n, quantity: it.q, unit: it.u || '' }
      if (Array.isArray(it.s)) {
        item.sources = it.s.map(([ri, q, u]) => ({
          recipe: titles[ri] ?? '',
          quantity: q,
          unit: u || '',
        }))
      }
      return item
    }),
  }))
}

export function countShoppingItems(payload) {
  return (payload.groups || []).reduce((n, g) => n + (g.i?.length || 0), 0)
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
  if (p.k === SHARE_SHOPPING) {
    if (!Array.isArray(p.groups) || p.groups.length === 0) return { ok: false, reason: 'unreadable' }
    if (countShoppingItems(p) === 0) return { ok: false, reason: 'empty' }
    return { ok: true, kind: SHARE_SHOPPING }
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

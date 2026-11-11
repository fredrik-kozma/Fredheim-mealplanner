/** A4 sheet of allergen cards. Sizes are millimetres. */

export const COLS = 2
export const ROWS = 6
export const PER_PAGE = COLS * ROWS

export const PAGE_W = 210
export const PAGE_H = 297

/** Near the requested 7 × 4 cm; a little wider so the name and the list fit. */
export const CARD_W = 74
export const CARD_H = 40
export const GAP_X = 6
export const GAP_Y = 3

export const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X
export const GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP_Y
export const MARGIN_X = (PAGE_W - GRID_W) / 2
export const MARGIN_TOP = 12
export const FOOTER_GAP = 4
export const DISCLAIMER_H = 10

/**
 * White laid over the whole photo. Kept near half so the food stays visible.
 * Legibility comes from the frosted panel behind the words, not from washing
 * the picture out.
 */
export const PHOTO_VEIL = 0.45

/**
 * Type sizes in points. The name starts at the max and shrinks only until it
 * fits on two lines. Allergen lines start at the max and shrink until the
 * list fits the space under the name.
 */
export const CARD_TYPE = {
  nameMaxPt: 17,
  nameMinPt: 9,
  allergenMaxPt: 18,
  allergenMinPt: 7.5,
}

export const LAYOUT = {
  cols: COLS,
  rows: ROWS,
  perPage: PER_PAGE,
  pageW: PAGE_W,
  pageH: PAGE_H,
  cardW: CARD_W,
  cardH: CARD_H,
  gapX: GAP_X,
  gapY: GAP_Y,
  gridW: GRID_W,
  gridH: GRID_H,
  marginX: MARGIN_X,
  marginTop: MARGIN_TOP,
  footerGap: FOOTER_GAP,
  disclaimerH: DISCLAIMER_H,
}

export function sheetFitsOnA4() {
  const bottom = MARGIN_TOP + GRID_H + FOOTER_GAP + DISCLAIMER_H
  return MARGIN_X >= 8 && bottom <= PAGE_H - 4
}

function cleanId(id) {
  return typeof id === 'string' && id ? id : null
}

/**
 * Slots are recipe ids or null. Length is always a whole number of pages,
 * and the last page always has a free slot so a "+" stays on screen.
 * Fully empty trailing pages (beyond that one) are dropped.
 */
export function normalizeSlots(slots) {
  let list = (Array.isArray(slots) ? slots : []).map(cleanId)
  while (list.length > PER_PAGE && list.slice(-PER_PAGE).every((id) => !id)) {
    list = list.slice(0, -PER_PAGE)
  }
  if (!list.length) list = Array(PER_PAGE).fill(null)
  while (list.length % PER_PAGE !== 0) list.push(null)
  if (list.slice(-PER_PAGE).every(Boolean)) list.push(...Array(PER_PAGE).fill(null))
  return list
}

export function pagesOf(slots) {
  const list = normalizeSlots(slots)
  const pages = []
  for (let i = 0; i < list.length; i += PER_PAGE) pages.push(list.slice(i, i + PER_PAGE))
  return pages
}

/** Pages that contain at least one recipe. Blank trailing pages are not printed. */
export function printablePages(slots) {
  return pagesOf(slots).filter((page) => page.some(Boolean))
}

export function setSlot(slots, index, recipeId) {
  const list = normalizeSlots(slots)
  const at = Math.max(0, index | 0)
  while (list.length <= at) list.push(null)
  list[at] = cleanId(recipeId)
  return normalizeSlots(list)
}

/** Clear one slot. The hole stays, so the other cards keep their places. */
export function removeSlot(slots, index) {
  return setSlot(slots, index, null)
}

/**
 * Put recipes into the next empty slots, in the order given.
 * New pages are added when the current sheet runs out.
 */
export function fillSlots(slots, recipeIds) {
  const list = normalizeSlots(slots)
  const incoming = (recipeIds || []).map(cleanId).filter(Boolean)
  let i = 0
  for (let s = 0; s < list.length && i < incoming.length; s += 1) {
    if (!list[s]) list[s] = incoming[i++]
  }
  while (i < incoming.length) list.push(incoming[i++])
  return normalizeSlots(list)
}

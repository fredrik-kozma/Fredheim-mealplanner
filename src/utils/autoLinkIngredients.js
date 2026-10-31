/**
 * Link legacy free-text ingredient rows to dictionary ids when the match
 * is exact or high-confidence (same rules as resolveIngredientId, plus
 * "Name, note" split and folded equality).
 */
import { fold } from './ingredientSearch.js'

function buildNameMap(dictionary) {
  const seen = new Map()
  const claim = (word, id) => {
    const k = fold(word)
    if (!k) return
    const prev = seen.get(k)
    seen.set(k, prev === undefined || prev === id ? id : null)
  }
  for (const e of dictionary.entries || []) {
    for (const n of Object.values(e.names || {})) claim(n, e.id)
    for (const n of Object.values(e.singular || {})) claim(n, e.id)
    for (const list of Object.values(e.synonyms || {})) for (const s of list || []) claim(s, e.id)
  }
  for (const [k, id] of seen) if (id === null) seen.delete(k)
  return seen
}

/**
 * @returns {{ row: object, linked: boolean, id: string|null, note: string|null }}
 */
export function autoLinkRow(row, dictionary, nameMap = null) {
  const map = nameMap || buildNameMap(dictionary)
  if (row?.ingredient && (dictionary.entries || []).some((e) => e.id === row.ingredient)) {
    const cleaned = { ...row }
    delete cleaned.notInDb
    return { row: cleaned, linked: true, id: row.ingredient, note: row.note || null }
  }
  const raw = String(row?.name || '').trim()
  if (!raw) return { row, linked: false, id: null, note: null }

  const comma = raw.indexOf(',')
  const head = comma >= 0 ? raw.slice(0, comma).trim() : raw
  const rest = comma >= 0 ? raw.slice(comma + 1).trim() : ''

  const id = map.get(fold(raw)) || map.get(fold(head)) || null
  if (!id) return { row, linked: false, id: null, note: null }

  const entry = (dictionary.entries || []).find((e) => e.id === id)
  // Keep the typed language's standard name if we can guess; else keep head
  const next = {
    ...row,
    ingredient: id,
    name: row.name, // leave display name; form can refresh via standardName
    note: row.note || rest || undefined,
  }
  delete next.notInDb
  if (!next.note) delete next.note
  return { row: next, linked: true, id, note: next.note || null, entry }
}

/**
 * Link every row in a recipe's ingredients array. Pure — returns a new array.
 */
export function autoLinkIngredientRows(rows, dictionary) {
  const map = buildNameMap(dictionary)
  return (rows || []).map((row) => autoLinkRow(row, dictionary, map).row)
}

export { buildNameMap }

/**
 * The standard ingredient dictionary, and the few questions the app asks it.
 *
 * Built-in pack rows carry `ingredient: <dictionary id>` next to `name`
 * (the standard name in that row's language) and an optional `note` for
 * the leftover prep or usage text ("diced", "for frying"). Rows the user
 * typed in their own recipes have no id and no note; every helper here
 * falls back to the row's own `name` for those, so both shapes work
 * everywhere.
 */

import DICTIONARY from '../data/ingredientDictionary.json'
import { normalizeUnit } from './unitNormalizer.js'
import { displayedAmount } from './formatQuantity.js'

const BY_ID = new Map(DICTIONARY.entries.map(e => [e.id, e]))

const key = (s) => String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()

/*
 * Exact standard names and synonyms, every language, -> id. Used to give a
 * row without an id (a user's own recipe) the same shopping line as the
 * pack rows it names. A word that two entries both claim is left out, so
 * an ambiguous name falls back to plain name matching rather than being
 * filed under the wrong ingredient.
 */
const BY_NAME = (() => {
  const seen = new Map()
  const claim = (word, id) => {
    const k = key(word)
    if (!k) return
    const prev = seen.get(k)
    seen.set(k, prev === undefined || prev === id ? id : null)
  }
  for (const e of DICTIONARY.entries) {
    for (const n of Object.values(e.names || {})) claim(n, e.id)
    for (const n of Object.values(e.singular || {})) claim(n, e.id)
    for (const list of Object.values(e.synonyms || {})) for (const s of list || []) claim(s, e.id)
  }
  for (const [k, id] of seen) if (id === null) seen.delete(k)
  return seen
})()

export function dictionaryEntry(id) {
  return (id && BY_ID.get(id)) || null
}

/**
 * The dictionary id a row stands for: its own `ingredient` when that is a
 * known id, otherwise an exact match of its name (whole, or the part before
 * the first comma: "Carrots, grated") against standard names and synonyms.
 * Null when nothing matches exactly — no guessing.
 */
export function resolveIngredientId(row) {
  if (!row) return null
  if (row.ingredient && BY_ID.has(row.ingredient)) return row.ingredient
  const name = key(row.name)
  if (!name) return null
  return BY_NAME.get(name) || BY_NAME.get(name.split(',')[0].trim()) || null
}

/** Standard name for an id in `lang`, falling back to English. */
export function standardName(id, lang = 'en') {
  const e = dictionaryEntry(id)
  if (!e) return null
  return e.names?.[lang] || e.names?.en || null
}

// Units a thing is counted in — the only ones where the name itself says
// how many ("1 Gulrot", "2 Gulrøtter"). "200 g Gulrøtter" stays plural.
const COUNT_UNITS = new Set(['', 'none', 'pcs'])

/**
 * The row's name, in the singular when the amount shown is one or less of
 * a counted thing: "½ Sitron", "1 Gulrot". Only a dictionary name is ever
 * swapped — a name the user typed is theirs and is shown as typed.
 *
 * `row` is a recipe row ({ name, ingredient }) or a shopping item
 * ({ name, ingredientId }); `options` is formatQuantity's ({ roundUpWhole }),
 * so the name agrees with the number printed next to it.
 */
export function nameForAmount(row, lang, quantity, unit, options = {}) {
  const name = row?.name || ''
  // A shopping total of pieces comes back as a one-part array.
  if (Array.isArray(quantity)) {
    if (quantity.length !== 1) return name
    ;({ quantity, unit } = quantity[0])
  }
  if (!COUNT_UNITS.has(normalizeUnit(unit))) return name
  const shown = displayedAmount(quantity, unit, options)
  if (shown === null || shown > 1) return name
  const e = dictionaryEntry(row.ingredient || row.ingredientId || resolveIngredientId(row))
  const singular = e?.singular?.[lang]
  return singular && name === e.names?.[lang] ? singular : name
}

/**
 * Measured by the spoon — spices, salt, powders, the dictionary's tsp/tbsp
 * entries — so a small volume shows as spoons, never as millilitres.
 */
export function prefersSpoons(id) {
  const unit = dictionaryEntry(id)?.preferredUnit
  return unit === 'tsp' || unit === 'tbsp'
}

/** Store aisle for an id, or null when the id is unknown. */
export function dictionaryAisle(id) {
  return dictionaryEntry(id)?.aisle || null
}

/**
 * Synonyms for an id in one language ("gulrot" for Gulrøtter), so search
 * finds a recipe by the word people actually type.
 */
export function ingredientSynonyms(id, lang = 'en') {
  return dictionaryEntry(id)?.synonyms?.[lang] || []
}

/**
 * One row as plain text: "Carrots, diced". For anywhere that can't style
 * the note separately — share text, the undo toast, search.
 */
export function ingredientLabel(row) {
  if (!row?.name) return ''
  return row.note ? `${row.name}, ${row.note}` : row.name
}

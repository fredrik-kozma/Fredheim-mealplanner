/**
 * The 14 substances that must be declared for food served in Norway.
 *
 * Norway's matinformasjonsforskriften points at Annex II of EU Regulation
 * 1169/2011. Mattilsynet lists the same 14 (kornslag som inneholder gluten,
 * skalldyr, egg, fisk, peanøtter, soyabønner, melk, nøtter, selleri, sennep,
 * sesamfrø, svoveldioksid og sulfitter, lupin, bløtdyr) and requires the
 * specific cereal or nut to be named. On the kitchen cards the owner asked
 * for a shorter gluten line: "Gluten" when wheat, rye, barley, spelt or
 * khorasan is definite, and "traces of gluten" when the only source is oats
 * or an ingredient that may only carry traces. Nuts are still named.
 * Swedish names follow the Swedish text of the same annex
 * (Livsmedelsverket). Display strings live in the i18n catalogues.
 *
 * Hit codes:
 *   gluten:trace
 *   cereal:wheat|rye|barley|oats|spelt|khorasan
 *   nut:almond|hazelnut|walnut|cashew|pecan|brazil|pistachio|macadamia
 *   crustaceans, eggs, fish, peanuts, soy, milk, celery, mustard, sesame,
 *   sulphites, lupin, molluscs
 */

export const CEREAL_CODES = ['wheat', 'rye', 'barley', 'oats', 'spelt', 'khorasan']

export const NUT_CODES = [
  'almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'brazil', 'pistachio', 'macadamia',
]

/** Annex order, with cereals and nuts expanded so a card can name each one. */
export const SIMPLE_BEFORE_NUTS = ['crustaceans', 'eggs', 'fish', 'peanuts', 'soy', 'milk']
export const SIMPLE_AFTER_NUTS = ['celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs']

export const DEFINITE_CEREALS = ['wheat', 'rye', 'barley', 'spelt', 'khorasan']

export const HIT_ORDER = [
  'gluten:trace',
  ...CEREAL_CODES.map((id) => `cereal:${id}`),
  ...SIMPLE_BEFORE_NUTS,
  ...NUT_CODES.map((id) => `nut:${id}`),
  ...SIMPLE_AFTER_NUTS,
]

const HIT_SET = new Set(HIT_ORDER)

export function isHitCode(code) {
  return HIT_SET.has(code)
}

export function sortHits(hits) {
  const set = new Set(hits || [])
  return HIT_ORDER.filter((code) => set.has(code))
}

export function sanitizeHits(hits) {
  return sortHits(hits)
}

/**
 * Lines for one card. A definite gluten cereal (wheat, rye, barley, spelt,
 * khorasan) is just "Gluten". Oats, or a trace-only source, is "traces of
 * gluten" — and a definite cereal hides that second line. Nuts still name
 * the nut.
 *
 * `labels` is built from i18n:
 *   { gluten, glutenTrace, nuts, nutNames: {almond…}, crustaceans, … }
 */
export function formatAllergenLines(hits, labels) {
  const set = new Set(hits || [])
  const lines = []
  const definite = DEFINITE_CEREALS.some((id) => set.has(`cereal:${id}`))
  const trace = set.has('cereal:oats') || set.has('gluten:trace')
  if (definite) lines.push({ icon: 'cereal', text: labels.gluten })
  else if (trace) lines.push({ icon: 'cereal', text: labels.glutenTrace })
  for (const code of SIMPLE_BEFORE_NUTS) {
    if (set.has(code)) lines.push({ icon: code, text: labels[code] })
  }
  const nuts = NUT_CODES.filter((id) => set.has(`nut:${id}`))
  if (nuts.length) {
    lines.push({
      icon: 'nuts',
      text: `${labels.nuts}: ${nuts.map((id) => labels.nutNames[id]).join(', ')}`,
    })
  }
  for (const code of SIMPLE_AFTER_NUTS) {
    if (set.has(code)) lines.push({ icon: code, text: labels[code] })
  }
  return lines
}

/** What a card actually says. "None of the 14" only when nothing was found. */
export function cardStatements(result, labels, lang) {
  const lines = formatAllergenLines(result?.hits, labels)
  const notes = []
  const extras = [
    ...(result?.reviews || []),
    ...(result?.unmapped || []).map((row) => ({ ...row, key: 'unmapped' })),
  ]
  for (const row of extras) {
    const name = row.names?.[lang] || row.names?.en || row.names?.no || row.names?.sv || ''
    notes.push(labels.review(row.key, name))
  }
  return {
    lines,
    notes,
    none: lines.length === 0 && notes.length === 0,
  }
}

/**
 * Dictionary ingredient search for the recipe-form picker.
 * Accent- and case-insensitive; prefix preferred; small-typo fuzzy;
 * current language ranked first.
 */

const LANGS = ['en', 'no', 'sv']

export function fold(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[åÅäÄ]/g, 'a')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Levenshtein distance, capped (early exit when > max). */
export function editDistance(a, b, max = 2) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev = new Array(b.length + 1)
  const cur = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    let rowMin = cur[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      if (cur[j] < rowMin) rowMin = cur[j]
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

function collectTerms(entry) {
  const terms = []
  for (const lang of LANGS) {
    const name = entry.names?.[lang]
    if (name) terms.push({ text: name, folded: fold(name), lang, kind: 'name' })
    const singular = entry.singular?.[lang]
    if (singular) terms.push({ text: singular, folded: fold(singular), lang, kind: 'singular' })
    for (const s of entry.synonyms?.[lang] || []) {
      if (s) terms.push({ text: s, folded: fold(s), lang, kind: 'synonym' })
    }
  }
  return terms
}

/**
 * Build a searchable index once per dictionary load.
 * @param {{ entries: object[] }} dictionary
 */
export function buildIngredientIndex(dictionary) {
  return (dictionary?.entries || []).map((entry) => ({
    id: entry.id,
    preferredUnit: entry.preferredUnit || 'g',
    aisle: entry.aisle || null,
    names: entry.names || {},
    singular: entry.singular || {},
    terms: collectTerms(entry),
  }))
}

/**
 * Ranked search.
 * @returns {Array<{ id, label, preferredUnit, score, matchLang, matchText }>}
 */
export function searchIngredients(index, query, lang = 'en', limit = 12) {
  const q = fold(query)
  if (!q) return []
  const primary = (lang || 'en').slice(0, 2)
  const scored = []

  for (const item of index) {
    let best = null
    for (const term of item.terms) {
      let score = null
      if (term.folded === q) score = 100
      else if (term.folded.startsWith(q)) score = 80 - Math.min(20, term.folded.length - q.length)
      else if (term.folded.includes(q)) score = 50
      else if (q.length >= 3) {
        const d = editDistance(q, term.folded, 2)
        if (d <= 2 && term.folded.length >= 3) score = 35 - d * 10
      }
      if (score == null) continue
      if (term.lang === primary) score += 15
      else score += 5
      if (term.kind === 'name') score += 3
      else if (term.kind === 'singular') score += 2
      if (!best || score > best.score) {
        best = { score, matchLang: term.lang, matchText: term.text }
      }
    }
    if (!best) continue
    const label =
      item.names[primary] || item.names.en || item.names.no || item.names.sv || item.id
    scored.push({
      id: item.id,
      label,
      preferredUnit: item.preferredUnit,
      aisle: item.aisle,
      score: best.score,
      matchLang: best.matchLang,
      matchText: best.matchText,
      names: item.names,
    })
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
  return scored.slice(0, limit)
}

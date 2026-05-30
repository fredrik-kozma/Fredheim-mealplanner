import { normalizeUnit, convertToBase, smartConvert, TO_BASE } from './unitNormalizer'

const STRIP_WORDS = [
  // English
  'fresh', 'raw', 'frozen', 'cooked', 'dried', 'chopped', 'diced', 'sliced',
  'minced', 'grated', 'peeled', 'whole', 'organic', 'large', 'small', 'medium',
  'ripe', 'crushed', 'ground', 'roasted', 'toasted', 'shredded', 'trimmed',
  // Norwegian
  'fersk', 'rå', 'frossen', 'kokt', 'tørket', 'hakket', 'skivet', 'revet',
  'skrelt', 'hel', 'moden', 'knust', 'malt', 'stekt', 'ristet',
  // Swedish
  'färsk', 'fryst', 'torkad', 'hackad', 'skivad', 'riven',
  'skalad', 'mogen', 'krossad', 'malen', 'rostad', 'rostade',
]

const STRIP_PATTERN = new RegExp(
  `\\b(${STRIP_WORDS.join('|')})\\b`,
  'gi'
)

export function normalizeIngredientName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(STRIP_PATTERN, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

export function ingredientSimilarity(a, b) {
  const na = normalizeIngredientName(a)
  const nb = normalizeIngredientName(b)
  if (!na || !nb) return 0
  if (na === nb) return 1.0

  // Only treat one name as a "variant" of the other when the shorter is
  // the FIRST WORD(s) of the longer. That catches the merges we want —
  //   "garlic"  + "garlic clove"           → merge
  //   "tomato"  + "tomato sauce"           → merge
  //   "onion"   + "onion yellow norwegian" → merge
  // …while *not* merging things that share a tail word or substring:
  //   "potato"  + "sweet potato"           → KEEP separate (head noun differs)
  //   "milk"    + "oat milk"               → KEEP separate
  //   "egg"     + "eggplant"               → KEEP separate (eggplant doesn't start with "egg ")
  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na]
  if (longer.startsWith(shorter + ' ')) return 0.9

  const dist = levenshtein(na, nb)
  const maxLen = Math.max(na.length, nb.length)
  if (dist <= 2 && maxLen > 3) return 0.8
  if (dist <= 3 && maxLen > 5) return 0.65
  return 0
}

function sumQuantitiesInBase(items) {
  // items: array of { quantity, unit }
  // Returns { quantity, unit: 'ml'|'g' } iff every item is convertible to
  // the SAME base type. Returns null otherwise so the caller can fall
  // through to the per-unit display path. This is critical: previously
  // unconvertible items (clove, pcs, head, …) were silently filtered out
  // and the sum of just the convertible ones was returned. That caused
  // "garlic = 1.7 ml" and similar nonsense when a recipe used cloves and
  // another used tsp.
  if (items.length === 0) return null

  const baseResults = []
  for (const { quantity, unit } of items) {
    const canonicalUnit = normalizeUnit(unit)
    if (!quantity || quantity === 0) continue
    const base = convertToBase(quantity, canonicalUnit)
    if (!base) return null // mixed convertible + count units → defer
    baseResults.push(base)
  }

  if (baseResults.length === 0) return null

  // All must be same base unit type (g vs ml can't be combined).
  const baseType = baseResults[0].unit
  if (!baseResults.every(r => r.unit === baseType)) return null

  const total = baseResults.reduce((sum, r) => sum + r.quantity, 0)
  return { quantity: total, unit: baseType }
}

// Format a number for human display: integer if whole, otherwise up to
// 2 decimals with trailing zeros stripped.
function fmtNum(n) {
  if (n === 0 || !isFinite(n)) return '0'
  const rounded = Math.round(n * 100) / 100
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * Build a clean display string for a group of ingredient quantities that
 * cannot all be combined into one base unit.
 *
 *   [ {5,clove}, {2,tsp}, {1,tbsp}, {10,g} ]   →   "5 clove + 20 ml + 10 g"
 *
 * Strategy: bucket items by base type (weight / volume / count). Weight
 * and volume buckets each get summed in their base unit and re-rendered
 * via smartConvert. Count units stay separate per unit type (clove vs
 * pcs vs head) so the user always sees an honest number.
 */
function buildMixedQuantityString(items) {
  let totalMass = 0     // grams
  let totalVolume = 0   // ml
  const countByUnit = {}

  for (const { quantity, unit } of items) {
    if (!quantity || quantity === 0) continue
    const canonical = normalizeUnit(unit) || 'pcs'
    const base = convertToBase(quantity, canonical)
    if (base?.unit === 'g') totalMass += base.quantity
    else if (base?.unit === 'ml') totalVolume += base.quantity
    else {
      countByUnit[canonical] = (countByUnit[canonical] || 0) + quantity
    }
  }

  const parts = []
  for (const [u, q] of Object.entries(countByUnit)) {
    parts.push(`${fmtNum(q)} ${u}`)
  }
  if (totalMass > 0) {
    const smart = smartConvert(totalMass, 'g')
    parts.push(`${fmtNum(smart.quantity)} ${smart.unit}`)
  }
  if (totalVolume > 0) {
    const smart = smartConvert(totalVolume, 'ml')
    parts.push(`${fmtNum(smart.quantity)} ${smart.unit}`)
  }
  return parts.join(' + ')
}

export function groupIngredients(ingredientList) {
  // ingredientList: array of { quantity, unit, name, recipeTitle }
  const groups = []
  const matched = new Set()

  for (let i = 0; i < ingredientList.length; i++) {
    if (matched.has(i)) continue

    const pivot = ingredientList[i]
    const group = [pivot]
    matched.add(i)

    for (let j = i + 1; j < ingredientList.length; j++) {
      if (matched.has(j)) continue
      const candidate = ingredientList[j]
      const sim = ingredientSimilarity(pivot.name, candidate.name)
      if (sim >= 0.8) {
        group.push(candidate)
        matched.add(j)
      }
    }

    // Determine displayName: most common original name
    const nameCount = {}
    for (const item of group) {
      const n = item.name.toLowerCase().trim()
      nameCount[n] = (nameCount[n] || 0) + 1
    }
    const displayName = Object.entries(nameCount).sort((a, b) => b[1] - a[1])[0][0]

    // Try to sum quantities
    const withQty = group.filter(g => g.quantity && g.quantity > 0)
    let totalQuantity = null
    let totalUnit = null

    if (withQty.length > 0) {
      const base = sumQuantitiesInBase(withQty)
      if (base) {
        const smart = smartConvert(base.quantity, base.unit)
        totalQuantity = smart.quantity
        totalUnit = smart.unit
      } else {
        // Items span more than one base type (e.g. clove + g, or g + ml).
        // Render each base type as one clean summed entry plus separate
        // entries per count unit so the shopper sees an honest total.
        totalQuantity = buildMixedQuantityString(withQty)
        totalUnit = ''
      }
    }

    groups.push({
      normalizedName: normalizeIngredientName(pivot.name),
      displayName,
      items: group,
      totalQuantity,
      totalUnit,
    })
  }

  return groups
}

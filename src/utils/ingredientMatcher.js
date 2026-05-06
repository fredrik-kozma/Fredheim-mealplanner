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
  if (na.includes(nb) || nb.includes(na)) return 0.9
  const dist = levenshtein(na, nb)
  const maxLen = Math.max(na.length, nb.length)
  if (dist <= 2 && maxLen > 3) return 0.8
  if (dist <= 3 && maxLen > 5) return 0.65
  return 0
}

function sumQuantitiesInBase(items) {
  // items: array of { quantity, unit }
  // Returns { quantity, unit: 'ml'|'g' } or null if units can't be combined
  if (items.length === 0) return null

  const baseResults = items
    .map(({ quantity, unit }) => {
      const canonicalUnit = normalizeUnit(unit)
      if (!quantity || quantity === 0) return null
      return convertToBase(quantity, canonicalUnit)
    })
    .filter(Boolean)

  if (baseResults.length === 0) return null

  // All must be same base unit type
  const baseType = baseResults[0].unit
  if (!baseResults.every(r => r.unit === baseType)) return null

  const total = baseResults.reduce((sum, r) => sum + r.quantity, 0)
  return { quantity: total, unit: baseType }
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
        // Can't convert to base — just sum same-unit items, list others separately
        const byUnit = {}
        for (const item of withQty) {
          const u = normalizeUnit(item.unit) || 'pcs'
          if (!byUnit[u]) byUnit[u] = 0
          byUnit[u] += item.quantity
        }
        const entries = Object.entries(byUnit)
        if (entries.length === 1) {
          totalQuantity = entries[0][1]
          totalUnit = entries[0][0]
        } else {
          // Multiple incompatible units — format as combined string
          totalQuantity = entries.map(([u, q]) => {
            const rounded = Math.round(q * 100) / 100
            return `${rounded} ${u}`
          }).join(' + ')
          totalUnit = ''
        }
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

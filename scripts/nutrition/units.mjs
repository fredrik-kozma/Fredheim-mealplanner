// Convert (quantity, unit, ingredient_name) → grams.
//
// Most units have a fixed gram value. For volume units (ml, dl, l, tsp, tbsp, cup),
// we apply a density factor based on the ingredient: oils ~0.92, salt/sugar ~1.2,
// flours ~0.55, most produce/water ~1.0.

const ML_PER_UNIT = {
  ml: 1, l: 1000, dl: 100,
  tsp: 5, tbsp: 15, cup: 240,
  pinch: 0.3, dash: 0.6,
  envelope: 7, // ~7g for a packet of yeast/baking powder
}

const GRAMS_PER_UNIT = {
  g: 1, kg: 1000,
}

// Average gram weights for "piece" units, defaulting to a generic value.
// Refined per ingredient in `pieceWeight()` below.
const DEFAULT_PIECE_GRAMS = {
  pcs: 100,        // generic vegetable
  piece: 100,
  clove: 3,        // garlic clove
  medium: 110,     // medium vegetable / fruit
  large: 180,
  small: 70,
  big: 180,
  head: 700,       // head of cabbage / lettuce
  stalk: 40,       // celery stalk
  leave: 1,        // single leaf
  handful: 30,
}

// Density (g/ml) for common ingredient categories.
function density(name) {
  const n = (name || '').toLowerCase()
  // Oils ~0.92
  if (/\b(oil|olive oil|coconut oil|sesame oil|canola)\b/.test(n)) return 0.92
  // Honey, syrups ~1.4
  if (/honey|syrup|maple/.test(n)) return 1.4
  // Salt ~1.2 (granular)
  if (/\bsalt\b/.test(n)) return 1.2
  // Sugar ~0.85 (granular)
  if (/\bsugar|sukrin|erythritol\b/.test(n)) return 0.85
  // Flours, oats, starches ~0.55 (when measured by volume — packed loosely)
  if (/flour|oats|starch|cornstarch|fibre husk|baking powder|baking soda|cocoa/.test(n)) return 0.55
  // Yeast ~0.5
  if (/yeast/.test(n)) return 0.5
  // Nuts/seeds chopped or whole ~0.65
  if (/cashew|almond|walnut|pecan|seed|peanut|hazelnut|pine nut|chia|flax/.test(n)) return 0.65
  // Coconut shredded ~0.4
  if (/coconut, shredded|shredded coconut/.test(n)) return 0.4
  // Tomato puree/paste ~1.05
  if (/tomato (puree|paste)/.test(n)) return 1.05
  // Soy sauce, vinegar, juice ~1.0
  if (/soy sauce|vinegar|juice|water|milk|broth|stock|bouillon/.test(n)) return 1.0
  // Default ~1.0 (water-like)
  return 1.0
}

/** Per-ingredient piece weight overrides. */
function pieceWeight(name, unit) {
  const n = (name || '').toLowerCase()

  if (unit === 'clove') return 3
  if (unit === 'stalk') return 40
  if (unit === 'leave') return 1
  if (unit === 'head') {
    if (/cabbage/.test(n)) return 1500
    if (/garlic/.test(n)) return 50
    if (/lettuce/.test(n)) return 360
    return 700
  }
  if (unit === 'handful') {
    if (/herb|parsley|coriander|basil|dill|spinach|kale|salad/.test(n)) return 25
    if (/nut|cashew|almond|walnut/.test(n)) return 30
    return 30
  }

  // Sized produce
  if (/onion/.test(n)) {
    if (unit === 'small') return 70
    if (unit === 'large' || unit === 'big') return 180
    return 110 // medium / pcs
  }
  if (/garlic/.test(n)) return 3   // assume "clove-like" for any piece unit
  if (/carrot/.test(n)) {
    if (unit === 'small') return 50
    if (unit === 'large' || unit === 'big') return 100
    return 70
  }
  if (/potato/.test(n)) {
    if (unit === 'small') return 100
    if (unit === 'large' || unit === 'big') return 280
    return 170
  }
  if (/sweet potato/.test(n)) {
    if (unit === 'small') return 100
    if (unit === 'large') return 250
    return 150
  }
  if (/tomato$|^tomato\b/.test(n)) {
    if (/cherry/.test(n)) return 17
    if (unit === 'small') return 90
    if (unit === 'large') return 180
    return 120
  }
  if (/cherry tomato/.test(n)) return 17
  if (/cucumber/.test(n)) return 200
  if (/bell pepper|capsicum/.test(n)) return 120
  if (/lemon\b/.test(n)) return 60
  if (/lime\b/.test(n)) return 50
  if (/orange\b/.test(n)) return 130
  if (/apple\b/.test(n)) return 180
  if (/banana\b/.test(n)) return 120
  if (/pear\b/.test(n)) return 180
  if (/avocado/.test(n)) return 150
  if (/egg\b/.test(n)) return 50
  if (/chilli|chili|pepper, ?cayenne/.test(n)) return 12
  if (/leek/.test(n)) return 90
  if (/celery/.test(n)) return 40
  if (/spring onion|scallion/.test(n)) return 15
  if (/zucchini|courgette/.test(n)) return 200
  if (/eggplant|aubergine/.test(n)) return 450
  if (/beet/.test(n)) return 80
  if (/date/.test(n)) return 8
  if (/raisin/.test(n)) return 0.5
  if (/bay leaf/.test(n)) return 0.2

  return DEFAULT_PIECE_GRAMS[unit] || 50
}

/**
 * Convert a quantity in some unit to grams.
 * Returns null if the unit is unparseable (e.g. weird codes from corrupted data).
 */
export function toGrams(quantity, unit, ingredientName) {
  // Recovery: some imported recipes have quantity 0 with a numeric value stuck
  // in the unit field (e.g. quantity:0, unit:"4.5"). When that looks like a
  // plausible quantity (and the ingredient name is a real food), assume it
  // means "4.5 dl" — the most common unit in this dataset.
  if ((quantity === 0 || quantity === null || quantity === undefined) && unit) {
    const numericUnit = parseFloat(String(unit))
    if (!isNaN(numericUnit) && numericUnit > 0 && numericUnit < 100 && /\d/.test(String(unit))) {
      // Treat as dl (the dominant volume unit in this Norwegian recipe set)
      const ml = numericUnit * 100
      return ml * density(ingredientName)
    }
  }

  if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0) return 0
  if (!unit || unit === '') return 0  // unitless → skip

  const u = String(unit).toLowerCase().trim()

  // Direct gram units
  if (GRAMS_PER_UNIT[u]) return quantity * GRAMS_PER_UNIT[u]

  // Volume units → grams via density
  if (ML_PER_UNIT[u]) {
    const ml = quantity * ML_PER_UNIT[u]
    return ml * density(ingredientName)
  }

  // Piece-style units
  if (u in DEFAULT_PIECE_GRAMS) {
    return quantity * pieceWeight(ingredientName, u)
  }

  // Common variations
  if (u === 'piece' || u === 'pieces') return quantity * pieceWeight(ingredientName, 'pcs')
  if (u === 'cloves') return quantity * 3

  // Unknown unit (probably a corrupted code like "460g" or "139") → skip
  return null
}

// Canonical units the app supports. Recipes store the canonical *key*
// (e.g. 'tbsp', 'g'). The UI renders a translated label via `displayUnit`.
//
// Groups drive the <optgroup> ordering in the unit dropdown and the
// metric ⇄ US conversion on the recipe view.
export const CANONICAL_UNITS = {
  // ── Weight ──
  g:     { en: 'g',          no: 'g',          sv: 'g',     group: 'weight',  system: 'metric' },
  kg:    { en: 'kg',         no: 'kg',         sv: 'kg',    group: 'weight',  system: 'metric' },
  oz:    { en: 'oz',         no: 'oz',         sv: 'oz',    group: 'weight',  system: 'us' },
  lb:    { en: 'lb',         no: 'lb',         sv: 'lb',    group: 'weight',  system: 'us' },

  // ── Volume ──
  ml:    { en: 'ml',         no: 'ml',         sv: 'ml',    group: 'volume',  system: 'metric' },
  dl:    { en: 'dl',         no: 'dl',         sv: 'dl',    group: 'volume',  system: 'metric' },
  l:     { en: 'l',          no: 'l',          sv: 'l',     group: 'volume',  system: 'metric' },
  tsp:   { en: 'tsp',        no: 'ts',         sv: 'tsk',   group: 'volume',  system: 'us' },
  tbsp:  { en: 'tbsp',       no: 'ss',         sv: 'msk',   group: 'volume',  system: 'us' },
  cup:   { en: 'cup',        no: 'kopp',       sv: 'kopp',  group: 'volume',  system: 'us' },
  fl_oz: { en: 'fl oz',      no: 'fl oz',      sv: 'fl oz', group: 'volume',  system: 'us' },

  // ── Count / misc (shared across systems) ──
  pcs:   { en: 'pcs',        no: 'stk',        sv: 'st',    group: 'count',   system: 'both' },
  clove: { en: 'clove',      no: 'fedd',       sv: 'klyfta',group: 'count',   system: 'both' },
  pinch: { en: 'pinch',      no: 'klype',      sv: 'nypa',  group: 'count',   system: 'both' },
  dash:  { en: 'dash',       no: 'skvett',     sv: 'skvätt',group: 'count',   system: 'both' },
  handful:{ en: 'handful',   no: 'håndfull',   sv: 'handfull',group: 'count', system: 'both' },
  none:  { en: '—',          no: '—',          sv: '—',     group: 'count',   system: 'both' },
}

// Maps any variant string → canonical key. Case-insensitive, trimmed.
export const UNIT_ALIASES = {
  // tsp
  'ts': 'tsp', 'teskje': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsk': 'tsp',
  'tsp': 'tsp',
  // tbsp
  'ss': 'tbsp', 'spiseskje': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
  'msk': 'tbsp', 'tbsp': 'tbsp',
  // pcs
  'stk': 'pcs', 'piece': 'pcs', 'pieces': 'pcs', 'st': 'pcs', 'pc': 'pcs', 'pcs': 'pcs',
  // weight
  'gram': 'g', 'grams': 'g', 'gr': 'g', 'g': 'g',
  'kilogram': 'kg', 'kilograms': 'kg', 'kg': 'kg',
  // volume
  'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml', 'millilitres': 'ml', 'ml': 'ml',
  'deciliter': 'dl', 'deciliters': 'dl', 'decilitre': 'dl', 'decilitres': 'dl', 'dl': 'dl',
  'liter': 'l', 'liters': 'l', 'litre': 'l', 'litres': 'l', 'l': 'l',
  // cup
  'kopp': 'cup', 'cups': 'cup', 'cup': 'cup',
  // fluid ounces
  'fl oz': 'fl_oz', 'floz': 'fl_oz', 'fl_oz': 'fl_oz', 'fluid ounce': 'fl_oz', 'fluid ounces': 'fl_oz',
  // pinch / dash / handful
  'klype': 'pinch', 'nypa': 'pinch', 'pinch': 'pinch',
  'dash': 'dash', 'skvett': 'dash', 'skvätt': 'dash',
  'handful': 'handful', 'håndfull': 'handful', 'handfull': 'handful',
  // clove
  'clove': 'clove', 'cloves': 'clove', 'fedd': 'clove', 'klyfta': 'clove',
  // oz / lb
  'ounce': 'oz', 'ounces': 'oz', 'oz': 'oz',
  'lb': 'lb', 'lbs': 'lb', 'pound': 'lb', 'pounds': 'lb',
  // none
  '': 'none', '—': 'none', '-': 'none',
}

// Conversion factors to base units: ml for volume, g for weight.
export const TO_BASE = {
  ml: 1,
  dl: 100,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  fl_oz: 29.5735,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
}

// Which base unit each canonical unit belongs to.
export const BASE_UNIT_TYPE = {
  g: 'g', kg: 'g', oz: 'g', lb: 'g',
  ml: 'ml', dl: 'ml', l: 'ml', tsp: 'ml', tbsp: 'ml', cup: 'ml', fl_oz: 'ml',
}

export function normalizeUnit(unitStr) {
  if (!unitStr) return ''
  const lower = String(unitStr).toLowerCase().trim()
  return UNIT_ALIASES[lower] || lower
}

export function convertToBase(quantity, unitKey) {
  const factor = TO_BASE[unitKey]
  if (factor == null) return null
  const baseUnit = BASE_UNIT_TYPE[unitKey]
  if (!baseUnit) return null
  return { quantity: quantity * factor, unit: baseUnit }
}

export function convertFromBase(quantity, baseUnit, preferredUnit) {
  const targetFactor = TO_BASE[preferredUnit]
  if (targetFactor == null) return { quantity, unit: baseUnit }
  if (BASE_UNIT_TYPE[preferredUnit] !== baseUnit) return { quantity, unit: baseUnit }
  return { quantity: quantity / targetFactor, unit: preferredUnit }
}

// Picks a sensible metric unit given a quantity in ml or g.
export function smartConvert(quantity, unitKey) {
  const base = convertToBase(quantity, unitKey)
  if (!base) return { quantity, unit: unitKey }

  if (base.unit === 'g') {
    if (base.quantity >= 1000) {
      return { quantity: round(base.quantity / 1000, 2), unit: 'kg' }
    }
    return { quantity: round(base.quantity, 1), unit: 'g' }
  }

  if (base.unit === 'ml') {
    if (base.quantity >= 1000) {
      return { quantity: round(base.quantity / 1000, 2), unit: 'l' }
    }
    if (base.quantity >= 100) {
      return { quantity: round(base.quantity / 100, 1), unit: 'dl' }
    }
    return { quantity: round(base.quantity, 1), unit: 'ml' }
  }

  return { quantity, unit: unitKey }
}

// Converts a quantity + unit into the user's preferred system.
// System is 'metric' | 'us'. Returns { quantity, unit } in canonical form.
// Non-convertible units (pcs, pinch, clove, …) are returned unchanged.
export function convertToSystem(quantity, unitKey, system) {
  const normalized = normalizeUnit(unitKey)
  const meta = CANONICAL_UNITS[normalized]

  // Count / 'both' units never convert.
  if (!meta || meta.system === 'both') {
    return { quantity, unit: normalized || unitKey }
  }

  // Already in target system → just tidy the magnitude for metric.
  if (meta.system === system) {
    if (system === 'metric') return smartConvert(quantity, normalized)
    return { quantity: round(quantity, 2), unit: normalized }
  }

  const base = convertToBase(quantity, normalized)
  if (!base) return { quantity, unit: normalized || unitKey }

  if (system === 'metric') return smartConvert(base.quantity, base.unit)

  // Target = US. Pick the friendliest US unit.
  if (base.unit === 'g') {
    const inLb = base.quantity / TO_BASE.lb
    if (inLb >= 1) return { quantity: round(inLb, 2), unit: 'lb' }
    return { quantity: round(base.quantity / TO_BASE.oz, 2), unit: 'oz' }
  }

  if (base.unit === 'ml') {
    const ml = base.quantity
    // Big volumes → cups; medium → tbsp; tiny → tsp.
    if (ml >= TO_BASE.cup) return { quantity: round(ml / TO_BASE.cup, 2), unit: 'cup' }
    if (ml >= TO_BASE.tbsp) return { quantity: round(ml / TO_BASE.tbsp, 1), unit: 'tbsp' }
    return { quantity: round(ml / TO_BASE.tsp, 1), unit: 'tsp' }
  }

  return { quantity, unit: normalized }
}

function round(n, decimals) {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

// Formatted label for a canonical key in a given language. Falls back to the
// key itself so custom user units still render.
export function displayUnit(canonicalKey, lang = 'en') {
  const entry = CANONICAL_UNITS[canonicalKey]
  if (!entry) return canonicalKey === 'none' ? '' : (canonicalKey || '')
  if (canonicalKey === 'none') return ''
  return entry[lang] || entry.en || canonicalKey
}

// Returns canonical keys grouped for the dropdown UI, filtered by the user's
// preferred system. 'both'-group units (pcs, pinch, clove) appear in every
// system. The opposite-system units are still included at the bottom so the
// user can cross-pick (e.g. add a US unit while in metric mode).
export function getUnitOptions(system = 'metric', customUnits = []) {
  const order = ['weight', 'volume', 'count']
  const groups = {}
  for (const g of order) groups[g] = { preferred: [], other: [] }

  for (const [key, meta] of Object.entries(CANONICAL_UNITS)) {
    if (key === 'none') continue
    const bucket = (meta.system === 'both' || meta.system === system) ? 'preferred' : 'other'
    groups[meta.group][bucket].push(key)
  }

  return { groups, order, customUnits }
}

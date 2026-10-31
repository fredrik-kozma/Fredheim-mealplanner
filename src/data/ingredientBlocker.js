/**
 * Ingredient / allergen blocking (v1).
 *
 * Pack recipes store dictionary ids on `ingredient` (not `id`). Presence is
 * matched primarily by those ids (plus a one-way composite→contains map), with
 * the curated name-regex in allergens.js as fallback for unlinked free-text.
 *
 * Generic plant-milk / plant-yogurt: when soy is blocked, substitute a
 * non-blocked plant milk rather than hiding — unless the row note names soy
 * (real soy product) or every milk option is blocked.
 */

import { ALLERGENS, ingredientHasAllergen } from './allergens.js'

/** UI groups shown as chips (v1 — no nightshades/legumes). */
export const BLOCK_GROUPS = [
  { id: 'tree-nuts', icon: '🌰', perNut: true },
  { id: 'peanuts', icon: '🥜' },
  { id: 'gluten', icon: '🌾' },
  { id: 'soy', icon: '🫘' },
  { id: 'sesame', icon: '🥯' },
  { id: 'mustard', icon: '🌭' },
  { id: 'celery', icon: '🥬' },
  { id: 'coconut', icon: '🥥' },
  { id: 'oats', icon: '🥣', noteKey: 'settings.oatsGlutenNote' },
  { id: 'corn', icon: '🌽' },
]

/** Individual tree-nut chips (also seed tree-nuts group). */
export const PER_NUT_IDS = [
  'almonds',
  'cashews',
  'walnuts',
  'hazelnuts',
  'pecans',
  'pistachios',
]

export const GROUP_IDS = {
  'tree-nuts': [
    'almonds', 'almond-butter', 'almond-milk',
    'cashews', 'cashew-milk', 'cashew-sour-cream', 'white-cashew-sauce',
    'walnuts', 'hazelnuts', 'pecans', 'pistachios',
  ],
  peanuts: ['peanuts', 'peanut-butter'],
  gluten: [
    'wholewheat-flour', 'white-flour', 'gluten-flour', 'rye-flour', 'spelt-flour',
    'bread', 'bread-crumbs', 'crispbread', 'bulgur', 'lasagne-sheets', 'barley-coffee',
    // soy sauce often wheat-based in this kitchen; tamari stays out (usually GF)
    'soy-sauce', 'soy-sauce-low-sodium',
  ],
  soy: [
    'tofu', 'soy-milk', 'soy-sauce', 'soy-sauce-low-sodium', 'tamari', 'miso-paste',
    'edamame-frozen', 'soy-mayonnaise',
    // plant-milk / plant-yogurt handled specially — NOT seeded here
  ],
  sesame: ['sesame-seeds', 'sesame-oil', 'tahini'],
  mustard: ['mustard-seeds'],
  celery: ['celery'],
  coconut: ['shredded-coconut', 'coconut-milk', 'coconut-cream', 'coconut-oil'],
  oats: ['rolled-oats', 'oat-flour', 'oat-milk', 'small-oats'],
  corn: ['cornmeal-polenta', 'cornstarch', 'sweetcorn-frozen'],
}

/**
 * productId → ingredients it contains (allergen-relevant).
 * Blocking X adds any product whose contains[] intersects the blocked set.
 * Do NOT fan out reverse (blocking hummus must not block chickpeas).
 */
export const COMPOSITE_CONTAINS = {
  tahini: ['sesame-seeds'],
  'classic-hummus': ['chickpeas-canned', 'tahini', 'sesame-seeds'],
  hummus: ['chickpeas-canned', 'tahini', 'sesame-seeds'],
  'cashew-sour-cream': ['cashews'],
  'white-cashew-sauce': ['cashews'],
  'almond-butter': ['almonds'],
  'almond-milk': ['almonds'],
  'cashew-milk': ['cashews'],
  'peanut-butter': ['peanuts'],
  'soy-mayonnaise': ['soy-milk'],
  'bread-crumbs': ['wholewheat-flour', 'white-flour'],
  bread: ['wholewheat-flour', 'white-flour'],
  crispbread: ['wholewheat-flour', 'rye-flour'],
}

/** Preference order for substituting generic plant-milk when soy is blocked. */
export const PLANT_MILK_SUBSTITUTE_ORDER = [
  'oat-milk',
  'almond-milk',
  'coconut-milk',
  'cashew-milk',
  'soy-milk',
]

const PLANT_GENERIC = new Set(['plant-milk', 'plant-yogurt'])

export function emptyBlockedIngredients() {
  return { groups: [], ids: [] }
}

export function migrateAvoidedAllergens(avoidedAllergens) {
  const groups = Array.isArray(avoidedAllergens)
    ? [...new Set(avoidedAllergens.filter(Boolean).map(String))]
    : []
  return { groups, ids: [] }
}

export function normalizeBlocked(blocked) {
  if (!blocked || typeof blocked !== 'object') return emptyBlockedIngredients()
  const groups = Array.isArray(blocked.groups) ? [...new Set(blocked.groups.map(String))] : []
  const ids = Array.isArray(blocked.ids) ? [...new Set(blocked.ids.map(String))] : []
  return { groups, ids }
}

export function blockedIsActive(blocked) {
  const b = normalizeBlocked(blocked)
  return b.groups.length > 0 || b.ids.length > 0
}

/**
 * Expand groups + explicit ids through COMPOSITE_CONTAINS (one-way).
 * Does not include plant-milk / plant-yogurt (handled by substitution).
 */
export function expandBlockedIds(groups = [], extraIds = []) {
  const blocked = new Set(extraIds)
  for (const g of groups) {
    for (const id of GROUP_IDS[g] || []) blocked.add(id)
  }
  let changed = true
  while (changed) {
    changed = false
    for (const [comp, parts] of Object.entries(COMPOSITE_CONTAINS)) {
      if (blocked.has(comp)) continue
      if (parts.some((p) => blocked.has(p))) {
        blocked.add(comp)
        changed = true
      }
    }
  }
  return blocked
}

export function expandFromBlocked(blocked) {
  const b = normalizeBlocked(blocked)
  return expandBlockedIds(b.groups, b.ids)
}

function rowDictId(ing) {
  return ing?.ingredient || ing?.id || null
}

function rowText(ing) {
  if (!ing) return ''
  const parts = [ing.name, ing.note]
  return parts.filter(Boolean).join(', ')
}

function allRowTexts(recipe) {
  const out = []
  for (const ing of recipe?.ingredients || []) {
    const t = rowText(ing)
    if (t) out.push(t)
  }
  for (const lang of ['no', 'sv']) {
    for (const ing of recipe?.translations?.[lang]?.ingredients || []) {
      const t = rowText(ing)
      if (t) out.push(t)
    }
  }
  return out.map((n) => String(n).toLowerCase())
}

function noteImpliesSoy(ing) {
  const n = String(ing?.note || '').toLowerCase()
  return /\bsoy\b|\bsoya\b|\bsoja\b/.test(n)
}

/**
 * Pick a plant-milk substitute id that is not in the blocked set.
 * Returns null if every option is blocked.
 */
export function resolvePlantMilkSubstitute(blockedIds) {
  const set = blockedIds instanceof Set ? blockedIds : new Set(blockedIds || [])
  for (const id of PLANT_MILK_SUBSTITUTE_ORDER) {
    if (!set.has(id)) return id
  }
  return null
}

export const SUBSTITUTE_LABELS = {
  'oat-milk': { en: 'Oat milk', no: 'Havremelk', sv: 'Havremjölk' },
  'almond-milk': { en: 'Almond milk', no: 'Mandelmelk', sv: 'Mandelmjölk' },
  'coconut-milk': { en: 'Coconut milk', no: 'Kokosmelk', sv: 'Kokosmjölk' },
  'cashew-milk': { en: 'Cashew milk', no: 'Cashewmelk', sv: 'Cashewmjölk' },
  'soy-milk': { en: 'Soy milk', no: 'Soyamelk', sv: 'Sojamjölk' },
}

const YOGURT_LABELS = {
  'oat-milk': { en: 'Oat yogurt', no: 'Havreyoghurt', sv: 'Havreyoghurt' },
  'almond-milk': { en: 'Almond yogurt', no: 'Mandelyoghurt', sv: 'Mandelyoghurt' },
  'coconut-milk': { en: 'Coconut yogurt', no: 'Kokosyoghurt', sv: 'Kokosyoghurt' },
  'cashew-milk': { en: 'Cashew yogurt', no: 'Cashewyoghurt', sv: 'Cashewyoghurt' },
  'soy-milk': { en: 'Soy yogurt', no: 'Soyayoghurt', sv: 'Sojayoghurt' },
}

function yogurtLabel(subMilkId, lang = 'en') {
  const map = YOGURT_LABELS[subMilkId]
  return map?.[lang] || map?.en || 'Plant-based yogurt'
}

function milkLabel(subMilkId, lang = 'en') {
  return SUBSTITUTE_LABELS[subMilkId]?.[lang] || SUBSTITUTE_LABELS[subMilkId]?.en || subMilkId
}

const EXTRA_REGEX_GROUPS = [
  { id: 'coconut', match: [/coconut|kokos/], exclude: [] },
  { id: 'oats', match: [/\boat\b|havre/], exclude: [] },
  {
    id: 'corn',
    match: [/\bcorn\b|maize|\bmais\b|majs|polenta|cornstarch|maizena/],
    exclude: [/peppercorn/],
  },
]

function regexAllergensForGroups() {
  const base = ALLERGENS.filter((a) =>
    ['tree-nuts', 'peanuts', 'gluten', 'soy', 'sesame', 'mustard', 'celery'].includes(a.id),
  )
  return [...base, ...EXTRA_REGEX_GROUPS]
}

/**
 * Collect hard hits for a recipe.
 */
export function collectRecipeHits(recipe, blocked) {
  const b = normalizeBlocked(blocked)
  if (!blockedIsActive(b)) {
    return { hard: [], substitutable: [], regexGroups: [] }
  }
  const blockedIds = expandFromBlocked(b)
  const hard = []
  const substitutable = []
  const soyBlocked = b.groups.includes('soy')

  for (const ing of recipe?.ingredients || []) {
    const dictId = rowDictId(ing)
    if (dictId && PLANT_GENERIC.has(dictId)) {
      if (noteImpliesSoy(ing) && soyBlocked) {
        hard.push({ id: dictId, name: ing.name, reason: 'soy-note', group: 'soy' })
      } else if (soyBlocked) {
        substitutable.push({ id: dictId, name: ing.name, note: ing.note })
      }
      continue
    }
    if (dictId && blockedIds.has(dictId)) {
      hard.push({ id: dictId, name: ing.name || dictId, reason: 'id' })
    }
  }

  const texts = allRowTexts(recipe)
  const regexGroups = []
  const activeRegexIds = new Set(b.groups)
  // Explicit nut id → also run tree-nuts regex for unlinked "mixed nuts" text
  if (b.ids.some((id) => PER_NUT_IDS.includes(id) || (GROUP_IDS['tree-nuts'] || []).includes(id))) {
    activeRegexIds.add('tree-nuts')
  }
  // Explicit peanut id
  if (b.ids.some((id) => (GROUP_IDS.peanuts || []).includes(id))) {
    activeRegexIds.add('peanuts')
  }

  for (const allergen of regexAllergensForGroups()) {
    if (!activeRegexIds.has(allergen.id)) continue
    if (!texts.some((t) => ingredientHasAllergen(t, allergen))) continue
    regexGroups.push(allergen.id)

    if (allergen.id === 'soy') {
      const hasRealSoyId = (recipe?.ingredients || []).some((ing) => {
        const id = rowDictId(ing)
        return id && (GROUP_IDS.soy || []).includes(id)
      })
      const hasSoyNote = (recipe?.ingredients || []).some(
        (ing) => PLANT_GENERIC.has(rowDictId(ing)) && noteImpliesSoy(ing),
      )
      if ((hasRealSoyId || hasSoyNote) && !hard.some((h) => h.group === 'soy')) {
        hard.push({ id: null, name: 'soy', reason: 'regex', group: 'soy' })
      }
      continue
    }

    const alreadyById = (recipe?.ingredients || []).some((ing) => {
      const id = rowDictId(ing)
      return id && (GROUP_IDS[allergen.id] || []).includes(id)
    })
    if (!alreadyById && !hard.some((h) => h.group === allergen.id)) {
      hard.push({ id: null, name: allergen.id, reason: 'regex', group: allergen.id })
    }
  }

  return { hard, substitutable, regexGroups, blockedIds }
}

/**
 * Resolve substitutions for plant-milk/yogurt rows.
 */
export function planPlantMilkSubstitutions(recipe, blocked) {
  const b = normalizeBlocked(blocked)
  const blockedIds = expandFromBlocked(b)
  const soyBlocked = b.groups.includes('soy')
  const subs = []
  let hide = false

  for (const ing of recipe?.ingredients || []) {
    const dictId = rowDictId(ing)
    if (!PLANT_GENERIC.has(dictId)) continue

    if (noteImpliesSoy(ing) && soyBlocked) {
      hide = true
      continue
    }

    const needsSub = soyBlocked
    if (!needsSub) continue

    const subMilk = resolvePlantMilkSubstitute(blockedIds)
    if (!subMilk) {
      hide = true
      continue
    }
    const isYogurt = dictId === 'plant-yogurt'
    subs.push({
      fromId: dictId,
      toId: isYogurt ? dictId : subMilk,
      nutritionId: subMilk,
      labelKey: subMilk,
      isYogurt,
      nameEn: isYogurt ? yogurtLabel(subMilk, 'en') : milkLabel(subMilk, 'en'),
      nameNo: isYogurt ? yogurtLabel(subMilk, 'no') : milkLabel(subMilk, 'no'),
      nameSv: isYogurt ? yogurtLabel(subMilk, 'sv') : milkLabel(subMilk, 'sv'),
      note: isYogurt ? undefined : ing.note,
    })
  }

  return { ok: !hide, substitutions: subs, hide }
}

export function recipeIsBlocked(recipe, blocked) {
  const b = normalizeBlocked(blocked)
  if (!blockedIsActive(b)) return false
  const { hard } = collectRecipeHits(recipe, b)
  if (hard.length) return true
  const plan = planPlantMilkSubstitutions(recipe, b)
  return plan.hide
}

/**
 * Backward-compatible: avoided allergen group ids array OR blockedIngredients object.
 */
export function recipeHasAvoidedAllergen(recipe, avoidedOrBlocked) {
  if (!avoidedOrBlocked) return false
  if (Array.isArray(avoidedOrBlocked)) {
    return recipeIsBlocked(recipe, { groups: avoidedOrBlocked, ids: [] })
  }
  return recipeIsBlocked(recipe, avoidedOrBlocked)
}

export function recipeBlockReasons(recipe, blocked, t = (_k, o) => o?.defaultValue || _k) {
  const b = normalizeBlocked(blocked)
  if (!blockedIsActive(b) || !recipeIsBlocked(recipe, b)) return []
  const { hard } = collectRecipeHits(recipe, b)
  const reasons = []
  const seen = new Set()
  for (const h of hard) {
    const key = h.group || h.id || h.name
    if (!key || seen.has(key)) continue
    seen.add(key)
    if (h.group) {
      reasons.push(t(`allergens.${h.group}`, { defaultValue: h.group }))
    } else if (h.id) {
      reasons.push(h.name || h.id)
    } else {
      reasons.push(h.name)
    }
  }
  const plan = planPlantMilkSubstitutions(recipe, b)
  if (plan.hide && !seen.has('soy')) {
    reasons.push(t('allergens.soy', { defaultValue: 'Soy' }))
  }
  return reasons
}

/**
 * Apply milk substitutions onto a shallow-copied recipe for display / shopping.
 * Pack `nutrition` blob is left as authored — live engines that sum by
 * ingredient id pick up milk swaps; yogurt name-only swaps won't change macros.
 */
export function applyBlockedSubstitutions(recipe, blocked, lang = 'en') {
  const b = normalizeBlocked(blocked)
  if (!blockedIsActive(b) || !recipe) return recipe
  const plan = planPlantMilkSubstitutions(recipe, b)
  if (!plan.substitutions.length) return recipe

  const byFrom = new Map(plan.substitutions.map((s) => [s.fromId, s]))
  const mapRow = (ing) => {
    const id = rowDictId(ing)
    const sub = id && byFrom.get(id)
    if (!sub) return ing
    const name =
      lang === 'no' ? sub.nameNo : lang === 'sv' ? sub.nameSv : sub.nameEn
    if (sub.isYogurt) {
      return { ...ing, name, note: undefined }
    }
    return { ...ing, ingredient: sub.toId, name, note: sub.note }
  }

  const next = {
    ...recipe,
    ingredients: (recipe.ingredients || []).map(mapRow),
  }
  if (recipe.translations) {
    next.translations = { ...recipe.translations }
    for (const langKey of ['no', 'sv']) {
      const tr = recipe.translations[langKey]
      if (!tr?.ingredients) continue
      next.translations[langKey] = {
        ...tr,
        ingredients: tr.ingredients.map(mapRow),
      }
    }
  }
  return next
}

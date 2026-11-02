/**
 * Ingredient / allergen blocking (v2).
 *
 * Pack recipes store dictionary ids on `ingredient` (not `id`). Presence is
 * matched primarily by those ids (plus a one-way composite→contains map), with
 * the curated name-regex in allergens.js as fallback for unlinked free-text.
 *
 * Substitutions (never hide when a safe swap exists):
 * - Generic plant-milk / plant-yogurt: when soy OR legumes are blocked,
 *   substitute a non-blocked plant milk — unless the row note names soy
 *   (real soy product) or every milk option is blocked.
 * - Soy sauce / low-sodium soy sauce: when gluten is blocked and tamari is
 *   not blocked (soy/legumes/explicit), swap to tamari instead of hiding.
 *   Soy sauce still counts as gluten for gluten-free labels.
 *
 * Display: soy-sauce rows always show as "soy sauce / tamari" with a note
 * that tamari is gluten-free (see applyIngredientDisplayAliases).
 *
 * Edge cases documented:
 * - Nightshades: tomato, potato (not sweet potato), peppers/paprika/chili,
 *   eggplant, potato starch. Black pepper and sweet potato are NOT nightshades.
 * - Legumes: beans, lentils, chickpeas, peas (incl. green peas, snow peas,
 *   asparagus beans), soy products, peanuts, hummus/aquafaba, carob,
 *   fenugreek. Green beans / snow peas ARE legumes (Fabaceae).
 */

import { ALLERGENS, ingredientHasAllergen } from './allergens.js'
import dictionary from './ingredientDictionary.json'
import { fold } from '../utils/ingredientSearch.js'

/** UI groups shown as chips. */
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
  { id: 'nightshades', icon: '🌶️', noteKey: 'settings.nightshadesNote' },
  { id: 'legumes', icon: '🫘', noteKey: 'settings.legumesNote' },
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
    // soy sauce often wheat-based; tamari stays out (usually GF) — and is
    // substituted rather than hard-hiding when gluten is blocked (see below)
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
  // Nightshades (Solanaceae). NOT sweet potato, NOT black/white pepper.
  nightshades: [
    'tomatoes', 'cherry-tomatoes', 'canned-tomatoes', 'tomato-puree', 'sun-dried-tomatoes',
    'ketchup',
    'potatoes', 'potato-starch',
    'bell-peppers', 'paprika-powder', 'smoked-paprika',
    'chili-flakes', 'chili-fresh', 'chili-powder', 'cayenne-pepper',
    'eggplant',
  ],
  // Legumes (Fabaceae), incl. green peas / snow peas / asparagus beans.
  // Blocking this hides most plant-protein mains — callers must tolerate sparse lists.
  legumes: [
    'black-beans-canned', 'borlotti-beans-dry', 'kidney-beans-canned',
    'white-beans-canned', 'white-beans-dry',
    'lentils-green-brown', 'lentils-red',
    'chickpeas-canned', 'chickpeas-dry', 'chickpea-flour',
    'green-peas', 'yellow-peas-cooked', 'snow-peas', 'asparagus-beans-frozen',
    'bean-noodles', 'bean-sprouts',
    'peanuts', 'peanut-butter',
    'tofu', 'soy-milk', 'soy-sauce', 'soy-sauce-low-sodium', 'tamari',
    'miso-paste', 'edamame-frozen', 'soy-mayonnaise',
    'hummus', 'classic-hummus', 'aquafaba',
    'carob-powder', 'fenugreek-seeds',
  ],
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
  ketchup: ['tomatoes'],
}

/** Soy sauce ids that can swap to tamari when gluten is blocked. */
export const SOY_SAUCE_IDS = new Set(['soy-sauce', 'soy-sauce-low-sodium'])

/** Preference order for substituting generic plant-milk when soy/legumes blocked. */
export const PLANT_MILK_SUBSTITUTE_ORDER = [
  'oat-milk',
  'almond-milk',
  'coconut-milk',
  'cashew-milk',
  'soy-milk',
]

const PLANT_GENERIC = new Set(['plant-milk', 'plant-yogurt'])

/** Always-on display aliases (independent of blocking). */
export const INGREDIENT_DISPLAY_ALIASES = {
  'soy-sauce': {
    names: {
      en: 'Soy sauce / tamari',
      no: 'Soyasaus / tamari',
      sv: 'Sojasås / tamari',
    },
    notes: {
      en: 'Tamari is gluten-free',
      no: 'Tamari er glutenfri',
      sv: 'Tamari är glutenfri',
    },
  },
  'soy-sauce-low-sodium': {
    names: {
      en: 'Low-sodium soy sauce / tamari',
      no: 'Saltredusert soyasaus / tamari',
      sv: 'Saltreducerad sojasås / tamari',
    },
    notes: {
      en: 'Tamari is gluten-free',
      no: 'Tamari er glutenfri',
      sv: 'Tamari är glutenfri',
    },
  },
}


const ENTRY_BY_ID = new Map((dictionary.entries || []).map((e) => [e.id, e]))

/** Folded name/synonym/singular terms for one dictionary id (en/no/sv). */
export function termsForBlockedId(id) {
  const e = ENTRY_BY_ID.get(id)
  const terms = new Set()
  if (e) {
    for (const lang of ['en', 'no', 'sv']) {
      if (e.names?.[lang]) terms.add(fold(e.names[lang]))
      if (e.singular?.[lang]) terms.add(fold(e.singular[lang]))
      for (const syn of e.synonyms?.[lang] || []) if (syn) terms.add(fold(syn))
    }
  }
  terms.add(fold(String(id || '').replace(/-/g, ' ')))
  return [...terms].filter((t) => t && t.length >= 3)
}

/** Case/accent-insensitive contains match of free-text against a blocked id's terms. */
export function textMatchesBlockedId(text, id) {
  const folded = fold(text)
  if (!folded) return false
  for (const term of termsForBlockedId(id)) {
    if (folded.includes(term) || term.includes(folded)) return true
  }
  return false
}

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

/** True when plant-milk should prefer a non-soy option. */
function needsPlantMilkSub(b) {
  return b.groups.includes('soy') || b.groups.includes('legumes')
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
  tamari: { en: 'Tamari', no: 'Tamari', sv: 'Tamari' },
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

function pickLang(map, lang = 'en') {
  return map?.[lang] || map?.en || ''
}

/**
 * Can soy sauce be swapped to tamari under this block set?
 * Requires gluten blocked and tamari itself not blocked (soy / legumes / id).
 */
export function canSubstituteSoySauceForGluten(blocked) {
  const b = normalizeBlocked(blocked)
  if (!b.groups.includes('gluten')) return false
  const blockedIds = expandFromBlocked(b)
  return !blockedIds.has('tamari')
}

const EXTRA_REGEX_GROUPS = [
  { id: 'coconut', match: [/coconut|kokos/], exclude: [] },
  { id: 'oats', match: [/\boat\b|havre/], exclude: [] },
  {
    id: 'corn',
    match: [/\bcorn\b|maize|\bmais\b|majs|polenta|cornstarch|maizena/],
    exclude: [/peppercorn/],
  },
  {
    id: 'nightshades',
    match: [
      /tomato|tomat/,
      /\bpotato\b|potet|potatis/,
      /bell pepper|paprika|chili|chilli|cayenne|aubergine|eggplant|aubergine|goji|tomatillo|passata|ketchup|harissa|salsa/,
    ],
    exclude: [
      /sweet\s*potato|søtpotet|sötpotatis|batat/,
      /black pepper|white pepper|peppercorn|svartpepper|hvitpepper|svartpeppar|vitpeppar/,
    ],
  },
  {
    id: 'legumes',
    match: [
      /\bbeans?\b|bønne|böna|bønner|bönor/,
      /lentil|linse/,
      /chickpea|garbanzo|kikert|kikärt/,
      /\bpeas?\b|erte|ärta|ärtor/,
      /\bsoy|soya|soja|tofu|tempeh|edamame|miso|tamari/,
      /peanut|peanøtt|jordnøtt|jordnöt/,
      /hummus|aquafaba|lupin|carob|fenugreek|bukkehorn/,
    ],
    exclude: [
      /coffee bean|kaffebønne|kaffeböna/,
      /cocoa bean|kakaobønne|kakaoböna/,
      /vanilla bean|vaniljestang|vaniljstång/,
      /bean sprout|bønnespire|bönskott/, // still a legume — actually KEEP these. Remove exclude.
    ],
  },
]

// Fix legumes exclude: bean sprouts ARE legumes. Coffee/cocoa/vanilla beans are not.
EXTRA_REGEX_GROUPS.find((g) => g.id === 'legumes').exclude = [
  /coffee bean|kaffebønne|kaffeböna/,
  /cocoa bean|kakaobønne|kakaoböna/,
  /vanilla bean|vaniljestang|vaniljstång/,
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
  const plantSub = needsPlantMilkSub(b)
  const soySauceSwap = canSubstituteSoySauceForGluten(b)

  for (const ing of recipe?.ingredients || []) {
    const dictId = rowDictId(ing)
    if (dictId && PLANT_GENERIC.has(dictId)) {
      if (noteImpliesSoy(ing) && plantSub) {
        hard.push({ id: dictId, name: ing.name, reason: 'soy-note', group: soyBlocked ? 'soy' : 'legumes' })
      } else if (plantSub) {
        substitutable.push({ id: dictId, name: ing.name, note: ing.note, kind: 'plant-milk' })
      }
      continue
    }
    if (dictId && SOY_SAUCE_IDS.has(dictId) && soySauceSwap && blockedIds.has(dictId)) {
      // Gluten block with tamari available: substitute, don't hard-hide for soy sauce alone.
      substitutable.push({ id: dictId, name: ing.name, note: ing.note, kind: 'soy-sauce' })
      continue
    }
    if (dictId && blockedIds.has(dictId)) {
      hard.push({ id: dictId, name: ing.name || dictId, reason: 'id' })
    }
  }

  const texts = allRowTexts(recipe)
  // Explicit blocked ingredient ids: also match free-text names / aliases
  // (e.g. blocking "mushrooms" catches a row named "shiitake" via synonyms).
  for (const id of b.ids) {
    if (hard.some((h) => h.id === id)) continue
    if (SOY_SAUCE_IDS.has(id) && soySauceSwap) continue
    if (PLANT_GENERIC.has(id)) continue
    if (texts.some((t) => textMatchesBlockedId(t, id))) {
      const label = ENTRY_BY_ID.get(id)?.names?.en || id
      hard.push({ id, name: label, reason: 'name' })
    }
  }
  const regexGroups = []
  const activeRegexIds = new Set(b.groups)
  if (b.ids.some((id) => PER_NUT_IDS.includes(id) || (GROUP_IDS['tree-nuts'] || []).includes(id))) {
    activeRegexIds.add('tree-nuts')
  }
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

    if (allergen.id === 'gluten' && soySauceSwap) {
      // If every gluten id hit is soy-sauce (already substitutable), don't regex-hard.
      const hasOtherGlutenId = (recipe?.ingredients || []).some((ing) => {
        const id = rowDictId(ing)
        return id && (GROUP_IDS.gluten || []).includes(id) && !SOY_SAUCE_IDS.has(id)
      })
      const hasSoySauceId = (recipe?.ingredients || []).some((ing) => SOY_SAUCE_IDS.has(rowDictId(ing)))
      if (!hasOtherGlutenId && hasSoySauceId) continue
      if (!hasOtherGlutenId && !hasSoySauceId) {
        // Free-text gluten with no soy-sauce id — still hard
      } else if (!hasOtherGlutenId) {
        continue
      }
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
  const plantSub = needsPlantMilkSub(b)
  const subs = []
  let hide = false

  for (const ing of recipe?.ingredients || []) {
    const dictId = rowDictId(ing)
    if (!PLANT_GENERIC.has(dictId)) continue

    if (noteImpliesSoy(ing) && plantSub) {
      hide = true
      continue
    }

    if (!plantSub) continue

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
      kind: 'plant-milk',
      nameEn: isYogurt ? yogurtLabel(subMilk, 'en') : milkLabel(subMilk, 'en'),
      nameNo: isYogurt ? yogurtLabel(subMilk, 'no') : milkLabel(subMilk, 'no'),
      nameSv: isYogurt ? yogurtLabel(subMilk, 'sv') : milkLabel(subMilk, 'sv'),
      note: isYogurt ? undefined : ing.note,
    })
  }

  return { ok: !hide, substitutions: subs, hide }
}

/**
 * Soy sauce → tamari when gluten is blocked and tamari is available.
 */
export function planSoySauceSubstitutions(recipe, blocked) {
  const b = normalizeBlocked(blocked)
  if (!canSubstituteSoySauceForGluten(b)) {
    return { ok: true, substitutions: [], hide: false }
  }
  const subs = []
  for (const ing of recipe?.ingredients || []) {
    const dictId = rowDictId(ing)
    if (!SOY_SAUCE_IDS.has(dictId)) continue
    subs.push({
      fromId: dictId,
      toId: 'tamari',
      nutritionId: 'tamari',
      labelKey: 'tamari',
      isYogurt: false,
      kind: 'soy-sauce',
      nameEn: SUBSTITUTE_LABELS.tamari.en,
      nameNo: SUBSTITUTE_LABELS.tamari.no,
      nameSv: SUBSTITUTE_LABELS.tamari.sv,
      note: undefined,
    })
  }
  return { ok: true, substitutions: subs, hide: false }
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
  if (plan.hide && !seen.has('soy') && !seen.has('legumes')) {
    reasons.push(
      b.groups.includes('legumes')
        ? t('allergens.legumes', { defaultValue: 'Legumes' })
        : t('allergens.soy', { defaultValue: 'Soy' }),
    )
  }
  return reasons
}

/**
 * Apply milk + soy-sauce substitutions onto a shallow-copied recipe for display / shopping.
 * Pack `nutrition` blob is left as authored — live engines that sum by
 * ingredient id pick up milk/tamari swaps; yogurt name-only swaps won't change macros.
 */
export function applyBlockedSubstitutions(recipe, blocked, lang = 'en') {
  const b = normalizeBlocked(blocked)
  if (!blockedIsActive(b) || !recipe) return recipe
  const milkPlan = planPlantMilkSubstitutions(recipe, b)
  const soyPlan = planSoySauceSubstitutions(recipe, b)
  const allSubs = [...milkPlan.substitutions, ...soyPlan.substitutions]
  if (!allSubs.length) return recipe

  const byFrom = new Map(allSubs.map((s) => [s.fromId, s]))
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

/**
 * Always-on display polish: soy sauce → "soy sauce / tamari" + gluten-free note.
 * Call AFTER applyBlockedSubstitutions so a tamari swap is left alone.
 */
export function applyIngredientDisplayAliases(recipe, lang = 'en') {
  if (!recipe) return recipe
  let touched = false
  const mapRow = (ing) => {
    const id = rowDictId(ing)
    const alias = id && INGREDIENT_DISPLAY_ALIASES[id]
    if (!alias) return ing
    touched = true
    const name = pickLang(alias.names, lang)
    const extra = pickLang(alias.notes, lang)
    const note = ing.note
      ? (String(ing.note).toLowerCase().includes('tamari') ? ing.note : `${ing.note}; ${extra}`)
      : extra
    return { ...ing, name, note }
  }
  const ingredients = (recipe.ingredients || []).map(mapRow)
  let translations = recipe.translations
  if (translations) {
    translations = { ...translations }
    for (const langKey of ['no', 'sv', 'en']) {
      const tr = recipe.translations[langKey]
      if (!tr?.ingredients) continue
      translations[langKey] = {
        ...tr,
        ingredients: tr.ingredients.map(mapRow),
      }
    }
  }
  if (!touched) return recipe
  return { ...recipe, ingredients, translations }
}

/**
 * Reasons a planned (already-on-the-week) meal conflicts with current blocks.
 * Empty when the recipe is fine or blocks are off.
 */
export function plannedMealBlockWarnings(recipe, blocked, t = (_k, o) => o?.defaultValue || _k) {
  if (!recipe || !blockedIsActive(blocked)) return []
  if (!recipeIsBlocked(recipe, blocked)) return []
  return recipeBlockReasons(recipe, blocked, t)
}

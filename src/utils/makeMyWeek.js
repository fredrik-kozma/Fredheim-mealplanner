/**
 * "Make my week" — fills the planner from the installed Fredheim recipes with
 * fixed rules, on the device. No AI, no network.
 *
 * The output is the same object a shipped starter plan is, so the planner
 * loads it through useStore.installStarterPlan unchanged:
 *   { plan: { monday: { Breakfast: [{ recipeId, servings: null }] } },
 *     batchCook: [{ id, kind: 'recipe', recipeId, servings }], portions }
 *
 * Deterministic: the same answers, recipes and seed always give the same
 * week. "Shuffle" in the modal just asks again with a new seed.
 *
 * The rules, in short:
 *   - Pool: recipes from the Fredheim and Reversal packs that are installed,
 *     minus avoided allergens (allergens.js), honey if asked, and recipes
 *     the user marked "not for me". Every chosen health goal requires its
 *     label on every recipe — there is no untagged fallback. With several
 *     goals and too few recipes carrying all their labels, the least
 *     important goal (GOAL_PRIORITY) is dropped and the week says so.
 *   - Breakfast from breakfast dishes, sweet, savoury or a mix of both as
 *     answered (flavourProfile in the packs); the batch spread follows the
 *     same answer. Lunch a soup, salad or lunch dish;
 *     dinner (or the main meal) a Main, or a soup/stew with a side. A salad
 *     is only ever the side, so every main meal is filling.
 *   - A recipe at most twice a week (three times for batch items), never on
 *     consecutive days. The time limit applies Monday–Friday only.
 *   - Batch on Sunday: a big soup/stew, a bread and a spread, sized to the
 *     times they're eaten and marked as covered on those days.
 *   - Where nutrition exists, steer each day towards a kcal target and
 *     30 g fibre, and lower sodium for blood pressure.
 *   - Portions: the packs' servings are modest (a bowl of soup is ~200
 *     kcal), so one of each comes to about half a day. Each dish is sized
 *     per person — up to 2 portions of a main, soup, lunch dish or
 *     breakfast; sides, bread and spreads stay at 1 — until the day is near
 *     its target. Still short: bread from the pool (so carrying the goal's
 *     label) as an extra, then fruit as a day note. Extras are staples, not
 *     dishes, so the repeat rules don't count them.
 *   - Favourites are preferred when asked (at least a few a week where they
 *     fit the rules). "Fewer ingredients" prefers recipes that share
 *     ingredients with what the week already has, and repeats over new
 *     dishes; every week reports how many different ingredients it needs.
 *   - Salt level: low whenever a goal is blood pressure, heart or
 *     diabetes; otherwise as answered. It changes amounts, not choices.
 *   - A calorie target (answers.kcal, 1000–4000) replaces the automatic
 *     one: portions then go both ways, ½ to 2 per person for a dish (bread
 *     in whole servings, so whole slices), until each day is within about
 *     10% of it, and of the attempts the one needing the least scaling
 *     wins. No target: everything here, unchanged. FMD ignores it.
 *   - "3 meals + snack" (answers.snack) adds a snack a day from the
 *     recipes marked as snacks (a piece of fruit when none fits).
 * If the rules can't all be met, they are relaxed in a fixed order (a third
 * repeat, then the weekday time limit) and the week says so in a notice.
 *
 * Servings stay whole numbers for the household (2 people × 1½ = 3), the
 * same fixed overrides the planner's "scale the week" multiplies and the
 * shopping list scales by. A dish left at 1 portion keeps `servings: null`
 * and follows the household size as before.
 */
import { recipeHasAvoidedAllergen, recipeAllergens } from '../data/allergens'
import { STARTER_PLANS } from '../data/starterPlans'
import { LOW_SALT_GOALS, normalizeSaltLevel } from './saltLevel'
import {
  FREDHEIM_RECIPES_WITH_PICTURES_PACK,
  FREDHEIM_REVERSAL_PROTOCOL_PACK,
  FREDHEIM_FMD_5DAY_PACK,
} from '../data/installedPacks'

export const FREDHEIM_PACK_ID = FREDHEIM_RECIPES_WITH_PICTURES_PACK.id
export const REVERSAL_PACK_ID = FREDHEIM_REVERSAL_PROTOCOL_PACK.id
export const FMD_PACK_ID = FREDHEIM_FMD_5DAY_PACK.id
// The packs a generated week draws from. FMD recipes are deliberately not
// here: fasting dishes are tiny portions, only right inside the FMD week.
export const MMW_PACK_IDS = [FREDHEIM_PACK_ID, REVERSAL_PACK_ID]
export const FMD_STARTER_ID = 'fmd-5day-week-1'

export const MMW_GOALS = ['general', 'weight', 'bloodPressure', 'diabetes', 'heart', 'fmd']
export const MMW_TIMES = ['quick', 'medium', 'any']
export const MMW_MEALS = [3, 2, 1]
export const MMW_BREAKFASTS = ['both', 'savoury', 'sweet']
// The meals question: a meal count, and for three meals optionally a snack.
export const MMW_MEAL_OPTIONS = [
  { key: '3s', meals: 3, snack: true },
  { key: '3', meals: 3, snack: false },
  { key: '2', meals: 2, snack: false },
  { key: '1', meals: 1, snack: false },
]
// Calorie target: quick picks, the range a typed value must be in, and the
// level below which the wizard suggests professional guidance.
export const MMW_KCAL_PICKS = [1500, 1800, 2000, 2500]
export const KCAL_MIN = 1000
export const KCAL_MAX = 4000
export const KCAL_GUIDANCE = 1200

/** A daily calorie target in range, as a whole number; anything else is no target (null). */
export function normalizeKcal(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Math.round(Number(value))
  return Number.isFinite(n) && n >= KCAL_MIN && n <= KCAL_MAX ? n : null
}

/** The meals option key for answers ({ meals, snack }). */
export function mealOptionKey(answers = {}) {
  return answers.snack && answers.meals === 3 ? '3s' : String(answers.meals ?? 3)
}

export const GOAL_TAG = {
  general: null,
  weight: 'weight-loss',
  bloodPressure: 'blood-pressure-friendly',
  diabetes: 'diabetes-friendly',
  heart: 'heart-healthy',
}
// Most important first: with too few recipes for every chosen goal, the
// last one here is dropped first. Medical goals outrank weight loss.
export const GOAL_PRIORITY = ['bloodPressure', 'heart', 'diabetes', 'weight']
// 'general' and 'fmd' are a whole answer on their own, never combined.
export const EXCLUSIVE_GOALS = ['general', 'fmd']

/**
 * The chosen goals as a list. Answers saved before goals were multiple
 * choice carry a single `goal` string; it still works. 'general' means no
 * label, so it drops out of the list; 'fmd' wins over everything.
 */
export function answerGoals(answers = {}) {
  const raw = Array.isArray(answers.goals) && answers.goals.length
    ? answers.goals
    : (answers.goal ? [answers.goal] : [])
  const goals = [...new Set(raw.filter(g => MMW_GOALS.includes(g)))]
  if (goals.includes('fmd')) return ['fmd']
  return GOAL_PRIORITY.filter(g => goals.includes(g))
}

/** Low salt for blood pressure, heart and diabetes; otherwise as answered. */
export function saltLevelFor(answers = {}) {
  if (answerGoals(answers).some(g => LOW_SALT_GOALS.includes(g))) return 'low'
  return normalizeSaltLevel(answers.saltLevel)
}

const TIME_LIMIT = { quick: 20, medium: 45, any: Infinity }
// Recipes without a prep/cook time count as "medium": fine for 45 minutes,
// too uncertain for the 20-minute answer.
const UNKNOWN_MINUTES = 30
const MIN_FAVOURITES = 3
const MAX_USES = 2
const MAX_BATCH_USES = 3
const ATTEMPTS = 30
const FIBRE_TARGET = 30

// Portions per person a dish may be scaled to, and the band a day is
// steered into: grow portions until the day reaches LOW_FILL of its
// target, never past HIGH (the ~10% the week should land within).
const MAX_PORTIONS = 2
const FILL_TO = 0.97
const HIGH = 1.08
const LOW = 0.9
// A medium piece of fruit (apple, pear, orange; USDA FoodData Central):
// ~80 kcal and ~3.5 g fibre. At most this many a day as an extra.
export const FRUIT = { kcal: 80, fibre: 3.5 }
const MAX_FRUIT = 3

export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const isWeekday = day => day < 5

// Share of the day's energy each meal is steered towards.
const SHARES = {
  3: { breakfast: 0.25, lunch: 0.35, dinner: 0.4 },
  2: { breakfast: 0.4, lunch: 0.6 },
  1: { dinner: 0.4 },
}
// Three meals and a snack: the snack's tenth comes off the meals.
const SNACK_SHARES = { breakfast: 0.22, lunch: 0.32, dinner: 0.36, snack: 0.1 }
const sharesFor = a => (a.meals === 3 && a.snack ? SNACK_SHARES : SHARES[a.meals] || SHARES[3])

// With a calorie target: the least a dish may go down to per person, how
// close a day is fitted (then left alone), and the band it should end in.
const MIN_PORTIONS = 0.5
const FIT_CLOSE = 0.03
const TARGET_BAND = 0.1

// Batch items: the soup on Mon/Wed/Fri, bread + spread on Tue/Thu/Sat —
// spaced so neither lands on consecutive days, and all eaten within the
// five days a soup keeps in the fridge.
const BATCH_SOUP_DAYS = [0, 2, 4]
const BATCH_BREAD_DAYS = [1, 3, 5]

/**
 * Daily kcal per person the week is steered towards. `goal`: one goal or a
 * list. `kcal`: the user's own target, which wins when it is in range.
 */
export function kcalTarget(goal, meals, kcal = null) {
  const own = normalizeKcal(kcal)
  if (own) return own
  if (meals === 2) return 1400
  if ([].concat(goal || []).includes('weight')) return 1600
  return 2000
}

export function defaultAnswers({ familySize, avoidedAllergens, avoidHoney, saltLevel, favourites, disliked, kcal, meals, snack } = {}) {
  const mealCount = MMW_MEALS.includes(meals) ? meals : 3
  return {
    goals: [],
    people: Math.min(8, Math.max(1, Number(familySize) || 2)),
    avoid: [...(avoidedAllergens || [])],
    noHoney: Boolean(avoidHoney),
    time: 'medium',
    batch: false,
    meals: mealCount,
    // A snack a day, with three meals only.
    snack: Boolean(snack) && mealCount === 3,
    // Daily calorie target per person; null = none (the automatic one).
    kcal: normalizeKcal(kcal),
    breakfast: 'both',
    saltLevel: normalizeSaltLevel(saltLevel),
    preferFavourites: true,
    fewerIngredients: false,
    // From the store, not asked: recipe ids.
    favourites: [...(favourites || [])],
    disliked: [...(disliked || [])],
  }
}

/**
 * The planner's own row names for breakfast/lunch/dinner. The rows are user
 * editable; a plan keyed by a row that isn't there would load invisibly, so
 * fall back to the rows by position when the defaults were renamed.
 */
export function resolveSlotNames(mealSlots = []) {
  const pick = (key, idx) => (mealSlots.includes(key) ? key : mealSlots[idx]) || key
  const names = {
    breakfast: pick('Breakfast', 0),
    lunch: pick('Lunch', 1),
    dinner: pick('Dinner', Math.max(2, mealSlots.length - 1)),
  }
  // Two roles must never share one row.
  const seen = new Set()
  for (const [role, def] of [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner']]) {
    if (seen.has(names[role])) names[role] = def
    seen.add(names[role])
  }
  return names
}

// ── Recipe facts ─────────────────────────────────────────────────────────

const tagsOf = r => r?.tags || []
const typesOf = r => r?.mealTypes || []
const hasType = (r, ...types) => types.some(t => typesOf(r).includes(t))

export function totalMinutes(r) {
  const m = (Number(r?.prepTime) || 0) + (Number(r?.cookTime) || 0)
  return m > 0 ? m : null
}

const fitsTime = (r, limit) => (totalMinutes(r) ?? UNKNOWN_MINUTES) <= limit

// Honey is the only animal product in the packs. "Honeydew" melon is not
// honey, hence the word boundary and the melon look-aheads.
const HONEY_RE = /\bhoney\b|honning(?!melon)|honung(?!smelon)/
export function recipeHasHoney(r) {
  const rows = [
    ...(r?.ingredients || []),
    ...(r?.translations?.no?.ingredients || []),
    ...(r?.translations?.sv?.ingredients || []),
  ]
  return rows.some(ing =>
    ing?.ingredient === 'honey' ||
    HONEY_RE.test(`${ing?.name || ''} ${ing?.note || ''}`.toLowerCase()))
}

const NOT_BREAKFAST = new Set(['Bread', 'Drink', 'Dessert', 'Spreads', 'Sauce', 'Jam', 'Snack'])
export const isBreakfast = r => hasType(r, 'breakfast') && !NOT_BREAKFAST.has(r.category)
export const isLunchDish = r => hasType(r, 'lunch') && ['Soup', 'Salad', 'Lunch', 'Main'].includes(r.category)
// "Filling": the base of a main meal. A salad is never one.
export const isFilling = (r, types = ['dinner']) => hasType(r, ...types) && (r.category === 'Main' || r.category === 'Soup')
export const isSide = r => hasType(r, 'side') && (r.category === 'Salad' || r.category === 'Side')
export const isBread = r => r.category === 'Bread' && hasType(r, 'breakfast', 'lunch', 'side')
export const isSpread = r => r.category === 'Spreads'
// A snack eaten on its own: marked as one, not a spread or sauce (those need
// something to go with) or a soup, and enough to count (not a 20 kcal drink).
const NOT_SNACK = new Set(['Spreads', 'Sauce', 'Soup'])
export const isSnack = r => hasType(r, 'snack') && !NOT_SNACK.has(r.category) &&
  Number(r?.nutrition?.perServing?.calories) >= 50
const isBatchFriendly = r => tagsOf(r).includes('batch-friendly')

const perServing = r => {
  const n = r?.nutrition?.perServing
  return n && Number.isFinite(Number(n.calories)) ? n : null
}

// Variants of one dish ("Chia Pudding with Mango" / "… with Raspberries",
// "Oat Porridge (Stovetop)" / "(Instant Pot)") share a family, so the week
// doesn't serve the same thing five times under different names.
export function dishFamily(r) {
  return String(r?.title || r?.id || '').toLowerCase()
    .split(/\s+with\s+|\s+[—–-]\s+|\s*\(|,/)[0].trim()
}

// A bread baked fresh just to go with one dinner is fine for a quick loaf,
// not for a two-day rye.
const FRESH_BREAD_MAX_MINUTES = 180

// Sweet spreads (fig, carob) suit breakfast, not a lunch or dinner plate.
function isSweet(r) {
  if (r?.flavourProfile) return r.flavourProfile === 'sweet'
  const n = perServing(r)
  return Boolean(n && Number(n.calories) > 0 && (Number(n.totalSugars) || 0) * 4 / Number(n.calories) > 0.3)
}

/** 'sweet' | 'savoury': the pack's flavourProfile, else judged by sugars. */
export const flavourOf = r => r?.flavourProfile || (isSweet(r) ? 'sweet' : 'savoury')

/**
 * What a recipe puts on the shopping list: standardized ingredient ids (the
 * row's name where it has none), water left out as the list does.
 */
export function ingredientKeys(r) {
  const out = new Set()
  for (const row of r?.ingredients || []) {
    const key = row?.ingredient || String(row?.name || '').trim().toLowerCase()
    if (key && key !== 'water') out.add(key)
  }
  return out
}

/** Different ingredients a set of recipes needs, counted as the shopping list combines them. */
export function uniqueIngredientCount(recipes) {
  const all = new Set()
  for (const r of recipes) for (const k of ingredientKeys(r)) all.add(k)
  return all.size
}

// ── Seeded randomness ────────────────────────────────────────────────────

function hashSeed(str) {
  let h = 2166136261
  for (const ch of String(str)) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Pool ─────────────────────────────────────────────────────────────────

/** The recipes a generated week may use, given the answers: every chosen goal's label. */
export function buildPool(recipes, answers) {
  const tags = answerGoals(answers).map(g => GOAL_TAG[g]).filter(Boolean)
  const disliked = new Set(answers.disliked || [])
  return (recipes || []).filter(r =>
    MMW_PACK_IDS.includes(r.sourcePackId) &&
    !disliked.has(r.id) &&
    !recipeHasAvoidedAllergen(r, answers.avoid) &&
    !(answers.noHoney && recipeHasHoney(r)) &&
    tags.every(tag => tagsOf(r).includes(tag)))
}

// Enough to fill a week without serving the same few dishes all the time:
// a main meal base for every two days, and some choice at breakfast/lunch.
const MIN_MAINS = 4
const MIN_OTHER = 3
function poolIsEnough(pool, a) {
  const mainTypes = a.meals === 2 ? ['lunch', 'dinner'] : ['dinner']
  if (pool.filter(r => isFilling(r, mainTypes)).length < MIN_MAINS) return false
  if (a.meals !== 1 && pool.filter(isBreakfast).length < MIN_OTHER) return false
  if (a.meals === 3 && pool.filter(isLunchDish).length < MIN_OTHER) return false
  return true
}

/**
 * The pool for every chosen goal; with too few recipes, the least
 * important goal is dropped (one at a time) until it is enough. A single
 * goal is never dropped. Returns { pool, goals, relaxed }.
 */
export function poolForGoals(recipes, a) {
  let goals = answerGoals(a)
  const relaxed = []
  let pool = buildPool(recipes, { ...a, goals })
  while (goals.length > 1 && !poolIsEnough(pool, a)) {
    relaxed.push(goals[goals.length - 1])
    goals = goals.slice(0, -1)
    pool = buildPool(recipes, { ...a, goals })
  }
  return { pool, goals, relaxed }
}

// ── FMD ──────────────────────────────────────────────────────────────────

function makeFmdWeek({ recipes, answers, installedPackIds }) {
  const starter = STARTER_PLANS.find(p => p.id === FMD_STARTER_ID)
  const notices = []
  if (!installedPackIds.includes(FMD_PACK_ID)) notices.push({ key: 'fmdPackAdded' })
  // The protocol is fixed, so allergens can't be swapped out — but they
  // must not pass silently either.
  const byId = new Map(FREDHEIM_FMD_5DAY_PACK.recipes.map(r => [r.id, r]))
  for (const r of recipes || []) if (r.sourcePackId === FMD_PACK_ID) byId.set(r.id, r)
  const ids = new Set(Object.values(starter.plan).flatMap(d => Object.values(d).flat().map(i => i.recipeId)))
  const found = new Set()
  let honey = false
  for (const id of ids) {
    const r = byId.get(id)
    if (!r) continue
    for (const a of recipeAllergens(r)) if (answers.avoid?.includes(a)) found.add(a)
    if (answers.noHoney && recipeHasHoney(r)) honey = true
  }
  if (found.size) notices.push({ key: 'fmdAllergens', allergens: [...found] })
  if (honey) notices.push({ key: 'fmdHoney' })
  return { kind: 'fmd', starterPlan: starter, portions: answers.people, notices }
}

// ── The week ─────────────────────────────────────────────────────────────

/**
 * @param {object}   args
 * @param {object[]} args.recipes          every recipe in the store
 * @param {object}   args.answers          see defaultAnswers()
 * @param {number|string} args.seed
 * @param {string[]} [args.installedPackIds]
 * @param {object}   [args.slotNames]      see resolveSlotNames()
 */
export function makeMyWeek({ recipes, answers, seed = 1, installedPackIds, slotNames } = {}) {
  const merged = { ...defaultAnswers(), ...answers }
  const a = {
    ...merged,
    goals: answerGoals(merged),
    saltLevel: saltLevelFor(merged),
    kcal: normalizeKcal(merged.kcal),
    snack: Boolean(merged.snack) && merged.meals === 3,
  }
  const installed = installedPackIds ||
    [...new Set((recipes || []).map(r => r.sourcePackId).filter(Boolean))]
  if (a.goals.includes('fmd')) return makeFmdWeek({ recipes, answers: a, installedPackIds: installed })

  const slots = { snack: 'Snack', ...resolveSlotNames(), ...(slotNames || {}) }
  const { pool, goals, relaxed } = poolForGoals(recipes, a)
  const favourites = new Set(a.preferFavourites ? a.favourites : [])
  const ctx = {
    a,
    goals,
    relaxedGoals: relaxed,
    pool,
    target: kcalTarget(goals, a.meals, a.kcal),
    // The user's own target: portions are fitted to it both ways.
    fitted: a.kcal != null,
    shares: sharesFor(a),
    timeLimit: TIME_LIMIT[a.time] ?? TIME_LIMIT.medium,
    preferTag: goals.length ? null : 'heart-healthy',
    preferPack: goals.includes('heart') ? REVERSAL_PACK_ID : null,
    lowSodium: goals.includes('bloodPressure'),
    favourites,
    // At least this many favourites a week, where they fit the rules.
    wantFavourites: Math.min(MIN_FAVOURITES, pool.filter(r => favourites.has(r.id)).length),
    keys: new Map(pool.map(r => [r.id, ingredientKeys(r)])),
  }

  let best = null
  for (let i = 0; i < ATTEMPTS; i++) {
    const rng = mulberry32(hashSeed(`${seed}:${i}`))
    const week = buildAttempt(ctx, rng)
    if (!best || week.penalty < best.penalty) best = week
  }

  return finish(best, ctx, { slots, installed, seed })
}

function buildAttempt(ctx, rng) {
  const { a, pool, shares, target } = ctx
  // days[d][role] = [{ id, batch, kind, servings }]. kind: 'base' (the dish
  // of the meal), 'side' (salad, side, batch bread/spread) or 'extra'.
  // servings is for the whole household, a.people at one portion each.
  const days = DAY_KEYS.map(() => (a.snack
    ? { breakfast: [], lunch: [], dinner: [], snack: [] }
    : { breakfast: [], lunch: [], dinner: [] }))
  const uses = new Map()
  const relax = { cap: 0, time: 0, empty: 0, breakfast: false }
  const byId = new Map(pool.map(r => [r.id, r]))
  const people = a.people

  const usesOf = id => uses.get(id) || []
  const familyDays = new Map()
  // The week's ingredients so far, and how many breakfasts of each flavour.
  const weekKeys = new Set()
  const flavourCount = { sweet: 0, savoury: 0 }
  const keysOf = r => ctx.keys.get(r.id) || ingredientKeys(r)
  const canUse = (id, day, cap) => {
    const list = usesOf(id)
    return list.length < cap && list.every(d => Math.abs(d - day) >= 2)
  }
  const place = (day, role, r, batch = false, kind = 'base') => {
    days[day][role].push({ id: r.id, batch, kind, servings: people })
    for (const k of keysOf(r)) weekKeys.add(k)
    if (kind === 'extra') return
    uses.set(r.id, [...usesOf(r.id), day])
    const fam = dishFamily(r)
    familyDays.set(fam, [...(familyDays.get(fam) || []), day])
  }
  // Per person, at the item's planned portions.
  const itemValue = (it, key) => (Number(perServing(byId.get(it.id))?.[key]) || 0) * it.servings / people
  const mealKcal = (day, role) => days[day][role].reduce((n, it) => n + itemValue(it, 'calories'), 0)
  const mealFibre = (day, role) => days[day][role].reduce((n, it) => n + itemValue(it, 'fiber'), 0)

  function score(r, { kcal, fibre, penalizeMain, day, savoury, flavour }) {
    let s = rng() * 1.2
    if (ctx.preferTag && tagsOf(r).includes(ctx.preferTag)) s += 0.6
    if (ctx.preferPack && r.sourcePackId === ctx.preferPack) s += 0.5
    if (ctx.favourites.has(r.id)) s += 0.9
    if (a.fewerIngredients) {
      // A dish the week already has costs nothing new to buy; otherwise
      // every ingredient not yet on the list counts against it.
      let fresh = 0
      for (const k of keysOf(r)) if (!weekKeys.has(k)) fresh++
      s -= 0.1 * fresh
      if (usesOf(r.id).length) s += 0.3
    } else if (usesOf(r.id).length) s -= 0.4
    if (flavour && flavourOf(r) === flavour) s += 1
    for (const d of familyDays.get(dishFamily(r)) || []) s -= Math.abs(d - (day ?? -9)) <= 1 ? 1.2 : 0.6
    if (penalizeMain && r.category === 'Main') s -= 0.8
    if (savoury && isSweet(r)) s -= 1.5
    const n = perServing(r)
    if (n) {
      if (kcal > 0) s -= Math.min(2, Math.abs(Number(n.calories) - kcal) / kcal)
      if (fibre > 0) s += 0.5 * Math.min(1, (Number(n.fiber) || 0) / fibre)
      if (ctx.lowSodium) s -= 0.8 * Math.min(1.5, (Number(n.sodium) || 0) / 800)
    } else {
      s -= 0.15
    }
    return s
  }

  // Best candidate under the rules; relaxes a third repeat first, then the
  // weekday time limit. Consecutive days and the pool are never relaxed.
  // `strict`: no relaxing at all (null when nothing fits as it is).
  function pick(cands, day, opts = {}) {
    for (let stage = 0; stage < (opts.strict ? 1 : 3); stage++) {
      const cap = stage >= 1 ? MAX_USES + 1 : MAX_USES
      const limit = stage >= 2 || !isWeekday(day) ? Infinity : ctx.timeLimit
      const ok = cands.filter(r =>
        !batchIds.has(r.id) && canUse(r.id, day, cap) && fitsTime(r, limit))
      if (!ok.length) continue
      if (stage === 1) relax.cap++
      if (stage === 2) relax.time++
      let top = null
      let topScore = -Infinity
      for (const r of ok) {
        const s = score(r, { ...opts, day })
        if (s > topScore) { top = r; topScore = s }
      }
      return top
    }
    return null
  }

  // ── Sunday batch ──
  const mainTypes = a.meals === 2 ? ['lunch', 'dinner'] : ['dinner']
  const mainRole = a.meals === 2 ? 'lunch' : 'dinner'
  const batch = { soup: null, bread: null, spread: null }
  const batchIds = new Set()
  if (a.batch) {
    const best = (cands, extra = () => 0, opts = {}) => {
      let top = null
      let topScore = -Infinity
      for (const r of cands) {
        const s = score(r, opts) + extra(r)
        if (s > topScore) { top = r; topScore = s }
      }
      return top
    }
    batch.soup = best(pool.filter(r => r.category === 'Soup' && isFilling(r, mainTypes) && isBatchFriendly(r)),
      r => (Number(r.servings) >= 6 ? 0.5 : 0))
    batch.bread = best(pool.filter(r => isBread(r) && isBatchFriendly(r)))
    // Eaten with lunch or dinner, so a savoury spread (hummus, bean pâté) —
    // unless the breakfast answer was sweet only: spreads follow it.
    if (batch.bread) {
      const spreads = pool.filter(r => isSpread(r) && isBatchFriendly(r))
      const want = a.breakfast === 'sweet' ? 'sweet' : 'savoury'
      const matching = spreads.filter(r => flavourOf(r) === want)
      batch.spread = best(matching.length ? matching : spreads, undefined, want === 'savoury' ? { savoury: true } : { flavour: want })
    }
    if (batch.soup) {
      BATCH_SOUP_DAYS.forEach((day, i) => {
        // Three meals: dinner, lunch, dinner — the same soup three evenings
        // running is a lot. Otherwise always the main meal.
        const role = a.meals === 3 && i === 1 ? 'lunch' : mainRole
        place(day, role, batch.soup, true)
      })
    }
    const breadRole = a.meals === 1 ? 'dinner' : 'lunch'
    for (const day of BATCH_BREAD_DAYS) {
      if (batch.bread) place(day, breadRole, batch.bread, true, 'side')
      if (batch.spread) place(day, breadRole, batch.spread, true, 'side')
    }
    for (const r of Object.values(batch)) if (r) batchIds.add(r.id)
  }

  // ── Main meals first: their filling bases are the scarcest recipes ──
  const fillingCands = pool.filter(r => isFilling(r, mainTypes))
  const sideCands = pool.filter(isSide)
  const breadSideCands = pool.filter(r => isBread(r) && fitsTime(r, FRESH_BREAD_MAX_MINUTES))
  const mainShare = ctx.shares[mainRole]
  for (let day = 0; day < 7; day++) {
    const slotTarget = target * mainShare
    const items = days[day][mainRole]
    let base = items.map(it => byId.get(it.id)).find(r => r && isFilling(r, mainTypes))
    if (!base) {
      base = pick(fillingCands, day, { kcal: slotTarget * 0.7, fibre: FIBRE_TARGET * mainShare * 0.6 })
      if (!base) { relax.empty++; continue }
      place(day, mainRole, base)
    }
    const hasBread = items.some(it => byId.get(it.id) && isBread(byId.get(it.id)))
    const needSide = !hasBread && (base.category === 'Soup' || mealKcal(day, mainRole) < slotTarget * 0.85)
    if (needSide) {
      // A soup may take bread as its side; a main only a salad or vegetable.
      const cands = base.category === 'Soup' ? [...sideCands, ...breadSideCands] : sideCands
      const side = pick(cands, day, {
        kcal: Math.max(100, slotTarget - mealKcal(day, mainRole)),
        fibre: Math.max(0, FIBRE_TARGET * mainShare - mealFibre(day, mainRole)),
      })
      if (side) place(day, mainRole, side, false, 'side')
    }
  }

  // ── Lunch (three-meal days): soup, salad or a lunch dish ──
  if (a.meals === 3) {
    const lunchCands = pool.filter(isLunchDish)
    for (let day = 0; day < 7; day++) {
      if (days[day].lunch.some(it => byId.get(it.id)?.category === 'Soup')) continue
      const r = pick(lunchCands, day, {
        kcal: Math.max(150, target * shares.lunch - mealKcal(day, 'lunch')),
        fibre: FIBRE_TARGET * shares.lunch,
        penalizeMain: true,
      })
      if (r) place(day, 'lunch', r)
      else relax.empty++
    }
  }

  // ── Breakfast ──
  if (shares.breakfast) {
    const all = pool.filter(isBreakfast)
    // Sweet or savoury only: those breakfasts, unless there are too few
    // to fill a week — then the others too, the asked kind still first.
    const matching = a.breakfast === 'both' ? all : all.filter(r => flavourOf(r) === a.breakfast)
    const enough = a.breakfast === 'both' || matching.length >= MIN_OTHER
    if (!enough && matching.length < all.length) relax.breakfast = true
    const bfCands = enough ? matching : all
    for (let day = 0; day < 7; day++) {
      const opts = { kcal: target * shares.breakfast, fibre: FIBRE_TARGET * shares.breakfast }
      let r = null
      if (a.breakfast === 'both') {
        // A mix: the kind the week has had less of so far, when one fits
        // without bending a rule; else whatever fits best.
        const less = flavourCount.savoury < flavourCount.sweet ? 'savoury' : flavourCount.sweet < flavourCount.savoury ? 'sweet' : null
        if (less) r = pick(bfCands.filter(c => flavourOf(c) === less), day, { ...opts, strict: true })
      }
      if (!r) r = pick(bfCands, day, { ...opts, flavour: enough ? null : a.breakfast })
      if (r) { place(day, 'breakfast', r); flavourCount[flavourOf(r)]++ }
      else relax.empty++
    }
  }

  // ── Snack (three meals + snack): a snack recipe that fits every rule as
  // it is, else a piece of fruit. A snack never bends a rule. ──
  const snackFruit = DAY_KEYS.map(() => 0)
  if (shares.snack) {
    const snackCands = pool.filter(isSnack)
    for (let day = 0; day < 7; day++) {
      const r = pick(snackCands, day, { kcal: target * shares.snack, fibre: FIBRE_TARGET * shares.snack, strict: true })
      if (r) place(day, 'snack', r, false, 'snack')
      else snackFruit[day] = 1
    }
  }

  // ── Portions and extras ──
  const dayTarget = target * Object.values(shares).reduce((n, s) => n + s, 0)
  const fibreTarget = FIBRE_TARGET * Object.values(shares).reduce((n, s) => n + s, 0)
  // The week's extra bread: the batch loaf when there is one (it just gets
  // a few more servings), else the pool's best savoury bread.
  const extraBread = (batch.bread && perServing(batch.bread))
    ? batch.bread
    : pickExtraBread(pool.filter(r => isBread(r) && perServing(r) && !isSweet(r)), rng)
  // A snack day's fruit is counted from the start; more may be added below.
  const fruit = [...snackFruit]
  const known = days.map(d => Object.values(d).every(list => list.every(it => perServing(byId.get(it.id)))))
  const platesKcal = day => Object.keys(days[day]).reduce((n, role) => n + mealKcal(day, role), 0)
  const dayKcal = day => platesKcal(day) + snackFruit[day] * FRUIT.kcal

  for (let day = 0; day < 7; day++) {
    if (!known[day]) continue
    if (ctx.fitted) { fitDay(day); continue }
    growPortions(day)
    if (dayKcal(day) < dayTarget * LOW && extraBread) addBread(day)
    // A day of light dishes that even the most fruit can't fill takes bread
    // beside a second meal too.
    while (dayKcal(day) + MAX_FRUIT * FRUIT.kcal < dayTarget * LOW && extraBread && addBread(day)) { /* next meal */ }
    const short = dayTarget * FILL_TO - dayKcal(day)
    if (dayKcal(day) < dayTarget * LOW) {
      fruit[day] = Math.min(MAX_FRUIT, fruit[day] + Math.max(1, Math.round(short / FRUIT.kcal)))
    }
  }

  // ── With the user's own target: portions both ways ──
  // Fit the portions; still short at the largest: bread beside a meal, then
  // fruit. A day still over at the smallest portions is left for the
  // attempt's penalty, so a week of lighter dishes wins.
  function fitDay(day) {
    fitPortions(day)
    while (dayKcal(day) < dayTarget * (1 - TARGET_BAND) && extraBread && addBread(day)) fitPortions(day)
    if (dayKcal(day) < dayTarget * (1 - TARGET_BAND)) {
      const short = dayTarget - dayKcal(day)
      fruit[day] = Math.min(MAX_FRUIT, fruit[day] + Math.max(1, Math.round(short / FRUIT.kcal)))
    }
  }

  // [least, most, step] servings for the household. Dishes ½–2 portions
  // per person, in half portions where that is a whole serving (2 people:
  // 1–4 in steps of 1), else one serving at a time. Sides, snacks and bread
  // ½–1, bread one serving (whole slices) at a time; spreads stay as they are.
  function fitRange(it) {
    const r = byId.get(it.id)
    const least = Math.max(1, Math.ceil(people * MIN_PORTIONS))
    const step = people % 2 === 0 ? people / 2 : 1
    if (isSpread(r)) return [it.servings, it.servings, 0]
    if (isBread(r)) return [it.kind === 'extra' ? 1 : least, people, 1]
    if (it.kind !== 'base' || r.category === 'Side') return [least, people, step]
    return [least, Math.round(people * MAX_PORTIONS), step]
  }

  // One step at a time, the change that brings the day closest to its
  // target, keeping each meal near its share and portions near one each.
  // Every step must bring the day closer, so this ends.
  function fitPortions(day) {
    const items = Object.entries(days[day]).flatMap(([role, list]) => list.map(it => ({ role, it })))
    for (;;) {
      const now = dayKcal(day)
      const gap = Math.abs(dayTarget - now)
      if (gap <= dayTarget * FIT_CLOSE) return
      let best = null
      let bestScore = Infinity
      for (const x of items) {
        const [least, most, step] = fitRange(x.it)
        if (!step) continue
        for (const next of [x.it.servings + step, x.it.servings - step]) {
          if (next < least || next > most) continue
          const delta = itemValue({ ...x.it, servings: next - x.it.servings }, 'calories')
          const after = Math.abs(dayTarget - (now + delta))
          if (!(after < gap - 0.5)) continue
          const share = target * (shares[x.role] || 0)
          const off = Math.abs(next / people - 1)
          const s = after +
            0.25 * Math.abs(share - (mealKcal(day, x.role) + delta)) +
            (off > Math.abs(x.it.servings / people - 1) ? 0.03 * dayTarget * off : 0) -
            (x.it.kind === 'base' ? 1 : 0)
          if (s < bestScore) { best = { it: x.it, next }; bestScore = s }
        }
      }
      if (!best) return
      best.it.servings = best.next
    }
  }

  // Raise portions one step at a time, always on the meal furthest below
  // its share of the day, until the day is full or nothing fits under HIGH.
  function growPortions(day) {
    // Half a portion each where that is a whole serving (2 people: 2 → 3),
    // else one serving at a time (3 people: 3 → 4 → 5).
    const step = people % 2 === 0 ? people / 2 : 1
    const items = Object.entries(days[day]).flatMap(([role, list]) => list.map(it => ({ role, it })))
    for (;;) {
      const now = dayKcal(day)
      if (now >= dayTarget * FILL_TO) return
      let best = null
      let bestNeed = -Infinity
      for (const x of items) {
        if (x.it.servings + step > maxServings(x.it)) continue
        const add = itemValue({ ...x.it, servings: step }, 'calories')
        if (!(add > 0) || now + add > dayTarget * HIGH) continue
        const need = 1 - mealKcal(day, x.role) / (target * (shares[x.role] || 1))
        // On a tie, grow the dish rather than a second dish beside it.
        const s = need + (x.it.kind === 'base' ? 0.01 : 0)
        if (s > bestNeed) { best = x; bestNeed = s }
      }
      if (!best) return
      best.it.servings += step
    }
  }

  function maxServings(it) {
    const r = byId.get(it.id)
    // A Side category dish (patties at breakfast) stays one portion too;
    // the day is filled with bread beside it instead.
    if (it.kind !== 'base' || isBread(r) || isSpread(r) || r.category === 'Side') return people
    return Math.round(people * MAX_PORTIONS)
  }

  // Bread on the side of a meal that has none: lunch first, then the main
  // meal, then breakfast. One portion (2 slices) a person, or half when a
  // whole one would overshoot. False when every meal already has bread.
  function addBread(day) {
    const roles = ['lunch', a.meals === 2 ? 'lunch' : 'dinner', 'breakfast']
      .filter((role, i, list) => shares[role] && list.indexOf(role) === i)
    const role = roles.find(ro => days[day][ro].length &&
      !days[day][ro].some(it => isBread(byId.get(it.id))))
    if (!role) return false
    const per = itemValue({ id: extraBread.id, servings: people }, 'calories')
    const now = dayKcal(day)
    const half = Math.max(1, Math.round(people / 2))
    const servings = now + per <= dayTarget * HIGH ? people : half
    days[day][role].push({ id: extraBread.id, batch: extraBread === batch.bread, kind: 'extra', servings })
    return true
  }

  // ── How good is it? ──
  let penalty = relax.empty * 100 + relax.time * 5 + relax.cap * 3
  const dayStats = days.map((d, day) => {
    if (!known[day]) return { day, kcal: 0, fibre: 0, known: false, fruit: 0 }
    const kcal = platesKcal(day) + fruit[day] * FRUIT.kcal
    const fibre = Object.keys(d).reduce((n, role) => n + mealFibre(day, role), 0) + fruit[day] * FRUIT.fibre
    penalty += 2 * Math.abs(kcal - dayTarget) / dayTarget
    penalty += Math.max(0, fibreTarget - fibre) / fibreTarget
    // Fruit is fine, but a day made of plates beats one topped up with it.
    penalty += 0.05 * fruit[day]
    if (ctx.fitted) {
      // Outside the band costs a lot; scaling a little: lighter or heavier
      // dishes are better than extreme portions.
      if (Math.abs(kcal - dayTarget) / dayTarget > TARGET_BAND) penalty += 3
      for (const list of Object.values(d)) {
        for (const it of list) if (it.kind !== 'extra') penalty += 0.1 * Math.abs(it.servings / people - 1)
      }
    }
    const meals = Object.fromEntries(Object.keys(d).map(role => [role, mealKcal(day, role)]))
    return { day, kcal, fibre, known: true, fruit: fruit[day], meals }
  })
  // Favourites asked for but too few of them made it in.
  const favouritesUsed = [...uses.keys()].filter(id => ctx.favourites.has(id)).length
  penalty += 1.5 * Math.max(0, ctx.wantFavourites - favouritesUsed)
  if (a.fewerIngredients) penalty += 0.08 * weekKeys.size

  return { days, uses, relax, batch, penalty, dayStats, dayTarget, fibreTarget, byId, fruit, snackFruit, favouritesUsed, uniqueIngredients: weekKeys.size }
}

// The bread a week tops up with when the dishes alone are short: savoury,
// high in fibre, and a loaf that keeps (batch-friendly) over a quick bun.
function pickExtraBread(cands, rng) {
  let top = null
  let topScore = -Infinity
  for (const r of cands) {
    const n = perServing(r)
    const s = rng() * 0.3 +
      Math.min(1, (Number(n.fiber) || 0) / 10) +
      (tagsOf(r).includes('batch-friendly') ? 0.3 : 0) -
      Math.min(1, (Number(n.sodium) || 0) / 1000)
    if (s > topScore) { top = r; topScore = s }
  }
  return top
}

function finish(week, ctx, { slots, installed, seed }) {
  const { a, pool } = ctx
  const notices = []

  for (const packId of MMW_PACK_IDS) {
    if (!installed.includes(packId)) notices.push({ key: 'packMissing', packId })
  }

  // One portion each stays `servings: null` (follows the household size);
  // more is a fixed whole number for the household, like any adjusted dish.
  const servingsOf = it => (it.servings === a.people ? null : it.servings)
  const plan = {}
  const extras = []
  const fruit = {}
  DAY_KEYS.forEach((dayKey, day) => {
    const d = week.days[day]
    const out = {}
    for (const role of ['breakfast', 'lunch', 'dinner', 'snack']) {
      if (!d[role]?.length) continue
      out[slots[role]] = d[role].map(it => it.batch
        ? { recipeId: it.id, servings: servingsOf(it), excludeFromShopping: true }
        : { recipeId: it.id, servings: servingsOf(it) })
      for (const it of d[role]) {
        if (it.kind === 'extra') extras.push({ day: dayKey, slot: slots[role], recipeId: it.id, kind: 'bread' })
      }
    }
    plan[dayKey] = out
    if (week.fruit[day]) fruit[dayKey] = week.fruit[day]
  })

  // Batch entries sized to what is actually eaten: every planned serving
  // of the batch recipe, extra bread included.
  const batchCook = []
  for (const kind of ['soup', 'bread', 'spread']) {
    const r = week.batch[kind]
    if (!r) continue
    const eaten = week.days.flatMap(d => Object.values(d).flat())
      .filter(it => it.batch && it.id === r.id)
      .reduce((n, it) => n + it.servings, 0)
    batchCook.push({ id: `mmw-${hashSeed(String(seed))}-${kind}`, kind: 'recipe', recipeId: r.id, servings: eaten })
  }

  if (a.batch) {
    if (week.batch.soup || week.batch.bread) {
      notices.push({
        key: 'batchTip',
        soup: week.batch.soup?.id || null,
        bread: week.batch.bread?.id || null,
        spread: week.batch.spread?.id || null,
      })
    }
    if (!week.batch.soup) notices.push({ key: 'batchNoSoup' })
    if (!week.batch.bread) notices.push({ key: 'batchNoBread' })
  }

  // A health goal with too few tagged mains: dinners lean on a soup or
  // stew with a side. Worth saying, so it doesn't look like a mistake.
  const mainRole = a.meals === 2 ? 'lunch' : 'dinner'
  if (ctx.relaxedGoals.length) notices.push({ key: 'goalRelaxed', goals: ctx.relaxedGoals, kept: ctx.goals })
  if (ctx.goals.length) {
    const soupDinners = week.days.filter(d =>
      d[mainRole].some(it => week.byId.get(it.id)?.category === 'Soup')).length
    if (soupDinners >= 4) notices.push({ key: 'dinnerSoupSide', goal: ctx.goals[0] })
  }
  if (week.relax.breakfast) notices.push({ key: 'breakfastRelaxed', breakfast: a.breakfast })
  if (a.preferFavourites && a.favourites.length) {
    notices.push(week.favouritesUsed ? { key: 'favouritesUsed', count: week.favouritesUsed } : { key: 'noFavourites' })
  }

  if (week.relax.time) notices.push({ key: 'relaxTime', count: week.relax.time })
  if (week.relax.cap) notices.push({ key: 'relaxCap' })
  if (week.relax.empty) notices.push({ key: 'emptySlots', count: week.relax.empty })
  if (!pool.length) notices.push({ key: 'noRecipes' })

  const known = week.dayStats.filter(s => s.known)
  const stats = known.length
    ? {
        kcal: Math.round(known.reduce((n, s) => n + s.kcal, 0) / known.length),
        fibre: Math.round(known.reduce((n, s) => n + s.fibre, 0) / known.length),
        kcalTarget: Math.round(week.dayTarget),
        fibreTarget: Math.round(week.fibreTarget),
        days: known.length,
        // With dinner only, the figures are per dinner, not per day.
        meals: a.meals,
        // Per person, per day (fruit included), in DAY_KEYS order.
        perDay: Object.fromEntries(known.map(s => [DAY_KEYS[s.day], { kcal: Math.round(s.kcal), fibre: Math.round(s.fibre) }])),
        // Per person, per meal row of each day (fruit not included).
        perMeal: Object.fromEntries(known.map(s => [DAY_KEYS[s.day],
          Object.fromEntries(Object.entries(s.meals).filter(([role]) => week.days[s.day][role].length)
            .map(([role, kcal]) => [slots[role], Math.round(kcal)]))])),
        // True when the target is the user's own (the calorie question).
        fitted: ctx.fitted,
      }
    : null
  const allItems = week.days.flatMap(d => Object.values(d).flat())
  if (ctx.fitted) {
    if (allItems.some(it => it.kind !== 'extra' && it.servings !== a.people)) notices.push({ key: 'portionsFitted', target: Math.round(week.dayTarget) })
  } else if (allItems.some(it => it.kind !== 'extra' && it.servings > a.people)) {
    notices.push({ key: 'portionsScaled' })
  }
  if (extras.length) notices.push({ key: 'extraBread', bread: extras[0].recipeId })
  if (week.snackFruit.some(n => n > 0)) notices.push({ key: 'snackFruit' })
  else if (Object.keys(fruit).length) notices.push({ key: 'extraFruit' })
  if (stats && stats.kcal < stats.kcalTarget * LOW) notices.push({ key: 'kcalLow', target: stats.kcalTarget })
  if (ctx.fitted && stats) {
    const off = known.filter(s => Math.abs(s.kcal - week.dayTarget) / week.dayTarget > TARGET_BAND).length
    if (off) notices.push({ key: 'kcalOffTarget', count: off })
  }
  // Low is forced for blood pressure, heart and diabetes: say why.
  notices.push({ key: 'saltLevel', level: a.saltLevel, auto: a.goals.some(g => LOW_SALT_GOALS.includes(g)) })

  const planned = [...new Set(week.days.flatMap(d => Object.values(d).flat().map(it => it.id)))]
  return {
    kind: 'week',
    plan,
    batchCook,
    portions: a.people,
    notices,
    stats,
    saltLevel: a.saltLevel,
    goals: ctx.goals,
    // Different ingredients the week's shopping needs (water left out).
    uniqueIngredients: uniqueIngredientCount(planned.map(id => week.byId.get(id)).filter(Boolean)),
    // Added to fill the day, not chosen as dishes: exempt from the repeat
    // rules. Fruit is a count per person for a day note, not a plan item.
    extras,
    fruit,
    poolSize: pool.length,
  }
}

// The recipe criteria shared by the proposal report
// (scripts/build_recipe_proposals.mjs), the per-recipe tool
// (scripts/label-recipes.mjs) and check-recipes: per-serving nutrition
// checked against an ingredient estimate, prep/cook time, meal types and the
// fixed set of good-for labels, each by the explicit CRITERIA below.
// Read-only: nothing here writes a pack.
import { estimateRecipe, FIELDS, PACK_KEY, round, food } from './recipeNutritionEstimate.mjs'
import { recipeAllergens } from '../../src/data/allergens.js'

export const LABELS = ['weight-loss', 'blood-pressure-friendly', 'diabetes-friendly', 'heart-healthy', 'gluten-free',
  'nut-free', 'soy-free', 'oil-free', 'no-added-sugar', 'quick', 'batch-friendly', 'kid-friendly']
export const HEALTH = ['weight-loss', 'blood-pressure-friendly', 'diabetes-friendly', 'heart-healthy']

// ── criteria (rendered verbatim at the top of the .md) ─────────────────────
// "Meal" = a recipe whose meal types include breakfast, lunch or dinner.
// "Other" = side, snack, dessert or component only. Values are per serving
// unless stated. Health labels need nutrition at medium/high confidence.
export const CRITERIA = {
  'weight-loss': 'Energy density ≤ 150 kcal/100 g (Rolls, "low energy density"). Meal: ≤ 500 kcal, fibre ≥ 3 g, sat. fat ≤ 3 g. Other: ≤ 200 kcal, sat. fat ≤ 2 g. Added sugar ≤ 2.5 g and no sugar/syrup/honey/juice/oat-drink ingredient. Needs a serving weight.',
  'blood-pressure-friendly': 'Servings of 100 g or more: sodium ≤ 140 mg per 100 g (FDA "low sodium" meal level) and ≤ 600 mg per serving. Smaller servings: ≤ 140 mg per serving and ≤ 140 mg per 50 g (FDA "low sodium" rule for small portions). Potassium ≥ sodium (mg). Sat. fat ≤ 4 g (meal) / ≤ 2 g (other). Added sugar ≤ 2.5 g (DASH limits sweets). Sodium judged conservatively: the higher of the stored value and the ingredient estimate with ordinary (salted) canned beans and broth, unless the row itself says low-sodium/no-salt/rinsed.',
  'diabetes-friendly': 'Meal: carbohydrate ≤ 60 g, total sugars ≤ 20 g and ≤ 12.5 g/100 g, fibre ≥ 3 g. Other: carbohydrate ≤ 25 g, total sugars ≤ 10 g and ≤ 10 g/100 g, fibre ≥ 2 g. Always: oil-free (same rule as the oil-free label), fibre ≥ 10% of carbohydrate, sat. fat ≤ 3 g, added sugar ≤ 2.5 g, no sugar/syrup/honey/juice/oat-drink ingredient, starch base not refined (white flour, white-rice flour/noodles, glass noodles, regular lasagne sheets, degermed polenta, GF starch mixes, breadcrumbs).',
  'heart-healthy': 'No added oil (ingredient or method) and no coconut milk/cream/oil. Sat. fat ≤ 3 g (meal) / ≤ 2 g (other). Sodium ≤ 600 mg (meal) / ≤ 360 mg (other), same conservative sodium as above. Fibre ≥ 3 g (meal) / ≥ 1.5 g (other). Added sugar ≤ 2.5 g. Cholesterol 0 mg (all three packs are plant-based).',
  'gluten-free': 'No wheat, spelt, rye, barley, bulgur, gluten flour, bread/crumbs/crispbread, regular lasagne sheets, barley coffee, rye sourdough starter or wheat soy sauce. Oats only if the row says gluten-free. Miso and bouillon pass with "use a GF-labelled product". Also must not trip the app\'s own gluten allergen check (src/data/allergens.js).',
  'nut-free': 'No tree nuts or peanuts, incl. nut milks, nut butters and the pack\'s cashew sauces; must not trip the app\'s tree-nut/peanut check. Coconut is not counted as a tree nut (FDA, 2025) but is named in the reason.',
  'soy-free': 'No tofu, soy drink/yogurt, soy sauce, tamari, miso, edamame or soy mayonnaise; an unspecified "plant milk"/"plant yogurt" fails (it is often soy). Must not trip the app\'s soy check.',
  'oil-free': 'No oil of any kind in the ingredients (olive, rapeseed, sesame, coconut; also mayonnaise and commercial hummus) and no oil in the method text. Whole-food fats (nuts, seeds, tahini, avocado, olives) are allowed.',
  'no-added-sugar': 'No sugar, syrup, honey, sweetened dried fruit, ketchup, fruit juice (lemon/lime juice exempt) or oat drink (its enzymatic maltose counts as added): WHO "free sugars". Whole/dried fruit and dates (also blended or as date paste) are allowed and named in the reason. Erythritol (Sukrin) is allowed and named.',
  'quick': 'Prep + cook ≤ 20 min (stored, or proposed here when missing) and no soaking, rising, chilling, setting, fermenting, sprouting or overnight step.',
  'batch-friendly': 'Makes ≥ 4 servings and keeps ≥ 3 days chilled or freezes: soups, stews, bakes, burgers/patties/balls, breads, granola, porridges, spreads/dips (not avocado-based), cooked or nut-based sauces, jams, ferments. Not leafy or avocado salads, drinks, crisps.',
  'kid-friendly': 'Judgement, low confidence. Never for the FMD pack (a fasting protocol). A meal, snack, side or dessert (not a component, not a salad other than fruit/potato salad), no chilli/cayenne/hot sauce/horseradish, and a familiar format: porridge, pancakes, waffles, oats, smoothies, bread/buns, burgers/balls/patties, lasagne/pizza, potatoes/fries/mash, smooth soups, hummus, jam, desserts. Whole nuts: choking risk under 5, named in the reason.',
}
// ── servings for whole batches / implausible portions (judgement) ──────────
// servingWeightGrams is the eaten portion (after baking/dehydrating where
// the method changes the weight). basis says how the count was reached.
export const SERVINGS = {
  'homemade-whole-wheat-bread': { servings: 88, portion: { en: '2 slices (~92 g baked)', no: '2 skiver (~92 g bakt)', sv: '2 skivor (~92 g bakat)' }, sw: 92, basis: '9.2 kg dough → ~8.0 kg baked (≈13% bake loss) in 11 loaves (steps: 800–900 g each); 16 slices a loaf, 2 slices a serving.' },
  'toms-gluten-free-bread': { servings: 24, portion: { en: '2 slices (~110 g baked)', no: '2 skiver (~110 g bakt)', sv: '2 skivor (~110 g bakat)' }, sw: 110, basis: '3.0 kg dough → ~2.6 kg baked in two 1.5 l tins; 24 slices a loaf, 2 slices a serving.' },
  // Sliced loaves stored as 1 slice a serving; a bread serving is 2 slices.
  'fluffy-gluten-free-loaf': { servings: 6, portion: { en: '2 slices (~134 g)', no: '2 skiver (~134 g)', sv: '2 skivor (~134 g)' }, sw: 134, basis: '12 slices (description); 2 slices a serving.' },
  'orn-38': { servings: 8, portion: { en: '2 slices (~116 g)', no: '2 skiver (~116 g)', sv: '2 skivor (~116 g)' }, sw: 116, basis: '16 slices of 58 g; 2 slices a serving.' },
  'orn-39': { servings: 8, portion: { en: '2 slices (~116 g)', no: '2 skiver (~116 g)', sv: '2 skivor (~116 g)' }, sw: 116, basis: '16 slices of 58 g; 2 slices a serving.' },
  'orn-66': { servings: 6, portion: { en: '2 slices (~214 g)', no: '2 skiver (~214 g)', sv: '2 skivor (~214 g)' }, sw: 214, basis: '12 slices (description); 2 slices a serving.' },
  'ellens-granola': { servings: 80, portion: { en: '50 g', no: '50 g', sv: '50 g' }, sw: 50, basis: '5.4 kg raw incl. 0.75 l water and 0.75 kg apple, dehydrated 24 h → ~4.0 kg dry; 50 g portions.' },
  'fr-63': { servings: 160, portion: { en: '50 g', no: '50 g', sv: '50 g' }, sw: 50, basis: '10.1 kg raw incl. 1 l water and 1.4 kg banana, dried → ~8.1 kg; 50 g portions.' },
  'fr-60': { servings: 120, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '3.6 kg incl. 2 l water (not cooked down, steps: 2–3 min); 30 g portions.' },
  'fr-18': { servings: 18, portion: { en: '20 g (1 tbsp)', no: '20 g (1 ss)', sv: '20 g (1 msk)' }, sw: 20, basis: '360 g batch; jam portion 20 g.' },
  'fr-52': { servings: 20, portion: { en: '20 g (1 tbsp)', no: '20 g (1 ss)', sv: '20 g (1 msk)' }, sw: 20, basis: '418 g batch; jam portion 20 g.' },
  'fr-134': { servings: 16, portion: { en: '20 g (1 tbsp)', no: '20 g (1 ss)', sv: '20 g (1 msk)' }, sw: 20, basis: '320 g batch; jam portion 20 g.' },
  'fig-spread': { servings: 29, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '875 g batch; spread portion 30 g.' },
  'fr-136': { servings: 6, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '192 g batch; spread portion 30 g.' },
  'fr-51': { servings: 13, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '407 g batch; cheese portion 30 g.' },
  'fr-130': { servings: 40, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '1.26 kg set cheese (1 l water + agar); 30 g portions.' },
  'fr-183': { servings: 40, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '1.28 kg set cheese; 30 g portions.' },
  'hazelnut-and-sundried-tomato-cheese': { servings: 38, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '1.14 kg set cheese; 30 g portions.' },
  'caraway-and-cashew-cheese': { servings: 44, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '1.31 kg set cheese (1 l water + agar); 30 g portions (now 5 × 261 g).' },
  'fr-3': { servings: 40, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '1.25 kg cheese; 30 g portions (now 10 × 125 g).' },
  'fredheim-deluxe-plant-based-cream-cheese': { servings: 65, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '1.97 kg batch; 30 g portions (now 16 × 124 g at 373 kcal).' },
  'soy-mozzarella': { servings: 23, portion: { en: '30 g', no: '30 g', sv: '30 g' }, sw: 30, basis: '687 g batch; 30 g portions.' },
  'plant-based-butter': { servings: 13, portion: { en: '10 g (2 tsp)', no: '10 g (2 ts)', sv: '10 g (2 tsk)' }, sw: 10, basis: '131 g batch; spread like butter, 10 g.' },
  'fr-179': { servings: 12, portion: { en: '75 g (topping for 2 slices)', no: '75 g (topping til 2 skiver)', sv: '75 g (topping till 2 skivor)' }, sw: 75, basis: '901 g topping; 75 g each.' },
  'fr-50': { servings: 14, portion: { en: '2 balls (~40 g)', no: '2 kuler (~40 g)', sv: '2 bollar (~40 g)' }, sw: 40, basis: '~560 g mixture rolled into ~28 balls of 20 g.' },
  'fr-40': { servings: 8, portion: { en: '~40 g dried chips', no: '~40 g tørkede chips', sv: '~40 g torkade chips' }, sw: 40, basis: '320 g kale + cashew coating (~1 kg wet) dehydrated → ~320 g; 40 g portions. Yield uncertain.' },
  'fr-53': { servings: 4, portion: { en: '~20 g croutons', no: '~20 g krutonger', sv: '~20 g krutonger' }, sw: 20, basis: '70 g bread + oil, baked; topping for 4 bowls.' },
  'fr-69': { servings: 70, portion: { en: '1 tbsp paste (~15 g)', no: '1 ss pasta (~15 g)', sv: '1 msk pasta (~15 g)' }, sw: 15, basis: '1.07 kg salt-vegetable paste; used by the spoon as stock base, not eaten as a dish.' },
  'fr-149': { servings: 3, portion: { en: '~200 ml shot/drink', no: '~200 ml (et glass)', sv: '~200 ml (ett glas)' }, sw: 210, basis: '635 g blended citrus-ginger tonic; ~200 ml a glass.' },
  'fermented-red-cabbage': { servings: 50, portion: { en: '50 g side', no: '50 g som tilbehør', sv: '50 g som tillbehör' }, sw: 50, basis: '2.56 kg ferment; 50 g as a side (now 10 × 256 g at 2.1 g sodium).' },
  'pickled-ginger': { servings: 22, portion: { en: '20 g', no: '20 g', sv: '20 g' }, sw: 20, basis: '443 g batch; condiment portion 20 g.' },
  'burger-dressing': { servings: 32, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '960 g batch; dressing portion 30 g (now 10 × 96 g).' },
  'cucumber-and-sunflowerseed-dressing': { servings: 50, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '1.5 kg batch; dressing portion 30 g.' },
  'fr-187': { servings: 12, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '352 g batch; dressing portion 30 g.' },
  'katrines-pesto-dressing': { servings: 15, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '435 g batch; dressing portion 30 g.' },
  'citrus-dressing': { servings: 14, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '434 g batch; dressing portion 30 g.' },
  'peanut-ginger-dressing': { servings: 28, portion: { en: '30 g (2 tbsp)', no: '30 g (2 ss)', sv: '30 g (2 msk)' }, sw: 30, basis: '840 g batch; dressing portion 30 g.' },
  'fr-92': { servings: 55, portion: { en: '15 g (1 tbsp)', no: '15 g (1 ss)', sv: '15 g (1 msk)' }, sw: 15, basis: '830 g batch; ketchup portion 15 g.' },
  'fr-156': { servings: 22, portion: { en: '15 g (1 tbsp)', no: '15 g (1 ss)', sv: '15 g (1 msk)' }, sw: 15, basis: '330 g batch; mayonnaise portion 15 g.' },
  'fr-1': { servings: 17, portion: { en: '15 g (1 tbsp)', no: '15 g (1 ss)', sv: '15 g (1 msk)' }, sw: 15, basis: '258 g batch; aioli portion 15 g (now 6 × 43 g at 213 kcal).' },
  'raw-cheesecake': { servings: 16, portion: { en: '1 slice (~100 g)', no: '1 stykke (~100 g)', sv: '1 bit (~100 g)' }, sw: 100, basis: '1.63 kg cake; 16 slices (now 10 × 163 g at ~630 kcal).' },
  'potato-salad': { servings: 15, portion: { en: '~240 g', no: '~240 g', sv: '~240 g' }, sw: 240, basis: 'Count kept; serving weight corrected to the batch (3.59 kg / 15).', keepCount: true },
  'orn-29': { servings: 1, portion: { en: '1 glass (5.9 g powder + 220 ml water)', no: '1 glass (5,9 g pulver + 220 ml vann)', sv: '1 glas (5,9 g pulver + 220 ml vatten)' }, sw: 226, basis: 'Count kept; the stored 5.9 g is the dry powder only, so per-100 g and energy density read as if it were eaten dry.', keepCount: true },
}

// Recipes that are strained or reduced: the ingredient sum overstates what
// is eaten, so a lower stored value is expected and kept.
export const STRAINED = new Set(['orn-8', 'orn-12', 'orn-23', 'orn-43', 'fmd-broth'])
export const NOT_EATEN = new Set(['orn-37'])
// A stored 0 is treated as "never filled in" when the ingredients give at least this much.
export const FALSE_ZERO_MIN = { protein: 1, totalFat: 1, saturatedFat: 0.5, fiber: 1, totalSugars: 1, sodium: 50, potassium: 50 }
export const SALTY = new Set(['salt', 'herb-salt', 'black-salt', 'soy-sauce', 'tamari', 'vegetable-bouillon', 'miso-paste'])
// Sub-recipes and products whose composition varies by brand/home recipe.
export const UNCERTAIN_INGREDIENTS = new Set(['white-cashew-sauce', 'cashew-sour-cream', 'hummus', 'soy-mayonnaise', 'bread',
  'gluten-free-flour-mix', 'plant-milk', 'plant-yogurt', 'sun-dried-tomatoes', 'vegetable-bouillon', 'crispbread', 'cashew-milk'])
// Dictionary ids that refer to a recipe in the Fredheim pack, for flag inheritance.
export const SUB_RECIPES = { 'white-cashew-sauce': 'fr-191', 'cashew-sour-cream': 'fr-33', 'soy-mayonnaise': 'fr-156' }

// Ingredient rows that are clearly duplicated: identical row (id, quantity,
// unit, no note) in en/no/sv and the method adds that ingredient only once.
// The estimate and labels below are computed without the duplicate, and the
// apply script removes it.
export const DUPLICATE_ROWS = {
  'fr-94': { index: 12, duplicateOf: 3, why: 'second identical "1 tbsp salt" row; the method salts once ("Add remaining ingredients"), and 2 tbsp would be ~2,000 mg sodium a serving' },
}
export function dropDuplicateRows(r) {
  const d = DUPLICATE_ROWS[r.id]
  if (!d) return { recipe: r, fix: null }
  const same = (a, b) => a && b && a.ingredient === b.ingredient && a.quantity === b.quantity && a.unit === b.unit && !a.note && !b.note
  // Already applied (the row is gone in every language): nothing to drop.
  if ([r.ingredients, r.translations?.no?.ingredients, r.translations?.sv?.ingredients].every(list => !list?.some((row, i) => i !== d.duplicateOf && same(row, list[d.duplicateOf])))) return { recipe: r, fix: null }
  for (const list of [r.ingredients, r.translations?.no?.ingredients, r.translations?.sv?.ingredients]) {
    if (!same(list?.[d.index], list?.[d.duplicateOf])) throw new Error(`${r.id}: row ${d.index} is not an exact duplicate of row ${d.duplicateOf}`)
  }
  const row = r.ingredients[d.index]
  return {
    recipe: { ...r, ingredients: r.ingredients.filter((_, i) => i !== d.index) },
    fix: { removeIndex: d.index, duplicateOf: d.duplicateOf, row: { quantity: row.quantity, unit: row.unit, ingredient: row.ingredient }, why: d.why },
  }
}

// ── ingredient groups (dictionary ids) ─────────────────────────────────────
export const OIL = new Set(['olive-oil', 'rapeseed-oil', 'sesame-oil', 'coconut-oil', 'soy-mayonnaise', 'hummus'])
export const COCONUT_FAT = new Set(['coconut-oil', 'coconut-milk', 'coconut-cream'])
// oat-milk: its enzymatic maltose counts as added sugar (decision 2).
export const FREE_SUGAR = new Set(['sugar', 'honey', 'maple-syrup', 'dried-cranberries', 'ketchup', 'orange-juice', 'pineapple-juice', 'oat-milk'])
export const DATES = new Set(['date-paste', 'dates-dried', 'medjool-dates'])
export const REFINED_BASE = new Set(['white-flour', 'rice-flour', 'gluten-free-flour-mix', 'rice-noodles', 'bean-noodles', 'lasagne-sheets', 'cornmeal-polenta', 'bread-crumbs'])
export const GLUTEN = new Set(['wholewheat-flour', 'white-flour', 'spelt-flour', 'rye-flour', 'gluten-flour', 'bulgur', 'bread', 'bread-crumbs', 'crispbread', 'lasagne-sheets', 'barley-coffee', 'sourdough-starter', 'soy-sauce'])
export const OATS = new Set(['rolled-oats', 'small-oats', 'oat-flour', 'oat-milk'])
export const GF_CHECK_LABEL = new Set(['miso-paste', 'vegetable-bouillon'])
export const NUTS = new Set(['almonds', 'almond-butter', 'almond-milk', 'cashews', 'cashew-milk', 'cashew-sour-cream', 'white-cashew-sauce', 'hazelnuts', 'pecans', 'pistachios', 'walnuts', 'peanuts', 'peanut-butter'])
export const WHOLE_NUTS = new Set(['almonds', 'hazelnuts', 'pecans', 'pistachios', 'walnuts', 'peanuts'])
export const COCONUT = new Set(['shredded-coconut', 'coconut-milk', 'coconut-cream', 'coconut-oil'])
export const SOY = new Set(['tofu', 'soy-milk', 'soy-sauce', 'tamari', 'miso-paste', 'edamame-frozen', 'soy-mayonnaise', 'plant-milk', 'plant-yogurt'])
export const HOT = new Set(['cayenne-pepper', 'chili-flakes', 'chili-fresh', 'chili-powder', 'hot-sauce', 'horseradish'])
export const LEAFY = new Set(['arugula', 'salad-leaves', 'romaine-lettuce', 'spinach', 'chinese-cabbage'])

// ── helpers ─────────────────────────────────────────────────────────────────
export const r1 = v => v == null ? null : Math.round(v * 10) / 10
export const stepText = r => (r.steps || []).map(s => typeof s === 'string' ? s : s.text || '').join(' ')
export const ids = r => (r.ingredients || []).map(i => i.ingredient)
export const has = (r, set) => ids(r).filter(id => set.has(id))
export const uniq = a => [...new Set(a)]

export function core(per) {
  if (!per) return null
  const out = {}
  for (const f of FIELDS) out[PACK_KEY[f]] = per[PACK_KEY[f]] ?? null
  return out
}
export function perServingFromTotals(totals, servings) {
  const out = {}
  for (const f of FIELDS) out[PACK_KEY[f]] = round(totals[f] / servings, f)
  return out
}

// ── time from the method ───────────────────────────────────────────────────
export const PASSIVE = /soak|overnight|over natten|rise|prove|proof|ferment|sprout|dehydrat|chill|refrigerat|fridge|freez|set (?:for|overnight|in)|let (?:it )?(?:sit|stand|rest|set|swell|cool)|swell|marinat|cool down|leave it to set/i
// Storage advice ("keeps 3 days in the fridge") is not cooking time.
export const STORAGE = /\bkeeps?\b|\bstored?\b|storing|\blasts?\b|up to \d|will keep|shelf|holdbar|oppbevar|förvar|airtight|in the (?:fridge|refrigerator) for/i
// Typical times when the method cooks but states none (low confidence).
export const HEAT_DEFAULTS = [
  [/waffle/i, 15, 'waffle iron'], [/pancake|griddle|frying pan|in a pan/i, 15, 'pan-cooking'],
  [/oven|bake|roast/i, 30, 'oven'], [/simmer|soup|stew|boil|cook/i, 25, 'simmering/boiling'],
  [/fry|sauté|saute|steam/i, 10, 'frying/steaming'], [/heat|warm/i, 5, 'warming'],
]
export function parseDurations(text) {
  const found = []
  const t = text.replace(/(\d),(\d)/g, '$1.$2')
  const re = /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(days?|hours?|hrs?|h\b|minutes?|mins?|min\b)/gi
  for (const sentence of t.split(/(?<=[.!?])\s+|\s+\d+\)\s+/)) {
    if (STORAGE.test(sentence)) continue
    const inSentence = []
    let m
    while ((m = re.exec(sentence))) {
      const v = Number(m[2] || m[1])
      const u = m[3].toLowerCase()
      inSentence.push({ mins: u.startsWith('d') ? v * 1440 : u.startsWith('h') ? v * 60 : v, text: m[0] })
    }
    if (/overnight|over natten/i.test(sentence)) inSentence.push({ mins: 480, text: 'overnight' })
    // "chill 4 hours or overnight": alternatives, keep the longest.
    if (inSentence.length > 1 && /\bor\b|\beller\b/i.test(sentence) && !/\band\b/i.test(sentence)) {
      found.push(inSentence.reduce((a, b) => (b.mins > a.mins ? b : a)))
    } else found.push(...inSentence)
  }
  return found
}
export function proposeTime(r) {
  const prepKnown = r.prepTime != null && r.prepTime > 0
  const cookKnown = r.cookTime != null && !(r.cookTime === 0 && r.prepTime === 0)
  const text = stepText(r)
  const durations = parseDurations(text)
  // Chia puddings and chia jams need time to gel even when the method is silent.
  const passive = PASSIVE.test(text) || (ids(r).includes('chia-seeds') && /pudding|jam|syltetøy|sylt/i.test(r.title + ' ' + r.category))
  const out = { current: { prepTime: r.prepTime ?? null, cookTime: r.cookTime ?? null }, proposed: null, evidence: '', confidence: null, passive }
  if (prepKnown && cookKnown) return out
  const nIng = (r.ingredients || []).filter(i => i.ingredient !== 'water' && i.ingredient !== 'salt').length
  const chopping = (r.ingredients || []).filter(i => /chop|dice|slice|grate|cut|mince|hakk|skjær|riv|hacka|skär/i.test(i.note || '') || /cut|chop|dice|slice|grate|peel/i.test(text) && ['onions', 'red-onions', 'carrots', 'potatoes', 'sweet-potatoes', 'cabbage', 'red-cabbage', 'leeks', 'bell-peppers', 'zucchini', 'eggplant', 'celeriac', 'beetroot', 'cauliflower', 'broccoli', 'kale', 'tomatoes', 'cucumber', 'apples', 'pears'].includes(i.ingredient)).length
  let prep = 5 + nIng * 1 + chopping * 2
  prep = Math.min(45, Math.max(5, Math.round(prep / 5) * 5))
  let cook = durations.reduce((a, d) => a + d.mins, 0)
  let cookEvidence = durations.length ? `cook = sum of times in the method: ${durations.map(d => d.text).join(' + ')}` : ''
  let confidence = 'medium'
  if (!durations.length) {
    const heat = HEAT_DEFAULTS.find(([re]) => re.test(text))
    if (heat) { cook = heat[1]; cookEvidence = `method cooks (${heat[2]}) but states no time → ${heat[1]} min assumed`; confidence = 'low' }
    else cookEvidence = 'no cooking and no times in the method → cook 0'
  }
  if (cook > 1440) confidence = 'low'
  const proposed = {
    prepTime: prepKnown ? r.prepTime : prep,
    cookTime: cookKnown ? r.cookTime : Math.round(cook),
  }
  out.proposed = proposed
  out.evidence = (cookKnown ? '' : cookEvidence) +
    (prepKnown ? '' : `${cookKnown ? '' : '; '}prep ≈ 5 min + 1 min per ingredient (${nIng}) + 2 min per item to cut (${chopping})`)
  out.confidence = cookKnown ? 'medium' : confidence
  return out
}

// ── meal types ──────────────────────────────────────────────────────────────
export const MEAL_OVERRIDES = {
  'fr-113': ['component'], 'fr-114': ['component'], 'fr-38': ['component'], 'fr-53': ['component'],
  'fr-69': ['component'], 'orn-12': ['component'], 'orn-23': ['component'], 'fmd-broth': ['component'],
  'orn-37': ['component'], 'orn-8': ['component'], 'orn-43': ['component'], 'orn-29': ['snack'],
  'fr-12': ['snack'], 'orn-15': ['snack'], 'orn-63': ['snack', 'dessert'], 'fr-149': ['snack'],
  'orn-7': ['breakfast', 'snack'], 'orn-6': ['breakfast', 'snack'], 'orn-33': ['dessert', 'breakfast'], 'orn-34': ['dessert', 'breakfast'],
  'orn-64': ['breakfast', 'dessert'], 'orn-65': ['dessert', 'snack'], 'orn-60': ['breakfast', 'snack'],
  'chickpea-tofu': ['component'], 'tofu-form': ['lunch', 'dinner'], 'fermented-red-cabbage': ['side'], 'pickled-ginger': ['component'],
  'plant-based-butter': ['component'], 'millet-crackers-hirseknekk': ['snack', 'lunch'], 'sweet-potato-muffins': ['dessert', 'snack'],
  'fr-50': ['dessert', 'snack'], 'caramelized-nuts': ['snack'], 'fr-29': ['dessert', 'snack'], 'zaatar-hummus-salad': ['lunch', 'dinner'],
  'fr-179': ['snack', 'side'], 'fr-7': ['component'], 'fr-78': ['component', 'snack'], 'baba-ghanoush---aubergine-dip': ['component', 'snack'],
  'fr-84': ['component', 'snack'], 'classic-hummus': ['component', 'snack'], 'lemony-chickpea-hummus': ['component', 'snack'],
  'roasted-red-pepper-hummus': ['component', 'snack'], 'orn-46': ['component', 'snack'], 'fr-41': ['breakfast', 'lunch'],
  'scrambled-tofu': ['breakfast', 'lunch'], 'fr-70': ['breakfast', 'lunch', 'dinner'], 'fr-2': ['component', 'lunch'],
  'orn-45': ['side', 'lunch'], 'orn-61': ['side', 'snack'], 'fr-64': ['lunch', 'dinner'], 'fr-143': ['lunch', 'dinner'],
  // fr-27 (Cabbage Soup) was a side at 47 kcal a bowl; with a can of white
  // beans it is a meal, so category Soup decides (lunch, dinner).
}
export function proposeMealTypes(r, perServing) {
  if (MEAL_OVERRIDES[r.id]) return { mealTypes: MEAL_OVERRIDES[r.id], basis: 'per-recipe judgement' }
  const c = r.category
  const t = (r.title || '').toLowerCase()
  if (c === 'Breakfast') return { mealTypes: ['breakfast'], basis: 'category Breakfast' }
  if (c === 'Main' || c === 'Lunch') return { mealTypes: ['lunch', 'dinner'], basis: `category ${c}` }
  if (c === 'Soup') return { mealTypes: ['lunch', 'dinner'], basis: 'category Soup' }
  if (c === 'Salad') {
    const kcal = perServing?.calories ?? 0
    const hearty = kcal >= 200 || has(r, new Set(['quinoa', 'bulgur', 'chickpeas-canned', 'chickpeas-dry', 'white-beans-canned', 'black-beans-canned', 'kidney-beans-canned', 'tofu', 'potatoes', 'rice-noodles', 'lentils-red', 'edamame-frozen'])).length > 0
    return hearty ? { mealTypes: ['lunch', 'dinner', 'side'], basis: 'salad with a starch/protein base' } : { mealTypes: ['side'], basis: 'light salad' }
  }
  if (c === 'Side') return { mealTypes: ['side'], basis: 'category Side' }
  if (c === 'Dessert') return { mealTypes: ['dessert'], basis: 'category Dessert' }
  if (c === 'Snack') return { mealTypes: ['snack'], basis: 'category Snack' }
  if (c === 'Drink') return { mealTypes: ['snack'], basis: 'category Drink' }
  if (c === 'Bread') return /cracker|knekk/.test(t) ? { mealTypes: ['snack', 'side'], basis: 'crispbread' } : { mealTypes: ['breakfast', 'lunch', 'side'], basis: 'category Bread' }
  return { mealTypes: ['component'], basis: `category ${c} (used with other dishes)` }
}
export const isMeal = mt => mt.some(m => m === 'breakfast' || m === 'lunch' || m === 'dinner')

// ── nutrition assessment ────────────────────────────────────────────────────
export function assessNutrition(r, recipesById) {
  const est = estimateRecipe(r)
  const estRegular = estimateRecipe(r, { sodiumMode: 'regular' })
  const servings = r.servings || 1
  const sp = SERVINGS[r.id]
  const newServings = sp && !sp.keepCount ? sp.servings : servings
  const stored = r.nutrition?.perServing || null
  const flat = r.nutrition && !r.nutrition.perServing ? r.nutrition : null
  const calc = perServingFromTotals(est.totals, servings)
  const calcRegularNa = est.totals ? estRegular.totals.sodium / servings : null
  const out = {
    status: 'ok', flags: [], current: core(stored), estimate: calc, ratioKcal: null, proposed: null,
    change: null, fieldsChanged: [], confidence: null, reason: '', micronutrients: null,
    batchWeightRaw: Math.round(est.weight), estimateProblems: est.problems,
    servingWeightGrams: { current: r.servingWeightGrams ?? null, proposed: null },
  }
  const uncertainRows = has(r, UNCERTAIN_INGREDIENTS)
  const unquantified = (r.ingredients || []).filter(i => i.quantity == null).length
  const yieldNotes = []
  if (STRAINED.has(r.id)) yieldNotes.push('strained/reduced: ingredient sum overstates what is eaten')
  if (/dehydrat|bake|oven|roast/i.test(stepText(r))) yieldNotes.push('cooking changes the weight; per-serving values unaffected, per-100 g uses raw weight')
  if (/fry|frying|stek|steka/i.test(stepText(r)) && !has(r, OIL).length) yieldNotes.push('method fries but no oil is listed; frying fat not counted')

  const dupes = uniq(ids(r).filter((id, i, a) => a.indexOf(id) !== i && id !== 'water'))
  if (dupes.length) yieldNotes.push(`listed twice: ${dupes.join(', ')} (check the recipe is not double-counting)`)
  if (NOT_EATEN.has(r.id)) {
    out.status = 'not-eaten'
    out.reason = 'a starter culture used in other recipes; needs no nutrition and should stay out of the planner'
    out.yieldNotes = yieldNotes
    out._final = null
    return out
  }
  if (!r.nutrition) { out.status = 'missing'; out.flags.push('no nutrition') }
  else if (flat && Object.values(flat).every(v => v === 0)) { out.status = 'placeholder'; out.flags.push('all-zero placeholder in the old flat shape') }
  else if (stored) {
    const ratio = stored.calories / Math.max(1, calc.calories)
    out.ratioKcal = r1(ratio)
    const d = Math.abs(stored.calories - calc.calories)
    if (!STRAINED.has(r.id) && (ratio > 1.33 || ratio < 0.75) && d >= 30) out.flags.push(`kcal: stored ${Math.round(stored.calories)} vs ingredients ${calc.calories} per serving`)
    if (r.servingWeightGrams && stored.calories / r.servingWeightGrams * 100 > 900) out.flags.push('energy density over 900 kcal/100 g (impossible)')
    const sNa = stored.sodium
    // "salt to taste" rows are unquantified: a stored value above the
    // estimate may simply include them, so only flag sodium that is too low.
    const toTasteSalt = (r.ingredients || []).some(i => i.quantity == null && SALTY.has(i.ingredient))
    if (sNa != null && !STRAINED.has(r.id) && !(toTasteSalt && sNa > calc.sodium)) {
      const dNa = Math.abs(sNa - calc.sodium)
      const rNa = (sNa + 1) / (calc.sodium + 1)
      if (dNa >= 300 && (rNa > 2 || rNa < 0.5)) out.flags.push(`sodium: stored ${Math.round(sNa)} vs ingredients ${calc.sodium} mg`)
    }
    const sAdd = stored.addedSugar
    if (sAdd != null && Math.abs(sAdd - calc.addedSugar) >= 5) out.flags.push(`added sugar: stored ${r1(sAdd)} vs ingredients ${calc.addedSugar} g`)
    // Decision 2: oat drink sugars are added sugar, so any panel that left
    // them out is corrected, however small the difference.
    else if (ids(r).includes('oat-milk') && calc.addedSugar - (sAdd ?? 0) >= 0.5) out.flags.push(`added sugar: oat drink sugars now counted as added (stored ${r1(sAdd ?? 0)} vs ingredients ${calc.addedSugar} g)`)
    // The legacy Fredheim panels store 0 for fields that were never filled
    // (potassium 0 in a berry sauce). Treat a 0 the ingredients clearly
    // contradict as missing.
    const falseZero = Object.entries(FALSE_ZERO_MIN).filter(([k, min]) => stored[k] === 0 && calc[k] >= min).map(([k]) => k)
    if (falseZero.length) out.flags.push(`stored 0 for ${falseZero.map(k => `${k} (ingredients ${calc[k]})`).join(', ')}`)
    out._falseZero = falseZero
    if (out.flags.length) out.status = 'implausible'
  }

  const kcalBad = out.flags.some(f => f.startsWith('kcal') || f.startsWith('energy'))
  const needsFull = out.status === 'missing' || out.status === 'placeholder' || kcalBad
  if (needsFull) {
    out.proposed = perServingFromTotals(est.totals, newServings)
    out.change = 'recalculated'
    out.fieldsChanged = Object.keys(out.proposed)
    out.micronutrients = stored ? 'not recomputed: the stored vitamins/minerals come from the same unreliable panel; drop or recompute before applying' : 'none stored'
    out.confidence = (uncertainRows.length || unquantified > 2 || yieldNotes.some(n => n.startsWith('method fries')) || SERVINGS[r.id]?.basis?.includes('uncertain')) ? 'low' : 'medium'
    out.reason = out.flags.join('; ') + (uncertainRows.length ? `; brand/sub-recipe dependent: ${uncertainRows.join(', ')}` : '')
  } else if (out.status === 'implausible') {
    // kcal agrees: correct only the fields that are off, scaled to any new servings.
    const base = { ...core(stored) }
    for (const k of Object.keys(base)) if (base[k] != null) base[k] = base[k] * servings / newServings
    if (out.flags.some(f => f.startsWith('sodium'))) { base.sodium = est.totals.sodium / newServings; out.fieldsChanged.push('sodium') }
    if (out.flags.some(f => f.startsWith('added sugar'))) { base.addedSugar = est.totals.added / newServings; out.fieldsChanged.push('addedSugar') }
    const tableKey = Object.fromEntries(FIELDS.map(f => [PACK_KEY[f], f]))
    for (const k of out._falseZero || []) { base[k] = est.totals[tableKey[k]] / newServings; out.fieldsChanged.push(k) }
    for (const f of FIELDS) base[PACK_KEY[f]] = round(base[PACK_KEY[f]], f)
    out.proposed = base
    out.change = newServings !== servings ? 'rescaled+corrected' : 'corrected'
    out.micronutrients = newServings !== servings ? `scale every other stored field by ${servings}/${newServings}` : 'unchanged'
    out.confidence = 'medium'
    out.reason = out.flags.join('; ')
  } else if (newServings !== servings) {
    const base = core(stored)
    for (const k of Object.keys(base)) if (base[k] != null) base[k] = base[k] * servings / newServings
    for (const f of FIELDS) base[PACK_KEY[f]] = round(base[PACK_KEY[f]], f)
    out.proposed = base
    out.change = 'rescaled'
    out.fieldsChanged = Object.keys(base)
    out.micronutrients = `scale every stored field by ${servings}/${newServings}`
    const close = out.ratioKcal >= 0.85 && out.ratioKcal <= 1.18
    out.confidence = close ? 'high' : 'medium'
    out.reason = close
      ? `stored values agree with the ingredients (ratio ${out.ratioKcal}); only the serving count changes`
      : `stored kcal is ${out.ratioKcal}× the ingredient estimate (small in absolute terms); stored values rescaled to the new serving count`
  }
  if (sp) out.servingWeightGrams.proposed = sp.sw
  else if (out.change === 'recalculated') {
    const raw = Math.round(est.weight / newServings)
    if (!r.servingWeightGrams || Math.abs(raw - r.servingWeightGrams) / raw > 0.3) out.servingWeightGrams.proposed = raw
  }
  out.yieldNotes = yieldNotes
  // Conservative sodium for labels: the higher of stored/proposed and the
  // "ordinary products" estimate (unless the row names a low-sodium product).
  const finalPer = out.proposed || core(stored) || null
  const conservativeNa = finalPer ? Math.max(finalPer.sodium ?? 0, est.totals.sodium / newServings) : null
  out._final = finalPer
  out._conservativeNa = conservativeNa
  out._regularNa = calcRegularNa != null ? calcRegularNa * servings / newServings : null
  return out
}

// ── flags shared by several labels ──────────────────────────────────────────
export function ingredientFacts(r, recipesById, depth = 0) {
  const text = stepText(r)
  const facts = {
    oil: has(r, OIL), coconutFat: has(r, COCONUT_FAT), freeSugar: has(r, FREE_SUGAR), dates: has(r, DATES),
    sukrin: has(r, new Set(['sukrin'])), refined: has(r, REFINED_BASE), gluten: has(r, GLUTEN),
    oats: (r.ingredients || []).filter(i => OATS.has(i.ingredient) && !/gluten[- ]?free|glutenfri/i.test(i.note || '')).map(i => i.ingredient),
    gfLabel: has(r, GF_CHECK_LABEL), nuts: has(r, NUTS), wholeNuts: has(r, WHOLE_NUTS), coconut: has(r, COCONUT),
    soy: has(r, SOY), hot: has(r, HOT), leafy: has(r, LEAFY), avocado: has(r, new Set(['avocados'])),
    methodOil: /\b(?:olive |rapeseed |sesame |coconut |vegetable |canola )?oil\b|\bolje\b|\bolja\b/i.test(text.replace(/oil[- ]free|no oil|without (?:any |added )?oil|release (?:their|its) (?:own )?oil|natural oils?|uten (?:noe )?olje|utan (?:någon )?olja/gi, '')),
  }
  if (depth === 0) {
    for (const [ing, sub] of Object.entries(SUB_RECIPES)) {
      if (!ids(r).includes(ing) || !recipesById.get(sub)) continue
      const f = ingredientFacts(recipesById.get(sub), recipesById, 1)
      for (const k of ['oil', 'coconutFat', 'freeSugar', 'nuts', 'soy', 'gluten', 'oats']) f[k].forEach(x => facts[k].push(`${x} (in ${ing})`))
      if (f.methodOil) facts.methodOil = true
    }
  }
  return facts
}

// ── labels ──────────────────────────────────────────────────────────────────
export function evaluateLabels(r, nut, mt, time, facts, allergens) {
  const res = {}
  const n = nut._final
  const meal = isMeal(mt)
  const sw = nut.servingWeightGrams.proposed ?? r.servingWeightGrams ?? null
  const conf = nut.change ? nut.confidence : (nut.status === 'ok' ? 'stored' : nut.confidence)
  const dataOk = n && n.calories > 0 && conf !== 'low' && !STRAINED.has(r.id) || (n && STRAINED.has(r.id))
  const set = (label, pass, why) => { res[label] = { pass, why } }
  const fmt = (k, v) => v == null ? '—' : k === 'kcal' ? `${Math.round(v)} kcal` : k === 'mg' ? `${Math.round(v)} mg` : `${r1(v)} g`
  const sugarIngr = facts.freeSugar.length ? `contains ${facts.freeSugar.join(', ')}` : null
  const na = nut._conservativeNa

  // health labels
  if (!dataOk) {
    for (const l of HEALTH) set(l, false, n ? `nutrition too uncertain (${conf}) to judge` : 'no nutrition data')
  } else {
    const ed = sw ? n.calories / sw * 100 : null
    // A tiny portion must not hide a sweet: cap added sugar per 100 g too.
    const add100 = sw ? n.addedSugar / sw * 100 : null
    const sweet = n.addedSugar > 2.5 || (add100 != null && add100 > 5)
    const sweetWhy = n.addedSugar > 2.5 ? `added sugar ${fmt('g', n.addedSugar)}` : `added sugar ${r1(add100)} g/100 g > 5`
    const fail = []
    // weight-loss
    if (ed == null) fail.push('no serving weight')
    else if (ed > 150) fail.push(`${Math.round(ed)} kcal/100 g > 150`)
    if (meal ? n.calories > 500 : n.calories > 200) fail.push(`${fmt('kcal', n.calories)} > ${meal ? 500 : 200}`)
    if (meal && n.fiber < 3) fail.push(`fibre ${fmt('g', n.fiber)} < 3`)
    if (n.saturatedFat > (meal ? 3 : 2)) fail.push(`sat. fat ${fmt('g', n.saturatedFat)}`)
    if (sweet)fail.push(`${sweetWhy}`)
    if (sugarIngr) fail.push(sugarIngr)
    set('weight-loss', !fail.length, fail.length ? fail.join('; ') : `${Math.round(ed)} kcal/100 g, ${fmt('kcal', n.calories)}, fibre ${fmt('g', n.fiber)}`)

    // blood pressure
    const f2 = []
    const per100 = sw ? na / sw * 100 : null
    if (sw && sw >= 100) {
      if (per100 > 140) f2.push(`sodium ${Math.round(per100)} mg/100 g > 140`)
      if (na > 600) f2.push(`sodium ${fmt('mg', na)} > 600`)
    } else {
      if (na > 140) f2.push(`sodium ${fmt('mg', na)} per small serving > 140`)
      if (per100 != null && per100 > 280) f2.push(`sodium ${Math.round(per100 / 2)} mg per 50 g > 140`)
    }
    if (n.potassium != null && na > n.potassium) f2.push(`potassium ${fmt('mg', n.potassium)} < sodium`)
    if (n.saturatedFat > (meal ? 4 : 2)) f2.push(`sat. fat ${fmt('g', n.saturatedFat)}`)
    if (sweet)f2.push(`${sweetWhy} (a sweet)`)
    const productRows = has(r, new Set(['black-beans-canned', 'chickpeas-canned', 'kidney-beans-canned', 'white-beans-canned', 'vegetable-broth']))
    const naNote = n.sodium != null && na > n.sodium + 20
      ? ` (panel ${Math.round(n.sodium)} mg; ingredient estimate ${Math.round(na)} mg${productRows.length ? `, counting ${productRows.join(', ')} as ordinary salted products unless the row says low-sodium/no-salt/rinsed` : ''})`
      : ''
    set('blood-pressure-friendly', !f2.length, (f2.length ? f2.join('; ') : `sodium ${fmt('mg', na)}${per100 != null ? ` (${Math.round(per100)} mg/100 g)` : ''}, K ${fmt('mg', n.potassium)}`) + naNote)

    // diabetes
    const f3 = []
    if (n.totalCarbs > (meal ? 60 : 25)) f3.push(`carbs ${fmt('g', n.totalCarbs)} > ${meal ? 60 : 25}`)
    if (n.totalSugars > (meal ? 20 : 10)) f3.push(`sugars ${fmt('g', n.totalSugars)} > ${meal ? 20 : 10}`)
    const sug100 = sw ? n.totalSugars / sw * 100 : null
    if (sug100 != null && sug100 > (meal ? 12.5 : 10)) f3.push(`sugars ${r1(sug100)} g/100 g > ${meal ? 12.5 : 10}`)
    if (n.fiber < (meal ? 3 : 2)) f3.push(`fibre ${fmt('g', n.fiber)}`)
    if (n.totalCarbs > 5 && n.fiber < 0.1 * n.totalCarbs) f3.push('fibre < 10% of carbs')
    if (n.saturatedFat > 3) f3.push(`sat. fat ${fmt('g', n.saturatedFat)}`)
    if (sweet)f3.push(`${sweetWhy}`)
    if (sugarIngr) f3.push(sugarIngr)
    if (facts.refined.length) f3.push(`refined starch: ${facts.refined.join(', ')}`)
    // Decision 3: diabetes-friendly must also be oil-free.
    if (facts.oil.length) f3.push(`oil: ${facts.oil.join(', ')}`)
    else if (facts.methodOil) f3.push('method uses oil')
    set('diabetes-friendly', !f3.length, f3.length ? f3.join('; ') : `carbs ${fmt('g', n.totalCarbs)}, sugars ${fmt('g', n.totalSugars)}, fibre ${fmt('g', n.fiber)}, no oil`)

    // heart
    const f4 = []
    if (facts.oil.length) f4.push(`oil: ${facts.oil.join(', ')}`)
    else if (facts.methodOil) f4.push('method uses oil')
    if (facts.coconutFat.length) f4.push(`coconut fat: ${facts.coconutFat.join(', ')}`)
    if (n.saturatedFat > (meal ? 3 : 2)) f4.push(`sat. fat ${fmt('g', n.saturatedFat)}`)
    if (na > (meal ? 600 : 360)) f4.push(`sodium ${fmt('mg', na)}`)
    if (n.fiber < (meal ? 3 : 1.5)) f4.push(`fibre ${fmt('g', n.fiber)}`)
    if (sweet)f4.push(`${sweetWhy}`)
    set('heart-healthy', !f4.length, f4.length ? f4.join('; ') : `sat. fat ${fmt('g', n.saturatedFat)}, sodium ${fmt('mg', na)}, fibre ${fmt('g', n.fiber)}, no oil`)
  }

  // ingredient labels
  const gl = [...facts.gluten, ...facts.oats.map(o => `${o} (not marked gluten-free)`)]
  if (allergens.includes('gluten') && !gl.length) gl.push('app allergen check flags gluten')
  set('gluten-free', !gl.length, gl.length ? `contains ${gl.join(', ')}` : `no gluten ingredients${facts.gfLabel.length ? `; use GF-labelled ${facts.gfLabel.join(', ')}` : ''}`)
  const nu = [...facts.nuts]
  if (allergens.includes('tree-nuts') || allergens.includes('peanuts')) if (!nu.length) nu.push('app allergen check flags nuts')
  set('nut-free', !nu.length, nu.length ? `contains ${uniq(nu).join(', ')}` : `no nuts${facts.coconut.length ? `; contains coconut (${facts.coconut.join(', ')})` : ''}`)
  const so = [...facts.soy]
  if (allergens.includes('soy') && !so.length) so.push('app allergen check flags soy')
  set('soy-free', !so.length, so.length ? `contains ${uniq(so).join(', ')}` : 'no soy')
  set('oil-free', !facts.oil.length && !facts.methodOil, facts.oil.length ? `contains ${facts.oil.join(', ')}` : facts.methodOil ? 'method uses oil' : 'no oil in ingredients or method')
  set('no-added-sugar', !facts.freeSugar.length, facts.freeSugar.length ? `contains ${facts.freeSugar.join(', ')}` : ['no sugar, syrup, honey or juice', facts.dates.length ? `sweetened with ${facts.dates.join(', ')}` : null, facts.sukrin.length ? 'contains erythritol (Sukrin)' : null].filter(Boolean).join('; '))

  // practical labels
  const p = time.proposed || time.current
  const total = (p.prepTime ?? 0) + (p.cookTime ?? 0)
  const timeKnown = p.prepTime != null && p.cookTime != null
  const timeSure = !time.proposed || time.confidence === 'medium'
  set('quick', timeKnown && timeSure && total <= 20 && !time.passive, !timeKnown ? 'time unknown' : !timeSure ? `time only estimated (${total} min, low confidence)` : time.passive ? `${total} min, but has a waiting step (soak/rise/chill/set)` : `${total} min total${total > 20 ? ' > 20' : ''}`)
  const servings = SERVINGS[r.id] && !SERVINGS[r.id].keepCount ? SERVINGS[r.id].servings : r.servings
  const t = (r.title || '').toLowerCase()
  const keeps = ['Soup', 'Bread', 'Spreads', 'Jam'].includes(r.category) ||
    /stew|lasagn|bake|gratin|burger|patt|balls|loaf|sausage|falafel|tofu form|pie|granola|porridge|muffin|cake|waffle|pancake|brownie|chickpea tofu|bouillon|ferment|pickled|sauce|cheese|cream|mousse|pudding|jam|hummus|pâté|pate|ketchup|mayonnaise|aioli|pesto|stuffed|frittata|fruit crisp|overnight oats|yogurt|butter|candy rolls/.test(t) ||
    (r.category === 'Sauce') || (r.category === 'Salad' && !facts.leafy.length && !facts.avocado.length && /bean|quinoa|bulgur|lentil|chickpea|potato|cabbage|coleslaw/.test(t))
  const notKeeps = facts.avocado.length && /guac|avocado|cream/.test(t) || /chips|smoothie|shake|milk|drink|latte|bruschetta|omelet|croutons|fries|sticks/.test(t) || r.category === 'Drink'
  set('batch-friendly', servings >= 4 && keeps && !notKeeps, servings < 4 ? `${servings} serving(s)` : notKeeps ? 'does not keep well (avocado/crisp/drink)' : keeps ? `${servings} servings, keeps chilled/frozen` : 'type does not keep well (leafy salad, side etc.)')
  const familiar = /porridge|pancake|waffle|oat|granola|smoothie|shake|bread|bun|roll|loaf|burger|balls|patt|lasagn|pizza|potato|fries|mash|hummus|jam|muffin|cake|brownie|mousse|pudding|cheesecake|sorbet|crisp|applesauce|corn soup|pea soup|tomato soup|pumpkin soup|sweet potato soup|cauliflower soup|broccoli soup|sausage|tofu sticks|scrambled|pasta|noodle|carob drink|almond milk|oat milk|fruit salad|macaroon|candy/.test(t) ||
    ['Breakfast', 'Dessert', 'Jam'].includes(r.category)
  const component = mt.length === 1 && mt[0] === 'component'
  const f5 = []
  if ((r.tags || []).includes('fmd')) f5.push('part of the 5-day fasting-mimicking plan, which is not meant for children')
  else if (component) f5.push('a component, not served on its own')
  else if (r.category === 'Salad' && !/fruit salad|potato salad/.test(t)) f5.push('a salad (judged not a familiar format)')
  if (facts.hot.length) f5.push(`spicy: ${facts.hot.join(', ')}`)
  if (!familiar && !f5.length) f5.push('not a familiar format for children')
  set('kid-friendly', !f5.length, f5.length ? f5.join('; ') : `familiar format, mild${facts.wholeNuts.length ? `; whole nuts (${facts.wholeNuts.join(', ')}): choking risk under 5` : ''}`)
  return res
}

/**
 * Everything the criteria say about one recipe, as the proposal report
 * computes it: nutrition assessment, time, meal types and labels.
 * recipesById resolves sub-recipes (cashew sauce, soy mayonnaise).
 *
 * storedMealTypes: judge "meal" vs "other" by the recipe's own mealTypes
 * when it has them (check-recipes, label-recipes), instead of the
 * suggestion (the report, which proposes them). `mt` is the suggestion
 * either way.
 */
export function analyzeRecipe(original, recipesById = new Map(), { storedMealTypes = false } = {}) {
  const { recipe: r, fix: ingredientFix } = dropDuplicateRows(original)
  const nut = assessNutrition(r, recipesById)
  const time = proposeTime(r)
  const mt = proposeMealTypes(r, nut._final)
  const facts = ingredientFacts(r, recipesById)
  const allergens = recipeAllergens(r)
  const judgedTypes = storedMealTypes && r.mealTypes?.length ? r.mealTypes : mt.mealTypes
  const labels = evaluateLabels(r, nut, judgedTypes, time, facts, allergens)
  return {
    recipe: r, ingredientFix, nut, time, mt, facts, allergens, labels,
    proposed: LABELS.filter(l => labels[l].pass),
  }
}

/** The recipe's tags with its good-for labels replaced by `labels`, in LABELS order. */
export function withLabels(tags = [], labels = []) {
  return [...tags.filter(t => !LABELS.includes(t)), ...LABELS.filter(l => labels.includes(l))]
}

// ── recipe completeness (check-recipes, label-recipes) ─────────────────────
// Bounds for a per-serving energy that is surely a mistake (a whole batch
// stored as one serving, a typo): over 1500 kcal for anything, under 50
// kcal for a meal (condiments, spices and broth components can be tiny).
export const KCAL_MAX = 1500
export const KCAL_MIN_MEAL = 50
const MEAL_TYPE_IDS = ['breakfast', 'lunch', 'dinner', 'snack', 'side', 'dessert', 'component']

/**
 * What a recipe is missing or gets wrong, by the recipe rules in CLAUDE.md:
 * realistic servings with a portion description in en/no/sv, per-serving
 * nutrition that agrees with its ingredients, prep/cook time, meal types,
 * and good-for labels exactly as the criteria compute them.
 * Returns [{ code, detail, message }]; `analysis` is analyzeRecipe(…,
 * { storedMealTypes: true }) for the recipe.
 */
export function recipeMetaProblems(r, analysis) {
  const out = []
  const add = (code, detail, message) => out.push({ code, detail, message })
  const { nut, time, mt, proposed } = analysis
  const notEaten = nut.status === 'not-eaten'

  if (!(Number.isInteger(r.servings) && r.servings >= 1)) add('missing-servings', 'servings', `servings ${r.servings ?? '—'}: a whole number of realistic portions`)
  if (!notEaten && !(Number(r.servingWeightGrams) > 0)) add('missing-servings', 'servingWeightGrams', 'no servingWeightGrams (the eaten portion in grams; needed for the weight-loss and blood-pressure labels)')
  const noPortion = ['en', 'no', 'sv'].filter(l => !String((l === 'en' ? r.portion : r.translations?.[l]?.portion) || '').trim())
  if (noPortion.length) add('missing-portion', noPortion.join(','), `no portion description in ${noPortion.join('/')} (e.g. "2 slices (~116 g)", "~350 g bowl")`)

  const types = r.mealTypes || []
  if (!types.length) add('missing-meal-types', 'mealTypes', `no mealTypes (suggested: ${mt.mealTypes.join(', ')})`)
  for (const m of types) if (!MEAL_TYPE_IDS.includes(m)) add('missing-meal-types', m, `unknown meal type "${m}"`)

  if (!(typeof r.prepTime === 'number' && typeof r.cookTime === 'number') || r.prepTime + r.cookTime <= 0) {
    add('missing-time', 'time', `prepTime/cookTime missing (from the method: ${time.proposed ? `${time.proposed.prepTime}/${time.proposed.cookTime} min` : '—'})`)
  }

  if (notEaten) return out
  const n = r.nutrition?.perServing
  if (!n || !Number.isFinite(Number(n.calories))) {
    add('missing-nutrition', 'perServing', 'no nutrition.perServing (calculate it from the ingredients: npm run label-recipes)')
  } else {
    const meal = types.some(m => m === 'breakfast' || m === 'lunch' || m === 'dinner')
    if (n.calories > KCAL_MAX) add('implausible-kcal', 'high', `${Math.round(n.calories)} kcal a serving is over ${KCAL_MAX}: is a whole batch stored as one serving?`)
    if (meal && n.calories < KCAL_MIN_MEAL) add('implausible-kcal', 'low', `${Math.round(n.calories)} kcal a serving is under ${KCAL_MIN_MEAL} for a meal`)
    if (r.kcal !== Math.round(n.calories)) add('implausible-kcal', 'kcal-field', `kcal ${r.kcal ?? '—'} does not match nutrition.perServing.calories ${Math.round(n.calories)}`)
    if (nut.flags.length) add('nutrition-mismatch', nut.flags.map(f => f.split(':')[0]).join(','), `stored nutrition disagrees with the ingredients: ${nut.flags.join('; ')}`)
  }
  if (nut.estimateProblems?.length) add('nutrition-unverifiable', nut.estimateProblems.join(','), `ingredient estimate incomplete: ${nut.estimateProblems.join('; ')} (add the food to scripts/data/food-composition-core.json)`)

  const stored = (r.tags || []).filter(t => LABELS.includes(t))
  const plus = proposed.filter(l => !stored.includes(l))
  const minus = stored.filter(l => !proposed.includes(l))
  if (plus.length || minus.length) {
    const why = [...plus.map(l => `+${l}`), ...minus.map(l => `-${l} (${analysis.labels[l].why})`)].join(', ')
    add('labels-not-computed', [...plus.map(l => `+${l}`), ...minus.map(l => `-${l}`)].join(','), `good-for labels differ from the criteria: ${why} (npm run label-recipes -- --recipe ${r.id} --write)`)
  }
  return out
}

/**
 * Generates an aggregated shopping list from a weekly plan + recipes.
 * Uses unitNormalizer for proper unit handling and ingredientMatcher for grouping.
 */

import { normalizeUnit, convertToBase, smartConvert, TO_BASE } from './unitNormalizer'
import { groupIngredients } from './ingredientMatcher'

// Rough ingredient categories for grouping. Keywords are matched against
// the ingredient name in the *active language*, so each category carries
// English + Norwegian + Swedish terms. Longest match wins (see
// categoriseIngredient), so compound names like "gresskarkjerner"
// (pumpkin seeds) beat the shorter "gresskar" (squash).
const INGREDIENT_CATEGORIES = {
  Produce: ['apple', 'eple', 'äpple', 'banana', 'banan', 'lemon', 'sitron', 'citron', 'lime', 'orange',
    'strawberr', 'jordbær', 'blueberr', 'raspberr', 'mango', 'avocado', 'avokado',
    'tomato', 'tomat', 'onion', 'løk', 'lök', 'garlic', 'hvitløk', 'vitlök', 'ginger', 'ingefær', 'ingefära',
    'carrot', 'gulrot', 'morot', 'potato', 'potet', 'sweet potato', 'søtpotet', 'sötpotat',
    'celery', 'selleri', 'broccoli', 'brokkoli', 'spinach', 'spinat', 'spenat', 'lettuce', 'salat', 'sallad',
    'cucumber', 'agurk', 'gurka', 'pepper', 'paprika', 'zucchini', 'squash', 'courgette',
    'cauliflower', 'blomkål', 'pumpkin', 'gresskar', 'pumpa', 'butternut',
    'mushroom', 'sopp', 'pea', 'corn', 'mais', 'kale', 'grønnkål', 'grönkål', 'cabbage', 'kål', 'savoy',
    'leek', 'purre', 'herb', 'basil', 'basilikum', 'basilika', 'parsley', 'persille', 'persilja',
    'cilantro', 'dill', 'thyme', 'timian', 'timjan', 'rosemary', 'rosmarin', 'oregano',
    'mint', 'chive', 'gressløk', 'fennel', 'fennikel', 'fänkål', 'beetroot', 'beet', 'rødbete', 'rödbeta',
    'parsnip', 'pastinakk', 'palsternacka', 'radish', 'reddik', 'spring onion', 'vårløk',
    'edamame', 'sugar snap',
    // Win over Dairy's "egg" substring match — eggplant is produce.
    'eggplant', 'aubergine'],
  'Meat & Fish': ['chicken', 'kylling', 'beef', 'biff', 'pork', 'svin', 'lamb', 'lam', 'turkey', 'kalkun',
    'bacon', 'sausage', 'pølse', 'ham', 'salmon', 'laks', 'tuna', 'tunfisk', 'cod', 'torsk', 'shrimp', 'reke',
    'fish', 'fisk', 'mince', 'kjøttdeig', 'steak', 'sea bass', 'havabbor', 'pollock', 'sei', 'mince'],
  Dairy: ['milk', 'melk', 'cream', 'fløte', 'yogurt', 'yoghurt', 'butter', 'smør', 'cheese', 'ost',
    'egg', 'sour cream', 'rømme', 'crème fraîche', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'ricotta',
    'greek yogurt', 'granola'],
  'Bakery & Grains': ['flour', 'mel', 'bread', 'brød', 'bröd', 'pasta', 'rice', 'ris', 'oat', 'havre', 'barley',
    'bygg', 'quinoa', 'noodle', 'tortilla', 'cracker', 'crispbread', 'knekkebrød', 'knäckebröd',
    'breadcrumb', 'panko', 'yeast', 'gjær',
    'baking powder', 'bakepulver', 'baking soda', 'natron', 'cornstarch', 'maizena', 'potetmel',
    'bulgur', 'couscous', 'flatbread', 'pitta', 'rye', 'rug'],
  'Canned & Dried': ['bean', 'bønne', 'bönor', 'lentil', 'linse', 'linser', 'chickpea', 'kikerter', 'tomato sauce', 'tomatsaus',
    'coconut milk', 'kokosmjølk', 'stock', 'kraft', 'broth', 'buljong', 'bouillon', 'soup', 'suppe',
    'canned', 'hermetisk', 'chopped tomatoes', 'tahini', 'olives', 'oliven', 'oliver', 'pickled',
    // Nuts, seeds and other dry-store staples.
    'walnut', 'valnøtt', 'valnött', 'almond', 'mandel', 'mandl', 'cashew', 'peanut', 'hazelnut', 'nut', 'nøtt', 'nött',
    'pumpkin seed', 'gresskarkjern', 'pumpakärn', 'sunflower seed', 'sesame seed', 'sesamfrø', 'sesamfrö',
    'chia', 'flaxseed', 'linfrø', 'linfrö', 'sunflower'],
  'Oils & Condiments': ['oil', 'olje', 'olive oil', 'oliveolje', 'vinegar', 'eddik', 'soy sauce', 'soyasaus',
    'mustard', 'sennep', 'ketchup', 'mayonnaise', 'hot sauce', 'sriracha', 'worcestershire', 'tamari',
    'honey', 'honning', 'maple syrup', 'ahornsirup', 'sugar', 'sukker', 'salt', 'pepper',
    'spice', 'krydder', 'cumin', 'spisskummen', 'spiskummin', 'turmeric', 'gurkemeie', 'gurkmeja',
    'coriander', 'koriander', 'garam masala', 'chilli', 'cinnamon', 'kanel', 'cardamom', 'kardemom', 'kardemumma',
    'clove', 'nellik', 'nejlika', 'nutmeg', 'muskat', 'muskot', 'smoked paprika', 'røkt paprika', 'rökt paprika',
    'sumac', 'sumak', 'almond butter', 'mandelsmør', 'mandelsmör', 'peanut butter',
    'sesame', 'sesamolje', 'soy', 'soya', 'fish sauce', 'oyster sauce'],
  Frozen: ['frozen', 'frosne', 'frysta', 'ice cream', 'iskrem'],
  Beverages: ['water', 'vann', 'vatten', 'juice', 'coffee', 'kaffe', 'tea', 'te', 'wine', 'vin', 'beer', 'øl',
    'oat milk', 'havremelk', 'havremjölk', 'almond milk', 'mandelmelk', 'plant milk', 'plantemelk',
    'soy milk', 'soyamelk', 'soya milk', 'rice milk', 'rismelk', 'cashew milk', 'hazelnut milk'],
  Other: [],
}

// A few keywords are too short to match safely as substrings: Norwegian
// "te" (tea) hides inside tomaTEr / bukeTTEr / liTEn, and "ris" (rice)
// hides inside fRISk / selleRIStilker. These must match as standalone
// words only. Longer keywords keep substring matching so compound nouns
// (grønnkål, havremel, gresskarkjerner) still resolve correctly.
const WHOLE_WORD_KEYWORDS = new Set(['te', 'tea', 'øl', 'ris', 'is'])
const LETTER = 'a-zæøåäöéü'

function keywordHit(haystack, kw) {
  if (!WHOLE_WORD_KEYWORDS.has(kw)) return haystack.includes(kw)
  return new RegExp(`(^|[^${LETTER}])${kw}(?![${LETTER}])`).test(haystack)
}

function categoriseIngredient(name) {
  const lower = name.toLowerCase()

  // Pick the LONGEST matching keyword across all categories. This way:
  //   "oat milk"        → Beverages ("oat milk", 8) beats Dairy ("milk", 4)
  //   "coconut milk"    → Canned & Dried ("coconut milk", 12) beats Dairy ("milk", 4)
  //   "gresskarkjerner" → Canned & Dried ("gresskarkjern") beats Produce ("gresskar")
  //   "røkt paprika"    → Oils & Condiments beats Produce ("paprika")
  // Ties resolve to whichever category is declared first.
  let bestCat = 'Other'
  let bestLen = 0
  for (const [cat, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (cat === 'Other') continue
    for (const kw of keywords) {
      if (kw.length > bestLen && keywordHit(lower, kw)) {
        bestCat = cat
        bestLen = kw.length
      }
    }
  }
  return bestCat
}

// Category key for the "Batch cooking" section. Kept distinct from the aisle
// categories so the UI can label it via its own i18n key, the same way the
// user's custom "My items" section works.
export const BATCH_CATEGORY = '__batch__'

export function generateShoppingList(weekPlan, recipes, familySize, lang = 'en', batchCook = []) {
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  // Ingredient occurrences, kept in two buckets so the week's batch prep can
  // be shown as its own section rather than melted into the aisles.
  const allIngredients = []
  const batchIngredients = []

  // Expands one recipe into scaled ingredient occurrences on the given bucket.
  function collect(bucket, recipeId, servings) {
    const recipe = recipeMap[recipeId]
    if (!recipe) return
    // Per-slot override > household default
    const portionCount = servings ?? familySize
    const scaleFactor = portionCount / (recipe.servings || 4)

    // Use translated ingredients if available for this language,
    // otherwise fall back to the canonical English ones.
    const translation = recipe.translations?.[lang]
    const ingredients = translation?.ingredients?.length
      ? translation.ingredients
      : (recipe.ingredients || [])
    const recipeTitle = translation?.title || recipe.title

    for (const ing of ingredients) {
      const unit = normalizeUnit(ing.unit)
      const scaledQty = ing.quantity ? ing.quantity * scaleFactor : 0
      bucket.push({
        quantity: scaledQty,
        unit,
        name: ing.name,
        recipeTitle,
      })
    }
  }

  // Meals the user typed in themselves. They have no ingredients to expand,
  // so the name is the shopping line — the same thing "Legg til vare"
  // produces, just reached from the planner.
  const customPlanned = []

  for (const day of Object.values(weekPlan)) {
    for (const slotRecipes of Object.values(day)) {
      for (const item of slotRecipes) {
        // Accept legacy "id" strings, { recipeId, servings }, and the
        // user's own { kind: 'custom', name, amount } entries.
        const norm = typeof item === 'string'
          ? { recipeId: item, servings: null, excludeFromShopping: false }
          : (item && item.kind === 'custom' && item.name
            ? {
              custom: true,
              id: item.id,
              name: item.name,
              amount: item.amount || '',
              excludeFromShopping: Boolean(item.excludeFromShopping),
            }
            : (item && item.recipeId
              ? {
                recipeId: item.recipeId,
                servings: item.servings ?? null,
                excludeFromShopping: Boolean(item.excludeFromShopping),
              }
              : null))
        if (!norm) continue
        // Meals covered by batch cooking or leftovers buy nothing.
        if (norm.excludeFromShopping) continue
        if (norm.custom) { customPlanned.push(norm); continue }
        collect(allIngredients, norm.recipeId, norm.servings)
      }
    }
  }

  // The week's batch prep. Text-only entries are reminders and buy nothing.
  for (const entry of batchCook || []) {
    if (!entry || entry.kind !== 'recipe' || !entry.recipeId) continue
    collect(batchIngredients, entry.recipeId, entry.servings)
  }

  // Aggregates one bucket into shopping items. `forcedCategory` overrides the
  // aisle so every batch ingredient lands in the single batch section.
  //
  // The `idPrefix` keeps batch item ids distinct from the daily ones: the two
  // sections aggregate separately, so the same ingredient can legitimately
  // appear in both, and identical ids would make checking off (or deleting)
  // one silently affect the other.
  function buildItems(bucket, { forcedCategory = null, idPrefix = '' } = {}) {
    const byCat = {}
    for (const group of groupIngredients(bucket)) {
      const cat = forcedCategory || categoriseIngredient(group.displayName)
      if (!byCat[cat]) byCat[cat] = []

      const qty = group.totalQuantity
      const unit = group.totalUnit

      let formattedUnit = unit || ''
      // If quantity is already a formatted string (mixed units), qty is the string
      const id = idPrefix + group.normalizedName + '__' + formattedUnit

      // Raw per-occurrence contributions (already scaled to the plan's
      // servings). Kept so the UI can show "which recipe, how much" and so
      // a saved list can be re-scaled to a different portion count.
      const sources = group.items
        .filter(it => it.quantity && it.quantity > 0)
        .map(it => ({ recipe: it.recipeTitle, quantity: it.quantity, unit: it.unit }))

      byCat[cat].push({
        id,
        quantity: qty,
        unit: formattedUnit,
        name: group.displayName,
        category: cat,
        recipeNames: [...new Set(group.items.map(i => i.recipeTitle))],
        sources,
      })
    }
    return byCat
  }

  const byCat = buildItems(allIngredients)
  const batchByCat = buildItems(batchIngredients, {
    forcedCategory: BATCH_CATEGORY,
    idPrefix: 'batch__',
  })

  // Custom planned meals join the aisles like anything else, so "Pizza"
  // files under its keyword rather than in a bucket of its own. The amount
  // stays free text — it was typed, not measured, so there is nothing to
  // total up and nothing to convert.
  for (const c of customPlanned) {
    const cat = categoriseIngredient(c.name)
    if (!byCat[cat]) byCat[cat] = []
    byCat[cat].push({
      // Namespaced by the slot item's own id: two identical names on
      // different days stay two separate lines to tick off.
      id: 'planned__' + c.id,
      quantity: c.amount || '',
      unit: '',
      name: c.name,
      category: cat,
      recipeNames: [],
      sources: [],
    })
  }

  // Sort categories and items within
  const categoryOrder = Object.keys(INGREDIENT_CATEGORIES)
  const sortedGroups = Object.entries(byCat).sort(([a], [b]) => {
    const ia = categoryOrder.indexOf(a)
    const ib = categoryOrder.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const sortItems = ([category, items]) => ({
    category,
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  })

  // Batch prep leads the list — it's the shop-once, cook-once part of the week.
  return [
    ...Object.entries(batchByCat).map(sortItems),
    ...sortedGroups.map(sortItems),
  ]
}

export function formatQuantity(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === 0) return unit || ''
  if (typeof quantity === 'string') return quantity // pre-formatted mixed units

  const rounded = Math.round(quantity * 100) / 100
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${formatted} ${unit}` : formatted
}

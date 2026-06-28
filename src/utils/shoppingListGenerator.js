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

export function generateShoppingList(weekPlan, recipes, familySize, lang = 'en') {
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  // Collect all ingredient occurrences (not yet aggregated)
  const allIngredients = []

  for (const day of Object.values(weekPlan)) {
    for (const slotRecipes of Object.values(day)) {
      for (const item of slotRecipes) {
        // Accept both legacy "id" strings and new { recipeId, servings } shape.
        const norm = typeof item === 'string'
          ? { recipeId: item, servings: null }
          : (item && item.recipeId ? { recipeId: item.recipeId, servings: item.servings ?? null } : null)
        if (!norm) continue
        const recipe = recipeMap[norm.recipeId]
        if (!recipe) continue
        // Per-slot override > household default
        const portionCount = norm.servings ?? familySize
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
          allIngredients.push({
            quantity: scaledQty,
            unit,
            name: ing.name,
            recipeTitle,
          })
        }
      }
    }
  }

  // Group similar ingredients using ingredientMatcher
  const grouped = groupIngredients(allIngredients)

  // Assign categories and build final items list
  const byCat = {}
  for (const group of grouped) {
    const cat = categoriseIngredient(group.displayName)
    if (!byCat[cat]) byCat[cat] = []

    const qty = group.totalQuantity
    const unit = group.totalUnit

    let formattedUnit = unit || ''
    // If quantity is already a formatted string (mixed units), qty is the string
    const id = group.normalizedName + '__' + formattedUnit

    byCat[cat].push({
      id,
      quantity: qty,
      unit: formattedUnit,
      name: group.displayName,
      category: cat,
      recipeNames: [...new Set(group.items.map(i => i.recipeTitle))],
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

  return sortedGroups.map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  }))
}

export function formatQuantity(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === 0) return unit || ''
  if (typeof quantity === 'string') return quantity // pre-formatted mixed units

  const rounded = Math.round(quantity * 100) / 100
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${formatted} ${unit}` : formatted
}

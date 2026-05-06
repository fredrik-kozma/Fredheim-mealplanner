/**
 * Generates an aggregated shopping list from a weekly plan + recipes.
 * Uses unitNormalizer for proper unit handling and ingredientMatcher for grouping.
 */

import { normalizeUnit, convertToBase, smartConvert, TO_BASE } from './unitNormalizer'
import { groupIngredients } from './ingredientMatcher'

// Rough ingredient categories for grouping
const INGREDIENT_CATEGORIES = {
  Produce: ['apple', 'banana', 'lemon', 'lime', 'orange', 'strawberr', 'blueberr', 'raspberr', 'mango', 'avocado',
    'tomato', 'onion', 'løk', 'garlic', 'hvitløk', 'ginger', 'ingefær', 'carrot', 'gulrot', 'potato', 'potet',
    'celery', 'broccoli', 'spinach', 'lettuce', 'cucumber', 'agurk', 'pepper', 'paprika', 'zucchini', 'squash',
    'courgette', 'mushroom', 'sopp', 'pea', 'ert', 'corn', 'mais', 'kale', 'cabbage', 'kål', 'leek', 'purre',
    'herb', 'basil', 'basilikum', 'parsley', 'persille', 'cilantro', 'dill', 'thyme', 'rosemary', 'oregano',
    'mint', 'coriander', 'chive', 'gressløk', 'fennel', 'fennikel', 'beetroot', 'rødbete', 'parsnip', 'pastinakk',
    'radish', 'reddik', 'spring onion', 'vårløk', 'edamame', 'sugar snap'],
  'Meat & Fish': ['chicken', 'kylling', 'beef', 'biff', 'pork', 'svin', 'lamb', 'lam', 'turkey', 'kalkun',
    'bacon', 'sausage', 'pølse', 'ham', 'salmon', 'laks', 'tuna', 'tunfisk', 'cod', 'torsk', 'shrimp', 'reke',
    'fish', 'fisk', 'mince', 'kjøttdeig', 'steak', 'sea bass', 'havabbor', 'pollock', 'sei', 'mince'],
  Dairy: ['milk', 'melk', 'cream', 'fløte', 'yogurt', 'yoghurt', 'butter', 'smør', 'cheese', 'ost',
    'egg', 'sour cream', 'rømme', 'crème fraîche', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'ricotta',
    'greek yogurt', 'granola'],
  'Bakery & Grains': ['flour', 'mel', 'bread', 'brød', 'pasta', 'rice', 'ris', 'oat', 'havre', 'barley',
    'bygg', 'quinoa', 'noodle', 'tortilla', 'cracker', 'breadcrumb', 'panko', 'yeast', 'gjær',
    'baking powder', 'bakepulver', 'baking soda', 'natron', 'cornstarch', 'maizena', 'potetmel',
    'bulgur', 'couscous', 'flatbread', 'pitta', 'rye', 'rugbrød'],
  'Canned & Dried': ['bean', 'bønne', 'lentil', 'linse', 'chickpea', 'kikerter', 'tomato sauce', 'tomatsaus',
    'coconut milk', 'kokosmjølk', 'stock', 'kraft', 'broth', 'bouillon', 'soup', 'suppe',
    'canned', 'hermetisk', 'chopped tomatoes', 'tahini', 'olives', 'oliven', 'pickled'],
  'Oils & Condiments': ['oil', 'olje', 'olive oil', 'oliveolje', 'vinegar', 'eddik', 'soy sauce', 'soyasaus',
    'mustard', 'sennep', 'ketchup', 'mayonnaise', 'hot sauce', 'sriracha', 'worcestershire',
    'honey', 'honning', 'maple syrup', 'ahornsirup', 'sugar', 'sukker', 'salt', 'pepper',
    'spice', 'krydder', 'cumin', 'turmeric', 'paprika', 'coriander', 'garam masala', 'chilli',
    'sesame', 'sesamolje', 'soy', 'soya', 'fish sauce', 'oyster sauce'],
  Frozen: ['frozen', 'frosne', 'ice cream', 'iskrem'],
  Beverages: ['water', 'vann', 'juice', 'coffee', 'kaffe', 'tea', 'te', 'wine', 'vin', 'beer', 'øl',
    'oat milk', 'havremelk', 'almond milk', 'plant milk'],
  Other: [],
}

function categoriseIngredient(name) {
  const lower = name.toLowerCase()
  for (const [cat, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (cat === 'Other') continue
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Other'
}

export function generateShoppingList(weekPlan, recipes, familySize, lang = 'en') {
  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]))

  // Collect all ingredient occurrences (not yet aggregated)
  const allIngredients = []

  for (const day of Object.values(weekPlan)) {
    for (const slotRecipes of Object.values(day)) {
      for (const recipeId of slotRecipes) {
        const recipe = recipeMap[recipeId]
        if (!recipe) continue
        const scaleFactor = familySize / (recipe.servings || 4)

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

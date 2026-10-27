/**
 * Generates an aggregated shopping list from a weekly plan + recipes.
 * Uses unitNormalizer for proper unit handling and ingredientMatcher for grouping.
 */

import { normalizeUnit } from './unitNormalizer.js'
import { groupIngredients } from './ingredientMatcher.js'
import { AISLES, categoriseIngredient } from './ingredientCategorizer.js'
import { resolveIngredientId, standardName, dictionaryAisle, prefersSpoons } from './ingredientDictionary.js'

// A spice's total stays in spoons; see smartConvert's preferSpoons.
export const totalOptionsFor = (id) => ({ preferSpoons: prefersSpoons(id) })

// Category key for the "Batch cooking" section. Kept distinct from the aisle
// categories so the UI can label it via its own i18n key, the same way the
// user's custom "My items" section works.
export const BATCH_CATEGORY = '__batch__'

/*
 * Water is a recipe instruction, not a shopping item. It was filling the
 * list with lines nobody acts on — 42 distinct water names in English
 * alone across the packs, appearing as "Water, drinking water",
 * "Water for porridge", "boiling water (for blooming carob)" and so on,
 * which at a 20-person week added up to litres of noise spread over two
 * sections.
 *
 * Matched on the head noun rather than "contains the word water", because
 * "olive water" is olive brine and "coconut water" would be a drink — both
 * are real things you buy. So the qualifier words are stripped and the
 * FIRST remaining word has to be water itself.
 */
const WATER_WORDS = new Set(['water', 'vann', 'vatten'])
const WATER_QUALIFIERS = new Set([
  // en
  'cold', 'warm', 'hot', 'boiling', 'boiled', 'lukewarm', 'tepid', 'filtered',
  'drinking', 'iced', 'ice', 'fresh', 'plain', 'still', 'room', 'temperature', 'extra',
  // no
  'kaldt', 'kald', 'varmt', 'varm', 'kokende', 'lunkent', 'lunken', 'filtrert',
  'iskaldt', 'iskaldt', 'romtemperert', 'friskt', 'ekstra',
  // sv
  'kallt', 'kall', 'kokande', 'ljummet', 'ljummen', 'filtrerat', 'iskallt',
  'rumstempererat',
])

export function isPlainWater(name) {
  if (!name) return false
  const head = String(name)
    .split(',')[0]                 // "Water, drinking water" -> "Water"
    .replace(/\([^)]*\)/g, ' ')    // drop "(for blooming carob)"
    .toLowerCase()
    .replace(/[^a-zà-öø-ÿ\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter(w => !WATER_QUALIFIERS.has(w))
  return head.length > 0 && WATER_WORDS.has(head[0])
}

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
      if (ing.ingredient === 'water' || isPlainWater(ing.name)) continue
      const unit = normalizeUnit(ing.unit)
      const scaledQty = ing.quantity ? ing.quantity * scaleFactor : 0
      bucket.push({
        quantity: scaledQty,
        unit,
        name: ing.name,
        note: ing.note || '',
        // Pack rows carry their dictionary id; a user's own row gets one
        // only when its name is exactly a standard name or synonym.
        ingredientId: resolveIngredientId(ing),
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
    for (const group of groupIngredients(bucket, id => standardName(id, lang), totalOptionsFor)) {
      // The dictionary knows where its ingredients are shelved; the
      // keyword matcher is for names it doesn't know.
      const cat = forcedCategory
        || (group.ingredientId && dictionaryAisle(group.ingredientId))
        || categoriseIngredient(group.displayName)
      if (!byCat[cat]) byCat[cat] = []

      const qty = group.totalQuantity
      const unit = group.totalUnit

      let formattedUnit = unit || ''
      // Mixed units come back as an array of parts with unit ''.
      const id = idPrefix + group.normalizedName + '__' + formattedUnit

      // Raw per-occurrence contributions (already scaled to the plan's
      // servings). Kept so the UI can show "which recipe, how much" and so
      // a saved list can be re-scaled to a different portion count.
      const sources = group.items
        .filter(it => it.quantity && it.quantity > 0)
        .map(it => ({ recipe: it.recipeTitle, quantity: it.quantity, unit: it.unit, ...(it.note ? { note: it.note } : {}) }))

      byCat[cat].push({
        id,
        quantity: qty,
        unit: formattedUnit,
        name: group.displayName,
        // Lets the list say "1 Sitron" and keep a spice in spoons when a
        // contribution is removed and the total is worked out again.
        ...(group.ingredientId ? { ingredientId: group.ingredientId } : {}),
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
  const categoryOrder = AISLES
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

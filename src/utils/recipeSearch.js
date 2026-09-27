/**
 * Searching recipes by what's in them, not just what they're called.
 *
 * "broccoli" should find the gratin that contains broccoli, not only the
 * soup with broccoli in its name — which is how you actually shop and cook
 * ("what can I make with this?").
 *
 * Two properties worth preserving if this is edited:
 *
 *  - Matching runs across EVERY language the recipe carries, not just the
 *    one the UI is in. A Norwegian kitchen still types "broccoli" half the
 *    time, and the packs are authored in English with Norwegian and
 *    Swedish alongside. Typing either spelling finds the same recipe.
 *
 *  - The display name comes back in the CURRENT language. If "broccoli"
 *    matched the Swedish "broccoli" on a recipe you're reading in
 *    Norwegian, the chip should still say "brokkoli" — the word you'd see
 *    when you opened it.
 */

const LANGS = ['no', 'sv']

/** Shortest query that searches ingredients as well as titles. */
export const MIN_INGREDIENT_QUERY = 2

/**
 * Pre-compute everything searchable about one recipe, once, so typing a
 * character doesn't re-walk every translation of every ingredient.
 *
 * Ingredient lists are index-aligned across translations by house
 * convention, so position identifies the same ingredient in each language
 * and the current language's name can be recovered from the match.
 *
 * @param {object} recipe
 * @param {string} currentLang  two-letter UI language
 * @returns {{ titles: string[], ingredients: Array<{ display: string, variants: string[] }> }}
 */
export function buildSearchEntry(recipe, currentLang = 'en') {
  const titles = []
  if (recipe.title) titles.push(recipe.title.toLowerCase())
  for (const lang of LANGS) {
    const t = recipe.translations?.[lang]?.title
    if (t) titles.push(t.toLowerCase())
  }

  const base = recipe.ingredients || []
  const ingredients = base.map((ing, i) => {
    const names = []
    if (ing?.name) names.push(ing.name)
    for (const lang of LANGS) {
      const n = recipe.translations?.[lang]?.ingredients?.[i]?.name
      if (n) names.push(n)
    }
    // What the user would see on the recipe itself, so the chip matches
    // the page it sends them to.
    const display =
      recipe.translations?.[currentLang]?.ingredients?.[i]?.name ||
      ing?.name ||
      ''
    return {
      display,
      variants: [...new Set(names.map(n => n.toLowerCase()))],
    }
  })

  return { titles, ingredients }
}

/**
 * Test one pre-built entry against a query.
 *
 * @returns {null | { inTitle: boolean, ingredient: string | null }}
 *   null when nothing matched. `ingredient` is the display name of the
 *   first matching ingredient, so the caller can show what it hit on.
 */
export function matchSearchEntry(entry, query) {
  const q = query.trim().toLowerCase()
  if (!q) return { inTitle: true, ingredient: null }

  const inTitle = entry.titles.some(t => t.includes(q))

  let ingredient = null
  // Ingredients are only searched from two characters up. A single letter
  // appears in nearly every ingredient list, so it matches essentially the
  // whole library and the grid re-renders all 260 cards — a visible hitch
  // on the first keypress, in exchange for a result set that told you
  // nothing. Titles still match from one character.
  if (q.length >= MIN_INGREDIENT_QUERY) {
    for (const ing of entry.ingredients) {
      if (ing.variants.some(v => v.includes(q))) {
        ingredient = ing.display
        break
      }
    }
  }

  if (!inTitle && !ingredient) return null
  return { inTitle, ingredient }
}

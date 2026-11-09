/**
 * Free starter set. A visitor without Premium — logged out on the website,
 * or in the Android app before they subscribe — can open these recipes in
 * full. Every other recipe stays locked. Edit this list to change the set.
 *
 * 3 breakfasts, 6 mains, 2 soups, 1 salad, 1 side, 2 spreads. All have photos.
 */
export const FREE_RECIPE_IDS = [
  // Breakfast
  'american-oat-pancakes', // American Oat Pancakes
  'ellens-granola', // Ellen's Granola
  'smashed-beans-avocado-rye', // Smashed White Beans and Avocado on Rye
  // Mains
  'fr-94', // Lasagna
  'fr-64', // Falafel
  'chili-sin-carne', // Chili sin carne
  'chana-masala', // Chana masala
  'thai-red-curry', // Thai red curry
  'vegetarian-lapskaus', // Vegetarian lapskaus
  // Soups
  'fr-214', // Simple Garden Vegetable Soup / Enkel hagesuppe
  'pumpkin-soup', // Pumpkin Soup
  // Salad and side
  'fr-144', // Roasted Sweet Potato and Arugula Salad
  'hasselback-potatoes', // Hasselback Potatoes
  // Spreads
  'fr-215', // Sunflower & Date Spread
  'classic-hummus', // Classic Hummus
]

const FREE_RECIPE_SET = new Set(FREE_RECIPE_IDS)

export function isFreeRecipe(id) {
  return FREE_RECIPE_SET.has(id)
}

/** Locked visitors open a recipe only when it is in the free starter set. */
export function canOpenRecipe(id, { locked }) {
  if (!locked) return true
  return isFreeRecipe(id)
}

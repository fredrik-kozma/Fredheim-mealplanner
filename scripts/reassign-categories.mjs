// Reassign every recipe in the Fredheim pack to a more sensible food-type category.
//
// Categories are by FOOD TYPE (not meal time). The user wants to add lunch/dinner
// classification later as a separate axis.

import fs from 'node:fs'
import path from 'node:path'

const PACK_PATH = path.resolve('recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'))

// Each recipe's id → its new category, based on going through the list manually
const ASSIGNMENTS = {
  // --- Sauces & dressings ---
  'fr-1':                                  'Sauce',     // Aioli
  'fr-7':                                  'Sauce',     // Avocado Cream
  'berry-sauce':                           'Sauce',     // Berry Sauce
  'brown-sauce':                           'Sauce',     // Brown Sauce
  'burger-dressing':                       'Sauce',     // Burger Dressing
  'fr-33':                                 'Sauce',     // Cashew Sour Cream
  'cashew-bechamel-sauce':                 'Sauce',     // Cashew Bechamel Sauce
  'cashew-cheese-sauce':                   'Sauce',     // Cashew Cheese Sauce
  'fr-38':                                 'Sauce',     // Cheese Sauce for Onion Pie
  'cheesy-cauliflower-sauce':              'Sauce',     // Cheesy Cauliflower Sauce
  'chipotle-sauce':                        'Sauce',     // Chipotle Sauce
  'citrus-dressing':                       'Sauce',     // Citrus Dressing
  'fr-56':                                 'Sauce',     // Cucumber Dressing
  'fr-57':                                 'Sauce',     // Cucumber Raita
  'cucumber-and-sunflowerseed-dressing':   'Sauce',     // Cucumber and Sunflowerseed Dressing
  'horseradish-dressing':                  'Sauce',     // Horseradish Dressing
  'isabels-dressing':                      'Sauce',     // Isabel's Dressing
  'katrines-pesto-dressing':               'Sauce',     // Katrine's Pesto Dressing
  'fr-92':                                 'Sauce',     // Ketchup
  'lemon-and-olive-oil-dressing':          'Sauce',     // Lemon and Olive Oil Dressing
  'fr-99':                                 'Sauce',     // Luke's Indian Chickpea Sauce
  'fr-115':                                'Sauce',     // Parmesan (used as a topping)
  'peanut-ginger-dressing':                'Sauce',     // Peanut Ginger Dressing
  'pomodoro-sauce':                        'Sauce',     // Pomodoro Sauce
  'ranch-dressing':                        'Sauce',     // Ranch Dressing
  'fr-150':                                'Sauce',     // Salsa
  'fr-156':                                'Sauce',     // Soy Mayonnaise
  'soy-yogurt-dressing':                   'Sauce',     // Soy Yogurt Dressing
  'sweet-vinaigrette':                     'Sauce',     // Sweet Vinaigrette
  'fr-180':                                'Sauce',     // Tomato Sauce for Pizza
  'fr-185':                                'Sauce',     // Vanilla Sauce
  'fr-187':                                'Sauce',     // Walnut Basil Dressing
  'fr-191':                                'Sauce',     // White Cashew Sauce

  // --- Spreads, dips, plant cheeses ---
  'fr-2':                                  'Spreads',   // Almond Tartar
  'fr-3':                                  'Spreads',   // Almond and Paprika Cheese
  'baba-ghanoush---aubergine-dip':         'Spreads',   // Baba Ghanoush
  'bean-pate':                             'Spreads',   // Bean Pâté
  'bean-spread':                           'Spreads',   // Bean Spread
  'caraway-and-cashew-cheese':             'Spreads',   // Caraway and Cashew Cheese
  'carob-spread':                          'Spreads',   // Carob Spread
  'fig-spread':                            'Spreads',   // Fig Spread
  'fr-74':                                 'Spreads',   // Garlic and Cashew Cheese
  'fr-78':                                 'Spreads',   // Guacamole
  'hazelnut-and-sundried-tomato-cheese':   'Spreads',   // Hazelnut and Sundried Tomato Cheese
  'fr-84':                                 'Spreads',   // Hummus
  'fr-51':                                 'Spreads',   // Coconut Mozzarella
  'soy-mozzarella':                        'Spreads',   // Soy Mozzarella
  'soy-salami':                            'Spreads',   // Soy Salami
  'fr-173':                                'Spreads',   // Tofu Feta Cheese
  'tofu-cottage-cheese':                   'Spreads',   // Tofu Cottage Cheese
  'fr-130':                                'Spreads',   // Pumpkinseed and Basil Cheese
  'fr-136':                                'Spreads',   // Red Beet Spread
  'fr-179':                                'Spreads',   // Tomato Bruschetta
  'fr-183':                                'Spreads',   // Turmeric and Cashew Cheese
  'fredheim-deluxe-plant-based-cream-cheese': 'Spreads', // Fredheim Plant-Based Cream Cheese

  // --- Jams ---
  'fr-18':                                 'Jam',       // Blueberry Jam
  'fr-52':                                 'Jam',       // Cranberry Jam
  'fr-60':                                 'Jam',       // Dried Fruit Jam
  'fr-134':                                'Jam',       // Raspberry Jam
  'fr-163':                                'Jam',       // Strawberry Jam

  // --- Salads ---
  'asian-noodle-salad':                    'Salad',     // Asian Noodle Salad
  'fr-17':                                 'Salad',     // Blissful Sprout Medley
  'broccoli-salad':                        'Salad',     // Broccoli Salad
  'bulgur-salad':                          'Salad',     // Bulgur Salad
  'fr-28':                                 'Salad',     // Caesar Salad
  'fr-42':                                 'Salad',     // Chickpea Salad
  'fr-44':                                 'Salad',     // Chinese Cabbage Salad
  'fr-49':                                 'Salad',     // Classic Greek Salad
  'crunchy-carrot-salad':                  'Salad',     // Crunchy Carrot Salad
  'crunchy-sweet-cabbage-salad':           'Salad',     // Crunchy Sweet Cabbage Salad
  'easy-colombian-salad':                  'Salad',     // Easy Colombian Salad
  'feld-salad-with-pomegranate':           'Salad',     // Feld Salad with Pomegranate
  'happy-beans-salad':                     'Salad',     // Happy Beans Salad
  'kale-and-sweet-potato-salad':           'Salad',     // Kale and Sweet Potato Salad
  'kale-avocado':                          'Salad',     // Kale Avocado
  'marikas-summer-salad':                  'Salad',     // Marika's Summer Salad
  'nordic-sprout-salad':                   'Salad',     // Nordic Sprout Salad
  'potato-salad':                          'Salad',     // Potato Salad
  'quinoa-salad-first':                    'Salad',     // Quinoa Salad First
  'quinoa-salad-second':                   'Salad',     // Quinoa Salad Second
  'fr-137':                                'Salad',     // Red Cabbage Salad
  'red-beet-salad':                        'Salad',     // Red Beet Salad
  'fr-144':                                'Salad',     // Roasted Sweet Potato and Arugula Salad
  'roasted-salad':                         'Salad',     // Roasted Salad
  'tomato-bean-salad':                     'Salad',     // Tomato Bean Salad
  'fr-190':                                'Salad',     // White Cabbage Coleslaw

  // --- Soups ---
  'broccoli-soup':                         'Soup',      // Broccoli Soup
  'fr-27':                                 'Soup',      // Cabbage Soup
  'cauliflower-soup':                      'Soup',      // Cauliflower Soup
  'chinese-soup':                          'Soup',      // Chinese Soup
  'golden-soup':                           'Soup',      // Golden Soup
  'kale-soup':                             'Soup',      // Kale Soup
  'mediterranean-soup':                    'Soup',      // Mediterranean Soup
  'potato-and-spinach-soup':               'Soup',      // Potato and Spinach Soup
  'pumpkin-soup':                          'Soup',      // Pumpkin Soup
  'red-lentil-soup':                       'Soup',      // Red Lentil Soup
  'fr-149':                                'Soup',      // Russian Penicillin (garlic broth)
  'sweet-potato-soup':                     'Soup',      // Sweet Potato Soup
  'sweet-yellow-pea-soup':                 'Soup',      // Sweet Yellow Pea Soup
  'fr-172':                                'Soup',      // Thai Soup
  'fr-181':                                'Soup',      // Tomato Soup
  'fr-184':                                'Soup',      // Ukrainian Borscht Soup

  // --- Main dishes ---
  'black-bean-stew':                       'Main',      // Black Bean Stew
  'fr-23':                                 'Main',      // Buckwheat Burger
  'breaded-tofu-sticks':                   'Main',      // Breaded Tofu Sticks
  'chorizo-with-potato-taco':              'Main',      // Chorizo with Potato Taco
  'dal-stew':                              'Main',      // Dal Stew
  'fr-64':                                 'Main',      // Falafel
  'fr-70':                                 'Main',      // Frittata
  'kidney-bean-stew':                      'Main',      // Kidney Bean Stew
  'fr-94':                                 'Main',      // Lasagna
  'lentil-lap-stew':                       'Main',      // Lentil Lap Stew
  'fr-101':                                'Main',      // Marika's Tofu Balls
  'marinated-tofu-sticks':                 'Main',      // Marinated Tofu Sticks
  'noodle-wok':                            'Main',      // Noodle Wok
  'fr-111':                                'Main',      // Nutloaf
  'oat-burger':                            'Main',      // Oat Burger
  'fr-114':                                'Main',      // Onion Pie Filling
  'red-beet-burger':                       'Main',      // Red Beet Burger
  'fr-143':                                'Main',      // Roasted Pepper Seitan Sausages
  'stuffed-paprika-with-tofu':             'Main',      // Stuffed Paprika with Tofu
  'tofu-form':                             'Main',      // Tofu Form
  'vegetable-pie':                         'Main',      // Vegetable Pie
  'creamy-red-lentil-stew':                'Main',      // Creamy Red Lentil Stew
  'mjsge3obgsomp5ixacb':                   'Main',      // Roti (second one — looks like a wrap dish based on title)

  // --- Sides ---
  'baked-roots':                           'Side',      // Baked Roots
  'baked-sweet-potato':                    'Side',      // Baked Sweet Potato
  'fr-77':                                 'Side',      // Green Beans
  'hasselback-potatoes':                   'Side',      // Hasselback Potatoes
  'lightly-cooked-broccoli':               'Side',      // Lightly Cooked Broccoli
  'fr-104':                                'Side',      // Mashed Potatoes
  'potato-gratin':                         'Side',      // Potato Gratin
  'fr-142':                                'Side',      // Roasted Cauliflower
  'roasted-brussels-sprouts':              'Side',      // Roasted Brussels Sprouts
  'seasoned-baked-potatoes':               'Side',      // Seasoned Baked Potatoes
  'simple-baked-potatoes':                 'Side',      // Simple Baked Potatoes
  'steamed-small-potatoes':                'Side',      // Steamed Small Potatoes

  // --- Breakfast ---
  'american-oat-pancakes':                 'Breakfast', // American Oat Pancakes
  'apple-oat-bake':                        'Breakfast', // Apple Oat Bake
  'fr-41':                                 'Breakfast', // Chickpea Omelet
  'ellens-granola':                        'Breakfast', // Ellen's Granola
  'fr-63':                                 'Breakfast', // Erik's Granola
  'fr-123':                                'Breakfast', // Polenta
  'rice-porridge':                         'Breakfast', // Rice Porridge
  'scrambled-tofu':                        'Breakfast', // Scrambled Tofu
  'stine-gros-waffles':                    'Breakfast', // Stine Gro's Waffles
  'swedish-oven-pancake':                  'Breakfast', // Swedish Oven Pancake

  // --- Bread ---
  'fr-19':                                 'Bread',     // Bread Buns
  'burger-buns':                           'Bread',     // Burger Buns
  'gluten-free-oat-buns':                  'Bread',     // Gluten Free Oat Buns
  'homemade-whole-wheat-bread':            'Bread',     // Homemade Whole Wheat Bread
  'millet-crackers-hirseknekk':            'Bread',     // Millet Crackers
  'fr-113':                                'Bread',     // Onion Pie Crust
  'fr-119':                                'Bread',     // Pizza Crust Dough
  'fr-148':                                'Bread',     // Roti
  'toms-gluten-free-bread':                'Bread',     // Tom's Gluten Free Bread
  'ultimate-fluffy-vegan-gluten-free-bread': 'Bread',   // Fluffy Gluten-Free Bread

  // --- Dessert ---
  'fr-29':                                 'Dessert',   // Candy Rolls
  'caramelized-nuts':                      'Snack',     // Caramelized Nuts (snack-like)
  'fr-34':                                 'Dessert',   // Cashew Vanilla Cream
  'fr-50':                                 'Dessert',   // Coconut Macaroon Balls
  'fruit-crisp':                           'Dessert',   // Fruit Crisp
  'fruit-salad':                           'Dessert',   // Fruit Salad
  'pineapple-cream':                       'Dessert',   // Pineapple Cream
  'raw-cheesecake':                        'Dessert',   // Raw Cheesecake
  'fr-155':                                'Dessert',   // Sorbet
  'sweet-potato-muffins':                  'Dessert',   // Sweet Potato Muffins

  // --- Snack ---
  'fr-40':                                 'Snack',     // Cheezy Cashew Kale Chips
  'kale-chips':                            'Snack',     // Kale Chips

  // --- Drink ---
  'fr-12':                                 'Drink',     // Barley Cup Drink

  // --- Other (basics, pantry, condiments) ---
  'chickpea-tofu':                         'Other',     // Chickpea Tofu (base ingredient)
  'fr-53':                                 'Other',     // Croutons
  'fermented-red-cabbage':                 'Other',     // Fermented Red Cabbage
  'fr-69':                                 'Other',     // Fresh Vegetable Bouillon
  'pickled-ginger':                        'Other',     // Pickled Ginger
  'plant-based-butter':                    'Other',     // Plant Based Butter
}

// Apply assignments
let changed = 0, unchanged = 0, missing = []
const newCategoryCount = {}

for (const recipe of pack.recipes) {
  const newCat = ASSIGNMENTS[recipe.id]
  if (!newCat) {
    missing.push(`${recipe.id}: ${recipe.title}`)
    continue
  }
  newCategoryCount[newCat] = (newCategoryCount[newCat] || 0) + 1
  if (recipe.category !== newCat) {
    changed++
    recipe.category = newCat
  } else {
    unchanged++
  }
}

if (missing.length) {
  console.log('\n!!! Recipes without an assignment (kept original category):')
  for (const m of missing) console.log(`  - ${m}`)
}

// Update categories list on the pack (if it has one)
if (Array.isArray(pack.categories)) {
  pack.categories = Object.keys(newCategoryCount).sort()
}

// Bump version
const [maj, min, patch] = pack.version.split('.').map(Number)
const newVersion = `${maj}.${min}.${patch + 1}`
pack.version = newVersion

fs.writeFileSync(PACK_PATH, JSON.stringify(pack, null, 2), 'utf8')

console.log('\n=== Reassignment complete ===')
console.log(`Pack version: → ${newVersion}`)
console.log(`Changed:   ${changed}`)
console.log(`Unchanged: ${unchanged}`)
console.log(`Missing:   ${missing.length}`)
console.log('\nNew category distribution:')
for (const [cat, count] of Object.entries(newCategoryCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${cat}`)
}

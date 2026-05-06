// Ingredient nutrition database — values per 100 g of the ingredient.
// Sources: USDA FoodData Central, Norwegian Food Composition Table (Matvaretabellen),
// and standard nutrition references. Values are reasonable approximations.
//
// Each entry has all fields the recipe form supports. Use null for "not measured"
// or 0 for "negligible / zero".
//
// Lookup is fuzzy — we lower-case both the ingredient name and the keys, then
// substring-match. The first match in iteration order wins, so put more
// specific entries before generic ones (e.g. "olive oil, extra virgin" before
// "olive oil").

export const INGREDIENT_DB = {
  // ── Water & negligible ─────────────────────────────────────────────
  'water': zero(),
  'ice': zero(),

  // ── Salt & seasonings (basically pure sodium) ──────────────────────
  'sea salt':   { ...zero(), sodium: 38758 },
  'salt':       { ...zero(), sodium: 38758 },
  'herb salt':  { ...zero(), sodium: 30000 },
  'table salt': { ...zero(), sodium: 38758 },

  // ── Oils & fats ────────────────────────────────────────────────────
  'olive oil, extra virgin': fatOil({ saturated: 13.8, mono: 73, poly: 10.5 }),
  'olive oil':                fatOil({ saturated: 13.8, mono: 73, poly: 10.5 }),
  'coconut oil':              fatOil({ saturated: 87, mono: 6, poly: 1.7 }),
  'canola oil':               fatOil({ saturated: 7.4, mono: 63.3, poly: 28.1, omega3: 9 }),
  'sesame oil':               fatOil({ saturated: 14.2, mono: 39.7, poly: 41.7 }),
  'sunflower oil':            fatOil({ saturated: 10, mono: 20, poly: 66 }),
  'vegetable oil':            fatOil({ saturated: 14, mono: 23, poly: 58 }),
  'rapeseed oil':             fatOil({ saturated: 7.4, mono: 63.3, poly: 28.1, omega3: 9 }),

  // ── Sweeteners ─────────────────────────────────────────────────────
  'honey':       { ...zero(), calories: 304, totalCarbs: 82.4, totalSugars: 82.1, addedSugar: 82.1, potassium: 52, calcium: 6, magnesium: 2, phosphorus: 4, sodium: 4 },
  'maple syrup': { ...zero(), calories: 260, totalCarbs: 67, totalSugars: 60.5, addedSugar: 60.5, calcium: 102, potassium: 212, magnesium: 21, manganese: 2.9, zinc: 1.5, riboflavin: 1.27 },
  'sukrin':      zero(),  // erythritol-based, ~0 cal
  'erythritol':  zero(),
  'sugar':       { ...zero(), calories: 387, totalCarbs: 100, totalSugars: 100, addedSugar: 100 },
  'brown sugar': { ...zero(), calories: 380, totalCarbs: 98, totalSugars: 97, addedSugar: 97, calcium: 83, iron: 0.7, potassium: 133 },
  'agave':       { ...zero(), calories: 310, totalCarbs: 76.4, totalSugars: 68, addedSugar: 68 },

  // ── Vegetables (raw) ───────────────────────────────────────────────
  'garlic':       { ...zero(), calories: 149, protein: 6.4, totalCarbs: 33.1, fiber: 2.1, totalSugars: 1, calcium: 181, iron: 1.7, magnesium: 25, phosphorus: 153, potassium: 401, vitaminB6: 1.2, vitaminC: 31, manganese: 1.7 },
  'onion, yellow':{ ...zero(), calories: 40, protein: 1.1, totalCarbs: 9.3, fiber: 1.7, totalSugars: 4.2, vitaminC: 7.4, vitaminB6: 0.12, folate: 19, potassium: 146, calcium: 23, magnesium: 10 },
  'onion, red':   { ...zero(), calories: 40, protein: 1.1, totalCarbs: 9.3, fiber: 1.7, totalSugars: 4.2, vitaminC: 7.4, vitaminB6: 0.12, folate: 19, potassium: 146, calcium: 23, magnesium: 10 },
  'onion':        { ...zero(), calories: 40, protein: 1.1, totalCarbs: 9.3, fiber: 1.7, totalSugars: 4.2, vitaminC: 7.4, vitaminB6: 0.12, folate: 19, potassium: 146, calcium: 23, magnesium: 10 },
  'spring onion': { ...zero(), calories: 32, protein: 1.8, totalCarbs: 7.3, fiber: 2.6, vitaminA: 50, vitaminC: 19, vitaminK: 207, folate: 64, potassium: 276, calcium: 72, iron: 1.5 },
  'leeks':        { ...zero(), calories: 61, protein: 1.5, totalCarbs: 14, fiber: 1.8, totalSugars: 3.9, vitaminA: 83, vitaminC: 12, vitaminK: 47, folate: 64, potassium: 180, calcium: 59, iron: 2.1, manganese: 0.5 },
  'carrot':       { ...zero(), calories: 41, protein: 0.9, totalCarbs: 9.6, fiber: 2.8, totalSugars: 4.7, vitaminA: 835, vitaminC: 5.9, vitaminK: 13.2, potassium: 320, calcium: 33, magnesium: 12 },
  'potato':       { ...zero(), calories: 77, protein: 2, totalCarbs: 17, fiber: 2.2, totalSugars: 0.8, vitaminC: 19.7, vitaminB6: 0.3, potassium: 425, magnesium: 23, iron: 0.8 },
  'sweet potato': { ...zero(), calories: 86, protein: 1.6, totalCarbs: 20.1, fiber: 3, totalSugars: 4.2, vitaminA: 709, vitaminC: 2.4, vitaminB6: 0.21, potassium: 337, calcium: 30, magnesium: 25, manganese: 0.26 },
  'tomato':       { ...zero(), calories: 18, protein: 0.9, totalCarbs: 3.9, fiber: 1.2, totalSugars: 2.6, vitaminA: 42, vitaminC: 14, vitaminK: 7.9, potassium: 237, folate: 15 },
  'cherry tomato':{ ...zero(), calories: 18, protein: 0.9, totalCarbs: 3.9, fiber: 1.2, totalSugars: 2.6, vitaminA: 42, vitaminC: 14, vitaminK: 7.9, potassium: 237 },
  'tomatoes, sun-dried':{ ...zero(), calories: 258, protein: 14, totalCarbs: 56, fiber: 12, totalSugars: 38, vitaminC: 39, iron: 9.1, potassium: 3427, magnesium: 194, vitaminK: 43 },
  'cucumber':     { ...zero(), calories: 15, protein: 0.7, totalCarbs: 3.6, fiber: 0.5, totalSugars: 1.7, vitaminK: 16.4, potassium: 147 },
  'bell pepper, red': { ...zero(), calories: 31, protein: 1, totalCarbs: 6, fiber: 2.1, totalSugars: 4.2, vitaminA: 157, vitaminC: 128, vitaminB6: 0.29, vitaminK: 4.9, potassium: 211, folate: 46 },
  'bell pepper':  { ...zero(), calories: 31, protein: 1, totalCarbs: 6, fiber: 2.1, totalSugars: 4.2, vitaminA: 157, vitaminC: 128, vitaminB6: 0.29, vitaminK: 4.9, potassium: 211 },
  'celery':       { ...zero(), calories: 16, protein: 0.7, totalCarbs: 3, fiber: 1.6, totalSugars: 1.3, vitaminK: 29.3, vitaminA: 22, folate: 36, potassium: 260 },
  'kale':         { ...zero(), calories: 49, protein: 4.3, totalCarbs: 8.8, fiber: 3.6, totalSugars: 2.3, vitaminA: 500, vitaminC: 120, vitaminK: 705, calcium: 150, iron: 1.5, magnesium: 47, potassium: 491, folate: 141, manganese: 0.66 },
  'spinach':      { ...zero(), calories: 23, protein: 2.9, totalCarbs: 3.6, fiber: 2.2, vitaminA: 469, vitaminC: 28, vitaminK: 483, vitaminE: 2, folate: 194, calcium: 99, iron: 2.7, magnesium: 79, potassium: 558, manganese: 0.9 },
  'red beet':     { ...zero(), calories: 43, protein: 1.6, totalCarbs: 9.6, fiber: 2.8, totalSugars: 6.8, folate: 109, vitaminC: 4.9, potassium: 325, magnesium: 23, iron: 0.8, manganese: 0.33 },
  'avocado':      { ...zero(), calories: 160, protein: 2, totalFat: 14.7, saturatedFat: 2.1, polyunsaturatedFat: 1.8, monounsaturatedFat: 9.8, totalCarbs: 8.5, fiber: 6.7, totalSugars: 0.7, vitaminC: 10, vitaminE: 2.1, vitaminK: 21, folate: 81, potassium: 485, magnesium: 29, vitaminB6: 0.26 },
  'head cabbage': { ...zero(), calories: 25, protein: 1.3, totalCarbs: 5.8, fiber: 2.5, totalSugars: 3.2, vitaminC: 36.6, vitaminK: 76, folate: 43, potassium: 170, calcium: 40 },
  'cabbage':      { ...zero(), calories: 25, protein: 1.3, totalCarbs: 5.8, fiber: 2.5, totalSugars: 3.2, vitaminC: 36.6, vitaminK: 76, folate: 43, potassium: 170, calcium: 40 },
  'broccoli':     { ...zero(), calories: 34, protein: 2.8, totalCarbs: 6.6, fiber: 2.6, totalSugars: 1.7, vitaminC: 89.2, vitaminK: 102, folate: 63, potassium: 316, calcium: 47, vitaminA: 31 },
  'cauliflower':  { ...zero(), calories: 25, protein: 1.9, totalCarbs: 5, fiber: 2, totalSugars: 1.9, vitaminC: 48.2, vitaminK: 15.5, folate: 57, potassium: 299 },
  'zucchini':     { ...zero(), calories: 17, protein: 1.2, totalCarbs: 3.1, fiber: 1, totalSugars: 2.5, vitaminC: 17.9, vitaminK: 4.3, vitaminB6: 0.16, potassium: 261, manganese: 0.18 },
  'mushroom':     { ...zero(), calories: 22, protein: 3.1, totalCarbs: 3.3, fiber: 1, vitaminD: 0.2, riboflavin: 0.4, niacin: 3.6, potassium: 318, phosphorus: 86, selenium: 9.3, copper: 0.32 },
  'eggplant':     { ...zero(), calories: 25, protein: 1, totalCarbs: 5.9, fiber: 3, totalSugars: 3.5, vitaminK: 3.5, folate: 22, potassium: 229, manganese: 0.23 },

  // ── Aromatics & herbs (used in small amounts; per 100g) ────────────
  'parsley':       { ...zero(), calories: 36, protein: 3, totalCarbs: 6.3, fiber: 3.3, vitaminA: 421, vitaminC: 133, vitaminK: 1640, folate: 152, iron: 6.2, calcium: 138, potassium: 554 },
  'coriander':     { ...zero(), calories: 23, protein: 2.1, totalCarbs: 3.7, fiber: 2.8, vitaminA: 337, vitaminC: 27, vitaminK: 310, folate: 62, iron: 1.8, calcium: 67, potassium: 521 },
  'basil':         { ...zero(), calories: 23, protein: 3.2, totalCarbs: 2.6, fiber: 1.6, vitaminA: 264, vitaminC: 18, vitaminK: 414, calcium: 177, iron: 3.2, magnesium: 64, potassium: 295 },
  'dill':          { ...zero(), calories: 43, protein: 3.5, totalCarbs: 7, fiber: 2.1, vitaminA: 386, vitaminC: 85, vitaminK: 250, calcium: 208, iron: 6.6, manganese: 1.3 },
  'ginger':        { ...zero(), calories: 80, protein: 1.8, totalCarbs: 17.8, fiber: 2, totalSugars: 1.7, vitaminB6: 0.16, magnesium: 43, potassium: 415, manganese: 0.23 },
  'thyme, dried':  { ...zero(), calories: 276, protein: 9.1, totalCarbs: 64, fiber: 37, vitaminC: 50, vitaminK: 1714, calcium: 1890, iron: 124, magnesium: 220, potassium: 814 },
  'oregano, dried':{ ...zero(), calories: 265, protein: 9, totalCarbs: 69, fiber: 43, vitaminK: 622, calcium: 1597, iron: 36.8, magnesium: 270, potassium: 1260 },
  'rosemary, dried': { ...zero(), calories: 331, protein: 4.9, totalCarbs: 64, fiber: 42, vitaminC: 61, calcium: 1280, iron: 29.3, magnesium: 220, potassium: 955 },
  'marjoram, dried': { ...zero(), calories: 271, protein: 12.7, totalCarbs: 60, fiber: 40, vitaminK: 622, calcium: 1990, iron: 82.7 },
  'bay leaf, dried': { ...zero(), calories: 313, protein: 7.6, totalCarbs: 75, fiber: 26, vitaminA: 309, vitaminC: 46.5, calcium: 834, iron: 43, magnesium: 120, potassium: 529 },

  // ── Spices (per 100g — typical use is grams) ───────────────────────
  'cinnamon':       { ...zero(), calories: 247, protein: 4, totalCarbs: 81, fiber: 53, calcium: 1002, iron: 8.3, magnesium: 60, manganese: 17.5, potassium: 431 },
  'turmeric':       { ...zero(), calories: 354, protein: 7.8, totalCarbs: 65, fiber: 21, iron: 41.4, manganese: 7.8, potassium: 2525, vitaminB6: 1.8 },
  'cumin powder':   { ...zero(), calories: 375, protein: 17.8, totalCarbs: 44, fiber: 11, calcium: 931, iron: 66.4, magnesium: 366, potassium: 1788 },
  'cumin':          { ...zero(), calories: 375, protein: 17.8, totalCarbs: 44, fiber: 11, calcium: 931, iron: 66.4, magnesium: 366, potassium: 1788 },
  'coriander powder':{ ...zero(), calories: 298, protein: 12.4, totalCarbs: 55, fiber: 41.9, calcium: 709, iron: 16.3, magnesium: 330, potassium: 1267 },
  'paprika powder':  { ...zero(), calories: 282, protein: 14.1, totalCarbs: 54, fiber: 35, vitaminA: 2463, vitaminC: 0.9, vitaminE: 29.1, iron: 21.1, potassium: 2280 },
  'smoked paprika':  { ...zero(), calories: 282, protein: 14.1, totalCarbs: 54, fiber: 35, vitaminA: 2463, vitaminE: 29.1, iron: 21.1, potassium: 2280 },
  'pepper, cayenne': { ...zero(), calories: 318, protein: 12, totalCarbs: 57, fiber: 27.2, vitaminA: 2081, vitaminC: 76.4, vitaminE: 29.8, iron: 7.8, potassium: 2014 },
  'chilli flakes':   { ...zero(), calories: 282, protein: 13.5, totalCarbs: 50, fiber: 28, vitaminA: 1482, vitaminE: 29.8, iron: 13.4 },
  'chilli':          { ...zero(), calories: 40, protein: 1.9, totalCarbs: 8.8, fiber: 1.5, vitaminC: 144, vitaminA: 48 },
  'mustard seeds':   { ...zero(), calories: 508, protein: 26.1, totalFat: 36, saturatedFat: 1.9, totalCarbs: 28, fiber: 12.2, calcium: 266, iron: 9.2, magnesium: 370, phosphorus: 828, selenium: 208 },
  'nutmeg':          { ...zero(), calories: 525, protein: 5.8, totalCarbs: 49, fiber: 21, calcium: 184, iron: 3.0, magnesium: 183, manganese: 2.9 },
  'garlic powder':   { ...zero(), calories: 331, protein: 16.6, totalCarbs: 73, fiber: 9, calcium: 79, iron: 5.7, potassium: 1193, vitaminB6: 1.65 },
  'onion powder':    { ...zero(), calories: 341, protein: 10.4, totalCarbs: 79, fiber: 15, calcium: 384, iron: 3.7, potassium: 985 },
  'pepper, black':   { ...zero(), calories: 251, protein: 10.4, totalCarbs: 64, fiber: 25, calcium: 443, iron: 9.7, potassium: 1329, manganese: 12.7 },
  'black pepper':    { ...zero(), calories: 251, protein: 10.4, totalCarbs: 64, fiber: 25, calcium: 443, iron: 9.7, potassium: 1329 },
  'vanilla powder':  { ...zero(), calories: 288, totalCarbs: 12.7, totalSugars: 12.7 },
  'vanilla':         { ...zero(), calories: 288, totalCarbs: 12.7 },
  'fennel seeds':    { ...zero(), calories: 345, protein: 16, totalFat: 15, totalCarbs: 52, fiber: 39.8, calcium: 1196, iron: 18.5, magnesium: 385 },
  'caraway seeds':   { ...zero(), calories: 333, protein: 19.8, totalFat: 14.6, totalCarbs: 50, fiber: 38, calcium: 689, iron: 16.2, magnesium: 258 },

  // ── Nuts & seeds ───────────────────────────────────────────────────
  'cashew':          { ...zero(), calories: 553, protein: 18.2, totalFat: 43.8, saturatedFat: 7.8, monounsaturatedFat: 23.8, polyunsaturatedFat: 7.8, totalCarbs: 30, fiber: 3.3, totalSugars: 5.9, calcium: 37, iron: 6.7, magnesium: 292, phosphorus: 593, potassium: 660, zinc: 5.8, copper: 2.2, manganese: 1.7, selenium: 19.9, thiamin: 0.42, vitaminB6: 0.42, folate: 25 },
  'cashews':         { ...zero(), calories: 553, protein: 18.2, totalFat: 43.8, saturatedFat: 7.8, monounsaturatedFat: 23.8, polyunsaturatedFat: 7.8, totalCarbs: 30, fiber: 3.3, totalSugars: 5.9, calcium: 37, iron: 6.7, magnesium: 292, phosphorus: 593, potassium: 660, zinc: 5.8, copper: 2.2, manganese: 1.7, selenium: 19.9 },
  'almonds':         { ...zero(), calories: 579, protein: 21.2, totalFat: 49.9, saturatedFat: 3.8, monounsaturatedFat: 31.6, polyunsaturatedFat: 12.3, totalCarbs: 21.6, fiber: 12.5, totalSugars: 4.4, calcium: 269, iron: 3.7, magnesium: 270, phosphorus: 481, potassium: 733, zinc: 3.1, vitaminE: 25.6, riboflavin: 1.1, manganese: 2.2 },
  'almond':          { ...zero(), calories: 579, protein: 21.2, totalFat: 49.9, saturatedFat: 3.8, monounsaturatedFat: 31.6, polyunsaturatedFat: 12.3, totalCarbs: 21.6, fiber: 12.5, calcium: 269, iron: 3.7, magnesium: 270, vitaminE: 25.6 },
  'walnuts':         { ...zero(), calories: 654, protein: 15.2, totalFat: 65.2, saturatedFat: 6.1, monounsaturatedFat: 8.9, polyunsaturatedFat: 47.2, omega3: 9, totalCarbs: 13.7, fiber: 6.7, calcium: 98, iron: 2.9, magnesium: 158, phosphorus: 346, potassium: 441, zinc: 3.1, copper: 1.6, manganese: 3.4 },
  'pecans':          { ...zero(), calories: 691, protein: 9.2, totalFat: 72, saturatedFat: 6.2, monounsaturatedFat: 40.8, polyunsaturatedFat: 21.6, totalCarbs: 14, fiber: 9.6, calcium: 70, iron: 2.5, magnesium: 121, manganese: 4.5, zinc: 4.5 },
  'sunflower seeds': { ...zero(), calories: 584, protein: 20.8, totalFat: 51.5, saturatedFat: 4.5, monounsaturatedFat: 18.5, polyunsaturatedFat: 23.1, totalCarbs: 20, fiber: 8.6, totalSugars: 2.6, vitaminE: 35.2, magnesium: 325, selenium: 53, copper: 1.8, manganese: 2 },
  'sesame seeds':    { ...zero(), calories: 573, protein: 17.7, totalFat: 49.7, saturatedFat: 7, monounsaturatedFat: 18.8, polyunsaturatedFat: 21.8, totalCarbs: 23.5, fiber: 11.8, calcium: 975, iron: 14.6, magnesium: 351, zinc: 7.8, copper: 4.1 },
  'flax seeds':      { ...zero(), calories: 534, protein: 18.3, totalFat: 42.2, saturatedFat: 3.7, polyunsaturatedFat: 28.7, omega3: 22.8, totalCarbs: 28.9, fiber: 27.3, calcium: 255, iron: 5.7, magnesium: 392, potassium: 813 },
  'chia seeds':      { ...zero(), calories: 486, protein: 16.5, totalFat: 30.7, saturatedFat: 3.3, polyunsaturatedFat: 23.7, omega3: 17.8, totalCarbs: 42.1, fiber: 34.4, calcium: 631, iron: 7.7, magnesium: 335, phosphorus: 860, zinc: 4.6 },
  'pine nuts':       { ...zero(), calories: 673, protein: 13.7, totalFat: 68.4, saturatedFat: 4.9, monounsaturatedFat: 18.8, polyunsaturatedFat: 34.1, totalCarbs: 13.1, fiber: 3.7, magnesium: 251, manganese: 8.8, zinc: 6.5 },
  'pumpkin seeds':   { ...zero(), calories: 559, protein: 30.2, totalFat: 49, saturatedFat: 8.7, monounsaturatedFat: 16.2, polyunsaturatedFat: 20.9, totalCarbs: 10.7, fiber: 6, magnesium: 592, phosphorus: 1233, zinc: 7.8, iron: 8.8, copper: 1.3, manganese: 4.5 },
  'hazelnuts':       { ...zero(), calories: 628, protein: 15, totalFat: 60.8, saturatedFat: 4.5, monounsaturatedFat: 45.7, polyunsaturatedFat: 7.9, totalCarbs: 16.7, fiber: 9.7, vitaminE: 15, magnesium: 163, manganese: 6.2, copper: 1.7 },
  'peanuts':         { ...zero(), calories: 567, protein: 25.8, totalFat: 49.2, saturatedFat: 6.3, monounsaturatedFat: 24.4, polyunsaturatedFat: 15.6, totalCarbs: 16.1, fiber: 8.5, magnesium: 168, niacin: 12.1, folate: 240 },
  'peanut butter':   { ...zero(), calories: 588, protein: 25, totalFat: 50, saturatedFat: 10, monounsaturatedFat: 24, polyunsaturatedFat: 14, totalCarbs: 20, fiber: 6, totalSugars: 9, sodium: 459 },

  // ── Legumes (cooked) ───────────────────────────────────────────────
  'chickpeas, cooked': { ...zero(), calories: 164, protein: 8.9, totalFat: 2.6, totalCarbs: 27.4, fiber: 7.6, totalSugars: 4.8, calcium: 49, iron: 2.9, magnesium: 48, potassium: 291, folate: 172, manganese: 1 },
  'chickpeas':         { ...zero(), calories: 164, protein: 8.9, totalFat: 2.6, totalCarbs: 27.4, fiber: 7.6, totalSugars: 4.8, calcium: 49, iron: 2.9, folate: 172 },
  'black beans':       { ...zero(), calories: 132, protein: 8.9, totalCarbs: 23.7, fiber: 8.7, calcium: 27, iron: 2.1, magnesium: 70, folate: 149 },
  'kidney beans':      { ...zero(), calories: 127, protein: 8.7, totalCarbs: 22.8, fiber: 6.4, iron: 2.2, magnesium: 42, folate: 130 },
  'lentils, cooked':   { ...zero(), calories: 116, protein: 9, totalCarbs: 20.1, fiber: 7.9, totalSugars: 1.8, iron: 3.3, folate: 181, magnesium: 36, potassium: 369 },
  'lentils':           { ...zero(), calories: 353, protein: 25.8, totalCarbs: 60, fiber: 30, iron: 7.5, folate: 479, magnesium: 122 },
  'red lentils':       { ...zero(), calories: 358, protein: 23, totalCarbs: 63, fiber: 11, iron: 6.5, folate: 215 },
  'tofu':              { ...zero(), calories: 76, protein: 8.1, totalFat: 4.8, saturatedFat: 0.7, totalCarbs: 1.9, fiber: 0.3, calcium: 350, iron: 5.4, magnesium: 30, phosphorus: 97 },
  'tempeh':            { ...zero(), calories: 192, protein: 20.3, totalFat: 10.8, totalCarbs: 7.6, fiber: 0, calcium: 111, iron: 2.7, magnesium: 81, riboflavin: 0.36 },
  'edamame':           { ...zero(), calories: 121, protein: 11.9, totalFat: 5.2, totalCarbs: 8.9, fiber: 5.2, folate: 311, vitaminK: 26.7, manganese: 1, iron: 2.3 },

  // ── Grains & flours ────────────────────────────────────────────────
  'whole wheat flour':{ ...zero(), calories: 340, protein: 13.2, totalFat: 2.5, totalCarbs: 72, fiber: 10.7, totalSugars: 0.4, iron: 3.6, magnesium: 137, phosphorus: 357, niacin: 5.5, thiamin: 0.5 },
  'white flour':      { ...zero(), calories: 364, protein: 10.3, totalFat: 1, totalCarbs: 76, fiber: 2.7, iron: 4.6, thiamin: 0.79, riboflavin: 0.5, niacin: 5.9, folate: 261 },
  'flour':            { ...zero(), calories: 364, protein: 10.3, totalFat: 1, totalCarbs: 76, fiber: 2.7, iron: 4.6 },
  'oat flour':        { ...zero(), calories: 404, protein: 14.7, totalFat: 9.1, totalCarbs: 65.7, fiber: 6.5, iron: 4, magnesium: 144, manganese: 4 },
  'oats':             { ...zero(), calories: 389, protein: 16.9, totalFat: 6.9, saturatedFat: 1.2, polyunsaturatedFat: 2.5, monounsaturatedFat: 2.2, totalCarbs: 66.3, fiber: 10.6, totalSugars: 0, iron: 4.7, magnesium: 177, phosphorus: 523, zinc: 4, manganese: 4.9, thiamin: 0.76 },
  'small oats':       { ...zero(), calories: 389, protein: 16.9, totalFat: 6.9, totalCarbs: 66.3, fiber: 10.6, iron: 4.7, magnesium: 177, manganese: 4.9 },
  'rolled oats':      { ...zero(), calories: 389, protein: 16.9, totalFat: 6.9, totalCarbs: 66.3, fiber: 10.6, iron: 4.7, magnesium: 177, manganese: 4.9 },
  'rice, white':      { ...zero(), calories: 130, protein: 2.7, totalCarbs: 28.2, fiber: 0.4, iron: 0.2, manganese: 0.5 },
  'rice, brown':      { ...zero(), calories: 112, protein: 2.6, totalCarbs: 23.5, fiber: 1.8, iron: 0.5, magnesium: 43, manganese: 1.1 },
  'rice':             { ...zero(), calories: 130, protein: 2.7, totalCarbs: 28.2, fiber: 0.4 },
  'quinoa':           { ...zero(), calories: 368, protein: 14.1, totalFat: 6.1, totalCarbs: 64, fiber: 7, iron: 4.6, magnesium: 197, phosphorus: 457, folate: 184, manganese: 2 },
  'pasta':            { ...zero(), calories: 158, protein: 5.8, totalCarbs: 31, fiber: 1.8, iron: 1.3 },
  'cornstarch':       { ...zero(), calories: 381, totalCarbs: 91, fiber: 0.9 },
  'tapioca starch':   { ...zero(), calories: 358, totalCarbs: 89 },
  'potato starch':    { ...zero(), calories: 333, totalCarbs: 83 },
  'baking powder':    { ...zero(), sodium: 10600, calcium: 5876 },
  'baking soda':      { ...zero(), sodium: 27360 },
  'yeast, dry':       { ...zero(), calories: 295, protein: 38, totalFat: 4.6, totalCarbs: 38.2, fiber: 22.2, iron: 17, thiamin: 23.4, riboflavin: 14.3, niacin: 40.2, vitaminB6: 1.5, folate: 2340 },
  'yeast':            { ...zero(), calories: 295, protein: 38, totalCarbs: 38.2, fiber: 22.2 },
  'fibre husk':       { ...zero(), calories: 234, protein: 1.5, totalCarbs: 88, fiber: 80 },
  'agar-agar':        { ...zero(), calories: 26, totalCarbs: 6.8, fiber: 0.5, calcium: 54, iron: 1.9, magnesium: 67 },
  'breadcrumbs':      { ...zero(), calories: 395, protein: 13.4, totalFat: 5.3, totalCarbs: 71.9, fiber: 4.5, iron: 4.8, sodium: 732 },
  'whole wheat bread':{ ...zero(), calories: 247, protein: 13, totalFat: 3.4, totalCarbs: 41, fiber: 7, iron: 3.3, sodium: 472 },

  // ── Dairy & dairy alternatives ─────────────────────────────────────
  'soy milk':       { ...zero(), calories: 33, protein: 2.6, totalFat: 1.8, totalCarbs: 1.7, fiber: 0.5, calcium: 123, iron: 0.4, vitaminB12: 1.2, vitaminD: 1, riboflavin: 0.21 },
  'almond milk':    { ...zero(), calories: 17, protein: 0.6, totalFat: 1.2, totalCarbs: 1.5, calcium: 188, vitaminD: 1, vitaminE: 6.6, vitaminB12: 1.2 },
  'oat milk':       { ...zero(), calories: 47, protein: 1, totalFat: 1.5, totalCarbs: 7.2, fiber: 0.8, calcium: 120, vitaminD: 1, vitaminB12: 0.4, riboflavin: 0.18 },
  'coconut milk':   { ...zero(), calories: 230, protein: 2.3, totalFat: 23.8, saturatedFat: 21.1, totalCarbs: 5.5, fiber: 2.2, totalSugars: 3.3, iron: 1.6, magnesium: 37, manganese: 0.9, potassium: 263 },
  'coconut cream':  { ...zero(), calories: 330, protein: 3.6, totalFat: 34.7, saturatedFat: 30.8, totalCarbs: 6.7, fiber: 2.2, iron: 2.2, magnesium: 46 },
  'milk':           { ...zero(), calories: 61, protein: 3.2, totalFat: 3.3, saturatedFat: 1.9, totalCarbs: 4.8, totalSugars: 5.1, calcium: 113, vitaminB12: 0.45, riboflavin: 0.18 },
  'butter':         { ...zero(), calories: 717, protein: 0.9, totalFat: 81.1, saturatedFat: 51.4, monounsaturatedFat: 21, totalCarbs: 0.1, vitaminA: 684, sodium: 11, cholesterol: 215 },
  'cheese':         { ...zero(), calories: 402, protein: 25, totalFat: 33.1, saturatedFat: 21, totalCarbs: 1.3, calcium: 721, sodium: 621, vitaminA: 330 },
  'parmesan':       { ...zero(), calories: 431, protein: 38.5, totalFat: 28.6, saturatedFat: 17.8, totalCarbs: 4.1, calcium: 1184, sodium: 1602, vitaminA: 207 },
  'feta':           { ...zero(), calories: 264, protein: 14.2, totalFat: 21.3, saturatedFat: 14.9, totalCarbs: 4.1, calcium: 493, sodium: 917 },
  'yogurt':         { ...zero(), calories: 59, protein: 10, totalFat: 0.4, totalCarbs: 3.6, totalSugars: 3.2, calcium: 110, vitaminB12: 0.75 },
  'greek yogurt':   { ...zero(), calories: 59, protein: 10, totalFat: 0.4, totalCarbs: 3.6, totalSugars: 3.2, calcium: 110, vitaminB12: 0.75 },
  'sour cream':     { ...zero(), calories: 198, protein: 2.4, totalFat: 19.4, saturatedFat: 11.7, totalCarbs: 4.6, calcium: 101, vitaminA: 167 },

  // ── Eggs ───────────────────────────────────────────────────────────
  'egg':           { ...zero(), calories: 155, protein: 12.6, totalFat: 10.6, saturatedFat: 3.3, monounsaturatedFat: 4.1, polyunsaturatedFat: 1.4, totalCarbs: 1.1, cholesterol: 373, vitaminA: 160, vitaminD: 2, vitaminB12: 1.1, riboflavin: 0.5, folate: 47, choline: 294 },
  'eggs':          { ...zero(), calories: 155, protein: 12.6, totalFat: 10.6, saturatedFat: 3.3, totalCarbs: 1.1, cholesterol: 373, vitaminB12: 1.1, choline: 294 },

  // ── Fruits ─────────────────────────────────────────────────────────
  'lemon':          { ...zero(), calories: 29, protein: 1.1, totalCarbs: 9.3, fiber: 2.8, totalSugars: 2.5, vitaminC: 53, potassium: 138 },
  'lemon juice, fresh':  { ...zero(), calories: 22, protein: 0.4, totalCarbs: 6.9, fiber: 0.3, totalSugars: 2.5, vitaminC: 38.7, potassium: 103 },
  'lemon juice, bottled':{ ...zero(), calories: 21, protein: 0.4, totalCarbs: 6.5, fiber: 0.4, totalSugars: 2.4, vitaminC: 38, potassium: 102 },
  'lemon juice':    { ...zero(), calories: 22, protein: 0.4, totalCarbs: 6.9, fiber: 0.3, vitaminC: 38.7, potassium: 103 },
  'lime juice':     { ...zero(), calories: 25, protein: 0.4, totalCarbs: 8.4, fiber: 0.4, vitaminC: 30, potassium: 117 },
  'orange':         { ...zero(), calories: 47, protein: 0.9, totalCarbs: 11.8, fiber: 2.4, totalSugars: 9.4, vitaminC: 53.2, folate: 30, calcium: 40, potassium: 181 },
  'banana':         { ...zero(), calories: 89, protein: 1.1, totalCarbs: 22.8, fiber: 2.6, totalSugars: 12.2, vitaminC: 8.7, vitaminB6: 0.37, potassium: 358, magnesium: 27 },
  'apple':          { ...zero(), calories: 52, protein: 0.3, totalCarbs: 13.8, fiber: 2.4, totalSugars: 10.4, vitaminC: 4.6, potassium: 107 },
  'pear':           { ...zero(), calories: 57, protein: 0.4, totalCarbs: 15.2, fiber: 3.1, totalSugars: 9.8, vitaminC: 4.3, potassium: 116 },
  'berries':        { ...zero(), calories: 50, protein: 0.7, totalCarbs: 12, fiber: 4, vitaminC: 30, potassium: 80 },
  'blueberries':    { ...zero(), calories: 57, protein: 0.7, totalCarbs: 14.5, fiber: 2.4, totalSugars: 10, vitaminC: 9.7, vitaminK: 19.3, manganese: 0.34 },
  'strawberries':   { ...zero(), calories: 32, protein: 0.7, totalCarbs: 7.7, fiber: 2, totalSugars: 4.9, vitaminC: 58.8, folate: 24, manganese: 0.39 },
  'raspberries':    { ...zero(), calories: 52, protein: 1.2, totalCarbs: 11.9, fiber: 6.5, totalSugars: 4.4, vitaminC: 26.2, manganese: 0.67 },
  'raisins':        { ...zero(), calories: 299, protein: 3.1, totalCarbs: 79.2, fiber: 3.7, totalSugars: 59.2, iron: 1.9, potassium: 749, magnesium: 32 },
  'date, dried':    { ...zero(), calories: 282, protein: 2.5, totalCarbs: 75, fiber: 8, totalSugars: 63.4, potassium: 656, magnesium: 54, manganese: 0.3, vitaminB6: 0.25 },
  'dates':          { ...zero(), calories: 282, protein: 2.5, totalCarbs: 75, fiber: 8, totalSugars: 63.4, potassium: 656, magnesium: 54 },
  'pineapple':      { ...zero(), calories: 50, protein: 0.5, totalCarbs: 13.1, fiber: 1.4, totalSugars: 9.9, vitaminC: 47.8, manganese: 0.93 },

  // ── Sauces & condiments ────────────────────────────────────────────
  'soy sauce':       { ...zero(), calories: 53, protein: 8, totalFat: 0.6, totalCarbs: 4.9, fiber: 0.8, sodium: 5493, iron: 2.4, riboflavin: 0.27, niacin: 4.0 },
  'tomato puree':    { ...zero(), calories: 38, protein: 1.7, totalCarbs: 9, fiber: 1.9, totalSugars: 5, sodium: 28, vitaminC: 8.7, potassium: 439, vitaminA: 28, lycopene: 21.7 },
  'tomato paste':    { ...zero(), calories: 82, protein: 4.3, totalCarbs: 19, fiber: 4.1, totalSugars: 12.2, sodium: 59, potassium: 1014, vitaminC: 21.9, iron: 2.98 },
  'apple cider vinegar':{ ...zero(), calories: 22, totalCarbs: 0.9, sodium: 5 },
  'vinegar':         { ...zero(), calories: 18, totalCarbs: 0.04 },
  'mustard':         { ...zero(), calories: 66, protein: 4.4, totalFat: 4, totalCarbs: 5.3, fiber: 3.3, sodium: 1135 },
  'tahini':          { ...zero(), calories: 595, protein: 17, totalFat: 53.8, saturatedFat: 7.5, monounsaturatedFat: 20.3, polyunsaturatedFat: 23.6, totalCarbs: 21.2, fiber: 9.3, calcium: 426, iron: 9, magnesium: 95, phosphorus: 732, zinc: 4.6 },
  'miso':            { ...zero(), calories: 198, protein: 12, totalFat: 6, totalCarbs: 26.5, fiber: 5.4, sodium: 3728, iron: 2.5, vitaminK: 29.3, manganese: 0.86 },
  'vegetable bouillon, powder': { ...zero(), calories: 220, protein: 12, totalFat: 6, totalCarbs: 30, sodium: 23800 },
  'vegetable bouillon, fresh':  { ...zero(), calories: 12, protein: 0.4, totalCarbs: 2.4, sodium: 320 },
  'vegetable bouillon':         { ...zero(), calories: 12, protein: 0.4, totalCarbs: 2.4, sodium: 320 },
  'nutritional yeast': { ...zero(), calories: 325, protein: 50, totalFat: 6, totalCarbs: 36, fiber: 21, thiamin: 47, riboflavin: 17, niacin: 277, vitaminB6: 4.4, folate: 1340, vitaminB12: 17.6, zinc: 17 },

  // ── Misc ───────────────────────────────────────────────────────────
  'cocoa powder':    { ...zero(), calories: 228, protein: 19.6, totalFat: 13.7, saturatedFat: 8.1, totalCarbs: 57.9, fiber: 33, calcium: 128, iron: 13.9, magnesium: 499, phosphorus: 734, potassium: 1524, copper: 3.8, manganese: 3.8 },
  'dark chocolate':  { ...zero(), calories: 598, protein: 7.8, totalFat: 42.6, saturatedFat: 24.5, totalCarbs: 45.9, fiber: 10.9, totalSugars: 24, addedSugar: 24, iron: 11.9, magnesium: 228, copper: 1.8, manganese: 1.9 },
  'coconut, shredded':{ ...zero(), calories: 660, protein: 6.9, totalFat: 64.5, saturatedFat: 57.2, totalCarbs: 23.7, fiber: 16.3, totalSugars: 7.4, iron: 3.3, magnesium: 90, manganese: 2.7 },
  'olives':          { ...zero(), calories: 115, protein: 0.8, totalFat: 10.7, saturatedFat: 1.4, monounsaturatedFat: 7.9, totalCarbs: 6.3, fiber: 3.2, sodium: 1556, iron: 3.3, calcium: 88 },
  'nori':            { ...zero(), calories: 35, protein: 5.8, totalFat: 0.3, totalCarbs: 5.1, fiber: 0.3, vitaminA: 260, vitaminC: 39, iron: 1.8, calcium: 70, magnesium: 2, vitaminB12: 9 },
  'seaweed':         { ...zero(), calories: 35, protein: 5.8, totalFat: 0.3, totalCarbs: 5.1, fiber: 0.3, vitaminA: 260, iron: 1.8 },
  'bread crumbs':    { ...zero(), calories: 395, protein: 13.4, totalFat: 5.3, totalCarbs: 71.9, fiber: 4.5, iron: 4.8, sodium: 732 },
  'bread':           { ...zero(), calories: 247, protein: 13, totalFat: 3.4, totalCarbs: 41, fiber: 7, iron: 3.3, sodium: 472 },
  'mozzarella':      { ...zero(), calories: 280, protein: 22.2, totalFat: 17.1, saturatedFat: 10.1, totalCarbs: 3.1, calcium: 731, sodium: 489 },
  'vegan mozzarella':{ ...zero(), calories: 240, protein: 1, totalFat: 17, saturatedFat: 14, totalCarbs: 22, sodium: 600 },
  'salsa':           { ...zero(), calories: 36, protein: 1.5, totalCarbs: 8, fiber: 2.4, sodium: 711, vitaminC: 6 },
  'green beans':     { ...zero(), calories: 31, protein: 1.8, totalCarbs: 7, fiber: 2.7, vitaminC: 12.2, vitaminK: 43, folate: 33, iron: 1, manganese: 0.22 },
  'asparagus':       { ...zero(), calories: 20, protein: 2.2, totalCarbs: 3.9, fiber: 2.1, vitaminA: 38, vitaminC: 5.6, vitaminK: 41.6, folate: 52, iron: 2.1 },
  'pumpkin':         { ...zero(), calories: 26, protein: 1, totalCarbs: 6.5, fiber: 0.5, vitaminA: 426, vitaminC: 9, potassium: 340 },
  'butternut squash':{ ...zero(), calories: 45, protein: 1, totalCarbs: 11.7, fiber: 2, vitaminA: 532, vitaminC: 21, magnesium: 34, potassium: 352 },
  'corn':            { ...zero(), calories: 86, protein: 3.3, totalFat: 1.4, totalCarbs: 19, fiber: 2.7, totalSugars: 3.2, vitaminC: 6.8, folate: 46, magnesium: 37 },
  'peas':            { ...zero(), calories: 81, protein: 5.4, totalCarbs: 14.5, fiber: 5.7, totalSugars: 5.7, vitaminC: 40, vitaminK: 24.8, folate: 65, iron: 1.5 },
  'olives, kalamata':{ ...zero(), calories: 115, protein: 0.8, totalFat: 10.7, saturatedFat: 1.4, monounsaturatedFat: 7.9, totalCarbs: 6.3, fiber: 3.2, sodium: 1556 },
  'pickles':         { ...zero(), calories: 11, totalCarbs: 2.3, fiber: 1.2, sodium: 808 },
  'capers':          { ...zero(), calories: 23, protein: 2.4, totalFat: 0.9, totalCarbs: 4.9, fiber: 3.2, sodium: 2964, vitaminK: 24.6 },
  'anchovies':       { ...zero(), calories: 131, protein: 20.4, totalFat: 4.8, saturatedFat: 1.3, omega3: 1.5, sodium: 104, calcium: 147, niacin: 14 },
  'fish sauce':      { ...zero(), calories: 35, protein: 5.1, totalCarbs: 3.6, sodium: 7851 },
  'rice vinegar':    { ...zero(), calories: 18 },
  'balsamic vinegar':{ ...zero(), calories: 88, totalCarbs: 17, totalSugars: 15, sodium: 23 },
  'pasta sauce':     { ...zero(), calories: 70, protein: 1.7, totalCarbs: 11, fiber: 2.4, sodium: 562, vitaminC: 8 },
  'curry powder':    { ...zero(), calories: 325, protein: 14, totalCarbs: 56, fiber: 53, iron: 19.1, calcium: 478, magnesium: 254 },
  'curry paste':     { ...zero(), calories: 110, protein: 4, totalCarbs: 16, fiber: 6, sodium: 2400, vitaminC: 4 },
  'kimchi':          { ...zero(), calories: 15, protein: 1.1, totalCarbs: 2.4, fiber: 1.6, sodium: 498, vitaminC: 18, vitaminA: 36 },
  'sauerkraut':      { ...zero(), calories: 19, protein: 0.9, totalCarbs: 4.3, fiber: 2.9, sodium: 661, vitaminC: 14.7, vitaminK: 13 },
  'chili, red':      { ...zero(), calories: 40, protein: 1.9, totalCarbs: 8.8, fiber: 1.5, vitaminC: 144, vitaminA: 48 },
  'chili':           { ...zero(), calories: 40, protein: 1.9, totalCarbs: 8.8, fiber: 1.5, vitaminC: 144, vitaminA: 48 },
  'soy mayonnaise':  { ...zero(), calories: 680, protein: 1, totalFat: 75, saturatedFat: 11, monounsaturatedFat: 45, polyunsaturatedFat: 19, totalCarbs: 1, sodium: 635 },
  'mayonnaise':      { ...zero(), calories: 680, protein: 1, totalFat: 75, saturatedFat: 11, monounsaturatedFat: 45, polyunsaturatedFat: 19, totalCarbs: 1, sodium: 635 },
  'flaxseeds':       { ...zero(), calories: 534, protein: 18.3, totalFat: 42.2, saturatedFat: 3.7, polyunsaturatedFat: 28.7, omega3: 22.8, totalCarbs: 28.9, fiber: 27.3, calcium: 255, iron: 5.7, magnesium: 392, potassium: 813 },
  'white beans, large, canned': { ...zero(), calories: 114, protein: 7.2, totalCarbs: 21, fiber: 5.5, iron: 2.5, magnesium: 38, potassium: 389, folate: 81 },
  'white beans':     { ...zero(), calories: 139, protein: 9.7, totalCarbs: 25.1, fiber: 6.3, iron: 3.7, magnesium: 63, folate: 81 },
  'chives':          { ...zero(), calories: 30, protein: 3.3, totalCarbs: 4.4, fiber: 2.5, vitaminA: 218, vitaminC: 58, vitaminK: 213, folate: 105, iron: 1.6 },
  'cottage cheese':  { ...zero(), calories: 98, protein: 11.1, totalFat: 4.3, saturatedFat: 1.7, totalCarbs: 3.4, calcium: 83, sodium: 364, vitaminB12: 0.43 },
  'cream cheese':    { ...zero(), calories: 342, protein: 6.2, totalFat: 34, saturatedFat: 19.3, totalCarbs: 4.1, calcium: 98, sodium: 321, vitaminA: 308 },
  'cream':           { ...zero(), calories: 340, protein: 2.8, totalFat: 36, saturatedFat: 23, totalCarbs: 2.8, calcium: 65, vitaminA: 411 },
  'molasses':        { ...zero(), calories: 290, protein: 0, totalCarbs: 75, totalSugars: 75, addedSugar: 75, calcium: 205, iron: 4.7, magnesium: 242, potassium: 1464 },
  'arrowroot':       { ...zero(), calories: 357, totalCarbs: 88.2, calcium: 6, iron: 0.3, magnesium: 3 },
  'apricot, dried':  { ...zero(), calories: 241, protein: 3.4, totalCarbs: 63, fiber: 7.3, totalSugars: 53, vitaminA: 180, iron: 2.7, potassium: 1162 },
  'cranberries, dried':{ ...zero(), calories: 308, protein: 0.1, totalCarbs: 82, fiber: 5.7, totalSugars: 72, vitaminC: 0.2 },
  'shallot':         { ...zero(), calories: 72, protein: 2.5, totalCarbs: 16.8, fiber: 3.2, vitaminC: 8, folate: 34, iron: 1.2, manganese: 0.29 },
  'barley coffee':   zero(),  // herbal tea-like, ~0 nutrition for typical serving
  'coffee':          zero(),
  'tea':             zero(),
  'broth':           { ...zero(), calories: 12, protein: 0.4, totalCarbs: 2.4, sodium: 320 },
  'stock':           { ...zero(), calories: 12, protein: 0.4, totalCarbs: 2.4, sodium: 320 },
  'bean sprouts':    { ...zero(), calories: 31, protein: 3, totalCarbs: 5.9, fiber: 1.8, vitaminC: 13.2, folate: 61, iron: 0.9 },
  'mung bean':       { ...zero(), calories: 347, protein: 23.9, totalCarbs: 62.6, fiber: 16.3, iron: 6.7, magnesium: 189, folate: 625 },
  'buckwheat':       { ...zero(), calories: 343, protein: 13.3, totalFat: 3.4, totalCarbs: 71.5, fiber: 10, iron: 2.2, magnesium: 231, manganese: 1.3, niacin: 7 },
  'lettuce':         { ...zero(), calories: 17, protein: 1.2, totalCarbs: 3.3, fiber: 2.1, vitaminA: 436, vitaminK: 102, folate: 136 },
  'romaine':         { ...zero(), calories: 17, protein: 1.2, totalCarbs: 3.3, fiber: 2.1, vitaminA: 436, vitaminK: 102, folate: 136 },
  'hot sauce':       { ...zero(), calories: 11, totalCarbs: 1.8, sodium: 2643, vitaminC: 12 },
  'figs, dried':     { ...zero(), calories: 249, protein: 3.3, totalCarbs: 63.9, fiber: 9.8, totalSugars: 47.9, calcium: 162, iron: 2, magnesium: 68, potassium: 680 },
  'figs':            { ...zero(), calories: 74, protein: 0.8, totalCarbs: 19.2, fiber: 2.9, totalSugars: 16.3, calcium: 35, potassium: 232 },
  'mint':            { ...zero(), calories: 70, protein: 3.8, totalCarbs: 14.9, fiber: 8, vitaminA: 212, vitaminC: 31.8, iron: 5.1, calcium: 243 },
  'sage':            { ...zero(), calories: 315, protein: 10.6, totalCarbs: 60.7, fiber: 40.3, vitaminA: 295, calcium: 1652, iron: 28.1, magnesium: 428, vitaminK: 1715 },
  'garam masala':    { ...zero(), calories: 379, protein: 13, totalCarbs: 50, fiber: 22, iron: 22.8, calcium: 444 },
  'date paste':      { ...zero(), calories: 282, protein: 2.5, totalCarbs: 75, fiber: 8, totalSugars: 63.4, potassium: 656, magnesium: 54 },
  'parsnip':         { ...zero(), calories: 75, protein: 1.2, totalCarbs: 17.99, fiber: 4.9, vitaminC: 17, vitaminK: 22.5, folate: 67, potassium: 375 },
  'cloves, ground':  { ...zero(), calories: 274, protein: 6, totalFat: 13, totalCarbs: 65.5, fiber: 33.9, calcium: 632, iron: 11.8, vitaminK: 142, manganese: 30 },
  'cloves':          { ...zero(), calories: 274, protein: 6, totalCarbs: 65.5, fiber: 33.9, calcium: 632, iron: 11.8 },
  'carob powder':    { ...zero(), calories: 222, protein: 4.6, totalCarbs: 88.9, fiber: 39.8, totalSugars: 49.1, calcium: 348, iron: 2.9, potassium: 827 },
  'fenugreek seeds': { ...zero(), calories: 323, protein: 23, totalCarbs: 58.4, fiber: 24.6, iron: 33.5, magnesium: 191, manganese: 1.2 },
  'prunes':          { ...zero(), calories: 240, protein: 2.2, totalCarbs: 63.9, fiber: 7.1, totalSugars: 38.1, vitaminA: 39, vitaminK: 59.5, potassium: 732 },
  'feld salad':      { ...zero(), calories: 21, protein: 2, totalCarbs: 3.6, fiber: 1.5, vitaminA: 350, vitaminC: 38, iron: 2.2, folate: 14 },
  'pomegranate':     { ...zero(), calories: 83, protein: 1.7, totalCarbs: 18.7, fiber: 4, totalSugars: 13.7, vitaminC: 10.2, vitaminK: 16.4, folate: 38 },
  'plum':            { ...zero(), calories: 46, protein: 0.7, totalCarbs: 11.4, fiber: 1.4, totalSugars: 9.9, vitaminC: 9.5, vitaminK: 6.4 },
  'grape':           { ...zero(), calories: 67, protein: 0.6, totalCarbs: 17, fiber: 0.9, totalSugars: 16.3, vitaminC: 4 },
  'horseradish':     { ...zero(), calories: 48, protein: 1.2, totalCarbs: 11.3, fiber: 3.3, vitaminC: 24.9, calcium: 56, potassium: 246 },
  'radish':          { ...zero(), calories: 16, protein: 0.7, totalCarbs: 3.4, fiber: 1.6, vitaminC: 14.8, folate: 25, potassium: 233 },
  'lasagne sheets':  { ...zero(), calories: 371, protein: 13, totalFat: 1.5, totalCarbs: 75, fiber: 3.2, iron: 1.3 },
  'millet':          { ...zero(), calories: 378, protein: 11, totalFat: 4.2, totalCarbs: 73, fiber: 8.5, iron: 3, magnesium: 114, manganese: 1.6 },
  'tarragon, dried': { ...zero(), calories: 295, protein: 22.8, totalCarbs: 50, fiber: 7.4, iron: 32.3, calcium: 1139, magnesium: 347 },
  'tarragon':        { ...zero(), calories: 295, protein: 22.8, totalCarbs: 50, fiber: 7.4, iron: 32.3, calcium: 1139 },
  'bean noodles':    { ...zero(), calories: 351, protein: 0.2, totalCarbs: 86.1, fiber: 0.5, calcium: 18, iron: 2.6 },
  'oat flakes':      { ...zero(), calories: 389, protein: 16.9, totalFat: 6.9, totalCarbs: 66.3, fiber: 10.6, iron: 4.7, magnesium: 177, manganese: 4.9 },
  'tandoori masala': { ...zero(), calories: 380, protein: 12, totalCarbs: 52, fiber: 23, iron: 22.8, calcium: 444 },
  'arugula':         { ...zero(), calories: 25, protein: 2.6, totalCarbs: 3.7, fiber: 1.6, vitaminA: 119, vitaminC: 15, vitaminK: 109, calcium: 160, iron: 1.5, folate: 97 },
  'brussels sprouts':{ ...zero(), calories: 43, protein: 3.4, totalCarbs: 8.9, fiber: 3.8, totalSugars: 2.2, vitaminC: 85, vitaminK: 177, folate: 61, potassium: 389 },
  'beetroot':        { ...zero(), calories: 43, protein: 1.6, totalCarbs: 9.6, fiber: 2.8, totalSugars: 6.8, folate: 109, vitaminC: 4.9, potassium: 325, magnesium: 23, iron: 0.8 },
  'neutral oil':     fatOil({ saturated: 14, mono: 23, poly: 58 }),
  'cilantro':        { ...zero(), calories: 23, protein: 2.1, totalCarbs: 3.7, fiber: 2.8, vitaminA: 337, vitaminC: 27, vitaminK: 310, folate: 62, iron: 1.8, calcium: 67 },
  'psyllium husk':   { ...zero(), calories: 234, protein: 1.5, totalCarbs: 88, fiber: 80 },
}

/** Helper: produces a zero-filled nutrition object. */
function zero() {
  return {
    calories: 0, protein: 0, totalFat: 0, saturatedFat: 0,
    polyunsaturatedFat: 0, monounsaturatedFat: 0, omega3: 0,
    cholesterol: 0, totalCarbs: 0, totalSugars: 0, addedSugar: 0, fiber: 0,
    calcium: 0, potassium: 0, copper: 0, iron: 0, magnesium: 0, manganese: 0,
    selenium: 0, phosphorus: 0, zinc: 0, sodium: 0,
    vitaminA: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
    vitaminE: 0, vitaminK: 0, folate: 0, thiamin: 0, riboflavin: 0,
    niacin: 0, choline: 0,
  }
}

/** Helper for oils: pure fat, fills macros from a fat-profile spec. */
function fatOil({ saturated, mono, poly, omega3 = 0 }) {
  return {
    ...zero(),
    calories: 884, totalFat: 100,
    saturatedFat: saturated, monounsaturatedFat: mono, polyunsaturatedFat: poly,
    omega3, vitaminE: 14,
  }
}

/** Find best matching ingredient from the database for a recipe ingredient name. */
export function lookupIngredient(rawName) {
  if (!rawName) return null
  const name = rawName.toLowerCase().trim()

  // 1. Exact key match
  if (INGREDIENT_DB[name]) return INGREDIENT_DB[name]

  // 2. Strip common Norwegian/regional suffixes ("norwegian, raw", "imported, raw" etc.)
  const cleaned = name
    .replace(/,\s*norwegian/g, '')
    .replace(/,\s*imported/g, '')
    .replace(/,\s*raw/g, '')
    .replace(/,\s*fresh/g, '')
    .replace(/,\s*dried/g, ' dried')
    .replace(/,\s*ground/g, ' ground')
    .replace(/,\s*cooked/g, ' cooked')
    .replace(/,\s*soyabønneprodukt/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (INGREDIENT_DB[cleaned]) return INGREDIENT_DB[cleaned]

  // 3. Try stripping comma-suffix entirely
  const base = name.split(',')[0].trim()
  if (INGREDIENT_DB[base]) return INGREDIENT_DB[base]

  // 4. Substring match — find a key that appears in the name
  for (const key of Object.keys(INGREDIENT_DB)) {
    if (name.includes(key)) return INGREDIENT_DB[key]
  }
  for (const key of Object.keys(INGREDIENT_DB)) {
    if (key.includes(base) && base.length > 3) return INGREDIENT_DB[key]
  }

  return null
}

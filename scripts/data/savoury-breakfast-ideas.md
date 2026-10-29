# Savoury breakfasts: ideas and proposals

Written 2026-10-29. Make my week's breakfast question (sweet / savoury / both) has only three savoury breakfast dishes outside the FMD pack: Scrambled Tofu, Chickpea Omelet and Frittata. Nothing here has been added or changed. Part 1 lists recipes for you to add with your own pictures; part 2 lists existing recipes that could also be tagged as breakfast.

Nutrition per serving is **calculated** with `scripts/data/food-composition-core.json` (same table as the packs). Labels are what `scripts/lib/recipeLabels.mjs` computes for these exact rows, so the real recipe gets the same ones if it is written like this. Ordinary (salted) canned beans and shop-bought wholegrain rye bread (450 mg sodium/100 g) are counted; the pack's own Rye Sourdough lowers the sodium of the bread-based ideas by ~40 mg. All are plant-based and oil-free (water sauté, parchment). Sodium is at Low salt; `build_salt_levels.mjs` would add a Standard amount up to ~375 mg for a savoury breakfast.

## Part 1: eight new savoury breakfasts (4 servings each)

**All eight added 2026-10-29** (Fredrik approved) to the Fredheim Kitchen pack, version 1.69.0, by `scripts/add_savoury_breakfasts.cjs`, with pictures. Ids: `savoury-oat-porridge`, `tofu-egg-salad-rye`, `smashed-beans-avocado-rye`, `nordic-baked-beans`, `oven-pyttipanna-tofu`, `smorbrod-hummus`, `tofu-shakshuka`, `savoury-buckwheat-porridge`. Differences from the text below: the smørbrød uses 200 g of the pack's Classic Hummus (233 kcal, 343 mg sodium a serving; the quick hummus stays in its method), and the oat porridge is not `quick` (10 + 15 min). Standard salt: the two porridges ¼ → ½ tsp (320 and 315 mg); the other six are already near the breakfast target.

### 1. Savoury oat porridge with mushrooms and spinach
*no:* Havregrøt med sopp og spinat · *sv:* Havregrynsgröt med svamp och spenat

- 160 g rolled oats · 8 dl water · 250 g mushrooms · 100 g spinach · 110 g onions (1) · 2 cloves garlic · 4 tbsp nutritional yeast · ¼ tsp salt · ½ tsp black pepper · 10 g chives · 2 tbsp sunflower seeds
- Method: water-sauté the chopped onion, sliced mushrooms and garlic until the mushrooms are browned. Add the oats and water and simmer for 5 minutes, stirring. Stir in the spinach, nutritional yeast and pepper. Serve topped with chives and sunflower seeds.
- Per serving (~370 g): **231 kcal · protein 12 g · fibre 7.3 g · sodium 175 mg**
- Likely labels: weight-loss, blood-pressure-friendly, diabetes-friendly, heart-healthy, nut-free, soy-free, oil-free, no-added-sugar, quick, batch-friendly, kid-friendly (gluten-free only with GF oats).

### 2. Tofu "egg" salad on rye
*no:* Tofu-«eggesalat» på rugbrød · *sv:* Tofu-«äggröra» på rågbröd

- 400 g tofu (firm) · 60 g plant yogurt (unsweetened) · ½ tsp turmeric · ¼ tsp black salt (kala namak) · 10 g dill · 10 g chives · 50 g red onion · 1 tbsp lemon juice · 200 g wholegrain rye bread (8 slices) · 150 g cucumber
- Method: crumble the tofu with a fork. Stir in the yogurt, turmeric, black salt, lemon juice, finely chopped red onion, dill and chives. Spoon onto the rye bread and top with cucumber slices.
- Per serving (~225 g, 2 open sandwiches): **267 kcal · protein 19 g · fibre 5.2 g · sodium 386 mg**
- Likely labels: weight-loss, diabetes-friendly, heart-healthy, nut-free, oil-free, no-added-sugar, quick, kid-friendly. Not blood-pressure-friendly (172 mg/100 g, mainly the bread and black salt).

### 3. Smashed white beans and avocado on rye
*no:* Moste hvite bønner og avokado på rugbrød · *sv:* Krossade vita bönor och avokado på rågbröd

- 400 g white beans, canned (drained) · 150 g avocado (1 large) · 3 tbsp lemon juice · 1 clove garlic · 160 g wholegrain rye bread (4 slices) · 250 g tomatoes · ¼ tsp chili flakes (optional) · 10 g parsley or cress
- Method: mash the beans, avocado, lemon juice and grated garlic to a rough spread. Spread on the bread and top with sliced tomato, chili flakes and parsley or cress.
- Per serving (~255 g): **282 kcal · protein 12 g · fibre 11 g · sodium 437 mg**
- Likely labels: weight-loss, diabetes-friendly, heart-healthy, nut-free, soy-free, oil-free, no-added-sugar, quick. Not blood-pressure-friendly (salted beans and bread; with no-salt beans ~250 mg it would be).

### 4. Nordic baked beans on rye toast
*no:* Nordiske bakte bønner på rugbrød · *sv:* Nordiska bakade bönor på rågbröd

- 110 g onions · 2 cloves garlic · 400 g canned tomatoes · 400 g white beans, canned (drained) · 1 tbsp tomato purée · 1 tsp smoked paprika · 1 tsp dried thyme · 20 g Medjool dates (chopped) · 160 g wholegrain rye bread (4 slices) · 10 g parsley
- Method: water-sauté the onion and garlic. Add the tomatoes, purée, dates, paprika and thyme and simmer for 10 minutes. Blend the sauce smooth, add the beans and simmer for 10 more minutes. Serve on toasted rye with parsley. Keeps 4 days and freezes.
- Per serving (~280 g): **272 kcal · protein 13 g · fibre 11 g · sodium 496 mg**
- Likely labels: weight-loss, diabetes-friendly, heart-healthy, nut-free, soy-free, oil-free, no-added-sugar, batch-friendly, kid-friendly. Not blood-pressure-friendly (176 mg/100 g).

### 5. Oven pyttipanna with tofu and beetroot
*no:* Pytt i panne med tofu, ovnsbakt · *sv:* Pytt i panna med tofu, ugnsbakad

- 600 g potatoes · 200 g carrots · 110 g onions · 300 g tofu (firm) · 1 tsp paprika · 1 tsp dried thyme · ½ tsp black pepper · ½ tsp salt · 250 g cooked beetroot (not pickled) · 10 g parsley
- Method: dice the potatoes, carrots, onion and tofu (1 cm). Toss with the paprika, thyme, pepper and salt and spread on parchment. Bake at 220 °C for ~30 minutes, turning once. Serve with diced beetroot and parsley. Leftover cold potatoes cut the time to 15 minutes.
- Per serving (~370 g): **272 kcal · protein 15 g · fibre 8.5 g · sodium 394 mg**
- Likely labels: weight-loss, blood-pressure-friendly, diabetes-friendly, heart-healthy, gluten-free, nut-free, oil-free, no-added-sugar, kid-friendly.

### 6. Smørbrød with hummus, cucumber and radish
*no:* Smørbrød med hummus, agurk og reddik · *sv:* Smörgås med hummus, gurka och rädisor

- 200 g wholegrain rye bread (8 slices) · 200 g chickpeas, canned (drained) · 2 tbsp tahini · 3 tbsp lemon juice · 1 clove garlic · ½ tsp ground cumin · 150 g cucumber · 100 g radishes · 200 g tomatoes · 10 g dill
- Method: blend the chickpeas, tahini, lemon juice, garlic, cumin and 2–3 tbsp water to a quick hummus, or use 200 g of the pack's Classic Hummus. Spread it on the bread and top with thin cucumber, radish and tomato slices and dill.
- Per serving (~235 g, 2 open sandwiches): **259 kcal · protein 10 g · fibre 8.2 g · sodium 363 mg**
- Likely labels: weight-loss, diabetes-friendly, heart-healthy, nut-free, soy-free, oil-free, no-added-sugar, quick, kid-friendly. Not blood-pressure-friendly (154 mg/100 g).

### 7. Tofu shakshuka
*no:* Shakshuka med tofu · *sv:* Shakshuka med tofu

- 110 g onions · 300 g red bell peppers · 2 cloves garlic · 800 g canned tomatoes · 1 tsp ground cumin · 1 tsp smoked paprika · 400 g tofu (firm, in thick slices) · 100 g spinach · ¼ tsp salt · 10 g parsley · 120 g wholegrain rye bread (4 slices)
- Method: water-sauté the onion, sliced pepper and garlic until soft. Add the tomatoes, cumin, paprika and salt and simmer for 10 minutes. Press the tofu slices into the sauce, add the spinach, cover and simmer for 8 minutes. Serve with parsley and rye bread.
- Per serving (~460 g): **305 kcal · protein 21 g · fibre 10 g · sodium 437 mg**
- Likely labels: weight-loss, blood-pressure-friendly, diabetes-friendly, heart-healthy, nut-free, oil-free, no-added-sugar, kid-friendly (gluten-free without the bread).

### 8. Savoury buckwheat porridge with leek and peas
*no:* Bokhvetegrøt med purre og erter · *sv:* Bovetegröt med purjolök och ärtor

- 200 g buckwheat groats · 7 dl water · 200 g leeks · 200 g green peas (frozen) · 3 tbsp nutritional yeast · 1 tbsp lemon juice · 10 g dill · ¼ tsp salt · ½ tsp black pepper · 3 tbsp pumpkin seeds
- Method: rinse the buckwheat. Simmer it with the sliced leek and the water for 12 minutes. Add the peas for the last 3 minutes. Stir in the nutritional yeast, lemon, salt and pepper, and serve with dill and pumpkin seeds.
- Per serving (~345 g): **298 kcal · protein 14 g · fibre 9.5 g · sodium 170 mg**
- Likely labels: weight-loss, blood-pressure-friendly, diabetes-friendly, heart-healthy, gluten-free, nut-free, soy-free, oil-free, no-added-sugar, quick, kid-friendly.

Every ingredient above already has a dictionary id and a composition entry (`black-salt`, `plant-yogurt`, `buckwheat-groats` and the rest), so no new entries would be needed. Plant yogurt is soy-based unless the row says otherwise, which is why ideas 2 and 7 are not soy-free.

## Part 2: existing recipes that could be tagged breakfast (proposals; `orn-45` applied)

Make my week only takes breakfast **dishes** (`isBreakfast`: mealTypes includes breakfast and the category is not Bread, Spreads, Sauce, Jam, Drink, Dessert or Snack). Savoury spreads (hummus, bean pâté, tofu cottage cheese, the cashew cheeses) already come to the breakfast table with the week's bread, and follow the sweet/savoury answer. Tagging them breakfast would change nothing, so they are not proposed.

| Recipe | Now | Proposal | Per serving | Labels (unchanged as breakfast) | Note |
|---|---|---|---|---|---|
| Zucchini, Carrot & Walnut Patties (`orn-45`) | Side · side, lunch | add **breakfast** | 155 g · 180 kcal · 7 g protein · 6.5 g fibre · 283 mg Na | weight-loss, diabetes-friendly, heart-healthy, soy-free, oil-free, no-added-sugar, batch-friendly, kid-friendly | Oven-baked, oil-free, savoury (flavour rule: savoury). Like a rösti/fritter breakfast with rye bread. **Best candidate.** **Applied 2026-10-29** (Fredrik approved): mealTypes breakfast, lunch, side; labels unchanged; flavourProfile savoury; pack 1.65.0. |
| Kidney Bean Stew (`kidney-bean-stew`) | Main · lunch, dinner | add **breakfast** | 398 g · 236 kcal · 16 g · 14 g · 540 mg | unchanged (all four health labels) | "Beans on toast". Make my week serves at least one full portion (it only adds portions), so breakfast would be the whole 400 g bowl; half a bowl on rye is more typical. Fine for a big weekend breakfast. |
| Black Bean Stew (`black-bean-stew`) | Main · lunch, dinner | add **breakfast** | 313 g · 224 kcal · 14 g · 14 g · 425 mg | unchanged (all four health labels) | Breakfast-burrito-style beans with rye or a tortilla; same caveat as above. |
| Tofu Form (`tofu-form`) | Main · lunch, dinner | add **breakfast** | 314 g · 299 kcal · 24 g · 4 g · 328 mg | unchanged | Sliced cold on rye like a savoury cold cut (pålegg). But the stored portion is a dinner piece, and the planner would serve all of it at breakfast. Weaker candidate. |
| Tomato Bruschetta (`fr-179`) | Spreads · snack, side | category Spreads → Breakfast, add **breakfast** | 75 g topping · 68 kcal | weight-loss only | Contains 68 g olive oil (not oil-free); with the oil left out it would be a good tomato topping on rye. Only worth it if you make it oil-free. |

Not proposed: Black Bean & Tomato Salad (`orn-14`), because the flavour rule would call it *sweet* (24 % of energy from the dates and tomato sugars), so it would land among the sweet breakfasts. Za'atar Hummus Plate, because at 779 mg sodium it is too salty for a breakfast (target ≤ 400 mg at Standard).

When approved: add `breakfast` to `mealTypes` (and the category change for fr-179), run `npm run label-recipes -- --recipe <ids> --write` and `node scripts/build_salt_levels.mjs --write` (sets `flavourProfile: "savoury"`), then bump the pack version.

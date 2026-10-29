# Recipe completion proposals

Generated 2026-10-29 by `scripts/build_recipe_proposals.mjs` from pack versions fredheim-recepies-with-pictures 1.63.0, fredheim-reversal-protocol 1.59.0, fredheim-fmd-5day 1.19.0. Applied with `scripts/apply_recipe_proposals.mjs`, which only accepts packs at exactly these versions. Machine-readable copy: `recipe-completion-proposals.json`.

## Summary

| Change type | Recipes |
|---|---|
| Nutrition recalculated from ingredients (missing, placeholder or implausible kcal) | 0 |
| Nutrition: single fields corrected (sodium / added sugar off, kcal fine) | 0 |
| Nutrition rescaled only (stored values fine, serving count changes) | 0 |
| Stored kcal confirmed by the ingredient estimate (within −20%/+25%) | 246 of 267 |
| Servings changed (whole batches, oversized portions) | 0 |
| Serving weight corrected, count kept | 43 |
| Prep/cook time proposed (missing) | 0 |
| Meal types proposed (field does not exist yet) | 267 |
| Recipes whose good-for labels change (any label; most only gain nut-free/soy-free/quick/batch/kid labels, which do not exist yet) | 0 |
| Recipes whose health labels change (WL/BP/DIA/HRT) | 0 |

Packs: Fredheim Kitchen 186, Reversal 65, FMD 16.

### Labels: existing vs proposed (recipe counts)

| Label | Code | Existing | Proposed | Added | Removed |
|---|---|---|---|---|---|
| weight-loss | WL | 132 | 132 | 0 | 0 |
| blood-pressure-friendly | BP | 88 | 88 | 0 | 0 |
| diabetes-friendly | DIA | 65 | 65 | 0 | 0 |
| heart-healthy | HRT | 98 | 98 | 0 | 0 |
| gluten-free | GF | 199 | 199 | 0 | 0 |
| nut-free | NUT0 | 171 | 171 | 0 | 0 |
| soy-free | SOY0 | 209 | 209 | 0 | 0 |
| oil-free | OIL0 | 189 | 189 | 0 | 0 |
| no-added-sugar | NAS | 220 | 220 | 0 | 0 |
| quick | Q | 59 | 59 | 0 | 0 |
| batch-friendly | BATCH | 179 | 179 | 0 | 0 |
| kid-friendly | KID | 97 | 97 | 0 | 0 |

### Biggest nutrition changes (kcal per serving)

| Recipe | Pack | Current | Proposed | Δ | Servings | Confidence |
|---|---|---|---|---|---|---|

Most of these are whole batches being split into real portions. The table below shows the stored values that are wrong at the *current* serving count (stored kcal vs the ingredient estimate):

| Recipe | Pack | Stored kcal/serving | Ingredients say | Off by | Confidence |
|---|---|---|---|---|---|

## Label criteria (for approval)

"Meal" = meal types include breakfast, lunch or dinner. "Other" = side, snack, dessert or component only. All values per serving unless stated. The four health labels are only proposed when the nutrition behind them is at medium or high confidence; otherwise the reason says "too uncertain". Health labels are computed from the proposed values where a change is proposed, else from the stored values.

- **weight-loss** (WL): Energy density ≤ 150 kcal/100 g (Rolls, "low energy density"). Meal: ≤ 500 kcal, fibre ≥ 3 g, sat. fat ≤ 3 g. Other: ≤ 200 kcal, sat. fat ≤ 2 g. Added sugar ≤ 2.5 g and no sugar/syrup/honey/juice/oat-drink ingredient. Needs a serving weight.
- **blood-pressure-friendly** (BP): Servings of 100 g or more: sodium ≤ 140 mg per 100 g (FDA "low sodium" meal level) and ≤ 600 mg per serving. Smaller servings: ≤ 140 mg per serving and ≤ 140 mg per 50 g (FDA "low sodium" rule for small portions). Potassium ≥ sodium (mg). Sat. fat ≤ 4 g (meal) / ≤ 2 g (other). Added sugar ≤ 2.5 g (DASH limits sweets). Sodium judged conservatively: the higher of the stored value and the ingredient estimate with ordinary (salted) canned beans and broth, unless the row itself says low-sodium/no-salt/rinsed.
- **diabetes-friendly** (DIA): Meal: carbohydrate ≤ 60 g, total sugars ≤ 20 g and ≤ 12.5 g/100 g, fibre ≥ 3 g. Other: carbohydrate ≤ 25 g, total sugars ≤ 10 g and ≤ 10 g/100 g, fibre ≥ 2 g. Always: oil-free (same rule as the oil-free label), fibre ≥ 10% of carbohydrate, sat. fat ≤ 3 g, added sugar ≤ 2.5 g, no sugar/syrup/honey/juice/oat-drink ingredient, starch base not refined (white flour, white-rice flour/noodles, glass noodles, regular lasagne sheets, degermed polenta, GF starch mixes, breadcrumbs).
- **heart-healthy** (HRT): No added oil (ingredient or method) and no coconut milk/cream/oil. Sat. fat ≤ 3 g (meal) / ≤ 2 g (other). Sodium ≤ 600 mg (meal) / ≤ 360 mg (other), same conservative sodium as above. Fibre ≥ 3 g (meal) / ≥ 1.5 g (other). Added sugar ≤ 2.5 g. Cholesterol 0 mg (all three packs are plant-based).
- **gluten-free** (GF): No wheat, spelt, rye, barley, bulgur, gluten flour, bread/crumbs/crispbread, regular lasagne sheets, barley coffee, rye sourdough starter or wheat soy sauce. Oats only if the row says gluten-free. Miso and bouillon pass with "use a GF-labelled product". Also must not trip the app's own gluten allergen check (src/data/allergens.js).
- **nut-free** (NUT0): No tree nuts or peanuts, incl. nut milks, nut butters and the pack's cashew sauces; must not trip the app's tree-nut/peanut check. Coconut is not counted as a tree nut (FDA, 2025) but is named in the reason.
- **soy-free** (SOY0): No tofu, soy drink/yogurt, soy sauce, tamari, miso, edamame or soy mayonnaise; an unspecified "plant milk"/"plant yogurt" fails (it is often soy). Must not trip the app's soy check.
- **oil-free** (OIL0): No oil of any kind in the ingredients (olive, rapeseed, sesame, coconut; also mayonnaise and commercial hummus) and no oil in the method text. Whole-food fats (nuts, seeds, tahini, avocado, olives) are allowed.
- **no-added-sugar** (NAS): No sugar, syrup, honey, sweetened dried fruit, ketchup, fruit juice (lemon/lime juice exempt) or oat drink (its enzymatic maltose counts as added): WHO "free sugars". Whole/dried fruit and dates (also blended or as date paste) are allowed and named in the reason. Erythritol (Sukrin) is allowed and named.
- **quick** (Q): Prep + cook ≤ 20 min (stored, or proposed here when missing) and no soaking, rising, chilling, setting, fermenting, sprouting or overnight step.
- **batch-friendly** (BATCH): Makes ≥ 4 servings and keeps ≥ 3 days chilled or freezes: soups, stews, bakes, burgers/patties/balls, breads, granola, porridges, spreads/dips (not avocado-based), cooked or nut-based sauces, jams, ferments. Not leafy or avocado salads, drinks, crisps.
- **kid-friendly** (KID): Judgement, low confidence. Never for the FMD pack (a fasting protocol). A meal, snack, side or dessert (not a component, not a salad other than fruit/potato salad), no chilli/cayenne/hot sauce/horseradish, and a familiar format: porridge, pancakes, waffles, oats, smoothies, bread/buns, burgers/balls/patties, lasagne/pizza, potatoes/fries/mash, smooth soups, hummus, jam, desserts. Whole nuts: choking risk under 5, named in the reason.

### Decisions (settled)

1. Dates and date paste do NOT count as added sugar: allowed under "no-added-sugar" (WHO definition); 44 recipes keep the label on dates.
2. Oat drink sugars (~4 g/100 ml, enzymatic maltose) DO count as added sugar: oat drink is a free-sugar ingredient for no-added-sugar, weight-loss and diabetes-friendly, and its sugars are added to addedSugar (stored panels corrected), which the heart and blood-pressure checks read.
3. Diabetes-friendly must also be oil-free.
4. Canned beans and broth stay as written; labels keep the conservative sodium assumption (ordinary salted products unless the row says otherwise).
5. Bread serving = 2 slices (sliced loaves); granola serving = 50 g. The planner scales the shopping list by servings, so a planned "serving" now buys 2 slices' worth.

### Method and confidence

- **estimate**: Independent per-recipe estimate from ingredient rows using scripts/data/food-composition-core.json (per 100 g, USDA FoodData Central/SR Legacy; EU label values for branded-type products). Spoon and piece weights from the dictionary spoonGrams or the table.
- **implausible**: kcal off by more than 25%/33% (ratio < 0.75 or > 1.33) and ≥ 30 kcal; or energy density > 900 kcal/100 g; or sodium off ≥ 300 mg and more than 2×; or added sugar off ≥ 5 g. Strained recipes (broths, nut/oat milks) are exempt.
- **proposedFields**: Core fields only for recalculations (calories, protein, totalFat, saturatedFat, totalCarbs, fiber, totalSugars, addedSugar, sodium, potassium). Rescaled recipes scale every stored field.
- **confidence**: high = stored values confirmed by the estimate, only the serving count changes; medium = recalculated from fully specified ingredients; low = brand/sub-recipe dependent, unquantified rows, frying fat not listed, or uncertain yield.

## 0. Ingredient fixes, and rows left alone


Oil in the method but not in the ingredients (not changed, by decision; the oil is not in the nutrition, and these recipes fail oil-free, heart-healthy and diabetes-friendly on the method text):

- with a stated amount: none
- mentioned without an amount: none
- method fries, no fat named: none

## 1. Nutrition proposals

Current → proposed per serving. kcal / protein / fat / sat. fat / carbs / fibre / sugars / added sugar / sodium. "est." is the ingredient-based estimate at the current serving count.

| Recipe | Pack | Status | Change | Current | Proposed | Serving g | Conf. | Why |
|---|---|---|---|---|---|---|---|---|

Kept as stored (strained or reduced, so a lower value than the ingredient sum is expected): The Perfect Homemade Oat Milk (`orn-8`), Fredheim Golden Vegetable Broth (`orn-12`), Umami Broth (`orn-23`), Quick Almond Milk (`orn-43`), Daily Vegetable Broth (`fmd-broth`).

## 2. Servings proposals

| Recipe | Pack | Servings | Portion | Serving g | Basis | Conf. |
|---|---|---|---|---|---|---|
| Aioli (`fr-1`) | Fredheim Kitchen | 17 → 17 | 15 g (1 tbsp) | 15 → 15 | 258 g batch; aioli portion 15 g (now 6 × 43 g at 213 kcal). | medium |
| Almond and Paprika Cheese (`fr-3`) | Fredheim Kitchen | 40 → 40 | 30 g | 30 → 30 | 1.25 kg cheese; 30 g portions (now 10 × 125 g). | medium |
| Blueberry Jam (`fr-18`) | Fredheim Kitchen | 18 → 18 | 20 g (1 tbsp) | 20 → 20 | 360 g batch; jam portion 20 g. | medium |
| Burger Dressing (`burger-dressing`) | Fredheim Kitchen | 32 → 32 | 30 g (2 tbsp) | 30 → 30 | 960 g batch; dressing portion 30 g (now 10 × 96 g). | medium |
| Caraway and Cashew Cheese (`caraway-and-cashew-cheese`) | Fredheim Kitchen | 44 → 44 | 30 g | 30 → 30 | 1.31 kg set cheese (1 l water + agar); 30 g portions (now 5 × 261 g). | medium |
| Cheezy Cashew Kale Chips (`fr-40`) | Fredheim Kitchen | 8 → 8 | ~40 g dried chips | 40 → 40 | 320 g kale + cashew coating (~1 kg wet) dehydrated → ~320 g; 40 g portions. Yield uncertain. | low |
| Citrus Dressing (`citrus-dressing`) | Fredheim Kitchen | 14 → 14 | 30 g (2 tbsp) | 30 → 30 | 434 g batch; dressing portion 30 g. | medium |
| Coconut Macaroon Balls (`fr-50`) | Fredheim Kitchen | 14 → 14 | 2 balls (~40 g) | 40 → 40 | ~560 g mixture rolled into ~28 balls of 20 g. | medium |
| Coconut Mozzarella (`fr-51`) | Fredheim Kitchen | 13 → 13 | 30 g | 30 → 30 | 407 g batch; cheese portion 30 g. | medium |
| Cranberry Jam (`fr-52`) | Fredheim Kitchen | 20 → 20 | 20 g (1 tbsp) | 20 → 20 | 418 g batch; jam portion 20 g. | medium |
| Croutons (`fr-53`) | Fredheim Kitchen | 4 → 4 | ~20 g croutons | 20 → 20 | 70 g bread + oil, baked; topping for 4 bowls. | medium |
| Cucumber and Sunflowerseed Dressing (`cucumber-and-sunflowerseed-dressing`) | Fredheim Kitchen | 50 → 50 | 30 g (2 tbsp) | 30 → 30 | 1.5 kg batch; dressing portion 30 g. | medium |
| Dried Fruit Jam (`fr-60`) | Fredheim Kitchen | 120 → 120 | 30 g (2 tbsp) | 30 → 30 | 3.6 kg incl. 2 l water (not cooked down, steps: 2–3 min); 30 g portions. | medium |
| Ellen's Granola (`ellens-granola`) | Fredheim Kitchen | 80 → 80 | 50 g | 50 → 50 | 5.4 kg raw incl. 0.75 l water and 0.75 kg apple, dehydrated 24 h → ~4.0 kg dry; 50 g portions. | medium |
| Erik's Granola (`fr-63`) | Fredheim Kitchen | 160 → 160 | 50 g | 50 → 50 | 10.1 kg raw incl. 1 l water and 1.4 kg banana, dried → ~8.1 kg; 50 g portions. | medium |
| Fermented Red Cabbage (`fermented-red-cabbage`) | Fredheim Kitchen | 50 → 50 | 50 g side | 50 → 50 | 2.56 kg ferment; 50 g as a side (now 10 × 256 g at 2.1 g sodium). | medium |
| Fig Spread (`fig-spread`) | Fredheim Kitchen | 29 → 29 | 30 g | 30 → 30 | 875 g batch; spread portion 30 g. | medium |
| Fresh Vegetable Bouillon (`fr-69`) | Fredheim Kitchen | 70 → 70 | 1 tbsp paste (~15 g) | 15 → 15 | 1.07 kg salt-vegetable paste; used by the spoon as stock base, not eaten as a dish. | medium |
| Hazelnut and Sundried Tomato Cheese (`hazelnut-and-sundried-tomato-cheese`) | Fredheim Kitchen | 38 → 38 | 30 g | 30 → 30 | 1.14 kg set cheese; 30 g portions. | medium |
| Homemade Whole Wheat Bread (`homemade-whole-wheat-bread`) | Fredheim Kitchen | 88 → 88 | 2 slices (~92 g baked) | 92 → 92 | 9.2 kg dough → ~8.0 kg baked (≈13% bake loss) in 11 loaves (steps: 800–900 g each); 16 slices a loaf, 2 slices a serving. | medium |
| Katrine´s Pesto Dressing (`katrines-pesto-dressing`) | Fredheim Kitchen | 15 → 15 | 30 g (2 tbsp) | 30 → 30 | 435 g batch; dressing portion 30 g. | medium |
| Ketchup (`fr-92`) | Fredheim Kitchen | 55 → 55 | 15 g (1 tbsp) | 15 → 15 | 830 g batch; ketchup portion 15 g. | medium |
| Peanut Ginger Dressing (`peanut-ginger-dressing`) | Fredheim Kitchen | 28 → 28 | 30 g (2 tbsp) | 30 → 30 | 840 g batch; dressing portion 30 g. | medium |
| Pickled Ginger (`pickled-ginger`) | Fredheim Kitchen | 22 → 22 | 20 g | 20 → 20 | 443 g batch; condiment portion 20 g. | medium |
| Plant Based Butter (`plant-based-butter`) | Fredheim Kitchen | 13 → 13 | 10 g (2 tsp) | 10 → 10 | 131 g batch; spread like butter, 10 g. | medium |
| Potato Salad (`potato-salad`) | Fredheim Kitchen | 15 → 15 | ~240 g | 240 → 240 | Count kept; serving weight corrected to the batch (3.59 kg / 15). | medium |
| Pumpkinseed and Basil Cheese (`fr-130`) | Fredheim Kitchen | 40 → 40 | 30 g | 30 → 30 | 1.26 kg set cheese (1 l water + agar); 30 g portions. | medium |
| Raspberry Jam (`fr-134`) | Fredheim Kitchen | 16 → 16 | 20 g (1 tbsp) | 20 → 20 | 320 g batch; jam portion 20 g. | medium |
| Raw Cheesecake (`raw-cheesecake`) | Fredheim Kitchen | 16 → 16 | 1 slice (~100 g) | 100 → 100 | 1.63 kg cake; 16 slices (now 10 × 163 g at ~630 kcal). | medium |
| Red Beet Spread (`fr-136`) | Fredheim Kitchen | 6 → 6 | 30 g | 30 → 30 | 192 g batch; spread portion 30 g. | medium |
| Russian Penicillin (`fr-149`) | Fredheim Kitchen | 3 → 3 | ~200 ml shot/drink | 210 → 210 | 635 g blended citrus-ginger tonic; ~200 ml a glass. | medium |
| Soy Mayonnaise (`fr-156`) | Fredheim Kitchen | 22 → 22 | 15 g (1 tbsp) | 15 → 15 | 330 g batch; mayonnaise portion 15 g. | medium |
| Soy Mozzarella (`soy-mozzarella`) | Fredheim Kitchen | 23 → 23 | 30 g | 30 → 30 | 687 g batch; 30 g portions. | medium |
| Tom's Gluten Free Bread (`toms-gluten-free-bread`) | Fredheim Kitchen | 24 → 24 | 2 slices (~110 g baked) | 110 → 110 | 3.0 kg dough → ~2.6 kg baked in two 1.5 l tins; 24 slices a loaf, 2 slices a serving. | medium |
| Tomato Bruschetta (`fr-179`) | Fredheim Kitchen | 12 → 12 | 75 g (topping for 2 slices) | 75 → 75 | 901 g topping; 75 g each. | medium |
| Turmeric and Cashew Cheese (`fr-183`) | Fredheim Kitchen | 40 → 40 | 30 g | 30 → 30 | 1.28 kg set cheese; 30 g portions. | medium |
| Walnut Basil Dressing (`fr-187`) | Fredheim Kitchen | 12 → 12 | 30 g (2 tbsp) | 30 → 30 | 352 g batch; dressing portion 30 g. | medium |
| Fredheim Plant-Based Cream Cheese (`fredheim-deluxe-plant-based-cream-cheese`) | Fredheim Kitchen | 65 → 65 | 30 g | 30 → 30 | 1.97 kg batch; 30 g portions (now 16 × 124 g at 373 kcal). | medium |
| Fluffy Gluten-Free Loaf (`fluffy-gluten-free-loaf`) | Fredheim Kitchen | 6 → 6 | 2 slices (~134 g) | 134 → 134 | 12 slices (description); 2 slices a serving. | medium |
| Metabolic Support Drink (`orn-29`) | Reversal | 1 → 1 | 1 glass (5.9 g powder + 220 ml water) | 226 → 226 | Count kept; the stored 5.9 g is the dry powder only, so per-100 g and energy density read as if it were eaten dry. | medium |
| Rye Sourdough (`orn-38`) | Reversal | 8 → 8 | 2 slices (~116 g) | 116 → 116 | 16 slices of 58 g; 2 slices a serving. | medium |
| Wholegrain Rye Loaf (`orn-39`) | Reversal | 8 → 8 | 2 slices (~116 g) | 116 → 116 | 16 slices of 58 g; 2 slices a serving. | medium |
| Gluten-Free Oat & Potato Loaf (`orn-66`) | Reversal | 6 → 6 | 2 slices (~214 g) | 214 → 214 | 12 slices (description); 2 slices a serving. | medium |

Per-serving nutrition after the change is in section 1 (rescaled or recalculated).

## 3. Time proposals (minutes)

Only recipes where prep or cook time is missing (null, or both 0). The app stores waiting time (soaking, rising, setting) inside cookTime, as the newer recipes do.

| Recipe | Pack | Current prep/cook | Proposed prep/cook | Evidence | Conf. |
|---|---|---|---|---|---|

## 4. Meal types (all recipes)

| Recipe | Pack | Category | Meal types | Basis |
|---|---|---|---|---|
| Aioli (`fr-1`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Almond Tartar (`fr-2`) | Fredheim Kitchen | Spreads | component, lunch | per-recipe judgement |
| Almond and Paprika Cheese (`fr-3`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| American Oat Pancakes (`american-oat-pancakes`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Apple Oat Bake (`apple-oat-bake`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Asian Noodle Salad (`asian-noodle-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Avocado Cream (`fr-7`) | Fredheim Kitchen | Sauce | component | per-recipe judgement |
| Baba Ghanoush - Aubergine Dip (`baba-ghanoush---aubergine-dip`) | Fredheim Kitchen | Spreads | component, snack | per-recipe judgement |
| Baked Roots (`baked-roots`) | Fredheim Kitchen | Side | side | category Side |
| Baked Sweet Potato (`baked-sweet-potato`) | Fredheim Kitchen | Side | side | category Side |
| Barley Cup Drink (`fr-12`) | Fredheim Kitchen | Drink | snack | per-recipe judgement |
| Bean Pâté (`bean-pate`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Bean Spread (`bean-spread`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Berry Sauce (`berry-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Black Bean Stew (`black-bean-stew`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Blissful Sprout Medley (`fr-17`) | Fredheim Kitchen | Salad | side | light salad |
| Blueberry Jam (`fr-18`) | Fredheim Kitchen | Jam | component | category Jam (used with other dishes) |
| Bread Buns (`fr-19`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Broccoli Salad (`broccoli-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Broccoli Soup (`broccoli-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Brown Sauce (`brown-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Buckwheat Burger (`fr-23`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Bulgur Salad (`bulgur-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Burger Buns (`burger-buns`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Burger Dressing (`burger-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cabbage Soup (`fr-27`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Caesar Salad (`fr-28`) | Fredheim Kitchen | Salad | side | light salad |
| Caraway and Cashew Cheese (`caraway-and-cashew-cheese`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Cashew Sour Cream (`fr-33`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cashew Vanilla Cream (`fr-34`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Cashew Bechamel Sauce (`cashew-bechamel-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cashew Cheese Sauce (`cashew-cheese-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cauliflower Soup (`cauliflower-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Cheese Sauce for Onion Pie (`fr-38`) | Fredheim Kitchen | Sauce | component | per-recipe judgement |
| Cheesy Cauliflower Sauce (`cheesy-cauliflower-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cheezy Cashew Kale Chips (`fr-40`) | Fredheim Kitchen | Snack | snack | category Snack |
| Chickpea Omelet (`fr-41`) | Fredheim Kitchen | Breakfast | breakfast, lunch | per-recipe judgement |
| Chickpea Salad (`fr-42`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Chickpea Tofu (`chickpea-tofu`) | Fredheim Kitchen | Other | component | per-recipe judgement |
| Chinese Cabbage Salad (`fr-44`) | Fredheim Kitchen | Salad | side | light salad |
| Chinese Soup (`chinese-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Breaded Tofu Sticks (`breaded-tofu-sticks`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Candy Rolls (`fr-29`) | Fredheim Kitchen | Dessert | dessert, snack | per-recipe judgement |
| Caramelized Nuts (`caramelized-nuts`) | Fredheim Kitchen | Snack | snack | per-recipe judgement |
| Carob spread (hazelnut) (`carob-spread`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Carob spread (almond) (`carob-spread-almond`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Chipotle Sauce (`chipotle-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Chorizo with Potato Taco (`chorizo-with-potato-taco`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Citrus Dressing (`citrus-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Classic Greek Salad (`fr-49`) | Fredheim Kitchen | Salad | side | light salad |
| Coconut Macaroon Balls (`fr-50`) | Fredheim Kitchen | Dessert | dessert, snack | per-recipe judgement |
| Coconut Mozzarella (`fr-51`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Cranberry Jam (`fr-52`) | Fredheim Kitchen | Jam | component | category Jam (used with other dishes) |
| Croutons (`fr-53`) | Fredheim Kitchen | Other | component | per-recipe judgement |
| Crunchy Carrot Salad (`crunchy-carrot-salad`) | Fredheim Kitchen | Salad | side | light salad |
| Crunchy Sweet Cabbage Salad (`crunchy-sweet-cabbage-salad`) | Fredheim Kitchen | Salad | side | light salad |
| Cucumber Dressing (`fr-56`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cucumber Raita (`fr-57`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Cucumber and Sunflowerseed Dressing (`cucumber-and-sunflowerseed-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Dal Stew (`dal-stew`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Dried Fruit Jam (`fr-60`) | Fredheim Kitchen | Jam | component | category Jam (used with other dishes) |
| Easy Colombian Salad (`easy-colombian-salad`) | Fredheim Kitchen | Salad | side | light salad |
| Ellen's Granola (`ellens-granola`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Erik's Granola (`fr-63`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Falafel (`fr-64`) | Fredheim Kitchen | Main | lunch, dinner | per-recipe judgement |
| Feld Salad with Pomegranate (`feld-salad-with-pomegranate`) | Fredheim Kitchen | Salad | side | light salad |
| Fermented Red Cabbage (`fermented-red-cabbage`) | Fredheim Kitchen | Other | side | per-recipe judgement |
| Fig Spread (`fig-spread`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Fresh Vegetable Bouillon (`fr-69`) | Fredheim Kitchen | Other | component | per-recipe judgement |
| Frittata (`fr-70`) | Fredheim Kitchen | Main | breakfast, lunch, dinner | per-recipe judgement |
| Fruit Crisp (`fruit-crisp`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Fruit Salad (`fruit-salad`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Garlic and Cashew Cheese (`fr-74`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Gluten Free Oat Buns (`gluten-free-oat-buns`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Golden Soup (`golden-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Green Beans (`fr-77`) | Fredheim Kitchen | Side | side | category Side |
| Guacamole (`fr-78`) | Fredheim Kitchen | Spreads | component, snack | per-recipe judgement |
| Happy Beans Salad (`happy-beans-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Hasselback Potatoes (`hasselback-potatoes`) | Fredheim Kitchen | Side | side | category Side |
| Hazelnut and Sundried Tomato Cheese (`hazelnut-and-sundried-tomato-cheese`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Homemade Whole Wheat Bread (`homemade-whole-wheat-bread`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Horseradish Dressing (`horseradish-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Hummus (`fr-84`) | Fredheim Kitchen | Spreads | component, snack | per-recipe judgement |
| Isabel´s Dressing (`isabels-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Kale and Sweet Potato Salad (`kale-and-sweet-potato-salad`) | Fredheim Kitchen | Salad | side | light salad |
| Kale Avocado (`kale-avocado`) | Fredheim Kitchen | Salad | side | light salad |
| Kale Chips (`kale-chips`) | Fredheim Kitchen | Snack | snack | category Snack |
| Kale Soup (`kale-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Katrine´s Pesto Dressing (`katrines-pesto-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Ketchup (`fr-92`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Kidney Bean Stew (`kidney-bean-stew`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Lasagna (`fr-94`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Lemon and Olive Oil Dressing (`lemon-and-olive-oil-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Lentil Lap Stew (`lentil-lap-stew`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Lightly Cooked Broccoli (`lightly-cooked-broccoli`) | Fredheim Kitchen | Side | side | category Side |
| Luke's Indian Chickpea Sauce (`fr-99`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Marika's Tofu Balls (`fr-101`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Marika's Summer Salad (`marikas-summer-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Marinated Tofu Sticks (`marinated-tofu-sticks`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Mashed Potatoes (`fr-104`) | Fredheim Kitchen | Side | side | category Side |
| Mediterranean Soup (`mediterranean-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Millet Crackers, Hirseknekk (`millet-crackers-hirseknekk`) | Fredheim Kitchen | Bread | snack, lunch | per-recipe judgement |
| Noodle Wok (`noodle-wok`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Nordic Sprout Salad (`nordic-sprout-salad`) | Fredheim Kitchen | Salad | side | light salad |
| Nutloaf (`fr-111`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Oat Burger (`oat-burger`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Onion Pie Crust (`fr-113`) | Fredheim Kitchen | Bread | component | per-recipe judgement |
| Onion Pie Filling (`fr-114`) | Fredheim Kitchen | Main | component | per-recipe judgement |
| Parmesan (`fr-115`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Peanut Ginger Dressing (`peanut-ginger-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Pickled Ginger (`pickled-ginger`) | Fredheim Kitchen | Other | component | per-recipe judgement |
| Pineapple Cream (`pineapple-cream`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Pizza Crust Dough (`fr-119`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Plant Based Butter (`plant-based-butter`) | Fredheim Kitchen | Other | component | per-recipe judgement |
| Polenta (`fr-123`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Pomodoro Sauce (`pomodoro-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Potato and Spinach Soup (`potato-and-spinach-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Potato Gratin (`potato-gratin`) | Fredheim Kitchen | Side | side | category Side |
| Potato Salad (`potato-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Pumpkin Soup (`pumpkin-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Pumpkinseed and Basil Cheese (`fr-130`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Quinoa Salad First (`quinoa-salad-first`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Quinoa Salad Second (`quinoa-salad-second`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Ranch Dressing (`ranch-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Raspberry Jam (`fr-134`) | Fredheim Kitchen | Jam | component | category Jam (used with other dishes) |
| Raw Cheesecake (`raw-cheesecake`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Red Beet Spread (`fr-136`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Red Cabbage Salad (`fr-137`) | Fredheim Kitchen | Salad | side | light salad |
| Red Beet Salad (`red-beet-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Red Beet Burger (`red-beet-burger`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Red Lentil Soup (`red-lentil-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Rice Porridge (`rice-porridge`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Roasted Cauliflower (`fr-142`) | Fredheim Kitchen | Side | side | category Side |
| Roasted Pepper Seitan Sausages (`fr-143`) | Fredheim Kitchen | Main | lunch, dinner | per-recipe judgement |
| Roasted Sweet Potato and Arugula Salad (`fr-144`) | Fredheim Kitchen | Salad | side | light salad |
| Roasted Brussels Sprouts (`roasted-brussels-sprouts`) | Fredheim Kitchen | Side | side | category Side |
| Roasted Salad (`roasted-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Russian Penicillin (`fr-149`) | Fredheim Kitchen | Soup | snack | per-recipe judgement |
| Salsa (`fr-150`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Scrambled Tofu (`scrambled-tofu`) | Fredheim Kitchen | Breakfast | breakfast, lunch | per-recipe judgement |
| Seasoned Baked Potatoes (`seasoned-baked-potatoes`) | Fredheim Kitchen | Side | side | category Side |
| Simple Baked Potatoes (`simple-baked-potatoes`) | Fredheim Kitchen | Side | side | category Side |
| Sorbet (`fr-155`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Soy Mayonnaise (`fr-156`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Soy Mozzarella (`soy-mozzarella`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Soy Salami (`soy-salami`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Soy Yogurt Dressing (`soy-yogurt-dressing`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Steamed Small Potatoes (`steamed-small-potatoes`) | Fredheim Kitchen | Side | side | category Side |
| Stine Gro´s Waffles (`stine-gros-waffles`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Strawberry Jam (`fr-163`) | Fredheim Kitchen | Jam | component | category Jam (used with other dishes) |
| Stuffed Paprika with Tofu (`stuffed-paprika-with-tofu`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Swedish Oven Pancake (`swedish-oven-pancake`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Sweet Potato Muffins (`sweet-potato-muffins`) | Fredheim Kitchen | Dessert | dessert, snack | per-recipe judgement |
| Sweet Potato Soup (`sweet-potato-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Sweet Vinaigrette (`sweet-vinaigrette`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Sweet Yellow Pea Soup (`sweet-yellow-pea-soup`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Thai Soup (`fr-172`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Tofu Feta Cheese (`fr-173`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Tofu Cottage Cheese (`tofu-cottage-cheese`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Tofu Form (`tofu-form`) | Fredheim Kitchen | Main | lunch, dinner | per-recipe judgement |
| Tom's Gluten Free Bread (`toms-gluten-free-bread`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Tomato Bruschetta (`fr-179`) | Fredheim Kitchen | Spreads | snack, side | per-recipe judgement |
| Tomato Sauce for Pizza (`fr-180`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Tomato Soup (`fr-181`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Tomato Bean Salad (`tomato-bean-salad`) | Fredheim Kitchen | Salad | lunch, dinner, side | salad with a starch/protein base |
| Turmeric and Cashew Cheese (`fr-183`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Ukrainian Borscht Soup (`fr-184`) | Fredheim Kitchen | Soup | lunch, dinner | category Soup |
| Vanilla Sauce (`fr-185`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Vegetable Pie (`vegetable-pie`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Walnut Basil Dressing (`fr-187`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| White Cabbage Coleslaw (`fr-190`) | Fredheim Kitchen | Salad | side | light salad |
| White Cashew Sauce (`fr-191`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Fredheim Plant-Based Cream Cheese (`fredheim-deluxe-plant-based-cream-cheese`) | Fredheim Kitchen | Spreads | component | category Spreads (used with other dishes) |
| Creamy Red Lentil Stew (`creamy-red-lentil-stew`) | Fredheim Kitchen | Main | lunch, dinner | category Main |
| Fluffy Gluten-Free Bread (`ultimate-fluffy-vegan-gluten-free-bread`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Roasted Red Pepper Hummus (`roasted-red-pepper-hummus`) | Fredheim Kitchen | Spreads | component, snack | per-recipe judgement |
| Ginger Pear Overnight Oats with Cashew Milk (`ginger-pear-overnight-oats`) | Fredheim Kitchen | Breakfast | breakfast | category Breakfast |
| Squash Cake (Courgette & Walnut) (`squash-cake`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Vegan Tzatziki Sauce (`vegan-tzatziki-sauce`) | Fredheim Kitchen | Sauce | component | category Sauce (used with other dishes) |
| Quick Lemon-Pickled Onions (`quick-lemon-pickled-onions`) | Fredheim Kitchen | Side | side | category Side |
| Lemony Chickpea Hummus (`lemony-chickpea-hummus`) | Fredheim Kitchen | Spreads | component, snack | per-recipe judgement |
| Carob & Black Bean Mousse (`carob-black-bean-mousse`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Lime Cheesecake (Raw) (`lime-cheesecake`) | Fredheim Kitchen | Dessert | dessert | category Dessert |
| Classic Hummus (`classic-hummus`) | Fredheim Kitchen | Spreads | component, snack | per-recipe judgement |
| Za'atar Hummus Plate with Tomato Salad (`zaatar-hummus-salad`) | Fredheim Kitchen | Lunch | lunch, dinner | per-recipe judgement |
| Fluffy Gluten-Free Loaf (`fluffy-gluten-free-loaf`) | Fredheim Kitchen | Bread | breakfast, lunch, side | category Bread |
| Crispy Oat Waffles (`orn-1`) | Reversal | Breakfast | breakfast | category Breakfast |
| Creamy White Bean, Lemon-Dill & Date Dressing (`orn-2`) | Reversal | Sauce | component | category Sauce (used with other dishes) |
| Black Mustard & Date Honey Mustard Dressing (`orn-3`) | Reversal | Sauce | component | category Sauce (used with other dishes) |
| Kebab Dressing (`orn-4`) | Reversal | Sauce | component | category Sauce (used with other dishes) |
| Fudgy Carob & Date Brownies (`orn-5`) | Reversal | Dessert | dessert | category Dessert |
| Carob & White Bean Protein Shake (`orn-6`) | Reversal | Breakfast | breakfast, snack | per-recipe judgement |
| Forest Berry & White Bean Protein Smoothie (`orn-7`) | Reversal | Drink | breakfast, snack | per-recipe judgement |
| The Perfect Homemade Oat Milk (`orn-8`) | Reversal | Drink | component | per-recipe judgement |
| Tropical Mango, Date & White Bean Smoothie Bowl (`orn-9`) | Reversal | Breakfast | breakfast | category Breakfast |
| Warm Buckwheat Porridge with Dates, Carob & Cinnamon (`orn-10`) | Reversal | Breakfast | breakfast | category Breakfast |
| Miso Red Lentil & Sweet Potato Soup (`orn-11`) | Reversal | Soup | lunch, dinner | category Soup |
| Fredheim Golden Vegetable Broth (`orn-12`) | Reversal | Soup | component | per-recipe judgement |
| Sweet Almond Milk Chia Pudding with Mango (`orn-13`) | Reversal | Breakfast | breakfast | category Breakfast |
| Black Bean & Tomato Salad (`orn-14`) | Reversal | Salad | lunch, dinner, side | salad with a starch/protein base |
| Barley Coffee Evening Latte (`orn-15`) | Reversal | Drink | snack | per-recipe judgement |
| Red Cabbage & Edamame Salad with Sweet-Sour-Savory Dressing (`orn-16`) | Reversal | Salad | lunch, dinner, side | salad with a starch/protein base |
| Gluten-Free Oat & Potato Bread Rolls (`orn-17`) | Reversal | Bread | breakfast, lunch, side | category Bread |
| Carob Dream Overnight Oats (`orn-18`) | Reversal | Breakfast | breakfast | category Breakfast |
| Tropical Psyllium Pudding (`orn-19`) | Reversal | Breakfast | breakfast | category Breakfast |
| Walnut Patties (Oven-Baked) (`orn-20`) | Reversal | Main | lunch, dinner | category Main |
| Sautéed Red Cabbage with Lemon & Dates (`orn-21`) | Reversal | Side | side | category Side |
| Umami Broth (`orn-23`) | Reversal | Soup | component | per-recipe judgement |
| Sweet Almond Milk Chia Pudding with Pineapple (`orn-24`) | Reversal | Breakfast | breakfast | category Breakfast |
| Sweet Almond Milk Chia Pudding with Forest Berries (`orn-25`) | Reversal | Breakfast | breakfast | category Breakfast |
| Sweet Almond Milk Chia Pudding with Blueberries (`orn-26`) | Reversal | Breakfast | breakfast | category Breakfast |
| Sweet Almond Milk Chia Pudding with Raspberries (`orn-27`) | Reversal | Breakfast | breakfast | category Breakfast |
| Sweet Almond Milk Chia Pudding with Strawberries (`orn-28`) | Reversal | Breakfast | breakfast | category Breakfast |
| Metabolic Support Drink (`orn-29`) | Reversal | Drink | snack | per-recipe judgement |
| Ciorbă de Fasole with Lemon-Pickled Red Onion — Stovetop (`orn-30`) | Reversal | Soup | lunch, dinner | category Soup |
| Ciorbă de Fasole with Lemon-Pickled Red Onion — Instant Pot, No Soak (`orn-31`) | Reversal | Soup | lunch, dinner | category Soup |
| Calcium Boost Salad (`orn-32`) | Reversal | Salad | lunch, dinner, side | salad with a starch/protein base |
| Vanilla-Carob Psyllium Pudding with Blueberries (Water-Based) (`orn-33`) | Reversal | Dessert | dessert, breakfast | per-recipe judgement |
| Vanilla-Carob Psyllium Pudding with Blueberries (`orn-34`) | Reversal | Dessert | dessert, breakfast | per-recipe judgement |
| Golden Corn Soup (Silky-Chewy Curry Version) (`orn-35`) | Reversal | Soup | lunch, dinner | category Soup |
| Tahini-Almond Berry Chia Pudding (`orn-36`) | Reversal | Breakfast | breakfast | category Breakfast |
| Rye Sourdough Starter — How to Build One From Scratch (`orn-37`) | Reversal | Bread | component | per-recipe judgement |
| Rye Sourdough (`orn-38`) | Reversal | Bread | breakfast, lunch, side | category Bread |
| Wholegrain Rye Loaf (`orn-39`) | Reversal | Bread | breakfast, lunch, side | category Bread |
| Broccoli Salad with Toasted Walnuts and White Bean Dressing (`orn-40`) | Reversal | Salad | lunch, dinner, side | salad with a starch/protein base |
| Fredrik's Toasted Buckwheat & Date Granola (`orn-41`) | Reversal | Breakfast | breakfast | category Breakfast |
| Zucchini & Walnut Cake (GREEN) (`orn-42`) | Reversal | Dessert | dessert | category Dessert |
| Quick Almond Milk (`orn-43`) | Reversal | Drink | component | per-recipe judgement |
| Deep Prune Jam (`orn-44`) | Reversal | Jam | component | category Jam (used with other dishes) |
| Zucchini, Carrot & Walnut Patties (`orn-45`) | Reversal | Side | side, lunch | per-recipe judgement |
| Sour & Savory White Bean Hummus (`orn-46`) | Reversal | Spreads | component, snack | per-recipe judgement |
| Sweet & Sour Cherry Jam (`orn-47`) | Reversal | Jam | component | category Jam (used with other dishes) |
| Zucchini & Walnut Cake, Gluten-Free (GREEN) (`orn-48`) | Reversal | Dessert | dessert | category Dessert |
| Oat Porridge (Stovetop) (`orn-49`) | Reversal | Breakfast | breakfast | category Breakfast |
| Oat Porridge (Instant Pot) (`orn-50`) | Reversal | Breakfast | breakfast | category Breakfast |
| Buckwheat Porridge (Stovetop) (`orn-51`) | Reversal | Breakfast | breakfast | category Breakfast |
| Buckwheat Porridge (Instant Pot) (`orn-52`) | Reversal | Breakfast | breakfast | category Breakfast |
| Quinoa Porridge (Stovetop) (`orn-53`) | Reversal | Breakfast | breakfast | category Breakfast |
| Quinoa Porridge (Instant Pot) (`orn-54`) | Reversal | Breakfast | breakfast | category Breakfast |
| Millet Porridge (Stovetop) (`orn-55`) | Reversal | Breakfast | breakfast | category Breakfast |
| Millet Porridge (Instant Pot) (`orn-56`) | Reversal | Breakfast | breakfast | category Breakfast |
| Sweet Tahini Sauce for Porridge (`orn-57`) | Reversal | Sauce | component | category Sauce (used with other dishes) |
| Spring Pea Soup (`orn-58`) | Reversal | Soup | lunch, dinner | category Soup |
| Creamy Cashew Kebab Sauce (`orn-59`) | Reversal | Sauce | component | category Sauce (used with other dishes) |
| Cashew Yogurt (`orn-60`) | Reversal | Breakfast | breakfast, snack | per-recipe judgement |
| Chickpea Fries (Baked, No Oil) (`orn-61`) | Reversal | Side | side, snack | per-recipe judgement |
| Golden No-Chicken Soup (`orn-62`) | Reversal | Soup | lunch, dinner | category Soup |
| Warm Carob Drink with Almond Milk (`orn-63`) | Reversal | Drink | snack, dessert | per-recipe judgement |
| Blueberry Breakfast Pie (`orn-64`) | Reversal | Breakfast | breakfast, dessert | per-recipe judgement |
| Cinnamon-Date Applesauce (`orn-65`) | Reversal | Dessert | dessert, snack | per-recipe judgement |
| Gluten-Free Oat & Potato Loaf (`orn-66`) | Reversal | Bread | breakfast, lunch, side | category Bread |
| Daily Vegetable Broth (`fmd-broth`) | FMD | Soup | component | per-recipe judgement |
| Walnut, Olive & Avocado Plate with Flaxseed (`fmd-d1-breakfast`) | FMD | Breakfast | breakfast | category Breakfast |
| Avocado & Roasted Sweet Potato Salad (`fmd-d1-lunch`) | FMD | Salad | lunch, dinner, side | salad with a starch/protein base |
| White Bean & Vegetable Minestrone (`fmd-d1-dinner`) | FMD | Soup | lunch, dinner | category Soup |
| Almond, Olive & Avocado Plate with Berries (`fmd-d2-breakfast`) | FMD | Breakfast | breakfast | category Breakfast |
| Roasted Pumpkin Soup with Avocado (`fmd-d2-lunch`) | FMD | Soup | lunch, dinner | category Soup |
| Steamed Broccoli & Spinach Bowl with Avocado (`fmd-d2-dinner`) | FMD | Main | lunch, dinner | category Main |
| Warm Chia Pudding with Stewed Berries (`fmd-d3-breakfast`) | FMD | Breakfast | breakfast | category Breakfast |
| Red Lentil & Tomato Soup (`fmd-d3-lunch`) | FMD | Soup | lunch, dinner | category Soup |
| Roasted Root Vegetables with Steamed Kale & Walnuts (`fmd-d3-dinner`) | FMD | Main | lunch, dinner | category Main |
| Warm Stewed Apple with Walnuts & Flaxseed (`fmd-d4-breakfast`) | FMD | Breakfast | breakfast | category Breakfast |
| Courgette & Cauliflower Soup with Avocado (`fmd-d4-lunch`) | FMD | Soup | lunch, dinner | category Soup |
| Quinoa-Stuffed Roasted Pepper with Steamed Spinach (`fmd-d4-dinner`) | FMD | Main | lunch, dinner | category Main |
| Overnight Oats with Almond Butter & Berries (`fmd-d5-breakfast`) | FMD | Breakfast | breakfast | category Breakfast |
| Roasted Tomato & Fennel Soup with Avocado (`fmd-d5-lunch`) | FMD | Soup | lunch, dinner | category Soup |
| Celebration Green Bowl with Avocado (`fmd-d5-dinner`) | FMD | Salad | lunch, dinner, side | salad with a starch/protein base |

## 5. Good-for labels (all recipes)

Codes: WL = weight-loss, BP = blood-pressure-friendly, DIA = diabetes-friendly, HRT = heart-healthy, GF = gluten-free, NUT0 = nut-free, SOY0 = soy-free, OIL0 = oil-free, NAS = no-added-sugar, Q = quick, BATCH = batch-friendly, KID = kid-friendly. One line per added (+) or removed (−) label with its reason; unchanged labels are listed without reasons (all reasons are in the JSON). Other tags (vegan, ornish-green, …) are not touched.

### Fredheim Kitchen

**Aioli** (`fr-1`): existing GF NUT0 NAS Q BATCH → proposed GF NUT0 NAS Q BATCH

**Almond Tartar** (`fr-2`): existing GF SOY0 NAS BATCH → proposed GF SOY0 NAS BATCH

**Almond and Paprika Cheese** (`fr-3`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**American Oat Pancakes** (`american-oat-pancakes`): existing NUT0 NAS Q BATCH KID → proposed NUT0 NAS Q BATCH KID

**Apple Oat Bake** (`apple-oat-bake`): existing NUT0 OIL0 NAS BATCH KID → proposed NUT0 OIL0 NAS BATCH KID

**Asian Noodle Salad** (`asian-noodle-salad`): existing — → proposed —

**Avocado Cream** (`fr-7`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Baba Ghanoush - Aubergine Dip** (`baba-ghanoush---aubergine-dip`): existing WL BP GF NUT0 NAS BATCH → proposed WL BP GF NUT0 NAS BATCH

**Baked Roots** (`baked-roots`): existing GF NUT0 SOY0 NAS BATCH → proposed GF NUT0 SOY0 NAS BATCH

**Baked Sweet Potato** (`baked-sweet-potato`): existing WL BP GF NUT0 SOY0 NAS KID → proposed WL BP GF NUT0 SOY0 NAS KID

**Barley Cup Drink** (`fr-12`): existing WL BP NUT0 OIL0 NAS Q → proposed WL BP NUT0 OIL0 NAS Q

**Bean Pâté** (`bean-pate`): existing WL DIA HRT SOY0 OIL0 NAS Q BATCH → proposed WL DIA HRT SOY0 OIL0 NAS Q BATCH

**Bean Spread** (`bean-spread`): existing DIA HRT GF SOY0 OIL0 NAS Q BATCH → proposed DIA HRT GF SOY0 OIL0 NAS Q BATCH

**Berry Sauce** (`berry-sauce`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Black Bean Stew** (`black-bean-stew`): existing WL GF NUT0 SOY0 NAS BATCH → proposed WL GF NUT0 SOY0 NAS BATCH

**Blissful Sprout Medley** (`fr-17`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Blueberry Jam** (`fr-18`): existing WL BP GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP GF NUT0 SOY0 OIL0 NAS BATCH

**Bread Buns** (`fr-19`): existing NUT0 SOY0 BATCH KID → proposed NUT0 SOY0 BATCH KID

**Broccoli Salad** (`broccoli-salad`): existing WL GF NAS → proposed WL GF NAS

**Broccoli Soup** (`broccoli-soup`): existing GF SOY0 NAS BATCH KID → proposed GF SOY0 NAS BATCH KID

**Brown Sauce** (`brown-sauce`): existing NUT0 OIL0 NAS → proposed NUT0 OIL0 NAS

**Buckwheat Burger** (`fr-23`): existing DIA GF SOY0 OIL0 NAS BATCH KID → proposed DIA GF SOY0 OIL0 NAS BATCH KID

**Bulgur Salad** (`bulgur-salad`): existing NUT0 SOY0 BATCH → proposed NUT0 SOY0 BATCH

**Burger Buns** (`burger-buns`): existing NUT0 SOY0 BATCH KID → proposed NUT0 SOY0 BATCH KID

**Burger Dressing** (`burger-dressing`): existing GF SOY0 Q BATCH → proposed GF SOY0 Q BATCH

**Cabbage Soup** (`fr-27`): existing WL GF NUT0 SOY0 NAS BATCH → proposed WL GF NUT0 SOY0 NAS BATCH

**Caesar Salad** (`fr-28`): existing WL NUT0 SOY0 NAS → proposed WL NUT0 SOY0 NAS

**Caraway and Cashew Cheese** (`caraway-and-cashew-cheese`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Cashew Sour Cream** (`fr-33`): existing BP GF SOY0 OIL0 NAS Q BATCH → proposed BP GF SOY0 OIL0 NAS Q BATCH

**Cashew Vanilla Cream** (`fr-34`): existing GF SOY0 OIL0 Q BATCH KID → proposed GF SOY0 OIL0 Q BATCH KID

**Cashew Bechamel Sauce** (`cashew-bechamel-sauce`): existing GF SOY0 NAS BATCH → proposed GF SOY0 NAS BATCH

**Cashew Cheese Sauce** (`cashew-cheese-sauce`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Cauliflower Soup** (`cauliflower-soup`): existing WL DIA GF SOY0 OIL0 NAS Q BATCH KID → proposed WL DIA GF SOY0 OIL0 NAS Q BATCH KID

**Cheese Sauce for Onion Pie** (`fr-38`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Cheesy Cauliflower Sauce** (`cheesy-cauliflower-sauce`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Cheezy Cashew Kale Chips** (`fr-40`): existing DIA HRT GF OIL0 NAS → proposed DIA HRT GF OIL0 NAS

**Chickpea Omelet** (`fr-41`): existing NUT0 NAS → proposed NUT0 NAS

**Chickpea Salad** (`fr-42`): existing WL DIA GF SOY0 OIL0 NAS Q BATCH → proposed WL DIA GF SOY0 OIL0 NAS Q BATCH

**Chickpea Tofu** (`chickpea-tofu`): existing WL GF NUT0 SOY0 NAS BATCH → proposed WL GF NUT0 SOY0 NAS BATCH

**Chinese Cabbage Salad** (`fr-44`): existing — → proposed —

**Chinese Soup** (`chinese-soup`): existing GF SOY0 NAS BATCH → proposed GF SOY0 NAS BATCH

**Breaded Tofu Sticks** (`breaded-tofu-sticks`): existing OIL0 NAS → proposed OIL0 NAS

**Candy Rolls** (`fr-29`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Caramelized Nuts** (`caramelized-nuts`): existing GF SOY0 → proposed GF SOY0

**Carob spread (hazelnut)** (`carob-spread`): existing BP HRT SOY0 OIL0 NAS BATCH → proposed BP HRT SOY0 OIL0 NAS BATCH

**Carob spread (almond)** (`carob-spread-almond`): existing BP HRT SOY0 OIL0 NAS BATCH → proposed BP HRT SOY0 OIL0 NAS BATCH

**Chipotle Sauce** (`chipotle-sauce`): existing GF SOY0 OIL0 NAS BATCH → proposed GF SOY0 OIL0 NAS BATCH

**Chorizo with Potato Taco** (`chorizo-with-potato-taco`): existing WL DIA HRT NUT0 OIL0 NAS → proposed WL DIA HRT NUT0 OIL0 NAS

**Citrus Dressing** (`citrus-dressing`): existing GF NUT0 SOY0 Q BATCH → proposed GF NUT0 SOY0 Q BATCH

**Classic Greek Salad** (`fr-49`): existing WL GF NUT0 SOY0 OIL0 NAS Q → proposed WL GF NUT0 SOY0 OIL0 NAS Q

**Coconut Macaroon Balls** (`fr-50`): existing GF SOY0 OIL0 BATCH KID → proposed GF SOY0 OIL0 BATCH KID

**Coconut Mozzarella** (`fr-51`): existing GF SOY0 NAS BATCH → proposed GF SOY0 NAS BATCH

**Cranberry Jam** (`fr-52`): existing WL BP GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP GF NUT0 SOY0 OIL0 NAS BATCH

**Croutons** (`fr-53`): existing NUT0 SOY0 NAS → proposed NUT0 SOY0 NAS

**Crunchy Carrot Salad** (`crunchy-carrot-salad`): existing WL BP DIA HRT GF SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF SOY0 OIL0 NAS Q

**Crunchy Sweet Cabbage Salad** (`crunchy-sweet-cabbage-salad`): existing GF SOY0 OIL0 Q → proposed GF SOY0 OIL0 Q

**Cucumber Dressing** (`fr-56`): existing WL GF OIL0 NAS BATCH → proposed WL GF OIL0 NAS BATCH

**Cucumber Raita** (`fr-57`): existing GF SOY0 OIL0 NAS Q BATCH → proposed GF SOY0 OIL0 NAS Q BATCH

**Cucumber and Sunflowerseed Dressing** (`cucumber-and-sunflowerseed-dressing`): existing WL GF NUT0 OIL0 NAS Q BATCH → proposed WL GF NUT0 OIL0 NAS Q BATCH

**Dal Stew** (`dal-stew`): existing GF NUT0 SOY0 NAS BATCH → proposed GF NUT0 SOY0 NAS BATCH

**Dried Fruit Jam** (`fr-60`): existing WL BP GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP GF NUT0 SOY0 OIL0 NAS BATCH

**Easy Colombian Salad** (`easy-colombian-salad`): existing WL BP GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP GF NUT0 SOY0 OIL0 NAS Q

**Ellen's Granola** (`ellens-granola`): existing BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Erik's Granola** (`fr-63`): existing BP HRT SOY0 OIL0 NAS BATCH KID → proposed BP HRT SOY0 OIL0 NAS BATCH KID

**Falafel** (`fr-64`): existing WL HRT NUT0 SOY0 OIL0 NAS BATCH → proposed WL HRT NUT0 SOY0 OIL0 NAS BATCH

**Feld Salad with Pomegranate** (`feld-salad-with-pomegranate`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Fermented Red Cabbage** (`fermented-red-cabbage`): existing WL GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL GF NUT0 SOY0 OIL0 NAS BATCH

**Fig Spread** (`fig-spread`): existing BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed BP HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Fresh Vegetable Bouillon** (`fr-69`): existing WL GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL GF NUT0 SOY0 OIL0 NAS BATCH

**Frittata** (`fr-70`): existing GF BATCH → proposed GF BATCH

**Fruit Crisp** (`fruit-crisp`): existing NUT0 SOY0 BATCH KID → proposed NUT0 SOY0 BATCH KID

**Fruit Salad** (`fruit-salad`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS Q KID → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS Q KID

**Garlic and Cashew Cheese** (`fr-74`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Gluten Free Oat Buns** (`gluten-free-oat-buns`): existing NUT0 BATCH KID → proposed NUT0 BATCH KID

**Golden Soup** (`golden-soup`): existing GF NUT0 SOY0 OIL0 NAS BATCH → proposed GF NUT0 SOY0 OIL0 NAS BATCH

**Green Beans** (`fr-77`): existing WL GF NUT0 SOY0 NAS Q → proposed WL GF NUT0 SOY0 NAS Q

**Guacamole** (`fr-78`): existing DIA GF NUT0 SOY0 OIL0 NAS Q → proposed DIA GF NUT0 SOY0 OIL0 NAS Q

**Happy Beans Salad** (`happy-beans-salad`): existing GF NUT0 SOY0 Q BATCH → proposed GF NUT0 SOY0 Q BATCH

**Hasselback Potatoes** (`hasselback-potatoes`): existing WL GF NUT0 SOY0 NAS KID → proposed WL GF NUT0 SOY0 NAS KID

**Hazelnut and Sundried Tomato Cheese** (`hazelnut-and-sundried-tomato-cheese`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Homemade Whole Wheat Bread** (`homemade-whole-wheat-bread`): existing HRT NUT0 SOY0 OIL0 BATCH KID → proposed HRT NUT0 SOY0 OIL0 BATCH KID

**Horseradish Dressing** (`horseradish-dressing`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Hummus** (`fr-84`): existing WL HRT GF NUT0 SOY0 OIL0 NAS Q BATCH KID → proposed WL HRT GF NUT0 SOY0 OIL0 NAS Q BATCH KID

**Isabel´s Dressing** (`isabels-dressing`): existing NUT0 NAS Q BATCH → proposed NUT0 NAS Q BATCH

**Kale and Sweet Potato Salad** (`kale-and-sweet-potato-salad`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Kale Avocado** (`kale-avocado`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Kale Chips** (`kale-chips`): existing WL BP GF NUT0 SOY0 NAS Q → proposed WL BP GF NUT0 SOY0 NAS Q

**Kale Soup** (`kale-soup`): existing WL DIA GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL DIA GF NUT0 SOY0 OIL0 NAS BATCH

**Katrine´s Pesto Dressing** (`katrines-pesto-dressing`): existing GF NAS Q BATCH → proposed GF NAS Q BATCH

**Ketchup** (`fr-92`): existing GF NUT0 SOY0 OIL0 Q BATCH → proposed GF NUT0 SOY0 OIL0 Q BATCH

**Kidney Bean Stew** (`kidney-bean-stew`): existing GF NUT0 SOY0 OIL0 BATCH → proposed GF NUT0 SOY0 OIL0 BATCH

**Lasagna** (`fr-94`): existing OIL0 NAS BATCH KID → proposed OIL0 NAS BATCH KID

**Lemon and Olive Oil Dressing** (`lemon-and-olive-oil-dressing`): existing GF NUT0 SOY0 NAS Q → proposed GF NUT0 SOY0 NAS Q

**Lentil Lap Stew** (`lentil-lap-stew`): existing WL DIA GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL DIA GF NUT0 SOY0 OIL0 NAS BATCH

**Lightly Cooked Broccoli** (`lightly-cooked-broccoli`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Luke's Indian Chickpea Sauce** (`fr-99`): existing GF NUT0 SOY0 OIL0 NAS BATCH → proposed GF NUT0 SOY0 OIL0 NAS BATCH

**Marika's Tofu Balls** (`fr-101`): existing OIL0 NAS BATCH KID → proposed OIL0 NAS BATCH KID

**Marika's Summer Salad** (`marikas-summer-salad`): existing WL BP GF NUT0 NAS → proposed WL BP GF NUT0 NAS

**Marinated Tofu Sticks** (`marinated-tofu-sticks`): existing NUT0 NAS KID → proposed NUT0 NAS KID

**Mashed Potatoes** (`fr-104`): existing WL GF NUT0 OIL0 NAS KID → proposed WL GF NUT0 OIL0 NAS KID

**Mediterranean Soup** (`mediterranean-soup`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Millet Crackers, Hirseknekk** (`millet-crackers-hirseknekk`): existing GF SOY0 OIL0 NAS BATCH → proposed GF SOY0 OIL0 NAS BATCH

**Noodle Wok** (`noodle-wok`): existing NUT0 → proposed NUT0

**Nordic Sprout Salad** (`nordic-sprout-salad`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS

**Nutloaf** (`fr-111`): existing NAS BATCH → proposed NAS BATCH

**Oat Burger** (`oat-burger`): existing WL DIA OIL0 NAS BATCH KID → proposed WL DIA OIL0 NAS BATCH KID

**Onion Pie Crust** (`fr-113`): existing NUT0 SOY0 Q BATCH → proposed NUT0 SOY0 Q BATCH

**Onion Pie Filling** (`fr-114`): existing WL DIA GF SOY0 OIL0 NAS BATCH → proposed WL DIA GF SOY0 OIL0 NAS BATCH

**Parmesan** (`fr-115`): existing GF SOY0 OIL0 NAS Q BATCH → proposed GF SOY0 OIL0 NAS Q BATCH

**Peanut Ginger Dressing** (`peanut-ginger-dressing`): existing OIL0 Q BATCH → proposed OIL0 Q BATCH

**Pickled Ginger** (`pickled-ginger`): existing GF NUT0 SOY0 OIL0 BATCH → proposed GF NUT0 SOY0 OIL0 BATCH

**Pineapple Cream** (`pineapple-cream`): existing BP HRT GF SOY0 OIL0 Q BATCH KID → proposed BP HRT GF SOY0 OIL0 Q BATCH KID

**Pizza Crust Dough** (`fr-119`): existing NUT0 SOY0 NAS BATCH KID → proposed NUT0 SOY0 NAS BATCH KID

**Plant Based Butter** (`plant-based-butter`): existing GF SOY0 NAS BATCH → proposed GF SOY0 NAS BATCH

**Polenta** (`fr-123`): existing GF NUT0 SOY0 KID → proposed GF NUT0 SOY0 KID

**Pomodoro Sauce** (`pomodoro-sauce`): existing WL BP GF NUT0 SOY0 NAS BATCH → proposed WL BP GF NUT0 SOY0 NAS BATCH

**Potato and Spinach Soup** (`potato-and-spinach-soup`): existing WL DIA GF SOY0 OIL0 NAS BATCH KID → proposed WL DIA GF SOY0 OIL0 NAS BATCH KID

**Potato Gratin** (`potato-gratin`): existing SOY0 BATCH KID → proposed SOY0 BATCH KID

**Potato Salad** (`potato-salad`): existing GF NUT0 NAS BATCH KID → proposed GF NUT0 NAS BATCH KID

**Pumpkin Soup** (`pumpkin-soup`): existing GF NUT0 SOY0 OIL0 NAS BATCH → proposed GF NUT0 SOY0 OIL0 NAS BATCH

**Pumpkinseed and Basil Cheese** (`fr-130`): existing WL GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL GF NUT0 SOY0 OIL0 NAS BATCH

**Quinoa Salad First** (`quinoa-salad-first`): existing WL BP DIA HRT GF SOY0 OIL0 NAS → proposed WL BP DIA HRT GF SOY0 OIL0 NAS

**Quinoa Salad Second** (`quinoa-salad-second`): existing GF NUT0 SOY0 → proposed GF NUT0 SOY0

**Ranch Dressing** (`ranch-dressing`): existing GF SOY0 OIL0 NAS BATCH → proposed GF SOY0 OIL0 NAS BATCH

**Raspberry Jam** (`fr-134`): existing BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed BP HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Raw Cheesecake** (`raw-cheesecake`): existing GF SOY0 BATCH KID → proposed GF SOY0 BATCH KID

**Red Beet Spread** (`fr-136`): existing HRT GF SOY0 OIL0 NAS BATCH → proposed HRT GF SOY0 OIL0 NAS BATCH

**Red Cabbage Salad** (`fr-137`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Red Beet Salad** (`red-beet-salad`): existing WL GF NUT0 NAS → proposed WL GF NUT0 NAS

**Red Beet Burger** (`red-beet-burger`): existing NAS BATCH → proposed NAS BATCH

**Red Lentil Soup** (`red-lentil-soup`): existing GF NUT0 SOY0 OIL0 BATCH → proposed GF NUT0 SOY0 OIL0 BATCH

**Rice Porridge** (`rice-porridge`): existing GF NUT0 SOY0 OIL0 BATCH KID → proposed GF NUT0 SOY0 OIL0 BATCH KID

**Roasted Cauliflower** (`fr-142`): existing WL GF NUT0 SOY0 NAS Q → proposed WL GF NUT0 SOY0 NAS Q

**Roasted Pepper Seitan Sausages** (`fr-143`): existing NUT0 OIL0 BATCH → proposed NUT0 OIL0 BATCH

**Roasted Sweet Potato and Arugula Salad** (`fr-144`): existing BP GF NUT0 SOY0 → proposed BP GF NUT0 SOY0

**Roasted Brussels Sprouts** (`roasted-brussels-sprouts`): existing WL GF NUT0 SOY0 NAS → proposed WL GF NUT0 SOY0 NAS

**Roasted Salad** (`roasted-salad`): existing GF SOY0 → proposed GF SOY0

**Russian Penicillin** (`fr-149`): existing GF NUT0 SOY0 OIL0 Q → proposed GF NUT0 SOY0 OIL0 Q

**Salsa** (`fr-150`): existing WL GF NUT0 SOY0 NAS Q BATCH → proposed WL GF NUT0 SOY0 NAS Q BATCH

**Scrambled Tofu** (`scrambled-tofu`): existing NUT0 NAS KID → proposed NUT0 NAS KID

**Seasoned Baked Potatoes** (`seasoned-baked-potatoes`): existing GF NUT0 SOY0 NAS BATCH KID → proposed GF NUT0 SOY0 NAS BATCH KID

**Simple Baked Potatoes** (`simple-baked-potatoes`): existing WL BP GF NUT0 SOY0 NAS BATCH KID → proposed WL BP GF NUT0 SOY0 NAS BATCH KID

**Sorbet** (`fr-155`): existing GF NUT0 SOY0 OIL0 KID → proposed GF NUT0 SOY0 OIL0 KID

**Soy Mayonnaise** (`fr-156`): existing GF NUT0 NAS Q BATCH → proposed GF NUT0 NAS Q BATCH

**Soy Mozzarella** (`soy-mozzarella`): existing GF OIL0 NAS BATCH → proposed GF OIL0 NAS BATCH

**Soy Salami** (`soy-salami`): existing NUT0 BATCH → proposed NUT0 BATCH

**Soy Yogurt Dressing** (`soy-yogurt-dressing`): existing WL GF NUT0 OIL0 NAS Q BATCH → proposed WL GF NUT0 OIL0 NAS Q BATCH

**Steamed Small Potatoes** (`steamed-small-potatoes`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS KID → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS KID

**Stine Gro´s Waffles** (`stine-gros-waffles`): existing NUT0 SOY0 OIL0 NAS BATCH KID → proposed NUT0 SOY0 OIL0 NAS BATCH KID

**Strawberry Jam** (`fr-163`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Stuffed Paprika with Tofu** (`stuffed-paprika-with-tofu`): existing WL NAS BATCH → proposed WL NAS BATCH

**Swedish Oven Pancake** (`swedish-oven-pancake`): existing NUT0 BATCH KID → proposed NUT0 BATCH KID

**Sweet Potato Muffins** (`sweet-potato-muffins`): existing BATCH KID → proposed BATCH KID

**Sweet Potato Soup** (`sweet-potato-soup`): existing WL DIA GF NUT0 SOY0 OIL0 NAS KID → proposed WL DIA GF NUT0 SOY0 OIL0 NAS KID

**Sweet Vinaigrette** (`sweet-vinaigrette`): existing GF NUT0 SOY0 Q BATCH → proposed GF NUT0 SOY0 Q BATCH

**Sweet Yellow Pea Soup** (`sweet-yellow-pea-soup`): existing WL DIA GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL DIA GF NUT0 SOY0 OIL0 NAS BATCH KID

**Thai Soup** (`fr-172`): existing GF NUT0 OIL0 NAS BATCH → proposed GF NUT0 OIL0 NAS BATCH

**Tofu Feta Cheese** (`fr-173`): existing GF NUT0 NAS BATCH → proposed GF NUT0 NAS BATCH

**Tofu Cottage Cheese** (`tofu-cottage-cheese`): existing WL HRT GF OIL0 NAS Q BATCH → proposed WL HRT GF OIL0 NAS Q BATCH

**Tofu Form** (`tofu-form`): existing WL NAS BATCH → proposed WL NAS BATCH

**Tom's Gluten Free Bread** (`toms-gluten-free-bread`): existing GF NUT0 SOY0 NAS BATCH KID → proposed GF NUT0 SOY0 NAS BATCH KID

**Tomato Bruschetta** (`fr-179`): existing WL GF NUT0 SOY0 NAS → proposed WL GF NUT0 SOY0 NAS

**Tomato Sauce for Pizza** (`fr-180`): existing WL GF NUT0 SOY0 NAS Q BATCH → proposed WL GF NUT0 SOY0 NAS Q BATCH

**Tomato Soup** (`fr-181`): existing GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed GF NUT0 SOY0 OIL0 NAS BATCH KID

**Tomato Bean Salad** (`tomato-bean-salad`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Turmeric and Cashew Cheese** (`fr-183`): existing WL GF SOY0 OIL0 NAS BATCH → proposed WL GF SOY0 OIL0 NAS BATCH

**Ukrainian Borscht Soup** (`fr-184`): existing WL DIA GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL DIA GF NUT0 SOY0 OIL0 NAS BATCH

**Vanilla Sauce** (`fr-185`): existing GF NUT0 OIL0 NAS BATCH → proposed GF NUT0 OIL0 NAS BATCH

**Vegetable Pie** (`vegetable-pie`): existing WL NUT0 NAS BATCH → proposed WL NUT0 NAS BATCH

**Walnut Basil Dressing** (`fr-187`): existing GF SOY0 NAS Q BATCH → proposed GF SOY0 NAS Q BATCH

**White Cabbage Coleslaw** (`fr-190`): existing WL BP DIA HRT GF OIL0 NAS Q BATCH → proposed WL BP DIA HRT GF OIL0 NAS Q BATCH

**White Cashew Sauce** (`fr-191`): existing GF SOY0 OIL0 NAS BATCH → proposed GF SOY0 OIL0 NAS BATCH

**Fredheim Plant-Based Cream Cheese** (`fredheim-deluxe-plant-based-cream-cheese`): existing GF SOY0 OIL0 NAS BATCH → proposed GF SOY0 OIL0 NAS BATCH

**Creamy Red Lentil Stew** (`creamy-red-lentil-stew`): existing GF SOY0 OIL0 NAS BATCH → proposed GF SOY0 OIL0 NAS BATCH

**Fluffy Gluten-Free Bread** (`ultimate-fluffy-vegan-gluten-free-bread`): existing GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed GF NUT0 SOY0 OIL0 NAS BATCH KID

**Roasted Red Pepper Hummus** (`roasted-red-pepper-hummus`): existing GF NUT0 SOY0 NAS BATCH KID → proposed GF NUT0 SOY0 NAS BATCH KID

**Ginger Pear Overnight Oats with Cashew Milk** (`ginger-pear-overnight-oats`): existing BP SOY0 OIL0 NAS KID → proposed BP SOY0 OIL0 NAS KID

**Squash Cake (Courgette & Walnut)** (`squash-cake`): existing SOY0 BATCH KID → proposed SOY0 BATCH KID

**Vegan Tzatziki Sauce** (`vegan-tzatziki-sauce`): existing WL BP HRT GF OIL0 NAS → proposed WL BP HRT GF OIL0 NAS

**Quick Lemon-Pickled Onions** (`quick-lemon-pickled-onions`): existing WL GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL GF NUT0 SOY0 OIL0 NAS BATCH

**Lemony Chickpea Hummus** (`lemony-chickpea-hummus`): existing WL GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL GF NUT0 SOY0 OIL0 NAS BATCH KID

**Carob & Black Bean Mousse** (`carob-black-bean-mousse`): existing GF NUT0 OIL0 BATCH KID → proposed GF NUT0 OIL0 BATCH KID

**Lime Cheesecake (Raw)** (`lime-cheesecake`): existing GF SOY0 BATCH KID → proposed GF SOY0 BATCH KID

**Classic Hummus** (`classic-hummus`): existing GF NUT0 SOY0 NAS BATCH KID → proposed GF NUT0 SOY0 NAS BATCH KID

**Za'atar Hummus Plate with Tomato Salad** (`zaatar-hummus-salad`): existing NUT0 SOY0 NAS Q KID → proposed NUT0 SOY0 NAS Q KID

**Fluffy Gluten-Free Loaf** (`fluffy-gluten-free-loaf`): existing HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

### Reversal

**Crispy Oat Waffles** (`orn-1`): existing NUT0 SOY0 OIL0 BATCH KID → proposed NUT0 SOY0 OIL0 BATCH KID

**Creamy White Bean, Lemon-Dill & Date Dressing** (`orn-2`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Black Mustard & Date Honey Mustard Dressing** (`orn-3`): existing WL HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Kebab Dressing** (`orn-4`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS Q BATCH → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS Q BATCH

**Fudgy Carob & Date Brownies** (`orn-5`): existing BP HRT OIL0 NAS BATCH KID → proposed BP HRT OIL0 NAS BATCH KID

**Carob & White Bean Protein Shake** (`orn-6`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS KID → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS KID

**Forest Berry & White Bean Protein Smoothie** (`orn-7`): existing WL BP HRT NUT0 SOY0 OIL0 NAS KID → proposed WL BP HRT NUT0 SOY0 OIL0 NAS KID

**The Perfect Homemade Oat Milk** (`orn-8`): existing WL NUT0 SOY0 OIL0 NAS → proposed WL NUT0 SOY0 OIL0 NAS

**Tropical Mango, Date & White Bean Smoothie Bowl** (`orn-9`): existing WL BP HRT NUT0 SOY0 OIL0 NAS KID → proposed WL BP HRT NUT0 SOY0 OIL0 NAS KID

**Warm Buckwheat Porridge with Dates, Carob & Cinnamon** (`orn-10`): existing BP HRT GF NUT0 SOY0 OIL0 NAS Q KID → proposed BP HRT GF NUT0 SOY0 OIL0 NAS Q KID

**Miso Red Lentil & Sweet Potato Soup** (`orn-11`): existing WL BP DIA HRT GF NUT0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 OIL0 NAS BATCH KID

**Fredheim Golden Vegetable Broth** (`orn-12`): existing WL GF NUT0 OIL0 NAS BATCH → proposed WL GF NUT0 OIL0 NAS BATCH

**Sweet Almond Milk Chia Pudding with Mango** (`orn-13`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Black Bean & Tomato Salad** (`orn-14`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS Q → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS Q

**Barley Coffee Evening Latte** (`orn-15`): existing NUT0 SOY0 OIL0 → proposed NUT0 SOY0 OIL0

**Red Cabbage & Edamame Salad with Sweet-Sour-Savory Dressing** (`orn-16`): existing WL BP DIA HRT GF NUT0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 OIL0 NAS BATCH

**Gluten-Free Oat & Potato Bread Rolls** (`orn-17`): existing HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Carob Dream Overnight Oats** (`orn-18`): existing NUT0 SOY0 OIL0 BATCH KID → proposed NUT0 SOY0 OIL0 BATCH KID

**Tropical Psyllium Pudding** (`orn-19`): existing NUT0 SOY0 OIL0 BATCH KID → proposed NUT0 SOY0 OIL0 BATCH KID

**Walnut Patties (Oven-Baked)** (`orn-20`): existing GF NAS BATCH KID → proposed GF NAS BATCH KID

**Sautéed Red Cabbage with Lemon & Dates** (`orn-21`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS

**Umami Broth** (`orn-23`): existing WL GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL GF NUT0 SOY0 OIL0 NAS BATCH

**Sweet Almond Milk Chia Pudding with Pineapple** (`orn-24`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Sweet Almond Milk Chia Pudding with Forest Berries** (`orn-25`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Sweet Almond Milk Chia Pudding with Blueberries** (`orn-26`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Sweet Almond Milk Chia Pudding with Raspberries** (`orn-27`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Sweet Almond Milk Chia Pudding with Strawberries** (`orn-28`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Metabolic Support Drink** (`orn-29`): existing WL BP GF NUT0 SOY0 OIL0 NAS Q → proposed WL BP GF NUT0 SOY0 OIL0 NAS Q

**Ciorbă de Fasole with Lemon-Pickled Red Onion — Stovetop** (`orn-30`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Ciorbă de Fasole with Lemon-Pickled Red Onion — Instant Pot, No Soak** (`orn-31`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Calcium Boost Salad** (`orn-32`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS

**Vanilla-Carob Psyllium Pudding with Blueberries (Water-Based)** (`orn-33`): existing WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Vanilla-Carob Psyllium Pudding with Blueberries** (`orn-34`): existing NUT0 SOY0 OIL0 BATCH KID → proposed NUT0 SOY0 OIL0 BATCH KID

**Golden Corn Soup (Silky-Chewy Curry Version)** (`orn-35`): existing WL DIA HRT GF SOY0 OIL0 NAS BATCH KID → proposed WL DIA HRT GF SOY0 OIL0 NAS BATCH KID

**Tahini-Almond Berry Chia Pudding** (`orn-36`): existing WL BP DIA HRT GF SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF SOY0 OIL0 NAS BATCH KID

**Rye Sourdough Starter — How to Build One From Scratch** (`orn-37`): existing NUT0 SOY0 OIL0 NAS → proposed NUT0 SOY0 OIL0 NAS

**Rye Sourdough** (`orn-38`): existing DIA HRT NUT0 SOY0 OIL0 NAS BATCH → proposed DIA HRT NUT0 SOY0 OIL0 NAS BATCH

**Wholegrain Rye Loaf** (`orn-39`): existing DIA HRT NUT0 SOY0 OIL0 NAS BATCH KID → proposed DIA HRT NUT0 SOY0 OIL0 NAS BATCH KID

**Broccoli Salad with Toasted Walnuts and White Bean Dressing** (`orn-40`): existing WL BP DIA HRT GF SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF SOY0 OIL0 NAS BATCH

**Fredrik's Toasted Buckwheat & Date Granola** (`orn-41`): existing HRT NUT0 SOY0 OIL0 NAS BATCH KID → proposed HRT NUT0 SOY0 OIL0 NAS BATCH KID

**Zucchini & Walnut Cake (GREEN)** (`orn-42`): existing HRT SOY0 OIL0 NAS BATCH KID → proposed HRT SOY0 OIL0 NAS BATCH KID

**Quick Almond Milk** (`orn-43`): existing WL BP GF SOY0 OIL0 NAS → proposed WL BP GF SOY0 OIL0 NAS

**Deep Prune Jam** (`orn-44`): existing BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed BP HRT GF NUT0 SOY0 OIL0 NAS BATCH

**Zucchini, Carrot & Walnut Patties** (`orn-45`): existing WL DIA HRT SOY0 OIL0 NAS BATCH KID → proposed WL DIA HRT SOY0 OIL0 NAS BATCH KID

**Sour & Savory White Bean Hummus** (`orn-46`): existing GF NUT0 OIL0 NAS BATCH KID → proposed GF NUT0 OIL0 NAS BATCH KID

**Sweet & Sour Cherry Jam** (`orn-47`): existing WL BP GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP GF NUT0 SOY0 OIL0 NAS BATCH

**Zucchini & Walnut Cake, Gluten-Free (GREEN)** (`orn-48`): existing HRT GF SOY0 OIL0 NAS BATCH KID → proposed HRT GF SOY0 OIL0 NAS BATCH KID

**Oat Porridge (Stovetop)** (`orn-49`): existing WL BP DIA HRT NUT0 SOY0 OIL0 NAS Q BATCH KID → proposed WL BP DIA HRT NUT0 SOY0 OIL0 NAS Q BATCH KID

**Oat Porridge (Instant Pot)** (`orn-50`): existing WL BP DIA HRT NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT NUT0 SOY0 OIL0 NAS BATCH KID

**Buckwheat Porridge (Stovetop)** (`orn-51`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Buckwheat Porridge (Instant Pot)** (`orn-52`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Quinoa Porridge (Stovetop)** (`orn-53`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Quinoa Porridge (Instant Pot)** (`orn-54`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Millet Porridge (Stovetop)** (`orn-55`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Millet Porridge (Instant Pot)** (`orn-56`): existing WL DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Sweet Tahini Sauce for Porridge** (`orn-57`): existing BP HRT GF SOY0 OIL0 NAS BATCH → proposed BP HRT GF SOY0 OIL0 NAS BATCH

**Spring Pea Soup** (`orn-58`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS KID

**Creamy Cashew Kebab Sauce** (`orn-59`): existing DIA HRT GF SOY0 OIL0 NAS BATCH → proposed DIA HRT GF SOY0 OIL0 NAS BATCH

**Cashew Yogurt** (`orn-60`): existing GF OIL0 NAS BATCH KID → proposed GF OIL0 NAS BATCH KID

**Chickpea Fries (Baked, No Oil)** (`orn-61`): existing BP HRT GF NUT0 SOY0 OIL0 NAS KID → proposed BP HRT GF NUT0 SOY0 OIL0 NAS KID

**Golden No-Chicken Soup** (`orn-62`): existing WL BP DIA HRT GF NUT0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 OIL0 NAS BATCH

**Warm Carob Drink with Almond Milk** (`orn-63`): existing WL BP HRT GF SOY0 OIL0 NAS KID → proposed WL BP HRT GF SOY0 OIL0 NAS KID

**Blueberry Breakfast Pie** (`orn-64`): existing BP HRT NUT0 SOY0 OIL0 NAS BATCH KID → proposed BP HRT NUT0 SOY0 OIL0 NAS BATCH KID

**Cinnamon-Date Applesauce** (`orn-65`): existing BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed BP HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

**Gluten-Free Oat & Potato Loaf** (`orn-66`): existing HRT GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed HRT GF NUT0 SOY0 OIL0 NAS BATCH KID

### FMD

**Daily Vegetable Broth** (`fmd-broth`): existing WL BP GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP GF NUT0 SOY0 OIL0 NAS BATCH

**Walnut, Olive & Avocado Plate with Flaxseed** (`fmd-d1-breakfast`): existing GF SOY0 OIL0 NAS Q → proposed GF SOY0 OIL0 NAS Q

**Avocado & Roasted Sweet Potato Salad** (`fmd-d1-lunch`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS

**White Bean & Vegetable Minestrone** (`fmd-d1-dinner`): existing WL DIA NUT0 SOY0 OIL0 NAS → proposed WL DIA NUT0 SOY0 OIL0 NAS

**Almond, Olive & Avocado Plate with Berries** (`fmd-d2-breakfast`): existing DIA HRT GF SOY0 OIL0 NAS Q → proposed DIA HRT GF SOY0 OIL0 NAS Q

**Roasted Pumpkin Soup with Avocado** (`fmd-d2-lunch`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS

**Steamed Broccoli & Spinach Bowl with Avocado** (`fmd-d2-dinner`): existing WL BP DIA HRT NUT0 SOY0 OIL0 NAS Q → proposed WL BP DIA HRT NUT0 SOY0 OIL0 NAS Q

**Warm Chia Pudding with Stewed Berries** (`fmd-d3-breakfast`): existing NUT0 SOY0 OIL0 → proposed NUT0 SOY0 OIL0

**Red Lentil & Tomato Soup** (`fmd-d3-lunch`): existing WL BP DIA HRT GF SOY0 OIL0 NAS → proposed WL BP DIA HRT GF SOY0 OIL0 NAS

**Roasted Root Vegetables with Steamed Kale & Walnuts** (`fmd-d3-dinner`): existing WL BP DIA HRT GF SOY0 OIL0 NAS → proposed WL BP DIA HRT GF SOY0 OIL0 NAS

**Warm Stewed Apple with Walnuts & Flaxseed** (`fmd-d4-breakfast`): existing WL BP DIA HRT GF SOY0 OIL0 NAS Q → proposed WL BP DIA HRT GF SOY0 OIL0 NAS Q

**Courgette & Cauliflower Soup with Avocado** (`fmd-d4-lunch`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS

**Quinoa-Stuffed Roasted Pepper with Steamed Spinach** (`fmd-d4-dinner`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS

**Overnight Oats with Almond Butter & Berries** (`fmd-d5-breakfast`): existing BP DIA HRT SOY0 OIL0 NAS → proposed BP DIA HRT SOY0 OIL0 NAS

**Roasted Tomato & Fennel Soup with Avocado** (`fmd-d5-lunch`): existing WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS

**Celebration Green Bowl with Avocado** (`fmd-d5-dinner`): existing BP GF OIL0 NAS Q → proposed BP GF OIL0 NAS Q


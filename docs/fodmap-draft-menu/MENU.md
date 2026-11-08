# A week of plant-based food (draft)

This is a menu you can cook. It is **not** an approved low-FODMAP plan, **not** a Monash diet, and **not** eligible for the app’s low-FODMAP Make my week mode. No clinician has signed it. The recipes are original. FODMAP eligibility of every dish is false. Where a public source names a serve, that serve is cited and was not enlarged in order to keep the citation. Potato, oats, zucchini, polenta, spinach, seeds and the soy drink are used in kitchen amounts and are **not** described as assessed low-FODMAP serves.

**What “a full day” means here.** Breakfast, one 200 ml soy drink, lunch, dinner, the carrot side and the snack. Lunch is the second serving of the previous dinner, the same size. The table below is that whole day, not a plate with the snack left off.

**Illustrative adult figures, not a prescription.** 2000 kcal and about 60 g protein are the display figures already in this app. Nordic Nutrition Recommendations 2023 set energy by age, sex and activity, and protein near 0.83 g per kg (about 60 g at 70 kg). One person may need more or less. These servings were built as a normal adult day. They were not inflated afterward to paint a perfect score, and they were not shrunk to protect a low-FODMAP claim the file does not make.

**How the numbers were made.** Dictionary ids, `estimateRecipe()` and `scripts/data/food-composition-core.json`, divided by servings. Calcium, iron, vitamin B12, vitamin D and omega-3 ALA use `scripts/lib/micronutrients.mjs` on the same weights. If an ingredient has no micronutrient row, it is named and left out. It is not stored as zero. If the row contains 0, that zero is what the table says for that food. Iodine is not a column in that file, so iodine is not estimated at all. Water is 0 kcal. Dry rice, oats, polenta and lentils are dry weights. Cooked weights were not measured.

**Calcium and the soy drink.** Tofu calcium uses the app’s firm, calcium-set row (350 mg per 100 g). If your block is not calcium-set, that calcium is not there. The drink is 200 ml of the table’s unsweetened soy drink: about 25 mg calcium per 100 g, vitamin B12 0, vitamin D 0. A carton that says fortified is a different product. Use its label for those nutrients. Do not add the label on top of these figures, and do not treat the table’s zero as the fortified drink.

**Salt.** Low salt is the smaller figure. Standard salt is the larger one. Canned chickpeas keep the ordinary drained sodium in the table. They are not forced “no salt added”.

**Left out of the cooking.** Onion bulbs, garlic bulbs, onion and garlic powders, inulin, chili heat, black pepper, vinegar, honey, silken tofu. That is a flavour choice for this draft. It is not a histamine rule, a salicylate rule, or a gluten-free claim. Oats are not called gluten-free. A complete soy-free week is **not provided**. The 42 g chickpea serve and the 20 g dry lentil serve cannot carry a day’s protein, and they were not increased to pretend they can.

**Leftovers.** Cool food within 1–2 hours and refrigerate at 0–5°C. Eat it the next day. Rice: cool within 1 hour, eat within 24 hours, reheat only once until steaming hot. Sources, read 8 November 2026: [NHS](https://www.nhs.uk/baby/weaning-and-feeding/childrens-food-safety-and-hygiene/), [Food Standards Agency on rice](https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker), [chilling leftovers](https://www.gov.uk/government/publications/how-to-chill-freeze-and-defrost-food-safely/how-to-chill-freeze-and-defrost-food-safely).

## The week

| Day | Breakfast | Drink | Lunch | Dinner | Side | Snack |
| --- | --- | --- | --- | --- | --- | --- |
| Monday | Lemon tofu and potato skillet | Unsweetened soy drink | Ginger cabbage and tofu with rice | Rosemary potato, carrot and tofu tray | Lemon carrots | Orange |
| Tuesday | Chickpea, kale and tofu hash | Unsweetened soy drink | Rosemary potato, carrot and tofu tray | Ginger tofu, zucchini and rice | Lemon carrots | Orange |
| Wednesday | Cinnamon rice with orange | Unsweetened soy drink | Ginger tofu, zucchini and rice | Polenta with chickpea, pepper and eggplant | Lemon carrots | Orange |
| Thursday | Lemon tofu and potato skillet | Unsweetened soy drink | Polenta with chickpea, pepper and eggplant | Lemon lentil, potato and tofu plate | Lemon carrots | Orange |
| Friday | Strawberry oats with tofu | Unsweetened soy drink | Lemon lentil, potato and tofu plate | Polenta with tofu, peppers and zucchini | Lemon carrots | Orange |
| Saturday | Cinnamon rice with orange | Unsweetened soy drink | Polenta with tofu, peppers and zucchini | Spinach, potato and tofu | Lemon carrots | Carrot and peanut butter |
| Sunday | Chickpea, kale and tofu hash | Unsweetened soy drink | Spinach, potato and tofu | Ginger cabbage and tofu with rice | Lemon carrots | Orange |

The numbers are the full day at low salt: breakfast, drink, lunch, dinner, side and snack.

| Day | kcal | protein g | fibre g | calcium mg | iron mg | ALA g | sodium mg, low salt | sodium mg, standard salt |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Monday | 2050 | 89.3 | 37.9 | 1946 | 22.9 | 2.905 | 932 | 1786 |
| Tuesday | 2057 | 90.4 | 37 | 1906.9 | 21.7 | 2.923 | 852 | 1706 |
| Wednesday | 2128 | 78 | 37.7 | 1368.7 | 19.3 | 2.151 | 699 | 1320 |
| Thursday | 2082 | 94.5 | 44.7 | 1913.3 | 27.6 | 2.88 | 984 | 1838 |
| Friday | 2017 | 95.2 | 42.2 | 1789.2 | 25.7 | 2.79 | 751 | 1526 |
| Saturday | 1963 | 81.4 | 36 | 1435.7 | 22 | 2.248 | 752 | 1371 |
| Sunday | 1981 | 90.6 | 38.9 | 1968.1 | 23.8 | 2.9 | 923 | 1776 |

Vitamin B12 in these totals is 0 µg and vitamin D is 0 µg, because the micronutrient rows for these foods store 0. That is a sourced zero for the unfortified foods in the table. It is not a measurement of a fortified carton, and it is not “adequate”. Iodine is absent from the micronutrient file, so there is no iodine number, not a zero. ALA is the omega-3 column that does exist. The day sums are whatever those rows add up to, mostly tofu and olive oil in this table. That is ALA on paper, not EPA or DHA, and not a laboratory test of the cooked plates. Fibre is at or above 30 g on these days. Iron is above the men’s 9 mg display figure and, on these totals, also above 15 mg. That still depends on the table’s iron values, not on a blood test. Calcium is high only if the tofu really is the calcium-set row.

Calcium on tofu days assumes calcium-set tofu. Treat a high calcium total as conditional on that, not as proof the brand in your hand matches the row.

Ingredients with no micronutrient row, omitted rather than zeroed: none.

## Recipes

All draft. `eligible_for_trial_menu` is false. `low_fodmap_status` is null.

### B1 — Lemon tofu and potato skillet

savoury breakfast. 1 serving. Prep about 15 min, cook about 25 min.

**Each serving, low salt:** 569 kcal, 27.5 g protein, 10.4 g fibre, 632.8 mg calcium from mapped rows, 8.9 mg iron, 230 mg sodium, 463 mg sodium at standard salt.

**Ingredients, per serving**

- 280 g potatoes, raw, peeled
- 150 g tofu, firm, calcium-set, drained weight
- 15 g olive-oil, plain
- 50 g spinach, raw leaves
- 12 g chives, green leaves, not a bulb
- 10 g ginger-fresh, peeled, grated
- 15 ml lemon-juice, fresh
- 1 g turmeric-ground
- 1 g cumin-ground
- 0.4 g salt, low-salt amount (low salt 0.4 g; standard salt 1 g)
- 80 g water, potable, for the potato

**Method**

1. Peel the potato and cut it into 1.5 cm dice.
2. Put the potato and the water in a wide pan, cover, and cook over a medium heat for about 12 minutes, until a cube is tender. Pour off the water you do not want in the bowl.
3. Crumble in the tofu. Add the oil, turmeric, cumin, ginger, chives and salt. Cook uncovered for about 8 minutes, stirring, until the tofu is hot and the edges colour.
4. Fold in the spinach and cook for 2 minutes. Take the pan off the heat and stir in the lemon juice.

**Yield.** The whole skillet is one serving. Cooked weight has not been measured.

**Evidence note.** Firm tofu is the drained kind a Monash blog describes as low FODMAP at a standard serve, unlike silken tofu (https://www.monashfodmap.com/blog/talking-tofu/, retrieved 8 Nov 2026). The gram cut-off is in the app and is not copied. 150 g is a kitchen portion. Potato at 280 g raw is far above the 75 g staple serve on their shopping list (3 Feb 2025), so that potato portion is not claimed. Plain oil and potable water are not given a FODMAP number here, and they are not treated as foods that need their own laboratory assay before you can cook.

### B2 — Chickpea, kale and tofu hash

savoury breakfast. 1 serving. Prep about 15 min, cook about 25 min.

**Each serving, low salt:** 533 kcal, 27 g protein, 12 g fibre, 595.3 mg calcium from mapped rows, 7.4 mg iron, 207 mg sodium, 440 mg sodium at standard salt.

**Ingredients, per serving**

- 220 g potatoes, raw, peeled
- 42 g chickpeas-canned, drained, ordinary salt level of the table, not forced no-salt
- 130 g tofu, firm, calcium-set, drained weight
- 50 g kale, raw leaves, stems trimmed
- 12 g olive-oil, plain
- 15 ml lemon-juice, fresh
- 1 g cumin-ground
- 1 g paprika-powder, sweet, not hot chili
- 8 g chives, green leaves
- 0.4 g salt, low-salt amount (low salt 0.4 g; standard salt 1 g)
- 50 g water, potable, for the potato

**Method**

1. Dice the peeled potato. Cover it with the water and cook, covered, for about 12 minutes. Pour off the water.
2. Add the oil, cumin, paprika, chives and salt. Cook for 5 minutes.
3. Stir in the drained chickpeas, the crumbled tofu and the kale. Cook for 5 minutes, until the tofu is hot and the kale has wilted. Finish with the lemon juice.

**Yield.** The whole pan is one serving. Cooked weight has not been measured.

**Evidence note.** The chickpeas stay at 42 g drained, the ¼ cup figure named on the Monash legumes blog (https://www.monashfodmap.com/blog/including-legumes-on-low-fodmap-diet/, retrieved 8 Nov 2026). They are a flavour, not the protein. Firm tofu carries the protein and is a kitchen portion, not an app gram. Potato is above the 75 g staple serve and is not claimed. The canned chickpea sodium is the ordinary drained row in the nutrition table.

### B3 — Cinnamon rice with orange

sweet breakfast. 1 serving. Prep about 5 min, cook about 40 min.

**Each serving, low salt:** 458 kcal, 11.1 g protein, 7.7 g fibre, 90.3 mg calcium from mapped rows, 2.4 mg iron, 4 mg sodium.

**Ingredients, per serving**

- 90 g brown-rice, dry
- 270 g water, potable, absorbed
- 150 g oranges, raw, peeled segments
- 0.5 g cinnamon-ground
- 10 g pumpkin-seeds, hulled, raw

**Method**

1. Rinse the rice. Simmer it in the water, covered, on low heat for about 35–40 minutes, until the grains are tender and the water is absorbed. Add a splash more if the pan dries. Do not rinse the cooked rice.
2. Stir in the cinnamon. Top with the orange and the pumpkin seeds.

**Yield.** The pot of rice plus the fruit and seeds is one serving. Cooked rice weight has not been measured.

**Evidence note.** Chumpitazi and others, Journal of Pediatrics 2018 (doi:10.1016/j.jpeds.2018.03.038), reported no detected FODMAPs in the cooked brown and white rice samples they assayed. That is not an upper limit and not this brand. 90 g dry is a bowl, left uncertified. Orange composition in Liljebo and others, BMC Nutrition 2020 (doi:10.1186/s40795-020-00374-3), includes 0.03 g fructan per 100 g and is not a serving limit. Pumpkin seeds, 10 g, were not in that supplement and are unassessed.

### B4 — Strawberry oats with tofu

sweet breakfast. 1 serving. Prep about 8 min, cook about 12 min.

**Each serving, low salt:** 521 kcal, 26.7 g protein, 11.5 g fibre, 490 mg calcium from mapped rows, 7 mg iron, 96 mg sodium, 251 mg sodium at standard salt.

**Ingredients, per serving**

- 60 g rolled-oats, dry, plain
- 240 g water, potable, for the oats
- 120 g strawberries, raw, hulled
- 0.5 g cinnamon-ground
- 10 g sunflower-seeds, hulled
- 120 g tofu, firm, calcium-set, drained weight
- 5 g olive-oil, plain, for the tofu
- 6 g chives, green leaves
- 0.2 g salt, low-salt amount, on the tofu (low salt 0.2 g; standard salt 0.6 g)

**Method**

1. Simmer the oats in the water for about 8–10 minutes, stirring, until creamy. Keep that liquid in the bowl. Stir in the cinnamon and top with the strawberries and sunflower seeds.
2. In a small pan, warm the tofu in the oil with the chives and a pinch of the salt for about 4 minutes, until hot. Eat it beside the oats, not stirred in unless you like it that way.

**Yield.** The bowl of oats and the small pan of tofu together are one serving. Cooked weights have not been measured.

**Evidence note.** 60 g dry oats is a normal porridge, larger than a token sprinkle, and it is not an assessed low-FODMAP serve. Rolled oats were absent from the selected BMC 2020 supplement. Sunflower seeds, 10 g, are unassessed. Firm tofu beside the bowl is the protein; its gram boundary was not copied from the app. This breakfast is not a gluten-free claim.

### D1 — Unsweetened soy drink

plain drink. 1 serving. Prep about 1 min, cook about 0 min.

**Each serving, low salt:** 74 kcal, 6.6 g protein, 1 g fibre, 51.5 mg calcium from mapped rows, 0.8 mg iron, 93 mg sodium.

**Ingredients, per serving**

- 200 ml soy-milk, unsweetened soy drink as in the nutrition table, not a named fortified brand

**Method**

1. Pour 200 ml and drink it cold, or warm it in a pan without boiling.
2. Read the carton. These numbers are the app’s unsweetened soy-drink row, which is not a fortified label. If the carton lists added calcium, vitamin D or vitamin B12, use that label for those nutrients and do not add it on top of this row.

**Yield.** 200 ml, one drink. No cooked weight.

**Evidence note.** The composition row is “unsweetened soy drink” (about 36 kcal and 3.2 g protein per 100 g; density 1.03). The micronutrient row used with it lists about 25 mg calcium per 100 g, vitamin B12 0 and vitamin D 0. That is this table, not a promise about every carton. A Monash shopping list (3 Feb 2025) mentions soy-protein drinks and says to check the ingredient list; it does not give a millilitre serve, and this row does not say whether the drink is made from soy protein or from whole beans. 200 ml is therefore included as food, with FODMAP eligibility left false.

### M1 — Ginger tofu, zucchini and rice

savoury dinner. 2 servings. Prep about 15 min, cook about 45 min.

**Each serving, low salt:** 722 kcal, 28.9 g protein, 7.6 g fibre, 577.5 mg calcium from mapped rows, 6.5 mg iron, 184 mg sodium, 417 mg sodium at standard salt.

**Ingredients, per serving**

- 100 g brown-rice, dry, for two servings
- 300 g water, potable, for the rice
- 150 g tofu, firm, calcium-set, drained, for two servings
- 100 g zucchini, raw
- 15 g olive-oil, plain
- 10 g ginger-fresh, peeled, grated
- 1 g turmeric-ground
- 10 g chives, green leaves
- 15 ml lemon-juice, fresh
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Rinse the rice and simmer it in its water, covered, for about 35–40 minutes, until tender. Keep the absorbed liquid in the rice.
2. Cut the zucchini into half-moons. Dice the tofu.
3. Warm the oil in a pan. Add the ginger, turmeric and tofu and cook for 6–8 minutes. Add the zucchini and chives and cook for another 6 minutes, until the zucchini is tender.
4. Stir in the lemon juice and salt. Serve half the rice with half the pan.

**Yield.** Divide the rice and the pan evenly into two servings. One is dinner, one is next-day lunch. Cooked weights have not been measured.

**Evidence note.** Per person: 100 g dry brown rice and 150 g firm tofu. Rice follows the 2018 assay note on B3, without an upper limit copied from anywhere. Tofu is a kitchen portion. Zucchini, 100 g per person, has no serving classification in this packet. The plate is not a stacking assessment.

### M2 — Rosemary potato, carrot and tofu tray

savoury dinner. 2 servings. Prep about 15 min, cook about 40 min, oven 200°C.

**Each serving, low salt:** 553 kcal, 25.7 g protein, 10.6 g fibre, 593.6 mg calcium from mapped rows, 6.5 mg iron, 238 mg sodium, 471 mg sodium at standard salt.

**Ingredients, per serving**

- 250 g potatoes, raw, peeled, for two servings
- 75 g carrots, raw, peeled
- 150 g tofu, firm, calcium-set, drained, for two servings
- 15 g olive-oil, plain
- 1 g rosemary, leaves
- 1 g paprika-powder, sweet, not hot chili
- 8 g chives, green leaves
- 15 ml lemon-juice, fresh
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Heat the oven to 200°C. Cut the peeled potatoes and the carrots into wedges.
2. Toss them with the oil, rosemary, paprika and salt. Spread on a tray and roast for 25 minutes.
3. Add the tofu in chunks and the chives. Roast for another 12–15 minutes, until the potatoes are soft and the tofu is hot.
4. Add the lemon juice and divide the tray in two.

**Yield.** The whole tray divided evenly into two servings. Cooked weight has not been measured.

**Evidence note.** Per person: 250 g raw potato and 75 g raw carrot. Carrot matches the 75 g staple serve on the Monash blog shopping list (3 Feb 2025). Potato is well above that serve and is not claimed. Firm tofu, 150 g, is a kitchen portion. Rosemary has flavour here; it has no FODMAP note in this packet.

### M3 — Polenta with chickpea, pepper and eggplant

savoury dinner. 2 servings. Prep about 15 min, cook about 30 min.

**Each serving, low salt:** 699 kcal, 29.2 g protein, 15.6 g fibre, 560.4 mg calcium from mapped rows, 9.1 mg iron, 288 mg sodium, 521 mg sodium at standard salt.

**Ingredients, per serving**

- 75 g cornmeal-polenta, dry, for two servings
- 350 g water, potable, for the polenta
- 42 g chickpeas-canned, drained, for two servings
- 140 g tofu, firm, calcium-set, drained, for two servings
- 75 g eggplant, raw
- 70 g bell-peppers, raw
- 70 g tomatoes, raw
- 14 g olive-oil, plain
- 1.5 g cumin-ground
- 1 g paprika-powder, sweet
- 8 g parsley, leaves
- 15 ml lemon-juice, fresh
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Bring the polenta water to a simmer, whisk in the polenta, and cook, stirring often, for about 15–20 minutes, until thick. Stir in half the oil and half the salt.
2. Dice the eggplant, pepper and tomato. Cook them in the rest of the oil with the cumin and paprika, covered for 8 minutes, then uncovered for about 5, until the eggplant is soft.
3. Add the drained chickpeas, the diced tofu, the parsley and the rest of the salt. Warm for 4 minutes. Finish with the lemon juice.
4. Serve half the polenta with half the pan.

**Yield.** Polenta and pan divided evenly into two servings. Cooked weights have not been measured.

**Evidence note.** Chickpeas stay at 42 g drained per person, the published ¼ cup figure. They do not carry the meal. Firm tofu does. Polenta has no FODMAP serve in this packet. Eggplant is 75 g per person and pepper 70 g, in line with the 75 g staple serve named for those vegetables on the 3 Feb 2025 shopping list. Fresh tomato is unassessed. This is a polenta plate, not another rice plate.

### M4 — Lemon lentil, potato and tofu plate

savoury dinner. 2 servings. Prep about 20 min, cook about 35 min.

**Each serving, low salt:** 565 kcal, 29 g protein, 11.9 g fibre, 579.6 mg calcium from mapped rows, 8.3 mg iron, 243 mg sodium, 476 mg sodium at standard salt.

**Ingredients, per serving**

- 20 g lentils-green-brown, dry; boiled and drained; cooking water discarded; for two servings
- 220 g potatoes, raw, peeled, for two servings
- 75 g carrots, raw, peeled
- 140 g tofu, firm, calcium-set, drained, for two servings
- 12 g olive-oil, plain
- 15 ml lemon-juice, fresh
- 10 g parsley, leaves
- 8 g chives, green leaves
- 1 g cumin-ground
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Boil the dry lentils in plenty of unsalted water until just tender, then drain and throw away that water.
2. Dice the potatoes and carrots. Boil them in fresh water until tender, then drain.
3. Warm the tofu in half the oil for 4 minutes. Toss potatoes, carrots, lentils and tofu with the rest of the oil, the lemon juice, parsley, chives, cumin and salt.

**Yield.** The whole bowl divided evenly into two servings. Lentil weight in the list is dry. Cooked lentil weight has not been measured.

**Evidence note.** Lentils stay at 20 g dry per person, boiled and drained. Nutrition uses the dry row (about 352 kcal and 24.6 g protein per 100 g). BMC Nutrition 2020 reports 0.46 g GOS per 100 g boiled green lentils and no serving limit. A Monash blog mentions ½ cup tinned lentils without grams. This is not that product, and the amount was not increased to manufacture protein. Firm tofu is the protein. Potato is 220 g raw per person and is not claimed against the 75 g staple serve. Carrot is 75 g.

### M5 — Polenta with tofu, peppers and zucchini

savoury dinner. 2 servings. Prep about 15 min, cook about 30 min.

**Each serving, low salt:** 682 kcal, 30.7 g protein, 12 g fibre, 579.1 mg calcium from mapped rows, 9.1 mg iron, 189 mg sodium, 421 mg sodium at standard salt.

**Ingredients, per serving**

- 75 g cornmeal-polenta, dry, for two servings
- 350 g water, potable, for the polenta
- 150 g tofu, firm, calcium-set, drained, for two servings
- 70 g bell-peppers, raw
- 90 g zucchini, raw
- 60 g tomatoes, raw
- 12 g olive-oil, plain
- 1 g paprika-powder, sweet
- 1 g cumin-ground
- 8 g chives, green leaves
- 10 ml lemon-juice, fresh
- 10 g pumpkin-seeds, hulled, raw, for two servings
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Simmer the polenta water, whisk in the polenta, and cook, stirring, for about 15–20 minutes. Stir in half the oil and half the salt.
2. Cook the pepper, zucchini and tomato in the rest of the oil with paprika, cumin and chives for about 12 minutes, until soft. Add the tofu and warm it for 4 minutes.
3. Finish with lemon juice and the rest of the salt. Divide polenta and vegetables. Put the pumpkin seeds on each plate.

**Yield.** Divided evenly into two servings, seeds included. Cooked weights have not been measured.

**Evidence note.** Pepper is 70 g per person, inside the 75 g staple serve on the 3 Feb 2025 shopping list. Zucchini, tomato, polenta and 10 g pumpkin seeds have no serving classification here. Firm tofu, 150 g per person, is the protein so this plate is not a low-protein soy-free day. Seeds were not piled up to fake a protein target.

### M6 — Spinach, potato and tofu

savoury dinner. 2 servings. Prep about 15 min, cook about 30 min.

**Each serving, low salt:** 520 kcal, 27.5 g protein, 10 g fibre, 653.2 mg calcium from mapped rows, 8.9 mg iron, 252 mg sodium, 484 mg sodium at standard salt.

**Ingredients, per serving**

- 250 g potatoes, raw, peeled, for two servings
- 150 g tofu, firm, calcium-set, drained, for two servings
- 80 g spinach, raw leaves
- 12 g olive-oil, plain
- 8 g ginger-fresh, peeled
- 1 g cumin-ground
- 8 g chives, green leaves
- 15 ml lemon-juice, fresh
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Dice the peeled potatoes. Boil them until tender, then drain.
2. Crumble the tofu into a wide pan with the oil, ginger, cumin and half the salt. Cook for 6 minutes.
3. Add the potatoes, spinach and chives. Stir until the spinach wilts and the potato is hot, about 4 minutes. Add the lemon juice and the rest of the salt. Divide in two.

**Yield.** The pan divided evenly into two servings. Cooked potato weight has not been measured. There is no rice in this dish.

**Evidence note.** A potato plate, so the week is not rice at every meal. Potato is 250 g raw per person and is not claimed against the 75 g staple serve. Spinach has no FODMAP serve in this packet. Firm tofu is 150 g per person, a kitchen portion.

### M7 — Ginger cabbage and tofu with rice

savoury dinner. 2 servings. Prep about 15 min, cook about 45 min.

**Each serving, low salt:** 679 kcal, 27.3 g protein, 10.1 g fibre, 579.1 mg calcium from mapped rows, 6.2 mg iron, 241 mg sodium, 474 mg sodium at standard salt.

**Ingredients, per serving**

- 90 g brown-rice, dry, for two servings
- 270 g water, potable, for the rice
- 140 g tofu, firm, calcium-set, drained, for two servings
- 80 g cabbage, raw, shredded
- 75 g carrots, raw, peeled
- 12 g olive-oil, plain
- 10 g ginger-fresh, peeled
- 1 g turmeric-ground
- 8 g chives, green leaves
- 15 ml lemon-juice, fresh
- 0.4 g salt, low-salt amount for two servings (low salt 0.4 g; standard salt 1 g)

**Method**

1. Cook the rice in its water, covered, for about 35–40 minutes.
2. Shred the cabbage and slice the carrot. Warm the oil with the ginger and turmeric, add the tofu, and cook for 6 minutes.
3. Add the cabbage, carrot and chives. Cover and cook for about 8 minutes, until the cabbage is tender but still green. Stir in the lemon juice and salt.
4. Serve half the rice with half the pan.

**Yield.** Divided evenly into two servings. If Monday lunch is the second serving, cook this on Sunday evening so the rice is eaten within a day.

**Evidence note.** Carrot is 75 g per person, the staple serve named on the 3 Feb 2025 shopping list. Cabbage on that list is grouped with leafy vegetables at 75 g; this draft uses 80 g per person, so the cabbage is not claimed. Rice is 90 g dry per person. Firm tofu is 140 g per person.

### S1 — Lemon carrots

savoury side. 1 serving. Prep about 5 min, cook about 12 min.

**Each serving, low salt:** 104 kcal, 0.8 g protein, 2.2 g fibre, 29 mg calcium from mapped rows, 0.3 mg iron, 130 mg sodium, 285 mg sodium at standard salt.

**Ingredients, per serving**

- 75 g carrots, raw, peeled
- 80 g water, potable
- 8 g olive-oil, plain
- 8 ml lemon-juice, fresh
- 4 g chives, green leaves
- 0.2 g salt, low-salt amount (low salt 0.2 g; standard salt 0.6 g)

**Method**

1. Slice the carrot. Simmer it in the water for about 8 minutes, until just tender. Drain.
2. Toss with the oil, lemon juice, chives and salt.

**Yield.** One plate. Cooked weight has not been measured. Counted in the day’s total.

**Evidence note.** 75 g raw carrot matches the staple serve named for carrot on the Monash blog shopping list (3 Feb 2025). That is not a test of this side.

### N1 — Orange

sweet snack. 1 serving. Prep about 2 min, cook about 0 min.

**Each serving, low salt:** 71 kcal, 1.4 g protein, 3.6 g fibre, 60 mg calcium from mapped rows, 0.2 mg iron, 0 mg sodium.

**Ingredients, per serving**

- 150 g oranges, raw, peeled

**Method**

1. Peel and eat the orange.

**Yield.** One snack, counted in the day’s total.

**Evidence note.** BMC Nutrition 2020 gives an orange composition, including a small fructan figure, and no serving limit. 150 g peeled fruit is one snack, not a certified serve.

### N2 — Carrot and peanut butter

savoury snack. 1 serving. Prep about 5 min, cook about 0 min.

**Each serving, low salt:** 125 kcal, 4.7 g protein, 3.1 g fibre, 32.6 mg calcium from mapped rows, 0.5 mg iron, 84 mg sodium.

**Ingredients, per serving**

- 75 g carrots, raw, peeled
- 16 g peanut-butter, peanuts only, smooth

**Method**

1. Cut the carrot into sticks. Eat it with the peanut butter.

**Yield.** One snack. Used on one day only, not stacked through the week.

**Evidence note.** Carrot 75 g as on S1. Peanut butter has no serving limit in the sources used here. The 2018 US assay found some fructose and fructo-oligosaccharides in the peanut butter they tested; that is not a green-serve rating. 16 g is one smear, not a handful of nuts. Skip it if peanuts are excluded; that day then uses an orange instead, and the total drops by the difference.

## Still not a finished clinical plan

- No whole plate has been reviewed. Public notes are not approval.
- Brands are unnamed. Tofu calcium, chickpea sodium, oat gluten contact and any fortification in a soy drink have to be read off the packet you buy.
- A soy-free week that still reaches the protein figure is not in this menu.
- B12, vitamin D and iodine are not covered. ALA is covered only in the small amount the oils and seeds actually contain.
- Cooked weights are still unmeasured.
- Do not copy this file into the app’s production FODMAP dataset.

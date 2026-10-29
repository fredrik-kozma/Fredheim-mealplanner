# Salty main meals: proposals for Fredrik

Written 2026-10-29. Main meals (lunch/dinner) above 1000 mg sodium per serving at **Low salt** (the recipe as written), in all packs. The three non-Fredheim packs (healthy-basics, mediterranean, nordic-classics) and the FMD pack have none.

Each recipe was checked for a data or calculation error first: wrong unit, wrong serving count or bowl size, a bouillon cube counted wrong, a wrong food-composition match, or a stored panel that disagrees with the ingredients. Those errors are already **fixed** in the packs (section A). What is left is the recipe itself: too much salt, bouillon or soy sauce. **Nothing in section B has been changed.** Approve or reject each one; an approved one is a change to the ingredient rows (en/no/sv alike) followed by `label-recipes --write` and `build_salt_levels.mjs --write`.

Sodium is calculated from the ingredient rows (`scripts/data/food-composition-core.json`: salt 38.8 g Na/100 g, 1 tsp = 6 g; bouillon powder 20 g Na/100 g, 1 tbsp = 12 g; soy sauce 5.5 g/100 g; herb salt 34 g/100 g). Canned beans and broth stay ordinary salted products, as you decided. Target for a main meal at Low salt: ≤ ~600 mg (heart-healthy and blood-pressure limit). After an approved change, `build_salt_levels.mjs` gives the recipe a Standard amount of about 650–700 mg (cap 750).

## A. Data / calculation errors found and fixed (no recipe change)

| Recipe | Cause | Fix | Sodium/serving at Low salt |
|---|---|---|---|
| Broccoli Soup (`broccoli-soup`) | Serving weight 614 g, but the whole batch is 1767 g → 4 bowls of ~440 g. Stored panel sodium 4151 mg vs 3020 mg from the ingredients (panel ~37 % high). | servingWeightGrams 614 → 440, portion text en/no/sv; sodium from the ingredients | 4151 → **3020** (still too salty, see B1) |
| Pumpkin Soup (`pumpkin-soup`) | Bowl of 702 g (4 kg soup in 6 bowls). | 6 → 10 servings of ~400 g; panel rescaled | 2907 → **1744** (still too salty, B2) |
| Roasted Pepper Seitan Sausages (`fr-143`) | No data error: 8 servings of ~2 sausages (the method makes 110 g sausages from ~2 kg dough). The stored panel is 10 % above the ingredients (2736 vs 2493 mg), within tolerance, so not changed. | – | 2736 (B3) |
| Lasagna (`fr-94`) | No data error: the duplicate "1 tbsp salt" row was already removed earlier; panel = ingredients; 7 pieces of ~294 g are realistic. | – | 1631 (B4) |
| Cabbage Soup (`fr-27`) | Bowl of 627 g. | 4 → 6 servings of ~420 g | 1849 → **1233** (B5) |
| Cauliflower Soup (`cauliflower-soup`) | Stored sodium 1481 vs 1126 mg from the ingredients (panel ~32 % high). | sodium from the ingredients | 1481 → **1126** (B6) |
| Marika's Tofu Balls (`fr-101`) | Stored sodium 587 vs 1150 mg from the ingredients (panel ~half: 4 tbsp soy sauce + 5 tsp bouillon in 811 g). It even had a Standard amount on top (670 mg). | sodium from the ingredients; the Standard amount is removed (already above target) | 587 → **1150** (B11) |
| Potato and Spinach Soup (`potato-and-spinach-soup`) | Bowl of 618 g, more than the batch allows; stored sodium 796 vs the ingredients (panel ~34 % low). | 6 → 8 servings of ~420 g; sodium from the ingredients | 796 → **908** (under 1000, C1) |
| Ukrainian Borscht (`fr-184`) | Bowl of 584 g; stored sodium ~24 % above the ingredients. | 7 → 10 servings of ~380 g; sodium from the ingredients | 1352 → **760** (under 1000, C2) |

Checked and correct: the bouillon match (powder/cube, ~50 % salt, 4 g a tsp / 12 g a tbsp, in line with Toro/Knorr labels), spoon weights for salt, and the units of every salt, bouillon and soy row in these recipes.

**One question for you (B1, B3, B5, B6, B7, B11, C2):** the dictionary entry is "Vegetable bouillon (powder/cube)". If these Fredheim soups actually mean the pack's own *Fresh Vegetable Bouillon* paste (`fr-69`, ~987 mg sodium a tbsp against ~2400 mg for powder), the rows should point to that instead. Broccoli Soup would then be ~1600 mg, which is still too salty. If that is the case, tell me and I'll re-match the rows rather than cut the amounts.

## B. Recipes that are too salty as written: proposals (approve one by one)

"Calc" = from the ingredient rows. Where the stored panel differs from calc, the stored value would be replaced by calc on approval.

**All of B and C were approved and applied on 2026-10-29** by `scripts/apply_salty_mains.mjs` (results in section D).

### B1. Broccoli Soup (`broccoli-soup`, fredheim-recipes-with-pictures) [x] **approved, applied** 2026-10-29
- Cause: 4 tbsp bouillon powder (≈ 9.6 g sodium) for 1 l of water, plus 1 tsp salt. That is ~680 mg sodium per 100 g, about twice a salty commercial soup. It may be a tsp/tbsp slip.
- Proposal: vegetable bouillon **4 tbsp → 2 tsp**; salt **1 tsp → ¼ tsp** (method: "a pinch" when sweating, salt to taste at the end, unchanged).
- Sodium/serving: **3020 → 584 mg**.
- Also note: 4 tbsp olive oil (method sweats in oil). Oil-free version: sweat the onion and garlic in 3–4 tbsp water. That would earn oil-free and, with the salt fix, heart-healthy.

### B2. Pumpkin Soup (`pumpkin-soup`) [x] **approved, applied** 2026-10-29
- Cause: 2.5 tbsp (45 g) salt for ~4 kg soup. Probably 2.5 **tsp** was meant.
- Proposal: salt **2.5 tbsp → 2.5 tsp**.
- Sodium/serving: **1744 → ~590 mg** (calc 1758 → 595).

### B3. Roasted Pepper Seitan Sausages (`fr-143`) [x] **approved, applied** 2026-10-29
- Cause: 2 tbsp (36 g) salt + 2 tbsp bouillon powder + 2 tbsp hot sauce in ~2 kg dough: ~1.8 % salt, saltier than a commercial sausage.
- Proposal: salt **2 tbsp → ¾ tsp**; vegetable bouillon **2 tbsp → 2 tsp**.
- Sodium/serving: stored 2736 / calc **2493 → 567 mg** (stored replaced by calc).
- Also note: contains 1 tbsp honey (not no-added-sugar).

### B4. Lasagna (`fr-94`) [x] **approved, applied** 2026-10-29
- Cause: 1 tbsp (18 g) salt in the tofu–spinach filling (≈ 1000 mg a serving on its own), plus the White Cashew Sauce (`fr-191`, 2 tsp salt: ≈ 400 mg a serving of lasagna) and 1 tsp bouillon.
- Proposal: filling salt **1 tbsp → ½ tsp**; and in the White Cashew Sauce (`fr-191`) salt **2 tsp → 1 tsp** (that sauce is then 343 mg instead of 664 mg a serving on its own).
- Sodium/serving: **1631 → ~596 mg** (filling −831, sauce −204). Without the sauce change: 800 mg.
- Alternative if you'd rather not touch the sauce: filling salt ½ tsp and leave out the 1 tsp bouillon → 686 mg.

### B5. Cabbage Soup (`fr-27`) [x] **approved, applied** 2026-10-29
- Cause: 2 tbsp bouillon powder + 1 tsp salt for 2.5 kg soup.
- Proposal: vegetable bouillon **2 tbsp → 1 tbsp**; salt **1 tsp → ¼ tsp**.
- Sodium/serving: **1233 → 542 mg**.
- Also note: 2 tbsp olive oil. Water-sauté instead → oil-free.

### B6. Cauliflower Soup (`cauliflower-soup`) [x] **approved, applied** 2026-10-29
- Cause: 2 tbsp bouillon powder + ¾ tsp salt.
- Proposal: vegetable bouillon **2 tbsp → 1 tbsp**; salt **¾ tsp → ¼ tsp**.
- Sodium/serving: **1126 → 532 mg**.

### B7. Chinese Soup (`chinese-soup`) [x] **approved, applied** 2026-10-29
- Cause: 2 tbsp salt + 4 tbsp bouillon powder in 7.5 kg soup.
- Proposal: salt **2 tbsp → 1 tsp**; vegetable bouillon **4 tbsp → 2 tbsp**.
- Sodium/serving: stored 1765 / calc **1591 → 564 mg** (stored replaced by calc).
- Also note: 3 tbsp olive oil and coconut milk (no heart-healthy because of the coconut fat whatever the salt).

### B8. Breaded Tofu Sticks (`breaded-tofu-sticks`) [x] **approved, applied** 2026-10-29
- Cause: two salt rows (¼ tsp in the batter, ½ tsp in the crumb) for 2 servings, plus gluten-free breadcrumbs (~220 mg).
- Proposal: batter salt **¼ tsp → none**; crumb salt **½ tsp → ¼ tsp**.
- Sodium/serving: **1092 → ~540 mg** (calc 1121 → 540).

### B9. Golden Soup (`golden-soup`) [x] **approved, applied** 2026-10-29
- Cause: 2.5 tsp salt for 2.2 kg soup. Stored 969 mg, calc 1004.
- Proposal: salt **2.5 tsp → 1¼ tsp**.
- Sodium/serving: **~1000 → ~520 mg**.

### B10. Kale Soup (`kale-soup`) [x] **approved, applied** 2026-10-29
- Cause: 2 tbsp herb salt (~90 % salt) for 3.2 kg soup.
- Proposal: herb salt **2 tbsp → 1 tbsp**.
- Sodium/serving: **1035 → 525 mg**.

### B11. Marika's Tofu Balls (`fr-101`) [x] **approved, applied** 2026-10-29
- Cause: 4 tbsp soy sauce + 5 tsp bouillon powder in 811 g mixture (~1 g sodium per 100 g).
- Proposal: soy sauce **4 tbsp → 2 tbsp**; vegetable bouillon **5 tsp → 2 tsp**.
- Sodium/serving: **1150 → 548 mg**.

### B12. Noodle Wok (`noodle-wok`) [x] **approved, applied** 2026-10-29
- Cause: 6 tbsp soy sauce + 1 tbsp salt + 10 tbsp ketchup. Stored 993 mg, calc 1196.
- Proposal: salt **1 tbsp → none** (the soy sauce seasons it); soy sauce **6 tbsp → 5 tbsp**.
- Sodium/serving: calc **1196 → 539 mg** (stored replaced by calc).
- Also note: 6 tbsp sesame oil. Oil-free: stir-fry in a splash of water and add 1 tsp toasted sesame seeds per plate for the flavour.

### B13. Roasted Salad (`roasted-salad`, lunch/dinner/side) [x] **approved, applied** 2026-10-29
- Cause: four salt rows totalling 5 tsp (1½ + 1½ + ½ + 1½) for 10 bowls.
- Proposal: **1½ → ½ tsp** (beetroot), **1½ → ½ tsp** (carrots), **½ → ¼ tsp** (pecans), **1½ → ½ tsp** (kale dressing).
- Sodium/serving: stored 1163 / calc **1264 → 509 mg**.
- Also note: 6 tbsp olive oil (roast on parchment instead) and 3 tbsp maple syrup.

### B14. Thai Soup (`fr-172`) [x] **approved, applied** 2026-10-29
- Cause: 5 tsp salt for 6.25 kg soup. Stored 969 mg, calc 1023.
- Proposal: salt **5 tsp → 2½ tsp**.
- Sodium/serving: **~1000 → ~520 mg**.

### B15. Za'atar Hummus Plate (`zaatar-hummus-salad`) [x] **approved, applied** 2026-10-29
- Cause: 240 g shop-bought hummus (~455 mg a plate), 34 g kalamata olives (~220 mg), 17 g capers (~200 mg) and bread. Stored 779 mg; calc 1029 mg with an ordinary commercial hummus (brand-dependent).
- Proposal: olives **34 g → 17 g**; capers **17 g → 8 g** (rinsed); hummus: use the pack's Classic Hummus (or a low-salt hummus), with a note on the row.
- Sodium/serving: calc **1029 → ~605 mg** (olives/capers 813, homemade hummus −208).
- Also note: 20 ml olive oil in the dressing.

## C. Under 1000 mg after the data fixes, still above 600 (optional)

- C1. Potato and Spinach Soup (`potato-and-spinach-soup`): 908 mg. Salt **2 tsp → ¾ tsp** → **544 mg**. [x] **approved, applied** 2026-10-29
- C2. Ukrainian Borscht (`fr-184`): 760 mg. Vegetable bouillon **2 tbsp → 1 tbsp** → **520 mg**. [x] **approved, applied** 2026-10-29

## D. Applied 2026-10-29 (`scripts/apply_salty_mains.mjs`, pack 1.67.0 → 1.68.0)

Proposal amounts exactly, in en/no/sv. Extra decisions: B1 and B5 water-sauté (oil row removed); B12 water stir-fry, tofu baked on baking paper, sesame oil and salt rows removed, 36 g toasted sesame seeds added (1 tsp a plate); B13 roasted on baking paper (both oil rows removed, maple syrup kept); B4 also White Cashew Sauce (`fr-191`) salt 2 → 1 tsp; B8 the batter salt row removed; B15 the hummus row is the pack's Classic Hummus (new `classic-hummus` dictionary entry, `homemade`, with a composition row from that recipe's panel, like `white-cashew-sauce`), olives 17 g, capers 8 g rinsed, oil kept. Bouillon stays bouillon powder. Sodium is the ingredient calculation; other panel fields changed by the calculated difference (Broccoli Soup's panel, already far off, taken from the calculation). Then `label-recipes --write` and `build_salt_levels.mjs --write`.

| Recipe | Sodium Low → (Standard) | Labels gained |
|---|---|---|
| B1 Broccoli Soup | 3020 → **584** (729) | weight-loss, diabetes-friendly, heart-healthy, oil-free |
| B2 Pumpkin Soup | 1744 → **595** (653) | – |
| B3 Seitan Sausages | 2736 → **567** (640) | heart-healthy |
| B4 Lasagna | 1631 → **607** (none: already near target) | – |
| B4 White Cashew Sauce | 664 → **343** | – |
| B5 Cabbage Soup | 1233 → **542** (639) | diabetes-friendly, heart-healthy, oil-free |
| B6 Cauliflower Soup | 1126 → **532** (629) | blood-pressure-friendly, heart-healthy |
| B7 Chinese Soup | 1765 → **564** (673) | – |
| B8 Breaded Tofu Sticks | 1092 → **540** (none: ¼ tsp would pass the cap) | heart-healthy |
| B9 Golden Soup | 969 → **519** (713) | – |
| B10 Kale Soup | 1035 → **525** (none: ¼ tsp would pass the cap) | heart-healthy |
| B11 Marika's Tofu Balls | 1150 → **548** (631) | heart-healthy |
| B12 Noodle Wok | 993 → **539** (684, new "to taste" salt row) | heart-healthy, oil-free |
| B13 Roasted Salad | 1163 → **508** (none: salad) | oil-free |
| B14 Thai Soup | 969 → **538** (683) | – |
| B15 Za'atar Hummus Plate | 779 → **606** (none: already near target) | – |
| C1 Potato and Spinach Soup | 908 → **544** (689) | blood-pressure-friendly, heart-healthy |
| C2 Ukrainian Borscht | 760 → **520** (694) | heart-healthy |

No labels lost. Open: Cabbage Soup without oil is 47 kcal a 420 g bowl, under check-recipes' 50 kcal floor for a lunch/dinner (`implausible-kcal`); left for Fredrik to decide.

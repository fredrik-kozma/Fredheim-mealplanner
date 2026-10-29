# Menu planner — notes for Claude Code

## Adding or editing recipes - ingredient standard (MANDATORY)

The shopping list combines rows by ingredient id, so every new or edited
recipe row has to follow the dictionary standard. Do not change app code or
existing recipes as part of adding a recipe.

**Workflow.** The user pastes complete recipes (with nutrition) and a
picture. Write a one-off script `scripts/add_<what>.cjs` (see the existing
`scripts/add_*.cjs`) that inserts the recipes into the right pack in
`recipe-packs-template/packs/`, stamps `createdAt` above the highest
`createdAt` in *all* packs, and **bumps the pack `version`** (otherwise
installed copies never update — INGREDIENT_UNITS.md §7).

**Every ingredient row** looks like
`{ quantity, unit, ingredient: "<id>", name: "<standard name>", note?: "<extra words>" }`
in `ingredients`, `translations.no.ingredients` and `translations.sv.ingredients`.

1. **Id.** Look the ingredient up in `src/data/ingredientDictionary.json`
   (helper: `src/utils/ingredientDictionary.js`) by standard name, singular
   form and synonyms, in en, no and sv. Set `ingredient` to its `id`.
2. **Name.** `name` is exactly `entry.names[lang]` for that language — the
   plural standard name, even for "1 lemon" (the app shows the singular).
3. **Note.** Everything descriptive goes in `note`, never in `name`: raw,
   fresh, Norwegian, organic, finely chopped, peeled, pressed, drained, "to
   taste", "about 2 lemons", "for frying". Notes are per language (en/no/sv).
4. **Unit.** Use the entry's `preferredUnit` and
   `recipe-packs-template/INGREDIENT_UNITS.md`: solids in grams; liquids in
   ml/dl/l or spoons; spices, salt and powders in tsp/tbsp; garlic in
   `clove`; lemons, limes, cans, sheets as `pcs`. Pinch of salt or "to taste"
   is `quantity: null, unit: ""` with the words in the note. Never
   `quantity: 0`, never a number without a unit.
5. **Fruit vs juice are different ingredients.** "Juice of 1 lemon" is
   `lemon-juice` in tbsp (1 lemon = 3 tbsp, 1 lime = 2 tbsp); "zest of 1
   lemon" is `lemons`, 1 pcs, note "zest". Same idea for other
   ingredient/product pairs (dried vs fresh herbs, etc.) where the
   dictionary has two entries.
6. **Three languages.** Title, description, ingredient names/notes and steps
   in en, no and sv. The three ingredient lists have the same length and,
   per index, the same id, quantity and unit.
7. **Not in the dictionary?** Do **not** invent an id, a near-duplicate, or
   fall back to a free-text name. Stop and ask the user, proposing a new
   entry: `id`, `names` en/no/sv, `singular` (if countable), `synonyms`,
   `aisle` (one of the dictionary's `aisles`), `preferredUnit`, and
   `spoonGrams` when rule 8 applies. Add it to the dictionary only after
   they approve.
8. **Spoon weights.** Small amounts of spoon-measured ingredients (seeds,
   powders, pastes, spices, yeast, herbs, etc.) are stored in grams, and
   the recipe view shows "4 g (≈ 2 tsp)" automatically
   (`src/utils/gramSpoonHint.js`). That only works when the dictionary
   entry has `"spoonGrams": { "gPerTsp": <number> }` (a tbsp is 3 × that;
   placed right after `preferredUnit`). Every such entry must have it. When
   proposing a new entry of that kind, include a realistic `gPerTsp` with a
   short basis note (USDA, package, house conversion — see
   `scripts/data/spoon-hints.json` for examples), and ask Fredrik if
   unsure. check-recipes flags a gram row under 30 g of such an ingredient
   without `spoonGrams` (`missing-spoon-grams`: a warning normally, an
   error under `--strict`).

## Recipe rules: portions, nutrition, time, meal types, labels (MANDATORY)

Every new recipe must integrate with Make my week, the shopping list and the
good-for filters without hand work. The criteria live in
`scripts/lib/recipeLabels.mjs` (the same code the label report
`scripts/build_recipe_proposals.mjs` and check-recipes use).

- **Servings + portion.** `servings` is a realistic whole number of portions
  for the batch (a loaf is 2 slices a serving, a soup ~350 g a bowl, a
  spread 30 g), `servingWeightGrams` the eaten portion in grams, and
  `portion` describes it in en, with `translations.no.portion` and
  `translations.sv.portion` ("2 slices (~116 g)" / "2 skiver (~116 g)" /
  "2 skivor (~116 g)").
- **Nutrition.** `nutrition.perServing` (calories, protein, totalFat,
  saturatedFat, totalCarbs, fiber, totalSugars, addedSugar, sodium,
  potassium) is calculated from the ingredient rows with
  `scripts/data/food-composition-core.json` (`npm run label-recipes` prints
  it). If the pasted nutrition disagrees, say so and use the calculation
  unless the user decides otherwise. `kcal` = rounded calories. A food
  missing from the composition table: propose an entry (per 100 g, with its
  USDA/label source) and ask, like a dictionary entry.
- **Time.** `prepTime` and `cookTime` in minutes; waiting (soaking, rising,
  setting) goes in cookTime.
- **Meal types.** `mealTypes` from breakfast, lunch, dinner, snack, side,
  dessert, component (label-recipes suggests them from the category).
- **Labels are computed, never hand-guessed.** The good-for tags
  (weight-loss, blood-pressure-friendly, diabetes-friendly, heart-healthy,
  gluten-free, nut-free, soy-free, oil-free, no-added-sugar, quick,
  batch-friendly, kid-friendly) are exactly what the criteria compute;
  `npm run label-recipes -- --recipe <id> --write` writes them. Other tags
  (vegan, ornish-…) are kept.
- **Salt level (two levels, Fredrik's decision).** *Low salt* is the
  recipe exactly as written (blood pressure, heart or kidney disease: main
  meals about ≤ 600 mg sodium a serving); write recipes at that level.
  *Standard* (healthy adults, WHO < 5 g salt a day) is an optional
  `standardAmount` on the recipe's salt row (same unit as the row; a
  "to taste" row with `unit: ""` also gets `standardUnit: "tsp"`), in en,
  no and sv alike, plus `nutrition.sodiumStandard` (mg a serving at
  standard). Targets at standard: a main meal ~650–700 mg (never over
  750), a savoury breakfast or bread ≤ 400 mg. Only salt (or the recipe's
  herb salt) is raised; soy sauce/tamari, miso, bouillon may carry one but
  canned beans and broth never change. Sweet recipes, components, sauces,
  spreads, sides and salads get none. A savoury main with no salt row gets
  a "to taste" salt row with a standard amount. Health labels are always
  judged on the low-salt recipe (`scripts/lib/recipeLabels.mjs` unchanged).
  `node scripts/build_salt_levels.mjs --write` decides all of this
  (rules in `scripts/lib/saltLevels.mjs`), bumps changed pack versions and
  writes `scripts/data/salt-level-proposals.md`.
- **Flavour.** Every breakfast recipe (not bread) and every spread or jam
  has `flavourProfile: "sweet" | "savoury"` (Make my week's breakfast
  question); the same script sets it from sugars and ingredients. Check
  the report and correct the rule in `scripts/lib/saltLevels.mjs` (not the
  pack by hand) if a recipe is misjudged.
- **Oil-free methods preferred.** Sauté in water or broth, bake on
  parchment, dress with tahini/lemon rather than oil. Oil (in an ingredient
  row or the method text) costs oil-free, heart-healthy and
  diabetes-friendly. Keep the recipe as the user wrote it, but point it out
  and offer the oil-free version.

**Steps for adding a recipe:**

1. Look up every ingredient (rules 1–8 above); ask about missing dictionary
   or composition entries first.
2. Write `scripts/add_<what>.cjs`: rows, servings, portion (en/no/sv),
   servingWeightGrams, prepTime/cookTime, mealTypes, `createdAt` above the
   max in all packs, and bump the pack `version`. Run it.
3. `npm run label-recipes -- --recipe <id>`: compare the calculated
   nutrition with the pasted one, check meal types and the oil note; fix the
   add script if needed, then run again with `--write` (labels, and
   nutrition/mealTypes only where missing).
4. `node scripts/build_salt_levels.mjs --write`: standard salt amount and
   flavourProfile (see above); check the new recipe's line in
   `scripts/data/salt-level-proposals.md`.
5. Run the checks below, and report what was standardized, which labels
   the recipe got, and its salt level (low → standard sodium).

**Before finishing:**

```
npm run check-recipes -- --recipe <new-id>[,<id>...] --strict   # new recipes must be fully clean
npm run check-recipes                                           # whole collection: no new problems
npm test
```

check-recipes fails a recipe added after the rules came in that lacks any of
the fields above, has a per-serving energy over 1500 kcal (or under 50 for a
meal), nutrition that disagrees with its ingredients, or labels that differ
from the computed ones. It also fails a `standardAmount` on a row that isn't
salt/soy sauce/tamari/miso/bouillon, below the row's amount, without a unit
or different between languages, a missing or wrong `sodiumStandard`, one
over the cap, a standard amount on a sweet recipe, and a breakfast/spread
without `flavourProfile`. Older recipes only get a counted warning for a
missing portion description.

Fix every reported problem (don't add to the baseline to silence it). Then
report briefly what was standardized: ids matched, words moved to notes,
units converted, and any dictionary entries added.

`scripts/data/check-recipes-baseline.json` lists the known leftovers in the
existing packs (shown as warnings). Only regenerate it
(`npm run check-recipes -- --update-baseline`) when the user asks.

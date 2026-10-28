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

**Before finishing:**

```
npm run check-recipes -- --recipe <new-id>[,<id>...] --strict   # new recipes must be fully clean
npm run check-recipes                                           # whole collection: no new problems
npm test
```

Fix every reported problem (don't add to the baseline to silence it). Then
report briefly what was standardized: ids matched, words moved to notes,
units converted, and any dictionary entries added.

`scripts/data/check-recipes-baseline.json` lists the known leftovers in the
existing packs (shown as warnings). Only regenerate it
(`npm run check-recipes -- --update-baseline`) when the user asks.

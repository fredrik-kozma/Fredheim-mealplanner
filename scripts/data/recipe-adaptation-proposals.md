# Recipe adaptation proposals: hearty mains for diabetes, heart and blood pressure

Generated 2026-10-29 by `scripts/build_recipe_adaptation_proposals.mjs` from fredheim-recepies-with-pictures 1.63.0, fredheim-reversal-protocol 1.59.0. **Proposal only: nothing has been changed in the packs.** Machine-readable copy with the full adapted ingredient lists (en/no/sv): `recipe-adaptation-proposals.json`.

Labels are judged by the existing criteria (`scripts/lib/recipeLabels.mjs`, the same as the label report and check-recipes), unchanged. Per-serving nutrition after the change is recalculated from the adapted ingredient rows (`scripts/data/food-composition-core.json`); "now" shows both the stored panel and the same calculation on today's rows, so the change can be compared like for like. Sodium follows the settled decision: canned beans and broth count as ordinary salted products. **Doctor's decision: canned beans and broth stay exactly as they are** (no switch to no-salt-added or unsalted products; the generator refuses one), so sodium comes down by cutting added salt, soy sauce and bouillon, with more vegetables, herbs, spices or lemon for flavour.

## Summary

| # | Recipe | Key changes | Health labels now → proposed | Gained | Lost |
|---|---|---|---|---|---|
| 1 | Black Bean Stew (`black-bean-stew`) | Water sauté instead of olive oil; bouillon left out (the canned beans carry the salt), 400 g zucchini added so the bowl is bigger and less salty per 100 g; lime 1 → 2 tbsp. | WL → WL BP DIA HRT | BP DIA HRT OIL0 | — |
| 2 | Dal Stew (`dal-stew`) | Whole spices dry-toasted and onions water-sautéed instead of 4 tbsp olive oil; salt 1 tsp → ¼ tsp (lemon carries the flavour). | — → WL BP DIA HRT | WL BP DIA HRT OIL0 | — |
| 3 | Kidney Bean Stew (`kidney-bean-stew`) | Honey left out; salt (½ tbsp) left out and bouillon 2 tbsp → 1 tsp (the canned beans carry the salt); 2 tbsp lemon juice stirred in at the end for brightness. | — → WL BP DIA HRT | WL BP DIA HRT NAS | — |
| 4 | Lentil Lap Stew (`lentil-lap-stew`) | Lentils cooked without salt; bouillon 2 tbsp → 1 tbsp (same water); 2 tbsp lemon juice stirred in with the parsley. | WL DIA → WL BP DIA HRT | BP HRT | — |
| 5 | Creamy Red Lentil Stew (`creamy-red-lentil-stew`) | Potatoes → cauliflower (fewer starchy carbs, more vegetables); salt (1½ tsp) left out, the broth stays as it is; 6 bowls instead of 4 (the stored 733 g, 535 kcal bowl is closer to two portions). | — → WL BP DIA HRT | WL BP DIA HRT | — |
| 6 | Red Lentil Soup (`red-lentil-soup`) | Coconut milk → unsweetened soy drink; pineapple juice left out (2 dl more water and 2 tbsp lemon juice instead); salt left out and bouillon 3 tbsp → 2 tsp. | — → WL BP DIA HRT | WL BP DIA HRT NAS | SOY0 |
| 7 | Buckwheat Burger (`fr-23`) | Salt and herb salt left out, bouillon 2 tsp → 1 tsp (nutritional yeast, marjoram and parsley season it). | DIA → BP DIA HRT | BP HRT | — |
| 8 | Oat Burger (`oat-burger`) | Soy sauce 1.25 dl → 0.4 dl (the usual kind); bouillon left out; 2 tsp smoked paprika added and garlic powder 2 → 3 tsp for flavour. | WL DIA → WL BP DIA HRT | BP HRT | — |
| 9 | Red Beet Burger (`red-beet-burger`) | Olive oil, salt and bouillon left out (onion water-sautéed); soy sauce 2 → 1 tbsp; the chickpeas stay as they are; 10 servings of 2 burgers instead of 5 of ~4–5 (624 kcal and 83 g carbs a serving). | — → WL BP DIA HRT | WL BP DIA HRT OIL0 | — |
| 10 | Walnut Patties (Oven-Baked) (`orn-20`) | Olive oil left out (onion water-sautéed, patties baked on parchment without brushing); salt and tamari left out (the canned beans carry the salt); smoked paprika 1½ → 2 tsp and 1 tbsp lemon juice for flavour. | — → BP DIA HRT | BP DIA HRT SOY0 OIL0 | — |
| 11 | Sweet Yellow Pea Soup (`sweet-yellow-pea-soup`) | Salt (2 tsp) left out and bouillon 4½ → 2 tbsp; 3 tbsp lemon juice stirred in at the end (garlic and onion powder carry the rest of the flavour). | WL DIA → WL BP DIA HRT | BP HRT | — |
| 12 | Stuffed Paprika with Tofu (`stuffed-paprika-with-tofu`) | Oil left out (water sauté); soy sauce 4 → 2 tbsp reduced-sodium; salt 2 tsp → ½ tsp. | WL → WL BP DIA HRT | BP DIA HRT OIL0 | — |
| 13 | Tofu Form (`tofu-form`) | Olive oil left out of the marinade; soy sauce 1 dl → 0.5 dl reduced-sodium. | WL → WL BP DIA HRT | BP DIA HRT OIL0 | — |
| 14 | Ciorbă de Fasole with Lemon-Pickled Red Onion — Stovetop (`orn-30`) | Dried beans 300 → 240 g and 150 g kale stirred in at the end: carbohydrate under 60 g a bowl, more greens. | WL BP HRT → WL BP DIA HRT | DIA | — |
| 15 | Ciorbă de Fasole with Lemon-Pickled Red Onion — Instant Pot, No Soak (`orn-31`) | Same change as the stovetop version: dried beans 300 → 240 g and 150 g kale stirred in at the end. | WL BP HRT → WL BP DIA HRT | DIA | — |

15 of 15 reach all three (diabetes-friendly, heart-healthy, blood-pressure-friendly). Codes: WL = weight-loss, BP = blood-pressure-friendly, DIA = diabetes-friendly, HRT = heart-healthy, GF = gluten-free, NUT0 = nut-free, SOY0 = soy-free, OIL0 = oil-free, NAS = no-added-sugar, Q = quick, BATCH = batch-friendly, KID = kid-friendly.

To approve, tick the box under each recipe (or list the ids). Approved recipes are applied with a one-off script that writes the en/no/sv rows and steps from the JSON, bumps the pack version and runs `npm run label-recipes -- --recipe <id> --write`.

## 1. Black Bean Stew (`black-bean-stew`)

fredheim-recepies-with-pictures, Svart bønnegryte / Svartbönsgryta. Water sauté instead of olive oil; bouillon left out (the canned beans carry the salt), 400 g zucchini added so the bowl is bigger and less salty per 100 g; lime 1 → 2 tbsp.

**Fails now:**

- diabetes-friendly: oil: olive-oil
- heart-healthy: oil: olive-oil; sodium 898 mg
- blood-pressure-friendly: sodium 350 mg/100 g > 140; sodium 898 mg > 600; potassium 288 mg < sodium (panel 715 mg; ingredient estimate 898 mg, counting black-beans-canned as ordinary salted products unless the row says low-sodium/no-salt/rinsed)

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 1 tbsp Olive oil | — | — | — |
| add | — | 400 g Zucchini (courgette) (diced) | 400 g Squash (i terninger) | 400 g Squash (tärnad) |
| remove | 1 tbsp Vegetable bouillon (powder/cube) | — | — | — |
| edit | 1 tbsp Lime juice | 2 tbsp Lime juice | 2 ss Limesaft | 2 tbsp Limejuice |

**Method changes:**

- Step 1, now: "Heat olive oil in a large pot over medium heat. Add the chopped onion and cook for about 3-5 minutes until softened and slightly golden. Add the garlic, bell pepper, and carrot, and cook for another 5-7 minutes until the vegetables are tender."
  - en: Heat 3–4 tbsp water in a large pot over medium heat. Add the chopped onion and cook for about 3–5 minutes until softened, adding a splash more water if it sticks. Add the garlic, bell pepper, carrot and zucchini, and cook for another 5–7 minutes until the vegetables are tender.
  - no: Varm 3–4 ss vann i en stor gryte på middels varme. Tilsett hakket løk og surr i ca. 3–5 minutter til den er myk, med en skvett vann til om den setter seg fast. Tilsett hvitløk, paprika, gulrot og squash, og surr i 5–7 minutter til grønnsakene er myke.
  - sv: Värm 3–4 msk vatten i en stor gryta på medelvärme. Tillsätt hackad lök och fräs i cirka 3–5 minuter tills den är mjuk, med en skvätt vatten till om den fastnar. Tillsätt vitlök, paprika, morot och zucchini, och fräs i 5–7 minuter tills grönsakerna är mjuka.
- Step 4, now: "Taste the stew and adjust with more salt or spices as needed."
  - en: Taste the stew and adjust with cumin, smoked paprika or chilli as needed (no added salt needed: the beans are salted).
  - no: Smak til gryten og juster med spisskummen, røkt paprika eller chili etter behov (ikke behov for ekstra salt: bønnene er saltet).
  - sv: Smaka av grytan och justera med spiskummin, rökt paprika eller chili efter behov (inget extra salt behövs: bönorna är saltade).

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 291 | 16 | 2.9 | 0.4 | 49 | 17 | 3.2 | 0 | 715 | 288 |
| now (from ingredients) | 240 | 12.9 | 4.1 | 0.7 | 40.4 | 13.6 | 4.8 | 0.1 | 898 | 755 |
| proposed | 224 | 13.7 | 1.4 | 0.3 | 42.4 | 14.4 | 6.6 | 0 | 425 | 958 |

**Labels:** now WL GF NUT0 SOY0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH. Gained: BP DIA HRT OIL0. Lost: —.

- ✓ diabetes-friendly: carbs 42.4 g, sugars 6.6 g, fibre 14.4 g, no oil
- ✓ heart-healthy: sat. fat 0.3 g, sodium 425 mg, fibre 14.4 g, no oil
- ✓ blood-pressure-friendly: sodium 425 mg (136 mg/100 g), K 958 mg

- [ ] Approve `black-bean-stew`

## 2. Dal Stew (`dal-stew`)

fredheim-recepies-with-pictures, Dal-gryte / Dalgryta. Whole spices dry-toasted and onions water-sautéed instead of 4 tbsp olive oil; salt 1 tsp → ¼ tsp (lemon carries the flavour).

**Fails now:**

- diabetes-friendly: oil: olive-oil
- heart-healthy: oil: olive-oil
- blood-pressure-friendly: sodium 329 mg/100 g > 140; potassium 300 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 4 tbsp Olive oil | — | — | — |
| edit | 1 tsp Salt | 0.25 tsp Salt | 0.25 ts Salt | 0.25 tsp Salt |

**Method changes:**

- Step 4, now: "In a seperate pot, heat a little olive oil, along with mustard seeds, bay leafs and fenugreek seeds."
  - en: In a separate dry pot, toast the mustard seeds, bay leaves and fenugreek seeds over medium heat, shaking the pot.
  - no: Rist sennepsfrø, laurbærblad og bukkehornsfrø i en annen, tørr kjele på middels varme, og rist kjelen underveis.
  - sv: Rosta senapsfrön, lagerblad och bockhornsklöverfrön i en annan, torr kastrull på medelvärme, och skaka kastrullen under tiden.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 381 | 17 | 14 | 1.9 | 45 | 21 | 2.8 | 0 | 581 | 300 |
| now (from ingredients) | 326 | 12.8 | 15.3 | 2.1 | 37.3 | 7.2 | 3.7 | 0 | 598 | 501 |
| proposed | 205 | 12.8 | 1.7 | 0.2 | 37.3 | 7.2 | 3.7 | 0 | 162 | 501 |

**Labels:** now GF NUT0 SOY0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH. Gained: WL BP DIA HRT OIL0. Lost: —.

- ✓ diabetes-friendly: carbs 37.3 g, sugars 3.7 g, fibre 7.2 g, no oil
- ✓ heart-healthy: sat. fat 0.2 g, sodium 162 mg, fibre 7.2 g, no oil
- ✓ blood-pressure-friendly: sodium 162 mg (98 mg/100 g), K 501 mg

- [ ] Approve `dal-stew`

## 3. Kidney Bean Stew (`kidney-bean-stew`)

fredheim-recepies-with-pictures, Kidneybønnegryte / Kidneybönsgryta. Honey left out; salt (½ tbsp) left out and bouillon 2 tbsp → 1 tsp (the canned beans carry the salt); 2 tbsp lemon juice stirred in at the end for brightness.

**Fails now:**

- diabetes-friendly: contains honey
- heart-healthy: sodium 2412 mg
- blood-pressure-friendly: sodium 603 mg/100 g > 140; sodium 2412 mg > 600; potassium 425 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| edit | 2 tbsp Vegetable bouillon (powder/cube) | 1 tsp Vegetable bouillon (powder/cube) | 1 ts Grønnsaksbuljong (pulver/terning) | 1 tsk Grönsaksbuljong (pulver/tärning) |
| remove | 1 tsp Honey | — | — | — |
| remove | 0.5 tbsp Salt | — | — | — |
| add | — | 2 tbsp Lemon juice | 2 ss Sitronsaft | 2 msk Citronsaft |

**Method changes:**

- Step 4, now: "With a hand blender, blend the stew a bit until it is creamy, some beans need to still be whole."
  - en: With a hand blender, blend the stew a bit until it is creamy, some beans need to still be whole. Stir in the lemon juice and taste (no added salt needed: the beans are salted).
  - no: Mos gryten litt med en stavmikser til den er kremet – noen av bønnene bør fremdeles være hele. Rør inn sitronsaften og smak til (ikke behov for ekstra salt: bønnene er saltet).
  - sv: Mosa grytan lite med en stavmixer tills den är krämig – några av bönorna bör fortfarande vara hela. Rör i citronsaften och smaka av (inget extra salt behövs: bönorna är saltade).

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 272 | 20 | 0.8 | 0.5 | 48 | 15 | 6.4 | 1.4 | 2412 | 425 |
| now (from ingredients) | 251 | 16.7 | 2.2 | 0.5 | 44.5 | 13.8 | 10.4 | 1.8 | 2412 | 1066 |
| proposed | 236 | 16.3 | 1.8 | 0.3 | 42 | 13.7 | 8.6 | 0.1 | 540 | 1052 |

**Labels:** now GF NUT0 SOY0 OIL0 BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH. Gained: WL BP DIA HRT NAS. Lost: —.

- ✓ diabetes-friendly: carbs 42 g, sugars 8.6 g, fibre 13.7 g, no oil
- ✓ heart-healthy: sat. fat 0.3 g, sodium 540 mg, fibre 13.7 g, no oil
- ✓ blood-pressure-friendly: sodium 540 mg (136 mg/100 g), K 1052 mg

- [ ] Approve `kidney-bean-stew`

## 4. Lentil Lap Stew (`lentil-lap-stew`)

fredheim-recepies-with-pictures, Lapskaus med linser / Linsgryta. Lentils cooked without salt; bouillon 2 tbsp → 1 tbsp (same water); 2 tbsp lemon juice stirred in with the parsley.

**Fails now:**

- heart-healthy: sodium 1477 mg
- blood-pressure-friendly: sodium 312 mg/100 g > 140; sodium 1477 mg > 600; potassium 703 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 1 tsp Salt | — | — | — |
| edit | 2 tbsp Vegetable bouillon (powder/cube) | 1 tbsp Vegetable bouillon (powder/cube) | 1 ss Grønnsaksbuljong (pulver/terning) | 1 tbsp Grönsaksbuljong (pulver/tärning) |
| add | — | 2 tbsp Lemon juice | 2 ss Sitronsaft | 2 msk Citronsaft |

**Method changes:**

- Step 1, now: "Place in a pot the lentils, water, salt, bay leafs and boil for 25-30 min. Afterwards, drain the liquid (Don’t worry if it is not done, it will cook a little longer later)."
  - en: Place the lentils, water and bay leaves in a pot (no salt) and boil for 25–30 min. Afterwards, drain the liquid (don’t worry if they are not done, they will cook a little longer later).
  - no: Ha linser, vann og laurbærblad i en kjele (uten salt) og kok i 25–30 minutter. Hell av væsken (ikke bekymre deg hvis de ikke er helt ferdige – de får lengre koketid senere).
  - sv: Lägg linser, vatten och lagerblad i en kastrull (utan salt) och koka i 25–30 minuter. Häll av vätskan (oroa dig inte om de inte är helt färdiga – de får längre koktid senare).
- Step 7, now: "Add the parsley and then is ready to serve."
  - en: Add the parsley and lemon juice, taste (no added salt needed), and serve.
  - no: Tilsett persille og sitronsaft, smak til (ikke behov for ekstra salt), og server.
  - sv: Tillsätt persilja och citronsaft, smaka av (inget extra salt behövs), och servera.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 206 | 10 | 0.2 | 0 | 41 | 12 | 4.1 | 0 | 1477 | 703 |
| now (from ingredients) | 198 | 8.8 | 1 | 0.3 | 40.6 | 6.7 | 5.3 | 0.2 | 1477 | 865 |
| proposed | 194 | 8.6 | 0.8 | 0.2 | 40.2 | 6.7 | 5.2 | 0.1 | 532 | 862 |

**Labels:** now WL DIA GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH. Gained: BP HRT. Lost: —.

- ✓ diabetes-friendly: carbs 40.2 g, sugars 5.2 g, fibre 6.7 g, no oil
- ✓ heart-healthy: sat. fat 0.2 g, sodium 532 mg, fibre 6.7 g, no oil
- ✓ blood-pressure-friendly: sodium 532 mg (112 mg/100 g), K 862 mg

- [ ] Approve `lentil-lap-stew`

## 5. Creamy Red Lentil Stew (`creamy-red-lentil-stew`)

fredheim-recepies-with-pictures, Kremet rød linsegryte / Krämig röd linsgryta. Potatoes → cauliflower (fewer starchy carbs, more vegetables); salt (1½ tsp) left out, the broth stays as it is; 6 bowls instead of 4 (the stored 733 g, 535 kcal bowl is closer to two portions).

**Fails now:**

- diabetes-friendly: carbs 78 g > 60
- heart-healthy: sodium 1672 mg
- blood-pressure-friendly: sodium 228 mg/100 g > 140; sodium 1672 mg > 600; potassium 631 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| replace | 240 g Potatoes (small, diced) | 300 g Cauliflower (small florets) | 300 g Blomkål (små buketter) | 300 g Blomkål (små buketter) |
| remove | 1.5 tsp Salt | — | — | — |
| servings | 4 × 733 g | 6 × 497 g, "1 bowl (~490 g)" | 1 bolle (~490 g) | 1 skål (~490 g) |

**Method changes:**

- Step 2, now: "Add cumin, smoked paprika, turmeric, cinnamon, coriander, and salt, stirring 30 seconds until fragrant."
  - en: Add cumin, smoked paprika, turmeric, cinnamon and coriander, stirring 30 seconds until fragrant.
  - no: Tilsett spisskummen, røkt paprikapulver, gurkemeie, kanel og koriander, og rør i 30 sekunder til det dufter.
  - sv: Tillsätt spiskummin, rökt paprikapulver, gurkmeja, kanel och koriander, och rör i 30 sekunder tills det doftar.
- Step 3, now: "Stir in lentils, potatoes, crushed tomatoes, broth, and date paste. Bring to boil."
  - en: Stir in lentils, cauliflower, crushed tomatoes, broth and date paste. Bring to the boil.
  - no: Rør inn linser, blomkål, knuste tomater, kraft og dadelpasta. Kok opp.
  - sv: Rör i linser, blomkål, krossade tomater, buljong och dadelpasta. Koka upp.
- Step 8, now: "Taste and adjust salt, lemon, and spices as needed."
  - en: Taste and adjust lemon and spices as needed (no added salt needed: the broth is salted).
  - no: Smak til med sitron og krydder etter behov (ikke behov for ekstra salt: kraften er saltet).
  - sv: Smaka av med citron och kryddor efter behov (inget extra salt behövs: buljongen är saltad).

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 535 | 26 | 13 | 2.3 | 78 | 13 | 10 | 0 | 1672 | 631 |
| now (from ingredients) | 594 | 28.4 | 16 | 2.7 | 92.1 | 15.6 | 18.8 | 0 | 1588 | 1437 |
| proposed (6 servings) | 377 | 19.1 | 10.8 | 1.8 | 56.9 | 10.5 | 13.2 | 0 | 490 | 937 |

**Labels:** now GF SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF SOY0 OIL0 NAS BATCH. Gained: WL BP DIA HRT. Lost: —.

- ✓ diabetes-friendly: carbs 56.9 g, sugars 13.2 g, fibre 10.5 g, no oil
- ✓ heart-healthy: sat. fat 1.8 g, sodium 490 mg, fibre 10.5 g, no oil
- ✓ blood-pressure-friendly: sodium 490 mg (99 mg/100 g), K 937 mg

- [ ] Approve `creamy-red-lentil-stew`

## 6. Red Lentil Soup (`red-lentil-soup`)

fredheim-recepies-with-pictures, Rød linsesuppe / Röd linssoppa. Coconut milk → unsweetened soy drink; pineapple juice left out (2 dl more water and 2 tbsp lemon juice instead); salt left out and bouillon 3 tbsp → 2 tsp.

**Fails now:**

- diabetes-friendly: sat. fat 18 g; added sugar 5.7 g; contains pineapple-juice
- heart-healthy: coconut fat: coconut-milk; sat. fat 18 g; sodium 2968 mg; added sugar 5.7 g
- blood-pressure-friendly: sodium 549 mg/100 g > 140; sodium 2968 mg > 600; potassium 691 mg < sodium; sat. fat 18 g; added sugar 5.7 g (a sweet)

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| replace | 3.5 dl Coconut milk | 3.5 dl Soy milk (unsweetened, no added sugar) | 3.5 dl Soyamelk (usøtet, uten tilsatt sukker) | 3.5 dl Sojamjölk (osötad, utan tillsatt socker) |
| edit | 6 dl Water (drinking water) | 8 dl Water (drinking water) | 8 dl Vann (drikkevann) | 8 dl Vatten (dricksvatten) |
| replace | 2 dl Pineapple juice | 2 tbsp Lemon juice | 2 ss Sitronsaft | 2 msk Citronsaft |
| remove | 0.5 tsp Salt | — | — | — |
| edit | 3 tbsp Vegetable bouillon (powder/cube) | 2 tsp Vegetable bouillon (powder/cube) | 2 ts Grønnsaksbuljong (pulver/terning) | 2 tsk Grönsaksbuljong (pulver/tärning) |

**Method changes:**

- Step 3, now: "Add remaining ingredients and cook until lentils are soft."
  - en: Add the lentils, tomatoes, water, soy drink and spring onions and cook until the lentils are soft. Stir in the lemon juice at the end (no added salt needed).
  - no: Tilsett linser, tomater, vann, soyadrikk og vårløk, og kok til linsene er myke. Rør inn sitronsaften til slutt (ikke behov for ekstra salt).
  - sv: Tillsätt linser, tomater, vatten, sojadryck och salladslök, och koka tills linserna är mjuka. Rör i citronsaften på slutet (inget extra salt behövs).

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 399 | 13 | 22 | 18 | 40 | 14 | 9.6 | 5.7 | 2968 | 691 |
| now (from ingredients) | 359 | 10.5 | 20.8 | 17 | 38.7 | 6.3 | 15.2 | 5.7 | 2185 | 759 |
| proposed | 177 | 10.8 | 3.2 | 0.5 | 29.1 | 6.5 | 8.6 | 0.1 | 522 | 595 |

**Labels:** now GF NUT0 SOY0 OIL0 BATCH → proposed WL BP DIA HRT GF NUT0 OIL0 NAS BATCH. Gained: WL BP DIA HRT NAS. Lost: SOY0.

- ✓ diabetes-friendly: carbs 29.1 g, sugars 8.6 g, fibre 6.5 g, no oil
- ✓ heart-healthy: sat. fat 0.5 g, sodium 522 mg, fibre 6.5 g, no oil
- ✓ blood-pressure-friendly: sodium 522 mg (97 mg/100 g), K 595 mg

- [ ] Approve `red-lentil-soup`

## 7. Buckwheat Burger (`fr-23`)

fredheim-recepies-with-pictures, Bokhveteburger / Boveteburgare. Salt and herb salt left out, bouillon 2 tsp → 1 tsp (nutritional yeast, marjoram and parsley season it).

**Fails now:**

- heart-healthy: sodium 729 mg
- blood-pressure-friendly: sodium 396 mg/100 g > 140; sodium 729 mg > 600; potassium 300 mg < sodium (panel 419 mg; ingredient estimate 729 mg)

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 0.5 tsp Salt | — | — | — |
| remove | 0.5 tsp Herb salt | — | — | — |
| edit | 2 tsp Vegetable bouillon (powder/cube) | 1 tsp Vegetable bouillon (powder/cube) | 1 ts Grønnsaksbuljong (pulver/terning) | 1 tsp Grönsaksbuljong (pulver/tärning) |

**Method changes:**

- Step 1, now: "Bring the water to boil in a water boiler to quicken the process, add water to a pot on the hot stove. Once the water boils, add salt and buckwheat. Let it boil again and cover with a lid that is covered with a clean kitchen towel. Turn the stove to the lowest heat and let steam for 20 minutes."
  - en: Bring the water to the boil in a kettle to speed things up, and pour it into a pot on the hot stove. Once the water boils, add the buckwheat. Let it boil again and cover with a lid wrapped in a clean kitchen towel. Turn the stove to the lowest heat and let it steam for 20 minutes.
  - no: Kok opp vann i en vannkoker for å spare tid, og ha vannet i en gryte på varm plate. Når vannet koker, tilsetter du bokhveten. La det koke opp igjen og dekk til med et lokk som er dekket av et rent kjøkkenhåndkle. Skru platen på laveste varme og la det dampe i 20 minutter.
  - sv: Koka upp vatten i en vattenkokare för att spara tid, och häll vattnet i en gryta på het platta. När vattnet kokar, tillsätter du bovetet. Låt det koka upp igen och täck över med ett lock som är täckt av en ren kökshandduk. Sänk plattan till lägsta värme och låt det ånga i 20 minuter.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 333 | 11 | 21 | 1.8 | 32 | 7.6 | 1.6 | 0 | 419 | 300 |
| now (from ingredients) | 290 | 8.6 | 20.5 | 2.1 | 23.3 | 5.6 | 2.4 | 0.1 | 729 | 345 |
| proposed | 288 | 8.6 | 20.5 | 2 | 23.1 | 5.6 | 2.3 | 0 | 167 | 342 |

**Labels:** now DIA GF SOY0 OIL0 NAS BATCH KID → proposed BP DIA HRT GF SOY0 OIL0 NAS BATCH KID. Gained: BP HRT. Lost: —.

- ✓ diabetes-friendly: carbs 23.1 g, sugars 2.3 g, fibre 5.6 g, no oil
- ✓ heart-healthy: sat. fat 2 g, sodium 167 mg, fibre 5.6 g, no oil
- ✓ blood-pressure-friendly: sodium 167 mg (92 mg/100 g), K 342 mg

- [ ] Approve `fr-23`

## 8. Oat Burger (`oat-burger`)

fredheim-recepies-with-pictures, Havreburger / Havreburgare. Soy sauce 1.25 dl → 0.4 dl (the usual kind); bouillon left out; 2 tsp smoked paprika added and garlic powder 2 → 3 tsp for flavour.

**Fails now:**

- heart-healthy: sodium 832 mg
- blood-pressure-friendly: sodium 484 mg/100 g > 140; sodium 832 mg > 600; potassium 259 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| edit | 1.25 dl Soy sauce | 0.4 dl Soy sauce | 0.4 dl Soyasaus | 0.4 dl Sojasås |
| edit | 2 tsp Garlic powder | 3 tsp Garlic powder | 3 ts Hvitløkspulver | 3 tsp Vitlökspulver |
| add | — | 2 tsp Smoked paprika | 2 ts Røkt paprika | 2 tsk Rökt paprika |
| remove | 1 tbsp Vegetable bouillon (powder/cube) | — | — | — |

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 228 | 7.6 | 11.5 | 1.3 | 25.9 | 4.7 | 1.2 | 0 | 832 | 259 |
| now (from ingredients) | 228 | 7.6 | 11.5 | 1.3 | 25.9 | 4.7 | 1.2 | 0 | 832 | 259 |
| proposed | 224 | 7 | 11.4 | 1.2 | 25.6 | 4.8 | 1.2 | 0 | 205 | 232 |

**Labels:** now WL DIA OIL0 NAS BATCH KID → proposed WL BP DIA HRT OIL0 NAS BATCH KID. Gained: BP HRT. Lost: —.

- ✓ diabetes-friendly: carbs 25.6 g, sugars 1.2 g, fibre 4.8 g, no oil
- ✓ heart-healthy: sat. fat 1.2 g, sodium 205 mg, fibre 4.8 g, no oil
- ✓ blood-pressure-friendly: sodium 205 mg (126 mg/100 g), K 232 mg

- [ ] Approve `oat-burger`

## 9. Red Beet Burger (`red-beet-burger`)

fredheim-recepies-with-pictures, Rødbetburger / Rödbetsburgare. Olive oil, salt and bouillon left out (onion water-sautéed); soy sauce 2 → 1 tbsp; the chickpeas stay as they are; 10 servings of 2 burgers instead of 5 of ~4–5 (624 kcal and 83 g carbs a serving).

**Fails now:**

- diabetes-friendly: carbs 83 g > 60; oil: olive-oil
- heart-healthy: oil: olive-oil; sodium 1608 mg
- blood-pressure-friendly: sodium 348 mg/100 g > 140; sodium 1608 mg > 600; potassium 1181 mg < sodium (panel 1509 mg; ingredient estimate 1608 mg, counting chickpeas-canned as ordinary salted products unless the row says low-sodium/no-salt/rinsed)

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 1 tsp Salt | — | — | — |
| remove | 2 tbsp Olive oil | — | — | — |
| edit | 2 tbsp Soy sauce | 1 tbsp Soy sauce | 1 ss Soyasaus | 1 tbsp Sojasås |
| remove | 1 tbsp Vegetable bouillon (powder/cube) | — | — | — |
| servings | 5 × 462 g | 10 × 223 g, "2 burgers (~230 g raw mix)" | 2 burgere (~230 g rå farse) | 2 burgare (~230 g rå smet) |

**Method changes:**

- Step 1, now: "Blend the first 4 ingredients in the food prosessor."
  - en: Blend the chickpeas and cayenne in the food processor.
  - no: Kjør kikerter og kajennepepper i foodprosessoren.
  - sv: Mixa kikärtor och cayennepeppar i matberedaren.
- Step 2, now: "Saauté the onion with a little olive oil and sea salt."
  - en: Sauté the onion in a splash of water until soft.
  - no: Surr løken i en skvett vann til den er myk.
  - sv: Fräs löken i en skvätt vatten tills den är mjuk.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 624 | 23 | 24 | 2.1 | 83 | 22 | 14 | 0 | 1509 | 1181 |
| now (from ingredients) | 496 | 17.7 | 20.9 | 2.5 | 67.6 | 20 | 9.5 | 0.1 | 1608 | 971 |
| proposed (10 servings) | 220 | 8.6 | 7.6 | 0.8 | 33.3 | 10 | 4.6 | 0 | 241 | 473 |

**Labels:** now NAS BATCH → proposed WL BP DIA HRT OIL0 NAS BATCH. Gained: WL BP DIA HRT OIL0. Lost: —.

- ✓ diabetes-friendly: carbs 33.3 g, sugars 4.6 g, fibre 10 g, no oil
- ✓ heart-healthy: sat. fat 0.8 g, sodium 241 mg, fibre 10 g, no oil
- ✓ blood-pressure-friendly: sodium 241 mg (108 mg/100 g), K 473 mg

- [ ] Approve `red-beet-burger`

## 10. Walnut Patties (Oven-Baked) (`orn-20`)

fredheim-reversal-protocol, Valnøttbiff (ovnsbakt) / Valnötsbiff (ugnsbakad). Olive oil left out (onion water-sautéed, patties baked on parchment without brushing); salt and tamari left out (the canned beans carry the salt); smoked paprika 1½ → 2 tsp and 1 tbsp lemon juice for flavour.

**Fails now:**

- diabetes-friendly: oil: olive-oil
- heart-healthy: oil: olive-oil
- blood-pressure-friendly: sodium 321 mg/100 g > 140 (panel 233 mg; ingredient estimate 497 mg, counting white-beans-canned as ordinary salted products unless the row says low-sodium/no-salt/rinsed)

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 1.25 tbsp Tamari (gluten-free soy sauce) (reduced-sodium) | — | — | — |
| edit | 1.5 tsp Smoked paprika | 2 tsp Smoked paprika | 2 tsp Røkt paprika | 2 tsp Rökt paprika |
| remove | 0.25 tsp Salt | — | — | — |
| remove | 1 tbsp Olive oil (to sauté + brush) | — | — | — |
| add | — | 1 tbsp Lemon juice | 1 ss Sitronsaft | 1 msk Citronsaft |

**Method changes:**

- Step 4, now: "In a splash of the olive oil, cook the onion over medium heat until soft and golden, then add the garlic for the final minute only."
  - en: In 2–3 tbsp water, cook the onion over medium heat until soft and lightly golden, adding a splash more as it dries, then add the garlic for the final minute only.
  - no: Surr løken i 2–3 ss vann på middels varme til den er myk og lett gyllen, med en skvett vann til når det tørker inn, og tilsett hvitløken kun det siste minuttet.
  - sv: Fräs löken i 2–3 msk vatten på medelvärme tills den är mjuk och lätt gyllene, med en skvätt vatten till när det torkar in, och tillsätt vitlöken bara den sista minuten.
- Step 7, now: "Combine the toasted walnuts, mashed beans, onion-carrot-garlic, flax egg, tamari, smoked paprika, thyme, salt and parsley. Mix well and rest 10 minutes so the flax hydrates and the mix firms up."
  - en: Combine the toasted walnuts, mashed beans, onion-carrot-garlic, flax egg, smoked paprika, thyme, parsley and lemon juice. Mix well and rest 10 minutes so the flax hydrates and the mix firms up (no added salt needed: the beans are salted).
  - no: Bland de ristede valnøttene, de mosede bønnene, løk-gulrot-hvitløk, linfrø-egget, røkt paprika, timian, persille og sitronsaft. Bland godt og la hvile i 10 minutter så linfrøet trekker til seg fukt og massen stivner (ikke behov for ekstra salt: bønnene er saltet).
  - sv: Blanda de rostade valnötterna, de mosade bönorna, lök-morot-vitlök, linfrö-ägget, rökt paprika, timjan, persilja och citronsaft. Blanda väl och låt vila 10 minuter så linfröet suger åt sig fukt och smeten stelnar (inget extra salt behövs: bönorna är saltade).
- Step 8, now: "Form 8 patties about 1.5 cm thick on the tray and brush the tops lightly with the remaining olive oil — the thin brush is what lets them turn golden in dry oven heat."
  - en: Form 8 patties about 1.5 cm thick on the lined tray. No oil needed: the toasted walnuts brown them in the hot oven.
  - no: Form 8 biffer ca. 1,5 cm tykke på brettet med bakepapir. Ingen olje trengs: de ristede valnøttene gir dem farge i den varme ovnen.
  - sv: Forma 8 biffar ca 1,5 cm tjocka på plåten med bakplåtspapper. Ingen olja behövs: de rostade valnötterna ger dem färg i den heta ugnen.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 367 | 12.5 | 25 | 2.4 | 31.8 | 9 | 4 | 0 | 233 | 715 |
| now (from ingredients) | 359 | 11.5 | 25.6 | 2.6 | 26 | 8.8 | 4.3 | 0 | 497 | 607 |
| proposed | 328 | 11 | 22.2 | 2.1 | 26.1 | 8.9 | 4.3 | 0 | 182 | 606 |

**Labels:** now GF NAS BATCH KID → proposed BP DIA HRT GF SOY0 OIL0 NAS BATCH KID. Gained: BP DIA HRT SOY0 OIL0. Lost: —.

- ✓ diabetes-friendly: carbs 26.1 g, sugars 4.3 g, fibre 8.9 g, no oil
- ✓ heart-healthy: sat. fat 2.1 g, sodium 182 mg, fibre 8.9 g, no oil
- ✓ blood-pressure-friendly: sodium 182 mg (121 mg/100 g), K 606 mg

- [ ] Approve `orn-20`

## 11. Sweet Yellow Pea Soup (`sweet-yellow-pea-soup`)

fredheim-recepies-with-pictures, Søt gul ertesuppe / Söt gul ärtsoppa. Salt (2 tsp) left out and bouillon 4½ → 2 tbsp; 3 tbsp lemon juice stirred in at the end (garlic and onion powder carry the rest of the flavour).

**Fails now:**

- heart-healthy: sodium 2072 mg
- blood-pressure-friendly: sodium 440 mg/100 g > 140; sodium 2072 mg > 600; potassium 166 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| remove | 2 tsp Salt | — | — | — |
| edit | 4.5 tbsp Vegetable bouillon (powder/cube) | 2 tbsp Vegetable bouillon (powder/cube) | 2 ss Grønnsaksbuljong (pulver/terning) | 2 tbsp Grönsaksbuljong (pulver/tärning) |
| add | — | 3 tbsp Lemon juice | 3 ss Sitronsaft | 3 msk Citronsaft |

**Method changes:**

- Step 3, now: "Add carrot and salt, and continue sautéé until the carrots are tender."
  - en: Add the carrot and continue to sauté until the carrots are tender.
  - no: Tilsett gulrot, og fortsett å surre til gulrøttene er møre.
  - sv: Tillsätt morot, och fortsätt att fräsa tills morötterna är mjuka.
- Step 6, now: "Garnish with chopped parsley on top ."
  - en: Stir in the lemon juice, taste (no added salt needed) and garnish with chopped parsley on top.
  - no: Rør inn sitronsaften, smak til (ikke behov for ekstra salt) og pynt med hakket persille på toppen.
  - sv: Rör i citronsaften, smaka av (inget extra salt behövs) och garnera med hackad persilja på ytan.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 210 | 13 | 0.4 | 0 | 39 | 13 | 14 | 0 | 2072 | 166 |
| now (from ingredients) | 183 | 11.2 | 1 | 0.3 | 33.8 | 11.6 | 6.8 | 0.3 | 1569 | 609 |
| proposed | 177 | 11 | 0.8 | 0.2 | 33.2 | 11.5 | 6.6 | 0.1 | 504 | 601 |

**Labels:** now WL DIA GF NUT0 SOY0 OIL0 NAS BATCH KID → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH KID. Gained: BP HRT. Lost: —.

- ✓ diabetes-friendly: carbs 33.2 g, sugars 6.6 g, fibre 11.5 g, no oil
- ✓ heart-healthy: sat. fat 0.2 g, sodium 504 mg, fibre 11.5 g, no oil
- ✓ blood-pressure-friendly: sodium 504 mg (107 mg/100 g), K 601 mg

- [ ] Approve `sweet-yellow-pea-soup`

## 12. Stuffed Paprika with Tofu (`stuffed-paprika-with-tofu`)

fredheim-recepies-with-pictures, Fylt paprika med tofu / Fylld paprika med tofu. Oil left out (water sauté); soy sauce 4 → 2 tbsp reduced-sodium; salt 2 tsp → ½ tsp.

**Fails now:**

- diabetes-friendly: oil: olive-oil
- heart-healthy: oil: olive-oil; sodium 1062 mg
- blood-pressure-friendly: sodium 360 mg/100 g > 140; sodium 1062 mg > 600; potassium 602 mg < sodium

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| edit | 2 tsp Salt | 0.5 tsp Salt | 0.5 tsp Salt | 0.5 tsp Salt |
| edit | 4 tbsp Soy sauce | 2 tbsp Soy sauce (reduced-sodium) | 2 tbsp Soyasaus (natriumredusert) | 2 tbsp Sojasås (natriumreducerad) |
| remove | 1 tbsp Olive oil | — | — | — |

**Method changes:**

- Step 1, now: "Sautée onion, garlic, leek (sliced in rings) and carrots (grated) with {{4 tbsp}} water, soy sauce and oil. Cook until soft."
  - en: Sauté onion, garlic, leek (sliced in rings) and carrots (grated) with {{4 tbsp}} water and the soy sauce. Cook until soft.
  - no: Surr løk, hvitløk, purre (skåret i ringer) og gulrøtter (revet) med {{4 ss}} vann og soyasausen. Stek til det er mykt.
  - sv: Fräs lök, vitlök, purjolök (skuren i ringar) och morötter (rivna) med {{4 msk}} vatten och sojasåsen. Stek tills det är mjukt.
- Step 2, now: "Don’t add more oil and water for larger amounts."
  - en: Don’t add more water for larger amounts.
  - no: Ikke tilsett mer vann ved større mengder.
  - sv: Tillsätt inte mer vatten vid större mängder.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 272 | 17.7 | 15.3 | 2.4 | 18.4 | 4.8 | 6.5 | 0 | 1062 | 602 |
| now (from ingredients) | 272 | 17.7 | 15.3 | 2.4 | 18.4 | 4.8 | 6.5 | 0 | 1062 | 602 |
| proposed | 255 | 17.4 | 13.6 | 2.1 | 18.2 | 4.8 | 6.5 | 0 | 309 | 584 |

**Labels:** now WL NAS BATCH → proposed WL BP DIA HRT OIL0 NAS BATCH. Gained: BP DIA HRT OIL0. Lost: —.

- ✓ diabetes-friendly: carbs 18.2 g, sugars 6.5 g, fibre 4.8 g, no oil
- ✓ heart-healthy: sat. fat 2.1 g, sodium 309 mg, fibre 4.8 g, no oil
- ✓ blood-pressure-friendly: sodium 309 mg (107 mg/100 g), K 584 mg

- [ ] Approve `stuffed-paprika-with-tofu`

## 13. Tofu Form (`tofu-form`)

fredheim-recepies-with-pictures, Tofu-form / Tofuform. Olive oil left out of the marinade; soy sauce 1 dl → 0.5 dl reduced-sodium.

**Fails now:**

- diabetes-friendly: oil: olive-oil
- heart-healthy: oil: olive-oil; sodium 856 mg
- blood-pressure-friendly: sodium 264 mg/100 g > 140; sodium 856 mg > 600; potassium 161 mg < sodium (panel 687 mg; ingredient estimate 856 mg)

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| edit | 1 dl Soy sauce | 0.5 dl Soy sauce (reduced-sodium) | 0.5 dl Soyasaus (natriumredusert) | 0.5 dl Sojasås (natriumreducerad) |
| remove | 2 tbsp Olive oil | — | — | — |

**Method changes:**

- Step 1, now: "Cut tofu in thin slices (approx. 5mm) and marinade in a container with the {{0,5 L}} soy milk, soya sauce, olive oil and garlic powder for at least 1 hour."
  - en: Cut the tofu in thin slices (approx. 5 mm) and marinate in a container with the {{0,5 L}} soy milk, soy sauce and garlic powder for at least 1 hour.
  - no: Skjær tofuen i tynne skiver (ca. 5 mm) og marinér i en beholder med 0,5 liter soyamelk, soyasaus og hvitløkspulver i minst 1 time.
  - sv: Skär tofun i tunna skivor (cirka 5 mm) och marinera i en behållare med 0,5 liter sojamjölk, sojasås och vitlökspulver i minst 1 timme.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 296 | 19 | 19 | 2.4 | 17 | 3.7 | 1 | 0 | 687 | 161 |
| now (from ingredients) | 333 | 24.1 | 20.3 | 3.2 | 14.4 | 4 | 3.4 | 0 | 856 | 669 |
| proposed | 299 | 23.5 | 16.9 | 2.7 | 14.1 | 4 | 3.4 | 0 | 328 | 639 |

**Labels:** now WL NAS BATCH → proposed WL BP DIA HRT OIL0 NAS BATCH. Gained: BP DIA HRT OIL0. Lost: —.

- ✓ diabetes-friendly: carbs 14.1 g, sugars 3.4 g, fibre 4 g, no oil
- ✓ heart-healthy: sat. fat 2.7 g, sodium 328 mg, fibre 4 g, no oil
- ✓ blood-pressure-friendly: sodium 328 mg (104 mg/100 g), K 639 mg

- [ ] Approve `tofu-form`

## 14. Ciorbă de Fasole with Lemon-Pickled Red Onion — Stovetop (`orn-30`)

fredheim-reversal-protocol, Ciorbă de Fasole med sitronsyltet rødløk — på komfyren / Ciorbă de Fasole med citronsyltad rödlök — på spisen. Dried beans 300 → 240 g and 150 g kale stirred in at the end: carbohydrate under 60 g a bowl, more greens.

**Fails now:**

- diabetes-friendly: carbs 63.6 g > 60

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| edit | 300 g Borlotti beans, dry (cranberry) | 240 g Borlotti beans, dry (cranberry) | 240 g Borlotti-bønner, tørkede (cranberrybønner) | 240 g Borlottibönor, torkade (cranberrybönor) |
| add | — | 150 g Kale (stems removed, chopped) | 150 g Grønnkål (uten stilker, hakket) | 150 g Grönkål (utan stjälkar, hackad) |

**Method changes:**

- Step 6, now: "Remove the bay leaves. Stir in the lemon juice and parsley. Taste and adjust seasoning if needed."
  - en: Remove the bay leaves. Stir in the kale and simmer 3–4 minutes until just tender, then stir in the lemon juice and parsley. Taste and adjust seasoning if needed.
  - no: Fjern laurbærbladene. Rør inn grønnkålen og la det småkoke i 3–4 minutter til den så vidt er mør, og rør så inn sitronsaft og persille. Smak til og juster kryddersmaken om nødvendig.
  - sv: Ta bort lagerbladen. Rör i grönkålen och låt sjuda 3–4 minuter tills den precis är mjuk, och rör sedan i citronsaften och persiljan. Smaka av och justera kryddningen vid behov.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 358 | 21 | 4.3 | 0.6 | 63.6 | 24 | 8.4 | 0 | 162 | 1561 |
| now (from ingredients) | 370 | 21.2 | 4.8 | 0.5 | 64.5 | 24.3 | 9.1 | 0 | 313 | 1541 |
| proposed | 339 | 19.4 | 4.9 | 0.5 | 58.8 | 21.9 | 9.7 | 0 | 327 | 1526 |

**Labels:** now WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH. Gained: DIA. Lost: —.

- ✓ diabetes-friendly: carbs 58.8 g, sugars 9.7 g, fibre 21.9 g, no oil
- ✓ heart-healthy: sat. fat 0.5 g, sodium 327 mg, fibre 21.9 g, no oil
- ✓ blood-pressure-friendly: sodium 327 mg (54 mg/100 g), K 1526 mg

- [ ] Approve `orn-30`

## 15. Ciorbă de Fasole with Lemon-Pickled Red Onion — Instant Pot, No Soak (`orn-31`)

fredheim-reversal-protocol, Ciorbă de Fasole med sitronsyltet rødløk — Instant Pot, uten bløtlegging / Ciorbă de Fasole med citronsyltad rödlök — Instant Pot, utan blötläggning. Same change as the stovetop version: dried beans 300 → 240 g and 150 g kale stirred in at the end.

**Fails now:**

- diabetes-friendly: carbs 63.6 g > 60

**Ingredient changes** (en / no / sv):

| Change | Now | Proposed (en) | no | sv |
|---|---|---|---|---|
| edit | 300 g Borlotti beans, dry (cranberry, unsoaked) | 240 g Borlotti beans, dry (cranberry, unsoaked) | 240 g Borlotti-bønner, tørkede (cranberrybønner, ubløtlagte) | 240 g Borlottibönor, torkade (cranberrybönor, oblötlagda) |
| add | — | 150 g Kale (stems removed, chopped) | 150 g Grønnkål (uten stilker, hakket) | 150 g Grönkål (utan stjälkar, hackad) |

**Method changes:**

- Step 6, now: "Remove the bay leaves. Stir in the lemon juice and parsley. Taste and adjust seasoning if needed."
  - en: Remove the bay leaves. Stir in the kale and simmer 3–4 minutes until just tender, then stir in the lemon juice and parsley. Taste and adjust seasoning if needed.
  - no: Fjern laurbærbladene. Rør inn grønnkålen og la det småkoke i 3–4 minutter til den så vidt er mør, og rør så inn sitronsaft og persille. Smak til og juster kryddersmaken om nødvendig.
  - sv: Ta bort lagerbladen. Rör i grönkålen och låt sjuda 3–4 minuter tills den precis är mjuk, och rör sedan i citronsaften och persiljan. Smaka av och justera kryddningen vid behov.

**Per serving:**

| | kcal | protein g | fat g | sat. fat g | carbs g | fibre g | sugars g | added sugar g | sodium mg | potassium mg |
|---|---|---|---|---|---|---|---|---|---|---|
| now (stored) | 358 | 21 | 4.3 | 0.6 | 63.6 | 24 | 8.4 | 0 | 162 | 1561 |
| now (from ingredients) | 370 | 21.2 | 4.8 | 0.5 | 64.5 | 24.3 | 9.1 | 0 | 313 | 1541 |
| proposed | 339 | 19.4 | 4.9 | 0.5 | 58.8 | 21.9 | 9.7 | 0 | 327 | 1526 |

**Labels:** now WL BP HRT GF NUT0 SOY0 OIL0 NAS BATCH → proposed WL BP DIA HRT GF NUT0 SOY0 OIL0 NAS BATCH. Gained: DIA. Lost: —.

- ✓ diabetes-friendly: carbs 58.8 g, sugars 9.7 g, fibre 21.9 g, no oil
- ✓ heart-healthy: sat. fat 0.5 g, sodium 327 mg, fibre 21.9 g, no oil
- ✓ blood-pressure-friendly: sodium 327 mg (59 mg/100 g), K 1526 mg

- [ ] Approve `orn-31`


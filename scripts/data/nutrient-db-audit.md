# Nutrient DB audit — phase (a)

Generated: 2026-10-31T15:04:57.341Z

## Summary
- Dictionary ids: 239
- New MICRO fills: 78
- Composites: classic-hummus, cashew-sour-cream, white-cashew-sauce
- Macro corrections (>15% vs USDA): 15
- Recipes micros refreshed: 284
- Sources by db: {"USDA-SR":209,"Matvaretabellen":10,"composite":8,"label":12}

## New fills (sources)
- **bean-sprouts**: USDA-SR 169957 — Mung beans, mature seeds, sprouted, raw
- **blackberries**: USDA-SR 173946 — Blackberries, raw
- **blueberries**: USDA-SR 171711 — Blueberries, raw
- **broccoli**: USDA-SR 170379 — Broccoli, raw
- **butternut-squash**: USDA-SR 169295 — Squash, winter, butternut, raw
- **cherry-tomatoes**: USDA-SR 170457 — Tomatoes, red, ripe, raw, year round average (proxy for cherry tomatoes)
- **chinese-cabbage**: USDA-SR 170390 — Cabbage, chinese (pak-choi), raw
- **horseradish**: USDA-SR 173472 — Horseradish, prepared
- **limes**: USDA-SR 168155 — Limes, raw
- **lingonberries**: USDA-SR 171722 — Cranberries, raw (proxy: cranberries raw (no lingonberry in SR Legacy); Nordic berries similar micros)
- **oranges**: USDA-SR 169097 — Oranges, raw, all commercial varieties
- **plums**: USDA-SR 169949 — Plums, raw
- **pomegranate**: USDA-SR 169134 — Pomegranates, raw
- **pumpkin**: USDA-SR 168448 — Pumpkin, raw
- **raspberries**: USDA-SR 167755 — Raspberries, raw
- **rosemary**: USDA-SR 173473 — Rosemary, fresh
- **shallots**: USDA-SR 170499 — Shallots, raw
- **snow-peas**: USDA-SR 170010 — Peas, edible-podded, raw
- **sour-cherries**: USDA-SR 173954 — Cherries, sour, red, raw
- **strawberries**: USDA-SR 167762 — Strawberries, raw
- **almond-milk**: USDA-SR 174832 — Beverages, almond milk, unsweetened, shelf stable (fortification removed) (Fredrik: UNFORTIFIED. Base FDC 174832 but Ca 184→16 and vitamin D 1→0 (no added Ca/D/B12).)
- **hummus**: USDA-SR 174289 — Hummus, commercial (commercial hummus; homemade classic-hummus is composite)
- **agar-agar**: USDA-SR 170090 — Seaweed, agar, dried
- **bean-noodles**: USDA-SR 174258 — Noodles, chinese, cellophane or long rice (mung beans), dehydrated
- **bread-crumbs**: USDA-SR 174928 — Bread, crumbs, dry, grated, plain
- **bulgur**: USDA-SR 170688 — Bulgur, dry
- **chickpea-flour**: USDA-SR 174288 — Chickpea flour (besan)
- **cornmeal-polenta**: USDA-SR 169697 — Cornmeal, whole-grain, yellow
- **millet**: USDA-SR 169702 — Millet, raw
- **oat-flour**: USDA-SR 169741 — Oat flour, partially debranned
- **rice-flour**: USDA-SR 169714 — Rice flour, white, unenriched
- **crispbread**: USDA-SR 172739 — Crackers, crispbread, rye
- **rye-flour**: USDA-SR 168885 — Rye flour, dark
- **spelt-flour**: USDA-SR 169745 — Spelt, uncooked (whole spelt grain as flour proxy (similar when milled))
- **borlotti-beans-dry**: USDA-SR 175189 — Beans, cranberry (roman), mature seeds, raw
- **capers**: USDA-SR 172238 — Capers, canned
- **chia-seeds**: USDA-SR 170554 — Seeds, chia seeds, dried
- **coconut-cream**: USDA-SR 170580 — Nuts, coconut cream, raw (liquid expressed from grated meat)
- **dried-cranberries**: USDA-SR 171723 — Cranberries, dried, sweetened
- **hazelnuts**: USDA-SR 170581 — Nuts, hazelnuts or filberts
- **pistachios**: USDA-SR 170184 — Nuts, pistachio nuts, raw
- **tahini**: USDA-SR 170189 — Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)
- **almond-butter**: USDA-SR 168588 — Nuts, almond butter, plain, without salt added
- **cardamom-ground**: USDA-SR 170919 — Spices, cardamom
- **coconut-oil**: USDA-SR 171412 — Oil, coconut
- **coriander-seeds**: USDA-SR 170922 — Spices, coriander seed
- **ginger-ground**: USDA-SR 170926 — Spices, ginger, ground
- **hot-sauce**: USDA-SR 171186 — Sauce, hot chile, sriracha
- **ketchup**: USDA-SR 168556 — Catsup
- **miso-paste**: USDA-SR 172442 — Miso
- **parsley-dried**: USDA-SR 170930 — Spices, parsley, dried
- **rapeseed-oil**: USDA-SR 172336 — Oil, canola
- **sugar**: USDA-SR 168833 — Sugars, brown (brown/raw cane sugar)
- **tarragon-dried**: USDA-SR 170937 — Spices, tarragon, dried
- **vanilla-extract**: USDA-SR 173471 — Vanilla extract
- **blueberries-frozen**: USDA-SR 173950 — Blueberries, frozen, unsweetened
- **brussels-sprouts-frozen**: USDA-SR 169972 — Brussels sprouts, frozen, unprepared
- **edamame-frozen**: USDA-SR 168410 — Edamame, frozen, unprepared
- **raspberries-frozen**: USDA-SR 168209 — Raspberries, frozen, red, unsweetened
- **strawberries-frozen**: USDA-SR 168173 — Strawberries, frozen, unsweetened
- **orange-juice**: USDA-SR 169098 — Orange juice, raw
- **pineapple-juice**: USDA-SR 169947 — Pineapple juice, canned or bottled, unsweetened, without added ascorbic acid
- **mango-frozen**: USDA-SR 169910 — Mangos, raw (proxy: raw mango (no unsweetened frozen mango in SR Legacy))
- **pineapple-frozen**: USDA-SR 169124 — Pineapple, raw, all varieties (proxy: raw pineapple (sweetened frozen chunks exist but add sugar))
- **salad-leaves**: USDA-SR 169249 — Lettuce, green leaf, raw (proxy for mixed salad leaves)
- **herbs-fresh-mixed**: USDA-SR 172232 — Basil, fresh (proxy: fresh basil for mixed soft herbs)
- **plant-milk**: USDA-SR 172446 — Soymilk, original and vanilla, unfortified (Fredrik: plant milks count as UNFORTIFIED (no added Ca/D/B12). Generic plant-milk uses USDA unfortified soymilk.)
- **potato-starch**: label  — Potato starch (pure starch) (Starch is nearly nutrient-empty; small mineral traces estimated. Not potato flour.)
- **gluten-free-flour-mix**: USDA-SR 169714 — Rice flour, white, unenriched (proxy for GF flour mix (rice-based))
- **sukrin**: label  — Erythritol (Sukrin) (Sugar alcohol; negligible micronutrients)
- **sumac**: label  — Sumac, ground (estimate) (No SR Legacy entry; estimate from published spice analyses)
- **nigella-seeds**: label  — Nigella (kalonji) seeds (estimate) (No SR Legacy entry; estimate from published seed analyses)
- **amla-powder**: label  — Amla (Indian gooseberry) powder (Label-type estimate; vitamin C highly variable by brand/drying)
- **aquafaba**: composite  — Aquafaba (chickpea canning liquid) (Dilute chickpea solids ~5–10%; estimated from chickpea micros × ~0.05–0.1)
- **olive-brine**: composite  — Olive brine (Near-zero micros; sodium lives in composition table)
- **sourdough-starter**: composite 168885 — Sourdough starter ≈ 50% flour + 50% water (Micros ≈ half of dark rye flour (hydration))
- **berries-mixed**: composite  — Mixed berries (avg blueberry/raspberry/strawberry) (Equal-weight average of the three raw berries)
- **berries-mixed-frozen**: composite  — Mixed berries, frozen (avg) (Equal-weight average of frozen unsweetened berries)

## Macro corrections
- **chinese-cabbage** (Cabbage, chinese (pak-choi), raw): protein 1.2→1.5, carbs 3.2→2.18, fiber 1.2→1, sodium 9→65
- **horseradish** (Horseradish, prepared): sodium 314→420
- **lingonberries** (Cranberries, raw): fiber 3→3.6
- **almond-milk** (Beverages, almond milk, unsweetened, shelf stable (fortification removed)): fat 1.2→0.96, carbs 0.6→1.31
- **hummus** (Hummus, commercial): kcal 166→237, fat 9.6→17.8, potassium 228→312
- **cornmeal-polenta** (Cornmeal, whole-grain, yellow): fat 1.8→3.59, fiber 3.9→7.3, potassium 142→287
- **rye-flour** (Rye flour, dark): protein 10.9→15.9, potassium 510→717
- **spelt-flour** (Spelt, uncooked): fiber 9→10.7
- **tahini** (Seeds, sesame butter, tahini, from roasted and toasted kernels (most common type)): sodium 35→115
- **hot-sauce** (Sauce, hot chile, sriracha): kcal 11→93, protein 0.5→1.93, carbs 1.8→19.2, fiber 0.3→2.2, sodium 2643→2124, potassium 144→321
- **raspberries-frozen** (Raspberries, frozen, red, unsweetened): fiber 6.5→4.3, potassium 151→184
- **herbs-fresh-mixed** (Basil, fresh): kcal 36→23, carbs 6.3→2.65, fiber 3.3→1.6, sodium 56→4, potassium 554→295
- **gluten-free-flour-mix** (Rice flour, white, unenriched): protein 3→5.95, fiber 4→2.4, potassium 100→76
- **sourdough-starter** (Sourdough starter ≈ 50% flour + 50% water): protein 5.5→7.95, potassium 255→359
- **plant-milk** (Soymilk, original and vanilla, unfortified): kcal 40→54, protein 2.5→3.27, carbs 3.5→6.28, sodium 40→51

## Top 10 recipe-level changes
- **orn-18** Carob Dream Overnight Oats: {"omega3":{"old":1.8,"new":1.7,"dv":-0.10000000000000009},"omega6":{"old":2.1,"new":2,"dv":-0.10000000000000009},"iron":{"old":3.9,"new":4.1,"dv":0.19999999999999973},"calcium":{"old":119,"new":352,"dv":233},"vitaminB12":{"old":0,"new":0.78,"dv":0.78}}
- **orn-1** Crispy Oat Waffles: {"omega6":{"old":1.9,"new":1.8,"dv":-0.09999999999999987},"iron":{"old":3.4,"new":3.1,"dv":-0.2999999999999998},"calcium":{"old":130,"new":257,"dv":127}}
- **orn-34** Vanilla-Carob Psyllium Pudding with Blueberries: {"omega3":{"old":1.63,"new":1.7,"dv":0.07000000000000006},"omega6":{"old":0.94,"new":0.83,"dv":-0.10999999999999999},"calcium":{"old":86,"new":209,"dv":123},"vitaminB12":{"old":0,"new":0.47,"dv":0.47}}
- **orn-19** Tropical Psyllium Pudding: {"omega3":{"old":1.7,"new":0.91,"dv":-0.7899999999999999},"omega6":{"old":0.35,"new":0.54,"dv":0.19000000000000006},"iron":{"old":1.3,"new":1.2,"dv":-0.10000000000000009},"calcium":{"old":112,"new":222,"dv":110},"vitaminB12":{"old":0,"new":0.59,"dv":0.59},"omegaRatio":{"old":0.2,"new":0.6}}
- **broccoli-soup** Broccoli Soup: {"iron":{"old":2.2,"new":2.9,"dv":0.6999999999999997},"calcium":{"old":144,"new":70,"dv":-74},"omegaRatio":{"old":60,"new":30}}
- **fr-143** Roasted Pepper Seitan Sausages: {"calories":{"old":292,"new":289,"dv":-3},"fiber":{"old":6.5,"new":4.8,"dv":-1.7000000000000002},"sodium":{"old":567,"new":548,"dv":-19},"omega6":{"old":2.1,"new":2,"dv":-0.10000000000000009},"iron":{"old":6,"new":4.4,"dv":-1.5999999999999996},"calcium":{"old":197,"new":242,"dv":45},"vitaminB12":{"old":1.1,"new":0,"dv":-1.1},"protein":{"old":14.8,"new":41,"dv":26.2}}
- **fr-44** Chinese Cabbage Salad: {"calories":{"old":166,"new":131,"dv":-35},"fiber":{"old":3.5,"new":2.4,"dv":-1.1},"sodium":{"old":275,"new":348,"dv":73},"iron":{"old":0.52,"new":1.2,"dv":0.6799999999999999},"calcium":{"old":58,"new":111,"dv":53},"protein":{"old":4.1,"new":3.9,"dv":-0.19999999999999973},"omegaRatio":{"old":80,"new":64}}
- **orn-6** Carob & White Bean Protein Shake: {"iron":{"old":4.9,"new":4.6,"dv":-0.3000000000000007},"calcium":{"old":247,"new":181,"dv":-66}}
- **breaded-tofu-sticks** Breaded Tofu Sticks: {"iron":{"old":3.6,"new":2.9,"dv":-0.7000000000000002},"calcium":{"old":100,"new":154,"dv":54},"vitaminB12":{"old":4.4,"new":0.25,"dv":-4.15},"omegaRatio":{"old":25,"new":23.1}}
- **baked-roots** Baked Roots: {"iron":{"old":7.4,"new":2.9,"dv":-4.5},"calcium":{"old":133,"new":80,"dv":-53},"omegaRatio":{"old":8.3,"new":9.1}}

## Label changes
_No label tag changes detected_

## Needs Fredrik judgement
- **plant-milk**: **UNFORTIFIED** (USDA 172446 soymilk unfortified). Confirm carton brands.
- **almond-milk**: USDA unsweetened shelf-stable fortified; EU brands vary.
- **lingonberries**: no SR Legacy food — used cranberries raw as proxy.
- **sumac, nigella-seeds, amla-powder**: no USDA entry — estimates.
- **gluten-free-flour-mix / potato-starch / sukrin**: label-type estimates.
- **mango-frozen / pineapple-frozen**: raw fruit proxies (avoided sweetened frozen).
- **hummus** (non-classic): commercial hummus FDC; classic-hummus is composite from the pack recipe.
- Pre-existing MICRO rows without confirmed FDC id still noted in food-sources.json — follow-up can tighten.

## Label changes (applied)
- **gluten-free-oat-buns** Gluten Free Oat Buns: +blood-pressure-friendly −—
- **fr-84** Hummus: +— −heart-healthy
- **vegetable-pie** Vegetable Pie: +— −weight-loss
- **roasted-red-pepper-hummus** Roasted Red Pepper Hummus: +weight-loss −—

## Apply notes
- Skipped unsafe usda-macros-by-id mass overwrite (bad FDC matches: oat-milk→granola bar, coconut-milk→pudding, bread→breadfruit seeds, etc.).
- Trusted macros only from filled-micros macrosFromUsda (15 foods).
- orn-37 sourdough starter how-to: no nutrition, skipped.
- Pack id spelling fredheim-recepies-with-pictures unchanged.

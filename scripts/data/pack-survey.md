# Pack survey

Read-only survey of `recipe-packs-template/packs/` on 2026-10-30. No recipe or pack was changed.

The app bundles three packs (`src/data/installedPacks.js`). `healthy-basics`, `mediterranean` and `nordic-classics` sit in the template folder and are not bundled; they are listed so the picture is complete.

Pack ids are the real ones: `fredheim-recepies-with-pictures` is misspelled on purpose.

## Counts

| Pack | Recipes | (a) Animal ingredient | (a) Other text match | (b) No picture | (c) NO missing | (c) NO incomplete | (c) SV missing | (c) SV incomplete |
|---|---|---|---|---|---|---|---|---|
| fredheim-fmd-5day | 16 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| fredheim-recepies-with-pictures | 194 | 0 | 60 | 0 | 0 | 1 | 0 | 1 |
| fredheim-reversal-protocol | 65 | 0 | 18 | 0 | 0 | 0 | 0 | 0 |
| healthy-basics (not bundled) | 8 | 5 | 0 | 8 | 8 | 0 | 8 | 0 |
| mediterranean (not bundled) | 6 | 3 | 0 | 6 | 6 | 0 | 6 | 0 |
| nordic-classics (not bundled) | 6 | 5 | 1 | 6 | 6 | 0 | 6 | 0 |
| **In the app** | 275 | 0 | 79 | 0 | 0 | 1 | 0 | 1 |
| **Not bundled** | 20 | 13 | 1 | 20 | 20 | 0 | 20 | 0 |

## (a) Recipes with egg, dairy, meat, poultry, fish or seafood

Found by searching every ingredient row (name and note, in EN, NO and SV). Plant versions such as oat milk, coconut cream, peanut butter, cashew sour cream and soy mayonnaise are not counted. Honey is not in the requested list, so it is not counted.

### fredheim-fmd-5day

0 of 16 recipes.


### fredheim-recepies-with-pictures

0 of 194 recipes.


### fredheim-reversal-protocol

0 of 65 recipes.


### healthy-basics

5 of 8 recipes.

| Id | Title | Contains | Ingredient rows |
|---|---|---|---|
| hb-1 | Overnight Oats with Berries | dairy | oat milk (or milk of choice); plain Greek yogurt |
| hb-2 | Greek Yogurt Parfait | dairy | full-fat Greek yogurt |
| hb-3 | Avocado Toast with Poached Eggs | egg | eggs |
| hb-6 | Grilled Salmon with Roasted Vegetables | fish | salmon fillets (approx. 180 g each) |
| hb-7 | Turkey and Vegetable Stir-Fry | poultry | turkey mince |

### mediterranean

3 of 6 recipes.

| Id | Title | Contains | Ingredient rows |
|---|---|---|---|
| med-1 | Greek Salad with Feta | dairy | feta cheese, in a block |
| med-3 | Baked Sea Bass with Lemon and Herbs | fish | whole sea bass (approx. 400 g each), gutted and scaled |
| med-5 | Shakshuka | egg, dairy | eggs; feta cheese, crumbled (optional) |

### nordic-classics

5 of 6 recipes.

| Id | Title | Contains | Ingredient rows |
|---|---|---|---|
| nor-1 | Havregrøt med bær / Oatmeal with Berries | dairy | melk / milk |
| nor-3 | Laksesuppe / Salmon Soup | fish, dairy | fersk laks, terninger / fresh salmon, diced; fiskekraft / fish stock; fløte / single cream; smør / butter |
| nor-4 | Fiskekaker med rotgrønnsaker / Fish Cakes with Root Vegetables | fish, egg, dairy | hvit fisk (torsk/sei), finhakket / white fish, finely chopped; egg; melk / milk; smør til steking / butter for frying; rømme / soured cream |
| nor-5 | Kyllingsuppe / Chicken Soup | poultry | hel kylling (ca. 1,5 kg) / whole chicken (approx. 1.5 kg) |
| nor-6 | Blomkålsuppe / Cauliflower Soup | dairy | plantebasert melk / plant-based milk or light cream |

### Result for the app

None of the three bundled packs has an ingredient row with egg, dairy, meat, poultry, fish or seafood. Every row in them uses a dictionary id, and no id they use is an animal product.

Three bundled recipes do name an animal product in the method, with no matching ingredient row. These are the ones to decide on:

| Pack | Id | Title | Wording |
|---|---|---|---|
| fredheim-recepies-with-pictures | fr-49 | Classic Greek Salad | "Serve feta cheese separately" (no plant feta named) |
| fredheim-recepies-with-pictures | burger-buns | Burger Buns | "Brush the tops with water or milk" |
| fredheim-recepies-with-pictures | fr-123 | Polenta | "water or milk", and "olive oil or butter and honey" |

Not checked: what a shop-bought product may contain, for example bread, crispbread, lasagne sheets, hot sauce or ketchup. Honey is outside the requested list; 24 bundled recipes and 1 template recipe (nor-1) use it.

### Every other text match, for reference

No animal ingredient row in these recipes. The words are plant versions ("cashew cheese", "almond milk", "flax egg"), negatives ("no cream"), verbs (Norwegian "smør" = spread) or names ("ice cream scoop", "lamb's lettuce"). Rows with a dictionary id appear here when their wording matched, as with "soy mayonnaise".

### fredheim-fmd-5day

| Id | Title | Words found |
|---|---|---|
| fmd-d1-lunch | Avocado & Roasted Sweet Potato Salad | meat: "…ves (mixed), rocket, spinach, lamb's lettuce…" |

### fredheim-recepies-with-pictures

| Id | Title | Words found |
|---|---|---|
| fr-3 | Almond and Paprika Cheese | dairy: "…Almond and Paprika Cheese…"; dairy: "…Mandel- og paprika Vegansk ost…" |
| american-oat-pancakes | American Oat Pancakes | dairy: "…ru varmen ned til nummer 3 og smør pannen lett med kokosolje. He…" |
| apple-oat-bake | Apple Oat Bake | dairy: "…er in a bowl and then add the milk. Transfer into a baking dish.…" |
| fr-7 | Avocado Cream | dairy: "…Avocado Cream…" |
| fr-12 | Barley Cup Drink | dairy: "…edients and then add the warm milk.…" |
| broccoli-salad | Broccoli Salad | egg: "… beans, sliced red onion, soy mayonnaise (seperate recipe), lemon, and…"; egg: "…Soy mayonnaise…" |
| fr-23 | Buckwheat Burger | dairy: "…Option 2: use ice cream scooper and form the burgers …" |
| burger-buns | Burger Buns | dairy: "…Brush the tops with water or milk, and sprinkle with sesame see…"; dairy: "…Pensle toppene med vann eller melk, og dryss over sesamfrø for e…"; dairy: "…nsla toppene med vatten eller mjölk, och strö över sesamfrö för e…" |
| caraway-and-cashew-cheese | Caraway and Cashew Cheese | dairy: "…Caraway and Cashew Cheese…" |
| fr-33 | Cashew Sour Cream | dairy: "…Cashew Sour Cream…"; dairy: "…Cashew-rømme…" |
| fr-34 | Cashew Vanilla Cream | dairy: "…Cashew Vanilla Cream…" |
| cashew-cheese-sauce | Cashew Cheese Sauce | dairy: "…Cashew Cheese Sauce…"; dairy: "…Make cashew and water into milk.…"; dairy: "…Lag melk av cashewnøttene og vannet.…"; dairy: "…gör mjölk av cashewnötterna och vattnet…" |
| fr-38 | Cheese Sauce for Onion Pie | dairy: "…Cheese Sauce for Onion Pie…" |
| fr-42 | Chickpea Salad | dairy: "…To make the sour cream, drain and rinse the cashews.…" |
| breaded-tofu-sticks | Breaded Tofu Sticks | dairy: "…n flour mixture, then toss in milk mixture and afterward roll in…"; meat: "…ptional: garnish with coconut bacon and chives (add just before s…" |
| carob-spread | Carob spread (hazelnut) | dairy: "…lease their oil and turn into butter.…"; dairy: "… de slipper oljen og blir til smør.…"; dairy: "…e släpper oljan och blir till smör.…" |
| carob-spread-almond | Carob spread (almond) | dairy: "…lease their oil and turn into butter.…"; dairy: "… de slipper oljen og blir til smør.…"; dairy: "…e släpper oljan och blir till smör.…" |
| fr-49 | Classic Greek Salad | dairy: "…t all the ingredients (except feta) into a mixing bowl and combi…"; dairy: "…Serve feta cheese separately.…"; dairy: "…e ingrediensene (bortsett fra feta) i en bolle og bland forsikti…"; dairy: "…Server feta separat.…"; dairy: "… ingredienserna (förutom från feta) i en skål och blanda försikt…"; dairy: "…Servera feta separat.…" |
| fr-50 | Coconut Macaroon Balls | dairy: "…Use a ice cream scoop, scoop the mixture and …" |
| fr-51 | Coconut Mozzarella | dairy: "…Coconut Mozzarella…"; dairy: "…To form the mozzarella balls, use an ice-cream scoop…"; dairy: "… turn it over and release the mozzarella ball into the water.…"; dairy: "…Kokos-mozzarella…" |
| fr-57 | Cucumber Raita | dairy: "…Make cashew sour cream (see seperate recipe).…"; dairy: "…Cashew sour cream…" |
| fr-74 | Garlic and Cashew Cheese | dairy: "…Garlic and Cashew Cheese…" |
| hazelnut-and-sundried-tomato-cheese | Hazelnut and Sundried Tomato Cheese | dairy: "…Hazelnut and Sundried Tomato Cheese…" |
| kale-avocado | Kale Avocado | dairy: "…hands, press the avocado into cream until thoroughly mixed. Massa…" |
| fr-99 | Luke's Indian Chickpea Sauce | dairy: "…ff heat and add coconut cream/milk, stir and serve.…"; dairy: "… platen og tilsett kokoskrem/-melk, rør og server.…"; dairy: "…tan och tillsätt kokosgrädde/-mjölk, rör och servera.…" |
| marinated-tofu-sticks | Marinated Tofu Sticks | fish: "…ry to get the size of typical fish sticks).…" |
| fr-111 | Nutloaf | dairy: "…Plantebasert yoghurt, soya…"; dairy: "…Växtbaserad yoghurt, soja…" |
| oat-burger | Oat Burger | dairy: "… balls (preferably with a ice cream scoop) and put them on a baki…" |
| fr-114 | Onion Pie Filling | dairy: "…The cheese should be thinly spread on to…" |
| fr-115 | Parmesan | dairy: "…Parmesan…" |
| pineapple-cream | Pineapple Cream | dairy: "…Pineapple Cream…" |
| fr-119 | Pizza Crust Dough | dairy: "…Make the cashew cheese (see a seperate recipe: White…"; dairy: "…d the veggies and then cashew cheese/sauce on top.…"; dairy: "…Smør først tomatsausen på pizzabun…" |
| plant-based-butter | Plant Based Butter | dairy: "…Plantebasert smør…"; dairy: "…Växtbaserat smör…" |
| fr-123 | Polenta | dairy: "…Bring the water or milk to a boil, with the salt.…"; dairy: "…ked, stir in the olive oil or butter and honey.…"; dairy: "…Kok opp vann eller melk sammen med salt.…"; dairy: "…rører du inn olivenolje eller smør og honning.…"; dairy: "…Koka upp vatten eller mjölk tillsammans med salt.…" |
| potato-salad | Potato Salad | egg: "…Soy mayonnaise…" |
| fr-130 | Pumpkinseed and Basil Cheese | dairy: "…Pumpkinseed and Basil Cheese…" |
| red-beet-salad | Red Beet Salad | egg: "…redients and at the end, soya mayonnaise and mix altogether.…"; egg: "…Soy mayonnaise…" |
| fr-143 | Roasted Pepper Seitan Sausages | meat: "…Roasted Pepper Seitan Sausages…"; meat: "…To shape the sausages, cut the dough into sausage s…"; meat: "…Steam sausages for 45 min. Remove from the s…" |
| scrambled-tofu | Scrambled Tofu | egg: "…Tofu-eggerøre…" |
| fr-155 | Sorbet | dairy: "…spoon a few times. Use an ice cream scoop or spoon to form a nice…" |
| fr-156 | Soy Mayonnaise | egg: "…Soy Mayonnaise…" |
| soy-mozzarella | Soy Mozzarella | dairy: "…Soy Mozzarella…"; dairy: "…2: Blend the cashews with the yogurt and half of the water. Start …"; dairy: "…hen scoop up balls with a ice cream spoon (with ejector) and scoo…"; dairy: "…Let the mozzarella balls rest in the ice water f…"; dairy: "…Plantebasert yoghurt, soya…"; dairy: "…Växtbaserad yoghurt, soja…"; dairy: "…Soya-mozzarella…" |
| soy-yogurt-dressing | Soy Yogurt Dressing | dairy: "…Plantebasert yoghurt, soya…"; dairy: "…Växtbaserad yoghurt, soja…" |
| swedish-oven-pancake | Swedish Oven Pancake | dairy: "…på 1–1,5 cm når den helles i. Smør/pensle formen med olje og hel…" |
| sweet-potato-muffins | Sweet Potato Muffins | dairy: "…referably melted), non-dinary milk and vanilla. Blend on high un…" |
| fr-173 | Tofu Feta Cheese | dairy: "…Tofu Feta Cheese…" |
| tofu-cottage-cheese | Tofu Cottage Cheese | dairy: "…Tofu Cottage Cheese…"; dairy: "…Tofu cottage cheese…" |
| tofu-form | Tofu Form | dairy: "… leftover the total amount of milk for the sauce) Blend all rema…"; dairy: "… til tofuformen. (Fyll på med melk til du har totalmengden til s…"; dairy: "… till tofuformen. (Fyll i med mjölk tills du har totalmängdn till…" |
| fr-183 | Turmeric and Cashew Cheese | dairy: "…Turmeric and Cashew Cheese…" |
| fr-190 | White Cabbage Coleslaw | egg: "…Mix the mayonnaise into the cabbage and carrots …"; egg: "…Bland majonesen inn i kålen og gulrøttene f…"; egg: "…Blanda majonesen i kålen och morötterna inna…" |
| fredheim-deluxe-plant-based-cream-cheese | Fredheim Plant-Based Cream Cheese | dairy: "…Fredheim Plant-Based Cream Cheese…"; dairy: "…Rich and creamy cashew-based cream cheese with fresh herbs.…"; dairy: "…ate 2-3 hours before serving; cream cheese will thicken and flavo…"; dairy: "…Rich og kremet cashew-based cream cheese med fersk herbs.…" |
| creamy-red-lentil-stew | Creamy Red Lentil Stew | dairy: "…Cashews, for milk…"; dairy: "…Cashewnøtter, til melk…"; dairy: "…Cashewnötter, till mjölk…"; dairy: "…Water, for milk…"; dairy: "…Vann, til melk…"; dairy: "…Vatten, till mjölk…" |
| ultimate-fluffy-vegan-gluten-free-bread | Fluffy Gluten-Free Bread | egg: "…glutenfritt brød uten melk og egg, som holder seg ferskt i fler…"; dairy: "… saftig glutenfritt brød uten melk og egg, som holder seg ferskt…"; egg: "…utenfritt bröd utan mjölk och ägg, som håller sig färskt i fler…"; dairy: "…saftigt glutenfritt bröd utan mjölk och ägg, som håller sig färsk…" |
| ginger-pear-overnight-oats | Ginger Pear Overnight Oats with Cashew Milk | dairy: "… blender yields extra creamy "milk" to save for smoothies or por…"; dairy: "…For the "milk", blend the raw cashews, vani…"; dairy: "… Blenderen gir ekstra kremet «melk» til overs som du kan spare t…"; dairy: "…sin. Mixern ger extra krämig "mjölk" över att spara till smoothie…"; dairy: "…På morgonen, häll lite extra "mjölk" över müslin och garnera med …" |
| vegan-tzatziki-sauce | Vegan Tzatziki Sauce | dairy: "…er or food processor with the yogurt, lemon juice and garlic. Blen…"; dairy: "…Plantebasert yoghurt, usøtet vegansk…"; dairy: "…Växtbaserad yoghurt, osötad vegansk…" |
| lemony-chickpea-hummus | Lemony Chickpea Hummus | dairy: "…er, sesam, soya, gluten eller melk.…"; dairy: "…er, sesam, soja, gluten eller mjölk.…" |
| carob-black-bean-mousse | Carob & Black Bean Mousse | dairy: "…ilk both work well; a thicker milk gives a richer result. Rinsin…"; dairy: "…elk fungerer fint; en tykkere melk gir et fyldigere resultat. De…"; dairy: "…ölk fungerar bra; en tjockare mjölk ger ett fylligare resultat. A…" |
| tofu-egg-salad-rye | Tofu "Egg" Salad on Rye | egg: "…Tofu "Egg" Salad on Rye…"; dairy: "…Crumbled tofu with yogurt, turmeric, black salt, red on…"; egg: "…k salt (kala namak) gives the egg flavour. The salad keeps 2 da…"; dairy: "…Stir in the yogurt, turmeric, black salt, lemon …"; dairy: "…Plantebasert yoghurt, usøtet…"; dairy: "…Växtbaserad yoghurt, osötad…"; egg: "…Tofu-«eggesalat» på rugbrød…"; dairy: "…Smuldret tofu med yoghurt, gurkemeie, svart salt, rødlø…"; egg: "…Svart salt (kala namak) gir eggesmaken. Salaten holder seg 2 …"; dairy: "…Rør inn yoghurt, gurkemeie, svart salt, sitro…"; egg: "…Tofu-«äggröra» på rågbröd…"; dairy: "…Smulad tofu med yoghurt, gurkmeja, svart salt, rödlök…"; egg: "…Svart salt (kala namak) ger äggsmaken. Röran håller 2 dagar i kylen…"; dairy: "…Rör ner yoghurt, gurkmeja, svart salt, citron…" |
| smashed-beans-avocado-rye | Smashed White Beans and Avocado on Rye | dairy: "…Smør det på brødet.…" |
| smorbrod-hummus | Smørbrød with Hummus, Cucumber and Radish | dairy: "…Smør klassisk hummus på brødet. De…" |

### fredheim-reversal-protocol

| Id | Title | Words found |
|---|---|---|
| orn-1 | Crispy Oat Waffles | dairy: "…ig før du heller i røre. Ikke smør jernet.…" |
| orn-8 | The Perfect Homemade Oat Milk | dairy: "…Pour the blended milk through a nut milk bag or a d…"; dairy: "…Pour the strained milk into a clean glass bottle or …" |
| orn-11 | Miso Red Lentil & Sweet Potato Soup | dairy: "…able umami depth — no oil, no cream, no compromise.…"; dairy: "…umami-dybde — uten olje, uten fløte, uten kompromiss.…"; dairy: "…t umamidjup — utan olja, utan grädde, utan kompromiss.…" |
| orn-13 | Sweet Almond Milk Chia Pudding with Mango | dairy: "… added syrup, no store-bought milk — and an excellent omega-6:om…"; dairy: "…tan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:ome…" |
| orn-18 | Carob Dream Overnight Oats | dairy: "…dates into a silky carob-date cream before it ever touches the oa…"; dairy: "…Make the carob-date cream: blend the bloomed carob, the…"; dairy: "…g oat milk and the carob-date cream and stir thoroughly.…" |
| orn-20 | Walnut Patties (Oven-Baked) | egg: "…Make the flax egg: stir the ground flaxseed int…"; egg: "…y glue that lets you skip the egg.…"; egg: "…ns, onion-carrot-garlic, flax egg, smoked paprika, thyme, parsl…"; egg: "…Water, for the flax egg…"; egg: "…Vann, til linfrø-egget…"; egg: "…Vatten, till linfrö-ägget…"; egg: "…Lag linfrø-egget: rør det malte linfrøet ut …"; egg: "…mede limet som lar deg droppe egg.…"; egg: "…e, løk-gulrot-hvitløk, linfrø-egget, røkt paprika, timian, pers…"; egg: "…Gör linfrö-ägget: rör det malda linfröet i vat…"; egg: "…mmet som låter dig hoppa över ägg.…"; egg: "…rna, lök-morot-vitlök, linfrö-ägget, rökt paprika, timjan, persil…" |
| orn-24 | Sweet Almond Milk Chia Pudding with Pineapple | dairy: "… added syrup, no store-bought milk — and an excellent omega-6:om…"; dairy: "…tan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:ome…" |
| orn-25 | Sweet Almond Milk Chia Pudding with Forest Berries | dairy: "… added syrup, no store-bought milk — and an excellent omega-6:om…"; dairy: "…tan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:ome…" |
| orn-26 | Sweet Almond Milk Chia Pudding with Blueberries | dairy: "… added syrup, no store-bought milk — and an excellent omega-6:om…"; dairy: "…tan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:ome…" |
| orn-27 | Sweet Almond Milk Chia Pudding with Raspberries | dairy: "… added syrup, no store-bought milk — and an excellent omega-6:om…"; dairy: "…tan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:ome…" |
| orn-28 | Sweet Almond Milk Chia Pudding with Strawberries | dairy: "… added syrup, no store-bought milk — and an excellent omega-6:om…"; dairy: "…tan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:ome…" |
| orn-30 | Ciorbă de Fasole with Lemon-Pickled Red Onion — Stovetop | meat: "…in for the traditional smoked meat — topped with sharp, lemon-pi…"; meat: "…g for det tradisjonelle røkte kjøttet — toppet med syrlig, sitronsy…"; meat: "…g för det traditionella rökta köttet — toppad med syrlig, citronsy…" |
| orn-32 | Calcium Boost Salad | dairy: "…wap tahini for sunflower seed butter if sesame isn't on hand (calc…" |
| orn-37 | Rye Sourdough Starter — How to Build One From Scratch | dairy: "…en: rør den inn i grøt, eller smør den tynt ut på bakepapir med …" |
| orn-43 | Quick Almond Milk | dairy: "…en creamier, slightly sweeter milk (cashews don't need straining…"; dairy: "… en enda kremere, litt søtere melk (cashewnøtter trenger ikke si…"; dairy: "…n ännu krämigare, lite sötare mjölk (cashewnötter behöver inte si…" |
| orn-58 | Spring Pea Soup | dairy: "…ea soup with a sunflower seed cream stirred through. Rustic textu…"; dairy: "… keep them. Blending the seed cream with a ladle of hot peas also…"; dairy: "…Make the sunflower cream: Tip the soaked seeds and all…"; dairy: "…nd season: Stir the sunflower cream through the soup, then add th…" |
| orn-60 | Cashew Yogurt | dairy: "…be unsweetened — heat-treated yogurt contains nothing alive and si…"; dairy: "…rm the starter: Take the live yogurt out of the fridge now and let…"; dairy: "…n the starter: Whisk the live yogurt into the blended base by hand…"; dairy: "…Incubate: Lid on, Yogurt function, Normal (43 °C), 10 …"; dairy: "… Whisk the salt into the cold yogurt — salt after fermentation, ne…"; dairy: "…Plantebasert yoghurt, levende, usøtet, starter…"; dairy: "…Växtbaserad yoghurt, levande, osötad, starter…"; dairy: "… en skje levende plantebasert yoghurt. Inkubering i trykkoker, blen…"; dairy: "… være usøtet — varmebehandlet yoghurt inneholder ingenting levende …"; dairy: "…al (43 °C), 10 timer. En skje yoghurt bærer langt færre levende cel…"; dairy: "…d en sked levande växtbaserad yoghurt. Inkubering i tryckkokare, mi…"; dairy: "… vara osötad — värmebehandlad yoghurt innehåller ingenting levande …"; dairy: "…l (43 °C), 10 timmar. En sked yoghurt bär långt färre levande celle…" |
| orn-62 | Golden No-Chicken Soup | poultry: "…Golden No-Chicken Soup…"; poultry: "…Gyllen «kylling»-suppe…"; poultry: "…Gyllene "kyckling"-soppa…" |

### nordic-classics

| Id | Title | Words found |
|---|---|---|
| nor-2 | Rugbrød med avokado / Rye Bread with Avocado | meat: "…i to, fjern steinene og skrap kjøttet over i en bolle. / Halve avoc…"; dairy: "…Smør avokadoen over rugbrødet. / S…" |

## (b) Recipes with no picture

### fredheim-fmd-5day

0 of 16 recipes.


### fredheim-recepies-with-pictures

0 of 194 recipes.


### fredheim-reversal-protocol

0 of 65 recipes.


### healthy-basics

8 of 8 recipes.

| Id | Title |
|---|---|
| hb-1 | Overnight Oats with Berries |
| hb-2 | Greek Yogurt Parfait |
| hb-3 | Avocado Toast with Poached Eggs |
| hb-4 | Red Lentil Soup |
| hb-5 | Quinoa Buddha Bowl |
| hb-6 | Grilled Salmon with Roasted Vegetables |
| hb-7 | Turkey and Vegetable Stir-Fry |
| hb-8 | Chickpea and Spinach Curry |

### mediterranean

6 of 6 recipes.

| Id | Title |
|---|---|
| med-1 | Greek Salad with Feta |
| med-2 | Hummus with Veggie Sticks |
| med-3 | Baked Sea Bass with Lemon and Herbs |
| med-4 | Tabbouleh |
| med-5 | Shakshuka |
| med-6 | Falafel Wrap |

### nordic-classics

6 of 6 recipes.

| Id | Title |
|---|---|
| nor-1 | Havregrøt med bær / Oatmeal with Berries |
| nor-2 | Rugbrød med avokado / Rye Bread with Avocado |
| nor-3 | Laksesuppe / Salmon Soup |
| nor-4 | Fiskekaker med rotgrønnsaker / Fish Cakes with Root Vegetables |
| nor-5 | Kyllingsuppe / Chicken Soup |
| nor-6 | Blomkålsuppe / Cauliflower Soup |

## (c) Recipes lacking NO or SV translations

"Missing" means no translation for that language at all. "Incomplete" names the fields that are absent, or lists whose length differs from the English.

### fredheim-fmd-5day

0 of 16 recipes.


### fredheim-recepies-with-pictures

1 of 194 recipes.

| Id | Title | Problem |
|---|---|---|
| ginger-pear-overnight-oats | Ginger Pear Overnight Oats with Cashew Milk | NO: incomplete (notes); SV: incomplete (notes) |

### fredheim-reversal-protocol

0 of 65 recipes.


### healthy-basics

8 of 8 recipes.

| Id | Title | Problem |
|---|---|---|
| hb-1 | Overnight Oats with Berries | NO: missing; SV: missing |
| hb-2 | Greek Yogurt Parfait | NO: missing; SV: missing |
| hb-3 | Avocado Toast with Poached Eggs | NO: missing; SV: missing |
| hb-4 | Red Lentil Soup | NO: missing; SV: missing |
| hb-5 | Quinoa Buddha Bowl | NO: missing; SV: missing |
| hb-6 | Grilled Salmon with Roasted Vegetables | NO: missing; SV: missing |
| hb-7 | Turkey and Vegetable Stir-Fry | NO: missing; SV: missing |
| hb-8 | Chickpea and Spinach Curry | NO: missing; SV: missing |

### mediterranean

6 of 6 recipes.

| Id | Title | Problem |
|---|---|---|
| med-1 | Greek Salad with Feta | NO: missing; SV: missing |
| med-2 | Hummus with Veggie Sticks | NO: missing; SV: missing |
| med-3 | Baked Sea Bass with Lemon and Herbs | NO: missing; SV: missing |
| med-4 | Tabbouleh | NO: missing; SV: missing |
| med-5 | Shakshuka | NO: missing; SV: missing |
| med-6 | Falafel Wrap | NO: missing; SV: missing |

### nordic-classics

6 of 6 recipes.

| Id | Title | Problem |
|---|---|---|
| nor-1 | Havregrøt med bær / Oatmeal with Berries | NO: missing; SV: missing |
| nor-2 | Rugbrød med avokado / Rye Bread with Avocado | NO: missing; SV: missing |
| nor-3 | Laksesuppe / Salmon Soup | NO: missing; SV: missing |
| nor-4 | Fiskekaker med rotgrønnsaker / Fish Cakes with Root Vegetables | NO: missing; SV: missing |
| nor-5 | Kyllingsuppe / Chicken Soup | NO: missing; SV: missing |
| nor-6 | Blomkålsuppe / Cauliflower Soup | NO: missing; SV: missing |

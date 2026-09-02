/* Adds orn-61..orn-65: Chickpea Fries, Golden "Chicken" Soup, Warm Carob
 * Drink, Blueberry Breakfast Pie and Cinnamon-Date Applesauce.
 * EN canonical + NO + SV, author-supplied nutrition.
 *
 * Step text is de-quantified as usual — the drafts restated every scaled
 * amount ("toast 200 grams chickpea flour"), which goes wrong the moment
 * the serving count changes. Times, temperatures, tin sizes and cut
 * dimensions stay, since none of those scale with batch size.
 *
 * Three things about the source drafts worth knowing:
 *
 *  - The pie's nutrition arrived separately from the rest of its draft and
 *    states no serving weight, so that is derived from the two calorie
 *    figures it does give: 344 per serving against 176 per 100 g puts a
 *    serving at ~195 g.
 *  - The pie's notes end mid-sentence ("Scaling note: if you double this,
 *    don"). That fragment is dropped rather than guessed at.
 *  - The pie splits one 500 g bag of blueberries across two uses — 400 g
 *    cooked down, 100 g folded in whole. That is the same problem the two
 *    scald breads had with oat flour, so it gets the same fix: two
 *    ingredient lines, named so the shopping list still merges them back
 *    into one 500 g entry.
 *
 * `ornish-green` is applied only where the source states it (the soup and
 * the applesauce). The rest get condition tags computed from their real
 * numbers by audit_condition_tags.cjs.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const recipes = []

// ── orn-61: Chickpea Fries ────────────────────────────────────────────────
recipes.push({
  id: 'orn-61',
  title: 'Chickpea Fries (Baked, No Oil)',
  category: 'Side',
  servings: 4,
  prepTime: 20,
  cookTime: 260,
  description: 'Toasted chickpea flour set like panisse, cut into fries, baked crisp, and finished hot with a smoky nutritional yeast dust — garlicky, savoury, satisfyingly crunchy without a drop of oil.',
  tags: ['side', 'vegan', 'oil-free', 'no-added-sugar', 'high-protein', 'gluten-free'],
  kcal: 216,
  servingWeightGrams: 220,
  ingredients: [
    { quantity: 200, unit: 'g', name: 'chickpea flour (besan)' },
    { quantity: 800, unit: 'ml', name: 'water, cold' },
    { quantity: 1, unit: 'tsp', name: 'garlic powder' },
    { quantity: 1.5, unit: 'tsp', name: 'onion powder' },
    { quantity: 2, unit: 'tbsp', name: 'nutritional yeast, for the batter' },
    { quantity: 0.4, unit: 'tsp', name: 'fine sea salt' },
    { quantity: 1, unit: 'tsp', name: 'smoked paprika, for the finishing dust' },
    { quantity: 1, unit: 'tbsp', name: 'nutritional yeast, for the finishing dust' },
  ],
  steps: [
    "Dry-toast the flour: In a large dry saucepan over medium heat, toast the chickpea flour for 3 minutes, stirring constantly, until fragrant and slightly darkened. Don't let it burn — this is the trick that gives the fries a deep, nutty flavour instead of tasting raw.",
    'Whisk in the liquid: Take the pan off the heat. Slowly whisk in the cold water, a little at a time, until completely smooth with no lumps. Whisk in the garlic powder, onion powder, the nutritional yeast for the batter, and the salt.',
    'Cook to a thick paste: Return the pan to medium heat and cook, whisking constantly (switch to a wooden spoon as it thickens), until the mixture is a thick, smooth polenta-like paste that pulls away from the sides of the pan — about 9 minutes.',
    'Set the batter: Immediately pour into a parchment-lined 20x20 cm tin. Spread to an even 1.5 cm thickness with a wet spatula. Cool at room temperature for 20 minutes.',
    "Chill until firm: Refrigerate uncovered for at least 3 hours, or overnight, until fully firm and easy to cut. This resting time is essential — don't skip it or the fries won't hold their shape.",
    'Cut into fries: Turn the set slab out onto a board and cut into batons roughly 1.5 x 1.5 x 8 cm.',
    'Bake until crisp: Arrange the fries on a parchment-lined tray, not touching. Bake at 220°C (fan) for 35 minutes, flip each one, then bake a further 15–20 minutes until golden and crisp at the edges.',
    'Dust while hot: Straight from the oven, tip the hot fries into a bowl with the smoked paprika and the nutritional yeast for the finishing dust. Toss gently — the residual heat is enough to make the dust cling without any oil. Serve immediately.',
  ],
  notes: "Chef's note: the toast-then-boil step is what separates these from bland healthy fries — the same trick that makes proper French panisse taste good without a fryer. Batches well: it doubles cleanly in a wider tray, but keep the slab the same thickness rather than using a smaller, deeper tin, or the centre won't set. Substitution: swap the chickpea flour 1:1 for dried chickpeas ground fine in a high-speed blender and sifted; fava bean flour works in the same ratio. Salt: this sits close to the sodium ceiling by design, at 253 mg against the 300 mg limit, with the small buffer left because these are estimated rather than lab-verified values. There is no dedicated omega-3 ingredient here, so cover that elsewhere in the day.",
  nutrition: { perServing: {
    calories: 216, protein: 13.75, totalFat: 3.65, saturatedFat: 0.43, polyunsaturatedFat: 1.5,
    monounsaturatedFat: 0.7, omega3: 0, omega6: 1.5, cholesterol: 0, totalCarbs: 32.1,
    totalSugars: 6.0, addedSugar: 0, fiber: 6.5, calcium: 25, potassium: 455, copper: 0.41,
    iron: 2.6, magnesium: 86, manganese: 0.98, selenium: 4.9, phosphorus: 174, zinc: 1.5,
    sodium: 253, vitaminA: 3, vitaminB6: 0.65, vitaminB12: 1.2, vitaminC: 0.5, vitaminD: 0,
    vitaminE: 0.48, vitaminK: 2.3, folate: 264, thiamin: 1.30, riboflavin: 0.78, niacin: 4.25, choline: 34,
  } },
  translations: {
    no: {
      title: 'Kikertpommes (ovnsbakt, uten olje)',
      description: 'Ristet kikertmel stivnet som panisse, skåret i staver, bakt sprø og strødd varmt med røkt næringsgjær — hvitløksrik, smakfull og skikkelig sprø uten en dråpe olje.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'kikertmel (besan)' },
        { quantity: 800, unit: 'ml', name: 'vann, kaldt' },
        { quantity: 1, unit: 'tsp', name: 'hvitløkspulver' },
        { quantity: 1.5, unit: 'tsp', name: 'løkpulver' },
        { quantity: 2, unit: 'tbsp', name: 'næringsgjær, til røren' },
        { quantity: 0.4, unit: 'tsp', name: 'fint havsalt' },
        { quantity: 1, unit: 'tsp', name: 'røkt paprikapulver, til drysset' },
        { quantity: 1, unit: 'tbsp', name: 'næringsgjær, til drysset' },
      ],
      steps: [
        'Tørrrist melet: Rist kikertmelet i en stor, tørr kjele over middels varme i 3 minutter mens du rører hele tiden, til det dufter og har mørknet litt. Ikke la det brenne — dette er trikset som gir stavene en dyp, nøtteaktig smak i stedet for å smake rått.',
        'Visp inn væsken: Ta kjelen av varmen. Visp sakte inn det kalde vannet, litt om gangen, til alt er helt glatt og uten klumper. Visp inn hvitløkspulver, løkpulver, næringsgjæren til røren og saltet.',
        'Kok til tykk masse: Sett kjelen tilbake på middels varme og kok mens du visper hele tiden (bytt til tresleiv når det tykner), til massen er tykk, glatt og polentaaktig og slipper kanten av kjelen — cirka 9 minutter.',
        'La røren stivne: Hell den straks over i en form på 20x20 cm kledd med bakepapir. Bre den ut i jevn 1,5 cm tykkelse med en fuktig slikkepott. Avkjøl i romtemperatur i 20 minutter.',
        'Sett kaldt til den er fast: Sett den udekket i kjøleskapet i minst 3 timer, eller natten over, til den er helt fast og lett å skjære. Denne hviletiden er avgjørende — hopper du over den, holder ikke stavene formen.',
        'Skjær i staver: Vend den stivnede platen ut på en fjøl og skjær den i staver på cirka 1,5 x 1,5 x 8 cm.',
        'Stek sprø: Legg stavene på et brett med bakepapir uten at de berører hverandre. Stek på 220°C (varmluft) i 35 minutter, snu hver enkelt, og stek videre i 15–20 minutter til de er gyllne og sprø i kantene.',
        'Dryss mens de er varme: Rett fra ovnen har du de varme stavene over i en bolle sammen med den røkte paprikaen og næringsgjæren til drysset. Vend forsiktig — restvarmen er nok til at drysset fester seg uten olje. Server med en gang.',
      ],
      notes: 'Kokketips: rist-så-kok-steget er det som skiller disse fra kjedelige «sunne» pommes — samme triks som gjør ekte fransk panisse god uten frityr. Egner seg godt til dobling: bruk et bredere brett, men behold samme tykkelse på platen i stedet for en mindre og dypere form, ellers stivner ikke midten. Erstatning: bytt kikertmelet 1:1 med tørkede kikerter malt fint i en kraftig blender og siktet; bønnemel av favabønner fungerer i samme forhold. Salt: dette ligger tett opp mot natriumtaket med vilje, på 253 mg mot grensen på 300 mg, og den lille bufferen står igjen fordi verdiene er estimerte og ikke laboratorietestede. Det er ingen egen omega-3-kilde her, så dekk det opp ellers i løpet av dagen.',
    },
    sv: {
      title: 'Kikärtspommes (ugnsbakade, utan olja)',
      description: 'Rostat kikärtsmjöl som stelnat likt panisse, skuret i stavar, bakat frasigt och strött varmt med rökt näringsjäst — vitlöksrikt, smakrikt och rejält frasigt utan en droppe olja.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'kikärtsmjöl (besan)' },
        { quantity: 800, unit: 'ml', name: 'vatten, kallt' },
        { quantity: 1, unit: 'tsp', name: 'vitlökspulver' },
        { quantity: 1.5, unit: 'tsp', name: 'lökpulver' },
        { quantity: 2, unit: 'tbsp', name: 'näringsjäst, till smeten' },
        { quantity: 0.4, unit: 'tsp', name: 'fint havssalt' },
        { quantity: 1, unit: 'tsp', name: 'rökt paprikapulver, till strösslet' },
        { quantity: 1, unit: 'tbsp', name: 'näringsjäst, till strösslet' },
      ],
      steps: [
        'Torrosta mjölet: Rosta kikärtsmjölet i en stor, torr kastrull över medelvärme i 3 minuter under ständig omrörning, tills det doftar och mörknat något. Låt det inte brännas — det här är tricket som ger stavarna en djup, nötig smak i stället för att smaka rått.',
        'Vispa i vätskan: Ta kastrullen från värmen. Vispa långsamt i det kalla vattnet, lite i taget, tills allt är helt slätt och klumpfritt. Vispa i vitlökspulver, lökpulver, näringsjästen till smeten och saltet.',
        'Koka till tjock massa: Ställ tillbaka kastrullen på medelvärme och koka under ständig vispning (byt till träslev när det tjocknar), tills massan är tjock, slät och polentaliknande och släpper kastrullens kanter — cirka 9 minuter.',
        'Låt smeten stelna: Häll genast över i en form på 20x20 cm klädd med bakplåtspapper. Bred ut till jämn 1,5 cm tjocklek med en fuktig slickepott. Svalna i rumstemperatur i 20 minuter.',
        'Kyl tills fast: Ställ den otäckt i kylen i minst 3 timmar, eller över natten, tills den är helt fast och lätt att skära. Vilotiden är avgörande — hoppar du över den håller stavarna inte formen.',
        'Skär i stavar: Stjälp upp den stelnade plattan på en skärbräda och skär i stavar på cirka 1,5 x 1,5 x 8 cm.',
        'Baka frasiga: Lägg stavarna på en plåt med bakplåtspapper utan att de rör varandra. Grädda i 220°C (varmluft) i 35 minuter, vänd varje stav, och grädda vidare i 15–20 minuter tills de är gyllene och frasiga i kanterna.',
        'Strö medan de är varma: Direkt från ugnen häller du de varma stavarna i en skål tillsammans med den rökta paprikan och näringsjästen till strösslet. Vänd försiktigt — restvärmen räcker för att strösslet ska fästa utan olja. Servera genast.',
      ],
      notes: 'Kockens tips: rosta-sedan-koka-steget är det som skiljer de här från tråkiga "nyttiga" pommes — samma trick som gör äkta fransk panisse god utan fritering. Fungerar bra att dubbla: använd en bredare plåt men behåll samma tjocklek på plattan i stället för en mindre och djupare form, annars stelnar inte mitten. Ersättning: byt kikärtsmjölet 1:1 mot torkade kikärter malda fint i en kraftig mixer och siktade; bondbönsmjöl fungerar i samma förhållande. Salt: det här ligger nära natriumtaket med avsikt, på 253 mg mot gränsen 300 mg, och den lilla bufferten står kvar eftersom värdena är uppskattade och inte laboratorietestade. Det finns ingen egen omega-3-källa här, så täck det på annat håll under dagen.',
    },
  },
})

// ── orn-62: Golden "Chicken" Soup ─────────────────────────────────────────
recipes.push({
  id: 'orn-62',
  title: 'Golden No-Chicken Soup',
  category: 'Soup',
  servings: 4,
  prepTime: 15,
  cookTime: 20,
  description: 'Pressure-extracted broth with poultry herbs, torn oyster mushrooms and chickpeas. Ornish GREEN.',
  tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber', 'high-protein'],
  kcal: 263,
  servingWeightGrams: 500,
  ingredients: [
    { quantity: 110, unit: 'g', name: 'onion, diced' },
    { quantity: 140, unit: 'g', name: 'carrots, sliced' },
    { quantity: 120, unit: 'g', name: 'celery stalks, sliced' },
    { quantity: 3, unit: 'clove', name: 'garlic, minced' },
    { quantity: 150, unit: 'g', name: 'oyster mushrooms (or 25 g dried shiitake)' },
    { quantity: 400, unit: 'g', name: 'cooked chickpeas, unsalted or well-rinsed' },
    { quantity: 1000, unit: 'ml', name: 'water' },
    { quantity: 1, unit: 'tsp', name: 'dried thyme' },
    { quantity: 1, unit: 'tsp', name: 'dried sage' },
    { quantity: 0.5, unit: 'tsp', name: 'dried marjoram' },
    { quantity: 0.3, unit: 'tsp', name: 'ground turmeric' },
    { quantity: 2, unit: 'tbsp', name: 'nutritional yeast (unfortified)' },
    { quantity: 12, unit: 'g', name: 'white miso paste' },
    { quantity: 0.5, unit: 'pcs', name: 'lemon, juiced' },
    { quantity: 15, unit: 'g', name: 'fresh parsley, chopped' },
    { quantity: 28, unit: 'g', name: 'ground flaxseed, stirred in at serving' },
  ],
  steps: [
    "Bloom the herbs: Set the cooker to Brown/Sauté. When hot, add the thyme, sage, marjoram and turmeric to the dry pot and stir constantly for 30 seconds until fragrant. This is where the poultry character comes from — don't skip it.",
    'Water-sauté the base: Add the onion, carrots, celery and a splash of water. Cook 5 minutes, stirring, adding a little more water if it catches.',
    'Dry-sear the mushrooms: Tear the oyster mushrooms into strips, add them and cook 3 minutes without extra water — let them release their liquid and lightly catch on the base. This builds the savoury depth and the shredded texture.',
    "Garlic: Add the garlic and stir 30 seconds. Deglaze with a splash of water, scraping the bottom clean so the pot doesn't scorch under pressure.",
    'Pressure cook: Add the chickpeas and the water. Seal and pressure cook on Soup for 16 minutes, then let the pressure release naturally for 10 minutes before venting the rest.',
    'Finish off-heat: Turn the cooker off. Stir in the nutritional yeast. Slacken the miso paste in a ladleful of broth in a small bowl, then stir it back in — never let it boil, or the cultures are lost.',
    'Brighten and serve: Off the heat, stir in the lemon juice and parsley. Ladle into bowls and divide the ground flaxseed between them at the table — added off-heat, per serving, to protect the ALA.',
  ],
  notes: "Chef's note: if the broth tastes flat it is almost always acid, not salt — add another squeeze of lemon before reaching for the salt. Sodium lands at 178 mg per serving, leaving roughly 120 mg of headroom, about an eighth of a teaspoon of salt across the whole pot, if you want it. Chickpeas: use home-cooked or no-salt-added tinned. Standard salted tinned chickpeas add around 150 mg sodium per serving even after rinsing, and will tip this to ORANGE. Substitutions: king oyster or chestnut mushrooms for oyster (tear rather than slice either way); white beans for chickpeas, slightly lower in protein and creamier; a teaspoon of a dried poultry-style blend in place of the four herbs. Stovetop: simmer covered for 25 minutes instead of pressure cooking.",
  nutrition: { perServing: {
    calories: 263, protein: 13.8, totalFat: 6.0, saturatedFat: 0.6, polyunsaturatedFat: 3.3,
    monounsaturatedFat: 1.2, omega3: 1.62, omega6: 1.61, cholesterol: 0, totalCarbs: 41.4,
    totalSugars: 8.8, addedSugar: 0, fiber: 13.3, calcium: 111, potassium: 803, copper: 0.68,
    iron: 3.9, magnesium: 97, manganese: 1.3, selenium: 5.7, phosphorus: 321, zinc: 2.8,
    sodium: 178, vitaminA: 316, vitaminB6: 0.32, vitaminB12: 0, vitaminC: 14, vitaminD: 0.3,
    vitaminE: 0.7, vitaminK: 80, folate: 213, thiamin: 0.29, riboflavin: 0.29, niacin: 3.5, choline: 73,
  } },
  translations: {
    no: {
      title: 'Gyllen «kylling»-suppe',
      description: 'Trykk-trukket kraft med fjærkreurter, revet østerssopp og kikerter. Ornish GREEN.',
      ingredients: [
        { quantity: 110, unit: 'g', name: 'løk, i terninger' },
        { quantity: 140, unit: 'g', name: 'gulrøtter, i skiver' },
        { quantity: 120, unit: 'g', name: 'stangselleri, i skiver' },
        { quantity: 3, unit: 'clove', name: 'hvitløk, finhakket' },
        { quantity: 150, unit: 'g', name: 'østerssopp (eller 25 g tørket shiitake)' },
        { quantity: 400, unit: 'g', name: 'kokte kikerter, usaltede eller godt skylt' },
        { quantity: 1000, unit: 'ml', name: 'vann' },
        { quantity: 1, unit: 'tsp', name: 'tørket timian' },
        { quantity: 1, unit: 'tsp', name: 'tørket salvie' },
        { quantity: 0.5, unit: 'tsp', name: 'tørket merian' },
        { quantity: 0.3, unit: 'tsp', name: 'malt gurkemeie' },
        { quantity: 2, unit: 'tbsp', name: 'næringsgjær (uberiket)' },
        { quantity: 12, unit: 'g', name: 'hvit misopasta' },
        { quantity: 0.5, unit: 'pcs', name: 'sitron, presset' },
        { quantity: 15, unit: 'g', name: 'fersk persille, hakket' },
        { quantity: 28, unit: 'g', name: 'malt linfrø, røres inn ved servering' },
      ],
      steps: [
        'Vekk urtene: Sett trykkokeren på bruning/steking. Når den er varm, ha timian, salvie, merian og gurkemeie i den tørre gryta og rør hele tiden i 30 sekunder til det dufter. Det er her fjærkrepreget kommer fra — ikke hopp over dette.',
        'Vann-sauter grunnlaget: Tilsett løk, gulrøtter, stangselleri og en skvett vann. Stek i 5 minutter under omrøring, og spe med litt mer vann om det fester seg.',
        'Tørrstek soppen: Riv østerssoppen i strimler, ha den i og stek i 3 minutter uten ekstra vann — la den slippe væsken sin og feste seg lett i bunnen. Det er dette som bygger den fyldige smaken og den trevlete teksturen.',
        'Hvitløk: Tilsett hvitløken og rør i 30 sekunder. Spe med en skvett vann og skrap bunnen ren, så gryta ikke svir seg under trykk.',
        'Trykkok: Tilsett kikertene og vannet. Forsegl og trykkok på suppeprogram i 16 minutter, og la så trykket falle naturlig i 10 minutter før du slipper ut resten.',
        'Avslutt utenom varmen: Slå av kokeren. Rør inn næringsgjæren. Rør ut misopastaen i en øse kraft i en liten bolle, og rør den så tilbake i gryta — la den aldri koke, ellers går kulturene tapt.',
        'Frisk opp og server: Utenom varmen rører du inn sitronsaften og persillen. Øs opp i skåler og fordel det malte linfrøet mellom dem ved bordet — tilsatt utenom varmen, per porsjon, for å beskytte ALA-en.',
      ],
      notes: 'Kokketips: smaker kraften flatt, er det nesten alltid syre som mangler, ikke salt — ta en ekstra skvis sitron før du griper saltet. Natrium lander på 178 mg per porsjon, og lar deg ha rundt 120 mg igjen, cirka ⅛ ts salt for hele gryta, om du vil. Kikerter: bruk hjemmekokte eller hermetiske uten tilsatt salt. Vanlige saltede hermetiske kikerter tilfører rundt 150 mg natrium per porsjon selv etter skylling, og vipper denne over til ORANGE. Erstatninger: kongeøsterssopp eller kastanjesopp i stedet for østerssopp (riv den uansett, ikke skjær); hvite bønner i stedet for kikerter, litt lavere i protein og kremere; 1 ts ferdig fjærkrekrydderblanding i stedet for de fire urtene. På komfyren: la det småkoke under lokk i 25 minutter i stedet for å trykkoke.',
    },
    sv: {
      title: 'Gyllene "kyckling"-soppa',
      description: 'Tryckkokt buljong med fågelörter, riven ostronskivling och kikärter. Ornish GREEN.',
      ingredients: [
        { quantity: 110, unit: 'g', name: 'lök, tärnad' },
        { quantity: 140, unit: 'g', name: 'morötter, skivade' },
        { quantity: 120, unit: 'g', name: 'stjälkselleri, skivad' },
        { quantity: 3, unit: 'clove', name: 'vitlök, finhackad' },
        { quantity: 150, unit: 'g', name: 'ostronskivling (eller 25 g torkad shiitake)' },
        { quantity: 400, unit: 'g', name: 'kokta kikärter, osaltade eller väl sköljda' },
        { quantity: 1000, unit: 'ml', name: 'vatten' },
        { quantity: 1, unit: 'tsp', name: 'torkad timjan' },
        { quantity: 1, unit: 'tsp', name: 'torkad salvia' },
        { quantity: 0.5, unit: 'tsp', name: 'torkad mejram' },
        { quantity: 0.3, unit: 'tsp', name: 'malen gurkmeja' },
        { quantity: 2, unit: 'tbsp', name: 'näringsjäst (oberikad)' },
        { quantity: 12, unit: 'g', name: 'vit misopasta' },
        { quantity: 0.5, unit: 'pcs', name: 'citron, pressad' },
        { quantity: 15, unit: 'g', name: 'färsk persilja, hackad' },
        { quantity: 28, unit: 'g', name: 'malda linfrön, rörs i vid servering' },
      ],
      steps: [
        'Väck örterna: Ställ tryckkokaren på bryning/stekning. När den är varm, lägg timjan, salvia, mejram och gurkmeja i den torra grytan och rör hela tiden i 30 sekunder tills det doftar. Det är här fågelkaraktären kommer ifrån — hoppa inte över det.',
        'Vattensautera basen: Tillsätt lök, morötter, selleri och en skvätt vatten. Stek i 5 minuter under omrörning, och späd med lite mer vatten om det fastnar.',
        'Torrstek svampen: Riv ostronskivlingen i strimlor, lägg i den och stek i 3 minuter utan extra vatten — låt den släppa sin vätska och fastna lätt i botten. Det är detta som bygger den fylliga smaken och den trådiga konsistensen.',
        'Vitlök: Tillsätt vitlöken och rör i 30 sekunder. Späd med en skvätt vatten och skrapa botten ren, så att grytan inte bränner vid under tryck.',
        'Tryckkoka: Tillsätt kikärterna och vattnet. Förslut och tryckkoka på soppprogram i 16 minuter, och låt sedan trycket sjunka naturligt i 10 minuter innan du släpper ut resten.',
        'Avsluta utanför värmen: Stäng av kokaren. Rör i näringsjästen. Rör ut misopastan i en slev buljong i en liten skål, och rör sedan tillbaka den — låt den aldrig koka, då går kulturerna förlorade.',
        'Fräscha upp och servera: Utanför värmen rör du i citronsaften och persiljan. Ös upp i skålar och fördela de malda linfröna mellan dem vid bordet — tillsatta utanför värmen, per portion, för att skydda ALA:n.',
      ],
      notes: 'Kockens tips: smakar buljongen platt är det nästan alltid syra som saknas, inte salt — ta en extra klick citron innan du sträcker dig efter saltet. Natrium landar på 178 mg per portion, vilket lämnar runt 120 mg kvar, cirka ⅛ tsk salt för hela grytan, om du vill. Kikärter: använd hemkokta eller konserverade utan tillsatt salt. Vanliga saltade konserverade kikärter tillför runt 150 mg natrium per portion även efter sköljning, och tippar den här till ORANGE. Ersättningar: kungsostronskivling eller kastanjechampinjon i stället för ostronskivling (riv den ändå, skiva inte); vita bönor i stället för kikärter, något lägre i protein och krämigare; 1 tsk färdig fågelkryddblandning i stället för de fyra örterna. På spisen: låt sjuda under lock i 25 minuter i stället för att tryckkoka.',
    },
  },
})

// ── orn-63: Warm Carob Drink ──────────────────────────────────────────────
recipes.push({
  id: 'orn-63',
  title: 'Warm Carob Drink with Almond Milk',
  category: 'Drink',
  servings: 4,
  prepTime: 10,
  cookTime: 10,
  description: 'Warm carob drink with dates, cinnamon and flaxseed, made with homemade almond milk — deep, cosy, no added sugar or oil.',
  tags: ['drink', 'vegan', 'oil-free', 'no-added-sugar', 'caffeine-free'],
  kcal: 133,
  servingWeightGrams: 287,
  ingredients: [
    { quantity: 32, unit: 'g', name: 'carob powder' },
    { quantity: 80, unit: 'ml', name: 'boiling water, for blooming the carob' },
    { quantity: 72, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 800, unit: 'ml', name: 'unsweetened almond milk (homemade)' },
    { quantity: 120, unit: 'ml', name: 'hot water, for soaking the dates' },
    { quantity: 0.5, unit: 'tsp', name: 'ground cinnamon' },
    { quantity: 0.3, unit: 'tsp', name: 'vanilla powder' },
    { quantity: 0.1, unit: 'tsp', name: 'sea salt' },
    { quantity: 28, unit: 'g', name: 'ground flaxseed' },
  ],
  steps: [
    'Bloom the carob: Put the carob powder in a small bowl and pour over the boiling water. Whisk hard until you have a smooth, glossy paste with no dry lumps. Let it sit 2 minutes — this is what removes the raw, chalky edge.',
    'Soften the dates: Cover the pitted dates with the hot water and leave to soften while the carob blooms.',
    'Heat the base: Pour the almond milk into a saucepan with the carob paste, the dates and their soaking water, the cinnamon, vanilla powder and salt. Warm over medium heat, whisking, until steaming but not boiling.',
    'Blend off the heat: Take the pan off the heat. Add the ground flaxseed, pour everything into the blender and run 45–60 seconds until completely smooth and slightly frothy. Adding the flaxseed off the heat keeps the omega-3 intact.',
    'Serve: Pour into four mugs. It thickens as it stands — whisk in a splash of hot water if you like it thinner. Dust with a little extra cinnamon.',
  ],
  notes: 'Blend at full speed until the dates disappear completely. Reheat gently, and never boil it once the flaxseed is in. Homemade almond milk is thinner and lower in protein than soy — for more body, blend in a spoonful of the almond pulp rather than discarding it, or use unsweetened soy milk instead.',
  nutrition: { perServing: {
    calories: 133, protein: 2.7, totalFat: 5.6, saturatedFat: 0.5, polyunsaturatedFat: 3.6,
    monounsaturatedFat: 1.3, omega3: 1.83, omega6: 1.55, cholesterol: 0, totalCarbs: 25.5,
    totalSugars: 16.0, addedSugar: 0, fiber: 6.8, calcium: 62, potassium: 410, copper: 0.20,
    iron: 1.3, magnesium: 78, manganese: 0.62, selenium: 1.5, phosphorus: 105, zinc: 0.75,
    sodium: 45, vitaminA: 1, vitaminB6: 0.09, vitaminB12: 0, vitaminC: 0.1, vitaminD: 0,
    vitaminE: 2.6, vitaminK: 0.6, folate: 33, thiamin: 0.06, riboflavin: 0.12, niacin: 0.9, choline: 20,
  } },
  translations: {
    no: {
      title: 'Varm karobdrikk med mandelmelk',
      description: 'Varm karobdrikk med dadler, kanel og linfrø, laget på hjemmelaget mandelmelk — dyp, koselig, uten tilsatt sukker eller olje.',
      ingredients: [
        { quantity: 32, unit: 'g', name: 'carobpulver' },
        { quantity: 80, unit: 'ml', name: 'kokende vann, til å røre ut caroben' },
        { quantity: 72, unit: 'g', name: 'Medjool-dadler, uten stein' },
        { quantity: 800, unit: 'ml', name: 'usøtet mandelmelk (hjemmelaget)' },
        { quantity: 120, unit: 'ml', name: 'varmt vann, til bløtlegging av daddlene' },
        { quantity: 0.5, unit: 'tsp', name: 'malt kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljepulver' },
        { quantity: 0.1, unit: 'tsp', name: 'havsalt' },
        { quantity: 28, unit: 'g', name: 'malt linfrø' },
      ],
      steps: [
        'Rør ut caroben: Ha carobpulveret i en liten bolle og hell over det kokende vannet. Visp kraftig til du har en glatt, blank pasta uten tørre klumper. La den stå i 2 minutter — det er dette som fjerner den rå, kritaktige kanten.',
        'Bløtlegg daddlene: Dekk de urkjernede daddlene med det varme vannet og la dem mykne mens caroben står.',
        'Varm opp grunnlaget: Hell mandelmelken i en kjele sammen med carobpastaen, daddlene og bløtevannet deres, kanelen, vaniljepulveret og saltet. Varm opp over middels varme mens du visper, til det damper uten å koke.',
        'Blend utenom varmen: Ta kjelen av varmen. Tilsett det malte linfrøet, hell alt over i blenderen og kjør i 45–60 sekunder til det er helt glatt og litt skummende. Å tilsette linfrøet utenom varmen holder omega-3-en intakt.',
        'Server: Hell i fire krus. Den tykner mens den står — visp inn en skvett varmt vann om du vil ha den tynnere. Dryss over litt ekstra kanel.',
      ],
      notes: 'Kjør på full hastighet til daddlene forsvinner helt. Varm den forsiktig opp igjen, og la den aldri koke etter at linfrøet er i. Hjemmelaget mandelmelk er tynnere og har mindre protein enn soya — vil du ha mer fylde, blend inn en skje av mandelresten i stedet for å kaste den, eller bruk usøtet soyamelk i stedet.',
    },
    sv: {
      title: 'Varm carobdryck med mandelmjölk',
      description: 'Varm carobdryck med dadlar, kanel och linfrö, gjord på hemgjord mandelmjölk — djup, mysig, utan tillsatt socker eller olja.',
      ingredients: [
        { quantity: 32, unit: 'g', name: 'carobpulver' },
        { quantity: 80, unit: 'ml', name: 'kokande vatten, för att röra ut caroben' },
        { quantity: 72, unit: 'g', name: 'Medjooldadlar, urkärnade' },
        { quantity: 800, unit: 'ml', name: 'osötad mandelmjölk (hemgjord)' },
        { quantity: 120, unit: 'ml', name: 'varmt vatten, till blötläggning av dadlarna' },
        { quantity: 0.5, unit: 'tsp', name: 'malen kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljpulver' },
        { quantity: 0.1, unit: 'tsp', name: 'havssalt' },
        { quantity: 28, unit: 'g', name: 'malda linfrön' },
      ],
      steps: [
        'Rör ut caroben: Lägg carobpulvret i en liten skål och häll över det kokande vattnet. Vispa kraftigt tills du har en slät, blank pasta utan torra klumpar. Låt den stå i 2 minuter — det är detta som tar bort den råa, kritaktiga kanten.',
        'Blötlägg dadlarna: Täck de urkärnade dadlarna med det varma vattnet och låt dem mjukna medan caroben står.',
        'Värm basen: Häll mandelmjölken i en kastrull tillsammans med carobpastan, dadlarna och deras blötvatten, kanelen, vaniljpulvret och saltet. Värm över medelvärme under vispning, tills det ångar utan att koka.',
        'Mixa utanför värmen: Ta kastrullen från värmen. Tillsätt de malda linfröna, häll allt i mixern och kör i 45–60 sekunder tills det är helt slätt och lite skummigt. Att tillsätta linfröet utanför värmen håller omega-3:an intakt.',
        'Servera: Häll upp i fyra muggar. Den tjocknar medan den står — vispa i en skvätt varmt vatten om du vill ha den tunnare. Strö över lite extra kanel.',
      ],
      notes: 'Kör på full hastighet tills dadlarna försvinner helt. Värm den försiktigt igen, och låt den aldrig koka efter att linfröet är i. Hemgjord mandelmjölk är tunnare och har mindre protein än soja — vill du ha mer fyllighet, mixa i en sked av mandelmassan i stället för att slänga den, eller använd osötad sojamjölk i stället.',
    },
  },
})

// ── orn-64: Blueberry Breakfast Pie ───────────────────────────────────────
// Serving weight is derived rather than stated: 344 kcal per serving
// against 176 per 100 g puts a serving at ~195 g.
recipes.push({
  id: 'orn-64',
  title: 'Blueberry Breakfast Pie',
  category: 'Breakfast',
  servings: 4,
  prepTime: 25,
  cookTime: 500,
  description: 'A no-bake blueberry filling over a toasted-oat date crust. Deeply purple, jammy, lemon-bright — and it sets overnight, so breakfast is already made. Built for frozen blueberries.',
  tags: ['breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 344,
  servingWeightGrams: 195,
  nutrition: { perServing: {
    calories: 344, protein: 9.1, totalFat: 7.2, saturatedFat: 0.9, polyunsaturatedFat: 4.1,
    monounsaturatedFat: 1.4, omega3: 2.6, omega6: 1.6, cholesterol: 0, totalCarbs: 66,
    totalSugars: 32.7, addedSugar: 0, fiber: 11.9, calcium: 100, potassium: 506, copper: 0.44,
    iron: 2.8, magnesium: 113, manganese: 2.1, selenium: 16.6, phosphorus: 255, zinc: 2.2,
    sodium: 155, vitaminA: 4, vitaminB6: 0.21, vitaminB12: 0, vitaminC: 12, vitaminD: 0,
    vitaminE: 0.9, vitaminK: 26, folate: 39, thiamin: 0.46, riboflavin: 0.13, niacin: 2.0, choline: 28.5,
  } },
  ingredients: [
    { quantity: 130, unit: 'g', name: 'rolled oats' },
    { quantity: 90, unit: 'g', name: 'Medjool dates, pitted, for the crust' },
    { quantity: 12, unit: 'g', name: 'chia seeds, for the crust' },
    { quantity: 1, unit: 'tsp', name: 'ground cinnamon' },
    { quantity: 0.3, unit: 'tsp', name: 'sea salt' },
    { quantity: 3, unit: 'tbsp', name: 'water, for the crust' },
    { quantity: 400, unit: 'g', name: 'frozen blueberries' },
    { quantity: 100, unit: 'g', name: 'frozen blueberries to fold in at the end' },
    { quantity: 30, unit: 'g', name: 'Medjool dates, pitted, for the filling' },
    { quantity: 8, unit: 'g', name: 'chia seeds, for the filling' },
    { quantity: 1, unit: 'pcs', name: 'lemon — juice, plus the zest if using' },
    { quantity: 1, unit: 'tsp', name: 'vanilla powder' },
    { quantity: 28, unit: 'g', name: 'ground flaxseed' },
  ],
  steps: [
    'Dry-toast the oats: Toast the oats in a dry pan over medium heat, stirring often, until they smell nutty and turn a shade darker. This is the single biggest flavour step — untoasted oats give you a flat crust.',
    'Blend the crust: Blend the toasted oats to a coarse flour. Add the dates for the crust, the chia seeds for the crust, the cinnamon, salt and water. Blend until it clumps when pinched — sticky, not smooth.',
    'Press and bake: Line a 22 cm pie dish with baking paper. Press the dough firmly up the sides first, then across the base — pressing the rim first is what keeps the edge from slumping. Bake at 180°C until set and fragrant, then cool completely.',
    'Cook the filling: Put the frozen blueberries into a pan straight from the freezer with the dates for the filling. Add no water — frozen berries release plenty of their own. Cook over medium heat, stirring, until they collapse and the liquid reduces to a thick, glossy jam that holds a line when you drag a spoon through it.',
    "Cool, then finish off the heat: Take the pan off the heat and let the filling cool 10 minutes. Stir in the chia seeds for the filling, the ground flaxseed, the vanilla powder and the lemon juice. Add the zest now too if you are using it — off the heat is non-negotiable, it protects the flaxseed's omega-3 and the zest's aromatic oils alike. If it still looks loose, add a teaspoon more chia and give it another 10 minutes.",
    'Fold in the frozen berries: Fold the blueberries reserved for folding through the warm filling, straight from the freezer. They thaw in seconds but hold their shape, so they burst in the mouth against the jammy base — this contrast is what makes it taste like pie rather than porridge.',
    'Fill and chill: Spoon the filling into the cooled crust and level it. Chill until fully set — overnight is ideal, and the crust firms up further as it rests.',
  ],
  notes: "Chef's note: the crust bakes but the filling never does — that is deliberate. Cooking the flaxseed would degrade the ALA, and the berries folded in at the end stay whole for texture. Frozen fruit: never thaw the berries first. Thawed blueberries go slack and leak, and the portion reserved for folding in would collapse into the jam instead of staying whole — straight from the freezer for both. Zest: purely optional. It adds a floral, slightly bitter top note some people love and others find sharp; leave it out and the pie is still fully balanced on the juice alone. Substitutions: frozen blackberries or a blueberry-raspberry mix work identically, and dry-toasted buckwheat groats can replace up to half the oats for a nuttier, gluten-free crust.",
  translations: {
    no: {
      title: 'Blåbærpai til frokost',
      description: 'Et blåbærfyll uten steking over en bunn av ristet havre og dadler. Dypt lilla, syltetøyaktig og sitronfrisk — og den setter seg over natten, så frokosten er allerede laget. Laget for frosne blåbær.',
      ingredients: [
        { quantity: 130, unit: 'g', name: 'havregryn' },
        { quantity: 90, unit: 'g', name: 'Medjool-dadler, uten stein, til bunnen' },
        { quantity: 12, unit: 'g', name: 'chiafrø, til bunnen' },
        { quantity: 1, unit: 'tsp', name: 'malt kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'havsalt' },
        { quantity: 3, unit: 'tbsp', name: 'vann, til bunnen' },
        { quantity: 400, unit: 'g', name: 'frosne blåbær' },
        { quantity: 100, unit: 'g', name: 'frosne blåbær til å vende inn til slutt' },
        { quantity: 30, unit: 'g', name: 'Medjool-dadler, uten stein, til fyllet' },
        { quantity: 8, unit: 'g', name: 'chiafrø, til fyllet' },
        { quantity: 1, unit: 'pcs', name: 'sitron — saften, og skallet om du bruker det' },
        { quantity: 1, unit: 'tsp', name: 'vaniljepulver' },
        { quantity: 28, unit: 'g', name: 'malt linfrø' },
      ],
      steps: [
        'Tørrrist havren: Rist havregrynene i en tørr panne over middels varme, rør ofte, til de dufter nøtteaktig og har mørknet et hakk. Dette er det aller viktigste smakssteget — uristet havre gir en flat bunn.',
        'Blend bunnen: Blend den ristede havren til et grovt mel. Tilsett daddlene til bunnen, chiafrøene til bunnen, kanelen, saltet og vannet. Blend til massen klumper seg når du klemmer den — klissete, ikke glatt.',
        'Press og stek: Kle en paiform på 22 cm med bakepapir. Press deigen godt opp langs kantene først, deretter utover bunnen — det å presse kanten først er det som hindrer at den sklir ned. Stek på 180°C til den er fast og dufter, og la den avkjøles helt.',
        'Kok fyllet: Ha de frosne blåbærene rett fra fryseren i en kjele sammen med daddlene til fyllet. Ikke tilsett vann — frosne bær slipper rikelig av sitt eget. Kok over middels varme under omrøring til de faller sammen og væsken koker inn til et tykt, blankt syltetøy som holder sporet etter en skje.',
        'Avkjøl, og avslutt utenom varmen: Ta kjelen av varmen og la fyllet kjøle seg i 10 minutter. Rør inn chiafrøene til fyllet, det malte linfrøet, vaniljepulveret og sitronsaften. Ha i skallet nå også om du bruker det — utenom varmen er ufravikelig, det beskytter både omega-3-en i linfrøet og de aromatiske oljene i skallet. Ser det fortsatt løst ut, tilsett en teskje chia til og la det stå ti minutter til.',
        'Vend inn de frosne bærene: Vend blåbærene du satte av rett fra fryseren inn i det varme fyllet. De tiner på sekunder, men holder formen, så de sprekker i munnen mot den syltetøyaktige bunnen — det er denne kontrasten som gjør at den smaker pai og ikke grøt.',
        'Fyll og sett kaldt: Ha fyllet i den avkjølte bunnen og jevn det ut. Sett kaldt til den er helt fast — natten over er ideelt, og bunnen blir fastere mens den står.',
      ],
      notes: 'Kokketips: bunnen stekes, men fyllet gjør det aldri — det er med vilje. Å koke linfrøet ville brutt ned ALA-en, og bærene som vendes inn til slutt holder seg hele for teksturens skyld. Frosne bær: tin dem aldri først. Tinte blåbær blir slappe og lekker, og den delen du setter av til å vende inn ville kollapset i syltetøyet i stedet for å holde seg hel — rett fra fryseren for begge deler. Sitronskall: helt valgfritt. Det gir en blomstrende, litt bitter topptone som noen elsker og andre synes er skarp; lar du det være, er paien fortsatt fullt balansert på saften alene. Erstatninger: frosne bjørnebær eller en blanding av blåbær og bringebær fungerer helt likt, og tørrristet bokhvete kan erstatte inntil halvparten av havren for en nøttere, glutenfri bunn.',
    },
    sv: {
      title: 'Blåbärspaj till frukost',
      description: 'En blåbärsfyllning utan gräddning över en botten av rostad havre och dadlar. Djupt lila, syltig och citronfräsch — och den sätter sig över natten, så frukosten är redan gjord. Gjord för frysta blåbär.',
      ingredients: [
        { quantity: 130, unit: 'g', name: 'havregryn' },
        { quantity: 90, unit: 'g', name: 'Medjooldadlar, urkärnade, till botten' },
        { quantity: 12, unit: 'g', name: 'chiafrön, till botten' },
        { quantity: 1, unit: 'tsp', name: 'malen kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'havssalt' },
        { quantity: 3, unit: 'tbsp', name: 'vatten, till botten' },
        { quantity: 400, unit: 'g', name: 'frysta blåbär' },
        { quantity: 100, unit: 'g', name: 'frysta blåbär att vända ner på slutet' },
        { quantity: 30, unit: 'g', name: 'Medjooldadlar, urkärnade, till fyllningen' },
        { quantity: 8, unit: 'g', name: 'chiafrön, till fyllningen' },
        { quantity: 1, unit: 'pcs', name: 'citron — saften, och skalet om du använder det' },
        { quantity: 1, unit: 'tsp', name: 'vaniljpulver' },
        { quantity: 28, unit: 'g', name: 'malda linfrön' },
      ],
      steps: [
        'Torrosta havren: Rosta havregrynen i en torr panna över medelvärme, rör ofta, tills de doftar nötigt och mörknat ett snäpp. Det här är det allra viktigaste smaksteget — orostad havre ger en platt botten.',
        'Mixa botten: Mixa den rostade havren till ett grovt mjöl. Tillsätt dadlarna till botten, chiafröna till botten, kanelen, saltet och vattnet. Mixa tills massan klumpar sig när du kramar den — kladdig, inte slät.',
        'Tryck ut och grädda: Klä en pajform på 22 cm med bakplåtspapper. Tryck ut degen ordentligt längs kanterna först, sedan över botten — att trycka kanten först är det som hindrar den från att glida ner. Grädda i 180°C tills den är fast och doftar, och låt svalna helt.',
        'Koka fyllningen: Lägg de frysta blåbären direkt från frysen i en kastrull tillsammans med dadlarna till fyllningen. Tillsätt inget vatten — frysta bär släpper rikligt av sitt eget. Koka över medelvärme under omrörning tills de faller samman och vätskan kokar in till en tjock, blank sylt som håller spåret efter en sked.',
        'Svalna, och avsluta utanför värmen: Ta kastrullen från värmen och låt fyllningen svalna i 10 minuter. Rör i chiafröna till fyllningen, de malda linfröna, vaniljpulvret och citronsaften. Tillsätt skalet nu också om du använder det — utanför värmen är oförhandlingsbart, det skyddar både omega-3:an i linfröet och de aromatiska oljorna i skalet. Ser den fortfarande lös ut, tillsätt en tesked chia till och låt stå tio minuter till.',
        'Vänd ner de frysta bären: Vänd ner blåbären du sparade direkt från frysen i den varma fyllningen. De tinar på sekunder men håller formen, så de brister i munnen mot den syltiga bottnen — det är den här kontrasten som gör att den smakar paj och inte gröt.',
        'Fyll och kyl: Skeda fyllningen i den svalnade bottnen och jämna till den. Ställ kallt tills den är helt fast — över natten är idealiskt, och bottnen blir fastare medan den står.',
      ],
      notes: 'Kockens tips: bottnen gräddas, men fyllningen gör det aldrig — det är avsiktligt. Att koka linfröet skulle bryta ner ALA:n, och bären som vänds ner på slutet håller sig hela för konsistensens skull. Frysta bär: tina dem aldrig först. Tinade blåbär blir slappa och läcker, och den del du sparar till att vända ner skulle kollapsa i sylten i stället för att hålla sig hel — direkt från frysen för båda delarna. Citronskal: helt valfritt. Det ger en blommig, något bitter topplton som vissa älskar och andra tycker är skarp; utelämnar du det är pajen fortfarande fullt balanserad på saften allena. Ersättningar: frysta björnbär eller en blandning av blåbär och hallon fungerar precis likadant, och torrostat bovete kan ersätta upp till hälften av havren för en nötigare, glutenfri botten.',
    },
  },
})

// ── orn-65: Cinnamon-Date Applesauce ──────────────────────────────────────
recipes.push({
  id: 'orn-65',
  title: 'Cinnamon-Date Applesauce',
  category: 'Dessert',
  servings: 4,
  prepTime: 20,
  cookTime: 30,
  description: 'Naturally sweetened applesauce from the pressure cooker — dates for sweetness, cinnamon for warmth, lemon for lift. No sweetener, no oil.',
  tags: ['ornish-green', 'dessert', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 266,
  servingWeightGrams: 410,
  ingredients: [
    { quantity: 1360, unit: 'g', name: 'apples, peeled, cored and quartered' },
    { quantity: 145, unit: 'g', name: 'Medjool dates, pitted and chopped' },
    { quantity: 120, unit: 'ml', name: 'water' },
    { quantity: 1.5, unit: 'tsp', name: 'ground cinnamon' },
    { quantity: 1, unit: 'tbsp', name: 'fresh lemon juice' },
    { quantity: 0.1, unit: 'tsp', name: 'sea salt' },
  ],
  steps: [
    'Prep the apples: Peel, core and quarter the apples. A mix of sweet and tart — Fuji plus Granny Smith — gives the best balance.',
    'Load the pot: Add the apples to the pressure cooker insert with the dates, water, cinnamon, lemon juice and salt. Stir gently to combine.',
    'Pressure cook: Seal the lid, valve to Sealing. Pressure cook on High for 8 minutes.',
    'Natural release: Let the pressure release naturally for 10 minutes, then move the valve to Venting to release the rest.',
    'Mash or blend: Mash with a potato masher for a chunky sauce, or use an immersion blender for smooth. The dates dissolve completely into the sauce.',
    'Cool and store: Serve warm, or chill in an airtight container for up to a week. It freezes for 3 months.',
  ],
  notes: 'If the dates are dry or hard, soak them in warm water for 10 minutes first so they break down cleanly. The yield is about 1640 g in total, so a serving is roughly 410 g — a substantial portion, and the GREEN fibre score depends on splitting the batch four ways rather than six.',
  nutrition: { perServing: {
    calories: 266, protein: 1.6, totalFat: 0.5, saturatedFat: 0.1, polyunsaturatedFat: 0.14,
    monounsaturatedFat: 0.03, omega3: 0.02, omega6: 0.12, cholesterol: 0, totalCarbs: 71.5,
    totalSugars: 58.4, addedSugar: 0, fiber: 7.4, calcium: 50, potassium: 565, copper: 0.25,
    iron: 0.7, magnesium: 34, manganese: 0.37, selenium: 0.03, phosphorus: 61, zinc: 0.35,
    sodium: 73, vitaminA: 10, vitaminB6: 0.22, vitaminB12: 0, vitaminC: 15, vitaminD: 0,
    vitaminE: 0.22, vitaminK: 3.0, folate: 6, thiamin: 0.08, riboflavin: 0.10, niacin: 0.9, choline: 15,
  } },
  translations: {
    no: {
      title: 'Eplemos med kanel og dadler',
      description: 'Naturlig søtet eplemos fra trykkokeren — dadler for sødme, kanel for varme, sitron for løft. Uten søtningsmiddel, uten olje.',
      ingredients: [
        { quantity: 1360, unit: 'g', name: 'epler, skrelt, uten kjernehus og delt i fire' },
        { quantity: 145, unit: 'g', name: 'Medjool-dadler, uten stein og hakket' },
        { quantity: 120, unit: 'ml', name: 'vann' },
        { quantity: 1.5, unit: 'tsp', name: 'malt kanel' },
        { quantity: 1, unit: 'tbsp', name: 'fersk sitronsaft' },
        { quantity: 0.1, unit: 'tsp', name: 'havsalt' },
      ],
      steps: [
        'Gjør klar eplene: Skrell eplene, fjern kjernehuset og del dem i fire. En blanding av søte og syrlige — Fuji og Granny Smith — gir den beste balansen.',
        'Fyll gryta: Ha eplene i innergryta til trykkokeren sammen med daddlene, vannet, kanelen, sitronsaften og saltet. Rør forsiktig sammen.',
        'Trykkok: Forsegl lokket og sett ventilen på forsegling. Trykkok på høyt trykk i 8 minutter.',
        'La trykket falle: La trykket falle naturlig i 10 minutter, og sett så ventilen på lufting for å slippe ut resten.',
        'Mos eller blend: Mos med en potetstapper for en grov mos, eller bruk stavmikser for helt glatt. Daddlene løser seg fullstendig opp i mosen.',
        'Avkjøl og oppbevar: Server varm, eller sett kaldt i en tett boks i opptil en uke. Den kan fryses i 3 måneder.',
      ],
      notes: 'Er daddlene tørre eller harde, bløtlegg dem i varmt vann i 10 minutter først så de løser seg pent opp. Utbyttet er cirka 1640 g totalt, så en porsjon blir omtrent 410 g — det er en solid porsjon, og GREEN-scoren på fiber avhenger av at satsen deles i fire og ikke i seks.',
    },
    sv: {
      title: 'Äppelmos med kanel och dadlar',
      description: 'Naturligt sötat äppelmos från tryckkokaren — dadlar för sötma, kanel för värme, citron för lyft. Utan sötningsmedel, utan olja.',
      ingredients: [
        { quantity: 1360, unit: 'g', name: 'äpplen, skalade, urkärnade och delade i fyra' },
        { quantity: 145, unit: 'g', name: 'Medjooldadlar, urkärnade och hackade' },
        { quantity: 120, unit: 'ml', name: 'vatten' },
        { quantity: 1.5, unit: 'tsp', name: 'malen kanel' },
        { quantity: 1, unit: 'tbsp', name: 'färsk citronsaft' },
        { quantity: 0.1, unit: 'tsp', name: 'havssalt' },
      ],
      steps: [
        'Förbered äpplena: Skala äpplena, kärna ur dem och dela i fyra. En blandning av söta och syrliga — Fuji och Granny Smith — ger den bästa balansen.',
        'Fyll grytan: Lägg äpplena i tryckkokarens innergryta tillsammans med dadlarna, vattnet, kanelen, citronsaften och saltet. Rör försiktigt ihop.',
        'Tryckkoka: Förslut locket och ställ ventilen på förslutning. Tryckkoka på högt tryck i 8 minuter.',
        'Låt trycket sjunka: Låt trycket sjunka naturligt i 10 minuter, och ställ sedan ventilen på avluftning för att släppa ut resten.',
        'Mosa eller mixa: Mosa med en potatisstöt för ett grovt mos, eller använd stavmixer för helt slätt. Dadlarna löses helt upp i moset.',
        'Svalna och förvara: Servera varmt, eller ställ kallt i en tät burk i upp till en vecka. Det kan frysas i 3 månader.',
      ],
      notes: 'Är dadlarna torra eller hårda, blötlägg dem i varmt vatten i 10 minuter först så att de löses upp fint. Utbytet är cirka 1640 g totalt, så en portion blir ungefär 410 g — det är en rejäl portion, och GREEN-poängen på fiber förutsätter att satsen delas i fyra och inte i sex.',
    },
  },
})

// ── finalize ─────────────────────────────────────────────────────────────
for (const r of recipes) {
  if (pack.recipes.some(x => x.id === r.id)) throw new Error(`id collision: ${r.id}`)
  r.imageUrl = null
  pack.recipes.push(r)
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${recipes.length} recipes. Pack -> ${pack.version}. Total: ${pack.recipes.length}`)
for (const r of recipes) {
  console.log(`  ${r.id}  ${String(r.servings)} serv  ${r.nutrition ? 'nutrition' : 'NO nutrition'}  ${r.title}`)
}

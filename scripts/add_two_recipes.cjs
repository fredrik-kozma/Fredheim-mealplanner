/*
 * One-off: adds two recipes and bumps pack versions.
 *  - Roasted Red Pepper Hummus  -> fredheim-recipes-with-pictures (1.6.9 -> 1.7.0)
 *  - Sweet Almond Milk Chia Pudding with Mango -> fredheim-reversal-protocol (1.4.1 -> 1.5.0, orn-13)
 * Run: node scripts/add_two_recipes.cjs   (safe to re-run: skips if id exists)
 */
const fs = require('fs')
const path = require('path')

const HUMMUS = {
  id: 'roasted-red-pepper-hummus',
  title: 'Roasted Red Pepper Hummus',
  category: 'Spreads',
  servings: 6,
  prepTime: 15,
  cookTime: 15,
  imageUrl: null,
  description:
    'Smoky, sweet, and silky-smooth — roasted red peppers and a touch of olive oil take classic hummus to another level. Plant-based, simple, and built for daily life.',
  tags: ['fredheim', 'spread', 'vegan', 'no-added-sugar', 'high-fiber'],
  kcal: 208,
  servingWeightGrams: 130,
  nutrition: {
    perServing: {
      calories: 208, protein: 8.2, totalFat: 9.8, saturatedFat: 1.3,
      polyunsaturatedFat: 3.4, monounsaturatedFat: 4.3, omega3: 0.06, omega6: 3.0,
      cholesterol: 0, totalCarbs: 24.0, totalSugars: 5.1, addedSugar: 0, fiber: 7.0,
      calcium: 81, potassium: 339, copper: 0.38, iron: 2.7, magnesium: 47,
      manganese: 0.89, selenium: 6.1, phosphorus: 198, zinc: 1.6, sodium: 214,
      vitaminA: 70, vitaminB6: 0.23, vitaminB12: 0, vitaminC: 40, vitaminD: 0,
      vitaminE: 1.4, vitaminK: 6.1, folate: 143, thiamin: 0.22, riboflavin: 0.12,
      niacin: 1.2, choline: 26,
    },
  },
  ingredients: [
    { quantity: 400, unit: 'g', name: 'Cooked chickpeas, drained' },
    { quantity: 200, unit: 'g', name: 'Roasted red bell peppers, drained' },
    { quantity: 60, unit: 'g', name: 'Tahini' },
    { quantity: 2, unit: 'clove', name: 'Garlic' },
    { quantity: 30, unit: 'ml', name: 'Fresh lemon juice' },
    { quantity: 15, unit: 'ml', name: 'Extra virgin olive oil' },
    { quantity: 1, unit: 'tsp', name: 'Smoked paprika' },
    { quantity: 0.5, unit: 'tsp', name: 'Ground cumin' },
    { quantity: 0.5, unit: 'tsp', name: 'Fine sea salt' },
    { quantity: 60, unit: 'ml', name: 'Cold water, to adjust' },
  ],
  steps: [
    'Roast the peppers (skip if using jarred): char whole red bell peppers directly over a gas flame or under a hot grill until blackened all over. Seal in a covered bowl for 10 minutes, then peel off the skins, remove the seeds and keep the flesh — this is where most of the flavour lives.',
    'Blend the base: in a food processor, combine the chickpeas, tahini, lemon juice and garlic. Blend for 1–2 minutes until a thick, slightly grainy paste forms — this step matters more than people think; it is what lets the tahini emulsify smooth later.',
    'Add the roasted peppers, smoked paprika, cumin and salt. Blend again until fully combined.',
    'With the processor running, stream in the cold water a little at a time until the hummus turns pale, fluffy and completely smooth — this can take 2–3 minutes of continuous blending, so do not rush it.',
    'Drizzle in the olive oil and pulse just a few times to fold it through without fully blending it in, keeping small pockets of richness.',
    'Taste for salt and lemon — smoked paprika hummus often wants a touch more acid than you expect. Chill for at least 30 minutes before serving; the flavour rounds out significantly as it sits. Keeps refrigerated for 5 days.',
  ],
  translations: {
    no: {
      title: 'Hummus med ovnsbakt rød paprika',
      description:
        'Røykfylt, søt og silkemyk — ovnsbakt rød paprika og en anelse olivenolje løfter klassisk hummus til et nytt nivå. Plantebasert, enkel og laget for hverdagen.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'kokte kikerter, avrent' },
        { quantity: 200, unit: 'g', name: 'ovnsbakt rød paprika, avrent' },
        { quantity: 60, unit: 'g', name: 'tahini' },
        { quantity: 2, unit: 'clove', name: 'hvitløk' },
        { quantity: 30, unit: 'ml', name: 'fersk sitronsaft' },
        { quantity: 15, unit: 'ml', name: 'extra virgin olivenolje' },
        { quantity: 1, unit: 'tsp', name: 'røkt paprika' },
        { quantity: 0.5, unit: 'tsp', name: 'malt spisskummen' },
        { quantity: 0.5, unit: 'tsp', name: 'fint havsalt' },
        { quantity: 60, unit: 'ml', name: 'kaldt vann, til justering' },
      ],
      steps: [
        'Bak paprikaene (hopp over hvis du bruker paprika på glass): sverte hele røde paprikaer direkte over gassflamme eller under varm grill til de er svarte over det hele. Legg dem i en tildekket bolle i 10 minutter, dra av skinnet, fjern frøene og behold fruktkjøttet — det er der mesteparten av smaken sitter.',
        'Kjør basen: ha kikerter, tahini, sitronsaft og hvitløk i en foodprosessor. Kjør i 1–2 minutter til en tykk, lett kornete masse — dette trinnet betyr mer enn folk tror; det er det som får tahinien til å emulgere glatt senere.',
        'Tilsett den bakte paprikaen, røkt paprika, spisskummen og salt. Kjør igjen til alt er godt blandet.',
        'Med prosessoren i gang: hell i det kalde vannet litt etter litt til hummusen blir lys, luftig og helt glatt — det kan ta 2–3 minutter med kontinuerlig kjøring, så ikke stress.',
        'Ringle i olivenoljen og puls bare noen få ganger så den foldes inn uten å blandes helt — da beholder du små lommer av fylde.',
        'Smak til med salt og sitron — hummus med røkt paprika vil ofte ha litt mer syre enn du tror. Avkjøl i minst 30 minutter før servering; smaken rundes tydelig av mens den står. Holder seg i kjøleskap i 5 dager.',
      ],
    },
    sv: {
      title: 'Hummus med rostad röd paprika',
      description:
        'Rökig, söt och silkeslen — rostad röd paprika och en aning olivolja lyfter klassisk hummus till en ny nivå. Växtbaserad, enkel och gjord för vardagen.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'kokta kikärtor, avrunna' },
        { quantity: 200, unit: 'g', name: 'rostad röd paprika, avrunnen' },
        { quantity: 60, unit: 'g', name: 'tahini' },
        { quantity: 2, unit: 'clove', name: 'vitlök' },
        { quantity: 30, unit: 'ml', name: 'färsk citronsaft' },
        { quantity: 15, unit: 'ml', name: 'extra virgin olivolja' },
        { quantity: 1, unit: 'tsp', name: 'rökt paprika' },
        { quantity: 0.5, unit: 'tsp', name: 'malen spiskummin' },
        { quantity: 0.5, unit: 'tsp', name: 'fint havssalt' },
        { quantity: 60, unit: 'ml', name: 'kallt vatten, för att justera' },
      ],
      steps: [
        'Rosta paprikorna (hoppa över om du använder paprika på burk): bränn hela röda paprikor direkt över gaslåga eller under het grill tills de är svarta runtom. Lägg dem i en övertäckt skål i 10 minuter, dra av skalet, ta bort kärnorna och behåll fruktköttet — det är där det mesta av smaken sitter.',
        'Mixa basen: lägg kikärtor, tahini, citronsaft och vitlök i en matberedare. Kör i 1–2 minuter tills en tjock, lätt grynig massa bildas — det här steget betyder mer än man tror; det är det som får tahinin att emulgera slät senare.',
        'Tillsätt den rostade paprikan, rökt paprika, spiskummin och salt. Mixa igen tills allt är väl blandat.',
        'Med matberedaren igång: häll i det kalla vattnet lite i taget tills hummusen blir ljus, luftig och helt slät — det kan ta 2–3 minuter av kontinuerlig mixning, så ha tålamod.',
        'Ringla i olivoljan och pulsa bara några gånger så att den vänds ner utan att blandas helt — då behåller du små fickor av fyllighet.',
        'Smaka av med salt och citron — hummus med rökt paprika vill ofta ha lite mer syra än man tror. Kyl i minst 30 minuter före servering; smaken rundas tydligt av när den står. Håller sig i kylen i 5 dagar.',
      ],
    },
  },
}

const CHIA = {
  id: 'orn-13',
  title: 'Sweet Almond Milk Chia Pudding with Mango',
  category: 'Breakfast',
  servings: 2,
  prepTime: 10,
  cookTime: null,
  imageUrl: null,
  description:
    'A chia pudding made on homemade almond milk, naturally sweetened with Medjool dates and topped with mango. No added syrup, no store-bought milk — and an excellent omega-6:omega-3 ratio of about 0.8:1.',
  tags: ['ornish-orange', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 383,
  servingWeightGrams: 338,
  nutrition: {
    perServing: {
      calories: 383, protein: 10.4, totalFat: 19.7, saturatedFat: 1.86,
      polyunsaturatedFat: 9.73, monounsaturatedFat: 7.15, omega3: 5.43, omega6: 4.26,
      cholesterol: 0, totalCarbs: 48.3, totalSugars: 28.8, addedSugar: 0, fiber: 16.0,
      calcium: 271, potassium: 583, copper: 0.67, iron: 3.45, magnesium: 178,
      manganese: 1.39, selenium: 18.9, phosphorus: 386, zinc: 2.21, sodium: 6.2,
      vitaminA: 46.6, vitaminB6: 0.19, vitaminB12: 0, vitaminC: 30.5, vitaminD: 0,
      vitaminE: 6.03, vitaminK: 4.14, folate: 63, thiamin: 0.27, riboflavin: 0.3,
      niacin: 4.37, choline: 22.2,
    },
  },
  ingredients: [
    { quantity: 40, unit: 'g', name: 'Raw almonds' },
    { quantity: 360, unit: 'ml', name: 'Water (for the almond milk)' },
    { quantity: 50, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 60, unit: 'g', name: 'Chia seeds' },
    { quantity: 165, unit: 'g', name: 'Frozen mango, for topping' },
  ],
  steps: [
    'Blend the almonds and water on high in a powerful blender for 60–90 seconds until smooth and creamy. No straining needed — keeping the almond pulp in adds fibre and body.',
    'Add the pitted dates to the almond milk and blend again until completely smooth — this replaces any added syrup.',
    'Pour the sweetened almond milk over the chia seeds in a bowl or two jars. Whisk thoroughly to prevent clumping.',
    'Let sit for 5 minutes, then whisk again to break up any clumps that have formed.',
    'Cover and refrigerate for at least 4 hours, or overnight, until thickened to a pudding consistency.',
    'Just before serving, dice or lightly blend the frozen mango and spoon it over the top. Keeps in the fridge for up to 3 days, so it doubles easily for batch prep.',
  ],
  translations: {
    no: {
      title: 'Chiapudding med søt mandelmelk og mango',
      description:
        'Chiapudding laget på hjemmelaget mandelmelk, naturlig søtet med medjooldadler og toppet med mango. Uten tilsatt sirup, uten kjøpemelk — og et utmerket omega-6:omega-3-forhold på cirka 0,8:1.',
      ingredients: [
        { quantity: 40, unit: 'g', name: 'rå mandler' },
        { quantity: 360, unit: 'ml', name: 'vann (til mandelmelken)' },
        { quantity: 50, unit: 'g', name: 'medjooldadler, uten stein' },
        { quantity: 60, unit: 'g', name: 'chiafrø' },
        { quantity: 165, unit: 'g', name: 'frossen mango, til topping' },
      ],
      steps: [
        'Kjør mandlene og vannet på høy hastighet i en kraftig blender i 60–90 sekunder til det er glatt og kremet. Ingen siling nødvendig — mandelmassen gir fiber og fylde.',
        'Tilsett de utstenede dadlene i mandelmelken og kjør igjen til det er helt glatt — dette erstatter all tilsatt sirup.',
        'Hell den søtede mandelmelken over chiafrøene i en bolle eller to glass. Visp grundig for å unngå klumper.',
        'La stå i 5 minutter, og visp igjen for å bryte opp eventuelle klumper.',
        'Dekk til og sett i kjøleskapet i minst 4 timer, eller over natten, til det har tyknet til puddingkonsistens.',
        'Rett før servering: kutt eller kjør den frosne mangoen lett, og skje den over toppen. Holder seg i kjøleskapet i opptil 3 dager, så den er lett å lage i større porsjoner.',
      ],
    },
    sv: {
      title: 'Chiapudding med söt mandelmjölk och mango',
      description:
        'Chiapudding gjord på hemgjord mandelmjölk, naturligt sötad med medjooldadlar och toppad med mango. Utan tillsatt sirap, utan köpt mjölk — och ett utmärkt omega-6:omega-3-förhållande på cirka 0,8:1.',
      ingredients: [
        { quantity: 40, unit: 'g', name: 'råa mandlar' },
        { quantity: 360, unit: 'ml', name: 'vatten (till mandelmjölken)' },
        { quantity: 50, unit: 'g', name: 'medjooldadlar, urkärnade' },
        { quantity: 60, unit: 'g', name: 'chiafrön' },
        { quantity: 165, unit: 'g', name: 'fryst mango, till topping' },
      ],
      steps: [
        'Mixa mandlarna och vattnet på hög hastighet i en kraftfull mixer i 60–90 sekunder tills det är slätt och krämigt. Ingen silning behövs — mandelmassan ger fiber och fyllighet.',
        'Tillsätt de urkärnade dadlarna i mandelmjölken och mixa igen tills det är helt slätt — detta ersätter all tillsatt sirap.',
        'Häll den sötade mandelmjölken över chiafröna i en skål eller två burkar. Vispa ordentligt för att undvika klumpar.',
        'Låt stå i 5 minuter och vispa sedan igen för att bryta upp eventuella klumpar.',
        'Täck över och ställ i kylen i minst 4 timmar, eller över natten, tills det tjocknat till puddingkonsistens.',
        'Strax före servering: tärna eller mixa den frysta mangon lätt och skeda den över toppen. Håller sig i kylen i upp till 3 dagar, så den är lätt att göra i större sats.',
      ],
    },
  },
}

function addRecipe(file, recipe, newVersion) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', file)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (pack.recipes.some(r => r.id === recipe.id)) {
    console.log(file, '- already has', recipe.id, '(replacing in place)')
    pack.recipes = pack.recipes.map(r => (r.id === recipe.id ? recipe : r))
  } else {
    pack.recipes.push(recipe)
  }
  pack.version = newVersion
  fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(file, '->', newVersion, '| recipes:', pack.recipes.length, '| added:', recipe.id)
}

addRecipe('fredheim-recipes-with-pictures.json', HUMMUS, '1.7.0')
addRecipe('fredheim-reversal-protocol.json', CHIA, '1.5.0')

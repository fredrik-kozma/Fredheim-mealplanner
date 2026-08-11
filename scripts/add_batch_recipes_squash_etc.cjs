/* Adds 6 recipes (orn-42..orn-47) to fredheim-reversal-protocol.json:
 * Zucchini & Walnut Cake, Quick Almond Milk, Deep Prune Jam,
 * Zucchini/Carrot/Walnut Patties, Sour & Savory White Bean Hummus,
 * Sweet & Sour Cherry Jam.
 *
 * Author supplied full nutrition + an EN or NO source draft per recipe.
 * Two things applied uniformly, matching house convention:
 *
 *  - Step text originally echoed each ingredient's scaled amount inline
 *    ("Add 75 grams almonds..."). That breaks under serving-count scaling,
 *    so every step here refers to ingredients by name only; times/temps/
 *    per-unit target weights (a patty's 90 g, not the total patty count)
 *    stay, since those don't change with batch size.
 *  - "1 pinch X" ingredients converted to the to-taste convention
 *    (quantity: null, name suffixed ", to taste"/", etter smak"/
 *    ", efter smak") per INGREDIENT_UNITS.md §4. Small-but-precise spoon
 *    amounts that feed directly into a stated sodium/nutrition figure
 *    (e.g. the cake's 0.1 tsp salt, patties' 2.4 g salt) are kept as real
 *    quantities instead — they're baking/recipe chemistry, not seasoning
 *    to preference.
 *
 * Condition tags (diabetes-friendly etc.) are deliberately NOT set here —
 * run audit_condition_tags.cjs --write afterward so they're computed from
 * the actual nutrition data rather than trusted from the source's own
 * "Ornish GREEN" claim. imageUrl is null; photos come later.
 *
 * prepTime/cookTime were not fully specified for two recipes (cake bake
 * time, prune jam simmer time) — reasonable estimates were used and are
 * flagged back to the author.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const recipes = []

// ── orn-42: Zucchini & Walnut Cake (GREEN) ─────────────────────────────────
recipes.push({
  id: 'orn-42',
  title: 'Zucchini & Walnut Cake (GREEN)',
  category: 'Dessert',
  servings: 4,
  prepTime: 20,
  cookTime: 45,
  description: 'GREEN-adapted version of the classic squash cake — oil and cane sugar swapped out, sodium trimmed, omega-3 balanced with a flax finish.',
  tags: ['ornish-green', 'dessert', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 277,
  servingWeightGrams: 128,
  ingredients: [
    { quantity: 120, unit: 'g', name: 'whole wheat flour' },
    { quantity: 150, unit: 'g', name: 'zucchini, grated and squeezed' },
    { quantity: 100, unit: 'g', name: 'ripe banana, mashed' },
    { quantity: 100, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 20, unit: 'g', name: 'walnuts, chopped' },
    { quantity: 35, unit: 'g', name: 'raisins' },
    { quantity: 1.5, unit: 'tsp', name: 'psyllium husk' },
    { quantity: 0.3, unit: 'tsp', name: 'baking soda' },
    { quantity: 0.5, unit: 'tsp', name: 'baking powder' },
    { quantity: 0.1, unit: 'tsp', name: 'sea salt' },
    { quantity: 0.8, unit: 'tsp', name: 'Ceylon cinnamon' },
    { quantity: 0.3, unit: 'tsp', name: 'vanilla powder' },
    { quantity: 40, unit: 'ml', name: 'boiling water, for the date paste' },
    { quantity: 4, unit: 'tsp', name: 'ground flaxseed, for finishing' },
  ],
  steps: [
    'Make the date paste: Blend the pitted dates with the boiling water in a blender until smooth and thick. This replaces the sugar.',
    'Mix the dry ingredients: Whisk together the flour, psyllium husk, baking soda, baking powder, sea salt, cinnamon and vanilla powder in a bowl.',
    'Mix the wet ingredients: Stir the date paste, mashed banana and squeezed grated zucchini together in a separate bowl.',
    'Combine: Fold the wet mixture into the dry until you have a smooth batter. Fold in the chopped walnuts and raisins.',
    'Bake: Spread the batter into a loaf tin lined with baking paper (no oil). Bake at 180°C for about 40–45 minutes, until a skewer comes out clean.',
    "Serve: Let the cake cool, then cut into slices. Sprinkle each slice with the ground flaxseed just before serving — added cold, to protect the omega-3.",
  ],
  notes: "Chef's note: don't skip the flax at the end — it's what pulls the omega-6:3 ratio down from 4.7:1 to 2.1:1. Substitution: swap banana for 100 g unsweetened, pressed pear (applesauce-style) if you want a less banana-forward flavor; moisture and binding stay about the same.",
  nutrition: { perServing: {
    calories: 277, protein: 6.9, totalFat: 5.6, saturatedFat: 0.6, polyunsaturatedFat: 3.0, monounsaturatedFat: 0.8,
    omega3: 1.17, omega6: 2.42, cholesterol: 0, totalCarbs: 56.5, totalSugars: 26.1, addedSugar: 0, fiber: 8.9,
    calcium: 58, potassium: 598, copper: 0.40, iron: 2.1, magnesium: 91, manganese: 1.79, selenium: 23.4,
    phosphorus: 205, zinc: 1.44, sodium: 220, vitaminA: 4.6, vitaminB6: 0.37, vitaminB12: 0, vitaminC: 9.2,
    vitaminD: 0, vitaminE: 0.34, vitaminK: 3.7, folate: 38.9, thiamin: 0.26, riboflavin: 0.15, niacin: 2.70, choline: 20.4,
  } },
  translations: {
    no: {
      title: 'Squash- & valnøttkake (GREEN)',
      description: 'GREEN-tilpasset versjon av den klassiske squashkaken — olje og rørsukker byttet ut, natrium trimmet, omega-3 balansert med en linfrøavslutning.',
      ingredients: [
        { quantity: 120, unit: 'g', name: 'sammalt hvetemel' },
        { quantity: 150, unit: 'g', name: 'squash (zucchini), revet og presset' },
        { quantity: 100, unit: 'g', name: 'moden banan, most' },
        { quantity: 100, unit: 'g', name: 'Medjool-dadler, uten stein' },
        { quantity: 20, unit: 'g', name: 'valnøtter, hakket' },
        { quantity: 35, unit: 'g', name: 'rosiner' },
        { quantity: 1.5, unit: 'tsp', name: 'psylliumfrøskall' },
        { quantity: 0.3, unit: 'tsp', name: 'natron' },
        { quantity: 0.5, unit: 'tsp', name: 'bakepulver' },
        { quantity: 0.1, unit: 'tsp', name: 'havsalt' },
        { quantity: 0.8, unit: 'tsp', name: 'Ceylon kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljepulver' },
        { quantity: 40, unit: 'ml', name: 'kokende vann, til daddelpastaen' },
        { quantity: 4, unit: 'tsp', name: 'malt linfrø, til pynt' },
      ],
      steps: [
        'Lag daddelpasta: Bland de urkjernede daddlene med det kokende vannet i en blender til en jevn, tykk pasta. Dette erstatter sukkeret.',
        'Bland det tørre: Bland sammalt hvetemel, psylliumfrøskall, natron, bakepulver, havsalt, Ceylon kanel og vaniljepulver i en bolle.',
        'Bland det våte: Rør sammen daddelpastaen, moden mostet banan og revet, presset squash i en egen bolle.',
        'Sett sammen røren: Vend den våte blandingen inn i den tørre til jevn røre. Vend inn hakkede valnøtter og rosiner.',
        'Stek: Ha røren i en avlang form kledd med bakepapir (ingen olje). Stek på 180°C i ca. 40–45 minutter, til en tannpirker kommer ren ut.',
        'Server: La kaken avkjøles, skjær i skiver. Dryss malt linfrø over hver skive rett før servering — tilsettes kaldt for å beskytte omega-3-en.',
      ],
      notes: 'Kokketips: ikke hopp over linfrøet på slutten — det er det som drar omega-6:3-forholdet ned fra 4,7:1 til 2,1:1. Erstatning: bytt banan med 100 g usøtet, presset pære (som eplemos-konsistens) hvis du vil ha en mindre banan-dominert smak; fuktighet og binding forblir omtrent det samme.',
    },
    sv: {
      title: 'Squash- & valnötskaka (GREEN)',
      description: 'GREEN-anpassad version av den klassiska squashkakan — olja och strösocker utbytta, natrium trimmat, omega-3 balanserat med en linfröavslutning.',
      ingredients: [
        { quantity: 120, unit: 'g', name: 'fullkornsvetemjöl' },
        { quantity: 150, unit: 'g', name: 'squash (zucchini), riven och pressad' },
        { quantity: 100, unit: 'g', name: 'mogen banan, mosad' },
        { quantity: 100, unit: 'g', name: 'Medjooldadlar, urkärnade' },
        { quantity: 20, unit: 'g', name: 'valnötter, hackade' },
        { quantity: 35, unit: 'g', name: 'russin' },
        { quantity: 1.5, unit: 'tsp', name: 'psylliumfröskal' },
        { quantity: 0.3, unit: 'tsp', name: 'bikarbonat' },
        { quantity: 0.5, unit: 'tsp', name: 'bakpulver' },
        { quantity: 0.1, unit: 'tsp', name: 'havssalt' },
        { quantity: 0.8, unit: 'tsp', name: 'Ceylonkanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljpulver' },
        { quantity: 40, unit: 'ml', name: 'kokande vatten, till dadelpastan' },
        { quantity: 4, unit: 'tsp', name: 'malda linfrön, till garnering' },
      ],
      steps: [
        'Gör dadelpastan: Mixa de urkärnade dadlarna med det kokande vattnet i en mixer till en jämn, tjock pasta. Detta ersätter sockret.',
        'Blanda det torra: Blanda fullkornsvetemjöl, psylliumfröskal, bikarbonat, bakpulver, havssalt, Ceylonkanel och vaniljpulver i en skål.',
        'Blanda det blöta: Rör ihop dadelpastan, mogen mosad banan och riven, pressad squash i en separat skål.',
        'Sätt ihop smeten: Vänd ner den blöta blandningen i den torra till en jämn smet. Vänd ner hackade valnötter och russin.',
        'Grädda: Häll smeten i en avlång form klädd med bakplåtspapper (ingen olja). Grädda i 180°C i cirka 40–45 minuter, tills en sticka kommer ren ut.',
        'Servera: Låt kakan svalna, skär i skivor. Strö malda linfrön över varje skiva precis före servering — tillsätts kallt för att skydda omega-3:an.',
      ],
      notes: 'Kockens tips: hoppa inte över linfröet på slutet — det är det som drar ner omega-6:3-förhållandet från 4,7:1 till 2,1:1. Ersättning: byt banan mot 100 g osötat, pressat päron (som äppelmos-konsistens) om du vill ha en mindre banandominerad smak; fukt och bindning förblir ungefär desamma.',
    },
  },
})

// ── orn-43: Quick Almond Milk ───────────────────────────────────────────────
recipes.push({
  id: 'orn-43',
  title: 'Quick Almond Milk',
  category: 'Drink',
  servings: 4,
  prepTime: 10,
  cookTime: 0,
  description: 'The fastest, creamiest Vitamix almond milk — no soaking, no waste, ready in 2 minutes. No added sugar, no oil — Ornish GREEN.',
  tags: ['ornish-green', 'drink', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 104,
  servingWeightGrams: 245,
  ingredients: [
    { quantity: 75, unit: 'g', name: 'raw almonds' },
    { quantity: 1000, unit: 'ml', name: 'filtered water' },
    { quantity: 24, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 0.5, unit: 'tsp', name: 'pure vanilla extract' },
    { quantity: null, unit: '', name: 'fine sea salt, to taste' },
  ],
  steps: [
    'Blend: Add the almonds, filtered water, dates, vanilla extract and salt to the Vitamix. Blend on high for 60–75 seconds, until smooth and just slightly warm from friction.',
    'Strain: Pour through a nut milk bag or fine cloth into a pitcher, squeezing well to extract all the liquid. Save the pulp — great in granola or baking.',
    'Chill: Refrigerate until cold, or pour straight over ice if you want it now.',
  ],
  notes: 'Yields about 950 ml — 4 servings of 240 ml. Chef\'s note: the friction heat from a 75-second Vitamix blend is what makes this taste rich without any added fat — don\'t over-blend past about 90 seconds or it gets bitter. Substitution: swap almonds for raw cashews 1:1 for an even creamier, slightly sweeter milk (cashews don\'t need straining if you prefer a thicker "milk").',
  nutrition: { perServing: {
    calories: 104, protein: 2.9, totalFat: 7.0, saturatedFat: 0.54, polyunsaturatedFat: 1.72, monounsaturatedFat: 4.45,
    omega3: 0, omega6: 1.72, cholesterol: 0, totalCarbs: 7.7, totalSugars: 4.3, addedSugar: 0, fiber: 0.5,
    calcium: 38, potassium: 126, copper: 0.13, iron: 0.45, magnesium: 38, manganese: 0.26, selenium: 0.6,
    phosphorus: 66, zinc: 0.37, sodium: 14, vitaminA: 0, vitaminB6: 0.029, vitaminB12: 0, vitaminC: 0,
    vitaminD: 0, vitaminE: 3.6, vitaminK: 0.12, folate: 6.4, thiamin: 0.030, riboflavin: 0.15, niacin: 0.54, choline: 7.3,
  } },
  translations: {
    no: {
      title: 'Rask mandelmelk',
      description: 'Den raskeste, kremeste Vitamix-mandelmelken — ingen bløtlegging, ikke noe kastes, klar på 2 minutter. Ingen tilsatt sukker, ingen olje — Ornish GREEN.',
      ingredients: [
        { quantity: 75, unit: 'g', name: 'rå mandler' },
        { quantity: 1000, unit: 'ml', name: 'filtrert vann' },
        { quantity: 24, unit: 'g', name: 'Medjool-dadler, uten stein' },
        { quantity: 0.5, unit: 'tsp', name: 'ren vaniljeekstrakt' },
        { quantity: null, unit: '', name: 'fint havsalt, etter smak' },
      ],
      steps: [
        'Bland: Ha mandlene, det filtrerte vannet, dadlene, vaniljeekstrakten og saltet i Vitamixen. Bland på høy hastighet i 60–75 sekunder, til det er glatt og bare så vidt varmt av friksjonen.',
        'Sil: Hell gjennom en nøttemelkpose eller en fin klut over i en mugge, og press godt for å få ut all væsken. Ta vare på fiberresten — flott i granola eller baking.',
        'Avkjøl: Sett kaldt til det er kaldt, eller hell rett over is hvis du vil ha det med en gang.',
      ],
      notes: 'Gir cirka 950 ml — 4 porsjoner à 240 ml. Kokketips: friksjonsvarmen fra en 75-sekunders Vitamix-blending er det som gjør denne rik i smak uten noe tilsatt fett — ikke bland lenger enn cirka 90 sekunder, for da blir den besk. Erstatning: bytt mandler med rå cashewnøtter 1:1 for en enda kremere, litt søtere melk (cashewnøtter trenger ikke siling hvis du foretrekker en tykkere «melk»).',
    },
    sv: {
      title: 'Snabb mandelmjölk',
      description: 'Den snabbaste, krämigaste Vitamix-mandelmjölken — ingen blötläggning, inget slöseri, klar på 2 minuter. Inget tillsatt socker, ingen olja — Ornish GREEN.',
      ingredients: [
        { quantity: 75, unit: 'g', name: 'råa mandlar' },
        { quantity: 1000, unit: 'ml', name: 'filtrerat vatten' },
        { quantity: 24, unit: 'g', name: 'Medjooldadlar, urkärnade' },
        { quantity: 0.5, unit: 'tsp', name: 'ren vaniljextrakt' },
        { quantity: null, unit: '', name: 'fint havssalt, efter smak' },
      ],
      steps: [
        'Mixa: Lägg mandlarna, det filtrerade vattnet, dadlarna, vaniljextrakten och saltet i Vitamixen. Mixa på hög hastighet i 60–75 sekunder, tills det är slätt och bara lätt varmt av friktionen.',
        'Sila: Häll genom en nötmjölkspåse eller en fin duk ner i en kanna, och pressa ordentligt för att få ut all vätska. Spara massan — perfekt i granola eller bakning.',
        'Kyl: Ställ kallt tills det är kallt, eller häll direkt över is om du vill ha det nu.',
      ],
      notes: 'Ger cirka 950 ml — 4 portioner à 240 ml. Kockens tips: friktionsvärmen från en 75-sekunders Vitamix-mixning är det som gör den här rik i smak utan tillsatt fett — mixa inte längre än cirka 90 sekunder, då blir den bitter. Ersättning: byt mandlar mot råa cashewnötter 1:1 för en ännu krämigare, lite sötare mjölk (cashewnötter behöver inte silas om du föredrar en tjockare "mjölk").',
    },
  },
})

// ── orn-44: Deep Prune Jam ─────────────────────────────────────────────────
recipes.push({
  id: 'orn-44',
  title: 'Deep Prune Jam',
  category: 'Jam',
  servings: 10,
  prepTime: 10,
  cookTime: 30,
  description: 'Rich, dark, naturally sweet jam made from dried plums — no added sugar, no oil, no pectin needed. Just five real ingredients doing all the work. Ornish GREEN.',
  tags: ['ornish-green', 'jam', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 54,
  servingWeightGrams: 30,
  ingredients: [
    { quantity: 200, unit: 'g', name: 'dried plums (pitted prunes, no added sugar)' },
    { quantity: 250, unit: 'ml', name: 'water' },
    { quantity: 1, unit: 'tbsp', name: 'chia seeds' },
    { quantity: 0.5, unit: 'tsp', name: 'ground cinnamon' },
    { quantity: 2, unit: 'tbsp', name: 'fresh lemon juice' },
    { quantity: 1, unit: 'tsp', name: 'lemon zest' },
  ],
  steps: [
    'Rehydrate the plums: Add the dried plums and water to a saucepan. Bring to a gentle simmer, cover, and cook until the plums are very soft and plump.',
    "Blend to a purée: Transfer the plums and a little of the cooking liquid to a blender (Vitamix works great). Blend until completely smooth, adding more reserved liquid a splash at a time until it's a thick, jammy purée.",
    'Thicken with chia: Return the purée to the saucepan. Stir in the chia seeds and cinnamon. Simmer gently, stirring often, until the chia swells and the jam visibly thickens.',
    "Finish off the heat: Remove from the heat. Stir in the lemon juice and lemon zest — adding these off the heat keeps the lemon's brightness and aromatic oils intact instead of cooking them flat.",
    'Cool and jar: Let the jam cool to room temperature — it keeps thickening as it sits (the chia is still gelling). Spoon into a clean jar and refrigerate. Keeps about 2 weeks.',
  ],
  notes: 'Why it tastes amazing: dried plums are already concentrated, jammy, and deeply sweet — simmering just wakes that up. Cinnamon adds warmth without competing, and off-heat lemon juice and zest are what stop it from tasting flat — the difference between fruit paste and jam. Chia replaces pectin and sugar as the setting agent. Variation: swap cinnamon for a split vanilla pod (add with the plums, remove before blending). Makes about 300 g — 10 servings of 2 tbsp (30 g).',
  nutrition: { perServing: {
    calories: 54, protein: 0.62, totalFat: 0.39, saturatedFat: 0.04, polyunsaturatedFat: 0.25, monounsaturatedFat: 0.06,
    omega3: 0.18, omega6: 0.07, cholesterol: 0, totalCarbs: 13.5, totalSugars: 7.7, addedSugar: 0, fiber: 1.9,
    calcium: 16.7, potassium: 154, copper: 0.07, iron: 0.28, magnesium: 11.8, manganese: 0.11, selenium: 0.62,
    phosphorus: 22.8, zinc: 0.14, sodium: 0.6, vitaminA: 7.9, vitaminB6: 0.045, vitaminB12: 0, vitaminC: 1.6,
    vitaminD: 0, vitaminE: 0.10, vitaminK: 11.9, folate: 1.6, thiamin: 0.017, riboflavin: 0.04, niacin: 0.47, choline: 3.0,
  } },
  translations: {
    no: {
      title: 'Sviske-syltetøy',
      description: 'Rikt, mørkt, naturlig søtt syltetøy laget av tørkede plommer — ingen tilsatt sukker, ingen olje, ikke behov for pektin. Bare fem ekte ingredienser som gjør hele jobben. Ornish GREEN.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'tørkede plommer (svisker, uten tilsatt sukker)' },
        { quantity: 250, unit: 'ml', name: 'vann' },
        { quantity: 1, unit: 'tbsp', name: 'chiafrø' },
        { quantity: 0.5, unit: 'tsp', name: 'malt kanel' },
        { quantity: 2, unit: 'tbsp', name: 'fersk sitronsaft' },
        { quantity: 1, unit: 'tsp', name: 'sitronskall' },
      ],
      steps: [
        'Bløtkok svisken: Ha svisker og vann i en kjele. Kok opp forsiktig, dekk til, og kok til sviskene er svært myke og fyldige.',
        'Bland til puré: Ha sviskene og litt av kokevæsken over i en blender (Vitamix fungerer flott). Bland til helt glatt, og spe med mer kokevæske en skvett om gangen til det blir en tykk, syltetøyaktig puré.',
        'Fortykk med chia: Ha puréen tilbake i kjelen. Rør inn chiafrø og kanel. La det småkoke forsiktig, rør ofte, til chiaen sveller og syltetøyet synlig tykner.',
        'Avslutt av varmen: Ta av varmen. Rør inn sitronsaft og sitronskall — ved å tilsette disse av varmen bevares sitronens friskhet og aromatiske oljer i stedet for å koke dem flate.',
        'Avkjøl og hell på glass: La syltetøyet avkjøles til romtemperatur — det fortsetter å tykne mens det står (chiaen geleres fortsatt). Ha det over i et rent glass og sett kaldt. Holder seg i cirka 2 uker.',
      ],
      notes: 'Hvorfor det smaker fantastisk: tørkede svisker er allerede konsentrerte, syltetøyaktige og dypt søte — kokingen bare vekker det til live. Kanel gir varme uten å konkurrere, og sitronsaft og -skall tilsatt av varmen er det som hindrer det i å smake flatt — forskjellen mellom fruktmos og syltetøy. Chia erstatter pektin og sukker som fortykningsmiddel. Variasjon: bytt kanel med en delt vaniljestang (ha i sammen med sviskene, fjern før blending). Gir cirka 300 g — 10 porsjoner à 2 ss (30 g).',
    },
    sv: {
      title: 'Sviskonsylt',
      description: 'Rik, mörk, naturligt söt sylt gjord av torkade plommon — inget tillsatt socker, ingen olja, inget pektin behövs. Bara fem riktiga ingredienser som gör allt jobbet. Ornish GREEN.',
      ingredients: [
        { quantity: 200, unit: 'g', name: 'torkade plommon (katrinplommon, utan tillsatt socker)' },
        { quantity: 250, unit: 'ml', name: 'vatten' },
        { quantity: 1, unit: 'tbsp', name: 'chiafrön' },
        { quantity: 0.5, unit: 'tsp', name: 'malen kanel' },
        { quantity: 2, unit: 'tbsp', name: 'färsk citronsaft' },
        { quantity: 1, unit: 'tsp', name: 'citronskal' },
      ],
      steps: [
        'Blötkoka plommonen: Lägg de torkade plommonen och vattnet i en kastrull. Koka upp försiktigt, täck och koka tills plommonen är mycket mjuka och fylliga.',
        'Mixa till puré: Överför plommonen och lite av koktvätskan till en mixer (Vitamix fungerar utmärkt). Mixa tills det är helt slätt, och späd med mer sparad vätska en skvätt i taget tills det blir en tjock, sylteliknande puré.',
        'Förtjocka med chia: Häll tillbaka puréen i kastrullen. Rör ner chiafrön och kanel. Låt sjuda försiktigt, rör ofta, tills chian sväller och sylten tydligt tjocknar.',
        'Avsluta av värmen: Ta av från värmen. Rör ner citronsaft och citronskal — genom att tillsätta dessa av värmen bevaras citronens friskhet och aromatiska oljor i stället för att koka bort dem.',
        'Kyl och burka: Låt sylten svalna till rumstemperatur — den fortsätter tjockna medan den står (chian gelar fortfarande). Skeda över i en ren burk och ställ kallt. Håller i cirka 2 veckor.',
      ],
      notes: 'Varför den smakar fantastiskt: torkade plommon är redan koncentrerade, syltiga och djupt söta — kokningen väcker bara liv i det. Kanel ger värme utan att konkurrera, och citronsaft och -skal tillsatta av värmen är det som hindrar den från att smaka platt — skillnaden mellan fruktmos och sylt. Chia ersätter pektin och socker som förtjockningsmedel. Variation: byt kanel mot en delad vaniljstång (lägg i tillsammans med plommonen, ta bort före mixning). Ger cirka 300 g — 10 portioner à 2 msk (30 g).',
    },
  },
})

// ── orn-45: Zucchini, Carrot & Walnut Patties ──────────────────────────────
recipes.push({
  id: 'orn-45',
  title: 'Zucchini, Carrot & Walnut Patties',
  category: 'Side',
  servings: 4,
  prepTime: 45,
  cookTime: 35,
  description: 'Oven-baked, deeply savoury, and properly moist — toasted walnuts and oats give them a rich, almost nutty-roast character with no oil at all. Ornish GREEN.',
  tags: ['ornish-green', 'side', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 180,
  servingWeightGrams: 155,
  ingredients: [
    { quantity: 500, unit: 'g', name: 'zucchini, coarsely grated' },
    { quantity: 200, unit: 'g', name: 'carrots, finely grated' },
    { quantity: 32, unit: 'g', name: 'walnut halves' },
    { quantity: 50, unit: 'g', name: 'rolled oats' },
    { quantity: 12, unit: 'g', name: 'chia seeds' },
    { quantity: 80, unit: 'g', name: 'onion, finely chopped' },
    { quantity: 3, unit: 'clove', name: 'garlic, minced' },
    { quantity: 12, unit: 'g', name: 'nutritional yeast' },
    { quantity: 2, unit: 'tsp', name: 'smoked paprika' },
    { quantity: 10, unit: 'g', name: 'flat-leaf parsley, chopped' },
    { quantity: 1, unit: 'tbsp', name: 'fresh lemon juice' },
    { quantity: 2.4, unit: 'g', name: 'fine sea salt' },
  ],
  steps: [
    "Toast the oats and walnuts: Dry-toast the rolled oats and walnut halves together in a wide pan over medium heat, shaking often, until the oats smell biscuity and the walnuts are fragrant. Tip onto a plate to cool — this is the single biggest flavour step, don't skip it.",
    "Draw the water out of the zucchini: Pile the coarsely grated zucchini into a clean tea towel, gather it up and squeeze hard over the sink. Squeeze twice. Stop while it's still slightly damp — bone-dry zucchini makes a dry patty. No salt at this stage: the salt stays in the mix where we can count it.",
    'Brown the aromatics: Water-sauté the finely chopped onion in a splash of water over medium heat until the water evaporates and the onion starts to stick and colour. Add another splash, scrape the brown film off the pan, and repeat until deep golden. Add the minced garlic for the last 8 minutes.',
    'Grind the toasted mix: Pulse the cooled toasted oats and walnuts in the Vitamix to a coarse meal — some walnut texture should remain. This is the binder and the body of the patty.',
    'Mix and rest: In a large bowl combine the squeezed zucchini, grated carrots, the onion mixture, the oat-walnut meal, chia seeds, nutritional yeast, smoked paprika, chopped parsley, lemon juice and salt. Mix thoroughly with your hands. Rest 15 minutes so the chia and oats hydrate and the mixture firms up.',
    'Shape: Heat oven to 200°C. Line a tray with baking paper. Shape into patties, about 90 g each and roughly 2 cm thick — press them firm and compact, loose patties fall apart.',
    'Bake: Bake 25 minutes, then flip carefully and bake 10 minutes more, until the edges are browned and the surface is dry to the touch.',
    'Rest before serving: Let them sit 5 minutes on the tray. They tighten as they cool and become much easier to lift.',
  ],
  notes: "Chef's note: the browned onion film scraped off the pan is doing the work oil normally does — go further than feels necessary, right to deep amber. Batch cooking: they reheat beautifully at 180°C for 8 minutes, and freeze raw and shaped on a tray. Substitutions: sunflower seeds can replace the walnuts 1:1 (fat drops to 6.1 g, but most of the omega-3 is lost — add 1 tbsp ground flaxseed alongside if you do this); parsnip works for carrot in winter. Salt is pushed as high as GREEN allows: 2.4 g salt gives 283 mg sodium per serving against the 300 mg ceiling — carrots alone contribute 138 mg of that baseline, which is why the added salt can't go higher. Don't increase it. Walnuts are capped at 32 g (8 g per serving): at 40 g total fat crosses 8 g and the recipe goes ORANGE. Chia binds the patty rather than flaxseed, since flaxseed doesn't belong in a 35-minute bake and chia's ALA is better protected by its own antioxidants. Serves 4 · 2 patties per serving · about 155 g finished weight per serving.",
  nutrition: { perServing: {
    calories: 180, protein: 7.2, totalFat: 7.7, saturatedFat: 0.8, polyunsaturatedFat: 4.93, monounsaturatedFat: 1.10,
    omega3: 1.30, omega6: 3.63, cholesterol: 0, totalCarbs: 23.2, totalSugars: 6.7, addedSugar: 0, fiber: 6.5,
    calcium: 83, potassium: 686, copper: 0.36, iron: 2.05, magnesium: 82, manganese: 1.34, selenium: 6.7,
    phosphorus: 232, zinc: 1.70, sodium: 283, vitaminA: 441, vitaminB6: 0.43, vitaminB12: 0, vitaminC: 15,
    vitaminD: 0, vitaminE: 0.61, vitaminK: 53, folate: 72, thiamin: 0.29, riboflavin: 0.24, niacin: 2.17, choline: 26,
  } },
  translations: {
    no: {
      title: 'Squash-, gulrot- og valnøttkarbonader',
      description: 'Ovnsbakte, dypt smakfulle og skikkelig saftige — ristede valnøtter og havre gir dem en rik, nesten nøtteristet karakter helt uten olje. Ornish GREEN.',
      ingredients: [
        { quantity: 500, unit: 'g', name: 'squash (zucchini), grovt revet' },
        { quantity: 200, unit: 'g', name: 'gulrøtter, fint revet' },
        { quantity: 32, unit: 'g', name: 'valnøtthalvdeler' },
        { quantity: 50, unit: 'g', name: 'havregryn' },
        { quantity: 12, unit: 'g', name: 'chiafrø' },
        { quantity: 80, unit: 'g', name: 'løk, finhakket' },
        { quantity: 3, unit: 'clove', name: 'hvitløk, finhakket' },
        { quantity: 12, unit: 'g', name: 'næringsgjær' },
        { quantity: 2, unit: 'tsp', name: 'røkt paprikapulver' },
        { quantity: 10, unit: 'g', name: 'bladpersille, hakket' },
        { quantity: 1, unit: 'tbsp', name: 'fersk sitronsaft' },
        { quantity: 2.4, unit: 'g', name: 'fint havsalt' },
      ],
      steps: [
        'Rist havregryn og valnøtter: Tørrrist havregrynene og valnøtthalvdelene sammen i en vid panne over middels varme, rist ofte, til havren lukter kjeksaktig og valnøttene dufter. Ha over på en tallerken for avkjøling — dette er det viktigste smakssteget, ikke hopp over det.',
        'Trekk vannet ut av squashen: Fyll den grovt revne squashen i et rent kjøkkenhåndkle, saml det sammen og press hardt over vasken. Press to ganger. Stopp mens den fortsatt er litt fuktig — knusktørr squash gir en tørr karbonade. Ikke salt i dette trinnet: saltet holdes i blandingen der vi kan telle det.',
        'Brun aromaen: Vann-sauter den finhakkede løken i en skvett vann over middels varme til vannet fordamper og løken begynner å feste seg og få farge. Tilsett en ny skvett, skrap løs den brune hinnen fra pannen, og gjenta til den er dypt gyllen. Tilsett den finhakkede hvitløken de siste 8 minuttene.',
        'Kvern den ristede blandingen: Puls de avkjølte ristede havregrynene og valnøttene i Vitamixen til et grovt mel — litt valnøtt-tekstur bør fortsatt være synlig. Dette er bindemiddelet og kroppen i karbonaden.',
        'Bland og la hvile: I en stor bolle blander du den pressede squashen, de revne gulrøttene, løkblandingen, havre-valnøtt-melet, chiafrøene, næringsgjæren, den røkte paprikaen, den hakkede persillen, sitronsaften og saltet. Bland grundig med hendene. La hvile i 15 minutter så chiaen og havren hydrerer og blandingen fester seg.',
        'Form: Varm ovnen til 200°C. Kle et brett med bakepapir. Form karbonader, cirka 90 g hver og cirka 2 cm tykke — press dem faste og kompakte, løse karbonader faller fra hverandre.',
        'Stek: Stek i 25 minutter, vend forsiktig og stek 10 minutter til, til kantene er brune og overflaten er tørr å ta på.',
        'La hvile før servering: La dem stå 5 minutter på brettet. De strammer seg til mens de kjøler seg ned og blir mye lettere å løfte.',
      ],
      notes: 'Kokketips: den brune løkhinnen som skrapes av pannen gjør jobben olje normalt gjør — gå lenger enn det føles nødvendig, helt til dyp rav-farge. Bulk-koking: de varmes nydelig opp igjen ved 180°C i 8 minutter, og kan fryses rå og formet på et brett. Erstatninger: solsikkefrø kan erstatte valnøttene 1:1 (fettet synker til 6,1 g, men det meste av omega-3-en forsvinner — tilsett 1 ss malt linfrø ved siden av hvis du gjør dette); pastinakk fungerer i stedet for gulrot om vinteren. Saltet er skjøvet så høyt GREEN tillater: 2,4 g salt gir 283 mg natrium per porsjon mot taket på 300 mg — gulrøttene alene bidrar med 138 mg av grunnlinjen, som er grunnen til at det tilsatte saltet ikke kan økes. Ikke øk det. Valnøttene er begrenset til 32 g (8 g per porsjon): ved 40 g krysser det totale fettet 8 g og oppskriften går over til ORANGE. Chia binder karbonaden i stedet for linfrø, siden linfrø ikke hører hjemme i en 35-minutters steking og chiaens ALA er bedre beskyttet av sine egne antioksidanter. 4 porsjoner · 2 karbonader per porsjon · cirka 155 g ferdig vekt per porsjon.',
    },
    sv: {
      title: 'Squash-, morots- och valnötsbiffar',
      description: 'Ugnsbakade, djupt smakrika och ordentligt saftiga — rostade valnötter och havre ger dem en rik, nästan nötrostad karaktär helt utan olja. Ornish GREEN.',
      ingredients: [
        { quantity: 500, unit: 'g', name: 'squash (zucchini), grovt riven' },
        { quantity: 200, unit: 'g', name: 'morötter, fint rivna' },
        { quantity: 32, unit: 'g', name: 'valnötshalvor' },
        { quantity: 50, unit: 'g', name: 'havregryn' },
        { quantity: 12, unit: 'g', name: 'chiafrön' },
        { quantity: 80, unit: 'g', name: 'lök, finhackad' },
        { quantity: 3, unit: 'clove', name: 'vitlök, finhackad' },
        { quantity: 12, unit: 'g', name: 'näringsjäst' },
        { quantity: 2, unit: 'tsp', name: 'rökt paprikapulver' },
        { quantity: 10, unit: 'g', name: 'bladpersilja, hackad' },
        { quantity: 1, unit: 'tbsp', name: 'färsk citronsaft' },
        { quantity: 2.4, unit: 'g', name: 'fint havssalt' },
      ],
      steps: [
        'Rosta havregryn och valnötter: Torrosta havregrynen och valnötshalvorna tillsammans i en bred panna över medelvärme, skaka ofta, tills havren doftar kexigt och valnötterna doftar. Häll upp på en tallrik för att svalna — det här är det viktigaste smaksteget, hoppa inte över det.',
        'Dra ut vattnet ur squashen: Fyll den grovt rivna squashen i en ren kökshandduk, samla ihop den och pressa hårt över diskhon. Pressa två gånger. Sluta medan den fortfarande är lite fuktig — knastertorr squash ger en torr biff. Inget salt i det här steget: saltet stannar i blandningen där vi kan räkna det.',
        'Bryn aromaterna: Vattensautera den finhackade löken i en skvätt vatten över medelvärme tills vattnet dunstar och löken börjar fastna och få färg. Tillsätt en ny skvätt, skrapa loss den bruna hinnan från pannan, och upprepa tills den är djupt gyllenbrun. Tillsätt den finhackade vitlöken de sista 8 minuterna.',
        'Mal den rostade blandningen: Pulsa de avsvalnade rostade havregrynen och valnötterna i Vitamixen till ett grovt mjöl — lite valnötstextur ska finnas kvar. Det här är bindemedlet och kroppen i biffen.',
        'Blanda och låt vila: Blanda i en stor skål den pressade squashen, de rivna morötterna, lökblandningen, havre-valnötsmjölet, chiafröna, näringsjästen, den rökta paprikan, den hackade persiljan, citronsaften och saltet. Blanda ordentligt för hand. Låt vila i 15 minuter så att chian och havren hydreras och blandningen stelnar.',
        'Forma: Värm ugnen till 200°C. Klä en plåt med bakplåtspapper. Forma biffar, cirka 90 g vardera och cirka 2 cm tjocka — tryck dem fasta och kompakta, lösa biffar faller isär.',
        'Grädda: Grädda i 25 minuter, vänd försiktigt och grädda 10 minuter till, tills kanterna är bruna och ytan är torr att ta på.',
        'Låt vila före servering: Låt dem stå 5 minuter på plåten. De stramar åt när de svalnar och blir mycket lättare att lyfta.',
      ],
      notes: 'Kockens tips: den bruna lökhinnan som skrapas av pannan gör jobbet som olja normalt gör — gå längre än det känns nödvändigt, ända till djup bärnstensfärg. Batchlagning: de värms underbart upp igen vid 180°C i 8 minuter, och kan frysas råa och formade på en plåt. Ersättningar: solrosfrön kan ersätta valnötterna 1:1 (fettet sjunker till 6,1 g, men det mesta av omega-3:an försvinner — tillsätt 1 msk malet linfrö bredvid om du gör detta); palsternacka fungerar i stället för morot på vintern. Saltet är pressat så högt GREEN tillåter: 2,4 g salt ger 283 mg natrium per portion mot taket på 300 mg — morötterna ensamma bidrar med 138 mg av grundnivån, vilket är anledningen till att det tillsatta saltet inte kan höjas. Höj det inte. Valnötterna är begränsade till 32 g (8 g per portion): vid 40 g passerar det totala fettet 8 g och receptet går över till ORANGE. Chia binder biffen i stället för linfrö, eftersom linfrö inte hör hemma i en 35-minuters gräddning och chians ALA skyddas bättre av sina egna antioxidanter. 4 portioner · 2 biffar per portion · cirka 155 g färdig vikt per portion.',
    },
  },
})

// ── orn-46: Sour & Savory White Bean Hummus ────────────────────────────────
recipes.push({
  id: 'orn-46',
  title: 'Sour & Savory White Bean Hummus',
  category: 'Spreads',
  servings: 4,
  prepTime: 15,
  cookTime: 25,
  description: 'Silky white bean hummus built for maximum tang and umami depth — roasted garlic, miso, and a hard hit of fresh lemon, no oil, no tahini overload. Ornish GREEN.',
  tags: ['ornish-green', 'spread', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber', 'high-protein'],
  kcal: 254,
  servingWeightGrams: 180,
  ingredients: [
    { quantity: 480, unit: 'g', name: 'white beans (cannellini), cooked and drained' },
    { quantity: 5, unit: 'tbsp', name: 'fresh lemon juice' },
    { quantity: 1, unit: 'tsp', name: 'lemon zest' },
    { quantity: 3, unit: 'clove', name: 'garlic, roasted' },
    { quantity: 30, unit: 'g', name: 'tahini' },
    { quantity: 1, unit: 'tbsp', name: 'white miso paste' },
    { quantity: 2, unit: 'tbsp', name: 'nutritional yeast' },
    { quantity: 1, unit: 'tsp', name: 'smoked paprika' },
    { quantity: 1, unit: 'tsp', name: 'ground cumin, toasted' },
    { quantity: 4, unit: 'tbsp', name: 'ground flaxseed' },
    { quantity: 4, unit: 'tbsp', name: 'ice-cold water or reserved bean liquid' },
    { quantity: null, unit: '', name: 'sea salt, to taste' },
  ],
  steps: [
    'Roast the garlic: Wrap the garlic cloves loosely in baking paper and roast at 200°C until soft and golden.',
    'Toast the cumin: Dry-toast the ground cumin in a hot pan for 30–60 seconds until fragrant. Set aside.',
    'Blend the base: In a food processor or Vitamix, combine the white beans, roasted garlic, lemon juice, tahini, miso paste, nutritional yeast, toasted cumin and smoked paprika. Blend until mostly smooth.',
    'Whip to silky: With the motor running, stream in the ice-cold water or reserved bean liquid a little at a time until the hummus turns light and whipped rather than pasty.',
    "Finish off-heat: Pulse in the lemon zest briefly. Fold in the ground flaxseed by hand — don't over-blend, this keeps the flax fresh rather than pulverized.",
    'Season and rest: Taste, add salt and extra lemon juice if needed. Rest 10 minutes before serving — the sourness sharpens as it sits.',
  ],
  notes: "Chef's note: The reserved aquafaba (bean liquid) is the real trick to an oil-free whip — it emulsifies exactly like oil would, just without the fat or the compliance problem. Don't skip the rest time; the lemon mellows into the beans rather than sitting on top. Substitution: swap tahini for blended toasted sunflower seeds for a sesame-free version, or use chickpeas instead of white beans for a more classic profile (slightly higher carbs, similar fat).",
  nutrition: { perServing: {
    calories: 254, protein: 14.5, totalFat: 7.8, saturatedFat: 1.0, polyunsaturatedFat: 3.8, monounsaturatedFat: 2.2,
    omega3: 1.62, omega6: 2.07, cholesterol: 0, totalCarbs: 34.7, totalSugars: 1.7, addedSugar: 0, fiber: 11.1,
    calcium: 179, potassium: 817, copper: 0.54, iron: 4.64, magnesium: 97, manganese: 1.16, selenium: 6.8,
    phosphorus: 324, zinc: 2.2, sodium: 148, vitaminA: 11, vitaminB6: 0.65, vitaminB12: 1.22, vitaminC: 9.8,
    vitaminD: 0, vitaminE: 0.19, vitaminK: 0.54, folate: 157, thiamin: 0.68, riboflavin: 0.54, niacin: 4.3, choline: 41,
  } },
  translations: {
    no: {
      title: 'Syrlig og salt hvitbønnehummus',
      description: 'Silkemyk hvitbønnehummus bygget for maksimal syrlighet og umami-dybde — ristet hvitløk, miso og et solid dytt fersk sitron, uten olje, uten tahini-overdose. Ornish GREEN.',
      ingredients: [
        { quantity: 480, unit: 'g', name: 'hvite bønner (cannellini), kokte og avrent' },
        { quantity: 5, unit: 'tbsp', name: 'fersk sitronsaft' },
        { quantity: 1, unit: 'tsp', name: 'sitronskall' },
        { quantity: 3, unit: 'clove', name: 'hvitløk, ristet' },
        { quantity: 30, unit: 'g', name: 'tahini' },
        { quantity: 1, unit: 'tbsp', name: 'hvit misopasta' },
        { quantity: 2, unit: 'tbsp', name: 'næringsgjær' },
        { quantity: 1, unit: 'tsp', name: 'røkt paprikapulver' },
        { quantity: 1, unit: 'tsp', name: 'malt spisskummen, ristet' },
        { quantity: 4, unit: 'tbsp', name: 'malt linfrø' },
        { quantity: 4, unit: 'tbsp', name: 'iskaldt vann eller spart bønnevæske' },
        { quantity: null, unit: '', name: 'havsalt, etter smak' },
      ],
      steps: [
        'Rist hvitløken: Pakk hvitløksfeddene løst inn i bakepapir og rist ved 200°C til de er myke og gylne.',
        'Rist spisskummen: Tørrrist den malte spisskummen i en varm panne i 30–60 sekunder til den dufter. Sett til side.',
        'Bland grunnlaget: Bland de hvite bønnene, den ristede hvitløken, sitronsaften, tahinien, misopastaen, næringsgjæren, den ristede spisskummenen og den røkte paprikaen i en foodprosessor eller Vitamix. Bland til nesten glatt.',
        'Visp til silkemyk: Mens motoren går, hell i det iskalde vannet (eller den sparte bønnevæsken) litt om gangen til hummusen blir lett og luftig i stedet for tung.',
        'Avslutt av varmen: Puls inn sitronskallet kort. Vend inn det malte linfrøet for hånd — ikke overbland, dette holder linfrøet ferskt i stedet for pulverisert.',
        'Smak til og la hvile: Smak, tilsett salt og ekstra sitronsaft om nødvendig. La hvile i 10 minutter før servering — syrligheten skjerpes mens den står.',
      ],
      notes: 'Kokketips: Den sparte akvafabaen (bønnevæsken) er det virkelige trikset for en oljefri visp — den emulgerer akkurat som olje ville gjort, bare uten fettet eller compliance-problemet. Ikke hopp over hviletiden; sitronen mykner inn i bønnene i stedet for å ligge på toppen. Erstatning: bytt tahini med blendede ristede solsikkefrø for en sesamfri versjon, eller bruk kikerter i stedet for hvite bønner for en mer klassisk profil (litt høyere karbohydrater, lignende fett).',
    },
    sv: {
      title: 'Syrlig och salt vitbönshummus',
      description: 'Silkeslen vitbönshummus byggd för maximal syrlighet och umamidjup — rostad vitlök, miso och en rejäl skvätt färsk citron, utan olja, utan tahiniöverdos. Ornish GREEN.',
      ingredients: [
        { quantity: 480, unit: 'g', name: 'vita bönor (cannellini), kokta och avrunna' },
        { quantity: 5, unit: 'tbsp', name: 'färsk citronsaft' },
        { quantity: 1, unit: 'tsp', name: 'citronskal' },
        { quantity: 3, unit: 'clove', name: 'vitlök, rostad' },
        { quantity: 30, unit: 'g', name: 'tahini' },
        { quantity: 1, unit: 'tbsp', name: 'vit misopasta' },
        { quantity: 2, unit: 'tbsp', name: 'näringsjäst' },
        { quantity: 1, unit: 'tsp', name: 'rökt paprikapulver' },
        { quantity: 1, unit: 'tsp', name: 'malen spiskummin, rostad' },
        { quantity: 4, unit: 'tbsp', name: 'malda linfrön' },
        { quantity: 4, unit: 'tbsp', name: 'iskallt vatten eller sparad bönvätska' },
        { quantity: null, unit: '', name: 'havssalt, efter smak' },
      ],
      steps: [
        'Rosta vitlöken: Vira in vitlöksklyftorna löst i bakplåtspapper och rosta vid 200°C tills de är mjuka och gyllene.',
        'Rosta spiskumminen: Torrosta den malda spiskumminen i en het panna i 30–60 sekunder tills den doftar. Ställ åt sidan.',
        'Mixa basen: Mixa de vita bönorna, den rostade vitlöken, citronsaften, tahinin, misopastan, näringsjästen, den rostade spiskumminen och den rökta paprikan i en matberedare eller Vitamix. Mixa tills nästan slätt.',
        'Vispa silkeslent: Med motorn igång, häll i det iskalla vattnet (eller den sparade bönvätskan) lite i taget tills hummusen blir lätt och vispig i stället för tung.',
        'Avsluta av värmen: Pulsa ner citronskalet kort. Vänd ner de malda linfröna för hand — mixa inte för mycket, det håller linfröna färska i stället för pulvriserade.',
        'Smaka av och låt vila: Smaka, tillsätt salt och extra citronsaft vid behov. Låt vila i 10 minuter före servering — syrligheten skärps medan den står.',
      ],
      notes: 'Kockens tips: Den sparade aquafaban (bönvätskan) är det verkliga tricket för en oljefri vispning — den emulgerar precis som olja skulle göra, bara utan fettet eller compliance-problemet. Hoppa inte över vilotiden; citronen mjuknar in i bönorna i stället för att ligga på ytan. Ersättning: byt tahini mot mixade rostade solrosfrön för en sesamfri version, eller använd kikärter i stället för vita bönor för en mer klassisk profil (något högre kolhydrater, liknande fett).',
    },
  },
})

// ── orn-47: Sweet & Sour Cherry Jam ────────────────────────────────────────
recipes.push({
  id: 'orn-47',
  title: 'Sweet & Sour Cherry Jam',
  category: 'Jam',
  servings: 16,
  prepTime: 15,
  cookTime: 15,
  description: 'A jammy, naturally sweet sour cherry spread — no added sugar, no pectin. Sweetened only with Medjool dates, set with chia seeds. Ornish GREEN.',
  tags: ['ornish-green', 'jam', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 35,
  servingWeightGrams: 30,
  ingredients: [
    { quantity: 400, unit: 'g', name: 'sour cherries, pitted (fresh or thawed frozen)' },
    { quantity: 90, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 2, unit: 'tbsp', name: 'boiling water, for blooming the dates' },
    { quantity: 21, unit: 'g', name: 'chia seeds' },
    { quantity: 1, unit: 'tbsp', name: 'fresh lemon juice' },
  ],
  steps: [
    'Bloom the dates: Soak the pitted Medjool dates in the boiling water for 10 minutes until soft, then mash with a fork (or blend) into a smooth paste.',
    'Simmer the cherries: Add the sour cherries and the date paste to a saucepan over medium heat. Simmer, stirring and lightly mashing, for 10–12 minutes until the cherries break down and the mixture thickens.',
    'Set with chia: Take off the heat and stir in the chia seeds. Let sit for 15 minutes — the chia will swell and thicken the jam to a proper spreadable set.',
    'Finish and jar: Stir in the lemon juice off-heat for brightness. Spoon into a clean jar, cool, then refrigerate.',
  ],
  notes: 'Chef\'s note: for a firmer set, add another 1 tsp chia and let it rest overnight in the fridge before serving. Batches well — double the recipe and it keeps refrigerated for up to 10 days, or freeze in small jars. Substitution: swap chia for 1 tbsp ground flaxseed if you prefer a smoother, less gel-like texture — stir it in off-heat the same way. Frozen sweet cherries and only 60 g dates works too if sour cherries aren\'t in season, though it moves further from the sour character. Yield: about 480 g jam. Serving size: 2 tbsp (about 30 g).',
  nutrition: { perServing: {
    calories: 35, protein: 0.6, totalFat: 0.5, saturatedFat: 0.1, polyunsaturatedFat: 0.3, monounsaturatedFat: 0.04,
    omega3: 0.24, omega6: 0.10, cholesterol: 0, totalCarbs: 7.9, totalSugars: 5.9, addedSugar: 0, fiber: 1.2,
    calcium: 16, potassium: 89, copper: 0.05, iron: 0.23, magnesium: 9.7, manganese: 0.08, selenium: 0.92,
    phosphorus: 18.6, zinc: 0.11, sodium: 1, vitaminA: 16.4, vitaminB6: 0.025, vitaminB12: 0, vitaminC: 2.9,
    vitaminD: 0, vitaminE: 0.03, vitaminK: 0.68, folate: 3.6, thiamin: 0.019, riboflavin: 0.016, niacin: 0.31, choline: 1.9,
  } },
  translations: {
    no: {
      title: 'Søtsyrlig kirsebærsyltetøy',
      description: 'Et syltetøyaktig, naturlig søtt surkirsebær-pålegg — ingen tilsatt sukker, ingen pektin. Søtet kun med Medjool-dadler, satt med chiafrø. Ornish GREEN.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'surkirsebær, uten stein (ferske eller tinte frosne)' },
        { quantity: 90, unit: 'g', name: 'Medjool-dadler, uten stein' },
        { quantity: 2, unit: 'tbsp', name: 'kokende vann, til bløtlegging av daddelen' },
        { quantity: 21, unit: 'g', name: 'chiafrø' },
        { quantity: 1, unit: 'tbsp', name: 'fersk sitronsaft' },
      ],
      steps: [
        'Bløtlegg daddelen: Bløtlegg de urkjernede Medjool-daddlene i det kokende vannet i 10 minutter til de er myke, mos deretter med en gaffel (eller blend) til en jevn pasta.',
        'La kirsebærene småkoke: Ha surkirsebærene og daddelpastaen i en kjele over middels varme. La det småkoke, rør og mos lett, i 10–12 minutter til kirsebærene faller fra hverandre og blandingen tykner.',
        'Fortykk med chia: Ta av varmen og rør inn chiafrøene. La stå i 15 minutter — chiaen sveller og tykner syltetøyet til en skikkelig smørbar konsistens.',
        'Avslutt og hell på glass: Rør inn sitronsaften av varmen for friskhet. Ha over i et rent glass, avkjøl, sett deretter kaldt.',
      ],
      notes: 'Kokketips: for en fastere konsistens, tilsett 1 ts chia til og la den hvile natten over i kjøleskapet før servering. Egner seg godt til dobling — doble oppskriften og den holder seg kjølig i opptil 10 dager, eller frys i små glass. Erstatning: bytt chia med 1 ss malt linfrø hvis du foretrekker en glattere, mindre geléaktig konsistens — rør det inn av varmen på samme måte. Frosne søte kirsebær og bare 60 g dadler fungerer også hvis surkirsebær ikke er i sesong, selv om det beveger seg lenger bort fra den sure karakteren. Utbytte: cirka 480 g syltetøy. Porsjonsstørrelse: 2 ss (cirka 30 g).',
    },
    sv: {
      title: 'Sötsur körsbärssylt',
      description: 'Ett syltigt, naturligt sött sura-körsbär-pålägg — inget tillsatt socker, inget pektin. Sötat enbart med Medjooldadlar, satt med chiafrön. Ornish GREEN.',
      ingredients: [
        { quantity: 400, unit: 'g', name: 'sura körsbär, urkärnade (färska eller tinade frysta)' },
        { quantity: 90, unit: 'g', name: 'Medjooldadlar, urkärnade' },
        { quantity: 2, unit: 'tbsp', name: 'kokande vatten, till blötläggning av dadlarna' },
        { quantity: 21, unit: 'g', name: 'chiafrön' },
        { quantity: 1, unit: 'tbsp', name: 'färsk citronsaft' },
      ],
      steps: [
        'Blötlägg dadlarna: Blötlägg de urkärnade Medjooldadlarna i det kokande vattnet i 10 minuter tills de är mjuka, mosa dem sedan med en gaffel (eller mixa) till en jämn pasta.',
        'Låt körsbären sjuda: Lägg de sura körsbären och dadelpastan i en kastrull över medelvärme. Låt sjuda, rör och mosa lätt, i 10–12 minuter tills körsbären faller sönder och blandningen tjocknar.',
        'Förtjocka med chia: Ta av från värmen och rör ner chiafröna. Låt stå i 15 minuter — chian sväller och tjocknar sylten till en ordentlig bredbar konsistens.',
        'Avsluta och burka: Rör ner citronsaften av värmen för friskhet. Skeda över i en ren burk, låt svalna, ställ sedan kallt.',
      ],
      notes: 'Kockens tips: för en fastare konsistens, tillsätt ytterligare 1 tsk chia och låt den vila över natten i kylen före servering. Passar bra att dubblera — dubbla receptet och det håller sig kylt i upp till 10 dagar, eller frys i små burkar. Ersättning: byt chia mot 1 msk malet linfrö om du föredrar en slätare, mindre geléaktig konsistens — rör ner det av värmen på samma sätt. Frysta söta körsbär och bara 60 g dadlar fungerar också om sura körsbär inte är i säsong, även om det rör sig längre bort från den sura karaktären. Utbyte: cirka 480 g sylt. Portionsstorlek: 2 msk (cirka 30 g).',
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

console.log(`Added ${recipes.length} recipes. Pack -> ${pack.version}. Total recipes: ${pack.recipes.length}`)
for (const r of recipes) console.log(`  ${r.id}  ${r.title}`)

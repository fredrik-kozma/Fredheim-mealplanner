/* Adds orn-57..orn-59: Sweet Tahini Sauce for Porridge, Spring Pea Soup,
 * and Creamy Cashew Kebab Sauce. EN canonical + NO + SV, author-supplied
 * nutrition.
 *
 * Step text is rewritten to name ingredients without restating their
 * amounts, per house style — the source drafts embedded every scaled
 * quantity ("Blend in 1 teaspoons fresh lemon juice"), which goes wrong
 * the moment the serving count changes. Vague technique amounts that
 * aren't ingredient quantities (a splash of water to deglaze) stay, as do
 * times and temperatures.
 *
 * Two corrections to the source drafts, both flagged to the author:
 *   - Pea soup step 7 said "stir 7 g of 14 g into each bowl", which only
 *     works at exactly 2 servings. Now "divide between the bowls", which
 *     holds at any count.
 *   - Cashew sauce step 5 read "Chill 30–30 minutes" — a typo for a
 *     single 30-minute rest.
 *
 * Tagging follows each source's own scorecard rather than a blanket
 * assumption. The pea soup is scored GREEN on every criterion, so it
 * carries `ornish-green`. The two sauces are not: both land at 10.0 g
 * total fat against the 8 g ceiling (the cashew note itself says 60 g of
 * cashews would be needed to reach GREEN), and the tahini sauce runs a
 * ~68:1 omega ratio. Condition tags are left to
 * audit_condition_tags.cjs to compute from the real numbers.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const recipes = []

// ── orn-57: Sweet Tahini Sauce for Porridge ────────────────────────────────
recipes.push({
  id: 'orn-57',
  title: 'Sweet Tahini Sauce for Porridge',
  category: 'Sauce',
  servings: 4,
  prepTime: 15,
  cookTime: 0,
  description: 'Creamy date-sweetened tahini drizzle — six ingredients, blender-only, keeps 5 days in the fridge.',
  tags: ['sauce', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 162,
  servingWeightGrams: 72,
  ingredients: [
    { quantity: 60, unit: 'g', name: 'tahini (unsalted, hulled)' },
    { quantity: 72, unit: 'g', name: 'Medjool dates, pitted' },
    { quantity: 150, unit: 'ml', name: 'unsweetened almond milk (homemade, unstrained)' },
    { quantity: 0.3, unit: 'tsp', name: 'ground cinnamon' },
    { quantity: 0.3, unit: 'tsp', name: 'vanilla powder' },
    { quantity: 1, unit: 'tsp', name: 'fresh lemon juice' },
    { quantity: 0.1, unit: 'tsp', name: 'fine sea salt' },
  ],
  steps: [
    'Soften the dates: Cover the pitted dates with boiling water and leave to soften. Drain well — discard the soaking water, or the sauce turns thin and slightly bitter.',
    'Blend: Add the drained dates to the blender with the tahini, almond milk, cinnamon, vanilla powder and salt. Blend on high until completely smooth and glossy — no date flecks left. Scrape down once and blend again if needed.',
    'Brighten and adjust: Blend in the lemon juice for 5 seconds. Taste: it should be sweet with a clear sesame edge. Thin with a splash more almond milk if you want a pouring consistency rather than a spoonable one.',
  ],
  notes: "Yields about 290 g, roughly 72 g (4–5 tbsp) per serving. It thickens noticeably in the fridge — loosen with a spoonful of almond milk before serving. Chef's note: bring the tahini flavour forward by warming the sauce gently, never boiling. Substitutions: oat milk for a sweeter, thinner sauce; 1 tsp carob bloomed in 20 ml boiling water for a chocolate-caramel version.",
  nutrition: { perServing: {
    calories: 162, protein: 3.7, totalFat: 10.0, saturatedFat: 1.3, polyunsaturatedFat: 4.0,
    monounsaturatedFat: 4.2, omega3: 0.06, omega6: 3.9, cholesterol: 0, totalCarbs: 17.6,
    totalSugars: 12.2, addedSugar: 0, fiber: 3.2, calcium: 87, potassium: 216, copper: 0.35,
    iron: 1.7, magnesium: 34, manganese: 0.38, selenium: 5.3, phosphorus: 139, zinc: 0.89,
    sodium: 82, vitaminA: 0, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 0.3, vitaminD: 0,
    vitaminE: 1.0, vitaminK: 0.5, folate: 19, thiamin: 0.26, riboflavin: 0.12, niacin: 1.23, choline: 7.7,
  } },
  translations: {
    no: {
      title: 'Søt tahinisaus til grøt',
      description: 'Kremet, daddelsøtet tahinidressing — seks ingredienser, kun blender, holder seg 5 dager i kjøleskapet.',
      ingredients: [
        { quantity: 60, unit: 'g', name: 'tahini (usaltet, av skrelt sesam)' },
        { quantity: 72, unit: 'g', name: 'Medjool-dadler, uten stein' },
        { quantity: 150, unit: 'ml', name: 'usøtet mandelmelk (hjemmelaget, usilt)' },
        { quantity: 0.3, unit: 'tsp', name: 'malt kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljepulver' },
        { quantity: 1, unit: 'tsp', name: 'fersk sitronsaft' },
        { quantity: 0.1, unit: 'tsp', name: 'fint havsalt' },
      ],
      steps: [
        'Bløtlegg daddlene: Dekk de urkjernede daddlene med kokende vann og la dem mykne. Hell godt av — kast bløtevannet, ellers blir sausen tynn og litt besk.',
        'Kjør glatt: Ha de avrente daddlene i blenderen sammen med tahini, mandelmelk, kanel, vaniljepulver og salt. Kjør på høy hastighet til alt er helt glatt og blankt — ingen daddelbiter igjen. Skrap ned én gang og kjør videre om nødvendig.',
        'Frisk opp og juster: Kjør inn sitronsaften i 5 sekunder. Smak: den skal være søt med en tydelig sesamkant. Spe med en skvett mer mandelmelk om du vil ha en hellbar konsistens i stedet for en som ligger på skjeen.',
      ],
      notes: 'Gir cirka 290 g, omtrent 72 g (4–5 ss) per porsjon. Den tykner merkbart i kjøleskapet — løs den opp med en skje mandelmelk før servering. Kokketips: løft frem tahinismaken ved å varme sausen forsiktig, aldri koke den. Erstatninger: havremelk gir en søtere, tynnere saus; 1 ts carob rørt ut i 20 ml kokende vann gir en sjokolade-karamell-versjon.',
    },
    sv: {
      title: 'Söt tahinisås till gröt',
      description: 'Krämig, dadelsötad tahinidressing — sex ingredienser, endast mixer, håller 5 dagar i kylen.',
      ingredients: [
        { quantity: 60, unit: 'g', name: 'tahini (osaltad, av skalad sesam)' },
        { quantity: 72, unit: 'g', name: 'Medjooldadlar, urkärnade' },
        { quantity: 150, unit: 'ml', name: 'osötad mandelmjölk (hemgjord, osilad)' },
        { quantity: 0.3, unit: 'tsp', name: 'malen kanel' },
        { quantity: 0.3, unit: 'tsp', name: 'vaniljpulver' },
        { quantity: 1, unit: 'tsp', name: 'färsk citronsaft' },
        { quantity: 0.1, unit: 'tsp', name: 'fint havssalt' },
      ],
      steps: [
        'Blötlägg dadlarna: Täck de urkärnade dadlarna med kokande vatten och låt dem mjukna. Häll av ordentligt — släng blötvattnet, annars blir såsen tunn och lite besk.',
        'Mixa slätt: Lägg de avrunna dadlarna i mixern tillsammans med tahini, mandelmjölk, kanel, vaniljpulver och salt. Mixa på hög hastighet tills allt är helt slätt och blankt — inga dadelbitar kvar. Skrapa ner en gång och mixa vidare vid behov.',
        'Fräscha upp och justera: Mixa in citronsaften i 5 sekunder. Smaka: den ska vara söt med en tydlig sesamkant. Späd med en skvätt mer mandelmjölk om du vill ha en hällbar konsistens i stället för en som ligger kvar på skeden.',
      ],
      notes: 'Ger cirka 290 g, ungefär 72 g (4–5 msk) per portion. Den tjocknar märkbart i kylen — lös upp den med en sked mandelmjölk före servering. Kockens tips: lyft fram tahinismaken genom att värma såsen försiktigt, aldrig koka den. Ersättningar: havremjölk ger en sötare, tunnare sås; 1 tsk carob utrört i 20 ml kokande vatten ger en choklad-karamellversion.',
    },
  },
})

// ── orn-58: Spring Pea Soup ────────────────────────────────────────────────
recipes.push({
  id: 'orn-58',
  title: 'Spring Pea Soup',
  category: 'Soup',
  servings: 2,
  prepTime: 10,
  cookTime: 20,
  description: 'Half-blended pea soup with a sunflower seed cream stirred through. Rustic texture, silky base. Ornish GREEN.',
  tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber', 'high-protein'],
  kcal: 281,
  servingWeightGrams: 474,
  ingredients: [
    { quantity: 40, unit: 'g', name: 'shallot, finely chopped' },
    { quantity: 2, unit: 'clove', name: 'garlic, sliced' },
    { quantity: 435, unit: 'g', name: 'green peas, fresh or unsalted frozen' },
    { quantity: 480, unit: 'ml', name: 'salt-free vegetable broth or water' },
    { quantity: 10, unit: 'g', name: 'sunflower seeds' },
    { quantity: 2, unit: 'tbsp', name: 'nutritional yeast (fortified)' },
    { quantity: 0.5, unit: 'tsp', name: 'smoked paprika' },
    { quantity: 1.3, unit: 'g', name: 'fine sea salt' },
    { quantity: 14, unit: 'g', name: 'ground flaxseed' },
  ],
  steps: [
    'Toast and soak the seeds: Dry-toast the sunflower seeds in the pot over medium heat until fragrant and lightly golden. Tip into a heatproof cup, cover with boiling water, and leave to soften while you cook.',
    'Brown the aromatics: Add a splash of water to the pot with the shallot and garlic. Cook, stirring, until the shallot is soft and starting to take on colour — let the water cook away and the pan catch slightly before deglazing with another splash.',
    'Simmer the peas: Add the peas and the broth. Bring to a simmer and cook until the peas are tender and bright green.',
    'Make the sunflower cream: Tip the soaked seeds and all their water into the blender with a ladle of the hot peas and their liquid. Blend on high until completely smooth and creamy — no grit should remain.',
    'Half-blend the soup: Take the pot off the heat. Blend about half the soup — immersion blender in short bursts, or lift half into the blender and return it. Leave the rest whole for texture.',
    'Combine and season: Stir the sunflower cream through the soup, then add the nutritional yeast, smoked paprika and salt. Taste and adjust the paprika.',
    'Finish and serve: Ladle into bowls. Divide the ground flaxseed between them, stirring it in off the heat — never cooked in.',
  ],
  notes: "Salt ceiling: this lands at 275 mg sodium per serving, 25 mg under the GREEN limit. 1.4 g of salt would reach 295 mg and 1.5 g tips it to ORANGE, so 1.3 g stays. No acid: there is nothing sour in this dish at all — salt, umami and sweetness only. That is a legitimate profile for a pea soup and it tastes rounder and heavier for it, but if it reads flat rather than round when you cook it, acid is the first thing to add back rather than more salt. Chef's note: blend the seeds with their soaking water rather than draining them — the minerals leach out in five minutes of soaking and the numbers here assume you keep them. Blending the seed cream with a ladle of hot peas also helps it emulsify properly. Substitutions: fresh mint or dill stirred in at the end; chia seeds replace flaxseed 1:1 for omega-3.",
  nutrition: { perServing: {
    calories: 281, protein: 17.3, totalFat: 6.8, saturatedFat: 0.68, polyunsaturatedFat: 3.8,
    monounsaturatedFat: 1.6, omega3: 1.68, omega6: 2.07, cholesterol: 0, totalCarbs: 40.9,
    totalSugars: 14.3, addedSugar: 0, fiber: 16.6, calcium: 91.6, potassium: 810, copper: 0.64,
    iron: 4.5, magnesium: 127, manganese: 1.30, selenium: 10.0, phosphorus: 396, zinc: 4.4,
    sodium: 275, vitaminA: 95.8, vitaminB6: 2.08, vitaminB12: 4.0, vitaminC: 63.6, vitaminD: 0,
    vitaminE: 2.22, vitaminK: 54.9, folate: 346, thiamin: 2.29, riboflavin: 1.83, niacin: 23.3, choline: 73.7,
  } },
  translations: {
    no: {
      title: 'Vårertesuppe',
      description: 'Halvblendet ertesuppe med solsikkekrem rørt inn. Rustikk tekstur, silkemyk bunn. Ornish GREEN.',
      ingredients: [
        { quantity: 40, unit: 'g', name: 'sjalottløk, finhakket' },
        { quantity: 2, unit: 'clove', name: 'hvitløk, i skiver' },
        { quantity: 435, unit: 'g', name: 'grønne erter, ferske eller frosne uten salt' },
        { quantity: 480, unit: 'ml', name: 'saltfri grønnsakskraft eller vann' },
        { quantity: 10, unit: 'g', name: 'solsikkefrø' },
        { quantity: 2, unit: 'tbsp', name: 'næringsgjær (beriket)' },
        { quantity: 0.5, unit: 'tsp', name: 'røkt paprikapulver' },
        { quantity: 1.3, unit: 'g', name: 'fint havsalt' },
        { quantity: 14, unit: 'g', name: 'malt linfrø' },
      ],
      steps: [
        'Rist og bløtlegg frøene: Tørrrist solsikkefrøene i gryta over middels varme til de dufter og er lett gyllne. Ha dem over i et varmebestandig glass, dekk med kokende vann, og la dem mykne mens du lager resten.',
        'Brun aromaen: Ha en skvett vann i gryta sammen med sjalottløken og hvitløken. Stek under omrøring til sjalottløken er myk og begynner å få farge — la vannet koke inn og pannen feste seg litt før du spe med en ny skvett.',
        'Kok ertene: Tilsett ertene og kraften. Kok opp og la det småkoke til ertene er møre og sterkt grønne.',
        'Lag solsikkekremen: Ha de bløtlagte frøene med alt bløtevannet i blenderen sammen med en øse av de varme ertene og kraften. Kjør på høy hastighet til alt er helt glatt og kremet — ingen grynethet skal være igjen.',
        'Halvblend suppa: Ta gryta av varmen. Blend omtrent halve suppa — stavmikser i korte støt, eller løft halvparten over i blenderen og hell den tilbake. La resten være hel for teksturens skyld.',
        'Bland og smak til: Rør solsikkekremen inn i suppa, og tilsett så næringsgjæren, den røkte paprikaen og saltet. Smak til og juster paprikaen.',
        'Avslutt og server: Øs opp i skåler. Fordel det malte linfrøet mellom dem og rør det inn utenom varmen — aldri kokt inn.',
      ],
      notes: 'Salttak: dette lander på 275 mg natrium per porsjon, 25 mg under GREEN-grensen. 1,4 g salt ville gitt 295 mg, og 1,5 g vipper den over til ORANGE, så 1,3 g blir stående. Ingen syre: det er ikke noe surt i denne retten i det hele tatt — bare salt, umami og sødme. Det er en fullt legitim smaksprofil for en ertesuppe, og den smaker rundere og tyngre av det, men hvis den oppleves flat i stedet for rund når du lager den, er syre det første du bør tilsette igjen, ikke mer salt. Kokketips: blend frøene med bløtevannet i stedet for å helle det av — mineralene lekker ut i løpet av fem minutters bløtlegging, og tallene her forutsetter at du beholder dem. Å blende frøkremen sammen med en øse varme erter hjelper den også å emulgere skikkelig. Erstatninger: fersk mynte eller dill rørt inn på slutten; chiafrø erstatter linfrø 1:1 for omega-3.',
    },
    sv: {
      title: 'Vårärtsoppa',
      description: 'Halvmixad ärtsoppa med solroskräm nedrörd. Rustik konsistens, silkeslen botten. Ornish GREEN.',
      ingredients: [
        { quantity: 40, unit: 'g', name: 'schalottenlök, finhackad' },
        { quantity: 2, unit: 'clove', name: 'vitlök, i skivor' },
        { quantity: 435, unit: 'g', name: 'gröna ärter, färska eller frysta utan salt' },
        { quantity: 480, unit: 'ml', name: 'saltfri grönsaksbuljong eller vatten' },
        { quantity: 10, unit: 'g', name: 'solrosfrön' },
        { quantity: 2, unit: 'tbsp', name: 'näringsjäst (berikad)' },
        { quantity: 0.5, unit: 'tsp', name: 'rökt paprikapulver' },
        { quantity: 1.3, unit: 'g', name: 'fint havssalt' },
        { quantity: 14, unit: 'g', name: 'malda linfrön' },
      ],
      steps: [
        'Rosta och blötlägg fröna: Torrosta solrosfröna i grytan över medelvärme tills de doftar och är lätt gyllene. Häll över dem i ett värmetåligt glas, täck med kokande vatten, och låt dem mjukna medan du lagar resten.',
        'Bryn aromaterna: Häll en skvätt vatten i grytan tillsammans med schalottenlöken och vitlöken. Stek under omrörning tills schalottenlöken är mjuk och börjar få färg — låt vattnet koka in och pannan fastna lite innan du späder med en ny skvätt.',
        'Koka ärterna: Tillsätt ärterna och buljongen. Koka upp och låt sjuda tills ärterna är mjuka och klargröna.',
        'Gör solroskrämen: Lägg de blötlagda fröna med allt blötvatten i mixern tillsammans med en slev av de varma ärterna och buljongen. Mixa på hög hastighet tills allt är helt slätt och krämigt — ingen grynighet ska finnas kvar.',
        'Halvmixa soppan: Ta grytan från värmen. Mixa ungefär halva soppan — stavmixer i korta stötar, eller lyft över hälften i mixern och häll tillbaka den. Låt resten vara hel för konsistensens skull.',
        'Blanda och smaka av: Rör ner solroskrämen i soppan, och tillsätt sedan näringsjästen, den rökta paprikan och saltet. Smaka av och justera paprikan.',
        'Avsluta och servera: Ös upp i skålar. Fördela de malda linfröna mellan dem och rör ner dem utanför värmen — aldrig nedkokta.',
      ],
      notes: 'Salttak: detta landar på 275 mg natrium per portion, 25 mg under GREEN-gränsen. 1,4 g salt skulle ge 295 mg, och 1,5 g tippar över till ORANGE, så 1,3 g står kvar. Ingen syra: det finns inget surt i den här rätten alls — bara salt, umami och sötma. Det är en fullt legitim smakprofil för en ärtsoppa, och den smakar rundare och tyngre av det, men om den upplevs platt i stället för rund när du lagar den är syra det första du bör tillsätta igen, inte mer salt. Kockens tips: mixa fröna med blötvattnet i stället för att hälla av det — mineralerna läcker ut under fem minuters blötläggning, och siffrorna här förutsätter att du behåller dem. Att mixa frökrämen tillsammans med en slev varma ärter hjälper den också att emulgera ordentligt. Ersättningar: färsk mynta eller dill nedrörd på slutet; chiafrön ersätter linfrön 1:1 för omega-3.',
    },
  },
})

// ── orn-59: Creamy Cashew Kebab Sauce ──────────────────────────────────────
recipes.push({
  id: 'orn-59',
  title: 'Creamy Cashew Kebab Sauce',
  category: 'Sauce',
  servings: 4,
  prepTime: 15,
  cookTime: 30,
  description: 'Creamy, tangy cashew sauce for vegan kebab, wraps, grilled vegetables or as a dip. No oil, no added sugar.',
  tags: ['sauce', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 147,
  servingWeightGrams: 85,
  ingredients: [
    { quantity: 80, unit: 'g', name: 'raw cashews, unsalted' },
    { quantity: 150, unit: 'ml', name: 'water' },
    { quantity: 2, unit: 'tbsp', name: 'fresh lemon juice' },
    { quantity: 20, unit: 'g', name: 'tomato paste, no salt added' },
    { quantity: 16, unit: 'g', name: 'dried dates, pitted' },
    { quantity: 10, unit: 'g', name: 'ground flaxseed' },
    { quantity: 1, unit: 'clove', name: 'garlic' },
    { quantity: 1, unit: 'tsp', name: 'onion powder' },
    { quantity: 0.5, unit: 'tsp', name: 'ground cumin' },
    { quantity: 1, unit: 'tsp', name: 'smoked paprika' },
    { quantity: 0.5, unit: 'tsp', name: 'fine sea salt, level' },
  ],
  steps: [
    'Soften the cashews: Cover the cashews with boiling water and leave 10 minutes, then drain. (Or cold-soak 4 hours.) Add the dates to the same bowl if yours are firm.',
    'Blend until completely smooth: Put the drained cashews, water, lemon juice, tomato paste, dates, garlic, onion powder, cumin, smoked paprika and salt into the blender. Blend on high a full minute. Scrape down once and blend again until there is no trace of grit.',
    'Add flaxseed off-heat: Add the ground flaxseed and pulse 5–10 seconds only. Short pulsing keeps friction heat down and protects the omega-3 in the flax.',
    'Adjust and taste: Thin with water a tablespoon at a time. Leave it slightly looser than you want — the flax will tighten it in the fridge. Taste before adding any further salt; the recipe is already at the sodium ceiling.',
    'Rest: Chill 30 minutes. The garlic mellows, the smoked paprika blooms, and the sauce sets to dolloping thickness. Keeps 4 days refrigerated.',
  ],
  notes: 'Consistency: without beans the sauce relies entirely on cashews and flax for body, so blend longer than you think — a full 60 seconds on high. Under-blending is the main failure mode here; it reads gritty rather than creamy. The flax thickens noticeably during the chill, so err slightly loose before resting. Cashew lever: 80 g gives 10.0 g total fat per serving. Drop to 60 g (with 130 ml water) for 7.8 g, which is GREEN on fat — but the sauce becomes noticeably thinner and less rich. Saturated fat stays well under the 3 g ceiling either way. Substitutions: 30 g roasted red pepper in place of the tomato paste gives a sweeter, milder sauce; half a fresh chilli or ¼ tsp chilli flakes at the blending stage if you want heat. As with all fully plant-based recipes, B12 and vitamin D are structurally absent and must come from supplementation.',
  nutrition: { perServing: {
    calories: 147, protein: 4.7, totalFat: 10.0, saturatedFat: 1.7, polyunsaturatedFat: 2.4,
    monounsaturatedFat: 5.0, omega3: 0.59, omega6: 1.77, cholesterol: 0, totalCarbs: 12.4,
    totalSugars: 4.7, addedSugar: 0, fiber: 2.2, calcium: 25, potassium: 264, copper: 0.51,
    iron: 2.0, magnesium: 75, manganese: 0.45, selenium: 5.2, phosphorus: 148, zinc: 1.4,
    sodium: 283, vitaminA: 18, vitaminB6: 0.14, vitaminB12: 0, vitaminC: 4.5, vitaminD: 0,
    vitaminE: 0.6, vitaminK: 8.1, folate: 11, thiamin: 0.14, riboflavin: 0.04, niacin: 0.6, choline: 17,
  } },
  translations: {
    no: {
      title: 'Kremet cashewsaus til kebab',
      description: 'Kremet, syrlig cashewsaus til vegansk kebab, wraps, grillede grønnsaker eller som dipp. Uten olje, uten tilsatt sukker.',
      ingredients: [
        { quantity: 80, unit: 'g', name: 'rå cashewnøtter, usaltede' },
        { quantity: 150, unit: 'ml', name: 'vann' },
        { quantity: 2, unit: 'tbsp', name: 'fersk sitronsaft' },
        { quantity: 20, unit: 'g', name: 'tomatpuré, uten tilsatt salt' },
        { quantity: 16, unit: 'g', name: 'tørkede dadler, uten stein' },
        { quantity: 10, unit: 'g', name: 'malt linfrø' },
        { quantity: 1, unit: 'clove', name: 'hvitløk' },
        { quantity: 1, unit: 'tsp', name: 'løkpulver' },
        { quantity: 0.5, unit: 'tsp', name: 'malt spisskummen' },
        { quantity: 1, unit: 'tsp', name: 'røkt paprikapulver' },
        { quantity: 0.5, unit: 'tsp', name: 'fint havsalt, strøkent' },
      ],
      steps: [
        'Bløtlegg cashewnøttene: Dekk cashewnøttene med kokende vann og la dem stå i 10 minutter, hell så av. (Eller bløtlegg 4 timer i kaldt vann.) Ha daddlene i samme bolle hvis dine er faste.',
        'Kjør helt glatt: Ha de avrente cashewnøttene, vannet, sitronsaften, tomatpuréen, daddlene, hvitløken, løkpulveret, spisskummen, den røkte paprikaen og saltet i blenderen. Kjør på høy hastighet et helt minutt. Skrap ned én gang og kjør videre til det ikke er spor av grynethet igjen.',
        'Tilsett linfrø utenom varmen: Tilsett det malte linfrøet og puls bare 5–10 sekunder. Korte støt holder friksjonsvarmen nede og beskytter omega-3-en i linfrøet.',
        'Juster og smak til: Spe med vann en spiseskje om gangen. La den være litt løsere enn du ønsker — linfrøet strammer den opp i kjøleskapet. Smak før du tilsetter mer salt; oppskriften ligger allerede på natriumtaket.',
        'La hvile: Sett kaldt i 30 minutter. Hvitløken mykner, den røkte paprikaen folder seg ut, og sausen setter seg til klattbar tykkelse. Holder seg 4 dager i kjøleskap.',
      ],
      notes: 'Konsistens: uten bønner er sausen helt avhengig av cashewnøtter og linfrø for fylde, så kjør lenger enn du tror — et helt minutt på høy hastighet. Underblending er hovedfeilen her; da smaker den grynete i stedet for kremet. Linfrøet tykner merkbart under kjølingen, så la den heller være litt løs før hvilen. Cashew-spaken: 80 g gir 10,0 g totalt fett per porsjon. Gå ned til 60 g (med 130 ml vann) for 7,8 g, som er GREEN på fett — men sausen blir merkbart tynnere og mindre fyldig. Mettet fett ligger godt under 3 g-taket uansett. Erstatninger: 30 g grillet paprika i stedet for tomatpuré gir en søtere, mildere saus; en halv fersk chili eller ¼ ts chiliflak i blenderen hvis du vil ha styrke. Som i alle helt plantebaserte oppskrifter mangler B12 og vitamin D strukturelt og må komme fra tilskudd.',
    },
    sv: {
      title: 'Krämig cashewsås till kebab',
      description: 'Krämig, syrlig cashewsås till vegansk kebab, wraps, grillade grönsaker eller som dipp. Utan olja, utan tillsatt socker.',
      ingredients: [
        { quantity: 80, unit: 'g', name: 'råa cashewnötter, osaltade' },
        { quantity: 150, unit: 'ml', name: 'vatten' },
        { quantity: 2, unit: 'tbsp', name: 'färsk citronsaft' },
        { quantity: 20, unit: 'g', name: 'tomatpuré, utan tillsatt salt' },
        { quantity: 16, unit: 'g', name: 'torkade dadlar, urkärnade' },
        { quantity: 10, unit: 'g', name: 'malda linfrön' },
        { quantity: 1, unit: 'clove', name: 'vitlök' },
        { quantity: 1, unit: 'tsp', name: 'lökpulver' },
        { quantity: 0.5, unit: 'tsp', name: 'malen spiskummin' },
        { quantity: 1, unit: 'tsp', name: 'rökt paprikapulver' },
        { quantity: 0.5, unit: 'tsp', name: 'fint havssalt, struket' },
      ],
      steps: [
        'Blötlägg cashewnötterna: Täck cashewnötterna med kokande vatten och låt stå i 10 minuter, häll sedan av. (Eller blötlägg 4 timmar i kallt vatten.) Lägg dadlarna i samma skål om dina är fasta.',
        'Mixa helt slätt: Lägg de avrunna cashewnötterna, vattnet, citronsaften, tomatpurén, dadlarna, vitlöken, lökpulvret, spiskumminen, den rökta paprikan och saltet i mixern. Mixa på hög hastighet en hel minut. Skrapa ner en gång och mixa vidare tills det inte finns spår av grynighet kvar.',
        'Tillsätt linfrö utanför värmen: Tillsätt de malda linfröna och pulsa bara 5–10 sekunder. Korta stötar håller nere friktionsvärmen och skyddar omega-3:an i linfröet.',
        'Justera och smaka av: Späd med vatten en matsked i taget. Låt den vara lite lösare än du vill ha den — linfröet drar ihop den i kylen. Smaka innan du tillsätter mer salt; receptet ligger redan på natriumtaket.',
        'Låt vila: Ställ kallt i 30 minuter. Vitlöken mjuknar, den rökta paprikan vecklar ut sig, och såsen sätter sig till klickbar tjocklek. Håller 4 dagar i kylen.',
      ],
      notes: 'Konsistens: utan bönor är såsen helt beroende av cashewnötter och linfrö för fyllighet, så mixa längre än du tror — en hel minut på hög hastighet. Undermixning är huvudfelet här; då smakar den grynig i stället för krämig. Linfröet tjocknar märkbart under kylningen, så låt den hellre vara lite lös före vilan. Cashewspaken: 80 g ger 10,0 g totalt fett per portion. Gå ner till 60 g (med 130 ml vatten) för 7,8 g, vilket är GREEN på fett — men såsen blir märkbart tunnare och mindre fyllig. Mättat fett ligger gott under 3 g-taket oavsett. Ersättningar: 30 g grillad paprika i stället för tomatpuré ger en sötare, mildare sås; en halv färsk chili eller ¼ tsk chiliflingor i mixern om du vill ha hetta. Som i alla helt växtbaserade recept saknas B12 och D-vitamin strukturellt och måste komma från tillskott.',
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
for (const r of recipes) console.log(`  ${r.id}  ${r.servings} serv  ${r.servingWeightGrams} g  ${r.title}`)

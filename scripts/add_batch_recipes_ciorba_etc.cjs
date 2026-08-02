/* Adds 12 new recipes to the reversal-protocol pack (orn-30..orn-41):
 *   - Ciorbă de Fasole, two methods (stovetop / Instant Pot no-soak)
 *   - Calcium Boost Salad
 *   - Vanilla-Carob Psyllium Pudding, two bases (water / oat milk)
 *   - Golden Corn Soup
 *   - Tahini-Almond Berry Chia Pudding
 *   - A "Rye Sourdough Starter" guide, cross-linked from both rye loaves
 *   - Rye Sourdough Loaf + Wholegrain (yeasted) Rye Loaf
 *   - Brokkolisalat (broccoli salad, tomato-paste version)
 *   - Fredrik's Toasted Buckwheat & Date Granola
 *
 * Source: recipes pasted by the author with nutrition already computed
 * (an external Ornish-GREEN scoring tool). This script:
 *   - normalises ingredient units to the house style (INGREDIENT_UNITS.md):
 *     word units -> canonical keys, chopped/whole produce with a missing
 *     unit fixed to grams, bay leaves and pinch-scale salt -> "to taste"
 *   - rewrites every step to drop restated ingredient quantities (the
 *     source repeated "300 grams dried borlotti beans" inline in the
 *     steps; scaling the recipe would leave that number wrong, since nothing
 *     in step prose scales — the app dropped dynamic step-text scaling
 *     earlier this project for the same reason). Vague technique amounts
 *     ("a few tablespoons of water", "a splash") are kept, matching how
 *     orn-11 already writes steps.
 *   - maps the given nutrition tables onto nutrition.perServing directly
 *     (already computed, not re-derived)
 *   - leaves diabetes-friendly / blood-pressure-friendly / heart-healthy /
 *     weight-loss OFF the tags list — scripts/audit_condition_tags.cjs
 *     computes those from the nutrition data in a separate pass, the same
 *     way it does for every other recipe in the pack, rather than trusting
 *     the source's own "Ornish GREEN" scorecard verbatim.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const ing = (quantity, unit, en, no) => ({ en: { quantity, unit, name: en }, no: { quantity, unit, name: no } })
// "to taste" convention (see INGREDIENT_UNITS.md §4): quantity null, unit '', amount folded into the name.
const taste = (en, no) => ({ en: { quantity: null, unit: '', name: `${en}, to taste` }, no: { quantity: null, unit: '', name: `${no}, etter smak` } })
const bay = (en, no, countEn, countNo) => ({ en: { quantity: null, unit: '', name: `${en} (${countEn})` }, no: { quantity: null, unit: '', name: `${no} (${countNo})` } })

function buildIngredients(rows) {
  return {
    en: rows.map(r => r.en),
    no: rows.map(r => r.no),
  }
}

const RECIPES = []

// ── 1+2. Ciorbă de Fasole — shared ingredient/step content ────────────────
const ciorbaShared = (waterMl, unsoaked) => buildIngredients([
  ing(300, 'g', `dried borlotti (cranberry) beans${unsoaked ? ', unsoaked' : ''}`, `tørkede borlotti-bønner (cranberrybønner)${unsoaked ? ', ubløtlagte' : ''}`),
  ing(150, 'g', 'onion, diced', 'løk, i terninger'),
  ing(150, 'g', 'carrot, diced', 'gulrot, i terninger'),
  ing(100, 'g', 'celery stalks, diced', 'stangselleri, i terninger'),
  ing(3, 'clove', 'garlic, minced', 'hvitløk, finhakket'),
  ing(30, 'g', 'tomato paste, no salt added', 'tomatpuré, uten tilsatt salt'),
  ing(2, 'tsp', 'smoked paprika', 'røkt paprikapulver'),
  bay('Bay leaf, dried', 'Laurbærblad, tørket', '2–3 leaves', '2–3 blader'),
  ing(1, 'l', 'low-sodium vegetable broth', 'grønnsaksbuljong med lavt natrium'),
  ing(waterMl, 'ml', 'water', 'vann'),
  ing(2, 'tbsp', 'fresh lemon juice, for the soup', 'fersk sitronsaft, til suppen'),
  ing(15, 'g', 'fresh parsley, chopped', 'fersk persille, hakket'),
  taste('Fine sea salt, for the pickled onions', 'Fint havsalt, til de syltede løkringene'),
  ing(30, 'g', 'ground flaxseed (added off-heat, per bowl)', 'malt linfrø (tilsettes utenfor varmen, per porsjon)'),
  ing(100, 'g', 'red onion, thinly sliced', 'rødløk, tynne skiver'),
  ing(3, 'tbsp', 'fresh lemon juice, for the pickle', 'fersk sitronsaft, til syltingen'),
])

const ciorbaNutrition = {
  calories: 358, protein: 21.0, totalFat: 4.3, saturatedFat: 0.56,
  polyunsaturatedFat: 2.51, monounsaturatedFat: 1.23, omega3: 1.65, omega6: 0.86,
  cholesterol: 0, totalCarbs: 63.6, totalSugars: 8.4, addedSugar: 0, fiber: 24.0,
  calcium: 182, potassium: 1561, copper: 0.88, iron: 7.61, magnesium: 194,
  manganese: 1.59, selenium: 6.49, phosphorus: 417, zinc: 2.82, sodium: 162,
  vitaminA: 369, vitaminB6: 0.58, vitaminB12: 0, vitaminC: 25.6, vitaminD: 0,
  vitaminE: 1.17, vitaminK: 79.8, folate: 341, thiamin: 0.61, riboflavin: 0.21,
  niacin: 2.70, choline: 63,
}

RECIPES.push({
  id: 'orn-30',
  title: 'Ciorbă de Fasole with Lemon-Pickled Red Onion — Stovetop',
  no_title: 'Ciorbă de Fasole med sitronsyltet rødløk — på komfyren',
  category: 'Soup',
  servings: 4,
  prepTime: 20,
  cookTime: 570,
  description: 'A rich, velvety Romanian-style bean soup built on borlotti beans, bay leaf, and smoked paprika standing in for the traditional smoked meat — topped with sharp, lemon-pickled red onion for crunch and brightness.',
  no_description: 'En rik, fløyelsmyk rumensk bønnesuppe bygget på borlottibønner, laurbærblad og røkt paprika som erstatning for det tradisjonelle røkte kjøttet — toppet med syrlig, sitronsyltet rødløk for sprøhet og friskhet.',
  ingredients: ciorbaShared(500, false),
  steps: {
    en: [
      'Rinse the dried borlotti beans and soak in plenty of cold water for at least 8 hours, or overnight. Drain and rinse well before cooking.',
      'Thinly slice the red onion and toss in a small bowl with the lemon juice and salt. Let sit at room temperature, stirring occasionally, until vibrant pink and slightly softened. Refrigerate until ready to serve.',
      'In a large soup pot, water-sauté the onion, carrot and celery with a few tablespoons of water over medium heat, stirring frequently, until softened and lightly golden.',
      'Add the garlic, tomato paste, smoked paprika and bay leaves. Stir for 1 minute until fragrant.',
      'Add the soaked, drained beans, the broth and the water. Bring to a boil, then reduce to a gentle simmer, partially covered, until the beans are creamy and tender. Stir occasionally, topping up with a splash of water if it thickens too much.',
      'Remove the bay leaves. Stir in the lemon juice and parsley. Taste and adjust seasoning if needed.',
      'Ladle into bowls, sprinkle the ground flaxseed over each portion off the heat, and finish with a spoonful of the drained pickled onions on top.',
    ],
    no: [
      'Skyll de tørkede borlottibønnene og bløtlegg i rikelig med kaldt vann i minst 8 timer, eller over natten. Renn av og skyll godt før koking.',
      'Skjær rødløken i tynne skiver og bland i en liten bolle med sitronsaften og saltet. La stå i romtemperatur, rør av og til, til den er sterkt rosa og litt mykere. Sett kaldt til servering.',
      'Vann-surr løk, gulrot og selleri i en stor gryte med noen spiseskjeer vann over middels varme, rør ofte, til alt er mykt og lett gyllent.',
      'Tilsett hvitløk, tomatpuré, røkt paprika og laurbærblad. Rør i 1 minutt til det dufter.',
      'Tilsett de bløtlagte, avrente bønnene, buljongen og vannet. Kok opp, skru deretter ned til forsiktig småkoking med lokket på gløtt, til bønnene er kremete og møre. Rør av og til, og fyll på med en skvett vann hvis det blir for tykt.',
      'Fjern laurbærbladene. Rør inn sitronsaft og persille. Smak til og juster kryddersmaken om nødvendig.',
      'Øs opp i boller, dryss det malte linfrøet over hver porsjon utenfor varmen, og avslutt med en skje av den avrente syltede løken på toppen.',
    ],
  },
  notes: "A long, gentle simmer is what gives ciorbă de fasole its classic velvety broth — don't rush it. The pickled onion is doing the seasoning work here, so taste before reaching for extra salt. Batch cooks and freezes beautifully (add flaxseed and pickled onion fresh at serving, not before freezing).",
  no_notes: 'En lang, forsiktig småkoking er det som gir ciorbă de fasole sin klassiske fløyelsmyke kraft — ikke skynd deg. Den syltede løken gjør mye av smaksarbeidet her, så smak til før du griper etter mer salt. Passer utmerket til storkoking og frysing (tilsett linfrø og syltet løk ferskt ved servering, ikke før frysing).',
  tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: Math.round(ciorbaNutrition.calories),
  servingWeightGrams: 586,
  nutrition: { perServing: ciorbaNutrition },
})

RECIPES.push({
  id: 'orn-31',
  title: 'Ciorbă de Fasole with Lemon-Pickled Red Onion — Instant Pot, No Soak',
  no_title: 'Ciorbă de Fasole med sitronsyltet rødløk — Instant Pot, uten bløtlegging',
  category: 'Soup',
  servings: 4,
  prepTime: 20,
  cookTime: 70,
  description: 'Same soup, no soaking required, topped with lemon-pickled red onion.',
  no_description: 'Samme suppe, uten behov for bløtlegging, toppet med sitronsyltet rødløk.',
  ingredients: ciorbaShared(300, true),
  steps: {
    en: [
      'Rinse the dried borlotti beans well — no soaking needed.',
      'Thinly slice the red onion and toss in a small bowl with the lemon juice and salt. Let sit at room temperature, stirring occasionally, until vibrant pink and slightly softened. Refrigerate until ready to serve — there’s plenty of time while the beans pressure cook.',
      'Set the Instant Pot to Sauté. Water-sauté the onion, carrot and celery with a few tablespoons of water, stirring frequently, until softened.',
      'Add the garlic, tomato paste, smoked paprika and bay leaves. Stir for 1 minute until fragrant. Press Cancel to end Sauté mode.',
      'Add the rinsed beans, the broth and the water. Secure the lid, set to Pressure Cook on High for 40 minutes, then let the pressure release naturally for at least 20 minutes before opening. Check a bean for doneness — it should be fully creamy with no chalky center.',
      'Remove the bay leaves. Stir in the lemon juice and parsley. Taste and adjust seasoning if needed.',
      'Ladle into bowls, sprinkle the ground flaxseed over each portion off the heat, and finish with a spoonful of the drained pickled onions on top.',
    ],
    no: [
      'Skyll de tørkede borlottibønnene godt — ingen bløtlegging nødvendig.',
      'Skjær rødløken i tynne skiver og bland i en liten bolle med sitronsaften og saltet. La stå i romtemperatur, rør av og til, til den er sterkt rosa og litt mykere. Sett kaldt til servering — det er god tid mens bønnene trykkokes.',
      'Sett Instant Pot til Sauté. Vann-surr løk, gulrot og selleri med noen spiseskjeer vann, rør ofte, til alt er mykt.',
      'Tilsett hvitløk, tomatpuré, røkt paprika og laurbærblad. Rør i 1 minutt til det dufter. Trykk Cancel for å avslutte Sauté-modus.',
      'Tilsett de skylte bønnene, buljongen og vannet. Lukk lokket, still inn på Pressure Cook på High i 40 minutter, og la trykket slippe naturlig ut i minst 20 minutter før du åpner. Sjekk en bønne for at den er ferdig — den skal være helt kremet uten kritt-aktig kjerne.',
      'Fjern laurbærbladene. Rør inn sitronsaft og persille. Smak til og juster kryddersmaken om nødvendig.',
      'Øs opp i boller, dryss det malte linfrøet over hver porsjon utenfor varmen, og avslutt med en skje av den avrente syltede løken på toppen.',
    ],
  },
  notes: "Unsoaked beans need the extra liquid and longer time to fully hydrate — don't shortcut the pressure time. The pickled onion carries the seasoning here, so taste before adding any extra salt.",
  no_notes: 'Ubløtlagte bønner trenger den ekstra væsken og lengre tid for å bli fullt hydrerte — ikke kutt ned på trykktiden. Den syltede løken bærer mye av smaken her, så smak til før du tilsetter mer salt.',
  tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: Math.round(ciorbaNutrition.calories),
  servingWeightGrams: 536,
  nutrition: { perServing: ciorbaNutrition },
})

// ── 3. Calcium Boost Salad ──────────────────────────────────────────────
RECIPES.push({
  id: 'orn-32',
  title: 'Calcium Boost Salad',
  no_title: 'Kalsiumboost-salat',
  category: 'Salad',
  servings: 4,
  prepTime: 15,
  cookTime: null,
  description: 'Massaged kale with a creamy tahini-white bean dressing, topped with chia and dried fig — built to maximize calcium while staying Ornish GREEN.',
  no_description: 'Massert grønnkål med en kremet tahini-hvitbønnedressing, toppet med chia og tørket fiken — bygget for å maksimere kalsium og samtidig holde seg Ornish GREEN.',
  ingredients: buildIngredients([
    ing(300, 'g', 'kale, stems removed and finely chopped', 'grønnkål, uten stilk og finhakket'),
    ing(200, 'g', 'white (cannellini) beans, cooked', 'hvite bønner (cannellini), kokte'),
    ing(32, 'g', 'tahini', 'tahini'),
    ing(60, 'ml', 'fresh lemon juice', 'fersk sitronsaft'),
    ing(1, 'clove', 'garlic', 'hvitløk'),
    ing(0.8, 'tsp', 'smoked paprika', 'røkt paprikapulver'),
    ing(60, 'g', 'dried figs, chopped', 'tørkede fikener, hakket'),
    ing(18, 'g', 'chia seeds', 'chiafrø'),
    ing(0.5, 'tsp', 'fine salt', 'fint salt'),
  ]),
  steps: {
    en: [
      'Massage the kale with a splash of the lemon juice in a large bowl, using your hands, until it softens and turns darker green — about 2 minutes.',
      'In a blender, combine the white beans, tahini, the remaining lemon juice, garlic, smoked paprika and salt with a few tablespoons of water. Blend until smooth and creamy, adjusting water for pourable consistency.',
      'Pour the dressing over the massaged kale and toss until every leaf is coated.',
      'Scatter the dried figs and chia seeds over the top. Serve right away, or chill for the flavors to meld.',
    ],
    no: [
      'Masser grønnkålen med en skvett av sitronsaften i en stor bolle, med hendene, til den mykner og blir mørkere grønn — cirka 2 minutter.',
      'Bland de hvite bønnene, tahini, resten av sitronsaften, hvitløk, røkt paprika og salt med noen spiseskjeer vann i en blender. Kjør til glatt og kremet, juster med vann til ønsket konsistens.',
      'Hell dressingen over den masserte grønnkålen og vend til alle bladene er dekket.',
      'Dryss tørket fiken og chiafrø over toppen. Server med en gang, eller sett kaldt en stund til smakene får satt seg.',
    ],
  },
  notes: "Let the dressed salad sit 10–15 min before serving — the kale softens further and the fig sweetness distributes evenly. Substitution: swap tahini for sunflower seed butter if sesame isn't on hand (calcium drops moderately, fat profile similar).",
  no_notes: 'La den dressede salaten stå 10–15 min før servering — grønnkålen mykner videre og fikensøten fordeler seg jevnt. Erstatning: bytt tahini med solsikkekjernesmør hvis du ikke har sesam for hånden (kalsiuminnholdet synker noe, fettprofilen er lignende).',
  tags: ['ornish-green', 'salad', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 219,
  servingWeightGrams: 168.75,
  nutrition: {
    perServing: {
      calories: 219, protein: 10.8, totalFat: 6.8, saturatedFat: 0.9,
      polyunsaturatedFat: 3.4, monounsaturatedFat: 1.9, omega3: 0.88, omega6: 2.40,
      cholesterol: 0, totalCarbs: 33.7, totalSugars: 9.5, addedSugar: 0, fiber: 9.8,
      calcium: 248, potassium: 832, copper: 0.57, iron: 3.5, magnesium: 92,
      manganese: 1.2, selenium: 6.8, phosphorus: 254, zinc: 1.7, sodium: 41.5,
      vitaminA: 390, vitaminB6: 0.31, vitaminB12: 0, vitaminC: 96.3, vitaminD: 0,
      vitaminE: 1.4, vitaminK: 531, folate: 157, thiamin: 0.31, riboflavin: 0.20,
      niacin: 1.85, choline: 17.2,
    },
  },
})

// ── 4+5. Vanilla-Carob Psyllium Pudding — two bases ────────────────────
function psylliumPudding({ id, base, baseEn, baseNo, prepMinutesBase, kcal, weightGrams, nutrition, notes, notesNo }) {
  return {
    id,
    title: `Vanilla-Carob Psyllium Pudding with Blueberries${base === 'water' ? ' (Water-Based)' : ''}`,
    no_title: `Vanilje-carob-chiapudding${base === 'water' ? ' (vannbasert)' : ''} med blåbær`,
    category: 'Dessert',
    servings: 4,
    prepTime: 10,
    cookTime: 120,
    description: base === 'water'
      ? 'A light, silky pudding built on gelled psyllium husk in water — rich with bloomed carob, Medjool dates, and warm cinnamon, finished with fresh blueberries. No oil, no added sugar. Leaner and less creamy than the oat milk version.'
      : 'A silky, spoonable pudding built on gelled psyllium husk — rich with bloomed carob, Medjool dates, and warm cinnamon, finished with fresh blueberries. No oil, no added sugar.',
    no_description: base === 'water'
      ? 'En lett, silkemyk pudding bygget på gelert psylliumhusk i vann — rik på oppbløtt carob, Medjool-dadler og varm kanel, avsluttet med friske blåbær. Uten olje, uten tilsatt sukker. Slankere og mindre kremet enn havremelk-versjonen.'
      : 'En silkemyk, skjebar pudding bygget på gelert psylliumhusk — rik på oppbløtt carob, Medjool-dadler og varm kanel, avsluttet med friske blåbær. Uten olje, uten tilsatt sukker.',
    ingredients: buildIngredients([
      ing(480, 'ml', baseEn, baseNo),
      ing(24, 'g', 'carob powder', 'carobpulver'),
      ing(60, 'ml', 'boiling water (for blooming carob)', 'kokende vann (til oppbløtning av carob)'),
      ing(88, 'g', 'Medjool dates, pitted', 'Medjool-dadler, uten stein'),
      ing(1, 'tsp', 'vanilla extract', 'vaniljeekstrakt'),
      ing(0.5, 'tsp', 'ground cinnamon', 'malt kanel'),
      taste('Fine sea salt, pinch', 'Fint havsalt, klype'),
      ing(16, 'g', 'psyllium husk powder', 'psylliumhuskpulver'),
      ing(28, 'g', 'ground flaxseed (added per serving, off-heat)', 'malt linfrø (tilsettes per porsjon, utenfor varmen)'),
      ing(140, 'g', 'fresh blueberries (added per serving, on top)', 'friske blåbær (tilsettes per porsjon, på toppen)'),
    ]),
    steps: {
      en: [
        'Whisk the carob powder with the boiling water until you have a smooth, glossy paste with no lumps. Set aside for a few minutes to cool slightly — this step removes the raw chalkiness and deepens the flavor.',
        `In the blender, combine the ${baseEn.split(',')[0]}, the carob paste, dates, vanilla extract, cinnamon and salt. Blend on high until completely smooth and the dates have fully disappeared into the liquid, about ${prepMinutesBase}${base === 'water' ? " — a bit longer than usual since there's no oat milk to help emulsify" : ''}.`,
        "With the blender running on low, sprinkle in the psyllium husk powder and blend for just 5–10 seconds to distribute evenly. It starts gelling almost immediately, so work quickly and don't over-blend.",
        'Pour immediately into serving glasses or jars, dividing evenly before it sets further.',
        base === 'water'
          ? 'Refrigerate for at least 2 hours, ideally overnight, until fully set.'
          : 'Refrigerate for at least 2 hours, ideally overnight, until fully set into a thick, silky pudding.',
        'Just before serving, fold the ground flaxseed into each portion, then top with the fresh blueberries.',
      ],
      no: [
        'Visp carobpulveret med det kokende vannet til du har en glatt, blank pasta uten klumper. Sett til side noen minutter for å avkjøles litt — dette trinnet fjerner den rå, kritt-aktige smaken og gir dypere aroma.',
        `Bland ${baseNo.split(',')[0]}, carobpastaen, dadler, vaniljeekstrakt, kanel og salt i blenderen. Kjør på høy hastighet til det er helt glatt og dadlene har løst seg helt opp, cirka ${prepMinutesBase.replace('seconds', 'sekunder')}${base === 'water' ? ' — litt lenger enn vanlig siden det ikke er havremelk til å hjelpe emulgeringen' : ''}.`,
        'Med blenderen gående på lav hastighet, dryss i psylliumhuskpulveret og kjør bare 5–10 sekunder for å fordele det jevnt. Det begynner å gelere nesten med en gang, så jobb raskt og ikke blend for lenge.',
        'Hell umiddelbart over i serveringsglass eller begre, og fordel jevnt før det setter seg videre.',
        base === 'water'
          ? 'Sett kaldt i minst 2 timer, gjerne over natten, til det har satt seg helt.'
          : 'Sett kaldt i minst 2 timer, gjerne over natten, til det har satt seg til en tykk, silkemyk pudding.',
        'Rett før servering, vend det malte linfrøet inn i hver porsjon, og topp med de friske blåbærene.',
      ],
    },
    notes: notes,
    no_notes: notesNo,
    tags: ['ornish-green', 'dessert', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'gluten-free'],
    kcal,
    servingWeightGrams: weightGrams,
    nutrition: { perServing: nutrition },
  }
}

RECIPES.push(psylliumPudding({
  id: 'orn-33',
  base: 'water',
  baseEn: 'water',
  baseNo: 'vann',
  prepMinutesBase: '60–75 seconds',
  kcal: 148,
  weightGrams: 211,
  nutrition: {
    calories: 148, protein: 2.3, totalFat: 3.2, saturatedFat: 0.3,
    polyunsaturatedFat: 2.1, monounsaturatedFat: 0.6, omega3: 1.60, omega6: 0.46,
    cholesterol: 0, totalCarbs: 32.7, totalSugars: 21.3, addedSugar: 0, fiber: 10.1,
    calcium: 62, potassium: 322, copper: 0.21, iron: 1.0, magnesium: 47,
    manganese: 0.49, selenium: 2.6, phosphorus: 71, zinc: 0.54, sodium: 106,
    vitaminA: 2.7, vitaminB6: 0.13, vitaminB12: 0, vitaminC: 3.5, vitaminD: 0,
    vitaminE: 0.28, vitaminK: 7.8, folate: 13.2, thiamin: 0.14, riboflavin: 0.07,
    niacin: 0.84, choline: 10.6,
  },
  notes: "Without oat milk's fat and protein, the pudding sets a bit thinner — blend the dates extra thoroughly so they fully emulsify and give some body. Speed still matters at the psyllium stage: sprinkle it in with the blender running so it doesn't clump. Substitution: swap water for unsweetened oat milk (480 ml) any time you want a richer, creamier version.",
  notesNo: 'Uten havremelkens fett og protein setter puddingen seg litt tynnere — bland dadlene ekstra grundig så de emulgerer helt og gir litt mer kropp. Hastighet betyr fortsatt noe i psylliumtrinnet: dryss det i mens blenderen går, så det ikke klumper seg. Erstatning: bytt vann med usøtet havremelk (480 ml) når du vil ha en rikere, kremete versjon.',
}))

RECIPES.push(psylliumPudding({
  id: 'orn-34',
  base: 'oat milk',
  baseEn: 'unsweetened oat milk',
  baseNo: 'usøtet havremelk',
  prepMinutesBase: '45–60 seconds',
  kcal: 202,
  weightGrams: 213,
  nutrition: {
    calories: 202, protein: 3.5, totalFat: 5.0, saturatedFat: 0.5,
    polyunsaturatedFat: 2.7, monounsaturatedFat: 1.0, omega3: 1.63, omega6: 0.94,
    cholesterol: 0, totalCarbs: 41.1, totalSugars: 21.3, addedSugar: 0, fiber: 11.0,
    calcium: 86, potassium: 442, copper: 0.24, iron: 1.4, magnesium: 59,
    manganese: 0.68, selenium: 3.8, phosphorus: 119, zinc: 0.78, sodium: 142,
    vitaminA: 2.7, vitaminB6: 0.15, vitaminB12: 0, vitaminC: 3.5, vitaminD: 0,
    vitaminE: 0.34, vitaminK: 7.9, folate: 15.6, thiamin: 0.16, riboflavin: 0.09,
    niacin: 0.96, choline: 13.0,
  },
  notes: "Speed matters at the psyllium stage — sprinkle it in with the blender already running, don't let it sit on top of still liquid or it clumps. Keep the blueberries as a fresh topping rather than blending them in — this preserves the clean dark carob color and gives a nice textural contrast against the smooth pudding. Substitution: swap carob for raw cacao powder (same amount) for a deeper, more bitter 'chocolate' version — stays GREEN.",
  notesNo: 'Hastighet betyr noe i psylliumtrinnet — dryss det i mens blenderen allerede går, ikke la det ligge stille på toppen av væsken eller det klumper seg. La blåbærene være en frisk topping i stedet for å blende dem inn — det bevarer den rene, mørke carob-fargen og gir en fin teksturkontrast mot den glatte puddingen. Erstatning: bytt carob med rå kakaopulver (samme mengde) for en dypere, mer bitter «sjokolade»-versjon — fortsatt GREEN.',
}))

// ── 6. Golden Corn Soup ─────────────────────────────────────────────────
RECIPES.push({
  id: 'orn-35',
  title: 'Golden Corn Soup (Silky-Chewy Curry Version)',
  no_title: 'Gyllen maissuppe (silkemyk-tyggbar curryversjon)',
  category: 'Soup',
  servings: 4,
  prepTime: 15,
  cookTime: 25,
  description: 'A golden, part-silky part-chewy turmeric-curry corn soup with ginger warmth and a whisper of cashew cream — legendary comfort with real texture.',
  no_description: 'En gyllen maissuppe med gurkemeie-curry, dels silkemyk og dels tyggbar, med varme fra ingefær og et snev av cashewkrem — legendarisk komfortmat med ekte tekstur.',
  ingredients: buildIngredients([
    ing(500, 'g', 'frozen corn kernels', 'frosne maiskorn'),
    ing(150, 'g', 'yellow onion, diced', 'gul løk, i terninger'),
    ing(3, 'clove', 'garlic, minced', 'hvitløk, finhakket'),
    ing(10, 'g', 'fresh ginger, grated', 'fersk ingefær, revet'),
    ing(1, 'tsp', 'curry powder', 'karripulver'),
    ing(30, 'g', 'raw cashews, soaked in hot water 10 min', 'rå cashewnøtter, bløtlagt i varmt vann i 10 min'),
    ing(800, 'ml', 'low-sodium vegetable broth', 'grønnsaksbuljong med lavt natrium'),
    ing(2, 'tbsp', 'nutritional yeast', 'næringsgjær'),
    ing(2, 'tbsp', 'fresh lemon juice', 'fersk sitronsaft'),
    ing(0.5, 'tsp', 'salt', 'salt'),
    ing(30, 'g', 'ground flaxseed (added per serving, off-heat)', 'malt linfrø (tilsettes per porsjon, utenfor varmen)'),
    ing(8, 'g', 'fresh chives or parsley, chopped, for garnish', 'fersk gressløk eller persille, hakket, til pynt'),
  ]),
  steps: {
    en: [
      'Cover the cashews with just-boiled water and let sit while you prep everything else.',
      'In a soup pot over medium-high heat, sauté the onion, garlic and ginger with a splash of the broth (2–3 tbsp), stirring frequently, until soft and golden.',
      'Stir in the curry powder and toast for 30 seconds until fragrant.',
      'Add the corn and the remaining broth. Bring to a boil, then reduce and simmer.',
      'Ladle roughly half the soup (liquid, corn and aromatics) into a blender with the drained cashews. Blend until completely smooth and glossy gold, then stir this back into the pot with the unblended chewy half.',
      'Stir in the nutritional yeast and salt. Taste and adjust.',
      'Remove from heat and stir in the lemon juice — this keeps the citrus bright instead of dulled by cooking.',
      'Ladle into bowls. Top each serving with the ground flaxseed (added fresh per bowl, never cooked in) and a scatter of chives or parsley.',
    ],
    no: [
      'Dekk cashewnøttene med nettopp kokt vann og la stå mens du forbereder resten.',
      'Surr løk, hvitløk og ingefær i en gryte over middels høy varme med en skvett av buljongen (2–3 ss), rør ofte, til alt er mykt og gyllent.',
      'Rør inn karripulveret og rist i 30 sekunder til det dufter.',
      'Tilsett maisen og resten av buljongen. Kok opp, skru deretter ned og la småkoke.',
      'Øs cirka halvparten av suppen (væske, mais og smakstilsetninger) over i en blender sammen med de avrente cashewnøttene. Kjør til helt glatt og blank gyllen, rør det deretter tilbake i gryten sammen med den utsjenkede tyggbare halvparten.',
      'Rør inn næringsgjær og salt. Smak til og juster.',
      'Ta av varmen og rør inn sitronsaften — dette holder sitrusen frisk i stedet for at den dempes av kokingen.',
      'Øs opp i boller. Topp hver porsjon med det malte linfrøet (tilsatt ferskt per porsjon, aldri kokt i) og litt gressløk eller persille.',
    ],
  },
  notes: "Blending only half gives you the best of both worlds — a silky, cashew-creamed base carrying whole chewy kernels through every spoonful. Batch-cooks and freezes well for up to 3 months (add flaxseed and chives fresh at reheating). Substitution: swap cashews for cooked white beans for a lower-fat version — slightly less silky, still creamy. If your curry powder contains salt, taste before adding more.",
  no_notes: 'Å blende bare halvparten gir det beste fra begge verdener — en silkemyk, cashewkremet base som bærer hele, tyggbare maiskorn gjennom hver skje. Passer godt til storkoking og fryser fint i opptil 3 måneder (tilsett linfrø og gressløk ferskt ved oppvarming). Erstatning: bytt cashewnøtter med kokte hvite bønner for en magrere versjon — litt mindre silkemykt, fortsatt kremet. Hvis karripulveret ditt inneholder salt, smak til før du tilsetter mer.',
  tags: ['ornish-green', 'soup', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 221,
  servingWeightGrams: 395,
  nutrition: {
    perServing: {
      calories: 221, protein: 8.4, totalFat: 7.8, saturatedFat: 0.9,
      polyunsaturatedFat: 3.25, monounsaturatedFat: 2.1, omega3: 1.63, omega6: 1.63,
      cholesterol: 0, totalCarbs: 33.5, totalSugars: 5.5, addedSugar: 0, fiber: 6.3,
      calcium: 33, potassium: 429, copper: 0.31, iron: 1.7, magnesium: 99,
      manganese: 0.5, selenium: 4, phosphorus: 211, zinc: 1.3, sodium: 238,
      vitaminA: 15, vitaminB6: 0.23, vitaminB12: 0, vitaminC: 16.6, vitaminD: 0,
      vitaminE: 0.18, vitaminK: 5, folate: 71, thiamin: 0.31, riboflavin: 0.18,
      niacin: 2.7, choline: 30,
    },
  },
})

// ── 7. Tahini-Almond Berry Chia Pudding ─────────────────────────────────
RECIPES.push({
  id: 'orn-36',
  title: 'Tahini-Almond Berry Chia Pudding',
  no_title: 'Tahini-mandel-chiapudding med bær',
  category: 'Breakfast',
  servings: 4,
  prepTime: 10,
  cookTime: 240,
  description: 'A creamy, naturally sweet chia pudding built on homemade unstrained almond milk, swirled with tahini and topped with frozen blueberries — a genuinely calcium-rich breakfast.',
  no_description: 'En kremet, naturlig søt chiapudding bygget på hjemmelaget, usilt mandelmelk, virvlet med tahini og toppet med frosne blåbær — en genuint kalsiumrik frokost.',
  ingredients: buildIngredients([
    ing(60, 'g', 'raw almonds', 'rå mandler'),
    ing(500, 'ml', 'water', 'vann'),
    ing(60, 'g', 'chia seeds', 'chiafrø'),
    ing(60, 'g', 'tahini', 'tahini'),
    ing(80, 'g', 'Medjool dates, pitted', 'Medjool-dadler, uten stein'),
    ing(1, 'tsp', 'ground cinnamon', 'malt kanel'),
    ing(160, 'g', 'frozen blueberries', 'frosne blåbær'),
  ]),
  steps: {
    en: [
      'Blend the almonds and water on high until completely smooth — this is your fresh, unstrained almond milk. Keeping it unstrained keeps all the fiber, calcium and fat, so no waste.',
      'Add the dates and cinnamon to the blender. Blend again until fully smooth and sweet.',
      'Add the tahini and blend briefly just until incorporated.',
      'Pour the mixture over the chia seeds in a jar or bowl. Whisk well to break up clumps.',
      'Cover and refrigerate. Stir once after 4 hours to stop clumping, then leave to set.',
      'Stir once more, divide into bowls, and top each with the frozen blueberries. Serve right away while the berries are still cold and a little icy.',
    ],
    no: [
      'Kjør mandler og vann på høy hastighet til helt glatt — dette er din ferske, usilte mandelmelk. Ved å ikke sile bevarer du all fiber, kalsium og fett, så ingenting går til spille.',
      'Ha dadler og kanel i blenderen. Kjør igjen til helt glatt og søtt.',
      'Ha i tahini og kjør kort, bare til det er innblandet.',
      'Hell blandingen over chiafrøene i et glass eller en bolle. Visp godt for å bryte opp klumper.',
      'Dekk til og sett kaldt. Rør en gang etter 4 timer for å hindre klumping, la deretter stå og sette seg.',
      'Rør en gang til, fordel i boller, og topp hver med de frosne blåbærene. Server med en gang mens bærene fortsatt er kalde og litt iskalde.',
    ],
  },
  notes: "The unstrained almond milk is what pushes calcium and fiber up — don't strain out the pulp. Let the blueberries sit at room temperature for a few minutes before serving so they soften slightly against the cold pudding. Substitution: swap dates for a very ripe banana if you want a milder sweetness, or use frozen mixed berries instead of blueberries for variety.",
  no_notes: 'Den usilte mandelmelken er det som løfter kalsium og fiber — ikke sil bort fruktkjøttet. La blåbærene stå i romtemperatur noen minutter før servering så de mykner litt mot den kalde puddingen. Erstatning: bytt dadler med en veldig moden banan for en mildere sødme, eller bruk frosne blandede bær i stedet for blåbær for variasjon.',
  tags: ['ornish-green', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 329,
  servingWeightGrams: 231,
  nutrition: {
    perServing: {
      calories: 329, protein: 8.9, totalFat: 20.3, saturatedFat: 2.2,
      polyunsaturatedFat: 8.6, monounsaturatedFat: 8.1, omega3: 2.74, omega6: 5.89,
      cholesterol: 0, totalCarbs: 34.0, totalSugars: 18.0, addedSugar: 0, fiber: 11.1,
      calcium: 221, potassium: 404, copper: 0.62, iron: 3.4, magnesium: 119,
      manganese: 1.29, selenium: 14.7, phosphorus: 329, zinc: 2.0, sodium: 20.7,
      vitaminA: 1.1, vitaminB6: 0.13, vitaminB12: 0, vitaminC: 4.1, vitaminD: 0,
      vitaminE: 4.2, vitaminK: 8.3, folate: 34, thiamin: 0.18, riboflavin: 0.30,
      niacin: 3.1, choline: 32,
    },
  },
})

// ── 8. Rye Sourdough Starter — reference guide, no nutrition ────────────
RECIPES.push({
  id: 'orn-37',
  title: 'Rye Sourdough Starter — How to Build One From Scratch',
  no_title: 'Rugsurdeigsstarter — slik bygger du en fra bunnen',
  category: 'Bread',
  servings: 1,
  prepTime: 5,
  cookTime: 7200,
  description: 'A step-by-step guide to establishing your own rye sourdough starter using nothing but wholegrain rye flour and water — the foundation for the Rye Sourdough recipe.',
  no_description: 'En steg-for-steg-guide til å etablere din egen rugsurdeigsstarter med bare sammalt rugmel og vann — grunnlaget for oppskriften på rugsurdeigsbrød.',
  ingredients: buildIngredients([
    ing(50, 'g', 'wholegrain rye flour (per feeding)', 'sammalt rugmel (per mating)'),
    ing(50, 'g', 'water, lukewarm (per feeding)', 'vann, lunkent (per mating)'),
  ]),
  steps: {
    en: [
      'Day 1: Mix wholegrain rye flour with lukewarm water in a jar into a thick paste. Cover loosely and leave 24 hours at 24–28°C (a turned-off oven with the light on works well).',
      'Day 2: There may be a few bubbles, or possibly nothing yet. Discard all but a couple of tablespoons, then feed with fresh flour and water in the same ratio. Stir well.',
      "Day 3: Often the most confusing day — lots of activity, then it goes quiet and smells slightly cheesy or unpleasant. That's normal: the wrong bacteria bloom first and get outcompeted. Discard down and feed again as before.",
      'Day 4: The smell should turn cleanly sour, tangy, almost fruity. Discard down and feed again.',
      "Day 5: It should now roughly double within 4–6 hours of feeding and be visibly domed and aerated — that's a mature starter. If it isn't there yet, keep feeding daily; a slow starter is common in a cool kitchen and usually just needs a warmer spot.",
      'Maintenance: feed once a week if kept in the fridge (discard down, feed fresh flour and water, leave out 2 hours, then refrigerate). Before baking, take it out and give it two feeds at room temperature so it’s fully awake.',
    ],
    no: [
      'Dag 1: Bland sammalt rugmel med lunkent vann i et glass til en tykk pasta. Dekk løst til og la stå i 24 timer ved 24–28°C (en avslått ovn med lyset på fungerer bra).',
      'Dag 2: Det kan være noen bobler, eller kanskje ingenting ennå. Kast alt bortsett fra et par spiseskjeer, mat deretter med friskt mel og vann i samme forhold. Rør godt.',
      'Dag 3: Ofte den mest forvirrende dagen — mye aktivitet, så blir det stille og lukter litt osteaktig eller ubehagelig. Det er normalt: feil bakterier blomstrer først og blir utkonkurrert. Kast ned og mat igjen som før.',
      'Dag 4: Lukten skal snu til å bli rent syrlig, friskt, nesten fruktig. Kast ned og mat igjen.',
      'Dag 5: Den skal nå omtrent doble seg innen 4–6 timer etter mating og være tydelig hvelvet og luftig — det er en moden starter. Hvis den ikke er der ennå, fortsett å mate daglig; en treg starter er vanlig i et kjølig kjøkken og trenger som regel bare et varmere sted.',
      'Vedlikehold: mat én gang i uken hvis den oppbevares i kjøleskapet (kast ned, mat med friskt mel og vann, la stå ute i 2 timer, sett deretter kaldt). Før baking, ta den ut og gi den to matinger i romtemperatur så den er helt våken.',
    ],
  },
  notes: "You need only wholegrain rye flour and water — rye starters are the easiest of all to establish, since the grain carries plenty of wild yeast and lactic bacteria on its own. Don't throw away the discard: stir it into porridge, or spread it thin on baking paper with seeds and salt and bake at 160°C into crackers.",
  no_notes: 'Du trenger bare sammalt rugmel og vann — rugstartere er de aller enkleste å etablere, siden kornet bærer med seg rikelig med naturlig gjær og melkesyrebakterier på egen hånd. Ikke kast avfallsdeigen: rør den inn i grøt, eller smør den tynt ut på bakepapir med frø og salt og stek på 160°C til knekkebrød.',
  tags: ['bread', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: 0,
})

// ── 9+10. Rye loaves — shared seed mix ─────────────────────────────────
const ryeShared = buildIngredients([
  ing(40, 'g', 'sunflower seeds', 'solsikkefrø'),
  ing(30, 'g', 'pumpkin seeds', 'gresskarkjerner'),
  ing(30, 'g', 'whole flaxseed', 'hele linfrø'),
  ing(1, 'tsp', 'caraway or fennel seeds, lightly crushed', 'karve- eller fennikelfrø, lett knust'),
])
const ryeNutrition = {
  calories: 141, protein: 4.6, totalFat: 3.8, saturatedFat: 0.44,
  polyunsaturatedFat: 2.15, monounsaturatedFat: 0.75, omega3: 0.47, omega6: 1.68,
  cholesterol: 0, totalCarbs: 24.6, totalSugars: 0.4, addedSugar: 0, fiber: 7.9,
  calcium: 15, potassium: 205, copper: 0.21, iron: 1.21, magnesium: 61,
  manganese: 0.97, selenium: 5.6, phosphorus: 144, zinc: 1.16, sodium: 202,
  vitaminA: 0, vitaminB6: 0.135, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
  vitaminE: 1.3, vitaminK: 1.9, folate: 27, thiamin: 0.17, riboflavin: 0.09,
  niacin: 1.70, choline: 12.8,
}

RECIPES.push({
  id: 'orn-38',
  title: 'Rye Sourdough',
  no_title: 'Rugsurdeigsbrød',
  category: 'Bread',
  servings: 16,
  prepTime: 30,
  cookTime: 2620,
  description: 'A true sourdough rye — dense, moist, faintly tangy, with toasted seeds. No oil, no sweetener, no yeast, no kneading. Two days from levain to slice.',
  no_description: 'Et ekte rugsurdeigsbrød — tett, saftig, svakt syrlig, med ristede frø. Uten olje, uten søtning, uten gjær, uten elting. To dager fra levain til skive.',
  relatedRecipes: ['orn-37'],
  ingredients: {
    en: [
      { quantity: 30, unit: 'g', name: 'mature rye sourdough starter' },
      { quantity: 200, unit: 'g', name: 'wholegrain rye flour (for the levain)' },
      { quantity: 200, unit: 'ml', name: 'water, lukewarm (for the levain)' },
      { quantity: 300, unit: 'g', name: 'wholegrain rye flour (for the final dough)' },
      { quantity: 220, unit: 'ml', name: 'water, lukewarm (for the final dough)' },
      { quantity: 8, unit: 'g', name: 'fine sea salt' },
      ...ryeShared.en,
    ],
    no: [
      { quantity: 30, unit: 'g', name: 'moden rugsurdeigsstarter' },
      { quantity: 200, unit: 'g', name: 'sammalt rugmel (til levain)' },
      { quantity: 200, unit: 'ml', name: 'vann, lunkent (til levain)' },
      { quantity: 300, unit: 'g', name: 'sammalt rugmel (til hoveddeigen)' },
      { quantity: 220, unit: 'ml', name: 'vann, lunkent (til hoveddeigen)' },
      { quantity: 8, unit: 'g', name: 'fint havsalt' },
      ...ryeShared.no,
    ],
  },
  steps: {
    en: [
      'Build the levain (evening): Whisk the sourdough starter, rye flour and lukewarm water into a smooth, thick batter. Cover and leave at 22–24°C for about 14 hours. In the morning it should be domed, full of bubbles, and smell sharply sour and fruity. If it has already peaked and collapsed into a flat, alcohol-smelling batter, it is over-fermented — usable, but the loaf will be denser and more sour.',
      'Toast the seeds: Dry-toast the sunflower seeds, pumpkin seeds and caraway or fennel seeds over medium heat, shaking often, until fragrant and lightly colored. Cool on a plate. Leave the flaxseed untoasted — heat oxidizes its omega-3.',
      "Mix the dough: Set aside a portion of the levain in a clean jar as next week's starter. Stir the water and salt into the remaining levain until loose, then work in the rye flour until no dry flour remains. Fold in the cooled toasted seeds and the flaxseed. It is a heavy sticky paste, never a kneadable dough — do not add flour.",
      'Fill the pan: Scrape into a 1 kg loaf pan lined with baking paper. Wet your hand or a spatula and smooth the top completely level, pressing into the corners to eliminate air pockets. Dust generously with rye flour.',
      'Proof until cracked: Cover loosely and leave at 26–28°C. Sourdough rye proofs far slower than yeasted — expect 3 to 4 hours. It is ready when the dough has risen by about a third and the flour dusting has split into fine cracks across the whole surface. Bake immediately at that point; rye does not tolerate overproofing.',
      'Bake hot, then low: Bake at 250°C for 70 minutes, then reduce to 180°C without opening the door and bake a further 55–65 minutes. Sourdough rye needs slightly longer than the yeasted version. Done at 96–98°C internal — check with a thermometer, not by color.',
      'Rest 24 hours: Turn out, cool completely on a rack, then wrap in a clean kitchen towel and wait a full 24 hours before the first cut. The crumb is still setting during this time. Cutting early is the single most common way to ruin a good rye loaf.',
    ],
    no: [
      'Bygg levain (kvelden før): Visp sammen surdeigsstarteren, rugmel og lunkent vann til en jevn, tykk røre. Dekk til og la stå ved 22–24°C i cirka 14 timer. Om morgenen skal den være hvelvet, full av bobler, og lukte skarpt syrlig og fruktig. Hvis den allerede har toppet seg og falt sammen til en flat, alkoholluktende røre, er den overgjæret — fortsatt brukbar, men brødet blir tettere og surere.',
      'Rist frøene: Tørrist solsikkefrø, gresskarkjerner og karve- eller fennikelfrø over middels varme, rist ofte, til de dufter og er lett fargede. Avkjøl på en tallerken. La linfrøene være urøstet — varme oksiderer omega-3-en.',
      'Bland deigen: Ta vare på en del av levainen i et rent glass som neste ukes starter. Rør vann og salt inn i resten av levainen til den er løs, arbeid deretter inn rugmelet til ingen tørt mel er igjen. Vend inn de avkjølte, ristede frøene og linfrøene. Det er en tung, klebrig pasta, aldri en eltbar deig — ikke tilsett mer mel.',
      'Fyll formen: Skrap over i en 1 kg brødform kledd med bakepapir. Fukt hånden eller en slikkepott og glatt toppen helt jevn, press inn i hjørnene for å fjerne luftlommer. Dryss rikelig med rugmel.',
      'Hev til den sprekker: Dekk løst til og la stå ved 26–28°C. Rugsurdeig hever langt saktere enn gjærbrød — regn med 3 til 4 timer. Den er klar når deigen har hevet med omtrent en tredjedel og melet på toppen har sprukket i fine sprekker over hele overflaten. Stek umiddelbart da; rug tåler ikke overheving.',
      'Stek varmt, så lavt: Stek på 250°C i 70 minutter, skru deretter ned til 180°C uten å åpne døren og stek videre i 55–65 minutter. Rugsurdeig trenger litt lengre tid enn gjærversjonen. Ferdig ved 96–98°C kjernetemperatur — sjekk med termometer, ikke etter farge.',
      'Hvil i 24 timer: Ta ut, avkjøl helt på rist, pakk deretter inn i et rent kjøkkenhåndkle og vent en hel dag før du skjærer den første skiven. Krummen setter seg fortsatt i denne tiden. Å skjære for tidlig er den vanligste årsaken til at hjemmelaget rugbrød blir klissete.',
    ],
  },
  notes: "Reserve some of the finished levain before mixing the dough — that becomes your starter for next time. Feed it and refrigerate. The acidity of a true sourdough is what makes this version more reliable than the yeasted one: it shuts down rye's amylase enzyme properly, so gummy crumb becomes much harder to produce. Too sour? Shorten the levain to 10 hours and keep it cooler (20°C). Not sour enough? Extend to 18 hours and keep it warm. That single variable is your main flavor dial. Keeps a full week wrapped in cloth and genuinely improves on days 2–3.",
  no_notes: 'Ta vare på litt av den ferdige levainen før du blander deigen — det blir din starter til neste gang. Mat den og sett kaldt. Syren i en ekte surdeig er det som gjør denne versjonen mer pålitelig enn gjærversjonen: den slår effektivt ned rugens amylase-enzym, så klissete krumme blir mye vanskeligere å få. For surt? Kort ned levainen til 10 timer og hold den kjøligere (20°C). Ikke surt nok? Forleng til 18 timer og hold den varm. Den ene variabelen er din viktigste smaksskrue. Holder seg en hel uke pakket i klut og blir genuint bedre på dag 2–3.',
  tags: ['ornish-green', 'bread', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: Math.round(ryeNutrition.calories),
  servingWeightGrams: 58,
  nutrition: { perServing: ryeNutrition },
})

RECIPES.push({
  id: 'orn-39',
  title: 'Wholegrain Rye Loaf',
  no_title: 'Rugbrød av sammalt rugmel',
  category: 'Bread',
  servings: 16,
  prepTime: 25,
  cookTime: 2280,
  description: 'A dense, moist, deeply flavored 100% wholegrain rye loaf with toasted seeds — no oil, no sweetener, no kneading.',
  no_description: 'Et tett, saftig og smaksrikt 100 % sammalt rugbrød med ristede frø — uten olje, uten søtning, uten elting.',
  relatedRecipes: ['orn-37'],
  ingredients: {
    en: [
      { quantity: 250, unit: 'g', name: 'wholegrain rye flour (for the sponge)' },
      { quantity: 250, unit: 'ml', name: 'water, lukewarm (for the sponge)' },
      { quantity: 1, unit: 'g', name: 'instant dry yeast (for the sponge)' },
      { quantity: 250, unit: 'g', name: 'wholegrain rye flour (for the final dough)' },
      { quantity: 200, unit: 'ml', name: 'water, lukewarm (for the final dough)' },
      { quantity: 3, unit: 'g', name: 'instant dry yeast (for the final dough)' },
      { quantity: 8, unit: 'g', name: 'fine sea salt' },
      ...ryeShared.en,
    ],
    no: [
      { quantity: 250, unit: 'g', name: 'sammalt rugmel (til forgrødet)' },
      { quantity: 250, unit: 'ml', name: 'vann, lunkent (til forgrødet)' },
      { quantity: 1, unit: 'g', name: 'tørrgjær (til forgrødet)' },
      { quantity: 250, unit: 'g', name: 'sammalt rugmel (til hoveddeigen)' },
      { quantity: 200, unit: 'ml', name: 'vann, lunkent (til hoveddeigen)' },
      { quantity: 3, unit: 'g', name: 'tørrgjær (til hoveddeigen)' },
      { quantity: 8, unit: 'g', name: 'fint havsalt' },
      ...ryeShared.no,
    ],
  },
  steps: {
    en: [
      'Sponge (night before): Whisk the rye flour, water and yeast into a thick, smooth batter. Cover and leave at room temperature overnight. It should smell pleasantly sour and tangy in the morning — that acidity is doing structural work, not just flavor.',
      'Toast the seeds: Dry-toast the sunflower seeds, pumpkin seeds and caraway or fennel seeds in a pan over medium heat, shaking often, until fragrant and lightly colored. Tip onto a plate to cool. Do not toast the flaxseed — heat damages its omega-3.',
      'Mix the dough: Stir the water, yeast and salt into the sponge, then work in the rye flour with a sturdy spoon or wet hands until no dry flour remains. Fold in the cooled toasted seeds and the flaxseed. It will be a sticky paste, not a dough — do not knead and do not add flour to fix the stickiness.',
      'Shape into the pan: Scrape into a 1 kg loaf pan lined with baking paper. Smooth the top with a wet spatula or wet hand until level — water is your only tool against stickiness. Dust the surface with a little rye flour.',
      'Proof until it cracks: Cover loosely and leave in a warm spot until the dough has risen by roughly a third and fine cracks appear across the floured surface. Watch for the cracks, not the clock — and do not let it overproof.',
      'Bake hot, then low: Bake at 250°C for 65 minutes, then drop the oven to 180°C without opening the door and bake a further 50–60 minutes. It is done at an internal temperature of 96–98°C — use a thermometer, the crust tells you nothing.',
      'Rest 24 hours: Turn out onto a rack and cool completely, then wrap in a clean kitchen towel and leave a full 24 hours before cutting. This is the step everyone skips and the reason most home rye is gummy.',
    ],
    no: [
      'Forgrøt (kvelden før): Visp sammen rugmel, vann og gjær til en tykk, jevn røre. Dekk til og la stå i romtemperatur over natten. Den skal lukte behagelig syrlig og friskt om morgenen — den syren gjør strukturelt arbeid, ikke bare smak.',
      'Rist frøene: Tørrist solsikkefrø, gresskarkjerner og karve- eller fennikelfrø i en panne over middels varme, rist ofte, til de dufter og er lett fargede. Hell over på en tallerken for avkjøling. Ikke rist linfrøene — varme skader omega-3-en.',
      'Bland deigen: Rør vann, gjær og salt inn i forgrøten, arbeid deretter inn rugmelet med en solid skje eller våte hender til ingen tørt mel er igjen. Vend inn de avkjølte, ristede frøene og linfrøene. Det blir en klebrig pasta, ikke en deig — ikke elt, og ikke tilsett mer mel for å fikse klebrigheten.',
      'Form i formen: Skrap over i en 1 kg brødform kledd med bakepapir. Glatt toppen med en våt slikkepott eller våt hånd til den er jevn — vann er ditt eneste verktøy mot klebrighet. Dryss litt rugmel over overflaten.',
      'Hev til den sprekker: Dekk løst til og la stå på et varmt sted til deigen har hevet med omtrent en tredjedel og fine sprekker vises over den melede overflaten. Følg med på sprekkene, ikke klokken — og ikke la den heve for lenge.',
      'Stek varmt, så lavt: Stek på 250°C i 65 minutter, senk deretter ovnen til 180°C uten å åpne døren og stek videre i 50–60 minutter. Den er ferdig ved en kjernetemperatur på 96–98°C — bruk termometer, skorpen forteller deg ingenting.',
      'Hvil i 24 timer: Ta ut på rist og avkjøl helt, pakk deretter inn i et rent kjøkkenhåndkle og la stå en hel dag før du skjærer i det. Dette er trinnet alle hopper over, og grunnen til at de fleste hjemmelagde rugbrød blir klissete.',
    ],
  },
  notes: 'Sourdough upgrade: replace all the yeast with active rye starter (see the Rye Sourdough Starter guide), use a little less water, and extend the sponge and final proof times. Sharper flavor, better keeping, and the acidity gives you a real safety margin against gumminess. Storage: wrap in a clean cloth, cut side down, at room temperature. It improves for 2–3 days and keeps for a week. Freezes well pre-sliced. Why no molasses: nearly every rye recipe calls for it. The overnight sponge and toasted seeds give you that same dark, malty depth without any added sugar.',
  no_notes: 'Surdeigsoppgradering: erstatt all gjæren med aktiv rugsurdeigsstarter (se guiden Rugsurdeigsstarter), bruk litt mindre vann, og forleng tiden for forgrøt og siste heving. Skarpere smak, bedre holdbarhet, og syren gir deg en reell sikkerhetsmargin mot klissenhet. Oppbevaring: pakk inn i en ren klut, med snittflaten ned, i romtemperatur. Det blir bedre i 2–3 dager og holder seg en uke. Fryser godt ferdig oppskåret. Hvorfor ingen sirup: nesten alle rugoppskrifter bruker det. Den natt-over forgrøten og de ristede frøene gir deg den samme mørke, maltaktige dybden uten noe tilsatt sukker.',
  tags: ['ornish-green', 'bread', 'vegan', 'oil-free', 'no-added-sugar'],
  kcal: Math.round(ryeNutrition.calories),
  servingWeightGrams: 58,
  nutrition: { perServing: ryeNutrition },
})

// ── 11. Brokkolisalat ────────────────────────────────────────────────────
RECIPES.push({
  id: 'orn-40',
  title: 'Broccoli Salad with Toasted Walnuts and White Bean Dressing',
  no_title: 'Brokkolisalat med ristede valnøtter og hvitbønnedressing',
  category: 'Salad',
  servings: 4,
  prepTime: 25,
  cookTime: 30,
  description: 'Broccoli salad with toasted walnuts and a creamy white bean dressing, built around a deeply toasted tomato paste in place of sun-dried tomatoes. No oil, no added sugar — Ornish GREEN.',
  no_description: 'Brokkolisalat med ristede valnøtter og en kremet hvitbønnedressing, bygget rundt en dypt ristet tomatpuré i stedet for soltørkede tomater. Uten olje, uten tilsatt sukker — Ornish GREEN.',
  ingredients: buildIngredients([
    ing(600, 'g', 'broccoli, cut into small florets', 'brokkoli, i små buketter'),
    ing(150, 'g', 'black beans, cooked, drained and rinsed (no added salt)', 'svarte bønner, kokte, avrent og skylt (uten tilsatt salt)'),
    ing(60, 'g', 'tomato paste, no salt added', 'tomatpuré, uten tilsatt salt'),
    ing(50, 'g', 'red onion, thinly sliced', 'rødløk, tynne skiver'),
    ing(22, 'g', 'walnuts', 'valnøtter'),
    ing(150, 'g', 'white (cannellini) beans, cooked, drained and rinsed (no added salt)', 'hvite bønner (cannellini), kokte, avrent og skylt (uten tilsatt salt)'),
    ing(45, 'ml', 'fresh lemon juice', 'fersk sitronsaft'),
    ing(8, 'g', 'nutritional yeast', 'næringsgjær'),
    ing(20, 'g', 'Medjool date, pitted', 'Medjool-daddel, uten stein'),
    ing(1, 'clove', 'garlic', 'hvitløk'),
    ing(0.5, 'tsp', 'smoked paprika', 'røkt paprikapulver'),
    ing(1, 'g', 'fine sea salt', 'fint havsalt'),
    ing(70, 'ml', 'water, for the dressing', 'vann, til dressingen'),
    ing(28, 'g', 'ground flaxseed, for finishing', 'malt linfrø, til pynt'),
  ]),
  steps: {
    en: [
      'Toast the walnuts: Heat the oven to 170°C. Spread the walnuts on a baking-paper-lined tray and toast for 9 minutes until fragrant. Remove immediately, cool at room temperature, then chop coarsely.',
      'Dry-toast the tomato paste: Put the tomato paste in a dry pan over medium heat. Stir constantly for 3 minutes until it darkens from bright red to deep brick and smells sweet rather than sharp. Scrape into a bowl and cool.',
      'Soak the onion: Soak the sliced red onion in cold water for 10 minutes to take the raw bite off, then drain well.',
      'Blanch the broccoli: Bring a large pot of unsalted water to a rolling boil. Add the broccoli florets and blanch for 1 minute, until vividly green and just tender at the stem.',
      'Shock and dry: Drain and rinse under cold water for 2 minutes. Dry thoroughly — salad spinner, then pat with a towel. Wet broccoli dilutes the dressing.',
      'Blend the dressing: In the blender, blend the toasted tomato paste with the white beans, lemon juice, nutritional yeast, date, garlic, smoked paprika, salt and water until completely smooth — at least 60 seconds. It should be pourable and glossy.',
      'Assemble: Combine the broccoli, black beans, onion and walnuts in a large bowl. Pour over the dressing and fold until every floret is coated.',
      'Chill and finish: Refrigerate at least 30 minutes. Serve cold or at room temperature, scattering the ground flaxseed over each portion just before it goes to the table — never stirred in ahead.',
    ],
    no: [
      'Rist valnøttene: Varm ovnen til 170°C. Fordel valnøttene på et bakepapirkledd brett og rist i 9 minutter til de dufter. Ta ut med en gang, avkjøl i romtemperatur, og hakk deretter grovt.',
      'Tørrrist tomatpuréen: Ha tomatpuréen i en tørr panne over middels varme. Rør konstant i 3 minutter til den mørkner fra sterk rød til dyp murstein og lukter søtt i stedet for skarpt. Skrap over i en bolle og avkjøl.',
      'Bløtlegg løken: Bløtlegg den skivede rødløken i kaldt vann i 10 minutter for å ta bort den rå skarpheten, la deretter renne godt av.',
      'Blancher brokkolien: Kok opp en stor gryte med usaltet vann til full koking. Ha i brokkolibukettene og blancher i 1 minutt, til de er intenst grønne og akkurat møre ved stilken.',
      'Sjokk og tørk: Renn av og skyll under kaldt vann i 2 minutter. Tørk grundig — saladespinner, deretter klapp tørr med et håndkle. Våt brokkoli fortynner dressingen.',
      'Bland dressingen: Bland den ristede tomatpuréen med de hvite bønnene, sitronsaft, næringsgjær, daddel, hvitløk, røkt paprika, salt og vann i blenderen til helt glatt — minst 60 sekunder. Den skal være hellbar og blank.',
      'Sett sammen: Kombiner brokkoli, svarte bønner, løk og valnøtter i en stor bolle. Hell over dressingen og vend til alle buketter er dekket.',
      'Avkjøl og avslutt: Sett kaldt i minst 30 minutter. Server kald eller i romtemperatur, dryss det malte linfrøet over hver porsjon rett før servering — aldri rørt inn på forhånd.',
    ],
  },
  notes: "The toasted tomato paste is what replaces sun-dried tomatoes — don't skip it, and don't rush it. If it catches, splash in a tablespoon of water and scrape. Salt: 1 g is the recommended level; you have headroom up to about 2.4 g total before leaving GREEN, but that spends most of the day's sodium budget on one dish. Substitutions: 15 g dried porcini (rehydrated, chopped, soaking liquid discarded) instead of the paste if you want chewy pieces; use white beans for both dressing and salad body to open only one tin.",
  no_notes: 'Den ristede tomatpuréen er det som erstatter soltørkede tomater — ikke hopp over den, og ikke skynd deg. Hvis den setter seg fast, spe med en spiseskje vann og skrap løs. Salt: 1 g er anbefalt nivå; du har rom opp til cirka 2,4 g totalt før du forlater GREEN, men det bruker opp mesteparten av dagens natriumbudsjett på én rett. Erstatninger: 15 g tørkede steinsopp (bløtlagt, hakket, bløtevæsken kastes) i stedet for puréen hvis du vil ha tyggbare biter; bruk hvite bønner til både dressing og salatkropp for å bare åpne én boks.',
  tags: ['ornish-green', 'salad', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 269,
  servingWeightGrams: 302,
  nutrition: {
    perServing: {
      calories: 269, protein: 15.2, totalFat: 7.7, saturatedFat: 0.79,
      polyunsaturatedFat: 4.92, monounsaturatedFat: 1.10, omega3: 2.19, omega6: 2.71,
      cholesterol: 0, totalCarbs: 40.7, totalSugars: 9.1, addedSugar: 0, fiber: 13.5,
      calcium: 152, potassium: 1115, copper: 0.51, iron: 4.5, magnesium: 133,
      manganese: 1.14, selenium: 8.4, phosphorus: 306, zinc: 2.3, sodium: 162,
      vitaminA: 64, vitaminB6: 0.48, vitaminB12: 0, vitaminC: 109, vitaminD: 0,
      vitaminE: 2.3, vitaminK: 149, folate: 201, thiamin: 0.61, riboflavin: 0.34,
      niacin: 2.9, choline: 64,
    },
  },
})

// ── 12. Fredrik's Toasted Buckwheat & Date Granola ─────────────────────
RECIPES.push({
  id: 'orn-41',
  title: "Fredrik's Toasted Buckwheat & Date Granola",
  no_title: 'Fredriks ristede bokhvete- og daddelgranola',
  category: 'Breakfast',
  servings: 4,
  prepTime: 20,
  cookTime: 85,
  description: 'Deep-toasted oats, caramel-like date paste, and buckwheat groats baked into proper crunchy clusters. No oil, no added sugar — Ornish GREEN.',
  no_description: 'Dypt ristede havregryn, karamellaktig daddelpasta og bokhvetegryn bakt til ordentlige sprø klaser. Uten olje, uten tilsatt sukker — Ornish GREEN.',
  ingredients: buildIngredients([
    ing(160, 'g', 'rolled oats (old-fashioned, not instant)', 'havregryn (vanlige, ikke hurtiggryn)'),
    ing(60, 'g', 'raw buckwheat groats', 'rå bokhvetegryn'),
    ing(100, 'g', 'Medjool dates, pitted', 'Medjool-dadler, uten stein'),
    ing(100, 'ml', 'boiling water', 'kokende vann'),
    ing(2, 'tsp', 'ground cinnamon', 'malt kanel'),
    ing(2, 'tsp', 'vanilla extract', 'vaniljeekstrakt'),
    taste('Fine sea salt', 'Fint havsalt'),
    ing(30, 'g', 'ground flaxseed (added off-heat)', 'malt linfrø (tilsettes utenfor varmen)'),
  ]),
  steps: {
    en: [
      "Dry-toast the oats: Heat a large dry pan over medium heat. Add the rolled oats and toast, stirring often, until they smell nutty and turn a shade darker — about 6 minutes. This is where most of the flavor comes from; don't rush it. Tip into a large bowl.",
      'Toast the buckwheat: In the same dry pan, toast the buckwheat groats for 3 minutes until fragrant and lightly golden. Add to the bowl with the oats.',
      'Bloom the dates: Put the dates in a blender with the boiling water and let them soften for 5 minutes. Blend to a completely smooth, glossy paste — it should look like caramel. Blend in the cinnamon, vanilla extract and salt.',
      'Combine: Pour the date paste over the toasted oats and buckwheat. Mix thoroughly with a spatula until every flake is coated and the mixture holds together when squeezed in your hand.',
      'Press into a slab: Heat the oven to 150°C. Line a baking tray with baking paper. Tip the mixture out and press it down firmly into an even slab about 1 cm thick — pressing hard is what creates clusters instead of loose crumbs.',
      'Bake undisturbed: Bake for 25 minutes without touching it.',
      'Break and finish baking: Break the slab into large chunks with a spatula, flip them over, and bake a further 15 minutes until dry and deeply golden.',
      'Cool completely: Slide the paper onto a rack and leave the granola completely untouched for at least 45 minutes. It crisps as it cools — moving it while warm is the single most common reason granola goes soft.',
      'Stir in the flaxseed: Once fully cool, stir the ground flaxseed through the granola. Adding it off-heat protects the ALA omega-3 from oxidation. Store in an airtight jar for up to 2 weeks.',
    ],
    no: [
      'Tørrist havregrynene: Varm en stor tørr panne over middels varme. Ha i havregrynene og rist, rør ofte, til de lukter nøtteaktig og blir en tone mørkere — cirka 6 minutter. Dette er hvor mesteparten av smaken kommer fra; ikke skynd deg. Hell over i en stor bolle.',
      'Rist bokhveten: I samme tørre panne, rist bokhvetegrynene i 3 minutter til de dufter og er lett gyldne. Ha over i bollen med havregrynene.',
      'Bløt opp dadlene: Ha dadlene i en blender med det kokende vannet og la dem mykne i 5 minutter. Kjør til en helt glatt, blank pasta — den skal ligne karamell. Bland inn kanel, vaniljeekstrakt og salt.',
      'Kombiner: Hell daddelpastaen over de ristede havregrynene og bokhveten. Bland grundig med en slikkepott til hver flak er dekket og blandingen holder sammen når du klemmer den i hånden.',
      'Press ut i en plate: Varm ovnen til 150°C. Kle et stekebrett med bakepapir. Hell ut blandingen og press den godt ned til en jevn plate på cirka 1 cm tykkelse — hardt press er det som skaper klaser i stedet for løse smuler.',
      'Stek uforstyrret: Stek i 25 minutter uten å røre den.',
      'Bryt og fullfør stekingen: Bryt platen i store biter med en slikkepott, snu dem, og stek videre i 15 minutter til de er tørre og dypt gyldne.',
      'Avkjøl helt: Skyv bakepapiret over på en rist og la granolaen stå helt urørt i minst 45 minutter. Den blir sprø mens den avkjøles — å flytte den mens den er varm er den vanligste grunnen til at granola blir myk.',
      'Rør inn linfrøet: Når den er helt avkjølt, rør det malte linfrøet inn i granolaen. Å tilsette det utenfor varmen beskytter ALA-omega-3-en mot oksidasjon. Oppbevar i en lufttett krukke i opptil 2 uker.',
    ],
  },
  notes: "The two non-negotiables are pressing the slab hard and cooling it completely undisturbed. Together they're the difference between clusters and dust. Substitutions: buckwheat groats → quinoa flakes or puffed millet (slightly less crunch); Medjool dates → Deglet Noor dates plus a little extra water; cinnamon → half cardamom, half cinnamon for a Nordic profile. Serve with unsweetened soy milk and berries per bowl — this also brings vitamin C, which boosts the iron absorption from the oats.",
  no_notes: 'De to ufravikelige tingene er å presse platen hardt og avkjøle den helt urørt. Sammen er det forskjellen mellom klaser og smuler. Erstatninger: bokhvetegryn → quinoaflak eller puffet hirse (litt mindre sprøtt); Medjool-dadler → Deglet Noor-dadler pluss litt ekstra vann; kanel → halvt kardemomme, halvt kanel for et nordisk preg. Server med usøtet soyamelk og bær per porsjon — dette gir også vitamin C, som øker jernopptaket fra havren.',
  tags: ['ornish-green', 'breakfast', 'vegan', 'oil-free', 'no-added-sugar', 'high-fiber'],
  kcal: 314,
  servingWeightGrams: 92,
  nutrition: {
    perServing: {
      calories: 314, protein: 10.5, totalFat: 6.3, saturatedFat: 0.9,
      polyunsaturatedFat: 3.2, monounsaturatedFat: 1.6, omega3: 1.65, omega6: 1.52,
      cholesterol: 0, totalCarbs: 57.8, totalSugars: 17.5, addedSugar: 0, fiber: 10.0,
      calcium: 71, potassium: 472, copper: 0.48, iron: 2.8, magnesium: 144,
      manganese: 2.6, selenium: 13, phosphorus: 321, zinc: 2.4, sodium: 146,
      vitaminA: 1, vitaminB6: 0.15, vitaminB12: 0, vitaminC: 0.1, vitaminD: 0,
      vitaminE: 0.4, vitaminK: 2, folate: 36, thiamin: 0.43, riboflavin: 0.08,
      niacin: 2.1, choline: 31,
    },
  },
})

// ── assemble final recipe objects and write ─────────────────────────────
function finalize(r) {
  const out = {
    id: r.id,
    title: r.title,
    category: r.category,
    servings: r.servings,
    prepTime: r.prepTime,
    cookTime: r.cookTime,
    imageUrl: null,
    description: r.description,
    tags: r.tags,
    kcal: r.kcal,
    ingredients: r.ingredients.en,
    steps: r.steps.en,
    translations: {
      no: {
        title: r.no_title,
        description: r.no_description,
        ingredients: r.ingredients.no,
        steps: r.steps.no,
      },
    },
  }
  if (r.notes) out.notes = r.notes
  if (r.no_notes) out.translations.no.notes = r.no_notes
  if (r.servingWeightGrams) out.servingWeightGrams = r.servingWeightGrams
  if (r.nutrition) out.nutrition = r.nutrition
  if (r.relatedRecipes) out.relatedRecipes = r.relatedRecipes
  return out
}

const finalized = RECIPES.map(finalize)
const existingIds = new Set(pack.recipes.map(r => r.id))
const dupes = finalized.filter(r => existingIds.has(r.id))
if (dupes.length) throw new Error('id collision: ' + dupes.map(r => r.id).join(', '))

pack.recipes.push(...finalized)
pack.version = '1.16.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added ${finalized.length} recipes -> ${pack.recipes.length} total | pack -> ${pack.version}`)
finalized.forEach(r => console.log(`  ${r.id}  ${r.title}`))

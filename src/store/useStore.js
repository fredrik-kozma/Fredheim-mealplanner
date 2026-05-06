import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage, migrateFromLocalStorage } from './idbStorage'

// Fire-and-forget — copy any pre-IndexedDB localStorage blob over the
// first time the new app loads on an existing device, so users don't
// lose their recipes during the storage upgrade.
migrateFromLocalStorage()

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
// Meal slots and categories are stored as stable English keys.
// The UI renders them via i18n (settings.mealSlotNames / settings.categoryNames)
// so they switch language with the rest of the app.
const DEFAULT_MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner']

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function emptyWeekPlan() {
  const plan = {}
  for (const day of DAYS) {
    plan[day] = {}
    for (const slot of DEFAULT_MEAL_SLOTS) {
      plan[day][slot] = []
    }
  }
  return plan
}

const SAMPLE_RECIPES = [
  {
    id: 'sample-1',
    title: 'Overnight Oats with Chia and Berries',
    category: 'Breakfast',
    servings: 2,
    prepTime: 10,
    cookTime: 0,
    imageUrl: null,
    description: 'No-cook oats soaked overnight in oat milk with chia seeds and topped with fresh berries — a filling, fibre-rich breakfast ready when you wake up.',
    tags: ['breakfast', 'no-cook', 'high-fibre', 'healthy'],
    ingredients: [
      { quantity: 160, unit: 'g', name: 'rolled oats' },
      { quantity: 400, unit: 'ml', name: 'oat milk' },
      { quantity: 200, unit: 'g', name: 'plain Greek yogurt' },
      { quantity: 2, unit: 'tbsp', name: 'chia seeds' },
      { quantity: 2, unit: 'tbsp', name: 'maple syrup' },
      { quantity: 1, unit: 'tsp', name: 'vanilla extract' },
      { quantity: 150, unit: 'g', name: 'mixed berries (blueberries, strawberries, raspberries)' },
      { quantity: 2, unit: 'tbsp', name: 'sliced almonds' },
    ],
    steps: [
      'Combine rolled oats, oat milk, Greek yogurt, chia seeds, maple syrup, and vanilla extract in a jar or bowl.',
      'Stir well until evenly mixed. Cover and refrigerate overnight, or for at least 6 hours.',
      'In the morning, give the oats a good stir. Add a splash of milk if you prefer a looser consistency.',
      'Top with mixed berries and sliced almonds just before serving.',
    ],
    createdAt: Date.now() - 86400000 * 6,
    translations: {
      no: {
        title: 'Overnattshavregrøt med chia og bær',
        description: 'Havregryn bløtlagt over natten i havremelk med chiafrø og friske bær – en mettende, fiberrik frokost som står klar når du våkner.',
        ingredients: [
          { quantity: 160, unit: 'g', name: 'havregryn' },
          { quantity: 400, unit: 'ml', name: 'havremelk' },
          { quantity: 200, unit: 'g', name: 'gresk yoghurt naturell' },
          { quantity: 2, unit: 'ss', name: 'chiafrø' },
          { quantity: 2, unit: 'ss', name: 'lønnesirup' },
          { quantity: 1, unit: 'ts', name: 'vaniljeekstrakt' },
          { quantity: 150, unit: 'g', name: 'blandede bær (blåbær, jordbær, bringebær)' },
          { quantity: 2, unit: 'ss', name: 'hakkede mandler' },
        ],
        steps: [
          'Bland havregryn, havremelk, gresk yoghurt, chiafrø, lønnesirup og vaniljeekstrakt i en bolle eller glass.',
          'Rør godt til alt er jevnt blandet. Dekk til og sett i kjøleskap over natten, eller minst 6 timer.',
          'Om morgenen rører du godt i grøten. Ha i litt ekstra melk hvis du vil ha løsere konsistens.',
          'Topp med bær og hakkede mandler rett før servering.',
        ],
      },
    },
  },
  {
    id: 'sample-2',
    title: 'Avocado Toast with Poached Eggs',
    category: 'Breakfast',
    servings: 2,
    prepTime: 10,
    cookTime: 5,
    imageUrl: null,
    description: 'Creamy smashed avocado on toasted wholegrain bread, topped with perfectly poached eggs and chilli flakes.',
    tags: ['breakfast', 'high-protein', 'healthy-fats'],
    ingredients: [
      { quantity: 4, unit: 'pcs', name: 'thick slices wholegrain bread' },
      { quantity: 2, unit: 'pcs', name: 'ripe avocados' },
      { quantity: 4, unit: 'pcs', name: 'eggs' },
      { quantity: 1, unit: 'tbsp', name: 'white wine vinegar' },
      { quantity: 1, unit: 'pcs', name: 'lemon, juice only' },
      { quantity: 0.5, unit: 'tsp', name: 'chilli flakes' },
      { quantity: 0, unit: '', name: 'salt and black pepper' },
      { quantity: 2, unit: 'tbsp', name: 'extra-virgin olive oil' },
    ],
    steps: [
      'Toast the bread until golden and crisp.',
      'Halve the avocados, remove the stones, and scoop the flesh into a bowl. Add lemon juice and a pinch of salt. Mash roughly with a fork — keep some texture.',
      'Bring a deep pan of water to a gentle simmer and add the white wine vinegar.',
      'Crack each egg into a small cup. Create a gentle whirlpool and slide in the eggs one at a time. Poach for 3 minutes for a runny yolk.',
      'Spread the mashed avocado over the toasted bread.',
      'Lift the eggs out with a slotted spoon, drain briefly, and place on top of the avocado. Drizzle with olive oil, scatter chilli flakes, and season with black pepper.',
    ],
    createdAt: Date.now() - 86400000 * 5,
    translations: {
      no: {
        title: 'Avokadotoast med posjerte egg',
        description: 'Kremet most avokado på ristet grovbrød, toppet med perfekt posjerte egg og chiliflak.',
        ingredients: [
          { quantity: 4, unit: 'stk', name: 'tykke skiver grovbrød' },
          { quantity: 2, unit: 'stk', name: 'modne avokadoer' },
          { quantity: 4, unit: 'stk', name: 'egg' },
          { quantity: 1, unit: 'ss', name: 'hvitvinseddik' },
          { quantity: 1, unit: 'stk', name: 'sitron, kun saften' },
          { quantity: 0.5, unit: 'ts', name: 'chiliflak' },
          { quantity: 0, unit: '', name: 'salt og sort pepper' },
          { quantity: 2, unit: 'ss', name: 'ekstra virgin olivenolje' },
        ],
        steps: [
          'Rist brødet til det er gyllent og sprøtt.',
          'Del avokadoene i to, fjern steinene og ha fruktkjøttet i en bolle. Tilsett sitronsaft og en klype salt. Mos grovt med en gaffel – behold litt tekstur.',
          'Kok opp en dyp kjele med vann til det småkoker, og tilsett hvitvinseddiken.',
          'Knekk hvert egg i en liten kopp. Lag en forsiktig virvel i vannet og la eggene gli ned én etter én. Posjer i 3 minutter for rennende plomme.',
          'Fordel den moste avokadoen på det ristede brødet.',
          'Løft eggene ut med hullsleiv, la dem renne av og legg dem oppå avokadoen. Drypp over olivenolje, dryss på chiliflak og kvern over litt sort pepper.',
        ],
      },
    },
  },
  {
    id: 'sample-3',
    title: 'Red Lentil Soup',
    category: 'Lunch',
    servings: 4,
    prepTime: 10,
    cookTime: 30,
    imageUrl: null,
    description: 'A warming, protein-rich red lentil soup spiced with cumin, turmeric, and smoked paprika. Vegan, filling, and freezer-friendly.',
    tags: ['lunch', 'dinner', 'vegan', 'high-protein', 'high-fibre'],
    ingredients: [
      { quantity: 300, unit: 'g', name: 'red lentils, rinsed' },
      { quantity: 1, unit: 'pcs', name: 'large onion, diced' },
      { quantity: 3, unit: 'pcs', name: 'garlic cloves, minced' },
      { quantity: 2, unit: 'pcs', name: 'medium carrots, diced' },
      { quantity: 400, unit: 'g', name: 'canned chopped tomatoes' },
      { quantity: 1.2, unit: 'l', name: 'vegetable stock' },
      { quantity: 2, unit: 'tbsp', name: 'olive oil' },
      { quantity: 1.5, unit: 'tsp', name: 'ground cumin' },
      { quantity: 1, unit: 'tsp', name: 'ground turmeric' },
      { quantity: 1, unit: 'tsp', name: 'smoked paprika' },
      { quantity: 0, unit: '', name: 'salt and black pepper' },
      { quantity: 1, unit: 'pcs', name: 'lemon, juice only' },
      { quantity: 15, unit: 'g', name: 'fresh coriander, to garnish' },
    ],
    steps: [
      'Heat olive oil in a large pot over medium heat. Add onion and cook for 5 minutes until softened.',
      'Add garlic and carrots; cook for another 3 minutes.',
      'Stir in cumin, turmeric, paprika, and ground coriander. Cook for 1 minute until fragrant.',
      'Add lentils, canned tomatoes, and vegetable stock. Bring to the boil.',
      'Reduce heat and simmer for 20 minutes until lentils are completely soft.',
      'Use an immersion blender to blend about half the soup for a creamy but textured result.',
      'Season with salt, pepper, and a squeeze of lemon juice. Serve topped with fresh coriander.',
    ],
    createdAt: Date.now() - 86400000 * 4,
    translations: {
      no: {
        title: 'Rød linsesuppe',
        description: 'En varmende, proteinrik rød linsesuppe krydret med spisskummen, gurkemeie og røkt paprika. Vegansk, mettende og fryservennlig.',
        ingredients: [
          { quantity: 300, unit: 'g', name: 'røde linser, skylt' },
          { quantity: 1, unit: 'stk', name: 'stor løk, terninger' },
          { quantity: 3, unit: 'stk', name: 'hvitløksfedd, finhakket' },
          { quantity: 2, unit: 'stk', name: 'gulrøtter, terninger' },
          { quantity: 400, unit: 'g', name: 'hakkede tomater på boks' },
          { quantity: 1.2, unit: 'l', name: 'grønnsakskraft' },
          { quantity: 2, unit: 'ss', name: 'olivenolje' },
          { quantity: 1.5, unit: 'ts', name: 'malt spisskummen' },
          { quantity: 1, unit: 'ts', name: 'malt gurkemeie' },
          { quantity: 1, unit: 'ts', name: 'røkt paprikapulver' },
          { quantity: 0, unit: '', name: 'salt og sort pepper' },
          { quantity: 1, unit: 'stk', name: 'sitron, kun saften' },
          { quantity: 15, unit: 'g', name: 'frisk koriander, til pynt' },
        ],
        steps: [
          'Varm olivenolje i en stor gryte på middels varme. Ha i løken og surr i 5 minutter til den mykner.',
          'Tilsett hvitløk og gulrøtter, og surr i 3 minutter til.',
          'Rør inn spisskummen, gurkemeie og paprikapulver. Surr i 1 minutt til det dufter.',
          'Ha i linser, tomater og grønnsakskraft. Kok opp.',
          'Reduser varmen og la småkoke i 20 minutter til linsene er helt møre.',
          'Bruk en stavmikser til å kjøre omtrent halve suppen jevn, så blir den kremet men fortsatt med tekstur.',
          'Smak til med salt, pepper og en skvett sitronsaft. Server med frisk koriander på toppen.',
        ],
      },
    },
  },
  {
    id: 'sample-4',
    title: 'Quinoa Buddha Bowl',
    category: 'Lunch',
    servings: 2,
    prepTime: 15,
    cookTime: 20,
    imageUrl: null,
    description: 'A nourishing vegan bowl with fluffy quinoa, crispy roasted chickpeas, edamame, cucumber, and a creamy tahini-lemon dressing.',
    tags: ['lunch', 'vegan', 'high-protein', 'balanced'],
    ingredients: [
      { quantity: 200, unit: 'g', name: 'quinoa, rinsed' },
      { quantity: 400, unit: 'ml', name: 'vegetable stock' },
      { quantity: 400, unit: 'g', name: 'canned chickpeas, drained and rinsed' },
      { quantity: 1, unit: 'tbsp', name: 'olive oil' },
      { quantity: 1, unit: 'tsp', name: 'smoked paprika' },
      { quantity: 150, unit: 'g', name: 'frozen edamame, thawed' },
      { quantity: 1, unit: 'pcs', name: 'cucumber, sliced' },
      { quantity: 2, unit: 'pcs', name: 'medium carrots, grated' },
      { quantity: 60, unit: 'g', name: 'baby spinach' },
      { quantity: 3, unit: 'tbsp', name: 'tahini' },
      { quantity: 2, unit: 'tbsp', name: 'lemon juice' },
      { quantity: 4, unit: 'tbsp', name: 'water (to thin dressing)' },
      { quantity: 0, unit: '', name: 'salt and pepper' },
    ],
    steps: [
      'Preheat oven to 200°C (400°F). Toss chickpeas with olive oil, paprika, salt, and pepper. Roast for 20 minutes until crispy.',
      'Cook quinoa in stock according to package directions (about 15 minutes). Fluff with a fork.',
      'Whisk tahini, lemon juice, and water together until smooth. Season with salt.',
      'Divide quinoa between two bowls. Arrange spinach, cucumber, grated carrot, and edamame around the bowl.',
      'Top with roasted chickpeas and drizzle generously with tahini dressing.',
    ],
    createdAt: Date.now() - 86400000 * 3,
    translations: {
      no: {
        title: 'Quinoa Buddha-bolle',
        description: 'En næringsrik vegansk bolle med luftig quinoa, sprø ovnsbakte kikerter, edamame, agurk og en kremet tahini-sitrondressing.',
        ingredients: [
          { quantity: 200, unit: 'g', name: 'quinoa, skylt' },
          { quantity: 400, unit: 'ml', name: 'grønnsakskraft' },
          { quantity: 400, unit: 'g', name: 'kikerter på boks, avrent og skylt' },
          { quantity: 1, unit: 'ss', name: 'olivenolje' },
          { quantity: 1, unit: 'ts', name: 'røkt paprikapulver' },
          { quantity: 150, unit: 'g', name: 'frossen edamame, tint' },
          { quantity: 1, unit: 'stk', name: 'agurk, i skiver' },
          { quantity: 2, unit: 'stk', name: 'gulrøtter, revet' },
          { quantity: 60, unit: 'g', name: 'babyspinat' },
          { quantity: 3, unit: 'ss', name: 'tahini' },
          { quantity: 2, unit: 'ss', name: 'sitronsaft' },
          { quantity: 4, unit: 'ss', name: 'vann (til å tynne ut dressingen)' },
          { quantity: 0, unit: '', name: 'salt og pepper' },
        ],
        steps: [
          'Forvarm ovnen til 200 °C. Bland kikertene med olivenolje, paprikapulver, salt og pepper. Stek i 20 minutter til de er sprø.',
          'Kok quinoaen i kraften i henhold til pakken (ca. 15 minutter). Luft opp med en gaffel.',
          'Visp sammen tahini, sitronsaft og vann til en jevn dressing. Smak til med salt.',
          'Fordel quinoaen i to boller. Legg spinat, agurk, revet gulrot og edamame rundt.',
          'Topp med de ovnsbakte kikertene og drypp rikelig med tahinidressing over.',
        ],
      },
    },
  },
  {
    id: 'sample-5',
    title: 'Grilled Salmon with Roasted Vegetables',
    category: 'Dinner',
    servings: 2,
    prepTime: 15,
    cookTime: 25,
    imageUrl: null,
    description: 'Omega-3-rich salmon fillets roasted alongside colourful Mediterranean vegetables with a lemon-herb drizzle.',
    tags: ['dinner', 'omega-3', 'high-protein', 'gluten-free'],
    ingredients: [
      { quantity: 2, unit: 'pcs', name: 'salmon fillets (approx. 180 g each)' },
      { quantity: 1, unit: 'pcs', name: 'courgette, sliced into half-moons' },
      { quantity: 1, unit: 'pcs', name: 'red pepper, cut into chunks' },
      { quantity: 200, unit: 'g', name: 'cherry tomatoes' },
      { quantity: 1, unit: 'pcs', name: 'red onion, cut into wedges' },
      { quantity: 3, unit: 'tbsp', name: 'olive oil' },
      { quantity: 1, unit: 'tsp', name: 'dried thyme' },
      { quantity: 1, unit: 'tsp', name: 'garlic powder' },
      { quantity: 1, unit: 'pcs', name: 'lemon, zested and halved' },
      { quantity: 10, unit: 'g', name: 'fresh parsley, chopped' },
      { quantity: 0, unit: '', name: 'salt and black pepper' },
    ],
    steps: [
      'Preheat oven to 210°C (415°F).',
      'Toss courgette, pepper, cherry tomatoes, and red onion with 2 tbsp olive oil, thyme, garlic powder, salt, and pepper. Spread on a large baking tray and roast for 15 minutes.',
      'Pat the salmon fillets dry. Rub with remaining olive oil, lemon zest, salt, and pepper.',
      'Push the vegetables to the sides and place the salmon skin-side down in the centre of the tray.',
      'Roast for 10–12 minutes until the salmon flakes easily.',
      'Squeeze lemon juice over everything, scatter with fresh parsley, and serve.',
    ],
    createdAt: Date.now() - 86400000 * 2,
    translations: {
      no: {
        title: 'Ovnsbakt laks med rotgrønnsaker',
        description: 'Omega-3-rike laksefileter bakt sammen med fargerike middelhavsgrønnsaker og en sitron- og urtedressing.',
        ingredients: [
          { quantity: 2, unit: 'stk', name: 'laksefileter (ca. 180 g hver)' },
          { quantity: 1, unit: 'stk', name: 'squash, i halvmåner' },
          { quantity: 1, unit: 'stk', name: 'rød paprika, i biter' },
          { quantity: 200, unit: 'g', name: 'cherrytomater' },
          { quantity: 1, unit: 'stk', name: 'rødløk, i båter' },
          { quantity: 3, unit: 'ss', name: 'olivenolje' },
          { quantity: 1, unit: 'ts', name: 'tørket timian' },
          { quantity: 1, unit: 'ts', name: 'hvitløkspulver' },
          { quantity: 1, unit: 'stk', name: 'sitron, revet skall og delt' },
          { quantity: 10, unit: 'g', name: 'frisk persille, hakket' },
          { quantity: 0, unit: '', name: 'salt og sort pepper' },
        ],
        steps: [
          'Forvarm ovnen til 210 °C.',
          'Bland squash, paprika, cherrytomater og rødløk med 2 ss olivenolje, timian, hvitløkspulver, salt og pepper. Fordel på en stor stekebrett og stek i 15 minutter.',
          'Tørk laksefiletene. Gni dem inn med resten av oljen, sitronskall, salt og pepper.',
          'Skyv grønnsakene til siden og legg laksen med skinnsiden ned midt på brettet.',
          'Stek i 10–12 minutter til laksen flaker lett.',
          'Press sitronsaft over alt, dryss med frisk persille og server.',
        ],
      },
    },
  },
  {
    id: 'sample-6',
    title: 'Chickpea and Spinach Curry',
    category: 'Dinner',
    servings: 4,
    prepTime: 10,
    cookTime: 25,
    imageUrl: null,
    description: 'A hearty plant-based curry simmered in a fragrant tomato and coconut sauce. High in plant protein and iron, ready in 35 minutes.',
    tags: ['dinner', 'vegan', 'high-protein', 'one-pot'],
    ingredients: [
      { quantity: 2, unit: 'pcs', name: 'cans chickpeas (400 g each), drained' },
      { quantity: 200, unit: 'g', name: 'baby spinach' },
      { quantity: 1, unit: 'pcs', name: 'large onion, diced' },
      { quantity: 3, unit: 'pcs', name: 'garlic cloves, minced' },
      { quantity: 1, unit: 'pcs', name: 'thumb-sized piece of ginger, grated' },
      { quantity: 400, unit: 'g', name: 'canned chopped tomatoes' },
      { quantity: 400, unit: 'ml', name: 'coconut milk (light)' },
      { quantity: 2, unit: 'tbsp', name: 'vegetable oil' },
      { quantity: 2, unit: 'tsp', name: 'garam masala' },
      { quantity: 1, unit: 'tsp', name: 'ground cumin' },
      { quantity: 1, unit: 'tsp', name: 'ground turmeric' },
      { quantity: 0, unit: '', name: 'salt and pepper' },
      { quantity: 400, unit: 'g', name: 'cooked basmati rice, to serve' },
    ],
    steps: [
      'Heat oil in a large pan over medium heat. Fry onion for 6 minutes until golden.',
      'Add garlic and ginger; cook for 1 minute. Stir in garam masala, cumin, and turmeric. Cook for 1 minute until fragrant.',
      'Pour in tomatoes and coconut milk. Stir to combine and bring to a simmer.',
      'Add chickpeas and simmer for 15 minutes until the sauce thickens.',
      'Stir in the spinach and cook for 2 minutes until wilted. Season with salt and pepper.',
      'Serve with basmati rice.',
    ],
    createdAt: Date.now() - 86400000,
    translations: {
      no: {
        title: 'Kikert- og spinatkarri',
        description: 'En mektig plantebasert karri som putrer i en velduftende tomat- og kokossaus. Rik på plantebasert protein og jern, klar på 35 minutter.',
        ingredients: [
          { quantity: 2, unit: 'stk', name: 'bokser kikerter (400 g hver), avrent' },
          { quantity: 200, unit: 'g', name: 'babyspinat' },
          { quantity: 1, unit: 'stk', name: 'stor løk, terninger' },
          { quantity: 3, unit: 'stk', name: 'hvitløksfedd, finhakket' },
          { quantity: 1, unit: 'stk', name: 'tommelstor bit ingefær, revet' },
          { quantity: 400, unit: 'g', name: 'hakkede tomater på boks' },
          { quantity: 400, unit: 'ml', name: 'kokosmelk (light)' },
          { quantity: 2, unit: 'ss', name: 'matolje' },
          { quantity: 2, unit: 'ts', name: 'garam masala' },
          { quantity: 1, unit: 'ts', name: 'malt spisskummen' },
          { quantity: 1, unit: 'ts', name: 'malt gurkemeie' },
          { quantity: 0, unit: '', name: 'salt og pepper' },
          { quantity: 400, unit: 'g', name: 'kokt basmatiris, til servering' },
        ],
        steps: [
          'Varm oljen i en stor panne på middels varme. Stek løken i 6 minutter til den er gyllen.',
          'Tilsett hvitløk og ingefær, og stek i 1 minutt. Rør inn garam masala, spisskummen og gurkemeie. Stek i 1 minutt til det dufter.',
          'Hell i tomater og kokosmelk. Rør sammen og kok opp.',
          'Ha i kikertene og la det småkoke i 15 minutter til sausen tykner.',
          'Rør inn spinaten og la det koke i 2 minutter til den faller sammen. Smak til med salt og pepper.',
          'Server med basmatiris.',
        ],
      },
    },
  },
  {
    id: 'sample-7',
    title: 'Turkey and Vegetable Stir-Fry',
    category: 'Dinner',
    servings: 4,
    prepTime: 15,
    cookTime: 15,
    imageUrl: null,
    description: 'Lean turkey mince stir-fried with colourful vegetables in a ginger-soy-sesame sauce. Serve over brown rice for a balanced weeknight dinner.',
    tags: ['dinner', 'high-protein', 'lean', 'quick'],
    ingredients: [
      { quantity: 500, unit: 'g', name: 'turkey mince' },
      { quantity: 1, unit: 'pcs', name: 'large red pepper, thinly sliced' },
      { quantity: 200, unit: 'g', name: 'broccoli florets' },
      { quantity: 150, unit: 'g', name: 'sugar snap peas' },
      { quantity: 3, unit: 'pcs', name: 'spring onions, sliced' },
      { quantity: 3, unit: 'pcs', name: 'garlic cloves, minced' },
      { quantity: 1, unit: 'pcs', name: 'thumb-sized piece of ginger, grated' },
      { quantity: 3, unit: 'tbsp', name: 'low-sodium soy sauce' },
      { quantity: 1, unit: 'tbsp', name: 'sesame oil' },
      { quantity: 1, unit: 'tsp', name: 'honey' },
      { quantity: 2, unit: 'tbsp', name: 'vegetable oil' },
      { quantity: 400, unit: 'g', name: 'cooked brown rice, to serve' },
    ],
    steps: [
      'Mix soy sauce, sesame oil, and honey in a small bowl. Set aside.',
      'Heat vegetable oil in a wok or large frying pan over high heat. Add turkey mince and stir-fry for 5–6 minutes, breaking it up, until browned.',
      'Add garlic and ginger; stir-fry for 30 seconds.',
      'Add broccoli and pepper; stir-fry for 3 minutes.',
      'Add sugar snap peas and pour over the sauce. Toss everything together and cook for 2 minutes.',
      'Serve over brown rice, garnished with spring onions.',
    ],
    createdAt: Date.now() - 3600000 * 12,
    translations: {
      no: {
        title: 'Wok med kalkunkjøttdeig og grønnsaker',
        description: 'Mager kalkunkjøttdeig wokket med fargerike grønnsaker i en ingefær-soya-sesamsaus. Serveres over brun ris for en balansert hverdagsmiddag.',
        ingredients: [
          { quantity: 500, unit: 'g', name: 'kalkunkjøttdeig' },
          { quantity: 1, unit: 'stk', name: 'stor rød paprika, i tynne skiver' },
          { quantity: 200, unit: 'g', name: 'brokkolibuketter' },
          { quantity: 150, unit: 'g', name: 'sukkererter' },
          { quantity: 3, unit: 'stk', name: 'vårløk, i skiver' },
          { quantity: 3, unit: 'stk', name: 'hvitløksfedd, finhakket' },
          { quantity: 1, unit: 'stk', name: 'tommelstor bit ingefær, revet' },
          { quantity: 3, unit: 'ss', name: 'soyasaus (lav-salt)' },
          { quantity: 1, unit: 'ss', name: 'sesamolje' },
          { quantity: 1, unit: 'ts', name: 'honning' },
          { quantity: 2, unit: 'ss', name: 'matolje' },
          { quantity: 400, unit: 'g', name: 'kokt brun ris, til servering' },
        ],
        steps: [
          'Bland soyasaus, sesamolje og honning i en liten bolle. Sett til side.',
          'Varm matoljen i en wok eller stor stekepanne på høy varme. Ha i kjøttdeigen og wok i 5–6 minutter mens du deler den opp, til den er brunet.',
          'Tilsett hvitløk og ingefær, og wok i 30 sekunder.',
          'Ha i brokkoli og paprika, og wok i 3 minutter.',
          'Tilsett sukkerertene og hell over sausen. Bland alt godt og la det koke i 2 minutter.',
          'Server over brun ris, toppet med vårløk.',
        ],
      },
    },
  },
  {
    id: 'sample-8',
    title: 'Shakshuka',
    category: 'Breakfast',
    servings: 2,
    prepTime: 10,
    cookTime: 20,
    imageUrl: null,
    description: 'Eggs poached in a spiced tomato and pepper sauce — a classic one-pan breakfast or brunch that is as nutritious as it is satisfying.',
    tags: ['breakfast', 'brunch', 'vegetarian', 'one-pan'],
    ingredients: [
      { quantity: 4, unit: 'pcs', name: 'eggs' },
      { quantity: 400, unit: 'g', name: 'canned chopped tomatoes' },
      { quantity: 1, unit: 'pcs', name: 'red pepper, diced' },
      { quantity: 1, unit: 'pcs', name: 'medium onion, diced' },
      { quantity: 3, unit: 'pcs', name: 'garlic cloves, minced' },
      { quantity: 2, unit: 'tbsp', name: 'olive oil' },
      { quantity: 1, unit: 'tsp', name: 'ground cumin' },
      { quantity: 1, unit: 'tsp', name: 'smoked paprika' },
      { quantity: 0.25, unit: 'tsp', name: 'cayenne pepper' },
      { quantity: 0, unit: '', name: 'salt and pepper' },
      { quantity: 20, unit: 'g', name: 'feta cheese, crumbled (optional)' },
      { quantity: 10, unit: 'g', name: 'fresh parsley, to garnish' },
    ],
    steps: [
      'Heat olive oil in a wide frying pan over medium heat. Add onion and pepper; cook for 7 minutes until softened.',
      'Add garlic, cumin, paprika, and cayenne. Cook for 1 minute.',
      'Pour in the tomatoes. Season with salt and pepper. Simmer for 8 minutes until the sauce thickens.',
      'Make 4 wells in the sauce using the back of a spoon. Crack an egg into each well.',
      'Cover the pan and cook for 5–7 minutes until the egg whites are set but yolks are still runny.',
      'Scatter with feta (if using) and fresh parsley. Serve straight from the pan with crusty bread.',
    ],
    createdAt: Date.now(),
    translations: {
      no: {
        title: 'Shakshuka',
        description: 'Egg posjert i en krydret tomat- og paprikasaus – en klassisk frokost eller brunsj laget i én panne, like næringsrik som mettende.',
        ingredients: [
          { quantity: 4, unit: 'stk', name: 'egg' },
          { quantity: 400, unit: 'g', name: 'hakkede tomater på boks' },
          { quantity: 1, unit: 'stk', name: 'rød paprika, terninger' },
          { quantity: 1, unit: 'stk', name: 'middels løk, terninger' },
          { quantity: 3, unit: 'stk', name: 'hvitløksfedd, finhakket' },
          { quantity: 2, unit: 'ss', name: 'olivenolje' },
          { quantity: 1, unit: 'ts', name: 'malt spisskummen' },
          { quantity: 1, unit: 'ts', name: 'røkt paprikapulver' },
          { quantity: 0.25, unit: 'ts', name: 'cayennepepper' },
          { quantity: 0, unit: '', name: 'salt og pepper' },
          { quantity: 20, unit: 'g', name: 'fetaost, smuldret (valgfritt)' },
          { quantity: 10, unit: 'g', name: 'frisk persille, til pynt' },
        ],
        steps: [
          'Varm olivenoljen i en bred stekepanne på middels varme. Ha i løk og paprika, og surr i 7 minutter til det mykner.',
          'Tilsett hvitløk, spisskummen, paprikapulver og cayenne. Surr i 1 minutt.',
          'Hell i tomatene. Smak til med salt og pepper. La småkoke i 8 minutter til sausen tykner.',
          'Lag 4 groper i sausen med baksiden av en skje. Knekk et egg i hver grop.',
          'Legg lokk på pannen og la det stå i 5–7 minutter til eggehvitene har stivnet, men plommene fortsatt er rennende.',
          'Dryss over fetaost (hvis du bruker det) og frisk persille. Server rett fra pannen med grovt brød.',
        ],
      },
    },
  },
]

const DEFAULT_WEEK_PLAN = emptyWeekPlan()

const useStore = create(
  persist(
    (set, get) => ({
      // ── Last opened recipe ──
      lastOpenedRecipeId: null,
      setLastOpenedRecipeId: (id) => set({ lastOpenedRecipeId: id }),

      // Remembers whichever recipes sub-page the user was last on.
      // Used by the "Recipes" nav button to return to that exact view.
      // Examples: '/', '/recipes/123', '/recipes/123/edit', '/recipes/new'
      lastRecipesPath: '/',
      setLastRecipesPath: (path) => set({ lastRecipesPath: path }),

      // ── Recipes ──
      recipes: [],

      addRecipe: (recipe) => set((s) => ({
        recipes: [...s.recipes, { ...recipe, id: makeId(), createdAt: Date.now(), translations: recipe.translations || {} }],
      })),

      updateRecipe: (id, updates) => set((s) => ({
        recipes: s.recipes.map(r => r.id === id ? { ...r, ...updates } : r),
      })),

      deleteRecipe: (id) => set((s) => {
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          newPlan[day] = {}
          for (const [slot, ids] of Object.entries(slots)) {
            newPlan[day][slot] = ids.filter(rid => rid !== id)
          }
        }
        return {
          recipes: s.recipes.filter(r => r.id !== id),
          weekPlan: newPlan,
        }
      }),

      deleteAllRecipes: () => set(() => ({
        recipes: [],
        weekPlan: emptyWeekPlan(),
        installedPacks: {},
      })),

      updateRecipeTranslation: (recipeId, lang, translatedFields) => set((s) => ({
        recipes: s.recipes.map(r =>
          r.id === recipeId
            ? { ...r, translations: { ...(r.translations || {}), [lang]: translatedFields } }
            : r
        ),
      })),

      // ── Recipe Categories ──
      // Categories are stored as stable English keys. Their display name is
      // looked up through i18n (categories.<Key>) so they switch with the UI
      // language. Users can still add custom categories — those render as-is.
      recipeCategories: ['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Bread', 'Porridge', 'Spreads', 'Snack', 'Dessert', 'Soup', 'Salad', 'Sauce', 'Other'],

      addRecipeCategory: (name) => set((s) => ({
        recipeCategories: s.recipeCategories.includes(name) ? s.recipeCategories : [...s.recipeCategories, name],
      })),

      removeRecipeCategory: (name) => set((s) => ({
        recipeCategories: s.recipeCategories.filter(c => c !== name),
      })),

      // ── Meal Slots ──
      mealSlots: DEFAULT_MEAL_SLOTS,

      addMealSlot: (name) => set((s) => {
        if (s.mealSlots.includes(name)) return {}
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          newPlan[day] = { ...slots, [name]: [] }
        }
        return { mealSlots: [...s.mealSlots, name], weekPlan: newPlan }
      }),

      removeMealSlot: (name) => set((s) => {
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          const { [name]: _removed, ...rest } = slots
          newPlan[day] = rest
        }
        return {
          mealSlots: s.mealSlots.filter(m => m !== name),
          weekPlan: newPlan,
        }
      }),

      renameMealSlot: (oldName, newName) => set((s) => {
        const newPlan = {}
        for (const [day, slots] of Object.entries(s.weekPlan)) {
          newPlan[day] = {}
          for (const [slot, ids] of Object.entries(slots)) {
            newPlan[day][slot === oldName ? newName : slot] = ids
          }
        }
        return {
          mealSlots: s.mealSlots.map(m => m === oldName ? newName : m),
          weekPlan: newPlan,
        }
      }),

      // ── Week Plan ──
      weekPlan: DEFAULT_WEEK_PLAN,

      addRecipeToSlot: (day, slot, recipeId) => set((s) => {
        const current = s.weekPlan[day]?.[slot] || []
        if (current.includes(recipeId)) return {}
        return {
          weekPlan: {
            ...s.weekPlan,
            [day]: {
              ...s.weekPlan[day],
              [slot]: [...current, recipeId],
            },
          },
        }
      }),

      removeRecipeFromSlot: (day, slot, recipeId) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).filter(id => id !== recipeId),
          },
        },
      })),

      moveRecipeBetweenSlots: (fromDay, fromSlot, toDay, toSlot, recipeId) => set((s) => {
        const fromIds = (s.weekPlan[fromDay]?.[fromSlot] || []).filter(id => id !== recipeId)
        const toIds = s.weekPlan[toDay]?.[toSlot] || []
        if (toIds.includes(recipeId)) return {}
        return {
          weekPlan: {
            ...s.weekPlan,
            [fromDay]: { ...s.weekPlan[fromDay], [fromSlot]: fromIds },
            [toDay]: { ...s.weekPlan[toDay], [toSlot]: [...toIds, recipeId] },
          },
        }
      }),

      clearWeekPlan: () => set((s) => ({ weekPlan: emptyWeekPlan() })),

      // ── Settings ──
      // Default language is Norwegian, but the Settings page allows switching
      // to English or Swedish. All UI strings translate via i18n, and recipe
      // content falls back through `recipe.translations[lang]` when available.
      language: 'no',
      setLanguage: (lang) => set({ language: lang }),

      familySize: 4,
      setFamilySize: (n) => set({ familySize: n }),

      // 'metric' | 'us' — drives the preferred unit group in the recipe-form
      // dropdown and the metric ⇄ US conversion on the recipe view.
      units: 'metric',
      setUnits: (u) => set({ units: u }),

      // User-added unit labels. Plain strings (e.g. 'jar', 'sprig'). They
      // appear as extra options in the ingredient unit dropdown, stored as-is
      // (no conversion — just passthrough display).
      customUnits: [],
      addCustomUnit: (unit) => set((s) => {
        const clean = String(unit || '').trim()
        if (!clean) return {}
        if (s.customUnits.includes(clean)) return {}
        return { customUnits: [...s.customUnits, clean] }
      }),
      removeCustomUnit: (unit) => set((s) => ({
        customUnits: s.customUnits.filter(u => u !== unit),
      })),

      // ── Shopping List checked state ──
      checkedItems: {},
      toggleCheckedItem: (key) => set((s) => ({
        checkedItems: { ...s.checkedItems, [key]: !s.checkedItems[key] },
      })),
      clearCheckedItems: () => set({ checkedItems: {} }),

      // ── Saved Shopping Lists ──
      savedShoppingLists: [],

      saveShoppingList: (name, items) => set((s) => ({
        savedShoppingLists: [
          ...s.savedShoppingLists,
          {
            id: makeId(),
            name,
            savedAt: Date.now(),
            items,
            weekPlanSnapshot: s.weekPlan,
          },
        ],
      })),

      deleteSavedShoppingList: (id) => set((s) => ({
        savedShoppingLists: s.savedShoppingLists.filter(l => l.id !== id),
      })),

      loadSavedShoppingList: (id) => {
        const s = get()
        return s.savedShoppingLists.find(l => l.id === id) || null
      },

      // ── Planner Templates ──
      plannerTemplates: [],

      savePlannerTemplate: (name) => set((s) => {
        // Count total meals in current plan
        let mealCount = 0
        for (const day of Object.values(s.weekPlan)) {
          for (const slotRecipes of Object.values(day)) {
            mealCount += slotRecipes.length
          }
        }
        return {
          plannerTemplates: [
            ...s.plannerTemplates,
            {
              id: makeId(),
              name,
              savedAt: Date.now(),
              plan: JSON.parse(JSON.stringify(s.weekPlan)),
              mealCount,
            },
          ],
        }
      }),

      loadPlannerTemplate: (id) => set((s) => {
        const template = s.plannerTemplates.find(t => t.id === id)
        if (!template) return {}
        return { weekPlan: JSON.parse(JSON.stringify(template.plan)) }
      }),

      deletePlannerTemplate: (id) => set((s) => ({
        plannerTemplates: s.plannerTemplates.filter(t => t.id !== id),
      })),

      // ── Recipe Packs ──
      installedPacks: {},

      installPack: (pack) => set((s) => {
        const existingIds = new Set(s.recipes.map(r => r.id))
        const newRecipes = pack.recipes.filter(r => !existingIds.has(r.id)).map(r => ({
          ...r,
          createdAt: r.createdAt || Date.now(),
          translations: r.translations || {},
        }))
        const allRecipeIds = pack.recipes.map(r => r.id)
        return {
          recipes: [...s.recipes, ...newRecipes],
          installedPacks: {
            ...s.installedPacks,
            [pack.id]: {
              version: pack.version,
              installedAt: Date.now(),
              recipeIds: allRecipeIds,
            },
          },
        }
      }),

      isPackInstalled: (packId) => {
        const s = get()
        return Boolean(s.installedPacks[packId])
      },

      getInstalledPackVersion: (packId) => {
        const s = get()
        return s.installedPacks[packId]?.version ?? null
      },
    }),
    {
      name: 'menu-planner-store',
      // IndexedDB-backed (via idb-keyval) instead of the default
      // localStorage. Gives us ~50% of free disk (GBs) instead of ~5 MB.
      storage: createJSONStorage(() => idbStorage),
      version: 4,
      migrate: (persistedState, version) => {
        if (version < 2) {
          if (persistedState.recipes) {
            persistedState.recipes = persistedState.recipes.map(r => ({
              ...r,
              translations: r.translations || {},
            }))
          }
          persistedState.language = persistedState.language || 'no'
          persistedState.savedShoppingLists = persistedState.savedShoppingLists || []
          persistedState.plannerTemplates = persistedState.plannerTemplates || []
        }
        // Versions 3 and 4 share a single migration that restores stable
        // English canonical keys for meal slots and categories. v3 wrote
        // Norwegian strings directly; v4 reverses that so the language
        // switcher can drive display-time translation.
        if (version < 4) {
          const SLOT_TO_EN = {
            Frokost: 'Breakfast',
            Lunsj: 'Lunch',
            Middag: 'Dinner',
            Kveldsmat: 'Supper',
            Mellommåltid: 'Snack',
          }
          const CAT_TO_EN = {
            Frokost: 'Breakfast',
            Lunsj: 'Lunch',
            Middag: 'Dinner',
            Kveldsmat: 'Supper',
            Brød: 'Bread',
            Grøt: 'Porridge',
            Pålegg: 'Spreads',
            Mellommåltid: 'Snack',
            Dessert: 'Dessert',
            Suppe: 'Soup',
            Salat: 'Salad',
            Saus: 'Sauce',
            Annet: 'Other',
            Main: 'Dinner',
          }
          persistedState.language = persistedState.language || 'no'
          if (Array.isArray(persistedState.mealSlots)) {
            persistedState.mealSlots = persistedState.mealSlots.map(s => SLOT_TO_EN[s] || s)
          }
          if (Array.isArray(persistedState.recipeCategories)) {
            persistedState.recipeCategories = persistedState.recipeCategories.map(c => CAT_TO_EN[c] || c)
          }
          if (Array.isArray(persistedState.recipes)) {
            persistedState.recipes = persistedState.recipes.map(r => ({
              ...r,
              category: CAT_TO_EN[r.category] || r.category,
            }))
          }
          if (persistedState.weekPlan) {
            const newPlan = {}
            for (const [day, slots] of Object.entries(persistedState.weekPlan)) {
              newPlan[day] = {}
              for (const [slot, ids] of Object.entries(slots || {})) {
                newPlan[day][SLOT_TO_EN[slot] || slot] = ids
              }
            }
            persistedState.weekPlan = newPlan
          }
        }
        return persistedState
      },
    }
  )
)

export default useStore
export { DAYS, DEFAULT_MEAL_SLOTS }

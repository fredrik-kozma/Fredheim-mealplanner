import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage, migrateFromLocalStorage } from './idbStorage'
import { STARTER_PLANS } from '../data/starterPlans'

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

// Build the full ordered list of day keys for a plan: the seven named
// days plus any extra ones (extra-1, extra-2, …). The plan object itself
// is the source of truth for which extras exist.
export function getPlanDayKeys(plan) {
  if (!plan) return [...DAYS]
  const extras = Object.keys(plan)
    .filter(k => k.startsWith('extra-'))
    .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
  return [...DAYS, ...extras]
}

// Items in a slot are stored as { recipeId, servings? }. `servings === null`
// (or missing) means "use the household default" set in Settings; a number
// overrides it for that specific slot. This helper accepts either the old
// string-only shape or the new object shape and normalizes it.
// A planned meal. `excludeFromShopping` marks a meal whose ingredients are
// already covered — typically something batch-cooked earlier in the week, or
// leftovers — so it still shows in the plan but buys nothing.
//
// Normalizing here (rather than at each call site) is what keeps the flag
// alive across servings edits and drag-and-drop, since those actions rebuild
// items from this function's output.
export function normalizeSlotItem(item) {
  if (typeof item === 'string') return { recipeId: item, servings: null, excludeFromShopping: false }
  if (item && typeof item === 'object' && item.recipeId) {
    return {
      recipeId: item.recipeId,
      servings: item.servings ?? null,
      excludeFromShopping: Boolean(item.excludeFromShopping),
    }
  }
  return null
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

// Free-text notes that travel with the week: one "smart tips" note for the
// whole week (batch-prep guidance like "bake the bread Monday — it covers
// the week") plus an optional short note per day.
//
// Deliberately a sibling of weekPlan rather than a key inside it: weekPlan
// is walked as day → slot → items to derive the day columns and count
// meals, so any non-day key living in there would be read as a day.
function emptyWeekNotes() {
  return { week: '', days: {} }
}

// Accepts anything (a persisted value, an uploaded file's field, undefined)
// and returns a well-formed notes object. Keeps the rest of the app free of
// defensive checks.
function normalizeWeekNotes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyWeekNotes()
  const days = {}
  if (raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days)) {
    for (const [day, text] of Object.entries(raw.days)) {
      if (typeof text === 'string' && text.trim()) days[day] = text
    }
  }
  return { week: typeof raw.week === 'string' ? raw.week : '', days }
}

// True when a notes object carries anything worth saving/showing.
export function weekNotesHaveContent(notes) {
  const n = normalizeWeekNotes(notes)
  return Boolean(n.week.trim() || Object.keys(n.days).length)
}

// ── Scaling a whole week to a different number of people ──────────────────
//
// Items left at the default carry `servings: null` and already follow the
// household size, so they need no rewriting. Only the *tweaked* ones hold a
// fixed number, and those are what would otherwise be stranded when the week
// is cooked for a different crowd — so scaling multiplies exactly those.
function scaleServingsValue(value, ratio) {
  if (value == null) return null
  return Math.max(1, Math.round(value * ratio))
}

function scalePlanServings(plan, ratio) {
  const out = {}
  for (const [day, slots] of Object.entries(plan || {})) {
    out[day] = {}
    for (const [slot, items] of Object.entries(slots || {})) {
      out[day][slot] = (items || []).map(it => {
        const n = normalizeSlotItem(it)
        if (!n) return it
        return { ...n, servings: scaleServingsValue(n.servings, ratio) }
      })
    }
  }
  return out
}

function scaleBatchServings(batch, ratio) {
  return (batch || []).map(b =>
    b && b.kind === 'recipe' ? { ...b, servings: scaleServingsValue(b.servings, ratio) } : b
  )
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
      recipeCategories: ['Breakfast', 'Lunch', 'Main', 'Side', 'Salad', 'Soup', 'Sauce', 'Spreads', 'Bread', 'Dessert', 'Snack', 'Drink', 'Jam', 'Other'],

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

      // ── Week notes ──
      // Saved, loaded and exported alongside weekPlan (see
      // savePlannerTemplate / loadPlannerTemplate / installStarterPlan).
      weekNotes: emptyWeekNotes(),

      // Id of the shipped STARTER_PLANS entry the current week notes were
      // last loaded from, or null. Lets setLanguage() re-fetch the notes
      // in the new language — but only while they still read exactly as
      // installed; the moment the user edits them (setWeekNote) they're
      // the user's own text and stop following the language switch.
      activeStarterPlanId: null,

      setWeekNote: (text) => set((s) => ({
        weekNotes: { ...normalizeWeekNotes(s.weekNotes), week: text },
        activeStarterPlanId: null,
      })),

      setDayNote: (day, text) => set((s) => {
        const notes = normalizeWeekNotes(s.weekNotes)
        const days = { ...notes.days }
        // An emptied note is removed rather than stored blank, so
        // weekNotesHaveContent stays accurate and exports stay tidy.
        if (text && text.trim()) days[day] = text
        else delete days[day]
        return { weekNotes: { ...notes, days } }
      }),

      clearWeekNotes: () => set({ weekNotes: emptyWeekNotes(), activeStarterPlanId: null }),

      // ── Batch cooking ──
      // Things prepped once for the whole week (bouillon, bread, spreads).
      // Recipe entries feed the shopping list; text entries are plain
      // reminders that buy nothing. Like weekNotes, this is a sibling of
      // weekPlan rather than a key inside it.
      batchCook: [],

      addBatchRecipe: (recipeId, servings = null) => set((s) => {
        if (s.batchCook.some(b => b.kind === 'recipe' && b.recipeId === recipeId)) return {}
        return { batchCook: [...s.batchCook, { id: makeId(), kind: 'recipe', recipeId, servings }] }
      }),

      addBatchText: (text) => set((s) => {
        const clean = (text || '').trim()
        if (!clean) return {}
        return { batchCook: [...s.batchCook, { id: makeId(), kind: 'text', text: clean }] }
      }),

      updateBatchText: (id, text) => set((s) => ({
        batchCook: s.batchCook.map(b => (b.id === id ? { ...b, text: (text || '').trim() } : b)),
      })),

      setBatchServings: (id, servings) => set((s) => ({
        batchCook: s.batchCook.map(b =>
          b.id === id ? { ...b, servings: servings == null ? null : Math.max(1, Math.floor(servings)) } : b
        ),
      })),

      removeBatchItem: (id) => set((s) => ({ batchCook: s.batchCook.filter(b => b.id !== id) })),

      clearBatchCook: () => set({ batchCook: [] }),

      // ── Nutrition log ──
      // What the user actually ate, keyed by local date 'YYYY-MM-DD':
      //   { [date]: [ { id, recipeId, portions } ] }
      // Portions are servings of that recipe eaten (halves allowed), so a
      // day's total nutrition is Σ recipe.perServing × portions. Kept as its
      // own map, independent of the planner — logging what you ate is a
      // separate act from planning what you'll cook.
      nutritionLog: {},

      addNutritionEntry: (date, recipeId, portions = 1) => set((s) => {
        const day = s.nutritionLog[date] || []
        // If the same recipe is already logged that day, bump its portions
        // rather than adding a duplicate row.
        const existing = day.find(e => e.recipeId === recipeId)
        const nextDay = existing
          ? day.map(e => e.recipeId === recipeId
            ? { ...e, portions: Math.round((e.portions + portions) * 2) / 2 }
            : e)
          : [...day, { id: makeId(), recipeId, portions }]
        return { nutritionLog: { ...s.nutritionLog, [date]: nextDay } }
      }),

      setNutritionPortions: (date, entryId, portions) => set((s) => {
        const clean = Math.max(0.5, Math.round(portions * 2) / 2)
        return {
          nutritionLog: {
            ...s.nutritionLog,
            [date]: (s.nutritionLog[date] || []).map(e =>
              e.id === entryId ? { ...e, portions: clean } : e),
          },
        }
      }),

      removeNutritionEntry: (date, entryId) => set((s) => {
        const nextDay = (s.nutritionLog[date] || []).filter(e => e.id !== entryId)
        const next = { ...s.nutritionLog }
        // Drop the date key entirely once its last entry is gone, keeping the
        // map tidy (and "which days have data" a simple key check).
        if (nextDay.length) next[date] = nextDay
        else delete next[date]
        return { nutritionLog: next }
      }),

      clearNutritionDay: (date) => set((s) => {
        const next = { ...s.nutritionLog }
        delete next[date]
        return { nutritionLog: next }
      }),

      // ── Ingredient checklist ──
      // Cooking-progress ticks, keyed by recipe id → { [ingredientIndex]: true }.
      // Indexed by position so a tick survives language switches and serving
      // scaling (which change the text/amounts but not the order). Persisted so
      // progress isn't lost if you navigate away mid-cook; easily reset.
      checkedIngredients: {},

      toggleIngredientChecked: (recipeId, index) => set((s) => {
        const forRecipe = { ...(s.checkedIngredients[recipeId] || {}) }
        if (forRecipe[index]) delete forRecipe[index]
        else forRecipe[index] = true
        const next = { ...s.checkedIngredients }
        if (Object.keys(forRecipe).length) next[recipeId] = forRecipe
        else delete next[recipeId] // drop empty maps so "any checked?" stays a simple check
        return { checkedIngredients: next }
      }),

      clearCheckedIngredients: (recipeId) => set((s) => {
        if (!s.checkedIngredients[recipeId]) return {}
        const next = { ...s.checkedIngredients }
        delete next[recipeId]
        return { checkedIngredients: next }
      }),

      addRecipeToSlot: (day, slot, recipeId, servings = null) => set((s) => {
        const current = s.weekPlan[day]?.[slot] || []
        if (current.some(it => normalizeSlotItem(it)?.recipeId === recipeId)) return {}
        return {
          weekPlan: {
            ...s.weekPlan,
            [day]: {
              ...s.weekPlan[day],
              [slot]: [...current, { recipeId, servings }],
            },
          },
        }
      }),

      removeRecipeFromSlot: (day, slot, recipeId) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).filter(it => normalizeSlotItem(it)?.recipeId !== recipeId),
          },
        },
      })),

      moveRecipeBetweenSlots: (fromDay, fromSlot, toDay, toSlot, recipeId) => set((s) => {
        const fromList = s.weekPlan[fromDay]?.[fromSlot] || []
        const moved = fromList
          .map(normalizeSlotItem)
          .find(it => it?.recipeId === recipeId)
        if (!moved) return {}
        const fromAfter = fromList.filter(it => normalizeSlotItem(it)?.recipeId !== recipeId)
        const toList = s.weekPlan[toDay]?.[toSlot] || []
        if (toList.some(it => normalizeSlotItem(it)?.recipeId === recipeId)) {
          // Already in destination — just remove from source
          return {
            weekPlan: {
              ...s.weekPlan,
              [fromDay]: { ...s.weekPlan[fromDay], [fromSlot]: fromAfter },
            },
          }
        }
        return {
          weekPlan: {
            ...s.weekPlan,
            [fromDay]: { ...s.weekPlan[fromDay], [fromSlot]: fromAfter },
            [toDay]: { ...s.weekPlan[toDay], [toSlot]: [...toList, moved] },
          },
        }
      }),

      // Set or clear the per-slot servings override for one recipe instance.
      // Pass `servings = null` to reset back to the household default.
      setSlotItemServings: (day, slot, recipeId, servings) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).map(it => {
              const n = normalizeSlotItem(it)
              if (!n || n.recipeId !== recipeId) return it
              return { ...n, servings: servings == null ? null : Math.max(1, Math.floor(servings)) }
            }),
          },
        },
      })),

      // Flip whether one planned meal contributes to the shopping list.
      // Used for meals covered by the week's batch cooking (or leftovers):
      // they stay visible in the plan but stop buying ingredients.
      toggleSlotItemShopping: (day, slot, recipeId) => set((s) => ({
        weekPlan: {
          ...s.weekPlan,
          [day]: {
            ...s.weekPlan[day],
            [slot]: (s.weekPlan[day]?.[slot] || []).map(it => {
              const n = normalizeSlotItem(it)
              if (!n || n.recipeId !== recipeId) return it
              return { ...n, excludeFromShopping: !n.excludeFromShopping }
            }),
          },
        },
      })),

      // Append an empty extra day (extra-1, extra-2, …) to the plan.
      addPlannerDay: () => set((s) => {
        const existingExtras = Object.keys(s.weekPlan)
          .filter(k => k.startsWith('extra-'))
          .map(k => Number(k.slice(6)))
        const nextN = (existingExtras.length ? Math.max(...existingExtras) : 0) + 1
        const newDayKey = `extra-${nextN}`
        const slots = {}
        for (const slot of s.mealSlots) slots[slot] = []
        return {
          weekPlan: { ...s.weekPlan, [newDayKey]: slots },
        }
      }),

      // Remove an extra day (only `extra-*` keys can be removed; the seven
      // named days are permanent).
      removePlannerDay: (dayKey) => set((s) => {
        if (!dayKey?.startsWith('extra-')) return {}
        const { [dayKey]: _removed, ...rest } = s.weekPlan
        // Drop that day's note too — otherwise it would linger unseen and
        // reappear in exports for a day that no longer exists.
        const notes = normalizeWeekNotes(s.weekNotes)
        const { [dayKey]: _removedNote, ...restDays } = notes.days
        return { weekPlan: rest, weekNotes: { ...notes, days: restDays } }
      }),

      // Clearing the week clears its notes too — they describe that week's
      // prep, so leaving them behind on a fresh week would be misleading.
      clearWeekPlan: () => set((s) => ({
        weekPlan: emptyWeekPlan(),
        weekNotes: emptyWeekNotes(),
        batchCook: [],
        activeStarterPlanId: null,
      })),

      // ── Settings ──
      // Default language is Norwegian, but the Settings page allows switching
      // to English or Swedish. All UI strings translate via i18n, and recipe
      // content falls back through `recipe.translations[lang]` when available.
      language: 'no',
      setLanguage: (lang) => set((s) => {
        const patch = { language: lang }
        // If the current week notes are still the untouched text a shipped
        // starter plan installed, follow the language switch — this is the
        // only place STARTER_PLANS text lives outside the planner grid, and
        // nothing else re-derives it. installStarterPlan picks its text
        // from i18n's language, not this store's `language` field, and the
        // two can disagree (they're set independently) — so rather than
        // assume which language the installed text is in, check the
        // current text against every language the plan ships. If it still
        // matches one of them untouched, it's stock and safe to swap; if
        // it matches none, the user has edited it and it's left alone.
        const plan = s.activeStarterPlanId
          ? STARTER_PLANS.find(p => p.id === s.activeStarterPlanId)
          : null
        if (plan) {
          const currentText = normalizeWeekNotes(s.weekNotes).week
          const stockVariants = [
            normalizeWeekNotes(plan.notes).week,
            ...Object.values(plan.translations || {}).map(t => normalizeWeekNotes(t?.notes).week),
          ]
          if (stockVariants.includes(currentText)) {
            const nextNotes = (lang && plan.translations?.[lang]?.notes) || plan.notes
            patch.weekNotes = normalizeWeekNotes(nextNotes)
          }
        }
        return patch
      }),

      familySize: 4,
      setFamilySize: (n) => set({ familySize: n }),

      // ── Allergens ──
      // Allergen ids the household avoids. Unlike the condition filter (a
      // browsing intent), an allergy is a persistent fact, so this lives in
      // settings and applies everywhere automatically — you can't forget to
      // re-apply it. Recipes containing any of these are hidden from the
      // recipe list and the planner's picker.
      avoidedAllergens: [],

      toggleAvoidedAllergen: (id) => set((s) => {
        const cur = s.avoidedAllergens || []
        return {
          avoidedAllergens: cur.includes(id) ? cur.filter(a => a !== id) : [...cur, id],
        }
      }),

      clearAvoidedAllergens: () => set({ avoidedAllergens: [] }),

      // Temporarily show everything (e.g. cooking for someone without the
      // allergy) without losing the saved profile. Not persisted — it resets
      // on reload so the safe default always comes back.
      allergenFilterPaused: false,
      setAllergenFilterPaused: (v) => set({ allergenFilterPaused: Boolean(v) }),

      /**
       * Rescale the whole current week to a different number of people.
       *
       * The household size doubles as the week's portion count, so it moves
       * to the target and every item left at the default follows it for
       * free. Tweaked items (a batch bouillon at 10, a dinner bumped to 3)
       * hold fixed numbers, so they get multiplied by the same ratio —
       * without that they'd stay stuck at the old crowd's amounts.
       *
       * Servings are whole numbers, so scaling rounds. Scaling out and back
       * (2 → 5 → 2) can therefore drift by a serving on odd ratios; the
       * numbers stay individually editable afterwards.
       */
      scaleWeek: (targetPortions) => set((s) => {
        const target = Math.max(1, Math.floor(targetPortions))
        const base = s.familySize || 4
        if (target === base) return {}
        const ratio = target / base
        return {
          weekPlan: scalePlanServings(s.weekPlan, ratio),
          batchCook: scaleBatchServings(s.batchCook, ratio),
          familySize: target,
        }
      }),

      /**
       * Scale using serving values captured before the user started
       * adjusting, rather than the week's current ones.
       *
       * Stepping 4 → 8 one press at a time would otherwise re-round on every
       * press and compound the error (a 13-portion batch drifted to 25
       * instead of 26). Replaying from the captured values keeps every
       * intermediate result an exact ratio of the original.
       *
       * Only the servings are replayed — the plan's structure is read live,
       * so a recipe added or removed mid-adjustment survives. Anything the
       * capture doesn't know about is left untouched rather than guessed at.
       *
       * `baseServings` is keyed `day__slot__recipeId`; `baseBatchServings` by
       * batch entry id. A null value means "was at the default", which stays
       * null and keeps following the household size.
       */
      scaleWeekFromBase: (baseServings, baseBatchServings, basePortions, targetPortions) => set((s) => {
        const target = Math.max(1, Math.floor(targetPortions))
        const base = basePortions || 4
        const ratio = target / base

        const plan = {}
        for (const [day, slots] of Object.entries(s.weekPlan || {})) {
          plan[day] = {}
          for (const [slot, items] of Object.entries(slots || {})) {
            plan[day][slot] = (items || []).map(it => {
              const n = normalizeSlotItem(it)
              if (!n) return it
              const key = `${day}__${slot}__${n.recipeId}`
              if (!(key in baseServings)) return it
              return { ...n, servings: scaleServingsValue(baseServings[key], ratio) }
            })
          }
        }

        const batch = (s.batchCook || []).map(b => {
          if (!b || b.kind !== 'recipe' || !(b.id in baseBatchServings)) return b
          return { ...b, servings: scaleServingsValue(baseBatchServings[b.id], ratio) }
        })

        return { weekPlan: plan, batchCook: batch, familySize: target }
      }),

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

      // ── Custom (manually-added) shopping items ──
      // Items the user types in themselves, on top of what the meal plan
      // generates. Each carries a freeform `amount` string (e.g. "2 kg",
      // "a bunch") shown as-is. Checked/prune state reuses the same
      // checkedItems map, keyed by the item's id.
      customShoppingItems: [],
      addCustomShoppingItem: (name, amount) => set((s) => {
        const trimmed = (name || '').trim()
        if (!trimmed) return {}
        return {
          customShoppingItems: [
            ...s.customShoppingItems,
            { id: 'custom-' + makeId(), name: trimmed, amount: (amount || '').trim() },
          ],
        }
      }),
      removeCustomShoppingItem: (id) => set((s) => ({
        customShoppingItems: s.customShoppingItems.filter(i => i.id !== id),
      })),
      // Re-insert a previously-removed custom item verbatim (for undo).
      restoreCustomShoppingItem: (item) => set((s) => (
        !item || s.customShoppingItems.some(i => i.id === item.id)
          ? {}
          : { customShoppingItems: [...s.customShoppingItems, item] }
      )),

      // ── Dismissed (deleted) generated shopping items ──
      // Generated items the user removed from the current list, keyed by
      // item id. Pruned alongside checkedItems when the id leaves the list.
      dismissedShoppingItems: {},
      dismissShoppingItem: (id) => set((s) => ({
        dismissedShoppingItems: { ...s.dismissedShoppingItems, [id]: true },
      })),
      undismissShoppingItem: (id) => set((s) => {
        const next = { ...s.dismissedShoppingItems }
        delete next[id]
        return { dismissedShoppingItems: next }
      }),
      restoreDismissedShoppingItems: () => set({ dismissedShoppingItems: {} }),
      pruneDismissedShoppingItems: (validIds) => set((s) => {
        let changed = false
        const next = {}
        for (const id of Object.keys(s.dismissedShoppingItems)) {
          if (validIds.has(id)) next[id] = s.dismissedShoppingItems[id]
          else changed = true
        }
        return changed ? { dismissedShoppingItems: next } : {}
      }),

      // ── Dismissed single-recipe contributions ──
      // One recipe's contribution to an aggregated item removed, keyed
      // `${itemId}::${recipe}`. The item's total is recomputed from the
      // sources that remain.
      dismissedShoppingSources: {},
      dismissShoppingSource: (itemId, recipe) => set((s) => ({
        dismissedShoppingSources: { ...s.dismissedShoppingSources, [`${itemId}::${recipe}`]: true },
      })),
      undismissShoppingSource: (itemId, recipe) => set((s) => {
        const next = { ...s.dismissedShoppingSources }
        delete next[`${itemId}::${recipe}`]
        return { dismissedShoppingSources: next }
      }),
      restoreDismissedShoppingSources: () => set({ dismissedShoppingSources: {} }),
      pruneDismissedShoppingSources: (validKeys) => set((s) => {
        let changed = false
        const next = {}
        for (const k of Object.keys(s.dismissedShoppingSources)) {
          if (validKeys.has(k)) next[k] = s.dismissedShoppingSources[k]
          else changed = true
        }
        return changed ? { dismissedShoppingSources: next } : {}
      }),

      /**
       * Drop any checked-item entries whose ids are no longer present in
       * the active shopping list. Called whenever the user's weekplan or
       * family size changes — without this, old check marks accumulate
       * forever and inflate the "X of Y checked" counter past Y. Also
       * returns the current map untouched if nothing actually needs
       * pruning, so we don't write to IndexedDB on every render.
       */
      pruneCheckedItems: (validIds) => set((s) => {
        let changed = false
        const next = {}
        for (const id of Object.keys(s.checkedItems)) {
          if (validIds.has(id)) next[id] = s.checkedItems[id]
          else changed = true
        }
        return changed ? { checkedItems: next } : {}
      }),

      // ── Saved Shopping Lists ──
      savedShoppingLists: [],

      saveShoppingList: (name, items, portions = null) => set((s) => ({
        savedShoppingLists: [
          ...s.savedShoppingLists,
          {
            id: makeId(),
            name,
            savedAt: Date.now(),
            // Portions the list was generated for, so it can be re-scaled
            // when reused. Falls back to the household size.
            portions: portions ?? s.familySize ?? null,
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
              notes: normalizeWeekNotes(s.weekNotes),
              batchCook: JSON.parse(JSON.stringify(s.batchCook || [])),
              // How many people this week was built for, so it can be
              // reloaded at a different size later (same idea as the
              // portions stored on a saved shopping list).
              portions: s.familySize ?? null,
              mealCount,
            },
          ],
        }
      }),

      /**
       * Overwrite an already-saved week with the current plan — same id and
       * name, fresh content and timestamp. The counterpart to
       * savePlannerTemplate for the "I tweaked a recipe I didn't like, now
       * update the saved week" flow, rather than always creating a new one.
       */
      updatePlannerTemplate: (id) => set((s) => {
        let mealCount = 0
        for (const day of Object.values(s.weekPlan)) {
          for (const slotRecipes of Object.values(day)) {
            mealCount += slotRecipes.length
          }
        }
        return {
          plannerTemplates: s.plannerTemplates.map((t) => t.id === id
            ? {
              ...t,
              savedAt: Date.now(),
              plan: JSON.parse(JSON.stringify(s.weekPlan)),
              notes: normalizeWeekNotes(s.weekNotes),
              batchCook: JSON.parse(JSON.stringify(s.batchCook || [])),
              portions: s.familySize ?? null,
              mealCount,
            }
            : t),
        }
      }),

      /**
       * Load a saved week. Pass `targetPortions` to cook it for a different
       * number of people than it was saved for — every tweaked serving is
       * scaled by the same ratio and the household size moves to the target.
       */
      loadPlannerTemplate: (id, targetPortions = null) => set((s) => {
        const template = s.plannerTemplates.find(t => t.id === id)
        if (!template) return {}
        // `notes` / `batchCook` / `portions` are absent on weeks saved before
        // those features — such weeks load with empty notes, no batch list,
        // and at their original (unscaled) servings.
        let plan = JSON.parse(JSON.stringify(template.plan))
        let batch = JSON.parse(JSON.stringify(template.batchCook || []))

        const base = template.portions ?? s.familySize ?? 4
        const target = targetPortions == null ? base : Math.max(1, Math.floor(targetPortions))
        if (target !== base && base > 0) {
          const ratio = target / base
          plan = scalePlanServings(plan, ratio)
          batch = scaleBatchServings(batch, ratio)
        }

        return {
          weekPlan: plan,
          weekNotes: normalizeWeekNotes(template.notes),
          batchCook: batch,
          familySize: target,
          // A saved personal template isn't a STARTER_PLANS entry, so its
          // notes have no other-language text to follow.
          activeStarterPlanId: null,
        }
      }),

      /**
       * Installs a starter meal plan (one of the condition-focused sample
       * weeks shipped with the app). Replaces the current weekPlan with
       * a deep copy of the plan's week. The caller is responsible for
       * ensuring required recipe packs are installed first (the UI does
       * this in PacksPage before calling installStarterPlan).
       *
       * Also replaces the week's notes. A shipped plan may localize them
       * under translations[lang].notes (same convention as its name and
       * description); pass `lang` to pick that up, otherwise plan.notes is
       * used. This is the path both sample weeks and uploaded week JSON
       * files take, so tips travel with either.
       */
      installStarterPlan: (starterPlan, lang) => set((s) => {
        // Build a complete skeleton: every named day carries every meal
        // slot the user currently has, initialised to an empty array. Then
        // overlay the sample plan on top. This guarantees a structurally
        // complete weekPlan even when the sample only fills some of the
        // days (the FMD plan, for instance, only fills Mon–Fri) — leaving
        // a day undefined would otherwise crash the planner.
        const plan = {}
        for (const day of DAYS) {
          plan[day] = {}
          for (const slot of s.mealSlots) plan[day][slot] = []
        }
        const incoming = starterPlan.plan || {}
        for (const [day, slots] of Object.entries(incoming)) {
          if (!plan[day]) {
            plan[day] = {}
            for (const slot of s.mealSlots) plan[day][slot] = []
          }
          for (const [slot, items] of Object.entries(slots || {})) {
            plan[day][slot] = JSON.parse(JSON.stringify(items || []))
          }
        }
        const incomingNotes =
          (lang && starterPlan.translations?.[lang]?.notes) || starterPlan.notes
        // Batch entries may be localized the same way (their text lines are
        // free prose); fall back to the plan's canonical list.
        const incomingBatch =
          (lang && starterPlan.translations?.[lang]?.batchCook) || starterPlan.batchCook
        return {
          weekPlan: plan,
          weekNotes: normalizeWeekNotes(incomingNotes),
          batchCook: Array.isArray(incomingBatch) ? JSON.parse(JSON.stringify(incomingBatch)) : [],
          // Tracks provenance so setLanguage() can re-fetch these notes in
          // another language later. starterPlan.id is only set for the
          // shipped STARTER_PLANS entries (see PlannerTemplates.jsx) — an
          // uploaded week-plan file has no id, so this is null for those.
          activeStarterPlanId: starterPlan.id || null,
          // Plans that carry fixed (non-null) servings were authored for a
          // specific household size — reset familySize to it so the people
          // control's next tap scales from that real baseline rather than
          // whatever size was left over from a previous week. Plans built
          // entirely from `servings: null` items don't declare `portions`
          // and leave familySize untouched, since those items already
          // follow it automatically with nothing to reset.
          ...(starterPlan.portions != null ? { familySize: starterPlan.portions } : {}),
        }
      }),

      deletePlannerTemplate: (id) => set((s) => ({
        plannerTemplates: s.plannerTemplates.filter(t => t.id !== id),
      })),

      // ── Recipe Packs ──
      installedPacks: {},

      /**
       * Installs OR updates a recipe pack. Replaces every recipe that
       * belongs to this pack (matched by recipe id) with the latest
       * version from `pack`, while leaving recipes from other packs and
       * user-created recipes completely untouched.
       *
       * Earlier this method only *appended* recipe ids that didn't
       * already exist, which meant tapping "Update" on the Packs page
       * silently bumped the version number but did NOT refresh the
       * recipe content — bug fixes in updated packs never reached users.
       */
      installPack: (pack) => set((s) => {
        const packRecipeIds = new Set(pack.recipes.map(r => r.id))

        // Keep everything that isn't this pack's content:
        //  - user-created recipes (no sourcePackId)
        //  - recipes from other packs
        // Drop this pack's recipes — the ones still shipped are re-added
        // below from the fresh pack, and the ones it no longer ships are
        // pruned (a recipe removed in a new pack version should disappear,
        // not linger as an orphan). We match on sourcePackId rather than
        // just the new id set, since a removed id is absent from that set.
        const keptRecipes = s.recipes.filter(r =>
          !packRecipeIds.has(r.id) && r.sourcePackId !== pack.id
        )

        const freshPackRecipes = pack.recipes.map(r => ({
          ...r,
          createdAt: r.createdAt || Date.now(),
          translations: r.translations || {},
          // Mark each recipe with the pack it came from so the UI can
          // filter "Show only Fredheim Reversal Protocol", etc.
          sourcePackId: pack.id,
        }))

        const allRecipeIds = pack.recipes.map(r => r.id)
        return {
          recipes: [...keptRecipes, ...freshPackRecipes],
          installedPacks: {
            ...s.installedPacks,
            [pack.id]: {
              version: pack.version,
              name: pack.name,
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

      // ── Onboarding tutorial ──
      // false  → tutorial will auto-open on next AppShell mount.
      // true   → already seen / dismissed; stays out of the way until the
      //          user manually replays it from Settings.
      hasSeenTutorial: false,
      setHasSeenTutorial: (value) => set(() => ({ hasSeenTutorial: !!value })),

      // ── Recipe favorites ──
      // Array of recipe ids the user has starred. Toggling is idempotent
      // so the UI can call it without checking current state first.
      favoriteRecipes: [],
      toggleFavorite: (recipeId) => set((s) => {
        if (!recipeId) return {}
        const list = s.favoriteRecipes || []
        const exists = list.includes(recipeId)
        return {
          favoriteRecipes: exists
            ? list.filter(id => id !== recipeId)
            : [...list, recipeId],
        }
      }),

      // ── "What's new" tracker ──
      // Array of news ids the user has already dismissed. Anything in
      // src/data/whatsNew.js whose id is NOT in here will pop up next
      // time the AppShell mounts. We start with null to distinguish
      // "uninitialised" from "explicitly empty" — the WhatsNewModal
      // initialises this on first load so brand-new users don't get
      // bombarded with historical announcements.
      seenNewsIds: null,
      markNewsSeen: (ids) => set((s) => {
        const additions = Array.isArray(ids) ? ids : [ids]
        const existing = Array.isArray(s.seenNewsIds) ? s.seenNewsIds : []
        const merged = Array.from(new Set([...existing, ...additions]))
        return { seenNewsIds: merged }
      }),

      // ── Recipes list filter / search state ──
      // Persisted so that whenever the user comes back to the Recipes page
      // — from Settings, the Planner, the Shopping list, a recipe detail,
      // anywhere — the filters they applied are still there. This also
      // means the recipe Back button can safely navigate to "/" without
      // losing context.
      recipesView: {
        category: 'All',
        pack: 'All',
        // Health conditions to filter by, AND-combined: a recipe must match
        // every selected condition. Empty = no condition filter. (Replaces the
        // old single `condition` string so people with several conditions can
        // find food that suits all of them.)
        conditions: [],
        search: '',
        sortBy: 'newest',
      },
      setRecipesView: (partial) => set((s) => ({
        recipesView: { ...s.recipesView, ...partial },
      })),
      resetRecipesView: () => set(() => ({
        recipesView: { category: 'All', pack: 'All', conditions: [], search: '', sortBy: 'newest' },
      })),
    }),
    {
      name: 'menu-planner-store',
      // IndexedDB-backed (via idb-keyval) instead of the default
      // localStorage. Gives us ~50% of free disk (GBs) instead of ~5 MB.
      storage: createJSONStorage(() => idbStorage),
      // Persist everything EXCEPT the temporary "show allergens anyway"
      // escape hatch. That one must reset on reload so the protective
      // filter is always back on by default — a paused allergen filter
      // silently surviving a restart is exactly the unsafe case.
      partialize: (state) => {
        const { allergenFilterPaused, ...persisted } = state
        return persisted
      },
      version: 8,
      migrate: (persistedState, version) => {
        // v8: the recipe-category filter/picker had "Middag" (Main) but no
        // "Lunsj" (Lunch) option — Lunch was simply missing from the default
        // list, not a translation bug. Backfill it for existing users so the
        // fix isn't only visible on brand-new installs; slotted right after
        // Breakfast to match the natural Breakfast → Lunch → Main ordering.
        if (version < 8) {
          if (Array.isArray(persistedState.recipeCategories) && !persistedState.recipeCategories.includes('Lunch')) {
            const i = persistedState.recipeCategories.indexOf('Breakfast')
            const at = i === -1 ? 0 : i + 1
            persistedState.recipeCategories = [
              ...persistedState.recipeCategories.slice(0, at),
              'Lunch',
              ...persistedState.recipeCategories.slice(at),
            ]
          }
        }
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
        // v7: existing users have already discovered the app — silently
        // mark the tutorial as seen so they aren't ambushed by an
        // onboarding pop-up on their next visit. Brand-new accounts start
        // with the default false and will see the tutorial automatically.
        if (version < 7) {
          if (typeof persistedState.hasSeenTutorial !== 'boolean') {
            persistedState.hasSeenTutorial = true
          }
        }
        // v6: backfill sourcePackId on recipes installed from packs before
        // we started tracking it. Uses installedPacks[packId].recipeIds to
        // know which recipe belongs to which pack.
        if (version < 6) {
          if (Array.isArray(persistedState.recipes) && persistedState.installedPacks) {
            const recipeIdToPackId = {}
            for (const [packId, info] of Object.entries(persistedState.installedPacks)) {
              for (const rid of info?.recipeIds || []) {
                recipeIdToPackId[rid] = packId
              }
            }
            persistedState.recipes = persistedState.recipes.map(r => ({
              ...r,
              sourcePackId: r.sourcePackId || recipeIdToPackId[r.id] || null,
            }))
          }
        }
        // v5: each slot used to hold an array of recipe-id strings; now it
        // holds { recipeId, servings } objects so portions can be overridden
        // per planner instance.
        if (version < 5) {
          function migrateSlots(plan) {
            if (!plan) return plan
            const out = {}
            for (const [day, slots] of Object.entries(plan)) {
              out[day] = {}
              for (const [slot, items] of Object.entries(slots || {})) {
                out[day][slot] = (items || []).map(it =>
                  typeof it === 'string' ? { recipeId: it, servings: null } : it
                )
              }
            }
            return out
          }
          if (persistedState.weekPlan) {
            persistedState.weekPlan = migrateSlots(persistedState.weekPlan)
          }
          if (Array.isArray(persistedState.plannerTemplates)) {
            persistedState.plannerTemplates = persistedState.plannerTemplates.map(t => ({
              ...t,
              plan: migrateSlots(t.plan),
            }))
          }
          if (Array.isArray(persistedState.savedShoppingLists)) {
            persistedState.savedShoppingLists = persistedState.savedShoppingLists.map(l => ({
              ...l,
              weekPlanSnapshot: migrateSlots(l.weekPlanSnapshot),
            }))
          }
        }
        return persistedState
      },
    }
  )
)

export default useStore
export { DAYS, DEFAULT_MEAL_SLOTS }
// (normalizeSlotItem and getPlanDayKeys are already exported above)

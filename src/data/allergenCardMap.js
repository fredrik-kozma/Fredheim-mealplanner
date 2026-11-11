/**
 * Allergens for the kitchen cards, derived from ingredient ids.
 *
 * This is separate from the "avoid these foods" filter. That filter treats
 * ordinary oats as gluten-free. Annex II lists oats as a cereal containing
 * gluten, so the cards declare oats even when a row says gluten-free.
 *
 * Where a product might or might not contain an allergen, the card declares
 * it: bouillon and nutritional yeast as wheat, curry blends as mustard,
 * herb salt as celery, miso as barley, dried fruit and brined vegetables
 * as sulphites, baking powder as wheat, unnamed plant milk as soy and oats,
 * a gluten-free flour mix as lupin and almond. Staff can remove that line
 * on the card if the jar they use is free of it. An ingredient id with no
 * decision at all is reported as unmapped. Coconut, buckwheat, nutmeg,
 * eggplant and poppy seeds are decided safe.
 */

import dictionary from './ingredientDictionary.json'
import { sanitizeHits } from './euAllergens.js'

/** @type {Record<string, { hits?: string[], reviews?: string[] }>} */
export const INGREDIENT_RULES = {
  'rolled-oats': { hits: ['cereal:oats'] },
  'oat-flour': { hits: ['cereal:oats'] },
  'oat-milk': { hits: ['cereal:oats'] },
  'small-oats': { hits: ['cereal:oats'] },
  'oat-porridge-cooked': { hits: ['cereal:oats'] },

  'white-flour': { hits: ['cereal:wheat'] },
  'wholewheat-flour': { hits: ['cereal:wheat'] },
  'gluten-flour': { hits: ['cereal:wheat'] },
  bread: { hits: ['cereal:wheat'] },
  'bread-crumbs': { hits: ['cereal:wheat'] },
  'lasagne-sheets': { hits: ['cereal:wheat'] },
  bulgur: { hits: ['cereal:wheat'] },
  'rye-flour': { hits: ['cereal:rye'] },
  'spelt-flour': { hits: ['cereal:spelt'] },
  // Inka / Caro, the examples in the recipes, are barley and rye.
  'barley-coffee': { hits: ['cereal:barley', 'cereal:rye'] },
  // Unspecified grain: wheat. A note that names rye, oats, or spelt replaces this.
  'sourdough-starter': { hits: ['cereal:wheat'] },
  crispbread: { hits: ['cereal:wheat'] },

  'soy-sauce': { hits: ['soy', 'cereal:wheat'] },
  'soy-sauce-low-sodium': { hits: ['soy', 'cereal:wheat'] },
  // The recipe notes call tamari wheat-free, and the app already says so.
  tamari: { hits: ['soy'] },
  tofu: { hits: ['soy'] },
  'soy-milk': { hits: ['soy'] },
  'soy-mayonnaise': { hits: ['soy'] },
  'edamame-frozen': { hits: ['soy'] },
  'miso-paste': { hits: ['soy', 'cereal:barley'] },
  // Unnamed plant milk/yogurt: both common bases. A note that names one replaces these.
  'plant-milk': { hits: ['soy', 'cereal:oats'] },
  'plant-yogurt': { hits: ['soy', 'cereal:oats'] },

  'sesame-seeds': { hits: ['sesame'] },
  'sesame-oil': { hits: ['sesame'] },
  tahini: { hits: ['sesame'] },
  hummus: { hits: ['sesame'] },
  'classic-hummus': { hits: ['sesame'] },

  'mustard-seeds': { hits: ['mustard'] },
  celery: { hits: ['celery'] },
  celeriac: { hits: ['celery'] },

  peanuts: { hits: ['peanuts'] },
  'peanut-butter': { hits: ['peanuts'] },
  almonds: { hits: ['nut:almond'] },
  'almond-butter': { hits: ['nut:almond'] },
  'almond-milk': { hits: ['nut:almond'] },
  hazelnuts: { hits: ['nut:hazelnut'] },
  walnuts: { hits: ['nut:walnut'] },
  cashews: { hits: ['nut:cashew'] },
  'cashew-milk': { hits: ['nut:cashew'] },
  'cashew-sour-cream': { hits: ['nut:cashew'] },
  'white-cashew-sauce': { hits: ['nut:cashew'] },
  pecans: { hits: ['nut:pecan'] },
  pistachios: { hits: ['nut:pistachio'] },

  // The house daily broth contains celery, and cubes almost always do.
  'vegetable-broth': { hits: ['celery'] },
  'vegetable-bouillon': { hits: ['celery', 'cereal:wheat'] },

  'dried-apricots': { hits: ['sulphites'] },
  'dried-cranberries': { hits: ['sulphites'] },
  'dried-figs': { hits: ['sulphites'] },
  prunes: { hits: ['sulphites'] },
  raisins: { hits: ['sulphites'] },
  'sun-dried-tomatoes': { hits: ['sulphites'] },
  olives: { hits: ['sulphites'] },
  'olive-brine': { hits: ['sulphites'] },
  capers: { hits: ['sulphites'] },
  'balsamic-vinegar': { hits: ['sulphites'] },
  'white-wine-vinegar': { hits: ['sulphites'] },
  'apple-cider-vinegar': { hits: ['sulphites'] },
  'rice-vinegar': { hits: ['sulphites'] },
  ketchup: { hits: ['sulphites'] },

  'nutritional-yeast': { hits: ['cereal:wheat'] },
  'baking-powder': { hits: ['cereal:wheat'] },
  // Mixes on the market often contain lupin or almond. Staff can untick either.
  'gluten-free-flour-mix': { hits: ['lupin', 'nut:almond'] },
  'curry-powder': { hits: ['mustard'] },
  'garam-masala': { hits: ['mustard'] },
  'tandoori-masala': { hits: ['mustard'] },
  'herb-salt': { hits: ['celery'] },
  'hot-sauce': { hits: ['cereal:wheat'] },
}

export const SAFE_IDS = new Set([
  'apples', 'arugula', 'avocados', 'bananas', 'basil', 'bean-sprouts', 'beetroot',
  'bell-peppers', 'blackberries', 'blueberries', 'broccoli', 'butternut-squash',
  'cabbage', 'carrots', 'cauliflower', 'cherry-tomatoes', 'chinese-cabbage', 'chives',
  'cocoa-powder', 'cucumber', 'dill', 'eggplant', 'fennel', 'chili-fresh',
  'coriander-fresh', 'ginger-fresh', 'herbs-fresh-mixed', 'garlic', 'grapes',
  'green-peas', 'horseradish', 'kale', 'leeks', 'lemon-juice', 'lemons', 'lime-juice',
  'limes', 'lingonberries', 'melon', 'mint', 'berries-mixed', 'mushrooms', 'onions',
  'oranges', 'parsley', 'parsnips', 'pears', 'pineapple', 'plums', 'pomegranate',
  'poppy-seeds', 'potatoes', 'pumpkin', 'radishes', 'raspberries', 'red-cabbage',
  'red-onions', 'romaine-lettuce', 'rosemary', 'salad-leaves', 'shallots', 'snow-peas',
  'sour-cherries', 'spinach', 'spring-onions', 'strawberries', 'sweet-potatoes', 'thyme',
  'tomatoes', 'watermelon', 'zucchini', 'agar-agar', 'baking-soda', 'bean-noodles',
  'brown-rice', 'buckwheat-flour', 'buckwheat-groats', 'carob-powder', 'chickpea-flour',
  'cornmeal-polenta', 'cornstarch', 'dry-yeast', 'millet', 'potato-starch', 'psyllium-husk',
  'quinoa', 'rice-flour', 'rice-noodles', 'tapioca-starch', 'allspice', 'aquafaba',
  'black-beans-canned', 'borlotti-beans-dry', 'canned-tomatoes', 'chia-seeds',
  'chickpeas-canned', 'chickpeas-dry', 'coconut-cream', 'coconut-milk', 'date-paste',
  'dates-dried', 'flaxseed-ground', 'flaxseed-whole', 'lentils-green-brown',
  'kidney-beans-canned', 'medjool-dates', 'nori', 'pumpkin-seeds', 'lentils-red',
  'shredded-coconut', 'sunflower-seeds', 'tomato-puree', 'white-beans-canned',
  'white-beans-dry', 'yellow-peas-cooked', 'amla-powder', 'basil-dried', 'bay-leaves',
  'black-pepper', 'black-salt', 'caraway-seeds', 'cardamom-ground', 'cayenne-pepper',
  'chili-flakes', 'chili-powder', 'cinnamon-ground', 'cloves-ground', 'coconut-oil',
  'coriander-seeds', 'coriander-ground', 'cumin-ground', 'fenugreek-seeds', 'garlic-powder',
  'ginger-ground', 'honey', 'maple-syrup', 'marjoram-dried', 'nigella-seeds',
  'nutmeg-ground', 'olive-oil', 'onion-powder', 'oregano-dried', 'paprika-powder',
  'parsley-dried', 'rapeseed-oil', 'rosemary-dried', 'sage-dried', 'salt', 'smoked-paprika',
  'sugar', 'sukrin', 'sumac', 'tarragon-dried', 'thyme-dried', 'turmeric-ground',
  'vanilla-extract', 'vanilla-powder', 'white-pepper', 'blueberries-frozen',
  'brussels-sprouts-frozen', 'asparagus-beans-frozen', 'mango-frozen',
  'berries-mixed-frozen', 'pineapple-frozen', 'raspberries-frozen', 'spinach-frozen',
  'strawberries-frozen', 'sweetcorn-frozen', 'orange-juice', 'pineapple-juice', 'water',
])

const WHEAT_FREE = /wheat[\s-]?free|hvetefri|vetefri/i

const NAME_TO_ID = new Map()
for (const entry of dictionary.entries || []) {
  for (const lang of ['en', 'no', 'sv']) {
    for (const value of [entry.names?.[lang], entry.singular?.[lang], ...(entry.synonyms?.[lang] || [])]) {
      const key = String(value || '').trim().toLowerCase()
      if (key && !NAME_TO_ID.has(key)) NAME_TO_ID.set(key, entry.id)
    }
  }
}

function ruleFor(id) {
  if (!id) return null
  if (INGREDIENT_RULES[id]) return INGREDIENT_RULES[id]
  if (SAFE_IDS.has(id)) return { hits: [], reviews: [] }
  return null
}

function lookupId(names) {
  for (const lang of ['en', 'no', 'sv']) {
    const key = String(names?.[lang] || '').trim().toLowerCase()
    if (key && NAME_TO_ID.has(key)) return NAME_TO_ID.get(key)
  }
  return null
}

/** Cereals named in free text. Buckwheat is removed before "wheat"/"hvete" is tested. */
export function cerealsInText(text) {
  const t = String(text || '').toLowerCase().replace(/buckwheat|bokhvete|bovete/g, ' ')
  const hits = []
  if (/spelt|dinkel/.test(t)) hits.push('cereal:spelt')
  if (/khorasan|kamut|korasan/.test(t)) hits.push('cereal:khorasan')
  if (/(^|[^a-zæøåäö])(rye|rug|råg)/.test(t)) hits.push('cereal:rye')
  if (/(^|[^a-zæøåäö])(barley|bygg)(?!e)/.test(t)) hits.push('cereal:barley')
  if (/(^|[^a-zæøåäö])(oats?|havre)/.test(t)) hits.push('cereal:oats')
  if (/(^|[^a-zæøåäö])(wheat|hvete)(?![a-zæøåäö])/.test(t) || /(?<![a-zæøåäö])vete(?![a-zæøåäö])/.test(t)) {
    hits.push('cereal:wheat')
  }
  return hits
}

/** null = the base was not named. [] = named, and it is not an Annex II food. */
export function plantBaseHits(text) {
  const t = String(text || '').toLowerCase()
  if (/\bsoy\b|soya|soja|\btofu\b/.test(t)) return ['soy']
  if (/cashew|kasju/.test(t)) return ['nut:cashew']
  if (/almond|mandel/.test(t)) return ['nut:almond']
  if (/coconut|kokos/.test(t)) return []
  if (/(^|[^a-zæøåäö])(oats?|havre)/.test(t)) return ['cereal:oats']
  if (/rice milk|rismelk|risdryck|risdrikk|risdrikke/.test(t)) return []
  return null
}

const GF_FLOUR = /rice flour|rismel|rismjöl|chickpea flour|kikertmel|kikärtsmjöl|corn flour|maismel|majsmjöl|polenta|potato flour|potetmel|potatismjöl|almond flour|mandelmel|mandelmjöl|coconut flour|kokosmel|kokosmjöl|buckwheat|bokhvete|bovete|tapioca|arrowroot|sorghum|millet|hirs|quinoa|teff|chickpea/

function hasFlour(text) {
  const t = String(text || '').toLowerCase()
  if (/\bflour\b/.test(t)) return true
  if (/(^|[^a-zæøåäö])mel(?![a-zæøåäö])/.test(t)) return true
  if (/(^|[^a-zæøåäö])mjöl(?!k)/.test(t)) return true
  return false
}

/**
 * Free-text fallback for a row that is not a dictionary id.
 * Exclusions are applied first: coconut milk, eggplant, flax egg,
 * buckwheat, nutmeg, havremelk / havremjölk.
 */
export function allergensFromFreeText(text) {
  const raw = String(text || '')
  const t = raw.toLowerCase()
  if (!t.trim()) return { hits: [], reviews: [] }
  const hits = []

  if (/peanut|peanøtt|peanott|jordnøtt|jordnott|jordnöt|groundnut/.test(t)) hits.push('peanuts')

  const nutExcluded = /coconut|kokos|nutmeg|muskat|butternut|nutritional yeast|næringsgjær|naringsgjær|water chestnut|vannkastanje|vattenkastanj/
  if (!nutExcluded.test(t)) {
    if (/almond|mandel/.test(t)) hits.push('nut:almond')
    if (/hazelnut|hasselnøtt|hasselnott|hasselnöt/.test(t)) hits.push('nut:hazelnut')
    if (/walnut|valnøtt|valnott|valnöt/.test(t)) hits.push('nut:walnut')
    if (/cashew|kasju/.test(t)) hits.push('nut:cashew')
    if (/pecan|pekann/.test(t)) hits.push('nut:pecan')
    if (/pistachio|pistasj|pistage/.test(t)) hits.push('nut:pistachio')
    if (/brazil nut|paranøtt|paranott|paranöt/.test(t)) hits.push('nut:brazil')
    if (/macadamia/.test(t)) hits.push('nut:macadamia')
  }

  const notDairy = /coconut milk|oat milk|soy milk|almond milk|cashew milk|rice milk|plant milk|kokosmelk|havremelk|soyamelk|mandelmelk|plantemelk|rismelk|kokosmjölk|havremjölk|sojamjölk|mandelmjölk|växtmjölk|risdryck|for milk|til melk|till mjölk|flax/
  const dairyWord = /(^|[^a-zæøåäö])(milk|melk|mjölk|lactose|laktose)(?![a-zæøåäö])|\bcheese\b|\byoghurt\b|\byogurt\b|\bwhey\b/
  const butterTrap = /peanut butter|almond butter|nut butter|cashew butter|cocoa butter|apple butter|butternut|peanøttsmør|mandelsmør/
  if (!notDairy.test(t) && dairyWord.test(t) && !butterTrap.test(t)) hits.push('milk')

  const eggTrap = /eggplant|egg plant|aubergine|eggfrukt|flax egg|linfrøegg|linfrö|egg-free|eggefri|äggfri|vegan egg/
  if (!eggTrap.test(t) && /(^|[^a-zæøåäö])(eggs?|ägg)(?![a-zæøåäö])/.test(t)) hits.push('eggs')

  if (/shrimp|prawn|crab\b|lobster|crayfish|scampi|krill|shellfish|reke|räka|krabbe|krabba|hummer|kreps|kräft/.test(t)) {
    hits.push('crustaceans')
  }
  if (/mussel|oyster|squid|calamari|octopus|scallop|abalone|blåskjell|blåmussla|østers|ostron|blekksprut|bläckfisk|kamskjell|kammussla/.test(t)) {
    hits.push('molluscs')
  }
  if (/(^|[^a-zæøåäö])(cod|salmon|tuna|anchovy|sardine|mackerel|trout|torsk|laks|lax|fisk|fish|ansjos|sild|makrell|ørret|öring)(?![a-zæøåäö])/.test(t) || /worcester/.test(t)) {
    hits.push('fish')
  }

  if (/sesame|sesam|tahini|tahin/.test(t)) hits.push('sesame')
  if (/mustard|sennep|senap/.test(t)) hits.push('mustard')
  if (/celery|celeriac|selleri/.test(t)) hits.push('celery')
  if (!/soy[\s-]?free|soyafri|sojafri/.test(t) && /\bsoy\b|soya|soja|tofu|tempeh|edamame|miso|tamari/.test(t)) {
    hits.push('soy')
  }
  if (/lupin/.test(t)) hits.push('lupin')
  if (/sulphite|sulfite|sulfit|svoveldioksid|svaveldioxid|\be22[0-8]\b/.test(t)) hits.push('sulphites')
  if (/(^|[^a-zæøåäö])(wine|vin)(?![a-zæøåäö])/.test(t) && !/vinegar|eddik|vinäger/.test(t)) hits.push('sulphites')
  if (/dried apricot|tørket aprikos|torkad aprikos|raisin|sultana|rosin|sun-dried tomato|soltørk|soltork|dried fig|tørket fiken|torkad fikon|prune|sviske|cranberr|ketchup|ketsjup|caper|kapers|kapris/.test(t)) {
    hits.push('sulphites')
  }
  if (/(^|[^a-zæøåäö])(olives|oliven)(?![a-zæøåäö])/.test(t)) hits.push('sulphites')
  if (/nutritional yeast|næringsgjær|naringsgjær|näringsjäst|baking powder|bakepulver|bakpulver|hot sauce|chilisaus|chilisås|bouillon|buljong/.test(t)) {
    hits.push('cereal:wheat')
  }
  if (/bouillon|buljong|vegetable broth|grønnsaksbuljong|grönsaksbuljong/.test(t)) hits.push('celery')
  if (/curry|garam masala|tandoori/.test(t)) hits.push('mustard')
  if (/herb salt|urtesalt|örtsalt|kryddersalt|kryddsalt/.test(t)) hits.push('celery')
  if (/miso/.test(t)) hits.push('cereal:barley')

  hits.push(...cerealsInText(t))
  const soySauce = /soy sauce|soyasaus|sojasås|shoyu/.test(t)
  if (soySauce && !WHEAT_FREE.test(t)) hits.push('cereal:wheat')
  if (!hits.some((hit) => hit.startsWith('cereal:')) && !GF_FLOUR.test(t) && hasFlour(t)) {
    hits.push('cereal:wheat')
  }
  if (/(^|[^a-zæøåäö])(bread|brød|bröd)/.test(t) && !/crispbread|knekkebrød|knäckebröd/.test(t)) {
    if (!hits.includes('cereal:wheat')) hits.push('cereal:wheat')
  }
  if (/crispbread|knekkebrød|knäckebröd/.test(t) && !hits.some((hit) => hit.startsWith('cereal:'))) {
    hits.push('cereal:wheat')
  }

  return { hits: [...new Set(hits)], reviews: [] }
}

function collectRows(recipe) {
  const lists = [
    recipe?.ingredients || [],
    recipe?.translations?.no?.ingredients || [],
    recipe?.translations?.sv?.ingredients || [],
  ]
  const n = Math.max(0, ...lists.map((list) => list.length))
  const rows = []
  for (let i = 0; i < n; i += 1) {
    const en = lists[0][i]
    const no = lists[1][i]
    const sv = lists[2][i]
    const parts = [en, no, sv].filter(Boolean)
    if (!parts.length) continue
    const text = parts.map((row) => `${row.name || ''} ${row.note || ''}`).join('\n')
    const names = {
      en: String(en?.name || no?.name || sv?.name || '').trim(),
      no: String(no?.name || en?.name || sv?.name || '').trim(),
      sv: String(sv?.name || en?.name || no?.name || '').trim(),
    }
    const id = en?.ingredient || no?.ingredient || sv?.ingredient || null
    if (!String(id || '').trim() && !text.trim()) continue
    rows.push({ id: id || null, text, names })
  }
  return rows
}

function applyRow(row, into) {
  let id = row.id || lookupId(row.names)
  let rule = ruleFor(id)
  let hits = []
  let reviews = []

  if (!rule) {
    const free = allergensFromFreeText(row.text)
    if (!free.hits.length && !free.reviews.length) {
      into.unmapped.push({ ingredientId: row.id, names: row.names })
      return
    }
    hits = free.hits
    reviews = free.reviews
  } else {
    hits = [...(rule.hits || [])]
    if (id === 'plant-milk' || id === 'plant-yogurt') {
      const plant = plantBaseHits(row.text)
      if (plant) hits = [...plant]
    }
    if (id === 'sourdough-starter' || id === 'crispbread') {
      const grains = cerealsInText(row.text)
      if (grains.length) hits = [...grains]
    }
    if (id === 'bread') hits.push(...cerealsInText(row.text))
  }

  if (WHEAT_FREE.test(row.text)) {
    hits = hits.filter((hit) => hit !== 'cereal:wheat')
  }

  for (const hit of hits) into.hits.add(hit)
  for (const key of reviews) {
    into.reviews.push({ key, ingredientId: id, names: row.names })
  }
}

function dedupeReviews(reviews) {
  const seen = new Set()
  const out = []
  for (const review of reviews) {
    const mark = `${review.key}|${review.ingredientId || ''}|${review.names?.en || ''}`
    if (seen.has(mark)) continue
    seen.add(mark)
    out.push(review)
  }
  return out
}

/**
 * @returns {{ hits: string[], reviews: object[], unmapped: object[] }}
 */
export function detectRecipeAllergens(recipe) {
  const into = { hits: new Set(), reviews: [], unmapped: [] }
  for (const row of collectRows(recipe)) applyRow(row, into)
  return {
    hits: sanitizeHits([...into.hits]),
    reviews: dedupeReviews(into.reviews),
    unmapped: dedupeReviews(into.unmapped.map((row) => ({ ...row, key: 'unmapped' }))),
  }
}

/** A saved override replaces the suggestion, including the review flags. */
export function applyAllergenOverride(detected, override) {
  if (!override || !Array.isArray(override.hits)) {
    return { ...detected, overridden: false }
  }
  return {
    hits: sanitizeHits(override.hits),
    reviews: [],
    unmapped: [],
    overridden: true,
  }
}

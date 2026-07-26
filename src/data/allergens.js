// Allergen detection for recipe filtering.
//
// IMPORTANT: recipes are not authored with allergen metadata, so presence is
// INFERRED from ingredient names. This is curated rather than naive substring
// matching, because the obvious approach is badly wrong on real data:
//
//   "coconut milk", "cashew milk", "soy yogurt"  → not dairy
//   "eggplant", "water (for the flax egg)"       → no egg
//   "buckwheat" / "bokhvete"                     → gluten-FREE despite the name
//   "nutmeg", "nutritional yeast", "butternut"   → not tree nuts
//   Swedish "mjöl" (flour) is a prefix of "mjölk" (milk)
//   Norwegian "mel" (flour) is a prefix of "melk" (milk)
//
// Each allergen has `match` patterns and `exclude` patterns. Exclusions are
// evaluated first and clear an ingredient for that allergen, so a specific
// safe term ("gluten-free oat flour") beats a general risky one ("flour").
//
// Matching runs over EN + NO + SV ingredient names. For an exclusion filter,
// broader coverage is the safer error: a false positive merely hides a recipe,
// while a false negative could reach someone who is allergic.

export const ALLERGENS = [
  {
    id: 'tree-nuts',
    icon: '🌰',
    // Named nuts explicitly — this sidesteps the nutmeg / nutritional yeast /
    // butternut / coconut traps entirely. The generic `nut` pattern is kept
    // for future recipes ("mixed nuts") but guarded by the exclusions below.
    match: [
      /almond|mandl|mandel/,
      /cashew/,
      /walnut|valnøt|valnöt/,
      /hazelnut|hasselnøt|hasselnöt/,
      /pecan|pekannøt|pekannöt/,
      /pistachio|pistasj|pistage/,
      /macadamia/,
      /brazil nut|paranøt|paranöt/,
      /paranøtt|chestnut|kastanje/,
      /\bnuts?\b|\bnøtter\b|\bnötter\b/,
    ],
    exclude: [
      /peanut|peanøt|jordnøt|jordnöt|groundnut/,  // legume — its own allergen
      /coconut|kokos/,                             // botanically a fruit
      /nutmeg|muskatnøt|muskotnöt|muskot/,         // spice
      /nutritional yeast|næringsgjær|näringsjäst/, // not a nut at all
      /butternut/,                                 // squash
      /water chestnut|vannkastanje|vattenkastanj/, // aquatic tuber
    ],
  },
  {
    id: 'peanuts',
    icon: '🥜',
    match: [/peanut|peanøt|jordnøt|jordnöt|groundnut/],
    exclude: [],
  },
  {
    id: 'gluten',
    icon: '🌾',
    match: [
      /wheat|hvete|vete/,
      /barley|bygg(?!e)|kornkaffe|byggkaffe/,   // incl. barley coffee
      /\brye\b|\brug\b|\bråg\b/,
      /spelt|dinkel/,
      /seitan/,
      /semolina|couscous|bulgur|durum|farro|graham/,
      /bread|brød|bröd/,                        // incl. breadcrumbs
      // Word-bounded so Norwegian/Swedish compounds that merely END in
      // "pasta" — "misopasta" (miso paste), "dadelpasta" (date paste) —
      // don't read as wheat pasta.
      /\bpasta\b|spaghetti|macaroni|tagliatelle|lasagne/,
      /malt extract|maltekstrakt|maltextrakt/,  // NOT bare "malt": in NO/SV
                                                // "malt" means GROUND (spices)
      // Bare "flour" is assumed gluten unless an exclusion below clears it.
      // The negative lookahead keeps Norwegian "melk" / Swedish "mjölk"
      // (milk) from reading as flour.
      /flour|mel(?!k)\b|mjöl(?!k)/,
    ],
    exclude: [
      // Note the character class: "gluten free" (space) is as common as
      // "gluten-free", and a hyphen-only pattern silently missed it.
      /gluten[\s-]?free|glutenfri/,             // explicitly declared GF
      /wheat[\s-]?free|hvetefri|vetefri/,       // e.g. wheat-free tamari
      /buckwheat|bokhvete|bovete/,              // gluten-free despite the name
      /rice flour|rismjöl|rismel/,
      /rice noodle|risnudler|risnudlar/,        // rice/bean noodles are GF
      /bean noodle|bønnenudler|bönnudlar|glass noodle|mung/,
      /chickpea flour|kikertmel|kikärtsmjöl/,
      /corn flour|polenta|maismel|majsmjöl/,
      /potato flour|potetmel|potatismjöl/,
      /almond flour|mandelmel|mandelmjöl/,
      /coconut flour|kokosmel|kokosmjöl/,
      /oat flour|havremel|havremjöl/,           // oats are naturally GF
      /oat milk|havremelk|havremjölk/,          // "havremjölk" contains "mjöl"
    ],
  },
  {
    id: 'soy',
    icon: '🫘',
    match: [/\bsoy|soya|soja|tofu|tempeh|edamame|miso|tamari/],
    exclude: [],
  },
  {
    id: 'sesame',
    icon: '🥯',
    match: [/sesame|sesam|tahini/],
    exclude: [],
  },
  {
    id: 'mustard',
    icon: '🌭',
    match: [/mustard|sennep|senap/],
    exclude: [],
  },
  {
    id: 'celery',
    icon: '🥬',
    match: [/celery|celeriac|selleri/],
    exclude: [],
  },
]

export const ALLERGEN_IDS = ALLERGENS.map(a => a.id)

/** Every ingredient name on a recipe, across EN + NO + SV. */
function allIngredientNames(recipe) {
  const names = []
  for (const ing of recipe?.ingredients || []) {
    if (ing?.name) names.push(ing.name)
  }
  for (const lang of ['no', 'sv']) {
    for (const ing of recipe?.translations?.[lang]?.ingredients || []) {
      if (ing?.name) names.push(ing.name)
    }
  }
  return names.map(n => String(n).toLowerCase())
}

/** True if this single ingredient string triggers the given allergen. */
export function ingredientHasAllergen(name, allergen) {
  const n = String(name).toLowerCase()
  if (allergen.exclude.some(re => re.test(n))) return false
  return allergen.match.some(re => re.test(n))
}

/**
 * Allergen ids present in a recipe, inferred from its ingredient names.
 * Returns [] for recipes with no ingredients (nothing to inspect).
 */
export function recipeAllergens(recipe) {
  const names = allIngredientNames(recipe)
  if (!names.length) return []
  const found = []
  for (const allergen of ALLERGENS) {
    if (names.some(n => ingredientHasAllergen(n, allergen))) found.push(allergen.id)
  }
  return found
}

/**
 * True when a recipe should be hidden for someone avoiding `avoided`
 * (an array of allergen ids).
 */
export function recipeHasAvoidedAllergen(recipe, avoided) {
  if (!avoided?.length) return false
  const present = recipeAllergens(recipe)
  return avoided.some(id => present.includes(id))
}

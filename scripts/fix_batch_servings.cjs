/* Two recipes claimed to serve 1 while carrying obvious big-batch amounts,
 * which made their per-serving figures meaningless and their scaling useless.
 *
 * Homemade Whole Wheat Bread — 5130 g of flour/oats plus 4 l of water is
 *   ~9100 g of dough. Its own step 6 says to divide the dough into molds at
 *   "800 g for the small ones and 900 g for the bigger ones", so the recipe
 *   states its own yield: ~11 loaves at an 850 g average. 1 serving = 1 loaf,
 *   matching how the pack treats other baked goods (orn-17 = 8 rolls).
 *
 * Ellen's Granola — 4640 g of ingredients. Calibrated against Erik's Granola
 *   in the same pack, which the author already set to 35 servings for 9105 g,
 *   i.e. ~260 g of raw ingredients per serving. 4640 / 260 = 18.
 *
 * Nothing else about either recipe changes.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const FIX = {
  'homemade-whole-wheat-bread': 11,
  'ellens-granola': 18,
}

for (const [id, servings] of Object.entries(FIX)) {
  const r = pack.recipes.find(x => x.id === id)
  if (!r) throw new Error(`missing recipe ${id}`)
  const gramTotal = (r.ingredients || []).filter(i => i.unit === 'g').reduce((s, i) => s + i.quantity, 0)
  console.log(`${r.title}: servings ${r.servings} -> ${servings}  (${gramTotal} g of weighed ingredients, ${Math.round(gramTotal / servings)} g each)`)
  r.servings = servings
}

pack.version = '1.18.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('pack ->', pack.version)

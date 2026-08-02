/* Second pass of the volume->weight cleanup.
 *
 * The first pass (volume_to_weight.cjs) only touched bulk units (dl/ml/l/
 * cup). That left a handful of *whole foods* still measured in tsp/tbsp —
 * avocado as "2 tbsp", leeks as "2.5 tbsp", onion as "1 tbsp" — which read
 * inconsistently next to the same ingredient now in grams.
 *
 * This pass converts only those. Deliberately NOT converted:
 *   - dried herbs (basil/parsley dried) — seasonings, spoons are right
 *   - starches used as thickeners (cornstarch, tapioca) — powders, and
 *     "1 tbsp cornstarch" is more useful at the stove than "8 g"
 *   - everything else in tsp/tbsp: salt, spices, powders, oils, syrups
 *
 * Flours DO convert, per the author's earlier call on the first pass.
 *
 * Run with --write to apply; default is a dry run.
 */
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')
const PACKS = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
const NEW_VERSION = {
  'fredheim-recipes-with-pictures': '1.17.0',
  'fredheim-reversal-protocol': '1.13.0',
  'fredheim-fmd-5day': '1.4.0',
}
const SPOON_ML = { tsp: 5, tbsp: 15 }

// Exact-name match (lowercased, trimmed) -> g per 100 ml. Exact rather than
// regex here because the distinction that matters — "basil, raw" converts,
// "basil, dried" does not — is too fine for pattern matching to be safe.
const DENSITY = {
  'ginger, raw': 40,               // grated
  'tomato puree, canned': 105,
  'tomato puree': 105,
  'parsley, norwegian, raw': 25,
  'dill, raw': 20,
  'chives, raw': 25,
  'basil, raw': 10,
  'sesame seeds, with shell': 60,
  'sunflower seeds': 55,
  'chia seeds': 70,
  'chia seeds (for topping)': 70,
  'flaxseeds': 70,
  'ground flaxseed': 50,           // ground is fluffier than whole
  'tahini': 100,
  'onion, red, norwegian, raw': 65,
  'onion, yellow, norwegian, raw': 65,
  'leeks, norwegian, raw': 60,
  'garlic, raw': 90,               // minced
  'avocado, raw': 95,              // mashed
  'raisins': 60,
  'date paste': 110,
  'white flour, fine': 60,
  'chickpea flour': 45,
  'potato flour': 65,
  // Fasting-plan pack. Note the seeds here split two ways: pumpkin, sesame
  // and flax are food, so they convert — while mustard, coriander,
  // fenugreek and nigella are spices and keep their spoons.
  'pumpkin seeds': 55,
  'sesame seeds': 60,
  'whole flaxseed, ground fresh': 50,
  'natural almond butter (no added oil or sugar)': 100,
}

function roundGrams(g) {
  if (g < 20) return Math.round(g)
  return Math.round(g / 5) * 5
}

const changes = []
for (const f of PACKS) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', `${f}.json`)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const r of pack.recipes) {
    const base = r.ingredients || []
    for (let k = 0; k < base.length; k++) {
      const unit = String(base[k].unit || '').toLowerCase().trim()
      if (!SPOON_ML[unit]) continue
      const key = String(base[k].name || '').toLowerCase().trim()
      const density = DENSITY[key]
      if (!density) continue
      const grams = roundGrams((base[k].quantity * SPOON_ML[unit] / 100) * density)
      changes.push({ recipe: r.title, name: base[k].name, from: `${base[k].quantity} ${unit}`, to: `${grams} g` })
      if (WRITE) {
        for (const arr of [base, r.translations?.no?.ingredients, r.translations?.sv?.ingredients]) {
          if (!arr || !arr[k]) continue
          arr[k].quantity = grams
          arr[k].unit = 'g'
        }
      }
    }
  }
  if (WRITE) {
    pack.version = NEW_VERSION[f]
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  }
}

console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'} — ${changes.length} spoon rows converted to grams\n`)
changes.sort((a, b) => a.name.localeCompare(b.name)).forEach(c =>
  console.log(`  ${c.from.padStart(10)} -> ${c.to.padStart(6)}   ${c.name.slice(0, 34).padEnd(36)} ${c.recipe.slice(0, 30)}`))

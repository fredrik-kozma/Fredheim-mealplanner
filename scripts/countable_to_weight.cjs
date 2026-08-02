/* Countable produce units (pcs / medium / large / small / big / head /
 * stalk / handful / envelope) -> grams.
 *
 * The problem: "1 pcs eggplant" scaled to a smaller household becomes
 * "0.1 pcs eggplant", which means nothing. A weight scales down to
 * something you can actually act on.
 *
 * Deliberately NOT converted, per the author:
 *   - garlic — stays countable ("fedd" reads naturally in Norwegian). Rows
 *     that spell garlic with a `pcs` unit are normalised to `clove` instead,
 *     so garlic is at least consistent with itself.
 *   - lemons — nearly every row is juice or zest ("lemon, juice of",
 *     "lemon, zest only"). "Juice of 1 lemon" is the correct instruction and
 *     grams would be nonsense for zest.
 *   - nori sheets — a sheet is the real unit.
 *   - bay leaves and pinch/dash seasonings — handled by to_taste.cjs, using
 *     the "quantity blank + to taste in the name" convention the fasting
 *     pack already uses.
 *
 * Weights are for one average piece as bought, trimmed where the recipe
 * implies it (avocado is flesh, not stone and skin).
 *
 * Run with --write to apply; default is a dry run.
 */
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')
const PACKS = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
const NEW_VERSION = {
  'fredheim-recipes-with-pictures': '1.19.0',
  'fredheim-reversal-protocol': '1.14.0',
  'fredheim-fmd-5day': '1.5.0',
}
const COUNT_UNITS = new Set(['pcs', 'medium', 'large', 'small', 'big', 'head', 'stalk', 'salads', 'handful', 'envelope'])

// Left alone entirely (see header).
const SKIP = [/garlic/i, /\blemon\b/i, /\bnori\b/i, /bay leaf|bay leaves/i]

// [regex on the EN name, { unit: grams }]. `def` applies to any size word
// not listed. Size words matter: a large onion is not a small one.
const WEIGHTS = [
  [/onion, yellow|onion, red|^onion,|medium onion|onion, roughly/i, { small: 70, medium: 110, large: 150, def: 110 }],
  [/spring onion/i, { small: 10, def: 15 }],
  [/carrot/i, { small: 50, medium: 70, large: 100, big: 100, def: 70 }],
  [/bell pepper|red or yellow bell pepper/i, { medium: 150, large: 200, def: 150 }],
  [/cucumber/i, { def: 300 }],
  [/tomatoes, sun-dried/i, { def: 3 }],
  [/tomato/i, { medium: 100, large: 150, def: 100 }],
  [/avocado/i, { def: 150 }],                       // flesh
  [/sweet potato/i, { def: 200 }],
  [/potato/i, { medium: 120, def: 120 }],
  [/leek/i, { def: 200 }],
  [/celery stalk/i, { def: 40 }],
  [/red beet/i, { def: 100 }],
  [/parsnip/i, { def: 120 }],
  [/eggplant/i, { small: 150, big: 350, def: 250 }],
  [/chili/i, { def: 15 }],
  [/apple/i, { def: 150 }],
  [/\bpears?\b/i, { def: 170 }],
  [/radish/i, { def: 10 }],
  [/chinese cabbage/i, { def: 800 }],
  [/head cabbage/i, { def: 900 }],
  [/romaine lettuce/i, { def: 300 }],
  [/cauliflower/i, { def: 600 }],
  [/broccoli/i, { def: 350 }],
  [/squash, zucchini/i, { def: 200 }],
  [/pomegranate/i, { def: 280 }],
  [/ginger/i, { def: 30 }],
  [/medjool date/i, { def: 24 }],
  [/deglet date|date, dried/i, { def: 8 }],
  [/^bread,/i, { def: 35 }],                        // a slice
  [/thyme, raw/i, { def: 2 }],                      // a sprig
  [/parsley|coriander, raw/i, { handful: 15, def: 15 }],
  [/basil/i, { handful: 10, def: 10 }],
  [/chives/i, { handful: 10, def: 10 }],
  [/spinach/i, { handful: 30, def: 30 }],
  [/yeast, dry yeast/i, { envelope: 11 }],          // Norwegian pose
]

function weightFor(name, unit) {
  for (const [re, table] of WEIGHTS) {
    if (!re.test(name)) continue
    const g = table[unit] ?? table.def
    return g == null ? null : g
  }
  return null
}

const changes = []
const garlicFixed = []
const unmatched = new Map()

for (const f of PACKS) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', `${f}.json`)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const r of pack.recipes) {
    const base = r.ingredients || []
    for (let k = 0; k < base.length; k++) {
      const unit = String(base[k].unit || '').toLowerCase().trim()
      if (!COUNT_UNITS.has(unit)) continue
      const name = String(base[k].name || '')

      // Garlic keeps its count but gets a consistent unit.
      if (/garlic/i.test(name)) {
        if (unit !== 'clove') {
          garlicFixed.push({ recipe: r.title, name, from: `${base[k].quantity} ${unit}` })
          if (WRITE) for (const arr of [base, r.translations?.no?.ingredients, r.translations?.sv?.ingredients]) {
            if (arr?.[k]) arr[k].unit = 'clove'
          }
        }
        continue
      }
      if (SKIP.some(re => re.test(name))) continue

      const perPiece = weightFor(name, unit)
      if (perPiece == null) {
        unmatched.set(`${name.toLowerCase()}  [${unit}]`, (unmatched.get(`${name.toLowerCase()}  [${unit}]`) || 0) + 1)
        continue
      }
      const grams = Math.round(base[k].quantity * perPiece)
      changes.push({ recipe: r.title, name, from: `${base[k].quantity} ${unit}`, to: `${grams} g` })
      if (WRITE) for (const arr of [base, r.translations?.no?.ingredients, r.translations?.sv?.ingredients]) {
        if (!arr?.[k]) continue
        arr[k].quantity = grams
        arr[k].unit = 'g'
      }
    }
  }
  if (WRITE) {
    pack.version = NEW_VERSION[f]
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  }
}

console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'} — ${changes.length} countable rows -> grams`)
console.log(`garlic rows normalised pcs -> clove: ${garlicFixed.length}`)
console.log(`UNMATCHED (no weight rule): ${[...unmatched.values()].reduce((a, b) => a + b, 0)} rows, ${unmatched.size} names`)
if (unmatched.size) {
  console.log('\n!! need a rule or an explicit skip:')
  ;[...unmatched.entries()].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`   ${String(c).padStart(3)}  ${n}`))
}
if (process.argv.includes('--list')) {
  console.log('\n--- conversions ---')
  changes.sort((a, b) => a.name.localeCompare(b.name)).forEach(c =>
    console.log(`  ${c.from.padStart(12)} -> ${c.to.padStart(7)}   ${c.name.slice(0, 38).padEnd(40)} ${c.recipe.slice(0, 26)}`))
}

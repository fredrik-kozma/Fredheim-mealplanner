/* Convert bulk-volume ingredient amounts (dl / ml / l / cup) to grams, so
 * solids are measured consistently by weight across every recipe.
 *
 * Scope, per the author:
 *   - solids, flours and thick/sticky things  -> grams
 *   - liquids (water, milks, oils, juices, broths, syrups)  -> stay volume
 *   - powders and spices  -> stay volume (nutritional yeast, psyllium husk)
 *   - tsp / tbsp amounts are never touched: those are spice-scale measures
 *     and reading "3 g" on a spice line is worse, not better
 *
 * Densities are g per 100 ml (= g per dl) for the ingredient in the state
 * the recipe uses it: chopped vegetables, whole nuts, dry grains, drained
 * tins. They are cooking-reference figures, deliberately rounded — the point
 * is a sane, repeatable weight, not four significant figures.
 *
 * EN / NO / SV ingredient arrays are aligned by index (verified: 0 length
 * mismatches, and all 462 volume rows agree on the unit across languages),
 * so each row is rewritten in all three at once.
 *
 * Run with --write to apply; default is a dry run.
 */
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')
const PACKS = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
const TO_ML = { dl: 100, ml: 1, l: 1000, cup: 240 }
// Only packs that actually changed. The FMD pack had no bulk-volume solids
// at all, so bumping it would force a needless reinstall for every user.
const NEW_VERSION = {
  'fredheim-recipes-with-pictures': '1.16.0',
  'fredheim-reversal-protocol': '1.12.0',
}

// Ordered: first match wins. null density = deliberately left as volume.
const RULES = [
  // ── liquids: stay volume ────────────────────────────────────────────────
  [/\b(water|vann|vatten)\b|aquafaba|olive water/i, null],
  [/\bjuice\b|saften/i, null],
  [/\b(oil|olje|olja)\b/i, null],
  [/\bmilk\b|melk|mjölk|non-diary|plant milk/i, null],
  [/\bbroth\b|buljong/i, null],
  [/vinegar|eddik/i, null],
  [/tamari|soy sauce|soya?saus/i, null],
  [/extract|vanilla extract/i, null],
  [/\b(syrup|sirup|honey|honning)\b|maple/i, null],
  // ── powders & spices: stay volume (author's rule) ───────────────────────
  [/nutritional yeast|næringsgjær/i, null],
  [/fibre husk|fiber husk|psyllium|fiberskall/i, null],

  // ── flours -> grams ─────────────────────────────────────────────────────
  [/whole wheat flour,\s*course|coarse/i, 50],
  [/whole wheat flour/i, 55],
  [/white flour/i, 60],
  [/oat flour/i, 40],
  [/spelt flour/i, 55],
  [/gluten flour/i, 55],
  [/buckwheat flour/i, 50],
  [/corn flour|polenta/i, 65],
  [/jyttemel|gluten-free.*flour|flour,\s*gluten-free/i, 55],

  // ── sticky / thick -> grams ─────────────────────────────────────────────
  [/tomato puree/i, 105],
  [/peanut butter/i, 105],
  [/soy yogurt/i, 100],
  [/soy mayonnaise/i, 95],
  [/sour cream/i, 100],

  // ── nuts ────────────────────────────────────────────────────────────────
  [/cashew/i, 60],
  [/almond/i, 58],
  [/walnut/i, 42],
  [/pecan/i, 40],
  [/hazelnut/i, 57],
  [/peanut/i, 60],
  [/caramelized nuts|\bnuts\b/i, 55],

  // ── seeds ───────────────────────────────────────────────────────────────
  [/sunflower seed/i, 55],
  [/sesame seed/i, 60],
  [/chia/i, 70],
  [/squash seeds|pumpkin seed/i, 55],
  [/flaxseed|linfrø/i, 70],

  // ── grains, flakes, crumbs ──────────────────────────────────────────────
  [/small oats|quick oats/i, 38],
  [/oats,\s*big|rolled oats/i, 35],
  [/oat flakes/i, 36],
  [/buckwheat/i, 68],
  [/quinoa/i, 75],
  [/whole grain rice|\brice\b/i, 80],
  [/bulgur/i, 60],
  [/bread crumbs/i, 45],

  // ── legumes ─────────────────────────────────────────────────────────────
  [/lentils,\s*red|red\/pink/i, 80],
  [/lentils/i, 80],
  [/chickpea/i, 65],
  [/kidney bean/i, 70],
  [/black bean/i, 70],
  [/white bean|cannellini/i, 70],
  [/yellow peas/i, 60],
  [/edamame/i, 60],

  // ── dried fruit ─────────────────────────────────────────────────────────
  [/raisin/i, 60],
  [/date[s]?,?\s*(dried)?/i, 65],
  [/cranberr/i, 55],
  [/coconut,\s*shredded|shredded coconut/i, 30],

  // ── fresh fruit & berries ───────────────────────────────────────────────
  [/blueberr/i, 65],
  [/raspberr/i, 50],
  [/strawberr/i, 60],
  [/blackberr/i, 60],
  [/lingoberr|lingonberr/i, 60],
  [/pineapple/i, 70],
  [/watermelon|honeydew|melon/i, 65],
  [/\bgrape\b/i, 65],
  [/\bapple\b/i, 60],
  [/\bpear\b/i, 60],
  [/\bplum\b/i, 60],

  // ── vegetables ──────────────────────────────────────────────────────────
  [/grated courgette/i, 90],
  [/sweet potato/i, 60],
  [/cauliflower/i, 40],
  [/broccoli/i, 40],
  [/head cabbage|cabbage/i, 30],
  [/cucumber/i, 55],
  [/\bkale\b/i, 25],
  [/spinach/i, 15],
  [/arugula|ruccola/i, 10],
  [/bell pepper|paprika/i, 60],
  [/squash|zucchini|courgette/i, 55],
  [/\bcorn\b/i, 70],
  [/cherry tomato/i, 60],
  [/tomato,\s*(canned|chopped)|tetrapak/i, 100],
  [/olive[s]?,/i, 65],
  [/bean sprout|mung/i, 40],
  [/\bonion\b/i, 65],

  // ── herbs ───────────────────────────────────────────────────────────────
  [/parsley|persille/i, 25],
  [/basil/i, 10],
  [/\bdill\b/i, 20],
  [/chives/i, 25],
]

function densityFor(name) {
  for (const [re, d] of RULES) if (re.test(name)) return { matched: true, density: d }
  return { matched: false, density: undefined }
}

// Weights people can actually measure: nearest 5 g once we're past 20 g.
function roundGrams(g) {
  if (g < 20) return Math.round(g)
  return Math.round(g / 5) * 5
}

const changes = []
const unmatched = new Map()
const keptVolume = new Map()

for (const f of PACKS) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', `${f}.json`)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const r of pack.recipes) {
    const base = r.ingredients || []
    for (let k = 0; k < base.length; k++) {
      const unit = String(base[k].unit || '').toLowerCase().trim()
      if (!TO_ML[unit]) continue
      const name = base[k].name || ''
      const { matched, density } = densityFor(name)
      if (!matched) {
        unmatched.set(name.toLowerCase(), (unmatched.get(name.toLowerCase()) || 0) + 1)
        continue
      }
      if (density == null) {
        keptVolume.set(name.toLowerCase(), (keptVolume.get(name.toLowerCase()) || 0) + 1)
        continue
      }
      const ml = base[k].quantity * TO_ML[unit]
      const grams = roundGrams((ml / 100) * density)
      changes.push({
        pack: f, recipe: r.id, title: r.title, idx: k, name,
        from: `${base[k].quantity} ${unit}`, to: `${grams} g`, grams, density,
      })
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
    // Bump so AutoInstallDefaultPack actually reinstalls — it compares
    // versions, so edited content under an unchanged version never reaches
    // anyone who already has the pack.
    if (NEW_VERSION[f]) pack.version = NEW_VERSION[f]
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  }
}

console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'} — ${changes.length} rows converted to grams`)
console.log(`kept as volume (liquids/powders): ${[...keptVolume.values()].reduce((a, b) => a + b, 0)} rows, ${keptVolume.size} names`)
console.log(`UNMATCHED (no rule): ${[...unmatched.values()].reduce((a, b) => a + b, 0)} rows, ${unmatched.size} names`)
if (unmatched.size) {
  console.log('\n!! these need a rule before applying:')
  ;[...unmatched.entries()].sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`   ${String(c).padStart(3)}  ${n}`))
}

if (process.argv.includes('--list')) {
  console.log('\n--- every conversion ---')
  changes.sort((a, b) => a.name.localeCompare(b.name))
  changes.forEach(c => console.log(
    `  ${c.from.padStart(9)} -> ${c.to.padStart(7)}  (${c.density} g/dl)  ${c.name.slice(0, 38).padEnd(40)} ${c.title.slice(0, 28)}`
  ))
}

// Sanity flags: anything that lands implausibly large or small is worth a
// human look before it ships.
const odd = changes.filter(c => c.grams > 1500 || c.grams < 2)
if (odd.length) {
  console.log(`\nOUTLIERS to eyeball (${odd.length}):`)
  odd.sort((a, b) => b.grams - a.grams).forEach(c =>
    console.log(`   ${c.from.padStart(9)} -> ${String(c.grams).padStart(5)} g  ${c.name.slice(0, 34).padEnd(36)} ${c.title.slice(0, 30)}`))
}

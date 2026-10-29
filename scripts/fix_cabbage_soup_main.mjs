#!/usr/bin/env node
/*
 * One-off: the Cabbage Soup (fr-27) becomes a lunch/dinner main.
 *
 * With the can of white beans (add_beans_to_cabbage_soup.mjs) it is a meal,
 * so Fredrik approved it as lunch/dinner; the MEAL_OVERRIDES entry that made
 * it a side is gone from scripts/lib/recipeLabels.mjs.
 *
 *   - mealTypes ['side'] -> ['lunch', 'dinner']
 *   - Swedish method: Norwegian words and turns of phrase put into Swedish
 *     ("trekke", "ställ till sidan", "kraften", "smaka av ... med kryddor")
 *
 *   - bumps the pack's minor version so installed copies update
 *
 * Run afterwards:
 *   npm run label-recipes -- --recipe fr-27 --write
 *   node scripts/build_salt_levels.mjs --write
 * Re-running is harmless.
 */
import fs from 'node:fs'

const PACK = 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json'
const ID = 'fr-27'
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === ID)
if (!r) throw new Error(`${ID} not found`)

const SV = [
  ['och ställ till sidan.', 'och ställ åt sidan.'],
  ['Tillsätt därefter kraften (buljongvattnet), tomater och salt', 'Tillsätt därefter buljongvattnet, tomaterna och saltet'],
  ['Tillsätt kryddorna i soppan och låt det sjuda i cirka 15 minuter för att trekke till sig smaken.',
    'Tillsätt kryddorna i soppan och låt den sjuda i cirka 15 minuter så att smakerna får dra.'],
  ['Smaka av soppan med kryddor.', 'Smaka av soppan och krydda efter behov.'],
]

let changed = 0
if (JSON.stringify(r.mealTypes) !== JSON.stringify(['lunch', 'dinner'])) { r.mealTypes = ['lunch', 'dinner']; changed++ }
const steps = r.translations.sv.steps
for (const [from, to] of SV) {
  const i = steps.findIndex(s => s.includes(from))
  if (i < 0) { if (!steps.some(s => s.includes(to))) throw new Error(`sv: "${from}" not found; edit by hand`); continue }
  steps[i] = steps[i].replace(from, to)
  changed++
}

const from = pack.version
if (changed) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
}
console.log(`${ID} "${r.title}": ${changed} change(s); mealTypes ${r.mealTypes.join(', ')}; pack ${from} -> ${pack.version}`)
for (const s of steps) console.log(`  sv: ${s}`)

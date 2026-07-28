/* Wraps measurements that are ALREADY written into instruction text with
   {{…}} so they scale with the serving count (src/utils/scaleStepText.jsx).

   Curated whitelist of (recipe, step) pairs — only steps whose numbers are
   genuine batch quantities. Everything else in the pack was reviewed and
   deliberately left alone:
     per-item   "100 g for each burger", "45 g each piece", "1/3 cup portions"
     equipment  "pour into 1.5 L bread forms", "800 g for the small molds"
     fixed      "a ball the size of 2 tbsp"
     ranges     "300-500 ml total, to consistency"
     examples   "take part of the soup (for eksempel 1L)"
   Marking any of those would scale a number that must stay put.

   Runs across EN/NO/SV at once: the digits and unit tokens are the same shape
   in every language, so one pattern covers all three.
*/
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')

// recipeId → [step indexes to mark]
const WHITELIST = {
  'fr-29': [2],                                  // pour out 8 dl on a tray
  'cucumber-and-sunflowerseed-dressing': [0],    // 500 ml of the soy milk
  'fr-64': [1],                                  // 2 tbsp of flour
  'kidney-bean-stew': [0],                       // ½ tsp oil + 1 tbsp water
  'fr-94': [0],
  'fr-101': [1],
  'marikas-summer-salad': [3],                   // 3 tbsp of the dressing
  'potato-and-spinach-soup': [1],
  'pumpkin-soup': [0],                           // the 1 l of water
  'red-lentil-soup': [0],
  'stuffed-paprika-with-tofu': [0],              // 4 tbsp water
  'fr-172': [1],
  'tofu-form': [0],                              // the 0,5 L soy milk
  'fr-184': [0],                                 // step 3 reuses the same oil —
}                                                // marking both would double it

// Longest unit tokens first so "tbsp" wins over "ts", "ml" over "l".
const MEASUREMENT =
  /(\d+(?:[.,]\d+)?|[½¼¾])\s*(tbsp|tsp|msk|tsk|kopp|cup|kg|ml|dl|ss|ts|g|l)\b/gi

const VULGAR = { '½': '0.5', '¼': '0.25', '¾': '0.75' }

function markStep(text) {
  let count = 0
  const out = text.replace(MEASUREMENT, (whole, qty, unit, offset, full) => {
    // Leave anything already inside {{…}} alone.
    const before = full.slice(0, offset)
    const opens = (before.match(/\{\{/g) || []).length
    const closes = (before.match(/\}\}/g) || []).length
    if (opens > closes) return whole
    count++
    return `{{${VULGAR[qty] || qty} ${unit}}}`
  })
  return { out, count }
}

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
let total = 0

for (const recipe of pack.recipes) {
  const steps = WHITELIST[recipe.id]
  if (!steps) continue
  const langs = [['en', recipe.steps]]
  for (const l of ['no', 'sv']) {
    if (recipe.translations?.[l]?.steps) langs.push([l, recipe.translations[l].steps])
  }
  for (const [lang, arr] of langs) {
    for (const si of steps) {
      if (arr[si] == null) continue
      const { out, count } = markStep(arr[si])
      if (!count) continue
      arr[si] = out
      total += count
      console.log(`  ${recipe.id} ${lang}[${si}] +${count}`)
      console.log(`      ${out.slice(0, 118)}`)
    }
  }
}

if (WRITE) {
  pack.version = '1.11.0'
  fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`\nWROTE fredheim-recipes-with-pictures.json -> ${pack.version}`)
}
console.log(`\n${total} measurement(s) marked — ${WRITE ? 'APPLIED' : 'dry run (--write to apply)'}`)

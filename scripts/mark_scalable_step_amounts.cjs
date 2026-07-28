/* TRIAL: marks scalable quantities inside instruction text with {{…}} so they
   follow the reader's serving count (see src/utils/scaleStepText.jsx).

   Only amounts that genuinely scale with the batch are marked. Deliberately
   NOT marked, because scaling them would give wrong instructions:
     - per-item amounts   "100 g for each burger", "45 g each piece"
     - equipment sizes    "pour into 1.5 L bread forms"
     - rates              "add water 1 tbsp at a time"
     - adjustments        "add 1–2 tbsp extra water if too thick"
     - fixed portions     "balls the size of 2 tbsp", "1/3 cup portions"
   Times and temperatures are never touched.

   Replacements are exact strings (not regex) so a near-miss fails loudly
   rather than mangling text. Re-running is safe: already-marked text no
   longer matches.
*/
const fs = require('fs')
const path = require('path')

// recipeId → [ [lang, stepIndex, findExact, replaceWith], … ]
// lang 'en' = top-level steps; otherwise translations[lang].steps
const EDITS = {
  'cauliflower-soup': [
    ['en', 1, '1 tsp of olive oil and 2 tbsp of water', '{{1 tsp}} of olive oil and {{2 tbsp}} of water'],
    ['no', 1, '1 ts olivenolje og 2 ss vann', '{{1 ts}} olivenolje og {{2 ss}} vann'],
  ],
  'golden-soup': [
    ['en', 0, '2,5 dl water', '{{2,5 dl}} water'],
    ['no', 0, '2,5 dl vann', '{{2,5 dl}} vann'],
  ],
  'orn-2': [
    ['en', 0, 'the 80 ml of slightly warmed water', 'the {{80 ml}} of slightly warmed water'],
    ['no', 0, 'de 80 ml lett oppvarmet vann', 'de {{80 ml}} lett oppvarmet vann'],
    ['sv', 0, 'de 80 ml lätt uppvärmt vatten', 'de {{80 ml}} lätt uppvärmt vatten'],
  ],
  'orn-5': [
    ['en', 3, '3 tbsp boiling water', '{{3 tbsp}} boiling water'],
    ['no', 3, '3 ss kokende vann', '{{3 ss}} kokende vann'],
    ['sv', 3, '3 msk kokande vatten', '{{3 msk}} kokande vatten'],
  ],
}

const PACK_FILES = [
  ['fredheim-recipes-with-pictures.json', '1.10.2'],
  ['fredheim-reversal-protocol.json', '1.11.3'],
]

let applied = 0
const problems = []

for (const [file, newVersion] of PACK_FILES) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', file)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  let touched = false

  for (const recipe of pack.recipes) {
    const edits = EDITS[recipe.id]
    if (!edits) continue
    for (const [lang, idx, find, repl] of edits) {
      const steps = lang === 'en' ? recipe.steps : recipe.translations?.[lang]?.steps
      if (!steps || steps[idx] == null) {
        problems.push(`${recipe.id} ${lang}[${idx}] — step missing`)
        continue
      }
      if (steps[idx].includes(repl)) continue          // already marked
      if (!steps[idx].includes(find)) {
        problems.push(`${recipe.id} ${lang}[${idx}] — text not found: "${find}"`)
        continue
      }
      steps[idx] = steps[idx].replace(find, repl)
      applied++
      touched = true
      console.log(`  ${recipe.id} ${lang}[${idx}] ✓`)
    }
  }

  if (touched) {
    pack.version = newVersion
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
    console.log(`${file} -> ${newVersion}`)
  }
}

console.log(`\nmarked ${applied} amount(s) across ${Object.keys(EDITS).length} recipes`)
if (problems.length) {
  console.log('\nPROBLEMS:')
  for (const p of problems) console.log('  ✗', p)
  process.exitCode = 1
}

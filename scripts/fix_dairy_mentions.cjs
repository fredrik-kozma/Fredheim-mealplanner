/*
 * One-off: the last dairy mentions in the Fredheim Kitchen method text.
 *   fr-49 (Greek salad)  serve with the app's own tofu feta; no "except feta"
 *   burger-buns          brush with water or plant milk
 *   fr-123 (polenta)     water or plant milk; olive oil or plant butter
 *                        (Swedish "smjuk" was a mistranslated butter)
 * Edits text in place and bumps the pack version.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

function edit(file, replacements) {
  let text = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) {
    const parts = text.split(from)
    if (parts.length !== 2) throw new Error(`${path.basename(file)}: expected one match, got ${parts.length - 1}: ${from}`)
    text = parts.join(to)
  }
  fs.writeFileSync(file, text)
}

const SV = [
  ['Lägg alla ingredienserna (förutom från feta) i en skål och blanda försiktigt ihop.', 'Lägg alla ingredienserna i en skål och blanda försiktigt ihop.'],
  ['Servera feta separat.', 'Servera med Tofufeta.'],
  ['Pensla toppene med vatten eller mjölk,', 'Pensla toppene med vatten eller växtmjölk,'],
  ['Koka upp vatten eller mjölk tillsammans med salt.', 'Koka upp vatten eller växtmjölk tillsammans med salt.'],
  ['rör du i olivolja eller smjuk och honung.', 'rör du i olivolja eller växtbaserat smör och honung.'],
]

edit(path.join(ROOT, 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json'), [
  ['"version": "1.81.0"', '"version": "1.82.0"'],
  ['Put all the ingredients (except feta) into a mixing bowl', 'Put all the ingredients into a mixing bowl'],
  ['Serve feta cheese separately.', 'Serve with Tofu Feta Cheese.'],
  ['Ha alle ingrediensene (bortsett fra feta) i en bolle', 'Ha alle ingrediensene i en bolle'],
  ['Server feta separat.', 'Server med Tofu fetaost.'],
  ['Brush the tops with water or milk,', 'Brush the tops with water or plant milk,'],
  ['Pensle toppene med vann eller melk,', 'Pensle toppene med vann eller plantemelk,'],
  ['Bring the water or milk to a boil, with the salt.', 'Bring the water or plant milk to a boil, with the salt.'],
  ['stir in the olive oil or butter and honey.', 'stir in the olive oil or plant butter and honey.'],
  ['Kok opp vann eller melk sammen med salt.', 'Kok opp vann eller plantemelk sammen med salt.'],
  ['rører du inn olivenolje eller smør og honning.', 'rører du inn olivenolje eller plantesmør og honning.'],
  ...SV,
])

// The Swedish translation source these steps came from, so a re-apply can't bring them back.
edit(path.join(ROOT, 'scripts', 'data', 'sv-translations.json'), SV)

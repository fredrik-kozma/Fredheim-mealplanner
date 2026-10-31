/*
 * One-off: no vinegar in any app recipe, lemon (or lime) juice instead.
 *   hb-3             white wine vinegar row -> lemon juice; step
 *   hb-7             rice vinegar row -> lime juice; step
 *   fr-33            step text only (the lemon juice row is already there)
 *   pickled onions   drop "vinegar can sub in" from the notes
 *   kale-avocado     Swedish steps: "röda vinägerna" was a mistranslated radishes
 * Edits text in place (the packs' row formatting differs) and bumps the versions.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PACKS = path.join(ROOT, 'recipe-packs-template', 'packs')

function edit(file, replacements) {
  let text = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) {
    const parts = text.split(from)
    if (parts.length !== 2) throw new Error(`${path.basename(file)}: expected one match, got ${parts.length - 1}: ${from}`)
    text = parts.join(to)
  }
  fs.writeFileSync(file, text)
}

// The two steps are a few lines apart, and "Garnering med ." may not be unique.
function fixKaleSv(file) {
  let text = fs.readFileSync(file, 'utf8')
  const re = /Blanda i purjolök, tomater och några av röda vinägerna, och hold av några till garnering\.("[\s\S]{0,200}?")Garnering med \./
  if (!re.test(text)) throw new Error(`${path.basename(file)}: kale-avocado steps not found`)
  text = text.replace(re, 'Blanda i purjolök, tomater och några av rädisorna, och håll av några till garnering.$1Garnera med rädisor.')
  fs.writeFileSync(file, text)
}

const STEP_FR33 = [
  ['Blend cashew, water, apple cider vinegar and lemon juice until smooth.', 'Blend cashew, water and lemon juice until smooth.'],
  ['Kjør cashewnøtter, vann, eplecidereddik og sitronsaft til det er glatt.', 'Kjør cashewnøtter, vann og sitronsaft til det er glatt.'],
  ['Mixa cashewnötter, vatten, eplecidervinäger och citronsaft tills det är slät.', 'Mixa cashewnötter, vatten och citronsaft tills det är slät.'],
]

const fredheim = path.join(PACKS, 'fredheim-recipes-with-pictures.json')
edit(fredheim, [
  ['"version": "1.80.0"', '"version": "1.81.0"'],
  ...STEP_FR33,
  [' A pinch of sugar balances the acidity if you want it less sharp, and white or red wine vinegar can sub in for lemon juice for a more classic pickled flavor.', ' A pinch of sugar balances the acidity if you want it less sharp.'],
  [' En klype sukker balanserer syren hvis du vil ha den mildere, og hvit- eller rødvinseddik kan erstatte sitronsaft for en mer klassisk syltesmak.', ' En klype sukker balanserer syren hvis du vil ha den mildere.'],
  [' En nypa socker balanserar syran om du vill ha den mildare, och vit- eller rödvinsvinäger kan ersätta citronjuice för en mer klassisk syrad smak.', ' En nypa socker balanserar syran om du vill ha den mildare.'],
])
fixKaleSv(fredheim)

edit(path.join(PACKS, 'healthy-basics.json'), [
  ['"version": "1.1.0"', '"version": "1.2.0"'],
  ['{ "quantity": 1, "unit": "tbsp", "ingredient": "white-wine-vinegar", "name": "White wine vinegar" }', '{ "quantity": 1, "unit": "tbsp", "ingredient": "lemon-juice", "name": "Lemon juice", "note": "for the poaching water" }'],
  ['Bring a deep pan of water to a gentle simmer and add the white wine vinegar.', 'Bring a deep pan of water to a gentle simmer and add the lemon juice for the poaching water.'],
  ['{ "quantity": 1, "unit": "tbsp", "ingredient": "rice-vinegar", "name": "Rice vinegar" }', '{ "quantity": 1, "unit": "tbsp", "ingredient": "lime-juice", "name": "Lime juice" }'],
  ['Mix soy sauce, sesame oil, rice vinegar, and honey in a small bowl.', 'Mix soy sauce, sesame oil, lime juice, and honey in a small bowl.'],
])

// The Swedish translation source these steps came from, so a re-apply can't bring them back.
const svSource = path.join(ROOT, 'scripts', 'data', 'sv-translations.json')
edit(svSource, [STEP_FR33[2]])
fixKaleSv(svSource)

console.log('No vinegar: packs and sv-translations updated.')

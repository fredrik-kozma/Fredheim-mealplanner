/* Strips the prose out of the Lemony Chickpea Hummus ingredient names.
 *
 * "lemon juice, freshly squeezed (about 2 lemons)" is correct at four
 * servings and wrong at six — the amount scales, the parenthetical does
 * not — so the note becomes a lie the moment anyone changes the portions.
 * Long names also crowd the shopping list.
 *
 * Nothing is thrown away, only moved: draining and keeping the liquid is
 * now stated in the step that does it, and "warm" already lives in the
 * notes where it belongs as technique.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'lemony-chickpea-hummus')
if (!r) throw new Error('recipe not found')

// index -> { en, no, sv }. Indices are aligned across all three lists.
const NAMES = {
  0: { en: 'chickpeas, cooked', no: 'kikerter, kokte', sv: 'kikärtor, kokta' },
  1: { en: 'lemon juice', no: 'sitronsaft', sv: 'citronjuice' },
  4: { en: 'chickpea cooking liquid', no: 'kokevann fra kikerter', sv: 'kokvatten från kikärtor' },
}

const lists = { en: r.ingredients, no: r.translations.no.ingredients, sv: r.translations.sv.ingredients }
for (const [i, byLang] of Object.entries(NAMES)) {
  for (const [lang, name] of Object.entries(byLang)) {
    const line = lists[lang][i]
    if (!line) throw new Error(`missing ingredient ${i} in ${lang}`)
    line.name = name
  }
}

// The draining detail moves into the step that actually uses it, so the
// cooking liquid further down the list still makes sense.
const STEPS = {
  en: [2, 'Blend: drain the chickpeas, keeping the liquid. Add them to a food processor with the flax gel, the garlic-lemon mixture, the cumin and the salt. Blend 3-4 minutes, scraping down the sides, until completely smooth.'],
  no: [2, 'Kjør glatt: hell av kikertene, men ta vare på kokevannet. Ha dem i en foodprosessor sammen med linfrøgeléen, hvitløk- og sitronblandingen, spisskummen og saltet. Kjør i 3-4 minutter, skrap ned sidene underveis, til det er helt glatt.'],
  sv: [2, 'Mixa slätt: häll av kikärtorna men spara kokvattnet. Lägg dem i en matberedare med linfrögelén, vitlöks- och citronblandningen, spiskumminen och saltet. Kör i 3-4 minuter och skrapa ner kanterna, tills det är helt slätt.'],
}
r.steps[STEPS.en[0]] = STEPS.en[1]
r.translations.no.steps[STEPS.no[0]] = STEPS.no[1]
r.translations.sv.steps[STEPS.sv[0]] = STEPS.sv[1]

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

for (const [lang, list] of Object.entries(lists)) {
  console.log(lang + ': ' + list.map(i => `${i.quantity}${i.unit} ${i.name}`).join(' | '))
}
console.log(`Pack -> ${pack.version}`)

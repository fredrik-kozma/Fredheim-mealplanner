/* orn-5 (Fudgy Carob & Date Brownies) listed its zest as "1 pcs", which
 * is the countable-unit problem in miniature: a "piece" of zest isn't a
 * thing you can measure, and scaling produced fractions of a piece.
 * Author's call: 2 tsp for the 9-serving batch.
 *
 * The ingredient now offers orange as an equal alternative to lemon —
 * the author prefers orange here — so it reads as one choice rather than
 * a substitution buried in a note. The recipe carries no chef's note at
 * all, and adding a whole section just to record that preference would
 * be more than was asked for.
 *
 * tsp is the right unit per INGREDIENT_UNITS.md: aromatics measured with
 * a spoon stay volume rather than being converted to grams.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'orn-5')
if (!r) throw new Error('orn-5 not found')
if (r.servings !== 9) throw new Error(`expected 9 servings, found ${r.servings} — the 2 tsp figure is per 9`)

const NEW_QTY = 2
const NEW_UNIT = 'tsp'

const LANGS = {
  en: {
    name: 'lemon or orange zest (optional, recommended)',
    stepFrom: 'Stir most of the walnuts in by hand. Add lemon zest if using. Spread into the tin, smooth the top, scatter remaining walnuts.',
    stepTo: 'Stir most of the walnuts in by hand. Add the lemon or orange zest if using. Spread into the tin, smooth the top, scatter remaining walnuts.',
  },
  no: {
    name: 'sitron- eller appelsinskall (valgfritt, anbefalt)',
    stepFrom: 'Rør inn det meste av valnøttene for hånd. Tilsett sitronskall hvis du bruker det. Spre i formen, glatt toppen, dryss over de resterende valnøttene.',
    stepTo: 'Rør inn det meste av valnøttene for hånd. Tilsett sitron- eller appelsinskallet hvis du bruker det. Spre i formen, glatt toppen, dryss over de resterende valnøttene.',
  },
  sv: {
    name: 'citron- eller apelsinskal (valfritt, rekommenderas)',
    stepFrom: 'Rör i större delen av valnötterna för hand. Tillsätt citronskal om du använder det. Bred ut i formen, jämna till ytan, strö resterande valnötter över.',
    stepTo: 'Rör i större delen av valnötterna för hand. Tillsätt citron- eller apelsinskalet om du använder det. Bred ut i formen, jämna till ytan, strö resterande valnötter över.',
  },
}

// One index serves every language — the arrays are index-matched.
const idx = r.ingredients.findIndex(i => /zest/i.test(i.name))
if (idx === -1) throw new Error('no zest ingredient found in orn-5')
if (r.ingredients[idx].unit !== 'pcs') {
  throw new Error(`expected the zest to still be "pcs", found "${r.ingredients[idx].unit}" — already changed?`)
}

for (const [lang, cfg] of Object.entries(LANGS)) {
  const list = lang === 'en' ? r.ingredients : r.translations?.[lang]?.ingredients
  const steps = lang === 'en' ? r.steps : r.translations?.[lang]?.steps
  if (!list || !steps) throw new Error(`missing ${lang} data`)

  list[idx].quantity = NEW_QTY
  list[idx].unit = NEW_UNIT
  list[idx].name = cfg.name

  const at = steps.indexOf(cfg.stepFrom)
  if (at === -1) throw new Error(`${lang}: step text not found:\n  ${cfg.stepFrom}`)
  steps[at] = cfg.stepTo
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`orn-5 zest: 1 pcs -> ${NEW_QTY} ${NEW_UNIT} (per ${r.servings} servings). Pack -> ${pack.version}`)
for (const lang of Object.keys(LANGS)) {
  const list = lang === 'en' ? r.ingredients : r.translations[lang].ingredients
  console.log(`  ${lang}: ${list[idx].quantity} ${list[idx].unit}  ${list[idx].name}`)
}

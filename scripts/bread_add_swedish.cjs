/* Fluffy Gluten-Free Bread: add the missing Swedish, give Norwegian its
 * description, and fix one mistranslated line.
 *
 * The recipe only ever carried a Norwegian translation, and that one had
 * no `description` — so Norwegian readers got the English blurb under a
 * Norwegian title, and Swedish readers got the whole thing in English.
 *
 * The line being corrected: Norwegian step 9 read "Innmatingen vil
 * fortsette å sette seg", which is "the feeding/input will continue to
 * set". The English is "The crumb will continue to set" — krummen. It
 * reads as machine output in a recipe people are handed on paper.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'ultimate-fluffy-vegan-gluten-free-bread')
if (!r) throw new Error('recipe not found')
if (r.translations.sv) throw new Error('Swedish already present')

// ── Norwegian: description + the crumb line ───────────────────────────
r.translations.no.description =
  'Mykt, elastisk og saftig glutenfritt brød uten melk og egg, som holder seg ferskt i flere dager. Psylliumfrøskall gir struktur, og tangzhong-metoden gir en mykhet som på bakeri.'

const CRUMB_BEFORE = 'Innmatingen vil fortsette å sette seg mens det avkjøles.'
const CRUMB_AFTER = 'Krummen fortsetter å sette seg mens det avkjøles.'
const i = r.translations.no.steps.findIndex(s => s.includes(CRUMB_BEFORE))
if (i === -1) throw new Error('crumb line not found — already fixed?')
r.translations.no.steps[i] = r.translations.no.steps[i].replace(CRUMB_BEFORE, CRUMB_AFTER)

// ── Swedish ───────────────────────────────────────────────────────────
// Index-aligned with the canonical list, including the two deliberately
// qualified lines ("till gröten") that tell the two oat-flour and two
// water entries apart.
r.translations.sv = {
  title: 'Luftigt glutenfritt bröd',
  description:
    'Mjukt, elastiskt och saftigt glutenfritt bröd utan mjölk och ägg, som håller sig färskt i flera dagar. Psylliumfröskal ger struktur, och tangzhong-metoden ger en mjukhet som på bageri.',
  ingredients: [
    { quantity: 175, unit: 'g', name: 'glutenfritt havremjöl' },
    { quantity: 25, unit: 'g', name: 'glutenfritt havremjöl till gröten' },
    { quantity: 120, unit: 'g', name: 'rismjöl' },
    { quantity: 80, unit: 'g', name: 'potatisstärkelse' },
    { quantity: 12, unit: 'g', name: 'psylliumfröskal, pulver' },
    { quantity: 10, unit: 'g', name: 'torrjäst' },
    { quantity: 5, unit: 'g', name: 'salt' },
    { quantity: 150, unit: 'ml', name: 'vatten till gröten' },
    { quantity: 15, unit: 'ml', name: 'citronjuice' },
    { quantity: 315, unit: 'ml', name: 'ljummet vatten' },
  ],
  steps: [
    'Gör gröten: blanda havremjölet till gröten med vattnet till gröten i en liten kastrull. Koka på medelvärme under ständig omrörning tills det tjocknar, ungefär 2-3 minuter. Låt svalna till rumstemperatur.',
    'Blanda alla torra ingredienser i en stor skål: havremjöl, rismjöl, potatisstärkelse, psylliumfröskal, torrjäst och salt. Vispa väl.',
    'Blanda den svalnade gröten, citronjuicen och det ljumma vattnet (38-40°C) i en annan skål.',
    'Häll de våta ingredienserna över de torra och blanda kraftigt i 4-5 minuter tills degen är kladdig men går att forma med en sked. Degen ska hålla formen och långsamt slappna av när den formas, inte rinna ut.',
    'Klä en plåt med bakplåtspapper. Forma runda bullar med blöt hand.',
    'Täck löst med plastfolie eller en fuktig handduk och låt jäsa i rumstemperatur i 45-60 minuter tills degen har jäst upp.',
    'Värm ugnen till 220°C. Grädda i 8-10 minuter på hög värme, sänk sedan till 190°C och grädda i ytterligare 18 minuter tills de är ljust gyllenbruna.',
    'Brödet är klart när det låter ihåligt om du knackar på undersidan. Innertemperaturen bör nå 96-98°C.',
    'Ta ut ur ugnen och låt svalna på galler i minst 1 timme före servering. Inkråmet fortsätter att sätta sig medan det svalnar.',
    'Förvara i en lufttät behållare; brödet håller sig mjukt och saftigt i 3-4 dagar, eller kan frysas i upp till 1 månad.',
  ],
}

// Index alignment is the whole contract for translated ingredient lists.
const n = r.ingredients.length
for (const [lang, tr] of Object.entries(r.translations)) {
  if (tr.ingredients.length !== n) throw new Error(`${lang} has ${tr.ingredients.length} ingredients, canonical has ${n}`)
  if (tr.steps.length !== r.steps.length) throw new Error(`${lang} step count mismatch`)
  tr.ingredients.forEach((ing, idx) => {
    if (ing.quantity !== r.ingredients[idx].quantity) {
      throw new Error(`${lang}[${idx}] quantity ${ing.quantity} != canonical ${r.ingredients[idx].quantity}`)
    }
  })
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log('Swedish added:', r.translations.sv.title)
console.log('Norwegian description added, crumb line corrected')
console.log('languages now:', Object.keys(r.translations).join(', '))
console.log(`Pack -> ${pack.version}`)

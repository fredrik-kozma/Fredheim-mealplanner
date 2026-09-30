/* Three corrections, all author-requested.
 *
 * 1. ADDED SUGAR, honestly. The mousse listed 0 g next to 45 ml of maple
 *    syrup. Maple syrup is an added sugar by every standard definition.
 *    45 ml x 1.32 g/ml = 59 g of syrup, at 60.5 g sugars/100 g (USDA),
 *    is 36 g for the batch — 9.0 g a serving. The dates are NOT counted:
 *    whole fruit blended into a dish is not added sugar, which is also
 *    how every other date-sweetened recipe in these packs is recorded.
 *
 * 2. DATES IN GRAMS. "5 fresh dates (or 7 small)" only holds together if
 *    a date is about 11 g — 5 x 11 = 55, 7 x 8 = 56 — so the author's own
 *    two readings agree at roughly 60 g. That is what is used. Worth
 *    knowing: large Medjool run ~24 g each, which would put five of them
 *    at 120 g, twice this. Flagged rather than guessed at.
 *
 * 3. SORT ORDER. New recipes were not appearing first under "Newest".
 *    createdAt was being continued from the pictures pack's own sequence,
 *    but the list sorts across every installed pack, and the reversal
 *    protocol's entries are stamped later — so a brand-new recipe landed
 *    77th. Both recent additions are re-stamped above the global maximum.
 *    The rule for future adds: read the max across ALL packs, not the one
 *    being written to.
 */
const fs = require('fs')
const path = require('path')

const PACK_DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TARGET = path.join(PACK_DIR, 'fredheim-recipes-with-pictures.json')

// Global newest across every pack, since that is what the list sorts by.
let globalMax = 0
for (const f of PACKS) {
  const j = JSON.parse(fs.readFileSync(path.join(PACK_DIR, f), 'utf8'))
  for (const r of j.recipes) globalMax = Math.max(globalMax, r.createdAt || 0)
}

const pack = JSON.parse(fs.readFileSync(TARGET, 'utf8'))
const mousse = pack.recipes.find(r => r.id === 'carob-black-bean-mousse')
const hummus = pack.recipes.find(r => r.id === 'lemony-chickpea-hummus')
if (!mousse || !hummus) throw new Error('recipes not found')

// ── 1. added sugar ────────────────────────────────────────────────────
const SYRUP_ML = 45
const SYRUP_DENSITY = 1.32       // g/ml
const SYRUP_SUGAR_FRACTION = 0.6046 // USDA, syrups/maple
const SERVINGS = mousse.servings
const addedSugarPerServing =
  Math.round((SYRUP_ML * SYRUP_DENSITY * SYRUP_SUGAR_FRACTION / SERVINGS) * 10) / 10

const beforeSugar = mousse.nutrition.perServing.addedSugar
mousse.nutrition.perServing.addedSugar = addedSugarPerServing

// Sanity: added sugar can never exceed total sugars.
if (addedSugarPerServing > mousse.nutrition.perServing.totalSugars) {
  throw new Error(
    `addedSugar ${addedSugarPerServing} exceeds totalSugars ${mousse.nutrition.perServing.totalSugars}`
  )
}

// ── 2. dates in grams ─────────────────────────────────────────────────
const DATE_GRAMS = 60
const DATE_NAMES = { en: 'dates, pitted', no: 'dadler, uten stein', sv: 'dadlar, urkärnade' }
const lists = {
  en: mousse.ingredients,
  no: mousse.translations.no.ingredients,
  sv: mousse.translations.sv.ingredients,
}
for (const [lang, list] of Object.entries(lists)) {
  const i = list.findIndex(x => /dad|date/i.test(x.name))
  if (i === -1) throw new Error(`date line not found in ${lang}`)
  list[i] = { quantity: DATE_GRAMS, unit: 'g', name: DATE_NAMES[lang] }
}

// The count is still the useful thing at the counter, so it moves into
// the notes rather than being lost.
const DATE_NOTE = {
  en: ' The dates are about 5 medium ones; weigh rather than count if yours are large Medjool.',
  no: ' Dadlene tilsvarer omtrent 5 middels store; vei dem heller enn å telle hvis du bruker store Medjool.',
  sv: ' Dadlarna motsvarar ungefär 5 medelstora; väg dem hellre än att räkna om du använder stora Medjool.',
}
mousse.notes += DATE_NOTE.en
mousse.translations.no.notes += DATE_NOTE.no
mousse.translations.sv.notes += DATE_NOTE.sv

// ── 3. newest-first ordering ──────────────────────────────────────────
const HOUR = 3600000
hummus.createdAt = globalMax + HOUR
mousse.createdAt = globalMax + 2 * HOUR

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(TARGET, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`addedSugar: ${beforeSugar} -> ${addedSugarPerServing} g/serving (from ${SYRUP_ML} ml maple syrup)`)
console.log(`dates: 5 pcs -> ${DATE_GRAMS} g in all three languages`)
console.log(`createdAt: global max was ${new Date(globalMax).toISOString().slice(0, 16)}`)
console.log(`  hummus -> ${new Date(hummus.createdAt).toISOString().slice(0, 16)}`)
console.log(`  mousse -> ${new Date(mousse.createdAt).toISOString().slice(0, 16)}`)
console.log(`Pack -> ${pack.version}`)

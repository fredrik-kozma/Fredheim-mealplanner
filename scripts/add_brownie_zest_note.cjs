/* orn-5 had no chef's note at all. Adds one recording why orange works
 * here, since the ingredient line now offers lemon or orange but can't
 * explain which to reach for or why.
 *
 * Written to match the pack's existing note style (see orn-14, orn-15):
 * flowing prose, practical technique, no headings.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'orn-5')
if (!r) throw new Error('orn-5 not found')
if (r.notes && r.notes.trim()) throw new Error('orn-5 already has notes — refusing to overwrite')

const NOTES = {
  en: "Zest: orange is the one to reach for. Carob is milder and fruitier than cocoa, and orange plays to that rather than cutting against it — the sharper contrast you get from lemon suits dark chocolate more than it suits carob. Lemon still works well if you want a cleaner, brighter lift. Grate the zest straight over the bowl so the aromatic oils that spray out land in the batter too, and take only the coloured layer — the white pith underneath is bitter.",
  no: "Skall: appelsin er det du bør gripe etter. Carob er mildere og fruktigere enn kakao, og appelsin spiller på det i stedet for å gå imot — den skarpere kontrasten du får fra sitron kler mørk sjokolade bedre enn den kler carob. Sitron fungerer likevel godt hvis du vil ha et renere, friskere løft. Riv skallet rett over bollen så de aromatiske oljene som spruter ut havner i røren de også, og ta bare det fargede laget — den hvite margen under er bitter.",
  sv: "Skal: apelsin är det du ska ta. Carob är mildare och fruktigare än kakao, och apelsin spelar på det i stället för att gå emot — den skarpare kontrast du får från citron passar mörk choklad bättre än den passar carob. Citron fungerar ändå bra om du vill ha ett renare, friskare lyft. Riv skalet direkt över skålen så att de aromatiska oljorna som sprutar ut hamnar i smeten också, och ta bara det färgade lagret — det vita under är beskt.",
}

r.notes = NOTES.en
for (const lang of ['no', 'sv']) {
  if (!r.translations?.[lang]) throw new Error(`missing ${lang} translation block`)
  r.translations[lang].notes = NOTES[lang]
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Added chef's note to orn-5 in en/no/sv. Pack -> ${pack.version}`)
for (const [lang, text] of Object.entries(NOTES)) console.log(`  ${lang}: ${text.slice(0, 70)}...`)

/* Two changes to orn-60 (Cashew Yogurt):
 *
 * 1. Marks the starter `scalesLinearly: false`. The app now holds its
 *    amount when the servings change and labels the row, so the reader
 *    no longer has to know from prose that this one ingredient must not
 *    be doubled.
 *
 * 2. Cuts the chef's note down to essentials. It had grown to eight
 *    paragraphs — starter scaling, choosing a starter, self-sustaining,
 *    why the date, troubleshooting, variations, yield and the RED
 *    rating. Most of that is either now shown by the app (yield,
 *    servings, tags), or is nice-to-know rather than needed to get a
 *    working batch.
 *
 * What survives is only what changes the outcome: the starter must be
 * live and unsweetened or nothing ferments at all; the amounts to use
 * when scaling, since the app now defers that decision to the reader;
 * saving your own for the next batch, which is the point of the recipe;
 * and the two failure modes that are easy to misdiagnose.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'orn-60')
if (!r) throw new Error('orn-60 not found')

// ── 1. flag the starter ──────────────────────────────────────────────────
const idx = r.ingredients.findIndex(i => /starter/i.test(i.name))
if (idx === -1) throw new Error('starter ingredient not found')
for (const list of [r.ingredients, r.translations.no.ingredients, r.translations.sv.ingredients]) {
  list[idx].scalesLinearly = false
  // The name no longer has to carry the warning — the UI shows it.
  list[idx].name = list[idx].name.replace(/\s*\((?:does not scale proportionally|skaleres ikke proporsjonalt|skalas inte proportionellt)[^)]*\)/i, '')
}

// ── 2. trim the notes ────────────────────────────────────────────────────
const NOTES = {
  en: 'The starter must say live or active cultures and be unsweetened — heat-treated yogurt contains nothing alive and simply will not ferment. It does not scale with the batch: about 45 g for a single batch, 60–70 g for a double, 80–90 g for a triple, and never below 30 g. Save the same amount of your own finished yogurt to seed the next batch; from the second generation there is no commercial yogurt in the recipe at all, and it gets better. Grainy means under-blended, not under-fermented. Thin means you judged it warm — chill it fully first.',
  no: 'Starteren må være merket levende eller aktive kulturer og være usøtet — varmebehandlet yoghurt inneholder ingenting levende og vil rett og slett ikke fermentere. Den skaleres ikke med batchen: cirka 45 g ved enkel batch, 60–70 g ved dobbel, 80–90 g ved trippel, og aldri under 30 g. Sett av like mye av din egen ferdige yoghurt til neste omgang; fra andre generasjon er det ingen kommersiell yoghurt i oppskriften i det hele tatt, og den blir bedre. Grynete betyr underblendet, ikke underfermentert. Tynn betyr at du bedømte den varm — kjøl den helt ned først.',
  sv: 'Startern måste vara märkt levande eller aktiva kulturer och vara osötad — värmebehandlad yoghurt innehåller ingenting levande och kommer helt enkelt inte att fermentera. Den skalas inte med satsen: cirka 45 g vid enkel sats, 60–70 g vid dubbel, 80–90 g vid trippel, och aldrig under 30 g. Sätt undan lika mycket av din egen färdiga yoghurt till nästa sats; från andra generationen finns ingen kommersiell yoghurt i receptet alls, och den blir bättre. Grynig betyder undermixad, inte underfermenterad. Tunn betyder att du bedömde den varm — kyl den helt först.',
}

const before = { en: r.notes.length, no: r.translations.no.notes.length, sv: r.translations.sv.notes.length }
r.notes = NOTES.en
r.translations.no.notes = NOTES.no
r.translations.sv.notes = NOTES.sv

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`orn-60 updated. Pack -> ${pack.version}`)
console.log(`  starter flagged scalesLinearly:false — "${r.ingredients[idx].name}"`)
for (const l of ['en', 'no', 'sv']) {
  const now = l === 'en' ? r.notes.length : r.translations[l].notes.length
  console.log(`  notes ${l}: ${before[l]} -> ${now} chars (${Math.round((1 - now / before[l]) * 100)}% shorter)`)
}

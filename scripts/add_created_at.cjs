/* Gives every pack recipe a stable `createdAt` so the "Newest" sort works.
 *
 * The bug: pack JSON carried no createdAt at all, and installPack falls back
 * to `r.createdAt || Date.now()`. Since a pack installs in one pass, every
 * recipe in it received the *same* timestamp — 234 recipes across three
 * packs held exactly three distinct values. So "Newest" could not tell any
 * two recipes in a pack apart, and newly added ones never rose to the top.
 * Worse, every version bump re-stamped the whole pack, so the sort really
 * meant "when did you last update this pack", not "when was this added".
 *
 * The fix: bake a real createdAt into the JSON. installPack already prefers
 * it over the fallback, so this self-heals on the next pack update with no
 * code change.
 *
 * Ordering. Within a pack, array order is genuine append order — scripts
 * push new recipes onto the end — so that is preserved exactly. Between
 * packs the relative order is a judgement call, since nothing records when
 * each pack was authored; this uses the sequence the collection actually
 * grew in: the original Fredheim collection, then the fasting plan, then
 * the reversal protocol, with today's batch of 12 last.
 *
 * Timestamps are spaced an hour apart back from a FIXED anchor rather than
 * Date.now(), so re-running this produces an identical file instead of
 * churning 234 values on every run. The value is never displayed anywhere
 * in the UI — it is purely a sort key — so the spacing carries no claim
 * about real authoring dates.
 */
const fs = require('fs')
const path = require('path')

const PACK_DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')

// Oldest first. Recipes inside each entry keep their existing array order.
const ORDER = [
  'fredheim-recipes-with-pictures.json',
  'fredheim-fmd-5day.json',
  'fredheim-reversal-protocol.json',
]

const ANCHOR = Date.UTC(2026, 7, 2, 12, 0, 0) // newest recipe lands here
const STEP_MS = 60 * 60 * 1000

// Build the global ordered id list first so spacing is computed once.
const packs = {}
const ordered = []
for (const file of ORDER) {
  const p = path.join(PACK_DIR, file)
  packs[file] = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const r of packs[file].recipes) ordered.push({ file, id: r.id })
}

const total = ordered.length
const stamps = new Map()
ordered.forEach((entry, i) => {
  // Last item in the list gets ANCHOR; each earlier one is an hour before.
  stamps.set(`${entry.file}::${entry.id}`, ANCHOR - (total - 1 - i) * STEP_MS)
})

let changed = 0
const summary = []
for (const file of ORDER) {
  const pack = packs[file]
  let packChanged = false
  for (const r of pack.recipes) {
    const want = stamps.get(`${file}::${r.id}`)
    if (r.createdAt !== want) { r.createdAt = want; packChanged = true; changed++ }
  }
  if (packChanged) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
    pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
    fs.writeFileSync(path.join(PACK_DIR, file), JSON.stringify(pack, null, 2) + '\n', 'utf8')
  }
  const first = pack.recipes[0], last = pack.recipes[pack.recipes.length - 1]
  summary.push(`${file.replace('fredheim-', '').replace('.json', '').padEnd(24)} ${String(pack.recipes.length).padStart(3)} recipes  ${pack.version}  ${new Date(first.createdAt).toISOString().slice(0, 16)} -> ${new Date(last.createdAt).toISOString().slice(0, 16)}`)
}

console.log(`Set createdAt on ${changed} recipes\n`)
summary.forEach(s => console.log('  ' + s))
console.log('\nNewest 12 (should be the batch just added):')
const rev = packs['fredheim-reversal-protocol.json'].recipes
rev.slice(-12).forEach(r => console.log(`  ${new Date(r.createdAt).toISOString().slice(0, 16)}  ${r.id}  ${r.title.slice(0, 44)}`))

/* Bakes photos the author attached in-app into the pack JSON.
 *
 * Reads <scratchpad>/imgs/<recipe-id>.dataurl (lifted out of the running
 * app's IndexedDB) and writes each into whichever pack owns that recipe
 * id. Only recipes with a matching file are touched.
 *
 * Every file is validated as a complete image before anything is
 * written — correct magic bytes at the front and the right terminator at
 * the end — so a truncated transfer can't silently ship a broken photo.
 *
 * Packs whose content actually changed get a minor version bump. That
 * bump matters for more than distribution: an in-app photo is stored as
 * a `userEdited` recipe in the user's own store, and a version change is
 * what retires that local copy in favour of the pack's, so the photo
 * stops being carried in their browser once it lives in the JSON.
 *
 * Generic on purpose — it applies whatever ids happen to be sitting in
 * the imgs directory, so the next batch needs no new script.
 */
const fs = require('fs')
const path = require('path')

const IMG_DIR =
  'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/imgs'
const PACK_DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = [
  'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol.json',
  'fredheim-fmd-5day.json',
]

function validateImage(dataUrl, file) {
  const m = /^data:image\/(jpeg|png);base64,/.exec(dataUrl)
  if (!m) throw new Error(`not a jpeg/png data URL: ${file}`)
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
  if (m[1] === 'jpeg') {
    if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) throw new Error(`not a JPEG: ${file}`)
    if (!(buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9)) throw new Error(`truncated JPEG (no EOI): ${file}`)
  } else {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    if (!buf.subarray(0, 8).equals(png)) throw new Error(`not a PNG: ${file}`)
    if (buf.subarray(-8, -4).toString('ascii') !== 'IEND') throw new Error(`truncated PNG (no IEND): ${file}`)
  }
  return buf.length
}

const images = {}
for (const file of fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.dataurl'))) {
  const id = file.replace(/\.dataurl$/, '')
  const dataUrl = fs.readFileSync(path.join(IMG_DIR, file), 'utf8').trim()
  validateImage(dataUrl, file)
  images[id] = dataUrl
}
if (Object.keys(images).length === 0) throw new Error(`no .dataurl files found in ${IMG_DIR}`)

function bumpMinor(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ''))
  if (!m) throw new Error(`unexpected pack version format: ${version}`)
  return `${m[1]}.${Number(m[2]) + 1}.0`
}

const applied = []
const seen = new Set()
for (const file of PACKS) {
  const p = path.join(PACK_DIR, file)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  let changed = false
  for (const r of pack.recipes) {
    const img = images[r.id]
    if (!img) continue
    seen.add(r.id)
    if (r.imageUrl === img) continue
    r.imageUrl = img
    changed = true
    applied.push(`${r.id.padEnd(8)} ${String(Math.round(img.length / 1024)).padStart(4)} KB  ${file.replace('fredheim-', '').replace('.json', '').padEnd(22)} ${r.title.slice(0, 40)}`)
  }
  if (changed) {
    pack.version = bumpMinor(pack.version)
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
    console.log(`WROTE ${file} -> ${pack.version}`)
  } else {
    console.log(`unchanged ${file} (version left at ${pack.version})`)
  }
}

console.log(`\nApplied ${applied.length} images:`)
applied.forEach(a => console.log('  ' + a))

const orphans = Object.keys(images).filter(id => !seen.has(id))
if (orphans.length) console.log(`\nWARNING — no recipe found for: ${orphans.join(', ')}`)

// Cross-check: every recipe in every pack should now have a photo.
let missing = 0
for (const file of PACKS) {
  const pack = JSON.parse(fs.readFileSync(path.join(PACK_DIR, file), 'utf8'))
  for (const r of pack.recipes) if (!r.imageUrl) { console.log(`  still missing: ${r.id} ${r.title}`); missing++ }
}
console.log(missing === 0 ? '\nAll recipes across all packs now have an image.' : `\n${missing} recipes still without an image.`)

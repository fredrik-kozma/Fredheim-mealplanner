/* Injects the photos the author added in-app for the 12 recipes from the
 * Ciorbă/rye/pudding batch (orn-30..orn-41), which shipped with
 * imageUrl: null.
 *
 * Reads <scratchpad>/imgs/<id>.dataurl — lifted out of the running app's
 * IndexedDB — and sets each matching recipe's imageUrl. Only recipes with
 * a corresponding file are touched; every other field and every other
 * recipe is left exactly as-is.
 *
 * Each file is validated as a complete JPEG (SOI header + EOI trailer)
 * before anything is written, so a truncated transfer can't silently
 * ship a broken image.
 */
const fs = require('fs')
const path = require('path')

const IMG_DIR =
  'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/imgs'
const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const NEW_VERSION = '1.19.0'
const TARGET = /^orn-(3[0-9]|4[0-1])$/

const images = {}
for (const f of fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.dataurl'))) {
  const id = f.replace(/\.dataurl$/, '')
  if (!TARGET.test(id)) continue
  const data = fs.readFileSync(path.join(IMG_DIR, f), 'utf8').trim()
  if (!/^data:image\/[a-z]+;base64,/.test(data)) throw new Error(`not an image data URL: ${f}`)
  const buf = Buffer.from(data.split(',')[1], 'base64')
  const okStart = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF
  const okEnd = buf[buf.length - 2] === 0xFF && buf[buf.length - 1] === 0xD9
  if (!okStart) throw new Error(`not a JPEG: ${f}`)
  if (!okEnd) throw new Error(`truncated JPEG (no EOI marker): ${f}`)
  images[id] = data
}

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const applied = []
const stillMissing = []
for (const r of pack.recipes) {
  if (!TARGET.test(r.id)) continue
  if (images[r.id]) {
    r.imageUrl = images[r.id]
    applied.push(`${r.id}  ${Math.round(images[r.id].length / 1024)} KB  ${r.title.slice(0, 46)}`)
  } else if (!r.imageUrl) {
    stillMissing.push(`${r.id}  ${r.title.slice(0, 46)}`)
  }
}

pack.version = NEW_VERSION
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Applied ${applied.length} images | pack -> ${pack.version}`)
applied.forEach(a => console.log('  ' + a))
if (stillMissing.length) {
  console.log(`\nStill without an image (${stillMissing.length}):`)
  stillMissing.forEach(m => console.log('  ' + m))
}

/* Injects user-added recipe photos into the Fredheim Reversal Protocol
   pack. Reads <scratchpad>/imgs/<id>.dataurl files (lifted out of the
   running app's IndexedDB) and sets each matching recipe's imageUrl.

   Only recipes with a corresponding .dataurl file are touched; every
   other field (and every other recipe) is left exactly as-is. */
const fs = require('fs')
const path = require('path')

const IMG_DIR =
  'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/imgs'
const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const NEW_VERSION = '1.7.2'

const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.dataurl'))
const images = {}
for (const f of files) {
  const id = f.replace(/\.dataurl$/, '')
  const data = fs.readFileSync(path.join(IMG_DIR, f), 'utf8').trim()
  if (!/^data:image\/[a-z]+;base64,/.test(data)) {
    throw new Error('Not a valid image data URL: ' + f)
  }
  images[id] = data
}

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
let applied = 0
const skipped = []
for (const r of pack.recipes) {
  if (images[r.id]) {
    r.imageUrl = images[r.id]
    applied++
    console.log('image ->', r.id, '(' + Math.round(images[r.id].length / 1024) + 'KB)', '|', r.title)
  }
}
// Report any recent recipe still missing a photo, for visibility.
for (const r of pack.recipes) {
  if (/^orn-(1[4-9]|2[0-3])$/.test(r.id) && !r.imageUrl) skipped.push(r.id + ' (' + r.title + ')')
}

pack.version = NEW_VERSION
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('\nfredheim-reversal-protocol.json ->', NEW_VERSION, '| images applied:', applied)
if (skipped.length) console.log('still without a photo:', skipped.join(', '))

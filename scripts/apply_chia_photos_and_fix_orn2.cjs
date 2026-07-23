/* Two independent fixes to the Fredheim Reversal Protocol pack:
   1. Apply the user-added photos for the chia pudding fruit variants
      (orn-24..orn-28), lifted from the app's IndexedDB.
   2. Drop "white wine vinegar" from orn-2 (Creamy White Bean, Lemon-Dill &
      Date Dressing) in EN/NO/SV — not an ingredient the user keeps on hand.
      At 1 tsp its nutritional contribution is negligible (a few kcal, no
      material macro/micronutrient change), so the existing published
      nutrition is left as-is rather than re-estimated. */
const fs = require('fs')
const path = require('path')

const IMG_DIR =
  'C:/Users/fredr/AppData/Local/Temp/claude/C--Users-fredr-Documents-Claude-projects-menu-planner-main/d3e3d16b-5997-4e37-a482-42d770d1f850/scratchpad/imgs'
const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const NEW_VERSION = '1.10.1'

const files = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.dataurl'))
const images = {}
for (const f of files) {
  const id = f.replace(/\.dataurl$/, '')
  const data = fs.readFileSync(path.join(IMG_DIR, f), 'utf8').trim()
  if (!/^data:image\/[a-z]+;base64,/.test(data)) throw new Error('Not a valid image data URL: ' + f)
  images[id] = data
}

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

let imagesApplied = 0
for (const r of pack.recipes) {
  if (images[r.id]) {
    r.imageUrl = images[r.id]
    imagesApplied++
    console.log('image ->', r.id, '(' + Math.round(images[r.id].length / 1024) + 'KB)', '|', r.title)
  }
}

const orn2 = pack.recipes.find(r => r.id === 'orn-2')
if (!orn2) throw new Error('orn-2 not found')
function dropVinegar(list, pattern) {
  const before = list.length
  const kept = list.filter(i => !pattern.test(i.name))
  return { list: kept, removed: before - kept.length }
}
const enResult = dropVinegar(orn2.ingredients, /white wine vinegar/i)
orn2.ingredients = enResult.list
const noResult = dropVinegar(orn2.translations.no.ingredients, /hvitvinseddik/i)
orn2.translations.no.ingredients = noResult.list
const svResult = dropVinegar(orn2.translations.sv.ingredients, /vitvinsvinäger/i)
orn2.translations.sv.ingredients = svResult.list
console.log('orn-2: removed vinegar line — EN', enResult.removed, '| NO', noResult.removed, '| SV', svResult.removed)

pack.version = NEW_VERSION
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log('\nfredheim-reversal-protocol.json ->', NEW_VERSION, '| images applied:', imagesApplied)

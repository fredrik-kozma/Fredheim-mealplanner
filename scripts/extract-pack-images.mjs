/**
 * Extract base64 recipe photos from built-in pack JSON into public/pack-images/
 * and rewrite each recipe.imageUrl to /pack-images/<recipeId>.<ext>.
 *
 * Run from the project root after adding or replacing pack photos:
 *   node scripts/extract-pack-images.mjs
 *
 * Safe to re-run: already-extracted path URLs are left alone.
 */
import fs from 'fs'
import path from 'path'

const packsDir = 'recipe-packs-template/packs'
const outDir = 'public/pack-images'
const files = [
  'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol.json',
  'fredheim-fmd-5day.json',
]

fs.mkdirSync(outDir, { recursive: true })

let extracted = 0
let skipped = 0
let bytes = 0

for (const file of files) {
  const full = path.join(packsDir, file)
  const pack = JSON.parse(fs.readFileSync(full, 'utf8'))
  for (const r of pack.recipes) {
    const u = r.imageUrl || ''
    if (!u.startsWith('data:image/')) {
      if (u.startsWith('/pack-images/')) skipped++
      continue
    }
    const m = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s.exec(u)
    if (!m) {
      console.warn('bad data url', r.id)
      continue
    }
    let ext = m[1].toLowerCase()
    if (ext === 'jpeg') ext = 'jpg'
    if (ext.includes('+')) ext = ext.split('+')[0]
    const buf = Buffer.from(m[2], 'base64')
    const name = `${r.id}.${ext}`
    fs.writeFileSync(path.join(outDir, name), buf)
    r.imageUrl = `/pack-images/${name}`
    extracted++
    bytes += buf.length
  }
  fs.writeFileSync(full, JSON.stringify(pack, null, 2) + '\n')
  console.log(file, '->', (fs.statSync(full).size / 1e6).toFixed(2) + 'MB', 'id', pack.id, 'v' + pack.version)
}

console.log({
  extracted,
  skipped,
  imageBytesMB: +(bytes / 1e6).toFixed(2),
  filesInDir: fs.readdirSync(outDir).length,
})

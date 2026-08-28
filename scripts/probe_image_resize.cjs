/* Read-only probe: what would resizing the pack photos actually save, and
 * at what width does it stop being worth it?
 *
 * Writes nothing. Samples a spread of images across the packs and reports
 * the size at several candidate widths so the target is chosen from
 * measurements rather than a guess.
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const PACK_DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const WIDTHS = [640, 750, 800, 900]
const QUALITY = 80

;(async () => {
  const all = []
  for (const file of PACKS) {
    const pack = JSON.parse(fs.readFileSync(path.join(PACK_DIR, file), 'utf8'))
    for (const r of pack.recipes) {
      if (r.imageUrl) all.push({ id: r.id, dataUrl: r.imageUrl })
    }
  }

  const totalBytes = all.reduce((s, x) => s + x.dataUrl.length, 0)
  console.log(`${all.length} images, ${(totalBytes / 1048576).toFixed(1)} MB of base64 in the packs\n`)

  // Widths present today.
  const dims = {}
  for (const x of all.slice(0, 40)) {
    const m = await sharp(Buffer.from(x.dataUrl.split(',')[1], 'base64')).metadata()
    const k = `${m.width}x${m.height}`
    dims[k] = (dims[k] || 0) + 1
  }
  console.log('current dimensions (first 40):', JSON.stringify(dims), '\n')

  // Sample every Nth image so the estimate isn't skewed by one pack.
  const step = Math.max(1, Math.floor(all.length / 12))
  const sample = all.filter((_, i) => i % step === 0).slice(0, 12)
  const sampleBase64 = sample.reduce((s, x) => s + x.dataUrl.length, 0)

  console.log(`sampling ${sample.length} images (${Math.round(sampleBase64 / 1024)} KB base64 today)\n`)
  console.log('width  sample KB   vs now   projected pack total')
  for (const w of WIDTHS) {
    let out = 0
    for (const x of sample) {
      const buf = Buffer.from(x.dataUrl.split(',')[1], 'base64')
      const resized = await sharp(buf)
        .resize({ width: w, withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()
      // base64 inflates by 4/3, plus the data: prefix.
      out += Math.ceil(resized.length * 4 / 3) + 23
    }
    const ratio = out / sampleBase64
    console.log(
      `${String(w).padEnd(6)} ${String(Math.round(out / 1024)).padStart(8)}  ${String(Math.round((1 - ratio) * 100) + '%').padStart(7)}   ${(totalBytes * ratio / 1048576).toFixed(1)} MB`
    )
  }
})()

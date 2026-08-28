/* Re-encodes the pack photos smaller, to cut the shipped bundle.
 *
 * Every photo is embedded as base64 inside the pack JSON, and the packs
 * are statically imported, so all of it ends up inlined in one JS chunk —
 * 37 MB of it. An older phone has to download, parse and hold that before
 * anything renders, which is the most likely cause of the app installing
 * fine and then opening to a white screen.
 *
 * Target: longest side 750 px. Measured rather than guessed — the recipe
 * cards are the dominant surface (250 of them) and render at ~375 CSS px,
 * so 750 is exactly 2x coverage there. The detail hero column caps at
 * 672 CSS px, so it stays sharp at 1x and acceptable on a phone. Going
 * below 750 would soften the card grid itself.
 *
 * `fit: 'inside'` caps the longest side rather than the width, because a
 * good number of these are portrait (819x1024 and similar) where limiting
 * width alone would leave them just as tall and nearly as heavy.
 *
 * Two safety properties worth keeping if this is ever edited:
 *   - An image is only replaced when the result is actually smaller, so a
 *     photo can never be made worse *and* bigger.
 *   - Images already within the target are skipped outright, which makes
 *     the script idempotent. Re-encoding JPEG is lossy, so a second run
 *     must not quietly degrade everything a second time.
 *
 * Needs sharp, which is deliberately not a project dependency — it is
 * only ever used by this one-off tool, and it ships platform-specific
 * binaries that don't belong in the app's install:
 *
 *   npm install --no-save sharp
 *   node scripts/shrink_pack_images.cjs            # dry run
 *   node scripts/shrink_pack_images.cjs --write
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const PACK_DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = [
  'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol.json',
  'fredheim-fmd-5day.json',
]
const MAX_SIDE = 750
const QUALITY = 80
const WRITE = process.argv.includes('--write')

function bumpMinor(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || ''))
  if (!m) throw new Error(`unexpected pack version format: ${version}`)
  return `${m[1]}.${Number(m[2]) + 1}.0`
}

;(async () => {
  let grandBefore = 0
  let grandAfter = 0
  let resized = 0
  let skipped = 0
  let keptOriginal = 0

  for (const file of PACKS) {
    const p = path.join(PACK_DIR, file)
    const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
    let before = 0
    let after = 0
    let changed = false

    for (const r of pack.recipes) {
      if (!r.imageUrl) continue
      before += r.imageUrl.length

      const buf = Buffer.from(r.imageUrl.split(',')[1], 'base64')
      const meta = await sharp(buf).metadata()

      if (Math.max(meta.width, meta.height) <= MAX_SIDE) {
        after += r.imageUrl.length
        skipped++
        continue
      }

      const out = await sharp(buf)
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer()

      // Sanity-check the encoder's output before trusting it into the pack.
      if (!(out[0] === 0xff && out[1] === 0xd8 && out[out.length - 2] === 0xff && out[out.length - 1] === 0xd9)) {
        throw new Error(`${r.id}: re-encode produced a malformed JPEG`)
      }

      const dataUrl = 'data:image/jpeg;base64,' + out.toString('base64')
      if (dataUrl.length >= r.imageUrl.length) {
        after += r.imageUrl.length
        keptOriginal++
        continue
      }

      after += dataUrl.length
      resized++
      changed = true
      if (WRITE) r.imageUrl = dataUrl
    }

    grandBefore += before
    grandAfter += after

    const label = file.replace('fredheim-', '').replace('.json', '')
    if (WRITE && changed) {
      pack.version = bumpMinor(pack.version)
      fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
      console.log(`WROTE ${label.padEnd(24)} ${(before / 1048576).toFixed(1)} -> ${(after / 1048576).toFixed(1)} MB   v${pack.version}`)
    } else {
      console.log(`${WRITE ? 'unchanged' : 'would be'} ${label.padEnd(22)} ${(before / 1048576).toFixed(1)} -> ${(after / 1048576).toFixed(1)} MB`)
    }
  }

  const pct = Math.round((1 - grandAfter / grandBefore) * 100)
  console.log(`\nimages: ${resized} resized, ${skipped} already within ${MAX_SIDE}px, ${keptOriginal} left alone (re-encode was not smaller)`)
  console.log(`total base64: ${(grandBefore / 1048576).toFixed(1)} MB -> ${(grandAfter / 1048576).toFixed(1)} MB  (${pct}% smaller)`)
  if (!WRITE) console.log('\nDry run. Pass --write to apply.')
})()

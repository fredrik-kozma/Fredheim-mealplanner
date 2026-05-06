// Canvas-based image compressor. Used when the user picks a photo for a
// recipe so we don't shove a 4 MB base64 data URL into localStorage (which
// has a ~5 MB quota).
//
// Typical phone photo: 4 MB → ~200 KB after this pass.
//
// Returns a JPEG data URL. If the file is already small AND is a non-JPEG
// format (e.g. PNG transparency), we keep the original encoding.

const DEFAULT_MAX_SIDE = 1024   // px — longest edge
const DEFAULT_QUALITY  = 0.75   // JPEG quality
const SMALL_FILE_BYTES = 150 * 1024 // 150 KB — keep as-is if already small

export function compressImage(file, opts = {}) {
  const maxSide = opts.maxSide ?? DEFAULT_MAX_SIDE
  const quality = opts.quality ?? DEFAULT_QUALITY

  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Not an image'))
      return
    }

    // Small images can skip the round-trip entirely.
    const skipCompression = file.size <= SMALL_FILE_BYTES && file.type !== 'image/jpeg'
    if (skipCompression) {
      const r = new FileReader()
      r.onload = e => resolve(e.target.result)
      r.onerror = () => reject(new Error('Read failed'))
      r.readAsDataURL(file)
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        let { width, height } = img
        if (width > maxSide || height > maxSide) {
          const scale = maxSide / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        // White background so transparent PNGs don't go black when we encode
        // to JPEG.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        URL.revokeObjectURL(url)
        resolve(dataUrl)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image decode failed'))
    }
    img.src = url
  })
}

// Rough byte size of a data URL payload. Helpful for logging / guardrails.
export function dataUrlBytes(dataUrl) {
  if (!dataUrl) return 0
  const i = dataUrl.indexOf(',')
  if (i < 0) return dataUrl.length
  return Math.floor((dataUrl.length - i - 1) * 3 / 4)
}

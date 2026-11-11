/**
 * Wrap one JPEG per page in a minimal PDF. The pages are already painted
 * at A4, so the file only has to place each image on a 210 × 297 mm page.
 * Used when the Android WebView will not open the browser print dialog.
 */

const A4_W = 595.28
const A4_H = 841.89

function concat(chunks) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

/**
 * @param {{ jpeg: Uint8Array, width: number, height: number }[]} pages
 * @returns {Uint8Array}
 */
export function jpegPagesToPdf(pages) {
  if (!pages?.length) throw new Error('No pages to put in the PDF')
  const encode = (text) => new TextEncoder().encode(text)
  const chunks = []
  const offsets = [0]
  let pos = 0
  const add = (data) => {
    const bytes = typeof data === 'string' ? encode(data) : data
    chunks.push(bytes)
    pos += bytes.length
  }
  const mark = () => offsets.push(pos)

  add('%PDF-1.4\n')
  const kids = pages.map((_, index) => `${3 + index * 3} 0 R`).join(' ')
  mark()
  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  mark()
  add(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>\nendobj\n`)

  pages.forEach((page, index) => {
    const pageId = 3 + index * 3
    const contentId = pageId + 1
    const imageId = pageId + 2
    const jpeg = page.jpeg
    const content = `q\n${A4_W} 0 0 ${A4_H} 0 0 cm\n/Im0 Do\nQ\n`
    mark()
    add(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] `
      + `/Contents ${contentId} 0 R /Resources << /XObject << /Im0 ${imageId} 0 R >> >> >>\nendobj\n`,
    )
    mark()
    add(`${contentId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`)
    mark()
    add(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} `
      + `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    )
    add(jpeg)
    add('\nendstream\nendobj\n')
  })

  const xrefAt = pos
  const objectCount = 2 + pages.length * 3
  add(`xref\n0 ${objectCount + 1}\n`)
  add('0000000000 65535 f \n')
  for (let i = 1; i <= objectCount; i += 1) {
    add(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }
  add(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`)
  return concat(chunks)
}

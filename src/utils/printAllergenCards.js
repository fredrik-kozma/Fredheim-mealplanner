import { PRINT_WINDOW_CSS } from './allergenCardCss.js'
import { jpegPagesToPdf } from './allergenCardPdf.js'
import {
  CARD_W, CARD_H, GAP_X, GAP_Y, MARGIN_X, MARGIN_TOP, COLS, ROWS,
  PAGE_W, PAGE_H, FOOTER_GAP, GRID_H,
} from './allergenCardModel.js'
import { shareFileOrDownload } from './shareSheet.js'

function absolutize(html) {
  const origin = window.location.origin
  return html.replace(/(\ssrc=["'])(\/[^"']*)/g, `$1${origin}$2`)
}

/** Desktop: the same sheet the user is looking at, in the print dialog. */
export function openAllergenPrintWindow(rootEl, title) {
  if (!rootEl) return false
  const clone = rootEl.cloneNode(true)
  clone.querySelectorAll('.allergen-page-blank').forEach((node) => node.remove())
  const pages = [...clone.querySelectorAll('.allergen-page')]
  if (!pages.length) return false
  pages[pages.length - 1].style.breakAfter = 'auto'
  pages[pages.length - 1].style.pageBreakAfter = 'auto'

  const win = window.open('', '_blank')
  if (!win) return false
  const safeTitle = String(title || 'Allergen cards').replace(/[<>&]/g, '')
  win.document.open()
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap" />
<style>${PRINT_WINDOW_CSS}</style>
</head>
<body>
${absolutize(clone.innerHTML)}
<script>
  window.addEventListener('load', function () {
    var go = function () { window.focus(); window.print(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(go, 200); });
    else setTimeout(go, 400);
  });
</script>
</body>
</html>`)
  win.document.close()
  return true
}

const DPI = 160
const px = (mm) => (mm * DPI) / 25.4

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  const radius = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawPage(ctx, page, meta, images, logo) {
  const width = px(PAGE_W)
  const height = px(PAGE_H)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#1B7A3A'
  ctx.font = `600 ${px(3.1)}px Inter, sans-serif`
  ctx.textBaseline = 'middle'
  if (logo) ctx.drawImage(logo, px(12), px(3.6), px(5), px(5))
  ctx.fillText(meta.headerLeft, px(18.5), px(6.2))
  ctx.textAlign = 'right'
  ctx.fillText(meta.headerRight, px(PAGE_W - 12), px(6.2))
  ctx.textAlign = 'left'

  page.forEach((card, index) => {
    const col = index % COLS
    const row = Math.floor(index / COLS)
    const x = px(MARGIN_X + col * (CARD_W + GAP_X))
    const y = px(MARGIN_TOP + row * (CARD_H + GAP_Y))
    const w = px(CARD_W)
    const h = px(CARD_H)
    ctx.save()
    ctx.strokeStyle = '#8aa898'
    ctx.lineWidth = px(0.15)
    ctx.setLineDash([px(0.8), px(0.6)])
    roundRect(ctx, x - px(1.5), y - px(1.5), w + px(3), h + px(3), px(3))
    ctx.stroke()
    ctx.restore()
    if (!card) return

    ctx.save()
    roundRect(ctx, x, y, w, h, px(2.2))
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#1B7A3A'
    ctx.lineWidth = px(0.35)
    ctx.stroke()
    ctx.clip()

    const photo = px(14)
    const pad = px(1.7)
    if (images.get(card.imageUrl)) {
      ctx.save()
      roundRect(ctx, x + pad, y + pad, photo, photo, px(1.5))
      ctx.clip()
      ctx.drawImage(images.get(card.imageUrl), x + pad, y + pad, photo, photo)
      ctx.restore()
    } else {
      ctx.fillStyle = '#e7f6ec'
      roundRect(ctx, x + pad, y + pad, photo, photo, px(1.5))
      ctx.fill()
      ctx.fillStyle = '#1B7A3A'
      ctx.font = `700 ${px(3.2)}px Inter, sans-serif`
      ctx.textBaseline = 'middle'
      const letter = (card.title || '?').slice(0, 1).toUpperCase()
      ctx.fillText(letter, x + pad + photo / 2 - ctx.measureText(letter).width / 2, y + pad + photo / 2)
    }
    if (logo) ctx.drawImage(logo, x + w - px(6.4), y + px(1.3), px(5), px(5))

    ctx.fillStyle = '#143028'
    ctx.font = `700 ${px(2.9)}px Inter, sans-serif`
    ctx.textBaseline = 'top'
    const nameX = x + pad + photo + px(1.6)
    const nameW = w - (nameX - x) - px(7)
    const nameLines = wrapLines(ctx, card.title, nameW).slice(0, 3)
    nameLines.forEach((line, lineIndex) => {
      ctx.fillText(line, nameX, y + pad + lineIndex * px(3.4))
    })

    ctx.font = `500 ${px(2.25)}px Inter, sans-serif`
    let textY = y + pad + photo + px(1.2)
    const maxY = y + h - px(1.3)
    const writeLine = (color, text) => {
      if (textY > maxY) return
      ctx.fillStyle = color
      const lines = wrapLines(ctx, text, w - pad * 2 - px(4))
      for (const line of lines) {
        if (textY > maxY) return
        ctx.fillRect(x + pad, textY + px(0.4), px(2.2), px(2.2))
        ctx.fillStyle = color
        ctx.fillText(line, x + pad + px(3.2), textY)
        textY += px(2.8)
        ctx.fillStyle = color
      }
    }
    if (card.none) writeLine('#1B7A3A', card.noneText)
    for (const line of card.lines || []) writeLine('#143028', line.text)
    for (const note of card.notes || []) writeLine('#8a5a00', note)
    ctx.restore()
  })

  ctx.fillStyle = '#3d5246'
  ctx.font = `500 ${px(2.45)}px Inter, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const disclaimerTop = MARGIN_TOP + GRID_H + FOOTER_GAP
  const lines = wrapLines(ctx, meta.disclaimer, px(PAGE_W - 28))
  lines.slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, width / 2, px(disclaimerTop) + index * px(3.1))
  })
  ctx.textAlign = 'left'
}

/**
 * Paint each sheet and wrap the JPEGs. This is the Android path: the
 * WebView often ignores window.print, so the PDF goes to the share sheet.
 */
export async function renderAllergenPdf(pages, meta) {
  await document.fonts?.ready
  const logo = await loadImage('/fredheim-logo.png')
  const srcs = new Set()
  for (const page of pages) {
    for (const card of page) if (card?.imageUrl) srcs.add(card.imageUrl)
  }
  const images = new Map()
  await Promise.all([...srcs].map(async (src) => {
    const img = await loadImage(src)
    if (img) images.set(src, img)
  }))

  const jpegs = []
  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index]
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(px(PAGE_W))
    canvas.height = Math.round(px(PAGE_H))
    const ctx = canvas.getContext('2d')
    const headerRight = pages.length > 1
      ? `${index + 1} / ${pages.length} · ${meta.headerRight}`
      : meta.headerRight
    drawPage(ctx, page, { ...meta, headerRight }, images, logo)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    jpegs.push({
      jpeg: new Uint8Array(await blob.arrayBuffer()),
      width: canvas.width,
      height: canvas.height,
    })
  }
  return jpegPagesToPdf(jpegs)
}

export async function deliverAllergenCards({ native, rootEl, title, filename, pages, meta }) {
  if (!native && openAllergenPrintWindow(rootEl, title)) return 'printed'
  const bytes = await renderAllergenPdf(pages, meta)
  const file = new File([bytes], filename, { type: 'application/pdf' })
  return shareFileOrDownload({ title, file, filename })
}

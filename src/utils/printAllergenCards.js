import { PRINT_WINDOW_CSS } from './allergenCardCss.js'
import { jpegPagesToPdf } from './allergenCardPdf.js'
import {
  CARD_W, CARD_H, GAP_X, GAP_Y, MARGIN_X, MARGIN_TOP, COLS, ROWS,
  PAGE_W, PAGE_H, FOOTER_GAP, GRID_H, PHOTO_VEIL, CARD_TYPE,
} from './allergenCardModel.js'
import { shareFileOrDownload } from './shareSheet.js'
import { CARD_TEXT_FONT, CARD_TITLE_FONT, ensureAllergenFonts } from './allergenCardFonts.js'

function absolutize(html) {
  const origin = window.location.origin
  return html.replace(/(\ssrc=["'])(\/[^"']*)/g, `$1${origin}$2`)
}

function absolutizeCss(css) {
  const origin = window.location.origin
  return css.replace(/url\((['"]?)(\/[^)'"]+)/g, `url($1${origin}$2`)
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
<style>${absolutizeCss(PRINT_WINDOW_CSS)}</style>
</head>
<body>
${absolutize(clone.innerHTML)}
<script>
  window.addEventListener('load', function () {
    var go = function () { window.focus(); window.print(); };
    var fonts = document.fonts;
    if (fonts && fonts.load) {
      Promise.all([
        fonts.load('700 16px "Playfair Display", Georgia, serif', 'Ciorbă æøå'),
        fonts.load('600 16px Figtree, system-ui, sans-serif', 'Ciorbă æøå'),
        fonts.ready
      ]).then(function () { setTimeout(go, 50); });
    } else if (fonts && fonts.ready) {
      fonts.ready.then(function () { setTimeout(go, 200); });
    } else {
      setTimeout(go, 400);
    }
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

function ptPx(pt) {
  return (pt * DPI) / 72
}

function drawPage(ctx, page, meta, images, logo) {
  const width = px(PAGE_W)
  const height = px(PAGE_H)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#1B7A3A'
  ctx.font = `600 ${px(3.1)}px ${CARD_TEXT_FONT}`
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

    ctx.fillStyle = '#cfe8d8'
    ctx.fillRect(x, y, w, h)
    const photo = images.get(card.imageUrl)
    if (photo) {
      const scale = Math.max(w / photo.width, h / photo.height)
      const dw = photo.width * scale
      const dh = photo.height * scale
      ctx.drawImage(photo, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
    }
    ctx.fillStyle = `rgba(255,255,255,${PHOTO_VEIL})`
    ctx.fillRect(x, y, w, h)
    const panelX = x + px(1.15)
    const panelY = y + px(1.15)
    const panelW = w - px(2.35)
    const panelH = h - px(2.3)
    if (logo) {
      const logoSize = px(3.4)
      ctx.save()
      ctx.globalAlpha = 0.8
      ctx.drawImage(logo, x + w - px(1) - logoSize, y + px(1), logoSize, logoSize)
      ctx.restore()
    }

    const textX = panelX + px(1.3)
    const textW = panelW - px(2.6)
    const textTop = panelY + px(1)
    const textBottom = panelY + panelH - px(0.9)
    let namePt = CARD_TYPE.nameMaxPt
    let nameLines = []
    while (namePt >= CARD_TYPE.nameMinPt) {
      ctx.font = `700 ${ptPx(namePt)}px ${CARD_TITLE_FONT}`
      nameLines = wrapLines(ctx, card.title, textW)
      if (nameLines.length <= 2) break
      namePt -= 0.5
    }
    nameLines = nameLines.slice(0, 2)
    const nameLineH = ptPx(namePt) * 1.08

    const items = []
    for (const line of card.lines || []) items.push({ text: line.text })

    const listTop = textTop + nameLines.length * nameLineH + px(0.8)
    const listH = textBottom - listTop
    let allergenPt = CARD_TYPE.allergenMaxPt
    const layoutItems = (pt) => {
      ctx.font = `600 ${ptPx(pt)}px ${CARD_TEXT_FONT}`
      const bulletW = ptPx(pt) * 0.85
      const row = []
      let used = 0
      for (const item of items) {
        const wrapped = wrapLines(ctx, item.text, Math.max(8, textW - bulletW))
        const block = wrapped.length * ptPx(pt) * 1.08
        row.push({ ...item, wrapped, block })
        used += block + px(0.2)
      }
      return { row, used }
    }
    let laidOut = layoutItems(allergenPt)
    while (laidOut.used > listH + 1 && allergenPt > CARD_TYPE.allergenMinPt) {
      allergenPt = Math.max(CARD_TYPE.allergenMinPt, +(allergenPt - 0.4).toFixed(2))
      laidOut = layoutItems(allergenPt)
      if (allergenPt <= CARD_TYPE.allergenMinPt) break
    }
    ctx.fillStyle = '#0b3f24'
    ctx.textBaseline = 'top'
    ctx.font = `700 ${ptPx(namePt)}px ${CARD_TITLE_FONT}`
    ctx.lineWidth = Math.max(1, ptPx(namePt) * 0.16)
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineJoin = 'round'
    nameLines.forEach((line, lineIndex) => {
      const ly = textTop + lineIndex * nameLineH
      ctx.strokeText(line, textX, ly)
      ctx.fillText(line, textX, ly)
    })
    let textY = listTop
    for (const item of laidOut.row) {
      if (textY > textBottom) break
      ctx.fillStyle = '#0b3f24'
      ctx.font = `600 ${ptPx(allergenPt)}px ${CARD_TEXT_FONT}`
      ctx.lineWidth = Math.max(1, ptPx(allergenPt) * 0.14)
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'
      ctx.textBaseline = 'top'
      item.wrapped.forEach((line, lineIndex) => {
        const ly = textY + lineIndex * ptPx(allergenPt) * 1.08
        const prefix = lineIndex === 0 ? '•  ' : ''
        ctx.strokeText(prefix + line, textX, ly)
        ctx.fillText(prefix + line, textX, ly)
      })
      textY += item.block + px(0.2)
    }
    ctx.restore()
  })

  ctx.fillStyle = '#3d5246'
  ctx.font = `600 ${px(2.45)}px ${CARD_TEXT_FONT}`
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
  await ensureAllergenFonts()
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

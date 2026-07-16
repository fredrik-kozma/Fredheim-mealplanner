/**
 * Build ONE big printable HTML of every recipe in every installed pack,
 * in Norwegian, at each recipe's original standard portions, using the
 * exact same card layout as the app's single-recipe print view
 * (src/utils/printRecipe.js). Each recipe starts on its own A4 page.
 *
 * Output: an .html file (self-contained) that is then rendered to PDF with
 * headless Chrome/Edge (--print-to-pdf) — see the companion Bash command.
 *
 * Faithful to the app: quantity formatting reuses the real unit-conversion
 * code (metric system, Norwegian unit labels) at scale factor 1 (standard
 * servings), mirroring RecipeDetail.formatScaledQuantity + smartRound.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  normalizeUnit,
  CANONICAL_UNITS,
  convertToSystem,
  displayUnit,
} from '../src/utils/unitNormalizer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PACK_DIR = path.join(ROOT, 'recipe-packs-template', 'packs')

const PACK_FILES = [
  'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol.json',
  'fredheim-fmd-5day.json',
]

const no = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/no.json'), 'utf8'))
const CATS = no.categories || {}
const RD = no.recipeDetail || {}

const LABELS = {
  ingredients: RD.ingredients || 'Ingredienser',
  instructions: RD.instructions || 'Fremgangsmåte',
  servings: RD.servingsLabel || 'Porsjoner',
  prep: RD.prepLabel || 'Forberedelse',
  cook: RD.cookLabel || 'Tilberedning',
  printedOn: RD.printedOn || 'Skrevet ut',
}

// ── Logos embedded once (as CSS data URIs) so we don't repeat them per page ──
const dataUri = (file, mime) =>
  `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, 'public', file)).toString('base64')
const FREDHEIM_LOGO = dataUri('fredheim-logo.png', 'image/png')
const VIVERA_LOGO = dataUri('Vivera_Health_logo.png', 'image/png')

// ── Faithful quantity formatting (mirrors RecipeDetail) ──────────────────────
function smartRound(num) {
  if (num === null || num === undefined || num === 0) return 0
  const fractions = [0.25, 0.33, 0.5, 0.67, 0.75]
  if (num < 1) {
    let closest = fractions[0]
    let minDiff = Math.abs(num - closest)
    for (const f of fractions) {
      const d = Math.abs(num - f)
      if (d < minDiff) { minDiff = d; closest = f }
    }
    if (minDiff < 0.1) return closest
  }
  if (Math.abs(num - Math.round(num)) < 0.05) return Math.round(num)
  const decimal = num % 1
  if (Math.abs(decimal - 0.5) < 0.05) return Math.floor(num) + 0.5
  return Math.round(num * 100) / 100
}

function displayUnitLabel(unitKey) {
  if (!unitKey) return ''
  if (CANONICAL_UNITS[unitKey]) return displayUnit(unitKey, 'no')
  return unitKey
}

// Standard portions → scale factor 1. Metric system, Norwegian labels.
function formatQty(quantity, unit) {
  if (quantity === null || quantity === undefined || quantity === 0) return unit || ''
  const normalized = normalizeUnit(unit)
  const meta = CANONICAL_UNITS[normalized]
  let finalQty = quantity
  let finalUnitKey = normalized || unit
  if (meta && meta.system !== 'both') {
    const c = convertToSystem(quantity, normalized, 'metric')
    finalQty = c.quantity
    finalUnitKey = c.unit
  }
  const rounded = smartRound(finalQty)
  if (rounded === 0) return displayUnitLabel(finalUnitKey) || ''
  const label = displayUnitLabel(finalUnitKey)
  return label ? `${rounded} ${label}` : `${rounded}`
}

function esc(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ── Collect + localize recipes ───────────────────────────────────────────────
const CATEGORY_ORDER = [
  'Breakfast', 'Porridge', 'Bread', 'Spreads', 'Lunch', 'Soup', 'Salad',
  'Main', 'Dinner', 'Side', 'Sauce', 'Snack', 'Dessert', 'Drink', 'Jam',
  'Supper', 'Other',
]

const all = []
for (const file of PACK_FILES) {
  const pack = JSON.parse(fs.readFileSync(path.join(PACK_DIR, file), 'utf8'))
  for (const r of pack.recipes) {
    const t = (r.translations && r.translations.no) || {}
    const title = t.title || r.title
    const description = t.description || r.description || ''
    const ingredients = (Array.isArray(t.ingredients) && t.ingredients.length ? t.ingredients : r.ingredients) || []
    const steps = (Array.isArray(t.steps) && t.steps.length ? t.steps : r.steps) || []
    all.push({
      id: r.id,
      title,
      description,
      imageUrl: r.imageUrl || '',
      category: r.category || 'Other',
      categoryLabel: CATS[r.category] || r.category || '',
      prepTime: r.prepTime ?? null,
      cookTime: r.cookTime ?? null,
      servings: r.servings ?? null,
      ingredients,
      steps,
    })
  }
}

const catRank = (c) => {
  const i = CATEGORY_ORDER.indexOf(c)
  return i === -1 ? CATEGORY_ORDER.length : i
}
all.sort((a, b) => {
  const cr = catRank(a.category) - catRank(b.category)
  if (cr !== 0) return cr
  return a.title.localeCompare(b.title, 'nb')
})

// ── Build one sheet per recipe ───────────────────────────────────────────────
function sheetHtml(rec) {
  const chips = []
  if (rec.servings) chips.push(`<span class="chip">🍽 ${esc(LABELS.servings)}: <b>${esc(rec.servings)}</b></span>`)
  if (rec.prepTime) chips.push(`<span class="chip">⏱ ${esc(LABELS.prep)}: <b>${rec.prepTime}m</b></span>`)
  if (rec.cookTime) chips.push(`<span class="chip">🔥 ${esc(LABELS.cook)}: <b>${rec.cookTime}m</b></span>`)
  if (rec.categoryLabel) chips.push(`<span class="chip chip--accent">${esc(rec.categoryLabel)}</span>`)

  const ings = rec.ingredients.map((ing) => `
        <li>
          <span class="ing-name">${esc(ing.name)}</span>
          <span class="ing-qty">${esc(formatQty(ing.quantity, ing.unit))}</span>
        </li>`).join('')

  const steps = rec.steps.map((s, i) => `
        <li><span class="step-num">${i + 1}</span><span class="step-text">${esc(s)}</span></li>`).join('')

  return `
  <div class="sheet">
    <div class="scale">
      <div class="header">
        <div class="logo"></div>
        <div class="brand-strip"><b>Fredheim</b> · Livsstilssenter</div>
      </div>
      <div class="title-block">
        <h1>${esc(rec.title)}</h1>
        ${rec.description ? `<p class="desc">${esc(rec.description)}</p>` : ''}
      </div>
      ${rec.imageUrl ? `<div class="hero"><img src="${esc(rec.imageUrl)}" alt="" /></div>` : ''}
      ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
      <div class="body">
        <section>
          <h2>${esc(LABELS.ingredients)}</h2>
          <ul class="ingredients">${ings}</ul>
        </section>
        <section>
          <h2>${esc(LABELS.instructions)}</h2>
          <ol class="steps">${steps}</ol>
        </section>
      </div>
      <div class="footer">
        <div class="coop">
          <div class="mk mk-fredheim"></div><span>Fredheim Livsstilssenter</span>
          <span class="dot">·</span>
          <div class="mk mk-vivera"></div><span>Vivera Health</span>
        </div>
        ${esc(LABELS.printedOn)} ${esc(new Date().toLocaleDateString('nb-NO', { year: 'numeric', month: 'short', day: 'numeric' }))} · fredheim.org
      </div>
    </div>
  </div>`
}

// Optional: SAMPLE=<id> renders a single recipe (for visual verification).
const SAMPLE = process.env.SAMPLE
const sheets = SAMPLE ? all.filter(r => r.id === SAMPLE) : all

const printedDate = new Date().toLocaleDateString('nb-NO', { year: 'numeric', month: 'long', day: 'numeric' })

const cover = `
  <div class="sheet cover">
    <div class="cover-inner">
      <div class="logo-big"></div>
      <h1>Fredheim Oppskrifter</h1>
      <p class="sub">Hele oppskriftssamlingen · standard porsjoner</p>
      <p class="count">${all.length} oppskrifter</p>
      <p class="date">${esc(printedDate)}</p>
    </div>
  </div>`

const CSS = `
  :root{--brand:#22B24C;--brand-dark:#158a38;--ink:#1f2937;--ink-soft:#475569;--muted:#64748b;--line:#e2e8f0;--accent:#eef9f1;}
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:#fff;color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .sheet{width:210mm;min-height:297mm;padding:14mm 14mm 12mm 14mm;background:#fff;
    display:flex;flex-direction:column;}
  .sheet + .sheet{break-before:page;page-break-before:always;}
  .scale{display:flex;flex-direction:column;flex:1;}
  .header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
    border-bottom:2px solid var(--brand);padding-bottom:10px;margin-bottom:14px;}
  .logo{height:110px;width:220px;flex-shrink:0;
    background:url('${FREDHEIM_LOGO}') left center/contain no-repeat;}
  .brand-strip{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1.5px;text-align:right;padding-top:6px;}
  .brand-strip b{color:var(--brand-dark);letter-spacing:1px;}
  .title-block{margin-bottom:12px;}
  h1{font-size:30px;line-height:1.15;margin:0 0 6px 0;color:var(--ink);font-weight:800;letter-spacing:-0.3px;}
  .desc{color:var(--ink-soft);font-size:12.5px;line-height:1.5;margin:0;}
  .hero{width:100%;height:180px;border-radius:10px;overflow:hidden;margin:10px 0 12px 0;background:#f1f5f9;}
  .hero img{width:100%;height:100%;object-fit:cover;display:block;}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;}
  .chip{background:#f8fafc;border:1px solid var(--line);color:var(--ink-soft);font-size:11px;padding:5px 10px;border-radius:999px;line-height:1;}
  .chip b{color:var(--ink);font-weight:700;}
  .chip--accent{background:var(--accent);border-color:#bbe5c6;color:var(--brand-dark);font-weight:700;}
  .body{display:grid;grid-template-columns:1fr 1.7fr;gap:22px;flex:1;}
  h2{font-size:14px;margin:0 0 10px 0;color:var(--brand-dark);text-transform:uppercase;letter-spacing:1.8px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:6px;break-after:avoid;page-break-after:avoid;}
  ul.ingredients{list-style:none;padding:0;margin:0;}
  ul.ingredients li{display:flex;justify-content:space-between;gap:8px;align-items:baseline;padding:5px 0;border-bottom:1px dotted var(--line);font-size:11.5px;break-inside:avoid;page-break-inside:avoid;}
  .ing-name{color:var(--ink);}
  .ing-qty{color:var(--ink-soft);font-weight:600;white-space:nowrap;font-variant-numeric:tabular-nums;}
  ol.steps{list-style:none;padding:0;margin:0;}
  ol.steps li{display:flex;gap:10px;align-items:flex-start;margin-bottom:9px;font-size:11.5px;line-height:1.55;color:var(--ink);break-inside:avoid;page-break-inside:avoid;}
  .step-num{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:var(--brand);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}
  .header,.title-block{break-after:avoid;page-break-after:avoid;}
  .hero{break-inside:avoid;page-break-inside:avoid;}
  .chips,.footer{break-inside:avoid;page-break-inside:avoid;}
  .footer{margin-top:14px;padding-top:8px;border-top:1px solid var(--line);text-align:center;color:var(--muted);font-size:9.5px;letter-spacing:0.8px;}
  .footer .coop{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:6px;font-size:9px;color:var(--ink-soft);letter-spacing:0.4px;}
  .footer .mk{height:16px;width:40px;background-position:center;background-repeat:no-repeat;background-size:contain;}
  .mk-fredheim{background-image:url('${FREDHEIM_LOGO}');}
  .mk-vivera{background-image:url('${VIVERA_LOGO}');}
  .footer .dot{color:var(--muted);padding:0 2px;}
  /* Cover */
  .cover{align-items:center;justify-content:center;text-align:center;}
  .cover-inner{margin:auto;display:flex;flex-direction:column;align-items:center;gap:10px;}
  .logo-big{height:180px;width:360px;background:url('${FREDHEIM_LOGO}') center/contain no-repeat;margin-bottom:20px;}
  .cover h1{font-size:46px;margin:0;}
  .cover .sub{font-size:16px;color:var(--ink-soft);margin:0;}
  .cover .count{font-size:14px;color:var(--brand-dark);font-weight:700;margin:24px 0 0 0;letter-spacing:1px;text-transform:uppercase;}
  .cover .date{font-size:12px;color:var(--muted);margin:0;}
  @page{size:A4 portrait;margin:14mm;}
  @media print{
    .sheet{width:auto;min-height:0;padding:0;}
    .sheet + .sheet{break-before:page;page-break-before:always;}
    .cover{min-height:auto;height:100vh;}
  }`

const html = `<!doctype html>
<html lang="no"><head><meta charset="utf-8" /><title>Fredheim Oppskrifter</title>
<style>${CSS}</style></head>
<body>
${SAMPLE ? '' : cover}
${sheets.map(sheetHtml).join('\n')}
</body></html>`

const outHtml = process.argv[2] || path.join(ROOT, 'Fredheim-oppskrifter-NO.html')
fs.writeFileSync(outHtml, html, 'utf8')
console.log('Wrote', outHtml)
console.log('Recipes:', all.length, '| HTML size:', Math.round(html.length / 1024 / 1024 * 10) / 10, 'MB')

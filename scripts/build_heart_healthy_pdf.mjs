/* Builds a printable book of every heart-healthy recipe, then renders it
 * to a real PDF with headless Chrome.
 *
 * The app has no PDF library on purpose — its printouts go through the
 * browser's own "Save as PDF", which keeps a few hundred KB out of a
 * bundle that is already large. That decision stands for the app. This is
 * a one-off build tool run on a desktop, so it can drive Chrome directly
 * and hand over a finished file instead of a page to print by hand.
 *
 * The page styling is imported from the app's own recipeSheetCss rather
 * than rewritten, so a page here is the same object as one printed from a
 * recipe screen. The geometry (A4 portrait) is set below, the way each
 * caller of that module sets its own.
 *
 *   node scripts/build_heart_healthy_pdf.mjs [--lang no] [--no-photos]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { RECIPE_SHEET_CSS } from '../src/utils/recipeSheetCss.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const TAG = 'heart-healthy'

const args = process.argv.slice(2)
const LANG = (args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'no').slice(0, 2)
const PHOTOS = !args.includes('--no-photos')

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(p => fs.existsSync(p))
if (!CHROME) throw new Error('no Chrome or Edge found to render the PDF')

// ── wording, in the three languages the app speaks ────────────────────
const T = {
  en: {
    title: 'Heart & Cholesterol', subtitle: 'Every recipe that supports heart health',
    contents: 'Contents', recipes: 'recipes', ingredients: 'Ingredients',
    instructions: 'Instructions', notes: "Chef's notes", servings: 'Servings',
    prep: 'Prep', cook: 'Cook', printed: 'Printed', page: 'Page',
    criteria: 'Included when the recipe\'s own nutrition meets all of: saturated fat at or below 2 g a serving, no added oil, no coconut milk or cream, at least 3 g of fibre, and zero cholesterol.',
    noNutrition: 'no nutrition data recorded',
    fmdNote: 'Marked recipes belong to the 5-day fasting-mimicking plan. They are deliberately low in calories and are not complete meals on their own.',
  },
  no: {
    title: 'Hjerte & kolesterol', subtitle: 'Alle oppskrifter som støtter hjertehelsen',
    contents: 'Innhold', recipes: 'oppskrifter', ingredients: 'Ingredienser',
    instructions: 'Fremgangsmåte', notes: 'Kokkens tips', servings: 'Porsjoner',
    prep: 'Forberedelse', cook: 'Tilberedning', printed: 'Skrevet ut', page: 'Side',
    criteria: 'Tatt med når oppskriftens egen næringsberegning oppfyller alt av: mettet fett på høyst 2 g per porsjon, ingen tilsatt olje, ingen kokosmelk eller kokosfløte, minst 3 g kostfiber, og null kolesterol.',
    noNutrition: 'ingen næringsdata registrert',
    fmdNote: 'Merkede oppskrifter hører til den 5-dagers fasteimiterende planen. De er bevisst kalorifattige og er ikke komplette måltider alene.',
  },
  sv: {
    title: 'Hjärta & kolesterol', subtitle: 'Alla recept som stöder hjärthälsan',
    contents: 'Innehåll', recipes: 'recept', ingredients: 'Ingredienser',
    instructions: 'Gör så här', notes: 'Kockens tips', servings: 'Portioner',
    prep: 'Förberedelse', cook: 'Tillagning', printed: 'Utskrivet', page: 'Sida',
    criteria: 'Med när receptets egen näringsberäkning uppfyller allt av: mättat fett på högst 2 g per portion, ingen tillsatt olja, ingen kokosmjölk eller kokosgrädde, minst 3 g fiber, och noll kolesterol.',
    noNutrition: 'inga näringsdata registrerade',
    fmdNote: 'Markerade recept hör till den 5-dagars fasteimiterande planen. De är medvetet kalorifattiga och är inte kompletta måltider på egen hand.',
  },
}[LANG] || null
if (!T) throw new Error(`unsupported language: ${LANG}`)

// Absolute file URL rather than "/fredheim-logo.svg": Chrome opens this
// book over file://, where a root-relative path points at the drive root.
// Not inlined as a data URI either — the logo is 357 KB and it appears on
// every page, which would add tens of megabytes to the finished PDF.
const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const LOGO_URL = `file:///${path.join(PUBLIC_DIR, 'fredheim-logo.svg').replace(/\\/g, '/')}`

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// ── collect ───────────────────────────────────────────────────────────
const recipes = []
for (const file of PACKS) {
  const pack = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  for (const r of pack.recipes) {
    if (!(r.tags || []).includes(TAG)) continue
    recipes.push({ ...r, __pack: file })
  }
}
const tr = (r) => r.translations?.[LANG] || {}
const titleOf = (r) => tr(r).title || r.title
// Grouped by course, then alphabetical — a book you look things up in,
// not a feed. Categories follow the order the app lists them in.
const CATEGORY_ORDER = ['Breakfast', 'Lunch', 'Main', 'Soup', 'Salad', 'Side', 'Sauce', 'Spreads', 'Bread', 'Dessert', 'Snack', 'Drink', 'Jam', 'Other']
recipes.sort((a, b) => {
  const ca = CATEGORY_ORDER.indexOf(a.category), cb = CATEGORY_ORDER.indexOf(b.category)
  if (ca !== cb) return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb)
  return titleOf(a).localeCompare(titleOf(b), LANG)
})

const catLabel = (c) => ({
  en: {}, // English keys are already the labels
  no: { Breakfast: 'Frokost', Lunch: 'Lunsj', Main: 'Middag', Soup: 'Suppe', Salad: 'Salat', Side: 'Tilbehør', Sauce: 'Saus', Spreads: 'Pålegg', Bread: 'Brød', Dessert: 'Dessert', Snack: 'Mellommåltid', Drink: 'Drikke', Jam: 'Syltetøy', Other: 'Annet' },
  sv: { Breakfast: 'Frukost', Lunch: 'Lunch', Main: 'Huvudrätt', Soup: 'Soppa', Salad: 'Sallad', Side: 'Tillbehör', Sauce: 'Sås', Spreads: 'Pålägg', Bread: 'Bröd', Dessert: 'Dessert', Snack: 'Mellanmål', Drink: 'Dryck', Jam: 'Sylt', Other: 'Övrigt' },
}[LANG]?.[c] || c)

const fmtTime = (m) => {
  if (!m || m <= 0) return null
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60), r = m % 60
  if (h < 48) return r ? `${h}t ${r}m` : `${h}t`
  return `${Math.round(h / 24)}d`
}

// ── pages ─────────────────────────────────────────────────────────────
// Numbered to match what a PDF viewer shows, so typing a contents number
// into the page box lands on the right recipe: cover is 1, contents 2,
// recipes from 3. That only holds because every recipe is forced onto
// exactly one page by the fit pass at the bottom of this file.
let pageNo = 3
const contentsRows = []
const recipePages = recipes.map((r) => {
  const t = tr(r)
  const ings = (t.ingredients || r.ingredients || [])
  const steps = (t.steps || r.steps || [])
  const notes = t.notes || r.notes || ''
  const isFmd = r.__pack === 'fredheim-fmd-5day.json'
  contentsRows.push({ page: pageNo, title: titleOf(r), category: catLabel(r.category), fmd: isFmd })
  pageNo++

  const chips = []
  if (r.servings) chips.push(`<span class="chip">🍽 ${esc(T.servings)}: <b>${r.servings}</b></span>`)
  const p = fmtTime(r.prepTime), c = fmtTime(r.cookTime)
  if (p) chips.push(`<span class="chip">⏱ ${esc(T.prep)}: <b>${p}</b></span>`)
  if (c) chips.push(`<span class="chip">🔥 ${esc(T.cook)}: <b>${c}</b></span>`)
  chips.push(`<span class="chip chip--accent">${esc(catLabel(r.category))}</span>`)

  const per = r.nutrition?.perServing
  const nutritionLine = per
    ? `<p class="nutri"><b>${Math.round(per.calories)} kcal</b> · ${per.protein} g protein · ${per.fiber} g fiber · ${per.saturatedFat} g ${LANG === 'en' ? 'sat. fat' : LANG === 'sv' ? 'mättat fett' : 'mettet fett'} · ${per.sodium} mg ${LANG === 'en' ? 'sodium' : LANG === 'sv' ? 'natrium' : 'natrium'}</p>`
    : `<p class="nutri nutri--none">${esc(T.noNutrition)}</p>`

  return `
  <section class="sheet"><div class="fit">
    <div class="header">
      <img class="logo" src="${LOGO_URL}" alt="" onerror="this.style.display='none'" />
      <div class="brand-strip"><b>Fredheim</b> · ${esc(T.title)}</div>
    </div>
    <div class="title-block">
      ${PHOTOS && r.imageUrl ? `<img class="title-thumb" src="${esc(r.imageUrl)}" alt="" />` : ''}
      <div class="title-text">
        <h1>${esc(titleOf(r))}${isFmd ? ' <span class="fmd">※</span>' : ''}</h1>
        ${t.description || r.description ? `<p class="desc">${esc(t.description || r.description)}</p>` : ''}
      </div>
    </div>
    <div class="chips">${chips.join('')}</div>
    ${nutritionLine}
    <div class="body">
      <section>
        <h2>${esc(T.ingredients)}</h2>
        <ul class="ingredients">
          ${ings.map(i => `<li><span class="ing-name">${esc(i.name)}</span><span class="ing-qty">${i.quantity != null ? esc(`${i.quantity} ${i.unit || ''}`.trim()) : ''}</span></li>`).join('')}
        </ul>
      </section>
      <section>
        <h2>${esc(T.instructions)}</h2>
        <ol class="steps">
          ${steps.map((s, i) => `<li><span class="step-num">${i + 1}</span><span class="step-text">${esc(s)}</span></li>`).join('')}
        </ol>
      </section>
    </div>
    ${notes ? `<div class="notes-block"><h2>${esc(T.notes)}</h2><p>${esc(notes)}</p></div>` : ''}
    <div class="page-foot">${esc(T.page)} ${pageNo - 1} · fredheim.org</div>
  </div></section>`
}).join('')

const printedOn = new Date().toLocaleDateString(
  { en: 'en-GB', no: 'nb-NO', sv: 'sv-SE' }[LANG], { year: 'numeric', month: 'long', day: 'numeric' }
)
const anyFmd = contentsRows.some(r => r.fmd)

// Contents, grouped by course.
let lastCat = null
const contentsHtml = contentsRows.map(row => {
  const head = row.category !== lastCat ? `<li class="toc-cat">${esc(row.category)}</li>` : ''
  lastCat = row.category
  return `${head}<li class="toc-row"><span class="toc-title">${esc(row.title)}${row.fmd ? ' ※' : ''}</span><span class="toc-dots"></span><span class="toc-page">${row.page}</span></li>`
}).join('')

const html = `<!doctype html>
<html lang="${LANG}">
<head>
<meta charset="utf-8" />
<title>${esc(T.title)}</title>
<style>
${RECIPE_SHEET_CSS}

/* ── this book's page geometry ────────────────────────────────────── */
@page { size: A4 portrait; margin: 14mm; }
html, body { background: #fff; margin: 0; padding: 0; }
/* A4 portrait less 14mm margins = 182 x 269mm of content box. Pinning
   the sheet to exactly that, and scaling anything taller down to fit,
   is what guarantees one recipe per page — which is in turn what makes
   the contents' page numbers true. A recipe allowed to spill onto a
   second page would push every number after it out by one. */
.sheet {
  box-sizing: border-box;
  height: 269mm;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
  page-break-inside: avoid;
}
.sheet:last-child { page-break-after: auto; break-after: auto; }
.fit {
  transform-origin: top left;
  display: flex;
  flex-direction: column;
  height: 269mm;
  width: 100%;
}

/* Cover + contents */
.cover { page-break-after: always; break-after: page; text-align: center; padding-top: 38mm; }
.cover h1 { font-size: 34px; margin: 0 0 6px; letter-spacing: -0.5px; }
.cover .sub { font-size: 14px; color: var(--ink-soft); margin: 0 0 22px; }
.cover .count { display: inline-block; background: var(--accent); border: 1px solid var(--accent-line);
  color: var(--brand-dark); font-weight: 700; font-size: 13px; padding: 7px 16px; border-radius: 999px; }
.cover .criteria { max-width: 118mm; margin: 26px auto 0; font-size: 10.5px; line-height: 1.6; color: var(--muted); text-align: left; }
.cover .cover-logo { height: 70px; width: auto; margin-bottom: 18px; }
.cover .printed { margin-top: 30px; font-size: 10px; color: var(--muted); }

.toc { column-count: 2; column-gap: 12mm; margin-top: 6mm; }
.toc ul { list-style: none; margin: 0; padding: 0; }
.toc-cat { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;
  color: var(--brand-dark); margin: 9px 0 4px; break-after: avoid; }
.toc-row { display: flex; align-items: baseline; gap: 4px; font-size: 10.5px; line-height: 1.55; break-inside: avoid; }
.toc-title { color: var(--ink); }
.toc-dots { flex: 1; border-bottom: 1px dotted var(--line); transform: translateY(-2px); }
.toc-page { color: var(--muted); font-variant-numeric: tabular-nums; }

.nutri { margin: 0 0 10px; font-size: 10px; color: var(--ink-soft);
  background: #f8fafc; border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; }
.nutri--none { color: var(--muted); font-style: italic; }
.notes-block { margin-top: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 9px 12px; break-inside: avoid; }
.notes-block h2 { border: 0; margin: 0 0 4px; padding: 0; color: #92400e; }
.notes-block p { margin: 0; font-size: 10px; line-height: 1.5; color: #78350f; white-space: pre-line; }
.page-foot { margin-top: auto; padding-top: 8px; border-top: 1px solid var(--line);
  text-align: center; font-size: 8.5px; color: var(--muted); letter-spacing: .6px; }
.fmd { color: var(--muted); font-size: 16px; }
.fmd-note { max-width: 118mm; margin: 14px auto 0; font-size: 9.5px; color: var(--muted); line-height: 1.5; }
</style>
</head>
<body>
  <section class="cover">
    <img class="cover-logo" src="${LOGO_URL}" alt="" onerror="this.style.display='none'" />
    <h1>${esc(T.title)}</h1>
    <p class="sub">${esc(T.subtitle)}</p>
    <span class="count">${recipes.length} ${esc(T.recipes)}</span>
    <p class="criteria">${esc(T.criteria)}</p>
    ${anyFmd ? `<p class="fmd-note">※ ${esc(T.fmdNote)}</p>` : ''}
    <p class="printed">${esc(T.printed)} ${esc(printedOn)} · fredheim.org</p>
  </section>

  <section class="sheet"><div class="fit">
    <div class="header">
      <img class="logo" src="${LOGO_URL}" alt="" onerror="this.style.display='none'" />
      <div class="brand-strip"><b>Fredheim</b> · ${esc(T.title)}</div>
    </div>
    <h1 style="font-size:20px;margin:0 0 2mm">${esc(T.contents)}</h1>
    <div class="toc"><ul>${contentsHtml}</ul></div>
    <div class="page-foot">${esc(T.page)} 2 · fredheim.org</div>
  </div></section>

  ${recipePages}

<script>
  // Shrink any recipe that would otherwise run past the bottom of its
  // page. Same approach the app's own recipe printout uses — measure,
  // scale, never truncate — except here it must succeed on every page,
  // because the contents promises a page number per recipe.
  //
  // Runs synchronously at parse time rather than on load: --print-to-pdf
  // snapshots the page once the virtual clock drains, and anything left
  // in a load handler can miss that window.
  (function fitPages() {
    var sheets = document.querySelectorAll('.sheet');
    var tallest = 0, scaled = 0;
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var fit = sheet.querySelector('.fit');
      if (!fit) continue;
      var available = sheet.clientHeight;
      var needed = fit.scrollHeight;
      if (needed > tallest) tallest = needed;
      if (needed <= available || available <= 100) continue;
      var factor = available / needed;
      fit.style.transform = 'scale(' + factor + ')';
      fit.style.width = (100 / factor) + '%';
      fit.style.height = (available / factor) + 'px';
      scaled++;
    }
    document.title = document.title + ' [' + scaled + ' scaled]';
  })();
</script>
</body>
</html>`

// Written into public/ so the logo resolves as a same-origin file, then
// removed — Chrome is pointed at the file over file:// and relative
// asset paths have to land somewhere real.
const PUBLIC = path.join(__dirname, '..', 'public')
const htmlPath = path.join(PUBLIC, '__heart_healthy_book.html')
fs.writeFileSync(htmlPath, html, 'utf8')

const outName = { en: 'Fredheim-Heart-Healthy-Recipes.pdf', no: 'Fredheim-Hjerte-og-kolesterol.pdf', sv: 'Fredheim-Hjarta-och-kolesterol.pdf' }[LANG]
const outPath = path.join(__dirname, '..', outName)

console.log(`${recipes.length} recipes, ${recipes.filter(r => r.nutrition?.perServing).length} with nutrition`)
console.log('rendering with', path.basename(CHROME), '…')
execFileSync(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=60000',
  '--run-all-compositor-stages-before-draw',
  `--print-to-pdf=${outPath}`,
  '--no-pdf-header-footer',
  `file:///${htmlPath.replace(/\\/g, '/')}`,
], { stdio: 'inherit', timeout: 10 * 60 * 1000 })

fs.unlinkSync(htmlPath)
const kb = Math.round(fs.statSync(outPath).size / 1024)
// Cover + contents + one page per recipe. If the finished PDF disagrees
// with this, a recipe escaped the fit pass and the contents' page
// numbers are wrong from that point on — so it is worth checking.
const expectedPages = recipes.length + 2
console.log(`\n${outName} — ${kb} KB, expecting ${expectedPages} pages`)

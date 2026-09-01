/**
 * Open the whole week as one printable document — a contents page listing
 * every dish by day, then one page per recipe, in the order they are
 * cooked. "Save as PDF" in the print dialog turns it into a single file.
 *
 * Deliberately built on the browser's own print pipeline rather than a PDF
 * library: the app already ships a large bundle, and adding a PDF renderer
 * to produce something the browser can already make would be a poor trade.
 *
 * Each recipe appears once per day it is planned for, with that day's
 * serving count and ingredient amounts already scaled to it. A dish cooked
 * twice in a week at different sizes therefore prints twice — the
 * alternative is one copy whose amounts are wrong for at least one of the
 * days, which defeats the point of printing it at all.
 *
 * Portrait, thumbnail beside the title, ingredients and steps side by
 * side. Portrait is what a recipe is normally printed on, and a stack of
 * twenty-odd of them is a booklet rather than a wall chart — the week
 * grid is the landscape one, because it is a calendar.
 *
 * Nutrition and chef's notes are left out by choice: this is the document
 * you cook from, and at ~21 meals a week including them roughly doubles
 * the page count.
 */

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {number} [opts.familySize]
 * @param {Array<{
 *   dayLabel: string,
 *   slotLabel: string,
 *   servings: number,
 *   title: string,
 *   description?: string,
 *   imageUrl?: string|null,
 *   ingredients: Array<{ name: string, quantityLabel: string }>,
 *   steps: string[]
 * }>} opts.entries                    Already in cooking order, already scaled
 * @param {object} opts.labels         { contents, ingredients, instructions, servings, printedOn, recipesCount }
 * @param {string} [opts.locale]
 * @param {string} [opts.logoUrl='/fredheim-logo.svg']
 */
export function printMenuBook(opts) {
  const {
    title = 'Weekly Menu',
    familySize,
    entries = [],
    labels = {},
    locale,
    logoUrl = '/fredheim-logo.svg',
  } = opts

  const L = {
    contents: 'Contents',
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    servings: 'servings',
    printedOn: 'Printed',
    recipesCount: 'recipes',
    ...labels,
  }

  const printedOn = new Date().toLocaleDateString(locale || undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Contents, grouped by day. Days keep the order they arrive in — the
  // caller has already sorted them into cooking order.
  const byDay = []
  for (const e of entries) {
    let group = byDay.find(g => g.day === e.dayLabel)
    if (!group) { group = { day: e.dayLabel, items: [] }; byDay.push(group) }
    group.items.push(e)
  }

  let pageNo = 1
  const contentsRows = byDay.map(g => `
    <div class="toc-day">
      <div class="toc-day-name">${escapeHtml(g.day)}</div>
      <ul class="toc-list">
        ${g.items.map(it => {
          pageNo += 1
          return `<li>
            <span class="toc-slot">${escapeHtml(it.slotLabel)}</span>
            <span class="toc-title">${escapeHtml(it.title)}</span>
            <span class="toc-dots"></span>
            <span class="toc-page">${pageNo}</span>
          </li>`
        }).join('')}
      </ul>
    </div>`).join('')

  const recipePages = entries.map(e => `
    <section class="page recipe">
      <div class="r-head">
        ${e.imageUrl
          ? `<img class="r-thumb" src="${escapeHtml(e.imageUrl)}" alt="" />`
          : '<div class="r-thumb r-thumb--none">🍽</div>'}
        <div class="r-headtext">
          <div class="r-when">
            <span class="r-day">${escapeHtml(e.dayLabel)}</span>
            <span class="r-slot">${escapeHtml(e.slotLabel)}</span>
            <span class="r-serv">${e.servings} ${escapeHtml(L.servings)}</span>
          </div>
          <h2>${escapeHtml(e.title)}</h2>
          ${e.description ? `<p class="r-desc">${escapeHtml(e.description)}</p>` : ''}
        </div>
      </div>
      <div class="r-body">
        <div class="r-col">
          <h3>${escapeHtml(L.ingredients)}</h3>
          <ul class="ing">
            ${e.ingredients.map(i => `<li><span class="ing-name">${escapeHtml(i.name)}</span><span class="ing-qty">${escapeHtml(i.quantityLabel)}</span></li>`).join('')}
          </ul>
        </div>
        <div class="r-col r-col--steps">
          <h3>${escapeHtml(L.instructions)}</h3>
          <ol class="steps">
            ${e.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ol>
        </div>
      </div>
    </section>`).join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --brand: #22B24C;
    --brand-dark: #158a38;
    --ink: #1f2937;
    --ink-soft: #475569;
    --muted: #64748b;
    --line: #e2e8f0;
    --accent: #eef9f1;
    --accent-line: #bbe5c6;
    --indigo: #4f46e5;
    --indigo-soft: #eef2ff;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: #f1f5f9;
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 16px auto;
    padding: 13mm 14mm 12mm 14mm;
    background: #fff;
    box-shadow: 0 2px 18px rgba(15, 23, 42, .08);
    display: flex;
    flex-direction: column;
  }

  /* ── cover / contents ────────────────────────────────────────────── */
  .cover-head {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; border-bottom: 2px solid var(--brand);
    padding-bottom: 10px; margin-bottom: 14px;
  }
  .cover-left { display: flex; align-items: center; gap: 14px; }
  .logo { height: 54px; width: auto; }
  h1 { font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.3px; }
  .brand-strip {
    font-size: 9px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 1.4px; text-align: right;
  }
  .brand-strip b { color: var(--brand-dark); letter-spacing: 1px; }
  .chips { display: flex; gap: 6px; margin-bottom: 14px; }
  .chip {
    background: #f8fafc; border: 1px solid var(--line); color: var(--ink-soft);
    font-size: 10px; padding: 4px 9px; border-radius: 999px; line-height: 1;
  }
  .chip b { color: var(--ink); font-weight: 700; }
  .chip--accent { background: var(--accent); border-color: var(--accent-line); color: var(--brand-dark); font-weight: 700; }

  h2.toc-h { font-size: 11px; text-transform: uppercase; letter-spacing: .9px; color: var(--brand-dark); margin: 0 0 8px; }
  /* Contents runs in columns so a full week stays on the cover instead of
     spilling a few lines onto a page of its own. Two on portrait — three
     would leave each dish name about 55mm and wrap most of them. */
  .toc { column-count: 2; column-gap: 16px; }
  .toc-day { break-inside: avoid; margin-bottom: 10px; }
  .toc-day-name {
    font-size: 10.5px; font-weight: 800; color: var(--ink);
    background: var(--accent); border: 1px solid var(--accent-line);
    border-radius: 5px; padding: 2px 7px; display: inline-block; margin-bottom: 4px;
  }
  .toc-list { list-style: none; margin: 0; padding: 0; }
  .toc-list li { display: flex; align-items: baseline; gap: 5px; font-size: 9.5px; line-height: 1.6; }
  .toc-slot { color: var(--muted); font-size: 8px; text-transform: uppercase; letter-spacing: .4px; flex-shrink: 0; min-width: 13mm; }
  .toc-title { color: var(--ink-soft); overflow-wrap: anywhere; }
  .toc-dots { flex: 1; border-bottom: 1px dotted #cbd5e1; min-width: 6px; }
  .toc-page { color: var(--muted); font-variant-numeric: tabular-nums; flex-shrink: 0; }

  /* ── one recipe per page ─────────────────────────────────────────── */
  .recipe { break-before: page; page-break-before: always; }
  .r-head {
    display: flex; gap: 12px; align-items: flex-start;
    border-bottom: 2px solid var(--brand);
    padding-bottom: 9px; margin-bottom: 11px;
  }
  .r-thumb {
    width: 28mm; height: 28mm; flex-shrink: 0;
    object-fit: cover; border-radius: 8px; display: block; background: var(--indigo-soft);
  }
  .r-thumb--none { display: flex; align-items: center; justify-content: center; font-size: 22px; color: #a5b4fc; }
  .r-headtext { min-width: 0; flex: 1; }
  .r-when { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .r-day {
    font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px;
    background: var(--indigo); color: #fff; padding: 2px 7px; border-radius: 999px;
  }
  .r-slot {
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px;
    color: var(--brand-dark); background: var(--accent);
    border: 1px solid var(--accent-line); padding: 2px 7px; border-radius: 999px;
  }
  .r-serv { font-size: 9px; color: var(--muted); }
  .recipe h2 { font-size: 21px; margin: 0 0 3px; font-weight: 800; letter-spacing: -0.3px; line-height: 1.15; }
  .r-desc { margin: 0; font-size: 10.5px; line-height: 1.45; color: var(--ink-soft); }

  .r-body { display: grid; grid-template-columns: 1fr 1.7fr; gap: 16px; flex: 1; }
  .r-col h3 {
    font-size: 10px; text-transform: uppercase; letter-spacing: .9px;
    color: var(--brand-dark); margin: 0 0 6px; padding-bottom: 4px;
    border-bottom: 1px solid var(--accent-line);
  }
  .ing { list-style: none; margin: 0; padding: 0; }
  .ing li {
    display: flex; justify-content: space-between; gap: 8px; align-items: baseline;
    font-size: 10px; line-height: 1.5; padding: 2.5px 0;
    border-bottom: 1px dotted #e8edf3;
  }
  .ing-name { color: var(--ink-soft); overflow-wrap: anywhere; }
  .ing-qty { font-weight: 700; color: var(--ink); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .steps { margin: 0; padding-left: 16px; }
  .steps li { font-size: 10px; line-height: 1.5; color: var(--ink-soft); margin-bottom: 6px; overflow-wrap: anywhere; }

  .foot {
    margin-top: auto; padding-top: 8px; border-top: 1px solid var(--line);
    display: flex; justify-content: space-between; font-size: 8.5px; color: var(--muted);
  }

  @media print {
    html, body { background: #fff; }
    .page {
      width: auto; min-height: 0; margin: 0;
      padding: 0; box-shadow: none;
      /* Each page element owns one sheet. */
      break-after: page; page-break-after: always;
      min-height: 0;
    }
    .page:last-child { break-after: auto; page-break-after: auto; }
    @page { size: A4 portrait; margin: 14mm; }
    .ing li, .steps li, .toc-day { break-inside: avoid; page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <section class="page cover">
    <div class="cover-head">
      <div class="cover-left">
        <img class="logo" src="${escapeHtml(logoUrl)}" alt="" onerror="this.style.display='none'" />
        <h1>${escapeHtml(title)}</h1>
      </div>
      <div class="brand-strip"><b>Fredheim</b><br />Livsstilssenter</div>
    </div>
    <div class="chips">
      ${familySize ? `<span class="chip chip--accent"><b>${familySize}</b> ${escapeHtml(L.servings)}</span>` : ''}
      <span class="chip">📖 <b>${entries.length}</b> ${escapeHtml(L.recipesCount)}</span>
    </div>
    <h2 class="toc-h">${escapeHtml(L.contents)}</h2>
    <div class="toc">${contentsRows}</div>
    <div class="foot">
      <span>${escapeHtml(L.printedOn)} ${escapeHtml(printedOn)}</span>
      <span>fredheim.no</span>
    </div>
  </section>

  ${recipePages}

<script>
  window.addEventListener('load', function () {
    // Give the thumbnails a moment to decode so the first page isn't
    // measured (or printed) as a grid of empty boxes.
    var imgs = Array.prototype.slice.call(document.images);
    var pending = imgs.filter(function (i) { return !i.complete; }).length;
    function go() { setTimeout(function () { window.focus(); window.print(); }, 200); }
    if (!pending) return go();
    var fired = false;
    function done() { if (--pending <= 0 && !fired) { fired = true; go(); } }
    imgs.forEach(function (i) {
      if (i.complete) return;
      i.addEventListener('load', done);
      i.addEventListener('error', done);
    });
    setTimeout(function () { if (!fired) { fired = true; go(); } }, 4000);
  });
</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}

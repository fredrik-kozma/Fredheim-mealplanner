/**
 * Open a printable weekly menu in a new window and trigger the browser's
 * print dialog — an at-a-glance overview of what gets served each day.
 * "Save as PDF" in that dialog is how you get a PDF; no PDF library is
 * bundled, which matters when the app already ships a large bundle.
 *
 * Laid out as the planner's own grid — days across, meal slots down — so
 * the sheet reads like the screen it came from, with a thumbnail and the
 * complete dish name in every cell.
 *
 * That grid only works on landscape. A4 portrait gives each of seven days
 * about 25mm, which shreds a name like "Chiapudding med søt mandelmelk og
 * skogsbær"; landscape gives ~37mm, enough for a thumbnail above a name
 * wrapping to a few lines. Titles here average 21 characters, so most sit
 * on one or two lines and only the longest run to three.
 *
 * Fitting one sheet is handled the same way printRecipe.js does it:
 * measure, scale down to a readable floor, and past that let the sheet
 * flow to a second page rather than shrink into illegibility. That is the
 * answer to "what if there are more recipes" — it degrades by shrinking
 * first and paginating second, never by truncating a name.
 *
 * The caller passes pre-resolved, already-translated strings so this
 * module stays free of i18n, exactly like printRecipe.js and
 * printShoppingList.js, and shares their brand styling.
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
 * @param {string} opts.title                Week title (plan name, or a generic fallback)
 * @param {number} [opts.familySize]
 * @param {string[]} opts.slotLabels         Meal-slot names, in planner order — these are the grid's rows
 * @param {Array<{
 *   label: string,
 *   isToday?: boolean,
 *   slots: Object<string, Array<{ title: string, servings: number|null, batch?: boolean, imageUrl?: string|null }>>
 * }>} opts.days                             One entry per planner day, keyed by slot label
 * @param {Array<{ title: string, servings: number|null, isText?: boolean }>} [opts.batchCook]
 * @param {string} [opts.notes]              Week-level "smart tips" prose
 * @param {object} opts.labels               { forPeople, people, meals, batchCook, notesTitle, printedOn, batchTag, servingsShort }
 * @param {string} [opts.locale]             BCP-47 tag for the printed date
 * @param {string} [opts.logoUrl='/fredheim-logo.svg']
 */
export function printWeekPlan(opts) {
  const {
    title = 'Weekly Menu',
    familySize,
    slotLabels = [],
    days = [],
    batchCook = [],
    notes = '',
    labels = {},
    locale,
    logoUrl = '/fredheim-logo.svg',
  } = opts

  const L = {
    forPeople: 'For',
    people: 'people',
    meals: 'meals',
    batchCook: 'Batch cooking',
    notesTitle: 'Smart tips',
    printedOn: 'Printed',
    batchTag: 'batch',
    servingsShort: 'p',
    ...labels,
  }

  const printedOn = new Date().toLocaleDateString(locale || undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  let totalMeals = 0
  for (const d of days) {
    for (const slot of slotLabels) totalMeals += (d.slots?.[slot] || []).length
  }

  const metaChips = []
  if (familySize) {
    metaChips.push(`<span class="chip chip--accent">${escapeHtml(L.forPeople)} <b>${familySize}</b> ${escapeHtml(L.people)}</span>`)
  }
  if (totalMeals) {
    metaChips.push(`<span class="chip">🍽 <b>${totalMeals}</b> ${escapeHtml(L.meals)}</span>`)
  }

  function cell(items) {
    if (!items || items.length === 0) return '<td class="cell cell--empty"></td>'
    const dishes = items.map(it => `
      <div class="dish">
        ${it.imageUrl
          ? `<img class="thumb" src="${escapeHtml(it.imageUrl)}" alt="" />`
          : '<div class="thumb thumb--none">🍽</div>'}
        <div class="dish-text">
          <span class="dish-name">${escapeHtml(it.title)}</span>
          ${it.servings ? `<span class="dish-serv">${it.servings}${escapeHtml(L.servingsShort)}</span>` : ''}
          ${it.batch ? `<span class="dish-batch">${escapeHtml(L.batchTag)}</span>` : ''}
        </div>
      </div>`).join('')
    return `<td class="cell">${dishes}</td>`
  }

  const headRow = `
    <tr>
      <th class="corner"></th>
      ${days.map(d => `<th class="day-head${d.isToday ? ' day-head--today' : ''}">${escapeHtml(d.label)}</th>`).join('')}
    </tr>`

  const bodyRows = slotLabels.map(slot => `
    <tr>
      <th class="slot-head">${escapeHtml(slot)}</th>
      ${days.map(d => cell(d.slots?.[slot])).join('')}
    </tr>`).join('')

  const batchBlock = batchCook.length ? `
    <section class="extra">
      <h2>${escapeHtml(L.batchCook)}</h2>
      <ul class="batch">
        ${batchCook.map(b => `<li>${escapeHtml(b.title)}${b.servings && !b.isText ? ` <span class="muted">· ${b.servings}${escapeHtml(L.servingsShort)}</span>` : ''}</li>`).join('')}
      </ul>
    </section>` : ''

  const notesBlock = notes && notes.trim() ? `
    <section class="extra">
      <h2>${escapeHtml(L.notesTitle)}</h2>
      <p class="notes">${escapeHtml(notes)}</p>
    </section>` : ''

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
    --amber: #92400e;
    --amber-soft: #fef3c7;
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
  /* Landscape sheet — the grid needs the width. */
  .sheet {
    width: 297mm;
    min-height: 210mm;
    margin: 16px auto;
    padding: 10mm 10mm 9mm 10mm;
    background: #fff;
    box-shadow: 0 2px 18px rgba(15, 23, 42, .08);
    display: flex;
    flex-direction: column;
  }
  .scale { transform-origin: top left; display: flex; flex-direction: column; flex: 1; }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 2px solid var(--brand);
    padding-bottom: 8px;
    margin-bottom: 10px;
  }
  .header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .logo { height: 46px; width: auto; flex-shrink: 0; }
  h1 {
    font-size: 20px; line-height: 1.15; margin: 0;
    color: var(--ink); font-weight: 800; letter-spacing: -0.3px;
  }
  .brand-strip {
    font-size: 9px; color: var(--muted);
    text-transform: uppercase; letter-spacing: 1.4px; text-align: right;
  }
  .brand-strip b { color: var(--brand-dark); letter-spacing: 1px; }

  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .chip {
    background: #f8fafc; border: 1px solid var(--line); color: var(--ink-soft);
    font-size: 10px; padding: 4px 9px; border-radius: 999px; line-height: 1;
  }
  .chip b { color: var(--ink); font-weight: 700; }
  .chip--accent { background: var(--accent); border-color: var(--accent-line); color: var(--brand-dark); font-weight: 700; }

  /* ── the week grid ───────────────────────────────────────────────── */
  table.week { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .corner { width: 17mm; border: none; }
  .day-head {
    font-size: 10.5px; font-weight: 700; color: var(--ink-soft);
    padding: 4px 3px; text-align: center;
    border-bottom: 1px solid var(--line);
  }
  /* Today is highlighted on screen; carry that through so the sheet and
     the planner read the same. */
  .day-head--today {
    background: var(--indigo); color: #fff;
    border-radius: 6px 6px 0 0; border-bottom-color: var(--indigo);
  }
  .slot-head {
    font-size: 8.5px; font-weight: 700; color: var(--muted);
    text-transform: uppercase; letter-spacing: .6px;
    text-align: left; vertical-align: middle;
    padding: 4px 6px 4px 0; white-space: nowrap;
  }
  .cell {
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 3px;
    vertical-align: top;
    background: #fff;
  }
  .cell--empty { background: #fafbfc; }

  .dish { display: flex; gap: 4px; align-items: flex-start; padding: 2px; }
  .dish + .dish { border-top: 1px dashed var(--line); margin-top: 3px; padding-top: 4px; }
  .thumb {
    width: 11mm; height: 11mm; flex-shrink: 0;
    object-fit: cover; border-radius: 4px; display: block;
    background: var(--indigo-soft);
  }
  .thumb--none {
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; color: #a5b4fc;
  }
  .dish-text { min-width: 0; flex: 1; }
  /* The whole point of the sheet: names are never truncated. They wrap,
     and the fit pass below shrinks the page rather than clipping them. */
  .dish-name {
    display: block;
    font-size: 8.5px; line-height: 1.2; font-weight: 600; color: var(--ink);
    overflow-wrap: anywhere;
  }
  .dish-serv { font-size: 7.5px; color: var(--muted); }
  .dish-batch {
    font-size: 6.5px; font-weight: 700; text-transform: uppercase;
    background: var(--amber-soft); color: var(--amber);
    padding: 1px 3px; border-radius: 3px; margin-left: 3px; white-space: nowrap;
  }

  /* ── below the grid ──────────────────────────────────────────────── */
  .extras { display: flex; gap: 14px; margin-top: 10px; align-items: flex-start; }
  .extra { flex: 1; break-inside: avoid; }
  .extra h2 {
    font-size: 9.5px; font-weight: 700; color: var(--brand-dark);
    text-transform: uppercase; letter-spacing: .8px;
    margin: 0 0 4px; padding-bottom: 3px; border-bottom: 1px solid var(--accent-line);
  }
  .batch { margin: 0; padding-left: 14px; }
  .batch li { font-size: 9px; line-height: 1.45; color: var(--ink-soft); }
  .muted { color: var(--muted); }
  .notes { margin: 0; font-size: 9px; line-height: 1.45; color: var(--ink-soft); white-space: pre-line; }

  .footer {
    margin-top: auto; padding-top: 8px;
    border-top: 1px solid var(--line);
    display: flex; justify-content: space-between;
    font-size: 8.5px; color: var(--muted);
  }

  @media print {
    html, body { background: #fff; }
    .sheet {
      width: auto; min-height: 0; margin: 0;
      padding: 0; box-shadow: none;
    }
    @page { size: A4 landscape; margin: 10mm; }
    .sheet.multi-page .scale { flex: none; display: block; }
    tr, .dish, .extra { break-inside: avoid; page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="sheet" id="sheet">
    <div class="scale" id="scale">
      <div class="header">
        <div class="header-left">
          <img class="logo" src="${escapeHtml(logoUrl)}" alt="" onerror="this.style.display='none'" />
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="brand-strip"><b>Fredheim</b><br />Livsstilssenter</div>
      </div>

      ${metaChips.length ? `<div class="chips">${metaChips.join('')}</div>` : ''}

      <table class="week">
        <thead>${headRow}</thead>
        <tbody>${bodyRows}</tbody>
      </table>

      ${batchBlock || notesBlock ? `<div class="extras">${batchBlock}${notesBlock}</div>` : ''}

      <div class="footer">
        <span>${escapeHtml(L.printedOn)} ${escapeHtml(printedOn)}</span>
        <span>fredheim.no</span>
      </div>
    </div>
  </div>

<script>
  // Same three-way strategy as the recipe sheet: fit naturally, else
  // shrink to a readable floor, else paginate. A grid that shrank without
  // limit would defeat the purpose — the names have to stay readable.
  var MIN_SCALE = 0.62;

  function layout() {
    var scale = document.getElementById('scale');
    var sheet = document.getElementById('sheet');
    scale.style.transform = '';
    scale.style.width = '';
    sheet.classList.remove('multi-page');

    var cs = window.getComputedStyle(sheet);
    var available = sheet.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    var needed = scale.scrollHeight;
    if (needed <= available || available <= 100) return;

    var factor = available / needed;
    if (factor >= MIN_SCALE) {
      scale.style.transform = 'scale(' + factor + ')';
      scale.style.width = (100 / factor) + '%';
    } else {
      sheet.classList.add('multi-page');
    }
  }

  function ready() {
    // Thumbnails are data URLs, but decoding still lands after load on a
    // big week — measuring first would size the page to a grid of empty
    // boxes.
    var imgs = Array.prototype.slice.call(document.images);
    var pending = imgs.filter(function (i) { return !i.complete; }).length;
    if (!pending) return layout();
    imgs.forEach(function (i) {
      if (i.complete) return;
      i.addEventListener('load', done);
      i.addEventListener('error', done);
    });
    function done() { if (--pending <= 0) layout(); }
    setTimeout(layout, 2000);
  }

  window.addEventListener('load', function () {
    ready();
    setTimeout(function () { window.print(); }, 250);
  });
  window.addEventListener('resize', layout);
</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}

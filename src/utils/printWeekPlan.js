/**
 * Open a printable weekly menu in a new window and trigger the browser's
 * print dialog — an at-a-glance overview of what gets served each day.
 *
 * Laid out as one card per day rather than a 7-column grid on purpose: a
 * grid gives each day ~25mm of width on A4, which forces long dish names
 * ("Chiapudding med søt mandelmelk og skogsbær") to truncate or wrap to
 * shreds. Cards flowed through two columns give each name the full column
 * width, so titles always land intact — the whole point of this printout.
 *
 * The caller passes pre-resolved, already-translated strings so this module
 * stays free of i18n, exactly like printRecipe.js and printShoppingList.js,
 * and shares their brand styling so all three feel like one family.
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
 * @param {Array<{
 *   label: string,
 *   slots: Array<{ label: string, items: Array<{ title: string, servings: number|null, batch?: boolean }> }>
 * }>} opts.days                             Days that actually have meals; empty slots already filtered out
 * @param {Array<{ title: string, servings: number|null, isText?: boolean }>} [opts.batchCook]
 * @param {string} [opts.notes]              Week-level "smart tips" prose
 * @param {object} opts.labels               Localized UI strings:
 *   { forPeople, people, meals, batchCook, notesTitle, printedOn, batchTag }
 * @param {string} [opts.locale]             BCP-47 tag for the printed date. Pass the
 *   app's language so a Norwegian sheet doesn't date itself in English —
 *   the browser locale (the default) is often not the app's.
 * @param {string} [opts.logoUrl='/fredheim-logo.svg']
 */
export function printWeekPlan(opts) {
  const {
    title = 'Weekly Menu',
    familySize,
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
    ...labels,
  }

  const totalMeals = days.reduce(
    (sum, d) => sum + d.slots.reduce((s2, sl) => s2 + sl.items.length, 0),
    0
  )

  // A serving count is only worth printing when it was explicitly set on the
  // slot. Items left to follow the household size say nothing per-line — the
  // header chip already states what the whole sheet is portioned for.
  const servingBadge = (n) =>
    n == null ? '' : `<span class="serv">👥&nbsp;${escapeHtml(String(n))}</span>`

  const dayCards = days
    .map(
      (day) => `
      <section class="day">
        <div class="day-head">
          <span class="day-name">${escapeHtml(day.label)}</span>
        </div>
        ${day.slots
          .map(
            (slot) => `
          <div class="slot">
            <div class="slot-label">${escapeHtml(slot.label)}</div>
            <ul class="dishes">
              ${slot.items
                .map(
                  (it) => `
                <li>
                  <span class="dish">${escapeHtml(it.title)}${
                    it.batch ? `<span class="batch-tag">${escapeHtml(L.batchTag)}</span>` : ''
                  }</span>
                  ${servingBadge(it.servings)}
                </li>`
                )
                .join('')}
            </ul>
          </div>`
          )
          .join('')}
      </section>`
    )
    .join('')

  const batchItems = batchCook
    .map(
      (b) => `
      <li>
        <span class="dish">${escapeHtml(b.title)}</span>
        ${b.isText ? '' : servingBadge(b.servings)}
      </li>`
    )
    .join('')

  const printedDate = new Date().toLocaleDateString(locale || undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const metaChips = []
  if (familySize) {
    metaChips.push(
      `<span class="chip chip--accent">👥 ${escapeHtml(L.forPeople)} <b>${familySize}</b> ${escapeHtml(L.people)}</span>`
    )
  }
  if (totalMeals) {
    metaChips.push(`<span class="chip">🍽 <b>${totalMeals}</b> ${escapeHtml(L.meals)}</span>`)
  }

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
  .sheet {
    width: 210mm;
    min-height: 297mm;
    margin: 16px auto;
    padding: 14mm 14mm 12mm 14mm;
    background: #fff;
    box-shadow: 0 2px 18px rgba(15, 23, 42, .08);
    display: flex;
    flex-direction: column;
  }
  .scale {
    transform-origin: top left;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 2px solid var(--brand);
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .logo { height: 140px; width: auto; flex-shrink: 0; }
  .brand-strip {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    text-align: right;
    padding-top: 6px;
  }
  .brand-strip b { color: var(--brand-dark); letter-spacing: 1px; }

  .title-block { margin-bottom: 10px; }
  h1 {
    font-size: 26px;
    line-height: 1.15;
    margin: 0;
    color: var(--ink);
    font-weight: 800;
    letter-spacing: -0.3px;
  }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .chip {
    background: #f8fafc;
    border: 1px solid var(--line);
    color: var(--ink-soft);
    font-size: 11px;
    padding: 5px 10px;
    border-radius: 999px;
    line-height: 1;
  }
  .chip b { color: var(--ink); font-weight: 700; }
  .chip--accent {
    background: var(--accent);
    border-color: var(--accent-line);
    color: var(--brand-dark);
    font-weight: 700;
  }

  /* Day cards flowed through two columns. Each card stays whole. */
  .days { column-count: 2; column-gap: 14px; }
  .day {
    break-inside: avoid;
    page-break-inside: avoid;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .day-head {
    background: var(--accent);
    border-bottom: 1px solid var(--accent-line);
    padding: 6px 10px;
  }
  .day-name {
    font-size: 12px;
    font-weight: 800;
    color: var(--brand-dark);
    text-transform: uppercase;
    letter-spacing: 1.2px;
  }
  .slot { padding: 6px 10px; border-bottom: 1px dotted var(--line); }
  .slot:last-child { border-bottom: 0; }
  .slot-label {
    font-size: 8.5px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--muted);
    font-weight: 800;
    margin-bottom: 3px;
  }
  ul.dishes { list-style: none; padding: 0; margin: 0; }
  ul.dishes li {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 2px 0;
    font-size: 11px;
    line-height: 1.35;
  }
  /* The dish name gets the whole column and wraps rather than truncating —
     a printed menu with a clipped title is useless. */
  .dish { flex: 1; color: var(--ink); min-width: 0; }
  .serv {
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 9.5px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .batch-tag {
    display: inline-block;
    margin-left: 5px;
    padding: 1px 5px;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    font-size: 7.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    vertical-align: 1px;
  }

  .block {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .block h2 {
    font-size: 11px;
    margin: 0 0 6px 0;
    color: var(--brand-dark);
    text-transform: uppercase;
    letter-spacing: 1.6px;
    font-weight: 800;
  }
  .block ul.dishes { column-count: 2; column-gap: 14px; }
  .block ul.dishes li { break-inside: avoid; }
  .notes-text {
    font-size: 10px;
    line-height: 1.5;
    color: var(--ink-soft);
    margin: 0;
    white-space: pre-wrap;
  }

  .footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    text-align: center;
    color: var(--muted);
    font-size: 9.5px;
    letter-spacing: 0.8px;
  }
  .footer .coop {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 9px;
    color: var(--ink-soft);
    letter-spacing: 0.4px;
  }
  .footer .coop img { height: 16px; width: auto; object-fit: contain; }
  .footer .coop .dot { color: var(--muted); padding: 0 2px; }

  .print-btn {
    position: fixed;
    top: 16px;
    right: 16px;
    background: var(--brand);
    color: #fff;
    border: 0;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    padding: 10px 18px;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(34, 178, 76, .35);
    z-index: 999;
  }
  .print-btn:hover { background: var(--brand-dark); }

  /* ── Print break protections ────────────────────────────────────────── */
  .header { break-after: avoid; page-break-after: avoid; }
  .title-block { break-after: avoid; page-break-after: avoid; }
  .chips { break-inside: avoid; page-break-inside: avoid; }
  .footer { break-inside: avoid; page-break-inside: avoid; }

  /* ── Multi-page mode ─────────────────────────────────────────────────
     A very full week (many dishes per slot, or extra days) drops the scale
     transform and flows across A4 sheets instead of shrinking to unreadable
     type. Single-column there, so a card never straddles a page break. */
  .sheet.multi-page { min-height: 0; height: auto; }
  .sheet.multi-page .scale { flex: none; display: block; }
  .sheet.multi-page .days { column-count: 1; }

  @page { size: A4 portrait; margin: 14mm; }
  @media print {
    html, body { background: #fff; }
    .sheet {
      margin: 0;
      box-shadow: none;
      width: auto;
      min-height: 0;
      padding: 0;
    }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨 Print</button>
  <div class="sheet">
    <div class="scale" id="scale">
      <div class="header">
        <img class="logo" src="${escapeHtml(logoUrl)}" alt="Fredheim Livsstilssenter" onerror="this.style.display='none'" />
        <div class="brand-strip"><b>Fredheim</b> · Livsstilssenter</div>
      </div>

      <div class="title-block">
        <h1>${escapeHtml(title)}</h1>
      </div>

      ${metaChips.length ? `<div class="chips">${metaChips.join('')}</div>` : ''}

      <div class="days">${dayCards}</div>

      ${batchItems ? `
        <div class="block">
          <h2>${escapeHtml(L.batchCook)}</h2>
          <ul class="dishes">${batchItems}</ul>
        </div>` : ''}

      ${notes && notes.trim() ? `
        <div class="block">
          <h2>${escapeHtml(L.notesTitle)}</h2>
          <p class="notes-text">${escapeHtml(notes.trim())}</p>
        </div>` : ''}

      <div class="footer">
        <div class="coop">
          <img src="/fredheim-logo.svg" alt="" onerror="this.style.display='none'" />
          <span>Fredheim Livsstilssenter</span>
          <span class="dot">·</span>
          <img src="/Vivera_Health_logo.png" alt="" onerror="this.style.display='none'" />
          <span>Vivera Health</span>
        </div>
        ${escapeHtml(L.printedOn)} ${escapeHtml(printedDate)} · fredheim.org
      </div>
    </div>
  </div>

<script>
  // Same three-tier layout strategy as the recipe and shopping-list sheets:
  //   - Fits naturally: no scaling
  //   - Fits at >= 72%: shrink onto one page
  //   - Longer: flow across A4 sheets rather than shrink past readability
  var MIN_SCALE = 0.72;

  function layoutSheet() {
    var scale = document.getElementById('scale');
    var sheet = scale.parentElement;

    scale.style.transform = '';
    scale.style.width = '';
    sheet.classList.remove('multi-page');

    var cs = window.getComputedStyle(sheet);
    var padTop = parseFloat(cs.paddingTop) || 0;
    var padBottom = parseFloat(cs.paddingBottom) || 0;
    var available = sheet.clientHeight - padTop - padBottom;
    var needed = scale.scrollHeight;

    if (needed <= available || available <= 100) return;

    var factor = available / needed;
    if (factor >= MIN_SCALE) {
      scale.style.transform = 'scale(' + factor + ')';
      scale.style.transformOrigin = 'top left';
      scale.style.width = (100 / factor) + '%';
    } else {
      sheet.classList.add('multi-page');
    }
  }
  layoutSheet();

  window.addEventListener('load', function () {
    setTimeout(function () {
      window.focus();
      window.print();
    }, 350);
  });
</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Please allow pop-ups to print the weekly menu.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

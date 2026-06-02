/**
 * Open a printable shopping list in a new window and trigger the browser's
 * print dialog. The layout uses a two-column grid so most lists fit on a
 * single A4 page, and auto-scales down if needed.
 *
 * Mirrors the style of printRecipe.js so both printouts feel like part of
 * the same Fredheim brand family.
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
 * @param {string} opts.title                  e.g. "Shopping List"
 * @param {Array<{category:string, items:Array<{name:string, quantityLabel:string}>}>} opts.groups
 * @param {number} [opts.familySize]
 * @param {string[]} [opts.recipeTitles]       Recipes this list was generated from
 * @param {object} opts.labels                 Localized UI strings:
 *   { forPeople, fromRecipes, printedOn, totalItems }
 * @param {string} [opts.logoUrl='/fredheim-logo.svg']
 */
export function printShoppingList(opts) {
  const {
    title = 'Shopping List',
    groups = [],
    familySize,
    recipeTitles = [],
    labels = {},
    logoUrl = '/fredheim-logo.svg',
  } = opts

  const L = {
    forPeople: 'For',
    fromRecipes: 'From recipes',
    printedOn: 'Printed',
    totalItems: 'items',
    people: 'people',
    ...labels,
  }

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)

  const groupSections = groups
    .map(
      ({ category, items }) => `
      <section class="aisle">
        <h2>${escapeHtml(category)}</h2>
        <ul class="items">
          ${items
            .map(
              (it) => `
            <li>
              <span class="check"></span>
              <span class="item-name">${escapeHtml(it.name)}</span>
              <span class="item-qty">${escapeHtml(it.quantityLabel || '')}</span>
            </li>`
            )
            .join('')}
        </ul>
      </section>`
    )
    .join('')

  const recipeChips = recipeTitles
    .map((r) => `<span class="chip">${escapeHtml(r)}</span>`)
    .join('')

  const printedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const metaChips = []
  if (familySize) {
    metaChips.push(
      `<span class="chip chip--accent">👥 ${escapeHtml(L.forPeople)} <b>${familySize}</b> ${escapeHtml(L.people)}</span>`
    )
  }
  if (totalItems) {
    metaChips.push(
      `<span class="chip">🛒 <b>${totalItems}</b> ${escapeHtml(L.totalItems)}</span>`
    )
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
  .logo {
    height: 140px;
    width: auto;
    flex-shrink: 0;
  }
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
    font-size: 28px;
    line-height: 1.15;
    margin: 0 0 6px 0;
    color: var(--ink);
    font-weight: 800;
    letter-spacing: -0.3px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
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
    border-color: #bbe5c6;
    color: var(--brand-dark);
    font-weight: 700;
  }

  /* Two-column layout so most lists fit on one page */
  .aisles {
    column-count: 2;
    column-gap: 24px;
    flex: 1;
  }
  .aisle {
    break-inside: avoid;
    margin-bottom: 14px;
  }
  h2 {
    font-size: 12px;
    margin: 0 0 8px 0;
    color: var(--brand-dark);
    text-transform: uppercase;
    letter-spacing: 1.6px;
    font-weight: 800;
    border-bottom: 1px solid var(--line);
    padding-bottom: 5px;
  }

  ul.items { list-style: none; padding: 0; margin: 0; }
  ul.items li {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px dotted var(--line);
    font-size: 11.5px;
    break-inside: avoid;
  }
  .check {
    flex-shrink: 0;
    width: 12px;
    height: 12px;
    border: 1.5px solid var(--ink-soft);
    border-radius: 3px;
    display: inline-block;
    margin-top: 1px;
  }
  .item-name { flex: 1; color: var(--ink); }
  .item-qty {
    color: var(--ink-soft);
    font-weight: 600;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .recipes-block {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  .recipes-block .label {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .recipes-block .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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
  .footer .coop img {
    height: 16px;
    width: auto;
    object-fit: contain;
  }
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
  h2 { break-after: avoid; page-break-after: avoid; }
  .header { break-after: avoid; page-break-after: avoid; }
  .title-block { break-after: avoid; page-break-after: avoid; }
  .chips { break-inside: avoid; page-break-inside: avoid; }
  .recipes-block { break-inside: avoid; page-break-inside: avoid; }
  .footer { break-inside: avoid; page-break-inside: avoid; }

  /* ── Multi-page mode ─────────────────────────────────────────────────
     For very long shopping lists, drop the scale transform and let the
     content flow across multiple A4 pages. The 2-column aisle layout
     becomes 1 column so each aisle stays vertically intact even when a
     page break lands inside it. */
  .sheet.multi-page { min-height: 0; height: auto; }
  .sheet.multi-page .scale { flex: none; display: block; }
  .sheet.multi-page .aisles { column-count: 1; }

  /* @page margin gives every printed page (incl. pages 2+ in multi-page
     mode) proper white space at the top/sides. */
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

      <div class="aisles">
        ${groupSections}
      </div>

      ${recipeChips ? `
        <div class="recipes-block">
          <div class="label">${escapeHtml(L.fromRecipes)}</div>
          <div class="chip-row">${recipeChips}</div>
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
  // Smart layout — same three-tier strategy as the recipe printout:
  //   - Short list (fits naturally): no scaling
  //   - Medium list (fits at >= 72% scale): shrink to one page
  //   - Long list: drop scaling, let it flow across multiple A4 sheets
  //     with break-inside rules so aisles never split mid-section
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
    alert('Please allow pop-ups to print the shopping list.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

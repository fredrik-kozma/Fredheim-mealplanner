/**
 * Open a printable, single-page recipe card in a new window and trigger the
 * browser's print dialog. The layout auto-scales down if the content exceeds
 * one A4 page so it always fits on one sheet.
 *
 * The caller passes pre-resolved strings (title, description, ingredients,
 * steps) so this module doesn't need to know about i18n — the RecipeDetail
 * view already computes the correct language-specific content and passes it
 * through here.
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
 * @param {string} [opts.description]
 * @param {string} [opts.imageUrl]        Data URL or http(s) URL
 * @param {string} [opts.category]
 * @param {number|null} [opts.prepTime]   Minutes
 * @param {number|null} [opts.cookTime]   Minutes
 * @param {number|null} [opts.servings]
 * @param {Array<{name:string, quantityLabel:string}>} opts.ingredients
 * @param {string[]} opts.steps
 * @param {object} opts.labels  Localized UI strings:
 *   { ingredients, instructions, servings, prep, cook, category, printedOn }
 * @param {string} [opts.locale]  BCP-47 tag for the printed date. Pass the
 *   app's language so a Norwegian sheet doesn't date itself in English —
 *   the browser locale (the default) is often not the app's.
 * @param {string} [opts.logoUrl='/fredheim-logo.svg']
 */
export function printRecipe(opts) {
  const {
    title,
    description,
    imageUrl,
    category,
    prepTime,
    cookTime,
    servings,
    conditions = [],
    ingredients = [],
    steps = [],
    labels = {},
    locale,
    logoUrl = '/fredheim-logo.svg',
  } = opts

  const L = {
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    servings: 'Servings',
    prep: 'Prep',
    cook: 'Cook',
    category: 'Category',
    printedOn: 'Printed',
    goodFor: 'Good for',
    ...labels,
  }

  const chips = []
  if (servings) chips.push(`<span class="chip">🍽 ${escapeHtml(L.servings)}: <b>${servings}</b></span>`)
  if (prepTime) chips.push(`<span class="chip">⏱ ${escapeHtml(L.prep)}: <b>${prepTime}m</b></span>`)
  if (cookTime) chips.push(`<span class="chip">🔥 ${escapeHtml(L.cook)}: <b>${cookTime}m</b></span>`)
  if (category) chips.push(`<span class="chip chip--accent">${escapeHtml(category)}</span>`)

  // "Good for" health-condition chips — so the printed sheet shows at a
  // glance what the recipe supports (diabetes, blood pressure, etc.).
  const conditionChips = conditions
    .map((c) => `<span class="chip chip--health">${c.icon ? c.icon + ' ' : ''}${escapeHtml(c.label)}</span>`)
    .join('')

  const ingredientItems = ingredients
    .map(
      (ing) => `
      <li>
        <span class="ing-name">${escapeHtml(ing.name)}</span>
        <span class="ing-qty">${escapeHtml(ing.quantityLabel || '')}</span>
      </li>`
    )
    .join('')

  const stepItems = steps
    .map(
      (s, i) => `
      <li>
        <span class="step-num">${i + 1}</span>
        <span class="step-text">${escapeHtml(s)}</span>
      </li>`
    )
    .join('')

  const printedDate = new Date().toLocaleDateString(locale || undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

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

  .title-block { margin-bottom: 12px; }
  h1 {
    font-size: 30px;
    line-height: 1.15;
    margin: 0 0 6px 0;
    color: var(--ink);
    font-weight: 800;
    letter-spacing: -0.3px;
  }
  .desc {
    color: var(--ink-soft);
    font-size: 12.5px;
    line-height: 1.5;
    margin: 0;
  }

  .hero {
    width: 100%;
    height: 180px;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0 12px 0;
    background: #f1f5f9;
  }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }

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
  .good-for {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: -6px 0 14px 0;
  }
  .good-for .label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--muted);
  }
  .chip--health {
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #3730a3;
    font-size: 11px;
    padding: 5px 10px;
    border-radius: 999px;
    line-height: 1;
    font-weight: 700;
  }

  .body {
    display: grid;
    grid-template-columns: 1fr 1.7fr;
    gap: 22px;
    flex: 1;
  }
  h2 {
    font-size: 14px;
    margin: 0 0 10px 0;
    color: var(--brand-dark);
    text-transform: uppercase;
    letter-spacing: 1.8px;
    font-weight: 800;
    border-bottom: 1px solid var(--line);
    padding-bottom: 6px;
  }

  ul.ingredients { list-style: none; padding: 0; margin: 0; }
  ul.ingredients li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
    padding: 5px 0;
    border-bottom: 1px dotted var(--line);
    font-size: 11.5px;
    /* Never split a single ingredient row across two pages */
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .ing-name { color: var(--ink); }
  .ing-qty { color: var(--ink-soft); font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }

  ol.steps { list-style: none; padding: 0; margin: 0; }
  ol.steps li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 9px;
    font-size: 11.5px;
    line-height: 1.55;
    color: var(--ink);
    /* Each numbered step stays intact, never splits across pages */
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* ── Print break protections ──────────────────────────────────────────
     These rules keep the page nice no matter how long the recipe is.
     - Section headings stick to their first row of content (no orphans)
     - The header / hero / chips / footer never split mid-element */
  h2 { break-after: avoid; page-break-after: avoid; }
  .header { break-after: avoid; page-break-after: avoid; }
  .title-block { break-after: avoid; page-break-after: avoid; }
  .hero { break-inside: avoid; page-break-inside: avoid; break-after: avoid; }
  .chips { break-inside: avoid; page-break-inside: avoid; }
  .footer { break-inside: avoid; page-break-inside: avoid; }
  .step-num {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--brand);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  .footer {
    margin-top: 14px;
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

  /* ── Multi-page mode ─────────────────────────────────────────────────
     When the recipe is too long to fit one A4 even at our minimum readable
     scale, we drop the scale transform and let the sheet grow naturally.
     The browser handles page breaks across A4 sheets using the
     break-inside rules above. */
  .sheet.multi-page { min-height: 0; height: auto; }
  .sheet.multi-page .scale { flex: none; display: block; }
  /* Stacked columns flow more predictably across page boundaries than
     a side-by-side grid does on a multi-page recipe. */
  .sheet.multi-page .body { grid-template-columns: 1fr; gap: 18px; }

  /* @page margin lets every printed page (incl. pages 2+ in multi-page
     mode) start with proper white space at the top/sides. The on-screen
     preview keeps its own .sheet padding for the page-card look. */
  @page { size: A4 portrait; margin: 14mm; }
  @media print {
    html, body { background: #fff; }
    .sheet {
      margin: 0;
      box-shadow: none;
      width: auto;          /* fill the @page printable area */
      min-height: 0;
      padding: 0;            /* @page margin replaces sheet padding */
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
        ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ''}
      </div>

      ${imageUrl ? `<div class="hero"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" /></div>` : ''}

      ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}

      ${conditionChips ? `<div class="good-for"><span class="label">${escapeHtml(L.goodFor)}</span>${conditionChips}</div>` : ''}

      <div class="body">
        <section>
          <h2>${escapeHtml(L.ingredients)}</h2>
          <ul class="ingredients">${ingredientItems}</ul>
        </section>
        <section>
          <h2>${escapeHtml(L.instructions)}</h2>
          <ol class="steps">${stepItems}</ol>
        </section>
      </div>

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
  // Smart layout: pick the best of three strategies based on content length.
  //
  //  - Short recipe (fits naturally): no scaling, no multi-page
  //  - Medium recipe (fits at >= 72% scale): shrink to fit one page
  //  - Long recipe (would shrink below 72%): drop scaling and let it flow
  //    across multiple A4 pages, with break-inside rules preventing
  //    mid-ingredient / mid-step splits
  //
  // 72% is the floor — beyond that, body text gets uncomfortably small
  // (~8pt). Better to use two pages with readable type than to cram
  // everything into one unreadable page.
  var MIN_SCALE = 0.72;

  function layoutRecipe() {
    var scale = document.getElementById('scale');
    var sheet = scale.parentElement;

    // Reset any previous layout pass before measuring
    scale.style.transform = '';
    scale.style.width = '';
    sheet.classList.remove('multi-page');

    var cs = window.getComputedStyle(sheet);
    var padTop = parseFloat(cs.paddingTop) || 0;
    var padBottom = parseFloat(cs.paddingBottom) || 0;
    var available = sheet.clientHeight - padTop - padBottom;
    var needed = scale.scrollHeight;

    if (needed <= available || available <= 100) {
      // Fits naturally on one page — done
      return;
    }

    var factor = available / needed;
    if (factor >= MIN_SCALE) {
      // Scale down to fit one A4
      scale.style.transform = 'scale(' + factor + ')';
      scale.style.transformOrigin = 'top left';
      scale.style.width = (100 / factor) + '%';
    } else {
      // Too long even at minimum readable scale → let the browser
      // paginate naturally across multiple A4 sheets. The break-inside
      // rules on ingredients / steps / headers keep elements intact.
      sheet.classList.add('multi-page');
    }
  }

  // Run once, and again after the hero image decodes (its height can shift).
  layoutRecipe();
  var heroImg = document.querySelector('.hero img');
  if (heroImg && !heroImg.complete) {
    heroImg.addEventListener('load', layoutRecipe);
    heroImg.addEventListener('error', layoutRecipe);
  }

  // Open the print dialog automatically after images have had a chance to load.
  window.addEventListener('load', function () {
    // Give images (especially base64 hero) a tick to decode.
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
    alert('Please allow pop-ups to print the recipe.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

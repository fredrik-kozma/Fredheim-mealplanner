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
    ingredients = [],
    steps = [],
    labels = {},
    logoUrl = '/fredheim-logo.png',
  } = opts

  const L = {
    ingredients: 'Ingredients',
    instructions: 'Instructions',
    servings: 'Servings',
    prep: 'Prep',
    cook: 'Cook',
    category: 'Category',
    printedOn: 'Printed',
    ...labels,
  }

  const chips = []
  if (servings) chips.push(`<span class="chip">🍽 ${escapeHtml(L.servings)}: <b>${servings}</b></span>`)
  if (prepTime) chips.push(`<span class="chip">⏱ ${escapeHtml(L.prep)}: <b>${prepTime}m</b></span>`)
  if (cookTime) chips.push(`<span class="chip">🔥 ${escapeHtml(L.cook)}: <b>${cookTime}m</b></span>`)
  if (category) chips.push(`<span class="chip chip--accent">${escapeHtml(category)}</span>`)

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

  const printedDate = new Date().toLocaleDateString(undefined, {
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
    break-inside: avoid;
  }
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

  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: #fff; }
    .sheet { margin: 0; box-shadow: none; width: 210mm; min-height: 297mm; page-break-after: avoid; }
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
        ${escapeHtml(L.printedOn)} ${escapeHtml(printedDate)} · fredheim.org
      </div>
    </div>
  </div>

<script>
  // Fit-to-one-page: if the content is taller than the printable area of an
  // A4 page, scale it down proportionally so it still prints on exactly one
  // sheet. Uses the computed height of .sheet minus its padding as the budget.
  function fitOnePage() {
    var scale = document.getElementById('scale');
    var sheet = scale.parentElement;
    var cs = window.getComputedStyle(sheet);
    var padTop = parseFloat(cs.paddingTop) || 0;
    var padBottom = parseFloat(cs.paddingBottom) || 0;
    // A4 portrait at 96dpi ≈ 1123px tall; use the rendered .sheet height as
    // a practical cap (min-height is 297mm).
    var available = sheet.clientHeight - padTop - padBottom;
    var needed = scale.scrollHeight;
    if (needed > available && available > 100) {
      var factor = available / needed;
      scale.style.transform = 'scale(' + factor + ')';
      scale.style.transformOrigin = 'top left';
      scale.style.width = (100 / factor) + '%';
    } else {
      scale.style.transform = '';
      scale.style.width = '';
    }
  }
  // Run once, and again after the hero image decodes (its height can shift).
  fitOnePage();
  var heroImg = document.querySelector('.hero img');
  if (heroImg && !heroImg.complete) {
    heroImg.addEventListener('load', fitOnePage);
    heroImg.addEventListener('error', fitOnePage);
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

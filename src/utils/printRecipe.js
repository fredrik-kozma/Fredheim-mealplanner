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
import { formatDuration } from './formatDuration'
import { RECIPE_SHEET_CSS } from './recipeSheetCss'

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
  // Same formatter as the card and the detail page — a 5-day starter
  // printed as "7200m" is not something you can plan around.
  if (formatDuration(prepTime)) chips.push(`<span class="chip">⏱ ${escapeHtml(L.prep)}: <b>${formatDuration(prepTime)}</b></span>`)
  if (formatDuration(cookTime)) chips.push(`<span class="chip">🔥 ${escapeHtml(L.cook)}: <b>${formatDuration(cookTime)}</b></span>`)
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
  /* The recipe page look, shared with the weekly menu book so the two
     printouts cannot drift apart. */
  ${RECIPE_SHEET_CSS}

  /* ── this sheet only: landscape geometry and the preview chrome ──── */
  .sheet {
    width: 297mm;
    min-height: 210mm;
    margin: 16px auto;
    padding: 11mm 12mm 10mm 12mm;
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
  @page { size: A4 landscape; margin: 12mm; }
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
        ${imageUrl ? `<img class="title-thumb" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" />` : ''}
        <div class="title-text">
          <h1>${escapeHtml(title)}</h1>
          ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ''}
        </div>
      </div>

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

  // Run once, and again after the thumbnail decodes (its height can shift).
  layoutRecipe();
  var thumb = document.querySelector('.title-thumb');
  if (thumb && !thumb.complete) {
    thumb.addEventListener('load', layoutRecipe);
    thumb.addEventListener('error', layoutRecipe);
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

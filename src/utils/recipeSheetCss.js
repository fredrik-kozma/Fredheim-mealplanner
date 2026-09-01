/**
 * The shared look of a printed recipe page.
 *
 * Used by both printRecipe.js (one recipe on its own) and printMenuBook.js
 * (the whole week, one recipe per page), so a page pulled out of the
 * booklet is the same object as one printed alone. Copying these rules
 * into both files would work exactly once — the next tweak would land in
 * one of them and the two would quietly diverge.
 *
 * Deliberately carries no page geometry: no width, no min-height, no
 * @page. Those differ between the two callers (the single sheet is
 * landscape, the booklet portrait) and each sets its own.
 */
export const RECIPE_SHEET_CSS = `
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

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 2px solid var(--brand);
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .logo { height: 52px; width: auto; flex-shrink: 0; }
  .brand-strip {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    text-align: right;
  }
  .brand-strip b { color: var(--brand-dark); letter-spacing: 1px; }

  /* Thumbnail beside the title rather than a banner across the page. */
  .title-block {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 10px;
  }
  .title-thumb {
    width: 30mm; height: 30mm; flex-shrink: 0;
    object-fit: cover; border-radius: 8px; display: block;
    background: #eef2ff;
  }
  .title-text { min-width: 0; flex: 1; }
  h1 {
    font-size: 26px;
    line-height: 1.15;
    margin: 0 0 5px 0;
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
    break-inside: avoid;
    page-break-inside: avoid;
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

  /* Keep headings with their content and never split an element that
     reads as one unit. */
  h2 { break-after: avoid; page-break-after: avoid; }
  .header { break-after: avoid; page-break-after: avoid; }
  .title-block { break-after: avoid; page-break-after: avoid; }
  .chips { break-inside: avoid; page-break-inside: avoid; }
  .footer { break-inside: avoid; page-break-inside: avoid; }
`

/**
 * The chip row: servings, prep, cook, category. `formatDuration` is passed
 * in rather than imported so this module stays free of dependencies.
 */
export function buildRecipeChips({ servings, prepTime, cookTime, category, labels, formatDuration, escapeHtml }) {
  const chips = []
  if (servings) chips.push(`<span class="chip">🍽 ${escapeHtml(labels.servings)}: <b>${servings}</b></span>`)
  if (formatDuration(prepTime)) chips.push(`<span class="chip">⏱ ${escapeHtml(labels.prep)}: <b>${formatDuration(prepTime)}</b></span>`)
  if (formatDuration(cookTime)) chips.push(`<span class="chip">🔥 ${escapeHtml(labels.cook)}: <b>${formatDuration(cookTime)}</b></span>`)
  if (category) chips.push(`<span class="chip chip--accent">${escapeHtml(category)}</span>`)
  return chips
}

/** "Good for" health chips — diabetes, blood pressure, and so on. */
export function buildConditionChips(conditions, escapeHtml) {
  return (conditions || [])
    .map(c => `<span class="chip chip--health">${c.icon ? c.icon + ' ' : ''}${escapeHtml(c.label)}</span>`)
    .join('')
}

/** The shared footer, with both partner marks. */
export function buildRecipeFooter({ printedOn, printedDate, escapeHtml }) {
  return `
      <div class="footer">
        <div class="coop">
          <img src="/fredheim-logo.svg" alt="" onerror="this.style.display='none'" />
          <span>Fredheim Livsstilssenter</span>
          <span class="dot">·</span>
          <img src="/Vivera_Health_logo.png" alt="" onerror="this.style.display='none'" />
          <span>Vivera Health</span>
        </div>
        ${escapeHtml(printedOn)} ${escapeHtml(printedDate)} · fredheim.org
      </div>`
}

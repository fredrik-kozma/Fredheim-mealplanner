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

import { formatDuration } from './formatDuration'
import {
  RECIPE_SHEET_CSS,
  buildRecipeChips,
  buildConditionChips,
  buildRecipeFooter,
} from './recipeSheetCss'

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
 *   category?: string,
 *   prepTime?: number|null,
 *   cookTime?: number|null,
 *   conditions?: Array<{ icon?: string, label: string }>,
 *   ingredients: Array<{ name: string, quantityLabel: string }>,
 *   steps: string[]
 * }>} opts.entries                    Already in cooking order, already scaled
 * @param {object} opts.labels         { contents, ingredients, instructions, servings, prep, cook, goodFor, printedOn, recipesCount }
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
    servings: 'Servings',
    prep: 'Prep',
    cook: 'Cook',
    goodFor: 'Good for',
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

  // Each page is the standalone recipe sheet, plus a day/meal badge saying
  // where in the week it belongs. Same markup and same classes, so the two
  // printouts stay the same object.
  const recipePages = entries.map(e => {
    const chips = buildRecipeChips({
      servings: e.servings,
      prepTime: e.prepTime,
      cookTime: e.cookTime,
      category: e.category,
      labels: L,
      formatDuration,
      escapeHtml,
    })
    const conditionChips = buildConditionChips(e.conditions, escapeHtml)

    return `
    <section class="page recipe">
      <div class="header">
        <div class="when">
          <span class="when-day">${escapeHtml(e.dayLabel)}</span>
          <span class="when-slot">${escapeHtml(e.slotLabel)}</span>
        </div>
        <div class="brand-strip"><b>Fredheim</b> · Livsstilssenter</div>
      </div>

      <div class="title-block">
        ${e.imageUrl ? `<img class="title-thumb" src="${escapeHtml(e.imageUrl)}" alt="" />` : ''}
        <div class="title-text">
          <h1>${escapeHtml(e.title)}</h1>
          ${e.description ? `<p class="desc">${escapeHtml(e.description)}</p>` : ''}
        </div>
      </div>

      ${chips.length ? `<div class="chips">${chips.join('')}</div>` : ''}
      ${conditionChips ? `<div class="good-for"><span class="label">${escapeHtml(L.goodFor)}</span>${conditionChips}</div>` : ''}

      <div class="body">
        <section>
          <h2>${escapeHtml(L.ingredients)}</h2>
          <ul class="ingredients">
            ${e.ingredients.map(i => `<li><span class="ing-name">${escapeHtml(i.name)}</span><span class="ing-qty">${escapeHtml(i.quantityLabel)}</span></li>`).join('')}
          </ul>
        </section>
        <section>
          <h2>${escapeHtml(L.instructions)}</h2>
          <ol class="steps">
            ${e.steps.map((s, i) => `<li><span class="step-num">${i + 1}</span><span class="step-text">${escapeHtml(s)}</span></li>`).join('')}
          </ol>
        </section>
      </div>

      ${buildRecipeFooter({ printedOn: L.printedOn, printedDate: printedOn, escapeHtml })}
    </section>`
  }).join('')

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  /* The recipe page's own look, shared with the single-recipe printout. */
  ${RECIPE_SHEET_CSS}

  :root {
    --accent-line: #bbe5c6;
    --indigo: #4f46e5;
    --indigo-soft: #eef2ff;
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
  .cover h1 { margin: 0; }

  /* Overrides the shared h2, which carries a rule and heavier tracking
     meant for the ingredients/instructions headings. */
  h2.toc-h {
    font-size: 11px; text-transform: uppercase; letter-spacing: .9px;
    color: var(--brand-dark); margin: 0 0 8px;
    border-bottom: 0; padding-bottom: 0;
  }
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

  /* ── one recipe per page ─────────────────────────────────────────────
     The page itself is the shared recipe sheet. The only thing added is
     the day/meal badge in the header, which is what a page in a week's
     booklet needs and a single printed recipe does not. */
  .recipe { break-before: page; page-break-before: always; }
  .when { display: flex; align-items: center; gap: 6px; }
  .when-day {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .7px;
    background: var(--indigo); color: #fff; padding: 3px 9px; border-radius: 999px;
  }
  .when-slot {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px;
    color: var(--brand-dark); background: var(--accent);
    border: 1px solid var(--accent-line); padding: 3px 9px; border-radius: 999px;
  }
  /* The cover's own footer; recipe pages use the shared .footer. */
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
    /* The shared CSS already protects ingredient rows and steps; the
       contents list is this document's own. */
    .toc-day { break-inside: avoid; page-break-inside: avoid; }
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

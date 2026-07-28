/**
 * Live-scaling quantities inside instruction text.
 *
 * Steps may mark a quantity for scaling with double braces:
 *
 *     "Sauté the onion in {{1 tsp}} olive oil and {{2 tbsp}} water."
 *
 * Marked amounts are scaled to the serving count the reader has chosen and
 * converted to their unit system, using exactly the same formatter as the
 * ingredient list — so the text and the list can never disagree.
 *
 * Markup is explicit ON PURPOSE. Auto-detecting numbers in prose is unsafe:
 * plenty of quantities in these recipes are per-item or fixed and must stay
 * put — "100 g for each burger", "pour into 1.5 L bread forms", "add water
 * 1 tbsp at a time", "balls the size of 2 tbsp". Scaling those would produce
 * confidently wrong instructions, which is worse than leaving text static.
 * Anything unmarked is rendered verbatim, so recipes without markup are
 * completely unaffected.
 */

// {{ ... }} — captures the inside, non-greedy, no nested braces.
const TOKEN = /\{\{([^{}]+)\}\}/g

// "2 tbsp" / "2.5 dl" / "80 ml" / "1,5 dl" → { quantity, unit }
const AMOUNT = /^\s*(\d+(?:[.,]\d+)?)\s*(.*?)\s*$/

/**
 * Split a step into plain strings and scalable amounts.
 * @returns {Array<string | {quantity:number, unit:string, raw:string}>}
 */
export function parseStepText(step) {
  const out = []
  let last = 0
  let m
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(step)) !== null) {
    if (m.index > last) out.push(step.slice(last, m.index))
    const inner = m[1]
    const parsed = AMOUNT.exec(inner)
    if (parsed) {
      // Accept comma decimals ("2,5 dl") the way European recipes write them.
      const quantity = parseFloat(parsed[1].replace(',', '.'))
      const unit = parsed[2] || ''
      if (Number.isFinite(quantity)) {
        out.push({ quantity, unit, raw: inner })
      } else {
        out.push(inner) // not a number after all — emit literally
      }
    } else {
      out.push(inner)
    }
    last = m.index + m[0].length
  }
  if (last < step.length) out.push(step.slice(last))
  return out
}

/** True when a step carries at least one scalable amount. */
export function stepHasScalableAmount(step) {
  TOKEN.lastIndex = 0
  return TOKEN.test(step)
}

/**
 * Render a step as React nodes, scaling any marked amounts.
 *
 * @param {string} step
 * @param {(quantity:number, unit:string) => string} format
 *        Same formatter the ingredient list uses, so values match exactly.
 */
export function renderStepText(step, format) {
  const parts = parseStepText(step)
  // Fast path: nothing marked up — hand back the original string untouched.
  if (parts.length === 1 && typeof parts[0] === 'string') return step

  return parts.map((part, i) => {
    if (typeof part === 'string') return part
    return (
      <span
        key={i}
        className="font-semibold text-indigo-700 bg-indigo-50 rounded px-1 py-0.5 tabular-nums"
      >
        {format(part.quantity, part.unit)}
      </span>
    )
  })
}

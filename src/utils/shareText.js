/**
 * Plain-text renderings of a week and a recipe, for the "send as text"
 * branch of sharing.
 *
 * This is the option that reaches everybody. A link needs the recipient
 * to have the app; a file needs them to do something with it; text just
 * appears in the message and is readable by whoever opens it, on any
 * phone, with nothing installed. For a lot of sharing it is the whole
 * job — someone wants to tell a friend what they are cooking, not hand
 * them a data import.
 *
 * The link is appended at the end rather than left out, so one message
 * serves both: readable to anyone, importable by anyone who has the app.
 */

import { displayUnit } from './unitNormalizer'

function qty(ing, lang) {
  const amount = ing.quantity ?? ''
  const unit = ing.unit ? displayUnit(ing.unit, lang) : ''
  return [amount, unit].filter(Boolean).join(' ')
}

/**
 * @param recipe       the recipe, already in the language to print
 * @param lang         two-letter code, for unit names
 * @param labels       { servings, ingredients, steps, notes }
 * @param url          share link, or null to leave it off
 */
export function recipeAsText({ recipe, lang = 'en', labels, url }) {
  const tr = recipe.translations?.[lang] || {}
  const title = tr.title || recipe.title
  const ingredients = tr.ingredients?.length ? tr.ingredients : recipe.ingredients
  const steps = tr.steps?.length ? tr.steps : recipe.steps
  const notes = tr.notes || recipe.notes

  const out = [title, '']
  if (recipe.servings) out.push(`${labels.servings}: ${recipe.servings}`, '')

  out.push(`${labels.ingredients}:`)
  for (const ing of ingredients || []) {
    const left = qty(ing, lang)
    out.push(`· ${[left, ing.name].filter(Boolean).join(' ')}`)
  }

  if (steps?.length) {
    out.push('', `${labels.steps}:`)
    steps.forEach((s, i) => out.push(`${i + 1}. ${s}`))
  }
  if (notes) out.push('', `${labels.notes}: ${notes}`)
  if (url) out.push('', url)
  return out.join('\n')
}

/**
 * @param days    [{ key, label, slots: [{ label, items: [name] }], note }]
 * @param heading week title
 * @param url     share link, or null
 */
export function weekAsText({ days, heading, url }) {
  const out = [heading, '']
  for (const day of days) {
    const lines = []
    for (const slot of day.slots) {
      if (!slot.items.length) continue
      lines.push(`  ${slot.label}: ${slot.items.join(', ')}`)
    }
    if (day.note) lines.push(`  — ${day.note}`)
    // A day with nothing planned and nothing written is left out
    // entirely. Printing seven headings with five blanks under them
    // reads as a broken export rather than a half-filled week.
    if (!lines.length) continue
    out.push(day.label, ...lines, '')
  }
  if (url) out.push(url)
  return out.join('\n').trimEnd()
}

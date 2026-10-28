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

import { formatQuantity } from './formatQuantity.js'
import { ingredientLabel } from './ingredientDictionary.js'
import { formatGramSpoonHint } from './gramSpoonHint.js'

function qty(ing, lang) {
  const hint = formatGramSpoonHint({ quantity: ing.quantity, unit: ing.unit, ingredientId: ing.ingredient, lang })
  return [formatQuantity(ing.quantity, ing.unit, lang), hint].filter(Boolean).join(' ')
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
    out.push(`· ${[left, ingredientLabel(ing)].filter(Boolean).join(' ')}`)
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
 * A shopping list as something you could read off a phone in a shop.
 *
 * Aisle headings are kept because that is the order you walk a shop in,
 * and the amount leads each line because it is what you reach for first.
 *
 * @param groups  [{ category, items: [{ name, label }] }]
 * @param heading list title
 * @param subtitle e.g. "for 4 people", or null
 * @param url     share link, or null
 */
export function shoppingListAsText({ groups, heading, subtitle, url }) {
  const out = [heading]
  if (subtitle) out.push(subtitle)
  out.push('')
  for (const group of groups) {
    const items = (group.items || []).filter(it => it.name)
    if (!items.length) continue
    out.push(group.category)
    for (const it of items) {
      out.push(`· ${[it.label, it.name].filter(Boolean).join(' ')}`)
    }
    out.push('')
  }
  if (url) out.push(url)
  return out.join('\n').trimEnd()
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

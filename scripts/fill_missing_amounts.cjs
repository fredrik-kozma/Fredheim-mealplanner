/* 28 ingredients carried quantity 0 (or a bare number with no unit), so they
 * showed no amount and contributed nothing to the shopping list.
 *
 * Seasonings and garnishes become "to taste" — no guessing required, and it
 * is what the recipe means. Everything else got an amount read off the
 * recipe's own method and yield rather than invented:
 *
 *   Croutons      — step 1 says "cut the bread slices into cubes"; 2 slices
 *                   for a single serving, with a spoon of oil to coat.
 *   Lasagna       — 3 layers for 7 servings: a standard 250 g box of sheets
 *                   and ~6 dl of the white sauce the steps refer to.
 *   Fig Spread    — step 1: "cover the figs with water (not too much)".
 *                   500 g of dried figs takes roughly 3 dl.
 *   Black Bean Stew — step 3 adds beans and water to a 5-serving stew: 5 dl.
 *   Raw Cheesecake  — step 3: "add water if necessary to blend" — a splash.
 *   Greek Salad / Guacamole — these had real counts but no unit at all, so
 *                   they just needed the same per-piece weights used
 *                   everywhere else (onion 110 g, bell pepper 150 g,
 *                   avocado 150 g).
 *   Russian Penicillin — whole fruit blended; the count was right, only the
 *                   unit was missing.
 *
 * Run with --write to apply; default is a dry run.
 */
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')
const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')

const TASTE = { en: ', to taste', no: ', etter smak', sv: ', efter smak' }

// [recipe title, ingredient-name regex, {quantity, unit} | 'taste']
const FIXES = [
  ['American Oat Pancakes', /coconut oil/i, { quantity: 1, unit: 'tbsp' }],
  ['Avocado Cream', /sea salt/i, 'taste'],
  ['Baba Ghanoush - Aubergine Dip', /sea salt/i, 'taste'],
  ['Black Bean Stew', /^water$/i, { quantity: 5, unit: 'dl' }],
  ['Cheesy Cauliflower Sauce', /sea salt/i, 'taste'],
  ['Classic Greek Salad', /onion, red/i, { quantity: 28, unit: 'g' }],
  ['Classic Greek Salad', /bell pepper, green/i, { quantity: 75, unit: 'g' }],
  ['Croutons', /^bread,/i, { quantity: 70, unit: 'g' }],
  ['Croutons', /olive oil/i, { quantity: 1, unit: 'tbsp' }],
  ['Croutons', /sea salt/i, 'taste'],
  ['Croutons', /oregano/i, 'taste'],
  ['Croutons', /thyme/i, 'taste'],
  ['Fig Spread', /^water$/i, { quantity: 3, unit: 'dl' }],
  ['Green Beans', /olive oil/i, { quantity: 1, unit: 'tbsp' }],
  ['Guacamole', /avocado/i, { quantity: 450, unit: 'g' }],
  ['Hasselback Potatoes', /olive oil/i, { quantity: 2, unit: 'tbsp' }],
  ['Lasagna', /white cashew sauce/i, { quantity: 6, unit: 'dl' }],
  ['Lasagna', /lasagne sheets/i, { quantity: 250, unit: 'g' }],
  ['Pomodoro Sauce', /sea salt/i, 'taste'],
  ['Ranch Dressing', /dill/i, 'taste'],
  ['Raw Cheesecake', /^water$/i, { quantity: 0.5, unit: 'dl' }],
  ['Red Beet Spread', /parsley/i, 'taste'],
  ['Russian Penicillin', /lemon, raw/i, { quantity: 1, unit: 'pcs' }],
  ['Russian Penicillin', /orange, raw/i, { quantity: 1, unit: 'pcs' }],
  ['Steamed Small Potatoes', /parsley/i, 'taste'],
  ['Sweet Potato Soup', /sea salt/i, 'taste'],
  ['Sweet Yellow Pea Soup', /parsley/i, 'taste'],
  ['Vegetable Pie', /olive oil/i, { quantity: 2, unit: 'tbsp' }],
]

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const applied = []
const missed = []

for (const [title, nameRe, action] of FIXES) {
  const r = pack.recipes.find(x => x.title === title)
  if (!r) { missed.push(`recipe not found: ${title}`); continue }
  const k = (r.ingredients || []).findIndex(i =>
    nameRe.test(String(i.name || '')) && (i.quantity === 0 || String(i.unit || '').trim() === ''))
  if (k === -1) { missed.push(`no matching row: ${title} / ${nameRe}`); continue }

  const before = `${r.ingredients[k].quantity} ${r.ingredients[k].unit || '∅'}`
  const langs = [['en', r.ingredients], ['no', r.translations?.no?.ingredients], ['sv', r.translations?.sv?.ingredients]]
  for (const [lang, arr] of langs) {
    if (!arr?.[k]) continue
    if (action === 'taste') {
      arr[k].quantity = null
      arr[k].unit = ''
      if (!/to taste|etter smak|efter smak/i.test(arr[k].name)) arr[k].name += TASTE[lang]
    } else {
      arr[k].quantity = action.quantity
      arr[k].unit = action.unit
    }
  }
  applied.push(`${title}: ${r.ingredients[k].name.slice(0, 34).padEnd(36)} ${before.padStart(8)} -> ${action === 'taste' ? 'to taste' : action.quantity + ' ' + action.unit}`)
}

if (WRITE) {
  pack.version = '1.21.0'
  fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
}
console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'} — ${applied.length}/${FIXES.length} fixed`)
applied.forEach(a => console.log('  ' + a))
if (missed.length) { console.log('\nNOT APPLIED:'); missed.forEach(m => console.log('  ' + m)) }

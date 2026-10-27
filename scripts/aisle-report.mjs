/**
 * Runs every ingredient name in the built-in recipe packs (all languages)
 * through the shopping-list aisle categoriser and prints:
 *
 *   1. every name whose aisle differs from the old substring matcher
 *      (the one shoppingListGenerator used up to a4b6ef9), and
 *   2. every name that still lands in "Other".
 *
 * Usage:  node scripts/aisle-report.mjs [--lang en|no|sv] [--all] [--by-aisle]
 *   --all       also list every name with its aisle, changed or not
 *   --by-aisle  list every name grouped under its new aisle, for review
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { categoriseIngredient } from '../src/utils/ingredientCategorizer.js'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_DIR = path.join(ROOT, 'recipe-packs-template', 'packs')

const args = process.argv.slice(2)
const onlyLang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null
const listAll = args.includes('--all')
const byAisle = args.includes('--by-aisle')

// --- the old substring matcher, kept verbatim as the baseline -----------

const LEGACY_CATEGORIES = {
  Produce: ['apple', 'eple', 'äpple', 'banana', 'banan', 'lemon', 'sitron', 'citron', 'lime', 'orange',
    'strawberr', 'jordbær', 'blueberr', 'raspberr', 'mango', 'avocado', 'avokado',
    'tomato', 'tomat', 'onion', 'løk', 'lök', 'garlic', 'hvitløk', 'vitlök', 'ginger', 'ingefær', 'ingefära',
    'carrot', 'gulrot', 'morot', 'potato', 'potet', 'sweet potato', 'søtpotet', 'sötpotat',
    'celery', 'selleri', 'broccoli', 'brokkoli', 'spinach', 'spinat', 'spenat', 'lettuce', 'salat', 'sallad',
    'cucumber', 'agurk', 'gurka', 'pepper', 'paprika', 'zucchini', 'squash', 'courgette',
    'cauliflower', 'blomkål', 'pumpkin', 'gresskar', 'pumpa', 'butternut',
    'mushroom', 'sopp', 'pea', 'corn', 'mais', 'kale', 'grønnkål', 'grönkål', 'cabbage', 'kål', 'savoy',
    'leek', 'purre', 'herb', 'basil', 'basilikum', 'basilika', 'parsley', 'persille', 'persilja',
    'cilantro', 'dill', 'thyme', 'timian', 'timjan', 'rosemary', 'rosmarin', 'oregano',
    'mint', 'chive', 'gressløk', 'fennel', 'fennikel', 'fänkål', 'beetroot', 'beet', 'rødbete', 'rödbeta',
    'parsnip', 'pastinakk', 'palsternacka', 'radish', 'reddik', 'spring onion', 'vårløk',
    'edamame', 'sugar snap', 'eggplant', 'aubergine'],
  'Meat & Fish': ['chicken', 'kylling', 'beef', 'biff', 'pork', 'svin', 'lamb', 'lam', 'turkey', 'kalkun',
    'bacon', 'sausage', 'pølse', 'ham', 'salmon', 'laks', 'tuna', 'tunfisk', 'cod', 'torsk', 'shrimp', 'reke',
    'fish', 'fisk', 'mince', 'kjøttdeig', 'steak', 'sea bass', 'havabbor', 'pollock', 'sei', 'mince'],
  Dairy: ['milk', 'melk', 'cream', 'fløte', 'yogurt', 'yoghurt', 'butter', 'smør', 'cheese', 'ost',
    'egg', 'sour cream', 'rømme', 'crème fraîche', 'mozzarella', 'parmesan', 'cheddar', 'feta', 'ricotta',
    'greek yogurt', 'granola'],
  'Bakery & Grains': ['flour', 'mel', 'bread', 'brød', 'bröd', 'pasta', 'rice', 'ris', 'oat', 'havre', 'barley',
    'bygg', 'quinoa', 'noodle', 'tortilla', 'cracker', 'crispbread', 'knekkebrød', 'knäckebröd',
    'breadcrumb', 'panko', 'yeast', 'gjær',
    'baking powder', 'bakepulver', 'baking soda', 'natron', 'cornstarch', 'maizena', 'potetmel',
    'bulgur', 'couscous', 'flatbread', 'pitta', 'rye', 'rug'],
  'Canned & Dried': ['bean', 'bønne', 'bönor', 'lentil', 'linse', 'linser', 'chickpea', 'kikerter', 'tomato sauce', 'tomatsaus',
    'coconut milk', 'kokosmjølk', 'stock', 'kraft', 'broth', 'buljong', 'bouillon', 'soup', 'suppe',
    'canned', 'hermetisk', 'chopped tomatoes', 'tahini', 'olives', 'oliven', 'oliver', 'pickled',
    'walnut', 'valnøtt', 'valnött', 'almond', 'mandel', 'mandl', 'cashew', 'peanut', 'hazelnut', 'nut', 'nøtt', 'nött',
    'pumpkin seed', 'gresskarkjern', 'pumpakärn', 'sunflower seed', 'sesame seed', 'sesamfrø', 'sesamfrö',
    'chia', 'flaxseed', 'linfrø', 'linfrö', 'sunflower'],
  'Oils & Condiments': ['oil', 'olje', 'olive oil', 'oliveolje', 'vinegar', 'eddik', 'soy sauce', 'soyasaus',
    'mustard', 'sennep', 'ketchup', 'mayonnaise', 'hot sauce', 'sriracha', 'worcestershire', 'tamari',
    'honey', 'honning', 'maple syrup', 'ahornsirup', 'sugar', 'sukker', 'salt', 'pepper',
    'spice', 'krydder', 'cumin', 'spisskummen', 'spiskummin', 'turmeric', 'gurkemeie', 'gurkmeja',
    'coriander', 'koriander', 'garam masala', 'chilli', 'cinnamon', 'kanel', 'cardamom', 'kardemom', 'kardemumma',
    'clove', 'nellik', 'nejlika', 'nutmeg', 'muskat', 'muskot', 'smoked paprika', 'røkt paprika', 'rökt paprika',
    'sumac', 'sumak', 'almond butter', 'mandelsmør', 'mandelsmör', 'peanut butter',
    'sesame', 'sesamolje', 'soy', 'soya', 'fish sauce', 'oyster sauce'],
  Frozen: ['frozen', 'frosne', 'frysta', 'ice cream', 'iskrem'],
  Beverages: ['water', 'vann', 'vatten', 'juice', 'coffee', 'kaffe', 'tea', 'te', 'wine', 'vin', 'beer', 'øl',
    'oat milk', 'havremelk', 'havremjölk', 'almond milk', 'mandelmelk', 'plant milk', 'plantemelk',
    'soy milk', 'soyamelk', 'soya milk', 'rice milk', 'rismelk', 'cashew milk', 'hazelnut milk'],
}
const LEGACY_WHOLE_WORD = new Set(['te', 'tea', 'øl', 'ris', 'is'])

function legacyCategorise(name) {
  const lower = name.toLowerCase()
  let bestCat = 'Other'
  let bestLen = 0
  for (const [cat, keywords] of Object.entries(LEGACY_CATEGORIES)) {
    for (const kw of keywords) {
      const hit = LEGACY_WHOLE_WORD.has(kw)
        ? new RegExp(`(^|[^a-zæøåäöéü])${kw}(?![a-zæøåäöéü])`).test(lower)
        : lower.includes(kw)
      if (kw.length > bestLen && hit) { bestCat = cat; bestLen = kw.length }
    }
  }
  return bestCat
}

// --- collect names --------------------------------------------------------

const names = {} // lang -> Set
const add = (lang, name) => {
  if (!name) return
  ;(names[lang] ||= new Set()).add(String(name).trim())
}
for (const file of fs.readdirSync(PACK_DIR).filter(f => f.endsWith('.json'))) {
  const pack = JSON.parse(fs.readFileSync(path.join(PACK_DIR, file), 'utf8'))
  for (const r of pack.recipes || []) {
    for (const i of r.ingredients || []) add('en', i.name)
    for (const [lang, t] of Object.entries(r.translations || {})) {
      for (const i of t.ingredients || []) add(lang, i.name)
    }
  }
}

// --- report ---------------------------------------------------------------

let total = 0, changed = 0, other = 0
const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n))

for (const lang of Object.keys(names).sort()) {
  if (onlyLang && lang !== onlyLang) continue
  const rows = [...names[lang]].sort((a, b) => a.localeCompare(b)).map(n => ({
    name: n, before: legacyCategorise(n), after: categoriseIngredient(n),
  }))
  total += rows.length
  const diff = rows.filter(r => r.before !== r.after)
  const others = rows.filter(r => r.after === 'Other')
  changed += diff.length
  other += others.length

  console.log(`\n=== ${lang}: ${rows.length} names, ${diff.length} changed, ${others.length} in Other ===`)
  for (const r of listAll ? rows : byAisle ? [] : diff) {
    const mark = r.before === r.after ? ' ' : '*'
    console.log(`${mark} ${pad(r.name, 60)} ${pad(r.before, 18)} -> ${r.after}`)
  }
  if (byAisle) {
    const groups = {}
    for (const r of rows) (groups[r.after] ||= []).push(r.name)
    for (const [aisle, list] of Object.entries(groups)) console.log(`\n## ${aisle} (${list.length})\n${list.join('; ')}`)
  }
  if (others.length && !listAll) {
    console.log(`--- ${lang}: still in Other ---`)
    for (const r of others) console.log(`  ${r.name}`)
  }
}

console.log(`\nTotal: ${total} names, ${changed} changed aisle, ${other} in Other`)

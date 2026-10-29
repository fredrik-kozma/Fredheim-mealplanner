// Fill in the missing portion descriptions (en `portion`, and
// translations.{no,sv}.portion) in the three Fredheim packs, from
// servingWeightGrams and the dish type. Only recipes that lack a portion in
// some language are touched, and only that field: servings, nutrition and
// ingredients stay as they are.
//
// The text follows the recipes that already have one: "1 bowl (~490 g)",
// "2 slices (~116 g)", "30 g (2 tbsp)", "~40 g dried chips", "50 g side".
//   - a template by category (soups and stews in a bowl, side salads and
//     sides "as a side", sauces and jams by the spoon, drinks by the glass);
//   - BY_ID below for dishes where the category is not enough (cakes cut in
//     slices, buns, burgers and patties, crusts, fillings), reviewed by hand.
//     Where the method does not say how many pieces the batch makes, the
//     text names the food by weight ("~165 g burgers") rather than guess a
//     count.
// Then bumps each changed pack's minor version so installed copies update.
//
// Usage: node scripts/fill_portion_text.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_FILES = {
  'fredheim-recepies-with-pictures': 'fredheim-recipes-with-pictures.json',
  'fredheim-reversal-protocol': 'fredheim-reversal-protocol.json',
  'fredheim-fmd-5day': 'fredheim-fmd-5day.json',
}
const LANGS = ['en', 'no', 'sv']
const dry = process.argv.includes('--dry')

// ── number formatting ──────────────────────────────────────────────────────
// Whole grams under 300, nearest 10 above (as "~490 g" for a 497 g bowl).
const amount = (w) => (w < 300 ? Math.round(w) : Math.round(w / 10) * 10)
const half = (n) => {
  const h = Math.round(n * 2) / 2
  const whole = Math.floor(h)
  return h % 1 ? `${whole || ''}½` : String(whole)
}
const same = (text) => ({ en: text, no: text, sv: text })
const each = (en, no, sv) => ({ en, no, sv })

// ── templates ──────────────────────────────────────────────────────────────
// "1 bowl (~400 g)": a counted container or piece with the weight after it.
const counted = (en, no, sv) => (w) => each(`${en} (~${amount(w)} g)`, `${no} (~${amount(w)} g)`, `${sv} (~${amount(w)} g)`)
const bowl = counted('1 bowl', '1 bolle', '1 skål')
const smallBowl = counted('1 small bowl', '1 liten bolle', '1 liten skål')
const plate = counted('1 plate', '1 tallerken', '1 tallrik')
const piece = counted('1 piece', '1 stykke', '1 bit')
// Cake and pie as raw-cheesecake: "1 slice" / "1 stykke" / "1 bit".
const cakeSlice = counted('1 slice', '1 stykke', '1 bit')
const breadSlice = counted('1 slice', '1 skive', '1 skiva')
// "~165 g burgers": the food by weight, when the batch has no stated count.
const byWeight = (en, no, sv) => (w) => each(`~${amount(w)} g ${en}`, `~${amount(w)} g ${no}`, `~${amount(w)} g ${sv}`)
const plain = (w) => same(`~${amount(w)} g`)
const asSide = byWeight('as a side', 'som tilbehør', 'som tillbehør')
// "30 g (2 tbsp)": 1 tbsp ≈ 15 g for sauces, dressings and jams.
function spoons(w) {
  const g = amount(w)
  const tilde = g % 15 === 0 ? '' : '~'
  if (g < 10) {
    const n = half(g / 5)
    return each(`${tilde}${g} g (${n} tsp)`, `${tilde}${g} g (${n} ts)`, `${tilde}${g} g (${n} tsk)`)
  }
  const n = half(g / 15)
  return each(`${tilde}${g} g (${n} tbsp)`, `${tilde}${g} g (${n} ss)`, `${tilde}${g} g (${n} msk)`)
}
// Drinks by volume (1 g ≈ 1 ml): a glass is ~250 ml.
function glasses(w) {
  const ml = amount(w)
  const n = Math.max(1, Math.round(ml / 250))
  return n === 1
    ? each(`1 glass (~${ml} ml)`, `1 glass (~${ml} ml)`, `1 glas (~${ml} ml)`)
    : each(`${n} glasses (~${ml} ml)`, `${n} glass (~${ml} ml)`, `${n} glas (~${ml} ml)`)
}
const mug = (w) => each(`1 cup (~${amount(w)} ml)`, `1 kopp (~${amount(w)} ml)`, `1 kopp (~${amount(w)} ml)`)
const broth = (w) => each(`~${amount(w)} ml broth`, `~${amount(w)} ml buljong`, `~${amount(w)} ml buljong`)

const SAUCE_SPOON_MAX = 60
const sauce = (r) => {
  if (r.servingWeightGrams <= SAUCE_SPOON_MAX) return spoons(r.servingWeightGrams)
  return /dressing/i.test(r.title)
    ? byWeight('dressing', 'dressing', 'dressing')(r.servingWeightGrams)
    : byWeight('sauce', 'saus', 'sås')(r.servingWeightGrams)
}
const isMeal = (r) => (r.mealTypes || []).some((m) => m === 'lunch' || m === 'dinner')
const bowlBySize = (w) => (w < 150 ? smallBowl(w) : bowl(w))

const BY_CATEGORY = {
  Soup: (r) => (r.mealTypes || []).includes('component') ? broth(r.servingWeightGrams) : bowl(r.servingWeightGrams),
  Main: (r) => plate(r.servingWeightGrams),
  Lunch: (r) => plate(r.servingWeightGrams),
  Salad: (r) => (isMeal(r) ? bowl(r.servingWeightGrams) : asSide(r.servingWeightGrams)),
  Side: (r) => asSide(r.servingWeightGrams),
  Sauce: sauce,
  Jam: (r) => spoons(r.servingWeightGrams),
  Spreads: (r) => plain(r.servingWeightGrams),
  Breakfast: (r) => bowlBySize(r.servingWeightGrams),
  Dessert: (r) => bowlBySize(r.servingWeightGrams),
  Drink: (r) => glasses(r.servingWeightGrams),
  Other: (r) => plain(r.servingWeightGrams),
}

// ── reviewed by hand ───────────────────────────────────────────────────────
// Each is a template of servingWeightGrams, or a fixed { en, no, sv }.
const pancakes = byWeight('pancakes', 'pannekaker', 'pannkakor')
const waffles = byWeight('waffles', 'vafler', 'våfflor')
const burgers = byWeight('burgers', 'burgere', 'burgare')
const patties = byWeight('patties', 'burgere', 'biffar')
const tofuSticks = byWeight('tofu sticks', 'tofupinner', 'tofustänger')
const BY_ID = {
  // stews: in a bowl, like creamy-red-lentil-stew
  'black-bean-stew': bowl, 'dal-stew': bowl, 'kidney-bean-stew': bowl, 'lentil-lap-stew': bowl,
  'fmd-d2-dinner': bowl, // a bowl by its title
  // baked or set in one dish and cut: a piece is the serving
  'apple-oat-bake': piece, 'fr-41': piece, 'fr-70': piece, 'swedish-oven-pancake': piece,
  'fr-94': piece, 'fr-111': cakeSlice, 'tofu-form': piece, 'vegetable-pie': piece,
  'squash-cake': cakeSlice, 'lime-cheesecake': cakeSlice, 'orn-42': cakeSlice, 'orn-48': cakeSlice, 'orn-64': cakeSlice,
  'ultimate-fluffy-vegan-gluten-free-bread': breadSlice, // one loaf, 12 slices
  'orn-5': counted('1 brownie', '1 brownie', '1 brownie'), // 9 in a 20×20 cm tin
  'sweet-potato-muffins': counted('1 muffin', '1 muffins', '1 muffin'), // a 12-cup tin
  // buns and rolls with a stated dough weight a piece
  'burger-buns': counted('1 burger bun', '1 hamburgerbrød', '1 hamburgerbröd'), // 110 g dough each
  'gluten-free-oat-buns': counted('1 bun', '1 rundstykke', '1 fralla'), // ~100 g each
  'orn-17': counted('1 roll', '1 rundstykke', '1 fralla'), // makes 8 rolls
  'fr-19': counted('1½ buns', '1½ rundstykker', '1½ frallor'), // 100 g buns, 149 g a serving
  'orn-20': counted('2 patties', '2 burgere', '2 biffar'), // 8 patties, 4 servings
  'stuffed-paprika-with-tofu': counted('1 stuffed pepper half', '1 fylt paprikahalvdel', '1 fylld paprikahalva'), // ~4 peppers halved, 8 servings
  'baked-sweet-potato': counted('1 sweet potato', '1 søtpotet', '1 sötpotatis'),
  // no stated count: the food by weight
  'american-oat-pancakes': pancakes, 'stine-gros-waffles': waffles, 'orn-1': waffles,
  'fr-23': burgers, 'oat-burger': burgers, 'orn-45': patties,
  'fr-64': byWeight('falafel', 'falafel', 'falafel'),
  'fr-101': byWeight('tofu balls', 'tofuboller', 'tofubollar'),
  'fr-143': byWeight('sausages', 'pølser', 'korvar'),
  'breaded-tofu-sticks': tofuSticks, 'marinated-tofu-sticks': tofuSticks,
  'chorizo-with-potato-taco': byWeight('taco filling', 'tacofyll', 'tacofyllning'),
  'fr-29': byWeight('fruit candy', 'fruktgodteri', 'fruktgodis'),
  'millet-crackers-hirseknekk': byWeight('crackers', 'knekkebrød', 'knäckebröd'),
  'kale-chips': byWeight('chips', 'chips', 'chips'),
  'caramelized-nuts': (w) => each(`~${amount(w)} g (a handful)`, `~${amount(w)} g (en neve)`, `~${amount(w)} g (en näve)`),
  // parts of another dish
  'fr-113': byWeight('pie crust', 'paibunn', 'pajbotten'),
  'fr-114': byWeight('filling', 'fyll', 'fyllning'),
  'fr-119': byWeight('pizza dough', 'pizzadeig', 'pizzadeg'),
  'fr-115': (w) => each(`~${amount(w)} g (to sprinkle)`, `~${amount(w)} g (til å strø over)`, `~${amount(w)} g (att strö över)`),
  // plates rather than bowls
  'scrambled-tofu': plate, 'fmd-d1-breakfast': plate, 'fmd-d2-breakfast': plate,
  'orn-41': plain, // granola, by weight like ellens-granola
  // smoothies and shakes are drinks, hot drinks a cup
  'orn-6': glasses, 'fr-12': mug, 'orn-15': mug, 'orn-63': mug,
  // not eaten as a dish (no servingWeightGrams)
  'orn-37': each('1 starter (for baking, not eaten as is)', '1 surdeigsgrunnlag (til baking, spises ikke som det er)', '1 surdegsgrund (för bakning, äts inte som den är)'),
}

export function portionFor(r) {
  const rule = BY_ID[r.id]
  if (rule && typeof rule === 'object') return rule
  if (!(Number(r.servingWeightGrams) > 0)) return null
  if (rule) return rule(r.servingWeightGrams)
  const byCategory = BY_CATEGORY[r.category]
  return byCategory ? byCategory(r) : null
}

// Insert `key` right after `after` (or at the end), keeping the rest in place.
function setAfter(r, key, value, after) {
  if (key in r) { r[key] = value; return r }
  const out = {}
  for (const [k, v] of Object.entries(r)) {
    out[k] = v
    if (k === after) out[key] = value
  }
  if (!(key in out)) out[key] = value
  return out
}
const portionIn = (r, lang) => String((lang === 'en' ? r.portion : r.translations?.[lang]?.portion) || '').trim()

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const filled = [], skipped = [], versions = {}
  for (const [id, file] of Object.entries(PACK_FILES)) {
    const full = path.join(ROOT, 'recipe-packs-template/packs', file)
    const pack = JSON.parse(fs.readFileSync(full, 'utf8'))
    if (pack.id !== id) throw new Error(`${file}: unexpected pack id ${pack.id}`)
    let changed = 0
    pack.recipes = pack.recipes.map((original) => {
      const missing = LANGS.filter((l) => !portionIn(original, l))
      if (!missing.length) return original
      const text = portionFor(original)
      if (!text) { skipped.push({ pack: id, id: original.id, title: original.title, category: original.category }); return original }
      let r = structuredClone(original)
      // Fill only the languages that lack it; an existing text is kept.
      if (missing.includes('en')) r = setAfter(r, 'portion', text.en, 'servings')
      for (const lang of ['no', 'sv']) if (missing.includes(lang)) r.translations[lang].portion = text[lang]
      changed++
      filled.push({ pack: id.replace('fredheim-', ''), id: r.id, g: r.servingWeightGrams ?? '', en: portionIn(r, 'en'), no: portionIn(r, 'no'), sv: portionIn(r, 'sv') })
      return r
    })
    if (!changed) continue
    const [maj, min] = pack.version.split('.').map(Number)
    const next = `${maj}.${min + 1}.0`
    versions[id] = `${pack.version} -> ${next}`
    pack.version = next
    if (!dry) fs.writeFileSync(full, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  }
  for (const f of filled) console.log([f.pack, f.id, f.g, f.en, f.no, f.sv].join(' | '))
  console.log(JSON.stringify({ filled: filled.length, skipped, versions }, null, 1))
  if (dry) console.log('(dry run, nothing written)')
}

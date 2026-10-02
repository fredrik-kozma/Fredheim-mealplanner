/* Second pass on the count-equivalents in ingredient names.
 *
 * The first pass missed these for two reasons, both worth recording:
 *
 *  - It scanned only the canonical English lists. orn-12 and orn-23 read
 *    "bay leaves" in English with the "(1–2 blader)" sitting in the
 *    Norwegian and Swedish lines alone. A translated list can carry a
 *    defect the canonical one does not.
 *
 *  - Its pattern required a digit, so the fractions written as ½, ¼ and ¾
 *    slipped past — "Ripe avocado (½ medium)" is the same stale
 *    equivalent as "(about 3 medium)", just typeset differently.
 *
 * Same two repairs as before: entries that already carry a weight lose
 * the parenthetical, and the bay leaves — quantity null, the parenthetical
 * doing the work of an amount — get a real count instead.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const REVERSAL = 'fredheim-reversal-protocol.json'
const FMD = 'fredheim-fmd-5day.json'

const RENAMES = [
  [FMD, 'fmd-d1-breakfast', 0, { en: 'Ripe avocado', no: 'Moden avokado', sv: 'Mogen avokado' }],
  [FMD, 'fmd-d2-breakfast', 2, { en: 'Ripe avocado', no: 'Moden avokado', sv: 'Mogen avokado' }],
  [FMD, 'fmd-d5-lunch', 1, { en: 'Fennel bulb', no: 'Fennikel', sv: 'Fänkål' }],
  [FMD, 'fmd-d5-dinner', 4, { en: 'Ripe avocado', no: 'Moden avokado', sv: 'Mogen avokado' }],
]

// Lower-case names here because both recipes already write them that way
// in English; orn-23 capitalises, so each is handled from its own text.
const BAY = [
  [REVERSAL, 'orn-12', 7, 2, { en: 'bay leaves, dried', no: 'laurbærblad, tørket', sv: 'lagerblad, torkade' }],
  [REVERSAL, 'orn-23', 6, 2, { en: 'Bay leaves, dried', no: 'Laurbærblad, tørket', sv: 'Lagerblad, torkade' }],
]
const PCS = { en: 'pcs', no: 'stk', sv: 'st' }

const packs = {}
const load = (f) => (packs[f] ||= JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
function listsFor(r) {
  const out = { en: r.ingredients }
  for (const [lang, tr] of Object.entries(r.translations || {})) if (tr.ingredients) out[lang] = tr.ingredients
  return out
}

let renamed = 0
for (const [file, id, idx, names] of RENAMES) {
  const r = load(file).recipes.find(x => x.id === id)
  if (!r) throw new Error(`${id} not found`)
  for (const [lang, list] of Object.entries(listsFor(r))) {
    const line = list[idx]
    if (!line) throw new Error(`${id}[${idx}] missing in ${lang}`)
    if (!/\(/.test(line.name)) throw new Error(`${id}[${idx}] ${lang}: no parenthetical — already done?`)
    if (!names[lang]) throw new Error(`${id}[${idx}]: no ${lang} replacement`)
    line.name = names[lang]
    renamed++
  }
}

let bayed = 0
for (const [file, id, idx, qty, names] of BAY) {
  const r = load(file).recipes.find(x => x.id === id)
  if (!r) throw new Error(`${id} not found`)
  for (const [lang, list] of Object.entries(listsFor(r))) {
    const line = list[idx]
    if (!line) throw new Error(`${id}[${idx}] missing in ${lang}`)
    if (line.quantity != null) throw new Error(`${id}[${idx}] ${lang} already has a quantity`)
    if (!/bay leaf|bay leaves|laurb|lagerblad/i.test(line.name)) {
      throw new Error(`${id}[${idx}] ${lang} is not a bay-leaf line: ${line.name}`)
    }
    line.quantity = qty
    line.unit = PCS[lang] || PCS.en
    line.name = names[lang] || names.en
    bayed++
  }
}

for (const [file, pack] of Object.entries(packs)) {
  for (const r of pack.recipes) {
    const n = r.ingredients.length
    for (const [lang, tr] of Object.entries(r.translations || {})) {
      if (tr.ingredients && tr.ingredients.length !== n) {
        throw new Error(`${file} ${r.id}: ${lang} ${tr.ingredients.length} vs canonical ${n}`)
      }
    }
  }
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`${file} -> ${pack.version}`)
}
console.log(`\nstripped ${renamed} more lines, gave ${bayed} bay-leaf lines an amount`)

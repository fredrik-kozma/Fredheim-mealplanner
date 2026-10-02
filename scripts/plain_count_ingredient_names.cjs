/* Removes the count-equivalents baked into ingredient names.
 *
 * "Ripe tomatoes (about 3 medium)" is true at the recipe's own size and a
 * lie at every other one: the 300 g scales, the "about 3 medium" does not.
 * Same for "(1 can)", "(~1 large)", "(2 tbsp)". The weight is the thing
 * that stays true, so the weight is what survives.
 *
 * Two different repairs, because the entries are not the same shape:
 *
 *  A. Entries that already carry a real quantity — the parenthetical is
 *     pure duplication that goes stale. Stripped.
 *
 *  B. Bay leaves, where quantity is null and the parenthetical IS the
 *     amount. Stripping alone would leave an ingredient with no amount at
 *     all, so these get a real count instead. They scale normally rather
 *     than being pinned with scalesLinearly:false — that flag is for
 *     things that genuinely shouldn't change with batch size, like the
 *     yogurt starter in orn-60; a bigger pot of stew does want more bay.
 *
 * Nothing informative is deleted. orn-2's beans said "drained and rinsed"
 * and its steps never mentioned draining, so that instruction moves into
 * the step that needs it rather than disappearing with the parenthesis.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')
const PICTURES = 'fredheim-recipes-with-pictures.json'
const REVERSAL = 'fredheim-reversal-protocol.json'
const FMD = 'fredheim-fmd-5day.json'

// ── A. strip the stale count, keep the weight ─────────────────────────
// [pack, recipeId, index, { en, no, sv }]  — sv omitted where the recipe
// carries no Swedish translation.
const RENAMES = [
  [REVERSAL, 'orn-1', 2, { en: 'ripe banana, mashed', no: 'moden banan, most', sv: 'mogen banan, mosad' }],
  [REVERSAL, 'orn-2', 0, { en: 'cannellini beans, cooked', no: 'cannellinibønner, kokte', sv: 'cannellinibönor, kokta' }],
  [REVERSAL, 'orn-2', 1, { en: 'ground flaxseed', no: 'malt linfrø', sv: 'malet linfrö' }],
  [REVERSAL, 'orn-2', 2, { en: 'Medjool dates, pitted', no: 'Medjool-dadler, utstenede', sv: 'Medjool-dadlar, urkärnade' }],
  [REVERSAL, 'orn-29', 6, { en: 'Cold water', no: 'kaldt vann', sv: 'kallt vatten' }],
  [FMD, 'fmd-d4-dinner', 0, { en: 'Red bell pepper', no: 'Rød paprika', sv: 'Röd paprika' }],
  [FMD, 'fmd-d5-lunch', 0, { en: 'Ripe tomatoes', no: 'Modne tomater', sv: 'Mogna tomater' }],
  [FMD, 'fmd-d5-lunch', 2, { en: 'Carrot', no: 'Gulrot', sv: 'Morot' }],
  [FMD, 'fmd-d5-dinner', 3, { en: 'Cucumber', no: 'Agurk', sv: 'Gurka' }],
]

// ── B. bay leaves: give them the amount the parenthetical was carrying ──
const BAY = [
  [PICTURES, 'fr-27', 9, 2],
  [PICTURES, 'dal-stew', 2, 2],
  [PICTURES, 'lentil-lap-stew', 3, 2],
  [PICTURES, 'mediterranean-soup', 7, 2],
  [PICTURES, 'fr-184', 6, 2],
  [REVERSAL, 'orn-30', 7, 3],
  [REVERSAL, 'orn-31', 7, 3],
]
const BAY_NAMES = { en: 'Bay leaves, dried', no: 'Laurbærblad, tørket', sv: 'Lagerblad, torkade' }
// Each language's own spelling of the same canonical unit (pcs).
const PCS = { en: 'pcs', no: 'stk', sv: 'st' }

const packs = {}
function load(file) {
  if (!packs[file]) packs[file] = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  return packs[file]
}
function listsFor(recipe) {
  const out = { en: recipe.ingredients }
  for (const [lang, tr] of Object.entries(recipe.translations || {})) {
    if (tr.ingredients) out[lang] = tr.ingredients
  }
  return out
}

let renamed = 0
for (const [file, id, idx, names] of RENAMES) {
  const r = load(file).recipes.find(x => x.id === id)
  if (!r) throw new Error(`${id} not found`)
  const lists = listsFor(r)
  for (const [lang, list] of Object.entries(lists)) {
    const line = list[idx]
    if (!line) throw new Error(`${id}[${idx}] missing in ${lang}`)
    if (!/\(/.test(line.name)) throw new Error(`${id}[${idx}] ${lang} has no parenthetical — already done?`)
    if (!names[lang]) throw new Error(`${id}[${idx}] no replacement for ${lang}`)
    line.name = names[lang]
    renamed++
  }
}

let bayed = 0
for (const [file, id, idx, qty] of BAY) {
  const r = load(file).recipes.find(x => x.id === id)
  if (!r) throw new Error(`${id} not found`)
  const lists = listsFor(r)
  for (const [lang, list] of Object.entries(lists)) {
    const line = list[idx]
    if (!line) throw new Error(`${id}[${idx}] missing in ${lang}`)
    if (line.quantity != null) throw new Error(`${id}[${idx}] ${lang} already has a quantity — already done?`)
    if (!/bay leaf|laurb|lagerblad/i.test(line.name)) throw new Error(`${id}[${idx}] ${lang} is not the bay leaf line: ${line.name}`)
    line.quantity = qty
    line.unit = PCS[lang] || PCS.en
    line.name = BAY_NAMES[lang] || BAY_NAMES.en
    bayed++
  }
}

// orn-2: the beans' "drained and rinsed" has to land somewhere real.
{
  const r = load(REVERSAL).recipes.find(x => x.id === 'orn-2')
  const STEP = 1
  const NEW = {
    en: 'Drain and rinse the beans, then add everything to a blender.',
    no: 'Hell av og skyll bønnene, og ha alt i en blender.',
    sv: 'Häll av och skölj bönorna, och lägg allt i en mixer.',
  }
  if (!/blender|mixer/i.test(r.steps[STEP])) throw new Error('orn-2 step 1 is not the blender step')
  r.steps[STEP] = NEW.en
  for (const [lang, tr] of Object.entries(r.translations || {})) {
    if (tr.steps && NEW[lang]) tr.steps[STEP] = NEW[lang]
  }
}

// Index alignment is the contract these lists live by — check it held.
for (const [file, pack] of Object.entries(packs)) {
  for (const r of pack.recipes) {
    const n = r.ingredients.length
    for (const [lang, tr] of Object.entries(r.translations || {})) {
      if (tr.ingredients && tr.ingredients.length !== n) {
        throw new Error(`${file} ${r.id}: ${lang} has ${tr.ingredients.length} ingredients, canonical ${n}`)
      }
    }
  }
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`${file} -> ${pack.version}`)
}

console.log(`\nstripped stale counts from ${renamed} ingredient lines (across languages)`)
console.log(`gave ${bayed} bay-leaf lines a real amount`)
console.log(`orn-2: draining moved into the step that needed it`)

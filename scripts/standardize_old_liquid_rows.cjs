// One-off: the liquid rows in the three older packs that matched no dictionary
// entry (and so got no ml/gram hint) now carry an id, and vinegar and
// low-sodium soy sauce get dictionary and composition entries. Amounts are not
// touched. These packs are English only and their Nordic rows are written
// "norsk / english", so the Norwegian word moves to the note.
// Run once from the repo root: node scripts/standardize_old_liquid_rows.cjs
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PACKS = path.join(ROOT, 'recipe-packs-template', 'packs')
const DICT = path.join(ROOT, 'src', 'data', 'ingredientDictionary.json')
const FOODS = path.join(ROOT, 'scripts', 'data', 'food-composition-core.json')

const NEW_ENTRIES = [
  {
    id: 'apple-cider-vinegar', gPerMl: 1.01,
    names: { en: 'Apple cider vinegar', no: 'Eplecidereddik', sv: 'Äppelcidervinäger' },
    synonyms: { en: ['cider vinegar'], no: ['eplesidereddik'], sv: ['äppelvinäger'] },
    v: [21, 0, 0, 0, 0.9, 0, 0.4, 0, 5, 73], basis: 'USDA vinegar, cider',
  },
  {
    id: 'balsamic-vinegar', gPerMl: 1.1,
    names: { en: 'Balsamic vinegar', no: 'Balsamicoeddik', sv: 'Balsamvinäger' },
    synonyms: { en: ['balsamic'], no: ['balsamico'], sv: ['balsamico'] },
    v: [88, 0.5, 0, 0, 17, 0, 15, 0, 23, 112], basis: 'USDA vinegar, balsamic (1 tbsp = 16 g); sugars from the grape must, not added',
  },
  {
    id: 'rice-vinegar', gPerMl: 1.01,
    names: { en: 'Rice vinegar', no: 'Riseddik', sv: 'Risvinäger' },
    synonyms: { en: ['rice wine vinegar'], no: [], sv: [] },
    v: [18, 0, 0, 0, 0, 0, 0, 0, 2, 2], basis: 'USDA distilled vinegar as proxy for unseasoned rice vinegar (seasoned has sugar and salt)',
  },
  {
    id: 'soy-sauce-low-sodium', gPerMl: 1.1,
    names: { en: 'Low-sodium soy sauce', no: 'Lettsaltet soyasaus', sv: 'Saltreducerad sojasås' },
    synonyms: { en: ['reduced-sodium soy sauce'], no: ['soyasaus med redusert salt'], sv: ['sojasås med reducerad salthalt'] },
    v: [53, 8.1, 0.6, 0.1, 4.9, 0.8, 0.4, 0, 3300, 435], basis: 'As soy-sauce, sodium at the reduced-sodium figure in recipeNutritionEstimate.mjs (about 40% less, as on labels)',
  },
  {
    id: 'white-wine-vinegar', gPerMl: 1.01,
    names: { en: 'White wine vinegar', no: 'Hvitvinseddik', sv: 'Vitvinsvinäger' },
    synonyms: { en: [], no: [], sv: [] },
    v: [19, 0, 0, 0, 0.3, 0, 0, 0, 8, 39], basis: 'USDA vinegar, red wine, as proxy (no separate white wine entry)',
  },
]

// pack, recipe, row name as written -> the row's id, standard name and note.
const EVOO = { ingredient: 'olive-oil', name: 'Olive oil', note: 'extra-virgin' }
const VEG_OIL = { ingredient: 'rapeseed-oil', name: 'Rapeseed (canola) oil', note: 'or other vegetable oil' }
const FIXES = [
  ['healthy-basics', 'hb-3', 'white wine vinegar', { ingredient: 'white-wine-vinegar', name: 'White wine vinegar' }],
  ['healthy-basics', 'hb-3', 'extra-virgin olive oil', EVOO],
  ['healthy-basics', 'hb-5', 'water (to thin dressing)', { ingredient: 'water', name: 'Water', note: 'to thin dressing' }],
  ['healthy-basics', 'hb-7', 'low-sodium soy sauce', { ingredient: 'soy-sauce-low-sodium', name: 'Low-sodium soy sauce' }],
  ['healthy-basics', 'hb-7', 'rice vinegar', { ingredient: 'rice-vinegar', name: 'Rice vinegar' }],
  ['healthy-basics', 'hb-7', 'vegetable oil', VEG_OIL],
  ['healthy-basics', 'hb-8', 'vegetable oil', VEG_OIL],
  ['mediterranean', 'med-1', 'extra-virgin olive oil', EVOO],
  ['mediterranean', 'med-2', 'extra-virgin olive oil, plus extra to serve', { ...EVOO, note: 'extra-virgin, plus extra to serve' }],
  ['mediterranean', 'med-2', 'ice-cold water or chickpea liquid', { ingredient: 'water', name: 'Water', note: 'ice-cold, or chickpea liquid' }],
  ['mediterranean', 'med-3', 'extra-virgin olive oil', EVOO],
  ['mediterranean', 'med-4', 'extra-virgin olive oil', EVOO],
  ['nordic-classics', 'nor-1', 'honning / honey', { ingredient: 'honey', name: 'Honey', note: 'honning' }],
  ['nordic-classics', 'nor-2', 'extra virgin olivenolje / olive oil', { ...EVOO, note: 'extra virgin, olivenolje' }],
  ['nordic-classics', 'nor-4', 'olivenolje / olive oil', { ingredient: 'olive-oil', name: 'Olive oil', note: 'olivenolje' }],
  ['nordic-classics', 'nor-6', 'olivenolje / olive oil', { ingredient: 'olive-oil', name: 'Olive oil', note: 'olivenolje' }],
]

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')

// -- dictionary: in its aisle, in id order
const dict = readJson(DICT)
for (const e of NEW_ENTRIES) {
  if (dict.entries.some((x) => x.id === e.id)) continue
  const entry = {
    id: e.id, aisle: 'Oils & Condiments', preferredUnit: 'tbsp', liquid: { gPerMl: e.gPerMl },
    names: e.names, synonyms: e.synonyms,
  }
  let at = dict.entries.findIndex((x) => x.aisle === entry.aisle && x.id > e.id)
  if (at < 0) at = dict.entries.findLastIndex((x) => x.aisle === entry.aisle) + 1
  dict.entries.splice(at, 0, entry)
}
writeJson(DICT, dict)

// -- composition table: text edit, because it is hand-aligned, one food a line
let table = fs.readFileSync(FOODS, 'utf8')
const eol = table.includes('\r\n') ? '\r\n' : '\n'
const lines = table.split(eol)
const foodLine = /^ {4}"([^"]+)":\s*\{ "v"/
for (const e of NEW_ENTRIES) {
  if (lines.some((l) => l.match(foodLine)?.[1] === e.id)) continue
  const at = lines.findIndex((l) => { const m = l.match(foodLine); return m && m[1] > e.id })
  if (at < 0) throw new Error(`no place for ${e.id}`)
  const key = `"${e.id}":`.padEnd(26)
  lines.splice(at, 0, `    ${key}{ "v": [${e.v.join(', ')}], "density": ${e.gPerMl}, "basis": ${JSON.stringify(e.basis)} },`)
}
fs.writeFileSync(FOODS, lines.join(eol))

// -- rows, and a minor version bump on each pack changed. Text edits too:
// these packs keep one row a line.
for (const packId of new Set(FIXES.map((f) => f[0]))) {
  const file = path.join(PACKS, `${packId}.json`)
  const packLines = fs.readFileSync(file, 'utf8').split('\n')
  for (const [p, recipeId, oldName, to] of FIXES) {
    if (p !== packId) continue
    const start = packLines.findIndex((l) => l.includes(`"id": "${recipeId}"`))
    const oldText = `"name": ${JSON.stringify(oldName)} }`
    const i = packLines.findIndex((l, n) => n > start && l.includes(oldText))
    const next = packLines.findIndex((l, n) => n > start && /^\s*"id": /.test(l))
    if (start < 0 || i < 0 || (next >= 0 && i > next)) throw new Error(`${recipeId}: no row "${oldName}"`)
    const fields = [`"ingredient": ${JSON.stringify(to.ingredient)}`, `"name": ${JSON.stringify(to.name)}`]
    if (to.note) fields.push(`"note": ${JSON.stringify(to.note)}`)
    packLines[i] = packLines[i].replace(oldText, `${fields.join(', ')} }`)
  }
  const v = packLines.findIndex((l) => /^\s*"version": /.test(l))
  const [major, minor] = packLines[v].match(/"(\d+\.\d+)\.\d+"/)[1].split('.').map(Number)
  packLines[v] = packLines[v].replace(/"\d+\.\d+\.\d+"/, `"${major}.${minor + 1}.0"`)
  fs.writeFileSync(file, packLines.join('\n'))
  console.log(`${packId} -> ${major}.${minor + 1}.0`)
}
console.log(`${FIXES.length} rows, ${NEW_ENTRIES.length} new entries`)

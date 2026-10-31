import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { execSync } from 'child_process'

const ROOT = process.cwd()

// --- 1. Patch micronutrients.mjs ---
const microPath = 'scripts/lib/micronutrients.mjs'
let micro = fs.readFileSync(microPath, 'utf8')

const replacements = [
  {
    id: 'plant-yogurt',
    old: `'plant-yogurt':       [0.5, 1.3, 0.2, 1.1, 120, 0.4, 18, 60, 0.3, 0.1, 0.15, 1, 0, 0, 0.75, 0.3, 2, 0.04, 0.21, 0.2, 0.03, 10, 0.38, 10],`,
    neu: `'plant-yogurt':       [0.5, 1.3, 0.2, 1.1, 20, 0.4, 18, 60, 0.3, 0.1, 0.15, 1, 0, 0, 0, 0.3, 2, 0.04, 0.21, 0.2, 0.03, 10, 0, 10],`,
    commentOld: `// Soy yoghurt, plain, fortified (Alpro natural label: Ca, D, B2, B12).`,
    commentNew: `// Soy yoghurt, plain, UNFORTIFIED (Fredrik 2026-10-31): Ca≈20 from soy solids; D/B12 0. B2 left as-is.`,
  },
  {
    id: 'soy-milk',
    old: `'soy-milk':           [0.4, 1.1, 0.15, 0.95, 120, 0.4, 15, 50, 0.25, 0.1, 0.15, 1.5, 0, 0, 0.75, 0.1, 3, 0.03, 0.21, 0.15, 0.04, 10, 0.38, 10],`,
    neu: `'soy-milk':           [0.4, 1.1, 0.15, 0.95, 25, 0.4, 15, 50, 0.25, 0.1, 0.15, 1.5, 0, 0, 0, 0.1, 3, 0.03, 0.21, 0.15, 0.04, 10, 0, 23],`,
    // choline left roughly; plant-milk unfort uses 23 choline
  },
  {
    id: 'oat-milk',
    old: `'oat-milk':           [0.9, 0.4, 0.1, 0.3, 120, 0.3, 10, 40, 0.2, 0.03, 0.2, 1, 0, 0, 1.1, 0.2, 2, 0.05, 0.21, 0.1, 0.02, 3, 0.38, 3],`,
    neu: `'oat-milk':           [0.9, 0.4, 0.1, 0.3, 12, 0.3, 10, 40, 0.2, 0.03, 0.2, 1, 0, 0, 0, 0.2, 2, 0.05, 0.21, 0.1, 0.02, 3, 0, 3],`,
  },
  {
    id: 'cashew-milk',
    old: `'cashew-milk':        [1.1, 0.35, 0.01, 0.34, 120, 0.2, 8, 15, 0.15, 0.05, 0.04, 0.5, 0, 0, 1, 0.5, 1, 0.01, 0.01, 0.03, 0.01, 1, 0.38, 1],`,
    neu: `'cashew-milk':        [1.1, 0.35, 0.01, 0.34, 10, 0.2, 8, 15, 0.15, 0.05, 0.04, 0.5, 0, 0, 0, 0.5, 1, 0.01, 0.01, 0.03, 0.01, 1, 0, 1],`,
  },
]

// Update block comment for soy drinks
micro = micro.replace(
  /\/\/ Soy drinks\/sauces\. Plant drinks as the usual Nordic fortified cartons\r?\n\s*\/\/ \(Oatly, Alpro: Ca 120 mg, D 0\.75.?1\.1.?g, B2 0\.21 mg, B12 0\.38.?g\)\./,
  `// Soy drinks/sauces. Plant drinks UNFORTIFIED (Fredrik 2026-10-31): no added Ca/D/B12.\n  // soy-milk Ca from USDA-SR 172446 unfortified soymilk; oat/cashew Ca from dilute grain/nut solids.`,
)

micro = micro.replace(
  `// Soy yoghurt, plain, fortified (Alpro natural label: Ca, D, B2, B12).`,
  `// Soy yoghurt, plain, UNFORTIFIED (Fredrik 2026-10-31): Ca≈20 from soy solids; D/B12 0.`,
)

for (const r of replacements) {
  if (!micro.includes(r.old)) {
    console.error('OLD LINE NOT FOUND for', r.id)
    // try to find current line
    const m = micro.match(new RegExp("'" + r.id + "':\\s*\\[[^\\]]+\\],"))
    console.error('current:', m && m[0])
    process.exit(1)
  }
  micro = micro.replace(r.old, r.neu)
  console.log('patched', r.id)
}
fs.writeFileSync(microPath, micro)

// Verify almond-milk / plant-milk / coconut already unfortified
const { MICRO, COLS } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/micronutrients.mjs')).href + '?t=' + Date.now())
const bi = COLS.indexOf('vitaminB12'), di = COLS.indexOf('vitaminD'), ci = COLS.indexOf('calcium')
const report = []
for (const id of ['plant-milk', 'almond-milk', 'soy-milk', 'oat-milk', 'cashew-milk', 'plant-yogurt', 'coconut-milk']) {
  const v = MICRO[id]
  report.push({ id, Ca: v[ci], D: v[di], B12: v[bi] })
  console.log('NOW', id, 'Ca', v[ci], 'D', v[di], 'B12', v[bi])
}

// Update food-sources notes for the ones we changed
const sourcesPath = 'scripts/data/food-sources.json'
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'))
const notes = {
  'soy-milk': { db: 'USDA-SR', id: '172446', name: 'Soymilk, original and vanilla, unfortified', note: 'Fredrik 2026-10-31 UNFORTIFIED: Ca/D/B12 as USDA 172446 (Ca 25, D 0, B12 0).' },
  'oat-milk': { db: 'estimate', id: null, name: 'Oat drink, unsweetened, unfortified', note: 'Fredrik 2026-10-31 UNFORTIFIED: Ca≈12 from oat solids (no added Ca); D/B12 0. Macros still from oat-drink label.' },
  'cashew-milk': { db: 'estimate', id: null, name: 'Cashew milk, unsweetened, unfortified', note: 'Fredrik 2026-10-31 UNFORTIFIED: Ca≈10 dilute cashew; D/B12 0.' },
  'plant-yogurt': { db: 'estimate', id: null, name: 'Soy yoghurt, plain, unfortified', note: 'Fredrik 2026-10-31 UNFORTIFIED: was Alpro-type fortified; Ca≈20 soy solids; D/B12 0.' },
}
for (const [id, micro] of Object.entries(notes)) {
  if (!sources.entries[id]) sources.entries[id] = {}
  sources.entries[id].micro = micro
}
fs.writeFileSync(sourcesPath, JSON.stringify(sources, null, 2) + '\n')
console.log('food-sources notes updated')

// --- 2. Rebuild nutritionDb ---
execSync('node scripts/build-nutrition-db.mjs', { stdio: 'inherit' })

// --- 3. Recompute pack micros for affected recipes (and bump versions) ---
const { estimateRecipe, rowGrams, PACK_KEY } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/recipeNutritionEstimate.mjs')).href + '?t=' + Date.now())
const microMod = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/micronutrients.mjs')).href + '?t=' + Date.now())
const { COLS: MCOLS, microPer100, MICRO: MICRO2 } = microMod

const AFFECTED = new Set(['soy-milk', 'oat-milk', 'cashew-milk', 'plant-yogurt'])
const PACK_FILES = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const ORDER = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat', 'omega3', 'omega6',
  'cholesterol', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber',
  'calcium', 'potassium', 'copper', 'iron', 'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc', 'sodium',
  'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'folate', 'thiamin', 'riboflavin', 'niacin', 'choline',
]

function round(x) {
  if (!x) return 0
  if (Math.abs(x) >= 10) return Math.round(x)
  if (Math.abs(x) >= 1) return Math.round(x * 10) / 10
  return Math.round(x * 100) / 100
}

const packs = Object.fromEntries(PACK_FILES.map(f => [f, JSON.parse(fs.readFileSync(path.join('recipe-packs-template/packs', f), 'utf8'))]))
const byId = new Map(Object.values(packs).flatMap(p => p.recipes.map(r => [r.id, r])))
const COMPOSITE = { 'white-cashew-sauce': 'fr-191', 'classic-hummus': 'classic-hummus', 'cashew-sour-cream': 'fr-33' }

function batchMicroTotals(recipe) {
  const totals = Object.fromEntries(MCOLS.map(k => [k, 0]))
  for (const row of recipe.ingredients) {
    const { grams } = rowGrams(row)
    if (!grams) continue
    let v
    const src = COMPOSITE[row.ingredient]
    if (src) {
      const r = byId.get(src)
      const t = batchMicroTotals(r)
      const f = 100 / (r.servings * r.servingWeightGrams)
      v = Object.fromEntries(MCOLS.map(k => [k, t[k] * f]))
    } else {
      v = microPer100(row)
    }
    for (const k of MCOLS) totals[k] += v[k] * grams / 100
  }
  return totals
}

const beforeSnap = {}
const nutrientDrops = []
let recipesTouched = 0
for (const [file, pack] of Object.entries(packs)) {
  let touched = false
  for (const r of pack.recipes) {
    if (!(r.ingredients || []).some(i => AFFECTED.has(i.ingredient))) continue
    if (!r.nutrition?.perServing) continue
    const ps = r.nutrition.perServing
    const before = { calcium: ps.calcium, vitaminB12: ps.vitaminB12, vitaminD: ps.vitaminD }
    beforeSnap[r.id] = { ...before, title: r.title, tags: [...(r.tags || [])] }

    const t = batchMicroTotals(r)
    const add = {}
    for (const k of MCOLS) add[k] = t[k] / r.servings

    // Refresh micros/omega/fat-split; keep curated macros & sodium/potassium
    const next = { ...ps }
    for (const k of MCOLS) {
      if (['sodium', 'potassium'].includes(k)) continue
      next[k] = round(add[k])
    }
    // fat split clamp
    const satFat = ps.saturatedFat ?? 0
    next.saturatedFat = satFat
    const room = Math.max(0, (ps.totalFat ?? 0) - satFat)
    let mono = add.monounsaturatedFat, poly = add.polyunsaturatedFat
    const split = mono + poly
    if (split > room && split > 0) {
      const f = room / split
      mono *= f; poly *= f
      add.omega3 *= f; add.omega6 *= f
    }
    next.monounsaturatedFat = round(mono)
    next.polyunsaturatedFat = round(poly)
    next.omega3 = round(add.omega3)
    next.omega6 = round(add.omega6)

    const ordered = {}
    for (const k of ORDER) ordered[k] = next[k] ?? 0
    for (const k of Object.keys(ps)) if (!(k in ordered)) ordered[k] = ps[k]
    // preserve macros + Na/K
    for (const k of ['calories', 'protein', 'totalFat', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber', 'sodium', 'potassium', 'yieldFactor', 'yieldNote']) {
      if (ps[k] != null) ordered[k] = ps[k]
    }
    // yieldFactor lives on nutrition not perServing - don't put in ordered wrongly
    delete ordered.yieldFactor
    delete ordered.yieldNote

    r.nutrition.perServing = ordered
    recipesTouched++
    touched = true

    const after = { calcium: ordered.calcium, vitaminB12: ordered.vitaminB12, vitaminD: ordered.vitaminD }
    if (before.calcium !== after.calcium || before.vitaminB12 !== after.vitaminB12 || before.vitaminD !== after.vitaminD) {
      nutrientDrops.push({
        id: r.id,
        title: typeof r.title === 'object' ? r.title.en : r.title,
        before,
        after,
        ings: (r.ingredients || []).filter(i => AFFECTED.has(i.ingredient)).map(i => i.ingredient),
      })
    }
  }
  if (touched) {
    const parts = String(pack.version || '1.0.0').split('.').map(Number)
    while (parts.length < 3) parts.push(0)
    parts[2] += 1
    pack.version = parts.join('.')
    fs.writeFileSync(path.join('recipe-packs-template/packs', file), JSON.stringify(pack, null, 2) + '\n')
    console.log('wrote', file, 'v', pack.version)
  }
}
console.log('recipes micros refreshed:', recipesTouched, 'with Ca/B12/D changes:', nutrientDrops.length)
fs.writeFileSync('scripts/_tmp/unfortified-milk-recipe-drops.json', JSON.stringify(nutrientDrops, null, 2))

// --- 4. Relabel ---
const { analyzeRecipe, withLabels, LABELS } = await import(pathToFileURL(path.join(ROOT, 'scripts/lib/recipeLabels.mjs')).href + '?t=' + Date.now())
const { loadPacks } = await import(pathToFileURL(path.join(ROOT, 'scripts/check-recipes.mjs')).href + '?t=' + Date.now())
const labelPacks = loadPacks()
const recipesById = new Map()
for (const pack of labelPacks) for (const r of pack.recipes) recipesById.set(r.id, r)
const LABEL_SET = new Set(LABELS)
const labelFlips = []
const touchedPacks = new Set()
for (const pack of labelPacks) {
  for (const r of pack.recipes) {
    if (!beforeSnap[r.id] && !(r.ingredients || []).some(i => AFFECTED.has(i.ingredient))) continue
    if (!r.nutrition?.perServing) continue
    const a = analyzeRecipe(r, recipesById, { storedMealTypes: true })
    const next = withLabels(r.tags || [], a.proposed)
    const oldL = (r.tags || []).filter(t => LABEL_SET.has(t)).sort()
    const newL = next.filter(t => LABEL_SET.has(t)).sort()
    if (JSON.stringify(oldL) !== JSON.stringify(newL)) {
      labelFlips.push({ id: r.id, title: r.title, from: oldL, to: newL })
      r.tags = next
      touchedPacks.add(pack)
    }
  }
}
for (const pack of touchedPacks) {
  const { file, ...data } = pack
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n')
  console.log('labels wrote', path.basename(file))
}
console.log('label flips', labelFlips.length)
fs.writeFileSync('scripts/_tmp/unfortified-milk-label-flips.json', JSON.stringify(labelFlips, null, 2))

// Update completion proposals for flipped recipes only
const propPath = 'scripts/data/recipe-completion-proposals.json'
if (labelFlips.length && fs.existsSync(propPath)) {
  const props = JSON.parse(fs.readFileSync(propPath, 'utf8'))
  let n = 0
  for (const flip of labelFlips) {
    const p = props.recipes.find(x => x.id === flip.id)
    if (p?.labels) { p.labels.proposed = flip.to; n++ }
  }
  fs.writeFileSync(propPath, JSON.stringify(props, null, 2) + '\n')
  console.log('proposals updated', n)
}

console.log('\\n=== INGREDIENT CHANGES ===')
console.log(JSON.stringify(report, null, 2))
console.log('\\n=== TOP RECIPE DROPS ===')
for (const d of nutrientDrops.slice(0, 25)) {
  console.log(d.id, d.title, d.ings.join('+'),
    'Ca', d.before.calcium, '→', d.after.calcium,
    'B12', d.before.vitaminB12, '→', d.after.vitaminB12,
    'D', d.before.vitaminD, '→', d.after.vitaminD)
}

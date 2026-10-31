#!/usr/bin/env node
/**
 * Build src/data/nutritionDb.json — compact per-id macros+micros+density/g
 * for the live nutrition engine.
 *
 * Prefer (on PC, after phase a):
 *   scripts/data/food-composition-core.json
 *   scripts/lib/micronutrients.mjs (MICRO + MICRO_EXTRA)
 *   src/data/ingredientDictionary.json (spoonGrams)
 *
 * Offline fallback (box): USDA SR Legacy via food-sources-draft + filled-micros.
 *
 * Usage (from project root or this folder):
 *   node scripts/build-nutrition-db.mjs
 *   node /workspace/nutridb-phase-b/scripts/build-nutrition-db.mjs --offline
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PHASE_B = path.resolve(HERE, '..')
const PHASE_A = path.resolve(PHASE_B, '../nutridb-phase-a')
const OFFLINE = process.argv.includes('--offline')

function findRoot() {
  for (const c of [process.cwd(), path.resolve(HERE, '../..'), path.resolve(HERE, '../../menu-planner/sv-translations'), path.join(PHASE_B, 'sandbox')]) {
    if (fs.existsSync(path.join(c, 'src/data/ingredientDictionary.json'))) return c
  }
  return null
}

const MACRO_FIELDS = ['kcal', 'protein', 'fat', 'satFat', 'carbs', 'fiber', 'sugars', 'added', 'sodium', 'potassium']
const MICRO_FIELDS = [
  'monounsaturatedFat', 'polyunsaturatedFat', 'omega3', 'omega6',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'zinc', 'copper', 'manganese', 'selenium',
  'vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'thiamin', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'choline',
]
// Pack key for each macro field
const PACK_FROM_MACRO = {
  kcal: 'calories', protein: 'protein', fat: 'totalFat', satFat: 'saturatedFat',
  carbs: 'totalCarbs', fiber: 'fiber', sugars: 'totalSugars', added: 'addedSugar',
  sodium: 'sodium', potassium: 'potassium',
}

function roundSmart(x) {
  if (x == null || !Number.isFinite(x) || Object.is(x, -0)) return 0
  const a = Math.abs(x)
  if (a < 0.0005) return 0
  if (a >= 100) return Math.round(x)
  if (a >= 10) return Math.round(x * 10) / 10
  if (a >= 1) return Math.round(x * 100) / 100
  return Math.round(x * 1000) / 1000
}

function parseCsvLine(line) {
  const out = []; let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQ = false
      else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

async function buildFromProject(root) {
  const comp = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/food-composition-core.json'), 'utf8'))
  const dict = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ingredientDictionary.json'), 'utf8'))
  const microMod = await import(pathToFileURL(path.join(root, 'scripts/lib/micronutrients.mjs')).href + '?t=' + Date.now())
  const MICRO = microMod.MICRO
  const foods = {}
  for (const e of dict.entries) {
    const id = e.id
    const f = comp.foods[id]
    if (!f) continue
    const m = (f.v || []).map(roundSmart)
    while (m.length < 10) m.push(0)
    const mv = MICRO[id]
    const u = mv == null ? MICRO_FIELDS.map(() => 0) : (Array.isArray(mv) ? mv.map(roundSmart) : MICRO_FIELDS.map(() => 0))
    const entry = { m: m.slice(0, 10), u }
    if (f.density != null) entry.d = f.density
    if (f.g && Object.keys(f.g).length) entry.g = f.g
    if (e.spoonGrams?.gPerTsp != null) {
      entry.g = { ...(entry.g || {}), tsp: e.spoonGrams.gPerTsp }
      if (entry.g.tbsp == null) entry.g.tbsp = roundSmart(e.spoonGrams.gPerTsp * 3)
    }
    foods[id] = entry
  }
  return { foods, source: 'project' }
}

async function buildOffline() {
  const sources = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'food-sources-draft.json'), 'utf8'))
  const filled = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'filled-micros.json'), 'utf8'))
  const usdaMacros = JSON.parse(fs.readFileSync(path.join(PHASE_A, 'usda-macros-by-id.json'), 'utf8'))
  const dictPath = path.join(PHASE_A, 'sandbox/src/data/ingredientDictionary.json')
  const dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'))

  // Load FDC nutrients for all mapped ids
  const fdcIds = new Set()
  for (const e of Object.values(sources.entries)) {
    if (e.usda?.fdcId) fdcIds.add(+e.usda.fdcId)
    if (e.micro?.db === 'USDA-SR' && e.micro.id) fdcIds.add(+e.micro.id)
  }
  const SR = path.join(PHASE_A, 'sr/FoodData_Central_sr_legacy_food_csv_2018-04')
  const byFood = new Map()
  for (const id of fdcIds) byFood.set(id, new Map())
  for (const line of fs.readFileSync(path.join(SR, 'food_nutrient.csv'), 'utf8').split(/\r?\n/).slice(1)) {
    if (!line) continue
    const cols = parseCsvLine(line)
    const fdcId = +cols[1]
    if (!fdcIds.has(fdcId)) continue
    const amount = parseFloat(cols[3])
    if (Number.isFinite(amount)) byFood.get(fdcId).set(+cols[2], amount)
  }

  const MACRO_NUTS = { kcal: [1008], protein: [1003], fat: [1004], satFat: [1258], carbs: [1005], fiber: [1079], sugars: [2000], sodium: [1093], potassium: [1092], added: [] }
  const MICRO_NUTS = {
    monounsaturatedFat: [1292], polyunsaturatedFat: [1293],
    omega3: [1404, 1270], omega6: [1316, 1269],
    calcium: [1087], iron: [1089], magnesium: [1090], phosphorus: [1091],
    zinc: [1095], copper: [1098], manganese: [1101], selenium: [1103],
    vitaminA: [1106], vitaminC: [1162], vitaminD: [1114], vitaminE: [1109], vitaminK: [1185, 1183],
    thiamin: [1165], riboflavin: [1166], niacin: [1167], vitaminB6: [1175],
    folate: [1190, 1177], vitaminB12: [1178], choline: [1180],
  }
  function pick(map, ids) {
    for (const id of ids) if (map.has(id)) return map.get(id)
    return 0
  }

  const foods = {}
  const dictById = Object.fromEntries(dict.entries.map(e => [e.id, e]))
  const allIds = new Set([...Object.keys(sources.entries), ...Object.keys(filled.filled), ...dict.entries.map(e => e.id)])

  for (const id of allIds) {
    const src = sources.entries[id]
    const fdc = src?.usda?.fdcId || (src?.micro?.db === 'USDA-SR' ? +src.micro.id : null)
    const nutMap = fdc ? byFood.get(+fdc) : null
    let m
    if (usdaMacros.foods[id]?.macros) {
      const u = usdaMacros.foods[id].macros
      m = [u.kcal, u.protein, u.fat, u.satFat, u.carbs, u.fiber, u.sugars, 0, u.sodium, u.potassium].map(x => roundSmart(x ?? 0))
    } else if (nutMap) {
      m = MACRO_FIELDS.map(k => roundSmart(pick(nutMap, MACRO_NUTS[k] || [])))
    } else {
      m = MACRO_FIELDS.map(() => 0)
    }

    let u
    if (filled.filled[id]) {
      u = filled.filled[id].map(roundSmart)
    } else if (nutMap) {
      u = MICRO_FIELDS.map(k => roundSmart(pick(nutMap, MICRO_NUTS[k] || [])))
    } else {
      u = MICRO_FIELDS.map(() => 0)
    }

    const entry = { m, u }
    const e = dictById[id]
    if (e?.spoonGrams?.gPerTsp != null) {
      entry.g = { tsp: e.spoonGrams.gPerTsp, tbsp: roundSmart(e.spoonGrams.gPerTsp * 3) }
    }
    // Heuristic densities for common liquids/oils
    if (/oil$|oil-/.test(id) || id.endsWith('-oil')) entry.d = 0.92
    if (['water', 'vegetable-broth', 'lemon-juice', 'lime-juice', 'orange-juice', 'pineapple-juice', 'soy-sauce', 'tamari', 'plant-milk', 'almond-milk', 'olive-brine'].includes(id)) entry.d = 1
    if (id === 'coconut-oil') entry.d = 0.92
    if (id === 'rapeseed-oil') entry.d = 0.92
    if (id === 'tahini' || id === 'almond-butter' || id === 'peanut-butter') entry.d = 1.1
    foods[id] = entry
  }

  // Piece weights for common produce (offline defaults; PC composition overrides)
  const PCS = {
    limes: 67, lemons: 58, garlic: null, // clove handled separately
    avocados: 201, bananas: 118, apples: 182, oranges: 131,
  }
  for (const [id, g] of Object.entries(PCS)) {
    if (!foods[id] || g == null) continue
    foods[id].g = { ...(foods[id].g || {}), pcs: g }
  }
  if (foods.garlic) foods.garlic.g = { ...(foods.garlic.g || {}), clove: 3 }

  return { foods, source: 'offline-usda+filled' }
}

const root = findRoot()
let result
if (!OFFLINE && root && fs.existsSync(path.join(root, 'scripts/data/food-composition-core.json'))) {
  console.log('Building from project at', root)
  result = await buildFromProject(root)
} else {
  console.log('Building offline from phase-a USDA + filled micros')
  result = await buildOffline()
}

const out = {
  v: 1,
  description: 'Compact nutrition DB for live engine. m=macros(10), u=micros(24), d=density g/ml, g=grams per unit.',
  macroFields: MACRO_FIELDS,
  microFields: MICRO_FIELDS,
  packFromMacro: PACK_FROM_MACRO,
  composites: {
    'classic-hummus': 'classic-hummus',
    'cashew-sour-cream': 'fr-33',
    'white-cashew-sauce': 'fr-191',
  },
  // Ingredient ids whose quantity switches with salt level when standardAmount is set
  saltSwitchIds: [
    'salt', 'black-salt', 'herb-salt',
    'soy-sauce', 'tamari', 'low-sodium-soy-sauce',
    'miso-paste', 'vegetable-bouillon',
  ],
  foods: result.foods,
  builtFrom: result.source,
  builtAt: new Date().toISOString(),
}

const outPath = path.join(PHASE_B, 'src/data/nutritionDb.json')
fs.mkdirSync(path.dirname(outPath), { recursive: true })
const json = JSON.stringify(out)
fs.writeFileSync(outPath, json)
// Also write pretty for debugging? keep compact only
const raw = Buffer.byteLength(json)
// gzip estimate
const { gzipSync } = await import('node:zlib')
const gz = gzipSync(json)
console.log(JSON.stringify({
  foods: Object.keys(out.foods).length,
  rawBytes: raw,
  rawKB: Math.round(raw / 1024),
  gzipBytes: gz.length,
  gzipKB: Math.round(gz.length / 1024),
  source: result.source,
  outPath,
}, null, 2))

// Copy into sandbox if present for tests
const sandboxData = path.join(PHASE_B, 'sandbox/src/data')
if (fs.existsSync(path.join(PHASE_B, 'sandbox'))) {
  fs.mkdirSync(sandboxData, { recursive: true })
  fs.copyFileSync(outPath, path.join(sandboxData, 'nutritionDb.json'))
}

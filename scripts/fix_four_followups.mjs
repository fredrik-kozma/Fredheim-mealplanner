/**
 * Four follow-ups Fredrik approved:
 * 1) Replace gazpacho + ratatouille imageUrl with new pictures (white beans + avocado / white beans).
 * 2) Add ground flaxseed to stroganoff, tagine, chana masala; recompute nutrition.
 * 3) Mark chili/tagine/curry/lapskaus batch-friendly via LABEL_OVERRIDES + label-recipes --write.
 * 4) USDA corrections already applied in micronutrients.mjs.
 *
 * Never commits. Bumps pack version once.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { estimateRecipe, PACK_KEY, round } from './lib/recipeNutritionEstimate.mjs'
import { COLS, microPer100 } from './lib/micronutrients.mjs'
import { rowGrams } from './lib/recipeNutritionEstimate.mjs'
import { analyzeRecipe, withLabels, LABELS } from './lib/recipeLabels.mjs'
import { loadPacks, META_PACK_IDS } from './check-recipes.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_FILE = path.join(ROOT, 'recipe-packs-template/packs/fredheim-recipes-with-pictures.json')
const IMG = {
  gazpacho: path.join(process.env.TEMP, 'cc-newsix-images', 'gazpacho-v2.jpg'),
  ratatouille: path.join(process.env.TEMP, 'cc-newsix-images', 'ratatouille-v2.jpg'),
}

function toDataUrl(file) {
  const buf = fs.readFileSync(file)
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error(`${file} is not JPEG`)
  const kb = buf.length / 1024
  if (kb < 40 || kb > 110) console.warn(`warn: ${path.basename(file)} is ${kb.toFixed(1)} KB (want ~60-75)`)
  return 'data:image/jpeg;base64,' + buf.toString('base64')
}

function flaxRow(lang) {
  const names = {
    en: { name: 'Flaxseed, ground', note: 'stirred in at the end' },
    no: { name: 'Linfrø, malt', note: 'røres inn til slutt' },
    sv: { name: 'Linfrön, malda', note: 'rörs i på slutet' },
  }
  const n = names[lang]
  return { quantity: null, unit: 'g', ingredient: 'flaxseed-ground', name: n.name, note: n.note }
}

// grams per whole batch (4 servings). ~1 tsp/serving for stroganoff & chana; 1 tbsp batch for tagine.
const FLAX_G = {
  'mushroom-stroganoff': 10, // 2.5 g/serving ≈ 1 tsp
  'moroccan-chickpea-tagine': 7, // 1.75 g/serving ≈ ¾ tsp
  'chana-masala': 10,
}

const FLAX_STEPS = {
  'mushroom-stroganoff': {
    en: 'Take off the heat and stir in the ground flaxseed. Serve over potatoes, topped with parsley.',
    no: 'Ta av varmen og rør inn det malte linfrøet. Server over poteter med persille.',
    sv: 'Ta av värmen och rör i det malda linfröt. Servera över potatis med persilja.',
    replaceEn: 'Serve over potatoes, topped with parsley.',
    replaceNo: 'Server over poteter med persille.',
    replaceSv: 'Servera över potatis med persilja.',
  },
  'moroccan-chickpea-tagine': {
    en: 'Take off the heat and stir in the ground flaxseed. Serve topped with fresh coriander.',
    no: 'Ta av varmen og rør inn det malte linfrøet. Server med fersk koriander.',
    sv: 'Ta av värmen och rör i det malda linfröt. Servera med färsk koriander.',
    replaceEn: 'Serve topped with fresh coriander.',
    replaceNo: 'Server med fersk koriander.',
    replaceSv: 'Servera med färsk koriander.',
  },
  'chana-masala': {
    en: 'Take off the heat and stir in the ground flaxseed with the remaining coriander and an extra squeeze of lemon.',
    no: 'Ta av varmen og rør inn det malte linfrøet med resten av korianderen og ekstra sitron.',
    sv: 'Ta av värmen och rör i det malda linfröt med resten av koriandern och extra citron.',
    replaceEn: 'Serve with the remaining coriander and an extra squeeze of lemon.',
    replaceNo: 'Server med resten av korianderen og ekstra sitron.',
    replaceSv: 'Servera med resten av koriandern och extra citron.',
  },
}

function insertFlax(list, grams, lang) {
  if (list.some(r => r.ingredient === 'flaxseed-ground')) return list
  const row = { ...flaxRow(lang), quantity: grams }
  // Insert before the last garnish-ish row (herb / avocado / potatoes-to-serve)
  const out = list.slice()
  const last = out.length - 1
  out.splice(last, 0, row)
  return out
}

function patchSteps(steps, fix, lang) {
  const key = lang === 'en' ? 'replaceEn' : lang === 'no' ? 'replaceNo' : 'replaceSv'
  const repl = fix[key]
  const neu = fix[lang]
  const i = steps.findIndex(s => s === repl || s.includes(repl))
  if (i < 0) throw new Error(`step not found (${lang}): ${repl}`)
  const out = steps.slice()
  out[i] = neu
  return out
}

function recomputeNutrition(recipe) {
  const est = estimateRecipe({ ingredients: recipe.ingredients })
  if (est.problems.length) throw new Error(`${recipe.id}: ${est.problems.join('; ')}`)
  const servings = recipe.servings
  const perServing = { ...(recipe.nutrition?.perServing || {}) }
  for (const [field, key] of Object.entries(PACK_KEY)) {
    perServing[key] = round(est.totals[field] / servings, field)
  }
  // micros from MICRO table
  const totals = Object.fromEntries(COLS.map(k => [k, 0]))
  for (const row of recipe.ingredients) {
    const { grams } = rowGrams(row)
    if (!grams) continue
    let v
    try { v = microPer100(row) } catch { continue }
    for (const k of COLS) totals[k] += v[k] * grams / 100
  }
  for (const k of COLS) {
    // keep sodium/potassium from estimate (PACK_KEY) when present; otherwise from micro
    if (k === 'omega3' || k === 'omega6' || k === 'monounsaturatedFat' || k === 'polyunsaturatedFat' ||
        k === 'calcium' || k === 'iron' || k === 'magnesium' || k === 'phosphorus' || k === 'zinc' ||
        k === 'copper' || k === 'manganese' || k === 'selenium' ||
        k === 'vitaminA' || k === 'vitaminC' || k === 'vitaminD' || k === 'vitaminE' || k === 'vitaminK' ||
        k === 'thiamin' || k === 'riboflavin' || k === 'niacin' || k === 'vitaminB6' || k === 'folate' ||
        k === 'vitaminB12' || k === 'choline') {
      perServing[k] = round(totals[k] / servings, k)
    }
  }
  // Prefer estimate omega when PACK_KEY has them
  if (est.totals.omega3 != null) perServing.omega3 = round(est.totals.omega3 / servings, 'omega3')
  if (est.totals.omega6 != null) perServing.omega6 = round(est.totals.omega6 / servings, 'omega6')

  const grams = Math.round(est.weight / servings)
  return { perServing, grams, kcal: Math.round(perServing.calories) }
}

const pack = JSON.parse(fs.readFileSync(PACK_FILE, 'utf8'))
const byId = new Map(pack.recipes.map(r => [r.id, r]))

// --- 1) pictures ---
for (const id of ['gazpacho', 'ratatouille']) {
  const r = byId.get(id)
  if (!r) throw new Error('missing ' + id)
  const url = toDataUrl(IMG[id])
  r.imageUrl = url
  console.log(`image ${id}: ${Math.round((url.length * 0.75) / 1024)} KB approx`)
}

// --- 2) flax ---
for (const [id, grams] of Object.entries(FLAX_G)) {
  const r = byId.get(id)
  if (!r) throw new Error('missing ' + id)
  const fix = FLAX_STEPS[id]
  r.ingredients = insertFlax(r.ingredients, grams, 'en')
  r.translations.no.ingredients = insertFlax(r.translations.no.ingredients, grams, 'no')
  r.translations.sv.ingredients = insertFlax(r.translations.sv.ingredients, grams, 'sv')
  r.steps = patchSteps(r.steps, fix, 'en')
  r.translations.no.steps = patchSteps(r.translations.no.steps, fix, 'no')
  r.translations.sv.steps = patchSteps(r.translations.sv.steps, fix, 'sv')

  const { perServing, grams: sw, kcal } = recomputeNutrition(r)
  r.nutrition = { ...(r.nutrition || {}), perServing }
  r.servingWeightGrams = sw
  r.kcal = kcal
  // update portion (~N g) if present
  const fixPortion = (p) => (typeof p === 'string' ? p.replace(/~\d+\s*g/, `~${sw} g`) : p)
  r.portion = fixPortion(r.portion)
  if (r.translations?.no) r.translations.no.portion = fixPortion(r.translations.no.portion)
  if (r.translations?.sv) r.translations.sv.portion = fixPortion(r.translations.sv.portion)

  const n = perServing
  const ratio = n.omega3 > 0 ? (n.omega6 / n.omega3) : Infinity
  console.log(`${id}: +${grams} g flaxseed-ground  → ${kcal} kcal, o3 ${n.omega3} o6 ${n.omega6} ratio ${ratio.toFixed(1)}:1, sw ${sw} g`)
}

// --- 3) labels for batch + flax recipes ---
const labelIds = [
  'chili-sin-carne', 'moroccan-chickpea-tagine', 'thai-red-curry', 'vegetarian-lapskaus',
  'mushroom-stroganoff', 'chana-masala', 'gazpacho', 'ratatouille',
]
const recipesById = new Map(pack.recipes.map(r => [r.id, r]))
for (const id of labelIds) {
  const r = byId.get(id)
  const a = analyzeRecipe(r, recipesById, { storedMealTypes: true })
  const tags = withLabels(r.tags || [], a.proposed)
  r.tags = tags
  const batch = tags.includes('batch-friendly')
  console.log(`labels ${id}: batch-friendly=${batch}; health=${LABELS.filter(l => a.labels[l].pass && ['weight-loss','blood-pressure-friendly','diabetes-friendly','heart-healthy'].includes(l)).join(',')}`)
}

// bump version once
const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK_FILE, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log(`Pack -> ${pack.version}`)

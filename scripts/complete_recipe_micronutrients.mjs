// One-off: completes the nutrition of the recipes that only carry the basic
// fields (calories, macros, sugars, sodium, potassium) — no fat split,
// omega-3/6, minerals or vitamins. Same method as
// scripts/complete_breakfast_micronutrients.mjs: the ingredient rows' gram
// weights (rowGrams) times the per-100 g values in scripts/lib/micronutrients.mjs,
// divided by servings.
//
// Only missing fields are added: existing calories, macros, sugars, sodium
// and potassium stay (check-recipes and the labels use them). The script
// recalculates the basic fields too and lists any that differ from the
// stored value by more than 15 % — for review, not written.
//
// Strained broths (BROTHS) keep only part of what goes into the pot: their
// added values are scaled by stored kcal / ingredient kcal.
//
// Usage: node scripts/complete_recipe_micronutrients.mjs [--dry-run]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rowGrams, estimateRecipe, PACK_KEY } from './lib/recipeNutritionEstimate.mjs'
import { COLS, microPer100 } from './lib/micronutrients.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_DIR = path.join(ROOT, 'recipe-packs-template/packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const DRY = process.argv.includes('--dry-run')

// Ingredient ids that are recipes in a pack: per 100 g of the finished batch.
const COMPOSITE = { 'white-cashew-sauce': 'fr-191', 'classic-hummus': 'classic-hummus', 'cashew-sour-cream': 'fr-33' }
const BROTHS = new Set(['fmd-broth'])

const ORDER = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'polyunsaturatedFat', 'monounsaturatedFat', 'omega3', 'omega6',
  'cholesterol', 'totalCarbs', 'totalSugars', 'addedSugar', 'fiber',
  'calcium', 'potassium', 'copper', 'iron', 'magnesium', 'manganese', 'selenium', 'phosphorus', 'zinc', 'sodium',
  'vitaminA', 'vitaminB6', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'folate', 'thiamin', 'riboflavin', 'niacin', 'choline',
]

const packs = Object.fromEntries(PACKS.map(f => [f, JSON.parse(fs.readFileSync(path.join(PACK_DIR, f), 'utf8'))]))
const byId = new Map(Object.values(packs).flatMap(p => p.recipes.map(r => [r.id, r])))

function batchTotals(recipe) {
  const totals = Object.fromEntries(COLS.map(k => [k, 0]))
  for (const row of recipe.ingredients) {
    const { grams } = rowGrams(row)
    if (!grams) continue
    const v = per100(row)
    for (const k of COLS) totals[k] += v[k] * grams / 100
  }
  return totals
}

function per100(row) {
  const src = COMPOSITE[row.ingredient]
  if (!src) return microPer100(row)
  // The pack's own recipe, per 100 g of its finished weight.
  const r = byId.get(src)
  const t = batchTotals(r)
  const f = 100 / (r.servings * r.servingWeightGrams)
  return Object.fromEntries(COLS.map(k => [k, t[k] * f]))
}

// As scripts/nutrition/calculate.mjs: whole numbers from 10, one decimal
// from 1, two below.
function round(x) {
  if (!x) return 0
  if (Math.abs(x) >= 10) return Math.round(x)
  if (Math.abs(x) >= 1) return Math.round(x * 10) / 10
  return Math.round(x * 100) / 100
}

const discrepancies = []
const changedPacks = new Set()
let changed = 0
for (const [file, pack] of Object.entries(packs)) {
  for (const r of pack.recipes) {
    const ps = r.nutrition?.perServing
    if (!ps || ps.omega3 != null || ps.vitaminB12 != null) continue

    // The basic fields, recalculated: fill missing ones, report big gaps.
    const est = estimateRecipe(r)
    if (est.problems.length) throw new Error(`${r.id}: ${est.problems.join('; ')}`)
    const core = Object.fromEntries(Object.entries(PACK_KEY).map(([t, k]) => [k, est.totals[t] / r.servings]))
    const scale = BROTHS.has(r.id) ? Math.min(1, ps.calories / core.calories) : 1
    for (const k of ['calories', 'protein', 'totalFat', 'totalCarbs', 'fiber', 'sodium', 'potassium']) {
      if (ps[k] == null || BROTHS.has(r.id)) continue
      const calc = core[k], stored = ps[k]
      const big = Math.max(Math.abs(calc), Math.abs(stored))
      // Ignore tiny absolute amounts (under 1 g / 20 kcal / 50 mg).
      const floor = k === 'calories' ? 20 : (k === 'sodium' || k === 'potassium') ? 50 : 1
      if (big >= floor && Math.abs(calc - stored) / big > 0.15) {
        discrepancies.push(`${r.id} ${k}: stored ${stored}, calculated ${round(calc)}`)
      }
    }

    const t = batchTotals(r)
    const add = { cholesterol: 0 }
    for (const k of COLS) add[k] = t[k] / r.servings * scale
    for (const k of ['saturatedFat', 'sodium', 'potassium']) add[k] = core[k] * scale

    // The fat split comes from other tables than totalFat: keep it inside it.
    const satFat = ps.saturatedFat ?? add.saturatedFat
    const room = Math.max(0, ps.totalFat - satFat)
    const split = add.monounsaturatedFat + add.polyunsaturatedFat
    if (split > room) {
      const f = room / split
      for (const k of ['monounsaturatedFat', 'polyunsaturatedFat', 'omega3', 'omega6']) add[k] *= f
    }

    const next = {}
    for (const k of ORDER) {
      if (ps[k] != null) next[k] = ps[k]
      else if (k in add) next[k] = k === 'sodium' || k === 'potassium' ? Math.round(add[k]) : round(add[k])
      else throw new Error(`${r.id}: nothing for ${k}`)
    }
    for (const k of Object.keys(ps)) if (!(k in next)) next[k] = ps[k]
    r.nutrition.perServing = next
    changed++
    changedPacks.add(file)
    const ratio = next.omega3 > 0 ? (next.omega6 / next.omega3).toFixed(1) : '–'
    console.log(`${r.id}: n6/n3 ${next.omega6}/${next.omega3} g (${ratio}:1) · Ca ${next.calcium} · Fe ${next.iron} · Mg ${next.magnesium} · Zn ${next.zinc} · A ${next.vitaminA} · C ${next.vitaminC} · K ${next.vitaminK} · folate ${next.folate} · B12 ${next.vitaminB12}${scale < 1 ? ` · broth ×${scale.toFixed(2)}` : ''}`)
  }
}

console.log(`\n${changed} recipes completed.`)
if (discrepancies.length) {
  console.log(`\nStored vs calculated, > 15 % apart (not changed):`)
  for (const d of discrepancies) console.log('  ' + d)
}

if (!changed) {
  console.log('Nothing to add.')
} else if (DRY) {
  console.log('[dry-run] not written')
} else {
  for (const file of changedPacks) {
    const pack = packs[file]
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
    pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
    fs.writeFileSync(path.join(PACK_DIR, file), JSON.stringify(pack, null, 2) + '\n', 'utf8')
    console.log(`${file} -> ${pack.version}`)
  }
}

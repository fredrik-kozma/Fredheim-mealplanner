// One-off: omega-6 for the recipes that carry omega-3 but no omega-6, with
// their omega-3 recalculated the same way so the pair is consistent. Same
// method as scripts/complete_recipe_micronutrients.mjs: the rows' gram weights
// (rowGrams) times per-100 g values, over servings. The ingredients that
// script never needed have their pair in OMEGA_ONLY (scripts/lib/micronutrients.mjs).
//
// Only omega3 and omega6 are written. The pair is kept inside the stored fat
// (totalFat less saturates), as the other script does; recipes where that cut
// the pair are listed, since their stored fat disagrees with their rows. Any
// omega-3 change over 25 % is listed too, and everything goes to
// scripts/data/omega-proposals.md.
//
// Usage: node scripts/complete_recipe_omega6.mjs [--dry-run]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rowGrams } from './lib/recipeNutritionEstimate.mjs'
import { omegaPer100 } from './lib/micronutrients.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACK_DIR = path.join(ROOT, 'recipe-packs-template/packs')
const PACKS = ['fredheim-recipes-with-pictures.json', 'fredheim-reversal-protocol.json', 'fredheim-fmd-5day.json']
const DRY = process.argv.includes('--dry-run')

// Ingredient ids that are recipes in a pack: per 100 g of the finished batch.
const COMPOSITE = { 'white-cashew-sauce': 'fr-191', 'classic-hummus': 'classic-hummus', 'cashew-sour-cream': 'fr-33' }
// A strained broth keeps only part of what goes into the pot.
const BROTHS = new Set(['fmd-broth'])

const packs = Object.fromEntries(PACKS.map(f => [f, JSON.parse(fs.readFileSync(path.join(PACK_DIR, f), 'utf8'))]))
const byId = new Map(Object.values(packs).flatMap(p => p.recipes.map(r => [r.id, r])))

function batchOmega(recipe) {
  let omega3 = 0
  let omega6 = 0
  for (const row of recipe.ingredients) {
    const { grams } = rowGrams(row)
    if (!grams) continue
    const v = per100(row)
    omega3 += v.omega3 * grams / 100
    omega6 += v.omega6 * grams / 100
  }
  return { omega3, omega6 }
}

function per100(row) {
  const src = COMPOSITE[row.ingredient]
  if (!src) return omegaPer100(row)
  const r = byId.get(src)
  const t = batchOmega(r)
  const f = 100 / (r.servings * r.servingWeightGrams)
  return { omega3: t.omega3 * f, omega6: t.omega6 * f }
}

function round(x) {
  if (!x) return 0
  if (Math.abs(x) >= 10) return Math.round(x)
  if (Math.abs(x) >= 1) return Math.round(x * 10) / 10
  return Math.round(x * 100) / 100
}

const changedPacks = new Set()
const big3 = []
const trimmed = []
const lines = []
for (const [file, pack] of Object.entries(packs)) {
  for (const r of pack.recipes) {
    const ps = r.nutrition?.perServing
    if (!ps || ps.omega3 == null || ps.omega6 != null) continue
    const t = batchOmega(r)
    let o3 = t.omega3 / r.servings
    let o6 = t.omega6 / r.servings
    const room = Math.max(0, (Number(ps.totalFat) || 0) - (Number(ps.saturatedFat) || 0))
    if (o3 + o6 > room) {
      const f = room / (o3 + o6)
      if (f < 0.75 && o3 + o6 >= 0.2) trimmed.push(`${r.id} (${r.title}): rows give ${(o3 + o6).toFixed(2)} g omega, stored fat ${ps.totalFat} g (sat ${ps.saturatedFat})`)
      o3 *= f
      o6 *= f
    }
    const old3 = ps.omega3
    const next3 = round(o3)
    const next6 = round(o6)
    if (Math.max(old3, next3) >= 0.05 && Math.abs(next3 - old3) / Math.max(old3, next3) > 0.25) {
      big3.push(`${r.id} (${r.title}): ${old3} → ${next3} g`)
    }
    const next = {}
    for (const [k, v] of Object.entries(ps)) {
      next[k] = k === 'omega3' ? next3 : v
      if (k === 'omega3') next.omega6 = next6
    }
    r.nutrition.perServing = next
    changedPacks.add(file)
    const ratio = next3 > 0 ? `${(next6 / next3).toFixed(1)}:1` : '–'
    lines.push(`| ${r.title} (\`${r.id}\`) | ${old3} | ${next3} | ${next6} | ${ratio} |`)
  }
}

console.log(`${lines.length} recipes.`)
console.log(`\nOmega-3 changed by more than 25 % (${big3.length}):`)
for (const l of big3) console.log('  ' + l)
console.log(`\nCut to fit the stored fat by more than 25 % (${trimmed.length}):`)
for (const l of trimmed) console.log('  ' + l)

if (!lines.length) {
  console.log('Nothing to add.')
} else if (DRY) {
  console.log('[dry-run] not written')
} else {
  const md = [
    '# Omega-6 and omega-3 from the ingredient rows',
    '',
    'Written by `scripts/complete_recipe_omega6.mjs`. Grams per serving.',
    '',
    `## Omega-3 changed by more than 25 % (${big3.length})`,
    '',
    ...big3.map(l => `- ${l}`),
    '',
    `## Cut to fit the stored fat by more than 25 % (${trimmed.length})`,
    '',
    'The stored fat is lower than the rows give; only the omega pair was held to it.',
    '',
    ...trimmed.map(l => `- ${l}`),
    '',
    '## All recipes',
    '',
    '| Recipe | Omega-3 before | Omega-3 | Omega-6 | Ratio |',
    '|---|---|---|---|---|',
    ...lines,
    '',
  ].join('\n')
  fs.writeFileSync(path.join(ROOT, 'scripts/data/omega-proposals.md'), md, 'utf8')
  for (const file of changedPacks) {
    const pack = packs[file]
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
    pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
    fs.writeFileSync(path.join(PACK_DIR, file), JSON.stringify(pack, null, 2) + '\n', 'utf8')
    console.log(`${file} -> ${pack.version}`)
  }
}

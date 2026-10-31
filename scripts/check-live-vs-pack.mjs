#!/usr/bin/env node
/**
 * Compare live nutritionEngine vs pack nutrition.perServing for every recipe.
 * Exit 1 if any recipe exceeds tolerance (unless --report-only).
 *
 *   node scripts/check-live-vs-pack.mjs
 *   node scripts/check-live-vs-pack.mjs --report-only
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PHASE_B = path.resolve(HERE, '..')
const REPORT_ONLY = process.argv.includes('--report-only')

function findRoot() {
  for (const c of [
    process.cwd(),
    path.resolve(HERE, '../..'),
    path.join(PHASE_B, 'sandbox'),
    path.resolve(PHASE_B, '../menu-planner/sv-translations'),
  ]) {
    if (fs.existsSync(path.join(c, 'recipe-packs-template/packs'))) return c
  }
  throw new Error('project root with packs not found')
}

const ROOT = findRoot()
const { estimateRecipeNutrition, diffAgainstPack } = await import(
  pathToFileURL(path.join(PHASE_B, 'src/utils/nutritionEngine.js')).href
)

function loadDb() {
  const candidates = [
    path.join(ROOT, 'src/data/nutritionDb.json'),
    path.join(PHASE_B, 'src/data/nutritionDb.json'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return JSON.parse(fs.readFileSync(c, 'utf8'))
  }
  throw new Error('nutritionDb.json not found — run build-nutrition-db.mjs first')
}

const db = loadDb()
const packDir = path.join(ROOT, 'recipe-packs-template/packs')
const packs = fs.readdirSync(packDir).filter(f => f.endsWith('.json') && f.startsWith('fredheim'))
const recipeById = new Map()
for (const f of packs) {
  const p = JSON.parse(fs.readFileSync(path.join(packDir, f), 'utf8'))
  for (const r of p.recipes || []) recipeById.set(r.id, r)
}

const results = []
let ok = 0, fail = 0, skipped = 0
for (const f of packs) {
  const p = JSON.parse(fs.readFileSync(path.join(packDir, f), 'utf8'))
  for (const r of p.recipes || []) {
    if (!r.nutrition?.perServing) { skipped++; continue }
    const live = estimateRecipeNutrition(r, db, {
      saltLevel: 'low',
      recipeById: Object.fromEntries(recipeById),
    })
    const cmp = diffAgainstPack(live.perServing, r.nutrition.perServing)
    if (cmp.ok) ok++
    else {
      fail++
      results.push({
        id: r.id,
        title: r.title,
        pack: f,
        diffs: cmp.diffs,
        warnings: live.warnings.slice(0, 5),
        liveKcal: live.perServing.calories,
        packKcal: r.nutrition.perServing.calories,
      })
    }
  }
}

results.sort((a, b) => (b.diffs[0]?.rel || 0) - (a.diffs[0]?.rel || 0))
const summary = { ok, fail, skipped, total: ok + fail + skipped, worst: results.slice(0, 20) }
console.log(JSON.stringify({ ok, fail, skipped, total: summary.total }, null, 2))
if (results.length) {
  console.log('\nWorst mismatches:')
  for (const r of results.slice(0, 15)) {
    console.log(`- ${r.id} ${r.title}: live ${r.liveKcal} vs pack ${r.packKcal} | ${r.diffs.map(d => `${d.key} ${d.pack}→${d.live} (${Math.round(d.rel*100)}%)`).join(', ')}`)
    if (r.warnings.length) console.log(`  warnings: ${r.warnings.join('; ')}`)
  }
}
fs.writeFileSync(path.join(PHASE_B, 'live-vs-pack-report.json'), JSON.stringify(summary, null, 2))
if (fail && !REPORT_ONLY) process.exit(1)

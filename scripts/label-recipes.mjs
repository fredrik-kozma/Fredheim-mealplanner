#!/usr/bin/env node
/*
 * Nutrition, meal types and good-for labels for one or more recipes, by the
 * same criteria as the label report (scripts/lib/recipeLabels.mjs) and
 * check-recipes. For adding a recipe (CLAUDE.md, "Recipe rules"): run it
 * after the add_*.cjs script, fix what it reports, then --write.
 *
 * Per recipe it prints:
 *   - servings, serving weight and portion text (en/no/sv)
 *   - per-serving nutrition: stored vs calculated from the ingredients
 *     (scripts/data/food-composition-core.json), with any disagreement
 *   - prep/cook time, stored or read from the method
 *   - meal types: stored vs suggested
 *   - every good-for label, pass or fail, with its reason
 *   - oil in the ingredients or method (the packs prefer oil-free methods)
 *   - whatever check-recipes would flag
 *
 * --write puts into the pack, for the selected recipes only:
 *   - the computed good-for label tags (other tags kept)
 *   - mealTypes, if missing (the suggestion)
 *   - nutrition.perServing core values and `kcal`, if missing (the
 *     ingredient calculation)
 * It does not bump the pack version (the add script does) and never
 * overwrites stored nutrition: a disagreement is for a human to settle.
 *
 * Usage:
 *   npm run label-recipes -- --recipe a,b [--write]
 *   npm run label-recipes -- --new-since 2026-10-29 [--write]
 */
import fs from 'node:fs'
import path from 'node:path'
import { loadPacks, META_PACK_IDS } from './check-recipes.mjs'
import { analyzeRecipe, recipeMetaProblems, withLabels, LABELS, r1 } from './lib/recipeLabels.mjs'

const argv = process.argv.slice(2)
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const write = argv.includes('--write')
const ids = opt('--recipe')?.split(',').map((s) => s.trim()).filter(Boolean)
const since = opt('--new-since') !== undefined ? (/^\d+$/.test(opt('--new-since')) ? Number(opt('--new-since')) : Date.parse(opt('--new-since'))) : null
if (!ids && since === null) {
  console.error('label-recipes: name the recipes: --recipe a,b  or  --new-since <date>')
  process.exit(1)
}

const packs = loadPacks().filter((p) => META_PACK_IDS.includes(p.id))
const recipesById = new Map(packs.flatMap((p) => p.recipes.map((r) => [r.id, r])))
const created = (r) => (typeof r.createdAt === 'number' ? r.createdAt : Date.parse(r.createdAt) || 0)
const selected = (r) => (ids ? ids.includes(r.id) : created(r) >= since)

const panel = (n) => n
  ? `${Math.round(n.calories)} kcal · protein ${r1(n.protein)} g · fat ${r1(n.totalFat)} g (sat ${r1(n.saturatedFat)}) · carbs ${r1(n.totalCarbs)} g · fibre ${r1(n.fiber)} g · sugars ${r1(n.totalSugars)} g (added ${r1(n.addedSugar)}) · sodium ${Math.round(n.sodium)} mg · potassium ${Math.round(n.potassium)} mg`
  : '—'

let found = 0
let problems = 0
const touched = new Set()
for (const pack of packs) {
  for (const r of pack.recipes) {
    if (!selected(r)) continue
    found++
    const a = analyzeRecipe(r, recipesById, { storedMealTypes: true })
    const { nut, time, mt, facts, labels, proposed } = a
    console.log(`\n${r.id}  "${r.title}"  (${pack.id})`)
    console.log(`  servings ${r.servings} · serving ${r.servingWeightGrams ?? '—'} g · portion: ${r.portion || '—'} | no: ${r.translations?.no?.portion || '—'} | sv: ${r.translations?.sv?.portion || '—'}`)
    console.log(`  nutrition stored:     ${panel(r.nutrition?.perServing)}`)
    console.log(`  from ingredients:     ${panel(nut.estimate)}${nut.ratioKcal != null ? `  (stored/calculated kcal ${nut.ratioKcal})` : ''}`)
    if (nut.flags.length) console.log(`  ! disagrees: ${nut.flags.join('; ')}`)
    if (nut.estimateProblems?.length) console.log(`  ! not in the composition table: ${nut.estimateProblems.join('; ')}`)
    if (nut.yieldNotes?.length) console.log(`  note: ${nut.yieldNotes.join('; ')}`)
    const tp = time.proposed
    console.log(`  time: prep ${r.prepTime ?? '—'} / cook ${r.cookTime ?? '—'} min${tp ? `  (from the method: ${tp.prepTime}/${tp.cookTime}, ${time.evidence})` : ''}`)
    const same = JSON.stringify(r.mealTypes || []) === JSON.stringify(mt.mealTypes)
    console.log(`  meal types: ${(r.mealTypes || []).join(', ') || '—'}${same ? '' : `  (suggested: ${mt.mealTypes.join(', ')}, ${mt.basis})`}`)
    console.log('  labels:')
    for (const l of LABELS) console.log(`    ${labels[l].pass ? '✓' : '·'} ${l}: ${labels[l].why}`)
    if (facts.oil.length || facts.methodOil) {
      console.log(`  oil: ${facts.oil.length ? facts.oil.join(', ') : 'in the method'}: the packs prefer oil-free methods (water or broth sauté, bake on parchment) and diabetes-friendly/heart-healthy need it`)
    }

    if (write) {
      const tags = withLabels(r.tags || [], proposed)
      if (JSON.stringify(tags) !== JSON.stringify(r.tags || [])) { r.tags = tags; touched.add(pack) }
      if (!r.mealTypes?.length) { r.mealTypes = mt.mealTypes; touched.add(pack) }
      if (!r.nutrition?.perServing && !nut.estimateProblems?.length && nut.status !== 'not-eaten') {
        r.nutrition = { ...(r.nutrition || {}), perServing: { ...nut.estimate } }
        touched.add(pack)
      }
      if (r.nutrition?.perServing && r.kcal !== Math.round(r.nutrition.perServing.calories)) { r.kcal = Math.round(r.nutrition.perServing.calories); touched.add(pack) }
    }
    const left = recipeMetaProblems(r, analyzeRecipe(r, recipesById, { storedMealTypes: true }))
    problems += left.length
    for (const p of left) console.log(`  ✗ ${p.code}: ${p.message}`)
    if (!left.length) console.log('  ✓ complete: check-recipes has nothing to add')
  }
}

for (const pack of touched) {
  const { file, ...data } = pack
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`\nwrote ${path.basename(file)} (version ${data.version}: bump it if this is a new change)`)
}
if (!found) { console.error('label-recipes: no recipe matches.'); process.exit(1) }
process.exitCode = problems ? 1 : 0

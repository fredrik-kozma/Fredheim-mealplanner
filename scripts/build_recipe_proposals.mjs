// Recipe-completion proposals for the three built-in packs (Fredheim Kitchen,
// Reversal, FMD). PROPOSE ONLY: this reads the packs and writes
//   scripts/data/recipe-completion-proposals.json
//   scripts/data/recipe-completion-proposals.md
// and never touches recipe JSON; scripts/apply_recipe_proposals.mjs applies
// the JSON to the packs.
//
// What it proposes, per recipe:
//   nutrition  - recalculated core values where the stored ones are missing
//                or implausible (cross-checked against an independent
//                ingredient-based estimate, scripts/lib/recipeNutritionEstimate.mjs)
//   servings   - realistic servings for whole batches stored as one serving
//   time       - prep/cook minutes where missing, read from the method
//   mealTypes  - breakfast/lunch/dinner/snack/side/dessert/component
//   labels     - the fixed good-for set, by the explicit CRITERIA below
//
// Usage: node scripts/build_recipe_proposals.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LABELS, HEALTH, CRITERIA, SERVINGS, STRAINED, r1, stepText, analyzeRecipe,
} from './lib/recipeLabels.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKS = [
  { file: 'fredheim-recipes-with-pictures.json', short: 'Fredheim Kitchen' },
  { file: 'fredheim-reversal-protocol.json', short: 'Reversal' },
  { file: 'fredheim-fmd-5day.json', short: 'FMD' },
]
// --out-dir <dir> writes the two files elsewhere (to compare a run without
// touching the approved copies).
const outArg = process.argv.indexOf('--out-dir')
const OUT_DIR = outArg > 0 ? path.resolve(process.argv[outArg + 1]) : path.join(ROOT, 'scripts/data')
const OUT_JSON = path.join(OUT_DIR, 'recipe-completion-proposals.json')
const OUT_MD = path.join(OUT_DIR, 'recipe-completion-proposals.md')
const CONDITION_OVERRIDES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/condition_overrides.json'), 'utf8'))

// Settled by the doctor (2026-10-28); kept here so the .md records them.
const DECISIONS = [
  'Dates and date paste do NOT count as added sugar: allowed under "no-added-sugar" (WHO definition); {{DATE_COUNT}} recipes keep the label on dates.',
  'Oat drink sugars (~4 g/100 ml, enzymatic maltose) DO count as added sugar: oat drink is a free-sugar ingredient for no-added-sugar, weight-loss and diabetes-friendly, and its sugars are added to addedSugar (stored panels corrected), which the heart and blood-pressure checks read.',
  'Diabetes-friendly must also be oil-free.',
  'Canned beans and broth stay as written; labels keep the conservative sodium assumption (ordinary salted products unless the row says otherwise).',
  'Bread serving = 2 slices (sliced loaves); granola serving = 50 g. The planner scales the shopping list by servings, so a planned "serving" now buys 2 slices\' worth.',
]

// ── run ─────────────────────────────────────────────────────────────────────
const packs = PACKS.map(p => ({ ...p, data: JSON.parse(fs.readFileSync(path.join(ROOT, 'recipe-packs-template/packs', p.file), 'utf8')) }))
const recipesById = new Map(packs.flatMap(p => p.data.recipes.map(r => [r.id, r])))
const results = []
for (const p of packs) {
  for (const original of p.data.recipes) {
    const { recipe: r, ingredientFix, nut, time, mt, facts, labels, proposed } = analyzeRecipe(original, recipesById)
    const existing = (r.tags || []).filter(t => LABELS.includes(t))
    const sp = SERVINGS[r.id]
    results.push({
      pack: p.short, packId: p.data.id, id: r.id, title: r.title, category: r.category,
      ingredientFix,
      // Oil the method uses but the ingredient list (and so the nutrition) leaves out.
      oilInMethodOnly: facts.methodOil && !facts.oil.length
        ? (/(?:\{\{[^}]+\}\}|\d+\s*(?:tsp|tbsp))\s*(?:of\s+)?(?:olive\s+)?oil/i.test(stepText(r)) ? 'amount' : 'mention')
        : null,
      servings: sp ? { current: r.servings, proposed: sp.keepCount ? r.servings : sp.servings, portion: sp.portion, servingWeightGrams: { current: r.servingWeightGrams ?? null, proposed: sp.sw }, basis: sp.basis, confidence: /uncertain/.test(sp.basis) ? 'low' : 'medium' } : null,
      nutrition: (({ _final, _conservativeNa, _regularNa, ...rest }) => rest)(nut),
      time,
      mealTypes: mt,
      labels: {
        existing, proposed,
        added: proposed.filter(l => !existing.includes(l)),
        removed: existing.filter(l => !proposed.includes(l)),
        reasons: Object.fromEntries(LABELS.map(l => [l, labels[l]])),
        otherTags: (r.tags || []).filter(t => !LABELS.includes(t) && t !== 'fredheim'),
        humanNote: CONDITION_OVERRIDES[r.id]?.note || null,
      },
    })
  }
}

// ── summary ─────────────────────────────────────────────────────────────────
const count = fn => results.filter(fn).length
const nutChanged = results.filter(x => x.nutrition.proposed)
const biggest = nutChanged.filter(x => x.nutrition.current && x.nutrition.proposed.calories != null)
  .map(x => ({ x, delta: x.nutrition.proposed.calories - x.nutrition.current.calories }))
  .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 15)
const labelCounts = Object.fromEntries(LABELS.map(l => [l, {
  existing: count(x => x.labels.existing.includes(l)), proposed: count(x => x.labels.proposed.includes(l)),
  added: count(x => x.labels.added.includes(l)), removed: count(x => x.labels.removed.includes(l)),
}]))
const summary = {
  recipes: results.length,
  perPack: Object.fromEntries(PACKS.map(p => [p.short, count(x => x.pack === p.short)])),
  nutrition: {
    recalculated: count(x => x.nutrition.change === 'recalculated'),
    corrected: count(x => /corrected/.test(x.nutrition.change || '')),
    rescaledOnly: count(x => x.nutrition.change === 'rescaled'),
    missingOrPlaceholder: count(x => ['missing', 'placeholder'].includes(x.nutrition.status)),
    implausible: count(x => x.nutrition.status === 'implausible'),
    agreeWithin25pct: count(x => x.nutrition.ratioKcal != null && x.nutrition.ratioKcal >= 0.8 && x.nutrition.ratioKcal <= 1.25),
  },
  servings: count(x => x.servings && x.servings.proposed !== x.servings.current),
  servingWeightOnly: count(x => x.servings && x.servings.proposed === x.servings.current),
  time: count(x => x.time.proposed),
  mealTypes: results.length,
  labels: labelCounts,
  recipesWithLabelChanges: count(x => x.labels.added.length || x.labels.removed.length),
  recipesWithHealthLabelChanges: count(x => [...x.labels.added, ...x.labels.removed].some(l => HEALTH.includes(l))),
  ingredientFixes: results.filter(x => x.ingredientFix).map(x => x.id),
  // Not fixed (doctor: do not add the oil); listed for a human to decide.
  oilInMethodNotListed: {
    statedAmount: results.filter(x => x.oilInMethodOnly === 'amount').map(x => x.id),
    unquantified: results.filter(x => x.oilInMethodOnly === 'mention').map(x => x.id),
  },
  fryingOilNotListed: results.filter(x => (x.nutrition.yieldNotes || []).some(n => n.startsWith('method fries'))).map(x => x.id),
}
const dateSweetened = count(x => x.labels.proposed.includes('no-added-sugar') && /sweetened with/.test(x.labels.reasons['no-added-sugar'].why))
for (let i = 0; i < DECISIONS.length; i++) DECISIONS[i] = DECISIONS[i].replace('{{DATE_COUNT}}', String(dateSweetened))
// Errors at the current serving count (not caused by re-portioning).
const worstErrors = results.filter(x => x.nutrition.change === 'recalculated' && x.nutrition.current && x.nutrition.ratioKcal != null)
  .map(x => {
    const ratio = x.nutrition.current.calories / Math.max(1, x.nutrition.estimate.calories)
    return { x, factor: Math.max(ratio, 1 / ratio) }
  })
  .sort((a, b) => b.factor - a.factor).slice(0, 15)

const json = {
  generated: new Date().toISOString().slice(0, 10),
  generator: 'scripts/build_recipe_proposals.mjs',
  status: 'PROPOSAL - applied to the packs by scripts/apply_recipe_proposals.mjs',
  packVersions: Object.fromEntries(packs.map(p => [p.data.id, p.data.version])),
  method: {
    estimate: 'Independent per-recipe estimate from ingredient rows using scripts/data/food-composition-core.json (per 100 g, USDA FoodData Central/SR Legacy; EU label values for branded-type products). Spoon and piece weights from the dictionary spoonGrams or the table.',
    implausible: 'kcal off by more than 25%/33% (ratio < 0.75 or > 1.33) and ≥ 30 kcal; or energy density > 900 kcal/100 g; or sodium off ≥ 300 mg and more than 2×; or added sugar off ≥ 5 g. Strained recipes (broths, nut/oat milks) are exempt.',
    proposedFields: 'Core fields only for recalculations (calories, protein, totalFat, saturatedFat, totalCarbs, fiber, totalSugars, addedSugar, sodium, potassium). Rescaled recipes scale every stored field.',
    confidence: 'high = stored values confirmed by the estimate, only the serving count changes; medium = recalculated from fully specified ingredients; low = brand/sub-recipe dependent, unquantified rows, frying fat not listed, or uncertain yield.',
  },
  criteria: CRITERIA,
  decisionsNeeded: DECISIONS,
  summary,
  biggestErrorsAtCurrentServings: worstErrors.map(({ x, factor }) => ({ id: x.id, title: x.title, pack: x.pack, storedKcal: x.nutrition.current.calories, estimateKcal: x.nutrition.estimate.calories, factor: r1(factor) })),
  biggestNutritionChanges: biggest.map(({ x, delta }) => ({ id: x.id, title: x.title, pack: x.pack, currentKcal: x.nutrition.current.calories, proposedKcal: x.nutrition.proposed.calories, delta: Math.round(delta), servings: x.servings ? `${x.servings.current} → ${x.servings.proposed}` : null, confidence: x.nutrition.confidence })),
  recipes: results,
}
fs.writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + '\n', 'utf8')

// ── markdown ────────────────────────────────────────────────────────────────
const L = []
const esc = s => String(s ?? '').replace(/\|/g, '\\|')
const kc = v => v == null ? '—' : Math.round(v)
const short = { 'weight-loss': 'WL', 'blood-pressure-friendly': 'BP', 'diabetes-friendly': 'DIA', 'heart-healthy': 'HRT', 'gluten-free': 'GF', 'nut-free': 'NUT0', 'soy-free': 'SOY0', 'oil-free': 'OIL0', 'no-added-sugar': 'NAS', 'quick': 'Q', 'batch-friendly': 'BATCH', 'kid-friendly': 'KID' }
const tagList = a => a.length ? a.map(l => short[l]).join(' ') : '—'
L.push('# Recipe completion proposals', '')
L.push(`Generated ${json.generated} by \`${json.generator}\` from pack versions ${Object.entries(json.packVersions).map(([k, v]) => `${k} ${v}`).join(', ')}. Applied with \`scripts/apply_recipe_proposals.mjs\`, which only accepts packs at exactly these versions. Machine-readable copy: \`recipe-completion-proposals.json\`.`, '')
L.push('## Summary', '')
L.push('| Change type | Recipes |', '|---|---|')
L.push(`| Nutrition recalculated from ingredients (missing, placeholder or implausible kcal) | ${summary.nutrition.recalculated} |`)
L.push(`| Nutrition: single fields corrected (sodium / added sugar off, kcal fine) | ${summary.nutrition.corrected} |`)
L.push(`| Nutrition rescaled only (stored values fine, serving count changes) | ${summary.nutrition.rescaledOnly} |`)
L.push(`| Stored kcal confirmed by the ingredient estimate (within −20%/+25%) | ${summary.nutrition.agreeWithin25pct} of ${summary.recipes} |`)
L.push(`| Servings changed (whole batches, oversized portions) | ${summary.servings} |`)
L.push(`| Serving weight corrected, count kept | ${summary.servingWeightOnly} |`)
L.push(`| Prep/cook time proposed (missing) | ${summary.time} |`)
L.push(`| Meal types proposed (field does not exist yet) | ${summary.mealTypes} |`)
L.push(`| Recipes whose good-for labels change (any label; most only gain nut-free/soy-free/quick/batch/kid labels, which do not exist yet) | ${summary.recipesWithLabelChanges} |`)
L.push(`| Recipes whose health labels change (WL/BP/DIA/HRT) | ${summary.recipesWithHealthLabelChanges} |`, '')
L.push(`Packs: ${Object.entries(summary.perPack).map(([k, v]) => `${k} ${v}`).join(', ')}.`, '')
L.push('### Labels: existing vs proposed (recipe counts)', '')
L.push('| Label | Code | Existing | Proposed | Added | Removed |', '|---|---|---|---|---|---|')
for (const l of LABELS) L.push(`| ${l} | ${short[l]} | ${labelCounts[l].existing} | ${labelCounts[l].proposed} | ${labelCounts[l].added} | ${labelCounts[l].removed} |`)
L.push('')
L.push('### Biggest nutrition changes (kcal per serving)', '')
L.push('| Recipe | Pack | Current | Proposed | Δ | Servings | Confidence |', '|---|---|---|---|---|---|---|')
for (const b of json.biggestNutritionChanges) L.push(`| ${esc(b.title)} (\`${b.id}\`) | ${b.pack} | ${kc(b.currentKcal)} | ${kc(b.proposedKcal)} | ${b.delta > 0 ? '+' : ''}${b.delta} | ${b.servings || 'same'} | ${b.confidence} |`)
L.push('', 'Most of these are whole batches being split into real portions. The table below shows the stored values that are wrong at the *current* serving count (stored kcal vs the ingredient estimate):', '')
L.push('| Recipe | Pack | Stored kcal/serving | Ingredients say | Off by | Confidence |', '|---|---|---|---|---|---|')
for (const { x, factor } of worstErrors) L.push(`| ${esc(x.title)} (\`${x.id}\`) | ${x.pack} | ${kc(x.nutrition.current.calories)} | ${kc(x.nutrition.estimate.calories)} | ${r1(factor)}× ${x.nutrition.ratioKcal > 1 ? 'too high' : 'too low'} | ${x.nutrition.confidence} |`)
L.push('')
L.push('## Label criteria (for approval)', '')
L.push('"Meal" = meal types include breakfast, lunch or dinner. "Other" = side, snack, dessert or component only. All values per serving unless stated. The four health labels are only proposed when the nutrition behind them is at medium or high confidence; otherwise the reason says "too uncertain". Health labels are computed from the proposed values where a change is proposed, else from the stored values.', '')
for (const l of LABELS) L.push(`- **${l}** (${short[l]}): ${CRITERIA[l]}`)
L.push('', '### Decisions (settled)', '')
DECISIONS.forEach((d, i) => L.push(`${i + 1}. ${d}`))
L.push('', '### Method and confidence', '')
for (const [k, v] of Object.entries(json.method)) L.push(`- **${k}**: ${v}`)
L.push('')

L.push('## 0. Ingredient fixes, and rows left alone', '')
for (const x of results.filter(x => x.ingredientFix)) L.push(`- ${esc(x.title)} (\`${x.id}\`): remove row ${x.ingredientFix.removeIndex} (${x.ingredientFix.row.quantity} ${x.ingredientFix.row.unit} ${x.ingredientFix.row.ingredient}) in en/no/sv: ${esc(x.ingredientFix.why)}.`)
const named = list => results.filter(x => list.includes(x.id)).map(x => `${esc(x.title)} (\`${x.id}\`)`).join(', ') || 'none'
L.push('', 'Oil in the method but not in the ingredients (not changed, by decision; the oil is not in the nutrition, and these recipes fail oil-free, heart-healthy and diabetes-friendly on the method text):', '')
L.push(`- with a stated amount: ${named(summary.oilInMethodNotListed.statedAmount)}`)
L.push(`- mentioned without an amount: ${named(summary.oilInMethodNotListed.unquantified)}`)
L.push(`- method fries, no fat named: ${named(summary.fryingOilNotListed)}`, '')

L.push('## 1. Nutrition proposals', '')
L.push('Current → proposed per serving. kcal / protein / fat / sat. fat / carbs / fibre / sugars / added sugar / sodium. "est." is the ingredient-based estimate at the current serving count.', '')
L.push('| Recipe | Pack | Status | Change | Current | Proposed | Serving g | Conf. | Why |', '|---|---|---|---|---|---|---|---|---|')
const panel = n => n ? `${kc(n.calories)} kcal · P ${r1(n.protein)} · F ${r1(n.totalFat)} · SF ${r1(n.saturatedFat)} · C ${r1(n.totalCarbs)} · fib ${r1(n.fiber)} · sug ${r1(n.totalSugars)} · add ${r1(n.addedSugar)} · Na ${kc(n.sodium)}` : '—'
for (const x of results.filter(x => x.nutrition.proposed)) {
  const n = x.nutrition
  L.push(`| ${esc(x.title)} (\`${x.id}\`) | ${x.pack} | ${n.status} | ${n.change} | ${panel(n.current)} | ${panel(n.proposed)} | ${n.servingWeightGrams.current ?? '—'} → ${n.servingWeightGrams.proposed ?? 'same'} | ${n.confidence} | ${esc(n.reason)}${n.yieldNotes?.length ? `; ${esc(n.yieldNotes.join('; '))}` : ''} |`)
}
L.push('')
const strainedOk = results.filter(x => STRAINED.has(x.id))
L.push(`Kept as stored (strained or reduced, so a lower value than the ingredient sum is expected): ${strainedOk.map(x => `${x.title} (\`${x.id}\`)`).join(', ')}.`, '')

L.push('## 2. Servings proposals', '')
L.push('| Recipe | Pack | Servings | Portion | Serving g | Basis | Conf. |', '|---|---|---|---|---|---|---|')
for (const x of results.filter(x => x.servings)) {
  const s = x.servings
  L.push(`| ${esc(x.title)} (\`${x.id}\`) | ${x.pack} | ${s.current} → ${s.proposed} | ${esc(s.portion.en)} | ${s.servingWeightGrams.current ?? '—'} → ${s.servingWeightGrams.proposed} | ${esc(s.basis)} | ${s.confidence} |`)
}
L.push('', 'Per-serving nutrition after the change is in section 1 (rescaled or recalculated).', '')

L.push('## 3. Time proposals (minutes)', '')
L.push('Only recipes where prep or cook time is missing (null, or both 0). The app stores waiting time (soaking, rising, setting) inside cookTime, as the newer recipes do.', '')
L.push('| Recipe | Pack | Current prep/cook | Proposed prep/cook | Evidence | Conf. |', '|---|---|---|---|---|---|')
for (const x of results.filter(x => x.time.proposed)) {
  const t = x.time
  L.push(`| ${esc(x.title)} (\`${x.id}\`) | ${x.pack} | ${t.current.prepTime ?? '—'} / ${t.current.cookTime ?? '—'} | ${t.proposed.prepTime} / ${t.proposed.cookTime} | ${esc(t.evidence)} | ${t.confidence} |`)
}
L.push('')

L.push('## 4. Meal types (all recipes)', '')
L.push('| Recipe | Pack | Category | Meal types | Basis |', '|---|---|---|---|---|')
for (const x of results) L.push(`| ${esc(x.title)} (\`${x.id}\`) | ${x.pack} | ${x.category} | ${x.mealTypes.mealTypes.join(', ')} | ${esc(x.mealTypes.basis)} |`)
L.push('')

L.push('## 5. Good-for labels (all recipes)', '')
L.push(`Codes: ${LABELS.map(l => `${short[l]} = ${l}`).join(', ')}. One line per added (+) or removed (−) label with its reason; unchanged labels are listed without reasons (all reasons are in the JSON). Other tags (vegan, ornish-green, …) are not touched.`, '')
for (const p of PACKS) {
  L.push(`### ${p.short}`, '')
  for (const x of results.filter(x => x.pack === p.short)) {
    const lb = x.labels
    L.push(`**${esc(x.title)}** (\`${x.id}\`): existing ${tagList(lb.existing)} → proposed ${tagList(lb.proposed)}`)
    const lines = []
    for (const l of lb.added) lines.push(`  - + ${l}: ${lb.reasons[l].why}`)
    for (const l of lb.removed) lines.push(`  - − ${l}: ${lb.reasons[l].why}`)
    if (lb.humanNote && (lb.added.length || lb.removed.length)) lines.push(`  - earlier human note (condition_overrides.json): ${lb.humanNote}`)
    if (lines.length) L.push('', ...lines)
    L.push('')
  }
}
fs.writeFileSync(OUT_MD, L.join('\n') + '\n', 'utf8')

console.log(JSON.stringify(summary, null, 1))

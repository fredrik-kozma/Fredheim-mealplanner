/*
 * Condition-tag audit for all recipe packs.
 *
 * Evaluates every recipe against WFPB clinical criteria and assigns up to
 * four condition tags:
 *
 *   diabetes-friendly        PCRM/Barnard: satFat <= 2 g/serving, zero added
 *                            sugar & no sweetener ingredients, no refined
 *                            flour, fiber >= 3 g/serving
 *   blood-pressure-friendly  DASH: sodium <= 500 mg/serving, potassium-rich
 *                            (K:Na >= 1.2 when both known)
 *   heart-healthy            Ornish/Esselstyn (heart disease + cholesterol):
 *                            satFat <= 2 g, no added oil, no coconut
 *                            milk/cream, fiber >= 3 g, cholesterol 0
 *   weight-loss              Energy density (Rolls/Lisle): <= 150 kcal/100 g
 *                            where serving weight is known; otherwise
 *                            <= 250 kcal/serving with fiber >= 3 and satFat
 *                            <= 2 and no added oil
 *
 * Borderline cases land in a review list; scripts/condition_overrides.json
 * carries the human (clinical-judgment) verdicts keyed by recipe id:
 *   { "<id>": { "add": ["tag"], "remove": ["tag"], "note": "why" } }
 *
 * Run modes:
 *   node scripts/audit_condition_tags.cjs           -> report only
 *   node scripts/audit_condition_tags.cjs --write   -> write tags into packs
 */
const fs = require('fs')
const path = require('path')

const PACKS = [
  ['fredheim-recipes-with-pictures.json', '1.8.0'],
  ['fredheim-reversal-protocol.json', '1.6.0'],
  ['fredheim-fmd-5day.json', '1.3.0'],
]
const CONDITION_TAGS = ['diabetes-friendly', 'blood-pressure-friendly', 'heart-healthy', 'weight-loss']
const WRITE = process.argv.includes('--write')

const overridesPath = path.join(__dirname, 'condition_overrides.json')
const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, 'utf8')) : {}

// ── ingredient flags ────────────────────────────────────────────────────────
const rx = {
  // added oil / hard fats ("almond butter" etc. is NOT oil; "peanut butter" fine)
  oil: /(^|[^a-zæøåäö])(oil|olje|olja)s?\b|margarin/i,
  butter: /\b(butter|smør|smör)\b/i,
  nutButter: /\b(almond|peanut|cashew|nut|mandel|peanøtt|jordnöts?)[ -]?(butter|smør|smör)/i,
  coconutFat: /coconut (milk|cream|oil)|kokosmelk|kokosmjölk|kokosolje|kokosolja|kokoskrem|kokosgrädde|creamed coconut/i,
  sweetener: /\b(sugar|sukker|socker|syrup|sirup|sirap|honey|honning|honung|agave|maple)\b/i,
  sugarSnap: /sugar ?snap/i,
  whiteFlour: /\b(wheat flour|hvetemel|vetemjöl|white flour|all[- ]?purpose)\b/i,
  wholeGrain: /\b(whole|sammalt|fullkorn|grov|spelt|rye|rug|råg|oat|havre|buckwheat|bokhvete)\b/i,
}

function ingredientFlags(recipe) {
  const names = (recipe.ingredients || []).map(i => String(i.name || ''))
  const flags = { oil: false, coconut: false, sweetener: false, refinedFlour: false }
  for (let n of names) {
    // Negated parentheticals describe what the ingredient does NOT contain
    // — "Natural almond butter (no added oil or sugar)" must not trip the
    // oil/sweetener flags.
    n = n.replace(/\((?:no|without|uten|utan)[^)]*\)/gi, '')
    if (rx.coconutFat.test(n)) flags.coconut = true
    if (rx.oil.test(n)) flags.oil = true
    if (rx.butter.test(n) && !rx.nutButter.test(n)) flags.oil = true
    if (rx.sweetener.test(n) && !rx.sugarSnap.test(n)) flags.sweetener = true
    if (rx.whiteFlour.test(n) && !rx.wholeGrain.test(n)) flags.refinedFlour = true
  }
  return flags
}

// ── evaluation ──────────────────────────────────────────────────────────────
function evaluate(recipe) {
  const n = recipe.nutrition?.perServing || recipe.nutrition || {}
  const kcal = n.calories ?? recipe.kcal ?? null
  const satFat = n.saturatedFat ?? null
  const sodium = n.sodium ?? null
  const potassium = n.potassium ?? null
  const fiber = n.fiber ?? null
  const addedSugar = n.addedSugar ?? null
  const chol = n.cholesterol ?? 0
  const weight = recipe.servingWeightGrams ?? null
  const density = weight && kcal != null ? (kcal * 100) / weight : null
  const f = ingredientFlags(recipe)
  const isOrnishGreen = (recipe.tags || []).includes('ornish-green')

  const tags = new Set()
  const borderline = []

  // Data-quality gate: a recipe with no (or zero) calorie data cannot be
  // evaluated — no tags at all rather than tags from garbage numbers.
  const hasData = kcal != null && kcal > 0

  // heart-healthy (Ornish/Esselstyn — heart disease + cholesterol)
  if (isOrnishGreen) tags.add('heart-healthy')
  else if (hasData && satFat != null && fiber != null) {
    if (satFat <= 2 && !f.oil && !f.coconut && fiber >= 3 && chol === 0) tags.add('heart-healthy')
    else if (satFat <= 3 && !f.oil && !f.coconut && fiber >= 2.5 && chol === 0) borderline.push('heart-healthy')
  }

  // diabetes-friendly (PCRM/Barnard: also NO added oil — oil is a refined,
  // insulin-resistance-promoting extract in this programme)
  if (hasData && satFat != null && fiber != null) {
    const sugarOk = (addedSugar == null || addedSugar === 0) && !f.sweetener
    const wholeFood = !f.refinedFlour && !f.oil && !f.coconut
    if (satFat <= 2 && sugarOk && wholeFood && fiber >= 3) tags.add('diabetes-friendly')
    else if (satFat <= 3 && sugarOk && wholeFood && fiber >= 2.5) borderline.push('diabetes-friendly')
  }

  // blood-pressure-friendly (DASH: sodium cap, potassium-rich, and DASH's
  // own saturated-fat limit so coconut/cream desserts don't qualify)
  if (hasData && sodium != null && (satFat == null || satFat <= 4)) {
    const kNaOk = potassium == null || sodium === 0 || potassium / sodium >= 1.2
    if (sodium <= 500 && kNaOk) tags.add('blood-pressure-friendly')
    else if (sodium <= 700 && kNaOk) borderline.push('blood-pressure-friendly')
  }

  // weight-loss (energy density; added sweeteners disqualify)
  if (hasData && !f.sweetener) {
    if (density != null) {
      if (density <= 150 && (satFat == null || satFat <= 3)) tags.add('weight-loss')
      else if (density <= 180 && (satFat == null || satFat <= 3)) borderline.push('weight-loss')
    } else if (fiber != null && satFat != null) {
      if (kcal <= 250 && fiber >= 3 && satFat <= 2 && !f.oil && !f.coconut) tags.add('weight-loss')
      else if (kcal <= 330 && fiber >= 3 && satFat <= 2.5 && !f.oil && !f.coconut) borderline.push('weight-loss')
    }
  }

  // Apply human overrides last.
  const ov = overrides[recipe.id]
  if (ov) {
    for (const tg of ov.add || []) tags.add(tg)
    for (const tg of ov.remove || []) tags.delete(tg)
  }

  return {
    tags: [...tags],
    borderline: borderline.filter(b => !tags.has(b) && !(ov?.remove || []).includes(b)),
    metrics: { kcal, satFat, sodium, potassium, fiber, density: density != null ? Math.round(density) : null, ...f },
  }
}

// ── run ─────────────────────────────────────────────────────────────────────
let totals = { 'diabetes-friendly': 0, 'blood-pressure-friendly': 0, 'heart-healthy': 0, 'weight-loss': 0 }
const reviewRows = []

for (const [file, newVersion] of PACKS) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', file)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const r of pack.recipes) {
    const res = evaluate(r)
    for (const tg of res.tags) totals[tg]++
    const short = t => ({ 'diabetes-friendly': 'DIA', 'blood-pressure-friendly': 'BP', 'heart-healthy': 'HRT', 'weight-loss': 'WL' }[t])
    reviewRows.push(
      [
        (r.id + '                                  ').slice(0, 34),
        (res.tags.map(short).join(',') || '-').padEnd(15),
        res.borderline.length ? ('?' + res.borderline.map(short).join(',')).padEnd(12) : ''.padEnd(12),
        `kcal:${res.metrics.kcal ?? '—'} sf:${res.metrics.satFat ?? '—'} na:${res.metrics.sodium ?? '—'} fib:${res.metrics.fiber ?? '—'} dens:${res.metrics.density ?? '—'}` +
        (res.metrics.oil ? ' OIL' : '') + (res.metrics.coconut ? ' COCO' : '') +
        (res.metrics.sweetener ? ' SWEET' : '') + (res.metrics.refinedFlour ? ' WFLOUR' : ''),
        '| ' + r.title,
      ].join(' ')
    )
    if (WRITE) {
      const kept = (r.tags || []).filter(tg => !CONDITION_TAGS.includes(tg))
      r.tags = [...kept, ...res.tags]
    }
  }
  if (WRITE) {
    pack.version = newVersion
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
    console.log('WROTE', file, '->', newVersion)
  }
}

if (!WRITE) console.log(reviewRows.join('\n'))
console.log('\nTOTALS:', JSON.stringify(totals), '| overrides applied:', Object.keys(overrides).length)

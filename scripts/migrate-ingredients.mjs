#!/usr/bin/env node
/*
 * Ingredient migration: {quantity, unit, name}  ->  {quantity, unit, ingredient, name, note?}
 *
 * What it does, per recipe in each built-in pack (en `ingredients`, plus
 * `translations.no.ingredients` and `translations.sv.ingredients`):
 *
 *   1. Maps every old ingredient name to a dictionary id (src/data/ingredientDictionary.json)
 *      using scripts/data/ingredient-migration-map.json, and checks that the en/no/sv rows at
 *      the same index agree on the id, the quantity and the unit.
 *   2. Rewrites each row as { quantity, unit, ingredient, name, note?, ...other keys } where
 *      `name` is the dictionary's standard name in THAT language (so code that reads `name`
 *      keeps working) and `note` is the leftover prep/usage text in that language.
 *   3. Q19 unit clean-ups, ONLY where there is a documented/safe conversion (see RULES below).
 *      Everything else that is in an off-standard unit is left untouched and listed in the report.
 *   4. Q20: recipes with no Swedish ingredient list get one built from the dictionary (Swedish
 *      names; notes translated via scripts/data/note-translations-no-sv.json).
 *   5. Bumps the pack `version` (minor +1) when, and only when, the pack content changed
 *      (INGREDIENT_UNITS.md section 7: AutoInstallDefaultPack reinstalls only on a version change).
 *
 * Deterministic and idempotent: rows that already carry `ingredient` are not re-mapped, a
 * converted row is already in its standard unit, and an existing Swedish list is not rebuilt, so
 * a second run changes nothing and does not bump the version again.
 *
 * Safety: nothing is written unless every pack migrates cleanly (all names mapped, arrays
 * aligned, quantities unchanged except for listed conversions, second pass is a no-op).
 *
 * Usage:
 *   node scripts/migrate-ingredients.mjs                 # migrate in place
 *   node scripts/migrate-ingredients.mjs --dry-run       # report only, write nothing
 *   node scripts/migrate-ingredients.mjs --apply-proposed   # also apply the "proposed" unit conversions
 *   node scripts/migrate-ingredients.mjs --report out.json  # write the machine-readable report
 *   node scripts/migrate-ingredients.mjs --packs-dir <dir>  # packs somewhere else (default recipe-packs-template/packs)
 *   node scripts/migrate-ingredients.mjs --packs a,b        # only these pack ids (file names without .json)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeUnit, TO_BASE, BASE_UNIT_TYPE } from '../src/utils/unitNormalizer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LANGS = ['en', 'no', 'sv']

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d }
const DRY_RUN = flag('--dry-run')
const APPLY_PROPOSED = flag('--apply-proposed')
const REPORT_PATH = opt('--report', null)
const PACKS_DIR = path.resolve(opt('--packs-dir', path.join(ROOT, 'recipe-packs-template', 'packs')))
const PACK_IDS = (opt('--packs', 'fredheim-recipes-with-pictures,fredheim-reversal-protocol,fredheim-fmd-5day')).split(',')

// ---------------------------------------------------------------- data
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const DICT = readJson(path.join(ROOT, 'src', 'data', 'ingredientDictionary.json'))
const MAP = readJson(path.join(__dirname, 'data', 'ingredient-migration-map.json')).names
const TM = readJson(path.join(__dirname, 'data', 'note-translations-no-sv.json'))
const NOTE_NO_SV = { ...TM.manual, ...TM.from_existing_pairs }
const BY_ID = new Map(DICT.entries.map((e) => [e.id, e]))

const nameKey = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

// ---------------------------------------------------------------- unit helpers
// weight | volume | count | none
function unitGroup(u) {
  const key = normalizeUnit(u)
  if (!key) return 'none'
  const base = BASE_UNIT_TYPE[key]
  if (base === 'g') return 'weight'
  if (base === 'ml') return 'volume'
  return 'count'
}
const GROUP_OF_PREFERRED = { g: 'weight', ml: 'volume', tsp: 'volume', tbsp: 'volume', clove: 'count', pcs: 'count' }

const roundQuarter = (x) => Math.max(0.25, Math.round(x * 4) / 4)
// INGREDIENT_UNITS.md section 5
const roundGrams = (g) => (g < 20 ? Math.max(1, Math.round(g)) : Math.round(g / 5) * 5)
const roundMl = (m) => (m < 20 ? Math.max(1, Math.round(m)) : Math.round(m / 5) * 5)

/*
 * Conversion rules (Q19). Each rule says how to move a row from `from` (weight|volume|count) to
 * the entry's standard unit `to`. Status:
 *   safe      applied by default. Factor comes from INGREDIENT_UNITS.md or from the app's own
 *             tables (scripts/nutrition/units.mjs, scripts/spoon_solids_to_weight.cjs).
 *   proposed  applied only with --apply-proposed (factor is plausible but not documented, or
 *             real-world density differs from the repo's nutrition table).
 *   blocked   never applied; reason is listed in the report.
 * `when(text)` (old name, or standard name + note once migrated) and `rows` (recipeId#index) narrow a rule to certain rows. Rules are tried in order; first match wins.
 */
const RULES = {
  garlic: [
    { from: 'weight', to: 'clove', gramsPerPiece: 3, status: 'safe', source: 'scripts/nutrition/units.mjs: 1 clove = 3 g' },
  ],
  salt: [
    { from: 'weight', to: 'tsp', gPerMl: 1.2, spoonsToTbspAt: 6, status: 'safe', source: 'scripts/nutrition/units.mjs: salt 1.2 g/ml (1 tsp = 6 g)' },
    { from: 'count', unit: 'pinch', status: 'blocked', reason: 'a pinch is a real unit; the "to taste" convention would drop the quantity' },
  ],
  water: [
    { from: 'weight', to: 'ml', gPerMl: 1, status: 'safe', source: 'water 1 g = 1 ml' },
  ],
  'coconut-oil': [
    { from: 'weight', to: 'tbsp', gPerMl: 0.92, status: 'safe', source: 'scripts/nutrition/units.mjs: oils 0.92 g/ml' },
  ],
  'rapeseed-oil': [
    { from: 'weight', to: 'tbsp', gPerMl: 0.92, status: 'safe', source: 'scripts/nutrition/units.mjs: oils 0.92 g/ml' },
  ],
  'tapioca-starch': [
    { from: 'weight', to: 'tbsp', gPerMl: 0.55, status: 'safe', source: 'scripts/nutrition/units.mjs: flours/starches 0.55 g/ml' },
  ],
  tamari: [
    { from: 'weight', to: 'tbsp', gPerMl: 1.0, status: 'safe', source: 'scripts/nutrition/units.mjs: soy sauce 1.0 g/ml' },
  ],
  tahini: [
    { from: 'volume', to: 'g', gPerMl: 1.0, status: 'safe', source: 'scripts/spoon_solids_to_weight.cjs: tahini 100 g/dl' },
  ],
  pineapple: [
    { from: 'volume', to: 'g', gPerMl: 0.7, status: 'safe', source: 'INGREDIENT_UNITS.md section 2: pineapple 70 g/dl' },
  ],
  'chia-seeds': [
    { from: 'volume', to: 'g', gPerMl: 0.7, status: 'safe', source: 'INGREDIENT_UNITS.md section 2: chia 70 g/dl' },
  ],
  'flaxseed-ground': [
    { from: 'volume', to: 'g', gPerMl: 0.5, status: 'safe', source: 'scripts/spoon_solids_to_weight.cjs: ground flaxseed 50 g/dl' },
  ],
  // "Juice of ½ lemon" counted in pieces, so it lands on the same shopping
  // line as the spoon and ml rows of the same juice.
  'lemon-juice': [
    { from: 'count', to: 'tbsp', mlPerPiece: 45, onlyUnits: ['pcs'], status: 'safe', source: 'INGREDIENT_UNITS.md section 3: juice of 1 lemon = 45 ml (3 tbsp)' },
  ],
  'lime-juice': [
    { from: 'count', to: 'tbsp', mlPerPiece: 30, onlyUnits: ['pcs'], status: 'safe', source: 'INGREDIENT_UNITS.md section 3: juice of 1 lime = 30 ml (2 tbsp)' },
  ],
  'nutritional-yeast': [
    { from: 'weight', to: 'tbsp', gPerMl: 5 / 15, status: 'safe', source: 'INGREDIENT_UNITS.md section 2: nutritional yeast flakes, 1 tbsp = 5 g' },
  ],
  // ---- proposed (opt-in)
  'psyllium-husk': [
    { from: 'weight', to: 'tbsp', gPerMl: 0.55, status: 'proposed', source: 'scripts/nutrition/units.mjs: fibre husk 0.55 g/ml (INGREDIENT_UNITS.md section 1.2 wants tsp/tbsp)' },
  ],
  'carob-powder': [
    { from: 'volume', to: 'g', gPerMl: 0.55, status: 'proposed', source: 'scripts/nutrition/units.mjs: cocoa/powders 0.55 g/ml' },
  ],
  'dry-yeast': [
    { from: 'volume', to: 'g', gPerMl: 0.5, status: 'proposed', source: 'scripts/nutrition/units.mjs: yeast 0.5 g/ml' },
  ],
  lemons: [
    { from: 'volume', to: 'pcs', mlPerPiece: 15, when: (n) => /zest/i.test(n), onlyUnits: ['tsp'], status: 'proposed', source: 'common rule of thumb: 1 lemon = about 3 tsp zest' },
    { from: 'volume', status: 'blocked', reason: 'lemon in spoons is ambiguous (juice, zest or peel) and has no documented factor' },
  ],
  limes: [
    { from: 'volume', to: 'pcs', mlPerPiece: 10, onlyUnits: ['tsp'], status: 'proposed', source: 'common rule of thumb: 1 lime = about 2 tsp zest' },
  ],
  mint: [{ from: 'volume', to: 'g', gPerMl: 0.25, status: 'proposed', source: 'INGREDIENT_UNITS.md section 2: fresh herbs about 25 g/dl (parsley)' }],
  'coriander-fresh': [{ from: 'volume', to: 'g', gPerMl: 0.25, status: 'proposed', source: 'INGREDIENT_UNITS.md section 2: fresh herbs about 25 g/dl (parsley)' }],
  // Rows are pinned by `recipeId#index` where the OLD name decided the call (the old name
  // "Thyme" vs "Thyme, raw" is no longer visible once both are the standard name "Thyme").
  thyme: [
    { from: 'volume', rows: ['fr-2#5'], status: 'blocked', reason: 'plain "Thyme" in tsp (recipe fr-2, next to dried marjoram) is probably dried thyme; needs a human decision' },
    { from: 'volume', to: 'g', gPerMl: 0.25, status: 'proposed', source: 'INGREDIENT_UNITS.md section 2: fresh herbs about 25 g/dl (parsley); old name was "Thyme, raw"' },
  ],
  rosemary: [{ from: 'volume', to: 'g', gPerMl: 0.25, status: 'proposed', source: 'INGREDIENT_UNITS.md section 2: fresh herbs about 25 g/dl (parsley); old name was "Rosemary, raw"' }],
  basil: [
    { from: 'volume', status: 'blocked', reason: 'plain "Basil" in tsp (recipe fr-2, next to dried marjoram) is probably dried basil; needs a human decision' },
  ],
  onions: [
    { from: 'count', unit: 'clove', status: 'blocked', reason: 'onion measured in "clove" looks like a data error (garlic?); needs a human decision' },
  ],
  nori: [
    { from: 'volume', status: 'blocked', reason: 'nori in tbsp (flakes?) cannot be turned into sheets without a decision' },
  ],
}

function planConversion(row, enName, entry, recipeId, index) {
  const q = row.quantity
  if (typeof q !== 'number' || !isFinite(q) || q === 0) return null
  const uKey = normalizeUnit(row.unit)
  const from = unitGroup(row.unit)
  const pref = GROUP_OF_PREFERRED[entry.preferredUnit]
  if (from === 'none' || from === pref) return null
  const rules = RULES[entry.id] || []
  const rule = rules.find((r) => r.from === from
    && (!r.unit || r.unit === uKey)
    && (!r.onlyUnits || r.onlyUnits.includes(uKey))
    && (!r.when || r.when(enName))
    && (!r.rows || r.rows.includes(`${recipeId}#${index}`)))
  if (!rule) return { kind: 'no-rule', reason: `no documented factor for ${entry.id} (${from} -> ${entry.preferredUnit})` }
  if (rule.status === 'blocked') return { kind: 'blocked', reason: rule.reason }
  if (rule.status === 'proposed' && !APPLY_PROPOSED) return { kind: 'proposed-not-applied', rule, result: compute(rule, q, uKey, from) }
  return { kind: 'convert', rule, result: compute(rule, q, uKey, from) }
}

function compute(rule, q, uKey, from) {
  const baseQty = q * (TO_BASE[uKey] ?? NaN) // g or ml for weight/volume
  let quantity, unit = rule.to
  if (from === 'weight' && (rule.to === 'tsp' || rule.to === 'tbsp' || rule.to === 'ml')) {
    const ml = baseQty / rule.gPerMl
    if (rule.to === 'ml') quantity = roundMl(ml)
    else {
      let spoons = ml / TO_BASE[rule.to]
      if (rule.to === 'tsp' && rule.spoonsToTbspAt && spoons >= rule.spoonsToTbspAt) { unit = 'tbsp'; spoons = ml / TO_BASE.tbsp }
      quantity = roundQuarter(spoons)
    }
  } else if (from === 'weight' && rule.to === 'clove') {
    quantity = Math.max(1, Math.round(baseQty / rule.gramsPerPiece))
  } else if (from === 'volume' && rule.to === 'g') {
    quantity = roundGrams(baseQty * rule.gPerMl)
  } else if (from === 'volume' && rule.to === 'pcs') {
    quantity = roundQuarter(baseQty / rule.mlPerPiece)
  } else if (from === 'count' && (rule.to === 'tbsp' || rule.to === 'tsp')) {
    quantity = roundQuarter((q * rule.mlPerPiece) / TO_BASE[rule.to])
  } else {
    throw new Error(`unsupported rule ${JSON.stringify(rule)}`)
  }
  return { quantity, unit }
}

// ---------------------------------------------------------------- row helpers
const clone = (x) => JSON.parse(JSON.stringify(x))
const KNOWN = new Set(['quantity', 'unit', 'ingredient', 'name', 'note'])

function buildRow(old, lang, id, note, quantity, unit) {
  const out = { quantity, unit, ingredient: id, name: BY_ID.get(id).names[lang] }
  if (note) out.note = note
  for (const k of Object.keys(old)) if (!KNOWN.has(k)) out[k] = old[k]
  return out
}

function lookup(lang, name) {
  return MAP[lang][nameKey(name)] || null
}

// ---------------------------------------------------------------- migrate one pack
function migratePack(packIn, packId, report) {
  const pack = clone(packIn)
  const before = JSON.stringify(packIn)
  const errors = report.errors
  const stat = report.packs[packId] = {
    recipes: pack.recipes.length, rowsEn: 0, rowsMapped: 0, rowsAlreadyMigrated: 0, rowsNoteAdded: 0,
    swedishListsCreated: 0, swedishRowsCreated: 0, conversions: 0, versionFrom: pack.version, versionTo: pack.version,
  }

  for (const recipe of pack.recipes) {
    const en = recipe.ingredients || []
    const tr = recipe.translations || {}
    const lists = { en, no: tr.no?.ingredients, sv: tr.sv?.ingredients }
    stat.rowsEn += en.length

    // ---- alignment check (lengths; quantity + unit per index)
    let ok = true
    for (const l of ['no', 'sv']) {
      if (!lists[l]) continue
      if (lists[l].length !== en.length) { errors.push({ recipe: recipe.id, pack: packId, kind: 'length-mismatch', lang: l, en: en.length, other: lists[l].length }); ok = false; continue }
      en.forEach((r, i) => {
        const o = lists[l][i]
        if (r.quantity !== o.quantity || normalizeUnit(r.unit) !== normalizeUnit(o.unit)) {
          errors.push({ recipe: recipe.id, pack: packId, kind: 'quantity-or-unit-mismatch', lang: l, index: i, en: [r.quantity, r.unit], other: [o.quantity, o.unit] }); ok = false
        }
      })
    }
    if (!ok) continue

    const svExisted = Boolean(lists.sv)
    const newSv = svExisted ? null : []

    en.forEach((enRow, i) => {
      // ---- resolve ids per language
      const alreadyEn = typeof enRow.ingredient === 'string'
      let id, notes = {}
      if (alreadyEn) {
        id = enRow.ingredient
        if (!BY_ID.has(id)) { errors.push({ recipe: recipe.id, pack: packId, kind: 'unknown-ingredient-id', index: i, id }); return }
        for (const l of ['no', 'sv']) {
          const r = lists[l]?.[i]
          if (r && r.ingredient !== id) errors.push({ recipe: recipe.id, pack: packId, kind: 'id-mismatch-across-languages', index: i, lang: l, en: id, other: r.ingredient })
        }
        stat.rowsAlreadyMigrated++
      } else {
        const hit = { en: lookup('en', enRow.name) }
        if (!hit.en) { errors.push({ recipe: recipe.id, pack: packId, kind: 'unmapped-name', lang: 'en', index: i, name: enRow.name }); return }
        id = hit.en.i
        notes.en = hit.en.n || ''
        for (const l of ['no', 'sv']) {
          const r = lists[l]?.[i]
          if (!r) continue
          const h = lookup(l, r.name)
          if (!h) { errors.push({ recipe: recipe.id, pack: packId, kind: 'unmapped-name', lang: l, index: i, name: r.name }); return }
          if (h.i !== id) { errors.push({ recipe: recipe.id, pack: packId, kind: 'id-mismatch-across-languages', index: i, lang: l, en: id, other: h.i, enName: enRow.name, otherName: r.name }); return }
          notes[l] = h.n || ''
        }
        stat.rowsMapped++
      }
      const entry = BY_ID.get(id)

      // ---- unit conversion (decided once from the English row, applied to all languages)
      let { quantity, unit } = enRow
      const plan = planConversion(enRow, `${enRow.name} ${enRow.note || ''}`, entry, recipe.id, i)
      if (plan?.kind === 'convert') {
        report.conversions.push({ pack: packId, recipe: recipe.id, title: recipe.title, index: i, ingredient: id, name: enRow.name, from: `${enRow.quantity} ${enRow.unit}`, to: `${plan.result.quantity} ${plan.result.unit}`, status: plan.rule.status, source: plan.rule.source })
        quantity = plan.result.quantity; unit = plan.result.unit
        stat.conversions++
      } else if (plan) {
        report.flagged.push({ pack: packId, recipe: recipe.id, title: recipe.title, index: i, ingredient: id, name: enRow.name, row: `${enRow.quantity} ${enRow.unit}`, standardUnit: entry.preferredUnit, kind: plan.kind, reason: plan.reason || plan.rule?.reason || '', proposal: plan.result ? `${plan.result.quantity} ${plan.result.unit}` : null, proposalSource: plan.rule?.source || null })
      }
      const converted = plan?.kind === 'convert'

      // ---- rewrite rows
      const rewrite = (list, lang, row) => {
        const note = alreadyEn ? row.note : notes[lang]
        const q = converted ? quantity : row.quantity
        const u = converted ? unit : row.unit
        const nr = alreadyEn ? { ...row, quantity: q, unit: u } : buildRow(row, lang, id, note, q, u)
        if (!alreadyEn && nr.note) stat.rowsNoteAdded++
        list[i] = nr
      }
      rewrite(en, 'en', enRow)
      for (const l of ['no', 'sv']) if (lists[l]?.[i]) rewrite(lists[l], l, lists[l][i])

      // ---- Q20: Swedish list from the dictionary
      if (newSv) {
        const noNote = alreadyEn ? lists.no?.[i]?.note : notes.no
        const enNote = alreadyEn ? enRow.note : notes.en
        const source = lists.no?.[i] ? noNote : enNote
        let svNote = ''
        if (source) {
          if (lists.no?.[i] && NOTE_NO_SV[source] !== undefined) svNote = NOTE_NO_SV[source]
          else {
            svNote = source
            report.swedishNoteFlags.push({ pack: packId, recipe: recipe.id, index: i, ingredient: id, noteLeftAs: source, language: lists.no?.[i] ? 'no' : 'en' })
          }
        }
        const row = { quantity: converted ? quantity : enRow.quantity, unit: converted ? unit : enRow.unit, ingredient: id, name: entry.names.sv }
        if (svNote) row.note = svNote
        for (const k of Object.keys(enRow)) if (!KNOWN.has(k)) row[k] = enRow[k]
        newSv.push(row)
      }
    })

    if (newSv && newSv.length === en.length) {
      recipe.translations = recipe.translations || {}
      recipe.translations.sv = { ...(recipe.translations.sv || {}), ingredients: newSv }
      stat.swedishListsCreated++; stat.swedishRowsCreated += newSv.length
    }
  }

  const changed = JSON.stringify(pack) !== before
  if (changed) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(pack.version))
    if (!m) errors.push({ pack: packId, kind: 'unparseable-version', version: pack.version })
    else pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  }
  stat.versionTo = pack.version
  stat.changed = changed
  return pack
}

// ---------------------------------------------------------------- run
const report = {
  generatedBy: 'scripts/migrate-ingredients.mjs', dictionary: DICT.version, dryRun: DRY_RUN, appliedProposed: APPLY_PROPOSED,
  packs: {}, conversions: [], flagged: [], swedishNoteFlags: [], errors: [],
}
const results = {}
for (const id of PACK_IDS) {
  const file = path.join(PACKS_DIR, `${id}.json`)
  const packIn = readJson(file)
  const out = migratePack(packIn, id, report)
  results[id] = { file, packIn, out }
}

// second pass must be a no-op (idempotency), checked on the in-memory result
if (report.errors.length === 0) {
  const second = { errors: [], packs: {}, conversions: [], flagged: [], swedishNoteFlags: [] }
  for (const id of PACK_IDS) {
    const again = migratePack(results[id].out, id, second)
    if (JSON.stringify(again) !== JSON.stringify(results[id].out) || second.conversions.length || second.errors.length) {
      report.errors.push({ pack: id, kind: 'not-idempotent', detail: second.errors.slice(0, 3) })
    }
  }
}

// invariants on the result
if (report.errors.length === 0) {
  const converted = new Set(report.conversions.map((c) => `${c.pack}|${c.recipe}|${c.index}`))
  for (const id of PACK_IDS) {
    const { packIn, out } = results[id]
    out.recipes.forEach((r, ri) => {
      const src = packIn.recipes[ri]
      for (const l of LANGS) {
        const a = l === 'en' ? r.ingredients : r.translations?.[l]?.ingredients
        const b = l === 'en' ? src.ingredients : src.translations?.[l]?.ingredients
        if (!a) continue
        if (a.length !== r.ingredients.length) report.errors.push({ pack: id, recipe: r.id, kind: 'post-length', lang: l })
        a.forEach((row, i) => {
          if (!BY_ID.has(row.ingredient)) report.errors.push({ pack: id, recipe: r.id, kind: 'post-bad-id', lang: l, index: i })
          if (row.name !== BY_ID.get(row.ingredient)?.names[l]) report.errors.push({ pack: id, recipe: r.id, kind: 'post-name-not-standard', lang: l, index: i })
          if (row.ingredient !== r.ingredients[i].ingredient) report.errors.push({ pack: id, recipe: r.id, kind: 'post-id-misaligned', lang: l, index: i })
          const o = b?.[i]
          if (o && !converted.has(`${id}|${r.id}|${i}`) && (o.quantity !== row.quantity || o.unit !== row.unit)) report.errors.push({ pack: id, recipe: r.id, kind: 'post-quantity-changed', lang: l, index: i })
        })
      }
    })
  }
}

const totals = Object.values(report.packs).reduce((t, p) => { for (const k of Object.keys(p)) if (typeof p[k] === 'number') t[k] = (t[k] || 0) + p[k]; return t }, {})
report.totals = totals
report.flaggedByKind = report.flagged.reduce((m, f) => { m[f.kind] = (m[f.kind] || 0) + 1; return m }, {})

if (report.errors.length) {
  console.error(`MIGRATION ABORTED: ${report.errors.length} problem(s); nothing written.`)
  for (const e of report.errors.slice(0, 40)) console.error(' -', JSON.stringify(e))
  if (REPORT_PATH) fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n')
  process.exit(2)
}

if (!DRY_RUN) {
  for (const id of PACK_IDS) {
    const { file, out } = results[id]
    if (report.packs[id].changed) fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf8')
  }
}
if (REPORT_PATH) fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n')

console.log(`${DRY_RUN ? 'DRY RUN' : 'DONE'} (dictionary ${DICT.version}${APPLY_PROPOSED ? ', with proposed conversions' : ''})`)
for (const [id, s] of Object.entries(report.packs)) {
  console.log(`  ${id}: ${s.recipes} recipes, ${s.rowsEn} rows | mapped ${s.rowsMapped}, already ${s.rowsAlreadyMigrated}, notes ${s.rowsNoteAdded}, converted ${s.conversions}, Swedish lists created ${s.swedishListsCreated}, version ${s.versionFrom} -> ${s.versionTo}${s.changed ? '' : ' (unchanged)'}`)
}
console.log(`  unit conversions applied: ${report.conversions.length}; rows left in off-standard units (flagged): ${report.flagged.length} ${JSON.stringify(report.flaggedByKind)}`)
console.log(`  Swedish notes left untranslated: ${report.swedishNoteFlags.length}`)

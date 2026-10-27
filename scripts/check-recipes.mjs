#!/usr/bin/env node
/*
 * Recipe pack checker: every ingredient row must follow the dictionary
 * standard, so the shopping list keeps combining rows correctly.
 *
 * Per recipe, in each language list (en `ingredients`, `translations.no` and
 * `translations.sv`):
 *   missing-id            row has no `ingredient` id
 *   unknown-id            `ingredient` is not in src/data/ingredientDictionary.json
 *   non-standard-name     `name` is not the dictionary's standard name for that language
 *                         (prep words belong in `note`)
 *   missing-name          row has no name
 *   unknown-unit          unit the app does not know
 *   bad-unit              unit in the wrong family for the ingredient (grams for a spice,
 *                         spoons for a vegetable…), see INGREDIENT_UNITS.md
 *   zero-quantity         quantity 0 (use `quantity: null, unit: ""` for "to taste")
 *   quantity-without-unit a number with no unit
 *   missing-translation   no `translations.no|sv` title / ingredients / steps, or no en title
 *   misaligned            no/sv list differs from en in length, id, quantity or unit at an index
 *
 * Known leftovers are listed in scripts/data/check-recipes-baseline.json and are reported
 * as warnings; anything not in the baseline is an error and the exit code is 1.
 *
 * Usage:
 *   npm run check-recipes                         # all packs
 *   npm run check-recipes -- --recipe a,b         # only these recipe ids
 *   npm run check-recipes -- --pack <pack-id>     # only this pack (pack id or file name)
 *   npm run check-recipes -- --new-since 2026-10-01   # recipes with createdAt on/after (date or ms)
 *   npm run check-recipes -- --changed            # recipes new or edited since the last git commit
 *   npm run check-recipes -- --strict             # ignore the baseline: every problem is an error
 *   npm run check-recipes -- --verbose            # also list each baselined warning
 *   npm run check-recipes -- --update-baseline    # rewrite the baseline from the current state
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { normalizeUnit, CANONICAL_UNITS, BASE_UNIT_TYPE } from '../src/utils/unitNormalizer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
export const PACKS_DIR = path.join(ROOT, 'recipe-packs-template', 'packs')
export const DICTIONARY_PATH = path.join(ROOT, 'src', 'data', 'ingredientDictionary.json')
export const BASELINE_PATH = path.join(__dirname, 'data', 'check-recipes-baseline.json')
const LANGS = ['en', 'no', 'sv']

// ---------------------------------------------------------------- units
// weight | volume | count | pinch | none | unknown
function unitFamily(unit) {
  const key = normalizeUnit(unit)
  if (!key || key === 'none') return 'none'
  if (!CANONICAL_UNITS[key]) return 'unknown'
  if (BASE_UNIT_TYPE[key] === 'g') return 'weight'
  if (BASE_UNIT_TYPE[key] === 'ml') return 'volume'
  if (key === 'pinch' || key === 'dash') return 'pinch'
  if (key === 'handful') return 'handful'
  return key // pcs | clove
}

// Unit families allowed for each dictionary preferredUnit (INGREDIENT_UNITS.md):
// solids by weight; liquids by volume; spices by spoon, or a pinch/dash; garlic in
// cloves; lemons, cans, sheets in pieces. Within a family the app converts
// (dl -> ml, tsp -> tbsp), so any unit of the family is fine.
const ALLOWED = {
  g: ['weight'],
  ml: ['volume'],
  tsp: ['volume', 'pinch'],
  tbsp: ['volume', 'pinch'],
  clove: ['clove'],
  pcs: ['pcs'],
}
const ALLOWED_TEXT = {
  g: 'grams',
  ml: 'ml/dl/l or spoons',
  tsp: 'tsp/tbsp or a pinch',
  tbsp: 'tsp/tbsp or a pinch',
  clove: 'cloves',
  pcs: 'pieces (pcs)',
}

// ---------------------------------------------------------------- core
/**
 * Checks recipes against the dictionary. Pure: no files, no console.
 *   packs:      [{ id, recipes: [...] }]
 *   dictionary: the parsed ingredientDictionary.json
 *   options.only(recipe, pack) -> boolean   which recipes to check (default all)
 * Returns a flat list of issues { pack, recipe, title, lang, index, code, message, key }.
 * `key` is stable across unrelated edits (no row index), for the baseline.
 */
export function checkPacks(packs, dictionary, { only = () => true } = {}) {
  const byId = new Map(dictionary.entries.map((e) => [e.id, e]))
  const issues = []

  for (const pack of packs) {
    for (const recipe of pack.recipes || []) {
      if (!only(recipe, pack)) continue
      const add = (lang, index, code, detail, message) => issues.push({
        pack: pack.id, recipe: recipe.id, title: recipe.title, lang, index, code, message,
        key: [pack.id, recipe.id, lang, code, detail].join('|'),
      })

      if (!String(recipe.title || '').trim()) add('en', null, 'missing-translation', 'title', 'no English title')
      for (const l of ['no', 'sv']) {
        const tr = recipe.translations?.[l]
        if (!String(tr?.title || '').trim()) add(l, null, 'missing-translation', 'title', `no ${l} title`)
        if (!Array.isArray(tr?.ingredients)) add(l, null, 'missing-translation', 'ingredients', `no ${l} ingredient list`)
        if ((recipe.steps || []).length && !(tr?.steps || []).length) add(l, null, 'missing-translation', 'steps', `no ${l} steps`)
      }

      const en = recipe.ingredients || []
      for (const lang of LANGS) {
        const list = lang === 'en' ? en : recipe.translations?.[lang]?.ingredients
        if (!Array.isArray(list)) continue

        if (lang !== 'en' && list.length !== en.length) {
          add(lang, null, 'misaligned', 'length', `${list.length} ingredient rows, English has ${en.length}`)
        }

        list.forEach((row, i) => {
          const label = row.ingredient || row.name || `row ${i + 1}`
          const unitText = `${row.quantity ?? '-'} ${row.unit || ''}`.trim()

          // -- name and id
          const entry = row.ingredient ? byId.get(row.ingredient) : null
          if (!String(row.name || '').trim()) add(lang, i, 'missing-name', label, 'row has no name')
          if (!row.ingredient) {
            add(lang, i, 'missing-id', row.name, `"${row.name}" has no ingredient id`)
          } else if (!entry) {
            add(lang, i, 'unknown-id', row.ingredient, `ingredient id "${row.ingredient}" is not in the dictionary`)
          } else {
            const std = entry.names?.[lang]
            if (!std) add(lang, i, 'missing-name', row.ingredient, `dictionary has no ${lang} name for "${row.ingredient}"`)
            else if (row.name !== std) add(lang, i, 'non-standard-name', `${row.ingredient}:${row.name}`, `name "${row.name}" should be "${std}" (descriptive words go in the note)`)
          }

          // -- alignment with English
          if (lang !== 'en' && en[i]) {
            const e = en[i]
            if ((row.ingredient || null) !== (e.ingredient || null)) add(lang, i, 'misaligned', `id:${label}`, `id "${row.ingredient}" but English row ${i + 1} is "${e.ingredient}"`)
            if (row.quantity !== e.quantity || normalizeUnit(row.unit) !== normalizeUnit(e.unit)) {
              add(lang, i, 'misaligned', `amount:${label}`, `${unitText} but English row ${i + 1} is ${e.quantity ?? '-'} ${e.unit || ''}`.trim())
            }
          }

          // -- quantity and unit
          const q = row.quantity
          const fam = unitFamily(row.unit)
          if (q === 0) { add(lang, i, 'zero-quantity', label, `${label}: quantity 0 (use quantity null and unit "" for "to taste")`); return }
          if (fam === 'unknown') { add(lang, i, 'unknown-unit', `${label}:${row.unit}`, `${label}: unknown unit "${row.unit}"`); return }
          if (fam === 'none') {
            if (q !== null && q !== undefined && q !== '') add(lang, i, 'quantity-without-unit', label, `${label}: ${q} with no unit`)
            return
          }
          if (!entry) return
          const allowed = ALLOWED[entry.preferredUnit] || []
          if (!allowed.includes(fam)) {
            add(lang, i, 'bad-unit', `${row.ingredient}:${normalizeUnit(row.unit)}`,
              `${row.ingredient}: "${unitText}" should be in ${ALLOWED_TEXT[entry.preferredUnit] || entry.preferredUnit} (dictionary unit ${entry.preferredUnit})`)
          }
        })
      }
    }
  }
  return issues
}

/**
 * Splits issues into errors and baselined warnings. The baseline is a multiset of
 * keys: a recipe that had two known leftovers may keep two, not gain a third.
 */
export function applyBaseline(issues, baselineKeys = []) {
  const left = new Map()
  for (const k of baselineKeys) left.set(k, (left.get(k) || 0) + 1)
  const errors = [], warnings = []
  for (const issue of issues) {
    const n = left.get(issue.key) || 0
    if (n > 0) { left.set(issue.key, n - 1); warnings.push(issue) } else errors.push(issue)
  }
  return { errors, warnings }
}

// ---------------------------------------------------------------- CLI
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

export function loadPacks(dir = PACKS_DIR) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => ({ file: path.join(dir, f), ...readJson(path.join(dir, f)) }))
}

// Recipes whose JSON differs from the copy in the last commit (or is not there at all).
function changedSinceCommit(packs) {
  const changed = new Set()
  for (const pack of packs) {
    const rel = path.relative(ROOT, pack.file).split(path.sep).join('/')
    let old = []
    try { old = JSON.parse(execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] })).recipes || [] } catch { /* new pack file */ }
    const before = new Map(old.map((r) => [r.id, JSON.stringify(r)]))
    for (const r of pack.recipes || []) if (before.get(r.id) !== JSON.stringify(r)) changed.add(`${pack.id}|${r.id}`)
  }
  return changed
}

function parseSince(v) {
  const n = /^\d+$/.test(v) ? Number(v) : Date.parse(v)
  if (!Number.isFinite(n)) throw new Error(`--new-since: not a date or ms timestamp: ${v}`)
  return n
}

function main(argv) {
  const flag = (n) => argv.includes(n)
  const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }

  const dictionary = readJson(DICTIONARY_PATH)
  const packs = loadPacks()
  const recipeIds = opt('--recipe')?.split(',').map((s) => s.trim()).filter(Boolean)
  const packIds = opt('--pack')?.split(',').map((s) => s.trim()).filter(Boolean)
  const since = opt('--new-since') !== undefined ? parseSince(opt('--new-since')) : null
  const changed = flag('--changed') ? changedSinceCommit(packs) : null

  const only = (r, p) => (!recipeIds || recipeIds.includes(r.id))
    && (!packIds || packIds.includes(p.id) || packIds.includes(path.basename(p.file, '.json')))
    && (since === null || (typeof r.createdAt === 'number' ? r.createdAt : Date.parse(r.createdAt)) >= since)
    && (!changed || changed.has(`${p.id}|${r.id}`))

  const checked = packs.reduce((n, p) => n + (p.recipes || []).filter((r) => only(r, p)).length, 0)
  if ((recipeIds || packIds || since !== null || changed) && checked === 0) {
    console.error('check-recipes: no recipe matches the filter.')
    if (recipeIds || packIds) process.exit(1) // a named recipe or pack that is not there is a mistake
  }
  const issues = checkPacks(packs, dictionary, { only })

  if (flag('--update-baseline')) {
    if (recipeIds || packIds || since !== null || changed) throw new Error('--update-baseline must run on all packs (no filters)')
    const keys = issues.map((i) => i.key).sort()
    fs.writeFileSync(BASELINE_PATH, JSON.stringify({
      description: 'Known ingredient-standard leftovers in the built-in packs, as of when this file was generated. scripts/check-recipes.mjs reports these as warnings instead of errors. Regenerate with: npm run check-recipes -- --update-baseline (only after deliberately accepting the current state).',
      generated: new Date().toISOString().slice(0, 10),
      count: keys.length,
      keys,
    }, null, 2) + '\n')
    console.log(`Baseline written: ${keys.length} known issue(s) -> ${path.relative(ROOT, BASELINE_PATH)}`)
    return 0
  }

  const baseline = flag('--strict') || !fs.existsSync(BASELINE_PATH) ? [] : readJson(BASELINE_PATH).keys
  const { errors, warnings } = applyBaseline(issues, baseline)

  const printGroup = (list, heading) => {
    const byRecipe = new Map()
    for (const i of list) {
      const k = `${i.pack} / ${i.recipe}`
      if (!byRecipe.has(k)) byRecipe.set(k, { title: i.title, items: [] })
      byRecipe.get(k).items.push(i)
    }
    console.log(`\n${heading}`)
    for (const [k, { title, items }] of byRecipe) {
      console.log(`  ${k}  "${title}"`)
      for (const i of items) console.log(`    [${i.lang}${i.index === null ? '' : ` row ${i.index + 1}`}] ${i.code}: ${i.message}`)
    }
  }

  console.log(`check-recipes: ${checked} recipe(s) checked in ${packs.length} pack(s), dictionary ${dictionary.version}`)
  if (warnings.length) {
    const byCode = warnings.reduce((m, w) => { m[w.code] = (m[w.code] || 0) + 1; return m }, {})
    const byPack = warnings.reduce((m, w) => { m[w.pack] = (m[w.pack] || 0) + 1; return m }, {})
    console.log(`  ${warnings.length} known leftover(s) from the baseline (warnings): ${Object.entries(byCode).map(([c, n]) => `${c} ${n}`).join(', ')}`)
    console.log(`    by pack: ${Object.entries(byPack).map(([p, n]) => `${p} ${n}`).join(', ')}`)
    if (flag('--verbose')) printGroup(warnings, 'WARNINGS (baseline)')
    else console.log('    (--verbose lists them)')
  }
  if (errors.length) {
    printGroup(errors, `ERRORS (${errors.length})`)
    console.log('\nFix the rows above: see CLAUDE.md "Adding or editing recipes" and recipe-packs-template/INGREDIENT_UNITS.md.')
    return 1
  }
  console.log('  OK: no new problems.')
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = main(process.argv.slice(2)) } catch (e) { console.error(`check-recipes: ${e.message}`); process.exitCode = 1 }
}

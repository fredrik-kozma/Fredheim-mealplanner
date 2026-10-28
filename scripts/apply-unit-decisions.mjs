#!/usr/bin/env node
/*
 * Applies the approved unit decisions in scripts/data/unit-decisions.json to the
 * recipe packs and the ingredient dictionary. Idempotent: rows that already hold
 * the new values are left alone, and a pack's version is only bumped when this
 * run actually changed one of its rows.
 *
 * Each decision addresses pack + recipeId + rowIndex; the same index is changed in
 * `ingredients`, `translations.no.ingredients` and `translations.sv.ingredients`.
 * A decision is skipped (and reported) when any of the three rows does not hold
 * expect.ingredient / expect.quantity.
 *
 * Usage:
 *   node scripts/apply-unit-decisions.mjs            # apply
 *   node scripts/apply-unit-decisions.mjs --dry-run  # report only, write nothing
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeUnit } from '../src/utils/unitNormalizer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PACKS_DIR = path.join(ROOT, 'recipe-packs-template', 'packs')
const DICTIONARY_PATH = path.join(ROOT, 'src', 'data', 'ingredientDictionary.json')
const DECISIONS_PATH = path.join(__dirname, 'data', 'unit-decisions.json')
const LANGS = ['en', 'no', 'sv']
const TO_TASTE = { en: 'to taste', no: 'etter smak', sv: 'efter smak' }

const dryRun = process.argv.includes('--dry-run')
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n')

const decisionsFile = readJson(DECISIONS_PATH)
const dictionary = readJson(DICTIONARY_PATH)
const byId = new Map(dictionary.entries.map((e) => [e.id, e]))

// "ALL ..." -> every group; otherwise an array or a "A, B, C" string of group letters.
function approvedGroupFilter(approved) {
  if (typeof approved === 'string' && /^\s*ALL\b/i.test(approved)) return () => true
  const list = Array.isArray(approved) ? approved : String(approved || '').split(/[\s,]+/)
  const set = new Set(list.map((g) => String(g).trim().toUpperCase()).filter(Boolean))
  return (group) => set.has(String(group).toUpperCase())
}
const isApproved = approvedGroupFilter(decisionsFile.approvedGroups)

const rowsOf = (recipe) => ({
  en: recipe.ingredients,
  no: recipe.translations?.no?.ingredients,
  sv: recipe.translations?.sv?.ingredients,
})

// The row as it should look after the change, keeping the house key order.
function targetRow(row, change, lang) {
  const ingredient = change.ingredient || row.ingredient
  const name = change.ingredient ? byId.get(change.ingredient).names[lang] : row.name
  let note
  if (change.note === 'to-taste') note = TO_TASTE[lang]
  else if (change.note !== undefined) note = change.note?.[lang] ?? change.note
  else if (change.ingredient) note = undefined // new ingredient: old note goes
  else note = row.note
  const toTaste = change.note === 'to-taste'
  const { quantity: _q, unit: _u, ingredient: _i, name: _n, note: _note, ...rest } = row
  const out = {
    quantity: toTaste ? null : change.quantity,
    unit: toTaste ? '' : change.unit,
    ingredient,
    name,
  }
  if (note !== undefined && note !== null && note !== '') out.note = note
  return { ...out, ...rest }
}

const packs = new Map() // file -> { data, changed }
function loadPack(name) {
  const file = path.join(PACKS_DIR, `${name}.json`)
  if (!packs.has(file)) packs.set(file, { data: readJson(file), changed: false, name })
  return packs.get(file)
}

const applied = [], already = [], skipped = [], notApproved = [], dictOnly = []

for (const d of decisionsFile.decisions) {
  const tag = `${d.decision} ${d.pack} / ${d.recipeId} row ${d.rowIndex}`
  if (!isApproved(d.group)) { notApproved.push(tag); continue }
  if (d.noRowChange) { dictOnly.push(tag); continue }

  const pack = loadPack(d.pack)
  const recipe = pack.data.recipes.find((r) => r.id === d.recipeId)
  if (!recipe) { skipped.push(`${tag}: recipe not found`); continue }
  if (d.change.ingredient && !byId.has(d.change.ingredient)) { skipped.push(`${tag}: ${d.change.ingredient} not in dictionary`); continue }

  const lists = rowsOf(recipe)
  const rows = Object.fromEntries(LANGS.map((l) => [l, lists[l]?.[d.rowIndex]]))
  const targets = Object.fromEntries(LANGS.map((l) => [l, rows[l] && targetRow(rows[l], d.change, l)]))

  if (LANGS.every((l) => rows[l] && JSON.stringify(rows[l]) === JSON.stringify(targets[l]))) {
    already.push(tag)
    continue
  }
  const bad = LANGS.filter((l) => !rows[l] || rows[l].ingredient !== d.expect.ingredient || rows[l].quantity !== d.expect.quantity)
  if (bad.length) {
    const seen = bad.map((l) => `${l}: ${rows[l] ? `${rows[l].ingredient} ${rows[l].quantity} ${rows[l].unit}` : 'no row'}`).join('; ')
    skipped.push(`${tag}: expected ${d.expect.ingredient} ${d.expect.quantity}, found ${seen}`)
    continue
  }
  const unitDiff = LANGS.filter((l) => normalizeUnit(rows[l].unit) !== normalizeUnit(d.expect.unit))
  if (unitDiff.length) console.warn(`  note: ${tag}: unit differs from expected "${d.expect.unit}" in ${unitDiff.join(', ')} (applied anyway)`)

  for (const l of LANGS) lists[l][d.rowIndex] = targets[l]
  pack.changed = true
  applied.push(tag)
}

// Dictionary changes
const dictApplied = [], dictAlready = [], dictSkipped = []
let dictChanged = false
for (const c of decisionsFile.dictionaryChanges || []) {
  const tag = `${c.id}.${c.field} ${c.from} -> ${c.to}`
  if (c.group && !isApproved(c.group)) { notApproved.push(`dictionary ${tag}`); continue }
  const entry = byId.get(c.id)
  if (!entry) { dictSkipped.push(`${tag}: id not in dictionary`); continue }
  if (entry[c.field] === c.to) { dictAlready.push(tag); continue }
  if (entry[c.field] !== c.from) { dictSkipped.push(`${tag}: current value is ${entry[c.field]}`); continue }
  entry[c.field] = c.to
  dictChanged = true
  dictApplied.push(tag)
}

// Write, bumping the minor version of every pack this run changed.
const bumped = []
for (const [file, pack] of packs) {
  if (!pack.changed) continue
  const [major, minor] = String(pack.data.version).split('.').map(Number)
  const from = pack.data.version
  pack.data.version = `${major}.${minor + 1}.0`
  bumped.push(`${pack.name}: ${from} -> ${pack.data.version}`)
  if (!dryRun) writeJson(file, pack.data)
}
if (dictChanged && !dryRun) writeJson(DICTIONARY_PATH, dictionary)

const section = (title, list) => { if (list.length) console.log(`${title} (${list.length}):\n${list.map((s) => `  ${s}`).join('\n')}`) }
console.log(`apply-unit-decisions${dryRun ? ' (dry run, nothing written)' : ''}: approvedGroups = ${JSON.stringify(decisionsFile.approvedGroups)}`)
section('Applied', applied)
section('Already done', already)
section('Dictionary only (no row change)', dictOnly)
section('SKIPPED', skipped)
section('Not approved', notApproved)
section('Dictionary applied', dictApplied)
section('Dictionary already done', dictAlready)
section('Dictionary SKIPPED', dictSkipped)
section('Pack versions bumped', bumped)
if (!applied.length && !dictApplied.length) console.log('Nothing to change.')

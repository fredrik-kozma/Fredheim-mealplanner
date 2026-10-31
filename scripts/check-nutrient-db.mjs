#!/usr/bin/env node
/**
 * Every dictionary id must have: composition row, MICRO entry, and a source.
 * Run from project root: node scripts/check-nutrient-db.mjs
 * Also wired into `npm run check-recipes` by apply-all.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
// When living in scripts/_tmp, ROOT is project; when in nutridb-phase-a alone, adjust:
const candidates = [
  ROOT,
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'),
  process.cwd(),
]
function findRoot() {
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'src/data/ingredientDictionary.json'))) return c
  }
  return process.cwd()
}
const root = findRoot()
const dict = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ingredientDictionary.json'), 'utf8'))
const compPath = path.join(root, 'scripts/data/food-composition-core.json')
const sourcesPath = path.join(root, 'scripts/data/food-sources.json')
if (!fs.existsSync(compPath)) {
  console.error('missing food-composition-core.json')
  process.exit(1)
}
if (!fs.existsSync(sourcesPath)) {
  console.error('missing food-sources.json — run apply-all first')
  process.exit(1)
}
const comp = JSON.parse(fs.readFileSync(compPath, 'utf8'))
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'))
const { MICRO } = await import(pathToFileURL(path.join(root, 'scripts/lib/micronutrients.mjs')).href + '?t=' + Date.now())

const missing = []
for (const e of dict.entries) {
  const id = e.id
  if (!(id in MICRO)) missing.push(['micro', id])
  if (!comp.foods?.[id]) missing.push(['composition', id])
  const s = sources.entries?.[id]?.micro || sources.entries?.[id]
  const db = s?.db || s?.micro?.db
  if (!s || db === 'missing' || db === 'unresolved') missing.push(['source', id])
}
if (missing.length) {
  console.error('nutrient-db coverage gaps:', missing.length)
  for (const m of missing.slice(0, 40)) console.error(' -', m.join(':'))
  if (missing.length > 40) console.error(' ...', missing.length - 40, 'more')
  process.exit(1)
}
console.log('nutrient-db coverage OK:', dict.entries.length, 'ids (composition + micros + source)')

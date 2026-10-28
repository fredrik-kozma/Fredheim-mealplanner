#!/usr/bin/env node
/**
 * Apply Swedish translations from scripts/data/sv-translations.json into the
 * shipped recipe packs. Idempotent: only fills missing/English sv fields.
 * Never touches en/no text or quantities/units/ids.
 *
 * Usage (from repo root):
 *   node scripts/apply-sv-translations.mjs --dry-run
 *   node scripts/apply-sv-translations.mjs
 *   node scripts/apply-sv-translations.mjs --pack fredheim-recipes-with-pictures
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// When copied into scripts/, ROOT is the repo root.
const ROOT = path.resolve(__dirname, '..')
const DATA = path.join(__dirname, 'data', 'sv-translations.json')
const PACKS_DIR = path.join(ROOT, 'recipe-packs-template', 'packs')

const dryRun = process.argv.includes('--dry-run')
const packFilter = (() => {
  const i = process.argv.indexOf('--pack')
  return i >= 0 ? process.argv[i + 1] : null
})()

function bumpVersion(v) {
  const parts = String(v || '1.0.0').split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[1] += 1 // minor bump for translation fill
  parts[2] = 0
  return parts.join('.')
}

function isEnglishTitle(sv, en) {
  return !sv || sv === en
}

function applyRecipe(recipe, patch) {
  if (!recipe.translations) recipe.translations = {}
  if (!recipe.translations.sv) recipe.translations.sv = {}
  const sv = recipe.translations.sv
  const changes = []

  if (patch.title && isEnglishTitle(sv.title, recipe.title)) {
    sv.title = patch.title
    changes.push('title')
  }

  if (patch.description && !sv.description) {
    sv.description = patch.description
    changes.push('description')
  }

  if (Array.isArray(patch.steps) && patch.steps.length) {
    const missing = !Array.isArray(sv.steps) || sv.steps.length === 0
    const sameAsEn =
      Array.isArray(sv.steps) &&
      Array.isArray(recipe.steps) &&
      sv.steps.length === recipe.steps.length &&
      sv.steps.every((s, i) => s === recipe.steps[i])
    if (missing || sameAsEn) {
      if (patch.steps.length !== (recipe.steps || []).length) {
        throw new Error(
          `${recipe.id}: steps length ${patch.steps.length} != en ${recipe.steps?.length}`
        )
      }
      sv.steps = patch.steps.slice()
      changes.push(`steps(${patch.steps.length})`)
    }
  }

  if (patch.ingredientNotes && typeof patch.ingredientNotes === 'object') {
    if (!Array.isArray(sv.ingredients)) {
      // copy structure from en if sv ingredients somehow missing
      sv.ingredients = (recipe.ingredients || []).map((row) => ({ ...row }))
    }
    for (const [idxStr, note] of Object.entries(patch.ingredientNotes)) {
      const i = Number(idxStr)
      if (!sv.ingredients[i]) continue
      if (!sv.ingredients[i].note) {
        sv.ingredients[i].note = note
        changes.push(`note[${i}]`)
      }
    }
  }

  return changes
}

const payload = JSON.parse(fs.readFileSync(DATA, 'utf8'))
const summary = []

for (const [packFile, packData] of Object.entries(payload.packs)) {
  if (packFilter && packFile !== packFilter && !packFile.includes(packFilter)) continue
  const packPath = path.join(PACKS_DIR, `${packFile}.json`)
  if (!fs.existsSync(packPath)) {
    console.error('Missing pack file:', packPath)
    process.exit(1)
  }
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'))
  const byId = new Map(pack.recipes.map((r) => [r.id, r]))
  let recipesChanged = 0
  const detail = []

  for (const patch of packData.recipes) {
    const recipe = byId.get(patch.recipeId)
    if (!recipe) {
      console.warn(`Skip unknown recipe ${patch.recipeId} in ${packFile}`)
      continue
    }
    const changes = applyRecipe(recipe, patch)
    if (changes.length) {
      recipesChanged++
      detail.push(`${patch.recipeId}: ${changes.join(', ')}`)
    }
  }

  if (recipesChanged) {
    const oldVer = pack.version
    pack.version = bumpVersion(pack.version)
    summary.push({
      pack: packFile,
      recipesChanged,
      version: `${oldVer} → ${pack.version}`,
    })
    if (!dryRun) {
      fs.writeFileSync(packPath, JSON.stringify(pack, null, 2) + '\n')
    }
    if (process.argv.includes('--verbose')) {
      detail.forEach((d) => console.log(' ', d))
    }
  } else {
    summary.push({ pack: packFile, recipesChanged: 0, version: pack.version })
  }
}

console.log(dryRun ? 'DRY RUN — no files written' : 'Applied.')
console.log(JSON.stringify(summary, null, 2))
console.log(
  'Next: npm run check-recipes -- --update-baseline && npm test && npm run check-recipes && npm run build'
)

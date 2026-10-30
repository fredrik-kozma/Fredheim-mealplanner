#!/usr/bin/env node
/*
 * One-off: psyllium husk goes from spoons to grams, the way agar-agar did. It is
 * sold by weight, so the shopping list should add it up in grams; the recipe view
 * shows the spoon beside it (src/utils/gramSpoonHint.js).
 *
 * Factor: the dictionary's own, 1 tbsp = 8 g (1 tsp = 2.7 g), whole grams.
 * 0.5 dl = 50 ml at the same density (0.54 g/ml) = 27 g.
 *
 * Idempotent: a row already in grams is left alone, and a pack's version is only
 * bumped when this run changed one of its rows. Any other row stops the run.
 *
 * Usage:
 *   node scripts/convert_psyllium_to_grams.mjs            # apply
 *   node scripts/convert_psyllium_to_grams.mjs --dry-run  # report only, write nothing
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeUnit } from '../src/utils/unitNormalizer.js'
import { formatGramSpoonHint } from '../src/utils/gramSpoonHint.js'
import { estimateRecipe } from './lib/recipeNutritionEstimate.mjs'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PACKS_DIR = path.join(ROOT, 'recipe-packs-template', 'packs')
const ID = 'psyllium-husk'
const dryRun = process.argv.includes('--dry-run')

// pack -> recipe id -> [old quantity, old unit, grams]
const CONVERSIONS = {
  'fredheim-recipes-with-pictures': {
    'fr-23': [1, 'tsp', 3],
    'gluten-free-oat-buns': [1.5, 'tsp', 4],
    'millet-crackers-hirseknekk': [1, 'tsp', 3],
    'fr-111': [1.5, 'tbsp', 12],
    'red-beet-burger': [0.5, 'dl', 27],
    'swedish-oven-pancake': [1.5, 'tbsp', 12],
    'toms-gluten-free-bread': [2, 'tbsp', 16],
    'ultimate-fluffy-vegan-gluten-free-bread': [1.5, 'tbsp', 12],
    'squash-cake': [1.5, 'tbsp', 12],
    'fluffy-gluten-free-loaf': [1.5, 'tbsp', 12],
  },
  'fredheim-reversal-protocol': {
    'orn-17': [1.5, 'tbsp', 12],
    'orn-19': [3, 'tbsp', 24],
    'orn-33': [2, 'tbsp', 16],
    'orn-34': [2, 'tbsp', 16],
    'orn-42': [1.5, 'tsp', 4],
    'orn-48': [2, 'tsp', 5],
    'orn-66': [2.25, 'tbsp', 18],
  },
}

const rowsOf = (r) => [r.ingredients, r.translations.no.ingredients, r.translations.sv.ingredients]

for (const [packId, conversions] of Object.entries(CONVERSIONS)) {
  const file = path.join(PACKS_DIR, `${packId}.json`)
  const pack = JSON.parse(fs.readFileSync(file, 'utf8'))
  let changed = 0

  for (const r of pack.recipes) {
    const rows = rowsOf(r).flatMap((list) => list.filter((row) => row.ingredient === ID))
    const conversion = conversions[r.id]
    if (!conversion) {
      if (rows.length) throw new Error(`${r.id}: psyllium row not in the conversion list`)
      continue
    }
    const [oldQuantity, oldUnit, grams] = conversion
    if (rows.length !== 3) throw new Error(`${r.id}: expected 3 psyllium rows, found ${rows.length}`)
    if (rows.every((row) => row.quantity === grams && row.unit === 'g')) continue
    for (const row of rows) {
      if (row.quantity !== oldQuantity || normalizeUnit(row.unit) !== normalizeUnit(oldUnit)) {
        throw new Error(`${r.id}: expected ${oldQuantity} ${oldUnit}, found ${row.quantity} ${row.unit}`)
      }
    }

    const before = estimateRecipe(r).totals
    for (const row of rows) { row.quantity = grams; row.unit = 'g' }
    const after = estimateRecipe(r).totals
    changed++

    const servings = r.servings || 1
    const perServing = (k) => ((after[k] - before[k]) / servings).toFixed(2)
    const hints = ['en', 'no', 'sv'].map((lang) => formatGramSpoonHint({ quantity: grams, unit: 'g', ingredientId: ID, lang }))
    console.log(`${r.id}: ${oldQuantity} ${oldUnit} -> ${grams} g ${hints.join(' ')}; per serving kcal ${perServing('kcal')}, fibre ${perServing('fiber')}`)
  }

  if (changed) {
    const [major, minor] = String(pack.version).split('.').map(Number)
    const from = pack.version
    pack.version = `${major}.${minor + 1}.0`
    console.log(`${packId}: ${changed} recipe(s), version ${from} -> ${pack.version}`)
    if (!dryRun) fs.writeFileSync(file, JSON.stringify(pack, null, 2) + '\n')
  }
}

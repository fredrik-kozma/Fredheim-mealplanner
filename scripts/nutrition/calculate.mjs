// Calculate per-serving nutrition for every recipe in the Fredheim pack
// and write it back into the JSON. Re-run safely whenever new recipes are added.
//
// Usage:
//   node scripts/nutrition/calculate.mjs
//   node scripts/nutrition/calculate.mjs --dry-run     # don't write the file
//   node scripts/nutrition/calculate.mjs --report      # show per-recipe diagnostics

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { INGREDIENT_DB, lookupIngredient } from './ingredients.mjs'
import { toGrams } from './units.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RECIPE_PATH = join(__dirname, '..', '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const REPORT  = args.includes('--report')

const ALL_KEYS = Object.keys({
  calories: 0, protein: 0, totalFat: 0, saturatedFat: 0,
  polyunsaturatedFat: 0, monounsaturatedFat: 0, omega3: 0,
  cholesterol: 0, totalCarbs: 0, totalSugars: 0, addedSugar: 0, fiber: 0,
  calcium: 0, potassium: 0, copper: 0, iron: 0, magnesium: 0, manganese: 0,
  selenium: 0, phosphorus: 0, zinc: 0, sodium: 0,
  vitaminA: 0, vitaminB6: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
  vitaminE: 0, vitaminK: 0, folate: 0, thiamin: 0, riboflavin: 0,
  niacin: 0, choline: 0,
})

function calcRecipeNutrition(recipe, stats) {
  const totals = Object.fromEntries(ALL_KEYS.map(k => [k, 0]))
  let matchedCount = 0
  let validIngredients = 0
  let unmatchedNames = []
  let unparsableUnits = []

  for (const ing of (recipe.ingredients || [])) {
    const name = (ing.name || '').trim()
    if (!name) continue

    // Skip purely numeric "names" that are corrupted import data, not real ingredients
    if (/^\d+(\.\d+)?$/.test(name)) {
      stats.corruptedSkipped++
      continue
    }
    // Skip Norwegian descriptors that ended up in the name field. These are
    // preparation method words from the source data, not real ingredients.
    if (/^(kok|i\s|finhakket|hakket|skiver|terninger|biter|varm|kald|silt|silet|siktet|most|skrell|skåret|grovhakket|blanchert|smelt|fast|finmalt|revet|knust|m$|stor$|stort$|liten$|kvistsalat|ristet|strimlet|smuldret|lunken|uten\s|blader$|moden|bløtlagt|brunoise|halvert|frossen|valgfri|stilken|kvart|fin$|fint$|uskrellet|plante$|små\s)/i.test(name)) {
      stats.corruptedSkipped++
      continue
    }

    validIngredients++
    const match = lookupIngredient(name)
    if (!match) {
      unmatchedNames.push(name)
      stats.missingIngredients.set(name, (stats.missingIngredients.get(name) || 0) + 1)
      continue
    }

    const grams = toGrams(ing.quantity, ing.unit, name)
    if (grams === null) {
      unparsableUnits.push(`${ing.quantity} ${ing.unit} ${name}`)
      stats.unparsableUnits.set(`${ing.unit}`, (stats.unparsableUnits.get(ing.unit) || 0) + 1)
      continue
    }
    if (grams === 0) continue

    matchedCount++
    const factor = grams / 100  // DB values are per 100g

    for (const k of ALL_KEYS) {
      const v = match[k]
      if (typeof v === 'number') totals[k] += v * factor
    }
  }

  // Round per-recipe totals, then divide by servings → per serving
  const servings = Math.max(1, recipe.servings || 1)
  const perServing = {}
  for (const k of ALL_KEYS) {
    const val = totals[k] / servings
    // Round: integers if >=10, 1 decimal if >=1, 2 decimals otherwise
    if (val === 0) {
      perServing[k] = 0
    } else if (Math.abs(val) >= 10) {
      perServing[k] = Math.round(val)
    } else if (Math.abs(val) >= 1) {
      perServing[k] = Math.round(val * 10) / 10
    } else {
      perServing[k] = Math.round(val * 100) / 100
    }
  }

  return {
    nutrition: perServing,
    diagnostics: {
      matchedCount,
      totalIngredients: validIngredients,  // exclude corrupted entries from coverage calc
      unmatchedNames,
      unparsableUnits,
    },
  }
}

function main() {
  console.log('Reading', RECIPE_PATH)
  const raw = readFileSync(RECIPE_PATH, 'utf-8')
  const data = JSON.parse(raw)

  console.log(`Calculating nutrition for ${data.recipes.length} recipes…`)
  console.log(`Ingredient database has ${Object.keys(INGREDIENT_DB).length} entries.`)

  const stats = {
    missingIngredients: new Map(),
    unparsableUnits: new Map(),
    corruptedSkipped: 0,
    perRecipe: [],
  }

  let recipesWithGoodCoverage = 0
  let recipesWithLowCoverage = 0

  for (const recipe of data.recipes) {
    const { nutrition, diagnostics } = calcRecipeNutrition(recipe, stats)
    recipe.nutrition = nutrition

    const coverage = diagnostics.totalIngredients > 0
      ? diagnostics.matchedCount / diagnostics.totalIngredients
      : 0

    if (coverage >= 0.7) recipesWithGoodCoverage++
    else recipesWithLowCoverage++

    stats.perRecipe.push({
      title: recipe.title,
      kcal: nutrition.calories,
      coverage: Math.round(coverage * 100),
      ...diagnostics,
    })
  }

  console.log(`\n✓ Calculated. Coverage:`)
  console.log(`  Good (≥70% ingredients matched): ${recipesWithGoodCoverage}`)
  console.log(`  Low  (<70% ingredients matched): ${recipesWithLowCoverage}`)

  // Top 20 most common missing ingredients (so we know what to add next)
  console.log('\nTop missing ingredients (consider adding to database):')
  const sortedMissing = [...stats.missingIngredients.entries()].sort((a, b) => b[1] - a[1])
  sortedMissing.slice(0, 20).forEach(([name, count]) => console.log(`  ${count.toString().padStart(3)}× ${name}`))

  // Top weird units
  if (stats.unparsableUnits.size > 0) {
    console.log('\nUnparsable units (corrupted data, treated as 0g):')
    const sortedUnits = [...stats.unparsableUnits.entries()].sort((a, b) => b[1] - a[1])
    sortedUnits.slice(0, 10).forEach(([unit, count]) => console.log(`  ${count.toString().padStart(3)}× ${unit}`))
  }

  if (REPORT) {
    console.log('\n--- Per-recipe report ---')
    stats.perRecipe.forEach(r => {
      const flag = r.coverage < 50 ? '⚠️ ' : '   '
      console.log(`${flag}${r.coverage.toString().padStart(3)}%  ${r.kcal.toString().padStart(4)} kcal  ${r.title}`)
    })
  }

  if (DRY_RUN) {
    console.log('\n[dry-run] Skipping file write.')
    return
  }

  // Bump the pack version so installed users can update
  const oldVersion = data.version || '1.0.0'
  data.version = bumpVersion(oldVersion)
  console.log(`\nBumping pack version: ${oldVersion} → ${data.version}`)

  writeFileSync(RECIPE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`✓ Wrote ${RECIPE_PATH}`)
}

function bumpVersion(v) {
  const parts = v.split('.').map(Number)
  while (parts.length < 3) parts.push(0)
  parts[2]++  // bump patch
  return parts.join('.')
}

main()

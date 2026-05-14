// Merge an updated Fredheim recipe JSON into the current pack.
//
// Rules:
//  - The NEW JSON is the source of truth for which recipes exist (user
//    deliberately removed some; we honor that).
//  - imageUrl, title, ingredients, steps, etc. come from the NEW JSON.
//  - nutrition, nutritionPer100g, totalWeight, servingWeight come from the
//    CURRENT pack (the new JSON doesn't have them).
//  - Recipes in the new JSON that aren't in the current pack get added
//    as-is (no nutrition data; can be recalculated later if needed).

import fs from 'node:fs'
import path from 'node:path'

const NEW_JSON  = 'C:\\Users\\fredr\\Downloads\\senaste-fredheim-bilder-uppdatering.json'
const PACK_PATH = path.resolve('recipe-packs-template/packs/fredheim-recipes-with-pictures.json')

const newPack     = JSON.parse(fs.readFileSync(NEW_JSON,  'utf8'))
const currentPack = JSON.parse(fs.readFileSync(PACK_PATH, 'utf8'))

const currentById = new Map(currentPack.recipes.map(r => [r.id, r]))

let kept = 0, removed = 0, added = 0, imagesUpdated = 0, nutritionPreserved = 0

// Build the merged recipe list, in the order of the new JSON
const mergedRecipes = newPack.recipes.map(newRecipe => {
  const current = currentById.get(newRecipe.id)

  if (!current) {
    added++
    return newRecipe  // brand-new recipe, no existing nutrition
  }

  kept++

  // Track if image was updated
  if (newRecipe.imageUrl && newRecipe.imageUrl !== current.imageUrl) {
    imagesUpdated++
  }

  // Preserve nutrition fields from current pack
  const merged = { ...newRecipe }
  if (current.nutrition)        { merged.nutrition        = current.nutrition;        nutritionPreserved++ }
  if (current.nutritionPer100g) { merged.nutritionPer100g = current.nutritionPer100g }
  if (current.totalWeight   != null) { merged.totalWeight   = current.totalWeight }
  if (current.servingWeight != null) { merged.servingWeight = current.servingWeight }

  return merged
})

// Count removed (in current pack but not in new JSON)
const newIds = new Set(newPack.recipes.map(r => r.id))
const removedRecipes = currentPack.recipes.filter(r => !newIds.has(r.id))
removed = removedRecipes.length

// Bump version
const [maj, min, patch] = currentPack.version.split('.').map(Number)
const newVersion = `${maj}.${min}.${patch + 1}`

const outputPack = {
  ...currentPack,
  version: newVersion,
  recipes: mergedRecipes,
}

fs.writeFileSync(PACK_PATH, JSON.stringify(outputPack, null, 2), 'utf8')

console.log('=== Merge complete ===')
console.log(`Pack version: ${currentPack.version} → ${newVersion}`)
console.log(`Recipes kept:        ${kept}`)
console.log(`Recipes added:       ${added}`)
console.log(`Recipes removed:     ${removed}`)
console.log(`Total recipes now:   ${mergedRecipes.length}`)
console.log(`Images updated:      ${imagesUpdated}`)
console.log(`Nutrition preserved: ${nutritionPreserved}`)
if (removedRecipes.length) {
  console.log('\nRemoved recipes:')
  for (const r of removedRecipes) console.log(`  - ${r.id}: ${r.title}`)
}

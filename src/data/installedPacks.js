/**
 * Built-in demo packs — available offline, no server required.
 *
 * This file also documents the exact JSON format you need when creating
 * your own GitHub-hosted registry. See recipe-packs-template/ at the
 * project root for the ready-to-upload files.
 */

// Import Fredheim Recipes with Pictures pack
import fredheimRecipesWithPicturesData from '../../recipe-packs-template/packs/fredheim-recipes-with-pictures.json'

// ---------------------------------------------------------------------------
// Pack — Fredheim Recipes with Pictures
// ---------------------------------------------------------------------------
export const FREDHEIM_RECIPES_WITH_PICTURES_PACK = fredheimRecipesWithPicturesData

// ---------------------------------------------------------------------------
// Registry index — mirrors what registry.json on GitHub should contain
// ---------------------------------------------------------------------------
export const BUILT_IN_REGISTRY = [
  {
    id: FREDHEIM_RECIPES_WITH_PICTURES_PACK.id,
    name: FREDHEIM_RECIPES_WITH_PICTURES_PACK.name,
    description: FREDHEIM_RECIPES_WITH_PICTURES_PACK.description,
    author: FREDHEIM_RECIPES_WITH_PICTURES_PACK.author,
    version: FREDHEIM_RECIPES_WITH_PICTURES_PACK.version,
    tags: FREDHEIM_RECIPES_WITH_PICTURES_PACK.tags,
    recipeCount: FREDHEIM_RECIPES_WITH_PICTURES_PACK.recipes.length,
  },
]

// Lookup map for quick access by id
export const BUILT_IN_PACKS = {
  [FREDHEIM_RECIPES_WITH_PICTURES_PACK.id]: FREDHEIM_RECIPES_WITH_PICTURES_PACK,
}

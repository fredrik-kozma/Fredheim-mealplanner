/**
 * Built-in demo packs — available offline, no server required.
 *
 * This file also documents the exact JSON format you need when creating
 * your own GitHub-hosted registry. See recipe-packs-template/ at the
 * project root for the ready-to-upload files.
 */

// Import Fredheim Recipes with Pictures pack
import fredheimRecipesWithPicturesData from '../../recipe-packs-template/packs/fredheim-recipes-with-pictures.json'

// Import Fredheim Reversal Protocol pack (Ornish-aligned)
import fredheimReversalProtocolData from '../../recipe-packs-template/packs/fredheim-reversal-protocol.json'

// Import Fredheim FMD 5-day pack (Longo Fasting Mimicking Diet)
import fredheimFmd5DayData from '../../recipe-packs-template/packs/fredheim-fmd-5day.json'

// ---------------------------------------------------------------------------
// Pack — Fredheim Recipes with Pictures
// ---------------------------------------------------------------------------
export const FREDHEIM_RECIPES_WITH_PICTURES_PACK = fredheimRecipesWithPicturesData

// ---------------------------------------------------------------------------
// Pack — Fredheim Reversal Protocol
// ---------------------------------------------------------------------------
export const FREDHEIM_REVERSAL_PROTOCOL_PACK = fredheimReversalProtocolData

// ---------------------------------------------------------------------------
// Pack — Fredheim FMD (Fasting Mimicking Diet) 5-Day Plan
// ---------------------------------------------------------------------------
export const FREDHEIM_FMD_5DAY_PACK = fredheimFmd5DayData

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
  {
    id: FREDHEIM_REVERSAL_PROTOCOL_PACK.id,
    name: FREDHEIM_REVERSAL_PROTOCOL_PACK.name,
    description: FREDHEIM_REVERSAL_PROTOCOL_PACK.description,
    author: FREDHEIM_REVERSAL_PROTOCOL_PACK.author,
    version: FREDHEIM_REVERSAL_PROTOCOL_PACK.version,
    tags: FREDHEIM_REVERSAL_PROTOCOL_PACK.tags,
    translations: FREDHEIM_REVERSAL_PROTOCOL_PACK.translations,
    recipeCount: FREDHEIM_REVERSAL_PROTOCOL_PACK.recipes.length,
  },
  {
    id: FREDHEIM_FMD_5DAY_PACK.id,
    name: FREDHEIM_FMD_5DAY_PACK.name,
    description: FREDHEIM_FMD_5DAY_PACK.description,
    author: FREDHEIM_FMD_5DAY_PACK.author,
    version: FREDHEIM_FMD_5DAY_PACK.version,
    tags: FREDHEIM_FMD_5DAY_PACK.tags,
    translations: FREDHEIM_FMD_5DAY_PACK.translations,
    recipeCount: FREDHEIM_FMD_5DAY_PACK.recipes.length,
  },
]

// Lookup map for quick access by id
export const BUILT_IN_PACKS = {
  [FREDHEIM_RECIPES_WITH_PICTURES_PACK.id]: FREDHEIM_RECIPES_WITH_PICTURES_PACK,
  [FREDHEIM_REVERSAL_PROTOCOL_PACK.id]: FREDHEIM_REVERSAL_PROTOCOL_PACK,
  [FREDHEIM_FMD_5DAY_PACK.id]: FREDHEIM_FMD_5DAY_PACK,
}

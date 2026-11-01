/**
 * Built-in demo packs — available offline, no server required.
 *
 * Photos used to be base64 data URLs inside these JSON files (~25 MB in the
 * main JS bundle). They now live under /pack-images/<recipeId>.jpg and the
 * pack JSON only stores that path, so the JS stays a couple of megabytes.
 *
 * See recipe-packs-template/ at the project root for the ready-to-upload
 * files and the GitHub registry format.
 */

import fredheimRecipesWithPicturesData from '../../recipe-packs-template/packs/fredheim-recipes-with-pictures.json'
import fredheimReversalProtocolData from '../../recipe-packs-template/packs/fredheim-reversal-protocol.json'
import fredheimFmd5DayData from '../../recipe-packs-template/packs/fredheim-fmd-5day.json'

// Pack ids are stored in users' saved data (sourcePackId, installedPacks).
// "fredheim-recepies-with-pictures" is misspelled on purpose — never rename it.
export const FREDHEIM_PACK_ID = fredheimRecipesWithPicturesData.id
export const REVERSAL_PACK_ID = fredheimReversalProtocolData.id
export const FMD_PACK_ID = fredheimFmd5DayData.id

export const FREDHEIM_RECIPES_WITH_PICTURES_PACK = fredheimRecipesWithPicturesData
export const FREDHEIM_REVERSAL_PROTOCOL_PACK = fredheimReversalProtocolData
export const FREDHEIM_FMD_5DAY_PACK = fredheimFmd5DayData

function registryEntry(pack) {
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    author: pack.author,
    version: pack.version,
    tags: pack.tags,
    translations: pack.translations,
    recipeCount: pack.recipes.length,
  }
}

export const BUILT_IN_REGISTRY = [
  registryEntry(FREDHEIM_RECIPES_WITH_PICTURES_PACK),
  registryEntry(FREDHEIM_REVERSAL_PROTOCOL_PACK),
  registryEntry(FREDHEIM_FMD_5DAY_PACK),
]

export const BUILT_IN_PACKS = {
  [FREDHEIM_RECIPES_WITH_PICTURES_PACK.id]: FREDHEIM_RECIPES_WITH_PICTURES_PACK,
  [FREDHEIM_REVERSAL_PROTOCOL_PACK.id]: FREDHEIM_REVERSAL_PROTOCOL_PACK,
  [FREDHEIM_FMD_5DAY_PACK.id]: FREDHEIM_FMD_5DAY_PACK,
}

/** Async alias so callers that await packs keep working. */
export async function loadBuiltInPacks() {
  return BUILT_IN_PACKS
}

export async function loadBuiltInPack(id) {
  return BUILT_IN_PACKS[id] || null
}

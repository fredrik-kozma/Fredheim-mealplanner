/* Removes both Roti recipes from the Fredheim pack (author's call: not
 * healthy enough to keep) — the complete one (fr-148) and a duplicate that
 * shipped with 0 ingredients and 0 steps (mjsge3obgsomp5ixacb), found
 * during the earlier "sort by time" work.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const REMOVE = new Set(['fr-148', 'mjsge3obgsomp5ixacb'])
const before = pack.recipes.length
pack.recipes = pack.recipes.filter(r => !REMOVE.has(r.id))
const removed = before - pack.recipes.length

pack.version = '1.15.0'
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
console.log(`removed ${removed} recipe(s) -> ${pack.recipes.length} remain | pack -> ${pack.version}`)

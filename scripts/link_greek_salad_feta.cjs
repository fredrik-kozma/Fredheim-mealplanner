/* Link "Classic Greek Salad" to the "Tofu Feta Cheese" recipe.
 *
 * The salad's steps already talk about feta — "all the ingredients
 * (except feta)", "Serve feta cheese separately" — but there was nowhere
 * to find out how to make it. relatedRecipes is the mechanism already in
 * the app for exactly this (the sourdough loaves point at the starter
 * guide the same way); RecipeDetail resolves the ids against the live
 * recipe list, so the link follows the reader's language and survives the
 * target being renamed.
 *
 * One-way on purpose. The pack's reciprocal links are sibling pairs — the
 * pressure-cooker and stovetop versions of one porridge, where each is an
 * alternative to the other. A component link points the other way only:
 * the bread needs the starter, the starter does not need the bread.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const SALAD = 'fr-49'
const FETA = 'fr-173'

const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const salad = pack.recipes.find(r => r.id === SALAD)
const feta = pack.recipes.find(r => r.id === FETA)

if (!salad) throw new Error(`${SALAD} not found`)
// Guard the target too: a link to an id that isn't in the pack renders as
// nothing at all (RecipeDetail drops unresolved ids), so a typo here would
// fail silently rather than loudly.
if (!feta) throw new Error(`${FETA} not found`)

const existing = salad.relatedRecipes || []
if (existing.includes(FETA)) {
  console.log('already linked — nothing to do')
  process.exit(0)
}

salad.relatedRecipes = [...existing, FETA]

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`${salad.title} -> ${feta.title}`)
console.log(`  (${salad.translations?.no?.title} -> ${feta.translations?.no?.title})`)
console.log(`Pack -> ${pack.version}`)

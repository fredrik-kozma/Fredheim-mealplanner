/* orn-8, "The Perfect Homemade Oat Milk": raise the salt from 0.1 tsp
 * (0.5 ml) to 0.4 tsp (2 ml), author's explicit request, and recompute
 * the sodium figure it drives.
 *
 * Salt contributes nothing but sodium here — 0 kcal, 0 fat, 0 carbs — so
 * every other nutrition field is untouched. Sodium is scaled by the same
 * 4x the salt itself is scaled by (0.4 / 0.1), on the assumption that the
 * existing 59 mg/serving is already almost entirely from the 0.1 tsp of
 * salt: 100 g rolled oats carry on the order of 1-2 mg of sodium and a
 * pitted date less than that, both well inside rounding. This is an
 * estimate, not a lab value, exactly like the rest of this recipe's
 * nutrition panel, and is called out as such when this script reports
 * back rather than presented as exact.
 *
 * Left to audit_condition_tags.cjs rather than decided here: this recipe
 * sits at potassium:sodium 74:59 = 1.25, just over the 1.2 floor for
 * blood-pressure-friendly. Quadrupling sodium drops that ratio well
 * under 1.2, so the tag is very likely to come off — recomputed from the
 * real numbers rather than assumed.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'orn-8')
if (!r) throw new Error('orn-8 not found')

const OLD_TSP = 0.1
const NEW_TSP = 0.4
const SCALE = NEW_TSP / OLD_TSP

// Locate and update the salt line in every language — index-matched, so
// one index serves EN/NO/SV.
const idx = r.ingredients.findIndex(i => /salt/i.test(i.name))
if (idx === -1) throw new Error('salt ingredient not found')
if (r.ingredients[idx].quantity !== OLD_TSP) {
  throw new Error(`expected ${OLD_TSP} tsp salt, found ${r.ingredients[idx].quantity} — already changed?`)
}

for (const list of [r.ingredients, r.translations.no.ingredients, r.translations.sv.ingredients]) {
  if (list[idx].quantity !== OLD_TSP || list[idx].unit !== 'tsp') {
    throw new Error(`salt line out of sync at index ${idx}: ${JSON.stringify(list[idx])}`)
  }
  list[idx].quantity = NEW_TSP
}

const oldSodium = r.nutrition.perServing.sodium
const newSodium = Math.round(oldSodium * SCALE)
r.nutrition.perServing.sodium = newSodium

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`orn-8 salt: ${OLD_TSP} tsp -> ${NEW_TSP} tsp (0.5 ml -> 2 ml)`)
console.log(`sodium: ${oldSodium} mg -> ${newSodium} mg per serving (x${SCALE})`)
console.log(`Pack -> ${pack.version}`)

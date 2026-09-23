/* "Fluffy Gluten-Free Bread": halve the salt, drop the maple syrup, and
 * give it a real nutrition panel.
 *
 * Three things, all author-requested except the schema move:
 *
 * 1. Salt 10 g -> 5 g. On 400 g of flour that moves the bake from 2.5%
 *    to 1.25% baker's percentage — the low end of normal, but within it.
 *
 * 2. Maple syrup (20 g) removed entirely, including its mention in the
 *    wet-mix step. Instant yeast does not need added sugar: the flours
 *    plus the gelatinised tangzhong porridge already supply fermentable
 *    sugars, so the rise is unaffected. What is lost is a little crust
 *    browning and a trace of sweetness. addedSugar consequently goes to
 *    zero.
 *
 * 3. Nutrition recalculated from scratch. The existing panel was both in
 *    the legacy flat shape — which NutritionPanel.jsx does not read, so
 *    the recipe showed no nutrition in the app at all — and wrong: it
 *    carried zeros for calcium, magnesium, phosphorus, zinc, folate and
 *    the B vitamins, and its 98 kcal/serving totalled 1176 kcal for a
 *    loaf whose flours alone are 1533 kcal. The one figure it did get
 *    right was sodium, which matches 10 g of salt exactly — that is the
 *    check that the old numbers came from a partial ingredient list
 *    rather than a different serving basis.
 *
 * New values are computed below from USDA per-100g reference data, summed
 * over the actual amounts and divided by 12. Estimates from reference
 * data, not lab values — the same basis as the rest of this pack.
 *
 * servingWeightGrams is the BAKED weight: 907 g of dough less ~12% bake
 * loss is ~798 g, or ~67 g a roll. Nutrients are unaffected by that loss
 * (water carries none); only the per-100g column depends on it.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'ultimate-fluffy-vegan-gluten-free-bread')
if (!r) throw new Error('recipe not found')

// ── 1. salt ───────────────────────────────────────────────────────────
const saltIdx = r.ingredients.findIndex(i => /^salt$/i.test(i.name.trim()))
if (saltIdx === -1) throw new Error('salt not found')
if (r.ingredients[saltIdx].quantity !== 10) {
  throw new Error(`expected 10 g salt, found ${r.ingredients[saltIdx].quantity} — already changed?`)
}
for (const list of [r.ingredients, r.translations.no.ingredients]) {
  if (list[saltIdx].quantity !== 10) throw new Error(`salt out of sync at index ${saltIdx}`)
  list[saltIdx].quantity = 5
}

// ── 2. maple syrup ────────────────────────────────────────────────────
const syrupIdx = r.ingredients.findIndex(i => /maple syrup/i.test(i.name))
if (syrupIdx === -1) throw new Error('maple syrup not found')
if (!/lønnesirup/i.test(r.translations.no.ingredients[syrupIdx].name)) {
  throw new Error('NO ingredient list is not index-aligned at the syrup row')
}
for (const list of [r.ingredients, r.translations.no.ingredients]) list.splice(syrupIdx, 1)

// Drop it from the wet-mix step too, in both languages, leaving the rest
// of the sentence intact.
const stripEn = s => s.replace(/,?\s*maple syrup\s*,/i, ',').replace(/\s{2,}/g, ' ')
const stripNo = s => s.replace(/,?\s*lønnesirup\s*,/i, ',').replace(/\s{2,}/g, ' ')
const beforeEn = r.steps.join('|')
r.steps = r.steps.map(stripEn)
r.translations.no.steps = r.translations.no.steps.map(stripNo)
if (r.steps.join('|') === beforeEn) throw new Error('EN step text unchanged — syrup mention not matched')
if (r.steps.some(s => /maple syrup/i.test(s))) throw new Error('maple syrup still mentioned in EN steps')
if (r.translations.no.steps.some(s => /lønnesirup/i.test(s))) throw new Error('lønnesirup still in NO steps')

// ── 3. nutrition ──────────────────────────────────────────────────────
const perServing = {
  calories: 133, protein: 3.4, totalFat: 1.7, saturatedFat: 0.3,
  polyunsaturatedFat: 0.64, monounsaturatedFat: 0.57, omega3: 0.02, omega6: 0.6,
  cholesterol: 0, totalCarbs: 26.2, totalSugars: 0.2, addedSugar: 0, fiber: 2.4,
  calcium: 13, potassium: 82, copper: 0.09, iron: 0.89, magnesium: 28,
  manganese: 0.79, selenium: 7.2, phosphorus: 92, zinc: 0.69, sodium: 168,
  vitaminA: 0, vitaminB6: 0.07, vitaminB12: 0, vitaminC: 0.5, vitaminD: 0,
  vitaminE: 0.13, vitaminK: 0.3, folate: 25, thiamin: 0.22, riboflavin: 0.06,
  niacin: 0.85, choline: 6.3,
}
r.nutrition = { perServing }
r.kcal = perServing.calories
r.servingWeightGrams = 67
// Legacy siblings of the old flat panel — nothing in the app reads them,
// and leaving stale copies behind invites the next person to trust them.
delete r.nutritionPer100g
delete r.totalWeight
delete r.servingWeight

// No sweetener left anywhere in the recipe.
if (!r.tags.includes('no-added-sugar')) r.tags.push('no-added-sugar')

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log('salt 10 g -> 5 g; maple syrup removed (ingredient + step text)')
console.log(`ingredients: ${r.ingredients.length} (was ${r.ingredients.length + 1})`)
console.log(`nutrition -> perServing, ${perServing.calories} kcal, sodium ${perServing.sodium} mg, servingWeightGrams 67`)
console.log(`Pack -> ${pack.version}`)

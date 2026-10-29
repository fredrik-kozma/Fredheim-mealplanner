#!/usr/bin/env node
/*
 * One-off (2026-10-29): realistic servings for the odd serving sizes left by
 * the portion-text run, and stored sodium that disagrees with the
 * ingredients, in the Fredheim packs. Recipes (ingredient amounts) are not
 * changed: the whole batch stays the same, only how it is divided.
 *
 *   - PORTIONS: new servings and/or servingWeightGrams + portion text in
 *     en/no/sv. When the count changes, every stored per-serving nutrition
 *     value (micronutrients too) is rescaled by old/new servings and `kcal`
 *     follows; sodiumStandard is left for build_salt_levels.mjs to redo.
 *   - SODIUM: the stored panel's sodium is replaced by the ingredient
 *     calculation (scripts/data/food-composition-core.json), as CLAUDE.md
 *     asks, where the two differ by ≥ 20 % and ≥ 150 mg a serving.
 *
 * Then, by hand: npm run label-recipes -- --recipe <ids> --write, and
 * node scripts/build_salt_levels.mjs --write. Re-running is a no-op.
 * Proposals that would change a recipe are in scripts/data/salty-mains-proposals.md.
 */
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { loadPacks } from './check-recipes.mjs'
import { estimateRecipe } from './lib/recipeNutritionEstimate.mjs'

const bowl = g => ({ en: `1 bowl (~${g} g)`, no: `1 bolle (~${g} g)`, sv: `1 skål (~${g} g)` })
const half = n => { const v = Math.round(n * 2) / 2; const w = Math.floor(v); return `${w || ''}${v - w ? '½' : ''}` }
const spoons = g => ({ en: `~${g} g (${half(g / 15)} tbsp)`, no: `~${g} g (${half(g / 15)} ss)`, sv: `~${g} g (${half(g / 15)} msk)` })

// servings / sw: the new values. basis: why (goes into the report).
export const PORTIONS = {
  // ── named in the request ──
  'orn-4': { servings: 14, sw: 51, portion: spoons(51), basis: '720 g sauce; a kebab-sauce portion ~50 g (was 4 × 180 g)' },
  'orn-2': { servings: 10, sw: 43, portion: spoons(43), basis: '433 g dressing; a salad-dressing portion ~45 g (was 4 × 122 g)' },
  'baba-ghanoush---aubergine-dip': { servings: 14, sw: 51, portion: spoons(51), basis: '943 g raw, ~720 g after roasting and peeling the aubergine; a dip portion ~50 g (was 8 × 268 g, more than twice the batch)' },
  'dal-stew': { sw: 350, portion: bowl(350), basis: '190 g dry red lentils for 4 is a normal dal; the 165 g bowl left out the cooking and thinning water (not an ingredient row), so the bowl is ~350 g. Count and per-serving nutrition unchanged' },
  'fr-19': { servings: 10, sw: 90, portion: { en: '1 bun (~90 g)', no: '1 rundstykke (~90 g)', sv: '1 fralla (~90 g)' }, basis: 'the method rolls 100 g buns: 1040 g dough = 10 buns, ~90 g baked; 1 bun a serving (was 7 × "1½ buns")' },
  // ── soups served as a main with a bowl over ~530 g → ~400 g bowls ──
  'broccoli-soup': { sw: 440, portion: bowl(440), basis: 'the whole batch is 1767 g, so 4 bowls are ~440 g, not 614 g' },
  'pumpkin-soup': { servings: 10, sw: 400, portion: bowl(400), basis: '3994 g soup; 10 bowls of ~400 g (was 6 × 702 g)' },
  'fr-27': { servings: 6, sw: 420, portion: bowl(420), basis: '2509 g soup; 6 bowls of ~420 g (was 4 × 627 g)' },
  'potato-and-spinach-soup': { servings: 8, sw: 420, portion: bowl(420), basis: '3329 g soup; 8 bowls of ~420 g (was 6 × 618 g, more than the batch)' },
  'fr-184': { servings: 10, sw: 380, portion: bowl(380), basis: '3837 g soup; 10 bowls of ~380 g (was 7 × 584 g)' },
  'orn-30': { servings: 6, sw: 390, portion: bowl(390), basis: '~2340 g soup; 6 bowls of ~390 g (was 4 × 586 g)' },
  'orn-31': { servings: 5, sw: 430, portion: bowl(430), basis: '~2140 g soup; 5 bowls of ~430 g (was 4 × 536 g)' },
  'red-lentil-soup': { servings: 5, sw: 390, portion: bowl(390), basis: '1938 g soup; 5 bowls of ~390 g (was 4 × 541 g, more than the batch)' },
  // ── dips, dressings, salsa, jam over the category's portion ──
  'classic-hummus': { servings: 12, sw: 52, portion: spoons(52), basis: '618 g hummus; a dip portion ~50 g (was 6 × 103 g)' },
  'roasted-red-pepper-hummus': { servings: 16, sw: 49, portion: spoons(49), basis: '778 g hummus; ~50 g (was 6 × 130 g)' },
  'lemony-chickpea-hummus': { servings: 11, sw: 48, portion: spoons(48), basis: '528 g hummus; ~50 g (was 4 × 132 g)' },
  'orn-46': { servings: 14, sw: 51, portion: spoons(51), basis: '720 g hummus; ~50 g (was 4 × 180 g)' },
  'fr-78': { servings: 10, sw: 52, portion: spoons(52), basis: '524 g guacamole; a dip portion ~50 g (was 4 × 131 g)' },
  'vegan-tzatziki-sauce': { servings: 6, sw: 46, portion: spoons(46), basis: '276 g tzatziki; ~45 g (was 2 × 138 g)' },
  'fr-150': { servings: 13, sw: 59, portion: { en: '~59 g (4 tbsp)', no: '~59 g (4 ss)', sv: '~59 g (4 msk)' }, basis: '763 g salsa; ~60 g with tacos or a bowl (was 4 × 223 g, more than the batch)' },
  'fr-163': { servings: 17, sw: 20, portion: { en: '20 g (1 tbsp)', no: '20 g (1 ss)', sv: '20 g (1 msk)' }, basis: '335 g chia jam; 20 g like the other jams (was 10 × 53 g, more than the batch)' },
  'orn-65': { servings: 11, sw: 150, portion: { en: '1 small bowl (~150 g)', no: '1 liten bolle (~150 g)', sv: '1 liten skål (~150 g)' }, basis: '1645 g applesauce; ~150 g as a dessert or snack (was 4 × 410 g)' },
  // ── serving weight larger than the batch can give: weight only ──
  'hasselback-potatoes': { sw: 70, portion: { en: '~70 g as a side', no: '~70 g som tilbehør', sv: '~70 g som tillbehör' }, basis: '360 g potatoes for 5 bake to ~350 g, so ~70 g each, not 174 g (count kept: the recipe says 5)' },
  'berry-sauce': { sw: 60, portion: { en: '~60 g sauce', no: '~60 g saus', sv: '~60 g sås' }, basis: '368 g sauce for 6: ~60 g, not 95 g' },
  'cheesy-cauliflower-sauce': { sw: 50, portion: { en: '~50 g sauce', no: '~50 g saus', sv: '~50 g sås' }, basis: '399 g sauce for 8: ~50 g, not 70 g' },
  'fruit-crisp': { sw: 115, portion: { en: '1 bowl (~115 g)', no: '1 bolle (~115 g)', sv: '1 skål (~115 g)' }, basis: '501 g raw, ~460 g baked, for 4: ~115 g, not 177 g' },
  'scrambled-tofu': { sw: 95, portion: { en: '1 plate (~95 g)', no: '1 tallerken (~95 g)', sv: '1 tallrik (~95 g)' }, basis: '417 g raw, ~380 g after frying, for 4: ~95 g, not 144 g (count kept: the recipe says 4)' },
  'fr-29': { sw: 17, portion: { en: '~17 g fruit candy', no: '~17 g fruktgodteri', sv: '~17 g fruktgodis' }, basis: '752 g purée dehydrates to ~170 g (51 kcal a serving fits 17 g of dried fruit, not 75 g)' },
}

// Stored sodium replaced by the ingredient calculation (≥ 20 % and ≥ 150 mg off).
export const SODIUM_FROM_INGREDIENTS = ['broccoli-soup', 'fr-101', 'potato-and-spinach-soup', 'fr-184', 'cauliflower-soup']
// Bread Buns stored 0.52 mg potassium (a g/mg slip in the old panel); rescaled it rounds to 0.
const POTASSIUM_FROM_INGREDIENTS = ['fr-19']

const roundField = (k, v) => (['calories', 'sodium', 'potassium'].includes(k) ? Math.round(v) : Math.abs(v) < 1 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10)

function main() {
  const log = []
  for (const pack of loadPacks().filter(p => p.id.startsWith('fredheim-'))) {
    let changed = false
    for (const r of pack.recipes) {
      const p = PORTIONS[r.id]
      if (p) {
        const from = { servings: r.servings, sw: r.servingWeightGrams, kcal: r.kcal, na: r.nutrition?.perServing?.sodium }
        const servings = p.servings ?? r.servings
        if (servings !== r.servings) {
          const f = r.servings / servings
          const per = r.nutrition.perServing
          for (const k of Object.keys(per)) if (typeof per[k] === 'number') per[k] = roundField(k, per[k] * f)
          r.servings = servings
          changed = true
        }
        if (r.servingWeightGrams !== p.sw) { r.servingWeightGrams = p.sw; changed = true }
        for (const l of ['en', 'no', 'sv']) {
          const tr = l === 'en' ? r : r.translations[l]
          if (tr.portion !== p.portion[l]) { tr.portion = p.portion[l]; changed = true }
        }
        log.push({ id: r.id, from, to: { servings: r.servings, sw: r.servingWeightGrams, na: r.nutrition?.perServing?.sodium } })
      }
      if (SODIUM_FROM_INGREDIENTS.includes(r.id)) {
        const calc = Math.round(estimateRecipe(r).totals.sodium / r.servings)
        if (r.nutrition.perServing.sodium !== calc) {
          log.push({ id: r.id, sodium: `${r.nutrition.perServing.sodium} → ${calc} mg (ingredients)` })
          r.nutrition.perServing.sodium = calc
          changed = true
        }
      }
      if (POTASSIUM_FROM_INGREDIENTS.includes(r.id)) {
        const calc = Math.round(estimateRecipe(r).totals.potassium / r.servings)
        if (r.nutrition.perServing.potassium !== calc) {
          log.push({ id: r.id, potassium: `${r.nutrition.perServing.potassium} → ${calc} mg (ingredients)` })
          r.nutrition.perServing.potassium = calc
          changed = true
        }
      }
      if (r.nutrition?.perServing && r.kcal !== Math.round(r.nutrition.perServing.calories)) { r.kcal = Math.round(r.nutrition.perServing.calories); changed = true }
    }
    if (changed) {
      const { file, ...data } = pack
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
      log.push({ wrote: pack.id })
    }
  }
  console.log(JSON.stringify(log, null, 1))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()

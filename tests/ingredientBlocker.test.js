import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  expandBlockedIds,
  COMPOSITE_CONTAINS,
  GROUP_IDS,
  migrateAvoidedAllergens,
  recipeIsBlocked,
  recipeHasAvoidedAllergen,
  resolvePlantMilkSubstitute,
  planPlantMilkSubstitutions,
  planSoySauceSubstitutions,
  applyBlockedSubstitutions,
  applyIngredientDisplayAliases,
  canSubstituteSoySauceForGluten,
  normalizeBlocked,
  BLOCK_GROUPS,
} from '../src/data/ingredientBlocker.js'

describe('expandBlockedIds / composites', () => {
  it('sesame expands to tahini and hummus (one-way)', () => {
    const b = expandBlockedIds(['sesame'])
    assert.ok(b.has('sesame-seeds'))
    assert.ok(b.has('tahini'))
    assert.ok(b.has('hummus'))
    assert.ok(b.has('classic-hummus'))
    assert.equal(b.has('chickpeas-canned'), false)
  })

  it('blocking cashews expands cashew sauces, not reverse', () => {
    const b = expandBlockedIds([], ['cashews'])
    assert.ok(b.has('cashew-sour-cream'))
    assert.ok(b.has('white-cashew-sauce'))
    assert.ok(b.has('cashew-milk'))
  })

  it('COMPOSITE_CONTAINS is one-way only', () => {
    assert.ok(COMPOSITE_CONTAINS.hummus.includes('tahini'))
    assert.equal(COMPOSITE_CONTAINS['chickpeas-canned'], undefined)
  })

  it('nightshades include tomato and potato, not sweet potato or black pepper', () => {
    assert.ok(GROUP_IDS.nightshades.includes('tomatoes'))
    assert.ok(GROUP_IDS.nightshades.includes('potatoes'))
    assert.ok(GROUP_IDS.nightshades.includes('bell-peppers'))
    assert.equal(GROUP_IDS.nightshades.includes('sweet-potatoes'), false)
    assert.equal(GROUP_IDS.nightshades.includes('black-pepper'), false)
    assert.ok(BLOCK_GROUPS.some((g) => g.id === 'nightshades'))
  })

  it('legumes include soy, peanuts, snow peas and carob', () => {
    assert.ok(GROUP_IDS.legumes.includes('tofu'))
    assert.ok(GROUP_IDS.legumes.includes('peanuts'))
    assert.ok(GROUP_IDS.legumes.includes('snow-peas'))
    assert.ok(GROUP_IDS.legumes.includes('carob-powder'))
    assert.ok(GROUP_IDS.legumes.includes('tamari'))
    assert.ok(BLOCK_GROUPS.some((g) => g.id === 'legumes'))
  })
})

describe('traps', () => {
  const nutmegRecipe = {
    ingredients: [{ name: 'Nutmeg', quantity: 1, unit: 'tsp' }],
  }
  const buckwheatRecipe = {
    ingredients: [{ ingredient: 'buckwheat-flour', name: 'Buckwheat flour' }],
  }
  const coconutRecipe = {
    ingredients: [{ ingredient: 'coconut-milk', name: 'Coconut milk' }],
  }
  const oatRecipe = {
    ingredients: [{ ingredient: 'rolled-oats', name: 'Rolled oats' }],
  }
  const sweetPotato = {
    ingredients: [{ ingredient: 'sweet-potatoes', name: 'Sweet potatoes' }],
  }
  const blackPepper = {
    ingredients: [{ ingredient: 'black-pepper', name: 'Black pepper' }],
  }

  it('nutmeg is not a tree nut', () => {
    assert.equal(recipeIsBlocked(nutmegRecipe, { groups: ['tree-nuts'], ids: [] }), false)
  })

  it('buckwheat is not gluten', () => {
    assert.equal(recipeIsBlocked(buckwheatRecipe, { groups: ['gluten'], ids: [] }), false)
  })

  it('coconut is separate from tree nuts', () => {
    assert.equal(recipeIsBlocked(coconutRecipe, { groups: ['tree-nuts'], ids: [] }), false)
    assert.equal(recipeIsBlocked(coconutRecipe, { groups: ['coconut'], ids: [] }), true)
  })

  it('oats are separate from gluten', () => {
    assert.equal(recipeIsBlocked(oatRecipe, { groups: ['gluten'], ids: [] }), false)
    assert.equal(recipeIsBlocked(oatRecipe, { groups: ['oats'], ids: [] }), true)
  })

  it('gluten includes white flour and lasagne', () => {
    assert.ok(GROUP_IDS.gluten.includes('white-flour'))
    assert.ok(GROUP_IDS.gluten.includes('lasagne-sheets'))
    assert.ok(GROUP_IDS.gluten.includes('barley-coffee'))
    assert.equal(
      recipeIsBlocked(
        { ingredients: [{ ingredient: 'white-flour', name: 'White flour' }] },
        { groups: ['gluten'], ids: [] },
      ),
      true,
    )
  })

  it('sweet potato and black pepper are not nightshades', () => {
    assert.equal(recipeIsBlocked(sweetPotato, { groups: ['nightshades'], ids: [] }), false)
    assert.equal(recipeIsBlocked(blackPepper, { groups: ['nightshades'], ids: [] }), false)
    assert.equal(
      recipeIsBlocked(
        { ingredients: [{ ingredient: 'tomatoes', name: 'Tomatoes' }] },
        { groups: ['nightshades'], ids: [] },
      ),
      true,
    )
  })
})

describe('migration', () => {
  it('maps avoidedAllergens to groups', () => {
    assert.deepEqual(migrateAvoidedAllergens(['soy', 'gluten']), {
      groups: ['soy', 'gluten'],
      ids: [],
    })
  })
})

describe('plant-milk substitution', () => {
  const muffins = {
    title: 'Sweet Potato Muffins',
    ingredients: [{ ingredient: 'plant-milk', name: 'Plant milk', quantity: 1, unit: 'dl' }],
  }
  const soyYogurt = {
    title: 'Nutloaf',
    ingredients: [
      { ingredient: 'plant-yogurt', name: 'Plant-based yogurt', note: 'soy', quantity: 1, unit: 'dl' },
    ],
  }
  const tofu = {
    title: 'Tofu scramble',
    ingredients: [{ ingredient: 'tofu', name: 'Tofu', quantity: 200, unit: 'g' }],
  }

  it('soy block does not hide plant-milk-only recipe; substitutes oat milk', () => {
    const blocked = { groups: ['soy'], ids: [] }
    assert.equal(recipeIsBlocked(muffins, blocked), false)
    const plan = planPlantMilkSubstitutions(muffins, blocked)
    assert.equal(plan.hide, false)
    assert.equal(plan.substitutions[0].toId, 'oat-milk')
    const applied = applyBlockedSubstitutions(muffins, blocked, 'en')
    assert.equal(applied.ingredients[0].ingredient, 'oat-milk')
    assert.equal(applied.ingredients[0].name, 'Oat milk')
  })

  it('legumes block also substitutes plant-milk to oat milk', () => {
    const blocked = { groups: ['legumes'], ids: [] }
    assert.equal(recipeIsBlocked(muffins, blocked), false)
    const plan = planPlantMilkSubstitutions(muffins, blocked)
    assert.equal(plan.substitutions[0].toId, 'oat-milk')
  })

  it('legumes + oats falls through to almond milk', () => {
    const blocked = { groups: ['legumes', 'oats'], ids: [] }
    const plan = planPlantMilkSubstitutions(muffins, blocked)
    assert.equal(plan.hide, false)
    assert.equal(plan.substitutions[0].toId, 'almond-milk')
  })

  it('plant-yogurt note soy is hard-blocked', () => {
    assert.equal(recipeIsBlocked(soyYogurt, { groups: ['soy'], ids: [] }), true)
  })

  it('real tofu still blocked when soy blocked', () => {
    assert.equal(recipeIsBlocked(tofu, { groups: ['soy'], ids: [] }), true)
  })

  it('hides when every plant milk option is blocked', () => {
    const blockedIds = new Set(PLANT_ORDER_FOR_TEST())
    assert.equal(resolvePlantMilkSubstitute(blockedIds), null)
    const blocked = {
      groups: ['soy', 'oats', 'tree-nuts', 'coconut'],
      ids: [],
    }
    assert.equal(recipeIsBlocked(muffins, blocked), true)
  })
})

function PLANT_ORDER_FOR_TEST() {
  return ['oat-milk', 'almond-milk', 'coconut-milk', 'cashew-milk', 'soy-milk']
}

describe('soy sauce / tamari', () => {
  const stirFry = {
    title: 'Stir fry',
    ingredients: [
      { ingredient: 'soy-sauce', name: 'Soy sauce', quantity: 1, unit: 'tbsp' },
      { ingredient: 'broccoli', name: 'Broccoli', quantity: 200, unit: 'g' },
    ],
  }
  const withFlour = {
    title: 'Gravy',
    ingredients: [
      { ingredient: 'soy-sauce', name: 'Soy sauce', quantity: 1, unit: 'tbsp' },
      { ingredient: 'white-flour', name: 'White flour', quantity: 2, unit: 'tbsp' },
    ],
  }

  it('display alias renames soy sauce and adds tamari note', () => {
    const shown = applyIngredientDisplayAliases(stirFry, 'en')
    assert.equal(shown.ingredients[0].name, 'Soy sauce / tamari')
    assert.match(shown.ingredients[0].note, /gluten-free/i)
    const no = applyIngredientDisplayAliases(stirFry, 'no')
    assert.equal(no.ingredients[0].name, 'Soyasaus / tamari')
  })

  it('gluten block swaps soy sauce to tamari instead of hiding', () => {
    const blocked = { groups: ['gluten'], ids: [] }
    assert.equal(canSubstituteSoySauceForGluten(blocked), true)
    assert.equal(recipeIsBlocked(stirFry, blocked), false)
    const plan = planSoySauceSubstitutions(stirFry, blocked)
    assert.equal(plan.substitutions[0].toId, 'tamari')
    const applied = applyBlockedSubstitutions(stirFry, blocked, 'en')
    assert.equal(applied.ingredients[0].ingredient, 'tamari')
    assert.equal(applied.ingredients[0].name, 'Tamari')
  })

  it('gluten + flour still hides even with soy sauce present', () => {
    assert.equal(recipeIsBlocked(withFlour, { groups: ['gluten'], ids: [] }), true)
  })

  it('soy or legumes block still hides soy-sauce recipes (tamari also soy/legume)', () => {
    assert.equal(recipeIsBlocked(stirFry, { groups: ['soy'], ids: [] }), true)
    assert.equal(recipeIsBlocked(stirFry, { groups: ['legumes'], ids: [] }), true)
    assert.equal(canSubstituteSoySauceForGluten({ groups: ['gluten', 'soy'], ids: [] }), false)
  })

  it('after tamari swap, display alias does not re-label', () => {
    const blocked = { groups: ['gluten'], ids: [] }
    const applied = applyIngredientDisplayAliases(
      applyBlockedSubstitutions(stirFry, blocked, 'en'),
      'en',
    )
    assert.equal(applied.ingredients[0].ingredient, 'tamari')
    assert.equal(applied.ingredients[0].name, 'Tamari')
  })
})

describe('compat wrapper', () => {
  it('recipeHasAvoidedAllergen accepts array or object', () => {
    const r = { ingredients: [{ ingredient: 'tofu', name: 'Tofu' }] }
    assert.equal(recipeHasAvoidedAllergen(r, ['soy']), true)
    assert.equal(recipeHasAvoidedAllergen(r, { groups: ['soy'], ids: [] }), true)
    assert.equal(recipeHasAvoidedAllergen(r, []), false)
  })

  it('sesame hides hummus recipe via composite', () => {
    const r = {
      ingredients: [
        { ingredient: 'hummus', name: 'Hummus' },
        { ingredient: 'chickpeas-canned', name: 'Chickpeas' },
      ],
    }
    assert.equal(recipeIsBlocked(r, { groups: ['sesame'], ids: [] }), true)
    const chickOnly = {
      ingredients: [{ ingredient: 'chickpeas-canned', name: 'Chickpeas' }],
    }
    assert.equal(recipeIsBlocked(chickOnly, { groups: ['sesame'], ids: [] }), false)
  })
})

describe('normalize', () => {
  it('handles null', () => {
    assert.deepEqual(normalizeBlocked(null), { groups: [], ids: [] })
  })
})

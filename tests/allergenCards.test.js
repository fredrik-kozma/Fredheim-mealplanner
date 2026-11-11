import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import dictionary from '../src/data/ingredientDictionary.json'
import {
  formatAllergenLines,
  cardStatements,
  CEREAL_CODES,
  NUT_CODES,
} from '../src/data/euAllergens.js'
import {
  INGREDIENT_RULES,
  SAFE_IDS,
  detectRecipeAllergens,
  applyAllergenOverride,
  allergensFromFreeText,
} from '../src/data/allergenCardMap.js'
import {
  LAYOUT,
  sheetFitsOnA4,
  normalizeSlots,
  fillSlots,
  setSlot,
  removeSlot,
  printablePages,
  PER_PAGE,
} from '../src/utils/allergenCardModel.js'
import { jpegPagesToPdf } from '../src/utils/allergenCardPdf.js'

function recipe(ingredients) {
  return { id: 't', title: 'Test', ingredients }
}

function row(ingredient, name, note) {
  const out = { name }
  if (ingredient) out.ingredient = ingredient
  if (note) out.note = note
  return out
}

const LABELS = {
  cereal: 'Cereals containing gluten',
  nuts: 'Nuts',
  cereals: {
    wheat: 'wheat', rye: 'rye', barley: 'barley', oats: 'oats', spelt: 'spelt', khorasan: 'khorasan',
  },
  nutNames: {
    almond: 'almond', hazelnut: 'hazelnut', walnut: 'walnut', cashew: 'cashew',
    pecan: 'pecan', brazil: 'Brazil nut', pistachio: 'pistachio', macadamia: 'macadamia',
  },
  crustaceans: 'Crustaceans',
  eggs: 'Eggs',
  fish: 'Fish',
  peanuts: 'Peanuts',
  soy: 'Soybeans',
  milk: 'Milk (including lactose)',
  celery: 'Celery',
  mustard: 'Mustard',
  sesame: 'Sesame seeds',
  sulphites: 'Sulphur dioxide and sulphites',
  lupin: 'Lupin',
  molluscs: 'Molluscs',
  none: 'None of the 14 major allergens',
  review: (key, name) => `${key}:${name}`,
}

describe('dictionary classification', () => {
  it('decides every dictionary ingredient, and only those', () => {
    const ids = dictionary.entries.map((entry) => entry.id)
    for (const id of ids) {
      assert.ok(SAFE_IDS.has(id) || INGREDIENT_RULES[id], `unclassified ${id}`)
    }
    for (const id of SAFE_IDS) assert.ok(ids.includes(id), `safe id not in dictionary: ${id}`)
    for (const id of Object.keys(INGREDIENT_RULES)) {
      assert.ok(ids.includes(id), `rule id not in dictionary: ${id}`)
      assert.equal(SAFE_IDS.has(id), false, `${id} is both safe and a rule`)
    }
    assert.equal(SAFE_IDS.size + Object.keys(INGREDIENT_RULES).length, ids.length)
  })
})

describe('detectRecipeAllergens', () => {
  it('declares oats unless the row says gluten-free', () => {
    const plain = detectRecipeAllergens(recipe([row('rolled-oats', 'Rolled oats')]))
    assert.deepEqual(plain.hits, ['cereal:oats'])
    assert.equal(plain.reviews.length, 0)

    const gf = detectRecipeAllergens(recipe([
      row('oat-flour', 'Oat flour', 'gluten-free'),
    ]))
    assert.deepEqual(gf.hits, [])
    assert.ok(gf.reviews.some((review) => review.key === 'gfClaim'))
  })

  it('treats soy sauce as soy and wheat, and tamari as soy only', () => {
    const sauce = detectRecipeAllergens(recipe([row('soy-sauce', 'Soy sauce')]))
    assert.ok(sauce.hits.includes('soy'))
    assert.ok(sauce.hits.includes('cereal:wheat'))

    const tamari = detectRecipeAllergens(recipe([
      row('tamari', 'Tamari', 'hvetefri soyasaus'),
    ]))
    assert.deepEqual(tamari.hits, ['soy'])
  })

  it('maps tahini, hummus, mustard, celery root and named nuts', () => {
    assert.ok(detectRecipeAllergens(recipe([row('tahini', 'Tahini')])).hits.includes('sesame'))
    assert.ok(detectRecipeAllergens(recipe([row('classic-hummus', 'Hummus')])).hits.includes('sesame'))
    assert.ok(detectRecipeAllergens(recipe([row('mustard-seeds', 'Mustard seeds')])).hits.includes('mustard'))
    assert.deepEqual(detectRecipeAllergens(recipe([row('celeriac', 'Celeriac')])).hits, ['celery'])
    assert.deepEqual(
      detectRecipeAllergens(recipe([row('almond-milk', 'Almond milk')])).hits,
      ['nut:almond'],
    )
    assert.deepEqual(
      detectRecipeAllergens(recipe([row('cashew-milk', 'Cashew milk')])).hits,
      ['nut:cashew'],
    )
    const peanuts = detectRecipeAllergens(recipe([row('peanuts', 'Peanuts')]))
    assert.deepEqual(peanuts.hits, ['peanuts'])
  })

  it('does not flag the usual lookalikes', () => {
    for (const [id, name, note] of [
      ['coconut-milk', 'Coconut milk'],
      ['eggplant', 'Eggplant'],
      ['buckwheat-flour', 'Buckwheat flour'],
      ['nutmeg-ground', 'Nutmeg'],
      ['poppy-seeds', 'Poppy seeds'],
      ['water', 'Water', 'for milk'],
      ['flaxseed-ground', 'Ground flaxseed', 'for the flax egg'],
      ['butternut-squash', 'Butternut squash'],
    ]) {
      const found = detectRecipeAllergens(recipe([row(id, name, note)]))
      assert.deepEqual(found.hits, [], name)
      assert.deepEqual(found.reviews, [], name)
      assert.deepEqual(found.unmapped, [], name)
    }
  })

  it('declares barley and rye for barley coffee, and rye when the starter says so', () => {
    const coffee = detectRecipeAllergens(recipe([row('barley-coffee', 'Barley coffee', 'e.g. Inka, Caro')]))
    assert.ok(coffee.hits.includes('cereal:barley'))
    assert.ok(coffee.hits.includes('cereal:rye'))

    const starter = detectRecipeAllergens(recipe([
      row('sourdough-starter', 'Sourdough starter', 'mature rye'),
    ]))
    assert.deepEqual(starter.hits, ['cereal:rye'])
    assert.equal(starter.reviews.length, 0)
  })

  it('clears gluten-free breadcrumbs and keeps a confirmation flag', () => {
    const found = detectRecipeAllergens(recipe([
      row('bread-crumbs', 'Breadcrumbs', 'gluten free'),
    ]))
    assert.deepEqual(found.hits, [])
    assert.equal(found.reviews[0].key, 'gfClaim')
  })

  it('reads soy out of a plant-yogurt note and flags an unnamed plant milk', () => {
    const soy = detectRecipeAllergens(recipe([row('plant-yogurt', 'Plant-based yogurt', 'soy')]))
    assert.deepEqual(soy.hits, ['soy'])
    assert.equal(soy.reviews.length, 0)

    const plain = detectRecipeAllergens(recipe([row('plant-milk', 'Plant milk', 'unsweetened')]))
    assert.deepEqual(plain.hits, [])
    assert.equal(plain.reviews[0].key, 'plantBase')
  })

  it('flags sulphites on dried fruit instead of declaring them', () => {
    const found = detectRecipeAllergens(recipe([row('dried-apricots', 'Dried apricots')]))
    assert.deepEqual(found.hits, [])
    assert.equal(found.reviews[0].key, 'sulphites')
    assert.equal(found.reviews[0].names.en, 'Dried apricots')
  })

  it('declares celery for broth and leaves miso, curry and yeast as checks', () => {
    assert.ok(detectRecipeAllergens(recipe([row('vegetable-broth', 'Vegetable broth')])).hits.includes('celery'))
    const miso = detectRecipeAllergens(recipe([row('miso-paste', 'Miso', 'white, shiro')]))
    assert.ok(miso.hits.includes('soy'))
    assert.ok(miso.reviews.some((review) => review.key === 'miso'))
    assert.equal(detectRecipeAllergens(recipe([row('curry-powder', 'Curry powder')])).reviews[0].key, 'mustard')
    const yeast = detectRecipeAllergens(recipe([row('nutritional-yeast', 'Nutritional yeast')]))
    assert.deepEqual(yeast.hits, [])
    assert.equal(yeast.reviews[0].key, 'gluten')
  })

  it('uses free text when the row has no dictionary id', () => {
    assert.ok(detectRecipeAllergens(recipe([row(null, 'Shrimp')])).hits.includes('crustaceans'))
    assert.ok(detectRecipeAllergens(recipe([row(null, 'Cod fillet')])).hits.includes('fish'))
    assert.deepEqual(detectRecipeAllergens(recipe([row(null, 'Milk')])).hits, ['milk'])
    assert.deepEqual(detectRecipeAllergens(recipe([row(null, 'Havremelk')])).hits, ['cereal:oats'])
    assert.deepEqual(detectRecipeAllergens(recipe([row(null, 'Eggplant')])).hits, [])
    assert.deepEqual(detectRecipeAllergens(recipe([row(null, 'Coconut milk')])).hits, [])
    assert.ok(detectRecipeAllergens(recipe([row(null, 'Soy sauce')])).hits.includes('cereal:wheat'))
    assert.deepEqual(detectRecipeAllergens(recipe([row(null, 'Tahini')])).hits, ['sesame'])

    const unknown = detectRecipeAllergens(recipe([row(null, 'Dragon fruit')]))
    assert.equal(unknown.unmapped.length, 1)
    assert.equal(unknown.unmapped[0].names.en, 'Dragon fruit')
  })

  it('lets a saved override replace the suggestion', () => {
    const detected = detectRecipeAllergens(recipe([
      row('rolled-oats', 'Rolled oats'),
      row('dried-apricots', 'Dried apricots'),
    ]))
    const corrected = applyAllergenOverride(detected, { hits: ['cereal:wheat', 'not-a-code', 'soy'] })
    assert.equal(corrected.overridden, true)
    assert.deepEqual(corrected.hits, ['cereal:wheat', 'soy'])
    assert.deepEqual(corrected.reviews, [])
    assert.equal(applyAllergenOverride(detected, null).overridden, false)
  })
})

describe('free-text traps', () => {
  it('keeps egg, milk, wheat and nuts off the lookalikes', () => {
    assert.deepEqual(allergensFromFreeText('eggplant').hits, [])
    assert.deepEqual(allergensFromFreeText('flax egg').hits, [])
    assert.deepEqual(allergensFromFreeText('buckwheat flour').hits, [])
    assert.deepEqual(allergensFromFreeText('nutmeg').hits, [])
    assert.deepEqual(allergensFromFreeText('butternut squash').hits, [])
    assert.deepEqual(allergensFromFreeText('coconut milk').hits, [])
    assert.deepEqual(allergensFromFreeText('havremjölk').hits, ['cereal:oats'])
    assert.ok(!allergensFromFreeText('havremjölk').hits.includes('milk'))
    assert.deepEqual(allergensFromFreeText('gluten-free oat flour').hits, [])
    assert.ok(allergensFromFreeText('gluten-free oat flour').reviews.includes('gfClaim'))
    assert.ok(allergensFromFreeText('lupin flour').hits.includes('lupin'))
    assert.ok(allergensFromFreeText('spelt flour').hits.includes('cereal:spelt'))
    assert.ok(allergensFromFreeText('blue mussels').hits.includes('molluscs'))
  })
})

describe('card wording', () => {
  it('groups cereals and nuts and keeps annex order', () => {
    const lines = formatAllergenLines([
      'sesame', 'nut:almond', 'cereal:oats', 'cereal:wheat', 'soy', 'nut:cashew',
    ], LABELS)
    assert.deepEqual(lines.map((line) => line.text), [
      'Cereals containing gluten: wheat, oats',
      'Soybeans',
      'Nuts: almond, cashew',
      'Sesame seeds',
    ])
    assert.equal(CEREAL_CODES[0], 'wheat')
    assert.equal(NUT_CODES[0], 'almond')
  })

  it('says none of the 14 only when there is nothing to flag', () => {
    const empty = cardStatements({ hits: [], reviews: [], unmapped: [] }, LABELS, 'en')
    assert.equal(empty.none, true)
    assert.equal(empty.lines.length, 0)

    const flagged = cardStatements({
      hits: [],
      reviews: [{ key: 'sulphites', names: { en: 'Raisins' } }],
      unmapped: [],
    }, LABELS, 'en')
    assert.equal(flagged.none, false)
    assert.deepEqual(flagged.notes, ['sulphites:Raisins'])
  })
})

describe('A4 sheet', () => {
  it('fits a 2 by 6 grid of cards on A4 with room for the disclaimer', () => {
    assert.equal(sheetFitsOnA4(), true)
    assert.equal(LAYOUT.cols, 2)
    assert.equal(LAYOUT.rows, 6)
    assert.ok(LAYOUT.cardW >= 70 && LAYOUT.cardW <= 90)
    assert.ok(LAYOUT.cardH >= 38 && LAYOUT.cardH <= 48)
    assert.ok(LAYOUT.marginX * 2 + LAYOUT.gridW <= LAYOUT.pageW)
  })

  it('keeps an empty slot, fills holes, and adds pages', () => {
    const first = normalizeSlots(null)
    assert.equal(first.length, PER_PAGE)
    assert.ok(first.every((id) => id == null))

    const filled = fillSlots(first, ['a', 'b'])
    assert.equal(filled[0], 'a')
    assert.equal(filled[1], 'b')
    assert.equal(filled.filter(Boolean).length, 2)

    const holed = removeSlot(filled, 0)
    assert.equal(holed[0], null)
    assert.equal(holed[1], 'b')

    const many = fillSlots([], Array.from({ length: 13 }, (_, i) => `r${i}`))
    assert.equal(many.filter(Boolean).length, 13)
    assert.ok(many.length >= PER_PAGE * 2)
    assert.equal(printablePages(many).length, 2)
    assert.equal(printablePages([]).length, 0)

    const swapped = setSlot(filled, 1, 'c')
    assert.equal(swapped[1], 'c')
  })
})

describe('pdf fallback', () => {
  it('wraps a jpeg in an A4 page', () => {
    const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])
    const pdf = jpegPagesToPdf([{ jpeg, width: 10, height: 10 }])
    const text = new TextDecoder().decode(pdf)
    assert.ok(text.startsWith('%PDF-1.4'))
    assert.match(text, /\/Count 1/)
    assert.match(text, /\/MediaBox \[0 0 595.28 841.89\]/)
    assert.ok(pdf.includes(0xff))
    assert.ok(pdf.includes(0xd8))
  })
})

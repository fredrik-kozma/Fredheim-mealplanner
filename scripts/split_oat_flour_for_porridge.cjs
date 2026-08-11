/* Splits the single oat-flour line in the two gluten-free scald breads
 * into a dough portion and a porridge portion.
 *
 * Both recipes listed one 200 g line of gluten-free oat flour and then
 * carved a piece out of it mid-method — the fluffy bread said "1/8 of
 * oat flour (taken from the oat flour)", the potato rolls just said "a
 * small amount". Two problems with that: the reader has to do arithmetic
 * while baking, and the fraction doesn't survive scaling — at 6 servings
 * "1/8 of the oat flour" is still a fraction to recompute, whereas two
 * real ingredient lines each scale on their own.
 *
 * The 25 g split (author-confirmed) matches the fluffy bread's stated
 * 1/8; the potato rolls never named an amount and are otherwise the same
 * recipe, so they get the same figure. Totals are unchanged: 175 + 25 =
 * the original 200 g in both.
 *
 * Naming is deliberate. The dough line keeps the ORIGINAL name and the
 * porridge line extends it as a prefix ("Glutenfritt havremel" →
 * "Glutenfritt havremel til grøten"). ingredientMatcher groups names
 * where the shorter is the head of the longer, so the shopping list
 * still merges them back into one 200 g entry — clear while baking,
 * one bag of flour while shopping. Naming them "…til deigen" /
 * "…til grøten" instead would break that prefix rule and split the
 * shopping list in two.
 */
const fs = require('fs')
const path = require('path')

const PACK_DIR = path.join(__dirname, '..', 'recipe-packs-template', 'packs')

const DOUGH_G = 175
const PORRIDGE_G = 25

// Per recipe, per language: the porridge-flour ingredient name, plus the
// step rewrites. `from` must match exactly or the script throws — no
// silent no-ops if the source text shifts.
const EDITS = [
  {
    file: 'fredheim-reversal-protocol.json',
    id: 'orn-17',
    langs: {
      en: {
        porridgeName: 'Gluten-free oat flour for the porridge',
        steps: [
          {
            from: 'Make an oat porridge: cook a small amount of the oat flour with the porridge water over medium heat, stirring, until thickened (2–3 minutes). Cool to room temperature.',
            to: 'Make an oat porridge: cook the oat flour for the porridge together with the porridge water over medium heat, stirring, until thickened (2–3 minutes). Cool to room temperature.',
          },
          {
            from: 'Whisk together the remaining oat flour, brown rice flour, psyllium husk powder, ground flaxseed, dry yeast and salt in a large bowl.',
            to: 'Whisk together the oat flour, brown rice flour, psyllium husk powder, ground flaxseed, dry yeast and salt in a large bowl.',
          },
        ],
      },
      no: {
        porridgeName: 'Glutenfritt havremel til grøten',
        steps: [
          {
            from: 'Lag en havregrøt: kok en liten mengde av havremelet med grøtvannet på middels varme mens du rører, til det tykner (2–3 minutter). Avkjøl til romtemperatur.',
            to: 'Lag en havregrøt: kok havremelet til grøten sammen med grøtvannet på middels varme mens du rører, til det tykner (2–3 minutter). Avkjøl til romtemperatur.',
          },
          {
            from: 'Visp sammen resten av havremelet, brunt rismel, psylliumhusk-pulver, malt linfrø, tørrgjær og salt i en stor bolle.',
            to: 'Visp sammen havremelet, brunt rismel, psylliumhusk-pulver, malt linfrø, tørrgjær og salt i en stor bolle.',
          },
        ],
      },
      sv: {
        porridgeName: 'Glutenfritt havremjöl till gröten',
        steps: [
          {
            from: 'Gör en havregröt: koka en liten mängd av havremjölet med gröt-vattnet på medelvärme under omrörning tills det tjocknat (2–3 minuter). Svalna till rumstemperatur.',
            to: 'Gör en havregröt: koka havremjölet till gröten tillsammans med gröt-vattnet på medelvärme under omrörning tills det tjocknat (2–3 minuter). Svalna till rumstemperatur.',
          },
          {
            from: 'Vispa samman resten av havremjölet, brunt rismjöl, psylliumpulver, malet linfrö, torrjäst och salt i en stor skål.',
            to: 'Vispa samman havremjölet, brunt rismjöl, psylliumpulver, malet linfrö, torrjäst och salt i en stor skål.',
          },
        ],
      },
    },
  },
  {
    file: 'fredheim-recipes-with-pictures.json',
    id: 'ultimate-fluffy-vegan-gluten-free-bread',
    langs: {
      en: {
        porridgeName: 'Gluten-free oat flour for the porridge',
        steps: [
          {
            from: 'Make the porridge: Mix 1/8 of oat flour (taken from the oat flour) with water for porridge in a small pot. Cook over medium heat, stirring constantly, until thickened, about 2-3 minutes. Cool to room temperature.',
            to: 'Make the porridge: Mix the oat flour for the porridge with the water for porridge in a small pot. Cook over medium heat, stirring constantly, until thickened, about 2-3 minutes. Cool to room temperature.',
          },
          {
            from: 'Mix all dry ingredients in a large bowl: remaining oat flour, rice flour, potato starch, psyllium husk powder, instant yeast and salt. Whisk well to combine.',
            to: 'Mix all dry ingredients in a large bowl: oat flour, rice flour, potato starch, psyllium husk powder, instant yeast and salt. Whisk well to combine.',
          },
        ],
      },
      no: {
        porridgeName: 'Glutenfritt havremel til grøten',
        steps: [
          {
            from: 'Lag grøten. Bland 1/8 av havremelet (tatt fra totalmengden havremel) med vannet til grøten i en liten kjele. Kok over middels varme, rør konstant, til det tykner, omtrent 2-3 minutter. Avkjøl til romtemperatur.',
            to: 'Lag grøten. Bland havremelet til grøten med vannet til grøten i en liten kjele. Kok over middels varme, rør konstant, til det tykner, omtrent 2-3 minutter. Avkjøl til romtemperatur.',
          },
          {
            from: 'Bland alle de tørre ingrediensene i en stor bolle: resten av havremelet, rismel, potetstivelse, psyllium husk pulver, tørrgjær og salt. Visp godt sammen.',
            to: 'Bland alle de tørre ingrediensene i en stor bolle: havremel, rismel, potetstivelse, psyllium husk pulver, tørrgjær og salt. Visp godt sammen.',
          },
        ],
      },
    },
  },
]

function applyStepEdits(steps, edits, label) {
  return steps.map(s => {
    for (const e of edits) if (s === e.from) return e.to
    return s
  })
}

function assertEditsHit(before, after, edits, label) {
  for (const e of edits) {
    if (!before.includes(e.from)) throw new Error(`${label}: step text not found:\n  ${e.from}`)
    if (!after.includes(e.to)) throw new Error(`${label}: rewrite did not apply for:\n  ${e.from}`)
  }
}

const touched = new Map()
for (const spec of EDITS) {
  const p = path.join(PACK_DIR, spec.file)
  const pack = touched.get(spec.file) || JSON.parse(fs.readFileSync(p, 'utf8'))
  touched.set(spec.file, pack)

  const r = pack.recipes.find(x => x.id === spec.id)
  if (!r) throw new Error(`recipe not found: ${spec.id}`)

  // Locate the oat flour line in the base (EN) list; every language's
  // array is index-matched to it, so one index serves all of them.
  const idx = r.ingredients.findIndex(i => /oat flour/i.test(i.name))
  if (idx === -1) throw new Error(`${spec.id}: no oat flour ingredient found`)
  // Read the value out rather than holding the object — the line is
  // mutated below, so a reference would report the new figure.
  const originalGrams = r.ingredients[idx].quantity
  if (originalGrams !== DOUGH_G + PORRIDGE_G) {
    throw new Error(`${spec.id}: expected ${DOUGH_G + PORRIDGE_G} g oat flour, found ${originalGrams}`)
  }

  for (const [lang, cfg] of Object.entries(spec.langs)) {
    const list = lang === 'en' ? r.ingredients : r.translations?.[lang]?.ingredients
    const steps = lang === 'en' ? r.steps : r.translations?.[lang]?.steps
    if (!list || !steps) throw new Error(`${spec.id}: missing ${lang} data`)

    const flourLine = list[idx]
    flourLine.quantity = DOUGH_G
    // Insert the porridge portion directly after the dough portion so the
    // two flours read together.
    list.splice(idx + 1, 0, { quantity: PORRIDGE_G, unit: 'g', name: cfg.porridgeName })

    const rewritten = applyStepEdits(steps, cfg.steps, `${spec.id}/${lang}`)
    assertEditsHit(steps, rewritten, cfg.steps, `${spec.id}/${lang}`)
    if (lang === 'en') r.steps = rewritten
    else r.translations[lang].steps = rewritten
  }

  console.log(`${spec.id}: oat flour ${originalGrams} g -> ${DOUGH_G} g dough + ${PORRIDGE_G} g porridge (${Object.keys(spec.langs).join('/')})`)
}

for (const [file, pack] of touched) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
  pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
  fs.writeFileSync(path.join(PACK_DIR, file), JSON.stringify(pack, null, 2) + '\n', 'utf8')
  console.log(`WROTE ${file} -> ${pack.version}`)
}

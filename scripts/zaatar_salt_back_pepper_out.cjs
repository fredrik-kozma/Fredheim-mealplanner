/* Za'atar plate: put the salt back, take only the pepper out.
 *
 * I removed both last time by reading "the thing with pepper" as the
 * whole salt-and-pepper row. Salt was wanted; only the pepper was not.
 *
 * Salt returns as a to-taste row — quantity null with ", to taste" on the
 * name — which is the convention the rest of this pack already uses for
 * seasoning ("Sea salt, to taste" appears on a dozen recipes). It stays
 * out of the nutrition for the same reason as before: an amount nobody
 * states cannot be counted.
 *
 * The careful part is the step text. In English "pepper" appears three
 * times in these steps and two of them are the red bell pepper — "chop
 * the pepper after removing stem and seeds", "mix the tomato, pepper,
 * capers". Only the trailing seasoning clause is black pepper, so the
 * replacement matches that exact sentence rather than the word, and the
 * bell pepper is left alone in every language.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-recipes-with-pictures.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))
const r = pack.recipes.find(x => x.id === 'zaatar-hummus-salad')
if (!r) throw new Error('recipe not found')
if (r.ingredients.some(i => /^salt/i.test(i.name))) throw new Error('a salt row already exists')

// ── salt back, as a to-taste row ──────────────────────────────────────
const SALT = {
  en: { quantity: null, unit: '', name: 'salt, to taste' },
  no: { quantity: null, unit: '', name: 'salt, etter smak' },
  sv: { quantity: null, unit: '', name: 'salt, efter smak' },
}
r.ingredients.push(SALT.en)
r.translations.no.ingredients.push(SALT.no)
r.translations.sv.ingredients.push(SALT.sv)

// ── pepper out of the seasoning clause only ───────────────────────────
// Matched as whole sentences. A bare /pepper/ replace would hit the bell
// pepper earlier in the same English step.
const SEASONING = {
  en: ['Season with salt and pepper.', 'Season with salt.'],
  no: ['Smak til med salt og pepper.', 'Smak til med salt.'],
  sv: ['Smaka av med salt och peppar.', 'Smaka av med salt.'],
}
const stepLists = { en: r.steps, no: r.translations.no.steps, sv: r.translations.sv.steps }
for (const [lang, steps] of Object.entries(stepLists)) {
  const [from, to] = SEASONING[lang]
  const i = steps.findIndex(s => s.includes(from))
  if (i === -1) throw new Error(`${lang}: seasoning sentence not found — already changed?`)
  steps[i] = steps[i].replace(from, to)
}

// The bell pepper must have survived all of that.
const bell = { en: /red bell pepper/i, no: /rød paprika/i, sv: /röd paprika/i }
const ingLists = { en: r.ingredients, no: r.translations.no.ingredients, sv: r.translations.sv.ingredients }
for (const [lang, list] of Object.entries(ingLists)) {
  if (!list.some(i => bell[lang].test(i.name))) throw new Error(`${lang}: bell pepper went missing`)
  if (list.length !== r.ingredients.length) throw new Error(`${lang}: length drift`)
  list.forEach((ing, i) => {
    if (ing.quantity !== r.ingredients[i].quantity) throw new Error(`${lang}[${i}]: quantity mismatch`)
  })
}
// And no black pepper should be left anywhere.
for (const [lang, steps] of Object.entries(stepLists)) {
  const seasoning = steps.filter(s => /salt (and|og|och) pepp/i.test(s))
  if (seasoning.length) throw new Error(`${lang}: seasoning still mentions pepper: ${seasoning[0]}`)
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`salt restored as a to-taste row; ingredients now ${r.ingredients.length}`)
console.log(`seasoning step EN: ${r.steps.find(s => /Season with/.test(s)).slice(-40)}`)
console.log(`seasoning step NO: ${r.translations.no.steps.find(s => /Smak til med/.test(s)).slice(-40)}`)
console.log(`bell pepper intact: ${r.ingredients.find(i => /red bell pepper/i.test(i.name)).quantity} g`)
console.log(`Pack -> ${pack.version}`)

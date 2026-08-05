/* orn-38 (Rye Sourdough) and orn-39 (Wholegrain Rye Loaf) both instructed
 * baking at 250°C for 65–70 minutes before dropping to 180°C. That's a
 * typo from drafting — the hot blast at 250°C is meant to be 15 minutes,
 * matching the actual technique (steam-set the crust, then finish low).
 * Author-confirmed correction, all three languages, both recipes.
 */
const fs = require('fs')
const path = require('path')

const PACK = path.join(__dirname, '..', 'recipe-packs-template', 'packs', 'fredheim-reversal-protocol.json')
const pack = JSON.parse(fs.readFileSync(PACK, 'utf8'))

const REPLACEMENTS = [
  // [id, lang, from, to]
  ['orn-38', 'en', 'Bake at 250°C for 70 minutes,', 'Bake at 250°C for 15 minutes,'],
  ['orn-38', 'no', 'Stek på 250°C i 70 minutter,', 'Stek på 250°C i 15 minutter,'],
  ['orn-38', 'sv', 'Grädda i 250 °C i 70 minuter,', 'Grädda i 250 °C i 15 minuter,'],
  ['orn-39', 'en', 'Bake at 250°C for 65 minutes,', 'Bake at 250°C for 15 minutes,'],
  ['orn-39', 'no', 'Stek på 250°C i 65 minutter,', 'Stek på 250°C i 15 minutter,'],
  ['orn-39', 'sv', 'Grädda i 250 °C i 65 minuter,', 'Grädda i 250 °C i 15 minuter,'],
]

let changed = 0
for (const [id, lang, from, to] of REPLACEMENTS) {
  const r = pack.recipes.find(x => x.id === id)
  if (!r) throw new Error(`recipe not found: ${id}`)
  const steps = lang === 'en' ? r.steps : r.translations?.[lang]?.steps
  if (!steps) throw new Error(`no ${lang} steps for ${id}`)
  let hit = false
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].includes(from)) {
      steps[i] = steps[i].replace(from, to)
      hit = true
      changed++
    }
  }
  if (!hit) throw new Error(`text not found for ${id}/${lang}: "${from}"`)
}

const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(pack.version)
pack.version = `${m[1]}.${Number(m[2]) + 1}.0`
fs.writeFileSync(PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')

console.log(`Fixed ${changed} step texts. Pack -> ${pack.version}\n`)
for (const id of ['orn-38', 'orn-39']) {
  const r = pack.recipes.find(x => x.id === id)
  console.log(`${id} — ${r.title}`)
  console.log('  EN:', r.steps.find(s => s.includes('250°C')))
  console.log('  NO:', r.translations.no.steps.find(s => s.includes('250°C')))
  console.log('  SV:', r.translations.sv.steps.find(s => s.includes('250 °C')))
  console.log()
}

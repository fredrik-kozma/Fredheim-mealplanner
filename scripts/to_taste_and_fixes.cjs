/* Adopts the "to taste" convention for ingredients where a scaled number is
 * meaningless, using the pattern the fasting pack already uses: quantity
 * left null, no unit, and the intent written into the name.
 *
 *   - pinch / dash seasonings (salt, cayenne, nutmeg, paprika, turmeric,
 *     vanilla) -> "…, to taste". "0.5 pinch" was never useful.
 *   - bay leaves -> "… (1–2 leaves)". A bay leaf weighs 0.2 g, so grams are
 *     absurd, and it is fished out before serving anyway.
 *
 * Also fixes two rows where the Norwegian ingredient list had lost its unit
 * (EN "0.5 pcs Lemon" vs NO "0.5" with nothing) — pre-existing, unrelated to
 * the unit work, but trivially fixable while here.
 *
 * Run with --write to apply; default is a dry run.
 */
const fs = require('fs')
const path = require('path')

const WRITE = process.argv.includes('--write')
const PACKS = ['fredheim-recipes-with-pictures', 'fredheim-reversal-protocol', 'fredheim-fmd-5day']
const NEW_VERSION = {
  'fredheim-recipes-with-pictures': '1.20.0',
  'fredheim-reversal-protocol': '1.15.0',
  'fredheim-fmd-5day': '1.6.0',
}

const SUFFIX = {
  taste: { en: ', to taste', no: ', etter smak', sv: ', efter smak' },
  bay: { en: ' (1–2 leaves)', no: ' (1–2 blader)', sv: ' (1–2 blad)' },
}

function addSuffix(name, kind, lang) {
  const s = SUFFIX[kind][lang]
  if (!name) return name
  // Don't double up if the recipe already says it.
  const already = kind === 'taste'
    ? /to taste|etter smak|efter smak/i.test(name)
    : /leaves|blader|blad\)/i.test(name)
  return already ? name : name + s
}

const changes = []
for (const f of PACKS) {
  const p = path.join(__dirname, '..', 'recipe-packs-template', 'packs', `${f}.json`)
  const pack = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const r of pack.recipes) {
    const base = r.ingredients || []
    for (let k = 0; k < base.length; k++) {
      const unit = String(base[k].unit || '').toLowerCase().trim()
      const name = String(base[k].name || '')
      const isBay = /bay leaf|bay leaves/i.test(name)
      const isPinch = unit === 'pinch' || unit === 'dash'
      if (!isBay && !isPinch) continue
      const kind = isBay ? 'bay' : 'taste'

      changes.push({ recipe: r.title, name, from: `${base[k].quantity} ${unit || '(none)'}`, kind })
      if (!WRITE) continue
      const langs = [['en', base], ['no', r.translations?.no?.ingredients], ['sv', r.translations?.sv?.ingredients]]
      for (const [lang, arr] of langs) {
        if (!arr?.[k]) continue
        arr[k].quantity = null
        arr[k].unit = ''
        arr[k].name = addSuffix(arr[k].name, kind, lang)
      }
    }

    // Repair rows where a translation lost its unit entirely.
    for (let k = 0; k < base.length; k++) {
      const enUnit = String(base[k].unit || '')
      if (!enUnit) continue
      for (const lang of ['no', 'sv']) {
        const t = r.translations?.[lang]?.ingredients?.[k]
        if (!t || String(t.unit || '') !== '') continue
        changes.push({ recipe: r.title, name: base[k].name, from: `${lang.toUpperCase()} unit was empty`, kind: 'unit-repair' })
        if (WRITE) t.unit = enUnit
      }
    }
  }
  if (WRITE) {
    pack.version = NEW_VERSION[f]
    fs.writeFileSync(p, JSON.stringify(pack, null, 2) + '\n', 'utf8')
  }
}

const byKind = changes.reduce((m, c) => ((m[c.kind] = (m[c.kind] || 0) + 1), m), {})
console.log(`${WRITE ? 'APPLIED' : 'DRY RUN'} —`, JSON.stringify(byKind))
changes.forEach(c => console.log(`  [${c.kind}] ${c.from.padEnd(22)} ${String(c.name).slice(0, 34).padEnd(36)} ${c.recipe.slice(0, 28)}`))

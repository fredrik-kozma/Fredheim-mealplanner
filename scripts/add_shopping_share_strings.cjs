/* Strings for sharing a shopping list, in all three languages.
 * Same rules as add_share_strings.cjs: never overwrite an existing key,
 * and counted strings get _one/_other rather than a bare {{count}}.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales')

const STRINGS = {
  en: {
    share: {
      titleShopping: 'Share this shopping list',
      asLinkHintShopping: 'They tap it and can tick it off in their own app',
      aShoppingList: 'A shopping list',
      shoppingSummary_one: '{{count}} item',
      shoppingSummary_other: '{{count}} items',
      shoppingSnapshot: "This is a copy as it was when it was sent. It won't update if they change their week.",
      saveShoppingList: 'Save as its own list',
      mergeShoppingList: 'Add to my list',
    },
    shopping: {
      share: 'Share',
      shareOptionsTitle: 'What should be shared?',
      forPeople_one: 'for {{count}} person',
      forPeople_other: 'for {{count}} people',
    },
  },
  no: {
    share: {
      titleShopping: 'Del denne handlelisten',
      asLinkHintShopping: 'De trykker på den og kan krysse av i sin egen app',
      aShoppingList: 'En handleliste',
      shoppingSummary_one: '{{count}} vare',
      shoppingSummary_other: '{{count}} varer',
      shoppingSnapshot: 'Dette er en kopi slik den var da den ble sendt. Den oppdateres ikke om de endrer uken sin.',
      saveShoppingList: 'Lagre som egen liste',
      mergeShoppingList: 'Legg til i min liste',
    },
    shopping: {
      share: 'Del',
      shareOptionsTitle: 'Hva skal deles?',
      forPeople_one: 'for {{count}} person',
      forPeople_other: 'for {{count}} personer',
    },
  },
  sv: {
    share: {
      titleShopping: 'Dela den här inköpslistan',
      asLinkHintShopping: 'De trycker på den och kan bocka av i sin egen app',
      aShoppingList: 'En inköpslista',
      shoppingSummary_one: '{{count}} vara',
      shoppingSummary_other: '{{count}} varor',
      shoppingSnapshot: 'Det här är en kopia som den såg ut när den skickades. Den uppdateras inte om de ändrar sin vecka.',
      saveShoppingList: 'Spara som egen lista',
      mergeShoppingList: 'Lägg till i min lista',
    },
    shopping: {
      share: 'Dela',
      shareOptionsTitle: 'Vad ska delas?',
      forPeople_one: 'för {{count}} person',
      forPeople_other: 'för {{count}} personer',
    },
  },
}

for (const [lang, groups] of Object.entries(STRINGS)) {
  const file = path.join(DIR, `${lang}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  let added = 0, kept = 0
  for (const [group, entries] of Object.entries(groups)) {
    json[group] = json[group] || {}
    for (const [key, value] of Object.entries(entries)) {
      if (json[group][key] != null) { kept++; continue }
      json[group][key] = value
      added++
    }
  }
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(`${lang}.json  +${added} added, ${kept} left alone`)
}

// All three must carry the same keys, or a language silently falls back
// to English for whatever it lacks.
const expected = Object.entries(STRINGS.en).flatMap(([g, e]) => Object.keys(e).map(k => `${g}.${k}`))
for (const lang of ['no', 'sv']) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, `${lang}.json`), 'utf8'))
  const missing = expected.filter(k => { const [g, key] = k.split('.'); return j[g]?.[key] == null })
  if (missing.length) throw new Error(`${lang} is missing: ${missing.join(', ')}`)
}
console.log(`all three locales carry the same ${expected.length} new keys`)

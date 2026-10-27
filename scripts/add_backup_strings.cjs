/* Strings for the "Your data" backup section, in all three languages.
 * Never overwrites an existing key.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales')

const STRINGS = {
  en: {
    backup: {
      title: 'Your data',
      desc: 'Everything you make is stored in this browser only. Save a copy you can keep, and bring it back on a new phone or after clearing your browser.',
      export: 'Export my data',
      import: 'Import data',
      exported: 'Saved as {{file}}',
      exportFailed: "Couldn't save the file.",
      imported_one: 'Restored — {{count}} of your recipes is back.',
      imported_other: 'Restored — {{count}} of your recipes are back.',
      importFailed: "Couldn't restore that backup.",
      errNotBackup: 'That file is not a Fredheim backup.',
      errNewer: 'That backup was made by a newer version of the app. Update the app and try again.',
      errEmpty: 'That backup has nothing in it.',
      errUnreadable: "That file couldn't be read. It may be damaged.",
      confirmTitle: 'Restore this backup?',
      madeOn: 'Made on {{date}}',
      sumRecipes: 'Your recipes',
      sumMeals: 'Planned meals',
      sumTemplates: 'Saved weeks',
      sumFavourites: 'Favourites',
      sumNutrition: 'Days of nutrition log',
      sumShopping: 'Saved shopping lists',
      someDropped: 'Some parts of this file were damaged and will not be restored: {{fields}}',
      replaceWarning: 'This replaces what is in the app now. The built-in recipes are not affected.',
      confirmRestore: 'Restore',
    },
  },
  no: {
    backup: {
      title: 'Dataene dine',
      desc: 'Alt du lager lagres bare i denne nettleseren. Lagre en kopi du kan ta vare på, og hent den tilbake på en ny telefon eller etter at du har tømt nettleseren.',
      export: 'Eksporter dataene mine',
      import: 'Importer data',
      exported: 'Lagret som {{file}}',
      exportFailed: 'Kunne ikke lagre filen.',
      imported_one: 'Gjenopprettet — {{count}} av oppskriftene dine er tilbake.',
      imported_other: 'Gjenopprettet — {{count}} av oppskriftene dine er tilbake.',
      importFailed: 'Kunne ikke gjenopprette den sikkerhetskopien.',
      errNotBackup: 'Den filen er ikke en Fredheim-sikkerhetskopi.',
      errNewer: 'Den sikkerhetskopien er laget med en nyere versjon av appen. Oppdater appen og prøv igjen.',
      errEmpty: 'Den sikkerhetskopien er tom.',
      errUnreadable: 'Filen kunne ikke leses. Den kan være ødelagt.',
      confirmTitle: 'Gjenopprette denne sikkerhetskopien?',
      madeOn: 'Laget {{date}}',
      sumRecipes: 'Dine oppskrifter',
      sumMeals: 'Planlagte måltider',
      sumTemplates: 'Lagrede uker',
      sumFavourites: 'Favoritter',
      sumNutrition: 'Dager med ernæringslogg',
      sumShopping: 'Lagrede handlelister',
      someDropped: 'Deler av denne filen var ødelagt og blir ikke gjenopprettet: {{fields}}',
      replaceWarning: 'Dette erstatter det som ligger i appen nå. De innebygde oppskriftene berøres ikke.',
      confirmRestore: 'Gjenopprett',
    },
  },
  sv: {
    backup: {
      title: 'Dina data',
      desc: 'Allt du gör sparas bara i den här webbläsaren. Spara en kopia du kan behålla, och hämta tillbaka den på en ny telefon eller efter att du rensat webbläsaren.',
      export: 'Exportera mina data',
      import: 'Importera data',
      exported: 'Sparad som {{file}}',
      exportFailed: 'Kunde inte spara filen.',
      imported_one: 'Återställt — {{count}} av dina recept är tillbaka.',
      imported_other: 'Återställt — {{count}} av dina recept är tillbaka.',
      importFailed: 'Kunde inte återställa den säkerhetskopian.',
      errNotBackup: 'Den filen är inte en Fredheim-säkerhetskopia.',
      errNewer: 'Den säkerhetskopian är gjord med en nyare version av appen. Uppdatera appen och försök igen.',
      errEmpty: 'Den säkerhetskopian är tom.',
      errUnreadable: 'Filen kunde inte läsas. Den kan vara skadad.',
      confirmTitle: 'Återställa den här säkerhetskopian?',
      madeOn: 'Gjord {{date}}',
      sumRecipes: 'Dina recept',
      sumMeals: 'Planerade måltider',
      sumTemplates: 'Sparade veckor',
      sumFavourites: 'Favoriter',
      sumNutrition: 'Dagar med näringslogg',
      sumShopping: 'Sparade inköpslistor',
      someDropped: 'Delar av den här filen var skadade och återställs inte: {{fields}}',
      replaceWarning: 'Det här ersätter det som finns i appen nu. De inbyggda recepten påverkas inte.',
      confirmRestore: 'Återställ',
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

const expected = Object.entries(STRINGS.en).flatMap(([g, e]) => Object.keys(e).map(k => `${g}.${k}`))
for (const lang of ['no', 'sv']) {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, `${lang}.json`), 'utf8'))
  const missing = expected.filter(k => { const [g, key] = k.split('.'); return j[g]?.[key] == null })
  if (missing.length) throw new Error(`${lang} is missing: ${missing.join(', ')}`)
}
console.log(`all three locales carry the same ${expected.length} backup keys`)

/* "1 måltider planlagt" — the counted share strings need real plural
 * forms. This project already uses i18next's _one/_other convention
 * (18 keys do), so these should too rather than inventing a style.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales')

const PLURALS = {
  en: {
    weekSummary: ['{{count}} meal planned', '{{count}} meals planned'],
    recipeSummary: ['{{count}} ingredient', '{{count}} ingredients'],
    replaceWarning: [
      'This replaces the week you have now ({{count}} meal). Save it first if you want to keep it.',
      'This replaces the week you have now ({{count}} meals). Save it first if you want to keep it.',
    ],
  },
  no: {
    weekSummary: ['{{count}} måltid planlagt', '{{count}} måltider planlagt'],
    recipeSummary: ['{{count}} ingrediens', '{{count}} ingredienser'],
    replaceWarning: [
      'Dette erstatter uken du har nå ({{count}} måltid). Lagre den først hvis du vil beholde den.',
      'Dette erstatter uken du har nå ({{count}} måltider). Lagre den først hvis du vil beholde den.',
    ],
  },
  sv: {
    weekSummary: ['{{count}} måltid planerat', '{{count}} måltider planerade'],
    recipeSummary: ['{{count}} ingrediens', '{{count}} ingredienser'],
    replaceWarning: [
      'Det här ersätter veckan du har nu ({{count}} måltid). Spara den först om du vill behålla den.',
      'Det här ersätter veckan du har nu ({{count}} måltider). Spara den först om du vill behålla den.',
    ],
  },
}

for (const [lang, keys] of Object.entries(PLURALS)) {
  const file = path.join(DIR, `${lang}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  for (const [key, [one, other]] of Object.entries(keys)) {
    // The bare key has to go: with both present i18next prefers the
    // plural pair, but leaving the singular behind invites someone to
    // edit the one that does nothing.
    delete json.share[key]
    json.share[`${key}_one`] = one
    json.share[`${key}_other`] = other
  }
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(`${lang}.json  3 counted strings now have singular and plural forms`)
}

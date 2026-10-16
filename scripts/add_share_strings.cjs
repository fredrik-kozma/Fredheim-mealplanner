/* Translations for the share feature.
 *
 * Every string the components use carries an English defaultValue, so
 * the app works without this; the point of running it is that a
 * Norwegian user should not meet an English sentence the moment they tap
 * Share. Written rather than machine-translated, in the same register as
 * the rest of each file.
 */
const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales')

const STRINGS = {
  en: {
    share: {
      servingsLabel: 'Servings',
      titleWeek: 'Share this menu',
      titleRecipe: 'Share this recipe',
      viaSheet: 'Share',
      viaCopy: 'Copy',
      asLink: 'as a link',
      asLinkHintWeek: 'They tap it and the app offers to add the whole week',
      asLinkHintRecipe: 'They tap it and the app opens the recipe',
      asText: 'as text',
      asTextHint: 'Readable by anyone, even without the app',
      asFile: 'as a file',
      asFileHint: 'Keeps the photo; they open it with Import',
      copied: 'Copied — paste it anywhere',
      downloaded: 'Saved to your downloads',
      failed: "Couldn't share that",
      opening: 'Opening…',
      sharedWithYou: 'Shared with you',
      aWeekMenu: 'A week of meals',
      aRecipe: 'A recipe',
      weekSummary: '{{count}} meals planned',
      recipeSummary: '{{count}} ingredients',
      replaceWarning: 'This replaces the week you have now ({{count}} meals). Save it first if you want to keep it.',
      addWeek: 'Add to my planner',
      openRecipe: 'Open the recipe',
      saveRecipe: 'Save to my recipes',
      noPhoto: 'The photo was too big to send in a link — the recipe itself is complete.',
      needPack: "You don't have this recipe yet. It comes from a recipe pack — install it under Packs and open the link again.",
      goPacks: 'Go to packs',
      goHome: 'Go to recipes',
      badTitle: "This link didn't work",
      badLink: 'It may have been cut short when it was sent. Ask for it again, as a complete link.',
      badVersion: 'It was made by a newer version of the app. Update and try again.',
    },
    planner: { shareWeek: 'Share', shareWeekHint: 'Send this menu to someone' },
    recipeDetail: { share: 'Share' },
  },
  no: {
    share: {
      servingsLabel: 'Porsjoner',
      titleWeek: 'Del denne menyen',
      titleRecipe: 'Del denne oppskriften',
      viaSheet: 'Del',
      viaCopy: 'Kopier',
      asLink: 'som lenke',
      asLinkHintWeek: 'De trykker på den, og appen tilbyr å legge inn hele uken',
      asLinkHintRecipe: 'De trykker på den, og appen åpner oppskriften',
      asText: 'som tekst',
      asTextHint: 'Kan leses av alle, også uten appen',
      asFile: 'som fil',
      asFileHint: 'Beholder bildet; de åpner den med Importer',
      copied: 'Kopiert — lim den inn hvor du vil',
      downloaded: 'Lagret i nedlastingene dine',
      failed: 'Kunne ikke dele dette',
      opening: 'Åpner…',
      sharedWithYou: 'Delt med deg',
      aWeekMenu: 'En uke med måltider',
      aRecipe: 'En oppskrift',
      weekSummary: '{{count}} måltider planlagt',
      recipeSummary: '{{count}} ingredienser',
      replaceWarning: 'Dette erstatter uken du har nå ({{count}} måltider). Lagre den først hvis du vil beholde den.',
      addWeek: 'Legg inn i ukeplanen min',
      openRecipe: 'Åpne oppskriften',
      saveRecipe: 'Lagre blant oppskriftene mine',
      noPhoto: 'Bildet var for stort til å sendes i en lenke — selve oppskriften er komplett.',
      needPack: 'Du har ikke denne oppskriften ennå. Den hører til en oppskriftspakke — installer den under Pakker og åpne lenken på nytt.',
      goPacks: 'Gå til pakker',
      goHome: 'Gå til oppskrifter',
      badTitle: 'Denne lenken virket ikke',
      badLink: 'Den kan ha blitt kuttet av da den ble sendt. Be om den på nytt, som en hel lenke.',
      badVersion: 'Den er laget med en nyere versjon av appen. Oppdater og prøv igjen.',
    },
    planner: { shareWeek: 'Del', shareWeekHint: 'Send denne menyen til noen' },
    recipeDetail: { share: 'Del' },
  },
  sv: {
    share: {
      servingsLabel: 'Portioner',
      titleWeek: 'Dela den här menyn',
      titleRecipe: 'Dela det här receptet',
      viaSheet: 'Dela',
      viaCopy: 'Kopiera',
      asLink: 'som länk',
      asLinkHintWeek: 'De trycker på den och appen erbjuder sig att lägga in hela veckan',
      asLinkHintRecipe: 'De trycker på den och appen öppnar receptet',
      asText: 'som text',
      asTextHint: 'Läsbar för alla, även utan appen',
      asFile: 'som fil',
      asFileHint: 'Behåller bilden; de öppnar den med Importera',
      copied: 'Kopierat — klistra in var du vill',
      downloaded: 'Sparat bland dina nedladdningar',
      failed: 'Kunde inte dela det här',
      opening: 'Öppnar…',
      sharedWithYou: 'Delat med dig',
      aWeekMenu: 'En vecka med måltider',
      aRecipe: 'Ett recept',
      weekSummary: '{{count}} måltider planerade',
      recipeSummary: '{{count}} ingredienser',
      replaceWarning: 'Det här ersätter veckan du har nu ({{count}} måltider). Spara den först om du vill behålla den.',
      addWeek: 'Lägg in i min veckoplan',
      openRecipe: 'Öppna receptet',
      saveRecipe: 'Spara bland mina recept',
      noPhoto: 'Bilden var för stor för att skickas i en länk — själva receptet är komplett.',
      needPack: 'Du har inte det här receptet än. Det hör till ett receptpaket — installera det under Paket och öppna länken igen.',
      goPacks: 'Gå till paket',
      goHome: 'Gå till recept',
      badTitle: 'Den här länken fungerade inte',
      badLink: 'Den kan ha kapats när den skickades. Be om den igen, som en hel länk.',
      badVersion: 'Den är gjord med en nyare version av appen. Uppdatera och försök igen.',
    },
    planner: { shareWeek: 'Dela', shareWeekHint: 'Skicka den här menyn till någon' },
    recipeDetail: { share: 'Dela' },
  },
}

for (const [lang, groups] of Object.entries(STRINGS)) {
  const file = path.join(DIR, `${lang}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  let added = 0
  let kept = 0
  for (const [group, entries] of Object.entries(groups)) {
    json[group] = json[group] || {}
    for (const [key, value] of Object.entries(entries)) {
      // Never overwrite: these files are hand-maintained and a rerun of
      // this script must not quietly revert someone's wording.
      if (json[group][key] != null) { kept++; continue }
      json[group][key] = value
      added++
    }
  }
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
  console.log(`${lang}.json  +${added} added, ${kept} left alone`)
}

// The three files must agree on which keys exist, or a language silently
// falls back to English for whatever it is missing.
const keysOf = (lang) => {
  const j = JSON.parse(fs.readFileSync(path.join(DIR, `${lang}.json`), 'utf8'))
  return Object.entries(STRINGS.en).flatMap(([g, entries]) =>
    Object.keys(entries).filter(k => j[g]?.[k] != null).map(k => `${g}.${k}`))
}
const en = keysOf('en')
for (const lang of ['no', 'sv']) {
  const missing = en.filter(k => !keysOf(lang).includes(k))
  if (missing.length) throw new Error(`${lang} is missing: ${missing.join(', ')}`)
}
console.log(`all three locales carry the same ${en.length} share keys`)

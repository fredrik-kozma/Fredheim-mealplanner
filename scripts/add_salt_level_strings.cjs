// One-off: en/no/sv strings for the salt level, "not for me", and the Make
// my week questions (multiple goals, breakfast, favourites, fewer
// ingredients, salt). Merges into the locale files; re-running is harmless.
const fs = require('fs')
const S = {
  en: {
    salt: {
      title: 'Salt level',
      standard: 'Standard (healthy adults, WHO: under 5 g salt/day)',
      low: 'Low salt (blood pressure, heart or kidney disease)',
      desc: 'Savoury dishes have a standard salt amount for healthy adults. Low salt uses every recipe exactly as written. Health labels always describe the low-salt version.',
      tip: 'Add the salt at the end or at the table: you taste more with less. Lemon, garlic, herbs, tomato paste, miso and nutritional yeast boost flavour.',
      lowHint: 'Low salt: {{amount}}',
      toTaste: 'to taste',
      sodiumLine: 'Standard salt: {{standard}} mg sodium per serving (low salt: {{low}} mg).',
      labelNote: 'The “{{label}}” label applies to the low-salt version.',
    },
    dislike: {
      add: 'Not for me',
      remove: 'Marked “not for me”. Tap to undo',
      hint: 'Make my week won’t pick this recipe.',
    },
    makeMyWeek: {
      q: { prefs: 'A few preferences', breakfast: 'Breakfast: savoury, sweet or both?', salt: 'Salt level' },
      goalsHint: 'Pick one or more.',
      breakfasts: { both: 'Both', savoury: 'Savoury', sweet: 'Sweet' },
      breakfastKinds: { savoury: 'savoury', sweet: 'sweet' },
      breakfastHint: 'Spreads follow the same choice.',
      saltAuto: 'Low salt, because of the health goal you chose.',
      preferFavourites: 'Prefer my favourites',
      preferFavouritesHint_one: '{{count}} favourite',
      preferFavouritesHint_other: '{{count}} favourites',
      noFavouritesYet: 'No favourites yet: tap ♥ on a recipe.',
      fewerIngredients: 'Fewer ingredients / shorter shopping list',
      fewerIngredientsHint: 'Dishes that share ingredients, and a dish twice rather than a new one',
      uniqueIngredients_one: 'This week needs {{count}} different ingredient.',
      uniqueIngredients_other: 'This week needs {{count}} different ingredients.',
      goalNoteMany: 'Every recipe carries these labels: {{labels}}.',
      notice: {
        goalRelaxed: 'Too few recipes fit all your goals at once, so “{{goals}}” was left out. The week follows: {{kept}}.',
        breakfastRelaxed: 'Only a few {{kind}} breakfasts fit your choices, so some others are mixed in.',
        favouritesUsed_one: '{{count}} of your favourites is in this week.',
        favouritesUsed_other: '{{count}} of your favourites are in this week.',
        noFavourites: 'None of your favourites fit this week’s choices.',
        saltStandard: 'Salt level: Standard. Savoury dishes use their standard salt amount (about 700 mg sodium a main meal). Health labels describe the low-salt version.',
        saltLow: 'Salt level: Low salt. The recipes are used exactly as written.',
        saltLowAuto: 'Salt level: Low salt, because of your health goal. The recipes are used exactly as written.',
      },
    },
  },
  no: {
    salt: {
      title: 'Saltnivå',
      standard: 'Standard (friske voksne, WHO: under 5 g salt/dag)',
      low: 'Lite salt (blodtrykk, hjerte- eller nyresykdom)',
      desc: 'Salte retter har en standard saltmengde for friske voksne. Lite salt bruker hver oppskrift nøyaktig slik den er skrevet. Helsemerkene gjelder alltid versjonen med lite salt.',
      tip: 'Tilsett saltet til slutt eller ved bordet: du kjenner mer smak med mindre salt. Sitron, hvitløk, urter, tomatpuré, miso og næringsgjær gir mer smak.',
      lowHint: 'Lite salt: {{amount}}',
      toTaste: 'etter smak',
      sodiumLine: 'Standard salt: {{standard}} mg natrium per porsjon (lite salt: {{low}} mg).',
      labelNote: 'Merket «{{label}}» gjelder versjonen med lite salt.',
    },
    dislike: {
      add: 'Ikke for meg',
      remove: 'Merket «ikke for meg». Trykk for å angre',
      hint: 'Lag uken min velger ikke denne oppskriften.',
    },
    makeMyWeek: {
      q: { prefs: 'Noen ønsker', breakfast: 'Frokost: salt, søt eller begge deler?', salt: 'Saltnivå' },
      goalsHint: 'Velg ett eller flere.',
      breakfasts: { both: 'Begge deler', savoury: 'Salt', sweet: 'Søt' },
      breakfastKinds: { savoury: 'salte', sweet: 'søte' },
      breakfastHint: 'Pålegget følger samme valg.',
      saltAuto: 'Lite salt, på grunn av helsemålet du valgte.',
      preferFavourites: 'Foretrekk favorittene mine',
      preferFavouritesHint_one: '{{count}} favoritt',
      preferFavouritesHint_other: '{{count}} favoritter',
      noFavouritesYet: 'Ingen favoritter ennå: trykk ♥ på en oppskrift.',
      fewerIngredients: 'Færre ingredienser / kortere handleliste',
      fewerIngredientsHint: 'Retter som deler ingredienser, og en rett to ganger heller enn en ny',
      uniqueIngredients_one: 'Denne uken trenger {{count}} ulik ingrediens.',
      uniqueIngredients_other: 'Denne uken trenger {{count}} ulike ingredienser.',
      goalNoteMany: 'Alle oppskriftene har disse merkene: {{labels}}.',
      notice: {
        goalRelaxed: 'For få oppskrifter passer alle målene dine samtidig, så «{{goals}}» ble utelatt. Uken følger: {{kept}}.',
        breakfastRelaxed: 'Bare noen få {{kind}} frokoster passer valgene dine, så noen andre er blandet inn.',
        favouritesUsed_one: '{{count}} av favorittene dine er med denne uken.',
        favouritesUsed_other: '{{count}} av favorittene dine er med denne uken.',
        noFavourites: 'Ingen av favorittene dine passer valgene denne uken.',
        saltStandard: 'Saltnivå: Standard. Salte retter bruker standard saltmengde (rundt 700 mg natrium per hovedmåltid). Helsemerkene gjelder versjonen med lite salt.',
        saltLow: 'Saltnivå: Lite salt. Oppskriftene brukes nøyaktig slik de er skrevet.',
        saltLowAuto: 'Saltnivå: Lite salt, på grunn av helsemålet ditt. Oppskriftene brukes nøyaktig slik de er skrevet.',
      },
    },
  },
  sv: {
    salt: {
      title: 'Saltnivå',
      standard: 'Standard (friska vuxna, WHO: under 5 g salt/dag)',
      low: 'Lite salt (blodtryck, hjärt- eller njursjukdom)',
      desc: 'Salta rätter har en standardmängd salt för friska vuxna. Lite salt använder varje recept precis som det är skrivet. Hälsomärkningarna gäller alltid versionen med lite salt.',
      tip: 'Tillsätt saltet på slutet eller vid bordet: du känner mer smak med mindre salt. Citron, vitlök, örter, tomatpuré, miso och näringsjäst ger mer smak.',
      lowHint: 'Lite salt: {{amount}}',
      toTaste: 'efter smak',
      sodiumLine: 'Standardsalt: {{standard}} mg natrium per portion (lite salt: {{low}} mg).',
      labelNote: 'Märkningen ”{{label}}” gäller versionen med lite salt.',
    },
    dislike: {
      add: 'Inte för mig',
      remove: 'Markerat ”inte för mig”. Tryck för att ångra',
      hint: 'Gör min vecka väljer inte det här receptet.',
    },
    makeMyWeek: {
      q: { prefs: 'Några önskemål', breakfast: 'Frukost: salt, söt eller båda?', salt: 'Saltnivå' },
      goalsHint: 'Välj ett eller flera.',
      breakfasts: { both: 'Båda', savoury: 'Salt', sweet: 'Söt' },
      breakfastKinds: { savoury: 'salta', sweet: 'söta' },
      breakfastHint: 'Pålägget följer samma val.',
      saltAuto: 'Lite salt, på grund av hälsomålet du valde.',
      preferFavourites: 'Föredra mina favoriter',
      preferFavouritesHint_one: '{{count}} favorit',
      preferFavouritesHint_other: '{{count}} favoriter',
      noFavouritesYet: 'Inga favoriter än: tryck ♥ på ett recept.',
      fewerIngredients: 'Färre ingredienser / kortare inköpslista',
      fewerIngredientsHint: 'Rätter som delar ingredienser, och en rätt två gånger hellre än en ny',
      uniqueIngredients_one: 'Den här veckan behöver {{count}} olik ingrediens.',
      uniqueIngredients_other: 'Den här veckan behöver {{count}} olika ingredienser.',
      goalNoteMany: 'Alla recept har de här märkningarna: {{labels}}.',
      notice: {
        goalRelaxed: 'För få recept passar alla dina mål samtidigt, så ”{{goals}}” lämnades ute. Veckan följer: {{kept}}.',
        breakfastRelaxed: 'Bara några få {{kind}} frukostar passar dina val, så några andra är inblandade.',
        favouritesUsed_one: '{{count}} av dina favoriter är med den här veckan.',
        favouritesUsed_other: '{{count}} av dina favoriter är med den här veckan.',
        noFavourites: 'Ingen av dina favoriter passar veckans val.',
        saltStandard: 'Saltnivå: Standard. Salta rätter använder sin standardmängd salt (runt 700 mg natrium per huvudmåltid). Hälsomärkningarna gäller versionen med lite salt.',
        saltLow: 'Saltnivå: Lite salt. Recepten används precis som de är skrivna.',
        saltLowAuto: 'Saltnivå: Lite salt, på grund av ditt hälsomål. Recepten används precis som de är skrivna.',
      },
    },
  },
}

// Deep merge: objects merge, strings replace.
function merge(into, from) {
  for (const [k, v] of Object.entries(from)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) merge(into[k] = into[k] || {}, v)
    else into[k] = v
  }
}

for (const [lang, s] of Object.entries(S)) {
  const f = `src/i18n/locales/${lang}.json`
  const raw = fs.readFileSync(f, 'utf8')
  const j = JSON.parse(raw)
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const back = JSON.stringify(j, null, 2).replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : '')
  if (back !== raw) throw new Error(`${f} does not round-trip; edit by hand`)
  merge(j, s)
  fs.writeFileSync(f, JSON.stringify(j, null, 2).replace(/\n/g, eol) + (raw.endsWith(eol) ? eol : ''))
  console.log('updated', f)
}

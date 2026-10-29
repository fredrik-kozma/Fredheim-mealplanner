// One-off: en/no/sv strings for Make my week's calorie target, the "3 meals
// + snack" option and the kcal estimates in the preview. Merges into the
// locale files; re-running is harmless.
const fs = require('fs')
const S = {
  en: {
    makeMyWeek: {
      q: { kcal: 'About how many calories a day?' },
      meals: { '3s': 'Breakfast, lunch, dinner and a snack' },
      snackHint: 'A snack from the recipes marked as snacks, or a piece of fruit',
      kcalHint: 'Per person. Portions are sized so each day lands near it.',
      kcalHintDinner: 'Per person, for the whole day: dinner is planned at about 40% of it.',
      kcalNone: 'No target',
      kcalNoneHint: 'The usual amounts for the goal you chose',
      kcalValue: '{{kcal}} kcal',
      kcalCustom: 'Or type your own',
      kcalPerDay: 'kcal a day',
      kcalRange: 'Enter a number from {{min}} to {{max}}.',
      kcalGuidance: 'Below 1,200 kcal a day is best done with guidance from a health professional.',
      dayStats: '≈ {{kcal}} kcal · {{fibre}} g fibre',
      mealKcal: '≈ {{kcal}} kcal',
      estimateNote: 'kcal are estimates per person, from the recipes’ nutrition: a suggestion, not a prescription.',
      statsDayTarget: 'About {{kcal}} kcal and {{fibre}} g fibre per person a day (your target: {{target}} kcal).',
      statsDinnerTarget: 'About {{kcal}} kcal and {{fibre}} g fibre per person per dinner (aiming for {{target}} kcal).',
      notice: {
        portionsFitted: 'Portions are sized (½ to 2 each) so each day lands near your target of about {{target}} kcal. The shopping list buys for that, and the week still scales with the number of people.',
        portionsFittedDinner: 'Portions are sized (½ to 2 each) so each dinner lands near about {{target}} kcal. The shopping list buys for that, and the week still scales with the number of people.',
        kcalOffTarget_one: 'On 1 day the dishes that fit your choices don’t quite reach within 10% of your target. Adjust a portion in the planner if you like.',
        kcalOffTarget_other: 'On {{count}} days the dishes that fit your choices don’t quite reach within 10% of your target. Adjust a portion in the planner if you like.',
        snackFruit: 'On days without a snack recipe that fits, the snack is a piece of fruit (see the day’s note).',
      },
    },
  },
  no: {
    makeMyWeek: {
      q: { kcal: 'Omtrent hvor mange kalorier om dagen?' },
      meals: { '3s': 'Frokost, lunsj, middag og et mellommåltid' },
      snackHint: 'Et mellommåltid fra oppskriftene merket som det, eller en frukt',
      kcalHint: 'Per person. Porsjonene tilpasses så hver dag havner nær målet.',
      kcalHintDinner: 'Per person, for hele dagen: middagen planlegges til omtrent 40 % av det.',
      kcalNone: 'Ingen mål',
      kcalNoneHint: 'De vanlige mengdene for målet du valgte',
      kcalValue: '{{kcal}} kcal',
      kcalCustom: 'Eller skriv inn ditt eget',
      kcalPerDay: 'kcal om dagen',
      kcalRange: 'Skriv et tall fra {{min}} til {{max}}.',
      kcalGuidance: 'Under 1200 kcal om dagen bør helst skje med veiledning fra helsepersonell.',
      dayStats: '≈ {{kcal}} kcal · {{fibre}} g fiber',
      mealKcal: '≈ {{kcal}} kcal',
      estimateNote: 'kcal er anslag per person, ut fra oppskriftenes næringsinnhold: et forslag, ikke en forskrift.',
      statsDayTarget: 'Omtrent {{kcal}} kcal og {{fibre}} g fiber per person om dagen (ditt mål: {{target}} kcal).',
      statsDinnerTarget: 'Omtrent {{kcal}} kcal og {{fibre}} g fiber per person per middag (vi sikter mot {{target}} kcal).',
      notice: {
        portionsFitted: 'Porsjonene er tilpasset (½ til 2 hver) så hver dag havner nær målet ditt på omtrent {{target}} kcal. Handlelisten kjøper inn til det, og uken skaleres fortsatt med antall personer.',
        portionsFittedDinner: 'Porsjonene er tilpasset (½ til 2 hver) så hver middag havner nær omtrent {{target}} kcal. Handlelisten kjøper inn til det, og uken skaleres fortsatt med antall personer.',
        kcalOffTarget_one: 'På 1 dag når ikke rettene som passer valgene dine helt innenfor 10 % av målet. Juster gjerne en porsjon i planleggeren.',
        kcalOffTarget_other: 'På {{count}} dager når ikke rettene som passer valgene dine helt innenfor 10 % av målet. Juster gjerne en porsjon i planleggeren.',
        snackFruit: 'De dagene ingen mellommåltid-oppskrift passer, er mellommåltidet en frukt (se dagens notat).',
      },
    },
  },
  sv: {
    makeMyWeek: {
      q: { kcal: 'Ungefär hur många kalorier om dagen?' },
      meals: { '3s': 'Frukost, lunch, middag och ett mellanmål' },
      snackHint: 'Ett mellanmål från recepten märkta som det, eller en frukt',
      kcalHint: 'Per person. Portionerna anpassas så att varje dag hamnar nära målet.',
      kcalHintDinner: 'Per person, för hela dagen: middagen planeras till ungefär 40 % av det.',
      kcalNone: 'Inget mål',
      kcalNoneHint: 'De vanliga mängderna för målet du valde',
      kcalValue: '{{kcal}} kcal',
      kcalCustom: 'Eller skriv in ditt eget',
      kcalPerDay: 'kcal om dagen',
      kcalRange: 'Skriv ett tal från {{min}} till {{max}}.',
      kcalGuidance: 'Under 1200 kcal om dagen görs helst med vägledning från vårdpersonal.',
      dayStats: '≈ {{kcal}} kcal · {{fibre}} g fiber',
      mealKcal: '≈ {{kcal}} kcal',
      estimateNote: 'kcal är uppskattningar per person, utifrån receptens näringsinnehåll: ett förslag, inte en ordination.',
      statsDayTarget: 'Ungefär {{kcal}} kcal och {{fibre}} g fiber per person och dag (ditt mål: {{target}} kcal).',
      statsDinnerTarget: 'Ungefär {{kcal}} kcal och {{fibre}} g fiber per person och middag (vi siktar på {{target}} kcal).',
      notice: {
        portionsFitted: 'Portionerna är anpassade (½ till 2 var) så att varje dag hamnar nära ditt mål på ungefär {{target}} kcal. Inköpslistan handlar för det, och veckan skalas fortfarande med antalet personer.',
        portionsFittedDinner: 'Portionerna är anpassade (½ till 2 var) så att varje middag hamnar nära ungefär {{target}} kcal. Inköpslistan handlar för det, och veckan skalas fortfarande med antalet personer.',
        kcalOffTarget_one: 'På 1 dag når rätterna som passar dina val inte riktigt inom 10 % av målet. Justera gärna en portion i planeraren.',
        kcalOffTarget_other: 'På {{count}} dagar når rätterna som passar dina val inte riktigt inom 10 % av målet. Justera gärna en portion i planeraren.',
        snackFruit: 'De dagar inget mellanmålsrecept passar är mellanmålet en frukt (se dagens anteckning).',
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

// Public legal pages. English is the default so the stable Play Console
// URLs render in English. Norwegian and Swedish are the same facts.

export const LEGAL_LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'no', label: 'Norsk', short: 'NO' },
  { code: 'sv', label: 'Svenska', short: 'SV' },
]

export const SELLER = {
  name: 'KOZMA VIVERA HEALTH / Vivera Health',
  address: 'Bergmannsveien 600, 3614 Kongsberg, Norway',
  email: 'viverahealth@gmail.com',
  app: 'Fredheim Meal Planner',
  site: 'https://fredheim-meal.netlify.app',
  privacyUrl: 'https://fredheim-meal.netlify.app/privacy',
  deleteUrl: 'https://fredheim-meal.netlify.app/delete-account',
}

const LANG_CODES = LEGAL_LANGS.map(l => l.code)

export function initialLegalLang(search, stateLang) {
  const query = new URLSearchParams(search || '').get('lang')
  if (LANG_CODES.includes(query)) return query
  const fromState = typeof stateLang === 'string' ? stateLang.slice(0, 2) : ''
  if (LANG_CODES.includes(fromState)) return fromState
  return 'en'
}

export function legalText(pack, lang) {
  return pack[lang] || pack.en
}

export const privacyCopy = {
  en: {
    title: 'Privacy policy',
    updated: 'Last updated 9 November 2026',
    intro: 'This policy describes what Fredheim Meal Planner does with personal data. Fredheim Meal Planner is a plant-based meal planner: recipes, a weekly plan, a shopping list, and general nutrition figures for the meals you plan.',
    sections: [
      {
        title: 'Who we are',
        paragraphs: [
          'The app is published by KOZMA VIVERA HEALTH / Vivera Health, Bergmannsveien 600, 3614 Kongsberg, Norway. The public site is https://fredheim-meal.netlify.app.',
          'Vivera Health is responsible for the account data described here. For privacy requests, including access or deletion, email viverahealth@gmail.com.',
        ],
      },
      {
        title: 'Account and subscription data',
        paragraphs: [
          'The Android app can be used without creating an account. We collect an email address only if you choose to sign in to sync with the website. If you do, we store that email address and the login record. The password is stored only as a hash by the authentication service. For an account we also store subscription status (for example trial, active, past due, or canceled), when a trial ends, a billing customer id, and whether the subscription was last updated from Stripe or from Google Play.',
          'That account record is stored in Supabase. We do not store your card number.',
          'Subscription billing is handled by Stripe on the website. On Android, Google Play subscriptions are processed by Google Play and RevenueCat under a random anonymous app user ID. RevenueCat keeps purchase history and subscription status for that ID. It is linked to the Supabase account only when you sign in. Stripe and Google receive payment details under their own terms.',
        ],
      },
      {
        title: 'Meal plans and preferences',
        paragraphs: [
          'Meal plans, recipes you add, shopping lists, favourites, and preferences such as language, family size, blocked ingredients, and salt level are stored on the device. Plans and those preferences are kept in IndexedDB. A few interface choices are kept in local storage.',
          'They are not uploaded to our servers in ordinary use. A backup file exists only if you export one yourself.',
        ],
      },
      {
        title: 'Analytics, cookies, and local storage',
        paragraphs: [
          'We do not use third-party analytics, advertising trackers, or analytics cookies.',
          'The app uses IndexedDB for meal plans, recipes, shopping lists, and preferences. It uses local storage for the language you chose and a few interface choices. It uses session storage for a short-lived copy of your subscription status, so the screen does not flicker while that status loads.',
        ],
      },
      {
        title: 'Health and nutrition',
        paragraphs: [
          'General guidance, not personal medical advice. Nutrition figures, filters, and meal suggestions are not a diagnosis, a prescription, or a diet prepared for you by a clinician. Questions about your own health belong with a qualified health professional.',
        ],
      },
      {
        title: 'Children',
        paragraphs: [
          'Fredheim Meal Planner is not directed at children under 13, and we do not knowingly create accounts for them. If you believe a child under 13 has given us personal data, email viverahealth@gmail.com and we will delete it.',
        ],
      },
      {
        title: 'How long we keep data',
        paragraphs: [
          'We keep the account and the subscription profile for as long as the account exists. When you delete the account, we delete the login and the profile from Supabase. That happens as soon as the deletion succeeds.',
          'Meal plans and preferences stay on the device until you uninstall the app, clear the app’s data, or remove the site data in the browser. If you created an account, deleting it on that device also removes them there. They are not copied into the account, so another phone keeps its own copy until you clear it there.',
          'Stripe and Google may keep billing records for as long as tax, accounting, and fraud-prevention rules require. In Norway, accounting records are generally kept for 5 years. Those are payment records, not your meal plans. We do not keep a copy of your card number.',
        ],
      },
      {
        title: 'Deletion and other requests',
        paragraphs: [
          'You can ask for access, correction, or deletion by emailing viverahealth@gmail.com. If you are in the EEA you can also complain to Datatilsynet, the Norwegian Data Protection Authority.',
          'You can delete the account yourself, while signed in, at https://fredheim-meal.netlify.app/delete-account or from Settings in the app. That deletes the Supabase login and profile. On the device where you confirm it, local meal plans and preferences are removed as well.',
          'Deleting the account does not by itself cancel a Google Play subscription. Cancel that in Google Play, or the store may keep charging you. Subscription billing is handled by Stripe or Google Play. When deletion succeeds we also cancel a Stripe subscription if there is one. If that cancellation does not go through, cancel it from the Stripe receipt or email us, so you are not billed after the account is gone.',
        ],
      },
      {
        title: 'Changes',
        paragraphs: [
          'We may update this policy. The date at the top changes when we do.',
        ],
      },
    ],
  },
  no: {
    title: 'Personvernerklæring',
    updated: 'Sist oppdatert 9. november 2026',
    intro: 'Denne erklæringen beskriver hva Fredheim Meal Planner gjør med personopplysninger. Fredheim Meal Planner er en plantebasert måltidsplanlegger: oppskrifter, en ukeplan, en handleliste og generelle næringstall for måltidene du planlegger.',
    sections: [
      {
        title: 'Hvem vi er',
        paragraphs: [
          'Appen utgis av KOZMA VIVERA HEALTH / Vivera Health, Bergmannsveien 600, 3614 Kongsberg, Norge. Det offentlige nettstedet er https://fredheim-meal.netlify.app.',
          'Vivera Health er ansvarlig for kontoopplysningene som er beskrevet her. For forespørsler om personvern, inkludert innsyn eller sletting, send e-post til viverahealth@gmail.com.',
        ],
      },
      {
        title: 'Konto og abonnement',
        paragraphs: [
          'Android-appen kan brukes uten å opprette en konto. Vi samler inn en e-postadresse bare hvis du velger å logge inn for å synkronisere med nettstedet. Gjør du det, lagrer vi den e-postadressen og innloggingsoppføringen. Passordet lagres bare som en hash hos innloggingstjenesten. For en konto lagrer vi også abonnementsstatus (for eksempel prøveperiode, aktiv, forfalt eller avsluttet), når en prøveperiode slutter, en kunde-id for betaling, og om abonnementet sist ble oppdatert fra Stripe eller fra Google Play.',
          'Den kontooppføringen lagres i Supabase. Vi lagrer ikke kortnummeret ditt.',
          'Abonnementsbetaling på nettstedet håndteres av Stripe. På Android behandles Google Play-abonnementer av Google Play og RevenueCat under en tilfeldig anonym appbruker-ID. RevenueCat oppbevarer kjøpshistorikk og abonnementsstatus for den ID-en. Den knyttes til Supabase-kontoen bare når du logger inn. Stripe og Google mottar betalingsopplysninger etter sine egne vilkår.',
        ],
      },
      {
        title: 'Måltidsplaner og preferanser',
        paragraphs: [
          'Måltidsplaner, oppskrifter du legger til, handlelister, favoritter og preferanser som språk, familiestørrelse, blokkerte ingredienser og saltnivå lagres på enheten. Planer og disse preferansene ligger i IndexedDB. Noen få valg i grensesnittet ligger i lokal lagring.',
          'De lastes ikke opp til serverne våre ved vanlig bruk. En sikkerhetskopi finnes bare hvis du selv eksporterer en.',
        ],
      },
      {
        title: 'Analyse, informasjonskapsler og lokal lagring',
        paragraphs: [
          'Vi bruker ikke tredjepartsanalyse, annonsesporing eller analyseinformasjonskapsler.',
          'Appen bruker IndexedDB til måltidsplaner, oppskrifter, handlelister og preferanser. Den bruker lokal lagring til språket du valgte og noen få valg i grensesnittet. Den bruker øktlagring til en kortvarig kopi av abonnementsstatusen, så skjermen ikke blinker mens statusen lastes.',
        ],
      },
      {
        title: 'Helse og ernæring',
        paragraphs: [
          'Næringstall, filtre og måltidsforslag er generell veiledning, ikke personlig medisinsk råd. De er ikke en diagnose, en resept eller en kostplan laget for deg av en kliniker. Spørsmål om din egen helse hører hjemme hos kvalifisert helsepersonell.',
        ],
      },
      {
        title: 'Barn',
        paragraphs: [
          'Fredheim Meal Planner er ikke rettet mot barn under 13 år, og vi oppretter ikke kontoer for dem med vitende og vilje. Hvis du mener at et barn under 13 år har gitt oss personopplysninger, send e-post til viverahealth@gmail.com, så sletter vi dem.',
        ],
      },
      {
        title: 'Hvor lenge vi beholder opplysninger',
        paragraphs: [
          'Vi beholder kontoen og abonnementsprofilen så lenge kontoen finnes. Når du sletter kontoen, sletter vi innloggingen og profilen fra Supabase. Det skjer så snart slettingen er gjennomført.',
          'Måltidsplaner og preferanser blir liggende på enheten til du avinstallerer appen, tømmer appens data eller fjerner nettstedets data i nettleseren. Har du opprettet en konto, fjerner sletting av kontoen på den enheten dem der også. De kopieres ikke inn i kontoen, så en annen telefon beholder sin egen kopi til du tømmer den der.',
          'Stripe og Google kan beholde betalingsoppføringer så lenge regler om skatt, regnskap og svindelforebygging krever det. I Norge oppbevares regnskapsmateriale som hovedregel i 5 år. Det er betalingsoppføringer, ikke måltidsplanene dine. Vi beholder ikke en kopi av kortnummeret ditt.',
        ],
      },
      {
        title: 'Sletting og andre forespørsler',
        paragraphs: [
          'Du kan be om innsyn, retting eller sletting ved å sende e-post til viverahealth@gmail.com. Er du i EØS, kan du også klage til Datatilsynet.',
          'Du kan slette kontoen selv mens du er innlogget, på https://fredheim-meal.netlify.app/delete-account eller fra Innstillinger i appen. Det sletter innloggingen og profilen i Supabase. På enheten der du bekrefter, fjernes også lokale måltidsplaner og preferanser.',
          'Å slette kontoen avslutter ikke i seg selv et Google Play-abonnement. Avslutt det i Google Play, ellers kan butikken fortsette å belaste deg. Abonnementsbetaling håndteres av Stripe eller Google Play. Når slettingen lykkes, avslutter vi også et Stripe-abonnement hvis det finnes et. Hvis den avslutningen ikke går gjennom, avslutt det fra Stripe-kvitteringen eller send oss e-post, så du ikke blir belastet etter at kontoen er borte.',
        ],
      },
      {
        title: 'Endringer',
        paragraphs: [
          'Vi kan oppdatere denne erklæringen. Datoen øverst endres når vi gjør det.',
        ],
      },
    ],
  },
  sv: {
    title: 'Integritetspolicy',
    updated: 'Senast uppdaterad 9 november 2026',
    intro: 'Den här policyn beskriver vad Fredheim Meal Planner gör med personuppgifter. Fredheim Meal Planner är en växtbaserad måltidsplanerare: recept, en veckoplan, en inköpslista och allmänna näringsvärden för måltiderna du planerar.',
    sections: [
      {
        title: 'Vilka vi är',
        paragraphs: [
          'Appen ges ut av KOZMA VIVERA HEALTH / Vivera Health, Bergmannsveien 600, 3614 Kongsberg, Norge. Den offentliga webbplatsen är https://fredheim-meal.netlify.app.',
          'Vivera Health ansvarar för kontouppgifterna som beskrivs här. För integritetsförfrågningar, inklusive tillgång eller radering, mejla viverahealth@gmail.com.',
        ],
      },
      {
        title: 'Konto och abonnemang',
        paragraphs: [
          'Android-appen kan användas utan att skapa ett konto. Vi samlar in en e-postadress bara om du väljer att logga in för att synka med webbplatsen. Gör du det lagrar vi den e-postadressen och inloggningsposten. Lösenordet lagras bara som ett hashvärde hos inloggningstjänsten. För ett konto lagrar vi också abonnemangsstatus (till exempel provperiod, aktiv, förfallen eller avslutad), när en provperiod slutar, ett kund-id för betalning och om abonnemanget senast uppdaterades från Stripe eller från Google Play.',
          'Den kontoposten lagras i Supabase. Vi lagrar inte ditt kortnummer.',
          'Abonnemangsbetalning på webbplatsen hanteras av Stripe. På Android behandlas Google Play-abonnemang av Google Play och RevenueCat under ett slumpmässigt anonymt appanvändar-ID. RevenueCat sparar köphistorik och abonnemangsstatus för det ID:t. Det kopplas till Supabase-kontot bara när du loggar in. Stripe och Google tar emot betalningsuppgifter enligt sina egna villkor.',
        ],
      },
      {
        title: 'Måltidsplaner och inställningar',
        paragraphs: [
          'Måltidsplaner, recept du lägger till, inköpslistor, favoriter och inställningar som språk, familjestorlek, blockerade ingredienser och saltnivå lagras på enheten. Planer och de inställningarna finns i IndexedDB. Några få gränssnittsval finns i lokal lagring.',
          'De laddas inte upp till våra servrar vid vanlig användning. En säkerhetskopia finns bara om du själv exporterar en.',
        ],
      },
      {
        title: 'Analys, cookies och lokal lagring',
        paragraphs: [
          'Vi använder inte tredjepartsanalys, annonsspårning eller analyscookies.',
          'Appen använder IndexedDB för måltidsplaner, recept, inköpslistor och inställningar. Den använder lokal lagring för språket du valde och några få gränssnittsval. Den använder sessionslagring för en kortlivad kopia av abonnemangsstatusen, så att skärmen inte blinkar medan statusen laddas.',
        ],
      },
      {
        title: 'Hälsa och näring',
        paragraphs: [
          'Näringsvärden, filter och måltidsförslag är allmän vägledning, inte personlig medicinsk rådgivning. De är inte en diagnos, ett recept eller en kostplan gjord för dig av en kliniker. Frågor om din egen hälsa hör hemma hos kvalificerad vårdpersonal.',
        ],
      },
      {
        title: 'Barn',
        paragraphs: [
          'Fredheim Meal Planner riktar sig inte till barn under 13 år, och vi skapar inte konton för dem medvetet. Om du tror att ett barn under 13 år har lämnat personuppgifter till oss, mejla viverahealth@gmail.com så raderar vi dem.',
        ],
      },
      {
        title: 'Hur länge vi sparar uppgifter',
        paragraphs: [
          'Vi sparar kontot och abonnemangsprofilen så länge kontot finns. När du raderar kontot raderar vi inloggningen och profilen från Supabase. Det sker så snart raderingen har gått igenom.',
          'Måltidsplaner och inställningar stannar på enheten tills du avinstallerar appen, rensar appens data eller tar bort webbplatsens data i webbläsaren. Om du har skapat ett konto tar radering av kontot på den enheten också bort dem där. De kopieras inte in i kontot, så en annan telefon behåller sin egen kopia tills du rensar den där.',
          'Stripe och Google kan spara betalningsposter så länge regler om skatt, bokföring och bedrägeriskydd kräver det. I Norge sparas bokföring i regel i 5 år. Det är betalningsposter, inte dina måltidsplaner. Vi sparar ingen kopia av ditt kortnummer.',
        ],
      },
      {
        title: 'Radering och andra förfrågningar',
        paragraphs: [
          'Du kan be om tillgång, rättelse eller radering genom att mejla viverahealth@gmail.com. Om du är i EES kan du också klaga hos Datatilsynet, den norska dataskyddsmyndigheten.',
          'Du kan själv radera kontot när du är inloggad, på https://fredheim-meal.netlify.app/delete-account eller från Inställningar i appen. Det raderar inloggningen och profilen i Supabase. På enheten där du bekräftar tas också lokala måltidsplaner och inställningar bort.',
          'Att radera kontot avslutar inte i sig ett Google Play-abonnemang. Avsluta det i Google Play, annars kan butiken fortsätta att debitera dig. Abonnemangsbetalning hanteras av Stripe eller Google Play. När raderingen lyckas avslutar vi också ett Stripe-abonnemang om det finns ett. Om det avslutandet inte går igenom, avsluta det från Stripe-kvittot eller mejla oss, så att du inte debiteras efter att kontot är borta.',
        ],
      },
      {
        title: 'Ändringar',
        paragraphs: [
          'Vi kan uppdatera den här policyn. Datumet högst upp ändras när vi gör det.',
        ],
      },
    ],
  },
}

export const deletionCopy = {
  en: {
    title: 'Delete your account',
    updated: 'Fredheim Meal Planner',
    intro: 'This page is for people who created a Fredheim Meal Planner account. You can delete that account and the personal data stored with it. You do not need a current subscription, and you do not have to open the installed app.',
    noAccount: 'If you never created an account, there is nothing to delete here. Uninstall the app or clear its data to remove meal plans and other data stored on the device. Manage a Google Play subscription in Google Play.',
    stepsTitle: 'How to delete your account',
    steps: [
      'Open this page: https://fredheim-meal.netlify.app/delete-account. In the app, the same page is under Settings, and in the account menu.',
      'Sign in with the email address on the account.',
      'Read what is deleted, and what you must cancel yourself.',
      'Type DELETE and confirm. The account is deleted then. This cannot be undone.',
    ],
    deletedTitle: 'What we delete',
    deleted: [
      'Your email address and login in Supabase Auth.',
      'Your subscription profile in Supabase: status, trial, Stripe customer id, and Google Play billing fields.',
      'On this device: meal plans, recipes you added, shopping lists, and preferences kept in IndexedDB and local storage.',
    ],
    keptTitle: 'What can remain',
    kept: [
      'Billing records held by Stripe or Google, where tax, accounting, or fraud-prevention rules require them to keep payment records. We do not keep your card number.',
      'Meal plans on any other device. Plans are stored on the device, not in the account, so clear the app data there too if you want them gone.',
      'The built-in recipes. They are part of the app and are not your personal data.',
    ],
    billingTitle: 'Subscriptions',
    billing: 'Subscription billing is handled by Stripe (on the web) or by Google Play (on Android). Deleting the account does not cancel a Google Play subscription. Cancel it in the Play Store under Payments and subscriptions, or you may still be charged. We cancel a Stripe subscription when we can, as part of this deletion. If we cannot, cancel it from your Stripe receipt or email viverahealth@gmail.com.',
    emailFallback: 'If you cannot sign in, email viverahealth@gmail.com from the account address and ask us to delete it. We will delete the Supabase login and profile.',
    signedInAs: 'Signed in as',
    signIn: 'Sign in to delete this account',
    confirmLabel: 'Type DELETE to confirm',
    confirmHint: 'This permanently deletes the account.',
    button: 'Delete my account',
    working: 'Deleting…',
    sessionExpired: 'Your sign-in has expired. Sign in again, then confirm deletion.',
    genericError: 'Deletion did not finish. Nothing on the server was removed if you still see this account. Try again, or email viverahealth@gmail.com.',
    devBypass: 'This local preview is not a real account, so there is no Supabase user to delete.',
    successTitle: 'Your account has been deleted',
    successBody: 'The login and the subscription profile have been removed from Supabase.',
    successLocal: 'Meal plans and preferences on this device have been removed.',
    successLocalFail: 'We could not clear local data on this device. In the browser, clear site data for fredheim-meal.netlify.app. On a phone, clear the app’s storage.',
    successStripe: 'The Stripe subscription was cancelled.',
    successStripeFail: 'We could not cancel the Stripe subscription. Cancel it from your Stripe receipt, or email viverahealth@gmail.com, so you are not billed again.',
    successStripeNone: 'There was no active Stripe subscription on the account.',
    successPlay: 'If you subscribed through Google Play, cancel that subscription in the Play Store. Play billing is separate from the account and can continue after deletion.',
    privacyLink: 'Privacy policy',
    back: 'Back to the app',
  },
  no: {
    title: 'Slett kontoen din',
    updated: 'Fredheim Meal Planner',
    intro: 'Denne siden gjelder deg som har opprettet en Fredheim Meal Planner-konto. Du kan slette den kontoen og personopplysningene som er lagret med den. Du trenger ikke et aktivt abonnement, og du trenger ikke å åpne den installerte appen.',
    noAccount: 'Hvis du aldri har opprettet en konto, er det ingenting å slette her. Avinstaller appen eller tøm appdataene for å fjerne måltidsplaner og andre data som er lagret på enheten. Administrer et Google Play-abonnement i Google Play.',
    stepsTitle: 'Slik sletter du kontoen',
    steps: [
      'Åpne denne siden: https://fredheim-meal.netlify.app/delete-account. I appen ligger den samme siden under Innstillinger, og i kontomenyen.',
      'Logg inn med e-postadressen på kontoen.',
      'Les hva som slettes, og hva du må avslutte selv.',
      'Skriv DELETE og bekreft. Kontoen slettes da. Dette kan ikke angres.',
    ],
    deletedTitle: 'Det vi sletter',
    deleted: [
      'E-postadressen din og innloggingen i Supabase Auth.',
      'Abonnementsprofilen din i Supabase: status, prøveperiode, Stripe-kunde-id og feltene for Google Play-betaling.',
      'På denne enheten: måltidsplaner, oppskrifter du har lagt til, handlelister og preferanser som ligger i IndexedDB og lokal lagring.',
    ],
    keptTitle: 'Det som kan bli igjen',
    kept: [
      'Betalingsoppføringer hos Stripe eller Google, der regler om skatt, regnskap eller svindelforebygging krever at de beholder dem. Vi beholder ikke kortnummeret ditt.',
      'Måltidsplaner på en annen enhet. Planene lagres på enheten, ikke i kontoen, så tøm appdataene der også hvis du vil at de skal bort.',
      'De innebygde oppskriftene. De er en del av appen og er ikke personopplysningene dine.',
    ],
    billingTitle: 'Abonnement',
    billing: 'Abonnementsbetaling håndteres av Stripe (på nettet) eller av Google Play (på Android). Å slette kontoen avslutter ikke et Google Play-abonnement. Avslutt det i Play-butikken under Betalinger og abonnementer, ellers kan du fortsatt bli belastet. Vi avslutter et Stripe-abonnement når vi kan, som en del av denne slettingen. Hvis vi ikke kan, avslutt det fra Stripe-kvitteringen eller send e-post til viverahealth@gmail.com.',
    emailFallback: 'Hvis du ikke får logget inn, send e-post til viverahealth@gmail.com fra kontoadressen og be oss slette den. Vi sletter innloggingen og profilen i Supabase.',
    signedInAs: 'Innlogget som',
    signIn: 'Logg inn for å slette denne kontoen',
    confirmLabel: 'Skriv DELETE for å bekrefte',
    confirmHint: 'Dette sletter kontoen permanent.',
    button: 'Slett kontoen min',
    working: 'Sletter…',
    sessionExpired: 'Innloggingen har utløpt. Logg inn igjen, og bekreft deretter slettingen.',
    genericError: 'Slettingen ble ikke fullført. Ingenting på serveren ble fjernet hvis du fortsatt ser denne kontoen. Prøv igjen, eller send e-post til viverahealth@gmail.com.',
    devBypass: 'Denne lokale forhåndsvisningen er ikke en ekte konto, så det finnes ingen Supabase-bruker å slette.',
    successTitle: 'Kontoen din er slettet',
    successBody: 'Innloggingen og abonnementsprofilen er fjernet fra Supabase.',
    successLocal: 'Måltidsplaner og preferanser på denne enheten er fjernet.',
    successLocalFail: 'Vi fikk ikke tømt lokale data på denne enheten. I nettleseren, tøm nettsteddata for fredheim-meal.netlify.app. På en telefon, tøm appens lagring.',
    successStripe: 'Stripe-abonnementet ble avsluttet.',
    successStripeFail: 'Vi fikk ikke avsluttet Stripe-abonnementet. Avslutt det fra Stripe-kvitteringen, eller send e-post til viverahealth@gmail.com, så du ikke blir belastet igjen.',
    successStripeNone: 'Det fantes ikke et aktivt Stripe-abonnement på kontoen.',
    successPlay: 'Hvis du abonnerte via Google Play, avslutt det abonnementet i Play-butikken. Play-betaling er atskilt fra kontoen og kan fortsette etter sletting.',
    privacyLink: 'Personvernerklæring',
    back: 'Tilbake til appen',
  },
  sv: {
    title: 'Radera ditt konto',
    updated: 'Fredheim Meal Planner',
    intro: 'Den här sidan gäller dig som har skapat ett Fredheim Meal Planner-konto. Du kan radera det kontot och personuppgifterna som hör till det. Du behöver inget aktivt abonnemang, och du behöver inte öppna den installerade appen.',
    noAccount: 'Om du aldrig har skapat ett konto finns det inget att radera här. Avinstallera appen eller rensa dess data för att ta bort måltidsplaner och andra uppgifter som lagras på enheten. Hantera ett Google Play-abonnemang i Google Play.',
    stepsTitle: 'Så raderar du kontot',
    steps: [
      'Öppna den här sidan: https://fredheim-meal.netlify.app/delete-account. I appen finns samma sida under Inställningar, och i kontomenyn.',
      'Logga in med e-postadressen på kontot.',
      'Läs vad som raderas, och vad du måste avsluta själv.',
      'Skriv DELETE och bekräfta. Kontot raderas då. Det går inte att ångra.',
    ],
    deletedTitle: 'Det vi raderar',
    deleted: [
      'Din e-postadress och inloggning i Supabase Auth.',
      'Din abonnemangsprofil i Supabase: status, provperiod, Stripe-kund-id och fälten för Google Play-betalning.',
      'På den här enheten: måltidsplaner, recept du har lagt till, inköpslistor och inställningar som finns i IndexedDB och lokal lagring.',
    ],
    keptTitle: 'Det som kan bli kvar',
    kept: [
      'Betalningsposter hos Stripe eller Google, där regler om skatt, bokföring eller bedrägeriskydd kräver att de sparar dem. Vi sparar inte ditt kortnummer.',
      'Måltidsplaner på en annan enhet. Planerna lagras på enheten, inte i kontot, så rensa appdata där också om du vill att de ska bort.',
      'De inbyggda recepten. De är en del av appen och är inte dina personuppgifter.',
    ],
    billingTitle: 'Abonnemang',
    billing: 'Abonnemangsbetalning hanteras av Stripe (på webben) eller av Google Play (på Android). Att radera kontot avslutar inte ett Google Play-abonnemang. Avsluta det i Play Butik under Betalningar och abonnemang, annars kan du fortfarande debiteras. Vi avslutar ett Stripe-abonnemang när vi kan, som en del av den här raderingen. Om vi inte kan, avsluta det från Stripe-kvittot eller mejla viverahealth@gmail.com.',
    emailFallback: 'Om du inte kan logga in, mejla viverahealth@gmail.com från kontoadressen och be oss radera det. Vi raderar inloggningen och profilen i Supabase.',
    signedInAs: 'Inloggad som',
    signIn: 'Logga in för att radera det här kontot',
    confirmLabel: 'Skriv DELETE för att bekräfta',
    confirmHint: 'Det här raderar kontot permanent.',
    button: 'Radera mitt konto',
    working: 'Raderar…',
    sessionExpired: 'Inloggningen har gått ut. Logga in igen och bekräfta sedan raderingen.',
    genericError: 'Raderingen slutfördes inte. Inget på servern togs bort om du fortfarande ser det här kontot. Försök igen, eller mejla viverahealth@gmail.com.',
    devBypass: 'Den här lokala förhandsvisningen är inte ett riktigt konto, så det finns ingen Supabase-användare att radera.',
    successTitle: 'Ditt konto har raderats',
    successBody: 'Inloggningen och abonnemangsprofilen har tagits bort från Supabase.',
    successLocal: 'Måltidsplaner och inställningar på den här enheten har tagits bort.',
    successLocalFail: 'Vi kunde inte rensa lokala data på den här enheten. I webbläsaren, rensa webbplatsdata för fredheim-meal.netlify.app. På en telefon, rensa appens lagring.',
    successStripe: 'Stripe-abonnemanget avslutades.',
    successStripeFail: 'Vi kunde inte avsluta Stripe-abonnemanget. Avsluta det från Stripe-kvittot, eller mejla viverahealth@gmail.com, så att du inte debiteras igen.',
    successStripeNone: 'Det fanns inget aktivt Stripe-abonnemang på kontot.',
    successPlay: 'Om du prenumererade via Google Play, avsluta det abonnemanget i Play Butik. Play-betalning är skild från kontot och kan fortsätta efter radering.',
    privacyLink: 'Integritetspolicy',
    back: 'Tillbaka till appen',
  },
}

/**
 * "What's new" announcements shown in a small popup the first time the
 * user opens the app after the announcement was published. Each entry
 * is shown exactly once per user — once dismissed, the id is added to
 * the user's `seenNewsIds` store and never appears again.
 *
 * To ship a new announcement: append a new entry to this array. On the
 * user's next app load the WhatsNewModal will pick it up and show it.
 * For maintenance, the latest entry sits at the top of the list.
 *
 * Schema:
 *   {
 *     id:      string  — stable url-safe id; never re-use one
 *     icon:    string  — single emoji
 *     title:   { en, no, sv } strings
 *     body:    { en, no, sv } strings; one short paragraph
 *     ctaKey?: string  — optional i18n key for a CTA button below the
 *                        body (e.g. "Show me" that opens something).
 *                        If omitted, only the dismiss button is shown.
 *   }
 */

export const WHATS_NEW = [
  {
    id: 'fmd-plan-v1',
    icon: '🥑',
    title: {
      en: 'New: Fasting Mimicking Plan',
      no: 'Nytt: Faste-imiterende plan',
      sv: 'Nytt: Fastehärmande plan',
    },
    body: {
      en: 'A new 5-day Fasting Mimicking Plan is now built in — 16 plant-based, oil-free recipes with photos and full nutrition, based on the research of Valter Longo. It is designed to support metabolic health, cardiovascular and inflammatory conditions, and healthy ageing. Load the ready-made week from the Planner → “Load week” → Sample weeks.',
      no: 'En ny 5-dagers faste-imiterende plan er nå innebygd — 16 plantebaserte, oljefrie oppskrifter med bilder og fullt næringsinnhold, basert på forskningen til Valter Longo. Den er laget for å støtte metabolsk helse, hjerte- og betennelsestilstander og sunn aldring. Last inn den ferdige uken fra Ukeplan → «Last inn uke» → Ferdige uker.',
      sv: 'En ny 5-dagars fastehärmande plan är nu inbyggd — 16 växtbaserade, oljefria recept med bilder och fullständig näring, baserad på forskningen av Valter Longo. Den är gjord för att stödja metabol hälsa, hjärt- och inflammationstillstånd och hälsosamt åldrande. Ladda den färdiga veckan från Planering → ”Ladda vecka” → Färdiga veckor.',
    },
  },
  {
    id: 'favorites-v1',
    icon: '⭐',
    title: {
      en: 'New: Save recipes as favorites',
      no: 'Nytt: Lagre oppskrifter som favoritter',
      sv: 'Nytt: Spara recept som favoriter',
    },
    body: {
      en: 'Tap the star on any recipe to mark it as a favorite — both from the recipe list and inside a recipe. Filter the recipe list to just your favorites with the new star button next to search.',
      no: 'Trykk på stjernen på en oppskrift for å lagre den som favoritt — både fra oppskriftslisten og inne i selve oppskriften. Du kan filtrere listen til kun favorittene dine med den nye stjerneknappen ved siden av søkefeltet.',
      sv: 'Tryck på stjärnan på ett recept för att markera det som favorit — både från receptlistan och inne i ett recept. Filtrera listan till bara favoriterna med den nya stjärnknappen bredvid sökrutan.',
    },
  },
]

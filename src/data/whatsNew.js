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

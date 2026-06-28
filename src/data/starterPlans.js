/**
 * Starter meal plans — condition-focused sample weeks users can install
 * with one tap and then tweak.
 *
 * Each plan is a full 7-day week mapped slot-by-slot to recipe IDs.
 * The plan's recipe IDs must exist after the listed packs are installed
 * (we auto-install missing required packs at install time).
 *
 * To add a new starter plan or fill an empty one:
 *   1. Open the app and build the week in the Planner exactly the way
 *      you want users to receive it.
 *   2. Open Planner → Templates → "Download as starter plan JSON".
 *   3. Drop the downloaded file's `plan` object into the matching stub
 *      below and bump `version`.
 *
 * Schema:
 *   {
 *     id:               string  — stable URL-safe id
 *     name:             string  — English display name
 *     description:      string  — English short description (1-2 lines)
 *     condition:        string  — short tag (e.g. 'hypertension')
 *     author:           string
 *     version:          string  — semver; bump when content changes
 *     translations: {
 *       no: { name, description },
 *       sv: { name, description },
 *     }
 *     requiredPackIds:  string[] — pack ids that must be installed to
 *                                  render this plan's recipes
 *     plan: {
 *       <DayName>: {
 *         <MealSlot>: Array<{ recipeId: string, servings: number|null }>
 *       }
 *     }
 *   }
 */

import { FREDHEIM_RECIPES_WITH_PICTURES_PACK, FREDHEIM_REVERSAL_PROTOCOL_PACK, FREDHEIM_FMD_5DAY_PACK } from './installedPacks'

// Convenience reference to the canonical Fredheim recipes pack id — the
// vast majority of starter plans will pull recipes from it.
const FREDHEIM_PACK_ID = FREDHEIM_RECIPES_WITH_PICTURES_PACK.id
const REVERSAL_PACK_ID = FREDHEIM_REVERSAL_PROTOCOL_PACK.id
const FMD_PACK_ID = FREDHEIM_FMD_5DAY_PACK.id

// The FMD sample week maps Day 1–5 of the protocol onto Monday–Friday;
// Saturday/Sunday are intentionally left empty (the protocol is 5 days,
// with Day 6 being an unstructured refeeding day the user manages
// themselves). The daily broth is dropped into every day's Breakfast
// slot as the first item — it is "prepared each morning" and then sipped
// freely throughout the day, so breakfast is its natural anchor in the
// grid. `servings: null` means "use the recipe's own default servings".
const fmdDay = (n) => ({
  Breakfast: [
    { recipeId: 'fmd-broth', servings: null },
    { recipeId: `fmd-d${n}-breakfast`, servings: null },
  ],
  Lunch: [{ recipeId: `fmd-d${n}-lunch`, servings: null }],
  Dinner: [{ recipeId: `fmd-d${n}-dinner`, servings: null }],
})

export const STARTER_PLANS = [
  {
    id: 'hypertension-week-1',
    name: 'Hypertension — Sample Week',
    description: 'A low-sodium, potassium-rich, plant-based week designed to help bring blood pressure down naturally. Zero added oil, zero added sugar.',
    condition: 'hypertension',
    author: 'Fredheim Livsstilssenter',
    version: '0.1.0',
    translations: {
      no: {
        name: 'Høyt blodtrykk — Eksempeluke',
        description: 'En uke med natriumfattige, kaliumrike, plantebaserte måltider laget for å hjelpe blodtrykket ned naturlig. Uten tilsatt olje, uten tilsatt sukker.',
      },
      sv: {
        name: 'Högt blodtryck — Exempelvecka',
        description: 'En vecka med natriumfattiga, kaliumrika, växtbaserade måltider gjorda för att sänka blodtrycket naturligt. Utan tillsatt olja, utan tillsatt socker.',
      },
    },
    requiredPackIds: [FREDHEIM_PACK_ID, REVERSAL_PACK_ID],
    plan: {}, // ← drop in your authored week here
  },
  {
    id: 'diabetes-week-1',
    name: 'Type 2 Diabetes — Sample Week',
    description: 'Whole-food, plant-based meals built around legumes, whole grains, and non-starchy vegetables to support healthy blood sugar.',
    condition: 'diabetes',
    author: 'Fredheim Livsstilssenter',
    version: '0.1.0',
    translations: {
      no: {
        name: 'Diabetes type 2 — Eksempeluke',
        description: 'Helmat-basert, plantebasert kosthold bygget rundt belgfrukter, fullkorn og grønnsaker uten stivelse for å støtte sunt blodsukker.',
      },
      sv: {
        name: 'Typ 2-diabetes — Exempelvecka',
        description: 'Helmat-baserad, växtbaserad kost byggd kring baljväxter, fullkorn och stärkelsefria grönsaker för att stödja hälsosamt blodsocker.',
      },
    },
    requiredPackIds: [FREDHEIM_PACK_ID, REVERSAL_PACK_ID],
    plan: {}, // ← drop in your authored week here
  },
  {
    id: 'autoimmune-week-1',
    name: 'Autoimmune Support — Sample Week',
    description: 'Anti-inflammatory, gut-friendly meals emphasizing leafy greens, berries, omega-3 sources, and whole foods that calm immune over-activity.',
    condition: 'autoimmune',
    author: 'Fredheim Livsstilssenter',
    version: '0.1.0',
    translations: {
      no: {
        name: 'Autoimmun støtte — Eksempeluke',
        description: 'Betennelsesdempende, tarmvennlige måltider med vekt på bladgrønnsaker, bær, omega-3-kilder og helmat som roer immunoveraktivitet.',
      },
      sv: {
        name: 'Autoimmunt stöd — Exempelvecka',
        description: 'Antiinflammatoriska, tarmvänliga måltider med fokus på bladgrönsaker, bär, omega-3-källor och helmat som dämpar immunöveraktivitet.',
      },
    },
    requiredPackIds: [FREDHEIM_PACK_ID, REVERSAL_PACK_ID],
    plan: {}, // ← drop in your authored week here
  },
  {
    id: 'fmd-5day-week-1',
    name: 'Fasting Mimicking Plan — 5-Day Plan',
    description: 'The full 5-day FMD protocol (Longo) mapped to Monday–Friday: three small plant-based, oil-free meals a day plus a vegetable broth sipped freely throughout. ⚠ Not suitable in pregnancy, type 1/insulin-dependent diabetes, BMI under 18.5, eating-disorder history, or under-18s.',
    condition: 'fmd',
    author: 'Fredheim Livsstilssenter',
    version: '1.1.0',
    translations: {
      no: {
        name: 'Faste-imiterende plan — 5-dagers plan',
        description: 'Hele den 5-dagers FMD-protokollen (Longo) lagt på mandag–fredag: tre små plantebaserte, oljefrie måltider om dagen pluss en grønnsaksbuljong som drikkes fritt gjennom dagen. ⚠ Ikke egnet ved graviditet, diabetes type 1 / insulinavhengig diabetes, BMI under 18,5, historikk med spiseforstyrrelse, eller under 18 år.',
      },
      sv: {
        name: 'Fastehärmande plan — 5-dagarsplan',
        description: 'Hela den 5-dagars FMD-protokollen (Longo) lagd på måndag–fredag: tre små växtbaserade, oljefria måltider per dag plus en grönsaksbuljong som dricks fritt under dagen. ⚠ Inte lämplig vid graviditet, typ 1- / insulinberoende diabetes, BMI under 18,5, historik av ätstörning, eller under 18 år.',
      },
    },
    requiredPackIds: [FMD_PACK_ID],
    plan: {
      monday: fmdDay(1),
      tuesday: fmdDay(2),
      wednesday: fmdDay(3),
      thursday: fmdDay(4),
      friday: fmdDay(5),
    },
  },
]

/**
 * Returns true if the plan has actual recipe content (i.e. it has been
 * authored). Empty plans get an "Coming soon" treatment in the UI.
 */
export function planHasContent(plan) {
  if (!plan?.plan) return false
  for (const day of Object.values(plan.plan)) {
    for (const slot of Object.values(day || {})) {
      if (Array.isArray(slot) && slot.length > 0) return true
    }
  }
  return false
}

/**
 * Counts the total recipes referenced by a starter plan, for the
 * "X meals · 7 days" line on the card.
 */
export function countPlanMeals(plan) {
  if (!plan?.plan) return 0
  let n = 0
  for (const day of Object.values(plan.plan)) {
    for (const slot of Object.values(day || {})) {
      if (Array.isArray(slot)) n += slot.length
    }
  }
  return n
}

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
 *     portions:         number  — optional. Set this when the plan's items
 *                                 carry fixed serving counts (see `m`)
 *                                 rather than `null`, i.e. the amounts were
 *                                 authored for a specific household size.
 *                                 installStarterPlan resets familySize to
 *                                 it on load, so the people-count control
 *                                 scales from the true baseline instead of
 *                                 whatever size was left over from before.
 *     batchCook:        Array<{ id, kind: 'recipe', recipeId, servings }>
 *                                — optional. Recipes prepped once for the
 *                                  whole week rather than per-meal; shown in
 *                                  the planner's own Batch cooking card and
 *                                  bought once in the shopping list. Pair
 *                                  each day the batch is actually eaten with
 *                                  `mb(recipeId)` (not `m`) in `plan` below,
 *                                  which marks that slot's ingredients as
 *                                  already covered so they aren't bought
 *                                  again on top of the batch entry.
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

// Slot item helper. Servings are stated explicitly rather than left null
// (which would follow the household size), because the Easy Start week is
// portioned for one person — the amounts should not change with a setting.
const m = (recipeId, servings = 1) => ({ recipeId, servings })

// Same as `m`, but for a slot item whose ingredients are bought once via a
// `batchCook` entry instead of every time it's eaten. It still shows up in
// the day it's served (so the week reads correctly), but is marked so the
// shopping list doesn't count its ingredients again on top of the batch.
const mb = (recipeId, servings = 1) => ({ recipeId, servings, excludeFromShopping: true })

export const STARTER_PLANS = [
  {
    id: 'easy-start-week-1',
    name: 'Easy Start — Sample Week (1 person)',
    description: 'A gentle first week for one person: seven different breakfasts, a salad or soup for lunch, and a light soup or bowl every evening. Nothing takes over 50 minutes. Averages about 1650 kcal a day, with protein and fibre well covered. Vitamin B12 and vitamin D must be supplemented — that is true of any whole-food plant-based diet, not just this week.',
    condition: 'starter',
    author: 'Fredheim Livsstilssenter',
    version: '1.2.0',
    translations: {
      no: {
        name: 'Enkel start — Eksempeluke (1 person)',
        description: 'En rolig første uke for én person: sju forskjellige frokoster, salat eller suppe til lunsj, og en lett suppe eller bolle hver kveld. Ingenting tar over 50 minutter. Cirka 1650 kcal per dag, med protein og fiber godt dekket. Vitamin B12 og vitamin D må tas som tilskudd — det gjelder ethvert helmat-basert plantekosthold, ikke bare denne uken.',
        notes: {
          week: 'Retter hentet fra fastekuren er doblet til lunsj, men står med én porsjon om kvelden. En fastedagsporsjon er bevisst liten: midt på dagen blir det for lite, men om kvelden er det nettopp poenget — kveldsmaten her skal være lett, og de fleste kveldene avsluttes med en varm byggkaffelatte i stedet for en ny porsjon. Havre- og potetrundstykkene og hummusen ligger begge i Storkokking-kortet — bak rundstykkene og lag hummusen søndag eller mandag, én omgang av hver dekker resten av uken (rundstykkene fem ganger, hummusen tre; hummusen holder seg kjølt i fem dager). De teller ikke med i handlelisten hver dag, kun én gang der. Chiapuddingene og overnattshavren lages kvelden før, så morgenene går raskt. Ta tilskudd av vitamin B12 og vitamin D: ingen sammensetning av plantemat dekker dem. Kalsium ligger litt under målet denne uken — en skje tahini, ekstra grønt eller en beriket plantemelk tetter gapet.',
          days: {},
        },
      },
      sv: {
        name: 'Enkel start — Exempelvecka (1 person)',
        description: 'En lugn första vecka för en person: sju olika frukostar, sallad eller soppa till lunch, och en lätt soppa eller skål varje kväll. Inget tar över 50 minuter. Cirka 1650 kcal per dag, med protein och fiber väl täckta. Vitamin B12 och vitamin D måste tas som tillskott — det gäller all helmat-baserad växtbaserad kost, inte bara denna vecka.',
        notes: {
          week: 'Rätter hämtade från fastekuren är dubblade till lunch men står kvar på en portion till kvällen. En fastedagsportion är medvetet liten: mitt på dagen blir det för lite, men på kvällen är det själva poängen — kvällsmaten här ska vara lätt, och de flesta kvällar avslutas med en varm kornkaffelatte i stället för en portion till. Havre- och potatisfrallorna och hummusen ligger båda i Storkokning-kortet — baka frallorna och gör hummusen på söndag eller måndag, en omgång av vardera täcker resten av veckan (frallorna fem gånger, hummusen tre; hummusen håller sig kyld i fem dagar). De räknas inte in i inköpslistan varje dag, bara en gång där. Chiapuddingarna och overnight-havren görs kvällen innan, så morgnarna går snabbt. Ta tillskott av vitamin B12 och vitamin D: ingen sammansättning av växtbaserad mat täcker dem. Kalcium ligger något under målet denna vecka — en sked tahini, extra grönt eller en berikad växtmjölk täpper till luckan.',
          days: {},
        },
      },
    },
    // Smart tips travel with the week and land in the planner's tips card.
    notes: {
      week: 'Dishes borrowed from the fasting plan are doubled at lunch but kept to a single portion in the evening. A fasting-day serving is deliberately small: at midday that is too little, but in the evening it is exactly the point — suppers here are meant to be light, and most nights end with a warm barley latte rather than a second helping. The oat & potato bread rolls and the hummus both live in the Batch cooking card — bake the rolls and make the hummus on Sunday or Monday, and one batch of each covers the rest of the week (rolls five times, hummus three; the hummus keeps refrigerated for five days). They don’t count toward the shopping list each day, only once there. The chia puddings and overnight oats are all made the night before, so mornings stay quick. Supplement vitamin B12 and vitamin D: no arrangement of plant foods covers them. Calcium runs a little under target this week — a spoon of tahini, extra greens or a fortified plant milk closes the gap.',
      days: {},
    },
    requiredPackIds: [FREDHEIM_PACK_ID, REVERSAL_PACK_ID, FMD_PACK_ID],
    // Every item below carries a fixed serving count rather than `null`
    // (see the `m` helper), so this is the household size the numbers were
    // actually written for. installStarterPlan resets familySize to this on
    // load, so the "👥 people" control always starts from the true baseline
    // — otherwise its first tap scales against whatever household size was
    // left over from before, not against what these portions assume.
    portions: 1,
    // Baked/made once, Monday, as a batch. The rolls: one full recipe (8
    // rolls) covers all seven eaten across the week (1+2+2+1+1) with one
    // spare. The hummus: one full recipe (6 servings) covers all three
    // lunches (3 needed) with 3 to spare — its own steps say it keeps
    // refrigerated for 5 days, which is exactly this week's use case. Each
    // day below still shows the item being eaten (via `mb`), but its
    // ingredients are bought once here rather than repeatedly.
    batchCook: [
      { id: 'easy-start-week-1-rolls', kind: 'recipe', recipeId: 'orn-17', servings: 8 },
      { id: 'easy-start-week-1-hummus', kind: 'recipe', recipeId: 'roasted-red-pepper-hummus', servings: 6 },
    ],
    plan: {
      monday: {
        Breakfast: [m('ginger-pear-overnight-oats')],
        Lunch: [m('orn-14'), mb('orn-17'), mb('roasted-red-pepper-hummus')],
        Dinner: [m('fmd-d1-dinner'), m('orn-15')],
      },
      tuesday: {
        Breakfast: [m('orn-13')],
        Lunch: [m('orn-11'), mb('orn-17', 2), mb('roasted-red-pepper-hummus')],
        Dinner: [m('fmd-d2-dinner'), m('orn-15')],
      },
      wednesday: {
        Breakfast: [m('orn-18')],
        Lunch: [m('fmd-d1-lunch', 2)],
        Dinner: [m('fmd-d5-lunch'), m('orn-21'), m('orn-15')],
      },
      thursday: {
        Breakfast: [m('orn-26')],
        Lunch: [m('orn-16'), mb('roasted-red-pepper-hummus'), mb('orn-17', 2)],
        Dinner: [m('fmd-d4-lunch'), m('orn-7')],
      },
      friday: {
        Breakfast: [m('orn-10')],
        Lunch: [m('fmd-d3-lunch', 2), mb('orn-17')],
        Dinner: [m('orn-20'), m('orn-19')],
      },
      saturday: {
        Breakfast: [m('orn-1'), m('carob-spread-almond')],
        Lunch: [m('fmd-d5-dinner', 2), mb('orn-17')],
        Dinner: [m('fmd-d3-dinner'), m('orn-15')],
      },
      sunday: {
        Breakfast: [m('orn-9')],
        Lunch: [m('fmd-d2-lunch', 2), m('orn-16')],
        Dinner: [m('fmd-d4-dinner'), m('orn-15')],
      },
    },
  },
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
    description: "Every recipe this week carries Fredheim's diabetes-friendly tag — low saturated fat, no added sugar, no refined flour, fibre-forward. Drawn from all three packs: the core Fredheim collection, the reversal-protocol recipes, and a few light dishes borrowed from the fasting plan.",
    condition: 'diabetes',
    author: 'Fredheim Livsstilssenter',
    version: '1.0.0',
    translations: {
      no: {
        name: 'Diabetes type 2 — Eksempeluke',
        description: 'Hver oppskrift denne uken har Fredheims diabetesvennlige merking — lite mettet fett, uten tilsatt sukker, uten raffinert mel, rik på fiber. Hentet fra alle tre oppskriftspakkene: Fredheim-samlingen, reverseringsprotokollen og noen lette retter fra fasteplanen.',
        notes: {
          week: 'Havre- og potetrundstykkene ligger i Storkokking-kortet — bak hele oppskriften mandag, den dekker alle fire gangene de dukker opp denne uken, med noen til overs å fryse ned. De teller ikke med i handlelisten hver dag, kun én gang der. Porsjonert for én; 👥-kontrollen skalerer hele uken. Fullstendige næringsverdier vises bare for oppskriftene som har dem ennå — noen av de klassiske Fredheim-rettene (lasagnen, burgerne, middelhavssuppa) er ikke ferdig analysert ennå og mangler tall inntil videre.',
          days: {},
        },
      },
      sv: {
        name: 'Typ 2-diabetes — Exempelvecka',
        description: 'Varje recept denna vecka bär Fredheims diabetesvänliga märkning — lite mättat fett, utan tillsatt socker, utan raffinerat mjöl, fiberrikt. Hämtat från alla tre receptpaketen: Fredheim-samlingen, reverseringsprotokollet och några lätta rätter från fasteplanen.',
        notes: {
          week: 'Havre- och potatisfrallorna ligger i Storkokning-kortet — baka hela receptet på måndag, det täcker alla fyra gångerna de dyker upp denna vecka, med några över att frysa in. De räknas inte in i inköpslistan varje dag, bara en gång där. Portionerat för en; 👥-kontrollen skalar hela veckan. Fullständiga näringsvärden visas bara för recepten som har dem än — några av de klassiska Fredheim-rätterna (lasagnen, burgarna, medelhavssoppan) är inte färdiganalyserade än och saknar siffror tills vidare.',
          days: {},
        },
      },
    },
    requiredPackIds: [FREDHEIM_PACK_ID, REVERSAL_PACK_ID, FMD_PACK_ID],
    // As with Easy Start: every item below carries a fixed serving count, so
    // this is the household size they were written for (see the schema note
    // on `portions` above `easy-start-week-1`).
    portions: 1,
    // Smart tips travel with the week and land in the planner's tips card.
    notes: {
      week: "The oat & potato bread rolls live in the Batch cooking card — bake the full recipe on Monday and it covers all four times they appear this week, with a couple spare to freeze. They don't count toward the shopping list each day, only once there. Portioned for one; the 👥 control scales the whole week. Full nutrition figures are shown only for the recipes that carry them yet — a few of the classic Fredheim dishes (the lasagne, the burgers, the mediterranean soup) haven't been analysed yet and show no numbers until they are.",
      days: {},
    },
    // Baked once, Monday, as a batch — one full recipe (8 rolls) covers all
    // four appearances across the week with extras to spare. Each day below
    // still shows the roll being eaten (via `mb`), but its ingredients are
    // bought once here rather than four separate times.
    batchCook: [
      { id: 'diabetes-week-1-rolls', kind: 'recipe', recipeId: 'orn-17', servings: 8 },
    ],
    plan: {
      monday: {
        Breakfast: [m('orn-1')],
        Lunch: [m('orn-14'), mb('orn-17')],
        Dinner: [m('fr-23'), m('steamed-small-potatoes')],
      },
      tuesday: {
        Breakfast: [m('orn-10')],
        Lunch: [m('mediterranean-soup')],
        Dinner: [m('fmd-d2-dinner'), mb('orn-17')],
      },
      wednesday: {
        Breakfast: [m('orn-18')],
        Lunch: [m('orn-16'), mb('orn-17')],
        Dinner: [m('chorizo-with-potato-taco'), m('orn-21')],
      },
      thursday: {
        Breakfast: [m('fmd-d4-breakfast')],
        Lunch: [m('potato-and-spinach-soup')],
        Dinner: [m('fmd-d4-dinner'), m('fr-104')],
      },
      friday: {
        Breakfast: [m('orn-9')],
        Lunch: [m('fmd-d3-lunch')],
        Dinner: [m('oat-burger'), m('lightly-cooked-broccoli')],
      },
      saturday: {
        Breakfast: [m('orn-6')],
        Lunch: [m('fr-148'), m('bean-pate')],
        Dinner: [m('fr-94'), m('fr-190')],
      },
      sunday: {
        Breakfast: [m('fmd-d5-breakfast'), m('orn-13')],
        Lunch: [m('fmd-d5-lunch', 2)],
        Dinner: [m('fmd-d3-dinner'), mb('orn-17')],
      },
    },
  },
  {
    id: 'diabetes-if-week-1',
    name: 'Diabetes + Intermittent Fasting — Sample Week (1 person)',
    description: "Two meals a day, every recipe diabetes-friendly: a substantial breakfast with the Metabolic Support Drink, a substantial lunch, and no evening meal — the eating window closes after lunch. Averages about 1400 kcal a day, lower than a three-meal week by design, with protein and fibre still well covered. Combining fasting with diabetes affects blood sugar and medication timing (especially insulin or sulfonylureas) — talk to your doctor or care team before starting, and never skip a meal that your medication schedule depends on.",
    condition: 'diabetes-if',
    author: 'Fredheim Livsstilssenter',
    version: '1.0.0',
    translations: {
      no: {
        name: 'Diabetes + Intervallfaste — Eksempeluke (1 person)',
        description: 'To måltider om dagen, alle diabetesvennlige: en god frokost med Metabolisme-drikken, en god lunsj, og ingen kveldsmåltid — spisevinduet lukkes etter lunsj. Cirka 1400 kcal per dag i snitt, lavere enn en tre-måltidsuke med hensikt, med protein og fiber fortsatt godt dekket. Å kombinere faste med diabetes påvirker blodsukker og medisintiming (spesielt insulin eller sulfonylurea) — snakk med legen eller behandlingsteamet ditt før du starter, og hopp aldri over et måltid medisinskjemaet ditt er avhengig av.',
        notes: {
          week: 'Havre- og potetrundstykkene ligger i Storkokking-kortet — bak hele oppskriften mandag, den dekker alle sju gangene de dukker opp denne uken, med én til overs å fryse ned. De teller ikke med i handlelisten hver dag, kun én gang der. Metabolisme-drikken skal blandes fersk og drikkes med én gang — den er ikke egnet til å lages på forhånd. Ta tilskudd av vitamin B12 og vitamin D: ingen sammensetning av plantemat dekker dem. Kalsium ligger under målet denne uken — en skje tahini, ekstra grønt eller en beriket plantemelk tetter gapet.',
          days: {},
        },
      },
      sv: {
        name: 'Diabetes + Periodisk fasta — Exempelvecka (1 person)',
        description: 'Två måltider om dagen, alla diabetesvänliga: en rejäl frukost med Metabolism-drycken, en rejäl lunch, och ingen kvällsmåltid — ätfönstret stängs efter lunch. Cirka 1400 kcal per dag i snitt, lägre än en tremåltidsvecka med avsikt, med protein och fiber fortfarande väl täckta. Att kombinera fasta med diabetes påverkar blodsocker och medicintiming (särskilt insulin eller sulfonylurea) — prata med din läkare eller ditt vårdteam innan du börjar, och hoppa aldrig över en måltid som ditt medicinschema är beroende av.',
        notes: {
          week: 'Havre- och potatisfrallorna ligger i Storkokning-kortet — baka hela receptet på måndag, det täcker alla sju gångerna de dyker upp denna vecka, med en över att frysa in. De räknas inte in i inköpslistan varje dag, bara en gång där. Metabolism-drycken ska blandas färsk och drickas direkt — den lämpar sig inte för att göras i förväg. Ta tillskott av vitamin B12 och vitamin D: ingen sammansättning av växtbaserad mat täcker dem. Kalcium ligger under målet denna vecka — en sked tahini, extra grönt eller en berikad växtmjölk täpper till luckan.',
          days: {},
        },
      },
    },
    requiredPackIds: [REVERSAL_PACK_ID, FMD_PACK_ID],
    // Every item below carries a fixed serving count (see `easy-start-week-1`
    // above for why); this is the household size they were written for.
    portions: 1,
    // Baked once, Monday, as a batch — one full recipe (8 rolls) covers all
    // seven eaten across the week with one spare.
    batchCook: [
      { id: 'diabetes-if-week-1-rolls', kind: 'recipe', recipeId: 'orn-17', servings: 8 },
    ],
    // Smart tips travel with the week and land in the planner's tips card.
    notes: {
      week: "The oat & potato bread rolls live in the Batch cooking card — bake the full recipe on Monday and it covers all seven times they appear this week, with one spare to freeze. They don't count toward the shopping list each day, only once there. The Metabolic Support Drink should be blended fresh and drunk right away — it isn't meant to be made ahead. Supplement vitamin B12 and vitamin D: no arrangement of plant foods covers them. Calcium runs under target this week — a spoon of tahini, extra greens or a fortified plant milk closes the gap.",
      days: {},
    },
    plan: {
      monday: {
        Breakfast: [m('orn-9'), m('orn-29')],
        Lunch: [m('orn-11', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
      tuesday: {
        Breakfast: [m('orn-6'), m('orn-29')],
        Lunch: [m('fmd-d4-dinner', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
      wednesday: {
        Breakfast: [m('orn-18'), m('orn-29')],
        Lunch: [m('fmd-d1-dinner', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
      thursday: {
        Breakfast: [m('orn-13'), m('orn-29')],
        Lunch: [m('fmd-d3-lunch', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
      friday: {
        Breakfast: [m('orn-25'), m('orn-29')],
        Lunch: [m('fmd-d2-dinner', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
      saturday: {
        Breakfast: [m('orn-27'), m('orn-29')],
        Lunch: [m('orn-14', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
      sunday: {
        Breakfast: [m('fmd-d3-breakfast'), m('orn-29')],
        Lunch: [m('fmd-d3-dinner', 2), mb('orn-17'), m('orn-21'), m('orn-2')],
      },
    },
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

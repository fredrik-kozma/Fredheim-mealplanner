/**
 * Public sources for the optional journal's wording.
 *
 * These links are educational. They are not a portion table, a dose
 * schedule, or an affiliation. The Monash FODMAP Calculator terms do not
 * allow this app to extract or redistribute that database, and no other
 * openly redistributable portion list has been reviewed for clinical use
 * here. PRODUCTION_DATASET in productionDataset.js stays empty until a
 * lawful, auditable source is added in the app itself.
 */

export const FODMAP_SOURCES = [
  {
    id: 'monash-faq',
    url: 'https://www.monashfodmap.com/about-fodmap-and-ibs/frequently-asked-questions/',
    usedFor: 'A restriction trial is often 2–6 weeks and then reviewed. It is not a permanent diet.',
  },
  {
    id: 'monash-reintro',
    url: 'https://www.monashfodmap.com/blog/practical-tips-fodmap-reintroduction/',
    usedFor: 'Reintroduce when symptoms are settled, on a low-FODMAP background, one food at a time.',
  },
  {
    id: 'monash-diary',
    url: 'https://www.monashfodmap.com/blog/reintroduction-using-diary-function/',
    usedFor: 'One subgroup at a time, about three days of increasing portions, then 2–3 days of recovery or until symptoms settle. Stop if symptoms are unpleasant.',
  },
  {
    id: 'monash-stacking',
    url: 'https://www.monashfodmap.com/blog/fodmap-stacking-explained/',
    usedFor: 'Several portions in one meal can add up. This app does not assess stacking.',
  },
  {
    id: 'monash-pregnancy',
    url: 'https://www.monashfodmap.com/blog/the-low-fodmap-diet-during-pregnancy/',
    usedFor: 'Do not start the restriction during pregnancy.',
  },
  {
    id: 'monash-children',
    url: 'https://www.monashfodmap.com/blog/the-low-fodmap-diet-in-children-are-we-there-yet/',
    usedFor: 'Children need clinical oversight. This app will not start a restriction for a child.',
  },
  {
    id: 'monash-eating',
    url: 'https://www.monashfodmap.com/blog/disordered-eating/',
    usedFor: 'A current or past eating disorder, or restrictive eating, needs individual support. This is not a permanent ban on the app.',
  },
  {
    id: 'nice-cg61',
    url: 'https://www.nice.org.uk/guidance/cg61/chapter/Recommendations',
    usedFor: 'IBS food advice belongs with a clinician. General guidance, not personal medical advice.',
  },
  {
    id: 'nhs-symptoms',
    url: 'https://www.nhs.uk/conditions/irritable-bowel-syndrome-ibs/symptoms/',
    usedFor: 'Bleeding, unexplained weight loss, a lump or swelling, or pallor with breathlessness or palpitations need assessment, not an elimination diet.',
  },
]

export const SOURCE_BY_ID = Object.fromEntries(FODMAP_SOURCES.map(s => [s.id, s]))

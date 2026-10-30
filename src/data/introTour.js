/**
 * The intro tour ("Welcome to Fredheim"): which slides, which screenshot
 * each one shows, and where the highlights go.
 *
 * Plain data, no React, so the tests can check it without a browser. The
 * component is src/components/onboarding/IntroTour.jsx; the words live in
 * the locale files under `tour.slides.<id>`.
 *
 * Screenshots are public/tour/<lang>/<layout>/<img>.webp, taken at 1280 px
 * wide on desktop and 590 px on a phone. Every position below is a
 * percentage of the whole image (x across, y down), so it scales with it:
 *
 *   box:   [x, y, w, h]   a rounded highlight; the rest of the shot dims
 *   label: 'callout'      text from tour.slides.<id>.<label>
 *   at:    [x, y]         centre of that label; an arrow runs to the box
 *   mask:  [x, y, w, h]   painted over in white (the test account's email
 *                         in the desktop sidebar)
 *
 * `crop: [top, bottom]` shows only that band of a tall phone shot, so the
 * part that matters is big enough to read.
 *
 * The screenshots differ a little per language (longer words wrap, buttons
 * are wider, the English phone shots were scrolled differently), so a
 * layout can carry `lang: { no: {...}, sv: {...} }`: those keys replace
 * the shared ones for that language.
 */

export const TOUR_LANGS = ['en', 'no', 'sv']
export const TOUR_LAYOUTS = ['desktop', 'mobile']

// Narrower than this gets the phone screenshots.
export const MOBILE_QUERY = '(max-width: 767px)'

export const IMAGE_SIZE = {
  desktop: { w: 1280, h: 715 },
  mobile: { w: 590, h: 1279 },
}

// The account block at the bottom of the desktop sidebar shows the email
// of the account the screenshots were taken with.
const EMAIL_MASK = { mask: [0.8, 83.2, 11.6, 5.2] }

export const TOUR_SLIDES = {
  welcome: {
    desktop: { img: '01-recipes', marks: [EMAIL_MASK] },
    mobile: { img: '01-recipes', crop: [0, 70] },
  },

  recipes: {
    desktop: {
      img: '02-recipe-top',
      marks: [EMAIL_MASK, { box: [39, 40.6, 34.2, 9], label: 'callout', at: [84, 45] }],
    },
    mobile: {
      img: '02-recipe-top',
      crop: [6, 93],
      marks: [{ box: [3.4, 68.2, 93.2, 18.2], label: 'callout', at: [50, 90.6] }],
    },
  },

  labels: {
    desktop: {
      img: '01-recipes',
      marks: [EMAIL_MASK, { box: [13, 20.1, 82.2, 4.4], label: 'callout', at: [42, 33] }],
    },
    mobile: {
      img: '01-recipes',
      crop: [0, 70],
      // English has a "Clear filters" chip above the packs, the others don't.
      marks: [{ box: [3, 34.6, 97, 5], label: 'callout', at: [50, 52] }],
      lang: {
        no: { marks: [{ box: [3, 31, 97, 4.8], label: 'callout', at: [50, 52] }] },
        sv: { marks: [{ box: [3, 31, 97, 4.8], label: 'callout', at: [50, 52] }] },
      },
    },
  },

  salt: {
    desktop: {
      img: '02-recipe-top',
      marks: [EMAIL_MASK, { box: [39, 63.2, 9, 4.6], label: 'callout', at: [25.5, 65.5] }],
    },
    mobile: {
      img: '03-recipe-salt-switch',
      crop: [6, 70],
      marks: [{ box: [3.4, 29.6, 40, 5], label: 'callout', at: [72, 38.5] }],
      lang: {
        no: { marks: [{ box: [3.4, 36.8, 40, 4.8], label: 'callout', at: [72, 45.5] }] },
        sv: { marks: [{ box: [3.4, 37.8, 40, 4.8], label: 'callout', at: [72, 46.5] }] },
      },
    },
  },

  makeWeek: {
    desktop: {
      img: '04-planner',
      marks: [EMAIL_MASK, { box: [51.6, 6.2, 8.6, 4.6], label: 'callout', at: [52, 24] }],
      lang: {
        no: { marks: [EMAIL_MASK, { box: [50.2, 6.2, 8, 4.6], label: 'callout', at: [52, 24] }] },
        sv: { marks: [EMAIL_MASK, { box: [48.7, 6.2, 8.2, 4.6], label: 'callout', at: [50, 24] }] },
      },
    },
    mobile: {
      // Make my week is now a full-width button at the top of the planner.
      // The phone shots were taken when it still sat in the print menu, so
      // until they are retaken every language shows the first question.
      img: '08-wiz-q1',
      crop: [18, 100],
      marks: [{ box: [3.5, 22.6, 60, 5.2], label: 'callout2', at: [50, 34] }],
    },
  },

  goals: {
    desktop: {
      img: '05-wiz-q1',
      marks: [{ box: [39, 60, 21.8, 13.4], label: 'callout', at: [76, 66.5] }],
    },
    mobile: {
      img: '08-wiz-q1',
      crop: [18, 100],
      marks: [{ box: [4.2, 73.2, 91.6, 16.8], label: 'callout', at: [50, 95] }],
    },
  },

  calories: {
    desktop: {
      img: '06-wiz-calories',
      marks: [{ box: [39, 47.4, 21.8, 10.6], label: 'callout', at: [76, 52.5] }],
    },
    mobile: {
      img: '14-wiz-q7',
      crop: [36, 100],
      marks: [{ box: [4.2, 67.4, 91.6, 13.2], label: 'callout', at: [50, 95] }],
    },
  },

  prefs: {
    desktop: {
      img: '07-wiz-prefs',
      marks: [
        { box: [39, 36.2, 21.8, 6], label: 'callout', at: [24, 39] },
        { box: [39, 51.6, 21.8, 8.6], label: 'callout2', at: [76, 56] },
      ],
    },
    mobile: {
      img: '15-wiz-q8',
      crop: [18, 100],
      marks: [
        { box: [4.2, 42, 91.6, 6.4], label: 'callout', at: [50, 34.5] },
        { box: [4.2, 60.8, 91.6, 12.6], label: 'callout2', at: [50, 79] },
      ],
      lang: {
        // "Begge deler" wraps onto two lines.
        no: {
          marks: [
            { box: [4.2, 38.6, 91.6, 8], label: 'callout', at: [50, 32] },
            { box: [4.2, 60.8, 91.6, 12.6], label: 'callout2', at: [50, 79] },
          ],
        },
      },
    },
  },

  preview: {
    desktop: {
      img: '08-week-preview',
      marks: [
        { box: [39, 19.6, 21.4, 10.8], label: 'callout', at: [24, 25] },
        { box: [52.6, 35.6, 7.4, 2.6], label: 'callout2', at: [76, 37] },
      ],
      lang: {
        no: {
          marks: [
            { box: [39, 30.6, 21.4, 10.6], label: 'callout', at: [24, 36] },
            { box: [52.6, 46.9, 7.4, 2.6], label: 'callout2', at: [76, 48] },
          ],
        },
        sv: {
          marks: [
            { box: [39, 28.8, 21.4, 10.6], label: 'callout', at: [24, 34] },
            { box: [52.6, 45, 7.4, 2.6], label: 'callout2', at: [76, 46.5] },
          ],
        },
      },
    },
    mobile: {
      img: '17-week-preview-days',
      crop: [15, 86],
      marks: [
        { box: [4.2, 47.4, 89.8, 13.6], label: 'callout', at: [50, 41.5] },
        { box: [57.6, 68, 33.6, 2.6], label: 'callout2', at: [45, 76] },
      ],
      lang: {
        no: {
          marks: [
            { box: [4.2, 42.6, 89.8, 15.4], label: 'callout', at: [50, 37] },
            { box: [57.6, 65.5, 33.6, 2.6], label: 'callout2', at: [45, 74] },
          ],
        },
        sv: {
          marks: [
            { box: [4.2, 40.3, 89.8, 15.4], label: 'callout', at: [50, 34.5] },
            { box: [57.6, 63.3, 33.6, 2.6], label: 'callout2', at: [45, 72] },
          ],
        },
      },
    },
  },

  planner: {
    desktop: {
      img: '09-planner-week',
      marks: [
        EMAIL_MASK,
        { box: [13, 34, 9.8, 63], label: 'callout2', at: [18, 22] },
        { box: [27.6, 34, 11.6, 63], label: 'callout', at: [42, 27] },
      ],
    },
    mobile: {
      // The week's grid, with Monday's column and the batch-cooking column.
      img: '07-planner-more',
      crop: [5, 92],
      marks: [
        { box: [3.4, 6.2, 11.6, 82.2] },
        { box: [38, 6.2, 54.4, 77.6], label: 'callout', at: [62, 88] },
      ],
      lang: {
        no: {
          img: '06-planner-week',
          crop: [12, 97],
          marks: [
            { box: [3.4, 16, 11.6, 76.5] },
            { box: [38, 16.2, 54.4, 76.3], label: 'callout', at: [62, 94.5] },
          ],
        },
        sv: {
          img: '06-planner-week',
          crop: [8, 92],
          marks: [
            { box: [3.4, 10.2, 11.6, 78.2] },
            { box: [38, 10.4, 54.4, 72.8], label: 'callout', at: [62, 87.5] },
          ],
        },
      },
    },
  },

  shopping: {
    desktop: {
      img: '10-shopping',
      marks: [EMAIL_MASK, { box: [13.2, 10.6, 85.8, 30.4], label: 'callout', at: [55, 58] }],
    },
    mobile: {
      img: '18-shopping',
      crop: [6, 82],
      marks: [{ box: [3.4, 19, 93.2, 40], label: 'callout', at: [55, 69] }],
    },
  },

  nutrition: {
    desktop: {
      img: '11-nutrition',
      marks: [EMAIL_MASK, { box: [39.2, 15.4, 33.6, 33.6], label: 'callout', at: [24, 30] }],
    },
    mobile: {
      img: '19-nutrition',
      crop: [6, 88],
      marks: [{ box: [3.6, 25, 92.8, 44.2], label: 'callout', at: [50, 75] }],
    },
  },

  settings: {
    desktop: {
      img: '13-settings-salt',
      marks: [EMAIL_MASK, { box: [43.4, 6, 25.4, 29.6], label: 'callout', at: [84, 20] }],
      lang: {
        no: { marks: [EMAIL_MASK, { box: [43.4, 46.6, 25.4, 29.6], label: 'callout', at: [84, 60] }] },
        sv: { marks: [EMAIL_MASK, { box: [43.4, 1.8, 25.4, 29.6], label: 'callout', at: [84, 16] }] },
      },
    },
    mobile: {
      img: '21-settings-salt',
      crop: [38, 93],
      marks: [{ box: [3.4, 45.6, 93.2, 46.2], label: 'callout', at: [50, 41.5] }],
    },
  },

  done: {
    desktop: { img: '08-week-preview' },
    mobile: { img: '16-week-preview-top', crop: [14, 100] },
  },
}

// Two ways through. The first slide asks which one.
export const TOUR_PATHS = {
  quick: ['welcome', 'recipes', 'makeWeek', 'planner', 'shopping', 'done'],
  full: [
    'welcome', 'recipes', 'labels', 'salt', 'makeWeek', 'goals', 'calories',
    'prefs', 'preview', 'planner', 'shopping', 'nutrition', 'settings', 'done',
  ],
}

export function tourLang(language) {
  let code = String(language || '').slice(0, 2).toLowerCase()
  if (code === 'nb' || code === 'nn') code = 'no'
  return TOUR_LANGS.includes(code) ? code : 'en'
}

/** The screenshot, crop and marks a slide shows for one layout and language. */
export function resolveShot(slideId, layout, lang) {
  const slide = TOUR_SLIDES[slideId]
  const base = slide?.[layout]
  if (!base) return null
  const { lang: overrides, ...shared } = base
  const shot = { crop: null, marks: [], ...shared, ...(overrides?.[tourLang(lang)] || {}) }
  const size = IMAGE_SIZE[layout]
  return {
    ...shot,
    src: `/tour/${tourLang(lang)}/${layout}/${shot.img}.webp`,
    width: size.w,
    height: size.h,
  }
}

/** Every callout key the slides use (for the locale check in the tests). */
export function calloutKeys(slideId) {
  const keys = new Set()
  for (const layout of TOUR_LAYOUTS) {
    for (const lang of TOUR_LANGS) {
      for (const m of resolveShot(slideId, layout, lang)?.marks || []) {
        if (m.label) keys.add(m.label)
      }
    }
  }
  return [...keys]
}

/**
 * Whether the tour should open by itself: once, for a new user, after the
 * language question has been answered and with nothing else on screen.
 */
export function shouldAutoShowTour({ hasChosenLanguage, hasSeenIntroTour, otherModalOpen = false }) {
  return Boolean(hasChosenLanguage) && !hasSeenIntroTour && !otherModalOpen
}

/**
 * The intro tour ("Welcome to Fredheim"): which slides, which screenshot
 * each one shows, and where the highlights go.
 *
 * Plain data, no React, so the tests can check it without a browser. The
 * component is src/components/onboarding/IntroTour.jsx; the words live in
 * the locale files under `tour.slides.<id>`.
 *
 * Screenshots are public/tour/<lang>/<layout>/<img>.webp, taken by
 * scripts/capture-tour-screens.mjs at 1280 px wide on desktop and on a phone
 * 393 px wide at 1.5x (so 590 px). Every position below is a
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
 * are wider), so a layout can carry `lang: { no: {...}, sv: {...} }`: those keys replace
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
// of the account the screenshots were taken with, and its role beside it.
const EMAIL_MASK = { mask: [0.8, 82.6, 17, 5.8] }

export const TOUR_SLIDES = {
  // Today, the home screen.
  welcome: {
    desktop: {
      img: '00-today',
      marks: [EMAIL_MASK, { box: [20.6, 19.3, 77.5, 73.3], label: 'callout', at: [62, 11] }],
    },
    mobile: {
      img: '00-today',
      crop: [6, 78],
      marks: [{ box: [4.1, 21.8, 91.9, 54], label: 'callout', at: [72, 12] }],
    },
  },

  recipes: {
    desktop: {
      img: '02-recipe-top',
      marks: [EMAIL_MASK, { box: [20.8, 87.6, 77, 10], label: 'callout', at: [58, 77] }],
    },
    mobile: {
      img: '02-recipe-top',
      crop: [6, 93],
      marks: [{ box: [5.4, 69.6, 89.2, 9.2], label: 'callout', at: [50, 85] }],
      lang: {
        // The stepper wraps under the longer text.
        no: { marks: [{ box: [5.4, 69.6, 89.2, 15], label: 'callout', at: [50, 88.5] }] },
        sv: { marks: [{ box: [5.4, 69.6, 89.2, 15], label: 'callout', at: [50, 88.5] }] },
      },
    },
  },

  labels: {
    desktop: {
      img: '01-recipes',
      marks: [EMAIL_MASK, { box: [19.6, 34.1, 79.8, 5], label: 'callout', at: [42, 50] }],
    },
    mobile: {
      img: '01-recipes',
      crop: [0, 70],
      marks: [{ box: [2, 34.2, 97, 4.2], label: 'callout', at: [50, 50] }],
    },
  },

  // The ingredients with the salt switch above them and two rows ticked.
  salt: {
    desktop: {
      img: '03-recipe-ticks',
      marks: [
        EMAIL_MASK,
        { box: [20.6, 11.2, 11.8, 4.5], label: 'callout', at: [44, 13.5] },
        { box: [20.7, 17.4, 29.8, 12.3], label: 'callout2', at: [66, 38] },
      ],
    },
    mobile: {
      img: '03-recipe-salt-switch',
      crop: [6, 70],
      marks: [
        { box: [4.1, 21, 38.6, 3.8], label: 'callout', at: [72, 23] },
        { box: [4.3, 26.3, 91.3, 10.3], label: 'callout2', at: [50, 45] },
      ],
    },
  },

  // The real Make my week button, top of the planner.
  makeWeek: {
    desktop: {
      img: '04-planner',
      marks: [EMAIL_MASK, { box: [20, 15.9, 12.2, 6.2], label: 'callout', at: [46, 8] }],
      lang: {
        no: { marks: [EMAIL_MASK, { box: [20, 15.9, 11.4, 6.2], label: 'callout', at: [46, 8] }] },
        sv: { marks: [EMAIL_MASK, { box: [20, 15.9, 11.9, 6.2], label: 'callout', at: [46, 8] }] },
      },
    },
    mobile: {
      img: '05-planner-tips',
      crop: [6, 72],
      marks: [{ box: [4.1, 21.1, 91.9, 5.2], label: 'callout', at: [68, 15.5] }],
    },
  },

  goals: {
    desktop: {
      img: '05-wiz-q1',
      marks: [
        { box: [34.1, 21.8, 31.9, 7.6], label: 'callout2', at: [18, 25.5] },
        { box: [34.1, 70.3, 31.9, 19], label: 'callout', at: [80, 80] },
      ],
    },
    mobile: {
      img: '08-wiz-q1',
      crop: [18, 100],
      marks: [
        { box: [3.4, 33, 93.2, 6.8], label: 'callout2', at: [68, 26] },
        { box: [5.1, 73.7, 89.8, 15.9], label: 'callout', at: [50, 96] },
      ],
    },
  },

  calories: {
    desktop: {
      img: '06-wiz-calories',
      marks: [{ box: [34.1, 47, 31.9, 14.5], label: 'callout', at: [80, 54] }],
    },
    mobile: {
      img: '14-wiz-q7',
      crop: [36, 100],
      marks: [{ box: [5.1, 67.6, 89.8, 12.2], label: 'callout', at: [50, 95] }],
    },
  },

  prefs: {
    desktop: {
      img: '07-wiz-prefs',
      marks: [
        { box: [34.1, 32.3, 31.9, 6.2], label: 'callout', at: [18, 35.5] },
        { box: [34.1, 54.4, 31.9, 11.2], label: 'callout2', at: [80, 60] },
      ],
      lang: {
        // "Begge deler" wraps onto two lines.
        no: {
          marks: [
            { box: [34.1, 32.3, 31.9, 8.1], label: 'callout', at: [18, 36] },
            { box: [34.1, 56.3, 31.9, 11.2], label: 'callout2', at: [80, 62] },
          ],
        },
      },
    },
    mobile: {
      img: '15-wiz-q8',
      crop: [14, 100],
      marks: [
        { box: [5.1, 38.1, 89.8, 5.2], label: 'callout', at: [72, 31] },
        { box: [5.1, 56.6, 89.8, 11.7], label: 'callout2', at: [50, 72] },
      ],
      lang: {
        no: {
          marks: [
            { box: [5.1, 38.1, 89.8, 8.7], label: 'callout', at: [72, 31] },
            { box: [5.1, 60.1, 89.8, 11.7], label: 'callout2', at: [50, 75.5] },
          ],
        },
      },
    },
  },

  preview: {
    desktop: {
      img: '08-week-preview',
      marks: [
        { box: [34.1, 18.2, 31.9, 14.8], label: 'callout', at: [18, 25] },
        { box: [49.7, 49.7, 15.2, 2.2], label: 'callout2', at: [80, 51] },
      ],
    },
    mobile: {
      img: '17-week-preview-days',
      crop: [12, 90],
      marks: [
        { box: [5.1, 26.3, 89.8, 12.4], label: 'callout', at: [66, 21] },
        { box: [42, 52.4, 49.6, 2.5], label: 'callout2', at: [72, 47.5] },
      ],
    },
  },

  // The week's grid, with the batch-cooking column and Monday's.
  planner: {
    desktop: {
      img: '09-planner-week',
      marks: [
        EMAIL_MASK,
        { box: [20.2, 32, 13.6, 67], label: 'callout2', at: [27, 24] },
        { box: [41.9, 32, 16.8, 67], label: 'callout', at: [50, 24] },
      ],
    },
    mobile: {
      img: '07-planner-more',
      crop: [5, 92],
      marks: [
        { box: [4.7, 6.9, 9.9, 82.5] },
        { box: [39, 9.2, 53.2, 75.8], label: 'callout', at: [62, 88] },
      ],
    },
  },

  shopping: {
    desktop: {
      img: '10-shopping',
      marks: [EMAIL_MASK, { box: [20, 19.6, 78.8, 40], label: 'callout', at: [55, 68] }],
    },
    mobile: {
      img: '18-shopping',
      crop: [6, 90],
      marks: [{ box: [4, 27, 92, 45], label: 'callout', at: [55, 79] }],
    },
  },

  nutrition: {
    desktop: {
      img: '11-nutrition',
      marks: [EMAIL_MASK, { box: [34.4, 26, 50, 58], label: 'callout', at: [21, 50] }],
    },
    mobile: {
      img: '19-nutrition',
      crop: [6, 90],
      marks: [{ box: [4.1, 27.4, 91.9, 48.7], label: 'callout', at: [50, 83] }],
    },
  },

  settings: {
    desktop: {
      img: '13-settings-salt',
      marks: [EMAIL_MASK, { box: [40.6, 45.4, 37.5, 43.6], label: 'callout', at: [28, 67] }],
    },
    mobile: {
      img: '21-settings-salt',
      crop: [30, 96],
      marks: [{ box: [4.1, 46.1, 91.9, 43.3], label: 'callout', at: [50, 41.5] }],
      lang: {
        no: { marks: [{ box: [4.1, 46.1, 91.9, 45.2], label: 'callout', at: [50, 41.5] }] },
      },
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

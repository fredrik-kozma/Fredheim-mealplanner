/**
 * Card faces only. Playfair Display 700 for the recipe title, Figtree 600
 * for the allergen lines. Latin and Latin Extended, woff2, so æøå, åäö and
 * letters such as ă print the same offline, in the print dialog and in the
 * Android WebView. The rest of the app does not use these families.
 */
import playfairLatin from '@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url'
import playfairExt from '@fontsource/playfair-display/files/playfair-display-latin-ext-700-normal.woff2?url'
import figtreeLatin from '@fontsource/figtree/files/figtree-latin-600-normal.woff2?url'
import figtreeExt from '@fontsource/figtree/files/figtree-latin-ext-600-normal.woff2?url'

export const CARD_TITLE_FONT = '"Playfair Display", Georgia, serif'
export const CARD_TEXT_FONT = 'Figtree, system-ui, sans-serif'

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'

function face(family, weight, url, range) {
  return `@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('woff2');unicode-range:${range};}`
}

export const ALLERGEN_FONT_FACE_CSS = [
  face('"Playfair Display"', 700, playfairLatin, LATIN),
  face('"Playfair Display"', 700, playfairExt, LATIN_EXT),
  face('Figtree', 600, figtreeLatin, LATIN),
  face('Figtree', 600, figtreeExt, LATIN_EXT),
].join('\n')

const SAMPLE = 'Ciorbă æøå åäö'

/** Resolve both subsets before measuring or painting a card. */
export function ensureAllergenFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve()
  return Promise.all([
    document.fonts.load(`700 16px ${CARD_TITLE_FONT}`, SAMPLE),
    document.fonts.load(`600 16px ${CARD_TEXT_FONT}`, SAMPLE),
    document.fonts.ready,
  ])
}

import colors from 'tailwindcss/colors'

/*
 * The design tokens. Everything visual in the app comes from here, through
 * the classes in src/index.css (.btn-*, .card, .chip, .page-title, …):
 *
 *   Colour    primary (the purple: main actions, active state), slate (all
 *             neutrals), success, warning, danger. orange is batch cooking.
 *             Other hues only label categories and health conditions.
 *   Radius    rounded-small (8px), -control (12px: buttons, inputs),
 *             -card (16px: cards, dialogs), -full (pills).
 *   Shadow    shadow-card (resting), -raised (menus, hover), -overlay (dialogs).
 *   Type      text-2xs (11px, the smallest), xs, sm, base, lg, xl, 2xl.
 *             Weights: medium for labels, semibold for buttons and headings,
 *             bold for page titles.
 *   Spacing   Tailwind's 4px scale, plus pb-nav to clear the bottom tab bar.
 *   Icons     w-3.5 (with text-xs), w-4 (with text-sm), w-5 (tabs, icon
 *             buttons), w-6 (feature), all stroke-width 2.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        success: colors.emerald,
        warning: colors.amber,
        danger: colors.red,
      },
      borderRadius: {
        small: '0.5rem',
        control: '0.75rem',
        card: '1rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        raised: '0 4px 12px -2px rgb(15 23 42 / 0.12), 0 2px 4px -2px rgb(15 23 42 / 0.06)',
        overlay: '0 24px 48px -12px rgb(15 23 42 / 0.3)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      spacing: {
        // The tab bar's 64px, a little air, and the phone's home indicator.
        nav: 'calc(5.5rem + env(safe-area-inset-bottom))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

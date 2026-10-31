# Style audit (visual consistency pass, 2026-10-30)

Counts are from `src/**/*.jsx` before the pass. The app has no dark mode (no
`dark:` classes, no `darkMode` setting), so there is none to preserve.

## Tokens

- **Two names for one purple.** `tailwind.config.js` defines `primary`, but
  nothing uses it: 282 `indigo-*` classes instead. Also 3 `blue-*`, including a
  one-off blue and a one-off green solid button on Packs.
- **Two greens for "good".** `emerald-*` (65) and `green-*` (26), sometimes in
  the same panel.
- **Radii drift.** `rounded-md`, `rounded`, `rounded-lg`, `rounded-xl`,
  `rounded-2xl`, `rounded-3xl`; dialogs use 2xl or 3xl, buttons xl or lg.
- **Shadows drift.** `shadow`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, with no rule
  for which level means what. Identical bottom sheets differ.
- **One-off font sizes.** 90-odd `text-[9px]`, `[10px]`, `[11px]`, `[13px]`,
  `[15px]`. The 9 and 10 px text is below comfortable reading size.
- **Invalid classes.** `w-4.5 h-4.5` does not exist in Tailwind, so those icons
  get no size from it. `safe-area-bottom` on the bottom nav is not defined
  anywhere, and the viewport has no `viewport-fit=cover`, so it does nothing.

## Buttons

- **Sizes are rebuilt per use.** `.btn-*` is overridden inline with about 15
  padding/size mixes (`py-1.5 px-3 text-xs`, `py-2.5`, `py-3 px-6`, `h-9`,
  `w-10 h-10 p-0`), many under 44 px.
- **Purple is overused.** Solid purple on routine actions (Settings: add
  category, add meal slot, save rename; Saved lists: print; template rows: load
  on every row), so Make my week does not stand out.
- **Selected state looks like a primary button.** Filter chips and the current
  day are solid purple.
- **Packs:** install buttons are one-off solid blue and solid green.
- **Icon-only buttons** on Recipes (export, add) have no accessible name on a
  phone, because the label is `hidden sm:inline`.

## Page structure

- **Headers differ.** Today is `text-2xl`, the other tabs `text-xl`, Shared
  import `text-lg font-semibold`, and the padding varies.
- **The title shows twice on a phone.** The top bar and the page both say
  "Recipes", and the top bar squeezes it to 13 px.
- **Cards are copied by hand.** `bg-white rounded-… border … shadow-…` mixes
  sit beside `.card`.
- **Empty states differ per page.** 4xl or 5xl emoji, or text only, with
  different padding and text colours; some in a card, some not; two avocados
  on Recipes.
- **Bottom sheets repeat their wrapper** with different radius, shadow and
  max-height (`85vh`, `92dvh`, `.sheet-max-h`).

## Icons, focus, tap targets

- **Icon sizes:** 3, 3.5, 4, 4.5, 5, 6 and `[18px]`, with stroke widths of 1.5,
  1.8, 2 and 2.5 side by side.
- **Focus rings:** `focus:ring` in indigo, blue, green, amber or orange, at 1
  or 2 px, with or without offset. `focus:` also lights the ring on mouse
  clicks. Several `focus:outline-none` elements have no visible focus at all.
- **Tap targets:** `.tap-target` grows to 40 px, not 44. Many small buttons and
  text links have no help at all (Today's week link, header sign-in, list rows).

## Navigation

- **Cut-off labels at 320 px.** Six tabs get about 53 px each; "Inställningar"
  and "Innstillinger" do not fit, even at 10 px with tightened tracking, so
  they truncate.
- **Active state is weak and partly broken.** Colour only, plus a filled icon:
  filling removes the Today sun's rays and turns the gear into a blob. The
  Recipes tab is a `<button>` with no `aria-current`.

## Today

- **Summary and cards disagree.** The kcal and omega summary counts snacks, but
  the cards leave them out.

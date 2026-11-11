import {
  CARD_W, CARD_H, GAP_X, GAP_Y, GRID_W, GRID_H, MARGIN_X, MARGIN_TOP,
  FOOTER_GAP, PAGE_W, PAGE_H, ROWS,
} from './allergenCardModel.js'

const disclaimerTop = MARGIN_TOP + GRID_H + FOOTER_GAP

/** Shared by the on-screen sheet and the print window, so they cannot drift. */
export const ALLERGEN_CARD_CSS = `
.allergen-print-area { font-family: Inter, system-ui, sans-serif; }
.allergen-page {
  width: ${PAGE_W}mm;
  height: ${PAGE_H}mm;
  position: relative;
  background: #fff;
  overflow: hidden;
  color: #143028;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
  color-adjust: exact;
}
.allergen-page-head {
  position: absolute;
  top: 3.5mm;
  left: 12mm;
  right: 12mm;
  height: 6mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4mm;
  color: #1B7A3A;
  font-size: 8pt;
  font-weight: 650;
  letter-spacing: 0.01em;
}
.allergen-page-head span { display: inline-flex; align-items: center; gap: 1.5mm; }
.allergen-page-head img { width: 5mm; height: 5mm; border-radius: 50%; object-fit: cover; }
.allergen-grid {
  position: absolute;
  top: ${MARGIN_TOP}mm;
  left: ${MARGIN_X}mm;
  width: ${GRID_W}mm;
  height: ${GRID_H}mm;
  display: grid;
  grid-template-columns: ${CARD_W}mm ${CARD_W}mm;
  grid-template-rows: repeat(${ROWS}, ${CARD_H}mm);
  column-gap: ${GAP_X}mm;
  row-gap: ${GAP_Y}mm;
}
.allergen-slot { position: relative; width: ${CARD_W}mm; height: ${CARD_H}mm; }
.allergen-slot::before {
  content: "";
  position: absolute;
  inset: -1.5mm;
  border: 0.15mm dashed #8aa898;
  border-radius: 3mm;
  pointer-events: none;
}
.allergen-card, .allergen-empty {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  width: ${CARD_W}mm;
  height: ${CARD_H}mm;
  margin: 0;
  padding: 1.7mm 1.8mm 1.4mm;
  border: 0.35mm solid #1B7A3A;
  border-radius: 2.2mm;
  background: #fff;
  color: #143028;
  font-family: inherit;
  text-align: left;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.9mm;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.allergen-empty {
  border-style: dashed;
  border-color: #9dccb0;
  background: #f3faf5;
  color: #1B7A3A;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.allergen-plus { font-size: 16pt; font-weight: 500; line-height: 1; }
.allergen-top { display: flex; gap: 1.6mm; min-height: 14mm; align-items: flex-start; }
.allergen-photo {
  width: 14mm;
  height: 14mm;
  border-radius: 1.5mm;
  object-fit: cover;
  flex: none;
  background: #e7f6ec;
}
.allergen-photo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #1B7A3A;
  font-size: 8pt;
}
.allergen-name {
  font-size: 8pt;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
  padding-right: 6mm;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.allergen-logo {
  position: absolute;
  top: 1.3mm;
  right: 1.3mm;
  width: 5mm;
  height: 5mm;
  border-radius: 50%;
  object-fit: cover;
}
.allergen-lines {
  display: flex;
  flex-direction: column;
  gap: 0.3mm;
  overflow: hidden;
  font-size: 6.15pt;
  line-height: 1.2;
}
.allergen-line { display: flex; gap: 0.8mm; align-items: flex-start; }
.allergen-ico {
  width: 3.3mm;
  height: 3.3mm;
  flex: none;
  color: #1B7A3A;
  background: #e7f6ec;
  border-radius: 0.8mm;
  padding: 0.25mm;
  box-sizing: border-box;
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.allergen-none {
  display: flex;
  gap: 0.8mm;
  align-items: flex-start;
  color: #1B7A3A;
  font-weight: 650;
  font-size: 6.6pt;
  line-height: 1.25;
}
.allergen-review { color: #8a5a00; }
.allergen-review .allergen-ico { color: #8a5a00; background: #fff4df; }
.allergen-disclaimer {
  position: absolute;
  left: 12mm;
  right: 12mm;
  top: ${disclaimerTop}mm;
  margin: 0;
  font-size: 7pt;
  line-height: 1.3;
  color: #3d5246;
  text-align: center;
}
@page { size: A4; margin: 0; }
@media screen {
  .allergen-page { box-shadow: 0 10px 28px rgba(15, 40, 25, 0.12); }
  .allergen-page + .allergen-page { margin-top: 16px; }
  .allergen-card, .allergen-empty { cursor: pointer; }
  .allergen-card:hover, .allergen-empty:hover { box-shadow: 0 2px 8px rgba(20, 80, 40, 0.16); }
}
@media print {
  .allergen-screen-only { display: none !important; }
  .allergen-page {
    box-shadow: none !important;
    margin: 0 !important;
    break-after: page;
    page-break-after: always;
  }
  .allergen-page:last-child { break-after: auto; page-break-after: auto; }
}
`

export const PRINT_WINDOW_CSS = `
html, body { margin: 0; padding: 0; background: #fff; }
${ALLERGEN_CARD_CSS}
`

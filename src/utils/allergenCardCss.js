import {
  CARD_W, CARD_H, GAP_X, GAP_Y, GRID_W, GRID_H, MARGIN_X, MARGIN_TOP,
  FOOTER_GAP, PAGE_W, PAGE_H, ROWS, PHOTO_VEIL, CARD_TYPE,
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
  color: #10261c;
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
  padding: 0;
  border: 0.4mm solid #1B7A3A;
  border-radius: 2.2mm;
  background: #fff;
  color: #10261c;
  font-family: inherit;
  text-align: left;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: stretch;
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
.allergen-plus { font-size: 18pt; font-weight: 600; line-height: 1; }
.allergen-face {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
}
.allergen-bg, .allergen-bg-empty {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.allergen-bg-empty {
  background: #cfe8d8;
}
.allergen-veil {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, ${PHOTO_VEIL});
  print-color-adjust: exact;
  -webkit-print-color-adjust: exact;
}
.allergen-logo {
  position: absolute;
  top: 1mm;
  right: 1mm;
  z-index: 2;
  width: 3.4mm;
  height: 3.4mm;
  border-radius: 50%;
  object-fit: cover;
  opacity: 0.8;
}
.allergen-copy {
  position: absolute;
  z-index: 1;
  inset: 1.15mm 1.2mm 1.15mm 1.3mm;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 0;
  background: transparent;
  overflow: hidden;
}
.allergen-name {
  flex: none;
  font-size: ${CARD_TYPE.nameMaxPt}pt;
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.03em;
  color: #0b3f24;
  text-shadow: 0 0 0.35mm #fff, 0 0 0.9mm rgba(255,255,255,0.95);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.allergen-lines {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.12mm;
  overflow: hidden;
  font-size: ${CARD_TYPE.allergenMaxPt}pt;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: #0b3f24;
  text-shadow: 0 0 0.35mm #fff, 0 0 0.9mm rgba(255,255,255,0.95);
}
.allergen-dot {
  flex: none;
  width: 0.7em;
  line-height: 1.05;
}
.allergen-line {
  display: flex;
  gap: 0.22em;
  align-items: flex-start;
}
.allergen-line > span:last-child { min-width: 0; }
.allergen-none { font-weight: 800; }
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

/** Small glyphs that print with the card. Text carries the legal name. */
const PATHS = {
  cereal: 'M12 3c1 3 3 4 5 5-2 1-3 3-3 5 2-1 4-1 6 1-3 1-5 3-6 6-1-3-3-5-6-6 2-2 4-2 6-1 0-2-1-4-3-5-2-1-4-2-5-5 2 0 4 0 6 0z',
  crustaceans: 'M4 13c2-4 5-6 8-6s6 2 8 6c-2 1-4 1-6 0 0 3-1 5-2 6-1-1-2-3-2-6-2 1-4 1-6 0zm3-2h2m6 0h2',
  eggs: 'M12 4c4 2 6 6 6 10a6 6 0 0 1-12 0c0-4 2-8 6-10z',
  fish: 'M3 12c4-4 8-5 13-4 2 2 3 3 5 4-2 1-3 2-5 4-5 1-9 0-13-4zm11-1h.5',
  peanuts: 'M9 8c-2 2-2 5 0 7 1 1 3 1 4 0M15 8c2 2 2 5 0 7-1 1-3 1-4 0M10 8c0-2 1-4 2-4s2 2 2 4c0 2-1 3-2 3s-2-1-2-3z',
  soy: 'M8 16c-2-3-1-7 2-9 2 3 1 6-1 8 3 1 6 0 8-2-1 4-5 6-9 3z',
  milk: 'M8 4h8l-1 3v11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7L8 4zm1 6h6',
  nuts: 'M12 4c3 2 5 5 5 8a5 5 0 0 1-10 0c0-3 2-6 5-8zm0 4v8',
  celery: 'M8 20V8m4 12V5m4 15V9M7 8c2-3 3-3 5 0m-1-3c2-2 3-2 5 0',
  mustard: 'M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0v5m-3 1h6',
  sesame: 'M8 9c1-2 3-2 4 0s3 2 4 0M8 13c1-2 3-2 4 0s3 2 4 0M8 17c1-2 3-2 4 0s3 2 4 0',
  sulphites: 'M8 4h8v4l-2 2v8H10v-8L8 8V4zm0 4h8',
  lupin: 'M12 20V10m0 0c-3-1-5-4-4-6 3 0 4 2 4 6zm0 0c3-1 5-4 4-6-3 0-4 2-4 6z',
  molluscs: 'M5 15c1-6 5-9 7-9s6 3 7 9c-3 2-6 3-7 3s-4-1-7-3z',
  check: 'M5 12l4 4 10-9',
  alert: 'M12 4l8 14H4L12 4zm0 5v4m0 2.5h.01',
}

export default function AllergenGlyph({ name, className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name] || PATHS.alert} />
    </svg>
  )
}

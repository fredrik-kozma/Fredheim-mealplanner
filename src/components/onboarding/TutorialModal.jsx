import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Full-screen onboarding tutorial. Opens automatically the first time a
 * user reaches the app after signing up; replayable from Settings.
 *
 * Slides can be either:
 *   - emoji-only (icon as a big character), or
 *   - screenshot-based (real PNG dropped in /public/tutorial/, optionally
 *     overlaid with annotation circles to point at specific UI elements)
 *
 * Screenshots are entirely optional — if a file is missing the emoji
 * fallback renders instead, so the tutorial never breaks.
 *
 * To add a screenshot for any slide:
 *   1. Capture a PNG of the relevant screen.
 *   2. Save it as /public/tutorial/<slide-id>.png  (e.g. tutorial-2.png).
 *   3. Optionally crop/annotate it before saving — or use the
 *      `annotations` field below to draw circle highlights via SVG
 *      (x and y are percentages of the image dimensions).
 *
 * Props:
 *   - onClose: called when the user dismisses or completes the tour.
 *              Parent is responsible for setting hasSeenTutorial=true.
 */
export default function TutorialModal({ onClose }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [imageLoadFailed, setImageLoadFailed] = useState({})

  // Lock body scroll while the tutorial is up
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Slide content — strings come from i18n so the tour adapts to the
  // user's chosen language (EN / NO / SV). Each slide can have an
  // optional `tip` line, an optional `image` (PNG path), and optional
  // `annotations` (circles with labels pointing at UI elements in the
  // screenshot).
  //
  // Tip for screenshots: if your UI is mostly the same in EN/NO/SV,
  // one screenshot per slide is fine. If labels differ a lot, you can
  // make the image path language-aware (e.g. `/tutorial/2-${lang}.png`).
  const slides = [
    {
      id: 's1',
      icon: '🥗',
      image: '/tutorial/01-welcome.png',
      title: t('tutorial.s1.title'),
      body: t('tutorial.s1.body'),
    },
    {
      id: 's2',
      icon: '📚',
      image: '/tutorial/02-packs.png',
      annotations: [
        { x: 50, y: 12, label: t('tutorial.s2.annotation', { defaultValue: 'Tap Install to add a pack' }) },
      ],
      title: t('tutorial.s2.title'),
      body: t('tutorial.s2.body'),
      tip: t('tutorial.s2.tip'),
    },
    {
      id: 's3',
      icon: '📅',
      image: '/tutorial/03-planner.png',
      title: t('tutorial.s3.title'),
      body: t('tutorial.s3.body'),
      tip: t('tutorial.s3.tip'),
    },
    {
      id: 's4',
      icon: '🛒',
      image: '/tutorial/04-shopping.png',
      title: t('tutorial.s4.title'),
      body: t('tutorial.s4.body'),
      tip: t('tutorial.s4.tip'),
    },
    {
      id: 's5',
      icon: '👨‍👩‍👧',
      image: '/tutorial/05-settings.png',
      title: t('tutorial.s5.title'),
      body: t('tutorial.s5.body'),
    },
    {
      id: 's6',
      icon: '📊',
      image: '/tutorial/06-nutrition.png',
      title: t('tutorial.s6.title'),
      body: t('tutorial.s6.body'),
      tip: t('tutorial.s6.tip'),
    },
    {
      id: 's7',
      icon: '✨',
      image: '/tutorial/07-ready.png',
      title: t('tutorial.s7.title'),
      body: t('tutorial.s7.body'),
    },
  ]

  const isLast = index === slides.length - 1
  const slide = slides[index]

  const next = useCallback(() => {
    if (isLast) onClose()
    else setIndex(i => Math.min(slides.length - 1, i + 1))
  }, [isLast, onClose, slides.length])

  const prev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1))
  }, [])

  // Keyboard navigation: arrows, Enter, Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  const showImage = slide.image && !imageLoadFailed[slide.id]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full h-full sm:h-auto sm:max-w-md sm:max-h-[90vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Top: skip button */}
        <div className="flex items-center justify-end p-4">
          <button
            onClick={onClose}
            className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t('tutorial.skip', { defaultValue: 'Skip' })}
          </button>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-6 text-center overflow-y-auto">

          {/* Visual: real screenshot if available, otherwise emoji icon */}
          {showImage ? (
            <div className="relative w-full max-w-xs mb-6 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
              <img
                src={slide.image}
                alt=""
                className="w-full h-auto block"
                onError={() => setImageLoadFailed(s => ({ ...s, [slide.id]: true }))}
              />
              {/* Annotation overlay — circles + labels positioned by % */}
              {slide.annotations && slide.annotations.length > 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  {slide.annotations.map((a, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${a.x}%`,
                        top: `${a.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Pulsing circle */}
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" style={{ width: 36, height: 36, marginLeft: -18, marginTop: -18 }} />
                        <div
                          className="rounded-full border-4 border-emerald-500"
                          style={{ width: 36, height: 36, marginLeft: -18, marginTop: -18 }}
                        />
                      </div>
                      {a.label && (
                        <div className="absolute left-1/2 top-5 -translate-x-1/2 mt-2 bg-emerald-600 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-md">
                          {a.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-7xl mb-6 select-none" aria-hidden>
              {slide.icon}
            </div>
          )}

          <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">
            {slide.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-sm">
            {slide.body}
          </p>
          {slide.tip && (
            <div className="mt-6 inline-flex items-start gap-2 bg-emerald-50 text-emerald-800 text-sm px-4 py-2.5 rounded-xl max-w-sm">
              <span className="text-base flex-shrink-0">💡</span>
              <span className="text-left">{slide.tip}</span>
            </div>
          )}
        </div>

        {/* Dots indicator */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-emerald-600' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-white">
          <button
            onClick={prev}
            disabled={index === 0}
            className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
              index === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ← {t('tutorial.back', { defaultValue: 'Back' })}
          </button>
          <button
            onClick={next}
            className="flex-1 sm:flex-none bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors"
          >
            {isLast
              ? t('tutorial.done', { defaultValue: "Let's go" })
              : t('tutorial.next', { defaultValue: 'Next' })}
          </button>
        </div>

      </div>
    </div>
  )
}

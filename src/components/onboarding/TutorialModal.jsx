import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Full-screen onboarding tutorial. Opens automatically the first time a
 * user reaches the app after signing up; replayable from Settings.
 *
 * Self-contained: 7 slides with emoji icons, headings, body copy, and
 * (optional) practical tip lines. Mobile-first layout: full-screen on
 * phones, centered card on desktop.
 *
 * Props:
 *   - onClose: called when the user dismisses or completes the tour.
 *              Parent is responsible for setting hasSeenTutorial=true.
 */
export default function TutorialModal({ onClose }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)

  // Lock body scroll while the tutorial is up
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Slide content — strings come from i18n so the tour adapts to the
  // user's chosen language (EN / NO / SV). Each slide can have an
  // optional `tip` line displayed in a green pill at the bottom.
  const slides = [
    {
      icon: '🥗',
      title: t('tutorial.s1.title'),
      body: t('tutorial.s1.body'),
    },
    {
      icon: '📚',
      title: t('tutorial.s2.title'),
      body: t('tutorial.s2.body'),
      tip: t('tutorial.s2.tip'),
    },
    {
      icon: '📅',
      title: t('tutorial.s3.title'),
      body: t('tutorial.s3.body'),
      tip: t('tutorial.s3.tip'),
    },
    {
      icon: '🛒',
      title: t('tutorial.s4.title'),
      body: t('tutorial.s4.body'),
      tip: t('tutorial.s4.tip'),
    },
    {
      icon: '👨‍👩‍👧',
      title: t('tutorial.s5.title'),
      body: t('tutorial.s5.body'),
    },
    {
      icon: '📊',
      title: t('tutorial.s6.title'),
      body: t('tutorial.s6.body'),
      tip: t('tutorial.s6.tip'),
    },
    {
      icon: '✨',
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
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-6 text-center">
          <div className="text-7xl mb-6 select-none" aria-hidden>
            {slide.icon}
          </div>
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

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { TOUR_PATHS, MOBILE_QUERY, resolveShot, tourLang } from '../../data/introTour'

/**
 * "Welcome to Fredheim": the intro tour a new user sees once, right after
 * choosing a language, and anyone can replay from Settings.
 *
 * Real screenshots (public/tour/<lang>/<desktop|mobile>/) with the
 * highlights drawn on top rather than baked in, so they stay sharp and can
 * be moved without new images. Slides, screenshots and positions are in
 * src/data/introTour.js; the words in the locale files under `tour`.
 *
 * The first slide offers a quick start or the full tour. The last one ends
 * on a single action, chosen by the parent (`cta`): plan a week now, start
 * the free trial, or just look around.
 *
 * Props:
 *   onClose()  the tour was skipped or finished; the parent remembers it
 *   onCta()    the closing button was pressed
 *   cta        'makeWeek' | 'trial' | 'explore'
 */

const SWIPE_MIN = 50
const HIGHLIGHT = '#f97316' // orange-500: stands out against the app's indigo

function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    const mql = window.matchMedia?.(query)
    if (!mql) return
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [query])
  return matches
}

export default function IntroTour({ onClose, onCta, cta = 'explore' }) {
  const { t, i18n } = useTranslation()
  const lang = tourLang(i18n.language)
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const layout = isMobile ? 'mobile' : 'desktop'

  // null until the first slide's question is answered; the dots show the
  // quick path meanwhile.
  const [path, setPath] = useState(null)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const slides = TOUR_PATHS[path || 'quick']
  const slideId = slides[index]
  const isFirst = index === 0
  const isLast = index === slides.length - 1
  const shot = resolveShot(slideId, layout, lang)

  const dialogRef = useRef(null)
  const primaryRef = useRef(null)
  const titleId = useId()
  const bodyId = useId()

  const go = useCallback((to) => {
    const target = Math.max(0, Math.min(slides.length - 1, to))
    setDirection(target >= index ? 1 : -1)
    setIndex(target)
  }, [slides.length, index])

  const choosePath = useCallback((p) => {
    setPath(p)
    setDirection(1)
    setIndex(1)
  }, [])

  const next = useCallback(() => {
    if (isFirst) choosePath(path || 'quick')
    else if (!isLast) go(index + 1)
  }, [isFirst, isLast, path, index, go, choosePath])

  const prev = useCallback(() => { if (!isFirst) go(index - 1) }, [isFirst, index, go])

  // Lock the page behind, and give focus back to whatever had it.
  useEffect(() => {
    const before = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      if (before && typeof before.focus === 'function') before.focus()
    }
  }, [])

  // Keep focus inside the dialog: on the main button when a slide change
  // has removed whatever was focused (the path buttons, say).
  useEffect(() => {
    const active = document.activeElement
    if (!dialogRef.current?.contains(active) || active === document.body) {
      primaryRef.current?.focus({ preventScroll: true })
    }
  }, [slideId])

  // Keyboard: arrows move, Esc closes, Tab stays inside.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); return }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )]
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        // Focus that has wandered outside (a click on the backdrop) comes back in.
        if (!dialogRef.current.contains(document.activeElement)) {
          e.preventDefault()
          ;(e.shiftKey ? last : first).focus()
        } else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  // Fetch only the next slide's screenshot ahead of time.
  useEffect(() => {
    const nextId = isFirst ? TOUR_PATHS.quick[1] : slides[index + 1]
    const nextShot = nextId && resolveShot(nextId, layout, lang)
    if (nextShot) {
      const img = new Image()
      img.decoding = 'async'
      img.src = nextShot.src
    }
  }, [slides, index, isFirst, layout, lang])

  // Swipe left / right.
  const touch = useRef(null)
  function onTouchStart(e) {
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY }
  }
  function onTouchEnd(e) {
    const start = touch.current
    touch.current = null
    if (!start) return
    const p = e.changedTouches[0]
    const dx = p.clientX - start.x
    const dy = p.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx < 0) next()
    else prev()
  }

  const title = t(`tour.slides.${slideId}.title`)
  const body = slideId === 'done'
    ? t(`tour.slides.done.body_${cta}`)
    : t(`tour.slides.${slideId}.body`)
  const ctaLabel = {
    makeWeek: t('tour.ctaMakeWeek'),
    trial: t('tour.ctaTrial'),
    explore: t('tour.ctaExplore'),
  }[cta] || t('tour.ctaExplore')

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center scrim md:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative flex flex-col bg-white w-full h-full md:h-[min(92dvh,880px)] md:max-w-5xl md:rounded-card shadow-overlay overflow-hidden"
      >
        {/* Top bar: who, where, and a way out */}
        <div className="flex items-center gap-2 px-4 md:px-6 h-14 flex-shrink-0 border-b border-slate-100">
          <img src="/fredheim-logo.svg" alt="" className="w-7 h-7 rounded-full" />
          <span className="font-semibold text-slate-800 text-sm">Fredheim</span>
          <span className="text-xs text-slate-400 ml-1" aria-hidden={isFirst}>
            {!isFirst && t('tour.progress', { n: index + 1, total: slides.length })}
          </span>
          <button
            onClick={onClose}
            className="tap-target ml-auto text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-small hover:bg-slate-100 transition-colors"
          >
            {isLast ? t('tour.close') : t('tour.skip')}
          </button>
        </div>

        {/* The slide. Keyed so each one eases in from the side it came from. */}
        <div
          key={`${path}-${slideId}`}
          className="tour-slide-in flex-1 min-h-0 flex flex-col"
          style={{ '--tour-from': `${direction * 24}px` }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {shot && (
            <TourShot
              shot={shot}
              alt={t('tour.screenshotAlt', { title })}
              labelFor={key => t(`tour.slides.${slideId}.${key}`)}
              reducedMotion={reducedMotion}
            />
          )}

          <div className="flex-shrink-0 px-5 md:px-10 pt-4 pb-2 text-center max-w-2xl mx-auto w-full" aria-live="polite">
            <h2 id={titleId} className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              {title}
            </h2>
            <p id={bodyId} className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
              {body}
            </p>
            {isFirst && (
              <p className="mt-3 text-sm font-semibold text-slate-700">{t('tour.chooseTitle')}</p>
            )}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0">
          {slides.map((id, i) => (
            <button
              key={id}
              onClick={() => {
                // Jumping ahead from the first slide counts as the quick start.
                if (!path && i > 0) setPath('quick')
                go(i)
              }}
              aria-label={t('tour.goTo', { n: i + 1 })}
              aria-current={i === index ? 'step' : undefined}
              className="tap-target p-1 -m-0.5"
            >
              <span
                className={`block h-1.5 rounded-full ${reducedMotion ? '' : 'transition-all duration-300'} ${
                  i === index ? 'w-6 bg-primary-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-slate-100 flex-shrink-0 safe-area-bottom">
          {isFirst ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
              <button
                ref={primaryRef}
                onClick={() => choosePath('quick')}
                className="btn-primary btn-lg"
              >
                {t('tour.quick')}
                <span className="text-xs font-normal opacity-80">· {t('tour.quickTime')}</span>
              </button>
              <button
                onClick={() => choosePath('full')}
                className="btn-secondary btn-lg"
              >
                {t('tour.full')}
                <span className="text-xs font-normal text-slate-400">· {t('tour.fullTime')}</span>
              </button>
            </div>
          ) : isLast ? (
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-between">
              <button
                onClick={prev}
                className="tap-target text-sm font-medium px-3 py-2 rounded-small text-slate-600 hover:bg-slate-100 self-center sm:self-auto"
              >
                ← {t('tour.back')}
              </button>
              <div className="flex flex-col sm:flex-row gap-2">
                {cta !== 'explore' && (
                  <button
                    onClick={onClose}
                    className="btn-secondary btn-lg"
                  >
                    {t('tour.ctaExplore')}
                  </button>
                )}
                <button
                  ref={primaryRef}
                  onClick={cta === 'explore' ? onClose : onCta}
                  className="btn-primary btn-lg"
                >
                  {ctaLabel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prev}
                className="tap-target text-sm font-medium px-3 py-2 rounded-small text-slate-600 hover:bg-slate-100"
              >
                ← {t('tour.back')}
              </button>
              <button
                ref={primaryRef}
                onClick={next}
                className="btn-primary"
              >
                {t('tour.next')} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * A screenshot fitted into whatever room the slide leaves it, with the
 * highlights on top. Sized in JS rather than CSS because the overlay has
 * to sit on exactly the pixels the image covers, at any window shape.
 */
function TourShot({ shot, alt, labelFor, reducedMotion }) {
  const roomRef = useRef(null)
  const [size, setSize] = useState(null)
  const [failed, setFailed] = useState(false)
  const maskId = useId().replace(/:/g, '')
  const arrowId = `${maskId}-arrow`

  const [top, bottom] = shot.crop || [0, 100]
  const band = bottom - top
  const aspect = shot.width / (shot.height * band / 100)

  useLayoutEffect(() => {
    const room = roomRef.current
    if (!room) return
    function measure() {
      const { width, height } = room.getBoundingClientRect()
      if (!width || !height) return
      const w = width / height > aspect ? height * aspect : width
      setSize({ w: Math.floor(w), h: Math.floor(w / aspect) })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(room)
    return () => ro.disconnect()
  }, [aspect])

  useEffect(() => { setFailed(false) }, [shot.src])

  const W = shot.width
  const H = shot.height
  const px = x => (x * W) / 100
  const py = y => (y * H) / 100
  // Stroke widths in screenshot pixels: they scale with the picture.
  const sw = W > 1000 ? 4 : 5
  const boxes = shot.marks.filter(m => m.box)
  const labelled = boxes.filter(m => m.label && m.at)

  return (
    <div ref={roomRef} className="flex-1 min-h-0 w-full flex items-center justify-center px-3 pt-3 md:px-6 md:pt-5">
      {size && (
        <div
          className="relative overflow-hidden rounded-control md:rounded-card bg-slate-50 ring-1 ring-slate-200 shadow-card"
          style={{ width: size.w, height: size.h }}
        >
          <div
            className="absolute left-0 w-full"
            style={{ top: `${(-top / band) * 100}%`, height: `${(100 / band) * 100}%` }}
          >
            {failed ? (
              <div className="w-full h-full flex items-center justify-center">
                <img src="/fredheim-logo.svg" alt="" className="w-16 h-16 rounded-full opacity-60" />
              </div>
            ) : (
              <>
                <img
                  src={shot.src}
                  alt={alt}
                  width={W}
                  height={H}
                  decoding="async"
                  draggable={false}
                  onError={() => setFailed(true)}
                  className="block w-full h-full select-none"
                />
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 ${W} ${H}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <mask id={maskId}>
                      <rect x="0" y="0" width={W} height={H} fill="white" />
                      {boxes.map((m, i) => (
                        <rect key={i} x={px(m.box[0])} y={py(m.box[1])} width={px(m.box[2])} height={py(m.box[3])} rx={sw * 3} fill="black" />
                      ))}
                    </mask>
                    <marker id={arrowId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill={HIGHLIGHT} />
                    </marker>
                  </defs>

                  {shot.marks.filter(m => m.mask).map((m, i) => (
                    <rect key={`m${i}`} x={px(m.mask[0])} y={py(m.mask[1])} width={px(m.mask[2])} height={py(m.mask[3])} fill="white" />
                  ))}

                  {boxes.length > 0 && (
                    <rect x="0" y="0" width={W} height={H} fill="rgb(15 23 42 / 0.38)" mask={`url(#${maskId})`} />
                  )}

                  {boxes.map((m, i) => {
                    const [x, y, w, h] = [px(m.box[0]), py(m.box[1]), px(m.box[2]), py(m.box[3])]
                    return (
                      <g key={`b${i}`}>
                        <rect
                          x={x - sw} y={y - sw} width={w + sw * 2} height={h + sw * 2} rx={sw * 4}
                          fill="none" stroke={HIGHLIGHT} strokeWidth={sw * 2.5} strokeOpacity="0.45"
                          className={reducedMotion ? '' : 'tour-glow'}
                        />
                        <rect x={x} y={y} width={w} height={h} rx={sw * 3} fill="none" stroke={HIGHLIGHT} strokeWidth={sw} />
                      </g>
                    )
                  })}

                  {labelled.map((m, i) => (
                    <path
                      key={`a${i}`}
                      d={arrowPath(m, px, py, sw)}
                      fill="none"
                      stroke={HIGHLIGHT}
                      strokeWidth={sw}
                      strokeLinecap="round"
                      markerEnd={`url(#${arrowId})`}
                    />
                  ))}
                </svg>

                {labelled.map((m, i) => (
                  <span
                    key={`l${i}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 max-w-[40%] w-max text-center bg-orange-500 text-white text-2xs md:text-xs font-semibold leading-snug px-2 py-1 rounded-small shadow-raised pointer-events-none"
                    style={{ left: `${labelX(m.at[0])}%`, top: `${m.at[1]}%` }}
                    aria-hidden="true"
                  >
                    {labelFor(m.label)}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// A label is at most 40% wide, so its centre stays 21% from either edge.
function labelX(x) {
  return Math.min(79, Math.max(21, x))
}

/**
 * A gently curved arrow from a label's centre to the side of its box that
 * faces it (the label is drawn over the start, so only the tail shows).
 */
function arrowPath(m, px, py, sw) {
  const [bx, by, bw, bh] = [px(m.box[0]), py(m.box[1]), px(m.box[2]), py(m.box[3])]
  const sx = px(labelX(m.at[0]))
  const sy = py(m.at[1])
  const cx = bx + bw / 2
  const cy = by + bh / 2
  const gap = sw * 2.5
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  let ex, ey
  if (Math.abs(sx - cx) / (bw / 2) > Math.abs(sy - cy) / (bh / 2)) {
    ex = sx > cx ? bx + bw + gap : bx - gap
    ey = clamp(sy, by + bh * 0.25, by + bh * 0.75)
  } else {
    ex = clamp(sx, bx + bw * 0.2, bx + bw * 0.8)
    ey = sy > cy ? by + bh + gap : by - gap
  }
  const mx = (sx + ex) / 2
  const my = (sy + ey) / 2
  const dx = ex - sx
  const dy = ey - sy
  // Bend to one side by a fifth of the length.
  const qx = mx - dy * 0.2
  const qy = my + dx * 0.2
  return `M${sx},${sy} Q${qx},${qy} ${ex},${ey}`
}

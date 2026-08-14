import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Puts each new page at the top, and puts you back where you were when
 * you return to a list.
 *
 * React Router doesn't touch scroll position on navigation — unlike a
 * real page load, the document keeps whatever offset it had. So scrolling
 * a long way down the recipe list and opening a recipe dropped you at the
 * *bottom* of that recipe (the old offset, clamped to the shorter page),
 * which is what this fixes.
 *
 * Scrolling straight to the top on every navigation would fix that but
 * break the other direction: the detail page's back button is
 * `navigate(path)`, a forward navigation rather than browser-back, so
 * returning from a recipe would dump you at the top of the list with your
 * place lost. Hence the two behaviours:
 *
 *   - Long browsable pages remember where you were and restore it.
 *   - Everything else — recipe detail, forms, a related-recipe link —
 *     opens at the top, every time.
 *
 * Positions are held in a ref rather than the store: they're per-session
 * UI state, and persisting them would write to IndexedDB on every scroll.
 *
 * The browser's own history restoration is deliberately left alone. On a
 * real back/forward it runs after this effect and wins, so returning to a
 * half-read recipe puts you back where you were — which is what a back
 * button should do. Only in-app navigation is managed here.
 */
const RESTORE_PATHS = new Set(['/', '/planner', '/shopping', '/nutrition', '/packs', '/settings'])

const scrollY = () => window.scrollY ?? document.scrollingElement?.scrollTop ?? 0

export default function ScrollManager() {
  const { pathname } = useLocation()
  const positions = useRef(new Map())
  // Which path the scroll listener should attribute movement to. Updated
  // in the layout effect below *before* any programmatic scroll, so the
  // reset we perform is never recorded against the page we just left.
  const currentPath = useRef(pathname)

  useLayoutEffect(() => {
    const saved = positions.current.get(pathname)
    currentPath.current = pathname
    if (RESTORE_PATHS.has(pathname) && saved != null) {
      window.scrollTo(0, saved)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  useEffect(() => {
    // Record continuously rather than on unmount: by the time a route
    // effect runs the DOM already shows the new page, and the old
    // offset may have been clamped away by a shorter document.
    function onScroll() {
      if (RESTORE_PATHS.has(currentPath.current)) {
        positions.current.set(currentPath.current, scrollY())
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}

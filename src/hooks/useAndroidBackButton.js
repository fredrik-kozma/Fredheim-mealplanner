import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isNativeAndroid } from '../utils/nativePlatform'

// Topmost handler wins. A full-screen sheet pushes one so Back dismisses
// it instead of leaving the app.
const backStack = []

export function pushAndroidBackHandler(fn) {
  backStack.push(fn)
  return () => {
    const i = backStack.lastIndexOf(fn)
    if (i >= 0) backStack.splice(i, 1)
  }
}

/**
 * Android hardware/gesture back: go back inside the app's history, and only
 * leave the app from the first screen. No-op on the web.
 */
export function useAndroidBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isNativeAndroid()) return undefined
    let handle = null
    let cancelled = false
    ;(async () => {
      try {
        const { App } = await import('@capacitor/app')
        const h = await App.addListener('backButton', ({ canGoBack }) => {
          const top = backStack[backStack.length - 1]
          if (top) { top(); return }
          if (canGoBack && window.history.length > 1) navigate(-1)
          else App.exitApp()
        })
        if (cancelled) h.remove()
        else handle = h
      } catch (err) {
        console.warn('[backButton] listener failed', err)
      }
    })()
    return () => {
      cancelled = true
      handle?.remove()
    }
  }, [navigate])
}

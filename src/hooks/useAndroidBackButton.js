import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isNativeAndroid } from '../utils/nativePlatform'

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

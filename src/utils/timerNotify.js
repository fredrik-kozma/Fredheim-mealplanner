/**
 * System notifications for finished kitchen timers — the half of the alarm
 * that can reach you when the app isn't the thing on screen.
 *
 * Goes through the service worker's registration.showNotification() rather
 * than `new Notification(...)`. That is not a preference: on Android Chrome
 * the plain constructor throws "Illegal constructor" whenever a service
 * worker is in play, which this app always has (vite-plugin-pwa). The
 * constructor is kept only as a fallback for desktop browsers without a
 * registration.
 *
 * Platform reality, so nobody has to rediscover it:
 *   - Desktop Chrome / Firefox / Edge: works, including backgrounded.
 *   - Android Chrome: works, including with the screen off.
 *   - iOS Safari: only from an app installed to the Home Screen, iOS 16.4+.
 *     A notification is also the *only* way the timer reaches you there,
 *     since a locked iPhone will not play the chime.
 */

const TAG = 'fredheim-timer'

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function notificationStatus() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/**
 * Ask for permission. Must be called from inside a user gesture — Safari
 * rejects the request outright otherwise, and Chrome ignores it when the
 * page hasn't been interacted with.
 *
 * Returns the resulting status. Never throws: a browser that doesn't
 * support notifications should cost the caller nothing.
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    // Older Safari passes the result to a callback instead of resolving.
    const result = await new Promise((resolve) => {
      const maybe = Notification.requestPermission(resolve)
      if (maybe && typeof maybe.then === 'function') maybe.then(resolve, () => resolve('denied'))
    })
    return result || Notification.permission
  } catch {
    return Notification.permission
  }
}

/**
 * Post the "time's up" notification. Silent no-op unless permission has
 * actually been granted — we never prompt from here, because expiry is not
 * a user gesture.
 *
 * @param {string} title  e.g. "Timer done"
 * @param {string} body   the timer's label, or a generic line
 */
export async function notifyTimerDone(title, body) {
  if (notificationStatus() !== 'granted') return
  const options = {
    body,
    icon: '/fredheim-logo.svg',
    badge: '/fredheim-logo.svg',
    // One notification per finished timer batch rather than a growing
    // stack — `renotify` still buzzes for each new one.
    tag: TAG,
    renotify: true,
    // Keeps it on screen until acknowledged where the platform honours it,
    // matching the chime, which also repeats until dismissed.
    requireInteraction: true,
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        return
      }
    }
    new Notification(title, options)
  } catch {
    // A browser that refuses the notification shouldn't take the chime
    // (or the rest of the app) down with it.
  }
}

/** Clear any timer notification still sitting in the tray. */
export async function clearTimerNotifications() {
  try {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.getRegistration()
    if (!reg) return
    const open = await reg.getNotifications({ tag: TAG })
    open.forEach(n => n.close())
  } catch {
    // Nothing to clean up, or the browser won't say — either is fine.
  }
}

/* Service-worker half of the kitchen timer's alarm.
 *
 * Pulled into the generated Workbox service worker via
 * workbox.importScripts in vite.config.js. It lives here, hand-written in
 * plain ES5-ish script form, because generateSW owns the rest of the file
 * and there is nowhere else to hang a notificationclick listener without
 * switching the whole PWA over to injectManifest.
 *
 * Its whole job: when someone presses "Stop" on the notification, tell any
 * open copy of the app to silence the chime. The app owns the timer state;
 * this only relays the press.
 */

self.addEventListener('notificationclick', function (event) {
  var action = event.action || 'open'
  event.notification.close()

  event.waitUntil((async function () {
    var clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    for (var i = 0; i < clientList.length; i++) {
      clientList[i].postMessage({ type: 'fredheim-timer', action: action })
    }

    if (action === 'stop') {
      // Silencing an alarm shouldn't drag the app to the front — if no
      // window is open there is no chime playing anyway, and the stale
      // finished timer is cleaned up by reconcileTimers on next launch.
      return
    }

    // Tapping the body of the notification means "show me" — focus an
    // existing window, or open one.
    if (clientList.length > 0) {
      try {
        await clientList[0].focus()
        return
      } catch (err) {
        // Some browsers refuse focus(); fall through and open instead.
      }
    }
    await self.clients.openWindow('/')
  })())
})

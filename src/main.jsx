import './i18n/index.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ── Service worker: auto-reload when a new version is published ───────────────
// vite-plugin-pwa registers the SW with `registerType: 'autoUpdate'` and we set
// `skipWaiting: true` + `clientsClaim: true` in vite.config.js, so a new
// deploy takes over the page immediately. When that happens we trigger a
// one-time reload so the user is running the latest JS bundle (which is what
// has the correct VITE_SUPABASE_URL etc. baked in).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Guard against infinite reload loops
    if (window.__fredheim_sw_reloaded) return
    window.__fredheim_sw_reloaded = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

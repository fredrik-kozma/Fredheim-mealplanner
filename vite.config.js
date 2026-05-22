import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Transpile down to browsers that older iPads (Safari 13) and older
  // Android Chromes can run. Vite/esbuild handles optional chaining,
  // nullish coalescing, logical assignment, etc. for us at build time.
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome80', 'safari13'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Menu Planner',
        short_name: 'MenuPlan',
        description: 'Plan your weekly meals and generate shopping lists',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Built-in recipe packs bundle embedded photos (base64), which
        // pushes the main JS chunk past the default 2 MB precache cap.
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        // ── Force fresh service worker on every deploy ────────────────────
        // Without these flags the new SW waits for all tabs to close before
        // activating — meaning users keep running stale JS for days, which
        // breaks things like Supabase URLs that are baked in at build time.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Never cache calls to our Netlify Functions or to Supabase — these
        // must always go to the network so auth/checkout/webhook work.
        navigateFallbackDenylist: [/^\/\.netlify\/functions\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            // Supabase API calls — always go to network (NetworkOnly),
            // never cache. Stale auth tokens / endpoints are dangerous.
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Our own serverless functions — always network.
            urlPattern: /\/\.netlify\/functions\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ]
})

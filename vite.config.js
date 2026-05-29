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
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Fredheim Meal Planner',
        short_name: 'Fredheim',
        description: 'Plan your weekly meals, generate shopping lists, and discover recipes that support a healthier life.',
        // Indigo matches the in-app brand icon (fork-plate-knife on
        // indigo), so the splash screen / status-bar tint look continuous
        // with the app the user is about to open.
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          // Single SVG icon used at every size — sharp on every screen,
          // identical to the in-app corner mark. `purpose: 'any maskable'`
          // lets Android adapt it for its themed-icon system.
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
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

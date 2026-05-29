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
      includeAssets: ['fredheim-logo.svg', 'fredheim-logo.png'],
      manifest: {
        name: 'Fredheim Meal Planner',
        short_name: 'Fredheim',
        description: 'Plan your weekly meals, generate shopping lists, and discover recipes that support a healthier life.',
        theme_color: '#22B24C',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          // High-resolution SVG — primary icon. Modern browsers scale it
          // crisply at any size on every screen DPI.
          {
            src: 'fredheim-logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          // PNG fallback for browsers that ignore SVG manifest icons
          // (older Android Chrome, some iOS versions). Declared size must
          // match the actual file dimensions or the entry is ignored.
          {
            src: 'fredheim-logo.png',
            sizes: '120x120',
            type: 'image/png',
            purpose: 'any'
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

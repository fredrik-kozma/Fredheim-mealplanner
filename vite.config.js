import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// `vite build --mode android` builds the web assets for the Capacitor
// Android app (see ANDROID.md). The website build (`npm run build`) is
// unchanged by everything below.
const EXPECTED_SUPABASE_HOST = 'xpjruhkjmpwxxjhwvihj.supabase.co'

function checkAndroidEnv(env) {
  const url = (env.VITE_SUPABASE_URL || '').trim()
  const problems = []
  if (!url) problems.push('VITE_SUPABASE_URL is missing')
  else if (!url.includes(EXPECTED_SUPABASE_HOST)) {
    problems.push(`VITE_SUPABASE_URL is ${url}, expected https://${EXPECTED_SUPABASE_HOST}`)
  }
  if (!(env.VITE_SUPABASE_ANON_KEY || '').trim()) problems.push('VITE_SUPABASE_ANON_KEY is missing')
  if (!/^goog_/.test((env.VITE_REVENUECAT_ANDROID_KEY || '').trim())) {
    problems.push('VITE_REVENUECAT_ANDROID_KEY (goog_…) is missing')
  }
  if (problems.length) {
    throw new Error('Android build refused — fix .env.android.local:\n  ' + problems.join('\n  '))
  }
}

export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android'
  if (isAndroid) checkAndroidEnv(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
    // Transpile down to browsers that older iPads (Safari 13) and older
    // Android Chromes can run. Vite/esbuild handles optional chaining,
    // nullish coalescing, logical assignment, etc. for us at build time.
    build: {
      target: ['es2020', 'edge88', 'firefox78', 'chrome80', 'safari13'],
      rollupOptions: {
        output: {
          // Keep React / router separate so app updates do not force
          // phones to re-download the vendor code every time.
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
                return 'vendor-react'
              }
              if (id.includes('@supabase') || id.includes('zustand')) {
                return 'vendor-data'
              }
            }
          },
        },
      },
    },
    plugins: [
      react(),
      // No service worker inside the Android app: Capacitor serves the files
      // from the APK, and a worker would only serve stale copies after updates.
      !isAndroid && VitePWA({
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
          // The intro tour's screenshots (~80 images, 3 languages × 2
          // layouts) load only when the tour opens; never precache them.
          globIgnores: ['**/node_modules/**', 'tour/**', 'pack-images/**'],
          // Recipe photos are fetched on demand and cached at runtime
          // (see pack-images CacheFirst rule). Precaching all 285 would
          // make the first service-worker install as heavy as the old
          // base64 bundle.
          // Adds the timer's notificationclick handler to the generated
          // worker. generateSW writes the rest of this file itself, so an
          // imported script is the only place to register a listener of our
          // own short of moving the whole PWA to injectManifest.
          importScripts: ['sw-timer.js'],
          // Main JS is small again (photos are files under /pack-images/).
          // Modest headroom above Vite's default 2 MB for vendor chunks.
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
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
              // Built-in recipe photos — cache as they are viewed so the
              // recipe list stays fast offline after the first visit.
              urlPattern: /\/pack-images\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'pack-images',
                expiration: {
                  maxEntries: 400,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
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
    ].filter(Boolean)
  }
})

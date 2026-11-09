# Fredheim Android app (Capacitor)

The Android app (`no.fredheim.app`) is the same React app wrapped with
Capacitor 8. Everything native-only is behind `isNativePlatform()`
(`src/utils/nativePlatform.js`), so the website is unaffected.

## How the app behaves

- **No account needed.** People open the app and use it straight away. The
  free version is the same as for a logged-out website visitor: the recipe
  list, a free starter set of about 15 recipes (`src/data/freeRecipes.js`)
  that open in full, and a Gratis / Free filter chip on that list. Planner,
  shopping and nutrition stay locked.
- **First launch.** Once, after the language question, a full-screen sheet
  offers 14 days free, then 120 NOK/month, cancel any time in Google Play.
  The primary button buys the `trial14` offer through the same RevenueCat
  loader as the paywall (the plugin module, never the Capacitor proxy).
  "Explore free recipes" closes the sheet and turns on the Gratis
  filter. Remembered in localStorage so it does not return. Not shown when
  the person already has Premium. The sheet uses the safe-area insets.
- **Premium = Google Play subscription via RevenueCat.** RevenueCat is
  configured without an app user id (anonymous id on the device). The
  `premium` entitlement unlocks everything. The 14-day free trial is the
  Google Play free-trial offer on the subscription: tapping *Start free trial*
  opens Google's purchase sheet, Google charges nothing for 14 days and then
  bills monthly unless the person cancels in Google Play. Configure gives
  up after 15 seconds, and the paywall (and the first-launch sheet) stop
  spinning after 20 seconds and offer Try again with error code 10, instead
  of staying on "Loading subscription…" forever.
- **Restore purchases** and **Manage subscription on Google Play** are in
  Settings and in every paywall.
- **Account is optional** (Settings → Account (optional) → *Sign in to sync
  with the website*). When signed in, RevenueCat is linked to the Supabase
  user id so the webhook (`netlify/functions/revenuecat-webhook.js`) also
  marks the website account active. Signing out does not log RevenueCat out.
- No hard upgrade wall in the app; no service worker in the app.

## Configuration expected in Google Play Console / RevenueCat

- Play subscription with an auto-renewing monthly base plan and a
  **free-trial offer of 14 days** (eligibility: new customers).
- RevenueCat project: Google Play app `no.fredheim.app`, the Play subscription
  product imported, entitlement **`premium`** attached to it, and the
  **current offering** (id `default`) containing a **`$rc_monthly`** package
  that points at that subscription/base plan.
- The RevenueCat public Google SDK key (`goog_…`) goes in
  `.env.android.local` as `VITE_REVENUECAT_ANDROID_KEY`.

## Building a release bundle

Needs Node 20+, **JDK 21**, Android SDK (platform 36, build-tools 36).

```bash
cp .env.example .env.android.local   # fill in the anon key + goog_ key
npm ci
npm run build:android                # refuses to build with a wrong Supabase URL
npx cap sync android
# bump versionCode / versionName in android/app/build.gradle first
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

Signing: `android/app/build.gradle` reads a `keystore.properties`
(`storeFile`, `storePassword`, `keyAlias`, `keyPassword`) from
`$FREDHEIM_KEYSTORE_PROPERTIES`, `android/keystore.properties`, or
`C:/Users/fredr/Documents/Fredheim-signing/keystore.properties`. Never commit
the keystore or the properties file. Upload certificate SHA-256 starts
`2C:53:65:11` and ends `8B:AC`.

Version history: 1 = 1.0.0, 2 = 1.0.1 (server address fix), 3 = 1.0.2
(no login needed; Google Play trial), 4 = 1.0.3 (status-bar fix; subscribe button retries and buys the trial14 offer), 5 = 1.0.4 (free starter recipes; first-launch trial sheet; subscribe loading no longer hangs).

# Fredheim Android app (Capacitor)

The Android app (`no.fredheim.app`) is the same React app wrapped with
Capacitor 8. Everything native-only is behind `isNativePlatform()`
(`src/utils/nativePlatform.js`), so the website is unaffected.

## How the app behaves

- **No account needed.** The first time the app opens, the person has full
  access (every recipe, the planner, shopping, nutrition) for 14 days. There
  is no trial sheet and no "start trial" tap. The website is unchanged: a
  logged-out visitor still sees two preview recipes, and a Fredheim account
  keeps its own Supabase trial/subscription. A new website sign-up does
  **not** start another 14 days inside the app.
- **Trial clock.** Start is the earliest of the server row and a local copy.
  The server is `public.device_trials`, written only by the edge function
  `device-trial` (see the migration below). The local copy is Capacitor
  Preferences (`fredheim_device_trial_first_seen`), included in Android Auto
  Backup. If the server cannot be reached and nothing is stored yet, access
  is granted and the app retries. The key is SHA-256 of
  `fredheim-android-device-v1:` plus `Settings.Secure.ANDROID_ID`, read with
  `@capacitor/device` `Device.getId()` (that method returns ANDROID_ID on
  Android 8+). The raw id never leaves the device.
- **After 14 days**, without an active RevenueCat `premium` entitlement,
  premium features lock and the Google Play paywall is shown. The purchase
  is the base plan `monthly` (120 NOK/month) of `fredheim_premium`, with no
  Play offer. The app picks the subscription option whose `basePlanId` is
  `monthly` and whose `offerId` and free phase are empty, and buys it with
  `purchaseSubscriptionOption`. It falls back to `purchasePackage` only when
  that option is missing. The last 3 days show a small banner and Settings
  shows the days left, in English, Norwegian and Swedish.
- **Premium = Google Play subscription via RevenueCat.** `Purchases.configure`
  is called with `appUserID` set to the hashed device id, so the customer
  record survives uninstall/reinstall. Installs of 1.0.x that still have a
  cached anonymous id (`$RCAnonymousID:…`) call `Purchases.logIn({ appUserID })`,
  which aliases that anonymous customer onto the device id and transfers an
  active entitlement. An already-identified customer is not switched.
  Configure gives up after 15 seconds, and the paywall stops spinning after
  20 seconds and offers Try again with error code 10.
- **Restore purchases** and **Manage subscription on Google Play** are in
  Settings and in every paywall. Restore still uses the Google account, so a
  purchase can be recovered even when the RevenueCat id changed.
- **Account is optional.** Signing in does not call RevenueCat `logIn` with
  the Supabase user id, and it does not start a new trial. The Play
  subscription stays on the device id, so the webhook does not mark the
  website account active for these purchases (it already skips non-uuid
  app user ids). Signing out does not log RevenueCat out.
- No hard upgrade wall in the app; no service worker in the app.

## What has to be applied before 1.0.5 ships

Do this yourself. The agent does not run it against production.

1. **Migration** `supabase/migrations/20261110120000_device_trials.sql`
   — creates `public.device_trials` with RLS on and no client policies.
   Run it in the Supabase SQL editor or with the CLI.
2. **Edge function** `device-trial` — `supabase functions deploy device-trial`.
   It uses the service role, accepts only a 64-char hex hash, inserts on
   conflict do nothing, and returns that row's `first_seen`. The app calls
   it with the anon key. Until it is deployed, a first launch with no local
   clock is treated as offline and still gets the 14 days, then corrected
   once the function answers.
3. **Play Console.** The free-trial offer `trial14` is no longer purchased.
   Deactivate it on the `monthly` base plan of `fredheim_premium` so Play
   cannot attach it by accident. Leave the base plan at 120 NOK/month.

## Configuration expected in Google Play Console / RevenueCat

- Play subscription `fredheim_premium` with an auto-renewing **monthly** base
  plan at 120 NOK/month. No free-trial offer.
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
(no login needed; Google Play trial), 4 = 1.0.3 (status-bar fix; subscribe button retries and buys the trial14 offer), 5 = 1.0.4 (free starter recipes; first-launch trial sheet; subscribe loading no longer hangs), 6 = 1.0.5 (in-app 14-day device trial; Play purchase is the monthly base plan, not trial14).

# 🎵 PocketTube

> **A personal YouTube audio & video downloader for iOS and Android**
> Built with React Native + Expo · Render · Firebase

---

## ⚠️ Disclaimer — Personal & Learning Use Only

This project was built **strictly for personal and educational purposes**. I do not intend to distribute this app publicly, submit it to any app store, or commercialize it in any form.

Downloading YouTube content may violate [YouTube's Terms of Service (Section 5)](https://www.youtube.com/t/terms). By following this guide you accept full responsibility for how you use it. Please:

- Only download content you own or have rights to
- Never redistribute downloaded content
- Keep your deployment private — do not share your backend URL publicly
- Consider [YouTube Premium](https://www.youtube.com/premium) as the official alternative

---

## 🔒 Security Notes

These things must stay private — treat them like passwords:

| What | Why it's sensitive | Where it lives |
|---|---|---|
| `firebase-service-account.json` | Contains your RSA private key — anyone with it can impersonate your backend | `backend/` only — **never commit to git** (already in `.gitignore`) |
| `FIREBASE_SERVICE_ACCOUNT` env var | Base64 of the same private key | Render / local `.env` only |
| `.env` files | Contains local secrets | Never commit — in `.gitignore` |
| ngrok tunnel URL | Anyone who knows it can hit your backend without auth | Don't share publicly |
| Backend URL (constants.js) | Same as above | Keep the repo private or avoid hardcoding production URLs |

---

## 📖 Background

I wanted a simple way to save YouTube videos and audio to my phone for offline use — things like language learning lessons, focus music playlists, podcasts, and sleep sounds. No existing app did exactly what I wanted without ads, paywalls, or sketchy permissions.

So I built **PocketTube**: a clean personal app where I paste a YouTube link, choose the format and quality I want, and the file downloads straight to my phone — ready to play offline, no internet needed.

This repo is a learning project. It covers React Native, Expo, Google OAuth, Firebase, Docker, ngrok, and iOS distribution via TestFlight — all using free tiers where possible.

---

## 🐞 Known Issues

| Bug | Platform | What happens | Fix applied in v1.2.0 | Status |
|---|---|---|---|---|
| Audio stops on screen lock | iOS and Android | Background playback cuts out when screen locks or user switches apps | Moved `useAudioPlayer` into persistent `PlayerContext`; `staysActiveInBackground: true` set | ❌ Still broken on iOS and Android — deferred to v1.8 |
| Video shows no picture | iOS only | Downloaded video plays audio only — black screen | Forced H.264/AVC codec + `-movflags +faststart` in yt-dlp format selector | ❌ Still broken on iOS — deferred to v1.8 |

| Video shows no picture | Android | Downloaded video plays audio only — black screen | Same H.264/AVC + faststart fix | ✅ Resolved on Android in v1.2.0 |

> **Background audio is broken on both iOS and Android** — deferred to v1.8. Video playback works on Android but iOS still shows a black screen (audio only). These issues likely require deeper investigation into how `expo-audio`/`expo-video` interact with the audio session and AVFoundation on a real device build. Expo Go's sandboxed environment may be masking the root cause.

---

## ✅ Master Checklist

> **Current version: 1.3.0** · Targeting: **1.4.0** · Planned: **1.5.0, 1.6.0, 1.7.0, 1.8.0**

### v1.0.0 — Initial Build

- [x] Firebase project setup (Auth, Firestore)
- [x] Node.js backend with yt-dlp + ffmpeg (Docker)
- [x] Deploy backend to Render
- [x] React Native mobile app (Login, Download, Library, Player screens)
- [x] Expo Go setup — run on iPhone via QR code
- [x] Google OAuth client IDs configured (Web, iOS)
- [x] Playlist system — 7 default categories

### v1.1.0 — Downloads Working

- [x] Anonymous auth dev login button (`__DEV__` only, remove before TestFlight)
- [x] Fixed Firebase Admin token verification — base64 env var approach for service account
- [x] Switched yt-dlp to `android_vr` player client (bypasses YouTube bot detection JS challenge)
- [x] Local backend + ngrok tunnel workaround (Railway and Render IPs are bot-blocked by YouTube; switched from Cloudflare ad-hoc tunnel to ngrok free static domain in Sprint 2)
- [x] Fixed ffmpeg path on Windows (hardcoded path to winget-installed binary)
- [x] Fixed `expo-file-system/legacy` import (SDK 54 deprecation of `downloadAsync`)
- [x] Audio downloads working end-to-end
- [x] `app.json` version bumped to 1.1.0, `UIBackgroundModes: ["audio"]` confirmed present

### v1.2.0 — Playback Fixes & Polish

**Sprint 1 — Core Playback Fixes 🔴**
- [~] Fix audio background playback — `PlayerContext` architecture in place; **still broken on both iOS and Android** (deferred to v1.8)
- [~] Fix video playback — H.264/AVC + faststart fix applied; works on Android, **still broken on iOS** (deferred to v1.8)
- [x] Fix Firestore index error — filtering by playlist crashes with `failed-precondition`

**Sprint 2 — Remove Local Desktop Dependency 🟡**
- [x] Permanent tunnel URL via ngrok free static domain — `constants.js` never needs updating after a restart

**Sprint 3 — UX Improvements 🟠**
- [x] Speed selector: replaced cycle button with a modal list (jump directly to any speed)
- [x] Empty library state — shows 📭 guidance when no files downloaded yet (already implemented in LibraryScreen.js)

**Sprint 3b — Audio Player Completeness 🟠**
- [x] Lock screen / Control Center controls — best-effort via `player.setNowPlayingInfo` in `PlayerContext`; audio session stays active in background
- [x] Mini-player bar — persistent `MiniPlayer` component floats above tab bar; shows progress bar, play/pause, and next-track button
- [x] Previous / Next buttons in the audio player — driven by queue in `PlayerContext`; auto-advance on track end also wired up

**Sprint 4 — Stability & Polish 🟢**
- [x] Partial download cleanup — `_cleanPartials()` in `ytdlp.js` deletes `.part` / intermediate files on any yt-dlp failure
- [x] Add troubleshooting entries: Firestore index fix, ffmpeg PATH on Windows, ngrok static domain setup
- [x] Commit all v1.1.0 changes to git (`git add -A && git commit -m "v1.1.0: downloads working, local backend, anonymous auth"`)

### v1.3.0 — Distribution (No Apple Dev Account) *(current)*

> **Goal:** Let people actually install and use the app on their phones — Android via a sideloadable APK, iPhone via a browser-based PWA. No Apple Developer account required. Google Sign-In works in both tracks.

**Track 1 — Android APK ✅ Complete**
- [x] Set up EAS Build (free tier) — `eas build:configure` in `mobile/`; EAS project linked as `@ivibudh/pockettube`
- [x] Created Android keystore via `eas credentials --platform android` → profile `pockettube-android-preview`; keystore managed by EAS
- [x] Registered Android OAuth client in Google Cloud Console — package `com.pockettube.app` + SHA-1 from EAS keystore
- [x] Added Android app to Firebase project → downloaded `google-services.json` → added to `mobile/` and referenced in `app.json`; gitignored to keep API key out of version control
- [x] Switched Google Sign-In from `expo-auth-session` (browser-based, blocked by Google's redirect URI policy) to `@react-native-google-signin/google-signin` (native Android SDK — no redirect URI needed, verified by package name + SHA-1)
- [x] Removed anonymous dev login button from `LoginScreen.js`
- [x] Generated APK via `eas build --platform android --profile preview` (build #3)
- [x] Google Sign-In confirmed working end-to-end on real Android device ✅
- [x] APK available for sideloading — see **Install App on Android** section below

**Track 2 — iPhone PWA** *(moved to v1.7.0)*

> iPhone PWA support has been deferred to v1.7.0 to allow backend stability and security work (v1.4.0), sidebar & stats (v1.5.0), and Stripe payments (v1.6.0) to land first.

### v1.4.0 — Backend Auto-Start & Security Hardening

> **Goal:** Eliminate the manual startup ritual — the backend and ngrok tunnel should start automatically when the PC boots. Simultaneously harden the backend against abuse and common vulnerabilities, since the ngrok URL is the only thing standing between the open internet and your yt-dlp process.

**Sprint 1 — Windows Auto-Start 🔴**
- [ ] Create `backend/start-backend.bat` — launches `node src/index.js` from the correct directory; writes stdout/stderr to a dated log file in `backend/logs/` so you can inspect what happened on boot
- [ ] Create `backend/start-ngrok.bat` — runs `ngrok http --domain=tropics-proton-unbitten.ngrok-free.dev 8080`; also logs output
- [ ] Register both scripts with **Windows Task Scheduler** to run at user logon (trigger: "At log on" → run whether user is logged on or not → highest privileges)
  - Task 1: `PocketTube-Backend` — runs `start-backend.bat`
  - Task 2: `PocketTube-ngrok` — runs `start-ngrok.bat` with a 5-second delay after Task 1 to let the backend bind its port first
- [ ] Add a 30-second health-check loop inside `start-ngrok.bat` — polls `http://localhost:8080/health` before starting ngrok; exits with an error log entry if the backend never comes up
- [ ] Test on a clean reboot — verify both processes are running without opening any terminal
- [ ] (Optional) Add a system tray PowerShell script or use [WinSW](https://github.com/winsw/winsw) to wrap the backend as a proper Windows Service for more reliable lifecycle management

**Sprint 2 — Security Hardening 🟡**
- [ ] Install and wire up `helmet` middleware — sets secure HTTP response headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.) with a single `app.use(helmet())`
- [ ] Install and configure `express-rate-limit` — apply a per-IP rate limit on all `/api/*` routes (e.g. 30 requests per 15 minutes) to prevent abuse if the ngrok URL ever leaks
- [ ] Fix command injection risk in `ytdlp.js` — replace all shell string interpolation (`exec(\`yt-dlp ... '${url}'\`)`  ) with argument arrays passed to `execFile` or `spawn` so user-supplied URLs can never escape the argument boundary
- [ ] Validate and sanitize all incoming request body fields — `url` must match a YouTube URL regex; `format` must be exactly `'audio'` or `'video'`; `resolution` must be an allowlisted string (`'720p'`, `'1080p'`, etc.); reject anything else with 400
- [ ] Run `npm audit --audit-level=high` inside `backend/` and resolve all high and critical findings; document any accepted low/moderate risks
- [ ] Add startup env-var validation — on `index.js` load, assert that `FIREBASE_SERVICE_ACCOUNT` and `PORT` are present and non-empty; log a clear error and `process.exit(1)` if missing (fail-fast instead of silent auth failures)
- [ ] Review Firestore security rules — confirm the published rules allow only `request.auth.uid == userId` reads and writes; add a deny-all fallback at the root level
- [ ] Rotate the Firebase service account key — generate a new key in Firebase Console, update `FIREBASE_SERVICE_ACCOUNT` in `backend/.env`, delete the old key from Firebase Console
- [ ] Harden the `/health` endpoint — return only `{ status: 'ok' }`; remove any version, environment name, or dependency info that could fingerprint the server
- [ ] Add `.env` to a pre-commit git hook check — confirm it is in `.gitignore` and has never been staged; use `git secrets` or a simple pre-commit shell script

### v1.5.0 — Sidebar, User Stats & Recommendations Feed

> **Goal:** Replace the basic tab bar with a rich side drawer that serves as the app's control centre — account info, navigation, plan status, upgrade CTA, and user stats all in one place. Alongside this, add a Recommendations feed on the Download screen so users always have fresh content to grab.

**Sprint 1 — Sidebar Navigation & Account 🔴**
- [ ] Install `@react-navigation/drawer` and `react-native-gesture-handler` / `react-native-reanimated` (required peer deps)
- [ ] Wrap the root navigator in a `DrawerNavigator`; keep the bottom tab bar for Download and Library but open the drawer via a hamburger icon in the header
- [ ] Sidebar header: display Google profile photo, display name, and email pulled from `auth.currentUser`
- [ ] Sidebar nav links: **Download** and **Library** — highlight the active screen
- [ ] **Sign Out** button at the bottom of the sidebar — calls `signOut(auth)` and navigates back to `LoginScreen`
- [ ] Plan badge next to the user name: teal **Pro** pill or grey **Free** pill — read from `users/{uid}/meta/plan` in Firestore (default `free` if document doesn't exist)
- [ ] **Upgrade to Pro →** CTA row shown only to Free users — placeholder alert for now ("Coming in v1.6.0"); will wire to Stripe in v1.6.0

**Sprint 2 — User Stats Dashboard 🟡**
- [ ] On first sign-in write `memberSince: serverTimestamp()` to `users/{uid}/meta/stats` (only if the document doesn't already exist — use `setDoc` with `{ merge: true }`)
- [ ] Increment `totalDownloads`, `audioDownloads`, `videoDownloads` counters in `users/{uid}/meta/stats` on every successful download (use Firestore `increment()`)
- [ ] Track `totalPlaybackMinutes` — on `PlayerScreen` unmount, add elapsed seconds / 60 to the counter via `increment()`
- [ ] Track `lastActiveAt` — update to `serverTimestamp()` whenever the app comes to the foreground (use `AppState` listener in `App.js`)
- [ ] Track `favoritePlaylists` — store a map of `{ [playlistName]: downloadCount }` and increment the relevant key on each download
- [ ] Add a **Stats** section at the bottom of the sidebar showing:
  - 📅 Member since (formatted date)
  - 📥 Total downloads (audio + video split)
  - ▶️ Total playback time (hours and minutes)
  - 🎵 Most downloaded playlist
  - 📆 Days since first use

**Sprint 3 — Recommendations Feed 🟠**
- [ ] Add a **"For You"** tab/section below the URL input on the Download screen (toggle between "Download" and "For You" views)
- [ ] On each successful download, save `channelName` and `playlist` category to `users/{uid}/meta/stats.channels` map (channel → count) and `stats.recentTags` array (last 20 title keywords, stripped of stop words)
- [ ] Backend: add `GET /api/recommendations` route — accepts `channels[]` and `tags[]` query params; uses `yt-dlp --flat-playlist --dump-json` to fetch the latest 5 uploads from each of the top 3 channels; returns an array of `{ videoId, title, channel, thumbnailUrl, duration, url }` objects
- [ ] Mobile: on "For You" tab open, call `/api/recommendations` with the user's top channels; show a scrollable `FlatList` of video cards (thumbnail, title, channel, duration)
- [ ] Tapping a recommendation card pre-fills the URL input and switches to the Download view — user still chooses format and confirms
- [ ] Empty state: "Download a few videos first and we'll suggest more from your favourite channels 🎵" — shown when `channels` map is empty

---

### v1.6.0 — Stripe Payments

> **Why Stripe and not Apple StoreKit / Google Play Billing:** Because PocketTube is distributed as a sideloaded APK and a PWA — not through the App Store or Play Store — neither platform can enforce their payment rules or take their 15–30% cut. Stripe charges a flat 2.9% + 30¢ per transaction with no monthly fee, has a free sandbox for development, and its hosted Checkout page means you build no payment UI at all.

**Sprint 1 — Backend: Stripe Integration 🔴**
- [ ] Create a free Stripe account at stripe.com — get test API keys from the dashboard
- [ ] Add `stripe` npm package to `backend/` — `npm install stripe`
- [ ] Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `backend/.env` and Render env vars
- [ ] Add `POST /api/payments/create-checkout-session` route — creates a Stripe Checkout session for the $9.99 Pro plan and returns the session URL
- [ ] Add `POST /api/payments/webhook` route — listens for `checkout.session.completed` event and updates `plan: 'pro'` in Firestore for the relevant user
- [ ] Register the webhook endpoint in the Stripe dashboard (use ngrok URL for local testing)
- [ ] Test the full payment flow end-to-end in Stripe test mode

**Sprint 2 — Frontend: Upgrade Flow 🟡**
- [ ] Add plan status read from Firestore on app launch — stored under `users/{uid}/meta/plan`
- [ ] Wire the v1.5.0 sidebar "Upgrade to Pro →" CTA to call `/api/payments/create-checkout-session` → redirect to Stripe Checkout URL (browser on PWA; external browser on Android APK)
- [ ] Add success and cancel redirect pages — success page confirms upgrade and links back to the app
- [ ] Enforce Free plan cap (10 stored files) — show upgrade prompt when limit is reached
- [ ] Update sidebar plan badge from Free → Pro after successful payment (Firestore listener already in place from v1.5.0)
- [ ] Test upgrade flow on both PWA (iPhone) and Android APK

### v1.7.0 — iPhone PWA

> **Goal:** Let iPhone users install PocketTube to their home screen without an Apple Developer account. iOS Safari cannot access files the app previously saved to device storage, so playback works by streaming from the backend (your PC must be on) or by letting the user pick a file from the Files app manually.

**Sprint 1 — Web App Scaffold 🔴**
- [ ] Create a `web/` folder at the repo root — `npm create vite@latest web -- --template react` (or plain HTML/JS if preferred)
- [ ] Reuse the existing Firebase config from `mobile/src/firebase.js` — copy into `web/src/firebase.js`
- [ ] Implement Google Sign-In via `signInWithPopup` / `signInWithRedirect` using the web OAuth client ID — no redirect URI restrictions apply for `https://` hosted pages
- [ ] Point API calls at the same `BACKEND_URL` (`constants.js` / `.env`) used by the Android app

**Sprint 2 — Download & Playback 🟡**
- [ ] Download flow: paste URL → call `/api/info` for metadata → call `/api/download` → poll `/api/status` → trigger a browser `<a download>` so the file lands in iPhone Files/Downloads
- [ ] Audio player — HTML5 `<audio>` element with play/pause, seek bar, and speed selector (0.5×–2×); wire up the [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) for lock screen / Control Center controls
- [ ] Video player — HTML5 `<video>` with native controls and full-screen support
- [ ] File picker fallback — `<input type="file" accept="audio/*,video/*">` so the user can load a previously saved file from Files app for offline playback

**Sprint 3 — PWA & Deploy 🟢**
- [ ] Add `manifest.json` with app name, icons (192×192, 512×512), `display: standalone`, and `start_url` — makes Safari show the "Add to Home Screen" banner
- [ ] Add a service worker for basic shell caching (app shell only — media files are too large for cache storage)
- [ ] Deploy to Vercel or Netlify free tier — permanent `https://` URL, no server needed
- [ ] Test on iPhone: visit URL in Safari → "Add to Home Screen" → open app → sign in → download a file → play it back

### v1.8.0 — iOS Platform Fixes

**iOS-specific bugs that were not resolved by the v1.2.0 fixes. Require deeper investigation on a real device build (not Expo Go).**

- [ ] Fix background audio on iOS and Android — investigate `expo-audio` AVAudioSession (iOS) and audio focus (Android) interaction with Expo Go; likely needs a custom EAS build to test properly
- [ ] Fix video playback on iOS — investigate `expo-video` / AVFoundation codec compatibility; check whether H.265/HEVC or container issues are the root cause on device

> Deferred from v1.2.0. Background audio is broken on both iOS and Android; iOS video still shows black screen (audio only). Both issues likely require a custom EAS build to diagnose — Expo Go's sandbox masks the root cause.

---

## 📲 Install App on Android

> Sideload the APK directly onto any Android phone — no Play Store, no account needed.

**Scan the QR code below with your Android phone's camera, or open the link:**

<p align="center">
  <img src="docs/assets/qr-android.png" alt="QR code — PocketTube Android APK download" width="220"/>
</p>

🔗 [Download APK — build #3 (v1.3.0)](https://expo.dev/accounts/ivibudh/projects/pockettube/builds/fa3e5af0-6fbb-47eb-8eb4-96df495feed4)

**Steps to install:**
1. Open the link above on your Android phone and download the `.apk` file
2. Go to **Settings → Security** (or Apps, depending on manufacturer) → enable **"Install from unknown sources"** for your browser or Files app
3. Tap the downloaded `.apk` file to install
4. Open PocketTube and sign in with your Google account

> ⚠️ If you see a warning like "App not installed" or "Blocked by Play Protect", tap **"Install anyway"** — this is expected for sideloaded APKs that aren't from the Play Store.

---

## 📦 How to Build the Android APK

> Run these from inside the `mobile/` folder. EAS builds happen in the cloud — your machine just needs to upload the code.

### First-time setup (already done — notes for reference)

| Step | What was done |
|---|---|
| EAS project | `eas login` + `eas build:configure` → linked to `@ivibudh/pockettube` |
| Android keystore | `eas credentials --platform android` → profile `pockettube-android-preview`; managed by EAS |
| Google OAuth (Android) | Created Android client in Google Cloud Console with package `com.pockettube.app` + SHA-1 from EAS keystore |
| Firebase Android app | Added Android app in Firebase console → downloaded `google-services.json` → placed in `mobile/` |
| Google Sign-In SDK | Installed `@react-native-google-signin/google-signin`; configured with web client ID in `LoginScreen.js` |

### Building a new APK

```bash
# 1. Bump versionCode in mobile/app.json (must increment every build)
#    "versionCode": <current + 1>

# 2. Commit your changes
git add -A
git commit -m "vX.X.X: description of changes"

# 3. Trigger the cloud build
cd mobile
eas build --platform android --profile preview
```

The build takes ~10–15 minutes. EAS provides a link to monitor progress and download the APK when done.

### Installing the APK on an Android device

1. Download the `.apk` from the EAS build page
2. Send it to the device (email, Google Drive, USB)
3. On the device: Settings → Security → enable **"Install from unknown sources"** for the browser or Files app
4. Tap the downloaded `.apk` to install

### What `google-services.json` is and why it's gitignored

`google-services.json` contains a Firebase API key tied to the Android app. It is intentionally excluded from git (see `mobile/.gitignore`). EAS builds work without it being committed because the Android OAuth client is verified by **package name + SHA-1 fingerprint** (not by the file itself). Keep a copy of `google-services.json` locally — if you lose it, re-download it from Firebase Console → Project Settings → Your Apps → Android app.

### Troubleshooting Google Sign-In on Android

| Symptom | Cause | Fix |
|---|---|---|
| `DEVELOPER_ERROR` on sign-in | SHA-1 fingerprint mismatch | Re-run `eas credentials --platform android` → verify the SHA-1 matches what's in Google Cloud Console → Android OAuth client |
| Sign-in cancelled immediately | Google Play Services not available | Test on a real Android device, not an emulator without Play Services |
| `No ID token returned` | webClientId mismatch | Verify `webClientId` in `LoginScreen.js` matches the **Web** client ID (not Android) in Google Cloud Console |

---

## 🚀 Daily Startup Guide

> **v1.1.0 requires 3 terminals every session.** Sprint 2 is complete — the ngrok URL is now permanent so no more copy-pasting. Will reduce to 0 terminals once Sprint 3.2 (TestFlight build) is done.

**Step 1 — Start the backend** (Terminal 1, inside `backend/`)
```bash
cd path/to/PocketTube/backend
node src/index.js
```
You should see: `PocketTube backend running on port 8080`

**Step 2 — Start the ngrok tunnel** (Terminal 2, anywhere)
```bash
ngrok http --domain=tropics-proton-unbitten.ngrok-free.dev 8080
```
Wait a few seconds until you see `Forwarding` in the output. The URL is always the same — no copy-paste needed.

> ✅ **Sprint 2 complete — this URL never changes.** `constants.js` is already set and never needs updating again.

**Step 3 — Start Expo** (Terminal 3, inside `mobile/`)
```bash
cd path/to/PocketTube/mobile
npx expo start
```
Scan the QR code with Expo Go on your iPhone.

> 💡 **Port conflict?** If the backend fails to start with `EADDRINUSE`, run `npx kill-port 8080` first.

---

## ⚠️ Known Limitations

These are not bugs — they are current constraints of the v1.1.0 build. Each one has a fix planned in v1.2.0.

| Limitation | Status | Planned Fix |
|---|---|---|
| Google Sign-In blocked in Expo Go | Google rejects `exp://` redirect URIs | v1.3.0 — EAS Build + TestFlight |
| Video player shows audio only (iOS) | iOS AVFoundation / expo-video codec issue | v1.8 investigation |
| Audio stops on screen lock (iOS and Android) | Audio session behaviour in Expo Go | v1.8 investigation |
| ~~Video player shows audio only (Android)~~ | ~~yt-dlp format merge issue~~ | ✅ Fixed in v1.2.0 — H.264 + faststart |
| ~~No lock screen / Control Center controls~~ | ~~NowPlayingInfo not wired up~~ | ✅ Fixed in v1.2.0 — wired via PlayerContext |
| ~~Speed selector cycles one-by-one~~ | ~~No modal picker yet~~ | ✅ Fixed in v1.1.0 |
| Filtering by playlist crashes the Library screen | Missing Firestore composite index | Sprint 1.3 |
| Backend requires your computer to be on and running | Local desktop dependency | Future VPS migration |
| ~~Tunnel URL changes every restart~~ | ~~Ad-hoc Cloudflare tunnel~~ | ✅ Fixed in Sprint 2 — switched to ngrok free static domain |
| No mini-player — leaving Player screen stops audio | State not lifted to context | Sprint 3b |

---

## 📋 Changelog

### v1.3.0 *(2026-05-12)*
- Set up EAS Build for Android; keystore managed by EAS under profile `pockettube-android-preview`
- Added Android app to Firebase; `google-services.json` gitignored (kept local, not committed)
- Switched Google Sign-In to `@react-native-google-signin/google-signin` native SDK — replaces `expo-auth-session` browser-based flow which was rejected by Google's OAuth 2.0 redirect URI policy
- Android OAuth client registered in Google Cloud Console (package `com.pockettube.app` + SHA-1)
- Removed anonymous dev login button from `LoginScreen.js`
- Google Sign-In confirmed working end-to-end on real Android device (build #3) ✅

### v1.2.0 *(2026-05-10)*
- Switched tunnel from Cloudflare ad-hoc to ngrok free static domain — `constants.js` URL is now permanent
- Fixed Firestore `failed-precondition` crash when filtering Library by playlist (client-side sort workaround)
- Applied fixes for background audio and video picture (under investigation — not yet resolved on device)

### v1.1.0 *(2026-05-03)*
- Downloads working end-to-end (audio confirmed)
- Switched to local backend + Cloudflare ad-hoc tunnel (Railway and Render IPs blocked by YouTube)
- Switched yt-dlp player client to `android_vr` to bypass JS challenge
- Fixed Firebase Admin token verification — base64 env var for service account
- Fixed `expo-file-system/legacy` import (SDK 54 deprecation)
- Fixed ffmpeg path on Windows (hardcoded winget install path)
- Added anonymous auth dev login button (visible in `__DEV__` mode only)
- Bumped version to 1.1.0 in `app.json` and `LoginScreen.js`

### v1.0.0 *(2026-04-28)*
- Initial build: Firebase Auth + Firestore, Node.js backend with yt-dlp + Docker
- React Native mobile app with Login, Download, Library, and Player screens
- Expo Go setup for running on iPhone without a build step
- Google OAuth client IDs configured (Web + iOS)
- 7-category playlist system
- Async job architecture: download → poll → fetch → save locally

---

## ✨ Features

### 🔐 Authentication
- Sign in with your Google account — no separate username or password needed
- Your library and preferences are tied to your Google account and persist across devices
- Side menu includes a **sign-out** option and basic account info (profile photo, email)

### 📥 Downloading Content
- Paste any YouTube URL to bring up download options
- **Audio download** — saves the MP3, the video's cover image (thumbnail), and metadata (title, channel name, upload date, duration, source URL)
- **Video download** — choose from available resolutions (e.g. 720p, 1080p) depending on what the source video supports; saves the video file, cover image, and the same metadata as audio
- All files are saved locally to your device for true offline playback — no streaming required
- A **progress bar** is displayed during the download showing percentage complete and estimated time; the download continues running in the background so the user can browse their library or use other apps while waiting
- **Duplicate detection** — if the pasted URL has already been downloaded, the app shows a warning before proceeding. The warning displays the existing file's details (audio or video, resolution if applicable, date downloaded) and asks the user to confirm before downloading again

### 🎵 Media Player
The media player is a core part of the app — both audio and video files should have a full-featured playback experience once downloaded.

**Audio player**
- Displays the cover image (thumbnail), track title, and channel/artist name
- Play / Pause button
- Seek bar with current position and total duration
- Volume control
- Playback speed selector (0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×) — useful for podcasts and language learning content
- Previous / Next buttons to move through the library or playlist
- Shuffle and Repeat toggles *(TBD)*
- **Background playback** — audio continues when the screen locks or the user switches apps
- **Lock screen / Control Center controls** on iOS (Now Playing widget) and Android (media notification) — play, pause, seek, skip
- Persistent **mini-player bar** at the bottom of the screen while browsing the library, so the user never has to leave a screen to control playback

**Video player**
- Full-screen video display with native transport controls (play/pause, seek, volume)
- Portrait and landscape orientation support
- Playback speed selector *(TBD)*
- Returns to library on close without interrupting any background audio

### 📱 Library
- Browse all downloaded files in a clean list view showing cover image, title, file type, resolution (for video), and date downloaded
- *(TBD)* Sort by title, date downloaded, or file type
- *(TBD)* Search by title or channel name
- *(TBD)* Show total local storage used by PocketTube

### 🗑️ Managing Your Library
- Delete any previously downloaded file to free up space on your device

### 💳 Plans & Upgrades
- A **side menu** button shows the user's current plan at a glance (Free or Pro)
- **Free plan** — the user can store a maximum of **10 files** on their device at any one time; to add more, they must delete existing files or upgrade
- **Pro plan** — one-time payment of **$9.99 + applicable taxes**, no subscription; Pro users have no limit on total stored files but are capped at **10 new downloads per day** to stay within backend resource limits
- Plan status is stored in Firestore and verified on app launch

> 💳 **Payment implementation planned for v1.6.0 via Stripe.** Because PocketTube distributes as a sideloaded APK and a PWA — not through the App Store or Play Store — neither Apple StoreKit nor Google Play Billing is required. Stripe handles the full payment flow at 2.9% + 30¢ per transaction (no monthly fee, no platform cut). Stripe Checkout is a hosted payment page: the backend creates a session, the app redirects the user there, and a webhook updates Firestore when payment completes.

### 🗂️ Playlists *(tentative — may not be included in v1)*
- Optionally organize downloads into playlist categories: Music, Podcasts, Sleep, Focus, Language, Videos, General

### ☁️ Infrastructure
- Metadata synced to Firestore across devices
- Runs entirely on free tiers (payment processing fees apply only when Stripe is active in v1.4.0)

---

## 🏗️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Mobile App | React Native + Expo | Free |
| Authentication | Firebase (Google Auth) | Free tier |
| Database / Metadata | Firebase Firestore | Free tier |
| File Storage | Device-local only (no cloud storage) | Free |
| Download Engine | yt-dlp + Node.js backend | Free |
| Cloud Hosting | Render.com | Free tier (750 hrs/month) |
| Payments | Stripe Checkout *(v1.6.0)* | 2.9% + 30¢ per transaction — no platform cut (not distributed via App Store / Play Store) |
| iOS Distribution | TestFlight (personal) | $99/yr — Apple Dev account |

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    iPhone (Expo Go)                      │
│                                                          │
│  LoginScreen → Google/Anonymous Auth via Firebase        │
│  DownloadScreen → paste URL → pick format                │
│  LibraryScreen → browse local files by playlist          │
│  PlayerScreen → play audio/video from device storage     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Firebase ID token in header)
                       ▼
┌─────────────────────────────────────────────────────────┐
│           Cloudflare Tunnel (trycloudflare.com)          │
│  Proxies HTTPS traffic to localhost:8080 on your PC      │
└──────────────────────┬──────────────────────────────────┘
                       │ localhost
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Local Backend (Node.js / Express)           │
│                                                          │
│  POST /api/info     → yt-dlp --dump-json (metadata)      │
│  POST /api/download → yt-dlp download job (async)        │
│  GET  /api/status   → poll job progress                  │
│  GET  /api/file     → stream file → phone → save locally │
│                                                          │
│  Auth middleware: verifies Firebase ID token via          │
│  Firebase Admin SDK (FIREBASE_SERVICE_ACCOUNT env var)   │
└──────────────────────┬──────────────────────────────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
            yt-dlp        ffmpeg
         (download)      (convert)
```

**Key design decisions:**
- No cloud file storage — files go straight from backend `/tmp` to the phone's local storage
- Async job pattern — download starts immediately, mobile polls for progress, fetches when done
- Local backend only — cloud hosting IPs (Railway, Render) are bot-blocked by YouTube
- Firebase used only for Auth token verification on the backend; all media metadata is in Firestore on the client side

> See `SYSTEM_DESIGN.md` for a full interview-style breakdown with ADRs for each decision.

---

## 🗺️ Action Plan

| Phase | Goal | Est. Time |
|---|---|---|
| [Phase 1](#phase-1--firebase-setup) | Firebase project, Auth, Firestore, Storage | Day 1 |
| [Phase 2](#phase-2--backend-server) | Node.js backend with yt-dlp + Docker | Days 1–2 |
| [Phase 3](#phase-3--deploy-to-render) | Deploy backend to Render (free) | Day 2 |
| [Phase 4](#phase-4--react-native-mobile-app) | Full mobile app — Login, Download, Library, Player | Days 3–7 |
| [Phase 5](#phase-5--run-on-your-phone-with-expo-go) | Install Expo Go and run app on your phone | Day 8 |
| [Phase 6](#phase-6--google-oauth-client-ids) | Wire up Google OAuth client IDs | Day 8 |
| [Phase 7](#phase-7--playlist-system) | Playlist system and auto-categorization | Day 9 |

---

## 🧰 Prerequisites

Before you start, create these free accounts and install these tools.

### Accounts to Create

| Service | URL | Purpose |
|---|---|---|
| Google Firebase | firebase.google.com | Auth, database, file storage |
| Render | render.com | Backend hosting |
| Expo (EAS) | expo.dev | Mobile app builds |
| Apple Developer | developer.apple.com | TestFlight ($99/yr) |
| GitHub | github.com | Version control |

### Install on Your Computer

- **Node.js v18+** — nodejs.org
- **Python 3.10+** — python.org
- **Git** — git-scm.com
- **Railway CLI** — `npm install -g @railway/cli`
- **Expo CLI + EAS CLI** — `npm install -g expo-cli eas-cli`
- **yt-dlp** — `pip install yt-dlp`
- **ffmpeg** — ffmpeg.org
- **VS Code** or any code editor

> 💡 Create a folder called `pockettube/` on your Desktop. Everything lives inside it.

### Environment Variables Reference

All configuration values used across the project in one place:

| Variable | Location | Purpose | How to get it |
|---|---|---|---|
| `PORT` | `backend/.env` | Port the Express server listens on | Set to `8080` |
| `FIREBASE_SERVICE_ACCOUNT` | `backend/.env` / Render env | Base64-encoded Firebase service account JSON | Run: `node -e "console.log(Buffer.from(JSON.stringify(require('./firebase-service-account.json'))).toString('base64'))"` in `backend/` |
| `BACKEND_URL` | `mobile/src/constants.js` | URL the mobile app sends requests to | Your Cloudflare Tunnel URL (changes each restart until Sprint 2) |
| `EXPO_CLIENT_ID` | `mobile/src/screens/LoginScreen.js` | Google OAuth web client ID | Google Cloud Console → APIs & Services → Credentials |
| `IOS_CLIENT_ID` | `mobile/src/screens/LoginScreen.js` | Google OAuth iOS client ID | Same as above |
| `ANDROID_CLIENT_ID` | `mobile/src/screens/LoginScreen.js` | Google OAuth Android client ID | Same as above (not yet configured) |

### Project Structure

```
pockettube/
  backend/          ← Node.js API + yt-dlp
  mobile/           ← React Native Expo app
```

---

## Phase 1 — Firebase Setup

> **Summary:** Firebase is your free backend-as-a-service layer. It handles user sign-in via Google, stores your playlist and file metadata in Firestore, and keeps your downloaded files in cloud storage. The entire setup is done through the Firebase web console — no code yet.

---

### Step 1.1 — Create a Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com) and sign in with your Google account
2. Click **"Create a project"** → name it `pockettube`
3. Disable Google Analytics (not needed) → click **"Create project"**
4. Once created, click **"Continue"**

---

### Step 1.2 — Enable Google Authentication

1. In the left sidebar click **Build → Authentication**
2. Click **"Get started"**
3. Under the **Sign-in method** tab, click **Google**
4. Toggle the **Enable** switch ON
5. Enter your email as **"Project support email"**
6. Click **Save**

---

### Step 1.3 — Create Firestore Database

1. In sidebar click **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → Next
4. Select a Cloud Firestore location closest to you (e.g. `us-central`)
5. Click **"Enable"**
6. Once created, go to the **Rules** tab and replace the contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

7. Click **Publish**

---

### Step 1.4 — Create Firebase Storage *(optional — not used by the backend)*

> The backend no longer uploads files to Firebase Storage. Media files are served directly from the server to your phone and stored locally on device. You can skip this step entirely.
>
> If you later decide to add cross-device sync or cloud backup, come back and set this up then.

<details>
<summary>Setup instructions (if needed in future)</summary>

1. In sidebar click **Build → Storage**
2. Click **"Get started"** → **"Next"** → **"Done"**
3. Go to the **Rules** tab and replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

4. Click **Publish**

</details>

---

### Step 1.5 — Get Your Firebase Config Keys

1. Click the ⚙️ icon next to **"Project Overview"** → **"Project settings"**
2. Scroll to **"Your apps"** → click the **`</>`** (web) icon
3. Name it `pockettube-web` → click **"Register app"**
4. Copy the `firebaseConfig` object — you'll need it in Phase 4
5. Go to the **Service accounts** tab → **"Generate new private key"** → save as `firebase-service-account.json` (keep this secret — never commit it!)

---

### ✅ Phase 1 Checklist

- [ ] Firebase project created named `pockettube`
- [ ] Google Authentication enabled
- [ ] Firestore database created with security rules published
- [ ] Firebase Storage — skip (not used; see Step 1.4 if needed later)
- [ ] `firebaseConfig` object copied and saved somewhere safe
- [ ] `firebase-service-account.json` downloaded and stored safely

---

## Phase 2 — Backend Server

> **Summary:** The backend is a small Node.js API that does the actual downloading. When the app sends it a YouTube URL, it runs `yt-dlp` to fetch the audio or video, converts it with `ffmpeg`, and streams the file directly back to your phone — no cloud storage involved. The only Firebase service the backend uses is Auth (to verify your identity on each request). Everything runs in a Docker container deployed to Railway in Phase 3.

---

### Step 2.1 — Create the Project Structure

```bash
mkdir backend && cd backend
npm init -y
npm install express cors firebase-admin uuid
npm install --save-dev nodemon
```

Your backend folder structure:

```
backend/
  src/
    index.js                      ← main Express server
    routes/
      download.js                 ← start async download job
      file.js                     ← stream completed file to device
      info.js                     ← fetch video metadata / resolutions
      status.js                   ← poll job progress
    middleware/
      auth.js                     ← Firebase token verification
      planCheck.js                ← plan enforcement (client-side placeholder)
    utils/
      firebase.js                 ← Firebase Admin init (Auth only)
      jobs.js                     ← in-memory async job store
      storage.js                  ← local temp file helper
      ytdlp.js                    ← yt-dlp wrapper
  Dockerfile
  .env                            ← PORT only (never commit!)
  .gitignore
  .railwayignore
  firebase-service-account.json   ← from Step 1.5 (uploaded to Railway, not git)
```

---

### Step 2.2 — Environment Variables

Create `backend/.env`:

```
PORT=8080
```

> `FIREBASE_BUCKET` is no longer needed — the backend does not use Firebase Storage.

Create `backend/.gitignore`:

```
node_modules/
.env
firebase-service-account.json
downloads/
```

Create `backend/.railwayignore`:

```
node_modules/
.env
```

> Note: `firebase-service-account.json` is intentionally **not** in `.railwayignore` — Railway needs to upload it so the backend can verify Firebase tokens. It stays out of Git but goes to Railway.

---

### Step 2.3 — Main Server (`src/index.js`)

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./utils/firebase'); // initialize Firebase Admin (Auth only)

const { verifyToken } = require('./middleware/auth');
const { checkPlan }   = require('./middleware/planCheck');

const infoRouter     = require('./routes/info');
const downloadRouter = require('./routes/download');
const statusRouter   = require('./routes/status');
const fileRouter     = require('./routes/file');

const app = express();
app.use(cors());
app.use(express.json());

// Public
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// All /api/* routes require a valid Firebase ID token
app.use('/api', verifyToken);

app.use('/api/info',     infoRouter);                // POST  - get video metadata
app.use('/api/download', checkPlan, downloadRouter); // POST  - start async download job
app.use('/api/status',   statusRouter);              // GET   - poll job progress
app.use('/api/file',     fileRouter);                // GET   - stream completed file to device

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('PocketTube backend running on port ' + PORT);
});
```

---

### Step 2.4 — yt-dlp Utility (`src/utils/ytdlp.js`)

```js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = '/tmp/downloads';

async function downloadMedia(url, format) {
  const id = uuidv4();
  const outPath = path.join(DOWNLOADS_DIR, id);
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  const formatFlag = format === 'audio'
    ? '-x --audio-format mp3 --audio-quality 0'
    : '-f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';

  const cmd = `yt-dlp ${formatFlag} -o '${outPath}.%(ext)s' '${url}'`;

  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(new Error(stderr));
      const ext = format === 'audio' ? 'mp3' : 'mp4';
      resolve(`${outPath}.${ext}`);
    });
  });
}

module.exports = { downloadMedia };
```

---

### Step 2.5 — Local File Helper (`src/utils/storage.js`)

No Firebase Storage — just a helper that tracks where yt-dlp writes temp files.

```js
const path = require('path');

const DOWNLOADS_DIR = process.platform === 'win32'
  ? path.join(require('os').tmpdir(), 'pockettube-downloads')
  : '/tmp/downloads';

function getLocalPath(jobId, format) {
  var ext = format === 'audio' ? 'mp3' : 'mp4';
  return path.join(DOWNLOADS_DIR, jobId + '.' + ext);
}

module.exports = { getLocalPath };
```

---

### Step 2.6 — Download Route (`src/routes/download.js`)

Returns a `jobId` immediately and runs yt-dlp in the background. The mobile polls for progress then fetches the file once done.

```js
const express = require('express');
const router = express.Router();
const path = require('path');
const { downloadMedia } = require('../utils/ytdlp');
const { createJob, updateJob } = require('../utils/jobs');

router.post('/', async (req, res) => {
  const { url, format, resolution, metadata } = req.body;

  if (!url || !format) {
    return res.status(400).json({ error: 'url and format are required' });
  }

  const jobId = createJob();
  res.json({ jobId });

  ;(async () => {
    try {
      updateJob(jobId, { status: 'downloading', progress: 5 });

      const localPath = await downloadMedia(url, format, resolution, (frac) => {
        updateJob(jobId, { progress: Math.round(5 + frac * 90) });
      });

      const ext      = format === 'audio' ? 'mp3' : 'mp4';
      const stem     = metadata && metadata.videoId
        ? metadata.videoId
        : path.basename(localPath, '.' + ext);

      updateJob(jobId, {
        status: 'done', progress: 100,
        result: {
          localPath, filename: stem + '.' + ext, format,
          resolution: format === 'video' ? (resolution || null) : null,
          metadata: {
            videoId:      (metadata && metadata.videoId)      || stem,
            title:        (metadata && metadata.title)        || stem,
            channel:      (metadata && metadata.channel)      || '',
            uploadDate:   (metadata && metadata.uploadDate)   || null,
            duration:     (metadata && metadata.duration)     || null,
            thumbnailUrl: (metadata && metadata.thumbnailUrl) || null,
            sourceUrl:    (metadata && metadata.sourceUrl)    || url
          }
        }
      });
    } catch (err) {
      updateJob(jobId, { status: 'error', error: err.message });
    }
  })();
});

module.exports = router;
```

---

### Step 2.7 — File Serving Route (`src/routes/file.js`)

Streams the completed file directly to the mobile app, then deletes it from `/tmp`.

```js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const { getJob } = require('../utils/jobs');

router.get('/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job)                    return res.status(404).json({ error: 'Job not found or expired' });
  if (job.status !== 'done')   return res.status(404).json({ error: 'Job not ready yet' });
  if (!fs.existsSync(job.result.localPath))
                               return res.status(410).json({ error: 'File already served or server restarted' });

  const { localPath, filename, format } = job.result;
  const stat = fs.statSync(localPath);

  res.setHeader('Content-Type', format === 'audio' ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

  const stream = fs.createReadStream(localPath);
  stream.pipe(res);
  stream.on('close', function() {
    try { fs.unlinkSync(localPath); } catch (e) {}
  });
});

module.exports = router;
```

---

### Step 2.8 — Dockerfile

```dockerfile
FROM python:3.11-slim

# Install Node.js 18 + ffmpeg
RUN apt-get update && apt-get install -y curl ffmpeg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    pip install yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 8080
CMD ["node", "src/index.js"]
```

---

### Step 2.9 — Test Locally

```bash
# In the backend/ folder
node src/index.js

# In another terminal
curl http://localhost:8080/health
# Should return: {"status":"ok"}
```

---

### ✅ Phase 2 Checklist

- [ ] `backend/` folder and file structure created
- [ ] `.env` contains `PORT=8080` only
- [ ] `.gitignore` excludes `.env` and `firebase-service-account.json`
- [ ] `.railwayignore` created (excludes `node_modules/` and `.env` — NOT the service account)
- [ ] `firebase-service-account.json` placed in `backend/` (from Step 1.5)
- [ ] All source files created: `index.js`, `routes/download.js`, `routes/file.js`, `routes/info.js`, `routes/status.js`, `middleware/auth.js`, `middleware/planCheck.js`, `utils/firebase.js`, `utils/jobs.js`, `utils/storage.js`, `utils/ytdlp.js`
- [ ] `Dockerfile` created
- [ ] Local health check returns `{"status":"ok"}`

---

## Phase 3 — Deploy to Render

> **Summary:** Render hosts your Docker container with a permanent public URL. It deploys directly from your GitHub repo — push to main and Render rebuilds automatically. The free tier gives you 750 hours/month, which is more than enough for personal use. Setup takes about 10 minutes.
>
> **Why Render and not Railway?** Railway's shared IP ranges are flagged by YouTube as bot/datacenter traffic, causing yt-dlp to fail with "Sign in to confirm you're not a bot" errors regardless of configuration. Render's IP ranges have lower scraping history and work without cookies. See `SYSTEM_DESIGN.md` for the full decision log.

---

### Step 3.1 — Create a Render Account

1. Go to [render.com](https://render.com) → sign up with your GitHub account
2. A credit card is required to unlock the free tier (you won't be charged)

---

### Step 3.2 — Create a New Web Service

1. In the Render dashboard → click **New** → **Web Service**
2. Connect your GitHub account if prompted → select the **PocketTube** repo
3. Configure the service:
   - **Name:** `pockettube-backend`
   - **Region:** Oregon (US West) or whichever is closest to you
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Docker
   - **Instance Type:** Free

Render will detect your `Dockerfile` automatically.

---

### Step 3.3 — Set Environment Variables

Before clicking Deploy, add these environment variables in the Render dashboard:

| Key | Value |
|-----|-------|
| `PORT` | `8080` |
| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded service account JSON (see below) |

**To generate the `FIREBASE_SERVICE_ACCOUNT` value**, run this in your `backend/` folder:

```bash
node -e "console.log(Buffer.from(JSON.stringify(require('./firebase-service-account.json'))).toString('base64'))"
```

Copy the output (a long single-line string) and paste it as the variable value. Base64 encoding prevents newline corruption of the RSA private key.

> ⚠️ Never commit `firebase-service-account.json` to git. The env var approach keeps credentials out of version control entirely.

---

### Step 3.4 — Deploy

Click **Create Web Service**. Render builds your Docker image and starts the container. The first build takes 3–5 minutes (installs Node, Python, ffmpeg, and yt-dlp).

---

### Step 3.5 — Get Your Public URL

Once deployed, Render shows your URL at the top of the service page:

```
https://pockettube-backend.onrender.com
```

This is your `BACKEND_URL`. Update `mobile/src/constants.js`:

```js
export const BACKEND_URL = 'https://pockettube-backend.onrender.com';
```

---

### Step 3.6 — Test the Deployed Backend

```bash
curl https://pockettube-backend.onrender.com/health
# Expected: {"status":"ok"}
```

> 💡 **Free Tier Note:** Render's free web services spin down after 15 minutes of inactivity and take ~30 seconds to cold-start. For a personal app this is acceptable — the first request after idle will be slow. To prevent spin-down, set up a free uptime monitor (e.g. UptimeRobot) to ping `/health` every 10 minutes.

---

### ✅ Phase 3 Checklist

- [ ] Render account created and GitHub repo connected
- [ ] Web service created with Docker runtime, root directory set to `backend/`
- [ ] `PORT` and `FIREBASE_SERVICE_ACCOUNT` environment variables set
- [ ] Deploy successful (green status in Render dashboard)
- [ ] Public URL noted and saved
- [ ] `BACKEND_URL` updated in `mobile/src/constants.js`
- [ ] Health check returns `{"status":"ok"}`

---

## Phase 4 — React Native Mobile App

> **Summary:** The mobile app is built with React Native and Expo, which means one codebase runs on both iOS and Android. It has four screens: a Google login screen, a download screen (paste URL + pick playlist), a library screen (browse by playlist), and a player screen (audio/video playback). Expo Go lets you run the app on your real phone instantly during development — no build required.

---

### Step 4.1 — Bootstrap the App

```bash
cd ../   # back to pockettube/ root
npx create-expo-app mobile --template blank
cd mobile

npx expo install expo-auth-session expo-web-browser
npx expo install expo-file-system expo-av expo-media-library
npx expo install @react-native-async-storage/async-storage
npm install firebase @react-navigation/native @react-navigation/bottom-tabs
npm install @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

Your mobile folder structure:

```
mobile/
  App.js                          ← root navigator + auth state listener
  app.json                        ← Expo config (version, permissions, scheme)
  src/
    firebase.js                   ← Firebase app init (auth + Firestore)
    constants.js                  ← BACKEND_URL and shared color palette
    screens/
      LoginScreen.js              ← Google OAuth + anonymous dev login
      DownloadScreen.js           ← paste URL, pick format, trigger download
      LibraryScreen.js            ← browse and filter downloaded files
      PlayerScreen.js             ← audio and video playback
  assets/
    icon.png                      ← app icon
    splash-icon.png               ← splash screen image
    adaptive-icon.png             ← Android adaptive icon
```

---

### Step 4.2 — Firebase Config (`src/firebase.js`)

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'pockettube.firebaseapp.com',
  projectId: 'pockettube',
  storageBucket: 'pockettube.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

### Step 4.3 — Login Screen (`src/screens/LoginScreen.js`)

```jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 PocketTube</Text>
      <Text style={styles.sub}>Your personal media library</Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.btnText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0f172a' },
  title: { fontSize: 48, color: '#0d9488', fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 16, color: '#94a3b8', marginBottom: 48 },
  btn: { backgroundColor: '#0d9488', paddingVertical: 16,
    paddingHorizontal: 40, borderRadius: 12 },
  btnText: { color: 'white', fontSize: 18, fontWeight: '600' }
});
```

---

### Step 4.4 — Download Screen (`src/screens/DownloadScreen.js`)

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BACKEND_URL = 'https://YOUR_CLOUD_RUN_URL';

export default function DownloadScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState('General');
  const playlists = ['General', 'Music', 'Podcasts', 'Sleep', 'Focus', 'Language', 'Videos'];

  const handleDownload = async (format) => {
    if (!url) return Alert.alert('Paste a YouTube URL first');
    setLoading(true);
    try {
      const user = auth.currentUser;
      const ext = format === 'audio' ? 'mp3' : 'mp4';
      const filename = `${Date.now()}.${ext}`;

      // 1. Tell backend to download
      const res = await fetch(`${BACKEND_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, userId: user.uid, filename })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // 2. Download file to device
      const localUri = FileSystem.documentDirectory + filename;
      await FileSystem.downloadAsync(data.url, localUri);

      // 3. Save metadata to Firestore
      await addDoc(collection(db, `users/${user.uid}/media`), {
        filename, localUri, format, playlist,
        storageUrl: data.url,
        sourceUrl: url,
        createdAt: serverTimestamp()
      });

      Alert.alert('✅ Downloaded!', `Saved to ${playlist} playlist`);
      setUrl('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Download</Text>
      <TextInput style={styles.input} value={url} onChangeText={setUrl}
        placeholder='Paste YouTube URL...' placeholderTextColor='#475569'
        autoCapitalize='none' />
      <Text style={styles.label}>Playlist</Text>
      <View style={styles.chips}>
        {playlists.map(p => (
          <TouchableOpacity key={p} onPress={() => setPlaylist(p)}
            style={[styles.chip, playlist === p && styles.chipActive]}>
            <Text style={styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator size='large' color='#0d9488' /> : (
        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={() => handleDownload('audio')}>
            <Text style={styles.btnText}>⬇ Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnVideo]}
            onPress={() => handleDownload('video')}>
            <Text style={styles.btnText}>⬇ Video</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 24 },
  input: { backgroundColor: '#1e293b', color: 'white', borderRadius: 10,
    padding: 16, fontSize: 16, marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#1e293b' },
  chipActive: { backgroundColor: '#0d9488' },
  chipText: { color: 'white', fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, backgroundColor: '#0d9488', padding: 16,
    borderRadius: 10, alignItems: 'center' },
  btnVideo: { backgroundColor: '#7c3aed' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' }
});
```

---

### Step 4.5 — Library Screen (`src/screens/LibraryScreen.js`)

```jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';

const PLAYLISTS = ['All', 'General', 'Music', 'Podcasts', 'Sleep', 'Focus', 'Language', 'Videos'];

export default function LibraryScreen() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth.currentUser;
    const ref = collection(db, `users/${user.uid}/media`);
    const q = filter === 'All' ? ref : query(ref, where('playlist', '==', filter));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [filter]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <FlatList horizontal data={PLAYLISTS} keyExtractor={i => i}
        style={styles.filters}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setFilter(item)}
            style={[styles.chip, filter === item && styles.chipActive]}>
            <Text style={styles.chipText}>{item}</Text>
          </TouchableOpacity>
        )} />
      <FlatList data={items} keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}
            onPress={() => navigation.navigate('Player', { item })}>
            <Text style={styles.icon}>{item.format === 'audio' ? '🎵' : '🎬'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.filename}</Text>
              <Text style={styles.meta}>{item.playlist}</Text>
            </View>
          </TouchableOpacity>
        )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 28, color: 'white', fontWeight: 'bold', marginBottom: 16 },
  filters: { marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1e293b', marginRight: 8 },
  chipActive: { backgroundColor: '#0d9488' },
  chipText: { color: 'white' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#1e293b', borderRadius: 10, marginBottom: 8, gap: 12 },
  icon: { fontSize: 28 },
  name: { color: 'white', fontSize: 15, fontWeight: '500' },
  meta: { color: '#64748b', fontSize: 12, marginTop: 2 }
});
```

---

### Step 4.6 — Player Screen (`src/screens/PlayerScreen.js`)

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio, Video } from 'expo-av';

export default function PlayerScreen({ route }) {
  const { item } = route.params;
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (item.format === 'audio') {
      Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true
      });
    }
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  const togglePlay = async () => {
    if (item.format === 'audio') {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: item.localUri });
        soundRef.current = sound;
      }
      playing
        ? await soundRef.current.pauseAsync()
        : await soundRef.current.playAsync();
    } else {
      playing
        ? videoRef.current?.pauseAsync()
        : videoRef.current?.playAsync();
    }
    setPlaying(!playing);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.filename}</Text>
      <Text style={styles.sub}>{item.playlist}</Text>
      {item.format === 'video' && (
        <Video ref={videoRef} source={{ uri: item.localUri }}
          style={styles.video} useNativeControls resizeMode='contain' />
      )}
      <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
        <Text style={styles.playIcon}>{playing ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold',
    textAlign: 'center', marginBottom: 8 },
  sub: { color: '#0d9488', fontSize: 14, marginBottom: 32 },
  video: { width: '100%', height: 220, marginBottom: 32 },
  playBtn: { width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 32 }
});
```

---

### Step 4.7 — App Navigator (`App.js`)

```jsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import LoginScreen from './src/screens/LoginScreen';
import DownloadScreen from './src/screens/DownloadScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import PlayerScreen from './src/screens/PlayerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{
      tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
      tabBarActiveTintColor: '#0d9488',
      tabBarInactiveTintColor: '#475569',
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: 'white'
    }}>
      <Tab.Screen name='Download' component={DownloadScreen}
        options={{ tabBarLabel: 'Download', tabBarIcon: () => '⬇️' }} />
      <Tab.Screen name='Library' component={LibraryScreen}
        options={{ tabBarLabel: 'Library', tabBarIcon: () => '📚' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return null;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name='Main' component={MainTabs} />
            <Stack.Screen name='Player' component={PlayerScreen}
              options={{
                headerShown: true, title: 'Now Playing',
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: 'white'
              }} />
          </>
        ) : (
          <Stack.Screen name='Login' component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

### Step 4.8 — Test with Expo Go

```bash
cd mobile
npx expo start
```

Scan the QR code with the **Expo Go** app on your iPhone or Android. The full app will load on your phone instantly — no build needed during development.

---

### ✅ Phase 4 Checklist

- [ ] Expo app bootstrapped with `create-expo-app`
- [ ] All dependencies installed
- [ ] `src/firebase.js` created with your config values
- [ ] `LoginScreen.js` created
- [ ] `DownloadScreen.js` created with your `BACKEND_URL`
- [ ] `LibraryScreen.js` created
- [ ] `PlayerScreen.js` created
- [ ] `App.js` navigator wired up
- [ ] App loads in Expo Go on your phone
- [ ] Google sign-in works end-to-end

---

## Phase 5 — Run on Your Phone with Expo Go

> **Summary:** Expo Go is a free app available on the App Store and Google Play that lets you run your Expo project on a real device instantly — no Apple Developer account, no build step, no cost. You scan a QR code from your terminal and the full app loads on your phone. This is the recommended approach for personal and learning projects.

---

### Step 5.1 — Install Expo Go on Your Phone

- **iPhone:** Search "Expo Go" in the App Store → install (free)
- **Android:** Search "Expo Go" in the Google Play Store → install (free)

> No account required on the phone itself — just the app.

---

### Step 5.2 — Update `app.json`

Even without a paid Apple account, you should set up `app.json` correctly so background audio and file access work as expected inside Expo Go:

```json
{
  "expo": {
    "name": "PocketTube",
    "slug": "pockettube",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "UIFileSharingEnabled": true,
        "LSSupportsOpeningDocumentsInPlace": true
      }
    },
    "android": {
      "permissions": ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    }
  }
}
```

---

### Step 5.3 — Start the Dev Server and Scan

```bash
cd mobile
npx expo start
```

A QR code appears in your terminal. Open the **Expo Go** app on your phone and scan it. PocketTube loads on your device in seconds — no build required.

> 💡 **Your phone and computer must be on the same Wi-Fi network** for the QR code scan to work. If you're on different networks, run `npx expo start --tunnel` instead (requires `npm install -g @expo/ngrok`).

---

### Step 5.4 — Keep the App Running

Expo Go streams the app live from your dev server. This means:

- The app is available as long as your computer is running `npx expo start`
- Hot reload is active — any code change you save instantly updates on your phone
- Downloaded files are saved locally on your device and persist between sessions
- If you close the terminal, the app won't load until you restart the server

> **Want a permanent install without paying Apple?** See the [AltStore method](https://altstore.io) — it lets you sideload a built `.ipa` using a free Apple ID. The app expires every 7 days but AltStore can auto-refresh it. This is optional and not required for the learning goals of this project.

---

### ✅ Phase 5 Checklist

- [ ] Expo Go installed on your iPhone or Android device
- [ ] `app.json` updated with background audio and file sharing permissions
- [ ] `npx expo start` runs without errors
- [ ] QR code scanned and app loads on your phone
- [ ] Google sign-in works on device
- [ ] Download flow works end-to-end on device
- [ ] Audio playback works (including with screen locked)

---

## Phase 6 — Google OAuth Client IDs

> **Summary:** Google Sign-In requires three separate OAuth client IDs — one for web (used by Expo), one for iOS, and one for Android. This is the most fiddly configuration step but you only do it once. All three are created in the Google Cloud Console under the same project.

---

### Step 6.1 — Create OAuth Client IDs

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Click **"Create Credentials" → "OAuth client ID"**
3. Create **three** clients one at a time:

| Client Type | Setting | Use |
|---|---|---|
| Web application | No extra settings needed | `YOUR_EXPO_CLIENT_ID` |
| iOS | Bundle ID: `com.yourname.pockettube` | `YOUR_IOS_CLIENT_ID` |
| Android | Package + SHA-1 fingerprint | `YOUR_ANDROID_CLIENT_ID` |

4. To get your Android SHA-1 fingerprint:

```bash
eas credentials --platform android
```

5. Paste all three client IDs into `LoginScreen.js` where marked
6. In Firebase Console → **Authentication → Google → Web SDK configuration** → add your web client ID

---

### ✅ Phase 6 Checklist

- [ ] Web OAuth client ID created
- [ ] iOS OAuth client ID created with correct bundle ID
- [ ] Android OAuth client ID created with SHA-1 fingerprint
- [ ] All three client IDs pasted into `LoginScreen.js`
- [ ] Web client ID added to Firebase Auth settings
- [ ] Google sign-in tested and working on device

---

## Phase 7 — Playlist System

> **Summary:** Playlists are stored per-user in Firestore and created automatically on first login. There are 7 default categories. Users assign a playlist when downloading, and the Library screen filters by playlist in real time. You can also add a custom playlist creation feature later.

---

### Default Playlists

| Playlist | Emoji | Use Case |
|---|---|---|
| General | 📁 | Catch-all for uncategorized content |
| Music | 🎵 | Songs, albums, live performances |
| Podcasts | 🎙️ | Interviews, shows, long-form audio |
| Sleep | 😴 | Ambient, rain, white noise, relaxing |
| Focus | 🧠 | Lo-fi, instrumentals, study music |
| Language | 🗣️ | Language lessons, pronunciation guides |
| Videos | 🎬 | Any video content |

---

### Step 7.1 — Auto-Create Playlists on First Login

Add this to your `App.js` inside the auth state change handler:

```js
import { doc, setDoc, getDoc } from 'firebase/firestore';

async function initUserPlaylists(userId) {
  const ref = doc(db, `users/${userId}/meta`, 'playlists');
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      lists: ['General', 'Music', 'Podcasts', 'Sleep', 'Focus', 'Language', 'Videos'],
      created: new Date()
    });
  }
}

// Call it inside your onAuthStateChanged:
onAuthStateChanged(auth, (user) => {
  if (user) initUserPlaylists(user.uid);
  setUser(user);
});
```

---

### ✅ Phase 7 Checklist

- [ ] `initUserPlaylists()` function added to `App.js`
- [ ] Function called on sign-in
- [ ] Default playlists appear in Firestore after first login
- [ ] Playlist chips show on Download screen
- [ ] Library screen filters correctly by playlist
- [ ] Downloaded files appear under correct playlist

---

## 💰 Full Cost Summary

| Service | Free Tier Limit | Monthly Cost |
|---|---|---|
| Firebase Auth | Unlimited users | $0 |
| Firestore | 1 GB storage, 50K reads/day | $0 |
| Firebase Storage | Not used — files stored on device | $0 |
| Render | Free tier (750 hrs/month) | $0 |
| Expo Go | Run app on device during development | $0 |
| **Total** | — | **$0/mo** *(+ 2.9% + 30¢ per Stripe transaction once v1.6.0 ships)* |

> **Storage tip:** All media files are saved directly to your phone by the mobile app using `expo-file-system`. Nothing is uploaded to the cloud, so there are no storage costs regardless of how much you download.

---

## ❓ FAQ

**Why can't the backend run on Railway or Render?**
Both services use shared datacenter IP ranges that YouTube has flagged as bot/scraper infrastructure. yt-dlp returns "Sign in to confirm you're not a bot" regardless of configuration. The workaround is running the backend locally on your own machine (a residential IP) and exposing it via Cloudflare Tunnel. See `SYSTEM_DESIGN.md` → Decision 3 for the full investigation.

**Why does the Cloudflare URL change every time I restart?**
The current setup uses an ad-hoc tunnel (`cloudflared tunnel --url ...`) which generates a random subdomain each session. Sprint 2 of v1.2.0 fixes this by creating a named tunnel with a permanent subdomain — you set it up once and it never changes.

**Does the app work on Android?**
The codebase is cross-platform React Native but has only been tested on iOS via Expo Go. Android should work in theory, but the Google OAuth Android client ID hasn't been configured yet (`YOUR_ANDROID_CLIENT_ID` placeholder in `LoginScreen.js`). Background audio behaviour and file storage paths may also differ on Android.

**What happens if I close the Expo terminal?**
The app stops loading on your phone — Expo Go streams the app live from your dev server. Downloaded files already on your device are safe and persist. Restart `npx expo start` and re-scan the QR code to get back in.

**Can I use the app without my computer running?**
No — not in v1.1.0. The backend (which does the actual downloading) runs on your local machine. Once a file is downloaded and saved to your phone, you can play it offline without the computer. The computer only needs to be on when you want to download something new.

**Google Sign-In says "redirect_uri_mismatch" — how do I log in during development?**
This is a fundamental Expo Go limitation — Google rejects `exp://` redirect URIs. Use the **⚠️ Dev Login (anonymous)** button on the login screen. It's only visible when running in development (`__DEV__` mode) and gives you a Firebase Anonymous Auth session that works with the backend. Real Google Sign-In will work once you create a TestFlight build (Sprint 3.2).

**How do I stop the app from asking for a new Cloudflare URL every session?**
Sprint 2 of v1.2.0 sets up a named Cloudflare Tunnel with a permanent subdomain. Once done, `BACKEND_URL` in `constants.js` never needs to change again.

---

## 🐛 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| "Project incompatible" in Expo Go | SDK version mismatch between project and Expo Go | Delete `mobile/node_modules` and `mobile/package-lock.json`. Run `npx create-expo-app@latest . --template blank` inside `mobile/`, then reinstall: `npm install firebase @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack --legacy-peer-deps` followed by `npx expo install expo-auth-session expo-web-browser expo-file-system expo-av expo-media-library expo-crypto @react-native-async-storage/async-storage react-native-screens react-native-safe-area-context`. Restore all files in `src/` from git if needed. |
| "Open up App.js to start working" screen | `create-expo-app` overwrote `App.js` and `src/` when rescaffolding | After rescaffolding, restore `App.js`, `src/firebase.js`, `src/constants.js`, and all screen files from git before running the app. |
| `npm install` removes packages or wipes `package.json` | Running `npm install <package>` with `--legacy-peer-deps` in a broken dependency state | Always run `npm install --legacy-peer-deps` (no extra packages) first to restore node_modules, then use `npx expo install` for all Expo-specific packages. Never mix `npm install <package>` and `--legacy-peer-deps` when the dependency tree is already broken. |
| `react@18.3.2` not found | That exact React version does not exist on npm | Use `react@18.3.1` for Expo SDK 54. Always let `npx expo install` pin React/React Native versions — do not set them manually. |
| TurboModuleRegistry `PlatformConstants` error on device | React Native version in `package.json` doesn't match what Expo Go has compiled in | Do not manually set `react-native` version. Run `npx create-expo-app@latest` to get the correct scaffold, then use `npx expo install` for all packages. |
| yt-dlp "Sign in to confirm you're not a bot" on server | Hosting provider IP range is blocklisted by YouTube | Switch to a provider with cleaner IP history (e.g. Render). If Render also gets blocked, run the backend locally with a Cloudflare Tunnel. See `SYSTEM_DESIGN.md` → Decision 3 for full analysis. |
| yt-dlp fails — not installed in Docker image | Missing pip install in Dockerfile | Verify `Dockerfile` has `pip install yt-dlp` |
| Render build times out | Large Docker image (ffmpeg + yt-dlp) | Normal — first build takes 3–5 min; subsequent builds are faster |
| Render deploy succeeds but health check fails | `PORT` env var not set | Set `PORT=8080` in Render dashboard → Environment |
| `Invalid or expired token` from backend | `FIREBASE_SERVICE_ACCOUNT` env var missing or corrupted | Generate the base64 value with `node -e "console.log(Buffer.from(JSON.stringify(require('./firebase-service-account.json'))).toString('base64'))"` and set it in Render environment variables. |
| Google sign-in "Error 400: redirect_uri_mismatch" in Expo Go | Google rejects `exp://` redirect URIs — they're not a valid public top-level domain | This is a fundamental Expo Go limitation. Google Sign-In won't work in Expo Go regardless of what you register. Use the **⚠️ Dev Login (anonymous)** button on the login screen (visible in `__DEV__` mode only) to sign in with Firebase Anonymous Auth and test the rest of the app. Real Google Sign-In works once you create a development build (TestFlight). **Remove the dev button before releasing.** |
| Google sign-in "Error 400: invalid_request" or "Authorization Error" in EAS APK | `expo-auth-session` browser-based OAuth flow sends a custom URI scheme (`pockettube://`) as the redirect URI — Google's OAuth 2.0 policy rejects any redirect URI that is not an `https://` URL | Switched to `@react-native-google-signin/google-signin` native SDK (v1.3.0). The native SDK uses the Android OAuth client verified by package name + SHA-1 fingerprint — no redirect URI involved. Do not attempt to use `expo-auth-session` or `makeRedirectUri({ useProxy: true })` for native Android EAS builds. |
| Google sign-in `DEVELOPER_ERROR` in EAS APK | SHA-1 fingerprint in Google Cloud Console does not match the EAS keystore | Run `eas credentials --platform android` → select `pockettube-android-preview` → copy the SHA-1. Go to Google Cloud Console → Credentials → PocketTube Android → verify the SHA-1 matches exactly. |
| Google sign-in error | Wrong client ID | Double-check all 3 OAuth client IDs match |
| File not found on phone | Wrong `localUri` | Log `FileSystem.documentDirectory` to verify path |
| Audio won't play in background | Missing plist key | Add `UIBackgroundModes: ["audio"]` to `app.json` |
| Firebase Storage 403 error | Wrong security rules | Re-check Phase 1 Step 1.4 rules and re-publish |
| Railway free credits running low | Container running continuously | Railway dashboard → Usage to monitor; container stays on but usage is minimal at rest |
| Expo Go can't connect to dev server | Phone and computer on different networks | Run `npx expo start --tunnel` instead of the default LAN mode |
| App disappears after closing Expo Go | Expected — Expo Go streams from dev server | Restart `npx expo start` and re-scan QR code to re-launch |
| QR code won't scan | Camera permissions or lighting | Use the "Enter URL manually" option in Expo Go instead |
| Library crashes when filtering by a playlist | Firestore `failed-precondition` — composite index required for `where('playlist')` + implicit ordering | Two options: (1) Go to Firebase Console → Firestore → Indexes → Add composite index on `playlist` (asc) + `createdAt` (desc) for the `media` collection. (2) Simpler workaround already applied in v1.2.0 — fetch all docs without `orderBy`, then sort client-side in JavaScript after the snapshot arrives. |
| yt-dlp fails with "ffmpeg not found" on Windows | ffmpeg installed via winget but not on the PATH that Node.js inherits | Run `where ffmpeg` in a terminal to find the install path (e.g. `C:\Users\<you>\AppData\Local\Microsoft\WinGet\Packages\...\ffmpeg.exe`). Add `--ffmpeg-location "C:\full\path\to\ffmpeg.exe"` to the yt-dlp command in `backend/src/utils/ytdlp.js`. |
| BACKEND_URL in `constants.js` needs updating every ngrok restart | Using an ad-hoc ngrok tunnel (no `--domain` flag) which generates a random subdomain each session | Create a free ngrok account at ngrok.com, claim a free static domain under Dashboard → Domains, then always start the tunnel with `ngrok http --domain=your-static-domain.ngrok-free.app 8080`. Update `constants.js` once with this permanent URL — it never changes again. |

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)
- [Railway Docs](https://docs.railway.app)
- [React Navigation Docs](https://reactnavigation.org)
- [EAS Build Guide](https://docs.expo.dev/build/introduction)

---

## 📄 License

This project is for **personal and educational use only**. It is not licensed for distribution, commercial use, or public deployment of any kind. See the disclaimer at the top of this document.

---

*Built for learning purposes · Not affiliated with YouTube or Google*

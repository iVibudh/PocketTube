# 📚 PocketTube — Project Learnings

A running log of real problems hit, decisions made, and lessons learned while building this app. Written for future-me and anyone else following this repo.

---

## 1. YouTube Bot Detection — Cloud Hosting IPs Are Blocked

**What happened:** Deployed the backend to Railway, then Render. Both worked for health checks but yt-dlp consistently failed with `"Sign in to confirm you're not a bot"`.

**Why:** YouTube maintains a blocklist of datacenter IP ranges. Railway, Render, and most cloud providers sit in these ranges. No amount of yt-dlp configuration fixes this — it's a network-level block.

**Fix:** Run the backend locally on your own machine (residential IP) and expose it to the internet via a tunnel. Residential IPs are not on YouTube's blocklist.

**Lesson:** For any project that scrapes or interacts with YouTube, assume cloud hosting won't work. A local backend + tunnel is the only reliable free approach.

---

## 2. yt-dlp Player Client — Bypassing the JS Challenge

**What happened:** Even with a local/residential IP, yt-dlp sometimes failed with a JS challenge error from YouTube.

**Why:** YouTube serves a JavaScript challenge that newer yt-dlp versions need to solve. Some player clients are less aggressively challenged.

**Fix:** Add `--extractor-args youtube:player_client=android_vr` to all yt-dlp commands. The Android VR client bypasses the JS challenge entirely.

**Lesson:** yt-dlp has multiple player client modes. `android_vr` is the most reliable as of 2026 for bypassing bot detection, but this may change as YouTube updates its systems. Keep yt-dlp updated.

---

## 3. Tunnels — Cloudflare vs ngrok

**What happened:** Started with Cloudflare's ad-hoc tunnel (`cloudflared tunnel --url`). It worked but generated a new random URL every restart, requiring a manual update to `constants.js` every session.

**Attempted fix:** Tried to set up a named Cloudflare tunnel with a permanent subdomain. Hit a blocker — named tunnels require a domain registered with Cloudflare. No domain = no permanent URL via Cloudflare.

**Final fix:** Switched to ngrok. The free ngrok plan assigns one permanent static domain (`something.ngrok-free.dev`) per account. Running `ngrok http --domain=your-domain.ngrok-free.dev 8080` always produces the same URL. `constants.js` is set once and never touched again.

**Lesson:** Cloudflare tunnels are powerful but require a domain for permanent URLs. ngrok's free static domain is the simpler zero-cost solution for personal dev projects.

**Commands:**
```bash
# Old (URL changes every restart)
cloudflared tunnel --url http://localhost:8080

# New (URL is always the same)
ngrok http --domain=tropics-proton-unbitten.ngrok-free.dev 8080
```

---

## 4. Firebase Admin — Service Account as Base64 Env Var

**What happened:** Deploying the Firebase service account JSON to Render (and storing it locally) was tricky. The JSON contains a multi-line RSA private key that breaks when stored as a plain environment variable.

**Fix:** Base64-encode the entire JSON file and store that as a single env var. The backend decodes it at startup.

```bash
# Generate the value
node -e "console.log(Buffer.from(JSON.stringify(require('./firebase-service-account.json'))).toString('base64'))"
```

**Lesson:** Never store multi-line secrets (especially RSA keys) in env vars directly. Base64 encoding collapses them to a single safe string. Always add `firebase-service-account.json` to `.gitignore` immediately.

---

## 5. Google Sign-In — Blocked in Expo Go

**What happened:** Google Sign-In throws `Error 400: redirect_uri_mismatch` when running in Expo Go.

**Why:** Expo Go uses `exp://` as its redirect URI scheme. Google does not accept `exp://` as a valid OAuth redirect URI — it's not a real top-level domain.

**Workaround:** Added an anonymous auth dev login button in `LoginScreen.js`, visible only in `__DEV__` mode. This gives a valid Firebase session for development without needing Google Sign-In.

```js
{__DEV__ && (
  <TouchableOpacity onPress={signInAnonymously}>
    <Text>⚠️ Dev Login (anonymous)</Text>
  </TouchableOpacity>
)}
```

**Real fix:** Build a proper app binary via EAS Build. A real `.ipa` or `.apk` uses your actual bundle ID as the redirect URI, which Google accepts.

**Lesson:** Expo Go is great for rapid development but has hard limitations around OAuth flows. Plan for an EAS Build step before testing any OAuth-based auth.

---

## 6. iOS Distribution — The $99/yr Wall

**What happened:** Explored distributing the app on iOS without paying for an Apple Developer account.

**Options investigated:**
- **TestFlight** — requires $99/yr Apple Developer account. Works great but has a cost.
- **AltStore sideloading** — free, installs a real `.ipa` via a free Apple ID. App expires every 7 days but AltStore auto-refreshes. Impractical for sharing with others.
- **Expo Go** — free, no install needed, but no Google Sign-In and requires a running dev server.

**Decision:** For this learning project, go Android-first. Android APKs can be built for free with EAS and shared directly as a file — no Google Play account needed, no fees.

**Lesson:** iOS distribution is fundamentally paywalled by Apple. For learning projects and free distribution, Android is the practical choice.

---

## 7. Android APK — Free Distribution

**How it works:** EAS Build's free tier (30 builds/month) can produce an Android `.apk`. Share the file directly — anyone with Android can install it by enabling "Install from unknown sources". No Google Play account needed.

**Google Sign-In on Android:** Works once you configure the Android OAuth client ID in Google Cloud Console (requires the app's SHA-1 signing fingerprint from EAS).

**Commands:**
```bash
eas build --platform android --profile preview
```

**Lesson:** Android is the most accessible platform for distributing a learning project. No fees, no gatekeeping, just a file download.

---

## 8. Firestore Compound Queries — Composite Index Required

**What happened:** Filtering the library by playlist crashed with `failed-precondition` error.

**Why:** Firestore requires a composite index for any query that combines `where` and `orderBy` on different fields. Without the index, the query is rejected at runtime.

**Fix:** Removed `orderBy` from the compound query and sorted client-side instead.

```js
// Before (crashes without composite index)
query(ref, where('playlist', '==', filter), orderBy('downloadedAt', 'desc'))

// After (no index needed, sort in JS)
query(ref, where('playlist', '==', filter))
// then: docs.sort((a, b) => b.downloadedAt.toMillis() - a.downloadedAt.toMillis())
```

**Lesson:** Firestore compound queries are powerful but require upfront index setup. For small datasets, client-side sorting is simpler and avoids index management entirely. The error message does include a direct URL to create the index if you prefer to go that route.

---

## 9. Expo SDK — Never Manually Set Package Versions

**What happened:** Manually setting `react@18.3.2` in `package.json` caused a `TurboModuleRegistry PlatformConstants` crash on device. That exact React version doesn't exist on npm. Manually setting `react-native` caused a version mismatch with Expo Go's compiled runtime.

**Fix:** Always use `npx expo install` for Expo-related packages. Never use `npm install` with specific versions for React, React Native, or Expo packages.

```bash
# Wrong
npm install react@18.3.2

# Right
npx expo install react
```

**Lesson:** Expo manages a precise dependency tree. Fighting it causes subtle, hard-to-debug runtime crashes. Let `npx expo install` pin everything — it knows which versions are compatible with the installed SDK.

---

## 10. ffmpeg on Windows — Path Must Be Hardcoded

**What happened:** yt-dlp couldn't find ffmpeg on Windows even though it was installed via winget. The `ffmpeg` command wasn't on PATH in the Node.js process environment.

**Fix:** Hardcoded the full ffmpeg path and passed it via `--ffmpeg-location`.

```js
const FFMPEG_LOCATION = process.platform === 'win32'
  ? 'C:\\Users\\vibud\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_...\\bin\\ffmpeg.exe'
  : 'ffmpeg'; // Linux/Mac: ffmpeg is on PATH
```

**Lesson:** PATH environment variables in Node.js child processes don't always match your terminal's PATH, especially on Windows. When a tool isn't found, pass its absolute path explicitly rather than relying on PATH resolution.

---

## 11. yt-dlp Video Format Merging — Force mp4 Output

**What happened:** Downloaded videos played as audio-only — black screen, no picture.

**Why:** yt-dlp downloads the best video and audio streams separately, then uses ffmpeg to merge them. When the stream codecs aren't natively compatible with the mp4 container, ffmpeg silently falls back to `.mkv`. The backend was looking for `.mp4` and failing, or the mobile player couldn't play the `.mkv`.

**Fix:** Added `--merge-output-format mp4` to force the output container. Also switched from hardcoding the `.mp4` extension to globbing for the actual output file by UUID prefix.

```js
formatArgs = [
  '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/...',
  '--merge-output-format', 'mp4',
];

// Find actual output file instead of assuming .mp4
const files = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith(id));
resolve(path.join(DOWNLOADS_DIR, files[0]));
```

**Lesson:** Never assume yt-dlp's output extension. Always discover the actual file. Use `--merge-output-format` to enforce container type when you need a specific format.

---

## 12. Audio Background Playback — Session Must Be Set Before Player Creates

**What happened:** Audio stopped playing when the screen locked or the app was backgrounded, despite `UIBackgroundModes: ["audio"]` being set in `app.json`.

**Why:** `setAudioModeAsync` was being called inside the `AudioPlayer` component's `useEffect`, which runs after the component mounts — meaning after `useAudioPlayer` had already created the player. The audio session configuration was arriving too late.

**Fix:** Moved `setAudioModeAsync` to `App.js` at module level, so it runs once at app startup before any screen renders.

```js
// App.js — runs immediately when the app loads
setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: true,
}).catch(() => {});
```

**Note:** The fix was applied but background playback is still not working on device. Further investigation needed — possibly an expo-audio SDK 54 API difference.

---

## 13. No Cloud File Storage — Files Go Phone-Direct

**Decision:** Files are never uploaded to Firebase Storage or any cloud. The backend streams the file directly from its `/tmp` folder to the phone, which saves it to local device storage.

**Why this is better for this project:**
- Zero storage costs (Firebase Storage charges for data stored and downloaded)
- Simpler architecture — no upload step, no storage URLs to manage
- Files are immediately available offline once downloaded
- Backend `/tmp` is cleaned up automatically after serving

**Trade-off:** Files aren't backed up. If you delete the app or the file, it's gone. Cross-device sync would require cloud storage.

**Lesson:** For a personal offline media app, device-local storage is the right call. Don't over-engineer with cloud storage when the use case doesn't need it.

---

## 14. Async Download Architecture — Poll Don't Wait

**Decision:** Downloads are async. The backend starts the job and returns a `jobId` immediately. The mobile app polls `/api/status/:jobId` every few seconds until `status === 'done'`, then fetches the file.

**Why not just wait for the download synchronously?**
- yt-dlp can take 30–120 seconds for large files
- HTTP requests time out well before that
- The user can navigate away and the download keeps running

**Lesson:** Any operation that takes more than a few seconds should be async with a polling or webhook pattern. The job queue pattern (create → poll → fetch) is simple to implement and very reliable.

---

## 15. expo-file-system — SDK 54 Legacy Import

**What happened:** `downloadAsync` stopped working after upgrading to Expo SDK 54.

**Fix:**
```js
// Old (broken in SDK 54)
import * as FileSystem from 'expo-file-system';

// New (SDK 54+)
import * as FileSystem from 'expo-file-system/legacy';
```

**Lesson:** Expo SDK upgrades can break imports. Always check the Expo changelog when upgrading. The `legacy` import path is a temporary bridge — watch for its deprecation in future SDKs.

---

## 16. Docker Base Image — Two Runtimes in One Container

**Decision:** Used `python:3.11-slim` as the base image and installed Node.js 18 on top of it, rather than using a Node base image.

**Why:** yt-dlp is a Python tool. Starting from a Python image and adding Node is cleaner than starting from Node and adding Python + pip. ffmpeg is installed via `apt-get`.

```dockerfile
FROM python:3.11-slim
RUN apt-get install -y nodejs ffmpeg
RUN pip install yt-dlp
```

**Lesson:** When a project needs two runtimes, pick the base image that requires fewer additions. Don't fight the base image.

---

## 17. Free Tier Architecture — Everything Runs at Zero Cost

The entire stack runs for free:

| Layer | Service | Free limit |
|---|---|---|
| Auth + DB | Firebase | Generous free tier (50K reads/day) |
| Backend hosting | Local machine + ngrok | Free |
| Tunnel | ngrok free static domain | 1 permanent domain |
| Mobile builds | EAS Build free tier | 30 builds/month |
| File storage | Device-local | No cost |

**Lesson:** A fully functional personal app doesn't need to cost anything. Design for free tiers from the start — it forces simpler, more honest architecture decisions.

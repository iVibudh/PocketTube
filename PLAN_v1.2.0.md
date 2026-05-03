# PocketTube v1.2.0 — Release Plan

> Current version: **1.1.0** (downloads working, local backend + Cloudflare Tunnel, anonymous dev auth)
> Target version: **1.2.0**

---

## Known Issues from v1.1.0

| # | Issue | Severity |
|---|-------|----------|
| 1 | Audio player does not play downloaded audio files | 🔴 Critical |
| 2 | Video player shows no video — only audio plays | 🔴 Critical |
| 3 | Firestore index error when filtering by playlist | 🔴 Critical |
| 4 | Backend runs on local desktop (not self-contained) | 🟡 High |
| 5 | Cloudflare Tunnel URL changes on every restart | 🟡 High |
| 6 | Speed selector cycles one-by-one instead of showing a list | 🟠 Medium |
| 7 | Google Sign-In does not work in Expo Go | 🟠 Medium |
| 8 | No feedback when library is empty | 🟢 Low |
| 9 | Downloaded video files are not cleaned up if download fails midway | 🟢 Low |

---

## Sprint 1 — Core Playback Fixes 🔴

### 1.1 Fix Audio Playback

**Problem:** Tapping a downloaded audio file in the Library opens the player but audio does not play.

**Root cause to investigate:**
- `item.localUri` may be pointing to a path that no longer exists or was never written correctly
- `expo-audio` `useAudioPlayer` may not be loading the local file URI properly
- The file may have been saved with a wrong extension or path

**Fix:**
- Add a `console.log(item.localUri)` in PlayerScreen to verify the path
- Confirm the file exists at that path using `FileSystem.getInfoAsync(localUri)`
- Ensure the URI uses `file://` prefix if required by expo-audio

---

### 1.2 Fix Video Playback

**Problem:** Downloading a video and opening it in the player shows only audio, no video.

**Root cause to investigate:**
- yt-dlp with `android_vr` client may be downloading an audio-only stream even for "video" format
- The format selector `bestvideo[ext=mp4]+bestaudio[ext=m4a]` requires ffmpeg to merge — confirm merge is happening
- Check if the downloaded file is actually a valid MP4 with a video track

**Fix:**
- Add `--merge-output-format mp4` to the yt-dlp video download command to force a proper merged MP4
- Add `--verbose` temporarily to yt-dlp to confirm what format is being selected
- Verify the output file has both audio and video tracks with `ffprobe`

---

### 1.3 Fix Firestore Index Error (Playlist Filtering)

**Problem:** Switching to any playlist other than "All" throws a Firestore `failed-precondition` error because the query `where('playlist', '==', x) + orderBy('downloadedAt')` requires a composite index.

**Two options:**

**Option A (Quick fix — 2 min):** Click the index creation link from the error message. Firebase creates the index automatically. No code changes needed.

**Option B (Code fix):** Remove the `orderBy` from the Firestore query in LibraryScreen and sort client-side instead:
```js
// Instead of orderBy in Firestore query, sort after fetching:
setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))
  .sort((a, b) => (b.downloadedAt?.seconds ?? 0) - (a.downloadedAt?.seconds ?? 0)));
```

**Recommendation:** Option A for now (instant), Option B for the long term (no index maintenance needed).

---

## Sprint 2 — Remove Local Desktop Dependency 🟡

### 2.1 Problem Statement

The backend currently runs on the user's local Windows machine and is exposed via a Cloudflare Tunnel. This means:
- The backend is unavailable when the computer is off or sleeping
- The Cloudflare Tunnel URL changes every time `cloudflared` is restarted
- `constants.js` has to be manually updated with the new URL each time

### 2.2 Root Cause

Railway and Render both use datacenter IPs that YouTube has blocklisted. yt-dlp returns "Sign in to confirm you're not a bot" from these IPs.

### 2.3 Options

| Option | Description | Cost | Permanence |
|--------|-------------|------|------------|
| A | Named Cloudflare Tunnel (free, permanent URL) | Free | Permanent URL, still needs computer on |
| B | VPS with residential-like IP (Hetzner, Contabo) | ~$4/month | Fully self-contained |
| C | yt-dlp with YouTube cookies on Render | Free | Cookies expire, manual refresh |
| D | YouTube Data API v3 + third-party download proxy | Free tier | Fragile, third-party dependency |

**Recommendation for v1.2.0:** Option A — set up a named Cloudflare Tunnel with a permanent subdomain. The URL never changes, so `constants.js` never needs updating. The computer still needs to be on to download, but that's acceptable for personal use.

**Steps for Option A:**
1. Create a free Cloudflare account
2. Run `cloudflared tunnel create pockettube`
3. Configure a permanent subdomain (e.g. `api.yourdomain.com` or use Cloudflare's free `*.cfargotunnel.com`)
4. Update `BACKEND_URL` in `constants.js` once — never change it again
5. Run `cloudflared tunnel run pockettube` instead of the ad-hoc `--url` command

---

## Sprint 3 — UX Improvements 🟠

### 3.1 Speed Selector — Show List Instead of Cycling

**Problem:** Tapping the speed button cycles through speeds one at a time. Hard to jump from 1.0× to 2.5× directly.

**Fix:** Replace the cycle-through button with a Modal that shows all speeds as a list. User taps the speed they want.

```
┌─────────────────┐
│  Playback Speed  │
│                  │
│  ○  0.6×         │
│  ○  1.0×  ← active│
│  ○  1.5×         │
│  ○  1.75×        │
│  ○  2.0×         │
│  ○  2.25×        │
│  ○  2.5×         │
│  ○  2.75×        │
│  ○  3.0×         │
│                  │
│     [Cancel]     │
└─────────────────┘
```

Applies to both AudioPlayer and VideoPlayer components in `PlayerScreen.js`.

---

### 3.2 Google Sign-In (TestFlight Build)

**Problem:** Google Sign-In is blocked in Expo Go because Google rejects `exp://` redirect URIs.

**Fix:** Build a proper development build using EAS Build and distribute via TestFlight.

**Steps:**
1. `npm install -g eas-cli`
2. `eas build:configure`
3. `eas build --platform ios --profile development`
4. Install the `.ipa` via TestFlight
5. The app now uses the `pockettube://` scheme, which Google accepts
6. Remove the `__DEV__` anonymous auth button

This is a pre-requisite for the App Store submission and real user testing.

---

### 3.3 Empty Library State

**Problem:** When no files are downloaded, the Library shows a blank screen with no guidance.

**Fix:** Add an empty state component:
```
🎵
No downloads yet
Go to the Download tab and paste a YouTube URL to get started
[Go to Download →]
```

---

## Sprint 4 — Stability & Polish 🟢

### 4.1 Partial Download Cleanup

**Problem:** If a download fails after the file has been partially written to the device, the partial file remains in `documentDirectory`.

**Fix:** In the catch block of `handleDownload` in `DownloadScreen.js`, check if the local file exists and delete it:
```js
} catch (err) {
  if (localUri) {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) await FileSystem.deleteAsync(localUri, { idempotent: true });
  }
  setPhase('ready');
  Alert.alert('Download failed', err.message);
}
```

### 4.2 Add README Troubleshooting Entries

- Document the Firestore index issue and fix
- Document the ffmpeg PATH issue on Windows
- Document the named Cloudflare Tunnel setup

### 4.3 Commit All Changes to Git

All changes made during v1.1.0 debugging are uncommitted. Before v1.2.0 work begins, commit everything:
```bash
git add -A
git commit -m "v1.1.0: downloads working, local backend, anonymous auth"
git push
```

---

## Summary

| Sprint | Focus | Est. Time |
|--------|-------|-----------|
| Sprint 1 | Fix audio, video, Firestore index | 2–3 hours |
| Sprint 2 | Named Cloudflare Tunnel (permanent URL) | 30 min |
| Sprint 3 | Speed selector UI, Google Auth (TestFlight) | 3–4 hours |
| Sprint 4 | Stability, cleanup, README, git commit | 1 hour |

**Total estimated time:** 1–2 days

---

*Plan created: 2026-05-03 · Targeting release: v1.2.0*

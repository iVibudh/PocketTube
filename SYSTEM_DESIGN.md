# PocketTube — System Design

> Interview-style design document covering architecture, data flow, API design, infrastructure decisions, and trade-offs.

---

## 1. Problem Statement

Design a personal mobile application that allows a user to download YouTube audio and video to their iPhone for fully offline playback — no ads, no streaming, no recurring cost.

---

## 2. Requirements

### 2.1 Functional Requirements

| # | Requirement |
|---|---|
| FR-1 | User authenticates via Google OAuth; session persists across app restarts |
| FR-2 | User pastes a YouTube URL and receives metadata (title, thumbnail, duration, available resolutions) |
| FR-3 | User selects format (audio MP3 or video MP4) and resolution, then triggers a download |
| FR-4 | Download progress is shown in real time; user can navigate the app while it runs |
| FR-5 | Completed files are saved locally on the device for fully offline playback |
| FR-6 | User browses downloaded files in a library, filterable by playlist category |
| FR-7 | Audio player supports background playback, lock-screen controls, seek, and variable speed |
| FR-8 | Video player supports full-screen playback with native transport controls |
| FR-9 | User can delete files from the library, freeing device storage |
| FR-10 | Duplicate detection — warn user if the same URL has already been downloaded |

### 2.2 Non-Functional Requirements

| Dimension | Target |
|---|---|
| Scale | Single user (personal use only) |
| Cost | Free tier infrastructure; <$10/month total |
| Availability | Best-effort; occasional downtime acceptable |
| Latency | Metadata fetch <3s; download <5 min for a typical 5-min video |
| Security | Only authenticated users can trigger downloads; service account credentials never committed to git |
| Offline | All playback must work with zero internet connectivity after download |
| Platform | iOS primary; Android secondary |

### 2.3 Constraints

- No public app store distribution — personal TestFlight or Expo Go only
- YouTube ToS compliance is the user's personal responsibility
- Single-region deployment is acceptable
- No budget for paid services beyond Apple Developer account ($99/yr)

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        iPhone (Expo Go)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Login   │  │   Download   │  │  Library │  │   Player   │  │
│  │  Screen  │  │   Screen     │  │  Screen  │  │   Screen   │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └────────────┘  │
│       │               │               │                           │
│  Firebase SDK    REST API calls   Firestore SDK                  │
└───────┼───────────────┼───────────────┼───────────────────────────┘
        │               │               │
        ▼               ▼               ▼
┌───────────────┐  ┌─────────────────────────┐
│   Firebase    │  │    Node.js Backend       │
│               │  │    (Render.com)           │
│  ┌──────────┐ │  │                          │
│  │  Auth    │ │  │  ┌───────────────────┐   │
│  │ (Google  │ │  │  │  Firebase Admin   │   │
│  │ + Anon)  │ │  │  │  (token verify)   │   │
│  └──────────┘ │  │  └───────────────────┘   │
│               │  │                          │
│  ┌──────────┐ │  │  ┌───────────────────┐   │
│  │Firestore │ │  │  │     yt-dlp        │   │
│  │(metadata │ │  │  │ (download engine) │   │
│  │+playlists│ │  │  └───────────────────┘   │
│  └──────────┘ │  │                          │
└───────────────┘  │  ┌───────────────────┐   │
                   │  │     ffmpeg        │   │
                   │  │ (audio conversion)│   │
                   │  └───────────────────┘   │
                   │                          │
                   │  ┌───────────────────┐   │
                   │  │   /tmp/downloads  │   │
                   │  │ (ephemeral files) │   │
                   │  └───────────────────┘   │
                   └──────────────────────────┘
```

**Key design choice:** Files never touch the cloud. The backend downloads to `/tmp`, streams the file directly to the device, then deletes the temp file. No Firebase Storage, no S3 — zero storage cost.

---

## 4. Component Breakdown

### 4.1 Mobile App (React Native + Expo SDK 54)

| Component | Responsibility |
|---|---|
| `LoginScreen` | Google OAuth via expo-auth-session; dev anonymous auth for Expo Go testing |
| `DownloadScreen` | URL input, metadata fetch, format/playlist selection, async download with progress bar |
| `LibraryScreen` | Real-time Firestore listener, playlist filter chips, thumbnail cards, delete handler |
| `PlayerScreen` | expo-audio (AudioPlayer) + expo-video (VideoPlayer); seek bar, speed control, skip ±15s |
| `App.js` | Navigation root; auth state machine (splash → login → main tabs → player) |
| `firebase.js` | Firebase init; `initializeAuth` with AsyncStorage persistence so session survives restarts |
| `constants.js` | `BACKEND_URL`, `COLORS`, `PLAYLISTS` — single source of truth |

### 4.2 Backend (Node.js + Express, Docker)

| Component | Responsibility |
|---|---|
| `routes/info.js` | `POST /api/info` — runs yt-dlp `--dump-json`, returns metadata to app |
| `routes/download.js` | `POST /api/download` — creates job, returns jobId immediately, runs yt-dlp async |
| `routes/status.js` | `GET /api/status/:jobId` — returns progress (0–100) and status |
| `routes/file.js` | `GET /api/file/:jobId` — streams completed file to device, deletes from /tmp |
| `middleware/auth.js` | Verifies Firebase ID token on every `/api/*` request via Firebase Admin SDK |
| `middleware/planCheck.js` | Placeholder for future plan enforcement (free tier file cap) |
| `utils/ytdlp.js` | yt-dlp wrapper with progress parsing, iOS player client flag, format args |
| `utils/jobs.js` | In-memory job store (Map); tracks status, progress, file path per jobId |
| `utils/firebase.js` | Firebase Admin init; reads service account from `FIREBASE_SERVICE_ACCOUNT` env var (base64 JSON) |

---

## 5. Data Flow — Download

```
User pastes URL
      │
      ▼
App → POST /api/info (Bearer: <idToken>)
      │
      ├── Backend: verifyIdToken(token) via Firebase Admin
      ├── Backend: yt-dlp --dump-json --extractor-args youtube:player_client=ios,web <url>
      └── Returns: { title, thumbnail, duration, formats[] }
      │
      ▼
User selects format + playlist → taps Download
      │
      ▼
App → POST /api/download { url, format, resolution, metadata }
      │
      ├── Backend: createJob() → returns { jobId } immediately
      └── Background: yt-dlp downloads to /tmp/downloads/<uuid>.<ext>
      │
      ▼
App polls GET /api/status/:jobId every 1.5s
      │
      ├── { status: "downloading", progress: 45 }  → animate progress bar
      └── { status: "done", progress: 100 }
      │
      ▼
App → FileSystem.downloadAsync(BACKEND_URL/api/file/:jobId, localUri)
      │
      ├── Backend streams file from /tmp → device
      └── Backend deletes /tmp file after transfer
      │
      ▼
App saves metadata to Firestore: users/{uid}/media/{docId}
{ title, channel, thumbnail, localUri, format, playlist, sourceUrl, createdAt }
      │
      ▼
Library screen updates in real time via Firestore onSnapshot listener
```

---

## 6. API Design

All `/api/*` endpoints require `Authorization: Bearer <Firebase ID Token>`.

| Method | Path | Request Body | Response | Description |
|--------|------|-------------|----------|-------------|
| GET | `/health` | — | `{ status: "ok" }` | Public health check |
| POST | `/api/info` | `{ url }` | `{ title, channel, duration, thumbnailUrl, formats[] }` | Fetch video metadata without downloading |
| POST | `/api/download` | `{ url, format, resolution, metadata }` | `{ jobId }` | Start async download job |
| GET | `/api/status/:jobId` | — | `{ status, progress, error? }` | Poll job progress (0–100) |
| GET | `/api/file/:jobId` | — | Binary file stream | Stream completed file to device |

### Error responses

All errors return `{ error: string }` with an appropriate HTTP status:
- `401` — missing or invalid Firebase token
- `400` — missing required fields
- `404` — job not found or file expired
- `500` — yt-dlp failure (error message forwarded)

---

## 7. Data Model

### Firestore — `users/{uid}/media/{docId}`

```js
{
  videoId:      string,    // YouTube video ID
  title:        string,    // Video title from yt-dlp
  channel:      string,    // Channel/uploader name
  thumbnailUrl: string,    // Remote thumbnail URL (for display)
  localUri:     string,    // expo-file-system path on device
  format:       "audio" | "video",
  resolution:   string | null,  // e.g. "720" — null for audio
  playlist:     string,    // One of: General, Music, Podcasts, Sleep, Focus, Language, Videos
  sourceUrl:    string,    // Original YouTube URL
  duration:     number,    // Seconds
  createdAt:    Timestamp,
}
```

### Firestore — `users/{uid}/meta/playlists`

```js
{
  lists:   string[],   // ["General", "Music", "Podcasts", ...]
  created: Timestamp,
}
```

### In-memory job store (backend, not persisted)

```js
{
  [jobId: string]: {
    status:   "pending" | "downloading" | "done" | "error",
    progress: number,      // 0–100
    result:   {
      localPath: string,
      filename:  string,
      format:    string,
      metadata:  object,
    } | null,
    error: string | null,
  }
}
```

**Note:** Jobs are stored in memory only — they are lost on server restart. Acceptable for personal use; for production, replace with Redis.

---

## 8. Infrastructure Decision Log

### Decision 1 — No cloud file storage

**Options considered:** Firebase Storage, AWS S3, serve files from server.

**Decision:** Stream directly from server `/tmp` to device, delete after transfer.

**Rationale:** Files only need to exist in one place — the device. Cloud storage adds cost (~$0.02/GB) and complexity (upload → store → download). Direct streaming is faster and free.

**Trade-off:** If the device download fails mid-transfer, the user must re-download. Acceptable for personal use.

---

### Decision 2 — Async job model vs. synchronous streaming

**Options considered:**
- Synchronous: keep HTTP connection open while yt-dlp runs, stream on completion
- Async: return jobId immediately, app polls for progress

**Decision:** Async with polling.

**Rationale:** Downloads take 30s–5 minutes. HTTP proxies (including Railway and Render) time out long-lived connections after 30–60 seconds. The async model also enables progress display and lets the user navigate the app while waiting.

**Trade-off:** Slightly more complex client code; in-memory job store is lost on restart.

---

### Decision 3 — Hosting: Railway → Render

**Problem:** After deploying to Railway (us-east4 region), yt-dlp requests to YouTube fail with:

```
ERROR: [youtube] Sign in to confirm you're not a bot.
Use --cookies-from-browser or --cookies for authentication.
```

This occurs even with `--extractor-args youtube:player_client=ios,web` and `--no-check-certificates`.

**Root cause:** YouTube maintains IP reputation scores. Shared datacenter IP ranges that have historically been used for scraping get blocklisted at the network level. Railway's IP range has a high scraping history. This is not a yt-dlp configuration issue — it is an IP-level block.

**Options evaluated:**

| Option | Reliability | Cost | Complexity | Verdict |
|--------|-------------|------|------------|---------|
| Pass browser cookies | High (initially) | Free | Medium | Rejected — cookies expire, manual refresh required, security risk |
| Residential proxy | Very high | ~$50/month | Low | Rejected — cost exceeds project budget |
| Switch to Render.com | High (for now) | Free | Low | ✅ Selected |
| Local backend + Cloudflare Tunnel | Definitively solves it | Free | Medium | Fallback if Render also gets blocked |
| yt-dlp PO token | High | Free | High | Future option if needed |

**Decision:** Migrate backend to Render.com.

**Rationale:** Render's IP ranges have lower scraping history than Railway's. Zero code changes required — only the `BACKEND_URL` in `constants.js` changes. Free tier is sufficient for personal use (750 hrs/month).

**Known risk:** Render's IPs could eventually be blocked too. If that happens, the fallback is Option 4 (local backend + Cloudflare Tunnel), which is definitively immune since home/office IPs are almost never targeted.

---

### Decision 4 — Firebase service account via environment variable

**Problem:** `firebase-service-account.json` is in `.gitignore` (correct — it contains a private key). Railway/Render deploy from git, so the file was missing on the server, causing `admin.auth().verifyIdToken()` to fail with `auth/invalid-credential`.

**Decision:** Store the service account JSON as a base64-encoded environment variable `FIREBASE_SERVICE_ACCOUNT`. Backend decodes it at startup:

```js
const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
const serviceAccount = JSON.parse(raw);
credential = admin.credential.cert(serviceAccount);
```

**Rationale:** Base64 avoids newline corruption that occurs when pasting multi-line JSON (particularly the RSA private key) into hosting provider env var UIs. The secret never touches git history.

---

## 9. Security Considerations

| Risk | Mitigation |
|------|-----------|
| Unauthorized downloads | Every `/api/*` request verified via Firebase Admin `verifyIdToken()` — no token, no access |
| Service account key exposure | Stored as base64 env var, never committed to git; `.gitignore` blocks accidental commit |
| Backend URL exposure | URL is in `constants.js` which is in a private repo; acceptable for personal use |
| Anonymous auth dev button | Hidden behind `__DEV__` flag; must be removed before TestFlight release |
| Temp file exposure | Files deleted from `/tmp` immediately after streaming; no persistent server storage |

---

## 10. Trade-offs & What I'd Revisit at Scale

| Current Approach | Limitation | Production Alternative |
|-----------------|------------|----------------------|
| In-memory job store | Lost on restart | Redis or Postgres-backed queue |
| No job TTL/cleanup | `/tmp` and memory accumulate | Cron job to evict jobs older than 1 hour |
| Single server instance | No horizontal scale | Stateless workers + shared Redis job store |
| Anonymous auth for dev | Must be manually removed | Feature flag system (e.g. LaunchDarkly) |
| yt-dlp pinned to latest | YouTube breaks yt-dlp regularly | Pin specific version; automated update checks |
| No retry logic | Network blip = failed download | Exponential backoff on yt-dlp errors |
| No download queue | N simultaneous downloads = N yt-dlp processes | Bull/BullMQ queue with concurrency limit |
| `onSnapshot` always active | Firestore reads on every app open | Paginated fetch with manual refresh |

---

*Document version 1.0 — reflects system state as of Phase 6 completion*

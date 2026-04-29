# PocketTube — Backend

Node.js API that handles YouTube downloads. Receives a URL from the mobile app, runs `yt-dlp` to download audio or video, uploads the file to Firebase Storage, and returns a signed download URL.

---

## Stack

| Tool | Purpose |
|---|---|
| Node.js + Express | HTTP API server |
| yt-dlp | YouTube download engine |
| ffmpeg | Audio conversion (MP3) |
| firebase-admin | Upload to Firebase Storage |
| Docker | Container for Cloud Run deployment |

---

## Folder Structure

```
backend/
  src/
    index.js                    ← Express server entry point
    routes/
      download.js               ← POST /api/download handler
    utils/
      ytdlp.js                  ← Spawns yt-dlp as a subprocess
      storage.js                ← Uploads file to Firebase Storage
  firebase-service-account.json ← Secret key (never commit)
  .env                          ← Environment variables (never commit)
  .gitignore
  Dockerfile
  package.json
```

---

## Environment Variables

Create a `.env` file in this folder:

```
FIREBASE_BUCKET=pockettube-1a180.firebasestorage.app
PORT=8080
```

---

## Firebase Service Account

Place `firebase-service-account.json` in this folder (downloaded from Firebase Console → Project Settings → Service Accounts → Generate new private key).

This file is listed in `.gitignore` — never commit it.

---

## Local Development

### Prerequisites

- Node.js v18+
- Python 3.10+ with `yt-dlp` installed globally: `pip install yt-dlp`
- ffmpeg installed and on PATH: [ffmpeg.org](https://ffmpeg.org)

> **Why global and not a venv?** Node spawns `yt-dlp` as a subprocess and looks for it on the system PATH. A venv-installed `yt-dlp` won't be found unless the venv is activated before starting the server.

### Run

```bash
npm install
node src/index.js
```

### Health check

```bash
curl http://localhost:8080/health
# { "status": "ok" }
```

### Test a download

```bash
curl -X POST http://localhost:8080/api/download \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ","format":"audio","userId":"test123"}'
```

---

## API

### `GET /health`

Returns `{ "status": "ok" }`. Used by Cloud Run to verify the container is alive.

---

### `POST /api/download`

Downloads a YouTube video or audio track, uploads it to Firebase Storage, and returns a signed URL.

**Request body**

```json
{
  "url": "https://youtube.com/watch?v=...",
  "format": "audio",
  "userId": "firebase-uid-of-the-user",
  "filename": "optional-custom-name.mp3"
}
```

| Field | Required | Values |
|---|---|---|
| `url` | Yes | Any valid YouTube URL |
| `format` | Yes | `"audio"` or `"video"` |
| `userId` | Yes | Firebase UID — used as the storage path prefix |
| `filename` | No | Custom filename; defaults to the generated UUID name |

**Success response**

```json
{
  "success": true,
  "url": "https://storage.googleapis.com/...",
  "path": "users/uid/filename.mp3"
}
```

**Error response**

```json
{
  "error": "error message here"
}
```

**Format behaviour**

| format | yt-dlp flags | Output |
|---|---|---|
| `audio` | `-x --audio-format mp3 --audio-quality 0` | Best quality MP3 |
| `video` | `-f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4` | Best quality MP4 |

---

## How It Works

1. Mobile app POSTs a YouTube URL + format + userId
2. `ytdlp.js` spawns `yt-dlp` with safe argument arrays (no shell injection)
3. File is written to a temp directory (`/tmp/downloads` on Linux, OS temp dir on Windows)
4. `storage.js` uploads the file to `users/{userId}/{filename}` in Firebase Storage
5. A 7-day signed URL is generated and returned
6. Temp file is deleted after upload

---

## Docker

The Dockerfile uses `python:3.11-slim` as the base (needed for yt-dlp), then installs Node.js 18 and ffmpeg on top.

```bash
# Build image locally
docker build -t pockettube-backend .

# Run locally
docker run -p 8080:8080 \
  -e FIREBASE_BUCKET=pockettube-1a180.firebasestorage.app \
  -v $(pwd)/firebase-service-account.json:/app/firebase-service-account.json \
  pockettube-backend
```

---

## Deployment (Cloud Run)

See Phase 3 in the root `README.md` for full deployment steps. Short version:

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pockettube-backend
gcloud run deploy pockettube-backend \
  --image gcr.io/YOUR_PROJECT_ID/pockettube-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars FIREBASE_BUCKET=pockettube-1a180.firebasestorage.app
```

The `firebase-service-account.json` must be baked into the image or mounted as a secret. For Cloud Run, use **Google Secret Manager** — do not hardcode it in the image.

---

## Security Notes

- `.env` and `firebase-service-account.json` are in `.gitignore` — confirm before every commit
- `userId` in the download route is currently trusted from the request body — Phase 4 adds Firebase Auth token verification to lock this down
- `yt-dlp` is called with `spawn` + argument arrays, not `exec` with a shell string, to prevent command injection

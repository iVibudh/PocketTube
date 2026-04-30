# 🎵 PocketTube

> **A personal YouTube audio & video downloader for iOS and Android**
> Built with React Native + Expo · Railway · Firebase

---

## ⚠️ Disclaimer — Personal & Learning Use Only

This project was built **strictly for personal and educational purposes**. I do not intend to distribute this app publicly, submit it to any app store, or commercialize it in any form.

Downloading YouTube content may violate [YouTube's Terms of Service (Section 5)](https://www.youtube.com/t/terms). By following this guide you accept full responsibility for how you use it. Please:

- Only download content you own or have rights to
- Never redistribute downloaded content
- Keep your deployment private — do not share your backend URL publicly
- Consider [YouTube Premium](https://www.youtube.com/premium) as the official alternative

---

## 📖 Background

I wanted a simple way to save YouTube videos and audio to my phone for offline use — things like language learning lessons, focus music playlists, podcasts, and sleep sounds. No existing app did exactly what I wanted without ads, paywalls, or sketchy permissions.

So I built **PocketTube**: a clean personal app where I paste a YouTube link, choose the format and quality I want, and the file downloads straight to my phone — ready to play offline, no internet needed.

This repo is a learning project. It covers React Native, Expo, Google OAuth, Firebase, Docker, Railway, and iOS distribution via TestFlight — all using free tiers where possible.

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

> 💳 **Payment implementation — placeholder for a future release.** In-app purchases on iOS require Apple's StoreKit and on Android require Google Play Billing — both platforms take a 15–30% cut of each transaction. No additional third-party payment library is planned at this stage; native platform IAP is the simplest path with no extra fees beyond the store's standard cut. This feature will be scoped and implemented in a dedicated release.

### 🗂️ Playlists *(tentative — may not be included in v1)*
- Optionally organize downloads into playlist categories: Music, Podcasts, Sleep, Focus, Language, Videos, General

### ☁️ Infrastructure
- Metadata synced to Firestore across devices
- Runs entirely on free tiers (except Apple Developer account and payment processing fees)

---

## 🏗️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Mobile App | React Native + Expo | Free |
| Authentication | Firebase (Google Auth) | Free tier |
| Database / Metadata | Firebase Firestore | Free tier |
| File Storage | Device-local only (no cloud storage) | Free |
| Download Engine | yt-dlp + Node.js backend | Free |
| Cloud Hosting | Railway | Free tier ($5/mo credit) |
| In-App Payments | Apple StoreKit + Google Play Billing *(future release)* | 15–30% platform cut per transaction |
| iOS Distribution | TestFlight (personal) | $99/yr — Apple Dev account |

---

## 🗺️ Action Plan

| Phase | Goal | Est. Time |
|---|---|---|
| [Phase 1](#phase-1--firebase-setup) | Firebase project, Auth, Firestore, Storage | Day 1 |
| [Phase 2](#phase-2--backend-server) | Node.js backend with yt-dlp + Docker | Days 1–2 |
| [Phase 3](#phase-3--deploy-to-railway) | Deploy backend to Railway (free) | Day 2 |
| [Phase 4](#phase-4--react-native-mobile-app) | Full mobile app — Login, Download, Library, Player | Days 3–7 |
| [Phase 5](#phase-5--ios-distribution-via-testflight) | Build and distribute via TestFlight | Day 8 |
| [Phase 6](#phase-6--google-oauth-client-ids) | Wire up Google OAuth client IDs | Day 8 |
| [Phase 7](#phase-7--playlist-system) | Playlist system and auto-categorization | Day 9 |

---

## 🧰 Prerequisites

Before you start, create these free accounts and install these tools.

### Accounts to Create

| Service | URL | Purpose |
|---|---|---|
| Google Firebase | firebase.google.com | Auth, database, file storage |
| Railway | railway.app | Backend hosting |
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

Your folder structure:

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

## Phase 3 — Deploy to Railway

> **Summary:** Railway hosts your Docker container with a permanent public URL and no cold starts. It builds your image directly from your local files — no Docker Hub or container registry account needed. The free tier gives you $5/month in credits, which runs this backend for ~500 hours — more than enough for personal use. Setup takes about 5 minutes.

---

### Step 3.1 — Create a Railway Account

1. Go to [railway.app](https://railway.app) → sign up (easiest with your GitHub account)
2. No billing setup required — the free $5/month credit is applied automatically

---

### Step 3.2 — Install the Railway CLI and Log In

```bash
npm install -g @railway/cli
railway login
```

This opens a browser window to complete authentication. Once done, your terminal is connected to your Railway account.

---

### Step 3.3 — Add a `.railwayignore` File

Railway CLI respects `.railwayignore` (not `.gitignore`) when deciding what to upload. You need `firebase-service-account.json` on the server, so create a separate ignore file that only excludes `node_modules` and the local `.env` (Railway manages env vars separately):

Create `backend/.railwayignore`:

```
node_modules/
.env
```

> ⚠️ Do **not** add `firebase-service-account.json` here. Railway needs it to authenticate with Firebase. It stays out of Git (via `.gitignore`) but must be uploaded to Railway.

---

### Step 3.4 — Initialize the Railway Project

From inside the `backend/` folder:

```bash
cd backend
railway init
```

When prompted:
- **Create a new project** → select this
- **Project name** → `pockettube`

Railway creates a new project in your dashboard and links it to this folder.

---

### Step 3.5 — Set Environment Variables

Set your environment variables in Railway before deploying (the `.env` file is ignored by Railway and should never be committed):

```bash
railway variables set PORT=8080
```

> `FIREBASE_BUCKET` is no longer needed — Firebase Storage is not used by the backend.

You can also manage these in the Railway dashboard under **Project → Variables**.

---

### Step 3.6 — Deploy

```bash
railway up
```

Railway uploads your files, builds the Docker image using your `Dockerfile`, and starts the container. The first build takes 3–5 minutes (it installs Node, Python, ffmpeg, and yt-dlp). Subsequent deploys are faster.

You'll see a build log stream in your terminal. When it finishes you'll see:

```
✅  Deployment successful
```

---

### Step 3.7 — Get Your Public URL

Railway doesn't generate a public URL automatically — you need to enable it once:

1. Go to [railway.app](https://railway.app) → open your `pockettube` project
2. Click your service → **Settings** tab → **Networking** section
3. Click **Generate Domain**

Your URL will look like:
`https://pockettube-production.up.railway.app`

This is your `BACKEND_URL`. Save it — you'll use it in Phase 4.

Alternatively, generate it from the CLI:

```bash
railway domain
```

---

### Step 3.8 — Test the Deployed Backend

```bash
# Health check
curl https://YOUR_RAILWAY_URL/health
# Expected: {"status":"ok"}

# Start a download job (requires a real Firebase ID token from the mobile app)
# The health check above is enough to confirm the backend is live at this stage
```

> 💡 **Free Tier Reminder:** Railway's $5/month credit covers ~500 hours of a small container. For a personal app that you use a few times a week, you will stay well within the free limit. Monitor usage in the Railway dashboard under **Usage**.

---

### ✅ Phase 3 Checklist

- [ ] Railway account created at railway.app
- [ ] Railway CLI installed and `railway login` completed
- [ ] `backend/.railwayignore` created (excludes `node_modules/` and `.env` only)
- [ ] `railway init` run inside `backend/` folder
- [ ] Environment variable set (`PORT=8080`)
- [ ] `railway up` deployed successfully
- [ ] Public domain generated in Railway dashboard
- [ ] `BACKEND_URL` saved
- [ ] Health check and download test both return successful responses

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

## Phase 5 — iOS Distribution via TestFlight

> **Summary:** TestFlight is Apple's official beta testing platform and the cleanest way to install a personal app on your iPhone without going through App Store review. You need a paid Apple Developer account ($99/yr). Expo's EAS (Expo Application Services) builds the `.ipa` file for you and submits it directly to TestFlight with a single command.

---

### Step 5.1 — Apple Developer Account

1. Go to [developer.apple.com](https://developer.apple.com) → enroll in the **Apple Developer Program** ($99/yr)
2. Once approved, go to **Certificates, Identifiers & Profiles**
3. Create an **App ID**: `com.yourname.pockettube`

---

### Step 5.2 — Update `app.json`

```json
{
  "expo": {
    "name": "PocketTube",
    "slug": "pockettube",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.yourname.pockettube",
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "UIFileSharingEnabled": true,
        "LSSupportsOpeningDocumentsInPlace": true
      }
    },
    "android": {
      "package": "com.yourname.pockettube",
      "permissions": ["READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    }
  }
}
```

---

### Step 5.3 — Build and Submit with EAS

```bash
# Log in to Expo
eas login

# Initialize EAS build config
eas build:configure

# Build for iOS (.ipa file — takes ~15 min)
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

EAS will guide you through connecting your Apple Developer account. Once submitted, open **App Store Connect → TestFlight** and install the app on your iPhone.

> 💡 **Skip this during development.** Use Expo Go while you're actively building. Only go through TestFlight when you want a permanent install that works like a real app.

---

### ✅ Phase 5 Checklist

- [ ] Apple Developer account enrolled ($99/yr)
- [ ] App ID `com.yourname.pockettube` created in Apple Developer portal
- [ ] `app.json` updated with bundle identifier and background audio permission
- [ ] `eas login` completed
- [ ] `eas build:configure` run
- [ ] iOS build completed successfully
- [ ] App submitted to TestFlight
- [ ] App installed on your iPhone via TestFlight

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
| Railway | $5/month free credit (~500 hrs) | $0 |
| Expo EAS Build | 30 builds/month | $0 |
| Apple Developer | — | $99/yr one-time |
| **Total (excl. Apple)** | — | **$0/mo** |

> **Storage tip:** All media files are saved directly to your phone by the mobile app using `expo-file-system`. Nothing is uploaded to the cloud, so there are no storage costs regardless of how much you download.

---

## 🐛 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| yt-dlp fails on Railway | Not installed in Docker image | Verify `Dockerfile` has `pip install yt-dlp` |
| Railway build times out | Large Docker image (ffmpeg + yt-dlp) | Normal — first build takes 3–5 min; subsequent builds are faster |
| Railway deploy succeeds but health check fails | `PORT` env var not set | Run `railway variables set PORT=8080` |
| `firebase-service-account.json` not found on server | File excluded from upload | Check `.railwayignore` — it should NOT list the service account file |
| Google sign-in error | Wrong client ID | Double-check all 3 OAuth client IDs match |
| File not found on phone | Wrong `localUri` | Log `FileSystem.documentDirectory` to verify path |
| Audio won't play in background | Missing plist key | Add `UIBackgroundModes: ["audio"]` to `app.json` |
| Firebase Storage 403 error | Wrong security rules | Re-check Phase 1 Step 1.4 rules and re-publish |
| Railway free credits running low | Container running continuously | Railway dashboard → Usage to monitor; container stays on but usage is minimal at rest |

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

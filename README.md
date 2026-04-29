# 🎵 PocketTube

> **A personal YouTube audio & video downloader for iOS and Android**
> Built with React Native + Expo · Google Cloud Run · Firebase

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

So I built **PocketTube**: a clean personal app where I paste a YouTube link, pick audio or video, choose a playlist category, and the file downloads straight to my phone. Everything is organized into playlists (Music, Podcasts, Sleep, Focus, Language, Videos) and plays back natively — including background audio on iOS.

This repo is a learning project. It covers React Native, Expo, Google OAuth, Firebase, Docker, Google Cloud Run, and iOS distribution via TestFlight — all using free tiers where possible.

---

## ✨ Features

- 🔐 Google Sign-In (Firebase Auth)
- 🔗 Paste any YouTube URL → choose Audio (MP3) or Video (MP4)
- 📂 Organize downloads into playlists: Music, Podcasts, Sleep, Focus, Language, Videos, General
- 📱 Files save locally to your device for offline playback
- 🎧 Background audio playback on iOS (lock screen controls)
- ☁️ Metadata synced to Firestore across devices
- 💸 Runs entirely on free tiers (except Apple Developer account)

---

## 🏗️ Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Mobile App | React Native + Expo | Free |
| Authentication | Firebase (Google Auth) | Free tier |
| Database / Metadata | Firebase Firestore | Free tier |
| File Storage | Firebase Storage | Free tier (5 GB) |
| Download Engine | yt-dlp + Node.js backend | Free |
| Cloud Hosting | Google Cloud Run | Free tier (2M req/mo) |
| iOS Distribution | TestFlight (personal) | $99/yr — Apple Dev account |

---

## 🗺️ Action Plan

| Phase | Goal | Est. Time |
|---|---|---|
| [Phase 1](#phase-1--firebase-setup) | Firebase project, Auth, Firestore, Storage | Day 1 |
| [Phase 2](#phase-2--backend-server) | Node.js backend with yt-dlp + Docker | Days 1–2 |
| [Phase 3](#phase-3--deploy-to-google-cloud-run) | Deploy backend to Google Cloud Run (free) | Day 2 |
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
| Google Cloud | cloud.google.com | Cloud Run backend hosting |
| Expo (EAS) | expo.dev | Mobile app builds |
| Apple Developer | developer.apple.com | TestFlight ($99/yr) |
| GitHub | github.com | Version control |

### Install on Your Computer

- **Node.js v18+** — nodejs.org
- **Python 3.10+** — python.org
- **Git** — git-scm.com
- **Google Cloud CLI** — cloud.google.com/sdk
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

### Step 1.4 — Create Firebase Storage

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
- [ ] Firebase Storage created with security rules published
- [ ] `firebaseConfig` object copied and saved somewhere safe
- [ ] `firebase-service-account.json` downloaded and stored safely

---

## Phase 2 — Backend Server

> **Summary:** The backend is a small Node.js API that does the actual downloading. When the app sends it a YouTube URL, it runs `yt-dlp` to fetch the audio or video, converts it with `ffmpeg`, uploads the file to Firebase Storage, and returns a download link. This runs in a Docker container so it can be deployed to Cloud Run in Phase 3.

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
      download.js                 ← download endpoint
    utils/
      ytdlp.js                    ← yt-dlp wrapper
      storage.js                  ← Firebase Storage helper
  Dockerfile
  .env                            ← secrets (never commit!)
  .gitignore
  firebase-service-account.json   ← from Step 1.5
```

---

### Step 2.2 — Environment Variables

Create `backend/.env`:

```
FIREBASE_BUCKET=your-project-id.appspot.com
PORT=8080
```

Create `backend/.gitignore`:

```
node_modules/
.env
firebase-service-account.json
downloads/
```

---

### Step 2.3 — Main Server (`src/index.js`)

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const downloadRouter = require('./routes/download');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/download', downloadRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`PocketTube backend running on port ${PORT}`);
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

### Step 2.5 — Firebase Storage Utility (`src/utils/storage.js`)

```js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('../../firebase-service-account.json')
    ),
    storageBucket: process.env.FIREBASE_BUCKET
  });
}

const bucket = admin.storage().bucket();

async function uploadFile(localPath, userId, filename) {
  const destination = `users/${userId}/${filename}`;
  await bucket.upload(localPath, {
    destination,
    metadata: {
      contentType: filename.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4'
    }
  });
  const [url] = await bucket.file(destination).getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000  // 7 days
  });
  fs.unlinkSync(localPath); // clean up temp file
  return { url, destination };
}

module.exports = { uploadFile };
```

---

### Step 2.6 — Download Route (`src/routes/download.js`)

```js
const express = require('express');
const router = express.Router();
const { downloadMedia } = require('../utils/ytdlp');
const { uploadFile } = require('../utils/storage');
const path = require('path');

router.post('/', async (req, res) => {
  const { url, format, userId, filename } = req.body;

  if (!url || !format || !userId) {
    return res.status(400).json({ error: 'url, format, userId required' });
  }

  try {
    console.log(`Downloading ${format} from ${url}`);
    const localPath = await downloadMedia(url, format);
    const fname = filename || path.basename(localPath);
    const { url: downloadUrl, destination } = await uploadFile(
      localPath, userId, fname
    );
    res.json({ success: true, url: downloadUrl, path: destination });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 2.7 — Dockerfile

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

### Step 2.8 — Test Locally

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
- [ ] `.env` file created with Firebase bucket name
- [ ] `.gitignore` excludes `.env` and `firebase-service-account.json`
- [ ] `index.js`, `download.js`, `ytdlp.js`, `storage.js` all created
- [ ] `Dockerfile` created
- [ ] Local health check returns `{"status":"ok"}`

---

## Phase 3 — Deploy to Google Cloud Run

> **Summary:** Google Cloud Run hosts your backend as a serverless container. It only runs when a request comes in (so cost is near-zero for personal use) and scales to zero when idle. The free tier covers 2 million requests and 360,000 GB-seconds of compute per month — far more than you'll ever use personally. You build a Docker image and deploy it with two `gcloud` commands.

---

### Step 3.1 — Set Up Google Cloud

1. Go to [cloud.google.com](https://cloud.google.com) → create a new project named `pockettube`
2. Enable billing (required even for free tier — a card is needed but you won't be charged under limits)
3. Authenticate in your terminal:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

4. Enable required APIs:

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

### Step 3.2 — Build and Deploy

From inside the `backend/` folder:

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pockettube-backend

# Deploy to Cloud Run
gcloud run deploy pockettube-backend \
  --image gcr.io/YOUR_PROJECT_ID/pockettube-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars FIREBASE_BUCKET=your-project-id.appspot.com
```

Copy the URL from the output — it looks like:
`https://pockettube-backend-xxxx-uc.a.run.app`

This is your `BACKEND_URL`. Save it.

---

### Step 3.3 — Test the Deployed Backend

```bash
curl -X POST https://YOUR_BACKEND_URL/api/download \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ",
       "format":"audio","userId":"test123"}'
```

> 💡 **Free Tier Reminder:** Cloud Run free tier is 2 million requests/month and 360,000 GB-seconds of compute. Downloading a few videos a day will never come close to these limits.

---

### ✅ Phase 3 Checklist

- [ ] Google Cloud project created
- [ ] Billing enabled on Google Cloud
- [ ] `gcloud auth login` completed successfully
- [ ] All three APIs enabled (run, cloudbuild, artifactregistry)
- [ ] Docker image built and pushed to `gcr.io`
- [ ] Backend deployed to Cloud Run
- [ ] `BACKEND_URL` saved
- [ ] Test curl returns a successful response

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
| Firebase Storage | 5 GB storage, 1 GB/day download | $0 |
| Google Cloud Run | 2M requests, 360K GB-sec/mo | $0 |
| Expo EAS Build | 30 builds/month | $0 |
| Apple Developer | — | $99/yr one-time |
| **Total (excl. Apple)** | — | **$0/mo** |

> **Storage tip:** Firebase Storage's 5 GB free tier holds roughly 1,000 MP3s or 200 videos. If you download heavily, consider saving files device-locally only and skipping Firebase Storage uploads — just store the `localUri` in Firestore.

---

## 🐛 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| yt-dlp fails on Cloud Run | Not installed in Docker image | Verify `Dockerfile` has `pip install yt-dlp` |
| Cloud Run timeout | Long video download | Add `--timeout 300` to deploy command |
| Google sign-in error | Wrong client ID | Double-check all 3 OAuth client IDs match |
| File not found on phone | Wrong `localUri` | Log `FileSystem.documentDirectory` to verify path |
| Audio won't play in background | Missing plist key | Add `UIBackgroundModes: ["audio"]` to `app.json` |
| Cloud Run cold start slow | Container spun down | Add `--min-instances 1` (may cost ~$3/mo) |
| Firebase Storage 403 error | Wrong security rules | Re-check Phase 1 Step 1.4 rules and re-publish |

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [yt-dlp GitHub](https://github.com/yt-dlp/yt-dlp)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [React Navigation Docs](https://reactnavigation.org)
- [EAS Build Guide](https://docs.expo.dev/build/introduction)

---

## 📄 License

This project is for **personal and educational use only**. It is not licensed for distribution, commercial use, or public deployment of any kind. See the disclaimer at the top of this document.

---

*Built for learning purposes · Not affiliated with YouTube or Google*

import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Animated, Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { collection, addDoc, doc, updateDoc, increment, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLORS, PLAYLISTS, BACKEND_URL } from '../constants';

async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user.getIdToken();
}

async function apiFetch(path, options = {}) {
  const token = await getIdToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

async function pollJob(jobId, onProgress) {
  while (true) {
    const token = await getIdToken();
    const res = await fetch(`${BACKEND_URL}/api/status/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.progress !== undefined) onProgress(data.progress);
    if (data.status === 'done')  return data;
    if (data.status === 'error') throw new Error(data.error ?? 'Download failed on server');
    await new Promise(r => setTimeout(r, 1500));
  }
}

const RESOLUTIONS = ['best', '1080p', '720p', '480p', '360p'];

export default function DownloadScreen() {
  const [url, setUrl]               = useState('');
  const [info, setInfo]             = useState(null);
  const [playlist, setPlaylist]     = useState('General');
  const [resolution, setResolution] = useState('720p');
  const [phase, setPhase]           = useState('idle');
  const [progress, setProgress]     = useState(0);
  const progressAnim                = useRef(new Animated.Value(0)).current;

  const animateProgress = (val) => {
    Animated.timing(progressAnim, { toValue: val, duration: 300, useNativeDriver: false }).start();
    setProgress(val);
  };

  const fetchInfo = async () => {
    if (!url.trim()) return Alert.alert('Paste a YouTube URL first');
    setPhase('fetching'); setInfo(null);
    try {
      const data = await apiFetch('/api/info', { method: 'POST', body: JSON.stringify({ url: url.trim() }) });
      setInfo(data); setPhase('ready');
    } catch (err) {
      setPhase('idle'); Alert.alert('Could not fetch video info', err.message);
    }
  };

  const checkDuplicate = async () => {
    const user = auth.currentUser;
    const q = query(collection(db, `users/${user.uid}/media`), where('sourceUrl', '==', url.trim()));
    const snap = await getDocs(q);
    return snap.empty ? null : snap.docs[0].data();
  };

  const handleDownload = async (format) => {
    try {
      const dup = await checkDuplicate();
      if (dup) {
        const dupInfo = [`Format: ${dup.format}`, dup.resolution ? `Resolution: ${dup.resolution}` : null,
          dup.downloadedAt?.toDate ? `Downloaded: ${dup.downloadedAt.toDate().toLocaleDateString()}` : null,
        ].filter(Boolean).join('\n');
        const confirmed = await new Promise(resolve =>
          Alert.alert('Already downloaded', `You already have this video:\n\n${dupInfo}\n\nDownload again?`,
            [{ text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
             { text: 'Download', onPress: () => resolve(true) }])
        );
        if (!confirmed) return;
      }

      setPhase('downloading'); animateProgress(0);
      const user = auth.currentUser;

      const { jobId } = await apiFetch('/api/download', {
        method: 'POST',
        body: JSON.stringify({
          url: url.trim(), format,
          resolution: format === 'video' ? resolution : undefined,
          metadata: {
            videoId: info?.videoId ?? null, title: info?.title ?? '',
            channel: info?.channel ?? '', uploadDate: info?.uploadDate ?? null,
            duration: info?.duration ?? null, thumbnailUrl: info?.thumbnailUrl ?? null,
            sourceUrl: url.trim(),
          },
        }),
      });

      const job = await pollJob(jobId, animateProgress);
      const localUri = FileSystem.documentDirectory + job.result.filename;
      const token = await getIdToken();
      animateProgress(95);

      const dlRes = await FileSystem.downloadAsync(
        `${BACKEND_URL}/api/file/${jobId}`, localUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (dlRes.status !== 200) throw new Error('File transfer failed');
      animateProgress(100);

      // Save to device library:
      //   - Videos: iOS Photos + Android Gallery
      //   - Audio:  Android Gallery only (iOS MediaLibrary doesn't support audio)
      let savedToLibrary = false;
      const shouldSaveToLibrary = format === 'video' || Platform.OS === 'android';
      if (shouldSaveToLibrary) {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(dlRes.uri);
          savedToLibrary = true;
        }
      }

      await addDoc(collection(db, `users/${user.uid}/media`), {
        filename: job.result.filename, localUri, format,
        resolution: format === 'video' ? resolution : null,
        playlist, sourceUrl: url.trim(),
        title: info?.title ?? job.result.filename,
        channel: info?.channel ?? '', uploadDate: info?.uploadDate ?? null,
        duration: info?.duration ?? null, thumbnailUrl: info?.thumbnailUrl ?? null,
        savedToLibrary,
        downloadedAt: serverTimestamp(),
      });

      // ── Update user stats (fire-and-forget, never blocks the UI) ──────────
      try {
        const statsRef = doc(db, `users/${user.uid}/meta`, 'stats');
        await updateDoc(statsRef, {
          totalDownloads:                          increment(1),
          [`${format}Downloads`]:                  increment(1),   // audioDownloads or videoDownloads
          [`favoritePlaylists.${playlist}`]:        increment(1),   // nested map key
        });
      } catch (_) {}

      setPhase('done');
      const libraryNote = savedToLibrary
        ? `\n\nAlso saved to your ${Platform.OS === 'ios' ? 'Photos' : 'Gallery'}.`
        : '';
      Alert.alert('Download complete ✅', `"${info?.title ?? 'File'}" saved to ${playlist}.${libraryNote}`);
      setUrl(''); setInfo(null); setPhase('idle'); animateProgress(0);
    } catch (err) {
      setPhase('ready'); Alert.alert('Download failed', err.message);
    }
  };

  const barWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Download</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input} value={url}
          onChangeText={text => { setUrl(text); setInfo(null); setPhase('idle'); }}
          placeholder="Paste YouTube URL…" placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none" autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.fetchBtn, phase === 'fetching' && styles.fetchBtnDisabled]}
          onPress={fetchInfo} disabled={phase === 'fetching' || phase === 'downloading'}
        >
          {phase === 'fetching'
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.fetchBtnText}>Go</Text>}
        </TouchableOpacity>
      </View>

      {info && (
        <View style={styles.card}>
          {info.thumbnailUrl && <Image source={{ uri: info.thumbnailUrl }} style={styles.thumbnail} />}
          <Text style={styles.cardTitle} numberOfLines={2}>{info.title}</Text>
          <Text style={styles.cardMeta}>
            {info.channel}{info.duration ? `  ·  ${Math.floor(info.duration / 60)}m ${info.duration % 60}s` : ''}
          </Text>
        </View>
      )}

      {phase === 'ready' && (
        <>
          <Text style={styles.label}>Playlist</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {PLAYLISTS.map(p => (
              <TouchableOpacity key={p} style={[styles.chip, playlist === p && styles.chipActive]} onPress={() => setPlaylist(p)}>
                <Text style={[styles.chipText, playlist === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Video resolution</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {RESOLUTIONS.map(r => (
              <TouchableOpacity key={r} style={[styles.chip, resolution === r && styles.chipActive]} onPress={() => setResolution(r)}>
                <Text style={[styles.chipText, resolution === r && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.audioBtn} onPress={() => handleDownload('audio')}>
              <Text style={styles.downloadBtnText}>⬇ Audio (MP3)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.videoBtn} onPress={() => handleDownload('video')}>
              <Text style={styles.downloadBtnText}>⬇ Video (MP4)</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {phase === 'downloading' && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Downloading… {Math.round(progress)}%</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>
          <Text style={styles.progressHint}>You can browse your library while this runs</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 24, paddingBottom: 48 },
  heading: { fontSize: 28, color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 20 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { flex: 1, backgroundColor: COLORS.surface, color: COLORS.textPrimary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  fetchBtn: { backgroundColor: COLORS.teal, borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', minWidth: 56 },
  fetchBtnDisabled: { backgroundColor: COLORS.surface },
  fetchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  thumbnail: { width: '100%', height: 180, resizeMode: 'cover' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', padding: 12, paddingBottom: 4 },
  cardMeta: { color: COLORS.textSecondary, fontSize: 12, paddingHorizontal: 12, paddingBottom: 12 },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  chipsScroll: { marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  chipText: { color: COLORS.textSecondary, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  audioBtn: { flex: 1, backgroundColor: COLORS.teal, padding: 16, borderRadius: 12, alignItems: 'center' },
  videoBtn: { flex: 1, backgroundColor: COLORS.purple, padding: 16, borderRadius: 12, alignItems: 'center' },
  downloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  progressSection: { marginTop: 24 },
  progressLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  progressTrack: { height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: COLORS.teal, borderRadius: 4 },
  progressHint: { color: COLORS.textMuted, fontSize: 12 },
});

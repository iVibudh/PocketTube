// src/screens/PlayerScreen.js — Step 4.6
// Full-featured audio & video player with background playback, seek, speed control

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { Audio, Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [0.6, 1.0, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];

const { width: SCREEN_W } = Dimensions.get('window');
const SEEK_BAR_W = SCREEN_W - 48; // 24px padding each side

// ── PlayerScreen ──────────────────────────────────────────────────────────────

export default function PlayerScreen({ route }) {
  const { item } = route.params;
  const insets   = useSafeAreaInsets();

  const isAudio = item.format === 'audio';

  // Playback state
  const soundRef              = useRef(null);
  const videoRef              = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [posMs,   setPosMs]   = useState(0);
  const [durMs,   setDurMs]   = useState(item.duration ? item.duration * 1000 : 0);
  const [speed,   setSpeed]   = useState(1.0);
  const [loaded,  setLoaded]  = useState(false);

  // Seek bar drag state
  const seeking        = useRef(false);
  const seekPos        = useRef(0);
  const [seekDisp, setSeekDisp] = useState(0); // displayed position while dragging

  // ── Audio setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAudio) return;

    let sound;

    const load = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS:    true,
          shouldDuckAndroid:       true,
        });

        const { sound: s } = await Audio.Sound.createAsync(
          { uri: item.localUri },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        sound = s;
        soundRef.current = s;
        setLoaded(true);
      } catch (err) {
        Alert.alert('Playback error', err.message);
      }
    };

    load();

    return () => {
      sound?.unloadAsync();
    };
  }, []);

  // ── Playback status callback ─────────────────────────────────────────────────
  const onPlaybackStatusUpdate = useCallback((status) => {
    if (!status.isLoaded) return;
    if (!seeking.current) {
      setPosMs(status.positionMillis ?? 0);
    }
    if (status.durationMillis) setDurMs(status.durationMillis);
    setPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setPlaying(false);
      setPosMs(0);
    }
  }, []);

  // ── Play / Pause ─────────────────────────────────────────────────────────────
  const togglePlay = async () => {
    try {
      if (isAudio) {
        const s = soundRef.current;
        if (!s) return;
        playing ? await s.pauseAsync() : await s.playAsync();
      } else {
        const v = videoRef.current;
        if (!v) return;
        playing ? await v.pauseAsync() : await v.playAsync();
      }
    } catch (err) {
      Alert.alert('Playback error', err.message);
    }
  };

  // ── Speed ────────────────────────────────────────────────────────────────────
  const cycleSpeed = async () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    try {
      if (isAudio) await soundRef.current?.setRateAsync(next, true);
      else         await videoRef.current?.setRateAsync(next, true);
    } catch (_) {}
  };

  // ── Seek bar pan responder ────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: (evt) => {
        seeking.current = true;
        const x = Math.max(0, Math.min(evt.nativeEvent.locationX, SEEK_BAR_W));
        seekPos.current = x;
        setSeekDisp(x);
      },

      onPanResponderMove: (evt) => {
        const x = Math.max(0, Math.min(evt.nativeEvent.locationX, SEEK_BAR_W));
        seekPos.current = x;
        setSeekDisp(x);
      },

      onPanResponderRelease: async () => {
        seeking.current = false;
        const ratio  = seekPos.current / SEEK_BAR_W;
        const target = Math.floor(ratio * durMs);
        setPosMs(target);
        try {
          if (isAudio) await soundRef.current?.setPositionAsync(target);
          else         await videoRef.current?.setPositionAsync(target);
        } catch (_) {}
      },
    })
  ).current;

  // ── Derived seek bar values ───────────────────────────────────────────────────
  const displayPos   = seeking.current ? seekPos.current : (durMs > 0 ? (posMs / durMs) * SEEK_BAR_W : 0);
  const displayTime  = seeking.current
    ? formatTime((seekPos.current / SEEK_BAR_W) * durMs)
    : formatTime(posMs);

  // ── Video handler ─────────────────────────────────────────────────────────────
  const onVideoStatus = useCallback((status) => {
    if (!status.isLoaded) return;
    if (!seeking.current) setPosMs(status.positionMillis ?? 0);
    if (status.durationMillis) setDurMs(status.durationMillis);
    setPlaying(status.isPlaying);
    if (!loaded) setLoaded(true);
  }, [loaded]);

  // ── Render: Video ─────────────────────────────────────────────────────────────
  if (!isAudio) {
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <Video
          ref={videoRef}
          source={{ uri: item.localUri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          onPlaybackStatusUpdate={onVideoStatus}
          shouldPlay={false}
        />
        <View style={styles.videoMeta}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title || item.filename}
          </Text>
          <Text style={styles.videoChannel}>{item.channel || ''}</Text>

          {/* Speed control for video */}
          <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed}>
            <Text style={styles.speedText}>{speed}×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render: Audio ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 16 }]}>

      {/* Artwork */}
      <View style={styles.artWrap}>
        {item.thumbnailUrl
          ? <Image source={{ uri: item.thumbnailUrl }} style={styles.art} />
          : <View style={styles.artPlaceholder}>
              <Text style={styles.artIcon}>🎵</Text>
            </View>
        }
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>{item.title || item.filename}</Text>
        <Text style={styles.trackChannel}>{item.channel || ''}</Text>
      </View>

      {/* Seek bar */}
      <View style={styles.seekSection}>
        <View
          style={styles.seekTrack}
          {...panResponder.panHandlers}
          hitSlop={{ top: 12, bottom: 12 }}
        >
          {/* Filled portion */}
          <View style={[styles.seekFill, { width: Math.min(displayPos, SEEK_BAR_W) }]} />
          {/* Thumb */}
          <View style={[styles.seekThumb, { left: Math.min(displayPos, SEEK_BAR_W) - 8 }]} />
        </View>
        <View style={styles.seekTimes}>
          <Text style={styles.seekTime}>{displayTime}</Text>
          <Text style={styles.seekTime}>{formatTime(durMs)}</Text>
        </View>
      </View>

      {/* Controls row */}
      <View style={styles.controls}>

        {/* Speed */}
        <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed}>
          <Text style={styles.speedText}>{speed}×</Text>
        </TouchableOpacity>

        {/* Rewind 15s */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={async () => {
            const target = Math.max(0, posMs - 15000);
            setPosMs(target);
            await soundRef.current?.setPositionAsync(target);
          }}
        >
          <Text style={styles.skipIcon}>↺</Text>
          <Text style={styles.skipLabel}>15</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          style={[styles.playBtn, !loaded && styles.playBtnDisabled]}
          onPress={togglePlay}
          disabled={!loaded}
        >
          <Text style={styles.playIcon}>{playing ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Forward 15s */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={async () => {
            const target = Math.min(durMs, posMs + 15000);
            setPosMs(target);
            await soundRef.current?.setPositionAsync(target);
          }}
        >
          <Text style={styles.skipIcon}>↻</Text>
          <Text style={styles.skipLabel}>15</Text>
        </TouchableOpacity>

        {/* Playlist badge */}
        <View style={styles.playlistBadge}>
          <Text style={styles.playlistText} numberOfLines={1}>{item.playlist}</Text>
        </View>

      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  // ── Video ──
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 20,
  },
  videoMeta: { width: '100%', alignItems: 'flex-start' },
  videoTitle:   { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  videoChannel: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 },

  // ── Audio artwork ──
  artWrap: {
    width: SCREEN_W - 80,
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  art: { width: '100%', height: '100%', resizeMode: 'cover' },
  artPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artIcon: { fontSize: 72 },

  // Track info
  trackInfo: { width: '100%', marginBottom: 28 },
  trackTitle:   { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 6, lineHeight: 26 },
  trackChannel: { color: COLORS.textSecondary, fontSize: 14 },

  // Seek bar
  seekSection: { width: '100%', marginBottom: 32 },
  seekTrack: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    marginBottom: 8,
    position: 'relative',
  },
  seekFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 2,
    position: 'absolute',
  },
  seekThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.teal,
    position: 'absolute',
    top: -6,
  },
  seekTimes: { flexDirection: 'row', justifyContent: 'space-between' },
  seekTime:  { color: COLORS.textMuted, fontSize: 12 },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  speedBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  speedText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },

  skipBtn: { alignItems: 'center', width: 44 },
  skipIcon:  { color: COLORS.textPrimary, fontSize: 24 },
  skipLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: -2 },

  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  playBtnDisabled: { backgroundColor: COLORS.surface },
  playIcon: { color: '#fff', fontSize: 28 },

  playlistBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 72,
  },
  playlistText: { color: COLORS.textSecondary, fontSize: 11 },
});

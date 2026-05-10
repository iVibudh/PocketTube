import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Dimensions, PanResponder, Alert, Modal, FlatList, Pressable,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS   = [0.6, 1.0, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0];
const SCREEN_W = Dimensions.get('window').width;
const SEEK_W   = SCREEN_W - 48;

// ── Speed Modal ───────────────────────────────────────────────────────────────

function SpeedModal({ visible, current, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <Text style={styles.modalTitle}>Playback Speed</Text>
          <FlatList
            data={SPEEDS}
            keyExtractor={s => String(s)}
            renderItem={({ item: s }) => (
              <TouchableOpacity
                style={[styles.modalRow, s === current && styles.modalRowActive]}
                onPress={() => onSelect(s)}
              >
                <Text style={[styles.modalRowText, s === current && styles.modalRowTextActive]}>
                  {s}×
                </Text>
                {s === current && <Text style={styles.modalCheck}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Audio Player ──────────────────────────────────────────────────────────────

function AudioPlayer({ item }) {
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(1.0);
  const [speedModalVisible, setSpeedModalVisible] = useState(false);

  // Audio session is configured once at app startup in App.js.
  // No need to call setAudioModeAsync here.
  const player = useAudioPlayer({ uri: item.localUri });
  const status = useAudioPlayerStatus(player);

  const dur    = status.duration    ?? 0;
  const pos    = status.currentTime ?? 0;
  const loaded = status.isLoaded    ?? false;

  // Seek bar drag
  const seeking    = useRef(false);
  const seekPos    = useRef(0);
  const [seekDisp, setSeekDisp] = useState(0);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (evt) => {
      seeking.current = true;
      const x = Math.max(0, Math.min(evt.nativeEvent.locationX, SEEK_W));
      seekPos.current = x; setSeekDisp(x);
    },
    onPanResponderMove: (evt) => {
      const x = Math.max(0, Math.min(evt.nativeEvent.locationX, SEEK_W));
      seekPos.current = x; setSeekDisp(x);
    },
    onPanResponderRelease: () => {
      seeking.current = false;
      const targetSec = (seekPos.current / SEEK_W) * dur;
      player.seekTo(targetSec);
    },
  })).current;

  const displayPos  = seeking.current ? seekPos.current : (dur > 0 ? (pos / dur) * SEEK_W : 0);
  const displayTime = seeking.current
    ? formatTime((seekPos.current / SEEK_W) * dur)
    : formatTime(pos);

  const handleSelectSpeed = (s) => {
    setSpeed(s);
    player.setPlaybackRate(s);
    setSpeedModalVisible(false);
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 16 }]}>
      <SpeedModal
        visible={speedModalVisible}
        current={speed}
        onSelect={handleSelectSpeed}
        onClose={() => setSpeedModalVisible(false)}
      />

      {/* Artwork */}
      <View style={styles.artWrap}>
        {item.thumbnailUrl
          ? <Image source={{ uri: item.thumbnailUrl }} style={styles.art} />
          : <View style={styles.artPlaceholder}><Text style={styles.artIcon}>🎵</Text></View>}
      </View>

      {/* Track info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>{item.title || item.filename}</Text>
        <Text style={styles.trackChannel}>{item.channel || ''}</Text>
      </View>

      {/* Seek bar */}
      <View style={styles.seekSection}>
        <View style={styles.seekTrack} {...panResponder.panHandlers} hitSlop={{ top: 12, bottom: 12 }}>
          <View style={[styles.seekFill, { width: Math.min(displayPos, SEEK_W) }]} />
          <View style={[styles.seekThumb, { left: Math.min(displayPos, SEEK_W) - 8 }]} />
        </View>
        <View style={styles.seekTimes}>
          <Text style={styles.seekTime}>{displayTime}</Text>
          <Text style={styles.seekTime}>{formatTime(dur)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>

        <TouchableOpacity style={styles.speedBtn} onPress={() => setSpeedModalVisible(true)}>
          <Text style={styles.speedText}>{speed}×</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn}
          onPress={() => player.seekTo(Math.max(0, pos - 15))}>
          <Text style={styles.skipIcon}>↺</Text>
          <Text style={styles.skipLabel}>15</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, !loaded && styles.playBtnDisabled]}
          onPress={() => status.playing ? player.pause() : player.play()}
          disabled={!loaded}
        >
          <Text style={styles.playIcon}>{status.playing ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn}
          onPress={() => player.seekTo(Math.min(dur, pos + 15))}>
          <Text style={styles.skipIcon}>↻</Text>
          <Text style={styles.skipLabel}>15</Text>
        </TouchableOpacity>

        <View style={styles.playlistBadge}>
          <Text style={styles.playlistText} numberOfLines={1}>{item.playlist}</Text>
        </View>

      </View>
    </View>
  );
}

// ── Video Player ──────────────────────────────────────────────────────────────

function VideoPlayer({ item }) {
  const insets = useSafeAreaInsets();
  const [speed, setSpeed] = useState(1.0);
  const [speedModalVisible, setSpeedModalVisible] = useState(false);

  const player = useVideoPlayer({ uri: item.localUri }, p => {
    p.loop = false;
  });

  const handleSelectSpeed = (s) => {
    setSpeed(s);
    player.playbackRate = s;
    setSpeedModalVisible(false);
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <SpeedModal
        visible={speedModalVisible}
        current={speed}
        onSelect={handleSelectSpeed}
        onClose={() => setSpeedModalVisible(false)}
      />
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
      />
      <View style={styles.videoMeta}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title || item.filename}</Text>
        <Text style={styles.videoChannel}>{item.channel || ''}</Text>
        <TouchableOpacity style={styles.speedBtn} onPress={() => setSpeedModalVisible(true)}>
          <Text style={styles.speedText}>{speed}×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function PlayerScreen({ route }) {
  const { item } = route.params;
  return item.format === 'audio'
    ? <AudioPlayer item={item} />
    : <VideoPlayer item={item} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  video:        { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12, marginBottom: 20 },
  videoMeta:    { width: '100%' },
  videoTitle:   { color: COLORS.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  videoChannel: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 16 },

  artWrap: {
    width: SCREEN_W - 80, aspectRatio: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  art:            { width: '100%', height: '100%', resizeMode: 'cover' },
  artPlaceholder: { flex: 1, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  artIcon:        { fontSize: 72 },

  trackInfo:   { width: '100%', marginBottom: 28 },
  trackTitle:  { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 6, lineHeight: 26 },
  trackChannel:{ color: COLORS.textSecondary, fontSize: 14 },

  seekSection: { width: '100%', marginBottom: 32 },
  seekTrack:   { height: 4, backgroundColor: COLORS.surface, borderRadius: 2, marginBottom: 8, position: 'relative' },
  seekFill:    { height: '100%', backgroundColor: COLORS.teal, borderRadius: 2, position: 'absolute' },
  seekThumb:   { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.teal, position: 'absolute', top: -6 },
  seekTimes:   { flexDirection: 'row', justifyContent: 'space-between' },
  seekTime:    { color: COLORS.textMuted, fontSize: 12 },

  controls:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  speedBtn:     { backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 44, alignItems: 'center' },
  speedText:    { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  skipBtn:      { alignItems: 'center', width: 44 },
  skipIcon:     { color: COLORS.textPrimary, fontSize: 24 },
  skipLabel:    { color: COLORS.textMuted, fontSize: 10, marginTop: -2 },
  playBtn:      { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  playBtnDisabled: { backgroundColor: COLORS.surface },
  playIcon:     { color: '#fff', fontSize: 28 },
  playlistBadge:{ backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 72 },
  playlistText: { color: COLORS.textSecondary, fontSize: 11 },

  // Speed modal
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalSheet:        { backgroundColor: COLORS.surface, borderRadius: 16, width: 220, paddingVertical: 8, paddingHorizontal: 0 },
  modalTitle:        { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', paddingVertical: 12 },
  modalRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14 },
  modalRowActive:    { backgroundColor: COLORS.bg },
  modalRowText:      { color: COLORS.textPrimary, fontSize: 17 },
  modalRowTextActive:{ color: COLORS.teal, fontWeight: '700' },
  modalCheck:        { color: COLORS.teal, fontSize: 16 },
});

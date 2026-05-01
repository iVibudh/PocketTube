// src/screens/LibraryScreen.js — Step 4.5
// Browse downloaded files, filter by playlist, tap to play, swipe to delete

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { COLORS, PLAYLISTS } from '../constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── LibraryItem ───────────────────────────────────────────────────────────────

function LibraryItem({ item, onPress, onDelete }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>

      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl
          ? <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
          : <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbIcon}>{item.format === 'audio' ? '🎵' : '🎬'}</Text>
            </View>
        }
        {/* Format badge */}
        <View style={[styles.badge, item.format === 'audio' ? styles.badgeAudio : styles.badgeVideo]}>
          <Text style={styles.badgeText}>
            {item.format === 'audio' ? 'MP3' : (item.resolution ?? 'MP4')}
          </Text>
        </View>
      </View>

      {/* Metadata */}
      <View style={styles.meta}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || item.filename}
        </Text>
        <Text style={styles.itemChannel} numberOfLines={1}>
          {item.channel || '—'}
        </Text>
        <View style={styles.itemFooter}>
          {item.duration
            ? <Text style={styles.itemDetail}>{formatDuration(item.duration)}</Text>
            : null}
          <Text style={styles.itemDetail}>{item.playlist}</Text>
          <Text style={styles.itemDetail}>{formatDate(item.downloadedAt)}</Text>
        </View>
      </View>

      {/* Delete button */}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={12}>
        <Text style={styles.deleteIcon}>🗑</Text>
      </TouchableOpacity>

    </TouchableOpacity>
  );
}

// ── LibraryScreen ─────────────────────────────────────────────────────────────

export default function LibraryScreen() {
  const navigation          = useNavigation();
  const [filter, setFilter] = useState('All');
  const [items,  setItems]  = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Real-time Firestore listener ────────────────────────────────────────────
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = collection(db, `users/${user.uid}/media`);

    const q = filter === 'All'
      ? query(ref, orderBy('downloadedAt', 'desc'))
      : query(ref, where('playlist', '==', filter), orderBy('downloadedAt', 'desc'));

    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [filter]);

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Delete file',
      `Remove "${item.title || item.filename}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove local file if it exists
              if (item.localUri) {
                const info = await FileSystem.getInfoAsync(item.localUri);
                if (info.exists) await FileSystem.deleteAsync(item.localUri, { idempotent: true });
              }
              // Remove Firestore record
              const user = auth.currentUser;
              await deleteDoc(doc(db, `users/${user.uid}/media`, item.id));
            } catch (err) {
              Alert.alert('Delete failed', err.message);
            }
          },
        },
      ]
    );
  }, []);

  // ── Empty state ─────────────────────────────────────────────────────────────
  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptySub}>
        {filter === 'All'
          ? 'Head to the Download tab to save your first file.'
          : `No files in "${filter}" yet.`}
      </Text>
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Library</Text>
        {items.length > 0 && (
          <Text style={styles.count}>{items.length} file{items.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {/* Playlist filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {['All', ...PLAYLISTS].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, filter === p && styles.chipActive]}
            onPress={() => { setFilter(p); setLoading(true); }}
          >
            <Text style={[styles.chipText, filter === p && styles.chipTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <LibraryItem
              item={item}
              onPress={() => navigation.navigate('Player', { item })}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const THUMB_W = 88;
const THUMB_H = 60;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 10,
  },
  heading: { fontSize: 28, color: COLORS.textPrimary, fontWeight: 'bold' },
  count:   { fontSize: 14, color: COLORS.textMuted },

  // Playlist filter
  filterScroll:  { maxHeight: 44, marginTop: 12 },
  filterContent: { paddingHorizontal: 24, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive:     { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  chipText:       { color: COLORS.textSecondary, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  // List
  listContent:    { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  emptyContainer: { flex: 1 },

  // Item card
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    gap: 12,
  },

  // Thumbnail
  thumbWrap: { position: 'relative', width: THUMB_W, height: THUMB_H },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: { fontSize: 28 },

  // Format badge
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeAudio: { backgroundColor: COLORS.teal },
  badgeVideo: { backgroundColor: COLORS.purple },
  badgeText:  { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Text meta
  meta:        { flex: 1, justifyContent: 'center', gap: 3 },
  itemTitle:   { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 18 },
  itemChannel: { color: COLORS.textSecondary, fontSize: 12 },
  itemFooter:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 2 },
  itemDetail:  { color: COLORS.textMuted, fontSize: 11 },

  // Delete
  deleteBtn:  { padding: 4 },
  deleteIcon: { fontSize: 16 },

  // Loader
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Empty state
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub:   { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

/**
 * MiniPlayer.js
 *
 * A slim persistent bar that floats above the tab bar whenever a track
 * is loaded in PlayerContext. Tapping the bar navigates to the full
 * PlayerScreen. The play/pause button works without leaving the current screen.
 *
 * Positioning: absolute, sitting exactly on top of the tab bar.
 * The tab bar height (60 px) and safe-area bottom inset are both respected
 * so the bar never overlaps the home indicator on iPhone X+.
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerContext } from '../context/PlayerContext';
import { COLORS } from '../constants';

const MINI_H      = 64;
const TAB_BAR_H   = 60; // must match the height set in App.js Tab.Navigator

export default function MiniPlayer() {
  const { currentTrack, player, status, playNext, hasNext } = usePlayerContext();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  // Only render when a track is loaded
  if (!currentTrack) return null;

  const bottomOffset = TAB_BAR_H + insets.bottom;

  return (
    <TouchableOpacity
      style={[styles.container, { bottom: bottomOffset }]}
      onPress={() => navigation.navigate('Player', { item: currentTrack })}
      activeOpacity={0.95}
    >
      {/* Progress stripe at the very top of the bar */}
      {status.duration > 0 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(status.currentTime / status.duration) * 100}%` },
            ]}
          />
        </View>
      )}

      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        {currentTrack.thumbnailUrl ? (
          <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbIcon}>🎵</Text>
          </View>
        )}
      </View>

      {/* Track info */}
      <View style={styles.info}>
        <Text style={styles.title}   numberOfLines={1}>
          {currentTrack.title || currentTrack.filename}
        </Text>
        <Text style={styles.channel} numberOfLines={1}>
          {currentTrack.channel || ''}
        </Text>
      </View>

      {/* Play / Pause */}
      <TouchableOpacity
        style={styles.controlBtn}
        onPress={() => (status.playing ? player.pause() : player.play())}
        hitSlop={10}
      >
        <Text style={styles.controlIcon}>{status.playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>

      {/* Next track (only shown when queue has more) */}
      {hasNext && (
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={playNext}
          hitSlop={10}
        >
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          MINI_H,
    backgroundColor: COLORS.surface,
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 12,
    gap:             10,
    borderTopWidth:  1,
    borderTopColor:  COLORS.border,
    // Shadow so it appears "lifted" above the tab bar
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: -3 },
    shadowOpacity:  0.35,
    shadowRadius:   8,
    elevation:      12,
    zIndex:         100,
  },
  progressTrack: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    height:          2,
    backgroundColor: COLORS.border,
  },
  progressFill: {
    height:          '100%',
    backgroundColor: COLORS.teal,
  },
  thumbWrap: {
    width:        44,
    height:       44,
    borderRadius: 6,
    overflow:     'hidden',
  },
  thumb: {
    width:      44,
    height:     44,
    resizeMode: 'cover',
  },
  thumbPlaceholder: {
    flex:            1,
    backgroundColor: COLORS.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  thumbIcon: { fontSize: 20 },
  info: { flex: 1 },
  title: {
    color:      COLORS.textPrimary,
    fontSize:   14,
    fontWeight: '600',
  },
  channel: {
    color:     COLORS.textSecondary,
    fontSize:  12,
    marginTop: 2,
  },
  controlBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
  },
  controlIcon: {
    color:    COLORS.teal,
    fontSize: 22,
  },
});

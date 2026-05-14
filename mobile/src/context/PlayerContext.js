/**
 * PlayerContext.js
 *
 * A single persistent AudioPlayer that lives at the app root and never
 * unmounts. This is the key architectural fix for background audio:
 * because the player is never destroyed, iOS keeps the audio session
 * alive even when the screen locks or the user switches apps.
 *
 * Also enables:
 *  - Mini-player (any screen can read currentTrack / status)
 *  - Prev / Next (queue is managed here)
 *  - Auto-advance to next track
 *  - Lock-screen Now Playing info (best-effort via player.setNowPlayingInfo)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

// ─────────────────────────────────────────────────────────────────────────────
const PlayerCtx = createContext(null);

export function PlayerContextProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue]               = useState([]);
  const [queueIndex, setQueueIndex]     = useState(-1);

  // Mutable refs so event-listener callbacks never go stale
  const queueRef = useRef([]);
  const idxRef   = useRef(-1);
  useEffect(() => { queueRef.current = queue;      }, [queue]);
  useEffect(() => { idxRef.current   = queueIndex; }, [queueIndex]);

  // ── Audio session ──────────────────────────────────────────────────────────
  // Configured here (not in App.js) so it runs inside the provider lifecycle.
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentModeIOS:    true,   // play even when the mute switch is on
      staysActiveInBackground: true,   // keep audio alive when screen locks / app switches
    }).catch(() => {});
  }, []);

  // ── Persistent player at app root ──────────────────────────────────────────
  // Passing null means "no source yet"; we call player.replace() when a track
  // is selected. The player object itself never changes reference.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // ── Internal: load a track and start playing ───────────────────────────────
  const _load = useCallback((track, q, idx) => {
    // Sync refs immediately so event callbacks see the new values right away
    queueRef.current = q;
    idxRef.current   = idx;

    setQueue(q);
    setQueueIndex(idx);
    setCurrentTrack(track);

    player.replace({ uri: track.localUri });
    player.play();

    // Update the iOS / Android lock-screen Now Playing widget.
    // Optional chaining makes this a no-op if the API is unavailable.
    try {
      player.setNowPlayingInfo?.({
        title:      track.title      || track.filename || '',
        artist:     track.channel    || '',
        duration:   track.duration   || 0,
        artworkUri: track.thumbnailUrl,
      });
    } catch (_) {}
  }, [player]);

  // ── Auto-advance when a track finishes ─────────────────────────────────────
  useEffect(() => {
    let sub;
    try {
      sub = player.addListener('playToEnd', () => {
        const idx = idxRef.current;
        const q   = queueRef.current;
        if (idx >= 0 && idx < q.length - 1) {
          _load(q[idx + 1], q, idx + 1);
        }
      });
    } catch (_) {}
    return () => { try { sub?.remove(); } catch (_) {} };
  }, [player, _load]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * playTrack(track, trackList?)
   *
   * Start playing `track`. Pass the full library list as `trackList` to
   * enable Prev / Next and auto-advance.
   */
  const playTrack = useCallback((track, trackList = []) => {
    const q   = trackList.length > 0 ? trackList : [track];
    const idx = q.findIndex(t => t.id === track.id);
    _load(track, q, idx >= 0 ? idx : 0);
  }, [_load]);

  const playNext = useCallback(() => {
    const idx = idxRef.current, q = queueRef.current;
    if (idx < q.length - 1) _load(q[idx + 1], q, idx + 1);
  }, [_load]);

  const playPrev = useCallback(() => {
    const idx = idxRef.current, q = queueRef.current;
    if (idx > 0) _load(q[idx - 1], q, idx - 1);
  }, [_load]);

  // ── Context value ──────────────────────────────────────────────────────────
  return (
    <PlayerCtx.Provider value={{
      currentTrack,
      player,
      status,
      playTrack,
      playNext,
      playPrev,
      hasNext: queueIndex >= 0 && queueIndex < queue.length - 1,
      hasPrev: queueIndex > 0,
    }}>
      {children}
    </PlayerCtx.Provider>
  );
}

export function usePlayerContext() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error('usePlayerContext must be used inside <PlayerContextProvider>');
  return ctx;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track, RepeatMode } from '@/types';

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  audioContextAvailable: boolean;
  usingFallback: boolean;
  analyser: AnalyserNode | null;
}

export function useAudioPlayer(getURL: (id: string) => Promise<string | null>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const objectURLRef = useRef<string | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [audioContextAvailable, setAudioContextAvailable] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const ensureAudioElement = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      el.preload = 'auto';
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  const setupWebAudio = useCallback(() => {
    const el = ensureAudioElement();
    try {
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(el);
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 1024;
        analyserRef.current.smoothingTimeConstant = 0.8;
        gainRef.current = ctx.createGain();
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(gainRef.current);
        gainRef.current.connect(ctx.destination);
      }
      if (gainRef.current) gainRef.current.gain.value = muted ? 0 : volume;
      setAudioContextAvailable(true);
      setUsingFallback(false);
      return true;
    } catch (err) {
      setAudioContextAvailable(false);
      setUsingFallback(true);
      return false;
    }
  }, [ensureAudioElement, muted, volume]);

  const loadTrack = useCallback(
    async (track: Track, autoplay = true) => {
      const el = ensureAudioElement();
      if (objectURLRef.current) {
        URL.revokeObjectURL(objectURLRef.current);
        objectURLRef.current = null;
      }
      const url = await getURL(track.id);
      if (!url) return;
      objectURLRef.current = url;
      el.src = url;
      el.load();
      setCurrentTrack(track);
      setPositionSec(0);
      setDurationSec(track.durationSec || 0);
      setupWebAudio();
      if (autoplay) {
        el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    },
    [ensureAudioElement, getURL, setupWebAudio],
  );

  const playQueue = useCallback(
    (tracks: Track[], startIndex = 0) => {
      if (tracks.length === 0) return;
      setQueue(tracks);
      setQueueIndex(startIndex);
      loadTrack(tracks[startIndex], true);
    },
    [loadTrack],
  );

  const playTrack = useCallback(
    (track: Track, contextQueue?: Track[]) => {
      const q = contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      const idx = q.findIndex((t) => t.id === track.id);
      playQueue(q, idx >= 0 ? idx : 0);
    },
    [playQueue],
  );

  const addToQueue = useCallback((track: Track) => {
    setQueue((prev) => {
      const exists = prev.find((t) => t.id === track.id);
      if (exists) return prev;
      return [...prev, track];
    });
  }, []);

  const playNext = useCallback((track: Track) => {
    setQueue((prev) => {
      if (prev.length === 0) {
        return [track];
      }
      const insertAt = queueIndex + 1;
      const filtered = prev.filter((t) => t.id !== track.id);
      const newQueue = [...filtered];
      newQueue.splice(insertAt, 0, track);
      return newQueue;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderQueue = useCallback((from: number, to: number) => {
    setQueue((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && nextIdx === queueIndex) {
        nextIdx = (nextIdx + 1) % queue.length;
      }
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeat === 'all') nextIdx = 0;
        else return;
      }
    }
    setQueueIndex(nextIdx);
    loadTrack(queue[nextIdx], true);
  }, [queue, queueIndex, shuffle, repeat, loadTrack]);

  const previous = useCallback(() => {
    if (queue.length === 0) return;
    let prevIdx = queueIndex - 1;
    if (prevIdx < 0) {
      if (repeat === 'all') prevIdx = queue.length - 1;
      else prevIdx = 0;
    }
    setQueueIndex(prevIdx);
    loadTrack(queue[prevIdx], true);
  }, [queue, queueIndex, repeat, loadTrack]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !currentTrack) return;
    if (el.paused) {
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const seek = useCallback((sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = sec;
    setPositionSec(sec);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setMuted(false);
    const el = audioRef.current;
    if (el) el.volume = v;
    if (gainRef.current) gainRef.current.gain.value = v;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const newMuted = !m;
      const el = audioRef.current;
      if (el) el.volume = newMuted ? 0 : volume;
      if (gainRef.current) gainRef.current.gain.value = newMuted ? 0 : volume;
      return newMuted;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  // Audio event listeners
  useEffect(() => {
    const el = ensureAudioElement();
    const onTime = () => setPositionSec(el.currentTime || 0);
    const onDuration = () => setDurationSec(el.duration || 0);
    const onEnded = () => {
      if (repeat === 'one') {
        el.currentTime = 0;
        el.play();
        return;
      }
      next();
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onDuration);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onDuration);
    el.removeEventListener('ended', onEnded);
    el.removeEventListener('play', onPlay);
    el.removeEventListener('pause', onPause);
    };
  }, [ensureAudioElement, next, repeat]);

  // Increment play count on track start
  useEffect(() => {
    if (isPlaying && currentTrack) {
      // Persist play count lazily via callback
    }
  }, [isPlaying, currentTrack]);

  const state: PlayerState = {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    positionSec,
    durationSec,
    volume,
    muted,
    shuffle,
    repeat,
    audioContextAvailable,
    usingFallback,
    analyser: analyserRef.current,
  };

  return {
    ...state,
    loadTrack,
    playTrack,
    playQueue,
    addToQueue,
    playNext,
    removeFromQueue,
    reorderQueue,
    next,
    previous,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    getAnalyser,
  };
}

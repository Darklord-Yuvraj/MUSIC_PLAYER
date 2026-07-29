import { useCallback, useEffect, useState } from 'react';
import type { Track, Playlist } from '@/types';
import {
  getAllTracks,
  putTrack,
  deleteTrack as dbDeleteTrack,
  updateTrack as dbUpdateTrack,
  putAudioBlob,
  getAudioURL,
  getAllPlaylists,
  putPlaylist,
  deletePlaylist as dbDeletePlaylist,
  estimateStorage,
} from '@/utils/storage';
import { parseAudioMetadata, createTrackFromFile, generateId } from '@/utils/audioMetadata';

export interface ImportProgress {
  fileName: string;
  stage: 'parsing' | 'storing' | 'done' | 'error';
  error?: string;
}

export function useAudioStorage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<ImportProgress[]>([]);
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);

  const refresh = useCallback(async () => {
    const [t, p] = await Promise.all([getAllTracks(), getAllPlaylists()]);
    setTracks(t);
    setPlaylists(p);
    setStorageEstimate(await estimateStorage());
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const importFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const progressList: ImportProgress[] = files.map((f) => ({
      fileName: f.name,
      stage: 'parsing',
    }));
    setImporting(progressList);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setImporting((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, stage: 'parsing' } : p)),
        );
        const meta = await parseAudioMetadata(file);
        setImporting((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, stage: 'storing' } : p)),
        );
        const id = generateId();
        await putAudioBlob(id, file);
        const trackData = createTrackFromFile(file, meta);
        const track: Track = { id, ...trackData };
        await putTrack(track);
        setImporting((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, stage: 'done' } : p)),
        );
      } catch (err: any) {
        setImporting((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, stage: 'error', error: err?.message ?? 'Failed' } : p,
          ),
        );
      }
    }
    await refresh();
    setTimeout(() => setImporting([]), 3000);
  }, [refresh]);

  const removeTrack = useCallback(async (id: string) => {
    await dbDeleteTrack(id);
    await refresh();
  }, [refresh]);

  const patchTrack = useCallback(async (id: string, patch: Partial<Track>) => {
    const updated = await dbUpdateTrack(id, patch);
    if (updated) {
      setTracks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  }, []);

  const getURL = useCallback((id: string) => getAudioURL(id), []);

  const createPlaylist = useCallback(async (name: string, trackIds: string[] = []) => {
    const colors = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15'];
    const pl: Playlist = {
      id: generateId(),
      name,
      trackIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      coverColor: colors[Math.floor(Math.random() * colors.length)],
    };
    await putPlaylist(pl);
    await refresh();
    return pl;
  }, [refresh]);

  const updatePlaylist = useCallback(async (pl: Playlist) => {
    pl.updatedAt = Date.now();
    await putPlaylist(pl);
    await refresh();
  }, [refresh]);

  const removePlaylist = useCallback(async (id: string) => {
    await dbDeletePlaylist(id);
    await refresh();
  }, [refresh]);

  return {
    tracks,
    playlists,
    loading,
    importing,
    storageEstimate,
    importFiles,
    removeTrack,
    patchTrack,
    getURL,
    createPlaylist,
    updatePlaylist,
    removePlaylist,
    refresh,
  };
}

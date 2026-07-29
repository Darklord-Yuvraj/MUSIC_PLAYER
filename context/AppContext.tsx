import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { Track, SimilarityResult } from '@/types';
import { useAudioStorage } from '@/hooks/useAudioStorage';
import { useLocalAI } from '@/hooks/useLocalAI';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { findSimilarTracks } from '@/utils/vector';

interface AppContextValue {
  tracks: Track[];
  playlists: ReturnType<typeof useAudioStorage>['playlists'];
  loading: boolean;
  importing: ReturnType<typeof useAudioStorage>['importing'];
  storageEstimate: ReturnType<typeof useAudioStorage>['storageEstimate'];
  importFiles: (files: File[]) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  patchTrack: (id: string, patch: Partial<Track>) => Promise<Track | undefined>;
  createPlaylist: ReturnType<typeof useAudioStorage>['createPlaylist'];
  updatePlaylist: ReturnType<typeof useAudioStorage>['updatePlaylist'];
  removePlaylist: ReturnType<typeof useAudioStorage>['removePlaylist'];

  ai: ReturnType<typeof useLocalAI>;

  player: ReturnType<typeof useAudioPlayer>;

  playSimilar: (track: Track) => SimilarityResult[];
  smartFlowQueue: (track: Track, limit?: number) => Track[];
  expandedPlayer: boolean;
  setExpandedPlayer: (v: boolean) => void;
  queuePanelOpen: boolean;
  setQueuePanelOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const storage = useAudioStorage();
  const ai = useLocalAI(storage.tracks, storage.patchTrack);
  const player = useAudioPlayer(storage.getURL);
  const [expandedPlayer, setExpandedPlayer] = useState(false);
  const [queuePanelOpen, setQueuePanelOpen] = useState(false);

  const playSimilar = useCallback(
    (track: Track): SimilarityResult[] => {
      if (!track.embedding) return [];
      return findSimilarTracks(track, storage.tracks, 20);
    },
    [storage.tracks],
  );

  const smartFlowQueue = useCallback(
    (track: Track, limit = 20): Track[] => {
      const similar = findSimilarTracks(track, storage.tracks, limit);
      return [track, ...similar.map((s) => s.track)];
    },
    [storage.tracks],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      tracks: storage.tracks,
      playlists: storage.playlists,
      loading: storage.loading,
      importing: storage.importing,
      storageEstimate: storage.storageEstimate,
      importFiles: storage.importFiles,
      removeTrack: storage.removeTrack,
      patchTrack: storage.patchTrack,
      createPlaylist: storage.createPlaylist,
      updatePlaylist: storage.updatePlaylist,
      removePlaylist: storage.removePlaylist,
      ai,
      player,
      playSimilar,
      smartFlowQueue,
      expandedPlayer,
      setExpandedPlayer,
      queuePanelOpen,
      setQueuePanelOpen,
    }),
    [storage, ai, player, playSimilar, smartFlowQueue, expandedPlayer, queuePanelOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track, AILoadProgress, MoodTag } from '@/types';
import { aiEngine } from '@/utils/aiEngine';
import { buildTrackContextText } from '@/utils/vector';

export interface AIState {
  loadProgress: AILoadProgress;
  enabled: boolean;
  processingIds: Set<string>;
}

const initialProgress: AILoadProgress = {
  stage: 'idle',
  model: '',
  progress: 0,
  message: 'AI engine idle',
};

export function useLocalAI(
  tracks: Track[],
  patchTrack: (id: string, patch: Partial<Track>) => Promise<Track | undefined>,
) {
  const [loadProgress, setLoadProgress] = useState<AILoadProgress>(initialProgress);
  const [enabled, setEnabled] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const unsub = aiEngine.onProgress((p) => setLoadProgress(p));
    aiEngine
      .init()
      .catch((err) => {
        setLoadProgress({
          stage: 'error',
          model: 'all',
          progress: 0,
          message: err?.message ?? 'AI init failed',
        });
      });
    return () => unsub();
  }, []);

  const analyzeTrack = useCallback(
    async (track: Track): Promise<{ mood: MoodTag; confidence: number; embedding: number[] } | null> => {
      if (!aiEngine.isReady()) return null;
      const contextText = buildTrackContextText(track);
      try {
        setProcessingIds((prev) => new Set(prev).add(track.id));
        const [embeddings, classifyResult] = await Promise.all([
          aiEngine.embed([contextText]),
          aiEngine.classify(contextText),
        ]);
        const embedding = embeddings[0];
        await patchTrack(track.id, {
          embedding,
          mood: classifyResult.mood,
          moodConfidence: classifyResult.confidence,
          contextText,
        });
        return {
          mood: classifyResult.mood,
          confidence: classifyResult.confidence,
          embedding,
        };
      } catch (err) {
        return null;
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    },
    [patchTrack],
  );

  const analyzeAll = useCallback(async (): Promise<number> => {
    if (!aiEngine.isReady()) return 0;
    let count = 0;
    for (const track of tracks) {
      if (track.embedding) continue;
      const result = await analyzeTrack(track);
      if (result) count++;
    }
    return count;
  }, [tracks, analyzeTrack]);

  const toggleEnabled = useCallback(() => setEnabled((e) => !e), []);

  return {
    loadProgress,
    enabled,
    processingIds,
    analyzeTrack,
    analyzeAll,
    toggleEnabled,
    isReady: aiEngine.isReady(),
  };
}

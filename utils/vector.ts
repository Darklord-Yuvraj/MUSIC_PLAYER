import type { Track, SimilarityResult } from '@/types';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

export function findSimilarTracks(
  sourceTrack: Track,
  allTracks: Track[],
  limit = 20,
): SimilarityResult[] {
  if (!sourceTrack.embedding) return [];
  const scored = allTracks
    .filter((t) => t.id !== sourceTrack.id && t.embedding)
    .map((t) => ({
      track: t,
      score: cosineSimilarity(sourceTrack.embedding!, t.embedding!),
    }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export function buildTrackContextText(track: Track): string {
  const parts = [track.title, track.artist];
  if (track.album) parts.push(track.album);
  parts.push(track.mood ? `mood: ${track.mood}` : 'mood: unknown');
  parts.push(`duration: ${Math.round(track.durationSec)}s`);
  return parts.join(' ');
}

export function l2Normalize(vec: number[]): number[] {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

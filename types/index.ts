export type MoodTag =
  | 'focus'
  | 'high-energy'
  | 'chill'
  | 'dark';

export interface MoodDefinition {
  id: MoodTag;
  label: string;
  description: string;
  gradient: [string, string];
  accent: string;
  emoji: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationSec: number;
  coverArt?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  dateAdded: number;
  mood?: MoodTag | null;
  moodConfidence?: number;
  embedding?: number[] | null;
  contextText?: string;
  playCount: number;
  lastPlayed?: number | null;
  language?: string | null;
  genre?: string | null;
  year?: number | null;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
  coverColor: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerPreset = 'bars' | 'waves' | 'circular';

export interface QueueItem {
  trackId: string;
}

export interface AILoadProgress {
  stage: 'idle' | 'loading-pipeline' | 'ready' | 'error';
  model: string;
  progress: number;
  message: string;
}

export interface SimilarityResult {
  track: Track;
  score: number;
}

export const MOOD_DEFINITIONS: MoodDefinition[] = [
  {
    id: 'focus',
    label: 'Focus / Deep Work',
    description: 'Steady, low-distraction soundscapes for concentration.',
    gradient: ['#0ea5e9', '#2563eb'],
    accent: '#38bdf8',
    emoji: '🎯',
  },
  {
    id: 'high-energy',
    label: 'High Energy',
    description: 'Upbeat, driving tracks to keep you moving.',
    gradient: ['#f97316', '#dc2626'],
    accent: '#fb923c',
    emoji: '⚡',
  },
  {
    id: 'chill',
    label: 'Chill / Lo-Fi',
    description: 'Relaxed, mellow grooves for unwinding.',
    gradient: ['#14b8a6', '#0d9488'],
    accent: '#2dd4bf',
    emoji: '🌊',
  },
  {
    id: 'dark',
    label: 'Dark / Melancholic',
    description: 'Moody, introspective tones for late nights.',
    gradient: ['#7c3aed', '#4c1d95'],
    accent: '#a78bfa',
    emoji: '🌙',
  },
];

export function getMoodDefinition(id?: MoodTag | null): MoodDefinition | undefined {
  return MOOD_DEFINITIONS.find((m) => m.id === id);
}

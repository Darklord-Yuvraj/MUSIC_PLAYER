import { Buffer } from 'buffer';
import type { Track } from '@/types';

(globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;

interface ParsedMetadata {
  title: string;
  artist: string;
  album?: string;
  durationSec: number;
  coverArt?: string | null;
  fileType: string;
  language?: string | null;
  genre?: string | null;
  year?: number | null;
}

function guessFileType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'flac':
      return 'audio/flac';
    case 'ogg':
      return 'audio/ogg';
    case 'm4a':
      return 'audio/mp4';
    default:
      return 'audio/mpeg';
  }
}

export async function parseAudioMetadata(file: File): Promise<ParsedMetadata> {
  const fileType = guessFileType(file);
  const arrayBuffer = await file.arrayBuffer();

  let title = file.name.replace(/\.[^.]+$/, '');
  let artist = 'Unknown Artist';
  let album: string | undefined;
  let durationSec = 0;
  let coverArt: string | null = null;
  let language: string | null = null;
  let genre: string | null = null;
  let year: number | null = null;

  try {
    const musicMetadata = await import('music-metadata');
    const buffer = Buffer.from(arrayBuffer);
    const metadata = await musicMetadata.parseBlob(new Blob([buffer], { type: fileType })) ;
    // Fallback: parseBuffer for direct buffer parsing
    const parsed = metadata || (await musicMetadata.parseBuffer(buffer, { mimeType: fileType }));
    const common = (parsed as any).common;
    title = common?.title || title;
    artist = common?.artist || artist;
    album = common?.album;
    durationSec = (parsed as any).format?.duration || 0;
    language = common?.language || null;
    genre = Array.isArray(common?.genre) ? common.genre[0] : (common?.genre || null);
    year = common?.year || null;

    const picture = common?.picture?.[0];
    if (picture) {
      const coverBuffer = Buffer.from(picture.data);
      const base64 = coverBuffer.toString('base64');
      coverArt = `data:${picture.format};base64,${base64}`;
    }
  } catch (e) {
    // Fallback: compute duration via an <audio> element
    try {
      durationSec = await getAudioDuration(arrayBuffer, fileType);
    } catch {
      durationSec = 0;
    }
  }

  return { title, artist, album, durationSec, coverArt, fileType, language, genre, year };
}

function getAudioDuration(arrayBuffer: ArrayBuffer, type: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([arrayBuffer], { type });
    const url = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration || 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio metadata'));
    };
    audio.src = url;
  });
}

export function createTrackFromFile(
  file: File,
  meta: ParsedMetadata,
): Omit<Track, 'id'> {
  return {
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    durationSec: meta.durationSec,
    coverArt: meta.coverArt,
    fileName: file.name,
    fileType: meta.fileType,
    fileSize: file.size,
    dateAdded: Date.now(),
    mood: null,
    moodConfidence: 0,
    embedding: null,
    contextText: '',
    playCount: 0,
    lastPlayed: null,
    language: meta.language || null,
    genre: meta.genre || null,
    year: meta.year || null,
  };
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

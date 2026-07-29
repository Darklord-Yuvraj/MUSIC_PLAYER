import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Track, Playlist } from '@/types';

const DB_NAME = 'neural-audio-db';
const DB_VERSION = 1;

interface NeuralAudioDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: { 'by-date': number; 'by-artist': string };
  };
  audioBlobs: {
    key: string;
    value: { id: string; blob: Blob; createdAt: number };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: { 'by-updated': number };
  };
}

let dbPromise: Promise<IDBPDatabase<NeuralAudioDB>> | null = null;

function getDB(): Promise<IDBPDatabase<NeuralAudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NeuralAudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tracks')) {
          const tracksStore = db.createObjectStore('tracks', { keyPath: 'id' });
          tracksStore.createIndex('by-date', 'dateAdded');
          tracksStore.createIndex('by-artist', 'artist');
        }
        if (!db.objectStoreNames.contains('audioBlobs')) {
          db.createObjectStore('audioBlobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('playlists')) {
          const plStore = db.createObjectStore('playlists', { keyPath: 'id' });
          plStore.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function putTrack(track: Track): Promise<void> {
  const db = await getDB();
  await db.put('tracks', track);
}

export async function getTrack(id: string): Promise<Track | undefined> {
  const db = await getDB();
  return db.get('tracks', id);
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('tracks', 'by-date');
  return all.reverse();
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
  await db.delete('audioBlobs', id);
}

export async function updateTrack(id: string, patch: Partial<Track>): Promise<Track | undefined> {
  const db = await getDB();
  const existing = await db.get('tracks', id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  await db.put('tracks', updated);
  return updated;
}

export async function putAudioBlob(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put('audioBlobs', { id, blob, createdAt: Date.now() });
}

export async function getAudioBlob(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  const rec = await db.get('audioBlobs', id);
  return rec?.blob;
}

export async function getAudioURL(id: string): Promise<string | null> {
  const blob = await getAudioBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('playlists', 'by-updated');
  return all.reverse();
}

export async function putPlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const est = await navigator.storage.estimate();
  return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
}

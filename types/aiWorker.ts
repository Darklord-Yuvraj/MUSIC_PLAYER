import type { MoodTag, AILoadProgress } from '@/types';

export interface EmbedRequest {
  type: 'embed';
  id: string;
  texts: string[];
}

export interface ClassifyRequest {
  type: 'classify';
  id: string;
  text: string;
  candidates: { id: MoodTag; label: string; description: string }[];
}

export interface InitRequest {
  type: 'init';
  embedModel: string;
  classifyModel: string;
}

export type WorkerRequest = InitRequest | EmbedRequest | ClassifyRequest;

export interface WorkerProgress {
  type: 'progress';
  model: string;
  progress: number;
  file: string;
}

export interface WorkerReady {
  type: 'ready';
}

export interface WorkerEmbedResult {
  type: 'embed-result';
  id: string;
  embeddings: number[][];
}

export interface WorkerClassifyResult {
  type: 'classify-result';
  id: string;
  mood: MoodTag;
  confidence: number;
  scores: { id: MoodTag; score: number }[];
}

export interface WorkerError {
  type: 'error';
  id?: string;
  message: string;
}

export type WorkerResponse =
  | WorkerProgress
  | WorkerReady
  | WorkerEmbedResult
  | WorkerClassifyResult
  | WorkerError;

export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2';
export const CLASSIFY_MODEL = 'Xenova/all-MiniLM-L6-v2';

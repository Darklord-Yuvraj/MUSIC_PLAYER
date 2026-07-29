import type { MoodTag, AILoadProgress } from '@/types';
import type {
  WorkerRequest,
  WorkerResponse,
  EmbedRequest,
  ClassifyRequest,
} from '@/types/aiWorker';
import { EMBED_MODEL } from '@/types/aiWorker';
import { MOOD_DEFINITIONS } from '@/types';

type ProgressListener = (p: AILoadProgress) => void;

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (err: Error) => void;
}

const WORKER_SOURCE = `
let embedder = null;
let embedModelName = '${EMBED_MODEL}';

function post(msg) {
  self.postMessage(msg);
}

async function ensureEmbedder() {
  if (!embedder) {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    embedder = await pipeline('feature-extraction', embedModelName, {
      progress_callback: (data) => {
        if (data.status === 'progress') {
          post({ type: 'progress', model: embedModelName, progress: data.progress || 0, file: data.file || '' });
        }
      },
    });
  }
  return embedder;
}

async function embed(texts) {
  const ext = await ensureEmbedder();
  const outputs = await ext(texts, { pooling: 'mean', normalize: true });
  const dims = outputs.dims;
  const data = outputs.data;
  const batch = dims[0], dim = dims[1];
  const result = [];
  for (let i = 0; i < batch; i++) {
    const row = [];
    for (let j = 0; j < dim; j++) row.push(data[i * dim + j]);
    result.push(row);
  }
  return result;
}

async function classifyMood(text, candidates) {
  const ext = await ensureEmbedder();
  const queryOut = await ext([text], { pooling: 'mean', normalize: true });
  const queryEmbedding = queryOut.data;
  const candidateTexts = candidates.map(c => c.label + '. ' + c.description);
  const candOut = await ext(candidateTexts, { pooling: 'mean', normalize: true });
  const candidateEmbeddings = candOut.data;
  const dim = queryEmbedding.length;
  const scores = candidates.map((c, idx) => {
    const cand = candidateEmbeddings.slice(idx * dim, (idx + 1) * dim);
    let dot = 0;
    for (let i = 0; i < dim; i++) dot += queryEmbedding[i] * cand[i];
    return { id: c.id, score: dot };
  });
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  const total = scores.reduce((s, x) => s + Math.exp(x.score), 0);
  const confidence = total > 0 ? Math.exp(best.score) / total : 0;
  return { mood: best.id, confidence, scores };
}

self.onmessage = async (e) => {
  const req = e.data;
  try {
    if (req.type === 'init') {
      embedModelName = req.embedModel || embedModelName;
      post({ type: 'ready' });
      return;
    }
    if (req.type === 'embed') {
      const embeddings = await embed(req.texts);
      post({ type: 'embed-result', id: req.id, embeddings });
      return;
    }
    if (req.type === 'classify') {
      const result = await classifyMood(req.text, req.candidates);
      post({ type: 'classify-result', id: req.id, mood: result.mood, confidence: result.confidence, scores: result.scores });
      return;
    }
  } catch (err) {
    post({ type: 'error', id: req.id, message: (err && err.message) || 'Unknown worker error' });
  }
};
`;

export class AIEngine {
  private worker: Worker | null = null;
  private workerURL: string | null = null;
  private pending = new Map<string, PendingRequest>();
  private progressListeners = new Set<ProgressListener>();
  private ready = false;
  private readyPromise: Promise<void> | null = null;
  private reqCounter = 0;

  private nextId(): string {
    this.reqCounter += 1;
    return `req-${this.reqCounter}`;
  }

  onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private emitProgress(p: AILoadProgress) {
    this.progressListeners.forEach((l) => l(p));
  }

  async init(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        if (typeof Worker === 'undefined') {
          throw new Error('Web Workers not supported in this environment');
        }
        const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
        this.workerURL = URL.createObjectURL(blob);
        this.worker = new Worker(this.workerURL, { type: 'module' });
        const onMessage = (e: MessageEvent<WorkerResponse>) => {
          const msg = e.data;
          if (msg.type === 'ready') {
            this.ready = true;
            this.emitProgress({
              stage: 'ready',
              model: 'all',
              progress: 100,
              message: 'AI engine ready',
            });
            resolve();
          } else if (msg.type === 'progress') {
            this.emitProgress({
              stage: 'loading-pipeline',
              model: msg.model,
              progress: msg.progress,
              message: `Loading ${msg.file || msg.model}`,
            });
          } else if (msg.type === 'embed-result' || msg.type === 'classify-result') {
            const pending = this.pending.get(msg.id);
            if (pending) {
              this.pending.delete(msg.id);
              pending.resolve(msg);
            }
          } else if (msg.type === 'error') {
            if (msg.id) {
              const pending = this.pending.get(msg.id);
              if (pending) {
                this.pending.delete(msg.id);
                pending.reject(new Error(msg.message));
                return;
              }
            }
            this.emitProgress({
              stage: 'error',
              model: 'all',
              progress: 0,
              message: msg.message,
            });
            if (!this.ready) reject(new Error(msg.message));
          }
        };
        this.worker.onmessage = onMessage;
        this.worker.onerror = (err) => {
          this.emitProgress({
            stage: 'error',
            model: 'all',
            progress: 0,
            message: err.message || 'Worker error',
          });
          if (!this.ready) reject(new Error(err.message || 'Worker failed to start'));
        };
        const initReq: WorkerRequest = {
          type: 'init',
          embedModel: EMBED_MODEL,
          classifyModel: EMBED_MODEL,
        };
        this.worker.postMessage(initReq);
        this.emitProgress({
          stage: 'loading-pipeline',
          model: 'all',
          progress: 0,
          message: 'Initializing AI engine',
        });
      } catch (err: any) {
        this.emitProgress({
          stage: 'error',
          model: 'all',
          progress: 0,
          message: err?.message ?? 'Init failed',
        });
        reject(err);
      }
    });
    return this.readyPromise;
  }

  private send<T>(req: WorkerRequest & { id: string }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.worker || !this.ready) {
        reject(new Error('AI engine not ready'));
        return;
      }
      this.pending.set(req.id, { resolve, reject });
      this.worker.postMessage(req);
    });
  }

  async embed(texts: string[]): Promise<number[][]> {
    const id = this.nextId();
    const req: EmbedRequest = { type: 'embed', id, texts };
    const res = await this.send<{ embeddings: number[][] }>(req);
    return res.embeddings;
  }

  async classify(text: string): Promise<{
    mood: MoodTag;
    confidence: number;
    scores: { id: MoodTag; score: number }[];
  }> {
    const id = this.nextId();
    const candidates = MOOD_DEFINITIONS.map((m) => ({
      id: m.id,
      label: m.label,
      description: m.description,
    }));
    const req: ClassifyRequest = { type: 'classify', id, text, candidates };
    const res = await this.send<any>(req);
    return {
      mood: res.mood,
      confidence: res.confidence,
      scores: res.scores,
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.workerURL) {
      URL.revokeObjectURL(this.workerURL);
      this.workerURL = null;
    }
    this.ready = false;
    this.readyPromise = null;
    this.pending.clear();
  }
}

export const aiEngine = new AIEngine();

import { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Cpu, Sparkles, Activity, Zap, Loader2, Brain, Network } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { MOOD_DEFINITIONS, getMoodDefinition, type MoodTag } from '@/types';
import { CoverArt } from '@/components/CoverArt';
import { cosineSimilarity } from '@/utils/vector';

interface NeuronNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  firePhase: number;
  fireSpeed: number;
  layer: number;
}

interface NeuralLink {
  from: number;
  to: number;
  strength: number;
  flowPhase: number;
}

function NeuralNetworkCanvas({ trackCount, analyzedCount }: { trackCount: number; analyzedCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Build layered neural network
    const layers = [4, 6, 5, 3];
    const nodes: NeuronNode[] = [];
    const links: NeuralLink[] = [];
    const padX = 40;
    const padY = 30;

    layers.forEach((count, li) => {
      const x = padX + (li / (layers.length - 1)) * (0);
      for (let i = 0; i < count; i++) {
        const idx = nodes.length;
        nodes.push({
          x: 0, y: 0, vx: 0, vy: 0,
          radius: 4 + Math.random() * 3,
          firePhase: Math.random() * Math.PI * 2,
          fireSpeed: 0.5 + Math.random() * 1.5,
          layer: li,
        });
        if (li > 0) {
          const prevLayerStart = nodes.length - count - layers[li - 1];
          for (let j = 0; j < layers[li - 1]; j++) {
            links.push({
              from: prevLayerStart + j,
              to: idx,
              strength: 0.3 + Math.random() * 0.7,
              flowPhase: Math.random() * Math.PI * 2,
            });
          }
        }
      }
    });

    const layoutNodes = () => {
      const usableW = w - padX * 2;
      const usableH = h - padY * 2;
      let idx = 0;
      layers.forEach((count, li) => {
        const x = padX + (li / (layers.length - 1)) * usableW;
        for (let i = 0; i < count; i++) {
          const y = padY + ((i + 0.5) / count) * usableH;
          nodes[idx].x = x;
          nodes[idx].y = y;
          idx++;
        }
      });
    };
    layoutNodes();

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Draw connections with flowing data
      for (const link of links) {
        const a = nodes[link.from];
        const b = nodes[link.to];
        if (!a || !b) continue;

        const flowT = (frame * 0.02 + link.flowPhase) % 1;
        const fireIntensity = (Math.sin(frame * 0.03 * link.strength + link.flowPhase) + 1) / 2;

        // Base line
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(34,211,238,${0.05 + link.strength * 0.06})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Flowing data particle along the line
        const px = a.x + (b.x - a.x) * flowT;
        const py = a.y + (b.y - a.y) * flowT;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grad.addColorStop(0, `rgba(167,139,250,${0.6 * fireIntensity})`);
        grad.addColorStop(1, 'rgba(167,139,250,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();

        // Bright dot at flow position
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${0.8 * fireIntensity})`;
        ctx.fill();
      }

      // Draw neurons
      for (const node of nodes) {
        const fire = (Math.sin(frame * 0.04 * node.fireSpeed + node.firePhase) + 1) / 2;
        const glowR = node.radius + fire * 8;

        // Glow
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
        grad.addColorStop(0, `rgba(34,211,238,${0.3 + fire * 0.4})`);
        grad.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,211,238,${0.4 + fire * 0.6})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + fire * 0.5})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [trackCount, analyzedCount]);

  if (Platform.OS !== 'web') {
    return <View style={styles.canvasFallback} />;
  }

  return (
    <View style={styles.canvasContainer}>
      <canvas
        ref={canvasRef as any}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}

export function AIInsightsPanel() {
  const { tracks, ai, smartFlowQueue, player } = useApp();

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tracks) {
      if (t.mood) counts[t.mood] = (counts[t.mood] || 0) + 1;
    }
    return counts;
  }, [tracks]);

  const analyzedCount = useMemo(
    () => tracks.filter((t) => t.embedding).length,
    [tracks],
  );

  const similarPairs = useMemo(() => {
    const embedded = tracks.filter((t) => t.embedding);
    const pairs: { a: typeof tracks[0]; b: typeof tracks[0]; score: number }[] = [];
    for (let i = 0; i < embedded.length; i++) {
      for (let j = i + 1; j < embedded.length; j++) {
        const score = cosineSimilarity(embedded[i].embedding!, embedded[j].embedding!);
        if (score > 0.5) {
          pairs.push({ a: embedded[i], b: embedded[j], score });
        }
      }
    }
    return pairs.sort((x, y) => y.score - x.score).slice(0, 8);
  }, [tracks]);

  const maxMoodCount = Math.max(1, ...Object.values(moodCounts));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Neural network visualization card */}
      <View style={styles.neuralCard}>
        <View style={styles.neuralHeader}>
          <Network size={18} color={Theme.colors.cyan} />
          <View style={styles.neuralHeaderText}>
            <Text style={styles.neuralTitle}>Neural Network Map</Text>
            <Text style={styles.neuralSub}>
              {analyzedCount > 0
                ? `${analyzedCount} tracks mapped · 384-dim embeddings`
                : 'Analyze tracks to map their neural fingerprint'}
            </Text>
          </View>
          <View style={[styles.statusDot, ai.isReady ? styles.statusReady : styles.statusLoading]} />
        </View>
        <NeuralNetworkCanvas trackCount={tracks.length} analyzedCount={analyzedCount} />
      </View>

      {/* Engine status card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Cpu size={20} color={Theme.colors.cyan} />
          <Text style={styles.cardTitle}>On-Device AI Engine</Text>
          <View style={[styles.statusDot, ai.isReady ? styles.statusReady : styles.statusLoading]} />
        </View>
        <Text style={styles.statusText}>{ai.loadProgress.message}</Text>
        {ai.loadProgress.stage === 'loading-pipeline' && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${ai.loadProgress.progress}%` },
              ]}
            />
          </View>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Brain size={15} color={Theme.colors.violet} />
            <Text style={styles.statValue}>{analyzedCount}/{tracks.length}</Text>
            <Text style={styles.statLabel}>Analyzed</Text>
          </View>
          <View style={styles.statItem}>
            <Zap size={15} color={Theme.colors.cyan} />
            <Text style={styles.statValue}>384-dim</Text>
            <Text style={styles.statLabel}>Embeddings</Text>
          </View>
          <View style={styles.statItem}>
            <Activity size={15} color={Theme.colors.neon} />
            <Text style={styles.statValue}>WASM</Text>
            <Text style={styles.statLabel}>Runtime</Text>
          </View>
        </View>
      </View>

      {/* Analyze all button */}
      {ai.isReady && analyzedCount < tracks.length && (
        <Pressable style={styles.analyzeAllBtn} onPress={() => ai.analyzeAll()}>
          <Sparkles size={16} color={Theme.colors.cyan} />
          <Text style={styles.analyzeAllText}>
            Analyze All Remaining ({tracks.length - analyzedCount})
          </Text>
        </Pressable>
      )}

      {/* Mood distribution */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mood Distribution</Text>
        <View style={styles.moodList}>
          {MOOD_DEFINITIONS.map((mood) => {
            const count = moodCounts[mood.id] || 0;
            const widthPct = (count / maxMoodCount) * 100;
            return (
              <View key={mood.id} style={styles.moodRow}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <View style={styles.moodBarWrap}>
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                  <View style={styles.moodBarTrack}>
                    <View
                      style={[
                        styles.moodBarFill,
                        { width: `${widthPct}%`, backgroundColor: mood.accent },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.moodCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Vector similarity map */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Brain size={18} color={Theme.colors.violet} />
          <Text style={styles.cardTitle}>Vector Similarity Map</Text>
        </View>
        <Text style={styles.cardSub}>Closest matching track pairs by cosine similarity</Text>
        {similarPairs.length === 0 ? (
          <Text style={styles.emptyText}>
            {analyzedCount < 2
              ? 'Analyze at least 2 tracks to see similarity maps'
              : 'No strong matches found yet'}
          </Text>
        ) : (
          <View style={styles.pairsList}>
            {similarPairs.map((pair, i) => (
              <View key={i} style={styles.pairRow}>
                <View style={styles.pairTrack}>
                  <CoverArt track={pair.a} size={32} radius={6} />
                  <Text style={styles.pairTitle} numberOfLines={1}>{pair.a.title}</Text>
                </View>
                <View style={styles.pairScoreWrap}>
                  <View style={styles.pairScoreBar}>
                    <View style={[styles.pairScoreFill, { width: `${pair.score * 100}%` }]} />
                  </View>
                  <Text style={styles.pairScore}>{(pair.score * 100).toFixed(0)}%</Text>
                </View>
                <View style={styles.pairTrack}>
                  <CoverArt track={pair.b} size={32} radius={6} />
                  <Text style={styles.pairTitle} numberOfLines={1}>{pair.b.title}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Processing indicator */}
      {ai.processingIds.size > 0 && (
        <View style={styles.processingCard}>
          <Loader2 size={16} color={Theme.colors.violet} />
          <Text style={styles.processingText}>
            Analyzing {ai.processingIds.size} track{ai.processingIds.size > 1 ? 's' : ''}…
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  // Neural network card
  neuralCard: {
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    overflow: 'hidden',
    ...(Platform.select({
      web: { boxShadow: '0 0 40px rgba(34,211,238,0.04)' },
    }) as any),
  },
  neuralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.zinc800,
  },
  neuralHeaderText: { flex: 1, gap: 2 },
  neuralTitle: { color: Theme.colors.zinc100, fontSize: 16, fontWeight: '700' },
  neuralSub: { color: Theme.colors.zinc500, fontSize: 11 },
  canvasContainer: { width: '100%', height: 260 },
  canvasFallback: { width: '100%', height: 260, backgroundColor: Theme.colors.obsidian },
  // Cards
  card: {
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: Theme.colors.zinc100, fontSize: 16, fontWeight: '700' },
  cardSub: { color: Theme.colors.zinc600, fontSize: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 'auto' },
  statusReady: {
    backgroundColor: Theme.colors.success,
    ...(Platform.select({ web: { boxShadow: '0 0 8px rgba(34,197,94,0.6)' } }) as any),
  },
  statusLoading: {
    backgroundColor: Theme.colors.warning,
    ...(Platform.select({ web: { boxShadow: '0 0 8px rgba(245,158,11,0.6)' } }) as any),
  },
  statusText: { color: Theme.colors.zinc400, fontSize: 13 },
  progressBar: {
    height: 4,
    backgroundColor: Theme.colors.zinc800,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyan,
    borderRadius: 2,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: Theme.colors.zinc900,
    borderRadius: Theme.radius.md,
    padding: 10,
  },
  statValue: { color: Theme.colors.zinc100, fontSize: 15, fontWeight: '700' },
  statLabel: {
    color: Theme.colors.zinc600,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analyzeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.cyan + '15',
    borderWidth: 1,
    borderColor: Theme.colors.cyan + '40',
    ...(Platform.select({
      web: {
        transitionProperty: 'box-shadow, background-color',
        transitionDuration: '300ms',
        cursor: 'pointer',
      },
    }) as any),
  },
  analyzeAllText: { color: Theme.colors.cyan, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: Theme.colors.zinc100, fontSize: 16, fontWeight: '700' },
  moodList: { gap: 10 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodEmoji: { fontSize: 18, width: 24 },
  moodBarWrap: { flex: 1, gap: 4 },
  moodLabel: { color: Theme.colors.zinc300, fontSize: 12, fontWeight: '500' },
  moodBarTrack: {
    height: 6,
    backgroundColor: Theme.colors.zinc900,
    borderRadius: 3,
    overflow: 'hidden',
  },
  moodBarFill: { height: '100%', borderRadius: 3 },
  moodCount: {
    color: Theme.colors.zinc400,
    fontSize: 13,
    fontWeight: '600',
    width: 28,
    textAlign: 'right',
  },
  pairsList: { gap: 10 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairTrack: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pairTitle: { color: Theme.colors.zinc300, fontSize: 11, flexShrink: 1 },
  pairScoreWrap: { width: 80, alignItems: 'center', gap: 2 },
  pairScoreBar: {
    width: '100%',
    height: 4,
    backgroundColor: Theme.colors.zinc800,
    borderRadius: 2,
    overflow: 'hidden',
  },
  pairScoreFill: { height: '100%', backgroundColor: Theme.colors.violet, borderRadius: 2 },
  pairScore: { color: Theme.colors.violet, fontSize: 10, fontWeight: '600' },
  emptyText: { color: Theme.colors.zinc600, fontSize: 13, paddingVertical: 8 },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.violet + '10',
    borderWidth: 1,
    borderColor: Theme.colors.violet + '30',
  },
  processingText: { color: Theme.colors.violet, fontSize: 13 },
});

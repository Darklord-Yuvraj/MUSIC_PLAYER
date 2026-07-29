import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Cpu, Sparkles, Activity, Zap, Loader2, Brain } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { MOOD_DEFINITIONS, getMoodDefinition, type MoodTag } from '@/types';
import { CoverArt } from '@/components/CoverArt';
import { cosineSimilarity } from '@/utils/vector';

export function AIInsightsPanel() {
  const { tracks, ai, playSimilar, smartFlowQueue, player } = useApp();

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
            <View style={[styles.progressFill, { width: `${ai.loadProgress.progress}%` }]} />
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
                      style={[styles.moodBarFill, { width: `${widthPct}%`, backgroundColor: mood.accent }]}
                    />
                  </View>
                </View>
                <Text style={styles.moodCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Analyze all button */}
      {ai.isReady && analyzedCount < tracks.length && (
        <Pressable style={styles.analyzeAllBtn} onPress={() => ai.analyzeAll()}>
          <Sparkles size={16} color={Theme.colors.cyan} />
          <Text style={styles.analyzeAllText}>Analyze All Remaining ({tracks.length - analyzedCount})</Text>
        </Pressable>
      )}

      {/* Vector similarity map */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Brain size={18} color={Theme.colors.violet} />
          <Text style={styles.cardTitle}>Vector Similarity Map</Text>
        </View>
        <Text style={styles.cardSub}>Closest matching track pairs by cosine similarity</Text>
        {similarPairs.length === 0 ? (
          <Text style={styles.emptyText}>
            {analyzedCount < 2 ? 'Analyze at least 2 tracks to see similarity maps' : 'No strong matches found yet'}
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
  statusReady: { backgroundColor: Theme.colors.success },
  statusLoading: { backgroundColor: Theme.colors.warning },
  statusText: { color: Theme.colors.zinc400, fontSize: 13 },
  progressBar: { height: 4, backgroundColor: Theme.colors.zinc800, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.colors.cyan, borderRadius: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 2, backgroundColor: Theme.colors.zinc900, borderRadius: Theme.radius.md, padding: 10 },
  statValue: { color: Theme.colors.zinc100, fontSize: 15, fontWeight: '700' },
  statLabel: { color: Theme.colors.zinc600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { color: Theme.colors.zinc100, fontSize: 16, fontWeight: '700' },
  moodList: { gap: 10 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodEmoji: { fontSize: 18, width: 24 },
  moodBarWrap: { flex: 1, gap: 4 },
  moodLabel: { color: Theme.colors.zinc300, fontSize: 12, fontWeight: '500' },
  moodBarTrack: { height: 6, backgroundColor: Theme.colors.zinc900, borderRadius: 3, overflow: 'hidden' },
  moodBarFill: { height: '100%', borderRadius: 3 },
  moodCount: { color: Theme.colors.zinc400, fontSize: 13, fontWeight: '600', width: 28, textAlign: 'right' },
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
  },
  analyzeAllText: { color: Theme.colors.cyan, fontSize: 14, fontWeight: '600' },
  pairsList: { gap: 10 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairTrack: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pairTitle: { color: Theme.colors.zinc300, fontSize: 11, flexShrink: 1 },
  pairScoreWrap: { width: 80, alignItems: 'center', gap: 2 },
  pairScoreBar: { width: '100%', height: 4, backgroundColor: Theme.colors.zinc800, borderRadius: 2, overflow: 'hidden' },
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

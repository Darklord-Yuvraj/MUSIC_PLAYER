import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform, ScrollView } from 'react-native';
import {
  Play, Pause, SkipBack, SkipForward, ChevronDown, Shuffle, Repeat, Repeat1,
  Sparkles, Activity, Cpu, Volume2, Volume1, VolumeX, Plus, Minus,
} from 'lucide-react-native';
import { CoverArt } from '@/components/CoverArt';
import { Visualizer } from '@/components/Visualizer';
import { MoodBadge } from '@/components/MoodBadge';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatTime } from '@/utils/format';
import type { VisualizerPreset } from '@/types';

const PRESETS: { id: VisualizerPreset; label: string }[] = [
  { id: 'bars', label: 'Bars' },
  { id: 'waves', label: 'Waves' },
  { id: 'circular', label: 'Circular' },
];

export function FullscreenPlayer() {
  const { player, expandedPlayer, setExpandedPlayer, smartFlowQueue, ai } = useApp();
  const track = player.currentTrack;
  const [preset, setPreset] = useState<VisualizerPreset>('bars');

  const onSeek = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      player.seek(parseFloat((e.currentTarget as HTMLInputElement).value));
    },
    [player],
  );

  const similarTracks = useMemo(() => {
    if (!track) return [];
    const queue = smartFlowQueue(track, 6);
    return queue.slice(1);
  }, [track, smartFlowQueue]);

  const volumeUp = useCallback(() => {
    player.setVolume(Math.min(1, player.volume + 0.1));
  }, [player]);

  const volumeDown = useCallback(() => {
    player.setVolume(Math.max(0, player.volume - 0.1));
  }, [player]);

  if (!track) return null;

  const progress = player.durationSec > 0 ? (player.positionSec / player.durationSec) * 100 : 0;
  const RepeatIconComp = player.repeat === 'one' ? Repeat1 : Repeat;

  return (
    <Modal visible={expandedPlayer} animationType="slide" transparent={false} onRequestClose={() => setExpandedPlayer(false)}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Ambient glows */}
        <View style={styles.ambientGlow1} />
        <View style={styles.ambientGlow2} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => setExpandedPlayer(false)}>
            <ChevronDown size={24} color={Theme.colors.zinc300} />
          </Pressable>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Artwork + visualizer */}
        <View style={styles.artSection}>
          <View style={styles.artWrap}>
            <CoverArt track={track} size={280} radius={20} />
            {player.usingFallback && (
              <View style={styles.fallbackBadge}>
                <Text style={styles.fallbackText}>HTML5 Audio</Text>
              </View>
            )}
          </View>

          <View style={styles.visualizerWrap}>
            <Visualizer
              getAnalyser={player.getAnalyser}
              preset={preset}
              active={player.isPlaying}
              height={90}
            />
          </View>

          {/* Preset switcher */}
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.presetChip, preset === p.id && styles.presetChipActive]}
                onPress={() => setPreset(p.id)}
              >
                <Text style={[styles.presetText, preset === p.id && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Track info + AI badge */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.trackTitle} numberOfLines={2}>{track.title}</Text>
              <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
            </View>
            <MoodBadge mood={track.mood} confidence={track.moodConfidence} size="md" />
          </View>
        </View>

        {/* Progress + controls */}
        <View style={styles.controlsSection}>
          <View style={styles.progressRow}>
            <Text style={styles.time}>{formatTime(player.positionSec)}</Text>
            {Platform.OS === 'web' ? (
              <input
                type="range"
                min={0}
                max={player.durationSec || 0}
                step={0.1}
                value={player.positionSec}
                onChange={onSeek}
                style={styles.rangeInput as any}
              />
            ) : (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            )}
            <Text style={styles.time}>{formatTime(player.durationSec)}</Text>
          </View>

          <View style={styles.mainControls}>
            <Pressable
              style={[styles.controlBtn, player.shuffle && styles.controlBtnActive]}
              onPress={player.toggleShuffle}
            >
              <Shuffle size={20} color={player.shuffle ? Theme.colors.cyan : Theme.colors.zinc400} />
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={player.previous}>
              <SkipBack size={28} color={Theme.colors.zinc100} fill={Theme.colors.zinc100} />
            </Pressable>
            <Pressable style={styles.playBtn} onPress={player.togglePlay}>
              {player.isPlaying ? (
                <Pause size={30} color={Theme.colors.obsidian} fill={Theme.colors.obsidian} />
              ) : (
                <Play size={30} color={Theme.colors.obsidian} fill={Theme.colors.obsidian} />
              )}
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={player.next}>
              <SkipForward size={28} color={Theme.colors.zinc100} fill={Theme.colors.zinc100} />
            </Pressable>
            <Pressable
              style={[styles.controlBtn, player.repeat !== 'off' && styles.controlBtnActive]}
              onPress={player.cycleRepeat}
            >
              <RepeatIconComp size={20} color={player.repeat !== 'off' ? Theme.colors.cyan : Theme.colors.zinc400} />
            </Pressable>
          </View>

          {/* Volume controls */}
          <View style={styles.volumeRow}>
            <Pressable style={styles.volumeIconBtn} onPress={player.toggleMute}>
              {player.muted || player.volume === 0 ? (
                <VolumeX size={18} color={Theme.colors.zinc500} />
              ) : player.volume < 0.5 ? (
                <Volume1 size={18} color={Theme.colors.zinc400} />
              ) : (
                <Volume2 size={18} color={Theme.colors.zinc400} />
              )}
            </Pressable>
            <Pressable style={styles.volumeStepBtn} onPress={volumeDown}>
              <Minus size={16} color={Theme.colors.zinc400} />
            </Pressable>
            <View style={styles.volumeBarWrap}>
              <View style={styles.volumeBarTrack}>
                <View
                  style={[
                    styles.volumeBarFill,
                    { width: `${(player.muted ? 0 : player.volume) * 100}%` },
                  ]}
                />
              </View>
            </View>
            <Pressable style={styles.volumeStepBtn} onPress={volumeUp}>
              <Plus size={16} color={Theme.colors.zinc400} />
            </Pressable>
            <Text style={styles.volumeLabel}>
              {Math.round((player.muted ? 0 : player.volume) * 100)}%
            </Text>
          </View>
        </View>

        {/* Smart Flow */}
        <View style={styles.smartSection}>
          <View style={styles.smartHeader}>
            <Sparkles size={18} color={Theme.colors.violet} />
            <Text style={styles.smartTitle}>Smart Flow</Text>
            <Text style={styles.smartSub}>AI-similar tracks</Text>
          </View>
          {similarTracks.length === 0 ? (
            <Text style={styles.smartEmpty}>
              {track.embedding ? 'No similar tracks found yet' : 'Analyze this track with AI to unlock Smart Flow'}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.smartScroll}>
              {similarTracks.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.smartCard}
                  onPress={() => {
                    const q = smartFlowQueue(t, 20);
                    player.playQueue(q, 0);
                  }}
                >
                  <CoverArt track={t} size={56} radius={10} />
                  <Text style={styles.smartCardTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.smartCardArtist} numberOfLines={1}>{t.artist}</Text>
                  <MoodBadge mood={t.mood} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* AI Engine status */}
        <View style={styles.aiStatusSection}>
          <View style={styles.aiStatusHeader}>
            <Cpu size={16} color={Theme.colors.cyan} />
            <Text style={styles.aiStatusLabel}>AI Engine</Text>
            <View style={[styles.aiDot, ai.isReady ? styles.aiDotReady : styles.aiDotLoading]} />
          </View>
          <Text style={styles.aiStatusMsg}>{ai.loadProgress.message}</Text>
          {ai.loadProgress.stage === 'loading-pipeline' && (
            <View style={styles.aiProgressBar}>
              <View style={[styles.aiProgressFill, { width: `${ai.loadProgress.progress}%` }]} />
            </View>
          )}
          {!track.embedding && ai.isReady && (
            <Pressable
              style={styles.analyzeBtn}
              onPress={() => ai.analyzeTrack(track)}
            >
              <Activity size={15} color={Theme.colors.cyan} />
              <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.obsidian,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    alignItems: 'center',
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  ambientGlow1: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Theme.colors.cyan,
    opacity: 0.07,
  },
  ambientGlow2: {
    position: 'absolute',
    top: 120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Theme.colors.violet,
    opacity: 0.07,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: Theme.colors.zinc400, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  artSection: { alignItems: 'center', gap: 16, marginBottom: 20 },
  artWrap: { position: 'relative' },
  fallbackBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Theme.colors.zinc900 + 'dd',
    borderWidth: 1,
    borderColor: Theme.colors.zinc700,
  },
  fallbackText: { color: Theme.colors.zinc400, fontSize: 10, fontWeight: '600' },
  visualizerWrap: { width: '100%' },
  presetRow: { flexDirection: 'row', gap: 8 },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.zinc900,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  presetChipActive: {
    borderColor: Theme.colors.cyan,
    backgroundColor: Theme.colors.cyan + '15',
  },
  presetText: { color: Theme.colors.zinc500, fontSize: 12, fontWeight: '600' },
  presetTextActive: { color: Theme.colors.cyan },
  infoSection: { width: '100%', marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  titleWrap: { flex: 1, gap: 4 },
  trackTitle: { color: Theme.colors.zinc100, fontSize: 22, fontWeight: '700' },
  trackArtist: { color: Theme.colors.zinc500, fontSize: 15 },
  controlsSection: { width: '100%', gap: 16, marginBottom: 28 },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    paddingHorizontal: 12,
  },
  volumeIconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  volumeStepBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Theme.colors.zinc900,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  volumeBarWrap: { flex: 1 },
  volumeBarTrack: {
    height: 4,
    backgroundColor: Theme.colors.zinc800,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.cyan,
    borderRadius: 2,
  },
  volumeLabel: {
    color: Theme.colors.zinc500,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    width: 38,
    textAlign: 'right',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { color: Theme.colors.zinc500, fontSize: 12, fontVariant: ['tabular-nums'], width: 40, textAlign: 'center' },
  rangeInput: { flex: 1, height: 4, borderRadius: 2 } as any,
  progressTrack: { flex: 1, height: 4, backgroundColor: Theme.colors.zinc800, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Theme.colors.cyan, borderRadius: 2 },
  mainControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  controlBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  controlBtnActive: { backgroundColor: Theme.colors.cyan + '15' },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.zinc100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartSection: { width: '100%', gap: 12, marginBottom: 24 },
  smartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smartTitle: { color: Theme.colors.zinc100, fontSize: 16, fontWeight: '700' },
  smartSub: { color: Theme.colors.zinc600, fontSize: 12 },
  smartEmpty: { color: Theme.colors.zinc600, fontSize: 13, paddingHorizontal: 4 },
  smartScroll: { flexDirection: 'row' as any },
  smartCard: { width: 100, gap: 6, marginRight: 12 },
  smartCardTitle: { color: Theme.colors.zinc200, fontSize: 12, fontWeight: '600' },
  smartCardArtist: { color: Theme.colors.zinc500, fontSize: 11 },
  aiStatusSection: {
    width: '100%',
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    gap: 8,
  },
  aiStatusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiStatusLabel: { color: Theme.colors.zinc200, fontSize: 14, fontWeight: '600' },
  aiDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 'auto' },
  aiDotReady: { backgroundColor: Theme.colors.success },
  aiDotLoading: { backgroundColor: Theme.colors.warning },
  aiStatusMsg: { color: Theme.colors.zinc500, fontSize: 12 },
  aiProgressBar: { height: 4, backgroundColor: Theme.colors.zinc800, borderRadius: 2, overflow: 'hidden' },
  aiProgressFill: { height: '100%', backgroundColor: Theme.colors.cyan, borderRadius: 2 },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.cyan + '15',
    borderWidth: 1,
    borderColor: Theme.colors.cyan + '40',
    alignSelf: 'flex-start',
  },
  analyzeBtnText: { color: Theme.colors.cyan, fontSize: 13, fontWeight: '600' },
});

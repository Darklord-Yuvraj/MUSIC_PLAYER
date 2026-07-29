import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
  Shuffle, Repeat, Repeat1, ChevronUp, ListMusic, Heart,
} from 'lucide-react-native';
import { CoverArt } from '@/components/CoverArt';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatTime } from '@/utils/format';

export function PlayerBar() {
  const { player, setExpandedPlayer, setQueuePanelOpen } = useApp();
  const track = player.currentTrack;

  const onSeek = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      const target = e.currentTarget as HTMLInputElement;
      player.seek(parseFloat(target.value));
    },
    [player],
  );

  const onVolume = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      const target = e.currentTarget as HTMLInputElement;
      player.setVolume(parseFloat(target.value));
    },
    [player],
  );

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
    <View style={styles.bar}>
      <View style={styles.glowLeft} />
      <View style={styles.glowRight} />

      <View style={styles.content}>
        {/* Track info */}
        <Pressable style={styles.infoSection} onPress={() => setExpandedPlayer(true)}>
          <CoverArt track={track} size={48} radius={8} />
          <View style={styles.trackInfo}>
            <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
          </View>
          <Pressable style={styles.chevronBtn}>
            <ChevronUp size={18} color={Theme.colors.zinc500} />
          </Pressable>
        </Pressable>

        {/* Center controls */}
        <View style={styles.centerSection}>
          <View style={styles.controls}>
            <Pressable
              style={[styles.controlBtn, player.shuffle && styles.controlBtnActive]}
              onPress={player.toggleShuffle}
            >
              <Shuffle size={16} color={player.shuffle ? Theme.colors.cyan : Theme.colors.zinc400} />
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={player.previous} disabled={player.queue.length === 0}>
              <SkipBack size={20} color={Theme.colors.zinc100} fill={Theme.colors.zinc100} />
            </Pressable>
            <Pressable style={styles.playBtn} onPress={player.togglePlay}>
              {player.isPlaying ? (
                <Pause size={22} color={Theme.colors.obsidian} fill={Theme.colors.obsidian} />
              ) : (
                <Play size={22} color={Theme.colors.obsidian} fill={Theme.colors.obsidian} />
              )}
            </Pressable>
            <Pressable style={styles.controlBtn} onPress={player.next} disabled={player.queue.length === 0}>
              <SkipForward size={20} color={Theme.colors.zinc100} fill={Theme.colors.zinc100} />
            </Pressable>
            <Pressable
              style={[styles.controlBtn, player.repeat !== 'off' && styles.controlBtnActive]}
              onPress={player.cycleRepeat}
            >
              <RepeatIconComp size={16} color={player.repeat !== 'off' ? Theme.colors.cyan : Theme.colors.zinc400} />
            </Pressable>
          </View>

          {/* Progress bar */}
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
        </View>

        {/* Right controls */}
        <View style={styles.rightSection}>
          <Pressable style={styles.iconBtn} onPress={() => {}}>
            <Heart size={17} color={Theme.colors.zinc500} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={volumeDown}>
            {player.muted || player.volume === 0 ? (
              <VolumeX size={16} color={Theme.colors.zinc500} />
            ) : player.volume < 0.5 ? (
              <Volume1 size={16} color={Theme.colors.zinc400} />
            ) : (
              <Volume2 size={16} color={Theme.colors.zinc400} />
            )}
          </Pressable>
          {Platform.OS === 'web' && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={player.muted ? 0 : player.volume}
              onChange={onVolume}
              style={styles.volumeRange as any}
            />
          )}
          <Pressable style={styles.iconBtn} onPress={volumeUp}>
            <Text style={styles.volArrow}>+</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => setQueuePanelOpen(true)}>
            <ListMusic size={17} color={Theme.colors.zinc400} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'relative',
    backgroundColor: Theme.colors.obsidianDeep + 'f0',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.zinc800,
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: 'hidden',
    ...(Platform.select({
      web: { backdropFilter: 'blur(12px)' },
    }) as any),
  },
  glowLeft: {
    position: 'absolute',
    top: -40,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Theme.colors.cyan,
    opacity: 0.06,
  },
  glowRight: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Theme.colors.violet,
    opacity: 0.06,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: 220,
    flexShrink: 0,
  },
  trackInfo: { flex: 1, gap: 2 },
  title: { color: Theme.colors.zinc100, fontSize: 13, fontWeight: '600' },
  artist: { color: Theme.colors.zinc500, fontSize: 12 },
  chevronBtn: { padding: 4 },
  centerSection: { flex: 1, alignItems: 'center', gap: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  controlBtnActive: {
    backgroundColor: Theme.colors.cyan + '15',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.zinc100,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 520,
  },
  time: {
    color: Theme.colors.zinc600,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    width: 36,
    textAlign: 'center',
  },
  rangeInput: { flex: 1, height: 4, borderRadius: 2 } as any,
  progressTrack: {
    flex: 1,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 220,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  volumeRange: { width: 80, height: 4, borderRadius: 2 } as any,
  volArrow: { color: Theme.colors.zinc400, fontSize: 16, fontWeight: '700' },
});

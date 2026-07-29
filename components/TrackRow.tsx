import { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, TextInput } from 'react-native';
import {
  Play, Pause, MoreVertical, Sparkles, Loader2, ListPlus, Trash2,
  Info, Edit2, AlertTriangle,
} from 'lucide-react-native';
import { CoverArt } from '@/components/CoverArt';
import { MoodBadge } from '@/components/MoodBadge';
import { TrackInfoModal } from '@/components/TrackInfoModal';
import { MiniVisualizer } from '@/components/MiniVisualizer';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Track } from '@/types';
import { formatTime } from '@/utils/format';

interface MenuItem {
  label: string;
  icon: typeof ListPlus;
  destructive?: boolean;
  onPress: () => void;
}

interface TrackRowProps {
  track: Track;
  index?: number;
  contextQueue?: Track[];
  showAlbum?: boolean;
  variant?: 'default' | 'compact';
}

function TrackRowBase({ track, contextQueue, showAlbum, variant = 'default' }: TrackRowProps) {
  const { player, ai, removeTrack, smartFlowQueue, patchTrack } = useApp();
  const isCurrent = player.currentTrack?.id === track.id;
  const isProcessing = ai.processingIds.has(track.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handlePlay = useCallback(() => {
    if (isCurrent) {
      player.togglePlay();
    } else {
      player.playTrack(track, contextQueue);
    }
  }, [isCurrent, player, track, contextQueue]);

  const menuSections = useMemo<MenuItem[][]>(
    () => [
      [
        { label: 'Play Next', icon: ListPlus, onPress: () => { player.playNext(track); setMenuOpen(false); } },
        { label: 'Add to Queue', icon: ListPlus, onPress: () => { player.addToQueue(track); setMenuOpen(false); } },
        { label: 'Smart Flow (Similar)', icon: Sparkles, onPress: () => { const q = smartFlowQueue(track, 20); if (q.length > 1) player.playQueue(q, 0); setMenuOpen(false); } },
      ],
      [
        { label: 'Track Info', icon: Info, onPress: () => { setInfoOpen(true); setMenuOpen(false); } },
        { label: 'Rename', icon: Edit2, onPress: () => { setRenameValue(track.title); setRenaming(true); setMenuOpen(false); } },
        { label: 'Analyze with AI', icon: Sparkles, onPress: () => { ai.analyzeTrack(track); setMenuOpen(false); } },
      ],
      [
        { label: 'Delete', icon: Trash2, destructive: true, onPress: () => { setConfirmDelete(true); setMenuOpen(false); } },
      ],
    ],
    [player, track, ai, smartFlowQueue],
  );

  const compact = variant === 'compact';
  const allMenuItems = menuSections.flat();

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        isCurrent && styles.rowActive,
      ]}
    >
      <View style={styles.indexCol}>
        {isCurrent && player.isPlaying ? (
          <Pressable onPress={handlePlay} style={styles.playBtn}>
            <Pause size={15} color={Theme.colors.cyan} fill={Theme.colors.cyan} />
          </Pressable>
        ) : (
          <Pressable onPress={handlePlay} style={styles.playBtn}>
            <Play size={15} color={Theme.colors.zinc400} fill={Theme.colors.zinc400} />
          </Pressable>
        )}
      </View>

      {/* Glowing cover art frame */}
      <View style={[styles.artFrame, isCurrent && styles.artFrameActive]}>
        <CoverArt track={track} size={compact ? 40 : 44} radius={8} />
        {isCurrent && player.isPlaying && (
          <View style={styles.artBarOverlay}>
            <MiniVisualizer
              getAnalyser={player.getAnalyser}
              active={player.isPlaying}
              width={36}
              height={20}
            />
          </View>
        )}
      </View>

      <Pressable style={styles.info} onPress={handlePlay}>
        <Text style={[styles.title, isCurrent && styles.titleActive]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
          {showAlbum && track.album ? `  ·  ${track.album}` : ''}
        </Text>
        {!compact && (
          <View style={styles.badgeRow}>
            {isProcessing ? (
              <View style={styles.processingRow}>
                <Loader2 size={11} color={Theme.colors.violet} />
                <Text style={styles.processingText}>Analyzing…</Text>
              </View>
            ) : (
              <MoodBadge mood={track.mood} confidence={track.moodConfidence} />
            )}
            {track.genre && (
              <View style={styles.genreTag}>
                <Text style={styles.genreText}>{track.genre}</Text>
              </View>
            )}
            {track.playCount > 0 && (
              <Text style={styles.playCount}>{track.playCount} plays</Text>
            )}
          </View>
        )}
      </Pressable>

      {/* Mini spectral visualizer for playing track */}
      {isCurrent && player.isPlaying && !compact && (
        <View style={styles.visualizerWrap}>
          <MiniVisualizer
            getAnalyser={player.getAnalyser}
            active={player.isPlaying}
            width={48}
            height={22}
          />
        </View>
      )}

      <Text style={styles.duration}>{formatTime(track.durationSec)}</Text>

      <View style={styles.actions}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            const queue = smartFlowQueue(track, 20);
            if (queue.length > 1) player.playQueue(queue, 0);
          }}
        >
          <Sparkles size={15} color={Theme.colors.violet} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => setMenuOpen((o) => !o)}>
          <MoreVertical size={16} color={Theme.colors.zinc500} />
        </Pressable>
      </View>

      {menuOpen && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={styles.menu}>
            {menuSections.map((section, si) => (
              <View key={si} style={styles.menuSection}>
                {si > 0 && <View style={styles.menuDivider} />}
                {section.map((item, i) => {
                  const flatIdx = allMenuItems.indexOf(item);
                  return (
                    <Pressable
                      key={i}
                      style={[
                        styles.menuItem,
                        item.destructive && styles.menuItemDestructive,
                        { animationDelay: `${flatIdx * 40}ms` } as any,
                      ]}
                      onPress={item.onPress}
                    >
                      <item.icon
                        size={15}
                        color={item.destructive ? Theme.colors.error : Theme.colors.zinc300}
                      />
                      <Text
                        style={[
                          styles.menuText,
                          item.destructive && styles.menuTextDestructive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}

      {renaming && (
        <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Edit2 size={18} color={Theme.colors.cyan} />
                <Text style={styles.dialogTitle}>Rename Track</Text>
              </View>
              <TextInput
                style={styles.dialogInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Track title"
                placeholderTextColor={Theme.colors.zinc600}
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.dialogActions}>
                <Pressable style={styles.dialogCancelBtn} onPress={() => setRenaming(false)}>
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.dialogConfirmBtn}
                  onPress={async () => {
                    if (renameValue.trim()) {
                      await patchTrack(track.id, { title: renameValue.trim() });
                    }
                    setRenaming(false);
                  }}
                >
                  <Text style={styles.dialogConfirmText}>Save</Text>
                </Pressable>
      </View>
            </View>
          </View>
        </Modal>
      )}

      {confirmDelete && (
        <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <AlertTriangle size={18} color={Theme.colors.error} />
                <Text style={styles.dialogTitle}>Delete Track</Text>
              </View>
              <Text style={styles.dialogBody}>
                Remove "{track.title}" from your library? This cannot be undone.
              </Text>
              <View style={styles.dialogActions}>
                <Pressable style={styles.dialogCancelBtn} onPress={() => setConfirmDelete(false)}>
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.dialogDeleteBtn}
                  onPress={() => { removeTrack(track.id); setConfirmDelete(false); }}
                >
                  <Trash2 size={14} color={Theme.colors.obsidian} />
                  <Text style={styles.dialogDeleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <TrackInfoModal track={track} visible={infoOpen} onClose={() => setInfoOpen(false)} />
    </View>
  );
}

export const TrackRow = memo(TrackRowBase);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Theme.radius.md,
    gap: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    ...(Platform.select({
      web: {
        transitionProperty: 'background-color, border-color, box-shadow',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
      },
    }) as any),
  },
  rowCompact: { paddingVertical: 6 },
  rowActive: {
    backgroundColor: Theme.colors.cyan + '0a',
    borderColor: Theme.colors.cyan + '20',
    ...(Platform.select({
      web: { boxShadow: '0 0 20px rgba(34,211,238,0.06)' },
    }) as any),
  },
  indexCol: { width: 28, alignItems: 'center', justifyContent: 'center' },
  playBtn: { opacity: 0.7 },
  // Glowing cover art
  artFrame: {
    position: 'relative',
    borderRadius: 10,
    padding: 1,
    ...(Platform.select({
      web: {
        transitionProperty: 'box-shadow',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }) as any),
  },
  artFrameActive: {
    ...(Platform.select({
      web: { boxShadow: '0 0 16px rgba(34,211,238,0.3)' },
    }) as any),
  },
  artBarOverlay: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -18,
    zIndex: 10,
  },
  info: { flex: 1, gap: 2 },
  title: {
    color: Theme.colors.zinc100,
    fontSize: 14,
    fontWeight: '600',
  },
  titleActive: { color: Theme.colors.cyan },
  artist: {
    color: Theme.colors.zinc500,
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  processingText: { color: Theme.colors.violet, fontSize: 11, fontWeight: '500' },
  genreTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Theme.colors.zinc900,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  genreText: { color: Theme.colors.zinc400, fontSize: 10, fontWeight: '500' },
  playCount: { color: Theme.colors.zinc600, fontSize: 11 },
  visualizerWrap: { marginHorizontal: 4 },
  duration: {
    color: Theme.colors.zinc500,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    ...(Platform.select({
      web: { transitionProperty: 'background-color', transitionDuration: '150ms' },
    }) as any),
  },
  // Menu
  menuBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    top: 38,
    right: 8,
    backgroundColor: Theme.colors.zinc900,
    borderRadius: Theme.radius.md,
    padding: 4,
    minWidth: 210,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    zIndex: 20,
    ...(Platform.select({
      web: {
        boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 20px rgba(34,211,238,0.05)',
        animationName: 'menuOpen',
        animationDuration: '200ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'forwards',
        transformOrigin: 'top right',
      },
      default: { elevation: 12 },
    }) as any),
  },
  menuSection: {},
  menuDivider: {
    height: 1,
    backgroundColor: Theme.colors.zinc800,
    marginVertical: 3,
    marginHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    ...(Platform.select({
      web: {
        animationName: 'menuItemSlide',
        animationDuration: '200ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'backwards',
      },
    }) as any),
  },
  menuItemDestructive: {},
  menuText: { color: Theme.colors.zinc200, fontSize: 13, fontWeight: '500' },
  menuTextDestructive: { color: Theme.colors.error },
  // Dialogs
  dialogBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 32,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    gap: 16,
    ...(Platform.select({
      web: {
        animationName: 'menuOpen',
        animationDuration: '250ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'forwards',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(34,211,238,0.06)',
      },
    }) as any),
  },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dialogTitle: { color: Theme.colors.zinc100, fontSize: 17, fontWeight: '700' },
  dialogBody: { color: Theme.colors.zinc400, fontSize: 14, lineHeight: 20 },
  dialogInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.obsidian,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    color: Theme.colors.zinc100,
    fontSize: 14,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  dialogCancelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Theme.radius.md },
  dialogCancelText: { color: Theme.colors.zinc500, fontSize: 14, fontWeight: '600' },
  dialogConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.cyan,
  },
  dialogConfirmText: { color: Theme.colors.obsidian, fontSize: 14, fontWeight: '700' },
  dialogDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.error,
  },
  dialogDeleteText: { color: Theme.colors.obsidian, fontSize: 14, fontWeight: '700' },
});

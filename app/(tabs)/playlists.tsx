import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList, Modal, TextInput, Platform,
} from 'react-native';
import { ListMusic, Plus, Trash2, Play, Clock, Globe2, Sparkles } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { CoverArt } from '@/components/CoverArt';
import { formatTime } from '@/utils/format';
import type { Playlist, Track } from '@/types';

export default function PlaylistsScreen() {
  const { playlists, tracks, createPlaylist, removePlaylist, player, updatePlaylist } = useApp();
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedPl, setSelectedPl] = useState<Playlist | null>(null);
  const [langModal, setLangModal] = useState(false);

  const handleCreate = async () => {
    if (newName.trim()) {
      await createPlaylist(newName.trim());
      setNewName('');
      setCreateModal(false);
    }
  };

  const playlistTracks = (pl: Playlist): Track[] =>
    pl.trackIds.map((id) => tracks.find((t) => t.id === id)).filter(Boolean) as Track[];

  const languageGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const t of tracks) {
      const lang = (t.language || 'Unknown').trim();
      if (!lang) continue;
      const key = lang.charAt(0).toUpperCase() + lang.slice(1);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries())
      .map(([language, langTracks]) => ({ language, tracks: langTracks, count: langTracks.length }))
      .sort((a, b) => b.count - a.count);
  }, [tracks]);

  const handleCreateByLanguage = async (selected: string[]) => {
    for (const lang of selected) {
      const group = languageGroups.find((g) => g.language === lang);
      if (group) {
        await createPlaylist(`${lang} Songs`, group.tracks.map((t) => t.id));
      }
    }
    setLangModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Playlists</Text>
          <Text style={styles.subtitle}>{playlists.length} playlists</Text>
        </View>
        <View style={styles.headerActions}>
          {languageGroups.length > 0 && (
            <Pressable style={styles.langBtn} onPress={() => setLangModal(true)}>
              <Globe2 size={15} color={Theme.colors.violet} />
              <Text style={styles.langBtnText}>By Language</Text>
            </Pressable>
          )}
          <Pressable style={styles.addBtn} onPress={() => setCreateModal(true)}>
            <Plus size={18} color={Theme.colors.obsidian} />
            <Text style={styles.addBtnText}>New</Text>
          </Pressable>
        </View>
      </View>

      {playlists.length === 0 ? (
        <View style={styles.empty}>
          <ListMusic size={44} color={Theme.colors.zinc700} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No playlists yet</Text>
          <Text style={styles.emptyText}>Create a playlist to organize your favorite tracks</Text>
          <Pressable style={styles.emptyBtn} onPress={() => setCreateModal(true)}>
            <Plus size={16} color={Theme.colors.obsidian} />
            <Text style={styles.emptyBtnText}>Create Playlist</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          renderItem={({ item }) => {
            const plTracks = playlistTracks(item);
            const totalDur = plTracks.reduce((s, t) => s + t.durationSec, 0);
            return (
              <Pressable
                style={styles.playlistCard}
                onPress={() => setSelectedPl(item)}
              >
                <View style={[styles.playlistCover, { backgroundColor: item.coverColor }]}>
                  <ListMusic size={24} color={Theme.colors.obsidian} />
                  <Text style={styles.playlistCount}>{plTracks.length}</Text>
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.playlistMeta}>
                    {plTracks.length} tracks · {formatTime(totalDur)}
                  </Text>
                </View>
                <Pressable
                  style={styles.playBtn}
                  onPress={() => {
                    if (plTracks.length > 0) player.playQueue(plTracks, 0);
                  }}
                >
                  <Play size={18} color={Theme.colors.cyan} fill={Theme.colors.cyan} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}

      {/* Create by language modal */}
      {langModal && (
        <LanguagePlaylistModal
          groups={languageGroups}
          onClose={() => setLangModal(false)}
          onCreate={handleCreateByLanguage}
        />
      )}

      {/* Create modal */}
      <Modal visible={createModal} transparent animationType="fade" onRequestClose={() => setCreateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor={Theme.colors.zinc600}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setCreateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleCreate}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Playlist detail modal */}
      <Modal
        visible={!!selectedPl}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPl(null)}
      >
        <View style={styles.detailBackdrop}>
          <Pressable style={styles.detailBackdropPress} onPress={() => setSelectedPl(null)} />
          <View style={styles.detailPanel}>
            {selectedPl && (
              <PlaylistDetail
                playlist={selectedPl}
                tracks={playlistTracks(selectedPl)}
                onPlay={(idx) => player.playQueue(playlistTracks(selectedPl), idx)}
                onRemoveTrack={(trackId) => {
                  const updated = selectedPl.trackIds.filter((id) => id !== trackId);
                  updatePlaylist({ ...selectedPl, trackIds: updated });
                  setSelectedPl({ ...selectedPl, trackIds: updated });
                }}
                onDelete={() => {
                  removePlaylist(selectedPl.id);
                  setSelectedPl(null);
                }}
                onClose={() => setSelectedPl(null)}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LanguagePlaylistModal({
  groups, onClose, onCreate,
}: {
  groups: { language: string; tracks: Track[]; count: number }[];
  onClose: () => void;
  onCreate: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (lang: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lang)) next.delete(lang);
      else next.add(lang);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === groups.length) setSelected(new Set());
    else setSelected(new Set(groups.map((g) => g.language)));
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.langModalBackdrop}>
        <View style={styles.langModalCard}>
          <View style={styles.langModalHeader}>
            <View style={styles.langModalTitleRow}>
              <Globe2 size={20} color={Theme.colors.violet} />
              <Text style={styles.langModalTitle}>Playlists by Language</Text>
            </View>
            <Text style={styles.langModalSubtitle}>
              Group your tracks into playlists automatically by language
            </Text>
          </View>

          <Pressable style={styles.selectAllBtn} onPress={selectAll}>
            <Text style={styles.selectAllText}>
              {selected.size === groups.length ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>

          <ScrollView style={styles.langList} contentContainerStyle={{ gap: 8 }}>
            {groups.map((g) => (
              <Pressable
                key={g.language}
                style={[styles.langItem, selected.has(g.language) && styles.langItemSelected]}
                onPress={() => toggle(g.language)}
              >
                <View style={styles.langItemLeft}>
                  <View style={[
                    styles.langCheckbox,
                    selected.has(g.language) && styles.langCheckboxSelected,
                  ]}>
                    {selected.has(g.language) && (
                      <Text style={styles.langCheckmark}>✓</Text>
                    )}
                  </View>
                  <Globe2 size={15} color={Theme.colors.zinc500} />
                  <Text style={styles.langItemName}>{g.language}</Text>
                </View>
                <Text style={styles.langItemMeta}>{g.count} tracks</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.langModalActions}>
            <Pressable style={styles.langCancelBtn} onPress={onClose}>
              <Text style={styles.langCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.langCreateBtn, selected.size === 0 && styles.langCreateBtnDisabled]}
              disabled={selected.size === 0}
              onPress={() => onCreate(Array.from(selected))}
            >
              <Sparkles size={15} color={Theme.colors.obsidian} />
              <Text style={styles.langCreateText}>
                Create {selected.size > 0 ? `(${selected.size})` : ''}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PlaylistDetail({
  playlist, tracks, onPlay, onRemoveTrack, onDelete, onClose,
}: {
  playlist: Playlist;
  tracks: Track[];
  onPlay: (idx: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.detailContent}>
      <View style={styles.detailHeader}>
        <View style={[styles.detailCover, { backgroundColor: playlist.coverColor }]}>
          <ListMusic size={28} color={Theme.colors.obsidian} />
        </View>
        <View style={styles.detailInfo}>
          <Text style={styles.detailName}>{playlist.name}</Text>
          <Text style={styles.detailMeta}>{tracks.length} tracks</Text>
        </View>
        <Pressable style={styles.detailClose} onPress={onClose}>
          <Text style={styles.detailCloseText}>Close</Text>
        </Pressable>
      </View>

      {tracks.length > 0 && (
        <Pressable style={styles.detailPlayAll} onPress={() => onPlay(0)}>
          <Play size={16} color={Theme.colors.obsidian} fill={Theme.colors.obsidian} />
          <Text style={styles.detailPlayAllText}>Play All</Text>
        </Pressable>
      )}

      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.detailTrackRow}>
            <Pressable style={styles.detailTrackInfo} onPress={() => onPlay(index)}>
              <CoverArt track={item} size={40} radius={6} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.detailTrackTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.detailTrackArtist} numberOfLines={1}>{item.artist}</Text>
              </View>
              <Text style={styles.detailTrackDur}>{formatTime(item.durationSec)}</Text>
            </Pressable>
            <Pressable style={styles.detailRemoveBtn} onPress={() => onRemoveTrack(item.id)}>
              <Trash2 size={15} color={Theme.colors.zinc600} />
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListEmptyComponent={
          <View style={styles.detailEmpty}>
            <Text style={styles.detailEmptyText}>This playlist is empty</Text>
          </View>
        }
        style={{ flex: 1 }}
      />

      <Pressable style={styles.deletePlaylistBtn} onPress={onDelete}>
        <Trash2 size={15} color={Theme.colors.error} />
        <Text style={styles.deletePlaylistText}>Delete Playlist</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: Theme.colors.zinc100,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    ...(Platform.select({
      web: {
        backgroundImage: 'linear-gradient(90deg, #a78bfa, #22d3ee, #a78bfa)',
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animationName: 'shimmerText',
        animationDuration: '4s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
      },
    }) as any),
  } as any,
  subtitle: { color: Theme.colors.zinc500, fontSize: 13, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.zinc100,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.violet + '15',
    borderWidth: 1,
    borderColor: Theme.colors.violet + '40',
  },
  langBtnText: { color: Theme.colors.violet, fontSize: 12, fontWeight: '600' },
  langModalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 32,
  },
  langModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '80%',
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  langModalHeader: { gap: 6, marginBottom: 16 },
  langModalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langModalTitle: { color: Theme.colors.zinc100, fontSize: 18, fontWeight: '700' },
  langModalSubtitle: { color: Theme.colors.zinc500, fontSize: 13 },
  selectAllBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  selectAllText: { color: Theme.colors.cyan, fontSize: 13, fontWeight: '600' },
  langList: { maxHeight: 300 },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.obsidian,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  langItemSelected: { borderColor: Theme.colors.violet + '60', backgroundColor: Theme.colors.violet + '10' },
  langItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Theme.colors.zinc600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langCheckboxSelected: { borderColor: Theme.colors.violet, backgroundColor: Theme.colors.violet },
  langCheckmark: { color: Theme.colors.obsidian, fontSize: 12, fontWeight: '700' },
  langItemName: { color: Theme.colors.zinc200, fontSize: 14, fontWeight: '500' },
  langItemMeta: { color: Theme.colors.zinc600, fontSize: 12 },
  langModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  langCancelBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Theme.radius.md },
  langCancelText: { color: Theme.colors.zinc500, fontSize: 14, fontWeight: '600' },
  langCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.cyan,
  },
  langCreateBtnDisabled: { opacity: 0.4 },
  langCreateText: { color: Theme.colors.obsidian, fontSize: 14, fontWeight: '700' },
  addBtnText: { color: Theme.colors.obsidian, fontSize: 13, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { color: Theme.colors.zinc200, fontSize: 18, fontWeight: '700' },
  emptyText: { color: Theme.colors.zinc600, fontSize: 14, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.zinc100,
    marginTop: 8,
  },
  emptyBtnText: { color: Theme.colors.obsidian, fontSize: 14, fontWeight: '700' },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.zinc950,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    marginBottom: 10,
  },
  playlistCover: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  playlistCount: { color: Theme.colors.obsidian, fontSize: 11, fontWeight: '700' },
  playlistInfo: { flex: 1, gap: 3 },
  playlistName: { color: Theme.colors.zinc100, fontSize: 15, fontWeight: '600' },
  playlistMeta: { color: Theme.colors.zinc500, fontSize: 12 },
  playBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: Theme.colors.cyan + '15' },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 32 },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    gap: 16,
  },
  modalTitle: { color: Theme.colors.zinc100, fontSize: 18, fontWeight: '700' },
  modalInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.obsidian,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    color: Theme.colors.zinc100,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Theme.radius.md },
  modalCancelText: { color: Theme.colors.zinc500, fontSize: 14, fontWeight: '600' },
  modalConfirm: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.cyan,
  },
  modalConfirmText: { color: Theme.colors.obsidian, fontSize: 14, fontWeight: '700' },
  detailBackdrop: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  detailBackdropPress: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  detailPanel: { width: 480, maxWidth: '100%', backgroundColor: Theme.colors.obsidianDeep, borderLeftWidth: 1, borderLeftColor: Theme.colors.zinc800 },
  detailContent: { flex: 1, padding: 16, gap: 12 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailCover: { width: 60, height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1, gap: 3 },
  detailName: { color: Theme.colors.zinc100, fontSize: 20, fontWeight: '700' },
  detailMeta: { color: Theme.colors.zinc500, fontSize: 13 },
  detailClose: { paddingHorizontal: 12, paddingVertical: 6 },
  detailCloseText: { color: Theme.colors.zinc500, fontSize: 13 },
  detailPlayAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.cyan,
    alignSelf: 'flex-start',
  },
  detailPlayAllText: { color: Theme.colors.obsidian, fontSize: 14, fontWeight: '700' },
  detailTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  detailTrackInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailTrackTitle: { color: Theme.colors.zinc200, fontSize: 13, fontWeight: '600' },
  detailTrackArtist: { color: Theme.colors.zinc500, fontSize: 12 },
  detailTrackDur: { color: Theme.colors.zinc600, fontSize: 12, fontVariant: ['tabular-nums'] },
  detailRemoveBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  detailEmpty: { paddingVertical: 32, alignItems: 'center' },
  detailEmptyText: { color: Theme.colors.zinc600, fontSize: 14 },
  deletePlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.error + '10',
    borderWidth: 1,
    borderColor: Theme.colors.error + '30',
  },
  deletePlaylistText: { color: Theme.colors.error, fontSize: 14, fontWeight: '600' },
});

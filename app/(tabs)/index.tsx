import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Search, Library as LibraryIcon, Sparkles } from 'lucide-react-native';
import { ImportZone } from '@/components/ImportZone';
import { TrackList } from '@/components/TrackList';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { MOOD_DEFINITIONS, type MoodTag } from '@/types';

type Filter = 'all' | MoodTag | 'analyzed' | 'unanalyzed';

export default function LibraryScreen() {
  const { tracks, ai, smartFlowQueue, player } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    let result = tracks;
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.album?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filter === 'analyzed') result = result.filter((t) => t.embedding);
    else if (filter === 'unanalyzed') result = result.filter((t) => !t.embedding);
    else if (filter !== 'all') result = result.filter((t) => t.mood === filter);
    return result;
  }, [tracks, query, filter]);

  const filterChips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...MOOD_DEFINITIONS.map((m) => ({ id: m.id as Filter, label: m.label })),
    { id: 'analyzed', label: 'Analyzed' },
    { id: 'unanalyzed', label: 'Unanalyzed' },
  ];

  const analyzedCount = tracks.filter((t) => t.embedding).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} · {analyzedCount} AI-analyzed
          </Text>
        </View>
        {tracks.length > 0 && ai.isReady && (
          <Pressable
            style={styles.smartFlowBtn}
            onPress={() => {
              const analyzed = tracks.filter((t) => t.embedding);
              if (analyzed.length > 0) {
                const q = smartFlowQueue(analyzed[0], 20);
                player.playQueue(q, 0);
              }
            }}
          >
            <Sparkles size={15} color={Theme.colors.violet} />
            <Text style={styles.smartFlowBtnText}>Smart Flow</Text>
          </Pressable>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Search size={16} color={Theme.colors.zinc600} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracks, artists, albums…"
            placeholderTextColor={Theme.colors.zinc600}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {filterChips.map((chip) => {
            const active = filter === chip.id;
            return (
              <Pressable
                key={chip.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(chip.id)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Import zone */}
      <View style={styles.importSection}>
        <ImportZone />
      </View>

      {/* Track list */}
      <View style={styles.listSection}>
        {tracks.length === 0 ? null : filtered.length === 0 ? (
          <View style={styles.emptyFiltered}>
            <LibraryIcon size={36} color={Theme.colors.zinc700} strokeWidth={1.5} />
            <Text style={styles.emptyText}>No tracks match your filters</Text>
          </View>
        ) : (
          <TrackList tracks={filtered} showHeader />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.obsidian },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLeft: { gap: 4 },
  title: {
    color: Theme.colors.zinc100,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: { color: Theme.colors.zinc500, fontSize: 13 },
  smartFlowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.violet + '12',
    borderWidth: 1,
    borderColor: Theme.colors.violet + '50',
  },
  smartFlowBtnText: { color: Theme.colors.violet, fontSize: 13, fontWeight: '600' },
  searchRow: { paddingHorizontal: 20, marginBottom: 14 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.zinc900 + '80',
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.zinc100,
    fontSize: 14,
    padding: 0,
  },
  clearBtn: { padding: 4 },
  clearText: { color: Theme.colors.zinc600, fontSize: 12 },
  filterScroll: { marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  filterChipActive: {
    borderColor: Theme.colors.cyan,
    backgroundColor: Theme.colors.cyan + '10',
  },
  filterText: { color: Theme.colors.zinc500, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: Theme.colors.cyan },
  importSection: { paddingHorizontal: 20, marginBottom: 20 },
  listSection: { paddingHorizontal: 20, paddingBottom: 20 },
  emptyFiltered: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: Theme.colors.zinc600, fontSize: 14 },
});

import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Music } from 'lucide-react-native';
import { TrackRow } from '@/components/TrackRow';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { Track } from '@/types';

interface TrackListProps {
  tracks?: Track[];
  emptyMessage?: string;
  emptyAction?: { label: string; onPress: () => void };
  showHeader?: boolean;
}

export function TrackList({ tracks, emptyMessage, emptyAction, showHeader }: TrackListProps) {
  const { tracks: allTracks, loading } = useApp();
  const list = tracks ?? allTracks;

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => b.dateAdded - a.dateAdded);
  }, [list]);

  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Loading library…</Text>
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Music size={40} color={Theme.colors.zinc700} strokeWidth={1.5} />
        <Text style={styles.emptyText}>{emptyMessage || 'No tracks yet'}</Text>
        {emptyAction && (
          <Pressable style={styles.emptyBtn} onPress={emptyAction.onPress}>
            <Text style={styles.emptyBtnText}>{emptyAction.label}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Title</Text>
          <Text style={styles.headerDuration}>Time</Text>
        </View>
      )}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackRow track={item} contextQueue={sorted} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    paddingLeft: 96,
    paddingRight: 92,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    color: Theme.colors.zinc600,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerDuration: {
    color: Theme.colors.zinc600,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  separator: { height: 1 },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: Theme.colors.zinc500,
    fontSize: 14,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.cyan + '20',
    borderWidth: 1,
    borderColor: Theme.colors.cyan + '40',
  },
  emptyBtnText: {
    color: Theme.colors.cyan,
    fontSize: 13,
    fontWeight: '600',
  },
});

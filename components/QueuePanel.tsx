import { Modal, View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { X, GripVertical, Trash2, Play } from 'lucide-react-native';
import { CoverArt } from '@/components/CoverArt';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatTime } from '@/utils/format';

export function QueuePanel() {
  const { player, queuePanelOpen, setQueuePanelOpen } = useApp();

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrent = index === player.queueIndex;
    return (
      <View style={[styles.queueRow, isCurrent && styles.queueRowActive]}>
        <GripVertical size={16} color={Theme.colors.zinc700} />
        <Pressable
          style={styles.playCell}
          onPress={() => {
            player.playQueue(player.queue, index);
          }}
        >
          <CoverArt track={item} size={36} radius={6} />
        </Pressable>
        <Pressable style={styles.info} onPress={() => player.playQueue(player.queue, index)}>
          <Text style={[styles.title, isCurrent && styles.titleActive]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
        </Pressable>
        <Text style={styles.duration}>{formatTime(item.durationSec)}</Text>
        <Pressable
          style={styles.iconBtn}
          onPress={() => player.removeFromQueue(index)}
        >
          <Trash2 size={15} color={Theme.colors.zinc600} />
        </Pressable>
      </View>
    );
  };

  return (
    <Modal
      visible={queuePanelOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setQueuePanelOpen(false)}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={() => setQueuePanelOpen(false)} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Play Queue</Text>
            <Pressable style={styles.closeBtn} onPress={() => setQueuePanelOpen(false)}>
              <X size={20} color={Theme.colors.zinc400} />
            </Pressable>
          </View>
          {player.queue.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Queue is empty</Text>
            </View>
          ) : (
            <FlatList
              data={player.queue}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    width: 420,
    maxWidth: '100%',
    backgroundColor: Theme.colors.obsidianDeep,
    borderLeftWidth: 1,
    borderLeftColor: Theme.colors.zinc800,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { color: Theme.colors.zinc100, fontSize: 18, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  queueRowActive: { backgroundColor: Theme.colors.cyan + '10' },
  playCell: { padding: 2 },
  info: { flex: 1, gap: 2 },
  title: { color: Theme.colors.zinc200, fontSize: 13, fontWeight: '600' },
  titleActive: { color: Theme.colors.cyan },
  artist: { color: Theme.colors.zinc500, fontSize: 12 },
  duration: { color: Theme.colors.zinc600, fontSize: 12, fontVariant: ['tabular-nums'] },
  iconBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  sep: { height: 2 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { color: Theme.colors.zinc600, fontSize: 14 },
});

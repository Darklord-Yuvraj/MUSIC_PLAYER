import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Cpu, Brain, HardDrive, Shield, Zap, Github, Info, Trash2 } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatBytes } from '@/utils/format';

export default function SettingsScreen() {
  const { tracks, storageEstimate, ai, removeTrack } = useApp();

  const clearLibrary = () => {
    tracks.forEach((t) => removeTrack(t.id));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your offline AI music player</Text>
      </View>

      {/* AI Engine section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Engine</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Cpu size={18} color={Theme.colors.cyan} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Model</Text>
              <Text style={styles.rowValue}>Xenova/all-MiniLM-L6-v2</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Brain size={18} color={Theme.colors.violet} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Embedding Dimensions</Text>
              <Text style={styles.rowValue}>384</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Zap size={18} color={Theme.colors.neon} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Runtime</Text>
              <Text style={styles.rowValue}>WebAssembly (on-device)</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Shield size={18} color={Theme.colors.success} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Privacy</Text>
              <Text style={styles.rowValue}>100% offline · no data leaves device</Text>
            </View>
          </View>
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, ai.isReady ? styles.statusReady : styles.statusLoading]} />
          <Text style={styles.statusText}>{ai.loadProgress.message}</Text>
        </View>
      </View>

      {/* Storage section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <HardDrive size={18} color={Theme.colors.zinc400} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Tracks stored</Text>
              <Text style={styles.rowValue}>{tracks.length} files</Text>
            </View>
          </View>
          {storageEstimate && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <HardDrive size={18} color={Theme.colors.zinc400} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>Device storage used</Text>
                  <Text style={styles.rowValue}>
                    {formatBytes(storageEstimate.usage)} / {formatBytes(storageEstimate.quota)}
                  </Text>
                </View>
              </View>
              <View style={styles.storageBar}>
                <View
                  style={[
                    styles.storageFill,
                    {
                      width: `${Math.min(100, (storageEstimate.usage / storageEstimate.quota) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Danger zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library Management</Text>
        <Pressable style={styles.dangerBtn} onPress={clearLibrary}>
          <Trash2 size={16} color={Theme.colors.error} />
          <Text style={styles.dangerText}>Clear All Tracks</Text>
        </Pressable>
        <Text style={styles.dangerNote}>
          Removes all audio files and metadata from your device. This cannot be undone.
        </Text>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Info size={18} color={Theme.colors.zinc400} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Neural Audio</Text>
              <Text style={styles.rowValue}>v1.0.0 · Offline AI Music Player</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Github size={18} color={Theme.colors.zinc400} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Tech Stack</Text>
              <Text style={styles.rowValue}>React Native Expo · Transformers.js · Web Audio API</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.obsidian },
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  title: { color: Theme.colors.zinc100, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Theme.colors.zinc500, fontSize: 13, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 24, gap: 10 },
  sectionTitle: { color: Theme.colors.zinc600, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowInfo: { flex: 1, gap: 2 },
  rowLabel: { color: Theme.colors.zinc200, fontSize: 14, fontWeight: '500' },
  rowValue: { color: Theme.colors.zinc500, fontSize: 13 },
  divider: { height: 1, backgroundColor: Theme.colors.zinc800, marginVertical: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusReady: { backgroundColor: Theme.colors.success },
  statusLoading: { backgroundColor: Theme.colors.warning },
  statusText: { color: Theme.colors.zinc500, fontSize: 12 },
  storageBar: { height: 6, backgroundColor: Theme.colors.zinc800, borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  storageFill: { height: '100%', backgroundColor: Theme.colors.cyan, borderRadius: 3 },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.error + '10',
    borderWidth: 1,
    borderColor: Theme.colors.error + '30',
  },
  dangerText: { color: Theme.colors.error, fontSize: 14, fontWeight: '600' },
  dangerNote: { color: Theme.colors.zinc600, fontSize: 12, paddingHorizontal: 4 },
});

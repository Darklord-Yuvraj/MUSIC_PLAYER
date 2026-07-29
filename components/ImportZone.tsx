import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const ACCEPTED = '.mp3,.wav,.flac,.ogg,.m4a,audio/*';

export function ImportZone() {
  const { importFiles, importing } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<View>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) =>
        /\.(mp3|wav|flac|ogg|m4a)$/i.test(f.name) || f.type.startsWith('audio/'),
      );
      if (arr.length > 0) importFiles(arr);
    },
    [importFiles],
  );

  const openPicker = useCallback(() => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = ACCEPTED;
      input.onchange = () => {
        if (input.files) handleFiles(input.files);
      };
      input.click();
    }
  }, [handleFiles]);

  // Attach native drag/drop listeners on web (Pressable doesn't support these props)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = (dropRef.current as any)?._nativeTag as HTMLElement | undefined;
    if (!node) return;
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    };
    const onDragLeave = () => setDragOver(false);
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
    };
    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    };
  }, [handleFiles]);

  return (
    <View style={styles.wrapper}>
      <Pressable ref={dropRef} style={[styles.zone, dragOver && styles.zoneActive]} onPress={openPicker}>
        <View style={styles.iconWrap}>
          <UploadCloud size={36} color={Theme.colors.cyan} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Import Audio Files</Text>
        <Text style={styles.subtitle}>
          Drag & drop MP3, WAV, FLAC, OGG, or M4A — or tap to browse
        </Text>
        <View style={styles.formatsRow}>
          {['MP3', 'WAV', 'FLAC', 'OGG', 'M4A'].map((f) => (
            <View key={f} style={styles.formatChip}>
              <Text style={styles.formatText}>{f}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.privacyNote}>
          Files stay on your device. Nothing is uploaded to any server.
        </Text>
      </Pressable>

      {importing.length > 0 && (
        <View style={styles.progressList}>
          {importing.map((p, i) => (
            <View key={i} style={styles.progressItem}>
              <FileAudio size={16} color={Theme.colors.zinc400} />
              <Text style={styles.progressName} numberOfLines={1}>
                {p.fileName}
              </Text>
              {p.stage === 'done' ? (
                <CheckCircle2 size={16} color={Theme.colors.success} />
              ) : p.stage === 'error' ? (
                <AlertCircle size={16} color={Theme.colors.error} />
              ) : (
                <ActivityIndicator size="small" color={Theme.colors.cyan} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  zone: {
    borderWidth: 2,
    borderColor: Theme.colors.zinc800,
    borderStyle: 'dashed',
    borderRadius: Theme.radius.lg,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: Theme.colors.zinc950,
    gap: 8,
  },
  zoneActive: {
    borderColor: Theme.colors.cyan,
    backgroundColor: Theme.colors.cyan + '0a',
  },
  iconWrap: { marginBottom: 4 },
  title: { color: Theme.colors.zinc100, fontSize: 17, fontWeight: '700' },
  subtitle: { color: Theme.colors.zinc500, fontSize: 13, textAlign: 'center' },
  formatsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  formatChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.zinc900,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  formatText: { color: Theme.colors.zinc400, fontSize: 11, fontWeight: '600' },
  privacyNote: { color: Theme.colors.zinc600, fontSize: 11, marginTop: 4 },
  progressList: { marginTop: 12, gap: 6 },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.zinc900,
  },
  progressName: { flex: 1, color: Theme.colors.zinc300, fontSize: 13 },
});

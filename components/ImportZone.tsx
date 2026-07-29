import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const ACCEPTED = '.mp3,.wav,.flac,.ogg,.m4a,audio/*';
const FORMATS = ['MP3', 'WAV', 'FLAC', 'OGG', 'M4A'];

export function ImportZone() {
  const { importFiles, importing } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [imploding, setImploding] = useState(false);
  const dropRef = useRef<View>(null);

  const triggerImplosion = useCallback(() => {
    setImploding(true);
    setTimeout(() => setImploding(false), 1200);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) =>
        /\.(mp3|wav|flac|ogg|m4a)$/i.test(f.name) || f.type.startsWith('audio/'),
      );
      if (arr.length > 0) {
        triggerImplosion();
        importFiles(arr);
      }
    },
    [importFiles, triggerImplosion],
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
        {/* Animated light border layer */}
        <View style={[styles.lightBorder, dragOver && styles.lightBorderActive]} />

        {/* Implosion overlay */}
        {imploding && Platform.OS === 'web' && (
          <View style={styles.implosionOverlay}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.implosionStream,
                  {
                    transform: `rotate(${i * 45}deg)`,
                    animationDelay: `${i * 40}ms`,
                  } as any,
                ]}
              />
            ))}
            <View style={styles.implosionCore} />
          </View>
        )}

        <View style={styles.content}>
          <View style={[styles.iconWrap, dragOver && styles.iconWrapActive]}>
            <UploadCloud size={42} color={Theme.colors.cyan} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Import Audio Files</Text>
          <Text style={styles.subtitle}>
            Drag & drop MP3, WAV, FLAC, OGG, or M4A — or tap to browse
          </Text>
          <View style={styles.formatsRow}>
            {FORMATS.map((f) => (
              <View key={f} style={styles.formatChip}>
                <Text style={styles.formatText}>{f}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.privacyNote}>
            Files stay on your device. Nothing is uploaded to any server.
          </Text>
        </View>
      </Pressable>

      {importing.length > 0 && (
        <View style={styles.progressList}>
          {importing.map((p, i) => (
            <View key={i} style={styles.progressItem}>
              <FileAudio size={16} color={Theme.colors.cyan} />
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
    position: 'relative',
    borderRadius: Theme.radius.lg,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: Theme.colors.zinc900 + '20',
    overflow: 'hidden',
    ...(Platform.select({
      web: {
        transitionProperty: 'background-color, border-color',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      },
    }) as any),
  },
  zoneActive: {
    backgroundColor: Theme.colors.cyan + '0a',
  },
  lightBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: Theme.radius.lg,
    borderWidth: 2,
    borderColor: Theme.colors.zinc700,
    borderStyle: 'dashed',
    ...(Platform.select({
      web: {
        transitionProperty: 'border-color, box-shadow',
        transitionDuration: '400ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }) as any),
  },
  lightBorderActive: {
    borderColor: Theme.colors.cyan,
    ...(Platform.select({
      web: { boxShadow: '0 0 30px rgba(34,211,238,0.3), inset 0 0 30px rgba(34,211,238,0.08)' },
    }) as any),
  },
  // Implosion
  implosionOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  implosionStream: {
    position: 'absolute',
    width: 2,
    height: 200,
    backgroundColor: Theme.colors.cyan,
    opacity: 0.8,
    top: '50%',
    left: '50%',
    marginLeft: -1,
    marginTop: -100,
    transformOrigin: 'center',
    ...(Platform.select({
      web: {
        animationName: 'implosionStream',
        animationDuration: '800ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'forwards',
      },
    }) as any),
  },
  implosionCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.cyan,
    opacity: 0.6,
    ...(Platform.select({
      web: {
        animationName: 'implosionCore',
        animationDuration: '800ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'forwards',
      },
    }) as any),
  },
  content: {
    alignItems: 'center',
    gap: 10,
    zIndex: 5,
  },
  iconWrap: {
    marginBottom: 6,
    ...(Platform.select({
      web: {
        animationName: 'pulseGlow',
        animationDuration: '3s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
      },
    }) as any),
  },
  iconWrapActive: {
    ...(Platform.select({
      web: {
        animationDuration: '0.8s',
        filter: 'drop-shadow(0 0 16px rgba(34,211,238,0.8))',
      },
    }) as any),
  },
  title: {
    color: Theme.colors.zinc100,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: Theme.colors.zinc500,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  formatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  formatChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Theme.colors.zinc900,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  formatText: {
    color: Theme.colors.zinc400,
    fontSize: 11,
    fontWeight: '600',
  },
  privacyNote: {
    color: Theme.colors.zinc600,
    fontSize: 11,
    marginTop: 8,
  },
  progressList: { marginTop: 12, gap: 6 },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.zinc900,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
  },
  progressName: { flex: 1, color: Theme.colors.zinc300, fontSize: 13 },
});

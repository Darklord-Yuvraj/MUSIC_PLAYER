import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, Platform,
} from 'react-native';
import {
  X, Edit2, Check, Music2, User2, Disc3, Calendar, Tag, Globe2,
  FileAudio, Clock, Headphones, Hash,
} from 'lucide-react-native';
import { CoverArt } from '@/components/CoverArt';
import { MoodBadge } from '@/components/MoodBadge';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatTime, formatBytes, formatDate } from '@/utils/format';
import type { Track } from '@/types';

interface TrackInfoModalProps {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
}

interface InfoRow {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
}

export function TrackInfoModal({ track, visible, onClose }: TrackInfoModalProps) {
  const { tracks, patchTrack } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: '', artist: '', album: '', language: '', genre: '',
  });

  const startEdit = useCallback(() => {
    if (!track) return;
    setForm({
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      language: track.language || '',
      genre: track.genre || '',
    });
    setEditing(true);
  }, [track]);

  const saveEdit = useCallback(async () => {
    if (!track) return;
    await patchTrack(track.id, {
      title: form.title.trim() || track.title,
      artist: form.artist.trim() || track.artist,
      album: form.album.trim() || undefined,
      language: form.language.trim() || null,
      genre: form.genre.trim() || null,
    });
    setEditing(false);
  }, [track, form, patchTrack]);

  const artistTrackCount = useMemo(
    () => (track ? tracks.filter((t) => t.artist === track.artist).length : 0),
    [track, tracks],
  );
  const albumTrackCount = useMemo(
    () => (track?.album ? tracks.filter((t) => t.album === track.album).length : 0),
    [track, tracks],
  );

  if (!track) return null;

  const songRows: InfoRow[] = [
    { icon: Music2, label: 'Title', value: track.title },
    { icon: Clock, label: 'Duration', value: formatTime(track.durationSec) },
    { icon: Tag, label: 'Genre', value: track.genre || '' },
    { icon: Globe2, label: 'Language', value: track.language || '' },
    { icon: Calendar, label: 'Year', value: track.year ? String(track.year) : '' },
    { icon: Hash, label: 'Plays', value: track.playCount > 0 ? String(track.playCount) : '0' },
  ].filter((r) => r.value);

  const artistRows: InfoRow[] = [
    { icon: User2, label: 'Artist', value: track.artist },
    {
      icon: Headphones,
      label: 'In Library',
      value: `${artistTrackCount} track${artistTrackCount !== 1 ? 's' : ''}`,
    },
  ];

  const albumRows: InfoRow[] = track.album
    ? [
        { icon: Disc3, label: 'Album', value: track.album },
        {
          icon: Headphones,
          label: 'In Library',
          value: `${albumTrackCount} track${albumTrackCount !== 1 ? 's' : ''}`,
        },
      ]
    : [];

  const fileRows: InfoRow[] = [
    { icon: FileAudio, label: 'Filename', value: track.fileName },
    { icon: FileAudio, label: 'Format', value: track.fileType.toUpperCase() },
    { icon: FileAudio, label: 'Size', value: formatBytes(track.fileSize) },
    { icon: Calendar, label: 'Added', value: formatDate(track.dateAdded) },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editing ? 'Edit Details' : 'Track Info'}
            </Text>
            <View style={styles.headerActions}>
              {editing ? (
                <Pressable style={styles.iconBtn} onPress={saveEdit}>
                  <Check size={18} color={Theme.colors.cyan} />
                </Pressable>
              ) : (
                <Pressable style={styles.iconBtn} onPress={startEdit}>
                  <Edit2 size={16} color={Theme.colors.zinc400} />
                </Pressable>
              )}
              <Pressable style={styles.iconBtn} onPress={onClose}>
                <X size={18} color={Theme.colors.zinc400} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Hero section */}
            <View style={styles.heroSection}>
              <View style={styles.heroArtWrap}>
                <CoverArt track={track} size={180} radius={20} />
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>{track.title}</Text>
              <Text style={styles.heroArtist}>{track.artist}</Text>
              {track.album && (
                <Text style={styles.heroAlbum}>{track.album}</Text>
              )}
              <View style={styles.heroBadges}>
                <MoodBadge mood={track.mood} confidence={track.moodConfidence} size="md" />
              </View>
            </View>

            {!editing ? (
              <View style={styles.sectionsWrap}>
                {/* Song section */}
                <Text style={styles.sectionLabel}>Song</Text>
                <View style={styles.infoCard}>
                  {songRows.map((row, i) => (
                    <View key={`s${i}`} style={[styles.infoRow, i < songRows.length - 1 && styles.infoRowBorder]}>
                      <row.icon size={15} color={Theme.colors.zinc600} />
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Artist section */}
                <Text style={styles.sectionLabel}>Artist</Text>
                <View style={styles.infoCard}>
                  {artistRows.map((row, i) => (
                    <View key={`a${i}`} style={[styles.infoRow, i < artistRows.length - 1 && styles.infoRowBorder]}>
                      <row.icon size={15} color={Theme.colors.zinc600} />
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Album section */}
                {albumRows.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Album</Text>
                    <View style={styles.infoCard}>
                      {albumRows.map((row, i) => (
                        <View key={`al${i}`} style={[styles.infoRow, i < albumRows.length - 1 && styles.infoRowBorder]}>
                          <row.icon size={15} color={Theme.colors.zinc600} />
                          <Text style={styles.infoLabel}>{row.label}</Text>
                          <Text style={styles.infoValue} numberOfLines={2}>{row.value}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* File section */}
                <Text style={styles.sectionLabel}>File</Text>
                <View style={styles.infoCard}>
                  {fileRows.map((row, i) => (
                    <View key={`f${i}`} style={[styles.infoRow, i < fileRows.length - 1 && styles.infoRowBorder]}>
                      <row.icon size={15} color={Theme.colors.zinc600} />
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue} numberOfLines={2}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.editForm}>
                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="Title"
                  placeholderTextColor={Theme.colors.zinc600}
                />
                <Text style={styles.fieldLabel}>Artist</Text>
                <TextInput
                  style={styles.input}
                  value={form.artist}
                  onChangeText={(v) => setForm((f) => ({ ...f, artist: v }))}
                  placeholder="Artist"
                  placeholderTextColor={Theme.colors.zinc600}
                />
                <Text style={styles.fieldLabel}>Album</Text>
                <TextInput
                  style={styles.input}
                  value={form.album}
                  onChangeText={(v) => setForm((f) => ({ ...f, album: v }))}
                  placeholder="Album"
                  placeholderTextColor={Theme.colors.zinc600}
                />
                <Text style={styles.fieldLabel}>Language</Text>
                <TextInput
                  style={styles.input}
                  value={form.language}
                  onChangeText={(v) => setForm((f) => ({ ...f, language: v }))}
                  placeholder="e.g. English, Spanish, Hindi"
                  placeholderTextColor={Theme.colors.zinc600}
                />
                <Text style={styles.fieldLabel}>Genre</Text>
                <TextInput
                  style={styles.input}
                  value={form.genre}
                  onChangeText={(v) => setForm((f) => ({ ...f, genre: v }))}
                  placeholder="e.g. Rock, Pop, Jazz"
                  placeholderTextColor={Theme.colors.zinc600}
                />
                <Pressable style={styles.saveBtn} onPress={saveEdit}>
                  <Check size={16} color={Theme.colors.obsidian} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropPress: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    backgroundColor: Theme.colors.obsidianDeep,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.zinc700,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.zinc800,
  },
  headerTitle: { color: Theme.colors.zinc100, fontSize: 17, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  // Hero
  heroSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  heroArtWrap: {
    marginBottom: 16,
    ...(Platform.select({
      web: { filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.6))' },
    }) as any),
  },
  heroTitle: {
    color: Theme.colors.zinc100,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroArtist: {
    color: Theme.colors.cyan,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },
  heroAlbum: {
    color: Theme.colors.zinc500,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  // Sections
  sectionsWrap: { gap: 16 },
  sectionLabel: {
    color: Theme.colors.zinc500,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -4,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Theme.colors.zinc950,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.zinc800,
  },
  infoLabel: {
    color: Theme.colors.zinc600,
    fontSize: 13,
    fontWeight: '500',
    width: 72,
  },
  infoValue: {
    flex: 1,
    color: Theme.colors.zinc200,
    fontSize: 13,
  },
  // Edit form
  editForm: { gap: 4, marginTop: 4 },
  fieldLabel: { color: Theme.colors.zinc500, fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 2 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.zinc950,
    borderWidth: 1,
    borderColor: Theme.colors.zinc800,
    color: Theme.colors.zinc100,
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.cyan,
  },
  saveBtnText: { color: Theme.colors.obsidian, fontSize: 15, fontWeight: '700' },
});

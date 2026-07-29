import { View, Text, StyleSheet } from 'react-native';
import { getMoodDefinition, type MoodTag } from '@/types';
import { Theme } from '@/constants/theme';

interface MoodBadgeProps {
  mood?: MoodTag | null;
  confidence?: number;
  size?: 'sm' | 'md';
  showEmoji?: boolean;
}

export function MoodBadge({ mood, confidence, size = 'sm', showEmoji = true }: MoodBadgeProps) {
  const def = getMoodDefinition(mood);
  if (!def) {
    return (
      <View style={[styles.badge, styles.unknown, size === 'md' && styles.badgeMd]}>
        <Text style={[styles.text, size === 'md' && styles.textMd]}>Untagged</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.badge,
        { borderColor: def.accent + '60', backgroundColor: def.accent + '18' },
        size === 'md' && styles.badgeMd,
      ]}
    >
      {showEmoji && <Text style={styles.emoji}>{def.emoji}</Text>}
      <Text style={[styles.text, { color: def.accent }, size === 'md' && styles.textMd]}>
        {def.label}
      </Text>
      {confidence !== undefined && confidence > 0 && (
        <Text style={[styles.conf, size === 'md' && styles.textMd]}>
          {Math.round(confidence * 100)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.pill,
    borderWidth: 1,
    gap: 4,
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    color: Theme.colors.zinc100,
    fontSize: 11,
    fontWeight: '600',
  },
  textMd: {
    fontSize: 13,
  },
  emoji: {
    fontSize: 11,
  },
  conf: {
    color: Theme.colors.zinc500,
    fontSize: 10,
    fontWeight: '500',
  },
  unknown: {
    borderColor: Theme.colors.zinc800,
    backgroundColor: Theme.colors.zinc900,
  },
});

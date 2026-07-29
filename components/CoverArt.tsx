import { Image, View, StyleSheet } from 'react-native';
import { Music } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { generateGradientColor } from '@/utils/gradient';
import type { Track } from '@/types';

interface CoverArtProps {
  track?: Track | null;
  size?: number;
  radius?: number;
}

export function CoverArt({ track, size = 56, radius = 10 }: CoverArtProps) {
  if (track?.coverArt) {
    return (
      <Image
        source={{ uri: track.coverArt }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }
  const bg = generateGradientColor(track?.title || track?.id || 'x');
  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius, backgroundColor: bg },
      ]}
    >
      <Music size={size * 0.4} color={Theme.colors.zinc100} strokeWidth={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { View, Text, StyleSheet, Platform } from 'react-native';
import { Brain } from 'lucide-react-native';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Theme } from '@/constants/theme';

export default function AIScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>AI Insights</Text>
          <Text style={styles.subtitle}>On-device neural analysis · 100% private</Text>
        </View>
        <Brain size={24} color={Theme.colors.violet} />
      </View>
      <AIInsightsPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 12,
  },
  headerLeft: { gap: 4 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Theme.colors.zinc100,
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
  subtitle: { color: Theme.colors.zinc500, fontSize: 13 },
});

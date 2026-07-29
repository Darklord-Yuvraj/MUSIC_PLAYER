import { View, Text, StyleSheet } from 'react-native';
import { Brain } from 'lucide-react-native';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Theme } from '@/constants/theme';

export default function AIScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Brain size={22} color={Theme.colors.violet} />
        <View>
          <Text style={styles.title}>AI Insights</Text>
          <Text style={styles.subtitle}>On-device neural analysis · 100% private</Text>
        </View>
      </View>
      <AIInsightsPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.obsidian },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: { color: Theme.colors.zinc100, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Theme.colors.zinc500, fontSize: 12, marginTop: 2 },
});

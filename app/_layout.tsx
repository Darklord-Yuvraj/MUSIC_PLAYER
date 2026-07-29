import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/context/AppContext';
import { PlayerBar } from '@/components/PlayerBar';
import { FullscreenPlayer } from '@/components/FullscreenPlayer';
import { QueuePanel } from '@/components/QueuePanel';
import { NeuralBackground } from '@/components/NeuralBackground';
import { Theme } from '@/constants/theme';

const CYBER_NOIR_CSS = `
@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(34,211,238,0.3)); opacity: 0.85; }
  50% { filter: drop-shadow(0 0 16px rgba(34,211,238,0.6)); opacity: 1; }
}
@keyframes implosionStream {
  0% { height: 200px; opacity: 0.8; transform: scaleY(1); }
  100% { height: 0px; opacity: 0; transform: scaleY(0); }
}
@keyframes implosionCore {
  0% { width: 60px; height: 60px; opacity: 0.6; filter: blur(0px); }
  50% { width: 120px; height: 120px; opacity: 0.3; filter: blur(4px); }
  100% { width: 0px; height: 0px; opacity: 0; filter: blur(8px); }
}
@keyframes shimmerText {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes starPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(167,139,250,0.2), 0 0 16px rgba(167,139,250,0.1); }
  50% { box-shadow: 0 0 20px rgba(167,139,250,0.5), 0 0 40px rgba(167,139,250,0.25); }
}
@keyframes menuOpen {
  0% { opacity: 0; transform: scale(0.85) translateY(-4px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes menuItemSlide {
  0% { opacity: 0; transform: translateX(-8px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes filterRingSlide {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes neuralFire {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = CYBER_NOIR_CSS;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <AppProvider>
      <View style={styles.root}>
        <NeuralBackground />
        <View style={styles.contentLayer}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        <PlayerBar />
        <FullscreenPlayer />
        <QueuePanel />
      </View>
      <StatusBar style="light" />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.obsidianDeep,
  },
  contentLayer: {
    flex: 1,
    zIndex: 1,
  },
});

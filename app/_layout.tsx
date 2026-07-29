import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/context/AppContext';
import { PlayerBar } from '@/components/PlayerBar';
import { FullscreenPlayer } from '@/components/FullscreenPlayer';
import { QueuePanel } from '@/components/QueuePanel';
import { Theme } from '@/constants/theme';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AppProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
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
    backgroundColor: Theme.colors.obsidian,
  },
});

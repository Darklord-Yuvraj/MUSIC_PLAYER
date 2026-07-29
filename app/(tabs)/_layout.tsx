import { Tabs } from 'expo-router';
import { Library, Brain, ListMusic, Settings } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

export default function TabLayout() {
  const { player } = useApp();
  const hasTrack = !!player.currentTrack;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.obsidianDeep,
          borderTopColor: Theme.colors.zinc800,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 6,
          height: 58,
        },
        tabBarActiveTintColor: Theme.colors.cyan,
        tabBarInactiveTintColor: Theme.colors.zinc600,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color }) => <Library size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Insights',
          tabBarIcon: ({ size, color }) => <Brain size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'Playlists',
          tabBarIcon: ({ size, color }) => <ListMusic size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

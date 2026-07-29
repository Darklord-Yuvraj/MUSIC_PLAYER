import { Tabs } from 'expo-router';
import { BarChart3, Brain, ListMusic, Settings } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.obsidianDeep,
          borderTopColor: Theme.colors.zinc800,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: Theme.colors.cyan,
        tabBarInactiveTintColor: Theme.colors.zinc600,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color }) => <BarChart3 size={size} color={color} />,
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

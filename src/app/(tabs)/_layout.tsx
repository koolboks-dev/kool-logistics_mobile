import { Tabs } from 'expo-router';

import { useTheme } from '@/theme';

import { TabBar, type TabItem } from '@/components/ui';

export default function TabsLayout() {
  const { colors } = useTheme();

  const tabs: TabItem[] = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'orders', label: 'Orders', icon: 'package' },
    { key: 'scan', label: 'Scan', icon: 'scan' },
    { key: 'track', label: 'Track', icon: 'track' },
    { key: 'account', label: 'Account', icon: 'user' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.background },
      }}
      tabBar={({ state, navigation }) => {
        const current = state.routes[state.index]?.name ?? 'home';

        // The scanner is full-bleed camera. A glass bar tinted for the app
        // theme is unreadable over a live feed, and the design has no tab bar
        // here — the close button is the way out.
        if (current === 'scan') return null;

        return (
          <TabBar tabs={tabs} value={current} onChange={(key) => navigation.navigate(key)} />
        );
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="track" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}

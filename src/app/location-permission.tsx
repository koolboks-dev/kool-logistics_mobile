import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, GlassBackButton, Text } from '@/components/ui';
import { useLocationSharing } from '@/store/location';
import { Layout, Motion, Radius, Spacing, useTheme } from '@/theme';

const POINTS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'bicycle-outline',
    title: 'Only while you are working',
    body: 'Shared while you are online or carrying a delivery, and only while the app is open.',
  },
  {
    icon: 'people-outline',
    title: 'Who sees it',
    body: 'Koolboks dispatch sees where you are. A retailer sees you only once their goods are picked up.',
  },
  {
    icon: 'time-outline',
    title: 'About every 30 seconds',
    body: 'A light update, so dispatch can assign nearby jobs and retailers know when you will arrive.',
  },
];

/** Explains why the app needs location before the OS prompt appears. */
export default function LocationPermission() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const location = useLocationSharing();
  const [busy, setBusy] = useState(false);

  const blocked = location.permission === 'denied' && !location.canAskAgain;
  const granted = location.permission === 'granted';

  const allow = async () => {
    if (blocked) {
      location.openSettings();
      return;
    }
    setBusy(true);
    const ok = await location.requestPermission();
    setBusy(false);
    if (ok) router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.sm }]}>
      <GlassBackButton onPress={() => router.back()} />

      <View style={styles.body}>
        <Animated.View entering={FadeInDown.duration(Motion.base)} style={styles.hero}>
          <View style={[styles.mark, { backgroundColor: colors.brandSoft, borderRadius: Radius.xl }]}>
            <Ionicons name="navigate" size={40} color={colors.brand} />
          </View>
          <Text variant="title" center>
            Share your location
          </Text>
          <Text variant="body" tone="secondary" center>
            KOOL Logistics needs your location while you are on duty to route deliveries to you and show
            retailers that their order is on the way.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(Motion.base)}>
          <Card>
            <View style={{ gap: Spacing.base }}>
              {POINTS.map((p) => (
                <View key={p.title} style={styles.point}>
                  <Ionicons name={p.icon} size={20} color={colors.brand} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{p.title}</Text>
                    <Text variant="caption" tone="secondary">
                      {p.body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {blocked && (
          <Text variant="caption" tone="danger" center>
            Location is turned off for KOOL Logistics. Open Settings → Location and choose “While Using the App”.
          </Text>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {granted ? (
          <Button label="Location is on — continue" icon="checkmark" onPress={() => router.back()} />
        ) : (
          <Button
            label={blocked ? 'Open Settings' : 'Allow location access'}
            icon={blocked ? 'settings-outline' : 'location-outline'}
            loading={busy}
            onPress={allow}
          />
        )}
        <Button label="Not now" variant="ghost" size="md" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Layout.screenPadding },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.md },
  mark: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  footer: { gap: Spacing.sm, maxWidth: Layout.maxContentWidth, width: '100%', alignSelf: 'center' },
});

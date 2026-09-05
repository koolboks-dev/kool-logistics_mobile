import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image } from 'expo-image';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  Avatar,
  Card,
  Dialog,
  Divider,
  ListRow,
  ScreenScroll,
  SegmentedControl,
  Switch,
  Text,
} from '@/components/ui';
import { Company } from '@/data/site';
import { useApp } from '@/store/app';
import { Layout, Motion, Spacing, useTheme, type ThemePreference } from '@/theme';

export default function Account() {
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const { rider, signOut } = useApp();

  const [push, setPush] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <>
      <ScreenScroll
        title="Account"
        contentContainerStyle={styles.scroll}
        onRefresh={async () => {
          await new Promise((r) => setTimeout(r, 600));
        }}
      >
        <Animated.View entering={FadeInDown.duration(Motion.base)}>
          <Card padded={false} style={styles.profileCard}>
            <View style={styles.banner}>
              <Image
                source={require('@/assets/images/site/hero-2.jpg')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
              />
              <View style={styles.bannerScrim} />
            </View>

            <View style={styles.profile}>
              <Avatar name={rider?.name ?? 'Rider'} size={58} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="subheading">{rider?.name ?? 'Rider'}</Text>
                <Text variant="caption" tone="secondary">
                  {rider?.id ?? '—'}
                </Text>
                <Text variant="caption" tone="muted">
                  {rider?.hub ?? 'Unassigned hub'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Text variant="label" tone="muted">
            APPEARANCE
          </Text>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <SegmentedControl
                segments={[
                  { label: 'Auto', value: 'auto' },
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                ]}
                value={preference}
                onChange={(v) => setPreference(v as ThemePreference)}
              />
              <Text variant="caption" tone="secondary">
                {preference === 'auto'
                  ? 'Following your device appearance.'
                  : `Always ${preference}, regardless of device settings.`}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Text variant="label" tone="muted">
            PREFERENCES
          </Text>
          <Card padded={false}>
            <ListRow
              icon="notifications-outline"
              title="Push notifications"
              subtitle="Delivery assignments and updates"
              right={<Switch value={push} onChange={setPush} />}
            />
            <Divider inset={Spacing.md} />
            <ListRow
              icon="volume-medium-outline"
              title="Sound & haptics"
              subtitle="Feedback on scan and confirm"
              right={<Switch value={sounds} onChange={setSounds} />}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Text variant="label" tone="muted">
            SUPPORT
          </Text>
          <Card padded={false}>
            <ListRow
              icon="help-circle-outline"
              title="Help centre"
              subtitle="FAQs, contact and opening hours"
              onPress={() => router.push('/help')}
            />
            <Divider inset={Spacing.md} />
            <ListRow
              icon="call-outline"
              title="Call dispatch"
              subtitle={Company.phone}
              onPress={() => Linking.openURL(`tel:${Company.phoneDial}`).catch(() => {})}
            />

          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(Motion.base)}>
          <Card padded={false}>
            <ListRow icon="log-out-outline" title="Sign out" destructive onPress={() => setConfirmOut(true)} />
          </Card>
        </Animated.View>

        <Text variant="caption" tone="muted" center>
          KOOL Logistics · v1.0.0
        </Text>
      </ScreenScroll>

      <Dialog
        visible={confirmOut}
        onClose={() => setConfirmOut(false)}
        title="Sign out?"
        message="You'll need your email and password to sign back in."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setConfirmOut(false);
          signOut();
          router.replace('/(auth)/welcome');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.xl },
  profileCard: { overflow: 'hidden' },
  banner: { height: 110 },
  bannerScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.18)' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, padding: Spacing.base },
});

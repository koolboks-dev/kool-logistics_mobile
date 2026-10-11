import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useRiderMeQuery } from '@/store/rider-api';
import { useSession } from '@/store/session';
import { Layout, Motion, Spacing, useTheme, type ThemePreference } from '@/theme';

export default function Account() {
  const router = useRouter();
  const { colors, preference, setPreference } = useTheme();
  const { user, signOut } = useSession();
  const { data: meData, refetch } = useRiderMeQuery();

  const [push, setPush] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [confirmOut, setConfirmOut] = useState(false);

  const rider = meData?.rider;
  const name = rider?.name || user?.name || 'Rider';
  const email = rider?.email || user?.email || '—';
  const phone = rider?.phone || user?.phone_number || '—';
  const riderCode = rider?.rider_code ? `Rider ${rider.rider_code}` : 'Logistics Rider';

  return (
    <>
      <ScreenScroll
        title="Account"
        contentContainerStyle={styles.scroll}
        onRefresh={async () => {
          await refetch();
        }}
      >
        {/* ---- Profile Card ---- */}
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
              <Avatar name={name} size={58} uri={rider?.photo_url || undefined} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="subheading">{name}</Text>
                <Text variant="caption" tone="secondary">
                  {riderCode}
                </Text>
                <Text variant="caption" tone="muted">
                  {email} · {phone}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* ---- Vehicle & Territory ---- */}
        <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Text variant="label" tone="muted">
            DISPATCH ASSIGNMENT
          </Text>
          <Card padded={false}>
            <ListRow
              icon="bicycle-outline"
              title="Vehicle"
              subtitle={
                rider?.vehicle_registration
                  ? `${rider.vehicle_type || 'Vehicle'} · ${rider.vehicle_registration}`
                  : rider?.vehicle_type || 'Not assigned'
              }
            />
            <Divider inset={Spacing.md} />
            <ListRow
              icon="map-outline"
              title="Service regions"
              subtitle={
                rider?.service_cities && rider.service_cities.length > 0
                  ? rider.service_cities.join(', ')
                  : 'Lagos hubs'
              }
            />
          </Card>
        </Animated.View>

        {/* ---- Security ---- */}
        <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Text variant="label" tone="muted">
            SECURITY
          </Text>
          <Card padded={false}>
            <ListRow
              icon="key-outline"
              title="Change password"
              subtitle="Update your account password"
              onPress={() => router.push('/(auth)/change-password' as any)}
            />
          </Card>
        </Animated.View>

        {/* ---- Appearance ---- */}
        <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={{ gap: Spacing.md }}>
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

        {/* ---- Support ---- */}
        <Animated.View entering={FadeInDown.delay(240).duration(Motion.base)} style={{ gap: Spacing.md }}>
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

        {/* ---- Sign Out ---- */}
        <Animated.View entering={FadeInDown.delay(300).duration(Motion.base)}>
          <Card padded={false}>
            <ListRow
              icon="log-out-outline"
              title="Sign out"
              destructive
              onPress={() => setConfirmOut(true)}
            />
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
          router.replace('/(auth)/sign-in');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.xl },
  profileCard: { overflow: 'hidden' },
  banner: { height: 110 },
  bannerScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, padding: Spacing.base },
});

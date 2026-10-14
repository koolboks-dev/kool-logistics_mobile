import { Glyph } from '@/components/icons/Glyph';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  OrderCard,
  StatCard,
  Switch,
  Text,
  useToast,
} from '@/components/ui';
import { ago, cardMeta, deliveryRef, dropoffAddress, isFreezerDelivery } from '@/lib/delivery';
import { pickQrFromLibrary } from '@/lib/qr';
import { useLocation } from '@/store/location';
import { useUnreadCountQuery } from '@/store/notifications-api';
import { useRealtime } from '@/store/realtime';
import {
  useAssignedDeliveriesQuery,
  useRiderMeQuery,
  useSetAvailabilityMutation,
} from '@/store/rider-api';
import { useSession } from '@/store/session';
import { useScanAndOpen } from '@/store/use-scan';
import { Layout, Motion, Radius, Spacing, useTheme } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user } = useSession();

  const { data: meData, refetch: refetchMe, isFetching: fetchingMe } = useRiderMeQuery();
  const [setAvailability, { isLoading: togglingDuty }] = useSetAvailabilityMutation();

  const {
    data: activeDeliveries,
    refetch: refetchActive,
    isFetching: fetchingActive,
  } = useAssignedDeliveriesQuery({ active: true });

  const {
    data: closedDeliveries,
    refetch: refetchClosed,
    isFetching: fetchingClosed,
  } = useAssignedDeliveriesQuery({ active: false });

  const { data: unreadCount = 0, refetch: refetchUnread } = useUnreadCountQuery();

  const { resolve: resolveScan, scanning } = useScanAndOpen();
  const location = useLocation();

  const [decoding, setDecoding] = useState(false);

  const rider = meData?.rider;
  const isAvailable = Boolean(rider?.is_available);
  const activeCount = activeDeliveries?.length ?? 0;
  const closedCount = closedDeliveries?.length ?? 0;

  const onRefresh = async () => {
    await Promise.all([
      refetchMe(),
      refetchActive(),
      refetchClosed(),
      refetchUnread(),
      location.refreshPermission(),
    ]);
    toast.show('Deliveries up to date', 'success');
  };

  const toggleDuty = async (val: boolean) => {
    try {
      await setAvailability(val).unwrap();
      toast.show(val ? 'You are now online' : 'You are now offline', 'info');
      // Going online means sharing location — explain before the OS prompt.
      if (val && location.permission !== 'granted') router.push('/location-permission');
    } catch {
      toast.show('Could not update duty state. Please try again.', 'error');
    }
  };

  const uploadQr = async () => {
    setDecoding(true);
    const result = await pickQrFromLibrary();
    setDecoding(false);

    if (result.ok) {
      await resolveScan(result.data);
      return;
    }
    if (result.reason === 'permission') toast.show('Photo access is needed to read a QR image', 'error');
    else if (result.reason === 'nocode') toast.show('No QR code found in that image', 'error');
    else if (result.reason === 'error') toast.show('Could not read that image', 'error');
  };

  const firstName = (rider?.name || user?.first_name || user?.name || 'Rider').split(' ')[0];

  const locationBadgeText = (() => {
    switch (location.state) {
      case 'sharing':
        return location.lastSentAt
          ? `Sharing location · updated ${ago(location.lastSentAt)}`
          : 'Sharing location · GPS active';
      case 'starting':
        return 'Starting location sharing…';
      case 'needs_permission':
        return 'Location access needed while on duty';
      case 'denied':
        return 'Location permission denied';
      case 'services_off':
        return 'Device location services are off';
      case 'off':
        return 'Location off · go online to start';
      default:
        return location.message || 'Location paused';
    }
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.base }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={fetchingMe || fetchingActive || fetchingClosed}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressViewOffset={insets.top + Spacing.sm}
            onRefresh={onRefresh}
          />
        }
      >
        {/* ---- Profile & Header ---- */}
        <Animated.View entering={FadeIn.duration(Motion.slow)} style={styles.greeting}>
          <Avatar name={rider?.name ?? 'Rider'} size={46} uri={rider?.photo_url ?? undefined} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text variant="caption" tone="secondary">
              {rider?.rider_code ? `Rider ${rider.rider_code}` : 'Logistics Rider'} ·{' '}
              {rider?.service_cities?.slice(0, 2).join(', ') || 'Lagos'}
            </Text>
            <Text variant="subheading" numberOfLines={1}>
              Hi {firstName}
            </Text>
          </View>
          <View>
            <IconButton
              icon="notifications-outline"
              size={40}
              accessibilityLabel="Notifications"
              onPress={() => router.push('/alerts')}
            />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2 }}>
                <Badge count={unreadCount} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* ---- Duty & Availability Switch Card ---- */}
        <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)}>
          <Card
            style={{
              borderColor: isAvailable ? colors.brand : colors.border,
              backgroundColor: isAvailable ? colors.surface : colors.surfaceSunken,
            }}
          >
            <View style={styles.dutyRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View
                    style={[
                      styles.dutyDot,
                      { backgroundColor: isAvailable ? colors.success : colors.textMuted },
                    ]}
                  />
                  <Text variant="bodyStrong">
                    {isAvailable ? 'Online & Ready' : 'Offline'}
                  </Text>
                </View>
                <Text variant="caption" tone="secondary">
                  {isAvailable
                    ? 'Receiving delivery assignments in your zone'
                    : 'Switch on when you are ready to take deliveries'}
                </Text>
              </View>
              <Switch value={isAvailable} onChange={toggleDuty} disabled={togglingDuty} />
            </View>

            {/* Location Sharing Status Sub-bar */}
            <View
              style={[
                styles.locationBar,
                {
                  backgroundColor:
                    location.state === 'sharing'
                      ? colors.successSoft
                      : location.state === 'denied' || location.state === 'services_off'
                        ? colors.dangerSoft
                        : colors.surfaceAlt,
                  borderColor:
                    location.state === 'sharing'
                      ? colors.success
                      : location.state === 'denied'
                        ? colors.danger
                        : colors.border,
                },
              ]}
            >
              <Glyph
                name={
                  location.state === 'sharing'
                    ? 'navigate-circle'
                    : location.state === 'denied'
                      ? 'warning-outline'
                      : 'location-outline'
                }
                size={16}
                color={
                  location.state === 'sharing'
                    ? colors.success
                    : location.state === 'denied'
                      ? colors.danger
                      : colors.textSecondary
                }
              />
              <Text
                variant="caption"
                style={{
                  flex: 1,
                  color:
                    location.state === 'sharing'
                      ? colors.success
                      : location.state === 'denied'
                        ? colors.danger
                        : colors.textSecondary,
                }}
                numberOfLines={1}
              >
                {locationBadgeText}
              </Text>
              {(location.state === 'denied' || location.state === 'needs_permission') && (
                <Pressable
                  onPress={() => {
                    if (location.state === 'denied' && !location.canAskAgain) location.openSettings();
                    else router.push('/location-permission');
                  }}
                  hitSlop={8}
                >
                  <Text variant="caption" tone="brand" style={{ fontWeight: '600' }}>
                    {location.state === 'denied' && !location.canAskAgain ? 'Open Settings' : 'Allow'}
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        </Animated.View>

        {/* ---- Stats ---- */}
        <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={styles.stats}>
          <StatCard
            label="Active tasks"
            value={String(activeCount)}
            icon="package"
            caption={activeCount > 0 ? 'In progress' : 'All clear'}
          />
          <StatCard
            label="Completed"
            value={String(closedCount)}
            icon="deliveries"
            caption="Total delivered"
          />
        </Animated.View>

        {/* ---- Active Deliveries List ---- */}
        <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={styles.section}>
          <View style={styles.sectionHead}>
            <Text variant="label" tone="muted">
              ACTIVE DELIVERIES ({activeCount})
            </Text>
            {activeCount > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/orders')} hitSlop={10}>
                <Text variant="caption" tone="brand">
                  View all
                </Text>
              </Pressable>
            )}
          </View>

          {activeCount === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <View style={styles.emptyInner}>
                <Glyph name="cube-outline" size={32} color={colors.textMuted} />
                <Text variant="bodyStrong">No active deliveries right now</Text>
                <Text variant="caption" tone="secondary" center>
                  {isAvailable
                    ? 'Stay online. New orders will pop up here as dispatch assigns them.'
                    : 'Turn your duty status to Online to receive assignments.'}
                </Text>
              </View>
            </Card>
          ) : (
            <View style={{ gap: Spacing.md }}>
              {activeDeliveries?.map((d) => (
                <OrderCard
                  key={d.delivery_id}
                  order={{
                    id: d.delivery_id,
                    reference: deliveryRef(d, { hash: true }),
                    recipient: d.customer?.name || d.dropoff?.name || 'Retailer',
                    address: dropoffAddress(d),
                    status: d.status,
                    delayed: d.is_delayed,
                    meta: cardMeta(d),
                    freezer: isFreezerDelivery(d),
                  }}
                  onPress={() => router.push(`/order/${d.delivery_id}`)}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ---- Quick Actions ---- */}
        <Animated.View entering={FadeInDown.delay(240).duration(Motion.base)} style={styles.section}>
          <Text variant="label" tone="muted">
            QUICK ACTIONS
          </Text>
          <View style={styles.actionRow}>
            <Button
              label="Scan Waybill Camera"
              icon="qr-code-outline"
              style={{ flex: 1 }}
              onPress={() => router.push('/(tabs)/scan')}
            />
            <Button
              label={decoding || scanning ? 'Reading…' : 'Pick QR Photo'}
              icon="images-outline"
              variant="outline"
              loading={decoding || scanning}
              style={{ flex: 1 }}
              onPress={uploadQr}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  dutyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  dutyDot: { width: 10, height: 10, borderRadius: 5 },
  locationBar: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stats: { flexDirection: 'row', gap: Spacing.base },
  section: { gap: Spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyInner: { alignItems: 'center', gap: Spacing.xs, maxWidth: 280 },
  actionRow: { flexDirection: 'row', gap: Spacing.base },
});

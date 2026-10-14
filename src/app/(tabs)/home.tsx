import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Line, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompletedIcon, StackIcon } from '@/components/icons';
import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import { EmptyArt } from '@/components/illustrations/EmptyArt';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DelayBadge,
  FreezerBadge,
  GlassSurface,
  OrderCard,
  SkeletonList,
  SkeletonOrderCard,
  StatusPill,
  Switch,
  Text,
  useToast,
} from '@/components/ui';
import {
  ago,
  cardMeta,
  deliveryRef,
  dropoffAddress,
  expectedLabel,
  isFreezerDelivery,
  isToday,
} from '@/lib/delivery';
import { pickQrFromLibrary } from '@/lib/qr';
import { useLocation } from '@/store/location';
import { useUnreadCountQuery } from '@/store/notifications-api';
import {
  useAssignedDeliveriesQuery,
  useRiderMeQuery,
  useSetAvailabilityMutation,
  type RiderDelivery,
} from '@/store/rider-api';
import { useSession } from '@/store/session';
import { useScanAndOpen } from '@/store/use-scan';
import { Elevation, Layout, Palette, Radius, SlateGlass, Spacing, useTheme } from '@/theme';

/**
 * The duty card: soft slate "liquid glass" (not pure black) in light and dark
 * mode — a slate gradient, a warm orange glow, a glossy top sheen and frosted
 * panes for the stats and location rows.
 */
const HERO = SlateGlass;

function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

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
    isLoading: loadingActive,
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
  const deliveredToday = (closedDeliveries ?? []).filter((d) => d.status === 'delivered' && isToday(d.delivered_at)).length;
  const [current, ...upNext] = activeDeliveries ?? [];

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

  const locationProblem = location.state === 'denied' || location.state === 'services_off';
  const locationColor =
    location.state === 'sharing' ? '#7FD1A8' : locationProblem ? '#FF8A80' : HERO.muted;

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
        {/* ---- Header: who, where, and the bell ---- */}
        <View style={styles.header}>
          <Avatar name={rider?.name ?? 'Rider'} size={44} uri={rider?.photo_url ?? undefined} variant="soft" />
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {greeting()}
            </Text>
            <Text variant="heading" numberOfLines={1}>
              {firstName}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/alerts')}
            accessibilityRole="button"
            accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            hitSlop={6}
            style={({ pressed }) => [
              styles.bell,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Glyph name="notifications-outline" size={20} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge} pointerEvents="none">
                <Badge count={unreadCount} />
              </View>
            )}
          </Pressable>
        </View>

        {/* ---- Duty card ---- */}
        <View style={[styles.hero, Elevation.md]}>
          <LinearGradient colors={HERO.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {/* Warm glow bleeding in from the top-right corner. */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
            <Defs>
              <RadialGradient id="heroGlow" cx="92%" cy="0%" rx="70%" ry="80%">
                <Stop offset="0" stopColor={Palette.orange} stopOpacity={0.45} />
                <Stop offset="0.55" stopColor={Palette.orange} stopOpacity={0.08} />
                <Stop offset="1" stopColor={Palette.orange} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="heroCool" cx="0%" cy="100%" rx="60%" ry="60%">
                <Stop offset="0" stopColor="#7DD3FC" stopOpacity={0.14} />
                <Stop offset="1" stopColor="#7DD3FC" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#heroGlow)" />
            <Rect width="100%" height="100%" fill="url(#heroCool)" />
          </Svg>
          {/* Glossy sheen across the top half, like light on glass. */}
          <LinearGradient
            colors={HERO.sheen}
            locations={[0, 0.45, 1]}
            style={styles.heroSheen}
            pointerEvents="none"
          />
          <View style={styles.heroTop}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.heroStatus}>
                <View style={[styles.liveDot, { backgroundColor: isAvailable ? '#3DDC97' : 'rgba(255,255,255,0.35)' }]} />
                <Text variant="caption" style={{ color: HERO.muted, fontWeight: '600' }}>
                  {isAvailable ? 'On duty' : 'Off duty'}
                </Text>
              </View>
              <Text variant="heading" style={{ color: HERO.text }}>
                {isAvailable ? 'You’re online' : 'You’re offline'}
              </Text>
              <Text variant="caption" style={{ color: HERO.muted }}>
                {isAvailable ? 'Dispatch can send you deliveries' : 'Go online to start receiving deliveries'}
              </Text>
            </View>
            <Switch value={isAvailable} onChange={toggleDuty} disabled={togglingDuty} />
          </View>

          <GlassSurface glass="clear" scheme="dark" radius={Radius.lg} tint={HERO.pane} intensity={24} style={styles.heroStats}>
            <HeroStat icon={<StackIcon size={18} color={Palette.orange} />} value={activeCount} label="Active" />
            <View style={[styles.heroDivider, { backgroundColor: HERO.line }]} />
            <HeroStat icon={<CompletedIcon size={18} color="#3DDC97" />} value={deliveredToday} label="Today" />
            <View style={[styles.heroDivider, { backgroundColor: HERO.line }]} />
            <HeroStat icon={<Glyph name="checkmark-done" size={18} color="rgba(255,255,255,0.85)" />} value={closedCount} label="All time" />
          </GlassSurface>

          <GlassSurface
            glass="clear" scheme="dark"
            radius={Radius.md}
            tint={locationProblem ? 'rgba(220,53,69,0.22)' : HERO.pane}
            intensity={24}
            style={styles.locationChip}
          >
            <View style={{ zIndex: 1 }}>
              <Glyph
                name={location.state === 'sharing' ? 'navigate-circle' : locationProblem ? 'warning-outline' : 'location-outline'}
                size={16}
                color={locationColor}
              />
            </View>
            <Text variant="caption" style={{ flex: 1, color: locationColor }} numberOfLines={1}>
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
                <Text variant="caption" style={{ color: Palette.orange, fontWeight: '700' }}>
                  {location.state === 'denied' && !location.canAskAgain ? 'Open settings' : 'Allow'}
                </Text>
              </Pressable>
            )}
          </GlassSurface>
        </View>

        {/* ---- Current delivery ---- */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text variant="subheading">{current ? 'Current delivery' : 'Deliveries'}</Text>
            {activeCount > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/orders')} hitSlop={10}>
                <Text variant="caption" tone="brand" style={{ fontWeight: '600' }}>
                  View all
                </Text>
              </Pressable>
            )}
          </View>

          {loadingActive ? (
            <SkeletonOrderCard />
          ) : current ? (
            <CurrentDelivery d={current} onOpen={() => router.push(`/order/${current.delivery_id}`)} />
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <EmptyArt name="deliveries" size={132} />
              <Text variant="bodyStrong" center>
                No active deliveries
              </Text>
              <Text variant="caption" tone="secondary" center style={{ maxWidth: 260 }}>
                {isAvailable
                  ? 'Stay online. New deliveries appear here the moment dispatch assigns them.'
                  : 'Go online to start receiving deliveries in your zone.'}
              </Text>
            </Card>
          )}
        </View>

        {/* ---- Up next ---- */}
        {upNext.length > 0 && (
          <View style={styles.section}>
            <Text variant="subheading">
              Up next{' '}
              <Text variant="subheading" tone="muted">
                {upNext.length}
              </Text>
            </Text>
            {loadingActive ? (
              <SkeletonList count={2} />
            ) : (
              <View style={{ gap: Spacing.md }}>
                {upNext.slice(0, 3).map((d) => (
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
          </View>
        )}

        {/* ---- Quick actions ---- */}
        <View style={styles.section}>
          <Text variant="subheading">Quick actions</Text>
          <View style={styles.grid}>
            <ActionTile
              icon="qr-code-outline"
              label="Scan waybill"
              caption="Open a parcel"
              accent
              onPress={() => router.push('/(tabs)/scan')}
            />
            <ActionTile
              icon="images-outline"
              label={decoding || scanning ? 'Reading…' : 'Upload QR'}
              caption="From your photos"
              onPress={decoding || scanning ? undefined : uploadQr}
            />
            <ActionTile
              icon="time-outline"
              label="History"
              caption="Past deliveries"
              onPress={() => router.push('/(tabs)/orders')}
            />
            <ActionTile
              icon="help-circle-outline"
              label="Help"
              caption="FAQs and support"
              onPress={() => router.push('/help')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function HeroStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View style={styles.heroStat}>
      {icon}
      <Text variant="title" style={{ color: HERO.text, marginTop: 6 }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: HERO.muted }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** The delivery the rider is on now: status, route (pickup → drop-off) and one clear action. */
function CurrentDelivery({ d, onOpen }: { d: RiderDelivery; onOpen: () => void }) {
  const { colors } = useTheme();
  const freezer = isFreezerDelivery(d);
  const pickupName = freezer ? d.freezer?.depot_name || d.pickup?.name || 'Depot' : d.pickup?.name || 'Pickup';
  const due = expectedLabel(d);
  const heading = d.next_status === 'delivered' || d.status === 'in_transit' ? 'Head to the drop-off' : 'Head to the pickup';

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={[styles.currentTop, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                {deliveryRef(d, { hash: true })}
              </Text>
              {freezer && <FreezerBadge />}
            </View>
            <Text variant="bodyStrong">{heading}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: Spacing.xs }}>
            <StatusPill status={d.status} size="sm" />
            {d.is_delayed && <DelayBadge />}
          </View>
        </View>

        <View style={styles.route}>
          <View style={styles.routeRail}>
            <View style={[styles.routeDotPickup, { borderColor: colors.brand, backgroundColor: colors.surface }]} />
            <Svg width={2} height={34}>
              <Line x1={1} y1={0} x2={1} y2={34} stroke={colors.borderStrong ?? colors.border} strokeWidth={2} strokeDasharray="3 4" />
            </Svg>
            <View style={[styles.routeDotDrop, { backgroundColor: colors.text }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surface }} />
            </View>
          </View>
          <View style={{ flex: 1, gap: Spacing.base }}>
            <View style={{ gap: 1 }}>
              <Text variant="caption" tone="muted">
                {freezer ? 'Collect from depot' : 'Pickup'}
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {pickupName}
              </Text>
              {d.pickup?.address ? (
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {d.pickup.address}
                </Text>
              ) : null}
            </View>
            <View style={{ gap: 1 }}>
              <Text variant="caption" tone="muted">
                Drop-off
              </Text>
              <Text variant="bodyStrong" numberOfLines={1}>
                {d.customer?.name || d.dropoff?.name || 'Retailer'}
              </Text>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {dropoffAddress(d) || '—'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.currentFoot, { backgroundColor: colors.surfaceAlt, borderTopColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 }}>
            <Glyph name="time-outline" size={15} color={d.is_delayed ? colors.danger : colors.textSecondary} />
            <Text variant="caption" style={{ color: d.is_delayed ? colors.danger : colors.textSecondary }} numberOfLines={1}>
              {due || (freezer ? 'Delivery & installation' : `${d.items_count || d.items.length} item${(d.items_count || d.items.length) === 1 ? '' : 's'}`)}
            </Text>
          </View>
          <Button label="Continue" variant="brand" size="sm" fullWidth={false} icon="arrow-forward" iconPosition="right" onPress={onOpen} />
        </View>
      </Card>
    </Pressable>
  );
}

function ActionTile({
  icon,
  label,
  caption,
  onPress,
  accent,
}: {
  icon: GlyphName;
  label: string;
  caption: string;
  onPress?: () => void;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: accent ? colors.brand : colors.brandSoft }]}>
        <Glyph name={icon} size={20} color={accent ? '#FFFFFF' : colors.brand} />
      </View>
      <View style={{ gap: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {label}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Layout.screenPadding,
    // Clear of the floating tab bar.
    paddingBottom: 140,
    gap: Spacing.xl,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bell: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: { position: 'absolute', top: -4, right: -4 },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: HERO.edge,
    backgroundColor: HERO.gradient[1],
  },
  heroSheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '55%' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  heroStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  heroStat: { flex: 1, alignItems: 'flex-start', paddingHorizontal: Spacing.xs },
  heroDivider: { width: 1, marginHorizontal: Spacing.sm },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  section: { gap: Spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
  currentTop: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  route: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.base },
  routeRail: { alignItems: 'center', paddingTop: 18, width: 16 },
  routeDotPickup: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  routeDotDrop: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  currentFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  tileIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});

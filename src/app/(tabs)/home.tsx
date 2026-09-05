import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QrPatternIcon } from '@/components/icons';
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  OrderCard,
  StatCard,
  Text,
  useToast,
} from '@/components/ui';
import { pickQrFromLibrary, tokenFromScan } from '@/lib/qr';
import { useApp } from '@/store/app';
import { Layout, Motion, Radius, Spacing, useTheme } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { mode, colors } = useTheme();
  const { rider, orders, unreadCount } = useApp();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [decoding, setDecoding] = useState(false);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const today = orders.filter((o) => o.createdAt.startsWith('Today')).length;
    const month = new Date().toLocaleDateString(undefined, { month: 'long' });
    const active = orders.filter((o) => o.status === 'in_transit' || o.status === 'awaiting_pickup');
    return {
      delivered,
      today,
      month,
      total: orders.length,
      active,
    };
  }, [orders]);

  const uploadQr = async () => {
    setDecoding(true);
    const result = await pickQrFromLibrary();
    setDecoding(false);

    if (result.ok) {
      const token = tokenFromScan(result.data);
      const match = orders.find(
        (o) => o.id === token || o.reference.toLowerCase().replace('#', '') === token,
      );
      if (match) router.push(`/order/${match.id}`);
      else toast.show(`No order matches "${result.data.slice(0, 24)}"`, 'error');
      return;
    }
    if (result.reason === 'permission') toast.show('Photo access is needed to read a QR image', 'error');
    else if (result.reason === 'nocode') toast.show('No QR code found in that image', 'error');
    else if (result.reason === 'error') toast.show('Could not read that image', 'error');
  };

  const firstName = (rider?.name ?? 'Rider').split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.base }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.brand}
            colors={[colors.brand]}
            progressViewOffset={insets.top + Spacing.sm}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => {
                setRefreshing(false);
                toast.show('Deliveries up to date', 'success');
              }, 900);
            }}
          />
        }
      >
        {/* ---- Profile ---- */}
        <Animated.View entering={FadeIn.duration(Motion.slow)} style={styles.greeting}>
          <Avatar name={rider?.name ?? 'Rider'} size={46} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text variant="caption" tone="secondary">
              {rider?.hub ?? 'Unassigned hub'}
            </Text>
            <Text variant="subheading" numberOfLines={1}>
              Hi {firstName}
            </Text>
          </View>
          <View>
            <IconButton
              icon="notifications-outline"
              variant="glass"
              onPress={() => router.push('/alerts')}
              accessibilityLabel="Notifications"
            />
            {unreadCount > 0 && (
              <View style={styles.bellBadge} pointerEvents="none">
                <Badge count={unreadCount} />
              </View>
            )}
          </View>
        </Animated.View>

        <View style={styles.body}>
          {/* ---- Overview ---- */}
          <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text variant="heading">Overview</Text>
              <Text variant="caption" tone="muted">
                {stats.month}
              </Text>
            </View>
            <View style={styles.statRow}>
              <StatCard
                icon="deliveries"
                label="Total Deliveries"
                value={String(stats.total)}
                caption={`Month of ${stats.month}`}
                trend="↑ 12%"
                featured
              />
              <StatCard
                icon="newTask"
                label="New Task"
                value={String(stats.today)}
                caption="Today"
                tone="info"
              />
            </View>
          </Animated.View>

          {/* ---- QR scanner ---- */}
          <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={styles.section}>
            <Text variant="heading">QR Scanner</Text>

            <View
              style={[
                styles.qrPanel,
                { backgroundColor: colors.brandSoft, borderColor: colors.brand, borderRadius: Radius.xl },
              ]}
            >
              <View style={[styles.qrWell, { backgroundColor: colors.surface }]}>
                <QrPatternIcon size={124} color={mode === 'dark' ? colors.text : '#111519'} />
              </View>

              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text variant="subheading">Scan QR Code</Text>
                <Text variant="caption" tone="secondary" center>
                  Use your camera, or upload an image of the code
                </Text>
              </View>

              <View style={styles.qrActions}>
                <Button
                  label="Use Camera"
                  icon="camera-outline"
                  size="md"
                  fullWidth={false}
                  onPress={() => router.push('/(tabs)/scan')}
                  style={{ flex: 1 }}
                />
                <Button
                  label={decoding ? 'Reading…' : 'Upload'}
                  icon="image-outline"
                  variant="outline"
                  size="md"
                  fullWidth={false}
                  loading={decoding}
                  onPress={uploadQr}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Animated.View>

          {/* ---- Active deliveries ---- */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text variant="heading">Active deliveries</Text>
              <Text variant="caption" tone="brand" onPress={() => router.push('/(tabs)/orders')}>
                See all
              </Text>
            </View>

            {stats.active.map((o, i) => (
              <Animated.View key={o.id} entering={FadeInDown.delay(240 + i * 70).duration(Motion.base)}>
                <OrderCard
                  order={{
                    id: o.id,
                    reference: o.reference,
                    recipient: o.buyer.name,
                    address: `${o.address.line}, ${o.address.city}`,
                    status: o.status,
                    amount: o.total,
                  }}
                  onPress={() => router.push(`/order/${o.id}`)}
                />
              </Animated.View>
            ))}
          </View>

          {/* ---- Brand footer ---- */}
          <Animated.View entering={FadeInDown.delay(320).duration(Motion.base)}>
            <View style={[styles.promo, { borderRadius: Radius.xl }]}>
              <Image
                source={require('@/assets/images/site/hero-2.jpg')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
              />
              <View style={styles.promoScrim} />
              <View style={styles.promoCopy}>
                <Text variant="label" style={styles.onBrandDim}>
                  KOOL LOGISTICS
                </Text>
                <Text variant="subheading" style={styles.onBrand}>
                  100,000+ packages delivered
                </Text>
                <Text variant="caption" style={styles.onBrandDim}>
                  99% on-time across Nigeria and West Africa
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 160 },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Layout.screenPadding,
  },
  bellBadge: { position: 'absolute', top: -2, right: -4 },
  onBrand: { color: '#FFFFFF' },
  onBrandDim: { color: 'rgba(255,255,255,0.82)' },

  body: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
    gap: Spacing.xxl,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  section: { gap: Spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statRow: { flexDirection: 'row', gap: Spacing.md },

  qrPanel: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.base,
  },
  qrWell: { padding: Spacing.md, borderRadius: Radius.md },
  qrActions: { flexDirection: 'row', gap: Spacing.md, alignSelf: 'stretch' },

  promo: { height: 132, overflow: 'hidden', justifyContent: 'flex-end' },
  promoScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  promoCopy: { padding: Spacing.base, gap: 2 },
});

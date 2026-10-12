import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, DetailRow, StatusOrb, StatusPill, Text } from '@/components/ui';
import { Layout, Motion, Spacing, useTheme } from '@/theme';

type Params = {
  /** delivered | scan | scan_rejected */
  status?: string;
  ref?: string;
  id?: string;
  delivery?: string;
  pickup?: string;
  dropoff?: string;
  warning?: string;
  reason?: string;
};

/** Outcome screen: a completed handover, or the result of a waybill scan. */
export default function Result() {
  const p = useLocalSearchParams<Params>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const scan = p.status === 'scan';
  const rejected = p.status === 'scan_rejected';
  // A scan of someone else's delivery is accepted with a warning but this
  // rider cannot open it.
  const foreign = scan && Boolean(p.warning);

  const title = rejected
    ? 'Scan not accepted'
    : scan
      ? foreign
        ? 'Not your delivery'
        : 'Delivery found'
      : 'Delivery completed';

  const body = rejected
    ? p.reason || 'This code does not match a delivery you can handle.'
    : scan
      ? foreign
        ? p.warning
        : `${p.ref ?? 'This delivery'} is assigned to you.`
      : `${p.ref ?? 'The order'} was handed over. The retailer has been asked to confirm receipt.`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + Spacing.xxxl }]}>
      <View style={styles.center}>
        <StatusOrb tone={rejected || foreign ? 'danger' : 'success'} size={116} />

        <Animated.View entering={FadeInDown.delay(140).duration(Motion.slow)} style={styles.copy}>
          <Text variant="title" center>
            {title}
          </Text>
          <Text variant="body" tone="secondary" center style={{ maxWidth: 320 }}>
            {body}
          </Text>
        </Animated.View>

        {scan && (
          <Animated.View entering={FadeInDown.delay(200).duration(Motion.slow)} style={{ alignSelf: 'stretch' }}>
            <Card>
              <View style={styles.cardHead}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {p.ref}
                </Text>
                {p.delivery ? <StatusPill status={p.delivery} size="sm" /> : null}
              </View>
              {p.pickup ? <DetailRow label="Pickup" value={p.pickup} /> : null}
              {p.dropoff ? <DetailRow label="Deliver to" value={p.dropoff} /> : null}
            </Card>
          </Animated.View>
        )}
      </View>

      <Animated.View
        entering={FadeInDown.delay(260).duration(Motion.slow)}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        {scan && !foreign && p.id ? (
          <Button
            label="Open delivery"
            icon="arrow-forward"
            iconPosition="right"
            onPress={() => router.replace({ pathname: '/order/[id]', params: { id: p.id! } })}
          />
        ) : scan || rejected ? (
          <Button label="Scan again" icon="scan-outline" onPress={() => router.replace('/(tabs)/scan')} />
        ) : (
          <Button label="Back to deliveries" onPress={() => router.replace('/(tabs)/orders')} />
        )}
        <Button label="Go to dashboard" variant="ghost" size="md" onPress={() => router.replace('/(tabs)/home')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Layout.screenPadding },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  copy: { alignItems: 'center', gap: Spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  footer: { gap: Spacing.sm, maxWidth: Layout.maxContentWidth, width: '100%', alignSelf: 'center' },
});

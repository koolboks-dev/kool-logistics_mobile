import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  Button,
  Card,
  DetailRow,
  Divider,
  EmptyState,
  Input,
  ScreenScroll,
  StatusPill,
  Text,
  Timeline,
  useToast,
} from '@/components/ui';
import { dropoffAddress, stageTimeline } from '@/lib/delivery';
import { tokenFromScan } from '@/lib/qr';
import { useScanDeliveryMutation, type RiderDelivery } from '@/store/rider-api';
import { Motion, Spacing, useTheme } from '@/theme';

export default function Track() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const [scanDelivery, { isLoading: busy }] = useScanDeliveryMutation();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<RiderDelivery | null>(null);
  const [searched, setSearched] = useState(false);

  const track = async () => {
    const raw = query.trim();
    if (raw.length < 3) {
      setError('Enter an order number or waybill token');
      return;
    }
    setError(undefined);

    const token = tokenFromScan(raw);
    try {
      const outcome = await scanDelivery(token).unwrap();
      setResult(outcome);
      setSearched(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      setResult(null);
      setSearched(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      const msg = err?.data?.error?.message || 'No shipment found for that reference';
      toast.show(msg, 'error');
    }
  };

  return (
    <ScreenScroll
      title="Track a package"
      contentContainerStyle={styles.scroll}
      onRefresh={async () => {
        if (query.trim()) await track();
      }}
    >
      <Animated.View entering={FadeInDown.duration(Motion.base)} style={{ gap: Spacing.base }}>
        <Text variant="body" tone="secondary">
          Enter an order number or scan a waybill to verify tracking details.
        </Text>

        <Input
          label="Order or Waybill #"
          placeholder="e.g. 100234 or QR token"
          autoCapitalize="characters"
          autoCorrect={false}
          leftIcon="cube-outline"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setError(undefined);
          }}
          error={error}
          returnKeyType="search"
          onSubmitEditing={track}
        />

        <Button
          label={busy ? 'Locating delivery…' : 'Track Delivery'}
          icon="search-outline"
          loading={busy}
          onPress={track}
        />
      </Animated.View>

      {result ? (
        <Animated.View entering={FadeInDown.delay(100).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 2 }}>
                  <Text variant="caption" tone="muted">
                    ORDER
                  </Text>
                  <Text variant="subheading">#{result.order_number || result.delivery_id.slice(0, 8)}</Text>
                </View>
                <StatusPill status={result.status} size="sm" />
              </View>

              <Divider />

              <DetailRow label="Pickup store" value={result.pickup.name || 'Store'} />
              <DetailRow label="Retailer" value={result.customer?.name || result.dropoff.name || 'Retailer'} />
              <DetailRow label="Destination" value={dropoffAddress(result)} />
              <DetailRow label="Items" value={`${result.items_count} item(s)`} />

              <Button
                label="Open Delivery Details"
                icon="arrow-forward-outline"
                onPress={() => router.push(`/order/${result.delivery_id}`)}
                style={{ marginTop: Spacing.xs }}
              />
            </View>
          </Card>

          <Card>
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" tone="muted">
                DELIVERY TIMELINE
              </Text>
              <Timeline steps={stageTimeline(result)} />
            </View>
          </Card>
        </Animated.View>
      ) : searched && !busy ? (
        <EmptyState
          icon="alert-circle-outline"
          title="No delivery found"
          description={`We couldn't find any delivery record matching "${query.trim()}".`}
        />
      ) : null}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.xl },
});

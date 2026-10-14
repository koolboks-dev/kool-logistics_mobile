import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  Button,
  Card,
  DetailRow,
  Divider,
  EmptyState,
  FreezerBadge,
  Input,
  ScreenScroll,
  StatusPill,
  Text,
  Timeline,
  useToast,
} from '@/components/ui';
import { dropoffAddress, isFreezerDelivery, stageTimeline } from '@/lib/delivery';
import { tokenFromScan } from '@/lib/qr';
import { apiErrorCode, apiErrorMessage } from '@/store/base-api';
import { useScanDeliveryMutation, type ScanResult } from '@/store/rider-api';
import { Spacing } from '@/theme';

export default function Track() {
  const router = useRouter();
  const toast = useToast();

  const [scanDelivery, { isLoading: busy }] = useScanDeliveryMutation();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ScanResult | null>(null);
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
    } catch (err) {
      setResult(null);
      setSearched(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      toast.show(
        apiErrorCode(err) === 'unknown_token' ? 'No delivery found for that reference' : apiErrorMessage(err),
        'error',
      );
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
      <Animated.View style={{ gap: Spacing.base }}>
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
        <Animated.View style={{ gap: Spacing.md }}>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {isFreezerDelivery(result) ? (
                  <View style={{ gap: 2, flex: 1 }}>
                    <FreezerBadge label="Freezer deployment" />
                    <Text variant="subheading">{result.freezer?.model_name || result.items[0]?.name || 'Freezer'}</Text>
                  </View>
                ) : (
                  <View style={{ gap: 2 }}>
                    <Text variant="caption" tone="muted">
                      ORDER
                    </Text>
                    <Text variant="subheading">#{result.order_number || result.delivery_id.slice(0, 8)}</Text>
                  </View>
                )}
                <StatusPill status={result.status} size="sm" />
              </View>

              <Divider />

              {isFreezerDelivery(result) ? (
                <>
                  <DetailRow label="Depot" value={result.pickup.name || result.freezer?.depot_name || 'Depot'} />
                  <DetailRow label="Install at" value={result.customer?.name || result.dropoff.name || 'Retailer'} />
                  <DetailRow label="Destination" value={dropoffAddress(result)} />
                  {result.freezer?.serial_number ? (
                    <DetailRow label="Serial" value={result.freezer.serial_number} />
                  ) : null}
                </>
              ) : (
                <>
                  <DetailRow label="Pickup store" value={result.pickup.name || 'Store'} />
                  <DetailRow label="Retailer" value={result.customer?.name || result.dropoff.name || 'Retailer'} />
                  <DetailRow label="Destination" value={dropoffAddress(result)} />
                  <DetailRow label="Items" value={`${result.items_count} item(s)`} />
                </>
              )}

              {result.warning ? (
                <Text variant="caption" tone="danger">
                  {result.warning}
                </Text>
              ) : (
                <Button
                  label="Open delivery details"
                  icon="arrow-forward-outline"
                  onPress={() => router.push(`/order/${result.delivery_id}`)}
                  style={{ marginTop: Spacing.xs }}
                />
              )}
            </View>
          </Card>

          <Card>
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" tone="muted">
                {isFreezerDelivery(result) ? 'Deployment timeline' : 'Delivery timeline'}
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

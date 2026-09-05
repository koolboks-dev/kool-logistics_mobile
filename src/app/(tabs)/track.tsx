import { Image } from 'expo-image';
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
import { Fleet } from '@/data/site';
import { tokenFromScan } from '@/lib/qr';
import { useApp } from '@/store/app';
import { Motion, Radius, Spacing, useTheme } from '@/theme';
import type { Order } from '@/data/orders';

const FLEET_IMAGES = {
  bike: require('@/assets/images/site/bike.png'),
  car: require('@/assets/images/site/car.png'),
  van: require('@/assets/images/site/van.png'),
  truck: require('@/assets/images/site/truck.png'),
} as const;

export default function Track() {
  const router = useRouter();
  const { colors } = useTheme();
  const { orders } = useApp();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const track = () => {
    const raw = query.trim();
    if (raw.length < 3) {
      setError('Enter a waybill or reference number');
      return;
    }
    setError(undefined);
    setBusy(true);

    setTimeout(() => {
      const token = tokenFromScan(raw);
      const match = orders.find(
        (o) => o.id === token || o.reference.toLowerCase().replace('#', '') === token,
      );
      setResult(match ?? null);
      setSearched(true);
      setBusy(false);
      Haptics.notificationAsync(
        match ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
      if (!match) toast.show('No shipment found for that number', 'error');
    }, 600);
  };

  return (
    <ScreenScroll
      title="Track a package"
      contentContainerStyle={styles.scroll}
      onRefresh={async () => {
        await new Promise((r) => setTimeout(r, 700));
        if (result) toast.show('Tracking refreshed', 'success');
      }}
    >
      <Animated.View entering={FadeInDown.duration(Motion.base)} style={{ gap: Spacing.base }}>
        <Text variant="body" tone="secondary">
          Enter your waybill number to see live status anywhere in Nigeria.
        </Text>

        <Input
          label="Tracking number"
          placeholder="KL-84213"
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
          label={busy ? 'Tracking…' : 'Track Now'}
          loading={busy}
          icon="navigate-outline"
          onPress={track}
        />
      </Animated.View>

      {result && (
        <Animated.View entering={FadeInDown.duration(Motion.base)} style={{ gap: Spacing.base }}>
          <Card>
            <View style={styles.resultHead}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" tone="muted">
                  {result.reference}
                </Text>
                <Text variant="subheading">{result.buyer.name}</Text>
              </View>
              <StatusPill status={result.status} size="sm" />
            </View>

            <Divider />

            <DetailRow label="Destination" value={`${result.address.line}, ${result.address.city}`} />
            <DetailRow label="Created" value={result.createdAt} />
            <DetailRow label="Value" value={result.total} strong valueTone="brand" />
          </Card>

          <Text variant="label" tone="muted">
            SHIPMENT PROGRESS
          </Text>
          <Card>
            <Timeline steps={result.timeline} />
          </Card>

          <Button
            label="Open full order"
            variant="outline"
            icon="arrow-forward"
            iconPosition="right"
            onPress={() => router.push(`/order/${result.id}`)}
          />
        </Animated.View>
      )}

      {searched && !result && (
        <EmptyState
          icon="cube-outline"
          title="Nothing found"
          description="Check the number and try again. Waybill numbers look like KL-84213."
          actionLabel="Clear"
          onAction={() => {
            setQuery('');
            setSearched(false);
          }}
        />
      )}

      {/* Fleet — straight from the website */}
      <View style={{ gap: Spacing.md }}>
        <Text variant="label" tone="muted">
          OUR FLEET
        </Text>
        <View style={styles.fleetGrid}>
          {Fleet.map((f, i) => (
            <Animated.View
              key={f.key}
              entering={FadeInDown.delay(i * 70).duration(Motion.base)}
              style={styles.fleetCell}
            >
              <Card variant="filled" padded={false} style={styles.fleetCard}>
                <Image
                  source={FLEET_IMAGES[f.key]}
                  style={styles.fleetImage}
                  contentFit="contain"
                  transition={200}
                />
                <View style={{ padding: Spacing.md, gap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text variant="caption" tone="secondary" numberOfLines={2}>
                    {f.body}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.xxl },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  fleetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  fleetCell: { width: '47.5%', flexGrow: 1 },
  fleetCard: { overflow: 'hidden', borderRadius: Radius.lg },
  fleetImage: { width: '100%', height: 92 },
});

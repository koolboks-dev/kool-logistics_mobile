import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Accordion,
  Button,
  Card,
  DetailRow,
  Dialog,
  Divider,
  EmptyState,
  ScreenScroll,
  StatusPill,
  Text,
  Timeline,
  useToast,
} from '@/components/ui';
import { useApp } from '@/store/app';
import { Layout, Motion, Radius, Spacing, useTheme } from '@/theme';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { orders, setOrderStatus } = useApp();
  const toast = useToast();

  const [confirm, setConfirm] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <ScreenScroll title="Order" onBack={() => router.back()}>
        <EmptyState
          icon="alert-circle-outline"
          title="Order not found"
          description={`No delivery matches "${id}".`}
          actionLabel="Back to deliveries"
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </ScreenScroll>
    );
  }

  const open = order.status === 'in_transit' || order.status === 'awaiting_pickup';

  const complete = (status: 'delivered' | 'cancelled') => {
    setBusy(true);
    setTimeout(() => {
      setOrderStatus(order.id, status);
      setBusy(false);
      setConfirm(false);
      setCancel(false);
      router.replace(`/result?status=${status}&ref=${encodeURIComponent(order.reference)}`);
    }, 750);
  };

  return (
    <>
      <ScreenScroll
        title="Order overview"
        onBack={() => router.back()}
        right={<StatusPill status={order.status} size="sm" />}
        contentContainerStyle={styles.scroll}
        onRefresh={async () => {
          await new Promise((r) => setTimeout(r, 700));
          toast.show('Order up to date', 'success');
        }}
      >
        {/* Package photo */}
        {order.photo && (
          <Animated.View entering={FadeInDown.duration(Motion.base)}>
            <Image
              source={{ uri: order.photo }}
              style={[styles.photo, { backgroundColor: colors.surfaceAlt, borderRadius: Radius.lg }]}
              contentFit="cover"
              transition={220}
            />
          </Animated.View>
        )}

        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)}>
          <Card>
            <View style={styles.summaryHead}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="caption" tone="muted">
                  {order.reference}
                </Text>
                <Text variant="heading">{order.buyer.name}</Text>
                <Text variant="caption" tone="secondary">
                  {order.createdAt}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text variant="caption" tone="secondary">
                  Total
                </Text>
                <Text variant="heading" tone="brand">
                  {order.total}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Collapsible sections */}
        <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Accordion title="Buyer details" defaultOpen>
            <DetailRow label="Name" value={order.buyer.name} />
            <DetailRow label="Phone" value={order.buyer.phone} />
            <DetailRow label="Email" value={order.buyer.email} />
          </Accordion>

          <Accordion title="Delivery address">
            <DetailRow label="Street" value={order.address.line} />
            <DetailRow label="Area" value={order.address.city} />
            <DetailRow label="State" value={order.address.state} />
            {order.address.landmark && <DetailRow label="Landmark" value={order.address.landmark} />}
          </Accordion>

          <Accordion title={`Order details · ${order.items.length} item${order.items.length > 1 ? 's' : ''}`}>
            {order.items.map((it, i) => (
              <DetailRow key={i} label={`${it.qty} × ${it.name}`} value={it.price} />
            ))}
            <Divider />
            <DetailRow label="Subtotal" value={order.subtotal} />
            <DetailRow label="Delivery fee" value={order.deliveryFee} />
            <Divider />
            <DetailRow label="Total" value={order.total} strong valueTone="brand" />
          </Accordion>

          <Accordion title="Payment method">
            <DetailRow label="Method" value={order.payment.method} />
            <DetailRow
              label="Status"
              value={order.payment.status}
              strong
              valueTone={order.payment.status === 'Paid' ? 'success' : order.payment.status === 'Refunded' ? 'danger' : 'secondary'}
            />
          </Accordion>
        </Animated.View>

        {/* Timeline */}
        <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)} style={{ gap: Spacing.md }}>
          <Text variant="label" tone="muted">
            ORDER TIMELINE
          </Text>
          <Card>
            <Timeline steps={order.timeline} />
          </Card>
        </Animated.View>
      </ScreenScroll>

      {/* Sticky actions — only for open orders */}
      {open && (
        <View
          style={[
            styles.actions,
            { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + Spacing.base },
          ]}
        >
          <Button label="Confirm delivery" icon="checkmark-circle-outline" onPress={() => setConfirm(true)} />
          <Button label="Cancel delivery" variant="outline" size="md" onPress={() => setCancel(true)} />
        </View>
      )}

      <Dialog
        visible={confirm}
        onClose={() => setConfirm(false)}
        title="Confirm delivery"
        message={`This marks ${order.reference} as delivered and notifies ${order.buyer.name}. This cannot be undone.`}
        confirmLabel="Confirm"
        loading={busy}
        onConfirm={() => complete('delivered')}
      />

      <Dialog
        visible={cancel}
        onClose={() => setCancel(false)}
        title="Cancel this delivery?"
        message="The order will be returned to the hub and the buyer will be refunded."
        confirmLabel="Cancel delivery"
        destructive
        loading={busy}
        onConfirm={() => complete('cancelled')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 200, gap: Spacing.lg },
  photo: { width: '100%', height: 190 },
  summaryHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Layout.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

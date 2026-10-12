import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ChevronMarkIcon } from '@/components/icons';
import { Motion, Radius, Spacing, useColors } from '@/theme';
import { Divider } from './Divider';
import { DelayBadge, FreezerBadge, StatusPill, type DeliveryStatus } from './StatusPill';
import { Text } from './Text';

export type Order = {
  id: string;
  reference: string;
  recipient: string;
  address: string;
  status: DeliveryStatus;
  amount?: string;
  date?: string;
  items?: number;
  /** Secondary line under the address, e.g. "Due 14:30 · 3 items". */
  meta?: string;
  /** Shows the red "Delayed" tag next to the status. */
  delayed?: boolean;
  /** Freezer deployment (Task 9): shows the "Freezer" tag. */
  freezer?: boolean;
};

export function OrderCard({ order, onPress }: { order: Order; onPress?: () => void }) {
  const c = useColors();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={anim}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.98, Motion.spring))}
        onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, borderRadius: Radius.lg }]}
      >
        <View style={styles.top}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.refRow}>
              <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                {order.reference}
              </Text>
              {order.freezer && <FreezerBadge />}
            </View>
            <Text variant="bodyStrong" numberOfLines={1}>
              {order.recipient}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: Spacing.xs }}>
            <StatusPill status={order.status} size="sm" />
            {order.delayed && <DelayBadge />}
          </View>
        </View>

        <Divider />

        <View style={styles.bottom}>
          <ChevronMarkIcon size={18} color={c.brand} />
          <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
            {order.address}
          </Text>
          {order.amount && (
            <Text variant="bodyStrong" tone="brand">
              {order.amount}
            </Text>
          )}
        </View>
        {order.meta ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {order.meta}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, padding: Spacing.base, gap: Spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
});

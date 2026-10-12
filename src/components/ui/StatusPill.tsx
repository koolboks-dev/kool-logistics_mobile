import Ionicons from '@expo/vector-icons/Ionicons';
import { View, type ViewStyle } from 'react-native';

import { FontFamily, FontSize, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

/**
 * Delivery lifecycle states — the backend's vocabulary, one to one
 * (delivery/choices.ts on the Kool backend).
 */
export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'travelling_to_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'confirmed'
  | 'delivered_with_issue'
  | 'disputed'
  | 'cancelled'
  | 'returned'
  | 'failed';

/** Rider-facing labels (shorter than the backend's status_display). */
export const StatusLabels: Record<DeliveryStatus, string> = {
  pending: 'Awaiting rider',
  assigned: 'Assigned',
  travelling_to_pickup: 'To pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  confirmed: 'Confirmed',
  delivered_with_issue: 'Delivered · issue',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  failed: 'Failed',
};

export function statusLabel(status: string): string {
  return StatusLabels[status as DeliveryStatus] ?? status.replace(/_/g, ' ');
}

export function StatusPill({
  status,
  size = 'md',
  style,
}: {
  status: DeliveryStatus | string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}) {
  const c = useColors();
  const map: Record<DeliveryStatus, { fg: string; bg: string }> = {
    pending: { fg: c.textSecondary, bg: c.surfaceSunken },
    assigned: { fg: c.warning, bg: c.warningSoft },
    travelling_to_pickup: { fg: c.warning, bg: c.warningSoft },
    picked_up: { fg: c.info, bg: c.infoSoft },
    in_transit: { fg: c.info, bg: c.infoSoft },
    delivered: { fg: c.success, bg: c.successSoft },
    confirmed: { fg: c.success, bg: c.successSoft },
    delivered_with_issue: { fg: c.warning, bg: c.warningSoft },
    disputed: { fg: c.danger, bg: c.dangerSoft },
    cancelled: { fg: c.danger, bg: c.dangerSoft },
    returned: { fg: c.textSecondary, bg: c.surfaceSunken },
    failed: { fg: c.danger, bg: c.dangerSoft },
  };
  const tone = map[status as DeliveryStatus] ?? map.pending;

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: tone.bg,
          borderRadius: Radius.pill,
          paddingHorizontal: size === 'sm' ? Spacing.sm : Spacing.md,
          paddingVertical: size === 'sm' ? 3 : 5,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: tone.fg,
          fontFamily: FontFamily.semibold,
          fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
        }}
      >
        {statusLabel(status)}
      </Text>
    </View>
  );
}

/** Small "Delayed" / warning tag for a delivery past its expected time. */
export function DelayBadge({ label = 'Delayed', style }: { label?: string; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: c.dangerSoft,
          borderRadius: Radius.pill,
          paddingHorizontal: Spacing.sm,
          paddingVertical: 3,
        },
        style,
      ]}
    >
      <Text style={{ color: c.danger, fontFamily: FontFamily.semibold, fontSize: FontSize.xs }}>{label}</Text>
    </View>
  );
}

/** "Freezer" tag marking a freezer deployment (Task 9) among stock deliveries. */
export function FreezerBadge({ label = 'Freezer', style }: { label?: string; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      accessibilityLabel="Freezer deployment"
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          backgroundColor: c.infoSoft,
          borderRadius: Radius.pill,
          paddingHorizontal: Spacing.sm,
          paddingVertical: 3,
        },
        style,
      ]}
    >
      <Ionicons name="snow-outline" size={11} color={c.info} />
      <Text style={{ color: c.info, fontFamily: FontFamily.semibold, fontSize: FontSize.xs }}>{label}</Text>
    </View>
  );
}

export function Badge({ count, max = 99 }: { count: number; max?: number }) {
  const c = useColors();
  if (count <= 0) return null;
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: Radius.pill,
        backgroundColor: c.danger,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontFamily: FontFamily.bold, fontSize: 10 }}>
        {count > max ? `${max}+` : count}
      </Text>
    </View>
  );
}

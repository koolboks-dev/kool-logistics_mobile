import { View, type ViewStyle } from 'react-native';

import { FontFamily, FontSize, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

/** Delivery lifecycle states used across the app. */
export type DeliveryStatus =
  | 'awaiting_pickup'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'pending'
  | 'failed';

export const StatusLabels: Record<DeliveryStatus, string> = {
  awaiting_pickup: 'Awaiting Pickup',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  pending: 'Pending',
  failed: 'Failed',
};

export function StatusPill({
  status,
  size = 'md',
  style,
}: {
  status: DeliveryStatus;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}) {
  const c = useColors();
  const map: Record<DeliveryStatus, { fg: string; bg: string }> = {
    awaiting_pickup: { fg: c.warning, bg: c.warningSoft },
    in_transit: { fg: c.info, bg: c.infoSoft },
    delivered: { fg: c.success, bg: c.successSoft },
    cancelled: { fg: c.danger, bg: c.dangerSoft },
    pending: { fg: c.textSecondary, bg: c.surfaceSunken },
    failed: { fg: c.danger, bg: c.dangerSoft },
  };
  const tone = map[status];

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
        {StatusLabels[status]}
      </Text>
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

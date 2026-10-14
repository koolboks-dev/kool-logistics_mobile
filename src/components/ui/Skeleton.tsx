import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Radius, Spacing, useColors } from '@/theme';

export function Skeleton({
  width = '100%',
  height = 14,
  radius = Radius.xs,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const c = useColors();
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      false,
    );
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: c.skeleton }, anim, style]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={{ gap: Spacing.sm }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="85%" height={12} />
    </View>
  );
}

/** Same frame as an OrderCard, while deliveries load. */
export function SkeletonOrderCard() {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.base,
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="38%" height={14} />
        <Skeleton width={72} height={22} radius={Radius.pill} />
      </View>
      <Skeleton width="55%" height={12} />
      <Skeleton width="85%" height={12} />
      <View style={{ height: 1, backgroundColor: c.border, marginVertical: Spacing.xs }} />
      <Skeleton width="45%" height={11} />
    </View>
  );
}

/** Same frame as a notification row, while notifications load. */
export function SkeletonListRow() {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: Spacing.md,
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: Spacing.base,
      }}
    >
      <Skeleton width={40} height={40} radius={Radius.sm} />
      <View style={{ flex: 1, gap: Spacing.sm }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="95%" height={11} />
        <Skeleton width="30%" height={10} />
      </View>
    </View>
  );
}

/** Several placeholders stacked with the list's own gap. */
export function SkeletonList({ count = 4, row = 'order' }: { count?: number; row?: 'order' | 'list' }) {
  const Row = row === 'order' ? SkeletonOrderCard : SkeletonListRow;
  return (
    <View style={{ gap: Spacing.md }} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <Row key={i} />
      ))}
    </View>
  );
}

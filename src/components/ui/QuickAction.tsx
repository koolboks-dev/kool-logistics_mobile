import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icons, type IconName } from '@/components/icons';
import { Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export type QuickActionTone = 'brand' | 'info' | 'success' | 'warning';

/** Circular shortcut used in the home action row. */
export function QuickAction({
  icon,
  label,
  tone = 'brand',
  onPress,
}: {
  icon: IconName;
  label: string;
  tone?: QuickActionTone;
  onPress?: () => void;
}) {
  const c = useColors();
  const Icon = Icons[icon];
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const palette = {
    brand: { fg: c.brand, bg: c.brandSoft },
    info: { fg: c.info, bg: c.infoSoft },
    success: { fg: c.success, bg: c.successSoft },
    warning: { fg: c.warning, bg: c.warningSoft },
  }[tone];

  return (
    <Animated.View style={[styles.cell, anim]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => (scale.value = withSpring(0.92, Motion.spring))}
        onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={styles.press}
      >
        <View style={[styles.well, { backgroundColor: palette.bg, borderRadius: Radius.lg }]}>
          <Icon size={24} color={palette.fg} />
        </View>
        <Text variant="caption" tone="secondary" numberOfLines={1} style={{ lineHeight: 15 }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1 },
  press: { alignItems: 'center', gap: Spacing.sm },
  well: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
});

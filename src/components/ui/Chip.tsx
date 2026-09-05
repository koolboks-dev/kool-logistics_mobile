import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { FontFamily, FontSize, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const c = useColors();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.94, Motion.spring))}
        onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
        onPress={() => {
          Haptics.selectionAsync();
          onPress?.();
        }}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? c.brand : c.surfaceAlt,
            borderColor: selected ? c.brand : c.border,
          },
        ]}
      >
        <Text
          style={{
            color: selected ? c.onBrand : c.textSecondary,
            fontFamily: FontFamily.medium,
            fontSize: FontSize.sm,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});

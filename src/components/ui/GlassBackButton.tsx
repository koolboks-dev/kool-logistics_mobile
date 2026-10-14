import { Glyph } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Motion, Radius, useColors } from '@/theme';
import { GlassSurface } from './GlassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Back affordance for inner screens: an arrow inside a liquid-glass circle.
 * Floats over content, so it stays legible whatever it sits on.
 */
export function GlassBackButton({
  onPress,
  size = 44,
  style,
}: {
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}) {
  const c = useColors();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
      onPressIn={() => (scale.value = withSpring(0.9, Motion.spring))}
      onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[anim, style]}
    >
      <GlassSurface radius={Radius.pill} style={[styles.circle, { width: size, height: size }]}>
        <Glyph name="arrow-back" size={size * 0.46} color={c.text} />
      </GlassSurface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});

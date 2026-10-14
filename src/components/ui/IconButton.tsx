import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Motion, Radius, useColors } from '@/theme';
import { GlassSurface } from './GlassSurface';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type IconButtonProps = {
  icon: GlyphName;
  onPress?: () => void;
  size?: number;
  variant?: 'plain' | 'filled' | 'soft' | 'glass';
  color?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function IconButton({
  icon,
  onPress,
  size = 40,
  variant = 'plain',
  color,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const c = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg =
    variant === 'filled' ? c.brand : variant === 'soft' ? c.surfaceAlt : 'transparent';
  const fg = color ?? (variant === 'filled' ? c.onBrand : c.text);

  if (variant === 'glass') {
    return (
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? icon}
        onPressIn={() => (scale.value = withSpring(0.9, Motion.spring))}
        onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
        onPress={() => {
          Haptics.selectionAsync();
          onPress?.();
        }}
        style={[animStyle, style]}
      >
        <GlassSurface
          radius={Radius.pill}
          tint={c.surfaceAlt}
          style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        >
          <Glyph name={icon} size={size * 0.5} color={color ?? c.text} />
        </GlassSurface>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? icon}
      onPressIn={() => (scale.value = withSpring(0.9, Motion.spring))}
      onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: Radius.pill, backgroundColor: bg },
        animStyle,
        style,
      ]}
    >
      <Glyph name={icon} size={size * 0.5} color={fg} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});

import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { FontFamily, FontSize, Layout, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

/**
 * CRM buttons (DESIGN.md §7): `primary` is charcoal, `brand` is Koolboks orange
 * for the one key action on a screen, `outline` is a charcoal border.
 */
export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: GlyphName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  haptic = true,
  style,
}: ButtonProps) {
  const c = useColors();
  const scale = useSharedValue(1);
  const press = useSharedValue(0);
  const inactive = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; bgPressed: string; fg: string; border?: string }> = {
    primary: { bg: c.primary, bgPressed: c.primaryPressed, fg: c.onPrimary },
    brand: { bg: c.brand, bgPressed: c.brandPressed, fg: c.onBrand },
    secondary: { bg: c.surfaceSunken, bgPressed: c.border, fg: c.text },
    outline: { bg: c.surface, bgPressed: c.surfaceAlt, fg: c.text, border: c.text },
    ghost: { bg: 'transparent', bgPressed: c.surfaceAlt, fg: c.brandText },
    danger: { bg: c.danger, bgPressed: c.danger, fg: '#FFFFFF' },
  };
  const p = palette[variant];

  const heights: Record<ButtonSize, number> = {
    sm: 36,
    md: Layout.controlHeightSm,
    lg: Layout.controlHeight,
  };
  const fontSizes: Record<ButtonSize, number> = { sm: FontSize.sm, md: 13, lg: FontSize.base };
  const iconSizes: Record<ButtonSize, number> = { sm: 15, md: 16, lg: 18 };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(inactive ? 0.5 : 1, { duration: Motion.fast }),
  }));

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: press.value > 0.5 ? p.bgPressed : p.bg,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={() => {
        scale.value = withSpring(0.97, Motion.spring);
        press.value = 1;
      }}
      onPressOut={() => {
        scale.value = withSpring(1, Motion.spring);
        press.value = 0;
      }}
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[
        styles.base,
        {
          height: heights[size],
          borderRadius: Radius.md,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          paddingHorizontal: size === 'sm' ? Spacing.md : Spacing.base,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        animStyle,
        bgStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Glyph name={icon} size={iconSizes[size]} color={p.fg} />
          )}
          <Text
            style={{ color: p.fg, fontFamily: FontFamily.semibold, fontSize: fontSizes[size] }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Glyph name={icon} size={iconSizes[size]} color={p.fg} />
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});

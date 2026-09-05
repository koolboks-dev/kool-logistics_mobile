import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, useTheme } from '@/theme';

export type GlassSurfaceProps = ViewProps & {
  /** 'regular' frosts more; 'clear' is closer to plain translucency. */
  glass?: 'regular' | 'clear';
  radius?: number;
  /** Draw the hairline edge that gives glass its lift. Default true. */
  bordered?: boolean;
  intensity?: number;
  /**
   * Base colour kept beneath the glass. Without it a glass element sitting on a
   * plain background has nothing to refract and reads as an empty outline, so
   * anything that had its own fill (an avatar, a tinted button) should pass it.
   */
  tint?: string;
};

/**
 * One translucent surface with the same geometry on every platform.
 *
 * iOS 26+ gets real Liquid Glass (expo-glass-effect). Everywhere else —
 * Android, older iOS, web — falls back to a blur of matching tint and radius.
 * Padding, radius and border are applied by the same wrapper in all cases, so
 * layout never shifts between platforms.
 */
export function GlassSurface({
  glass = 'regular',
  radius = Radius.lg,
  bordered = true,
  intensity = 40,
  tint,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const { mode, colors } = useTheme();

  const shell: ViewStyle = {
    borderRadius: radius,
    overflow: 'hidden',
    borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)',
  };

  if (isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle={glass}
        // Bind to the app's resolved theme, not the device. Left at the default
        // 'auto', the glass follows system appearance and ignores a manual
        // Light/Dark choice made in Account.
        colorScheme={mode}
        tintColor={tint}
        style={[shell, style]}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[shell, style]} {...rest}>
      {tint && <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
      <BlurView
        intensity={intensity}
        tint={mode === 'dark' ? 'dark' : 'light'}
        // Android renders no blur at all without this — the default is 'none',
        // which degrades to a flat translucent view. SDK 31+ variant keeps
        // older devices off the expensive path.
        experimentalBlurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      {/* Keeps contrast level with the iOS glass rendering. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.glassTint, opacity: tint ? 0.28 : 0.5 },
        ]}
      />
      {children}
    </View>
  );
}

export const liquidGlassSupported = isLiquidGlassAvailable;

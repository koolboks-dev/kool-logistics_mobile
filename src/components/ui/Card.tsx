import { StyleSheet, View, type ViewProps } from 'react-native';

import { Elevation, Radius, Spacing, useColors } from '@/theme';

export type CardProps = ViewProps & {
  variant?: 'elevated' | 'outlined' | 'filled';
  padded?: boolean;
  radius?: number;
};

export function Card({
  variant = 'outlined',
  padded = true,
  radius = Radius.lg,
  style,
  ...rest
}: CardProps) {
  const c = useColors();
  return (
    <View
      style={[
        { borderRadius: radius, backgroundColor: c.surface },
        variant === 'outlined' && { borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
        variant === 'filled' && { backgroundColor: c.surfaceAlt },
        variant === 'elevated' && Elevation.md,
        variant === 'elevated' && { shadowColor: '#000' },
        padded && { padding: Spacing.base },
        style,
      ]}
      {...rest}
    />
  );
}

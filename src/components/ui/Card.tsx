import { View, type ViewProps } from 'react-native';

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
        // CRM cards: white, 1px #E9ECEF border, 12px radius, soft shadow at most.
        variant === 'outlined' && { borderWidth: 1, borderColor: c.border },
        variant === 'filled' && { backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border },
        variant === 'elevated' && { borderWidth: 1, borderColor: c.border },
        variant === 'elevated' && Elevation.sm,
        padded && { padding: Spacing.base },
        style,
      ]}
      {...rest}
    />
  );
}

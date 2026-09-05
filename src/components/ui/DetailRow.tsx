import { View, type ViewStyle } from 'react-native';

import { Spacing } from '@/theme';
import { Text } from './Text';

/** Label/value row used throughout order details. */
export function DetailRow({
  label,
  value,
  valueTone = 'default',
  strong = false,
  style,
}: {
  label: string;
  value: string;
  valueTone?: 'default' | 'brand' | 'success' | 'danger' | 'secondary';
  strong?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.base, paddingVertical: Spacing.sm },
        style,
      ]}
    >
      <Text variant="body" tone="secondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text
        variant={strong ? 'bodyStrong' : 'body'}
        tone={valueTone}
        style={{ flex: 1, textAlign: 'right' }}
      >
        {value}
      </Text>
    </View>
  );
}

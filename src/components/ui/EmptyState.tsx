import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Motion, Spacing, useColors } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <Animated.View
      entering={FadeInDown.duration(Motion.slow)}
      style={{ alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 999,
          backgroundColor: c.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={34} color={c.textMuted} />
      </View>
      <Text variant="subheading" center>
        {title}
      </Text>
      {description && (
        <Text variant="body" tone="secondary" center style={{ maxWidth: 280 }}>
          {description}
        </Text>
      )}
      {actionLabel && (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} size="md" style={{ marginTop: Spacing.sm }} />
      )}
    </Animated.View>
  );
}

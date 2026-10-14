import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import {
  EmptyArt,
  type EmptyArtName,
} from '@/components/illustrations/EmptyArt';
import { View } from 'react-native';

import { Spacing, useColors } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  icon = 'file-tray-outline',
  art,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: GlyphName;
  /** A custom illustration; takes the place of the icon. */
  art?: EmptyArtName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.md,
      }}
    >
      {art ? (
        <EmptyArt name={art} />
      ) : (
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
          <Glyph name={icon} size={34} color={c.textMuted} />
        </View>
      )}
      <Text variant="subheading" center>
        {title}
      </Text>
      {description && (
        <Text variant="body" tone="secondary" center style={{ maxWidth: 280 }}>
          {description}
        </Text>
      )}
      {actionLabel && (
        <Button
          label={actionLabel}
          onPress={onAction}
          fullWidth={false}
          size="md"
          style={{ alignSelf: 'center', minWidth: 200, marginTop: Spacing.sm }}
        />
      )}
    </View>
  );
}

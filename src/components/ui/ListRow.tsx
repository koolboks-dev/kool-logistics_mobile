import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive = false,
}: {
  icon?: GlyphName;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const c = useColors();
  const tint = destructive ? c.danger : c.text;

  return (
    <Pressable
      onPress={() => {
        if (onPress) Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed && onPress ? c.surfaceAlt : 'transparent', borderRadius: Radius.md },
      ]}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: destructive ? c.dangerSoft : c.surfaceAlt }]}>
          <Glyph name={icon} size={18} color={destructive ? c.danger : c.brand} />
        </View>
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" style={{ color: tint }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right ?? (onPress && <Glyph name="chevron-forward" size={17} color={c.textMuted} />)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
});

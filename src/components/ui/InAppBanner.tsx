import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Elevation, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export type InAppBannerItem = {
  id: string;
  title: string;
  message?: string;
  tone?: 'brand' | 'danger' | 'info';
  icon?: GlyphName;
};

/**
 * Heads-up banner for live events (new assignment, cancellation, a new
 * notification). Sits at the top like a system notification; tap to open,
 * the close button to dismiss.
 */
export function InAppBanner({
  item,
  onPress,
  onDismiss,
}: {
  item: InAppBannerItem | null;
  onPress?: () => void;
  onDismiss: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  if (!item) return null;

  const tone = item.tone === 'danger' ? c.danger : item.tone === 'info' ? c.info : c.brand;
  const soft = item.tone === 'danger' ? c.dangerSoft : item.tone === 'info' ? c.infoSoft : c.brandSoft;

  return (
    <View style={[styles.host, { top: insets.top + Spacing.sm }]} pointerEvents="box-none">
      <Animated.View
        key={item.id}
        entering={FadeInUp.duration(Motion.base)}
        exiting={FadeOutUp.duration(Motion.fast)}
        style={[styles.card, Elevation.md, { backgroundColor: c.surface, borderColor: c.border }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={onPress}
          style={styles.body}
        >
          <View style={[styles.icon, { backgroundColor: soft }]}>
            <Glyph name={item.icon ?? 'notifications-outline'} size={18} color={tone} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {item.title}
            </Text>
            {item.message ? (
              <Text variant="caption" tone="secondary" numberOfLines={2}>
                {item.message}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10} onPress={onDismiss}>
          <Glyph name="close" size={18} color={c.textMuted} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: Spacing.base, right: Spacing.base, zIndex: 200 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  icon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
});

import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Icons, type IconName } from '@/components/icons';
import { Elevation, Palette, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export type StatTone = 'brand' | 'info' | 'success' | 'warning';

/** Overview tile: tinted icon, label, large value, supporting caption. */
export function StatCard({
  icon,
  label,
  value,
  caption,
  tone = 'brand',
  featured = false,
  trend,
}: {
  icon: IconName;
  label: string;
  value: string;
  caption?: string;
  tone?: StatTone;
  /** Fills the tile with the brand gradient — use for the primary metric only. */
  featured?: boolean;
  trend?: string;
}) {
  const c = useColors();
  const Icon = Icons[icon];

  const palette = {
    brand: { fg: c.brand, bg: c.brandSoft },
    info: { fg: c.info, bg: c.infoSoft },
    success: { fg: c.success, bg: c.successSoft },
    warning: { fg: c.warning, bg: c.warningSoft },
  }[tone];

  const body = (
    <>
      <View style={styles.head}>
        <View
          style={[
            styles.iconWell,
            {
              backgroundColor: featured ? 'rgba(255,255,255,0.22)' : palette.bg,
              borderRadius: Radius.sm,
            },
          ]}
        >
          <Icon size={20} color={featured ? '#FFFFFF' : palette.fg} />
        </View>
        {trend && (
          <View
            style={[
              styles.trend,
              { backgroundColor: featured ? 'rgba(255,255,255,0.2)' : c.successSoft },
            ]}
          >
            <Text
              variant="caption"
              style={{ color: featured ? '#FFFFFF' : c.success, fontSize: 11 }}
            >
              {trend}
            </Text>
          </View>
        )}
      </View>

      <Text variant="title" style={featured ? { color: '#FFFFFF' } : undefined}>
        {value}
      </Text>

      <Text
        variant="bodyStrong"
        style={featured ? { color: 'rgba(255,255,255,0.95)' } : undefined}
        numberOfLines={1}
      >
        {label}
      </Text>

      {caption && (
        <Text
          variant="caption"
          tone={featured ? undefined : 'muted'}
          style={featured ? { color: 'rgba(255,255,255,0.75)' } : undefined}
        >
          {caption}
        </Text>
      )}
    </>
  );

  if (featured) {
    return (
      <LinearGradient
        colors={[Palette.orangeLight, Palette.orange, Palette.orangeDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, Elevation.md, { borderRadius: Radius.lg, borderWidth: 0 }]}
      >
        {body}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        Elevation.sm,
        { backgroundColor: c.surface, borderColor: c.border, borderRadius: Radius.lg },
      ]}
    >
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
    gap: Spacing.xs,
    minHeight: 132,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  trend: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.pill },
  iconWell: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});

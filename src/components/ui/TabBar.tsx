import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icons, type IconName } from '@/components/icons';
import { FontFamily, FontSize, Motion, Radius, Spacing, useColors } from '@/theme';
import { GlassSurface } from './GlassSurface';
import { Badge } from './StatusPill';
import { Text } from './Text';

export type TabItem = {
  key: string;
  label: string;
  icon: IconName;
  badge?: number;
};

/**
 * Floating glass tab bar. Every press fires a light impact, and the icon
 * does a quick scale pop so the tap feels acknowledged on both platforms.
 */
export function TabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (key: string) => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]} pointerEvents="box-none">
      <GlassSurface radius={Radius.xxl} style={styles.bar}>
        {tabs.map((t) => (
          <TabButton
            key={t.key}
            tab={t}
            active={t.key === value}
            onPress={() => {
              if (t.key !== value) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(t.key);
            }}
          />
        ))}
      </GlassSurface>
    </View>
  );
}

function TabButton({ tab, active, onPress }: { tab: TabItem; active: boolean; onPress: () => void }) {
  const c = useColors();
  const Icon = Icons[tab.icon];
  const scale = useSharedValue(1);
  const lift = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    lift.value = withSpring(active ? 1 : 0, Motion.spring);
    if (active) {
      scale.value = withSequence(withSpring(1.18, { damping: 10, stiffness: 260 }), withSpring(1, Motion.spring));
    }
  }, [active, lift, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: -lift.value * 2 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(active ? 1 : 0.6, { duration: Motion.fast }),
  }));

  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: active }}>
      <View>
        <Animated.View style={iconStyle}>
          <Icon size={24} color={active ? c.brand : c.textSecondary} active={active} />
        </Animated.View>
        {!!tab.badge && (
          <View style={styles.badge}>
            <Badge count={tab.badge} />
          </View>
        )}
      </View>

      <Animated.View style={labelStyle}>
        <Text
          numberOfLines={1}
          style={{
            color: active ? c.brand : c.textSecondary,
            fontFamily: active ? FontFamily.semibold : FontFamily.medium,
            fontSize: FontSize.xs,
            lineHeight: 14,
          }}
        >
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.base,
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: 0 },
  badge: { position: 'absolute', top: -4, right: -8 },
});

import { Glyph } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  right,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
}) {
  const c = useColors();
  const [open, setOpen] = useState(defaultOpen);
  const rotate = useSharedValue(defaultOpen ? 180 : 0);

  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(`${rotate.value}deg`, { duration: Motion.base }) }],
  }));

  const toggle = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.create(Motion.base, 'easeInEaseOut', 'opacity'));
    rotate.value = open ? 0 : 180;
    setOpen((o) => !o);
  };

  return (
    <View style={[styles.wrap, { borderColor: c.border, borderRadius: Radius.md }]}>
      <Pressable onPress={toggle} style={styles.header}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </Text>
        {right}
        <Animated.View style={chevron}>
          <Glyph name="chevron-down" size={18} color={c.textSecondary} />
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View style={styles.body}>
          <View style={[styles.hairline, { backgroundColor: c.border }]} />
          {children}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  body: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.md },
  hairline: { height: StyleSheet.hairlineWidth, marginBottom: Spacing.sm },
});

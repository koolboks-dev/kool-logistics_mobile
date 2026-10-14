import { Glyph } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Layout, Motion, Radius, Spacing, useColors } from '@/theme';
import { Divider } from './Divider';
import { Text } from './Text';

export type SelectOption = { label: string; value: string };

export function Select({
  label,
  placeholder = 'Select',
  options,
  value,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange: (v: string) => void;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const rotate = useSharedValue(0);
  const selected = options.find((o) => o.value === value);

  const chevron = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(`${rotate.value}deg`, { duration: Motion.base }) }],
  }));

  return (
    <View style={{ gap: Spacing.xs }}>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
          rotate.value = 180;
        }}
        style={[
          styles.trigger,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            borderRadius: Radius.md,
            height: Layout.controlHeight,
          },
        ]}
      >
        <Text tone={selected ? 'default' : 'muted'} numberOfLines={1} style={{ flex: 1 }}>
          {selected?.label ?? placeholder}
        </Text>
        <Animated.View style={chevron}>
          <Glyph name="chevron-down" size={18} color={c.textSecondary} />
        </Animated.View>
      </Pressable>

      <Modal transparent visible={open} animationType="none" onRequestClose={() => setOpen(false)}>
        <Animated.View entering={FadeIn.duration(Motion.fast)} exiting={FadeOut.duration(Motion.fast)} style={styles.backdropWrap}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]}
            onPress={() => {
              setOpen(false);
              rotate.value = 0;
            }}
          />
          <Animated.View
            entering={SlideInDown.duration(Motion.base)}
            exiting={SlideOutDown.duration(Motion.fast)}
            style={[styles.sheet, { backgroundColor: c.surface }]}
          >
            <View style={[styles.grabber, { backgroundColor: c.borderStrong }]} />
            {label && (
              <Text variant="subheading" style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
                {label}
              </Text>
            )}
            <ScrollView bounces={false} style={{ maxHeight: 340 }}>
              {options.map((o, i) => {
                const active = o.value === value;
                return (
                  <View key={o.value}>
                    {i > 0 && <Divider inset={Spacing.lg} />}
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        onChange(o.value);
                        setOpen(false);
                        rotate.value = 0;
                      }}
                      style={styles.option}
                    >
                      <Text tone={active ? 'brand' : 'default'} style={{ flex: 1 }}>
                        {o.label}
                      </Text>
                      {active && <Glyph name="checkmark" size={19} color={c.brand} />}
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
  },
  backdropWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.base },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
});

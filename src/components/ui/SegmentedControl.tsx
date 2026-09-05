import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Elevation, FontFamily, FontSize, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

/**
 * Custom segmented control rather than the platform one — the native iOS and
 * Android segmented widgets look nothing alike, and parity is a requirement.
 */
export function SegmentedControl({
  segments,
  value,
  onChange,
}: {
  segments: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.value === value));
  const segWidth = width > 0 ? (width - 8) / segments.length : 0;

  const thumb = useAnimatedStyle(() => ({
    width: segWidth,
    transform: [{ translateX: withSpring(index * segWidth, Motion.spring) }],
  }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: c.controlTrack, borderRadius: Radius.pill }]}
    >
      {segWidth > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            Elevation.sm,
            { backgroundColor: c.controlThumb, borderRadius: Radius.pill },
            thumb,
          ]}
        />
      )}
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            style={styles.segment}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(s.value);
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: active ? c.text : c.textSecondary,
                fontFamily: active ? FontFamily.semibold : FontFamily.medium,
                fontSize: FontSize.sm,
              }}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, position: 'relative' },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
});

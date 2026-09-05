import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { FontFamily, FontSize, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export type PinInputProps = {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  secure?: boolean;
  error?: string;
};

export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  secure = true,
  error,
}: PinInputProps) {
  const c = useColors();
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [error, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <View style={{ gap: Spacing.sm }}>
      <Animated.View style={[styles.row, shakeStyle]}>
        {Array.from({ length }).map((_, i) => (
          <Cell
            key={i}
            char={value[i]}
            filled={i < value.length}
            active={focused && i === value.length}
            secure={secure}
            error={!!error}
            onPress={() => ref.current?.focus()}
          />
        ))}
      </Animated.View>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => {
          const digits = t.replace(/\D/g, '').slice(0, length);
          if (digits.length > value.length) Haptics.selectionAsync();
          onChange(digits);
          if (digits.length === length) onComplete?.(digits);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        // Kept offscreen rather than hidden: RN Android drops key events on
        // display:none inputs, so parity requires it stay mounted and laid out.
        style={styles.hiddenInput}
        caretHidden
      />

      {error && (
        <Text variant="caption" tone="danger" center>
          {error}
        </Text>
      )}
    </View>
  );
}

function Cell({
  char,
  filled,
  active,
  secure,
  error,
  onPress,
}: {
  char?: string;
  filled: boolean;
  active: boolean;
  secure: boolean;
  error: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) scale.value = withSequence(withSpring(1.08, Motion.spring), withSpring(1, Motion.spring));
  }, [filled, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.cell,
          {
            backgroundColor: c.surfaceAlt,
            borderRadius: Radius.md,
            borderWidth: active || error ? 1.5 : 1,
            borderColor: error ? c.danger : active ? c.brand : c.border,
          },
          style,
        ]}
      >
        {filled &&
          (secure ? (
            <View style={[styles.dot, { backgroundColor: c.text }]} />
          ) : (
            <Text style={{ fontFamily: FontFamily.semibold, fontSize: FontSize.xl, color: c.text }}>
              {char}
            </Text>
          ))}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  cell: { height: 60, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 11, height: 11, borderRadius: 999 },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});

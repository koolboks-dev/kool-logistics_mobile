import { Glyph, type GlyphName } from '@/components/icons/Glyph';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FontFamily, FontSize, Layout, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: GlyphName;
  rightIcon?: GlyphName;
  onRightIconPress?: () => void;
  /** Renders a show/hide toggle and manages secureTextEntry. */
  password?: boolean;
  /** 'pill' is the product default; 'rounded' is for dense/compact contexts. */
  shape?: 'pill' | 'rounded';
};

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  password,
  shape = 'pill',
  ...rest
}: InputProps) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const focus = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(
      error ? c.danger : focus.value ? c.brand : c.border,
      { duration: Motion.fast },
    ),
    borderWidth: withTiming(focus.value ? 1.5 : 1, { duration: Motion.fast }),
  }));

  return (
    <View style={{ gap: Spacing.sm }}>
      {label && (
        <Text variant="bodyStrong">{label}</Text>
      )}

      <Animated.View
        style={[
          styles.field,
          {
            backgroundColor: c.surface,
            borderRadius: shape === 'pill' ? Radius.pill : Radius.md,
            height: Layout.controlHeight,
          },
          borderStyle,
        ]}
      >
        {leftIcon && <Glyph name={leftIcon} size={18} color={focused ? c.brand : c.textMuted} />}

        <TextInput
          placeholderTextColor={c.textMuted}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            focus.value = 1;
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            focus.value = 0;
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: c.text }]}
          {...rest}
        />

        {password ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Glyph name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={c.textMuted} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <Glyph name={rightIcon} size={19} color={c.textMuted} />
          </Pressable>
        ) : null}
      </Animated.View>

      {(error || hint) && (
        <Animated.View entering={FadeInDown.duration(Motion.fast)}>
          <Text variant="caption" tone={error ? 'danger' : 'muted'}>
            {error ?? hint}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    padding: 0,
  },
});

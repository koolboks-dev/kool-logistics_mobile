import { Glyph } from '@/components/icons/Glyph';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { FontFamily, FontSize, Layout, Radius, Spacing, useColors } from '@/theme';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onSubmit,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: c.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: c.border, height: Layout.controlHeightSm },
      ]}
    >
      <Glyph name="search" size={17} color={c.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        style={[styles.input, { color: c.text }]}
      />
      {value.length > 0 && (
        <Animated.View exiting={FadeOut.duration(120)}>
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Glyph name="close-circle" size={17} color={c.textMuted} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.base },
  input: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.base, padding: 0 },
});

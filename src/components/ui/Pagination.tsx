import { Glyph } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { FontFamily, FontSize, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const c = useColors();
  const go = (p: number) => {
    if (p < 1 || p > pageCount || p === page) return;
    Haptics.selectionAsync();
    onChange(p);
  };

  // Windowed page numbers so long lists never overflow the row.
  const pages: (number | '…')[] = [];
  const push = (n: number | '…') => pages.push(n);
  if (pageCount <= 5) {
    for (let i = 1; i <= pageCount; i++) push(i);
  } else if (page <= 3) {
    push(1); push(2); push(3); push('…'); push(pageCount);
  } else if (page >= pageCount - 2) {
    push(1); push('…'); push(pageCount - 2); push(pageCount - 1); push(pageCount);
  } else {
    push(1); push('…'); push(page); push('…'); push(pageCount);
  }

  return (
    <View style={styles.row}>
      <Pressable onPress={() => go(page - 1)} hitSlop={6} style={styles.arrow}>
        <Glyph name="chevron-back" size={18} color={page === 1 ? c.textMuted : c.text} />
      </Pressable>

      {pages.map((p, i) =>
        p === '…' ? (
          <Text key={`gap-${i}`} tone="muted" style={styles.gap}>
            …
          </Text>
        ) : (
          <Pressable
            key={p}
            onPress={() => go(p)}
            style={[
              styles.cell,
              { borderRadius: Radius.sm, backgroundColor: p === page ? c.brand : 'transparent' },
            ]}
          >
            <Text
              style={{
                color: p === page ? c.onBrand : c.textSecondary,
                fontFamily: FontFamily.medium,
                fontSize: FontSize.sm,
              }}
            >
              {p}
            </Text>
          </Pressable>
        ),
      )}

      <Pressable onPress={() => go(page + 1)} hitSlop={6} style={styles.arrow}>
        <Glyph name="chevron-forward" size={18} color={page === pageCount ? c.textMuted : c.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  cell: { minWidth: 30, height: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  arrow: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  gap: { width: 18, textAlign: 'center' },
});

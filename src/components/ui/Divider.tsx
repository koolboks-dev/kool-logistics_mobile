import { StyleSheet, View } from 'react-native';

import { useColors } from '@/theme';

export function Divider({ inset = 0, vertical = false }: { inset?: number; vertical?: boolean }) {
  const c = useColors();
  return (
    <View
      style={
        vertical
          ? { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: c.border, marginVertical: inset }
          : { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginHorizontal: inset }
      }
    />
  );
}

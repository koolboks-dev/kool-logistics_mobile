import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Elevation, Motion, Radius, Spacing, useColors } from '@/theme';
import { Text } from './Text';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ show: (message: string, kind?: ToastKind) => void }>({
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();
  const c = useColors();

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((cur) => [...cur, { id, kind, message }]);
    Haptics.notificationAsync(
      kind === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : kind === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning,
    );
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={[styles.host, { top: insets.top + Spacing.sm }]} pointerEvents="none">
        {items.map((t) => {
          const tone =
            t.kind === 'success' ? c.success : t.kind === 'error' ? c.danger : c.info;
          const icon =
            t.kind === 'success' ? 'checkmark-circle' : t.kind === 'error' ? 'alert-circle' : 'information-circle';
          return (
            <Animated.View
              key={t.id}
              entering={FadeInUp.duration(Motion.base)}
              exiting={FadeOutUp.duration(180)}
              style={[styles.toast, Elevation.md, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <Ionicons name={icon} size={19} color={tone} />
              <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
                {t.message}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: Spacing.base, right: Spacing.base, gap: Spacing.sm, zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

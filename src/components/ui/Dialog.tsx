import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Keyframe } from 'react-native-reanimated';

import { Elevation, Motion, Radius, Spacing, useColors } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Minimal entrance: a short fade with a barely-there scale settle. No spring —
 * an alert should appear, not bounce.
 */
const DialogIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.97 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(Motion.base);

const DialogOut = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 0.98 }] },
}).duration(Motion.fast);

export function Dialog({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
  loading = false,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  destructive?: boolean;
  loading?: boolean;
}) {
  const c = useColors();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(Motion.fast)}
        exiting={FadeOut.duration(Motion.fast)}
        style={[styles.root, { backgroundColor: c.overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={DialogIn}
          exiting={DialogOut}
          style={[styles.card, Elevation.lg, { backgroundColor: c.surface }]}
        >
          <Text variant="subheading" center>
            {title}
          </Text>
          {message && (
            <Text variant="body" tone="secondary" center style={{ marginTop: Spacing.sm }}>
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label={cancelLabel} variant="outline" size="md" onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                size="md"
                loading={loading}
                onPress={onConfirm}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card: { width: '100%', maxWidth: 360, borderRadius: Radius.xl, padding: Spacing.xl },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
});

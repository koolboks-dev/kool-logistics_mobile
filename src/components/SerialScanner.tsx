/**
 * Inline camera panel that reads a freezer's serial barcode / QR code
 * (Task 9 freezer installs). Rendered inside the completion sheet rather than
 * as a second modal, so it works on both platforms without nested modals.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type BarcodeType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/theme';

/** Every type expo-camera can decode — serial labels vary by manufacturer. */
const SERIAL_BARCODE_TYPES: BarcodeType[] = [
  'code128',
  'code39',
  'code93',
  'qr',
  'datamatrix',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'itf14',
  'codabar',
  'pdf417',
  'aztec',
];

export function SerialScanner({
  onScanned,
  onClose,
}: {
  /** Raw decoded payload; the caller normalises it. */
  onScanned: (data: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const done = useRef(false);

  if (!permission) return <View style={[styles.box, { backgroundColor: '#000' }]} />;

  if (!permission.granted) {
    return (
      <View style={[styles.box, styles.center, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Ionicons name="camera-outline" size={28} color={colors.textSecondary} />
        <Text variant="caption" tone="secondary" center>
          Camera access is needed to scan the freezer&apos;s serial barcode. You can also type it below.
        </Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {permission.canAskAgain ? (
            <Button label="Allow camera" size="sm" onPress={requestPermission} />
          ) : null}
          <Button label="Type it instead" size="sm" variant="ghost" onPress={onClose} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: '#000' }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: SERIAL_BARCODE_TYPES }}
        onBarcodeScanned={({ data }) => {
          if (done.current || !data?.trim()) return;
          done.current = true;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onScanned(data);
        }}
      />
      <View style={styles.guide} pointerEvents="none">
        <View style={styles.guideLine} />
        <Text variant="caption" style={styles.onCamera}>
          Point at the serial barcode on the freezer&apos;s rating plate
        </Text>
      </View>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
          onPress={() => setTorch((t) => !t)}
          style={[styles.ctrlBtn, torch && { backgroundColor: colors.brand }]}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={18} color="#FFF" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close serial scanner"
          onPress={onClose}
          style={styles.ctrlBtn}
        >
          <Ionicons name="close" size={18} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 220,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.base },
  guide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  guideLine: { width: '80%', height: 2, backgroundColor: 'rgba(245,125,28,0.9)' },
  onCamera: { color: '#FFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  controls: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});

import { Glyph } from '@/components/icons/Glyph';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Text, useToast } from '@/components/ui';
import { pickQrFromLibrary } from '@/lib/qr';
import { useScanAndOpen } from '@/store/use-scan';
import { Layout, Spacing, useTheme } from '@/theme';

const FRAME = 210;

export default function Scan() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const { resolve, scanning } = useScanAndOpen();
  const locked = useRef(false);

  const onScanned = ({ data }: { data: string }) => {
    if (locked.current || scanning || decoding) return;
    locked.current = true;
    resolve(data).finally(() => {
      setTimeout(() => (locked.current = false), 2000);
    });
  };

  const onUpload = async () => {
    if (scanning || decoding) return;
    setDecoding(true);
    const result = await pickQrFromLibrary();
    setDecoding(false);

    if (result.ok) {
      await resolve(result.data);
      return;
    }
    if (result.reason === 'permission') toast.show('Photo access is needed to read a QR image', 'error');
    else if (result.reason === 'nocode') toast.show('No QR code found in that image', 'error');
    else if (result.reason === 'error') toast.show('Could not read that image', 'error');
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.permissionHead, { paddingTop: insets.top + Spacing.base }]}>
          <Text variant="title">Scan waybill</Text>
        </View>
        <View style={styles.permission}>
          <EmptyState
            icon="camera-outline"
            title="Camera access needed"
            description="KOOL Logistics uses the camera to read waybill QR codes on packages."
            actionLabel="Allow camera"
            onAction={requestPermission}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
        onBarcodeScanned={onScanned}
      />

      {/* Dim everything but the frame */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.dim, styles.titleZone]}>
          <Text variant="subheading" style={styles.onCamera}>
            Scan Waybill QR Code
          </Text>
        </View>

        <View style={styles.frameRow}>
          <View style={styles.dim} />

          {/* Viewfinder window */}
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {(scanning || decoding) && (
              <View style={styles.scannerBusy}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text variant="caption" style={{ color: '#FFF', marginTop: Spacing.xs }}>
                  Verifying delivery…
                </Text>
              </View>
            )}
          </View>

          <View style={styles.dim} />
        </View>

        <View style={[styles.dim, styles.bottomZone]}>
          <Text variant="caption" style={[styles.onCamera, { opacity: 0.85 }]}>
            Align the package barcode or QR code within the frame
          </Text>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
              onPress={() => setTorch((t) => !t)}
              style={[styles.ctrlBtn, torch && styles.ctrlBtnActive]}
            >
              <Glyph name={torch ? 'flash' : 'flash-outline'} size={22} color="#FFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload waybill photo"
              onPress={onUpload}
              disabled={decoding || scanning}
              style={styles.ctrlBtn}
            >
              {decoding ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Glyph name="images-outline" size={22} color="#FFF" />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* The tab bar is hidden over the camera — this is the way out. */}
      <View style={[styles.topRow, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          hitSlop={12}
          onPress={() => router.navigate('/(tabs)/home')}
          style={styles.closeBtn}
        >
          <Glyph name="close" size={24} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  permissionHead: { paddingHorizontal: Layout.screenPadding },
  permission: { flex: 1, justifyContent: 'center' },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  titleZone: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Spacing.xl },
  bottomZone: { alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.xl, paddingBottom: 90 },
  frameRow: { flexDirection: 'row', height: FRAME },
  frame: {
    width: FRAME,
    height: FRAME,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerBusy: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  onCamera: { color: '#FFF', textAlign: 'center' },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#FFF',
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  controls: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.lg },
  ctrlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnActive: { backgroundColor: '#F57D1C' },
  topRow: { position: 'absolute', top: 0, right: 0, paddingHorizontal: Layout.screenPadding },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
});

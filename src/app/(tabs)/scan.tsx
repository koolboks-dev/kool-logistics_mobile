import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, Text, useToast } from '@/components/ui';
import { pickQrFromLibrary, tokenFromScan } from '@/lib/qr';
import { useApp } from '@/store/app';
import { Layout, Motion, Spacing, useTheme } from '@/theme';

const FRAME = 210;

export default function Scan() {
  const router = useRouter();
  const { colors } = useTheme();
  const { orders } = useApp();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const locked = useRef(false);

  const resolve = (raw: string) => {
    const token = tokenFromScan(raw);
    const match = orders.find(
      (o) => o.id === token || o.reference.toLowerCase().replace('#', '') === token,
    );
    if (match) router.push(`/order/${match.id}`);
    else toast.show(`No order matches "${raw.slice(0, 24)}"`, 'error');
  };

  const onScanned = ({ data }: { data: string }) => {
    if (locked.current) return;
    locked.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resolve(data);
    setTimeout(() => (locked.current = false), 1800);
  };

  const onUpload = async () => {
    setDecoding(true);
    const result = await pickQrFromLibrary();
    setDecoding(false);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resolve(result.data);
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
            description="KOOL Logistics uses the camera only to read waybill QR codes on packages."
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

      {/* Dim everything but the frame; the frame is a clear window onto the feed. */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.dim, styles.titleZone]}>
          <Text variant="subheading" style={styles.onCamera}>
            Scan QR Code
          </Text>
        </View>

        <View style={styles.frameRow}>
          <View style={styles.dim} />
          <View style={styles.frame} />
          <View style={styles.dim} />
        </View>

        <View style={[styles.dim, styles.captionZone]}>
          <Text variant="caption" style={styles.onCameraMuted} center>
            Place the code inside the frame
          </Text>
        </View>
      </View>

      {/* Top controls */}
      <View style={[styles.topRow, { paddingTop: insets.top + Spacing.sm }]}>
        <CameraControl
          icon={torch ? 'flash' : 'flash-off'}
          label={torch ? 'Turn torch off' : 'Turn torch on'}
          onPress={() => setTorch((t) => !t)}
        />
        <CameraControl
          icon="close"
          label="Close scanner"
          onPress={() => router.push('/(tabs)/home')}
        />
      </View>

      {/* Upload from library */}
      <View style={[styles.bottomRow, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upload a QR image"
          hitSlop={10}
          onPress={onUpload}
          disabled={decoding}
          style={styles.uploadRing}
        >
          {decoding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="image-outline" size={24} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function CameraControl({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={anim}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={12}
        onPressIn={() => (scale.value = withSpring(0.88, Motion.spring))}
        onPressOut={() => (scale.value = withSpring(1, Motion.spring))}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={styles.control}
      >
        <Ionicons name={icon} size={24} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)' },
  titleZone: { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 72 },
  frameRow: { flexDirection: 'row', height: FRAME },
  frame: { width: FRAME, height: FRAME },
  captionZone: { alignItems: 'center', paddingTop: Spacing.xl },
  onCamera: { color: '#FFFFFF' },
  onCameraMuted: { color: 'rgba(255,255,255,0.82)' },
  topRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
  },
  control: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    // White glyphs vanish against a bright package or screen; a soft scrim
    // keeps them legible without adding visual chrome.
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  bottomRow: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  uploadRing: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionHead: { paddingHorizontal: Layout.screenPadding },
  permission: { flex: 1, justifyContent: 'center', paddingHorizontal: Layout.screenPadding },
});

import { Glyph } from '@/components/icons/Glyph';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Input, Text, useToast } from '@/components/ui';
import { uploadLocalFile } from '@/lib/upload';
import { apiErrorMessage } from '@/store/base-api';
import { useAdvanceDeliveryMutation, type PackageCondition } from '@/store/rider-api';
import { Radius, Spacing, useTheme } from '@/theme';

const CONDITIONS: { value: PackageCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
];
const MAX_PHOTOS = 3;

/**
 * Pickup check (parcel bookings): before marking a parcel picked up, the
 * rider counts the packages, rates the package and packaging condition and
 * takes at least one photo. A short count or damage needs a note — the
 * delivery still goes ahead and dispatch is told.
 */
export function PickupCheckModal({
  visible,
  onClose,
  deliveryId,
  expectedCount,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  deliveryId: string;
  /** Packages on the booking (null: not known). */
  expectedCount: number | null;
  onDone: () => void;
}) {
  const { colors } = useTheme();
  const toast = useToast();
  const [advance, { isLoading }] = useAdvanceDeliveryMutation();
  const [count, setCount] = useState(expectedCount != null ? String(expectedCount) : '');
  const [pkg, setPkg] = useState<PackageCondition | null>(null);
  const [packaging, setPackaging] = useState<PackageCondition | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const countOff = expectedCount != null && count !== '' && Number(count) !== expectedCount;
  const damaged = pkg === 'damaged' || packaging === 'damaged';
  const needsNote = countOff || damaged;

  const addPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.show('Camera access is needed to photograph the package.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, exif: false });
    if (result.canceled || !result.assets[0]?.uri) return;
    setPhotos((p) => [...p, result.assets[0]!.uri].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    if (count === '') return toast.show('Enter how many packages you collected.', 'error');
    if (!pkg || !packaging) return toast.show('Rate the package and the packaging.', 'error');
    if (photos.length === 0) return toast.show('Take at least one photo of the package.', 'error');
    if (needsNote && notes.trim().length < 3) {
      return toast.show(countOff ? 'Add a note about the different count.' : 'Add a note describing the damage.', 'error');
    }
    try {
      setUploading(true);
      const urls: string[] = [];
      for (const [n, uri] of photos.entries()) {
        urls.push(await uploadLocalFile(uri, { filename: `pickup-${Date.now()}-${n + 1}.jpg`, contentType: 'image/jpeg' }));
      }
      setUploading(false);
      await advance({
        id: deliveryId,
        target: 'picked_up',
        body: { pickup: { package_count: Number(count), package_condition: pkg, packaging_condition: packaging, photo_urls: urls, notes: notes.trim() } },
      }).unwrap();
      toast.show(needsNote ? 'Picked up — dispatch has been told about the difference' : 'Picked up', 'success');
      setPhotos([]);
      setNotes('');
      onDone();
    } catch (err) {
      setUploading(false);
      toast.show(apiErrorMessage(err, 'Could not confirm the pickup. Try again.'), 'error');
    }
  };

  const chips = (value: PackageCondition | null, set: (v: PackageCondition) => void) => (
    <View style={styles.chips}>
      {CONDITIONS.map((c) => {
        const on = value === c.value;
        return (
          <Pressable
            key={c.value}
            onPress={() => set(c.value)}
            style={[styles.chip, { backgroundColor: on ? colors.brandSoft : colors.surfaceAlt, borderColor: on ? colors.brand : colors.border }]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <Text variant="caption" style={{ color: on ? colors.brand : colors.text, fontWeight: on ? '600' : '400' }}>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.backdrop, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text variant="title">Check the parcel</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Glyph name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
            <Input
              label={expectedCount != null ? `Packages collected (booked: ${expectedCount})` : 'Packages collected'}
              keyboardType="number-pad"
              value={count}
              onChangeText={(v) => setCount(v.replace(/\D/g, ''))}
            />
            {countOff ? (
              <Text variant="caption" tone="danger">
                Different from the booking — add a note below.
              </Text>
            ) : null}

            <Text variant="label" tone="muted">
              Package condition
            </Text>
            {chips(pkg, setPkg)}
            <Text variant="label" tone="muted">
              Packaging condition
            </Text>
            {chips(packaging, setPackaging)}

            <View style={{ gap: Spacing.xs }}>
              <Text variant="label" tone="muted">
                Photos (at least 1, up to {MAX_PHOTOS})
              </Text>
              {photos.length > 0 ? (
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {photos.map((uri) => (
                    <Pressable key={uri} onPress={() => setPhotos((p) => p.filter((x) => x !== uri))} accessibilityLabel="Remove photo">
                      <Image source={{ uri }} style={{ width: 64, height: 64, borderRadius: Radius.sm }} contentFit="cover" />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              {photos.length < MAX_PHOTOS ? <Button label="Take a photo" variant="secondary" onPress={addPhoto} /> : null}
            </View>

            <Input
              label={needsNote ? 'Note *' : 'Note (optional)'}
              placeholder={damaged ? 'Describe the damage…' : 'Anything dispatch should know'}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <Button
              label={uploading ? 'Uploading photos…' : isLoading ? 'Confirming…' : 'Confirm pickup'}
              loading={uploading || isLoading}
              onPress={submit}
              style={{ marginTop: Spacing.sm }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  card: { maxHeight: '85%', borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, borderWidth: 1 },
});

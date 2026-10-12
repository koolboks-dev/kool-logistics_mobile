import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  Button,
  Card,
  DelayBadge,
  Dialog,
  Divider,
  EmptyState,
  Input,
  PinInput,
  ScreenScroll,
  StatusPill,
  Switch,
  Text,
  Timeline,
  useToast,
} from '@/components/ui';
import {
  callPhone,
  dayTime,
  dropoffAddress,
  expectedLabel,
  openNavigation,
  openWhatsApp,
  STAGE_ACTIONS,
  stageTimeline,
} from '@/lib/delivery';
import { apiErrorCode, apiErrorDetails, apiErrorMessage, apiErrorStatus } from '@/store/base-api';
import {
  PROBLEM_CATEGORIES,
  useAdvanceDeliveryMutation,
  useDeliveryQuery,
  useReportProblemMutation,
  useUploadPodPhotoMutation,
  type RiderStage,
} from '@/store/rider-api';
import { Motion, Radius, Spacing, useTheme } from '@/theme';

/** Backend limit is 6 MB of image bytes; stay well under it. */
const MAX_POD_BYTES = 5 * 1024 * 1024;

/** Resize + JPEG-compress a photo until it fits the upload limit. */
async function compressPhoto(uri: string, width: number): Promise<{ uri: string; base64: string }> {
  const attempts = [
    { maxWidth: 1600, compress: 0.7 },
    { maxWidth: 1280, compress: 0.55 },
    { maxWidth: 1024, compress: 0.45 },
  ];
  let last: { uri: string; base64: string } | null = null;
  for (const a of attempts) {
    const ctx = ImageManipulator.manipulate(uri);
    if (width > a.maxWidth) ctx.resize({ width: a.maxWidth });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress: a.compress, format: SaveFormat.JPEG, base64: true });
    last = { uri: out.uri, base64: out.base64 ?? '' };
    if (last.base64 && (last.base64.length * 3) / 4 <= MAX_POD_BYTES) return last;
  }
  if (!last?.base64) throw new Error('compress_failed');
  throw new Error('too_large');
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const { data: delivery, isLoading, refetch, error: loadError } = useDeliveryQuery(id);
  const [advanceDelivery, { isLoading: advancing }] = useAdvanceDeliveryMutation();
  const [uploadPodPhoto, { isLoading: uploadingPhoto }] = useUploadPodPhotoMutation();
  const [reportProblem, { isLoading: reportingProblem }] = useReportProblemMutation();

  // Complete delivery modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [podPhotoUri, setPodPhotoUri] = useState<string>('');
  /** Uploaded once on capture, reused for every submit attempt. */
  const [podPhotoUrl, setPodPhotoUrl] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [nameError, setNameError] = useState<string>();
  const [confirmStage, setConfirmStage] = useState<RiderStage | null>(null);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [podNote, setPodNote] = useState('');
  const [completing, setCompleting] = useState(false);

  // Problem report modal state
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemCategory, setProblemCategory] = useState<string>('customer_unavailable');
  const [problemDescription, setProblemDescription] = useState('');
  const [cannotComplete, setCannotComplete] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!delivery) {
    const gone = apiErrorStatus(loadError) === 404;
    return (
      <ScreenScroll title="Delivery" onBack={() => router.back()} onRefresh={async () => {
        await refetch();
      }}>
        <EmptyState
          icon={gone ? 'swap-horizontal-outline' : 'cloud-offline-outline'}
          title={gone ? 'Not assigned to you' : 'Could not load this delivery'}
          description={
            gone
              ? 'This delivery does not exist or is no longer assigned to you. Dispatch may have reassigned it.'
              : apiErrorMessage(loadError)
          }
          actionLabel="Back to deliveries"
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </ScreenScroll>
    );
  }

  const nextStage = delivery.next_status;
  const stageAction = nextStage ? STAGE_ACTIONS[nextStage] : null;

  const runStage = async (stage: RiderStage) => {
    if (stage === 'delivered') {
      setShowCompleteModal(true);
      return;
    }
    try {
      await advanceDelivery({ id: delivery.delivery_id, target: stage }).unwrap();
      setConfirmStage(null);
      toast.show(STAGE_ACTIONS[stage].done, 'success');
    } catch (err) {
      setConfirmStage(null);
      if (apiErrorCode(err) === 'illegal_transition') refetch();
      toast.show(apiErrorMessage(err, 'Could not update status. Try again.'), 'error');
    }
  };

  const onAdvancePress = () => {
    if (!nextStage) return;
    if (nextStage === 'delivered') setShowCompleteModal(true);
    else setConfirmStage(nextStage);
  };

  // From "assigned" the rider may skip the trip step if already at the store.
  const canSkipToPickup =
    nextStage === 'travelling_to_pickup' && delivery.allowed_actions.includes('picked_up');

  const pickPodImage = async (useCamera: boolean) => {
    setPhotoError(undefined);
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setPhotoError(useCamera ? 'Camera access is needed to take the proof photo.' : 'Photo access is needed.');
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, exif: false };
      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const photo = await compressPhoto(asset.uri, asset.width || 4000);
      setPodPhotoUri(photo.uri);
      setPodPhotoUrl('');

      const res = await uploadPodPhoto({
        id: delivery.delivery_id,
        filename: `pod-${Date.now()}.jpg`,
        content_type: 'image/jpeg',
        data_base64: photo.base64,
      }).unwrap();
      setPodPhotoUrl(res.url);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === 'too_large'
          ? 'That photo is too large even after compressing. Take another one.'
          : apiErrorMessage(err, 'Could not upload the photo. Try again.');
      setPhotoError(msg);
    }
  };

  const submitCompleteDelivery = async () => {
    let ok = true;
    if (!podPhotoUrl) {
      setPhotoError(uploadingPhoto ? 'Wait for the photo to finish uploading.' : 'Take a proof-of-delivery photo.');
      ok = false;
    }
    if (!/^\d{4}$/.test(deliveryCode)) {
      setCodeError('Enter the 4-digit code from the retailer.');
      ok = false;
    }
    if (!recipientName.trim()) {
      setNameError('Who received the goods?');
      ok = false;
    }
    if (!ok) return;

    setCompleting(true);
    try {
      await advanceDelivery({
        id: delivery.delivery_id,
        target: 'delivered',
        body: {
          pod_photo_url: podPhotoUrl,
          delivery_code: deliveryCode,
          recipient_name: recipientName.trim(),
          pod_note: podNote.trim() || undefined,
        },
      }).unwrap();
      setShowCompleteModal(false);
      router.replace(
        `/result?status=delivered&ref=${encodeURIComponent(delivery.order_number ? `Order #${delivery.order_number}` : 'The order')}`,
      );
    } catch (err) {
      const code = apiErrorCode(err);
      const details = apiErrorDetails(err);
      if (code === 'wrong_code') {
        const left = typeof details.attempts_left === 'number' ? details.attempts_left : undefined;
        setDeliveryCode('');
        setCodeError(
          left !== undefined
            ? `Wrong code — ${left} attempt${left === 1 ? '' : 's'} left before it locks.`
            : 'Wrong code. Check it with the retailer.',
        );
      } else if (code === 'code_locked') {
        setShowCompleteModal(false);
        toast.show('Too many wrong codes — the code is locked. Dispatch has been alerted.', 'error');
      } else if (code === 'proof_required') {
        const fields = (details.fields ?? {}) as Record<string, string>;
        if (fields.pod_photo_url || fields.photo) setPhotoError(fields.pod_photo_url || fields.photo);
        if (fields.delivery_code) setCodeError(fields.delivery_code);
        if (fields.recipient_name) setNameError(fields.recipient_name);
        if (!Object.keys(fields).length) toast.show(apiErrorMessage(err), 'error');
      } else {
        if (code === 'illegal_transition') refetch();
        toast.show(apiErrorMessage(err, 'Could not complete the delivery. Try again.'), 'error');
      }
    } finally {
      setCompleting(false);
    }
  };

  const submitProblemReport = async () => {
    if (!problemDescription.trim() || problemDescription.trim().length < 3) {
      toast.show('Please describe the issue in detail', 'error');
      return;
    }
    try {
      await reportProblem({
        id: delivery.delivery_id,
        category: problemCategory,
        description: problemDescription.trim(),
        cannot_complete: cannotComplete,
      }).unwrap();

      setShowProblemModal(false);
      setProblemDescription('');
      setCannotComplete(false);
      toast.show('Reported — dispatch has been alerted', 'success');
    } catch (err) {
      toast.show(apiErrorMessage(err, 'Could not report the problem. Try again.'), 'error');
    }
  };

  const timelineSteps = stageTimeline(delivery);

  return (
    <>
      <ScreenScroll
        title={`Order #${delivery.order_number || delivery.delivery_id.slice(0, 8)}`}
        onBack={() => router.back()}
        right={<StatusPill status={delivery.status} size="sm" />}
        contentContainerStyle={styles.scroll}
        onRefresh={async () => {
          await refetch();
          toast.show('Delivery up to date', 'success');
        }}
      >
        {/* ---- Delay / Issue Alert ---- */}
        {delivery.is_delayed && (
          <View style={[styles.delayBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Ionicons name="time-outline" size={18} color={colors.danger} />
            <Text variant="caption" style={{ color: colors.danger, fontWeight: '600' }}>
              {expectedLabel(delivery)} · Priority delivery
            </Text>
          </View>
        )}

        {delivery.code_locked && (
          <View style={[styles.delayBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.danger} />
            <Text variant="caption" style={{ color: colors.danger, fontWeight: '600' }}>
              Delivery code locked due to failed attempts. Contact dispatch.
            </Text>
          </View>
        )}

        {/* ---- Top Order Card ---- */}
        <Animated.View entering={FadeInDown.duration(Motion.base)}>
          <Card>
            <View style={{ gap: Spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" tone="muted">
                  REFERENCE
                </Text>
                {delivery.is_delayed && <DelayBadge />}
              </View>
              <Text variant="heading">#{delivery.order_number || delivery.delivery_id.slice(0, 8)}</Text>
              <Text variant="caption" tone="secondary">
                Assigned {dayTime(delivery.assigned_at)}
                {delivery.items_count ? ` · ${delivery.items_count} item${delivery.items_count === 1 ? '' : 's'}` : ''}
              </Text>
              {delivery.expected_delivery_at ? (
                <Text variant="caption" tone={delivery.is_delayed ? 'danger' : 'secondary'}>
                  {expectedLabel(delivery)}
                  {delivery.is_delayed ? '' : ` · ${dayTime(delivery.expected_delivery_at)}`}
                </Text>
              ) : null}
              {delivery.exception ? (
                <Text variant="caption" tone="danger">
                  Problem reported: {delivery.exception.reason || delivery.exception.note}
                </Text>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        {/* ---- Next Action Callout ---- */}
        {delivery.is_active && stageAction && (
          <Animated.View entering={FadeInDown.delay(60).duration(Motion.base)}>
            <Card
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.brand,
                borderWidth: 1.5,
              }}
            >
              <View style={{ gap: Spacing.sm }}>
                <Text variant="label" tone="brand">
                  NEXT STEP
                </Text>
                <Text variant="subheading">{stageAction.label}</Text>
                {stageAction.confirm ? (
                  <Text variant="caption" tone="secondary">
                    {stageAction.confirm}
                  </Text>
                ) : null}
                <Button
                  label={advancing ? 'Updating…' : stageAction.label}
                  loading={advancing}
                  onPress={onAdvancePress}
                  icon={stageAction.icon}
                  disabled={nextStage === 'delivered' && delivery.code_locked}
                  style={{ marginTop: Spacing.xs }}
                />
                {canSkipToPickup && (
                  <Button
                    label="Already at the store — confirm pickup"
                    variant="ghost"
                    size="md"
                    onPress={() => setConfirmStage('picked_up')}
                  />
                )}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ---- Pickup Location ---- */}
        <Animated.View entering={FadeInDown.delay(120).duration(Motion.base)}>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Ionicons name="cube-outline" size={18} color={colors.brand} />
                <Text variant="label" tone="muted">
                  PICKUP (WHOLESALER)
                </Text>
              </View>

              <View style={{ gap: 2 }}>
                <Text variant="bodyStrong">{delivery.pickup.name || 'Store'}</Text>
                <Text variant="caption" tone="secondary">
                  {delivery.pickup.address || 'Address on file'}
                </Text>
                {delivery.pickup.instructions ? (
                  <Text variant="caption" tone="brand" style={{ marginTop: Spacing.xs }}>
                    Note: {delivery.pickup.instructions}
                  </Text>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                {delivery.pickup.phone ? (
                  <Button
                    label="Call"
                    icon="call-outline"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => callPhone(delivery.pickup.phone)}
                  />
                ) : null}
                {delivery.pickup.whatsapp_number || delivery.pickup.phone ? (
                  <Button
                    label="WhatsApp"
                    icon="logo-whatsapp"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() =>
                      openWhatsApp(
                        delivery.pickup.whatsapp_number || delivery.pickup.phone,
                        `Hello, I am the Koolboks rider for order #${delivery.order_number}`,
                      )
                    }
                  />
                ) : null}
                <Button
                  label="Navigate"
                  icon="navigate-outline"
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={() =>
                    openNavigation({
                      latitude: delivery.pickup.latitude,
                      longitude: delivery.pickup.longitude,
                      address: delivery.pickup.address,
                    })
                  }
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* ---- Dropoff Location ---- */}
        <Animated.View entering={FadeInDown.delay(180).duration(Motion.base)}>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Ionicons name="location-outline" size={18} color={colors.success} />
                <Text variant="label" tone="muted">
                  DROPOFF (RETAILER)
                </Text>
              </View>

              <View style={{ gap: 2 }}>
                <Text variant="bodyStrong">
                  {delivery.customer?.name || delivery.dropoff.name || 'Retailer'}
                </Text>
                <Text variant="caption" tone="secondary">
                  {dropoffAddress(delivery)}
                </Text>
                {delivery.dropoff.note ? (
                  <Text variant="caption" tone="brand" style={{ marginTop: Spacing.xs }}>
                    Delivery note: {delivery.dropoff.note}
                  </Text>
                ) : null}
              </View>

              <View style={styles.actionRow}>
                {delivery.customer?.phone || delivery.dropoff.phone ? (
                  <Button
                    label="Call Retailer"
                    icon="call-outline"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => callPhone(delivery.customer?.phone || delivery.dropoff.phone)}
                  />
                ) : null}
                {delivery.customer?.phone || delivery.dropoff.phone ? (
                  <Button
                    label="WhatsApp"
                    icon="logo-whatsapp"
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() =>
                      openWhatsApp(
                        delivery.customer?.phone || delivery.dropoff.phone,
                        `Hello, I am the Koolboks rider delivering order #${delivery.order_number}`,
                      )
                    }
                  />
                ) : null}
                <Button
                  label="Navigate"
                  icon="navigate-outline"
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={() =>
                    openNavigation({
                      latitude: delivery.dropoff.latitude,
                      longitude: delivery.dropoff.longitude,
                      address: dropoffAddress(delivery),
                    })
                  }
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* ---- Items List ---- */}
        <Animated.View entering={FadeInDown.delay(240).duration(Motion.base)}>
          <Card>
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" tone="muted">
                ITEMS ({delivery.items_count})
              </Text>
              <Divider />
              {delivery.items?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text variant="body" style={{ flex: 1 }}>
                    {item.name}
                  </Text>
                  <Text variant="bodyStrong">
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* ---- Timeline ---- */}
        <Animated.View entering={FadeInDown.delay(300).duration(Motion.base)}>
          <Card>
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" tone="muted">
                DELIVERY PROGRESS
              </Text>
              <Timeline steps={timelineSteps} />
            </View>
          </Card>
        </Animated.View>

        {/* ---- Exceptions & Report Problem ---- */}
        {delivery.is_active && (
          <Animated.View entering={FadeInDown.delay(360).duration(Motion.base)}>
            <Button
              label="Report an issue with this delivery"
              variant="outline"
              icon="alert-circle-outline"
              onPress={() => setShowProblemModal(true)}
            />
          </Animated.View>
        )}
      </ScreenScroll>

      <Dialog
        visible={confirmStage !== null}
        onClose={() => setConfirmStage(null)}
        title={confirmStage ? STAGE_ACTIONS[confirmStage].label : ''}
        message={confirmStage ? STAGE_ACTIONS[confirmStage].confirm : undefined}
        confirmLabel="Confirm"
        loading={advancing}
        onConfirm={() => confirmStage && runStage(confirmStage)}
      />

      {/* ---- COMPLETE DELIVERY MODAL ---- */}
      <Modal visible={showCompleteModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="title">Complete Delivery</Text>
              <Pressable onPress={() => setShowCompleteModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
              <Text variant="caption" tone="secondary">
                To hand over goods, snap a proof photo and ask the retailer for their 4-digit code.
              </Text>

              {/* Photo upload / capture */}
              <View style={{ gap: Spacing.xs }}>
                <Text variant="label" tone="muted">
                  PROOF OF DELIVERY PHOTO *
                </Text>
                {podPhotoUri ? (
                  <View style={{ alignItems: 'center', gap: Spacing.xs }}>
                    <Image source={{ uri: podPhotoUri }} style={styles.previewImage} contentFit="cover" />
                    <Text variant="caption" tone={podPhotoUrl ? 'success' : 'secondary'}>
                      {uploadingPhoto ? 'Uploading photo…' : podPhotoUrl ? 'Photo uploaded' : 'Photo not uploaded'}
                    </Text>
                    <Button
                      label={podPhotoUrl ? 'Retake photo' : 'Try again'}
                      variant="ghost"
                      size="sm"
                      disabled={uploadingPhoto}
                      onPress={() => pickPodImage(true)}
                    />
                  </View>
                ) : (
                  <View style={styles.photoButtons}>
                    <Button
                      label="Take Photo"
                      icon="camera-outline"
                      style={{ flex: 1 }}
                      onPress={() => pickPodImage(true)}
                    />
                    <Button
                      label="Gallery"
                      icon="image-outline"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => pickPodImage(false)}
                    />
                  </View>
                )}
              </View>

              {photoError ? (
                <Text variant="caption" tone="danger">
                  {photoError}
                </Text>
              ) : null}

              {/* 4-digit code the retailer received */}
              <View style={{ gap: Spacing.xs }}>
                <Text variant="label" tone="muted">
                  RETAILER’S 4-DIGIT CODE *
                </Text>
                <PinInput
                  length={4}
                  secure={false}
                  value={deliveryCode}
                  onChange={(v) => {
                    setDeliveryCode(v.replace(/\D/g, ''));
                    setCodeError(undefined);
                  }}
                  error={codeError}
                />
                <Text variant="caption" tone="muted">
                  Ask the retailer for the code in their Kool Konnect app. {delivery.code_attempts_left} attempt
                  {delivery.code_attempts_left === 1 ? '' : 's'} left.
                </Text>
              </View>

              {/* Recipient name */}
              <Input
                label="Recipient full name *"
                placeholder="e.g. Amina Musa"
                value={recipientName}
                onChangeText={(t) => {
                  setRecipientName(t);
                  setNameError(undefined);
                }}
                error={nameError}
                leftIcon="person-outline"
              />

              {/* Note */}
              <Input
                label="Optional note"
                placeholder="e.g. Handed to store manager"
                value={podNote}
                onChangeText={setPodNote}
              />

              <Button
                label={completing ? 'Completing…' : 'Submit handover'}
                loading={completing}
                disabled={uploadingPhoto}
                onPress={submitCompleteDelivery}
                style={{ marginTop: Spacing.sm }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---- REPORT PROBLEM MODAL ---- */}
      <Modal visible={showProblemModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="title">Report a Problem</Text>
              <Pressable onPress={() => setShowProblemModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
              <Text variant="label" tone="muted">
                CATEGORY
              </Text>
              <View style={styles.categoryGrid}>
                {PROBLEM_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor:
                          problemCategory === cat.value ? colors.brandSoft : colors.surfaceAlt,
                        borderColor:
                          problemCategory === cat.value ? colors.brand : colors.border,
                      },
                    ]}
                    onPress={() => setProblemCategory(cat.value)}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color: problemCategory === cat.value ? colors.brand : colors.text,
                        fontWeight: problemCategory === cat.value ? '600' : '400',
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Description *"
                placeholder="Explain what happened…"
                multiline
                numberOfLines={3}
                value={problemDescription}
                onChangeText={setProblemDescription}
              />

              <View style={styles.cannotCompleteRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">Cannot complete delivery</Text>
                  <Text variant="caption" tone="secondary">
                    Check this if you must cancel or return the goods to the store.
                  </Text>
                </View>
                <Switch value={cannotComplete} onChange={setCannotComplete} />
              </View>

              <Button
                label={reportingProblem ? 'Submitting…' : 'Send Report to Dispatch'}
                loading={reportingProblem}
                variant={cannotComplete ? 'danger' : 'primary'}
                onPress={submitProblemReport}
                style={{ marginTop: Spacing.sm }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.base, paddingBottom: Spacing.xxl },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoButtons: { flexDirection: 'row', gap: Spacing.sm },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  cannotCompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
});

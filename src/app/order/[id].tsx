import { Glyph } from '@/components/icons/Glyph';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { PickupCheckModal } from '@/components/PickupCheckModal';
import { SerialScanner } from '@/components/SerialScanner';
import { uploadLocalFile } from '@/lib/upload';
import {
  Button,
  Card,
  DelayBadge,
  Dialog,
  Divider,
  EmptyState,
  FreezerBadge,
  Input,
  PinInput,
  ScreenScroll,
  Skeleton,
  SkeletonOrderCard,
  StatusPill,
  Switch,
  Text,
  Timeline,
  useToast,
} from '@/components/ui';
import {
  callPhone,
  dayTime,
  deliveryRef,
  dropoffAddress,
  expectedLabel,
  isFreezerDelivery,
  normaliseSerial,
  openNavigation,
  openWhatsApp,
  stageActionsFor,
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
import { Radius, Spacing, useTheme } from '@/theme';

/** Shown when the backend rejects the serial (400 serial_mismatch). */
const SERIAL_MISMATCH_MSG = "This serial doesn't match the freezer allocated to this delivery.";

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
  // Parcel bookings: picking up goes through the pickup check.
  const [showPickupCheck, setShowPickupCheck] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [podNote, setPodNote] = useState('');
  const [completing, setCompleting] = useState(false);
  // Freezer deployments: the installed unit's serial (scanned or typed).
  const [unitSerial, setUnitSerial] = useState('');
  const [serialError, setSerialError] = useState<string>();
  const [scanningSerial, setScanningSerial] = useState(false);

  // Problem report modal state
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [problemCategory, setProblemCategory] = useState<string>('customer_unavailable');
  const [problemDescription, setProblemDescription] = useState('');
  const [cannotComplete, setCannotComplete] = useState(false);
  // Problem report: did the rider reach the customer, and photo evidence (camera, up to 3).
  const [customerContacted, setCustomerContacted] = useState<boolean | null>(null);
  const [evidenceUris, setEvidenceUris] = useState<string[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  if (isLoading) {
    return (
      <ScreenScroll title="Delivery" onBack={() => router.back()} contentContainerStyle={{ gap: Spacing.base }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Skeleton width={96} height={24} radius={Radius.pill} />
          <Skeleton width={72} height={24} radius={Radius.pill} />
        </View>
        <SkeletonOrderCard />
        <Card style={{ gap: Spacing.md }}>
          <Skeleton width="40%" height={14} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
              <Skeleton width={14} height={14} radius={Radius.pill} />
              <Skeleton width={i % 2 ? '55%' : '70%'} height={12} />
            </View>
          ))}
        </Card>
        <Skeleton height={48} radius={Radius.md} />
      </ScreenScroll>
    );
  }

  if (!delivery) {
    const gone = apiErrorStatus(loadError) === 404;
    return (
      <ScreenScroll title="Delivery" onBack={() => router.back()} onRefresh={async () => {
        await refetch();
      }}>
        <EmptyState
          art={gone ? 'unassigned' : 'offline'}
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

  const freezer = isFreezerDelivery(delivery);
  const fz = delivery.freezer ?? null;
  const needsSerial = freezer || delivery.proof_required?.unit_serial === true;
  const stageCopy = stageActionsFor(delivery);
  const reference = freezer ? 'Freezer deployment' : `Order #${delivery.order_number || delivery.delivery_id.slice(0, 8)}`;
  const modelName = fz?.model_name || delivery.items[0]?.name || 'Freezer';
  const riderHello = freezer
    ? `Hello, I am the Koolboks rider for the ${modelName} freezer deployment`
    : `Hello, I am the Koolboks rider for order #${delivery.order_number}`;
  const nextStage = delivery.next_status;
  const stageAction = nextStage ? stageCopy[nextStage] : null;
  const expectedSerial = fz?.serial_number ? normaliseSerial(fz.serial_number) : '';
  const enteredSerial = normaliseSerial(unitSerial);
  const serialLooksWrong = !!expectedSerial && !!enteredSerial && enteredSerial !== expectedSerial;

  const runStage = async (stage: RiderStage) => {
    if (stage === 'delivered') {
      setShowCompleteModal(true);
      return;
    }
    try {
      await advanceDelivery({ id: delivery.delivery_id, target: stage }).unwrap();
      setConfirmStage(null);
      toast.show(stageCopy[stage].done, 'success');
    } catch (err) {
      setConfirmStage(null);
      if (apiErrorCode(err) === 'illegal_transition') refetch();
      toast.show(apiErrorMessage(err, 'Could not update status. Try again.'), 'error');
    }
  };

  const askStage = (stage: RiderStage) => {
    if (stage === 'picked_up' && delivery.pickup_check_required) setShowPickupCheck(true);
    else setConfirmStage(stage);
  };

  const onAdvancePress = () => {
    if (!nextStage) return;
    if (nextStage === 'delivered') setShowCompleteModal(true);
    else askStage(nextStage);
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
      setPhotoError(
        uploadingPhoto
          ? 'Wait for the photo to finish uploading.'
          : freezer
            ? 'Take a photo of the installed freezer.'
            : 'Take a proof-of-delivery photo.',
      );
      ok = false;
    }
    if (needsSerial && !enteredSerial) {
      setSerialError("Scan or enter the freezer's serial number.");
      ok = false;
    }
    if (!/^\d{4}$/.test(deliveryCode)) {
      setCodeError('Enter the 4-digit code from the retailer.');
      ok = false;
    }
    if (!recipientName.trim()) {
      setNameError(freezer ? 'Who received the freezer?' : 'Who received the goods?');
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
          ...(needsSerial ? { unit_serial: enteredSerial } : {}),
        },
      }).unwrap();
      setShowCompleteModal(false);
      setScanningSerial(false);
      router.replace({
        pathname: '/result',
        params: freezer
          ? { status: 'delivered', kind: 'freezer', ref: `The ${modelName} freezer` }
          : { status: 'delivered', ref: delivery.order_number ? deliveryRef(delivery) : 'The order' },
      });
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
        if (fields.unit_serial) setSerialError(fields.unit_serial);
        if (!Object.keys(fields).length) toast.show(apiErrorMessage(err), 'error');
      } else if (code === 'serial_mismatch') {
        setSerialError(SERIAL_MISMATCH_MSG);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } else {
        if (code === 'illegal_transition') refetch();
        toast.show(apiErrorMessage(err, 'Could not complete the delivery. Try again.'), 'error');
      }
    } finally {
      setCompleting(false);
    }
  };

  const addEvidencePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.show('Camera access is needed to add a photo.', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, exif: false });
    if (result.canceled || !result.assets[0]?.uri) return;
    setEvidenceUris((u) => [...u, result.assets[0]!.uri].slice(0, 3));
  };

  const submitProblemReport = async () => {
    if (!problemDescription.trim() || problemDescription.trim().length < 3) {
      toast.show('Please describe the issue in detail', 'error');
      return;
    }
    try {
      setUploadingEvidence(evidenceUris.length > 0);
      const evidenceUrls: string[] = [];
      for (const [n, uri] of evidenceUris.entries()) {
        evidenceUrls.push(await uploadLocalFile(uri, { filename: `issue-${Date.now()}-${n + 1}.jpg`, contentType: 'image/jpeg' }));
      }
      setUploadingEvidence(false);
      await reportProblem({
        id: delivery.delivery_id,
        category: problemCategory,
        description: problemDescription.trim(),
        cannot_complete: cannotComplete,
        evidence_urls: evidenceUrls,
        customer_contacted: customerContacted,
      }).unwrap();

      setShowProblemModal(false);
      setProblemDescription('');
      setCannotComplete(false);
      setCustomerContacted(null);
      setEvidenceUris([]);
      toast.show('Reported — dispatch has been alerted', 'success');
    } catch (err) {
      setUploadingEvidence(false);
      toast.show(apiErrorMessage(err, 'Could not report the problem. Try again.'), 'error');
    }
  };

  const timelineSteps = stageTimeline(delivery);

  return (
    <>
      <ScreenScroll
        title={reference}
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
            <Glyph name="time-outline" size={18} color={colors.danger} />
            <Text variant="caption" style={{ color: colors.danger, fontWeight: '600' }}>
              {expectedLabel(delivery)} · Priority delivery
            </Text>
          </View>
        )}

        {delivery.code_locked && (
          <View style={[styles.delayBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <Glyph name="lock-closed-outline" size={18} color={colors.danger} />
            <Text variant="caption" style={{ color: colors.danger, fontWeight: '600' }}>
              Delivery code locked due to failed attempts. Contact dispatch.
            </Text>
          </View>
        )}

        {/* ---- Top Order Card ---- */}
        <Animated.View>
          <Card>
            <View style={{ gap: Spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {freezer ? (
                  <FreezerBadge label="Freezer deployment" />
                ) : (
                  <Text variant="caption" tone="muted">
                    REFERENCE
                  </Text>
                )}
                {delivery.is_delayed && <DelayBadge />}
              </View>
              {freezer ? (
                <>
                  <Text variant="heading">{modelName}</Text>
                  {fz?.serial_number ? (
                    <Text variant="caption" tone="secondary">
                      Serial {fz.serial_number}
                    </Text>
                  ) : null}
                  <Text variant="caption" tone="secondary">
                    Collect from {delivery.pickup.name || fz?.depot_name || 'the depot'} · install at{' '}
                    {delivery.dropoff.name || delivery.customer?.name || 'the retailer'}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    Assigned {dayTime(delivery.assigned_at)}
                  </Text>
                </>
              ) : (
                <>
                  <Text variant="heading">#{delivery.order_number || delivery.delivery_id.slice(0, 8)}</Text>
                  <Text variant="caption" tone="secondary">
                    Assigned {dayTime(delivery.assigned_at)}
                    {delivery.items_count
                      ? ` · ${delivery.items_count} item${delivery.items_count === 1 ? '' : 's'}`
                      : ''}
                  </Text>
                </>
              )}
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
          <Animated.View>
            <Card
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.brand,
                borderWidth: 1.5,
              }}
            >
              <View style={{ gap: Spacing.sm }}>
                <Text variant="label" tone="brand">
                  Next step
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
                    label={freezer ? 'Already at the depot — confirm collection' : 'Already at the store — confirm pickup'}
                    variant="ghost"
                    size="md"
                    onPress={() => askStage('picked_up')}
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  />
                )}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ---- Pickup Location ---- */}
        <Animated.View>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Glyph name="cube-outline" size={18} color={colors.brand} />
                <Text variant="label" tone="muted">
                  {freezer ? 'Pickup (depot)' : 'Pickup (wholesaler)'}
                </Text>
              </View>

              <View style={{ gap: 2 }}>
                <Text variant="bodyStrong">{delivery.pickup.name || (freezer ? fz?.depot_name || 'Depot' : 'Store')}</Text>
                <Text variant="caption" tone="secondary">
                  {delivery.pickup.address || 'Address on file'}
                </Text>
                {delivery.pickup.instructions ? (
                  <Text variant="caption" tone="brand" style={{ marginTop: Spacing.xs }}>
                    Note: {delivery.pickup.instructions}
                  </Text>
                ) : null}
                {delivery.vehicle ? (
                  <Text variant="caption" tone="secondary" style={{ marginTop: Spacing.xs }}>
                    Vehicle: {[delivery.vehicle.registration, [delivery.vehicle.make, delivery.vehicle.model].filter(Boolean).join(' ')].filter(Boolean).join(' · ')}
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
                        riderHello,
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
        <Animated.View>
          <Card>
            <View style={{ gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <Glyph name="location-outline" size={18} color={colors.success} />
                <Text variant="label" tone="muted">
                  {freezer ? 'Install at (retailer)' : 'Drop-off (retailer)'}
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
                    label="Call retailer"
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
                        freezer
                          ? `Hello, I am the Koolboks rider bringing your ${modelName} freezer to install`
                          : `Hello, I am the Koolboks rider delivering order #${delivery.order_number}`,
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
        <Animated.View>
          <Card>
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" tone="muted">
                {freezer ? 'Freezer' : `Items (${delivery.items_count})`}
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
              {freezer ? (
                <View style={[styles.installNote, { backgroundColor: colors.infoSoft }]}>
                  <Glyph name="construct-outline" size={16} color={colors.info} />
                  <Text variant="caption" style={{ color: colors.info, flex: 1 }}>
                    Install step: set up the freezer at the retailer, then scan its serial and photograph it
                    installed to complete.
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        {/* ---- Timeline ---- */}
        <Animated.View>
          <Card>
            <View style={{ gap: Spacing.sm }}>
              <Text variant="label" tone="muted">
                {freezer ? 'Deployment progress' : 'Delivery progress'}
              </Text>
              <Timeline steps={timelineSteps} />
            </View>
          </Card>
        </Animated.View>

        {/* ---- Exceptions & Report Problem ---- */}
        {delivery.is_active && (
          <Animated.View>
            <Button
              label={freezer ? 'Report an issue with this deployment' : 'Report an issue with this delivery'}
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
        title={confirmStage ? stageCopy[confirmStage].label : ''}
        message={confirmStage ? stageCopy[confirmStage].confirm : undefined}
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
              <Text variant="title">{freezer ? 'Complete installation' : 'Complete Delivery'}</Text>
              <Pressable
                onPress={() => {
                  setShowCompleteModal(false);
                  setScanningSerial(false);
                }}
                hitSlop={10}
              >
                <Glyph name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
              <Text variant="caption" tone="secondary">
                {freezer
                  ? "Once the freezer is installed, scan its serial, photograph it in place and ask the retailer for their 4-digit code."
                  : 'To hand over goods, snap a proof photo and ask the retailer for their 4-digit code.'}
              </Text>

              {/* Freezer serial — must match the unit allocated to this deployment */}
              {needsSerial ? (
                <View style={{ gap: Spacing.xs }}>
                  <Text variant="label" tone="muted">
                    Freezer serial number *
                  </Text>
                  {scanningSerial ? (
                    <SerialScanner
                      onScanned={(data) => {
                        setUnitSerial(normaliseSerial(data));
                        setSerialError(undefined);
                        setScanningSerial(false);
                      }}
                      onClose={() => setScanningSerial(false)}
                    />
                  ) : (
                    <Button
                      label={enteredSerial ? 'Scan again' : 'Scan serial barcode'}
                      icon="barcode-outline"
                      variant={enteredSerial ? 'outline' : 'primary'}
                      onPress={() => {
                        setSerialError(undefined);
                        setScanningSerial(true);
                      }}
                    />
                  )}
                  <Input
                    placeholder="Or type the serial number"
                    value={unitSerial}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onChangeText={(t) => {
                      setUnitSerial(t);
                      setSerialError(undefined);
                    }}
                    error={serialError}
                    hint={
                      serialLooksWrong
                        ? "This doesn't look like the allocated freezer's serial — check the rating plate."
                        : enteredSerial && enteredSerial === expectedSerial
                          ? 'Matches the allocated freezer.'
                          : undefined
                    }
                    leftIcon="barcode-outline"
                  />
                </View>
              ) : null}

              {/* Photo upload / capture */}
              <View style={{ gap: Spacing.xs }}>
                <Text variant="label" tone="muted">
                  {freezer ? 'Installed freezer photo *' : 'Proof of delivery photo *'}
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
                      label="Take photo"
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
                  Retailer’s 4-digit code *
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
                placeholder={freezer ? 'e.g. Installed near the shop entrance' : 'e.g. Handed to store manager'}
                value={podNote}
                onChangeText={setPodNote}
              />

              <Button
                label={completing ? 'Completing…' : freezer ? 'Submit installation' : 'Submit handover'}
                loading={completing}
                disabled={uploadingPhoto}
                onPress={submitCompleteDelivery}
                style={{ marginTop: Spacing.sm }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ---- PICKUP CHECK (parcel bookings) ---- */}
      {showPickupCheck ? (
        <PickupCheckModal
          visible
          onClose={() => setShowPickupCheck(false)}
          deliveryId={delivery.delivery_id}
          expectedCount={delivery.pickup_expected_count ?? null}
          onDone={() => setShowPickupCheck(false)}
        />
      ) : null}

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
                <Glyph name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
              <Text variant="label" tone="muted">
                Category
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

              <Text variant="label" tone="muted">
                Did you reach the customer?
              </Text>
              <View style={styles.categoryGrid}>
                {([
                  [true, 'Yes, I spoke to them'],
                  [false, "No, I couldn't reach them"],
                ] as const).map(([value, label]) => (
                  <Pressable
                    key={String(value)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: customerContacted === value ? colors.brandSoft : colors.surfaceAlt,
                        borderColor: customerContacted === value ? colors.brand : colors.border,
                      },
                    ]}
                    onPress={() => setCustomerContacted(customerContacted === value ? null : value)}
                  >
                    <Text
                      variant="caption"
                      style={{ color: customerContacted === value ? colors.brand : colors.text, fontWeight: customerContacted === value ? '600' : '400' }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ gap: Spacing.xs }}>
                <Text variant="label" tone="muted">
                  Photos (optional, up to 3)
                </Text>
                {evidenceUris.length > 0 ? (
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    {evidenceUris.map((uri) => (
                      <Pressable key={uri} onPress={() => setEvidenceUris((u) => u.filter((x) => x !== uri))} accessibilityLabel="Remove photo">
                        <Image source={{ uri }} style={{ width: 64, height: 64, borderRadius: Radius.sm }} contentFit="cover" />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {evidenceUris.length < 3 ? (
                  <Button label="Take a photo" variant="secondary" onPress={addEvidencePhoto} />
                ) : null}
              </View>

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
                label={uploadingEvidence ? 'Uploading photos…' : reportingProblem ? 'Submitting…' : 'Send Report to Dispatch'}
                loading={reportingProblem || uploadingEvidence}
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
  installNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
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

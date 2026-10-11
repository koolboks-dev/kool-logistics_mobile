import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  DetailRow,
  Dialog,
  Divider,
  EmptyState,
  Input,
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
import {
  PROBLEM_CATEGORIES,
  useAdvanceDeliveryMutation,
  useDeliveryQuery,
  useReportProblemMutation,
  useUploadPodPhotoMutation,
  type RiderStage,
} from '@/store/rider-api';
import { Layout, Motion, Radius, Spacing, useColors, useTheme } from '@/theme';

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const { data: delivery, isLoading, refetch, isFetching } = useDeliveryQuery(id);
  const [advanceDelivery, { isLoading: advancing }] = useAdvanceDeliveryMutation();
  const [uploadPodPhoto, { isLoading: uploadingPhoto }] = useUploadPodPhotoMutation();
  const [reportProblem, { isLoading: reportingProblem }] = useReportProblemMutation();

  // Complete delivery modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [podPhotoBase64, setPodPhotoBase64] = useState<string>('');
  const [podPhotoUri, setPodPhotoUri] = useState<string>('');
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
    return (
      <ScreenScroll title="Delivery" onBack={() => router.back()}>
        <EmptyState
          icon="alert-circle-outline"
          title="Delivery not found"
          description={`No delivery matches "${id}".`}
          actionLabel="Back to deliveries"
          onAction={() => router.replace('/(tabs)/orders')}
        />
      </ScreenScroll>
    );
  }

  const nextStage = delivery.next_status;
  const stageAction = nextStage ? STAGE_ACTIONS[nextStage] : null;

  const onAdvancePress = async () => {
    if (!nextStage) return;

    if (nextStage === 'delivered') {
      setShowCompleteModal(true);
      return;
    }

    try {
      await advanceDelivery({ id: delivery.delivery_id, target: nextStage }).unwrap();
      toast.show(stageAction?.done || 'Status updated', 'success');
    } catch (err: any) {
      toast.show(err?.data?.error?.message || 'Could not update status. Try again.', 'error');
    }
  };

  const pickPodImage = async (useCamera: boolean) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          });

      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      if (manip.base64) {
        setPodPhotoUri(manip.uri);
        setPodPhotoBase64(manip.base64);
      }
    } catch {
      toast.show('Could not capture photo. Check permissions and try again.', 'error');
    }
  };

  const submitCompleteDelivery = async () => {
    if (!podPhotoBase64) {
      toast.show('Proof of delivery photo is required', 'error');
      return;
    }
    if (!deliveryCode.trim() || deliveryCode.trim().length !== 4) {
      toast.show('Enter the 4-digit delivery code from the retailer', 'error');
      return;
    }
    if (!recipientName.trim()) {
      toast.show('Recipient name is required', 'error');
      return;
    }

    setCompleting(true);
    try {
      // 1. Upload POD Photo
      const photoRes = await uploadPodPhoto({
        id: delivery.delivery_id,
        filename: `pod_${Date.now()}.jpg`,
        content_type: 'image/jpeg',
        data_base64: podPhotoBase64,
      }).unwrap();

      // 2. Advance to delivered with POD details
      await advanceDelivery({
        id: delivery.delivery_id,
        target: 'delivered',
        body: {
          pod_photo_url: photoRes.url,
          delivery_code: deliveryCode.trim(),
          recipient_name: recipientName.trim(),
          pod_note: podNote.trim() || undefined,
        },
      }).unwrap();

      setCompleting(false);
      setShowCompleteModal(false);
      toast.show('Delivery marked completed!', 'success');
      router.replace(
        `/result?status=delivered&ref=${encodeURIComponent(delivery.order_number || delivery.delivery_id)}`,
      );
    } catch (err: any) {
      setCompleting(false);
      const code = err?.data?.error?.code;
      const msg = err?.data?.error?.message;
      if (code === 'wrong_code') {
        const left = err?.data?.error?.attempts_left ?? delivery.code_attempts_left - 1;
        toast.show(`Wrong code. ${left} attempts left before lock.`, 'error');
      } else if (code === 'code_locked') {
        toast.show('Delivery code is locked. Please contact dispatch.', 'error');
      } else {
        toast.show(msg || 'Failed to complete delivery. Check code and details.', 'error');
      }
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
      toast.show('Problem report submitted to dispatch', 'info');
      if (cannotComplete) {
        router.replace(
          `/result?status=cancelled&ref=${encodeURIComponent(delivery.order_number || delivery.delivery_id)}`,
        );
      }
    } catch (err: any) {
      toast.show(err?.data?.error?.message || 'Could not report problem. Try again.', 'error');
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
              </Text>
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
                  icon={stageAction.icon as any}
                  style={{ marginTop: Spacing.xs }}
                />
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

      {/* ---- COMPLETE DELIVERY MODAL ---- */}
      <Modal visible={showCompleteModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
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
                    <Button
                      label="Retake Photo"
                      variant="ghost"
                      size="sm"
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

              {/* 4-digit Code */}
              <Input
                label="4-digit retailer code *"
                placeholder="1234"
                keyboardType="number-pad"
                maxLength={4}
                value={deliveryCode}
                onChangeText={setDeliveryCode}
                leftIcon="key-outline"
              />
              <Text variant="caption" tone="muted">
                Attempts left: {delivery.code_attempts_left}
              </Text>

              {/* Recipient name */}
              <Input
                label="Recipient full name *"
                placeholder="e.g. Amina Musa"
                value={recipientName}
                onChangeText={setRecipientName}
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
                label={completing ? 'Completing…' : 'Submit Handover'}
                loading={completing}
                onPress={submitCompleteDelivery}
                style={{ marginTop: Spacing.sm }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- REPORT PROBLEM MODAL ---- */}
      <Modal visible={showProblemModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
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
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  ScreenScroll,
  SwipeableRow,
  Text,
  useToast,
} from '@/components/ui';
import { dayTime } from '@/lib/delivery';
import {
  notificationDeliveryId,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  type AppNotification,
} from '@/store/notifications-api';
import { Motion, Radius, Spacing, useTheme } from '@/theme';

const META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  delivery: { icon: 'bicycle-outline', label: 'Delivery' },
  payment: { icon: 'card-outline', label: 'Payment' },
  system: { icon: 'information-circle-outline', label: 'System' },
  freezer: { icon: 'snow-outline', label: 'Freezer deployment' },
};

export default function Alerts() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();

  const { data, refetch } = useNotificationsQuery({ pageSize: 50 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const [selected, setSelected] = useState<AppNotification | null>(null);

  const notifications = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const open = async (n: AppNotification) => {
    if (!n.is_read) {
      markRead(n.id).unwrap().catch(() => {});
    }
    const deliveryId = notificationDeliveryId(n);
    if (deliveryId) {
      router.push(`/order/${deliveryId}`);
      return;
    }
    setSelected(n);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.show('All marked as read', 'success');
    } catch {
      toast.show('Could not mark all as read', 'error');
    }
  };

  return (
    <>
      <ScreenScroll
        title="Notifications"
        onBack={() => router.back()}
        contentContainerStyle={styles.scroll}
        onRefresh={async () => {
          await refetch();
          toast.show('Notifications up to date', 'success');
        }}
        right={
          unreadCount > 0 ? (
            <Text variant="caption" tone="brand" onPress={handleMarkAllRead}>
              {markingAll ? 'Marking…' : 'Mark all read'}
            </Text>
          ) : undefined
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="Nothing new"
            description="Delivery assignments, changes, and alerts will appear here."
          />
        ) : (
          <>
            <Text variant="caption" tone="secondary">
              Swipe right to mark read. Tap any delivery notification to open the order.
            </Text>

            <Animated.View layout={LinearTransition.duration(Motion.base)} style={styles.list}>
              {notifications.map((n, i) => {
                const meta =
                  n.metadata?.delivery_type === 'freezer' ? META.freezer : (META[n.type] ?? META.system);
                const dId = notificationDeliveryId(n);
                return (
                  <Animated.View
                    key={n.id}
                    entering={FadeInDown.delay(i * 35).duration(Motion.base)}
                    layout={LinearTransition.duration(Motion.base)}
                  >
                    <SwipeableRow
                      leftAction={
                        n.is_read
                          ? undefined
                          : {
                              icon: 'checkmark-done',
                              label: 'Read',
                              color: colors.success,
                              onPress: () => {
                                markRead(n.id).unwrap().catch(() => {});
                                toast.show('Marked as read', 'success');
                              },
                            }
                      }
                    >
                      <Pressable onPress={() => open(n)}>
                        <Card style={{ borderColor: n.is_read ? colors.border : colors.brand }}>
                          <View style={styles.cardRow}>
                            <View
                              style={[
                                styles.iconWrap,
                                {
                                  backgroundColor: n.is_read ? colors.surfaceAlt : colors.brandSoft,
                                },
                              ]}
                            >
                              <Ionicons
                                name={meta.icon}
                                size={20}
                                color={n.is_read ? colors.textSecondary : colors.brand}
                              />
                            </View>

                            <View style={{ flex: 1, gap: 2 }}>
                              <View style={styles.head}>
                                <Text variant="bodyStrong" numberOfLines={1}>
                                  {n.title}
                                </Text>
                                {!n.is_read && <View style={[styles.dot, { backgroundColor: colors.brand }]} />}
                              </View>
                              <Text variant="caption" tone="secondary" numberOfLines={2}>
                                {n.message}
                              </Text>
                              <View style={styles.footer}>
                                <Text variant="caption" tone="muted">
                                  {dayTime(n.created_at)}
                                </Text>
                                {dId ? (
                                  <Text variant="caption" tone="brand" style={{ fontWeight: '600' }}>
                                    View order →
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          </View>
                        </Card>
                      </Pressable>
                    </SwipeableRow>
                  </Animated.View>
                );
              })}
            </Animated.View>
          </>
        )}
      </ScreenScroll>

      {/* Details bottom sheet for non-delivery notices */}
      <BottomSheet visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <View style={{ gap: Spacing.md, paddingBottom: Spacing.lg }}>
            <Text variant="subheading">{selected.title}</Text>
            <Text variant="body" tone="secondary">
              {selected.message}
            </Text>
            <Text variant="caption" tone="muted">
              {dayTime(selected.created_at)}
            </Text>
            <Button label="Close" onPress={() => setSelected(null)} style={{ marginTop: Spacing.sm }} />
          </View>
        ) : (
          <View />
        )}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.base },
  list: { gap: Spacing.sm },
  cardRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  iconWrap: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import {
  BottomSheet,
  Button,
  Card,
  Divider,
  EmptyState,
  ScreenScroll,
  StatusPill,
  SwipeableRow,
  Text,
  useToast,
} from '@/components/ui';
import type { AppNotification } from '@/data/orders';
import { useApp } from '@/store/app';
import { Motion, Radius, Spacing, useTheme } from '@/theme';

const META = {
  delivery: { icon: 'cube-outline', label: 'Delivery' },
  payment: { icon: 'card-outline', label: 'Payment' },
  system: { icon: 'information-circle-outline', label: 'System' },
} as const;

export default function Alerts() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead, removeNotification, orders } = useApp();
  const toast = useToast();

  const [selected, setSelected] = useState<AppNotification | null>(null);

  const open = (n: AppNotification) => {
    markRead(n.id);
    setSelected(n);
  };

  const related = selected?.orderId ? orders.find((o) => o.id === selected.orderId) : undefined;

  return (
    <>
      <ScreenScroll
        title="Notifications"
        onBack={() => router.back()}
        contentContainerStyle={styles.scroll}
        onRefresh={async () => {
          await new Promise((r) => setTimeout(r, 700));
          toast.show('Notifications up to date', 'success');
        }}
        right={
          unreadCount > 0 ? (
            <Text variant="caption" tone="brand" onPress={markAllRead}>
              Mark all read
            </Text>
          ) : undefined
        }
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-off-outline"
            title="Nothing new"
            description="Delivery and payment updates will appear here."
          />
        ) : (
          <>
            <Text variant="caption" tone="secondary">
              Swipe a card right to mark it read, left to remove it.
            </Text>

            <Animated.View layout={LinearTransition.duration(Motion.base)} style={styles.list}>
              {notifications.map((n, i) => {
                const meta = META[n.kind];
                return (
                  <Animated.View
                    key={n.id}
                    entering={FadeInDown.delay(i * 60).duration(Motion.base)}
                    layout={LinearTransition.duration(Motion.base)}
                  >
                    <SwipeableRow
                      leftAction={
                        n.read
                          ? undefined
                          : {
                              icon: 'checkmark-done',
                              label: 'Read',
                              color: colors.success,
                              onPress: () => {
                                markRead(n.id);
                                toast.show('Marked as read', 'success');
                              },
                            }
                      }
                      rightAction={{
                        icon: 'trash-outline',
                        label: 'Remove',
                        color: colors.danger,
                        onPress: () => {
                          removeNotification(n.id);
                          toast.show('Notification removed');
                        },
                      }}
                    >
                      <Pressable onPress={() => open(n)}>
                        <Card
                          variant="outlined"
                          style={[
                            styles.card,
                            !n.read && { borderColor: colors.brand, backgroundColor: colors.brandSoft },
                          ]}
                        >
                          <View style={styles.cardHead}>
                          <View
                            style={[
                              styles.iconWell,
                              { backgroundColor: n.read ? colors.surfaceAlt : colors.surface },
                            ]}
                          >
                            <Ionicons
                              name={meta.icon}
                              size={18}
                              color={n.read ? colors.textSecondary : colors.brand}
                            />
                          </View>

                          <View style={{ flex: 1, gap: 2 }}>
                            <Text variant="bodyStrong" numberOfLines={1}>
                              {n.title}
                            </Text>
                            <Text variant="caption" tone="secondary" numberOfLines={2}>
                              {n.body}
                            </Text>
                          </View>

                          {!n.read && <View style={[styles.dot, { backgroundColor: colors.brand }]} />}
                        </View>

                          <View style={styles.cardFoot}>
                          <Text variant="caption" tone="muted">
                            {meta.label}
                          </Text>
                          <Text variant="caption" tone="muted">
                            ·
                          </Text>
                          <Text variant="caption" tone="muted">
                            {n.time}
                          </Text>
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

      {/* Detail sheet */}
      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <View style={{ gap: Spacing.base }}>
            <View style={styles.sheetMeta}>
              <Text variant="caption" tone="secondary">
                {META[selected.kind].label} · {selected.time}
              </Text>
              {related && <StatusPill status={related.status} size="sm" />}
            </View>

            <Divider />

            <Text variant="body" tone="secondary">
              {selected.body}
            </Text>

            {related && (
              <Card variant="filled">
                <View style={{ gap: Spacing.xs }}>
                  <Text variant="caption" tone="muted">
                    {related.reference}
                  </Text>
                  <Text variant="bodyStrong">{related.buyer.name}</Text>
                  <Text variant="caption" tone="secondary">
                    {related.address.line}, {related.address.city}
                  </Text>
                </View>
              </Card>
            )}

            {related && (
              <Button
                label="Open order"
                icon="arrow-forward"
                iconPosition="right"
                onPress={() => {
                  const id = related.id;
                  setSelected(null);
                  router.push(`/order/${id}`);
                }}
              />
            )}

            <Button
              label="Remove notification"
              variant="outline"
              size="md"
              onPress={() => {
                removeNotification(selected.id);
                setSelected(null);
                toast.show('Notification removed');
              }}
            />
          </View>
        )}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.base },
  list: { gap: Spacing.md },
  card: { gap: Spacing.md, borderRadius: Radius.lg },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconWell: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 999, marginTop: 6 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
});

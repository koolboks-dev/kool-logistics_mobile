/**
 * Realtime updates over socket.io (path `/api/v1/socket.io` on the API origin).
 *
 *   - WebSocket transport only (React Native has no XHR long-polling upgrade
 *     story worth having), handshake `auth: { token: <access JWT> }`.
 *   - The token is read fresh on every (re)connect. When the server rejects it
 *     (`token_invalid` / `unauthorized`) the session is refreshed; any token
 *     change (refresh here or in the HTTP layer) reconnects with the new token.
 *   - On every (re)connect, and when the app returns to the foreground, the
 *     RTK Query caches are refreshed so nothing missed while offline is lost.
 *
 * Events:
 *   - `notification:new`  → refresh notification queries + heads-up banner
 *   - `notification:read` → refresh notification queries (other devices)
 *   - `delivery:update`   → refresh delivery caches; banner on a new
 *     assignment, a reassignment away from this rider, or a cancellation
 *     (deduplicated against the matching `notification:new`).
 *   - `deliveries:changed` → ids-only "something changed" for this rider's
 *     deliveries: refetch the delivery lists and the touched deliveries.
 *
 * Socket only — no push service and no polling. Coming back to the
 * foreground reconnects and refetches, so nothing missed while the app was
 * in the background is lost.
 */
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { io, type Socket } from 'socket.io-client';

import { InAppBanner, type InAppBannerItem } from '@/components/ui/InAppBanner';
import { API_ORIGIN, SOCKET_PATH } from '@/lib/api-config';
import { onTokensChange, readStoredTokens } from '@/lib/token-storage';
import { baseApi, refreshSession } from './base-api';
import { useAppDispatch } from './hooks';
import { notificationDeliveryId, notificationsApi, type AppNotification } from './notifications-api';
import { useSession } from './session';

type DeliveryUpdateEvent = {
  delivery_id: string;
  order_id: string | null;
  order_number: string;
  kind: 'created' | 'status' | 'assignment' | 'location' | 'exception' | 'code';
  status: string;
  status_display: string;
  rider?: { id: string; name: string; phone: string } | null;
  at: string;
  /** Present ('freezer') on freezer deployments (Task 9). */
  delivery_type?: string;
};

type NotificationNewEvent = {
  notification: AppNotification;
  unread_count?: number;
};

type Banner = InAppBannerItem & { link: Href; notificationId?: string };

type RealtimeContextValue = {
  /** Live socket connected — screens poll as a fallback while it is not. */
  connected: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({ connected: false });

const BANNER_MS = 6000;
const DEDUPE_MS = 8000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { status, user, mustChangePassword } = useSession();
  const userId = user?.id ?? null;
  const enabled = status === 'signedIn' && !mustChangePassword;

  const [connected, setConnected] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** delivery_id → when a banner about it was last shown. */
  const recent = useRef(new Map<string, number>());

  const dismissBanner = useCallback(() => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner(null);
  }, []);

  const showBanner = useCallback((item: Banner, deliveryId?: string | null) => {
    if (deliveryId) recent.current.set(deliveryId, Date.now());
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner(item);
    bannerTimer.current = setTimeout(() => setBanner(null), BANNER_MS);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const refreshAll = () =>
      dispatch(baseApi.util.invalidateTags(['Notifications', 'RiderMe', 'Deliveries', 'Delivery']));

    const socket: Socket = io(API_ORIGIN, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      // A function so every reconnect uses the current access token.
      auth: (cb) => cb({ token: readStoredTokens()?.access ?? '' }),
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      timeout: 15000,
    });

    let refreshing = false;
    let lastDisconnectedAt = 0;
    let lastRefreshAttempt = 0;

    socket.on('connect', () => {
      setConnected(true);
      const wasDisconnectedFor = Date.now() - lastDisconnectedAt;
      // Only refresh all queries if we were disconnected for more than 15 seconds
      // to avoid infinite re-render loops on rapid reconnects or token refreshes.
      if (lastDisconnectedAt > 0 && wasDisconnectedFor > 15_000) {
        refreshAll();
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      lastDisconnectedAt = Date.now();
    });

    socket.on('connect_error', async (err: Error) => {
      setConnected(false);
      lastDisconnectedAt = Date.now();
      const now = Date.now();
      // Throttle refreshSession to at most once every 10 seconds to avoid infinite loops.
      if (
        (err.message === 'token_invalid' || err.message === 'unauthorized') &&
        !refreshing &&
        now - lastRefreshAttempt > 10_000
      ) {
        lastRefreshAttempt = now;
        refreshing = true;
        const ok = await refreshSession();
        refreshing = false;
        if (ok && !socket.connected) socket.connect();
      }
    });

    socket.on('notification:new', (payload: NotificationNewEvent) => {
      dispatch(baseApi.util.invalidateTags(['Notifications']));
      const n = payload?.notification;
      if (!n) return;
      const deliveryId = notificationDeliveryId(n);
      if (deliveryId) {
        dispatch(
          baseApi.util.invalidateTags([
            { type: 'Delivery', id: deliveryId },
            { type: 'Deliveries', id: 'ACTIVE' },
            { type: 'Deliveries', id: 'DONE' },
            'RiderMe',
          ]),
        );
      }
      const kind = typeof n.metadata?.kind === 'string' ? n.metadata.kind : '';
      const bad = kind === 'delivery_cancelled' || kind === 'delivery_unassigned';
      Haptics.notificationAsync(
        bad ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      showBanner(
        {
          id: n.id || `n-${Date.now()}`,
          title: n.title,
          message: n.message,
          icon: bad
            ? 'alert-circle-outline'
            : n.metadata?.delivery_type === 'freezer'
              ? 'snow-outline'
              : kind === 'delivery_assigned'
                ? 'bicycle-outline'
                : 'notifications-outline',
          tone: bad ? 'danger' : n.metadata?.delivery_type === 'freezer' ? 'info' : 'brand',
          actionLabel: deliveryId && !bad ? 'View delivery' : 'Open',
          // Unassigned/cancelled deliveries are no longer viewable by this rider.
          link: deliveryId && !bad ? `/order/${deliveryId}` : '/alerts',
          notificationId: n.id,
        },
        deliveryId,
      );
    });

    socket.on('deliveries:changed', (p: { ids?: string[] }) => {
      const ids = Array.isArray(p?.ids) ? p.ids : [];
      dispatch(
        baseApi.util.invalidateTags([
          ...ids.map((id) => ({ type: 'Delivery' as const, id })),
          { type: 'Deliveries', id: 'ACTIVE' },
          { type: 'Deliveries', id: 'DONE' },
          'RiderMe',
        ]),
      );
    });

    socket.on('notification:read', () => {
      dispatch(baseApi.util.invalidateTags(['Notifications']));
    });

    socket.on('delivery:update', (p: DeliveryUpdateEvent) => {
      if (!p?.delivery_id) return;
      // Our own location pings echo back as `location` — nothing to refresh.
      if (p.kind === 'location') return;
      const id = p.delivery_id;
      dispatch(
        baseApi.util.invalidateTags([
          { type: 'Delivery', id },
          { type: 'Deliveries', id: 'ACTIVE' },
          { type: 'Deliveries', id: 'DONE' },
          'RiderMe',
        ]),
      );

      const mine = p.rider?.id != null && p.rider.id === userId;
      let alert: Banner | null = null;
      const freezer = p.delivery_type === 'freezer';
      const ref = freezer ? 'a freezer deployment' : p.order_number ? `order #${p.order_number}` : 'a delivery';
      if (p.status === 'cancelled') {
        alert = { id: `c-${id}`, title: freezer ? 'Freezer deployment cancelled' : 'Delivery cancelled', message: `Dispatch cancelled ${ref}.`, tone: 'danger', icon: 'close-circle-outline', actionLabel: 'See deliveries', link: '/(tabs)/orders' };
      } else if (p.kind === 'assignment' && mine && p.status === 'assigned') {
        alert = freezer
          ? { id: `a-${id}`, title: 'Freezer deployment assigned', message: 'Collect the freezer from the depot and install it at the retailer.', tone: 'info', icon: 'snow-outline', actionLabel: 'View delivery', link: `/order/${id}` }
          : { id: `a-${id}`, title: 'New delivery assigned', message: `Pick up ${ref}.`, tone: 'brand', icon: 'bicycle-outline', actionLabel: 'View delivery', link: `/order/${id}` };
      } else if (p.kind === 'assignment' && !mine) {
        alert = { id: `u-${id}`, title: 'Delivery reassigned', message: `${ref[0].toUpperCase()}${ref.slice(1)} is no longer assigned to you.`, tone: 'danger', icon: 'swap-horizontal-outline', link: '/(tabs)/orders' };
      }
      if (!alert) return;
      const banner = alert;
      // The backend usually sends a notification:new for the same event; wait a
      // moment and only alert if it did not.
      setTimeout(() => {
        const last = recent.current.get(id) ?? 0;
        if (Date.now() - last < DEDUPE_MS) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        showBanner(banner, id);
      }, 1500);
    });

    // New access token (refreshed here or by an HTTP 401) → connect if not connected.
    const unsubTokens = onTokensChange((tokens) => {
      if (tokens?.access && !socket.connected) {
        socket.connect();
      }
    });

    // Back from the background: make sure the socket is up and data is fresh.
    const appSub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      if (!socket.connected) socket.connect();
      else refreshAll();
    });

    return () => {
      unsubTokens();
      appSub.remove();
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [enabled, userId, dispatch, showBanner]);

  const onBannerPress = () => {
    const b = banner;
    dismissBanner();
    if (!b) return;
    if (b.notificationId) {
      dispatch(notificationsApi.endpoints.markNotificationRead.initiate(b.notificationId)).catch(() => {});
    }
    router.push(b.link);
  };

  return (
    <RealtimeContext.Provider value={{ connected: enabled && connected }}>
      {children}
      <InAppBanner item={banner} onDismiss={dismissBanner} onPress={onBannerPress} durationMs={BANNER_MS} />
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

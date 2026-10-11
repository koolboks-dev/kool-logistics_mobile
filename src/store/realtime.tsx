/**
 * Realtime updates over socket.io (`/api/v1/socket.io`).
 *
 * Connects directly to the API origin via WebSocket transport with the rider's
 * access token in `auth.token`. When a token expires, refreshes the token and
 * reconnects.
 *
 * Listens to:
 *   - `notification:new`: refreshes notifications query, shows heads-up banner
 *   - `delivery:update`: invalidates delivery and rider caches, alerts rider
 *     on new assignment or cancellation
 */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

import { InAppBanner, type InAppBannerItem } from '@/components/ui/InAppBanner';
import { API_ORIGIN, SOCKET_PATH } from '@/lib/api-config';
import { onTokensChange, readStoredTokens } from '@/lib/token-storage';
import { refreshSession } from './base-api';
import { useAppDispatch } from './hooks';
import { notificationsApi, type AppNotification } from './notifications-api';
import { riderApi } from './rider-api';
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
};

type NotificationNewEvent = {
  notification: AppNotification;
  unread_count?: number;
};

type RealtimeContextValue = {
  connected: boolean;
  banner: InAppBannerItem | null;
  dismissBanner: () => void;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  banner: null,
  dismissBanner: () => {},
});

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status, user } = useSession();

  const [connected, setConnected] = useState(false);
  const [banner, setBanner] = useState<InAppBannerItem | null>(null);
  const [bannerLink, setBannerLink] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = (item: InAppBannerItem, link?: string | null) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner(item);
    setBannerLink(link ?? null);
    bannerTimer.current = setTimeout(() => {
      setBanner(null);
      setBannerLink(null);
    }, 6000);
  };

  const dismissBanner = () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBanner(null);
    setBannerLink(null);
  };

  const onBannerPress = () => {
    const link = bannerLink;
    dismissBanner();
    if (link) router.push(link as any);
  };

  useEffect(() => {
    if (status !== 'signedIn') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const connect = () => {
      const tokens = readStoredTokens();
      const token = tokens?.access;
      if (!token) return;

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io(API_ORIGIN, {
        path: SOCKET_PATH,
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        setConnected(true);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      socket.on('connect_error', async (err: Error) => {
        setConnected(false);
        if (err.message === 'token_invalid' || err.message === 'unauthorized') {
          const refreshed = await refreshSession();
          if (refreshed) {
            connect();
          }
        }
      });

      socket.on('notification:new', (payload: NotificationNewEvent) => {
        dispatch(notificationsApi.util.invalidateTags(['Notifications']));
        const n = payload?.notification;
        if (!n) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const deliveryId = n.metadata?.delivery_id;
        const link = typeof deliveryId === 'string' && deliveryId ? `/order/${deliveryId}` : '/alerts';
        showBanner(
          {
            id: n.id || String(Date.now()),
            title: n.title,
            message: n.message,
            icon: 'notifications-outline',
            tone: 'brand',
          },
          link,
        );
      });

      socket.on('delivery:update', (payload: DeliveryUpdateEvent) => {
        if (!payload?.delivery_id) return;
        const dId = payload.delivery_id;
        dispatch(
          riderApi.util.invalidateTags([
            { type: 'Delivery', id: dId },
            { type: 'Deliveries', id: 'ACTIVE' },
            { type: 'Deliveries', id: 'DONE' },
            'RiderMe',
          ]),
        );

        if (payload.kind === 'assignment') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          showBanner(
            {
              id: `assign-${dId}-${Date.now()}`,
              title: `New delivery assigned`,
              message: `Order #${payload.order_number} is ready for collection.`,
              icon: 'bicycle-outline',
              tone: 'brand',
            },
            `/order/${dId}`,
          );
        } else if (payload.status === 'cancelled' || payload.kind === 'exception') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          showBanner(
            {
              id: `cancel-${dId}-${Date.now()}`,
              title: `Delivery update: Order #${payload.order_number}`,
              message: payload.status_display || 'Order has been updated.',
              icon: 'alert-circle-outline',
              tone: 'danger',
            },
            `/order/${dId}`,
          );
        }
      });

      socketRef.current = socket;
    };

    connect();

    const unsub = onTokensChange((tokens) => {
      if (tokens?.access && socketRef.current) {
        socketRef.current.auth = { token: tokens.access };
        socketRef.current.disconnect().connect();
      }
    });

    return () => {
      unsub();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
    };
  }, [status, dispatch, user?.id]);

  return (
    <RealtimeContext.Provider value={{ connected, banner, dismissBanner }}>
      {children}
      <InAppBanner item={banner} onDismiss={dismissBanner} onPress={onBannerPress} />
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { NOTIFICATIONS, ORDERS, type AppNotification, type Order } from '@/data/orders';
import type { DeliveryStatus } from '@/components/ui';

type Rider = { id: string; name: string; hub: string };

type AppState = {
  rider: Rider | null;
  signIn: (email: string) => void;
  signOut: () => void;

  orders: Order[];
  setOrderStatus: (id: string, status: DeliveryStatus) => void;

  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  removeNotification: (id: string) => void;
};

const AppContext = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: ReactNode }) {
  const [rider, setRider] = useState<Rider | null>(null);
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(NOTIFICATIONS);

  const signIn = useCallback((email: string) => {
    setRider({ id: email, name: 'Chinedu Godwin', hub: 'Lagos · Ikeja Hub' });
  }, []);

  const signOut = useCallback(() => setRider(null), []);

  const setOrderStatus = useCallback((id: string, status: DeliveryStatus) => {
    setOrders((cur) =>
      cur.map((o) => {
        if (o.id !== id) return o;
        const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeline = o.timeline.map((s) =>
          s.state === 'current' ? { ...s, state: 'done' as const } : s,
        );
        timeline.push({
          title: status === 'delivered' ? 'Delivered' : 'Cancelled',
          description: status === 'delivered' ? 'Confirmed by rider' : 'Marked cancelled by rider',
          timestamp: stamp,
          state: status === 'delivered' ? ('done' as const) : ('failed' as const),
        });
        return { ...o, status, timeline };
      }),
    );
  }, []);

  const markAllRead = useCallback(
    () => setNotifications((cur) => cur.map((n) => ({ ...n, read: true }))),
    [],
  );

  const markRead = useCallback(
    (id: string) =>
      setNotifications((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n))),
    [],
  );

  const removeNotification = useCallback(
    (id: string) => setNotifications((cur) => cur.filter((n) => n.id !== id)),
    [],
  );

  const value = useMemo<AppState>(
    () => ({
      rider,
      signIn,
      signOut,
      orders,
      setOrderStatus,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      markAllRead,
      markRead,
      removeNotification,
    }),
    [rider, signIn, signOut, orders, setOrderStatus, notifications, markAllRead, markRead, removeNotification],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

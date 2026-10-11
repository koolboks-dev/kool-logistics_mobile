/**
 * In-app notifications (the same REST endpoints Kool Konnect uses). New ones
 * also arrive live over socket.io (`notification:new`, see realtime.tsx), which
 * invalidates these queries.
 */
import { baseApi } from './base-api';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type NotificationPage = {
  items: AppNotification[];
  unread_count: number;
  pagination: { total: number; page: number; page_size: number; has_next: boolean; has_prev: boolean };
};

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    notifications: build.query<NotificationPage, { pageSize: number }>({
      query: ({ pageSize }) => `/users/notifications/?page=1&page_size=${pageSize}`,
      providesTags: ['Notifications'],
    }),
    unreadCount: build.query<number, void>({
      query: () => '/users/notifications/?page=1&page_size=1',
      transformResponse: (res: { unread_count?: number }) => res.unread_count ?? 0,
      providesTags: ['Notifications'],
    }),
    markNotificationRead: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/users/notifications/${encodeURIComponent(id)}/read/`, method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: build.mutation<{ success: boolean; unread_count: number }, void>({
      query: () => ({ url: '/users/notifications/read-all/', method: 'POST', body: {} }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;

/** The delivery a notification refers to, when its metadata names one. */
export function notificationDeliveryId(n: Pick<AppNotification, 'metadata'> | null | undefined): string | null {
  const id = n?.metadata?.delivery_id;
  return typeof id === 'string' && id ? id : null;
}

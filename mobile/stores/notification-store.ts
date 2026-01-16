import { create } from 'zustand';

import { apiDelete, apiGet, apiPost } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/constants';

import type { Notification } from '@/types/entities';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;

  // Actions
  fetchNotifications: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
  reset: () => void;
}

const PAGE_SIZE = 20;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  page: 1,
  error: null,

  // Fetch notifications
  fetchNotifications: async (refresh = false) => {
    const currentPage = refresh ? 1 : get().page;

    set({
      isLoading: refresh || currentPage === 1,
      error: null,
    });

    try {
      const response = await apiGet<{
        notifications: Notification[];
        unread_count: number;
        has_more: boolean;
      }>(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { page: currentPage, limit: PAGE_SIZE },
      });

      const { notifications: newNotifications, unread_count, has_more } = response.data;

      set((state) => ({
        notifications: refresh ? newNotifications : [...state.notifications, ...newNotifications],
        unreadCount: unread_count,
        hasMore: has_more,
        page: currentPage,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      });
    }
  },

  // Load more notifications
  loadMore: async () => {
    const { hasMore, isLoadingMore, page } = get();

    if (!hasMore || isLoadingMore) {
      return;
    }

    set({ isLoadingMore: true });

    try {
      const nextPage = page + 1;
      const response = await apiGet<{
        notifications: Notification[];
        unread_count: number;
        has_more: boolean;
      }>(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      const { notifications: newNotifications, has_more } = response.data;

      set((state) => ({
        notifications: [...state.notifications, ...newNotifications],
        hasMore: has_more,
        page: nextPage,
        isLoadingMore: false,
      }));
    } catch (error) {
      set({
        isLoadingMore: false,
        error: error instanceof Error ? error.message : 'Failed to load more notifications',
      });
    }
  },

  // Mark single notification as read
  markAsRead: async (id: string) => {
    try {
      await apiPost(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      });
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      await apiPost(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to mark all as read',
      });
    }
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    try {
      await apiDelete(ENDPOINTS.NOTIFICATIONS.DELETE(id));

      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.read_at;

        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete notification',
      });
    }
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    try {
      await apiDelete(ENDPOINTS.NOTIFICATIONS.DELETE_ALL);

      set({
        notifications: [],
        unreadCount: 0,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete all notifications',
      });
    }
  },

  // Add new notification (from push/websocket)
  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Reset store
  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      page: 1,
      error: null,
    });
  },
}));

// Selector hooks
export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useUnreadNotifications = () =>
  useNotificationStore((state) => state.notifications.filter((n) => !n.read_at));
export const useNotificationLoading = () => useNotificationStore((state) => state.isLoading);

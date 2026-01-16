import { apiGet, apiPost, apiDelete, apiPatch } from './client';
import { ENDPOINTS } from '../constants';

import type { Notification } from '@/types/entities';

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsApi = {
  /**
   * Get notifications list with pagination
   */
  list: async (params?: { page?: number; limit?: number }): Promise<NotificationsResponse> => {
    try {
      const response = await apiGet<NotificationsResponse>(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { page: params?.page || 1, limit: params?.limit || 20 },
      });

      // Handle different response formats from backend
      const data = response.data as any;

      // Normalize response
      let notifications: Notification[] = [];
      if (Array.isArray(data)) {
        notifications = data;
      } else if (data?.notifications) {
        notifications = data.notifications;
      } else if (data?.data) {
        notifications = data.data;
      }

      // Map to consistent format
      const normalizedNotifications = notifications.map((n: any) => ({
        id: n.id,
        tenant_id: n.tenantId || n.tenant_id,
        user_id: n.userId || n.user_id,
        type: n.type,
        title: n.title,
        message: n.message || n.body,
        data: n.data || n.metadata,
        read_at: n.readAt || n.read_at || (n.isRead ? new Date().toISOString() : null),
        action_url: n.actionUrl || n.action_url,
        action_label: n.actionLabel || n.action_label,
        created_at: n.createdAt || n.created_at || new Date().toISOString(),
      }));

      return {
        notifications: normalizedNotifications,
        unread_count:
          data?.unread_count ||
          data?.unreadCount ||
          normalizedNotifications.filter((n: any) => !n.read_at).length,
        total: data?.total || normalizedNotifications.length,
        page: data?.page || params?.page || 1,
        limit: data?.limit || params?.limit || 20,
        has_more:
          data?.has_more ??
          data?.hasMore ??
          normalizedNotifications.length >= (params?.limit || 20),
      };
    } catch (error: any) {
      // Gracefully handle API not available
      if (error?.status === 404 || error?.status === 503) {
        console.log('[Notifications API] Service not available');
        return {
          notifications: [],
          unread_count: 0,
          total: 0,
          page: 1,
          limit: 20,
          has_more: false,
        };
      }
      throw error;
    }
  },

  /**
   * Get unread count only (lightweight polling)
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      // Try dedicated unread-count endpoint first
      const response = await apiGet<UnreadCountResponse>(
        `${ENDPOINTS.NOTIFICATIONS.LIST}/unread-count`
      );
      return response.data?.count || 0;
    } catch {
      // Fallback to list endpoint
      try {
        const listResponse = await notificationsApi.list({ page: 1, limit: 1 });
        return listResponse.unread_count;
      } catch {
        return 0;
      }
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiPatch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {});
    } catch (error: any) {
      console.log('[Notifications API] Mark as read failed:', error?.message);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    try {
      await apiPost(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});
    } catch (error: any) {
      console.log('[Notifications API] Mark all as read failed:', error?.message);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiDelete(ENDPOINTS.NOTIFICATIONS.DELETE(id));
    } catch (error: any) {
      console.log('[Notifications API] Delete failed:', error?.message);
      throw error;
    }
  },

  /**
   * Delete all notifications
   */
  deleteAll: async (): Promise<void> => {
    try {
      await apiDelete(ENDPOINTS.NOTIFICATIONS.DELETE_ALL);
    } catch (error: any) {
      console.log('[Notifications API] Delete all failed:', error?.message);
      throw error;
    }
  },

  /**
   * Register device for push notifications
   */
  registerDevice: async (token: string, platform: 'ios' | 'android'): Promise<void> => {
    try {
      await apiPost(ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE, {
        token,
        platform,
        device_type: platform,
      });
      console.log('[Notifications API] Device registered for push notifications');
    } catch (error: any) {
      console.log('[Notifications API] Device registration failed:', error?.message);
      // Don't throw - push registration failure shouldn't break the app
    }
  },
};

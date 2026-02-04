'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  icon?: string;
  actionUrl?: string;
  sourceService: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  groupKey?: string;
  isRead: boolean;
  readAt?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  expiresAt?: string;
}

interface WebSocketMessage {
  type: 'notification' | 'unread_count' | 'pong' | 'error';
  data: Notification | { count: number } | { message: string };
}

interface UseNotificationsOptions {
  autoConnect?: boolean;
  enableSound?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoConnect = true, enableSound = true } = options;
  const { tenant } = useTenant();
  const { customer, isAuthenticated } = useAuthStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (enableSound && typeof window !== 'undefined') {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Audio play failed - user hasn't interacted with page yet
        });
      } catch {
        // Audio not supported
      }
    }
  }, [enableSound]);

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!tenant?.id || !isAuthenticated || !customer?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=20', {
        headers: {
          'X-Tenant-ID': tenant.id,
          'X-User-ID': customer.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, isAuthenticated, customer?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!tenant?.id || !isAuthenticated || !customer?.id) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'X-Tenant-ID': tenant.id,
          'X-User-ID': customer.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [tenant?.id, isAuthenticated, customer?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!tenant?.id || !customer?.id) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'X-Tenant-ID': tenant.id,
          'X-User-ID': customer.id,
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Also send via WebSocket if connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'mark_read',
            data: { notification_ids: [notificationId] },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [tenant?.id, customer?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!tenant?.id || !customer?.id) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenant.id,
          'X-User-ID': customer.id,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        // Also send via WebSocket if connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'mark_all_read' }));
        }
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [tenant?.id, customer?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!tenant?.id || !customer?.id) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenant.id,
          'X-User-ID': customer.id,
        },
      });

      if (response.ok) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [tenant?.id, customer?.id, notifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!tenant?.id || !customer?.id) return;

    try {
      const response = await fetch('/api/notifications/delete-all', {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenant.id,
          'X-User-ID': customer.id,
        },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  }, [tenant?.id, customer?.id]);

  // Get a short-lived ticket from auth-bff for WebSocket authentication
  const getWsTicket = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/auth/ws-ticket', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('[Notifications] Failed to get WS ticket:', response.status);
        return null;
      }

      const data = await response.json();
      return data.ticket;
    } catch (err) {
      console.error('[Notifications] Error getting WS ticket:', err);
      return null;
    }
  }, []);

  // Connect to WebSocket (using ticket-based auth)
  const connect = useCallback(async () => {
    if (!tenant?.id || !isAuthenticated || !customer?.id || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Get a short-lived ticket for WebSocket authentication
    const ticket = await getWsTicket();
    if (!ticket) {
      setError('Not authenticated');
      return;
    }

    // Build WebSocket URL using API gateway (not storefront host)
    // Storefront host: demo-store.mark8ly.app -> API host: demo-store-api.mark8ly.app
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const storefrontHost = window.location.host;
    // Convert storefront host to API host by adding '-api' before the domain
    // e.g., demo-store.mark8ly.app -> demo-store-api.mark8ly.app
    const hostParts = storefrontHost.split('.');
    const apiHost = hostParts.length >= 2
      ? `${hostParts[0]}-api.${hostParts.slice(1).join('.')}`
      : storefrontHost;
    const wsUrl = `${protocol}//${apiHost}/api/v1/notifications/ws?ticket=${encodeURIComponent(ticket)}&tenant_id=${encodeURIComponent(tenant.id)}&user_id=${encodeURIComponent(customer.id)}`;

    console.log('[Notifications] Connecting to WebSocket with ticket');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Notifications] WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start ping interval to keep connection alive
        // PERFORMANCE: 45 seconds is optimal - under 60s load balancer timeout but reduces traffic
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 45000); // 45 seconds - stays under 60s timeouts while reducing traffic
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'notification':
              const newNotification = message.data as Notification;
              setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
              if (!newNotification.isRead) {
                setUnreadCount(prev => prev + 1);
                playNotificationSound();
              }
              break;

            case 'unread_count':
              const countData = message.data as { count: number };
              setUnreadCount(countData.count);
              break;

            case 'pong':
              // Heartbeat response - connection is alive
              break;

            case 'error':
              const errorData = message.data as { message: string };
              console.error('[Notifications] WebSocket error:', errorData.message);
              setError(errorData.message);
              break;
          }
        } catch (err) {
          console.error('[Notifications] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[Notifications] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('[Notifications] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          console.log(`[Notifications] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('[Notifications] Failed to create WebSocket:', err);
      setError('Failed to connect');
    }
  }, [tenant?.id, isAuthenticated, customer?.id, playNotificationSound, getWsTicket]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Auto-connect and fetch on mount
  useEffect(() => {
    if (tenant?.id && isAuthenticated && customer?.id) {
      fetchNotifications();
      if (autoConnect) {
        connect();
      }
    }

    return () => {
      disconnect();
    };
  }, [tenant?.id, isAuthenticated, customer?.id, autoConnect, fetchNotifications, connect, disconnect]);

  // Refresh notifications
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
    connect,
    disconnect,
  };
}

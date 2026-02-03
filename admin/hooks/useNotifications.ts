'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { WEBSOCKET_CONFIG, NOTIFICATION_CONFIG, IDLE_CONFIG } from '@/lib/polling/config';

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
  type: 'notification' | 'unread_count' | 'pong' | 'error' | 'connected';
  data: Notification | { count: number } | { message: string };
}

interface UseNotificationsOptions {
  autoConnect?: boolean;
  enableSound?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoConnect = true, enableSound = true } = options;
  const { currentTenant } = useTenant();
  const { user } = useUser();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = WEBSOCKET_CONFIG.MAX_RECONNECT_ATTEMPTS;
  const isConnectingRef = useRef(false);
  const [usePollingFallback, setUsePollingFallback] = useState(false);
  const isIdleRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Play notification sound using Web Audio API (no MP3 needed)
  const playNotificationSound = useCallback(() => {
    if (enableSound && typeof window !== 'undefined') {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Create a pleasant notification sound (two-tone)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch {
        // Audio not supported or user hasn't interacted with page yet
      }
    }
  }, [enableSound]);

  // Fetch notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications?limit=20', {
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
          'x-jwt-claim-sub': user.id,
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
  }, [currentTenant?.id, user?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
          'x-jwt-claim-sub': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [currentTenant?.id, user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
          'x-jwt-claim-sub': user.id,
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
  }, [currentTenant?.id, user?.id]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
          'x-jwt-claim-sub': user.id,
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
  }, [currentTenant?.id, user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
          'x-jwt-claim-sub': user.id,
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
  }, [currentTenant?.id, user?.id, notifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return;

    try {
      const response = await fetch('/api/notifications/delete-all', {
        method: 'DELETE',
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
          'x-jwt-claim-sub': user.id,
        },
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  }, [currentTenant?.id, user?.id]);

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

  // Connect to WebSocket (production-grade, using ticket-based auth)
  const connect = useCallback(async () => {
    // Prevent duplicate connection attempts
    if (!currentTenant?.id || !user?.id) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING ||
        isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    // Get a short-lived ticket for WebSocket authentication
    const ticket = await getWsTicket();
    if (!ticket) {
      setError('Not authenticated');
      isConnectingRef.current = false;
      return;
    }

    // Build WebSocket URL using API gateway (not admin host)
    // Supports multiple domain patterns:
    // 1. admin.example.com -> api.example.com
    // 2. example-admin.tesserix.app -> example-api.tesserix.app
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const adminHost = window.location.host;

    let apiHost: string;
    if (adminHost.startsWith('admin.')) {
      // Pattern: admin.example.com -> api.example.com
      apiHost = adminHost.replace(/^admin\./, 'api.');
    } else if (adminHost.includes('-admin.')) {
      // Pattern: example-admin.tesserix.app -> example-api.tesserix.app
      apiHost = adminHost.replace('-admin.', '-api.');
    } else {
      // Fallback: use admin host as-is (for local dev)
      apiHost = adminHost;
    }

    const wsPath = '/api/v1/notifications/ws';
    // Use ticket-based auth instead of raw tokens
    const wsUrl = `${protocol}//${apiHost}${wsPath}?ticket=${encodeURIComponent(ticket)}&tenant_id=${encodeURIComponent(currentTenant.id)}&user_id=${encodeURIComponent(user.id)}`;

    console.log('[Notifications] Connecting to WebSocket:', apiHost, 'with ticket');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Notifications] WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;

        // Start ping interval to keep connection alive
        // ENTERPRISE: Configurable via WEBSOCKET_CONFIG, pauses when idle
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN && !isIdleRef.current && isOnlineRef.current) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, WEBSOCKET_CONFIG.PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        // Server may batch multiple JSON messages with newlines (NDJSON)
        const rawData = event.data as string;
        const lines = rawData.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const message: WebSocketMessage = JSON.parse(line);

            switch (message.type) {
              case 'notification':
                const newNotification = message.data as Notification;
                setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
                if (!newNotification.isRead) {
                  setUnreadCount(prev => prev + 1);
                  playNotificationSound();
                  // Trigger bell animation
                  setHasNewNotification(true);
                  setTimeout(() => setHasNewNotification(false), 3000); // Reset after 3s
                }
                break;

              case 'unread_count':
                const countData = message.data as { count: number };
                setUnreadCount(countData.count);
                break;

              case 'pong':
              case 'connected':
                // Heartbeat response or connection confirmation - connection is alive
                console.log('[Notifications] Received:', message.type);
                break;

              case 'error':
                const errorData = message.data as { message: string };
                console.error('[Notifications] WebSocket error:', errorData.message);
                setError(errorData.message);
                break;
            }
          } catch (err) {
            console.error('[Notifications] Failed to parse message line:', line, err);
          }
        }
      };

      ws.onerror = (event) => {
        console.warn('[Notifications] WebSocket error:', event);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log('[Notifications] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        isConnectingRef.current = false;

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // ENTERPRISE: Reconnect with exponential backoff using configurable values
        // 1000=normal close, 1001=going away (page unload)
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttemptsRef.current < maxReconnectAttempts && isOnlineRef.current) {
          const delay = Math.min(
            WEBSOCKET_CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            WEBSOCKET_CONFIG.RECONNECT_MAX_DELAY
          );
          reconnectAttemptsRef.current++;

          console.log(`[Notifications] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('[Notifications] Max reconnection attempts reached');
          setError('Connection failed. Please refresh the page.');
        }
      };
    } catch (err) {
      console.error('[Notifications] Failed to create WebSocket:', err);
      isConnectingRef.current = false;
      setError('Failed to connect to notifications');
    }
  }, [currentTenant?.id, user?.id, playNotificationSound, getWsTicket]);

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

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    setIsConnected(false);
    setUsePollingFallback(false);
  }, []);

  // Auto-connect and fetch on mount
  useEffect(() => {
    if (currentTenant?.id && user?.id) {
      fetchNotifications();
      if (autoConnect) {
        connect();
      }
    }

    return () => {
      disconnect();
    };
  }, [currentTenant?.id, user?.id, autoConnect, fetchNotifications, connect, disconnect]);

  // ENTERPRISE: Fallback to polling if WebSocket fails to connect
  useEffect(() => {
    if (!currentTenant?.id || !user?.id) return;

    // If WebSocket is not connected after configured timeout, enable polling fallback
    const fallbackTimeout = setTimeout(() => {
      if (!isConnected && !usePollingFallback && NOTIFICATION_CONFIG.ENABLE_FALLBACK) {
        console.log(`[Notifications] WebSocket not connected after ${WEBSOCKET_CONFIG.FALLBACK_TIMEOUT}ms, enabling polling fallback`);
        setUsePollingFallback(true);
      }
    }, WEBSOCKET_CONFIG.FALLBACK_TIMEOUT);

    return () => clearTimeout(fallbackTimeout);
  }, [currentTenant?.id, user?.id, isConnected, usePollingFallback]);

  // ENTERPRISE: Polling fallback with configurable interval, pauses when idle/offline
  useEffect(() => {
    if (usePollingFallback && !isConnected && currentTenant?.id && user?.id) {
      console.log(`[Notifications] Starting polling fallback (every ${NOTIFICATION_CONFIG.POLL_INTERVAL / 1000}s)`);

      // Poll immediately if online and not idle
      if (isOnlineRef.current && !isIdleRef.current) {
        fetchUnreadCount();
      }

      // Then poll at configured interval
      pollingIntervalRef.current = setInterval(() => {
        // Skip polling if offline or idle
        if (!isOnlineRef.current) {
          console.log('[Notifications] Skipping poll - offline');
          return;
        }
        if (isIdleRef.current) {
          console.log('[Notifications] Skipping poll - user idle');
          return;
        }
        fetchUnreadCount();
      }, NOTIFICATION_CONFIG.POLL_INTERVAL);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }

    // If WebSocket connects, stop polling
    if (isConnected && pollingIntervalRef.current) {
      console.log('[Notifications] WebSocket connected, stopping polling fallback');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setUsePollingFallback(false);
    }
  }, [usePollingFallback, isConnected, currentTenant?.id, user?.id, fetchUnreadCount]);

  // ENTERPRISE: Idle and network detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Idle detection
    const resetIdleTimer = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        console.log('[Notifications] User active');
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        console.log('[Notifications] User idle');
      }, IDLE_CONFIG.TIMEOUT);
    };

    // Network detection
    const handleOnline = () => {
      isOnlineRef.current = true;
      console.log('[Notifications] Network online');
      // Reconnect WebSocket if needed
      if (!isConnected && currentTenant?.id && user?.id) {
        connect();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      console.log('[Notifications] Network offline');
    };

    // Set up listeners
    IDLE_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial idle timer
    resetIdleTimer();

    return () => {
      IDLE_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isConnected, currentTenant?.id, user?.id, connect]);

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
    hasNewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
    connect,
    disconnect,
  };
}

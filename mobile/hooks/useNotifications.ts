import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { useAuthStore } from '@/stores/auth-store';
import { notificationsApi } from '@/lib/api/notifications';
import { QUERY_KEYS, STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/utils/secure-storage';

import type { Notification } from '@/types/entities';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UseNotificationsOptions {
  enablePolling?: boolean;
  pollingInterval?: number; // ms
  enablePush?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refresh: () => Promise<void>;
  registerPushNotifications: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    enablePolling = true,
    pollingInterval = 30000, // 30 seconds
    enablePush = true,
  } = options;

  const { currentTenant, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const queryKey = currentTenant
    ? QUERY_KEYS.NOTIFICATIONS(currentTenant.id)
    : ['notifications'];

  // Fetch notifications
  const {
    data,
    isLoading,
    refetch,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await notificationsApi.list({ page: 1, limit: 50 });
      return response;
    },
    enabled: !!currentTenant && !!user,
    staleTime: 30000, // 30 seconds
    retry: false,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onMutate: async (id: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          ),
          unread_count: Math.max(0, old.unread_count - 1),
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setError('Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n: Notification) => ({
            ...n,
            read_at: n.read_at || new Date().toISOString(),
          })),
          unread_count: 0,
        };
      });

      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setError('Failed to mark all as read');
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const notification = old.notifications.find((n: Notification) => n.id === id);
        const wasUnread = notification && !notification.read_at;

        return {
          ...old,
          notifications: old.notifications.filter((n: Notification) => n.id !== id),
          unread_count: wasUnread ? Math.max(0, old.unread_count - 1) : old.unread_count,
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setError('Failed to delete notification');
    },
  });

  // Delete all notifications mutation
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: notificationsApi.deleteAll,
    onSuccess: () => {
      queryClient.setQueryData(queryKey, {
        notifications: [],
        unread_count: 0,
        total: 0,
        page: 1,
        limit: 20,
        has_more: false,
      });
    },
    onError: () => {
      setError('Failed to delete all notifications');
    },
  });

  // Register for push notifications
  const registerPushNotifications = useCallback(async () => {
    if (!enablePush || !Device.isDevice) {
      console.log('[Notifications] Push notifications not available (simulator or disabled)');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Push permission denied');
        return;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '6416cfdc-bae9-4e6a-ad29-a460e2e93cf1',
      });
      const token = tokenData.data;

      // Store token locally
      await secureStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);

      // Register with backend
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await notificationsApi.registerDevice(token, platform);

      console.log('[Notifications] Push token registered:', token.substring(0, 20) + '...');
    } catch (error) {
      console.log('[Notifications] Push registration failed:', error);
    }
  }, [enablePush]);

  // Set up polling when app is active
  useEffect(() => {
    if (!enablePolling || !currentTenant || !user) return;

    // Start polling
    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        if (appStateRef.current === 'active') {
          refetch();
        }
      }, pollingInterval);
    };

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current !== 'active' && nextAppState === 'active') {
        // App became active - refresh immediately and start polling
        refetch();
        startPolling();
      } else if (nextAppState !== 'active') {
        // App went to background - stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial poll
    startPolling();

    return () => {
      subscription.remove();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enablePolling, currentTenant, user, pollingInterval, refetch]);

  // Set up push notification listeners
  useEffect(() => {
    if (!enablePush) return;

    // Handle notification received while app is open
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] Received:', notification);
      // Refresh notifications list
      refetch();
    });

    // Handle notification response (user tapped notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] Response:', response);
      // Navigation will be handled by the screen that displays notifications
      refetch();
    });

    // Register for push on mount
    registerPushNotifications();

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, [enablePush, registerPushNotifications, refetch]);

  // Set error from query
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'Failed to fetch notifications');
    }
  }, [queryError]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    deleteAllNotifications: deleteAllNotificationsMutation.mutateAsync,
    refresh: async () => { await refetch(); },
    registerPushNotifications,
  };
}

// Export unread count hook for notification badge
export function useUnreadNotificationCount(): number {
  const { currentTenant, user } = useAuthStore();

  const { data } = useQuery({
    queryKey: currentTenant
      ? [...QUERY_KEYS.NOTIFICATIONS(currentTenant.id), 'unread-count']
      : ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: !!currentTenant && !!user,
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });

  return data || 0;
}

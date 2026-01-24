'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePushNotifications, PushNotificationPayload } from '@/hooks/usePushNotifications';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';

interface NotificationToastItem {
  id: string;
  payload: PushNotificationPayload;
  timestamp: number;
}

export function NotificationToast() {
  const router = useRouter();
  const getNavPath = useNavPath();
  const { lastNotification, isEnabled } = usePushNotifications();
  const [notifications, setNotifications] = useState<NotificationToastItem[]>([]);

  // Add new notification when received
  useEffect(() => {
    if (!lastNotification || !isEnabled) return;

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationToastItem = {
      id,
      payload: lastNotification,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);

    return () => clearTimeout(timer);
  }, [lastNotification, isEnabled]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleClick = useCallback((notification: NotificationToastItem) => {
    const { data } = notification.payload;

    // Navigate based on notification type
    if (data?.orderId) {
      router.push(getNavPath(`/account/orders/${data.orderId}`));
    } else if (data?.ticketId) {
      router.push(getNavPath(`/account/tickets/${data.ticketId}`));
    }

    dismissNotification(notification.id);
  }, [router, getNavPath, dismissNotification]);

  const getIcon = (data?: Record<string, string>) => {
    const type = data?.type || data?.notificationType;

    switch (type) {
      case 'ORDER_CONFIRMED':
        return <Package className="h-5 w-5" />;
      case 'ORDER_SHIPPED':
      case 'ORDER_OUT_FOR_DELIVERY':
        return <Truck className="h-5 w-5" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle className="h-5 w-5" />;
      case 'ORDER_PROCESSING':
        return <Clock className="h-5 w-5" />;
      case 'ORDER_CANCELLED':
      case 'ORDER_FAILED':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getIconColor = (data?: Record<string, string>) => {
    const type = data?.type || data?.notificationType;

    switch (type) {
      case 'ORDER_DELIVERED':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'ORDER_SHIPPED':
      case 'ORDER_OUT_FOR_DELIVERY':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ORDER_CANCELLED':
      case 'ORDER_FAILED':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-tenant-primary/10 text-tenant-primary';
    }
  };

  if (!isEnabled || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-[var(--z-toast)] space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            layout
            className="bg-card border rounded-xl shadow-lg overflow-hidden cursor-pointer hover:border-tenant-primary/50 transition-colors"
            onClick={() => handleClick(notification)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  getIconColor(notification.payload.data)
                )}>
                  {getIcon(notification.payload.data)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {notification.payload.title || 'Notification'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.payload.body}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notification.id);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Progress bar for auto-dismiss */}
            <motion.div
              className="h-1 bg-tenant-primary"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

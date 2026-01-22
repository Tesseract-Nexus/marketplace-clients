'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Package, ShoppingCart, CreditCard, Users, AlertTriangle, Star, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const notificationIcons: Record<string, React.ElementType> = {
  'order.created': ShoppingCart,
  'order.status_changed': Package,
  'order.cancelled': AlertTriangle,
  'order.shipped': Package,
  'order.delivered': Check,
  'payment.captured': CreditCard,
  'payment.failed': AlertTriangle,
  'payment.refunded': RotateCcw,
  'inventory.low_stock': AlertTriangle,
  'inventory.out_of_stock': AlertTriangle,
  'customer.registered': Users,
  'return.requested': RotateCcw,
  'return.approved': Check,
  'return.rejected': AlertTriangle,
  'review.submitted': Star,
  'review.approved': Star,
  'notification.EMAIL': Bell,
};

const notificationColors: Record<string, { bg: string; icon: string; border: string }> = {
  'order.created': { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-l-emerald-500' },
  'order.status_changed': { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-l-blue-500' },
  'order.cancelled': { bg: 'bg-destructive/10', icon: 'text-destructive', border: 'border-l-red-500' },
  'order.shipped': { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-l-indigo-500' },
  'order.delivered': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-green-500' },
  'payment.captured': { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-l-emerald-500' },
  'payment.failed': { bg: 'bg-destructive/10', icon: 'text-destructive', border: 'border-l-red-500' },
  'payment.refunded': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-amber-500' },
  'inventory.low_stock': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-orange-500' },
  'inventory.out_of_stock': { bg: 'bg-destructive/10', icon: 'text-destructive', border: 'border-l-red-500' },
  'customer.registered': { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-l-purple-500' },
  'return.requested': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-amber-500' },
  'return.approved': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-green-500' },
  'return.rejected': { bg: 'bg-destructive/10', icon: 'text-destructive', border: 'border-l-red-500' },
  'review.submitted': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-yellow-500' },
  'review.approved': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-green-500' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-primary/20 text-primary',
  high: 'bg-warning-muted text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

// Generate navigation URL based on notification type and entity
function getNotificationUrl(notification: Notification): string | null {
  // If actionUrl is already provided, use it
  if (notification.actionUrl) {
    return notification.actionUrl;
  }

  // Extract entity info from notification or metadata
  const entityId = notification.entityId || (notification.metadata as Record<string, unknown>)?.entityId as string;
  const entityType = notification.entityType || (notification.metadata as Record<string, unknown>)?.entityType as string;
  const orderId = (notification.metadata as Record<string, unknown>)?.orderId as string;
  const customerId = (notification.metadata as Record<string, unknown>)?.customerId as string;
  const productId = (notification.metadata as Record<string, unknown>)?.productId as string;
  const reviewId = (notification.metadata as Record<string, unknown>)?.reviewId as string;
  const returnId = (notification.metadata as Record<string, unknown>)?.returnId as string;

  // Map notification types to routes
  const type = notification.type.toLowerCase();

  // Order-related notifications
  if (type.startsWith('order.')) {
    const id = orderId || entityId;
    if (id) return `/orders/${id}`;
  }

  // Payment-related notifications
  if (type.startsWith('payment.')) {
    const id = orderId || entityId;
    if (id) return `/orders/${id}`; // Payments are typically viewed on order page
  }

  // Customer-related notifications
  if (type.startsWith('customer.')) {
    const id = customerId || entityId;
    if (id) return `/customers/${id}`;
  }

  // Inventory-related notifications
  if (type.startsWith('inventory.')) {
    const id = productId || entityId;
    if (id) return `/products/${id}`;
    return '/inventory'; // Fallback to inventory page
  }

  // Return-related notifications
  if (type.startsWith('return.')) {
    const id = returnId || entityId;
    if (id) return `/returns/${id}`;
    return '/returns';
  }

  // Review-related notifications
  if (type.startsWith('review.')) {
    const id = reviewId || entityId;
    if (id) return `/reviews/${id}`;
    return '/reviews';
  }

  // Fallback based on entityType
  if (entityType && entityId) {
    const routeMap: Record<string, string> = {
      'Order': '/orders',
      'Customer': '/customers',
      'Product': '/products',
      'Review': '/reviews',
      'Return': '/returns',
      'Payment': '/orders', // Payments show on order page
      'Inventory': '/inventory',
    };
    const basePath = routeMap[entityType];
    if (basePath) {
      return `${basePath}/${entityId}`;
    }
  }

  return null;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onClose,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const Icon = notificationIcons[notification.type] || Bell;
  const colors = notificationColors[notification.type] || { bg: 'bg-muted', icon: 'text-muted-foreground', border: 'border-l-gray-400' };

  // Get the navigation URL (from actionUrl or generated from entityType/entityId)
  const navigationUrl = getNotificationUrl(notification);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (navigationUrl) {
      onClose();
    }
  };

  // Extract metadata for display with proper typing
  const metadata = notification.metadata as Record<string, unknown> | undefined;
  const rawAmount = metadata?.total ?? metadata?.amount;
  const amount: number | undefined = typeof rawAmount === 'number' ? rawAmount : undefined;
  const rawCurrency = metadata?.currency;
  const currency: string | undefined = typeof rawCurrency === 'string' ? rawCurrency : undefined;
  const rawOrderNumber = metadata?.orderNumber;
  const orderNumber: string | undefined = typeof rawOrderNumber === 'string' ? rawOrderNumber : undefined;

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer group border-l-4",
        colors.border,
        notification.isRead
          ? "bg-white hover:bg-muted"
          : "bg-gradient-to-r from-blue-50/50 to-white hover:from-blue-50 shadow-sm"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "p-2.5 rounded-xl shrink-0 shadow-sm",
        colors.bg
      )}>
        <Icon className={cn("w-5 h-5", colors.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={cn(
              "text-sm line-clamp-2 leading-snug",
              notification.isRead ? "text-foreground" : "text-foreground font-semibold"
            )}>
              {notification.title}
            </p>
            {amount !== undefined && currency && (
              <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency + ' '}
                {amount.toFixed(2)}
              </span>
            )}
          </div>
          {!notification.isRead && (
            <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shrink-0 mt-1 shadow-sm animate-pulse" />
          )}
        </div>

        {notification.message && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground font-medium">
            {formatTimeAgo(notification.createdAt)}
          </span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded font-medium capitalize",
            colors.bg,
            colors.icon
          )}>
            {notification.sourceService.replace('-service', '')}
          </span>
          {orderNumber && (
            <>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="text-xs text-muted-foreground font-mono">
                #{orderNumber}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons - show on hover */}
      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary/20 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5 text-primary" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-destructive/10 rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );

  if (navigationUrl) {
    return (
      <Link href={navigationUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        className="relative p-2 rounded-lg border transition-all duration-200 group"
        style={{
          backgroundColor: 'var(--color-sidebar-text, #f9fafb)' + '40',
          borderColor: 'var(--color-sidebar-text, #e5e7eb)',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4 transition-colors" style={{ color: 'var(--color-header-text, #4b5563)' }} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-gradient-to-br from-red-500 to-pink-500 rounded-full shadow-lg shadow-red-500/30">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive/100 rounded-full animate-ping opacity-75" />
          </>
        )}

        {/* Connection indicator */}
        <span
          className={cn(
            "absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white",
            isConnected ? "bg-emerald-500" : "bg-border"
          )}
          title={isConnected ? "Real-time updates active" : "Connecting..."}
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-card rounded-xl shadow-2xl border border-border z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium text-primary bg-primary/20 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={deleteAllNotifications}
                  title="Clear all notifications"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Clear all
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
                onClick={refresh}
                title="Refresh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border p-2 bg-muted">
              <Link
                href="/notifications"
                className="flex items-center justify-center gap-1 w-full py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

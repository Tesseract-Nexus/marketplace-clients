'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Package, ShoppingCart, CreditCard, Users, AlertTriangle, Star, RotateCcw, XCircle, FolderPlus, FolderEdit, FolderMinus, Tag } from 'lucide-react';
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
  'category.created': FolderPlus,
  'category.updated': FolderEdit,
  'category.deleted': FolderMinus,
  'notification.EMAIL': Bell,
};

const notificationColors: Record<string, { bg: string; icon: string; border: string }> = {
  'order.created': { bg: 'bg-success/10', icon: 'text-success', border: 'border-l-success' },
  'order.status_changed': { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-l-blue-500' },
  'order.cancelled': { bg: 'bg-destructive/10', icon: 'text-destructive', border: 'border-l-red-500' },
  'order.shipped': { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-l-indigo-500' },
  'order.delivered': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-green-500' },
  'payment.captured': { bg: 'bg-success/10', icon: 'text-success', border: 'border-l-success' },
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
  'category.created': { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-l-violet-500' },
  'category.updated': { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-l-blue-500' },
  'category.deleted': { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-l-rose-500' },
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
        "flex items-start gap-3 p-4 rounded-xl transition-all duration-200 cursor-pointer group border-l-[3px]",
        colors.border,
        notification.isRead
          ? "bg-white hover:bg-muted/50"
          : "bg-gradient-to-r from-primary/5 via-primary/3 to-transparent hover:from-primary/10 hover:via-primary/5 shadow-sm"
      )}
      onClick={handleClick}
    >
      <div className={cn(
        "p-3 rounded-2xl shrink-0 shadow-sm ring-1 ring-black/5",
        colors.bg
      )}>
        <Icon className={cn("w-5 h-5", colors.icon)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={cn(
                "text-sm line-clamp-1 leading-snug",
                notification.isRead ? "text-foreground" : "text-foreground font-semibold"
              )}>
                {notification.title}
              </p>
              {notification.priority && notification.priority !== 'normal' && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide",
                  priorityColors[notification.priority]
                )}>
                  {notification.priority}
                </span>
              )}
            </div>
            {amount !== undefined && currency && (
              <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-md ring-1 ring-emerald-200">
                {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency + ' '}
                {amount.toFixed(2)}
              </span>
            )}
          </div>
          {!notification.isRead && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary rounded-full shrink-0 shadow-sm animate-pulse" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">New</span>
            </div>
          )}
        </div>

        {notification.message && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[11px] text-muted-foreground font-medium">
            {formatTimeAgo(notification.createdAt)}
          </span>
          <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded-md font-semibold capitalize",
            colors.bg,
            colors.icon
          )}>
            {notification.sourceService.replace('-service', '').replace('_', ' ')}
          </span>
          {orderNumber && (
            <>
              <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
              <span className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">
                #{orderNumber}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons - show on hover */}
      <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {!notification.isRead && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            title="Mark as read"
          >
            <Check className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
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
        className={cn(
          "relative h-10 w-10 p-0 rounded-xl border-2 transition-all duration-300 group flex items-center justify-center shadow-sm",
          unreadCount > 0
            ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 hover:border-indigo-300"
            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className={cn(
          "w-5 h-5 transition-all duration-300",
          unreadCount > 0 ? "text-indigo-600 group-hover:scale-110" : "text-slate-600"
        )} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] flex items-center justify-center px-1.5 text-[11px] font-bold text-white bg-gradient-to-br from-rose-500 to-red-600 rounded-full shadow-lg shadow-red-500/40 ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-[22px] h-[22px] bg-rose-400 rounded-full animate-ping opacity-40" />
          </>
        )}

        {/* Connection indicator */}
        {isConnected && (
          <span
            className="absolute bottom-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-sm"
            title="Real-time updates active"
          />
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[420px] bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-base text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-800 rounded-lg"
                  onClick={deleteAllNotifications}
                  title="Clear all notifications"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-lg"
                onClick={refresh}
                title="Refresh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-600 mt-3 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">All caught up!</p>
                <p className="text-xs text-slate-500 max-w-[280px]">
                  You have no notifications at the moment. We'll notify you when something important happens.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 p-2">
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

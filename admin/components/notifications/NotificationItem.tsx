'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  AlertTriangle,
  Star,
  RotateCcw,
  FolderPlus,
  FolderEdit,
  FolderMinus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Notification } from '@/hooks/useNotifications';

// Icon mapping for notification types
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
};

// Color mapping using semantic tokens
const notificationColors: Record<string, { bg: string; icon: string; border: string }> = {
  'order.created': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-success' },
  'order.status_changed': { bg: 'bg-info-muted', icon: 'text-info', border: 'border-l-info' },
  'order.cancelled': { bg: 'bg-error-muted', icon: 'text-error', border: 'border-l-error' },
  'order.shipped': { bg: 'bg-info-muted', icon: 'text-info', border: 'border-l-info' },
  'order.delivered': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-success' },
  'payment.captured': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-success' },
  'payment.failed': { bg: 'bg-error-muted', icon: 'text-error', border: 'border-l-error' },
  'payment.refunded': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-warning' },
  'inventory.low_stock': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-warning' },
  'inventory.out_of_stock': { bg: 'bg-error-muted', icon: 'text-error', border: 'border-l-error' },
  'customer.registered': { bg: 'bg-info-muted', icon: 'text-info', border: 'border-l-info' },
  'return.requested': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-warning' },
  'return.approved': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-success' },
  'return.rejected': { bg: 'bg-error-muted', icon: 'text-error', border: 'border-l-error' },
  'review.submitted': { bg: 'bg-warning-muted', icon: 'text-warning', border: 'border-l-warning' },
  'review.approved': { bg: 'bg-success-muted', icon: 'text-success', border: 'border-l-success' },
  'category.created': { bg: 'bg-info-muted', icon: 'text-info', border: 'border-l-info' },
  'category.updated': { bg: 'bg-info-muted', icon: 'text-info', border: 'border-l-info' },
  'category.deleted': { bg: 'bg-error-muted', icon: 'text-error', border: 'border-l-error' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-neutral-muted text-neutral-muted-foreground',
  normal: 'bg-info-muted text-info',
  high: 'bg-warning-muted text-warning',
  urgent: 'bg-error-muted text-error',
};

// Format time with relative display and absolute tooltip
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString();
}

function formatAbsoluteTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// Format currency using Intl.NumberFormat
function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Generate navigation URL based on notification type and entity
// All entities use path-based routing: /entity/{id}
// Entities without native [id] routes have redirect pages that handle the mapping
function getNotificationUrl(notification: Notification): string | null {
  if (notification.actionUrl) return notification.actionUrl;

  const metadata = notification.metadata as Record<string, unknown> | undefined;
  const entityId = notification.entityId || (metadata?.entityId as string);
  const entityType = notification.entityType || (metadata?.entityType as string);
  const orderId = metadata?.orderId as string;
  const customerId = metadata?.customerId as string;
  const productId = metadata?.productId as string;

  const type = notification.type.toLowerCase();

  if (type.startsWith('order.') || type.startsWith('payment.')) {
    const id = orderId || entityId;
    if (id) return `/orders/${id}`;
  }
  if (type.startsWith('customer.')) {
    const id = customerId || entityId;
    if (id) return `/customers/${id}`;
  }
  if (type.startsWith('product.')) {
    const id = productId || entityId;
    if (id) return `/products/${id}`;
    return '/products';
  }
  if (type.startsWith('inventory.')) {
    const id = productId || entityId;
    if (id) return `/products/${id}`;
    return '/inventory';
  }
  if (type.startsWith('category.')) {
    const id = entityId;
    if (id) return `/categories/${id}`;
    return '/categories';
  }
  if (type.startsWith('staff.')) {
    const id = entityId;
    if (id) return `/staff/${id}`;
    return '/staff';
  }
  if (type.startsWith('vendor.')) {
    const id = (metadata?.vendorId as string) || entityId;
    if (id) return `/vendors/${id}`;
    return '/vendors';
  }
  if (type.startsWith('coupon.')) {
    const id = (metadata?.couponId as string) || entityId;
    if (id) return `/coupons/${id}`;
    return '/coupons';
  }
  if (type.startsWith('return.')) return '/returns';
  if (type.startsWith('review.')) return '/reviews';
  if (type.startsWith('ticket.')) return '/support';

  // Generic fallback based on entityType
  if (entityType && entityId) {
    const routeMap: Record<string, string> = {
      Order: '/orders',
      Customer: '/customers',
      Product: '/products',
      Category: '/categories',
      Staff: '/staff',
      Vendor: '/vendors',
      Payment: '/orders',
      Coupon: '/coupons',
      Inventory: '/products',
    };
    const basePath = routeMap[entityType];
    if (basePath) return `${basePath}/${entityId}`;
  }

  return null;
}

interface NotificationItemProps {
  notification: Notification;
  compact?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export function NotificationItem({
  notification,
  compact = false,
  isExpanded = false,
  onToggle,
  onMarkRead,
  onDelete,
  onClose,
  isLoading = false,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell;
  const colors = notificationColors[notification.type] || {
    bg: 'bg-muted',
    icon: 'text-muted-foreground',
    border: 'border-l-border',
  };
  const navigationUrl = getNotificationUrl(notification);

  // Extract metadata
  const metadata = notification.metadata as Record<string, unknown> | undefined;
  const rawAmount = metadata?.total ?? metadata?.amount;
  const amount = typeof rawAmount === 'number' ? rawAmount : undefined;
  const rawCurrency = metadata?.currency;
  const currency = typeof rawCurrency === 'string' ? rawCurrency : undefined;
  const rawOrderNumber = metadata?.orderNumber;
  const orderNumber = typeof rawOrderNumber === 'string' ? rawOrderNumber : undefined;

  const handleClick = () => {
    if (compact && onToggle) {
      onToggle();
    } else {
      if (!notification.isRead) {
        onMarkRead(notification.id);
      }
      if (navigationUrl && onClose) {
        onClose();
      }
    }
  };

  const handleNavigate = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (onClose) {
      onClose();
    }
  };

  // Compact view - single line with essential info
  if (compact && !isExpanded) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group',
          notification.isRead
            ? 'hover:bg-muted/50'
            : 'bg-primary/5 hover:bg-primary/10'
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`${notification.title}, ${notification.isRead ? 'read' : 'unread'}, ${formatTimeAgo(notification.createdAt)}`}
      >
        {/* Icon */}
        <div className={cn('p-2 rounded-xl shrink-0', colors.bg)}>
          <Icon className={cn('w-4 h-4', colors.icon)} />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm truncate',
              notification.isRead ? 'text-foreground' : 'font-medium text-foreground'
            )}
          >
            {notification.title}
          </p>
        </div>

        {/* Time & unread indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(notification.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                {formatAbsoluteTime(notification.createdAt)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}

          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    );
  }

  // Expanded/Full view
  const content = (
    <div
      className={cn(
        'rounded-lg transition-all border-l-[3px]',
        colors.border,
        notification.isRead
          ? 'bg-card hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10',
        compact ? 'mx-1 mb-1' : ''
      )}
    >
      {/* Collapse header if in compact mode */}
      {compact && (
        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 text-left"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <div className={cn('p-2 rounded-xl shrink-0', colors.bg)}>
            <Icon className={cn('w-4 h-4', colors.icon)} />
          </div>
          <span
            className={cn(
              'flex-1 text-sm truncate',
              notification.isRead ? 'text-foreground' : 'font-medium text-foreground'
            )}
          >
            {notification.title}
          </span>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Main content */}
      <div className={cn('px-4 pb-3', compact ? 'pt-0' : 'pt-3')}>
        {/* Header row - only show if not compact */}
        {!compact && (
          <div className="flex items-start gap-3 mb-2">
            <div className={cn('p-2.5 rounded-xl shrink-0', colors.bg)}>
              <Icon className={cn('w-5 h-5', colors.icon)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className={cn(
                    'text-sm',
                    notification.isRead ? 'text-foreground' : 'font-semibold text-foreground'
                  )}
                >
                  {notification.title}
                </p>
                {notification.priority && notification.priority !== 'normal' && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide',
                      priorityColors[notification.priority]
                    )}
                  >
                    {notification.priority}
                  </span>
                )}
                {!notification.isRead && (
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                    New
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {notification.message && (
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {notification.message}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Amount badge */}
          {amount !== undefined && currency && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-success-muted text-success rounded">
              {formatCurrency(amount, currency)}
            </span>
          )}

          {/* Time */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground cursor-help">
                  {formatTimeAgo(notification.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {formatAbsoluteTime(notification.createdAt)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="w-1 h-1 rounded-full bg-border" />

          {/* Service badge */}
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded capitalize',
              colors.bg,
              colors.icon
            )}
          >
            {notification.sourceService.replace('-service', '').replace('_', ' ')}
          </span>

          {/* Order number */}
          {orderNumber && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                #{orderNumber}
              </span>
            </>
          )}
        </div>

        {/* Action buttons - always visible for touch */}
        <div className="flex items-center gap-2">
          {/* Navigation button */}
          {navigationUrl && (
            <Link
              href={navigationUrl}
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
            >
              View details
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Mark as read */}
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-success-muted hover:text-success rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMarkRead(notification.id);
              }}
              disabled={isLoading}
              aria-label="Mark as read"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-error-muted hover:text-error rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(notification.id);
            }}
            disabled={isLoading}
            aria-label="Delete notification"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // For non-compact view with navigation, wrap entire item as clickable
  if (!compact && navigationUrl) {
    return (
      <Link href={navigationUrl} onClick={handleNavigate} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

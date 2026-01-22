'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Package,
  CreditCard,
  AlertTriangle,
  Users,
  RotateCcw,
  Star,
  Ticket,
  Store,
  Tag,
  Mail,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Icon mapping for notification types
const typeIcons: Record<string, typeof Bell> = {
  'order.created': ShoppingCart,
  'order.status_changed': Package,
  'order.shipped': Package,
  'order.delivered': Package,
  'order.cancelled': AlertTriangle,
  'payment.captured': CreditCard,
  'payment.failed': AlertTriangle,
  'payment.refunded': CreditCard,
  'inventory.low_stock': AlertTriangle,
  'inventory.out_of_stock': AlertTriangle,
  'customer.registered': Users,
  'return.requested': RotateCcw,
  'return.approved': RotateCcw,
  'review.created': Star,
  'review.approved': Star,
  'ticket.created': Ticket,
  'ticket.resolved': Ticket,
  'vendor.created': Store,
  'vendor.approved': Store,
  'coupon.applied': Tag,
  'coupon.expired': Tag,
};

// Priority colors
const priorityColors: Record<string, string> = {
  low: 'bg-muted text-foreground',
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
  const metadata = notification.metadata as Record<string, unknown> | undefined;
  const entityId = notification.entityId || metadata?.entityId as string;
  const entityType = notification.entityType || metadata?.entityType as string;
  const orderId = metadata?.orderId as string;
  const customerId = metadata?.customerId as string;
  const productId = metadata?.productId as string;
  const reviewId = metadata?.reviewId as string;
  const returnId = metadata?.returnId as string;

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
    if (id) return `/orders/${id}`;
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
    return '/inventory';
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

  // Ticket-related notifications
  if (type.startsWith('ticket.')) {
    const ticketId = metadata?.ticketId as string || entityId;
    if (ticketId) return `/support/${ticketId}`;
    return '/support';
  }

  // Vendor-related notifications
  if (type.startsWith('vendor.')) {
    const vendorId = metadata?.vendorId as string || entityId;
    if (vendorId) return `/vendors/${vendorId}`;
    return '/vendors';
  }

  // Coupon-related notifications
  if (type.startsWith('coupon.')) {
    const couponId = metadata?.couponId as string || entityId;
    if (couponId) return `/coupons/${couponId}`;
    return '/coupons';
  }

  // Fallback based on entityType
  if (entityType && entityId) {
    const routeMap: Record<string, string> = {
      'Order': '/orders',
      'Customer': '/customers',
      'Product': '/products',
      'Review': '/reviews',
      'Return': '/returns',
      'Payment': '/orders',
      'Inventory': '/inventory',
      'Ticket': '/support',
      'Vendor': '/vendors',
      'Coupon': '/coupons',
    };
    const basePath = routeMap[entityType];
    if (basePath) {
      return `${basePath}/${entityId}`;
    }
  }

  return null;
}

export default function NotificationsPage() {
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    // Small delay to show the refreshing state
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    // Read/unread filter
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'read' && !n.isRead) return false;

    // Type filter
    if (typeFilter !== 'all' && !n.type.startsWith(typeFilter)) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.type.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get unique notification type prefixes for filter
  const notificationTypes = Array.from(
    new Set(notifications.map((n) => n.type.split('.')[0]))
  );

  // Get icon for notification type
  const getIcon = (type: string) => {
    return typeIcons[type] || Bell;
  };

  // Format time ago
  const formatTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <PermissionGate
      permission={Permission.NOTIFICATIONS_VIEW}
      fallback="styled"
      fallbackTitle="Notifications Access Required"
      fallbackDescription="You don't have the required permissions to view notifications. Please contact your administrator to request access."
    >
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success' : 'bg-border'}`} />
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Read/Unread filter */}
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            {/* Type filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Bell className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {notificationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </CardTitle>
          <CardDescription>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || filter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const navigationUrl = getNotificationUrl(notification);

                const handleNotificationClick = () => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                };

                const notificationContent = (
                  <div
                    className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer group ${
                      !notification.isRead ? 'bg-primary/10/50' : ''
                    }`}
                    onClick={handleNotificationClick}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        !notification.isRead ? 'bg-primary/20' : 'bg-muted'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </p>
                            {navigationUrl && (
                              <ExternalLink className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <Badge variant="outline" className={`text-xs ${priorityColors[notification.priority]}`}>
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            {navigationUrl && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                Click to view
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                markAsRead(notification.id);
                              }}
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              deleteNotification(notification.id);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                );

                // Wrap in Link if there's a navigation URL
                if (navigationUrl) {
                  return (
                    <Link key={notification.id} href={navigationUrl} className="block">
                      {notificationContent}
                    </Link>
                  );
                }

                return <div key={notification.id}>{notificationContent}</div>;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PermissionGate>
  );
}

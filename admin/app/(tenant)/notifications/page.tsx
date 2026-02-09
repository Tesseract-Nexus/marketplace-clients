'use client';

import { useState, useMemo, useCallback } from 'react';
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
  Filter,
  Search,
  ExternalLink,
  Wifi,
  WifiOff,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { NotificationEmptyState } from '@/components/notifications/NotificationEmptyState';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

// Colors using semantic tokens
const typeColors: Record<string, { bg: string; icon: string }> = {
  order: { bg: 'bg-info-muted', icon: 'text-info' },
  payment: { bg: 'bg-success-muted', icon: 'text-success' },
  inventory: { bg: 'bg-warning-muted', icon: 'text-warning' },
  customer: { bg: 'bg-info-muted', icon: 'text-info' },
  return: { bg: 'bg-warning-muted', icon: 'text-warning' },
  review: { bg: 'bg-warning-muted', icon: 'text-warning' },
  ticket: { bg: 'bg-info-muted', icon: 'text-info' },
  vendor: { bg: 'bg-info-muted', icon: 'text-info' },
  coupon: { bg: 'bg-success-muted', icon: 'text-success' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-neutral-muted text-neutral-muted-foreground',
  normal: 'bg-info-muted text-info',
  high: 'bg-warning-muted text-warning',
  urgent: 'bg-error-muted text-error',
};

// Generate navigation URL based on notification type and entity
function getNotificationUrl(notification: Notification): string | null {
  if (notification.actionUrl) return notification.actionUrl;

  const metadata = notification.metadata as Record<string, unknown> | undefined;
  const entityId = notification.entityId || (metadata?.entityId as string);
  const entityType = notification.entityType || (metadata?.entityType as string);
  const orderId = metadata?.orderId as string;
  const customerId = metadata?.customerId as string;
  const productId = metadata?.productId as string;

  const type = notification.type.toLowerCase();

  // Path-based routes (these entities have dedicated [id]/page.tsx)
  if (type.startsWith('order.') || type.startsWith('payment.')) {
    const id = orderId || entityId;
    if (id) return `/orders/${id}`;
  }
  if (type.startsWith('customer.')) {
    const id = customerId || entityId;
    if (id) return `/customers/${id}`;
  }
  if (type.startsWith('coupon.')) {
    const couponId = (metadata?.couponId as string) || entityId;
    if (couponId) return `/coupons/${couponId}`;
    return '/coupons';
  }

  // Query-param routes (these entities use ?id= on their main page)
  if (type.startsWith('product.')) {
    const id = productId || entityId;
    if (id) return `/products?id=${id}`;
    return '/products';
  }
  if (type.startsWith('inventory.')) {
    const id = productId || entityId;
    if (id) return `/products?id=${id}`;
    return '/inventory';
  }
  if (type.startsWith('category.')) {
    const id = entityId;
    if (id) return `/categories?id=${id}`;
    return '/categories';
  }
  if (type.startsWith('staff.')) {
    const id = entityId;
    if (id) return `/staff?id=${id}`;
    return '/staff';
  }
  if (type.startsWith('vendor.')) {
    const vendorId = (metadata?.vendorId as string) || entityId;
    if (vendorId) return `/vendors?id=${vendorId}`;
    return '/vendors';
  }

  // List-only routes (modal/inline views without URL deep-linking)
  if (type.startsWith('return.')) return '/returns';
  if (type.startsWith('review.')) return '/reviews';
  if (type.startsWith('ticket.')) return '/support';

  // Generic fallback based on entityType
  if (entityType && entityId) {
    // Path-based entities (have [id]/page.tsx)
    const pathRoutes: Record<string, string> = {
      Order: '/orders',
      Customer: '/customers',
      Payment: '/orders',
      Coupon: '/coupons',
    };
    const pathBase = pathRoutes[entityType];
    if (pathBase) return `${pathBase}/${entityId}`;

    // Query-param entities (use ?id= on main page)
    const queryRoutes: Record<string, string> = {
      Product: '/products',
      Category: '/categories',
      Staff: '/staff',
      Vendor: '/vendors',
    };
    const queryBase = queryRoutes[entityType];
    if (queryBase) return `${queryBase}?id=${entityId}`;

    // List-only entities
    const listRoutes: Record<string, string> = {
      Review: '/reviews',
      Return: '/returns',
      Inventory: '/inventory',
      Ticket: '/support',
    };
    const listBase = listRoutes[entityType];
    if (listBase) return listBase;
  }

  return null;
}

// Format time with absolute tooltip
function formatTimeAgo(date: string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return date;
  }
}

function formatAbsoluteTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Get unique notification type prefixes with counts
  const notificationTypesWithCounts = useMemo(() => {
    const types = new Map<string, { total: number; unread: number }>();
    notifications.forEach((n) => {
      const prefix = n.type.split('.')[0];
      const existing = types.get(prefix) || { total: 0, unread: 0 };
      existing.total++;
      if (!n.isRead) existing.unread++;
      types.set(prefix, existing);
    });
    return Array.from(types.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.isRead) return false;
      if (filter === 'read' && !n.isRead) return false;
      if (typeFilter !== 'all' && !n.type.startsWith(typeFilter)) return false;
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
  }, [notifications, filter, typeFilter, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = filter !== 'all' || typeFilter !== 'all' || searchQuery !== '';

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Bulk actions
  const handleBulkMarkRead = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setLoadingIds(new Set(ids));
    try {
      await Promise.all(ids.map((id) => markAsRead(id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    } finally {
      setLoadingIds(new Set());
    }
  }, [selectedIds, markAsRead]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    setLoadingIds(new Set(ids));
    try {
      await Promise.all(ids.map((id) => deleteNotification(id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    } finally {
      setLoadingIds(new Set());
    }
  }, [selectedIds, deleteNotification]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // Get icon for notification type
  const getIcon = (type: string) => typeIcons[type] || Bell;
  const getColors = (type: string) => {
    const prefix = type.split('.')[0];
    return typeColors[prefix] || { bg: 'bg-muted', icon: 'text-muted-foreground' };
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Connection status */}
            <Badge
              variant={isConnected ? 'outline' : 'secondary'}
              className={cn(
                'gap-1.5',
                isConnected ? 'border-success text-success' : 'text-muted-foreground'
              )}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  Offline
                </>
              )}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 w-9 p-0"
              aria-label="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>

            {!selectMode && unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}

            {!selectMode && notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
                Select
              </Button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selectMode && (
          <Card className="border-primary">
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      selectedIds.size === filteredNotifications.length &&
                      filteredNotifications.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} of {filteredNotifications.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkRead}
                    disabled={selectedIds.size === 0 || loadingIds.size > 0}
                  >
                    {loadingIds.size > 0 ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Mark read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0 || loadingIds.size > 0}
                    className="text-error hover:text-error hover:bg-error-muted"
                  >
                    {loadingIds.size > 0 ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelSelectMode}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Read/Unread filter */}
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>Unread</span>
                      {unreadCount > 0 && (
                        <Badge variant="default" className="ml-auto h-5 px-1.5 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              {/* Type filter with counts */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Bell className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {notificationTypesWithCounts.map(([type, counts]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          {counts.unread > 0 && (
                            <Badge variant="default" className="h-5 px-1.5 text-xs">
                              {counts.unread}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">({counts.total})</span>
                        </div>
                      </div>
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
              {filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? 's' : ''}
              {hasActiveFilters && ' (filtered)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <NotificationEmptyState filtered={hasActiveFilters} />
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  const colors = getColors(notification.type);
                  const navigationUrl = getNotificationUrl(notification);
                  const isSelected = selectedIds.has(notification.id);
                  const isItemLoading = loadingIds.has(notification.id);

                  const handleNotificationClick = () => {
                    if (selectMode) {
                      toggleSelect(notification.id);
                    } else if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  };

                  const notificationContent = (
                    <div
                      className={cn(
                        'flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors group',
                        !notification.isRead && 'bg-primary/5',
                        isSelected && 'bg-primary/10',
                        selectMode && 'cursor-pointer'
                      )}
                      onClick={handleNotificationClick}
                    >
                      {/* Checkbox in select mode */}
                      {selectMode && (
                        <div className="flex items-center pt-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
                          colors.bg
                        )}
                      >
                        <Icon className={cn('h-5 w-5', colors.icon)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={cn(
                                  'font-medium truncate',
                                  notification.isRead
                                    ? 'text-muted-foreground'
                                    : 'text-foreground'
                                )}
                              >
                                {notification.title}
                              </p>
                              {navigationUrl && !selectMode && (
                                <ExternalLink className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                              <Badge
                                variant="outline"
                                className={cn('text-xs', priorityColors[notification.priority])}
                              >
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                            </div>
                          </div>

                          {/* Actions (not in select mode) */}
                          {!selectMode && (
                            <div className="flex items-center gap-1 shrink-0">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-success-muted hover:text-success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    markAsRead(notification.id);
                                  }}
                                  disabled={isItemLoading}
                                  aria-label="Mark as read"
                                >
                                  {isItemLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-error-muted hover:text-error"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  deleteNotification(notification.id);
                                }}
                                disabled={isItemLoading}
                                aria-label="Delete"
                              >
                                {isItemLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && !selectMode && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2 animate-pulse" />
                      )}
                    </div>
                  );

                  // Wrap in Link if there's a navigation URL and not in select mode
                  if (navigationUrl && !selectMode) {
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

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  RotateCcw,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useToast } from '@/contexts/ToastContext';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationEmptyState } from '@/components/notifications/NotificationEmptyState';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationGroup {
  key: string;
  count: number;
  latest: Notification;
  items: Notification[];
  isGroup: boolean;
  unreadCount: number;
}

/**
 * Group notifications by groupKey or type prefix for similar notifications
 */
function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((n) => {
    // Use groupKey if available, otherwise create one from type + first part of title
    const key = n.groupKey || `${n.type}_${n.title.split(' ').slice(0, 3).join('_')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });

  return Object.entries(groups).map(([key, items]) => ({
    key,
    count: items.length,
    latest: items[0], // Already sorted by date desc from API
    items,
    isGroup: items.length > 3, // Only group if 4+ similar notifications
    unreadCount: items.filter((i) => !i.isRead).length,
  }));
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { info } = useToast();

  const handleNewNotification = useCallback((notification: Notification) => {
    info(notification.title, notification.message || 'You have a new notification');
  }, [info]);

  const {
    notifications,
    unreadCount,
    isLoading,
    hasNewNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
  } = useNotifications({ onNewNotification: handleNewNotification });

  // Group notifications for cleaner display
  const groupedNotifications = useMemo(() => {
    // For the bell dropdown, show recent individual notifications
    // Grouping is more useful on the full page
    return notifications.slice(0, 20);
  }, [notifications]);

  // Optimistic update wrappers
  const handleMarkAsRead = useCallback(
    async (id: string) => {
      setLoadingIds((prev) => new Set(prev).add(id));
      try {
        await markAsRead(id);
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [markAsRead]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setLoadingIds((prev) => new Set(prev).add(id));
      try {
        await deleteNotification(id);
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [deleteNotification]
  );

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (isMobile) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedId(null);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const itemCount = groupedNotifications.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1));
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setExpandedId(null);
          setFocusedIndex(-1);
          break;
        case 'Enter':
        case ' ':
          if (focusedIndex >= 0 && focusedIndex < itemCount) {
            e.preventDefault();
            const notification = groupedNotifications[focusedIndex];
            setExpandedId(expandedId === notification.id ? null : notification.id);
          }
          break;
        case 'Tab':
          // Allow natural tab navigation but close on shift+tab from first item
          if (e.shiftKey && focusedIndex <= 0) {
            setIsOpen(false);
            setFocusedIndex(-1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, groupedNotifications, expandedId]);

  // Focus management - scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-notification-item]');
      items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setExpandedId(null);
      setFocusedIndex(-1);
    }
  };

  // Notification content (shared between mobile sheet and desktop dropdown)
  const notificationContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Actions - icon only with tooltips */}
          {unreadCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-success hover:bg-success-muted hover:text-success"
                    onClick={markAllAsRead}
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark all as read</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {notifications.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-error hover:bg-error-muted hover:text-error"
                    onClick={deleteAllNotifications}
                    aria-label="Clear all notifications"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={refresh}
                  aria-label="Refresh notifications"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Notification List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        role="menu"
        aria-label="Notification list"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground mt-3">Loading notifications...</p>
          </div>
        ) : groupedNotifications.length === 0 ? (
          <NotificationEmptyState variant={isMobile ? 'default' : 'compact'} />
        ) : (
          <div className="p-2 space-y-1">
            {groupedNotifications.map((notification, index) => (
              <div
                key={notification.id}
                data-notification-item
                className={cn(
                  'rounded-lg transition-all',
                  focusedIndex === index && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <NotificationItem
                  notification={notification}
                  compact={true}
                  isExpanded={expandedId === notification.id}
                  onToggle={() =>
                    setExpandedId(expandedId === notification.id ? null : notification.id)
                  }
                  onMarkRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onClose={() => setIsOpen(false)}
                  isLoading={loadingIds.has(notification.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border p-2 bg-muted/50">
          <Link
            href="/notifications"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'relative h-10 w-10 p-0 rounded-xl border-2 transition-all',
          unreadCount > 0
            ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50'
            : 'border-border bg-card hover:bg-muted hover:border-border'
        )}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="notification-panel"
      >
        <Bell
          className={cn(
            'w-5 h-5 transition-all duration-300',
            unreadCount > 0 ? 'text-primary' : 'text-muted-foreground',
            hasNewNotification && 'animate-[ring_0.5s_ease-in-out_3]'
          )}
        />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-bold text-primary-foreground bg-error rounded-full ring-2 ring-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full animate-ping opacity-40" />
          </>
        )}

      </Button>

      {/* Mobile: Bottom Sheet */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>Your recent notifications</SheetDescription>
            </SheetHeader>
            {notificationContent}
          </SheetContent>
        </Sheet>
      ) : (
        /* Desktop: Dropdown */
        isOpen && (
          <div
            id="notification-panel"
            className="absolute right-0 mt-2 w-[400px] max-w-[calc(100vw-2rem)] bg-card rounded-xl shadow-lg ring-1 ring-border z-50 overflow-hidden flex flex-col max-h-[600px] animate-in fade-in slide-in-from-top-2 duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {notificationContent}
          </div>
        )
      )}
    </div>
  );
}

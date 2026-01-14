'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuthStore } from '@/store/auth';

interface NotificationPermissionPromptProps {
  variant?: 'banner' | 'card' | 'minimal';
  onDismiss?: () => void;
  showAfterDelay?: number; // milliseconds
}

export function NotificationPermissionPrompt({
  variant = 'banner',
  onDismiss,
  showAfterDelay = 5000,
}: NotificationPermissionPromptProps) {
  const { isAuthenticated } = useAuthStore();
  const {
    isSupported,
    isEnabled,
    isLoading,
    permission,
    enableNotifications,
    error,
  } = usePushNotifications();

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has already dismissed the prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dismissed = localStorage.getItem('notification_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Show prompt after delay
  useEffect(() => {
    if (
      !isSupported ||
      isEnabled ||
      isDismissed ||
      permission === 'denied' ||
      !isAuthenticated
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [isSupported, isEnabled, isDismissed, permission, isAuthenticated, showAfterDelay]);

  const handleEnable = async () => {
    const success = await enableNotifications();
    if (success) {
      setIsVisible(false);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't render if not supported, already enabled, denied, or dismissed
  if (!isSupported || isEnabled || isDismissed || permission === 'denied') {
    return null;
  }

  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
          >
            <div className="bg-card border rounded-xl shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-tenant-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-5 w-5 text-tenant-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Stay updated on your orders</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Get notified when your order ships, arrives, or requires action.
                  </p>
                  {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className="btn-tenant-primary text-xs"
                      onClick={handleEnable}
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Enable Notifications
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-muted-foreground"
                      onClick={handleDismiss}
                    >
                      Maybe later
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (variant === 'card') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border rounded-xl p-6 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-tenant-primary/10 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-tenant-primary" />
            </div>
            <h3 className="font-semibold text-lg">Enable Order Notifications</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Never miss an update! Get real-time notifications about your orders,
              shipping status, and delivery updates.
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                className="btn-tenant-primary"
                onClick={handleEnable}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
              >
                <BellOff className="h-4 w-4 mr-2" />
                No Thanks
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Minimal variant
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleEnable}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-tenant-primary text-on-tenant-primary rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          Enable Notifications
        </motion.button>
      )}
    </AnimatePresence>
  );
}

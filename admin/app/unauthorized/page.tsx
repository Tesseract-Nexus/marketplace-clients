'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ShieldX, LogOut, ArrowLeft } from 'lucide-react';

/**
 * Unauthorized Page
 *
 * Shown when a user is authenticated but does not have permission to access the admin portal.
 * This typically happens when a customer (registered via storefront) tries to access the admin portal.
 */
export default function UnauthorizedPage() {
  const { user, logout, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout({ returnTo: '/login' });
  };

  const handleGoToStorefront = () => {
    // Redirect to the main storefront domain
    window.location.href = 'https://tesserix.app';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access the admin portal.
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-muted/50 rounded-lg p-4 text-left text-sm space-y-2">
          <p className="text-muted-foreground">
            <strong>Why am I seeing this?</strong>
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>You are logged in as a customer, not as a store staff member</li>
            <li>The admin portal is only accessible to store owners, admins, and staff</li>
            <li>If you believe this is an error, please contact the store owner</li>
          </ul>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Logged in as: <span className="font-medium text-foreground">{user.email}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleGoToStorefront}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Storefront
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          Need admin access? Ask the store owner to invite you as a staff member.
        </p>
      </div>
    </div>
  );
}

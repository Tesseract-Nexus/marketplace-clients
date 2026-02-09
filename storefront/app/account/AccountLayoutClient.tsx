'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Package, Heart, Settings, LogOut, Loader2, MessageSquare, Star, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { logout as logoutApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';
import { CustomerAvatar } from '@/components/CustomerAvatar';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

const accountNavItems = [
  { id: 'profile', label: 'My Profile', icon: User, href: '/account' },
  { id: 'orders', label: 'My Orders', icon: Package, href: '/account/orders' },
  { id: 'loyalty', label: 'Loyalty Points', icon: Star, href: '/account/loyalty' },
  { id: 'tickets', label: 'Support Tickets', icon: MessageSquare, href: '/account/tickets' },
  { id: 'lists', label: 'My Lists', icon: Heart, href: '/account/wishlist' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/account/settings' },
];

export function AccountLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useTenant();
  const getNavPath = useNavPath();
  const { customer, isAuthenticated, isLoading, logout } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(getNavPath('/login'));
    }
  }, [isAuthenticated, isLoading, router, getNavPath]);

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      router.push(getNavPath('/'));
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
      router.push(getNavPath('/'));
    }
  };

  const isActive = (href: string) => {
    const fullPath = getNavPath(href);
    if (href === '/account') {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  // Show loading state while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
      </div>
    );
  }

  const initials = customer
    ? `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen py-8">
      <div className="container-tenant">
        <h1 className="text-3xl font-bold mb-8"><TranslatedUIText text="My Account" /></h1>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border p-4 sticky top-24">
              <div className="flex items-center gap-3 p-3 mb-4">
                <CustomerAvatar className="w-12 h-12" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {customer?.firstName} {customer?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {customer?.email}
                  </p>
                </div>
              </div>

              <Separator className="mb-4" />

              <nav className="space-y-1">
                {accountNavItems.map((item) => (
                  <Link
                    key={item.id}
                    href={getNavPath(item.href)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-tenant-primary text-on-tenant-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <TranslatedUIText text={item.label} />
                  </Link>
                ))}
              </nav>

              <Separator className="my-4" />

              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                <TranslatedUIText text="Sign Out" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

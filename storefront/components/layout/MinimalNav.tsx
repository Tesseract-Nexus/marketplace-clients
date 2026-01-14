'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Home,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
  Heart,
  Package,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant, useHeaderConfig, useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useListsStore } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { logout as logoutApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export function MinimalNav() {
  const router = useRouter();
  const { tenant, settings } = useTenant();
  const headerConfig = useHeaderConfig();
  const getNavPath = useNavPath();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const lists = useListsStore((state) => state.lists);
  const listsCount = lists.reduce((sum, list) => sum + list.itemCount, 0);
  const { customer, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const sortedNavLinks = [...(headerConfig?.navLinks || [])].sort((a, b) => a.position - b.position);

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      router.push(getNavPath('/'));
      setMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
    }
  };

  const totalBadgeCount = cartCount + listsCount;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setMenuOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg',
          'bg-tenant-primary text-on-tenant-primary',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-6 w-6" />
        {totalBadgeCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs bg-red-500 text-white"
          >
            {totalBadgeCount > 99 ? '99+' : totalBadgeCount}
          </Badge>
        )}
      </motion.button>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
              onClick={() => setMenuOpen(false)}
            >
              <div
                className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <Link
                    href={getNavPath('/')}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    {settings.logoUrl ? (
                      <Image
                        src={settings.logoUrl}
                        alt={tenant?.name || 'Store'}
                        width={100}
                        height={32}
                        className="h-8 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-xl font-bold gradient-text">
                        {tenant?.name || 'Store'}
                      </span>
                    )}
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2 p-4 border-b">
                  <Link
                    href={getNavPath('/')}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    <span className="text-xs">Home</span>
                  </Link>
                  {headerConfig.showSearch && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setSearchOpen(true);
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Search className="h-5 w-5" />
                      <span className="text-xs">Search</span>
                    </button>
                  )}
                  <Link
                    href={getNavPath('/account/lists')}
                    onClick={() => setMenuOpen(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors relative"
                  >
                    <Heart className="h-5 w-5" />
                    {listsCount > 0 && (
                      <Badge className="absolute top-1 right-1/4 h-[18px] min-w-[18px] px-1 text-[11px] bg-red-500 text-white">
                        {listsCount}
                      </Badge>
                    )}
                    <span className="text-xs">My Lists</span>
                  </Link>
                  {headerConfig.showCart && (
                    <Link
                      href={getNavPath('/cart')}
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-accent transition-colors relative"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <Badge className="absolute top-1 right-1/4 h-[18px] min-w-[18px] px-1 text-[11px] bg-tenant-primary text-on-tenant-primary">
                          {cartCount}
                        </Badge>
                      )}
                      <span className="text-xs">Cart</span>
                    </Link>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="max-h-64 overflow-y-auto">
                  <nav className="p-2">
                    {sortedNavLinks.map((link) => (
                      <Link
                        key={link.id}
                        href={link.isExternal ? link.href : getNavPath(link.href)}
                        target={link.isExternal ? '_blank' : undefined}
                        rel={link.isExternal ? 'noopener noreferrer' : undefined}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <span className="font-medium">{link.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* User Section */}
                <div className="border-t p-4">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium text-on-tenant-primary bg-tenant-primary">
                          {customer?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {customer?.firstName} {customer?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {customer?.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Link
                          href={getNavPath('/account')}
                          onClick={() => setMenuOpen(false)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-xs"
                        >
                          <User className="h-4 w-4" />
                          Account
                        </Link>
                        <Link
                          href={getNavPath('/account/orders')}
                          onClick={() => setMenuOpen(false)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-xs"
                        >
                          <Package className="h-4 w-4" />
                          Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-xs"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href={getNavPath('/login')}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 py-2.5 text-center rounded-lg bg-tenant-primary text-on-tenant-primary font-medium hover:opacity-90 transition-opacity"
                      >
                        Sign In
                      </Link>
                      <Link
                        href={getNavPath('/register')}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 py-2.5 text-center rounded-lg border font-medium hover:bg-accent transition-colors"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="container pt-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search products..."
                  autoFocus
                  className="w-full h-14 pl-12 pr-12 text-lg rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-tenant-primary"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

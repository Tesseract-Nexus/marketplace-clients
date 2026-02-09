'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Heart,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTenant, useHeaderConfig, useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useListsStore } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { logout as logoutApi } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  position?: 'left' | 'right';
}

export function SidebarNav({ position = 'left' }: SidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { tenant, settings } = useTenant();
  const headerConfig = useHeaderConfig();
  const getNavPath = useNavPath();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const lists = useListsStore((state) => state.lists);
  const listsCount = lists.reduce((sum, list) => sum + list.itemCount, 0);
  const { customer, isAuthenticated, logout } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const sortedNavLinks = [...(headerConfig?.navLinks || [])].sort((a, b) => a.position - b.position);

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      useListsStore.getState().clearLists();
      router.push(getNavPath('/'));
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
      useListsStore.getState().clearLists();
    }
  };

  const isActiveLink = (href: string) => {
    const navHref = getNavPath(href);
    return pathname === navHref || pathname?.startsWith(navHref + '/');
  };

  // Quick action items
  const quickActions = [
    { icon: Home, label: 'Home', href: '/', show: true },
    { icon: Search, label: 'Search', href: '/search', show: headerConfig.showSearch },
    { icon: Heart, label: 'My Lists', href: '/account/lists', show: true, badge: listsCount },
    { icon: ShoppingCart, label: 'Cart', href: '/cart', show: headerConfig.showCart, badge: cartCount },
  ].filter((item) => item.show);

  // Account items
  const accountItems = isAuthenticated
    ? [
        { icon: User, label: 'Account', href: '/account' },
        { icon: Package, label: 'Orders', href: '/account/orders' },
        { icon: Settings, label: 'Settings', href: '/account/settings' },
      ]
    : [];

  return (
    <TooltipProvider delayDuration={0}>
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out',
          'bg-background/95 backdrop-blur-md border-r supports-[backdrop-filter]:bg-background/80',
          position === 'left' ? 'left-0' : 'right-0 border-l border-r-0',
          isExpanded ? 'w-64' : 'w-16'
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo / Brand */}
        <div className={cn(
          'flex items-center h-16 px-3 border-b transition-all duration-300',
          isExpanded ? 'justify-between' : 'justify-center'
        )}>
          <Link href={getNavPath('/')} className="flex items-center gap-2 min-w-0">
            <Image
              src={settings.logoUrl || '/logo.png'}
              alt={tenant?.name || 'Store'}
              width={isExpanded ? 100 : 32}
              height={32}
              className={cn(
                'object-contain transition-all duration-300',
                isExpanded ? 'h-8 w-auto' : 'h-8 w-8'
              )}
            />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold gradient-text truncate"
                >
                  {tenant?.name || 'Store'}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-2">
            {quickActions.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={getNavPath(item.href)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      isActiveLink(item.href)
                        ? 'bg-tenant-primary/10 text-tenant-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.badge && item.badge > 0 && (
                        <Badge
                          className={cn(
                            'absolute -top-2 -right-2 h-[18px] min-w-[18px] px-1 flex items-center justify-center text-[11px] font-medium',
                            item.href === '/cart' ? 'bg-tenant-primary text-on-tenant-primary' : 'bg-red-500 text-white'
                          )}
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-4 px-4">
            <div className="h-px bg-border" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-2">
            {sortedNavLinks.map((link) => (
              <Tooltip key={link.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.isExternal ? link.href : getNavPath(link.href)}
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      !link.isExternal && isActiveLink(link.href)
                        ? 'bg-tenant-primary/10 text-tenant-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium truncate"
                        >
                          {link.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                    {link.label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* Account Section */}
          {isAuthenticated && accountItems.length > 0 && (
            <>
              <div className="my-4 px-4">
                <div className="h-px bg-border" />
              </div>
              <nav className="flex flex-col gap-1 px-2">
                {accountItems.map((item) => (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={getNavPath(item.href)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                          isActiveLink(item.href)
                            ? 'bg-tenant-primary/10 text-tenant-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="font-medium truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </TooltipTrigger>
                    {!isExpanded && (
                      <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </nav>
            </>
          )}
        </div>

        {/* User Section / Footer */}
        <div className="border-t p-2">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/50',
                isExpanded ? '' : 'justify-center'
              )}>
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium text-on-tenant-primary bg-tenant-primary shrink-0">
                  {customer?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 min-w-0"
                    >
                      <p className="font-medium truncate text-sm">
                        {customer?.firstName} {customer?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {customer?.email}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full',
                      'text-red-600 hover:bg-red-50',
                      !isExpanded && 'justify-center'
                    )}
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium"
                        >
                          Sign Out
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                    Sign Out
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={getNavPath('/login')}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      'bg-tenant-primary text-on-tenant-primary hover:opacity-90',
                      !isExpanded && 'justify-center'
                    )}
                  >
                    <User className="h-5 w-5 shrink-0" />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium"
                        >
                          Sign In
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side={position === 'left' ? 'right' : 'left'}>
                    Sign In
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[var(--z-modal)] bg-background/80 backdrop-blur-sm"
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
    </TooltipProvider>
  );
}

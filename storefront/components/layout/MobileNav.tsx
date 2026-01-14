'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Grid3X3, ShoppingCart, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useMobileConfig, useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

const NAV_ICONS = {
  home: Home,
  search: Search,
  categories: Grid3X3,
  cart: ShoppingCart,
  account: User,
} as const;

const NAV_LABELS = {
  home: 'Home',
  search: 'Search',
  categories: 'Categories',
  cart: 'Cart',
  account: 'Account',
} as const;

const NAV_PATHS = {
  home: '/',
  search: '/search',
  categories: '/categories',
  cart: '/cart',
  account: '/account',
} as const;

type NavItem = keyof typeof NAV_ICONS;

export function MobileNav() {
  const mobileConfig = useMobileConfig();
  const getNavPath = useNavPath();
  const pathname = usePathname();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!mobileConfig?.bottomNav) {
    return null;
  }

  const navItems = (mobileConfig.bottomNavItems || ['home', 'search', 'categories', 'cart', 'account']) as NavItem[];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-[calc(var(--mobile-nav-height,64px)+env(safe-area-inset-bottom,0px))] md:hidden" />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around" style={{ height: 'var(--mobile-nav-height, 64px)' }}>
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item];
            const label = NAV_LABELS[item];
            const path = getNavPath(NAV_PATHS[item]);
            const isActive = pathname === path ||
              (item === 'home' && pathname.endsWith('/')) ||
              (item === 'account' && pathname.startsWith(getNavPath('/account'))) ||
              (item === 'categories' && pathname.startsWith(getNavPath('/categories')));
            const showBadge = item === 'cart' && cartCount > 0;

            return (
              <Link
                key={item}
                href={path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 relative',
                  'min-h-[44px] min-w-[44px]', // iOS minimum touch target
                  'transition-colors duration-200',
                  'active:scale-95 active:opacity-80', // Touch feedback
                  isActive
                    ? 'text-tenant-primary'
                    : 'text-muted-foreground'
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-tenant-primary rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                {/* Icon container with touch target */}
                <div className="relative flex items-center justify-center w-11 h-7">
                  <motion.div
                    initial={false}
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Icon className={cn(
                      'transition-all duration-200',
                      isActive ? 'h-6 w-6' : 'h-5 w-5'
                    )} />
                  </motion.div>

                  {/* Cart badge */}
                  {showBadge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 right-0"
                    >
                      <Badge
                        className="h-[18px] min-w-[18px] flex items-center justify-center px-1 text-[11px] font-bold bg-tenant-primary text-on-tenant-primary shadow-sm"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {/* Label - minimum 11px for accessibility */}
                <span className={cn(
                  'text-[11px] font-medium leading-tight transition-all duration-200',
                  isActive && 'font-semibold'
                )}>
                  <TranslatedUIText text={label} />
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

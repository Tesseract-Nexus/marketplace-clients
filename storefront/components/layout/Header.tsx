'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, Search, ShoppingCart, User, LogOut, Package, Heart, Settings, Bell, Star, Gift, Globe, ChevronRight, Home, Grid3X3, Ticket, CreditCard, ChevronDown, X } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTenant, useHeaderConfig, useNavPath, useMobileConfig, useLocalization } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useListsStore } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { logout as logoutApi } from '@/lib/api/auth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';
import { CustomerAvatar } from '@/components/CustomerAvatar';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { StorefrontNavLink } from '@/types/storefront';

export function Header() {
  const router = useRouter();
  const { tenant, settings } = useTenant();
  const headerConfig = useHeaderConfig();
  const mobileConfig = useMobileConfig();
  const getNavPath = useNavPath();
  const localization = useLocalization();
  const mobileMenuStyle = mobileConfig?.mobileMenuStyle || 'slide';
  const mobileHeaderStyle = mobileConfig?.mobileHeaderStyle || 'standard';

  // Get mobile header classes based on style
  const mobileHeaderClasses = {
    compact: 'md:hidden py-1',
    standard: 'md:hidden py-2',
    minimal: 'md:hidden py-1',
  }[mobileHeaderStyle];
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const lists = useListsStore((state) => state.lists);
  const listsCount = lists.reduce((sum, list) => sum + list.itemCount, 0);
  const { customer, isAuthenticated, isLoading: isAuthLoading, logout } = useAuthStore();
  const { pointsBalance, isProgramActive, isEnrolled } = useLoyalty();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  // Enable Cmd/Ctrl+K shortcut to open search
  useSearchShortcut({ onOpen: () => setSearchOpen(true) });

  // Track scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if announcement was dismissed (session storage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('announcement-dismissed');
      if (dismissed === 'true') {
        setAnnouncementDismissed(true);
      }
    }
  }, []);

  // Countdown timer for announcements (uses store timezone)
  useEffect(() => {
    if (!headerConfig.announcementCountdownEnd) {
      setCountdown(null);
      return;
    }

    const calculateCountdown = () => {
      // Parse the end date in the store's timezone
      // The datetime is stored as a simple string like "2026-01-29T03:29" without timezone
      // We need to interpret it in the store's timezone
      const storeTimezone = localization.timezone || 'UTC';

      // Get current time in store timezone as a comparable timestamp
      const now = new Date();

      // Parse the stored datetime and treat it as being in the store's timezone
      // by creating a formatter that outputs the store timezone's current time
      const endDateStr = headerConfig.announcementCountdownEnd!;

      // Create a date from the stored string (interpreted as local time initially)
      // Then adjust for the store's timezone
      let endDate: Date;

      try {
        // If the stored value is an ISO string (legacy), parse it directly
        if (endDateStr.includes('Z') || endDateStr.includes('+')) {
          endDate = new Date(endDateStr);
        } else {
          // For simple datetime strings like "2026-01-29T03:29", interpret in store timezone
          // Create a date string with the timezone info
          const dateFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: storeTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });

          // Get current time in store timezone
          const nowInStoreTimezone = dateFormatter.format(now);
          const [datePart, timePart] = nowInStoreTimezone.split(', ');
          const currentStoreTime = new Date(`${datePart}T${timePart}`);

          // Parse the end date string (it's already in store timezone format)
          const endDateTime = new Date(endDateStr.includes('T') ? endDateStr : `${endDateStr}T00:00:00`);

          // Calculate the offset between local time and store time
          const localNow = new Date();
          const storeTimeOffset = currentStoreTime.getTime() - localNow.getTime();

          // Adjust the end date by the same offset
          endDate = new Date(endDateTime.getTime() - storeTimeOffset);
        }
      } catch {
        // Fallback: parse as-is
        endDate = new Date(endDateStr);
      }

      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [headerConfig.announcementCountdownEnd, localization.timezone]);

  const handleDismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('announcement-dismissed', 'true');
    }
  };

  const sortedNavLinks = [...(headerConfig?.navLinks || [])].sort((a, b) => a.position - b.position);

  const allNavLinks: StorefrontNavLink[] = [
    ...sortedNavLinks,
  ];

  const handleLogout = async () => {
    try {
      await logoutApi();
      logout();
      router.push(getNavPath('/'));
    } catch (error) {
      console.error('Logout failed:', error);
      logout();
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      {headerConfig.showAnnouncement && headerConfig.announcementText && !announcementDismissed && (
        <div
          className={cn(
            "relative text-center py-2 px-4 text-sm font-medium overflow-hidden",
            headerConfig.announcementStyle === 'pulse' && "animate-pulse-subtle"
          )}
          style={{
            background: headerConfig.announcementBgColor || 'var(--tenant-gradient)',
            color: headerConfig.announcementTextColor || '#fff',
          }}
        >
          <div className={cn(
            "flex items-center justify-center gap-2",
            headerConfig.announcementStyle === 'marquee' && "animate-marquee whitespace-nowrap"
          )}>
            {/* Icon/Emoji */}
            {headerConfig.announcementIcon && (
              <span className="flex-shrink-0">{headerConfig.announcementIcon}</span>
            )}

            {/* Announcement Content */}
            {headerConfig.announcementLink ? (
              <Link href={headerConfig.announcementLink} className="hover:underline">
                {headerConfig.announcementText}
              </Link>
            ) : (
              <span>{headerConfig.announcementText}</span>
            )}

            {/* Countdown Timer */}
            {countdown && (
              <span className="font-bold ml-2 bg-white/20 px-2 py-0.5 rounded">
                {countdown}
              </span>
            )}
          </div>

          {/* Dismiss Button */}
          {headerConfig.announcementDismissible && (
            <button
              onClick={handleDismissAnnouncement}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Header */}
      <header
        className={cn(
          'w-full z-[var(--z-sticky)] transition-all duration-200',
          headerConfig.stickyHeader && 'sticky top-0',
          isScrolled
            ? 'bg-background shadow-sm border-b border-[var(--border-default)]'
            : 'bg-background border-b border-transparent'
        )}
        style={{ height: 'var(--header-height)' }}
      >
        <div className="container-tenant h-full">
          <div className="flex items-center justify-between h-full gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side={mobileMenuStyle === 'dropdown' ? 'top' : 'left'}
                className={cn(
                  'p-0',
                  mobileMenuStyle === 'slide' && 'w-[300px] sm:w-[350px]',
                  mobileMenuStyle === 'fullscreen' && 'w-full max-w-full sm:w-full sm:max-w-full',
                  mobileMenuStyle === 'dropdown' && 'h-auto max-h-[85vh] rounded-b-2xl'
                )}
              >
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-left flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-border/30 shadow-sm flex items-center justify-center flex-shrink-0">
                      <Image
                        src={settings.logoUrl || '/logo.png'}
                        alt={tenant?.name || 'Store'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-lg font-bold gradient-text">
                      {tenant?.name || 'Store'}
                    </span>
                  </SheetTitle>
                </SheetHeader>

                {/* User Info Section */}
                {isAuthLoading ? (
                  <div className="p-4 bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ) : isAuthenticated ? (
                  <div className="p-4 bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar className="h-10 w-10" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer?.firstName} {customer?.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
                      </div>
                    </div>
                    {/* Loyalty Points - Mobile */}
                    {isProgramActive && isEnrolled && (
                      <Link
                        href={getNavPath('/account/loyalty')}
                        className="flex items-center justify-between mt-3 p-2 rounded-lg bg-[var(--loyalty-accent)]/10 border border-[var(--loyalty-accent)]/30"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-[var(--loyalty-accent)] text-[var(--loyalty-accent)]" />
                          <span className="text-sm font-medium text-[var(--loyalty-accent)]">
                            <TranslatedUIText text="Loyalty Points" />
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[var(--loyalty-accent)]">{pointsBalance.toLocaleString()}</span>
                      </Link>
                    )}
                  </div>
                ) : null}

                {/* Shop Section - Navigation Links */}
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <TranslatedUIText text="Shop" />
                  </p>
                  <nav className="flex flex-col" role="navigation" aria-label="Shop navigation">
                    {allNavLinks.map((link) => (
                      <div key={link.id}>
                        <Link
                          href={link.isExternal ? link.href : getNavPath(link.href)}
                          target={link.isExternal ? '_blank' : undefined}
                          rel={link.isExternal ? 'noopener noreferrer' : undefined}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium hover:bg-muted active:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Grid3X3 className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1">
                            <TranslatedUIText text={link.label} />
                          </span>
                          {link.badge && (
                            <Badge
                              className="text-[10px] px-1.5 py-0"
                              style={link.badgeColor ? { backgroundColor: link.badgeColor } : undefined}
                            >
                              {link.badge}
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        {/* Render children as indented items */}
                        {link.children && link.children.length > 0 && (
                          <div className="ml-8 border-l border-[var(--border-default)]">
                            {link.children.map((child) => (
                              <Link
                                key={child.id}
                                href={child.isExternal ? child.href : getNavPath(child.href)}
                                target={child.isExternal ? '_blank' : undefined}
                                rel={child.isExternal ? 'noopener noreferrer' : undefined}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <span className="flex-1">
                                  <TranslatedUIText text={child.label} />
                                </span>
                                {child.badge && (
                                  <Badge
                                    className="text-[10px] px-1.5 py-0"
                                    style={child.badgeColor ? { backgroundColor: child.badgeColor } : undefined}
                                  >
                                    {child.badge}
                                  </Badge>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <Link
                      href={getNavPath('/gift-cards')}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-base hover:bg-muted active:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Gift className="h-5 w-5 text-muted-foreground" />
                      <TranslatedUIText text="Gift Cards" />
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </Link>
                  </nav>
                </div>

                <Separator />

                {/* Account Section - Only for authenticated users */}
                {isAuthenticated && (
                  <>
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <TranslatedUIText text="Account" />
                      </p>
                      <nav className="flex flex-col" role="navigation" aria-label="Account navigation">
                        <Link
                          href={getNavPath('/account')}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base hover:bg-muted active:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="h-5 w-5 text-muted-foreground" />
                          <TranslatedUIText text="My Account" />
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </Link>
                        <Link
                          href={getNavPath('/account/orders')}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base hover:bg-muted active:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <TranslatedUIText text="My Orders" />
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </Link>
                        <Link
                          href={getNavPath('/account/lists')}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base hover:bg-muted active:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Heart className="h-5 w-5 text-muted-foreground" />
                          <TranslatedUIText text="My Lists" />
                          {listsCount > 0 && (
                            <Badge variant="secondary" className="ml-auto">{listsCount}</Badge>
                          )}
                        </Link>
                      </nav>
                    </div>

                    <Separator />

                    {/* Support Section */}
                    <div className="p-2">
                      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <TranslatedUIText text="Support" />
                      </p>
                      <nav className="flex flex-col" role="navigation" aria-label="Support navigation">
                        <Link
                          href={getNavPath('/account/tickets')}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base hover:bg-muted active:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Ticket className="h-5 w-5 text-muted-foreground" />
                          <TranslatedUIText text="Help & Support" />
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </Link>
                        <Link
                          href={getNavPath('/track')}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-base hover:bg-muted active:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <TranslatedUIText text="Track Order" />
                          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                        </Link>
                      </nav>
                    </div>
                  </>
                )}

                <Separator />

                {/* Settings Section */}
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <TranslatedUIText text="Settings" />
                  </p>
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base"><TranslatedUIText text="Language" /></span>
                    </div>
                    <LanguageSelector variant="compact" />
                  </div>
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="text-base"><TranslatedUIText text="Currency" /></span>
                    </div>
                    <CurrencySelector variant="compact" />
                  </div>
                </div>

                {/* Auth Actions */}
                <div className="mt-auto p-4 border-t">
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-[var(--color-error)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      <TranslatedUIText text="Sign Out" />
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href={getNavPath('/login')}>
                          <TranslatedUIText text="Sign In" />
                        </Link>
                      </Button>
                      <Button
                        variant="tenant-primary"
                        className="flex-1"
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href={getNavPath('/register')}>
                          <TranslatedUIText text="Sign Up" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link
              href={getNavPath('/')}
              className="flex items-center gap-2.5 shrink-0"
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-background border border-border/40 shadow-sm flex items-center justify-center flex-shrink-0">
                <Image
                  src={settings.logoUrl || '/logo.png'}
                  alt={tenant?.name || 'Store'}
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold gradient-text">
                {tenant?.name || 'Store'}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {allNavLinks.map((link) => (
                link.children && link.children.length > 0 ? (
                  // Dropdown menu for nav links with children
                  <DropdownMenu key={link.id}>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        <TranslatedUIText text={link.label} />
                        {link.badge && (
                          <Badge
                            className="ml-1 text-[10px] px-1.5 py-0"
                            style={link.badgeColor ? { backgroundColor: link.badgeColor } : undefined}
                          >
                            {link.badge}
                          </Badge>
                        )}
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {link.children.map((child) => (
                        <DropdownMenuItem key={child.id} asChild>
                          <Link
                            href={child.isExternal ? child.href : getNavPath(child.href)}
                            target={child.isExternal ? '_blank' : undefined}
                            rel={child.isExternal ? 'noopener noreferrer' : undefined}
                            className="flex items-center justify-between"
                          >
                            <TranslatedUIText text={child.label} />
                            {child.badge && (
                              <Badge
                                className="text-[10px] px-1.5 py-0"
                                style={child.badgeColor ? { backgroundColor: child.badgeColor } : undefined}
                              >
                                {child.badge}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  // Regular link without dropdown
                  <Link
                    key={link.id}
                    href={link.isExternal ? link.href : getNavPath(link.href)}
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <TranslatedUIText text={link.label} />
                    {link.badge && (
                      <Badge
                        className="ml-1 text-[10px] px-1.5 py-0"
                        style={link.badgeColor ? { backgroundColor: link.badgeColor } : undefined}
                      >
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                )
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Currency Selector - Desktop only */}
              <CurrencySelector variant="compact" className="hidden md:block" />

              {/* Language Selector - Desktop only */}
              <LanguageSelector variant="compact" className="hidden md:block" />

              {/* Search - Touch optimized */}
              {headerConfig.showSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="relative h-10 w-10"
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              )}

              {/* Loyalty Points - Desktop only when authenticated and enrolled */}
              {isAuthenticated && isProgramActive && isEnrolled && (
                <Link href={getNavPath('/account/loyalty')} className="hidden lg:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 h-9 px-3 bg-[var(--loyalty-accent)]/10 hover:bg-[var(--loyalty-accent)]/20 border border-[var(--loyalty-accent)]/30 text-[var(--loyalty-accent)]"
                  >
                    <Star className="h-4 w-4 fill-[var(--loyalty-accent)] text-[var(--loyalty-accent)]" />
                    <span className="text-sm font-semibold">{pointsBalance.toLocaleString()}</span>
                    <span className="text-xs opacity-80">pts</span>
                  </Button>
                </Link>
              )}

              {/* My Lists - Hidden on small mobile, visible on larger screens */}
              <Link href={getNavPath('/account/lists')} className="hidden xs:block">
                <Button variant="ghost" size="icon" className="relative h-10 w-10">
                  <Heart className="h-5 w-5" />
                  {listsCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[var(--wishlist-active)] text-white"
                    >
                      {listsCount > 99 ? '99+' : listsCount}
                    </Badge>
                  )}
                  <span className="sr-only">My Lists ({listsCount} items)</span>
                </Button>
              </Link>

              {/* Notifications - only shown when authenticated, hidden on small mobile */}
              <div className="hidden xs:block">
                <NotificationBell />
              </div>

              {/* Cart - Always visible, touch optimized */}
              {headerConfig.showCart && (
                <Link href={getNavPath('/cart')}>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-tenant-primary text-on-tenant-primary"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </Badge>
                    )}
                    <span className="sr-only">Cart ({cartCount} items)</span>
                  </Button>
                </Link>
              )}

              {/* Account */}
              {headerConfig.showAccount && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      {isAuthLoading ? (
                        <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
                      ) : isAuthenticated ? (
                        <CustomerAvatar className="h-7 w-7 text-xs" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                      <span className="sr-only">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {isAuthLoading ? (
                      <div className="px-4 py-6 flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2 w-full">
                          <div className="h-3 w-24 mx-auto bg-muted animate-pulse rounded" />
                          <div className="h-3 w-32 mx-auto bg-muted animate-pulse rounded" />
                        </div>
                      </div>
                    ) : isAuthenticated ? (
                      <>
                        <div className="px-2 py-2 border-b">
                          <p className="font-medium">{customer?.firstName} {customer?.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{customer?.email}</p>
                        </div>
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/account')} className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <TranslatedUIText text="My Account" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/account/orders')} className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <TranslatedUIText text="Orders" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/account/wishlist')} className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <TranslatedUIText text="Wishlist" />
                          </Link>
                        </DropdownMenuItem>
                        {isProgramActive && (
                          <DropdownMenuItem asChild>
                            <Link href={getNavPath('/account/loyalty')} className="flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              <TranslatedUIText text="Loyalty Points" />
                              {isEnrolled && (
                                <span className="ml-auto text-xs text-[var(--loyalty-accent)] font-medium">
                                  {pointsBalance.toLocaleString()}
                                </span>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/gift-cards')} className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            <TranslatedUIText text="Gift Cards" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/account/settings')} className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <TranslatedUIText text="Settings" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="flex items-center gap-2 text-[var(--color-error)] focus:text-[var(--color-error)]"
                        >
                          <LogOut className="h-4 w-4" />
                          <TranslatedUIText text="Sign Out" />
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <div className="px-2 py-3 text-center border-b">
                          <p className="text-sm text-muted-foreground">
                            <TranslatedUIText text="Welcome to" /> {tenant?.name}
                          </p>
                        </div>
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/login')} className="flex items-center justify-center font-medium">
                            <TranslatedUIText text="Sign In" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/register')} className="flex items-center justify-center text-tenant-primary">
                            <TranslatedUIText text="Create Account" />
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={getNavPath('/gift-cards')} className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            <TranslatedUIText text="Gift Cards" />
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ExternalLink,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  X,
  ShoppingCart,
  Search,
  User,
  Menu,
  Star,
  Heart,
  Package,
  Truck,
  Shield,
  Zap,
  ArrowRight,
  Moon,
  Sun,
  Eye,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StorefrontSettings, THEME_PRESETS, ColorMode } from '@/lib/api/types';
import { buildStorefrontUrl } from '@/lib/utils/tenant';
import type { ContentPage } from '@/lib/types/settings';

type DeviceMode = 'mobile' | 'tablet' | 'desktop';
type PreviewMode = 'quick' | 'live';

interface LivePreviewProps {
  settings?: StorefrontSettings | null;
  tenantSlug?: string;
  className?: string;
  contentPages?: ContentPage[];
}

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%',
};

const DEVICE_LABELS: Record<DeviceMode, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
};

// Mock products for preview
const MOCK_PRODUCTS = [
  { id: '1', name: 'Wireless Charging Pad', price: '$39.99', originalPrice: '$59.99', image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=300&h=300&fit=crop', rating: 4.5, badge: 'Sale' },
  { id: '2', name: 'Smart Fitness Watch', price: '$199.99', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop', rating: 4.8, badge: 'Low Stock' },
  { id: '3', name: 'Portable Bluetooth Speaker', price: '$89.99', originalPrice: '$129.99', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop', rating: 4.2, badge: 'Sale' },
  { id: '4', name: 'Wireless Bluetooth Headphones', price: '$149.99', originalPrice: '$199.99', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', rating: 4.6, badge: 'Sale' },
];

// Default placeholder images when no custom assets are set
const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=800&fit=crop&q=80';
const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=400&fit=crop&q=80';

export function LivePreview({ settings, tenantSlug, className, contentPages = [] }: LivePreviewProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [modalDeviceMode, setModalDeviceMode] = useState<DeviceMode>('desktop');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [previewDarkMode, setPreviewDarkMode] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('quick');
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const modalIframeRef = useRef<HTMLIFrameElement>(null);

  // Filter content pages for display
  const menuPages = contentPages.filter((p) => p.showInMenu && p.status === 'PUBLISHED');
  const footerPages = contentPages.filter((p) => p.showInFooter && p.status === 'PUBLISHED');

  // Handle ESC key to close fullscreen modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreenOpen) {
      setIsFullscreenOpen(false);
    }
  }, [isFullscreenOpen]);

  useEffect(() => {
    if (isFullscreenOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFullscreenOpen, handleKeyDown]);

  // Set initial dark mode based on settings
  useEffect(() => {
    const colorMode = settings?.colorMode || 'both';
    if (colorMode === 'dark') {
      setPreviewDarkMode(true);
    } else if (colorMode === 'light') {
      setPreviewDarkMode(false);
    }
    // 'both' and 'system' keep current state or user's choice
  }, [settings?.colorMode]);

  // Send settings updates to iframe via postMessage
  const sendSettingsToIframe = useCallback(() => {
    if (!settings) return;

    const message = {
      type: 'STOREFRONT_SETTINGS_UPDATE',
      payload: settings,
    };

    // Send to main iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(message, '*');
    }

    // Send to modal iframe
    if (modalIframeRef.current?.contentWindow) {
      modalIframeRef.current.contentWindow.postMessage(message, '*');
    }
  }, [settings]);

  // Debounced settings sync for live preview
  useEffect(() => {
    if (previewMode !== 'live') return;

    const debounceTimer = setTimeout(() => {
      sendSettingsToIframe();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [settings, previewMode, sendSettingsToIframe]);

  // Handle iframe refresh
  const handleRefreshIframe = useCallback(() => {
    if (iframeRef.current) {
      setIsIframeLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
    if (modalIframeRef.current) {
      modalIframeRef.current.src = modalIframeRef.current.src;
    }
  }, []);

  // Get the storefront URL for live preview - uses dynamic domain detection
  const getStorefrontPreviewUrl = useCallback(() => {
    if (!tenantSlug) return '';
    return buildStorefrontUrl(tenantSlug, '?preview=true');
  }, [tenantSlug]);

  const DeviceButton = ({
    mode,
    icon: Icon,
    isModal = false,
  }: {
    mode: DeviceMode;
    icon: React.ElementType;
    isModal?: boolean;
  }) => {
    const currentMode = isModal ? modalDeviceMode : deviceMode;
    const setMode = isModal ? setModalDeviceMode : setDeviceMode;

    return (
      <button
        type="button"
        onClick={() => setMode(mode)}
        title={DEVICE_LABELS[mode]}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentMode === mode
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  };

  const handleOpenFullscreen = () => {
    setModalDeviceMode(deviceMode);
    setIsFullscreenOpen(true);
  };

  // Check if dark mode toggle should be shown based on colorMode setting
  const canToggleDarkMode = !settings?.colorMode || settings.colorMode === 'both';
  const forcedDarkMode = settings?.colorMode === 'dark';
  const forcedLightMode = settings?.colorMode === 'light';
  const isDarkMode = forcedDarkMode || (canToggleDarkMode && previewDarkMode);

  // Get current theme preset
  const themePreset = settings
    ? THEME_PRESETS.find(p => p.id === settings.themeTemplate)
    : THEME_PRESETS[0];

  const primaryColor = settings?.primaryColor || themePreset?.primaryColor || '#8B5CF6';
  const secondaryColor = settings?.secondaryColor || themePreset?.secondaryColor || '#EC4899';
  const accentColor = settings?.accentColor || themePreset?.accentColor || '#F59E0B';

  // Typography settings from config
  const headingFont = settings?.typographyConfig?.headingFont || settings?.fontSecondary || 'Inter';
  const bodyFont = settings?.typographyConfig?.bodyFont || settings?.fontPrimary || 'Inter';
  const baseFontSize = settings?.typographyConfig?.baseFontSize || 16;

  // Border radius from spacing config
  const getBorderRadius = (radius?: string) => {
    switch (radius) {
      case 'none': return '0px';
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '12px';
      case 'full': return '9999px';
      default: return '8px';
    }
  };
  const borderRadius = getBorderRadius(settings?.spacingStyleConfig?.borderRadius);
  // Use same border radius for buttons (can be customized if buttonRadius is added later)
  const buttonRadius = borderRadius;

  // Embedded Preview Component - matches actual storefront
  const EmbeddedPreview = ({ currentDeviceMode = deviceMode }: { currentDeviceMode?: DeviceMode }) => {
    const isMobile = currentDeviceMode === 'mobile';

    // Background and text colors based on dark mode
    const bgColor = isDarkMode ? '#0f172a' : '#ffffff';
    const bgColorMuted = isDarkMode ? '#1e293b' : '#f8fafc';
    const textColor = isDarkMode ? '#f1f5f9' : '#1e293b';
    const textColorMuted = isDarkMode ? '#94a3b8' : '#64748b';
    const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
    const cardBg = isDarkMode ? '#1e293b' : '#ffffff';

    return (
      <div
        className="w-full h-full overflow-y-auto"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          fontFamily: `${bodyFont}, system-ui, sans-serif`,
          fontSize: `${baseFontSize}px`,
        }}
      >
        {/* Announcement Bar */}
        {settings?.headerConfig?.showAnnouncement && settings.headerConfig.announcementText && (
          <div
            className="text-center py-2 text-xs sm:text-sm"
            style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
          >
            {settings.headerConfig.announcementText}
          </div>
        )}

        {/* Header - Matches storefront header.tsx */}
        <header
          className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between"
          style={{ borderColor, backgroundColor: bgColor }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-6 sm:h-8 object-contain" />
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className="text-white px-1.5 sm:px-2 py-0.5 rounded-md font-bold text-sm sm:text-base"
                  style={{ backgroundColor: primaryColor }}
                >
                  T
                </div>
                <span className="font-bold text-sm sm:text-lg" style={{ color: textColor }}>
                  Tesseract
                </span>
              </div>
            )}
            {!isMobile && (
              <nav className="flex gap-3 sm:gap-4 text-xs sm:text-sm ml-2 sm:ml-4">
                <span className="hover:opacity-70 cursor-pointer" style={{ color: textColorMuted }}>Products</span>
                <span className="hover:opacity-70 cursor-pointer" style={{ color: textColorMuted }}>Categories</span>
                <span className="hover:opacity-70 cursor-pointer" style={{ color: textColorMuted }}>Search</span>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {settings?.headerConfig?.showSearch && <Search className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />}
            {/* Color mode toggle preview */}
            {canToggleDarkMode && (
              <button
                type="button"
                onClick={() => setPreviewDarkMode(!previewDarkMode)}
                className="p-1 rounded-lg hover:opacity-70"
              >
                {isDarkMode ? (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />
                ) : (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />
                )}
              </button>
            )}
            {settings?.headerConfig?.showAccount && <User className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />}
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />
            {settings?.headerConfig?.showCart && <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />}
            {isMobile && <Menu className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: textColorMuted }} />}
          </div>
        </header>

        {/* Hero Section - Full gradient or image like actual storefront */}
        {settings?.homepageConfig?.heroEnabled && (
          <section
            className="relative py-8 sm:py-12 lg:py-16 px-3 sm:px-4 overflow-hidden"
            style={{
              background: settings?.homepageConfig?.heroImage
                ? `url(${settings.homepageConfig.heroImage})`
                : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Overlay for hero image */}
            {settings?.homepageConfig?.heroImage && (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}${Math.round((settings?.homepageConfig?.heroOverlayOpacity || 0.4) * 255).toString(16).padStart(2, '0')} 0%, ${secondaryColor}${Math.round((settings?.homepageConfig?.heroOverlayOpacity || 0.4) * 255).toString(16).padStart(2, '0')} 100%)`,
                }}
              />
            )}
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute -top-1/2 -left-1/4 w-1/2 h-full rounded-full blur-3xl opacity-30"
                style={{ backgroundColor: 'white' }}
              />
              <div
                className="absolute -bottom-1/4 -right-1/4 w-1/2 h-full rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: 'white' }}
              />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-4 tracking-tight"
                style={{ fontFamily: `${headingFont}, system-ui, sans-serif` }}
              >
                {settings.homepageConfig.heroTitle || 'Welcome to Our Store'}
              </h1>
              <p className="text-sm sm:text-base text-white/90 mb-4 sm:mb-6 max-w-xl mx-auto">
                {settings.homepageConfig.heroSubtitle || 'Discover amazing products at great prices'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  className="px-4 sm:px-6 py-2 sm:py-2.5 font-semibold text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                  style={{ backgroundColor: '#ffffff', color: '#1f2937', borderRadius: buttonRadius }}
                >
                  {settings.homepageConfig.heroCtaText || 'Shop Now'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  className="px-4 sm:px-6 py-2 sm:py-2.5 font-semibold text-sm sm:text-base border-2 border-white/30 text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                  style={{ borderRadius: buttonRadius }}
                >
                  New Arrivals
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Feature Cards Section - Matches storefront */}
        <section className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4" style={{ backgroundColor: bgColor }}>
          <div className="max-w-4xl mx-auto">
            <div className={cn("grid gap-2 sm:gap-4", isMobile ? "grid-cols-2" : "grid-cols-4")}>
              {[
                { icon: Package, title: 'Product Catalog', desc: 'Browse our collection', color: primaryColor },
                { icon: ShoppingCart, title: 'Shopping Cart', desc: 'Seamless checkout', color: secondaryColor },
                { icon: Truck, title: 'Order Tracking', desc: 'Track orders easily', color: primaryColor },
                { icon: Shield, title: 'Secure Payments', desc: 'Protected transactions', color: accentColor },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="p-2 sm:p-4 transition-shadow hover:shadow-lg"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: borderRadius,
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="p-2 sm:p-3 rounded-full mb-2"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: feature.color }} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold" style={{ color: textColor }}>
                      {feature.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: textColorMuted }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges - Matches storefront */}
        <section
          className="py-2 sm:py-4 border-y"
          style={{ backgroundColor: bgColorMuted, borderColor }}
        >
          <div className="px-3 sm:px-4">
            <div className="grid grid-cols-4 gap-1 sm:gap-4">
              {[
                { icon: Truck, text: 'Free Shipping', color: primaryColor },
                { icon: Shield, text: 'Secure', color: secondaryColor },
                { icon: Star, text: 'Top Rated', color: accentColor },
                { icon: Zap, text: 'Fast Delivery', color: primaryColor },
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center justify-center gap-1">
                  <badge.icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: badge.color }} />
                  <span className="text-[8px] sm:text-xs font-medium" style={{ color: textColorMuted }}>
                    {badge.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4" style={{ backgroundColor: bgColor }}>
          <h2
            className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center"
            style={{ color: textColor, fontFamily: `${headingFont}, system-ui, sans-serif` }}
          >
            Featured Products
          </h2>
          <p className="text-xs sm:text-sm text-center mb-4" style={{ color: textColorMuted }}>
            Trending Now • Popular products this week
          </p>
          <div
            className="grid gap-2 sm:gap-4"
            style={{
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : `repeat(${settings?.productConfig?.gridColumns || 4}, 1fr)`,
            }}
          >
            {MOCK_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className={cn(
                  'overflow-hidden transition-all group',
                  settings?.productConfig?.hoverEffect === 'zoom' && 'hover:scale-[1.02]',
                )}
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: borderRadius,
                }}
              >
                <div className="relative overflow-hidden aspect-square bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {settings?.productConfig?.showWishlist && (
                    <button className="absolute top-1 sm:top-2 right-1 sm:right-2 p-1 bg-card rounded-full shadow-sm">
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </button>
                  )}
                  {settings?.productConfig?.showSaleBadge && product.badge && (
                    <span
                      className="absolute top-1 sm:top-2 left-1 sm:left-2 px-1 sm:px-2 py-0.5 text-[8px] sm:text-xs font-medium rounded text-white"
                      style={{ backgroundColor: product.badge === 'Sale' ? '#ef4444' : accentColor }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
                <div className="p-2 sm:p-3">
                  <h3 className="text-[10px] sm:text-sm font-medium truncate" style={{ color: textColor }}>
                    {product.name}
                  </h3>
                  {settings?.productConfig?.showRatings && (
                    <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-400 text-warning" />
                      <span className="text-[8px] sm:text-xs" style={{ color: textColorMuted }}>
                        {product.rating}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                    <p className="text-xs sm:text-sm font-semibold" style={{ color: primaryColor }}>
                      {product.price}
                    </p>
                    {product.originalPrice && (
                      <p className="text-[8px] sm:text-xs line-through" style={{ color: textColorMuted }}>
                        {product.originalPrice}
                      </p>
                    )}
                  </div>
                  <button
                    className="mt-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 w-full font-medium text-white"
                    style={{ backgroundColor: primaryColor, borderRadius: buttonRadius }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        {settings?.homepageConfig?.showNewsletter && (
          <div
            className="py-6 sm:py-8 px-3 sm:px-4 text-center mt-2"
            style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` }}
          >
            <h3
              className="font-semibold text-sm sm:text-base mb-1 sm:mb-2"
              style={{ color: textColor, fontFamily: `${headingFont}, system-ui, sans-serif` }}
            >
              {settings.homepageConfig.newsletterTitle || 'Subscribe to our newsletter'}
            </h3>
            <p className="text-xs sm:text-sm mb-2 sm:mb-3" style={{ color: textColorMuted }}>
              {settings.homepageConfig.newsletterSubtitle || 'Get updates on new products'}
            </p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                style={{
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  borderRadius: borderRadius,
                }}
              />
              <button
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium"
                style={{ backgroundColor: primaryColor, borderRadius: buttonRadius }}
              >
                Subscribe
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {settings?.footerConfig?.showFooter && (
          <footer
            className="mt-4 sm:mt-6 py-4 sm:py-6 px-3 sm:px-4 border-t"
            style={{ borderColor, backgroundColor: bgColor }}
          >
            {footerPages.length > 0 && (
              <div className="flex justify-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                {footerPages.map((page) => (
                  <span
                    key={page.id}
                    className="hover:opacity-70 cursor-pointer"
                    style={{ color: primaryColor }}
                  >
                    {page.title}
                  </span>
                ))}
              </div>
            )}
            <div className="text-center text-xs sm:text-sm" style={{ color: textColorMuted }}>
              {settings.footerConfig.copyrightText || '© 2024 Your Store. All rights reserved.'}
            </div>
            {settings.footerConfig.showPoweredBy && (
              <div className="text-center text-[10px] sm:text-xs mt-1 sm:mt-2" style={{ color: textColorMuted }}>
                Powered by Tesserix
              </div>
            )}
          </footer>
        )}
      </div>
    );
  };

  // LivePreviewIframe component for rendering actual storefront
  const LivePreviewIframe = ({
    iframeRefProp,
    deviceModeOverride
  }: {
    iframeRefProp?: React.RefObject<HTMLIFrameElement | null>;
    deviceModeOverride?: DeviceMode;
  }) => {
    const previewUrl = getStorefrontPreviewUrl();
    const currentRef = iframeRefProp || iframeRef;

    if (!tenantSlug) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground">
          <ExternalLink className="h-8 w-8 mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">No storefront configured</p>
          <p className="text-xs text-muted-foreground mt-1">Set up a storefront slug to enable live preview</p>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {isIframeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
              <span className="text-xs text-muted-foreground">Loading storefront...</span>
            </div>
          </div>
        )}
        <iframe
          ref={currentRef}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Storefront Preview"
          onLoad={() => {
            setIsIframeLoading(false);
            // Send initial settings after iframe loads
            setTimeout(sendSettingsToIframe, 500);
          }}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col bg-card rounded-xl border border-border overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">Preview</h3>

          {/* Preview Mode Toggle */}
          <div className="flex items-center bg-card rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode('quick')}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                previewMode === 'quick'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Quick
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewMode('live');
                setIsIframeLoading(true);
              }}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1",
                previewMode === 'live'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Eye className="h-3 w-3" />
              Live
            </button>
          </div>

          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
          >
            {themePreset?.name || 'Custom'}
          </span>

          {/* Dark mode indicator - only show in quick mode */}
          {previewMode === 'quick' && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isDarkMode ? "bg-sidebar text-sidebar-foreground" : "bg-warning-muted text-warning-foreground"
            )}>
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Dark mode toggle for preview - only in quick mode */}
          {previewMode === 'quick' && canToggleDarkMode && (
            <button
              type="button"
              onClick={() => setPreviewDarkMode(!previewDarkMode)}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              className={cn(
                "p-2 rounded-lg transition-colors mr-2",
                "hover:bg-muted text-muted-foreground"
              )}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* Refresh button - only in live mode */}
          {previewMode === 'live' && (
            <button
              type="button"
              onClick={handleRefreshIframe}
              title="Refresh preview"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors mr-2"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}

          {/* Device mode buttons */}
          <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-card rounded-lg border border-border">
            <DeviceButton mode="mobile" icon={Smartphone} />
            <DeviceButton mode="tablet" icon={Tablet} />
            <DeviceButton mode="desktop" icon={Monitor} />
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={handleOpenFullscreen}
            title="Open fullscreen preview"
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Open in new tab - only in live mode */}
          {previewMode === 'live' && tenantSlug && (
            <a
              href={getStorefrontPreviewUrl()}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Preview container */}
      <div className="flex-1 bg-muted p-4 overflow-auto">
        <div
          className="mx-auto bg-card rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{
            width: DEVICE_WIDTHS[deviceMode],
            maxWidth: '100%',
            height: 'calc(100vh - 200px)',
            minHeight: '400px',
          }}
        >
          {previewMode === 'quick' ? (
            <EmbeddedPreview currentDeviceMode={deviceMode} />
          ) : (
            <LivePreviewIframe deviceModeOverride={deviceMode} />
          )}
        </div>
      </div>

      {/* Device indicator */}
      <div className="px-4 py-2 bg-muted border-t border-border text-center">
        <span className="text-xs text-muted-foreground">
          {DEVICE_LABELS[deviceMode]} view
          {deviceMode !== 'desktop' && (
            <> ({DEVICE_WIDTHS[deviceMode]})</>
          )}
          {previewMode === 'live' && (
            <span className="ml-2 text-primary">• Live updates enabled</span>
          )}
        </span>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreenOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-foreground border-b border-muted-foreground">
            <div className="flex items-center gap-4">
              <h3 className="font-medium text-white">Fullscreen Preview</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
              >
                {themePreset?.name || 'Custom'}
              </span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                isDarkMode ? "bg-sidebar-accent text-sidebar-foreground" : "bg-warning-muted text-warning-foreground"
              )}>
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark mode toggle for modal */}
              {canToggleDarkMode && (
                <button
                  type="button"
                  onClick={() => setPreviewDarkMode(!previewDarkMode)}
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  className="p-2 rounded-lg hover:bg-muted-foreground text-muted-foreground transition-colors"
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}

              {/* Device mode buttons for modal */}
              <div className="flex items-center gap-1 px-2 py-1 bg-foreground/80 rounded-lg">
                <DeviceButton mode="mobile" icon={Smartphone} isModal />
                <DeviceButton mode="tablet" icon={Tablet} isModal />
                <DeviceButton mode="desktop" icon={Monitor} isModal />
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                title="Close fullscreen (ESC)"
                className="p-2 rounded-lg hover:bg-muted-foreground text-muted-foreground transition-colors ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Modal Preview Container */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <div
              className="bg-card rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
              style={{
                width: DEVICE_WIDTHS[modalDeviceMode],
                maxWidth: modalDeviceMode === 'desktop' ? '100%' : undefined,
                height: 'calc(100vh - 140px)',
                maxHeight: '100%',
              }}
            >
              {previewMode === 'quick' ? (
                <EmbeddedPreview currentDeviceMode={modalDeviceMode} />
              ) : (
                <LivePreviewIframe iframeRefProp={modalIframeRef} deviceModeOverride={modalDeviceMode} />
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-4 py-2 bg-foreground border-t border-muted-foreground text-center">
            <span className="text-xs text-muted-foreground">
              {DEVICE_LABELS[modalDeviceMode]} view
              {modalDeviceMode !== 'desktop' && (
                <> ({DEVICE_WIDTHS[modalDeviceMode]})</>
              )}
              {previewMode === 'live' && (
                <span className="ml-2 text-primary">• Live</span>
              )}
              {' '} • Press ESC to close
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default LivePreview;

'use client';

import Link from 'next/link';
import {
  Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, ExternalLink,
  Shield, Truck, RefreshCw, Headphones, BadgeCheck, Lock, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenant, useFooterConfig, useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { PaymentMethod, TrustBadge } from '@/types/storefront';

// Trust badge icon mapping
const TRUST_BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Truck,
  RefreshCw,
  Headphones,
  BadgeCheck,
  Lock,
  Award,
};

// Payment method SVG icons - using brand colors for payment logos (industry standard, not customizable)
// These are official brand colors required for brand recognition and compliance
// Container backgrounds use theme tokens, but logo colors are fixed brand colors
const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  visa: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[var(--surface-default)] rounded-md border border-[var(--border-default)] flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 48 32" className="w-7 h-4 sm:w-8 sm:h-5">
        <path fill="#1434CB" d="M18.5 21.5h-3l1.9-11.7h3l-1.9 11.7zm8.5-11.4c-.6-.2-1.5-.5-2.7-.5-3 0-5.1 1.5-5.1 3.6 0 1.6 1.4 2.4 2.5 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.2 0-1.8-.2-2.7-.6l-.4-.2-.4 2.4c.7.3 1.9.5 3.2.5 3.1 0 5.2-1.5 5.2-3.7 0-1.2-.8-2.2-2.5-3-.8-.5-1.4-.8-1.4-1.4 0-.5.4-.9 1.4-.9.8 0 1.4.2 1.8.4l.2.1.4-2.3zm7.5-.3h-2.3c-.7 0-1.3.2-1.6 1l-4.5 10.7h3.1l.6-1.7h3.8l.4 1.7h2.8l-2.4-11.7zm-3.7 7.6l1.2-3.2.3-.8.2.7.7 3.3h-2.4zM15 9.8l-2.9 8-1.6-8.1c-.2-.8-.7-1.1-1.4-1.1H5l-.1.3c1.1.3 2.4.7 3.1 1.2.5.3.6.5.7 1.1l2.3 8.8h3.1l4.8-10.2H15z"/>
      </svg>
    </div>
  ),
  mastercard: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[var(--surface-default)] rounded-md border border-[var(--border-default)] flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 48 32" className="w-7 h-4 sm:w-8 sm:h-5">
        <circle fill="#EB001B" cx="18" cy="16" r="9"/>
        <circle fill="#F79E1B" cx="30" cy="16" r="9"/>
        <path fill="#FF5F00" d="M24 9.5c2.2 1.8 3.6 4.5 3.6 7.5s-1.4 5.7-3.6 7.5c-2.2-1.8-3.6-4.5-3.6-7.5s1.4-5.7 3.6-7.5z"/>
      </svg>
    </div>
  ),
  amex: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[#016FD0] rounded-md flex items-center justify-center shadow-sm">
      <span className="text-white text-[7px] sm:text-[8px] font-bold leading-tight text-center">AMEX</span>
    </div>
  ),
  discover: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[var(--surface-default)] rounded-md border border-[var(--border-default)] flex items-center justify-center shadow-sm">
      <span className="text-[#FF6000] text-[7px] sm:text-[8px] font-bold">DISCOVER</span>
    </div>
  ),
  paypal: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[var(--surface-default)] rounded-md border border-[var(--border-default)] flex items-center justify-center shadow-sm">
      <svg viewBox="0 0 48 32" className="w-7 h-4 sm:w-8 sm:h-5">
        <path fill="#003087" d="M18.4 8h-5.8c-.4 0-.7.3-.8.6l-2.4 15c0 .3.2.5.5.5h2.8c.4 0 .7-.3.8-.6l.6-4.1c0-.4.4-.7.8-.7h1.8c3.7 0 5.9-1.8 6.4-5.3.2-1.5 0-2.7-.7-3.6-.7-1-2.1-1.6-4-1.6z"/>
        <path fill="#009CDE" d="M34.4 8h-5.8c-.4 0-.7.3-.8.6l-2.4 15c0 .3.2.5.5.5h3c.3 0 .5-.2.5-.4l.7-4.3c0-.4.4-.7.8-.7h1.8c3.7 0 5.9-1.8 6.4-5.3.2-1.5 0-2.7-.7-3.6-.7-1-2.1-1.6-4-1.6z"/>
      </svg>
    </div>
  ),
  apple_pay: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-foreground rounded-md flex items-center justify-center shadow-sm">
      <span className="text-background text-[7px] sm:text-[8px] font-medium"> Pay</span>
    </div>
  ),
  google_pay: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[var(--surface-default)] rounded-md border border-[var(--border-default)] flex items-center justify-center shadow-sm">
      <span className="text-[7px] sm:text-[8px] font-medium text-foreground"><span className="text-[#4285F4]">G</span> Pay</span>
    </div>
  ),
  stripe: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[#635BFF] rounded-md flex items-center justify-center shadow-sm">
      <span className="text-white text-[7px] sm:text-[8px] font-bold">stripe</span>
    </div>
  ),
  afterpay: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[#B2FCE4] rounded-md flex items-center justify-center shadow-sm">
      <span className="text-foreground text-[6px] sm:text-[7px] font-bold">Afterpay</span>
    </div>
  ),
  klarna: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[#FFB3C7] rounded-md flex items-center justify-center shadow-sm">
      <span className="text-foreground text-[7px] sm:text-[8px] font-bold">Klarna</span>
    </div>
  ),
  zip: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[#AA8FFF] rounded-md flex items-center justify-center shadow-sm">
      <span className="text-white text-[7px] sm:text-[8px] font-bold">Zip</span>
    </div>
  ),
  bank_transfer: (
    <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[var(--surface-muted)] rounded-md border border-[var(--border-default)] flex items-center justify-center shadow-sm">
      <span className="text-muted-foreground text-[6px] sm:text-[7px] font-medium">Bank</span>
    </div>
  ),
};

// Social icon components with tenant theme colors on hover for consistent branding
const SOCIAL_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }> | (() => React.JSX.Element); hoverColor: string; label: string }> = {
  facebook: {
    icon: Facebook,
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'Facebook'
  },
  twitter: {
    icon: Twitter,
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'Twitter / X'
  },
  x: {
    icon: Twitter,
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'X'
  },
  instagram: {
    icon: Instagram,
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'Instagram'
  },
  linkedin: {
    icon: Linkedin,
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'LinkedIn'
  },
  youtube: {
    icon: Youtube,
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'YouTube'
  },
  tiktok: {
    icon: () => (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'TikTok'
  },
  pinterest: {
    icon: () => (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.46-6.2s-.37-.74-.37-1.84c0-1.72 1-3 2.25-3 1.06 0 1.57.8 1.57 1.75 0 1.07-.68 2.66-1.03 4.14-.3 1.25.63 2.27 1.86 2.27 2.23 0 3.94-2.35 3.94-5.75 0-3-2.16-5.1-5.23-5.1a5.42 5.42 0 0 0-5.66 5.44c0 1.08.42 2.23.94 2.86.1.13.12.24.08.37l-.35 1.42c-.06.22-.18.27-.42.16-1.56-.72-2.54-3-2.54-4.81 0-3.92 2.85-7.52 8.21-7.52 4.31 0 7.67 3.07 7.67 7.18 0 4.28-2.7 7.72-6.45 7.72-1.26 0-2.44-.65-2.85-1.43l-.77 2.95c-.28 1.08-1.04 2.43-1.55 3.26A12 12 0 1 0 12 0z"/>
      </svg>
    ),
    hoverColor: 'hover:bg-[var(--tenant-primary)] hover:border-[var(--tenant-primary)] hover:text-[var(--tenant-primary-foreground)]',
    label: 'Pinterest'
  },
};

// Helper to normalize platform name
function normalizePlatform(platform: string): string {
  return platform.toLowerCase().trim();
}

export function Footer() {
  const { tenant, settings } = useTenant();
  const footerConfig = useFooterConfig();
  const getNavPath = useNavPath();

  if (!footerConfig?.showFooter) {
    return null;
  }

  // Provide safe defaults and deep clone to avoid mutation
  const socialLinks = footerConfig.socialLinks || [];

  // Use admin-configured link groups, with fallback to auto-generated if empty
  const configuredLinkGroups = footerConfig.linkGroups || [];

  // Fallback: Generate links from content pages if no groups are configured
  let linkGroups = configuredLinkGroups;

  if (linkGroups.length === 0) {
    // Build organized footer structure from content pages as fallback
    const contentPages = (settings.contentPages || [])
      .filter((p) => p.status === 'PUBLISHED' && p.showInFooter);

    // Create separate columns for better organization
    const shopLinks = [
      { id: 'products', label: 'All Products', href: '/products', isExternal: false, position: 10 },
      { id: 'new-arrivals', label: 'New Arrivals', href: '/products?sort=newest', isExternal: false, position: 20 },
      { id: 'gift-cards', label: 'Gift Cards', href: '/gift-cards', isExternal: false, position: 30 },
    ];

    // Customer service / support links from content pages
    const supportPages = contentPages.filter(p =>
      ['faq', 'contact', 'shipping', 'returns', 'refund-policy'].some(slug => p.slug.includes(slug))
    );

    const supportLinks = [
      ...supportPages.map((p, idx) => ({
        id: p.id,
        label: p.title,
        href: `/pages/${p.slug}`,
        isExternal: false,
        position: idx * 10
      }))
    ];

    // Legal / policy links
    const policyPages = contentPages.filter(p =>
      ['privacy', 'terms', 'policy'].some(slug => p.slug.includes(slug)) &&
      !supportPages.some(sp => sp.id === p.id)
    );

    const policyLinks = [
      ...policyPages.map((p, idx) => ({
        id: p.id,
        label: p.title,
        href: `/pages/${p.slug}`,
        isExternal: false,
        position: idx * 10
      })),
      { id: 'cancellation-policy', label: 'Cancellation Policy', href: '/cancellation-policy', isExternal: false, position: (policyPages.length) * 10 },
    ];

    // Company / about pages
    const companyPages = contentPages.filter(p =>
      ['about', 'careers', 'press', 'blog'].some(slug => p.slug.includes(slug)) &&
      !supportPages.some(sp => sp.id === p.id) &&
      !policyPages.some(pp => pp.id === p.id)
    );

    const companyLinks = companyPages.map((p, idx) => ({
      id: p.id,
      label: p.title,
      href: `/pages/${p.slug}`,
      isExternal: false,
      position: idx * 10
    }));

    // Build final link groups - only include groups that have links
    linkGroups = [
      { id: 'shop', title: 'Shop', links: shopLinks },
      ...(supportLinks.length > 0 ? [{ id: 'support', title: 'Customer Service', links: supportLinks }] : []),
      ...(companyLinks.length > 0 ? [{ id: 'company', title: 'Company', links: companyLinks }] : []),
      ...(policyLinks.length > 0 ? [{ id: 'legal', title: 'Legal', links: policyLinks }] : []),
    ].filter(g => g.links.length > 0);
  }

  // Always append content pages (About Us, Contact Us) and Cancellation Policy to footer
  // These were moved from the header and must appear in the footer regardless of config
  {
    const menuContentPages = (settings.contentPages || [])
      .filter((p) => p.status === 'PUBLISHED' && p.showInMenu);

    const extraLinks = [
      ...menuContentPages.map((p, idx) => ({
        id: `menu-${p.id}`,
        label: p.title,
        href: `/pages/${p.slug}`,
        isExternal: false,
        position: idx * 10,
      })),
      { id: 'cancellation-policy', label: 'Cancellation Policy', href: '/cancellation-policy', isExternal: false, position: menuContentPages.length * 10 },
    ];

    // Deduplicate against existing footer links
    const existingHrefs = new Set(
      linkGroups.flatMap((g) => g.links.map((l) => l.href))
    );
    const newLinks = extraLinks.filter((l) => !existingHrefs.has(l.href));

    if (newLinks.length > 0) {
      const existingIdx = linkGroups.findIndex(
        (g) => g.id === 'company' || g.id === 'legal' || g.id === 'information'
      );
      if (existingIdx >= 0) {
        linkGroups = linkGroups.map((g, i) =>
          i === existingIdx ? { ...g, links: [...g.links, ...newLinks] } : g
        );
      } else {
        linkGroups = [
          ...linkGroups,
          { id: 'information', title: 'Information', links: newLinks },
        ];
      }
    }
  }

  // Get column layout from config (default to 4)
  const columnLayout = footerConfig.columnLayout || 4;

  // Calculate grid column spans based on column layout
  const getColumnGridClass = () => {
    switch (columnLayout) {
      case 1:
        return 'lg:col-span-12'; // Full width for each group
      case 2:
        return 'lg:col-span-6'; // Half width
      case 3:
        return 'lg:col-span-4'; // Third width
      case 4:
      default:
        return 'lg:col-span-2'; // Quarter width (original behavior)
    }
  };

  // Payment methods from config
  const showPaymentIcons = footerConfig.showPaymentIcons ?? false;
  const paymentMethods: PaymentMethod[] = footerConfig.paymentMethods || [];

  // Trust badges from config
  const showTrustBadges = footerConfig.showTrustBadges ?? false;
  const trustBadges: TrustBadge[] = footerConfig.trustBadges || [];

  const currentYear = new Date().getFullYear();
  const hasSocialLinks = footerConfig.showSocialIcons && socialLinks.length > 0;
  const hasContactInfo = footerConfig.showContactInfo && (footerConfig.contactEmail || footerConfig.contactPhone || footerConfig.contactAddress);
  const hasCustomColors = !!(footerConfig.footerBgColor || footerConfig.footerTextColor);
  const hasTrustBadges = showTrustBadges && trustBadges.length > 0;
  const hasPaymentMethods = showPaymentIcons && paymentMethods.length > 0;

  // Use inherit for text when custom colors are set, otherwise use theme colors
  const textMutedClass = hasCustomColors ? 'opacity-70' : 'text-muted-foreground';
  const textForegroundClass = hasCustomColors ? '' : 'text-foreground';

  // Apply custom footer colors if set - uses CSS custom properties to cascade to children
  const footerStyles: React.CSSProperties = {
    ...(footerConfig.footerBgColor && {
      backgroundColor: footerConfig.footerBgColor,
      '--footer-bg': footerConfig.footerBgColor,
    } as React.CSSProperties),
    ...(footerConfig.footerTextColor && {
      color: footerConfig.footerTextColor,
      '--footer-text': footerConfig.footerTextColor,
      '--footer-text-muted': `color-mix(in srgb, ${footerConfig.footerTextColor} 70%, transparent)`,
    } as React.CSSProperties),
  };

  // Dynamic grid class based on column layout
  const linkColumnClass = getColumnGridClass();

  return (
    <footer
      className={`relative border-t border-[var(--border-default)] ${footerConfig.footerBgColor ? '' : 'bg-[var(--surface-default)]'}`}
      style={footerStyles}
    >
      {/* Solid accent line at top - editorial style (no gradient) */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-[var(--border-strong)]"
      />

      <div className="container-tenant py-8 sm:py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">

          {/* Brand Column - Takes more space */}
          <div className="lg:col-span-4 space-y-6">
            {/* Logo */}
            <Link href={getNavPath('/')} className="inline-block group">
              <img
                src={settings.logoUrl || '/logo.png'}
                alt={tenant?.name || 'Store'}
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Tagline or Description */}
            <p className="text-sm text-muted-foreground max-w-xs">
              <TranslatedUIText text="Your one-stop shop for quality products. We deliver excellence with every purchase." />
            </p>

            {/* Contact Info */}
            {hasContactInfo && (
              <div className="space-y-3">
                {footerConfig.contactEmail && (
                  <a
                    href={`mailto:${footerConfig.contactEmail}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-tenant-primary transition-colors group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-tenant-primary/10 transition-colors">
                      <Mail className="h-4 w-4" />
                    </span>
                    {footerConfig.contactEmail}
                  </a>
                )}
                {footerConfig.contactPhone && (
                  <a
                    href={`tel:${footerConfig.contactPhone}`}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-tenant-primary transition-colors group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-tenant-primary/10 transition-colors">
                      <Phone className="h-4 w-4" />
                    </span>
                    {footerConfig.contactPhone}
                  </a>
                )}
                {footerConfig.contactAddress && (
                  <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className="pt-1.5">{footerConfig.contactAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Social Links - Beautiful circular icons with brand colors */}
            {hasSocialLinks && (
              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  <TranslatedUIText text="Follow Us" />
                </p>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => {
                    const platformKey = normalizePlatform(social.platform);
                    const socialInfo = SOCIAL_ICONS[platformKey];
                    if (!socialInfo) return null;
                    const Icon = socialInfo.icon;

                    return (
                      <a
                        key={social.id || social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                          w-10 h-10 flex items-center justify-center rounded-full
                          border-2 border-muted-foreground/20 text-muted-foreground
                          hover:text-white hover:border-transparent
                          transition-all duration-300 hover:scale-110 hover:shadow-lg
                          ${socialInfo.hoverColor}
                        `}
                        title={socialInfo.label}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="sr-only">{socialInfo.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Link Groups - Dynamic columns based on columnLayout */}
          {linkGroups.map((group) => (
            <div key={group.id} className={linkColumnClass}>
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                <TranslatedUIText text={group.title} />
              </h3>
              <ul className="space-y-2.5">
                {group.links
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.isExternal ? link.href : getNavPath(link.href)}
                        target={link.isExternal ? '_blank' : undefined}
                        rel={link.isExternal ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground hover:text-tenant-primary transition-colors inline-flex items-center gap-1.5"
                      >
                        <TranslatedUIText text={link.label} />
                        {link.isExternal && <ExternalLink className="h-3 w-3" />}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          {footerConfig.showNewsletter && (
            <div className="lg:col-span-4">
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
                <TranslatedUIText text="Stay Updated" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <TranslatedUIText text="Subscribe to our newsletter for exclusive deals, new arrivals, and insider updates." />
              </p>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  // Handle newsletter subscription
                }}
              >
                <div className="flex flex-col xs:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 bg-background/50 border-muted-foreground/20 focus:border-tenant-primary h-11"
                    required
                  />
                  <Button
                    type="submit"
                    variant="tenant-primary"
                    className="shrink-0 px-6 h-11 w-full xs:w-auto"
                  >
                    <TranslatedUIText text="Subscribe" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  <TranslatedUIText text="By subscribing, you agree to our Privacy Policy." />
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-muted-foreground/10">
          {/* Trust Badges - Only show if enabled and has badges */}
          {hasTrustBadges && (
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
              {trustBadges.map((badge) => {
                const IconComponent = badge.icon ? TRUST_BADGE_ICONS[badge.icon] : null;
                const badgeContent = (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--surface-muted)] border border-[var(--border-default)] text-sm"
                  >
                    {badge.imageUrl ? (
                      <img src={badge.imageUrl} alt={badge.label} className="h-5 w-5 object-contain" />
                    ) : IconComponent ? (
                      <IconComponent className="h-5 w-5 text-tenant-primary" />
                    ) : null}
                    <span className="text-muted-foreground font-medium">
                      <TranslatedUIText text={badge.label} />
                    </span>
                  </div>
                );

                if (badge.href) {
                  return (
                    <a
                      key={badge.id}
                      href={badge.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      {badgeContent}
                    </a>
                  );
                }

                return badgeContent;
              })}
            </div>
          )}

          {/* Payment Methods - Only show if enabled and has methods */}
          {hasPaymentMethods && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
              <span className="text-xs text-muted-foreground mr-1 sm:mr-2 w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">
                <TranslatedUIText text="Secure payments:" />
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                {paymentMethods.map((method) => {
                  const icon = PAYMENT_ICONS[method];
                  if (!icon) return null;
                  return (
                    <div key={method}>
                      {icon}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Copyright and Powered By */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-sm text-muted-foreground">
              {footerConfig.copyrightText || `© ${currentYear} ${tenant?.name || 'Store'}. All rights reserved.`}
            </p>

            {/* Powered by badge - respects showPoweredBy config */}
            {footerConfig.showPoweredBy && (
              <p className="text-sm text-muted-foreground">
                <TranslatedUIText text="Powered by" />{' '}
                <a
                  href="https://mark8ly.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-tenant-primary hover:underline transition-colors"
                >
                  Mark8ly
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

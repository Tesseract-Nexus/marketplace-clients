'use client';

import { useState } from 'react';
import {
  Trash2,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Shield,
  CreditCard,
  Image as ImageIcon,
  Columns,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  StorefrontFooterConfig,
  StorefrontFooterLinkGroup,
  StorefrontNavLink,
  PaymentMethod,
  TrustBadge,
} from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { FooterLinkGroupsManager } from './FooterLinkGroupEditor';
import { SocialLinksManager } from './SocialLinkEditor';

// Payment method labels (icons rendered via CreditCard component)
const PAYMENT_METHODS: { id: PaymentMethod; label: string; abbr: string }[] = [
  { id: 'visa', label: 'Visa', abbr: 'V' },
  { id: 'mastercard', label: 'Mastercard', abbr: 'MC' },
  { id: 'amex', label: 'American Express', abbr: 'AX' },
  { id: 'discover', label: 'Discover', abbr: 'D' },
  { id: 'paypal', label: 'PayPal', abbr: 'PP' },
  { id: 'apple_pay', label: 'Apple Pay', abbr: 'AP' },
  { id: 'google_pay', label: 'Google Pay', abbr: 'GP' },
  { id: 'stripe', label: 'Stripe', abbr: 'S' },
  { id: 'afterpay', label: 'Afterpay', abbr: 'AF' },
  { id: 'klarna', label: 'Klarna', abbr: 'K' },
  { id: 'zip', label: 'Zip', abbr: 'Z' },
  { id: 'bank_transfer', label: 'Bank Transfer', abbr: 'BT' },
];

// Default trust badge presets
const TRUST_BADGE_PRESETS = [
  { label: 'Secure Checkout', icon: 'Shield' },
  { label: 'Free Shipping', icon: 'Truck' },
  { label: 'Money Back Guarantee', icon: 'RefreshCw' },
  { label: '24/7 Support', icon: 'Headphones' },
  { label: 'Verified Business', icon: 'BadgeCheck' },
];

interface FooterBuilderProps {
  config: StorefrontFooterConfig;
  onChange: (updates: Partial<StorefrontFooterConfig>) => void;
  disabled?: boolean;
}

export function FooterBuilder({ config, onChange, disabled }: FooterBuilderProps) {
  const [activeSection, setActiveSection] = useState<string | null>('columns');

  const handleTogglePaymentMethod = (method: PaymentMethod) => {
    const current = config.paymentMethods || [];
    const exists = current.includes(method);
    const updated = exists
      ? current.filter((m) => m !== method)
      : [...current, method];
    onChange({ paymentMethods: updated });
  };

  const handleAddTrustBadge = (preset?: { label: string; icon: string }) => {
    const newBadge: TrustBadge = {
      id: crypto.randomUUID(),
      label: preset?.label || 'New Badge',
      icon: preset?.icon,
    };
    onChange({ trustBadges: [...(config.trustBadges || []), newBadge] });
  };

  const handleUpdateTrustBadge = (id: string, updates: Partial<TrustBadge>) => {
    const updated = (config.trustBadges || []).map((badge) =>
      badge.id === id ? { ...badge, ...updates } : badge
    );
    onChange({ trustBadges: updated });
  };

  const handleDeleteTrustBadge = (id: string) => {
    onChange({ trustBadges: (config.trustBadges || []).filter((b) => b.id !== id) });
  };

  const Section = ({
    id,
    title,
    icon: Icon,
    children,
  }: {
    id: string;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => {
    const isOpen = activeSection === id;
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveSection(isOpen ? null : id)}
          className="w-full flex items-center justify-between p-4 bg-muted hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{title}</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {isOpen && <div className="p-4 border-t border-border bg-card">{children}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Show Footer Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <h4 className="font-medium">Footer Visibility</h4>
          <p className="text-sm text-muted-foreground">Show or hide the footer on your storefront</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.showFooter}
            onChange={(e) => onChange({ showFooter: e.target.checked })}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {config.showFooter && (
        <>
          {/* Column Layout */}
          <Section id="columns" title="Link Columns" icon={Columns}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Column Layout</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => onChange({ columnLayout: num as 1 | 2 | 3 | 4 })}
                      className={cn(
                        'p-3 border rounded-lg text-center transition-all',
                        config.columnLayout === num
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div className="flex justify-center gap-1 mb-1">
                        {Array(num).fill(0).map((_, i) => (
                          <div key={i} className="w-3 h-6 bg-current opacity-30 rounded-sm" />
                        ))}
                      </div>
                      <span className="text-xs font-medium">{num} Column{num > 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>

              <FooterLinkGroupsManager
                linkGroups={config.linkGroups || []}
                onChange={(linkGroups) => onChange({ linkGroups })}
              />
            </div>
          </Section>

          {/* Styling */}
          <Section id="styling" title="Colors & Styling" icon={ImageIcon}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.footerBgColor || '#1f2937'}
                    onChange={(e) => onChange({ footerBgColor: e.target.value })}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                    disabled={disabled}
                  />
                  <input
                    type="text"
                    value={config.footerBgColor || '#1f2937'}
                    onChange={(e) => onChange({ footerBgColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.footerTextColor || '#f9fafb'}
                    onChange={(e) => onChange({ footerTextColor: e.target.value })}
                    className="w-10 h-10 rounded border border-border cursor-pointer"
                    disabled={disabled}
                  />
                  <input
                    type="text"
                    value={config.footerTextColor || '#f9fafb'}
                    onChange={(e) => onChange({ footerTextColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: config.footerBgColor || '#1f2937',
                  color: config.footerTextColor || '#f9fafb',
                }}
              >
                <p className="text-sm">This is how your footer colors will look</p>
                <a href="#" className="text-sm underline opacity-80">Sample Link</a>
              </div>
            </div>
          </Section>

          {/* Contact Info */}
          <Section id="contact" title="Contact Information" icon={LinkIcon}>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showContactInfo}
                  onChange={(e) => onChange({ showContactInfo: e.target.checked })}
                  className="rounded border-border text-primary"
                  disabled={disabled}
                />
                <span className="text-sm font-medium">Show contact information</span>
              </label>

              {config.showContactInfo && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={config.contactEmail || ''}
                      onChange={(e) => onChange({ contactEmail: e.target.value })}
                      placeholder="support@example.com"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={config.contactPhone || ''}
                      onChange={(e) => onChange({ contactPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                      value={config.contactAddress || ''}
                      onChange={(e) => onChange({ contactAddress: e.target.value })}
                      placeholder="123 Main St, City, State 12345"
                      rows={2}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Social Links */}
          <Section id="social" title="Social Links" icon={LinkIcon}>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showSocialIcons}
                  onChange={(e) => onChange({ showSocialIcons: e.target.checked })}
                  className="rounded border-border text-primary"
                  disabled={disabled}
                />
                <span className="text-sm font-medium">Show social icons</span>
              </label>

              {config.showSocialIcons && (
                <SocialLinksManager
                  socialLinks={config.socialLinks || []}
                  onChange={(socialLinks) => onChange({ socialLinks })}
                />
              )}
            </div>
          </Section>

          {/* Payment Methods */}
          <Section id="payment" title="Payment Methods" icon={CreditCard}>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showPaymentIcons || false}
                  onChange={(e) => onChange({ showPaymentIcons: e.target.checked })}
                  className="rounded border-border text-primary"
                  disabled={disabled}
                />
                <span className="text-sm font-medium">Show payment method icons</span>
              </label>

              {config.showPaymentIcons && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = (config.paymentMethods || []).includes(method.id);
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => handleTogglePaymentMethod(method.id)}
                        disabled={disabled}
                        className={cn(
                          'p-3 border rounded-lg text-center transition-all text-sm',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/30'
                        )}
                      >
                        <span className="flex items-center justify-center mb-1">
                          <CreditCard className="w-5 h-5" aria-hidden="true" />
                        </span>
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>

          {/* Trust Badges */}
          <Section id="trust" title="Trust Badges" icon={Shield}>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showTrustBadges || false}
                  onChange={(e) => onChange({ showTrustBadges: e.target.checked })}
                  className="rounded border-border text-primary"
                  disabled={disabled}
                />
                <span className="text-sm font-medium">Show trust badges</span>
              </label>

              {config.showTrustBadges && (
                <>
                  {/* Quick add presets */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Quick Add</label>
                    <div className="flex flex-wrap gap-2">
                      {TRUST_BADGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleAddTrustBadge(preset)}
                          disabled={disabled}
                          className="px-3 py-1.5 text-xs border border-border rounded-full hover:bg-muted transition-colors"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Badge list */}
                  <div className="space-y-2">
                    {(config.trustBadges || []).map((badge) => (
                      <div
                        key={badge.id}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <input
                          type="text"
                          value={badge.label}
                          onChange={(e) => handleUpdateTrustBadge(badge.id, { label: e.target.value })}
                          className="flex-1 px-2 py-1 text-sm border border-border rounded"
                          placeholder="Badge text"
                          disabled={disabled}
                        />
                        <select
                          value={badge.icon || ''}
                          onChange={(e) => handleUpdateTrustBadge(badge.id, { icon: e.target.value || undefined })}
                          className="px-2 py-1 text-sm border border-border rounded"
                          disabled={disabled}
                        >
                          <option value="">No icon</option>
                          <option value="Shield">Shield</option>
                          <option value="Truck">Truck</option>
                          <option value="RefreshCw">Refund</option>
                          <option value="Headphones">Support</option>
                          <option value="BadgeCheck">Verified</option>
                          <option value="Lock">Secure</option>
                          <option value="Award">Award</option>
                        </select>
                        <input
                          type="text"
                          value={badge.href || ''}
                          onChange={(e) => handleUpdateTrustBadge(badge.id, { href: e.target.value || undefined })}
                          className="w-32 px-2 py-1 text-sm border border-border rounded"
                          placeholder="Link (optional)"
                          disabled={disabled}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTrustBadge(badge.id)}
                          disabled={disabled}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTrustBadge()}
                      disabled={disabled}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Custom Badge
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Newsletter & Copyright */}
          <Section id="bottom" title="Newsletter & Copyright" icon={LinkIcon}>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showNewsletter}
                  onChange={(e) => onChange({ showNewsletter: e.target.checked })}
                  className="rounded border-border text-primary"
                  disabled={disabled}
                />
                <span className="text-sm font-medium">Show newsletter signup</span>
              </label>

              <div>
                <label className="block text-sm font-medium mb-1">Copyright Text</label>
                <input
                  type="text"
                  value={config.copyrightText || ''}
                  onChange={(e) => onChange({ copyrightText: e.target.value })}
                  placeholder="© 2024 Your Company. All rights reserved."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                  disabled={disabled}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showPoweredBy}
                  onChange={(e) => onChange({ showPoweredBy: e.target.checked })}
                  className="rounded border-border text-primary"
                  disabled={disabled}
                />
                <span className="text-sm font-medium">Show "Powered by" branding</span>
              </label>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

export default FooterBuilder;

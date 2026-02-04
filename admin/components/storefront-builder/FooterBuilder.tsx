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
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
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

// Collapsible section component - defined outside FooterBuilder to prevent re-creation on render
interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: (id: string) => void;
}

function CollapsibleSection({ id, title, icon: Icon, children, isOpen, onToggle }: CollapsibleSectionProps) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
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
}

interface FooterBuilderProps {
  config: StorefrontFooterConfig;
  onChange: (updates: Partial<StorefrontFooterConfig>) => void;
  disabled?: boolean;
}

export function FooterBuilder({ config, onChange, disabled }: FooterBuilderProps) {
  const [activeSection, setActiveSection] = useState<string | null>('columns');

  const handleToggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  // Handle column layout change - sync with linkGroups
  const handleColumnLayoutChange = (newLayout: 1 | 2 | 3 | 4) => {
    const currentGroups = config.linkGroups || [];
    let updatedGroups = [...currentGroups];

    if (newLayout > currentGroups.length) {
      // Add empty columns to match the new layout
      for (let i = currentGroups.length; i < newLayout; i++) {
        updatedGroups.push({
          id: `group-${Date.now()}-${i}`,
          title: `Column ${i + 1}`,
          links: [],
        });
      }
    } else if (newLayout < currentGroups.length) {
      // Trim columns to match the new layout (keep first N columns)
      updatedGroups = updatedGroups.slice(0, newLayout);
    }

    onChange({ columnLayout: newLayout, linkGroups: updatedGroups });
  };

  // Handle link groups change - sync columnLayout if needed
  const handleLinkGroupsChange = (linkGroups: StorefrontFooterLinkGroup[]) => {
    const updates: Partial<StorefrontFooterConfig> = { linkGroups };

    // Auto-update column layout if groups exceed current layout
    if (linkGroups.length > (config.columnLayout || 4)) {
      updates.columnLayout = Math.min(linkGroups.length, 4) as 1 | 2 | 3 | 4;
    }

    onChange(updates);
  };

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

  return (
    <div className="space-y-4">
      {/* Show Footer Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-md">
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
          <CollapsibleSection id="columns" title="Link Columns" icon={Columns} isOpen={activeSection === 'columns'} onToggle={handleToggleSection}>
            {(() => {
              // Compute active layout: use columnLayout if set, otherwise fall back to linkGroups length
              const linkGroupsCount = (config.linkGroups || []).length;
              const activeLayout = config.columnLayout != null ? config.columnLayout : (linkGroupsCount || 4);

              return (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Column Layout</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleColumnLayoutChange(num as 1 | 2 | 3 | 4)}
                          disabled={disabled}
                          className={cn(
                            'p-3 border rounded-md text-center transition-all',
                            activeLayout === num
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-border hover:border-primary/30',
                            disabled && 'opacity-50 cursor-not-allowed'
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
                    <p className="text-xs text-muted-foreground mt-2">
                      Changing layout will add or remove columns to match. Current: {linkGroupsCount} column{linkGroupsCount !== 1 ? 's' : ''} configured.
                    </p>
                  </div>

                  <FooterLinkGroupsManager
                    linkGroups={config.linkGroups || []}
                    onChange={handleLinkGroupsChange}
                    maxColumns={activeLayout}
                  />
                </div>
              );
            })()}
          </CollapsibleSection>

          {/* Styling */}
          <CollapsibleSection id="styling" title="Colors & Styling" icon={ImageIcon} isOpen={activeSection === 'styling'} onToggle={handleToggleSection}>
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
                    className="flex-1 h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
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
                    className="flex-1 h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div
                className="p-4 rounded-md text-center"
                style={{
                  backgroundColor: config.footerBgColor || '#1f2937',
                  color: config.footerTextColor || '#f9fafb',
                }}
              >
                <p className="text-sm">This is how your footer colors will look</p>
                <a href="#" className="text-sm underline opacity-80">Sample Link</a>
              </div>
            </div>
          </CollapsibleSection>

          {/* Contact Info */}
          <CollapsibleSection id="contact" title="Contact Information" icon={LinkIcon} isOpen={activeSection === 'contact'} onToggle={handleToggleSection}>
            <div className="space-y-4">
              <Checkbox
                checked={config.showContactInfo}
                onCheckedChange={(checked) => onChange({ showContactInfo: checked })}
                disabled={disabled}
                label="Show contact information"
              />

              {config.showContactInfo && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={config.contactEmail || ''}
                      onChange={(e) => onChange({ contactEmail: e.target.value })}
                      placeholder="support@example.com"
                      className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
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
                      className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
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
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Social Links */}
          <CollapsibleSection id="social" title="Social Links" icon={LinkIcon} isOpen={activeSection === 'social'} onToggle={handleToggleSection}>
            <div className="space-y-4">
              <Checkbox
                checked={config.showSocialIcons}
                onCheckedChange={(checked) => onChange({ showSocialIcons: checked })}
                disabled={disabled}
                label="Show social icons"
              />

              {config.showSocialIcons && (
                <SocialLinksManager
                  socialLinks={config.socialLinks || []}
                  onChange={(socialLinks) => onChange({ socialLinks })}
                />
              )}
            </div>
          </CollapsibleSection>

          {/* Payment Methods */}
          <CollapsibleSection id="payment" title="Payment Methods" icon={CreditCard} isOpen={activeSection === 'payment'} onToggle={handleToggleSection}>
            <div className="space-y-4">
              <Checkbox
                checked={config.showPaymentIcons || false}
                onCheckedChange={(checked) => onChange({ showPaymentIcons: checked })}
                disabled={disabled}
                label="Show payment method icons"
              />

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
                          'p-3 border rounded-md text-center transition-all text-sm',
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
          </CollapsibleSection>

          {/* Trust Badges */}
          <CollapsibleSection id="trust" title="Trust Badges" icon={Shield} isOpen={activeSection === 'trust'} onToggle={handleToggleSection}>
            <div className="space-y-4">
              <Checkbox
                checked={config.showTrustBadges || false}
                onCheckedChange={(checked) => onChange({ showTrustBadges: checked })}
                disabled={disabled}
                label="Show trust badges"
              />

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
                        className="flex items-center gap-3 p-3 bg-muted rounded-md"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <input
                          type="text"
                          value={badge.label}
                          onChange={(e) => handleUpdateTrustBadge(badge.id, { label: e.target.value })}
                          className="flex-1 h-9 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                          placeholder="Badge text"
                          disabled={disabled}
                        />
                        <Select
                          value={badge.icon || ''}
                          onChange={(value) => handleUpdateTrustBadge(badge.id, { icon: value || undefined })}
                          options={[
                            { value: '', label: 'No icon' },
                            { value: 'Shield', label: 'Shield' },
                            { value: 'Truck', label: 'Truck' },
                            { value: 'RefreshCw', label: 'Refund' },
                            { value: 'Headphones', label: 'Support' },
                            { value: 'BadgeCheck', label: 'Verified' },
                            { value: 'Lock', label: 'Secure' },
                            { value: 'Award', label: 'Award' },
                          ]}
                          disabled={disabled}
                          className="h-9 w-32"
                        />
                        <input
                          type="text"
                          value={badge.href || ''}
                          onChange={(e) => handleUpdateTrustBadge(badge.id, { href: e.target.value || undefined })}
                          className="w-32 h-9 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
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
          </CollapsibleSection>

          {/* Newsletter & Copyright */}
          <CollapsibleSection id="bottom" title="Newsletter & Copyright" icon={LinkIcon} isOpen={activeSection === 'bottom'} onToggle={handleToggleSection}>
            <div className="space-y-4">
              <Checkbox
                checked={config.showNewsletter}
                onCheckedChange={(checked) => onChange({ showNewsletter: checked })}
                disabled={disabled}
                label="Show newsletter signup"
              />

              <div>
                <label className="block text-sm font-medium mb-1">Copyright Text</label>
                <input
                  type="text"
                  value={config.copyrightText || ''}
                  onChange={(e) => onChange({ copyrightText: e.target.value })}
                  placeholder="© 2024 Your Company. All rights reserved."
                  className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary"
                  disabled={disabled}
                />
              </div>

              <Checkbox
                checked={config.showPoweredBy}
                onCheckedChange={(checked) => onChange({ showPoweredBy: checked })}
                disabled={disabled}
                label='Show "Powered by" branding'
              />
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

export default FooterBuilder;

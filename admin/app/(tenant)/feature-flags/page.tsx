'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Flag,
  Search,
  RefreshCcw,
  Filter,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Settings2,
  Beaker,
  Users,
  Zap,
  Shield,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface FeatureFlag {
  key: string;
  defaultValue: boolean | string | number | Record<string, unknown> | null;
  rules?: Array<{
    condition?: Record<string, unknown>;
    force?: unknown;
    variations?: unknown[];
    weights?: number[];
  }>;
}

interface FeaturesResponse {
  features: Record<string, FeatureFlag>;
  dateUpdated?: string;
}

// Predefined feature flag categories for organization
const FLAG_CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  search: { label: 'Search', icon: Search, color: 'bg-primary/20 text-primary' },
  ecommerce: { label: 'E-Commerce', icon: Zap, color: 'bg-green-100 text-green-700' },
  payment: { label: 'Payments', icon: Shield, color: 'bg-purple-100 text-purple-700' },
  ui: { label: 'UI/UX', icon: Settings2, color: 'bg-pink-100 text-pink-700' },
  admin: { label: 'Admin', icon: Users, color: 'bg-orange-100 text-orange-700' },
  mobile: { label: 'Mobile', icon: Zap, color: 'bg-cyan-100 text-cyan-700' },
  performance: { label: 'Performance', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  tenant: { label: 'Multi-Tenant', icon: Users, color: 'bg-indigo-100 text-indigo-700' },
  qr: { label: 'QR Codes', icon: Zap, color: 'bg-teal-100 text-teal-700' },
  other: { label: 'Other', icon: Flag, color: 'bg-muted text-foreground' },
};

// Categorize flags based on key prefix
function categorizeFlag(key: string): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('search')) return 'search';
  if (lowerKey.includes('currency') || lowerKey.includes('checkout') || lowerKey.includes('cart') || lowerKey.includes('wishlist') || lowerKey.includes('product') || lowerKey.includes('order')) return 'ecommerce';
  if (lowerKey.includes('pay') || lowerKey.includes('subscription')) return 'payment';
  if (lowerKey.includes('dark') || lowerKey.includes('theme') || lowerKey.includes('scroll') || lowerKey.includes('header') || lowerKey.includes('quick_view')) return 'ui';
  if (lowerKey.includes('admin') || lowerKey.includes('analytics') || lowerKey.includes('bulk') || lowerKey.includes('inventory')) return 'admin';
  if (lowerKey.includes('biometric') || lowerKey.includes('push') || lowerKey.includes('offline') || lowerKey.includes('ar_')) return 'mobile';
  if (lowerKey.includes('lazy') || lowerKey.includes('cache') || lowerKey.includes('prefetch') || lowerKey.includes('worker')) return 'performance';
  if (lowerKey.includes('tenant') || lowerKey.includes('white_label') || lowerKey.includes('domain')) return 'tenant';
  if (lowerKey.includes('qr') || lowerKey.includes('barcode') || lowerKey.includes('scan')) return 'qr';
  return 'other';
}

// ========================================
// Components
// ========================================

function FeatureFlagCard({
  flag,
  onToggle,
  isLoading,
}: {
  flag: FeatureFlag;
  onToggle?: (key: string, value: boolean) => void;
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const category = categorizeFlag(flag.key);
  const categoryInfo = FLAG_CATEGORIES[category];
  const CategoryIcon = categoryInfo.icon;

  const isBoolean = typeof flag.defaultValue === 'boolean';
  const isEnabled = isBoolean ? flag.defaultValue : null;
  const hasRules = flag.rules && flag.rules.length > 0;

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'boolean') return val ? 'Enabled' : 'Disabled';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className={cn(
      'bg-card rounded-xl border transition-all duration-200',
      expanded ? 'shadow-md border-primary/30' : 'shadow-sm border-border hover:shadow-md hover:border-border'
    )}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn('p-2 rounded-lg shrink-0', categoryInfo.color)}>
              <CategoryIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{flag.key}</h3>
                {hasRules && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                    Rules
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {isBoolean ? (isEnabled ? 'Enabled' : 'Disabled') : formatValue(flag.defaultValue)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isBoolean && onToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(flag.key, !isEnabled);
                }}
                disabled={isLoading}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  isEnabled ? 'bg-green-500' : 'bg-gray-300',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            )}
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-3 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Default Value</p>
              <code className="text-sm bg-muted px-2 py-1 rounded text-foreground block overflow-x-auto">
                {formatValue(flag.defaultValue)}
              </code>
            </div>

            {hasRules && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Targeting Rules ({flag.rules?.length})
                </p>
                <div className="space-y-2">
                  {flag.rules?.map((rule, idx) => (
                    <div key={idx} className="bg-muted rounded-lg p-3 text-sm">
                      {rule.condition && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Condition:</span>
                          <code className="block mt-1 text-xs bg-white px-2 py-1 rounded border border-border overflow-x-auto">
                            {JSON.stringify(rule.condition, null, 2)}
                          </code>
                        </div>
                      )}
                      {rule.force !== undefined && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Force Value:</span>
                          <code className="ml-2 text-xs">{formatValue(rule.force)}</code>
                        </div>
                      )}
                      {rule.variations && rule.weights && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">A/B Test:</span>
                          <div className="mt-1 flex gap-2">
                            {rule.variations.map((v, i) => (
                              <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {formatValue(v)} ({rule.weights?.[i]}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <span className={cn('px-2 py-1 text-xs font-medium rounded-full', categoryInfo.color)}>
                {categoryInfo.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  flags,
  onToggle,
  isLoading,
  updatingFlags,
}: {
  category: string;
  flags: FeatureFlag[];
  onToggle?: (key: string, value: boolean) => void;
  isLoading?: boolean;
  updatingFlags?: Set<string>;
}) {
  const [expanded, setExpanded] = useState(true);
  const categoryInfo = FLAG_CATEGORIES[category] || FLAG_CATEGORIES.other;
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <div className={cn('p-1.5 rounded-lg', categoryInfo.color)}>
          <CategoryIcon className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{categoryInfo.label}</h2>
        <span className="text-sm text-muted-foreground">({flags.length})</span>
      </button>

      {expanded && (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2 animate-in slide-in-from-top-2 duration-200">
          {flags.map((flag) => (
            <FeatureFlagCard
              key={flag.key}
              flag={flag}
              onToggle={onToggle}
              isLoading={updatingFlags?.has(flag.key) || false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// Main Page
// ========================================

export default function FeatureFlagsPage() {
  const { currentTenant } = useTenant();
  const [features, setFeatures] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const tenantId = currentTenant?.id || '';

  // Fetch features from GrowthBook through feature-flags-service
  const fetchFeatures = async () => {
    if (!tenantId) return;

    try {
      setError(null);
      const sdkKey = process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || 'sdk-tesserix';
      const response = await fetch(`/api/feature-flags/features?client_key=${sdkKey}`, {
        headers: {
          'X-Vendor-ID': tenantId,
        },
      });

      if (!response.ok) {
        // If service is not available, show mock data for demo
        throw new Error('Feature flags service not available');
      }

      const data = await response.json();
      if (data.success && data.data?.features) {
        setFeatures(data.data.features);
        setLastUpdated(data.data.dateUpdated || new Date().toISOString());
      } else {
        throw new Error(data.message || 'Failed to fetch features');
      }
    } catch (err) {
      console.error('Error fetching features:', err);
      // Load predefined flags as fallback
      setFeatures(getPredefinedFlags());
      setError('Using local feature flag definitions. Connect to GrowthBook to manage flags remotely.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [tenantId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeatures();
  };

  // State for toggle operations
  const [updatingFlags, setUpdatingFlags] = useState<Set<string>>(new Set());
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Handle feature flag toggle
  const handleToggle = async (featureId: string, enabled: boolean) => {
    // Add to updating set
    setUpdatingFlags(prev => new Set(prev).add(featureId));
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const response = await fetch('/api/feature-flags/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featureId, enabled }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update feature flag');
      }

      // Update local state
      setFeatures(prev => ({
        ...prev,
        [featureId]: {
          ...prev[featureId],
          defaultValue: enabled,
        },
      }));

      setUpdateSuccess(`"${featureId}" has been ${enabled ? 'enabled' : 'disabled'}`);
      setTimeout(() => setUpdateSuccess(null), 3000);

      // Refresh to get latest from server
      setTimeout(() => fetchFeatures(), 1000);

    } catch (err) {
      console.error('Error updating feature flag:', err);
      setUpdateError(err instanceof Error ? err.message : 'Failed to update feature flag');
      setTimeout(() => setUpdateError(null), 5000);
    } finally {
      setUpdatingFlags(prev => {
        const next = new Set(prev);
        next.delete(featureId);
        return next;
      });
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Organize flags by category
  const categorizedFlags = useMemo(() => {
    const flagList = Object.entries(features).map(([flagKey, flag]) => ({
      ...flag,
      key: flagKey,
    }));

    // Filter by search
    const filtered = flagList.filter(
      (flag) =>
        flag.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by category
    const categoryFiltered = selectedCategory
      ? filtered.filter((flag) => categorizeFlag(flag.key) === selectedCategory)
      : filtered;

    // Group by category
    const grouped: Record<string, FeatureFlag[]> = {};
    categoryFiltered.forEach((flag) => {
      const cat = categorizeFlag(flag.key);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(flag);
    });

    return grouped;
  }, [features, searchQuery, selectedCategory]);

  const totalFlags = Object.keys(features).length;
  const enabledFlags = Object.values(features).filter(
    (f) => f.defaultValue === true
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Feature Flags Access Required"
      fallbackDescription="You don't have the required permissions to view feature flags. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Feature Flags"
          description="Manage feature toggles and A/B experiments with GrowthBook"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Feature Flags' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                onClick={() => window.open('https://dev-growthbook.tesserix.app', '_blank')}
                className="bg-primary text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open GrowthBook
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Flag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalFlags}</p>
                <p className="text-sm text-muted-foreground">Total Flags</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{enabledFlags}</p>
                <p className="text-sm text-muted-foreground">Enabled</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalFlags - enabledFlags}</p>
                <p className="text-sm text-muted-foreground">Disabled</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Last Updated</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Notice</p>
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Multi-Tenant Feature Flags</p>
            <p className="text-sm text-primary">
              Feature flags are managed through GrowthBook with attribute-based targeting.
              Each tenant can have different flag values based on targeting rules using tenantId, userId, and custom attributes.
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feature flags..."
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {Object.entries(FLAG_CATEGORIES).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Success/Error Banners */}
        {updateSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700">{updateSuccess}</p>
            </div>
          </div>
        )}

        {updateError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{updateError}</p>
            </div>
          </div>
        )}

        {/* Feature Flags List */}
        <div className="space-y-6">
          {Object.keys(categorizedFlags).length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Feature Flags Found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No flags match your search. Try a different query.'
                  : 'Create your first feature flag in GrowthBook.'}
              </p>
            </div>
          ) : (
            Object.entries(categorizedFlags)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, flags]) => (
                <CategorySection
                  key={category}
                  category={category}
                  flags={flags}
                  onToggle={handleToggle}
                  isLoading={updatingFlags.size > 0}
                  updatingFlags={updatingFlags}
                />
              ))
          )}
        </div>

        {/* Quick Reference */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Beaker className="w-5 h-5 text-purple-600" />
            Quick Reference
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">React Hook Usage</h4>
              <code className="text-sm bg-white p-2 rounded border block overflow-x-auto">
{`import { useFeatureFlag } from '@tesserix/feature-flags';

const isEnabled = useFeatureFlag('flag_key');`}
              </code>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold text-foreground mb-2">API Evaluation</h4>
              <code className="text-sm bg-white p-2 rounded border block overflow-x-auto">
{`POST /api/v1/features/evaluate
{
  "feature_key": "flag_key",
  "attributes": { "tenantId": "..." }
}`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}

// Predefined flags for fallback
function getPredefinedFlags(): Record<string, FeatureFlag> {
  return {
    global_search_enabled: { key: 'global_search_enabled', defaultValue: true },
    search_autocomplete: { key: 'search_autocomplete', defaultValue: true },
    search_typo_tolerance: { key: 'search_typo_tolerance', defaultValue: true },
    advanced_search_filters: { key: 'advanced_search_filters', defaultValue: false },
    multi_currency: { key: 'multi_currency', defaultValue: true },
    guest_checkout: { key: 'guest_checkout', defaultValue: true },
    wishlist_enabled: { key: 'wishlist_enabled', defaultValue: true },
    product_reviews: { key: 'product_reviews', defaultValue: true },
    product_compare: { key: 'product_compare', defaultValue: false },
    bulk_ordering: { key: 'bulk_ordering', defaultValue: false },
    apple_pay: { key: 'apple_pay', defaultValue: false },
    google_pay: { key: 'google_pay', defaultValue: false },
    buy_now_pay_later: { key: 'buy_now_pay_later', defaultValue: false },
    subscription_payments: { key: 'subscription_payments', defaultValue: false },
    dark_mode: { key: 'dark_mode', defaultValue: false },
    new_checkout_flow: { key: 'new_checkout_flow', defaultValue: false },
    product_quick_view: { key: 'product_quick_view', defaultValue: true },
    infinite_scroll: { key: 'infinite_scroll', defaultValue: false },
    sticky_header: { key: 'sticky_header', defaultValue: true },
    analytics_dashboard_v2: { key: 'analytics_dashboard_v2', defaultValue: false },
    bulk_product_edit: { key: 'bulk_product_edit', defaultValue: true },
    ai_product_descriptions: { key: 'ai_product_descriptions', defaultValue: false },
    inventory_alerts: { key: 'inventory_alerts', defaultValue: true },
    biometric_auth: { key: 'biometric_auth', defaultValue: false },
    push_notifications: { key: 'push_notifications', defaultValue: true },
    offline_mode: { key: 'offline_mode', defaultValue: false },
    ar_product_preview: { key: 'ar_product_preview', defaultValue: false },
    image_lazy_loading: { key: 'image_lazy_loading', defaultValue: true },
    service_worker: { key: 'service_worker', defaultValue: false },
    prefetch_enabled: { key: 'prefetch_enabled', defaultValue: true },
    tenant_custom_domain: { key: 'tenant_custom_domain', defaultValue: true },
    tenant_custom_theme: { key: 'tenant_custom_theme', defaultValue: true },
    tenant_analytics: { key: 'tenant_analytics', defaultValue: true },
    white_label_enabled: { key: 'white_label_enabled', defaultValue: false },
  };
}

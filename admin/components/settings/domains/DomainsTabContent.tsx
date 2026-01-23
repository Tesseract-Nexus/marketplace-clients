'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Plus,
  Loader2,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  customDomainService,
  type CustomDomain,
  type DomainStats,
} from '@/lib/services/customDomainService';
import { AddDomainModal } from './AddDomainModal';
import { DomainCard } from './DomainCard';
import { CustomDomainEnabledState } from './CustomDomainEnabledState';

function StatsCard({ value, label, variant = 'default' }: {
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'warning';
}) {
  const colorClasses = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 text-center">
      <p className={`text-3xl font-bold ${colorClasses[variant]}`}>{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function EmptyState({ onAddDomain }: { onAddDomain: () => void }) {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Gradient Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-10 text-center">
        <div className="relative z-10">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            No Custom Domains Yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add your own domain to give your store a professional look.
            Your customers will see your brand, not ours.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* Benefits Grid */}
      <div className="px-8 py-8 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            {
              icon: Shield,
              title: 'Free SSL Certificate',
              description: 'Automatic HTTPS with Let\'s Encrypt, auto-renewed',
              color: 'text-success',
              bg: 'bg-success/10',
            },
            {
              icon: Zap,
              title: 'Quick Setup',
              description: 'Usually active within 15 minutes of DNS config',
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              icon: Sparkles,
              title: 'Professional Look',
              description: 'Customers see your domain, building brand trust',
              color: 'text-warning',
              bg: 'bg-warning/10',
            },
          ].map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center text-center p-4">
              <div className={`p-3 rounded-xl ${benefit.bg} mb-4`}>
                <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button onClick={onAddDomain} size="lg" className="min-w-[200px]">
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Domain
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DomainsTabContent() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [verifyingDomains, setVerifyingDomains] = useState<Set<string>>(new Set());

  const loadDomains = useCallback(async () => {
    if (currentTenant?.useCustomDomain && currentTenant?.customDomain) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [domainsResult, statsResult] = await Promise.all([
        customDomainService.listDomains(1, 50),
        customDomainService.getStats(),
      ]);
      setDomains(domainsResult.data || []);
      setStats(statsResult.data);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.useCustomDomain, currentTenant?.customDomain]);

  useEffect(() => {
    if (currentTenant !== null) {
      loadDomains();
    }
  }, [currentTenant, loadDomains]);

  const handleDomainAdded = (domain: CustomDomain) => {
    setDomains((prev) => [domain, ...prev]);
    if (stats) {
      setStats({
        ...stats,
        totalDomains: stats.totalDomains + 1,
        pendingDomains: stats.pendingDomains + 1,
      });
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomains((prev) => new Set(prev).add(domainId));

    try {
      const result = await customDomainService.verifyDomain(domainId);

      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? result.data : d))
      );

      if (result.data.dnsVerified) {
        showSuccess('DNS Verified', 'Your domain DNS has been verified. SSL provisioning will begin shortly.');
      } else {
        showError('DNS Not Verified', 'DNS records not found. Please check your DNS configuration and try again.');
      }
    } catch (err: unknown) {
      console.error('Failed to verify domain:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify domain';
      showError('Verification Failed', errorMessage);
    } finally {
      setVerifyingDomains((prev) => {
        const next = new Set(prev);
        next.delete(domainId);
        return next;
      });
    }
  };

  const handleDeleteDomain = async (domain: CustomDomain) => {
    const confirmed = await showConfirm({
      title: 'Delete Domain',
      message: `Are you sure you want to delete ${domain.domain}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await customDomainService.deleteDomain(domain.id);
      setDomains((prev) => prev.filter((d) => d.id !== domain.id));
      showSuccess('Domain Deleted', `${domain.domain} has been removed.`);

      if (stats) {
        const statusKey = domain.status === 'active' ? 'activeDomains' :
          domain.status === 'pending' ? 'pendingDomains' : 'failedDomains';
        setStats({
          ...stats,
          totalDomains: stats.totalDomains - 1,
          [statusKey]: Math.max(0, stats[statusKey] - 1),
        });
      }
    } catch (err: unknown) {
      console.error('Failed to delete domain:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete domain';
      showError('Delete Failed', errorMessage);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied', 'Value copied to clipboard');
  };

  const hasOnboardedCustomDomain = currentTenant?.useCustomDomain && currentTenant?.customDomain;

  if (loading || tenantLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_EDIT}
      fallback="styled"
      fallbackTitle="Custom Domains"
      fallbackDescription="You don't have permission to manage custom domains."
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Custom Domains
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {hasOnboardedCustomDomain
                ? 'Your store is running on a custom domain'
                : 'Connect your own domain to your storefront'
              }
            </p>
          </div>
          {!hasOnboardedCustomDomain && domains.length > 0 && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          )}
        </div>

        {/* Content */}
        {hasOnboardedCustomDomain ? (
          <CustomDomainEnabledState
            customDomain={currentTenant.customDomain!}
            adminUrl={currentTenant.adminUrl}
          />
        ) : (
          <>
            {/* Stats Overview */}
            {stats && stats.totalDomains > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard value={stats.totalDomains} label="Total Domains" />
                <StatsCard value={stats.activeDomains} label="Active" variant="success" />
                <StatsCard value={stats.pendingDomains} label="Pending" variant="warning" />
                <StatsCard value={stats.expiringCertificates} label="Expiring Soon" variant="warning" />
              </div>
            )}

            {/* Domain List or Empty State */}
            {domains.length > 0 ? (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    onVerify={() => handleVerifyDomain(domain.id)}
                    onDelete={() => handleDeleteDomain(domain)}
                    onCopy={handleCopy}
                    isVerifying={verifyingDomains.has(domain.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState onAddDomain={() => setShowAddModal(true)} />
            )}
          </>
        )}

        {/* Add Domain Modal */}
        <AddDomainModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onDomainAdded={handleDomainAdded}
        />
      </div>
    </PermissionGate>
  );
}

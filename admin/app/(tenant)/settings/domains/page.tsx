'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Trash2,
  Shield,
  Loader2,
  Info,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { PermissionGate, Permission } from '@/components/permission-gate';
import {
  customDomainService,
  type CustomDomain,
  type DNSRecord,
  type DomainStats,
} from '@/lib/services/customDomainService';

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'bg-warning-muted text-warning-muted-foreground', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
    verifying: { color: 'bg-info-muted text-info-muted-foreground', icon: <RefreshCw className="h-3 w-3 animate-spin" />, label: 'Verifying' },
    provisioning: { color: 'bg-primary/10 text-primary', icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Provisioning SSL' },
    active: { color: 'bg-success-muted text-success-muted-foreground', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Active' },
    inactive: { color: 'bg-neutral-muted text-neutral-muted-foreground', icon: <XCircle className="h-3 w-3" />, label: 'Inactive' },
    failed: { color: 'bg-error-muted text-error-muted-foreground', icon: <XCircle className="h-3 w-3" />, label: 'Failed' },
    expired: { color: 'bg-warning-muted text-warning-muted-foreground', icon: <AlertTriangle className="h-3 w-3" />, label: 'Expired' },
  };

  const { color, icon, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

// DNS Record display component
function DNSRecordRow({ record, onCopy }: { record: DNSRecord; onCopy: (text: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Type:</span>
          <span className="ml-2 font-mono font-medium">{record.recordType}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Host:</span>
          <span className="ml-2 font-mono text-xs break-all">{record.host}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-mono text-xs truncate max-w-[200px]" title={record.value}>
            {record.value}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onCopy(record.value)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="ml-4">
        {record.isVerified ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Clock className="h-5 w-5 text-warning" />
        )}
      </div>
    </div>
  );
}

// Add Domain Modal
function AddDomainModal({
  isOpen,
  onClose,
  onDomainAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDomainAdded: (domain: CustomDomain) => void;
}) {
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useDialog();

  // Validate domain format
  const validateDomain = (value: string): boolean => {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(value);
  };

  const handleSubmit = async () => {
    // Clean domain input
    const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

    if (!cleanDomain) {
      setError('Please enter a domain');
      return;
    }

    if (!validateDomain(cleanDomain)) {
      setError('Please enter a valid domain (e.g., store.example.com)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await customDomainService.createDomain({
        domain: cleanDomain,
        targetType: 'storefront',
        forceHTTPS: true,
        redirectWWW: true,
      });

      showSuccess('Domain Added', `${cleanDomain} has been added. Configure your DNS to complete setup.`);
      onDomainAdded(result.data);
      setDomain('');
      onClose();
    } catch (err: any) {
      console.error('Failed to add domain:', err);
      setError(err.message || 'Failed to add domain');
      showError('Error', err.message || 'Failed to add domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Custom Domain</h3>
              <p className="text-sm text-white/80">Connect your own domain to your store</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Domain Name
            </label>
            <Input
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setError('');
              }}
              placeholder="store.example.com"
              className="font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter your domain without http:// or www. (e.g., store.example.com or example.com)
            </p>
          </div>

          {error && (
            <div className="bg-error-muted text-error text-sm px-3 py-2 rounded-lg border border-error/30">
              {error}
            </div>
          )}

          {/* Info box */}
          <div className="bg-accent border border-primary/30 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary">
                <p className="font-medium mb-1">What happens next?</p>
                <ol className="list-decimal list-inside space-y-1 text-primary">
                  <li>We&apos;ll generate DNS records for you to add</li>
                  <li>Add the records at your domain registrar</li>
                  <li>We&apos;ll verify and provision SSL automatically</li>
                  <li>Your custom domain will be live!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !domain.trim()}
            className="bg-primary text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Domain Card Component
function DomainCard({
  domain,
  onVerify,
  onDelete,
  onCopy,
  isVerifying,
}: {
  domain: CustomDomain;
  onVerify: () => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
  isVerifying: boolean;
}) {
  const [showDNS, setShowDNS] = useState(domain.status === 'pending' || domain.status === 'verifying');

  // Parse verification records
  const dnsRecords: DNSRecord[] = [
    // Verification record
    {
      recordType: domain.verificationMethod === 'cname' ? 'CNAME' : 'TXT',
      host: domain.verificationMethod === 'cname'
        ? `_verify.${domain.domain}`
        : `_tesserix-verify.${domain.domain}`,
      value: domain.verificationRecord || domain.verificationToken,
      ttl: 3600,
      purpose: 'domain_verification',
      isVerified: domain.dnsVerified,
    },
    // Routing record (CNAME to proxy)
    {
      recordType: 'CNAME',
      host: domain.domain,
      value: 'proxy.tesserix.app',
      ttl: 3600,
      purpose: 'domain_routing',
      isVerified: domain.routingStatus === 'active',
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{domain.domain}</h3>
                {domain.isPrimary && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Added {new Date(domain.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <StatusBadge status={domain.status} />
        </div>
      </div>

      {/* Status Details */}
      <div className="p-4 space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {domain.dnsVerified ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <Clock className="h-4 w-4 text-warning" />
            )}
            <span className="text-sm">DNS Verified</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {domain.sslStatus === 'active' ? (
              <Shield className="h-4 w-4 text-success" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">SSL Active</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            {domain.routingStatus === 'active' ? (
              <Zap className="h-4 w-4 text-success" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">Routing Active</span>
          </div>
        </div>

        {/* Status Message */}
        {domain.statusMessage && (
          <div className={`text-sm p-3 rounded-lg ${
            domain.status === 'failed'
              ? 'bg-error-muted text-error border border-error/30'
              : 'bg-muted text-muted-foreground'
          }`}>
            {domain.statusMessage}
          </div>
        )}

        {/* DNS Configuration (expandable) */}
        {(domain.status === 'pending' || domain.status === 'verifying' || !domain.dnsVerified) && (
          <div className="space-y-3">
            <button
              onClick={() => setShowDNS(!showDNS)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showDNS ? 'rotate-90' : ''}`} />
              {showDNS ? 'Hide' : 'Show'} DNS Configuration
            </button>

            {showDNS && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-warning-muted border border-warning/30 rounded-lg p-3">
                  <p className="text-sm text-warning">
                    <strong>Action Required:</strong> Add the following DNS records at your domain registrar
                    (e.g., GoDaddy, Cloudflare, Namecheap).
                  </p>
                </div>

                <div className="space-y-2">
                  {dnsRecords.map((record, idx) => (
                    <DNSRecordRow key={idx} record={record} onCopy={onCopy} />
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  DNS changes can take up to 48 hours to propagate, but usually complete within 15 minutes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SSL Info */}
        {domain.sslStatus === 'active' && domain.sslExpiresAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-success" />
            <span>SSL certificate expires {new Date(domain.sslExpiresAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {domain.status === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://${domain.domain}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!domain.dnsVerified && (
            <Button
              variant="outline"
              size="sm"
              onClick={onVerify}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Verify DNS
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-error hover:text-error/80 hover:bg-error-muted"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function DomainsSettingsPage() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant } = useTenant();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [stats, setStats] = useState<DomainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [verifyingDomains, setVerifyingDomains] = useState<Set<string>>(new Set());

  const loadDomains = useCallback(async () => {
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
      // Don't show error on initial load - might just be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

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

      // Update domain in list
      setDomains((prev) =>
        prev.map((d) => (d.id === domainId ? result.data : d))
      );

      if (result.data.dnsVerified) {
        showSuccess('DNS Verified', 'Your domain DNS has been verified. SSL provisioning will begin shortly.');
      } else {
        showError('DNS Not Verified', 'DNS records not found. Please check your DNS configuration and try again.');
      }
    } catch (err: any) {
      console.error('Failed to verify domain:', err);
      showError('Verification Failed', err.message || 'Failed to verify domain');
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
        setStats({
          ...stats,
          totalDomains: stats.totalDomains - 1,
          [domain.status === 'active' ? 'activeDomains' :
           domain.status === 'pending' ? 'pendingDomains' :
           'failedDomains']: Math.max(0, stats[domain.status === 'active' ? 'activeDomains' :
           domain.status === 'pending' ? 'pendingDomains' :
           'failedDomains'] - 1),
        });
      }
    } catch (err: any) {
      console.error('Failed to delete domain:', err);
      showError('Delete Failed', err.message || 'Failed to delete domain');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied', 'Value copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading domains...</p>
        </div>
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
      <div className="min-h-screen bg-background p-8">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Custom Domains"
            description="Connect your own domain to your storefront"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Settings', href: '/settings' },
              { label: 'Domains' },
            ]}
            actions={
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            }
          />

          {/* Stats Overview */}
          {stats && stats.totalDomains > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold text-foreground">{stats.totalDomains}</div>
                <div className="text-sm text-muted-foreground">Total Domains</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold text-success">{stats.activeDomains}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold text-warning">{stats.pendingDomains}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold text-warning">{stats.expiringCertificates}</div>
                <div className="text-sm text-muted-foreground">Expiring Soon</div>
              </div>
            </div>
          )}

          {/* Domain List */}
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
            /* Empty State */
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Custom Domains Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your own domain to give your store a professional look.
                Your customers will see your brand, not ours.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Domain
              </Button>

              {/* Benefits */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-success mb-2" />
                  <h4 className="font-medium text-foreground">Free SSL</h4>
                  <p className="text-xs text-muted-foreground">
                    Automatic HTTPS with Let&apos;s Encrypt
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Zap className="h-5 w-5 text-primary mb-2" />
                  <h4 className="font-medium text-foreground">Fast Setup</h4>
                  <p className="text-xs text-muted-foreground">
                    Usually active within 15 minutes
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Globe className="h-5 w-5 text-primary mb-2" />
                  <h4 className="font-medium text-foreground">Your Brand</h4>
                  <p className="text-xs text-muted-foreground">
                    Customers see your domain, not ours
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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

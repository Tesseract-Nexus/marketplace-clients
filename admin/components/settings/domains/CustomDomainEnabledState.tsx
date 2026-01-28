'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Server,
  Shield,
  ChevronDown,
  Loader2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/contexts/ToastContext';
import { MaskedValue } from './MaskedValue';
import {
  customDomainService,
  type CustomDomain,
} from '@/lib/services/customDomainService';

interface CustomDomainEnabledStateProps {
  customDomain: string;
  adminUrl?: string;
  storefrontUrl?: string;
}

interface URLItem {
  id: string;
  label: string;
  url: string;
  icon: React.ElementType;
  external?: boolean;
}

export function CustomDomainEnabledState({
  customDomain,
  adminUrl,
  storefrontUrl,
}: CustomDomainEnabledStateProps) {
  const toast = useToast();
  const [domainDetails, setDomainDetails] = useState<CustomDomain[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [showDnsConfig, setShowDnsConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchDomainDetails = async () => {
      try {
        const result = await customDomainService.listDomains(1, 10);
        setDomainDetails(result.data || []);
      } catch (err) {
        console.error('Failed to fetch domain details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDomainDetails();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    toast.success('Copied', `${label} copied to clipboard`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const derivedAdminUrl = adminUrl || `https://admin.${customDomain}`;
  const derivedStorefrontUrl = storefrontUrl || `https://${customDomain}`;
  const apiUrl = `https://api.${customDomain}`;

  const primaryDomain = domainDetails.find(d => d.targetType === 'storefront' || d.domain === customDomain);

  const urls: URLItem[] = [
    { id: 'storefront', label: 'Storefront', url: derivedStorefrontUrl, icon: Globe, external: true },
    { id: 'admin', label: 'Admin Panel', url: derivedAdminUrl, icon: Shield, external: true },
    { id: 'api', label: 'API', url: apiUrl, icon: Server, external: false },
  ];

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-success/10 via-success/5 to-transparent border border-success/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-success/20 rounded-full flex-shrink-0">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground mb-1">
              Custom Domain Active
            </h3>
            <p className="text-muted-foreground">
              Your store is live at{' '}
              <code className="bg-muted px-2 py-0.5 rounded text-sm font-semibold text-foreground">
                {customDomain}
              </code>
            </p>
          </div>
          <Badge variant="success" className="flex-shrink-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>

        {/* Decorative element */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-success/5 rounded-full blur-3xl" />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="p-2.5 bg-success/10 rounded-lg">
            <Lock className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-foreground">SSL Enabled</p>
            <p className="text-sm text-muted-foreground">HTTPS with auto-renewal</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Routing Active</p>
            <p className="text-sm text-muted-foreground">Traffic is being served</p>
          </div>
        </div>
      </div>

      {/* Domain URLs Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h4 className="font-semibold text-foreground">Your Domain URLs</h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quick access to all your custom domain endpoints
          </p>
        </div>

        <div className="divide-y divide-border">
          {urls.map((item) => {
            const Icon = item.icon;
            const isCopied = copiedUrl === item.url;

            return (
              <div
                key={item.id}
                className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-muted rounded-lg flex-shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="font-mono text-sm text-foreground truncate">
                      {item.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8"
                    onClick={() => handleCopy(item.url, item.label)}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {item.external && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DNS Configuration (Collapsible) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Collapsible open={showDnsConfig} onOpenChange={setShowDnsConfig}>
          <CollapsibleTrigger asChild>
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">DNS Configuration</p>
                  <p className="text-sm text-muted-foreground">View your DNS records</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                showDnsConfig ? 'rotate-180' : ''
              }`} />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
              {loadingDetails ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : primaryDomain ? (
                <div className="space-y-4">
                  {/* Verification CNAME */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${primaryDomain.dnsVerified ? 'text-success' : 'text-warning'}`} />
                      <span className="text-sm font-medium text-foreground">Domain Verification CNAME</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Host</label>
                        <code className="block bg-background rounded border border-border px-3 py-2 text-xs font-mono break-all">
                          {primaryDomain.verificationToken
                            ? `_tesserix-${primaryDomain.verificationToken.substring(0, 8)}.${customDomain}`
                            : `_tesserix-verify.${customDomain}`
                          }
                        </code>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</label>
                        <div className="bg-background rounded border border-border px-3 py-2">
                          <MaskedValue value="verify.tesserix.app" label="Verification Target" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACME Challenge */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">SSL Certificate ACME Challenge</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Host</label>
                        <code className="block bg-background rounded border border-border px-3 py-2 text-xs font-mono">
                          _acme-challenge.{customDomain}
                        </code>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Value</label>
                        <div className="bg-background rounded border border-border px-3 py-2">
                          <MaskedValue
                            value={`${customDomain.replace(/\./g, '-')}.acme.tesserix.app`}
                            label="ACME Target"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enables automatic SSL certificate issuance and renewal.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No additional DNS configuration details available.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Info Note */}
      <div className="flex gap-3 p-4 bg-muted/50 rounded-xl border border-border">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Your custom domain was configured during onboarding. SSL certificates are automatically
          managed and renewed. If you need to change your domain, please contact support.
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronDown,
  Zap,
  Shield,
  ExternalLink,
  Trash2,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DomainStatusBadge } from './DomainStatusBadge';
import { DNSRecordRow } from './DNSRecordRow';
import type { CustomDomain, DNSRecord } from '@/lib/services/customDomainService';

interface DomainCardProps {
  domain: CustomDomain;
  onVerify: () => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
  isVerifying: boolean;
}

interface SetupStep {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  active: boolean;
}

export function DomainCard({
  domain,
  onVerify,
  onDelete,
  onCopy,
  isVerifying,
}: DomainCardProps) {
  const [showDNS, setShowDNS] = useState(domain.status === 'pending' || domain.status === 'verifying');
  const [copied, setCopied] = useState(false);

  // Calculate setup progress
  const setupSteps: SetupStep[] = [
    {
      id: 'dns',
      label: 'DNS Configured',
      icon: Globe,
      completed: domain.dnsVerified,
      active: !domain.dnsVerified,
    },
    {
      id: 'ssl',
      label: 'SSL Certificate',
      icon: Shield,
      completed: domain.sslStatus === 'active',
      active: domain.dnsVerified && domain.sslStatus !== 'active',
    },
    {
      id: 'routing',
      label: 'Routing Active',
      icon: Zap,
      completed: domain.routingStatus === 'active',
      active: domain.sslStatus === 'active' && domain.routingStatus !== 'active',
    },
  ];

  const completedSteps = setupSteps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / setupSteps.length) * 100;

  const dnsRecords: DNSRecord[] = [
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
    {
      recordType: 'CNAME',
      host: domain.domain,
      value: 'proxy.tesserix.app',
      ttl: 3600,
      purpose: 'domain_routing',
      isVerified: domain.routingStatus === 'active',
    },
  ];

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domain.domain);
    setCopied(true);
    onCopy(domain.domain);
    setTimeout(() => setCopied(false), 2000);
  };

  const needsAction = domain.status === 'pending' || domain.status === 'verifying' || !domain.dnsVerified;
  const isActive = domain.status === 'active';
  const isFailed = domain.status === 'failed';

  return (
    <div className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all ${
      isActive ? 'border-success/30' : isFailed ? 'border-error/30' : 'border-border'
    }`}>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Icon with status color */}
            <div className={`p-3 rounded-xl flex-shrink-0 ${
              isActive ? 'bg-success/10' : isFailed ? 'bg-error/10' : 'bg-primary/10'
            }`}>
              <Globe className={`h-6 w-6 ${
                isActive ? 'text-success' : isFailed ? 'text-error' : 'text-primary'
              }`} />
            </div>

            {/* Domain info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {domain.domain}
                </h3>
                {domain.isPrimary && (
                  <Badge variant="secondary" className="text-xs">
                    Primary
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={handleCopyDomain}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Added {new Date(domain.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <DomainStatusBadge status={domain.status} />
        </div>
      </div>

      {/* Setup Progress */}
      <div className="px-5 py-4 bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Setup Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{setupSteps.length} complete
          </span>
        </div>
        <Progress value={progressPercent} className="h-2 mb-4" />

        {/* Step indicators */}
        <div className="grid grid-cols-3 gap-2">
          {setupSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  step.completed
                    ? 'bg-success/10 text-success'
                    : step.active
                    ? 'bg-warning/10 text-warning'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : step.active ? (
                  <Clock className="h-4 w-4 flex-shrink-0 animate-pulse" />
                ) : (
                  <Icon className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="truncate text-xs font-medium">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Message */}
      {domain.statusMessage && (
        <div className="px-5 py-3 border-t border-border">
          <Alert variant={isFailed ? 'error' : 'warning'} className="py-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {domain.statusMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* DNS Configuration (Collapsible) */}
      {needsAction && (
        <div className="border-t border-border">
          <Collapsible open={showDNS} onOpenChange={setShowDNS}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-foreground">
                    DNS Configuration Required
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  showDNS ? 'rotate-180' : ''
                }`} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Instructions */}
                <Alert variant="warning" className="bg-warning-muted/50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Add the following DNS records at your domain registrar (e.g., GoDaddy, Cloudflare, Namecheap).
                    Changes can take up to 48 hours to propagate, but usually complete within 15 minutes.
                  </AlertDescription>
                </Alert>

                {/* DNS Records */}
                <div className="grid gap-3">
                  {dnsRecords.map((record, idx) => (
                    <DNSRecordRow key={idx} record={record} onCopy={onCopy} />
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* SSL Info */}
      {domain.sslStatus === 'active' && domain.sslExpiresAt && (
        <div className="px-5 py-3 border-t border-border bg-success/5">
          <div className="flex items-center gap-2 text-sm text-success">
            <Shield className="h-4 w-4" />
            <span>
              SSL certificate valid until{' '}
              {new Date(domain.sslExpiresAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://${domain.domain}`, '_blank')}
              className="h-9"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Site
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
              className="h-9"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verify DNS
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-error hover:text-error hover:bg-error-muted"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

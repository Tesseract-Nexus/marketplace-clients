'use client';

import React, { useState } from 'react';
import { Copy, Check, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DNSRecord } from '@/lib/services/customDomainService';

interface DNSRecordRowProps {
  record: DNSRecord;
  onCopy: (text: string) => void;
}

export function DNSRecordRow({ record, onCopy }: DNSRecordRowProps) {
  const [copiedField, setCopiedField] = useState<'host' | 'value' | null>(null);

  const handleCopy = (text: string, field: 'host' | 'value') => {
    onCopy(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="group relative bg-card rounded-lg border border-border p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        {record.isVerified ? (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-warning">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Record Type Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
            {record.recordType}
          </Badge>
          {record.purpose === 'domain_verification' && (
            <span className="text-xs text-muted-foreground">Verification</span>
          )}
          {record.purpose === 'domain_routing' && (
            <span className="text-xs text-muted-foreground">Routing</span>
          )}
        </div>

        {/* Host Field */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Host / Name
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted/50 rounded-md px-3 py-2 text-xs font-mono break-all border border-border">
              {record.host}
            </code>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => handleCopy(record.host, 'host')}
            >
              {copiedField === 'host' ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Value Field */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Value / Target
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted/50 rounded-md px-3 py-2 text-xs font-mono break-all border border-border">
              {record.value}
            </code>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => handleCopy(record.value, 'value')}
            >
              {copiedField === 'value' ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* TTL Info */}
        {record.ttl && (
          <p className="text-xs text-muted-foreground">
            TTL: {record.ttl} seconds ({record.ttl >= 3600 ? `${record.ttl / 3600}h` : `${record.ttl / 60}m`})
          </p>
        )}
      </div>
    </div>
  );
}

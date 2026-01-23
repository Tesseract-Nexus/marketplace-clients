'use client';

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { REQUIRED_STORE_FIELDS } from '@/lib/constants/settings';
import type { Storefront } from '@/lib/api/types';

interface StoreSettings {
  store: {
    name: string;
    email: string;
    phone: string;
    country: string;
  };
  business: {
    currency: string;
  };
}

interface StoreHealthWidgetProps {
  storefront: Storefront | null;
  settings: StoreSettings;
  isPublishing?: boolean;
  onPublishToggle: (shouldPublish: boolean) => void;
  onPreview: () => void;
  onFieldClick: (fieldKey: string) => void;
}

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function StoreHealthWidget({
  storefront,
  settings,
  isPublishing = false,
  onPublishToggle,
  onPreview,
  onFieldClick,
}: StoreHealthWidgetProps) {
  const { completedCount, totalCount, missingFields, percentage } = useMemo(() => {
    let completed = 0;
    const missing: { key: string; label: string }[] = [];

    REQUIRED_STORE_FIELDS.forEach((field) => {
      const value = getNestedValue(settings as unknown as Record<string, unknown>, field.key);
      if (value && typeof value === 'string' && value.trim() !== '') {
        completed++;
      } else if (value) {
        completed++;
      } else {
        missing.push({ key: field.key, label: field.label });
      }
    });

    return {
      completedCount: completed,
      totalCount: REQUIRED_STORE_FIELDS.length,
      missingFields: missing,
      percentage: Math.round((completed / REQUIRED_STORE_FIELDS.length) * 100),
    };
  }, [settings]);

  const isComplete = percentage === 100;
  const isLive = storefront?.isActive || false;

  if (!storefront) return null;

  return (
    <div className="space-y-4">
      {/* Status Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            <span className={`text-sm font-medium ${isLive ? 'text-success' : 'text-muted-foreground'}`}>
              {isLive ? 'Live' : 'Hidden'}
            </span>
          </div>
          <Switch
            checked={isLive}
            onCheckedChange={onPublishToggle}
            disabled={isPublishing}
            className="scale-90"
          />
        </div>

        {/* Store URL */}
        {storefront.storefrontUrl && (
          <div className="flex items-center gap-2 text-xs">
            <a
              href={storefront.storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary truncate flex-1 transition-colors"
            >
              {storefront.storefrontUrl.replace(/^https?:\/\//, '')}
            </a>
            <a
              href={storefront.storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Preview button for hidden stores */}
        {!isLive && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="w-full text-xs h-8"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview Store
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Setup Progress Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Setup Progress</span>
          {isComplete && <CheckCircle2 className="h-4 w-4 text-success" />}
        </div>

        {/* Circular Progress */}
        <div className="flex justify-center py-2">
          <CircularProgress
            value={completedCount}
            max={totalCount}
            size="md"
            label={`${completedCount}/${totalCount}`}
          />
        </div>

        {/* Missing Fields List */}
        {missingFields.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Missing:</p>
            <div className="space-y-0.5">
              {missingFields.map((field) => (
                <button
                  key={field.key}
                  onClick={() => onFieldClick(field.key)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-warning hover:bg-warning/10 rounded transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    {field.label}
                  </span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Success message */}
        {isComplete && (
          <div className="flex items-center gap-2 text-xs text-success bg-success/10 px-3 py-2 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>All required fields complete</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreHealthWidget;

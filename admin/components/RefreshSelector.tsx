'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, ChevronDown, Clock, Check, Pause } from 'lucide-react';
import { useRefresh, REFRESH_INTERVALS, RefreshIntervalKey } from '@/contexts/RefreshContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const INTERVAL_LABELS: Record<RefreshIntervalKey, string> = {
  OFF: 'Off',
  '10s': '10 seconds',
  '30s': '30 seconds',
  '1m': '1 minute',
  '5m': '5 minutes',
};

const INTERVAL_SHORT_LABELS: Record<RefreshIntervalKey, string> = {
  OFF: 'Off',
  '10s': '10s',
  '30s': '30s',
  '1m': '1m',
  '5m': '5m',
};

function formatCountdown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function formatLastRefreshed(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ago`;
}

interface RefreshSelectorProps {
  compact?: boolean;
}

export function RefreshSelector({ compact = false }: RefreshSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    interval,
    setInterval,
    triggerRefresh,
    isRefreshing,
    lastRefreshed,
    countdown,
    isAutoRefreshActive,
  } = useRefresh();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Auto-refresh is enabled if interval is not OFF
  const isAutoRefreshEnabled = interval !== 'OFF';

  // Compact mode - just show a single button with interval
  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-2 py-1 text-xs rounded-md flex items-center gap-1.5 font-medium transition-all duration-200",
            isAutoRefreshEnabled
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted text-foreground hover:bg-muted"
          )}
        >
          {isAutoRefreshEnabled ? (
            <Clock className="h-3 w-3" />
          ) : (
            <Pause className="h-3 w-3" />
          )}
          <span className="font-semibold">
            {countdown !== null ? formatCountdown(countdown) : INTERVAL_SHORT_LABELS[interval]}
          </span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
        </Button>

        {/* Dropdown Menu - same as full version */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Auto-refresh</h3>
                </div>
                {isAutoRefreshEnabled && (
                  <div className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    Active
                  </div>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="py-1">
              {(Object.keys(REFRESH_INTERVALS) as RefreshIntervalKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setInterval(key);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
                    interval === key
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {key === 'OFF' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span>{INTERVAL_LABELS[key]}</span>
                  </div>
                  {interval === key && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Last refreshed: {formatLastRefreshed(lastRefreshed)}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button Group */}
      <div className="flex items-center">
        {/* Refresh Button */}
        <Button
          onClick={triggerRefresh}
          disabled={isRefreshing}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-l-lg border border-r-0 transition-all duration-200",
            "hover:shadow-md active:scale-95",
            isRefreshing
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background hover:bg-muted text-foreground border-border"
          )}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">
            {isRefreshing ? 'Refreshing' : 'Refresh'}
          </span>
        </Button>

        {/* Interval Dropdown Toggle */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 text-sm font-medium rounded-r-lg border transition-all duration-200",
            "hover:shadow-md",
            isAutoRefreshEnabled
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-background hover:bg-muted text-foreground border-border"
          )}
        >
          {isAutoRefreshEnabled ? (
            <>
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold min-w-[28px]">
                {countdown !== null ? formatCountdown(countdown) : INTERVAL_SHORT_LABELS[interval]}
              </span>
            </>
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Auto Refresh</h3>
              <div className={cn(
                "px-2 py-0.5 text-xs font-medium rounded-full",
                isAutoRefreshActive
                  ? "bg-green-100 text-green-700"
                  : isAutoRefreshEnabled
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-muted text-muted-foreground"
              )}>
                {isAutoRefreshActive ? 'Active' : isAutoRefreshEnabled ? 'Dashboard only' : 'Paused'}
              </div>
            </div>
            {lastRefreshed && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {formatLastRefreshed(lastRefreshed)}
              </p>
            )}
          </div>

          {/* Interval Options */}
          <div className="py-1">
            {(Object.keys(REFRESH_INTERVALS) as RefreshIntervalKey[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setInterval(key);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                  interval === key
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  {key === 'OFF' ? (
                    <Pause className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{INTERVAL_LABELS[key]}</span>
                </div>
                {interval === key && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border bg-muted">
            <p className="text-xs text-muted-foreground">
              {isAutoRefreshActive
                ? `Dashboard will refresh every ${INTERVAL_LABELS[interval].toLowerCase()}`
                : isAutoRefreshEnabled
                  ? 'Auto-refresh only works on Dashboard'
                  : 'Click refresh button to manually update data'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile or tight spaces
export function RefreshSelectorCompact() {
  const { interval, triggerRefresh, isRefreshing, countdown } = useRefresh();
  const isAutoRefreshEnabled = interval !== 'OFF';

  return (
    <Button
      onClick={triggerRefresh}
      disabled={isRefreshing}
      className={cn(
        "relative p-2 rounded-lg border transition-all duration-200",
        isRefreshing
          ? "bg-primary text-white border-transparent"
          : "bg-white hover:bg-muted text-foreground border-border"
      )}
      title={isAutoRefreshEnabled ? `Auto-refresh: ${countdown}s` : 'Manual refresh'}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
      {isAutoRefreshEnabled && countdown !== null && (
        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary text-white px-1 rounded">
          {countdown}
        </span>
      )}
    </Button>
  );
}

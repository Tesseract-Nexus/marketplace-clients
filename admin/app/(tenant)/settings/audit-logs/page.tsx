'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Globe,
  Shield,
  Eye,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  TrendingUp,
  Users,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  username: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  resourceName: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  method: string;
  path: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  description: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  serviceName: string;
  timestamp: string;
  createdAt: string;
}

interface AuditLogSummary {
  totalLogs: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  topUsers: Array<{
    userId: string;
    username: string;
    userEmail: string;
    count: number;
    lastActivity: string;
  }>;
  recentFailures: AuditLog[];
  timeRange: { from: string; to: string };
}

interface Filters {
  action: string;
  resource: string;
  status: string;
  severity: string;
  search: string;
  fromDate: string;
  toDate: string;
}

interface RetentionSettings {
  tenantId: string;
  retentionDays: number;
  lastCleanupAt?: string;
  logsDeleted?: number;
}

interface RetentionOption {
  months: number;
  days: number;
  label: string;
}

// Retention options (3-12 months)
const RETENTION_OPTIONS: RetentionOption[] = [
  { months: 3, days: 90, label: '3 months' },
  { months: 4, days: 120, label: '4 months' },
  { months: 5, days: 150, label: '5 months' },
  { months: 6, days: 180, label: '6 months (Default)' },
  { months: 7, days: 210, label: '7 months' },
  { months: 8, days: 240, label: '8 months' },
  { months: 9, days: 270, label: '9 months' },
  { months: 10, days: 300, label: '10 months' },
  { months: 11, days: 330, label: '11 months' },
  { months: 12, days: 365, label: '12 months (1 year)' },
];

// Timezone options
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

// Action types for filter
const ACTION_TYPES = [
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGE',
  'CREATE', 'READ', 'UPDATE', 'DELETE',
  'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'COMPLETE', 'CANCEL',
  'ROLE_ASSIGN', 'ROLE_REMOVE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE',
  'CONFIG_UPDATE', 'SETTING_CHANGE',
];

// Resource types for filter
const RESOURCE_TYPES = [
  'USER', 'ROLE', 'PERMISSION', 'CATEGORY', 'PRODUCT', 'ORDER',
  'CUSTOMER', 'VENDOR', 'RETURN', 'REFUND', 'SHIPMENT', 'PAYMENT',
  'NOTIFICATION', 'DOCUMENT', 'SETTINGS', 'CONFIG', 'AUTH',
];

// Severity colors
const SEVERITY_COLORS = {
  LOW: 'bg-success-muted text-success-muted-foreground border-success/30',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-error-muted text-error-muted-foreground border-error/30',
};

const STATUS_COLORS = {
  SUCCESS: 'bg-success-muted text-success-muted-foreground',
  FAILURE: 'bg-error-muted text-error-muted-foreground',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

const STATUS_ICONS = {
  SUCCESS: CheckCircle,
  FAILURE: XCircle,
  PENDING: Clock,
};

// Format timestamp with timezone
function formatTimestamp(isoString: string, timezone: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

// Format relative time
function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatTimestamp(isoString, 'UTC').split(',')[0];
  } catch {
    return isoString;
  }
}

// JSON Diff Viewer Component
function DiffViewer({ oldValue, newValue }: { oldValue?: Record<string, unknown>; newValue?: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  if (!oldValue && !newValue) return null;

  const formatJson = (obj: unknown) => JSON.stringify(obj, null, 2);

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        View Changes
      </button>
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-4">
          {oldValue && (
            <div>
              <div className="text-xs font-semibold text-error mb-1">Before</div>
              <pre className="bg-error-muted border border-error/30 rounded p-3 text-xs overflow-auto max-h-48">
                {formatJson(oldValue)}
              </pre>
            </div>
          )}
          {newValue && (
            <div>
              <div className="text-xs font-semibold text-success mb-1">After</div>
              <pre className="bg-success-muted border border-success/30 rounded p-3 text-xs overflow-auto max-h-48">
                {formatJson(newValue)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs mt-1', trend.isPositive ? 'text-success' : 'text-error')}>
              <TrendingUp className={cn('h-3 w-3', !trend.isPositive && 'rotate-180')} />
              <span>{Math.abs(trend.value)}% vs last period</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg bg-gradient-to-br text-white', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AuditLogsPage() {
  const { showSuccess, showError } = useDialog();
  const { currentTenant } = useTenant();

  // SECURITY: Use HttpOnly cookies for authentication instead of localStorage
  // The Authorization header is handled by the backend API routes via cookies
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (currentTenant?.id) {
      headers['x-jwt-claim-tenant-id'] = currentTenant.id;
    }
    return headers;
  };

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 });
  const [isConnected, setIsConnected] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    action: '',
    resource: '',
    status: '',
    severity: '',
    search: '',
    fromDate: '',
    toDate: '',
  });

  // Track if this is the initial load to prevent double-fetching
  const isInitialMount = useRef(true);
  // Debounce timer for search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track the last applied search to avoid redundant fetches
  const lastAppliedSearch = useRef('');

  // Retention state
  const [retentionSettings, setRetentionSettings] = useState<RetentionSettings | null>(null);
  const [savingRetention, setSavingRetention] = useState(false);

  // Fetch retention settings
  const fetchRetentionSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs/retention', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const response = await res.json();
        setRetentionSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to fetch retention settings:', error);
    }
  }, [currentTenant?.id]);

  // Update retention settings
  const updateRetentionSettings = async (retentionDays: number) => {
    setSavingRetention(true);
    try {
      const res = await fetch('/api/audit-logs/retention', {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ retentionDays }),
      });
      if (res.ok) {
        const response = await res.json();
        setRetentionSettings(response.settings);
        showSuccess('Success', `Retention period updated to ${retentionDays} days`);
      } else {
        const error = await res.json();
        showError('Error', error.error || 'Failed to update retention settings');
      }
    } catch (error) {
      showError('Error', 'Failed to update retention settings');
    } finally {
      setSavingRetention(false);
    }
  };

  // Fetch audit logs
  // offsetOverride allows passing a specific offset (for pagination) to avoid stale state issues
  const fetchLogs = useCallback(async (options: { resetToFirstPage?: boolean; offsetOverride?: number } = {}) => {
    const { resetToFirstPage = false, offsetOverride } = options;
    try {
      setFiltering(true);
      const params = new URLSearchParams();
      if (filters.action) params.set('action', filters.action);
      if (filters.resource) params.set('resource', filters.resource);
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.search) params.set('search', filters.search);
      if (filters.fromDate) params.set('from_date', new Date(filters.fromDate).toISOString());
      if (filters.toDate) params.set('to_date', new Date(filters.toDate).toISOString());
      params.set('limit', pagination.limit.toString());

      // Determine offset: override > reset > current
      let effectiveOffset = pagination.offset;
      if (offsetOverride !== undefined) {
        effectiveOffset = offsetOverride;
      } else if (resetToFirstPage) {
        effectiveOffset = 0;
      }
      params.set('offset', effectiveOffset.toString());
      params.set('sort_order', 'DESC');

      const res = await fetch(`/api/audit-logs?${params.toString()}`, { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const response = await res.json();
        setLogs(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          offset: effectiveOffset,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setFiltering(false);
    }
  }, [currentTenant?.id, filters, pagination.limit, pagination.offset]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs/summary', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const response = await res.json();
        setSummary(response);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, [currentTenant?.id]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchSummary(), fetchRetentionSettings()]);
      setLoading(false);
      isInitialMount.current = false;
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id]);

  // Effect to refetch when non-search filters change
  useEffect(() => {
    // Skip on initial mount (handled by initial load effect)
    if (isInitialMount.current) return;

    // Reset to first page when filters change
    fetchLogs({ resetToFirstPage: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.action, filters.resource, filters.status, filters.severity, filters.fromDate, filters.toDate]);

  // Debounced search effect
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) return;

    // Clear existing timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Only trigger if search has actually changed
    if (filters.search === lastAppliedSearch.current) return;

    // Debounce search by 400ms
    searchDebounceRef.current = setTimeout(() => {
      lastAppliedSearch.current = filters.search;
      fetchLogs({ resetToFirstPage: true });
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // SSE connection for real-time updates via NATS
  useEffect(() => {
    if (!currentTenant?.id) return;

    let reconnectTimer: NodeJS.Timeout | null = null;
    let abortController: AbortController | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connectSSE = () => {
      // Abort existing connection
      if (abortController) {
        abortController.abort();
      }

      // Create new AbortController for this connection
      abortController = new AbortController();

      // Create new EventSource with custom headers via fetch
      const headers = getAuthHeaders();

      setIsConnected(false);

      fetch('/api/audit-logs/stream', {
        headers,
        credentials: 'include',
        signal: abortController.signal,
      }).then(async response => {
        if (!response.ok || !response.body) {
          console.error('SSE connection failed');
          setIsConnected(false);
          // Reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            reconnectTimer = setTimeout(connectSSE, delay);
          }
          return;
        }

        // Connection successful
        setIsConnected(true);
        reconnectAttempts = 0;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                setIsConnected(false);
                // Stream ended, try to reconnect
                reconnectTimer = setTimeout(connectSSE, 5000);
                break;
              }

              const text = decoder.decode(value, { stream: true });
              const lines = text.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'connected') {
                      // NATS connection confirmed
                      setIsConnected(true);
                    } else if (data.type === 'update' && data.logs?.length > 0) {
                      // Prepend new logs to existing list
                      setLogs(prev => {
                        const newLogs = data.logs.filter(
                          (newLog: AuditLog) => !prev.some(existing => existing.id === newLog.id)
                        );
                        if (newLogs.length > 0) {
                          // Show toast for new events
                          const count = newLogs.length;
                          showSuccess('New Events', `${count} new audit event${count > 1 ? 's' : ''} received`);
                        }
                        return [...newLogs, ...prev].slice(0, pagination.limit);
                      });
                      // Update total count
                      setPagination(prev => ({ ...prev, total: prev.total + data.logs.length }));
                      // Refresh summary periodically
                      fetchSummary();
                    }
                  } catch {
                    // Ignore parse errors (heartbeats, etc.)
                  }
                }
              }
            }
          } catch (err) {
            setIsConnected(false);
            if ((err as Error).name !== 'AbortError') {
              console.error('SSE stream error:', err);
              // Reconnect after delay
              reconnectTimer = setTimeout(connectSSE, 5000);
            }
          }
        };

        processStream();
      }).catch(err => {
        setIsConnected(false);
        if (err.name !== 'AbortError') {
          console.error('SSE connection error:', err);
          // Reconnect with exponential backoff
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectAttempts++;
            reconnectTimer = setTimeout(connectSSE, delay);
          }
        }
      });

    };

    connectSSE();

    return () => {
      setIsConnected(false);
      if (abortController) {
        abortController.abort();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [currentTenant?.id, pagination.limit, fetchSummary, showSuccess]);

  // Handle export
  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (filters.action) params.set('action', filters.action);
      if (filters.resource) params.set('resource', filters.resource);
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.fromDate) params.set('from_date', new Date(filters.fromDate).toISOString());
      if (filters.toDate) params.set('to_date', new Date(filters.toDate).toISOString());

      const response = await fetch(`/api/audit-logs/export?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess('Success', 'Export completed successfully');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      showError('Error', 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Success', 'Copied to clipboard');
    } catch {
      showError('Error', 'Failed to copy');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      action: '',
      resource: '',
      status: '',
      severity: '',
      search: '',
      fromDate: '',
      toDate: '',
    });
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!summary) return null;
    const successCount = summary.byStatus['SUCCESS'] || 0;
    const failureCount = summary.byStatus['FAILURE'] || 0;
    const total = summary.totalLogs || 1;
    const successRate = Math.round((successCount / total) * 100);
    const criticalCount = (summary.bySeverity['CRITICAL'] || 0) + (summary.bySeverity['HIGH'] || 0);

    return { successRate, criticalCount, activeUsers: summary.topUsers?.length || 0 };
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading audit logs...</span>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Audit Logs Settings"
      fallbackDescription="You don't have permission to view audit logs."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <PageHeader
          title="Audit Logs"
          description="Track and monitor all system events and user activities"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Audit Logs' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              {/* Retention Period Selector */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={retentionSettings?.retentionDays?.toString() || '180'}
                        onValueChange={(v) => updateRetentionSettings(parseInt(v))}
                        disabled={savingRetention}
                      >
                        <SelectTrigger className="border-0 p-0 h-auto w-32 focus:ring-0">
                          <SelectValue placeholder="Retention" />
                        </SelectTrigger>
                        <SelectContent>
                          {RETENTION_OPTIONS.map((option) => (
                            <SelectItem key={option.days} value={option.days.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {savingRetention && <Loader2 className="h-3 w-3 animate-spin" />}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-medium">Log Retention Period</p>
                      <p className="text-muted-foreground">Logs older than this will be automatically deleted</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Timezone Selector */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="border-0 p-0 h-auto w-36 focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label.split(' (')[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Select timezone for timestamps</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* NATS Connection Status */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                      isConnected
                        ? 'bg-success-muted text-success-muted-foreground border border-green-200'
                        : 'bg-muted text-muted-foreground border border-border'
                    )}>
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        isConnected ? 'bg-success animate-pulse' : 'bg-gray-400'
                      )} />
                      {isConnected ? 'Live' : 'Connecting...'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isConnected ? 'Connected to real-time updates via NATS' : 'Connecting to real-time updates...'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Manual refresh */}
              <Button variant="outline" size="sm" onClick={() => { fetchLogs(); fetchSummary(); }} disabled={filtering}>
                <RefreshCw className={cn("h-4 w-4 mr-2", filtering && "animate-spin")} />
                Refresh
              </Button>

              {/* Export */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                >
                  CSV
                </Button>
              </div>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Events"
            value={summary?.totalLogs || 0}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={`${stats?.successRate || 0}%`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Critical Events"
            value={stats?.criticalCount || 0}
            icon={AlertTriangle}
            color="red"
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-foreground"
            >
              <Filter className="h-4 w-4" />
              Filters
              {/* Active filter count badge */}
              {(() => {
                const count = [filters.action, filters.resource, filters.status, filters.severity, filters.fromDate, filters.toDate].filter(Boolean).length;
                return count > 0 ? (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    {count}
                  </span>
                ) : null;
              })()}
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {filtering && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-64"
                />
                {filters.search && filtering && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {Object.values(filters).some(v => v) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} disabled={filtering}>
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Action</label>
                <Select value={filters.action} onValueChange={v => setFilters(prev => ({ ...prev, action: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    {ACTION_TYPES.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Resource</label>
                <Select value={filters.resource} onValueChange={v => setFilters(prev => ({ ...prev, resource: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All resources</SelectItem>
                    {RESOURCE_TYPES.map(resource => (
                      <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={filters.status} onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILURE">Failure</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity</label>
                <Select value={filters.severity} onValueChange={v => setFilters(prev => ({ ...prev, severity: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
                <Input
                  type="datetime-local"
                  value={filters.fromDate}
                  onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
                <Input
                  type="datetime-local"
                  value={filters.toDate}
                  onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No audit logs found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const StatusIcon = STATUS_ICONS[log.status];
                    const isExpanded = expandedLogId === log.id;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={cn(
                            'hover:bg-muted cursor-pointer transition-colors',
                            isExpanded && 'bg-primary/10/50'
                          )}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {formatTimestamp(log.timestamp, timezone)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatRelativeTime(log.timestamp)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {log.username || 'System'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {log.userEmail || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-foreground">{log.resource}</div>
                              {log.resourceName && (
                                <div className="text-xs text-muted-foreground truncate max-w-40">
                                  {log.resourceName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                              STATUS_COLORS[log.status]
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                              SEVERITY_COLORS[log.severity]
                            )}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-muted-foreground font-mono">{log.ipAddress || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={e => {
                                        e.stopPropagation();
                                        copyToClipboard(log.id);
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy ID</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-muted">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Request ID</div>
                                  <div className="font-mono text-foreground text-xs">{log.requestId || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Method</div>
                                  <div className="font-medium text-foreground">{log.method || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Path</div>
                                  <div className="font-mono text-foreground text-xs truncate">{log.path || 'N/A'}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Service</div>
                                  <div className="text-foreground">{log.serviceName || 'N/A'}</div>
                                </div>
                              </div>
                              {log.description && (
                                <div className="mt-4">
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Description</div>
                                  <div className="text-sm text-foreground">{log.description}</div>
                                </div>
                              )}
                              {log.errorMessage && (
                                <div className="mt-4 p-3 bg-error-muted border border-error/30 rounded-lg">
                                  <div className="flex items-center gap-2 text-error">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium">Error Message</span>
                                  </div>
                                  <div className="mt-1 text-sm text-error">{log.errorMessage}</div>
                                </div>
                              )}
                              <DiffViewer oldValue={log.oldValue} newValue={log.newValue} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + logs.length, pagination.total)} of{' '}
                {pagination.total.toLocaleString()} results
                {filtering && <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset === 0 || filtering}
                  onClick={() => {
                    const newOffset = Math.max(0, pagination.offset - pagination.limit);
                    fetchLogs({ offsetOverride: newOffset });
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset + pagination.limit >= pagination.total || filtering}
                  onClick={() => {
                    const newOffset = pagination.offset + pagination.limit;
                    fetchLogs({ offsetOverride: newOffset });
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            All timestamps are displayed in <span className="font-medium">{TIMEZONES.find(tz => tz.value === timezone)?.label || timezone}</span>.
            {isConnected ? (
              <span className="text-success font-medium"> Real-time updates connected via NATS.</span>
            ) : (
              <span className="text-muted-foreground"> Connecting to real-time updates...</span>
            )}
          </p>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}

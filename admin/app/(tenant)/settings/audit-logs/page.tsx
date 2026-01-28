'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Globe,
  Eye,
  Copy,
  Loader2,
  AlertCircle,
  Users,
  Database,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { useToast } from '@/contexts/ToastContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  topUsers: Array<{ userId: string; username: string; userEmail: string; count: number; lastActivity: string }>;
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

// Action types for filter
const ACTION_TYPES = [
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGE',
  'CREATE', 'READ', 'UPDATE', 'DELETE',
  'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'COMPLETE', 'CANCEL',
  'ROLE_ASSIGN', 'ROLE_REMOVE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE',
  'CONFIG_UPDATE', 'SETTING_CHANGE',
];

const RESOURCE_TYPES = [
  'USER', 'ROLE', 'PERMISSION', 'CATEGORY', 'PRODUCT', 'ORDER',
  'CUSTOMER', 'VENDOR', 'RETURN', 'REFUND', 'SHIPMENT', 'PAYMENT',
  'NOTIFICATION', 'DOCUMENT', 'SETTINGS', 'CONFIG', 'AUTH',
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'ET' },
  { value: 'America/Los_Angeles', label: 'PT' },
  { value: 'Europe/London', label: 'GMT' },
  { value: 'Asia/Kolkata', label: 'IST' },
];

const SEVERITY_COLORS = {
  LOW: 'bg-success-muted text-success-muted-foreground border-success/30',
  MEDIUM: 'bg-warning-muted text-warning border-warning/30',
  HIGH: 'bg-warning-muted text-warning border-warning/30',
  CRITICAL: 'bg-error-muted text-error-muted-foreground border-error/30',
};

const STATUS_COLORS = {
  SUCCESS: 'bg-success-muted text-success-muted-foreground',
  FAILURE: 'bg-error-muted text-error-muted-foreground',
  PENDING: 'bg-warning-muted text-warning',
};

const STATUS_ICONS = {
  SUCCESS: CheckCircle,
  FAILURE: XCircle,
  PENDING: Clock,
};

function formatTimestamp(isoString: string, timezone: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffMin < 1) return 'Now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    return `${diffDay}d`;
  } catch {
    return '';
  }
}

// Status Widget
function AuditStatusWidget({ summary }: { summary: AuditLogSummary | null }) {
  const successCount = summary?.byStatus['SUCCESS'] || 0;
  const total = summary?.totalLogs || 1;
  const successRate = Math.round((successCount / total) * 100);
  const criticalCount = (summary?.bySeverity['CRITICAL'] || 0) + (summary?.bySeverity['HIGH'] || 0);
  const isHealthy = successRate >= 90 && criticalCount < 10;

  const steps = [
    { done: total > 0, label: 'Logging' },
    { done: successRate >= 80, label: '80%+' },
    { done: successRate >= 90, label: '90%+' },
    { done: criticalCount < 10, label: 'Low Risk' },
  ];
  const completedCount = steps.filter(s => s.done).length;

  return (
    <div className={cn(
      "rounded-lg border p-3",
      isHealthy ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-xs font-medium", isHealthy ? "text-success" : "text-warning")}>
          {isHealthy ? 'Healthy' : 'Review Needed'}
        </span>
        <span className="text-xs text-muted-foreground">{completedCount}/4</span>
      </div>
      <div className="flex gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 group relative">
            <div className={cn(
              "h-1 rounded-full transition-colors",
              step.done ? isHealthy ? "bg-success" : "bg-warning" : "bg-muted"
            )} />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// DiffViewer Component
function DiffViewer({ oldValue, newValue }: { oldValue?: Record<string, unknown>; newValue?: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  if (!oldValue && !newValue) return null;
  const formatJson = (obj: unknown) => JSON.stringify(obj, null, 2);

  return (
    <div className="mt-4 border-t pt-4">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-xs font-medium text-foreground">
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        View Changes
      </button>
      {expanded && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {oldValue && (
            <div>
              <div className="text-[10px] font-semibold text-error mb-1">Before</div>
              <pre className="bg-error-muted border border-error/30 rounded p-2 text-[10px] overflow-auto max-h-32">{formatJson(oldValue)}</pre>
            </div>
          )}
          {newValue && (
            <div>
              <div className="text-[10px] font-semibold text-success mb-1">After</div>
              <pre className="bg-success-muted border border-success/30 rounded p-2 text-[10px] overflow-auto max-h-32">{formatJson(newValue)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const toast = useToast();
  const { currentTenant } = useTenant();

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (currentTenant?.id) headers['x-jwt-claim-tenant-id'] = currentTenant.id;
    return headers;
  };

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
    action: '', resource: '', status: '', severity: '', search: '', fromDate: '', toDate: '',
  });

  const isInitialMount = useRef(true);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastAppliedSearch = useRef('');

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
      let effectiveOffset = pagination.offset;
      if (offsetOverride !== undefined) effectiveOffset = offsetOverride;
      else if (resetToFirstPage) effectiveOffset = 0;
      params.set('offset', effectiveOffset.toString());
      params.set('sort_order', 'DESC');

      const res = await fetch(`/api/audit-logs?${params.toString()}`, { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const response = await res.json();
        setLogs(response.data || []);
        setPagination(prev => ({ ...prev, total: response.total || 0, offset: effectiveOffset }));
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setFiltering(false);
    }
  }, [currentTenant?.id, filters, pagination.limit, pagination.offset]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs/summary', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) setSummary(await res.json());
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchSummary()]);
      setLoading(false);
      isInitialMount.current = false;
    };
    load();
  }, [currentTenant?.id]);

  useEffect(() => {
    if (isInitialMount.current) return;
    fetchLogs({ resetToFirstPage: true });
  }, [filters.action, filters.resource, filters.status, filters.severity, filters.fromDate, filters.toDate]);

  useEffect(() => {
    if (isInitialMount.current) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (filters.search === lastAppliedSearch.current) return;
    searchDebounceRef.current = setTimeout(() => {
      lastAppliedSearch.current = filters.search;
      fetchLogs({ resetToFirstPage: true });
    }, 400);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [filters.search]);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      const response = await fetch(`/api/audit-logs/export?${params.toString()}`, { headers: getAuthHeaders(), credentials: 'include' });
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
        toast.success('Success', 'Export completed');
      }
    } catch (error) {
      toast.error('Error', 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied', 'ID copied to clipboard');
    } catch {
      toast.error('Error', 'Failed to copy');
    }
  };

  const clearFilters = () => setFilters({ action: '', resource: '', status: '', severity: '', search: '', fromDate: '', toDate: '' });

  const stats = useMemo(() => {
    if (!summary) return null;
    const successCount = summary.byStatus['SUCCESS'] || 0;
    const total = summary.totalLogs || 1;
    return {
      total: summary.totalLogs,
      successRate: Math.round((successCount / total) * 100),
      criticalCount: (summary.bySeverity['CRITICAL'] || 0) + (summary.bySeverity['HIGH'] || 0),
      failureCount: summary.byStatus['FAILURE'] || 0,
    };
  }, [summary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGate permission={Permission.SETTINGS_VIEW} fallback="styled" fallbackTitle="Audit Logs" fallbackDescription="You don't have permission to view audit logs.">
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Audit Logs"
            description="Track system events and user activities"
            breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings', href: '/settings' }, { label: 'Audit Logs' }]}
            actions={
              <div className="flex items-center gap-2">
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => { fetchLogs(); fetchSummary(); }} disabled={filtering} className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all" title="Refresh">
                  <RefreshCw className={cn("w-5 h-5 text-muted-foreground", filtering && "animate-spin")} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={exporting}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            }
          />

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-3">
                <AuditStatusWidget summary={summary} />

                {/* Quick Links */}
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 h-8 text-xs p-2.5 rounded-md bg-muted hover:bg-muted transition-all" onClick={() => { fetchLogs(); fetchSummary(); }} title="Refresh">
                    <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{(stats?.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Success</span>
                    <span className="font-medium text-success">{stats?.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Critical</span>
                    <span className="font-medium text-warning">{stats?.criticalCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-error">{stats?.failureCount || 0}</span>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Quick Filters</p>
                  <Button
                    variant={filters.severity === 'CRITICAL' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start h-7 text-xs"
                    onClick={() => setFilters(prev => ({ ...prev, severity: prev.severity === 'CRITICAL' ? '' : 'CRITICAL' }))}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1 text-error" />
                    Critical
                  </Button>
                  <Button
                    variant={filters.status === 'FAILURE' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start h-7 text-xs"
                    onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'FAILURE' ? '' : 'FAILURE' }))}
                  >
                    <XCircle className="h-3 w-3 mr-1 text-error" />
                    Failures
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Status + Stats */}
              <div className="lg:hidden mb-4 space-y-3">
                <AuditStatusWidget summary={summary} />
                <div className="flex gap-2">
                  <div className="flex-1 bg-card rounded-lg border border-border p-2 text-center">
                    <p className="text-lg font-bold">{(stats?.total || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Events</p>
                  </div>
                  <div className="flex-1 bg-card rounded-lg border border-border p-2 text-center">
                    <p className="text-lg font-bold text-success">{stats?.successRate || 0}%</p>
                    <p className="text-[10px] text-muted-foreground">Success</p>
                  </div>
                  <div className="flex-1 bg-card rounded-lg border border-border p-2 text-center">
                    <p className="text-lg font-bold text-error">{stats?.failureCount || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Failed</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-card rounded-lg border border-border p-3 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-xs font-medium">
                    <Filter className="h-3 w-3" />
                    Filters
                    {showFilters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={filters.search}
                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-7 h-8 text-xs w-full sm:w-48"
                      />
                    </div>
                    {Object.values(filters).some(v => v) && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>Clear</Button>
                    )}
                  </div>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 mt-3 border-t">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Action</label>
                      <Select value={filters.action || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, action: v === 'all' ? '' : v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {ACTION_TYPES.map(action => <SelectItem key={action} value={action}>{action}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Resource</label>
                      <Select value={filters.resource || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, resource: v === 'all' ? '' : v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {RESOURCE_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Status</label>
                      <Select value={filters.status || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, status: v === 'all' ? '' : v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="SUCCESS">Success</SelectItem>
                          <SelectItem value="FAILURE">Failure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Severity</label>
                      <Select value={filters.severity || 'all'} onValueChange={v => setFilters(prev => ({ ...prev, severity: v === 'all' ? '' : v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">From</label>
                      <Input type="datetime-local" value={filters.fromDate} onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">To</label>
                      <Input type="datetime-local" value={filters.toDate} onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value }))} className="h-8 text-xs" />
                    </div>
                  </div>
                )}
              </div>

              {/* Logs Table */}
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase">Time</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase hidden sm:table-cell">User</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase">Action</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase hidden md:table-cell">Resource</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-foreground uppercase hidden lg:table-cell">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">No logs found</p>
                          </td>
                        </tr>
                      ) : (
                        logs.map(log => {
                          const StatusIcon = STATUS_ICONS[log.status];
                          const isExpanded = expandedLogId === log.id;
                          return (
                            <React.Fragment key={log.id}>
                              <tr
                                className={cn("hover:bg-muted/50 cursor-pointer transition-colors", isExpanded && "bg-primary/5")}
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              >
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1">
                                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                    <div>
                                      <div className="text-xs font-medium">{formatTimestamp(log.timestamp, timezone)}</div>
                                      <div className="text-[10px] text-muted-foreground">{formatRelativeTime(log.timestamp)}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2 hidden sm:table-cell">
                                  <div className="text-xs font-medium truncate max-w-[100px]">{log.username || 'System'}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-3 py-2 hidden md:table-cell">
                                  <div className="text-xs font-medium">{log.resource}</div>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium', STATUS_COLORS[log.status])}>
                                    <StatusIcon className="h-2.5 w-2.5" />
                                    <span className="hidden sm:inline">{log.status}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-2 hidden lg:table-cell">
                                  <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border', SEVERITY_COLORS[log.severity])}>
                                    {log.severity}
                                  </span>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-muted/50">
                                  <td colSpan={6} className="px-4 py-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                      <div>
                                        <div className="text-[10px] font-medium text-muted-foreground mb-0.5">User</div>
                                        <div className="font-medium">{log.username || 'System'}</div>
                                        <div className="text-[10px] text-muted-foreground">{log.userEmail || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Resource</div>
                                        <div className="font-medium">{log.resource}</div>
                                        {log.resourceName && <div className="text-[10px] text-muted-foreground truncate">{log.resourceName}</div>}
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-medium text-muted-foreground mb-0.5">IP Address</div>
                                        <div className="font-mono text-[10px]">{log.ipAddress || 'N/A'}</div>
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Service</div>
                                        <div>{log.serviceName || 'N/A'}</div>
                                      </div>
                                    </div>
                                    {log.description && (
                                      <div className="mt-3">
                                        <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Description</div>
                                        <div className="text-xs">{log.description}</div>
                                      </div>
                                    )}
                                    {log.errorMessage && (
                                      <div className="mt-3 p-2 bg-error-muted border border-error/30 rounded">
                                        <div className="flex items-center gap-1 text-error text-[10px] font-medium">
                                          <AlertCircle className="h-3 w-3" />
                                          Error
                                        </div>
                                        <div className="text-xs text-error mt-1">{log.errorMessage}</div>
                                      </div>
                                    )}
                                    <DiffViewer oldValue={log.oldValue} newValue={log.newValue} />
                                    <div className="mt-3 flex gap-2">
                                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); copyToClipboard(log.id); }}>
                                        <Copy className="h-3 w-3 mr-1" />
                                        Copy ID
                                      </Button>
                                    </div>
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
                  <div className="px-3 py-2 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted text-xs">
                    <div className="text-muted-foreground">
                      {pagination.offset + 1}-{Math.min(pagination.offset + logs.length, pagination.total)} of {pagination.total.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={pagination.offset === 0 || filtering}
                        onClick={() => fetchLogs({ offsetOverride: Math.max(0, pagination.offset - pagination.limit) })}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={pagination.offset + pagination.limit >= pagination.total || filtering}
                        onClick={() => fetchLogs({ offsetOverride: pagination.offset + pagination.limit })}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

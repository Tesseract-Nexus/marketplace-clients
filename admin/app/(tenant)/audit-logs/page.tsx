'use client';

import React, { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  AlertTriangle,
  Shield,
  Clock,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { PermissionGate, Permission } from '@/components/permission-gate';

interface AuditLog {
  id: string;
  timestamp: string;
  tenantId: string;
  userId: string;
  username: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  resourceName?: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  errorMessage?: string;
  serviceName?: string;
}

// Mock Data
const MOCK_LOGS: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-12-13T10:45:23Z',
    tenantId: 'tenant-1',
    userId: 'user-123',
    username: 'admin',
    userEmail: 'admin@example.com',
    action: 'CREATE',
    resource: 'PRODUCT',
    resourceId: 'prod-456',
    resourceName: 'Premium Wireless Headphones',
    status: 'SUCCESS',
    severity: 'LOW',
    method: 'POST',
    path: '/api/products',
    ipAddress: '192.168.1.100',
    description: 'Created new product in catalog',
    serviceName: 'product-service',
  },
  {
    id: '2',
    timestamp: '2024-12-13T10:38:15Z',
    tenantId: 'tenant-1',
    userId: 'user-456',
    username: 'john.doe',
    userEmail: 'john.doe@example.com',
    action: 'LOGIN',
    resource: 'USER',
    status: 'FAILURE',
    severity: 'HIGH',
    method: 'POST',
    path: '/api/auth/login',
    ipAddress: '203.0.113.45',
    description: 'Failed login attempt - invalid credentials',
    errorMessage: 'Invalid username or password',
    serviceName: 'auth-service',
  },
  {
    id: '3',
    timestamp: '2024-12-13T10:30:42Z',
    tenantId: 'tenant-1',
    userId: 'user-789',
    username: 'sarah.admin',
    userEmail: 'sarah.admin@example.com',
    action: 'DELETE',
    resource: 'ORDER',
    resourceId: 'order-789',
    resourceName: 'Order #12345',
    status: 'SUCCESS',
    severity: 'CRITICAL',
    method: 'DELETE',
    path: '/api/orders/789',
    ipAddress: '192.168.1.105',
    description: 'Deleted cancelled order from system',
    serviceName: 'order-service',
  },
  {
    id: '4',
    timestamp: '2024-12-13T10:25:11Z',
    tenantId: 'tenant-1',
    userId: 'user-234',
    username: 'mike.manager',
    userEmail: 'mike.manager@example.com',
    action: 'UPDATE',
    resource: 'ROLE',
    resourceId: 'role-456',
    resourceName: 'Store Manager',
    status: 'SUCCESS',
    severity: 'MEDIUM',
    method: 'PUT',
    path: '/api/roles/456',
    ipAddress: '192.168.1.110',
    description: 'Updated role permissions',
    serviceName: 'auth-service',
  },
  {
    id: '5',
    timestamp: '2024-12-13T10:15:33Z',
    tenantId: 'tenant-1',
    userId: 'user-567',
    username: 'emma.staff',
    userEmail: 'emma.staff@example.com',
    action: 'APPROVE',
    resource: 'RETURN',
    resourceId: 'return-123',
    resourceName: 'Return #RET-001',
    status: 'SUCCESS',
    severity: 'LOW',
    method: 'POST',
    path: '/api/returns/123/approve',
    ipAddress: '192.168.1.115',
    description: 'Approved customer return request',
    serviceName: 'return-service',
  },
  {
    id: '6',
    timestamp: '2024-12-13T10:10:05Z',
    tenantId: 'tenant-1',
    userId: 'user-890',
    username: 'alex.dev',
    userEmail: 'alex.dev@example.com',
    action: 'UPDATE',
    resource: 'PAYMENT',
    resourceId: 'payment-555',
    resourceName: 'Payment #PAY-789',
    status: 'FAILURE',
    severity: 'CRITICAL',
    method: 'PUT',
    path: '/api/payments/555',
    ipAddress: '192.168.1.120',
    description: 'Failed to process payment update',
    errorMessage: 'Payment gateway timeout',
    serviceName: 'payment-service',
  },
];

const MOCK_SUMMARY = {
  totalLogs: 1245,
  successRate: 94.2,
  highSeverity: 23,
  failedActions: 72,
};

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'REJECT', label: 'Reject' },
];

const resourceOptions = [
  { value: '', label: 'All Resources' },
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
  { value: 'ORDER', label: 'Order' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'RETURN', label: 'Return' },
  { value: 'PAYMENT', label: 'Payment' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILURE', label: 'Failure' },
  { value: 'PENDING', label: 'Pending' },
];

const severityOptions = [
  { value: '', label: 'All Severity' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

// Status Widget
function AuditStatusWidget({ summary }: { summary: typeof MOCK_SUMMARY }) {
  const isHealthy = summary.successRate >= 90;
  const steps = [
    { done: summary.totalLogs > 0, label: 'Logging' },
    { done: summary.successRate >= 80, label: '80%+' },
    { done: summary.successRate >= 90, label: '90%+' },
    { done: summary.highSeverity < 10, label: 'Low Risk' },
  ];
  const completedCount = steps.filter(s => s.done).length;

  return (
    <div className={cn(
      "rounded-lg border p-3",
      isHealthy ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-xs font-medium",
          isHealthy ? "text-success" : "text-warning"
        )}>
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

export default function AuditLogsPage() {
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-error-muted text-error border-error/30';
      case 'HIGH': return 'bg-warning-muted text-warning border-warning/30';
      case 'MEDIUM': return 'bg-warning-muted text-warning border-warning/30';
      case 'LOW': return 'bg-success-muted text-success-foreground border-success/30';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-success-muted text-success-foreground border-success/30';
      case 'FAILURE': return 'bg-error-muted text-error border-error/30';
      case 'PENDING': return 'bg-warning-muted text-warning border-warning/30';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const formatTimestamp = (timestamp: string) => new Date(timestamp).toLocaleString();

  const resetFilters = () => {
    setSearchText('');
    setActionFilter('');
    setResourceFilter('');
    setStatusFilter('');
    setSeverityFilter('');
  };

  return (
    <PermissionGate
      permission={Permission.AUDIT_VIEW}
      fallback="styled"
      fallbackTitle="Audit Logs Access Required"
      fallbackDescription="You don't have the required permissions to view audit logs."
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Audit Logs"
            description="Track all system activities and security events"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Audit Logs' },
            ]}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            }
          />

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-3">
                <AuditStatusWidget summary={MOCK_SUMMARY} />

                {/* Quick Links */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs p-2.5" title="Refresh">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-medium">{MOCK_SUMMARY.totalLogs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium text-success">{MOCK_SUMMARY.successRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">High Severity</span>
                    <span className="font-medium text-warning">{MOCK_SUMMARY.highSeverity}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-error">{MOCK_SUMMARY.failedActions}</span>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Quick Filters</p>
                  <Button
                    variant={severityFilter === 'CRITICAL' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start h-7 text-xs"
                    onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? '' : 'CRITICAL')}
                  >
                    <AlertTriangle className="h-3 w-3 mr-1 text-error" />
                    Critical Only
                  </Button>
                  <Button
                    variant={statusFilter === 'FAILURE' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start h-7 text-xs"
                    onClick={() => setStatusFilter(statusFilter === 'FAILURE' ? '' : 'FAILURE')}
                  >
                    <XCircle className="h-3 w-3 mr-1 text-error" />
                    Failures Only
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Status */}
              <div className="lg:hidden mb-4">
                <AuditStatusWidget summary={MOCK_SUMMARY} />
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="bg-card rounded-lg border border-border p-4 mb-4 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4 text-primary" />
                      Filters
                    </h3>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Search</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
                        <Input
                          placeholder="Search..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="pl-7 h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Action</label>
                      <Select value={actionFilter} onChange={setActionFilter} options={actionOptions} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Resource</label>
                      <Select value={resourceFilter} onChange={setResourceFilter} options={resourceOptions} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Status</label>
                      <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Logs Table */}
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Resource</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {MOCK_LOGS.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedLog(log)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs font-medium text-foreground">{log.username}</p>
                            <p className="text-[10px] text-muted-foreground">{log.userEmail}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs font-medium text-foreground">{log.resource}</p>
                            {log.resourceName && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{log.resourceName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                              getStatusColor(log.status)
                            )}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                              getSeverityColor(log.severity)
                            )}>
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="bg-card rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-border p-4">
                <h2 className="text-lg font-bold text-foreground">Audit Log Details</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Timestamp</label>
                    <p className="text-sm text-foreground">{formatTimestamp(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">User</label>
                    <p className="text-sm text-foreground">{selectedLog.username}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Action</label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Resource</label>
                    <p className="text-sm text-foreground">{selectedLog.resource}</p>
                    {selectedLog.resourceName && (
                      <p className="text-xs text-muted-foreground">{selectedLog.resourceName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                      getStatusColor(selectedLog.status)
                    )}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Severity</label>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                      getSeverityColor(selectedLog.severity)
                    )}>
                      {selectedLog.severity}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">IP Address</label>
                    <p className="text-sm text-foreground">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Service</label>
                    <p className="text-sm text-foreground">{selectedLog.serviceName}</p>
                  </div>
                </div>
                {selectedLog.path && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Path</label>
                    <p className="text-xs font-mono bg-muted p-2 rounded">{selectedLog.method} {selectedLog.path}</p>
                  </div>
                )}
                {selectedLog.description && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                    <p className="text-sm text-foreground bg-muted p-2 rounded">{selectedLog.description}</p>
                  </div>
                )}
                {selectedLog.errorMessage && (
                  <div>
                    <label className="block text-xs font-medium text-error mb-1">Error</label>
                    <p className="text-sm text-error bg-error-muted p-2 rounded">{selectedLog.errorMessage}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border p-4 flex justify-end">
                <Button onClick={() => setSelectedLog(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}

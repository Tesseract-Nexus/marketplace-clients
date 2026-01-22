'use client';

import React, { useState } from 'react';
import {
  Search,
  Download,
  Filter,
  AlertTriangle,
  Shield,
  User,
  Calendar,
  Clock,
  XCircle,
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
    userAgent: 'Mozilla/5.0...',
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
    userAgent: 'Mozilla/5.0...',
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
    userAgent: 'Mozilla/5.0...',
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
    userAgent: 'Mozilla/5.0...',
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
    userAgent: 'Mozilla/5.0...',
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
    userAgent: 'Mozilla/5.0...',
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

export default function AuditLogsPage() {
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'HIGH':
        return 'bg-warning-muted text-warning border-warning/30';
      case 'MEDIUM':
        return 'bg-warning-muted text-warning border-warning/30';
      case 'LOW':
        return 'bg-success-muted text-success-foreground border-success/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-success-muted text-success-foreground border-success/30';
      case 'FAILURE':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'PENDING':
        return 'bg-warning-muted text-warning border-warning/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const resetFilters = () => {
    setSearchText('');
    setActionFilter('');
    setResourceFilter('');
    setStatusFilter('');
    setSeverityFilter('');
    setFromDate('');
    setToDate('');
  };

  const handleExport = (format: 'csv' | 'json') => {
    // TODO: Implement audit log export via audit-service API
  };

  return (
    <PermissionGate
      permission={Permission.AUDIT_VIEW}
      fallback="styled"
      fallbackTitle="Audit Logs Access Required"
      fallbackDescription="You don't have the required permissions to view audit logs. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Audit Logs"
          description="Track all system activities and security events across your platform"
          breadcrumbs={[
            { label: '🏠 Home', href: '/' },
            { label: '🔒 Security' },
            { label: '📋 Audit Logs' },
          ]}
          actions={
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {MOCK_SUMMARY.totalLogs.toLocaleString()}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-success">
              {MOCK_SUMMARY.successRate}%
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">High Severity</p>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning">
              {MOCK_SUMMARY.highSeverity}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Failed Actions</p>
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="text-3xl font-bold text-destructive">
              {MOCK_SUMMARY.failedActions}
            </p>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters
              </h3>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Action
                </label>
                <Select
                  value={actionFilter}
                  onChange={setActionFilter}
                  options={actionOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resource
                </label>
                <Select
                  value={resourceFilter}
                  onChange={setResourceFilter}
                  options={resourceOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Severity
                </label>
                <Select
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  options={severityOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  From Date
                </label>
                <Input
                  type="datetime-local"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  To Date
                </label>
                <Input
                  type="datetime-local"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {MOCK_LOGS.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-foreground">
                        {log.username}
                      </p>
                      <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-foreground">{log.resource}</p>
                      {log.resourceName && (
                        <p className="text-xs text-muted-foreground">{log.resourceName}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                          getStatusColor(log.status)
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                          getSeverityColor(log.severity)
                        )}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Log Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-card rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border p-6">
              <h2 className="text-2xl font-bold text-foreground">Audit Log Details</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Timestamp
                  </label>
                  <p className="text-sm text-foreground">
                    {formatTimestamp(selectedLog.timestamp)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    User
                  </label>
                  <p className="text-sm text-foreground">
                    {selectedLog.username} ({selectedLog.userEmail})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Action
                  </label>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Resource
                  </label>
                  <p className="text-sm text-foreground">{selectedLog.resource}</p>
                  {selectedLog.resourceName && (
                    <p className="text-xs text-muted-foreground">{selectedLog.resourceName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Status
                  </label>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                      getStatusColor(selectedLog.status)
                    )}
                  >
                    {selectedLog.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Severity
                  </label>
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                      getSeverityColor(selectedLog.severity)
                    )}
                  >
                    {selectedLog.severity}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    IP Address
                  </label>
                  <p className="text-sm text-foreground">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Service
                  </label>
                  <p className="text-sm text-foreground">{selectedLog.serviceName}</p>
                </div>
                {selectedLog.method && (
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">
                      HTTP Method
                    </label>
                    <p className="text-sm text-foreground">{selectedLog.method}</p>
                  </div>
                )}
                {selectedLog.path && (
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      Path
                    </label>
                    <p className="text-sm font-mono text-xs bg-muted p-2 rounded border border-border">
                      {selectedLog.path}
                    </p>
                  </div>
                )}
              </div>

              {selectedLog.description && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">
                    Description
                  </label>
                  <p className="text-sm text-foreground bg-muted p-3 rounded border border-border">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div>
                  <label className="block text-sm font-bold text-destructive mb-1">
                    Error Message
                  </label>
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/30">
                    {selectedLog.errorMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-border p-6 flex justify-end">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGate>
  );
}

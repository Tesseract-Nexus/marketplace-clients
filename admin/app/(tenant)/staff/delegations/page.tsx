'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { delegationService, workflowService, Delegation, ApprovalWorkflow } from '@/lib/services/approvalService';
import { staffService } from '@/lib/services/staffService';
import { Staff } from '@/lib/api/types';
import { useToast } from '@/contexts/ToastContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Loader2,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Ban,
  UserCheck,
  Shield,
  CalendarDays,
} from 'lucide-react';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (delegation: Delegation) => {
  const now = new Date();
  const startDate = new Date(delegation.startDate);
  const endDate = new Date(delegation.endDate);

  if (!delegation.isActive || delegation.revokedAt) {
    return <Badge variant="destructive">Revoked</Badge>;
  }
  if (now < startDate) {
    return <Badge variant="secondary">Pending</Badge>;
  }
  if (now > endDate) {
    return <Badge variant="outline">Expired</Badge>;
  }
  return <Badge variant="default">Active</Badge>;
};

const getDelegationStatus = (delegation: Delegation): 'active' | 'pending' | 'expired' | 'revoked' => {
  const now = new Date();
  const startDate = new Date(delegation.startDate);
  const endDate = new Date(delegation.endDate);

  if (!delegation.isActive || delegation.revokedAt) return 'revoked';
  if (now < startDate) return 'pending';
  if (now > endDate) return 'expired';
  return 'active';
};

export default function DelegationsPage() {
  const toast = useToast();
  const [outgoing, setOutgoing] = useState<Delegation[]>([]);
  const [incoming, setIncoming] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [includeExpired, setIncludeExpired] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [formData, setFormData] = useState({
    delegateId: '',
    workflowId: '',
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Revoke dialog state
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const loadDelegations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [outgoingData, incomingData] = await Promise.all([
        delegationService.listOutgoing(includeExpired),
        delegationService.listIncoming(includeExpired),
      ]);
      setOutgoing(outgoingData || []);
      setIncoming(incomingData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delegations');
      console.error('Error loading delegations:', err);
    } finally {
      setLoading(false);
    }
  }, [includeExpired]);

  useEffect(() => {
    loadDelegations();
  }, [loadDelegations]);

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const [staffRes, workflowRes] = await Promise.all([
        staffService.getStaff({ limit: 100 }),
        workflowService.listWorkflows(),
      ]);
      setStaffMembers(staffRes.data || []);
      setWorkflows(workflowRes.data || []);
    } catch (err) {
      console.error('Error loading resources:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      delegateId: '',
      workflowId: '',
      reason: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setFormError(null);
    setCreateDialogOpen(true);
    loadResources();
  };

  const handleCreate = async () => {
    if (!formData.delegateId) {
      setFormError('Please select a delegate');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError('Please select start and end dates');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setFormError('End date must be after start date');
      return;
    }

    try {
      setCreating(true);
      setFormError(null);
      await delegationService.create({
        delegateId: formData.delegateId,
        workflowId: formData.workflowId || undefined,
        reason: formData.reason || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      setCreateDialogOpen(false);
      await loadDelegations();
      toast.success('Delegation Created', 'Approval authority has been successfully delegated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create delegation';
      setFormError(errorMessage);
      toast.error('Creation Failed', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const openRevokeDialog = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setRevokeReason('');
    setRevokeDialogOpen(true);
  };

  const handleRevoke = async () => {
    if (!selectedDelegation) return;
    try {
      setActionLoading(selectedDelegation.id);
      await delegationService.revoke(selectedDelegation.id, { reason: revokeReason });
      setRevokeDialogOpen(false);
      setSelectedDelegation(null);
      setRevokeReason('');
      await loadDelegations();
      toast.success('Delegation Revoked', 'The delegation has been successfully revoked');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke delegation';
      setError(errorMessage);
      toast.error('Revoke Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const activeOutgoing = outgoing.filter((d) => getDelegationStatus(d) === 'active').length;
  const activeIncoming = incoming.filter((d) => getDelegationStatus(d) === 'active').length;
  const totalDelegations = outgoing.length + incoming.length;

  const sidebarConfig = useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Delegation Health',
      currentValue: activeOutgoing + activeIncoming,
      totalValue: totalDelegations || 1,
      status: totalDelegations === 0 ? 'healthy' : (activeOutgoing + activeIncoming) > 0 ? 'healthy' : 'attention',
      segments: [
        { value: activeOutgoing, color: 'success' },
        { value: activeIncoming, color: 'primary' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Delegation Status',
        items: [
          {
            icon: ArrowUpRight,
            label: 'Outgoing Active',
            value: activeOutgoing,
            color: 'success',
            onClick: () => setActiveTab('outgoing'),
          },
          {
            icon: ArrowDownLeft,
            label: 'Incoming Active',
            value: activeIncoming,
            color: 'primary',
            onClick: () => setActiveTab('incoming'),
          },
          {
            icon: UserCheck,
            label: 'Total Delegations',
            value: totalDelegations,
          },
        ] as SidebarStatItem[],
      },
    ];

    return { healthWidget, sections };
  }, [activeOutgoing, activeIncoming, totalDelegations]);

  const mobileStats = useMemo(() => [
    { id: 'outgoing', icon: ArrowUpRight, label: 'Outgoing', value: activeOutgoing, color: 'success' as const },
    { id: 'incoming', icon: ArrowDownLeft, label: 'Incoming', value: activeIncoming, color: 'primary' as const },
    { id: 'total', icon: UserCheck, label: 'Total', value: totalDelegations },
  ], [activeOutgoing, activeIncoming, totalDelegations]);

  const renderDelegationCard = (delegation: Delegation, type: 'outgoing' | 'incoming') => {
    const status = getDelegationStatus(delegation);
    const isRevocable = type === 'outgoing' && status === 'active';

    return (
      <div key={delegation.id} className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
        <div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Left: Icon and Info */}
            <div className="flex items-start gap-4 flex-1">
              <div className={cn(
                "p-3 rounded-xl",
                status === 'active' ? "bg-primary/10" :
                status === 'pending' ? "bg-secondary" :
                status === 'revoked' ? "bg-error-muted" : "bg-muted"
              )}>
                {type === 'outgoing' ? (
                  <ArrowUpRight className="w-5 h-5 text-foreground" />
                ) : (
                  <ArrowDownLeft className="w-5 h-5 text-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {getStatusBadge(delegation)}
                  {delegation.workflowId ? (
                    <Badge variant="outline">
                      <Shield className="w-3 h-3 mr-1" />
                      {delegation.workflowName || 'Specific Workflow'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      All Workflows
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground font-medium mb-1">
                  {type === 'outgoing' ? (
                    <>
                      <span className="text-muted-foreground">Delegated to:</span>{' '}
                      {delegation.delegateName || delegation.delegateEmail || delegation.delegateId}
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">Delegated by:</span>{' '}
                      {delegation.delegatorName || delegation.delegatorEmail || delegation.delegatorId}
                    </>
                  )}
                </p>
                {delegation.reason && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {delegation.reason}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created {formatDateTime(delegation.createdAt)}
                  </span>
                </div>
                {delegation.revokedAt && (
                  <p className="mt-2 text-sm text-error bg-error-muted px-3 py-1 rounded-lg inline-block">
                    Revoked on {formatDateTime(delegation.revokedAt)}
                    {delegation.revokeReason && `: ${delegation.revokeReason}`}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            {isRevocable && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openRevokeDialog(delegation)}
                  disabled={actionLoading === delegation.id}
                >
                  {actionLoading === delegation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-1" />
                      Revoke
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <PermissionGate
      permission={Permission.APPROVALS_READ}
      fallback="styled"
      fallbackTitle="Staff Delegations Access Required"
      fallbackDescription="You don't have the required permissions to view staff delegations. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Approval Delegations"
            description="Manage approval authority delegations for when you're away"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Delegations' },
            ]}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={loadDelegations}
                  disabled={loading}
                  className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Delegation
                </Button>
              </div>
            }
          />

          {/* Error State - positioned above stats */}
          <PageError error={error} onRetry={loadDelegations} onDismiss={() => setError(null)} />

          {/* Hide content when there's a critical error */}
          {error && (error.toLowerCase().includes('permission') || error.toLowerCase().includes('forbidden') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('access denied') || error.toLowerCase().includes('admin portal')) ? null : (
          <>
          <DataPageLayout sidebar={sidebarConfig} mobileStats={mobileStats}>
          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExpired}
                  onChange={(e) => setIncludeExpired(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
                <span className="text-sm text-foreground">Include expired & revoked</span>
              </label>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Loading delegations...</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          {!loading && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'outgoing' | 'incoming')}>
              <TabsList className="inline-flex h-auto items-center justify-start rounded-xl bg-card border border-border p-1 shadow-sm mb-6">
                <TabsTrigger value="outgoing" className="px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Outgoing ({outgoing.length})
                </TabsTrigger>
                <TabsTrigger value="incoming" className="px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Incoming ({incoming.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="outgoing" className="mt-0 space-y-4">
                {outgoing.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <ArrowUpRight className="w-16 h-16 mx-auto text-primary/60 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Outgoing Delegations</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't delegated your approval authority to anyone.
                    </p>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Delegation
                    </Button>
                  </div>
                ) : (
                  outgoing.map((d) => renderDelegationCard(d, 'outgoing'))
                )}
              </TabsContent>

              <TabsContent value="incoming" className="mt-0 space-y-4">
                {incoming.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <ArrowDownLeft className="w-16 h-16 mx-auto text-secondary/60 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Incoming Delegations</h3>
                    <p className="text-muted-foreground">
                      No one has delegated their approval authority to you.
                    </p>
                  </div>
                ) : (
                  incoming.map((d) => renderDelegationCard(d, 'incoming'))
                )}
              </TabsContent>
            </Tabs>
          )}
          </DataPageLayout>
          </>
          )}

          {/* Create Delegation Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Delegation</DialogTitle>
                <DialogDescription>
                  Delegate your approval authority to another staff member while you're away.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-error-muted text-error text-sm">
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="delegate">Delegate To *</Label>
                  {loadingResources ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading staff members...
                    </div>
                  ) : (
                    <Select
                      value={formData.delegateId}
                      onValueChange={(v) => setFormData({ ...formData, delegateId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.firstName} {staff.lastName} ({staff.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workflow">Workflow (Optional)</Label>
                  <Select
                    value={formData.workflowId}
                    onValueChange={(v) => setFormData({ ...formData, workflowId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All workflows (global delegation)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All workflows (global delegation)</SelectItem>
                      {workflows.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.displayName || workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to delegate all approval workflows.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., On vacation from Dec 20-27"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Delegation'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Revoke Dialog */}
          <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Revoke Delegation</DialogTitle>
                <DialogDescription>
                  This will immediately revoke the delegation. The delegate will no longer be able to approve requests on your behalf.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="revokeReason">Reason (Optional)</Label>
                <Textarea
                  id="revokeReason"
                  placeholder="Enter reason for revoking..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevoke}
                  disabled={actionLoading !== null}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Revoke Delegation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PermissionGate>
  );
}

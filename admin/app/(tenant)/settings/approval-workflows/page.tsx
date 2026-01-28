'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldCheck,
  Truck,
  Users,
  Loader2,
  Settings2,
  Plus,
  Trash2,
  Ban,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { workflowService, ApprovalWorkflow, TriggerThreshold, EscalationConfig } from '@/lib/services/approvalService';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading } from '@/components/common';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';

// Status Widget
function WorkflowStatusWidget({
  totalWorkflows,
  activeWorkflows,
  systemWorkflows,
}: {
  totalWorkflows: number;
  activeWorkflows: number;
  systemWorkflows: number;
}) {
  const steps = [
    { done: totalWorkflows > 0, label: 'Configured' },
    { done: activeWorkflows > 0, label: 'Active' },
    { done: systemWorkflows > 0, label: 'System' },
    { done: activeWorkflows === totalWorkflows, label: 'All On' },
  ];
  const completedCount = steps.filter(s => s.done).length;
  const isReady = activeWorkflows > 0;

  return (
    <div className={cn(
      "rounded-lg border p-3",
      isReady ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "text-xs font-medium",
          isReady ? "text-success" : "text-warning"
        )}>
          {isReady ? 'Active' : 'Setup Required'}
        </span>
        <span className="text-xs text-muted-foreground">{completedCount}/4</span>
      </div>
      <div className="flex gap-1">
        {steps.map((step, i) => (
          <div key={i} className="flex-1 group relative">
            <div className={cn(
              "h-1 rounded-full transition-colors",
              step.done ? isReady ? "bg-success" : "bg-warning" : "bg-muted"
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

// Icon mapping for workflow types
const workflowIcons: Record<string, React.ElementType> = {
  refund_workflow: DollarSign,
  cancel_workflow: Ban,
  discount_workflow: DollarSign,
  payout_workflow: Truck,
  gateway_config_workflow: ShieldCheck,
  default: CheckCircle2,
};

function formatThreshold(triggerConfig: TriggerThreshold): string {
  if (!triggerConfig?.thresholds) return 'No thresholds configured';
  return triggerConfig.thresholds
    .filter((t) => t.max !== undefined)
    .map((t) => {
      if (t.auto_approve) return `Auto-approve under ${formatCurrency(t.max || 0)}`;
      return `${t.approver_role || 'Approver'}: up to ${formatCurrency(t.max || 0)}`;
    })
    .join(' | ');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTriggerTypeLabel(type: string): string {
  switch (type) {
    case 'threshold': return 'Threshold-based';
    case 'condition': return 'Condition-based';
    case 'always': return 'Always Required';
    default: return type;
  }
}

interface ThresholdLevel {
  max?: number;
  approver_role?: string;
  auto_approve?: boolean;
}

interface EscalationLevel {
  after_hours: number;
  escalate_to_role: string;
}

export default function ApprovalWorkflowsPage() {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    timeoutHours: 72,
    thresholds: [] as ThresholdLevel[],
    requireDifferentUser: false,
    escalationEnabled: false,
    escalationLevels: [] as EscalationLevel[],
  });

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workflowService.listWorkflows();
      setWorkflows(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approval workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  async function handleToggle(workflow: ApprovalWorkflow) {
    if (workflow.isSystem) {
      setActionError('System workflows cannot be disabled');
      return;
    }
    try {
      setToggling(workflow.id);
      setActionError(null);
      await workflowService.toggleWorkflow(workflow.id, !workflow.isActive);
      setWorkflows((prev) =>
        prev.map((w) => w.id === workflow.id ? { ...w, isActive: !w.isActive } : w)
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update workflow');
    } finally {
      setToggling(null);
    }
  }

  function openEditDialog(workflow: ApprovalWorkflow) {
    setSelectedWorkflow(workflow);
    const triggerConfig = workflow.triggerConfig as TriggerThreshold;
    const thresholds = triggerConfig?.thresholds || [];
    const approverConfig = workflow.approverConfig || {};
    const escalationConfig = workflow.escalationConfig as EscalationConfig | undefined;

    setEditForm({
      timeoutHours: workflow.timeoutHours || 72,
      thresholds: thresholds.map(t => ({
        max: t.max,
        approver_role: t.approver_role,
        auto_approve: t.auto_approve,
      })),
      requireDifferentUser: approverConfig.require_different_user || false,
      escalationEnabled: escalationConfig?.enabled || false,
      escalationLevels: escalationConfig?.levels || [],
    });
    setEditDialogOpen(true);
  }

  async function handleSave() {
    if (!selectedWorkflow) return;
    try {
      setSaving(true);
      setActionError(null);
      const triggerConfig: TriggerThreshold = { field: 'amount', thresholds: editForm.thresholds };
      const approverConfig = { require_different_user: editForm.requireDifferentUser, require_active_staff: true };
      const escalationConfig: EscalationConfig = { enabled: editForm.escalationEnabled, levels: editForm.escalationLevels };

      await workflowService.updateWorkflow(selectedWorkflow.id, {
        timeoutHours: editForm.timeoutHours,
        triggerConfig,
        approverConfig,
        escalationConfig,
      });
      setEditDialogOpen(false);
      loadWorkflows();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update workflow');
    } finally {
      setSaving(false);
    }
  }

  function addThreshold() {
    setEditForm((prev) => ({
      ...prev,
      thresholds: [...prev.thresholds, { max: 1000, approver_role: 'manager', auto_approve: false }],
    }));
  }

  function removeThreshold(index: number) {
    setEditForm((prev) => ({ ...prev, thresholds: prev.thresholds.filter((_, i) => i !== index) }));
  }

  function updateThreshold(index: number, field: keyof ThresholdLevel, value: any) {
    setEditForm((prev) => ({
      ...prev,
      thresholds: prev.thresholds.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  }

  function addEscalationLevel() {
    setEditForm((prev) => ({
      ...prev,
      escalationLevels: [...prev.escalationLevels, { after_hours: 24, escalate_to_role: 'admin' }],
    }));
  }

  function removeEscalationLevel(index: number) {
    setEditForm((prev) => ({ ...prev, escalationLevels: prev.escalationLevels.filter((_, i) => i !== index) }));
  }

  function updateEscalationLevel(index: number, field: keyof EscalationLevel, value: any) {
    setEditForm((prev) => ({
      ...prev,
      escalationLevels: prev.escalationLevels.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    }));
  }

  const activeWorkflows = workflows.filter(w => w.isActive).length;
  const systemWorkflows = workflows.filter(w => w.isSystem).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        type="server_error"
        title="Failed to load workflows"
        description={error}
        showRetryButton
        showHomeButton
        onRetry={loadWorkflows}
      />
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Approval Workflows"
      fallbackDescription="You don't have permission to view approval workflows."
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Approval Workflows"
            description="Configure approval workflows for sensitive operations"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Settings', href: '/settings' },
              { label: 'Approval Workflows' },
            ]}
            actions={
              <Button variant="outline" size="sm" onClick={loadWorkflows} className="p-2.5" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            }
          />

          {actionError && (
            <div className="bg-error-muted border border-error/30 rounded-lg p-3 text-sm text-error flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {actionError}
              <Button variant="ghost" size="sm" className="ml-auto h-6 px-2" onClick={() => setActionError(null)}>
                Dismiss
              </Button>
            </div>
          )}

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-3">
                <WorkflowStatusWidget
                  totalWorkflows={workflows.length}
                  activeWorkflows={activeWorkflows}
                  systemWorkflows={systemWorkflows}
                />

                {/* Quick Links */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs p-2.5" onClick={loadWorkflows} title="Refresh">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{workflows.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-medium text-success">{activeWorkflows}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">System</span>
                    <span className="font-medium">{systemWorkflows}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Status + Stats */}
              <div className="lg:hidden mb-4 space-y-3">
                <WorkflowStatusWidget
                  totalWorkflows={workflows.length}
                  activeWorkflows={activeWorkflows}
                  systemWorkflows={systemWorkflows}
                />
                {/* Mobile Stats Row */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-card rounded-lg border border-border p-2 text-center">
                    <p className="text-lg font-bold">{workflows.length}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="flex-1 bg-card rounded-lg border border-border p-2 text-center">
                    <p className="text-lg font-bold text-success">{activeWorkflows}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                  <div className="flex-1 bg-card rounded-lg border border-border p-2 text-center">
                    <p className="text-lg font-bold">{systemWorkflows}</p>
                    <p className="text-[10px] text-muted-foreground">System</p>
                  </div>
                </div>
              </div>

              {workflows.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No workflows configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Approval workflows will be created automatically when the system initializes.
                    </p>
                    <Button onClick={loadWorkflows}>Refresh</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {workflows.map((workflow) => {
                    const IconComponent = workflowIcons[workflow.name] || workflowIcons.default;
                    const triggerConfig = workflow.triggerConfig as TriggerThreshold;

                    return (
                      <Card key={workflow.id} className={!workflow.isActive ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="flex flex-wrap items-center gap-2 text-foreground text-base">
                                  <span className="truncate">{workflow.displayName}</span>
                                  {workflow.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                                  {!workflow.isActive && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                                </CardTitle>
                                <CardDescription className="text-sm line-clamp-2">{workflow.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:flex-shrink-0">
                              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => openEditDialog(workflow)}>
                                <Settings2 className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Configure</span>
                              </Button>
                              <Switch
                                checked={workflow.isActive}
                                onCheckedChange={() => handleToggle(workflow)}
                                disabled={workflow.isSystem || toggling === workflow.id}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">{getTriggerTypeLabel(workflow.triggerType)}</Badge>
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Clock className="h-3 w-3" />
                              {workflow.timeoutHours}h
                            </span>
                            {workflow.escalationConfig?.enabled && (
                              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                                <Users className="h-3 w-3" />
                                {workflow.escalationConfig.levels?.length || 0} levels
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure Workflow</DialogTitle>
              <DialogDescription>
                {selectedWorkflow?.displayName} - {selectedWorkflow?.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (hours)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min={1}
                  max={720}
                  value={editForm.timeoutHours}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, timeoutHours: parseInt(e.target.value) || 72 }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Different Approver</Label>
                  <p className="text-xs text-muted-foreground">Prevent the requester from approving their own requests.</p>
                </div>
                <Switch
                  checked={editForm.requireDifferentUser}
                  onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, requireDifferentUser: checked }))}
                />
              </div>

              {selectedWorkflow?.triggerType === 'threshold' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Amount Thresholds</Label>
                    <Button variant="outline" size="sm" onClick={addThreshold}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {editForm.thresholds.map((threshold, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Max Amount</Label>
                          <Input
                            type="number"
                            value={threshold.max || ''}
                            onChange={(e) => updateThreshold(index, 'max', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Approver Role</Label>
                          <Input
                            value={threshold.approver_role || ''}
                            onChange={(e) => updateThreshold(index, 'approver_role', e.target.value)}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={threshold.auto_approve || false}
                              onCheckedChange={(checked) => updateThreshold(index, 'auto_approve', checked)}
                            />
                            <Label className="text-sm">Auto</Label>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeThreshold(index)}>
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Escalation</Label>
                  <Switch
                    checked={editForm.escalationEnabled}
                    onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, escalationEnabled: checked }))}
                  />
                </div>
                {editForm.escalationEnabled && (
                  <>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={addEscalationLevel}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Level
                      </Button>
                    </div>
                    {editForm.escalationLevels.map((level, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>After Hours</Label>
                            <Input
                              type="number"
                              value={level.after_hours}
                              onChange={(e) => updateEscalationLevel(index, 'after_hours', parseInt(e.target.value) || 24)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Escalate to Role</Label>
                            <Input
                              value={level.escalate_to_role}
                              onChange={(e) => updateEscalationLevel(index, 'escalate_to_role', e.target.value)}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button variant="ghost" size="sm" onClick={() => removeEscalationLevel(index)}>
                              <Trash2 className="h-4 w-4 text-error" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}

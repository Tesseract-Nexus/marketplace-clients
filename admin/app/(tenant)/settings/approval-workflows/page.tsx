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
} from 'lucide-react';
import { workflowService, ApprovalWorkflow, TriggerThreshold, EscalationConfig } from '@/lib/services/approvalService';
import { PageHeader } from '@/components/PageHeader';
import { PageLoading, PageError } from '@/components/common';
import { ErrorState } from '@/components/ui/error-state';

// Icon mapping for workflow types
const workflowIcons: Record<string, React.ElementType> = {
  refund_workflow: DollarSign,
  cancel_workflow: Ban,
  discount_workflow: DollarSign,
  payout_workflow: Truck,
  gateway_config_workflow: ShieldCheck,
  default: CheckCircle2,
};

// Format threshold for display
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
    case 'threshold':
      return 'Threshold-based';
    case 'condition':
      return 'Condition-based';
    case 'always':
      return 'Always Required';
    default:
      return type;
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

  // Edit form state
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
      console.error('Failed to load workflows:', err);
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
        prev.map((w) =>
          w.id === workflow.id ? { ...w, isActive: !w.isActive } : w
        )
      );
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to update workflow');
    } finally {
      setToggling(null);
    }
  }

  function openEditDialog(workflow: ApprovalWorkflow) {
    setSelectedWorkflow(workflow);

    // Parse trigger config for thresholds
    const triggerConfig = workflow.triggerConfig as TriggerThreshold;
    const thresholds = triggerConfig?.thresholds || [];

    // Parse approver config
    const approverConfig = workflow.approverConfig || {};

    // Parse escalation config
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

      // Build the update payload
      const triggerConfig: TriggerThreshold = {
        field: 'amount',
        thresholds: editForm.thresholds,
      };

      const approverConfig = {
        require_different_user: editForm.requireDifferentUser,
        require_active_staff: true,
      };

      const escalationConfig: EscalationConfig = {
        enabled: editForm.escalationEnabled,
        levels: editForm.escalationLevels,
      };

      await workflowService.updateWorkflow(selectedWorkflow.id, {
        timeoutHours: editForm.timeoutHours,
        triggerConfig,
        approverConfig,
        escalationConfig,
      });

      setEditDialogOpen(false);
      loadWorkflows();
    } catch (err) {
      console.error('Failed to update workflow:', err);
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
    setEditForm((prev) => ({
      ...prev,
      thresholds: prev.thresholds.filter((_, i) => i !== index),
    }));
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
    setEditForm((prev) => ({
      ...prev,
      escalationLevels: prev.escalationLevels.filter((_, i) => i !== index),
    }));
  }

  function updateEscalationLevel(index: number, field: keyof EscalationLevel, value: any) {
    setEditForm((prev) => ({
      ...prev,
      escalationLevels: prev.escalationLevels.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto">
          <PageLoading message="Loading workflows..." fullScreen />
        </div>
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
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Approval Workflows"
          description="Configure approval workflows for sensitive operations like refunds, cancellations, and gateway changes."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Approval Workflows' },
          ]}
          actions={
            <Button variant="outline" size="sm" onClick={loadWorkflows}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />

        {/* Action error display */}
        {actionError && (
          <PageError
            message={actionError}
            onDismiss={() => setActionError(null)}
          />
        )}

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
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2 text-foreground">
                            {workflow.displayName}
                            {workflow.isSystem && (
                              <Badge variant="secondary" className="text-xs">
                                System
                              </Badge>
                            )}
                            {!workflow.isActive && (
                              <Badge variant="outline" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(workflow)}
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Switch
                          checked={workflow.isActive}
                          onCheckedChange={() => handleToggle(workflow)}
                          disabled={workflow.isSystem || toggling === workflow.id}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{getTriggerTypeLabel(workflow.triggerType)}</Badge>
                      </div>

                      {workflow.triggerType === 'threshold' && triggerConfig?.thresholds && (
                        <div className="sm:col-span-2 lg:col-span-2">
                          <div className="text-sm text-muted-foreground mb-1">Thresholds</div>
                          <div className="text-sm text-foreground">{formatThreshold(triggerConfig)}</div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Expires after {workflow.timeoutHours} hours</span>
                      </div>

                      {workflow.escalationConfig?.enabled && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            Escalation: {workflow.escalationConfig.levels?.length || 0} level(s)
                          </span>
                        </div>
                      )}

                      {workflow.approverConfig?.require_different_user && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Requires different approver</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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
              {/* Timeout */}
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
                <p className="text-xs text-muted-foreground">
                  Approval requests will expire after this many hours if not acted upon.
                </p>
              </div>

              {/* Require Different User */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Different Approver</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent the requester from approving their own requests.
                  </p>
                </div>
                <Switch
                  checked={editForm.requireDifferentUser}
                  onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, requireDifferentUser: checked }))}
                />
              </div>

              {/* Thresholds */}
              {selectedWorkflow?.triggerType === 'threshold' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Amount Thresholds</Label>
                      <p className="text-xs text-muted-foreground">
                        Define approval requirements based on amount ranges.
                      </p>
                    </div>
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
                            placeholder="e.g., 1000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Approver Role</Label>
                          <Input
                            value={threshold.approver_role || ''}
                            onChange={(e) => updateThreshold(index, 'approver_role', e.target.value)}
                            placeholder="e.g., manager"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={threshold.auto_approve || false}
                              onCheckedChange={(checked) => updateThreshold(index, 'auto_approve', checked)}
                            />
                            <Label className="text-sm">Auto-approve</Label>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeThreshold(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Escalation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Escalation</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically escalate pending requests to higher roles.
                    </p>
                  </div>
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
                              placeholder="e.g., 24"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Escalate to Role</Label>
                            <Input
                              value={level.escalate_to_role}
                              onChange={(e) => updateEscalationLevel(index, 'escalate_to_role', e.target.value)}
                              placeholder="e.g., admin"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button variant="ghost" size="sm" onClick={() => removeEscalationLevel(index)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </PermissionGate>
  );
}

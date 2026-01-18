'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  Target,
  Trash2,
  X,
  TrendingUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmModal } from '@/components/ConfirmModal';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';

interface SegmentRule {
  field: string;
  operator: string;
  value: any;
}

interface CustomerSegment {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'STATIC' | 'DYNAMIC';
  rules: SegmentRule[];
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ruleFields = [
  { value: 'total_orders', label: 'Total Orders' },
  { value: 'total_spent', label: 'Total Spent' },
  { value: 'average_order_value', label: 'Average Order Value' },
  { value: 'days_since_last_order', label: 'Days Since Last Order' },
  { value: 'lifetime_value', label: 'Lifetime Value' },
];

const operators = [
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
  { value: 'eq', label: 'Equal To' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lte', label: 'Less Than or Equal' },
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'DYNAMIC', label: 'Dynamic' },
  { value: 'STATIC', label: 'Static' },
];

const segmentTypeOptions = [
  { value: 'DYNAMIC', label: 'Dynamic' },
  { value: 'STATIC', label: 'Static' },
];

export default function CustomerSegmentsPage() {
  const { currentTenant } = useTenant();
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);

  // Form state
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: 'DYNAMIC',
    isActive: true,
    rules: [{ field: 'total_orders', operator: 'gte', value: 1 }] as SegmentRule[],
  });

  // SECURITY: Use HttpOnly cookies for authentication instead of localStorage
  // The Authorization header is handled by the backend API routes via cookies
  const getAuthHeaders = (): Record<string, string> => {
    return { 'x-jwt-claim-tenant-id': currentTenant!.id };
  };

  const fetchSegments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/segments', { headers: getAuthHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch segments');
      const data = await res.json();
      // Transform backend data to UI format
      const rawSegments = data.data || data || [];
      const transformedSegments = rawSegments.map((seg: any) => ({
        ...seg,
        type: seg.isDynamic ? 'DYNAMIC' : 'STATIC',
        isActive: seg.isActive ?? true,
        memberCount: seg.customerCount || 0,
      }));
      setSegments(transformedSegments);
    } catch (err) {
      console.error('Error fetching segments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant?.id) {
      fetchSegments();
    }
  }, [currentTenant?.id]);

  const handleCreateSegment = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/segments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant!.id,
          name: createForm.name,
          description: createForm.description,
          isDynamic: createForm.type === 'DYNAMIC',
          isActive: createForm.isActive,
          rules: createForm.type === 'DYNAMIC' ? JSON.stringify(createForm.rules) : '[]',
        }),
      });
      if (!res.ok) throw new Error('Failed to create segment');

      setShowCreateModal(false);
      resetForm();
      fetchSegments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create segment');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSegment = async () => {
    if (!selectedSegment) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/segments/${selectedSegment.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          isDynamic: createForm.type === 'DYNAMIC',
          isActive: createForm.isActive,
          rules: createForm.type === 'DYNAMIC' ? JSON.stringify(createForm.rules) : '[]',
        }),
      });
      if (!res.ok) throw new Error('Failed to update segment');

      setShowDetailsModal(false);
      setIsEditing(false);
      setSelectedSegment(null);
      resetForm();
      fetchSegments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update segment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSegment = async () => {
    if (!segmentToDelete) return;

    try {
      const res = await fetch(`/api/segments/${segmentToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete segment');

      setShowDeleteModal(false);
      setSegmentToDelete(null);
      fetchSegments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete segment');
    }
  };

  const resetForm = () => {
    setCreateForm({
      name: '',
      description: '',
      type: 'DYNAMIC',
      isActive: true,
      rules: [{ field: 'total_orders', operator: 'gte', value: 1 }],
    });
  };

  const openSegmentDetails = (segment: CustomerSegment) => {
    setSelectedSegment(segment);
    let parsedRules: SegmentRule[] = [];
    try {
      parsedRules = typeof segment.rules === 'string'
        ? JSON.parse(segment.rules)
        : segment.rules || [];
    } catch {
      parsedRules = [];
    }
    setCreateForm({
      name: segment.name,
      description: segment.description || '',
      type: segment.type,
      isActive: segment.isActive,
      rules: parsedRules.length > 0 ? parsedRules : [{ field: 'total_orders', operator: 'gte', value: 1 }],
    });
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  const handleAddRule = () => {
    setCreateForm({
      ...createForm,
      rules: [...createForm.rules, { field: 'total_orders', operator: 'gte', value: 0 }],
    });
  };

  const handleRemoveRule = (index: number) => {
    if (createForm.rules.length <= 1) return;
    setCreateForm({
      ...createForm,
      rules: createForm.rules.filter((_, i) => i !== index),
    });
  };

  const handleRuleChange = (index: number, field: keyof SegmentRule, value: any) => {
    const newRules = [...createForm.rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setCreateForm({ ...createForm, rules: newRules });
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Filter segments
  const filteredSegments = segments.filter((segment) => {
    const matchesSearch = segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (segment.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || segment.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate summary
  const totalSegments = segments.length;
  const activeSegments = segments.filter((s) => s.isActive).length;
  const totalMembers = segments.reduce((sum, s) => sum + (s.memberCount || 0), 0);

  return (
    <PermissionGate
      permission={Permission.CUSTOMERS_MANAGE}
      fallback="styled"
      fallbackTitle="Customer Segments Access Required"
      fallbackDescription="You don't have the required permissions to view customer segments. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Customer Segments"
          description="Create and manage customer segments for targeted marketing"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Customers', href: '/customers' },
            { label: 'Segments' },
          ]}
          actions={
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchSegments} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            </div>
          }
        />

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700">{error}</p>
            </div>
            <Button onClick={() => setError(null)} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Segments</p>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              {totalSegments}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Active Segments</p>
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {activeSegments}
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Members</p>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {formatNumber(totalMembers)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
              <Input
                placeholder="Search segments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Type</label>
              <Select value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
            </div>
          </div>
        </div>

        {/* Segments Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Segment Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <span className="text-muted-foreground">Loading segments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSegments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No segments found
                    </td>
                  </tr>
                ) : (
                  filteredSegments.map((segment) => (
                    <tr key={segment.id} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{segment.name}</p>
                          <p className="text-sm text-muted-foreground">{segment.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                          segment.type === 'DYNAMIC'
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-muted text-foreground border-border'
                        )}>
                          {segment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatNumber(segment.memberCount || 0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                          segment.isActive
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-muted text-foreground border-border'
                        )}>
                          {segment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatDate(segment.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSegmentDetails(segment)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View details"
                          >
                            <Target className="w-4 h-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSegmentToDelete(segment.id);
                              setShowDeleteModal(true);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border p-6">
              <h2 className="text-2xl font-bold text-foreground">Create Customer Segment</h2>
              <p className="text-sm text-muted-foreground mt-1">Define rules to segment your customers</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Segment Name *</label>
                <Input
                  placeholder="High Value Customers"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                  placeholder="Customers who have spent over $1000"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Segment Type</label>
                <Select
                  value={createForm.type}
                  onChange={(value) => setCreateForm({ ...createForm, type: value })}
                  options={segmentTypeOptions}
                />
              </div>

              {createForm.type === 'DYNAMIC' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-foreground">Segmentation Rules</label>
                    <Button size="sm" variant="outline" onClick={handleAddRule}>
                      <Plus className="h-3 w-3 mr-1" /> Add Rule
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {createForm.rules.map((rule, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 bg-muted rounded-lg border border-border">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Field</label>
                            <Select
                              value={rule.field}
                              onChange={(value) => handleRuleChange(index, 'field', value)}
                              options={ruleFields}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Operator</label>
                            <Select
                              value={rule.operator}
                              onChange={(value) => handleRuleChange(index, 'operator', value)}
                              options={operators}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">Value</label>
                            <Input
                              type="number"
                              value={rule.value}
                              onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value))}
                            />
                          </div>
                        </div>
                        {createForm.rules.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRule(index)}
                            className="mt-5 p-2"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={createForm.isActive}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="font-semibold">Activate segment immediately</span>
                </label>
              </div>
            </div>

            <div className="border-t border-border p-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button
                onClick={handleCreateSegment}
                disabled={saving || !createForm.name}
                className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Segment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Details Modal */}
      {showDetailsModal && selectedSegment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {isEditing ? 'Edit Segment' : selectedSegment.name}
                </h2>
                {!isEditing && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedSegment.description}</p>
                )}
              </div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              )}
            </div>

            <div className="p-6 space-y-6">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Segment Name *</label>
                    <Input
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={2}
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Segment Type</label>
                    <Select
                      value={createForm.type}
                      onChange={(value) => setCreateForm({ ...createForm, type: value })}
                      options={segmentTypeOptions}
                    />
                  </div>
                  {createForm.type === 'DYNAMIC' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-foreground">Segmentation Rules</label>
                        <Button size="sm" variant="outline" onClick={handleAddRule}>
                          <Plus className="h-3 w-3 mr-1" /> Add Rule
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {createForm.rules.map((rule, index) => (
                          <div key={index} className="flex gap-2 items-start p-3 bg-muted rounded-lg border border-border">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Field</label>
                                <Select
                                  value={rule.field}
                                  onChange={(value) => handleRuleChange(index, 'field', value)}
                                  options={ruleFields}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Operator</label>
                                <Select
                                  value={rule.operator}
                                  onChange={(value) => handleRuleChange(index, 'operator', value)}
                                  options={operators}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-muted-foreground mb-1">Value</label>
                                <Input
                                  type="number"
                                  value={rule.value}
                                  onChange={(e) => handleRuleChange(index, 'value', Number(e.target.value))}
                                />
                              </div>
                            </div>
                            {createForm.rules.length > 1 && (
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveRule(index)} className="mt-5 p-2">
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={createForm.isActive}
                        onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                        className="rounded border-border"
                      />
                      <span className="font-semibold">Active</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1">Type</label>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                        selectedSegment.type === 'DYNAMIC'
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-muted text-foreground border-border'
                      )}>
                        {selectedSegment.type}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-1">Status</label>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border',
                        selectedSegment.isActive
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-muted text-foreground border-border'
                      )}>
                        {selectedSegment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted border border-primary/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground">Member Count</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        {formatNumber(selectedSegment.memberCount || 0)}
                      </span>
                    </div>
                  </div>

                  {selectedSegment.type === 'DYNAMIC' && createForm.rules.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-3">Segmentation Rules</label>
                      <div className="space-y-2">
                        {createForm.rules.map((rule, index) => (
                          <div key={index} className="bg-muted p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold text-primary">
                                {ruleFields.find((f) => f.value === rule.field)?.label || rule.field}
                              </span>
                              <span className="text-muted-foreground">
                                {operators.find((o) => o.value === rule.operator)?.label || rule.operator}
                              </span>
                              <span className="font-bold text-foreground">{rule.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <label className="block font-bold text-foreground mb-1">Created</label>
                      <p className="text-foreground">{formatDate(selectedSegment.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block font-bold text-foreground mb-1">Last Updated</label>
                      <p className="text-foreground">{formatDate(selectedSegment.updatedAt)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border p-6 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button
                    onClick={handleUpdateSegment}
                    disabled={saving || !createForm.name}
                    className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => { setShowDetailsModal(false); setSelectedSegment(null); }}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSegmentToDelete(null); }}
        onConfirm={handleDeleteSegment}
        title="Delete Segment"
        message="Are you sure you want to delete this segment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
    </PermissionGate>
  );
}

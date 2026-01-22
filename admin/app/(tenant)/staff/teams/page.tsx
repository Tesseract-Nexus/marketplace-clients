"use client";

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Building2,
  Users,
  Loader2,
  RefreshCw,
  XCircle,
  Shield,
  UserCircle,
  Filter,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { useHasPermission, Permissions } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { departmentService, teamService, roleService } from '@/lib/api/rbac';
import type {
  Department,
  Team,
  Role,
  CreateTeamRequest,
  UpdateTeamRequest,
} from '@/lib/api/rbacTypes';

const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border bg-white/80 backdrop-blur-sm text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300", className)} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function TeamsPage() {
  const { currentTenant, isLoading: tenantLoading } = useTenant();

  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Permission checks
  const canCreateTeams = useHasPermission(Permissions.TEAMS_CREATE);
  const canUpdateTeams = useHasPermission(Permissions.TEAMS_UPDATE);
  const canDeleteTeams = useHasPermission(Permissions.TEAMS_DELETE);

  // Team form state
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    departmentId: string;
    teamLeadId: string;
    defaultRoleId: string;
    maxCapacity: number | undefined;
  }>({
    name: '',
    code: '',
    departmentId: '',
    teamLeadId: '',
    defaultRoleId: '',
    maxCapacity: undefined,
  });

  // Load data
  useEffect(() => {
    if (tenantLoading || !currentTenant) return;
    loadData();
  }, [currentTenant?.id, tenantLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamsRes, deptsRes, rolesRes] = await Promise.all([
        teamService.list(),
        departmentService.list(),
        roleService.list(),
      ]);

      setTeams(teamsRes.data || []);
      setDepartments(deptsRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.code && team.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = !filterDepartmentId || team.departmentId === filterDepartmentId;
    return matchesSearch && matchesDepartment;
  });

  // CRUD handlers
  const handleCreate = () => {
    setFormData({
      name: '',
      code: '',
      departmentId: filterDepartmentId || '',
      teamLeadId: '',
      defaultRoleId: '',
      maxCapacity: undefined,
    });
    setViewMode('create');
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      code: team.code || '',
      departmentId: team.departmentId,
      teamLeadId: team.teamLeadId || '',
      defaultRoleId: team.defaultRoleId || '',
      maxCapacity: team.maxCapacity,
    });
    setViewMode('edit');
  };

  const handleView = (team: Team) => {
    setSelectedTeam(team);
    setViewMode('view');
  };

  const handleDelete = (team: Team) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete "${team.name}"? Staff members in this team will be unassigned.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await teamService.delete(team.id);
          await loadData();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
          setError(errorMessage);
          throw err;
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (viewMode === 'create') {
        const createData: CreateTeamRequest = {
          name: formData.name,
          code: formData.code || undefined,
          departmentId: formData.departmentId,
          teamLeadId: formData.teamLeadId || undefined,
          defaultRoleId: formData.defaultRoleId || undefined,
          maxCapacity: formData.maxCapacity,
        };
        await teamService.create(createData);
      } else if (viewMode === 'edit' && selectedTeam) {
        const updateData: UpdateTeamRequest = {
          name: formData.name,
          code: formData.code || undefined,
          departmentId: formData.departmentId,
          teamLeadId: formData.teamLeadId || undefined,
          defaultRoleId: formData.defaultRoleId || undefined,
          maxCapacity: formData.maxCapacity,
        };
        await teamService.update(selectedTeam.id, updateData);
      }

      await loadData();
      setViewMode('list');
      setSelectedTeam(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTeam(null);
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown';
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.displayName || role?.name || 'Unknown';
  };

  // Create/Edit Form
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={viewMode === 'create' ? 'Create Team' : `Edit: ${selectedTeam?.name}`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Teams', href: '/staff/teams' },
              { label: viewMode === 'create' ? 'Create' : 'Edit' },
            ]}
          />

          {error && (
            <div className="p-4 bg-error-muted border-2 border-error/30 rounded-xl text-error flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-success" />
                Team Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Team Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="e.g., Frontend Team, Sales Team A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Team Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="e.g., FE-TEAM, SALES-A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department <span className="text-error">*</span>
                </label>
                <Select
                  value={formData.departmentId}
                  onChange={(value) => setFormData({ ...formData, departmentId: value })}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...departments.map(d => ({ value: d.id, label: d.name }))
                  ]}
                  placeholder="Select Department"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default Role (RBAC)
                </label>
                <Select
                  value={formData.defaultRoleId}
                  onChange={(value) => setFormData({ ...formData, defaultRoleId: value })}
                  options={[
                    { value: '', label: 'No default role' },
                    ...roles.map(r => ({ value: r.id, label: r.displayName || r.name }))
                  ]}
                  placeholder="No default role"
                  className="w-full"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  Team members will automatically inherit permissions from this role
                </p>
              </div>

              {formData.defaultRoleId && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Role: <span className="text-primary">{getRoleName(formData.defaultRoleId)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      New staff members added to this team will inherit this role&apos;s permissions automatically.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Capacity
                </label>
                <input
                  type="number"
                  value={formData.maxCapacity || ''}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="e.g., 10"
                  min={1}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.name || !formData.departmentId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {viewMode === 'create' ? 'Create Team' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // View Team
  if (viewMode === 'view' && selectedTeam) {
    const teamDept = departments.find(d => d.id === selectedTeam.departmentId);
    const defaultRole = roles.find(r => r.id === selectedTeam.defaultRoleId);

    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={selectedTeam.name}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Teams', href: '/staff/teams' },
              { label: selectedTeam.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Team Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedTeam.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="font-medium">{selectedTeam.code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <p className="font-medium">{teamDept?.name || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={selectedTeam.isActive ? 'bg-success-muted text-success-muted-foreground' : 'bg-error-muted text-error-muted-foreground'}>
                      {selectedTeam.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <Badge className="bg-primary/20 text-primary">
                      <UserCircle className="w-3 h-3 mr-1" />
                      {selectedTeam.staffCount || 0} members
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Capacity</p>
                    <p className="font-medium">{selectedTeam.maxCapacity || 'No limit'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  RBAC Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Default Role</p>
                  {defaultRole ? (
                    <div className="mt-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">
                          {defaultRole.displayName || defaultRole.name}
                        </span>
                      </div>
                      {defaultRole.description && (
                        <p className="text-sm text-muted-foreground mt-1">{defaultRole.description}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No default role assigned</p>
                  )}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Permission Inheritance</p>
                  <p className="text-sm mt-1">
                    {defaultRole
                      ? `All team members automatically inherit permissions from the "${defaultRole.displayName || defaultRole.name}" role.`
                      : 'No automatic permission inheritance. Team members only have individually assigned permissions.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted transition-all"
            >
              Back to List
            </Button>
            {canUpdateTeams && (
              <Button
                onClick={() => handleEdit(selectedTeam)}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
              >
                <Edit className="w-5 h-5" />
                Edit Team
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <PermissionGate
      permission={Permission.TEAMS_READ}
      fallback="styled"
      fallbackTitle="Teams Access Required"
      fallbackDescription="You don't have the required permissions to view teams. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Teams"
            description="Manage teams and their RBAC configurations"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Teams' },
            ]}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={loadData}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-muted hover:bg-muted transition-all"
                  title="Refresh"
                >
                  <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                </Button>
                {canCreateTeams && (
                  <Button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Add Team
                  </Button>
                )}
              </div>
            }
          />

          {error && (
            <div className="p-4 bg-error-muted border-2 border-error/30 rounded-xl text-error flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success-muted flex items-center justify-center">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Teams</p>
                    <p className="text-2xl font-bold">{teams.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">With Default Roles</p>
                    <p className="text-2xl font-bold">{teams.filter(t => t.defaultRoleId).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Members</p>
                    <p className="text-2xl font-bold">
                      {teams.reduce((acc, t) => acc + (t.staffCount || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-auto hover:bg-muted rounded-full"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="w-full sm:w-64">
                  <Select
                    value={filterDepartmentId}
                    onChange={setFilterDepartmentId}
                    options={[
                      { value: '', label: 'All Departments' },
                      ...departments.map(d => ({ value: d.id, label: d.name }))
                    ]}
                    placeholder="Filter by Department"
                    className="w-full"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">Loading teams...</p>
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {teams.length === 0 ? 'No teams found' : 'No teams match your search'}
                  </p>
                  {teams.length === 0 && (
                    <p className="text-muted-foreground mt-2">Create a team to get started</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left p-4 font-semibold text-foreground">Team</th>
                        <th className="text-left p-4 font-semibold text-foreground">Department</th>
                        <th className="text-left p-4 font-semibold text-foreground">Default Role</th>
                        <th className="text-left p-4 font-semibold text-foreground">Members</th>
                        <th className="text-left p-4 font-semibold text-foreground">Status</th>
                        <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.map((team) => (
                        <tr
                          key={team.id}
                          className="border-b border-border hover:bg-success-muted/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-success-muted flex items-center justify-center">
                                <Users className="w-5 h-5 text-success" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{team.name}</p>
                                {team.code && (
                                  <Badge className="bg-muted text-foreground text-xs">{team.code}</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-primary" />
                              <span>{getDepartmentName(team.departmentId)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {team.defaultRoleId ? (
                              <Badge className="bg-primary/10 text-primary">
                                <Shield className="w-3 h-3 mr-1" />
                                {getRoleName(team.defaultRoleId)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge className="bg-primary/20 text-primary">
                              <UserCircle className="w-3 h-3 mr-1" />
                              {team.staffCount || 0}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={team.isActive ? 'bg-success-muted text-success-muted-foreground' : 'bg-error-muted text-error-muted-foreground'}>
                              {team.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(team)}
                                className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-primary" />
                              </Button>
                              {canUpdateTeams && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(team)}
                                  className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4 text-primary" />
                                </Button>
                              )}
                              {canDeleteTeams && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(team)}
                                  className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-error" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <ConfirmModal
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            onConfirm={modalConfig.onConfirm}
            title={modalConfig.title}
            message={modalConfig.message}
            variant={modalConfig.variant}
          />
        </div>
      </div>
    </PermissionGate>
  );
}

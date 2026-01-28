"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
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
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  XCircle,
  UserCircle,
  FolderTree,
  LayoutList,
  Upload,
  Shield,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageLoading } from '@/components/common';
import { useHasPermission, Permissions } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { BulkImportModal, EntityType } from '@/components/BulkImportModal';
import { departmentService, teamService, roleService } from '@/lib/api/rbac';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';
import type {
  Department,
  DepartmentHierarchy,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  Role,
} from '@/lib/api/rbacTypes';

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

type ViewMode = 'list' | 'create-dept' | 'edit-dept' | 'view-dept' | 'create-team' | 'edit-team' | 'view-team';
type TabValue = 'hierarchy' | 'teams';

export default function OrganizationPage() {
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  // Determine initial tab from URL query param
  const initialTab = searchParams?.get('tab') === 'teams' ? 'teams' : 'hierarchy';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hierarchyData, setHierarchyData] = useState<DepartmentHierarchy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded departments in hierarchy view
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

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

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState<EntityType>('departments');

  const handleOpenImport = (entityType: EntityType) => {
    setImportEntityType(entityType);
    setImportModalOpen(true);
  };

  // Permission checks
  const canCreateDepartments = useHasPermission(Permissions.DEPARTMENTS_CREATE);
  const canUpdateDepartments = useHasPermission(Permissions.DEPARTMENTS_UPDATE);
  const canDeleteDepartments = useHasPermission(Permissions.DEPARTMENTS_DELETE);
  const canCreateTeams = useHasPermission(Permissions.TEAMS_CREATE);
  const canUpdateTeams = useHasPermission(Permissions.TEAMS_UPDATE);
  const canDeleteTeams = useHasPermission(Permissions.TEAMS_DELETE);

  // Department form state
  const [deptFormData, setDeptFormData] = useState<{
    name: string;
    code: string;
    description: string;
    parentDepartmentId: string;
    departmentHeadId: string;
  }>({
    name: '',
    code: '',
    description: '',
    parentDepartmentId: '',
    departmentHeadId: '',
  });

  // Team form state
  const [teamFormData, setTeamFormData] = useState<{
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

  // Roles for team default role selection
  const [roles, setRoles] = useState<Role[]>([]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    newParams.set('tab', value);
    router.push(`/staff/organization?${newParams.toString()}`, { scroll: false });
  };

  // Load data
  useEffect(() => {
    if (tenantLoading || !currentTenant) return;
    loadData();
  }, [currentTenant?.id, tenantLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deptsRes, teamsRes, hierarchyRes, rolesRes] = await Promise.all([
        departmentService.list(),
        teamService.list(),
        departmentService.getHierarchy(),
        roleService.list(),
      ]);

      setDepartments(deptsRes.data || []);
      setTeams(teamsRes.data || []);
      setHierarchyData(hierarchyRes.data || []);
      setRoles(rolesRes.data || []);

      // Expand all departments by default
      const deptIds = new Set((deptsRes.data || []).map((d: Department) => d.id));
      setExpandedDepts(deptIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization data');
      console.error('Error loading organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.code && team.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = !filterDepartmentId || team.departmentId === filterDepartmentId;
    return matchesSearch && matchesDepartment;
  });

  // Department CRUD handlers
  const handleCreateDepartment = () => {
    setDeptFormData({
      name: '',
      code: '',
      description: '',
      parentDepartmentId: '',
      departmentHeadId: '',
    });
    setViewMode('create-dept');
  };

  const handleEditDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    setDeptFormData({
      name: dept.name,
      code: dept.code || '',
      description: dept.description || '',
      parentDepartmentId: dept.parentDepartmentId || '',
      departmentHeadId: dept.departmentHeadId || '',
    });
    setViewMode('edit-dept');
  };

  const handleViewDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    setViewMode('view-dept');
  };

  const handleDeleteDepartment = (dept: Department) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Department',
      message: `Are you sure you want to delete "${dept.name}"? Note: Departments with teams cannot be deleted - you must delete or move the teams first.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await departmentService.delete(dept.id);
          await loadData();
          toast.success('Department Deleted', `"${dept.name}" has been successfully deleted.`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
          setError(errorMessage);
          toast.error('Delete Failed', errorMessage);
          throw err;
        }
      },
    });
  };

  const handleSaveDepartment = async () => {
    try {
      setSaving(true);
      setError(null);

      if (viewMode === 'create-dept') {
        const createData: CreateDepartmentRequest = {
          name: deptFormData.name,
          code: deptFormData.code || undefined,
          description: deptFormData.description || undefined,
          parentDepartmentId: deptFormData.parentDepartmentId || undefined,
          departmentHeadId: deptFormData.departmentHeadId || undefined,
        };
        const response = await departmentService.create(createData);

        // Optimistically add to local state immediately
        if (response.data) {
          const newDept = response.data;
          setDepartments(prev => [...prev, newDept]);
          setExpandedDepts(prev => new Set([...prev, newDept.id]));

          // Also update hierarchy data for immediate display
          const newHierarchyItem: DepartmentHierarchy = {
            department: newDept,
            teams: [],
            subDepartments: [],
          };

          if (newDept.parentDepartmentId) {
            // Add as sub-department
            setHierarchyData(prev => {
              const addToParent = (items: DepartmentHierarchy[]): DepartmentHierarchy[] => {
                return items.map(item => {
                  if (item.department.id === newDept.parentDepartmentId) {
                    return {
                      ...item,
                      subDepartments: [...(item.subDepartments || []), newHierarchyItem],
                    };
                  }
                  if (item.subDepartments?.length) {
                    return { ...item, subDepartments: addToParent(item.subDepartments) };
                  }
                  return item;
                });
              };
              return addToParent(prev);
            });
          } else {
            // Add as root department
            setHierarchyData(prev => [...prev, newHierarchyItem]);
          }
        }

        toast.success('Department Created', `"${deptFormData.name}" has been successfully created.`);
      } else if (viewMode === 'edit-dept' && selectedDepartment) {
        const updateData: UpdateDepartmentRequest = {
          name: deptFormData.name,
          code: deptFormData.code || undefined,
          description: deptFormData.description || undefined,
          parentDepartmentId: deptFormData.parentDepartmentId || undefined,
          departmentHeadId: deptFormData.departmentHeadId || undefined,
        };
        const response = await departmentService.update(selectedDepartment.id, updateData);

        // Optimistically update local state immediately
        if (response.data) {
          setDepartments(prev => prev.map(d => d.id === selectedDepartment.id ? response.data! : d));
        }

        toast.success('Department Updated', `"${deptFormData.name}" has been successfully updated.`);
      }

      setViewMode('list');
      setSelectedDepartment(null);

      // Refresh data in background to sync hierarchy
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save department';
      setError(errorMessage);
      toast.error('Save Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Team CRUD handlers
  const handleCreateTeam = (departmentId?: string) => {
    setTeamFormData({
      name: '',
      code: '',
      departmentId: departmentId || '',
      teamLeadId: '',
      defaultRoleId: '',
      maxCapacity: undefined,
    });
    setViewMode('create-team');
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setTeamFormData({
      name: team.name,
      code: team.code || '',
      departmentId: team.departmentId,
      teamLeadId: team.teamLeadId || '',
      defaultRoleId: team.defaultRoleId || '',
      maxCapacity: team.maxCapacity,
    });
    setViewMode('edit-team');
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setViewMode('view-team');
  };

  const handleDeleteTeam = (team: Team) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete "${team.name}"?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await teamService.delete(team.id);
          await loadData();
          toast.success('Team Deleted', `"${team.name}" has been successfully deleted.`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
          setError(errorMessage);
          toast.error('Delete Failed', errorMessage);
          throw err;
        }
      },
    });
  };

  const handleSaveTeam = async () => {
    try {
      setSaving(true);
      setError(null);

      if (viewMode === 'create-team') {
        const createData: CreateTeamRequest = {
          name: teamFormData.name,
          code: teamFormData.code || undefined,
          departmentId: teamFormData.departmentId,
          teamLeadId: teamFormData.teamLeadId || undefined,
          defaultRoleId: teamFormData.defaultRoleId || undefined,
          maxCapacity: teamFormData.maxCapacity,
        };
        const response = await teamService.create(createData);

        // Optimistically add to local state immediately
        if (response.data) {
          const newTeam = response.data;
          setTeams(prev => [...prev, newTeam]);

          // Also update hierarchy data for immediate display in hierarchy view
          setHierarchyData(prev => {
            const addTeamToDept = (items: DepartmentHierarchy[]): DepartmentHierarchy[] => {
              return items.map(item => {
                if (item.department.id === newTeam.departmentId) {
                  return {
                    ...item,
                    teams: [...(item.teams || []), newTeam],
                  };
                }
                if (item.subDepartments?.length) {
                  return { ...item, subDepartments: addTeamToDept(item.subDepartments) };
                }
                return item;
              });
            };
            return addTeamToDept(prev);
          });
        }

        toast.success('Team Created', `"${teamFormData.name}" has been successfully created.`);
      } else if (viewMode === 'edit-team' && selectedTeam) {
        const updateData: UpdateTeamRequest = {
          name: teamFormData.name,
          code: teamFormData.code || undefined,
          departmentId: teamFormData.departmentId,
          teamLeadId: teamFormData.teamLeadId || undefined,
          defaultRoleId: teamFormData.defaultRoleId || undefined,
          maxCapacity: teamFormData.maxCapacity,
        };
        const response = await teamService.update(selectedTeam.id, updateData);

        // Optimistically update local state immediately
        if (response.data) {
          setTeams(prev => prev.map(t => t.id === selectedTeam.id ? response.data! : t));
        }

        toast.success('Team Updated', `"${teamFormData.name}" has been successfully updated.`);
      }

      setViewMode('list');
      setSelectedTeam(null);

      // Refresh data in background to sync hierarchy
      loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save team';
      setError(errorMessage);
      toast.error('Save Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedDepartment(null);
    setSelectedTeam(null);
  };

  const toggleDeptExpansion = (deptId: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown';
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.displayName || role?.name || 'Unknown';
  };

  const totalStaff = departments.reduce((acc, d) => acc + (d.staffCount || 0), 0);

  const sidebarConfig = useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Organization Health',
      currentValue: departments.length + teams.length,
      totalValue: (departments.length + teams.length) || 1,
      status: departments.length === 0 ? 'attention' : 'healthy',
      segments: [
        { value: departments.length, color: 'primary' },
        { value: teams.length, color: 'success' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Organization',
        items: [
          {
            icon: Building2,
            label: 'Departments',
            value: departments.length,
            color: 'primary',
            onClick: () => handleTabChange('hierarchy'),
          },
          {
            icon: Users,
            label: 'Teams',
            value: teams.length,
            color: 'success',
            onClick: () => handleTabChange('teams'),
          },
          {
            icon: UserCircle,
            label: 'Total Staff',
            value: totalStaff,
          },
        ] as SidebarStatItem[],
      },
    ];

    return { healthWidget, sections };
  }, [departments.length, teams.length, totalStaff]);

  const mobileStats = useMemo(() => [
    { id: 'depts', icon: Building2, label: 'Depts', value: departments.length, color: 'primary' as const },
    { id: 'teams', icon: Users, label: 'Teams', value: teams.length, color: 'success' as const },
    { id: 'staff', icon: UserCircle, label: 'Staff', value: totalStaff },
  ], [departments.length, teams.length, totalStaff]);

  // Render hierarchy tree recursively
  const renderHierarchyTree = (hierarchy: DepartmentHierarchy, level: number = 0) => {
    const dept = hierarchy.department;
    const isExpanded = expandedDepts.has(dept.id);
    const hierarchyTeams = hierarchy.teams || [];
    const subDepartments = hierarchy.subDepartments || [];
    const hasChildren = subDepartments.length > 0 || hierarchyTeams.length > 0;

    return (
      <div key={dept.id} style={{ marginLeft: level * 24 }}>
        <div className={cn("flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group", level === 0 && "border-b")}>
          <button
            onClick={() => hasChildren && toggleDeptExpansion(dept.id)}
            className={cn("w-6 h-6 flex items-center justify-center rounded text-muted-foreground", hasChildren ? "hover:bg-muted hover:text-foreground" : "invisible")}
          >
            {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </button>

          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1">
            <p className="font-semibold text-foreground">{dept.name}</p>
            {dept.code && <p className="text-sm text-muted-foreground">{dept.code}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary">
              <Users className="w-3 h-3 mr-1" />
              {dept.staffCount || 0} staff
            </Badge>
            {hierarchyTeams.length > 0 && (
              <Badge className="bg-muted text-foreground">
                {hierarchyTeams.length} teams
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleViewDepartment(dept)} className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" title="View">
              <Eye className="w-4 h-4 text-primary" />
            </Button>
            {canCreateTeams && (
              <Button variant="ghost" size="sm" onClick={() => handleCreateTeam(dept.id)} className="h-8 w-8 p-0 rounded-lg bg-success-muted hover:bg-success/20 transition-colors" title="Add Team">
                <Plus className="w-4 h-4 text-success" />
              </Button>
            )}
            {canUpdateDepartments && (
              <Button variant="ghost" size="sm" onClick={() => handleEditDepartment(dept)} className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" title="Edit">
                <Edit className="w-4 h-4 text-primary" />
              </Button>
            )}
            {canDeleteDepartments && (
              <Button variant="ghost" size="sm" onClick={() => handleDeleteDepartment(dept)} className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors" title="Delete">
                <Trash2 className="w-4 h-4 text-error" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="ml-6">
            {hierarchyTeams.map(team => (
              <div key={team.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group ml-6">
                <div className="w-6" />
                <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center">
                  <Users className="w-4 h-4 text-success" />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-foreground">{team.name}</p>
                  {team.code && <p className="text-sm text-muted-foreground">{team.code}</p>}
                </div>

                <Badge className="bg-success-muted text-success-muted-foreground">
                  {team.staffCount || 0} members
                </Badge>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleViewTeam(team)} className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" title="View">
                    <Eye className="w-4 h-4 text-primary" />
                  </Button>
                  {canUpdateTeams && (
                    <Button variant="ghost" size="sm" onClick={() => handleEditTeam(team)} className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" title="Edit">
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                  )}
                  {canDeleteTeams && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTeam(team)} className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4 text-error" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {subDepartments.map(subHierarchy => renderHierarchyTree(subHierarchy, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Create/Edit Department Form
  if (viewMode === 'create-dept' || viewMode === 'edit-dept') {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={viewMode === 'create-dept' ? 'Create Department' : `Edit: ${selectedDepartment?.name}`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Organization', href: '/staff/organization' },
              { label: viewMode === 'create-dept' ? 'Create Department' : 'Edit Department' },
            ]}
          />

          {error && (
            <div className="p-4 bg-error-muted border-2 border-error/30 rounded-md text-error flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="bg-card rounded-lg border border-border overflow-hidden max-w-2xl mx-auto">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Department Details
              </h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Department Code</label>
                <input
                  type="text"
                  value={deptFormData.code}
                  onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="ENG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Department description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Parent Department</label>
                <Select
                  value={deptFormData.parentDepartmentId}
                  onChange={(value) => setDeptFormData({ ...deptFormData, parentDepartmentId: value })}
                  options={[
                    { value: '', label: 'No parent (root department)' },
                    ...departments.filter(d => d.id !== selectedDepartment?.id).map(d => ({ value: d.id, label: d.name }))
                  ]}
                  placeholder="No parent (root department)"
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button onClick={handleCancel} disabled={saving} className="px-6 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all">
                  Cancel
                </Button>
                <Button onClick={handleSaveDepartment} disabled={saving || !deptFormData.name} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200 disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {viewMode === 'create-dept' ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Team Form
  if (viewMode === 'create-team' || viewMode === 'edit-team') {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={viewMode === 'create-team' ? 'Create Team' : `Edit: ${selectedTeam?.name}`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Organization', href: '/staff/organization' },
              { label: viewMode === 'create-team' ? 'Create Team' : 'Edit Team' },
            ]}
          />

          {error && (
            <div className="p-4 bg-error-muted border-2 border-error/30 rounded-md text-error flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="bg-card rounded-lg border border-border overflow-hidden max-w-2xl mx-auto">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-success" />
                Team Details
              </h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Team Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Frontend Team"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Team Code</label>
                <input
                  type="text"
                  value={teamFormData.code}
                  onChange={(e) => setTeamFormData({ ...teamFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="FE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department <span className="text-error">*</span>
                </label>
                <Select
                  value={teamFormData.departmentId}
                  onChange={(value) => setTeamFormData({ ...teamFormData, departmentId: value })}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...departments.map(d => ({ value: d.id, label: d.name }))
                  ]}
                  placeholder="Select Department"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Default Role</label>
                <Select
                  value={teamFormData.defaultRoleId}
                  onChange={(value) => setTeamFormData({ ...teamFormData, defaultRoleId: value })}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Capacity</label>
                <input
                  type="number"
                  value={teamFormData.maxCapacity || ''}
                  onChange={(e) => setTeamFormData({ ...teamFormData, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="10"
                  min={1}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button onClick={handleCancel} disabled={saving} className="px-6 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all">
                  Cancel
                </Button>
                <Button onClick={handleSaveTeam} disabled={saving || !teamFormData.name || !teamFormData.departmentId} className="flex items-center gap-2 px-6 py-2.5 bg-success text-success-foreground rounded-md hover:bg-success/90 transition-all duration-200 disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {viewMode === 'create-team' ? 'Create' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View Department
  if (viewMode === 'view-dept' && selectedDepartment) {
    const deptTeams = teams.filter(t => t.departmentId === selectedDepartment.id);
    const parentDept = departments.find(d => d.id === selectedDepartment.parentDepartmentId);

    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={selectedDepartment.name}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Organization', href: '/staff/organization' },
              { label: selectedDepartment.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Department Details
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedDepartment.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Code</p>
                    <p className="font-medium">{selectedDepartment.code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={selectedDepartment.isActive ? 'bg-success-muted text-success-muted-foreground' : 'bg-error-muted text-error-muted-foreground'}>
                      {selectedDepartment.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Department</p>
                    <p className="font-medium">{parentDept?.name || 'None (root)'}</p>
                  </div>
                </div>
                {selectedDepartment.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{selectedDepartment.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Teams ({deptTeams.length})
                </h3>
              </div>
              <div className="p-6 pt-0">
                {deptTeams.length > 0 ? (
                  <div className="space-y-2">
                    {deptTeams.map(team => (
                      <div key={team.id} className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleViewTeam(team)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center">
                              <Users className="w-4 h-4 text-success" />
                            </div>
                            <div>
                              <p className="font-medium">{team.name}</p>
                              {team.code && <p className="text-sm text-muted-foreground">{team.code}</p>}
                            </div>
                          </div>
                          <Badge className="bg-success-muted text-success-muted-foreground">
                            {team.staffCount || 0} members
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No teams in this department</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleCancel} className="px-6 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all">
              Back to List
            </Button>
            {canUpdateDepartments && (
              <Button onClick={() => handleEditDepartment(selectedDepartment)} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all">
                <Edit className="w-5 h-5" />
                Edit Department
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View Team
  if (viewMode === 'view-team' && selectedTeam) {
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
              { label: 'Organization', href: '/staff/organization' },
              { label: selectedTeam.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Team Details
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-4">
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
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  RBAC Configuration
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Default Role</p>
                  {defaultRole ? (
                    <div className="mt-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">{defaultRole.displayName || defaultRole.name}</span>
                      </div>
                      {defaultRole.description && (
                        <p className="text-sm text-muted-foreground mt-1">{defaultRole.description}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No default role assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleCancel} className="px-6 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all">
              Back to List
            </Button>
            {canUpdateTeams && (
              <Button onClick={() => handleEditTeam(selectedTeam)} className="flex items-center gap-2 px-6 py-2.5 bg-success text-success-foreground rounded-md hover:bg-success/90 transition-all">
                <Edit className="w-5 h-5" />
                Edit Team
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main List View with Tabs
  return (
    <PermissionGate
      permission={Permission.DEPARTMENTS_READ}
      fallback="styled"
      fallbackTitle="Organization Access Required"
      fallbackDescription="You don't have the required permissions to view organization. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Organization"
            description="Manage departments and teams"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Organization' },
            ]}
            actions={
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={loadData} disabled={loading} className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all" title="Refresh">
                  <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
                </Button>
                {canCreateTeams && (
                  <Button onClick={() => handleOpenImport('teams')} className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-success/40 text-success rounded-md hover:bg-success-muted transition-all">
                    <Upload className="w-5 h-5" />
                    Import Teams
                  </Button>
                )}
                {canCreateDepartments && (
                  <Button onClick={() => handleOpenImport('departments')} className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-primary/50 text-primary rounded-md hover:bg-primary/10 transition-all">
                    <Upload className="w-5 h-5" />
                    Import Depts
                  </Button>
                )}
                {canCreateTeams && (
                  <Button onClick={() => handleCreateTeam()} className="flex items-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-md hover:bg-success/90 transition-all">
                    <Plus className="w-5 h-5" />
                    Add Team
                  </Button>
                )}
                {canCreateDepartments && (
                  <Button onClick={handleCreateDepartment} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    <Plus className="w-5 h-5" />
                    Add Department
                  </Button>
                )}
              </div>
            }
          />

          {error && (
            <div className="p-4 bg-error-muted border-2 border-error/30 rounded-md text-error flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <DataPageLayout sidebar={sidebarConfig} mobileStats={mobileStats}>
          {/* Mobile Tab Selector */}
          <div className="md:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full h-10 px-3 border border-border rounded-md bg-background text-sm font-medium focus:outline-none focus:border-primary"
            >
              <option value="hierarchy">Departments & Teams</option>
              <option value="teams">Teams</option>
            </select>
          </div>

          {/* Desktop Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="hidden md:inline-flex h-auto items-center justify-start rounded-md bg-card border border-border p-1 shadow-sm mb-6">
              <TabsTrigger value="hierarchy" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FolderTree className="w-4 h-4" />
                Departments & Teams
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutList className="w-4 h-4" />
                Teams
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Hierarchical View */}
            <TabsContent value="hierarchy">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-6">
                  {/* Search */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search departments and teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                      {searchQuery && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-auto hover:bg-muted rounded-full">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                      <p className="mt-4 text-muted-foreground">Loading organization...</p>
                    </div>
                  ) : departments.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">No departments found</p>
                      <p className="text-muted-foreground mt-2">Create a department to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {hierarchyData.length > 0 ? (
                        hierarchyData.map(hierarchy => renderHierarchyTree(hierarchy))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No hierarchy data available</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Flat Teams List */}
            <TabsContent value="teams">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-6">
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                      {searchQuery && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-auto hover:bg-muted rounded-full">
                          <X className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <Select
                      value={filterDepartmentId}
                      onChange={setFilterDepartmentId}
                      options={[
                        { value: '', label: 'All Departments' },
                        ...departments.map(d => ({ value: d.id, label: d.name }))
                      ]}
                      placeholder="Filter by Department"
                      className="w-full sm:w-64"
                    />
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
                            <tr key={team.id} className="border-b border-border hover:bg-success-muted/50 transition-colors">
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
                                  <Button variant="ghost" size="sm" onClick={() => handleViewTeam(team)} className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" title="View">
                                    <Eye className="w-4 h-4 text-primary" />
                                  </Button>
                                  {canUpdateTeams && (
                                    <Button variant="ghost" size="sm" onClick={() => handleEditTeam(team)} className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors" title="Edit">
                                      <Edit className="w-4 h-4 text-primary" />
                                    </Button>
                                  )}
                                  {canDeleteTeams && (
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTeam(team)} className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors" title="Delete">
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
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </DataPageLayout>

          <ConfirmModal
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            onConfirm={modalConfig.onConfirm}
            title={modalConfig.title}
            message={modalConfig.message}
            variant={modalConfig.variant}
          />

          <BulkImportModal
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            onSuccess={loadData}
            entityType={importEntityType}
            entityLabel={importEntityType === 'departments' ? 'Departments' : 'Teams'}
            tenantId={currentTenant?.id}
          />
        </div>
      </div>
    </PermissionGate>
  );
}

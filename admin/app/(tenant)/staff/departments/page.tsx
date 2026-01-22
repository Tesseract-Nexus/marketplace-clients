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
  ChevronRight,
  ChevronDown,
  Loader2,
  RefreshCw,
  XCircle,
  UserCircle,
  FolderTree,
  LayoutList,
  Upload,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { useHasPermission, Permissions } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { BulkImportModal, EntityType } from '@/components/BulkImportModal';
import { departmentService, teamService, roleService } from '@/lib/api/rbac';
import type {
  Department,
  DepartmentHierarchy,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  Team,
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

type ViewMode = 'list' | 'hierarchy' | 'create-dept' | 'edit-dept' | 'view-dept' | 'create-team' | 'edit-team' | 'view-team';

export default function DepartmentsPage() {
  const { currentTenant, isLoading: tenantLoading } = useTenant();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hierarchyData, setHierarchyData] = useState<DepartmentHierarchy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Permission checks for CRUD actions
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
  const [roles, setRoles] = useState<import('@/lib/api/rbacTypes').Role[]>([]);

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
      setError(err instanceof Error ? err.message : 'Failed to load departments');
      console.error('Error loading departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Department CRUD
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
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
          setError(errorMessage);
          throw err; // Re-throw so modal knows it failed
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
        await departmentService.create(createData);
      } else if (viewMode === 'edit-dept' && selectedDepartment) {
        const updateData: UpdateDepartmentRequest = {
          name: deptFormData.name,
          code: deptFormData.code || undefined,
          description: deptFormData.description || undefined,
          parentDepartmentId: deptFormData.parentDepartmentId || undefined,
          departmentHeadId: deptFormData.departmentHeadId || undefined,
        };
        await departmentService.update(selectedDepartment.id, updateData);
      }

      await loadData();
      setViewMode('list');
      setSelectedDepartment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  // Team CRUD
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
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
          setError(errorMessage);
          throw err; // Re-throw so modal knows it failed
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
        await teamService.create(createData);
      } else if (viewMode === 'edit-team' && selectedTeam) {
        const updateData: UpdateTeamRequest = {
          name: teamFormData.name,
          code: teamFormData.code || undefined,
          departmentId: teamFormData.departmentId,
          teamLeadId: teamFormData.teamLeadId || undefined,
          defaultRoleId: teamFormData.defaultRoleId || undefined,
          maxCapacity: teamFormData.maxCapacity,
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

  // Render hierarchy tree recursively for DepartmentHierarchy structure from API
  const renderHierarchyTree = (hierarchy: DepartmentHierarchy, level: number = 0) => {
    const dept = hierarchy.department;
    const isExpanded = expandedDepts.has(dept.id);
    const hierarchyTeams = hierarchy.teams || [];
    const subDepartments = hierarchy.subDepartments || [];
    const hasChildren = subDepartments.length > 0 || hierarchyTeams.length > 0;

    return (
      <div key={dept.id} style={{ marginLeft: level * 24 }}>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group",
            level === 0 && "border-b"
          )}
        >
          <button
            onClick={() => hasChildren && toggleDeptExpansion(dept.id)}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded text-muted-foreground",
              hasChildren ? "hover:bg-muted hover:text-foreground" : "invisible"
            )}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDepartment(dept)}
              className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              title="View"
              aria-label="View department"
            >
              <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
            </Button>
            {canCreateTeams && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateTeam(dept.id)}
                className="h-8 w-8 p-0 rounded-lg bg-success-muted hover:bg-success/20 transition-colors"
                title="Add Team"
                aria-label="Add team"
              >
                <Plus className="w-4 h-4 text-success" aria-hidden="true" />
              </Button>
            )}
            {canUpdateDepartments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditDepartment(dept)}
                className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                title="Edit"
                aria-label="Edit department"
              >
                <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
              </Button>
            )}
            {canDeleteDepartments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteDepartment(dept)}
                className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors"
                title="Delete"
                aria-label="Delete department"
              >
                <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="ml-6">
            {/* Render teams from hierarchy */}
            {hierarchyTeams.map(team => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group ml-6"
              >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTeam(team)}
                    className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    title="View"
                    aria-label="View team"
                  >
                    <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                  </Button>
                  {canUpdateTeams && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTeam(team)}
                      className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      title="Edit"
                      aria-label="Edit team"
                    >
                      <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                    </Button>
                  )}
                  {canDeleteTeams && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team)}
                      className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors"
                      title="Delete"
                      aria-label="Delete team"
                    >
                      <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Render sub-departments */}
            {subDepartments.map(subHierarchy => renderHierarchyTree(subHierarchy, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Legacy render function for flat Department list (fallback)
  const renderDepartmentTree = (dept: Department, level: number = 0) => {
    const isExpanded = expandedDepts.has(dept.id);
    const deptTeams = teams.filter(t => t.departmentId === dept.id);
    const hasChildren = (dept.children && dept.children.length > 0) || deptTeams.length > 0;

    return (
      <div key={dept.id} style={{ marginLeft: level * 24 }}>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group",
            level === 0 && "border-b"
          )}
        >
          <button
            onClick={() => hasChildren && toggleDeptExpansion(dept.id)}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded text-muted-foreground",
              hasChildren ? "hover:bg-muted hover:text-foreground" : "invisible"
            )}
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
            {deptTeams.length > 0 && (
              <Badge className="bg-muted text-foreground">
                {deptTeams.length} teams
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDepartment(dept)}
              className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              title="View"
              aria-label="View department"
            >
              <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
            </Button>
            {canCreateTeams && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCreateTeam(dept.id)}
                className="h-8 w-8 p-0 rounded-lg bg-success-muted hover:bg-success/20 transition-colors"
                title="Add Team"
                aria-label="Add team"
              >
                <Plus className="w-4 h-4 text-success" aria-hidden="true" />
              </Button>
            )}
            {canUpdateDepartments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditDepartment(dept)}
                className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                title="Edit"
                aria-label="Edit department"
              >
                <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
              </Button>
            )}
            {canDeleteDepartments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteDepartment(dept)}
                className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors"
                title="Delete"
                aria-label="Delete department"
              >
                <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="ml-6">
            {/* Render teams */}
            {deptTeams.map(team => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group ml-6"
              >
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTeam(team)}
                    className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    title="View"
                    aria-label="View team"
                  >
                    <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                  </Button>
                  {canUpdateTeams && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTeam(team)}
                      className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      title="Edit"
                      aria-label="Edit team"
                    >
                      <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                    </Button>
                  )}
                  {canDeleteTeams && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team)}
                      className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors"
                      title="Delete"
                      aria-label="Delete team"
                    >
                      <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Render child departments */}
            {dept.children?.map(child => renderDepartmentTree(child, level + 1))}
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
              { label: 'Departments', href: '/staff/departments' },
              { label: viewMode === 'create-dept' ? 'Create' : 'Edit' },
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
                <Building2 className="w-5 h-5 text-primary" />
                Department Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department Code
                </label>
                <input
                  type="text"
                  value={deptFormData.code}
                  onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="ENG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Department description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Parent Department
                </label>
                <Select
                  value={deptFormData.parentDepartmentId}
                  onChange={(value) => setDeptFormData({ ...deptFormData, parentDepartmentId: value })}
                  options={[
                    { value: '', label: 'No parent (root department)' },
                    ...departments
                      .filter(d => d.id !== selectedDepartment?.id)
                      .map(d => ({ value: d.id, label: d.name }))
                  ]}
                  placeholder="No parent (root department)"
                  className="w-full"
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
                  onClick={handleSaveDepartment}
                  disabled={saving || !deptFormData.name}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {viewMode === 'create-dept' ? 'Create' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
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
              { label: 'Departments', href: '/staff/departments' },
              { label: viewMode === 'create-team' ? 'Create Team' : 'Edit Team' },
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
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Frontend Team"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Team Code
                </label>
                <input
                  type="text"
                  value={teamFormData.code}
                  onChange={(e) => setTeamFormData({ ...teamFormData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default Role
                </label>
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Capacity
                </label>
                <input
                  type="number"
                  value={teamFormData.maxCapacity || ''}
                  onChange={(e) => setTeamFormData({ ...teamFormData, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="10"
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
                  onClick={handleSaveTeam}
                  disabled={saving || !teamFormData.name || !teamFormData.departmentId}
                  className="flex items-center gap-2 px-6 py-2.5 bg-success text-success-foreground rounded-xl hover:bg-success/90 transition-all duration-200 shadow-lg disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {viewMode === 'create-team' ? 'Create' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
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
              { label: 'Departments', href: '/staff/departments' },
              { label: selectedDepartment.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Department Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-success" />
                  Teams ({deptTeams.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deptTeams.length > 0 ? (
                  <div className="space-y-2">
                    {deptTeams.map(team => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleViewTeam(team)}
                      >
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
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No teams in this department</p>
                )}
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
            {canUpdateDepartments && (
              <Button
                onClick={() => handleEditDepartment(selectedDepartment)}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
              >
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

    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={selectedTeam.name}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Departments', href: '/staff/departments' },
              { label: teamDept?.name || 'Department' },
              { label: selectedTeam.name },
            ]}
          />

          <Card className="max-w-2xl mx-auto">
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
                  <p className="font-medium">{teamDept?.name || '-'}</p>
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
                    <Users className="w-3 h-3 mr-1" />
                    {selectedTeam.staffCount || 0} members
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Capacity</p>
                  <p className="font-medium">{selectedTeam.maxCapacity || 'No limit'}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Default Role (Inherited Permissions)</p>
                {selectedTeam.defaultRoleId ? (
                  <Badge className="mt-1 bg-primary/10 text-primary">
                    {roles.find(r => r.id === selectedTeam.defaultRoleId)?.displayName ||
                     roles.find(r => r.id === selectedTeam.defaultRoleId)?.name ||
                     'Unknown Role'}
                  </Badge>
                ) : (
                  <p className="font-medium text-muted-foreground">No default role assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted transition-all"
            >
              Back to List
            </Button>
            {teamDept && (
              <Button
                onClick={() => handleViewDepartment(teamDept)}
                className="px-6 py-2.5 bg-card border-2 border-primary/50 text-primary rounded-xl hover:bg-primary/10 transition-all"
              >
                <Building2 className="w-5 h-5 mr-2" />
                View Department
              </Button>
            )}
            {canUpdateTeams && (
              <Button
                onClick={() => handleEditTeam(selectedTeam)}
                className="flex items-center gap-2 px-6 py-2.5 bg-success text-success-foreground rounded-xl hover:bg-success/90 transition-all"
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

  // List / Hierarchy View
  return (
    <PermissionGate
      permission={Permission.DEPARTMENTS_READ}
      fallback="styled"
      fallbackTitle="Departments Access Required"
      fallbackDescription="You don't have the required permissions to view departments. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Departments & Teams"
          description="Manage your organizational structure"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team', href: '/staff' },
            { label: 'Departments' },
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
              <div className="flex items-center bg-muted rounded-xl p-1">
                <Button
                  variant="ghost"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all",
                    viewMode === 'list'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  )}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setViewMode('hierarchy')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-all",
                    viewMode === 'hierarchy'
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                  )}
                >
                  <FolderTree className="w-4 h-4" />
                </Button>
              </div>
              {canCreateTeams && (
                <Button
                  onClick={() => handleOpenImport('teams')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-success/40 text-success rounded-xl hover:bg-success-muted transition-all"
                >
                  <Upload className="w-5 h-5" />
                  Import Teams
                </Button>
              )}
              {canCreateDepartments && (
                <Button
                  onClick={() => handleOpenImport('departments')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-primary/50 text-primary rounded-xl hover:bg-primary/10 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  Import Depts
                </Button>
              )}
              {canCreateTeams && (
                <Button
                  onClick={() => handleCreateTeam()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-xl hover:bg-success/90 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Team
                </Button>
              )}
              {canCreateDepartments && (
                <Button
                  onClick={handleCreateDepartment}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Add Department
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
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departments</p>
                  <p className="text-2xl font-bold">{departments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="text-2xl font-bold">{teams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold">
                    {departments.reduce((acc, d) => acc + (d.staffCount || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search departments and teams..."
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
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading departments...</p>
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No departments found</p>
                <p className="text-muted-foreground mt-2">Create a department to get started</p>
              </div>
            ) : viewMode === 'hierarchy' ? (
              // Hierarchy View
              <div className="space-y-1">
                {hierarchyData.length > 0 ? (
                  hierarchyData.map(hierarchy => renderHierarchyTree(hierarchy))
                ) : (
                  departments
                    .filter(d => !d.parentDepartmentId)
                    .map(dept => renderDepartmentTree(dept))
                )}
              </div>
            ) : (
              // List View
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Department</th>
                      <th className="text-left p-4 font-semibold text-foreground">Code</th>
                      <th className="text-left p-4 font-semibold text-foreground">Teams</th>
                      <th className="text-left p-4 font-semibold text-foreground">Staff</th>
                      <th className="text-left p-4 font-semibold text-foreground">Status</th>
                      <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((dept) => {
                      const deptTeams = teams.filter(t => t.departmentId === dept.id);
                      return (
                        <tr
                          key={dept.id}
                          className="border-b border-border hover:bg-primary/10/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{dept.name}</p>
                                {dept.description && (
                                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">{dept.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {dept.code ? (
                              <Badge className="bg-muted text-foreground">{dept.code}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge className="bg-success-muted text-success-muted-foreground">
                              {deptTeams.length} teams
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className="bg-primary/20 text-primary">
                              <Users className="w-3 h-3 mr-1" />
                              {dept.staffCount || 0}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={dept.isActive ? 'bg-success-muted text-success-muted-foreground' : 'bg-error-muted text-error-muted-foreground'}>
                              {dept.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDepartment(dept)}
                                className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                title="View"
                                aria-label="View department"
                              >
                                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                              </Button>
                              {canCreateTeams && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateTeam(dept.id)}
                                  className="h-8 w-8 p-0 rounded-lg bg-success-muted hover:bg-success/20 transition-colors"
                                  title="Add Team"
                                  aria-label="Add team"
                                >
                                  <Plus className="w-4 h-4 text-success" aria-hidden="true" />
                                </Button>
                              )}
                              {canUpdateDepartments && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditDepartment(dept)}
                                  className="h-8 w-8 p-0 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                                  title="Edit"
                                  aria-label="Edit department"
                                >
                                  <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                                </Button>
                              )}
                              {canDeleteDepartments && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDepartment(dept)}
                                  className="h-8 w-8 p-0 rounded-lg bg-error-muted hover:bg-error/20 transition-colors"
                                  title="Delete"
                                  aria-label="Delete department"
                                >
                                  <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

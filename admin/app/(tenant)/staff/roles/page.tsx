"use client";

import React, { useState, useEffect } from 'react';
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
  Shield,
  Users,
  Crown,
  UserCog,
  Package,
  ShoppingCart,
  Megaphone,
  BarChart3,
  Settings,
  DollarSign,
  Warehouse,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Copy,
  Sparkles,
  Upload,
} from 'lucide-react';
import { PermissionGate, Permission as GatePermission } from '@/components/permission-gate';
import { PageLoading } from '@/components/common';
import { useRoleCapabilities } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { BulkImportModal } from '@/components/BulkImportModal';
import { roleService, permissionService } from '@/lib/api/rbac';
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  PermissionCategory,
} from '@/lib/api/rbacTypes';
import { getRolePriorityCategory, ROLE_PRIORITY_COLORS } from '@/lib/api/rbacTypes';

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  catalog: <Package className="w-5 h-5" />,
  orders: <ShoppingCart className="w-5 h-5" />,
  customers: <Users className="w-5 h-5" />,
  marketing: <Megaphone className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />,
  settings: <Settings className="w-5 h-5" />,
  team: <UserCog className="w-5 h-5" />,
  finance: <DollarSign className="w-5 h-5" />,
  inventory: <Warehouse className="w-5 h-5" />,
};

export default function RolesPage() {
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const { canCreateRoles, canDeleteRoles } = useRoleCapabilities();
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Permission matrix state
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    displayName: string;
    description: string;
    priorityLevel: number;
    color: string;
    canManageStaff: boolean;
    canCreateRoles: boolean;
  }>({
    name: '',
    displayName: '',
    description: '',
    priorityLevel: 50,
    color: '#3B82F6',
    canManageStaff: false,
    canCreateRoles: false,
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

      const [rolesRes, categoriesRes, permissionsRes] = await Promise.all([
        roleService.list(),
        permissionService.getCategories(),
        permissionService.list(),
      ]);

      setRoles(rolesRes.data || []);
      setPermissionCategories(categoriesRes.data || []);
      setAllPermissions(permissionsRes.data || []);

      // Expand all categories by default
      const categoryIds = new Set((categoriesRes.data || []).map((c: PermissionCategory) => c.id));
      setExpandedCategories(categoryIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination calculations
  const totalItems = filteredRoles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCreateRole = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      priorityLevel: 50,
      color: '#3B82F6',
      canManageStaff: false,
      canCreateRoles: false,
    });
    setSelectedPermissionIds(new Set());
    setViewMode('create');
  };

  const handleEditRole = async (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      priorityLevel: role.priorityLevel,
      color: role.color || '#3B82F6',
      canManageStaff: role.canManageStaff,
      canCreateRoles: role.canCreateRoles,
    });

    // Load role permissions
    try {
      const permRes = await roleService.getPermissions(role.id);
      const permIds = new Set((permRes.data || []).map((p: Permission) => p.id));
      setSelectedPermissionIds(permIds);
    } catch (err) {
      console.error('Error loading role permissions:', err);
      setSelectedPermissionIds(new Set());
    }

    setViewMode('edit');
  };

  const handleViewRole = async (role: Role) => {
    setSelectedRole(role);

    // Load role permissions
    try {
      const permRes = await roleService.getPermissions(role.id);
      const permIds = new Set((permRes.data || []).map((p: Permission) => p.id));
      setSelectedPermissionIds(permIds);
    } catch (err) {
      console.error('Error loading role permissions:', err);
      setSelectedPermissionIds(new Set());
    }

    setViewMode('detail');
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystem) {
      setError('System roles cannot be deleted');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.displayName}"? This action cannot be undone and will remove role assignments from all staff members.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await roleService.delete(role.id);
          await loadData();
          setModalConfig({ ...modalConfig, isOpen: false });
          toast.success('Role Deleted', `"${role.displayName}" has been successfully deleted.`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
          setError(errorMessage);
          toast.error('Delete Failed', errorMessage);
        }
      },
    });
  };

  const handleSaveRole = async () => {
    try {
      setSaving(true);
      setError(null);

      const permissionIds = Array.from(selectedPermissionIds);

      if (viewMode === 'create') {
        const createData: CreateRoleRequest = {
          ...formData,
          permissionIds,
        };
        await roleService.create(createData);
        toast.success('Role Created', `"${formData.displayName}" has been successfully created.`);
      } else if (viewMode === 'edit' && selectedRole) {
        const updateData: UpdateRoleRequest = {
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          priorityLevel: formData.priorityLevel,
          color: formData.color,
          canManageStaff: formData.canManageStaff,
          canCreateRoles: formData.canCreateRoles,
        };
        await roleService.update(selectedRole.id, updateData);
        await roleService.setPermissions(selectedRole.id, { permissionIds });
        toast.success('Role Updated', `"${formData.displayName}" has been successfully updated.`);
      }

      await loadData();
      setViewMode('list');
      setSelectedRole(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save role';
      setError(errorMessage);
      toast.error('Save Failed', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedRoles = async () => {
    try {
      setSaving(true);
      setError(null);
      await roleService.seedDefaultRoles();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed default roles');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedRole(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds(prev => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const toggleAllCategoryPermissions = (categoryId: string) => {
    const categoryPermissions = allPermissions.filter(p => p.categoryId === categoryId);
    const allSelected = categoryPermissions.every(p => selectedPermissionIds.has(p.id));

    setSelectedPermissionIds(prev => {
      const next = new Set(prev);
      categoryPermissions.forEach(p => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const getRoleBadge = (role: Role) => {
    const category = getRolePriorityCategory(role.priorityLevel);
    const colors = ROLE_PRIORITY_COLORS[category];

    return (
      <Badge
        className={cn(colors.bg, colors.text, colors.border)}
        style={{ borderColor: role.color, backgroundColor: `${role.color}20` }}
      >
        {role.isSystem && <Lock className="w-3 h-3 mr-1" />}
        {role.displayName}
      </Badge>
    );
  };

  // Detail View
  if (viewMode === 'detail' && selectedRole) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={selectedRole.displayName}
            description={selectedRole.description || 'Role details and permissions'}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Roles', href: '/staff/roles' },
              { label: selectedRole.displayName },
            ]}
            actions={
              <>
                {!selectedRole.isSystem && (
                  <Button
                    onClick={() => handleEditRole(selectedRole)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Role
                  </Button>
                )}
                <Button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all"
                >
                  <X className="w-5 h-5" />
                  Close
                </Button>
              </>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Info */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Role Information
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{selectedRole.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Display Name</p>
                  <div className="mt-1">{getRoleBadge(selectedRole)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority Level</p>
                  <p className="font-semibold text-2xl" style={{ color: selectedRole.color }}>
                    {selectedRole.priorityLevel}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Can Manage Staff</p>
                    <Badge className={selectedRole.canManageStaff ? 'bg-success-muted text-success-muted-foreground' : 'bg-muted text-muted-foreground'}>
                      {selectedRole.canManageStaff ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Can Create Roles</p>
                    <Badge className={selectedRole.canCreateRoles ? 'bg-success-muted text-success-muted-foreground' : 'bg-muted text-muted-foreground'}>
                      {selectedRole.canCreateRoles ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                {selectedRole.isSystem && (
                  <div className="p-3 bg-warning-muted border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning-muted-foreground flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      This is a system role and cannot be modified.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-card rounded-lg border border-border overflow-hidden lg:col-span-2">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Permissions ({selectedPermissionIds.size})
                </h3>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {permissionCategories.map(category => {
                    const categoryPerms = allPermissions.filter(p => p.categoryId === category.id);
                    const selectedCount = categoryPerms.filter(p => selectedPermissionIds.has(p.id)).length;

                    if (selectedCount === 0) return null;

                    return (
                      <div key={category.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-3 p-3 bg-muted">
                          {CATEGORY_ICONS[category.name] || <Shield className="w-5 h-5" />}
                          <span className="font-medium">{category.displayName}</span>
                          <Badge className="ml-auto bg-primary/20 text-primary">
                            {selectedCount} / {categoryPerms.length}
                          </Badge>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categoryPerms
                            .filter(p => selectedPermissionIds.has(p.id))
                            .map(perm => (
                              <div key={perm.id} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span>{perm.displayName}</span>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    );
                  })}
                  {selectedPermissionIds.size === 0 && (
                    <p className="text-muted-foreground text-center py-8">No permissions assigned to this role.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Form
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={viewMode === 'create' ? 'Create New Role' : `Edit Role: ${selectedRole?.displayName}`}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Roles', href: '/staff/roles' },
              { label: viewMode === 'create' ? 'Create' : 'Edit' },
            ]}
          />

          {error && (
            <div className="p-4 bg-error-muted border-2 border-error/30 rounded-md text-error flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Details */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Role Details
                </h3>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Role Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="inventory_manager"
                    disabled={viewMode === 'edit' && selectedRole?.isSystem}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lowercase with underscores</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Display Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Inventory Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Manages inventory and stock levels"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Priority Level (1-100)
                  </label>
                  <input
                    type="number"
                    value={formData.priorityLevel}
                    onChange={(e) => setFormData({ ...formData, priorityLevel: parseInt(e.target.value) || 50 })}
                    className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    min={1}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Higher priority = more authority. Owner=100, Viewer=10</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-muted rounded-md cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.canManageStaff}
                      onChange={(e) => setFormData({ ...formData, canManageStaff: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <div>
                      <p className="font-medium">Can Manage Staff</p>
                      <p className="text-xs text-muted-foreground">Create, edit, deactivate staff members</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-muted rounded-md cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.canCreateRoles}
                      onChange={(e) => setFormData({ ...formData, canCreateRoles: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                    <div>
                      <p className="font-medium">Can Create Roles</p>
                      <p className="text-xs text-muted-foreground">Create new roles with equal or lower priority</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Permission Matrix */}
            <div className="bg-card rounded-lg border border-border overflow-hidden lg:col-span-2">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    Permissions ({selectedPermissionIds.size} selected)
                  </span>
                </h3>
              </div>
              <div className="p-6 pt-0">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {permissionCategories.map(category => {
                    const categoryPerms = allPermissions.filter(p => p.categoryId === category.id);
                    const selectedCount = categoryPerms.filter(p => selectedPermissionIds.has(p.id)).length;
                    const isExpanded = expandedCategories.has(category.id);
                    const allSelected = categoryPerms.length > 0 && selectedCount === categoryPerms.length;

                    return (
                      <div key={category.id} className="border rounded-lg overflow-hidden">
                        <div
                          className="flex items-center gap-3 p-3 bg-muted cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => toggleCategory(category.id)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAllCategoryPermissions(category.id);
                            }}
                            className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                              allSelected
                                ? "bg-primary border-primary text-white"
                                : selectedCount > 0
                                ? "bg-primary/20 border-primary/70 text-primary"
                                : "border-border hover:border-primary/70"
                            )}
                          >
                            {(allSelected || selectedCount > 0) && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                          </button>
                          {CATEGORY_ICONS[category.name] || <Shield className="w-5 h-5" />}
                          <span className="font-medium flex-1">{category.displayName}</span>
                          <Badge className={selectedCount > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                            {selectedCount} / {categoryPerms.length}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        {isExpanded && (
                          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                            {categoryPerms.map(perm => (
                              <label
                                key={perm.id}
                                className={cn(
                                  "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                                  selectedPermissionIds.has(perm.id)
                                    ? "bg-primary/10 hover:bg-primary/20"
                                    : "hover:bg-muted"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissionIds.has(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
                                />
                                <div>
                                  <p className="text-sm font-medium">{perm.displayName}</p>
                                  {perm.description && (
                                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={saving || !formData.name || !formData.displayName}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {viewMode === 'create' ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <PermissionGate
      permission={GatePermission.ROLES_READ}
      fallback="styled"
      fallbackTitle="Roles Access Required"
      fallbackDescription="You don't have the required permissions to manage roles. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Role Management"
          description="Create and manage custom roles with granular permissions"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team', href: '/staff' },
            { label: 'Roles' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={loadData}
                disabled={loading}
                className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
                title="Refresh"
              >
                <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
              </Button>
              {roles.length === 0 && (
                <Button
                  onClick={handleSeedRoles}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-warning text-warning-foreground rounded-md hover:bg-warning/90 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Seed Default Roles
                </Button>
              )}
              {canCreateRoles && (
                <>
                  <Button
                    onClick={() => setImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-primary/50 text-primary rounded-md hover:bg-primary/10 transition-all"
                  >
                    <Upload className="w-5 h-5" />
                    Import Roles
                  </Button>
                  <Button
                    onClick={handleCreateRole}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Role
                  </Button>
                </>
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

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
                <p className="mt-4 text-muted-foreground">Loading roles...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No roles found</p>
                <p className="text-muted-foreground mt-2">Create a role or seed default roles to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-4 font-semibold text-foreground">Role</th>
                      <th className="text-left p-4 font-semibold text-foreground">Priority</th>
                      <th className="text-left p-4 font-semibold text-foreground">Permissions</th>
                      <th className="text-left p-4 font-semibold text-foreground">Capabilities</th>
                      <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoles.map((role) => (
                      <tr
                        key={role.id}
                        className="border-b border-border hover:bg-primary/10/50 transition-colors cursor-pointer"
                        onClick={() => handleViewRole(role)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${role.color}20` }}
                            >
                              <Shield className="w-5 h-5" style={{ color: role.color }} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground flex items-center gap-2">
                                {role.displayName}
                                {role.isSystem && <Lock className="w-4 h-4 text-muted-foreground" />}
                              </p>
                              <p className="text-sm text-muted-foreground">{role.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            className="text-lg font-bold"
                            style={{ backgroundColor: `${role.color}20`, color: role.color }}
                          >
                            {role.priorityLevel}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-muted text-foreground">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {role.canManageStaff && (
                              <Badge className="bg-primary/20 text-primary">Staff</Badge>
                            )}
                            {role.canCreateRoles && (
                              <Badge className="bg-primary/10 text-primary">Roles</Badge>
                            )}
                            {!role.canManageStaff && !role.canCreateRoles && (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewRole(role);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                              title="View Details"
                              aria-label="View role details"
                            >
                              <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                            {!role.isSystem && canCreateRoles && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRole(role);
                                }}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                title="Edit"
                                aria-label="Edit role"
                              >
                                <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                              </Button>
                            )}
                            {!role.isSystem && canDeleteRoles && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRole(role);
                                }}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                                title="Delete"
                                aria-label="Delete role"
                              >
                                <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
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

        {!loading && filteredRoles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}

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
          entityType="roles"
          entityLabel="Roles"
          tenantId={currentTenant?.id}
        />
      </div>
    </div>
    </PermissionGate>
  );
}

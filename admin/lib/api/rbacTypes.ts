// ===========================================
// RBAC (Role-Based Access Control) Types
// ===========================================

// Department Types
export interface Department {
  id: string;
  tenantId: string;
  vendorId?: string;
  name: string;
  code?: string;
  description?: string;
  parentDepartmentId?: string;
  departmentHeadId?: string;
  departmentHead?: DepartmentHead;
  isActive: boolean;
  staffCount?: number;
  childCount?: number;
  createdAt: string;
  updatedAt: string;
  children?: Department[];
  parent?: Department;
}

export interface DepartmentHead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
}

// Hierarchy response structure from backend
export interface DepartmentHierarchy {
  department: Department;
  subDepartments?: DepartmentHierarchy[];
  teams?: Team[];
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  description?: string;
  parentDepartmentId?: string;
  departmentHeadId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  description?: string;
  parentDepartmentId?: string;
  departmentHeadId?: string;
  isActive?: boolean;
}

// Team Types
export interface Team {
  id: string;
  tenantId: string;
  vendorId?: string;
  departmentId: string;
  department?: Department;
  name: string;
  code?: string;
  teamLeadId?: string;
  teamLead?: TeamLead;
  defaultRoleId?: string;  // Role inherited by all team members
  defaultRole?: Role;      // Populated role details
  maxCapacity?: number;
  isActive: boolean;
  staffCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
}

export interface CreateTeamRequest {
  departmentId: string;
  name: string;
  code?: string;
  teamLeadId?: string;
  defaultRoleId?: string;  // Role inherited by all team members
  maxCapacity?: number;
}

export interface UpdateTeamRequest {
  departmentId?: string;
  name?: string;
  code?: string;
  teamLeadId?: string;
  defaultRoleId?: string;  // Role inherited by all team members
  maxCapacity?: number;
  isActive?: boolean;
}

// Permission Types
export interface PermissionCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  categoryId: string;
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
  isSensitive: boolean;
  requires2FA: boolean;
}

// Role Types
export interface Role {
  id: string;
  tenantId: string;
  vendorId?: string;
  name: string;
  displayName: string;
  description?: string;
  priorityLevel: number;
  color?: string;
  icon?: string;
  isSystem: boolean;
  isTemplate: boolean;
  templateSource?: string;
  canManageStaff: boolean;
  canCreateRoles: boolean;
  canDeleteRoles: boolean;
  createdAt: string;
  updatedAt?: string;
  permissions?: Permission[];
  assignedCount?: number;
}

export interface CreateRoleRequest {
  name: string;
  displayName: string;
  description?: string;
  priorityLevel?: number;
  color?: string;
  icon?: string;
  canManageStaff?: boolean;
  canCreateRoles?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  displayName?: string;
  description?: string;
  priorityLevel?: number;
  color?: string;
  icon?: string;
  canManageStaff?: boolean;
  canCreateRoles?: boolean;
}

export interface SetRolePermissionsRequest {
  permissionIds: string[];
}

// Role Assignment Types
export interface RoleAssignment {
  id: string;
  tenantId: string;
  vendorId?: string;
  staffId: string;
  roleId: string;
  role?: Role;
  isPrimary: boolean;
  assignedBy?: string;
  assignedByName?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface AssignRoleRequest {
  roleId: string;
  isPrimary?: boolean;
  expiresAt?: string;
}

export interface EffectivePermissions {
  staffId: string;
  tenantId: string;
  vendorId?: string;
  roles: Role[];
  permissions: Permission[];
  maxPriorityLevel: number;
  canManageStaff: boolean;
  canCreateRoles: boolean;
}

// Audit Log Types
export interface RBACAuditLogStaff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface RBACAuditLog {
  id: string;
  tenantId: string;
  vendorId?: string;
  entityType: 'role' | 'permission' | 'assignment' | 'department' | 'team';
  entityId: string;
  action: string; // 'department_created', 'role_updated', 'role_assigned', etc.
  performedBy?: string;
  performedByStaff?: RBACAuditLogStaff; // Staff object populated by backend
  targetStaffId?: string;
  targetStaff?: RBACAuditLogStaff; // Target staff object
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  createdAt: string;
}

// Default Role Templates
export const ROLE_TEMPLATES = [
  {
    name: 'store_owner',
    displayName: 'Store Owner',
    priorityLevel: 100,
    color: '#7C3AED',
    icon: 'Crown',
    canManageStaff: true,
    canCreateRoles: true,
  },
  {
    name: 'store_admin',
    displayName: 'Store Admin',
    priorityLevel: 90,
    color: '#8B5CF6',
    icon: 'Shield',
    canManageStaff: true,
    canCreateRoles: true,
  },
  {
    name: 'store_manager',
    displayName: 'Store Manager',
    priorityLevel: 70,
    color: '#3B82F6',
    icon: 'UserCog',
    canManageStaff: true,
    canCreateRoles: false,
  },
  {
    name: 'inventory_manager',
    displayName: 'Inventory Manager',
    priorityLevel: 60,
    color: '#10B981',
    icon: 'Package',
    canManageStaff: false,
    canCreateRoles: false,
  },
  {
    name: 'order_manager',
    displayName: 'Order Manager',
    priorityLevel: 60,
    color: '#F59E0B',
    icon: 'ShoppingCart',
    canManageStaff: false,
    canCreateRoles: false,
  },
  {
    name: 'customer_support',
    displayName: 'Customer Support',
    priorityLevel: 50,
    color: '#06B6D4',
    icon: 'HeadphonesIcon',
    canManageStaff: false,
    canCreateRoles: false,
  },
  {
    name: 'marketing_manager',
    displayName: 'Marketing Manager',
    priorityLevel: 60,
    color: '#EC4899',
    icon: 'Megaphone',
    canManageStaff: false,
    canCreateRoles: false,
  },
  {
    name: 'viewer',
    displayName: 'Viewer',
    priorityLevel: 10,
    color: '#6B7280',
    icon: 'Eye',
    canManageStaff: false,
    canCreateRoles: false,
  },
] as const;

// Permission Category Icons
export const PERMISSION_CATEGORY_ICONS: Record<string, string> = {
  catalog: 'Package',
  orders: 'ShoppingCart',
  customers: 'Users',
  marketing: 'Megaphone',
  ads: 'Megaphone',  // Ad Manager uses same icon as marketing
  analytics: 'BarChart3',
  settings: 'Settings',
  team: 'UserCog',
  finance: 'DollarSign',
  inventory: 'Warehouse',
};

// Role Badge Colors
export const ROLE_PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  owner: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  admin: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  manager: { bg: 'bg-accent', text: 'text-primary', border: 'border-primary/30' },
  standard: { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' },
  viewer: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

export function getRolePriorityCategory(priorityLevel: number): string {
  if (priorityLevel >= 90) return 'owner';
  if (priorityLevel >= 70) return 'admin';
  if (priorityLevel >= 50) return 'manager';
  if (priorityLevel >= 20) return 'standard';
  return 'viewer';
}

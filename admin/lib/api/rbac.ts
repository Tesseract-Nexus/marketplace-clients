import { apiClient } from './client';
import type { ApiResponse, ApiListResponse } from './types';
import type {
  Department,
  DepartmentHierarchy,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  SetRolePermissionsRequest,
  Permission,
  PermissionCategory,
  RoleAssignment,
  AssignRoleRequest,
  EffectivePermissions,
  RBACAuditLog,
} from './rbacTypes';

// ===========================================
// Department Service
// ===========================================

export class DepartmentService {
  async list(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    parentId?: string;
  }): Promise<ApiListResponse<Department>> {
    return apiClient.get<ApiListResponse<Department>>('/staff/departments', params);
  }

  async get(id: string): Promise<ApiResponse<Department>> {
    return apiClient.get<ApiResponse<Department>>(`/staff/departments/${id}`);
  }

  async create(data: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
    return apiClient.post<ApiResponse<Department>>('/staff/departments', data);
  }

  async update(id: string, data: UpdateDepartmentRequest): Promise<ApiResponse<Department>> {
    return apiClient.put<ApiResponse<Department>>(`/staff/departments/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/staff/departments/${id}`);
  }

  async getHierarchy(): Promise<ApiResponse<DepartmentHierarchy[]>> {
    return apiClient.get<ApiResponse<DepartmentHierarchy[]>>('/staff/departments/hierarchy');
  }
}

// ===========================================
// Team Service
// ===========================================

export class TeamService {
  async list(params?: {
    page?: number;
    limit?: number;
    departmentId?: string;
    isActive?: boolean;
  }): Promise<ApiListResponse<Team>> {
    return apiClient.get<ApiListResponse<Team>>('/staff/teams', params);
  }

  async get(id: string): Promise<ApiResponse<Team>> {
    return apiClient.get<ApiResponse<Team>>(`/staff/teams/${id}`);
  }

  async create(data: CreateTeamRequest): Promise<ApiResponse<Team>> {
    return apiClient.post<ApiResponse<Team>>('/staff/teams', data);
  }

  async update(id: string, data: UpdateTeamRequest): Promise<ApiResponse<Team>> {
    return apiClient.put<ApiResponse<Team>>(`/staff/teams/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/staff/teams/${id}`);
  }
}

// ===========================================
// Role Service
// ===========================================

export class RoleService {
  async list(params?: {
    page?: number;
    limit?: number;
    isSystem?: boolean;
    isTemplate?: boolean;
  }): Promise<ApiListResponse<Role>> {
    return apiClient.get<ApiListResponse<Role>>('/staff/roles', params);
  }

  async get(id: string): Promise<ApiResponse<Role>> {
    return apiClient.get<ApiResponse<Role>>(`/staff/roles/${id}`);
  }

  async create(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return apiClient.post<ApiResponse<Role>>('/staff/roles', data);
  }

  async update(id: string, data: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    return apiClient.put<ApiResponse<Role>>(`/staff/roles/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/staff/roles/${id}`);
  }

  async getPermissions(id: string): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<ApiResponse<Permission[]>>(`/staff/roles/${id}/permissions`);
  }

  async setPermissions(id: string, data: SetRolePermissionsRequest): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(`/staff/roles/${id}/permissions`, data);
  }

  async getAssignableRoles(): Promise<ApiResponse<Role[]>> {
    return apiClient.get<ApiResponse<Role[]>>('/staff/roles/assignable');
  }

  async seedDefaultRoles(): Promise<ApiResponse<Role[]>> {
    return apiClient.post<ApiResponse<Role[]>>('/staff/roles/seed', {});
  }
}

// ===========================================
// Permission Service
// ===========================================

export class PermissionService {
  async list(): Promise<ApiResponse<Permission[]>> {
    return apiClient.get<ApiResponse<Permission[]>>('/staff/permissions');
  }

  async getCategories(): Promise<ApiResponse<PermissionCategory[]>> {
    return apiClient.get<ApiResponse<PermissionCategory[]>>('/staff/permissions/categories');
  }
}

// ===========================================
// Staff Role Assignment Service
// ===========================================

export class StaffRoleService {
  async getStaffRoles(staffId: string): Promise<ApiResponse<RoleAssignment[]>> {
    return apiClient.get<ApiResponse<RoleAssignment[]>>(`/staff/staff/${staffId}/roles`);
  }

  async assignRole(staffId: string, data: AssignRoleRequest): Promise<ApiResponse<RoleAssignment>> {
    return apiClient.post<ApiResponse<RoleAssignment>>(`/staff/staff/${staffId}/roles`, data);
  }

  async removeRole(staffId: string, roleId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/staff/staff/${staffId}/roles/${roleId}`);
  }

  async setPrimaryRole(staffId: string, roleId: string): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(`/staff/staff/${staffId}/roles/${roleId}/primary`, {});
  }

  async getEffectivePermissions(staffId: string): Promise<ApiResponse<EffectivePermissions>> {
    return apiClient.get<ApiResponse<EffectivePermissions>>(`/staff/staff/${staffId}/permissions`);
  }

  /**
   * Get effective permissions for the currently authenticated user
   * Uses /staff/me/permissions endpoint which gets user ID from auth context
   */
  async getMyEffectivePermissions(): Promise<ApiResponse<EffectivePermissions>> {
    return apiClient.get<ApiResponse<EffectivePermissions>>('/staff/me/permissions');
  }
}

// ===========================================
// RBAC Audit Service
// ===========================================

export class RBACAuditService {
  async list(params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    action?: string;
    performedBy?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiListResponse<RBACAuditLog>> {
    return apiClient.get<ApiListResponse<RBACAuditLog>>('/staff/audit/rbac', params);
  }
}

// Export singleton instances
export const departmentService = new DepartmentService();
export const teamService = new TeamService();
export const roleService = new RoleService();
export const permissionService = new PermissionService();
export const staffRoleService = new StaffRoleService();
export const rbacAuditService = new RBACAuditService();

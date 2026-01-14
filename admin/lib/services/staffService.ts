import { staffService as staffApiService } from '../api/staff';
import {
  Staff,
  CreateStaffRequest,
  UpdateStaffRequest,
  ApiResponse,
  ApiListResponse,
} from '../api/types';
import { mockStaff } from '../data/mockStaff';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

/**
 * Mock service implementation
 */
class MockStaffService {
  private staff: Staff[] = [...mockStaff];
  private nextId = 8;

  async getStaff(params?: {
    page?: number;
    limit?: number;
    role?: string;
  }): Promise<ApiListResponse<Staff>> {
    let filtered = [...this.staff];

    if (params?.role && params.role !== 'ALL') {
      filtered = filtered.filter((s) => s.role === params.role);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async getStaffMember(id: string): Promise<ApiResponse<Staff>> {
    const staffMember = this.staff.find((s) => s.id === id);
    if (!staffMember) {
      throw new Error('Staff member not found');
    }
    return {
      success: true,
      data: staffMember,
    };
  }

  async createStaff(data: CreateStaffRequest): Promise<ApiResponse<Staff>> {
    const newStaff: Staff = {
      id: String(this.nextId++),
      tenantId: '00000000-0000-0000-0000-000000000001',
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      displayName: data.displayName,
      email: data.email,
      alternateEmail: data.alternateEmail,
      phoneNumber: data.phoneNumber,
      mobileNumber: data.mobileNumber,
      employeeId: data.employeeId,
      role: data.role,
      employmentType: data.employmentType,
      startDate: data.startDate,
      endDate: data.endDate,
      departmentId: data.departmentId,
      teamId: data.teamId,
      managerId: data.managerId,
      locationId: data.locationId,
      profilePhotoUrl: data.profilePhotoUrl,
      jobTitle: data.jobTitle,
      salary: data.salary,
      currencyCode: data.currencyCode || 'USD',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.staff.push(newStaff);

    return {
      success: true,
      data: newStaff,
    };
  }

  async updateStaff(
    id: string,
    data: UpdateStaffRequest
  ): Promise<ApiResponse<Staff>> {
    const index = this.staff.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Staff member not found');
    }

    const updated = {
      ...this.staff[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.staff[index] = updated;

    return {
      success: true,
      data: updated,
    };
  }

  async deleteStaff(id: string): Promise<ApiResponse<void>> {
    this.staff = this.staff.filter((s) => s.id !== id);
    return {
      success: true,
      data: undefined,
    };
  }
}

const mockService = new MockStaffService();

/**
 * Unified staff service that switches between mock and API
 */
export const staffService = {
  getStaff: async (params?: { page?: number; limit?: number; role?: string }) => {
    if (USE_MOCK_DATA) {
      return mockService.getStaff(params);
    }
    return staffApiService.getStaff(params);
  },

  getStaffMember: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getStaffMember(id);
    }
    return staffApiService.getStaffMember(id);
  },

  createStaff: async (data: CreateStaffRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createStaff(data);
    }
    return staffApiService.createStaff(data);
  },

  updateStaff: async (id: string, data: UpdateStaffRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateStaff(id, data);
    }
    return staffApiService.updateStaff(id, data);
  },

  deleteStaff: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteStaff(id);
    }
    return staffApiService.deleteStaff(id);
  },

  isMockMode: () => USE_MOCK_DATA,
};

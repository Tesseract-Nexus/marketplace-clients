import { vendorsService } from '../api/vendors';
import {
  Vendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  ApiResponse,
  ApiListResponse,
} from '../api/types';
import { mockVendors } from '../data/mockVendors';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

/**
 * Mock service implementation
 */
class MockVendorService {
  private vendors: Vendor[] = [...mockVendors];
  private nextId = 6;

  async getVendors(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiListResponse<Vendor>> {
    let filtered = [...this.vendors];

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((vendor) => vendor.status === params.status);
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

  async getVendor(id: string): Promise<ApiResponse<Vendor>> {
    const vendor = this.vendors.find((v) => v.id === id);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    return {
      success: true,
      data: vendor,
    };
  }

  async createVendor(
    data: CreateVendorRequest
  ): Promise<ApiResponse<Vendor>> {
    const newVendor: Vendor = {
      id: String(this.nextId++),
      tenantId: '00000000-0000-0000-0000-000000000001',
      name: data.name,
      details: data.details,
      status: 'PENDING',
      location: data.location,
      primaryContact: data.primaryContact,
      secondaryContact: data.secondaryContact,
      email: data.email,
      validationStatus: 'NOT_STARTED',
      commissionRate: data.commissionRate || 0,
      isActive: false,
      businessRegistrationNumber: data.businessRegistrationNumber,
      taxIdentificationNumber: data.taxIdentificationNumber,
      website: data.website,
      businessType: data.businessType,
      foundedYear: data.foundedYear,
      employeeCount: data.employeeCount,
      tags: data.tags ? { tags: data.tags } : undefined,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.vendors.push(newVendor);

    return {
      success: true,
      data: newVendor,
    };
  }

  async updateVendor(
    id: string,
    data: UpdateVendorRequest
  ): Promise<ApiResponse<Vendor>> {
    const index = this.vendors.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error('Vendor not found');
    }

    const updated = {
      ...this.vendors[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.vendors[index] = updated;

    return {
      success: true,
      data: updated,
    };
  }

  async deleteVendor(id: string): Promise<ApiResponse<void>> {
    this.vendors = this.vendors.filter((v) => v.id !== id);
    return {
      success: true,
      data: undefined,
    };
  }
}

const mockService = new MockVendorService();

/**
 * Unified vendor service that switches between mock and API
 */
export const vendorService = {
  getVendors: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    if (USE_MOCK_DATA) {
      return mockService.getVendors(params);
    }
    return vendorsService.getVendors(params);
  },

  getVendor: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getVendor(id);
    }
    return vendorsService.getVendor(id);
  },

  createVendor: async (data: CreateVendorRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createVendor(data);
    }
    return vendorsService.createVendor(data);
  },

  updateVendor: async (id: string, data: UpdateVendorRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateVendor(id, data);
    }
    return vendorsService.updateVendor(id, data);
  },

  deleteVendor: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteVendor(id);
    }
    return vendorsService.deleteVendor(id);
  },

  isMockMode: () => USE_MOCK_DATA,
};

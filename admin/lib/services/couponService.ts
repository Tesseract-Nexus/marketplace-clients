import { couponsService } from '../api/coupons';
import {
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
  ApiResponse,
  ApiListResponse,
  CouponsAnalytics,
} from '../api/types';
import { mockCoupons } from '../data/mockCoupons';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

/**
 * Mock service implementation
 */
class MockCouponService {
  private coupons: Coupon[] = [...mockCoupons];
  private nextId = 11;

  async getCoupons(params?: {
    page?: number;
    limit?: number;
    status?: string;
    discountType?: string;
  }): Promise<ApiListResponse<Coupon>> {
    let filtered = [...this.coupons];

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((coupon) => coupon.status === params.status);
    }

    if (params?.discountType && params.discountType !== 'ALL') {
      filtered = filtered.filter(
        (coupon) => coupon.discountType === params.discountType
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    // Sort by created date descending
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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

  async getCoupon(id: string): Promise<ApiResponse<Coupon>> {
    const coupon = this.coupons.find((c) => c.id === id);
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    return {
      success: true,
      data: coupon,
    };
  }

  async getCouponByCode(code: string): Promise<ApiResponse<Coupon>> {
    const coupon = this.coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );
    if (!coupon) {
      throw new Error('Coupon not found');
    }
    return {
      success: true,
      data: coupon,
    };
  }

  async createCoupon(data: CreateCouponRequest): Promise<ApiResponse<Coupon>> {
    // Check if code already exists
    const existingCoupon = this.coupons.find(
      (c) => c.code.toUpperCase() === data.code.toUpperCase()
    );
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    const newCoupon: Coupon = {
      id: `CPN-${String(this.nextId++).padStart(3, '0')}`,
      tenantId: '00000000-0000-0000-0000-000000000001',
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      applicability: data.applicability || 'ALL_PRODUCTS',
      status: 'DRAFT',
      totalUsageLimit: data.totalUsageLimit,
      perCustomerLimit: data.perCustomerLimit,
      currentUsageCount: 0,
      startDate: data.startDate,
      endDate: data.endDate,
      restrictions: data.restrictions,
      tags: data.tags || [],
      notes: data.notes,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
    };

    this.coupons.push(newCoupon);

    return {
      success: true,
      data: newCoupon,
    };
  }

  async updateCoupon(
    id: string,
    data: UpdateCouponRequest
  ): Promise<ApiResponse<Coupon>> {
    const index = this.coupons.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Coupon not found');
    }

    const updated = {
      ...this.coupons[index],
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };

    this.coupons[index] = updated;

    return {
      success: true,
      data: updated,
    };
  }

  async deleteCoupon(id: string): Promise<ApiResponse<{ message: string }>> {
    this.coupons = this.coupons.filter((c) => c.id !== id);
    return {
      success: true,
      data: { message: 'Coupon deleted successfully' },
    };
  }

  async updateCouponStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Coupon>> {
    return this.updateCoupon(id, { status: status as any });
  }

  async validateCoupon(
    code: string,
    orderTotal: string,
    customerId?: string
  ): Promise<
    ApiResponse<{ valid: boolean; discount: string; message: string }>
  > {
    const coupon = this.coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );

    if (!coupon) {
      return {
        success: true,
        data: {
          valid: false,
          discount: '0',
          message: 'Coupon code not found',
        },
      };
    }

    if (coupon.status !== 'ACTIVE') {
      return {
        success: true,
        data: {
          valid: false,
          discount: '0',
          message: 'Coupon is not active',
        },
      };
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return {
        success: true,
        data: {
          valid: false,
          discount: '0',
          message: 'Coupon is not yet valid',
        },
      };
    }

    if (coupon.endDate && new Date(coupon.endDate) < now) {
      return {
        success: true,
        data: {
          valid: false,
          discount: '0',
          message: 'Coupon has expired',
        },
      };
    }

    if (
      coupon.totalUsageLimit &&
      coupon.currentUsageCount >= coupon.totalUsageLimit
    ) {
      return {
        success: true,
        data: {
          valid: false,
          discount: '0',
          message: 'Coupon usage limit reached',
        },
      };
    }

    const orderAmount = parseFloat(orderTotal);
    if (
      coupon.restrictions?.minPurchaseAmount &&
      orderAmount < coupon.restrictions.minPurchaseAmount
    ) {
      return {
        success: true,
        data: {
          valid: false,
          discount: '0',
          message: `Minimum purchase amount is $${coupon.restrictions.minPurchaseAmount}`,
        },
      };
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = orderAmount * (coupon.discountValue / 100);
      if (
        coupon.restrictions?.maxDiscountAmount &&
        discount > coupon.restrictions.maxDiscountAmount
      ) {
        discount = coupon.restrictions.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'FIXED_AMOUNT') {
      discount = coupon.discountValue;
    }

    return {
      success: true,
      data: {
        valid: true,
        discount: discount.toFixed(2),
        message: 'Coupon is valid',
      },
    };
  }

  async getCouponUsageHistory(id: string): Promise<ApiListResponse<any>> {
    // Mock implementation - return empty usage history
    return {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  async getCouponAnalytics(): Promise<ApiResponse<CouponsAnalytics>> {
    const totalRedemptions = this.coupons.reduce(
      (sum, c) => sum + c.currentUsageCount,
      0
    );

    return {
      success: true,
      data: {
        overview: {
          totalCoupons: this.coupons.length,
          activeCoupons: this.coupons.filter((c) => c.status === 'ACTIVE')
            .length,
          expiredCoupons: this.coupons.filter((c) => c.status === 'EXPIRED')
            .length,
          totalRedemptions,
          totalDiscountGiven: 0, // Would need order data to calculate
          averageDiscountValue:
            this.coupons.reduce(
              (sum, c) => sum + c.discountValue,
              0
            ) / (this.coupons.length || 1),
        },
      },
    };
  }

  async bulkDeleteCoupons(
    ids: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    this.coupons = this.coupons.filter((c) => !ids.includes(c.id));
    return {
      success: true,
      data: { message: `${ids.length} coupons deleted successfully` },
    };
  }

  async duplicateCoupon(id: string): Promise<ApiResponse<Coupon>> {
    const original = this.coupons.find((c) => c.id === id);
    if (!original) {
      throw new Error('Coupon not found');
    }

    const duplicate: Coupon = {
      ...original,
      id: `CPN-${String(this.nextId++).padStart(3, '0')}`,
      code: `${original.code}-COPY`,
      name: `${original.name} (Copy)`,
      status: 'DRAFT',
      currentUsageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.coupons.push(duplicate);

    return {
      success: true,
      data: duplicate,
    };
  }
}

const mockService = new MockCouponService();

/**
 * Unified coupon service that switches between mock and API
 */
export const couponService = {
  getCoupons: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    discountType?: string;
  }) => {
    if (USE_MOCK_DATA) {
      return mockService.getCoupons(params);
    }
    return couponsService.getCoupons(params);
  },

  getCoupon: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getCoupon(id);
    }
    return couponsService.getCoupon(id);
  },

  getCouponByCode: async (code: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getCouponByCode(code);
    }
    return couponsService.getCouponByCode(code);
  },

  createCoupon: async (data: CreateCouponRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createCoupon(data);
    }
    return couponsService.createCoupon(data);
  },

  updateCoupon: async (id: string, data: UpdateCouponRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateCoupon(id, data);
    }
    return couponsService.updateCoupon(id, data);
  },

  deleteCoupon: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteCoupon(id);
    }
    return couponsService.deleteCoupon(id);
  },

  updateCouponStatus: async (id: string, status: string) => {
    if (USE_MOCK_DATA) {
      return mockService.updateCouponStatus(id, status);
    }
    return couponsService.updateCouponStatus(id, status);
  },

  validateCoupon: async (
    code: string,
    orderTotal: string,
    customerId?: string
  ) => {
    if (USE_MOCK_DATA) {
      return mockService.validateCoupon(code, orderTotal, customerId);
    }
    return couponsService.validateCoupon(code, orderTotal, customerId);
  },

  getCouponUsageHistory: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getCouponUsageHistory(id);
    }
    return couponsService.getCouponUsageHistory(id);
  },

  getCouponAnalytics: async () => {
    if (USE_MOCK_DATA) {
      return mockService.getCouponAnalytics();
    }
    return couponsService.getCouponAnalytics();
  },

  bulkDeleteCoupons: async (ids: string[]) => {
    if (USE_MOCK_DATA) {
      return mockService.bulkDeleteCoupons(ids);
    }
    return couponsService.bulkDeleteCoupons(ids);
  },

  duplicateCoupon: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.duplicateCoupon(id);
    }
    return couponsService.duplicateCoupon(id);
  },

  isMockMode: () => USE_MOCK_DATA,
};

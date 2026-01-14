import { storefrontsService } from '../api/storefronts';
import {
  Storefront,
  CreateStorefrontRequest,
  UpdateStorefrontRequest,
  StorefrontResolutionData,
  ApiResponse,
  ApiListResponse,
} from '../api/types';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

// Mock storefront domain for computing URLs in mock mode
const MOCK_STOREFRONT_DOMAIN = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || 'tesserix.app';

// Helper to compute storefront URL (same logic as backend)
const computeStorefrontUrl = (slug: string, customDomain?: string): string => {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  return `https://${slug}.${MOCK_STOREFRONT_DOMAIN}`;
};

// Mock data for development/testing
const mockStorefronts: Storefront[] = [
  {
    id: 'sf-001',
    vendorId: '1',
    slug: 'acme-store',
    name: 'ACME Store',
    description: 'The official ACME Corporation storefront',
    isActive: true,
    logoUrl: undefined,
    faviconUrl: undefined,
    metaTitle: 'ACME Store - Quality Products',
    metaDescription: 'Shop the best products at ACME Store',
    storefrontUrl: `https://acme-store.${MOCK_STOREFRONT_DOMAIN}`,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'sf-002',
    vendorId: '2',
    slug: 'tech-gadgets',
    name: 'Tech Gadgets Hub',
    description: 'Your one-stop shop for the latest tech gadgets',
    isActive: true,
    logoUrl: undefined,
    faviconUrl: undefined,
    metaTitle: 'Tech Gadgets Hub',
    metaDescription: 'Find the latest technology and gadgets',
    storefrontUrl: `https://tech-gadgets.${MOCK_STOREFRONT_DOMAIN}`,
    createdAt: '2024-02-01T09:30:00Z',
    updatedAt: '2024-02-01T09:30:00Z',
  },
  {
    id: 'sf-003',
    vendorId: '3',
    slug: 'fashion-forward',
    name: 'Fashion Forward',
    description: 'Trendy fashion for everyone',
    isActive: true,
    logoUrl: undefined,
    faviconUrl: undefined,
    metaTitle: 'Fashion Forward - Trendy Styles',
    metaDescription: 'Discover the latest fashion trends',
    storefrontUrl: `https://fashion-forward.${MOCK_STOREFRONT_DOMAIN}`,
    createdAt: '2024-02-10T14:00:00Z',
    updatedAt: '2024-02-10T14:00:00Z',
  },
];

/**
 * Mock service implementation for development
 */
class MockStorefrontService {
  private storefronts: Storefront[] = [...mockStorefronts];
  private nextId = 4;

  async getStorefronts(params?: {
    page?: number;
    limit?: number;
    vendorId?: string;
    isActive?: boolean;
  }): Promise<ApiListResponse<Storefront>> {
    let filtered = [...this.storefronts];

    if (params?.vendorId) {
      filtered = filtered.filter((sf) => sf.vendorId === params.vendorId);
    }

    if (params?.isActive !== undefined) {
      filtered = filtered.filter((sf) => sf.isActive === params.isActive);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    const start = (page - 1) * limit;
    const paginatedData = filtered.slice(start, start + limit);

    return {
      success: true,
      data: paginatedData,
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

  async getStorefront(id: string): Promise<ApiResponse<Storefront>> {
    const storefront = this.storefronts.find((sf) => sf.id === id);
    if (!storefront) {
      throw new Error('Storefront not found');
    }
    return {
      success: true,
      data: storefront,
    };
  }

  async createStorefront(data: CreateStorefrontRequest): Promise<ApiResponse<Storefront>> {
    // Check if slug already exists
    const existingSlug = this.storefronts.find(
      (sf) => sf.slug.toLowerCase() === data.slug.toLowerCase()
    );
    if (existingSlug) {
      throw new Error('Slug already exists');
    }

    const slug = data.slug.toLowerCase();
    const newStorefront: Storefront = {
      id: `sf-00${this.nextId++}`,
      vendorId: data.vendorId,
      slug,
      name: data.name,
      description: data.description,
      customDomain: data.customDomain,
      isActive: true,
      themeConfig: data.themeConfig,
      settings: data.settings,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      storefrontUrl: computeStorefrontUrl(slug, data.customDomain),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.storefronts.push(newStorefront);

    return {
      success: true,
      data: newStorefront,
    };
  }

  async updateStorefront(
    id: string,
    data: UpdateStorefrontRequest
  ): Promise<ApiResponse<Storefront>> {
    const index = this.storefronts.findIndex((sf) => sf.id === id);
    if (index === -1) {
      throw new Error('Storefront not found');
    }

    // Check if updating slug and it already exists
    if (data.slug) {
      const existingSlug = this.storefronts.find(
        (sf) => sf.slug.toLowerCase() === data.slug!.toLowerCase() && sf.id !== id
      );
      if (existingSlug) {
        throw new Error('Slug already exists');
      }
    }

    const updated: Storefront = {
      ...this.storefronts[index],
      ...data,
      slug: data.slug ? data.slug.toLowerCase() : this.storefronts[index].slug,
      updatedAt: new Date().toISOString(),
    };

    this.storefronts[index] = updated;

    return {
      success: true,
      data: updated,
    };
  }

  async deleteStorefront(id: string): Promise<ApiResponse<void>> {
    const index = this.storefronts.findIndex((sf) => sf.id === id);
    if (index === -1) {
      throw new Error('Storefront not found');
    }

    this.storefronts.splice(index, 1);

    return {
      success: true,
      data: undefined,
    };
  }

  async getVendorStorefronts(vendorId: string): Promise<ApiListResponse<Storefront>> {
    return this.getStorefronts({ vendorId });
  }

  async checkSlugAvailability(slug: string): Promise<boolean> {
    const existing = this.storefronts.find(
      (sf) => sf.slug.toLowerCase() === slug.toLowerCase()
    );
    return !existing;
  }

  async resolveBySlug(slug: string): Promise<ApiResponse<StorefrontResolutionData>> {
    const storefront = this.storefronts.find(
      (sf) => sf.slug.toLowerCase() === slug.toLowerCase() && sf.isActive
    );
    if (!storefront) {
      throw new Error('Storefront not found');
    }

    return {
      success: true,
      data: {
        storefrontId: storefront.id,
        vendorId: storefront.vendorId,
        slug: storefront.slug,
        name: storefront.name,
        customDomain: storefront.customDomain,
        themeConfig: storefront.themeConfig,
        settings: storefront.settings,
        logoUrl: storefront.logoUrl,
        faviconUrl: storefront.faviconUrl,
        vendorName: 'Mock Vendor', // Would need vendor lookup in real impl
        vendorIsActive: true,
        storefrontUrl: storefront.storefrontUrl,
      },
    };
  }
}

const mockService = new MockStorefrontService();

/**
 * Unified storefront service that switches between mock and API
 */
export const storefrontService = {
  getStorefronts: async (params?: {
    page?: number;
    limit?: number;
    vendorId?: string;
    isActive?: boolean;
  }) => {
    if (USE_MOCK_DATA) {
      return mockService.getStorefronts(params);
    }
    return storefrontsService.getStorefronts(params);
  },

  getStorefront: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getStorefront(id);
    }
    return storefrontsService.getStorefront(id);
  },

  createStorefront: async (data: CreateStorefrontRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createStorefront(data);
    }
    return storefrontsService.createStorefront(data);
  },

  updateStorefront: async (id: string, data: UpdateStorefrontRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateStorefront(id, data);
    }
    return storefrontsService.updateStorefront(id, data);
  },

  deleteStorefront: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteStorefront(id);
    }
    return storefrontsService.deleteStorefront(id);
  },

  getVendorStorefronts: async (vendorId: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getVendorStorefronts(vendorId);
    }
    return storefrontsService.getVendorStorefronts(vendorId);
  },

  checkSlugAvailability: async (slug: string) => {
    if (USE_MOCK_DATA) {
      return mockService.checkSlugAvailability(slug);
    }
    return storefrontsService.checkSlugAvailability(slug);
  },

  resolveBySlug: async (slug: string) => {
    if (USE_MOCK_DATA) {
      return mockService.resolveBySlug(slug);
    }
    return storefrontsService.resolveBySlug(slug);
  },

  isMockMode: () => USE_MOCK_DATA,
};

import { categoriesService, CategoryImageResponse, ListCategoryImagesResponse } from '../api/categories';
import {
  Category,
  CategoryImage,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ApiResponse,
  ApiListResponse,
  MediaLimits,
} from '../api/types';
import { mockCategories } from '../data/mockCategories';

const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === '1';

/**
 * Mock category image for testing
 */
interface MockCategoryImage {
  id: string;
  name: string;
  url: string;
  path: string;
  position: number;
  metadata: Record<string, string>;
}

/**
 * Mock service implementation
 */
class MockCategoryService {
  private categories: Category[] = [...mockCategories];
  private nextId = 9;
  private categoryImages: Map<string, MockCategoryImage[]> = new Map();

  async getCategories(params?: {
    page?: number;
    limit?: number;
    status?: string;
    isActive?: boolean;
  }): Promise<ApiListResponse<Category>> {
    let filtered = [...this.categories];

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((cat) => cat.status === params.status);
    }

    if (params?.isActive !== undefined) {
      filtered = filtered.filter((cat) => cat.isActive === params.isActive);
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

  async getCategoryTree(): Promise<ApiResponse<Category[]>> {
    return {
      success: true,
      data: this.categories,
    };
  }

  async getCategory(id: string): Promise<ApiResponse<Category>> {
    const category = this.categories.find((cat) => cat.id === id);
    if (!category) {
      throw new Error('Category not found');
    }
    return {
      success: true,
      data: category,
    };
  }

  async createCategory(
    data: CreateCategoryRequest
  ): Promise<ApiResponse<Category>> {
    const slug = data.slug || this.generateSlug(data.name);
    const parentLevel = data.parentId
      ? this.categories.find((c) => c.id === data.parentId)?.level || 0
      : 0;

    const newCategory: Category = {
      id: String(this.nextId++),
      tenantId: '00000000-0000-0000-0000-000000000001',
      createdById: 'admin',
      updatedById: 'admin',
      name: data.name,
      slug,
      description: data.description,
      imageUrl: data.imageUrl,
      bannerUrl: data.bannerUrl,
      parentId: data.parentId,
      level: data.parentId ? parentLevel + 1 : 0,
      position:
        data.position ||
        this.categories.filter((c) => c.parentId === data.parentId).length + 1,
      isActive: data.isActive ?? true,
      status: 'DRAFT',
      tier: data.tier,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.categories.push(newCategory);

    return {
      success: true,
      data: newCategory,
    };
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryRequest
  ): Promise<ApiResponse<Category>> {
    const index = this.categories.findIndex((cat) => cat.id === id);
    if (index === -1) {
      throw new Error('Category not found');
    }

    const updated = {
      ...this.categories[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.categories[index] = updated;

    return {
      success: true,
      data: updated,
    };
  }

  async deleteCategory(id: string): Promise<ApiResponse<{ message: string }>> {
    this.categories = this.categories.filter((cat) => cat.id !== id);
    return {
      success: true,
      data: { message: 'Category deleted successfully' },
    };
  }

  async updateCategoryStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Category>> {
    return this.updateCategory(id, { status: status as any });
  }

  async bulkDeleteCategories(
    ids: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    this.categories = this.categories.filter((cat) => !ids.includes(cat.id));
    return {
      success: true,
      data: { message: `${ids.length} categories deleted successfully` },
    };
  }

  async bulkUpdateCategoryActiveStatus(
    ids: string[],
    isActive: boolean
  ): Promise<ApiResponse<{ updatedCount: number; message: string }>> {
    let updatedCount = 0;
    this.categories = this.categories.map((cat) => {
      if (ids.includes(cat.id)) {
        updatedCount++;
        return { ...cat, isActive, updatedAt: new Date().toISOString() };
      }
      return cat;
    });
    const action = isActive ? 'activated' : 'deactivated';
    return {
      success: true,
      data: {
        updatedCount,
        message: `${updatedCount} categories ${action} successfully`
      },
    };
  }

  async bulkUpdateCategoryStatus(
    ids: string[],
    status: string
  ): Promise<ApiResponse<{ success: boolean; updatedCount: number; failedIds?: string[]; message: string }>> {
    let updatedCount = 0;
    const failedIds: string[] = [];

    this.categories = this.categories.map((cat) => {
      if (ids.includes(cat.id)) {
        updatedCount++;
        return { ...cat, status: status as any, updatedAt: new Date().toISOString() };
      }
      return cat;
    });

    return {
      success: true,
      data: {
        success: updatedCount > 0,
        updatedCount,
        failedIds: failedIds.length > 0 ? failedIds : undefined,
        message: `${updatedCount} categories updated to ${status}`
      },
    };
  }

  async getCategoryAnalytics(): Promise<
    ApiResponse<{ total: number; active: number }>
  > {
    return {
      success: true,
      data: {
        total: this.categories.length,
        active: this.categories.filter((c) => c.isActive).length,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async uploadCategoryImage(
    categoryId: string,
    file: File,
    options?: { imageType?: string; position?: number }
  ): Promise<CategoryImageResponse> {
    const images = this.categoryImages.get(categoryId) || [];

    // Check limit
    if (images.length >= MediaLimits.maxCategoryImages) {
      throw new Error(`Maximum ${MediaLimits.maxCategoryImages} images allowed per category`);
    }

    const timestamp = Date.now();
    const imageType = options?.imageType || 'gallery';
    const position = options?.position || images.length;

    const newImage = {
      id: `img_${timestamp}`,
      name: file.name,
      url: `https://storage.googleapis.com/mock-bucket/marketplace/mock-tenant/categories/${categoryId}/images/${imageType}/${timestamp}_${file.name}`,
      path: `marketplace/mock-tenant/categories/${categoryId}/images/${imageType}/${timestamp}_${file.name}`,
      position,
      metadata: {
        contentType: file.type,
        size: String(file.size),
        imageType,
      },
    };

    images.push(newImage);
    this.categoryImages.set(categoryId, images);

    return {
      success: true,
      image: {
        id: newImage.id,
        url: newImage.url,
        path: newImage.path,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        imageType,
        position,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  async listCategoryImages(categoryId: string): Promise<ListCategoryImagesResponse> {
    const images = this.categoryImages.get(categoryId) || [];
    return {
      success: true,
      images,
      count: images.length,
      maxAllowed: MediaLimits.maxCategoryImages,
    };
  }

  async deleteCategoryImage(path: string): Promise<ApiResponse<{ message: string }>> {
    // Find the category this image belongs to
    for (const [categoryId, images] of this.categoryImages.entries()) {
      const index = images.findIndex((img) => img.path === path);
      if (index !== -1) {
        images.splice(index, 1);
        this.categoryImages.set(categoryId, images);
        return {
          success: true,
          data: { message: 'Image deleted successfully' },
        };
      }
    }
    return {
      success: true,
      data: { message: 'Image deleted successfully' },
    };
  }

  getMaxCategoryImages(): number {
    return MediaLimits.maxCategoryImages;
  }
}

const mockService = new MockCategoryService();

/**
 * Unified category service that switches between mock and API
 */
export const categoryService = {
  getCategories: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    isActive?: boolean;
  }) => {
    if (USE_MOCK_DATA) {
      return mockService.getCategories(params);
    }
    return categoriesService.getCategories(params);
  },

  getCategoryTree: async () => {
    if (USE_MOCK_DATA) {
      return mockService.getCategoryTree();
    }
    return categoriesService.getCategoryTree();
  },

  getCategory: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getCategory(id);
    }
    return categoriesService.getCategory(id);
  },

  createCategory: async (data: CreateCategoryRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createCategory(data);
    }
    return categoriesService.createCategory(data);
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateCategory(id, data);
    }
    return categoriesService.updateCategory(id, data);
  },

  deleteCategory: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteCategory(id);
    }
    return categoriesService.deleteCategory(id);
  },

  updateCategoryStatus: async (id: string, status: string) => {
    if (USE_MOCK_DATA) {
      return mockService.updateCategoryStatus(id, status);
    }
    return categoriesService.updateCategoryStatus(id, status);
  },

  bulkDeleteCategories: async (ids: string[]) => {
    if (USE_MOCK_DATA) {
      return mockService.bulkDeleteCategories(ids);
    }
    return categoriesService.bulkDeleteCategories(ids);
  },

  bulkUpdateCategoryActiveStatus: async (ids: string[], isActive: boolean) => {
    if (USE_MOCK_DATA) {
      return mockService.bulkUpdateCategoryActiveStatus(ids, isActive);
    }
    return categoriesService.bulkUpdateCategoryActiveStatus(ids, isActive);
  },

  bulkUpdateCategoryStatus: async (ids: string[], status: string) => {
    if (USE_MOCK_DATA) {
      return mockService.bulkUpdateCategoryStatus(ids, status);
    }
    return categoriesService.bulkUpdateCategoryStatus(ids, status);
  },

  getCategoryAnalytics: async () => {
    if (USE_MOCK_DATA) {
      return mockService.getCategoryAnalytics();
    }
    return categoriesService.getCategoryAnalytics();
  },

  /**
   * Upload a category image
   */
  uploadCategoryImage: async (
    categoryId: string,
    file: File,
    options?: { imageType?: 'icon' | 'banner' | 'gallery'; position?: number }
  ) => {
    if (USE_MOCK_DATA) {
      return mockService.uploadCategoryImage(categoryId, file, options);
    }
    return categoriesService.uploadCategoryImage(categoryId, file, options);
  },

  /**
   * List all images for a category
   */
  listCategoryImages: async (categoryId: string) => {
    if (USE_MOCK_DATA) {
      return mockService.listCategoryImages(categoryId);
    }
    return categoriesService.listCategoryImages(categoryId);
  },

  /**
   * Delete a category image
   */
  deleteCategoryImage: async (path: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteCategoryImage(path);
    }
    return categoriesService.deleteCategoryImage(path);
  },

  /**
   * Get the maximum number of images allowed per category
   */
  getMaxCategoryImages: () => {
    return MediaLimits.maxCategoryImages;
  },

  /**
   * Submit a draft category for approval
   */
  submitForApproval: async (id: string) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: { approvalId: `mock-approval-${id}`, message: 'Submitted for approval' },
      };
    }
    return categoriesService.submitForApproval(id);
  },

  /**
   * Bulk submit draft categories for approval
   */
  bulkSubmitForApproval: async (categoryIds: string[]) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          submitted: categoryIds.length,
          failed: 0,
          approvalIds: categoryIds.map(id => `mock-approval-${id}`),
        },
        message: `Submitted ${categoryIds.length} category(ies) for approval`,
      };
    }
    return categoriesService.bulkSubmitForApproval(categoryIds);
  },

  isMockMode: () => USE_MOCK_DATA,
};

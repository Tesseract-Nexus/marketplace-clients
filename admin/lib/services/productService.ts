import { productsService } from '../api/products';
import { mockProducts } from '../data/mockProducts';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ApiResponse,
  ApiListResponse,
  ProductsAnalytics,
  ProductStatus,
} from '../api/types';
import type { BulkStatusUpdateResponse } from '../api/products';

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

class MockProductService {
  private products: Product[] = [...mockProducts];
  private nextId = 11;

  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    vendorId?: string;
    status?: string;
    inventoryStatus?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
  }): Promise<ApiListResponse<Product>> {
    let filtered = [...this.products];

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.brand?.toLowerCase().includes(search)
      );
    }

    if (params?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === params.categoryId);
    }

    if (params?.vendorId) {
      filtered = filtered.filter((p) => p.vendorId === params.vendorId);
    }

    if (params?.status) {
      filtered = filtered.filter((p) => p.status === params.status);
    }

    if (params?.inventoryStatus) {
      filtered = filtered.filter(
        (p) => p.inventoryStatus === params.inventoryStatus
      );
    }

    if (params?.brand) {
      filtered = filtered.filter((p) => p.brand === params.brand);
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter(
        (p) => parseFloat(p.price) >= params.minPrice!
      );
    }

    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter(
        (p) => parseFloat(p.price) <= params.maxPrice!
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
        hasNext: endIndex < filtered.length,
        hasPrevious: page > 1,
      },
    };
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return {
      success: true,
      data: product,
    };
  }

  async createProduct(
    data: CreateProductRequest
  ): Promise<ApiResponse<Product>> {
    const slug = data.slug || this.generateSlug(data.name);

    const newProduct: Product = {
      id: String(this.nextId++),
      tenantId: '00000000-0000-0000-0000-000000000001',
      vendorId: data.vendorId,
      categoryId: data.categoryId,
      createdById: 'admin-user',
      name: data.name,
      slug,
      sku: data.sku,
      brand: data.brand || undefined,
      description: data.description,
      price: data.price,
      comparePrice: data.comparePrice,
      costPrice: data.costPrice,
      status: 'DRAFT',
      inventoryStatus: 'IN_STOCK',
      quantity: data.quantity || 0,
      minOrderQty: data.minOrderQty || 1,
      maxOrderQty: data.maxOrderQty,
      lowStockThreshold: data.lowStockThreshold || 10,
      weight: data.weight,
      dimensions: data.dimensions,
      searchKeywords: data.searchKeywords,
      tags: data.tags as any,
      currencyCode: data.currencyCode || 'USD',
      attributes: data.attributes as any,
      images: data.images,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.unshift(newProduct);

    return {
      success: true,
      data: newProduct,
      message: 'Product created successfully',
    };
  }

  async updateProduct(
    id: string,
    data: UpdateProductRequest
  ): Promise<ApiResponse<Product>> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    this.products[index] = {
      ...this.products[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: this.products[index],
      message: 'Product updated successfully',
    };
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    this.products.splice(index, 1);

    return {
      success: true,
      data: undefined as any,
      message: 'Product deleted successfully',
    };
  }

  async bulkDeleteProducts(ids: string[]): Promise<ApiResponse<void>> {
    this.products = this.products.filter((p) => !ids.includes(p.id));

    return {
      success: true,
      data: undefined as any,
      message: `${ids.length} products deleted successfully`,
    };
  }

  async updateProductStatus(
    id: string,
    status: ProductStatus,
    notes?: string
  ): Promise<ApiResponse<Product>> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    this.products[index] = {
      ...this.products[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: this.products[index],
      message: `Product status updated to ${status}`,
    };
  }

  async bulkUpdateProductStatus(
    productIds: string[],
    status: ProductStatus,
    notes?: string
  ): Promise<ApiResponse<BulkStatusUpdateResponse>> {
    let updatedCount = 0;
    const failedIds: string[] = [];

    for (const id of productIds) {
      const index = this.products.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.products[index] = {
          ...this.products[index],
          status,
          updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        failedIds.push(id);
      }
    }

    return {
      success: true,
      data: {
        success: updatedCount > 0,
        updatedCount,
        failedIds: failedIds.length > 0 ? failedIds : undefined,
        message: `${updatedCount} products updated to ${status}`,
      },
    };
  }

  async getProductsAnalytics(): Promise<ApiResponse<ProductsAnalytics>> {
    const activeProducts = this.products.filter((p) => p.status === 'ACTIVE');
    const draftProducts = this.products.filter((p) => p.status === 'DRAFT');
    const outOfStock = this.products.filter(
      (p) => p.inventoryStatus === 'OUT_OF_STOCK'
    );
    const lowStock = this.products.filter(
      (p) => p.inventoryStatus === 'LOW_STOCK'
    );

    const totalInventory = this.products.reduce(
      (sum, p) => sum + (p.quantity || 0),
      0
    );
    const averagePrice =
      this.products.reduce((sum, p) => sum + parseFloat(p.price), 0) /
      this.products.length;

    return {
      success: true,
      data: {
        overview: {
          totalProducts: this.products.length,
          activeProducts: activeProducts.length,
          draftProducts: draftProducts.length,
          outOfStock: outOfStock.length,
          lowStock: lowStock.length,
          totalVariants: 0,
          averagePrice,
          totalInventory,
        },
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

const mockService = new MockProductService();

export const productService = {
  getProducts: async (params?: any) => {
    if (USE_MOCK_DATA) {
      return mockService.getProducts(params);
    }
    return productsService.getProducts(params);
  },

  getProduct: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.getProduct(id);
    }
    return productsService.getProduct(id);
  },

  createProduct: async (data: CreateProductRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.createProduct(data);
    }
    return productsService.createProduct(data);
  },

  updateProduct: async (id: string, data: UpdateProductRequest) => {
    if (USE_MOCK_DATA) {
      return mockService.updateProduct(id, data);
    }
    return productsService.updateProduct(id, data);
  },

  deleteProduct: async (id: string) => {
    if (USE_MOCK_DATA) {
      return mockService.deleteProduct(id);
    }
    return productsService.deleteProduct(id);
  },

  bulkDeleteProducts: async (ids: string[]) => {
    if (USE_MOCK_DATA) {
      return mockService.bulkDeleteProducts(ids);
    }
    return productsService.bulkDeleteProducts(ids);
  },

  getProductsAnalytics: async () => {
    if (USE_MOCK_DATA) {
      return mockService.getProductsAnalytics();
    }
    return productsService.getProductsAnalytics();
  },

  /**
   * Update status for a single product
   */
  updateProductStatus: async (id: string, status: ProductStatus, notes?: string) => {
    if (USE_MOCK_DATA) {
      return mockService.updateProductStatus(id, status, notes);
    }
    return productsService.updateProductStatus(id, status, notes);
  },

  /**
   * Bulk update status for multiple products
   */
  bulkUpdateProductStatus: async (
    productIds: string[],
    status: ProductStatus,
    notes?: string
  ) => {
    if (USE_MOCK_DATA) {
      return mockService.bulkUpdateProductStatus(productIds, status, notes);
    }
    return productsService.bulkUpdateProductStatus(productIds, status, notes);
  },

  /**
   * Submit a draft product for approval
   */
  submitForApproval: async (id: string) => {
    if (USE_MOCK_DATA) {
      // Mock implementation - just return success
      return {
        success: true,
        data: { approvalId: `mock-approval-${id}`, message: 'Submitted for approval' },
      };
    }
    return productsService.submitForApproval(id);
  },

  /**
   * Bulk submit draft products for approval
   */
  bulkSubmitForApproval: async (productIds: string[]) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          submitted: productIds.length,
          failed: 0,
          approvalIds: productIds.map(id => `mock-approval-${id}`),
        },
        message: `Submitted ${productIds.length} product(s) for approval`,
      };
    }
    return productsService.bulkSubmitForApproval(productIds);
  },

  isMockMode: () => USE_MOCK_DATA,
};

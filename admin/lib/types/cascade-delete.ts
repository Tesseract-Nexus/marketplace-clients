// Cascade Delete Types for Product Deletion

export interface CascadeDeleteOptions {
  deleteVariants: boolean;
  deleteCategory: boolean;
  deleteWarehouse: boolean;
  deleteSupplier: boolean;
}

export interface BlockedEntity {
  type: 'category' | 'warehouse' | 'supplier' | 'variants';
  id: string;
  name: string;
  reason: string;
  otherCount: number;
}

export interface AffectedSummary {
  productCount: number;
  variantCount: number;
  categoryCount: number;
  warehouseCount: number;
  supplierCount: number;
  categoryNames?: string[];
  warehouseNames?: string[];
  supplierNames?: string[];
}

export interface CascadeValidationResult {
  canDelete: boolean;
  blockedEntities: BlockedEntity[];
  affectedSummary: AffectedSummary;
}

export interface CascadeError {
  entityType: string;
  entityId: string;
  code: string;
  message: string;
}

export interface CascadeDeleteResult {
  success: boolean;
  productsDeleted: number;
  variantsDeleted: number;
  categoriesDeleted?: string[];
  warehousesDeleted?: string[];
  suppliersDeleted?: string[];
  errors?: CascadeError[];
  partialSuccess: boolean;
}

export interface CascadeValidationRequest {
  options: CascadeDeleteOptions;
}

export interface BulkCascadeDeleteRequest {
  ids: string[];
  options: CascadeDeleteOptions;
}

// Default options factory
export const getDefaultCascadeOptions = (): CascadeDeleteOptions => ({
  deleteVariants: true,
  deleteCategory: false,
  deleteWarehouse: false,
  deleteSupplier: false,
});

import { apiClient } from './client';
import type { ApiResponse, ApiListResponse } from './types';

// Use the singleton apiClient to ensure tenant context is shared

// Types for Inventory
export interface Warehouse {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  managerName?: string;
  logoUrl?: string;
  isDefault: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  minOrderValue?: number;
  currencyCode?: string;
  rating?: number;
  totalOrders: number;
  totalSpent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  supplierId: string;
  warehouseId: string;
  supplier?: Supplier;
  warehouse?: Warehouse;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currencyCode: string;
  notes?: string;
  paymentTerms?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  variantId?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
  notes?: string;
}

export interface InventoryTransfer {
  id: string;
  tenantId: string;
  transferNumber: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  fromWarehouseId: string;
  toWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  requestedBy?: string;
  approvedBy?: string;
  completedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  shippedAt?: string;
  completedAt?: string;
  notes?: string;
  items: InventoryTransferItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransferItem {
  id: string;
  transferId: string;
  productId: string;
  variantId?: string;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  notes?: string;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string;
  email?: string;
  managerName?: string;
  logoUrl?: string;
  isDefault?: boolean;
  priority?: number;
}

export interface CreateSupplierRequest {
  code: string;
  name: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  notes?: string;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  warehouseId: string;
  expectedDate?: string;
  notes?: string;
  paymentTerms?: string;
  shippingMethod?: string;
  items: {
    productId: string;
    variantId?: string;
    quantityOrdered: number;
    unitCost: number;
    notes?: string;
  }[];
}

export interface CreateInventoryTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  notes?: string;
  items: {
    productId: string;
    variantId?: string;
    quantityRequested: number;
    notes?: string;
  }[];
}

// Warehouse Service
export class WarehousesService {
  async getWarehouses(params?: { status?: string }): Promise<ApiListResponse<Warehouse>> {
    return apiClient.get<ApiListResponse<Warehouse>>('/inventory/warehouses', params);
  }

  async getWarehouse(id: string): Promise<ApiResponse<Warehouse>> {
    return apiClient.get<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`);
  }

  async createWarehouse(data: CreateWarehouseRequest): Promise<ApiResponse<Warehouse>> {
    return apiClient.post<ApiResponse<Warehouse>>('/inventory/warehouses', data);
  }

  async updateWarehouse(id: string, data: Partial<CreateWarehouseRequest>): Promise<ApiResponse<Warehouse>> {
    return apiClient.put<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`, data);
  }

  async deleteWarehouse(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/inventory/warehouses/${id}`);
  }
}

// Supplier Service
export class SuppliersService {
  async getSuppliers(params?: { status?: string }): Promise<ApiListResponse<Supplier>> {
    return apiClient.get<ApiListResponse<Supplier>>('/inventory/suppliers', params);
  }

  async getSupplier(id: string): Promise<ApiResponse<Supplier>> {
    return apiClient.get<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`);
  }

  async createSupplier(data: CreateSupplierRequest): Promise<ApiResponse<Supplier>> {
    return apiClient.post<ApiResponse<Supplier>>('/inventory/suppliers', data);
  }

  async updateSupplier(id: string, data: Partial<CreateSupplierRequest>): Promise<ApiResponse<Supplier>> {
    return apiClient.put<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`, data);
  }

  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/inventory/suppliers/${id}`);
  }
}

// Purchase Order Service
export class PurchaseOrdersService {
  async getPurchaseOrders(params?: { status?: string }): Promise<ApiListResponse<PurchaseOrder>> {
    return apiClient.get<ApiListResponse<PurchaseOrder>>('/inventory/purchase-orders', params);
  }

  async getPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.get<ApiResponse<PurchaseOrder>>(`/inventory/purchase-orders/${id}`);
  }

  async createPurchaseOrder(data: CreatePurchaseOrderRequest): Promise<ApiResponse<PurchaseOrder>> {
    return apiClient.post<ApiResponse<PurchaseOrder>>('/inventory/purchase-orders', data);
  }

  async updatePurchaseOrderStatus(id: string, status: string): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(`/inventory/purchase-orders/${id}/status`, { status });
  }

  async receivePurchaseOrder(id: string, receivedItems: Record<string, number>): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(`/inventory/purchase-orders/${id}/receive`, { receivedItems });
  }
}

// Inventory Transfer Service
export class TransfersService {
  async getTransfers(params?: { status?: string }): Promise<ApiListResponse<InventoryTransfer>> {
    return apiClient.get<ApiListResponse<InventoryTransfer>>('/inventory/transfers', params);
  }

  async getTransfer(id: string): Promise<ApiResponse<InventoryTransfer>> {
    return apiClient.get<ApiResponse<InventoryTransfer>>(`/inventory/transfers/${id}`);
  }

  async createTransfer(data: CreateInventoryTransferRequest): Promise<ApiResponse<InventoryTransfer>> {
    return apiClient.post<ApiResponse<InventoryTransfer>>('/inventory/transfers', data);
  }

  async updateTransferStatus(id: string, status: string): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(`/inventory/transfers/${id}/status`, { status });
  }

  async completeTransfer(id: string, receivedItems?: Record<string, number>): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(`/inventory/transfers/${id}/complete`, { receivedItems });
  }
}

export const warehousesService = new WarehousesService();
export const suppliersService = new SuppliersService();
export const purchaseOrdersService = new PurchaseOrdersService();
export const transfersService = new TransfersService();

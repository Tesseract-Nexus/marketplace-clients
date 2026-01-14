import {
  warehousesService,
  suppliersService,
  purchaseOrdersService,
  transfersService,
  type Warehouse,
  type Supplier,
  type PurchaseOrder,
  type InventoryTransfer,
  type CreateWarehouseRequest,
  type CreateSupplierRequest,
  type CreatePurchaseOrderRequest,
  type CreateInventoryTransferRequest,
} from '../api/inventory';

export const inventoryService = {
  // Warehouses
  getWarehouses: async (params?: { status?: string }) => {
    return warehousesService.getWarehouses(params);
  },

  getWarehouse: async (id: string) => {
    return warehousesService.getWarehouse(id);
  },

  createWarehouse: async (data: CreateWarehouseRequest) => {
    return warehousesService.createWarehouse(data);
  },

  updateWarehouse: async (id: string, data: Partial<CreateWarehouseRequest>) => {
    return warehousesService.updateWarehouse(id, data);
  },

  deleteWarehouse: async (id: string) => {
    return warehousesService.deleteWarehouse(id);
  },

  // Suppliers
  getSuppliers: async (params?: { status?: string }) => {
    return suppliersService.getSuppliers(params);
  },

  getSupplier: async (id: string) => {
    return suppliersService.getSupplier(id);
  },

  createSupplier: async (data: CreateSupplierRequest) => {
    return suppliersService.createSupplier(data);
  },

  updateSupplier: async (id: string, data: Partial<CreateSupplierRequest>) => {
    return suppliersService.updateSupplier(id, data);
  },

  deleteSupplier: async (id: string) => {
    return suppliersService.deleteSupplier(id);
  },

  // Purchase Orders
  getPurchaseOrders: async (params?: { status?: string }) => {
    return purchaseOrdersService.getPurchaseOrders(params);
  },

  getPurchaseOrder: async (id: string) => {
    return purchaseOrdersService.getPurchaseOrder(id);
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderRequest) => {
    return purchaseOrdersService.createPurchaseOrder(data);
  },

  updatePurchaseOrderStatus: async (id: string, status: string) => {
    return purchaseOrdersService.updatePurchaseOrderStatus(id, status);
  },

  receivePurchaseOrder: async (id: string, receivedItems: Record<string, number>) => {
    return purchaseOrdersService.receivePurchaseOrder(id, receivedItems);
  },

  // Transfers
  getTransfers: async (params?: { status?: string }) => {
    return transfersService.getTransfers(params);
  },

  getTransfer: async (id: string) => {
    return transfersService.getTransfer(id);
  },

  createTransfer: async (data: CreateInventoryTransferRequest) => {
    return transfersService.createTransfer(data);
  },

  updateTransferStatus: async (id: string, status: string) => {
    return transfersService.updateTransferStatus(id, status);
  },

  completeTransfer: async (id: string, receivedItems?: Record<string, number>) => {
    return transfersService.completeTransfer(id, receivedItems);
  },
};

export type {
  Warehouse,
  Supplier,
  PurchaseOrder,
  InventoryTransfer,
  CreateWarehouseRequest,
  CreateSupplierRequest,
  CreatePurchaseOrderRequest,
  CreateInventoryTransferRequest,
};

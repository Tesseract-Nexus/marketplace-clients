'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Plus,
  Search,
  Warehouse,
  Users,
  Package,
  Truck,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  FileUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  Eye,
  Save,
  X,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageLoading } from '@/components/common';
import { TableSkeleton, ListSkeleton } from '@/components/ui/table-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { inventoryService } from '@/lib/services/inventoryService';
import { productsService } from '@/lib/api/products';
import type {
  Warehouse as WarehouseType,
  Supplier,
  PurchaseOrder,
  InventoryTransfer,
  CreateWarehouseRequest,
  CreateSupplierRequest,
  CreatePurchaseOrderRequest,
  CreateInventoryTransferRequest,
} from '@/lib/services/inventoryService';
import type { Product, InventoryStatus } from '@/lib/api/types';
import { BulkImportModal } from '@/components/BulkImportModal';
import { Select } from '@/components/Select';
import { Checkbox } from '@/components/ui/checkbox';
import { WarehouseLogoUploader, MediaItem } from '@/components/MediaUploader';
import { DefaultMediaURLs } from '@/lib/api/types';

// Form mode types (inline forms instead of modals)
type FormMode = 'create' | 'edit' | null;
type EntityType = 'warehouse' | 'supplier' | 'purchase-order' | 'transfer';
type DeleteModalType = { entityType: EntityType; id: string } | null;

// Form state types
interface WarehouseFormData {
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  managerName: string;
  logoUrl: string;
  isDefault: boolean;
  priority: number;
}

interface SupplierFormData {
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  contactName: string;
  email: string;
  phone: string;
  website: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentTerms: string;
  leadTimeDays: number;
  notes: string;
}

interface PurchaseOrderFormItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrderFormData {
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  currencyCode: string;
  notes: string;
  items: PurchaseOrderFormItem[];
}

interface TransferFormItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

interface TransferFormData {
  fromWarehouseId: string;
  toWarehouseId: string;
  notes: string;
  items: TransferFormItem[];
}

const initialWarehouseForm: WarehouseFormData = {
  code: '',
  name: '',
  status: 'ACTIVE',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
  email: '',
  managerName: '',
  logoUrl: '',
  isDefault: false,
  priority: 1,
};

const initialSupplierForm: SupplierFormData = {
  code: '',
  name: '',
  status: 'ACTIVE',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  address1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  paymentTerms: 'Net 30',
  leadTimeDays: 7,
  notes: '',
};

const initialPurchaseOrderForm: PurchaseOrderFormData = {
  supplierId: '',
  warehouseId: '',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '',
  currencyCode: 'USD',
  notes: '',
  items: [],
};

const initialTransferForm: TransferFormData = {
  fromWarehouseId: '',
  toWarehouseId: '',
  notes: '',
  items: [],
};

type TabType = 'stock-levels' | 'warehouses' | 'suppliers' | 'purchase-orders' | 'transfers';

// Stock level filter type
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

// Auto-refresh interval (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

export default function InventoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params?.slug as string;
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'stock-levels');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Stock levels state
  const [products, setProducts] = useState<Product[]>([]);
  const [stockFilter, setStockFilter] = useState<StockFilter>((searchParams.get('stock') as StockFilter) || 'all');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [savingStock, setSavingStock] = useState(false);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);

  // Inline form state (replaces modals)
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formEntityType, setFormEntityType] = useState<EntityType>('warehouse');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [savingEntity, setSavingEntity] = useState(false);
  const [deletingEntityId, setDeletingEntityId] = useState<string | null>(null);

  // Form state
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormData>(initialWarehouseForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormData>(initialSupplierForm);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState<PurchaseOrderFormData>(initialPurchaseOrderForm);
  const [transferForm, setTransferForm] = useState<TransferFormData>(initialTransferForm);

  // Inline form handlers (replaces modal handlers)
  const openCreateForm = (entityType: EntityType) => {
    setFormEntityType(entityType);
    setFormMode('create');
    setSelectedEntityId(null);
    if (entityType === 'warehouse') {
      setWarehouseForm(initialWarehouseForm);
    } else if (entityType === 'supplier') {
      setSupplierForm(initialSupplierForm);
    } else if (entityType === 'purchase-order') {
      setPurchaseOrderForm({
        ...initialPurchaseOrderForm,
        orderDate: new Date().toISOString().split('T')[0],
      });
    } else if (entityType === 'transfer') {
      setTransferForm(initialTransferForm);
    }
  };

  const openEditForm = (entityType: EntityType, id: string) => {
    setFormEntityType(entityType);
    setFormMode('edit');
    setSelectedEntityId(id);

    if (entityType === 'warehouse') {
      const warehouse = warehouses.find(w => w.id === id);
      if (warehouse) {
        setWarehouseForm({
          code: warehouse.code,
          name: warehouse.name,
          status: warehouse.status,
          address1: warehouse.address1,
          address2: warehouse.address2 || '',
          city: warehouse.city,
          state: warehouse.state,
          postalCode: warehouse.postalCode,
          country: warehouse.country,
          phone: warehouse.phone || '',
          email: warehouse.email || '',
          managerName: warehouse.managerName || '',
          logoUrl: warehouse.logoUrl || '',
          isDefault: warehouse.isDefault,
          priority: warehouse.priority,
        });
      }
    } else if (entityType === 'supplier') {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) {
        setSupplierForm({
          code: supplier.code,
          name: supplier.name,
          status: supplier.status,
          contactName: supplier.contactName || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          website: supplier.website || '',
          address1: supplier.address1 || '',
          city: supplier.city || '',
          state: supplier.state || '',
          postalCode: supplier.postalCode || '',
          country: supplier.country || 'US',
          paymentTerms: supplier.paymentTerms || 'Net 30',
          leadTimeDays: supplier.leadTimeDays || 7,
          notes: supplier.notes || '',
        });
      }
    }
  };

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModalType>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const openDeleteModal = (entityType: EntityType, id: string) => {
    setDeleteModal({ entityType, id });
    setDeleteConfirmName('');
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteConfirmName('');
  };

  const closeForm = () => {
    setFormMode(null);
    setSelectedEntityId(null);
  };

  // Helper: Convert URL string to MediaItem[] for the uploader
  const urlToMediaItems = (url: string): MediaItem[] => {
    if (!url) return [];
    return [{
      id: 'existing-1',
      url,
      position: 0,
    }];
  };

  const getEntityName = (entityType: EntityType, id: string): string => {
    if (entityType === 'warehouse') {
      return warehouses.find(w => w.id === id)?.name || '';
    } else if (entityType === 'supplier') {
      return suppliers.find(s => s.id === id)?.name || '';
    } else if (entityType === 'purchase-order') {
      return purchaseOrders.find(p => p.id === id)?.poNumber || '';
    } else if (entityType === 'transfer') {
      return transfers.find(t => t.id === id)?.transferNumber || '';
    }
    return '';
  };

  const handleSaveWarehouse = async () => {
    setSavingEntity(true);
    try {
      const data: CreateWarehouseRequest = {
        code: warehouseForm.code,
        name: warehouseForm.name,
        status: warehouseForm.status,
        address1: warehouseForm.address1,
        address2: warehouseForm.address2 || undefined,
        city: warehouseForm.city,
        state: warehouseForm.state,
        postalCode: warehouseForm.postalCode,
        country: warehouseForm.country || 'US',
        phone: warehouseForm.phone || undefined,
        email: warehouseForm.email || undefined,
        managerName: warehouseForm.managerName || undefined,
        logoUrl: warehouseForm.logoUrl || undefined,
        isDefault: warehouseForm.isDefault,
        priority: warehouseForm.priority,
      };

      if (formMode === 'create') {
        const result = await inventoryService.createWarehouse(data);
        if (result.success && result.data) {
          setWarehouses(prev => [...prev, result.data!]);
          toast.success('Warehouse Created', 'Warehouse has been created successfully');
        }
      } else if (formMode === 'edit' && selectedEntityId) {
        const result = await inventoryService.updateWarehouse(selectedEntityId, data);
        if (result.success && result.data) {
          setWarehouses(prev => prev.map(w => w.id === selectedEntityId ? result.data! : w));
          toast.success('Warehouse Updated', 'Warehouse has been updated successfully');
        }
      }
      closeForm();
    } catch (err) {
      console.error('Error saving warehouse:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to save warehouse';
      toast.error('Failed to Save Warehouse', errorMsg);
    } finally {
      setSavingEntity(false);
    }
  };

  const handleSaveSupplier = async () => {
    setSavingEntity(true);
    try {
      const data: CreateSupplierRequest = {
        code: supplierForm.code,
        name: supplierForm.name,
        status: supplierForm.status,
        contactName: supplierForm.contactName || undefined,
        email: supplierForm.email || undefined,
        phone: supplierForm.phone || undefined,
        website: supplierForm.website || undefined,
        address1: supplierForm.address1 || undefined,
        city: supplierForm.city || undefined,
        state: supplierForm.state || undefined,
        postalCode: supplierForm.postalCode || undefined,
        country: supplierForm.country || 'US',
        paymentTerms: supplierForm.paymentTerms || undefined,
        leadTimeDays: supplierForm.leadTimeDays || undefined,
        notes: supplierForm.notes || undefined,
      };

      if (formMode === 'create') {
        const result = await inventoryService.createSupplier(data);
        if (result.success && result.data) {
          setSuppliers(prev => [...prev, result.data!]);
          toast.success('Supplier Created', 'Supplier has been created successfully');
        }
      } else if (formMode === 'edit' && selectedEntityId) {
        const result = await inventoryService.updateSupplier(selectedEntityId, data);
        if (result.success && result.data) {
          setSuppliers(prev => prev.map(s => s.id === selectedEntityId ? result.data! : s));
          toast.success('Supplier Updated', 'Supplier has been updated successfully');
        }
      }
      closeForm();
    } catch (err) {
      console.error('Error saving supplier:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to save supplier';
      toast.error('Failed to Save Supplier', errorMsg);
    } finally {
      setSavingEntity(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    const { entityType, id } = deleteModal;
    const entityName = getEntityName(entityType, id);
    if (deleteConfirmName !== entityName) {
      return;
    }

    setDeletingEntityId(id);
    try {
      if (entityType === 'warehouse') {
        const result = await inventoryService.deleteWarehouse(id);
        if (result.success) {
          setWarehouses(prev => prev.filter(w => w.id !== id));
          toast.success('Warehouse Deleted', 'Warehouse has been deleted successfully');
        }
      } else if (entityType === 'supplier') {
        const result = await inventoryService.deleteSupplier(id);
        if (result.success) {
          setSuppliers(prev => prev.filter(s => s.id !== id));
          toast.success('Supplier Deleted', 'Supplier has been deleted successfully');
        }
      }
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting entity:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete';
      toast.error('Failed to Delete', errorMsg);
    } finally {
      setDeletingEntityId(null);
    }
  };

  const handleUpdatePOStatus = async (id: string, status: string) => {
    try {
      const result = await inventoryService.updatePurchaseOrderStatus(id, status);
      if (result.success) {
        setPurchaseOrders(prev => prev.map(po =>
          po.id === id ? { ...po, status: status as PurchaseOrder['status'] } : po
        ));
        toast.success('Purchase Order Updated', 'Purchase order status has been updated successfully');
      }
    } catch (err) {
      console.error('Error updating PO status:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update purchase order status';
      toast.error('Failed to Update', errorMsg);
    }
  };

  const handleUpdateTransferStatus = async (id: string, status: string) => {
    try {
      if (status === 'COMPLETED') {
        const result = await inventoryService.completeTransfer(id);
        if (result.success) {
          setTransfers(prev => prev.map(t =>
            t.id === id ? { ...t, status: 'COMPLETED' as InventoryTransfer['status'] } : t
          ));
          toast.success('Transfer Completed', 'Inventory transfer has been completed successfully');
        }
      } else {
        const result = await inventoryService.updateTransferStatus(id, status);
        if (result.success) {
          setTransfers(prev => prev.map(t =>
            t.id === id ? { ...t, status: status as InventoryTransfer['status'] } : t
          ));
          toast.success('Transfer Updated', 'Transfer status has been updated successfully');
        }
      }
    } catch (err) {
      console.error('Error updating transfer status:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update transfer status';
      toast.error('Failed to Update', errorMsg);
    }
  };

  // Fetch products for stock levels
  const fetchProducts = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const productsRes = await productsService.getProducts({ limit: 1000 });
      if (productsRes.success) {
        setProducts(productsRes.data || []);
      }
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error fetching products:', err);
      if (showLoading) {
        setError(err.message || 'Failed to load products');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [warehousesRes, suppliersRes, purchaseOrdersRes, transfersRes] = await Promise.all([
        inventoryService.getWarehouses(),
        inventoryService.getSuppliers(),
        inventoryService.getPurchaseOrders(),
        inventoryService.getTransfers(),
      ]);

      if (warehousesRes.success) {
        setWarehouses(warehousesRes.data || []);
      }
      if (suppliersRes.success) {
        setSuppliers(suppliersRes.data || []);
      }
      if (purchaseOrdersRes.success) {
        setPurchaseOrders(purchaseOrdersRes.data || []);
      }
      if (transfersRes.success) {
        setTransfers(transfersRes.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh for stock levels
  useEffect(() => {
    if (activeTab === 'stock-levels' && autoRefreshEnabled && !editingProductId) {
      autoRefreshRef.current = setInterval(() => {
        fetchProducts(false);
      }, AUTO_REFRESH_INTERVAL);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, [activeTab, autoRefreshEnabled, editingProductId, fetchProducts]);

  // URL routing - sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['stock-levels', 'warehouses', 'suppliers', 'purchase-orders', 'transfers'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL params helper
  const updateUrlParams = useCallback((params: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      // Only set non-default values
      if (value && value !== 'all' && value !== 'stock-levels') {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Navigate to tab with URL update
  const navigateToTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    updateUrlParams({ tab, q: searchQuery, stock: stockFilter });
  }, [updateUrlParams, searchQuery, stockFilter]);

  // Sync search and filter to URL when they change
  useEffect(() => {
    if (loading) return;
    updateUrlParams({ tab: activeTab, q: searchQuery, stock: stockFilter });
  }, [searchQuery, stockFilter, activeTab, loading, updateUrlParams]);

  // Load data on mount and when tenant changes
  useEffect(() => {
    // Don't fetch if tenant is still loading or not set
    if (tenantLoading || !currentTenant) {
      return;
    }

    // Reset state when tenant changes
    setProducts([]);
    setWarehouses([]);
    setSuppliers([]);
    setPurchaseOrders([]);
    setTransfers([]);
    setError(null);

    // Fetch products for stock levels (default tab)
    fetchProducts();
    fetchData();
  }, [tenantSlug, currentTenant?.id, tenantLoading, fetchProducts, fetchData]);

  // Handle stock quantity update
  const handleSaveStock = async (productId: string) => {
    setSavingStock(true);
    try {
      const result = await productsService.updateProduct(productId, {
        quantity: editQuantity,
      });
      if (result.success) {
        // Update local state
        setProducts(prev => prev.map(p =>
          p.id === productId
            ? { ...p, quantity: editQuantity, inventoryStatus: getInventoryStatus(editQuantity, p.lowStockThreshold) }
            : p
        ));
        setEditingProductId(null);
        toast.success('Inventory Updated', 'Stock levels have been updated successfully');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update inventory';
      toast.error('Failed to Update', errorMsg);
    } finally {
      setSavingStock(false);
    }
  };

  // Calculate inventory status based on quantity
  const getInventoryStatus = (quantity: number | undefined, threshold: number | undefined): InventoryStatus => {
    const qty = quantity || 0;
    const lowThreshold = threshold || 10;
    if (qty === 0) return 'OUT_OF_STOCK';
    if (qty <= lowThreshold) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  // Calculate stock statistics
  const stockStats = React.useMemo(() => {
    const inStock = products.filter(p => (p.quantity || 0) > (p.lowStockThreshold || 10)).length;
    const lowStock = products.filter(p => {
      const qty = p.quantity || 0;
      const threshold = p.lowStockThreshold || 10;
      return qty > 0 && qty <= threshold;
    }).length;
    const outOfStock = products.filter(p => (p.quantity || 0) === 0).length;
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

    return { inStock, lowStock, outOfStock, totalQuantity, total: products.length };
  }, [products]);

  const getInventoryStatusType = (status: string): StatusType => {
    const mapping: Record<string, StatusType> = {
      ACTIVE: 'success',
      INACTIVE: 'neutral',
      CLOSED: 'error',
      BLACKLISTED: 'error',
      DRAFT: 'neutral',
      SUBMITTED: 'info',
      APPROVED: 'info',
      ORDERED: 'warning',
      RECEIVED: 'success',
      CANCELLED: 'error',
      PENDING: 'neutral',
      IN_TRANSIT: 'info',
      COMPLETED: 'success',
    };
    return mapping[status] || 'neutral';
  };

  const getStatusBadgeClass = (status: string) => {
    // Legacy function - kept for backward compatibility
    const classes: Record<string, string> = {
      ACTIVE: 'bg-success-muted text-success-muted-foreground border-transparent',
      INACTIVE: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
      CLOSED: 'bg-error-muted text-error-muted-foreground border-transparent',
      BLACKLISTED: 'bg-error-muted text-error-muted-foreground border-transparent',
      DRAFT: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
      SUBMITTED: 'bg-info-muted text-info-muted-foreground border-transparent',
      APPROVED: 'bg-info-muted text-info-muted-foreground border-transparent',
      ORDERED: 'bg-warning-muted text-warning-muted-foreground border-transparent',
      RECEIVED: 'bg-success-muted text-success-muted-foreground border-transparent',
      CANCELLED: 'bg-error-muted text-error-muted-foreground border-transparent',
      PENDING: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
      IN_TRANSIT: 'bg-info-muted text-info-muted-foreground border-transparent',
      COMPLETED: 'bg-success-muted text-success-muted-foreground border-transparent',
    };
    return classes[status] || classes.ACTIVE;
  };

  // Filter products based on search and stock filter
  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    // Stock filter
    const qty = product.quantity || 0;
    const threshold = product.lowStockThreshold || 10;
    let matchesStockFilter = true;

    if (stockFilter === 'in_stock') {
      matchesStockFilter = qty > threshold;
    } else if (stockFilter === 'low_stock') {
      matchesStockFilter = qty > 0 && qty <= threshold;
    } else if (stockFilter === 'out_of_stock') {
      matchesStockFilter = qty === 0;
    }

    return matchesSearch && matchesStockFilter;
  });

  const filteredWarehouses = warehouses.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (sup) =>
      sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sup.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurchaseOrders = purchaseOrders.filter((po) =>
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransfers = transfers.filter((tr) =>
    tr.transferNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get stock status info for display
  const getStockStatusInfo = (product: Product) => {
    const qty = product.quantity || 0;
    const threshold = product.lowStockThreshold || 10;

    if (qty === 0) {
      return {
        label: 'Out of Stock',
        color: 'bg-error-muted text-error-muted-foreground border-transparent',
        icon: XCircle,
        trend: 'critical',
      };
    }
    if (qty <= threshold) {
      return {
        label: 'Low Stock',
        color: 'bg-warning-muted text-warning-muted-foreground border-transparent',
        icon: AlertTriangle,
        trend: 'warning',
      };
    }
    return {
      label: 'In Stock',
      color: 'bg-success-muted text-success-muted-foreground border-transparent',
      icon: CheckCircle,
      trend: 'good',
    };
  };

  return (
    <PermissionGate
      permission={Permission.INVENTORY_READ}
      fallback="styled"
      fallbackTitle="Inventory Access Required"
      fallbackDescription="You don't have the required permissions to view inventory. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Inventory Management"
          description="Manage warehouses, suppliers, purchase orders, and transfers"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Catalog', href: '/products' },
            { label: 'Inventory' },
          ]}
        />

        <div className="flex gap-6">
          {/* Sidebar with Stats - Always Visible */}
          <div className="w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Inventory Health Widget */}
              <div className={cn(
                "rounded-lg border p-3",
                stockStats.outOfStock === 0 ? "bg-success/5 border-success/20" :
                stockStats.outOfStock > 5 ? "bg-error/5 border-error/20" : "bg-warning/5 border-warning/20"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-medium",
                    stockStats.outOfStock === 0 ? "text-success" :
                    stockStats.outOfStock > 5 ? "text-error" : "text-warning"
                  )}>
                    {stockStats.outOfStock === 0 ? 'Healthy' : stockStats.outOfStock > 5 ? 'Critical' : 'Attention'}
                  </span>
                  <span className="text-xs text-muted-foreground">{stockStats.inStock}/{stockStats.total}</span>
                </div>
                <div className="flex gap-1">
                  <div className="flex-1 h-1 rounded-full bg-success" style={{ width: `${(stockStats.inStock / Math.max(stockStats.total, 1)) * 100}%` }} />
                  <div className="flex-1 h-1 rounded-full bg-warning" style={{ width: `${(stockStats.lowStock / Math.max(stockStats.total, 1)) * 100}%` }} />
                  <div className="flex-1 h-1 rounded-full bg-error" style={{ width: `${(stockStats.outOfStock / Math.max(stockStats.total, 1)) * 100}%` }} />
                </div>
              </div>

              {/* Stock Stats */}
              <div className="bg-card rounded-lg border border-border p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock Overview</p>
                <button
                  onClick={() => { navigateToTab('stock-levels'); setStockFilter('all'); }}
                  className="w-full flex justify-between items-center text-sm hover:bg-muted p-1.5 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    Total Products
                  </span>
                  <span className="font-semibold">{stockStats.total}</span>
                </button>
                <button
                  onClick={() => { navigateToTab('stock-levels'); setStockFilter('in_stock'); }}
                  className="w-full flex justify-between items-center text-sm hover:bg-muted p-1.5 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-3.5 w-3.5" />
                    In Stock
                  </span>
                  <span className="font-semibold text-success">{stockStats.inStock}</span>
                </button>
                <button
                  onClick={() => { navigateToTab('stock-levels'); setStockFilter('low_stock'); }}
                  className="w-full flex justify-between items-center text-sm hover:bg-muted p-1.5 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Low Stock
                  </span>
                  <span className="font-semibold text-warning">{stockStats.lowStock}</span>
                </button>
                <button
                  onClick={() => { navigateToTab('stock-levels'); setStockFilter('out_of_stock'); }}
                  className="w-full flex justify-between items-center text-sm hover:bg-muted p-1.5 rounded transition-colors"
                >
                  <span className="flex items-center gap-2 text-error">
                    <XCircle className="h-3.5 w-3.5" />
                    Out of Stock
                  </span>
                  <span className="font-semibold text-error">{stockStats.outOfStock}</span>
                </button>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Total Qty
                    </span>
                    <span className="font-semibold text-primary">{stockStats.totalQuantity.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Entity Stats */}
              <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</p>
                <button
                  onClick={() => navigateToTab('warehouses')}
                  className={cn(
                    "w-full flex justify-between items-center text-sm p-1.5 rounded transition-colors",
                    activeTab === 'warehouses' ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Warehouse className="h-3.5 w-3.5" />
                    Warehouses
                  </span>
                  <span className="font-medium">{warehouses.length}</span>
                </button>
                <button
                  onClick={() => navigateToTab('suppliers')}
                  className={cn(
                    "w-full flex justify-between items-center text-sm p-1.5 rounded transition-colors",
                    activeTab === 'suppliers' ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Suppliers
                  </span>
                  <span className="font-medium">{suppliers.length}</span>
                </button>
                <button
                  onClick={() => navigateToTab('purchase-orders')}
                  className={cn(
                    "w-full flex justify-between items-center text-sm p-1.5 rounded transition-colors",
                    activeTab === 'purchase-orders' ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" />
                    Purchase Orders
                  </span>
                  <span className="font-medium">{purchaseOrders.length}</span>
                </button>
                <button
                  onClick={() => navigateToTab('transfers')}
                  className={cn(
                    "w-full flex justify-between items-center text-sm p-1.5 rounded transition-colors",
                    activeTab === 'transfers' ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5" />
                    Transfers
                  </span>
                  <span className="font-medium">{transfers.length}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <div className="flex-1 min-w-0">
            {/* Mobile Stats Row */}
            <div className="lg:hidden mb-4 grid grid-cols-4 gap-2">
              <button
                onClick={() => { navigateToTab('stock-levels'); setStockFilter('in_stock'); }}
                className="bg-card rounded-lg border border-border p-2 text-center"
              >
                <p className="text-lg font-bold text-success">{stockStats.inStock}</p>
                <p className="text-[10px] text-muted-foreground">In Stock</p>
              </button>
              <button
                onClick={() => { navigateToTab('stock-levels'); setStockFilter('low_stock'); }}
                className="bg-card rounded-lg border border-border p-2 text-center"
              >
                <p className="text-lg font-bold text-warning">{stockStats.lowStock}</p>
                <p className="text-[10px] text-muted-foreground">Low</p>
              </button>
              <button
                onClick={() => { navigateToTab('stock-levels'); setStockFilter('out_of_stock'); }}
                className="bg-card rounded-lg border border-border p-2 text-center"
              >
                <p className="text-lg font-bold text-error">{stockStats.outOfStock}</p>
                <p className="text-[10px] text-muted-foreground">Out</p>
              </button>
              <div className="bg-card rounded-lg border border-border p-2 text-center">
                <p className="text-lg font-bold text-primary">{warehouses.length}</p>
                <p className="text-[10px] text-muted-foreground">Warehouses</p>
              </div>
            </div>

            {/* Mobile Tab Selector */}
            <div className="md:hidden mb-4">
              <Select
                value={activeTab}
                onChange={(value) => navigateToTab(value as TabType)}
                options={[
                  { value: 'stock-levels', label: `Stock Levels (${products.length})` },
                  { value: 'warehouses', label: `Warehouses (${warehouses.length})` },
                  { value: 'suppliers', label: `Suppliers (${suppliers.length})` },
                  { value: 'purchase-orders', label: `Purchase Orders (${purchaseOrders.length})` },
                  { value: 'transfers', label: `Transfers (${transfers.length})` },
                ]}
              />
            </div>

            {/* Desktop Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => navigateToTab(v as TabType)}>
              <TabsList className="hidden md:inline-flex h-auto items-center justify-start rounded-xl bg-card border border-border p-1 shadow-sm mb-6">
                <TabsTrigger value="stock-levels" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BarChart3 className="h-4 w-4" />
                  Stock
                  <span className="text-xs opacity-70">({products.length})</span>
                </TabsTrigger>
                <TabsTrigger value="warehouses" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Warehouse className="h-4 w-4" />
                  Warehouses
                  <span className="text-xs opacity-70">({warehouses.length})</span>
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="h-4 w-4" />
                  Suppliers
                  <span className="text-xs opacity-70">({suppliers.length})</span>
                </TabsTrigger>
                <TabsTrigger value="purchase-orders" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Package className="h-4 w-4" />
                  POs
                  <span className="text-xs opacity-70">({purchaseOrders.length})</span>
                </TabsTrigger>
                <TabsTrigger value="transfers" className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Truck className="h-4 w-4" />
                  Transfers
                  <span className="text-xs opacity-70">({transfers.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Search and Actions Bar */}
              <div className="mt-4 p-4 bg-card rounded-lg border border-border">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={activeTab === 'stock-levels' ? 'Search products by name, SKU, or brand...' : `Search ${activeTab}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Stock level specific filters */}
                  {activeTab === 'stock-levels' && (
                    <>
                      <Select
                        value={stockFilter}
                        onChange={(value) => setStockFilter(value as StockFilter)}
                        options={[
                          { value: 'all', label: 'All Stock' },
                          { value: 'in_stock', label: 'In Stock' },
                          { value: 'low_stock', label: 'Low Stock' },
                          { value: 'out_of_stock', label: 'Out of Stock' },
                        ]}
                        className="w-40"
                      />

                      <Checkbox
                        checked={autoRefreshEnabled}
                        onCheckedChange={(checked) => setAutoRefreshEnabled(checked)}
                        label="Auto-refresh"
                      />

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{lastRefresh.toLocaleTimeString()}</span>
                      </div>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    onClick={() => activeTab === 'stock-levels' ? fetchProducts() : fetchData()}
                    disabled={loading}
                    className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
                    title="Refresh"
                  >
                    <RefreshCw className={cn('w-5 h-5 text-muted-foreground', loading && 'animate-spin')} />
                  </Button>

                  {(activeTab === 'warehouses' || activeTab === 'suppliers') && (
                    <PermissionGate
                      permission={
                        activeTab === 'warehouses'
                          ? Permission.INVENTORY_WAREHOUSES_MANAGE
                          : Permission.INVENTORY_ADJUST
                      }
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkImport(true)}
                        className="border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </PermissionGate>
                  )}

                  {activeTab !== 'stock-levels' && (
                    <PermissionGate
                      permission={
                        activeTab === 'warehouses'
                          ? Permission.INVENTORY_WAREHOUSES_MANAGE
                          : activeTab === 'transfers'
                            ? Permission.INVENTORY_TRANSFERS_MANAGE
                            : Permission.INVENTORY_ADJUST
                      }
                    >
                      <Button
                        size="sm"
                        onClick={() => {
                          if (activeTab === 'warehouses') openCreateForm('warehouse');
                          else if (activeTab === 'suppliers') openCreateForm('supplier');
                          else if (activeTab === 'purchase-orders') openCreateForm('purchase-order');
                          else if (activeTab === 'transfers') openCreateForm('transfer');
                        }}
                        className="bg-primary text-primary-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                    New{' '}
                    {activeTab === 'warehouses'
                      ? 'Warehouse'
                      : activeTab === 'suppliers'
                      ? 'Supplier'
                      : activeTab === 'purchase-orders'
                      ? 'PO'
                      : 'Transfer'}
                  </Button>
                </PermissionGate>
              )}
            </div>
          </div>

          {/* Inline Create/Edit Form */}
          {formMode && (
            <div className="mt-4 p-6 bg-card rounded-lg border border-border animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {formMode === 'create' ? 'New' : 'Edit'} {formEntityType === 'warehouse' ? 'Warehouse' : formEntityType === 'supplier' ? 'Supplier' : formEntityType === 'purchase-order' ? 'Purchase Order' : 'Transfer'}
                </h2>
                <Button variant="ghost" size="sm" onClick={closeForm}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Warehouse Form */}
              {formEntityType === 'warehouse' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Code *</label>
                      <Input
                        value={warehouseForm.code}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                        placeholder="WH001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                      <Input
                        value={warehouseForm.name}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                        placeholder="Main Warehouse"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                      <Select
                        value={warehouseForm.status}
                        onChange={(value) => setWarehouseForm({ ...warehouseForm, status: value as WarehouseFormData['status'] })}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                          { value: 'CLOSED', label: 'Closed' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Address Line 1 *</label>
                      <Input
                        value={warehouseForm.address1}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, address1: e.target.value })}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
                      <Input
                        value={warehouseForm.address2}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, address2: e.target.value })}
                        placeholder="Suite 100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">City *</label>
                      <Input
                        value={warehouseForm.city}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">State *</label>
                      <Input
                        value={warehouseForm.state}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Postal Code *</label>
                      <Input
                        value={warehouseForm.postalCode}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, postalCode: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                      <Input
                        value={warehouseForm.country}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, country: e.target.value })}
                        placeholder="US"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                      <Input
                        value={warehouseForm.phone}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                      <Input
                        type="email"
                        value={warehouseForm.email}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, email: e.target.value })}
                        placeholder="warehouse@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Manager</label>
                      <Input
                        value={warehouseForm.managerName}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, managerName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Checkbox
                        checked={warehouseForm.isDefault}
                        onCheckedChange={(checked) => setWarehouseForm({ ...warehouseForm, isDefault: checked })}
                        label="Default Warehouse"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-foreground">Priority:</label>
                      <Input
                        type="number"
                        min={1}
                        value={warehouseForm.priority}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, priority: parseInt(e.target.value) || 1 })}
                        className="w-20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Logo</label>
                      <WarehouseLogoUploader
                        compact
                        value={urlToMediaItems(warehouseForm.logoUrl)}
                        onChange={(items) => setWarehouseForm(prev => ({ ...prev, logoUrl: items[0]?.url || '' }))}
                        entityId={formMode === 'edit' ? selectedEntityId || undefined : undefined}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveWarehouse}
                      disabled={savingEntity || !warehouseForm.code || !warehouseForm.name || !warehouseForm.address1 || !warehouseForm.city || !warehouseForm.state || !warehouseForm.postalCode}
                      className="bg-primary text-primary-foreground"
                    >
                      {savingEntity ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {formMode === 'create' ? 'Create Warehouse' : 'Save Changes'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Supplier Form */}
              {formEntityType === 'supplier' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Code *</label>
                      <Input
                        value={supplierForm.code}
                        onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                        placeholder="SUP001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                      <Input
                        value={supplierForm.name}
                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                        placeholder="Acme Supplies"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                      <Select
                        value={supplierForm.status}
                        onChange={(value) => setSupplierForm({ ...supplierForm, status: value as SupplierFormData['status'] })}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                          { value: 'BLACKLISTED', label: 'Blacklisted' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Contact Name</label>
                      <Input
                        value={supplierForm.contactName}
                        onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                      <Input
                        type="email"
                        value={supplierForm.email}
                        onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                        placeholder="contact@supplier.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                      <Input
                        value={supplierForm.phone}
                        onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Website</label>
                      <Input
                        value={supplierForm.website}
                        onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })}
                        placeholder="https://supplier.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                      <Input
                        value={supplierForm.address1}
                        onChange={(e) => setSupplierForm({ ...supplierForm, address1: e.target.value })}
                        placeholder="123 Main St"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">City</label>
                      <Input
                        value={supplierForm.city}
                        onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">State</label>
                      <Input
                        value={supplierForm.state}
                        onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Payment Terms</label>
                      <Select
                        value={supplierForm.paymentTerms}
                        onChange={(value) => setSupplierForm({ ...supplierForm, paymentTerms: value })}
                        options={[
                          { value: 'Net 15', label: 'Net 15' },
                          { value: 'Net 30', label: 'Net 30' },
                          { value: 'Net 45', label: 'Net 45' },
                          { value: 'Net 60', label: 'Net 60' },
                          { value: 'Due on Receipt', label: 'Due on Receipt' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Lead Time (days)</label>
                      <Input
                        type="number"
                        min={1}
                        value={supplierForm.leadTimeDays}
                        onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: parseInt(e.target.value) || 7 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                    <textarea
                      value={supplierForm.notes}
                      onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                      placeholder="Additional notes about this supplier..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveSupplier}
                      disabled={savingEntity || !supplierForm.code || !supplierForm.name}
                      className="bg-primary text-primary-foreground"
                    >
                      {savingEntity ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {formMode === 'create' ? 'Create Supplier' : 'Save Changes'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Purchase Order Form */}
              {formEntityType === 'purchase-order' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Supplier *</label>
                      <Select
                        value={purchaseOrderForm.supplierId}
                        onChange={(value) => setPurchaseOrderForm({ ...purchaseOrderForm, supplierId: value })}
                        placeholder="Select Supplier"
                        options={suppliers.filter(s => s.status === 'ACTIVE').map(supplier => ({
                          value: supplier.id,
                          label: supplier.name,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Warehouse *</label>
                      <Select
                        value={purchaseOrderForm.warehouseId}
                        onChange={(value) => setPurchaseOrderForm({ ...purchaseOrderForm, warehouseId: value })}
                        placeholder="Select Warehouse"
                        options={warehouses.filter(w => w.status === 'ACTIVE').map(warehouse => ({
                          value: warehouse.id,
                          label: warehouse.name,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Order Date</label>
                      <Input
                        type="date"
                        value={purchaseOrderForm.orderDate}
                        onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, orderDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Expected Delivery</label>
                      <Input
                        type="date"
                        value={purchaseOrderForm.expectedDeliveryDate}
                        onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, expectedDeliveryDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                    <textarea
                      value={purchaseOrderForm.notes}
                      onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, notes: e.target.value })}
                      placeholder="Order notes..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      Purchase Order item management is available after creating the PO
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!purchaseOrderForm.supplierId || !purchaseOrderForm.warehouseId) return;
                        setSavingEntity(true);
                        try {
                          const data: CreatePurchaseOrderRequest = {
                            supplierId: purchaseOrderForm.supplierId,
                            warehouseId: purchaseOrderForm.warehouseId,
                            expectedDate: purchaseOrderForm.expectedDeliveryDate || undefined,
                            notes: purchaseOrderForm.notes || undefined,
                            items: [],
                          };
                          const result = await inventoryService.createPurchaseOrder(data);
                          if (result.success && result.data) {
                            setPurchaseOrders(prev => [...prev, result.data!]);
                            toast.success('Purchase Order Created', 'Purchase order has been created successfully');
                            closeForm();
                          }
                        } catch (err) {
                          console.error('Error creating PO:', err);
                          const errorMsg = err instanceof Error ? err.message : 'Failed to create purchase order';
                          toast.error('Failed to Create PO', errorMsg);
                        } finally {
                          setSavingEntity(false);
                        }
                      }}
                      disabled={savingEntity || !purchaseOrderForm.supplierId || !purchaseOrderForm.warehouseId}
                      className="bg-primary text-primary-foreground"
                    >
                      {savingEntity ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Purchase Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Transfer Form */}
              {formEntityType === 'transfer' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">From Warehouse *</label>
                      <Select
                        value={transferForm.fromWarehouseId}
                        onChange={(value) => setTransferForm({ ...transferForm, fromWarehouseId: value })}
                        placeholder="Select Source Warehouse"
                        options={warehouses.filter(w => w.status === 'ACTIVE' && w.id !== transferForm.toWarehouseId).map(warehouse => ({
                          value: warehouse.id,
                          label: warehouse.name,
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">To Warehouse *</label>
                      <Select
                        value={transferForm.toWarehouseId}
                        onChange={(value) => setTransferForm({ ...transferForm, toWarehouseId: value })}
                        placeholder="Select Destination Warehouse"
                        options={warehouses.filter(w => w.status === 'ACTIVE' && w.id !== transferForm.fromWarehouseId).map(warehouse => ({
                          value: warehouse.id,
                          label: warehouse.name,
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                    <textarea
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                      placeholder="Transfer notes..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="p-4 bg-muted rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      Transfer item management is available after creating the transfer request
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={closeForm}>
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId) return;
                        setSavingEntity(true);
                        try {
                          const data: CreateInventoryTransferRequest = {
                            fromWarehouseId: transferForm.fromWarehouseId,
                            toWarehouseId: transferForm.toWarehouseId,
                            notes: transferForm.notes || undefined,
                            items: [],
                          };
                          const result = await inventoryService.createTransfer(data);
                          if (result.success && result.data) {
                            setTransfers(prev => [...prev, result.data!]);
                            toast.success('Transfer Created', 'Inventory transfer has been created successfully');
                            closeForm();
                          }
                        } catch (err) {
                          console.error('Error creating transfer:', err);
                          const errorMsg = err instanceof Error ? err.message : 'Failed to create transfer';
                          toast.error('Failed to Create Transfer', errorMsg);
                        } finally {
                          setSavingEntity(false);
                        }
                      }}
                      disabled={savingEntity || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || transferForm.fromWarehouseId === transferForm.toWarehouseId}
                      className="bg-primary text-primary-foreground"
                    >
                      {savingEntity ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

              {/* Tab Content */}
              <TabsContent value="stock-levels" className="mt-4">
                {loading ? (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <TableSkeleton rows={8} columns={6} />
                  </div>
                ) : error ? (
                  <div className="p-6 text-center">
                    <div className="bg-error-muted border border-error/20 rounded-lg p-4">
                      <p className="text-error font-medium">{error}</p>
                      <Button variant="outline" onClick={() => fetchProducts()} className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-foreground uppercase">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-foreground uppercase">
                        Low Threshold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">
                            {products.length === 0 ? 'No products found' : 'No matching products'}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {products.length === 0
                              ? 'Products will appear here automatically once created.'
                              : 'Try adjusting your search or filter criteria.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const statusInfo = getStockStatusInfo(product);
                        const StatusIcon = statusInfo.icon;
                        const isEditing = editingProductId === product.id;

                        return (
                          <tr
                            key={product.id}
                            className={cn(
                              'hover:bg-muted transition-colors',
                              statusInfo.trend === 'critical' && 'bg-error-muted/50',
                              statusInfo.trend === 'warning' && 'bg-warning-muted/50'
                            )}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url}
                                    alt={product.name}
                                    className="h-10 w-10 rounded-lg object-cover border border-border"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-foreground max-w-xs truncate">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">ID: {product.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-foreground">{product.sku}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {product.brand || '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                    className="w-20 h-8 text-center text-sm"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSaveStock(product.id)}
                                    disabled={savingStock}
                                    className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success-muted"
                                  >
                                    {savingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingProductId(null)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span
                                  className={cn(
                                    'font-bold text-lg',
                                    (product.quantity || 0) === 0 && 'text-error',
                                    (product.quantity || 0) > 0 && (product.quantity || 0) <= (product.lowStockThreshold || 10) && 'text-warning',
                                    (product.quantity || 0) > (product.lowStockThreshold || 10) && 'text-foreground'
                                  )}
                                >
                                  {product.quantity || 0}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                              {product.lowStockThreshold || 10}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                                  statusInfo.color
                                )}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-foreground">
                              ${parseFloat(product.price).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/products?id=${product.id}`)}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                  title="View Product"
                                  aria-label="View product"
                                >
                                  <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                                </Button>
                                <PermissionGate permission={Permission.INVENTORY_ADJUST}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingProductId(product.id);
                                      setEditQuantity(product.quantity || 0);
                                    }}
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                    title="Quick Edit Stock"
                                    aria-label="Edit stock"
                                  >
                                    <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                                  </Button>
                                </PermissionGate>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>
                )}
              </TabsContent>

              <TabsContent value="warehouses" className="mt-4">
                {loading ? (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <TableSkeleton rows={5} columns={6} />
                  </div>
                ) : (
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredWarehouses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">No warehouses</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Get started by creating a new warehouse.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredWarehouses.map((warehouse) => (
                        <tr key={warehouse.id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-foreground">{warehouse.code}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-foreground">{warehouse.name}</p>
                              {warehouse.isDefault && (
                                <span className="text-xs font-semibold text-primary">Default</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {warehouse.city}, {warehouse.state}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                                getStatusBadgeClass(warehouse.status)
                              )}
                            >
                              {warehouse.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{warehouse.priority}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <PermissionGate permission={Permission.INVENTORY_WAREHOUSES_MANAGE}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditForm('warehouse', warehouse.id)}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                  title="Edit"
                                  aria-label="Edit warehouse"
                                >
                                  <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal('warehouse', warehouse.id)}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                                  title="Delete"
                                  aria-label="Delete warehouse"
                                >
                                  <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
                )}
              </TabsContent>

              <TabsContent value="suppliers" className="mt-4">
                {loading ? (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <TableSkeleton rows={5} columns={5} />
                  </div>
                ) : (
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Total Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">No suppliers</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Get started by adding a supplier.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-foreground">{supplier.code}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-foreground">{supplier.name}</td>
                          <td className="px-6 py-4">
                            {supplier.contactName && (
                              <p className="text-sm text-foreground">{supplier.contactName}</p>
                            )}
                            {supplier.email && (
                              <p className="text-sm text-muted-foreground">{supplier.email}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">{supplier.totalOrders}</td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            ${supplier.totalSpent.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                                getStatusBadgeClass(supplier.status)
                              )}
                            >
                              {supplier.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <PermissionGate permission={Permission.INVENTORY_ADJUST}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditForm('supplier', supplier.id)}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                  title="Edit"
                                  aria-label="Edit supplier"
                                >
                                  <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteModal('supplier', supplier.id)}
                                  className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                                  title="Delete"
                                  aria-label="Delete supplier"
                                >
                                  <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
                )}
              </TabsContent>

              <TabsContent value="purchase-orders" className="mt-4">
                {loading ? (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <TableSkeleton rows={5} columns={6} />
                  </div>
                ) : (
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        PO Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Warehouse
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Order Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPurchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">
                            No purchase orders
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Create a purchase order to restock inventory.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredPurchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-foreground">{po.poNumber}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {po.supplier?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {po.warehouse?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(po.orderDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">
                            {po.currencyCode} {po.total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                                getStatusBadgeClass(po.status)
                              )}
                            >
                              {po.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={po.status}
                                onChange={(value) => handleUpdatePOStatus(po.id, value)}
                                size="sm"
                                options={[
                                  { value: 'DRAFT', label: 'Draft' },
                                  { value: 'SUBMITTED', label: 'Submitted' },
                                  { value: 'APPROVED', label: 'Approved' },
                                  { value: 'ORDERED', label: 'Ordered' },
                                  { value: 'RECEIVED', label: 'Received' },
                                  { value: 'CANCELLED', label: 'Cancelled' },
                                ]}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/inventory/purchase-orders/${po.id}`)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                title="View Details"
                                aria-label="View purchase order"
                              >
                                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
                )}
              </TabsContent>

              <TabsContent value="transfers" className="mt-4">
                {loading ? (
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <TableSkeleton rows={5} columns={6} />
                  </div>
                ) : (
                <div className="bg-card rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Transfer #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 text-sm font-medium text-foreground">No transfers</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Transfer inventory between warehouses.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransfers.map((transfer) => (
                        <tr key={transfer.id} className="hover:bg-muted transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-foreground">
                              {transfer.transferNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {transfer.fromWarehouse?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {transfer.toWarehouse?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(transfer.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                                getStatusBadgeClass(transfer.status)
                              )}
                            >
                              {transfer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Select
                                value={transfer.status}
                                onChange={(value) => handleUpdateTransferStatus(transfer.id, value)}
                                size="sm"
                                options={[
                                  { value: 'PENDING', label: 'Pending' },
                                  { value: 'IN_TRANSIT', label: 'In Transit' },
                                  { value: 'COMPLETED', label: 'Completed' },
                                  { value: 'CANCELLED', label: 'Cancelled' },
                                ]}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/inventory/transfers/${transfer.id}`)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                title="View Details"
                                aria-label="View transfer"
                              >
                                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border max-w-md w-full mx-4">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-error-muted flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-error" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Delete {deleteModal.entityType}</h2>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete <span className="font-semibold text-foreground">{getEntityName(deleteModal.entityType, deleteModal.id)}</span>?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                To confirm, type the {deleteModal.entityType === 'warehouse' ? 'warehouse' : deleteModal.entityType === 'supplier' ? 'supplier' : deleteModal.entityType} name below:
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={getEntityName(deleteModal.entityType, deleteModal.id)}
                className="mb-2"
              />
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={closeDeleteModal}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deletingEntityId === deleteModal.id || deleteConfirmName !== getEntityName(deleteModal.entityType, deleteModal.id)}
                className="bg-error text-white hover:bg-error"
              >
                {deletingEntityId === deleteModal.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {(activeTab === 'warehouses' || activeTab === 'suppliers') && (
        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            fetchData();
            setShowBulkImport(false);
          }}
          entityType={activeTab as 'warehouses' | 'suppliers'}
          entityLabel={activeTab === 'warehouses' ? 'Warehouses' : 'Suppliers'}
          tenantId={currentTenant?.id}
        />
      )}
    </div>
    </PermissionGate>
  );
}

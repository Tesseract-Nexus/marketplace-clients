'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { Stepper, StepperNavigation } from '@/components/Stepper';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Pagination } from '@/components/Pagination';
import { productService } from '@/lib/services/productService';
import { categoryService } from '@/lib/services/categoryService';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { useAdminCurrency } from '@/hooks/useAdminCurrency';
import {
  Product,
  Category,
  CreateProductRequest,
  UpdateProductRequest,
  ProductStatus,
  InventoryStatus,
} from '@/lib/api/types';
import {
  Loader2, AlertCircle, X, Upload, Eye, Edit, Trash2, RefreshCw,
  FileText, Package, Image as ImageIcon, CheckCircle,
  Tag, Search, Scale, Lightbulb, AlertTriangle, Hash, Globe, Layers,
  Smartphone, Monitor, Headphones, Tv, Gamepad2, Mouse, Plus, Folder,
  Building2, CircleOff,
  Ruler, Clock, CheckCircle2, FileEdit, XCircle, Archive, RotateCcw,
  PackageCheck, PackageX, Timer, Ban, FileUp, ChevronUp, ChevronDown, Star,
  Home, ChevronLeft, Warehouse, Truck, DollarSign, TrendingUp, ClipboardList, Images,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageError } from '@/components/PageError';
import { Badge } from '@/components/ui/badge';
import { BulkImportModal } from '@/components/BulkImportModal';
import { CascadeDeleteModal } from '@/components/CascadeDeleteModal';
import { ImageUploadProgressModal, UploadingFile, UploadStatus } from '@/components/ImageUploadProgressModal';
import type { CascadeDeleteResult } from '@/lib/types/cascade-delete';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils/currency';

// Inline UI Components
const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border bg-white/80 backdrop-blur-sm text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300", className)} {...props}>
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("text-sm font-semibold text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border-2 border-border bg-white px-4 py-2 text-sm transition-colors focus:border-primary/70 focus:ring-2 focus:ring-blue-400/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export default function ProductsPage() {
  // Get current tenant context - products are automatically filtered by tenant via API headers
  const { currentTenant, isLoading: isTenantLoading } = useTenant();
  const { storeCurrency } = useAdminCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>(
    'ALL'
  );
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<
    InventoryStatus | 'ALL'
  >('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Form state - vendorId is automatically set from tenant context via API headers
  const [formData, setFormData] = useState<
    Partial<CreateProductRequest | UpdateProductRequest>
  >({
    name: '',
    slug: '',
    sku: '',
    brand: '',
    description: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    // vendorId is automatically set from tenant context on backend - not needed in form
    categoryId: '',
    // Optional warehouse and supplier - auto-created if name provided
    warehouseName: '',
    supplierName: '',
    quantity: 0,
    minOrderQty: 1,
    maxOrderQty: undefined,
    lowStockThreshold: 10,
    weight: '',
    currencyCode: '',
    searchKeywords: '',
    tags: [],
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm',
    },
    attributes: [],
    images: [],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Tag input state (separate from formData.tags for better UX)
  const [tagInput, setTagInput] = useState('');

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // Uploaded images (temporary storage until product is saved)
  interface UploadedImage {
    id: string;
    url: string;
    path: string;
    fileName: string;
    position: number;
    isPrimary?: boolean; // Mark as one of the primary/featured images (max 3)
  }
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Max number of primary images allowed
  const MAX_PRIMARY_IMAGES = 3;

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bulk import modal
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Default categories shown when no categories exist for the tenant
  const defaultCategoryOptions = [
    { name: 'Electronics', icon: <Smartphone className="w-4 h-4 text-primary" /> },
    { name: 'Computers', icon: <Monitor className="w-4 h-4 text-primary" /> },
    { name: 'Audio', icon: <Headphones className="w-4 h-4 text-success" /> },
    { name: 'TV & Video', icon: <Tv className="w-4 h-4 text-destructive" /> },
    { name: 'Gaming', icon: <Gamepad2 className="w-4 h-4 text-warning" /> },
    { name: 'Clothing', icon: <Folder className="w-4 h-4 text-primary" /> },
    { name: 'Home & Kitchen', icon: <Folder className="w-4 h-4 text-warning" /> },
    { name: 'Sports & Outdoors', icon: <Folder className="w-4 h-4 text-success" /> },
    { name: 'Accessories', icon: <Mouse className="w-4 h-4 text-muted-foreground" /> },
  ];

  const steps = [
    { number: 1, title: 'Basic Info', icon: <FileText className="w-5 h-5" />, description: 'Product details' },
    { number: 2, title: 'Pricing', icon: <span className="w-5 h-5 flex items-center justify-center font-bold text-lg">{getCurrencySymbol(storeCurrency)}</span>, description: 'Set prices' },
    { number: 3, title: 'Inventory', icon: <Package className="w-5 h-5" />, description: 'Stock & shipping' },
    { number: 4, title: 'Media', icon: <ImageIcon className="w-5 h-5" />, description: 'Images & tags' },
    { number: 5, title: 'Review', icon: <CheckCircle className="w-5 h-5" />, description: 'Final review' },
  ];

  // Validation functions
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Product name is required';
        if (value.length < 3) return 'Product name must be at least 3 characters';
        if (value.length > 200) return 'Product name must not exceed 200 characters';
        return null;
      case 'sku':
        if (!value || value.trim() === '') return 'SKU is required';
        if (value.length < 3) return 'SKU must be at least 3 characters';
        if (!/^[A-Z0-9-_]+$/i.test(value)) return 'SKU can only contain letters, numbers, hyphens, and underscores';
        return null;
      case 'price':
        if (!value || value === '') return 'Price is required';
        const price = parseFloat(value);
        if (isNaN(price)) return 'Price must be a valid number';
        if (price < 0) return 'Price must be greater than or equal to 0';
        if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) return 'Price must be a valid amount (e.g., 99.99)';
        return null;
      case 'comparePrice':
        if (value && value !== '') {
          const comparePrice = parseFloat(value);
          if (isNaN(comparePrice)) return 'Compare price must be a valid number';
          if (comparePrice < 0) return 'Compare price must be greater than or equal to 0';
          if (formData.price && comparePrice < parseFloat(formData.price as string)) {
            return 'Compare price should be greater than selling price';
          }
        }
        return null;
      case 'costPrice':
        if (value && value !== '') {
          const costPrice = parseFloat(value);
          if (isNaN(costPrice)) return 'Cost price must be a valid number';
          if (costPrice < 0) return 'Cost price must be greater than or equal to 0';
        }
        return null;
      case 'quantity':
        if (value === undefined || value === null) return 'Stock quantity is required';
        if (!Number.isInteger(Number(value))) return 'Stock quantity must be a whole number';
        if (Number(value) < 0) return 'Stock quantity must be greater than or equal to 0';
        return null;
      case 'minOrderQty':
        if (value && !Number.isInteger(Number(value))) return 'Min order quantity must be a whole number';
        if (value && Number(value) < 1) return 'Min order quantity must be at least 1';
        return null;
      case 'maxOrderQty':
        if (value && !Number.isInteger(Number(value))) return 'Max order quantity must be a whole number';
        if (value && Number(value) < 1) return 'Max order quantity must be at least 1';
        if (value && formData.minOrderQty && Number(value) < Number(formData.minOrderQty)) {
          return 'Max order quantity must be greater than min order quantity';
        }
        return null;
      case 'lowStockThreshold':
        if (value && !Number.isInteger(Number(value))) return 'Low stock threshold must be a whole number';
        if (value && Number(value) < 0) return 'Low stock threshold must be greater than or equal to 0';
        return null;
      default:
        return null;
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Basic Info validation
      ['name', 'sku'].forEach(field => {
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) newErrors[field] = error;
      });
    } else if (step === 2) {
      // Pricing validation
      ['price', 'comparePrice', 'costPrice'].forEach(field => {
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) newErrors[field] = error;
      });
    } else if (step === 3) {
      // Inventory validation
      ['quantity', 'minOrderQty', 'maxOrderQty', 'lowStockThreshold'].forEach(field => {
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) newErrors[field] = error;
      });
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate all required fields
    ['name', 'sku', 'price', 'quantity'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    // Validate optional fields that have values
    ['comparePrice', 'costPrice', 'minOrderQty', 'maxOrderQty', 'lowStockThreshold'].forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value !== undefined && value !== null && value !== '') {
        const error = validateField(field, value);
        if (error) newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Cascade delete modal state
  const [cascadeDeleteConfig, setCascadeDeleteConfig] = useState<{
    isOpen: boolean;
    products: { id: string; name: string }[];
    isBulk: boolean;
  }>({
    isOpen: false,
    products: [],
    isBulk: false,
  });

  // Load products when tenant changes - tenant header is automatically injected via TenantApiProvider
  useEffect(() => {
    if (!isTenantLoading && currentTenant?.id) {
      loadProducts();
      loadCategories();
    }
  }, [currentTenant?.id, isTenantLoading]);

  // Sync URL params with view state
  useEffect(() => {
    if (loading || !products.length) return;

    const productId = searchParams.get('id');
    const mode = searchParams.get('mode');

    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        if (mode === 'edit') {
          setViewMode('edit');
          // Populate form data for edit mode
          setFormData({
            name: product.name,
            slug: product.slug || '',
            sku: product.sku,
            brand: product.brand || '',
            description: product.description || '',
            price: product.price,
            comparePrice: product.comparePrice || '',
            costPrice: product.costPrice || '',
            categoryId: product.categoryId || '',
            quantity: product.quantity || 0,
            minOrderQty: product.minOrderQty || 1,
            maxOrderQty: product.maxOrderQty,
            lowStockThreshold: product.lowStockThreshold || 10,
            weight: product.weight || '',
            currencyCode: product.currencyCode || 'USD',
          });
        } else {
          setViewMode('detail');
        }
      }
    } else if (mode === 'create') {
      setViewMode('create');
      setSelectedProduct(null);
    } else {
      setViewMode('list');
      setSelectedProduct(null);
    }
    setUrlInitialized(true);
  }, [searchParams, products, loading]);

  // Navigation helpers with URL updates
  const navigateToList = useCallback(() => {
    router.push('/products');
  }, [router]);

  const navigateToProduct = useCallback((productId: string, mode: 'view' | 'edit' = 'view') => {
    if (mode === 'edit') {
      router.push(`/products?id=${productId}&mode=edit`);
    } else {
      router.push(`/products?id=${productId}`);
    }
  }, [router]);

  const navigateToCreate = useCallback(() => {
    router.push('/products?mode=create');
  }, [router]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts();
      setProducts(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load products'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load categories for the current tenant
  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryService.getCategories({ isActive: true });
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Create a new category on-the-fly
  const handleCreateCategory = async (categoryName: string) => {
    if (!categoryName.trim() || creatingCategory) return;

    try {
      setCreatingCategory(true);
      const response = await categoryService.createCategory({
        name: categoryName.trim(),
        isActive: true,
      });

      if (response.success && response.data) {
        // Add to categories list and select it
        setCategories(prev => [...prev, response.data!]);
        setFormData(prev => ({ ...prev, categoryId: response.data!.id }));
        setCategorySearchQuery('');
        setShowCategoryDropdown(false);
      }
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setCreatingCategory(false);
    }
  };

  // Get displayed category name for the dropdown
  const getSelectedCategoryName = (): string => {
    if (!formData.categoryId) return '';
    const found = categories.find(c => c.id === formData.categoryId);
    return found?.name || '';
  };

  // Filter categories based on search query
  const getFilteredCategories = () => {
    const query = categorySearchQuery.toLowerCase().trim();
    if (categories.length > 0) {
      // Filter existing categories
      return categories.filter(c =>
        c.name.toLowerCase().includes(query)
      );
    } else {
      // Show default options when no categories exist
      return defaultCategoryOptions.filter(c =>
        c.name.toLowerCase().includes(query)
      );
    }
  };

  // Handle image upload with progress modal
  const handleImageUpload = async (files: FileList) => {
    // Product ID is required for proper storage organization
    const productId = selectedProduct?.id;
    if (!productId) {
      toast.error('Save Product First', 'Please save the product before uploading images');
      return;
    }

    // Validate all files first and prepare the upload list
    const validFiles: { file: File; previewUrl: string }[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid File Type', `${file.name}: Only JPEG, PNG, GIF, WebP allowed`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File Too Large', `${file.name}: Max size is 10MB`);
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      validFiles.push({ file, previewUrl });
    }

    if (validFiles.length === 0) {
      return;
    }

    // Initialize uploading files state with pending status
    const initialFiles: UploadingFile[] = validFiles.map(({ file, previewUrl }, index) => ({
      id: `upload_${Date.now()}_${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending' as UploadStatus,
      progress: 0,
      previewUrl,
    }));

    setUploadingFiles(initialFiles);
    setShowUploadModal(true);
    setUploadingImages(true);

    const newImages: typeof uploadedImages = [];

    // Upload files sequentially with status updates
    for (let i = 0; i < validFiles.length; i++) {
      const { file } = validFiles[i];
      const fileId = initialFiles[i].id;

      // Update status to uploading
      setUploadingFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, status: 'uploading' as UploadStatus, progress: 50 } : f
      ));

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('productId', productId);
        uploadFormData.append('imageType', uploadedImages.length === 0 && i === 0 ? 'primary' : 'gallery');
        uploadFormData.append('position', (uploadedImages.length + i).toString());

        const response = await fetch('/api/products/images', {
          method: 'POST',
          headers: {
            // Use current tenant and vendor IDs for proper multi-tenant/multi-vendor isolation
            'x-jwt-claim-tenant-id': currentTenant?.id || '',
            'x-jwt-claim-vendor-id': currentTenant?.id || '', // In MVP, vendor ID = tenant ID; extend for multi-vendor later
          },
          body: uploadFormData,
        });

        const result = await response.json();

        if (result.success && result.image) {
          newImages.push({
            id: result.image.id,
            url: result.image.url,
            path: result.image.path,
            fileName: result.image.fileName,
            position: result.image.position,
          });

          // Update status to success
          setUploadingFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'success' as UploadStatus, progress: 100 } : f
          ));
        } else {
          // Update status to error
          setUploadingFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'error' as UploadStatus, error: result.message || 'Upload failed' } : f
          ));
        }
      } catch (err) {
        // Update status to error
        setUploadingFiles(prev => prev.map(f =>
          f.id === fileId ? {
            ...f,
            status: 'error' as UploadStatus,
            error: err instanceof Error ? err.message : 'Upload failed'
          } : f
        ));
      }

      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    // Update state with successfully uploaded images
    if (newImages.length > 0) {
      setUploadedImages((prev) => [...prev, ...newImages]);
      // Also update formData.images for product creation
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newImages.map((img) => ({
          id: img.id,
          url: img.url,
          position: img.position,
        }))],
      }));
    }

    setUploadingImages(false);
  };

  // Handle upload modal close
  const handleUploadModalClose = () => {
    setShowUploadModal(false);
    // Clean up preview URLs
    uploadingFiles.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setUploadingFiles([]);
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
    setFormData((prev) => ({
      ...prev,
      images: ((prev.images as any[]) || []).filter((img: any) => img.id !== imageId),
    }));
  };

  // Move image up or down in the list (reorder for top 3 featured positions)
  const handleMoveImage = (imageId: string, direction: 'up' | 'down') => {
    setUploadedImages((prev) => {
      const index = prev.findIndex((img) => img.id === imageId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newImages = [...prev];
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];

      // Update positions
      return newImages.map((img, i) => ({ ...img, position: i }));
    });

    // Also update formData.images
    setFormData((prev) => {
      const images = [...((prev.images as any[]) || [])];
      const index = images.findIndex((img: any) => img.id === imageId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= images.length) return prev;

      [images[index], images[newIndex]] = [images[newIndex], images[index]];

      return {
        ...prev,
        images: images.map((img, i) => ({ ...img, position: i })),
      };
    });
  };

  // Set image as primary (move to first position) - DEPRECATED: Use handleTogglePrimary instead
  const handleSetPrimary = (imageId: string) => {
    setUploadedImages((prev) => {
      const index = prev.findIndex((img) => img.id === imageId);
      if (index <= 0) return prev; // Already first or not found

      const image = prev[index];
      const newImages = [image, ...prev.slice(0, index), ...prev.slice(index + 1)];

      return newImages.map((img, i) => ({ ...img, position: i }));
    });

    setFormData((prev) => {
      const images = [...((prev.images as any[]) || [])];
      const index = images.findIndex((img: any) => img.id === imageId);
      if (index <= 0) return prev;

      const image = images[index];
      const newImages = [image, ...images.slice(0, index), ...images.slice(index + 1)];

      return {
        ...prev,
        images: newImages.map((img, i) => ({ ...img, position: i })),
      };
    });
  };

  // Toggle isPrimary flag on an image (max 3 primary images allowed)
  const handleTogglePrimary = (imageId: string) => {
    setUploadedImages((prev) => {
      const image = prev.find((img) => img.id === imageId);
      if (!image) return prev;

      const currentPrimaryCount = prev.filter((img) => img.isPrimary).length;
      const isCurrentlyPrimary = image.isPrimary;

      // If trying to add a new primary and already at max, don't allow
      if (!isCurrentlyPrimary && currentPrimaryCount >= MAX_PRIMARY_IMAGES) {
        return prev;
      }

      return prev.map((img) =>
        img.id === imageId ? { ...img, isPrimary: !img.isPrimary } : img
      );
    });

    setFormData((prev) => {
      const images = [...((prev.images as any[]) || [])];
      const image = images.find((img: any) => img.id === imageId);
      if (!image) return prev;

      const currentPrimaryCount = images.filter((img: any) => img.isPrimary).length;
      const isCurrentlyPrimary = image.isPrimary;

      // If trying to add a new primary and already at max, don't allow
      if (!isCurrentlyPrimary && currentPrimaryCount >= MAX_PRIMARY_IMAGES) {
        return prev;
      }

      return {
        ...prev,
        images: images.map((img: any) =>
          img.id === imageId ? { ...img, isPrimary: !img.isPrimary } : img
        ),
      };
    });
  };

  // Get count of primary images
  const primaryImageCount = uploadedImages.filter((img) => img.isPrimary).length;

  const handleCreateNew = () => {
    // Reset form - vendorId is automatically set from tenant context on backend
    setFormData({
      name: '',
      slug: '',
      sku: '',
      brand: '',
      description: '',
      price: '',
      comparePrice: '',
      costPrice: '',
      // vendorId is set from tenant context via API headers - not needed in form
      categoryId: '1',
      // Optional warehouse and supplier
      warehouseName: '',
      supplierName: '',
      quantity: 0,
      minOrderQty: 1,
      maxOrderQty: undefined,
      lowStockThreshold: 10,
      weight: '',
      currencyCode: 'USD',
      searchKeywords: '',
      tags: [],
      dimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm',
      },
      attributes: [],
      images: [],
    });
    setSelectedProduct(null);
    setCurrentStep(1);
    setViewMode('create');
    navigateToCreate();
    // Reset image upload state
    setUploadedImages([]);
    setTagInput('');
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      brand: product.brand,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      costPrice: product.costPrice,
      categoryId: product.categoryId,
      // Warehouse and supplier
      warehouseName: product.warehouseName || '',
      supplierName: product.supplierName || '',
      quantity: product.quantity,
      minOrderQty: product.minOrderQty,
      maxOrderQty: product.maxOrderQty,
      lowStockThreshold: product.lowStockThreshold,
      weight: product.weight,
      searchKeywords: product.searchKeywords,
      tags: product.tags ? Object.values(product.tags) : [],
      dimensions: product.dimensions || {
        length: '',
        width: '',
        height: '',
        unit: 'cm',
      },
      attributes: product.attributes ? Object.values(product.attributes) : [],
      images: product.images || [],
    });
    setSelectedProduct(product);
    setCurrentStep(1);
    setViewMode('edit');
    navigateToProduct(product.id, 'edit');
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setViewMode('detail');
    navigateToProduct(product.id, 'view');
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors in the form before submitting.');
      return;
    }

    try {
      if (viewMode === 'create') {
        // Include vendorId from current tenant when creating a product
        const createData = {
          ...formData,
          vendorId: currentTenant?.id || '',
        } as CreateProductRequest;
        await productService.createProduct(createData);
      } else if (viewMode === 'edit' && selectedProduct) {
        await productService.updateProduct(
          selectedProduct.id,
          formData as UpdateProductRequest
        );
      }
      await loadProducts();
      navigateToList();
      setErrors({});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save product'
      );
    }
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    setCascadeDeleteConfig({
      isOpen: true,
      products: [{ id: product.id, name: product.name }],
      isBulk: false,
    });
  };

  const handleCascadeDeleteSuccess = async (result: CascadeDeleteResult) => {
    // Show success message based on what was deleted
    const deletedItems = [];
    if (result.productsDeleted > 0) {
      deletedItems.push(`${result.productsDeleted} product(s)`);
    }
    if (result.variantsDeleted > 0) {
      deletedItems.push(`${result.variantsDeleted} variant(s)`);
    }
    if (result.categoriesDeleted?.length) {
      deletedItems.push(`${result.categoriesDeleted.length} category(ies)`);
    }
    if (result.warehousesDeleted?.length) {
      deletedItems.push(`${result.warehousesDeleted.length} warehouse(s)`);
    }
    if (result.suppliersDeleted?.length) {
      deletedItems.push(`${result.suppliersDeleted.length} supplier(s)`);
    }

    // Clear selections and reload
    setSelectedProducts(new Set());
    await loadProducts();

    // If partial success, show warning
    if (result.partialSuccess && result.errors?.length) {
      setError(`Deleted ${deletedItems.join(', ')}, but some operations failed: ${result.errors.map(e => e.message).join(', ')}`);
    }
  };

  // Bulk selection handlers
  const handleSelectProduct = (id: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;

    // Get product info for the cascade delete modal
    const selectedProductsInfo = products
      .filter(p => selectedProducts.has(p.id))
      .map(p => ({ id: p.id, name: p.name }));

    setCascadeDeleteConfig({
      isOpen: true,
      products: selectedProductsInfo,
      isBulk: true,
    });
  };

  // Bulk status change handler
  const handleBulkStatusChange = async (newStatus: ProductStatus) => {
    if (selectedProducts.size === 0) return;

    try {
      setLoading(true);
      const productIds = Array.from(selectedProducts);
      const response = await productService.bulkUpdateProductStatus(productIds, newStatus);

      if (response.success) {
        toast.success(
          'Status Updated',
          `${response.data?.updatedCount || productIds.length} product(s) updated to ${newStatus}`
        );
        setSelectedProducts(new Set());
        await loadProducts();
      } else {
        toast.error('Update Failed', 'Failed to update product status');
      }
    } catch (error) {
      console.error('Bulk status change error:', error);
      toast.error('Error', 'An error occurred while updating product status');
    } finally {
      setLoading(false);
    }
  };

  // Individual product status change handler
  const handleProductStatusChange = async (productId: string, newStatus: ProductStatus) => {
    try {
      setLoading(true);
      const response = await productService.updateProductStatus(productId, newStatus);

      if (response.success) {
        toast.success('Status Updated', `Product status updated to ${newStatus}`);
        await loadProducts();
      } else {
        toast.error('Update Failed', 'Failed to update product status');
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error('Error', 'An error occurred while updating product status');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || product.status === statusFilter;

    const matchesInventoryStatus =
      inventoryStatusFilter === 'ALL' ||
      product.inventoryStatus === inventoryStatusFilter;

    const matchesBrand =
      brandFilter === 'ALL' || product.brand === brandFilter;

    return (
      matchesSearch && matchesStatus && matchesInventoryStatus && matchesBrand
    );
  });

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, inventoryStatusFilter, brandFilter]);

  const getStatusBadge = (status: ProductStatus) => {
    const styles: Record<ProductStatus, string> = {
      ACTIVE: 'bg-success-muted text-success-muted-foreground border-transparent',
      DRAFT: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
      PENDING: 'bg-warning-muted text-warning-muted-foreground border-transparent',
      INACTIVE: 'bg-error-muted text-error-muted-foreground border-transparent',
      ARCHIVED: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
      REJECTED: 'bg-error-muted text-error-muted-foreground border-transparent',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  const getInventoryBadge = (status?: InventoryStatus) => {
    if (!status) return null;

    const styles: Record<InventoryStatus, string> = {
      IN_STOCK: 'bg-success-muted text-success-muted-foreground border-transparent',
      LOW_STOCK: 'bg-warning-muted text-warning-muted-foreground border-transparent',
      OUT_OF_STOCK: 'bg-error-muted text-error-muted-foreground border-transparent',
      BACK_ORDER: 'bg-info-muted text-info-muted-foreground border-transparent',
      DISCONTINUED: 'bg-neutral-muted text-neutral-muted-foreground border-transparent',
    };

    const labels = {
      IN_STOCK: 'In Stock',
      LOW_STOCK: 'Low Stock',
      OUT_OF_STOCK: 'Out of Stock',
      BACK_ORDER: 'Back Order',
      DISCONTINUED: 'Discontinued',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  ).sort();

  // Product Detail View
  if (viewMode === 'detail' && selectedProduct) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/', icon: Home },
            { label: 'Products', href: '/products', icon: Package },
            { label: selectedProduct.name, icon: Eye },
          ]}
        />

        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={navigateToList}
              className="mb-4 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center gap-2"
              variant="ghost"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back to Products List
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{selectedProduct.name}</h1>
                  {getStatusBadge(selectedProduct.status)}
                  {getInventoryBadge(selectedProduct.inventoryStatus)}
                </div>
                <p className="text-muted-foreground font-mono text-sm">SKU: {selectedProduct.sku}</p>
              </div>
              <div className="flex gap-3">
                <PermissionGate permission={Permission.PRODUCTS_UPDATE}>
                  <Button
                    onClick={() => handleEdit(selectedProduct)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Product
                  </Button>
                </PermissionGate>
                <PermissionGate permission={Permission.PRODUCTS_DELETE}>
                  <Button
                    onClick={() => handleDeleteProduct(selectedProduct.id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-error-muted text-error-muted-foreground rounded-xl hover:bg-error/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Product Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <Card className="border-border/50">
                <CardHeader className="border-b border-border bg-muted">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Product Name</p>
                      <p className="text-foreground font-medium">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Brand</p>
                      <p className="text-foreground font-medium">{selectedProduct.brand || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">SKU</p>
                      <p className="text-foreground font-mono">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Slug</p>
                      <p className="text-foreground font-mono">{selectedProduct.slug || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Description</p>
                      <p className="text-foreground">{selectedProduct.description || 'No description available'}</p>
                    </div>
                    {selectedProduct.searchKeywords && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground font-semibold mb-1">Search Keywords</p>
                        <p className="text-foreground">{selectedProduct.searchKeywords}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Images Card */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="border-b border-border bg-primary/5">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      Product Images ({selectedProduct.images.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedProduct.images.map((img, index) => {
                        const imageUrl = typeof img === 'string' ? img : img?.url;
                        return imageUrl ? (
                          <div
                            key={index}
                            className={cn(
                              "relative aspect-square rounded-xl overflow-hidden border-2 bg-muted",
                              index === 0 ? "border-primary/70 ring-2 ring-blue-100" : "border-border"
                            )}
                          >
                            <img
                              src={imageUrl}
                              alt={`${selectedProduct.name} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {index === 0 && (
                              <span className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded-lg font-semibold flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" /> Primary
                              </span>
                            )}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pricing Card */}
              <Card className="border-border/50">
                <CardHeader className="border-b border-border bg-success/5">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center font-bold text-lg text-success">{getCurrencySymbol(storeCurrency)}</span>
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-success-muted rounded-xl p-4 border border-success/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Selling Price</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(selectedProduct.price, selectedProduct.currencyCode || storeCurrency)}
                      </p>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Compare Price</p>
                      <p className="text-2xl font-bold text-primary">
                        {selectedProduct.comparePrice ? formatCurrency(selectedProduct.comparePrice, selectedProduct.currencyCode || storeCurrency) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-warning/5 rounded-xl p-4 border border-warning/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Cost Price</p>
                      <p className="text-2xl font-bold text-warning">
                        {selectedProduct.costPrice ? formatCurrency(selectedProduct.costPrice, selectedProduct.currencyCode || storeCurrency) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {selectedProduct.costPrice && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/30">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Profit Margin</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(parseFloat(selectedProduct.price) - parseFloat(selectedProduct.costPrice), selectedProduct.currencyCode || storeCurrency)}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({(((parseFloat(selectedProduct.price) - parseFloat(selectedProduct.costPrice)) / parseFloat(selectedProduct.price)) * 100).toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inventory Card */}
              <Card className="border-border/50">
                <CardHeader className="border-b border-border bg-warning/5">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-warning" />
                    Inventory & Shipping
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Stock Quantity</p>
                      <p className="text-2xl font-bold text-primary">{selectedProduct.quantity || 0}</p>
                    </div>
                    <div className="bg-warning-muted rounded-xl p-4 border border-warning/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Low Stock Alert</p>
                      <p className="text-2xl font-bold text-warning">{selectedProduct.lowStockThreshold || 0}</p>
                    </div>
                    <div className="bg-success-muted rounded-xl p-4 border border-success/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Min Order</p>
                      <p className="text-2xl font-bold text-success">{selectedProduct.minOrderQty || 1}</p>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Max Order</p>
                      <p className="text-2xl font-bold text-primary">{selectedProduct.maxOrderQty || '∞'}</p>
                    </div>
                  </div>
                  {selectedProduct.weight && (
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                        <Scale className="w-4 h-4" /> Weight: {selectedProduct.weight}
                      </span>
                      {selectedProduct.dimensions && (
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                          <Ruler className="w-4 h-4" />
                          {selectedProduct.dimensions.length} x {selectedProduct.dimensions.width} x {selectedProduct.dimensions.height} {selectedProduct.dimensions.unit}
                        </span>
                      )}
                    </div>
                  )}
                  {(selectedProduct.warehouseName || selectedProduct.supplierName) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        Warehouse & Supplier
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {selectedProduct.warehouseName && (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30">
                            <Warehouse className="w-4 h-4 inline-block" aria-hidden="true" /> {selectedProduct.warehouseName}
                          </span>
                        )}
                        {selectedProduct.supplierName && (
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/30">
                            <Truck className="w-4 h-4 inline-block" aria-hidden="true" /> {selectedProduct.supplierName}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <Card className="border-border/50">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-bold text-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Product Status</span>
                    {getStatusBadge(selectedProduct.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Inventory</span>
                    {getInventoryBadge(selectedProduct.inventoryStatus)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Currency</span>
                    <span className="font-semibold text-foreground">{selectedProduct.currencyCode || 'USD'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews Card */}
              {(selectedProduct.averageRating || selectedProduct.reviewCount) && (
                <Card className="border-border/50">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-lg font-bold text-foreground">Reviews</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-warning mb-2">
                        <Star className="w-4 h-4 fill-warning text-warning inline-block" aria-hidden="true" /> {selectedProduct.averageRating?.toFixed(1) || '0.0'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Based on {selectedProduct.reviewCount || 0} reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags Card */}
              {selectedProduct.tags && Object.keys(selectedProduct.tags).length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {Object.values(selectedProduct.tags).map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card className="border-border/50">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {selectedProduct.createdAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm text-foreground font-medium">
                        {new Date(selectedProduct.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedProduct.updatedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm text-foreground font-medium">
                        {new Date(selectedProduct.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/', icon: Home },
            { label: 'Products', href: '/products', icon: Package },
            { label: viewMode === 'create' ? 'Create' : 'Edit', icon: Edit },
          ]}
        />

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
              <Button
                onClick={() => setViewMode('list')}
                className="mb-4 px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center gap-2"
                variant="ghost"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back to Products List
              </Button>
              <h1 className="text-4xl font-bold text-primary">
                {viewMode === 'create' ? 'Create New Product' : `Edit Product: ${selectedProduct?.name}`}
              </h1>
              <p className="text-muted-foreground mt-2">
                {viewMode === 'create'
                  ? 'Add a new product to your catalog by completing the steps below'
                  : 'Update product information using the form below'}
              </p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
              <Stepper
                steps={steps}
                currentStep={currentStep}
                onStepClick={(stepNumber) => setCurrentStep(stepNumber)}
                allowSkip={viewMode === 'edit'}
              />
            </div>

            {/* Form Content */}
            <Card className="border-primary/50/50 bg-white/90 backdrop-blur-sm overflow-visible">
              <CardContent className="p-10 overflow-visible">

                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <ClipboardList className="w-8 h-8" aria-hidden="true" />
                        Basic Information
                      </h2>
                      <p className="text-muted-foreground mt-1">Enter the core details about your product</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">
                          Product Name <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className={cn(
                              "w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-medium shadow-sm",
                              errors.name
                                ? "border-error focus:ring-error focus:border-error"
                                : "border-border focus:ring-ring focus:border-primary"
                            )}
                            placeholder="e.g., iPhone 15 Pro Max"
                          />
                        </div>
                        {errors.name && (
                          <div className="flex items-center gap-1 mt-1 text-error text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.name}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">
                          SKU <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-mono text-sm">#</div>
                          <input
                            type="text"
                            value={formData.sku}
                            onChange={(e) => handleFieldChange('sku', e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-mono font-medium shadow-sm",
                              errors.sku
                                ? "border-error focus:ring-error focus:border-error"
                                : "border-border focus:ring-violet-500 focus:border-primary"
                            )}
                            placeholder="APL-IP15PM-256"
                          />
                        </div>
                        {errors.sku ? (
                          <div className="flex items-center gap-1 mt-1 text-error text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.sku}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Stock Keeping Unit - must be unique</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Brand</label>
                        <div className="relative">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                          <input
                            type="text"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                            placeholder="e.g., Apple, Samsung, Sony"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Slug</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-mono text-sm">/</div>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full pl-10 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-primary transition-all bg-white hover:border-border font-mono font-medium shadow-sm"
                            placeholder="Auto-generated from name if empty"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">URL-friendly version of the name</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-3">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm resize-none"
                        rows={4}
                        placeholder="Provide a detailed description of the product, its features, and benefits..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block text-sm font-bold text-foreground mb-3">
                          Category <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                            <Folder className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            value={showCategoryDropdown ? categorySearchQuery : getSelectedCategoryName()}
                            onChange={(e) => {
                              setCategorySearchQuery(e.target.value);
                              if (!showCategoryDropdown) setShowCategoryDropdown(true);
                            }}
                            onFocus={() => setShowCategoryDropdown(true)}
                            placeholder={loadingCategories ? "Loading categories..." : "Search or create category..."}
                            className="w-full pl-12 pr-10 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                          >
                            <svg className={cn("w-5 h-5 transition-transform", showCategoryDropdown && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Category Dropdown */}
                        {showCategoryDropdown && (
                          <div className="absolute z-50 w-full mt-2 bg-card border-2 border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
                            {loadingCategories ? (
                              <div className="px-4 py-3 text-muted-foreground flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading categories...
                              </div>
                            ) : (
                              <>
                                {/* Existing categories or default options */}
                                {getFilteredCategories().length > 0 ? (
                                  getFilteredCategories().map((cat) => {
                                    const isCategory = 'id' in cat;
                                    const id = isCategory ? (cat as Category).id : undefined;
                                    const name = cat.name;
                                    const isSelected = isCategory && formData.categoryId === id;

                                    return (
                                      <button
                                        key={isCategory ? id : name}
                                        type="button"
                                        onClick={() => {
                                          if (isCategory) {
                                            setFormData(prev => ({ ...prev, categoryId: id }));
                                            setCategorySearchQuery('');
                                            setShowCategoryDropdown(false);
                                          } else {
                                            // Create this default category
                                            handleCreateCategory(name);
                                          }
                                        }}
                                        className={cn(
                                          "w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-primary/10 transition-colors",
                                          isSelected && "bg-primary/10 text-primary"
                                        )}
                                      >
                                        {'icon' in cat ? cat.icon : <Folder className="w-4 h-4 text-primary" />}
                                        <span className="font-medium">{name}</span>
                                        {isSelected && <CheckCircle className="w-4 h-4 ml-auto text-primary" />}
                                        {!isCategory && (
                                          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                            Click to create
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-4 py-3 text-muted-foreground text-sm">
                                    No categories found
                                  </div>
                                )}

                                {/* Create new category option */}
                                {categorySearchQuery.trim() && !categories.some(c => c.name.toLowerCase() === categorySearchQuery.toLowerCase()) && (
                                  <button
                                    type="button"
                                    onClick={() => handleCreateCategory(categorySearchQuery)}
                                    disabled={creatingCategory}
                                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-success-muted transition-colors border-t border-border text-success"
                                  >
                                    {creatingCategory ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Plus className="w-4 h-4" />
                                    )}
                                    <span className="font-medium">
                                      {creatingCategory ? 'Creating...' : `Create "${categorySearchQuery}"`}
                                    </span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Click outside to close */}
                        {showCategoryDropdown && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => {
                              setShowCategoryDropdown(false);
                              setCategorySearchQuery('');
                            }}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">
                          Tenant/Vendor
                        </label>
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-muted border-2 border-border rounded-xl">
                          <Building2 className="w-5 h-5 text-primary" />
                          <span className="font-medium text-foreground">
                            {currentTenant?.name || 'Loading tenant...'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Product will be created for your current tenant
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-3">Search Keywords</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                        <input
                          type="text"
                          value={formData.searchKeywords}
                          onChange={(e) => setFormData({ ...formData, searchKeywords: e.target.value })}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                          placeholder="smartphone, premium, flagship, 5G (comma-separated)"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Help customers find this product with relevant keywords</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Pricing */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <DollarSign className="w-8 h-8" aria-hidden="true" />
                        Pricing Information
                      </h2>
                      <p className="text-muted-foreground mt-1">Set your product pricing and calculate margins</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">
                          Selling Price <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-semibold">{getCurrencySymbol(formData.currencyCode || storeCurrency)}</div>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => handleFieldChange('price', e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-medium shadow-sm",
                              errors.price
                                ? "border-error focus:ring-error focus:border-error"
                                : "border-border focus:ring-success focus:border-success"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                        {errors.price ? (
                          <div className="flex items-center gap-1 mt-1 text-error text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.price}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Price customers will pay</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Compare Price</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-semibold">{getCurrencySymbol(formData.currencyCode || storeCurrency)}</div>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.comparePrice}
                            onChange={(e) => handleFieldChange('comparePrice', e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-medium shadow-sm",
                              errors.comparePrice
                                ? "border-error focus:ring-error focus:border-error"
                                : "border-border focus:ring-ring focus:border-primary"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                        {errors.comparePrice ? (
                          <div className="flex items-center gap-1 mt-1 text-error text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.comparePrice}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Original price (shown as strikethrough)</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Cost Price</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-semibold">{getCurrencySymbol(formData.currencyCode || storeCurrency)}</div>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.costPrice}
                            onChange={(e) => handleFieldChange('costPrice', e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-medium shadow-sm",
                              errors.costPrice
                                ? "border-error focus:ring-error focus:border-error"
                                : "border-border focus:ring-orange-500 focus:border-warning"
                            )}
                            placeholder="0.00"
                          />
                        </div>
                        {errors.costPrice ? (
                          <div className="flex items-center gap-1 mt-1 text-error text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.costPrice}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">Your cost for this product</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center p-6 bg-success-muted rounded-xl border-2 border-success/30">
                      <div className="text-sm w-full">
                        <p className="font-bold text-foreground mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" aria-hidden="true" /> Profit Margin</p>
                        <p className="text-3xl font-bold text-success">
                          {formData.price && formData.costPrice
                            ? formatCurrency(parseFloat(formData.price) - parseFloat(formData.costPrice), formData.currencyCode || storeCurrency)
                            : formatCurrency(0, formData.currencyCode || storeCurrency)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.price && formData.costPrice
                            ? `${(((parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.price)) * 100).toFixed(1)}% margin`
                            : '0% margin'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Inventory */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Package className="w-8 h-8" aria-hidden="true" />
                        Inventory & Shipping
                      </h2>
                      <p className="text-muted-foreground mt-1">Manage stock levels and physical properties</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Stock Quantity</label>
                        <div className="relative">
                          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                          <input
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value) || 0)}
                            className={cn(
                              "w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-medium shadow-sm",
                              errors.quantity
                                ? "border-error focus:ring-error focus:border-error"
                                : "border-border focus:ring-ring focus:border-primary"
                            )}
                            placeholder="0"
                          />
                        </div>
                        {errors.quantity && (
                          <div className="flex items-center gap-1 mt-1 text-error text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.quantity}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Min Order Qty</label>
                        <input
                          type="number"
                          value={formData.minOrderQty}
                          onChange={(e) => setFormData({ ...formData, minOrderQty: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Max Order Qty</label>
                        <input
                          type="number"
                          value={formData.maxOrderQty || ''}
                          onChange={(e) => setFormData({ ...formData, maxOrderQty: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                          placeholder="No limit"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Low Stock Alert</label>
                        <div className="relative">
                          <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                          <input
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 10 })}
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-warning focus:border-warning transition-all bg-white hover:border-border font-medium shadow-sm"
                            placeholder="10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-3">Weight</label>
                        <div className="relative">
                          <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                          <input
                            type="text"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                            placeholder="e.g., 250g, 1.5kg, 2lbs"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Used for shipping calculations</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-1"><Ruler className="w-4 h-4" aria-hidden="true" /> Dimensions (L × W × H)</label>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <input
                            type="text"
                            value={formData.dimensions?.length}
                            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: e.target.value } as any })}
                            className="px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                            placeholder="Length"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={formData.dimensions?.width}
                            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: e.target.value } as any })}
                            className="px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                            placeholder="Width"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={formData.dimensions?.height}
                            onChange={(e) => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: e.target.value } as any })}
                            className="px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                            placeholder="Height"
                          />
                        </div>
                        <div>
                          <Select
                            value={formData.dimensions?.unit || 'cm'}
                            onChange={(value) => setFormData({ ...formData, dimensions: { ...formData.dimensions, unit: value } as any })}
                            options={[
                              { value: 'cm', label: 'cm', icon: <Ruler className="w-4 h-4 text-muted-foreground" /> },
                              { value: 'in', label: 'inches', icon: <Ruler className="w-4 h-4 text-muted-foreground" /> },
                              { value: 'm', label: 'meters', icon: <Ruler className="w-4 h-4 text-muted-foreground" /> },
                              { value: 'ft', label: 'feet', icon: <Ruler className="w-4 h-4 text-muted-foreground" /> },
                            ]}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Package dimensions for shipping</p>
                    </div>

                    {/* Warehouse & Supplier Section */}
                    <div className="mt-8 pt-6 border-t border-border">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-primary" />
                        Warehouse & Supplier (Optional)
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">Link this product to a warehouse and supplier for inventory tracking. New names will be automatically created.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-3">Warehouse</label>
                          <div className="relative">
                            <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                            <input
                              type="text"
                              value={formData.warehouseName || ''}
                              onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                              className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                              placeholder="e.g., Main Warehouse, NYC Fulfillment"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Enter warehouse name - auto-created if new</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-foreground mb-3">Supplier</label>
                          <div className="relative">
                            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                            <input
                              type="text"
                              value={formData.supplierName || ''}
                              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                              className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                              placeholder="e.g., Acme Corp, Global Supplies"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Enter supplier name - auto-created if new</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Media & Tags */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Images className="w-8 h-8" aria-hidden="true" />
                        Media & Tags
                      </h2>
                      <p className="text-muted-foreground mt-1">Add images and tags to make your product discoverable</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-foreground">Product Images</label>
                        <span className="text-xs px-2 py-1 bg-warning-muted text-warning-muted-foreground rounded-lg font-medium">
                          {primaryImageCount}/{MAX_PRIMARY_IMAGES} Primary Selected
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Click the <Star className="h-3 w-3 inline text-warning" /> star to mark up to 3 primary images. Primary images are featured prominently in the storefront.
                      </p>

                      {/* Uploaded Images Grid */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {uploadedImages.map((img, index) => (
                            <div
                              key={img.id}
                              className={cn(
                                "relative group aspect-square rounded-xl overflow-hidden border-2 bg-muted",
                                img.isPrimary ? "border-warning ring-2 ring-warning/20" : "border-border"
                              )}
                            >
                              <img
                                src={img.url}
                                alt={img.fileName}
                                className="w-full h-full object-cover"
                              />

                              {/* Primary Badge */}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                {img.isPrimary ? (
                                  <span className="px-2 py-1 bg-warning text-warning-foreground text-xs rounded-lg font-semibold flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" /> Primary
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-muted-foreground/70 text-white text-xs rounded font-medium">
                                    #{index + 1}
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons (visible on hover) */}
                              <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Toggle Primary */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePrimary(img.id)}
                                  disabled={!img.isPrimary && primaryImageCount >= MAX_PRIMARY_IMAGES}
                                  className={cn(
                                    "p-1.5 rounded-full shadow-md transition-colors",
                                    img.isPrimary
                                      ? "bg-warning text-warning-foreground hover:bg-warning/90"
                                      : primaryImageCount >= MAX_PRIMARY_IMAGES
                                        ? "bg-neutral-muted text-neutral-muted-foreground cursor-not-allowed"
                                        : "bg-white text-foreground hover:bg-warning-muted hover:text-warning"
                                  )}
                                  title={img.isPrimary ? "Remove from primary" : primaryImageCount >= MAX_PRIMARY_IMAGES ? "Max 3 primary images" : "Mark as primary"}
                                >
                                  <Star className={cn("h-4 w-4", img.isPrimary && "fill-current")} />
                                </button>
                                {/* Move Up */}
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(img.id, 'up')}
                                    className="p-1.5 bg-white text-foreground rounded-full shadow-md hover:bg-primary/10 hover:text-primary transition-colors"
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </button>
                                )}
                                {/* Move Down */}
                                {index < uploadedImages.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveImage(img.id, 'down')}
                                    className="p-1.5 bg-white text-foreground rounded-full shadow-md hover:bg-primary/10 hover:text-primary transition-colors"
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </button>
                                )}
                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(img.id)}
                                  className="p-1.5 bg-error text-error-foreground rounded-full shadow-md hover:bg-error/90 transition-colors"
                                  title="Remove image"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Filename Footer */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/30 p-2">
                                <p className="text-white text-xs truncate">{img.fileName}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Area */}
                      {!selectedProduct ? (
                        // Create mode - show message to save first
                        <div className="border-2 border-dashed border-warning/50 rounded-xl p-8 text-center bg-warning-muted">
                          <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
                          <p className="text-lg text-warning-muted-foreground font-bold mb-2">Save Product First</p>
                          <p className="text-sm text-warning-muted-foreground mb-4">
                            Please complete the product details and save the product before uploading images.
                          </p>
                          <p className="text-xs text-warning-muted-foreground">
                            This ensures images are properly organized with your product.
                          </p>
                        </div>
                      ) : (
                        // Edit mode - allow uploads
                        <label
                          className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center transition-all bg-muted cursor-pointer block",
                            uploadingImages ? "border-primary/70 bg-primary/10" : "border-border hover:border-primary/70"
                          )}
                        >
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="hidden"
                            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                            disabled={uploadingImages}
                          />

                          {uploadingImages ? (
                            <div className="py-4">
                              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                              <div className="w-full max-w-xs mx-auto h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-sm text-muted-foreground mt-3">Uploading... {uploadProgress}%</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-lg text-foreground font-bold mb-2">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground mb-1">PNG, JPG, GIF, WebP up to 10MB each</p>
                              <p className="text-sm text-muted-foreground">First image will be the primary product image</p>
                              <div className="mt-4">
                                <span className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg inline-block">
                                  Choose Files
                                </span>
                              </div>
                            </>
                          )}
                        </label>
                      )}

                      <p className="text-xs text-muted-foreground mt-3">
                        Images are stored in GCP Cloud Storage under your product's unique folder.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-foreground mb-3">Product Tags</label>
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Check if comma was just typed - add tag immediately
                            if (value.includes(',')) {
                              const parts = value.split(',');
                              const newTag = parts[0].trim();
                              if (newTag && !((formData.tags as string[]) || []).includes(newTag)) {
                                setFormData({
                                  ...formData,
                                  tags: [...((formData.tags as string[]) || []), newTag],
                                });
                              }
                              // Set remaining input after comma (usually empty or next tag start)
                              setTagInput(parts.slice(1).join(',').trim());
                            } else {
                              setTagInput(value);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Add tag on Enter
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const newTag = tagInput.trim();
                              if (newTag && !((formData.tags as string[]) || []).includes(newTag)) {
                                setFormData({
                                  ...formData,
                                  tags: [...((formData.tags as string[]) || []), newTag],
                                });
                              }
                              setTagInput('');
                            }
                            // Remove last tag on Backspace if input is empty
                            if (e.key === 'Backspace' && !tagInput && Array.isArray(formData.tags) && formData.tags.length > 0) {
                              setFormData({
                                ...formData,
                                tags: (formData.tags as string[]).slice(0, -1),
                              });
                            }
                          }}
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm"
                          placeholder="Type a tag and press Enter or comma to add"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Press Enter or comma to add tags. Backspace removes the last tag.</p>

                      {Array.isArray(formData.tags) && formData.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <span key={index} className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-2 border border-primary/30 shadow-sm">
                              <Tag className="w-3 h-3 inline-block" aria-hidden="true" /> {tag}
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, tags: (formData.tags as string[]).filter((_, i) => i !== index) })}
                                className="hover:text-error font-bold text-lg transition-colors ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-success" aria-hidden="true" />
                        Review & Confirm
                      </h2>
                      <p className="text-muted-foreground mt-1">Review all product details before saving</p>
                    </div>

                    <div className="bg-muted rounded-xl p-8 border-2 border-primary/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-bold text-muted-foreground mb-2">Product Name</p>
                          <p className="text-lg font-semibold text-foreground">{formData.name || '—'}</p>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-muted-foreground mb-2">SKU</p>
                          <p className="text-lg font-semibold text-foreground font-mono">{formData.sku || '—'}</p>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-muted-foreground mb-2">Brand</p>
                          <p className="text-lg font-semibold text-foreground">{formData.brand || '—'}</p>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-muted-foreground mb-2">Price</p>
                          <p className="text-2xl font-bold text-success">
                            {formatCurrency(formData.price || 0, formData.currencyCode || storeCurrency)}
                          </p>
                          {formData.comparePrice && (
                            <p className="text-sm text-muted-foreground line-through">{formatCurrency(formData.comparePrice, formData.currencyCode || storeCurrency)}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-muted-foreground mb-2">Stock Quantity</p>
                          <p className="text-lg font-semibold text-foreground">{formData.quantity || 0} units</p>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-muted-foreground mb-2">Weight</p>
                          <p className="text-lg font-semibold text-foreground">{formData.weight || '—'}</p>
                        </div>

                        {formData.warehouseName && (
                          <div>
                            <p className="text-sm font-bold text-muted-foreground mb-2">Warehouse</p>
                            <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <Warehouse className="w-5 h-5 inline-block" aria-hidden="true" /> {formData.warehouseName}
                            </p>
                          </div>
                        )}

                        {formData.supplierName && (
                          <div>
                            <p className="text-sm font-bold text-muted-foreground mb-2">Supplier</p>
                            <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <Truck className="w-5 h-5 inline-block" aria-hidden="true" /> {formData.supplierName}
                            </p>
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <p className="text-sm font-bold text-muted-foreground mb-2">Description</p>
                          <p className="text-foreground">{formData.description || 'No description provided'}</p>
                        </div>

                        {Array.isArray(formData.tags) && formData.tags.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-bold text-muted-foreground mb-2">Tags</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {formData.tags.map((tag, index) => (
                                <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-warning-muted border-2 border-warning/30 rounded-xl p-6">
                      <p className="text-warning-muted-foreground font-semibold flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" aria-hidden="true" />
                        You can edit these details anytime after creating the product
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <StepperNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onNext={handleNextStep}
                  onPrevious={handlePreviousStep}
                  onSave={handleSaveProduct}
                  onCancel={navigateToList}
                  saveLabel={viewMode === 'create' ? 'Create Product' : 'Save Changes'}
                />
              </CardContent>
            </Card>
          </div>
        </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.PRODUCTS_READ}
      fallback="styled"
      fallbackTitle="Products Access Required"
      fallbackDescription="You don't have the required permissions to view products. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/', icon: Home },
            { label: 'Products', icon: Package },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-primary">
              Products Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your product catalog and inventory
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={loadProducts}
              disabled={loading}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-border"
              title="Refresh products"
              aria-label="Refresh products list"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} aria-hidden="true" />
            </Button>
            <PermissionGate permission={Permission.PRODUCTS_IMPORT}>
              <Button
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-primary/50 transition-all duration-200"
              >
                <FileUp className="w-4 h-4" />
                Bulk Import
              </Button>
            </PermissionGate>
            <PermissionGate permission={Permission.PRODUCTS_CREATE}>
              <Button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                + Add Product
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Error Alert */}
        <PageError error={error} onDismiss={() => setError(null)} />

        {/* Stats Cards */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              {
                label: "Total Products",
                value: products.length,
                icon: Package,
                textColor: "text-primary",
                bgColor: "bg-primary/10",
              },
              {
                label: "Active",
                value: products.filter(p => p.status === 'ACTIVE').length,
                icon: CheckCircle,
                textColor: "text-success",
                bgColor: "bg-success/10",
              },
              {
                label: "Low Stock",
                value: products.filter(p => p.inventoryStatus === 'LOW_STOCK').length,
                icon: AlertTriangle,
                textColor: "text-warning",
                bgColor: "bg-warning/10",
              },
              {
                label: "Out of Stock",
                value: products.filter(p => p.inventoryStatus === 'OUT_OF_STOCK').length,
                icon: PackageX,
                textColor: "text-destructive",
                bgColor: "bg-destructive/10",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border-border/50 hover:border-primary/30 transition-all duration-300 group cursor-default">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className={`text-3xl font-bold ${stat.textColor} mt-2 group-hover:scale-105 transition-transform origin-left`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor} border border-border group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 border-border/50 shadow-lg overflow-visible relative z-40">
          <CardContent className="p-6 overflow-visible relative">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2">
                <Label className="text-foreground font-semibold mb-2 block">
                  Search
                </Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, SKU, or brand..."
                  className="border-border focus:border-primary/70"
                />
              </div>

              <div>
                <Label className="text-foreground font-semibold mb-2 block">
                  Status
                </Label>
                <Select
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as any)}
                  options={[
                    { value: 'ALL', label: 'All Status', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'ACTIVE', label: 'Active', icon: <CheckCircle2 className="w-4 h-4 text-success" /> },
                    { value: 'DRAFT', label: 'Draft', icon: <FileEdit className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'PENDING', label: 'Pending', icon: <Clock className="w-4 h-4 text-warning" /> },
                    { value: 'INACTIVE', label: 'Inactive', icon: <CircleOff className="w-4 h-4 text-error" /> },
                    { value: 'ARCHIVED', label: 'Archived', icon: <Archive className="w-4 h-4 text-neutral" /> },
                    { value: 'REJECTED', label: 'Rejected', icon: <XCircle className="w-4 h-4 text-error" /> },
                  ]}
                  variant="filter"
                />
              </div>

              <div>
                <Label className="text-foreground font-semibold mb-2 block">
                  Inventory
                </Label>
                <Select
                  value={inventoryStatusFilter}
                  onChange={(value) => setInventoryStatusFilter(value as any)}
                  options={[
                    { value: 'ALL', label: 'All Inventory', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'IN_STOCK', label: 'In Stock', icon: <PackageCheck className="w-4 h-4 text-success" /> },
                    { value: 'LOW_STOCK', label: 'Low Stock', icon: <AlertTriangle className="w-4 h-4 text-warning" /> },
                    { value: 'OUT_OF_STOCK', label: 'Out of Stock', icon: <PackageX className="w-4 h-4 text-error" /> },
                    { value: 'BACK_ORDER', label: 'Back Order', icon: <RotateCcw className="w-4 h-4 text-primary" /> },
                    { value: 'DISCONTINUED', label: 'Discontinued', icon: <Ban className="w-4 h-4 text-muted-foreground" /> },
                  ]}
                  variant="filter"
                />
              </div>

              <div>
                <Label className="text-foreground font-semibold mb-2 block">
                  Brand
                </Label>
                <Select
                  value={brandFilter}
                  onChange={(value) => setBrandFilter(value)}
                  options={[
                    { value: 'ALL', label: 'All Brands', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                    ...uniqueBrands.map((brand) => ({
                      value: brand!,
                      label: brand!,
                      icon: <Tag className="w-4 h-4 text-primary" />,
                    })),
                  ]}
                  variant="filter"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedProducts.size > 0 && (
          <Card className="border-primary/30 bg-muted">
            <CardContent className="py-3 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-primary">
                    {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProducts(new Set())}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Status Change Buttons */}
                  <PermissionGate permission={Permission.PRODUCTS_UPDATE}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('ACTIVE')}
                      className="bg-success-muted border-success/40 text-success hover:bg-success/20"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('PENDING')}
                      className="bg-warning-muted border-warning/40 text-warning hover:bg-warning/20"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Pending
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('DRAFT')}
                      className="bg-neutral-muted border-neutral/40 text-neutral-muted-foreground hover:bg-neutral/20"
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Draft
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('ARCHIVED')}
                      className="bg-neutral-muted border-neutral/40 text-neutral-muted-foreground hover:bg-neutral/20"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('REJECTED')}
                      className="bg-error-muted border-error/40 text-error hover:bg-error/20"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </PermissionGate>
                  <div className="w-px h-6 bg-border mx-2" />
                  <PermissionGate permission={Permission.PRODUCTS_DELETE}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="bg-error hover:bg-error/90"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            {paginatedProducts.length > 0 && (
              <div className="flex items-center gap-3 px-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground font-medium">
                    Select all ({paginatedProducts.length})
                  </span>
                </label>
              </div>
            )}

            {/* Product Cards */}
            <div className="grid gap-4">
              {paginatedProducts.map((product) => (
                <Card
                  key={product.id}
                  className={cn(
                    "group border-border/50 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 overflow-visible bg-white",
                    selectedProducts.has(product.id) && "ring-2 ring-blue-500 border-primary/30 bg-primary/5"
                  )}
                >
                  <CardContent className="p-0 overflow-visible">
                    <div className="flex items-stretch">
                      {/* Left accent bar */}
                      <div className={cn(
                        "w-1.5 flex-shrink-0 rounded-l-2xl transition-colors",
                        product.status === 'ACTIVE' ? "bg-success" :
                        product.status === 'DRAFT' ? "bg-muted-foreground" :
                        product.status === 'PENDING' ? "bg-warning" :
                        "bg-destructive"
                      )} />

                      <div className="flex-1 p-5">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer transition-colors hover:border-primary/70"
                            />
                          </div>

                          {/* Product Thumbnail */}
                          <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 border-border bg-muted">
                            {(() => {
                              const imageUrl = product.images?.[0]
                                ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
                                : null;
                              return imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null;
                            })()}
                            <div className={cn("w-full h-full flex items-center justify-center", product.images?.[0] && "hidden")}>
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            {/* Header row */}
                            <div className="flex items-center gap-3 mb-4">
                              <button
                                onClick={() => handleViewProduct(product)}
                                className="text-lg font-bold text-foreground truncate hover:text-primary transition-colors text-left group-hover:text-primary"
                              >
                                {product.name}
                              </button>
                              {getStatusBadge(product.status)}
                              {getInventoryBadge(product.inventoryStatus)}
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-muted rounded-xl p-3 border border-border">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">SKU</p>
                                <p className="text-foreground font-mono font-semibold text-sm">{product.sku}</p>
                              </div>

                              <div className="bg-muted rounded-xl p-3 border border-border">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Brand</p>
                                <p className="text-foreground font-semibold text-sm">{product.brand || 'N/A'}</p>
                              </div>

                              <div className="bg-success-muted rounded-xl p-3 border border-success/20">
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Price</p>
                                <p className="text-xl font-bold text-success">
                                  {formatCurrency(product.price, product.currencyCode || storeCurrency)}
                                </p>
                                {product.comparePrice && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(product.comparePrice, product.currencyCode || storeCurrency)}
                                  </p>
                                )}
                              </div>

                              <div className={cn(
                                "rounded-xl p-3 border",
                                product.lowStockThreshold && (product.quantity || 0) <= product.lowStockThreshold
                                  ? "bg-warning-muted border-warning/30"
                                  : "bg-info-muted border-info/30"
                              )}>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Stock</p>
                                <p className={cn(
                                  "font-bold text-sm",
                                  product.lowStockThreshold && (product.quantity || 0) <= product.lowStockThreshold
                                    ? "text-warning"
                                    : "text-info"
                                )}>
                                  {product.quantity || 0} units
                                </p>
                                {product.lowStockThreshold && (product.quantity || 0) <= product.lowStockThreshold && (
                                  <p className="text-xs text-warning-muted-foreground font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Low stock
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
                            )}

                            {/* Meta tags */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {product.weight && (
                                <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-lg font-medium border border-border flex items-center gap-1">
                                  <Scale className="w-3 h-3" /> {product.weight}
                                </span>
                              )}
                              {product.currencyCode && (
                                <span className="px-2.5 py-1 bg-success-muted text-success-muted-foreground rounded-lg font-medium border border-success/30">
                                  {product.currencyCode}
                                </span>
                              )}
                              {product.averageRating && (
                                <span className="px-2.5 py-1 bg-warning-muted text-warning-muted-foreground rounded-lg font-medium border border-warning/30 flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-warning text-warning inline-block" aria-hidden="true" /> {product.averageRating.toFixed(1)} ({product.reviewCount})
                                </span>
                              )}
                            </div>
                          </div>

                        </div>

                        {/* Action Buttons - Horizontal row at bottom */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {product.createdAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(product.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                              title="View Details"
                              aria-label="View product details"
                            >
                              <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                            <PermissionGate permission={Permission.PRODUCTS_UPDATE}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                                title="Edit"
                                aria-label="Edit product"
                              >
                                <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                              </Button>
                            </PermissionGate>
                            <PermissionGate permission={Permission.PRODUCTS_DELETE}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                                title="Delete"
                                aria-label="Delete product"
                              >
                                <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {paginatedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No products found</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Try adjusting your filters or create a new product
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={() => {
          modalConfig.onConfirm();
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => {
          loadProducts();
          setShowBulkImport(false);
        }}
        entityType="products"
        entityLabel="Products"
        tenantId={currentTenant?.id}
      />

      {/* Cascade Delete Modal */}
      <CascadeDeleteModal
        isOpen={cascadeDeleteConfig.isOpen}
        onClose={() => setCascadeDeleteConfig({ ...cascadeDeleteConfig, isOpen: false })}
        onSuccess={handleCascadeDeleteSuccess}
        products={cascadeDeleteConfig.products}
        isBulk={cascadeDeleteConfig.isBulk}
      />

      {/* Image Upload Progress Modal */}
      <ImageUploadProgressModal
        isOpen={showUploadModal}
        onClose={handleUploadModalClose}
        files={uploadingFiles}
      />
    </>
    </PermissionGate>
  );
}

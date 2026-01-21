"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import {
  AdminUIText,
  AdminPageTitle,
  AdminButtonText,
  AdminTableHeader,
  AdminMessage,
  AdminFormLabel,
} from '@/components/translation/AdminTranslatedText';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Tags,
  CheckCircle,
  XCircle,
  X,
  Save,
  Filter,
  Folder,
  FolderOpen,
  RefreshCw,
  AlertCircle,
  Loader2,
  Home,
  Tag,
  FileEdit,
  Clock,
  CheckCircle2,
  Circle,
  CircleOff,
  FileUp,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select, SelectOption } from '@/components/Select';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { categoryService } from '@/lib/services/categoryService';
import { Category, CreateCategoryRequest, UpdateCategoryRequest, DefaultMediaURLs } from '@/lib/api/types';
import { BulkImportModal } from '@/components/BulkImportModal';
import { CategoryIconUploader, CategoryBannerUploader, MediaItem } from '@/components/MediaUploader';

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
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

// Helper function to convert technical errors to user-friendly messages
const getUserFriendlyError = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Server errors
    if (message.includes('500') || message.includes('internal server')) {
      return 'We\'re experiencing technical difficulties. Our team has been notified. Please try again later.';
    }

    // Not found errors
    if (message.includes('404') || message.includes('not found')) {
      return 'The requested item could not be found. It may have been deleted.';
    }

    // Unauthorized/Authentication errors
    if (message.includes('401') || message.includes('unauthorized') || message.includes('403')) {
      return 'You don\'t have permission to perform this action. Please contact your administrator.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return error.message; // Keep validation messages as-is since they're usually user-friendly
    }

    // Timeout errors
    if (message.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }

    // JSON parsing errors (from failed API responses)
    if (message.includes('json') || message.includes('unexpected')) {
      return 'Unable to process the server response. Please try again or contact support.';
    }

    // Default for other Error instances
    return 'An unexpected error occurred. Please try again.';
  }

  // For non-Error objects
  return 'An error occurred. Please try again.';
};

export default function CategoriesPage() {
  const params = useParams();
  const tenantSlug = params?.slug as string;
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [urlInitialized, setUrlInitialized] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['1', '4']));
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT'>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

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

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    parentId: string | null;
    status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DRAFT';
    isActive: boolean;
    imageUrl: string;
    bannerUrl: string;
  }>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    status: 'APPROVED',
    isActive: true,
    imageUrl: '',
    bannerUrl: '',
  });

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'name':
        if (!value || value.trim() === '') return 'Category name is required';
        if (value.length < 2) return 'Category name must be at least 2 characters';
        if (value.length > 100) return 'Category name must not exceed 100 characters';
        return null;
      case 'slug':
        if (!value || value.trim() === '') return 'Slug is required';
        if (value.length < 2) return 'Slug must be at least 2 characters';
        if (!/^[a-z0-9-]+$/.test(value)) return 'Slug can only contain lowercase letters, numbers, and hyphens';
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    ['name', 'slug'].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load categories on mount and when tenant changes
  // Wait for tenant context to be ready to ensure correct tenant ID header
  useEffect(() => {
    // Don't fetch if tenant is still loading or not set
    if (tenantLoading || !currentTenant) {
      return;
    }

    // Reset state when tenant changes
    setCategories([]);
    setSelectedCategory(null);
    setViewMode('list');
    setError(null);
    setSelectedCategories(new Set());
    loadCategories();
  }, [tenantSlug, currentTenant?.id, tenantLoading]);

  // Sync URL params with view state
  useEffect(() => {
    if (loading || !categories.length) return;

    const categoryId = searchParams.get('id');
    const mode = searchParams.get('mode');

    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        setSelectedCategory(category);
        if (mode === 'edit') {
          setViewMode('edit');
          setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            parentId: category.parentId || null,
            status: category.status,
            isActive: category.isActive,
            imageUrl: category.imageUrl || '',
            bannerUrl: category.bannerUrl || '',
          });
        } else {
          setViewMode('detail');
        }
      }
    } else if (mode === 'create') {
      setViewMode('create');
      setSelectedCategory(null);
    } else {
      setViewMode('list');
      setSelectedCategory(null);
    }
    setUrlInitialized(true);
  }, [searchParams, categories, loading]);

  // Navigation helpers with URL updates
  const navigateToList = useCallback(() => {
    router.push('/categories');
  }, [router]);

  const navigateToCategory = useCallback((categoryId: string, mode: 'view' | 'edit' = 'view') => {
    if (mode === 'edit') {
      router.push(`/categories?id=${categoryId}&mode=edit`);
    } else {
      router.push(`/categories?id=${categoryId}`);
    }
  }, [router]);

  const navigateToCreate = useCallback(() => {
    router.push('/categories?mode=create');
  }, [router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search categories..."]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Ctrl/Cmd + N: New category
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (viewMode === 'list') {
          handleCreateCategory();
        }
      }

      // Escape: Close modal/form or clear search
      if (e.key === 'Escape') {
        if (viewMode !== 'list') {
          navigateToList();
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }

      // Forward slash: Focus search (like GitHub)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search categories..."]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, searchQuery]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all categories at once (limit=1000) to maintain hierarchical view
      // Categories rarely exceed a few hundred even for large stores
      const response = await categoryService.getCategories({ limit: 1000 });
      setCategories(response.data);
    } catch (err) {
      setError(getUserFriendlyError(err));
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cat.status === statusFilter;
    const matchesActive = activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && cat.isActive) ||
      (activeFilter === 'INACTIVE' && !cat.isActive);
    return matchesSearch && matchesStatus && matchesActive;
  });

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryChildren = (parentId: string | null) => {
    return filteredCategories.filter(cat =>
      !parentId ? !cat.parentId : cat.parentId === parentId
    );
  };

  const handleCreateCategory = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: null,
      status: 'APPROVED',
      isActive: true,
      imageUrl: '',
      bannerUrl: '',
    });
    setViewMode('create');
    navigateToCreate();
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || null,
      status: category.status,
      isActive: category.isActive,
      imageUrl: category.imageUrl || '',
      bannerUrl: category.bannerUrl || '',
    });
    setViewMode('edit');
    navigateToCategory(category.id, 'edit');
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setViewMode('detail');
    navigateToCategory(category.id, 'view');
  };

  const handleSaveCategory = async () => {
    if (!validateForm()) {
      setError('Please fix the validation errors in the form before submitting.');
      return;
    }

    try {
      if (viewMode === 'create') {
        await categoryService.createCategory(formData as CreateCategoryRequest);
      } else if (viewMode === 'edit' && selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, formData as UpdateCategoryRequest);
      }
      await loadCategories();
      navigateToList();
      setErrors({});
    } catch (err) {
      setError(getUserFriendlyError(err));
      console.error('Error saving category:', err);
    }
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    setModalConfig({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category?.name}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await categoryService.deleteCategory(id);
          await loadCategories();
          if (selectedCategory?.id === id) {
            navigateToList();
          }
        } catch (err) {
          setError(getUserFriendlyError(err));
          console.error('Error deleting category:', err);
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedCategories.size > 0) {
      setModalConfig({
        isOpen: true,
        title: 'Delete Multiple Categories',
        message: `Are you sure you want to delete ${selectedCategories.size} ${selectedCategories.size === 1 ? 'category' : 'categories'}? This action cannot be undone.`,
        variant: 'danger',
        onConfirm: async () => {
          try {
            await categoryService.bulkDeleteCategories(Array.from(selectedCategories));
            await loadCategories();
            setSelectedCategories(new Set());
          } catch (err) {
            setError(getUserFriendlyError(err));
            console.error('Error bulk deleting categories:', err);
          }
        },
      });
    }
  };

  const handleBulkActivate = async (active: boolean) => {
    if (selectedCategories.size === 0) return;

    try {
      const ids = Array.from(selectedCategories);
      await categoryService.bulkUpdateCategoryActiveStatus(ids, active);
      // Update local state to reflect the change
      setCategories(categories.map(cat =>
        selectedCategories.has(cat.id) ? { ...cat, isActive: active } : cat
      ));
      setSelectedCategories(new Set());
    } catch (error) {
      console.error('Failed to update category active status:', error);
      // Reload categories on error to ensure consistency
      await loadCategories();
    }
  };

  // Bulk status change handler for approval workflow
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedCategories.size === 0) return;

    try {
      setLoading(true);
      const ids = Array.from(selectedCategories);
      const response = await categoryService.bulkUpdateCategoryStatus(ids, newStatus);

      if (response.success) {
        // Update local state to reflect the change
        setCategories(categories.map(cat =>
          selectedCategories.has(cat.id) ? { ...cat, status: newStatus as any } : cat
        ));
        setSelectedCategories(new Set());
      }
    } catch (error) {
      console.error('Failed to update category status:', error);
      // Reload categories on error to ensure consistency
      await loadCategories();
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectCategory = (id: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCategories(newSelected);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  const handleNameChange = (name: string) => {
    const newSlug = generateSlug(name);
    setFormData({ ...formData, name, slug: newSlug });

    // Validate both name and slug
    const nameError = validateField('name', name);
    const slugError = validateField('slug', newSlug);
    setErrors(prev => ({
      ...prev,
      name: nameError || '',
      slug: slugError || ''
    }));
  };

  const renderCategoryTree = (parentId: string | null = null, level: number = 0) => {
    const children = getCategoryChildren(parentId);

    return children.map((category) => {
      const hasChildren = categories.some(c => c.parentId === category.id);
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategories.has(category.id);

      return (
        <div key={category.id}>
          <div
            className={cn(
              "group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 mb-2 cursor-pointer",
              isSelected && "bg-primary/10 border-primary/50 shadow-sm",
              !isSelected && "bg-card border-border hover:border-primary/30 hover:bg-muted"
            )}
            style={{ marginLeft: `${level * 24}px` }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelectCategory(category.id);
                }}
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
              />

              {/* Expand/Collapse */}
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(category.id);
                  }}
                  className="p-1 h-auto hover:bg-muted rounded transition-colors"
                  aria-label={isExpanded ? "Collapse category" : "Expand category"}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </Button>
              )}
              {!hasChildren && <div className="w-6" />}

              {/* Category Thumbnail */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border-2",
                category.level === 0
                  ? "border-primary/30"
                  : "border-border"
              )}>
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={cn(
                  "w-full h-full flex items-center justify-center",
                  category.imageUrl && "hidden",
                  category.level === 0 ? "bg-gradient-to-br from-blue-100 to-violet-100" : "bg-muted"
                )}>
                  {category.level === 0 ? (
                    <Folder className="w-4 h-4 text-primary" />
                  ) : (
                    <Tags className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Category Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCategory(category);
                    }}
                    className="font-semibold text-foreground truncate hover:text-primary hover:underline transition-colors text-left"
                  >
                    {category.name}
                  </button>
                  <div className="flex items-center gap-1">
                    {category.isActive ? (
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-error" />
                    )}
                    <Badge
                      variant={
                        category.status?.toUpperCase() === 'APPROVED' ? 'success'
                        : category.status?.toUpperCase() === 'PENDING' ? 'warning'
                        : category.status?.toUpperCase() === 'DRAFT' ? 'neutral'
                        : 'error'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {category.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate">{category.description || 'No description'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewCategory(category);
                }}
                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                title="View Details"
                aria-label="View category details"
              >
                <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
              </Button>
              <PermissionGate permission={Permission.CATEGORIES_UPDATE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(category);
                  }}
                  className="h-8 w-8 p-0 rounded-lg hover:bg-violet-50 transition-colors"
                  title="Edit"
                  aria-label="Edit category"
                >
                  <Edit className="w-4 h-4 text-violet-600" aria-hidden="true" />
                </Button>
              </PermissionGate>
              <PermissionGate permission={Permission.CATEGORIES_DELETE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category.id);
                  }}
                  className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                  title="Delete"
                  aria-label="Delete category"
                >
                  <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                </Button>
              </PermissionGate>
            </div>
          </div>
          {isExpanded && renderCategoryTree(category.id, level + 1)}
        </div>
      );
    });
  };

  const stats = [
    {
      labelKey: "Total Categories",
      value: categories.length,
      icon: FolderTree,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50"
    },
    {
      labelKey: "Active",
      value: categories.filter(c => c.isActive).length,
      icon: CheckCircle,
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50"
    },
    {
      labelKey: "Inactive",
      value: categories.filter(c => !c.isActive).length,
      icon: XCircle,
      color: "from-red-500 to-pink-500",
      bgColor: "from-red-50 to-pink-50"
    },
    {
      labelKey: "Top Level",
      value: categories.filter(c => c.level === 0).length,
      icon: Tags,
      color: "from-violet-500 to-purple-500",
      bgColor: "from-violet-50 to-purple-50"
    }
  ];

  return (
    <PermissionGate
      permission={Permission.CATEGORIES_READ}
      fallback="styled"
      fallbackTitle="Categories Access Required"
      fallbackDescription="You don't have the required permissions to view categories. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/', icon: Home },
          { label: 'Categories', href: '/categories', icon: Folder },
          ...(viewMode === 'create' ? [{ label: 'Create', icon: Plus }] : []),
          ...(viewMode === 'edit' && selectedCategory ? [{ label: selectedCategory.name, icon: Edit }] : []),
          ...(viewMode === 'detail' && selectedCategory ? [{ label: selectedCategory.name, icon: Eye }] : []),
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-violet-900 bg-clip-text text-transparent">
              <AdminPageTitle text="Categories Management" as="span" />
            </h1>
          </div>
          <p className="text-muted-foreground"><AdminUIText text="Organize and manage product categories hierarchically" /></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={loadCategories}
              disabled={loading}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-border"
              title="Refresh"
              aria-label="Refresh categories list"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} aria-hidden="true" />
            </Button>
            <PermissionGate permission={Permission.CATEGORIES_CREATE}>
              <Button
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-primary/50 transition-all duration-200"
              >
                <FileUp className="w-4 h-4" />
                <AdminButtonText text="Bulk Import" />
              </Button>
            </PermissionGate>
            <PermissionGate permission={Permission.CATEGORIES_CREATE}>
              <Button
                onClick={handleCreateCategory}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <AdminButtonText text="Add Category" />
              </Button>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-muted border-2 border-error/20 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-error"><AdminUIText text="Error" /></h3>
            <p className="text-error-muted-foreground text-sm mt-1"><AdminMessage text={error} /></p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="p-1 h-auto rounded-lg hover:bg-error/10 transition-colors"
            aria-label="Dismiss error message"
          >
            <X className="w-4 h-4 text-error" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && categories.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <p className="text-foreground font-semibold text-lg mb-2"><AdminUIText text="Loading categories..." /></p>
            <p className="text-muted-foreground text-sm"><AdminUIText text="Please wait while we fetch your data" /></p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {!loading && categories.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-border/50 hover:border-primary/50/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground"><AdminUIText text={stat.labelKey} /></p>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mt-2 group-hover:scale-105 transition-transform`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgColor} border border-border group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Search and Filters */}
      {!loading && (
      <Card className="border-border/50 overflow-visible relative z-40">
        <CardContent className="p-6 overflow-visible relative">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-auto hover:bg-muted rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-4 py-3 rounded-xl transition-all flex items-center gap-2",
                  showFilters
                    ? "bg-primary/20 text-primary border-2 border-primary/50"
                    : "bg-muted text-foreground border-2 border-border hover:bg-muted"
                )}
              >
                <Filter className="w-5 h-5" />
                <AdminButtonText text="Filters" />
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 p-5 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-border shadow-sm animate-in slide-in-from-top-2 duration-200 relative z-50">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider"><AdminFormLabel text="Status" as="span" /></label>
                  <Select
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as any)}
                    options={[
                      { value: 'ALL', label: 'All Status', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                      { value: 'DRAFT', label: 'Draft', icon: <FileEdit className="w-4 h-4 text-muted-foreground" /> },
                      { value: 'PENDING', label: 'Pending', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
                      { value: 'APPROVED', label: 'Approved', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
                      { value: 'REJECTED', label: 'Rejected', icon: <XCircle className="w-4 h-4 text-red-500" /> },
                    ]}
                    variant="filter"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider"><AdminFormLabel text="Active State" as="span" /></label>
                  <Select
                    value={activeFilter}
                    onChange={(value) => setActiveFilter(value as any)}
                    options={[
                      { value: 'ALL', label: 'All States', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                      { value: 'ACTIVE', label: 'Active Only', icon: <Circle className="w-4 h-4 text-green-500 fill-green-500" /> },
                      { value: 'INACTIVE', label: 'Inactive Only', icon: <CircleOff className="w-4 h-4 text-red-500" /> },
                    ]}
                    variant="filter"
                  />
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setActiveFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 bg-card border-2 border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted hover:border-border transition-all self-end shadow-sm hover:shadow-md"
                >
                  <AdminButtonText text="Clear All" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Bulk Actions Bar */}
      {selectedCategories.size > 0 && (
        <Card className="border-primary/30 bg-muted">
          <CardContent className="py-3 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-primary">
                  {selectedCategories.size} {selectedCategories.size === 1 ? 'category' : 'categories'} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategories(new Set())}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <AdminButtonText text="Clear selection" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {/* Status Change Buttons */}
                <PermissionGate permission={Permission.CATEGORIES_UPDATE}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange('APPROVED')}
                    className="bg-success-muted border-success/30 text-success-muted-foreground hover:bg-success-muted/80"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <AdminButtonText text="Approve" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange('PENDING')}
                    className="bg-warning-muted border-warning/30 text-warning-muted-foreground hover:bg-warning-muted/80"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    <AdminButtonText text="Pending" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange('DRAFT')}
                    className="bg-neutral-muted border-neutral/30 text-neutral-muted-foreground hover:bg-neutral-muted/80"
                  >
                    <FileEdit className="w-4 h-4 mr-2" />
                    <AdminButtonText text="Draft" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange('REJECTED')}
                    className="bg-error-muted border-error/30 text-error hover:bg-error-muted/80"
                  >
                    <CircleOff className="w-4 h-4 mr-2" />
                    <AdminButtonText text="Reject" />
                  </Button>
                </PermissionGate>
                <div className="w-px h-6 bg-border mx-2" />
                <PermissionGate permission={Permission.CATEGORIES_DELETE}>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <AdminButtonText text="Delete Selected" />
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!loading && viewMode === 'list' ? (
        /* Categories Tree */
        <Card className="border-border/50">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                <AdminUIText text="Category Hierarchy" />
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedCategories(new Set(categories.map(c => c.id)))}
                  className="text-sm px-3 py-1.5 bg-muted hover:bg-muted rounded-lg transition-colors text-foreground"
                >
                  <AdminButtonText text="Expand All" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedCategories(new Set())}
                  className="text-sm px-3 py-1.5 bg-muted hover:bg-muted rounded-lg transition-colors text-foreground"
                >
                  <AdminButtonText text="Collapse All" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Select All Header */}
            {filteredCategories.length > 0 && (
              <div className="flex items-center gap-3 px-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.size === filteredCategories.length && filteredCategories.length > 0}
                    onChange={() => {
                      if (selectedCategories.size === filteredCategories.length) {
                        setSelectedCategories(new Set());
                      } else {
                        setSelectedCategories(new Set(filteredCategories.map(c => c.id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground font-medium">
                    <AdminUIText text={`Select all (${filteredCategories.length})`} />
                  </span>
                </label>
              </div>
            )}
            {filteredCategories.length === 0 ? (
              <div className="text-center py-16">
                <FolderTree className="w-20 h-20 mx-auto text-gray-300 mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery || statusFilter !== 'ALL' || activeFilter !== 'ALL'
                    ? <AdminUIText text="No categories found" />
                    : <AdminUIText text="No categories yet" />}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'ALL' || activeFilter !== 'ALL'
                    ? <AdminUIText text="Try adjusting your search or filters to find what you're looking for." />
                    : <AdminUIText text="Get started by creating your first category to organize your products." />}
                </p>
                {!searchQuery && statusFilter === 'ALL' && activeFilter === 'ALL' && (
                  <Button
                    onClick={handleCreateCategory}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    <AdminButtonText text="Create Your First Category" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {renderCategoryTree()}
              </div>
            )}
          </CardContent>
        </Card>
      ) : !loading ? (
        /* Create/Edit Form */
        <Card className="border-primary/50/50 bg-gradient-to-r from-blue-50/50 to-violet-50/50">
          <CardHeader className="border-b border-blue-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                {viewMode === 'create' ? <AdminUIText text="Create Category" /> : viewMode === 'edit' ? <AdminUIText text="Edit Category" /> : <AdminUIText text="Category Details" />}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateToList}
                className="p-2 h-auto hover:bg-card rounded-lg transition-colors"
                aria-label="Close form"
              >
                <X className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {viewMode === 'detail' && selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1"><AdminFormLabel text="Name" as="span" /></p>
                  <p className="text-lg font-semibold text-foreground">{selectedCategory.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1"><AdminFormLabel text="Slug" as="span" /></p>
                  <p className="text-lg font-mono text-foreground">{selectedCategory.slug}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1"><AdminFormLabel text="Status" as="span" /></p>
                  <Badge
                    variant={
                      selectedCategory.status?.toUpperCase() === 'APPROVED' ? 'success'
                      : selectedCategory.status?.toUpperCase() === 'PENDING' ? 'warning'
                      : selectedCategory.status?.toUpperCase() === 'DRAFT' ? 'neutral'
                      : 'error'
                    }
                  >
                    {selectedCategory.status?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1"><AdminFormLabel text="Level" as="span" /></p>
                  <p className="text-lg font-semibold text-foreground"><AdminUIText text="Level" /> {selectedCategory.level}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1"><AdminFormLabel text="Description" as="span" /></p>
                  <p className="text-foreground">{selectedCategory.description || <AdminUIText text="No description available" />}</p>
                </div>
                {/* Category Images */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2"><AdminFormLabel text="Category Icon" as="span" /></p>
                    <img
                      src={selectedCategory.imageUrl || DefaultMediaURLs.categoryIcon}
                      alt={`${selectedCategory.name} icon`}
                      className="w-24 h-24 object-cover rounded-xl border-2 border-border shadow-sm"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2"><AdminFormLabel text="Category Banner" as="span" /></p>
                    <img
                      src={selectedCategory.bannerUrl || DefaultMediaURLs.categoryBanner}
                      alt={`${selectedCategory.name} banner`}
                      className="w-full h-24 object-cover rounded-xl border-2 border-border shadow-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <PermissionGate permission={Permission.CATEGORIES_UPDATE}>
                    <Button
                      onClick={() => handleEditCategory(selectedCategory)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      <AdminButtonText text="Edit Category" />
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission={Permission.CATEGORIES_DELETE}>
                    <Button
                      onClick={() => handleDeleteCategory(selectedCategory.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-error-muted text-error rounded-xl hover:bg-error-muted/80 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <AdminButtonText text="Delete" />
                    </Button>
                  </PermissionGate>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-3">
                    <AdminFormLabel text="Category Name" as="span" /> <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={cn(
                        "w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-medium shadow-sm",
                        errors.name
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-border focus:ring-ring focus:border-primary"
                      )}
                      placeholder="Enter category name..."
                    />
                  </div>
                  {errors.name && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-3">
                    <AdminFormLabel text="Slug" as="span" /> <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none font-mono text-sm">#</div>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      className={cn(
                        "w-full pl-10 pr-4 py-3.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white hover:border-border font-mono font-medium shadow-sm",
                        errors.slug
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-border focus:ring-violet-500 focus:border-violet-500"
                      )}
                      placeholder="category-slug"
                    />
                  </div>
                  {errors.slug && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.slug}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-3"><AdminFormLabel text="Description" as="span" /></label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all bg-white hover:border-border font-medium shadow-sm resize-none"
                      rows={4}
                      placeholder="Enter a detailed description of this category..."
                    />
                  </div>
                </div>

                {/* Category Media Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-muted rounded-xl border-2 border-border">
                  <div>
                    <CategoryIconUploader
                      value={urlToMediaItems(formData.imageUrl)}
                      onChange={(items) => setFormData(prev => ({ ...prev, imageUrl: items[0]?.url || '' }))}
                      entityId={selectedCategory?.id}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Displays in navigation menus and category listings
                    </p>
                  </div>
                  <div>
                    <CategoryBannerUploader
                      value={urlToMediaItems(formData.bannerUrl)}
                      onChange={(items) => setFormData(prev => ({ ...prev, bannerUrl: items[0]?.url || '' }))}
                      entityId={selectedCategory?.id}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Shown at the top of category pages (1920x480 recommended)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-3"><AdminFormLabel text="Parent Category" as="span" /></label>
                    <Select
                      value={formData.parentId || ''}
                      onChange={(value) => setFormData({ ...formData, parentId: value || null })}
                      options={[
                        { value: '', label: 'None (Top Level)', icon: <Home className="w-4 h-4 text-primary" /> },
                        ...categories
                          .filter(c => c.id !== selectedCategory?.id)
                          .map(cat => ({
                            value: cat.id,
                            label: `${'  '.repeat(cat.level)}${cat.name}`,
                            icon: cat.level === 0 ? <Folder className="w-4 h-4 text-yellow-500" /> : <Tag className="w-4 h-4 text-violet-500" />,
                          }))
                      ]}
                      leftIcon={<FolderTree className="w-5 h-5 text-muted-foreground" />}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-3"><AdminFormLabel text="Status" as="span" /></label>
                    <Select
                      value={formData.status}
                      onChange={(value) => setFormData({ ...formData, status: value as any })}
                      options={[
                        { value: 'DRAFT', label: 'Draft', icon: <FileEdit className="w-4 h-4 text-muted-foreground" /> },
                        { value: 'PENDING', label: 'Pending', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
                        { value: 'APPROVED', label: 'Approved', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
                        { value: 'REJECTED', label: 'Rejected', icon: <XCircle className="w-4 h-4 text-red-500" /> },
                      ]}
                      leftIcon={<CheckCircle className="w-5 h-5 text-muted-foreground" />}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-primary focus:ring-ring"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-foreground">
                    <AdminFormLabel text="Active Category" as="span" />
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveCategory}
                    disabled={!formData.name || !formData.slug}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <Save className="w-5 h-5" />
                    {viewMode === 'create' ? <AdminButtonText text="Create Category" /> : <AdminButtonText text="Save Changes" />}
                  </Button>
                  <Button
                    onClick={navigateToList}
                    className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted transition-all"
                  >
                    <AdminButtonText text="Cancel" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={() => {
          loadCategories();
          setShowBulkImport(false);
        }}
        entityType="categories"
        entityLabel="Categories"
        tenantId={currentTenant?.id}
      />
    </div>
    </PermissionGate>
  );
}

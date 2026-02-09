"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  Circle,
  CircleOff,
  Pause,
  Ban,
  PlayCircle,
  Hourglass,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Timer,
  Home,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { Stepper, StepperNavigation, Step } from '@/components/Stepper';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { EmptyState } from '@/components/common/PageError';
import { PageLoading } from '@/components/common';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import { vendorService } from '@/lib/services/vendorService';
import { Vendor, CreateVendorRequest, UpdateVendorRequest } from '@/lib/api/types';

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export default function VendorsPage() {
  const params = useParams();
  const tenantSlug = params?.slug as string;
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const toast = useToast();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [validationFilter, setValidationFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const steps: Step[] = [
    { number: 1, title: 'Basic Info', description: 'Contact details' },
    { number: 2, title: 'Business Details', description: 'Company info' },
    { number: 3, title: 'Contract Info', description: 'Terms & conditions' },
    { number: 4, title: 'Review', description: 'Final review' },
  ];

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
    details: string;
    location: string;
    primaryContact: string;
    secondaryContact: string;
    email: string;
    businessRegistrationNumber: string;
    taxIdentificationNumber: string;
    website: string;
    businessType: string;
    foundedYear: number | undefined;
    employeeCount: number | undefined;
    commissionRate: number | undefined;
    contractStartDate: string;
    contractEndDate: string;
    paymentTerms: string;
    notes: string;
    tags: string[];
  }>({
    name: '',
    details: '',
    location: '',
    primaryContact: '',
    secondaryContact: '',
    email: '',
    businessRegistrationNumber: '',
    taxIdentificationNumber: '',
    website: '',
    businessType: '',
    foundedYear: undefined,
    employeeCount: undefined,
    commissionRate: undefined,
    contractStartDate: '',
    contractEndDate: '',
    paymentTerms: 'Net 30',
    notes: '',
    tags: [],
  });

  // Load vendors on mount and when tenant changes
  useEffect(() => {
    // Don't fetch if tenant is still loading or not set
    if (tenantLoading || !currentTenant) {
      return;
    }

    // Reset state when tenant changes
    setVendors([]);
    setSelectedVendor(null);
    setViewMode('list');
    setError(null);
    setCurrentPage(1);
    loadVendors();
  }, [tenantSlug, currentTenant?.id, tenantLoading]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorService.getVendors();
      setVendors(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors');
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync URL ?id= param with detail view (for notification deep-links)
  useEffect(() => {
    if (loading || !vendors.length) return;
    const vendorId = searchParams.get('id');
    if (vendorId && viewMode === 'list') {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        setSelectedVendor(vendor);
        setViewMode('detail');
      }
    }
  }, [searchParams, vendors, loading]);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || vendor.status === statusFilter;
    const matchesValidation = validationFilter === 'ALL' || vendor.validationStatus === validationFilter;
    return matchesSearch && matchesStatus && matchesValidation;
  });

  // Pagination calculations
  const totalItems = filteredVendors.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVendors = filteredVendors.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, validationFilter]);

  const handleCreateVendor = () => {
    setFormData({
      name: '',
      details: '',
      location: '',
      primaryContact: '',
      secondaryContact: '',
      email: '',
      businessRegistrationNumber: '',
      taxIdentificationNumber: '',
      website: '',
      businessType: '',
      foundedYear: undefined,
      employeeCount: undefined,
      commissionRate: undefined,
      contractStartDate: '',
      contractEndDate: '',
      paymentTerms: 'Net 30',
      notes: '',
      tags: [],
    });
    setCurrentStep(1);
    setViewMode('create');
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      details: vendor.details || '',
      location: vendor.location || '',
      primaryContact: vendor.primaryContact,
      secondaryContact: vendor.secondaryContact || '',
      email: vendor.email,
      businessRegistrationNumber: vendor.businessRegistrationNumber || '',
      taxIdentificationNumber: vendor.taxIdentificationNumber || '',
      website: vendor.website || '',
      businessType: vendor.businessType || '',
      foundedYear: vendor.foundedYear,
      employeeCount: vendor.employeeCount,
      commissionRate: vendor.commissionRate,
      contractStartDate: vendor.contractStartDate?.split('T')[0] || '',
      contractEndDate: vendor.contractEndDate?.split('T')[0] || '',
      paymentTerms: vendor.paymentTerms || 'Net 30',
      notes: vendor.notes || '',
      tags: [],
    });
    setCurrentStep(1);
    setViewMode('edit');
  };

  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setViewMode('detail');
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Vendor',
      message: `Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await vendorService.deleteVendor(vendor.id);
          await loadVendors();
          setModalConfig({ ...modalConfig, isOpen: false });
          toast.success('Vendor Deleted', 'The vendor has been deleted successfully');
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to delete vendor';
          toast.error('Failed to Delete Vendor', errorMsg);
          setError(errorMsg);
        }
      },
    });
  };

  const handleSaveVendor = async () => {
    try {
      if (viewMode === 'create') {
        await vendorService.createVendor(formData as CreateVendorRequest);
        toast.success('Vendor Created', 'The vendor has been added successfully');
      } else if (viewMode === 'edit' && selectedVendor) {
        await vendorService.updateVendor(selectedVendor.id, formData as UpdateVendorRequest);
        toast.success('Vendor Updated', 'The vendor has been updated successfully');
      }
      await loadVendors();
      setViewMode('list');
      setSelectedVendor(null);
      setCurrentStep(1);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save vendor';
      if (viewMode === 'create') {
        toast.error('Failed to Create Vendor', errorMsg);
      } else {
        toast.error('Failed to Update Vendor', errorMsg);
      }
      setError(errorMsg);
      console.error('Error saving vendor:', err);
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedVendor(null);
    setCurrentStep(1);
  };

  const getVendorStatusType = (status: string): StatusType => {
    const mapping: Record<string, StatusType> = {
      ACTIVE: 'success',
      PENDING: 'warning',
      INACTIVE: 'neutral',
      SUSPENDED: 'error',
      TERMINATED: 'error',
    };
    return mapping[status] || 'neutral';
  };

  const getStatusBadge = (status: string) => {
    return (
      <StatusBadge status={getVendorStatusType(status)} showIcon={false}>
        {status}
      </StatusBadge>
    );
  };

  const getValidationStatusType = (status: string): StatusType => {
    const mapping: Record<string, StatusType> = {
      COMPLETED: 'success',
      IN_PROGRESS: 'info',
      NOT_STARTED: 'neutral',
      FAILED: 'error',
      EXPIRED: 'warning',
    };
    return mapping[status] || 'neutral';
  };

  const getValidationBadge = (status: string) => {
    return (
      <StatusBadge status={getValidationStatusType(status)} showIcon={false}>
        {status.replace('_', ' ')}
      </StatusBadge>
    );
  };

  if (viewMode === 'detail' && selectedVendor) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title="Vendor Details"
            breadcrumbs={[
              { label: 'Home', href: '/', icon: Home },
              { label: 'Vendors', href: '/vendors', icon: Building2 },
              { label: selectedVendor.name },
            ]}
            actions={
            <>
              <Button
                onClick={() => handleEditVendor(selectedVendor)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Edit className="w-5 h-5" />
                Edit
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted transition-all"
              >
                <X className="w-5 h-5" />
                Close
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Vendor Name</p>
                <p className="font-semibold text-lg">{selectedVendor.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedVendor.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validation Status</p>
                <div className="mt-1">{getValidationBadge(selectedVendor.validationStatus)}</div>
              </div>
              {selectedVendor.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-foreground">{selectedVendor.details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{selectedVendor.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Contact</p>
                <p className="font-semibold">{selectedVendor.primaryContact}</p>
              </div>
              {selectedVendor.secondaryContact && (
                <div>
                  <p className="text-sm text-muted-foreground">Secondary Contact</p>
                  <p className="font-semibold">{selectedVendor.secondaryContact}</p>
                </div>
              )}
              {selectedVendor.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{selectedVendor.location}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedVendor.businessType && (
                <div>
                  <p className="text-sm text-muted-foreground">Business Type</p>
                  <p className="font-semibold">{selectedVendor.businessType}</p>
                </div>
              )}
              {selectedVendor.businessRegistrationNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-semibold">{selectedVendor.businessRegistrationNumber}</p>
                </div>
              )}
              {selectedVendor.taxIdentificationNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Tax ID</p>
                  <p className="font-semibold">{selectedVendor.taxIdentificationNumber}</p>
                </div>
              )}
              {selectedVendor.website && (
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                    {selectedVendor.website}
                  </a>
                </div>
              )}
              {selectedVendor.foundedYear && (
                <div>
                  <p className="text-sm text-muted-foreground">Founded</p>
                  <p className="font-semibold">{selectedVendor.foundedYear}</p>
                </div>
              )}
              {selectedVendor.employeeCount && (
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="font-semibold">{selectedVendor.employeeCount}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                Contract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="font-semibold text-2xl text-success">{selectedVendor.commissionRate}%</p>
              </div>
              {selectedVendor.paymentTerms && (
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-semibold">{selectedVendor.paymentTerms}</p>
                </div>
              )}
              {selectedVendor.contractStartDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Contract Start</p>
                  <p className="font-semibold">{new Date(selectedVendor.contractStartDate).toLocaleDateString()}</p>
                </div>
              )}
              {selectedVendor.contractEndDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Contract End</p>
                  <p className="font-semibold">{new Date(selectedVendor.contractEndDate).toLocaleDateString()}</p>
                </div>
              )}
              {selectedVendor.performanceRating && (
                <div>
                  <p className="text-sm text-muted-foreground">Performance Rating</p>
                  <p className="font-semibold text-xl">⭐ {selectedVendor.performanceRating}/5.0</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

          {selectedVendor.notes && (
            <Card className="mt-6 rounded-2xl border bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="p-6">
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-foreground">{selectedVendor.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={viewMode === 'create' ? 'Create New Vendor' : 'Edit Vendor'}
            breadcrumbs={[
              { label: 'Home', href: '/', icon: Home },
              { label: 'Vendors', href: '/vendors', icon: Building2 },
              { label: viewMode === 'create' ? 'Create' : 'Edit' },
            ]}
          />

        <Card className="max-w-5xl mx-auto">
          <CardContent className="pt-6">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              allowSkip={viewMode === 'edit'}
            />

            <div className="mt-8">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <ClipboardList className="w-5 h-5 inline-block mr-1" aria-hidden="true" /> Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Vendor Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="Enter vendor name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email <span className="text-error">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="vendor@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Primary Contact <span className="text-error">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.primaryContact}
                        onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Secondary Contact
                      </label>
                      <input
                        type="tel"
                        value={formData.secondaryContact}
                        onChange={(e) => setFormData({ ...formData, secondaryContact: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="+1 (555) 123-4568"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="City, State/Country"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="Brief description of the vendor..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5 inline-block mr-1" aria-hidden="true" /> Business Details
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Type
                      </label>
                      <input
                        type="text"
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="e.g., Wholesale, Retail, Manufacturing"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.businessRegistrationNumber}
                        onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="BRN-12345"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tax Identification Number
                      </label>
                      <input
                        type="text"
                        value={formData.taxIdentificationNumber}
                        onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="TAX-67890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Founded Year
                      </label>
                      <input
                        type="number"
                        value={formData.foundedYear || ''}
                        onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="2020"
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Employee Count
                      </label>
                      <input
                        type="number"
                        value={formData.employeeCount || ''}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="50"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contract Info */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <FileText className="w-5 h-5 inline-block mr-1" aria-hidden="true" /> Contract Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.commissionRate || ''}
                        onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="10.00"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Payment Terms
                      </label>
                      <Select
                        value={formData.paymentTerms}
                        onChange={(value) => setFormData({ ...formData, paymentTerms: value })}
                        options={[
                          { value: 'Net 15', label: 'Net 15' },
                          { value: 'Net 30', label: 'Net 30' },
                          { value: 'Net 45', label: 'Net 45' },
                          { value: 'Net 60', label: 'Net 60' },
                          { value: 'Due on Receipt', label: 'Due on Receipt' },
                        ]}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Contract Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.contractStartDate}
                        onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Contract End Date
                      </label>
                      <input
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                        placeholder="Additional notes or special terms..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5 inline-block mr-1" aria-hidden="true" /> Review & Confirm
                  </h2>

                  <div className="bg-muted p-8 rounded-2xl border-2 border-primary/30">
                    <h3 className="text-lg font-semibold mb-6 text-foreground">Vendor Summary</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Vendor Name</p>
                        <p className="font-semibold text-lg">{formData.name || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{formData.email || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Primary Contact</p>
                        <p className="font-semibold">{formData.primaryContact || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{formData.location || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Business Type</p>
                        <p className="font-semibold">{formData.businessType || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <p className="font-semibold">{formData.website || '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Commission Rate</p>
                        <p className="font-semibold text-success text-xl">{formData.commissionRate ? `${formData.commissionRate}%` : '-'}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Payment Terms</p>
                        <p className="font-semibold">{formData.paymentTerms || '-'}</p>
                      </div>

                      {formData.contractStartDate && (
                        <div>
                          <p className="text-sm text-muted-foreground">Contract Period</p>
                          <p className="font-semibold">
                            {new Date(formData.contractStartDate).toLocaleDateString()} -
                            {formData.contractEndDate ? new Date(formData.contractEndDate).toLocaleDateString() : 'Ongoing'}
                          </p>
                        </div>
                      )}
                    </div>

                    {formData.details && (
                      <div className="mt-6">
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-foreground mt-1">{formData.details}</p>
                      </div>
                    )}

                    {formData.notes && (
                      <div className="mt-6">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-foreground mt-1">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <StepperNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                onNext={handleNextStep}
                onPrevious={handlePreviousStep}
                onSave={handleSaveVendor}
                onCancel={handleCancel}
              />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.VENDORS_READ}
      fallback="styled"
      fallbackTitle="Vendors Access Required"
      fallbackDescription="You don't have the required permissions to view vendors. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Vendor Management"
          description="Manage your vendor relationships and contracts"
          breadcrumbs={[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Vendors', icon: Building2 },
          ]}
          actions={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={loadVendors}
              disabled={loading}
              className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-border"
              title="Refresh"
              aria-label="Refresh vendors list"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} aria-hidden="true" />
            </Button>
            <Button
              onClick={handleCreateVendor}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add Vendor
            </Button>
          </div>
        }
      />

      <PageError error={error} onDismiss={() => setError(null)} />

      <Card className="border-border/50 overflow-visible relative z-40">
        <CardContent className="p-6 overflow-visible relative">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search vendors by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
                  "px-4 py-3 rounded-md transition-all flex items-center gap-2",
                  showFilters
                    ? "bg-primary/20 text-primary border-2 border-primary/50"
                    : "bg-muted text-foreground border-2 border-border hover:bg-muted"
                )}
              >
                <Filter className="w-5 h-5" />
                Filters
                {(statusFilter !== 'ALL' || validationFilter !== 'ALL') && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    {(statusFilter !== 'ALL' ? 1 : 0) + (validationFilter !== 'ALL' ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 mt-4 p-5 bg-white/80 backdrop-blur-sm rounded-md border-2 border-border shadow-sm animate-in slide-in-from-top-2 duration-200 relative z-50">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider">Status</label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'ALL', label: 'All Statuses', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'ACTIVE', label: 'Active', icon: <Circle className="w-4 h-4 text-success fill-green-500" /> },
                    { value: 'PENDING', label: 'Pending', icon: <Clock className="w-4 h-4 text-warning" /> },
                    { value: 'INACTIVE', label: 'Inactive', icon: <CircleOff className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'SUSPENDED', label: 'Suspended', icon: <Pause className="w-4 h-4 text-warning" /> },
                    { value: 'TERMINATED', label: 'Terminated', icon: <Ban className="w-4 h-4 text-error" /> },
                  ]}
                  variant="filter"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider">Validation Status</label>
                <Select
                  value={validationFilter}
                  onChange={setValidationFilter}
                  options={[
                    { value: 'ALL', label: 'All Validation Statuses', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'COMPLETED', label: 'Completed', icon: <ShieldCheck className="w-4 h-4 text-success" /> },
                    { value: 'IN_PROGRESS', label: 'In Progress', icon: <PlayCircle className="w-4 h-4 text-primary" /> },
                    { value: 'NOT_STARTED', label: 'Not Started', icon: <Hourglass className="w-4 h-4 text-muted-foreground" /> },
                    { value: 'FAILED', label: 'Failed', icon: <ShieldAlert className="w-4 h-4 text-error" /> },
                    { value: 'EXPIRED', label: 'Expired', icon: <Timer className="w-4 h-4 text-warning" /> },
                  ]}
                  variant="filter"
                />
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('ALL');
                  setValidationFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 bg-card border-2 border-border rounded-md text-sm font-semibold text-foreground hover:bg-muted hover:border-border transition-all self-end shadow-sm hover:shadow-md"
              >
                Clear All
              </Button>
            </div>
          )}
          </div>

          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : filteredVendors.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={vendors.length === 0 ? "No vendors yet" : "No vendors found"}
              message={vendors.length === 0 ? "Get started by adding your first vendor" : "Try adjusting your search or filters"}
              action={vendors.length === 0 ? (
                <PermissionGate permission={Permission.VENDORS_CREATE}>
                  <Button onClick={() => setViewMode('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </PermissionGate>
              ) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Vendor</th>
                    <th className="text-left p-4 font-semibold text-foreground">Contact</th>
                    <th className="text-left p-4 font-semibold text-foreground">Location</th>
                    <th className="text-left p-4 font-semibold text-foreground">Status</th>
                    <th className="text-left p-4 font-semibold text-foreground">Validation</th>
                    <th className="text-left p-4 font-semibold text-foreground">Commission</th>
                    <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-border hover:bg-primary/10/50 transition-colors cursor-pointer"
                      onClick={() => handleViewVendor(vendor)}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-foreground">{vendor.name}</p>
                          {vendor.businessType && (
                            <p className="text-sm text-muted-foreground">{vendor.businessType}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium">{vendor.email}</p>
                          <p className="text-sm text-muted-foreground">{vendor.primaryContact}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{vendor.location || '-'}</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(vendor.status)}
                      </td>
                      <td className="p-4">
                        {getValidationBadge(vendor.validationStatus)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-success">{vendor.commissionRate}%</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewVendor(vendor);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View Details"
                            aria-label="View vendor details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditVendor(vendor);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="Edit"
                            aria-label="Edit vendor"
                          >
                            <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVendor(vendor);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                            title="Delete"
                            aria-label="Delete vendor"
                          >
                            <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && filteredVendors.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
        />
      </div>
    </div>
    </PermissionGate>
  );
}

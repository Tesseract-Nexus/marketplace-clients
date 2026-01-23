"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Filter,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  DollarSign,
  Building,
  Users,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Circle,
  CircleOff,
  UserCog,
  UserCheck,
  Crown,
  Star,
  GraduationCap,
  Hammer,
  FileText,
  Hourglass,
  HelpCircle,
  Send,
  Key,
  Lock,
  Unlock,
  AlertCircle,
  UserX,
  LogIn,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { useHasPermission, Permissions } from '@/hooks/usePermission';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ConfirmModal';
import { Select } from '@/components/Select';
import { Stepper, StepperNavigation, Step } from '@/components/Stepper';
import { PageHeader } from '@/components/PageHeader';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { Pagination } from '@/components/Pagination';
import { staffService } from '@/lib/services/staffService';
import { roleService } from '@/lib/api/rbac';
import type { Role } from '@/lib/api/rbacTypes';
import { Staff, CreateStaffRequest, UpdateStaffRequest, StaffRole, EmploymentType, StaffAuthMethod, StaffAccountStatus } from '@/lib/api/types';
import { staffInvitationService } from '@/lib/api/staffAuth';
import { ACCOUNT_STATUS_LABELS, AUTH_METHOD_LABELS } from '@/lib/api/staffAuthTypes';
import { BulkImportModal } from '@/components/BulkImportModal';
import { Upload } from 'lucide-react';
import { StaffFormStep1, StaffFormStep2, StaffFormStep3, StaffFormStep4, StaffFormData, initialFormData, QuickAddForm, QuickAddData } from './components';
import { StatsGrid, FilterPanel, QuickFilters, QuickFilter } from '@/components/data-listing';

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

const Badge = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)} {...props}>
    {children}
  </div>
);

type ViewMode = 'list' | 'create' | 'edit' | 'detail';

export default function StaffPage() {
  const params = useParams();
  const tenantSlug = params?.slug as string;
  const { currentTenant, isLoading: tenantLoading } = useTenant();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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
    { number: 1, title: 'Personal Info', icon: <User className="w-6 h-6" />, description: 'Basic details' },
    { number: 2, title: 'Employment', icon: <Briefcase className="w-6 h-6" />, description: 'Job info' },
    { number: 3, title: 'Organization', icon: <Building className="w-6 h-6" />, description: 'Team & location' },
    { number: 4, title: 'Review', icon: <CheckCircle className="w-6 h-6" />, description: 'Final review' },
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

  // Form state - using modular form data type
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);

  // Bulk import modal state
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Quick Add mode - simplified form for fast staff creation
  const [isQuickAddMode, setIsQuickAddMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission checks for CRUD actions
  const canCreateStaff = useHasPermission(Permissions.STAFF_CREATE);
  const canUpdateStaff = useHasPermission(Permissions.STAFF_UPDATE);
  const canDeleteStaff = useHasPermission(Permissions.STAFF_DELETE);
  const canInviteStaff = useHasPermission(Permissions.STAFF_INVITE);

  // Load staff on mount and when tenant changes
  useEffect(() => {
    // Don't fetch if tenant is still loading or not set
    if (tenantLoading || !currentTenant) {
      return;
    }

    // Reset state when tenant changes
    setStaff([]);
    setSelectedStaff(null);
    setViewMode('list');
    setError(null);
    setCurrentPage(1);
    loadStaff();
  }, [tenantSlug, currentTenant?.id, tenantLoading]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const [staffResponse, rolesResponse] = await Promise.all([
        staffService.getStaff(),
        roleService.list(),
      ]);
      setStaff(staffResponse.data);
      setRoles(rolesResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff');
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchesEmploymentType = employmentTypeFilter === 'ALL' || s.employmentType === employmentTypeFilter;
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.isActive) ||
      (statusFilter === 'INACTIVE' && !s.isActive) ||
      (statusFilter === 'INVITED' && s.accountStatus === 'pending_activation') ||
      (statusFilter === 'SUSPENDED' && s.accountStatus === 'suspended');
    return matchesSearch && matchesRole && matchesEmploymentType && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredStaff.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, employmentTypeFilter, statusFilter]);

  // Stats calculations
  const statsData = useMemo(() => {
    const totalCount = staff.length;
    const activeCount = staff.filter(s => s.isActive).length;
    const invitedCount = staff.filter(s => s.accountStatus === 'pending_activation').length;
    const suspendedCount = staff.filter(s => s.accountStatus === 'suspended').length;
    return { totalCount, activeCount, invitedCount, suspendedCount };
  }, [staff]);

  // Quick filters configuration
  const quickFilters: QuickFilter[] = useMemo(() => [
    { id: 'ACTIVE', label: 'Active', icon: CheckCircle, color: 'success', count: statsData.activeCount },
    { id: 'INVITED', label: 'Invited', icon: Send, color: 'warning', count: statsData.invitedCount },
    { id: 'SUSPENDED', label: 'Suspended', icon: XCircle, color: 'error', count: statsData.suspendedCount },
  ], [statsData.activeCount, statsData.invitedCount, statsData.suspendedCount]);

  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  const handleQuickFilterToggle = (filterId: string) => {
    if (statusFilter === filterId) {
      setStatusFilter('ALL');
      setActiveQuickFilters([]);
    } else {
      setStatusFilter(filterId);
      setActiveQuickFilters([filterId]);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('ALL');
    setRoleFilter('ALL');
    setEmploymentTypeFilter('ALL');
    setSearchQuery('');
    setActiveQuickFilters([]);
  };

  const activeFilterCount = (statusFilter !== 'ALL' ? 1 : 0) + (roleFilter !== 'ALL' ? 1 : 0) + (employmentTypeFilter !== 'ALL' ? 1 : 0);

  const handleCreateStaff = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setViewMode('create');
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      middleName: staffMember.middleName || '',
      displayName: staffMember.displayName || '',
      email: staffMember.email,
      alternateEmail: staffMember.alternateEmail || '',
      phoneNumber: staffMember.phoneNumber || '',
      mobileNumber: staffMember.mobileNumber || '',
      role: staffMember.role,
      employmentType: staffMember.employmentType,
      startDate: staffMember.startDate?.split('T')[0] || '',
      endDate: staffMember.endDate?.split('T')[0] || '',
      jobTitle: staffMember.jobTitle || '',
      salary: staffMember.salary,
      currencyCode: staffMember.currencyCode || 'USD',
      departmentId: staffMember.departmentId || '',
      teamId: staffMember.teamId || '',
      managerId: staffMember.managerId || '',
      locationId: staffMember.locationId || '',
      // Address fields
      streetAddress: staffMember.streetAddress || '',
      streetAddress2: staffMember.streetAddress2 || '',
      city: staffMember.city || '',
      state: staffMember.state || '',
      stateCode: staffMember.stateCode || '',
      postalCode: staffMember.postalCode || '',
      country: staffMember.country || '',
      countryCode: staffMember.countryCode || '',
      latitude: staffMember.latitude,
      longitude: staffMember.longitude,
      formattedAddress: staffMember.formattedAddress || '',
      placeId: staffMember.placeId || '',
    });
    setCurrentStep(1);
    setViewMode('edit');
  };

  const handleViewStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setViewMode('detail');
  };

  const handleDeleteStaff = (staffMember: Staff) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete "${staffMember.firstName} ${staffMember.lastName}"? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await staffService.deleteStaff(staffMember.id);
          await loadStaff();
          setModalConfig({ ...modalConfig, isOpen: false });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to delete staff member');
        }
      },
    });
  };

  const handleSaveStaff = async () => {
    try {
      // Convert date strings to ISO format or undefined
      const convertDateToISO = (dateStr: string | undefined): string | undefined => {
        if (!dateStr || dateStr.trim() === '') return undefined;
        // Convert YYYY-MM-DD to ISO datetime format
        const date = new Date(dateStr + 'T00:00:00Z');
        return isNaN(date.getTime()) ? undefined : date.toISOString();
      };

      const preparedData = {
        ...formData,
        startDate: convertDateToISO(formData.startDate),
        endDate: convertDateToISO(formData.endDate),
        // Invitation URL - use current origin so activation link works
        activationBaseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
        businessName: currentTenant?.name || currentTenant?.displayName || undefined,
      };

      if (viewMode === 'create') {
        await staffService.createStaff(preparedData as CreateStaffRequest);
      } else if (viewMode === 'edit' && selectedStaff) {
        await staffService.updateStaff(selectedStaff.id, preparedData as UpdateStaffRequest);
      }
      await loadStaff();
      setViewMode('list');
      setSelectedStaff(null);
      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff member');
      console.error('Error saving staff member:', err);
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
    setSelectedStaff(null);
    setCurrentStep(1);
  };

  // Quick Add submission handler
  const handleQuickAddSubmit = async (data: QuickAddData) => {
    try {
      setIsSubmitting(true);
      // Create staff with minimal data - role will be inherited from team
      await staffService.createStaff({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        teamId: data.teamId,
        departmentId: data.departmentId,
        // Set defaults for required fields
        role: 'employee',
        employmentType: 'full_time',
        // Invitation URL - use current origin so activation link works
        activationBaseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
        businessName: currentTenant?.name || currentTenant?.displayName || undefined,
      } as CreateStaffRequest);
      await loadStaff();
      setViewMode('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
      console.error('Error creating staff member:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch from Quick Add to full form
  const handleSwitchToFullForm = () => {
    setIsQuickAddMode(false);
  };

  const getRoleBadge = (role: StaffRole) => {
    const styles = {
      super_admin: 'bg-primary/10 text-primary border-primary/30',
      admin: 'bg-error-muted text-error-muted-foreground border-error/30',
      manager: 'bg-primary/20 text-primary border-primary/30',
      senior_employee: 'bg-success-muted text-success-muted-foreground border-success/30',
      employee: 'bg-muted text-foreground border-border',
      intern: 'bg-warning-muted text-warning-muted-foreground border-warning/30',
      contractor: 'bg-warning-muted text-warning border-warning/30',
      guest: 'bg-primary/10 text-primary border-primary/30',
      readonly: 'bg-neutral-muted text-neutral-muted-foreground border-neutral/30',
    };
    return <Badge className={styles[role]}>{role.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getEmploymentTypeBadge = (type: EmploymentType) => {
    const styles = {
      full_time: 'bg-success-muted text-success-muted-foreground border-success/30',
      part_time: 'bg-primary/20 text-primary border-primary/30',
      contract: 'bg-warning-muted text-warning border-warning/30',
      temporary: 'bg-warning-muted text-warning-muted-foreground border-warning/30',
      intern: 'bg-primary/10 text-primary border-primary/30',
      consultant: 'bg-info-muted text-info-muted-foreground border-info/30',
      volunteer: 'bg-primary/10 text-primary border-primary/30',
    };
    return <Badge className={styles[type]}>{type.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getAccountStatusBadge = (status?: StaffAccountStatus) => {
    if (!status) return null;
    const styles: Record<StaffAccountStatus, { className: string; icon: React.ReactNode }> = {
      pending_activation: { className: 'bg-warning-muted text-warning-muted-foreground border-warning/30', icon: <Clock className="w-3 h-3" /> },
      pending_password: { className: 'bg-warning-muted text-warning border-warning/30', icon: <Key className="w-3 h-3" /> },
      active: { className: 'bg-success-muted text-success-muted-foreground border-success/30', icon: <CheckCircle className="w-3 h-3" /> },
      suspended: { className: 'bg-error-muted text-error-muted-foreground border-error/30', icon: <AlertCircle className="w-3 h-3" /> },
      locked: { className: 'bg-error-muted text-error-muted-foreground border-error/30', icon: <Lock className="w-3 h-3" /> },
      deactivated: { className: 'bg-muted text-foreground border-border', icon: <UserX className="w-3 h-3" /> },
    };
    const style = styles[status];
    return (
      <Badge className={cn(style.className, 'flex items-center gap-1')}>
        {style.icon}
        {ACCOUNT_STATUS_LABELS[status] || status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getAuthMethodIcon = (method?: StaffAuthMethod) => {
    if (!method) return null;
    const icons: Record<StaffAuthMethod, { icon: React.ReactNode; color: string; label: string }> = {
      password: { icon: <Key className="w-4 h-4" />, color: 'text-primary', label: 'Password' },
      google_sso: { icon: <LogIn className="w-4 h-4" />, color: 'text-error', label: 'Google' },
      microsoft_sso: { icon: <LogIn className="w-4 h-4" />, color: 'text-primary', label: 'Microsoft' },
      invitation_pending: { icon: <Send className="w-4 h-4" />, color: 'text-warning', label: 'Invitation Pending' },
      sso_pending: { icon: <Clock className="w-4 h-4" />, color: 'text-warning', label: 'SSO Pending' },
    };
    const authIcon = icons[method];
    return (
      <div className={cn('flex items-center gap-1', authIcon.color)} title={authIcon.label}>
        {authIcon.icon}
        <span className="text-xs">{AUTH_METHOD_LABELS[method] || method}</span>
      </div>
    );
  };

  const handleSendInvitation = async (staffMember: Staff) => {
    setModalConfig({
      isOpen: true,
      title: 'Send Invitation',
      message: `Send an invitation email to ${staffMember.firstName} ${staffMember.lastName} (${staffMember.email})? They will be able to set up their account and choose their preferred login method.`,
      variant: 'info',
      onConfirm: async () => {
        try {
          await staffInvitationService.create({
            staffId: staffMember.id,
            authMethodOptions: ['password', 'google_sso', 'microsoft_sso'],
            sendEmail: true,
            expiresInHours: 72,
            activationBaseUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
            businessName: currentTenant?.name || currentTenant?.displayName || undefined,
          });
          await loadStaff();
          setModalConfig({ ...modalConfig, isOpen: false });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to send invitation');
        }
      },
    });
  };

  if (viewMode === 'detail' && selectedStaff) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={`${selectedStaff.firstName} ${selectedStaff.lastName}`}
            description={selectedStaff.jobTitle || 'Staff Member'}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Staff', href: '/staff' },
              { label: `${selectedStaff.firstName} ${selectedStaff.lastName}` },
            ]}
            actions={
            <>
              {canUpdateStaff && (
                <Button
                  onClick={() => handleEditStaff(selectedStaff)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Edit className="w-5 h-5" />
                  Edit
                </Button>
              )}
              <Button
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl hover:bg-muted transition-all"
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
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-semibold text-lg">
                  {selectedStaff.firstName} {selectedStaff.middleName && `${selectedStaff.middleName} `}{selectedStaff.lastName}
                </p>
              </div>
              {selectedStaff.displayName && (
                <div>
                  <p className="text-sm text-muted-foreground">Display Name</p>
                  <p className="font-semibold">{selectedStaff.displayName}</p>
                </div>
              )}
              {selectedStaff.employeeId && (
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-semibold">{selectedStaff.employeeId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={selectedStaff.isActive ? 'bg-success-muted text-success-muted-foreground border-success/30' : 'bg-error-muted text-error-muted-foreground border-error/30'}>
                  {selectedStaff.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
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
                <p className="font-semibold">{selectedStaff.email}</p>
              </div>
              {selectedStaff.alternateEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Alternate Email</p>
                  <p className="font-semibold">{selectedStaff.alternateEmail}</p>
                </div>
              )}
              {selectedStaff.phoneNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">{selectedStaff.phoneNumber}</p>
                </div>
              )}
              {selectedStaff.mobileNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">Mobile Number</p>
                  <p className="font-semibold">{selectedStaff.mobileNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <div className="mt-1">{getRoleBadge(selectedStaff.role)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <div className="mt-1">{getEmploymentTypeBadge(selectedStaff.employmentType)}</div>
              </div>
              {selectedStaff.jobTitle && (
                <div>
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p className="font-semibold">{selectedStaff.jobTitle}</p>
                </div>
              )}
              {selectedStaff.startDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{new Date(selectedStaff.startDate).toLocaleDateString()}</p>
                </div>
              )}
              {selectedStaff.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-semibold">{new Date(selectedStaff.endDate).toLocaleDateString()}</p>
                </div>
              )}
              {selectedStaff.salary && (
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-semibold text-2xl text-success">
                    {selectedStaff.currencyCode} ${selectedStaff.salary.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-success" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStaff.departmentId && (
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{selectedStaff.departmentId}</p>
                </div>
              )}
              {selectedStaff.teamId && (
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="font-semibold">{selectedStaff.teamId}</p>
                </div>
              )}
              {selectedStaff.managerId && (
                <div>
                  <p className="text-sm text-muted-foreground">Manager ID</p>
                  <p className="font-semibold">{selectedStaff.managerId}</p>
                </div>
              )}
              {selectedStaff.locationId && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{selectedStaff.locationId}</p>
                </div>
              )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Authentication & Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <div className="mt-1">
                    {getAccountStatusBadge(selectedStaff.accountStatus) || (
                      <Badge className="bg-muted text-foreground border-border">
                        Not Set
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auth Method</p>
                  <div className="mt-1">
                    {getAuthMethodIcon(selectedStaff.authMethod) || (
                      <span className="text-muted-foreground text-sm">Not configured</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Verified</p>
                  <div className="mt-1 flex items-center gap-1">
                    {selectedStaff.isEmailVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Not verified</span>
                      </>
                    )}
                  </div>
                </div>
                {selectedStaff.invitedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Invited At</p>
                    <p className="font-semibold">{new Date(selectedStaff.invitedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedStaff.invitationAcceptedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Invitation Accepted</p>
                    <p className="font-semibold">{new Date(selectedStaff.invitationAcceptedAt).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedStaff.lastPasswordChange && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Password Change</p>
                    <p className="font-semibold">{new Date(selectedStaff.lastPasswordChange).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {canInviteStaff && (!selectedStaff.accountStatus || selectedStaff.accountStatus === 'pending_activation') && (
                <div className="mt-6 pt-6 border-t border-border">
                  <Button
                    onClick={() => handleSendInvitation(selectedStaff)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-warning text-warning-foreground rounded-xl hover:bg-warning/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                    Send Invitation
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Send an invitation email to allow this staff member to set up their account.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    // Quick Add mode - only for create, not edit
    if (viewMode === 'create' && isQuickAddMode) {
      return (
        <div className="min-h-screen bg-background">
          <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
              title="Add New Staff Member"
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Team', href: '/staff' },
                { label: 'Staff', href: '/staff' },
                { label: 'Quick Add' },
              ]}
            />

            <Card className="max-w-3xl mx-auto">
              <CardContent className="pt-6">
                <QuickAddForm
                  onSubmit={handleQuickAddSubmit}
                  onCancel={handleCancel}
                  onSwitchToFullForm={handleSwitchToFullForm}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Full form mode (for edit or when switched from quick add)
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-6 animate-in fade-in duration-500">
          <PageHeader
            title={viewMode === 'create' ? 'Add New Staff Member' : 'Edit Staff Member'}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Team', href: '/staff' },
              { label: 'Staff', href: '/staff' },
              { label: viewMode === 'create' ? 'Create' : 'Edit' },
            ]}
          />

        <Card className="max-w-5xl mx-auto">
          <CardContent className="pt-6">
            {/* Mode toggle for create mode */}
            {viewMode === 'create' && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsQuickAddMode(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Switch to Quick Add
                </button>
              </div>
            )}

            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              allowSkip={viewMode === 'edit'}
            />

            <div className="mt-8">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <StaffFormStep1 formData={formData} setFormData={setFormData} isEditing={viewMode === 'edit'} />
              )}

              {/* Step 2: Employment Info */}
              {currentStep === 2 && (
                <StaffFormStep2 formData={formData} setFormData={setFormData} isEditing={viewMode === 'edit'} roles={roles} />
              )}

              {/* Step 3: Organization */}
              {currentStep === 3 && (
                <StaffFormStep3 formData={formData} setFormData={setFormData} isEditing={viewMode === 'edit'} />
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <StaffFormStep4 formData={formData} setFormData={setFormData} isEditing={viewMode === 'edit'} />
              )}
            </div>

            <div className="mt-8">
              <StepperNavigation
                currentStep={currentStep}
                totalSteps={totalSteps}
                onNext={handleNextStep}
                onPrevious={handlePreviousStep}
                onSave={handleSaveStaff}
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
      permission={Permission.STAFF_READ}
      fallback="styled"
      fallbackTitle="Staff Access Required"
      fallbackDescription="You don't have the required permissions to view staff. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Staff Management"
          description="Manage your team members and employees"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team', href: '/staff' },
            { label: 'Staff' },
          ]}
          actions={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={loadStaff}
              disabled={loading}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-border"
              title="Refresh"
              aria-label="Refresh staff list"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} aria-hidden="true" />
            </Button>
            {canCreateStaff && (
              <Button
                variant="ghost"
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-border transition-all"
              >
                <Upload className="w-5 h-5" />
                Bulk Import
              </Button>
            )}
            {canCreateStaff && (
              <Button
                onClick={handleCreateStaff}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Staff
              </Button>
            )}
          </div>
        }
      />

      <PageError error={error} onDismiss={() => setError(null)} />

      {/* Stats Grid */}
      <StatsGrid
        stats={[
          { label: 'Total Staff', value: statsData.totalCount, icon: Users, color: 'primary' },
          { label: 'Active', value: statsData.activeCount, icon: CheckCircle, color: 'success' },
          { label: 'Pending Invite', value: statsData.invitedCount, icon: Send, color: 'warning' },
          { label: 'Suspended', value: statsData.suspendedCount, icon: XCircle, color: 'error' },
        ]}
        columns={4}
        showMobileRow
        className="mb-6"
      />

      {/* Filter Panel with Quick Filters */}
      <FilterPanel
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search staff by name, email, or employee ID..."
        expanded={showFilters}
        onExpandedChange={setShowFilters}
        activeFilterCount={activeFilterCount}
        onClearAll={clearAllFilters}
        quickFilters={
          <QuickFilters
            filters={quickFilters}
            activeFilters={activeQuickFilters}
            onFilterToggle={handleQuickFilterToggle}
            onClearAll={() => {
              setStatusFilter('ALL');
              setActiveQuickFilters([]);
            }}
            showClearAll
          />
        }
        className="mb-6"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider">Role</label>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: 'ALL', label: 'All Roles', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
              { value: 'super_admin', label: 'Super Admin', icon: <Crown className="w-4 h-4 text-primary" /> },
              { value: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4 text-primary" /> },
              { value: 'manager', label: 'Manager', icon: <UserCog className="w-4 h-4 text-primary" /> },
              { value: 'senior_employee', label: 'Senior Employee', icon: <Star className="w-4 h-4 text-warning" /> },
              { value: 'employee', label: 'Employee', icon: <UserCheck className="w-4 h-4 text-success" /> },
              { value: 'intern', label: 'Intern', icon: <GraduationCap className="w-4 h-4 text-accent-foreground" /> },
              { value: 'contractor', label: 'Contractor', icon: <Hammer className="w-4 h-4 text-warning" /> },
            ]}
            variant="filter"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider">Employment Type</label>
          <Select
            value={employmentTypeFilter}
            onChange={setEmploymentTypeFilter}
            options={[
              { value: 'ALL', label: 'All Types', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
              { value: 'full_time', label: 'Full Time', icon: <Briefcase className="w-4 h-4 text-primary" /> },
              { value: 'part_time', label: 'Part Time', icon: <Clock className="w-4 h-4 text-warning" /> },
              { value: 'contract', label: 'Contract', icon: <FileText className="w-4 h-4 text-primary" /> },
              { value: 'temporary', label: 'Temporary', icon: <Hourglass className="w-4 h-4 text-warning" /> },
              { value: 'intern', label: 'Intern', icon: <GraduationCap className="w-4 h-4 text-accent-foreground" /> },
              { value: 'consultant', label: 'Consultant', icon: <HelpCircle className="w-4 h-4 text-primary" /> },
            ]}
            variant="filter"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider">Status</label>
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              // Sync with quick filters
              if (value === 'ACTIVE' || value === 'INVITED' || value === 'SUSPENDED') {
                setActiveQuickFilters([value]);
              } else {
                setActiveQuickFilters([]);
              }
            }}
            options={[
              { value: 'ALL', label: 'All Statuses', icon: <Search className="w-4 h-4 text-muted-foreground" /> },
              { value: 'ACTIVE', label: 'Active', icon: <Circle className="w-4 h-4 text-success fill-success" /> },
              { value: 'INACTIVE', label: 'Inactive', icon: <CircleOff className="w-4 h-4 text-error" /> },
              { value: 'INVITED', label: 'Invited', icon: <Send className="w-4 h-4 text-warning" /> },
              { value: 'SUSPENDED', label: 'Suspended', icon: <XCircle className="w-4 h-4 text-error" /> },
            ]}
            variant="filter"
          />
        </div>
      </FilterPanel>

      <Card className="border-border/50 overflow-visible relative z-40">
        <CardContent className="p-6 overflow-visible relative">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No staff members found</p>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Employee</th>
                    <th className="text-left p-4 font-semibold text-foreground">Contact</th>
                    <th className="text-left p-4 font-semibold text-foreground">Role</th>
                    <th className="text-left p-4 font-semibold text-foreground">Employment</th>
                    <th className="text-left p-4 font-semibold text-foreground">Account</th>
                    <th className="text-right p-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.map((staffMember) => (
                    <tr
                      key={staffMember.id}
                      className="border-b border-border hover:bg-primary/10/50 transition-colors cursor-pointer"
                      onClick={() => handleViewStaff(staffMember)}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {staffMember.firstName} {staffMember.lastName}
                          </p>
                          {staffMember.jobTitle && (
                            <p className="text-sm text-muted-foreground">{staffMember.jobTitle}</p>
                          )}
                          {staffMember.employeeId && (
                            <p className="text-xs text-muted-foreground">{staffMember.employeeId}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium">{staffMember.email}</p>
                          {staffMember.mobileNumber && (
                            <p className="text-sm text-muted-foreground">{staffMember.mobileNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(staffMember.role)}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {getEmploymentTypeBadge(staffMember.employmentType)}
                          <Badge className={staffMember.isActive ? 'bg-success-muted text-success-muted-foreground border-success/30' : 'bg-error-muted text-error-muted-foreground border-error/30'}>
                            {staffMember.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {getAccountStatusBadge(staffMember.accountStatus)}
                          {getAuthMethodIcon(staffMember.authMethod)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          {canInviteStaff && (!staffMember.accountStatus || staffMember.accountStatus === 'pending_activation') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendInvitation(staffMember);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-warning-muted transition-colors"
                              title="Send Invitation"
                              aria-label="Send invitation"
                            >
                              <Send className="w-4 h-4 text-warning" aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewStaff(staffMember);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                            title="View Details"
                            aria-label="View staff details"
                          >
                            <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
                          </Button>
                          {canUpdateStaff && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStaff(staffMember);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 transition-colors"
                              title="Edit"
                              aria-label="Edit staff"
                            >
                              <Edit className="w-4 h-4 text-primary" aria-hidden="true" />
                            </Button>
                          )}
                          {canDeleteStaff && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStaff(staffMember);
                              }}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-error-muted transition-colors"
                              title="Delete"
                              aria-label="Delete staff"
                            >
                              <Trash2 className="w-4 h-4 text-error" aria-hidden="true" />
                            </Button>
                          )}
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
      {!loading && filteredStaff.length > 0 && (
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

        <BulkImportModal
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={loadStaff}
          entityType="staff"
          entityLabel="Staff"
          tenantId={currentTenant?.id}
        />
      </div>
    </div>
    </PermissionGate>
  );
}

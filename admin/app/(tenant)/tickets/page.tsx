'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Plus, Eye, CheckCircle, Clock, XCircle, AlertTriangle, Ticket as TicketIcon, User, MessageSquare, AlertCircle, Loader2, RefreshCw, Pencil, Calendar, History, FileText, Download, ArrowRight } from 'lucide-react';
import { FilterPanel, QuickFilters, QuickFilter } from '@/components/data-listing';
import { DataPageLayout, SidebarSection, SidebarStatItem, HealthWidgetConfig } from '@/components/DataPageLayout';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ticketService } from '@/lib/services/ticketService';
import type { Ticket, TicketStatus, TicketPriority, TicketType, CreateTicketRequest, UpdateTicketRequest } from '@/lib/api/types';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';

const statusOptions = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'REOPENED', label: 'Reopened' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'ESCALATED', label: 'Escalated' },
];

const priorityOptions = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'URGENT', label: 'Urgent' },
];

const typeOptions = [
  { value: 'ALL', label: 'All Types' },
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE', label: 'Feature Request' },
  { value: 'IMPROVEMENT', label: 'Improvement' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'CHANGE_REQUEST', label: 'Change Request' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'QUESTION', label: 'Question' },
];

// Helper to convert JSONB tags object to array
const tagsToArray = (tags?: Record<string, any>): string[] => {
  if (!tags) return [];
  return Object.values(tags).filter((v) => typeof v === 'string');
};

// Helper to get comments from JSONB
const getComments = (comments?: Record<string, any>): any[] => {
  if (!comments) return [];
  return Object.values(comments);
};

// Helper to get assignees from JSONB
const getAssignees = (assignees?: Record<string, any>): string[] => {
  if (!assignees) return [];
  return Object.values(assignees).filter((v) => typeof v === 'string');
};

// Helper to get history from JSONB
const getHistory = (history?: Record<string, any>): any[] => {
  if (!history) return [];
  return Object.values(history).sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt || a.timestamp || 0).getTime();
    const dateB = new Date(b.createdAt || b.timestamp || 0).getTime();
    return dateB - dateA; // newest first
  });
};

// Helper to get attachments from JSONB
const getAttachments = (attachments?: Record<string, any>): any[] => {
  if (!attachments) return [];
  return Object.values(attachments);
};

// Check if a ticket is overdue
const isOverdue = (ticket: Ticket): boolean => {
  if (!ticket.dueDate) return false;
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || ticket.status === 'CANCELLED') return false;
  return new Date(ticket.dueDate) < new Date();
};

export default function TicketsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params?.slug as string;
  const { currentTenant, isLoading: tenantLoading } = useTenant();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState<CreateTicketRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    type: 'SUPPORT',
  });
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateTicketRequest>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Quick filters state
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  const { showAlert } = useDialog();
  const toast = useToast();

  // Validation functions
  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'title':
        if (!value || value.trim() === '') return 'Title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        if (value.length > 200) return 'Title must not exceed 200 characters';
        return null;
      case 'description':
        if (!value || value.trim() === '') return 'Description is required';
        if (value.length < 10) return 'Description must be at least 10 characters';
        return null;
      case 'estimatedTime':
        if (value && !Number.isInteger(Number(value))) return 'Estimated time must be a whole number';
        if (value && Number(value) <= 0) return 'Estimated time must be greater than 0';
        return null;
      default:
        return null;
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setNewTicket({ ...newTicket, [name]: value });
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    ['title', 'description'].forEach(field => {
      const error = validateField(field, newTicket[field as keyof typeof newTicket]);
      if (error) newErrors[field] = error;
    });

    if (newTicket.estimatedTime) {
      const error = validateField('estimatedTime', newTicket.estimatedTime);
      if (error) newErrors.estimatedTime = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load tickets
  useEffect(() => {
    // Don't fetch if tenant is still loading or not set
    if (tenantLoading || !currentTenant) {
      return;
    }

    // Reset state when tenant changes
    setTickets([]);
    setError(null);
    loadTickets();
  }, [tenantSlug, currentTenant?.id, tenantLoading, statusFilter, priorityFilter, typeFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getTickets({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setError(error instanceof Error ? error.message : 'Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Deep-link: auto-open detail when ?id= is present
  useEffect(() => {
    if (loading || !tickets.length) return;
    const ticketId = searchParams.get('id');
    if (ticketId) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setShowDetailModal(true);
      }
    }
  }, [searchParams, tickets, loading]);

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchQuery.toLowerCase();
    const tags = tagsToArray(ticket.tags);

    // Search filter
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower) ||
      ticket.createdBy.toLowerCase().includes(searchLower) ||
      tags.some((tag) => tag.toLowerCase().includes(searchLower));

    // Quick filters (if any are active, ticket must match at least one)
    const matchesQuickFilters = activeQuickFilters.length === 0 ||
      activeQuickFilters.some(filterId => {
        if (filterId === 'CRITICAL') {
          return ticket.priority === 'CRITICAL' || ticket.priority === 'URGENT';
        }
        return ticket.status === filterId;
      });

    return matchesSearch && matchesQuickFilters;
  });

  // Pagination calculations
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, typeFilter, activeQuickFilters]);

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      setError(null);
      await ticketService.updateTicketStatus(ticketId, status);
      toast.success('Status Updated', `Ticket status changed to ${status.replace(/_/g, ' ')}`);
      loadTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setShowDetailModal(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ticket status. Please try again.';
      setError(errorMessage);
      toast.error('Update Failed', errorMessage);
      showAlert({
        title: 'Error',
        message: 'Failed to update ticket status',
      });
    }
  };

  const handleCreateTicket = async () => {
    if (!validateForm()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please fix the errors in the form before submitting.',
      });
      return;
    }

    try {
      setError(null);
      await ticketService.createTicket(newTicket);
      toast.success('Ticket Created', 'Your ticket has been created successfully');
      setShowCreateModal(false);
      setNewTicket({
        title: '',
        description: '',
        priority: 'MEDIUM',
        type: 'SUPPORT',
      });
      setErrors({});
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket. Please try again.';
      setError(errorMessage);
      toast.error('Creation Failed', errorMessage);
      showAlert({
        title: 'Error',
        message: 'Failed to create ticket',
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;

    try {
      setAddingComment(true);
      setError(null);
      const response = await ticketService.addComment(selectedTicket.id, newComment);
      toast.success('Comment Added', 'Your comment has been added successfully');
      setSelectedTicket(response.data);
      setNewComment('');
      loadTickets();
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment. Please try again.';
      setError(errorMessage);
      toast.error('Comment Failed', errorMessage);
      showAlert({
        title: 'Error',
        message: 'Failed to add comment',
      });
    } finally {
      setAddingComment(false);
    }
  };

  const startEditing = () => {
    if (!selectedTicket) return;
    setEditData({
      title: selectedTicket.title,
      description: selectedTicket.description,
      priority: selectedTicket.priority as TicketPriority,
      tags: tagsToArray(selectedTicket.tags),
      dueDate: selectedTicket.dueDate ? selectedTicket.dueDate.split('T')[0] : undefined,
      estimatedTime: selectedTicket.estimatedTime,
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const handleEditFieldChange = (name: string, value: any) => {
    setEditData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setEditErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const handleSaveEdit = async () => {
    if (!selectedTicket) return;

    // Validate edit fields
    const newEditErrors: Record<string, string> = {};
    if (editData.title !== undefined) {
      const err = validateField('title', editData.title);
      if (err) newEditErrors.title = err;
    }
    if (editData.description !== undefined) {
      const err = validateField('description', editData.description);
      if (err) newEditErrors.description = err;
    }
    if (editData.estimatedTime !== undefined) {
      const err = validateField('estimatedTime', editData.estimatedTime);
      if (err) newEditErrors.estimatedTime = err;
    }
    setEditErrors(newEditErrors);
    if (Object.keys(newEditErrors).length > 0) return;

    setIsSavingEdit(true);
    try {
      const payload: UpdateTicketRequest = { ...editData };
      if (payload.dueDate) {
        payload.dueDate = new Date(payload.dueDate).toISOString();
      }
      const response = await ticketService.updateTicket(selectedTicket.id, payload);
      toast.success('Ticket Updated', 'Ticket has been updated successfully');
      setSelectedTicket(response.data);
      setIsEditing(false);
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update ticket.';
      toast.error('Update Failed', errorMessage);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    const classes: Record<TicketStatus, string> = {
      OPEN: 'bg-primary/20 text-primary border-primary/30',
      IN_PROGRESS: 'bg-warning-muted text-warning-foreground border-warning/30',
      ON_HOLD: 'bg-primary/10 text-primary border-primary/30',
      RESOLVED: 'bg-success-muted text-success-foreground border-success/30',
      CLOSED: 'bg-muted text-foreground border-border',
      REOPENED: 'bg-warning-muted text-warning border-warning/30',
      CANCELLED: 'bg-error-muted text-error border-error/30',
      PENDING_APPROVAL: 'bg-warning-muted text-warning border-warning/30',
      ESCALATED: 'bg-error-muted text-error border-error/30',
    };
    return classes[status] || classes.OPEN;
  };

  const getPriorityBadgeClass = (priority: TicketPriority) => {
    const classes: Record<TicketPriority, string> = {
      LOW: 'bg-muted text-foreground border-border',
      MEDIUM: 'bg-primary/20 text-primary border-primary/30',
      HIGH: 'bg-warning-muted text-warning border-warning/30',
      CRITICAL: 'bg-error-muted text-error border-error/30',
      URGENT: 'bg-error-muted text-error border-error/30',
    };
    return classes[priority] || classes.MEDIUM;
  };

  // Calculate summary metrics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED').length;
  const urgentTickets = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'CRITICAL').length;

  // Quick filters configuration
  const quickFilters: QuickFilter[] = useMemo(() => [
    { id: 'OPEN', label: 'Open', icon: AlertCircle, color: 'warning', count: openTickets },
    { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'info', count: inProgressTickets },
    { id: 'RESOLVED', label: 'Resolved', icon: CheckCircle, color: 'success', count: resolvedTickets },
    { id: 'CRITICAL', label: 'Critical', icon: AlertTriangle, color: 'error', count: urgentTickets },
  ], [openTickets, inProgressTickets, resolvedTickets, urgentTickets]);

  const handleQuickFilterToggle = (filterId: string) => {
    setActiveQuickFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleClearQuickFilters = () => {
    setActiveQuickFilters([]);
  };

  // Count active dropdown filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (priorityFilter !== 'ALL') count++;
    if (typeFilter !== 'ALL') count++;
    return count;
  }, [statusFilter, priorityFilter, typeFilter]);

  const handleClearAllFilters = () => {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setTypeFilter('ALL');
    setSearchQuery('');
    setActiveQuickFilters([]);
  };

  // Sidebar configuration for DataPageLayout
  const sidebarConfig = useMemo(() => {
    const healthWidget: HealthWidgetConfig = {
      label: 'Ticket Health',
      currentValue: resolvedTickets,
      totalValue: totalTickets || 1,
      status: urgentTickets > 5 ? 'critical' : openTickets > 20 ? 'attention' : 'healthy',
      segments: [
        { value: resolvedTickets, color: 'success' },
        { value: inProgressTickets, color: 'primary' },
        { value: openTickets, color: 'warning' },
        { value: urgentTickets, color: 'error' },
      ],
    };

    const sections: SidebarSection[] = [
      {
        title: 'Ticket Status',
        items: [
          {
            id: 'total',
            label: 'Total',
            value: totalTickets,
            icon: TicketIcon,
            color: 'default',
          },
          {
            id: 'open',
            label: 'Open',
            value: openTickets,
            icon: AlertCircle,
            color: 'warning',
            onClick: () => {
              setStatusFilter('OPEN');
              setActiveQuickFilters(['OPEN']);
            },
            isActive: statusFilter === 'OPEN',
          },
          {
            id: 'in-progress',
            label: 'In Progress',
            value: inProgressTickets,
            icon: Clock,
            color: 'primary',
            onClick: () => {
              setStatusFilter('IN_PROGRESS');
              setActiveQuickFilters(['IN_PROGRESS']);
            },
            isActive: statusFilter === 'IN_PROGRESS',
          },
          {
            id: 'resolved',
            label: 'Resolved',
            value: resolvedTickets,
            icon: CheckCircle,
            color: 'success',
            onClick: () => {
              setStatusFilter('RESOLVED');
              setActiveQuickFilters(['RESOLVED']);
            },
            isActive: statusFilter === 'RESOLVED',
          },
        ],
      },
      {
        title: 'Priority',
        items: [
          {
            id: 'urgent',
            label: 'Critical/Urgent',
            value: urgentTickets,
            icon: AlertTriangle,
            color: 'error',
            onClick: () => {
              setPriorityFilter('CRITICAL');
              setActiveQuickFilters(['CRITICAL']);
            },
            isActive: priorityFilter === 'CRITICAL' || priorityFilter === 'URGENT',
          },
        ],
      },
    ];

    return { healthWidget, sections };
  }, [totalTickets, openTickets, inProgressTickets, resolvedTickets, urgentTickets, statusFilter, priorityFilter]);

  // Mobile stats for DataPageLayout
  const mobileStats: SidebarStatItem[] = useMemo(() => [
    { id: 'total', label: 'Total', value: totalTickets, icon: TicketIcon, color: 'default' },
    { id: 'open', label: 'Open', value: openTickets, icon: AlertCircle, color: 'warning' },
    { id: 'in-progress', label: 'In Progress', value: inProgressTickets, icon: Clock, color: 'primary' },
    { id: 'resolved', label: 'Resolved', value: resolvedTickets, icon: CheckCircle, color: 'success' },
    { id: 'urgent', label: 'Critical', value: urgentTickets, icon: AlertTriangle, color: 'error' },
  ], [totalTickets, openTickets, inProgressTickets, resolvedTickets, urgentTickets]);

  return (
    <PermissionGate
      permission={Permission.TICKETS_READ}
      fallback="styled"
      fallbackTitle="Tickets Access Required"
      fallbackDescription="You don't have the required permissions to view tickets. Please contact your administrator to request access."
      loading={<PageLoading fullScreen />}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Tickets Management"
          description="Manage support tickets, track issues, and provide customer support"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Team', href: '/staff' },
            { label: 'Tickets' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={loadTickets}
                disabled={loading}
                title="Refresh"
                className="p-2.5 rounded-md bg-muted hover:bg-muted transition-all"
              >
                <RefreshCw className={cn("w-5 h-5 text-muted-foreground", loading && "animate-spin")} />
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-primary-foreground hover:opacity-90 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Ticket</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          }
        />

        {/* Error Alert */}
        <PageError error={error} onDismiss={() => setError(null)} onRetry={loadTickets} />

        {/* Hide content when there's a critical error */}
        {error && (error.toLowerCase().includes('permission') || error.toLowerCase().includes('forbidden') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('access denied') || error.toLowerCase().includes('admin portal')) ? null : (
        <>
        <DataPageLayout
          sidebar={sidebarConfig}
          mobileStats={mobileStats}
        >
        {/* Filters and Search */}
        <FilterPanel
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tickets..."
          activeFilterCount={activeFilterCount}
          onClearAll={handleClearAllFilters}
          className="mb-6"
          quickFilters={
            <QuickFilters
              filters={quickFilters}
              activeFilters={activeQuickFilters}
              onFilterToggle={handleQuickFilterToggle}
              onClearAll={handleClearQuickFilters}
              showClearAll
            />
          }
        >
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={statusOptions}
          />

          <Select
            value={priorityFilter}
            onChange={(value) => setPriorityFilter(value)}
            options={priorityOptions}
          />

          <Select
            value={typeFilter}
            onChange={(value) => setTypeFilter(value)}
            options={typeOptions}
          />
        </FilterPanel>

        {/* Tickets Table */}
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={6} columns={7} />
          ) : paginatedTickets.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No tickets found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden lg:table-cell">Created By</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedTickets.map((ticket) => {
                  const tags = tagsToArray(ticket.tags);
                  const comments = getComments(ticket.comments);
                  const assignees = getAssignees(ticket.assignees);

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-muted/50 transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[300px]" title={ticket.title}>
                            {ticket.title}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]" title={ticket.description}>
                            {ticket.description}
                          </p>
                          {tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
                              )}
                            </div>
                          )}
                          {(comments.length > 0 || assignees.length > 0) && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {comments.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {comments.length}
                                </span>
                              )}
                              {assignees.length > 0 && (
                                <span className="truncate max-w-[150px]" title={assignees.join(', ')}>
                                  Assigned: {assignees[0]}{assignees.length > 1 && ` +${assignees.length - 1}`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-foreground border border-border font-medium">
                          {ticket.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                          getPriorityBadgeClass(ticket.priority)
                        )}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                          getStatusBadgeClass(ticket.status)
                        )}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground truncate max-w-[120px]" title={ticket.createdByName || ticket.createdBy}>
                            {ticket.createdByName || ticket.createdBy}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.estimatedTime && (
                          <p className="text-xs text-muted-foreground">Est: {ticket.estimatedTime}m</p>
                        )}
                        {ticket.dueDate && (
                          <p className={cn(
                            "text-xs flex items-center gap-1 mt-0.5",
                            isOverdue(ticket) ? "text-error font-semibold" : "text-muted-foreground"
                          )}>
                            {isOverdue(ticket) && <AlertCircle className="h-3 w-3" />}
                            Due: {new Date(ticket.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowDetailModal(true);
                            }}
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ticket.status === 'OPEN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                              className="h-8 w-8 p-0 hover:bg-warning-muted hover:text-warning"
                              title="Start Progress"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                              className="h-8 w-8 p-0 hover:bg-success-muted hover:text-success"
                              title="Mark Resolved"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {ticket.status === 'RESOLVED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(ticket.id, 'CLOSED')}
                              className="h-8 w-8 p-0 hover:bg-muted hover:text-muted-foreground"
                              title="Close Ticket"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
        </DataPageLayout>
        </>
        )}

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  Create New Ticket
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Title <span className="text-error">*</span>
                  </label>
                  <Input
                    value={newTicket.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="Brief description of the issue"
                    className={errors.title ? 'border-error' : ''}
                  />
                  {errors.title && (
                    <div className="flex items-center gap-1 mt-1 text-error text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.title}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Description <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Detailed description of the issue..."
                    className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:border-primary ${
                      errors.description ? 'border-error' : 'border-border'
                    }`}
                    rows={4}
                  />
                  {errors.description && (
                    <div className="flex items-center gap-1 mt-1 text-error text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.description}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Type <span className="text-error">*</span>
                    </label>
                    <Select
                      value={newTicket.type}
                      onChange={(value) => setNewTicket({ ...newTicket, type: value as TicketType })}
                      options={typeOptions.filter(o => o.value !== 'ALL')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Priority <span className="text-error">*</span>
                    </label>
                    <Select
                      value={newTicket.priority}
                      onChange={(value) => setNewTicket({ ...newTicket, priority: value as TicketPriority })}
                      options={priorityOptions.filter(o => o.value !== 'ALL')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={newTicket.tags?.join(', ') || ''}
                    onChange={(e) => setNewTicket({
                      ...newTicket,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    placeholder="bug, urgent, payment"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Estimated Time (minutes)
                    </label>
                    <Input
                      type="number"
                      value={newTicket.estimatedTime || ''}
                      onChange={(e) => handleFieldChange('estimatedTime', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="120"
                      className={errors.estimatedTime ? 'border-error' : ''}
                    />
                    {errors.estimatedTime && (
                      <div className="flex items-center gap-1 mt-1 text-error text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.estimatedTime}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={newTicket.dueDate || ''}
                      onChange={(e) => setNewTicket({ ...newTicket, dueDate: e.target.value || undefined })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTicket}
                  disabled={!newTicket.title || !newTicket.description}
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Create Ticket
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">
                  {isEditing ? 'Edit Ticket' : 'Ticket Details'}
                </h2>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="p-6 space-y-4">
                {/* Status / Priority / Type badges (always visible) */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                    getStatusBadgeClass(selectedTicket.status)
                  )}>
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </span>
                  {isEditing ? (
                    <Select
                      value={editData.priority || selectedTicket.priority}
                      onChange={(value) => handleEditFieldChange('priority', value)}
                      options={priorityOptions.filter(o => o.value !== 'ALL')}
                    />
                  ) : (
                    <span className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                      getPriorityBadgeClass(selectedTicket.priority)
                    )}>
                      {selectedTicket.priority}
                    </span>
                  )}
                  <span className="text-xs px-3 py-1 rounded-full bg-muted text-foreground border border-border font-semibold">
                    {selectedTicket.type.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Title and Description — editable or read-only */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Title</label>
                      <Input
                        value={editData.title || ''}
                        onChange={(e) => handleEditFieldChange('title', e.target.value)}
                        className={editErrors.title ? 'border-error' : ''}
                      />
                      {editErrors.title && (
                        <p className="text-error text-sm mt-1">{editErrors.title}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => handleEditFieldChange('description', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:border-primary ${
                          editErrors.description ? 'border-error' : 'border-border'
                        }`}
                        rows={4}
                      />
                      {editErrors.description && (
                        <p className="text-error text-sm mt-1">{editErrors.description}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Tags (comma-separated)</label>
                      <Input
                        value={editData.tags?.join(', ') || ''}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                        }))}
                        placeholder="bug, urgent, payment"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Estimated Time (min)</label>
                        <Input
                          type="number"
                          value={editData.estimatedTime || ''}
                          onChange={(e) => handleEditFieldChange('estimatedTime', e.target.value ? parseInt(e.target.value) : undefined)}
                          className={editErrors.estimatedTime ? 'border-error' : ''}
                        />
                        {editErrors.estimatedTime && (
                          <p className="text-error text-sm mt-1">{editErrors.estimatedTime}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Due Date</label>
                        <Input
                          type="date"
                          value={editData.dueDate || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value || undefined }))}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{selectedTicket.title}</h3>
                    <p className="text-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                )}

                {/* Info grid (read-only) */}
                {!isEditing && (
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-semibold text-foreground">{selectedTicket.createdByName || selectedTicket.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="font-semibold text-foreground">
                        {getAssignees(selectedTicket.assignees).join(', ') || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-semibold text-foreground">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Updated</p>
                      <p className="font-semibold text-foreground">
                        {new Date(selectedTicket.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedTicket.dueDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className={cn(
                          "font-semibold flex items-center gap-1",
                          isOverdue(selectedTicket) ? "text-error" : "text-foreground"
                        )}>
                          {isOverdue(selectedTicket) && <AlertCircle className="h-4 w-4" />}
                          {new Date(selectedTicket.dueDate).toLocaleDateString()}
                          {isOverdue(selectedTicket) && <span className="text-xs">(Overdue)</span>}
                        </p>
                      </div>
                    )}
                    {selectedTicket.estimatedTime && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Time</p>
                        <p className="font-semibold text-foreground">{selectedTicket.estimatedTime} minutes</p>
                      </div>
                    )}
                    {selectedTicket.actualTime && (
                      <div>
                        <p className="text-sm text-muted-foreground">Actual Time</p>
                        <p className="font-semibold text-foreground">{selectedTicket.actualTime} minutes</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags (read-only) */}
                {!isEditing && selectedTicket.tags && tagsToArray(selectedTicket.tags).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex gap-2 flex-wrap">
                      {tagsToArray(selectedTicket.tags).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                {!isEditing && getAttachments(selectedTicket.attachments).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Attachments ({getAttachments(selectedTicket.attachments).length})
                    </p>
                    <div className="space-y-2">
                      {getAttachments(selectedTicket.attachments).map((attachment: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate">
                              {attachment.fileName || attachment.name || `Attachment ${index + 1}`}
                            </span>
                            {attachment.fileSize && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                ({Math.round(attachment.fileSize / 1024)}KB)
                              </span>
                            )}
                          </div>
                          {attachment.url && (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 shrink-0"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                {!isEditing && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">
                    Comments {getComments(selectedTicket.comments).length > 0 && `(${getComments(selectedTicket.comments).length})`}
                  </p>

                  {getComments(selectedTicket.comments).length > 0 && (
                    <div className="space-y-3 mb-4">
                      {getComments(selectedTicket.comments).map((comment: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg border bg-muted border-border"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">{comment.userName || comment.userId || 'User'}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <div className="space-y-3">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Add Comment
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your comment here..."
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addingComment}
                          size="sm"
                          className="bg-primary text-white hover:bg-primary disabled:opacity-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {addingComment ? 'Adding...' : 'Add Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {getComments(selectedTicket.comments).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No comments yet</p>
                  )}
                </div>
                )}

                {/* Activity History */}
                {!isEditing && getHistory(selectedTicket.history).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Activity History ({getHistory(selectedTicket.history).length})
                    </p>
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                      <div className="space-y-4">
                        {getHistory(selectedTicket.history).map((entry: any, index: number) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                            <div className="ml-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-foreground">
                                  {entry.action || entry.type || 'Update'}
                                </span>
                                {entry.fromStatus && entry.toStatus && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {entry.fromStatus.replace(/_/g, ' ')}
                                    <ArrowRight className="h-3 w-3" />
                                    {entry.toStatus.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {(entry.userName || entry.userId) && (
                                  <span>by {entry.userName || entry.userId}</span>
                                )}
                                <span>{new Date(entry.createdAt || entry.timestamp).toLocaleString()}</span>
                              </div>
                              {entry.description && (
                                <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Update Actions (only in view mode) */}
                {!isEditing && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-3">Quick Actions</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTicket.status === 'OPEN' && (
                      <Button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')}
                        size="sm"
                        className="bg-warning text-white hover:bg-warning"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Start Progress
                      </Button>
                    )}
                    {(selectedTicket.status === 'OPEN' || selectedTicket.status === 'IN_PROGRESS') && (
                      <Button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                        size="sm"
                        className="bg-success text-white hover:bg-success"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}
                    {selectedTicket.status === 'RESOLVED' && (
                      <Button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')}
                        size="sm"
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </Button>
                    )}
                    {selectedTicket.status !== 'ESCALATED' && selectedTicket.status !== 'CLOSED' && (
                      <Button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'ESCALATED')}
                        size="sm"
                        variant="outline"
                        className="border-error/30 text-error hover:bg-error-muted"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Escalate
                      </Button>
                    )}
                  </div>
                </div>
                )}
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditErrors({});
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {isSavingEdit ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedTicket(null);
                      setIsEditing(false);
                    }}
                    variant="outline"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}

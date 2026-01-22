'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Search, Plus, Eye, CheckCircle, Clock, XCircle, AlertTriangle, Ticket as TicketIcon, User, MessageSquare, AlertCircle, X, Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageError } from '@/components/PageError';
import { PageLoading } from '@/components/common';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ticketService } from '@/lib/services/ticketService';
import type { Ticket, TicketStatus, TicketPriority, TicketType, CreateTicketRequest } from '@/lib/api/types';
import { useDialog } from '@/contexts/DialogContext';

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

export default function TicketsPage() {
  const params = useParams();
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

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { showAlert } = useDialog();

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

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchQuery.toLowerCase();
    const tags = tagsToArray(ticket.tags);
    return (
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower) ||
      ticket.createdBy.toLowerCase().includes(searchLower) ||
      tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
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
  }, [searchQuery, statusFilter, priorityFilter, typeFilter]);

  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      setError(null);
      await ticketService.updateTicketStatus(ticketId, status);
      loadTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setShowDetailModal(false);
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update ticket status. Please try again.');
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
      setError(error instanceof Error ? error.message : 'Failed to create ticket. Please try again.');
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
      setSelectedTicket(response.data);
      setNewComment('');
      loadTickets();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to add comment. Please try again.');
      showAlert({
        title: 'Error',
        message: 'Failed to add comment',
      });
    } finally {
      setAddingComment(false);
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
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-primary-foreground hover:opacity-90 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Ticket</span>
              <span className="sm:hidden">Create</span>
            </Button>
          }
        />

        {/* Error Alert */}
        <PageError error={error} onDismiss={() => setError(null)} />


        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Tickets</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
                  {totalTickets}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TicketIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Open</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
                  {openTickets}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">In Progress</p>
                <p className="text-2xl sm:text-3xl font-bold text-warning mt-1 sm:mt-2">
                  {inProgressTickets}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Resolved</p>
                <p className="text-2xl sm:text-3xl font-bold text-success mt-1 sm:mt-2">
                  {resolvedTickets}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Critical/Urgent</p>
                <p className="text-2xl sm:text-3xl font-bold text-error mt-1 sm:mt-2">
                  {urgentTickets}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error-muted rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-error" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

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
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-3 text-muted-foreground">Loading tickets...</p>
            </div>
          ) : paginatedTickets.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center text-muted-foreground">
              No tickets found
            </div>
          ) : (
            paginatedTickets.map((ticket) => {
              const tags = tagsToArray(ticket.tags);
              const comments = getComments(ticket.comments);
              const assignees = getAssignees(ticket.assignees);

              return (
                <div
                  key={ticket.id}
                  className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <span className={cn(
                          'inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border',
                          getStatusBadgeClass(ticket.status)
                        )}>
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                        <span className={cn(
                          'inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border',
                          getPriorityBadgeClass(ticket.priority)
                        )}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs px-2 sm:px-3 py-1 rounded-full bg-muted text-foreground border border-border font-semibold">
                          {ticket.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{ticket.title}</h3>
                      <p className="text-sm sm:text-base text-foreground mb-4 line-clamp-2">{ticket.description}</p>

                      <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{ticket.createdByName || ticket.createdBy}</span>
                        </span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {assignees.length > 0 && (
                          <span className="text-primary truncate">
                            <span className="hidden sm:inline">Assigned to: </span>{assignees.join(', ')}
                          </span>
                        )}
                        {comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                            {comments.length}
                          </span>
                        )}
                        {ticket.estimatedTime && (
                          <span>Est: {ticket.estimatedTime}m</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 sm:ml-4 justify-end sm:justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetailModal(true);
                        }}
                        className="hover:bg-primary/10 hover:text-primary"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {ticket.status === 'OPEN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                          className="hover:bg-warning-muted hover:text-warning"
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
                          className="hover:bg-success-muted hover:text-success"
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
                          className="hover:bg-muted hover:text-muted-foreground"
                          title="Close Ticket"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
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

        {/* Create Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent ${
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
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-2xl font-bold text-primary">
                  Ticket Details
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                    getStatusBadgeClass(selectedTicket.status)
                  )}>
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                    getPriorityBadgeClass(selectedTicket.priority)
                  )}>
                    {selectedTicket.priority}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-muted text-foreground border border-border font-semibold">
                    {selectedTicket.type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{selectedTicket.title}</h3>
                  <p className="text-foreground">{selectedTicket.description}</p>
                </div>

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

                {selectedTicket.tags && tagsToArray(selectedTicket.tags).length > 0 && (
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

                {/* Comments Section */}
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
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Add Comment
                      </label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your comment here..."
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
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

                {/* Status Update Actions */}
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
              </div>

              <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedTicket(null);
                  }}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}

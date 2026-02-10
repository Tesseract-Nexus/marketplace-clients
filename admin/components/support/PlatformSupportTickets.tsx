'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Eye,
  MessageSquare,
  AlertCircle,
  Loader2,
  RefreshCw,
  Send,
  X,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Select } from '@/components/Select';
import { ticketService } from '@/lib/services/ticketService';
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketType,
  CreateTicketRequest,
} from '@/lib/api/types';
import { useToast } from '@/contexts/ToastContext';

const PLATFORM_SUPPORT_TAG = 'platform-support';

const typeOptions = [
  { value: 'BUG', label: 'Bug Report' },
  { value: 'FEATURE', label: 'Feature Request' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'IMPROVEMENT', label: 'Improvement' },
  { value: 'QUESTION', label: 'Question' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const tagsToArray = (tags?: Record<string, any>): string[] => {
  if (!tags) return [];
  return Object.values(tags).filter((v) => typeof v === 'string');
};

const getComments = (comments?: Record<string, any>): any[] => {
  if (!comments) return [];
  return Object.values(comments);
};

const getStatusBadgeClass = (status: TicketStatus) => {
  const classes: Record<string, string> = {
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
  const classes: Record<string, string> = {
    LOW: 'bg-muted text-foreground border-border',
    MEDIUM: 'bg-primary/20 text-primary border-primary/30',
    HIGH: 'bg-warning-muted text-warning border-warning/30',
    CRITICAL: 'bg-error-muted text-error border-error/30',
    URGENT: 'bg-error-muted text-error border-error/30',
  };
  return classes[priority] || classes.MEDIUM;
};

type View = 'list' | 'create' | 'detail';

export function PlatformSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState<CreateTicketRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    type: 'SUPPORT',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const toast = useToast();

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketService.getTickets({});
      const platformTickets = response.data.filter((ticket) => {
        const tags = tagsToArray(ticket.tags);
        return tags.includes(PLATFORM_SUPPORT_TAG);
      });
      setTickets(platformTickets);
    } catch (err) {
      console.error('Error loading platform tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const resetForm = () => {
    setNewTicket({ title: '', description: '', priority: 'MEDIUM', type: 'SUPPORT' });
    setFormErrors({});
  };

  const handleCreateTicket = async () => {
    const errors: Record<string, string> = {};
    if (!newTicket.title.trim()) errors.title = 'Title is required';
    else if (newTicket.title.length < 3) errors.title = 'Title must be at least 3 characters';
    if (!newTicket.description.trim()) errors.description = 'Description is required';
    else if (newTicket.description.length < 10) errors.description = 'Description must be at least 10 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setCreating(true);
      await ticketService.createTicket({
        ...newTicket,
        tags: [PLATFORM_SUPPORT_TAG],
      });
      toast.success('Ticket Created', 'Your platform support ticket has been submitted');
      resetForm();
      setView('list');
      loadTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error('Failed', err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return;

    try {
      setAddingComment(true);
      const response = await ticketService.addComment(selectedTicket.id, newComment);
      toast.success('Comment Added', 'Your comment has been added');
      setSelectedTicket(response.data);
      setNewComment('');
      loadTickets();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed', err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const goToList = () => {
    setView('list');
    setSelectedTicket(null);
    resetForm();
  };

  // --- Create View ---
  if (view === 'create') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h3 className="text-lg font-semibold text-foreground">New Platform Support Ticket</h3>
            <p className="text-sm text-muted-foreground">
              This ticket will be sent to the Tesserix platform team
            </p>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Title <span className="text-error">*</span>
            </label>
            <Input
              value={newTicket.title}
              onChange={(e) => {
                setNewTicket({ ...newTicket, title: e.target.value });
                if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
              }}
              placeholder="Brief summary of the issue or request"
              className={formErrors.title ? 'border-error' : ''}
            />
            {formErrors.title && (
              <p className="flex items-center gap-1 mt-1 text-error text-sm">
                <AlertCircle className="h-4 w-4" />
                {formErrors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              value={newTicket.description}
              onChange={(e) => {
                setNewTicket({ ...newTicket, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: '' });
              }}
              placeholder="Describe the issue, expected behavior, and steps to reproduce..."
              className={`w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:border-primary ${
                formErrors.description ? 'border-error' : 'border-border'
              }`}
              rows={4}
            />
            {formErrors.description && (
              <p className="flex items-center gap-1 mt-1 text-error text-sm">
                <AlertCircle className="h-4 w-4" />
                {formErrors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Type</label>
              <Select
                value={newTicket.type}
                onChange={(value) => setNewTicket({ ...newTicket, type: value as TicketType })}
                options={typeOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Priority</label>
              <Select
                value={newTicket.priority}
                onChange={(value) => setNewTicket({ ...newTicket, priority: value as TicketPriority })}
                options={priorityOptions}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={goToList}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Ticket'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Detail View ---
  if (view === 'detail' && selectedTicket) {
    const comments = getComments(selectedTicket.comments);

    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={goToList}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to tickets
        </Button>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
              getStatusBadgeClass(selectedTicket.status)
            )}>
              {selectedTicket.status.replace(/_/g, ' ')}
            </span>
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
              getPriorityBadgeClass(selectedTicket.priority)
            )}>
              {selectedTicket.priority}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground border border-border font-medium">
              {selectedTicket.type.replace(/_/g, ' ')}
            </span>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">{selectedTicket.title}</h3>
          <p className="text-foreground whitespace-pre-wrap mb-4">{selectedTicket.description}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Updated</p>
              <p className="font-medium">{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h4 className="text-sm font-semibold text-foreground mb-4">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h4>

          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((comment: any, index: number) => (
                <div key={index} className="p-4 rounded-lg border bg-muted border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground text-sm">
                      {comment.userName || comment.userId || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground italic mb-4">No comments yet</p>
          )}

          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:border-primary resize-none"
              rows={2}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addingComment}
              size="sm"
              className="self-end"
            >
              {addingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Platform Support Tickets</h3>
          <p className="text-sm text-muted-foreground">
            Raise bugs, feature requests, and support tickets to the Tesserix platform team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTickets}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button onClick={() => setView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-error-muted border border-error/30 rounded-lg p-4 text-sm text-error">
          {error}
          <Button variant="ghost" size="sm" className="ml-2" onClick={loadTickets}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-foreground mb-2">No platform tickets yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create a ticket to report bugs, request features, or get support from the platform team.
          </p>
          <Button onClick={() => setView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const comments = getComments(ticket.comments);
            return (
              <div
                key={ticket.id}
                className="bg-card rounded-lg border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setView('detail');
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{ticket.title}</h4>
                    <p className="text-sm text-muted-foreground truncate mt-1">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                        getStatusBadgeClass(ticket.status)
                      )}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
                        getPriorityBadgeClass(ticket.priority)
                      )}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                        {ticket.type.replace(/_/g, ' ')}
                      </span>
                      {comments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {comments.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

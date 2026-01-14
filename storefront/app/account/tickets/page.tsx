'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket as TicketIcon,
  ChevronRight,
  Loader2,
  AlertCircle,
  MessageSquare,
  Clock,
  ArrowUp,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  listTickets,
  Ticket,
  getStatusColor,
  getPriorityColor,
  formatStatus
} from '@/lib/api/tickets';
import { CreateTicketModal } from '@/components/account/CreateTicketModal';
import { cn } from '@/lib/utils';

export default function TicketsPage() {
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const { accessToken, customer } = useAuthStore();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!tenant || !accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await listTickets(
        tenant.id,
        tenant.storefrontId,
        accessToken,
        { page, limit: 10 },
        customer?.id
      );
      setTickets(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [tenant, accessToken, page, customer?.id]);

  useEffect(() => {
    if (tenant && accessToken) {
      fetchTickets();
    }
  }, [tenant, accessToken, page, fetchTickets]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUPPORT':
        return <MessageSquare className="h-4 w-4" />;
      case 'INCIDENT':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <TicketIcon className="h-4 w-4" />;
    }
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Support Tickets</h2>
          <p className="text-muted-foreground mt-1">
            Track and manage your support requests
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-tenant-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTickets}
      />

      {error ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchTickets}
          >
            Try Again
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center">
          <TicketIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Support Tickets</h3>
          <p className="text-muted-foreground">
            You haven't submitted any support tickets yet.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={getNavPath(`/account/tickets/${ticket.id}`)}>
                    <div className="bg-card rounded-xl border p-4 hover:border-tenant-primary/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : ticket.status === 'ESCALATED'
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        )}>
                          {ticket.status === 'ESCALATED'
                            ? <ArrowUp className="h-5 w-5" />
                            : getTypeIcon(ticket.type)
                          }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate group-hover:text-tenant-primary transition-colors">
                                {ticket.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {ticket.description.substring(0, 100)}
                                {ticket.description.length > 100 && '...'}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-tenant-primary transition-colors flex-shrink-0" />
                          </div>

                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <Badge className={cn('font-medium', getStatusColor(ticket.status))}>
                              {formatStatus(ticket.status)}
                            </Badge>
                            <Badge variant="outline" className={cn('font-medium', getPriorityColor(ticket.priority))}>
                              {ticket.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

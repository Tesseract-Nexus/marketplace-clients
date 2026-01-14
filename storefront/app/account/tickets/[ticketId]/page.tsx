'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  Calendar,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  getTicket,
  Ticket,
  getStatusColor,
  getPriorityColor,
  formatStatus
} from '@/lib/api/tickets';
import { TicketTimeline } from '@/components/account/TicketTimeline';
import { TicketReplyForm } from '@/components/account/TicketReplyForm';
import { cn } from '@/lib/utils';

interface TicketDetailPageProps {
  params: Promise<{ ticketId: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticketId } = use(params);
  const router = useRouter();
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const { accessToken, customer } = useAuthStore();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!tenant || !accessToken || !ticketId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTicket(
        tenant.id,
        tenant.storefrontId,
        accessToken,
        ticketId,
        customer?.id
      );
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket');
    } finally {
      setIsLoading(false);
    }
  }, [tenant, accessToken, ticketId, customer?.id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTicketClosed = ticket && (
    ticket.status === 'CLOSED' ||
    ticket.status === 'RESOLVED' ||
    ticket.status === 'CANCELLED'
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-card rounded-xl border p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Ticket Not Found</h3>
        <p className="text-muted-foreground mb-4">
          {error || 'The requested ticket could not be found.'}
        </p>
        <Button asChild variant="outline">
          <Link href={getNavPath('/account/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2"
            onClick={() => router.push(getNavPath('/account/tickets'))}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tickets
          </Button>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge className={cn('font-medium', getStatusColor(ticket.status))}>
              {formatStatus(ticket.status)}
            </Badge>
            <Badge variant="outline" className={cn('font-medium', getPriorityColor(ticket.priority))}>
              {ticket.priority} Priority
            </Badge>
            <Badge variant="outline">
              <Tag className="h-3 w-3 mr-1" />
              {ticket.type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-4">Activity</h2>
            <TicketTimeline
              comments={ticket.comments}
              history={ticket.history}
              createdAt={ticket.createdAt}
            />
          </div>

          {/* Reply Form */}
          {!isTicketClosed && (
            <div className="bg-card rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Add Reply</h2>
              <TicketReplyForm
                ticketId={ticket.id}
                onCommentAdded={fetchTicket}
              />
            </div>
          )}

          {isTicketClosed && (
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
              <p className="text-muted-foreground">
                This ticket has been {ticket.status.toLowerCase()}.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Details</h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
              </div>

              {ticket.dueDate && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{formatDate(ticket.dueDate)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Legend */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="font-semibold mb-3">Status Guide</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Open - Awaiting review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>In Progress - Being worked on</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>On Hold - Waiting for info</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Resolved - Issue fixed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span>Closed - Ticket completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

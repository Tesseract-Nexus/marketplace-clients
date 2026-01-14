'use client';

import { motion } from 'framer-motion';
import { MessageSquare, User, Check, Clock, AlertCircle, ArrowUp, XCircle } from 'lucide-react';
import { TicketComment, TicketHistoryEntry, TicketStatus } from '@/lib/api/tickets';
import { cn } from '@/lib/utils';

interface TimelineEntry {
  id: string;
  type: 'comment' | 'status_change' | 'created' | 'escalated';
  content: string;
  userName?: string;
  userId?: string;
  timestamp: string;
  metadata?: {
    oldStatus?: string;
    newStatus?: string;
  };
}

interface TicketTimelineProps {
  comments?: TicketComment[];
  history?: TicketHistoryEntry[];
  createdAt: string;
}

export function TicketTimeline({ comments = [], history = [], createdAt }: TicketTimelineProps) {
  // Combine comments and history into a unified timeline
  const entries: TimelineEntry[] = [];

  // Add creation entry
  entries.push({
    id: 'created',
    type: 'created',
    content: 'Ticket created',
    timestamp: createdAt,
  });

  // Convert comments from object to array if needed (backend stores as JSONB object)
  const commentsArray: TicketComment[] = Array.isArray(comments)
    ? comments
    : Object.values(comments || {}) as TicketComment[];

  // Add comments
  commentsArray.forEach(comment => {
    if (!comment.isInternal) {
      entries.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        content: comment.content,
        userName: comment.userName,
        userId: comment.userId,
        timestamp: comment.createdAt,
      });
    }
  });

  // Add history events (status changes, escalations)
  history.forEach(event => {
    if (event.action === 'STATUS_CHANGE' && event.field === 'status') {
      entries.push({
        id: `history-${event.id}`,
        type: event.newValue === 'ESCALATED' ? 'escalated' : 'status_change',
        content: `Status changed to ${formatStatusDisplay(event.newValue as TicketStatus)}`,
        userId: event.userId,
        timestamp: event.timestamp,
        metadata: {
          oldStatus: event.oldValue,
          newStatus: event.newValue,
        },
      });
    }
  });

  // Sort by timestamp (oldest first for chronological display)
  entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const getIcon = (type: TimelineEntry['type'], status?: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'created':
        return <Clock className="h-4 w-4" />;
      case 'escalated':
        return <ArrowUp className="h-4 w-4" />;
      case 'status_change':
        if (status === 'RESOLVED' || status === 'CLOSED') {
          return <Check className="h-4 w-4" />;
        }
        if (status === 'CANCELLED') {
          return <XCircle className="h-4 w-4" />;
        }
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getIconBg = (type: TimelineEntry['type'], status?: string) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-500';
      case 'created':
        return 'bg-gray-500';
      case 'escalated':
        return 'bg-purple-500';
      case 'status_change':
        if (status === 'RESOLVED' || status === 'CLOSED') {
          return 'bg-green-500';
        }
        if (status === 'CANCELLED') {
          return 'bg-red-500';
        }
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative pl-8 pb-6 last:pb-0"
        >
          {/* Connecting line */}
          {index < entries.length - 1 && (
            <div className="absolute left-[15px] top-8 w-0.5 h-[calc(100%-16px)] bg-border" />
          )}

          {/* Icon */}
          <div className={cn(
            'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-white',
            getIconBg(entry.type, entry.metadata?.newStatus)
          )}>
            {getIcon(entry.type, entry.metadata?.newStatus)}
          </div>

          {/* Content */}
          <div className="ml-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {entry.userName && (
                <>
                  <span className="font-medium text-foreground">{entry.userName}</span>
                  <span>&bull;</span>
                </>
              )}
              <span>{formatDate(entry.timestamp)}</span>
            </div>

            {entry.type === 'comment' ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
              </div>
            ) : (
              <p className="text-sm font-medium">{entry.content}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function formatStatusDisplay(status: TicketStatus): string {
  switch (status) {
    case 'OPEN':
      return 'Open';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'ON_HOLD':
      return 'On Hold';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    case 'REOPENED':
      return 'Reopened';
    case 'CANCELLED':
      return 'Cancelled';
    case 'PENDING_APPROVAL':
      return 'Pending Approval';
    case 'ESCALATED':
      return 'Escalated';
    default:
      return status;
  }
}

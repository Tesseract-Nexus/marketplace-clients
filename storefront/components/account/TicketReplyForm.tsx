'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTenant } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import { addTicketComment } from '@/lib/api/tickets';

interface TicketReplyFormProps {
  ticketId: string;
  onCommentAdded: () => void;
  disabled?: boolean;
}

export function TicketReplyForm({ ticketId, onCommentAdded, disabled = false }: TicketReplyFormProps) {
  const { tenant } = useTenant();
  const { accessToken, customer } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !tenant || !accessToken || disabled) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const customerName = customer
        ? `${customer.firstName} ${customer.lastName}`.trim()
        : undefined;

      await addTicketComment(
        tenant.id,
        tenant.storefrontId,
        accessToken,
        ticketId,
        content.trim(),
        customer?.id,
        customerName
      );
      setContent('');
      onCommentAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write your reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting || disabled}
        rows={3}
        className="resize-none"
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-red-600"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!content.trim() || isSubmitting || disabled}
          className="btn-tenant-primary"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Reply
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

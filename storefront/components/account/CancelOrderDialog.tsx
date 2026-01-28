'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, XCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant } from '@/context/TenantContext';
import { cancelOrder, CancellationReason } from '@/lib/api/checkout';
import {
  getCancellationPolicy,
  calculateCancellationFee,
  type CancellationPolicy,
  type CancellationFeeResult,
} from '@/lib/api/cancellation';

interface CancelOrderDialogProps {
  orderId: string;
  orderNumber?: string;
  orderTotal?: number;
  orderCreatedAt?: string;
  orderStatus?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}

const cancellationReasons: { value: CancellationReason; label: string }[] = [
  { value: 'CHANGED_MIND', label: 'I changed my mind' },
  { value: 'FOUND_BETTER_PRICE', label: 'Found a better price elsewhere' },
  { value: 'ORDERED_BY_MISTAKE', label: 'Ordered by mistake' },
  { value: 'SHIPPING_TOO_SLOW', label: 'Shipping is taking too long' },
  { value: 'PAYMENT_ISSUE', label: 'Payment issue' },
  { value: 'OTHER', label: 'Other reason' },
];

export function CancelOrderDialog({
  orderId,
  orderNumber,
  orderTotal,
  orderCreatedAt,
  orderStatus,
  open,
  onOpenChange,
  onCancelled,
}: CancelOrderDialogProps) {
  const { tenant } = useTenant();
  const [reason, setReason] = useState<CancellationReason | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [feeResult, setFeeResult] = useState<CancellationFeeResult | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);

  // Fetch cancellation policy when dialog opens
  useEffect(() => {
    if (open && tenant?.id && tenant?.storefrontId) {
      setLoadingPolicy(true);
      getCancellationPolicy(tenant.storefrontId, tenant.id)
        .then((p) => {
          setPolicy(p);
          if (p && orderTotal != null && orderCreatedAt) {
            setFeeResult(calculateCancellationFee(p, orderTotal, orderCreatedAt, orderStatus));
          } else {
            setFeeResult(null);
          }
        })
        .finally(() => setLoadingPolicy(false));
    }
  }, [open, tenant?.id, tenant?.storefrontId, orderTotal, orderCreatedAt, orderStatus]);

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for cancellation');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await cancelOrder(
        tenant?.id || '',
        tenant?.storefrontId || '',
        orderId,
        {
          reason,
          notes: notes.trim() || undefined,
        }
      );

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        onCancelled?.();
        // Reset state after close
        setTimeout(() => {
          setSuccess(false);
          setReason('');
          setNotes('');
        }, 300);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setError('');
      setReason('');
      setNotes('');
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
              >
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <h3 className="text-lg font-semibold">Order Cancelled</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your order has been successfully cancelled.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <DialogTitle>Cancel Order</DialogTitle>
                    <DialogDescription>
                      {orderNumber ? `Order ${orderNumber}` : 'Are you sure you want to cancel this order?'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for cancellation *</Label>
                  <Select
                    value={reason}
                    onValueChange={(value) => setReason(value as CancellationReason)}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {cancellationReasons.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tell us more about why you're cancelling..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {loadingPolicy ? (
                  <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading cancellation policy...</span>
                  </div>
                ) : feeResult && !feeResult.canCancel ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Cannot cancel:</strong> {feeResult.description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {feeResult && (
                      <div className={`p-3 rounded-lg border ${feeResult.fee === 0 ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'}`}>
                        <p className={`text-sm font-medium ${feeResult.fee === 0 ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                          {feeResult.fee === 0
                            ? 'Free cancellation'
                            : `Cancellation fee: $${feeResult.fee.toFixed(2)} (${feeResult.feePercent}%)`}
                        </p>
                        {feeResult.description && (
                          <p className={`text-xs mt-1 ${feeResult.fee === 0 ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {feeResult.description}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Note:</strong> Once cancelled, this action cannot be undone.
                        {policy?.policyText ? ` ${policy.policyText}` : ' If you\'ve already been charged, a refund will be initiated.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Keep Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={isLoading || !reason || (feeResult != null && !feeResult.canCancel)}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Cancel Order
                    </>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

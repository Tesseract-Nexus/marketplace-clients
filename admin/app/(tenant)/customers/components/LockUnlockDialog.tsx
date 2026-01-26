'use client';

import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { customerService } from '@/lib/services/customerService';
import { useToast } from '@/contexts/ToastContext';
import type { Customer } from '@/lib/api/types';

interface LockUnlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  action: 'lock' | 'unlock';
  onSuccess: (customer: Customer) => void;
}

export function LockUnlockDialog({
  isOpen,
  onClose,
  customer,
  action,
  onSuccess,
}: LockUnlockDialogProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const isLock = action === 'lock';
  const minReasonLength = 10;
  const isReasonValid = reason.trim().length >= minReasonLength;

  const handleSubmit = async () => {
    if (!isReasonValid) {
      setError(`Reason must be at least ${minReasonLength} characters`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = isLock
        ? await customerService.lockCustomer(customer.id, reason.trim())
        : await customerService.unlockCustomer(customer.id, reason.trim());

      if (response.success && response.data) {
        toast.success(
          isLock ? 'Account Locked' : 'Account Unlocked',
          isLock
            ? `${customer.firstName} ${customer.lastName}'s account has been locked.`
            : `${customer.firstName} ${customer.lastName}'s account has been unlocked.`
        );
        onSuccess(response.data);
        handleClose();
      } else {
        const errorMsg = (response as any).error?.message || `Failed to ${action} customer`;
        setError(errorMsg);
        toast.error(`Failed to ${action} account`, errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Failed to ${action} customer`;
      setError(errorMsg);
      toast.error(`Failed to ${action} account`, errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-lg shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  isLock ? 'bg-error-muted' : 'bg-success-muted'
                )}
              >
                {isLock ? (
                  <Lock className="w-6 h-6 text-error" />
                ) : (
                  <Unlock className="w-6 h-6 text-success" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isLock ? 'Lock Customer Account' : 'Unlock Customer Account'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {customer.firstName} {customer.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Customer Info */}
          <div className="px-6 py-4 bg-muted/50 border-b border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium text-foreground truncate">{customer.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Current Status:</span>
                <p
                  className={cn(
                    'font-semibold',
                    customer.status === 'ACTIVE' && 'text-success',
                    customer.status === 'BLOCKED' && 'text-error',
                    customer.status === 'INACTIVE' && 'text-warning'
                  )}
                >
                  {customer.status}
                </p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="px-6 py-4">
            <div
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg',
                isLock ? 'bg-error-muted' : 'bg-success-muted'
              )}
            >
              <AlertTriangle
                className={cn('w-5 h-5 flex-shrink-0 mt-0.5', isLock ? 'text-error' : 'text-success')}
              />
              <div className={cn('text-sm', isLock ? 'text-error' : 'text-success')}>
                {isLock ? (
                  <>
                    <p className="font-semibold mb-1">This action will:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                      <li>Block the customer from accessing their account</li>
                      <li>Prevent them from placing new orders</li>
                      <li>Send them a notification email about the lock</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-semibold mb-1">This action will:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                      <li>Restore the customer's access to their account</li>
                      <li>Allow them to place orders again</li>
                      <li>Send them a notification email about the unlock</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div className="px-6 pb-4">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Reason <span className="text-error">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder={
                isLock
                  ? 'e.g., Suspicious activity detected - multiple failed payment attempts'
                  : 'e.g., Issue resolved - verified identity via phone call'
              }
              className={cn(
                'w-full px-3 py-2 border rounded-lg bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                error
                  ? 'border-error focus:ring-error/50'
                  : 'border-border focus:border-primary focus:ring-primary/50'
              )}
              rows={4}
              disabled={isLoading}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <p
                className={cn(
                  'text-xs',
                  reason.trim().length < minReasonLength ? 'text-muted-foreground' : 'text-success'
                )}
              >
                {reason.trim().length}/{minReasonLength} characters minimum
              </p>
              {error && <p className="text-xs text-error">{error}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2 border-t border-border">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isReasonValid || isLoading}
              className={cn(
                isLock
                  ? 'bg-error hover:bg-error/90 text-white'
                  : 'bg-success hover:bg-success/90 text-white'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLock ? 'Locking...' : 'Unlocking...'}
                </>
              ) : (
                <>
                  {isLock ? (
                    <Lock className="w-4 h-4 mr-2" />
                  ) : (
                    <Unlock className="w-4 h-4 mr-2" />
                  )}
                  {isLock ? 'Lock Account' : 'Unlock Account'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

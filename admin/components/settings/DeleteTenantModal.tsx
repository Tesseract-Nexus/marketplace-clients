'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Loader2,
  X,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { tenantService } from '@/lib/services/tenantService';

interface DeleteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  onDeleted: () => void;
}

type Step = 'warning' | 'confirm' | 'processing' | 'success';

export function DeleteTenantModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  tenantSlug,
  onDeleted,
}: DeleteTenantModalProps) {
  const [step, setStep] = useState<Step>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedConfirmation = `DELETE ${tenantSlug}`;
  const isConfirmationValid = confirmationText === expectedConfirmation;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('warning');
      setConfirmationText('');
      setReason('');
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleProceedToConfirm = () => {
    setStep('confirm');
  };

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      setError(`Please type "${expectedConfirmation}" to confirm`);
      return;
    }

    setIsDeleting(true);
    setError('');
    setStep('processing');

    try {
      await tenantService.deleteTenant(tenantId, confirmationText, reason);
      setStep('success');

      // Wait a moment then redirect
      setTimeout(() => {
        onDeleted();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tenant');
      setStep('confirm');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (step === 'processing') return; // Don't allow closing during deletion
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 ${step === 'success' ? 'bg-success' : 'bg-destructive'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {step === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <Trash2 className="h-5 w-5 text-white" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white">
                {step === 'success' ? 'Tenant Deleted' : 'Delete Tenant'}
              </h3>
            </div>
            {step !== 'processing' && step !== 'success' && (
              <button
                onClick={handleClose}
                className="p-2.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'warning' && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive mb-1">
                    This action is permanent and cannot be undone
                  </h4>
                  <p className="text-sm text-destructive">
                    Deleting <strong>{tenantName}</strong> will permanently remove:
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-foreground ml-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-destructive/100 rounded-full" />
                  All storefronts and their configurations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-destructive/100 rounded-full" />
                  All team member access and permissions
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-destructive/100 rounded-full" />
                  SSL certificates and DNS routing
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-destructive/100 rounded-full" />
                  All settings and customizations
                </li>
              </ul>

              <div className="p-3 bg-warning-muted border border-warning/30 rounded-lg">
                <p className="text-sm text-warning">
                  <strong>Note:</strong> Your data will be archived for audit purposes but cannot be restored.
                </p>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To confirm deletion, please type{' '}
                <code className="px-2 py-1 bg-muted rounded font-mono text-destructive">
                  {expectedConfirmation}
                </code>
              </p>

              <div>
                <Input
                  value={confirmationText}
                  onChange={(e) => {
                    setConfirmationText(e.target.value);
                    setError('');
                  }}
                  placeholder={expectedConfirmation}
                  className={`font-mono ${
                    confirmationText && !isConfirmationValid
                      ? 'border-destructive/30 focus:ring-red-500'
                      : isConfirmationValid
                      ? 'border-success/40 focus:ring-green-500'
                      : ''
                  }`}
                  autoFocus
                />
                {confirmationText && !isConfirmationValid && (
                  <p className="text-xs text-destructive mt-1">
                    Text doesn&apos;t match. Please type exactly: {expectedConfirmation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reason for deletion (optional)
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Business closure, Testing cleanup, etc."
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center">
              <Loader2 className="h-12 w-12 text-destructive animate-spin mx-auto mb-4" />
              <p className="text-foreground font-medium">Deleting tenant...</p>
              <p className="text-sm text-muted-foreground mt-1">
                This may take a few moments
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-foreground font-medium">
                Tenant deleted successfully
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Redirecting you to the welcome page...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'warning' || step === 'confirm') && (
          <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === 'warning' && (
              <Button
                onClick={handleProceedToConfirm}
                className="bg-destructive hover:bg-destructive text-white"
              >
                I understand, continue
              </Button>
            )}
            {step === 'confirm' && (
              <Button
                onClick={handleDelete}
                disabled={!isConfirmationValid || isDeleting}
                className="bg-destructive hover:bg-destructive text-white disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Tenant Permanently
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

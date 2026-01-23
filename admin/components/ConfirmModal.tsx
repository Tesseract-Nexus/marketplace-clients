"use client";

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
}

const variantStyles = {
  danger: {
    icon: XCircle,
    iconBg: 'bg-destructive',
    iconColor: 'text-destructive-foreground',
    headerBg: 'bg-destructive/5',
    confirmButton: 'bg-destructive hover:bg-destructive/90',
    borderColor: 'border-destructive/30',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning',
    iconColor: 'text-warning-foreground',
    headerBg: 'bg-warning/5',
    confirmButton: 'bg-warning hover:bg-warning/90 text-warning-foreground',
    borderColor: 'border-warning/30',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary',
    iconColor: 'text-primary-foreground',
    headerBg: 'bg-primary/5',
    confirmButton: 'bg-primary hover:bg-primary/90',
    borderColor: 'border-primary/30',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success',
    iconColor: 'text-success-foreground',
    headerBg: 'bg-success/5',
    confirmButton: 'bg-success hover:bg-success/90 text-success-foreground',
    borderColor: 'border-success/30',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirm action failed:', error);
      // Keep modal open on error so user can see something went wrong
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Icon */}
          <div className={cn(
            "flex flex-col items-center p-6 border-b rounded-t-2xl",
            styles.headerBg,
            styles.borderColor
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4",
              styles.iconBg
            )}>
              <Icon className={cn("w-8 h-8", styles.iconColor)} />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center">{title}</h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-muted-foreground text-center leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted transition-all font-semibold border-2 border-border hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-3 text-white rounded-md transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed",
                styles.confirmButton
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/80 hover:bg-white transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </>
  );
}

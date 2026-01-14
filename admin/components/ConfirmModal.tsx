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
    iconBg: 'from-red-500 to-pink-500',
    iconColor: 'text-white',
    headerGradient: 'from-red-50 to-pink-50',
    confirmButton: 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'from-amber-500 to-orange-500',
    iconColor: 'text-white',
    headerGradient: 'from-amber-50 to-orange-50',
    confirmButton: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
    borderColor: 'border-amber-200',
  },
  info: {
    icon: Info,
    iconBg: 'from-blue-500 to-violet-500',
    iconColor: 'text-white',
    headerGradient: 'from-blue-50 to-violet-50',
    confirmButton: 'from-blue-600 to-violet-600 hover:bg-primary/90',
    borderColor: 'border-primary/30',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'from-emerald-500 to-teal-500',
    iconColor: 'text-white',
    headerGradient: 'from-emerald-50 to-teal-50',
    confirmButton: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    borderColor: 'border-emerald-200',
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
            "flex flex-col items-center p-6 border-b bg-gradient-to-br rounded-t-2xl",
            styles.headerGradient,
            styles.borderColor
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg mb-4",
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
              className="flex-1 px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted transition-all font-semibold border-2 border-border hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 px-4 py-3 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl bg-gradient-to-r disabled:opacity-50 disabled:cursor-not-allowed",
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

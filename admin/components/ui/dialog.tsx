'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Radix UI Dialog components for composable dialogs
const DialogRoot = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-muted data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Export Dialog as alias for DialogRoot (shadcn/ui convention)
const Dialog = DialogRoot;

export {
  Dialog,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

// Legacy AlertDialog component for simple alert/confirm dialogs
export interface AlertDialogLegacyProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function AlertDialogLegacy({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: AlertDialogLegacyProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const isConfirmDialog = type === 'confirm';

  const iconConfig = {
    success: { Icon: CheckCircle, color: 'text-success', bgColor: 'bg-success-muted' },
    error: { Icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    warning: { Icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    info: { Icon: Info, color: 'text-primary', bgColor: 'bg-primary/20' },
    confirm: { Icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  };

  const { Icon, color, bgColor } = iconConfig[type];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', bgColor)}>
                <Icon className={cn('w-6 h-6', color)} />
              </div>
              <h2 className="text-xl font-bold text-foreground">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <p className="text-muted-foreground leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">
            {isConfirmDialog && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-semibold text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={cn(
                'px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg',
                type === 'success' && 'bg-gradient-to-r from-green-600 to-emerald-600',
                type === 'error' && 'bg-gradient-to-r from-red-600 to-rose-600',
                type === 'warning' && 'bg-gradient-to-r from-yellow-600 to-orange-600',
                type === 'info' && 'bg-gradient-to-r from-blue-600 to-indigo-600',
                type === 'confirm' && 'bg-gradient-to-r from-orange-600 to-red-600'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { AlertDialogLegacy, AlertDialogLegacyProps } from '@/components/ui/dialog';

interface DialogConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showAlert: (config: DialogConfig) => void;
  showConfirm: (config: Omit<DialogConfig, 'type'>) => Promise<boolean>;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogConfig, setDialogConfig] = useState<(DialogConfig & { isOpen: boolean }) | null>(null);
  const [confirmResolver, setConfirmResolver] = useState<((value: boolean) => void) | null>(null);

  const closeDialog = useCallback(() => {
    setDialogConfig(null);
    setConfirmResolver(null);
  }, []);

  const showAlert = useCallback((config: DialogConfig) => {
    setDialogConfig({ ...config, isOpen: true });
  }, []);

  const showConfirm = useCallback((config: Omit<DialogConfig, 'type'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogConfig({ ...config, type: 'confirm', isOpen: true });
      setConfirmResolver(() => resolve);
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    setDialogConfig({ title, message, type: 'success', isOpen: true });
  }, []);

  const showError = useCallback((title: string, message: string) => {
    setDialogConfig({ title, message, type: 'error', isOpen: true });
  }, []);

  const showWarning = useCallback((title: string, message: string) => {
    setDialogConfig({ title, message, type: 'warning', isOpen: true });
  }, []);

  const showInfo = useCallback((title: string, message: string) => {
    setDialogConfig({ title, message, type: 'info', isOpen: true });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmResolver) {
      confirmResolver(true);
    }
    dialogConfig?.onConfirm?.();
    closeDialog();
  }, [confirmResolver, dialogConfig, closeDialog]);

  const handleCancel = useCallback(() => {
    if (confirmResolver) {
      confirmResolver(false);
    }
    dialogConfig?.onCancel?.();
    closeDialog();
  }, [confirmResolver, dialogConfig, closeDialog]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }), [showAlert, showConfirm, showSuccess, showError, showWarning, showInfo]);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogConfig && (
        <AlertDialogLegacy
          isOpen={dialogConfig.isOpen}
          onClose={closeDialog}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          confirmLabel={dialogConfig.confirmLabel}
          cancelLabel={dialogConfig.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
